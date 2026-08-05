/**
 * The crystal and its three-segment leak ring. Ported from design/scene.html's crystal
 * block, generalised from a hardcoded "3" to MAX_LEAKS (game/types.ts) and restructured
 * into pure functions taking a world position instead of module-level x/y constants.
 *
 * Discrete leaks, not continuous HP: spent segments stay visible, dimmed red, rather than
 * disappearing, so the player can always see how many leaks they started with.
 */
import type { Vec2 } from "../game/types";
import { MAX_LEAKS } from "../game/types";

const GLOW_RADIUS = 46;
const GEM_RADIUS = 16;
const RING_RADIUS = 26;
const RING_WIDTH = 5;
/** Radians between adjacent leak segments, for visual separation. */
const SEGMENT_GAP = 0.14;
/** Total angular sweep the ring occupies — matches the design/scene.html reference. */
const RING_SWEEP = Math.PI * 1.05;
const RING_START = -Math.PI * 0.8;

export function drawCrystal(ctx: CanvasRenderingContext2D, pos: Vec2, leaks: number): void {
  drawGlow(ctx, pos);
  drawGem(ctx, pos);
  drawLeakRing(ctx, pos, leaks);
}

function drawGlow(ctx: CanvasRenderingContext2D, pos: Vec2) {
  const grad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, GLOW_RADIUS);
  grad.addColorStop(0, "rgba(159,216,255,.5)");
  grad.addColorStop(1, "rgba(159,216,255,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, GLOW_RADIUS, 0, Math.PI * 2);
  ctx.fill();
}

function drawGem(ctx: CanvasRenderingContext2D, pos: Vec2) {
  const { x, y } = pos;
  const r = GEM_RADIUS;
  ctx.beginPath();
  ctx.moveTo(x, y - r * 1.35);
  ctx.lineTo(x + r * 0.65, y - r * 0.5);
  ctx.lineTo(x + r * 0.4, y + r * 0.75);
  ctx.lineTo(x - r * 0.4, y + r * 0.75);
  ctx.lineTo(x - r * 0.65, y - r * 0.5);
  ctx.closePath();

  const grad = ctx.createLinearGradient(x, y - r * 1.35, x, y + r * 0.75);
  grad.addColorStop(0, "#eaf6ff");
  grad.addColorStop(1, "#3f7fc4");
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = "#cfe9ff";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawLeakRing(ctx: CanvasRenderingContext2D, pos: Vec2, leaks: number) {
  const segSpan = (RING_SWEEP - SEGMENT_GAP * (MAX_LEAKS - 1)) / MAX_LEAKS;
  const healthyCount = Math.max(0, MAX_LEAKS - leaks);

  ctx.lineWidth = RING_WIDTH;
  ctx.lineCap = "round";
  for (let i = 0; i < MAX_LEAKS; i++) {
    const a0 = RING_START + i * (segSpan + SEGMENT_GAP);
    const a1 = a0 + segSpan;
    // Spent segments render dim red rather than disappearing.
    ctx.strokeStyle = i < healthyCount ? "#4e9c63" : "rgba(224,68,60,.35)";
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, RING_RADIUS, a0, a1);
    ctx.stroke();
  }
}
