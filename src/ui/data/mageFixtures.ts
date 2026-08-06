/**
 * UI-side mage presentation data: real MAGE_DEFS stats (src/data/mages.ts) plus the one
 * field the sim doesn't need — the atlas portrait key.
 *
 * This used to be a hand-duplicated placeholder written before data/mages.ts existed
 * (cost 100/100/120/100, none of it matching the real 70/65/75/60 balance). That drift
 * was a real, ship-blocking bug: MageCard's affordability check compares `mana` against
 * *this* file's cost, so every card read as unaffordable at the real starting mana of 80
 * — a player could never place a single tower by tapping a card (keyboard placement
 * bypassed the card entirely, which is how this went unnoticed). Deriving from MAGE_DEFS
 * instead of copying it means this can't drift out of sync with the sim again.
 *
 * Portraits are the 24-tile expression atlas committed to public/atlas/ (24 tiles, 6
 * expressions x 4 characters, 181x210 each — see design/atlas/atlas.json for the source
 * crop map).
 */
import type { ElementId, MageDef } from "../../game/types";
import { MAGE_DEFS } from "../../data/mages";
import { SELL_REFUND_RATE } from "../../data/economy";

export type Expression = "neutral" | "happy" | "profile" | "worried" | "shout" | "calm";

export type MageFixture = MageDef & {
  /** atlas filename stem, e.g. "hikari" -> public/atlas/hikari-neutral.png */
  characterKey: string;
};

/** MAGE_DEFS's `character` field (e.g. "Hikari") lowercased matches the atlas stem. */
function characterKeyFor(mage: MageDef): string {
  return mage.character.toLowerCase();
}

export const MAGE_FIXTURES: Record<ElementId, MageFixture> = Object.fromEntries(
  Object.entries(MAGE_DEFS).map(([el, mage]) => [el, { ...mage, characterKey: characterKeyFor(mage) }]),
) as Record<ElementId, MageFixture>;

export function portraitUrl(characterKey: string, expr: Expression): string {
  return `/atlas/${characterKey}-${expr}.png`;
}

export function sellRefund(mage: MageFixture, tier: number): number {
  let spent = mage.cost;
  for (let i = 1; i < tier; i++) spent += mage.tiers[i]?.upgradeCost ?? 0;
  // Matches game/sim.ts's applyCommand("sell") exactly: same rate, same rounding
  // direction (floor, not round) — the SELL button must never promise more than the
  // sim actually pays out.
  return Math.floor(spent * SELL_REFUND_RATE);
}

export function dpsForTier(mage: MageFixture, tier: number): number {
  const t = mage.tiers[tier - 1] ?? mage.tiers[0];
  if (!t) return 0;
  return Math.round(t.damage / t.cooldown);
}
