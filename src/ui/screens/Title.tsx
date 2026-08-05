import { ELEMENT_THEME } from "../theme/elements";
import type { ElementId } from "../../game/types";
import { useStore } from "../../state/store";

const ELEMENT_ORDER: readonly ElementId[] = ["fire", "ice", "lightning", "wind"];

const META_TABS: readonly { label: string; screen: "shop" | "inventory" | "quests" | "team" }[] = [
  { label: "Shop", screen: "shop" },
  { label: "Team", screen: "team" },
  { label: "Missions", screen: "quests" },
  { label: "Inventory", screen: "inventory" },
];

/**
 * Title screen. START outweighs everything else on this screen (design/index.html #1):
 * the four meta tabs are dimmed and PREVIEW-chipped so a fixture screen never competes
 * with the one real action.
 */
export function Title() {
  const goTo = useStore((s) => s.goTo);

  return (
    <>
      <div
        style={{
          flex: 1,
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundImage:
            "radial-gradient(120% 90% at 50% 20%, rgba(29,44,82,.85) 0%, rgba(7,10,20,.85) 70%), url(/art/title-hero.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* dark scrim top and bottom, per spec, over the hero image. z-index: -1 rather
         * than giving every content sibling z-index: 1 — this is the only element that
         * actually needs explicit stacking (it's the one thing that must sit BEHIND
         * normal-flow content despite being position:absolute). */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: -1,
            background:
              "linear-gradient(180deg, rgba(7,10,20,.75) 0%, transparent 30%, transparent 65%, rgba(7,10,20,.85) 100%)",
          }}
        />
        <div style={{ textAlign: "center" }}>
          {/* The dedicated logo lockup from references/392B53D7... (not the earlier
           * screenshot-cropped version — that was a UI mockup with the logo incidentally
           * in one panel; this file IS the logo, full resolution, clean edges). Background-
           * removed via color-distance keying against its cream backdrop — see
           * design/assets/logo/logo-wordmark-source.png for the full-res matte and the
           * one-off script that produced it. Real alpha, so no blend-mode/mask tricks
           * needed here. Already carries its own "リアクトTD" lockup text, so the second
           * kanji line below is now the only live-rendered one. */}
          <img src="/art/logo-wordmark.png" alt="React TD" style={{ width: 320, maxWidth: "80vw" }} />
          <span className="kanji" style={{ fontSize: 10, marginTop: 8, opacity: 0.55 }}>
            魔法の塔防衛
          </span>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 26 }} aria-hidden="true">
          {ELEMENT_ORDER.map((el) => (
            <span
              key={el}
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: ELEMENT_THEME[el].base,
                border: "1px solid var(--gold)",
              }}
            />
          ))}
        </div>
        <button
          type="button"
          className="btn btn-primary btn-lg"
          style={{ marginTop: 40 }}
          onClick={() => goTo("stageSelect")}
          autoFocus
        >
          START
        </button>
      </div>
      <nav
        aria-label="Preview sections, not yet implemented"
        style={{ display: "flex", gap: "var(--s2)", padding: "var(--s3)", borderTop: "var(--hair)", opacity: 0.55 }}
      >
        {META_TABS.map((tab) => (
          <button
            key={tab.screen}
            type="button"
            className="btn"
            style={{ flex: 1, fontSize: 10, padding: "8px 4px", textAlign: "center" }}
            onClick={() => goTo(tab.screen)}
          >
            {tab.label.toUpperCase()}
            <br />
            <span className="preview-chip" style={{ marginTop: 2, display: "inline-block" }}>
              PREVIEW
            </span>
          </button>
        ))}
      </nav>
    </>
  );
}
