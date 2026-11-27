// NEW WORLD EVENTS — PHASE C (07-12): story NPCs with daily life, events driven by them, world changes.
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
process.env.DATA_DIR = '/tmp/claude-0/abyss-saga-test';
fs.rmSync(process.env.DATA_DIR, { recursive: true, force: true });
const { World } = await import('../server/game/world.js');
const { store } = await import('../server/store.js');
const { setClockAt, clock } = await import('../server/game/life.js');
const { EVENT_BY_ID } = await import('../shared/data/events.js');
await store.init(); setClockAt(100, 10);
const sleep = ms => new Promise(r => setTimeout(r, ms));

test('npc sagas', async () => {
  const w = new World();
  try {
    const out = []; const ws = { readyState: 1, bufferedAmount: 0, send: x => out.push(JSON.parse(x)), close() {} }; const last = t => [...out].reverse().find(m => m.t === t); const err = () => out.filter(m => m.t === 'err').at(-1)?.v;
    const r = store.register('saga', 'pass1234'); const s = w.attach(ws, r.account); w.handle(s, { t: 'create', name: '旅人', wt: 1 }); w.handle(s, { t: 'play', id: last('chars').list[0].id });
    const ch = s.ch; ch.level = 60; ch.gold = 1e6; const E = w.events; const menu = m => w.handle(s, { t: 'menu', op: 'cev', ...m });
    for (const id of ['nx07', 'nx08', 'nx09', 'nx10', 'nx11', 'nx12']) assert.equal(EVENT_BY_ID[id].status, 'live', id); assert.ok(Object.keys(EVENT_BY_ID).filter(k => /^nx\d\d$/.test(k)).every(k => EVENT_BY_ID[k].status === 'live'), 'all 30 new events live'); assert.equal(Object.keys(EVENT_BY_ID).filter(k => /^nx\d\d$/.test(k)).length, 30);
    // story NPCs live in the city simulation: their location follows their schedule
    const clear = () => { for (const k of Object.keys(w.life.weather)) w.life.weather[k] = 'clear'; w.life.nextWx = Infinity; };
    const settle = (city) => { clear(); w.life.inited = false; w.life.last = -1; w.life.step(); for (const c of w.life.citizens) if (c.moving) { c.loc = c.moving.to; c.moving = null; } const z = w.zones.get(city); w.life.sync(z); return z; };
    const goTo = (id) => { const c = w.story.cits[id]; let z = w.zones.get(c.city); if (s.actor.zone !== z) w.enterZone(s, z); settle(c.city); if (c.loc?.startsWith('b:')) { w.enterBuilding(s, z.map.doors.find(d => d.id === c.loc.slice(2))); z = s.actor.zone; w.life.sync(z); } const a = c.actor; assert.ok(a, id + ' materialised in ' + c.city + ' at ' + c.loc); s.actor.x = a.x + 6; s.actor.y = a.y; return a; };
    setClockAt(100, 10); settle('elmgard'); assert.match(w.story.cits.arvel.loc, /^p:/, 'Arvel works outside in the morning');
    setClockAt(100, 23); settle('elmgard'); assert.match(w.story.cits.arvel.loc, /^b:.*home/, 'Arvel rests at home at night');
    setClockAt(101, 16); settle('marinelia'); assert.equal(w.story.cits.harold.loc, 'g:entrance', 'Harold waits at the town entrance in the evening');
    // EVENT 07 the retired hero: gossip → days → quiz → records → truth → choice; NPC behaviour changes with the outcome
    setClockAt(101, 10); const a1 = goTo('arvel'); w.handle(s, { t: 'interact' }); assert.equal(last('open').service, 'cev'); assert.equal(last('open').data.ev, 'nx07');
    menu({ ev: 'nx07', act: 'start' }); const ez = w.zones.get('elmgard'); let n = 0; for (const c of w.life.byCity.elmgard.list) { if (c.story || !c.actor) continue; s.actor.x = c.actor.x; s.actor.y = c.actor.y; w.cev.onResidentTalk(s, c); if (++n >= 3) break; }
    if (E.prog(ch, 'nx07').stage === 0) for (const c of w.life.byCity.elmgard.list.filter(c => !c.story).slice(0, 3)) w.cev.onResidentTalk(s, c);
    assert.equal(E.prog(ch, 'nx07').stage, 1); goTo('arvel'); menu({ ev: 'nx07', act: 'go' });
    for (const d of [101, 102, 103]) { setClockAt(d, 10); goTo('arvel'); menu({ ev: 'nx07', act: 'go' }); menu({ ev: 'nx07', act: 'go' }); }
    assert.equal(E.prog(ch, 'nx07').stage, 3); menu({ ev: 'nx07', act: 'go', choice: '1' });
    for (const [c, d] of [['vermion', 'w_vermion_guild'], ['arcelia', 'w_arcelia_library'], ['elmgard', 'el_g_mercenaries']]) { const z = w.zones.get(c); w.enterZone(s, z); w.enterBuilding(s, z.map.doors.find(x => x.id === d)); }
    goTo('arvel'); menu({ ev: 'nx07', act: 'go' }); menu({ ev: 'nx07', act: 'go', choice: 'adventure' }); assert.ok(E.prog(ch, 'nx07').done, JSON.stringify(E.prog(ch, 'nx07')) + err()); assert.ok(ch.progress.titles.includes('英雄を知る者'));
    setClockAt(104, 7); settle('elmgard'); assert.equal(w.story.cits.arvel.loc, 'b:w_elmgard_guild', 'after the event he trains newcomers at the guild');
    goTo('arvel'); menu({ ev: 'nx07', act: 'svc', mode: 'train' }); assert.ok(ch.inventory.some(i => i.name === '英雄の型')); menu({ ev: 'nx07', act: 'svc', mode: 'train' }); assert.match(err(), /もう/);
    // EVENT 08 the eternal trader: roams by the trade AI; prices and stock; trades advance the event
    const c0 = w.story.cityOf('noah'); w.story.state('noah').day = -1; setClockAt(105, 10); w.story.daily(); const c1 = w.story.cityOf('noah'); assert.notEqual(c0, c1, 'the trader moved to another city');
    goTo('noah'); menu({ ev: 'nx08', act: 'start' }); menu({ ev: 'nx08', act: 'go' }); const st = last('open').data.service; assert.equal(st.kind, 'trader'); assert.ok(st.stock.length);
    for (let i = 0; i < 3; i++) menu({ ev: 'nx08', act: 'svc', ref: st.stock[0].ref }); assert.equal(E.prog(ch, 'nx08').stage, 2); assert.equal(ch.progress.noahTrades, 3);
    // EVENT 09 the promise: meet Erik in Seirune; reunite moves Erik to Marinelia (world change) and Harold stops waiting
    setClockAt(106, 16); goTo('harold'); menu({ ev: 'nx09', act: 'start' }); for (const c of w.life.byCity.marinelia.list.filter(c => !c.story).slice(0, 2)) w.cev.onResidentTalk(s, c);
    for (const d of [106, 107]) { setClockAt(d, 16); goTo('harold'); menu({ ev: 'nx09', act: 'go' }); } setClockAt(107, 16); goTo('harold'); menu({ ev: 'nx09', act: 'go' });
    for (const d of ['w_marinelia_trade', 'mn_g_sailors']) { const z = w.zones.get('marinelia'); w.enterZone(s, z); w.enterBuilding(s, z.map.doors.find(x => x.id === d)); }
    setClockAt(107, 10); goTo('harold'); menu({ ev: 'nx09', act: 'go' }); goTo('erik'); w.handle(s, { t: 'interact' }); assert.equal(last('open').data.ev, 'nx09', 'Erik opens the promise event'); menu({ ev: 'nx09', act: 'go' }); menu({ ev: 'nx09', act: 'go' });
    setClockAt(108, 16); goTo('harold'); menu({ ev: 'nx09', act: 'go', choice: 'reunite' }); assert.ok(E.prog(ch, 'nx09').done, JSON.stringify(E.prog(ch, 'nx09')) + err()); assert.equal(w.story.cityOf('erik'), 'marinelia'); setClockAt(108, 16); settle('marinelia'); assert.notEqual(w.story.cits.harold.loc, 'g:entrance');
    // EVENT 10 the nameless musician: listen only while performing, in distinct cities
    setClockAt(110, 12); w.story.state('bard').day = -1; w.story.daily(); goTo('bard'); menu({ ev: 'nx10', act: 'start' }); menu({ ev: 'nx10', act: 'go' }); assert.match(err(), /演奏は夕方/);
    for (let d = 110; d < 115; d++) { setClockAt(d, 19); w.story.state('bard').day = -1; w.story.daily(); goTo('bard'); menu({ ev: 'nx10', act: 'go' }); if (E.prog(ch, 'nx10').stage === 1) menu({ ev: 'nx10', act: 'go' }); }
    assert.equal(E.prog(ch, 'nx10').stage, 3, JSON.stringify(E.prog(ch, 'nx10').data));
    // EVENT 11 the apprentice: a world NPC that joins the party, grows with kills, and keeps living afterwards
    const hz = w.zones.get('haven'); w.enterZone(s, hz); const hn = hz.map.npcs.find(x => x.ev === 'nx11'); const hp = hz.tileCenter([hn.x, hn.y]); s.actor.x = hp.x; s.actor.y = hp.y + 10; menu({ ev: 'nx11', act: 'start' }); menu({ ev: 'nx11', act: 'go' });
    for (const [c, d] of [['vermion', 'w_vermion_guild'], ['elmgard', 'w_elmgard_guild'], ['drakford', 'w_drakford_guild']]) { const z = w.zones.get(c); w.enterZone(s, z); w.enterBuilding(s, z.map.doors.find(x => x.id === d)); }
    w.enterZone(s, hz); s.actor.x = hp.x; s.actor.y = hp.y + 10; menu({ ev: 'nx11', act: 'go', choice: 'scout' }); assert.equal(w.events.w.flags.rioPath, 'scout'); const rio = w.npcs.byId.get('npc_rio'); const lv0 = rio.ch.level;
    menu({ ev: 'nx11', act: 'svc', mode: 'join' }); assert.ok(w.partyOf(ch.id).npcs.includes('npc_rio')); for (let i = 0; i < 15; i++) w.cev.onKill(s, { fam: 'slime' }, s.actor); assert.ok(rio.ch.level > lv0, 'apprentice grew'); assert.equal(E.prog(ch, 'nx11').stage, 4);
    // EVENT 12 the hidden heir: days → visits → crest quiz → reveal → choice; diplomacy requests afterwards
    setClockAt(115, 10); goTo('lily'); menu({ ev: 'nx12', act: 'start' }); menu({ ev: 'nx12', act: 'go' }); for (const d of [115, 116]) { setClockAt(d, 10); goTo('lily'); menu({ ev: 'nx12', act: 'go' }); }
    for (const d of ['w_vermion_item', 'w_vermion_inn']) { const z = w.zones.get('vermion'); w.enterZone(s, z); w.enterBuilding(s, z.map.doors.find(x => x.id === d)); }
    setClockAt(116, 10); goTo('lily'); menu({ ev: 'nx12', act: 'go', choice: '1' }); menu({ ev: 'nx12', act: 'go' }); menu({ ev: 'nx12', act: 'go', choice: 'reform' }); assert.ok(E.prog(ch, 'nx12').done, JSON.stringify(E.prog(ch, 'nx12')) + err()); assert.equal(E.flag('ct:heir'), 'reform');
    menu({ ev: 'nx12', act: 'svc', mode: 'take' }); const to = ch.progress.diplo.to; const tz = w.zones.get(to); w.enterZone(s, tz); w.enterBuilding(s, tz.map.doors.find(x => x.id === 'w_' + to + '_guild')); assert.ok(ch.progress.diplo.picked);
    goTo('lily'); const g0 = ch.gold; menu({ ev: 'nx12', act: 'svc', mode: 'report' }); assert.equal(ch.gold, g0 + 3000);
    void clock; void sleep;
  } finally { setTimeout(() => process.exit(process.exitCode || 0), 50); }
});
