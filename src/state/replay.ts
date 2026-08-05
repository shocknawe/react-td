/**
 * In-memory command replay ring, plus the run's seed.
 *
 * This is the only version of "deterministic replay" that exists at this scope
 * (PLAN.md Phase 3 #7): nothing runs the log back through the sim automatically,
 * but the seed + ordered command log is exactly what a bug report needs to
 * reproduce a run, and it is surfaced as copyable JSON on the crash panel and
 * behind a small affordance on defeat.
 */
import type { Command } from "../game/types";

export type ReplayEntry = { step: number; cmd: Command };

export type ReplayDump = {
  version: 1;
  seed: number;
  stageId: string;
  /** Wall-clock-free: just the ordered command log, keyed by sim step index. */
  commands: ReplayEntry[];
};

/** Ring capacity. A full TD run is a few hundred placements at most; 2000 is generous headroom. */
const RING_CAPACITY = 2000;

let ring: ReplayEntry[] = [];
let seed = 0;
let stageId = "";

/** Call once when a battle starts (or restarts) — resets the ring and records the run identity. */
export function initReplay(newSeed: number, newStageId: string): void {
  seed = newSeed;
  stageId = newStageId;
  ring = [];
}

/** Call from the loop every time a command is successfully dispatched to the sim. */
export function recordCommand(step: number, cmd: Command): void {
  ring.push({ step, cmd });
  if (ring.length > RING_CAPACITY) ring.shift();
}

export function getReplayEntries(): readonly ReplayEntry[] {
  return ring;
}

export function getReplaySeed(): number {
  return seed;
}

/** Copyable JSON for the crash panel / defeat-screen affordance. */
export function getReplayJSON(): string {
  const dump: ReplayDump = { version: 1, seed, stageId, commands: ring };
  return JSON.stringify(dump, null, 2);
}

export function clearReplay(): void {
  ring = [];
  seed = 0;
  stageId = "";
}
