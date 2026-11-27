// 時律投刃士 — server-authoritative job systems. Independent states: style, combo (4s window), the 0.7s hit window (per
// enemy), time marks (per enemy, max 100), time collapse gauge (max 100, 6s), time stop zones (enemies & enemy projectiles
// only; never players), planted knives (no fixed cap; fired when the stop ends), luna clocks, killing doll.
import { CHRONO_JOB, KNIFE_ID, COMBO, STYLES, COMBO_MUL, HIT_MUL, GAUGE, MARK, M } from '../../shared/data/chrono.js';
import { spawnProj } from './skillExec.js';
const TAU = Math.PI * 2;
export const isChrono = a => a?.kind === 'player' && a.ch?.job === CHRONO_JOB && a.weapon?.id === KNIFE_ID;
export function cstate(a) { return a.chrono ||= { style: 'rapid', prevStyle: 'rapid', combo: 0, lastHit: 0, gauge: 0, collapseUntil: 0, killStacks: 0, lastKill: 0, pierceT: null, pierceN: 0, hits: new Map(), planted: [], empower: null }; }
// ── stats from the style and collapse (applied in refreshStats)
export function chronoMods(a, s) { if (!isChrono(a)) return; const C = cstate(a), now = a.zone?.now || 0; const St = STYLES[C.style]; s.aspd *= 1 + St.aspd; if (C.style === 'rapid') s.aspd *= 1 + 0.05 * C.killStacks; if (C.collapseUntil > now) s.aspd *= 1.5; }
// ── normal attack: 5 steps of knives thrown toward the nearest enemy; the character's facing is not turned
export function chronoCombo(a) { if (!isChrono(a)) return null; const C = cstate(a), St = STYLES[C.style]; return COMBO.map(c => ({ s: 'proj', spd: 13, rng: 260, sz: 3, n: c.n, sp: c.sp, m: c.m * St.dmg, t: c.t, pierce: St.pierce, chronoStep: c, knife: 1, vfx: 'silverknife', finisher: c.finisher ? 1 : 0 })); }
function aimAt(z, a) { const t = lockOf(z, a, 300); return t ? Math.atan2(t.y - a.y, t.x - a.x) : a.facing; }
function lockOf(z, a, range) { const L = a.lockId && z.actors.get(a.lockId); if (L && !L.dead && Math.hypot(L.x - a.x, L.y - a.y) <= range) return L; const marked = z.enemiesOf(a).filter(t => t.marked > z.now && Math.hypot(t.x - a.x, t.y - a.y) <= range); if (marked.length) return marked[0]; return z.nearestEnemy(a, range); }
const stopActive = (z, a) => z.chronoStops?.some(s => s.owner === a && s.until > z.now);
// one step of the combo: plant (time stop / timelag) or throw; the attack direction is separate from the facing
export function chronoStep(z, a, step, o, now) { const C = cstate(a), c = step.chronoStep; const dir = aimAt(z, a);
  if (c.lg) z.push(a, Math.cos(dir) * c.lg, Math.sin(dir) * c.lg);
  if (c.mirage) z.fx({ t: 'mirage', id: a.id, x: Math.round(a.x), y: Math.round(a.y) });
  const extra = C.collapseUntil > now ? 1 : 0; // time blade during collapse
  if (stopActive(z, a) || C.style === 'timelag') { plant(z, a, c.ring ? ringPts(a.aimX ?? a.x, a.aimY ?? a.y, c.n + extra) : linePts(a, c.n + extra)); return; }
  const sh = { ...step, n: c.n, sp: c.sp, spiral: 0 }; const opt = { ...o, knife: 1, vfx: 'silverknife', finisher: c.finisher ? 1 : 0 };
  if (c.ring) for (let i = 0; i < c.n; i++) spawnProj(z, a, { ...sh, n: 1 }, opt, dir + i * TAU / c.n, now); else spawnProj(z, a, sh, opt, dir, now);
  if (extra) spawnProj(z, a, { ...sh, n: 1, sz: 5 }, { ...opt, m: opt.m * 0.8, timeBlade: 1 }, dir, now); z.fx({ t: 'kthrow', id: a.id, n: c.n, a: +dir.toFixed(2), st: C.style }); }
