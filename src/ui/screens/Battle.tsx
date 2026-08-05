import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { ElementId, GameEvent, SimState } from "../../game/types";
import { CELL, WORLD_H, WORLD_W, inBounds, worldToCell } from "../../game/layout";
import { GameLoop, getSimState, type RendererLike, type SimEngine } from "../../state/loop";
import { initReplay } from "../../state/replay";
import { useStore, type SpeedOption } from "../../state/store";
import { CrashPanel } from "../CrashPanel";
import { InterwaveOverlay } from "../components/InterwaveOverlay";
import { MageCard, type MageCardState } from "../components/MageCard";
import { TopBar } from "../components/TopBar";
import { TowerPanel } from "../components/TowerPanel";
import { MAGE_FIXTURES } from "../data/mageFixtures";

const SPEED_CYCLE: readonly SpeedOption[] = [1, 1.5, 2, 4];
const ELEMENT_ORDER: readonly ElementId[] = ["fire", "ice", "lightning", "wind"];
const CARD_COOLDOWN_MS = 350;

export type BattleProps = {
  engine: SimEngine;
  renderer: RendererLike;
  createInitialState: (stageId: string, totalWaves: number, seed: number) => SimState;
  /** Ref-callback used by App to construct the renderer adapter on mount. */
  canvasRef?: (canvas: HTMLCanvasElement | null) => void;
};

/**
 * The battle screen. Owns the GameLoop for the lifetime of the mount, syncs a THROTTLED
 * snapshot of mana/wave/kills/leaks into the coarse store (never SimState itself — see
 * src/state/store.ts), and reads the 60Hz SimState ref only for one-off, event-driven
 * things (click hit-testing), never as a React subscription.
 */
