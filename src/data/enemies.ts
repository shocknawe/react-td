/**
 * Enemy content. Speeds are world units/sec (CELL = 50, stage1's path is ~1150 units
 * long, so a speed-80 shade crosses it in ~14s). Bounties come from economy.ts so the
 * two stay derived together instead of drifting apart.
 */
import type { EnemyDef, EnemyKind } from "../game/types";
import { BOUNTIES } from "./economy";

export const ENEMY_DEFS: Record<EnemyKind, EnemyDef> = {
  shade: { kind: "shade", hp: 18, speed: 80, armor: 0, bounty: BOUNTIES.shade, size: 14 },
  armored: { kind: "armored", hp: 60, speed: 45, armor: 6, bounty: BOUNTIES.armored, size: 20 },
  scout: { kind: "scout", hp: 12, speed: 130, armor: 0, bounty: BOUNTIES.scout, size: 12 },
  boss: { kind: "boss", hp: 700, speed: 35, armor: 12, bounty: BOUNTIES.boss, size: 34 },
};
