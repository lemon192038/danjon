// Zone: one simulated map instance (town, field or dungeon floor). Authoritative 20Hz simulation.
import { TILE, STATUS, TICK_MS } from '../../shared/constants.js';
import { T, BLOCKING, genDungeonFloor, genOverworld, tileAt, WORLD } from './maps.js';
import { genCity, genInterior } from './city.js';
import { CITIES } from '../../shared/data/cities.js';
import { Actor, Fighter, statusMoveMul } from './actor.js';
import { dealDamage, applyStatus } from './combat.js';
import { meleeHit, spawnProj, execEffects } from './skillExec.js';
import { makeMonster, makeBoss, monsterTick } from './monsters.js';
import { onHitHook, onKillHook } from './specials.js';
import { summonTick as bodyTick, onProjHit } from './mechanics.js';
import { morphTick } from './morph.js';
import { chronoTick, chronoKill, frozen, slowedSkip, projFrozen, freezeHold, isTimeFrozen } from './chrono.js';
import { SUMMON_BODIES } from '../../shared/data/identity.js';
import { DATA } from '../data.js';
import { DIFFICULTIES } from '../../shared/constants.js';
import { rollLoot } from './progress.js';
import { LOOT } from '../../shared/data/slum.js';
import { artTrigger } from './artifacts.js';
import { duelTick } from './duel.js';

class Heap { constructor() { this.a = []; } push(x) { const a = this.a; a.push(x); let i = a.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (a[p].at <= a[i].at) break; [a[p], a[i]] = [a[i], a[p]]; i = p; } }
  pop() { const a = this.a; const top = a[0]; const last = a.pop(); if (a.length) { a[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < a.length && a[l].at < a[m].at) m = l; if (r < a.length && a[r].at < a[m].at) m = r; if (m === i) break; [a[m], a[i]] = [a[i], a[m]]; i = m; } } return top; }
  peek() { return this.a[0]; } get size() { return this.a.length; } }

const SUMMON_DEF = {
  clone: { name: '幻影', hp: 0.3, ai: 'melee', r: 6, copy: true }, familiar: { name: '使い魔', hp: 0.25, ai: 'ranged', r: 5 }, golem: { name: 'ゴーレム', hp: 0.8, ai: 'melee', r: 9, taunt: true },
  spirit: { name: '精霊', hp: 0.3, ai: 'ranged', r: 5 }, turret: { name: '自動砲台', hp: 0.4, ai: 'turret', r: 7 }, skeleton: { name: '骸骨兵', hp: 0.3, ai: 'melee', r: 6 },
  beast: { name: '魔獣', hp: 0.6, ai: 'melee', r: 8 }, puppet: { name: '操り人形', hp: 0.5, ai: 'melee', r: 6, taunt: true }, tome: { name: '浮遊魔導書', hp: 0.2, ai: 'ranged', r: 5 },
};
for (const [k, B] of Object.entries(SUMMON_BODIES)) SUMMON_DEF[k] = { name: B.name, hp: B.hp, ai: B.ai, r: B.r, taunt: !!B.taunt, dr: B.dr || 0, move: B.move || 1, fly: !!B.fly };

