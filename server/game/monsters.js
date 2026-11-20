// Monster & boss construction plus difficulty-scaled tactical AI.
import { Actor } from './actor.js';
import { DATA } from '../data.js';
import { DIFFICULTIES } from '../../shared/constants.js';
import { execEffects, meleeHit, spawnProj } from './skillExec.js';
import { angDiff } from '../../shared/util.js';

// Ability definitions reuse the unified effect schema. tele: telegraph shape shown before execution.
export const ABILITIES = {
  shoot: { cd: 1800, range: 170, cast: 350, eff: [{ t: 'hit', shape: { s: 'proj', spd: 7, rng: 220, sz: 3 }, m: 0.9 }] },
  fireball: { cd: 3000, range: 180, cast: 500, eff: [{ t: 'hit', shape: { s: 'proj', spd: 5, rng: 220, sz: 6, aoe: 30 }, m: 1.3, el: 'fire', status: ['burn', 0.4, 3000] }] },
  iceShard: { cd: 3000, range: 170, cast: 450, eff: [{ t: 'hit', shape: { s: 'proj', spd: 7, rng: 200, sz: 4, n: 3, sp: 15 }, m: 0.8, el: 'ice', status: ['slow', 0.5, 2000] }] },
  chainBolt: { cd: 3500, range: 160, cast: 400, eff: [{ t: 'hit', shape: { s: 'proj', spd: 11, rng: 200, sz: 4, chain: 3 }, m: 1.0, el: 'thunder', status: ['shock', 0.3, 1200] }] },
  lance: { cd: 4000, range: 220, cast: 700, tele: { s: 'beam', l: 240, w: 14 }, eff: [{ t: 'hit', shape: { s: 'beam', l: 240, w: 14 }, m: 1.8, el: 'holy' }] },
  laser: { cd: 4500, range: 230, cast: 800, tele: { s: 'beam', l: 260, w: 12 }, eff: [{ t: 'hit', shape: { s: 'beam', l: 260, w: 12 }, m: 1.6, h: 3, interval: 120, el: 'thunder' }] },
  slam: { cd: 3500, range: 46, cast: 650, tele: { s: 'slam', d: 20, r: 44 }, eff: [{ t: 'hit', shape: { s: 'slam', d: 20, r: 44 }, m: 1.9, st: 6, kb: 70, status: ['stun', 0.25, 900] }] },
  quake: { cd: 7000, range: 90, cast: 900, tele: { s: 'circle', r: 110 }, eff: [{ t: 'hit', shape: { s: 'circle', r: 110 }, m: 1.6, st: 6, el: 'earth', status: ['stun', 0.3, 1000] }] },
  charge: { cd: 5000, range: 140, cast: 600, tele: { s: 'thrust', l: 130, w: 22 }, eff: [{ t: 'dash', d: 130, inv: 0, hit: { s: 'circle', r: 18 }, m: 1.5, kb: 90, st: 5 }] },
  spin: { cd: 4500, range: 40, cast: 450, tele: { s: 'circle', r: 46 }, eff: [{ t: 'hit', shape: { s: 'circle', r: 46 }, m: 0.7, h: 3, interval: 150 }] },
  tailSweep: { cd: 5000, range: 70, cast: 600, tele: { s: 'circle', r: 80 }, eff: [{ t: 'hit', shape: { s: 'circle', r: 80 }, m: 1.4, kb: 100, st: 6 }] },
  breath: { cd: 6000, range: 120, cast: 700, tele: { s: 'arc', r: 130, a: 60 }, eff: [{ t: 'hit', shape: { s: 'arc', r: 130, a: 60 }, m: 0.5, h: 6, interval: 140, el: 'fire', status: ['burn', 0.3, 3000] }] },
  pounce: { cd: 3500, range: 120, cast: 400, eff: [{ t: 'leap', d: 120, r: 26, m: 1.4, st: 4 }] },
  dive: { cd: 3500, range: 140, cast: 450, eff: [{ t: 'leap', d: 140, r: 28, m: 1.3, st: 3 }] },
  blink: { cd: 4000, range: 200, cast: 0, self: 1, eff: [{ t: 'blink', d: 110, toTarget: 1, back: 1 }] },
  backstab: { cd: 3500, range: 30, cast: 250, eff: [{ t: 'hit', shape: { s: 'thrust', l: 30, w: 16 }, m: 2.2, critAdd: 0.3 }] },
  meteor: { cd: 7000, range: 220, cast: 600, eff: [{ t: 'barrage', n: 5, r: 34, spread: 70, delay: 900, interval: 150, m: 1.4, el: 'fire', st: 4 }] },
  judgment: { cd: 8000, range: 240, cast: 500, eff: [{ t: 'barrage', n: 8, r: 30, spread: 110, delay: 900, interval: 80, m: 1.3, el: 'holy', status: ['stun', 0.3, 900] }] },
  curseField: { cd: 9000, range: 200, cast: 600, eff: [{ t: 'zone', at: 'target', r: 70, dur: 6000, tick: 700, m: 0.25, status: ['curse', 0.6, 3000] }] },
  web: { cd: 6000, range: 150, cast: 400, eff: [{ t: 'zone', at: 'target', r: 40, dur: 3000, tick: 400, m: 0.05, status: ['bind', 0.6, 1200] }] },
  ink: { cd: 7000, range: 160, cast: 400, eff: [{ t: 'zone', at: 'target', r: 80, dur: 5000, tick: 500, m: 0.1, status: ['slow', 0.9, 2000] }] },
  root: { cd: 7000, range: 150, cast: 500, eff: [{ t: 'zone', at: 'target', r: 50, dur: 2500, tick: 400, m: 0.2, status: ['bind', 0.7, 1500] }] },
  gravity: { cd: 9000, range: 200, cast: 500, eff: [{ t: 'zone', at: 'target', r: 110, dur: 2500, tick: 250, pull: 3, m: 0.1 }, { t: 'barrage', n: 1, r: 70, spread: 0, delay: 2500, m: 2.5, st: 8, el: 'void' }] },
  tidal: { cd: 6000, range: 140, cast: 600, tele: { s: 'thrust', l: 150, w: 44 }, eff: [{ t: 'hit', shape: { s: 'thrust', l: 150, w: 44 }, m: 1.4, kb: 100, el: 'water', status: ['slow', 0.6, 2500] }] },
  tentacle: { cd: 5000, range: 200, cast: 300, eff: [{ t: 'barrage', n: 4, r: 26, spread: 90, delay: 800, interval: 200, m: 1.3, st: 5 }] },
  heal: { cd: 6000, range: 150, cast: 600, support: 1, eff: [{ t: 'heal', amt: 0.18, r: 150 }] },
  buff: { cd: 10000, range: 150, cast: 500, support: 1, eff: [{ t: 'aura', r: 150, mods: { atk: 0.25, dr: 0.15 }, dur: 8000 }] },
  rally: { cd: 15000, range: 200, cast: 500, support: 1, eff: [{ t: 'aura', r: 200, mods: { atk: 0.3, aspd: 0.2 }, dur: 10000 }] },
  shield: { cd: 10000, range: 200, cast: 300, self: 1, eff: [{ t: 'shield', amt: 0.2, dur: 6000 }] },
  guard: { cd: 6000, range: 60, cast: 0, self: 1, eff: [{ t: 'buff', mods: { dr: 0.5 }, dur: 2500 }] },
  reflect: { cd: 8000, range: 60, cast: 0, self: 1, eff: [{ t: 'counter', win: 1200, m: 1.8, shape: { s: 'circle', r: 46 }, reflect: 1 }] },
  drain: { cd: 3000, range: 30, cast: 350, eff: [{ t: 'hit', shape: { s: 'arc', r: 30, a: 120 }, m: 1.2, ls: 0.6, el: 'dark' }] },
  poisonBite: { cd: 3000, range: 28, cast: 350, eff: [{ t: 'hit', shape: { s: 'arc', r: 28, a: 100 }, m: 1.1, status: ['poison', 0.6, 5000] }] },
  bite: { cd: 2500, range: 30, cast: 300, eff: [{ t: 'hit', shape: { s: 'arc', r: 32, a: 120 }, m: 1.8, status: ['bleed', 0.5, 4000] }] },
  burnAura: { cd: 12000, range: 80, cast: 0, self: 1, eff: [{ t: 'zone', at: 'self', r: 50, dur: 8000, tick: 600, m: 0.2, el: 'fire', status: ['burn', 0.3, 2000] }] },
  freezeNova: { cd: 8000, range: 60, cast: 700, tele: { s: 'circle', r: 70 }, eff: [{ t: 'hit', shape: { s: 'circle', r: 70 }, m: 1.2, el: 'ice', status: ['freeze', 0.5, 1200] }] },
  erase: { cd: 10000, range: 120, cast: 900, tele: { s: 'circle', r: 90 }, eff: [{ t: 'hit', shape: { s: 'circle', r: 90 }, m: 1.5, el: 'void', strip: 1 }] },
  timeStop: { cd: 16000, range: 200, cast: 1100, tele: { s: 'circle', r: 150 }, eff: [{ t: 'zone', at: 'self', r: 150, dur: 300, tick: 100, m: 0.05, status: ['stop', 1, 1200] }] },
  summon: { cd: 12000, range: 200, cast: 700, spawn: 2 }, summonBats: { cd: 10000, range: 200, cast: 500, spawn: 3, fam: 'bat' },
  split: { passive: 1 }, reassemble: { passive: 1 }, regrow: { passive: 1 }, rebirth: { passive: 1 }, rage: { passive: 1 }, predict: { passive: 1 }, dodge: { passive: 1 }, fly: { cd: 9000, range: 200, cast: 0, self: 1, eff: [{ t: 'blink', d: 120 }] }, echo: { passive: 1 },
};
const ABYSS_AFFIXES = [
  { k: 'vampiric', n: '吸血', mods: { ls: 0.15 } }, { k: 'swift', n: '神速', move: 1.35, aspd: 0.3 }, { k: 'armored', n: '鉄壁', dr: 0.3 },
  { k: 'explosive', n: '自爆', onDeath: 'explode' }, { k: 'regenerating', n: '再生', regen: 0.01 }, { k: 'teleporter', n: '転移', add: 'blink' },
  { k: 'frenzied', n: '狂乱', mods: { atk: 0.35 } }, { k: 'warded', n: '結界', add: 'shield' }, { k: 'cursed', n: '呪詛', add: 'curseField' },
];

