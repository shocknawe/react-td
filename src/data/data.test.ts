/**
 * PLAN.md T36 — golden test on data/: the 2am-Friday data-edit failure. Nothing here
 * re-derives the numbers in economy.ts's DERIVATION comment (that would just duplicate
 * the prose in code); these are the structural invariants a bad hand-edit to stage1.ts,
 * mages.ts, or the stage-select fixtures could silently break.
 */
import { describe, expect, it } from "vitest";
import { buildPath, isOnPath } from "../game/path";
import { STAGE1 } from "./stage1";
import { MAGE_DEFS } from "./mages";
import { STARTING_MANA } from "./economy";
import { CHEST_THRESHOLDS, STAGE_NODES } from "../ui/data/stageFixtures";

describe("data/stage1 — path and socket integrity", () => {
  it("builds without throwing (all waypoints axis-aligned)", () => {
    expect(() => buildPath(STAGE1)).not.toThrow();
  });

  const path = buildPath(STAGE1);

  it("has no socket sitting on the path corridor", () => {
    const onPath = STAGE1.sockets.filter((s) => isOnPath(path, s));
    expect(onPath).toEqual([]);
  });

  it("keeps every socket inside the grid", () => {
    for (const s of STAGE1.sockets) {
      expect(s.x).toBeGreaterThanOrEqual(0);
      expect(s.x).toBeLessThan(STAGE1.cols);
      expect(s.y).toBeGreaterThanOrEqual(0);
      expect(s.y).toBeLessThan(STAGE1.rows);
    }
  });

  it("has no duplicate sockets", () => {
    const keys = STAGE1.sockets.map((s) => `${s.x},${s.y}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("has at least 10 buildable sockets (doc'd minimum in stage1.ts's header)", () => {
    expect(STAGE1.sockets.length).toBeGreaterThanOrEqual(10);
  });

  it("has at least one wave, and every wave has at least one entry", () => {
    expect(STAGE1.waves.length).toBeGreaterThan(0);
    for (const wave of STAGE1.waves) expect(wave.entries.length).toBeGreaterThan(0);
  });
});

describe("data/mages — economy affordability", () => {
  it("starting mana affords at least one tier-1 mage of some element", () => {
    const cheapest = Math.min(...Object.values(MAGE_DEFS).map((m) => m.cost));
    expect(cheapest).toBeLessThanOrEqual(STARTING_MANA);
  });

  it("every mage has exactly 3 tiers, and tier 1's upgradeCost is unused (0)", () => {
    for (const mage of Object.values(MAGE_DEFS)) {
      expect(mage.tiers.length).toBe(3);
      expect(mage.tiers[0]?.upgradeCost).toBe(0);
    }
  });
});

describe("ui/data/stageFixtures — chest milestones are actually reachable", () => {
  it("the highest chest threshold is reachable within the chapter's max stars (3 per node)", () => {
    const maxAchievable = STAGE_NODES.length * 3;
    const highestChest = Math.max(...CHEST_THRESHOLDS);
    expect(highestChest).toBeLessThanOrEqual(maxAchievable);
  });

  it("chest thresholds are sorted ascending and unique (rail renders left-to-right in order)", () => {
    const sorted = [...CHEST_THRESHOLDS].sort((a, b) => a - b);
    expect(CHEST_THRESHOLDS).toEqual(sorted);
    expect(new Set(CHEST_THRESHOLDS).size).toBe(CHEST_THRESHOLDS.length);
  });
});
