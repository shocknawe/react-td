# React TD — Design System

Task **T0**. This lands before any UI file, because otherwise every screen invents its own
spacing, radius and border weight (Phase 2 F24). Live reference: `design/index.html`,
tokens in `design/tokens.css`.

Two authorities, and they are not the same thing:

- **The 11-screen mockup sheet** is the **structure and chrome** authority — dark navy panels,
  gold hairlines, corner flourishes, the bottom card rail, stat rows, the node-graph stage map.
- **The four character sheets** are the **taste** authority — per-element palettes, gold
  filigree, costume language, magic circles.

Copying the mockup faithfully ships generic free-to-play boilerplate. Its Japanese is
inconsistent panel to panel and several screens are pure gacha template. Take its layout,
take the character sheets' taste.

## Chrome

Chrome is **dark**. Cream is not the game UI — it is the ground of the character sheets and
the logo lockup. An earlier draft of this plan got that backwards and would have shipped a
cream game that looked nothing like the reference.

| Token | Value | Use |
|---|---|---|
| `--bg` | `#070a14` | page ground |
| `--panel` | `#101830` | panel base |
| `--panel-2` | `#16203c` | panel gradient top |
| `--panel-3` | `#1d2a4d` | raised surface, button base |
| `--gold` | `#d4a843` | hairlines, accents |
| `--gold-dim` | `#8a6d2b` | inactive hairlines |
| `--gold-bright` | `#f4d98a` | display type, emphasis |
| `--ink` | `#eef2ff` | primary text |
| `--ink-2` | `#a8b4d4` | secondary text |
| `--ink-3` | `#6b7799` | tertiary, captions |
| `--danger` | `#e0443c` | defeat, unaffordable, spent leak |
| `--ok` | `#4e9c63` | remaining leaks, success |

**Cream is permitted in exactly two places:** the logo lockup, and the Mage Info panel
background, where it reads as a character dossier — which is what the source sheet is.

## Elements

**Fire / Ice / Lightning / Wind** — the mockup's set, so its element iconography is reusable.
This overrides the character sheets, which state Fire/Water/Light/Earth.

| Element | Character | Base | Light | Glow |
|---|---|---|---|---|
| Fire | Hikari — Red Mage | `#b3202e` | `#e05a3a` | `#ff8a5c` |
| Ice | Aoi — Frost Mage | `#1b3f8f` | `#2f6fd0` | `#7fb4ee` |
| Lightning | Kai — Storm Mage | `#c99a1e` | `#f0c64a` | `#fff0b8` |
| Wind | Takumi — Gale Mage | `#1f6b45` | `#4e9c63` | `#a8d8a0` |

**Known mismatch, design around it:** Kai's pose art is built on radiance motifs and Takumi's
shows rocks and leaves. Under this mapping they are Lightning and Wind. Element identity is
therefore carried by what *we* author — tower decals, projectile VFX, magic circles, badges.
Do not build Wind VFX out of leaves or Lightning VFX out of sparkles just because the pose art
does.

Single source: rules in `src/game/rules/elements.ts`, presentation in `src/ui/theme/elements.ts`.
No hex value appears anywhere else.

## Typography — English first

English is the functional language. Japanese appears only as an anime-styled gold accent.
Delete every kanji string and nothing is lost.

| Role | Face | Use |
|---|---|---|
| Display | serif (Cinzel / Marcellus class) | logo, banner words, chapter names |
| UI | Latin sans | every functional label |
| Numerals | tabular-lining sans | counters, costs, stats — must not jitter |
| Flavour | Noto Sans JP, subset ~40-60 glyphs | accent strings only, a few KB |

The mockup's stat numerals are a **sans**, not a serif. Body text never below 16px; contrast
never below 4.5:1.

English strings run wider than the Japanese the mockup was laid out for — re-measure button
and card padding at the 360px floor rather than copying the mockup's spacing.

## Spacing, radii, hairlines

- Scale: **4 / 8 / 12 / 16 / 24 / 32 / 48**. Nothing off-scale.
- Radii: exactly **two** — `3px` (controls, cards) and `8px` (panels).
- Hairline: **1px gold**. At 2x DPR it must stay 1 *device* pixel, not 1 CSS pixel, or the
  whole UI thickens and loses its engraved quality.
