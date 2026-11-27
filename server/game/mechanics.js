// WEAPON IDENTITY mechanics (server-side, authoritative). Each weapon's variant carries a mechanic description (data);
// these functions apply it around the normal attack, on hits, to summons and in command skills. Effects shown on the
// client are only the result of what is decided here.
import { SUMMON_BODIES } from '../../shared/data/identity.js';
import { meleeHit, spawnProj } from './skillExec.js';
import { dealDamage, applyStatus } from './combat.js';

const mechOf = a => a.weapon?.ident?.mechanic || null;
const mine = (z, a, pre) => z.actorsList().filter(x => x.kind === 'summon' && x.ownerId === a.id && !x.dead && (!pre || String(x.sumKind).startsWith(pre)));
// stat trade-offs of the weapon's structure (and of its transformed form)
export function identityMods(a, s) { const I = a.weapon?.ident; if (!I) return; const md = { ...(I.mods || {}) }; if (a.altMode && I.mechanic?.altMods) Object.assign(md, I.mechanic.altMods);
  if (md.atk) { s.atk = Math.round(s.atk * (1 + md.atk)); s.matk = Math.round(s.matk * (1 + md.atk)); } if (md.aspd) s.aspd *= 1 + md.aspd; if (md.range) s.range = (s.range || 1) * (1 + md.range); if (md.dr) s.dr = Math.min(0.8, (s.dr || 0) + md.dr); }
// before a normal-attack step: reach, bullets, transformed combos are applied to the step shape
export function preStep(a, step) { const M = mechOf(a); if (!M) return step;
  if (M.k === 'reach' && step.s !== 'proj') return { ...step, r: step.r ? Math.round(step.r * M.mul) : step.r, l: step.l ? Math.round(step.l * M.mul) : step.l, d: step.d ? Math.round(step.d * M.mul) : step.d };
  if (M.k === 'bullet' && step.s === 'proj') return { ...step, pierce: M.pierce ?? step.pierce, spd: (step.spd || 8) * (M.spd || 1), n: M.n || step.n, sp: M.sp || step.sp, rng: Math.round((step.rng || 200) * (M.rng || 1)), aoe: M.aoe || step.aoe, hom: M.hom || step.hom, m: step.m * (M.m || 1) };
  return step; }
export function altCombo(a) { const M = mechOf(a); return M?.k === 'alt' && a.altMode ? M.combo : null; }
export function stepOpts(a, o) { const M = mechOf(a); if (!M) return o; if (M.k === 'mana') { if (a.sp >= M.cost) { a.sp -= M.cost; return { ...o, el: a.weaponEl || 'void' }; } return { ...o, m: o.m * 0.7 }; }
  if (M.k === 'bullet') return { ...o, el: M.el || o.el, status: M.status || o.status }; return o; }
// after a normal-attack step (hit = targets hit by a melee step)
export function postStep(zone, a, step, o, now, last, hit) { const M = mechOf(a); if (!M) return; const fx = (v) => zone.fx({ t: 'mech', id: a.id, v, x: Math.round(a.x), y: Math.round(a.y), a: +a.facing.toFixed(2) });
  switch (M.k) {
    case 'wave': if (last) { spawnProj(zone, a, { spd: 10, rng: M.rng, sz: 9, pierce: 9, wave: 1 }, { ...o, m: o.m * M.m / 0.6 }, a.facing, now); fx('wave'); } break;
    case 'split': for (let i = 0; i < M.n; i++) meleeHit(zone, a, { ...step, rot: (i % 2 ? 1 : -1) * M.spread * 57 * Math.ceil((i + 1) / 2) }, { ...o, m: o.m * M.m }, now); fx('split'); break;
    case 'core': if (last && a.core >= M.max) { meleeHit(zone, a, { s: 'circle', r: M.r }, { ...o, m: o.m * (1 + M.m * a.core) }, now); a.core = 0; fx('core'); } break;
    case 'deploy': if (last) { meleeHit(zone, a, M.circle ? { s: 'circle', r: M.r } : { s: 'arc', r: M.r, a: 200 }, { ...o, m: o.m * M.m }, now); fx('deploy'); } break;
    case 'link': if (last) zone.schedule(now + 180, () => { if (!a.dead) { meleeHit(zone, a, step, { ...o, m: o.m * M.m }, zone.now); fx('link'); } }); break;
    case 'orbit': { const ts = zone.enemiesOf(a).filter(t => Math.hypot(t.x - a.x, t.y - a.y) < M.r).slice(0, M.n); for (const t of ts) dealDamage(zone, a, t, { ...o, m: o.m * M.m, noCounter: true }, now); if (ts.length) fx('orbit'); break; }
    case 'melody': a.notes = (a.notes || 0) + 1; if (a.notes >= M.every) { a.notes = 0; melody(zone, a, M.kind, o, now); fx('melody:' + M.kind); } break;
    case 'spiritShot': a.shots = (a.shots || 0) + 1; if (a.shots >= M.every) { a.shots = 0; const have = mine(zone, a, 's'); if (have.length >= 3) have[0].dead = true; zone.spawnSummon(a, M.kind, 6000, 0.35, a.weaponEl); fx('spirit:' + M.kind); } break;
  }
  if (hit?.length) onHits(zone, a, step, o, now, hit); }
