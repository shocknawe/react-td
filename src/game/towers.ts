/**
 * Tower targeting, tier stats, and damage math. Pure query functions — sim.ts owns
 * cooldown countdown, projectile spawning, and applying the computed damage.
 */
import type { ElementId, Enemy, EnemyKind, MageDef, MageTier, Tower } from "./types";
import type { Path } from "./path";
import { positionAt } from "./path";
import { elementMultiplier } from "./rules/elements";

/**
 * Stats for `tier` (1-based). Out-of-range tiers clamp to the nearest valid tier rather
 * than throwing — callers that need to reject an over-tier upgrade check tower.tier
 * against mage.tiers.length themselves (sim.ts, RejectReason "maxTier").
 */
export function tierStats(mage: MageDef, tier: number): MageTier {
  const idx = Math.min(Math.max(tier - 1, 0), mage.tiers.length - 1);
  const stats = mage.tiers[idx];
  if (!stats) throw new Error(`tierStats: mage ${mage.id} has no tiers`);
  return stats;
}

/**
 * The enemy this tower should fire at: alive, within `range` of tower.pos, furthest
 * along the path (so leakers about to reach the crystal are prioritised); ties broken
 * by whichever is physically nearer the tower. Returns null if nothing qualifies.
 */
export function findTarget(tower: Tower, enemies: readonly Enemy[], path: Path, range: number): Enemy | null {
  let best: Enemy | null = null;
  let bestDistSq = Infinity;
  for (const enemy of enemies) {
    if (enemy.dead) continue;
    const pos = positionAt(path, enemy.dist);
    const dx = pos.x - tower.pos.x;
    const dy = pos.y - tower.pos.y;
    const distSq = dx * dx + dy * dy;
    if (distSq > range * range) continue;
    if (!best) {
      best = enemy;
      bestDistSq = distSq;
      continue;
    }
    if (enemy.dist > best.dist) {
      best = enemy;
      bestDistSq = distSq;
    } else if (enemy.dist === best.dist && distSq < bestDistSq) {
      best = enemy;
      bestDistSq = distSq;
    }
  }
  return best;
}

/** Damage after element multiplier and flat armor reduction, floored at 0. */
export function computeDamage(baseDamage: number, el: ElementId, kind: EnemyKind, armor: number): number {
  const raw = baseDamage * elementMultiplier(el, kind);
  return Math.max(0, raw - armor);
}

/** Total mana spent to reach `tier` (tier 1 cost + every upgradeCost up to `tier`). */
export function towerValue(mage: MageDef, tier: number): number {
  let total = mage.cost;
  for (let t = 2; t <= tier; t++) {
    const stats = mage.tiers[t - 1];
    total += stats ? stats.upgradeCost : 0;
  }
  return total;
}
