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
import type { SimEngine } from "../state/loop";
import type { RendererFactory } from "./screens/Battle";
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

  // Engine is built from the StageDef and held in a ref keyed on stageId so a stage
  // change re-binds it. Battle reads it via props.
  //
  // The renderer is NOT built here, even though it also only depends on the StageDef —
  // it additionally needs a live <canvas>, which only exists once Battle has mounted.
  // An earlier version tried to build it here anyway, via a ref callback on Battle's
  // canvas, and gated Battle's very existence on that ref already being populated —
  // a deadlock (Battle can't mount without a renderer; the renderer can't exist without
  // Battle's canvas). Instead we hand Battle a *factory* closure and let it build its
  // own renderer once its canvas is guaranteed to exist (see Battle.tsx's mount effect).
  const engineRef = useRef<SimEngine | null>(null);
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

  // Handed to Battle as a prop; Battle calls this once its own canvas ref is populated
  // (guaranteed non-null by then) rather than the other way around.
  const createRendererFn: RendererFactory = useMemo(
    () => (canvas: HTMLCanvasElement) => {
      const stage = resolveStage(activeStageId ?? "");
      if (!stage) throw new Error(`App: unknown stage id "${activeStageId}"`);
      return makeRendererAdapter(canvas, stage);
    },
    [activeStageId],
  );

  return (
    <div className="app-shell">
      <div className="stage-frame" data-screen={screen}>
        {screen === "title" && <Title />}
        {screen === "stageSelect" && <StageSelect />}
        {screen === "battle" && activeStageId && engineRef.current && (
          <Battle
            key={battleKey}
            engine={engineRef.current}
            createRenderer={createRendererFn}
            createInitialState={createInitialStateFn}
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