function onHits(zone, a, step, o, now, hit) { const M = mechOf(a); const fx = (v) => zone.fx({ t: 'mech', id: a.id, v, x: Math.round(a.x), y: Math.round(a.y), a: +a.facing.toFixed(2) });
  switch (M.k) {
    case 'core': a.core = Math.min(M.max, (a.core || 0) + 1); break;
    case 'crystal': { const t = hit[0]; zone.addArea({ owner: a, x: t.x, y: t.y, r: M.r, until: now + M.dur, tick: 500, next: now + 300, opt: { m: o.m * M.m, el: a.weaponEl || 'ice' }, e: { slow: M.slow ? 1 : 0, el: a.weaponEl || 'ice' } }); fx('crystal'); } break;
    case 'spark': { const t0 = hit[0]; const near = zone.enemiesOf(a).filter(t => !hit.includes(t) && Math.hypot(t.x - t0.x, t.y - t0.y) < 90).slice(0, M.n); for (const t of near) { dealDamage(zone, a, t, { ...o, m: o.m * M.m, el: 'thunder', noCounter: true }, now); zone.fx({ t: 'zap', x1: Math.round(t0.x), y1: Math.round(t0.y), x2: Math.round(t.x), y2: Math.round(t.y) }); } } break;
    case 'tip': case 'reach': { const far = (step.r || step.l || 40) * 0.6; for (const t of hit) { if (Math.hypot(t.x - a.x, t.y - a.y) < far) continue; if (M.stun) applyStatus(zone, a, t, ['stun', 0.6, M.stun], now); if (M.pull) zone.push(t, (a.x - t.x) * M.pull / 100, (a.y - t.y) * M.pull / 100); if (M.status) applyStatus(zone, a, t, M.status, now); if (M.tip) dealDamage(zone, a, t, { ...o, m: o.m * M.tip, noCounter: true }, now); fx('tip'); } } break;
  } }
function melody(zone, a, kind, o, now) { const allies = zone.actorsList().filter(x => !x.dead && x.team === a.team && (x.kind === 'player' || x.kind === 'npc' || x.kind === 'summon') && Math.hypot(x.x - a.x, x.y - a.y) < 140);
  if (kind === 'heal') for (const x of allies) x.heal(x.maxHp * 0.04, zone);
  if (kind === 'beat') meleeHit(zone, a, { s: 'circle', r: 60 }, { ...o, m: o.m * 0.6, kb: 40 }, now);
  if (kind === 'wind') spawnProj(zone, a, { spd: 12, rng: 260, sz: 5, pierce: 4 }, { ...o, m: o.m * 0.6, el: 'wind' }, a.facing, now);
  if (kind === 'hex') for (const t of zone.enemiesOf(a)) if (Math.hypot(t.x - a.x, t.y - a.y) < 120) applyStatus(zone, a, t, ['slow', 0.7, 2000], now);
  if (kind === 'war') for (const x of allies) x.addBuff?.({ atk: 0.1 }, 4000, 'melody_war');
  if (kind === 'ward') for (const x of allies) { x.shield = { amt: Math.max(x.shield?.amt || 0, x.maxHp * 0.05), until: now + 4000 }; } }
// ── puppets: the type special summons this weapon's puppet kind
export function puppetPress(z, a, s, now) { const M = mechOf(a); const kind = M?.k === 'puppet' ? M.kind : 'puppet'; const max = M?.k === 'puppet' ? M.max : s.max; const dur = M?.dur || s.dur;
  const have = mine(z, a, 'p').filter(x => x.sumKind !== 'puppet' || kind === 'puppet'); const n = M?.pair ? 2 : 1;
  for (let i = 0; i < n; i++) { if (have.length >= max) { const old = have.shift(); old.dead = true; z.remove(old); } const p = z.spawnSummon(a, kind, dur, s.m); if (M?.pair) p.pairId = `${a.id}:${Math.floor(now)}`; have.push(p); } }
