import type { CSSProperties } from "react";
import type { EnemyKind } from "../../game/types";

export type InterwavePreviewEntry = { kind: EnemyKind; count: number };

export type InterwaveOverlayProps = {
  nextWave: number;
  countdownSeconds: number;
  countdownTotal: number;
  preview: readonly InterwavePreviewEntry[];
  skipBonusMana: number;
  reducedMotion: boolean;
  onReady: () => void;
  onSkip: () => void;
};

/**
 * The interwave planning beat (design/index.html #6) — a state-machine node that had no
 * UI before this file existed. Rendered as a React overlay ON TOP of the battle canvas
 * because it is discrete (a timer number + a READY affordance), not per-frame motion.
 */
export function InterwaveOverlay({
  nextWave,
  countdownSeconds,
  countdownTotal,
  preview,
  skipBonusMana,
  reducedMotion,
  onReady,
  onSkip,
}: InterwaveOverlayProps) {
  const pct = countdownTotal > 0 ? Math.max(0, Math.min(1, 1 - countdownSeconds / countdownTotal)) : 0;
  const ringStyle: CSSProperties = reducedMotion
    ? {}
    : {
        background: `conic-gradient(var(--gold) ${pct * 360}deg, rgba(212,168,67,.25) ${pct * 360}deg)`,
        borderRadius: "50%",
        padding: 3,
      };

  return (
    <div className="field-overlay" role="dialog" aria-label={`Wave ${nextWave} incoming`}>
      <div>
        <div className="banner">WAVE {nextWave} INCOMING</div>
        <span className="kanji" style={{ marginTop: 6 }}>
          第{nextWave}波
        </span>
      </div>

      {preview.length > 0 && (
        <div style={{ display: "flex", gap: "var(--s2)" }} aria-hidden="true">
          {preview.map((entry, i) => (
            <div
              key={i}
              className="panel"
              style={{ width: 38, height: 38, display: "grid", placeItems: "center", fontSize: 16 }}
              title={`${entry.count} × ${entry.kind}`}
            >
              ◆
            </div>
          ))}
        </div>
      )}
      {preview.length > 0 && (
        <div style={{ fontSize: 11, color: "var(--ink-2)" }}>
          {preview.length} types · {preview.reduce((n, e) => n + e.count, 0)} enemies
        </div>
      )}

      <div style={ringStyle}>
        <button type="button" className="btn btn-primary" onClick={onReady}>
          READY&nbsp;&nbsp;<span className="num">{Math.ceil(countdownSeconds)}s</span>
        </button>
      </div>
      <button
        type="button"
        onClick={onSkip}
        style={{
          background: "none",
          border: "none",
          font: "inherit",
          fontSize: 10,
          color: "var(--gold-dim)",
          cursor: "pointer",
          minHeight: 44,
          padding: "0 var(--s2)",
        }}
      >
        skip early for +{skipBonusMana} mana
      </button>
    </div>
  );
}
