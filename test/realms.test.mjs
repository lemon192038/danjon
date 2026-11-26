// PHASE 9: hidden realms (hub cities, realm dungeons, discovery events, realm gates).
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
process.env.DATA_DIR = '/tmp/claude-0/abyss-realm-test';
fs.rmSync(process.env.DATA_DIR, { recursive: true, force: true });
const { World } = await import('../server/game/world.js');
const { store } = await import('../server/store.js');
const { DATA } = await import('../server/data.js');
const { setClockAt } = await import('../server/game/life.js');
const { REALM_EVENTS, REALM_LINK, REALM_DUNGEONS } = await import('../shared/data/realms.js');
const { CITIES } = await import('../shared/data/cities.js');
const { EVENT_BY_ID } = await import('../shared/data/events.js');
await store.init(); setClockAt(90, 12);

test('realms', async () => {
  const w = new World();
  try {
    const out = []; const ws = { readyState: 1, bufferedAmount: 0, send: x => out.push(JSON.parse(x)), close() {} }; const last = t => [...out].reverse().find(m => m.t === t); const err = () => out.filter(m => m.t === 'err').at(-1)?.v;
    const r = store.register('realm', 'pass1234'); const s = w.attach(ws, r.account); w.handle(s, { t: 'create', name: '探訪者', wt: 1 }); w.handle(s, { t: 'play', id: last('chars').list[0].id });
    const ch = s.ch; ch.gold = 1e6; const E = w.events; const menu = m => w.handle(s, { t: 'menu', op: 'cev', ...m });
    // hub cities exist as real towns (facilities, reachable), but are linked to no overland route
    for (const L of Object.values(REALM_LINK)) for (const id of [L.hub, L.hub2].filter(Boolean)) { if (id === 'celestia_holy') continue; const z = w.zones.get(id); assert.equal(z?.kind, 'town', id); assert.ok(!z.map.unreachable?.length, id); assert.equal((z.map.exits || []).length, 0, id + ' no roads');
      assert.ok(CITIES[id].districts.flatMap(d => d.buildings).some(b => b.svc === 'realmgate'), id + ' realm gate'); assert.ok(CITIES[id].districts.flatMap(d => d.buildings).some(b => b.svc === 'inn'), id + ' inn'); }
    for (const d of Object.values(REALM_DUNGEONS)) { assert.ok(DATA.dungeons.get(d.id) && !DATA.dungeonList.includes(d), d.id); assert.equal(d.bands.length * 10, d.maxFloor); for (const b of d.bands) assert.ok(DATA.bosses.has(b.boss), b.boss); }
    for (const id of Object.keys(REALM_EVENTS)) assert.equal(EVENT_BY_ID[id].status, 'live', id);
    // undiscovered: dungeon refused, realm not in the journal's discoveries
    w.handle(s, { t: 'menu', op: 'dungeon', id: 'astral', diff: 'NORMAL', floor: 1 }); assert.match(err(), /見つかっていない/); assert.ok(!E.discovered(ch, 'astralheim'));
    // discovery: Fall of the Heavens (level → night → crystals → talk)
    const ev = 'lg_fall_heavens'; const H = REALM_EVENTS[ev].host; const hz = w.zones.get(H.city); w.enterZone(s, hz); const n = hz.map.npcs.find(x => x.ev === ev); assert.ok(n, 'host placed'); const p = hz.tileCenter([n.x, n.y]); s.actor.x = p.x; s.actor.y = p.y + 10;
    menu({ ev, act: 'start' }); menu({ ev, act: 'go' }); menu({ ev, act: 'go' }); assert.match(err(), /Lv70/); ch.level = 70; menu({ ev, act: 'go' });
    menu({ ev, act: 'go' }); assert.match(err(), /夜/); setClockAt(90, 22); menu({ ev, act: 'go' }); ch.inventory.push({ uid: 'C', kind: 'mat', ref: 'crystal', n: 5 }); menu({ ev, act: 'go' }); menu({ ev, act: 'go' });
    assert.ok(E.prog(ch, ev).done); assert.ok(ch.progress.realms.astralheim); assert.ok(E.discovered(ch, 'astralheim')); assert.ok(ch.progress.titles.includes('天空を仰ぐ者'));
    // travel to the hub, then the realm gate: dungeon / back to the surface
    menu({ ev, act: 'gate' }); assert.equal(s.actor.zone.id, 'cele_arca'); assert.ok(ch.progress.visited.includes('cele_arca'));
    const az = s.actor.zone; w.enterBuilding(s, az.map.doors.find(d => d.id === 'w_cele_arca_station')); w.openService(s, 'realmgate'); assert.equal(last('open').service, 'realmgate');
    w.handle(s, { t: 'menu', op: 'realm', to: 'dungeon' }); assert.deepEqual(last('open').data.dungeons, ['astral']);
    w.handle(s, { t: 'menu', op: 'dungeon', id: 'astral', diff: 'NORMAL', floor: 1 }); assert.equal(s.actor.zone.dungeon.id, 'astral'); assert.ok(s.actor.zone.name.includes('エーテル・ルイン'));
    w.handle(s, { t: 'menu', op: 'leave' }); assert.equal(s.actor.zone.id, 'cele_arca', 'back to the realm hub');
    w.enterBuilding(s, az.map.doors.find(d => d.id === 'w_cele_arca_station')); w.handle(s, { t: 'menu', op: 'realm', to: 'back' }); assert.equal(s.actor.zone.id, 'luminas');
    // prerequisites: the doomsday clock needs the thirteenth hour event; the other side needs all otherworld books
    const ev2 = 'lg_doomsday'; const H2 = REALM_EVENTS[ev2].host; const z2 = w.zones.get(H2.city); const n2 = z2.map.npcs.find(x => x.ev === ev2); const p2 = z2.tileCenter([n2.x, n2.y]); s.actor.x = p2.x; s.actor.y = p2.y + 10; ch.level = 90;
    menu({ ev: ev2, act: 'start' }); menu({ ev: ev2, act: 'go' }); menu({ ev: ev2, act: 'go' }); menu({ ev: ev2, act: 'go' }); assert.match(err(), /時計塔の十三時/);
  } finally { setTimeout(() => process.exit(process.exitCode || 0), 50); }
});