const linePts = (a, n) => { const tx = a.aimX ?? a.x + Math.cos(a.facing) * 80, ty = a.aimY ?? a.y + Math.sin(a.facing) * 80; return Array.from({ length: n }, (_, i) => [tx + (i - (n - 1) / 2) * 10, ty + (i % 2) * 6]); };
const ringPts = (x, y, n) => Array.from({ length: n }, (_, i) => [x + Math.cos(i * TAU / n) * 26, y + Math.sin(i * TAU / n) * 26]);
// planted knives: world coordinates, no fixed cap; compact arrays
export function plant(z, a, pts) { const C = cstate(a); for (const [x, y] of pts) C.planted.push(Math.round(x), Math.round(y)); z.fx({ t: 'kplant', id: a.id, p: pts.flat().map(Math.round) }); }
export function release(z, a, now) { const C = cstate(a); const P = C.planted; if (!P.length) return 0; C.planted = []; const n = P.length / 2; const tgt = lockOf(z, a, 400);
  for (let i = 0; i < n; i++) { const x = P[i * 2], y = P[i * 2 + 1]; const t = tgt || z.nearestEnemy({ ...a, x, y }, 300); const ang = t ? Math.atan2(t.y - y, t.x - x) : a.facing;
    spawnProj(z, a, { spd: 14, rng: 320, sz: 3, hom: 0.08, pierce: STYLES[C.prevStyle].pierce }, { m: 0.5 * STYLES[C.prevStyle].dmg, knife: 1, vfx: 'silverknife', planted: 1 }, ang, now, { x, y }); }
  z.fx({ t: 'krelease', id: a.id, n }); return n; }
// ── damage: style × pierce chain × combo × 0.7s hit count × collapse × flank — each applied once, independently
export function chronoMul(z, a, t, o, now) { if (!isChrono(a)) return 1; const C = cstate(a); let m = 1;
  if (o.knife && C.style === 'pierce') { if (C.pierceT === t.id) C.pierceN = Math.min(5, C.pierceN + 1); else { C.pierceT = t.id; C.pierceN = 0; } m *= 1 + 0.05 * C.pierceN; }
  const comboN = (now - C.lastHit <= 4000 ? C.combo : 0) + 1; m *= COMBO_MUL.find(([k]) => comboN >= k)[1];
  const H = C.hits.get(t.id) || []; while (H.length && H[0] < now - 700) H.shift(); m *= HIT_MUL[Math.min(9, H.length + 1)];
  if (C.collapseUntil > now) m *= 1.3; if (o.flank) m *= o.flank; return m; }
// after a hit landed (one registration per damage event)
export function chronoDeal(z, a, t, dmg, o, now) { if (!isChrono(a)) return; const C = cstate(a);
  C.combo = (now - C.lastHit <= 4000 ? C.combo : 0) + 1; C.lastHit = now; const H = C.hits.get(t.id) || []; H.push(now); C.hits.set(t.id, H); if (C.hits.size > 64) for (const k of [...C.hits.keys()].slice(0, 32)) C.hits.delete(k);
  const skill = !!o.isSkill || !!o.chronoSkill; C.gauge = Math.min(100, C.gauge + (skill ? GAUGE.skill : GAUGE.normal) + (o.finisher ? GAUGE.finisher : 0) + (t.boss && o.el && o.weak ? GAUGE.weak : 0));
  t.cmark ||= {}; const mk = t.cmark[a.id] = Math.min(100, (t.cmark[a.id] || 0) + (skill ? MARK.skill : C.style === 'pierce' ? MARK.pierce : MARK.knife)); if (mk >= 100 && C.empower !== t.id) { C.empower = t.id; z.fx({ t: 'cmark', id: t.id, v: 100 }); } }
export function chronoParry(a) { if (isChrono(a)) cstate(a).gauge = Math.min(100, cstate(a).gauge + GAUGE.parry); }
export function chronoKill(z, a, now) { if (!isChrono(a)) return; const C = cstate(a); if (C.style === 'rapid') { C.killStacks = Math.min(3, C.killStacks + 1); C.lastKill = now; a.refreshStats(); } }
// ── special button: switch style (rapid ⇄ pierce; timelag joins the cycle only during collapse)
export function switchStyle(z, a) { const C = cstate(a), now = z.now; const order = C.collapseUntil > now ? ['rapid', 'pierce', 'timelag'] : ['rapid', 'pierce']; const i = order.indexOf(C.style); C.style = order[(i + 1) % order.length]; if (C.style !== 'timelag') C.prevStyle = C.style;
  if (C.style !== 'rapid') C.killStacks = 0; a.refreshStats(); z.fx({ t: 'mode', id: a.id, v: STYLES[C.style].name + 'スタイル', e: 'void' }); }
