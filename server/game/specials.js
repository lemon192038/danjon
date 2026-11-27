// Weapon-type special actions (right click / ◆ button). One handler per special type; params come from weaponTypes data.
import { meleeHit, spawnProj, execEffects } from './skillExec.js';
import { puppetPress } from './mechanics.js';
import { MORPH_SPECIAL, morphKill } from './morph.js';
import { dealDamage } from './combat.js';
const opt = (m, x = {}) => ({ m, st: 3, ...x });
const ready = (a, now, cd) => { if ((a.spCd || 0) > now) return false; a.spCd = now + cd; return true; };
const buff = (a, mods, dur) => a.addBuff(mods, dur, 'special');
const gauge = (a, k, max) => { a.gauge ||= {}; return a.gauge[k] ?? 0; };
const setG = (a, k, v) => { a.gauge ||= {}; a.gauge[k] = v; };
const hold = (dr, extra = {}) => ({ press: (z, a, s, now) => { a.action = { type: 'guard', guard: { dr: s.dr ?? dr, ...extra }, holdSpecial: true, moveMul: 0.4, until: now + 99999 }; }, release: (z, a) => { if (a.action?.holdSpecial) a.action = null; } });
const chargeH = { press: (z, a, s, now) => { a.action = { type: 'charge', t0: now, holdSpecial: true, moveMul: 0.35, until: now + 99999 }; z.fx({ t: 'charge', id: a.id }); },
  release: (z, a, s, now) => {
    if (a.action?.type !== 'charge') return; const t = Math.min(s.max, (now - a.action.t0) * (1 + (a.stats.mods.chargeSpd || 0)));
    const m = 1 + (s.mult - 1) * t / s.max; a.action = null;
    const step = a.wt.combo[Math.min(s.step ?? 0, a.wt.combo.length - 1)];
    const sh = s.pierceLine ? { s: 'thrust', l: (step.l || 60) * 1.6, w: 16 } : step;
    meleeHit(z, a, sh, opt(step.m * m, { st: 6 * m, kb: 60 * m, pen: s.pierceLine ? 0.6 : 0 }), now);
    if (s.quake && t >= s.max * 0.95) { meleeHit(z, a, { s: 'circle', r: 80 }, opt(m * 0.8, { status: ['stun', 0.5, 1200] }), now); z.shake(6); }
    z.lock(a, 350);
  } };

