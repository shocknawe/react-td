/**
 * Integration glue: bridges the loop's contracted `SimEngine` and `RendererLike`
 * interfaces (src/state/loop.ts) to the real signatures exported by game/sim.ts and
 * render/index.ts.
 *
 * The loop was authored against thin local interfaces so it could typecheck before
 * game/ and render/ existed; this module is the one place that knows the concrete shapes
 * of both. Keeping it isolated means loop.ts stays free of imports from game/ or render/.
 */
import type { Command, SimState, StageDef } from "../game/types";
import * as sim from "../game/sim";
import { buildPath, type Path } from "../game/path";
import { create as createRenderer, type Renderer, type RenderOpts } from "../render";
import type { RendererLike, SimEngine } from "./loop";

/** Build the SimEngine the loop drives: closes over the active StageDef + Path. */
export function makeSimEngine(stage: StageDef): SimEngine {
  const path: Path = buildPath(stage);
  return {
    step(state, _dt) {
      const events = sim.step(state, stage, path, _dt);
      return { state, events };
    },
    applyCommand(state, cmd: Command) {
      const events = sim.applyCommand(state, stage, path, cmd);
      return { state, events };
    },
  };
}

/** Create a fresh initial SimState for a stage id. */
export function createInitialState(stage: StageDef, seed: number): SimState {
  return sim.createSim(stage.id, stage, seed);
}

/**
 * Wrap render/'s Renderer (which takes `(state, alpha, events, opts)`) as a RendererLike
 * (which takes `(state, alpha, events, ui)`). The stage + reducedMotion come from the ui
 * argument plus the stage the adapter was built with.
 */
export function makeRendererAdapter(canvas: HTMLCanvasElement, stage: StageDef): {
  renderer: RendererLike;
  destroy(): void;
} {
  const inner: Renderer = createRenderer(canvas);

  const adapter: RendererLike = {
    render(state, alpha, events, ui) {
      const opts: RenderOpts = { stage, reducedMotion: ui.reducedMotion };
      inner.render(state, alpha, events, opts);
    },
  };

  return {
    renderer: adapter,
    destroy() {
      inner.destroy();
    },
  };
}