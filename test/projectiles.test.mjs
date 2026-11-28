// Projectile hit detection is swept along the path of each tick, so fast knives hit at point-blank range and at every
// distance, pierce in order of contact, and still stop at walls.
import test from 'node:test';
import assert from 'node:assert';
process.env.DATA_DIR = '/tmp/claude-0/abyss-test-saves';
const { Zone } = await import('../server/game/zone.js');
const { Fighter } = await import('../server/game/actor.js');
const { newCharacter } = await import('../server/game/progress.js');
const { makeMonster } = await import('../server/game/monsters.js');
const { spawnProj } = await import('../server/game/skillExec.js');
const mk = () => { const z = new Zone({ onMonsterKilled() {}, npcs: { fighterTick() {} } }, 'dg:test:d01:NORMAL:3', { kind: 'dungeon', dungeon: 'd01', diff: 'NORMAL', floor: 3 }); for (const a of [...z.actors.values()]) z.remove(a); z.map.tiles.fill(2); for (let y = 1; y < z.map.h - 1; y++) for (let x = 1; x < z.map.w - 1; x++) z.map.tiles[y * z.map.w + x] = 1; return z; };
const foe = (z, x, y, fam = 'slime') => { const m = makeMonster(fam, 20, 'NORMAL'); m.x = x; m.y = y; m.maxHp = m.hp = 1e9; m.canAct = () => false; z.add(m); return m; };

test('knives hit at every distance, including point-blank', () => {
  for (const spd of [13, 14, 20]) for (const d of [0, 3, 6, 10, 15, 20, 25, 33, 45, 60, 75, 90, 120, 180]) for (const off of [0, 4, 7]) { const z = mk(); const a = new Fighter(newCharacter('k', 'K', 9, {}), { kind: 'player', team: 'ally' }); a.x = 300; a.y = 300; z.add(a);
    const m = foe(z, 300 + d, 300 + off); spawnProj(z, a, { spd, rng: 260, sz: 3 }, { m: 1 }, 0, z.now); for (let i = 0; i < 14; i++) z.tick(50); assert.ok(m.hp < 1e9, `spd ${spd} dist ${d} offset ${off}`); }
});
test('pierce follows contact order; walls stop knives; one hit per knife per target', () => {
  const z = mk(); const a = new Fighter(newCharacter('k', 'K', 9, {}), { kind: 'player', team: 'ally' }); a.x = 100; a.y = 100; z.add(a);
  const ms = [14, 22, 30, 60].map(d => foe(z, 100 + d, 100)); const order = []; const of = z.fx.bind(z); z.fx = o => { if (o.t === 'dmg' && !o.a) order.push(Math.round(o.x)); of(o); };
  spawnProj(z, a, { spd: 13, rng: 260, sz: 3, pierce: 2 }, { m: 1 }, 0, z.now); for (let i = 0; i < 12; i++) z.tick(50); assert.deepEqual(order, [114, 122, 130]); assert.equal(ms[3].hp, 1e9);
  const tx = Math.floor(160 / 16); for (let y = 0; y < z.map.h; y++) z.map.tiles[y * z.map.w + tx] = 2; const w = foe(z, 200, 160); a.x = 120; a.y = 160; spawnProj(z, a, { spd: 13, rng: 260, sz: 3 }, { m: 1 }, 0, z.now); for (let i = 0; i < 12; i++) z.tick(50); assert.equal(w.hp, 1e9, 'wall blocks');
});
