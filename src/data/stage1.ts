/**
 * Stage 1 — 7x12 grid, a winding path from the top edge to the bottom edge, 18
 * buildable sockets (>= the required 10), 15 waves with wave 15 the boss wave.
 *
 * Path corridor length is ~1150 world units (CELL=50); see data/economy.ts for how
 * that and the wave composition below feed the mana derivation.
 *
 * Difficulty ramps by enemy count and mix, not by sudden hp/speed spikes: shade (fast,
 * fragile) carries early waves, scout (very fast, fragile) and armored (slow, tanky)
 * are introduced gradually and mixed together from wave 9 onward, and the boss wave
 * (15) leads with a smaller escort so towers clear it before the boss itself arrives
 * (targeting always prioritises whichever enemy is furthest along the path — see
 * game/towers.ts findTarget), rather than dropping a hp/speed spike on top of a full
 * board of escorts.
 */
import type { StageDef } from "../game/types";

export const STAGE1: StageDef = {
  id: "stage1",
  name: "Windswept Approach",
  nameJa: "風の参道",
  cols: 7,
  rows: 12,
  path: [
    { x: 3, y: 0 },
    { x: 3, y: 2 },
    { x: 1, y: 2 },
    { x: 1, y: 5 },
    { x: 5, y: 5 },
    { x: 5, y: 8 },
    { x: 1, y: 8 },
    { x: 1, y: 10 },
    { x: 3, y: 10 },
    { x: 3, y: 11 },
  ],
  sockets: [
    { x: 2, y: 0 },
    { x: 4, y: 0 },
    { x: 1, y: 1 },
    { x: 4, y: 1 },
    { x: 0, y: 2 },
    { x: 0, y: 4 },
    { x: 2, y: 4 },
    { x: 3, y: 4 },
    { x: 6, y: 5 },
    { x: 4, y: 6 },
    { x: 6, y: 7 },
    { x: 2, y: 7 },
    { x: 0, y: 8 },
    { x: 4, y: 9 },
    { x: 0, y: 9 },
    { x: 1, y: 11 },
    { x: 4, y: 10 },
    { x: 2, y: 11 },
  ],
  waves: [
    { delay: 2, entries: [{ kind: "shade", count: 6, spacing: 1.0 }] },
    { delay: 4, entries: [{ kind: "shade", count: 8, spacing: 0.9 }] },
    {
      delay: 4,
      entries: [
        { kind: "shade", count: 6, spacing: 0.9 },
        { kind: "scout", count: 4, spacing: 0.8 },
      ],
    },
    {
      delay: 4,
      entries: [
        { kind: "shade", count: 8, spacing: 0.8 },
        { kind: "armored", count: 2, spacing: 1.1 },
      ],
    },
    {
      delay: 4,
      entries: [
        { kind: "shade", count: 6, spacing: 0.8 },
        { kind: "scout", count: 6, spacing: 0.7 },
      ],
    },
    {
      delay: 4,
      entries: [
        { kind: "armored", count: 4, spacing: 1.0 },
        { kind: "shade", count: 6, spacing: 0.7 },
      ],
    },
    {
      delay: 4,
      entries: [
        { kind: "shade", count: 10, spacing: 0.7 },
        { kind: "scout", count: 4, spacing: 0.6 },
      ],
    },
    {
      delay: 4,
      entries: [
        { kind: "armored", count: 5, spacing: 0.9 },
        { kind: "scout", count: 6, spacing: 0.6 },
      ],
    },
    {
      delay: 4,
      entries: [
        { kind: "shade", count: 8, spacing: 0.6 },
        { kind: "armored", count: 4, spacing: 0.8 },
        { kind: "scout", count: 4, spacing: 0.6 },
      ],
    },
    {
      delay: 4,
      entries: [
        { kind: "armored", count: 6, spacing: 0.8 },
        { kind: "scout", count: 8, spacing: 0.55 },
      ],
    },
    {
      delay: 4,
      entries: [
        { kind: "shade", count: 10, spacing: 0.55 },
        { kind: "armored", count: 5, spacing: 0.75 },
        { kind: "scout", count: 6, spacing: 0.5 },
      ],
    },
    {
      delay: 4,
      entries: [
        { kind: "armored", count: 8, spacing: 0.7 },
        { kind: "scout", count: 8, spacing: 0.5 },
      ],
    },
    {
      delay: 5,
      entries: [
        { kind: "shade", count: 12, spacing: 0.5 },
        { kind: "armored", count: 6, spacing: 0.65 },
        { kind: "scout", count: 8, spacing: 0.45 },
      ],
    },
    {
      delay: 5,
      entries: [
        { kind: "armored", count: 10, spacing: 0.6 },
        { kind: "scout", count: 10, spacing: 0.45 },
        { kind: "shade", count: 6, spacing: 0.45 },
      ],
    },
    {
      delay: 6,
      entries: [
        { kind: "shade", count: 6, spacing: 0.5 },
        { kind: "armored", count: 4, spacing: 0.6 },
        { kind: "boss", count: 1, spacing: 1.0 },
      ],
    },
  ],
};
