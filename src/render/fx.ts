/**
 * Projectiles (additive glow + short trail), impact bursts (expanding ring + spokes) and
 * floating damage numbers. Ported from design/scene.html's projectile/burst/number
 * drawing block, restructured to read `state.projectiles` (which already carries a
 * simulated `pos`, so no trail simulation happens here — only a bounded per-projectile
 * position history for the glow trail) and to be driven by GameEvent[] for bursts and
 * numbers rather than mutating shared arrays inside a step function.
 *
 * Particle pool (bursts + numbers combined) is hard-capped at PARTICLE_CAP so memory
 * stays flat under sustained fire.
 *
 * fx.ts is the one place in render/ that reads a wall clock (via the injectable `clock`,
 * defaulting to performance.now). That's fine — this module never touches SimState opts
 * beyond reading it, and game/'s purity ban on performance.now is scoped to src/game/
 * only (see eslint.config.js). Bursts, trails and damage-number flight are rendering
 * juice, not simulation, and animate at display refresh rather than the fixed sim tick.
 */
import type { ElementId, GameEvent, Projectile, Vec2 } from "../game/types";
import { ELEMENT_THEME } from "../ui/theme/elements";
import type { DigitAtlases } from "./glyphs";
import { drawNumber } from "./glyphs";

type Burst = { x: number; y: number; el: ElementId; big: boolean; t: number; life: number };
type DamageNumber = { x: number; y: number; value: number; el: ElementId; t: number; life: number };

const BURST_LIFE = 0.45;
const NUMBER_LIFE = 0.9;
const PARTICLE_CAP = 300;
const TRAIL_MAX = 6;
const SHAKE_DECAY_SEC = 0.25;
const MAX_FRAME_DT = 0.1; // clamp so a tab coming back from background doesn't jump-animate

export type FxOptions = { reducedMotion?: boolean };

export type Fx = {
  draw(
    ctx: CanvasRenderingContext2D,
    projectiles: readonly Projectile[],
    events: readonly GameEvent[],
    atlases: DigitAtlases,
    opts?: FxOptions,
  ): void;
  /** Current camera-shake offset in world units. Always {0,0} when reducedMotion is honoured. */
  shakeOffset(): Vec2;
  destroy(): void;
};

