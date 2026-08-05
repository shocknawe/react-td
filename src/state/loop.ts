/**
 * The rAF game loop — ported verbatim from the proven spec in design/scene.html (T31):
 *
 *   acc += Math.min(rawMs, 250) / 1000 * speed;
 *   let n = 0; const budget = Math.ceil(speed) * 4;
 *   while (acc >= DT) { step(DT); acc -= DT; if (++n >= budget) { acc = 0; break; } }
 *   render(acc / DT);
 *
 * The 250ms clamp is on the RAW dt, before the speed multiplier is applied — so a
 * background tab does not "catch up" through several simulated seconds on return. The
 * step budget scales with speed (`ceil(speed) * 4`) so x4 fast-forward gets a x4 budget;
 * a fixed budget would silently degrade fast-forward into slow motion once the sim has
 * more than a couple of steps' worth of work per frame.
 *
 * This module owns the ONE module-scoped mutable SimState ref — channel (a) of the
 * two-channel architecture mandated by CLAUDE.md and PLAN.md #8. render/ reads this
 * directly at 60Hz via getSimState(); it must never be pushed into zustand.
 *
 * game/ and src/render/ are contracted modules other agents own and that may not exist
 * yet while this file is authored. Rather than importing concrete paths that might not
 * resolve (breaking typecheck for everyone), this module is injected with thin local
 * interfaces (SimEngine, RendererLike) at construction time — see the "ASSUMPTIONS" note
 * at the bottom of this file for exactly what shape integration needs to provide.
 */
import type { BattlePhase, Command, GameEvent, SimState } from "../game/types";
import { DT } from "../game/types";
import { recordCommand } from "./replay";

// ---------------------------------------------------------------- boundary interfaces

/** Thin local stand-in for game/'s contracted `step` + `applyCommand` exports. */
export interface SimEngine {
  /** Advance the simulation by exactly DT seconds. Returns the next state and emitted events. */
  step(state: SimState, dt: number): { state: SimState; events: GameEvent[] };
  /** Validate + apply a player command (may emit a "rejected" event instead of mutating). */
  applyCommand(state: SimState, cmd: Command): { state: SimState; events: GameEvent[] };
}

/** Extra discrete context render/ needs that does not belong in SimState itself. */
export type RenderUiState = {
  selectedElement: string | null;
  selectedTowerId: number | null;
  reducedMotion: boolean;
  /** stage 1 / wave 1 only, cleared after the first placement — see CLAUDE.md task 7 */
  showFirstRunHint: boolean;
  /** keyboard-placement cursor (arrow keys), grid cell, or null when using pointer only */
  keyboardCursor: { x: number; y: number } | null;
};

/** Thin local stand-in for render/'s contracted Renderer export. */
export interface RendererLike {
  render(state: SimState, alpha: number, events: readonly GameEvent[], ui: RenderUiState): void;
}

export type LoopHandlers = {
  /** Fired with every event batch emitted by a step or a dispatched command. */
  onEvents?: (events: GameEvent[]) => void;
  /**
   * Fired whenever the phase the PLAYER perceives changes — either a real SimState.phase
   * transition, or a loop-level pause/resume (auto-pause on visibilitychange counts as a
   * phase change here even though it never touches SimState.phase).
   */
  onPhaseChange?: (phase: BattlePhase) => void;
  /** Fired once when the step/apply/render throws. The loop halts after this. */
  onCrash?: (error: unknown) => void;
};

// ---------------------------------------------------------------- the 60Hz ref

let current: SimState | null = null;
let stepIndex = 0;

/** The 60Hz mutable ref. render/ reads this directly; it must never enter zustand. */
export function getSimState(): SimState | null {
  return current;
}

export function getStepIndex(): number {
  return stepIndex;
}

// ---------------------------------------------------------------- the loop

export class GameLoop {
  private readonly engine: SimEngine;
  private readonly renderer: RendererLike;
  private readonly handlers: LoopHandlers;

  private acc = 0;
  private last = 0;
  private rafId: number | null = null;
  private speed = 1;
  private paused = false;
  private crashed = false;
  private lastNotifiedPhase: BattlePhase | null = null;
  /** Events emitted by steps/commands since the last render call. Flushed each frame. */
  private frameEvents: GameEvent[] = [];

  private uiState: RenderUiState = {
    selectedElement: null,
    selectedTowerId: null,
    reducedMotion: false,
    showFirstRunHint: false,
    keyboardCursor: null,
  };

  private readonly onVisibilityChange = () => {
    if (document.hidden && !this.paused) {
      this.paused = true;
      this.notifyPhase();
    }
  };

