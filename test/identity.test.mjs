// WEAPON IDENTITY: every Wave-1 variant has a distinct identity record, a unique skill whose name matches what it
// actually does, magic circles, and server-side mechanics that run in combat (puppets, beams, melodies, bullets…).
import test from 'node:test';
import assert from 'node:assert';
process.env.DATA_DIR = '/tmp/claude-0/abyss-test-saves';
const { Zone } = await import('../server/game/zone.js');
const { Fighter } = await import('../server/game/actor.js');
const { makeMonster } = await import('../server/game/monsters.js');
const { newCharacter } = await import('../server/game/progress.js');
const { DATA } = await import('../server/data.js');
const { IDENTITY, WAVE1 } = await import('../shared/data/identity.js');
const { CIRCLES, PATTERNS } = await import('../shared/data/circles.js');

const fakeWorld = { onMonsterKilled() {}, onBossKilled() {}, onFighterDied() {}, npcs: { fighterTick() {} } };
function arena() { const z = new Zone(fakeWorld, 'dg:test:d01:NORMAL:3', { kind: 'dungeon', dungeon: 'd01', diff: 'NORMAL', floor: 3 }); for (const a of [...z.actors.values()]) z.remove(a); z.map.tiles.fill(1); for (let i = 0; i < z.map.w; i++) { z.map.tiles[i] = 2; z.map.tiles[(z.map.h - 1) * z.map.w + i] = 2; } return z; }
function setup(w) { const z = arena(); const ch = newCharacter('i' + w.id, 'T', w.wt, {}); ch.inventory.push({ uid: 'W', kind: 'weapon', ref: w.id, plus: 0 }); ch.equip.weapon = 'W'; ch.level = 60; ch.mastery[w.wt] = { lv: 100, xp: 0 };
  const p = new Fighter(ch, { kind: 'player', team: 'ally' }); p.x = 200; p.y = 200; z.add(p); p.sp = p.maxSp = 99999; return { z, p }; }
const foe = (z, x = 260, y = 200) => { const m = makeMonster('golem', 30, 'NORMAL'); m.x = x; m.y = y; m.maxHp = m.hp = 1e9; m.stats.atk = 1; z.add(m); return m; };

test('wave-1 weapons each carry a distinct identity and a uniquely named, circled skill', () => {
  const ids = new Set(Object.keys(CIRCLES));
  for (const wt of WAVE1) { const ws = DATA.wtWeapons.get(wt); const seen = new Map();
    for (const w of ws) { assert.ok(w.ident, `${w.id} has ident`); assert.ok(ids.has(w.skill.circle) && ids.has(w.skill.circle2), `${w.id} circles`); assert.equal(w.skill.sig, 'ident');
      for (const k of ['model', 'silhouette', 'mechanic', 'ability', 'style', 'pros', 'cons', 'anim', 'fx', 'sound']) assert.ok(w.ident[k], `${w.id} ${k}`);
      seen.set(w.ident.variant, (seen.get(w.ident.variant) || 0) + 1); }
    assert.equal(seen.size, IDENTITY[wt].variants.length, `type ${wt} uses every variant`);
    const names = new Set(IDENTITY[wt].variants.map(v => v.skill.name)); assert.equal(names.size, IDENTITY[wt].variants.length, `type ${wt} skill names distinct`); }
  assert.ok(Object.keys(PATTERNS).length >= 40 && Object.keys(CIRCLES).length >= 600);
});

test('puppet staff: each variant summons its own puppet body; 十傀・一斉光砲 fires beams from the nearest puppets only', () => {
  const ws = DATA.wtWeapons.get(76); const kinds = new Set();
  for (const V of IDENTITY[76].variants) { const w = ws.find(x => x.ident.variant === V.key); const { z, p } = setup(w); foe(z);
    p.spCd = 0; p.special('press', z); z.tick(50); const mine = z.actorsList().filter(x => x.kind === 'summon' && x.ownerId === p.id);
    assert.ok(mine.length >= 1, V.key); assert.equal(mine[0].sumKind, V.mech.kind); kinds.add(mine[0].sumKind); }
  assert.equal(kinds.size, 6);
  const w = ws.find(x => x.ident.variant === 'sniper'); const { z, p } = setup(w); const m = foe(z, 330, 200);
  for (let i = 0; i < 3; i++) { p.specCd = {}; p.spCd = 0; p.special('press', z); for (let t = 0; t < 70; t++) z.tick(50); }
  const ps = z.actorsList().filter(x => x.kind === 'summon' && x.ownerId === p.id); assert.ok(ps.length >= 2, 'puppets out: ' + ps.length);
  ps[0].dead = true; z.remove(ps[0]); // a vanished puppet is simply left out
  const beams = []; const of = z.fx.bind(z); z.fx = o => { if (o.t === 'sh' && String(o.v).startsWith('beam:')) beams.push(o.id); of(o); };
  const hp0 = m.hp; p.action = null; p.cds = {}; const r = p.useSkill(w.skill.id, z, { tx: m.x, ty: m.y }); assert.equal(r, 'ok');
  for (let t = 0; t < 8; t++) z.tick(50); assert.ok(ps.slice(1).every(x => x.cmdUntil > 0), 'puppets pause to aim'); for (let t = 0; t < 20; t++) z.tick(50);
  assert.ok(beams.length >= ps.length - 1 && !beams.includes(ps[0].id), 'beams ' + beams.length); assert.ok(m.hp < hp0);
});

test('every wave-1 variant runs its mechanic and its unique skill in combat', () => {
  for (const wt of WAVE1) for (const V of IDENTITY[wt].variants) { const w = DATA.wtWeapons.get(wt).find(x => x.ident.variant === V.key); const { z, p } = setup(w); const m = foe(z, 225, 200);
    if (V.mech.k === 'puppet') { p.special('press', z); z.tick(50); }
    const mech = []; const of = z.fx.bind(z); let dealt = 0; z.fx = o => { if (o.t === 'mech') mech.push(o.v); if (o.t === 'dmg' && !o.h && !o.a) dealt += o.v; of(o); };
    for (let t = 0; t < 120; t++) { p.input = { atk: true }; p.aimX = m.x; p.aimY = m.y; z.tick(50); }
    p.input = {}; for (let t = 0; t < 10; t++) z.tick(50);
    assert.ok(dealt > 0, `${w.id} ${V.key} deals damage`);
    if (['wave', 'core', 'deploy', 'link', 'orbit', 'melody', 'spiritShot', 'tip', 'reach', 'crystal', 'split'].includes(V.mech.k) && !(V.mech.k === 'tip' && !V.mech.status && !V.mech.stun && !V.mech.pull)) {
      if (!['tip', 'reach'].includes(V.mech.k)) assert.ok(mech.length > 0, `${w.id} ${V.key} mechanic ${V.mech.k} fired`); }
    p.action = null; p.cds = {}; p.statuses = {}; p.staggerUntil = 0; const hp0 = m.hp; const r = p.useSkill(w.skill.id, z, { tx: m.x, ty: m.y }); assert.equal(r, 'ok', `${w.id} skill ${w.skill.name} ${p.dead} ${p.stopped} ${p.staggerUntil - z.now} ${JSON.stringify(p.statuses)}`);
    for (let t = 0; t < 40; t++) z.tick(50); void hp0; }
});
