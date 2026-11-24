// PHASE 4 weapon expansion: heavy attack for all 86 types, mastery follow-up/extra hit, mastery titles,
// weapon individual history + epithet (名もなき武器 event), evolution path with materials, server-side checks.
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
process.env.DATA_DIR = '/tmp/claude-0/abyss-weapons-test';
fs.rmSync(process.env.DATA_DIR, { recursive: true, force: true });
const { Zone } = await import('../server/game/zone.js');
const { Fighter } = await import('../server/game/actor.js');
const { makeMonster } = await import('../server/game/monsters.js');
const { newCharacter, grantMastery, weaponHistory, evolveRecipe } = await import('../server/game/progress.js');
const { DATA } = await import('../server/data.js');
const { WEAPON_TYPES, categoryOf } = await import('../shared/data/weaponTypes.js');
const { World } = await import('../server/game/world.js');
const { store } = await import('../server/store.js');
await store.init();
const fakeWorld = { onMonsterKilled() {}, onBossKilled() {}, onFighterDied() {}, npcs: { fighterTick() {} } };
function arena() { const z = new Zone(fakeWorld, 'dg:wt:d01:NORMAL:3', { kind: 'dungeon', dungeon: 'd01', diff: 'NORMAL', floor: 3 }); for (const a of [...z.actors.values()]) z.remove(a); z.map.tiles.fill(1); return z; }
function rig(wt, mastery) {
  const z = arena(); const ch = newCharacter('h' + wt.id, 'H', 1, {}); const w = DATA.wtWeapons.get(wt.id)[50];
  ch.inventory.push({ uid: 'W', kind: 'weapon', ref: w.id, plus: 0 }); ch.equip.weapon = 'W'; ch.level = 60; ch.mastery[wt.id] = { lv: mastery, xp: 0 };
  const p = new Fighter(ch, { kind: 'player', team: 'ally' }); p.x = 200; p.y = 200; p.facing = 0; z.add(p); p.sp = p.maxSp = 9999;
  const m = makeMonster('golem', 30, 'NORMAL'); m.x = 228; m.y = 200; m.maxHp = m.hp = 1e9; m.stats.atk = 1; m.stats.def = 0; m.canAct = () => false; z.add(m);
  let dealt = 0; const of = z.fx.bind(z); z.fx = o => { if (o.t === 'dmg' && !o.a && !o.h && !o.dot) dealt += o.v; of(o); };
  return { z, p, m, ch, dealt: () => { const d = dealt; dealt = 0; return d; } };
}
const run = (z, ms) => { for (let t = 0; t < ms / 50; t++) z.tick(50); };

test('heavy attack works for all 86 weapon types and is stronger than a basic hit', () => {
  const weak = [];
  for (const wt of WEAPON_TYPES) {
    const r = rig(wt, 1); const { z, p } = r;
    p.stats.crit = 0; p.comboStep = wt.combo.length - 1; p.lastAttackEnd = z.now; p.attack(z.now, z); run(z, 3000); const basic = r.dealt(); // the same finisher swung normally
    p.x = 200; p.y = 200; p.facing = 0; r.m.x = 228; r.m.y = 200; r.m.vx = r.m.vy = 0;
    { const r0 = p.heavy(z); assert.equal(r0, 'ok', wt.name + ' ' + r0); } assert.ok(p.action.superArmor); assert.notEqual(p.heavy(z), 'ok', 'no overlap');
    run(z, 2500); const hv = r.dealt(); if (!(hv > basic)) weak.push(`${wt.name}: basic ${basic} heavy ${hv}`);
    { const rr = p.heavy(z); assert.equal(rr, 'ok', 'usable again after cooldown ' + wt.name + ' ' + rr + ' ' + JSON.stringify(p.action) + ' ' + p.canAct(z.now) + ' ' + JSON.stringify(p.statuses)); }
  }
  assert.deepEqual(weak, []);
});