export class Zone {
  constructor(world, id, opts) {
    this.world = world; this.id = id; this.opts = opts; this.now = 0;
    this.actors = new Map(); this.projs = []; this.areas = []; this.drops = []; this.timers = new Heap(); this.fxq = []; this.players = new Set();
    this.emptySince = 0; this.respawns = [];
    if (opts.kind === 'dungeon') {
      this.dungeon = DATA.dungeons.get(opts.dungeon); this.floor = opts.floor; this.diff = opts.diff;
      this.map = genDungeonFloor(this.dungeon, opts.floor, opts.diff); this.kind = 'dungeon';
      this.D = DIFFICULTIES.find(d => d.id === opts.diff);
      this.lv = Math.round(this.dungeon.minLv + opts.floor * 0.9);
      this.name = `${this.dungeon.name} ${opts.floor}F [${opts.diff}] - ${this.map.band.name}`;
      this.darkness = this.map.band.gim.includes('darkness') || this.map.band.gim.includes('sandstorm') || opts.diff === 'ABYSS';
      this.gim = this.map.band.gim; this.nextHazard = 3000;
      if (opts.diff === 'ABYSS') this.curses = abyssCurses(opts.floor);
      this.populate();
    } else if (opts.kind === 'slum') { world.slum.build(this, opts.inst, opts.layer);
    } else if (opts.kind === 'interior' && opts.hideout) { world.hideout.build(this, opts);
    } else if (opts.kind === 'interior') {
      // building interior (or player home): its own map, shared by everyone inside so players see each other
      this.cityId = opts.city; this.bldgId = opts.bldg.id; this.door = opts.door; this.home = opts.home || null;
      this.genArgs = [id, opts.bldg, opts.city, opts.homeTier ?? null]; this.map = genInterior(...this.genArgs); this.kind = 'interior'; this.name = opts.home ? `${opts.home.ownerName}の家（${this.map.name}）` : opts.bldg.name; this.gim = [];
      this.map.npcs = [];
      const spots = this.map.spots; const s0 = spots.find(x => x.fixed) || spots[0];
      if (opts.bldg.svc && s0) this.map.npcs.push({ service: opts.bldg.svc, name: opts.bldg.name, x: s0.x, y: s0.y, ...(opts.bldg.org ? { org: opts.bldg.org } : {}), ...(opts.bldg.region ? { region: opts.bldg.region } : {}) });
      if (opts.bldg.guild) { const s1 = opts.bldg.svc ? spots.find(x => !x.fixed) || s0 : s0; if (s1) this.map.npcs.push({ service: 'guildhq', guild: opts.bldg.guild, name: 'ギルド窓口', x: s1.x, y: s1.y }); }
      if (opts.bldg.story && s0) this.map.npcs.push({ service: 'story', story: opts.bldg.story, name: opts.bldg.name, x: s0.x, y: s0.y });
    } else if (WORLD[id]?.kind === 'town') {
      this.cityId = id; this.map = genCity(id, WORLD[id].links); this.kind = 'town'; this.name = this.map.name; this.gim = [];
    } else {
      this.map = genOverworld(id); this.kind = this.map.kind; this.name = this.map.name; this.gim = [];
      if (this.kind === 'field') { this.lv = this.map.lv; for (const s of this.map.spawns) this.spawnFieldMonster(s); }
    }
  }
  // ---------- helpers used by combat code
  fx(o) { this.fxq.push(o); }
  schedule(at, fn) { this.timers.push({ at, fn }); }
  shake(n) { this.fx({ t: 'shake', v: n }); }
  lock(a, ms) { a.action = { type: 'lock', until: this.now + ms, lockMove: true }; }
  actorsList() { return [...this.actors.values()]; }
  enemiesOf(a) { const out = []; for (const o of this.actors.values()) if (!o.dead && o.team !== a.team && o.team !== 'neutral') out.push(o); return out; }
  alliesOf(a) { const out = []; for (const o of this.actors.values()) if (!o.dead && o.team === a.team) out.push(o); return out; }
  nearby(a, r) { const out = []; for (const o of this.actors.values()) if (!o.dead && Math.abs(o.x - a.x) < r && Math.abs(o.y - a.y) < r) out.push(o); return out; }
  nearestEnemy(a, range, front) { let b = null, bd = range; for (const o of this.enemiesOf(a)) { if (o.faction && !o.provoked && this.kind === 'slum' && this.world.slum.passiveFor(o, a)) continue; const d = Math.hypot(o.x - a.x, o.y - a.y) - o.r; if (d < bd && (!front || Math.cos(Math.atan2(o.y - a.y, o.x - a.x) - a.facing) > 0.3)) { bd = d; b = o; } } return b; }
  blocked(x, y, a) { const t = tileAt(this.map, x, y); if (t === T.VOID && (a?.flyUntil > this.now)) return false; return BLOCKING.has(t); }
  moveActor(a, dx, dy) {
    const r = a.r * 0.8;
    const can = (x, y) => !this.blocked(x - r, y - r, a) && !this.blocked(x + r, y - r, a) && !this.blocked(x - r, y + r, a) && !this.blocked(x + r, y + r, a);
    if (can(a.x + dx, a.y)) a.x += dx; if (can(a.x, a.y + dy)) a.y += dy;
  }
  teleport(a, x, y, force) { if (!this.blocked(x, y, a) && this.los({ x: a.x, y: a.y }, { x, y })) { a.x = x; a.y = y; } else { const dx = x - a.x, dy = y - a.y; for (let k = 0.8; k > 0; k -= 0.2) { const nx = a.x + dx * k, ny = a.y + dy * k; if (!this.blocked(nx, ny, a) && this.los({ x: a.x, y: a.y }, { x: nx, y: ny })) { a.x = nx; a.y = ny; break; } } } }
  push(t, dx, dy) { const n = 5; for (let i = 1; i <= n; i++) this.schedule(this.now + i * 25, () => !t.dead && this.moveActor(t, dx / n, dy / n)); }
  lunge(a, d) { this.push(a, Math.cos(a.facing) * d, Math.sin(a.facing) * d); }
  // ---------- navigation: line of sight + BFS flow fields toward ally fighters
  los(a, b) { const d = Math.hypot(b.x - a.x, b.y - a.y), n = Math.ceil(d / 8); for (let i = 1; i < n; i++) { const x = a.x + (b.x - a.x) * i / n, y = a.y + (b.y - a.y) * i / n; if (this.blocked(x, y)) return false; } return true; }
  flowField(t) {
    this.flows ||= new Map(); const tx = Math.floor(t.x / TILE), ty = Math.floor(t.y / TILE); let f = this.flows.get(t.id);
    if (f && f.tx === tx && f.ty === ty && this.now - f.at < 1500) return f;
    const W = this.map.w, H = this.map.h, dist = f?.dist && f.dist.length === W * H ? f.dist : new Int16Array(W * H); dist.fill(-1);
    const q = new Int32Array(W * H); let qh = 0, qt = 0; const s0 = ty * W + tx; if (s0 < 0 || s0 >= W * H) return null; dist[s0] = 0; q[qt++] = s0;
    while (qh < qt) { const c = q[qh++]; const cx = c % W, cy = (c / W) | 0; const dc = dist[c]; if (dc > 60) continue; for (let k = 0; k < 4; k++) { const nx = cx + (k === 0 ? 1 : k === 1 ? -1 : 0), ny = cy + (k === 2 ? 1 : k === 3 ? -1 : 0); if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const n = ny * W + nx; if (dist[n] !== -1 || BLOCKING.has(this.map.tiles[n])) continue; dist[n] = dc + 1; q[qt++] = n; } }
    f = { tx, ty, at: this.now, dist }; this.flows.set(t.id, f); return f;
  }
  // unit direction for actor a to approach target t (direct if visible, else follow flow field)
  navDir(a, t) {
    const dx = t.x - a.x, dy = t.y - a.y, d = Math.hypot(dx, dy) || 1;
    if (d < 24 || this.los(a, t)) return { x: dx / d, y: dy / d, d };
    const f = this.flowField(t); if (!f) return { x: dx / d, y: dy / d, d };
    const W = this.map.w, ax = Math.floor(a.x / TILE), ay = Math.floor(a.y / TILE); let best = null, bv = f.dist[ay * W + ax]; if (bv < 0) bv = 9999;
    for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) { const nx = ax + ox, ny = ay + oy; if (nx < 0 || ny < 0 || nx >= W || ny >= this.map.h) continue; const v = f.dist[ny * W + nx]; if (v < 0) continue; if (ox && oy && (BLOCKING.has(this.map.tiles[ay * W + nx]) || BLOCKING.has(this.map.tiles[ny * W + ax]))) continue; if (v < bv) { bv = v; best = [nx, ny]; } }
    if (!best) return { x: dx / d, y: dy / d, d };
    const cx = best[0] * TILE + TILE / 2 - a.x, cy = best[1] * TILE + TILE / 2 - a.y, cd = Math.hypot(cx, cy) || 1; return { x: cx / cd, y: cy / cd, d };
  }
  addProj(p) { p.hits = new Set(); p.travelled = 0; this.projs.push(p); }
  addArea(r) { this.areas.push(r); }
  auraAtk(src) { return 0; }
  get diffDmgTaken() { return this.curses?.dmgTaken || 0; }

  add(a) { a.zone = this; this.actors.set(a.id, a); if (a.kind === 'player') this.players.add(a); return a; }
  remove(a) { this.actors.delete(a.id); this.players.delete(a); }
  tileCenter(c) { return { x: c[0] * TILE + TILE / 2, y: c[1] * TILE + TILE / 2 }; }

  // ---------- population
  populate() {
    const band = this.map.band; const fams = band.fam;
    for (const s of this.map.spawns) {
      const f = fams[Math.floor(Math.random() * fams.length)];
      const isBossFam = DATA.bosses.has(f);
      const elite = isBossFam || (this.floor > 3 && Math.random() < 0.06 + this.D.ai * 0.03);
      const m = makeMonster(isBossFam ? 'golem' : f, this.lv, this.diff, { elite });
      if (isBossFam) { m.name = '小型・' + DATA.bosses.get(f).name; m.sprite = DATA.bosses.get(f).sprite; }
      const p = this.tileCenter(s); m.x = p.x; m.y = p.y; m.home = [p.x, p.y];
      if (band.gim.includes('echo')) m.abilities.push('echo');
      this.add(m);
      // pack spawning at higher difficulty
      if (this.D.ai >= 3 && Math.random() < 0.4) { const s2 = makeMonster(fams[Math.floor(Math.random() * fams.length)].replace(/^(kraken|.*King)$/, 'golem'), this.lv, this.diff); s2.x = p.x + 14; s2.y = p.y + 8; s2.home = [s2.x, s2.y]; if (!this.blocked(s2.x, s2.y)) this.add(s2); }
    }
    if (this.map.boss) {
      const b = makeBoss(band.boss, this.lv + 3, this.diff, this.floor); const p = this.tileCenter(this.map.bossAt); b.x = p.x; b.y = p.y; b.home = [p.x, p.y]; if (band.bossName) b.name = band.bossName;
      if (this.dungeon.maxFloor && this.floor === this.dungeon.maxFloor) { b.maxHp *= 2; b.hp = b.maxHp; b.abilities = b.allAbilities.slice(); }
      if (this.floor === 100) { b.name = '【最終守護者】' + b.name; b.maxHp *= 2; b.hp = b.maxHp; b.abilities = b.allAbilities.slice(); }
      this.add(b); this.bossId = b.id;
    }
    for (const c of this.map.chests) { const p = this.tileCenter(c); this.drops.push({ id: 'c' + Math.random().toString(36).slice(2, 8), x: p.x, y: p.y, chest: true }); }
  }
  spawnFieldMonster(s) {
    const [lo, hi] = this.lv; const t = this.id === 'field_green' ? s[0] / this.map.w : 1 - s[1] / this.map.h; const lv = Math.max(1, Math.round(lo + (hi - lo) * Math.pow(t, 1.6) + Math.random() * 2));
    const fl = WORLD[this.id]?.fams || [['slime']]; const fams = lv < 5 && fl.length > 1 ? fl[0] : fl[fl.length - 1];
    const m = makeMonster(fams[Math.floor(Math.random() * fams.length)], lv, 'NORMAL', { elite: lv > 6 && Math.random() < 0.04 });
    const p = this.tileCenter(s); m.x = p.x; m.y = p.y; m.home = [p.x, p.y]; m.spawnCell = s; this.world.big?.empower(m); this.add(m);
  }
  spawnMinions(owner, n, fam) {
    const fams = fam ? [fam] : (this.map.band?.fam || ['skeleton']).filter(f => DATA.families.has(f));
    for (let i = 0; i < n; i++) { const m = makeMonster(fams[i % fams.length] || 'skeleton', Math.max(1, (owner.level || this.lv || 1) - 2), this.diff || 'NORMAL'); m.x = owner.x + (Math.random() - 0.5) * 60; m.y = owner.y + (Math.random() - 0.5) * 60; if (this.blocked(m.x, m.y)) { m.x = owner.x; m.y = owner.y; } m.xp = Math.round(m.xp * 0.3); m.minion = true; this.add(m); this.fx({ t: 'blink', x: Math.round(m.x), y: Math.round(m.y) }); }
  }
  spawnSummon(owner, kind, dur, pw, el) {
    const D = SUMMON_DEF[kind] || SUMMON_DEF.familiar;
    const s = new Actor({ kind: 'summon', team: owner.team, sumKind: kind, name: D.name, ownerId: owner.ownerId || owner.id, owner, until: this.now + dur, x: owner.x + (Math.random() - 0.5) * 30, y: owner.y + (Math.random() - 0.5) * 30, r: D.r, sai: D.ai,
      stats: { atk: (owner.stats.matk > owner.stats.atk ? owner.stats.matk : owner.stats.atk) * pw * 2, matk: 0, def: owner.stats.def * 0.5, crit: owner.stats.crit, critDmg: owner.stats.critDmg, dr: D.dr || 0, mods: {}, range: 1, move: 1.1 * (D.move || 1) },
      maxHp: Math.round(owner.maxHp * D.hp), weaponEl: el || owner.weaponEl, visKey: owner.visKey, atkCd: 0, taunt: D.taunt, look: D.copy ? owner.look : null, level: owner.level });
    s.hp = s.maxHp; if (this.blocked(s.x, s.y)) { s.x = owner.x; s.y = owner.y; }
    if (D.taunt) s.tauntUntil = s.until;
    this.add(s); this.fx({ t: 'blink', x: Math.round(s.x), y: Math.round(s.y), e: el || 'holy' });
    return s;
  }
  // ---------- death
  kill(t, src, now) {
    if (this.pvp && t.kind === 'player' && this.world.pvp?.down(this, t, src)) return;
    if (t.dead) return; t.dead = true; t.hp = 0; t.deadAt = now; t.action = null;
    if (t.buffMods?.revive && t.kind !== 'monster') { t.dead = false; t.hp = Math.round(t.maxHp * 0.4); t.buffs = t.buffs.filter(b => !b.mods.revive); t.recalcBuffs(); t.invulnUntil = now + 2000; this.fx({ t: 'revive', id: t.id }); return; }
    this.fx({ t: 'die', id: t.id });
    const killer = src.kind === 'summon' ? (this.actors.get(src.ownerId) || src) : src;
    if (t.kind === 'monster') {
      if (t.abilities?.includes('reassemble') && !t.revived) { t.revived = true; this.schedule(now + 3000, () => { t.dead = false; t.hp = Math.round(t.maxHp * 0.5); this.fx({ t: 'revive', id: t.id }); }); return; }
      if (t.abilities?.includes('rebirth') && !t.revived && t.boss) { t.revived = true; this.schedule(now + 2500, () => { t.dead = false; t.hp = t.maxHp; t.phase = 1; this.fx({ t: 'revive', id: t.id }); this.fx({ t: 'phase', id: t.id, v: 'rebirth' }); }); return; }
      if (t.abilities?.includes('split') && !t.minion && t.r > 5) for (let i = 0; i < 2; i++) { const m = makeMonster(t.fam, t.level, t.diff || 'NORMAL'); m.maxHp = m.hp = Math.round(t.maxHp * 0.35); m.r = 5; m.minion = true; m.x = t.x + (i ? 8 : -8); m.y = t.y; m.xp = Math.round(t.xp * 0.2); this.add(m); }
      if (t.onDeath === 'explode') { this.fx({ t: 'tele', s: 'circle', x: Math.round(t.x), y: Math.round(t.y), r: 46, d: 700, e: 'fire' }); this.schedule(now + 700, () => { meleeHit(this, t, { s: 'circle', r: 46 }, { m: 1.5, el: 'fire' }, this.now, { x: t.x, y: t.y, a: 0 }); this.fx({ t: 'boom', x: Math.round(t.x), y: Math.round(t.y), r: 46, e: 'fire' }); }); }
      if (killer.wt) onKillHook(this, killer); if (killer.chrono) chronoKill(this, killer, now);
      if (killer.stats?.mods.killHeal) killer.heal(killer.maxHp * killer.stats.mods.killHeal, this);
      if (killer.stats?.mods.raiseOnKill && Math.random() < killer.stats.mods.raiseOnKill) this.spawnSummon(killer, 'skeleton', 12000, 0.3);
      if (killer.ch) artTrigger(killer, 'kill');
      this.world.onMonsterKilled(this, t, killer);
      if (t.boss) this.onBossKilled(t);
      if (t.spawnCell) this.respawns.push({ at: now + 20000, cell: t.spawnCell });
      this.schedule(now + 1200, () => this.remove(t));
    } else if (t.kind === 'summon') { const ow = this.actors.get(t.ownerId); if (ow?.ch) artTrigger(ow, 'summon'); this.schedule(now + 400, () => this.remove(t)); }
    else this.world.onFighterDied(this, t);
  }
  onBossKilled(b) {
    if (b.calamity) return this.world.big.onCalamityKilled(this, b);
    if (!this.map.stairs) return;
    this.map.stairsOpen = true; const [sx, sy] = this.map.stairs; this.map.tiles[sy * this.map.w + sx] = T.STAIRS;
    this.fx({ t: 'bossdown', n: b.name }); this.fx({ t: 'tiles', x: sx, y: sy, v: T.STAIRS });
    for (const m of this.actors.values()) if (m.kind === 'monster' && m.minion && !m.dead) this.kill(m, b, this.now);
    this.world.onBossKilled(this, b);
  }
  dropLoot(owner, x, y, items) { for (const it of items) this.drops.push({ id: 'd' + Math.random().toString(36).slice(2, 9), owner: owner.id, x: x + (Math.random() - 0.5) * 20, y: y + (Math.random() - 0.5) * 20, it, until: this.now + 90000 }); }

  // ---------- simulation step
  tick(dt) {
    this.now += dt; const now = this.now;
    while (this.timers.size && this.timers.peek().at <= now) { const t = this.timers.pop(); try { t.fn(); } catch (e) { console.error('timer', e); } }
    for (const a of this.actors.values()) a.auraMods = null;
    this.tickAreas(now, dt);
    for (const a of this.actors.values()) { if (a.auraMods || a.hadAura) { a.recalcBuffs(); a.hadAura = !!a.auraMods; } }
    for (const a of this.actors.values()) this.tickActor(a, now, dt);
    this.tickProjs(now, dt);
    if (this.pvp) this.world.pvp?.tick(this, now);
    if (this.kind === 'dungeon') this.tickHazards(now);
    for (let i = this.respawns.length - 1; i >= 0; i--) if (this.respawns[i].at <= now) { if (!this.world.big?.shouldSkipSpawn(this)) this.spawnFieldMonster(this.respawns[i].cell); this.respawns.splice(i, 1); }
    if (this.drops.length) this.drops = this.drops.filter(d => d.chest || d.until > now);
  }
  // If an actor ever ends up inside a blocking tile, move it to the nearest free tile centre.
  unstuck(a) {
    const r = a.r * 0.8; const free = (x, y) => !this.blocked(x - r, y - r, a) && !this.blocked(x + r, y - r, a) && !this.blocked(x - r, y + r, a) && !this.blocked(x + r, y + r, a);
    if (free(a.x, a.y)) return;
    const tx = Math.floor(a.x / TILE), ty = Math.floor(a.y / TILE);
    for (let rad = 0; rad <= 8; rad++) for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue; const c = this.tileCenter([tx + dx, ty + dy]);
      if (free(c.x, c.y)) { a.x = c.x; a.y = c.y; return; }
    }
    const st = this.tileCenter(this.map.start); a.x = st.x; a.y = st.y;
  }
  tickActor(a, now, dt) {
    if (a.dead) return;
    if ((a.kind !== 'player' || this.pvp) && freezeHold(this, a, now)) return; // stopped time: nothing happens to it at all
    if (((a.stuckChk = (a.stuckChk || 0) + 1) & 3) === 0) this.unstuck(a);
    const s = a.statuses;
    for (const k in s) {
      const st = s[k]; if (st.until <= now) { delete s[k]; continue; }
      const def = STATUS[k];
      if (def.dot && (st.nextDot || 0) <= now) { st.nextDot = now + 1000; const src = this.actors.get(st.src) || a; const dmg = Math.max(1, Math.round(Math.min(a.maxHp * def.dot * st.stacks, (st.pow || 50) * 0.4 * st.stacks))); a.hp -= dmg; this.fx({ t: 'dmg', x: Math.round(a.x), y: Math.round(a.y - 10), v: dmg, e: k === 'burn' ? 'fire' : k === 'shock' ? 'thunder' : k === 'poison' ? 'wind' : 'dark', dot: 1, a: a.team !== 'enemy' ? 1 : 0 }); if (a.hp <= 0) { this.kill(a, src, now); return; } }
    }
    if (a.buffs.length && a.buffs.some(b => b.until <= now)) { a.buffs = a.buffs.filter(b => b.until > now); a.recalcBuffs(); }
    if (a.shield && a.shield.until <= now) a.shield = null;
    if (a.kind === 'summon' && a.until <= now) { this.kill(a, a, now); return; }
    // regen
    if ((a.nextRegen || 0) <= now) {
      a.nextRegen = now + 1000; const inCombat = a.combatUntil > now;
      const rg = (a.stats.regen || 0) + (a.buffMods.regen || 0) + (a.regen || 0) + (inCombat ? 0 : a.kind === 'player' || a.kind === 'npc' ? 0.02 : 0);
      if (rg > 0 && a.hp < a.maxHp) a.hp = Math.min(a.maxHp, a.hp + Math.ceil(a.maxHp * rg * (this.curses?.healMul ?? 1)));
      if (a.maxSp) { a.sp = Math.min(a.maxSp, a.sp + (a.stats.spRegen || 1) * (inCombat ? 1 : 3) - (a.buffMods.spDrain || 0)); if (a.sp < 0) a.sp = 0; }
    }
    // action special states
    const act = a.action;
    if (act && act.until <= now && !act.holdSpecial) a.action = null;
    if (act?.counter?.triggered) {
      const { src } = act.counter.triggered; const e = act.counter.eff; a.action = null; a.invulnUntil = now + 300; a.facing = Math.atan2(src.y - a.y, src.x - a.x);
      act.counter.onSuccess?.();
      const sh = e.shape || { s: 'arc', r: 40, a: 140 };
      if (sh.s === 'proj') spawnProj(this, a, sh, { m: (e.m || 2) * (act.counter.lvM || 1), counterHit: 1, status: e.status }, a.facing, now);
      else meleeHit(this, a, sh, { m: (e.m || 2) * (act.counter.lvM || 1), counterHit: 1, critAdd: 0.3, st: 6, status: e.status }, now);
      this.fx({ t: 'counter', id: a.id });
    }
    if (act?.brace) for (const t of this.enemiesOf(a)) { const d = Math.hypot(t.x - a.x, t.y - a.y); if (d < 90 && !act.brace.hitSet.has(t.id) && Math.cos(Math.atan2(t.y - a.y, t.x - a.x) - a.facing) > 0.6) { act.brace.hitSet.add(t.id); dealDamage(this, a, t, { m: act.brace.m, st: 8, kb: 60, ang: a.facing }, now); } }
    // controller
    if (a.kind === 'monster') { if (frozen(this, a, now) || slowedSkip(this, a, now)) { a.vx = a.vy = 0; } else monsterTick(this, a, now, dt); }
    else if (a.kind === 'summon') this.summonTick(a, now);
    else if (a.kind === 'npc') this.world.npcs.fighterTick(this, a, now);
    else if (a.kind === 'player') this.playerTick(a, now);
    else if (a.kind === 'resident') this.world.life.tick(this, a, now);
    else if (a.kind === 'duelist') duelTick(this, a, now);
    else if (a.role === 'raven') this.world.duels?.tickWanderer(this, a, now);
    // integrate velocity
    if (a.vx || a.vy) {
      let mul = statusMoveMul(a); if (a.stopped || now < a.staggerUntil) mul = 0;
      const tile = tileAt(this.map, a.x, a.y);
      if (tile === T.SHALLOW) mul *= 0.7;
      if (this.curses?.slow) mul *= 0.9;
      this.moveActor(a, a.vx * mul * dt / 1000, a.vy * mul * dt / 1000);
    }
    if (a.kind === 'player' || a.kind === 'npc') this.tileEffects(a, now);
  }
  playerTick(p, now) {
    if (p.wt?.morph) morphTick(this, p, now);
    if (p.chrono) chronoTick(this, p, now);
    const inp = p.input || {};
    if (p.aimX != null && (!p.action || p.action.type === 'attack' || p.action.type === 'aim' || p.action.type === 'charge' || p.action.type === 'channel' || p.action.type === 'guard' || p.action.type === 'iai' || p.action.type === 'breath' || p.action.type === 'drill' || p.action.type === 'barrage')) {
      const lock = p.autoAim && p.action?.type === 'attack' ? p.lockTarget(this, false) : null;
      if (lock) p.facing = Math.atan2(lock.y - p.y, lock.x - p.x);
      else if (!(p.action?.type === 'attack' && now > p.action.hitAt)) p.facing = Math.atan2(p.aimY - p.y, p.aimX - p.x);
    }
    let spd = 82 * p.stats.move * (1 + (p.buffMods.move || 0));
    const act = p.action; let mm = 1;
    if (act && act.until > now) mm = act.lockMove ? 0 : (act.moveMul ?? 1);
    if (p.statuses.fear) { const t = this.nearestEnemy(p, 200); if (t) { const ang = Math.atan2(p.y - t.y, p.x - t.x); p.vx = Math.cos(ang) * spd * 0.6; p.vy = Math.sin(ang) * spd * 0.6; return; } }
    const l = Math.hypot(inp.mx || 0, inp.my || 0);
    if (l > 0.05) { p.vx = (inp.mx / Math.max(1, l)) * spd * mm; p.vy = (inp.my / Math.max(1, l)) * spd * mm; if (p.aimX == null) p.facing = Math.atan2(inp.my, inp.mx); }
    else { p.vx = 0; p.vy = 0; }
    p.attackHeld = !!inp.atk;
    if (inp.atk && p.canAct(now)) p.attack(now, this);
    if (inp.spc && !p.spHeld) { p.spHeld = true; p.special('press', this); } else if (inp.spc && p.spHeld) p.special('hold', this); else if (!inp.spc && p.spHeld) { p.spHeld = false; p.special('release', this); }
  }
  summonTick(s, now) {
    const owner = this.actors.get(s.ownerId);
    if (!s.canAct(now)) { s.vx = s.vy = 0; return; }
    if (bodyTick(this, s, now)) return;
    const t = this.nearestEnemy(s, 220);
    if (!t) { if (owner && Math.hypot(owner.x - s.x, owner.y - s.y) > 40) { const a = Math.atan2(owner.y - s.y, owner.x - s.x); s.vx = Math.cos(a) * 90; s.vy = Math.sin(a) * 90; } else s.vx = s.vy = 0; return; }
    const d = Math.hypot(t.x - s.x, t.y - s.y), ang = Math.atan2(t.y - s.y, t.x - s.x); s.facing = ang;
    const ranged = s.sai !== 'melee'; const want = ranged ? 110 : 18;
    if (s.sai === 'turret') { s.vx = s.vy = 0; } else if (d > want) { const nd = this.navDir(s, t); s.vx = nd.x * 90; s.vy = nd.y * 90; } else s.vx = s.vy = 0;
    if ((s.atkCd || 0) < now && d < (ranged ? 220 : 30)) {
      s.atkCd = now + (ranged ? 900 : 700);
      if (ranged) spawnProj(this, s, { spd: 8, rng: 230, sz: 3, hom: 0.05 }, { m: 1, el: s.weaponEl }, ang, now);
      else meleeHit(this, s, { s: 'arc', r: 26, a: 140 }, { m: 1, el: s.weaponEl }, now);
    }
  }
  tileEffects(a, now) {
    if ((a.nextTile || 0) > now) return; a.nextTile = now + 500;
    const t = tileAt(this.map, a.x, a.y); if (a.flyUntil > now) return;
    const hurt = (f, st) => { if (a.invulnUntil > now) return; const dmg = Math.round(a.maxHp * f); a.hp -= dmg; this.fx({ t: 'dmg', x: Math.round(a.x), y: Math.round(a.y - 10), v: dmg, e: 'fire', a: 1 }); if (st) applyStatus(this, null, a, st, now); if (a.hp <= 0) this.kill(a, a, now); };
    if (t === T.LAVA) hurt(0.05, ['burn', 0.5, 3000]);
    else if (t === T.POISON) hurt(0.02, ['poison', 0.6, 3000]);
    else if (t === T.SPIKE && Math.floor(now / 1000) % 3 === 0) hurt(0.07);
    else if (t === T.CURSE) applyStatus(this, null, a, ['curse', 1, 2000], now);
    else if (t === T.CURRENT) this.push(a, 18, 0);
    else if (t === T.ICE && (a.vx || a.vy)) this.push(a, a.vx * 0.12, a.vy * 0.12);
    if (t === T.VOID) { hurt(0.15); const st = this.tileCenter(this.map.start); a.x = st.x; a.y = st.y; }
  }
  tickHazards(now) {
    if (now < this.nextHazard || !this.players.size) return;
    this.nextHazard = now + Math.max(1400, 5200 - this.D.ai * 700 - this.floor * 15);
    const ps = [...this.players].filter(p => !p.dead); if (!ps.length) return;
    const p = ps[Math.floor(Math.random() * ps.length)];
    const ox = p.x + (Math.random() - 0.5) * 120, oy = p.y + (Math.random() - 0.5) * 120;
    const src = { id: -1, team: 'hazard', x: ox, y: oy, stats: { atk: 6 + this.lv * 4 * this.D.atk, matk: 0, crit: 0, critDmg: 1, mods: {}, range: 1 }, buffMods: {}, facing: 0, magic: false };
    const hz = (r, el, st, delay = 1000, shape) => { this.fx({ t: 'tele', s: shape?.s || 'circle', x: Math.round(ox), y: Math.round(oy), a: shape?.a || 0, r, l: shape?.l || 0, w: shape?.w || 0, d: delay, e: el }); this.schedule(now + delay, () => { for (const a of this.actorsList()) if (!a.dead && a.team === 'ally' && (shape ? Math.abs((a.y - oy)) < shape.w / 2 + a.r && Math.abs(a.x - ox) < shape.l / 2 : Math.hypot(a.x - ox, a.y - oy) < r + a.r)) dealDamage(this, src, a, { m: 1.2, el, status: st, noCounter: 1, unblockable: 1 }, this.now); this.fx({ t: 'boom', x: Math.round(ox), y: Math.round(oy), r, e: el }); }); };
    for (const g of this.gim) {
      if (g === 'eruption' || g === 'steam') hz(36, 'fire', ['burn', 0.5, 3000]);
      else if (g === 'lightning') hz(26, 'thunder', ['shock', 0.5, 1500], 800);
      else if (g === 'judgment') hz(34, 'holy', ['stun', 0.3, 1000], 900);
      else if (g === 'laser') hz(0, 'thunder', null, 1100, { s: 'beam', l: 300, w: 12, a: 0 });
      else if (g === 'collapse') hz(30, 'void', ['slow', 1, 2000], 1200);
      else if (g === 'blizzard') for (const a of ps) applyStatus(this, null, a, ['slow', 0.5, 2500], now);
      else if (g === 'timeZone') this.addArea({ owner: src, x: ox, y: oy, r: 50, until: now + 4000, tick: 400, next: now, opt: {}, e: { slow: 0.6, both: 1, timeZone: 1 } });
      else if (g === 'roots') hz(30, 'earth', ['bind', 0.8, 1500], 900);
      else if (g === 'wind' || g === 'conveyor' || g === 'sandstorm') for (const a of ps) this.push(a, (Math.random() - 0.5) * 50, (Math.random() - 0.5) * 50);
    }
  }
  tickAreas(now, dt) {
    const keep = [];
    for (const r of this.areas) {
      if (r.until <= now || (r.owner.dead && r.owner.kind !== 'monster' && !r.e.trigger)) continue;
      if (r.follow) { if (r.follow.dead) continue; r.x = r.follow.x; r.y = r.follow.y; }
      const e = r.e; let consumed = false;
      if (e.ally && e.auraMods) for (const a of this.alliesOf(r.owner)) if (Math.hypot(a.x - r.x, a.y - r.y) <= r.r) { a.auraMods ||= {}; for (const [k, v] of Object.entries(e.auraMods)) a.auraMods[k] = Math.max(a.auraMods[k] || 0, v); }
      if (e.blockProj) for (const p of this.projs) if (p.owner.team !== r.owner.team && Math.hypot(p.x - r.x, p.y - r.y) < r.r) p.dead = true;
      if (e.burnAura && now >= r.next) for (const t of this.enemiesOf(r.owner)) if (Math.hypot(t.x - r.x, t.y - r.y) < r.r) applyStatus(this, r.owner, t, ['burn', e.burnAura, 2000], now);
      if (r.orbit && now >= r.next) { r.next = now + r.tick; meleeHit(this, r.owner, { s: 'circle', r: r.r }, { ...r.opt }, now, { x: r.x, y: r.y, a: 0 }); }
      else if (e.pull) { for (const t of this.enemiesOf(r.owner)) { const d = Math.hypot(t.x - r.x, t.y - r.y); if (d < r.r * 1.3 && d > 6 && !t.boss) this.moveActor(t, (r.x - t.x) / d * e.pull * dt / 16, (r.y - t.y) / d * e.pull * dt / 16); } }
      if (now >= r.next && !r.orbit) {
        r.next = now + (r.tick || 500);
        if (e.trigger) { const hit = this.enemiesOf(r.owner).some(t => Math.hypot(t.x - r.x, t.y - r.y) < r.r + t.r); if (hit) { meleeHit(this, r.owner, { s: 'circle', r: r.r * 1.3 }, { ...r.opt, dot: false }, now, { x: r.x, y: r.y, a: 0 }); this.fx({ t: 'boom', x: Math.round(r.x), y: Math.round(r.y), r: r.r, e: r.opt.el || 'phys' }); consumed = true; } }
        else if (e.heal && e.ally) { for (const a of this.alliesOf(r.owner)) if (Math.hypot(a.x - r.x, a.y - r.y) <= r.r) a.heal(a.maxHp * e.heal * (1 + (r.owner.stats?.mods.healPower || 0)), this); }
        else if (e.strike) { const ts = this.enemiesOf(r.owner).filter(t => Math.hypot(t.x - r.x, t.y - r.y) < r.r); const t = ts[Math.floor(Math.random() * ts.length)]; if (t) { dealDamage(this, r.owner, t, { ...r.opt, dot: false }, now); this.fx({ t: 'bolt', x: Math.round(t.x), y: Math.round(t.y), e: r.opt.el || 'thunder' }); } }
        else if (!e.ally && !e.auraMods) {
          const targets = e.both ? this.actorsList().filter(a => !a.dead && a.team !== 'neutral') : this.enemiesOf(r.owner);
          for (const t of targets) if (Math.hypot(t.x - r.x, t.y - r.y) < r.r + t.r) {
            if (r.opt.m) dealDamage(this, r.owner, t, { ...r.opt, dot: true, noCounter: 1 }, now);
            if (e.slow) applyStatus(this, r.owner, t, ['slow', 1, 800], now);
            if (e.mark) t.marked = now + 8000;
            if (r.opt.status && !r.opt.m) applyStatus(this, r.owner, t, r.opt.status, now);
          }
        }
      }
      if (!consumed) keep.push(r);
    }
    this.areas = keep;
  }
  tickProjs(now, dt) {
    const keep = [];
    for (const p of this.projs) {
      if (p.dead) continue;
      if (projFrozen(this, p, now)) { keep.push(p); continue; }
      const step = dt / 1000; const x0 = p.x, y0 = p.y; // start of this tick's path (swept collision below)
      if (p.hom && !p.returning) { const t = this.nearestEnemy({ ...p, team: p.owner.team, x: p.x, y: p.y, facing: Math.atan2(p.vy, p.vx) }, 160); if (t) { const want = Math.atan2(t.y - p.y, t.x - p.x), cur = Math.atan2(p.vy, p.vx), sp = Math.hypot(p.vx, p.vy); let d = want - cur; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; const na = cur + Math.sign(d) * Math.min(Math.abs(d), p.hom * 2); p.vx = Math.cos(na) * sp; p.vy = Math.sin(na) * sp; } }
      if (p.curve && !p.returning) { const cur = Math.atan2(p.vy, p.vx) + p.curve * 0.04, sp = Math.hypot(p.vx, p.vy); p.vx = Math.cos(cur) * sp; p.vy = Math.sin(cur) * sp; }
      if (p.returning) { const o = p.owner; const ang = Math.atan2(o.y - p.y, o.x - p.x), sp = Math.hypot(p.vx, p.vy) || 300; p.vx = Math.cos(ang) * sp; p.vy = Math.sin(ang) * sp; if (Math.hypot(o.x - p.x, o.y - p.y) < 12 || o.dead) continue; }
      if (p.spiral) { p.spiral.r += Math.hypot(p.vx, p.vy) * step * 0.6; p.spiral.ang += 0.25; p.x = p.spiral.cx + Math.cos(p.spiral.ang) * p.spiral.r; p.y = p.spiral.cy + Math.sin(p.spiral.ang) * p.spiral.r; p.travelled += Math.hypot(p.vx, p.vy) * step * 0.6; }
      else { p.x += p.vx * step; p.y += p.vy * step; p.travelled += Math.hypot(p.vx, p.vy) * step; }
      if (p.pullF) for (const t of this.enemiesOf(p.owner)) { const d = Math.hypot(t.x - p.x, t.y - p.y); if (d < 60 && d > 4 && !t.boss) this.moveActor(t, (p.x - t.x) / d * p.pullF, (p.y - t.y) / d * p.pullF); }
      let end = false;
      // walls along the path (not only at the end point), so fast projectiles cannot slip through thin walls either
      const SX = p.x - x0, SY = p.y - y0, SL = Math.hypot(SX, SY); let wallS = 1;
      if (!p.returning && SL > 6) for (let k = 1, n = Math.ceil(SL / 6); k < n; k++) { const q = k / n, qx = x0 + SX * q, qy = y0 + SY * q; if (this.blocked(qx, qy) && tileAt(this.map, qx, qy) !== T.WATER && tileAt(this.map, qx, qy) !== T.VOID) { wallS = q; p.x = qx; p.y = qy; break; } }
      if (!p.returning && this.blocked(p.x, p.y) && tileAt(this.map, p.x, p.y) !== T.WATER && tileAt(this.map, p.x, p.y) !== T.VOID) {
        if (p.bnc > 0) { p.bnc--; const bx = this.blocked(p.x - p.vx * step, p.y); if (bx) p.vy = -p.vy; else p.vx = -p.vx; p.x -= p.vx * step * 2; p.y -= p.vy * step * 2; }
        else if (p.ret) p.returning = true; else end = true;
      }
      // swept hit test: every enemy whose body touches the segment travelled this tick, in the order the projectile meets them
      const wallEnd = end, ex = p.x, ey = p.y; const hitsNow = []; for (const t of this.enemiesOf(p.owner)) { if (p.hits.has(t.id) || isTimeFrozen(this, t, now)) continue;
        const L2 = SX * SX + SY * SY; let q = L2 > 0 ? ((t.x - x0) * SX + (t.y - y0) * SY) / L2 : 0; q = Math.max(0, Math.min(wallS, q));
        if (Math.hypot(t.x - (x0 + SX * q), t.y - (y0 + SY * q)) <= t.r + p.sz) hitsNow.push([q, t]); }
      hitsNow.sort((A, B) => A[0] - B[0]);
      if (!end || hitsNow.length) for (const [q, t] of hitsNow) {
        if (p.hits.has(t.id)) continue;
        p.x = x0 + SX * q; p.y = y0 + SY * q; end = false; // the impact point (kept if the projectile stops here)
        p.hits.add(t.id);
        const res = p.aoe ? 0 : dealDamage(this, p.owner, t, { ...p.opt, ang: Math.atan2(p.vy, p.vx) }, now);
        if (res === -1) { p.owner = t; p.vx = -p.vx; p.vy = -p.vy; p.hits.clear(); p.travelled = 0; break; }
        if (p.owner.wt && res > 0) { onHitHook(this, p.owner); onProjHit(this, p.owner, t, now, p); }
        if (p.aoe) { end = true; break; }
        if (p.chain > 0) { p.chain--; const n = this.enemiesOf(p.owner).filter(o => !p.hits.has(o.id) && Math.hypot(o.x - p.x, o.y - p.y) < 130).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0]; if (n) { const sp = Math.hypot(p.vx, p.vy); const ang = Math.atan2(n.y - p.y, n.x - p.x); p.vx = Math.cos(ang) * sp; p.vy = Math.sin(ang) * sp; p.travelled = 0; this.fx({ t: 'bolt', x: Math.round(n.x), y: Math.round(n.y), e: p.opt.el || 'thunder' }); continue; } }
        if (p.pierce > 0) { p.pierce--; continue; }
        if (p.ret) { p.returning = true; break; }
        end = true; break;
      }
      if (!end && hitsNow.length) { p.x = ex; p.y = ey; } if (wallEnd && !p.dead) end = true; // pierced on through: continue to the path's end; a wall still stops it
      if (!p.returning && p.travelled >= p.rng) { if (p.ret) p.returning = true; else end = true; }
      if (p.returning && p.travelled > p.rng * 3) end = true;
      if (end) { if (p.aoe) { const ah = meleeHit(this, p.owner, { s: 'circle', r: p.aoe }, { ...p.opt }, now, { x: p.x, y: p.y, a: 0 }); if (p.owner.wt && ah[0]) onProjHit(this, p.owner, ah[0], now, p); this.fx({ t: 'boom', x: Math.round(p.x), y: Math.round(p.y), r: p.aoe, e: p.opt.el || 'fire' }); } continue; }
      keep.push(p);
    }
    this.projs = keep;
  }

  // ---------- network snapshot for one viewer
  snapshot(viewer) {
    const R = 460, vx = viewer.x, vy = viewer.y; const ents = []; const full = [];
    viewer.known ||= new Set();
    for (const a of this.actors.values()) {
      if (Math.abs(a.x - vx) > R || Math.abs(a.y - vy) > R) continue;
      let flags = 0; const n = this.now;
      if (a.dead) flags |= 1; if (a.invulnUntil > n) flags |= 2; if (a.action?.guard) flags |= 4; if (a.stopped || isTimeFrozen(this, a, n)) flags |= 8; if (a.staggerUntil > n) flags |= 16; if (a.airUntil > n) flags |= 32; if (a.shield?.amt > 0) flags |= 64; if (a.marked > n) flags |= 128; if (a.buffMods?.stealth) flags |= 256; if (a.demonUntil > n || a.enraged) flags |= 512; if (a.flyUntil > n) flags |= 1024; if (a.action?.counter) flags |= 2048; if (a.altMode) flags |= 4096; if (a.core) flags |= Math.min(7, a.core) << 13; if (a.morph && a.wt?.morph) flags |= ((a.morph.stage & 3) << 16) | ((a.morphSi || 0) & 7) << 18 | ((a.wt.id - 86) & 31) << 21;
      const sts = Object.keys(a.statuses).join(',');
      ents.push([a.id, Math.round(a.x), Math.round(a.y), +a.facing.toFixed(2), Math.round(a.hp / a.maxHp * 1000), flags, sts, a.action?.type || '', a.enchant?.until > n ? a.enchant.el : '']);
      if (!viewer.known.has(a.id)) { viewer.known.add(a.id); full.push(this.describe(a)); }
    }
    const projs = this.projs.filter(p => Math.abs(p.x - vx) < R && Math.abs(p.y - vy) < R).map(p => [Math.round(p.x), Math.round(p.y), +Math.atan2(p.vy, p.vx).toFixed(2), p.sz, p.opt.el || p.owner.weaponEl || '', p.k || '', p.owner.team === viewer.team ? 1 : 0, p.opt.vfx || '']);
    const areas = this.areas.filter(r => Math.abs(r.x - vx) < R && Math.abs(r.y - vy) < R).map(r => [Math.round(r.x), Math.round(r.y), Math.round(r.r), r.opt?.el || r.e.el || '', r.e.ally ? 1 : r.e.trigger ? 2 : r.orbit ? 3 : r.e.pull ? 4 : r.e.timeZone ? 5 : 0, r.owner.team === viewer.team ? 1 : 0, r.opt?.vfx || '']);
    const drops = this.drops.filter(d => (d.chest || d.owner === viewer.id) && Math.abs(d.x - vx) < R && Math.abs(d.y - vy) < R).map(d => [d.id, Math.round(d.x), Math.round(d.y), d.chest ? 'chest' : d.it.kind, d.it?.kind === 'sloot' ? (LOOT[d.it.ref]?.r || 1) : d.it?.ref ? (DATA.weapons.get(d.it.ref)?.rar || 0) : 0]);
    return { ents, full, projs, areas, drops };
  }
  describe(a) {
    const d = { id: a.id, kind: a.kind, name: a.name, lv: a.level, team: a.team, r: a.r };
    if (a.kind === 'player' || a.kind === 'npc' || a.kind === 'duelist') { d.look = a.ch.look; d.wt = a.wt.id; d.wr = a.weapon?.rar || 1; d.job = a.ch.job; d.wn = a.weapon?.name; const I = a.weapon?.ident; if (I) { d.wv = I.variant; d.wl = I.look; } if (a.wt?.morph && a.ch?.progress.morph) d.fac = Object.values(a.ch.progress.morph.build || {}); }
    else if (a.kind === 'monster') { d.sprite = a.sprite; d.fam = a.fam; d.el = a.el; d.boss = !!a.boss; d.elite = !!a.elite; d.affix = a.affixNames || null; if (a.faction) d.fac = a.faction; }
    else if (a.kind === 'resident' || a.kind === 'slumnpc') { d.look = a.look; d.job = a.job; if (a.faction) d.fac = a.faction; }
    if (this.masq && (a.kind === 'player' || a.kind === 'duelist')) { d.name = '仮面の闘士'; d.look = { ...d.look, outfit: 5, hairColor: 9 }; d.mask = 1; d.job = null; } // identities hidden, appearance unified
    else { d.sk = a.sumKind; d.look = a.look; d.wt = a.owner?.wt?.id; }
    return d;
  }
}
function abyssCurses(floor) {
  const c = { dmgTaken: 0, healMul: 1, slow: false, list: [] };
  const L = [['dmgTaken', '被ダメージ+25%', () => c.dmgTaken = 1.25], ['heal', '回復効果半減', () => c.healMul = 0.5], ['slow', '深淵の重圧', () => c.slow = true]];
  for (let i = 0; i < Math.min(3, 1 + Math.floor(floor / 15)); i++) { L[i][2](); c.list.push(L[i][1]); }
  if (!c.dmgTaken) c.dmgTaken = 0;
  return c;
}
