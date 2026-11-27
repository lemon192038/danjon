// TRANSFORMATION SYSTEM (weapon types 87-106). Server-authoritative: stage changes, resource, form stats, form combos,
// hitbox size, dodge kind, flight, species gimmicks, form-bound skills and the 万象転生 factor builds are decided here.
// Stages: 0 normal, 1 partial (sustained, free), 2 half (timed), 3 full (drains the type's own resource; doom accumulates).
// Special button: tap = next stage (at full: the species' signature move); hold ≈0.5s = revert to normal.
import { MORPH_BY_ID, ATK, FACTOR_BY_ID, MECH_PARTS, SPECIES_UNLOCK } from '../../shared/data/morph.js';
import { meleeHit, spawnProj, execEffects } from './skillExec.js';
import { clock } from './life.js';
import { DATA } from '../data.js';

const night = () => { const h = clock().hour; return h >= 20 || h < 5; };
const STAGE_NAME = ['通常形態', '部分変身', '半変身', '完全変身'];
export const isMorph = a => !!a?.wt?.morph;
export function store(ch) { const M = ch.progress.morph ||= { types: {}, factors: [], build: {}, presets: [] }; M.types ||= {}; M.factors ||= []; M.build ||= {}; M.presets ||= []; return M; }
function tstore(ch, wt) { const M = store(ch); return M.types[wt] ||= { sp: null, xp: {}, parts: {} }; }
export function unlockedSpecies(ch, wt) { const T = MORPH_BY_ID[wt]; const m = ch.mastery?.[wt]?.lv || 0; return T.species.filter((_, i) => m >= SPECIES_UNLOCK(i)).map(s => s.key); }
export function speciesOf(a) { const T = MORPH_BY_ID[a.wt.id]; const ts = a.ch ? tstore(a.ch, a.wt.id) : {}; const ok = a.ch ? unlockedSpecies(a.ch, a.wt.id) : [T.species[0].key]; return T.species.find(s => s.key === ts.sp && ok.includes(s.key)) || T.species[0]; }
function state(a) { return a.morph ||= { stage: 0, res: 30, halfUntil: 0, cd: 0, hist: [], resStacks: 0 }; }
const seedArms = a => 2 + ((a.weapon?.ident?.look?.seed ?? (a.weapon ? [...a.weapon.id].reduce((t, c) => t + c.charCodeAt(0), 0) : 0)) % 5);
// ── chimera build (万象転生): factors chosen per slot
function chimera(a) { const b = a.ch ? store(a.ch).build : {}; const own = new Set(a.ch ? store(a.ch).factors : []); const F = Object.values(b).filter(id => own.has(id)).map(id => FACTOR_BY_ID[id]).filter(Boolean); return F; }
// the attack kit (combo) of the current form
export function morphCombo(a) { if (!isMorph(a)) return null; const S = state(a); if (S.stage === 0) return null; const T = MORPH_BY_ID[a.wt.id]; const sp = speciesOf(a);
  let keys = S.stage === 1 ? [sp.half[0], ...a.wt.combo.slice(1).map(() => null)] : S.stage === 2 ? [...sp.half, sp.full[2]] : sp.full;
  if (T.chimera && S.stage >= 2) { const F = chimera(a); const atk = F.map(f => f.atk).filter(Boolean); if (atk.length) keys = S.stage === 2 ? atk.slice(0, 2).concat(atk.at(-1)) : [...atk, atk[0]].slice(0, Math.max(3, atk.length)); }
  if (T.parts && S.stage >= 2) { const arm = MECH_PARTS.arm.find(p => p[0] === tstore(a.ch || { progress: {} }, a.wt.id).parts?.arm); if (arm) keys = [arm[2], ...keys.slice(1)]; }
  const scale = [1, 0.9, 1.0, 1.15][S.stage]; const arms = sp.arms ? seedArms(a) : 0;
  return keys.map((k, i) => { if (!k) return a.wt.combo[i]; const st = { ...ATK[k][1] }; st.m = Math.round(st.m * scale * 100) / 100; if (k === 'arms' && arms) st.h = arms; if (sp.el && !st.el) st.el = sp.el; if (sp.status && !st.status && S.stage === 3) st.status = sp.status; st.morphKey = k; return st; }); }