export function createFx(clock: () => number = () => performance.now()): Fx {
  let bursts: Burst[] = [];
  let numbers: DamageNumber[] = [];
  const trails = new Map<number, Vec2[]>();
  let lastTs: number | null = null;
  let shakeMag = 0;
  let shakeT = 0;

  function particleCount() {
    return bursts.length + numbers.length;
  }

  function trimToCap() {
    // Drop oldest-first; both arrays are already time-ordered by push order.
    while (particleCount() > PARTICLE_CAP) {
      if (bursts.length > 0) bursts.shift();
      else if (numbers.length > 0) numbers.shift();
      else break;
    }
  }

  function triggerShake(mag: number) {
    shakeMag = mag;
    shakeT = 0;
  }

  function ingestEvents(events: readonly GameEvent[], reducedMotion: boolean) {
    for (const ev of events) {
      if (ev.t === "hit") {
        bursts.push({ x: ev.pos.x, y: ev.pos.y, el: ev.el, big: false, t: 0, life: BURST_LIFE });
        numbers.push({ x: ev.pos.x, y: ev.pos.y, value: ev.damage, el: ev.el, t: 0, life: NUMBER_LIFE });
      } else if (ev.t === "kill") {
        bursts.push({ x: ev.pos.x, y: ev.pos.y, el: ev.el, big: true, t: 0, life: BURST_LIFE });
        if (ev.kind === "boss" && !reducedMotion) triggerShake(6);
      } else if (ev.t === "leak") {
        if (!reducedMotion) triggerShake(8);
      } else if (ev.t === "fire") {
        bursts.push({ x: ev.from.x, y: ev.from.y, el: ev.el, big: false, t: 0, life: BURST_LIFE * 0.4 });
      }
    }
    trimToCap();
  }

  function advance(dtSec: number) {
    for (const b of bursts) b.t += dtSec;
    for (const n of numbers) {
      n.t += dtSec;
      n.y -= 34 * dtSec;
    }
    bursts = bursts.filter((b) => b.t < b.life);
    numbers = numbers.filter((n) => n.t < n.life);

    if (shakeMag > 0) {
      shakeT += dtSec;
      if (shakeT >= SHAKE_DECAY_SEC) shakeMag = 0;
    }
  }

  function updateTrails(projectiles: readonly Projectile[]) {
    const live = new Set<number>();
    for (const p of projectiles) {
      live.add(p.id);
      let trail = trails.get(p.id);
      if (!trail) {
        trail = [];
        trails.set(p.id, trail);
      }
      const last = trail[trail.length - 1];
      if (!last || last.x !== p.pos.x || last.y !== p.pos.y) {
        trail.push({ x: p.pos.x, y: p.pos.y });
        if (trail.length > TRAIL_MAX) trail.shift();
      }
    }
    for (const id of trails.keys()) {
      if (!live.has(id)) trails.delete(id);
    }
  }

  function drawProjectiles(ctx: CanvasRenderingContext2D, projectiles: readonly Projectile[]) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const p of projectiles) {
      const theme = ELEMENT_THEME[p.el];
      const trail = trails.get(p.id);
      if (trail) {
        for (let i = 0; i < trail.length; i++) {
          const q = trail[i]!;
          const a = (i + 1) / trail.length;
          ctx.globalAlpha = a * 0.32;
          ctx.fillStyle = theme.base;
          ctx.beginPath();
          ctx.arc(q.x, q.y, 3 + a * 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      const grad = ctx.createRadialGradient(p.pos.x, p.pos.y, 0, p.pos.x, p.pos.y, 10);
      grad.addColorStop(0, theme.glow);
      grad.addColorStop(0.4, theme.base);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.pos.x, p.pos.y, 10, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawBursts(ctx: CanvasRenderingContext2D, reducedMotion: boolean) {
    ctx.save();
    for (const b of bursts) {
      const theme = ELEMENT_THEME[b.el];
      const k = b.t / b.life;
      const r = (b.big ? 34 : 20) * k;
      ctx.globalAlpha = (1 - k) * 0.95;
      ctx.strokeStyle = theme.glow;
      ctx.lineWidth = (b.big ? 5 : 3) * (1 - k);
      ctx.beginPath();
      ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
      ctx.stroke();

      if (!reducedMotion) {
        const n = b.big ? 10 : 6;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2 + (b.big ? 0.3 : 0);
          ctx.beginPath();
          ctx.moveTo(b.x + Math.cos(a) * r * 0.55, b.y + Math.sin(a) * r * 0.55);
          ctx.lineTo(b.x + Math.cos(a) * r * 1.15, b.y + Math.sin(a) * r * 1.15);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  function drawNumbers(ctx: CanvasRenderingContext2D, atlases: DigitAtlases) {
    for (const n of numbers) {
      const a = 1 - n.t / n.life;
      drawNumber(ctx, atlases, n.el, n.value, n.x, n.y, a);
    }
  }

  return {
    draw(ctx, projectiles, events, atlases, opts) {
      const reducedMotion = opts?.reducedMotion ?? false;
      const now = clock();
      const dtSec = lastTs === null ? 0 : Math.min(MAX_FRAME_DT, Math.max(0, (now - lastTs) / 1000));
      lastTs = now;

      ingestEvents(events, reducedMotion);
      advance(dtSec);
      updateTrails(projectiles);

      drawProjectiles(ctx, projectiles);
      drawBursts(ctx, reducedMotion);
      drawNumbers(ctx, atlases);
    },
    shakeOffset() {
      if (shakeMag <= 0) return { x: 0, y: 0 };
      const decay = Math.max(0, 1 - shakeT / SHAKE_DECAY_SEC);
      const mag = shakeMag * decay;
      return {
        x: (pseudoNoise(shakeT, 1) - 0.5) * 2 * mag,
        y: (pseudoNoise(shakeT, 2) - 0.5) * 2 * mag,
      };
    },
    destroy() {
      bursts = [];
      numbers = [];
      trails.clear();
      lastTs = null;
      shakeMag = 0;
    },
  };
}

/** Deterministic-enough jitter for screenshake — not simulation state, just juice. */
function pseudoNoise(t: number, seed: number): number {
  const x = Math.sin(t * 41.13 + seed * 7.77) * 43758.5453;
  return x - Math.floor(x);
}
