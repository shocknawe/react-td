/**
 * Economy constants, DERIVED from stage1's wave tables rather than copied from the
 * mockup. The mockup shows a 200 mana cap with mage costs 100-120 and three upgrade
 * tiers — against a 200 cap, one tower already eats half the bar and a second tower
 * plus any upgrade is impossible without waiting out several waves of regen. That
 * starves the upgrade economy the mockup itself draws (three tiers per mage).
 *
 * DERIVATION (see stage1.ts for the source wave tables):
 *
 * 1. Tower costs (data/mages.ts): tier-1 60-75 mana; full tier-1->2->3 upgrade path
 *    265-320 mana total per mage.
 * 2. Wave income (data/enemies.ts bounties x stage1 wave composition, all 15 waves):
 *    total bounty across the stage ~= 1180 mana, average ~= 79 mana/wave, ramping from
 *    24 (wave 1) to 154 (wave 14) before the boss wave's 116. Average wave duration
 *    (spawn spread + last enemy's travel time) is roughly 20-25s.
 *
 * STARTING_MANA = 80: enough to place exactly one tier-1 tower of *any* element
 *    (60-75) before wave 1 starts, with a small buffer left over. Nobody should stare
 *    at an empty board because the cheapest option is unaffordable.
 *
 * MANA_CAP = 180: roughly the cost of two average tier-1 towers (~135) plus room for
 *    a first upgrade, but well under a single mage's full 265-320 upgrade path — so
 *    saving is meaningful (you can't idle to the cap and buy everything) without being
 *    so tight that a cleared wave's bounty overflows and is wasted. About 2.3x average
 *    per-wave income, so a player who skips spending for ~2 waves caps out rather than
 *    banking indefinitely.
 *
 * MANA_REGEN_PER_SEC = 1.2: sized so passive regen contributes roughly a third of a
 *    wave's income (1.2 * ~25s ~= 30 mana against an average 79 mana/wave bounty) —
 *    a supplement to kills, not a replacement for them. A player who places zero
 *    towers still trickles toward affording one, but clearing waves is always the
 *    faster path, which is the intended incentive.
 */
import type { EnemyKind } from "../game/types";

export const STARTING_MANA = 80;
export const MANA_CAP = 180;
export const MANA_REGEN_PER_SEC = 1.2;

/**
 * Towers sell for half of everything spent reaching their current tier. Shared between
 * game/sim.ts (which actually pays this out) and ui/data/mageFixtures.ts (which prints
 * the SELL button's refund amount) so the two can't drift — they used to: the sim paid
 * 0.5 while the UI displayed a refund computed at 0.6.
 */
export const SELL_REFUND_RATE = 0.5;

/**
 * Mana granted for skipping an interwave breather early. Shared between game/sim.ts
 * (which pays it out) and ui/components/InterwaveOverlay.tsx (which advertises it on
 * the skip button) for the same reason SELL_REFUND_RATE is here — sim.ts's
 * "skipInterwave" command used to not grant this at all, while the button promised
 * "+30 mana" unconditionally.
 */
export const SKIP_INTERWAVE_BONUS_MANA = 30;

/** Kill bounties, derived alongside the constants above. Consumed by data/enemies.ts. */
export const BOUNTIES: Record<EnemyKind, number> = {
  shade: 4,
  scout: 5,
  armored: 8,
  boss: 70,
};
