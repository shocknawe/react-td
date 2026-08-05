/**
 * Element RULES only — multipliers and status behaviour. No colours, no labels,
 * no icons. Presentation lives in src/ui/theme/elements.ts, keyed by the same
 * ElementId. Splitting these keeps game/ free of presentation (Phase 3 #16).
 */
import type { ElementId, EnemyKind } from "../types";

/** Damage multiplier for element vs enemy kind. 1 = neutral. */
const CHART: Record<ElementId, Partial<Record<EnemyKind, number>>> = {
  fire:      { shade: 1.25, armored: 0.75 },
  ice:       { scout: 1.25, boss: 0.9 },
  lightning: { armored: 1.4, shade: 0.85 },
  wind:      { scout: 1.35, armored: 0.8 },
};

export function elementMultiplier(el: ElementId, kind: EnemyKind): number {
  return CHART[el][kind] ?? 1;
}

/** Only ice applies slow. Kept here so game/ owns the rule, not the renderer. */
export function appliesSlow(el: ElementId): boolean {
  return el === "ice";
}

export const SLOW_FACTOR = 0.45;
