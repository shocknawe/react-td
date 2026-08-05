/**
 * Fake-SimState driver for __harness.html. Not part of the app bundle — a standalone dev
 * page for visually sanity-checking every draw path in render/ without game/, state/ or
 * ui/ existing yet.
 */
import type { Enemy, GameEvent, Projectile, SimState, StageDef, Tower } from "../game/types";
import { cellCentre } from "../game/layout";
import { create } from "./index";

const canvas = document.getElementById("cv") as HTMLCanvasElement;
const renderer = create(canvas);

const stage: StageDef = {
  id: "harness-stage",
  name: "Harness Valley",
  nameJa: "テスト",
  cols: 7,
  rows: 12,
  path: [
    { x: -1, y: 1 },
    { x: 4, y: 1 },
    { x: 4, y: 4 },
    { x: 1, y: 4 },
    { x: 1, y: 8 },
    { x: 6, y: 8 },
    { x: 6, y: 10 },
    { x: 3, y: 10 },
    { x: 3, y: 12 },
  ],
  sockets: [
    { x: 5, y: 1 },
    { x: 2, y: 3 },
    { x: 5, y: 5 },
    { x: 0, y: 7 },
    { x: 4, y: 9 },
  ],
  waves: [],
};

const towers: Tower[] = [
  { id: 1, el: "fire", cell: { x: 5, y: 1 }, pos: cellCentre(5, 1), tier: 1, cooldown: 0 },
  { id: 2, el: "ice", cell: { x: 2, y: 3 }, pos: cellCentre(2, 3), tier: 2, cooldown: 0 },
  { id: 3, el: "lightning", cell: { x: 5, y: 5 }, pos: cellCentre(5, 5), tier: 3, cooldown: 0 },
  { id: 4, el: "wind", cell: { x: 0, y: 7 }, pos: cellCentre(0, 7), tier: 1, cooldown: 0 },
];

const enemies: Enemy[] = [
  { id: 10, kind: "shade", dist: 40, hp: 60, maxHp: 60, slow: 0, dead: false },
  { id: 11, kind: "armored", dist: 140, hp: 90, maxHp: 150, slow: 0, dead: false },
  { id: 12, kind: "scout", dist: 260, hp: 38, maxHp: 38, slow: 1.1, dead: false },
  { id: 13, kind: "boss", dist: 420, hp: 600, maxHp: 600, slow: 0, dead: false },
];

const projectiles: Projectile[] = [
  { id: 100, el: "fire", pos: { x: 130, y: 90 }, targetId: 10, damage: 24, slowDuration: 0, age: 0.1 },
  { id: 101, el: "lightning", pos: { x: 260, y: 260 }, targetId: 11, damage: 30, slowDuration: 0, age: 0.1 },
];

let leaks = 0;
let reducedMotion = false;

const reducedBtn = document.getElementById("reduced") as HTMLButtonElement;
reducedBtn.onclick = () => {
  reducedMotion = !reducedMotion;
  reducedBtn.textContent = `reduced motion: ${reducedMotion ? "on" : "off"}`;
  reducedBtn.classList.toggle("on", reducedMotion);
};

const leakBtn = document.getElementById("leak") as HTMLButtonElement;
leakBtn.onclick = () => {
  leaks = (leaks + 1) % 4;
  leakBtn.textContent = `cycle leaks (${leaks})`;
};

function buildEvents(frame: number): GameEvent[] {
  const events: GameEvent[] = [];
  if (frame % 40 === 0) events.push({ t: "hit", pos: { x: 150, y: 150 }, el: "fire", damage: 24 });
  if (frame % 70 === 0) events.push({ t: "kill", pos: { x: 200, y: 300 }, el: "ice", kind: "scout" });
  if (frame % 130 === 0) events.push({ t: "kill", pos: { x: 260, y: 400 }, el: "lightning", kind: "boss" });
  if (frame % 200 === 0) events.push({ t: "leak", kind: "armored" });
  if (frame % 25 === 0) events.push({ t: "fire", from: { x: 250, y: 250 }, el: "wind" });
  return events;
}

let frame = 0;
let elapsed = 0;

function tick() {
  frame++;
  elapsed += 1 / 60;

  // Nudge enemies along the path each frame so entities.ts has real dist deltas to blend
  // between via the alpha it is handed below.
  for (const enemy of enemies) {
    if (enemy.dead) continue;
    enemy.dist += (enemy.kind === "boss" ? 20 : 40) * (1 / 60);
  }

  const state: SimState = {
    stageId: stage.id,
    phase: "running",
    wave: 1,
    waveSpawnQueue: [],
    spawnTimer: 0,
    interwaveTimer: 0,
    mana: 100,
    manaCap: 200,
    leaks,
    kills: 3,
    elapsed,
    enemies,
    towers,
    projectiles,
    seed: 1,
    nextId: 200,
  };

  // Sweeps 0..1 every 16 frames — enough to see interpolation smooth motion out visually
  // rather than judder, without a real fixed-step loop driving it.
  const alpha = (frame % 16) / 16;

  renderer.render(state, alpha, buildEvents(frame), { stage, reducedMotion });
  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);
