import { useStore } from "../../state/store";
import { ELEMENT_THEME } from "../theme/elements";
import type { ElementId } from "../../game/types";
import { MAGE_FIXTURES, portraitUrl } from "../data/mageFixtures";

type DossierFlavor = {
  stats: { hp: number; atk: number; int: number; def: number; spd: number };
  skillName: string;
  skillNameJa: string;
  skillDesc: string;
};

/** Flavour-only dossier content — not sim-load-bearing, purely for the info screen. */
const DOSSIER: Record<ElementId, DossierFlavor> = {
  fire: {
    stats: { hp: 1250, atk: 320, int: 450, def: 120, spd: 110 },
    skillName: "Flame Burst",
    skillNameJa: "フレイムバースト",
    skillDesc: "Deals 280% INT as fire damage to all enemies in range.",
  },
  ice: {
    stats: { hp: 1180, atk: 240, int: 480, def: 140, spd: 95 },
    skillName: "Glacial Lance",
    skillNameJa: "グレイシャルランス",
    skillDesc: "Pierces a line of enemies and applies a heavy slow for 2s.",
  },
  lightning: {
    stats: { hp: 1080, atk: 360, int: 420, def: 100, spd: 130 },
    skillName: "Chain Surge",
    skillNameJa: "チェインサージ",
    skillDesc: "Bounces between up to 4 enemies, dealing 190% INT per jump.",
  },
  wind: {
    stats: { hp: 1220, atk: 300, int: 400, def: 150, spd: 120 },
    skillName: "Gale Shred",
    skillNameJa: "ゲイルシュレッド",
    skillDesc: "Strips armor from all enemies in range for 3s.",
  },
};

const EXPRESSIONS: readonly { key: import("../data/mageFixtures").Expression; label: string }[] = [
  { key: "neutral", label: "idle" },
  { key: "happy", label: "multi-kill" },
  { key: "profile", label: "wave clear" },
  { key: "worried", label: "crystal <30%" },
  { key: "shout", label: "skill fire" },
  { key: "calm", label: "interwave" },
];

/**
 * The character dossier (design/index.html #7). Cream is allowed HERE ONLY — it reads as
 * a character-sheet page, which is what the source reference art is; everywhere else in
 * the app stays dark navy + gold chrome.
 */
export function MageInfo() {
  const element = useStore((s) => s.infoMageElement) ?? "fire";
  const goTo = useStore((s) => s.goTo);
  const mage = MAGE_FIXTURES[element];
  const theme = ELEMENT_THEME[element];
  const flavor = DOSSIER[element];

  return (
    <>
      <div className="topbar">
        <button type="button" className="icon-btn" onClick={() => goTo("stageSelect")} aria-label="Close">
          ←
        </button>
        <div className="spacer" />
        <div className="hud-pill" style={{ color: "var(--gold)" }} aria-label="5 out of 5 stars">
          ★★★★★
        </div>
      </div>

      <div className="scroll-col" style={{ display: "flex", flexDirection: "column" }}>
        <div className="dossier-header">
          <img src={portraitUrl(mage.characterKey, "neutral")} alt={`${mage.name} portrait`} />
          <div className="label-en" style={{ fontSize: 22, color: "#7d2130", marginTop: "var(--s3)" }}>
            {mage.name}
          </div>
          <span className="kanji" style={{ color: "#8a6d2b" }}>
            {mage.nameJa} ・ {mage.character}
          </span>
        </div>

        <div
          style={{
            padding: "var(--s3)",
            display: "flex",
            alignItems: "center",
            gap: "var(--s2)",
            borderBottom: "var(--hair)",
          }}
        >
          <span className="el-dot" style={{ background: theme.base, width: 18, height: 18 }} aria-hidden="true" />
          <span style={{ fontSize: 12, color: "var(--ink-2)" }}>{theme.label.toUpperCase()}</span>
          <div className="spacer" />
          <span className="num" style={{ fontSize: 12 }}>
            Lv. 20 / 30
          </span>
        </div>

        <div className="stat-grid">
          <div className="stat-row">HP <span className="num">{flavor.stats.hp.toLocaleString()}</span></div>
          <div className="stat-row">ATK <span className="num">{flavor.stats.atk}</span></div>
          <div className="stat-row">INT <span className="num">{flavor.stats.int}</span></div>
          <div className="stat-row">DEF <span className="num">{flavor.stats.def}</span></div>
          <div className="stat-row">SPD <span className="num">{flavor.stats.spd}</span></div>
        </div>

        <div className="panel" style={{ margin: "0 var(--s3) var(--s3)", padding: "var(--s3)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--s2)" }}>
            <span className="el-dot" style={{ background: theme.base, width: 24, height: 24 }} aria-hidden="true" />
            <div>
              <div className="label-en" style={{ fontSize: 13, color: "var(--gold-bright)" }}>
                {flavor.skillName} <span style={{ color: "var(--ink-3)", fontSize: 11 }}>Lv.3</span>
              </div>
              <span className="kanji" style={{ fontSize: 9 }}>
                {flavor.skillNameJa}
              </span>
            </div>
          </div>
          <p style={{ fontSize: 11, color: "var(--ink-2)", marginTop: "var(--s2)", lineHeight: 1.5 }}>
            {flavor.skillDesc}
          </p>
        </div>

        <div style={{ margin: "0 var(--s3) var(--s3)" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.16em", color: "var(--ink-3)", marginBottom: "var(--s2)" }}>
            REACTIVE PORTRAIT SET
          </div>
          <div className="expr-grid">
            {EXPRESSIONS.map((expr) => (
              <img key={expr.key} src={portraitUrl(mage.characterKey, expr.key)} alt="" title={expr.label} />
            ))}
          </div>
          <p style={{ fontSize: 10, color: "var(--ink-3)", marginTop: 6, lineHeight: 1.5 }}>
            {EXPRESSIONS.map((e) => e.label).join(" · ")}
          </p>
        </div>
      </div>

      <div className="bottom" style={{ display: "flex", gap: "var(--s2)" }}>
        <button type="button" className="btn is-locked" style={{ flex: 1, fontSize: 11 }} disabled aria-label="Level up, locked">
          🔒 LEVEL UP
        </button>
        <button type="button" className="btn is-locked" style={{ flex: 1, fontSize: 11 }} disabled aria-label="Equip, locked">
          🔒 EQUIP
        </button>
        <button
          type="button"
          className="btn btn-primary"
          style={{ flex: 1, fontSize: 11 }}
          onClick={() => goTo("stageSelect")}
        >
          CLOSE
        </button>
      </div>
    </>
  );
}