export function monsterStats(fam, lv, diff, mul = 1) {
  const D = DIFFICULTIES.find(d => d.id === diff) || DIFFICULTIES[1];
  const abyssScale = diff === 'ABYSS' ? 1 + lv * 0.004 : 1;
  return {
    atk: Math.round(fam.atk * (6 + lv * 4.6 + lv * lv * 0.012) * D.atk * mul * abyssScale), matk: 0,
    def: Math.round(fam.def * (3 + lv * 1.5) * D.def * abyssScale), crit: 0.05 + D.ai * 0.03, critDmg: 1.5, dr: 0, cdr: 0, range: 1,
    mods: {}, maxHp: Math.round(fam.hp * (30 + lv * 9 + lv * lv * 2.3) * D.hp * mul * abyssScale), move: fam.spd,
  };
}

export function makeMonster(famKey, lv, diff, opt = {}) {
  const fam = DATA.families.get(famKey) || DATA.families.get('slime');
  const D = DIFFICULTIES.find(d => d.id === diff) || DIFFICULTIES[1];
  const st = monsterStats(fam, lv, diff, opt.elite ? 2.5 : 1);
  st.matk = st.atk;
  const m = new Actor({ kind: 'monster', team: 'enemy', fam: famKey, name: (opt.elite ? '精鋭' : '') + fam.name, level: lv, el: fam.el, sprite: fam.sprite, ai: fam.ai, aiLv: D.ai, diff,
    stats: st, maxHp: st.maxHp, hp: st.maxHp, r: fam.sprite === 'golem' ? 10 : fam.sprite === 'demon' ? 9 : 7, mass: fam.sprite === 'golem' ? 3 : 1, range: fam.range,
    abilities: [...fam.abilities], abCd: {}, elite: !!opt.elite, xp: Math.round((8 + lv * 4) * fam.hp * D.xp * (opt.elite ? 3 : 1)), gold: Math.round((2 + lv * 1.5) * (opt.elite ? 4 : 1)),
    maxPoise: Math.round(6 + fam.hp * 4), poise: Math.round(6 + fam.hp * 4), resist: fam.el ? { [fam.el]: 0.3 } : {}, atkCd: 0, home: null });
  if (opt.elite || (diff === 'ABYSS') || (diff === 'HELL' && Math.random() < 0.25)) {
    const nA = diff === 'ABYSS' ? 1 + (opt.elite ? 2 : Math.random() < 0.5 ? 1 : 0) : 1;
    m.affixes = [];
    for (let i = 0; i < nA; i++) { const af = ABYSS_AFFIXES[Math.floor(Math.random() * ABYSS_AFFIXES.length)]; if (m.affixes.includes(af.k)) continue; m.affixes.push(af.k); (m.affixNames ||= []).push(af.n); if (af.mods) Object.assign(m.stats.mods, af.mods); if (af.move) m.stats.move *= af.move; if (af.dr) m.stats.dr += af.dr; if (af.regen) m.regen = af.regen; if (af.add) m.abilities.push(af.add); if (af.onDeath) m.onDeath = af.onDeath; m.name = af.n + '・' + m.name; }
  }
  return m;
}

