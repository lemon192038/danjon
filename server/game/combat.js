import { artTrigger } from './artifacts.js';
// Hit-shape tests and the single damage pipeline used by every attacker (players, NPCs, monsters, summons).
import { ELEMENT_CHART, STATUS } from '../../shared/constants.js';
import { angDiff } from '../../shared/util.js';
import { damage as dmgFormula } from '../../shared/formulas.js';

// returns true if target circle (t.x,t.y,t.r) intersects shape at origin o={x,y,a}
export function inShape(sh, o, t, rangeMul = 1) {
  const dx = t.x - o.x, dy = t.y - o.y, d = Math.hypot(dx, dy), tr = t.r || 6;
  const ca = Math.cos(o.a), sa = Math.sin(o.a);
  const u = dx * ca + dy * sa, v = -dx * sa + dy * ca;
  switch (sh.s) {
    case 'arc': { const R = sh.r * rangeMul; if (d > R + tr) return false; if (sh.inward && d < R * 0.35) return false; if (d < tr + 4) return true; return Math.abs(angDiff(o.a, Math.atan2(dy, dx))) <= (sh.a * Math.PI / 360) + Math.asin(Math.min(1, tr / Math.max(d, 1))); }
    case 'circle': return d <= sh.r * rangeMul + tr;
    case 'slam': { const cx = o.x + ca * sh.d, cy = o.y + sa * sh.d; return Math.hypot(t.x - cx, t.y - cy) <= sh.r * rangeMul + tr; }
    case 'thrust': case 'beam': case 'chain': { const L = (sh.l || 40) * rangeMul; return u >= -tr && u <= L + tr && Math.abs(v) <= (sh.w || 10) / 2 + tr; }
    case 'whip': { const L = sh.l * rangeMul; if (d > L + tr || d < L * 0.3) return false; return Math.abs(angDiff(o.a, Math.atan2(dy, dx))) <= sh.a * Math.PI / 360 + 0.2; }
  }
  return false;
}
export const isTip = (sh, o, t) => sh.s === 'whip' && Math.hypot(t.x - o.x, t.y - o.y) > sh.l * 0.75;

const UW_EL = { fire: 0.5, water: 1.25, thunder: 1.25 };
export function elemMul(el, tgt) {
  if (!el || el === 'phys') return 1;
  let m = (tgt.el && ELEMENT_CHART[el]?.[tgt.el]) || 1;
  if (tgt.resist?.[el] != null) m *= 1 - tgt.resist[el];
  return m;
}
export function statusResist(tgt, st) { if (tgt.boss && ['stun', 'freeze', 'stop', 'sleep', 'fear'].includes(st)) return 0.75; return tgt.resist?.status || 0; }

export function applyStatus(zone, src, tgt, [st, chance, dur], now) {
  if (!STATUS[st] || tgt.dead) return false;
  const mods = src?.stats?.mods || {};
  chance = chance * (1 + (mods.statusChance || 0)) * (1 - statusResist(tgt, st));
  if (Math.random() > chance) return false;
  dur = dur * (1 + (mods.statusDur || 0)) * (tgt.boss && STATUS[st].stop ? 0.3 : 1);
  const cur = tgt.statuses[st];
  if (cur && STATUS[st].stack) { cur.stacks = Math.min(5, cur.stacks + 1); cur.until = now + dur; }
  else tgt.statuses[st] = { until: now + dur, stacks: 1, src: src?.id, pow: src?.stats?.atk || 10 };
  zone.fx({ t: 'st', id: tgt.id, s: st });
  return true;
}

