/**
 * Static meta-screen shells (PLAN.md scope item E11a).
 *
 * FIXTURE ONLY — no backing system. Each screen is labelled in-code as a fixture so
 * nobody mistakes them for working features. They exist for visual coverage against the
 * reference mockup (design/index.html screens 4-9): the player can reach them, they look
 * right, and they say PREVIEW so the missing systems are honest.
 */
import type { CSSProperties } from "react";
import type { Screen } from "../../state/store";
import { useStore } from "../../state/store";

const SHELL_STYLE: CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  padding: "var(--s4)",
  gap: "var(--s3)",
  overflowY: "auto",
};

type ShellProps = {
  title: string;
  titleJa: string;
  blurb: string;
};

/** Common shell header + PREVIEW chip + back button. */
function ShellFrame({ title, titleJa, blurb }: ShellProps) {
  const goTo = useStore((s) => s.goTo);
  return (
    <>
      <div className="topbar">
        <button
          type="button"
          className="icon-btn"
          onClick={() => goTo("title")}
          aria-label="Back to title"
        >
          ←
        </button>
        <div className="label-en" style={{ fontSize: 14, color: "var(--gold-bright)" }}>
          {title}
        </div>
        <span className="kanji" style={{ marginLeft: "var(--s2)" }}>
          {titleJa}
        </span>
        <div className="spacer" />
        <span className="preview-chip">PREVIEW</span>
      </div>
      <div style={SHELL_STYLE}>
        <p style={{ fontSize: 12, color: "var(--ink-2)", lineHeight: 1.6 }}>{blurb}</p>
        {/* FIXTURE — no backing system */}
        <p className="form-shell-note">
          FIXTURE — no backing system. Reachable for visual coverage only.
        </p>
      </div>
    </>
  );
}

/** Results screen — shown after victory or defeat. Real data comes from store.results. */
function Results() {
  const results = useStore((s) => s.results);
  const goTo = useStore((s) => s.goTo);
  const startBattle = useStore((s) => s.startBattle);

  if (!results) {
    return (
      <div style={SHELL_STYLE}>
        <p style={{ fontSize: 12, color: "var(--ink-3)" }}>No result recorded.</p>
        <button type="button" className="btn btn-primary" onClick={() => goTo("stageSelect")}>
          BACK TO STAGES
        </button>
      </div>
    );
  }

  const isWin = results.outcome === "victory";
  const stars = "★".repeat(results.stars) + "☆".repeat(3 - results.stars);
  const headerColor = isWin ? "var(--gold-bright)" : "var(--danger)";

  return (
    <>
      <div className="topbar">
        <div className="spacer" />
        <div className="label-en" style={{ fontSize: 16, color: headerColor }}>
          {isWin ? "VICTORY" : "DEFEAT"}
        </div>
        <div className="spacer" />
      </div>
      <div style={SHELL_STYLE}>
        <div className="bignum" style={{ color: headerColor }}>
          WAVE {results.wave} / {results.totalWaves}
        </div>
        {!isWin && results.leakerKind && (
          <p style={{ fontSize: 12, color: "var(--ink-2)", textAlign: "center" }}>
            Crystal breached by {results.leakerKind}.
          </p>
        )}
        {isWin && (
          <>
            <div className="stars" aria-label={`${results.stars} out of 3 stars`}>
              {stars.split("").map((c, i) => (
                <span key={i} className={c === "☆" ? "off" : ""}>
                  {c}
                </span>
              ))}
            </div>
            {results.isPersonalBest && (
              <p style={{ fontSize: 11, color: "var(--gold)", textAlign: "center" }}>
                NEW BEST
              </p>
            )}
          </>
        )}
        <div className="panel" style={{ padding: "var(--s3)", marginTop: "var(--s3)" }}>
          <div className="stat-row">
           Leaks remaining <span className="num">{results.leaksRemaining} / 3</span>
          </div>
          <div className="stat-row">
            Kills <span className="num">{useStore.getState().kills}</span>
          </div>
          <div className="stat-row">
            Time <span className="num">{results.elapsed.toFixed(1)}s</span>
          </div>
          {results.mvpElement && (
            <div className="stat-row">
              MVP <span className="num">{results.mvpElement} · {results.mvpDamageSharePct}%</span>
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: "var(--s2)", marginTop: "var(--s4)" }}>
          {isWin && (
            <button
              type="button"
              className="btn btn-primary"
              style={{ flex: 1 }}
              onClick={() => {
                startBattle(results.stageId, results.totalWaves, false);
              }}
            >
              REPLAY
            </button>
          )}
          {!isWin && (
            <button
              type="button"
              className="btn btn-primary"
              style={{ flex: 1 }}
              onClick={() => {
                startBattle(results.stageId, results.totalWaves, false);
              }}
            >
              RETRY
            </button>
          )}
          <button
            type="button"
            className="btn"
            style={{ flex: 1 }}
            onClick={() => goTo("stageSelect")}
          >
            STAGES
          </button>
        </div>
      </div>
    </>
  );
}

/** Pick the right shell for a meta screen. */
function shellFor(screen: Screen): React.ReactNode {
  switch (screen) {
    case "shop":
      return (
        <ShellFrame
          title="SHOP"
          titleJa="ショップ"
          blurb="Spend mana crystals on packs and upgrades. No real-money integration — fixture prices only."
        />
      );
    case "inventory":
      return (
        <ShellFrame
          title="INVENTORY"
          titleJa="所持品"
          blurb="Materials, gear and consumables earned from stages. Nothing here is consumed yet."
        />
      );
    case "quests":
      return (
        <ShellFrame
          title="MISSIONS"
          titleJa="クエスト"
          blurb="Daily, weekly and main-story objectives. No reset clock — fixture list only."
        />
      );
    case "team":
      return (
        <ShellFrame
          title="SQUAD"
          titleJa="パーティ"
          blurb="Compose a squad and pick a leader skill. No squad persistence yet — fixture roster only."
        />
      );
    default:
      return null;
  }
}

export { shellFor, Results };