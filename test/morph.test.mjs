// Transformation weapon types (87-106): every type goes through normal → partial → half → full, attacks in each form,
// uses its own resource, form-bound skills, signature move, reverts, and keeps its state in the save.
import test from 'node:test';
import assert from 'node:assert';
process.env.DATA_DIR = '/tmp/claude-0/abyss-test-saves';
const { Zone } = await import('../server/game/zone.js');
const { Fighter } = await import('../server/game/actor.js');
const { makeMonster } = await import('../server/game/monsters.js');
const { newCharacter } = await import('../server/game/progress.js');
const { DATA } = await import('../server/data.js');
const { MORPH_TYPES, FACTOR_BY_ID } = await import('../shared/data/morph.js');
const { WEAPON_TYPES, categoryOf } = await import('../shared/data/weaponTypes.js');
const M = await import('../server/game/morph.js');

const fakeWorld = { onMonsterKilled() {}, onBossKilled() {}, onFighterDied() {}, npcs: { fighterTick() {} } };
function arena() { const z = new Zone(fakeWorld, 'dg:test:d01:NORMAL:3', { kind: 'dungeon', dungeon: 'd01', diff: 'NORMAL', floor: 3 }); for (const a of [...z.actors.values()]) z.remove(a); z.map.tiles.fill(2); for (let y = 1; y < z.map.h - 1; y++) for (let x = 1; x < z.map.w - 1; x++) z.map.tiles[y * z.map.w + x] = 1; return z; }
function setup(wt, mastery = 100) { const z = arena(); const ch = newCharacter('m' + wt, 'M', wt, {}); const w = DATA.wtWeapons.get(wt)[40]; ch.inventory.push({ uid: 'W', kind: 'weapon', ref: w.id, plus: 0 }); ch.equip.weapon = 'W'; ch.level = 60; ch.mastery[wt] = { lv: mastery, xp: 0 };
  const p = new Fighter(ch, { kind: 'player', team: 'ally' }); p.x = 200; p.y = 200; z.add(p); p.sp = p.maxSp = 99999; return { z, p, ch }; }
const foe = (z) => { const m = makeMonster('golem', 30, 'NORMAL'); m.x = 228; m.y = 200; m.maxHp = m.hp = 1e9; m.stats.atk = 1; m.canAct = () => false; z.add(m); return m; };
const press = (z, p) => { p.special('press', z); z.tick(50); p.special('release', z); z.tick(50); };
const swing = (z, p, m, n = 40) => { let d = 0; p.x = 200; p.y = 200; p.facing = 0; m.x = 228; m.y = 200; const of = z.fx.bind(z); z.fx = o => { if (o.t === 'dmg' && !o.a) d += o.v; of(o); }; for (let i = 0; i < n; i++) { if (i % 8 === 0) { p.x = 200; p.y = 200; p.facing = 0; m.x = 228; m.y = 200; } p.input = { atk: true }; p.aimX = m.x; p.aimY = m.y; z.tick(50); } p.input = {}; for (let i = 0; i < 10; i++) z.tick(50); z.fx = of; return d; };

test('106 weapon types; 20 transformation types are their own category and selectable', () => {
  assert.equal(WEAPON_TYPES.length, 106); for (const T of MORPH_TYPES) { assert.equal(categoryOf(T.id).id, 'morph'); assert.equal(DATA.wtWeapons.get(T.id).length, 100); assert.equal(DATA.formSkills.get(T.id).length, 6); }
  assert.equal(new Set(MORPH_TYPES.map(t => t.res.key)).size, 20, 'every type has its own resource');
});

