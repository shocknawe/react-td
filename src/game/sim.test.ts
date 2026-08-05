/**
 * PLAN.md T32 — determinism test: the property lint cannot prove.
 *
 * A fixed, state-independent command log (script keyed by nothing but its own order —
 * never by wall-clock or by anything read back out of SimState) run through the same
 * seed must produce byte-identical state at 10k steps. If this ever fails, something in
 * game/ started reading a non-deterministic source (a banned global slipping past the
 * eslint boundary, iteration order depending on object identity, etc.).
 *
 * Also covers T38 — the enemy concurrency cap actually stalls spawning rather than
 * merely being a comment on TODOS.md #4.
 */
import { describe, expect, it } from "vitest";
import type { Command, SimState, StageDef } from "./types";
import { MAX_CONCURRENT_ENEMIES } from "./types";
import { buildPath } from "./path";
import { applyCommand, createSim, step } from "./sim";
import { STAGE1 } from "../data/stage1";

const DT = 1 / 60;

/** State-independent: every command here is fixed up front, never derived from SimState. */
function scriptedCommands(stage: StageDef): Command[] {
  const s0 = stage.sockets[0]!;
  const s1 = stage.sockets[1]!;
  return [
    { t: "place", el: "fire", cell: s0 },
    { t: "place", el: "ice", cell: s1 },
    { t: "startWave" },
  ];
}

/** Drops the `seed` field — it's currently unused by sim.ts, so comparing it across
 * two runs seeded differently would trivially fail for a reason unrelated to determinism. */
function withoutSeed(state: SimState): Omit<SimState, "seed"> {
  const { seed, ...rest } = state;
  void seed;
  return rest;
}

function runDeterministic(stage: StageDef, seed: number, steps: number): SimState {
  const path = buildPath(stage);
  const state = createSim(stage.id, stage, seed);
  for (const cmd of scriptedCommands(stage)) applyCommand(state, stage, path, cmd);
  for (let i = 0; i < steps; i++) {
    step(state, stage, path, DT);
    if (state.phase === "victory" || state.phase === "defeat" || state.phase === "crashed") break;
  }
  return state;
}

describe("sim determinism", () => {
  it("produces byte-identical state from the same seed + command log at 10k steps", () => {
    const a = runDeterministic(STAGE1, 12345, 10_000);
    const b = runDeterministic(STAGE1, 12345, 10_000);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("sanity: the scripted log is not a no-op — the run actually reaches later waves", () => {
    const a = runDeterministic(STAGE1, 12345, 10_000);
    expect(a.wave).toBeGreaterThan(0);
    expect(a.kills).toBeGreaterThan(0);
  });

  it("a different seed does not change the outcome (nothing in stage1 currently reads the seed)", () => {
    // Documents current behaviour, not a requirement: game/rng.ts exists for future use
    // but nothing in sim.ts calls it yet. If/when it does, this test is expected to fail
    // and should be updated rather than deleted — drop the seed exclusion below instead.
    const a = withoutSeed(runDeterministic(STAGE1, 1, 5_000));
    const b = withoutSeed(runDeterministic(STAGE1, 999_999, 5_000));
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

describe("sim enemy concurrency cap (T38)", () => {
  function capStressStage(): StageDef {
    return {
      id: "capstress",
      name: "Cap Stress",
      nameJa: "t",
      cols: 7,
      rows: 12,
      path: [
        { x: 3, y: 0 },
        { x: 3, y: 11 },
      ],
      sockets: [],
      waves: [{ delay: 1, entries: [{ kind: "shade", count: 200, spacing: 0.01 }] }],
    };
  }

  it("never lets more than MAX_CONCURRENT_ENEMIES be alive at once", () => {
    const stage = capStressStage();
    const path = buildPath(stage);
    const state = createSim(stage.id, stage, 1);
    applyCommand(state, stage, path, { t: "startWave" });

    let sawFullQueue = false;
    for (let i = 0; i < 600; i++) {
      step(state, stage, path, DT);
      expect(state.enemies.length).toBeLessThanOrEqual(MAX_CONCURRENT_ENEMIES);
      if (state.enemies.length >= MAX_CONCURRENT_ENEMIES) sawFullQueue = true;
    }
    // The stress wave (200 enemies, 0.01s spacing, no towers) must actually have hit the
    // cap at some point — otherwise this test would pass even with no cap at all.
    expect(sawFullQueue).toBe(true);
  });

  it("stalls rather than drops: every enemy is accounted for as queued, alive, or leaked", () => {
    const stage = capStressStage();
    const total = 200;
    const path = buildPath(stage);
    const state = createSim(stage.id, stage, 1);
    applyCommand(state, stage, path, { t: "startWave" });

    for (let i = 0; i < 600; i++) {
      step(state, stage, path, DT);
      if (state.phase === "defeat") break; // no towers: the stress wave ends in defeat, expected
    }
    // No towers were placed, so every removed enemy was removed via a leak, never a kill.
    expect(state.kills).toBe(0);
    expect(state.waveSpawnQueue.length + state.enemies.length + state.leaks).toBe(total);
  });
});