  constructor(engine: SimEngine, renderer: RendererLike, handlers: LoopHandlers = {}) {
    this.engine = engine;
    this.renderer = renderer;
    this.handlers = handlers;
    // visibilitychange, deliberately NOT blur: an occluded-but-focused window throttles
    // rAF without ever firing blur, so blur-based auto-pause silently fails to trigger.
    document.addEventListener("visibilitychange", this.onVisibilityChange);
  }

  start(initial: SimState): void {
    current = initial;
    stepIndex = 0;
    this.acc = 0;
    this.last = 0;
    this.crashed = false;
    this.paused = false;
    this.lastNotifiedPhase = null;
    if (this.rafId == null) this.rafId = requestAnimationFrame(this.frame);
    this.notifyPhase();
  }

  stop(): void {
    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /** Call once when the loop is discarded for good (unmount) — start()/stop() may be reused otherwise. */
  destroy(): void {
    this.stop();
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    current = null;
  }

  setSpeed(speed: number): void {
    this.speed = speed;
  }

  setPaused(paused: boolean): void {
    if (this.paused === paused) return;
    this.paused = paused;
    this.notifyPhase();
  }

  isPaused(): boolean {
    return this.paused;
  }

  setUiState(patch: Partial<RenderUiState>): void {
    this.uiState = { ...this.uiState, ...patch };
  }

  dispatch(cmd: Command): void {
    if (!current || this.crashed) return;
    try {
      const { state, events } = this.engine.applyCommand(current, cmd);
      current = state;
      recordCommand(stepIndex, cmd);
      if (events.length) {
        this.frameEvents.push(...events);
        this.handlers.onEvents?.(events);
      }
      this.notifyPhase();
    } catch (error) {
      this.crash(error);
    }
  }

  private readonly frame = (ts: number): void => {
    if (this.crashed) return;
    if (!this.last) this.last = ts;
    const rawMs = ts - this.last;
    this.last = ts;

    if (!this.paused && current) {
      try {
        this.acc += (Math.min(rawMs, 250) / 1000) * this.speed;
        let n = 0;
        const budget = Math.ceil(this.speed) * 4;
        while (this.acc >= DT) {
          const { state, events } = this.engine.step(current, DT);
          current = state;
          stepIndex++;
          this.acc -= DT;
          if (events.length) {
            this.frameEvents.push(...events);
            this.handlers.onEvents?.(events);
          }
          if (++n >= budget) {
            this.acc = 0;
            break;
          }
        }
        this.notifyPhase();
      } catch (error) {
        this.crash(error);
        return;
      }
    }

    if (current) {
      try {
        // Pass events emitted since the last frame so render/ can drive FX (bursts,
        // damage numbers, screenshake) without reaching into SimState. The events list
        // is reset every frame after render consumes it.
        this.renderer.render(current, this.acc / DT, this.frameEvents, this.uiState);
        this.frameEvents = [];
      } catch (error) {
        this.crash(error);
        return;
      }
    }

    this.rafId = requestAnimationFrame(this.frame);
  };

  private notifyPhase(): void {
    const phase: BattlePhase = this.crashed
      ? "crashed"
      : this.paused && current
        ? "paused"
        : (current?.phase ?? "ready");
    if (phase !== this.lastNotifiedPhase) {
      this.lastNotifiedPhase = phase;
      this.handlers.onPhaseChange?.(phase);
    }
  }

  private crash(error: unknown): void {
    this.crashed = true;
    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (current) current.phase = "crashed";
    console.warn("[loop] simulation crashed — transitioning to crashed phase", { error, stepIndex });
    this.lastNotifiedPhase = "crashed";
    this.handlers.onCrash?.(error);
    this.handlers.onPhaseChange?.("crashed");
  }
}

/*
 * ASSUMPTIONS about the game/ and render/ contracts (for integration once those land):
 *
 * - `game/sim.ts` (or similar) exports something matching SimEngine above:
 *     createSim(stageId: string, seed: number): SimState
 *     step(state, DT): { state, events }
 *     applyCommand(state, cmd): { state, events }
 *   step()/applyCommand() may mutate `state` in place and return the same reference, or
 *   return a new object — GameLoop treats the return value as authoritative either way.
 *
 * - `render/` exports something matching RendererLike above: a `render(state, alpha, ui)`
 *   call that draws the whole battlefield to a canvas it was given at construction,
 *   INCLUDING the mana bar (per CLAUDE.md: "the mana bar must stay smooth — it is drawn
 *   on the CANVAS by render/, not in React"). The `ui` argument carries the discrete,
 *   React-owned state render/ cannot get from SimState alone: which element/tower is
 *   selected (for the range-circle + magic-circle highlight), reducedMotion (to gate
 *   screenshake/vignette/cut-ins), and the first-run hint flag (to pulse one socket).
 */
