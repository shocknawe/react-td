import { useStore } from "../../state/store";
import {
  CHAPTER_NAME,
  CHAPTER_NAME_JA,
  CHEST_THRESHOLDS,
  STAGE_NODES,
  nodeStatus,
  totalStars,
} from "../data/stageFixtures";

const PATH_D = "M70 470 L130 380 L110 280 L200 210 L170 120 L260 60";

/**
 * Stage Select — node graph. Next playable node pulses gold, cleared nodes drop to 60%
 * opacity but keep their stars, locked nodes render flat (design/index.html #2). No
 * stamina gate (cut in the final gate decision). Chest milestones rescaled to 3/6/9 stars
 * against a 3-star-per-stage ceiling on a single-stage session-1 build.
 */
export function StageSelect() {
  const stageStars = useStore((s) => s.stageStars);
  const startBattle = useStore((s) => s.startBattle);
  const goTo = useStore((s) => s.goTo);
  const earned = totalStars(stageStars);
  const hasPlayedBefore = Object.keys(stageStars).length > 0;

  function playNode(nodeId: string, status: ReturnType<typeof nodeStatus>, totalWaves: number) {
    if (status === "locked") return;
    startBattle(nodeId, totalWaves, !hasPlayedBefore);
  }

  return (
    <>
      <div className="stage-head">
        <button
          type="button"
          className="icon-btn"
          onClick={() => goTo("title")}
          aria-label="Back to title"
          style={{ marginRight: "var(--s2)" }}
        >
          ←
        </button>
        <div>
          <div className="chapter">Ch. 1 — {CHAPTER_NAME}</div>
          <span className="kanji">{CHAPTER_NAME_JA}</span>
        </div>
        <div className="spacer" />
        <div className="hud-pill">
          <span style={{ color: "var(--gold)" }} aria-hidden="true">
            ★
          </span>
          <span className="num">{earned}</span>
        </div>
      </div>

      <div className="node-map">
        <svg viewBox="0 0 375 520" role="img" aria-label="Stage map">
          <path d={PATH_D} fill="none" stroke="#2f5c3c" strokeWidth={3} strokeDasharray="5 5" />
          <g fontFamily="monospace" fontSize={11} textAnchor="middle">
            {STAGE_NODES.map((node, i) => {
              const status = nodeStatus(i, stageStars);
              const stars = stageStars[node.id] ?? 0;
              const label = node.isBoss ? "BOSS" : node.label;
              const fill = status === "cleared" ? "#24402c" : status === "next" ? "#24402c" : "#141c33";
              const stroke = status === "locked" ? "#2a3352" : "var(--gold)";
              const textFill = status === "locked" ? "#4a5578" : status === "next" ? "#fff" : "#a8b4d4";
              const radius = status === "next" ? 23 : node.isBoss ? 24 : 19;

              return (
                <g
                  key={node.id}
                  opacity={status === "cleared" ? 0.6 : status === "locked" ? 0.35 : 1}
                  className={`node-btn${status === "next" ? " is-next" : ""}${status === "locked" ? " locked-node" : ""}`}
                  role="button"
                  tabIndex={status === "locked" ? -1 : 0}
                  aria-label={`Stage ${node.label}${status === "cleared" ? `, cleared, ${stars} stars` : status === "next" ? ", next stage" : ", locked"}`}
                  aria-disabled={status === "locked"}
                  onClick={() => playNode(node.id, status, node.totalWaves)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") playNode(node.id, status, node.totalWaves);
                  }}
                  style={{ cursor: status === "locked" ? "not-allowed" : "pointer" }}
                >
                  {status === "next" && (
                    <circle className="pulse" cx={node.x} cy={node.y} r={radius + 7} fill="none" stroke="var(--gold)" strokeWidth={1.5} opacity={0.5} />
                  )}
                  <circle cx={node.x} cy={node.y} r={radius} fill={fill} stroke={stroke} strokeWidth={status === "next" ? 3 : 2} />
                  <text x={node.x} y={node.y + 4} fill={textFill} fontSize={node.isBoss ? 10 : 11}>
                    {label}
                  </text>
                  {status === "cleared" && (
                    <text x={node.x} y={node.y + (node.isBoss ? 24 : 26)} fill="var(--gold)" fontSize={12}>
                      {"★".repeat(stars) + "☆".repeat(3 - stars)}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <div className="chest-rail" aria-label="Star milestone chests">
        {CHEST_THRESHOLDS.map((threshold) => {
          const pct = Math.min(100, Math.round((earned / threshold) * 100));
          return (
            <div className="chest" key={threshold}>
              <div className="bar">
                <i style={{ width: `${pct}%` }} />
              </div>
              ★{threshold}
            </div>
          );
        })}
      </div>
    </>
  );
}
