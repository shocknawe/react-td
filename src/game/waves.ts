/**
 * Wave data helpers. A WaveDef's entries are processed in array order — every enemy of
 * entry[0] spawns (at entry[0].spacing) before entry[1] begins. Flattening into a single
 * spawn queue is what sim.ts drains one enemy at a time; spawnSpacingAt lets it recover
 * which entry (and therefore which spacing) a given spawn index belongs to, since the
 * flat queue itself only carries EnemyKind (SimState.waveSpawnQueue's contracted shape).
 */
import type { EnemyKind, WaveDef } from "./types";

/** Flatten a wave's entries into an ordered spawn queue. */
export function buildSpawnQueue(wave: WaveDef): EnemyKind[] {
  const queue: EnemyKind[] = [];
  for (const entry of wave.entries) {
    for (let i = 0; i < entry.count; i++) queue.push(entry.kind);
  }
  return queue;
}

/** Total enemy count across all entries in a wave. */
export function waveEnemyCount(wave: WaveDef): number {
  return wave.entries.reduce((sum, e) => sum + e.count, 0);
}

/**
 * The spacing (seconds until the *next* spawn) that applies to the enemy at flat-queue
 * index `spawnedCount` (0-based count of enemies already spawned from this wave, i.e.
 * the index of the enemy about to spawn).
 */
export function spawnSpacingAt(wave: WaveDef, spawnedCount: number): number {
  let cursor = 0;
  for (const entry of wave.entries) {
    if (spawnedCount < cursor + entry.count) return entry.spacing;
    cursor += entry.count;
  }
  const last = wave.entries[wave.entries.length - 1];
  return last ? last.spacing : 0;
}