export const SPECIALS = {
  guard: { ...hold(0.6), release: (z, a, s, now) => { if (a.action?.holdSpecial && now - (a.action.t0 || now) < 0) a.action = null; if (a.action?.holdSpecial) { a.action = null; if (ready(a, now, 1500)) { meleeHit(z, a, { s: 'arc', r: 28, a: 90 }, opt(s.bash, { st: 5, kb: 50, status: ['stun', 0.25, 800] }), now); } } } },
  charge: chargeH,
  iai: { press: (z, a, s, now) => { a.action = { type: 'iai', t0: now, holdSpecial: true, moveMul: 0.5, until: now + 99999 }; z.fx({ t: 'stance', id: a.id, d: 800 }); },
    release: (z, a, s, now) => { if (a.action?.type !== 'iai') return; const ok = now - a.action.t0 > 400; a.action = null; z.lunge(a, 36); meleeHit(z, a, { s: 'arc', r: s.r, a: 160 }, opt(ok ? s.mult : 1.2, { critAdd: ok ? s.crit : 0, st: 5 }), now); z.lock(a, 260); } },
  frenzy: { press: (z, a, s, now) => ready(a, now, 12000) && buff(a, { aspd: s.spd, move: 0.15, dr: -0.15, spDrain: s.drain }, s.dur) },
  parry: { press: (z, a, s, now) => { if (!ready(a, now, 700)) return; a.action = { type: 'parry', until: now + s.win, lockMove: true, counter: { until: now + s.win, eff: { m: s.mult, shape: a.wt.combo[a.wt.combo.length - 1] }, lvM: 1 } }; z.fx({ t: 'stance', id: a.id, d: s.win }); } },
  riposte: { press: (z, a, s, now) => { if (!ready(a, now, 800)) return; a.action = { type: 'parry', until: now + s.win, lockMove: true, counter: { until: now + s.win, eff: { m: s.mult, shape: a.wt.combo[0] }, lvM: 1, onSuccess: () => buff(a, { aspd: s.spd }, s.dur) } }; z.fx({ t: 'stance', id: a.id, d: s.win }); } },
  dashStrike: { press: (z, a, s, now) => ready(a, now, 2500) && execEffects(z, a, [{ t: 'dash', d: s.d, inv: 200, hit: { s: 'arc', r: 34, a: 180 }, m: s.m }], {}, now) },
  execute: { press: (z, a, s, now) => { if (!ready(a, now, 6000)) return; z.lock(a, 600); z.schedule(now + 450, () => meleeHit(z, a, { s: 'slam', d: 26, r: 34 }, opt(1.5, { exec: { th: s.th, m: s.mult }, st: 8 }), z.now)); z.fx({ t: 'tele', s: 'circle', x: Math.round(a.x + Math.cos(a.facing) * 26), y: Math.round(a.y + Math.sin(a.facing) * 26), r: 34, d: 450, e: 'dark' }); } },
  throwSpin: { press: (z, a, s, now) => ready(a, now, 3000) && spawnProj(z, a, { spd: s.spd, rng: s.rng, sz: 10, ret: true, pierce: 99 }, opt(s.m * s.h), a.facing, now) },
  backstab: { press: (z, a, s, now) => { if (!ready(a, now, 4000)) return; execEffects(z, a, [{ t: 'blink', d: s.d, toTarget: 1, back: 1 }, { t: 'hit', shape: { s: 'thrust', l: 26, w: 14 }, m: s.mult, critAdd: 0.4 }], {}, now); } },
  bloodPact: { press: (z, a, s, now) => { if (!ready(a, now, 15000)) return; a.hp = Math.max(1, a.hp - a.maxHp * s.hp); buff(a, { atk: s.dmg, ls: 0.06 }, s.dur); z.fx({ t: 'buff', id: a.id, e: 'dark' }); } },
  orbit: { press: (z, a, s, now) => { if (!ready(a, now, s.dur + 2000)) return; z.addArea({ owner: a, x: a.x, y: a.y, r: s.r + 8, until: now + s.dur, tick: 250, next: now, follow: a, orbit: s.n, opt: opt(s.m, { st: 1 }), e: { orbit: 1, r: s.r }, dr: s.shield ? 0.15 : 0 }); if (s.shield) buff(a, { dr: 0.15 }, s.dur); } },
  vault: { press: (z, a, s, now) => ready(a, now, 3000) && execEffects(z, a, [{ t: 'leap', d: s.d, r: 30, m: s.m, st: 3 }], { tx: a.aimX, ty: a.aimY }, now) },
  guardCharge: { press: (z, a, s, now) => { a.action = { type: 'guard', guard: { dr: s.dr }, holdSpecial: true, moveMul: 0.3, until: now + 99999, t0: now }; },
    release: (z, a, s, now) => { if (!a.action?.holdSpecial) return; const long = now - a.action.t0 > 500; a.action = null; if (long && ready(a, now, 2500)) execEffects(z, a, [{ t: 'dash', d: s.d, inv: 300, hit: { s: 'thrust', l: 34, w: 24 }, m: s.m, st: 6, kb: 80 }], {}, now); } },
  hook: { press: (z, a, s, now) => {
    if (!ready(a, now, 2500)) return;
    const hits = meleeHit(z, a, { s: 'chain', l: s.l, w: 12 }, opt(s.m, { status: s.bind ? ['bind', 1, s.bind] : undefined }), now);
    const t = hits[0]; if (!t) return;
    if (s.self || t.boss || t.mass > 3) { const ang = Math.atan2(t.y - a.y, t.x - a.x); const d = Math.max(0, Math.hypot(t.x - a.x, t.y - a.y) - t.r - 14); for (let i = 1; i <= 5; i++) z.schedule(now + i * 30, () => z.moveActor(a, Math.cos(ang) * d / 5, Math.sin(ang) * d / 5)); a.invulnUntil = now + 200; }
    else { for (const h of hits) { const ang = Math.atan2(a.y - h.y, a.x - h.x); const d = Math.max(0, Math.hypot(h.x - a.x, h.y - a.y) - h.r - 16); z.push(h, Math.cos(ang) * Math.min(d, s.pull) * 1.5, Math.sin(ang) * Math.min(d, s.pull) * 1.5); } }
  } },
  sweepTrip: { press: (z, a, s, now) => { if (!ready(a, now, 3000)) return; const hs = meleeHit(z, a, { s: 'circle', r: s.r }, opt(s.m, { st: 4 }), now); for (const h of hs) if (!h.boss) { h.staggerUntil = now + s.down; h.statuses.bind = { until: now + s.down, stacks: 1 }; } } },
  tide: { press: (z, a, s, now) => ready(a, now, 5000) && meleeHit(z, a, { s: 'circle', r: s.r }, opt(s.m, { kb: s.kb, el: 'water', status: ['slow', 0.8, 3000] }), now) },
  spinGuard: { press: (z, a, s, now) => { if (!ready(a, now, 4000)) return; a.action = { type: 'spin', until: now + s.dur, guard: { dr: 0.5, reflect: true }, moveMul: 0.6 }; for (let t = 0; t < s.dur; t += 250) z.schedule(now + t, () => meleeHit(z, a, { s: 'circle', r: s.r }, opt(s.m, { st: 1 }), z.now)); } },
  leap: { press: (z, a, s, now) => ready(a, now, 4000) && execEffects(z, a, [{ t: 'leap', d: s.d, r: s.r, m: s.m, st: 6 }], { tx: a.aimX, ty: a.aimY }, now) },
  brace: { press: (z, a, s, now) => { if (!ready(a, now, 5000)) return; a.action = { type: 'brace', until: now + s.dur, lockMove: true, guard: { dr: 0.3 }, brace: { m: s.m, hitSet: new Set() } }; z.fx({ t: 'stance', id: a.id, d: s.dur }); } },
  reap: { press: (z, a, s, now) => { if (!ready(a, now, 3500)) return; const hs = meleeHit(z, a, { s: 'circle', r: s.r }, opt(s.m, { mark: 1, pull: 40 }), now); a.heal(a.maxHp * s.heal * hs.length, z); } },
  rage: { press: (z, a, s, now) => ready(a, now, 15000) && buff(a, { atk: s.dmg, dr: s.dr, kbImmune: 1 }, s.dur) },
  whirl: { press: (z, a, s, now) => { if (!ready(a, now, s.dur + 1500)) return; a.action = { type: 'spin', until: now + s.dur, moveMul: s.mv }; for (let t = 0; t < s.dur; t += s.tick) z.schedule(now + t, () => meleeHit(z, a, { s: 'circle', r: s.r }, opt(s.m, { st: 2 }), z.now)); } },
  spin: { press: (z, a, s, now) => { if (!ready(a, now, s.dur + 1500)) return; a.action = { type: 'spin', until: now + s.dur, moveMul: 0.5 }; let k = 0; for (let t = 0; t < s.dur; t += s.tick) { const mm = s.m * (1 + k++ * s.build); z.schedule(now + t, () => meleeHit(z, a, { s: 'circle', r: s.r }, opt(mm, { st: 2, unblockable: 1 }), z.now)); } } },
  volley: { press: (z, a, s, now) => ready(a, now, 3500) && spawnProj(z, a, { spd: s.spd, rng: s.rng, sz: 5, n: s.n, sp: s.sp, ret: true, pierce: 2 }, opt(s.m), a.facing, now) },
  armorBreak: { press: (z, a, s, now) => ready(a, now, 5000) && meleeHit(z, a, { s: 'slam', d: 24, r: 28 }, opt(s.m, { st: 6, status: ['armorbreak', 1, s.dur] }), now) },
  superArmor: { press: (z, a, s, now) => { if (!ready(a, now, 14000)) return; a.superArmorUntil = now + s.dur; buff(a, { dr: s.dr, kbImmune: 1 }, s.dur); z.fx({ t: 'buff', id: a.id, e: 'earth' }); } },
  blessStrike: { press: (z, a, s, now) => { if (!ready(a, now, 5000)) return; meleeHit(z, a, { s: 'arc', r: 36, a: 120 }, opt(s.m, { el: 'holy' }), now); for (const t of z.alliesOf(a)) if (Math.hypot(t.x - a.x, t.y - a.y) < s.r) t.heal(t.maxHp * s.heal, z); z.fx({ t: 'heal', x: a.x, y: a.y, r: s.r }); } },
  spikeBurst: { press: (z, a, s, now) => ready(a, now, 4000) && meleeHit(z, a, { s: 'circle', r: s.r }, opt(s.m, { status: ['bleed', 1, 4000], st: 3 }), now) },
  tauntRoar: { press: (z, a, s, now) => { if (!ready(a, now, 10000)) return; execEffects(z, a, [{ t: 'taunt', r: s.r, dur: s.dur }, { t: 'buff', mods: { dr: s.dr }, dur: s.dur }], {}, now); } },
  roll: { press: (z, a, s, now) => ready(a, now, 4000) && execEffects(z, a, [{ t: 'dash', d: s.d, inv: 250, hit: { s: 'circle', r: 22 }, m: s.m, st: s.st, kb: 60 }], {}, now) },
  pileLoad: { press: (z, a, s, now) => { const g = gauge(a, 'pile'); if (g < s.max) { setG(a, 'pile', g + 1); z.lock(a, 300); z.fx({ t: 'charge', id: a.id }); } else if (ready(a, now, 800)) { setG(a, 'pile', 0); meleeHit(z, a, { s: 'thrust', l: 56, w: 18 }, opt(s.m * s.max, { pen: 1, st: 10, kb: 90 }), now); z.shake(6); } } },
  chi: { press: (z, a, s, now) => { const g = gauge(a, 'chi'); if (g < 1 || !ready(a, now, 800)) return; setG(a, 'chi', 0); meleeHit(z, a, { s: 'thrust', l: 40, w: 30 }, opt(1 + g * s.m * 3, { kb: 40 * g, st: g * 2 }), now); z.fx({ t: 'boom', x: a.x + Math.cos(a.facing) * 20, y: a.y + Math.sin(a.facing) * 20, r: 20 + g * 4, e: 'fire' }); } },
  grab: { press: (z, a, s, now) => { if (!ready(a, now, 4000)) return; const t = z.nearestEnemy(a, s.r + 20, true); if (!t) return; const ang = a.facing; if (!t.boss) { z.push(t, Math.cos(ang) * s.throw, Math.sin(ang) * s.throw); t.staggerUntil = now + 800; } dealDamage(z, a, t, opt(s.m, { st: 8 }), now); z.schedule(now + 300, () => meleeHit(z, a, { s: 'circle', r: 30 }, opt(s.m * 0.4), z.now, { x: t.x, y: t.y, a: 0 })); } },
  pounce: { press: (z, a, s, now) => ready(a, now, 3000) && execEffects(z, a, [{ t: 'leap', d: s.d, r: 26, m: s.m, status: ['bleed', 1, 4000] }], { tx: a.aimX, ty: a.aimY }, now) },
  tempo: { press: (z, a, s, now) => { const g = gauge(a, 'tempo'); if (g < 3 || !ready(a, now, 1000)) return; setG(a, 'tempo', 0); meleeHit(z, a, { s: 'circle', r: 46 }, opt(0.4 * g, { st: g }), now); } },
  launch: { press: (z, a, s, now) => ready(a, now, 3000) && meleeHit(z, a, { s: 'arc', r: s.r + 10, a: 120 }, opt(s.m, { launch: 1, st: 5 }), now) },
  overclock: { press: (z, a, s, now) => { if (!ready(a, now, 14000)) return; buff(a, { aspd: s.spd, atk: 0.2 }, s.dur); z.schedule(now + s.dur, () => { a.staggerUntil = z.now + 800; z.fx({ t: 'steam', id: a.id }); }); } },
  auraBurst: { press: (z, a, s, now) => ready(a, now, 5000) && (meleeHit(z, a, { s: 'circle', r: s.r }, opt(s.m, { kb: s.kb, el: 'holy', st: 5 }), now), z.fx({ t: 'boom', x: a.x, y: a.y, r: s.r, e: 'holy' })) },
  aim: { press: (z, a, s, now) => { a.action = { type: 'aim', t0: now, holdSpecial: true, moveMul: 0.3, until: now + 99999 }; },
    release: (z, a, s, now) => { if (a.action?.type !== 'aim') return; const t = Math.min(s.max, now - a.action.t0); a.action = null; const k = 1 + (s.mult - 1) * t / s.max; spawnProj(z, a, { spd: 14, rng: 360, sz: 4, pierce: t >= s.max ? s.pierce : 0 }, opt(k, { critAdd: t >= s.max ? 0.3 : 0 }), a.facing, now); z.lock(a, 200); } },
  boltSwap: { press: (z, a, s, now) => { a.boltMode = ((a.boltMode || 0) + 1) % s.modes.length; z.fx({ t: 'mode', id: a.id, v: ['貫通矢', '炸裂矢', '捕縛矢'][a.boltMode] }); } },
  barrage: { press: (z, a, s, now) => { if (!ready(a, now, s.dur + 2500)) return; a.action = { type: 'barrage', until: now + s.dur, moveMul: s.mv }; for (let t = 0; t < s.dur; t += s.rate) z.schedule(now + t, () => spawnProj(z, a, { spd: 12, rng: 220, sz: 2 }, opt(s.m), a.facing + (Math.random() - 0.5) * 0.25, z.now)); } },
  manaArrow: { press: (z, a, s, now) => { if (!ready(a, now, 4000) || a.sp < 10) return; a.sp -= 10; spawnProj(z, a, { spd: 9, rng: 260, sz: 4, n: s.n, sp: s.sp / s.n, hom: 0.1 }, opt(s.m, { el: 'auto', magic: 1 }), a.facing, now); } },
  spirit: { press: (z, a, s, now) => ready(a, now, s.dur + 4000) && z.spawnSummon(a, 'spirit', s.dur, s.m, ['wind', 'water', 'earth', 'holy'][Math.floor(now / 1000) % 4]) },
  pinThrow: { press: (z, a, s, now) => ready(a, now, 3500) && spawnProj(z, a, { spd: 12, rng: 240, sz: 5, pierce: 1 }, opt(s.m, { status: ['bind', 1, s.bind] }), a.facing, now) },
  ricochet: { press: (z, a, s, now) => ready(a, now, 3000) && spawnProj(z, a, { spd: 9, rng: 400, sz: 6, bnc: s.bnc, chain: s.bnc }, opt(s.m), a.facing, now) },
  recallStrike: { press: (z, a, s, now) => { if (!ready(a, now, 2500)) return; for (const p of z.projs) if (p.owner === a && p.ret) { p.returning = true; p.opt = { ...p.opt, m: p.opt.m * s.m, status: ['stun', 1, s.stun] }; p.hits.clear(); } } },
  heatVent: { press: (z, a, s, now) => { const h = gauge(a, 'heat'); if (h < 30 || !ready(a, now, 1500)) return; setG(a, 'heat', 0); meleeHit(z, a, { s: 'circle', r: s.r }, opt(s.m * h / 100 + 0.5, { el: 'fire', kb: 80, status: ['burn', 0.8, 3000] }), now); z.fx({ t: 'boom', x: a.x, y: a.y, r: s.r, e: 'fire' }); z.shake(5); } },
  channel: { press: (z, a, s, now) => { a.action = { type: 'channel', t0: now, holdSpecial: true, moveMul: 0.2, until: now + s.dur, next: now }; },
    hold: (z, a, s, now) => { const ac = a.action; if (ac?.type !== 'channel' || now < ac.next) return; ac.next = now + 200; if (a.sp < s.sp) { a.action = null; return; } a.sp -= s.sp; const tx = a.aimX ?? a.x, ty = a.aimY ?? a.y; meleeHit(z, a, { s: 'circle', r: 36 + (now - ac.t0) / 100 }, opt(s.m * (1 + (now - ac.t0) / 1500), { el: 'auto', magic: 1, st: 1 }), now, { x: tx, y: ty, a: 0 }); },
    release: (z, a) => { if (a.action?.type === 'channel') a.action = null; } },
  elemShift: { press: (z, a, s, now) => { const els = a.wt.elem; a.elemIdx = ((a.elemIdx || 0) + 1) % els.length; a.weaponEl = els[a.elemIdx]; z.fx({ t: 'mode', id: a.id, v: a.weaponEl, e: a.weaponEl }); } },
  quickcast: { press: (z, a, s, now) => ready(a, now, 14000) && buff(a, { cdr: s.cdr, aspd: 0.2 }, s.dur) },
  pageSummon: { press: (z, a, s, now) => ready(a, now, s.dur + 3000) && z.spawnSummon(a, 'familiar', s.dur, s.m, 'dark') },
  spellChain: { press: (z, a, s, now) => { const g = gauge(a, 'chain'); if (!g || !ready(a, now, 1200)) return; setG(a, 'chain', 0); spawnProj(z, a, { spd: 10, rng: 240, sz: 6, chain: 2 + g }, opt(s.m * (1 + g), { el: 'auto', magic: 1 }), a.facing, now); } },
  orbBarrier: { press: (z, a, s, now) => { if (!ready(a, now, s.dur + 4000)) return; a.shield = { amt: a.maxHp * s.shield, until: now + s.dur }; z.fx({ t: 'shield', id: a.id }); } },
  ringSwap: { press: (z, a, s, now) => { const els = a.wt.elem; a.elemIdx = ((a.elemIdx || 0) + 1) % els.length; a.weaponEl = els[a.elemIdx]; buff(a, { aspd: 0.1 }, 3000); z.fx({ t: 'mode', id: a.id, v: a.weaponEl, e: a.weaponEl }); } },
  rune: { press: (z, a, s, now) => { if (!ready(a, now, 1200)) return; const mine = z.areas.filter(r => r.owner === a && r.rune); if (mine.length >= s.max) mine[0].until = 0; z.addArea({ owner: a, x: a.aimX ?? a.x, y: a.aimY ?? a.y, r: s.r, until: now + s.dur, tick: 0, next: now + 500, rune: 1, opt: opt(s.m, { el: 'earth', status: ['bind', 0.8, 1800], magic: 1 }), e: { trigger: 1, r: s.r } }); } },
  library: { press: (z, a, s, now) => { if (!ready(a, now, s.dur + 3000)) return; for (let i = 0; i < s.n; i++) z.spawnSummon(a, 'tome', s.dur, 0.35, a.wt.elem[i % a.wt.elem.length]); } },
  modeToggle: { press: (z, a, s, now) => { a.altMode = !a.altMode; z.fx({ t: 'mode', id: a.id, v: a.altMode ? '鞭形態' : '剣形態' }); a.comboStep = 0; } },
  transform: { press: (z, a, s, now) => { if (!ready(a, now, 1200)) return; a.altMode = !a.altMode; a.comboStep = 0; meleeHit(z, a, { s: 'circle', r: 46 }, opt(s.burst, { st: 5, kb: 60 }), now); z.fx({ t: 'mode', id: a.id, v: a.altMode ? '長柄形態' : '剣形態' }); } },
  lash: { press: (z, a, s, now) => ready(a, now, 3000) && meleeHit(z, a, { s: 'whip', l: s.l, a: 60 }, opt(s.m, { status: ['slow', 1, s.dur], pull: 30 }), now) },
  wireTrap: { press: (z, a, s, now) => { if (!ready(a, now, 4000)) return; for (let i = 0; i < s.n; i++) { const ang = a.facing + (i - 1) * 0.7; z.addArea({ owner: a, x: a.x + Math.cos(ang) * s.l * 0.5, y: a.y + Math.sin(ang) * s.l * 0.5, r: 20, until: now + s.dur, tick: 0, next: now + 300, opt: opt(s.m, { status: ['bind', 0.9, 1500] }), e: { trigger: 1, wire: 1, r: 20 } }); } } },
  hammerThrow: { press: (z, a, s, now) => ready(a, now, 3500) && spawnProj(z, a, { spd: s.spd, rng: s.rng, sz: 10, ret: s.ret, pierce: 99 }, opt(s.m, { st: 6, kb: 50 }), a.facing, now) },
  drill: { press: (z, a, s, now) => { if (!ready(a, now, s.dur + 1500)) return; a.action = { type: 'drill', until: now + s.dur, moveMul: s.mv }; for (let t = 0; t < s.dur; t += s.tick) z.schedule(now + t, () => { meleeHit(z, a, { s: 'thrust', l: 50, w: 18 }, opt(s.m, { pen: 0.4, st: 1, status: ['armorbreak', 0.1, 4000] }), z.now); z.moveActor(a, Math.cos(a.facing) * 4, Math.sin(a.facing) * 4); }); } },
  rev: { press: (z, a, s, now) => { if (!ready(a, now, s.dur + 1500)) return; a.action = { type: 'rev', until: now + s.dur, moveMul: 0.5 }; for (let t = 300; t < s.dur; t += s.tick) z.schedule(now + t, () => meleeHit(z, a, { s: 'arc', r: 44, a: 100 }, opt(s.m, { status: ['bleed', 0.25, 4000], st: 1 }), z.now)); } },
  umbrellaGuard: hold(0.7, { reflect: true }),
  rally: { press: (z, a, s, now) => { if (!ready(a, now, s.dur + 4000)) return; z.addArea({ owner: a, x: a.x, y: a.y, r: s.r, until: now + s.dur, tick: 500, next: now, opt: {}, e: { ally: 1, auraMods: { atk: s.atk, dr: s.def }, flag: 1 } }); } },
  song: { press: (z, a, s, now) => { if (!ready(a, now, 4000)) return; a.songIdx = ((a.songIdx ?? -1) + 1) % s.modes.length; const mode = s.modes[a.songIdx]; const mods = mode === 'atk' ? { atk: 0.2, aspd: 0.1 } : mode === 'def' ? { dr: 0.2 } : { regen: 0.01 }; z.areas = z.areas.filter(r => !(r.owner === a && r.song)); z.addArea({ owner: a, x: a.x, y: a.y, r: s.r, until: now + s.dur, tick: 500, next: now, song: 1, follow: a, opt: {}, e: { ally: 1, auraMods: mods } }); z.fx({ t: 'mode', id: a.id, v: { atk: '勇壮の旋律', def: '守護の旋律', heal: '癒しの旋律' }[mode] }); } },
  morph: MORPH_SPECIAL,
  puppet: { press: (z, a, s, now) => { if (!ready(a, now, 3000)) return; puppetPress(z, a, s, now); } },
  divineJudgment: { press: (z, a, s, now) => ready(a, now, 6000) && execEffects(z, a, [{ t: 'barrage', n: 1, r: s.r, spread: 0, delay: s.delay, m: s.m, el: 'holy', status: ['stun', 0.6, 1500], st: 8 }], { tx: a.aimX, ty: a.aimY }, now) },
  demonForm: { press: (z, a, s, now) => { if (!ready(a, now, s.dur + 10000)) return; a.demonUntil = now + s.dur; buff(a, { atk: s.dmg, ls: 0.08, range: 0.4, aspd: 0.2 }, s.dur); z.fx({ t: 'buff', id: a.id, e: 'dark' }); } },
  dragonBreath: { press: (z, a, s, now) => { if (!ready(a, now, 6000)) return; a.action = { type: 'breath', until: now + s.dur, moveMul: 0.3 }; for (let t = 0; t < s.dur; t += 150) z.schedule(now + t, () => meleeHit(z, a, { s: 'arc', r: s.l, a: s.a }, opt(s.m, { el: 'fire', status: ['burn', 0.3, 3000], st: 1 }), z.now)); buff(a, { dr: 0.2 }, s.dur + 3000); } },
  wings: { press: (z, a, s, now) => { if (!ready(a, now, s.dur + 8000)) return; buff(a, { move: s.spd, regen: s.heal, dodge: 0.25 }, s.dur); a.flyUntil = now + s.dur; } },
  soulHarvest: { press: (z, a, s, now) => { const g = gauge(a, 'soul'); if (g < 1 || !ready(a, now, 1000)) return; setG(a, 'soul', 0); meleeHit(z, a, { s: 'circle', r: s.r }, opt(1 + g * s.m * 2, { el: 'dark', status: ['fear', 0.5, 2000], st: g }), now); z.fx({ t: 'boom', x: a.x, y: a.y, r: s.r, e: 'dark' }); } },
  timeStop: { press: (z, a, s, now) => { if (!ready(a, now, s.cd)) return; for (const t of z.enemiesOf(a)) if (Math.hypot(t.x - a.x, t.y - a.y) < s.r) t.statuses.stop = { until: now + s.dur * (t.boss ? 0.4 : 1), stacks: 1 }; z.fx({ t: 'timestop', x: a.x, y: a.y, r: s.r, d: s.dur }); } },
  gravityWell: { press: (z, a, s, now) => ready(a, now, 6000) && z.addArea({ owner: a, x: a.aimX ?? a.x, y: a.aimY ?? a.y, r: s.r, until: now + s.dur, tick: 200, next: now, opt: opt(s.m, { el: 'void', magic: 1, dot: 1 }), e: { pull: s.pull, r: s.r, gravity: 1 } }) },
  erase: { press: (z, a, s, now) => { if (!ready(a, now, 8000)) return; for (const t of z.enemiesOf(a)) if (Math.hypot(t.x - a.x, t.y - a.y) < s.r) { t.buffs = []; t.shield = null; t.enraged = false; if (!t.boss && t.hp / t.maxHp < s.th) z.kill(t, a, now); else dealDamage(z, a, t, opt(1.5, { el: 'void', magic: 1 }), now); } z.fx({ t: 'boom', x: a.x, y: a.y, r: s.r, e: 'void' }); } },
  meteor: { press: (z, a, s, now) => ready(a, now, 9000) && execEffects(z, a, [{ t: 'barrage', n: s.n, r: s.r, spread: s.spread, delay: s.delay, interval: 150, m: s.m, el: 'fire', st: 6, status: ['burn', 0.5, 3000] }], { tx: a.aimX, ty: a.aimY }, now) },
  unlock: { press: (z, a, s, now) => { const g = gauge(a, 'unlock'); if (!ready(a, now, 1500)) return; const n = Math.min(s.stages, g + 1); setG(a, 'unlock', n); buff(a, { atk: s.per * n, dr: s.per * n * 0.5, aspd: s.per * n * 0.5, cdr: s.per * n * 0.3 }, s.dur); z.fx({ t: 'mode', id: a.id, v: `第${n}の錠 解放`, e: 'void' }); if (n === s.stages) { meleeHit(z, a, { s: 'circle', r: 160 }, opt(6, { el: 'void', st: 12 }), now); setG(a, 'unlock', 0); } } },
};

// passive gauge hooks
export function onAttackHook(z, a) {
  const t = a.wt.special.type;
  if (t === 'heatVent') { const h = gauge(a, 'heat') + 18; setG(a, 'heat', Math.min(100, h)); if (h >= 100) { a.staggerUntil = z.now + 900; setG(a, 'heat', 40); z.fx({ t: 'steam', id: a.id }); } }
  if (t === 'spellChain') setG(a, 'chain', Math.min(a.wt.special.max, gauge(a, 'chain') + 1));
}
// puppet special: weapon identity decides which puppet body is summoned (see mechanics.js)
export function onHitHook(z, a) {
  const t = a.wt.special.type;
  if (t === 'chi') setG(a, 'chi', Math.min(a.wt.special.max, gauge(a, 'chi') + 0.34));
  if (t === 'tempo') { setG(a, 'tempo', Math.min(a.wt.special.max, gauge(a, 'tempo') + 1)); a.tempoUntil = z.now + 1500; }
}
export function onKillHook(z, a) { morphKill(z, a); if (a.wt?.special.type === 'soulHarvest') setG(a, 'soul', Math.min(a.wt.special.max, gauge(a, 'soul') + 1)); }
