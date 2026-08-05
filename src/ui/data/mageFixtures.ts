/**
 * UI-side mage FIXTURE data.
 *
 * src/data/mages.ts (the real, balance-tuned source of truth) is owned by another agent
 * and does not exist yet. This file is a UI-owned placeholder with the same shape as
 * game/types.ts's MageDef so swapping in the real data later is a one-line import change,
 * not a rewrite of every screen that reads mage names/costs/portraits.
 *
 * Portraits are the 24-tile expression atlas committed to public/atlas/ (24 tiles, 6
 * expressions x 4 characters, 181x210 each — see design/atlas/atlas.json for the source
 * crop map).
 */
import type { ElementId, MageDef } from "../../game/types";

export type Expression = "neutral" | "happy" | "profile" | "worried" | "shout" | "calm";

export type MageFixture = MageDef & {
  /** atlas filename stem, e.g. "hikari" -> public/atlas/hikari-neutral.png */
  characterKey: string;
};

export const MAGE_FIXTURES: Record<ElementId, MageFixture> = {
  fire: {
    id: "fire",
    name: "Red Mage",
    nameJa: "レッドメイジ",
    character: "Hikari",
    characterKey: "hikari",
    cost: 100,
    tiers: [
      { damage: 28, cooldown: 0.55, range: 130, upgradeCost: 0 },
      { damage: 62, cooldown: 0.5, range: 150, upgradeCost: 120 },
      { damage: 120, cooldown: 0.45, range: 170, upgradeCost: 220 },
    ],
  },
  ice: {
    id: "ice",
    name: "Frost Mage",
    nameJa: "フロストメイジ",
    character: "Aoi",
    characterKey: "aoi",
    cost: 100,
    tiers: [
      { damage: 18, cooldown: 0.85, range: 140, upgradeCost: 0, slowDuration: 1.1 },
      { damage: 38, cooldown: 0.8, range: 155, upgradeCost: 120, slowDuration: 1.3 },
      { damage: 70, cooldown: 0.75, range: 175, upgradeCost: 220, slowDuration: 1.6 },
    ],
  },
  lightning: {
    id: "lightning",
    name: "Storm Mage",
    nameJa: "ストームメイジ",
    character: "Kai",
    characterKey: "kai",
    cost: 120,
    tiers: [
      { damage: 22, cooldown: 0.4, range: 150, upgradeCost: 0 },
      { damage: 48, cooldown: 0.35, range: 165, upgradeCost: 140 },
      { damage: 92, cooldown: 0.3, range: 185, upgradeCost: 240 },
    ],
  },
  wind: {
    id: "wind",
    name: "Gale Mage",
    nameJa: "ゲイルメイジ",
    character: "Takumi",
    characterKey: "takumi",
    cost: 100,
    tiers: [
      { damage: 20, cooldown: 0.7, range: 145, upgradeCost: 0 },
      { damage: 44, cooldown: 0.65, range: 160, upgradeCost: 120 },
      { damage: 84, cooldown: 0.6, range: 180, upgradeCost: 220 },
    ],
  },
};

export function portraitUrl(characterKey: string, expr: Expression): string {
  return `/atlas/${characterKey}-${expr}.png`;
}

export function sellRefund(mage: MageFixture, tier: number): number {
  let spent = mage.cost;
  for (let i = 1; i < tier; i++) spent += mage.tiers[i]?.upgradeCost ?? 0;
  return Math.round(spent * 0.6);
}

export function dpsForTier(mage: MageFixture, tier: number): number {
  const t = mage.tiers[tier - 1] ?? mage.tiers[0];
  if (!t) return 0;
  return Math.round(t.damage / t.cooldown);
}
