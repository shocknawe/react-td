/**
 * Placement legality. Pure query over SimState + StageDef + Path — no mutation here;
 * sim.ts owns applying the result.
 */
import type { RejectReason, SimState, StageDef, Vec2 } from "./types";
import type { Path } from "./path";
import { isOnPath } from "./path";

export type PlaceCheck = { ok: true } | { ok: false; reason: RejectReason };

function sameCell(a: Vec2, b: Vec2): boolean {
  return a.x === b.x && a.y === b.y;
}

export function isSocket(stage: StageDef, cell: Vec2): boolean {
  return stage.sockets.some((s) => sameCell(s, cell));
}

export function isOccupied(state: SimState, cell: Vec2): boolean {
  return state.towers.some((t) => sameCell(t.cell, cell));
}

/**
 * `cost` is the mana price of the thing being placed (MageDef.cost for a fresh tower).
 * canPlace only answers whether a tower *could* legally occupy `cell` right now; it does
 * not mutate mana or towers — sim.ts's applyCommand does that once this returns ok.
 */
export function canPlace(state: SimState, stage: StageDef, path: Path, cell: Vec2, cost: number): PlaceCheck {
  if (isOnPath(path, cell)) return { ok: false, reason: "onPath" };
  if (!isSocket(stage, cell)) return { ok: false, reason: "notASocket" };
  if (isOccupied(state, cell)) return { ok: false, reason: "occupied" };
  if (state.mana < cost) return { ok: false, reason: "insufficientMana" };
  return { ok: true };
}