// ── command skills (t: 'cmd')
export function command(zone, a, e, lvM, now) { const ps = mine(zone, a, 'p'); const err = v => a.session?.send({ t: 'toast', v });
  switch (e.c) {
    case 'volley': { if (!ps.length) return err('人形がいない'); const sel = ps.sort((x, y) => Math.hypot(x.x - a.x, x.y - a.y) - Math.hypot(y.x - a.x, y.y - a.y)).slice(0, e.max || 10);
      const foes = zone.enemiesOf(a).filter(t => Math.hypot(t.x - a.x, t.y - a.y) < 360);
      for (const [i, p] of sel.entries()) { const t = foes.length ? foes.reduce((b, f) => Math.hypot(f.x - p.x, f.y - p.y) < Math.hypot(b.x - p.x, b.y - p.y) ? f : b) : null; if (!t) continue;
        p.cmdUntil = now + 700; p.vx = p.vy = 0; p.facing = Math.atan2(t.y - p.y, t.x - p.x); zone.fx({ t: 'mc', id: p.id, c: 'mc_scope_summon', r: 12, d: 600 });
        zone.schedule(now + 600, () => { if (p.dead || t.dead) return; meleeHit(zone, p, { s: 'beam', l: Math.hypot(t.x - p.x, t.y - p.y) + 20, w: 10 }, { m: (e.m || 0.6) * lvM, el: p.weaponEl || 'holy', vfx: 'beam:' + p.sumKind }, zone.now); }); void i; } break; }
    case 'formation': { if (!ps.length) return err('人形がいない'); ps.forEach((p, i) => { const ang = a.facing + (i - (ps.length - 1) / 2) * 0.9; p.guardPos = { x: a.x + Math.cos(ang) * 30, y: a.y + Math.sin(ang) * 30 }; p.cmdUntil = now + e.dur; p.tauntUntil = now + e.dur; });
      a.addBuff({ dr: e.dr }, e.dur, 'formation'); break; }
    case 'swap': { if (!ps.length) return err('人形がいない'); const p = ps.reduce((b, x) => Math.hypot(x.x - a.x, x.y - a.y) > Math.hypot(b.x - a.x, b.y - a.y) ? x : b); const ax = a.x, ay = a.y; a.x = p.x; a.y = p.y; p.x = ax; p.y = ay;
      p.tauntUntil = now + 4000; p.shield = { amt: p.maxHp * 0.5, until: now + 4000 }; zone.fx({ t: 'blink', x: Math.round(ax), y: Math.round(ay) }); zone.fx({ t: 'blink', x: Math.round(a.x), y: Math.round(a.y) }); break; }
    case 'chain': { const t = zone.nearestEnemy(a, 300); if (!t || !ps.length) return err(ps.length ? '敵がいない' : '人形がいない'); let i = 0; const next = () => { const p = ps[i++]; if (!p || i > (e.max || 8) || t.dead) return; if (p.dead) return next();
        const hp0 = t.hp; p.x = t.x - Math.cos(i) * 16; p.y = t.y - Math.sin(i) * 16; meleeHit(zone, p, { s: 'arc', r: 26, a: 160 }, { m: (e.m || 0.5) * lvM, el: p.weaponEl }, zone.now); if (t.hp < hp0 || t.dead) zone.schedule(zone.now + 160, next); };
      next(); break; }
    case 'reform': for (const p of ps) { p.adapt = (p.adapt || 0) ^ 1; p.extraAspd = 0.4; p.reformUntil = now + (e.dur || 8000); } break;
    case 'slam': { const big = ps.find(p => p.sumKind === 'pCalamity'); if (!big) return err('大傀儡がいない'); meleeHit(zone, big, { s: 'circle', r: e.r || 90 }, { m: (e.m || 1) * lvM, st: 6, kb: 50, el: big.weaponEl }, now); zone.fx({ t: 'boom', x: Math.round(big.x), y: Math.round(big.y), r: e.r || 90, e: 'earth' }); break; }
    case 'coreBurst': { const st = a.core || 0; meleeHit(zone, a, { s: 'circle', r: e.r || 70 }, { m: (e.m || 0.6) * lvM * (1 + 0.25 * st), el: a.weaponEl }, now); a.core = 0; break; }
    case 'orbitStorm': { const t = zone.nearestEnemy(a, 260); if (!t) return err('敵がいない'); for (let i = 0; i < (e.n || 6); i++) zone.schedule(now + i * 90, () => { if (t.dead) return; dealDamage(zone, a, t, { m: (e.m || 0.3) * lvM, el: a.weaponEl, noCounter: true }, zone.now); zone.fx({ t: 'mech', id: a.id, v: 'orbitHit', x: Math.round(t.x + Math.cos(i * 1.05) * 20), y: Math.round(t.y + Math.sin(i * 1.05) * 20), a: i * 1.05 }); }); break; }
  } }
