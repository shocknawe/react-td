import { describe, expect, it } from "vitest";
import type { Enemy, EnemyDef } from "./types";
import { advanceEnemy, applySlow, hasLeaked } from "./enemies";

const def: EnemyDef = { kind: "shade", hp: 20, speed: 100, armor: 0, bounty: 1, size: 10 };

function enemy(overrides: Partial<Enemy> = {}): Enemy {
  return { id: 1, kind: "shade", dist: 0, hp: 20, maxHp: 20, slow: 0, dead: false, ...overrides };
}

describe("enemies.advanceEnemy", () => {
  it("moves at full speed when unslowed", () => {
    const e = enemy();
    advanceEnemy(e, def, 1);
    expect(e.dist).toBe(100);
  });

  it("moves at SLOW_FACTOR while slow > 0", () => {
    const e = enemy({ slow: 2 });
    advanceEnemy(e, def, 1);
    expect(e.dist).toBe(45); // 100 * 0.45
  });

  it("counts down the slow timer and clamps at zero", () => {
    const e = enemy({ slow: 0.3 });
    advanceEnemy(e, def, 1);
    expect(e.slow).toBe(0);
  });
});

describe("enemies.applySlow", () => {
  it("refreshes to the longer of the current and new duration", () => {
    const e = enemy({ slow: 1 });
    applySlow(e, 0.5);
    expect(e.slow).toBe(1); // shorter duration does not shorten an existing slow
    applySlow(e, 2);
    expect(e.slow).toBe(2);
  });
});

describe("enemies.hasLeaked", () => {
  it("is true once dist reaches the path length", () => {
    expect(hasLeaked(enemy({ dist: 500 }), 500)).toBe(true);
    expect(hasLeaked(enemy({ dist: 600 }), 500)).toBe(true);
  });

  it("is false before the path length", () => {
    expect(hasLeaked(enemy({ dist: 499 }), 500)).toBe(false);
  });

  it("is false once already dead, even past the path length", () => {
    expect(hasLeaked(enemy({ dist: 600, dead: true }), 500)).toBe(false);
  });
});
