// NEW WORLD EVENTS — PHASE E (19-24): the nameless village, the lost trade route, shifting borders, the grand merchant
// festival, recovery after disasters, the fractured guild. World/region-shared states live in events.w.flags and are
// stepped hourly (also while everyone is offline, bounded); players contribute through validated server actions and
// every contribution is recorded per character (no single player can fill a shared project alone).
import { VILLAGE_ID, VILLAGE_BASE, FACILITIES, VILLAGE_STAGES, VILLAGE_CRISES, VILLAGE_SHOP, VILLAGE_TITLES, ROUTE_CAUSES, NATIONS, BORDERS, GRAND_FESTIVAL, RECOVERY_PHASES, RECOVERY_NEEDS, FACTIONS, SOCIETY_HOSTS } from '../../shared/data/society.js';
import { CALAMITIES } from '../../shared/data/bigevents.js';
import { EVENT_BY_ID } from '../../shared/data/events.js';
import { ITEMS } from '../../shared/data/guilds.js';
import { CITIES, ROUTES } from '../../shared/data/cities.js';
import { Zone } from './zone.js';
import { interiorRoles } from './city.js';
import { clock } from './life.js';
import { addItem } from './progress.js';
import { DATA } from '../data.js';
import { hash32, rng } from '../../shared/util.js';

const STAGES = { nx19: ['代表者の頼み', '村を訪ねる', '村の発展に貢献する'], nx20: ['交易の停止', '原因調査と復旧', '交易の再開'], nx21: ['政治的な緊張', '外交交渉への関与', '結末'],
  nx22: ['開催告知', '出店', '市場競争', '表彰'], nx23: ['被害発生', '緊急支援', '復旧作業', '地域の再建', '復興後'], nx24: ['対立の発生', '派閥の調査', '派閥の依頼', '最終決定'] };
