/**
 * Root App component. Owns the screen router and the battle-time engine/renderer
 * adapters, which are built from the active StageDef on battle mount.
 *
 * The store is the single source of truth for the current screen; this component just
 * dispatches to the right screen. Battle's canvas/engine/renderer are created lazily —
 * only when the player enters a battle — so the rest of the app never pays for a canvas
 * context it isn't using.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import type { SimState, StageDef } from "../game/types";
import { getStage } from "../data";
import { createInitialState, makeRendererAdapter, makeSimEngine } from "../state/integration";
import type { RendererLike, SimEngine } from "../state/loop";
import { useStore } from "../state/store";
import { Battle } from "./screens/Battle";
import { MageInfo } from "./screens/MageInfo";
import { StageSelect } from "./screens/StageSelect";
import { Title } from "./screens/Title";
import { shellFor, Results } from "./screens/Shells";

/**
 * Session 1 ships one real StageDef (stage1). The node graph shows six nodes (1-1..1-6)
 * for visual coverage against the mockup; every playable node currently maps to STAGE1.
 * When more stages land, swap this mapping to a real lookup.
 */
function resolveStage(stageId: string): StageDef | undefined {
  // All fixture node ids resolve to stage1 for session 1.
  const real = getStage("stage1");
  if (!real) return undefined;
  // Preserve the fixture id on the returned copy so the sim's stageId matches what the
  // player picked — results screen and star recording key off this.
  return stageId === "stage1" ? real : { ...real, id: stageId };
}

export function App() {
  const screen = useStore((s) => s.screen);
  const activeStageId = useStore((s) => s.activeStageId);
  const settings = useStore((s) => s.settings);

  // Engine is built from the StageDef; renderer is built from the canvas, which only
  // exists once Battle is mounted. We hold the engine in a ref keyed on stageId so a
  // stage change re-binds it. Battle reads these via props.
  const engineRef = useRef<SimEngine | null>(null);
  const rendererRef = useRef<RendererLike | null>(null);
  const rendererDestroyRef = useRef<(() => void) | null>(null);
  const [battleKey, setBattleKey] = useState(0);

  // Rebuild the engine whenever the active stage id changes (start of a new battle).
  useEffect(() => {
    if (!activeStageId) {
      engineRef.current = null;
      return;
    }
    const stage = resolveStage(activeStageId);
    if (!stage) return;
    engineRef.current = makeSimEngine(stage);
    setBattleKey((k) => k + 1);
    return () => {
      // Tear down the renderer when leaving battle.
      rendererDestroyRef.current?.();
      rendererDestroyRef.current = null;
      rendererRef.current = null;
    };
  }, [activeStageId]);

  // Apply reduced-motion data attribute at the root so the CSS rule in index.css gates
  // every animation globally.
  useEffect(() => {
    document.documentElement.dataset.reducedMotion = String(settings.reducedMotion);
  }, [settings.reducedMotion]);

  const createInitialStateFn = useMemo(
    () =>
      (stageId: string, _totalWaves: number, seed: number): SimState => {
        const stage = resolveStage(stageId);
        if (!stage) throw new Error(`App: unknown stage id "${stageId}"`);
        return createInitialState(stage, seed);
      },
    [],
  );

  // A ref callback the Battle uses to hand back its canvas so we can build the renderer
  // on mount. We build the renderer here rather than inside Battle so Battle stays free
  // of integration knowledge.
  const attachCanvas = (canvas: HTMLCanvasElement | null) => {
    if (!canvas || !activeStageId) return;
    const stage = resolveStage(activeStageId);
    if (!stage) return;
    // Tear down any prior renderer bound to a previous canvas.
    rendererDestroyRef.current?.();
    const { renderer, destroy } = makeRendererAdapter(canvas, stage);
    rendererRef.current = renderer;
    rendererDestroyRef.current = destroy;
  };

  return (
    <div className="app-shell">
      <div className="stage-frame" data-screen={screen}>
        {screen === "title" && <Title />}
        {screen === "stageSelect" && <StageSelect />}
        {screen === "battle" && activeStageId && engineRef.current && rendererRef.current && (
          <Battle
            key={battleKey}
            engine={engineRef.current}
            renderer={rendererRef.current}
            createInitialState={createInitialStateFn}
            canvasRef={attachCanvas}
          />
        )}
        {screen === "mageInfo" && <MageInfo />}
        {screen === "results" && <Results />}
        {(screen === "shop" || screen === "inventory" || screen === "quests" || screen === "team") &&
          shellFor(screen)}
      </div>
    </div>
  );
}