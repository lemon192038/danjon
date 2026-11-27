// PLAYER-VS-PLAYER DUELS. Challenge → accept → a private arena; opposite teams so all weapons, skills, transformations
// and job systems work as usual; nobody dies (a duel ends at 1 HP), no item or gold is ever at stake, HP/SP are restored
// and both return to where they were. Results feed an Elo rating and a ranking. Forfeit, disconnect and time limits are
// decided by the server. Time-stop effects never affect players (see chrono.js).
import { Zone } from './zone.js';
const INVITE_MS = 30000, COUNT_MS = 3000, LIMIT_MS = 120000;
export class Pvp {
  constructor(world) { this.world = world; this.invites = new Map(); this.matches = new Map(); this.seq = 0; const F = world.events.w.flags; F.pvp ||= { ratings: {}, log: [] }; }
  get F() { return this.world.events.w.flags.pvp; }
  sess(chId) { return [...this.world.sessions.values()].find(x => x.ch?.id === chId && x.actor); }
  rating(ch) { return this.F.ratings[ch.id] ||= { r: 1500, w: 0, l: 0, name: ch.name }; }
  err(s, v) { s.send({ t: 'err', v }); }
  matchOf(s) { return s.actor?.zone?.pvp && this.matches.get(s.actor.zone.pvp.id); }
  view(s) { const ch = s.ch, a = s.actor, z = a.zone; const now = Date.now();
    const near = [...z.players].filter(p => p !== a && p.session?.ch && Math.hypot(p.x - a.x, p.y - a.y) < 400).map(p => ({ id: p.session.ch.id, name: p.session.ch.name, lv: p.session.ch.level, r: Math.round(this.rating(p.session.ch).r) }));
    const inv = [...this.invites.values()].filter(i => i.to === ch.id && i.until > now).map(i => ({ from: i.from, name: i.fromName, rounds: i.rounds }));
    const R = this.rating(ch); const top = Object.entries(this.F.ratings).sort((x, y) => y[1].r - x[1].r).slice(0, 10).map(([id, v]) => ({ name: v.name, r: Math.round(v.r), w: v.w, l: v.l, me: id === ch.id }));
    return { near, inv, me: { r: Math.round(R.r), w: R.w, l: R.l }, top, log: this.F.log.slice(0, 8), inMatch: !!this.matchOf(s), canHere: this.where(a) === null }; }
  open(s) { s.send({ t: 'open', service: 'pvp', data: this.view(s) }); }
  where(a) { const z = a.zone; if (z.kind === 'dungeon' || z.pvp || z.arena || z.kind === 'slum' || a.dead) return 'ここでは決闘できない（街かフィールドで）'; return null; }
  menu(s, m) { const ch = s.ch, now = Date.now();
    if (m.do === 'challenge') { const w = this.where(s.actor); if (w) return this.err(s, w); const t = this.sess(m.id); if (!t || t === s) return this.err(s, '相手が見つからない');
      if (t.actor.zone !== s.actor.zone || Math.hypot(t.actor.x - s.actor.x, t.actor.y - s.actor.y) > 400) return this.err(s, '相手の近くで申し込もう'); if (this.where(t.actor)) return this.err(s, '相手は今、決闘できない');
      const rounds = m.rounds === 3 ? 3 : 1; this.invites.set(ch.id + '>' + t.ch.id, { from: ch.id, fromName: ch.name, to: t.ch.id, rounds, until: now + INVITE_MS });
      t.send({ t: 'toast', v: `${ch.name}から決闘の申し込み（${rounds === 3 ? '3本勝負' : '1本勝負'}）。決闘パネルで受けるか断るか選ぼう`, cls: 'big' }); this.open(t); s.send({ t: 'toast', v: `${t.ch.name}に決闘を申し込んだ` }); return this.open(s); }
    if (m.do === 'decline') { const k = m.from + '>' + ch.id; if (this.invites.delete(k)) this.sess(m.from)?.send({ t: 'toast', v: `${ch.name}は決闘を断った` }); return this.open(s); }
    if (m.do === 'accept') { const k = m.from + '>' + ch.id; const I = this.invites.get(k); this.invites.delete(k); if (!I || I.until < now) return this.err(s, '申し込みは期限切れ'); const A = this.sess(I.from);
      if (!A || A.actor.zone !== s.actor.zone || this.where(A.actor) || this.where(s.actor)) return this.err(s, '今は決闘を始められない'); return this.start(A, s, I.rounds); }
    if (m.do === 'forfeit') { const M = this.matchOf(s); if (M) return this.finish(M, M.a === s.ch.id ? M.b : M.a, '降参'); return; }
    return this.open(s); }
  start(sa, sb, rounds) { const W = this.world; const id = 'pvp' + (++this.seq); const back = { [sa.ch.id]: this.spot(sa), [sb.ch.id]: this.spot(sb) };
    const key = 'pvp:' + id; const rz = sa.actor.zone; const city = rz.cityId || W.cityNear(rz) || 'arcelia';
    const z = new Zone(W, key, { kind: 'interior', city, bldg: { id: 'pvp_' + id, name: '決闘場', t: 'arena', size: 'L' } }); z.kind = 'arena'; z.arena = { pvp: true }; z.pvp = { id }; z.map.npcs = []; z.returnTo = rz.id; W.zones.set(key, z);
    const M = { id, key, a: sa.ch.id, b: sb.ch.id, names: { [sa.ch.id]: sa.ch.name, [sb.ch.id]: sb.ch.name }, rounds, score: { [sa.ch.id]: 0, [sb.ch.id]: 0 }, back, round: 0, z }; this.matches.set(id, M);
    this.round(M); return M; }
  spot(s) { const a = s.actor; return { zone: a.zone.id, x: a.x, y: a.y, hp: a.hp / a.maxHp, sp: a.sp / a.maxSp }; }
  round(M) { const W = this.world, z = M.z; M.round++; const c = z.tileCenter(z.map.start); const now = z.now;
    [[M.a, -1, 'pvpA'], [M.b, 1, 'pvpB']].forEach(([id, side, team]) => { const s = this.sess(id); if (!s) return; W.enterZone(s, z, { x: c.x + side * 70, y: c.y }); const a = s.actor; a.team = team + '_' + M.id; a.hp = a.maxHp; a.sp = a.maxSp; a.statuses = {}; a.buffs = []; a.recalcBuffs?.(); a.morph = null; a.flyUntil = 0; a.refreshStats();
      a.facing = side < 0 ? 0 : Math.PI; a.invulnUntil = now + COUNT_MS; a.staggerUntil = now + COUNT_MS; s.send({ t: 'toast', v: `第${M.round}戦　${COUNT_MS / 1000}秒後に開始`, cls: 'big' }); });
    for (const x of [...z.actors.values()]) if (x.kind === 'summon') z.remove(x); z.projs = []; z.areas = []; z.chronoStops = [];
    M.startAt = now + COUNT_MS; M.until = M.startAt + LIMIT_MS; M.over = false; z.fx({ t: 'pvpstart', r: M.round, at: COUNT_MS }); }
  // zone hooks
  down(z, t) { const M = this.matches.get(z.pvp.id); if (!M || M.over) { t.hp = 1; return true; } const loser = t.session?.ch.id; if (!loser) return false; t.hp = 1; t.dead = false; this.roundWon(M, loser === M.a ? M.b : M.a, '勝利'); return true; }
  tick(z, now) { const M = this.matches.get(z.pvp.id); if (!M || M.over || now < M.until) return; const pa = this.sess(M.a)?.actor, pb = this.sess(M.b)?.actor; const ra = pa ? pa.hp / pa.maxHp : 0, rb = pb ? pb.hp / pb.maxHp : 0; this.roundWon(M, ra >= rb ? M.a : M.b, '時間切れ（残り体力の多い方）'); }
  roundWon(M, winner, why) { M.over = true; M.score[winner]++; const need = M.rounds === 3 ? 2 : 1; for (const id of [M.a, M.b]) this.sess(id)?.send({ t: 'toast', v: `${M.names[winner]}が第${M.round}戦を制した（${why}）　${M.score[M.a]}-${M.score[M.b]}`, cls: 'big' });
    if (M.score[winner] >= need) return this.world.zones.get(M.key) && M.z.schedule(M.z.now + 1500, () => this.finish(M, winner, why)); M.z.schedule(M.z.now + 1800, () => this.round(M)); }
  finish(M, winner, why) { if (M.done) return; M.done = true; M.over = true; const loser = winner === M.a ? M.b : M.a; const W = this.world;
    const Rw = this.F.ratings[winner] ||= { r: 1500, w: 0, l: 0, name: M.names[winner] }, Rl = this.F.ratings[loser] ||= { r: 1500, w: 0, l: 0, name: M.names[loser] };
    const ew = 1 / (1 + 10 ** ((Rl.r - Rw.r) / 400)); const k = 24; Rw.r += k * (1 - ew); Rl.r -= k * (1 - ew); Rw.w++; Rl.l++; Rw.name = M.names[winner]; Rl.name = M.names[loser];
    this.F.log.unshift({ t: Date.now(), w: M.names[winner], l: M.names[loser], score: `${M.score[winner]}-${M.score[loser]}`, why }); this.F.log.length = Math.min(this.F.log.length, 30);
    for (const id of [M.a, M.b]) { const s = this.sess(id); if (!s) continue; const B = M.back[id]; const z = W.zones.get(B.zone) || W.zones.get('haven'); W.enterZone(s, z, { x: B.x, y: B.y }); const a = s.actor; a.hp = Math.max(1, Math.round(a.maxHp * B.hp)); a.sp = Math.round(a.maxSp * B.sp); a.invulnUntil = z.now + 1500;
      const P = s.ch.progress.pvp ||= { w: 0, l: 0 }; if (id === winner) P.w++; else P.l++; s.send({ t: 'toast', v: id === winner ? `決闘に勝利した！（${why}）` : `決闘に敗れた（${why}）。失ったものはない`, cls: 'big' }); W.sendSelf(s); }
    W.zones.delete(M.key); this.matches.delete(M.id); }
  leave(s) { for (const M of this.matches.values()) if (!M.done && (M.a === s.ch?.id || M.b === s.ch?.id)) { const winner = M.a === s.ch.id ? M.b : M.a; this.finish(M, winner, '相手の離脱'); } }
}
