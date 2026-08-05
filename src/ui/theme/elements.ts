/**
 * Element PRESENTATION only — palette, labels, icon ids. Never imported by game/.
 * Swatches traced to each character sheet's COLOR PALETTE row.
 */
import type { ElementId } from "../../game/types";

export type ElementTheme = {
  /** English label — functional, always shown */
  label: string;
  /** Japanese flavour accent — decorative, never load-bearing */
  labelJa: string;
  base: string;
  light: string;
  glow: string;
  /** symbol id in design/icons.svg */
  icon: string;
};

export const ELEMENT_THEME: Record<ElementId, ElementTheme> = {
  fire:      { label: "Fire",      labelJa: "ファイア",     base: "#b3202e", light: "#e05a3a", glow: "#ff8a5c", icon: "el-fire" },
  ice:       { label: "Ice",       labelJa: "アイス",       base: "#1b3f8f", light: "#2f6fd0", glow: "#7fb4ee", icon: "el-ice" },
  lightning: { label: "Lightning", labelJa: "ライトニング", base: "#c99a1e", light: "#f0c64a", glow: "#fff0b8", icon: "el-lightning" },
  wind:      { label: "Wind",      labelJa: "ウィンド",     base: "#1f6b45", light: "#4e9c63", glow: "#a8d8a0", icon: "el-wind" },
};
