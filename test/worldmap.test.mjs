// PHASE 2 world: 6 continents / 38 cities reachable by routes, overland links symmetric, every city fully placed,
// inter-continent travel, walking through fields, seasons & temperature, shops/guilds in new cities.
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
process.env.DATA_DIR = '/tmp/claude-0/abyss-worldmap-test';
fs.rmSync(process.env.DATA_DIR, { recursive: true, force: true });
const { World } = await import('../server/game/world.js');
const { store } = await import('../server/store.js');
const { CITIES, ROUTES } = await import('../shared/data/cities.js');
const { WORLD } = await import('../server/game/maps.js');
const { CONTINENTS } = await import('../shared/data/world.js');
const { season, temperature, setClockHour } = await import('../server/game/life.js');
await store.init(); setClockHour(12);
const sleep = ms => new Promise(r => setTimeout(r, ms));

test('six-continent world', async () => {
  const w = new World();
  try {
    // every continent city from the directive exists (names unchanged) and is a town zone with all buildings placed
    for (const c of CONTINENTS) for (const city of c.cities) { assert.equal(CITIES[city.id]?.name, city.name, city.id); const z = w.zones.get(city.id); assert.equal(z.kind, 'town', city.id);
      assert.equal(z.map.doors.filter(d => !d.home).length, CITIES[city.id].districts.flatMap(d => d.buildings).length, city.id); assert.ok(!z.map.unreachable?.length, city.id + ' reachable'); }
    for (const c of CONTINENTS) for (const f of c.fields) if (WORLD[f.id]) assert.equal(w.zones.get(f.id).kind, 'field', f.id);
    // route graph connects all cities; overland links are symmetric
    const adj = {}; for (const [a, b] of ROUTES) { (adj[a] ||= []).push(b); (adj[b] ||= []).push(a); }
    const seen = new Set(['haven']), q = ['haven']; while (q.length) for (const y of adj[q.pop()] || []) if (!seen.has(y)) { seen.add(y); q.push(y); }
    // hidden realm hubs (PHASE 9) are reached only through realm gates, never by routes
    const realm = Object.keys(CITIES).filter(id => CITIES[id].continent === 'realm'); assert.equal(realm.length, 6); for (const id of realm) assert.ok(!seen.has(id), id + ' not on the route graph');
    assert.equal(seen.size, Object.keys(CITIES).length - realm.length);
    for (const [k, v] of Object.entries(WORLD)) for (const t of Object.values(v.links)) assert.ok(Object.values(WORLD[t].links).includes(k), `${k}<->${t}`);
    // player: travel haven → arcelia (carriage) → marinelia → nereia (ocean lane)
    const out = []; const ws = { readyState: 1, send: x => out.push(JSON.parse(x)), close() {} }; const last = t => [...out].reverse().find(m => m.t === t);
    const r = store.register('voyager', 'pass1234'); const s = w.attach(ws, r.account); w.handle(s, { t: 'create', name: '航海者', wt: 44 }); w.handle(s, { t: 'play', id: last('chars').list[0].id });
    s.ch.gold = 100000; s.ch.level = 50;
    const go = async (to) => { const z = s.actor.zone; const st = z.map.doors.find(d => d.svc === 'travel'); w.enterBuilding(s, st); w.handle(s, { t: 'menu', op: 'travel', to }); const e = out.filter(m => m.t === 'err').at(-1); for (let i = 0; i < 60 && s.actor.zone.id !== to; i++) await sleep(100); assert.equal(s.actor.zone.id, to, 'travel to ' + to + ' ' + (e?.v || '')); };
    for (const wx of Object.keys(w.life.weather)) w.life.weather[wx] = 'clear';
    await go('arcelia'); await go('marinelia'); await go('nereia');
    assert.ok(s.ch.progress.visited.includes('nereia'));
    // walking: nereia → field (crystal_reef) → bluecoast through edge exits
    const walk = (fromZone, toId) => { const z = w.zones.get(fromZone); w.enterZone(s, z); const ex = z.map.exits.find(e => e.to === toId); assert.ok(ex, `${fromZone} exit to ${toId}`); const p = z.tileCenter([ex.x, ex.y]); s.actor.x = p.x; s.actor.y = p.y; w.checkTiles(s); assert.equal(s.actor.zone.id, toId); };
    walk('nereia', 'crystal_reef'); assert.ok(s.actor.zone.map.lv[0] >= 40); walk('crystal_reef', 'bluecoast');
    // shops & guilds in a new city
    const az = w.zones.get('arcelia'); w.enterZone(s, az); const door = az.map.doors.find(d => d.id === 'ar_academy'); assert.ok(door, 'royal academy exists in arcelia');
    const shop = az.map.doors.find(d => d.svc === 'weapon'); w.enterBuilding(s, shop); const n = s.actor.zone.map.npcs.find(x => x.service === 'weapon'); const p = s.actor.zone.tileCenter([n.x, n.y + 2]); s.actor.x = p.x; s.actor.y = p.y; out.length = 0; w.handle(s, { t: 'interact' }); assert.ok(last('open').data.stock.length > 0, 'stock');
    const mz = w.zones.get('marinelia'); w.enterZone(s, mz); w.enterBuilding(s, mz.map.doors.find(d => d.id === 'mn_g_fishers')); w.handle(s, { t: 'menu', op: 'guild', gid: 'fishers', act: 'join' }); assert.ok(s.ch.guilds.fishers, 'fishing guild joinable ' + JSON.stringify(out.filter(m => m.t === 'err').at(-1)));
    // seasons & temperature by continent
    assert.ok(['春', '夏', '秋', '冬'].includes(season().name)); assert.ok(temperature('frostheim', 'snow') < temperature('azradia', 'clear'));
    w.handle(s, { t: 'menu', op: 'cityInfo' }); assert.equal(last('cityInfo').continent, 'eldia'); assert.ok(last('cityInfo').season);
  } finally { setTimeout(() => process.exit(process.exitCode || 0), 50); }
});