test('every transformation type: forms, combos, hitbox, resource, form skills, signature, revert', () => {
  for (const T of MORPH_TYPES) { const { z, p, ch } = setup(T.id); const m = foe(z); const S = () => p.morph;
    const d0 = swing(z, p, m); assert.ok(d0 > 0, T.name + ' normal form hits');
    const c0 = JSON.stringify(p.wt.combo); press(z, p); assert.equal(S().stage, 1, T.name + ' partial'); const c1 = JSON.stringify(M.morphCombo(p)); assert.notEqual(c1, c0, 'partial changes the attack');
    S().res = 0; press(z, p); assert.equal(S().stage, 1, 'half needs the resource');
    S().res = 100; press(z, p); assert.equal(S().stage, 2, T.name + ' half'); assert.equal(p.r, 8);
    assert.ok(swing(z, p, m) > 0, T.name + ' half form hits');
    S().res = 100; press(z, p); assert.equal(S().stage, 3, T.name + ' full'); const sp = M.speciesOf(p); assert.equal(p.r, sp.r || 10, 'full-form hitbox');
    if (sp.fly) assert.ok(p.flyUntil > z.now, 'flying species fly');
    const dF = swing(z, p, m); assert.ok(dF > 0, T.name + ' full form hits ' + JSON.stringify({ st: S().stage, x: p.x, mx: m.x, dead: m.dead, act: p.action?.type, stag: p.staggerUntil - z.now, inv: p.invulnUntil - z.now, ss: p.statuses })); const keys = M.morphCombo(p).map(s => s.morphKey);
    // form-bound skills: only in their own stage
    const fs = DATA.formSkills.get(T.id); const s0 = fs.find(k => k.form === 0 && k.kind !== 'passive'); p.cds = {}; p.action = null; assert.equal(p.useSkill(s0.id, z, { tx: m.x, ty: m.y }), 'form', 'normal-form skill blocked at full');
    const s3 = fs.find(k => k.form === 3 && !k.ult); p.cds = {}; p.action = null; p.staggerUntil = 0; assert.equal(p.useSkill(s3.id, z, { tx: m.x, ty: m.y }), 'ok', T.name + ' full-form skill');
    const ult = fs.find(k => k.ult); for (let i = 0; i < 40; i++) z.tick(50); p.cds = {}; p.action = null; p.staggerUntil = 0; S().res = 100; S().stage = 3; const r0 = S().res; assert.equal(p.useSkill(ult.id, z, { tx: m.x, ty: m.y }), 'ok', T.name + ' ultimate'); for (let i = 0; i < 10; i++) z.tick(50); assert.ok(S().res < r0 || T.res.drain < 0, 'ultimate consumes the resource');
    // signature (special press at full), then hold to revert
    S().stage = 3; p.refreshStats(); S().sigCd = 0; for (let i = 0; i < 10; i++) z.tick(50); p.staggerUntil = 0; p.statuses = {}; p.action = null; press(z, p);
    p.staggerUntil = 0; p.statuses = {}; p.action = null; p.special('press', z); const pa0 = S().pressAt; for (let i = 0; i < 12; i++) { z.tick(50); p.special('hold', z); } assert.ok(pa0, 'pressed ' + JSON.stringify({ ca: p.canAct(z.now), act: p.action, st: p.statuses })); p.special('release', z); assert.equal(S().stage, 0, T.name + ' reverts ' + JSON.stringify({ st: S().stage, pa: S().pressAt, act: p.action, ca: p.canAct(z.now), fear: p.statuses.fear })); assert.equal(p.r, 6); for (let i = 0; i < 40; i++) z.tick(50);
    // the full form drains (doom accumulates instead)
    p.staggerUntil = 0; p.statuses = {}; p.action = null; S().res = 100; press(z, p); S().res = 100; press(z, p); S().res = 100; press(z, p); assert.equal(S().stage, 3); const before = S().res; for (let i = 0; i < 40; i++) z.tick(50);
    if (T.res.drain > 0) assert.ok(S().res < before, T.name + ' full drains'); else assert.ok(S().res >= before - 1, 'doom accumulates');
    assert.equal(ch.progress.morph.cur.wt, T.id); void keys; }
});

test('species unlock by mastery, choice changes the full form; chimera factors and mech parts change the body', () => {
  const { z, p, ch } = setup(87, 0); const s = { ch, actor: p, send() {} }; p.session = s; const out = []; s.send = x => out.push(x);
  M.morphMenu(s, { do: 'species', key: 'bear' }); assert.match(out.at(-1).v, /解放/); ch.mastery[87].lv = 40; M.morphMenu(s, { do: 'species', key: 'bear' }); assert.equal(M.speciesOf(p).key, 'bear');
  p.morph.res = 100; press(z, p); p.morph.res = 100; press(z, p); p.morph.res = 100; press(z, p); assert.equal(p.r, 13); assert.ok(p.superArmor, 'bear keeps super armor'); assert.deepEqual(M.morphCombo(p).map(x => x.morphKey), ['swipe', 'maul', 'roar']);
  // chimera
  const c = setup(106); const s2 = { ch: c.ch, actor: c.p, send: x => out.push(x) }; c.ch.mastery[88] = { lv: 10, xp: 0 }; c.ch.mastery[89] = { lv: 10, xp: 0 }; M.grantFactors(c.ch); assert.ok(c.ch.progress.morph.factors.includes('dragonWings'));
  M.morphMenu(s2, { do: 'factor', slot: 'back', key: 'dragonWings' }); M.morphMenu(s2, { do: 'factor', slot: 'arms', key: 'mantisArms' }); M.morphMenu(s2, { do: 'factor', slot: 'arms', key: 'bearArms' }); assert.match(out.at(-1).v, /持っていない/);
  M.morphMenu(s2, { do: 'save', i: 0 }); assert.equal(c.ch.progress.morph.presets[0].back, 'dragonWings');
  for (let i = 0; i < 3; i++) { c.p.morph.res = 100; press(c.z, c.p); } const keys = M.morphCombo(c.p).map(x => x.morphKey); assert.ok(keys.includes('scythe') && keys.includes('wingbeat'), 'chimera attacks come from its factors: ' + keys);
  // mech parts
  const k = setup(97); const s3 = { ch: k.ch, actor: k.p, send: x => out.push(x) }; M.morphMenu(s3, { do: 'part', slot: 'arm', key: 'drillArm' }); for (let i = 0; i < 2; i++) { k.p.morph.res = 100; press(k.z, k.p); } assert.equal(M.morphCombo(k.p)[0].morphKey, 'drill');
  void FACTOR_BY_ID;
});
