// Actor: shared runtime entity for players, NPC adventurers, monsters and summons.
import { STATUS } from '../../shared/constants.js';
import { computeStats } from '../../shared/formulas.js';
import { WT_BY_ID, categoryOf } from '../../shared/data/weaponTypes.js';
import { DATA, dataAccess } from '../data.js';
import { meleeHit, spawnProj, execEffects } from './skillExec.js';
import { SPECIALS, onAttackHook } from './specials.js';

let NEXT_ID = 1;
export const newId = () => NEXT_ID++;

export class Actor {
  constructor(o) {
    this.id = newId(); this.x = 0; this.y = 0; this.r = 6; this.facing = 0; this.vx = 0; this.vy = 0;
    this.statuses = {}; this.buffs = []; this.buffMods = {}; this.shield = null; this.cds = {};
    this.action = null; this.invulnUntil = 0; this.staggerUntil = 0; this.poise = 10; this.maxPoise = 10; this.mass = 1;
    this.dead = false; this.team = 'enemy'; this.kind = 'monster'; this.el = null; this.resist = {};
    Object.assign(this, o);
  }
  addBuff(mods, dur, src) { this.buffs = this.buffs.filter(b => !(src && b.src === src)); this.buffs.push({ mods, until: (this.zone?.now || 0) + dur, src }); this.recalcBuffs(); }
  recalcBuffs() { const m = {}; for (const b of this.buffs) for (const [k, v] of Object.entries(b.mods)) if (typeof v === 'number') m[k] = (m[k] || 0) + v; if (this.auraMods) for (const [k, v] of Object.entries(this.auraMods)) m[k] = (m[k] || 0) + v; this.buffMods = m; }
  heal(n, zone) { if (this.dead || n <= 0) return; const h = Math.round(Math.min(n, this.maxHp - this.hp)); this.hp += h; if (h > 2) zone?.fx({ t: 'dmg', x: Math.round(this.x), y: Math.round(this.y - 10), v: h, h: 1 }); }
  get stopped() { const s = this.statuses; return !!(s.freeze || s.stun || s.stop || s.sleep); }
  canAct(now) { return !this.dead && !this.stopped && now >= this.staggerUntil && !(this.airUntil > now && this.kind === 'monster'); }
}

// Fighter = Actor driven by a character record (players & NPC adventurers).
export class Fighter extends Actor {
  constructor(ch, o) { super(o); this.ch = ch; this.comboStep = 0; this.lastAttackEnd = 0; this.refreshStats(); this.hp = this.maxHp; this.sp = this.maxSp; this.r = 6; this.maxPoise = 14; this.poise = 14; }
  refreshStats() {
    const s = computeStats(this.ch, dataAccess, this.extraMods || null);
    this.stats = s; this.wt = WT_BY_ID[s.wt]; this.weapon = s.weapon;
    const hpR = this.maxHp ? this.hp / this.maxHp : 1, spR = this.maxSp ? this.sp / this.maxSp : 1;
    this.maxHp = s.maxHp; this.maxSp = s.maxSp; if (this.hp != null) { this.hp = Math.max(1, Math.round(this.maxHp * hpR)); this.sp = Math.round(this.maxSp * spR); }
    this.weaponEl = this.weapon?.el || this.wt.elem[0] || null; this.magic = categoryOf(this.wt.id).id === 'magic';
    this.visKey = this.wt.key; this.level = this.ch.level; this.name = this.ch.name;
  }
  skillLv(id) { return this.ch.skills?.levels?.[id]?.lv || 1; }
  aspdNow() { let a = this.stats.aspd * (1 + (this.buffMods.aspd || 0)); if (this.gauge?.tempo && this.tempoUntil > this.zone.now) a *= 1 + this.gauge.tempo * this.wt.special.spd; else if (this.gauge?.tempo) this.gauge.tempo = 0; return a; }

