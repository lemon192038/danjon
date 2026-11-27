// Executes unified skill effect lists (weapon-type / unique weapon / level / job / monster abilities).
import { dealDamage, inShape, isTip } from './combat.js';
import { command } from './mechanics.js';
import { morphEff } from './morph.js';
import { chronoEff } from './chrono.js';
import { ELEMENTS } from '../../shared/constants.js';

const NEG = ['burn', 'freeze', 'shock', 'bleed', 'poison', 'stun', 'slow', 'curse', 'fear', 'bind', 'armorbreak', 'sleep', 'silence', 'stop'];

// Melee/area hit at origin with shape. Returns targets hit.
export function meleeHit(zone, a, sh, opt, now, origin) {
  const o = origin || { x: a.x, y: a.y, a: a.facing };
  if (sh.rot) o.a += sh.rot * Math.PI / 180;
  const rm = a.stats.range || 1;
  const hit = [];
  for (const t of zone.enemiesOf(a)) {
    if (opt.hitSet && opt.hitSet.has(t.id)) continue;
    if (!inShape(sh, o, t, rm)) continue;
    opt.hitSet?.add(t.id);
    dealDamage(zone, a, t, { ...opt, tip: isTip(sh, o, t), ang: Math.atan2(t.y - o.y, t.x - o.x) }, now);
    hit.push(t);
  }
  zone.fx({ t: 'sh', id: a.id, v: opt.vfx, s: sh.s, x: Math.round(o.x), y: Math.round(o.y), a: +o.a.toFixed(2), r: sh.r || 0, l: sh.l || 0, w: sh.w || 0, ar: sh.a || 0, d: sh.d || 0, e: opt.el || a.weaponEl || 'phys', k: a.visKey });
  if (opt.pull > 0 && sh.s !== 'proj') for (const t of hit) zone.push(t, (o.x - t.x) * 0.25, (o.y - t.y) * 0.25);
  return hit;
}

export function spawnProj(zone, a, sh, opt, ang, now, from) {
  if (zone.dungeon?.underwater && !sh.uw) sh = { ...sh, uw: 1, spd: (sh.spd || 8) * 0.75 }; // water resistance slows projectiles
  const n = sh.n || 1, sp = (sh.sp || 10) * Math.PI / 180;
  for (let i = 0; i < n; i++) {
    const aa = ang + (n > 1 ? (i - (n - 1) / 2) * sp : 0) + (sh.spiral ? i * Math.PI * 2 / n : 0);
    const spd = (sh.spd || 8) * 60 * (1 + (a.stats.mods.projSpd || 0));
    zone.addProj({ owner: a, x: from?.x ?? a.x, y: from?.y ?? a.y, vx: Math.cos(aa) * spd, vy: Math.sin(aa) * spd, rng: (sh.rng || 200) * (a.stats.range || 1), sz: sh.sz || 4, pierce: sh.pierce || 0, hom: sh.hom || 0, ret: !!sh.ret, bnc: sh.bnc || 0, chain: sh.chain || 0, aoe: sh.aoe || 0, curve: sh.curve || 0, wave: !!sh.wave, spiral: sh.spiral ? { cx: a.x, cy: a.y, ang: aa, r: 0 } : null, pullF: sh.pull || 0, opt: { ...opt, proj: 1 }, el: opt.el, born: now, k: a.visKey });
  }
}

function aimPoint(a, ctx, maxD = 200) {
  const tx = ctx.tx ?? a.x + Math.cos(a.facing) * 80, ty = ctx.ty ?? a.y + Math.sin(a.facing) * 80;
  const dx = tx - a.x, dy = ty - a.y, d = Math.hypot(dx, dy);
  if (d > maxD) return { x: a.x + dx / d * maxD, y: a.y + dy / d * maxD };
  return { x: tx, y: ty };
}

export function execEffects(zone, a, effs, ctx, now) {
  const lvM = ctx.lvM || 1; const skillEl = ctx.el;
  for (const e of effs) {
    const delay = e.delay || 0;
    const run = () => execOne(zone, a, e, ctx, lvM, skillEl, zone.now);
    if (delay) zone.schedule(now + delay, run); else run();
  }
}

function hitOpts(a, e, lvM, el) {
  return { vfx: e._vfx, m: (e.m || 1) * lvM, el: e.el || el || undefined, pen: e.pen, critAdd: e.critAdd, st: e.st || 2, kb: e.kb, status: e.status, ls: e.ls, exec: e.exec, vs: e.vs, mark: e.mark, consumeMark: e.consumeMark, launch: e.launch, pull: e.pull, isSkill: 1, strip: e.strip };
}

