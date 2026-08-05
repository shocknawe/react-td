/**
 * localStorage persistence — every rescue handled, every rescue logged.
 *
 * Keys are namespaced `reactd:v1:*` (PLAN.md Phase 3 S-a: GitHub Pages puts localStorage
 * on a shared origin; namespacing costs nothing and avoids collisions with any other
 * project hosted on the same origin).
 *
 * Rescue table (see PLAN.md Section 2):
 *   absent key              -> defaults, no warning (this is the normal first-visit path)
 *   malformed JSON          -> SyntaxError -> reset to defaults, console.warn
 *   unknown/future version  -> clean reset, console.warn (tested against v0 AND v99 —
 *                              "future" schema drift from a newer build is just as real
 *                              as stale data from an older one)
 *   QuotaExceededError      -> disable saving, KEEP PLAYING, surface "Progress won't save"
 *   SecurityError           -> same as above (Safari private mode)
 */

export const SAVE_VERSION = 1;
const KEY = "reactd:v1:save";

export type Settings = {
  speed: 1 | 1.5 | 2 | 4;
  reducedMotion: boolean;
};

export type SaveData = {
  version: typeof SAVE_VERSION;
  /** stageId -> stars earned (0-3), best result kept */
  stageStars: Record<string, number>;
  settings: Settings;
};

function prefersReducedMotion(): boolean {
  try {
    return typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;
  } catch {
    return false;
  }
}

function defaults(): SaveData {
  return {
    version: SAVE_VERSION,
    stageStars: {},
    settings: { speed: 1, reducedMotion: prefersReducedMotion() },
  };
}

export type LoadResult = {
  data: SaveData;
  /** true if saving is impossible for this session (quota / private-mode) */
  saveDisabled: boolean;
  /** message to surface in the UI, or null */
  warning: string | null;
};

function isDomException(error: unknown, name: string): boolean {
  return typeof error === "object" && error !== null && "name" in error &&
    (error as { name?: unknown }).name === name;
}

export function loadSave(): LoadResult {
  let raw: string | null;
  try {
    raw = localStorage.getItem(KEY);
  } catch (error) {
    console.warn("[persist] localStorage.getItem threw — saving disabled this session", {
      key: KEY,
      error,
    });
    return { data: defaults(), saveDisabled: true, warning: "Progress won't save" };
  }

  if (raw === null) {
    return { data: defaults(), saveDisabled: false, warning: null };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    console.warn("[persist] malformed JSON in save — resetting to defaults", {
      key: KEY,
      raw,
      error,
    });
    return { data: defaults(), saveDisabled: false, warning: null };
  }

  const version = typeof parsed === "object" && parsed !== null && "version" in parsed
    ? (parsed as { version?: unknown }).version
    : undefined;

  if (version !== SAVE_VERSION) {
    console.warn("[persist] unknown/future schema version — clean reset", {
      key: KEY,
      expected: SAVE_VERSION,
      found: version,
    });
    return { data: defaults(), saveDisabled: false, warning: null };
  }

  const data = parsed as Partial<SaveData>;
  const merged: SaveData = {
    version: SAVE_VERSION,
    stageStars: typeof data.stageStars === "object" && data.stageStars !== null ? data.stageStars : {},
    settings: {
      speed: data.settings?.speed ?? 1,
      reducedMotion: data.settings?.reducedMotion ?? prefersReducedMotion(),
    },
  };
  return { data: merged, saveDisabled: false, warning: null };
}

export type SaveResult = { ok: boolean; warning: string | null };

export function saveData(data: SaveData): SaveResult {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    return { ok: true, warning: null };
  } catch (error) {
    if (isDomException(error, "QuotaExceededError")) {
      console.warn("[persist] QuotaExceededError — saving disabled, gameplay continues", {
        key: KEY,
        error,
      });
      return { ok: false, warning: "Progress won't save" };
    }
    if (isDomException(error, "SecurityError")) {
      console.warn("[persist] SecurityError (private mode?) — saving disabled, gameplay continues", {
        key: KEY,
        error,
      });
      return { ok: false, warning: "Progress won't save" };
    }
    console.warn("[persist] unexpected error writing save — saving disabled, gameplay continues", {
      key: KEY,
      error,
    });
    return { ok: false, warning: "Progress won't save" };
  }
}

/**
 * Cross-tab sync. Fires on the `storage` event (only observed by OTHER tabs, per the
 * DOM spec) so a save made in tab B can refresh tab A's stage-select stars — but NEVER
 * mid-battle, where clobbering local coarse state would be jarring and pointless (the
 * battle's own result will overwrite it on completion anyway).
 */
export function subscribeStorage(
  onExternalChange: (data: SaveData) => void,
  isBattleActive: () => boolean,
): () => void {
  const handler = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    if (isBattleActive()) {
      console.warn("[persist] storage event ignored — battle in progress", { key: KEY });
      return;
    }
    if (!e.newValue) return;
    try {
      const parsed = JSON.parse(e.newValue) as Partial<SaveData>;
      if (parsed && typeof parsed === "object" && parsed.version === SAVE_VERSION) {
        onExternalChange(parsed as SaveData);
      } else {
        console.warn("[persist] cross-tab storage event had unexpected schema version, ignored", {
          key: KEY,
          version: parsed?.version,
        });
      }
    } catch (error) {
      console.warn("[persist] cross-tab storage event had malformed JSON, ignored", { key: KEY, error });
    }
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}