// Central damage function. o: { m, el, pen, critAdd, st, kb, status, ls, exec, vs, mark, consumeMark, ang, noCounter, tip, isSkill, fixed }
export function dealDamage(zone, src, tgt, o, now) {
  if (!tgt || tgt.dead || tgt.team === src.team) return 0;
  if (zone.dungeon?.underwater && o.m && UW_EL[o.el || src.weaponEl]) o = { ...o, m: o.m * UW_EL[o.el || src.weaponEl] }; // underwater: fire fizzles, water/thunder conduct
  if (tgt.invulnUntil > now || tgt.timeStopImmune) { zone.fx({ t: 'miss', x: tgt.x, y: tgt.y }); return 0; }
  const ang = o.ang ?? Math.atan2(tgt.y - src.y, tgt.x - src.x);
  // counter / parry / guard on the defender
  const act = tgt.action;
  if (act && !o.noCounter) {
    if ((act.counter && now <= act.counter.until) && Math.abs(angDiff(tgt.facing, ang + Math.PI)) < 2.2) {
      act.counter.triggered = { src, ang }; zone.fx({ t: 'parry', x: tgt.x, y: tgt.y }); if (tgt.ch) artTrigger(tgt, 'parry'); return 0;
    }
    if (act.guard && Math.abs(angDiff(tgt.facing, ang + Math.PI)) < 1.6 && !o.unblockable) {
      o = { ...o, guarded: act.guard.dr };
      if (o.proj && act.guard.reflect) { zone.fx({ t: 'parry', x: tgt.x, y: tgt.y }); return -1; }
    }
  }
  if (tgt.stats.mods.dodge && Math.random() < tgt.stats.mods.dodge + (tgt.buffMods?.dodge || 0)) { zone.fx({ t: 'miss', x: tgt.x, y: tgt.y }); if (tgt.stats.mods.cloneOnDodge && Math.random() < tgt.stats.mods.cloneOnDodge) zone.spawnSummon(tgt, 'clone', 6000, 0.3); return 0; }
  const sm = src.stats.mods, bm = src.buffMods || {};
  let el = o.el === 'auto' ? (src.weaponEl || null) : o.el;
  if (!el && src.enchant && src.enchant.until > now) el = src.enchant.el;
  const magic = src.magic || o.magic;
  let atk = (magic ? src.stats.matk : src.stats.atk) * (1 + (bm.atk || 0) + (zone.auraAtk?.(src) || 0));
  if (o.fixed) atk = o.fixed;
  let m = o.m || 1;
  if (el && src.enchant?.until > now && src.enchant.el === el) m *= 1 + src.enchant.m;
  if (el) m *= 1 + (sm.elemDmg?.[el] || 0) + (sm.elemAll || 0) + (bm['el_' + el] || 0);
  if (o.isSkill && el) m *= 1 + (sm.spellDmg || 0) * 0.5;
  if (bm.nextHit && !o.dot) { m *= 1 + bm.nextHit; src.consumeNextHit = true; }
  if (sm.lowHpAtk && src.hp < src.maxHp * 0.35) m *= 1 + sm.lowHpAtk;
  if (sm.fullHpAtk && src.hp >= src.maxHp * 0.99) m *= 1 + sm.fullHpAtk;
  if (sm.firstStrike && tgt.hp >= tgt.maxHp * 0.99) m *= 1 + sm.firstStrike;
  if (o.finisher && sm.finisher) m *= 1 + sm.finisher;
  if (sm.backstab && Math.abs(angDiff(tgt.facing, ang)) < 1.0) m *= 1 + sm.backstab;
  if (o.exec && tgt.hp / tgt.maxHp <= o.exec.th) m *= o.exec.m * (1 + (sm.execDmg || 0));
  if (o.vs && tgt.statuses[o.vs.status]) { m *= o.vs.m; if (o.vs.consume) delete tgt.statuses[o.vs.status]; }
  if (o.consumeMark && tgt.marked > now) { m *= 1 + o.consumeMark; tgt.marked = 0; zone.fx({ t: 'markpop', x: tgt.x, y: tgt.y }); if (src.ch) artTrigger(src, 'mark'); }
  if (o.tip) m *= 1.35;
  if (o.counterHit) m *= 1 + (sm.counterDmg || 0);
  if (tgt.statuses.curse) m *= 1 + 0.2 * (1 + (src.stats.mods.curseAmp || 0));
  let critC = src.stats.crit + (o.critAdd || 0) + (bm.crit || 0);
  const crit = !o.dot && Math.random() < critC;
  if (crit) { m *= src.stats.critDmg + (bm.critDmg || 0); if (src.ch) artTrigger(src, 'crit'); }
  m *= elemMul(el, tgt);
  let def = tgt.stats.def * (tgt.statuses.armorbreak ? 0.65 : 1) * (1 + (tgt.buffMods?.def || 0));
  let dmg = dmgFormula(atk, m, def, (o.pen || 0) + (sm.pen || 0));
  dmg *= 1 - Math.min(0.85, (tgt.stats.dr || 0) + (tgt.buffMods?.dr || 0) + (o.guarded || 0));
  if (zone.diffDmgTaken && tgt.team !== 'enemy') dmg *= zone.diffDmgTaken;
  dmg = Math.max(1, Math.round(dmg * (0.92 + Math.random() * 0.16)));
  if (src.kind === 'duelist' && tgt.kind === 'player') dmg = Math.min(dmg, Math.round(tgt.maxHp * 0.35)); // duels: no single unavoidable one-shot
  if (tgt.shield && tgt.shield.until > now && tgt.shield.amt > 0) { const ab = Math.min(tgt.shield.amt, dmg); tgt.shield.amt -= ab; dmg -= ab; if (ab) zone.fx({ t: 'shield', id: tgt.id }); }
  tgt.hp -= dmg; tgt.lastHitBy = src.ownerId || src.id; tgt.lastHitAt = now; tgt.combatUntil = now + 5000;
  if (tgt.statuses.sleep) delete tgt.statuses.sleep;
  tgt.threat ||= {}; tgt.threat[src.ownerId || src.id] = (tgt.threat[src.ownerId || src.id] || 0) + dmg * (src.tauntUntil > now ? 3 : 1);
  zone.fx({ t: 'dmg', x: Math.round(tgt.x), y: Math.round(tgt.y - 10), v: dmg, c: crit ? 1 : 0, e: el || 'phys', a: tgt.team !== 'enemy' ? 1 : 0 });
  if (tgt.faction && !tgt.provoked && zone.kind === 'slum') zone.world.slum.provoked(zone, tgt, src);
  if (tgt.machina && !tgt.machina.hostile) zone.world.machina?.provoked(zone, tgt, src);
  // lifesteal
  const ls = (o.ls || 0) + (sm.ls || 0) + (bm.ls || 0);
  if (ls > 0 && !o.dot) src.heal?.(dmg * ls, zone);
  if (sm.spOnHit && !o.dot) src.sp = Math.min(src.maxSp, src.sp + sm.spOnHit);
  // thorns
  if (tgt.stats.mods.thorns && !o.dot && !o.thorns && src.statuses) dealDamage(zone, tgt, src, { fixed: dmg * tgt.stats.mods.thorns, m: 1, thorns: 1, noCounter: 1, dot: 1 }, now);
  if (o.mark) tgt.marked = now + 8000;
  // poise / stagger / knockback
  if (!o.dot) {
    const poiseDmg = (o.st || 1) * (1 + (sm.stagger || 0));
    tgt.poise -= poiseDmg;
    if (tgt.poise <= 0 && !tgt.superArmor && !tgt.action?.superArmor) { tgt.poise = tgt.maxPoise; tgt.staggerUntil = now + (tgt.boss ? 600 : 450); tgt.action = null; zone.fx({ t: 'stagger', id: tgt.id }); }
    if (o.kb && !tgt.kbImmune && !(tgt.buffMods?.kbImmune)) { const k = o.kb * (1 + (sm.kb || 0)) * (tgt.boss ? 0.2 : 1) / Math.max(1, tgt.mass || 1); zone.push(tgt, Math.cos(ang) * k, Math.sin(ang) * k); }
    if (o.pull) { const k = -o.pull * (tgt.boss ? 0.2 : 1); zone.push(tgt, Math.cos(ang) * k, Math.sin(ang) * k); }
    if (o.launch && !tgt.boss) { tgt.airUntil = now + 700; tgt.staggerUntil = Math.max(tgt.staggerUntil, now + 700); }
    if (o.status) applyStatus(zone, src, tgt, o.status, now);
    for (const s of sm.onHitStatusList || []) applyStatus(zone, src, tgt, s, now);
  }
  if (tgt.hp <= 0) zone.kill(tgt, src, now);
  return dmg;
}
