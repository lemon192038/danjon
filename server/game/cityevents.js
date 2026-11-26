// PHASE 6: city events runner. Hosts beside city buildings (some roam between cities), schedules on game-day cycles,
// generic steps hooked into the rest of the game (kills, floors, visits, gathering, quizzes, duels), choices with
// world-shared effects, per-period repeatable rewards, and the services some events open (festival stalls, royal auction,
// the hundred-arms festival, the midnight shop, the Drakford duelists, adventurer rank tests).
import { CITY_EVENTS as CITY_ONLY, CITY_DUNGEONS, RANK_TESTS, ADV_RANKS, DUELISTS } from '../../shared/data/cityevents.js';
import { REALM_EVENTS, REALM_LINK, REALM_DUNGEONS } from '../../shared/data/realms.js';
import { BOOKS } from '../../shared/data/library.js';
import { PLACE } from '../../shared/data/world.js';
import { SAGA_EVENTS, STORY_NPCS, RIO_PATHS, DIPLOMACY } from '../../shared/data/sagas.js';
import { equipBest, fillSlots } from './npc.js';
import { newCharacter } from './progress.js';
import { MACHINA_EVENTS, MECH_WT, MACHINA_SITES } from '../../shared/data/machina.js';
import { makeBoss } from './monsters.js';
import { EXPLORE_EVENTS, UNDER_TRADE } from '../../shared/data/explore.js';
const CITY_EVENTS = { ...CITY_ONLY, ...REALM_EVENTS, ...SAGA_EVENTS, ...MACHINA_EVENTS, ...EXPLORE_EVENTS };
const hostName = E => E.host?.name || STORY_NPCS[E.npc]?.name || '？'; // PHASE 9: realm discovery events run on the same engine
import { EVENT_BY_ID } from '../../shared/data/events.js';
import { ITEMS } from '../../shared/data/guilds.js';
import { WEAPON_TYPES } from '../../shared/data/weaponTypes.js';
import { CITIES } from '../../shared/data/cities.js';
import { Zone } from './zone.js';
import { makeMonster } from './monsters.js';
import { makeDuelChar, spawnDuelist, duelArena } from './duel.js';
import { clock } from './life.js';
import { DATA } from '../data.js';
import { addItem } from './progress.js';
import { hash32, rng } from '../../shared/util.js';

const night = () => { const h = clock().hour; return h >= 20 || h < 5; };
const STEP_NAME = { observe: '観測', dungeons: '踏破', board: '乗車', cars: '車両', mapless: '読書', sequence: '謎解き', sites: '遺跡調査', bossduel: '決戦', gossip: '聞き込み', days: '交流', meet: '面会', listen: '演奏', trade: '取引', escort: '同行', level: '力', books: '読書', event: '前提', talk: '会話', night: '夜の会話', midnight: '真夜中', fund: '資金', gather: '納品', kill: '討伐', arms: '武器種', duel: '決闘', floor: '探索', visit: '調査', quiz: '知識', spells: '魔法', rank: '昇格試験', choice: '決断' };
for (const [id, E] of Object.entries(CITY_EVENTS)) { const d = EVENT_BY_ID[id]; d.stages = E.steps.map(st => st.k === 'choice' ? '決断' : st.k === 'talk' ? '話を聞く' : (st.label || st.text || STEP_NAME[st.k]).replace(/[「」].*$/, '').slice(0, 30));
  d.outcomes = E.steps.flatMap(st => st.k === 'choice' ? st.options.map(o => o.label) : []); d.status = 'live'; d.repeat = E.repeat || 'none'; if (E.sched) d.notes = `${d.notes ? d.notes + '。' : ''}開催：${E.sched.label}`; }
