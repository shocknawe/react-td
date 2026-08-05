/**
 * Towers and enemies, drawn from SimState. Ported from design/scene.html's tower and
 * enemy drawing blocks, restructured to read tower/enemy arrays instead of module-level
 * globals and with an image fallback added (the reference already checked
 * `img.naturalWidth` before drawing; here a missing image draws a vector primitive
 * instead of nothing).
 *
 * SimState only carries an enemy's current `dist` along the path, not a previous
 * snapshot — so smooth interpolation between fixed sim steps ("Fix Your Timestep"-style)
 * is bookkept here: each enemy id remembers the last two *distinct* dist values it was
 * seen with, and draw() blends between them with `alpha`. That keeps render/ self-
 * contained without needing render to reach into game/ internals or mutate SimState.
 */
import type { Enemy, EnemyKind, ElementId, Tower, Vec2 } from "../game/types";
import { CELL } from "../game/layout";
import { ELEMENT_THEME } from "../ui/theme/elements";
import type { Decals } from "./decals";
import type { FieldGeometry } from "./field";

function towerSrc(el: ElementId): string {
  return `${import.meta.env.BASE_URL}assets/art/tower-${el}.png`;
}
function enemySrc(kind: EnemyKind): string {
  return `${import.meta.env.BASE_URL}assets/art/enemy-${kind}.png`;
}

const TOWER_DRAW_SIZE = CELL * 1.5;

/** Presentational only — draw sizes are a render concern, not sim data. */
const ENEMY_ART: Record<EnemyKind, { size: number }> = {
  shade: { size: 30 },
  armored: { size: 34 },
  scout: { size: 27 },
  boss: { size: 50 },
};

const ENEMY_FALLBACK_COLOR: Record<EnemyKind, string> = {
  shade: "#5b4a86",
  armored: "#8a8a92",
  scout: "#c8944a",
  boss: "#8a2233",
};

type ImageSlot = { img: HTMLImageElement; ready: boolean };

function loadImage(src: string): ImageSlot {
  const slot: ImageSlot = { img: new Image(), ready: false };
  slot.img.onload = () => {
    slot.ready = slot.img.naturalWidth > 0;
  };
  slot.img.onerror = () => {
    slot.ready = false;
  };
  slot.img.src = src;
  return slot;
}

export type Entities = {
  drawTowers(ctx: CanvasRenderingContext2D, towers: readonly Tower[], decals: Decals): void;
  drawEnemies(
    ctx: CanvasRenderingContext2D,
    enemies: readonly Enemy[],
    field: FieldGeometry,
    alpha: number,
  ): void;
  destroy(): void;
};

export function createEntities(): Entities {
  const towerImages: Record<ElementId, ImageSlot> = {
    fire: loadImage(towerSrc("fire")),
    ice: loadImage(towerSrc("ice")),
    lightning: loadImage(towerSrc("lightning")),
    wind: loadImage(towerSrc("wind")),
  };
  const enemyImages: Record<EnemyKind, ImageSlot> = {
    shade: loadImage(enemySrc("shade")),
    armored: loadImage(enemySrc("armored")),
    scout: loadImage(enemySrc("scout")),
    boss: loadImage(enemySrc("boss")),
  };

  const motion = new Map<number, { prev: number; curr: number }>();

  function drawTowers(ctx: CanvasRenderingContext2D, towers: readonly Tower[], decals: Decals) {
    for (const tower of towers) {
      decals.draw(ctx, tower.el, tower.tier, tower.pos);

      const slot = towerImages[tower.el];
      const size = TOWER_DRAW_SIZE;
      if (slot.ready) {
        ctx.drawImage(slot.img, tower.pos.x - size / 2, tower.pos.y - size * 0.86, size, size);
      } else {
        drawTowerFallback(ctx, tower, size);
      }
      if (tower.tier > 1) drawTierPips(ctx, tower);
    }
  }

  function drawEnemies(
    ctx: CanvasRenderingContext2D,
    enemies: readonly Enemy[],
    field: FieldGeometry,
    alpha: number,
  ) {
    const live = new Set<number>();
    for (const enemy of enemies) {
      if (enemy.dead) continue;
      live.add(enemy.id);

      let m = motion.get(enemy.id);
      if (!m) {
        m = { prev: enemy.dist, curr: enemy.dist };
        motion.set(enemy.id, m);
      } else if (m.curr !== enemy.dist) {
        m.prev = m.curr;
        m.curr = enemy.dist;
      }
      const dist = m.prev + (m.curr - m.prev) * alpha;
      const pos = field.pointAt(dist);
      drawEnemy(ctx, enemy, pos);
    }
    for (const id of motion.keys()) {
      if (!live.has(id)) motion.delete(id);
    }
  }

  function drawEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy, pos: Vec2) {
    const size = ENEMY_ART[enemy.kind].size;
    const slot = enemyImages[enemy.kind];
    if (slot.ready) {
      ctx.drawImage(slot.img, pos.x - size / 2, pos.y - size / 2 - size * 0.15, size, size);
    } else {
      drawEnemyFallback(ctx, enemy, pos, size);
    }
    if (enemy.hp < enemy.maxHp) drawHpBar(ctx, enemy, pos, size);
    if (enemy.slow > 0) drawSlowRing(ctx, pos, size);
  }

  return {
    drawTowers,
    drawEnemies,
    destroy() {
      motion.clear();
    },
  };
}

function drawTowerFallback(ctx: CanvasRenderingContext2D, tower: Tower, size: number) {
  const theme = ELEMENT_THEME[tower.el];
  ctx.fillStyle = theme.base;
  ctx.strokeStyle = theme.light;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(tower.pos.x, tower.pos.y - size * 0.3, size * 0.32, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function drawTierPips(ctx: CanvasRenderingContext2D, tower: Tower) {
  const theme = ELEMENT_THEME[tower.el];
  const n = Math.min(tower.tier - 1, 2);
  const y = tower.pos.y - TOWER_DRAW_SIZE * 0.95;
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = theme.glow;
    ctx.beginPath();
    ctx.arc(tower.pos.x - 5 + i * 10, y, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawEnemyFallback(ctx: CanvasRenderingContext2D, enemy: Enemy, pos: Vec2, size: number) {
  ctx.fillStyle = ENEMY_FALLBACK_COLOR[enemy.kind];
  ctx.beginPath();
  ctx.arc(pos.x, pos.y - size * 0.15, size * 0.42, 0, Math.PI * 2);
  ctx.fill();
}

function drawHpBar(ctx: CanvasRenderingContext2D, enemy: Enemy, pos: Vec2, size: number) {
  const w = size * 0.62;
  const x = pos.x - w / 2;
  const y = pos.y - size / 2 - 12;
  const ratio = Math.max(0, enemy.hp / enemy.maxHp);
  ctx.fillStyle = "rgba(7,10,20,.75)";
  ctx.fillRect(x, y, w, 4);
  ctx.fillStyle = ratio > 0.4 ? "#4e9c63" : "#e0443c";
  ctx.fillRect(x, y, w * ratio, 4);
}

function drawSlowRing(ctx: CanvasRenderingContext2D, pos: Vec2, size: number) {
  ctx.strokeStyle = "rgba(127,180,238,.85)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, size * 0.44, 0, Math.PI * 2);
  ctx.stroke();
}