export function Battle({ engine, renderer, createInitialState, canvasRef: appCanvasRef }: BattleProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const loopRef = useRef<GameLoop | null>(null);
  const dmgByElement = useRef<Record<ElementId, number>>({ fire: 0, ice: 0, lightning: 0, wind: 0 });
  const [cardCooldownUntil, setCardCooldownUntil] = useState<Partial<Record<ElementId, number>>>({});
  const [crashError, setCrashError] = useState<unknown>(null);
  const [interwaveRemaining, setInterwaveRemaining] = useState(0);
  const interwaveTotalRef = useRef(0);

  const {
    activeStageId,
    totalWaves,
    battlePhase,
    wave,
    kills,
    mana,
    selectedElement,
    selectedTowerId,
    keyboardCursor,
    firstRunHintActive,
    settings,
    setBattlePhase,
    setWave,
    setKills,
    setMana,
    setLeaks,
    selectElement,
    selectTower,
    setKeyboardCursor,
    clearFirstRunHint,
    showResults,
    recordStageStars,
  } = useStore();

  const currentTower =
    selectedTowerId != null ? getSimState()?.towers.find((t) => t.id === selectedTowerId) ?? null : null;

  function handleEvents(events: GameEvent[]) {
    for (const ev of events) {
      if (ev.t === "hit") {
        dmgByElement.current[ev.el] += ev.damage;
      } else if (ev.t === "placed") {
        clearFirstRunHint();
        setCardCooldownUntil((prev) => ({ ...prev, [ev.el]: Date.now() + CARD_COOLDOWN_MS }));
      } else if (ev.t === "victory" || ev.t === "defeat") {
        const totals = dmgByElement.current;
        const totalDmg = totals.fire + totals.ice + totals.lightning + totals.wind;
        let mvp: ElementId | null = null;
        let mvpDmg = 0;
        for (const el of ELEMENT_ORDER) {
          if (totals[el] > mvpDmg) {
            mvpDmg = totals[el];
            mvp = el;
          }
        }
        const stageId = activeStageId ?? "";
        const stars = ev.t === "victory" ? ev.stars : 0;
        const prevBest = useStore.getState().stageStars[stageId] ?? -1;
        showResults({
          outcome: ev.t,
          stageId,
          wave: ev.t === "victory" ? totalWaves : ev.wave,
          totalWaves,
          stars,
          leaksRemaining: Math.max(0, 3 - (getSimState()?.leaks ?? 0)),
          elapsed: ev.t === "victory" ? ev.elapsed : (getSimState()?.elapsed ?? 0),
          mvpElement: mvp,
          mvpDamageSharePct: totalDmg > 0 ? Math.round((mvpDmg / totalDmg) * 100) : 0,
          leakerKind: ev.t === "defeat" ? ev.killer : null,
          isPersonalBest: ev.t === "victory" ? stars > prevBest : false,
        });
        if (ev.t === "victory") recordStageStars(stageId, stars);
        loopRef.current?.stop();
      }
    }
  }

  // ---- mount / unmount: own the loop and the throttled coarse-state sync ----
  useEffect(() => {
    if (!canvasRef.current || !activeStageId) return;
    const canvas = canvasRef.current;
    canvas.width = WORLD_W * 2;
    canvas.height = WORLD_H * 2;

    const loop = new GameLoop(engine, renderer, {
      onEvents: handleEvents,
      onPhaseChange: setBattlePhase,
      onCrash: setCrashError,
    });
    loopRef.current = loop;
    dmgByElement.current = { fire: 0, ice: 0, lightning: 0, wind: 0 };

    const seed = (Date.now() ^ (Math.floor(performance.timeOrigin) >>> 0)) >>> 0;
    initReplay(seed, activeStageId);
    const initial = createInitialState(activeStageId, totalWaves, seed);
    loop.start(initial);
    loop.setSpeed(settings.speed);

    const syncInterval = window.setInterval(() => {
      const s = getSimState();
      if (!s) return;
      setWave(s.wave + 1);
      setKills(s.kills);
      setMana(s.mana, s.manaCap);
      setLeaks(s.leaks);
      if (s.phase === "interwave") setInterwaveRemaining(s.interwaveTimer);
    }, 120);

    return () => {
      window.clearInterval(syncInterval);
      loop.destroy();
      loopRef.current = null;
    };
    // Intentionally scoped to activeStageId only: this effect owns the loop's whole
    // lifecycle (mount -> start -> destroy on unmount/stage change), not per-render sync.
  }, [activeStageId]);

  // keep the loop's speed in sync with settings without restarting the battle
  useEffect(() => {
    loopRef.current?.setSpeed(settings.speed);
  }, [settings.speed]);

  // capture the countdown's starting value once, when interwave begins, so the ring
  // has a stable denominator instead of resetting its "total" every throttled sync
  useEffect(() => {
    if (battlePhase === "interwave") {
      const s = getSimState();
      interwaveTotalRef.current = s?.interwaveTimer ?? 0;
      setInterwaveRemaining(s?.interwaveTimer ?? 0);
    }
  }, [battlePhase]);

  // push discrete selection + a11y state into the loop for render/ to read at 60Hz
  useEffect(() => {
    loopRef.current?.setUiState({
      selectedElement,
      selectedTowerId,
      reducedMotion: settings.reducedMotion,
      showFirstRunHint: firstRunHintActive,
      keyboardCursor,
    });
  }, [selectedElement, selectedTowerId, settings.reducedMotion, firstRunHintActive, keyboardCursor]);

  // ---- keyboard placement: 1-4 select, arrows move cursor, Enter places, Esc deselects ----
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (battlePhase === "crashed") return;
      if (e.key >= "1" && e.key <= "4") {
        const el = ELEMENT_ORDER[Number(e.key) - 1];
        if (el) selectElement(el);
        return;
      }
      if (e.key === "Escape") {
        selectElement(null);
        selectTower(null);
        return;
      }
      const cols = Math.floor(WORLD_W / CELL);
      const rows = Math.floor(WORLD_H / CELL);
      const base = keyboardCursor ?? { x: 0, y: 0 };
      if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        const dx = e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : 0;
        const dy = e.key === "ArrowUp" ? -1 : e.key === "ArrowDown" ? 1 : 0;
        const next = {
          x: Math.max(0, Math.min(cols - 1, base.x + dx)),
          y: Math.max(0, Math.min(rows - 1, base.y + dy)),
        };
        setKeyboardCursor(next);
        return;
      }
      if (e.key === "Enter" && keyboardCursor && selectedElement) {
        loopRef.current?.dispatch({ t: "place", el: selectedElement, cell: keyboardCursor });
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [battlePhase, keyboardCursor, selectedElement, selectElement, selectTower, setKeyboardCursor]);

  function screenToWorld(e: ReactPointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * WORLD_W;
    const y = ((e.clientY - rect.top) / rect.height) * WORLD_H;
    return { x, y };
  }

  function onFieldPointerDown(e: ReactPointerEvent<HTMLCanvasElement>) {
    const { x, y } = screenToWorld(e);
    const cell = worldToCell(x, y);
    const s = getSimState();

    if (selectedElement) {
      if (inBounds(cell.x, cell.y)) {
        loopRef.current?.dispatch({ t: "place", el: selectedElement, cell });
      }
      return;
    }

    // hit-test an existing tower near the tap point
    const hit = s?.towers.find((t) => Math.hypot(t.pos.x - x, t.pos.y - y) <= CELL * 0.6);
    selectTower(hit ? hit.id : null);
  }

  function cycleSpeed() {
    const idx = SPEED_CYCLE.indexOf(settings.speed);
    const next = SPEED_CYCLE[(idx + 1) % SPEED_CYCLE.length] ?? 1;
    useStore.getState().setSpeed(next);
  }

  function togglePause() {
    const loop = loopRef.current;
    if (!loop) return;
    loop.setPaused(!loop.isPaused());
  }

  function cardStateFor(el: ElementId): MageCardState {
    if (selectedElement === el) return "selected";
    const cd = cardCooldownUntil[el];
    if (cd && cd > Date.now()) return "cooldown";
    return mana >= MAGE_FIXTURES[el].cost ? "affordable" : "unaffordable";
  }

  if (crashError) {
    return <CrashPanel error={crashError} />;
  }

  return (
    <>
      <TopBar
        wave={wave}
        totalWaves={totalWaves}
        kills={kills}
        speed={settings.speed}
        paused={battlePhase === "paused"}
        onCycleSpeed={cycleSpeed}
        onTogglePause={togglePause}
      />
      <div className="field">
        <canvas
          ref={(node) => {
            canvasRef.current = node;
            appCanvasRef?.(node);
          }}
          onPointerDown={onFieldPointerDown}
          role="application"
          aria-label="Battlefield. Use number keys 1 to 4 to select a mage, arrow keys to move the placement cursor, Enter to place, Escape to deselect."
        />
        {battlePhase === "interwave" && (
          <InterwaveOverlay
            nextWave={wave + 1}
            countdownSeconds={interwaveRemaining}
            countdownTotal={interwaveTotalRef.current}
            preview={[]}
            skipBonusMana={30}
            reducedMotion={settings.reducedMotion}
            onReady={() => loopRef.current?.dispatch({ t: "startWave" })}
            onSkip={() => loopRef.current?.dispatch({ t: "skipInterwave" })}
          />
        )}
        {firstRunHintActive && wave === 0 && battlePhase === "ready" && (
          <p className="hint-banner" aria-hidden="true">
            Tap a glowing socket to place your first mage
          </p>
        )}
      </div>
      <div className="bottom">
        {currentTower ? (
          <TowerPanel
            tower={{ towerId: currentTower.id, element: currentTower.el, tier: currentTower.tier }}
            mana={mana}
            onUpgrade={() => loopRef.current?.dispatch({ t: "upgrade", towerId: currentTower.id })}
            onSell={() => {
              loopRef.current?.dispatch({ t: "sell", towerId: currentTower.id });
              selectTower(null);
            }}
          />
        ) : (
          <div className="rail">
            {ELEMENT_ORDER.map((el, i) => (
              <MageCard
                key={el}
                mage={MAGE_FIXTURES[el]}
                cardState={cardStateFor(el)}
                hotkey={(i + 1) as 1 | 2 | 3 | 4}
                onSelect={() => selectElement(el)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