  // ---- normal attack combo
  attack(now, zone) {
    if (!this.canAct(now) || this.statuses.fear) return false;
    if (this.action && this.action.type !== 'attack') return false;
    if (this.action?.type === 'attack') { if (now > this.action.recAt) this.action.buffered = true; return false; }
    const combo = this.altMode && this.wt.alt ? this.wt.alt : this.wt.combo;
    if (now - this.lastAttackEnd > 450) this.comboStep = 0;
    const idx = this.comboStep % combo.length, step = combo[idx];
    const sp = this.aspdNow();
    const [w, ac, rc] = step.t.map(v => v / sp);
    const act = { type: 'attack', step: idx, t0: now, hitAt: now + w, recAt: now + w + ac, until: now + w + ac + rc, moveMul: step.s === 'proj' || step.s === 'beam' ? 0.55 : 0.25, s: step.s };
    this.action = act;
    zone.fx({ t: 'atk', id: this.id, s: idx, d: Math.round(w + ac + rc), k: this.visKey, sh: step.s });
    const hits = step.h || 1, iv = ac / hits;
    for (let i = 0; i < hits; i++) zone.schedule(act.hitAt + i * iv, () => { if (this.action !== act || this.dead) return; this.doStep(zone, step, idx === combo.length - 1, i === 0); });
    zone.schedule(act.until, () => { if (this.action === act) { this.action = null; this.lastAttackEnd = zone.now; this.comboStep = idx + 1; if (act.buffered && this.attackHeld) this.attack(zone.now, zone); } });
    return true;
  }
  doStep(zone, step, last, first) {
    const now = zone.now;
    if (first && step.lg) zone.lunge(this, step.lg);
    const o = { m: step.m, st: step.st || 1, kb: step.kb, pen: step.pen, ls: step.ls, el: step.el, pull: step.pull, finisher: last };
    if (step.bleed) o.status = ['bleed', 0.35, 4000];
    if (step.stun) o.status = ['stun', 0.5, step.stun];
    if (this.statuses.burn && false) o.m *= 1;
    onAttackHook(zone, this);
    if (step.s === 'proj') {
      let sh = step;
      if (this.wt.special.type === 'boltSwap') { const md = this.boltMode || 0; sh = { ...step, pierce: md === 0 ? 3 : 0, aoe: md === 1 ? 40 : 0 }; if (md === 2) o.status = ['bind', 0.8, 1500]; }
      spawnProj(zone, this, sh, o, this.facing, now);
    } else {
      meleeHit(zone, this, step, o, now);
      if (this.demonUntil > now) meleeHit(zone, this, { s: 'circle', r: 60 }, { ...o, m: o.m * 0.4, el: 'dark' }, now);
      if (step.echo) zone.schedule(now + step.echo, () => meleeHit(zone, this, step, { ...o, m: o.m * 0.5 }, zone.now));
    }
    if (this.consumeNextHit) { this.buffs = this.buffs.filter(b => !b.mods.nextHit); this.recalcBuffs(); this.consumeNextHit = false; }
  }
  // ---- skills
  useSkill(id, zone, ctx = {}) {
    const now = zone.now; const sk = DATA.skills.get(id);
    if (!sk || sk.kind === 'passive' || !this.canAct(now) || this.statuses.silence) return 'ng';
    if (this.action && !['attack'].includes(this.action.type) && this.action.until > now) return 'busy';
    if ((this.cds[id] || 0) > now) return 'cd';
    const cost = Math.round(sk.cost * (1 - (this.buffMods.spCost || 0)));
    if (this.sp < cost) return 'sp';
    this.sp -= cost;
    const lv = this.skillLv(id); const lvM = 1 + (lv - 1) * 0.06;
    const cdr = Math.min(0.7, (this.stats.cdr || 0) + (this.buffMods.cdr || 0));
    this.cds[id] = now + sk.cd * (1 - cdr) * (1 - (lv - 1) * 0.03);
    const c = { id, lvM, el: sk.el, tx: ctx.tx ?? this.aimX, ty: ctx.ty ?? this.aimY };
    const fire = () => { if (this.dead) return; execEffects(zone, this, sk.eff, c, zone.now); };
    zone.fx({ t: 'skill', id: this.id, sid: sk.id, n: sk.name, e: sk.el || 'phys', k: sk.kind, c: sk.cast || 0 });
    if (sk.cast) { this.action = { type: 'cast', until: now + sk.cast, lockMove: true }; zone.schedule(now + sk.cast, fire); }
    else { if (!this.action || this.action.type === 'attack') this.action = { type: 'skillAnim', until: now + 220, moveMul: 0.5 }; fire(); }
    this.onSkillUsed?.(sk);
    return 'ok';
  }
  special(phase, zone) {
    const sp = this.wt.special; const h = SPECIALS[sp.type]; if (!h) return;
    const now = zone.now;
    if (phase === 'press') { if (!this.canAct(now) || (this.action && this.action.type !== 'attack' && this.action.until > now)) return; if (this.action?.type === 'attack') this.action = null; h.press?.(zone, this, sp, now); }
    else if (phase === 'hold') h.hold?.(zone, this, sp, now);
    else h.release?.(zone, this, sp, now);
  }
  dodge(zone, dx, dy) {
    const now = zone.now; if (!this.canAct(now) || (this.dodgeCd || 0) > now || this.statuses.bind) return;
    if (this.action?.lockMove && this.action.until > now) return;
    const ang = (dx || dy) ? Math.atan2(dy, dx) : this.facing;
    const D = { roll: [72, 320, 600], dash: [92, 220, 520], step: [54, 260, 380], blink: [84, 160, 700], slide: [82, 280, 520], hop: [64, 380, 560] }[this.wt.dodge] || [70, 300, 600];
    this.dodgeCd = now + D[2]; this.invulnUntil = now + D[1] + (this.stats.mods.iframe || 0); this.action = { type: 'dodge', until: now + D[1] * 0.9, lockMove: true };
    if (this.wt.dodge === 'blink') { zone.fx({ t: 'blink', x: Math.round(this.x), y: Math.round(this.y) }); zone.teleport(this, this.x + Math.cos(ang) * D[0], this.y + Math.sin(ang) * D[0]); }
    else { const n = 6; for (let i = 1; i <= n; i++) zone.schedule(now + i * D[1] / n * 0.8, () => zone.moveActor(this, Math.cos(ang) * D[0] / n, Math.sin(ang) * D[0] / n)); }
    zone.fx({ t: 'dodge', id: this.id, k: this.wt.dodge, a: +ang.toFixed(2) });
  }
}
export function statusMoveMul(a) { let m = 1; if (a.statuses.slow) m *= 1 + STATUS.slow.move; if (a.statuses.bind) m = 0; return m; }
