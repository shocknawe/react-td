import { useState } from "react";
import { getReplayJSON } from "../state/replay";
import { useStore } from "../state/store";

export type CrashPanelProps = {
  error: unknown;
};

/**
 * Shown when the sim loop throws (PLAN.md Phase 1 A1 / Section 2 #7): rather than
 * freezing on a dead canvas, transition to a restart panel and surface the seed +
 * command log as copyable JSON — the only real "reproducible from the seed" story at
 * this scope, since nothing replays the log automatically.
 */
export function CrashPanel({ error }: CrashPanelProps) {
  const [copied, setCopied] = useState(false);
  const goTo = useStore((s) => s.goTo);

  async function copyReplay() {
    const json = getReplayJSON();
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard permission denied — fall back to a selectable textarea below
      setCopied(false);
    }
  }

  const message = error instanceof Error ? error.message : String(error);

  return (
    <div
      className="field-overlay"
      style={{ position: "relative", flex: 1, background: "var(--bg)" }}
      role="alertdialog"
      aria-label="Something broke"
    >
      <div className="banner" style={{ color: "var(--danger)" }}>
        SOMETHING BROKE
      </div>
      <p style={{ fontSize: 12, color: "var(--ink-2)", maxWidth: 300, textAlign: "center" }}>
        The simulation hit an unexpected error and stopped rather than risk corrupting your
        run. Your progress up to the last completed wave is safe.
      </p>
      <p className="num" style={{ fontSize: 11, color: "var(--ink-3)", maxWidth: 300, textAlign: "center" }}>
        {message}
      </p>
      <div style={{ display: "flex", gap: "var(--s2)" }}>
        <button type="button" className="btn" onClick={copyReplay}>
          {copied ? "COPIED" : "COPY REPLAY LOG"}
        </button>
        <button type="button" className="btn btn-primary" onClick={() => goTo("stageSelect")}>
          BACK TO STAGES
        </button>
      </div>
    </div>
  );
}
