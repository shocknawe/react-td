/**
 * The COARSE zustand store — channel (b) of the two-channel architecture.
 *
 * This store holds ONLY discrete, low-frequency transitions: screen route, battle phase,
 * wave number, kills, a THROTTLED mana snapshot, leaks, the selected card element, the
 * selected tower's id (never the tower instance), settings, and save state. SimState
 * itself — enemies, towers, projectiles, positions — never enters this store. See
 * src/state/loop.ts for the 60Hz mutable ref that render/ reads instead.
 *
 * Putting SimState here would re-render the whole React tree every frame and drop the
 * game to ~20fps (PLAN.md Phase 3 #8). The mana NUMBER here is fine — it changes maybe a
 * few times a second and only drives mage-card afford/unafford styling; the smooth mana
 * BAR pixel animation is drawn on the canvas by render/.
 */
import { create } from "zustand";
import type { BattlePhase, ElementId, EnemyKind } from "../game/types";
import { loadSave, saveData, subscribeStorage, type SaveData, type Settings } from "./persist";

/** The discrete speed multipliers the loop can run at. */
export type SpeedOption = Settings["speed"];

export type Screen =
  | "title"
  | "stageSelect"
  | "battle"
  | "mageInfo"
  | "results"
  | "shop"
  | "inventory"
  | "quests"
  | "team";

export type ResultsSummary = {
  outcome: "victory" | "defeat";
  stageId: string;
  wave: number;
  totalWaves: number;
  stars: number;
  leaksRemaining: number;
  /** simulated seconds, NOT wall clock */
  elapsed: number;
  mvpElement: ElementId | null;
  mvpDamageSharePct: number;
  /** defeat only — the enemy kind that landed the final leak */
  leakerKind: EnemyKind | null;
  isPersonalBest: boolean;
};

type State = {
  // ---- route ----
  screen: Screen;

  // ---- battle (discrete only) ----
  activeStageId: string | null;
  totalWaves: number;
  battlePhase: BattlePhase;
  wave: number;
  kills: number;
  mana: number;
  manaCap: number;
  leaks: number;
  selectedElement: ElementId | null;
  selectedTowerId: number | null;
  keyboardCursor: { x: number; y: number } | null;
  firstRunHintActive: boolean;

  // ---- mage info route param ----
  infoMageElement: ElementId | null;

  // ---- results ----
  results: ResultsSummary | null;

  // ---- persisted progress ----
  stageStars: Record<string, number>;

  // ---- settings ----
  settings: Settings;
  saveDisabled: boolean;
  saveWarning: string | null;

  // ---- actions: routing ----
  goTo: (screen: Screen) => void;
  openMageInfo: (element: ElementId) => void;

  // ---- actions: battle lifecycle ----
  startBattle: (stageId: string, totalWaves: number, isFirstEverBattle: boolean) => void;
  setBattlePhase: (phase: BattlePhase) => void;
  setWave: (wave: number) => void;
  setKills: (kills: number) => void;
  setMana: (mana: number, manaCap: number) => void;
  setLeaks: (leaks: number) => void;
  clearFirstRunHint: () => void;

  // ---- actions: selection ----
  selectElement: (element: ElementId | null) => void;
  selectTower: (towerId: number | null) => void;
  setKeyboardCursor: (cursor: { x: number; y: number } | null) => void;

  // ---- actions: results + progress ----
  showResults: (summary: ResultsSummary) => void;
  recordStageStars: (stageId: string, stars: number) => void;

  // ---- actions: settings ----
  setSpeed: (speed: Settings["speed"]) => void;
  setReducedMotion: (value: boolean) => void;
};

function persistNow(get: () => State): void {
  const { stageStars, settings } = get();
  const payload: SaveData = { version: 1, stageStars, settings };
  const result = saveData(payload);
  useStore.setState({ saveDisabled: !result.ok, saveWarning: result.warning });
}

const initialLoad = loadSave();

export const useStore = create<State>((set, get) => ({
  screen: "title",

  activeStageId: null,
  totalWaves: 0,
  battlePhase: "ready",
  wave: 0,
  kills: 0,
  mana: 0,
  manaCap: 0,
  leaks: 0,
  selectedElement: null,
  selectedTowerId: null,
  keyboardCursor: null,
  firstRunHintActive: false,

  infoMageElement: null,

  results: null,

  stageStars: initialLoad.data.stageStars,

  settings: initialLoad.data.settings,
  saveDisabled: initialLoad.saveDisabled,
  saveWarning: initialLoad.warning,

  goTo: (screen) => set({ screen }),
  openMageInfo: (element) => set({ infoMageElement: element, screen: "mageInfo" }),

  startBattle: (stageId, totalWaves, isFirstEverBattle) =>
    set({
      screen: "battle",
      activeStageId: stageId,
      totalWaves,
      battlePhase: "ready",
      wave: 0,
      kills: 0,
      mana: 0,
      manaCap: 0,
      leaks: 0,
      selectedElement: null,
      selectedTowerId: null,
      keyboardCursor: null,
      firstRunHintActive: isFirstEverBattle,
      results: null,
    }),

  setBattlePhase: (phase) => set({ battlePhase: phase }),
  setWave: (wave) => set({ wave }),
  setKills: (kills) => set({ kills }),
  setMana: (mana, manaCap) => set({ mana, manaCap }),
  setLeaks: (leaks) => set({ leaks }),
  clearFirstRunHint: () => set({ firstRunHintActive: false }),

  selectElement: (element) =>
    set((s) => ({
      selectedElement: s.selectedElement === element ? null : element,
      // selecting a mage to place and inspecting a tower are mutually exclusive UI modes
      selectedTowerId: element ? null : s.selectedTowerId,
    })),
  // Selecting a tower always clears mage-card selection (the two are mutually exclusive
  // UI modes). Deselecting a tower (towerId === null) leaves any element selection alone.
  selectTower: (towerId) =>
    set((s) => ({
      selectedTowerId: towerId,
      selectedElement: towerId != null ? null : s.selectedElement,
    })),
  setKeyboardCursor: (cursor) => set({ keyboardCursor: cursor }),

  showResults: (summary) => set({ results: summary, screen: "results" }),
  recordStageStars: (stageId, stars) => {
    set((s) => ({
      stageStars: { ...s.stageStars, [stageId]: Math.max(s.stageStars[stageId] ?? 0, stars) },
    }));
    persistNow(get);
  },

  setSpeed: (speed) => {
    set((s) => ({ settings: { ...s.settings, speed } }));
    persistNow(get);
  },
  setReducedMotion: (value) => {
    set((s) => ({ settings: { ...s.settings, reducedMotion: value } }));
    persistNow(get);
  },
}));

/**
 * Cross-tab sync: another tab saved (e.g. finished a stage) — refresh stage stars +
 * settings here, but never mid-battle (persist.ts already guards this; isBattleActive
 * is re-checked here too so the guard is not solely load-bearing in one file).
 */
subscribeStorage(
  (data) => {
    useStore.setState({ stageStars: data.stageStars, settings: data.settings });
  },
  () => {
    const phase = useStore.getState().battlePhase;
    return phase === "running" || phase === "interwave" || phase === "paused";
  },
);
