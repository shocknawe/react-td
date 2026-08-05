/**
 * Ground pattern fill, the procedural path (solid stroke, lighter inner stroke, 2px gold
 * inner rule) and the hex socket markers. Ported from design/scene.html's `drawPath` and
 * ground-fill block, restructured to draw from stage geometry instead of module-level
 * globals, and to pre-render the (previously per-frame, per-tower) socket stroke to an
 * offscreen sprite drawn once at load and blitted every frame after.
 */
import type { StageDef, Vec2 } from "../game/types";
import { CELL, WORLD_H, WORLD_W, cellCentre } from "../game/layout";
import { getContext2D } from "./canvas";

export type FieldGeometry = {
  /** World-space path polyline, enemies walk this. */
  path: Vec2[];
  /** World-space buildable socket centres. */
  sockets: Vec2[];
  totalLength: number;
  /** World position at `dist` along the path, clamped to [0, totalLength]. */
  pointAt(dist: number): Vec2;
};

type Segment = { x: number; y: number; dx: number; dy: number; len: number; cum: number };

/** Convert a stage's grid-space path/sockets into world-space geometry, once. */
export function buildFieldGeometry(stage: StageDef): FieldGeometry {
  const path = stage.path.map((p) => cellCentre(p.x, p.y));
  const sockets = stage.sockets.map((p) => cellCentre(p.x, p.y));

  const segs: Segment[] = [];
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i]!;
    const b = path[i + 1]!;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1e-6;
    segs.push({ x: a.x, y: a.y, dx: dx / len, dy: dy / len, len, cum: total });
    total += len;
  }

  function pointAt(dist: number): Vec2 {
    if (segs.length === 0) return path[0] ?? { x: 0, y: 0 };
    const clamped = Math.max(0, Math.min(dist, total));
    for (let i = segs.length - 1; i >= 0; i--) {
      const s = segs[i]!;
      if (clamped >= s.cum) {
        const t = Math.min(clamped - s.cum, s.len);
        return { x: s.x + s.dx * t, y: s.y + s.dy * t };
      }
    }
    return { x: segs[0]!.x, y: segs[0]!.y };
  }

  return { path, sockets, totalLength: total, pointAt };
}

const GROUND_SRC = `${import.meta.env.BASE_URL}assets/art/ground-valley-dark.png`;
/** Approximate on-screen tile footprint (world units) the design/scene.html reference used. */
const GROUND_TILE_WORLD = 210;
const GROUND_FALLBACK = "#152a1c";

const PATH_OUTER = { style: "#c9b083", width: 32 };
const PATH_INNER = { style: "#e6d4ad", width: 26 };
const PATH_RULE = { style: "rgba(138,109,43,.55)", width: 2 };

export type Field = {
  draw(ctx: CanvasRenderingContext2D, geometry: FieldGeometry): void;
};

export function createField(): Field {
  let groundLoaded = false;
  let pattern: CanvasPattern | null = null;

  const groundImg = new Image();
  groundImg.onload = () => {
    groundLoaded = true;
  };
  groundImg.onerror = () => {
    // Degrade gracefully — drawGround() falls back to a flat fill below.
    groundLoaded = false;
  };
  groundImg.src = GROUND_SRC;

  const socketSprite = buildSocketSprite();

  function ensurePattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
    if (pattern) return pattern;
    if (!groundLoaded || groundImg.naturalWidth <= 0) return null;
    pattern = ctx.createPattern(groundImg, "repeat");
    return pattern;
  }

  function drawGround(ctx: CanvasRenderingContext2D) {
    const p = ensurePattern(ctx);
    if (p) {
      const scale = GROUND_TILE_WORLD / groundImg.naturalWidth;
      ctx.save();
      ctx.scale(scale, scale);
      ctx.fillStyle = p;
      ctx.fillRect(0, 0, WORLD_W / scale, WORLD_H / scale);
      ctx.restore();
    } else {
      ctx.fillStyle = GROUND_FALLBACK;
      ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    }
  }

  function drawPath(ctx: CanvasRenderingContext2D, path: Vec2[]) {
    if (path.length < 2) return;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    const strokePass = (style: string, width: number) => {
      ctx.strokeStyle = style;
      ctx.lineWidth = width;
      ctx.beginPath();
      const p0 = path[0]!;
      ctx.moveTo(p0.x, p0.y);
      for (let i = 1; i < path.length; i++) {
        const p = path[i]!;
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    };
    strokePass(PATH_OUTER.style, PATH_OUTER.width);
    strokePass(PATH_INNER.style, PATH_INNER.width);
    strokePass(PATH_RULE.style, PATH_RULE.width);
  }

  function drawSockets(ctx: CanvasRenderingContext2D, sockets: Vec2[]) {
    const half = socketSprite.width / 2;
    for (const s of sockets) {
      ctx.drawImage(socketSprite, s.x - half, s.y - half);
    }
  }

  return {
    draw(ctx, geometry) {
      drawGround(ctx);
      drawPath(ctx, geometry.path);
      drawSockets(ctx, geometry.sockets);
    },
  };
}

/** Pre-rendered once: a translucent gold hex outline marking an empty buildable tile. */
function buildSocketSprite(): HTMLCanvasElement {
  const size = Math.round(CELL);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const g = getContext2D(canvas);
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.42;

  g.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.closePath();
  g.fillStyle = "rgba(230,196,120,.06)";
  g.fill();
  g.strokeStyle = "rgba(230,196,120,.55)";
  g.lineWidth = 2;
  g.stroke();

  return canvas;
}
