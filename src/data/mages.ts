/**
 * Playable mages — the placeable towers. In-game class names per the mockup's
 * convention (screen 3 titles her "Red Mage", not her character name); personal names
 * from the reference character sheets are kept as flavour in `character`.
 *
 * tiers[0].upgradeCost is unused (tier 1 is bought via MageDef.cost, per the field
 * comment on MageTier) and set to 0 for clarity. tiers[1]/[2].upgradeCost are the cost
 * to upgrade *into* tier 2 / tier 3 respectively.
 */
import type { ElementId, MageDef } from "../game/types";

export const MAGE_DEFS: Record<ElementId, MageDef> = {
  fire: {
    id: "fire",
    name: "Red Mage",
    nameJa: "レッドメイジ",
    character: "Hikari",
    cost: 70,
    tiers: [
      { damage: 14, cooldown: 0.9, range: 110, upgradeCost: 0 },
      { damage: 24, cooldown: 0.8, range: 120, upgradeCost: 90 },
      { damage: 38, cooldown: 0.7, range: 130, upgradeCost: 140 },
    ],
  },
  ice: {
    id: "ice",
    name: "Frost Mage",
    nameJa: "フロストメイジ",
    character: "Aoi",
    cost: 65,
    tiers: [
      { damage: 8, cooldown: 1.1, range: 100, upgradeCost: 0, slowDuration: 1.2 },
      { damage: 13, cooldown: 1.0, range: 110, upgradeCost: 85, slowDuration: 1.5 },
      { damage: 20, cooldown: 0.9, range: 120, upgradeCost: 130, slowDuration: 1.8 },
    ],
  },
  lightning: {
    id: "lightning",
    name: "Storm Mage",
    nameJa: "ストームメイジ",
    character: "Kai",
    cost: 75,
    tiers: [
      { damage: 16, cooldown: 0.85, range: 115, upgradeCost: 0 },
      { damage: 27, cooldown: 0.75, range: 125, upgradeCost: 95 },
      { damage: 42, cooldown: 0.65, range: 135, upgradeCost: 150 },
    ],
  },
  wind: {
    id: "wind",
    name: "Gale Mage",
    nameJa: "ゲイルメイジ",
    character: "Takumi",
    cost: 60,
    tiers: [
      { damage: 11, cooldown: 0.7, range: 105, upgradeCost: 0 },
      { damage: 18, cooldown: 0.6, range: 115, upgradeCost: 80 },
      { damage: 28, cooldown: 0.5, range: 125, upgradeCost: 125 },
    ],
  },
};
