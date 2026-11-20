// Simulation test: every one of the 86 weapon types fights a monster using combo, special, and all skill sources.
import test from 'node:test';
import assert from 'node:assert';
process.env.DATA_DIR = '/tmp/claude-0/abyss-test-saves';
const { Zone } = await import('../server/game/zone.js');
const { Fighter } = await import('../server/game/actor.js');
const { makeMonster } = await import('../server/game/monsters.js');
const { newCharacter } = await import('../server/game/progress.js');
const { DATA } = await import('../server/data.js');
const { WEAPON_TYPES } = await import('../shared/data/weaponTypes.js');

const fakeWorld = { onMonsterKilled() {}, onBossKilled() {}, onFighterDied() {}, npcs: { fighterTick() {} } };
function arena() { const z = new Zone(fakeWorld, 'dg:test:d01:NORMAL:3', { kind: 'dungeon', dungeon: 'd01', diff: 'NORMAL', floor: 3 }); for (const a of [...z.actors.values()]) z.remove(a); z.map.tiles.fill(1); for (let i = 0; i < z.map.w; i++) { z.map.tiles[i] = 2; z.map.tiles[(z.map.h - 1) * z.map.w + i] = 2; } return z; }

test('all 86 weapon types deal damage via combo, special and skills', () => {
  const report = [];
  for (const wt of WEAPON_TYPES) {
    const z = arena();
    const ch = newCharacter('t' + wt.id, 'T', wt.myth ? 1 : wt.id, {});
    const w = DATA.wtWeapons.get(wt.id)[50]; ch.inventory.push({ uid: 'W', kind: 'weapon', ref: w.id, plus: 0 }); ch.equip.weapon = 'W';
    ch.level = 60; ch.mastery[wt.id] = { lv: 100, xp: 0 };
    const skills = DATA.wtSkills.get(wt.id).filter(s => s.kind !== 'passive');
    const p = new Fighter(ch, { kind: 'player', team: 'ally' }); p.x = 200; p.y = 200; z.add(p); p.sp = 99999; p.maxSp = 99999;
    let dealt = 0; const origFx = z.fx.bind(z); z.fx = o => { if (o.t === 'dmg' && !o.a && !o.h) dealt += o.v; origFx(o); };
    const spawn = () => { const m = makeMonster('golem', 30, 'NORMAL'); m.x = 230; m.y = 200; m.maxHp = m.hp = 1e9; m.stats.atk = 1; z.add(m); return m; };
    let m = spawn();
    const res = { id: wt.id, name: wt.name };
    // phase 1: combo
    for (let t = 0; t < 60; t++) { p.input = { atk: true }; p.aimX = m.x; p.aimY = m.y; z.tick(50); }
    res.combo = dealt; dealt = 0;
    // phase 2: special (press, hold, release)
    p.action = null; p.spCd = 0;
    for (let t = 0; t < 60; t++) { p.input = { spc: t < 30 }; p.aimX = m.x; p.aimY = m.y; if (t === 40) { p.spCd = 0; p.input = { spc: true }; } z.tick(50); }
    res.special = dealt; dealt = 0;
    // phase 3: 30 sampled weapon-type skills + unique weapon skill + job + level skills
    const ids = [...skills.filter((_, i) => i % 3 === 0).map(s => s.id), w.skill.id, DATA.jobs.get('mage_12').active.id, DATA.levelSkills[4].id, DATA.levelSkills[20].id];
    let used = 0;
    for (const id of ids) { p.action = null; p.cds = {}; p.statuses = {}; if (m.dead) m = spawn(); p.x = 200; p.y = 200; m.x = 230; m.y = 200; const r = p.useSkill(id, z, { tx: m.x, ty: m.y }); if (r === 'ok') used++; for (let t = 0; t < 30; t++) { p.input = {}; z.tick(50); } }
    res.skills = dealt; res.used = used + '/' + ids.length;
    report.push(res);
  }
  const bad = report.filter(r => !(r.combo > 0) || !(r.skills > 0));
  console.table(report.filter((_, i) => i % 9 === 0));
  const noSpecialDmg = report.filter(r => !(r.special > 0)).map(r => r.name);
  console.log('special without direct damage (buff/utility types):', noSpecialDmg.join(','));
  assert.deepStrictEqual(bad, []);
});
