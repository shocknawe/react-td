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
        {/* dark scrim top and bottom, per spec, over the hero image. z-index: -1 (not the
         * more obvious "give the content z-index: 1") so the logo's mix-blend-mode below
         * still sees the hero image as its backdrop — a positive z-index on that content
         * div would make it (a flex item) its own stacking context, which isolates any
         * blend mode inside it from anything outside, including this hero background. */}
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
          {/* Cropped straight from the mockup sheet's logo lockup (references/5F0AA11F...,
           * bottom-right panel) rather than re-set as live text — that mockup's serif
           * wordmark has a hand-painted gold gradient and bloom no CSS text-shadow
           * reproduces. The crop's own dark background is close enough to the hero
           * image's scrim that `screen` blending drops it without needing true alpha
           * matting. Kanji + element dots stay live-rendered below (unchanged) since
           * those already read cleanly as CSS. */}
          <img
            src="/art/logo-wordmark.png"
            alt="React TD"
            style={{
              width: 260,
              maxWidth: "70vw",
              mixBlendMode: "screen",
              // Screen-blending drops the crop's near-black background, but its
              // background isn't quite uniform (a faint decorative mandala line from
              // the mockup's panel bleeds through) — enough to leave a soft rectangular
              // seam against the hero sky. Fading the mask well inside the crop's own
              // edges removes that boundary entirely; the wordmark's glyphs sit safely
              // within the faded-in region so nothing legible gets clipped.
              WebkitMaskImage: "radial-gradient(ellipse 65% 55% at 50% 48%, black 55%, transparent 100%)",
              maskImage: "radial-gradient(ellipse 65% 55% at 50% 48%, black 55%, transparent 100%)",
            }}
          />
          <span className="kanji" style={{ fontSize: 12, marginTop: 8 }}>
            リアクトTD
          </span>
          <span className="kanji" style={{ fontSize: 10, marginTop: 4, opacity: 0.55 }}>
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
