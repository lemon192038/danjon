// NEW WORLD EVENTS — PHASE E (19-24): village growth, lost trade route, borders, grand festival, recovery, guild split.
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
process.env.DATA_DIR = '/tmp/claude-0/abyss-soc-test';
fs.rmSync(process.env.DATA_DIR, { recursive: true, force: true });
const { World } = await import('../server/game/world.js');
const { store } = await import('../server/store.js');
const { setClockAt } = await import('../server/game/life.js');
const { EVENT_BY_ID } = await import('../shared/data/events.js');
const { CITIES } = await import('../shared/data/cities.js');
const { GRAND_FESTIVAL } = await import('../shared/data/society.js');
await store.init(); setClockAt(200, 12);

test('society events', async () => {
  const w = new World();
  try {
    const mk = (u, name) => { const out = []; const ws = { readyState: 1, bufferedAmount: 0, send: x => out.push(JSON.parse(x)), close() {} }; const r = store.register(u, 'pass1234'); const s = w.attach(ws, r.account); w.handle(s, { t: 'create', name, wt: 1 }); w.handle(s, { t: 'play', id: out.findLast(m => m.t === 'chars').list[0].id }); s.out = out; s.ch.gold = 1e6; s.ch.level = 60; return s; };
    const s = mk('soc1', '村人A'), s2 = mk('soc2', '村人B'); const ch = s.ch; const E = w.events; const err = (x = s) => x.out.filter(m => m.t === 'err').at(-1)?.v; const last = (t, x = s) => x.out.findLast(m => m.t === t); const soc = (m, x = s) => w.handle(x, { t: 'menu', op: 'soc', ...m });
    for (const id of ['nx19', 'nx20', 'nx21', 'nx22', 'nx23', 'nx24']) assert.equal(EVENT_BY_ID[id].status, 'live', id);
    // ── 19 the village: a real town linked to the forest; facilities are shared projects (max half per player)
    const V = w.society.V; assert.ok(CITIES.nameless_village && w.zones.get('nameless_village')?.kind === 'town'); assert.equal(w.zones.get('field_greatwood').map.exits.some(x => x.to === 'nameless_village'), true);
    const vz = w.zones.get('nameless_village'); const goVillage = (x) => { w.enterZone(x, w.zones.get('nameless_village')); };
    goVillage(s); const doors0 = w.zones.get('nameless_village').map.doors.filter(d => !d.home).length;
    for (const x of [s, s2]) x.ch.inventory.push({ uid: 'H' + x.ch.id, kind: 'mat', ref: 'herb', n: 30 }, { uid: 'W' + x.ch.id, kind: 'mat', ref: 'wood', n: 40 }, { uid: 'O' + x.ch.id, kind: 'mat', ref: 'ore', n: 30 });
    soc({ what: 'village', do: 'donate', k: 'farm', ref: 'herb' }); assert.equal(V.proj.farm.got.herb, 5, 'one player fills at most half'); soc({ what: 'village', do: 'donate', k: 'farm', ref: 'herb' }); assert.match(err(), /半分/);
    goVillage(s2); soc({ what: 'village', do: 'donate', k: 'farm', ref: 'herb' }, s2); soc({ what: 'village', do: 'donate', k: 'farm', ref: 'wood' }, s2); soc({ what: 'village', do: 'donate', k: 'farm', ref: 'wood' });
    assert.ok(V.fac.includes('farm'), 'farm built by two players'); assert.ok(w.zones.get('nameless_village').map.doors.filter(d => !d.home).length > doors0, 'the building appears in the town');
    assert.equal(s.actor.zone.id, 'nameless_village', 'players stay in the rebuilt village');
    // stage growth from the simulation, and a crisis that players resolve
    soc({ what: 'village', do: 'donate', k: 'well2', ref: 'ore' }); soc({ what: 'village', do: 'donate', k: 'well2', ref: 'ore' }, s2); soc({ what: 'village', do: 'donate', k: 'well2', ref: 'wood' }); soc({ what: 'village', do: 'donate', k: 'well2', ref: 'wood' }, s2);
    V.sat = 70; V.pop = 13.9; V.crisis = null; w.society.villageSim(10); assert.equal(V.stage, 2, 'grew into a settlement'); assert.ok(w.society.villageView(s).projects.some(p => p.k === 'inn'));
    V.crisis = { k: 'food', since: Date.now(), prog: {} }; ch.inventory.push({ uid: 'HD', kind: 'mat', ref: 'hide', n: 10 }, { uid: 'H2', kind: 'mat', ref: 'herb', n: 20 }); soc({ what: 'village', do: 'crisis', ref: 'herb' }); soc({ what: 'village', do: 'crisis', ref: 'hide' }); assert.equal(V.crisis, null, 'crisis resolved');
    assert.ok(E.prog(ch, 'nx19').done && ch.progress.titles.includes('村の協力者'), 'village helper title'); assert.ok(V.contrib[ch.id] > 0 && V.contrib[s2.ch.id] > 0, 'contributions recorded per player');
    // ── 20 lost trade route: travel refused, shared progress, reopened
    w.society.F.route.active = { a: 'arcelia', b: 'vermion', cause: 'bridge', prog: {}, by: {}, since: Date.now() }; const az = w.zones.get('arcelia'); w.enterZone(s, az); w.econ.travel(s, 'vermion'); assert.match(err(), /不通/);
    ch.inventory.push({ uid: 'W3', kind: 'mat', ref: 'wood', n: 30 }, { uid: 'O3', kind: 'mat', ref: 'ore', n: 15 }); soc({ what: 'route', do: 'give', ref: 'wood' }); soc({ what: 'route', do: 'give', ref: 'ore' });
    assert.equal(w.society.F.route.active, null, 'route reopened'); assert.ok(E.prog(ch, 'nx20').done); assert.ok(ch.progress.titles.includes('交易路の復旧者'));
    // ── 21 borders: nations simulate; a crisis can end in a treaty through mediation
    w.society.nationSim(5); const b = w.society.F.borders.storm_archipelago; b.tension = 80; w.society.nationSim(0.01); assert.ok(b.crisis, 'border crisis');
    soc({ what: 'border', do: 'mediate', id: 'storm_archipelago', a: 0 }); assert.match(err(), /仲介/); for (let i = 0; i < 3; i++) soc({ what: 'border', do: 'mediate', id: 'storm_archipelago', a: 2 });
    assert.equal(b.crisis, null); assert.ok(E.prog(ch, 'nx21').done); assert.ok(E.w.ev.nx21.state === 'resolved');
    // a war instead: the stronger side (with mercenaries) may take the region, and the loser's capital needs recovery
    const g = w.society.F.borders.glacial_grave; g.tension = 90; w.society.nationSim(0.01); w.enterZone(s, w.zones.get('glacial_grave')); for (let i = 0; i < 20; i++) soc({ what: 'border', do: 'merc', id: 'glacial_grave', side: 'valgran' }); g.crisis.since = 0; w.society.nationSim(0.01); assert.equal(g.owner, 'valgran');
    assert.ok(w.society.F.recovery.frostheim, 'the losing capital needs recovery');
    // ── 23 recovery: phases advance with shared help; population leaves if neglected
    const R = w.society.F.recovery.frostheim; ch.inventory.push({ uid: 'H4', kind: 'mat', ref: 'herb', n: 30 }, { uid: 'P4', kind: 'potion', ref: 'hp', n: 15 }); soc({ what: 'recovery', do: 'give', city: 'frostheim', ref: 'herb' }); soc({ what: 'recovery', do: 'give', city: 'frostheim', ref: 'hp' }); assert.equal(R.phase, 2);
    ch.inventory.push({ uid: 'W5', kind: 'mat', ref: 'wood', n: 30 }, { uid: 'O5', kind: 'mat', ref: 'ore', n: 20 }); soc({ what: 'recovery', do: 'give', city: 'frostheim', ref: 'wood' }); soc({ what: 'recovery', do: 'give', city: 'frostheim', ref: 'ore' }); R.prog.kill = 20; w.society.recCheck('frostheim'); assert.equal(R.phase, 3);
    soc({ what: 'recovery', do: 'give', city: 'frostheim', ref: 'gold' }); assert.equal(R.phase, 5); assert.ok(R.better, 'rebuilt better than before'); assert.ok(E.prog(ch, 'nx23').done);
    // ── 22 grand festival: stalls in the host city; awards use several criteria
    const day = GRAND_FESTIVAL.every * 20; setClockAt(day, 12); w.society.festSim(day); const F = w.society.F.fest; assert.ok(F.city); const fz = w.zones.get(F.city); w.enterZone(s, fz);
    soc({ what: 'fest', do: 'open' }); ch.inventory.push({ uid: 'G6', kind: 'mat', ref: 'gem', n: 10 }); w.handle(s, { t: 'menu', op: 'soc', what: 'fest', do: 'list', ref: 'gem', n: 10, price: 150 }); assert.equal(F.stalls[ch.id].items.length, 1);
    for (let i = 0; i < 200; i++) w.society.festMarket(); assert.ok(F.stalls[ch.id].tx > 0, 'NPC customers bought'); const g0 = ch.gold; soc({ what: 'fest', do: 'collect' }); assert.ok(ch.gold > g0);
    setClockAt(day + 3, 12); w.society.festSim(day + 3); assert.ok(F.awards.length && F.awards.at(-1).winners.includes(ch.name)); assert.ok(ch.progress.titles.includes('商業祭の大商人'));
    // ── 24 guild split: faction tasks, decision, quest rewards follow the policy
    const G = w.society.F.gsplit; G.state = 'debate'; G.since = 300; G.support = { trad: 10, reform: 10, indep: 10 }; G.contrib = {};
    for (const c of ['vermion', 'luminas']) { const z = w.zones.get(c); w.enterZone(s, z); w.enterBuilding(s, z.map.doors.find(d => d.id === `w_${c}_guild`)); } soc({ what: 'gsplit', do: 'indep' }); soc({ what: 'gsplit', do: 'indep' }); assert.match(err(), /2都市/);
    for (let i = 0; i < 10; i++) w.society.onKill(s, { level: 10 }, { kind: 'field', id: 'x' }); ch.inventory.push({ uid: 'HP', kind: 'potion', ref: 'hp', n: 3 }); soc({ what: 'gsplit', do: 'trad' }); assert.ok(G.support.indep >= 15 && G.support.trad >= 15);
    G.support.indep += 20; setClockAt(305, 12); w.society.guildSim(0, 305); assert.equal(G.result, 'indep'); assert.ok(ch.progress.titles.includes('ギルドの改革者')); assert.ok(w.society.questMul({ def: {} }, ch) > 1);
  } finally { setTimeout(() => process.exit(process.exitCode || 0), 50); }
});
