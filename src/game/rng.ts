/**
 * Seeded PRNG (mulberry32). Every function is pure: takes a seed, returns a value and
 * the next seed. Nothing in game/ may call Math.random — determinism depends entirely
 * on this module being the sole source of randomness, and on that seed being threaded
 * through SimState rather than bypassed.
 */

/** One mulberry32 step. Returns [value in [0,1)), nextSeed]. */
export function nextRandom(seed: number): [value: number, nextSeed: number] {
  const a = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return [value, a >>> 0];
}

/** Random float in [min, max). Returns [value, nextSeed]. */
export function randRange(seed: number, min: number, max: number): [value: number, nextSeed: number] {
  const [v, next] = nextRandom(seed);
  return [min + v * (max - min), next];
}

/** Random integer in [min, max] inclusive. Returns [value, nextSeed]. */
export function randInt(seed: number, min: number, max: number): [value: number, nextSeed: number] {
  const [v, next] = nextRandom(seed);
  return [min + Math.floor(v * (max - min + 1)), next];
}