// form stats (applied in refreshStats)
export function morphMods(a, s) { if (!isMorph(a)) return; const S = state(a); const T = MORPH_BY_ID[a.wt.id]; const sp = speciesOf(a); const st = S.stage; const add = (k, v) => { if (!v) return; if (k === 'move') s.move = (s.move || 1) * (1 + v); else if (k === 'aspd') s.aspd *= 1 + v; else if (k === 'atk') { s.atk = Math.round(s.atk * (1 + v)); s.matk = Math.round(s.matk * (1 + v)); } else if (k === 'dr') s.dr = Math.max(0, Math.min(0.8, (s.dr || 0) + v)); else if (k === 'crit') s.crit += v; else if (k === 'hp') { s.maxHp = Math.round(s.maxHp * (1 + v)); } else if (k === 'range') s.range = (s.range || 1) * (1 + v); else s.mods[k] = (s.mods[k] || 0) + v; };
  const plus = a.ch?.inventory.find(i => i.uid === a.ch.equip.weapon)?.plus || 0; const lv = speciesLevel(a);
  if (st >= 1) { add('atk', 0.04 + plus * 0.01); const pas = DATA.formSkills?.get(a.wt.id)?.find(x => x.kind === 'passive'); for (const [k, v] of Object.entries(pas?.eff[0].mods || {})) add(k, v); }
  if (st >= 2) { for (const [k, v] of Object.entries(sp.mods)) add(k, v * (st === 2 ? 0.5 : 1)); add('atk', st === 3 ? 0.12 + lv * 0.015 : 0.06); }
  if (st === 3 && T.chimera) for (const f of chimera(a)) for (const [k, v] of Object.entries(f.mods)) add(k, v);
  if (st >= 2 && T.parts) { const P = tstore(a.ch || { progress: {} }, a.wt.id).parts || {}; for (const slot of ['leg', 'core']) { const p = MECH_PARTS[slot].find(x => x[0] === P[slot]); if (p) for (const [k, v] of Object.entries(p[2])) add(k, v); } }
  if (T.key === 'abyssform' && st >= 1 && a.zone && wet(a)) { add('atk', 0.15); add('move', 0.2); }
  a.morphSi = T.species.indexOf(sp); a.r = st === 3 ? (sp.r || 10) : st === 2 ? 8 : 6; a.dodgeKind = st >= 2 ? sp.dodge || null : null; a.superArmor = st === 3 && !!sp.armor; a.morphReflect = st === 3 && !!sp.reflect;
  if (st >= 2 && sp.el) a.weaponEl = sp.el; a.visKey = st === 3 ? 'morph_' + sp.plan : a.wt.key; }
const wet = a => !!a.zone?.dungeon?.underwater || a.zone?.world?.life?.weatherOf?.(a.zone.world.cityNear(a.zone) || 'haven') === 'rain';
function speciesLevel(a) { if (!a.ch) return 0; const sp = speciesOf(a); const xp = tstore(a.ch, a.wt.id).xp[sp.key] || 0; return Math.min(10, Math.floor(Math.sqrt(xp / 60))); }
function gain(a, n) { const S = state(a); if (n <= 0) return; const T = MORPH_BY_ID[a.wt.id]; if (T.key === 'abyssform' && wet(a)) n *= T.res.gain.water || 1; S.res = Math.min(100, S.res + n); }
function fx(z, a, v) { z.fx({ t: 'morph', id: a.id, v, st: state(a).stage, sp: speciesOf(a).key }); }
export function setStage(z, a, n, why) { const S = state(a), T = MORPH_BY_ID[a.wt.id], sp = speciesOf(a), now = z.now; const prev = S.stage; if (n === prev) return;
  S.stage = n; if (n === 2) S.halfUntil = now + T.res.half; if (n < prev) S.cd = now + 1500;
  a.flyUntil = n === 3 && sp.fly ? now + 86400000 : (a.flyUntil > now + 60000 ? 0 : a.flyUntil);
  if (n === 3 && sp.revive && !S.revived) { a.addBuff({ revive: 1 }, 600000, 'morphRevive'); S.revived = true; } if (n < 3) { a.buffs = a.buffs.filter(b => b.src !== 'morphRevive'); a.recalcBuffs?.(); }
  a.invulnUntil = Math.max(a.invulnUntil || 0, now + (n > prev ? 250 : 120)); // a short, bounded transform window
  a.action = null; a.comboStep = 0; a.refreshStats(); fx(z, a, n > prev ? 'up' : 'down'); if (a.ch) { const C = store(a.ch); C.cur = { wt: a.wt.id, stage: n }; }
  a.session?.send({ t: 'toast', v: `${STAGE_NAME[n]}${n >= 2 ? `：${n === 3 ? sp.name : T.half}` : n === 1 ? `：${T.partial}` : ''}${why ? `（${why}）` : ''}` }); }
