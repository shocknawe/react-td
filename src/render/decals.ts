/**
 * Per-element magic-circle decal drawn under each tower, chosen by tier (1/2/3). Ported
 * from design/scene.html's single `CIRC[el]` tier-3-only sprite, generalised to all three
 * tiers and pre-rendered to offscreen canvases so the per-frame cost is a single
 * `drawImage` per tower, never a re-stroked arc.
 *
 * Every decal slot starts as a cheap vector fallback baked immediately (synchronously),
 * then gets swapped in-place for the real art once its image loads — so a slow or failed
 * network load never leaves a tower undecorated.
 */
import type { ElementId } from "../game/types";
import { ELEMENT_THEME } from "../ui/theme/elements";
import { getContext2D } from "./canvas";

const TIERS = [1, 2, 3] as const;
type Tier = (typeof TIERS)[number];

const DECAL_SIZE = 84; // world units

function decalSrc(el: ElementId, tier: Tier): string {
  return `${import.meta.env.BASE_URL}assets/circles/128/${el}-${tier}.png`;
}

export type Decals = {
  draw(ctx: CanvasRenderingContext2D, el: ElementId, tier: number, pos: { x: number; y: number }): void;
};

export function createDecals(): Decals {
  const cache = new Map<string, HTMLCanvasElement>();

  for (const el of Object.keys(ELEMENT_THEME) as ElementId[]) {
    for (const tier of TIERS) {
      const key = cacheKey(el, tier);
      cache.set(key, renderVectorDecal(el, tier));
      loadBakedDecal(el, tier, (baked) => cache.set(key, baked));
    }
  }

  return {
    draw(ctx, el, tierRaw, pos) {
      const tier = clampTier(tierRaw);
      const sprite = cache.get(cacheKey(el, tier));
      if (!sprite) return;
      ctx.drawImage(sprite, pos.x - DECAL_SIZE / 2, pos.y - DECAL_SIZE / 2);
    },
  };
}

function cacheKey(el: ElementId, tier: Tier): string {
  return `${el}-${tier}`;
}

function clampTier(tier: number): Tier {
  if (tier >= 3) return 3;
  if (tier <= 1) return 1;
  return 2;
}

function loadBakedDecal(el: ElementId, tier: Tier, onReady: (canvas: HTMLCanvasElement) => void): void {
  const img = new Image();
  img.onload = () => {
    if (img.naturalWidth <= 0) return;
    const canvas = document.createElement("canvas");
    canvas.width = DECAL_SIZE;
    canvas.height = DECAL_SIZE;
    const g = getContext2D(canvas);
    g.drawImage(img, 0, 0, DECAL_SIZE, DECAL_SIZE);
    onReady(canvas);
  };
  // onerror: leave the vector fallback already sitting in the cache — degrade gracefully.
  img.src = decalSrc(el, tier);
}

function renderVectorDecal(el: ElementId, tier: Tier): HTMLCanvasElement {
  const theme = ELEMENT_THEME[el];
  const canvas = document.createElement("canvas");
  canvas.width = DECAL_SIZE;
  canvas.height = DECAL_SIZE;
  const g = getContext2D(canvas);
  const cx = DECAL_SIZE / 2;
  const cy = DECAL_SIZE / 2;

  g.globalAlpha = 0.8;
  for (let i = 0; i < tier; i++) {
    const r = DECAL_SIZE * (0.2 + i * 0.14);
    g.strokeStyle = i === tier - 1 ? theme.light : theme.base;
    g.lineWidth = 2;
    g.beginPath();
    g.arc(cx, cy, r, 0, Math.PI * 2);
    g.stroke();
  }

  const points = 4 + tier * 2;
  g.strokeStyle = theme.glow;
  g.lineWidth = 1;
  g.beginPath();
  for (let i = 0; i < points; i++) {
    const a = (Math.PI * 2 * i) / points;
    const r = DECAL_SIZE * 0.36;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.closePath();
  g.stroke();
  g.globalAlpha = 1;

  return canvas;
}
