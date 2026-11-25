// Regressions: (1) overweight pickup must not loop forever (it froze the server and dropped connections);
// discarded items are not auto-picked; (2) slow sockets are skipped instead of buffering; duplicate login is "kicked".
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
process.env.DATA_DIR = '/tmp/claude-0/abyss-robust-test';
fs.rmSync(process.env.DATA_DIR, { recursive: true, force: true });
const { World } = await import('../server/game/world.js');
const { store } = await import('../server/store.js');
await store.init();

test('overweight pickup, discard, backpressure, duplicate login', async () => {
  const w = new World();
  try {
    const out = []; const ws = { readyState: 1, bufferedAmount: 0, send: x => out.push(JSON.parse(x)), close() {} }; const last = t => [...out].reverse().find(m => m.t === t);
    const r = store.register('hauler', 'pass1234'); const s = w.attach(ws, r.account); w.handle(s, { t: 'create', name: '荷運び', wt: 1 }); w.handle(s, { t: 'play', id: last('chars').list[0].id });
    const ch = s.ch; ch.level = 20; const cz = w.zones.get('haven'); const d = cz.map.doors.find(x => x.svc === 'slum'); w.enterBuilding(s, d);
    w.slum.start(s, {}); assert.ok(ch.raid); const z = s.actor.zone;
    // fill the bag to capacity, then receive one more item → it is placed at the player's feet
    const cap = w.slum.capacity(ch); while (w.slum.hasRoom(ch, { ref: 'scrap' })) ch.raid.bag.push({ ref: 'scrap', n: 1, q: 1, prov: 'slum' });
    const before = ch.raid.bag.length; w.slum.toBag(s, { ref: 'scrap', n: 1, q: 1, prov: 'slum' }, z); assert.equal(ch.raid.bag.length, before); assert.ok(z.drops.some(x => x.it.kind === 'sloot'));
    // standing on it while overweight: the pickup pass must return promptly and not multiply drops
    const n0 = z.drops.length; const t0 = Date.now(); for (let k = 0; k < 20; k++) w.checkTiles(s); assert.ok(Date.now() - t0 < 500, 'no hang'); assert.equal(z.drops.length, n0, 'no drop explosion');
    assert.ok(out.some(m => m.t === 'toast' && m.v.includes('拾えない')));
    // the server tick keeps running (movement works) while overweight
    s.actor.input = { mx: 1, my: 0 }; const x0 = s.actor.x; for (let k = 0; k < 10; k++) z.tick(50); assert.notEqual(Math.round(s.actor.x), Math.round(x0), 'player can still move'); s.actor.input = {};
    // free space → it is picked up; deliberately discarded items are not re-picked
    ch.raid.bag.splice(0, 3); const dr = z.drops.find(x => x.it.kind === 'sloot' && x.until > z.now); s.actor.x = dr.x; s.actor.y = dr.y; w.checkTiles(s); assert.equal(ch.raid.bag.length, before - 2);
    const nb = ch.raid.bag.length; w.slum.drop(s, 0); w.checkTiles(s); assert.equal(ch.raid.bag.length, nb - 1, 'discard stays discarded');
    // backpressure: a socket with a full send buffer is skipped for snapshots
    ws.bufferedAmount = 10 * 1024 * 1024; out.length = 0; w.broadcast(z); assert.ok(!out.some(m => m.t === 's')); ws.bufferedAmount = 0; w.broadcast(z); assert.ok(out.some(m => m.t === 's'));
    // duplicate login of the same character: the old connection is told it was kicked (client then stops reconnecting)
    const out2 = []; const s2 = w.attach({ readyState: 1, bufferedAmount: 0, send: x => out2.push(JSON.parse(x)), close() {} }, r.account); out.length = 0; w.handle(s2, { t: 'play', id: ch.id });
    assert.ok(out.some(m => m.t === 'kicked')); assert.ok(s2.ch.raid, 'raid survives the reconnect');
  } finally { setTimeout(() => process.exit(process.exitCode || 0), 50); }
});
