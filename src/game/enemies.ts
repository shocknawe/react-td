/**
 * Enemy movement and leak detection. Mutates the Enemy in place (sim.ts iterates the
 * live array once per step; cloning 60 enemies x 60 steps/sec for no reason is waste).
 */
import type { Enemy, EnemyDef } from "./types";
import { SLOW_FACTOR } from "./rules/elements";

/** Advance `enemy` by `dt` seconds, applying the slow multiplier while enemy.slow > 0. */
export function advanceEnemy(enemy: Enemy, def: EnemyDef, dt: number): void {
  const speedMul = enemy.slow > 0 ? SLOW_FACTOR : 1;
  enemy.dist += def.speed * speedMul * dt;
  if (enemy.slow > 0) {
    enemy.slow = Math.max(0, enemy.slow - dt);
  }
}

/** Apply (or refresh, whichever is longer) a slow status. */
export function applySlow(enemy: Enemy, duration: number): void {
  enemy.slow = Math.max(enemy.slow, duration);
}

/** True once a still-alive enemy has travelled the full path length. */
export function hasLeaked(enemy: Enemy, pathLength: number): boolean {
  return !enemy.dead && enemy.dist >= pathLength;
}