// ── per tick
export function chronoTick(z, a, now) { if (!isChrono(a)) return; const C = cstate(a);
  if (C.killStacks && now - C.lastKill > 5000) { C.killStacks = 0; a.refreshStats(); }
  if (C.collapseUntil && now >= C.collapseUntil) endCollapse(z, a, now);
  if (C.collapseUntil > now) for (const k of Object.keys(a.cds)) a.cds[k] -= 50; // cooldowns advance twice as fast
  for (const s of z.chronoStops || []) if (s.owner === a && !s.done && now >= s.until) { s.done = true; release(z, a, now); }
  if (z.chronoStops?.length) z.chronoStops = z.chronoStops.filter(s => !s.done);
  for (const k of C.clocks || []) if (now >= k.next && now < k.until) clockShot(z, a, k, now); if (C.clocks?.length) C.clocks = C.clocks.filter(k => k.until > now);
  a.gauge ||= {}; a.gauge.chrono = 1; a.gauge.cstyle = C.style; a.gauge.ccombo = now - C.lastHit <= 4000 ? C.combo : 0; a.gauge.cgauge = Math.floor(C.gauge); a.gauge.ccol = C.collapseUntil > now ? Math.ceil((C.collapseUntil - now) / 1000) : 0; a.gauge.cplant = C.planted.length / 2;
  let w = 0; for (const H of C.hits.values()) { const n = H.filter(x => x >= now - 700).length; if (n > w) w = n; } a.gauge.cwin = w; const L = lockOf(z, a, 400); a.gauge.cmark = L ? Math.floor(L.cmark?.[a.id] || 0) : 0; a.gauge.cemp = C.empower ? 1 : 0; }
function endCollapse(z, a, now) { const C = cstate(a); C.collapseUntil = 0; C.gauge = 0; if (C.style === 'timelag') C.style = C.prevStyle; if (!stopActive(z, a)) release(z, a, now); a.refreshStats(); z.fx({ t: 'collapse', id: a.id, v: 0 }); }
// ── skills (effect type 'chrono')
export function chronoEff(z, a, e, lvM, ctx, now) { if (!isChrono(a)) return a.session?.send({ t: 'err', v: '銀の投げナイフを装備した時律投刃士だけが使える' }); const C = cstate(a);
  const emp = C.empower && z.actors.get(C.empower) && !z.actors.get(C.empower).dead ? z.actors.get(C.empower) : null; const useEmp = () => { if (emp) { emp.cmark[a.id] = 0; C.empower = null; z.fx({ t: 'cmark', id: emp.id, v: 0 }); } };
  const St = STYLES[C.style === 'timelag' ? C.prevStyle : C.style];
  switch (e.c) {
    case 'collapse': if (C.gauge < 100) return a.session?.send({ t: 'err', v: `時刻崩壊ゲージが足りない（${Math.floor(C.gauge)}/100）` }); C.collapseUntil = now + 6000; C.prevStyle = C.style === 'timelag' ? C.prevStyle : C.style; a.refreshStats(); z.fx({ t: 'collapse', id: a.id, v: 1 }); return;
    case 'misdirect': { const dir = Math.atan2((ctx.ty ?? a.y + Math.sin(a.facing)) - a.y, (ctx.tx ?? a.x + Math.cos(a.facing)) - a.x); const n = 5 + (emp ? 3 : 0); useEmp(); const x0 = a.x, y0 = a.y; const D = 7 * M;
      z.push(a, Math.cos(dir) * D, Math.sin(dir) * D); a.invulnUntil = Math.max(a.invulnUntil, now + 200); z.fx({ t: 'mirage', id: a.id, x: Math.round(x0), y: Math.round(y0) });
      const iv = C.style === 'rapid' ? 40 : 80; for (let i = 0; i < n; i++) { const px = x0 + Math.cos(dir) * D * (i + 1) / n, py = y0 + Math.sin(dir) * D * (i + 1) / n;
        z.schedule(now + i * iv, () => { if (a.dead) return; if (C.style === 'timelag' || stopActive(z, a)) return plant(z, a, [[px, py]]); const t = lockOf(z, a, 260); if (!t) return; const ang = Math.atan2(t.y - py, t.x - px);
          const rel = Math.abs(((ang - t.facing + Math.PI) % TAU + TAU) % TAU - Math.PI); const flank = rel < Math.PI / 4 ? 1.2 : rel < Math.PI * 0.6 ? 1.1 : 1; // knife flying along the target's facing = from behind
          spawnProj(z, a, { spd: 14, rng: 260, sz: 3, pierce: St.pierce }, { m: e.m * lvM * St.dmg * (C.style === 'pierce' ? 1.15 : 1), knife: 1, vfx: 'silverknife', chronoSkill: 1, flank }, ang, z.now, { x: px, y: py }); }); } return; }
    case 'square': { const r = (emp ? 12 : 8) * M; useEmp(); const tx = a.x, ty = a.y; const S = { owner: a, x: tx, y: ty, r, until: now + 3000 }; (z.chronoStops ||= []).push(S);
      for (const t of z.enemiesOf(a)) if (t.kind !== 'player' && Math.hypot(t.x - tx, t.y - ty) <= r) { if (t.boss) { t.timeScaleUntil = now + 3000; t.timeScale = 1 - (t.timeResist ?? 0.8); } else { t.timeStopUntil = now + 3000; t.action = null; t.vx = t.vy = 0; } }
      z.fx({ t: 'tstop', id: a.id, x: Math.round(tx), y: Math.round(ty), r, d: 3000 }); return; }
    case 'clock': { const n = emp ? 2 : 1; useEmp(); C.clocks = [0, 1, 2].map(i => ({ i, until: now + 8000, next: now + 400 + i * 120, per: n, m: e.m * lvM, hits: [] })); z.fx({ t: 'clocks', id: a.id, d: 8000 }); return; }
    case 'doll': { const t0 = lockOf(z, a, 18 * M); const N = 40; const boost = emp ? 1.3 : 1; const hom = emp ? 0.2 : 0.12; useEmp(); z.fx({ t: 'doll', id: a.id, n: N });
      for (let i = 0; i < N; i++) z.schedule(now + 300 + i * 45, () => { if (a.dead) return; const t = (t0 && !t0.dead ? t0 : lockOf(z, a, 18 * M)); const ang0 = i * TAU / N; const from = { x: a.x + Math.cos(ang0) * 30, y: a.y + Math.sin(ang0) * 30 };
        if (C.style === 'timelag' || stopActive(z, a)) return plant(z, a, [[from.x, from.y]]); const ang = t ? Math.atan2(t.y - from.y, t.x - from.x) : ang0;
        spawnProj(z, a, { spd: 12, rng: 18 * M, sz: 3, hom, pierce: St.pierce }, { m: e.m * lvM * St.dmg * boost, knife: 1, vfx: 'silverknife', chronoSkill: 1 }, ang, z.now, from); }); return; }
  } }
