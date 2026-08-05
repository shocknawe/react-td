import { describe, expect, it } from "vitest";
import type { StageDef } from "./types";
import { buildPath, isOnPath, pathLength, positionAt } from "./path";

function stageWith(path: StageDef["path"]): StageDef {
  return {
    id: "test",
    name: "Test",
    nameJa: "テスト",
    cols: 7,
    rows: 12,
    path,
    sockets: [],
    waves: [],
  };
}

describe("path", () => {
  const stage = stageWith([
    { x: 0, y: 0 },
    { x: 0, y: 2 },
    { x: 2, y: 2 },
  ]);
  const path = buildPath(stage);

  it("computes total length from the world-space polyline", () => {
    // (0,0)->(0,2): 2 cells = 100 units. (0,2)->(2,2): 2 cells = 100 units.
    expect(pathLength(path)).toBe(200);
  });

  it("positionAt(0) is the first waypoint's cell centre", () => {
    expect(positionAt(path, 0)).toEqual({ x: 25, y: 25 });
  });

  it("positionAt at a segment boundary lands exactly on the waypoint", () => {
    expect(positionAt(path, 100)).toEqual({ x: 25, y: 125 });
  });

  it("positionAt interpolates mid-segment", () => {
    expect(positionAt(path, 150)).toEqual({ x: 75, y: 125 });
  });

  it("positionAt clamps beyond the path length", () => {
    expect(positionAt(path, 10_000)).toEqual({ x: 125, y: 125 });
  });

  it("positionAt clamps before the start", () => {
    expect(positionAt(path, -50)).toEqual({ x: 25, y: 25 });
  });

  it("isOnPath is true for every cell the corridor passes through, not just waypoints", () => {
    expect(isOnPath(path, { x: 0, y: 0 })).toBe(true);
    expect(isOnPath(path, { x: 0, y: 1 })).toBe(true); // between waypoints
    expect(isOnPath(path, { x: 0, y: 2 })).toBe(true);
    expect(isOnPath(path, { x: 1, y: 2 })).toBe(true); // between waypoints
    expect(isOnPath(path, { x: 2, y: 2 })).toBe(true);
  });

  it("isOnPath is false off the corridor", () => {
    expect(isOnPath(path, { x: 1, y: 0 })).toBe(false);
    expect(isOnPath(path, { x: 3, y: 3 })).toBe(false);
  });

  it("throws on a non-axis-aligned waypoint pair", () => {
    const diagonal = stageWith([
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ]);
    expect(() => buildPath(diagonal)).toThrow();
  });
});
