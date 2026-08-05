/**
 * Builds a walkable polyline from StageDef.path (grid waypoints) and answers questions
 * about it: world position at a given travelled distance, total length, and whether a
 * grid cell lies on the corridor (used by grid.ts to reject placement).
 *
 * StageDef.path entries are turn waypoints in grid coordinates, not every cell walked —
 * buildPath expands consecutive axis-aligned waypoint pairs into the full set of grid
 * cells the corridor passes through, and precomputes world-space segment lengths so
 * positionAt() is O(segments) rather than O(distance).
 */
import type { StageDef, Vec2 } from "./types";
import { cellCentre } from "./layout";

export type Path = {
  /** world-space polyline vertices (cell centres of each waypoint) */
  points: readonly Vec2[];
  /** length of segment i -> i+1, in world units */
  segLengths: readonly number[];
  /** cumulative length through the end of segment i */
  cumLengths: readonly number[];
  totalLength: number;
  /** grid cells ("x,y") the corridor occupies, including cells between waypoints */
  cells: ReadonlySet<string>;
};

function cellKey(cell: Vec2): string {
  return `${cell.x},${cell.y}`;
}

function expandCorridorCells(waypoints: readonly Vec2[]): Set<string> {
  const cells = new Set<string>();
  for (let i = 0; i < waypoints.length; i++) {
    const wp = waypoints[i];
    if (wp) cells.add(cellKey(wp));
  }
  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    if (!a || !b) continue;
    if (a.x === b.x) {
      const lo = Math.min(a.y, b.y);
      const hi = Math.max(a.y, b.y);
      for (let y = lo; y <= hi; y++) cells.add(cellKey({ x: a.x, y }));
    } else if (a.y === b.y) {
      const lo = Math.min(a.x, b.x);
      const hi = Math.max(a.x, b.x);
      for (let x = lo; x <= hi; x++) cells.add(cellKey({ x, y: a.y }));
    } else {
      // Diagonal waypoint pairs are not supported: corridor membership would be
      // ambiguous. Stage authors must keep StageDef.path axis-aligned.
      throw new Error(`buildPath: waypoints (${a.x},${a.y}) -> (${b.x},${b.y}) are not axis-aligned`);
    }
  }
  return cells;
}

export function buildPath(stage: StageDef): Path {
  const points = stage.path.map((c) => cellCentre(c.x, c.y));
  const segLengths: number[] = [];
  const cumLengths: number[] = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (!a || !b) continue;
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    segLengths.push(len);
    total += len;
    cumLengths.push(total);
  }
  return {
    points,
    segLengths,
    cumLengths,
    totalLength: total,
    cells: expandCorridorCells(stage.path),
  };
}

export function pathLength(path: Path): number {
  return path.totalLength;
}

/** World position at `dist` units travelled along the path. Clamped to [0, totalLength]. */
export function positionAt(path: Path, dist: number): Vec2 {
  const first = path.points[0];
  if (!first) return { x: 0, y: 0 };
  if (path.points.length === 1 || path.segLengths.length === 0) return first;

  const d = Math.min(Math.max(dist, 0), path.totalLength);
  let idx = 0;
  while (idx < path.segLengths.length - 1 && d > (path.cumLengths[idx] ?? 0)) {
    idx++;
  }
  const segStart = idx === 0 ? 0 : (path.cumLengths[idx - 1] ?? 0);
  const segLen = path.segLengths[idx] ?? 0;
  const a = path.points[idx];
  const b = path.points[idx + 1];
  if (!a || !b) return first;
  const t = segLen === 0 ? 0 : (d - segStart) / segLen;
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/** True if `cell` lies on the path corridor — placement must reject these cells. */
export function isOnPath(path: Path, cell: Vec2): boolean {
  return path.cells.has(cellKey(cell));
}
