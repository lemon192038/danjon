// Gravel story events runner (PHASE 3b): host NPCs in Gravel, step progression through existing systems
// (raids, kills, deliveries, duels in a private arena, night-only talks, colosseum wins), choices with world-shared
// effects, idempotent rewards, and the services they unlock (black auction, Blackforge modification, colosseum ranking).
import { SLUM_EVENTS } from '../../shared/data/slumevents.js';
import { EVENT_BY_ID } from '../../shared/data/events.js';
import { LOOT } from '../../shared/data/slum.js';
import { ORGS } from '../../shared/data/gravel.js';
import { Zone } from './zone.js';
import { makeMonster } from './monsters.js';
import { clock } from './life.js';
import { DATA } from '../data.js';
import { addItem, addTrait } from './progress.js';
import { hash32, rng } from '../../shared/util.js';

const RID = 'gravel_under';
const night = () => { const h = clock().hour; return h >= 20 || h < 5; };
// the registry's generic stage names are replaced by the real step texts so the journal shows the actual path
for (const [id, E] of Object.entries(SLUM_EVENTS)) { const d = EVENT_BY_ID[id]; d.stages = E.steps.map(st => st.k === 'choice' ? '決断' : st.text.replace(/[「」].*$/, '').slice(0, 28) || st.k); d.outcomes = E.steps.flatMap(st => st.k === 'choice' ? st.options.map(o => o.label) : []); d.status = 'live'; }
export class SlumEvents {
  constructor(world) {
    this.world = world; const E = world.events;
    if (!E.w.ev.sl_plague) E.setWorld('sl_plague', 'active', { note: 'グレイヴェルで原因不明の咳と青い斑点が広がり始めた' });
    E.register('plague', h => { const w = E.worldOf('sl_plague'); if (w.state === 'resolved' && Date.now() - w.since > 72 * 3600000 && Math.random() < Math.min(0.5, h * 0.01)) { E.setWorld('sl_plague', 'omen', { note: 'グレイヴェルの地下水路から、また嫌な匂いがする…' }); }
      else if (w.state === 'omen' && Math.random() < Math.min(0.8, h * 0.05)) E.setWorld('sl_plague', 'active', { note: 'グレイヴェルで疫病が再び広がり始めた' });
      if (w.state === 'active') for (const k of Object.keys(LOOT)) if (LOOT[k].cat === 'consumable') { const e = world.market.m[RID][k]; e.demand = Math.min(3, e.demand + 0.02 * h); } });
  }
  // host NPCs beside their buildings in the Gravel town map
  place(z) {
    if (z.id !== 'gravel') return; const m = z.map; m.npcs ||= [];
    for (const [ev, E] of Object.entries(SLUM_EVENTS)) { const d = m.doors.find(x => x.id === E.host.near); if (!d) continue; let pos = null;
      // stand clear of every door (>= 3 tiles) so [F] talks instead of entering a building
      const clear = (x, y) => !z.blocked(x * 16 + 8, y * 16 + 8) && !z.blocked(x * 16 + 8, y * 16 + 24) && m.doors.every(o => Math.hypot(o.x - x, o.y - y) >= 3) && !m.npcs.some(n => Math.hypot(n.x - x, n.y - y) < 2);
      for (let r = 3; r < 9 && !pos; r++) for (const [dx, dy] of [[r, 2], [-r, 2], [0, r], [r, 3], [-r, 3], [r, r], [-r, r]]) { const x = d.x + dx, y = d.y + dy; if (clear(x, y)) { pos = [x, y]; break; } }
      if (pos) m.npcs.push({ service: 'sev', ev, name: E.host.name, x: pos[0], y: pos[1] }); }
  }
  view(s, ev) {
    const ch = s.ch, E = SLUM_EVENTS[ev], P = this.world.events.prog(ch, ev); const st = P && !P.done ? E.steps[P.stage] : null; const unl = this.unlocks(ch);
    const w = this.world.events.w.ev[ev];
    return { ev, name: EVENT_BY_ID[ev].name, en: EVENT_BY_ID[ev].en, host: E.host.name, started: !!P, done: !!P?.done, clears: P?.clears || 0, outcome: P?.outcome || null, stage: P?.stage ?? -1, steps: E.steps.map((x, i) => ({ k: x.k, text: x.text, done: P ? P.done || i < P.stage : false, cur: P && !P.done && i === P.stage })),
      cur: st ? { ...st, prog: P.data.prog || 0, searched: P.data.searched || 0, night: night(), options: st.options?.map(o => ({ id: o.id, label: o.label })) } : null, world: w ? { state: w.state, outcome: w.outcome } : null,
      reward: E.reward, unlocks: unl, auction: ev === 'sl_auction' && unl.auction ? this.auctionView(ch) : null, ranking: ev === 'sl_colosseum' ? this.ranking() : null, bf: ev === 'sl_blackforge' && unl.blackforgeMod ? this.bfView(ch) : null };
  }
  open(s, ev) { s.send({ t: 'open', service: 'sev', data: this.view(s, ev) }); }
  unlocks(ch) { const o = {}; for (const [id, E] of Object.entries(SLUM_EVENTS)) { const P = this.world.events.prog(ch, id); if (!P) continue; E.steps.forEach((st, i) => { if (st.unlock && (P.done || i < P.stage)) o[st.unlock] = true; }); } return o; }
  // ── step progression
  act(s, m) {
    const ch = s.ch, ev = m.ev, E = SLUM_EVENTS[ev]; if (!E) return; const err = v => s.send({ t: 'err', v }); const EV = this.world.events; const z = s.actor.zone;
    if (m.act === 'auction') return this.bid(s, m); if (m.act === 'bfmod') return this.bfMod(s, m);
    if (z.id !== 'gravel' || !z.map.npcs?.some(n => n.ev === ev && Math.hypot(n.x * 16 + 8 - s.actor.x, n.y * 16 + 8 - s.actor.y) < 60)) return err(`${E.host.name}のそばで話してください`);
    let P = EV.prog(ch, ev);
    if (m.act === 'start') { if (P && !P.done) return; const r = EV.start(s, ev); if (r.error) return err(r.error); P = EV.prog(ch, ev); P.data = {}; if (E.steps[0].k === 'night' && !night()) return this.open(s, ev); return this.open(s, ev); }
    if (!P || P.done) return this.open(s, ev); const st = E.steps[P.stage];
    switch (st.k) {
      case 'talk': return this.next(s, ev);
      case 'night': if (!night()) return err('この話は夜（20時〜5時）にしか聞けない'); return this.next(s, ev);
      case 'deliver': { const tot = ch.inventory.filter(i => i.kind === 'loot' && i.ref === st.ref).reduce((t, i) => t + i.n, 0); if (tot < st.n) return err(`${LOOT[st.ref].name}×${st.n}が必要（所持${tot}）`);
        let left = st.n; for (const i of ch.inventory.filter(x => x.kind === 'loot' && x.ref === st.ref)) { const k = Math.min(left, i.n); i.n -= k; left -= k; if (!left) break; } ch.inventory = ch.inventory.filter(i => !(i.kind === 'loot' && i.n <= 0)); return this.next(s, ev); }
      case 'fund': if (ch.gold < st.gold) return err(`${st.gold.toLocaleString()}G必要`); ch.gold -= st.gold; return this.next(s, ev);
      case 'duel': return this.duel(s, ev, st, () => this.next(s, ev));
      case 'choice': { const o = st.options.find(x => x.id === m.choice); if (!o) return; if (o.duel) return this.duel(s, ev, o.duel, () => this.choose(s, ev, o)); return this.choose(s, ev, o); }
      default: return err('まだ達成していない');
    }
  }
  next(s, ev) { const E = SLUM_EVENTS[ev], EV = this.world.events, P = EV.prog(s.ch, ev); if (P.stage + 1 >= E.steps.length) return this.finish(s, ev, null); P.data.prog = 0; P.data.searched = 0; EV.advance(s, ev, P.stage + 1); this.world.sendSelf(s); this.open(s, ev); }
  choose(s, ev, o) {
    const W = o.world || {}; const mk = this.world.market; const EV = this.world.events;
    for (const [org, v] of Object.entries(W.orgInf || {})) mk.shift(RID, org, v);
    if (W.flag) { const [k, v] = W.flag.split(':'); EV.flag(k, v); }
    if (W.resolve) EV.setWorld('sl_' + W.resolve, 'resolved', { outcome: o.label, note: `${s.ch.name}の働きで「${EVENT_BY_ID['sl_' + W.resolve].name}」が終息した：${o.effect}` });
    for (const [cat, v] of Object.entries(W.market || {})) for (const k of Object.keys(LOOT)) if (LOOT[k].cat === cat) mk.m[RID][k].demand = Math.max(0.3, mk.m[RID][k].demand + v);
    this.world.orgs.news(`【${EVENT_BY_ID[ev].name}】${s.ch.name}の選択：${o.effect}`); EV.grant(s, ev, 'choice:' + o.id, this.rew(s, o.reward || {}));
    this.finish(s, ev, o.label);
  }
  finish(s, ev, outcome) { const E = SLUM_EVENTS[ev], EV = this.world.events; if (ev === 'sl_facility') this.world.machina?.bump(40); EV.complete(s, ev, outcome); EV.grant(s, ev, 'clear', this.rew(s, E.reward)); this.world.sendSelf(s); this.open(s, ev); }
  rew(s, r) { const out = { gold: r.gold, xp: r.xp, title: r.title }; for (const [org, v] of Object.entries(r.orgRep || {})) this.world.orgs.addRep(s.ch, org, v); if (r.flag) (s.ch.progress.flags ||= {})[r.flag] = true; return out; }
  // hooks from the rest of the game
  onKill(s, m) { for (const [ev, E] of Object.entries(SLUM_EVENTS)) { const P = this.world.events.prog(s.ch, ev); if (!P || P.done) continue; const st = E.steps[P.stage]; if (st.k !== 'kill') continue;
    if ((st.faction && m.faction === st.faction) || (st.fam && m.fam === st.fam)) { P.data.prog = (P.data.prog || 0) + 1; if (P.data.prog >= st.n) this.next(s, ev); } } }
  onRaid(s, e) { if (e.rid && e.rid !== RID) return; for (const [ev, E] of Object.entries(SLUM_EVENTS)) { const P = this.world.events.prog(s.ch, ev); if (!P || P.done) continue; const st = E.steps[P.stage]; if (st.k !== 'raid') continue;
    if (e.kind === 'search' && s.actor?.zone?.inst?.rid === RID) P.data.searched = (P.data.searched || 0) + 1; if (e.kind === 'extract' && (P.data.searched || 0) >= st.n) this.next(s, ev); } }
  onArenaWin(s, city) { if (city !== 'gravel') return; const F = this.world.events.w.flags; F.colosseum ||= {}; F.colosseum[s.ch.name] = (F.colosseum[s.ch.name] || 0) + 1; const wins = F.colosseum[s.ch.name];
    if (wins >= 20) this.world.events.grant(s, 'sl_colosseum', 'champion', { title: '無名の覇者', gold: 20000 });
    const P = this.world.events.prog(s.ch, 'sl_colosseum'); if (P && !P.done && SLUM_EVENTS.sl_colosseum.steps[P.stage].k === 'wins') { P.data.prog = (P.data.prog || 0) + 1; if (P.data.prog >= SLUM_EVENTS.sl_colosseum.steps[P.stage].n) this.next(s, 'sl_colosseum'); } }
  ranking() { const F = this.world.events.w.flags.colosseum || {}; return Object.entries(F).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, wins]) => ({ name, wins })); }
  // ── duel in a private arena instance
  duel(s, ev, spec, onWin) {
    const z = s.actor.zone; const key = `duel:${s.ch.id}`; const lv = Math.max(5, s.ch.level + (spec.lv || 0));
    const az = new Zone(this.world, key, { kind: 'interior', city: 'gravel', bldg: { id: 'duel_' + ev, name: `決闘：${spec.name}`, t: 'arena', size: 'L' }, door: z.door || z.map.doors?.find(d => d.id === 'gr_colosseum') }); az.kind = 'arena'; az.returnTo = 'gravel'; az.arena = { duel: true, lv };
    az.map.npcs = []; this.world.zones.set(key, az); this.world.enterZone(s, az);
    const b = makeMonster(spec.fam, lv, 'HARD', { elite: true }); b.name = spec.name; b.maxHp = b.hp = Math.round(b.maxHp * (spec.hp || 4)); b.duelBoss = true; const c = az.tileCenter([az.map.w >> 1, 5]); b.x = c.x; b.y = c.y; b.home = [c.x, c.y]; az.add(b);
    az.duel = { ev, onWin, sid: s.ch.id }; s.send({ t: 'toast', v: `決闘：${spec.name}`, cls: 'big' });
  }
  onDuelKill(az) { const d = az.duel; if (!d || d.won) return; d.won = true; const s = this.world.sessions.get(d.sid); if (!s) return; s.send({ t: 'toast', v: '決闘に勝利した！', cls: 'big' });
    setTimeout(() => { if (s.actor?.zone === az) { const gz = this.world.zones.get('gravel'); this.world.enterZone(s, gz); } this.world.zones.delete(`duel:${s.ch.id}`); d.onWin(); }, 1800); }
  // ── black auction (unlocked by sl_auction; held at night at the Black Crow HQ)
  lots() { const d = clock().day; const r = rng(hash32('auction:' + d)); const ws = [...DATA.weapons.values()].filter(w => w.rar >= 4 && w.rar <= 5 && !w.myth);
    const w1 = ws[Math.floor(r() * ws.length)], w2 = ws[Math.floor(r() * ws.length)];
    return [{ id: `a${d}_0`, kind: 'weapon', ref: w1.id, name: w1.name, rar: w1.rar, value: Math.round(w1.price * 1.4) }, { id: `a${d}_1`, kind: 'weapon', ref: w2.id, name: w2.name, rar: w2.rar, value: Math.round(w2.price * 1.4) },
      { id: `a${d}_2`, kind: 'ticket', name: '特性変更チケット×2', value: 9000 }, { id: `a${d}_3`, kind: 'deed', name: '隠し物件の権利書', value: 7000 }].map(l => ({ ...l, min: Math.round(l.value * 0.6), npc: Math.round(l.value * (0.85 + rng(hash32(l.id))() * 0.6)) })); }
  auctionView(ch) { const tried = ch.auction?.day === clock().day ? ch.auction.tried : {}; return { open: night(), lots: this.lots().map(({ npc, ...l }) => ({ ...l, tried: !!tried[l.id], won: tried[l.id] === 'won' })) }; }
  bid(s, m) { const ch = s.ch; const err = v => s.send({ t: 'err', v }); if (!this.unlocks(ch).auction) return err('招待状がない');
    const z = s.actor.zone; if (!(z.kind === 'interior' && z.map.npcs?.some(n => n.org === 'crow'))) return err('黒鴉商会本部で開かれる'); if (!night()) return err('闇の競売会は夜（20時〜5時）だけ');
    const lot = this.lots().find(l => l.id === m.lot); const bid = Math.floor(+m.bid || 0); if (!lot) return; ch.auction = ch.auction?.day === clock().day ? ch.auction : { day: clock().day, tried: {} };
    if (ch.auction.tried[lot.id]) return err('この品には既に入札した'); if (bid < lot.min) return err(`最低入札額は${lot.min.toLocaleString()}G`); if (ch.gold < bid) return err('ゴールドが足りない');
    if (bid <= lot.npc) { ch.auction.tried[lot.id] = 'lost'; s.send({ t: 'toast', v: `競り負けた…（落札額は${lot.npc.toLocaleString()}G前後だったらしい）` }); return this.open(s, 'sl_auction'); }
    ch.gold -= bid; ch.auction.tried[lot.id] = 'won'; if (lot.kind === 'weapon') addItem(ch, { kind: 'weapon', ref: lot.ref, plus: 0 }); else if (lot.kind === 'ticket') addItem(ch, { kind: 'mat', ref: 'traitTicket', n: 2 }); else this.world.slum.addLoot(ch, { ref: 'deed', n: 1, q: 1, prov: 'unknown' });
    this.world.market.shift(RID, 'crow', 0.5); this.world.events.record(s, 'sl_auction', `闇の競売会で「${lot.name}」を${bid.toLocaleString()}Gで落札`, { clear: true }); this.world.sendSelf(s); s.send({ t: 'toast', v: `落札！ ${lot.name}` }); this.open(s, 'sl_auction'); }
  // ── Blackforge modification: carve one extra trait into a weapon (max 3)
  bfView(ch) { return { cost: 20000, parts: ch.inventory.filter(i => i.kind === 'loot' && i.ref === 'parts').reduce((t, i) => t + i.n, 0), weapons: ch.inventory.filter(i => i.kind === 'weapon').map(i => { const w = DATA.weapons.get(i.ref); return { uid: i.uid, name: w.name, rar: w.rar, traits: (i.traits || w.traits).map(t => t.name) }; }).filter(x => x.traits.length < 3) }; }
  bfMod(s, m) { const ch = s.ch; const err = v => s.send({ t: 'err', v }); if (!this.unlocks(ch).blackforgeMod) return err('グラドに腕を認められていない');
    if (!(s.actor.zone.id === 'gravel' && s.actor.zone.map.npcs.some(n => n.ev === 'sl_blackforge'))) return err('黒炉工房のグラドに頼んでください');
    const parts = ch.inventory.filter(i => i.kind === 'loot' && i.ref === 'parts').reduce((t, i) => t + i.n, 0); if (parts < 2) return err('非合法武器部品×2が必要'); if (ch.gold < 20000) return err('20,000G必要');
    const r = addTrait(ch, m.uid); if (r.error) return err(r.error); ch.gold -= 20000; let left = 2; for (const i of ch.inventory.filter(x => x.kind === 'loot' && x.ref === 'parts')) { const k = Math.min(left, i.n); i.n -= k; left -= k; if (!left) break; } ch.inventory = ch.inventory.filter(i => !(i.kind === 'loot' && i.n <= 0));
    this.world.orgs.addRep(ch, 'blackforge', 3); this.world.sendSelf(s); s.send({ t: 'toast', v: `黒炉の改造：新たな特性「${r.trait.name}」を刻んだ` }); this.open(s, 'sl_blackforge'); }
}
void ORGS;
