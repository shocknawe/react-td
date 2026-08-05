/**
 * UI-side stage FIXTURE data for the node graph.
 *
 * src/data/stages.ts (the real StageDef content — path, sockets, waves) is owned by
 * another agent and does not exist yet. This is display-only metadata for the Stage
 * Select node graph: id, name, node position, and total wave count (needed up front so
 * the results screen can show "WAVE 12 / 15" without the real StageDef loaded). Session 1
 * ships stage 1 only (PLAN.md); the later nodes are shown locked so the graph reads as
 * "chapter", not "single level".
 */

export type StageNodeFixture = {
  id: string;
  label: string;
  x: number;
  y: number;
  totalWaves: number;
  isBoss: boolean;
};

export const CHAPTER_NAME = "Ember Vale";
export const CHAPTER_NAME_JA = "第1章 燃ゆる谷";

export const STAGE_NODES: readonly StageNodeFixture[] = [
  { id: "1-1", label: "1-1", x: 70, y: 470, totalWaves: 15, isBoss: false },
  { id: "1-2", label: "1-2", x: 130, y: 380, totalWaves: 15, isBoss: false },
  { id: "1-3", label: "1-3", x: 110, y: 280, totalWaves: 15, isBoss: false },
  { id: "1-4", label: "1-4", x: 200, y: 210, totalWaves: 15, isBoss: false },
  { id: "1-5", label: "1-5", x: 170, y: 120, totalWaves: 15, isBoss: false },
  { id: "1-6", label: "BOSS", x: 260, y: 60, totalWaves: 15, isBoss: true },
];

export const CHEST_THRESHOLDS: readonly number[] = [3, 6, 9];

export function totalStars(stageStars: Record<string, number>): number {
  return Object.values(stageStars).reduce((sum, n) => sum + n, 0);
}

/** First node with no recorded stars, walking the chapter in order. Falls back to the last node. */
export function nextPlayableNodeId(stageStars: Record<string, number>): string {
  for (const node of STAGE_NODES) {
    if (!(node.id in stageStars)) return node.id;
  }
  return STAGE_NODES[STAGE_NODES.length - 1]?.id ?? "1-1";
}

export function nodeStatus(
  nodeIndex: number,
  stageStars: Record<string, number>,
): "cleared" | "next" | "locked" {
  const node = STAGE_NODES[nodeIndex];
  if (!node) return "locked";
  if (node.id in stageStars) return "cleared";
  return node.id === nextPlayableNodeId(stageStars) ? "next" : "locked";
}