// special button
export const MORPH_SPECIAL = {
  press: (z, a, s, now) => { const S = state(a); S.pressAt = now; S.held = false; },
  hold: (z, a, s, now) => { const S = state(a); if (!S.held && S.pressAt && now - S.pressAt > 450 && S.stage > 0) { S.held = true; setStage(z, a, 0, '解除'); } },
  release: (z, a, s, now) => { const S = state(a); if (S.held) { S.held = false; return; } S.pressAt = 0; const T = MORPH_BY_ID[a.wt.id];
    if (S.stage === 3) return signature(z, a, now); if (now < S.cd) return a.session?.send({ t: 'err', v: '変身の反動で、少し待つ必要がある' });
    const need = T.res.cost[S.stage]; if (S.res < need) return a.session?.send({ t: 'err', v: `${T.res.name}が足りない（${Math.floor(S.res)}/${need}）` });
    if (S.stage >= 1) S.res -= need * 0.5; setStage(z, a, S.stage + 1); } };
// full-form special: the species' signature move
function signature(z, a, now, power = 1.5) { const S = state(a); if ((S.sigCd || 0) > now) return; S.sigCd = now + 2500; const sp = speciesOf(a); const T = MORPH_BY_ID[a.wt.id];
  if (T.rewind) return rewind(z, a, 3000);
  if (sp.track) { const t = z.nearestEnemy(a, 220); if (t) { a.x = t.x - Math.cos(a.facing) * (t.r + 12); a.y = t.y - Math.sin(a.facing) * (t.r + 12); a.facing = Math.atan2(t.y - a.y, t.x - a.x); } }
  const k = sp.full[2]; const st = { ...ATK[k][1], el: ATK[k][1].el || sp.el || undefined }; const o = { m: st.m * power, st: (st.st || 3) + 4, kb: st.kb, el: st.el, status: st.status || sp.status };
  if (st.s === 'proj') spawnProj(z, a, st, o, a.facing, now); else meleeHit(z, a, st.s === 'whip' ? { ...st, s: 'arc', r: st.l, a: st.a } : st, o, now);
  if (sp.clones) z.spawnSummon(a, 'clone', 6000, 0.35); if (sp.heal) for (const x of z.actorsList()) if (x.team === a.team && !x.dead && Math.hypot(x.x - a.x, x.y - a.y) < 120) x.heal(x.maxHp * 0.08, z);
  if (sp.support) z.addArea({ owner: a, x: a.x, y: a.y, r: 120, until: now + 8000, tick: 500, next: now, opt: {}, e: { ally: 1, auraMods: { atk: 0.12 } }, follow: a });
  fx(z, a, 'sig'); }
function rewind(z, a, ms) { const S = state(a); const past = S.hist.find(h => h.t >= z.now - ms - 300) || S.hist[0]; if (!past) return; z.fx({ t: 'blink', x: Math.round(a.x), y: Math.round(a.y), e: 'void' }); if (!z.blocked(past.x, past.y)) { a.x = past.x; a.y = past.y; } a.hp = Math.max(a.hp, Math.min(a.maxHp, past.hp)); fx(z, a, 'rewind'); }
// per-tick (from the zone's player tick): resource gain/drain, half-form timer, growth, history for rewinds
export function morphTick(z, a, now) { if (!isMorph(a)) return; const S = state(a);
  if (!S.restored) { S.restored = true; const c = a.ch && store(a.ch).cur; if (c?.wt === a.wt.id && c.stage >= 1) { S.stage = 1; S.res = c.res ?? S.res; a.refreshStats(); } } // partial form is sustained across logins; half/full end at logout
  if (a.ch && (S.saveAt || 0) < now) { S.saveAt = now + 1000; store(a.ch).cur = { wt: a.wt.id, stage: S.stage, res: Math.floor(S.res) }; } const dt = Math.min(0.25, (now - (S.last || now)) / 1000); S.last = now; if (dt <= 0) return; const T = MORPH_BY_ID[a.wt.id], G = T.res.gain;
  const moving = Math.hypot(a.vx || 0, a.vy || 0) > 1; const dark = night() || !!a.zone?.dungeon || (S.darkUntil || 0) > now;
  gain(a, ((G.regen || 0) + (G.still && !moving ? G.still : 0) + (G.night && night() ? G.night : 0) + (G.dark && dark ? G.dark : 0)) * dt);
  if (S.stage === 3) { const d = T.res.drain + (T.res.daylight && !dark ? T.res.daylight : 0); if (d > 0) S.res = Math.max(0, S.res - d * dt); else S.res = Math.min(100, S.res - d * dt);
    if (T.res.hpCost) a.hp = Math.max(1, a.hp - a.maxHp * T.res.hpCost * dt);
    if (a.ch) { const ts = tstore(a.ch, a.wt.id); const k = speciesOf(a).key; ts.xp[k] = (ts.xp[k] || 0) + dt; }
    if (S.res <= 0) setStage(z, a, 1, `${T.res.name}が尽きた`); }
  if (S.stage === 2 && now > S.halfUntil) setStage(z, a, 1, '半変身の時間切れ');
  if ((S.histAt || 0) < now) { S.histAt = now + 250; S.hist.push({ t: now, x: a.x, y: a.y, hp: a.hp }); while (S.hist.length && S.hist[0].t < now - 4000) S.hist.shift(); }
  a.gauge ||= {}; a.gauge.morph = Math.floor(S.res); a.gauge.mst = S.stage; a.gauge.mhalf = S.stage === 2 ? Math.max(0, Math.ceil((S.halfUntil - now) / 1000)) : 0; a.gauge.mres = T.res.name; a.gauge.mcol = T.res.col; }
