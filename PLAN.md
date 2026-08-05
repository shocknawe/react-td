<!-- /autoplan restore point: ~/.gstack/projects/shocknawe-react-td/tower-defense-game-from-references-autoplan-restore-20260805-122032.md -->

# React TD (リアクトTD) — 魔法の塔防衛

A simple tower-defense game built in React, derived from the art and UI references in
`references/`.

## Source references

| File | What it is |
|---|---|
| `392B53D7…PNG` | Logo lockup — "React TD / リアクトTD", navy + crimson serif, gold staff motif, cream ground |
| `F5FFD8B2…PNG` | Character sheet — **HIKARI** 光, 16, mage, element FIRE, crimson/gold, witch hat |
| `DFB97948…PNG` | Character sheet — **AOI** 葵, 16, mage, element WATER, cobalt/gold, witch hat |
| `53FDC3D3…PNG` | Character sheet — **KAI** 界, 17, mage, element LIGHT, gold/white, cape + staff |
| `9BDD8D35…PNG` | Character sheet — **TAKUMI** 匠, 17, mage, element EARTH, green/gold, cape + staff |
| `5F0AA11F…PNG` | 11-screen UI mockup sheet (portrait phone frames) |
| `copy_DE62…MOV` | 10s atmospheric mood reel: storm sky → ice crystal spires → glowing gold tower |

### What the mockup sheet actually specifies

1. **Home / Title** — logo, START button, 4 footer tabs (SHOP / SUMMON / MISSION / MENU)
2. **Battle / Gameplay** — top HUD `WAVE 12/15`, kill counter `20/20`, speed `×1.5`, pause.
   Winding path over a green map, tower sockets, enemies walking, a blue crystal (the goal),
   lightning VFX. Bottom: mana bar `120/200` + 4 mage cards with costs `100/100/120/100`.
3. **Unit / Mage Info** — portrait, rarity ★★★★★, `Lv.20/30` + XP `620/1000`,
   stats HP/ATK/INT/DEF/SPD, one skill (`フレイムバースト` Lv.3 — 280% INT fire AoE),
   buttons: level up / skill / equip.
4. **Tower / Build Menu** — tabs タワー|トラップ, filters ALL|攻撃|魔法|支援, 8 slots:
   Archer 100, Mage 120, Cannon 150, Ice 120, Lightning 130, Wind 120, Support Shrine 100, locked.
5. **Upgrades / Skills** — element rail (Fire/Ice/Lightning/Wind) + a support node,
   skill tree with `n/5` ranks, an ultimate node (`インフェルノ 0/5`) gated behind prerequisites.
6. **Inventory** — tabs アイテム|装備|素材, 4×n grid, capacity `96/120`, sell button.
7. **Quests / Missions** — daily/weekly/main tabs, progress bars, claim/goto buttons, 00:00 reset.
8. **Shop** — currency packs priced in ¥, "first purchase" limited bundles.
9. **Team / Squad Setup** — 5 preset slots, 4 mage cards, leader skill, total power, auto-arrange.
10. **Stage Select / Map** — chapter 3 (風の谷), node graph with `3-2 … 3-9`, boss node,
    per-node star ratings, chest milestones at ★12 / ★24 / ★36, stamina `30/30`.
11. **Results / Victory** — 3 stars, stage id, clear time, reward row, retry / next / home.

## Premises (to be challenged)

- **P-A**: The user wants a *simple* TD game, and the reference sheet is aesthetic direction,
  not a scope contract.
- **P-B**: "React TD" means a React web app, not a native mobile app.
- **P-C**: The 4 characters are the core identity; the game must ship with all four.
- **P-D**: Portrait, mobile-first layout, but playable on desktop.
- **P-E**: No real art assets exist yet beyond the reference PNGs; the game must look good
  with programmatic/CSS art plus the character sheets cropped for portraits.

## Proposed scope (v1)

### In

- Vite + React 19 + TypeScript, `pnpm`.
- Canvas-rendered battle field (fixed-tile grid, one winding path), React for all UI chrome.
- Fixed-timestep simulation loop decoupled from render; speed toggle ×1 / ×1.5 / ×2, pause.
- 4 playable mages as **towers you place**, one per element: Hikari (fire, AoE burst),
  Aoi (water/ice, slow), Kai (light, single-target high dps + heal-the-crystal),
  Takumi (earth, armor shred / knockback).
- Mana economy: passive regen + kill rewards; place / upgrade (3 tiers) / sell.
- Enemy waves defined in data: **15 waves per stage, 3 stages**, with a boss wave.
  *(Amended in Phase 3 — the original "15 waves across 3 stages" contradicted the done
  condition and the 2am test. Session 1 ships stage 1 only.)*
- Win/lose: **discrete leaks — the crystal absorbs 3, the 4th is defeat.** Stars are based on
  leaks remaining (3 leaks left = 3 stars). Results screen shows stars and clear time.
  *(Amended in Phase 3 — continuous crystal HP, 3 leaks, and "HP ring with threshold pips"
  were three different games specified simultaneously. Leaks win: more legible, cheaper to
  render, and it is the metric a zero-tower headless run naturally produces.)*
- Screens: Title, Stage Select, Battle, Results. (See "NOT in scope" for the rest.)
- Persistence: `localStorage` for stage stars + settings.
- Art direction from the references: cream/gold UI frames, per-element palettes taken from the
  character sheets, portrait crops as mage avatars.

### NOT in scope (v1)

Gacha / summon, shop and real-money packs, inventory, equipment, materials, quests/missions,
daily reset, stamina, squad presets and leader skills, skill trees, account/backend/multiplayer,
sound. Each is a real screen on the mockup sheet and is deferred, not deleted.

## Architecture sketch

```
src/
  game/          pure sim — no React
    types.ts  grid.ts  path.ts  waves.ts  towers.ts  enemies.ts  sim.ts
  render/        canvas draw layer
  state/         zustand store bridging sim <-> UI
  ui/            screens + HUD components
  data/          stages, waves, tower defs, mage defs (JSON-ish TS)
```

## Open questions — ALL RESOLVED

| Question | Answer | Where |
|---|---|---|
| Mages as towers, or commanders buffing generic towers? | **Mages are the placeable units.** Screen 4's generic tower roster is deferred meta content. | C4.2 |
| Fire/Water/Light/Earth (sheets) vs Fire/Ice/Lightning/Wind (mockup)? | **Fire / Ice / Lightning / Wind.** Hikari → Fire, Aoi → Ice, Kai → Lightning, Takumi → Wind. | Final gate |
| Japanese UI text, English, or both? | **English first; Japanese as anime flavour accent only.** | Final gate |

---

# PHASE 1 — CEO REVIEW (strategy & scope)

Mode: **SELECTIVE EXPANSION** (auto-selected by /autoplan). Approach: **B — pure sim core**
(see 0C-bis). Voices: Claude subagent only (`[subagent-only]`; Codex CLI installed but not
authenticated).

## Pre-review system audit

Greenfield. `git log` has 2 commits (initial + the gstack CLAUDE.md hook). Working tree is
clean, no stashes, no TODO/FIXME markers, no open PRs, no other branches. `TODOS.md` does not
exist. No design doc, no CEO handoff note, no prior learnings for this project. There is
nothing in this repo to reuse and nothing to break. Taste calibration has no in-repo
references to draw on, so the reference PNGs are the only style authority.

**Retrospective check:** no prior review cycles on this branch. Nothing to be extra
aggressive about.

## Landscape check (three-layer synthesis)

- **[Layer 1] Tried and true.** Browser TD on React + Canvas 2D is thoroughly solved prior
  art (Princeton Tower Defense, dherault/tower_defense, dozens of Phaser builds). The
  pattern that keeps working: a pure simulation module, a canvas draw layer, and framework
  components for chrome only. Do not invent a new architecture here.
- **[Layer 2] What the search says.** Hobby TD post-mortems converge on four killers, and
  none of them are rendering: wave balance that stays harmless then spikes into an
  unwinnable swarm; economy that makes upgrades meaningless; towers the player never picks;
  and no hit feedback, so kills feel like numbers changing rather than impact. A fifth:
  one early mistake sends the player into a 20-40 minute unwinnable run.
- **[Layer 3] First principles — EUREKA.** Conventional hobby wisdom is "build it, then
  tune it." That is backwards. The engineering risk here is near zero (solved pattern,
  no backend, no auth, no data). Essentially **all** the project risk is in tuning, and
  tuning is exactly the thing that gets cut when it is scheduled as polish. So the
  balance harness and the game-feel pack are **core scope, not polish**. This is the one
  place this plan should deliberately deviate from how hobby TDs are normally built.

## 0A. Premise Challenge

| # | Premise | Verdict | Reasoning |
|---|---|---|---|
| P-A | "Simple" TD; the sheet is art direction, not a feature contract | **ACCEPT, with a reframing** | The mockup sheet is a full free-to-play gacha shell: summon, ¥-priced packs, inventory, equipment, materials, daily quests with 00:00 reset, stamina, squad presets, leader skills, skill trees. Read as a spec that is a multi-month build with a live-ops backend. The user said "simple". Treat the sheet as the **visual and UX bible** and take only the screens the core loop needs. |
| P-B | React web app | **ACCEPT** | Repo is `react-td`, the logo literally reads "React TD". No contradicting signal. |
| P-C | Ship all four mages | **ACCEPT** | Four character sheets exist at equal fidelity, and four mages map cleanly onto four elements and four tower archetypes. Cutting one saves almost nothing and costs the identity. |
| P-D | Portrait, mobile-first, desktop-playable | **ACCEPT, narrowed** | The mockups are 9:19.5 phone frames and the mood reel is 720x1280, so portrait is clearly intended. But a portrait column on a 27" desktop monitor wastes the screen. Lock a portrait play column, center it, and let ambient art bleed to fill. |
| P-E | No real art assets beyond the reference PNGs | **CHALLENGE — biggest hidden risk** | The sheets give four characters at high fidelity. They give **zero** enemy sprites, **zero** tower sprites, and **zero** tileset. Whether this "looks like the reference" is decided entirely by an art-pipeline decision the plan never made. This needs an explicit answer before Hour 1. |
| P-F | *(unstated, inferred)* "Balance can be tuned later" | **REJECT** | This is the documented #1 killer (Layer 2). The plan silently assumes it and must not. |

**Is this the right problem?** Partly reframed. The plan reads as "build a TD game." But
"what happens if we do nothing" is: nothing. There is no user pain, no deadline, no
business outcome. This is a creative/portfolio artifact. That inverts the usual priority
order: **the product IS the aesthetic and the game feel**, not the feature count. A
gacha shell with a mushy combat loop is a strictly worse artifact than a tight combat loop
with four screens. Feature breadth is the proxy metric here; fidelity and feel are the real
one. Every scope call below is made on that basis.

## 0B. Existing Code Leverage

Nothing exists in-repo to reuse (2 commits, no source). The leverage is external prior art,
which we copy as *pattern*, not as dependency:

| Sub-problem | Prior art / solved pattern | Plan reuses it? |
|---|---|---|
| Enemy path following | Waypoint list + per-segment lerp on a fixed timestep | Yes — `game/path.ts` |
| Tile grid + placement legality | Occupancy set keyed by tile index | Yes — `game/grid.ts` |
| Target selection | first / last / nearest / strongest along path | Yes — `game/towers.ts` |
| Wave scheduling | Data table of (enemy type, count, spacing, delay) | Yes — `data/waves.ts` |
| Projectiles + particles | Object pool on a canvas 2D layer | Yes — `render/` |
| UI chrome, menus, HUD | React components over the canvas | Yes — `ui/` |
| Persistence | `localStorage` JSON blob | Yes — `state/` |
| Rendering engine | Phaser 3 | **No** — see 0C-bis approach C |

Nothing is being rebuilt that already exists in this repo, because nothing exists.

## 0C. Dream State Mapping

```
  CURRENT STATE              THIS PLAN                    12-MONTH IDEAL
  ─────────────              ─────────                    ──────────────
  Empty repo.         ──▶    Playable 3-stage TD.   ──▶   Content platform.
  6 reference PNGs           4 mages as towers.           Stage/wave authoring from
  + 1 mood reel.             Canvas sim at 60fps.         data with no code change.
  README is 0 bytes.         Reactive portraits,          Community stages. Meta
  No package.json.           cut-ins, hit feedback.       progression (the deferred
  No decisions made.         Balance harness proving      gacha/skill-tree screens)
                             every wave is winnable.      layered on a proven loop.
                             4 screens, not 11.           Sound + music.
```

**Delta:** this plan lands roughly 40% of the way to the ideal, and lands the *load-bearing*
40%. The deferred screens (shop, summon, inventory, quests) are all meta-progression that
sits **on top of** the combat loop. None of them are blocked by this plan, and every one of
them is worthless without it. That is the correct sequencing.

## 0C-bis. Implementation Alternatives (mandatory)

```
APPROACH A: Single-file React canvas prototype  ← the minimal viable
  Summary: One <GameCanvas> component. useRef for mutable state, requestAnimationFrame
           loop inside useEffect. Waves and towers as inline literals.
  Effort:  S  (human: ~1 day / CC: ~30 min)
  Risk:    Low to first pixel, High to finish
  Pros:    Fastest thing on screen. Zero indirection. Trivially reviewable.
           No build-time abstraction to argue about.
  Cons:    Sim is welded to React and to the canvas, so it can never run headless —
           which kills the balance harness, the single highest-value item in the plan.
           Balance constants scattered through JSX. Becomes unpickable-apart by ~1500 lines.
  Reuses:  Nothing. Greenfield either way.

APPROACH B: Pure sim core + canvas renderer + React chrome + typed data  ← the ideal
  Summary: game/ is pure TypeScript with no React and no canvas import — it takes a state
           and a dt and returns the next state plus an event list. render/ draws state to
           canvas. ui/ is React reading a store. data/ holds stages, waves, towers, mages.
  Effort:  M  (human: ~4-5 days / CC: ~45-75 min)
  Risk:    Low
  Pros:    The sim being pure is what makes the headless balance harness possible at all —
           the same module runs 1000 simulated waves in Node in seconds. Deterministic
           given a seed, so bugs reproduce and tests are real. Rendering can be swapped
           or upgraded without touching game rules. Data-driven content is a straight
           line to the 12-month ideal.
  Cons:    More files up front than A. Requires discipline to keep game/ import-clean
           (one stray React import silently destroys the headless property).
  Reuses:  The validated React + Canvas 2D pattern from prior art.

APPROACH C: Phaser 3 scenes + React UI overlay
  Summary: Phaser owns the battle scene, tweens, particles, and asset pipeline. React
           renders menus on top.
  Effort:  M/L  (human: ~5-7 days / CC: ~90 min)
  Risk:    Med
  Pros:    Particles, tweens, scene management, sprite atlases, and an input system all
           free and battle-tested. Best path if real sprite assets ever arrive.
  Cons:    ~1MB dependency for a game with no sprite assets to feed it. Two competing
           state/lifecycle models (Phaser scenes vs React) is a known source of bugs.
           Sim gets entangled with Phaser's loop, so headless balance runs get hard again.
           And "React TD" running on Phaser is an odd thing to ship under that name.
  Reuses:  Phaser's ecosystem.
```

**RECOMMENDATION: Approach B.** It is the only one of the three that keeps the simulation
pure, and sim purity is what buys the balance harness, deterministic replays, and real unit
tests — which is where all the actual project risk lives (Layer 3 above). Maps to the
"engineered enough" and "explicit over clever" preferences: more files than A, far fewer
moving parts than C.

*Auto-decided by /autoplan: P1 (completeness) + P5 (explicit over clever). Approach B
scores highest on coverage and is the simplest thing that supports the harness. Rejected:
A (blocks the harness), C (dependency weight with no assets to justify it).*

## 0D. SELECTIVE EXPANSION analysis

### Complexity check

Approach B lands ~18-22 source files. That is over the 8-file smell threshold, so it gets
challenged: can the same goal be reached with fewer moving parts? Partly — `render/` could
collapse into one file and `state/` could be a single store. But `game/` must stay separate
(that is the whole point), and `data/` must stay separate (that is the authoring path).
**Verdict: the file count is justified by the module boundaries, not by speculation.** No
new classes/services beyond the four modules. No premature abstraction: no plugin system,
no entity-component framework, no event bus. Flagged and cleared.

### Minimum set that achieves the stated goal

Title → Stage Select → Battle → Results, one stage, one mage, five waves, one enemy type.
Everything past that is deliberate addition. Recorded so the ordering is honest: if the
project stalls, this is the slice that still has to work.

### Expansion scan (candidates — not yet in scope)

**10x check.** The 10x version is not more screens. It is this: the reference sheets ship
**six facial expressions per character, twenty-four in total**, plus two full pose
illustrations each with element magic circles already drawn. A normal implementation crops
one portrait per mage and throws the other five away. The 10x version wires the expression
set into the HUD as a **reactive emotional layer** — the mage portrait shifts to worried
when the crystal drops under 30%, to delighted on a multi-kill, to eyes-closed on idle —
and fires the pose art as a full-bleed **ultimate cut-in** when a skill triggers. That is
the difference between "a TD game with anime art" and "an anime TD game." The assets are
already sitting in `references/`, paid for and unused.