// ── summon AI by body (puppets and spirits). Returns true when handled.
export function summonTick(z, s, now) { const B = SUMMON_BODIES[s.sumKind]; if (!B) return false; const owner = z.actors.get(s.ownerId); const spd = 90 * (B.move || 1);
  const go = (tx, ty, k = 1) => { const d = Math.hypot(tx - s.x, ty - s.y); if (d < 6) { s.vx = s.vy = 0; return; } const nd = z.navDir(s, { x: tx, y: ty }); s.vx = nd.x * spd * k; s.vy = nd.y * spd * k; s.facing = Math.atan2(nd.y, nd.x); };
  if (s.cmdUntil > now) { if (s.guardPos) go(s.guardPos.x, s.guardPos.y); else s.vx = s.vy = 0; return true; } s.guardPos = null;
  if (B.ai === 'support') { if (owner) { go(owner.x + 14, owner.y - 12); if ((s.atkCd || 0) < now) { s.atkCd = now + B.cd; owner.heal(owner.maxHp * (B.heal || 0.02), z); z.fx({ t: 'mech', id: s.id, v: 'heal', x: Math.round(owner.x), y: Math.round(owner.y), a: 0 }); } } return true; }
  const range = B.ai === 'guard' ? 90 : 240; let t = z.nearestEnemy(s, range);
  if (B.ai === 'guard') { const ox = owner ? owner.x + Math.cos(owner.facing) * 22 : s.x, oy = owner ? owner.y + Math.sin(owner.facing) * 22 : s.y; if (!t || Math.hypot(t.x - ox, t.y - oy) > 90) { go(ox, oy); return true; } }
  if (!t) { if (owner && Math.hypot(owner.x - s.x, owner.y - s.y) > 40) go(owner.x, owner.y); else s.vx = s.vy = 0; return true; }
  const d = Math.hypot(t.x - s.x, t.y - s.y); s.facing = Math.atan2(t.y - s.y, t.x - s.x);
  const ranged = B.ai === 'ranged' || (B.ai === 'adapt' && (s.adapt ? d < 80 : d > 80)); const want = ranged ? (B.keep || 120) : (B.r || 8) + t.r + 6;
  if (ranged && d < want * 0.6) go(s.x - (t.x - s.x), s.y - (t.y - s.y)); else if (d > want) go(t.x, t.y, B.ai === 'dive' ? 1.2 : 1); else s.vx = s.vy = 0;
  const cd = B.cd / (1 + (s.reformUntil > now ? s.extraAspd || 0 : 0));
  if ((s.atkCd || 0) < now && d < (ranged ? (B.rng || 220) : want + 12)) { s.atkCd = now + cd; const m = B.m * (B.link && z.actorsList().some(x => x !== s && x.pairId && x.pairId === s.pairId && !x.dead && Math.hypot(x.x - s.x, x.y - s.y) < 60) ? 1.3 : 1); const el = B.el || s.weaponEl;
    switch (ranged ? (B.atk === 'adapt' ? 'beam' : B.atk) : B.atk === 'adapt' ? 'arc' : B.atk) {
      case 'beam': meleeHit(z, s, { s: 'beam', l: Math.min(B.rng || 220, d + 20), w: 8 }, { m, el, vfx: 'beam:' + s.sumKind }, now); break;
      case 'mark': t.marked = now + 4000; dealDamage(z, s, t, { m, el }, now); break;
      case 'quake': meleeHit(z, s, { s: 'circle', r: 50 }, { m, el, kb: 40, st: 5 }, now); z.fx({ t: 'boom', x: Math.round(s.x), y: Math.round(s.y), r: 50, e: el || 'earth' }); break;
      case 'slam': meleeHit(z, s, { s: 'slam', d: 16, r: 24 }, { m, el, kb: 30 }, now); break;
      case 'bite': meleeHit(z, s, { s: 'arc', r: 20, a: 120 }, { m, el, status: B.status }, now); break;
      case 'trail': meleeHit(z, s, { s: 'arc', r: 22, a: 140 }, { m, el: 'fire' }, now); z.addArea({ owner: s, x: s.x, y: s.y, r: 18, until: now + 2500, tick: 500, next: now + 400, opt: { m: m * 0.3, el: 'fire' }, e: { el: 'fire' } }); break;
      default: meleeHit(z, s, { s: 'arc', r: 26, a: 140 }, { m, el }, now);
    } }
  return true; }
export function onProjHit(zone, a, t, now, p) { if (!mechOf(a) || !a.weapon) return; onHits(zone, a, { s: 'proj', l: p?.rng || 200 }, p?.opt || { m: 1 }, now, [t]); }
