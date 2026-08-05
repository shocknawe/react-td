import { describe, expect, it } from "vitest";
import type { WaveDef } from "./types";
import { buildSpawnQueue, spawnSpacingAt, waveEnemyCount } from "./waves";

describe("waves", () => {
  const wave: WaveDef = {
    delay: 3,
    entries: [
      { kind: "shade", count: 3, spacing: 1.0 },
      { kind: "armored", count: 2, spacing: 0.5 },
    ],
  };

  it("flattens entries in order", () => {
    expect(buildSpawnQueue(wave)).toEqual(["shade", "shade", "shade", "armored", "armored"]);
  });

  it("counts total enemies across entries", () => {
    expect(waveEnemyCount(wave)).toBe(5);
  });

  it("resolves spacing per entry by spawn index", () => {
    expect(spawnSpacingAt(wave, 0)).toBe(1.0); // 1st shade
    expect(spawnSpacingAt(wave, 2)).toBe(1.0); // 3rd shade (last of entry 0)
    expect(spawnSpacingAt(wave, 3)).toBe(0.5); // 1st armored
    expect(spawnSpacingAt(wave, 4)).toBe(0.5); // 2nd armored (last)
  });

  it("falls back to the last entry's spacing past the end", () => {
    expect(spawnSpacingAt(wave, 99)).toBe(0.5);
  });
});
