// NEW WORLD EVENTS — PHASE D (13-18): exploration under real conditions, puzzles with hints, the phantom train,
// the library outside the map, the world beneath.
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
process.env.DATA_DIR = '/tmp/claude-0/abyss-explore-test';
fs.rmSync(process.env.DATA_DIR, { recursive: true, force: true });
const { World } = await import('../server/game/world.js');
const { store } = await import('../server/store.js');
const { setClockAt } = await import('../server/game/life.js');
const { EVENT_BY_ID } = await import('../shared/data/events.js');
const { hash32 } = await import('../shared/util.js');
await store.init(); setClockAt(140, 12);

test('exploration events', async () => {
  const w = new World();
  try {
    const out = []; const ws = { readyState: 1, bufferedAmount: 0, send: x => out.push(JSON.parse(x)), close() {} }; const last = t => [...out].reverse().find(m => m.t === t); const err = () => out.filter(m => m.t === 'err').at(-1)?.v; const toast = () => out.filter(m => m.t === 'toast').at(-1)?.v;
    const r = store.register('expl', 'pass1234'); const s = w.attach(ws, r.account); w.handle(s, { t: 'create', name: '探検家', wt: 1 }); w.handle(s, { t: 'play', id: last('chars').list[0].id });
    const ch = s.ch; ch.level = 80; ch.gold = 1e6; const E = w.events; const menu = m => w.handle(s, { t: 'menu', op: 'cev', ...m });
    for (const id of ['nx13', 'nx14', 'nx15', 'nx16', 'nx17', 'nx18']) assert.equal(EVENT_BY_ID[id].status, 'live', id);
    const host = (ev) => { const D = { nx13: ['arcelia'], nx14: ['drakford'], nx15: ['arcelia'], nx16: ['luminas'], nx17: ['celestia_holy'], nx18: ['frostheim'] }[ev]; const z = w.zones.get(D[0]); w.enterZone(s, z); const n = z.map.npcs.find(x => x.ev === ev); const p = z.tileCenter([n.x, n.y]); s.actor.x = p.x; s.actor.y = p.y + 10; };
    const obj = (field, k, key) => { const z = w.zones.get(field); w.enterZone(s, z); const o = z.map.objects.find(x => x.k === k && (!key || x.key === key)); assert.ok(o, `${k} in ${field}`); w.useObject(s, z, o); return o; };
    const visit = (city, door) => { const z = w.zones.get(city); w.enterZone(s, z); w.enterBuilding(s, z.map.doors.find(d => d.id === door)); };
    // EVENT 17 statues: they only turn under their condition; wrong answers give a hint; the ruin opens afterwards
    host('nx17'); menu({ ev: 'nx17', act: 'start' }); menu({ ev: 'nx17', act: 'go' });
    setClockAt(140, 12); obj('field_greatwood', 'statue17', 'a'); assert.match(toast(), /夜になると/); assert.equal(E.prog(ch, 'nx17').data.obs?.length || 0, 0);
    setClockAt(140, 22); obj('field_greatwood', 'statue17', 'a'); setClockAt(141, 18); obj('dustvale', 'statue17', 'b'); setClockAt(141, 5); obj('crystal_reef', 'statue17', 'c'); assert.equal(E.prog(ch, 'nx17').stage, 2);
    host('nx17'); menu({ ev: 'nx17', act: 'go', choice: '0' }); assert.match(err(), /ヒント/); menu({ ev: 'nx17', act: 'go', choice: '1' }); obj('tempest_ridge', 'hiddenruin'); assert.equal(E.prog(ch, 'nx17').stage, 4);
    w.handle(s, { t: 'menu', op: 'dungeon', id: 'statue_ruin', diff: 'NORMAL', floor: 1 }); assert.equal(s.actor.zone.dungeon?.id, 'statue_ruin'); w.cev.onFloor(s, { dungeon: { id: 'statue_ruin' }, floor: 10 }, true);
    assert.ok(E.prog(ch, 'nx17').done); assert.ok(ch.inventory.some(i => i.name === '石像の観測鏡'));
    // EVENT 18 the lake: three skies, then the lanterns in order (a wrong order resets with the records as a hint)
    host('nx18'); menu({ ev: 'nx18', act: 'start' }); menu({ ev: 'nx18', act: 'go' }); const fz = w.zones.get('crystalwood'); const city = w.cityNear(fz);
    setClockAt(142, 22); w.life.weather[city] = 'clear'; obj('crystalwood', 'moonlake'); w.life.weather[city] = 'fog'; obj('crystalwood', 'moonlake'); setClockAt(143, 4); obj('crystalwood', 'moonlake'); assert.equal(E.prog(ch, 'nx18').stage, 2);
    host('nx18'); menu({ ev: 'nx18', act: 'go' }); obj('crystalwood', 'lantern', 'north'); obj('crystalwood', 'lantern', 'east'); assert.match(toast(), /順番/); obj('crystalwood', 'lantern', 'north'); obj('crystalwood', 'lantern', 'west'); obj('crystalwood', 'lantern', 'east');
    assert.equal(E.prog(ch, 'nx18').stage, 4); w.cev.onFloor(s, { dungeon: { id: 'mirror_lake' }, floor: 10 }, true); host('nx18'); menu({ ev: 'nx18', act: 'go' }); assert.ok(E.prog(ch, 'nx18').done); assert.equal(ch.spells.sp_6_7.stage, 4); assert.ok(ch.inventory.some(i => i.ref === 'moonShard'));
    // EVENT 16 the dead tree: samples, night absorption, roots, choice that changes the region
    setClockAt(144, 12); host('nx16'); menu({ ev: 'nx16', act: 'start' }); menu({ ev: 'nx16', act: 'go' }); obj('yggdrasil_grove', 'deadtree'); for (const k of ['soil', 'water', 'plant']) obj('yggdrasil_grove', 'withersample', k);
    obj('yggdrasil_grove', 'deadtree'); assert.equal(E.prog(ch, 'nx16').stage, 3, 'day observation does not count'); setClockAt(144, 23); obj('yggdrasil_grove', 'deadtree'); assert.equal(E.prog(ch, 'nx16').stage, 4);
    host('nx16'); menu({ ev: 'nx16', act: 'go' }); w.cev.onFloor(s, { dungeon: { id: 'witherroot' }, floor: 10 }, true); host('nx16'); menu({ ev: 'nx16', act: 'go', choice: 'revive' }); assert.equal(E.flag('ct:tree'), 'revived');
    ch.inventory.push({ uid: 'W', kind: 'mat', ref: 'witherbloom', n: 2 }, { uid: 'H', kind: 'mat', ref: 'herb', n: 2 }); menu({ ev: 'nx16', act: 'svc' }); assert.ok(ch.inventory.some(i => i.ref === 'elixir'));
    // EVENT 14 the world beneath: three dungeons, markers, ecology, then trade with the underground
    host('nx14'); menu({ ev: 'nx14', act: 'start' }); menu({ ev: 'nx14', act: 'go' }); for (const d of ['d01', 'd02', 'd03']) w.cev.onFloor(s, { dungeon: { id: d, name: d }, floor: 10 }, true);
    for (const f of ['ashland', 'undersand', 'magma_crevasse']) obj(f, 'deepmarker'); host('nx14'); menu({ ev: 'nx14', act: 'go' }); for (let i = 0; i < 8; i++) w.cev.onKill(s, { fam: 'crystal' }, s.actor); host('nx14'); menu({ ev: 'nx14', act: 'go' }); menu({ ev: 'nx14', act: 'go', choice: 'trade' });
    assert.ok(E.prog(ch, 'nx14').done, JSON.stringify(E.prog(ch, 'nx14')) + err()); ch.inventory.push({ uid: 'O', kind: 'mat', ref: 'ore', n: 3 }); menu({ ev: 'nx14', act: 'svc', wt: 0 }); assert.ok(ch.inventory.some(i => i.ref === 'crystal' && i.n >= 2));
    // EVENT 15 the phantom train: only on train nights 0-3; cars, a stop, and you return to the station
    host('nx15'); menu({ ev: 'nx15', act: 'start' }); menu({ ev: 'nx15', act: 'go' }); setClockAt(145, 12); obj('field_capital', 'ghoststation'); assert.match(toast(), /昼間/);
    let d = 146; while (hash32('train:' + d) % 3 === 0) d++; setClockAt(d, 1); obj('field_capital', 'ghoststation'); assert.ok(s.actor.zone.train, 'boarded'); assert.equal(E.prog(ch, 'nx15').stage, 3);
    w.handle(s, { t: 'menu', op: 'train', stop: 1 }); assert.match(err(), /車両/); for (const c of ['coach', 'dining', 'cargo', 'conductor', 'special', 'last']) w.handle(s, { t: 'menu', op: 'train', car: c });
    assert.ok(ch.inventory.some(i => i.ref === 'oldTicket')); w.handle(s, { t: 'menu', op: 'train', stop: 1 }); assert.equal(last('open').service, 'trainstop'); await new Promise(r => setTimeout(r, 400)); assert.equal(s.actor.zone.id, 'field_capital', 'back at the station');
    host('nx15'); menu({ ev: 'nx15', act: 'go' }); assert.ok(E.prog(ch, 'nx15').done); assert.ok(E.w.flags.train.seen.includes(d));
    // EVENT 13 the library outside the map: fragments, midnight, books that depend on the reader
    host('nx13'); menu({ ev: 'nx13', act: 'start' }); menu({ ev: 'nx13', act: 'go' }); for (const [c, dd] of [['arcelia', 'w_arcelia_library'], ['luminas', 'w_luminas_library'], ['celestia_holy', 'w_celestia_holy_library'], ['luminas', 'lu_g_sages']]) visit(c, dd);
    host('nx13'); menu({ ev: 'nx13', act: 'go', choice: '1' }); setClockAt(150, 12); menu({ ev: 'nx13', act: 'go' }); assert.match(err(), /0時台/); setClockAt(150, 0); menu({ ev: 'nx13', act: 'go' }); menu({ ev: 'nx13', act: 'go' });
    menu({ ev: 'nx13', act: 'svc' }); assert.ok(s.actor.zone.mapless); w.openService(s, 'mapless'); const bk = last('open').data.books; assert.ok(bk.find(b => b.id === 'librarian' && !b.ok), 'the last book needs the others');
    for (const id of ['steps', 'now', 'unknown', 'nextpage']) w.handle(s, { t: 'menu', op: 'mapless', id }); const steps = last('open').data.books.find(b => b.id === 'steps'); assert.ok(steps.text.includes(ch.name) && steps.text.includes('幻の列車'), 'the book is written from your own record');
    assert.equal(E.prog(ch, 'nx13').stage, 6); host('nx13'); menu({ ev: 'nx13', act: 'go' }); menu({ ev: 'nx13', act: 'go', choice: 'visit' }); assert.ok(E.prog(ch, 'nx13').done);
  } finally { setTimeout(() => process.exit(process.exitCode || 0), 50); }
});