for (const [id, st] of Object.entries(STAGES)) Object.assign(EVENT_BY_ID[id], { stages: st, status: 'live', repeat: id === 'nx19' ? 'none' : 'cycle' });
const sum = o => Object.values(o || {}).reduce((t, v) => t + v, 0);
export class Society {
  constructor(world) { this.world = world; const F = this.F; F.village ||= { pop: 8, sat: 50, food: 40, water: 40, mat: 10, safety: 30, econ: 5, trade: 0, stage: 1, fac: [], proj: {}, crisis: null, contrib: {}, names: {}, day: -1, log: [] };
    F.route ||= { active: null, hist: [], day: -1 }; F.nations ||= this.initNations(); F.borders ||= Object.fromEntries(BORDERS.map(b => [b.id, { owner: b.a, tension: 20, crisis: null }])); F.fest ||= { stalls: {}, sales: {}, awards: [], last: -1 };
    F.recovery ||= {}; F.gsplit ||= { state: 'dormant', support: { trad: 0, reform: 0, indep: 0 }, since: 0, result: null, contrib: {} };
    this.applyVillageBuildings(); world.events.register('society', h => this.sim(h)); }
  get F() { return this.world.events.w.flags; }
  // ── host NPCs (beside city buildings)
  place(zones) { for (const [ev, H] of Object.entries(SOCIETY_HOSTS)) { const z = zones.get(H.city); if (!z) continue; const m = z.map; const d = m.doors.find(x => x.id === H.near); if (!d) continue; let pos = null;
    const clear = (x, y) => !z.blocked(x * 16 + 8, y * 16 + 8) && !z.blocked(x * 16 + 8, y * 16 + 24) && m.doors.every(o => Math.hypot(o.x - x, o.y - y) >= 3) && !m.npcs.some(n => Math.hypot(n.x - x, n.y - y) < 2);
    for (let r = 3; r < 11 && !pos; r++) for (const [dx, dy] of [[-r, 2], [r, 3], [0, r], [-r, 3], [r, 2], [-r, r], [r, r]]) { if (clear(d.x + dx, d.y + dy)) { pos = [d.x + dx, d.y + dy]; break; } }
    if (pos) m.npcs.push({ service: 'soc', ev, name: H.name, x: pos[0], y: pos[1] }); } }
  sim(h) { const d = clock().day; this.villageSim(h); this.routeSim(h, d); this.nationSim(h); this.festSim(d); this.recoverySim(h); this.guildSim(h, d); }
  ensure(s, ev) { const E = this.world.events; if (!E.prog(s.ch, ev) || E.prog(s.ch, ev).done && EVENT_BY_ID[ev].repeat !== 'none' && !this.open_(s.ch, ev)) E.start(s, ev, { silent: true }); }
  open_(ch, ev) { const P = this.world.events.prog(ch, ev); return P && !P.done; }
  stage(s, ev, n) { const E = this.world.events; this.ensure(s, ev); const P = E.prog(s.ch, ev); if (P && !P.done && P.stage < n) E.advance(s, ev, n, { silent: true }); }
  finish(s, ev, outcome, rew) { const E = this.world.events; this.ensure(s, ev); const P = E.prog(s.ch, ev); if (P && !P.done) { const last = EVENT_BY_ID[ev].stages.length - 1; if (P.stage < last) E.advance(s, ev, last, { silent: true }); E.complete(s, ev, null); } if (rew) E.grant(s, ev, rew.key, rew, { perAttempt: !!rew.again }); void outcome; }
  take(ch, ref, n) { return this.world.cev.take(ch, ref, n); }
  have(ch, ref) { return ch.inventory.filter(i => i.ref === ref && (i.kind === 'mat' || i.kind === 'potion')).reduce((t, i) => t + i.n, 0); }
  // ════════ 19 the nameless village ════════
  get V() { return this.F.village; }
  applyVillageBuildings() { const def = CITIES[VILLAGE_ID]; if (!def) return; const fac = this.V.fac; const common = new Set(['farm', 'barn', 'watch', 'church', 'library']);
    def.districts[0].buildings = [...VILLAGE_BASE, ...fac.filter(k => common.has(k) && FACILITIES[k].bld).map(k => FACILITIES[k].bld)]; def.districts[1].buildings = fac.filter(k => !common.has(k) && FACILITIES[k].bld).map(k => FACILITIES[k].bld);
    def.name = this.V.stage >= 5 ? (this.V.cityName || '名もなき都市') : this.V.stage >= 4 ? '名もなき町' : '名もなき村'; }
  rebuildVillage() { this.applyVillageBuildings(); const W = this.world; const old = W.zones.get(VILLAGE_ID); if (!old) return; const nz = new Zone(W, VILLAGE_ID, { kind: 'over' }); W.zones.set(VILLAGE_ID, nz);
    W.life.citizens = W.life.citizens.filter(c => c.city !== VILLAGE_ID || c.story); W.life.populate(VILLAGE_ID, nz.map, interiorRoles); this.world.cev.place(new Map([[VILLAGE_ID, nz]]));
    for (const p of [...old.players]) if (p.session) W.enterZone(p.session, nz, { x: p.x, y: p.y }); }
  vEff(k) { return this.V.fac.reduce((t, f) => t + (FACILITIES[f].eff[k] || 0), 0); }
  jobs() { const o = { farmer: 2, builder: 1 }; for (const f of this.V.fac) for (const [k, v] of Object.entries(FACILITIES[f].eff.jobs || {})) o[k] = (o[k] || 0) + v; return o; }
  villageSim(h) { const V = this.V; const step = Math.min(72, h); if (step <= 0) return; const cap = 10 + V.fac.length * 4 + (V.stage - 1) * 8;
    V.food = Math.max(0, Math.min(100, V.food + (4 + this.vEff('food')) * step * 0.25 - V.pop * 0.03 * step)); V.water = Math.max(0, Math.min(100, V.water + (2 + this.vEff('water')) * step * 0.25 - V.pop * 0.02 * step));
    const safety = Math.min(100, 20 + this.vEff('safety') + V.fac.length * 1.5); V.safety += (safety - V.safety) * Math.min(1, 0.05 * step);
    const target = Math.max(0, Math.min(100, 30 + (V.food > 30 ? 15 : -15) + (V.water > 30 ? 10 : -10) + (V.safety - 30) * 0.3 + this.vEff('sat') + (V.crisis ? -15 : 0))); V.sat += (target - V.sat) * Math.min(1, 0.04 * step);
    V.trade = Math.max(0, this.vEff('trade') * (V.safety / 60) - (V.crisis?.k === 'merchant' ? 6 : 0)); V.econ = Math.min(100, V.econ + (this.vEff('econ') * 0.02 + V.trade * 0.02 - (V.crisis ? 0.05 : 0)) * step);
    if (V.sat > 55 && V.pop < cap) V.pop = Math.min(cap, V.pop + 0.05 * step); if (V.sat < 30) V.pop = Math.max(5, V.pop - 0.04 * step);
    // a crisis now and then (bounded), never wiping out the village
    if (!V.crisis && Math.random() < 1 - Math.pow(1 - 0.02, step)) { const ks = Object.keys(VILLAGE_CRISES); const k = ks[Math.floor(Math.random() * ks.length)]; const C = VILLAGE_CRISES[k]; V.crisis = { k, since: Date.now(), prog: {} }; for (const [s2, v] of Object.entries(C.hit)) V[s2] = Math.max(0, (V[s2] || 0) + v); this.vlog(`危機：${C.name}――${C.text}`); this.world.econ?.addNews(`【名もなき村】${C.name}`); }
    const nx = VILLAGE_STAGES[V.stage]; if (nx && V.pop >= nx.pop && V.fac.length >= nx.fac && V.econ >= (nx.econ || 0)) { V.stage++; this.vlog(`村は「${nx.name}」へと発展した`); this.world.econ?.addNews(`【名もなき村】${nx.name}へ発展した`); this.world.events.history('nx19', `名もなき村が「${nx.name}」へ発展した`); this.rebuildVillage(); } }
  vlog(v) { this.V.log.unshift({ t: Date.now(), v }); this.V.log.length = Math.min(this.V.log.length, 20); }
  vContrib(s, pts) { const V = this.V, ch = s.ch; V.contrib[ch.id] = (V.contrib[ch.id] || 0) + pts; V.names[ch.id] = ch.name; const total = V.contrib[ch.id];
    this.stage(s, 'nx19', 2); for (const [n, t] of VILLAGE_TITLES) if (total >= n) this.world.events.grant(s, 'nx19', 'title:' + n, { title: t, xp: n * 100 }); if (total >= 30) this.finish(s, 'nx19'); }
  villageView(s) { const V = this.V, ch = s.ch; const nx = VILLAGE_STAGES[V.stage];
    return { stage: V.stage, stageName: VILLAGE_STAGES[V.stage - 1].name, next: nx ? { name: nx.name, pop: nx.pop, fac: nx.fac, econ: nx.econ || 0 } : null, stats: { pop: Math.floor(V.pop), sat: Math.round(V.sat), food: Math.round(V.food), water: Math.round(V.water), safety: Math.round(V.safety), econ: Math.round(V.econ), trade: Math.round(V.trade) },
      jobs: this.jobs(), fac: V.fac.map(k => FACILITIES[k].name), projects: Object.entries(FACILITIES).filter(([k, f]) => !V.fac.includes(k) && f.stage <= V.stage).map(([k, f]) => ({ k, name: f.name, cost: f.cost, got: V.proj[k]?.got || {}, mine: V.proj[k]?.by?.[ch.id] || {} })),
      crisis: V.crisis ? { k: V.crisis.k, ...VILLAGE_CRISES[V.crisis.k], prog: V.crisis.prog, hit: undefined } : null, mine: V.contrib[ch.id] || 0, ranking: Object.entries(V.contrib).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([id, p]) => ({ name: V.names[id] || '?', p })), log: V.log.slice(0, 8), shop: V.fac.includes('shop') ? VILLAGE_SHOP.map(x => ({ ...x, name: x.label || ITEMS[x.ref]?.name })) : null }; }
  // donate toward a facility (shared pool; one player may fill at most half of each requirement)
  donate(s, m) { const V = this.V, ch = s.ch, err = v => s.send({ t: 'err', v }); const f = FACILITIES[m.k]; if (!f || V.fac.includes(m.k)) return; if (f.stage > V.stage) return err('村がもっと発展してから');
    const P = V.proj[m.k] ||= { got: {}, by: {} }; const mine = P.by[ch.id] ||= {}; const ref = m.ref; const need = f.cost[ref]; if (!need) return; const left = need - (P.got[ref] || 0); if (left <= 0) return err('この資材は足りている');
    const capMine = Math.ceil(need / 2) - (mine[ref] || 0); const n = Math.min(left, capMine, ref === 'gold' ? Math.max(0, m.n | 0) : this.have(ch, ref), ref === 'gold' ? ch.gold : 999, m.n | 0 || 999); if (capMine <= 0) return err('一人で出せるのは半分まで。仲間の協力を待とう'); if (n <= 0) return err(ref === 'gold' ? 'ゴールドが足りない' : `${ITEMS[ref]?.name}を持っていない`);
    if (ref === 'gold') ch.gold -= n; else this.take(ch, ref, n); P.got[ref] = (P.got[ref] || 0) + n; mine[ref] = (mine[ref] || 0) + n; this.vContrib(s, ref === 'gold' ? Math.ceil(n / 500) : n);
    if (Object.entries(f.cost).every(([r, v]) => (P.got[r] || 0) >= v)) { V.fac.push(m.k); delete V.proj[m.k]; this.vlog(`${f.name}が完成した（${Object.keys(P.by).length}人の協力）`); this.world.econ?.addNews(`【名もなき村】${f.name}が完成した`); this.rebuildVillage(); }
    this.world.sendSelf(s); this.openVillage(s); }
  crisisAct(s, m) { const V = this.V, ch = s.ch, err = v => s.send({ t: 'err', v }); const c = V.crisis; if (!c) return; const C = VILLAGE_CRISES[c.k];
    if (C.choice) { const o = C.choice.find(x => x.id === m.choice); if (!o) return; for (const [k, v] of Object.entries(o.eff)) V[k] = Math.max(0, (V[k] || 0) + v); this.vlog(`${C.name}：${ch.name}の提案で「${o.label}」`); V.crisis = null; this.vContrib(s, 10); return this.openVillage(s); }
    const ref = m.ref; const need = C.need[ref]; if (!need || ref === 'kill') return; const got = c.prog[ref] || 0; const n = Math.min(need - got, ref === 'gold' ? ch.gold : this.have(ch, ref)); if (n <= 0) return err('出せるものがない');
    if (ref === 'gold') ch.gold -= n; else this.take(ch, ref, n); c.prog[ref] = got + n; this.vContrib(s, ref === 'gold' ? Math.ceil(n / 400) : n * 2); this.checkCrisis(); this.world.sendSelf(s); this.openVillage(s); }
  checkCrisis() { const V = this.V, c = V.crisis; if (!c) return; const C = VILLAGE_CRISES[c.k]; if (Object.entries(C.need || {}).every(([r, v]) => (c.prog[r] || 0) >= v)) { this.vlog(`危機「${C.name}」を乗り越えた`); V.crisis = null; V.sat = Math.min(100, V.sat + 8); } }
  openVillage(s) { s.send({ t: 'open', service: 'village', data: this.villageView(s) }); }
  vshop(s, m) { const it = VILLAGE_SHOP.find(x => x.ref === m.ref); const ch = s.ch; if (!it || !this.V.fac.includes('shop')) return; if (ch.gold < it.price) return s.send({ t: 'err', v: 'ゴールドが足りない' }); ch.gold -= it.price; addItem(ch, { kind: ITEMS[it.ref]?.use ? 'potion' : 'mat', ref: it.ref, n: 1 }); this.V.econ = Math.min(100, this.V.econ + 0.1); this.world.sendSelf(s); }
  // ════════ 20 the lost trade route ════════
  routeOk(a, b) { const R = this.F.route.active; return !R || !((R.a === a && R.b === b) || (R.a === b && R.b === a)); }
  routeSim(h, d) { const R = this.F.route; if (R.active) { const econ = this.world.econ; for (const c of [R.active.a, R.active.b]) for (const g of Object.keys(econ?.supply[c] || {})) econ.supply[c][g] = Math.max(0.35, econ.supply[c][g] - 0.01 * Math.min(24, h)); return; }
    if (R.day === d) return; R.day = d; if (Math.random() > 0.25) return; const cand = ROUTES.filter(r => CITIES[r[0]]?.continent !== 'realm' && CITIES[r[1]]?.continent !== 'realm' && r[2] !== 'airship'); const r = cand[Math.floor(Math.random() * cand.length)];
    const ks = Object.keys(ROUTE_CAUSES); const k = ks[Math.floor(Math.random() * ks.length)]; R.active = { a: r[0], b: r[1], cause: k, prog: {}, by: {}, since: Date.now() };
    this.world.events.setWorld('nx20', 'active', { note: `${CITIES[r[0]].name}と${CITIES[r[1]].name}を結ぶ交易路が不通になった（${ROUTE_CAUSES[k].name}）` }); this.world.econ?.addNews(`【交易路】${CITIES[r[0]].name}〜${CITIES[r[1]].name}が不通：${ROUTE_CAUSES[k].text}`); }
  routeView(s) { const R = this.F.route.active; return { active: R ? { a: CITIES[R.a].name, b: CITIES[R.b].name, cause: ROUTE_CAUSES[R.cause].name, text: ROUTE_CAUSES[R.cause].text, need: ROUTE_CAUSES[R.cause].need, alt: ROUTE_CAUSES[R.cause].alt || null, prog: R.prog, mine: R.by[s.ch.id] || 0 } : null, hist: this.F.route.hist.slice(-5).reverse() }; }
  routeAct(s, m) { const R = this.F.route.active, ch = s.ch, err = v => s.send({ t: 'err', v }); if (!R) return err('今は全ての交易路が通じている'); const C = ROUTE_CAUSES[R.cause]; this.stage(s, 'nx20', 1);
    const add = (ref, n, pts) => { R.prog[ref] = (R.prog[ref] || 0) + n; R.by[ch.id] = (R.by[ch.id] || 0) + pts; };
    if (m.do === 'give') { const ref = m.ref; const need = C.need[ref] ?? C.alt?.[ref]; if (!need || ref === 'kill' || ref === 'duel' || ref === 'quiz') return; const n = Math.min(need - (R.prog[ref] || 0), ref === 'gold' ? ch.gold : this.have(ch, ref)); if (n <= 0) return err('出せるものがない'); if (ref === 'gold') ch.gold -= n; else this.take(ch, ref, n); add(ref, n, ref === 'gold' ? Math.ceil(n / 1000) : n); }
    else if (m.do === 'quiz') { if (R.prog.quiz) return; if ((m.a | 0) !== 1) return err('交渉は決裂しかけた。相手の立場をもう一度考えよう'); add('quiz', 1, 5); }
    else if (m.do === 'duel') { if (R.prog.duel) return; return this.world.cev.duel(s, 'nx20', { fam: 'thug', name: '盗賊団の頭目', lv: 3, hp: 5 }); }
    this.routeCheck(s); this.world.sendSelf(s); s.send({ t: 'open', service: 'route', data: this.routeView(s) }); }
  onRouteDuel(s) { const R = this.F.route.active; if (!R || R.cause !== 'bandits') return; R.prog.duel = 1; R.by[s.ch.id] = (R.by[s.ch.id] || 0) + 10; this.routeCheck(s); }
  routeCheck(s) { const R = this.F.route.active; if (!R) return; const C = ROUTE_CAUSES[R.cause]; const done = Object.entries(C.need).every(([r, v]) => (R.prog[r] || 0) >= v) || (C.alt && Object.entries(C.alt).every(([r, v]) => (R.prog[r] || 0) >= v));
    if (!done) return; const econ = this.world.econ; for (const c of [R.a, R.b]) for (const g of Object.keys(econ?.supply[c] || {})) econ.supply[c][g] = Math.min(2.5, econ.supply[c][g] + 0.25);
    this.F.route.hist.push({ t: Date.now(), a: CITIES[R.a].name, b: CITIES[R.b].name, cause: C.name, by: Object.keys(R.by).length }); this.F.route.active = null; this.world.events.setWorld('nx20', 'resolved', { note: `交易路が復旧した（${CITIES[R.a].name}〜${CITIES[R.b].name}）` }); this.world.econ?.addNews(`【交易路】${CITIES[R.a].name}〜${CITIES[R.b].name}が再開。商人たちが戻ってきた`);
    for (const [cid] of Object.entries(R.by)) { const ss = this.world.sessions.get(cid); if (!ss) { this.pendingTitle(cid, 'nx20'); continue; } this.finish(ss, 'nx20', null, { key: 'route', title: '交易路の復旧者', gold: 3000, again: true }); this.world.guilds?.addRep?.(ss.ch, 'merchants', 5); } }
  onKill(s, m, z) { const R = this.F.route.active; if (R && ROUTE_CAUSES[R.cause].need.kill && z.kind === 'field' && [R.a, R.b].some(c => Object.values(WORLD_LINKS(this.world, c)).includes(z.id))) { R.prog.kill = (R.prog.kill || 0) + 1; R.by[s.ch.id] = (R.by[s.ch.id] || 0) + 1; this.stage(s, 'nx20', 1); this.routeCheck(s); }
    const c = this.V.crisis; if (c?.k === 'raid' && (z.id === VILLAGE_ID || z.id === 'field_greatwood')) { c.prog.kill = (c.prog.kill || 0) + 1; this.vContrib(s, 1); this.checkCrisis(); }
    for (const [city, r] of Object.entries(this.F.recovery)) if (r.phase === 2 && Object.values(WORLD_LINKS(this.world, city)).includes(z.id)) { r.prog.kill = (r.prog.kill || 0) + 1; r.by[s.ch.id] = (r.by[s.ch.id] || 0) + 1; this.recCheck(city); }
    const G = this.F.gsplit; if (G.state === 'debate') { const P = G.contrib[s.ch.id] ||= { trad: 0, reform: 0, indep: 0, tk: 0, cities: [] }; if ((m.level || 99) <= 30) P.tk = (P.tk || 0) + 1; if (m.boss) this.factionDone(s, 'reform'); } }
  onLogin(s) { const p = this.F.pending?.[s.ch.id]; if (!p) return; delete this.F.pending[s.ch.id]; for (const ev of p) if (ev === 'nx20') this.finish(s, 'nx20', null, { key: 'route', title: '交易路の復旧者', gold: 3000, again: true }); }
  pendingTitle(cid, ev) { (this.F.pending ||= {})[cid] = [...(this.F.pending[cid] || []), ev]; }
  // ════════ 21 shifting borders ════════
  initNations() { return Object.fromEntries(Object.keys(NATIONS).map(k => [k, { econ: 50, mil: 40, stab: 60, sat: 60, rel: {}, pop: 100 }])); }
  nationSim(h) { const N = this.F.nations, B = this.F.borders, econ = this.world.econ; const step = Math.min(48, h);
    for (const [k, n] of Object.entries(N)) { const cities = Object.keys(CITIES).filter(c => CITIES[c].continent === k); const sup = cities.flatMap(c => Object.values(econ?.supply[c] || {})); const avg = sup.length ? sup.reduce((t, v) => t + v, 0) / sup.length : 1;
      n.econ += ((avg * 50) - n.econ) * Math.min(1, 0.05 * step); n.mil = Math.max(10, Math.min(100, n.mil + (n.econ - 45) * 0.004 * step - 0.01 * step)); n.sat += ((n.econ * 0.6 + n.stab * 0.4) - n.sat) * Math.min(1, 0.03 * step);
      for (const o of Object.keys(N)) if (o !== k) n.rel[o] = Math.max(-100, Math.min(100, (n.rel[o] ?? 10) + ((n.rel[o] ?? 10) > 0 ? -0.02 : 0.02) * step)); }
    for (const b of BORDERS) { const st = B[b.id]; const A = N[b.a], Bn = N[b.b]; const other = st.owner === b.a ? b.b : b.a; const rel = N[st.owner].rel[other] ?? 0;
      st.tension = Math.max(0, Math.min(100, st.tension + ((N[other].mil - N[st.owner].mil) * 0.02 + (rel < 0 ? 0.3 : -0.2) + (N[st.owner].stab < 50 ? 0.2 : 0)) * step));
      if (!st.crisis && st.tension >= 70) { st.crisis = { phase: 'talks', since: Date.now(), mediate: 0, support: { [b.a]: 0, [b.b]: 0 }, by: {} }; this.world.events.setWorld('nx21', 'active', { note: `${NATIONS[b.a].name}と${NATIONS[b.b].name}の国境（${this.world.zones.get(b.id)?.name || b.id}）で緊張が高まっている` }); }
      if (st.crisis && Date.now() - st.crisis.since > 2 * 3600000) this.borderResolve(b.id); void A; void Bn; } }
  borderView(s) { const N = this.F.nations, B = this.F.borders; return { nations: Object.entries(N).map(([k, n]) => ({ k, name: NATIONS[k].name, gov: NATIONS[k].gov, leader: NATIONS[k].leader, econ: Math.round(n.econ), mil: Math.round(n.mil), sat: Math.round(n.sat), stab: Math.round(n.stab), terr: BORDERS.filter(b => B[b.id].owner === k).length })),
    borders: BORDERS.map(b => ({ id: b.id, name: this.world.zones.get(b.id)?.name || b.id, a: NATIONS[b.a].name, b: NATIONS[b.b].name, ak: b.a, bk: b.b, owner: NATIONS[B[b.id].owner].name, tension: Math.round(B[b.id].tension), crisis: B[b.id].crisis ? { mediate: B[b.id].crisis.mediate, support: B[b.id].crisis.support } : null })), rep: s.ch.progress.nationRep || {} }; }
  borderAct(s, m) { const b = BORDERS.find(x => x.id === m.id); const st = b && this.F.borders[b.id]; const ch = s.ch, err = v => s.send({ t: 'err', v }); if (!st?.crisis) return err('この国境は今は落ち着いている'); const C = st.crisis; this.stage(s, 'nx21', 1);
    const pts = (k, v) => { C.by[ch.id] = (C.by[ch.id] || 0) + v; (ch.progress.nationRep ||= {})[k] = (ch.progress.nationRep[k] || 0) + v; };
    if (m.do === 'mediate') { if ((m.a | 0) !== 2) return err('仲介は難航した。双方が受け入れられる案を考えよう'); if (ch.gold < 3000) return err('仲介の場を設ける費用3,000G'); ch.gold -= 3000; C.mediate += 10; pts(b.a, 3); pts(b.b, 3); }
    else if (m.do === 'aid') { if (!this.take(ch, 'herb', 5)) return err('避難民への支援物資（薬草×5）'); C.mediate += 4; pts(b.a, 2); pts(b.b, 2); }
    else if (m.do === 'merc') { const side = m.side === b.b ? b.b : b.a; if (s.actor.zone.id !== b.id) return err(`国境地帯（${this.world.zones.get(b.id)?.name}）で戦う`); C.support[side] += 5; pts(side, 5); s.send({ t: 'toast', v: `${NATIONS[side].name}側の傭兵として戦果を挙げた` }); }
    if (C.mediate >= 30) this.borderResolve(b.id); this.world.sendSelf(s); s.send({ t: 'open', service: 'border', data: this.borderView(s) }); }
  borderResolve(id) { const b = BORDERS.find(x => x.id === id); const st = this.F.borders[id]; const C = st.crisis; if (!C) return; const N = this.F.nations; let note;
    if (C.mediate >= 30) { note = `条約が結ばれた：${NATIONS[b.a].name}と${NATIONS[b.b].name}は${this.world.zones.get(id)?.name || id}の共同管理に合意した`; N[b.a].rel[b.b] = (N[b.a].rel[b.b] || 0) + 30; N[b.b].rel[b.a] = (N[b.b].rel[b.a] || 0) + 30; st.tension = 15; }
    else { const pa = N[b.a].mil + C.support[b.a], pb = N[b.b].mil + C.support[b.b]; const win = pa >= pb ? b.a : b.b; const lose = win === b.a ? b.b : b.a; const changed = st.owner !== win; st.owner = win; N[lose].mil *= 0.85; N[win].mil *= 0.92; N[lose].stab = Math.max(10, N[lose].stab - 10); st.tension = 25;
      note = changed ? `国境紛争の末、${this.world.zones.get(id)?.name || id}は${NATIONS[win].name}の領土となった` : `${NATIONS[win].name}が${this.world.zones.get(id)?.name || id}を守り抜いた`; if (changed) this.startRecovery(NATIONS[lose].capital, '国境紛争'); }
    st.crisis = null; this.world.events.setWorld('nx21', 'resolved', { note }); this.world.econ?.addNews(`【国境】${note}`);
    for (const cid of Object.keys(C.by)) { const ss = this.world.sessions.get(cid); if (ss) this.finish(ss, 'nx21', null, { key: 'border', title: '国境の調停者', gold: 4000, again: true }); } }
  // ════════ 22 the grand merchant festival ════════
  festOn(d = clock().day) { return d % GRAND_FESTIVAL.every < GRAND_FESTIVAL.len; }
  festCity(d = clock().day) { const n = Math.floor(d / GRAND_FESTIVAL.every); const econ = this.world.econ; const score = c => { const v = Object.values(econ?.supply[c] || {}); return (v.length ? v.reduce((t, x) => t + x, 0) / v.length : 1) + (hash32('fest:' + n + c) % 100) / 400; };
    return [...GRAND_FESTIVAL.cities].sort((a, b) => score(b) - score(a))[0]; }
  festSim(d) { const F = this.F.fest; const n = Math.floor(d / GRAND_FESTIVAL.every);
    if (this.festOn(d) && F.last !== n) { F.last = n; F.stalls = {}; F.sales = {}; F.city = this.festCity(d); this.world.events.setWorld('nx22', 'active', { note: `世界規模の商業祭が${CITIES[F.city].name}で開幕した` }); }
    if (this.festOn(d)) this.festMarket(); else if (F.last === n && this.world.events.w.ev.nx22?.state === 'active') this.festAwards(); }
  festMarket() { const F = this.F.fest; for (const [cid, st] of Object.entries(F.stalls)) for (const it of st.items) { if (it.n <= 0) continue; const fair = this.fair(it.ref); const ratio = it.price / fair; const pBuy = Math.max(0, Math.min(0.9, (1.4 - ratio) * 0.5 * (1 + (it.rar || 0) * 0.1)));
    if (Math.random() < pBuy) { it.n--; st.gold += it.price; st.tx++; st.sat += Math.max(0, 1.3 - ratio); st.rar += it.rar || 0; const S = F.sales[cid] ||= { gold: 0, tx: 0 }; S.gold += it.price; S.tx++; } } }
  fair(ref) { const w = DATA.weapons.get(ref); return w ? Math.round(w.price * 0.6) : ITEMS[ref]?.price || 100; }
  festView(s) { const F = this.F.fest; const st = F.stalls[s.ch.id]; return { on: this.festOn(), city: F.city ? CITIES[F.city].name : CITIES[this.festCity()].name, here: s.actor.zone.cityId === F.city, every: GRAND_FESTIVAL.every, stall: st || null, goods: GRAND_FESTIVAL.goods.map(g => ({ ...g, name: g.name || ITEMS[g.ref]?.name })), awards: F.awards.slice(-6).reverse(),
    inv: s.ch.inventory.filter(i => (i.kind === 'mat' || i.kind === 'potion') && !ITEMS[i.ref]?.nosell && i.n > 0).map(i => ({ ref: i.ref, name: ITEMS[i.ref]?.name || i.ref, n: i.n, fair: this.fair(i.ref) })) }; }
  festAct(s, m) { const F = this.F.fest, ch = s.ch, err = v => s.send({ t: 'err', v }); if (!this.festOn()) return err('商業祭は開催されていない'); if (s.actor.zone.cityId !== F.city) return err(`今回の開催地は${CITIES[F.city].name}`); this.stage(s, 'nx22', 1);
    if (m.do === 'open') { if (F.stalls[ch.id]) return err('出店済み'); if (ch.gold < GRAND_FESTIVAL.fee) return err('出店料2,000G'); ch.gold -= GRAND_FESTIVAL.fee; F.stalls[ch.id] = { name: ch.name, items: [], gold: 0, tx: 0, sat: 0, rar: 0, paid: 0 }; }
    else if (m.do === 'list') { const st = F.stalls[ch.id]; if (!st) return err('先に出店する'); if (st.items.length >= GRAND_FESTIVAL.stallMax) return err('棚は4つまで'); const n = Math.min(m.n | 0 || 1, this.have(ch, m.ref), 20); if (n <= 0 || ITEMS[m.ref]?.nosell) return err('出品できない'); this.take(ch, m.ref, n); const price = Math.max(1, m.price | 0 || this.fair(m.ref)); st.items.push({ ref: m.ref, n, price, rar: m.ref === 'abyssShard' || m.ref === 'relic' ? 3 : m.ref === 'gem' || m.ref === 'crystal' ? 2 : 1 }); this.stage(s, 'nx22', 2); }
    else if (m.do === 'collect') { const st = F.stalls[ch.id]; if (!st) return; const g = st.gold - st.paid; st.paid = st.gold; ch.gold += g; s.send({ t: 'toast', v: `売上 ${g.toLocaleString()}G を受け取った` }); }
    else if (m.do === 'buy') { const g = GRAND_FESTIVAL.goods.find(x => x.ref === m.ref); if (!g) return; const k = `fest${F.last}:${g.ref}`; ch.progress.festBuy ||= {}; if ((ch.progress.festBuy[k] || 0) >= g.n) return err('売り切れ'); if (ch.gold < g.price) return err('ゴールドが足りない'); ch.gold -= g.price; ch.progress.festBuy[k] = (ch.progress.festBuy[k] || 0) + 1; addItem(ch, { kind: 'mat', ref: g.ref, n: 1 }); }
    this.world.sendSelf(s); s.send({ t: 'open', service: 'fest', data: this.festView(s) }); }
  // awards use several criteria, not just revenue
  festAwards() { const F = this.F.fest; const list = Object.entries(F.stalls).map(([cid, st]) => ({ cid, name: st.name, score: st.gold / 1000 + st.tx * 2 + st.rar + st.sat * 3, gold: st.gold, tx: st.tx, sat: Math.round(st.sat), rar: st.rar })).sort((a, b) => b.score - a.score);
    const top = list.slice(0, 3); F.awards.push({ t: Date.now(), city: CITIES[F.city]?.name, winners: top.map(x => x.name) }); this.world.events.setWorld('nx22', 'resolved', { note: top.length ? `商業祭の大商人：${top.map(x => x.name).join('、')}` : '商業祭は静かに幕を閉じた' });
    for (const [i, x] of top.entries()) { const ss = this.world.sessions.get(x.cid); if (ss) this.finish(ss, 'nx22', null, { key: 'award' + i, title: ['商業祭の大商人', '商業祭の名商人', '商業祭の人気店'][i], gold: [20000, 10000, 5000][i], again: true }); }
    for (const x of list.slice(3)) { const ss = this.world.sessions.get(x.cid); if (ss) this.finish(ss, 'nx22', null, { key: 'join', title: '商業祭の出店者', again: true }); } }
  // ════════ 23 recovery after disasters ════════
  startRecovery(city, cause) { const R = this.F.recovery; if (!CITIES[city] || R[city]) return; R[city] = { cause, phase: 1, since: Date.now(), prog: {}, by: {}, left: 0 }; const econ = this.world.econ; for (const g of Object.keys(econ?.supply[city] || {})) econ.supply[city][g] = Math.max(0.35, econ.supply[city][g] - 0.3);
    this.world.events.setWorld('nx23', 'active', { note: `${CITIES[city].name}が被害を受けた（${cause}）。復興の手が必要だ` }); this.world.econ?.addNews(`【復興】${CITIES[city].name}：${cause}による被害`); }
  recoverySim(h) { // calamities and the great fire leave damage behind
    for (const [k, c] of Object.entries(this.F.cal || {})) if (c.stage >= 5 && !c.outcome) { const city = this.world.cityNear(this.world.zones.get(CALAMITIES[k].field)); if (city) this.startRecovery(city, CALAMITIES[k].name); }
    if (this.world.events.w.ev.ct_great_fire?.state === 'active') this.startRecovery('arcelia', '王都の大火災');
    for (const [city, r] of Object.entries(this.F.recovery)) { if (r.phase >= 5) continue; if (Date.now() - r.since > 3 * 86400000 && r.left < 3) { r.left++; r.since = Date.now(); const econ = this.world.econ; for (const g of Object.keys(econ?.supply[city] || {})) econ.supply[city][g] = Math.max(0.35, econ.supply[city][g] - 0.1); this.world.econ?.addNews(`【復興】${CITIES[city].name}から住民が他の街へ移り始めた`); } } void h; }
  recView(s) { return { list: Object.entries(this.F.recovery).map(([city, r]) => ({ city, name: CITIES[city].name, cause: r.cause, phase: r.phase, phaseName: RECOVERY_PHASES[r.phase - 1], need: RECOVERY_NEEDS[r.phase] || null, prog: r.prog, mine: r.by[s.ch.id] || 0, left: r.left, better: r.better })) }; }
  recAct(s, m) { const r = this.F.recovery[m.city], ch = s.ch, err = v => s.send({ t: 'err', v }); if (!r || r.phase >= 4) return err('今は支援が要らない'); const need = RECOVERY_NEEDS[r.phase]; const ref = m.ref; if (!need[ref] || ref === 'kill') return; this.stage(s, 'nx23', r.phase);
    const n = Math.min(need[ref] - (r.prog[ref] || 0), ref === 'gold' ? ch.gold : this.have(ch, ref)); if (n <= 0) return err('出せるものがない'); if (ref === 'gold') ch.gold -= n; else this.take(ch, ref, n); r.prog[ref] = (r.prog[ref] || 0) + n; r.by[ch.id] = (r.by[ch.id] || 0) + (ref === 'gold' ? Math.ceil(n / 1000) : n);
    this.recCheck(m.city); this.world.sendSelf(s); s.send({ t: 'open', service: 'recovery', data: this.recView(s) }); }
  recCheck(city) { const r = this.F.recovery[city]; const need = RECOVERY_NEEDS[r.phase]; if (!need || !Object.entries(need).every(([k, v]) => (r.prog[k] || 0) >= v)) return; r.phase++; r.prog = {}; r.since = Date.now();
    this.world.econ?.addNews(`【復興】${CITIES[city].name}：${RECOVERY_PHASES[r.phase - 1]}へ`);
    if (r.phase >= 4) { r.phase = 5; r.better = r.left === 0; const econ = this.world.econ; for (const g of Object.keys(econ?.supply[city] || {})) econ.supply[city][g] = Math.min(2.5, econ.supply[city][g] + (r.better ? 0.45 : 0.3)); this.world.events.setWorld('nx23', 'resolved', { note: `${CITIES[city].name}が復興した${r.better ? '。以前より活気がある' : ''}` });
      for (const cid of Object.keys(r.by)) { const ss = this.world.sessions.get(cid); if (ss) this.finish(ss, 'nx23', null, { key: 'rec:' + city, title: '復興の担い手', gold: 5000, again: true }); }
      setTimeout(() => { delete this.F.recovery[city]; }, 0); } }
  // ════════ 24 the fractured guild ════════
  guildSim(h, d) { const G = this.F.gsplit; void h;
    if (G.state === 'dormant' && d % 14 === 7) { G.state = 'debate'; G.since = d; G.support = { trad: 10, reform: 10, indep: 10 }; G.contrib = {}; this.world.events.setWorld('nx24', 'active', { note: '冒険者ギルドで運営方針を巡る対立が起きている' }); }
    if (G.state === 'debate' && d - G.since >= 5) this.guildDecide();
    if (G.state === 'decided' && d - G.since >= 14) G.state = 'dormant'; }
  factionDone(s, f) { const G = this.F.gsplit; if (G.state !== 'debate') return; const P = G.contrib[s.ch.id] ||= { trad: 0, reform: 0, indep: 0, tk: 0, cities: [] }; P[f]++; G.support[f] += 5; this.stage(s, 'nx24', 2); s.send({ t: 'toast', v: `${FACTIONS[f].name}の依頼を達成した（支持+5）` }); }
  guildView(s) { const G = this.F.gsplit; const P = G.contrib[s.ch.id] || {}; return { state: G.state, support: G.support, result: G.result, factions: Object.entries(FACTIONS).map(([k, f]) => ({ k, ...f, mine: P[k] || 0 })), tk: P.tk || 0, cities: P.cities || [] }; }
  guildAct(s, m) { const G = this.F.gsplit, ch = s.ch, err = v => s.send({ t: 'err', v }); if (G.state !== 'debate') return err('今は会議の時期ではない'); this.stage(s, 'nx24', 1); const P = G.contrib[ch.id] ||= { trad: 0, reform: 0, indep: 0, tk: 0, cities: [] };
    if (m.do === 'trad') { if ((P.tk || 0) < 10) return err(`Lv30以下の魔物をあと${10 - (P.tk || 0)}体`); if (!this.take(ch, 'hp', 3)) return err('回復薬×3を寄付する'); P.tk = 0; this.factionDone(s, 'trad'); }
    else if (m.do === 'indep') { if ((P.cities || []).length < 2) return err('異なる2都市の冒険者ギルドを訪ねてから'); P.cities = []; this.factionDone(s, 'indep'); }
    else if (m.do === 'mediate') { if (ch.gold < 5000) return err('仲介の費用5,000G'); if ((m.a | 0) !== 1) return err('どの派閥も納得しなかった'); ch.gold -= 5000; const avg = (G.support.trad + G.support.reform + G.support.indep) / 3; for (const k of Object.keys(G.support)) G.support[k] = Math.round((G.support[k] + avg) / 2); P.mediated = 1; s.send({ t: 'toast', v: '派閥の差が縮まった' }); }
    else if (m.do === 'proposal') { if ((ch.progress.advRank || 0) < 3 || P.trad + P.reform + P.indep < 3) return err('冒険者ランクC以上、派閥の依頼3件以上で改革案を出せる'); P.proposal = 1; G.support.proposal = (G.support.proposal || 0) + 15; }
    this.world.sendSelf(s); s.send({ t: 'open', service: 'gsplit', data: this.guildView(s) }); }
  onEnterZone(s, z) { const G = this.F.gsplit; if (G.state === 'debate' && /^in:w_.*_guild$/.test(z.id)) { const P = G.contrib[s.ch.id] ||= { trad: 0, reform: 0, indep: 0, tk: 0, cities: [] }; const c = z.cityId; if (c && !P.cities.includes(c)) P.cities.push(c); } }
  guildDecide() { const G = this.F.gsplit; const ranked = Object.entries(G.support).sort((a, b) => b[1] - a[1]); const close = ranked[1] && ranked[0][1] - ranked[1][1] < 5; G.result = close ? 'coalition' : ranked[0][0]; G.state = 'decided'; G.since = clock().day;
    const label = { trad: '伝統派の方針（新人支援と安全重視）', reform: '改革派の方針（高難度案件と効率重視）', indep: '独立派の方針（地域の自由な運営）', proposal: '冒険者の改革案', coalition: '三派の連立運営' }[G.result];
    this.world.events.setWorld('nx24', 'resolved', { note: `冒険者ギルドは${label}を採用した` }); this.world.econ?.addNews(`【冒険者ギルド】${label}を採用`);
    for (const [cid, P] of Object.entries(G.contrib)) { const ss = this.world.sessions.get(cid); if (!ss) continue; const won = P[G.result] > 0 || P.mediated || (G.result === 'proposal' && P.proposal); this.finish(ss, 'nx24', null, won ? { key: 'won', title: 'ギルドの改革者', gold: 5000, again: true } : { key: 'took', gold: 1000, again: true }); } }
  // quest rewards follow the guild's policy (used by the quest turn-in)
  questMul(q, ch) { const r = this.F.gsplit.result; if (!r || this.F.gsplit.state === 'dormant') return 1; if (r === 'trad') return ch.level <= 30 ? 1.3 : 1; if (r === 'reform') return q.def?.kind === 'boss' ? 1.3 : 0.95; if (r === 'indep') return 1.1; return 1.05; }
  open(s, ev) { if (ev === 'nx19') { this.stage(s, 'nx19', 0); return s.send({ t: 'open', service: 'socinfo', data: { ev, title: EVENT_BY_ID.nx19.name, text: '「森の外れの小さな村を知っていますか。人も物も足りなくて……どうか力を貸してください」（エルム大森林の東にある名もなき村の村長の家で、村の発展に協力できる）', stage: this.V.stage, stageName: VILLAGE_STAGES[this.V.stage - 1].name } }); }
    if (ev === 'nx20') return s.send({ t: 'open', service: 'route', data: this.routeView(s) }); if (ev === 'nx21') return s.send({ t: 'open', service: 'border', data: this.borderView(s) }); if (ev === 'nx22') return s.send({ t: 'open', service: 'fest', data: this.festView(s) });
    if (ev === 'nx23') return s.send({ t: 'open', service: 'recovery', data: this.recView(s) }); if (ev === 'nx24') return s.send({ t: 'open', service: 'gsplit', data: this.guildView(s) }); }
  menu(s, m) { switch (m.what) { case 'village': if (s.actor.zone.cityId !== VILLAGE_ID) return; if (m.do === 'donate') return this.donate(s, m); if (m.do === 'crisis') return this.crisisAct(s, m); if (m.do === 'shop') return this.vshop(s, m); return this.openVillage(s);
    case 'route': return this.routeAct(s, m); case 'border': return this.borderAct(s, m); case 'fest': return this.festAct(s, m); case 'recovery': return this.recAct(s, m); case 'gsplit': return this.guildAct(s, m); } }
}
function WORLD_LINKS(world, city) { return world.zones.get(city)?.map?.exits?.reduce((o, e) => { o[e.dir || e.to] = e.to; return o; }, {}) || {}; }
void rng;