- Corner flourishes: 10px L-brackets, top-left and bottom-right, `--gold` at 85% opacity.
- Touch targets: **44px minimum**, always.

## Layout

Portrait-locked play column. Floor is **360x640**; frames are designed at 375x812. The map
viewport compresses first, never the card rail. On desktop the column centres with a flat dark
field, one large low-opacity element magic circle behind it, and a corner logo watermark —
nothing else. A blurred stretched copy of the artwork is the single most recognisable AI-slop
web pattern; it is banned.

## Interaction states

Every one of these is a visual, not a toast.

| Feature | Loading | Empty | Error | Success | Partial |
|---|---|---|---|---|---|
| Title | poster frame | n/a | video → poster | START ready | n/a |
| Stage select | none needed | "more coming" card | progress reset notice | stars shown | some cleared |
| Battle | atlas preloaded during stage select | n/a | CRASHED panel + restart | wave cleared | mid-wave |
| Mage card | n/a | n/a | reject + reason | placed | cooldown sweep |
| Mage info | n/a | not-yet-unlocked | n/a | stats shown | n/a |
| Results | n/a | n/a | n/a | stars burst | 1-2 stars |
| Meta shells | n/a | fixture content + PREVIEW chip | n/a | n/a | n/a |

**Mage card has four states:** affordable (full colour, gold hairline), unaffordable
(desaturated, cost in red, no border), selected (2px gold border, lifts 4px, range circle on
field), cooldown (radial sweep). This is the most repeated read in the game.

**Never** a skeleton loader over a synchronous localStorage read, and never a spinner where a
preload would do.

## The lose condition lives in-world

Crystal health is **not** a HUD element. It is a three-segment ring around the crystal —
discrete leaks, not continuous HP. Spent segments go dim red rather than disappearing so the
player can always see how many they started with. The crystal is already the visual anchor, so
this costs zero hierarchy budget.

Tower **tier** is carried by the magic-circle decal: one ring, two rings plus a rune band,
three rings plus an orbiting mote. If tier 1 and tier 3 look alike the economy feels
meaningless, which is the documented number-two failure mode for this genre.

## Accessibility

- Keyboard placement: `1-4` select a mage, arrows move the cursor, Enter places, Esc deselects.
- Visible focus rings on every interactive element.
- Colour is **never** the sole carrier of meaning — every element pairs hue with an icon and a
  label. The four element emblems are distinct silhouettes and survive greyscale.
- `prefers-reduced-motion` disables screenshake, cut-ins, burst spokes and the damage vignette.

## AI-slop ban list

The source art is visibly AI-generated, so these compound rather than merely disappoint:

- No glassmorphism blur.
- No neon rim-glow on every panel.
- No purple-cyan gradients.
- No generic "epic" particle bursts.
- No drop-shadowed white sans.
- No 3-column icon-in-a-circle feature grid.
- No blurred stretched artwork as a desktop backdrop.
- No full-bleed raw pose art. Cut-ins use a tight crop, an element-coloured wash, a hard
  diagonal wipe and 400ms maximum — the source staff designs are mutually inconsistent and the
  hands carry artifacts, and full-bleed magnifies exactly those flaws.

## Asset inventory

| Asset | Path | Notes |
|---|---|---|
| Expression tiles | `design/atlas/` | 24, uniform 181x210, map in `atlas.json` |
| Icon sprite | `design/icons.svg` | 24 symbols, `currentColor`, stroke 1.5 |
| Magic circles | `design/assets/circles/` | 4 elements x 3 tiers; 128px set for game use |
| Title key art | `design/assets/art/title-hero.png` | upper third left empty for the logo |
| Enemy sprites | `design/assets/art/enemy-*.png` | shade, armored, scout, boss; true alpha |
| Tower sprites | `design/assets/art/tower-*.png` | one per element; tier via decal |
| Ground texture | `design/assets/art/ground-valley-dark.png` | tiles cleanly, edge mismatch 6.5/255 |

Expression tiles keep their painted backgrounds inside a 2px gold frame. Alpha matting soft
anime edges is real image work; framing is free and reads as a dossier.
