import type { SpeedOption } from "../../state/store";

export type TopBarProps = {
  wave: number;
  totalWaves: number;
  kills: number;
  speed: SpeedOption;
  paused: boolean;
  onCycleSpeed: () => void;
  onTogglePause: () => void;
  /**
   * True only during the pre-battle "ready" phase (before wave 1 has ever started).
   * Every later wave transition goes through InterwaveOverlay's READY button, which
   * only renders during `battlePhase === "interwave"` — wave 1 begins from "ready",
   * a phase that overlay never covers, so without this the sim sits at WAVE 0/N
   * forever with nothing to dispatch `startWave`.
   */
  showStartWave: boolean;
  onStartWave: () => void;
};

/** Battle HUD: wave counter, kill counter, speed toggle, pause. Crystal HP is deliberately
 * NOT here — it lives in-world as the three-segment leak ring render/ draws on the
 * crystal, so "am I losing" stays pre-attentive rather than a HUD number to parse. */
export function TopBar({
  wave,
  totalWaves,
  kills,
  speed,
  paused,
  onCycleSpeed,
  onTogglePause,
  showStartWave,
  onStartWave,
}: TopBarProps) {
  return (
    <div className="topbar">
      <div className="hud-pill">
        WAVE <span className="num">{wave}/{totalWaves}</span>
      </div>
      <div className="hud-pill">
        <span aria-hidden="true">☠</span> <span className="num">{kills}</span>
      </div>
      {showStartWave && (
        <button type="button" className="btn btn-primary" onClick={onStartWave} aria-label="Start wave 1">
          START
        </button>
      )}
      <div className="spacer" />
      <button
        type="button"
        className="icon-btn"
        onClick={onCycleSpeed}
        aria-label={`Simulation speed, currently times ${speed}. Tap to change.`}
      >
        ×{speed}
      </button>
      <button
        type="button"
        className={`icon-btn${paused ? " is-on" : ""}`}
        onClick={onTogglePause}
        aria-pressed={paused}
        aria-label={paused ? "Resume" : "Pause"}
      >
        {paused ? "▶" : "❙❙"}
      </button>
    </div>
  );
}
