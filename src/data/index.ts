/** Barrel: the stage list content consumes. */
import type { StageDef } from "../game/types";
import { STAGE1 } from "./stage1";

export const STAGES: readonly StageDef[] = [STAGE1];

export function getStage(id: string): StageDef | undefined {
  return STAGES.find((s) => s.id === id);
}

export { STAGE1 };