test('mastery techniques: finisher follow-up (30) and extra shockwave (60)', () => {
  const wt = WEAPON_TYPES[0]; const lo = rig(wt, 1), hi = rig(wt, 60);
  for (const r of [lo, hi]) { r.p.heavy(r.z); run(r.z, 2500); }
  assert.ok(hi.dealt() > lo.dealt() * 1.2, 'extra hit + mastery scaling');
  // follow-up: heavy right after the combo finisher → instant charge
  const f = rig(wt, 30); const n = wt.combo.length; let guard = 0;
  while (!(f.p.action?.type === 'attack' && f.p.action.step === n - 1 && f.z.now >= f.p.action.recAt) && guard++ < 400) { f.p.input = { atk: true }; f.z.tick(20); }
  f.p.input = {}; f.p.heavyCd = 0; assert.ok(guard < 400, 'reached finisher recovery');
  const t0 = f.z.now; assert.equal(f.p.heavy(f.z), 'ok'); assert.ok(f.p.action.hitAt - t0 <= 130, 'follow-up has no long charge');
});

test('mastery titles, weapon history, epithet, evolution', async () => {
  const w = new World();
  try {
    const out = []; const ws = { readyState: 1, send: x => out.push(JSON.parse(x)), close() {} }; const last = t => [...out].reverse().find(m => m.t === t);
    const r = store.register('smith', 'pass1234'); const s = w.attach(ws, r.account); w.handle(s, { t: 'create', name: '鍛冶好き', wt: 1 }); w.handle(s, { t: 'play', id: last('chars').list[0].id });
    const ch = s.ch; ch.level = 99; ch.gold = 1e7;
    // titles at 25/50/75/100
    grantMastery(ch, 1, 1e9, () => {}); for (const t of ['の使い手', 'の熟達者', 'の達人', 'の極致']) assert.ok(ch.progress.titles.includes(WEAPON_TYPES[0].name + t), t);
    // history & epithet
    const it = ch.inventory.find(i => i.uid === ch.equip.weapon); const atk0 = s.actor.stats.atk;
    for (let i = 0; i < 299; i++) weaponHistory(ch, { kill: true, fam: 'slime' }); assert.equal(it.epi, undefined);
    const m = makeMonster('slime', 1, 'NORMAL'); m.x = s.actor.x; m.y = s.actor.y; s.actor.zone.add(m); w.onMonsterKilled(s.actor.zone, m, s.actor);
    assert.ok(it.epi, 'epithet at 300 kills'); assert.ok(it.epi.name.includes(DATA.families.get('slime').name)); s.actor.refreshStats(); assert.ok(s.actor.stats.atk > atk0, 'epithet bonus applied');
    assert.ok(w.events.isDone(ch, 'lg_unnamed_arms')); assert.ok(ch.progress.titles.includes('武器に刻む者'));
    // evolution recipe & server checks
    const wd = DATA.weapons.get(it.ref); const rc = evolveRecipe(wd, categoryOf(wd.wt).id); assert.ok(rc && DATA.weapons.get(rc.to).rar > wd.rar);
    w.handle(s, { t: 'menu', op: 'evoInfo', uid: it.uid }); assert.equal(last('evoInfo').recipe.to, rc.to); assert.ok(last('evoInfo').hist.k >= 300);
    w.handle(s, { t: 'menu', op: 'evolve', uid: it.uid }); assert.ok(last('err').v.includes('+10'), 'needs +10');
    it.plus = 12; w.handle(s, { t: 'menu', op: 'evolve', uid: it.uid }); assert.ok(last('err').v.includes('素材'), 'needs materials');
    for (const [k, n] of Object.entries(rc.mats)) ch.inventory.push({ uid: 'm' + k, kind: 'mat', ref: k, n });
    w.handle(s, { t: 'menu', op: 'evolve', uid: it.uid }); assert.equal(it.ref, rc.to); assert.equal(it.plus, 6); assert.equal(ch.equip.weapon, it.uid); assert.ok(it.hist.k >= 300 && it.hist.evo.length === 1, 'history carried over');
    // every non-final weapon of every type has a valid evolution target of higher rarity
    for (const wt of WEAPON_TYPES) { const list = DATA.wtWeapons.get(wt.id); const r1 = evolveRecipe(list[0], categoryOf(wt.id).id); assert.ok(r1 && r1.to.startsWith(wt.id + '_'), wt.name); assert.equal(evolveRecipe(list.at(-1), categoryOf(wt.id).id), null); }
    // heavy input over the network path
    w.handle(s, { t: 'heavy', ax: s.actor.x + 30, ay: s.actor.y }); assert.equal(s.actor.action?.type, 'heavy');
  } finally { setTimeout(() => process.exit(process.exitCode || 0), 50); }
});
