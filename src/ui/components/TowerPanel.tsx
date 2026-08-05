import type { ElementId } from "../../game/types";
import { MAGE_FIXTURES, dpsForTier, portraitUrl, sellRefund } from "../data/mageFixtures";
import { ELEMENT_THEME } from "../theme/elements";

export const MAX_TIER = 3;

export type TowerPanelSnapshot = {
  towerId: number;
  element: ElementId;
  tier: number;
};

export type TowerPanelProps = {
  tower: TowerPanelSnapshot;
  mana: number;
  onUpgrade: () => void;
  onSell: () => void;
};

/**
 * Replaces the mage-card rail in the same slot when a placed tower is selected — no
 * modal, per design/index.html #5. Tier pips mirror the magic-circle rings drawn on the
 * field so tier reads the same in both places.
 */
export function TowerPanel({ tower, mana, onUpgrade, onSell }: TowerPanelProps) {
  const mage = MAGE_FIXTURES[tower.element];
  const theme = ELEMENT_THEME[tower.element];
  const dps = dpsForTier(mage, tower.tier);
  const range = mage.tiers[tower.tier - 1]?.range ?? mage.tiers[0]?.range ?? 0;
  const isMax = tower.tier >= MAX_TIER;
  const upgradeCost = mage.tiers[tower.tier]?.upgradeCost ?? 0;
  const refund = sellRefund(mage, tower.tier);
  const canAfford = mana >= upgradeCost;

  return (
    <div className="towerpanel">
      <img src={portraitUrl(mage.characterKey, "profile")} alt="" />
      <div className="tp-body">
        <div className="tp-name">
          {mage.name} <span style={{ color: "var(--ink-3)", fontSize: 11 }}>Tier {tower.tier}</span>
        </div>
        <span className="kanji" style={{ margin: "-2px 0 0" }}>
          {mage.nameJa}
        </span>
        <div className="pips" role="img" aria-label={`Tier ${tower.tier} of ${MAX_TIER}`}>
          {Array.from({ length: MAX_TIER }, (_, i) => (
            <i key={i} className={i < tower.tier ? "on" : ""} />
          ))}
        </div>
        <div className="tp-stats">
          DPS {dps} · RNG {range} · {theme.label}
        </div>
      </div>
      <div className="tp-actions">
        {isMax ? (
          <button type="button" className="btn is-locked" disabled aria-label="Maximum tier reached">
            MAX
          </button>
        ) : (
          <button
            type="button"
            className="btn"
            disabled={!canAfford}
            onClick={onUpgrade}
            aria-label={`Upgrade to tier ${tower.tier + 1} for ${upgradeCost} mana`}
          >
            UPGRADE {upgradeCost}
          </button>
        )}
        <button type="button" className="btn" onClick={onSell} aria-label={`Sell for ${refund} mana refund`}>
          SELL +{refund}
        </button>
      </div>
    </div>
  );
}
