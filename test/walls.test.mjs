// Regression: no skill / special / dodge may leave an actor inside a wall.
import test from 'node:test';
import assert from 'node:assert';
process.env.DATA_DIR = '/tmp/claude-0/abyss-test-saves';
const { Zone } = await import('../server/game/zone.js');
const { Fighter } = await import('../server/game/actor.js');
const { makeMonster } = await import('../server/game/monsters.js');
const { newCharacter } = await import('../server/game/progress.js');
const { DATA } = await import('../server/data.js');
const { WEAPON_TYPES } = await import('../shared/data/weaponTypes.js');
const fw = { onMonsterKilled() {}, onBossKilled() {}, onFighterDied() {}, npcs: { fighterTick() {} } };

test('skills never embed actors in walls', () => {
  const bad = [];
  for (const wt of WEAPON_TYPES) {
    const z = new Zone(fw, 'dg:w:d01:NORMAL:3', { kind: 'dungeon', dungeon: 'd01', diff: 'NORMAL', floor: 3 });
    for (const a of [...z.actors.values()]) z.remove(a);
    const W = z.map.w; z.map.tiles.fill(1); for (let y = 0; y < z.map.h; y++) { z.map.tiles[y * W + 20] = 2; z.map.tiles[y * W + 21] = 2; } // wall columns at x=320..352
    const ch = newCharacter('w' + wt.id, 'W', wt.myth ? 1 : wt.id, {}); const w = DATA.wtWeapons.get(wt.id)[40]; ch.inventory.push({ uid: 'W', kind: 'weapon', ref: w.id, plus: 0 }); ch.equip.weapon = 'W'; ch.level = 80; ch.mastery[wt.id] = { lv: 100, xp: 0 };
    const p = new Fighter(ch, { kind: 'player', team: 'ally' }); z.add(p); p.sp = p.maxSp = 1e6;
    const m = makeMonster('golem', 20, 'NORMAL'); m.maxHp = m.hp = 1e9; m.stats.atk = 1; z.add(m);
    const ids = [...DATA.wtSkills.get(wt.id).filter(s => s.kind !== 'passive').map(s => s.id), w.skill.id, ...DATA.levelSkills.map(s => s.id)];
    const check = tag => { const tx = Math.floor(p.x / 16); if (z.blocked(p.x, p.y) || tx >= 20) bad.push(`${wt.name}:${tag}@${Math.round(p.x)},${Math.round(p.y)}`); };
    for (const id of [...ids, 'special', 'dodge']) {
      p.x = 300; p.y = 200; p.facing = 0; p.aimX = 420; p.aimY = 200; p.action = null; p.cds = {}; p.spCd = 0; p.dodgeCd = 0; p.statuses = {}; m.x = 340; m.y = 200; m.dead = false; m.hp = 1e9; z.actors.set(m.id, m);
      if (id === 'special') { p.special('press', z); for (let t = 0; t < 10; t++) z.tick(50); p.special('release', z); }
      else if (id === 'dodge') p.dodge(z, 1, 0);
      else p.useSkill(id, z, { tx: 420, ty: 200 });
      for (let t = 0; t < 30; t++) { p.input = {}; z.tick(50); }
      check(id);
    }
  }
  assert.deepStrictEqual(bad.slice(0, 20), []);
});
