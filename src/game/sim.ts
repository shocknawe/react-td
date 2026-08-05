/**
 * THE CORE. createSim builds a fresh SimState; applyCommand validates and mutates in
 * response to a player action; step advances the world by exactly `dt` (always DT).
 *
 * step()'s resolution order for the combat tail is load-bearing and must not change:
 * advance projectiles and resolve hits -> resolve deaths -> check leaks -> check defeat
 * -> check wave clear -> check victory. An enemy dying the same step the 4th leak lands
 * must still resolve as defeat (leaks/defeat are checked, and can terminate the step,
 * before wave-clear/victory ever look at the board).
 */
import type {
  Command,
  ElementId,
  Enemy,
  EnemyKind,
  GameEvent,
  Projectile,
  RejectReason,
  SimState,
  StageDef,
  Tower,
} from "./types";
import { MAX_LEAKS, starsForLeaks } from "./types";
import { cellCentre } from "./layout";
import type { Path } from "./path";
import { pathLength, positionAt } from "./path";
import { canPlace } from "./grid";
import { buildSpawnQueue, spawnSpacingAt, waveEnemyCount } from "./waves";
import { computeDamage, findTarget, tierStats, towerValue } from "./towers";
import { advanceEnemy, applySlow, hasLeaked } from "./enemies";
import { appliesSlow } from "./rules/elements";
import { ENEMY_DEFS } from "../data/enemies";
import { MAGE_DEFS } from "../data/mages";
import { MANA_CAP, MANA_REGEN_PER_SEC, STARTING_MANA } from "../data/economy";

/** World units/sec projectiles close on their target. Fast enough to feel hitscan-ish
 * at stage1's tower ranges (100-135) while still existing as a moving thing to draw. */
const PROJECTILE_SPEED = 700;
/** Safety net: a projectile whose target keeps dodging (shouldn't happen — enemies
 * don't strafe) expires rather than living forever. */
const PROJECTILE_MAX_AGE = 3;
/** Towers sell for half of everything spent reaching their current tier. */
const SELL_REFUND_RATE = 0.5;

function isTerminalPhase(phase: SimState["phase"]): boolean {
  return phase === "victory" || phase === "defeat" || phase === "crashed";
}

function reject(reason: RejectReason): GameEvent {
  return { t: "rejected", reason };
}

function hasInvalidState(state: SimState): boolean {
  for (const e of state.enemies) if (!Number.isFinite(e.dist)) return true;
  for (const p of state.projectiles) if (!Number.isFinite(p.pos.x) || !Number.isFinite(p.pos.y)) return true;
  for (const t of state.towers) if (!Number.isFinite(t.pos.x) || !Number.isFinite(t.pos.y)) return true;
  return false;
}

/** Begin the next wave immediately: builds the spawn queue and flips to "running". */
function beginWaveNow(state: SimState, stage: StageDef, events: GameEvent[]): void {
  const nextIndex = state.wave + 1;
  const waveDef = stage.waves[nextIndex];
  if (!waveDef) return;
  state.wave = nextIndex;
  state.waveSpawnQueue = buildSpawnQueue(waveDef);
  state.spawnTimer = 0;
  state.interwaveTimer = 0;
  state.phase = "running";
  events.push({ t: "waveStart", wave: nextIndex });
}

export function createSim(stageId: string, stage: StageDef, seed: number): SimState {
  if (stage.waves.length === 0) throw new Error(`createSim: stage "${stageId}" has no waves`);
  return {
    stageId,
    phase: "ready",
    wave: -1,
    waveSpawnQueue: [],
    spawnTimer: 0,
    interwaveTimer: 0,
    mana: STARTING_MANA,
    manaCap: MANA_CAP,
    leaks: 0,
    kills: 0,
    elapsed: 0,
    enemies: [],
    towers: [],
    projectiles: [],
    seed,
    nextId: 1,
  };
}

