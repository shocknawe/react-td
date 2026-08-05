/**
 * Digit glyphs 0-9, pre-rendered per element tint to an offscreen atlas and blitted for
 * floating damage numbers. design/scene.html called `strokeText`/`fillText` once per
 * damage number per frame; with dozens of numbers alive at once that is the single most
 * expensive canvas op in the game (per the render module's brief). Baking each glyph once
 * and blitting it turns every number into a handful of `drawImage` calls instead.
 */
import type { ElementId } from "../game/types";
import { ELEMENT_THEME } from "../ui/theme/elements";
import { getContext2D } from "./canvas";

const DIGITS = "0123456789";
const CELL_W = 15;
const CELL_H = 24;
const FONT = "700 20px ui-monospace, SFMono-Regular, Menlo, monospace";

export type DigitAtlas = { canvas: HTMLCanvasElement; cellW: number; cellH: number };
export type DigitAtlases = Record<ElementId, DigitAtlas>;

export function buildDigitAtlases(): DigitAtlases {
  const result = {} as DigitAtlases;
  for (const el of Object.keys(ELEMENT_THEME) as ElementId[]) {
    result[el] = buildAtlas(el);
  }
  return result;
}

function buildAtlas(el: ElementId): DigitAtlas {
  const theme = ELEMENT_THEME[el];
  const canvas = document.createElement("canvas");
  canvas.width = CELL_W * DIGITS.length;
  canvas.height = CELL_H;
  const ctx = getContext2D(canvas);
  ctx.font = FONT;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";

  for (let i = 0; i < DIGITS.length; i++) {
    const cx = i * CELL_W + CELL_W / 2;
    const cy = CELL_H / 2;
    const digit = DIGITS[i]!;
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(7,10,20,.9)";
    ctx.strokeText(digit, cx, cy);
    ctx.fillStyle = theme.glow;
    ctx.fillText(digit, cx, cy);
  }

  return { canvas, cellW: CELL_W, cellH: CELL_H };
}

/** Blit a non-negative integer using the pre-baked atlas instead of fillText/strokeText. */
export function drawNumber(
  ctx: CanvasRenderingContext2D,
  atlases: DigitAtlases,
  el: ElementId,
  value: number,
  x: number,
  y: number,
  alpha: number,
): void {
  const atlas = atlases[el];
  const digits = String(Math.max(0, Math.round(value)));
  const totalW = digits.length * atlas.cellW;

  ctx.save();
  ctx.globalAlpha = alpha;
  let dx = x - totalW / 2;
  for (const ch of digits) {
    const d = DIGITS.indexOf(ch);
    if (d >= 0) {
      ctx.drawImage(
        atlas.canvas,
        d * atlas.cellW,
        0,
        atlas.cellW,
        atlas.cellH,
        dx,
        y - atlas.cellH / 2,
        atlas.cellW,
        atlas.cellH,
      );
    }
    dx += atlas.cellW;
  }
  ctx.restore();
}
