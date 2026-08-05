/**
 * PLAN.md T5 — "one unit test per rescue row" for the persistence rescue table
 * documented at the top of persist.ts. Covers loadSave, saveData, and subscribeStorage;
 * render/canvas.ts's and CrashPanel's rescue rows are integration-level and not covered
 * here.
 *
 * environment is "node" (vitest.config.ts, to keep game/ honest), so `localStorage` and
 * `window` don't exist as ambient globals here either — each test installs the minimal
 * fake it needs on `globalThis` and every test cleans up in afterEach so nothing leaks
 * into another file's run.
 */
import { afterEach, describe, expect, it } from "vitest";
import { loadSave, saveData, subscribeStorage, type SaveData } from "./persist";

// Mirrors persist.ts's private KEY constant; not exported, so duplicated here.
const KEY = "reactd:v1:save";

class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  get length(): number {
    return this.map.size;
  }
  clear(): void {
    this.map.clear();
  }
  getItem(key: string): string | null {
    return this.map.has(key) ? this.map.get(key)! : null;
  }
  key(index: number): string | null {
    return Array.from(this.map.keys())[index] ?? null;
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
}

function installMemoryStorage(seed?: string): MemoryStorage {
  const storage = new MemoryStorage();
  if (seed !== undefined) storage.setItem(KEY, seed);
  (globalThis as { localStorage?: Storage }).localStorage = storage;
  return storage;
}

/** A storage whose setItem always throws the named DOMException-like error. */
function installThrowingStorage(name: string): void {
  (globalThis as { localStorage?: Storage }).localStorage = {
    length: 0,
    clear() {},
    getItem() {
      return null;
    },
    key() {
      return null;
    },
    removeItem() {},
    setItem() {
      const error = new Error(name);
      error.name = name;
      throw error;
    },
  };
}

type StorageListener = (e: { key: string | null; newValue: string | null }) => void;

/** Minimal window fake: enough for subscribeStorage's addEventListener/removeEventListener. */
function installMockWindow(): { fire: StorageListener } {
  const listeners: StorageListener[] = [];
  (globalThis as { window?: unknown }).window = {
    addEventListener(type: string, cb: StorageListener) {
      if (type === "storage") listeners.push(cb);
    },
    removeEventListener(type: string, cb: StorageListener) {
      if (type !== "storage") return;
      const idx = listeners.indexOf(cb);
      if (idx !== -1) listeners.splice(idx, 1);
    },
  };
  return {
    fire: (e) => listeners.forEach((l) => l(e)),
  };
}

afterEach(() => {
  delete (globalThis as { localStorage?: Storage }).localStorage;
  delete (globalThis as { window?: unknown }).window;
});

describe("persist.loadSave — rescue table", () => {
  it("absent key -> defaults, no warning (normal first-visit path)", () => {
    installMemoryStorage();
    const result = loadSave();
    expect(result.data.stageStars).toEqual({});
    expect(result.data.settings.speed).toBe(1);
    expect(result.saveDisabled).toBe(false);
    expect(result.warning).toBeNull();
  });

  it("malformed JSON -> reset to defaults, no crash", () => {
    installMemoryStorage("{not json");
    const result = loadSave();
    expect(result.data.stageStars).toEqual({});
    expect(result.saveDisabled).toBe(false);
  });

  it("stale version (v0) -> clean reset", () => {
    installMemoryStorage(JSON.stringify({ version: 0, stageStars: { stage1: 3 }, settings: { speed: 2 } }));
    const result = loadSave();
    expect(result.data.version).toBe(1);
    expect(result.data.stageStars).toEqual({});
  });

  it("future version (v99) -> clean reset, same as stale", () => {
    installMemoryStorage(JSON.stringify({ version: 99, stageStars: { stage1: 3 }, settings: { speed: 2 } }));
    const result = loadSave();
    expect(result.data.version).toBe(1);
    expect(result.data.stageStars).toEqual({});
  });

  it("valid v1 blob loads through, merging in defaults for missing settings fields", () => {
    installMemoryStorage(JSON.stringify({ version: 1, stageStars: { stage1: 2 }, settings: { speed: 2 } }));
    const result = loadSave();
    expect(result.data.stageStars).toEqual({ stage1: 2 });
    expect(result.data.settings.speed).toBe(2);
    expect(typeof result.data.settings.reducedMotion).toBe("boolean");
  });

  it("localStorage.getItem throwing (Safari private mode) -> defaults, saving disabled, warned", () => {
    (globalThis as { localStorage?: Storage }).localStorage = {
      length: 0,
      clear() {},
      getItem() {
        const error = new Error("SecurityError");
        error.name = "SecurityError";
        throw error;
      },
      key() {
        return null;
      },
      removeItem() {},
      setItem() {},
    };
    const result = loadSave();
    expect(result.saveDisabled).toBe(true);
    expect(result.warning).toBe("Progress won't save");
  });
});

