/**
 * Shared simulation contract. Every other module builds against this file.
 *
 * game/ is PURE: no React, no canvas, no DOM, no Math.random, no Date/performance.
 * Enforced by eslint (`src/game/**` restricted globals) and by vitest running the
 * node environment, so DOM access throws rather than silently working.
 *
 *   data/  ──▶ game/  ──▶ render/      (render reads state, never mutates)
 *              ▲   │
 *      commands│   └──▶ events[]  ──▶ state/ ──▶ ui/
 */

export type ElementId = "fire" | "ice" | "lightning" | "wind";

export const ELEMENT_IDS: readonly ElementId[] = ["fire", "ice", "lightning", "wind"];

/** Fixed simulation step. Never varies — speed changes how many steps run, not their size. */
export const DT = 1 / 60;

/** Discrete leaks, not continuous crystal HP. The 4th leak is defeat. */
export const MAX_LEAKS = 3;

export type Vec2 = { x: number; y: number };

// ---------------------------------------------------------------- content

export type EnemyKind = "shade" | "armored" | "scout" | "boss";

export type EnemyDef = {
  kind: EnemyKind;
  hp: number;
  /** world units per second */
  speed: number;
  /** flat damage reduction applied before element multipliers */
  armor: number;
  /** mana granted on kill */
  bounty: number;
  /** draw size in world units */
  size: number;
};

export type MageDef = {
  id: ElementId;
  /** in-game class name, e.g. "Red Mage" */
  name: string;
  /** flavour only; never load-bearing */
  nameJa: string;
  /** character sheet name, used on the info screen */
  character: string;
  cost: number;
  /** per tier (index 0 = tier 1) */
  tiers: readonly MageTier[];
};

export type MageTier = {
  damage: number;
  /** seconds between shots */
  cooldown: number;
  range: number;
  /** cost to upgrade INTO this tier; tier 1 uses MageDef.cost */
  upgradeCost: number;
  /** ice only: seconds of slow applied on hit */
  slowDuration?: number;
};

export type WaveEntry = { kind: EnemyKind; count: number; spacing: number };
export type WaveDef = { entries: readonly WaveEntry[]; delay: number };

export type StageDef = {
  id: string;
  name: string;
  nameJa: string;
  /** grid cells */
  cols: number;
  rows: number;
  /** path in grid coordinates; enemies walk the polyline through cell centres */
  path: readonly Vec2[];
  /** buildable cells */
  sockets: readonly Vec2[];
  waves: readonly WaveDef[];
};

// ---------------------------------------------------------------- entities

export type Enemy = {
  id: number;
  kind: EnemyKind;
  /** distance travelled along the path, in world units */
  dist: number;
  hp: number;
  maxHp: number;
  /** remaining seconds of slow; 0 = unslowed */
  slow: number;
  dead: boolean;
};

export type Tower = {
  id: number;
  el: ElementId;
  /** grid cell */
  cell: Vec2;
  /** world position (cell centre) */
  pos: Vec2;
  /** 1-based */
  tier: number;
  cooldown: number;
};

export type Projectile = {
  id: number;
  el: ElementId;
  pos: Vec2;
  targetId: number;
  damage: number;
  slowDuration: number;
  /** seconds alive; used to expire strays */
  age: number;
};

export type BattlePhase = "ready" | "running" | "interwave" | "paused" | "victory" | "defeat" | "crashed";

export type SimState = {
  stageId: string;
  phase: BattlePhase;
  /** 0-based index into stage.waves */
  wave: number;
  waveSpawnQueue: EnemyKind[];
  spawnTimer: number;
  interwaveTimer: number;
  mana: number;
  manaCap: number;
  leaks: number;
  kills: number;
  /** seconds of simulated time; NOT wall clock */
  elapsed: number;
  enemies: Enemy[];
  towers: Tower[];
  projectiles: Projectile[];
  /** seeded PRNG state; determinism depends on this never being bypassed */
  seed: number;
  nextId: number;
};

// ---------------------------------------------------------------- commands

export type Command =
  | { t: "place"; el: ElementId; cell: Vec2 }
  | { t: "upgrade"; towerId: number }
  | { t: "sell"; towerId: number }
  | { t: "startWave" }
  | { t: "skipInterwave" };

/** Recorded with the step index so a run can be replayed from seed + log. */
export type LoggedCommand = { step: number; cmd: Command };

// ---------------------------------------------------------------- events

/** Emitted by step(); consumed by render/ for effects and by state/ for the HUD. */
export type GameEvent =
  | { t: "hit"; pos: Vec2; el: ElementId; damage: number }
  | { t: "kill"; pos: Vec2; el: ElementId; kind: EnemyKind }
  | { t: "leak"; kind: EnemyKind }
  | { t: "fire"; from: Vec2; el: ElementId }
  | { t: "placed"; pos: Vec2; el: ElementId }
  | { t: "sold"; pos: Vec2 }
  | { t: "upgraded"; pos: Vec2; el: ElementId; tier: number }
  | { t: "waveStart"; wave: number }
  | { t: "waveClear"; wave: number }
  | { t: "victory"; stars: number; elapsed: number }
  | { t: "defeat"; wave: number; killer: EnemyKind }
  | { t: "rejected"; reason: RejectReason };

export type RejectReason = "occupied" | "onPath" | "notASocket" | "insufficientMana" | "maxTier" | "wrongPhase";

// ---------------------------------------------------------------- results

/** Stars are earned from leaks remaining, never from continuous HP. */
export function starsForLeaks(leaks: number): number {
  if (leaks <= 0) return 3;
  if (leaks === 1) return 2;
  if (leaks === 2) return 1;
  return 0;
}
