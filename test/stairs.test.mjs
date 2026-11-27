// Floor stairs: a puppet-staff character with puppets out moves to the next floor by stepping on (or next to) the
// opened stairs or by interacting there; closed stairs explain how to open them.
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
process.env.DATA_DIR = '/tmp/claude-0/abyss-stairs-test';
fs.rmSync(process.env.DATA_DIR, { recursive: true, force: true });
const { World } = await import('../server/game/world.js');
const { store } = await import('../server/store.js');
await store.init();

test('dungeon stairs with puppets', async () => {
  const w = new World();
  try {
    const out = []; const ws = { readyState: 1, bufferedAmount: 0, send: x => out.push(JSON.parse(x)), close() {} }; const r = store.register('stairs1', 'pass1234'); const s = w.attach(ws, r.account);
    w.handle(s, { t: 'create', name: '操偶', wt: 76 }); w.handle(s, { t: 'play', id: [...out].reverse().find(m => m.t === 'chars').list[0].id }); s.ch.level = 40;
    w.enterZone(s, w.zones.get('haven')); w.handle(s, { t: 'menu', op: 'dungeon', id: 'd01', diff: 'EASY', floor: 1 });
    let z = s.actor.zone; while (!z.map.boss) { w.nextFloor(s, z); z = s.actor.zone; } s.actor.invulnUntil = 1e15;
    for (let k = 0; k < 2; k++) { s.actor.spCd = 0; s.actor.special('press', z); s.actor.special('release', z); for (let i = 0; i < 70; i++) z.tick(50); }
    assert.ok([...z.actors.values()].some(a => a.kind === 'summon'), 'puppets out');
    const sp = z.tileCenter(z.map.stairs); s.actor.x = sp.x; s.actor.y = sp.y + 10; w.handle(s, { t: 'interact' }); assert.match(out.filter(m => m.t === 'toast').at(-1)?.v || '', /ボスを倒す/);
    const boss = [...z.actors.values()].find(m => m.boss); const pup = [...z.actors.values()].find(a => a.kind === 'summon'); boss.hp = 1; z.kill(boss, pup, z.now); assert.ok(z.map.stairsOpen, 'a puppet kill opens the stairs');
    const f = z.floor; s.actor.x = sp.x + 9; s.actor.y = sp.y; w.checkTiles(s); assert.equal(s.actor.zone.floor, f + 1, 'standing next to the stairs is enough');
    z = s.actor.zone; const sp2 = z.tileCenter(z.map.stairs); s.actor.x = sp2.x; s.actor.y = sp2.y + 20; w.handle(s, { t: 'interact' }); assert.equal(s.actor.zone.floor, f + 2, 'interact on open stairs');
  } finally { setTimeout(() => process.exit(process.exitCode || 0), 50); }
});
