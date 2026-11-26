// Regression: leaving a dungeon entered from the dungeon office (an interior) must work even after the interior was freed.
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
process.env.DATA_DIR = '/tmp/claude-0/abyss-dret-test';
fs.rmSync(process.env.DATA_DIR, { recursive: true, force: true });
const { World } = await import('../server/game/world.js');
const { store } = await import('../server/store.js');
const { setClockHour } = await import('../server/game/life.js');
await store.init(); setClockHour(12);

test('return from a dungeon entered inside a building', async () => {
  const w = new World();
  try {
    const out = []; const ws = { readyState: 1, bufferedAmount: 0, send: x => out.push(JSON.parse(x)), close() {} }; const last = t => [...out].reverse().find(m => m.t === t);
    const r = store.register('dret', 'pass1234'); const s = w.attach(ws, r.account); w.handle(s, { t: 'create', name: '帰還者', wt: 1 }); w.handle(s, { t: 'play', id: last('chars').list[0].id });
    const hz = w.zones.get('haven'); w.enterZone(s, hz); const door = hz.map.doors.find(d => d.id === 'h_gate'); assert.ok(door); w.enterBuilding(s, door); const iz = s.actor.zone; assert.equal(iz.kind, 'interior');
    w.handle(s, { t: 'menu', op: 'dungeon', id: 'd01', diff: 'NORMAL', floor: 1 }); const dz = s.actor.zone; assert.equal(dz.kind, 'dungeon');
    w.zones.delete(iz.id); // the empty interior is freed after 30s
    w.handle(s, { t: 'menu', op: 'leave' }); assert.equal(s.actor.zone.id, 'haven', 'back in town');
    const p = hz.tileCenter([door.x, door.y + 1]); assert.ok(Math.hypot(s.actor.x - p.x, s.actor.y - p.y) < 20, 'at the office door');
    // old instances whose return point is an interior id still find their way back
    w.handle(s, { t: 'menu', op: 'dungeon', id: 'd01', diff: 'NORMAL', floor: 1 }); s.actor.zone.returnTo = 'in:h_gate'; s.actor.zone.returnPos = null; w.handle(s, { t: 'menu', op: 'leave' }); assert.equal(s.actor.zone.id, 'haven');
  } finally { setTimeout(() => process.exit(process.exitCode || 0), 50); }
});