function execOne(zone, a, e, ctx, lvM, el, now) {
  if (a.dead) return;
  if (ctx.id && !e._vfx) e = { ...e, _vfx: ctx.id };
  switch (e.t) {
    case 'hit': {
      const sh = e.shape; const opt = hitOpts(a, e, lvM, el);
      if (e.goldScale && a.gold != null) opt.m *= 1 + Math.min(2, Math.log10(1 + a.gold) / 4);
      const hits = e.h || 1, iv = e.interval || 90;
      if (e.lg) zone.lunge(a, e.lg);
      for (let i = 0; i < hits; i++) {
        zone.schedule(now + i * iv, () => {
          if (a.dead) return;
          if (sh.s === 'proj') spawnProj(zone, a, sh, opt, a.facing, zone.now);
          else { const res = meleeHit(zone, a, sh, { ...opt }, zone.now); if (e.strip) for (const t of res) { t.buffs = []; t.shield = null; } afterHit(zone, a, e, res); }
        });
      }
      if (e.echo) for (let k = 1; k <= (e.echoN || 1); k++) zone.schedule(now + e.echo * k, () => sh.s !== 'proj' && meleeHit(zone, a, sh, { ...opt, m: opt.m * 0.6 }, zone.now, { x: a.x, y: a.y, a: a.facing }));
      break;
    }
    case 'dash': {
      const back = e.back ? -1 : 1; const ang = a.facing + (back < 0 ? Math.PI : 0);
      a.invulnUntil = Math.max(a.invulnUntil, now + (e.inv || 200) + (a.stats.mods.iframe || 0));
      const set = new Set(); const steps = 6;
      for (let i = 1; i <= steps; i++) zone.schedule(now + i * 25, () => {
        zone.moveActor(a, Math.cos(ang) * e.d / steps, Math.sin(ang) * e.d / steps);
        if (e.hit) meleeHit(zone, a, e.hit, { ...hitOpts(a, e, lvM, el), hitSet: set }, zone.now, { x: a.x, y: a.y, a: a.facing });
      });
      zone.fx({ t: 'dash', id: a.id, v: e._vfx });
      break;
    }
    case 'blink': {
      let p;
      if (e.toTarget) { const t = zone.nearestEnemy(a, e.d + 60); if (t) { const beh = e.back ? Math.atan2(t.y - a.y, t.x - a.x) : Math.atan2(a.y - t.y, a.x - t.x); p = { x: t.x + Math.cos(beh) * (t.r + 14), y: t.y + Math.sin(beh) * (t.r + 14) }; a.facing = Math.atan2(t.y - p.y, t.x - p.x); } }
      if (!p && e.back) { const t = zone.nearestEnemy(a, e.d); if (t) { const beh = Math.atan2(t.y - a.y, t.x - a.x); p = { x: t.x + Math.cos(beh) * (t.r + 14), y: t.y + Math.sin(beh) * (t.r + 14) }; a.facing = beh + Math.PI; } else p = { x: a.x - Math.cos(a.facing) * e.d, y: a.y - Math.sin(a.facing) * e.d }; }
      if (!p) p = aimPoint(a, ctx, e.d);
      zone.fx({ t: 'blink', x: Math.round(a.x), y: Math.round(a.y) });
      zone.teleport(a, p.x, p.y); a.invulnUntil = Math.max(a.invulnUntil, now + 150);
      break;
    }
    case 'buff': a.addBuff(e.mods, e.dur, ctx.id); zone.fx({ t: 'buff', id: a.id }); break;
    case 'shield': a.shield = { amt: a.maxHp * e.amt * lvM, until: now + e.dur }; zone.fx({ t: 'shield', id: a.id }); break;
    case 'heal': {
      const amt = e.amt * (1 + (a.stats.mods.healPower || 0)) * lvM;
      const ts = e.r ? zone.alliesOf(a).filter(t => Math.hypot(t.x - a.x, t.y - a.y) <= e.r) : [a];
      for (const t of ts) t.heal(t.maxHp * amt, zone);
      zone.fx({ t: 'heal', x: Math.round(a.x), y: Math.round(a.y), r: e.r || 20 });
      break;
    }
    case 'cleanse': for (const t of zone.alliesOf(a)) if (Math.hypot(t.x - a.x, t.y - a.y) <= (e.r || 100)) for (const s of NEG) delete t.statuses[s]; break;
    case 'counter': a.action = { type: 'counter', until: now + e.win, lockMove: true, counter: { until: now + e.win, eff: e, lvM, el } }; zone.fx({ t: 'stance', id: a.id, d: e.win }); break;
    case 'zone': {
      const p = e.at === 'self' ? { x: a.x, y: a.y } : e.at === 'front' ? { x: a.x + Math.cos(a.facing) * 40, y: a.y + Math.sin(a.facing) * 40 } : aimPoint(a, ctx, 220);
      zone.addArea({ owner: a, x: p.x, y: p.y, r: e.r * (1 + (a.stats.mods.zonePower || 0) * 0.3), until: now + e.dur, tick: e.tick, next: now + (e.trigger ? 400 : 0), opt: { ...hitOpts(a, e, lvM, el), dot: !e.trigger && !e.strike }, e, follow: e.at === 'self' && !e.trigger && !e.ally ? a : null });
      break;
    }
    case 'aura': zone.addArea({ owner: a, x: a.x, y: a.y, r: e.r, until: now + e.dur, tick: 500, next: now, opt: {}, e: { ...e, ally: 1, auraMods: e.mods }, follow: a }); break;
    case 'barrage': {
      const c = aimPoint(a, ctx, 240); const n = e.n || 5;
      for (let i = 0; i < n; i++) {
        const ang = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * (e.spread || 0);
        const x = c.x + Math.cos(ang) * rr, y = c.y + Math.sin(ang) * rr; const at = now + (e.interval || 100) * i;
        zone.schedule(at, () => zone.fx({ t: 'tele', s: 'circle', x: Math.round(x), y: Math.round(y), r: e.r, d: e.delay || 500, e: e.el || el || 'phys', ally: a.team === 'ally' ? 1 : 0, v: e._vfx }));
        zone.schedule(at + (e.delay || 500), () => { if (!a.dead || a.kind === 'monster') meleeHit(zone, a, { s: 'circle', r: e.r }, hitOpts(a, e, lvM, el), zone.now, { x, y, a: 0 }); zone.fx({ t: 'boom', x: Math.round(x), y: Math.round(y), r: e.r, e: e.el || el || 'phys', v: e._vfx }); });
      }
      break;
    }
    case 'cmd': command(zone, a, e, lvM, now); break;
    case 'morph': morphEff(zone, a, e, lvM, now); break;
    case 'chrono': chronoEff(zone, a, e, lvM, ctx, now); break;
    case 'summon': {
      const pw = (e.m || 0.4) * lvM * (1 + (a.stats.mods.summonPower || 0));
      for (let i = 0; i < (e.n || 1); i++) zone.spawnSummon(a, e.kind, e.dur, pw, e.el);
      break;
    }
    case 'enchant': {
      let elx = e.el;
      if (elx === 'cycle') elx = ELEMENTS[Math.floor(now / 3000) % 6];
      if (elx === 'best') { const t = zone.nearestEnemy(a, 300); elx = t?.el ? ({ fire: 'water', ice: 'fire', thunder: 'earth', wind: 'ice', earth: 'wind', water: 'thunder', holy: 'dark', dark: 'holy', void: 'holy' })[t.el] : (a.weaponEl || 'fire'); }
      a.enchant = { el: elx, until: now + e.dur, m: (e.m || 0.2) * (1 + (a.stats.mods.enchantPower || 0)) };
      zone.fx({ t: 'buff', id: a.id, e: elx });
      break;
    }
    case 'leap': {
      const p = aimPoint(a, ctx, e.d); const sx = a.x, sy = a.y; const T = 380;
      a.invulnUntil = Math.max(a.invulnUntil, now + T + 50); a.airUntil = now + T;
      a.action = { type: 'leap', until: now + T + 120, lockMove: true };
      // move along the path with collision so a leap can never end inside a wall
      for (let i = 1; i <= 8; i++) zone.schedule(now + i * T / 8, () => zone.moveActor(a, (p.x - sx) / 8, (p.y - sy) / 8));
      zone.fx({ t: 'tele', s: 'circle', x: Math.round(p.x), y: Math.round(p.y), r: e.r, d: T, e: el || 'phys' });
      zone.schedule(now + T, () => { const m = (1 + (a.stats.mods.leapDmg || 0)); meleeHit(zone, a, { s: 'circle', r: e.r }, { ...hitOpts(a, e, lvM * m, el), kb: 60 }, zone.now, { x: a.x, y: a.y, a: a.facing }); zone.fx({ t: 'boom', x: Math.round(a.x), y: Math.round(a.y), r: e.r, e: el || 'earth' }); zone.shake(4); });
      break;
    }
    case 'taunt': a.tauntUntil = now + e.dur; for (const t of zone.enemiesOf(a)) if (Math.hypot(t.x - a.x, t.y - a.y) < e.r) { t.forcedTarget = a.id; t.forcedUntil = now + e.dur; } zone.fx({ t: 'buff', id: a.id, e: 'fire' }); break;
  }
}
function afterHit(zone, a, e, res) {
  if (e.resetOnKill && res.some(t => t.dead) && a.cds) for (const k of Object.keys(a.cds)) a.cds[k] = 0;
  if (e.link && res.length && a.cds) for (const k of Object.keys(a.cds)) a.cds[k] -= 1500 * e.link * 3;
}