// combat hooks
export function morphDeal(z, a, t, dmg, crit) { if (!isMorph(a)) return; const G = MORPH_BY_ID[a.wt.id].res.gain; gain(a, (G.hit || 0) + (crit ? G.crit || 0 : 0)); const sp = speciesOf(a); const S = state(a); if (sp.resonate && S.stage === 3) S.resStacks = Math.min(10, S.resStacks + 1); }
export function morphHurt(z, a, src, dmg) { if (!isMorph(a)) return; const G = MORPH_BY_ID[a.wt.id].res.gain; if (G.hurt) gain(a, G.hurt * dmg / a.maxHp * 100); }
export function morphKill(z, a) { if (!isMorph(a)) return; const G = MORPH_BY_ID[a.wt.id].res.gain; gain(a, G.kill || 0); }
export function morphDmgMul(a, t, o) { if (!isMorph(a) || state(a).stage < 2) return 1; const sp = speciesOf(a); let m = 1; if (sp.judge && t.statuses?.curse) m *= 1.4; if (sp.resonate && o.vfx !== 'dot') m *= 1 + state(a).resStacks * 0.03; if (a.afterDodgeUntil > (a.zone?.now || 0)) { m *= 1 + (sp.afterDodge || 0); a.afterDodgeUntil = 0; } return m; }
export function morphDodge(z, a) { if (!isMorph(a) || state(a).stage < 2) return; const sp = speciesOf(a); if (sp.clones) z.spawnSummon(a, 'clone', 4000, 0.3); if (sp.afterDodge) a.afterDodgeUntil = z.now + 1200; if (sp.melt) a.invulnUntil = Math.max(a.invulnUntil, z.now + 420); }
// skills
export function skillBlock(a, sk) { if (sk.src !== 'morph') return null; if (!isMorph(a) || a.wt.id !== sk.wt) return '武器種が違う'; const S = state(a); if (sk.kind === 'passive') return 'パッシブ';
  if (sk.ult) { const T = MORPH_BY_ID[a.wt.id]; const need = T.res.ult || 60; if (S.stage !== 3) return '完全変身中のみ'; if (S.res < need) return `${T.res.name}が${need}以上必要`; return null; }
  return S.stage === sk.form ? null : `${STAGE_NAME[sk.form]}専用`; }
export function morphEff(z, a, e, lvM, now) { if (!isMorph(a)) return; const S = state(a); const T = MORPH_BY_ID[a.wt.id];
  if (e.gain) gain(a, e.gain); if (e.dark) S.darkUntil = now + e.dark; if (e.ult) S.res = Math.max(0, S.res - (T.res.ult || 60));
  if (e.sig) signature(z, a, now, e.sig); if (e.rewind) rewind(z, a, e.rewind);
  if (e.enchant) { const el = speciesOf(a).el || a.weaponEl || 'holy'; a.enchant = { el, until: now + 15000, m: e.enchant }; z.fx({ t: 'buff', id: a.id, e: el }); }
  if (e.fusion) execEffects(z, a, ['fire', 'ice', 'thunder'].map((el, i) => ({ t: 'barrage', n: 4, r: 34, spread: 100, delay: 300 + i * 250, interval: 80, m: e.fusion, el })), { lvM, tx: a.aimX, ty: a.aimY }, now);
  if (e.parts && a.ch) { const ts = tstore(a.ch, a.wt.id); const L = MECH_PARTS.arm; const i = L.findIndex(p => p[0] === ts.parts.arm); ts.parts.arm = L[(i + 1) % L.length][0]; a.refreshStats(); a.session?.send({ t: 'toast', v: `換装：${L[(i + 1) % L.length][1]}` }); } }
