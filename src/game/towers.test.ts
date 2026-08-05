import { describe, expect, it } from "vitest";
import type { Enemy, MageDef, StageDef, Tower } from "./types";
import { buildPath } from "./path";
import { computeDamage, findTarget, tierStats, towerValue } from "./towers";

function enemy(overrides: Partial<Enemy>): Enemy {
  return { id: 1, kind: "shade", dist: 0, hp: 10, maxHp: 10, slow: 0, dead: false, ...overrides };
}

describe("towers.findTarget", () => {
  const stage: StageDef = {
    id: "t",
    name: "t",
    nameJa: "t",
    cols: 3,
    rows: 11,
    path: [
      { x: 0, y: 0 },
      { x: 0, y: 10 },
    ],
    sockets: [],
    waves: [],
  };
  const path = buildPath(stage); // length 500, straight vertical corridor at x=0
  const tower: Tower = { id: 1, el: "fire", cell: { x: 1, y: 5 }, pos: { x: 75, y: 275 }, tier: 1, cooldown: 0 };

  it("picks the furthest-along enemy in range over closer-but-earlier ones", () => {
    const e1 = enemy({ id: 1, dist: 100 });
    const e2 = enemy({ id: 2, dist: 300 });
    const e3 = enemy({ id: 3, dist: 290 });
    const target = findTarget(tower, [e1, e2, e3], path, 300);
    expect(target?.id).toBe(2);
  });

  it("ignores enemies out of range", () => {
    const near = enemy({ id: 1, dist: 275 }); // basically on top of the tower
    const far = enemy({ id: 2, dist: 490 }); // far down the corridor, out of a small range
    const target = findTarget(tower, [near, far], path, 60);
    expect(target?.id).toBe(1);
  });

  it("ignores dead enemies", () => {
    const dead = enemy({ id: 1, dist: 300, dead: true });
    const alive = enemy({ id: 2, dist: 100 });
    const target = findTarget(tower, [dead, alive], path, 500);
    expect(target?.id).toBe(2);
  });

  it("returns null when nothing is in range", () => {
    const e = enemy({ id: 1, dist: 0 });
    expect(findTarget(tower, [e], path, 1)).toBeNull();
  });
});

describe("towers.computeDamage", () => {
  it("applies the element multiplier then subtracts flat armor", () => {
    expect(computeDamage(20, "fire", "shade", 5)).toBe(20 * 1.25 - 5);
  });

  it("floors at zero rather than going negative", () => {
    expect(computeDamage(20, "fire", "armored", 100)).toBe(0);
  });
});

describe("towers.tierStats / towerValue", () => {
  const mage: MageDef = {
    id: "fire",
    name: "Test Mage",
    nameJa: "テスト",
    character: "Test",
    cost: 50,
    tiers: [
      { damage: 10, cooldown: 1, range: 100, upgradeCost: 0 },
      { damage: 20, cooldown: 0.9, range: 110, upgradeCost: 30 },
      { damage: 30, cooldown: 0.8, range: 120, upgradeCost: 60 },
    ],
  };

  it("looks up stats by 1-based tier", () => {
    expect(tierStats(mage, 1).damage).toBe(10);
    expect(tierStats(mage, 2).damage).toBe(20);
    expect(tierStats(mage, 3).damage).toBe(30);
  });

  it("clamps out-of-range tiers", () => {
    expect(tierStats(mage, 99).damage).toBe(30);
    expect(tierStats(mage, 0).damage).toBe(10);
  });

  it("sums cost + upgrade costs for towerValue", () => {
    expect(towerValue(mage, 1)).toBe(50);
    expect(towerValue(mage, 2)).toBe(80);
    expect(towerValue(mage, 3)).toBe(140);
  });
});
