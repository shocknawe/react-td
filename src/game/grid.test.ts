import { describe, expect, it } from "vitest";
import type { SimState, StageDef } from "./types";
import { buildPath } from "./path";
import { canPlace } from "./grid";
import { createSim } from "./sim";

function makeStage(): StageDef {
  return {
    id: "test",
    name: "Test",
    nameJa: "テスト",
    cols: 7,
    rows: 12,
    path: [
      { x: 3, y: 0 },
      { x: 3, y: 11 },
    ],
    sockets: [
      { x: 1, y: 1 },
      { x: 5, y: 1 },
    ],
    waves: [{ delay: 1, entries: [{ kind: "shade", count: 1, spacing: 1 }] }],
  };
}

describe("grid.canPlace", () => {
  const stage = makeStage();
  const path = buildPath(stage);

  function freshState(mana: number): SimState {
    const state = createSim("test", stage, 1);
    state.mana = mana;
    return state;
  }

  it("rejects a cell that is not a socket", () => {
    const state = freshState(1000);
    const result = canPlace(state, stage, path, { x: 0, y: 0 }, 10);
    expect(result).toEqual({ ok: false, reason: "notASocket" });
  });

  it("rejects a cell on the path", () => {
    const state = freshState(1000);
    const result = canPlace(state, stage, path, { x: 3, y: 5 }, 10);
    expect(result).toEqual({ ok: false, reason: "onPath" });
  });

  it("rejects an occupied socket", () => {
    const state = freshState(1000);
    state.towers.push({ id: 1, el: "fire", cell: { x: 1, y: 1 }, pos: { x: 0, y: 0 }, tier: 1, cooldown: 0 });
    const result = canPlace(state, stage, path, { x: 1, y: 1 }, 10);
    expect(result).toEqual({ ok: false, reason: "occupied" });
  });

  it("rejects insufficient mana", () => {
    const state = freshState(5);
    const result = canPlace(state, stage, path, { x: 1, y: 1 }, 10);
    expect(result).toEqual({ ok: false, reason: "insufficientMana" });
  });

  it("accepts a valid, empty, affordable socket", () => {
    const state = freshState(1000);
    const result = canPlace(state, stage, path, { x: 1, y: 1 }, 10);
    expect(result).toEqual({ ok: true });
  });
});