function clockShot(z, a, k, now) { const C = cstate(a); const St = STYLES[C.style === 'timelag' ? C.prevStyle : C.style]; k.next = now + (C.style === 'rapid' ? 700 : 1000);
  const cx = a.x + Math.cos(k.i * TAU / 3 + now / 1500) * 28, cy = a.y + Math.sin(k.i * TAU / 3 + now / 1500) * 28; const t = lockOf(z, { ...a, x: cx, y: cy }, 12 * M);
  for (let j = 0; j < k.per; j++) { if (C.style === 'timelag' || stopActive(z, a)) { plant(z, a, [[cx + j * 6, cy]]); continue; } if (!t) continue;
    const res = C.resonance && C.resonance > now; if (res) C.resonance = 0; k.lastT = t.id;
    spawnProj(z, a, { spd: 13, rng: 12 * M, sz: 3, hom: 0.05, pierce: C.style === 'pierce' ? 2 : 0 }, { m: k.m * St.dmg * (res ? 1.2 : 1), knife: 1, vfx: 'silverknife', chronoSkill: 1 }, Math.atan2(t.y - cy, t.x - cx), now, { x: cx, y: cy }); }
  // time resonance: all three clocks aimed at the same enemy → next clock attack +20%
  const ids = (C.clocks || []).map(c => c.lastT); if (ids.length === 3 && ids[0] && ids.every(x => x === ids[0])) { C.resonance = now + 3000; for (const c of C.clocks) c.lastT = null; z.fx({ t: 'resonance', id: a.id }); } }
// time stop on the zone: enemies frozen / bosses slowed; enemy projectiles frozen inside a stop area. Players are never affected.
export function frozen(z, x, now) { return x.timeStopUntil > now; }
export function slowedSkip(z, x, now) { return x.timeScaleUntil > now && (Math.floor(now / 50) % 5) >= Math.round((x.timeScale || 0.2) * 5); }
export function projFrozen(z, p, now) { if (!z.chronoStops?.length || p.owner.team !== 'enemy') return false; return z.chronoStops.some(s => s.until > now && Math.hypot(p.x - s.x, p.y - s.y) <= s.r); }
