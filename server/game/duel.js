// Duel system (PHASE 7): opponents are full Fighters (same combat as players: combos, skills, dodge, specials) driven by
// a duel AI that adapts to each player's recorded fighting style (weapon type, range, dodge rate, skill use).
// It never reads future inputs: it reacts to visible windups and to statistics from past bouts only.
import { Fighter } from './actor.js';
import { Zone } from './zone.js';
import { newCharacter } from './progress.js';
import { equipBest, fillSlots } from './npc.js';
import { reachOfType } from './reach.js';
import { WT_BY_ID } from '../data.js';

export function makeDuelChar(name, wt, lv, look) {
  const ch = newCharacter('duel_' + name, name, Math.min(76, wt), look || { body: 1, skin: 1, hair: 2, hairColor: 2, outfit: 5 });
  ch.level = lv; const good = WT_BY_ID[wt].good.length ? WT_BY_ID[wt].good : ['str', 'vit']; for (let k = 0; k < (lv - 1) * 3; k++) ch.stats[good[k % good.length]] = (ch.stats[good[k % good.length]] || 0) + 1;
  ch.mastery[wt] = { lv: Math.min(100, lv + 20), xp: 0 }; equipBest(ch, wt); fillSlots(ch); return ch;
}
// per-opponent memory of a player's style (world-shared, persisted with the event engine flags)
export class DuelMemory {
  constructor(store) { this.m = store; }
  get(npc, cid) { return (this.m[npc] ||= {})[cid] ||= { fights: 0, wins: 0, losses: 0, wt: {}, melee: 0, ranged: 0, dodges: 0, skills: 0, swings: 0 }; }
  // tactics derived only from past statistics
  tactics(npc, cid) { const r = this.get(npc, cid); const n = Math.max(1, r.melee + r.ranged);
    return { fights: r.fights, rangedRatio: r.ranged / n, dodgeRate: r.dodges / Math.max(1, r.swings), skillRate: r.skills / Math.max(1, r.swings + r.skills), learn: Math.min(1, r.fights / 5) }; }
}
export function spawnDuelist(z, ch, opt = {}) {
  const f = new Fighter(ch, { kind: 'duelist', team: 'enemy', look: ch.look }); f.name = opt.display || ch.name; f.duel = { key: opt.key, hpMul: opt.hpMul || 1, aggression: opt.aggression ?? 0.6, parry: opt.parry ?? 0.25, memo: opt.memo || null, mem: { melee: 0, ranged: 0, dodges: 0, skills: 0, swings: 0 } };
  f.maxHp = Math.round(f.maxHp * (opt.hpMul || 1)); f.hp = f.maxHp; f.sp = f.maxSp = 9999; const c = z.tileCenter([z.map.w >> 1, 5]); f.x = c.x; f.y = c.y; z.add(f); return f;
}
// AI tick
export function duelTick(z, a, now) {
  const D = a.duel; const t = [...z.actors.values()].find(o => o.kind === 'player' && !o.dead); a.attackHeld = false; if (!t) { a.vx = a.vy = 0; return; }
  const dx = t.x - a.x, dy = t.y - a.y, d = Math.hypot(dx, dy) || 1; a.aimX = t.x; a.aimY = t.y; if (!a.action || a.action.until < now) a.facing = Math.atan2(dy, dx);
  const T = D.memo || { rangedRatio: 0, dodgeRate: 0, skillRate: 0, learn: 0 }; const reach = reachOfType(a.wt); const tReach = reachOfType(t.wt);
  // observe this bout (learning material for next time)
  if (t.action?.type === 'attack' && t.action.t0 === now - (now - t.action.t0) && D.lastSeen !== t.action.t0) { D.lastSeen = t.action.t0; D.mem.swings++; if (tReach.ranged) D.mem.ranged++; else D.mem.melee++; }
  if (t.dodgeAt && D.lastDodge !== t.dodgeAt) { D.lastDodge = t.dodgeAt; D.mem.dodges++; }
  if (t.action?.type === 'skillAnim' || t.action?.type === 'cast') { if (D.lastSkill !== t.action.until) { D.lastSkill = t.action.until; D.mem.skills++; } }
  if (!a.canAct(now)) { a.vx = a.vy = 0; return; }
  // react to a VISIBLE windup: the opponent's attack has started and its hit time is near → dodge or parry
  const incoming = t.action && (t.action.type === 'attack' || t.action.type === 'heavy') && t.action.hitAt > now && t.action.hitAt - now < 260 && d < tReach.reach + 30;
  if (incoming && D.react !== t.action.t0) { D.react = t.action.t0; const pParry = D.parry * (1 + T.learn * (1 - T.rangedRatio)); const pDodge = 0.35 + T.learn * 0.25;
    if (a.wt.special?.type && ['guard', 'parry', 'riposte', 'spinGuard', 'umbrellaGuard'].includes(a.wt.special.type) && Math.random() < pParry) { a.special('press', z); z.schedule(now + 300, () => a.special('release', z)); return; }
    if (Math.random() < pDodge) { const s = Math.random() < 0.5 ? 1 : -1; a.dodge(z, -dy / d * s, dx / d * s); return; } }
  // spacing: close in on ranged players (they were ranged in past bouts), keep weapon reach otherwise
  const want = reach.ranged ? Math.min(150, reach.reach * 0.7) : Math.max(24, reach.reach * 0.65) * (1 - T.rangedRatio * 0.4 * T.learn);
  const spd = 85 * a.stats.move * (1 + T.rangedRatio * 0.25 * T.learn); const mm = a.action?.lockMove && a.action.until > now ? 0 : a.action?.moveMul ?? 1;
  if (d > want + 6 || !z.los(a, t)) { const nd = z.navDir(a, t); a.vx = nd.x * spd * mm; a.vy = nd.y * spd * mm; }
  else if (d < want * 0.5 && reach.ranged) { a.vx = -dx / d * spd * mm; a.vy = -dy / d * spd * mm; }
  else { const s = (Math.floor(now / 1200) % 2 ? 1 : -1) * 0.5; a.vx = -dy / d * spd * s * mm; a.vy = dx / d * spd * s * mm; } // circle-strafe
  if (d < want + t.r + 14) {
    // vs. players that dodged a lot in the past: hold the attack a beat (feint) before committing
    if (T.dodgeRate * T.learn > 0.3 && Math.random() < 0.3) return;
    const s = a.ch.skills.slots[Math.floor(Math.random() * 4)]; if (s && Math.random() < 0.06 * (1 + D.aggression) && a.useSkill(s, z, { tx: t.x, ty: t.y }) === 'ok') return;
    if (Math.random() < 0.02 * D.aggression && a.heavy(z) === 'ok') return;
    a.attackHeld = true; a.attack(now, z);
  }
}
// private duel arena (one player vs one duelist)
export function duelArena(world, s, key, title, returnTo) {
  const z0 = s.actor.zone; const rz = world.zones.get(returnTo); const city = rz?.cityId || world.cityNear(rz) || 'arcelia'; const az = new Zone(world, key, { kind: 'interior', city, bldg: { id: 'duel_' + key, name: title, t: 'arena', size: 'L' }, door: z0.door || null });
  az.kind = 'arena'; az.returnTo = returnTo; az.arena = { duel: true }; az.map.npcs = []; world.zones.set(key, az); world.enterZone(s, az); return az;
}
