// PHASE 7 events built on the duel system: the Wandering Swordmaster (レイヴァン・クロイツ) and the Masquerade Tournament.
import { RAVEN, MASKED } from '../../shared/data/duels.js';
import { WEAPON_TYPES } from '../../shared/data/weaponTypes.js';
import { Actor } from './actor.js';
import { clock } from './life.js';
import { makeDuelChar, spawnDuelist, DuelMemory, duelArena } from './duel.js';
import { addItem, uid } from './progress.js';
import { hash32, rng } from '../../shared/util.js';
import { WT_BY_ID } from '../data.js';

const MASK_LOOK = { body: 1, skin: 1, hair: 5, hairColor: 9, outfit: 5 };
export class Duels {
  constructor(world) {
    this.world = world; const F = world.events.w.flags; F.duelMem ||= {}; F.raven ||= { i: 0, at: Date.now() }; this.mem = new DuelMemory(F.duelMem);
    world.events.register('raven', h => { if (h >= 1 || Date.now() - F.raven.at > 3600000) { F.raven.i = (F.raven.i + Math.max(1, Math.floor(h))) % RAVEN.route.length; F.raven.at = Date.now(); } });
  }
  // the secret guide waits in Arcelia, a few steps from the tavern door
  placeGuide(z) { if (!z) return; const m = z.map; const d = m.doors.find(x => x.id === 'w_arcelia_tavern') || m.doors[0]; m.npcs ||= [];
    for (let r = 3; r < 10; r++) for (const [dx, dy] of [[r, 2], [-r, 2], [0, r], [r, r], [-r, r]]) { const x = d.x + dx, y = d.y + dy; if (!z.blocked(x * 16 + 8, y * 16 + 8) && !z.blocked(x * 16 + 8, y * 16 + 24) && m.doors.every(o => Math.hypot(o.x - x, o.y - y) >= 3)) { m.npcs.push({ service: 'masq', name: MASKED.guide.name, x, y }); return; } } }
  ravenZone() { return RAVEN.route[this.world.events.w.flags.raven.i % RAVEN.route.length]; }
  // keep Raven materialised (as a neutral wanderer) only in his current zone, and only while someone is there
  sync() {
    const zid = this.ravenZone(); for (const [id, z] of this.world.zones) { const r = [...z.actors.values()].find(a => a.role === 'raven'); if (r && (id !== zid || !z.players.size)) z.remove(r); }
    const z = this.world.zones.get(zid); if (!z || !z.players.size || [...z.actors.values()].some(a => a.role === 'raven')) return;
    const c = z.tileCenter(z.map.start); const a = new Actor({ kind: 'slumnpc', team: 'neutral', role: 'raven', name: RAVEN.name, job: RAVEN.job, look: RAVEN.look, x: c.x + 40, y: c.y - 20, r: 6, stats: { atk: 0, matk: 0, def: 9999, crit: 0, critDmg: 1, dr: 1, mods: {}, range: 1, move: 0.6 }, maxHp: 1, hp: 1, level: 0, invulnUntil: Infinity, facing: Math.PI / 2 });
    a.wander = { cx: a.x, cy: a.y }; z.add(a);
  }
  tickWanderer(z, a, now) { if (a.role !== 'raven') return;
    const near = [...z.players].find(p => Math.hypot(p.x - a.x, p.y - a.y) < 80); if (near) { a.vx = a.vy = 0; a.facing = Math.atan2(near.y - a.y, near.x - a.x); return; } // waits for whoever approaches if (!a.next || now > a.next) { a.next = now + 2500 + Math.random() * 3000; const ang = Math.random() * 6.28; a.tx = a.wander.cx + Math.cos(ang) * 60; a.ty = a.wander.cy + Math.sin(ang) * 40; }
    const dx = (a.tx ?? a.x) - a.x, dy = (a.ty ?? a.y) - a.y, d = Math.hypot(dx, dy); if (d > 4) { a.vx = dx / d * 30; a.vy = dy / d * 30; a.facing = Math.atan2(dy, dx); } else a.vx = a.vy = 0; }
  // ── Raven
  rv(ch) { return ch.progress.raven ||= { wins: {}, losses: 0, trueWon: false }; }
  canTrue(ch) { return Object.keys(this.rv(ch).wins).length >= 3; }
  openRaven(s) { const ch = s.ch, R = this.rv(ch); const E = this.world.events; const P = E.prog(ch, 'ev_swordmaster');
    if (!P) { E.start(s, 'ev_swordmaster', { silent: true }); } const tac = this.mem.tactics('raven', ch.id);
    s.send({ t: 'open', service: 'raven', data: { name: RAVEN.name, job: RAVEN.job, weapon: RAVEN.weapon, line: (this.canTrue(ch) && !R.trueWon ? RAVEN.trueLines : RAVEN.lines)[Math.floor(Math.random() * RAVEN.lines.length) % (this.canTrue(ch) && !R.trueWon ? 1 : RAVEN.lines.length)],
      wins: Object.entries(R.wins).map(([wt, n]) => ({ wt: WT_BY_ID[wt]?.name, n })), losses: R.losses, fights: tac.fights, canTrue: this.canTrue(ch) && !R.trueWon, trueWon: R.trueWon, need: Math.max(0, 3 - Object.keys(R.wins).length), myWt: s.actor.wt.name } }); }
  ravenDuel(s, trueForm) {
    const ch = s.ch; const z = s.actor.zone; if (![...z.actors.values()].some(a => a.role === 'raven' && Math.hypot(a.x - s.actor.x, a.y - s.actor.y) < 80)) return s.send({ t: 'err', v: 'レイヴァンのそばで申し込んでください' });
    if (trueForm && !(this.canTrue(ch) && !this.rv(ch).trueWon)) return s.send({ t: 'err', v: '「まだその時ではない」' });
    const E = this.world.events; const P = E.prog(ch, 'ev_swordmaster') || (E.start(s, 'ev_swordmaster', { silent: true }), E.prog(ch, 'ev_swordmaster')); if (P.stage < 2) E.advance(s, 'ev_swordmaster', 2, { silent: true });
    const back = z.id; const az = duelArena(this.world, s, `duel:${ch.id}`, trueForm ? '無銘の極致' : `決闘：${RAVEN.name}`, back); az.returnField = back;
    const lv = Math.max(30, ch.level + (trueForm ? 15 : 8)); const dc = makeDuelChar(RAVEN.name, RAVEN.wt, lv, RAVEN.look);
    const f = spawnDuelist(az, dc, { key: 'raven', hpMul: trueForm ? 5 : 3, parry: trueForm ? 0.55 : 0.35, aggression: trueForm ? 0.95 : 0.7, memo: this.mem.tactics('raven', ch.id) });
    { const p = az.tileCenter([az.map.w >> 1, Math.round(az.map.h * 0.6)]); s.actor.x = p.x; s.actor.y = p.y; }
    az.bout = { kind: 'raven', true: trueForm, sid: ch.id, foe: f, wt: s.actor.wt.id }; s.send({ t: 'toast', v: trueForm ? '「本気で行く」' : '「始めよう」', cls: 'big' });
  }
  // ── Masquerade Tournament
  mq(ch) { return ch.progress.masq ||= { stage: 0, titles: 0, records: 0, lastDay: -1, round: 0 }; }
  openMasq(s) { const ch = s.ch, M = this.mq(ch); const E = this.world.events; if (!E.prog(ch, 'ev_masquerade')) E.start(s, 'ev_masquerade', { silent: true });
    s.send({ t: 'open', service: 'masq', data: { guide: MASKED.guide, stage: M.stage, titles: M.titles, records: M.records, todayDone: M.lastDay === clock().day, rounds: MASKED.rounds.map(r => r.name), canFace: M.titles >= 3 && M.records >= 3 && !M.faced, faced: !!M.faced, lv: ch.level, gold: ch.gold } }); }
  masqAct(s, m) {
    const ch = s.ch, M = this.mq(ch), E = this.world.events; const err = v => s.send({ t: 'err', v }); const adv = st => { const P = E.prog(ch, 'ev_masquerade'); if (P && !P.done && P.stage < st) E.advance(s, 'ev_masquerade', st, { silent: true }); };
    if (!s.actor.zone.map.npcs?.some(n => n.service === 'masq' && Math.hypot(n.x * 16 + 8 - s.actor.x, n.y * 16 + 8 - s.actor.y) < 60)) return err('仮面の案内人のそばで話してください');
    switch (m.act) {
      case 'qualify': if (ch.level < 30) return err('「…まだ早い。Lv30を越えてから来い」'); M.stage = Math.max(M.stage, 2); adv(2); s.send({ t: 'toast', v: '資格を認められ、仮面を受け取った' }); break;
      case 'register': if (M.stage < 2) return err('先に資格を示せ'); if (M.lastDay === clock().day) return err('今日の大会には既に出た（明日また来い）'); if (ch.gold < 1000) return err('参加費1,000G'); ch.gold -= 1000; M.stage = Math.max(M.stage, 3); adv(3); M.lastDay = clock().day; M.round = 0; return this.masqBout(s);
      case 'face': if (!(M.titles >= 3 && M.records >= 3) || M.faced) return err('「素顔を見せる相手ではない」'); return this.masqBout(s, true);
    }
    this.world.sendSelf(s); this.openMasq(s);
  }
  masqBout(s, face) {
    const ch = s.ch, M = this.mq(ch); const key = `masq:${ch.id}`; let az = this.world.zones.get(key);
    if (!az || az.players.size === 0) { this.world.zones.delete(key); az = duelArena(this.world, s, key, face ? '素顔の王との決闘' : '仮面の武闘祭', 'arcelia'); az.masq = true; }
    const r = rng(hash32(ch.id + ':' + clock().day + ':' + M.round)); let spec;
    if (face) spec = { display: MASKED.king.real, real: MASKED.king.real, wt: MASKED.king.wt, lvAdd: MASKED.king.lvAdd + 4, hp: 6, parry: 0.5, ag: 0.9, kind: 'face' };
    else if (M.round === 5) spec = { display: MASKED.king.name, real: MASKED.king.real, wt: MASKED.king.wt, lvAdd: MASKED.king.lvAdd, hp: 4, parry: 0.45, ag: 0.85, kind: 'king' };
    else if (M.round >= 3 && r() < 0.6) { const sp = MASKED.specials[Math.floor(r() * MASKED.specials.length)]; spec = { display: '仮面の闘士', real: sp.real, wt: sp.wt, lvAdd: sp.lvAdd, hp: 2.5, parry: 0.35, ag: 0.7, kind: 'special' }; }
    else { const wts = WEAPON_TYPES.filter(w => !w.myth); const w = wts[Math.floor(r() * wts.length)]; spec = { display: '仮面の闘士', real: `${w.name}使いの挑戦者`, wt: w.id, lvAdd: M.round - 1, hp: 1.6 + M.round * 0.2, parry: 0.2, ag: 0.6, kind: 'npc' }; }
    for (const a of [...az.actors.values()]) if (a.kind === 'duelist') az.remove(a);
    const dc = makeDuelChar(spec.display, spec.wt, Math.max(25, ch.level + spec.lvAdd), MASK_LOOK); const f = spawnDuelist(az, dc, { key: spec.kind === 'npc' ? 'masq' : 'masq_' + spec.kind, hpMul: spec.hp, parry: spec.parry, aggression: spec.ag, memo: this.mem.tactics(spec.kind === 'king' || spec.kind === 'face' ? 'maskedking' : 'masq', ch.id) });
    s.actor.hp = s.actor.maxHp; s.actor.sp = s.actor.maxSp; const p = az.tileCenter([az.map.w >> 1, Math.round(az.map.h * 0.6)]); s.actor.x = p.x; s.actor.y = p.y;
    az.bout = { kind: 'masq', face, spec, sid: ch.id, foe: f, wt: s.actor.wt.id }; s.send({ t: 'toast', v: face ? '素顔の王が剣を抜いた' : `${MASKED.rounds[M.round].name}：開始！`, cls: 'big' });
  }
  // ── outcome hooks
  onDuelistDown(z, f) {
    const b = z.bout; if (!b || b.foe !== f || b.done) return; b.done = true; const s = this.world.sessions.get(b.sid); if (!s) return; const ch = s.ch, E = this.world.events;
    this.learn(b, f, ch, false);
    if (b.kind === 'raven') { const R = this.rv(ch); R.wins[b.wt] = (R.wins[b.wt] || 0) + 1;
      E.grant(s, 'ev_swordmaster', 'firstwin', { title: '剣聖に認められし者', xp: 8000 });
      const P = E.prog(ch, 'ev_swordmaster'); if (!P.done) { if (Object.keys(R.wins).length >= 3 && P.stage < 4) E.advance(s, 'ev_swordmaster', 4); else if (P.stage < 3) E.advance(s, 'ev_swordmaster', 3, { silent: true }); }
      if (b.true) { R.trueWon = true; if (!P.done) { if (P.stage < 5) E.advance(s, 'ev_swordmaster', 5, { silent: true }); E.complete(s, 'ev_swordmaster', '勝利'); }
        E.grant(s, 'ev_swordmaster', 'true', { title: '無銘を超えし者', xp: 30000 }); if (!E.hasReward(ch, 'ev_swordmaster', 'replica')) { E.grant(s, 'ev_swordmaster', 'replica', {}); ch.inventory.push({ uid: uid(), kind: 'artifact', ref: 'artifact', name: '無銘・天断（レプリカ）', cond: 'crit', eff: 'critDmg', val: 0.32, dur: 8, stack: 1, from: ['レイヴァン・クロイツから託された写し'] }); }
        (ch.progress.flags ||= {}).swordArt = true; }
      this.leave(s, z, `${RAVEN.name}に勝利した！（${s.actor.wt.name}での勝利 ${R.wins[b.wt]}回）`); return; }
    // masquerade
    const M = this.mq(ch); if (b.spec.kind === 'special') s.send({ t: 'toast', v: `仮面が割れた――正体は「${b.spec.real}」だった`, cls: 'big' });
    if (b.face) { M.faced = true; E.complete(s, 'ev_masquerade', '優勝'); E.grant(s, 'ev_masquerade', 'face', { title: '素顔の王を超えし者', xp: 40000, gold: 50000 }); this.leave(s, z, `素顔の王「${MASKED.king.real}」に勝利した！ 闘技王への道が開かれた`); return; }
    const P = E.prog(ch, 'ev_masquerade'); const stageOf = [4, 4, 4, 5, 5, 6]; if (P && !P.done && P.stage < stageOf[M.round]) E.advance(s, 'ev_masquerade', stageOf[M.round], { silent: true });
    if (M.round >= 5) { M.titles++; M.records++; if (P && !P.done && P.stage < 7) E.advance(s, 'ev_masquerade', 7, { silent: true }); if (M.titles >= 3 && P && !P.done && P.stage < 8) E.advance(s, 'ev_masquerade', 8);
      E.grant(s, 'ev_masquerade', 'champion', { title: '仮面の武闘祭 優勝者', xp: 15000 }); ch.gold += 20000; addItem(ch, { kind: 'mat', ref: 'traitTicket', n: 1 });
      this.leave(s, z, `仮面の王を破り優勝した！（優勝${M.titles}回・正体の記録${M.records}/3）`); return; }
    M.round++; s.send({ t: 'toast', v: '勝利！ 次の試合まで少し休め', cls: 'big' }); setTimeout(() => { if (s.actor?.zone === z) this.masqBout(s); }, 3000);
  }
  onPlayerDown(z, s) { const b = z.bout; if (!b || b.done) return; b.done = true; this.learn(b, b.foe, s.ch, true); if (b.kind === 'raven') this.rv(s.ch).losses++; s.send({ t: 'toast', v: b.kind === 'raven' ? '「……悪くない。また来るといい」' : '敗退した。また挑め', cls: 'big' }); }
  learn(b, f, ch, won) { const key = b.kind === 'raven' ? 'raven' : b.spec?.kind === 'king' || b.face ? 'maskedking' : 'masq'; const r = this.mem.get(key, ch.id); const m = f.duel.mem; r.fights++; if (won) r.wins++; else r.losses++; r.wt[b.wt] = (r.wt[b.wt] || 0) + 1; for (const k of ['melee', 'ranged', 'dodges', 'skills', 'swings']) r[k] += m[k]; }
  leave(s, z, msg) { s.send({ t: 'toast', v: msg, cls: 'big' }); this.world.sendSelf(s); setTimeout(() => { if (s.actor?.zone === z) { const to = this.world.zones.get(z.returnField || z.returnTo || 'arcelia'); this.world.enterZone(s, to); } this.world.zones.delete(z.id); }, 2500); }
}