**Delight opportunities:**
1. Reactive portrait expressions driven by battle state (24 tiles already exist).
2. Ultimate cut-in: full-bleed pose art + rotating magic circle on skill fire.
3. Per-element magic-circle decals under each placed tower (drawn on the sheets already).
4. Damage numbers in element colour + screenshake + death poof on kill.
5. Wave banner between waves with kanji chapter names (第3章 風の谷 style).
6. Hold-to-fast-forward (hold the speed button for 4x, release to snap back).
7. Placement ghost with range circle and a path-blocking preview on hover.
8. Results-screen star burst timed to the gold sparkle in the logo lockup.

**Platform potential.** Typed, schema-validated content files turn stage/wave/tower
authoring into data editing rather than coding — a direct line to the 12-month ideal.
And the pure sim makes a **headless balance harness** possible: a Node script that plays
every wave N times under a scripted policy and reports survival rate, so "is wave 12
unwinnable?" becomes a number instead of an argument.

### Cherry-pick ceremony — auto-decided

| # | Expansion | Effort (human / CC) | Decision | Principle | Reasoning |
|---|---|---|---|---|---|
| E1 | Reactive portrait expressions | ~3h / ~10min | **ACCEPT** | P1, P2 | 24 tiles already exist; highest identity payoff per hour in the whole plan. |
| E2 | Ultimate cut-in on skill fire | ~4h / ~12min | **ACCEPT** | P1 | The anime signature move. One overlay component + one timer. |
| E3 | Element magic-circle tower decals | ~1h / ~5min | **ACCEPT** | P5 | Canvas arc + rotation. Makes towers read as *magic*, not turrets. |
| E4 | Hit-feedback pack (damage numbers, screenshake, death poof) | ~3h / ~10min | **ACCEPT** | P1 | Directly fixes the #1 documented hobby-TD failure. Not optional. |
| E5 | Headless balance harness | ~5h → ~20min / ~20min → ~4min | **CUT TO INVARIANTS ONLY** *(user decision at the final gate)* | P2 | Downgraded twice during review, then cut by the user. Survives as two assertions in the test suite: no NaN ever, every wave terminates. Balance is tuned by play. See Phase 3 #6 for the consequences. |
| E6 | Wave banner + kanji chapter names | ~1h / ~5min | **ACCEPT** | P5 | Trivial, and it is most of what makes the stage select feel like the mockup. |
| E7 | Hold-to-fast-forward | ~30min / ~3min | **ACCEPT** | P3 | Respects player time. Cheaper than arguing about it. |
| E8 | Placement ghost + range circle | ~2h / ~8min | **ACCEPT → moved to core** | P1 | Reclassified: this is table stakes for any TD, not an expansion. |
| E9 | Stage/wave authoring tool (GUI) | ~3d / ~2h | **DEFER → TODOS** | P2, P3 | Outside blast radius, new surface. Typed data files ship now; the editor is a later unlock. |
| E10 | Sound + music | ~2d / ~1h | **DEFER → TODOS** | P2 | No audio assets exist. New asset pipeline, entirely outside the blast radius. |
| E11 | Gacha, shop, inventory, equipment, quests, stamina, squad presets, skill trees | ~2mo / ~2d | **DEFER → TODOS** | P3, P4 | Seven mockup screens of meta-progression. All sit on top of the combat loop; none are blocked by this plan; none work without it. Correct sequencing is loop first. |

Accepted into scope: **E1, E2, E3, E4, E5, E6, E7** (+ E8 reclassified as core).
Deferred to TODOS.md: **E9, E10, E11**. Skipped outright: none.

## 0E. Temporal Interrogation

Hours below are human-team; with Claude Code the same decisions compress ~10-20x.

```
  HOUR 1 (foundations)      What the implementer must be told up front:
                            - Art pipeline: how do enemies and towers get drawn?
                              (P-E is unresolved and blocks the first render.)
                            - game/ must not import React or touch `document`.
                              State the rule, and enforce it with a lint boundary.
                            - Fixed timestep value (16.67ms) and the accumulator pattern,
                              decided now, not discovered during the speed-toggle bug.

  HOUR 2-3 (core logic)     Ambiguities they will hit:
                            - Are mages towers, or commanders buffing generic towers?
                              The mockup shows BOTH. Unanswered = rewrite.
                            - Which element set is canonical? Sheets say
                              Fire/Water/Light/Earth; the mockup tower list says
                              Fire/Ice/Lightning/Wind. Unanswered = wrong data model.
                            - Does mana regenerate passively, on kill, or both?
                              (Mockup shows a 120/200 bar but no source.)

  HOUR 4-5 (integration)    What will surprise them:
                            - Canvas + React re-render fighting: the sim must not
                              trigger React renders per frame. Store subscription has
                              to be selective or the game drops to 20fps on the HUD.
                            - Portrait canvas on desktop: DPR scaling and layout math.
                            - Speed multiplier interacting with fixed timestep — naive
                              implementations desync at x2.

  HOUR 6+ (polish/tests)    What they will wish had been planned:
                            - Determinism: seeded RNG from the start, or replays and
                              reproducible balance runs are impossible to retrofit.
                            - Balance data living in code instead of data files, making
                              the harness unable to sweep it.
                            - Star thresholds and reward curves invented at the last
                              minute and never validated.
```

Three of these are strategy questions, not implementation details, and they are surfaced at
the approval gate rather than left as "figure it out later."

## 0F. Mode Selection

**SELECTIVE EXPANSION**, auto-selected by /autoplan. (The skill's own default for a
greenfield feature is EXPANSION; /autoplan overrides to SELECTIVE, which is the more
conservative posture — every expansion is cherry-picked and logged rather than pushed.)
Confirmed approach under this mode: **B**, unchanged. EXPANSION would have favoured B as
well, so the override costs nothing here.

## Step 0.5 — Dual Voices

### CODEX SAYS (CEO — strategy challenge)

`[codex-unavailable: auth missing]`. The Codex CLI is installed (v0.146.0) but not logged
in and no `$CODEX_API_KEY` is set, so the cross-model voice could not run. This phase is
tagged **`[subagent-only]`**. To enable it: `codex login`.

### CLAUDE SUBAGENT (CEO — strategic independence)

Ran with fresh context and no sight of the review above. It verified the reference art
directly rather than trusting the plan's description, and returned 11 findings. Headline:

> "The scope cut is the right *size* and the wrong *axis*. The plan cut 11 screens to 4
> along the axis 'meta-progression vs combat loop.' That's the correct axis for a product.
> This is not a product — the plan itself argues this is a portfolio artifact where the
> product IS the aesthetic. Under that thesis the correct axis is cost-to-render vs visual
> payoff, and on that axis the plan cut the wrong seven."

| # | Sev | Finding | Auto-decision | Principle |
|---|---|---|---|---|
| C1 | Critical | Screen costs conflated with system costs. E11 priced the *backends* (~2mo) and used that number to delete the *fronts*, which is where the visual payoff is. Shop with no IAP is a static layout; Inventory with no items is a grid; Team with no persistence is four cards. | **ACCEPT — split E11 into E11a (static screens, fixture data) and E11b (systems, defer).** Routing of E11a depends on the C2 answer, so it is presented at the gate rather than settled here. | P1, P2 |
| C2 | Critical | Success metric assumed, never asked. "Make my mockups real" is at least as plausible a read of the request as "build me a TD engine." P-A resolved this without costing the counterfactual; everything downstream inherits it. | **ESCALATE TO PREMISE GATE.** This is exactly the class of decision /autoplan never auto-decides. | (gate) |
| C3 | Critical | E1/E2 were accepted while the pipeline they depend on (P-E) is explicitly unresolved. The 24 expression tiles are baked into 1536x1024 composites on an irregular grid; extracting them is measured image work, so E1's "~10 min CC" is optimistic. | **ACCEPT — P-E is promoted to a blocking Hour-0 deliverable** (sprite atlas + JSON coordinate map). E1/E2 are marked *conditional* on it. Partially disputed: cropping by measured coordinates via ImageMagick is scriptable, so the cost is real but nearer ~45 min than "manual forever." | P1 |
| C4 | Critical | Core data model undecided at the approval gate; 0E itself labels two of the three "unanswered = rewrite." | **ACCEPT — all three decided below.** Verified independently against the mockup. | P1, P5 |
| H5 | High | The cherry-pick ceremony rejected nothing (E1-E7 all accepted, "skipped outright: none"). A 100% accept rate is not selection, and SELECTIVE was chosen as the *conservative* posture. | **PARTIALLY ACCEPT.** A rejection quota for its own sake is theatre; the real missing control is a time box. Adopting H7 instead, plus the E5 downgrade below. Named honestly as a contradiction in the original ceremony. | P3, P6 |
| H6 | High | The Layer-3 "eureka" is circular: the architecture is justified by the harness, which the same document rates borderline. And a headless harness needs a scripted play policy; a naive policy produces false precision. | **ACCEPT the critique, keep the architecture.** The pure sim earns its place on testability and determinism alone, independent of the harness. **E5 downgraded** from a Monte Carlo harness to a parameter-sweep script (sweep wave HP/count multipliers, print time-to-crystal and leak count). The circular justification is withdrawn. | P3, P5 |
| H7 | High | No budget, no deadline, no definition of done. For a project whose only stated constraint is "simple," the absence of a time box is precisely how 4 screens becomes 11. | **ACCEPT — time box and done condition added below.** | P6 |
| M8 | Medium | Cutting screen 3 (Unit/Mage Info) is the worst trade in the plan: static portrait + stat block + one skill card, near-zero logic, and it is the screen that displays the character art the plan calls the core identity. | **ACCEPT — screen 3 added to core scope.** Cheaper than E5 and worth more. | P1 |
| M9 | Medium | Deferring sound contradicts the plan's own thesis — E4 accepts a hit-feedback pack because kills feel like numbers changing, then E10 defers audio, which is over half of hit feedback. | **ACCEPT — minimal SFX pack un-deferred** (place, fire, hit, death, wave-start, victory). Six CC0 files. | P1 |
| M10 | Medium | The mood reel is listed as a source and then never used, despite being 720x1280 — exactly the title screen's aspect ratio. | **ACCEPT — title screen background video.** One `<video>` tag, muted, looped, `playsinline`, with a static poster fallback. | P2 |
| M11 | Medium | 0C-bis offered three *architecture* options and zero *scope* options. The scope decision, the one that actually matters here, got no alternatives analysis. | **ACCEPT — scope-alternatives block added below (0C-ter).** | P1 |

### CEO dual voices — consensus table

```
CEO DUAL VOICES — CONSENSUS TABLE:
═══════════════════════════════════════════════════════════════
  Dimension                            Claude  Codex  Consensus
  ──────────────────────────────────── ─────── ────── ─────────
  1. Premises valid?                   NO      N/A    NOT CONFIRMED (C2, C3, C4 open)
  2. Right problem to solve?           DISPUTED N/A   NOT CONFIRMED (→ premise gate)
  3. Scope calibration correct?        NO      N/A    NOT CONFIRMED (wrong axis, C1)
  4. Alternatives explored?            NO      N/A    NOT CONFIRMED (M11, now fixed)
  5. Competitive/market risks covered? PARTIAL N/A    NOT CONFIRMED (commoditization)
  6. 6-month trajectory sound?         AT RISK N/A    NOT CONFIRMED (regret scenario)
═══════════════════════════════════════════════════════════════
0/6 CONFIRMED. Codex missing → N/A, never counted as CONFIRMED.
Single-voice critical findings (C1-C4) are flagged regardless of the missing voice.
```

This is a low consensus score, and it is not noise: a single independent voice found four
critical issues in a plan that had already been through 0A-0F. The corrections are absorbed
below. Note the score reflects the plan *as first drafted*, not as amended.

## 0C-ter. Scope Alternatives (added in response to M11)

```
SCOPE S1: "Clickable mockup"  — 11 screens, 7 static, shallow battle
  Optimizes: "my mockup is real". Screenshot fidelity.
  Effort:  human ~5d / CC ~90min
  Pros:    Maximum visual payoff per hour. Every screen on the sheet exists and is
           reachable. Reads as a finished product in a portfolio at a glance.
  Cons:    The battle loop stays thin, which is the one part nobody can fake. Static
           screens with fixture data are hollow on second look.

SCOPE S2: "One deep screen" — 1 endless stage, no stage select, no stars, results overlay
  Optimizes: the 90 seconds someone actually plays.
  Effort:  human ~2d / CC ~40min
  Pros:    The honest reading of "simple". All effort lands on feel: hit feedback,
           cut-ins, reactive portraits, difficulty curve. Hardest thing to get right,
           and the only defensible differentiator (see competitive risk).
  Cons:    Looks least like the reference sheet. No progression, so no reason to return.

SCOPE S3: "Loop first, shells second"  — 4 core screens deep + 4 static meta screens
  Optimizes: both axes, sequenced.
  Effort:  human ~6d / CC ~2h
  Pros:    Core loop is real and tuned; the meta screens exist as reachable static
           layouts with fixture data (C1's cheap half) so the mockup reads as delivered.
           Screen 3 included (M8). Straight line to the 12-month ideal.
  Cons:    Largest total surface of the three. Risks doing both jobs adequately rather
           than either one excellently. Needs the time box (H7) to stay honest.
```

**RECOMMENDATION: S3**, conditional on the C2 answer at the gate. If the user answers
"playable game," S3 is right. If the user answers "make my mockups real," **S1** is right
and the harness, the 3-stage progression, and most of the balance work should be cut.
This one question genuinely reroutes the build, which is why it is a gate and not an
auto-decision.

## Data model decisions (resolving C4)

Verified independently against `5F0AA11F…PNG`:

1. **Element set = Fire / Ice / Lightning / Wind.** The mockup is internally consistent
   on this: the four upgrade-tree rail icons on screen 5 (ファイア / アイス / ライトニング /
   ウィンド), the four tower entries on screen 4 (アイス塔 / ライトニング塔 / ウィンド塔),
   and the four element medallions in the bottom-right logo lockup are all the same set.
   The character sheets say Fire / Water / Light / Earth. **The mockup wins**, because it
   is the UI iconography we are reusing; building the sheets' set means the icons cannot
   be reused, which defeats the purpose of having them. Mapping by palette:
   Hikari (crimson) → Fire, Aoi (cobalt) → Ice, Kai (gold) → Lightning,
   Takumi (green) → Wind. *Flagged as a taste decision at the gate: it overrides four
   character sheets that state their elements explicitly.*
2. **Mages are the placeable units.** Screen 2's bottom rail is four mage cards with mana
   costs (100/100/120/100) — that is the battle placement mechanic. Screen 4's generic
   tower menu (Archer/Mage/Cannon/Ice/Lightning/Wind/Shrine) is a separate meta screen and
   is deferred content. Both exist on the sheet; they are not in conflict, they are
   different layers.
3. **Naming: in-game class names, not character names.** Screen 3 titles her
   **レッドメイジ ("Red Mage")**, not HIKARI. The character sheets are production bibles;
   the game UI uses class names. Adopt the mockup's convention and keep the personal names
   for the info screen's flavour text.

## Time box and definition of done (resolving H7)

> **AMENDED IN PHASE 3.** The original budget ("one working session, ~2h of Claude Code")
> was contradicted by this plan's own task estimates, which sum to ~6.3h before any of the
> core build is counted. Corrected below.

- **Budget: multi-session.** Phase 1 + Phase 2 task estimates sum to ~380 min (~6.3h) of
  Claude Code, and that excludes the repo scaffold, the whole `game/` module, `data/`
  content, most of `render/` and `state/`, the five screens themselves, and the ~25-target
  test suite. Realistic total is **8-15h of Claude Code with human review loops.**
