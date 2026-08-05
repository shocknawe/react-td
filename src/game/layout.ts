/**
 * Coordinate contract shared by game/, render/ and ui/.
 *
 * WORLD units == CSS pixels at 1x. The battlefield is a fixed portrait box; the
 * renderer scales the whole box to fit its container and multiplies by devicePixelRatio
 * for the backing store. Nothing outside render/ ever thinks about DPR.
 */
export const CELL = 50;          // world units per grid cell
export const COLS = 7;           // 7 * 50 = 350 world units wide
export const ROWS = 12;          // 12 * 50 = 600 world units tall
export const WORLD_W = COLS * CELL;
export const WORLD_H = ROWS * CELL;

/** Grid cell -> world position of its centre. */
export function cellCentre(cx: number, cy: number): { x: number; y: number } {
  return { x: cx * CELL + CELL / 2, y: cy * CELL + CELL / 2 };
}

/** World position -> grid cell (floored). May be out of bounds; callers must check. */
export function worldToCell(x: number, y: number): { x: number; y: number } {
  return { x: Math.floor(x / CELL), y: Math.floor(y / CELL) };
}

export function inBounds(cx: number, cy: number): boolean {
  return cx >= 0 && cy >= 0 && cx < COLS && cy < ROWS;
}
