import { describe, expect, it } from "vitest";
import { nextRandom, randInt, randRange } from "./rng";

describe("rng", () => {
  it("is deterministic: same seed always produces the same sequence", () => {
    const seq1: number[] = [];
    const seq2: number[] = [];
    let s1 = 12345;
    let s2 = 12345;
    for (let i = 0; i < 50; i++) {
      const [v1, n1] = nextRandom(s1);
      const [v2, n2] = nextRandom(s2);
      seq1.push(v1);
      seq2.push(v2);
      s1 = n1;
      s2 = n2;
    }
    expect(seq1).toEqual(seq2);
  });

  it("different seeds diverge", () => {
    const [a] = nextRandom(1);
    const [b] = nextRandom(2);
    expect(a).not.toBe(b);
  });

  it("produces values in [0, 1)", () => {
    let seed = 999;
    for (let i = 0; i < 200; i++) {
      const [v, next] = nextRandom(seed);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
      seed = next;
    }
  });

  it("randRange stays within [min, max)", () => {
    let seed = 42;
    for (let i = 0; i < 200; i++) {
      const [v, next] = randRange(seed, 10, 20);
      expect(v).toBeGreaterThanOrEqual(10);
      expect(v).toBeLessThan(20);
      seed = next;
    }
  });

  it("randInt stays within [min, max] inclusive and hits both ends over many draws", () => {
    let seed = 7;
    let sawMin = false;
    let sawMax = false;
    for (let i = 0; i < 500; i++) {
      const [v, next] = randInt(seed, 0, 3);
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(3);
      if (v === 0) sawMin = true;
      if (v === 3) sawMax = true;
      seed = next;
    }
    expect(sawMin).toBe(true);
    expect(sawMax).toBe(true);
  });
});
