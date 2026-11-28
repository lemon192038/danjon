// Attack movement follows the movement stick (not the enemy); the attack itself still aims at the enemy.
import test from 'node:test';
import assert from 'node:assert';
process.env.DATA_DIR = '/tmp/claude-0/abyss-test-saves';
const { Zone } = await import('../server/game/zone.js');
const { Fighter } = await import('../server/game/actor.js');
const { newCharacter } = await import('../server/game/progress.js');
const { makeMonster } = await import('../server/game/monsters.js');
const { DATA } = await import('../server/data.js');
const mk = () => { const z = new Zone({ onMonsterKilled() {}, npcs: { fighterTick() {} } }, 'dg:test:d01:NORMAL:3', { kind: 'dungeon', dungeon: 'd01', diff: 'NORMAL', floor: 3 }); for (const a of [...z.actors.values()]) z.remove(a); z.map.tiles.fill(2); for (let y = 1; y < z.map.h - 1; y++) for (let x = 1; x < z.map.w - 1; x++) z.map.tiles[y * z.map.w + x] = 1; return z; };
function run(wt, input, dist = 60) { const z = mk(); const ch = newCharacter('s', 'S', wt, {}); const w = DATA.wtWeapons.get(wt)[10]; ch.inventory.push({ uid: 'W', kind: 'weapon', ref: w.id, plus: 0 }); ch.equip.weapon = 'W';
  const p = new Fighter(ch, { kind: 'player', team: 'ally' }); p.x = 300; p.y = 300; p.autoAim = true; z.add(p); const m = makeMonster('golem', 20, 'NORMAL'); m.x = 300 + dist; m.y = 300 + (dist < 60 ? 20 : 0); m.maxHp = m.hp = 1e9; m.canAct = () => false; z.add(m);
  const y0 = p.y, x0 = p.x; for (let i = 0; i < 30; i++) { p.input = { atk: true, ...input }; p.vx = p.vy = 0; p.attack(z.now, z); z.tick(50); p.x = Math.max(p.x, x0 - 400); } return { dx: p.x - x0, dy: p.y - y0, hit: m.hp < 1e9 }; }

test('attack movement follows the stick, never pulls toward the enemy', () => {
  for (const wt of [1, 3, 14]) { // sword, katana (lunging thrust), spear
    const neutral = run(wt, {}); assert.ok(Math.abs(neutral.dx) < 4 && Math.abs(neutral.dy) < 4, `type ${wt}: stick neutral → no auto-approach (${neutral.dx.toFixed(1)},${neutral.dy.toFixed(1)})`);
    const down = run(wt, { mx: 0, my: 1 }); assert.ok(down.dy > 6 && Math.abs(down.dx) < Math.abs(down.dy), `type ${wt}: moves with the stick (down) ${down.dx.toFixed(1)},${down.dy.toFixed(1)}`);
    assert.ok(run(wt, { mx: 0, my: 0.3 }, 26).hit, `type ${wt}: the attack still aims at and hits the enemy`); }
});
