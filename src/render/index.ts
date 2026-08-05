/**
 * The render/ entry point. `create(canvas)` wires up every subsystem; `render(...)` draws
 * one frame of a SimState snapshot; `destroy()` tears the whole thing down. This is pure
 * output — it never mutates SimState and never imports from game/'s step logic, state/ or
 * ui/ (only types from game/ and the theme palette from ui/theme/).
 *
 * SimState (game/types.ts) carries a `stageId` but not the stage's path/socket geometry
 * itself — that lives in a StageDef, owned by data/ (not yet built alongside this
 * module). Rather than reach into data/ from render/, or have SimState carry render-only
 * geometry, the active StageDef is passed in per-call via `opts.stage`. Geometry is
 * derived from it once and cached by stage id, so passing the same stage every frame is
 * cheap.
 */
import type { GameEvent, SimState, StageDef } from "../game/types";
import { CELL, WORLD_H, WORLD_W } from "../game/layout";
import { attachResize, getContext2D, resize } from "./canvas";
import { drawCrystal } from "./crystal";
import { createDecals } from "./decals";
import { createEntities } from "./entities";
import type { FieldGeometry } from "./field";
import { buildFieldGeometry, createField } from "./field";
import { createFx } from "./fx";
import { buildDigitAtlases } from "./glyphs";

export type RenderOpts = {
  /** The stage the sim is currently running. Path/sockets are derived from this once. */
  stage: StageDef;
  /** When true: no screenshake, no burst spokes (see fx.ts). */
  reducedMotion?: boolean;
};

export type Renderer = {
  render(state: SimState, alpha: number, events: readonly GameEvent[], opts: RenderOpts): void;
  /** Re-measure and resize on demand — e.g. after the canvas is mounted, or a layout
   *  change a ResizeObserver could not see because the container was hidden. */
  resize(): void;
  destroy(): void;
};

export function create(canvas: HTMLCanvasElement): Renderer {
  const ctx = getContext2D(canvas);
  const field = createField();
  const decals = createDecals();
  const entities = createEntities();
  const fx = createFx();
  const atlases = buildDigitAtlases();

  let geometry: FieldGeometry | null = null;
  let geometryStageId: string | null = null;

  const initialContainer = canvas.parentElement;
  const detachResize = initialContainer ? attachResize(canvas, initialContainer) : null;

  function ensureGeometry(stage: StageDef): FieldGeometry {
    if (!geometry || geometryStageId !== stage.id) {
      geometry = buildFieldGeometry(stage);
      geometryStageId = stage.id;
    }
    return geometry;
  }

  return {
    render(state, alpha, events, opts) {
      // A 0-size backing store makes every draw call a silent no-op — bail rather than
      // spend the frame drawing nothing. canvas.ts's resize() already refuses to shrink
      // the backing store to 0, but guard here too in case something else touched it.
      if (canvas.width === 0 || canvas.height === 0) return;

      const geom = ensureGeometry(opts.stage);
      const reducedMotion = opts.reducedMotion ?? false;

      ctx.save();
      const shake = fx.shakeOffset();
      if (shake.x !== 0 || shake.y !== 0) ctx.translate(shake.x, shake.y);

      ctx.clearRect(0, 0, WORLD_W, WORLD_H);
      field.draw(ctx, geom);
      entities.drawTowers(ctx, state.towers, decals);
      entities.drawEnemies(ctx, state.enemies, geom, alpha);
      fx.draw(ctx, state.projectiles, events, atlases, { reducedMotion });

      const crystalPos = geom.path[geom.path.length - 1] ?? { x: WORLD_W / 2, y: WORLD_H - CELL };
      drawCrystal(ctx, crystalPos, state.leaks);

      ctx.restore();
    },
    resize() {
      const container = canvas.parentElement;
      if (container) resize(canvas, container);
    },
    destroy() {
      detachResize?.();
      entities.destroy();
      fx.destroy();
    },
  };
}
