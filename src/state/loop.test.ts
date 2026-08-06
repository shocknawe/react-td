/**
 * PLAN.md T4 — fixed-timestep loop: "x2 speed produces exactly 2x steps, never larger
 * steps". The accumulator/budget logic itself was ported verbatim from design/scene.html
 * (T31) but had no test of its own; this locks the acceptance criterion in.
 *
 * environment is "node" (vitest.config.ts); GameLoop touches document/rAF directly (it
 * predates any DOM test environment being installed), so this file supplies the minimum
 * fakes needed rather than pulling in jsdom.
 */
import { afterEach, describe, expect, it } from "vitest";
import type { SimState } from "../game/types";
import { GameLoop, type RendererLike, type SimEngine } from "./loop";

function installRafMock(): { invoke(ts: number): void } {
  let captured: ((ts: number) => void) | null = null;
  let nextId = 1;
  (globalThis as { requestAnimationFrame?: unknown }).requestAnimationFrame = (cb: (ts: number) => void) => {
    captured = cb;
    return nextId++;
  };
  (globalThis as { cancelAnimationFrame?: unknown }).cancelAnimationFrame = () => {};
  return {
    invoke(ts) {
      captured?.(ts);
    },
  };
}

function installDocumentMock(): void {
  (globalThis as { document?: unknown }).document = {
    hidden: false,
    addEventListener() {},
    removeEventListener() {},
  };
}

afterEach(() => {
  delete (globalThis as { requestAnimationFrame?: unknown }).requestAnimationFrame;
  delete (globalThis as { cancelAnimationFrame?: unknown }).cancelAnimationFrame;
  delete (globalThis as { document?: unknown }).document;
});

function fakeState(): SimState {
  return {
    stageId: "test",
    phase: "running",
    wave: 0,
    waveSpawnQueue: [],
    spawnTimer: 0,
    interwaveTimer: 0,
    mana: 0,
    manaCap: 0,
    leaks: 0,
    kills: 0,
    elapsed: 0,
    enemies: [],
    towers: [],
    projectiles: [],
    seed: 1,
    nextId: 1,
  };
}

function countingEngine(counter: { steps: number }): SimEngine {
  return {
    step(state) {
      counter.steps++;
      return { state, events: [] };
    },
    applyCommand(state) {
      return { state, events: [] };
    },
  };
}

const silentRenderer: RendererLike = { render() {} };

describe("GameLoop fixed-timestep accumulator (T4)", () => {
  it("x2 speed produces exactly 2x the steps for the same real-time delta, never more", () => {
    installDocumentMock();
    const raf = installRafMock();

    const counter1x = { steps: 0 };
    const loop1x = new GameLoop(countingEngine(counter1x), silentRenderer);
    loop1x.start(fakeState());
    loop1x.setSpeed(1);
    raf.invoke(1000); // establishes `last`; no steps yet
    raf.invoke(1040); // 40ms real delta -> acc = 0.04s -> 2 steps at speed 1
    loop1x.destroy();

    const counter2x = { steps: 0 };
    const loop2x = new GameLoop(countingEngine(counter2x), silentRenderer);
    loop2x.start(fakeState());
    loop2x.setSpeed(2);
    raf.invoke(2000);
    raf.invoke(2040); // same 40ms real delta -> acc = 0.08s -> 4 steps at speed 2
    loop2x.destroy();

    expect(counter1x.steps).toBe(2);
    expect(counter2x.steps).toBe(counter1x.steps * 2);
  });

  it("clamps the raw per-frame delta before applying speed, so a backgrounded tab does not fast-forward", () => {
    installDocumentMock();
    const raf = installRafMock();
    const counter = { steps: 0 };
    const loop = new GameLoop(countingEngine(counter), silentRenderer);
    loop.start(fakeState());
    loop.setSpeed(1);
    raf.invoke(1000);
    raf.invoke(1000 + 60_000); // a full minute away — clamped to 250ms before ever hitting speed
    loop.destroy();

    // budget at speed 1 is ceil(1)*4 = 4 steps per frame; the clamp plus the budget
    // together guarantee this never runs an unbounded catch-up.
    expect(counter.steps).toBeLessThanOrEqual(4);
  });
});