export function makeBoss(key, lv, diff, floor) {
  const b = DATA.bosses.get(key); const D = DIFFICULTIES.find(d => d.id === diff);
  const fam = { hp: 1, atk: 1.6, def: 1.6, spd: 1.0 };
  const st = monsterStats(fam, lv, diff, 1); st.maxHp = Math.round(st.maxHp * (16 + floor * 0.12)); st.matk = st.atk;
  return new Actor({ kind: 'monster', team: 'enemy', boss: true, fam: key, name: b.name, level: lv, el: null, sprite: b.sprite, ai: 'boss', aiLv: D.ai, diff,
    stats: st, maxHp: st.maxHp, hp: st.maxHp, r: 16, mass: 10, range: 40, abilities: b.abilities.slice(0, 2), allAbilities: b.abilities, phase: 1, abCd: {}, xp: Math.round((80 + lv * 30) * D.xp), gold: Math.round(100 + lv * 25),
    maxPoise: 60 + lv, poise: 60 + lv, resist: { status: 0.4 }, atkCd: 0 });
}

const lead = (m, t, spd) => { if (m.aiLv < 3 && !m.abilities.includes('predict')) return { x: t.x, y: t.y }; const d = Math.hypot(t.x - m.x, t.y - m.y); const tt = d / Math.max(60, spd); return { x: t.x + (t.vx || 0) * tt, y: t.y + (t.vy || 0) * tt }; };