- **Session 1 slice (this is the hard commitment):** T0 (DESIGN.md), T3 (boundary lint),
  T4 (the loop), T6 (HUD slice), E4 (hit feedback), E8 (placement ghost), T24 (first-run
  hint), plus the 0D minimum set — **one stage, four mages, one enemy type, Title → Battle
  → Results**. Preceded by T-1 (get the art into the repo — see Phase 3 #1).
- **Done condition (Session 1):** someone who has never seen the game opens it and, without
  instruction, clears stage 1 or loses trying — no console errors, no softlock, no wave that
  is mathematically unwinnable.
- **Cut rule — cut groups, not minutes.** In order: all Phase-2 P2 tasks; the four meta
  shells (E11a / T28 / T27); T26 and T25 (both blocked on unbudgeted alpha matting); T7 and
  M10 (video); M9 (SFX); E2 (cut-ins — highest slop risk and same matting dependency);
  stages 2 and 3; T12 (CI) and T13 (dev overlay); E5 down to its two invariant assertions.
  **Never cut** E4 (hit feedback), T-1, or T0.

## Section 1: Architecture Review

```
                          ┌────────────────────────────┐
                          │        ui/  (React)        │
                          │  Title  StageSelect        │
                          │  Battle(HUD) MageInfo      │
                          │  Results  + meta shells    │
                          └─────┬───────────────▲──────┘
                    commands    │               │  selective subscribe
                    (place,     │               │  (HUD fields only,
                     sell,      ▼               │   NOT per-frame)
                     speed)  ┌──────────────────┴──────┐
                             │   state/  (zustand)     │
                             │  holds SimState ref +   │
                             │  publishes HUD slice    │
                             └─────┬─────────────▲─────┘
                       tick(dt)    │             │  SimState + events[]
                                   ▼             │
   ┌───────────────┐          ┌────────────────────────┐         ┌──────────────┐
   │  data/        │─────────▶│   game/  (PURE TS)     │         │  render/     │
   │  stages       │  configs │  grid path waves       │────────▶│  canvas 2D   │
   │  waves        │          │  towers enemies sim    │  state  │  layers:     │
   │  towers/mages │          │  rng (seeded)          │         │  map/units/  │
   │  (typed +     │          │                        │         │  fx/decals   │
   │   validated)  │          │  NO react. NO canvas.  │         └──────────────┘
   └───────────────┘          │  NO document/window.   │
            ▲                 └────────────┬───────────┘
            │                              │  same module, no renderer
            │                              ▼
            │                    ┌──────────────────────┐
            └────────────────────│ tools/balance-sweep  │
              sweeps configs     │ (node, headless)     │
                                 └──────────────────────┘
```

**Component boundaries.** Four modules, one rule: `game/` imports nothing from `ui/`,
`render/`, or the DOM. That single constraint is what makes the sim testable, headless-
runnable, and deterministic. **Finding A1 (high): the plan states this rule in prose but
gives it no enforcement.** One stray `import React` silently destroys the property and
nobody notices until the sweep script fails to start. *Auto-decided (P5): add an ESLint
`no-restricted-imports` boundary on `src/game/**` plus a one-line CI grep. Explicit beats
trusting discipline.*

**Coupling.** Nothing was coupled before (empty repo). New coupling introduced:
`ui/ → state/ → game/` is one-directional and justified. `render/ → game/` is read-only
(render takes a state, draws, returns nothing). `data/ → game/` is type-only. No cycles.
The one coupling worth watching is `state/` holding a mutable `SimState` ref while also
publishing an immutable HUD slice; that is deliberate, and it is the standard fix for the
per-frame-rerender problem below.

**Data flow — four paths, per new flow:**

```
FLOW 1: place a mage on a tile
  HAPPY  click tile → canPlace(grid,tile) → cost<=mana → mutate grid+mana → decal spawn
  NIL    click outside grid → hitTest returns null → no-op, no error toast (correct)
  EMPTY  no mage selected → returns early, shows "select a mage" hint  ← GAP, see A2
  ERROR  tile occupied OR on path OR mana short → reject + shake the card + reason toast

FLOW 2: tick(dt)
  HAPPY  accumulate dt → N fixed steps → move/target/fire/damage → emit events[]
  NIL    dt undefined (first frame) → guard: dt ?? 0
  EMPTY  zero enemies alive and wave queue empty → advance wave, do NOT divide by count
  ERROR  dt spike after tab-away (dt = 8000ms) → clamp accumulator ← GAP, see A3

FLOW 3: load saved progress
  HAPPY  localStorage JSON → schema parse → hydrate stars/settings
  NIL    key absent (first visit) → defaults, no error
  EMPTY  key present but "" → parse throws → fall back to defaults  ← GAP, see A4
  ERROR  JSON from an older/newer schema version → version field + migrate or reset
```

**State machine — battle:**

```
        ┌──────────┐  start   ┌─────────┐  wave cleared &     ┌───────────┐
        │  READY   │─────────▶│ RUNNING │──  waves remain ───▶│ INTERWAVE │
        └──────────┘          └────┬────┘                     └─────┬─────┘
                                   │  ▲                             │ timer/skip
                            pause  │  │ resume                      ▼
                                   ▼  │                        (back to RUNNING)
                              ┌─────────┐
                              │ PAUSED  │
                              └─────────┘
        crystal HP <= 0 ──▶ ┌──────────┐      last wave cleared ──▶ ┌──────────┐
                            │ DEFEAT   │                            │ VICTORY  │
                            └──────────┘                            └──────────┘

  Impossible transitions and what prevents them:
    PAUSED → INTERWAVE     guarded: wave advance only evaluated inside RUNNING steps
    VICTORY → RUNNING      terminal states accept only `restart`, which rebuilds state
    DEFEAT  → VICTORY      crystal HP checked before wave-clear in the same step
    RUNNING → RUNNING (x2) accumulator loop is capped at MAX_STEPS per frame
```

**Scaling.** "10x load" here means entity count, not traffic. At ~50 enemies x ~20 towers
the naive all-pairs targeting scan is 1000 distance checks per step, x60 steps/s = fine.
At 10x (500 enemies) it is 100k checks/step and the frame budget is gone. **Finding A5
(medium):** *auto-decided (P3) — cap concurrent enemies at 60 in wave data and note the
spatial-hash upgrade in TODOS. Do not build the spatial hash now; it is a real optimization
for a load this game will never see.*

**Single points of failure.** One: the `requestAnimationFrame` loop. If it throws, the game
freezes with no feedback. *Auto-decided (P1): wrap the step in try/catch, transition to a
`CRASHED` state, and render a "something broke — restart" panel rather than a dead canvas.*

**Security architecture.** No backend, no auth, no network calls, no user accounts, no
server-side state. The entire attack surface is `localStorage` on the player's own origin.
There are no auth boundaries to draw and no endpoints to enumerate. Detail in Section 3.

**Production failure scenarios.** New integration points: (1) `localStorage` — can throw in
Safari private mode; (2) the title `<video>` — can fail to autoplay under browser policy;
(3) canvas 2D context acquisition — returns null on exotic/blocked GPUs. All three have
graceful degradations specified in Section 2. None are accounted for in the plan as drafted.

**Rollback posture.** Static site. Rollback is redeploying the previous build, or
`git revert`. Under a minute, no migrations, no data loss. Reversibility is as good as it
gets. The only stateful artifact is the player's `localStorage`, which is why the save
blob needs a `version` field from day one (see A4).

## Section 2: Error & Rescue Map

```
  CODEPATH                     | WHAT CAN GO WRONG              | ERROR CLASS
  -----------------------------|--------------------------------|-------------------
  loadProgress()               | key absent                     | (none — defaults)
                               | value is "" or malformed JSON  | SyntaxError
                               | schema drift (old save)        | SchemaVersionError
                               | Safari private mode / quota    | QuotaExceededError
  saveProgress()               | quota exceeded                 | QuotaExceededError
                               | storage disabled by policy     | SecurityError
  initCanvas()                 | getContext('2d') returns null  | CanvasUnavailableError
  loadAtlas()                  | sprite atlas 404 / decode fail | AtlasLoadError
  titleVideo.play()            | autoplay blocked by policy     | NotAllowedError
  sfx.play()                   | no user gesture yet            | NotAllowedError
  step(dt)                     | dt spike after tab-away        | (clamped, not thrown)
                               | NaN leaks into a position      | InvariantError
  placeMage(tile)              | tile occupied / on path        | (rejected, not thrown)
                               | insufficient mana              | (rejected, not thrown)
  parseStageData()             | hand-edited data file invalid  | ContentValidationError

  ERROR CLASS             | RESCUED? | RESCUE ACTION                  | USER SEES
  ------------------------|----------|--------------------------------|------------------
  SyntaxError (save)      | Y        | reset to defaults, log warn    | Silent, fresh save
  SchemaVersionError      | Y        | migrate if known, else reset   | "Progress reset"
  QuotaExceededError      | Y        | disable saving, keep playing   | "Progress won't save"
  SecurityError           | Y        | same as above                  | "Progress won't save"
  CanvasUnavailableError  | Y        | render an HTML fallback panel  | "Canvas unsupported"
  AtlasLoadError          | Y        | fall back to vector primitives | Degraded art, playable
  NotAllowedError (video) | Y        | show the poster still          | Static title art
  NotAllowedError (sfx)   | Y        | arm audio on first click       | Silent until 1st tap
  InvariantError          | Y        | CRASHED state + restart panel  | "Something broke"
  ContentValidationError  | Y        | fail loudly at build/dev time  | Build error (dev only)
```

Rules applied. **No catch-all.** The plan as drafted had zero error handling specified,
which is a gap in every row above — that is the finding of this section, and it is the
single largest one in Phase 1. Each rescue either degrades gracefully with a visible
message or fails loudly at build time; nothing is swallowed. Two rows are worth calling
out because they are the ones that silently ruin a play session:

- **`QuotaExceededError` must not be silent.** A player finishing stage 3 and losing their
  stars to a full quota with no message is the worst outcome in the table.
- **`InvariantError` (NaN in a position) is the classic sim bug.** A single NaN propagates
  to every downstream entity within a frame and the game freezes with no error. Assert on
  it in dev builds; in prod, transition to `CRASHED`.

*Auto-decided (P1, completeness): all 10 rescues are in scope. They total roughly 40 lines.*

## Section 3: Security & Threat Model

| Threat | Likelihood | Impact | Mitigated by the plan? |
|---|---|---|---|
| XSS via rendered content | Low | High | Partially. React escapes by default, but the kanji chapter names and mage flavour text come from `data/` files. **Never use `dangerouslySetInnerHTML`** — stated explicitly so it does not get "fixed in" later for styling. |
| `localStorage` tampering (player edits their own save to unlock stars) | High | **Negligible** | Not mitigated, and deliberately so. Single-player, no leaderboard, no economy. Client-side "anti-cheat" here is pure cost with zero benefit. Explicitly out of scope so it does not get built by reflex. |
| Malicious content in `data/` files | Very low | Medium | Repo-authored only, not user-supplied. Zod-style schema validation at load catches malformed data. If E9 (the authoring tool) ever ships with import, that changes and must be re-threat-modelled. |
| Dependency supply chain | Medium | Medium | **Finding S1:** the plan names no dependency budget. *Auto-decided (P4, P5): Vite + React + TypeScript + zustand + a schema validator. Nothing else without a written reason. Every added dep is attack surface and bundle weight for a game that needs neither.* |
| Prompt injection / LLM vectors | N/A | N/A | No LLM in this product. Not applicable. |
| PII / payment data | N/A | N/A | None collected. The deferred shop screens (E11a) are static fixtures with no payment path — worth stating, because a shop screen that *looks* real is exactly where someone later wires a real payment form. |
| Audit logging | N/A | N/A | No sensitive operations. Not applicable. |

Input validation: the only true user inputs are pointer coordinates and keyboard shortcuts.
Coordinates are clamped to the grid and rejected outside it; there is no free-text input
anywhere in scope, which removes most of the usual surface. **Net: 1 finding (S1), 0 High.**

## Section 4: Data Flow & Interaction Edge Cases

```
  INTERACTION            | EDGE CASE                        | HANDLED? | HOW
  -----------------------|----------------------------------|----------|------------------
  Place a mage           | double-click same tile           | GAP→FIX  | occupancy check is
                         |                                  |          | authoritative; 2nd
                         |                                  |          | click is a no-op
                         | drag off-grid mid-place          | GAP→FIX  | commit on pointerup
                         |                                  |          | over a valid tile
                         | place during INTERWAVE           | OK       | allowed by design
  Speed toggle           | spam x1/x1.5/x2 rapidly          | GAP→FIX  | multiplier applies to
                         |                                  |          | accumulator, not dt;
                         |                                  |          | steps stay 16.67ms
                         | hold-to-4x then tab away         | GAP→FIX  | release resets on
                         |                                  |          | visibilitychange
  Tab away / background  | rAF pauses, dt spikes to 8s      | GAP→FIX  | clamp accumulator to
                         |                                  |          | MAX_STEPS (5); auto-
                         |                                  |          | pause on blur
  Wave transition        | last enemy dies same frame the   | GAP→FIX  | resolve deaths, then
                         | crystal takes lethal damage      |          | check defeat, then
                         |                                  |          | check wave-clear
  Results screen         | player navigates back mid-anim   | GAP→FIX  | state is committed on
                         |                                  |          | entry, not on anim end
  Save                   | two tabs open, both writing      | GAP→FIX  | last-write-wins +
                         |                                  |          | `storage` event reload
  Stage select           | zero stages unlocked (fresh)     | OK       | stage 1 always unlocked
                         | all 3 cleared (empty next)       | GAP→FIX  | "more coming" card,
                         |                                  |          | not a blank column
  Canvas                 | window resize / DPR change       | GAP→FIX  | re-derive backing store
                         | orientation change on mobile     | GAP→FIX  | letterbox, keep portrait
```

Nine gaps, all with fixes specified. The three that actually break a session if skipped are
the **dt spike on tab-away** (game fast-forwards through three waves while you were in
another tab), the **speed-toggle timestep bug** (sim desyncs at x2 and towers fire at wrong
rates), and the **same-frame death/defeat ordering** (you lose a run you should have won).
*Auto-decided (P1): all nine in scope. Each is a few lines; the cost of skipping any of
them is a bug report that takes longer to diagnose than the fix takes to write.*

## Section 5: Code Quality Review

Nothing exists to review, so this section evaluates the *plan's* structural commitments and
the pattern risks they carry.

- **DRY.** One real risk: element colour, icon, and label will be needed in `render/`
  (decals, damage numbers), `ui/` (cards, upgrade rail, info screen), and `data/`.
  **Finding Q1:** *auto-decided (P4) — a single `ELEMENTS` record in `data/elements.ts` is
  the sole source; nothing else hardcodes a hex value.* Without this, the crimson in the
  Fire tower decal and the crimson in the Fire card drift apart within a day.
- **Naming.** Name for what, not how: `applyDamage`, not `handleDamageLogic`;
  `TowerDef` (static) vs `TowerInstance` (live) — the static/instance split is the naming
  distinction most TD codebases get wrong and then pay for forever.
- **Over-engineering check.** The plan proposes no plugin system, no ECS, no event bus, no
  DI. Correct for this size. The one thing that *reads* as over-engineering (four modules)
  is load-bearing and justified in Section 1.
- **Under-engineering check.** **Finding Q2:** the plan says "fixed-timestep simulation
  loop" and stops. That one sentence hides the accumulator, the max-steps clamp, the
  interpolation-vs-snap decision, and the speed multiplier interaction — the exact cluster
  that produced three of Section 4's gaps. *Auto-decided (P5): the plan must spell out the
  loop, not name it.*
- **Cyclomatic complexity.** The predictable >5-branch function is the per-enemy step
  (alive? / stunned? / slowed? / at waypoint? / reached crystal? / dead this frame?).
  *Auto-decided (P5): split into `advance`, `applyStatuses`, `resolveArrival` up front,
  rather than refactoring it after it is written.*
- **Seeded RNG.** **Finding Q3 (high):** the plan never mentions determinism. Retrofitting
  a seeded RNG after `Math.random()` is sprinkled through targeting, crit rolls, and
  particle spawns is a genuinely miserable refactor. *Auto-decided (P1): a seeded generator
  from the first commit, passed through `SimState`, and `Math.random` banned in `game/` by
  the same lint boundary as A1.*

## Section 6: Test Review

```
  NEW UX FLOWS                          COVERED BY
  ─ place / sell / upgrade a mage       integration (store + sim, no canvas)
  ─ pause / resume / speed toggle       unit (accumulator math)
  ─ wave start → clear → interwave      integration
  ─ victory / defeat resolution         unit (ordering, the same-frame case)
  ─ stage select → battle → results     E2E (Playwright, 1 happy path)
  ─ save / load progress                unit (all four shadow paths)

  NEW DATA FLOWS                        COVERED BY
  ─ place-mage validation chain         unit, incl. nil/empty/error paths
  ─ tick(dt) → events[]                 unit + property test (see below)
  ─ localStorage hydrate                unit, all four paths

  NEW CODEPATHS                         COVERED BY
  ─ targeting modes (first/last/near)   unit, table-driven
  ─ status effects (slow, shred)        unit
  ─ mana regen + kill reward            unit
  ─ star threshold calculation          unit, boundary values
  ─ 10 error rescues from Section 2     unit, one test each

  NEW ASYNC WORK                        COVERED BY
  ─ atlas load                          unit (success + AtlasLoadError fallback)
  ─ rAF loop                            not directly tested; sim is tested headless
  ─ title video autoplay                E2E smoke (poster fallback renders)

  NEW INTEGRATIONS / EXTERNAL CALLS     COVERED BY
  ─ none (no network, no backend)       n/a — stated so the absence is deliberate
```

**The 2am-Friday test:** run all 15 waves of every stage headless under a fixed seed and
assert (a) no NaN ever enters a position, (b) every wave terminates, (c) the crystal
survives under a reference play policy. That one test is the difference between shipping
confidently and hoping.

**The hostile-QA test:** start a wave, set speed to x2, tab away for 30 seconds, tab back,
pause mid-projectile, sell the tower that projectile is flying from, resume. Nothing should
throw and nothing should orphan.

**Chaos test:** random-fuzz the command stream (place/sell/upgrade/pause/speed at random
tiles and times) for 10k steps under a seed; assert no throw and no invariant break.

**Pyramid:** heavy unit (the sim is pure, so unit tests are cheap and fast), a thin
integration layer at the store boundary, exactly one E2E happy path. Correct shape — not
inverted. **Flakiness risk:** the E2E test is the only time-dependent one; it must assert
on state transitions, not on wall-clock animation timing. No LLM/prompt code in this plan,
so no eval suites apply.

**Finding T1 (critical):** the plan as drafted specified **no tests at all**. *Auto-decided
(P1): the suite above is in scope. Vitest for unit/integration, Playwright for the single
E2E path. The pure sim is what makes this cheap; not using it would waste the architecture.*

## Section 7: Performance Review

No database, no queries, no N+1, no connection pools, no background jobs — those subsections
are not applicable and are noted as such rather than skipped. The performance surface here
is frame budget and memory:

- **Frame budget.** 16.67ms. At the capped 60 enemies x 20 towers the sim is roughly 1200
  distance checks per step; that is well inside budget. The realistic risk is not the sim.
- **Finding P1 (critical):** **React re-rendering per frame.** If the HUD subscribes to
  `SimState` directly, every tick re-renders the React tree and the game drops to ~20fps —
  and it will look like a canvas problem, which is why people lose days to it. *Auto-decided
  (P1): `state/` publishes a narrow HUD slice (wave, kills, mana, crystal HP, speed) on a
  throttled cadence (~10Hz), never the entity arrays. Canvas draws from the raw ref.*
- **Memory.** Projectiles and particles are the only unbounded allocators. *Auto-decided
  (P3): fixed-size object pools, particles capped at ~300 with oldest-out. Prevents the
  slow GC sawtooth that makes a game feel worse the longer you play.*
- **Caching.** The atlas decodes once. Static per-element gradients and the magic-circle
  decal should be pre-rendered to offscreen canvases once rather than re-stroked per frame
  per tower — 20 towers x 60fps of arc-stroking is real cost for a static image.
- **Slowest new codepaths (p99 estimate):** particle draw (~2ms), enemy step (~1ms),
  targeting scan (~0.5ms). Comfortable.
- **Asset weight.** Four 1536x1024 PNGs plus a 8.5MB `.MOV`. **Finding P2 (high):** the mood
  reel is 8.5MB of HEVC, which Chrome and Firefox will not reliably decode. *Auto-decided
  (P1): transcode to web-safe MP4/H.264 + WebM, target under 1.5MB, `preload="none"`, with
  a static poster. Otherwise M10's title video is a blank box on most desktops.*

## Section 8: Observability & Debuggability Review

Client-only game with no telemetry backend, so "observability" means *developer* visibility,
not production monitoring. Evaluated on that basis rather than skipped:

- **Logging.** Structured `console.warn` on every rescue in Section 2, each naming what was
  attempted and with what. Silent rescues are the thing that makes a bug unreproducible.
- **Metrics / dashboards / alerting / runbooks.** Not applicable — no server, no operator,
  no on-call. Stated explicitly so the absence is a decision rather than an oversight.
- **Debuggability. Finding O1 (medium):** *auto-decided (P1) — a dev-only overlay toggled
  by `~`, showing fps, step count, entity counts, active seed, and current wave state.*
  With a seeded sim, "it broke on wave 12" becomes reproducible from the seed alone. That
  is the single highest-value debugging affordance available here and it costs one component.
- **Admin tooling.** The E5 sweep script doubles as this. No other operational surface.

## Section 9: Deployment & Rollout Review

Static SPA. No migrations, no feature flags needed, no rollout ordering, no partial-state
window, no environment parity concerns beyond "does it build."

- **Rollback:** redeploy previous build or `git revert`. Sub-minute, zero data risk.
- **Deploy-time risk window:** a player mid-session on the old bundle is unaffected; there
  is no server contract to break. The only cross-version artifact is the save blob, which
  is why the `version` field (A4) is the one deployment-relevant decision in this plan.
- **Post-deploy verification:** load the title, start stage 1, place one mage, clear wave 1,
  confirm no console errors. Five checks, under a minute.
- **Smoke test:** the single Playwright E2E path, run against the built bundle in CI.
- **Finding D1 (medium):** the plan names no host and no CI. *Auto-decided (P3): GitHub
  Pages or Netlify from `main`, plus a CI job running typecheck + unit + the E2E smoke.
  Deciding this now costs nothing; deciding it later means a manual deploy habit forms.*

**0 risks flagged as blocking.** This is the lowest-risk deployment profile a project can
have, and it is worth saying plainly rather than manufacturing concerns.

## Section 10: Long-Term Trajectory Review

- **Technical debt introduced.** Low, with two named items: the balance numbers in `data/`
  will be hand-tuned and under-validated if E5 is cut, and the meta screens (E11a) ship as
  static fixtures, which is *intentional* debt that must be labelled in-code as
  `// FIXTURE — no backing system` so nobody mistakes them for working features.
- **Path dependency.** The pure-sim boundary makes future changes *easier*, not harder:
  a renderer swap, a replay system, an AI opponent, or server-side validation all become
  additive. The one-way-ish decision is the save schema, mitigated by versioning.
- **Knowledge concentration.** The plan is the documentation. The four-module boundary is
  self-evident from the directory names, which is the cheapest form of architecture docs.
- **Reversibility: 5/5.** Static site, no data, no users, no integrations. Nothing here is
  a one-way door except the visual direction, and that is set by the references anyway.
- **Ecosystem fit.** Vite + React + TS is the mainstream 2026 default. Canvas 2D over WebGL
  is right for this scale. Nothing exotic to maintain.
- **The 1-year question.** A new reader opening `game/sim.ts` and `data/waves.ts` can
  understand the whole game in twenty minutes, *provided* the loop is spelled out (Q2) and
  the element table is single-sourced (Q1). Both are now in scope.
- **What comes after.** Phase 2 is the deferred meta systems (E11b) landing behind the
  static shells already built. Phase 3 is authoring (E9) and community stages. The
  architecture supports both without restructuring, which is the whole argument for
  Approach B.

## Section 11: Design & UX Review

> **PARTIALLY SUPERSEDED BY PHASE 2.** Two things below are wrong and are corrected in
> Phase 2: the **cream/parchment chrome** direction (F1 — the mockup's game UI is dark navy;
> cream is the character-sheet and logo ground) and the **interaction state coverage matrix**
> (F14 — it cargo-culted web loading patterns instead of naming real game states). Read
> Phase 2 Pass 2 and Pass 4 as authoritative. The rest of this section stands.

UI scope confirmed. This is the CEO-level design pass; the deep pass is Phase 2.

```
  TITLE ──▶ STAGE SELECT ──▶ BATTLE ◀──┐──▶ RESULTS ──▶ (next / retry / home)
    │            │             │       │       │
    │            │             ├─ MAGE INFO ───┘
    │            │             └─ PAUSE overlay
    └── meta shells (SHOP / SUMMON / MISSION / MENU) ── static, fixture data
```

- **Information architecture.** Screen 2's hierarchy is already correct on the mockup and
  should be copied, not redesigned: wave counter and crystal health top (what threatens
  you), battlefield centre (where you look), mana and mage cards bottom (what you do).
  Thumb-reachable actions at the bottom is right for portrait.
- **Interaction state coverage:**

```
  FEATURE        | LOADING        | EMPTY            | ERROR           | SUCCESS      | PARTIAL
  ---------------|----------------|------------------|-----------------|--------------|----------
  Title          | poster frame   | n/a              | video → poster  | START ready  | n/a
  Stage select   | skeleton cards | "more coming"    | reset progress  | stars shown  | some cleared
  Battle         | atlas spinner  | n/a              | CRASHED panel   | wave cleared | mid-wave
  Mage info      | n/a            | not-yet-unlocked | n/a             | stats shown  | n/a
  Results        | count-up anim  | n/a              | n/a             | stars burst  | 1-2 stars
  Meta shells    | n/a            | "coming soon"    | n/a             | n/a          | n/a
```

  **Finding G1 (high):** the plan specified none of these. The empty and error columns are
  where hobby games look unfinished. *Auto-decided (P1): all in scope.*
- **User journey.** Title (curiosity — the mood reel sells the tone) → stage select
  (anticipation) → battle (tension, which is the whole product) → results (relief and a
  number) → next. The emotional break point is a **loss**: currently the plan drops the
  player to a defeat screen with nothing learned. *Auto-decided (P1): the defeat screen
  names the wave reached and the leak that killed the run, so a loss teaches instead of
  punishing. This is the direct counter to the "one early mistake, 30 wasted minutes"
  failure from the landscape check.*
- **AI slop risk. Medium-high, and worth naming honestly.** The references are visibly
  AI-generated, and a generic dark-glass game UI over them would compound it. The specific
  defence is the reference sheet's own vocabulary: cream/parchment panels with gold
  hairline rules and corner flourishes, a serif display face for numerals, and per-element
  palettes lifted from the character sheets. That is a *specific* look, and specificity is
  what slop lacks.
- **DESIGN.md.** Does not exist. *Auto-decided (P1): write one from the reference palettes
  as an Hour-0 deliverable, so Phase 2 has something to review against.*
- **Responsive intention.** Portrait-locked column, centred, ambient bleed on desktop
  (P-D). Landscape on phones letterboxes rather than reflows.
- **Accessibility.** **Finding G2 (high):** unaddressed in the plan. *Auto-decided (P1):
  keyboard placement (number keys select a mage, arrows move a cursor, Enter places),
  visible focus rings, 44px minimum touch targets, element colour never the sole carrier
  of meaning (pair each with its icon and label), and a reduced-motion setting that disables
  screenshake and cut-ins.* Screenshake without a `prefers-reduced-motion` opt-out is an
  accessibility defect, and E4 introduces it.

Recommendation: **run /plan-design-review** on this plan before implementation. That is
Phase 2 of this pipeline and it runs next.

## Required Outputs — Phase 1

### NOT in scope

| Item | Why deferred |
|---|---|
| Gacha / summon system (E11b) | Meta-progression built on top of a loop that does not exist yet. Worthless before the loop is good. |
| Shop with real payments | No payment path will be wired. The static shell (E11a) is a fixture and is labelled as one in-code. |
| Inventory, equipment, materials systems | Systems, not screens. The screens are cheap (E11a); the systems are ~2 months. |
| Quests / missions / daily reset / stamina | Requires a server clock to be meaningful. Client-only daily reset is trivially defeated and pointless single-player. |
| Squad presets, leader skills | Depends on a roster larger than four. |
| Skill trees (screen 5) | Depends on a progression currency that only exists once E11b lands. |
| Generic tower roster (screen 4: Archer/Cannon/Shrine) | Mages are the placement mechanic (C4.2). A second parallel placement system doubles the balance surface for no new play. |
| Backend, accounts, multiplayer, leaderboards | Out of the blast radius entirely. Changes the security model from "none" to "real". |
| Stage/wave authoring GUI (E9) | Typed data files ship now; the editor is a Phase 3 unlock. |
| Spatial hash for targeting (A5) | A real optimization for a load this game will never reach. Enemy count is capped instead. |
| Client-side anti-cheat on saves | Single-player, no leaderboard. Pure cost, zero benefit. |
| Sound *beyond* the 6-file SFX pack | Music and a full audio mix are a separate asset pipeline. The minimal pack is in (M9). |

### What already exists

Nothing in this repo — 2 commits, no source, an empty README. Externally, the React +
Canvas 2D TD pattern is validated prior art and is being reused as *pattern*, not
dependency. What genuinely already exists and is under-used is the **art**: four character
sheets carrying 24 expression tiles, 8 pose illustrations, 4 staff/prop sheets, and 4
element magic circles, plus a logo lockup and a 10s mood reel. Every one of those was paid
for and is sitting unused in `references/`. The reactive-portrait layer (E1), the cut-ins
(E2), the tower decals (E3), and the title video (M10) all exist purely to spend art that
has already been produced.

### Dream state delta

This plan lands roughly 40% of the way to the 12-month ideal, and it is the load-bearing
40%: a tuned combat loop, a deterministic sim, and a data-driven content layer. Everything
deferred sits on top of that and none of it is blocked by this plan. The gap that remains
after this ships is meta-progression (E11b), authoring (E9), and audio depth. The one way
this plan could move *away* from the ideal is if `game/` picks up a React or DOM import,
which is why A1 adds a lint boundary rather than trusting prose.

### Failure Modes Registry

```
  CODEPATH            | FAILURE MODE           | RESCUED? | TEST? | USER SEES        | LOGGED?
  --------------------|------------------------|----------|-------|------------------|--------
  loadProgress        | malformed JSON         | Y        | Y     | fresh save       | Y
  loadProgress        | schema drift           | Y        | Y     | "Progress reset" | Y
  saveProgress        | quota exceeded         | Y        | Y     | "Won't save"     | Y
  saveProgress        | storage disabled       | Y        | Y     | "Won't save"     | Y
  initCanvas          | no 2d context          | Y        | Y     | fallback panel   | Y
  loadAtlas           | 404 / decode fail      | Y        | Y     | vector fallback  | Y
  titleVideo.play     | autoplay blocked       | Y        | Y     | poster still     | N (expected)
  sfx.play            | no gesture yet         | Y        | Y     | silent till tap  | N (expected)
  step(dt)            | dt spike (tab-away)    | Y        | Y     | auto-pause       | Y
  step(dt)            | NaN in position        | Y        | Y     | CRASHED panel    | Y
  rAF loop            | uncaught throw         | Y        | Y     | CRASHED panel    | Y
  placeMage           | occupied / no mana     | Y        | Y     | reject + reason  | N (expected)
  parseStageData      | invalid content        | Y        | Y     | build error      | Y
  wave resolution     | same-frame death/defeat| Y        | Y     | correct outcome  | N (expected)
```

**0 CRITICAL GAPS.** Every row is rescued, tested, and user-visible or deliberately silent.
Rows marked `LOGGED? N (expected)` are normal control flow, not swallowed failures. This
registry is the direct output of Sections 2 and 4; the plan as originally drafted would have
scored 14 gaps here.

### Diagrams produced

1. System architecture (Section 1) — modules, direction of dependency, the headless path.
2. Data flow with all four shadow paths (Section 1) — 3 flows.
3. State machine (Section 1) — battle states plus impossible transitions and their guards.
4. Error flow (Section 2) — codepath → error class → rescue → user-visible result.
5. Interaction edge-case matrix (Section 4).
6. Test coverage diagram (Section 6).
7. User flow / screen graph (Section 11).
8. Interaction state coverage matrix (Section 11).

### Stale diagram audit

No pre-existing diagrams in the repo (no source files). Nothing stale. All eight diagrams
above are new and describe code that does not exist yet, so they carry an obligation:
**if the module boundaries change during implementation, Section 1's diagram is updated in
the same commit.** A stale architecture diagram is worse than none.

### Implementation Tasks — Phase 1 (CEO)

Synthesized from this review's findings. Each derives from a specific finding above.

- [ ] **T1 (P1, human: ~1h / CC: ~10min) — art-pipeline** — Resolve P-E: measure and crop
  the 24 expression tiles and 8 pose crops into a sprite atlas + JSON coordinate map
  - Surfaced by: 0A premise P-E + subagent C3 — blocks E1 and E2
  - Files: `references/*.PNG` → `public/atlas/`, `src/data/atlas.json`
  - Verify: every tile renders in a dev harness page at the right crop
- [ ] **T2 (P1, human: ~30min / CC: ~5min) — data** — Encode the element decision:
  `ELEMENTS` for **Fire / Ice / Lightning / Wind** *(USER DECISION at the final gate —
  overrides Phase 2 F23, restores the Phase 1 call. Split `game/rules/elements.ts` from
  `ui/theme/elements.ts` per Phase 3 #16.)*
  - Surfaced by: C4.1 + Section 5 finding Q1
  - Files: `src/data/elements.ts`
  - Verify: grep finds zero hardcoded element hex values outside this file
- [ ] **T3 (P1, human: ~15min / CC: ~3min) — tooling** — ESLint `no-restricted-imports`
  boundary on `src/game/**` banning react/canvas/DOM/`Math.random`
  - Surfaced by: Section 1 finding A1 + Section 5 finding Q3
  - Files: `eslint.config.js`, CI workflow
  - Verify: adding `import React` to a `game/` file fails lint
- [ ] **T4 (P1, human: ~1h / CC: ~10min) — game/sim** — Spell out the fixed-timestep loop:
  accumulator, MAX_STEPS clamp, speed multiplier applied to accumulation not to dt
  - Surfaced by: Section 5 finding Q2, Section 4 gaps 3 and 4
  - Files: `src/game/sim.ts`
  - Verify: unit test — x2 speed produces exactly 2x steps, never larger steps
- [ ] **T5 (P1, human: ~2h / CC: ~20min) — errors** — Implement all 10 rescues from the
  Section 2 registry with structured warns
  - Surfaced by: Section 2 — the plan originally specified zero error handling
  - Files: `src/state/persist.ts`, `src/render/canvas.ts`, `src/ui/CrashPanel.tsx`
  - Verify: one unit test per rescue row
- [ ] **T6 (P1, human: ~1h / CC: ~10min) — state** — HUD slice published at ~10Hz; entity
  arrays never cross into React
  - Surfaced by: Section 7 finding P1 (the per-frame re-render trap)
  - Files: `src/state/store.ts`
  - Verify: React DevTools profiler shows no per-frame HUD renders; fps holds 60
- [ ] **T7 (P1, human: ~45min / CC: ~8min) — assets** — Transcode the mood reel to
  MP4/H.264 + WebM under 1.5MB with a poster
  - Surfaced by: Section 7 finding P2 — 8.5MB HEVC will not decode in Chrome/Firefox
  - Files: `references/copy_*.MOV` → `public/title.mp4`, `public/title.webm`
  - Verify: plays in Chrome, Firefox, Safari; poster shows when autoplay is blocked
- [ ] **T8 (P1, human: ~2h / CC: ~20min) — ui** — Interaction state coverage: loading,
  empty, and error states for all six screens
  - Surfaced by: Section 11 finding G1
  - Files: `src/ui/**`
  - Verify: each cell of the Section 11 matrix is reachable in a dev route
- [ ] **T9 (P1, human: ~2h / CC: ~20min) — a11y** — Keyboard placement, focus rings, 44px
  targets, icon+label alongside colour, `prefers-reduced-motion` disabling shake and cut-ins
  - Surfaced by: Section 11 finding G2
  - Files: `src/ui/**`, `src/render/fx.ts`
  - Verify: full run playable with keyboard only; reduced-motion kills shake
- [ ] **T10 (P2, human: ~1h / CC: ~10min) — ux** — Defeat screen names the wave reached and
  the leak that ended the run
  - Surfaced by: Section 11 user journey + landscape "one mistake, 30 wasted minutes"
  - Files: `src/ui/Results.tsx`
  - Verify: losing on wave 7 shows wave 7 and the responsible enemy type
- [ ] **T11 (P2, human: ~30min / CC: ~5min) — data** — Save blob `version` field + migrate-
  or-reset path
  - Surfaced by: Section 1 rollback posture, Section 9 finding D1
  - Files: `src/state/persist.ts`
  - Verify: a v0 blob loads into v1 without throwing
- [ ] **T12 (P2, human: ~1h / CC: ~10min) — tooling** — CI: typecheck + vitest + one
  Playwright smoke, deploy from `main`
  - Surfaced by: Section 9 finding D1
  - Files: `.github/workflows/ci.yml`
  - Verify: CI green on a PR
- [ ] **T13 (P2, human: ~1h / CC: ~10min) — devtools** — Dev overlay on `~`: fps, entity
  counts, seed, wave state
  - Surfaced by: Section 8 finding O1
  - Files: `src/ui/DevOverlay.tsx`
  - Verify: toggles in dev, tree-shaken out of the prod bundle
- [ ] ~~**T14** — `DESIGN.md` from the reference palettes~~ **SUPERSEDED BY T0** (Phase 2
  F24 promoted it to P1 and moved it ahead of every UI file)
  - Surfaced by: Section 11 DESIGN.md alignment
  - Files: `DESIGN.md`
  - Verify: every element palette traces to a specific character sheet
- [ ] **T15 (P3, human: ~30min / CC: ~5min) — perf** — Object pools for projectiles and
  particles; particle cap ~300
  - Surfaced by: Section 7 memory
  - Files: `src/render/fx.ts`
  - Verify: heap stays flat across a 15-wave run

### TODOS.md updates

Deferred items are written to `TODOS.md` with full context (what / why / pros / cons /
effort / priority / depends-on) so they are recorded rather than remembered. Written as
part of this phase.

### Completion Summary — Phase 1

```
  +====================================================================+
  |            MEGA PLAN REVIEW — COMPLETION SUMMARY (CEO)             |
  +====================================================================+
  | Mode selected        | SELECTIVE EXPANSION (auto)                  |
  | System Audit         | greenfield; 2 commits, no source, no TODOs  |
  | Step 0               | approach B; 6 premises, 1 rejected, 1 gated |
  | Section 1  (Arch)    | 3 issues (A1 boundary, A5 scaling, SPOF)    |
  | Section 2  (Errors)  | 14 error paths mapped, 0 GAPS after fixes   |
  | Section 3  (Security)| 1 issue (S1 dep budget), 0 High             |
  | Section 4  (Data/UX) | 15 edge cases mapped, 9 gaps, all fixed     |
  | Section 5  (Quality) | 3 issues (Q1 DRY, Q2 loop, Q3 determinism)  |
  | Section 6  (Tests)   | Diagram produced, 1 critical gap (T1: none) |
  | Section 7  (Perf)    | 2 issues (P1 rerender, P2 video codec)      |
  | Section 8  (Observ)  | 1 gap (O1 dev overlay)                      |
  | Section 9  (Deploy)  | 1 risk flagged (D1 no CI/host), 0 blocking  |
  | Section 10 (Future)  | Reversibility: 5/5, debt items: 2 (labelled)|
  | Section 11 (Design)  | 2 issues (G1 states, G2 a11y)               |
  +--------------------------------------------------------------------+
  | NOT in scope         | written (12 items)                          |
  | What already exists  | written (nothing in-repo; art under-used)   |
  | Dream state delta    | written (~40%, load-bearing)                |
  | Error/rescue registry| 13 codepaths, 0 CRITICAL GAPS               |
  | Failure modes        | 14 total, 0 CRITICAL GAPS                   |
  | TODOS.md updates     | 3 items (E9, E10-extended, E11b)            |
  | Scope proposals      | 11 proposed, 8 accepted, 3 deferred         |
  | CEO plan             | written                                     |
  | Outside voice        | ran (claude subagent); codex unavailable    |
  | Lake Score           | 17/18 recommendations chose complete option |
  | Diagrams produced    | 8 (arch, dataflow, state, error, edge,      |
  |                      |    test, userflow, ui-states)               |
  | Stale diagrams found | 0 (greenfield)                              |
  | Unresolved decisions | 3 (premise gate: C2, C4-elements, E5)       |
  +====================================================================+
```

**Lake Score 17/18** — one recommendation deliberately chose the *less* complete option
(E5 downgraded from a Monte Carlo harness to a parameter sweep) because the subagent's H6
argument was correct: a naive play policy produces false precision, which is worse than no
number at all.

## PREMISE GATE — RESOLVED

**Answered A: playable game first, meta screens as static fixture shells.** Scope S3
confirmed. Five real screens built deep (Title, Stage Select, Battle, Mage Info, Results)
plus Shop / Inventory / Quests / Team as reachable static layouts carrying the mockup's own
fixture data. E11a is **IN**. Logged as a durable decision.

---

# PHASE 2 — DESIGN REVIEW

Scope gate auto-decided: target is this plan file. Voices: Claude subagent only
(`[subagent-only]`). Mockups: **not generated** — the gstack designer binary is present but
requires an OpenAI API key that is not configured (`$D setup` or `~/.gstack/openai.json`).
Falling back to written specs. This is a real degradation and is called out rather than
hidden: the specs below would be sharper with a rendered mockup to argue against.

> **RESOLVED AFTER THE FACT.** A live key was supplied later and written to
> `~/.gstack/openai.json`, so the gstack designer is enabled for future runs. The specs below
> were executed by hand into `design/index.html` (11 screens) plus six generated assets in
> `design/assets/art/` — see `design/art.html`.

## Step 0: Design Scope Assessment

**0A. Initial design rating: 4/10.** The plan describes what the *system* does in
exhaustive detail and what the *player sees* barely at all. Section 11 produced a state
matrix and an a11y list, which is why this is not a 2. But the chrome palette is wrong,
the lose condition has no home on screen, an entire interface (tower select / upgrade /
sell) is missing, and typography is unspecified. A 10 for this plan means: every screen's
first-second-third read is named, every state has a visual not a toast, the chrome palette
and three typefaces are decided, the battlefield draw pipeline is a spec rather than the
word "programmatic," and the tower interaction is designed before it is built.

**0B. DESIGN.md status: does not exist.** Scheduled as T14 at P2. That ordering is wrong
and is corrected below (F24).

**0C. Existing design leverage.** Nothing in-repo. The reference sheet is the pattern
library: its dark panel chrome, gold hairlines, corner flourishes, card rail, stat rows,
and node-graph stage map are all reusable structure. The character sheets are the taste
authority. These are two different authorities and the plan was conflating them.

**0D. Focus areas.** *Auto-decided (P1): all 7 passes, no narrowing.*

## Step 0.5 — Dual Voices

### CODEX SAYS (design — UX challenge)

`[codex-unavailable: auth missing]`.

### CLAUDE SUBAGENT (design — independent review)

Read the plan, the 11-screen mockup sheet, a character sheet, and the logo lockup with
fresh context. Returned 28 findings, 6 critical. Its closing judgment:

> "The plan is unusually rigorous on engineering risk and unusually thin on the thing it
> claims is the product. It says 'the product IS the aesthetic and the game feel,' then
> allocates 15 implementation tasks of which exactly two are visual."

That lands. Phase 1 spent its rigor on the parts that were easy to be rigorous about.

### Design litmus scorecard

```
DESIGN DUAL VOICES — CONSENSUS TABLE:
═══════════════════════════════════════════════════════════════
  Dimension                            Claude  Codex  Consensus
  ──────────────────────────────────── ─────── ────── ─────────
  1. Chrome palette correct?           NO      N/A    NOT CONFIRMED (F1 — plan had it inverted)
  2. Information hierarchy right?      NO      N/A    NOT CONFIRMED (F3 — lose condition invisible)
  3. Interaction states complete?      NO      N/A    NOT CONFIRMED (F8/F9/F10 — whole UI missing)
  4. Emotional arc coherent?           NO      N/A    NOT CONFIRMED (F15/F16/F17)
  5. Specific UI, not generic?         PARTIAL N/A    NOT CONFIRMED (F20/F21/F22)
  6. Responsive + a11y intentional?    PARTIAL N/A    NOT CONFIRMED (F26/F27)
  7. AI-slop risk defended?            NO      N/A    NOT CONFIRMED (F2 — defence was backwards)
═══════════════════════════════════════════════════════════════
0/7 CONFIRMED. Codex missing → N/A.
```

## Pass 1: Information Architecture — 4/10 → 9/10

**F3 (critical) — the player cannot see whether they are losing.** Phase 1 claimed the
Battle hierarchy was "wave counter and crystal health top." Verified against the mockup:
crystal HP **is not on screen 2 at all**. The HUD pill carries wave, kills, speed, pause,
nothing else. Actual eye order on the mockup is bright green map → bright card rail → small
low-contrast HUD pill, so the read is "pretty map / my buttons / how am I doing" — exactly
backwards for a tower defense, where "am I about to lose" has to be pre-attentive.
*Auto-decided (P1, hierarchy as service): crystal HP lives **in-world** as a segmented ring
around the crystal. The crystal is already the visual anchor, so this costs zero hierarchy
budget and no fourth HUD element. Add a red edge vignette pulse on damage and a screen-edge
crack overlay under 30%.*

**F4 (high) — mage card affordability is the most-repeated read in the game and has no
design.** The mockup shows all four cards identically lit. Phase 1's answer to "no mage
selected" was a toast, which is a message where a visual state belongs. *Auto-decided (P1):
four specified states — **affordable** (full colour, gold hairline), **unaffordable**
(desaturated portrait, red cost, no border), **selected** (2px gold border, 4px lift, range
circle appears on field), **cooldown** (radial sweep over the portrait). Deselect by
re-tapping the card or tapping off-grid.*

**F5 (high) — the title screen's four dead fixture tabs outcompete its one real action.**
*Auto-decided (P5, subtraction): START gets roughly double its mockup weight; the four
fixture tabs drop to lower opacity with a small PREVIEW tag.*

**F6 (medium) — stage select has no "play this next" signal**; every unlocked node is
treated identically. *Auto-decided (P1): next-playable node pulses with a gold ring;
cleared nodes drop to 60% opacity but keep their stars; locked nodes are near-flat
silhouettes.*

**F7 (medium) — Mage Info's three buttons all lead nowhere in scope.** *Auto-decided (P5):
one live action (close); the other two render as visibly padlocked, reusing the mockup's own
locked-slot treatment from screen 4.*

**F18 (medium) — the navigation model is undefined.** Footer tabs appear only on screen 1;
screen 3 closes with an X, screens 9-10 with a back arrow. *Auto-decided (P5): no persistent
nav. Title is the hub, every other screen gets a single top-left back affordance, meta
shells are reachable from title only. A bottom tab bar would be wrong on desktop anyway.*

## Pass 2: Interaction State Coverage — 5/10 → 9/10

**F8 (critical) — tower select / upgrade / sell has no UI anywhere.** Scope includes place,
upgrade across 3 tiers, and sell. The mockup has no panel, no radial, no sheet for any of
it. That is an entire interface on the primary screen that an implementer would have to
invent under a 2-hour time box. *Auto-decided (P1): tapping a placed mage **swaps the bottom
card rail** into a tower panel in the same slot — portrait, tier pips, DPS, upgrade cost,
sell refund, range circle on field, dismiss by tapping off-grid. Reusing the rail avoids
adding a modal to a 640px-tall viewport.*

**F9 (critical) — upgrade tiers must be visible on the battlefield.** If tier 1 and tier 3
look the same, the economy feels meaningless, which is documented failure #2 from the
landscape check. *Auto-decided (P1): tier is carried by the magic-circle decal — 1 ring /
2 rings plus rotation / 3 rings plus an orbiting element mote — plus a gold pip cluster.
This makes E3 load-bearing rather than decorative, which is a better justification than the
one it originally had.*

**F10 (high) — INTERWAVE has a state-machine node and no UI.** It is in the Phase 1 state
diagram and absent from the state matrix. This is the build phase, the screen where the
player actually thinks. *Auto-decided (P1): wave banner (E6), countdown ring on a READY
button, next-wave enemy-type preview icons, full placement and upgrade access, and a mana
bonus for skipping early.*

**F11 (high) — "coming soon" on the meta shells contradicts the scope decision just made.**
The entire point of E11a is that the mockup's fixture content makes the sheet read as
delivered. *Auto-decided (P1): render the literal fixture content — ¥480 初心者パック, the
96/120 inventory count, the four quest rows — with one unobtrusive PREVIEW chip in the
header. Never an empty state.*

**F12 (high) — no defeat screen design.** Phase 1's T10 added defeat *copy* and no layout.
*Auto-decided (P1): defeat leads with the achievement number — `WAVE 12 / 15` at banner
scale — with the word DEFEAT secondary, a best-ever marker, the enemy type that leaked, and
RETRY as the primary button. Same skeleton as victory, inverted emphasis.*

**F13 (high) — no first-run state, which directly contradicts the done condition** ("someone
who has never seen the game reaches wave 15 without instruction"). Nothing in the plan
teaches placement. *Auto-decided (P1): on wave 1 of stage 1 only, pre-highlight one
buildable socket with a pulsing gold ring and one line of ghost text, gone after the first
placement. One conditional, not a tutorial system.*

**F14 (medium) — the Phase 1 state matrix cargo-culted web patterns instead of game
states.** "Stage select: skeleton cards" for a synchronous localStorage read is theatre;
"Results LOADING: count-up anim" files a success animation as loading; "Battle LOADING:
atlas spinner" is the slop answer. *Auto-decided (P5): preload the atlas during stage select
so battle never loads, delete the skeleton, move count-up to SUCCESS, and replace those rows
with the states that actually exist — card-selected, card-unaffordable, tower-selected,
interwave, crystal-critical, tab-away-autopaused. This supersedes the Section 11 matrix.*

## Pass 3: User Journey & Emotional Arc — 3/10 → 9/10

```
  STEP | USER DOES              | USER FEELS        | NOW SPECIFIED BY
  -----|------------------------|-------------------|---------------------------
  1    | Lands on title         | curiosity         | mood-reel video + logo (M10)
  2    | Taps START             | anticipation      | stage map, next node pulses (F6)
  3    | Enters wave 1          | uncertainty       | first-run socket hint (F13)
  4    | Places first mage      | competence        | ghost + range circle (E8)
  5    | Kills first enemy      | satisfaction      | numbers + shake + poof (E4)
  6    | Between waves          | planning          | interwave screen (F10)
  7    | Crystal takes a hit    | alarm             | HP ring + vignette pulse (F3)
  8    | Fires an ultimate      | power             | cut-in (E2, constrained)
  9    | Wins                   | pride             | MVP mage on results (F17)
  9'   | Loses                  | *frustration*     | achievement-first defeat (F12)
  10   | Retries                | determination     | sub-second retry (F16)
```

**F15 (critical) — the chest milestone bar is arithmetically impossible.** The mockup's
stage select shows chests at ★12 / ★24 / ★36. Scope is 3 stages x 3 stars = **9 maximum**.
The first chest is unreachable. Shipping this makes the primary progression surface a
visible lie on first load. *Auto-decided (P1): rescale to ★3 / ★6 / ★9 and make the chests
grant something real. Copying fixture numbers without checking their arithmetic is exactly
the failure mode E11a invites, and this is the proof.*

**F16 (high) — losing on wave 12 of 15 costs 12 waves of replay, and Phase 1's fix was a
text label.** Naming the wave does not shorten the loop. *Auto-decided (P1): RETRY re-enters
in under a second preserving speed setting and selected mage; restart available from the
pause menu so nobody has to lose on purpose to reset; and the crystal absorbs 3 leaks before
defeat rather than dying on a HP number, so a mistake is legible instead of fatal.*

**F17 (high) — victory has no character in it.** E1 and E2 spend the art budget on reactive
portraits and cut-ins during battle, then results is a static winged banner. The one moment
the anime identity should land has zero anime in it. *Auto-decided (P1): the results panel
features the MVP mage (most damage dealt) as pose art with a delighted expression tile and a
rotating element circle behind. One image slot, and it is the screenshot people share.*

**Time-horizon check.** 5 seconds: the mood reel and logo carry it. 5 minutes: the interwave
planning beat and tier-visible upgrades carry it. 5 years: nothing, and that is correct for
a 3-stage build — meta-progression is deferred by design, not overlooked.

## Pass 4: AI Slop Risk — 4/10 → 9/10

Classifier: **APP UI** (game HUD, data-dense, task-focused), not a landing page.

**F1 (critical) — the plan prescribes the wrong chrome, and its stated anti-slop defence was
the thing destroying reference fidelity.** Phase 1 Section 11 called for "cream/parchment
panels with gold hairline rules" and warned against "a generic dark-glass game UI." Verified
against the sheet: **all 11 mockup screens are near-black/navy panels with gold hairlines and
gold-on-dark type.** Cream is the ground of the *character sheets* and the *logo lockup* —
production-bible documents, not the game UI. An implementer following Phase 1 would have
built a cream game that looks nothing like the reference. *Auto-decided (P1, and this
**supersedes Section 11**): chrome is dark (navy base, darker navy panels, gold hairlines,
gold-to-cream type). Cream is reserved for exactly two places — the logo lockup, and the
Mage Info panel background where it reads as a character dossier and earns its keep.*

**F2 (high) — the anti-slop argument was inverted.** The mockup sheet *is* generic F2P gacha
boilerplate: quest rows, ¥ bundle cards, currency rails, chest bars, and inconsistent
Japanese across panels. Copying it faithfully ships slop. The differentiating asset is the
character sheets — the crimson, the gold filigree, the drawn magic circles, the costume
language. *Auto-decided (P1): treat the mockup as **structure and chrome authority** and the
character sheets as **taste authority**. Explicit ban list in DESIGN.md: no glassmorphism
blur, no neon rim-glow on every panel, no purple-cyan gradient, no generic epic particle
burst, no drop-shadowed white sans.*

**Cut-in risk (high) — E2 is the highest-slop-risk item in the plan.** Hikari's own staff
sheet shows four mutually inconsistent staff designs, and the pose panels carry the usual
hand and finger artifacts. Blowing that up full-bleed at the game's most dramatic moment
magnifies exactly those flaws. *Auto-decided (P1): cut-ins use a tight crop (face, shoulders,
magic circle), a heavy element-coloured gradient wash, a hard diagonal wipe frame, and 400ms
maximum on screen. Never raw full-bleed pose art.*

**F26 (medium) — "ambient bleed" is the entire desktop spec and is where slop lands.** Left
undefined it becomes a blurred stretched copy of the artwork behind the play column, which is
the single most recognizable AI-slop web pattern. *Auto-decided (P5): flat dark field, one
large low-opacity element magic circle behind the column, corner logo watermark. Nothing
else.*

**Unaccounted asset (high):** the title screen's hero illustration — four mages in a
landscape — **does not exist**. It appears only as a ~200px thumbnail inside the mockup
sheet. Someone has to composite four separate character crops over the mood-reel video, and
nothing in the plan said so. *Auto-decided (P1): added as an explicit task.*

## Pass 5: Design System Alignment — 2/10 → 9/10

**F21 (critical) — typography is entirely unspecified and there is no Japanese font
strategy.** The plan budgets 1.5MB for a video and zero bytes for fonts, on a UI whose
labels are mostly Japanese. A missing JP stack means tofu boxes or system-fallback ugliness
on Windows. Phase 1 also asserted "a serif display face for numerals"; the mockup's stat
numerals are a **sans**. *Auto-decided (P1): three faces, named in DESIGN.md — a serif
display (Cinzel/Marcellus class) for the logo and banner words only, a Latin UI sans for all
functional labels, and a tabular-lining sans for numerals. **Amended by the F20 user
decision:** the Japanese face (Noto Sans JP) is now a **flavour-only** face, subset to the
~40-60 glyphs the accent strings actually use — a few KB rather than 40.*

**F24 (high) — DESIGN.md is scheduled after the screens it governs.** It sits at P2/30min
while all screen-state and a11y work sits at P1. Build the screens first and every screen
invents its own spacing, radius, and border weight. *Auto-decided (P1): DESIGN.md becomes
**T0**, before any UI file, and must contain the 8px spacing scale, two corner radii, the
gold hairline spec including its 2x-DPR behaviour, panel elevation rules, and the four
element palettes traced to specific sheet swatches.*

**F25 (high) — roughly 30 distinct icons in the mockup and zero icon strategy.** Currency,
five stat glyphs, four elements, skull, star, chest, lock, speed, pause. *Auto-decided (P4):
one inline SVG sprite sheet, single-colour plus gold, drawn once. No icon library — nothing
generic will match this vocabulary.*

## Pass 6: Responsive & Accessibility — 5/10 → 9/10

**F27 (medium) — no minimum viewport is stated.** An iPhone SE gives roughly 375x630 usable.
The bottom rail must hold a mana bar plus four 44px-minimum cards plus safe-area inset, and
the battlefield still has to be readable. *Auto-decided (P1): floor is 360x640; the map
viewport compresses first, never the rail; verify the crystal HP ring is legible at that
size.*

**Desktop affordances (medium).** The Phase 1 spec was mobile-only. *Auto-decided (P1): hover
range preview on sockets, hover tooltip on placed towers, Esc to deselect.*

Phase 1's a11y list (T9) stands and is reaffirmed: keyboard placement, focus rings, 44px
targets, colour never the sole carrier of meaning, and `prefers-reduced-motion` disabling
screenshake and cut-ins. F3's red vignette and F9's rotating decals are both added to the
reduced-motion opt-out.

## Pass 7: Unresolved Design Decisions

```
  DECISION NEEDED                    | IF DEFERRED, WHAT HAPPENS
  -----------------------------------|-----------------------------------------------
  Japanese, English, or both? (F20)  | RESOLVED below — was Open Question 3, never
                                     | answered in the whole Phase 1 document
  Battlefield draw pipeline (F22)    | RESOLVED below — P-E was promoted to blocking
                                     | and then T1 only covered character crops
  Element set (F23)                  | TASTE → final gate. Reverses the Phase 1 call.
```

**F20 (critical) — language. RESOLVED BY USER AT THE FINAL GATE: English first, Japanese as
flavour only.** Open Question 3 went unanswered across the whole of Phase 1, and it
determines every label, the font stack, and every layout width.

**Decision: English is the functional language. Japanese appears only as anime-styled
accent.** Concretely:

| Surface | Treatment |
|---|---|
| Buttons, stats, costs, tooltips, all functional labels | **English only** |
| Logo lockup | Keep as-is — `React TD` with `リアクトTD` beneath (it is artwork, not a label) |
| Chapter / stage names | English primary (`Ch.3 — Valley of Wind`), kanji as a small gold accent above (`第3章 風の谷`) |
| Mage class names on the info screen | English primary (`Red Mage`), `レッドメイジ` as flavour subtitle |
| Wave banner (E6) | `WAVE 12` primary, small kanji accent |
| Victory / defeat banners | English word, kanji flourish |

This **reverses the bilingual JP-primary call** and is a net simplification. Consequences
now in scope:
- **Font weight drops sharply.** No full-UI Japanese stack is needed. The JP subset shrinks
  from ~120 glyphs to roughly **40-60** — only the flavour strings — which is a handful of
  KB. Update T0's typography section accordingly.
- **Layout widths change.** English labels are wider than the Japanese equivalents the
  mockup was laid out for. Button and card padding must be re-measured against English
  strings at the 360px floor (F27), not copied from the mockup's spacing.
- **Flavour kanji must never carry meaning alone.** If a player cannot read it, nothing is
  lost. This also removes a quiet accessibility problem the bilingual plan had.

**F22 (critical) — the battlefield pipeline is still unresolved.** Phase 1 promoted P-E to a
blocking Hour-0 deliverable and then wrote T1 to cover only character expression and pose
crops. How the ground, the path, the sockets, the towers, and the enemies get drawn — the
largest visual surface on the primary screen — had no answer anywhere. The mockup's map is a
painted illustration that does not exist as an asset. *Auto-decided (P1): **procedural
canvas**, specified rather than described as "programmatic art" — dark-green noise-tinted
ground, sand path stroked from the waypoint spline, hex sockets as one pre-rendered offscreen
sprite, enemies as flat cloaked silhouettes with an element-tinted rim light (which reads as
deliberate style rather than missing art), towers as a stacked gold-and-navy primitive plus
the magic-circle decal.*

> **F23 OVERRIDDEN BY USER AT THE FINAL GATE.** The element set is
> **Fire / Ice / Lightning / Wind** (the mockup's), not the character sheets'. The analysis
> below is retained because its observation is still true and must be *designed around*:
> Takumi's pose art shows rocks and leaves, Kai's shows radiance. Mitigation now in scope —
> element identity is carried by the parts we author (tower decals, projectile VFX, magic
> circles, element badges), and the character art is used as **framed portraits**, where the
> mismatch is least visible. Do not build Wind VFX out of leaves or Lightning VFX out of
> sparkles just because the pose art does.

**F23 (high) — element set: REVERSING the Phase 1 decision.** Phase 1 auto-decided
Fire/Ice/Lightning/Wind because the mockup's icon set is what gets reused. The design voice
argues the opposite and is more persuasive on cost: that trade preserves four trivially
redrawable flat glyphs while discarding the coherence of 24 expression tiles, 8 poses, 4 prop
sheets, and 4 drawn magic circles. I verified this against the art — **Takumi's pose panel
literally shows floating rocks and leaves** (earth, not wind), and **Kai's shows a gold magic
circle and radiance** (light, not lightning). Labelling them Wind and Lightning would look
wrong in the exact places the art is strongest. Also weakening the Phase 1 argument: the
mockup's element-named *towers* (アイス塔 etc.) are deferred content anyway.
*~~Auto-decided (P1, reversing): **Fire / Water / Light / Earth** per the character sheets.~~
**OVERTURNED AT THE FINAL GATE — the set is Fire / Ice / Lightning / Wind.** Original text:*
Redraw four glyphs, roughly 30 minutes of canvas arcs. **Surfaced as the top taste decision
at the final gate**, because it overrides the mockup's own iconography and reverses an
earlier call in this same pipeline.*

**F19 (medium) — fixture stamina implies a mechanic that does not exist.** Stage select's
rail shows 30/30 stamina; a player reads that as a play limit. *Auto-decided (P5): drop
stamina from the rail, keep coin and gem.*

**F28 (medium) — star thresholds are never shown**, so the rating reads as arbitrary.
*Auto-decided (P1): threshold pips on the crystal HP ring, rule echoed on results.*

## Required Outputs — Phase 2

### NOT in scope (design)

| Item | Why |
|---|---|
| Generated visual mockups | Designer binary needs an OpenAI key that is not configured. Written specs instead. |
| Persistent bottom navigation | Title-as-hub is correct for 5 screens and wrong on desktop (F18). |
| Skeleton loaders | Theatre over a synchronous localStorage read (F14). |
| Full-bleed pose cut-ins | Magnifies AI-art hand and staff artifacts (cut-in risk). |
| Blurred artwork desktop backdrop | The most recognizable AI-slop web pattern (F26). |
| Icon library dependency | Nothing generic matches this vocabulary (F25). |
| Stamina in the stage-select rail | Implies a mechanic that does not exist (F19). |

### What already exists (design)

The mockup sheet is the **structure and chrome** authority: dark navy panels, gold hairlines,
corner flourishes, the bottom card rail, stat rows, the node-graph stage map, locked-slot
treatment, and the tab bar. The character sheets are the **taste** authority: per-element
palettes, gold filigree, costume language, magic circles, and 24 expression tiles. The logo
lockup supplies the cream-and-gold display treatment for banners. No DESIGN.md and no
in-repo components exist.

### Implementation Tasks — Phase 2 (Design)

- [ ] **T0 (P1, human: ~1h / CC: ~12min) — design-system** — Write `DESIGN.md` BEFORE any UI
  file: dark chrome palette, 8px scale, two radii, gold hairline at 1x/2x DPR, elevation,
  three named typefaces, four element palettes traced to sheet swatches, AI-slop ban list
  - Surfaced by: Pass 5 F24 + F1 + F21 — supersedes Phase 1 T14
  - Files: `DESIGN.md`
  - Verify: every token traces to a specific reference file
- [ ] **T16 (P1, human: ~2h / CC: ~20min) — render** — Battlefield draw pipeline. **REVISED —
  the art scarcity that forced full-procedural is gone.** Ground is now a painted tiling texture
  (`ground-valley-dark.png`, edge mismatch 6.5/255) instead of the flat 3-value fill, which was
  itself a workaround for Phase 3 #18 ("noise reads as mud at 360px"). Enemies are now real
  sprites (shade / armored / scout / boss) instead of rim-lit silhouettes, which existed only
  because no enemy art did. **Still procedural, deliberately:** the path (must align to the
  waypoint spline), hex sockets, tower primitives, magic-circle decals, damage glyphs and all
  HUD geometry — vector stays crisp at every size
  - Surfaced by: Pass 7 F22 — the P-E gap Phase 1 left open
  - Files: `src/render/field.ts`, `src/render/entities.ts`
  - **Reference implementation exists: `design/scene.html`** — a live battlefield running the
    whole render layer (painted ground, generated tower and enemy sprites, procedural path,
    magic-circle decals, additive projectiles with trails, expanding impact bursts, damage
    numbers, HP bars, ice-slow rings, crystal leak ring). Runs with zero console errors.
    What remains is porting it into `src/render/` against the real `SimState` rather than the
    demo's inline state.
  - Verify: battle screen reads as intentional art at 360x640; see `design/scene.html`
- [ ] **T17 (P1, human: ~2h / CC: ~20min) — ui/battle** — Tower interaction panel: rail swaps
  to portrait, tier pips, DPS, upgrade cost, sell refund, range circle, off-grid dismiss
  - Surfaced by: Pass 2 F8 — an entire missing interface on the primary screen
  - Files: `src/ui/TowerPanel.tsx`, `src/ui/CardRail.tsx`
  - Verify: place, upgrade to tier 3, sell, all without leaving the battle screen
- [ ] **T18 (P1, human: ~1h / CC: ~10min) — ui/battle** — Crystal HP ring, damage vignette
  pulse, sub-30% edge crack, star threshold pips
  - Surfaced by: Pass 1 F3 + Pass 7 F28 — the lose condition was invisible
  - Files: `src/render/crystal.ts`
  - Verify: HP legible at 360x640 without a HUD element
- [ ] **T19 (P1, human: ~1h / CC: ~10min) — ui/battle** — Mage card states: affordable,
  unaffordable, selected, cooldown
  - Surfaced by: Pass 1 F4
  - Verify: all four states reachable; deselect works via card and off-grid
- [x] **T20 (P1) — render — DONE (art side).** 12 element magic circles generated procedurally
  on canvas and exported as transparent PNGs: 4 elements x 3 tiers. Generator is
  `design/gen/circles.html` (the canvas code is the real deliverable — the game draws these at
  runtime); masters in `design/assets/circles/`, game-size 128px in `.../128/` at 8% the byte
  size. Viewer with a 120px battlefield mock: `design/circles.html`.
  Each element is a distinct **shape** (petals / hex lattice / zigzag spokes / spiral), so they
  survive greyscale like the icon set. **Verified: tier is distinguishable at 120px.**
  Still to do: wire the decals into the real render loop and add the gold tier pips.
  - Surfaced by: Pass 2 F9 — makes E3 load-bearing
- [ ] **T21 (P1, human: ~1h / CC: ~10min) — ui** — Interwave screen: banner, countdown ring,
  next-wave preview icons, skip-for-mana
  - Surfaced by: Pass 2 F10 — state-machine node with no UI
  - Verify: reachable between every wave; skipping grants the bonus
- [ ] **T22 (P1, human: ~30min / CC: ~5min) — data** — Fix chest milestones to ★3/★6/★9 and
  drop stamina from the rail
  - Surfaced by: Pass 3 F15 (arithmetically impossible) + Pass 7 F19
  - Verify: max achievable stars is 9 and the last chest is reachable
- [ ] **T23 (P1, human: ~1h / CC: ~10min) — ui** — Defeat layout: achievement-first, leak
  attribution, RETRY primary, sub-second re-entry, pause-menu restart, 3-leak grace
  - Surfaced by: Pass 2 F12 + Pass 3 F16
  - Verify: losing on wave 12 leads to replaying in under a second
- [ ] **T24 (P1, human: ~30min / CC: ~5min) — ui** — First-run socket hint on stage 1 wave 1
  - Surfaced by: Pass 2 F13 — the done condition depends on it
  - Verify: a first-time player places a mage without being told how
- [ ] **T25 (P2, human: ~45min / CC: ~8min) — ui** — MVP mage pose art + expression on results
  - Surfaced by: Pass 3 F17 — victory had no character in it
- [x] **T26 (P2) — assets — DONE, and UN-CUT.** Phase 3 #10 cut this because compositing four
  cream-backed crops over the mood reel needed alpha matting nobody had budgeted. With an image
  API available that blocker is moot: `design/assets/art/title-hero.png` is a single generated
  key visual, directed to leave the upper third empty for the logo. Mocked into the title frame
  at `design/art.html`. The framed-portrait direction still stands for the *expression tiles*.
  - Surfaced by: Pass 4 — the hero illustration did not exist as an asset
- [x] **T27 (P2) — assets — DONE.** `design/icons.svg`: 24 inline SVG symbols generated by Codex,
  stroked in `currentColor`. Proof sheet at `design/icons.html` with a greyscale check and a
  12-44px size ramp. Five were regenerated by hand after review: `i-star` and `i-star-empty`
  shipped with **byte-identical paths** (an earned star was indistinguishable from an empty one,
  and stars are the whole progression currency), and `i-skull`, `i-sword`, `i-boot`,
  `i-heart-crystal` did not read as their subjects. Greyscale a11y check on the four element
  emblems: PASS.
  - Surfaced by: Pass 5 F25
- [ ] **T28 (P2, human: ~45min / CC: ~8min) — ui** — Meta shells render literal fixture
  content with a PREVIEW chip; never "coming soon"
  - Surfaced by: Pass 2 F11 — contradicted the E11a scope decision
- [ ] **T29 (P2, human: ~30min / CC: ~5min) — ui** — Desktop affordances: socket hover range,
  tower tooltip, Esc to deselect; ambient backdrop spec
  - Surfaced by: Pass 6 + Pass 4 F26
- [ ] **T30 (P2, human: ~30min / CC: ~5min) — ui** — Title/stage-select hierarchy: START
  weight, fixture tabs de-emphasized, next-node pulse, padlocked Mage Info actions
  - Surfaced by: Pass 1 F5, F6, F7

### Completion Summary — Phase 2

```
  +====================================================================+
  |         DESIGN PLAN REVIEW — COMPLETION SUMMARY                    |
  +====================================================================+
  | System Audit         | no DESIGN.md; UI scope = 5 deep + 4 shells  |
  | Step 0               | 4/10 initial; all 7 passes, no narrowing    |
  | Pass 1  (Info Arch)  | 4/10 → 9/10  (6 findings)                   |
  | Pass 2  (States)     | 5/10 → 9/10  (7 findings)                   |
  | Pass 3  (Journey)    | 3/10 → 9/10  (3 findings)                   |
  | Pass 4  (AI Slop)    | 4/10 → 9/10  (4 findings)                   |
  | Pass 5  (Design Sys) | 2/10 → 9/10  (3 findings)                   |
  | Pass 6  (Responsive) | 5/10 → 9/10  (2 findings)                   |
  | Pass 7  (Decisions)  | 4 resolved, 1 deferred to gate (elements)   |
  +--------------------------------------------------------------------+
  | NOT in scope         | written (7 items)                           |
  | What already exists  | written (mockup = chrome, sheets = taste)   |
  | TODOS.md updates     | 0 new (all findings became tasks)           |
  | Approved Mockups     | 0 generated (designer needs OpenAI key)     |
  | Decisions made       | 27 added to plan                            |
  | Decisions deferred   | 1 (element set → final gate)                |
  | Overall design score | 4/10 → 9/10                                 |
  +====================================================================+
```

Two Phase 1 outputs are **superseded** by this phase: Section 11's cream-chrome direction
(F1) and Section 11's interaction state matrix (F14). Phase 1's T14 is replaced by T0.

> **Read every score in this document as "N findings, unverified until implemented."**
> Phase 3 finding #19 is right that the self-awarded numbers (0 CRITICAL GAPS, Lake Score
> 17/18, design 4/10 → 9/10, 0 blocking risks) are decorative. Phase 1 scored itself
> gap-free and Phase 2 then found its chrome inverted, its element set wrong, an entire
> interface missing, and an impossible progression bar. Phase 2 scored itself 9/10 and
> Phase 3 found the reference art is not in the repo at all. The scores are retained for
> the audit trail, not as evidence.

---

# PHASE 3 — ENG REVIEW

Voices: Claude subagent only (`[subagent-only]`). Step 0 scope challenge: the complexity
check triggers (>8 files, 4 new modules) — *auto-decided per /autoplan: **never reduce**
(P2). Proceed as-is; the module count was justified in Section 1 and re-justified below.*

**Search check [Layer 1/2]:** the accumulator pattern is settled prior art (Gaffer On Games,
Sukin). Two documented footguns confirmed and both apply here: **do not multiply by dt
inside a fixed-step callback** (fixed steps already carry a constant dt), and the **spiral of
death** when a step costs more than it represents. Interpolation alpha (`acc / DT`) is the
standard fix for judder on high-refresh displays. No custom solution is being rolled where a
built-in exists — there is no built-in.

## Step 0.5 — Dual Voices

### CODEX SAYS (eng — architecture challenge)

`[codex-unavailable: auth missing]`.

### CLAUDE SUBAGENT (eng — independent review)

Read all 1591 lines, then **verified the plan's claims against the actual repo and the
reference art** rather than trusting either. Returned 19 findings, 3 critical. Its verdict:

> "The plan is well-organized and internally contradictory, and its central factual premise
> (the reference art) is not true in this worktree."

### Eng dual voices — consensus table

```
ENG DUAL VOICES — CONSENSUS TABLE:
═══════════════════════════════════════════════════════════════
  Dimension                            Claude  Codex  Consensus
  ──────────────────────────────────── ─────── ────── ─────────
  1. Architecture sound?               MOSTLY  N/A    NOT CONFIRMED (boundary right, enforcement wrong)
  2. Test coverage sufficient?         NO      N/A    NOT CONFIRMED (#15 — 5 gaps)
  3. Performance risks addressed?      NO      N/A    NOT CONFIRMED (#13 — projectiles/glyphs uncounted)
  4. Security threats covered?         YES     N/A    NOT CONFIRMED (agrees, but 2 minor adds)
  5. Error paths handled?              NO      N/A    NOT CONFIRMED (#14 — untestable rows, missing rows)
  6. Deployment risk manageable?       YES     N/A    NOT CONFIRMED (S-a: shared-origin storage)
═══════════════════════════════════════════════════════════════
0/6 CONFIRMED. Security is the one dimension where the independent voice agreed with the
plan and explicitly declined to manufacture findings.
```

## Section 1: Architecture Review

**#1 (CRITICAL, confidence 10/10) — the reference art does not exist in this worktree, and
is untracked in the main one.** I verified this directly:

```
$ git -C /Users/jaar/Jairus/Dev/react-td status --short
?? references/                      ← untracked, 26MB

$ git -C /Users/jaar/Jairus/Dev/react-td ls-files
README.md                           ← the ONLY tracked file

$ ls /Users/jaar/conductor/workspaces/react-td/kyoto/
CLAUDE.md  PLAN.md  README.md  TODOS.md      ← no references/
```

This branch is a linked worktree (`gitdir: .../worktrees/kyoto`), so it will never see
untracked files from the main checkout. T1 is declared the blocking Hour-0 deliverable and
**cannot start**. T7, T25, T26, E1, E2, and M10 all resolve to a path that does not exist
here. The atlas would be a derived artifact of an unversioned input — nobody else could
rebuild it and CI could not either. Phase 1's system audit reported "nothing in this repo to
reuse" and then both Phase 1 and Phase 2 asserted the art was "sitting unused in
`references/`". Neither checked. *Auto-decided (P1): new task **T-1**, ahead of everything —
commit the derived atlas, poster, and transcoded video plus a `PROVENANCE.md`, and verify
with a fresh clone. This is now the first thing that happens.*

**#8 (HIGH, 8/10) — the 10Hz HUD throttle breaks four features Phase 2 just accepted.**
T6 publishes the HUD slice at ~10Hz and asserts entity arrays never cross into React. Then
F4 needs mana-driven card affordability (cards would flip up to 100ms late and the mana bar
would visibly step), F8 needs a live `TowerInstance` in React, F4/E8 need React selection
state read by `render/`, and T9 needs `prefers-reduced-motion` gating `render/fx.ts`. The
architecture diagram is one-directional and four accepted features need the reverse edge.
*Auto-decided (P5, explicit over clever): two named channels. (a) A module-scoped mutable
ref that `render/` reads at 60Hz — **the mana bar moves onto the canvas**, which deletes the
problem rather than working around it. (b) A coarse zustand store for discrete transitions
only: wave number, state-machine node, selected card/tower **id** (never the instance),
settings. The tower panel reads a plain snapshot on selection-change, not per frame. And
stated plainly in the plan: **`SimState` never enters zustand** — the Phase 1 phrasing
"a zustand store bridging sim ↔ UI" would lead an implementer to put it there.*

**#16 (MEDIUM, 7/10) — `data/elements.ts` mixes presentation into the pure module,** and the
architecture diagram omits the `ui/ → data/` edge that must exist (card costs, mage names,
tier stats, palettes), which also puts the schema validator in the client bundle — a
bundle-weight decision made by accident against S1's dependency budget. *Auto-decided (P4):
split `game/rules/elements.ts` (multipliers, status types) from `ui/theme/elements.ts` (hex,
icon, label), keyed by one shared enum. Draw the missing edge.*

**S-a (MEDIUM-LOW, 8/10) — GitHub Pages puts `localStorage` on a shared origin.**
`<user>.github.io` is one origin shared with every other Pages project that user hosts; any
of them can read and write this game's save keys. *Auto-decided (P1): namespace keys as
`reactd:v1:*` regardless, and prefer a unique-subdomain host (Netlify). One line, free now.*

**S-b (LOW, 7/10) — the shop-shell trap is guarded only by a comment.** Section 3 named the
risk ("a shop screen that looks real is exactly where someone later wires a real payment
form") and mitigated it with `// FIXTURE`. *Auto-decided (P5): make it structurally hard —
no `<form>`, no `<input>`, no `onSubmit` anywhere in the meta shells, so wiring a payment
path requires deleting code rather than adding a handler. Same cost, actually enforces.*

## Section 2: Code Quality Review

**#3 (CRITICAL, 9/10) — wave count was specified three incompatible ways.** Scope said "15
waves across 3 stages" (5/stage), the done condition said "wave 15 of stage 1" (15/stage),
the 2am test said "all 15 waves of every stage" (45 total), and the minimum set said "one
stage, five waves". The done condition — the one sentence defining "finished" — contradicted
the scope line it certifies. **Amended in place: 15 waves per stage, 3 stages, session 1
ships stage 1 only.**

**#11 (CRITICAL, 9/10) — the win/lose model was specified three ways:** continuous crystal
HP (Section 1 state machine + star rule), 3 discrete leaks (F16), and an HP ring with
threshold pips (F28/T18). Three different games, all P1, none superseding the others.
Section 6's tests, the star calculation, the sweep, and T18's render all depend on which is
real. **Amended in place: discrete leaks.** Stars become leak-count based and T18 collapses
from an HP ring with pips to a 3-segment life ring — cheaper *and* clearer.

**#12 (CRITICAL, 9/10) — corrections were appended, never applied.** T2 still read
Fire/Ice/Lightning/Wind 400 lines after F23 reversed it; T14 was superseded with no marker;
Section 11's chrome and state matrix were superseded and still read as live spec. A
1591-line document where four sections are wrong-but-present will be mis-implemented.
**Amended in place — all four struck or annotated.** This finding is the reason Phase 3
edits the plan rather than appending to it.

**#5 (HIGH, 8/10) — the purity boundary is right; the enforcement doesn't catch what
breaks.** `no-restricted-imports` cannot catch `Math.random` (not an import), nor
`Date.now()`/`performance.now()` in a cooldown or status expiry (the most common determinism
leak in TD code, unmentioned), nor iteration-order dependence on `Set`/`Map` after entity
removal — which is where "deterministic given a seed" actually dies. *Auto-decided (P1): add
`no-restricted-globals`/`no-restricted-properties` for `Math.random`, `Date`, `performance`,
`window`, `document`, `localStorage` scoped to `src/game/**`; run sim tests under the **Node**
Vitest environment so DOM access throws instead of silently working; and add the only
enforcement that actually proves the property — a **determinism test**: same seed + same
ordered command log → identical state hash after 10k steps. A lint rule proves nothing;
that test does.*

**#7 (HIGH, 7/10) — determinism is claimed for benefits nothing in scope delivers.**
Approach B was justified partly on "deterministic replays" and O1 was sold as "reproducible
from the seed alone." Neither is true: nothing records a command log (a TD run is entirely
determined by when and where the player placed things), the seed is never persisted or
surfaced anywhere a player could report it, and `render/` particles will use `Math.random`
so "reproducible" covers the sim but not what the player saw. *Auto-decided (P1): keep an
in-memory ring of `(stepIndex, command)` plus the seed, dumped as copyable JSON on the
CRASHED panel and behind a small affordance on defeat. ~20 lines, makes T13 real, and it is
the only version of "deterministic replay" that exists at this scope.*

**#19 (PROCESS, 8/10) — the self-assessment scores are decorative and actively misleading.**
Addressed with the caveat banner above rather than deleting the audit trail.

## Section 3: Test Review

```
  NEW TEST TARGETS ADDED BY THIS PHASE     TYPE          WHY
  ─────────────────────────────────────    ──────────    ─────────────────────────────
  determinism: seed + command log →        unit          the ONLY real enforcement of
  identical state hash @10k steps                        the architecture's core claim
  golden test on data/: reachable          integration   a wave tune silently makes 3
  star range vs thresholds                               stars impossible; passes today
  fuzzer shrinking / minimizer             tooling       a 10k-step repro nobody debugs
                                                         is worse than no fuzzer
  save migration: unknown FUTURE version   unit          v0→v1 is vacuous at ship; v99
  (v99 → clean reset)                                    → reset is the real path
  atlas tile-dimension snapshot            unit          see #9 below
  step() dt invariant: dt is ALWAYS the    unit          replaces the wrong criterion
  constant; step count ≈ speed*N*60 ±1                   "x2 produces exactly 2x steps"
```

**#15 (MEDIUM, 8/10) — five test-plan gaps,** listed above. The one that actually bites at
2am Friday is the **golden test on `data/`**: someone tunes wave 7 for difficulty, the sim
runs fine, every test passes, and the star thresholds silently become unreachable or
automatic. It is a data edit that ruins progression and nothing catches it.

**#9 (HIGH, 8/10) — the atlas coordinate map is the most likely art bug in the project and
has zero detection.** The error registry covers `loadAtlas → 404`, but the realistic failure
is the hand-measured JSON drifting from the image: a wrong crop renders half a face, throws
nothing, logs nothing, and passes every test. On a 1536x1024 sheet a 10px error is invisible
in review and obvious in play. *Auto-decided (P1): T1's verify becomes a **committed dev
route** rendering all 24 tiles and 8 poses in a labelled grid, plus a snapshot test
asserting every tile shares identical width and height.*

**#14 (MEDIUM, 8/10) — half the error-registry rows are untestable as written, and the
registry misses the failures that actually happen.** You can only test your own stub for
`QuotaExceededError`, `SecurityError`, and `getContext('2d') → null`; the test passes and
real Safari still breaks. Missing rows that are more likely than several that made the list:
**canvas with width or height 0** (measured before layout, or inside a `display:none`
parent — every draw becomes a silent no-op, and since F14 deleted the atlas spinner the
player sees a black rectangle with no timeout); **resize thrash** (re-deriving the backing
store with no debounce reallocates the canvas dozens of times a second during mobile URL-bar
show/hide); **the `storage` event firing mid-battle**, which Section 4 fixed as an
interaction and never gave a state-machine story; and **rAF never firing** at all in a
background tab or low-power mode. *Auto-decided (P1): add the four rows, mark the three
stub-only rows as manual-verification, and note that "0 CRITICAL GAPS" was a claim about a
table.*

**Test framework:** no CLAUDE.md testing section and no lockfile exist yet. Vitest (Node
environment for `game/`, jsdom only for `ui/`) + Playwright for one E2E smoke. The
"hostile-QA test" is relabelled **manual** — Playwright cannot reliably reproduce rAF
throttling on a backgrounded tab in headless mode.

## Section 4: Performance Review

**#4 (HIGH, 8/10) — the fixed-timestep spec restates the problem instead of solving it,
and its acceptance criterion is wrong.** T4 and Section 4 both say "multiplier applies to
accumulation, not dt," which is just `acc += dt * speed` — the obvious implementation.
Neither addresses what breaks:

- **`MAX_STEPS=5` silently defeats E7.** At x4 a 60Hz frame needs 4 steps and a 30fps phone
  needs 8; the clamp turns fast-forward into slow motion exactly where E7 exists to save the
  player time, and it presents as a perf bug rather than a design one. One constant is doing
  two unrelated jobs: discarding a tab-away spike, and degrading under CPU pressure.
- **`blur` and `visibilitychange` are used interchangeably** across Section 4 rows. Different
  events, different firing conditions; an occluded-but-focused window throttles rAF without
  firing `blur`.
- **Auto-pause on blur makes the dt clamp near-dead code**, so it gets written, never
  exercised, and is wrong when it finally fires.
- **Interpolation vs snap is still undecided** despite Q2 naming it as the hidden complexity.
  60Hz fixed steps on a 120Hz display without interpolation is visible judder on every enemy.
- **The verify criterion invites the bug.** "x2 produces exactly 2x steps" has no analogue at
  x1.5 and encourages multiplying the step *count* per frame rather than the accumulation
  rate.

*Auto-decided (P1), concretely:*
```
  acc += Math.min(rawDt, 250) * speed;
  let n = 0;
  const budget = Math.ceil(speed) * 4;          // scales with speed — E7 keeps working
  while (acc >= DT) { step(DT); acc -= DT; if (++n >= budget) { acc = 0; break; } }
  const alpha = acc / DT;                       // render lerp; snap only if render caps 60Hz
```
*Use `visibilitychange` for auto-pause and hold-release; keep `blur` out of it. Decide snap
vs lerp explicitly (snap is acceptable if render is capped to 60Hz — say which). Test the
invariant: over N seconds, step count ≈ `speed*N*60 ±1`, and the `dt` passed to `step()` is
**always** the constant.*

**#13 (MEDIUM, 7/10) — A5's enemy cap doesn't cap concurrency, and the frame budget omits
the two most expensive things.** Wave data controls *spawn rate*, not alive count: if the
player under-builds, concurrency grows without bound regardless of the table. The
1200-checks-per-step estimate counts enemies x towers only, omitting **projectiles** (20
towers at ~0.3s fire rate is ~66 in flight, each collision-checked against the enemy list
every step — same all-pairs problem, larger constant) and **`fillText`** (damage numbers are
the most expensive canvas op in the game; Section 7 pre-renders gradients and decals but not
glyphs, the one thing drawn dozens of times per frame). And the **300-particle cap with
oldest-out silences feedback exactly when 20 enemies die at once** — the moment E4 exists to
serve. *Auto-decided (P1): enforce the cap in the sim by stalling wave spawning while
`alive >= N` (also a legibility win), pre-render digit glyphs to an offscreen atlas, and
pool + spatial-bucket projectiles or count them in the budget.*

**#18 (MEDIUM, 8/10) — T16 has no falsifiable acceptance criterion and is the least
predictable item in the plan.** "Reads as intentional art at 360x640" is not a test, it is
the largest visual surface in the product, and it is priced at 20 min CC. Specifically:
**noise-tinted ground at 360px wide is mud** — noise reads as texture at 2000px and as dirt
at 360px. *Auto-decided (P5): commit to a concrete target and make it the criterion —
**stylized flat**, three-value flat-shaded ground with no noise, path as a solid stroke with
a 2px gold inner rule, high-contrast silhouettes. State that the map is flat and not
painted, so the implementer stops chasing the reference.*

**#17 (MEDIUM, 7/10) — F15 caught one impossible fixture number, not the class.** The battle
screen shows **mana 120/200** against mage costs **100/100/120/100**, and scope adds **3
upgrade tiers** on top. A 200 cap means you can never hold more than two mages' worth; if a
tier-2 upgrade costs anything meaningful, the cap starves the entire upgrade economy —
documented hobby-TD failure #2, the one this plan quotes. And F10's "skip interwave early
for a mana bonus" adds a **third income source** no balance work accounts for and that a
skilled player will exploit. *Auto-decided (P1): treat every number lifted from the mockup as
**fixture-until-verified**. Derive mana cap, regen rate, kill reward, and the three tier
costs from the wave tables rather than copying them.*

**#6 (HIGH, 8/10) — the headless harness still cannot validate balance, and the plan half-
admits it.** H6 downgraded E5 because "a naive play policy produces false precision," but
the surviving sweep still needs a policy to emit time-to-crystal and leak count — the same
naive policy with fewer samples and no error bars — while the plan still claims it turns "is
wave 12 unwinnable?" into a number. It doesn't; that needs a solver. Structurally worse: a
1-D sweep over wave HP holding the economy constant measures the wrong axis, because mana
income is a function of kills, which is a function of tower DPS, which is what mana buys.
Difficulty and economy are one coupled system.

> **RESOLVED BY USER AT THE FINAL GATE: invariant assertions only. The sweep script is
> CUT.** E5 reduces to two assertions that live in the normal test suite rather than a
> separate tool: **no NaN ever enters a position**, and **every wave terminates**. No policy,
> no sweep, no clear-rate number.
>
> Consequences, stated plainly:
> - **Wave and economy balance is now hand-tuned by playing.** That is the documented #1
>   hobby-TD failure mode this plan opened by citing. The counterweights that remain are the
>   golden test on `data/` (T36, which still catches star thresholds drifting out of the
>   reachable range) and the done condition, which now has to be verified **by play** rather
>   than by script. Budget real playtesting time for stage 1; it is no longer optional.
> - **One of the four arguments for the pure sim goes away.** The other three stand on their
>   own — the determinism test (T32), cheap headless unit tests, and the renderer being
>   swappable. Approach B is unaffected.
> - `tools/balance-sweep` is removed from the architecture diagram.

**#10 (HIGH, 9/10) — the art has baked-in backgrounds and nothing mattes it.** I confirmed
this on Hikari's sheet: the 6 expression tiles sit on lavender/cream gradients inside framed
boxes, and the 2 pose illustrations sit on the cream sheet ground with flowing hair, cape
wisps, and a translucent staff orb. E1 puts a lavender rectangle inside a dark navy card.
E2 is partially rescued by Phase 2's tight-crop treatment. **T25 and T26 are not rescued** —
four cream rectangles composited over a storm sky is precisely the AI-slop outcome Pass 4
exists to prevent. Alpha matting soft anime edges is real image work with no task and T26
is priced at 10 min. *Auto-decided (P5, subtraction): commit to **framed portraits
everywhere** — tiles stay rectangular inside a designed gold frame, which is
reference-faithful (it is what the character sheet itself does), free, and reads as a
character dossier. **T26 is cut.** Matting is never priced at zero again.*

> **T26 REINSTATED.** A live OpenAI key was supplied after this review, so the matting blocker
> no longer applies — the hero is generated directly rather than composited. The framed-portrait
> conclusion still holds for the 24 expression tiles, which remain sheet crops.

**#2 (CRITICAL, 9/10) — the time box was off by 3x against the plan's own arithmetic.**
Addressed by the amended budget above.

## Required Outputs — Phase 3

### Architecture diagram (amended)

```
                    ┌────────────────────────────────┐
                    │           ui/  (React)         │
                    │  discrete state only, ~event   │
                    └──┬──────────────▲───────────┬──┘
          commands     │              │ coarse    │ reads costs,
          (place,      │              │ store:    │ names, palettes
           sell,       ▼              │ wave, node│      │
           speed)  ┌───────────────────┴────────┐  │      ▼
                   │  state/                    │  │   ┌──────────────┐
                   │  • SimState MUTABLE REF    │  │   │  ui/theme/   │
                   │    (never in zustand)      │  │   │  elements.ts │
                   │  • zustand: discrete only  │  │   │  hex/icon/lbl│
                   │  • selected id, NOT instance│ │   └──────────────┘
                   └───┬────────────────▲───────┘  │
            tick(dt)   │                │ snapshot │
                       ▼                │ on select│
  ┌────────────┐  ┌─────────────────────┴──┐      │      ┌──────────────┐
  │ data/      │─▶│  game/  (PURE TS)      │──────┼─────▶│  render/     │
  │ stages     │  │  + game/rules/         │ 60Hz │      │  canvas 2D   │
  │ waves      │  │    elements.ts         │ ref  │      │  + mana bar  │
  │ towers     │  │  NO react/canvas/DOM   │ read │      │  + glyph     │
  │ (schema-   │  │  NO Math.random/Date/  │◀─────┘      │    atlas     │
  │  validated)│  │     performance        │ reduced-    └──────────────┘
  └────────────┘  │  seeded RNG + cmd log  │ motion flag
        ▲         └───────────┬────────────┘
        │                     │ same module, no renderer
        │                     ▼
        └─────────────  ┌──────────────────────────┐
          fixtures      │ vitest (node env)        │  invariants: no NaN ever,
                        │ determinism + invariants │  every wave terminates.
                        └──────────────────────────┘  Balance is tuned BY PLAY.
```

Changes from Phase 1: `SimState` is explicitly a mutable ref outside zustand; the reverse
edge (`render/` reading React settings) is drawn; the `ui/ → data/` edge is drawn; elements
are split into rules vs theme; the mana bar moved to canvas; the banned globals are named.

### Test plan artifact

Written to `~/.gstack/projects/shocknawe-react-td/`.

### Failure Modes Registry — Phase 3 additions

```
  CODEPATH          | FAILURE MODE            | RESCUED? | TEST?   | USER SEES      | LOGGED?
  ------------------|-------------------------|----------|---------|----------------|--------
  initCanvas        | width or height is 0    | Y (new)  | Y       | retry + warn   | Y
  resize handler    | thrash (URL-bar toggle) | Y (new)  | Y       | nothing        | N
  storage event     | fires mid-battle        | Y (new)  | Y       | ignored till   | Y
                    |                         |          |         | battle ends    |
  rAF               | never fires (bg tab)    | Y (new)  | manual  | stays READY    | Y
  atlas coord map   | JSON drifts from image  | Y (new)  | Y       | dev-route grid | Y
  localStorage      | quota / private mode    | Y        | MANUAL  | "Won't save"   | Y
  getContext('2d')  | returns null            | Y        | MANUAL  | fallback panel | Y
```

Three prior rows are reclassified **MANUAL** — they can only be tested against your own
stub, so an automated pass proves nothing about real Safari.

### Implementation Tasks — Phase 3 (Eng)

- [x] **T-1 (P1, BLOCKS EVERYTHING) — repo** — **PARTIALLY DONE.** `references/` (23MB) is now
  copied into this worktree, so the path resolves and T1 is unblocked. **Still open:** nothing
  is committed yet, and the transcoded video and `PROVENANCE.md` do not exist. Decide whether
  to track the 23MB raw sheets or only the derived `design/atlas/` output before committing.
  - Surfaced by: Phase 3 #1 — was 26MB untracked in a different worktree
  - Verify: `git clone` to a temp dir, `pnpm build`, atlas resolves
- [x] **T1 (P1) — art-pipeline — DONE.** 24 expression tiles extracted to `design/atlas/` at a
  uniform 181×210, plus `atlas.json` carrying the grid map (origin 926,61 · stride 193,222 ·
  3 cols × 2 rows). Verified visually across all four sheets.
- [x] **T37 (P1) — DONE.** `design/index.html` section 11 renders all 24 tiles in a labelled
  grid, and the tile-dimension invariant was run: one distinct size across all 24 → PASS.
  This is exactly the drift guard Phase 3 #9 asked for.
- [x] **T31 (P1) — game/sim — SPEC PROVEN, port verbatim.** Implemented and running in
  `design/scene.html`: `acc += min(rawDt,250)/1000 * speed`; step budget `ceil(speed)*4` so
  fast-forward does not degrade into slow motion (the MAX_STEPS=5 bug); `visibilitychange` for
  auto-pause with `blur` deliberately unused; render interpolation via `alpha = acc / DT`.
  **Measured against the acceptance criterion: 364 steps vs 365 expected, drift -1 — inside the
  ±1 invariant**, with `dt` into `step()` constant throughout. The page renders a live drift
  counter so the invariant is checkable rather than asserted.
  - Surfaced by: Phase 3 #4 — MAX_STEPS=5 silently defeats E7; blur/visibilitychange conflated
- [ ] **T32 (P1, human: ~45min / CC: ~10min) — tooling** — Determinism test: seed + ordered
  command log → identical state hash at 10k steps; Node-env Vitest for `game/`
  - Surfaced by: Phase 3 #5 — lint cannot prove the property, this test can
- [ ] **T33 (P1, human: ~30min / CC: ~6min) — tooling** — Extend the boundary lint to globals:
  `Math.random`, `Date`, `performance`, `window`, `document`, `localStorage` in `src/game/**`
  - Surfaced by: Phase 3 #5 — `no-restricted-imports` cannot catch any of these
- [ ] **T34 (P1, human: ~1h / CC: ~12min) — state** — Two explicit channels: 60Hz mutable ref
  for render, coarse zustand for discrete transitions; mana bar moves to canvas
  - Surfaced by: Phase 3 #8 — 10Hz throttle breaks F4/F8/E8/T9
  - Verify: mana bar is smooth; card affordability flips within one frame
- [ ] **T35 (P1, human: ~30min / CC: ~6min) — data** — Derive mana cap, regen, kill reward and
  3 tier costs from wave tables; treat all mockup numbers as fixture-until-verified
  - Surfaced by: Phase 3 #17 — 200 mana cap vs 100-120 costs starves the upgrade economy
- [ ] **T36 (P1, human: ~45min / CC: ~10min) — tests** — Golden test on `data/`: reachable
  star range vs thresholds; plus v99 → clean-reset migration test
  - Surfaced by: Phase 3 #15 — the 2am-Friday data-edit failure
- [ ] **T37 (P1, human: ~30min / CC: ~6min) — assets** — Committed dev route rendering all 24
  tiles + 8 poses labelled, plus a tile-dimension snapshot test
  - Surfaced by: Phase 3 #9 — a 10px crop drift is invisible in review, obvious in play
- [ ] **T38 (P1, human: ~45min / CC: ~10min) — render** — Enforce enemy cap in the sim (stall
  spawning while alive >= N); pre-render digit glyphs to an offscreen atlas; pool projectiles
  - Surfaced by: Phase 3 #13 — cap wasn't enforced; fillText and projectiles uncounted
- [ ] **T39 (P2, human: ~30min / CC: ~6min) — devtools** — Command-log ring + seed, dumped as
  copyable JSON on the CRASHED panel and on defeat
  - Surfaced by: Phase 3 #7 — makes "deterministic replay" actually true
- [ ] **T40 (P2, human: ~30min / CC: ~6min) — errors** — Add the 4 missing registry rows;
  reclassify 3 stub-only rows as manual
  - Surfaced by: Phase 3 #14
- [ ] **T41 (P2, human: ~20min / CC: ~4min) — security** — Namespace storage keys `reactd:v1:*`;
  no `<form>`/`<input>`/`onSubmit` anywhere in meta shells
  - Surfaced by: Phase 3 S-a, S-b
- [ ] **T42 (P2, human: ~30min / CC: ~6min) — architecture** — Split `game/rules/elements.ts`
  from `ui/theme/elements.ts`
  - Surfaced by: Phase 3 #16
- [x] ~~**T26** — CUT (Phase 3 #10, alpha matting)~~ → **REINSTATED AND DONE** once an image
  API became available. See `design/art.html`.

### Completion Summary — Phase 3

```
  +====================================================================+
  |            ENG PLAN REVIEW — COMPLETION SUMMARY                    |
  +====================================================================+
  | Step 0 scope         | complexity check triggered; NOT reduced (P2)|
  | Search check         | [Layer 1] accumulator = settled prior art   |
  | Section 1 (Arch)     | 4 issues (1 critical: art not in repo)      |
  | Section 2 (Quality)  | 5 issues (3 critical: contradictions)       |
  | Section 3 (Tests)    | 3 issues, 6 new test targets                |
  | Section 4 (Perf)     | 6 issues (1 critical: budget off 3x)        |
  +--------------------------------------------------------------------+
  | Architecture diagram | amended (7 changes from Phase 1)            |
  | Test plan artifact   | written to ~/.gstack/projects/              |
  | Failure modes        | 7 rows added, 3 reclassified MANUAL         |
  | Plan amendments      | 8 applied IN PLACE (not appended)           |
  | Tasks added          | 13 (T-1, T31-T42), 1 cut (T26)              |
  | Security             | independent voice AGREED; 2 minor adds      |
  | Unresolved decisions | 2 (element set, E5 survival) → final gate   |
  +====================================================================+
```

---

# PHASE 3.5 — DX REVIEW: SKIPPED

No developer-facing scope. This is a consumer game: the players are not developers, and it
ships no API, CLI, SDK, package, webhook, or agent surface. The DX-term scan matched only
incidental build-tooling mentions (`pnpm`, Vite), which is toolchain, not product surface.
Recorded rather than silently omitted.

---

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 1 | ISSUES_OPEN (PLAN via /autoplan) | 11 proposals, 8 accepted, 3 deferred |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | not authenticated |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | ISSUES_OPEN (PLAN via /autoplan) | 19 issues, 1 critical gap |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | ISSUES_OPEN (FULL via /autoplan) | score 4/10 → 9/10, 27 decisions |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | SKIPPED | no developer-facing scope |

- **CROSS-MODEL:** none available. Codex CLI v0.146.0 is installed but not authenticated
  (`codex login`), so all three phases ran `[subagent-only]`. The consensus tables show 0/6,
  0/7 and 0/6 CONFIRMED — that is the missing-voice N/A rule, not a disagreement score. Every
  finding here comes from a single independent voice per phase and has not been cross-checked
  by a second model.
- **VERDICT:** CEO + DESIGN + ENG all reviewed, all three ISSUES_OPEN pending the final
  approval gate. Not cleared to implement until T-1 lands — the reference art is not in this
  repo.

**FINAL GATE — USER DECISIONS (2026-08-05)**

| # | Decision | Outcome |
|---|---|---|
| 1 | Element set | **Fire / Ice / Lightning / Wind** — the mockup's set. Overrides Phase 2 F23; restores Phase 1. Mapping: Hikari → Fire, Aoi → Ice, Kai → Lightning, Takumi → Wind. Mitigation for the pose-art mismatch is in F23's override note. |
| 2 | E5 balance sweep | **Cut to invariant assertions only** (no NaN, every wave terminates). Balance is tuned by play; see Phase 3 #6 for consequences. |
| 3 | Language | **English first, Japanese as flavour only.** Reverses F20's bilingual JP-primary call. Font weight drops; layout widths must be re-measured against English strings. |
| — | Scope (premise gate) | **A — playable game first, meta screens as static fixture shells.** |

NO UNRESOLVED DECISIONS
