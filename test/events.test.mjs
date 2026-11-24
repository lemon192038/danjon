// EventEngine foundation: forward-only progression, outcome validation, idempotent rewards, prerequisites,
// conditions, world-shared state, offline simulation bounds, persistence round-trip, journal, adoption hooks.
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
process.env.DATA_DIR = '/tmp/claude-0/abyss-events-test';
fs.rmSync(process.env.DATA_DIR, { recursive: true, force: true });
const { World } = await import('../server/game/world.js');
const { EventEngine } = await import('../server/game/events.js');
const { store } = await import('../server/store.js');
const { EVENTS } = await import('../shared/data/events.js');
const { PLACE } = await import('../shared/data/world.js');
await store.init();

test('event engine', async () => {
  const w = new World();
  try {
    const out = []; const ws = { readyState: 1, send: x => out.push(JSON.parse(x)), close() {} };
    const r = store.register('eventer', 'pass1234'); const s = w.attach(ws, r.account); const last = t => [...out].reverse().find(m => m.t === t);
    w.handle(s, { t: 'create', name: '記録者', wt: 1 }); w.handle(s, { t: 'play', id: last('chars').list[0].id }); const ch = s.ch; const E = w.events;
    // registry integrity: unique ids, valid links/prereqs/locations
    const ids = new Set(EVENTS.map(e => e.id)); assert.equal(ids.size, EVENTS.length);
    for (const e of EVENTS) { for (const l of [...e.links, ...e.prereq]) assert.ok(ids.has(l), e.id + '->' + l); for (const l of e.loc) assert.ok(PLACE[l], e.id + ' loc ' + l); }
    assert.ok(EVENTS.length >= 63);
    // start / forward-only advance / outcome validation / no double completion
    assert.ok(E.start(s, 'ev_sunken').ok); assert.ok(E.start(s, 'ev_sunken').error, 'no double start');
    assert.ok(E.advance(s, 'ev_sunken', 2).ok); assert.ok(E.advance(s, 'ev_sunken', 1).error, 'no going back'); assert.ok(E.advance(s, 'ev_sunken', 2).error, 'no replay'); assert.ok(E.advance(s, 'ev_sunken', 99).error, 'stage bounds');
    assert.ok(E.complete(s, 'ev_sunken', 'ズル').error, 'invalid outcome rejected'); assert.ok(E.complete(s, 'ev_sunken', '王国解放').ok); assert.ok(E.complete(s, 'ev_sunken', '王国解放').error);
    // idempotent reward
    const g0 = ch.gold; assert.equal(E.grant(s, 'ev_sunken', 'clear', { gold: 1000, title: '沈没王国の発見者' }), true); assert.equal(E.grant(s, 'ev_sunken', 'clear', { gold: 1000, title: '沈没王国の発見者' }), false);
    assert.equal(ch.gold, g0 + 1000); assert.equal(ch.progress.titles.filter(t => t === '沈没王国の発見者').length, 1);
    // rechallenge with per-attempt rewards; one-shot events cannot restart
    assert.ok(E.start(s, 'ev_sunken').ok, 'rechallenge allowed'); assert.equal(E.grant(s, 'ev_sunken', 'run', { gold: 1 }, { perAttempt: true }), true); assert.equal(E.grant(s, 'ev_sunken', 'run', { gold: 1 }, { perAttempt: true }), false);
    assert.ok(E.start(s, 'sl_children').ok); E.complete(s, 'sl_children', '救出成功'); assert.ok(E.start(s, 'sl_children').error, 'one-shot');
    // prerequisites
    assert.ok(E.start(s, 'lib_forbidden').error.includes('前提')); E.start(s, 'lib_sealed_abyss'); E.complete(s, 'lib_sealed_abyss'); assert.ok(E.start(s, 'lib_forbidden').ok);
    // conditions
    assert.equal(E.cond(ch, { level: 999 }), false); assert.equal(E.cond(ch, { any: [{ level: 999 }, { title: '沈没王国の発見者' }] }), true); assert.equal(E.cond(ch, { event: 'ev_sunken', done: true }), true);
    assert.equal(E.cond(ch, { world: 'ev_blackmoon' }), false); E.setWorld('ev_blackmoon', 'omen'); E.setWorld('ev_blackmoon', 'active'); assert.equal(E.cond(ch, { world: 'ev_blackmoon' }), true); assert.equal(E.worldOf('ev_blackmoon').count, 1);
    assert.throws(() => E.start(s, 'nope'));
    // discovery: hidden realm appears only after discovery
    assert.equal(E.discovered(ch, 'luna_veil'), false); assert.ok(E.discover(s, 'luna_veil')); assert.equal(E.discover(s, 'luna_veil'), false); assert.ok(E.journal(ch).discovered.includes(PLACE.luna_veil.name));
    // journal: hidden, untouched events are not revealed
    const j = E.journal(ch); assert.ok(j.list.some(e => e.id === 'ev_sunken' && e.me.clears === 1 && !e.me.done)); assert.ok(!j.list.some(e => e.id === 'ct_thirteenth'), 'hidden untouched event not listed'); assert.ok(j.history.length > 0);
    w.handle(s, { t: 'menu', op: 'events' }); assert.equal(last('open').service, 'journal');
    // offline simulation bounded to 72h
    let got = 0; E.register('t', h => { got = h; }); E.simulate(); E.w.sims.t = Date.now() - 1000 * 3600000; E.simulate(); assert.equal(got, 72);
    // persistence round-trip of world-shared state
    const E2 = new EventEngine(w, JSON.parse(JSON.stringify(E.save()))); assert.equal(E2.worldOf('ev_blackmoon').state, 'active'); assert.ok(E2.w.history.length > 0);
    // adoption: city story progress mirrors into the journal without changing story behaviour
    const cz = w.zones.get('celestia'); w.enterZone(s, cz); ch.stories = { celestia: { step: 0, prog: 0 } }; w.handle(s, { t: 'menu', op: 'story', city: 'celestia' });
    assert.equal(ch.stories.celestia.step, 1); assert.ok(E.prog(ch, 'st_celestia'));
    // character data survives save/load
    w.save(s); const back = store.loadChar(ch.id); assert.ok(back.events.rewards['ev_sunken:clear']);
  } finally { setTimeout(() => process.exit(process.exitCode || 0), 50); }
});
