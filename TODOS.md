# TODOS

Deferred work, with enough context that someone picking this up in three months
understands the motivation, the current state, and where to start.

---

## 1. Meta-progression systems (gacha, shop, inventory, equipment, quests, squad, skill trees)

**What:** The backing systems for mockup screens 4-9 — summon/gacha rolls, a real shop with
currency packs, inventory with items and materials, equipment slots, daily/weekly/main
quests with a reset clock, stamina, squad presets with leader skills, and per-element skill
trees.

**Why:** These are seven of the eleven screens on the reference sheet
(`references/5F0AA11F…PNG`). They are what turns a single-session game into something with
a reason to return. Deferred, not deleted.

**Pros:** Completes the reference vision. Gives progression, which is the main thing this
build will lack. Unlocks the upgrade-tree screen, which is one of the better-looking
mockups.

**Cons:** Roughly two months of work. Most of it needs a server clock to be meaningful
(a client-only daily reset is defeated by changing the system time). The shop implies a
payment integration, which changes the security model from "no attack surface" to "real
money", and drags in compliance questions this project has no reason to take on.

**Context:** The static *shells* for these screens may already exist from this build
(scope item E11a — reachable layouts populated with fixture data, labelled in-code as
`// FIXTURE — no backing system`). If so, the work here is wiring real systems behind
existing layouts, which is a much better starting position than building both at once.
Start with inventory, since it has no clock and no payment dependency. Do not start with
the shop.

**Effort:** XL (human) → L (with Claude Code)
**Priority:** P3
**Depends on:** the core combat loop being tuned and fun. Every one of these systems is
worthless layered on a loop nobody wants to replay.

---

## 2. Stage / wave authoring tool

**What:** A GUI for authoring stages, paths, and wave tables, writing out the same typed
data files `src/data/` already consumes.

**Why:** Content is the bottleneck once the engine works. Hand-editing wave tables is fine
for the first three stages and miserable by the tenth. This is the step that turns the game
into a platform.

**Pros:** New stages with no code change. Makes community-contributed stages possible.
Pairs naturally with the balance sweep script — author a wave, sweep it, see if it is
winnable, without leaving the tool.

**Cons:** A real second product surface with its own UI, its own persistence, and its own
bugs. If it ever accepts *imported* stage files from untrusted sources, the "no attack
surface" property of this project disappears and it needs a fresh threat model.

**Context:** The architecture already supports this — `data/` is typed and
schema-validated, and `game/` is pure, so the tool can run the sim in-process for instant
preview. That is the payoff for Approach B. Start with a path editor over the existing
grid renderer; wave tables are just forms.

**Effort:** L (human) → M (with Claude Code)
**Priority:** P3
**Depends on:** the `data/` schema being stable. Do not build this while wave data shape is
still moving.

---

## 3. Full audio: music, ambience, and a real mix

**What:** Background music per stage, ambient beds matching the mood reel, an audio mix with
ducking, and a volume/mute settings panel.

**Why:** The 6-file SFX pack shipping in this build (place, fire, hit, death, wave-start,
victory) covers hit feedback, which is the part that affects *game feel*. Music affects
*atmosphere*, which is a separate and later problem.

**Pros:** The reference mood reel establishes a clear tonal target — storm, ice, gold
light — and music is most of how that lands. Cheap relative to its impact on perceived
polish.

**Cons:** No audio assets exist. Sourcing or licensing music is a different kind of task
from writing code, and it is easy to lose a day to browsing libraries. Needs a real mix
to avoid SFX being buried, plus persisted volume settings and a mute that survives reload.

**Context:** Keep the SFX layer and any future music layer on separate gain nodes from the
start so a mix is possible later without refactoring. Web Audio API, not `<audio>` tags —
`<audio>` cannot do the ducking this eventually needs.

**Effort:** M (human) → S (with Claude Code)
**Priority:** P3
**Depends on:** nothing technical. Blocked only on choosing assets.

---

## 4. Spatial hash for tower targeting

**What:** Replace the all-pairs distance scan in tower targeting with a spatial hash grid.

**Why:** Recorded so the decision is traceable, not because it is needed. At the capped 60
concurrent enemies the naive scan costs ~1200 checks per step and is comfortably inside
frame budget.

**Pros:** Removes the enemy-count cap. Needed if a future mode ever wants swarm waves of
500+.

**Cons:** Pure premature optimization at current scale. Adds a spatial structure to keep in
sync with entity movement, which is a classic source of subtle targeting bugs.

**Context:** The enemy cap lives in wave data, not code. If a wave ever needs to exceed 60,
this is the unlock. Until then, leave it.

**Effort:** S (human) → S (with Claude Code)
**Priority:** P3
**Depends on:** a concrete need. Do not build speculatively.