// factors (万象転生): mastery 10 in a source type unlocks its factors; bosses sometimes leave one behind
export function grantFactors(ch, note) { const M = store(ch); for (const f of Object.values(FACTOR_BY_ID)) if (!M.factors.includes(f.id) && (ch.mastery?.[f.src]?.lv || 0) >= 10) { M.factors.push(f.id); note?.(`変身因子「${f.name}」を獲得した`); } }
export function bossFactor(s) { const M = store(s.ch); if (Math.random() > 0.2) return; const left = Object.values(FACTOR_BY_ID).filter(f => !M.factors.includes(f.id)); if (!left.length) return; const f = left[Math.floor(Math.random() * left.length)]; M.factors.push(f.id); s.send({ t: 'toast', v: `変身因子「${f.name}」を手に入れた`, cls: 'big' }); }
// panel + menu
export function morphView(s) { const a = s.actor, ch = s.ch; if (!isMorph(a)) return null; const T = MORPH_BY_ID[a.wt.id], S = state(a), M = store(ch), ts = tstore(ch, a.wt.id); const ok = unlockedSpecies(ch, a.wt.id); const cur = speciesOf(a);
  return { wt: a.wt.id, name: T.name, res: { name: T.res.name, v: Math.floor(S.res), cost: T.res.cost, gain: T.res.gain, drain: T.res.drain, half: T.res.half / 1000, ult: T.res.ult || 60 }, stage: S.stage, partial: T.partial, half: T.half,
    species: T.species.map((sp, i) => ({ key: sp.key, name: sp.name, el: sp.el, role: sp.role, fly: !!sp.fly, kit: sp.full.map(k => ATK[k][0]), unlocked: ok.includes(sp.key), need: SPECIES_UNLOCK(i), lv: Math.min(10, Math.floor(Math.sqrt((ts.xp[sp.key] || 0) / 60))), cur: sp.key === cur.key })),
    skills: (DATA.formSkills?.get(a.wt.id) || []).map(k => ({ id: k.id, name: k.name, note: k.note, form: k.form, kind: k.kind })),
    parts: T.parts ? { cur: ts.parts, opts: Object.fromEntries(Object.entries(MECH_PARTS).map(([k, l]) => [k, l.map(p => ({ id: p[0], name: p[1] }))])) } : null,
    chimera: T.chimera ? { build: M.build, owned: M.factors, slots: Object.fromEntries(['head', 'arms', 'legs', 'back', 'body'].map(k => [k, Object.values(FACTOR_BY_ID).filter(f => f.slot === k).map(f => ({ id: f.id, name: f.name, own: M.factors.includes(f.id), from: DATA.dungeons ? f.src : f.src }))])), presets: M.presets } : null }; }
export function morphMenu(s, m) { const a = s.actor, ch = s.ch, err = v => s.send({ t: 'err', v }); if (!isMorph(a)) return err('変身系の武器を装備していない'); const S = state(a), ts = tstore(ch, a.wt.id), M = store(ch);
  if (m.do === 'species') { if (S.stage >= 2) return err('変身を解いてから選ぼう'); if (!unlockedSpecies(ch, a.wt.id).includes(m.key)) return err('まだ解放されていない（熟練度で解放）'); ts.sp = m.key; a.refreshStats(); }
  if (m.do === 'part') { const L = MECH_PARTS[m.slot]; if (!L?.some(p => p[0] === m.key)) return; ts.parts[m.slot] = m.key; a.refreshStats(); }
  if (m.do === 'factor') { if (!['head', 'arms', 'legs', 'back', 'body'].includes(m.slot)) return; if (m.key && !M.factors.includes(m.key)) return err('その因子は持っていない'); if (m.key && FACTOR_BY_ID[m.key]?.slot !== m.slot) return; if (m.key) M.build[m.slot] = m.key; else delete M.build[m.slot]; a.refreshStats(); }
  if (m.do === 'save') { const i = Math.max(0, Math.min(2, m.i | 0)); M.presets[i] = { ...M.build }; }
  if (m.do === 'load') { const P = M.presets[m.i | 0]; if (P) M.build = Object.fromEntries(Object.entries(P).filter(([, id]) => M.factors.includes(id))); a.refreshStats(); }
  s.send({ t: 'open', service: 'morph', data: morphView(s) }); }