describe("persist.saveData — rescue table", () => {
  const payload: SaveData = { version: 1, stageStars: { stage1: 3 }, settings: { speed: 1, reducedMotion: false } };

  it("writes through cleanly under normal conditions", () => {
    const storage = installMemoryStorage();
    const result = saveData(payload);
    expect(result).toEqual({ ok: true, warning: null });
    expect(JSON.parse(storage.getItem(KEY)!)).toEqual(payload);
  });

  it("QuotaExceededError -> saving disabled, gameplay keeps going (no throw)", () => {
    installThrowingStorage("QuotaExceededError");
    const result = saveData(payload);
    expect(result).toEqual({ ok: false, warning: "Progress won't save" });
  });

  it("SecurityError (private mode) -> same graceful degradation as quota", () => {
    installThrowingStorage("SecurityError");
    const result = saveData(payload);
    expect(result).toEqual({ ok: false, warning: "Progress won't save" });
  });

  it("an unrecognised thrown error still degrades gracefully rather than propagating", () => {
    installThrowingStorage("SomeUnexpectedError");
    expect(() => saveData(payload)).not.toThrow();
    expect(saveData(payload)).toEqual({ ok: false, warning: "Progress won't save" });
  });
});

describe("persist.subscribeStorage — cross-tab rescue table", () => {
  it("applies a valid cross-tab update when no battle is active", () => {
    const mockWindow = installMockWindow();
    const seen: SaveData[] = [];
    subscribeStorage((data) => seen.push(data), () => false);
    const next: SaveData = { version: 1, stageStars: { stage1: 3 }, settings: { speed: 4, reducedMotion: true } };
    mockWindow.fire({ key: KEY, newValue: JSON.stringify(next) });
    expect(seen).toEqual([next]);
  });

  it("ignores a cross-tab update while a battle is active, rather than clobbering local state", () => {
    const mockWindow = installMockWindow();
    const seen: SaveData[] = [];
    subscribeStorage((data) => seen.push(data), () => true);
    mockWindow.fire({
      key: KEY,
      newValue: JSON.stringify({ version: 1, stageStars: {}, settings: { speed: 1, reducedMotion: false } }),
    });
    expect(seen).toEqual([]);
  });

  it("ignores events for a different storage key (namespace collision safety)", () => {
    const mockWindow = installMockWindow();
    const seen: SaveData[] = [];
    subscribeStorage((data) => seen.push(data), () => false);
    mockWindow.fire({ key: "some-other-project:save", newValue: "{}" });
    expect(seen).toEqual([]);
  });

  it("ignores malformed JSON from another tab without throwing", () => {
    const mockWindow = installMockWindow();
    const seen: SaveData[] = [];
    subscribeStorage((data) => seen.push(data), () => false);
    expect(() => mockWindow.fire({ key: KEY, newValue: "{not json" })).not.toThrow();
    expect(seen).toEqual([]);
  });

  it("ignores a cross-tab payload with a mismatched schema version", () => {
    const mockWindow = installMockWindow();
    const seen: SaveData[] = [];
    subscribeStorage((data) => seen.push(data), () => false);
    mockWindow.fire({ key: KEY, newValue: JSON.stringify({ version: 99, stageStars: {}, settings: {} }) });
    expect(seen).toEqual([]);
  });
});
