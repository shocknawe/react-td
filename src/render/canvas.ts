/**
 * Canvas setup and the scaling contract.
 *
 * The world is a fixed WORLD_W x WORLD_H box (see game/layout.ts). We fit that box into
 * whatever container the canvas lives in (CSS pixels), then multiply by devicePixelRatio
 * for the backing store so strokes stay crisp on high-DPI screens. Every draw call
 * elsewhere in render/ operates directly in WORLD units — this module is the only place
 * that knows about CSS pixels, containers or DPR.
 */
import { WORLD_H, WORLD_W } from "../game/layout";

export type Scale = {
  /** CSS pixels per world unit. */
  scale: number;
  dpr: number;
  cssW: number;
  cssH: number;
};

const MIN_BACKING_PX = 1;

/** Fit WORLD_W x WORLD_H into a containerW x containerH box. 0 if either input is non-positive. */
export function computeScale(containerW: number, containerH: number): number {
  if (!(containerW > 0) || !(containerH > 0)) return 0;
  return Math.min(containerW / WORLD_W, containerH / WORLD_H);
}

/**
 * Resize the canvas backing store and CSS box to fit `container`.
 *
 * Returns null (a no-op, existing canvas state untouched) if the container currently
 * measures zero width or height — e.g. it is mid-layout or sits inside a `display:none`
 * ancestor. Every draw call becomes silent no-op on a 0-size backing store and that looks
 * identical to a broken game, so callers must not blindly resize on every tick; use
 * `attachResize` instead, which retries via ResizeObserver once the container gains size.
 */
export function resize(canvas: HTMLCanvasElement, container: HTMLElement): Scale | null {
  const rect = container.getBoundingClientRect();
  const scale = computeScale(rect.width, rect.height);
  if (scale <= 0) return null;

  const dpr = typeof window !== "undefined" && window.devicePixelRatio > 0 ? window.devicePixelRatio : 1;
  const cssW = WORLD_W * scale;
  const cssH = WORLD_H * scale;
  const backingW = Math.max(MIN_BACKING_PX, Math.round(cssW * dpr));
  const backingH = Math.max(MIN_BACKING_PX, Math.round(cssH * dpr));

  // Reassigning canvas.width/height clears the backing store even when the value is
  // unchanged, so only touch it when the pixel size actually moved.
  if (canvas.width !== backingW) canvas.width = backingW;
  if (canvas.height !== backingH) canvas.height = backingH;
  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${cssH}px`;

  const ctx = canvas.getContext("2d");
  if (ctx) {
    // From here on, draw calls in WORLD units map straight onto the backing store.
    ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
  }
  return { scale, dpr, cssW, cssH };
}

export function getContext2D(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("render/canvas: 2D context unavailable");
  return ctx;
}

/**
 * Keep the canvas sized to `container` as it changes. Debounced so something like a
 * mobile browser chrome show/hide — which can fire dozens of resize notifications a
 * second — does not reallocate the backing store on every one of them, only once the
 * size settles.
 *
 * Returns a cleanup function that disconnects the observer and cancels any pending
 * debounce timer.
 */
export function attachResize(
  canvas: HTMLCanvasElement,
  container: HTMLElement,
  onResize?: (scale: Scale) => void,
  debounceMs = 120,
): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const apply = () => {
    const scale = resize(canvas, container);
    if (scale) onResize?.(scale);
  };

  // The first paint should not have to wait out the debounce window.
  apply();

  const observer = new ResizeObserver(() => {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(apply, debounceMs);
  });
  observer.observe(container);

  return () => {
    if (timer !== null) clearTimeout(timer);
    observer.disconnect();
  };
}
