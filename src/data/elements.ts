/**
 * Thin re-export for data-layer convenience (e.g. iterating all four elements while
 * authoring content). Damage/status rules live in game/rules/elements.ts; palette and
 * labels live in ui/theme/elements.ts. This file intentionally holds neither, so there
 * is exactly one place each of those facts can drift.
 */
export { ELEMENT_IDS } from "../game/types";
export type { ElementId } from "../game/types";
