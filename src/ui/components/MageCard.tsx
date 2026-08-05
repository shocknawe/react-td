import type { MageFixture } from "../data/mageFixtures";
import { portraitUrl } from "../data/mageFixtures";
import { ELEMENT_THEME } from "../theme/elements";

export type MageCardState = "affordable" | "unaffordable" | "selected" | "cooldown";

export type MageCardProps = {
  mage: MageFixture;
  cardState: MageCardState;
  /** 0-1 remaining, only meaningful when cardState === "cooldown" */
  cooldownRemaining?: number;
  hotkey: 1 | 2 | 3 | 4;
  onSelect: () => void;
};

/**
 * One of the four bottom-rail mage cards. Four visual states per the design spec
 * (design/index.html #4): affordable, unaffordable (desaturated + red cost), selected
 * (2px gold border, lifts 4px), cooldown (radial sweep overlay).
 *
 * Element identity is never colour-only: the badge dot is paired with the printed
 * element label and the mage's class name, so colourblind players are not locked out.
 */
export function MageCard({ mage, cardState, cooldownRemaining = 0, hotkey, onSelect }: MageCardProps) {
  const theme = ELEMENT_THEME[mage.id];
  const disabled = cardState === "unaffordable" || cardState === "cooldown";
  const sweepDeg = Math.max(0, Math.min(1, cooldownRemaining)) * 360;

  return (
    <button
      type="button"
      className={`card el-${mage.id} is-${cardState}`}
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={cardState === "selected"}
      aria-label={`${theme.label} — ${mage.name}, cost ${mage.cost} mana${
        cardState === "unaffordable" ? ", not enough mana" : ""
      }${cardState === "cooldown" ? ", recharging" : ""} (press ${hotkey})`}
    >
      <span className="badge" aria-hidden="true" />
      <span className="el-label">{theme.label}</span>
      <img src={portraitUrl(mage.characterKey, "neutral")} alt="" />
      {cardState === "cooldown" && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background: `conic-gradient(rgba(7,10,20,.82) ${sweepDeg}deg, rgba(7,10,20,.15) ${sweepDeg}deg)`,
          }}
        />
      )}
      <span className="cost num">{mage.cost}</span>
    </button>
  );
}