export function applyCommand(state: SimState, stage: StageDef, path: Path, cmd: Command): GameEvent[] {
  const events: GameEvent[] = [];

  switch (cmd.t) {
    case "place": {
      if (isTerminalPhase(state.phase)) {
        events.push(reject("wrongPhase"));
        break;
      }
      const mage = MAGE_DEFS[cmd.el];
      const check = canPlace(state, stage, path, cmd.cell, mage.cost);
      if (!check.ok) {
        events.push(reject(check.reason));
        break;
      }
      state.mana -= mage.cost;
      const pos = cellCentre(cmd.cell.x, cmd.cell.y);
      const tower: Tower = { id: state.nextId++, el: cmd.el, cell: cmd.cell, pos, tier: 1, cooldown: 0 };
      state.towers.push(tower);
      events.push({ t: "placed", pos, el: cmd.el });
      break;
    }

    case "upgrade": {
      if (isTerminalPhase(state.phase)) {
        events.push(reject("wrongPhase"));
        break;
      }
      const tower = state.towers.find((t) => t.id === cmd.towerId);
      if (!tower) break; // unknown tower id: no-op, not a listed RejectReason
      const mage = MAGE_DEFS[tower.el];
      if (tower.tier >= mage.tiers.length) {
        events.push(reject("maxTier"));
        break;
      }
      const nextStats = mage.tiers[tower.tier];
      if (!nextStats) {
        events.push(reject("maxTier"));
        break;
      }
      if (state.mana < nextStats.upgradeCost) {
        events.push(reject("insufficientMana"));
        break;
      }
      state.mana -= nextStats.upgradeCost;
      tower.tier += 1;
      events.push({ t: "upgraded", pos: tower.pos, el: tower.el, tier: tower.tier });
      break;
    }

    case "sell": {
      if (isTerminalPhase(state.phase)) {
        events.push(reject("wrongPhase"));
        break;
      }
      const idx = state.towers.findIndex((t) => t.id === cmd.towerId);
      if (idx === -1) break; // unknown tower id: no-op
      const tower = state.towers[idx];
      if (!tower) break;
      const mage = MAGE_DEFS[tower.el];
      const refund = Math.floor(towerValue(mage, tower.tier) * SELL_REFUND_RATE);
      state.mana = Math.min(state.manaCap, state.mana + refund);
      state.towers.splice(idx, 1);
      events.push({ t: "sold", pos: tower.pos });
      break;
    }

    case "startWave": {
      if (isTerminalPhase(state.phase)) {
        events.push(reject("wrongPhase"));
        break;
      }
      if (state.phase !== "ready" && state.phase !== "interwave") {
        events.push(reject("wrongPhase"));
        break;
      }
      beginWaveNow(state, stage, events);
      break;
    }

    case "skipInterwave": {
      if (state.phase !== "interwave") {
        events.push(reject("wrongPhase"));
        break;
      }
      beginWaveNow(state, stage, events);
      break;
    }
  }

  return events;
}