function pickTarget(zone, m, now) {
  if (m.forcedUntil > now) { const f = zone.actors.get(m.forcedTarget); if (f && !f.dead) return f; }
  const aggro = (m.boss ? 400 : 150 + m.aiLv * 35) * (zone.darkness ? 0.8 : 1);
  let best = null, bs = -Infinity;
  for (const t of zone.enemiesOf(m)) {
    if (t.buffMods?.stealth && Math.hypot(t.x - m.x, t.y - m.y) > 30) continue;
    const d = Math.hypot(t.x - m.x, t.y - m.y); if (d > aggro && !(m.threat?.[t.ownerId || t.id])) continue;
    let s = -d + (m.threat?.[t.ownerId || t.id] || 0) * 0.02;
    if (m.aiLv >= 3) s += (1 - t.hp / t.maxHp) * 150;        // focus weakened targets
    if (m.aiLv >= 4 && (t.magic || t.kind === 'summon')) s += t.kind === 'summon' ? -80 : 60; // dive casters, ignore decoys
    if (s > bs) { bs = s; best = t; }
  }
  return best;
}

export function monsterTick(zone, m, now, dt) {
  if (!m.canAct(now)) { m.vx = m.vy = 0; return; }
  if (m.action && m.action.until > now) { if (m.action.lockMove) { m.vx = m.vy = 0; } return; }
  m.action = null;
  // boss phases
  if (m.boss) {
    const p = m.hp / m.maxHp;
    const want = p < 0.33 ? 3 : p < 0.66 ? 2 : 1;
    if (want > m.phase) { m.phase = want; m.abilities = m.allAbilities.slice(0, Math.min(m.allAbilities.length, want + 1)); m.stats.atk = Math.round(m.stats.atk * 1.15); m.staggerUntil = 0; m.superArmor = want === 3; zone.fx({ t: 'phase', id: m.id, v: want }); if (m.allAbilities.includes('summon') || m.allAbilities.includes('summonBats')) zone.spawnMinions(m, 2 + m.aiLv); }
  }
  if (m.abilities.includes('rage') && !m.enraged && m.hp < m.maxHp * 0.5) { m.enraged = true; m.addBuff({ atk: 0.4, aspd: 0.3 }, 600000, 'rage'); zone.fx({ t: 'phase', id: m.id, v: 'rage' }); }
  const t = pickTarget(zone, m, now);
  if (!t) { // idle wander / return home
    if (m.home && Math.hypot(m.home[0] - m.x, m.home[1] - m.y) > 40) { const a = Math.atan2(m.home[1] - m.y, m.home[0] - m.x); m.vx = Math.cos(a) * 40; m.vy = Math.sin(a) * 40; }
    else if (Math.random() < 0.02) { const a = Math.random() * 6.28; m.vx = Math.cos(a) * 20; m.vy = Math.sin(a) * 20; } else if (Math.random() < 0.05) m.vx = m.vy = 0;
    if (m.hp < m.maxHp) m.hp = Math.min(m.maxHp, m.hp + m.maxHp * 0.002);
    return;
  }
  m.target = t.id;
  const dx = t.x - m.x, dy = t.y - m.y, d = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
  m.facing = ang;
  const spd = 55 * m.stats.move * (1 + (m.buffMods.move || 0));
  // reactive dodge (HARD+): sidestep when target is winding up an attack toward us
  if (m.aiLv >= 2 && t.action?.type === 'attack' && now < t.action.hitAt && d < 70 && (m.dodgeCd || 0) < now && Math.random() < 0.08 * m.aiLv * (m.abilities.includes('dodge') ? 2 : 1) && !m.boss) {
    m.dodgeCd = now + 2200 - m.aiLv * 250; const sa = ang + (Math.random() < 0.5 ? 1.6 : -1.6);
    for (let i = 1; i <= 5; i++) zone.schedule(now + i * 30, () => zone.moveActor(m, Math.cos(sa) * 11, Math.sin(sa) * 11)); m.action = { type: 'dodge', until: now + 200, lockMove: true }; m.invulnUntil = now + 180; return;
  }
  // abilities
  for (const ab of m.abilities) {
    const A = ABILITIES[ab]; if (!A || A.passive || (m.abCd[ab] || 0) > now) continue;
    if (A.support) { const hurt = zone.alliesOf(m).some(o => o.hp < o.maxHp * 0.7 && Math.hypot(o.x - m.x, o.y - m.y) < A.range); if (ab === 'heal' && !hurt) continue; }
    else if (d > A.range * (A.self ? 3 : 1)) continue;
    const cdMul = [2.2, 1.3, 1.0, 0.8, 0.6][m.aiLv];
    m.abCd[ab] = now + A.cd * cdMul + Math.random() * 600;
    const cast = Math.max(150, (A.cast || 0) * [1.3, 1.1, 1, 0.9, 0.8][m.aiLv]);
    const p = lead(m, t, 360);
    const go = () => {
      if (m.dead || !m.canAct(zone.now)) return;
      if (A.spawn) { zone.spawnMinions(m, A.spawn + Math.floor(m.aiLv / 2), A.fam); return; }
      if (!A.self) m.facing = Math.atan2(p.y - m.y, p.x - m.x);
      execEffects(zone, m, A.eff, { tx: p.x, ty: p.y, lvM: 1 }, zone.now);
      if (m.abilities.includes('echo')) zone.schedule(zone.now + 600, () => !m.dead && execEffects(zone, m, A.eff, { tx: t.x, ty: t.y, lvM: 0.6 }, zone.now));
    };
    if (A.tele) zone.fx({ t: 'tele', s: A.tele.s, x: Math.round(m.x), y: Math.round(m.y), a: +ang.toFixed(2), r: A.tele.r || 0, l: A.tele.l || 0, w: A.tele.w || 0, ar: A.tele.a || 0, d: cast, dd: A.tele.d || 0, e: A.eff[0].el || 'phys' });
    m.action = { type: 'cast', until: now + cast + 250, lockMove: true, ab };
    zone.fx({ t: 'mcast', id: m.id, n: ab, d: cast });
    zone.schedule(now + cast, go);
    m.vx = m.vy = 0; return;
  }
  // movement by behaviour
  let mx = 0, my = 0; const range = m.range;
  const want = m.ai === 'kiter' || m.ai === 'caster' || m.ai === 'support' ? Math.min(range * 0.75, 120) : range * 0.8;
  if (m.ai === 'ambusher' && !m.awake) { if (d < 50 || m.hp < m.maxHp) m.awake = true; else { m.vx = m.vy = 0; return; } }
  const nav = zone.navDir(m, t); const visible = nav.x * dx / d + nav.y * dy / d > 0.999;
  if (d > want + 6 || (!visible && d > 20)) { mx = nav.x; my = nav.y; }
  else if ((m.ai === 'kiter' || m.ai === 'caster' || m.ai === 'support') && d < want * 0.6) { mx = -dx / d; my = -dy / d; }
  if (visible && (m.ai === 'flanker' || (m.aiLv >= 3 && d < 80 && m.ai !== 'tank'))) { // circle to flank / surround
    const side = (m.id % 2 ? 1 : -1); const tang = ang + side * (Math.PI / 2);
    mx = mx * 0.6 + Math.cos(tang) * 0.6; my = my * 0.6 + Math.sin(tang) * 0.6;
  }
  if (m.ai === 'erratic') { mx += (Math.random() - 0.5) * 1.5; my += (Math.random() - 0.5) * 1.5; }
  if (m.statuses.fear) { mx = -dx / d; my = -dy / d; }
  // separation (keeps groups spread, more at higher AI)
  for (const o of zone.nearby(m, 16)) if (o !== m && o.team === m.team) { const ox = m.x - o.x, oy = m.y - o.y, od = Math.hypot(ox, oy) || 1; mx += ox / od * 0.5; my += oy / od * 0.5; }
  const ml = Math.hypot(mx, my) || 1; m.vx = mx / ml * spd * (Math.hypot(mx, my) > 0.1 ? 1 : 0); m.vy = my / ml * spd * (Math.hypot(mx, my) > 0.1 ? 1 : 0);
  // basic attack
  if (d <= range + t.r + 4 && (m.atkCd || 0) < now && !m.statuses.fear && (range < 60 || zone.los(m, t))) {
    const wind = Math.max(180, [700, 520, 420, 340, 260][m.aiLv] * (m.boss ? 1.2 : 1));
    m.atkCd = now + wind + [1400, 1000, 800, 650, 500][m.aiLv] / (1 + (m.buffMods.aspd || 0));
    const ranged = range > 60; const p = lead(m, t, 300);
    if (!ranged) zone.fx({ t: 'tele', s: 'arc', x: Math.round(m.x), y: Math.round(m.y), a: +ang.toFixed(2), r: range + 10 + m.r, ar: 100, d: wind, e: m.el || 'phys' });
    m.action = { type: 'cast', until: now + wind + 150, lockMove: true };
    zone.schedule(now + wind, () => {
      if (m.dead || !m.canAct(zone.now)) return;
      if (ranged) { m.facing = Math.atan2(p.y - m.y, p.x - m.x); spawnProj(zone, m, { spd: 6, rng: range + 40, sz: 4 }, { m: 0.9, el: m.el }, m.facing, zone.now); }
      else meleeHit(zone, m, { s: 'arc', r: range + 10 + m.r, a: 100 }, { m: 1, el: m.el, st: m.boss ? 4 : 2, kb: m.boss ? 40 : 10 }, zone.now);
    });
    m.vx = m.vy = 0;
  }
}