const MIDNIGHT = [{ ref: 'elixir', price: 700, max: 3 }, { ref: 'luckCharm', price: 900, max: 2 }, { ref: 'xpScroll', price: 1200, max: 2 }, { ref: 'returnWing', price: 200, max: 5 }, { ref: 'traitTicket', price: 30000, max: 1 }];
const FESTIVAL = [{ ref: 'meal', price: 40, max: 10 }, { ref: 'atkTonic', price: 250, max: 3 }, { ref: 'defTonic', price: 250, max: 3 }, { ref: 'luckCharm', price: 700, max: 1 }];
export class CityEvents {
  constructor(world) {
    this.world = world; const EV = world.events; const F = EV.w.flags; F.duelists ||= {}; F.cevAuction ||= {};
    EV.register('greatfire', h => { const w = EV.worldOf('ct_great_fire'); const calm = w.state === 'dormant' || (w.state === 'resolved' && Date.now() - w.since > 48 * 3600000);
      if (calm && Math.random() < 1 - Math.pow(1 - 0.01, h)) EV.setWorld('ct_great_fire', 'active', { note: '王都アルセリアの職人街で大火災が発生した！' });
      if (w.state === 'active' && world.econ) for (const g of Object.keys(world.econ.supply.arcelia || {})) world.econ.supply.arcelia[g] = Math.max(0.35, world.econ.supply.arcelia[g] - 0.02 * h); });
  }
  place(zones) {
    for (const [ev, E] of Object.entries(CITY_EVENTS)) for (const h of E.hosts || (E.host ? [E.host] : [])) { const z = zones.get(h.city); if (!z) continue; const m = z.map; m.npcs ||= []; const d = m.doors.find(x => x.id === h.near); if (!d) continue; let pos = null;
      const clear = (x, y) => !z.blocked(x * 16 + 8, y * 16 + 8) && !z.blocked(x * 16 + 8, y * 16 + 24) && m.doors.every(o => Math.hypot(o.x - x, o.y - y) >= 3) && !m.npcs.some(n => Math.hypot(n.x - x, n.y - y) < 2);
      for (let r = 3; r < 10 && !pos; r++) for (const [dx, dy] of [[r, 2], [-r, 2], [0, r], [r, 3], [-r, 3], [r, r], [-r, r]]) { const x = d.x + dx, y = d.y + dy; if (clear(x, y)) { pos = [x, y]; break; } }
      if (pos) m.npcs.push({ service: 'cev', ev, name: hostName(E), x: pos[0], y: pos[1] }); }
  }
  // ── availability
  period(E) { const d = clock().day; return E.sched ? Math.floor((d - E.sched.on) / E.sched.every) : E.roam ? d : 0; }
  hereCity(E) { return E.roam ? E.hosts[clock().day % E.hosts.length].city : null; }
  avail(ev, zid) { const E = CITY_EVENTS[ev]; const d = clock().day;
    if (E.sched && ((d - E.sched.on) % E.sched.every + E.sched.every) % E.sched.every >= E.sched.len) return `次回の開催を待とう（${E.sched.label}）`;
    if (E.roam && zid && this.hereCity(E) !== zid) return `今日は${CITIES[this.hereCity(E)]?.name}にいるらしい`;
    if (E.nightOnly && !night()) return '扉は、ただの壁だ……（夜20時〜5時だけ開く）';
    if (E.needWorld && this.world.events.worldOf(ev).state === 'dormant') return 'まだ何も起きていない（各地の古代遺跡に異変が現れたら）';
    if (E.world && this.world.events.worldOf(ev).state !== 'active') return '今は平穏だ（火災が起きたときに力を貸してほしい）';
    return null; }
  // ── view
  view(s, ev) { const ch = s.ch, E = CITY_EVENTS[ev], EV = this.world.events, P = EV.prog(ch, ev); const st = P && !P.done ? E.steps[P.stage] : null; const z = s.actor.zone;
    const rank = E.rank ? this.rankView(ch, P) : null; const w = EV.w.ev[ev];
    return { ev, name: EVENT_BY_ID[ev].name, en: EVENT_BY_ID[ev].en, host: hostName(E), line: E.npc ? this.world.story.line(E.npc, ch) : null, where: E.npc ? CITIES[this.world.story.cityOf(E.npc)]?.name : null, closed: this.avail(ev, z.cityId || z.id), sched: E.sched?.label || null, roamCity: E.roam ? CITIES[this.hereCity(E)]?.name : null,
      started: !!P, done: !!P?.done, clears: P?.clears || 0, outcome: P?.outcome || null, repeat: E.repeat || 'none', again: !!P?.done && E.repeat && E.repeat !== 'none' && (ch.progress.cevPeriod?.[ev] ?? -1) !== this.period(E),
      steps: E.steps.map((x, i) => ({ k: x.k, text: x.text || x.label, done: P ? P.done || i < P.stage : false, cur: P && !P.done && i === P.stage })),
      cur: st ? { k: st.k, text: st.text, n: st.n, prog: st.k === 'observe' ? (P.data.obs || []).length : st.k === 'dungeons' ? (P.data.dg || []).length : st.k === 'sequence' ? (P.data.seq || []).length : st.k === 'sites' ? (P.data.sites || []).length : st.k === 'days' ? (P.data.days || []).length : st.k === 'listen' ? (P.data.heard || []).length : st.k === 'gossip' ? (P.data.talked || []).length : P.data.prog || 0, performing: E.npc ? this.world.story.performing(E.npc) : true, q: st.q, qopts: st.options && st.k === 'quiz' ? st.options : null, visited: P.data.visited || [], zones: st.zones?.length || 0, options: st.k === 'choice' ? st.options.map(o => ({ id: o.id, label: o.label })) : null, night: night(), midnight: clock().hour === 0 } : null,
      world: w ? { state: w.state, outcome: w.outcome } : null, reward: E.reward, rank, realm: E.realm ? { name: PLACE[E.realm]?.name, open: !!ch.progress.realms?.[E.realm] } : null, gate: E.gate && P && (P.done || P.stage >= E.steps.findIndex(x => x.k === 'floor')) ? E.gate : null, service: this.serviceView(s, ev) }; }
  open(s, ev) { s.send({ t: 'open', service: 'cev', data: this.view(s, ev) }); }
  near(s, ev) { const E = CITY_EVENTS[ev]; if (E.npc && this.world.story.near(s, E.npc)) return true; const P = this.world.events.prog(s.ch, ev); const st = P && !P.done ? E.steps[P.stage] : null; if ((st?.k === 'meet' || st?.at) && this.world.story.near(s, st.npc || st.at)) return true; const z = s.actor.zone; return z.map.npcs?.some(n => n.service === 'cev' && n.ev === ev && Math.hypot(n.x * 16 + 8 - s.actor.x, n.y * 16 + 8 - s.actor.y) < 70); }
  // ── actions
  act(s, m) {
    const ch = s.ch, ev = m.ev, E = CITY_EVENTS[ev]; if (!E) return; const err = v => s.send({ t: 'err', v }); const EV = this.world.events; const z = s.actor.zone;
    if (!this.near(s, ev)) return err(`${hostName(E)}のそばで話してください`);
    const closed = this.avail(ev, z.cityId || z.id); if (closed) return err(closed);
    if (m.act === 'svc') return this.service(s, ev, m);
    if (m.act === 'gate' && E.realm) { if (!ch.progress.realms?.[E.realm]) return err('まだ道は開いていない'); return this.toRealm(s, E.realm); }
    if (m.act === 'gate') { if (!E.gate || !this.canEnter(ch, E.gate)) return err('まだ入口は開いていない'); return s.send({ t: 'open', service: 'gate', data: { dungeons: [E.gate], special: true } }); }
    let P = EV.prog(ch, ev);
    if (m.act === 'start') { if (P && !P.done) return this.open(s, ev); if (P?.done && (!E.repeat || E.repeat === 'none')) return err('このイベントは達成済み');
      if (P?.done && (ch.progress.cevPeriod?.[ev] ?? -1) === this.period(E)) return err(E.sched ? '今回の開催ではもう参加した（次回の開催で）' : '今日はもう参加した');
      const r = EV.start(s, ev); if (r.error) return err(r.error); P = EV.prog(ch, ev); P.data = {}; if (ev === 'nx11') this.rio(); return this.open(s, ev); }
    if (!P || P.done) return this.open(s, ev); const st = E.steps[P.stage];
    switch (st.k) {
      case 'talk': return this.next(s, ev);
      case 'night': if (!night()) return err('この話は夜（20時〜5時）にしか聞けない'); return this.next(s, ev);
      case 'midnight': if (clock().hour !== 0) return err('鐘はまだ鳴らない（真夜中の0時台に）'); return this.next(s, ev);
      case 'fund': if (ch.gold < st.gold) return err(`${st.gold.toLocaleString()}G必要`); ch.gold -= st.gold; return this.next(s, ev);
      case 'gather': { if (!this.take(ch, st.ref, st.n)) return err(`${ITEMS[st.ref]?.name || st.ref}×${st.n}が必要`); return this.next(s, ev); }
      case 'quiz': { if ((m.choice | 0) !== st.a) { P.data.miss = (P.data.miss || 0) + 1; return err('……違うようだ。もう一度考えてみよう' + (st.hint && P.data.miss >= 1 ? `（ヒント：${st.hint}）` : '')); } return this.next(s, ev); }
      case 'days': { const d = clock().day; P.data.days ||= []; if (P.data.days.includes(d)) return err('今日はもう十分話した。また明日'); P.data.days.push(d); s.send({ t: 'toast', v: `${hostName(E)}と過ごした（${P.data.days.length}/${st.n}日）` }); if (P.data.days.length >= st.n) return this.next(s, ev); return this.open(s, ev); }
      case 'meet': if (!this.world.story.near(s, st.npc)) return err(`${STORY_NPCS[st.npc].name}のそばで`); return this.next(s, ev);
      case 'listen': { if (!this.world.story.near(s, E.npc)) return err('演奏しているところへ行こう'); if (!this.world.story.performing(E.npc)) return err('演奏は夕方（18〜22時）'); const city = this.world.story.cityOf(E.npc); P.data.heard ||= [];
        if (st.distinct ? P.data.heard.includes(city) : P.data.heard.length && P.data.heardDay === clock().day) return err(st.distinct ? 'この街の曲はもう記録した。楽士は明日別の街へ行く' : 'また後で');
        P.data.heard.push(city); P.data.heardDay = clock().day; (ch.progress.songs ||= {})[city] = 1; s.send({ t: 'toast', v: `旋律を記録した（${P.data.heard.length}/${st.n}）：${CITIES[city]?.name}の曲` }); if (P.data.heard.length >= st.n) return this.next(s, ev); return this.open(s, ev); }
      case 'level': if (ch.level < st.n) return err(`Lv${st.n}が必要（現在Lv${ch.level}）`); return this.next(s, ev);
      case 'books': { const n = BOOKS.filter(b => b.cat === st.cat && (ch.progress.books?.[b.id] || 0) >= b.pages.length).length; if (n < st.n) return err(`禁書庫の書を読み終える必要がある（${n}/${st.n}）`); return this.next(s, ev); }
      case 'event': if (!EV.isDone(ch, st.id)) return err(`イベント「${EVENT_BY_ID[st.id].name}」を達成してから`); return this.next(s, ev);
      case 'spells': { const n = Object.values(ch.spells || {}).filter(v => v.stage >= 4).length; if (n < st.n) return err(`失われた魔法を${st.n}つ習得してから（現在${n}）`); return this.next(s, ev); }
      case 'duel': case 'bossduel': return this.duel(s, ev, st);
      case 'rank': return this.rankAct(s, ev, m);
      case 'choice': { const o = st.options.find(x => x.id === m.choice); if (!o) return; return this.choose(s, ev, o); }
      default: return err('まだ達成していない');
    }
  }
  take(ch, ref, n) { const have = ch.inventory.filter(i => i.ref === ref && (i.kind === 'mat' || i.kind === 'potion')).reduce((t, i) => t + i.n, 0); if (have < n) return false; let l = n;
    for (const i of ch.inventory.filter(x => x.ref === ref && (x.kind === 'mat' || x.kind === 'potion'))) { const q = Math.min(l, i.n); i.n -= q; l -= q; } ch.inventory = ch.inventory.filter(i => !(i.ref === ref && i.n <= 0)); return true; }
  next(s, ev) { const E = CITY_EVENTS[ev], EV = this.world.events, P = EV.prog(s.ch, ev); if (P.stage + 1 >= E.steps.length) return this.finish(s, ev, null); P.data.prog = 0; P.data.visited = []; P.data.wts = []; EV.advance(s, ev, P.stage + 1); this.world.sendSelf(s); if (this.near(s, ev)) this.open(s, ev); }
  choose(s, ev, o) { const W = o.world || {}, EV = this.world.events, econ = this.world.econ;
    if (W.supply && econ.supply[W.supply.city]) for (const g of Object.keys(econ.supply[W.supply.city])) econ.supply[W.supply.city][g] = Math.max(0.35, Math.min(2.5, econ.supply[W.supply.city][g] + W.supply.v));
    if (W.flag) { const [k, v] = W.flag.split(':'); EV.flag('ct:' + k, v); }
    if (W.move) this.world.story.move(W.move.npc, W.move.city);
    if (W.machina && !this.world.machina.resolve(s, W.machina)) s.send({ t: 'toast', v: `神機の行く末は既に決まっている（${this.world.machina.M.outcome}）。あなたの選択は記録に残った` });
    const P0 = EV.prog(s.ch, ev); if (P0) P0.data.choice = o.id;
    if (o.next) { if (ev === 'nx11') this.teachRio(s, o.id); econ.addNews(`【${EVENT_BY_ID[ev].name}】${o.effect}`); return this.next(s, ev); }
    if (W.state) EV.setWorld(ev, W.state, { outcome: o.label, note: `${s.ch.name}の働きで「${EVENT_BY_ID[ev].name}」が収まった：${o.effect}` });
    econ.addNews(`【${EVENT_BY_ID[ev].name}】${s.ch.name}の選択：${o.effect}`); EV.grant(s, ev, 'choice:' + o.id, this.rew(s, o.reward || {})); this.finish(s, ev, o.label); }
  finish(s, ev, outcome) { const E = CITY_EVENTS[ev], EV = this.world.events, ch = s.ch; EV.complete(s, ev, outcome); (ch.progress.cevPeriod ||= {})[ev] = this.period(E);
    if (E.realm) this.unlockRealm(s, E.realm);
    const rep = E.repeat && E.repeat !== 'none'; EV.grant(s, ev, 'clear', this.rew(s, E.reward), { perAttempt: rep }); if (rep && E.reward.title) EV.grant(s, ev, 'title', { title: E.reward.title });
    this.world.sendSelf(s); if (this.near(s, ev)) this.open(s, ev); }
  rew(s, r) { const out = { gold: r.gold, xp: r.xp, title: r.title, items: r.items }; const ch = s.ch; if (r.flag) (ch.progress.flags ||= {})[r.flag] = true; if (r.realm) this.unlockRealm(s, r.realm); if (r.spell) (ch.spells ||= {})[r.spell] = { stage: 4 };
    if (r.art) ch.inventory.push({ uid: 'art_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), kind: 'artifact', ref: 'artifact', stack: 1, from: ['イベント報酬'], ...r.art });
    if (r.spellFrags) for (let i = 0; i < r.spellFrags; i++) this.world.spells.chestFrag(s, { floor: 60 }); return out; }
  canEnter(ch, dId) { const evId = Object.keys(CITY_EVENTS).find(k => CITY_EVENTS[k].gate === dId); const P = evId && this.world.events.prog(ch, evId); if (!P) return false; if (P.done) return true; const E = CITY_EVENTS[evId]; return P.stage >= E.steps.findIndex(x => x.k === 'floor'); }
  // ── hooks
  each(s, fn) { const EV = this.world.events; for (const [ev, E] of Object.entries(CITY_EVENTS)) { const P = EV.prog(s.ch, ev); if (!P || P.done) continue; fn(ev, E, P, E.steps[P.stage]); } }
  onKill(s, m, f) { this.each(s, (ev, E, P, st) => {
    if (st.k === 'kill' && (!st.fam || m.fam === st.fam)) { P.data.prog = (P.data.prog || 0) + 1; if (P.data.prog >= st.n) this.next(s, ev); }
    if (st.k === 'arms' && f?.wt) { P.data.wts ||= []; if (!P.data.wts.includes(f.wt.id)) { P.data.wts.push(f.wt.id); P.data.prog = P.data.wts.length; s.send({ t: 'toast', v: `五種の型：${f.wt.name}（${P.data.prog}/${st.n}）` }); } if (P.data.prog >= st.n) this.next(s, ev); }
    if (st.k === 'rank') { P.data.r ||= {}; P.data.r.kill = (P.data.r.kill || 0) + 1; }
    if (st.k === 'escort') { const p = this.world.partyOf(s.ch.id); if (p?.npcs.includes('npc_' + st.npc)) { P.data.prog = (P.data.prog || 0) + 1; if (P.data.prog % 5 === 0) { const n = this.world.npcs.byId.get('npc_' + st.npc); if (n) { n.ch.level += 1; this.world.npcs.log(n, `${s.ch.name}と戦って成長した`); } } if (P.data.prog >= st.n) this.next(s, ev); } } }); }
  onFloor(s, z, boss) { this.each(s, (ev, E, P, st) => {
    if (st.k === 'floor' && (!st.dungeon || z.dungeon?.id === st.dungeon) && (boss ? z.floor >= st.floor : z.floor > st.floor)) this.next(s, ev);
    if (st.k === 'dungeons' && z.dungeon && (boss ? z.floor >= st.floor : z.floor > st.floor)) { P.data.dg ||= []; if (!P.data.dg.includes(z.dungeon.id)) { P.data.dg.push(z.dungeon.id); s.send({ t: 'toast', v: `【${EVENT_BY_ID[ev].name}】${z.dungeon.name}の構造を記録（${P.data.dg.length}/${st.n}）` }); if (P.data.dg.length >= st.n) this.next(s, ev); } }
    if (st.k === 'rank') { P.data.r ||= {}; P.data.r.floor = Math.max(P.data.r.floor || 0, boss ? z.floor : z.floor - 1); } }); }
  onEnterZone(s, z) { this.onEnterDiplo(s, z); this.each(s, (ev, E, P, st) => { if (st.k !== 'visit' || !st.zones.includes(z.id)) return; P.data.visited ||= []; if (P.data.visited.includes(z.id)) return; P.data.visited.push(z.id);
    s.send({ t: 'toast', v: `【${EVENT_BY_ID[ev].name}】手がかりを見つけた（${P.data.visited.length}/${st.zones.length}）` }); if (P.data.visited.length >= st.zones.length) this.next(s, ev); }); }
  // ── monster duel in a private arena
  duel(s, ev, spec) { const z = s.actor.zone; const city = z.cityId || CITY_EVENTS[ev].host.city || 'arcelia'; const key = `duel:${s.ch.id}`; const lv = Math.max(5, s.ch.level + (spec.lv || 0));
    const az = new Zone(this.world, key, { kind: 'interior', city, bldg: { id: 'duel_' + ev, name: `決闘：${spec.name}`, t: 'arena', size: 'L' }, door: z.door || null }); az.kind = 'arena'; az.returnTo = z.id; az.arena = { duel: true, lv };
    az.map.npcs = []; this.world.zones.set(key, az); this.world.enterZone(s, az);
    const b = spec.boss ? makeBoss(spec.boss, lv, 'HARD', 100) : makeMonster(spec.fam, lv, 'HARD', { elite: true }); b.name = spec.name; b.maxHp = b.hp = Math.round(b.maxHp * (spec.hp || 4)); b.duelBoss = true; const c = az.tileCenter([az.map.w >> 1, 5]); b.x = c.x; b.y = c.y; b.home = [c.x, c.y]; az.add(b);
    az.duel = { ev, cev: true, sid: s.ch.id, back: z.id }; s.send({ t: 'toast', v: `決闘：${spec.name}`, cls: 'big' }); }
  onDuelKill(az) { const d = az.duel; if (!d || d.won) return; d.won = true; const s = this.world.sessions.get(d.sid); if (!s) return; s.send({ t: 'toast', v: '決闘に勝利した！', cls: 'big' });
    setTimeout(() => { if (s.actor?.zone === az) this.world.enterZone(s, this.world.zones.get(d.back) || this.world.zones.get('arcelia')); this.world.zones.delete(az.id); if (d.ev === 'nx20') return this.world.society.onRouteDuel(s); const P = this.world.events.prog(s.ch, d.ev); if (P && !P.done && ['duel', 'bossduel'].includes(CITY_EVENTS[d.ev].steps[P.stage].k)) this.next(s, d.ev); }, 1800); }
  // ── adventurer rank (F → S)
  rankView(ch, P) { const r = ch.progress.advRank || 0; const t = RANK_TESTS[r]; const d = P && !P.done ? P.data.r || {} : {}; return { rank: ADV_RANKS[r], next: ADV_RANKS[r + 1] || null, test: t ? { kill: t.kill, floor: t.floor, gather: { name: ITEMS[t.gather.ref]?.name, n: t.gather.n }, q: t.q.q, options: t.q.options, have: { kill: d.kill || 0, floor: d.floor || 0, quiz: !!d.quiz } } : null }; }
  rankAct(s, ev, m) { const ch = s.ch, P = this.world.events.prog(ch, ev), err = v => s.send({ t: 'err', v }); const r = ch.progress.advRank || 0; const t = RANK_TESTS[r]; if (!t) return err('あなたは既にSランクだ'); P.data.r ||= {};
    if (m.quiz != null) { if ((m.quiz | 0) !== t.q.a) return err('知識試験：不正解。もう一度'); P.data.r.quiz = true; s.send({ t: 'toast', v: '知識試験：合格' }); return this.open(s, ev); }
    if ((P.data.r.kill || 0) < t.kill) return err(`戦闘試験：魔物を${t.kill}体倒す（${P.data.r.kill || 0}）`); if ((P.data.r.floor || 0) < t.floor) return err(`探索試験：ダンジョンで${t.floor}階に到達（${P.data.r.floor || 0}）`);
    if (!P.data.r.quiz) return err('知識試験に答えていない'); if (!this.take(ch, t.gather.ref, t.gather.n)) return err(`採集試験：${ITEMS[t.gather.ref]?.name}×${t.gather.n}を納品`);
    ch.progress.advRank = r + 1; const R = ADV_RANKS[r + 1]; this.world.events.grant(s, ev, 'rank:' + R, { title: `${R}ランク冒険者`, gold: 1000 * (r + 1), xp: 3000 * (r + 1) }); s.send({ t: 'toast', v: `冒険者ランクが${R}に昇格した！`, cls: 'big' }); this.finish(s, ev, null); }
  // ── services
  serviceView(s, ev) { const E = CITY_EVENTS[ev], ch = s.ch; if (!E.service) return null; const day = clock().day; const bought = ch.progress.cevBuy?.day === day ? ch.progress.cevBuy.n : {};
    const P = this.world.events.prog(ch, ev); const okP = P && (P.done || P.stage > 1) && (ch.progress.cevPeriod?.[ev] === this.period(E) || !P.done);
    switch (E.service) {
      case 'festival': return { kind: 'shop', title: '祭りの屋台（祭典の間だけ）', items: FESTIVAL.map(x => ({ ...x, name: ITEMS[x.ref].name, left: x.max - (bought[ev + x.ref] || 0) })) };
      case 'midnight': return { kind: 'shop', title: '夜鳴き商人の品（1日の数量限定）', items: MIDNIGHT.map(x => ({ ...x, name: ITEMS[x.ref].name, left: x.max - (bought[ev + x.ref] || 0) })) };
      case 'auction': return { kind: 'auction', title: '本日の出品目録', ok: okP, lots: this.lots().map(({ npc, ...l }) => ({ ...l, state: this.world.events.w.flags.cevAuction[l.id]?.[ch.id] || null })) };
      case 'arms': return { kind: 'arms', title: '正式86武器種の展示・試用・製作', tried: Object.keys(ch.progress.armsTried || {}).map(Number), types: WEAPON_TYPES.map(w => ({ id: w.id, name: w.name, cat: w.cat || '', myth: !!w.myth })) };
      case 'hero': { const P2 = this.world.events.prog(ch, 'nx07'); if (!P2?.done) return null; return { kind: 'hero', trained: !!this.world.events.hasReward(ch, 'nx07', 'tech'), crafted: !!this.world.events.hasReward(ch, 'nx07', 'recipe') }; }
      case 'trader': return { kind: 'trader', where: CITIES[this.world.story.cityOf('noah')]?.name, trades: ch.progress.noahTrades || 0, stock: this.traderStock(ch) };
      case 'apprentice': { const n = this.world.npcs.byId.get('npc_rio'); return n ? { kind: 'apprentice', lv: n.ch.level, path: this.world.events.w.flags.rioPath || null, bond: n.bond[ch.id] || 0, state: n.state, inParty: n.partyWith === ch.id } : null; }
      case 'mapless': { const P2 = this.world.events.prog(ch, 'nx13'); return { kind: 'mapless', open: !!P2 && (P2.done || P2.stage >= 5) }; }
      case 'undertrade': return { kind: 'undertrade', open: this.world.events.flag('ct:under') === 'trade', list: UNDER_TRADE.map((t, i) => ({ i, give: ITEMS[t.give].name, n: t.n, get: ITEMS[t.get].name, m: t.m })) };
      case 'train': { const T2 = ch.progress.train; return { kind: 'train', rides: T2?.rides || 0, stops: T2?.stops || [], seen: this.world.events.w.flags.train.seen.length }; }
      case 'alchemy': { const P2 = this.world.events.prog(ch, 'nx16'); return P2?.done ? { kind: 'alchemy', have: ch.inventory.filter(i => i.ref === 'witherbloom').reduce((t, i) => t + i.n, 0) } : null; }
      case 'workshop': { const M = this.world.machina.M; return { kind: 'workshop', outcome: M.outcome, state: this.world.machina.state(), need: M.outcome === 'controlled' ? 4 : 6, parts: ch.inventory.filter(i => i.ref === 'machinePart').reduce((t, i) => t + i.n, 0), types: MECH_WT.map(id => ({ id, name: WEAPON_TYPES.find(w => w.id === id)?.name })), sites: Object.entries(MACHINA_SITES).map(([f, S]) => ({ name: S.name, field: f, role: ch.progress.machina?.[f] || null })) }; }
      case 'diplomacy': { const P2 = this.world.events.prog(ch, 'nx12'); if (!P2?.done) return null; const d = ch.progress.diplo; return { kind: 'diplomacy', task: d && !d.done ? { to: CITIES[d.to]?.name, picked: !!d.picked } : null, count: ch.progress.diploCount || 0 }; }
      case 'duelists': { const F = this.world.events.w.flags.duelists; const today = DUELISTS[day % DUELISTS.length].id; return { kind: 'duelists', today, list: DUELISTS.map(d => { const g = F[d.id] || { w: 0, l: 0, rep: d.rep }; const me = ch.progress.duelRec?.[d.id] || { w: 0, l: 0 }; return { id: d.id, name: d.name, wt: DATA.weapons && WEAPON_TYPES.find(w => w.id === d.wt)?.name, pers: d.pers, rep: Math.round(g.rep ?? d.rep), rec: `${g.w}勝${g.l}敗`, me: `${me.w}勝${me.l}敗` }; }) }; }
    } return null; }
  service(s, ev, m) { const E = CITY_EVENTS[ev], ch = s.ch, err = v => s.send({ t: 'err', v }); const day = clock().day;
    if (E.service === 'festival' || E.service === 'midnight') { const list = E.service === 'festival' ? FESTIVAL : MIDNIGHT; const it = list.find(x => x.ref === m.ref); if (!it) return; ch.progress.cevBuy = ch.progress.cevBuy?.day === day ? ch.progress.cevBuy : { day, n: {} };
      const k = ev + it.ref; if ((ch.progress.cevBuy.n[k] || 0) >= it.max) return err('今日は売り切れ'); if (ch.gold < it.price) return err('ゴールドが足りない'); ch.gold -= it.price; ch.progress.cevBuy.n[k] = (ch.progress.cevBuy.n[k] || 0) + 1;
      addItem(ch, { kind: ITEMS[it.ref].use || it.ref === 'hp' || it.ref === 'sp' ? 'potion' : 'mat', ref: it.ref, n: 1 }); this.world.events.log(ch, ev, `${ITEMS[it.ref].name}を購入`); }
    else if (E.service === 'auction') return this.bid(s, ev, m);
    else if (E.service === 'arms') { const wt = WEAPON_TYPES.find(w => w.id === (m.wt | 0)); if (!wt) return; const pool = (DATA.wtWeapons.get(wt.id) || []).filter(w => !w.myth).sort((a, b) => a.rar - b.rar || a.lvl - b.lvl); if (!pool.length) return err('この武器種は展示のみ');
      if (m.mode === 'try') { ch.progress.armsTried ||= {}; if (ch.progress.armsTried[wt.id]) return err('この武器種は試用済み'); ch.progress.armsTried[wt.id] = 1; addItem(ch, { kind: 'weapon', ref: pool[0].id, plus: 0 }); s.send({ t: 'toast', v: `試用品「${pool[0].name}」を受け取った（${wt.name}）` }); }
      else if (m.mode === 'craft') { if (ch.gold < 3000 || !this.take(ch, 'ore', 3)) return err('製作には強化鉱石×3と3,000G'); ch.gold -= 3000; const cand = pool.filter(w => w.rar <= 3); const w = cand[Math.floor(Math.random() * cand.length)] || pool[0]; addItem(ch, { kind: 'weapon', ref: w.id, plus: 0 }); s.send({ t: 'toast', v: `「${w.name}」を製作した` }); } }
    else if (E.service === 'duelists') return this.duelist(s, ev, m.id);
    else if (E.service === 'hero') return this.heroSvc(s, m);
    else if (E.service === 'trader') return this.traderBuy(s, m);
    else if (E.service === 'apprentice') return this.rioSvc(s, m);
    else if (E.service === 'diplomacy') return this.diploSvc(s, m);
    else if (E.service === 'mapless') return this.world.explore.enterMapless(s);
    else if (E.service === 'undertrade') { this.world.explore.underTrade(s, { i: m.wt ?? m.i }); return this.open(s, ev); }
    else if (E.service === 'alchemy') { if (!this.world.events.isDone(ch, 'nx16')) return err('巨木の研究を終えてから'); if (!this.take(ch, 'witherbloom', 2) || !this.take(ch, 'herb', 2)) return err('枯れ木の花×2と薬草×2が必要'); addItem(ch, { kind: 'potion', ref: 'elixir', n: 2 }); s.send({ t: 'toast', v: '新しい錬金レシピでエリクサーを2つ作った' }); this.world.sendSelf(s); return this.open(s, ev); }
    else if (E.service === 'workshop') { this.world.machina.workshop(s, m); this.world.sendSelf(s); return this.open(s, ev); }
    this.world.sendSelf(s); this.open(s, ev); }
  lots() { const d = clock().day; const r = rng(hash32('royal:' + d)); const ws = [...DATA.weapons.values()].filter(w => w.rar === 5 && !w.myth); const w = ws[Math.floor(r() * ws.length)];
    return [{ id: `r${d}_w`, kind: 'weapon', ref: w.id, name: w.name, value: Math.round(w.price * 1.5) }, { id: `r${d}_m`, kind: 'mat', ref: 'abyssShard', n: 2, name: '深淵の欠片×2', value: 6000 },
      { id: `r${d}_r`, kind: 'mat', ref: 'relic', n: 4, name: '遺物の欠片×4', value: 2400 }, { id: `r${d}_i`, kind: 'info', name: '情報：王都地下の古い封印', value: 3000 }].map(l => ({ ...l, min: Math.round(l.value * 0.6), npc: Math.round(l.value * (0.85 + rng(hash32(l.id))() * 0.6)) })); }
  bid(s, ev, m) { const ch = s.ch, err = v => s.send({ t: 'err', v }); const P = this.world.events.prog(ch, ev); if (!P || !(P.done ? ch.progress.cevPeriod?.[ev] === this.period(CITY_EVENTS[ev]) : P.stage >= 2)) return err('保証金を預けて入札資格を得てから');
    const lot = this.lots().find(l => l.id === m.lot); const bid = Math.floor(+m.bid || 0); if (!lot) return; const A = this.world.events.w.flags.cevAuction; A[lot.id] ||= {}; if (A[lot.id][ch.id]) return err('この品には既に入札した');
    if (bid < lot.min) return err(`最低入札額は${lot.min.toLocaleString()}G`); if (ch.gold < bid) return err('ゴールドが足りない');
    if (bid <= lot.npc) { A[lot.id][ch.id] = 'lost'; s.send({ t: 'toast', v: `競り負けた…（落札額は${lot.npc.toLocaleString()}G前後だったらしい）` }); return this.open(s, ev); }
    ch.gold -= bid; A[lot.id][ch.id] = 'won'; if (lot.kind === 'weapon') addItem(ch, { kind: 'weapon', ref: lot.ref, plus: 0 }); else if (lot.kind === 'mat') addItem(ch, { kind: 'mat', ref: lot.ref, n: lot.n }); else { (ch.progress.flags ||= {}).sealRumor = true; this.world.note(s, { t: 'msg', v: '情報：「王城の地下には、HARD以上の者だけが通れる封印門がある」' }); }
    this.world.events.record(s, ev, `王立オークションで「${lot.name}」を${bid.toLocaleString()}Gで落札`, { clear: true }); this.world.sendSelf(s); s.send({ t: 'toast', v: `落札！ ${lot.name}` }); this.open(s, ev); }
  // Drakford duelists: personality/record/reputation drive their duel AI; the duelist of the day issues the challenge
  duelist(s, ev, id) { const d = DUELISTS.find(x => x.id === id); if (!d) return; const ch = s.ch; const F = this.world.events.w.flags.duelists; const g = F[d.id] ||= { w: 0, l: 0, rep: d.rep };
    const confidence = Math.max(-0.15, Math.min(0.15, (g.w - g.l) * 0.01)); const back = s.actor.zone.id; const az = duelArena(this.world, s, `duel:${ch.id}`, `決闘：${d.name}`, back); az.returnField = back;
    const dc = makeDuelChar(d.name, d.wt, Math.max(5, ch.level + d.lvAdd), { body: 1, skin: (d.wt % 5), hair: d.wt % 6, hairColor: d.wt % 10, outfit: 3 });
    const f = spawnDuelist(az, dc, { key: 'duelist_' + d.id, hpMul: d.hp, parry: d.parry, aggression: Math.max(0.2, Math.min(0.95, d.aggression + confidence)), memo: this.world.duels.mem.tactics('duelist_' + d.id, ch.id) });
    const p = az.tileCenter([az.map.w >> 1, Math.round(az.map.h * 0.6)]); s.actor.x = p.x; s.actor.y = p.y; az.bout = { kind: 'ctduel', memKey: 'duelist_' + d.id, duelist: d.id, ev, sid: ch.id, foe: f, wt: s.actor.wt.id, today: DUELISTS[clock().day % DUELISTS.length].id === d.id };
    s.send({ t: 'toast', v: `${d.name}（${d.pers}）との決闘！`, cls: 'big' }); }
  onDuelEnd(s, z, b, won) { const d = DUELISTS.find(x => x.id === b.duelist); const F = this.world.events.w.flags.duelists; const g = F[d.id] ||= { w: 0, l: 0, rep: d.rep }; const ch = s.ch; const me = (ch.progress.duelRec ||= {})[d.id] ||= { w: 0, l: 0 };
    if (won) { g.l++; me.w++; g.rep = Math.max(0, (g.rep ?? d.rep) - 2); const gold = Math.round(500 + (g.rep ?? d.rep) * 30 * (b.today ? 1.5 : 1)); ch.gold += gold; this.world.events.record(s, 'ct_duelist', `${d.name}に勝利（${gold}G）`, { clear: true });
      this.world.events.grant(s, 'ct_duelist', 'first', { title: '酒場の決闘者', xp: 4000 }); if (Object.keys(ch.progress.duelRec).filter(k => ch.progress.duelRec[k].w > 0).length >= DUELISTS.length) this.world.events.grant(s, 'ct_duelist', 'all', { title: 'ドラクフォードの勝ち頭', gold: 10000 });
      this.world.duels.leave(s, z, `${d.name}に勝利した！（賞金${gold.toLocaleString()}G）`); }
    else { g.w++; me.l++; g.rep = Math.min(100, (g.rep ?? d.rep) + 1); } }
  // ── realms (PHASE 9): unlocked by their discovery event; reached through the host or a realm gate
  unlockRealm(s, realm) { const ch = s.ch; (ch.progress.realms ||= {})[realm] = Date.now(); this.world.events.discover(s, realm); this.world.note(s, { t: 'msg', v: `特殊領域「${PLACE[realm]?.name}」への道が開いた` }); }
  toRealm(s, realm) { const L = REALM_LINK[realm]; const hz = this.world.zones.get(L.hub); if (hz && L.hub !== 'celestia_holy') { s.send({ t: 'loading', v: PLACE[realm]?.name }); return this.world.enterZone(s, hz); }
    s.send({ t: 'open', service: 'gate', data: { dungeons: [L.dungeon], special: true } }); }
  realmOf(cityId) { return Object.entries(REALM_LINK).find(([, L]) => L.hub === cityId || L.hub2 === cityId)?.[0]; }
  realmGate(s) { const z = s.actor.zone; const realm = this.realmOf(z.cityId); if (!realm) return; const L = REALM_LINK[realm]; const back = REALM_EVENTS[L.ev].host.city;
    s.send({ t: 'open', service: 'realmgate', data: { realm: PLACE[realm]?.name, back, backName: CITIES[back]?.name, dungeon: L.dungeon, dungeonName: REALM_DUNGEONS[L.dungeon].name, other: L.hub2 ? (z.cityId === L.hub ? L.hub2 : L.hub) : null, otherName: L.hub2 ? CITIES[z.cityId === L.hub ? L.hub2 : L.hub]?.name : null } }); }
  realmAct(s, m) { const z = s.actor.zone; const realm = this.realmOf(z.cityId); if (!realm || z.kind !== 'interior') return; const L = REALM_LINK[realm];
    if (m.to === 'back') { const c = REALM_EVENTS[L.ev].host.city; s.send({ t: 'loading', v: CITIES[c].name }); return this.world.enterZone(s, this.world.zones.get(c)); }
    if (m.to === 'other' && L.hub2) return this.world.enterZone(s, this.world.zones.get(z.cityId === L.hub ? L.hub2 : L.hub));
    if (m.to === 'dungeon') return s.send({ t: 'open', service: 'gate', data: { dungeons: [L.dungeon], special: true } }); }
  stepOf(ev, i) { return CITY_EVENTS[ev]?.steps[i] || null; }
  // ── NEW EVENTS PHASE C services
  onResidentTalk(s, c) { if (c.story) return; this.each(s, (ev, E, P, st) => { if (st.k !== 'gossip' || c.city !== st.city) return; P.data.talked ||= []; if (P.data.talked.includes(c.id)) return; P.data.talked.push(c.id);
    s.send({ t: 'toast', v: `【${EVENT_BY_ID[ev].name}】噂を聞いた（${P.data.talked.length}/${st.n}）` }); if (P.data.talked.length >= st.n) this.next(s, ev); }); }
  heroSvc(s, m) { const ch = s.ch, EV = this.world.events, err = v => s.send({ t: 'err', v });
    if (m.mode === 'train') { if (EV.hasReward(ch, 'nx07', 'tech')) return err('もう教えることはない'); EV.grant(s, 'nx07', 'tech', { title: '英雄の型を継ぐ者' }); ch.inventory.push({ uid: 'art_' + Date.now().toString(36), kind: 'artifact', ref: 'artifact', name: '英雄の型', cond: 'parry', eff: 'atk', val: 0.4, dur: 10, stack: 1, from: ['アーヴェル・クロード'] }); this.world.note(s, { t: 'msg', v: '特殊な戦闘技術「英雄の型」（パリィ成功で攻撃力上昇）を授かった' }); }
    else if (m.mode === 'recipe') { if (EV.hasReward(ch, 'nx07', 'recipe')) return err('古い剣はもう打ち直した'); if (ch.gold < 20000 || !this.take(ch, 'ore', 5)) return err('強化鉱石×5と20,000Gが必要'); ch.gold -= 20000; EV.grant(s, 'nx07', 'recipe', {}); const wt = s.actor.wt.id; const pool = (DATA.wtWeapons.get(wt) || []).filter(w => w.rar === 4 && !w.myth); const w = pool[0] || [...DATA.weapons.values()].find(x => x.rar === 4); addItem(ch, { kind: 'weapon', ref: w.id, plus: 3 }); this.world.note(s, { t: 'msg', v: `古い武器のレシピから「${w.name}+3」を打ち直した` }); }
    this.world.sendSelf(s); this.open(s, 'nx07'); }
  // the trader's stock: local goods priced by the city's supply, rarity, and the player's past trades
  traderStock(ch) { const city = this.world.story.cityOf('noah'); const sup = this.world.econ.supply[city] || {}; const avg = Object.values(sup).reduce((t, v) => t + v, 0) / Math.max(1, Object.values(sup).length);
    const t = ch.progress.noahTrades || 0, friend = !!ch.progress.flags?.noahFriend; const comp = this.world.events.flag('ct:noah') === 'competitive' ? 0.9 : 1; const disc = Math.max(0.7, 1 - t * 0.02) * comp;
    const day = clock().day; const r = rng(hash32('noah:' + city + day)); const base = [['elixir', 900], ['luckCharm', 1300], ['xpScroll', 1600], ['crystal', 260], ['gem', 220], ['relic', 600]]; const pick = base.filter(() => r() < 0.7);
    if (t >= 5 || friend) pick.push(['abyssShard', 3200]); if (friend) pick.push(['traitTicket', 24000]);
    const bought = ch.progress.noahBought?.day === day ? ch.progress.noahBought.n : {};
    return pick.map(([ref, p]) => ({ ref, name: ITEMS[ref]?.name || ref, price: Math.round(p * (2 - Math.min(1.5, avg)) * disc), left: (ref === 'traitTicket' ? 1 : 3) - (bought[ref] || 0) })); }
  traderBuy(s, m) { const ch = s.ch, err = v => s.send({ t: 'err', v }); if (!this.world.story.near(s, 'noah')) return err('ノアのそばで'); const it = this.traderStock(ch).find(x => x.ref === m.ref); if (!it) return err('今日はその品がない'); if (it.left <= 0) return err('売り切れ'); if (ch.gold < it.price) return err('ゴールドが足りない');
    ch.gold -= it.price; const day = clock().day; ch.progress.noahBought = ch.progress.noahBought?.day === day ? ch.progress.noahBought : { day, n: {} }; ch.progress.noahBought.n[it.ref] = (ch.progress.noahBought.n[it.ref] || 0) + 1; ch.progress.noahTrades = (ch.progress.noahTrades || 0) + 1;
    addItem(ch, { kind: ITEMS[it.ref]?.use ? 'potion' : 'mat', ref: it.ref, n: 1 }); this.world.events.log(ch, 'nx08', `ノアから${it.name}を${it.price}Gで購入（${CITIES[this.world.story.cityOf('noah')]?.name}）`);
    this.each(s, (ev, E, P, st) => { if (st.k !== 'trade') return; P.data.prog = (P.data.prog || 0) + 1; if (P.data.prog >= st.n) this.next(s, ev); }); this.world.sendSelf(s); this.open(s, 'nx08'); }
  // the apprentice is one world NPC adventurer: he fights beside the player, grows, and keeps living after the event
  rio() { let n = this.world.npcs.byId.get('npc_rio'); if (n) return n; const ch = newCharacter('npc_rio', 'リオ', 1, { body: 0, skin: 1, hair: 2, hairColor: 3, outfit: 0 }); ch.level = 5; equipBest(ch, 1); const job = DATA.jobList.find(j => j.tier === 0); ch.job = job.id; ch.jobs[job.id] = { rank: 0, xp: 0 }; fillSlots(ch);
    n = { id: 'npc_rio', ch, pers: 'social', home: 'haven', state: 'rest', zone: 'haven', timer: 9999, gold: 300, friends: [], rival: null, log: [], best: {}, bond: {}, story: true }; this.world.npcs.list.push(n); this.world.npcs.byId.set(n.id, n); return n; }
  teachRio(s, path) { const n = this.rio(); const P = RIO_PATHS[path]; this.world.events.w.flags.rioPath = path; n.ch.inventory = n.ch.inventory.filter(i => i.kind !== 'weapon'); equipBest(n.ch, P.wt); n.ch.mastery[P.wt] = { lv: Math.max(10, n.ch.level), xp: 0 }; fillSlots(n.ch); this.world.npcs.log(n, `${s.ch.name}の教えで${P.name}として鍛え始めた`); this.world.npcs.refreshActor(n); }
  rioSvc(s, m) { const ch = s.ch, err = v => s.send({ t: 'err', v }); const n = this.rio(); const z = s.actor.zone;
    if (m.mode === 'join') { if (n.state === 'party') return err(n.partyWith === ch.id ? 'もう一緒にいる' : 'リオは今ほかの冒険者と旅をしている'); const p = this.world.ensureParty(ch.id); if (p.leader !== ch.id) return err('リーダーのみ'); if (p.members.length + p.npcs.length >= 6) return err('パーティーは6人まで');
      n.state = 'party'; n.partyWith = ch.id; n.bond[ch.id] = (n.bond[ch.id] || 0) + 5; p.npcs.push(n.id); this.world.npcs.despawn(n); this.world.npcs.spawn(n, z, { x: s.actor.x + 12, y: s.actor.y + 10 }); this.world.pushParty(ch.id); s.send({ t: 'toast', v: '「よろしくお願いします！」リオがパーティーに加わった' }); }
    this.open(s, 'nx11'); }
  diploSvc(s, m) { const ch = s.ch, err = v => s.send({ t: 'err', v }); const d = ch.progress.diplo;
    if (m.mode === 'take') { if (d && !d.done) return err('今の書簡を届けてから'); const to = DIPLOMACY[(clock().day + (ch.progress.diploCount || 0)) % DIPLOMACY.length]; ch.progress.diplo = { to, picked: false, done: false }; s.send({ t: 'toast', v: `リリアーナの書簡を${CITIES[to].name}の冒険者ギルドへ届ける` }); }
    else if (m.mode === 'report') { if (!d?.picked || d.done) return err('まだ書簡を届けていない'); d.done = true; ch.progress.diploCount = (ch.progress.diploCount || 0) + 1; ch.gold += 3000; this.world.events.log(ch, 'nx12', `外交書簡を${CITIES[d.to].name}へ届けた`); if (ch.progress.diploCount >= 5) this.world.events.grant(s, 'nx12', 'envoy', { title: '王女の使者' }); s.send({ t: 'toast', v: '書簡を届けた報酬：3,000G' }); }
    this.world.sendSelf(s); this.open(s, 'nx12'); }
  onEnterDiplo(s, z) { const d = s.ch.progress.diplo; if (d && !d.done && !d.picked && z.id === 'in:w_' + d.to + '_guild') { d.picked = true; s.send({ t: 'toast', v: '書簡を届けた。リリアーナに報告しよう' }); } }
  // ── PHASE D hooks
  onObserve(s, obj, key, cond) { this.each(s, (ev, E, P, st) => { if (st.k !== 'observe' || st.obj !== obj) return; if (st.cond && cond !== st.cond) return; if (st.key && key !== st.key) return; P.data.obs ||= []; if (P.data.obs.includes(key)) return; P.data.obs.push(key);
    if (st.n > 1) s.send({ t: 'toast', v: `【${EVENT_BY_ID[ev].name}】記録した（${P.data.obs.length}/${st.n}）` }); if (P.data.obs.length >= st.n) this.next(s, ev); }); }
  onBoard(s) { this.each(s, (ev, E, P, st) => { if (st.k === 'board') this.next(s, ev); }); }
  onCar(s, n) { this.each(s, (ev, E, P, st) => { if (st.k === 'cars' && n >= st.n) this.next(s, ev); }); }
  onMapless(s) { this.each(s, (ev, E, P, st) => { if (st.k !== 'mapless') return; P.data.prog = (P.data.prog || 0) + 1; if (P.data.prog >= st.n) this.next(s, ev); }); }
  onSite(s, site) { this.each(s, (ev, E, P, st) => { if (st.k !== 'sites') return; P.data.sites ||= []; if (P.data.sites.includes(site)) return; P.data.sites.push(site); s.send({ t: 'toast', v: `【${EVENT_BY_ID[ev].name}】遺跡を記録した（${P.data.sites.length}/${st.n}）` }); if (P.data.sites.length >= st.n) this.next(s, ev); }); }
  canEnterDungeon(s, d) { if (d.realm && !s.ch.progress.realms?.[d.realm]) { s.send({ t: 'err', v: `${PLACE[d.realm]?.name}はまだ見つかっていない` }); return false; }
    if (!CITY_DUNGEONS[d.id] && !['machina', 'witherroot', 'statue_ruin', 'mirror_lake'].includes(d.id)) return true; if (this.canEnter(s.ch, d.id)) return true; s.send({ t: 'err', v: `${d.name}への道はまだ見つかっていない` }); return false; }
}