export function step(state: SimState, stage: StageDef, path: Path, dt: number): GameEvent[] {
  const events: GameEvent[] = [];

  if (isTerminalPhase(state.phase) || state.phase === "ready" || state.phase === "paused") {
    return events;
  }

  state.elapsed += dt;
  state.mana = Math.min(state.manaCap, state.mana + MANA_REGEN_PER_SEC * dt);

  for (const tower of state.towers) {
    if (tower.cooldown > 0) tower.cooldown = Math.max(0, tower.cooldown - dt);
  }

  if (state.phase === "interwave") {
    state.interwaveTimer = Math.max(0, state.interwaveTimer - dt);
    if (state.interwaveTimer <= 0) {
      beginWaveNow(state, stage, events);
    }
    return events;
  }

  // phase === "running" from here.
  const waveDef = stage.waves[state.wave];
  if (!waveDef) return events; // invariant: wave index always valid once running

  // 1. Spawn enemies from the queue.
  state.spawnTimer -= dt;
  const totalWaveCount = waveEnemyCount(waveDef);
  while (state.spawnTimer <= 0 && state.waveSpawnQueue.length > 0) {
    const spawnedBefore = totalWaveCount - state.waveSpawnQueue.length;
    const kind = state.waveSpawnQueue.shift();
    if (!kind) break;
    const def = ENEMY_DEFS[kind];
    const enemy: Enemy = { id: state.nextId++, kind, dist: 0, hp: def.hp, maxHp: def.hp, slow: 0, dead: false };
    state.enemies.push(enemy);
    state.spawnTimer += spawnSpacingAt(waveDef, spawnedBefore);
  }

  // 2. Move enemies.
  for (const enemy of state.enemies) {
    if (enemy.dead) continue;
    advanceEnemy(enemy, ENEMY_DEFS[enemy.kind], dt);
  }

  // 3. Tower targeting and firing.
  for (const tower of state.towers) {
    if (tower.cooldown > 0) continue;
    const mage = MAGE_DEFS[tower.el];
    const stats = tierStats(mage, tower.tier);
    const target = findTarget(tower, state.enemies, path, stats.range);
    if (!target) continue;
    const projectile: Projectile = {
      id: state.nextId++,
      el: tower.el,
      pos: { x: tower.pos.x, y: tower.pos.y },
      targetId: target.id,
      damage: stats.damage,
      slowDuration: stats.slowDuration ?? 0,
      age: 0,
    };
    state.projectiles.push(projectile);
    tower.cooldown = stats.cooldown;
    events.push({ t: "fire", from: tower.pos, el: tower.el });
  }

  // 4. Advance projectiles and resolve hits.
  const lastHitEl = new Map<number, ElementId>();
  const remainingProjectiles: Projectile[] = [];
  for (const proj of state.projectiles) {
    proj.age += dt;
    const target = state.enemies.find((e) => e.id === proj.targetId);
    if (!target || target.dead) continue; // fizzle: target gone

    const targetPos = positionAt(path, target.dist);
    const dx = targetPos.x - proj.pos.x;
    const dy = targetPos.y - proj.pos.y;
    const dist = Math.hypot(dx, dy);
    const stepDist = PROJECTILE_SPEED * dt;

    if (dist <= stepDist || proj.age > PROJECTILE_MAX_AGE) {
      const def = ENEMY_DEFS[target.kind];
      const dmg = computeDamage(proj.damage, proj.el, target.kind, def.armor);
      target.hp -= dmg;
      lastHitEl.set(target.id, proj.el);
      if (proj.slowDuration > 0 && appliesSlow(proj.el)) {
        applySlow(target, proj.slowDuration);
      }
      events.push({ t: "hit", pos: targetPos, el: proj.el, damage: dmg });
      continue; // projectile consumed
    }

    proj.pos = { x: proj.pos.x + (dx / dist) * stepDist, y: proj.pos.y + (dy / dist) * stepDist };
    remainingProjectiles.push(proj);
  }
  state.projectiles = remainingProjectiles;

  if (hasInvalidState(state)) {
    state.phase = "crashed";
    return events;
  }

  // 5. Resolve deaths.
  for (const enemy of state.enemies) {
    if (!enemy.dead && enemy.hp <= 0) {
      enemy.dead = true;
      const def = ENEMY_DEFS[enemy.kind];
      state.mana = Math.min(state.manaCap, state.mana + def.bounty);
      state.kills += 1;
      const el = lastHitEl.get(enemy.id) ?? "fire";
      events.push({ t: "kill", pos: positionAt(path, enemy.dist), el, kind: enemy.kind });
    }
  }

  // 6. Check leaks.
  const pLen = pathLength(path);
  let killerKind: EnemyKind | null = null;
  for (const enemy of state.enemies) {
    if (hasLeaked(enemy, pLen)) {
      enemy.dead = true;
      state.leaks += 1;
      events.push({ t: "leak", kind: enemy.kind });
      if (state.leaks > MAX_LEAKS && killerKind === null) {
        killerKind = enemy.kind;
      }
    }
  }

  // 7. Check defeat.
  if (killerKind !== null) {
    state.phase = "defeat";
    events.push({ t: "defeat", wave: state.wave, killer: killerKind });
  }

  // 8/9. Check wave clear, then victory — skipped entirely once defeat has landed.
  if (state.phase !== "defeat") {
    const waveDrained = state.waveSpawnQueue.length === 0 && state.enemies.every((e) => e.dead);
    if (waveDrained) {
      events.push({ t: "waveClear", wave: state.wave });
      if (state.wave >= stage.waves.length - 1) {
        state.phase = "victory";
        events.push({ t: "victory", stars: starsForLeaks(state.leaks), elapsed: state.elapsed });
      } else {
        state.phase = "interwave";
        state.interwaveTimer = stage.waves[state.wave + 1]?.delay ?? 3;
      }
    }
  }

  state.enemies = state.enemies.filter((e) => !e.dead);

  return events;
}
