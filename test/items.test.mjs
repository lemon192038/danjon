// User-requested features: trait reroll at the altar (tickets from HARD+ 50F+ bosses), artifacts (materials from
// HARD+ bosses at 10%, crafting, triggers), favorites and bulk sell by rarity.
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
process.env.DATA_DIR = '/tmp/claude-0/abyss-items-test';
fs.rmSync(process.env.DATA_DIR, { recursive: true, force: true });
const { World } = await import('../server/game/world.js');
const { store } = await import('../server/store.js');
const { DATA } = await import('../server/data.js');
const { makeMonster } = await import('../server/game/monsters.js');
const { rollArtifactMat, artTrigger } = await import('../server/game/artifacts.js');
const { ART_CONDS, artifactStats, matPower } = await import('../shared/data/artifacts.js');
const { setClockHour } = await import('../server/game/life.js');
await store.init(); setClockHour(12);

test('trait reroll, artifacts, favorites, bulk sell', async () => {
  const w = new World();
  try {
    const out = []; const ws = { readyState: 1, send: x => out.push(JSON.parse(x)), close() {} }; const last = t => [...out].reverse().find(m => m.t === t); const err = () => out.filter(m => m.t === 'err').at(-1)?.v;
    const r = store.register('crafter', 'pass1234'); const s = w.attach(ws, r.account); w.handle(s, { t: 'create', name: '細工師', wt: 1 }); w.handle(s, { t: 'play', id: last('chars').list[0].id });
    const ch = s.ch; ch.level = 99; ch.gold = 5e6;
    // ── boss drops: HARD 50F+ → 2 tickets guaranteed; NORMAL / <50F → none
    const boss = async (diff, floor) => { const z = w.instance('t' + diff + floor, 'd02', diff, floor); w.enterZone(s, z); const b = makeMonster('golem', 60, diff); b.boss = true; w.onBossKilled(z, b); };
    const tickets = () => ch.inventory.filter(i => i.ref === 'traitTicket').reduce((t, i) => t + i.n, 0);
    await boss('NORMAL', 60); assert.equal(tickets(), 0); await boss('HARD', 40); assert.equal(tickets(), 0); await boss('HARD', 50); assert.equal(tickets(), 2); await boss('ABYSS', 70); assert.equal(tickets(), 4);
    // ── trait reroll at an altar
    const wpn = DATA.wtWeapons.get(1).find(x => x.traits.length >= 2); ch.inventory.push({ uid: 'T1', kind: 'weapon', ref: wpn.id, plus: 0 });
    const cz = w.zones.get('celestia_holy'); w.enterZone(s, cz); w.enterBuilding(s, cz.map.doors.find(d => d.t === 'church'));
    const alt = s.actor.zone.map.objects.find(o => o.k === 'altar'); assert.ok(alt, 'church has an altar'); const p = s.actor.zone.tileCenter([alt.x, alt.y]); s.actor.x = p.x; s.actor.y = p.y; out.length = 0; w.handle(s, { t: 'interact' }); assert.equal(last('open').service, 'altar');
    const before = wpn.traits.map(t => t.key); w.handle(s, { t: 'menu', op: 'trait', uid: 'T1', slot: 1 }); const it = ch.inventory.find(i => i.uid === 'T1');
    assert.ok(it.traits, 'instance traits'); assert.equal(it.traits[0].key, before[0], 'untouched slot kept'); assert.ok(!before.includes(it.traits[1].key), 'new trait differs'); assert.equal(tickets(), 3);
    assert.equal(DATA.weapons.get(wpn.id).traits[1].key, before[1], 'catalog weapon unchanged');
    ch.equip.weapon = 'T1'; s.actor.refreshStats(); // traits flow into stats without error
    w.exitBuilding(s); w.handle(s, { t: 'menu', op: 'trait', uid: 'T1', slot: 0 }); assert.ok(err().includes('祭壇'), 'only at an altar');
    // ── artifact materials: 10% from HARD+ bosses only
    const hz = w.instance('art', 'd05', 'HARD', 80); let n = 0; for (let k = 0; k < 2000; k++) if (rollArtifactMat(hz, { inventory: [] })) n++; assert.ok(n > 140 && n < 270, 'about 10%: ' + n);
    assert.equal(rollArtifactMat(w.instance('artN', 'd05', 'NORMAL', 80), { inventory: [] }), null);
    // stricter condition → bigger effect; deeper boss → bigger & longer
    const p1 = matPower(50, 'HARD'), p2 = matPower(100, 'ABYSS'); assert.ok(p2 > p1);
    assert.ok(artifactStats('summon', 'atk', p1, p1).val > artifactStats('kill', 'atk', p1, p1).val); assert.ok(artifactStats('kill', 'atk', p2, p2).val > artifactStats('kill', 'atk', p1, p1).val);
    assert.ok(artifactStats('kill', 'fire', p1, p1).val > artifactStats('kill', 'atk', p1, p1).val, 'elemental % larger');
    // craft at a blacksmith and equip; triggers apply buffs (skill stacks up to 5)
    ch.inventory.push({ uid: 'C1', kind: 'amat', ref: 'acond', key: 'skill', dg: 'd05', floor: 80, diff: 'HARD', pow: matPower(80, 'HARD'), n: 1 }, { uid: 'E1', kind: 'amat', ref: 'aeff', key: 'atk', dg: 'd02', floor: 90, diff: 'HELL', pow: matPower(90, 'HELL'), n: 1 });
    const az = w.zones.get('arcelia'); w.enterZone(s, az); w.enterBuilding(s, az.map.doors.find(d => d.svc === 'smith'));
    w.handle(s, { t: 'menu', op: 'artifact', cond: 'C1', eff: 'E1' }); const art = ch.inventory.find(i => i.kind === 'artifact'); assert.ok(art, 'crafted ' + err()); assert.ok(!ch.inventory.some(i => i.uid === 'C1' || i.uid === 'E1'), 'materials consumed');
    w.handle(s, { t: 'menu', op: 'equip', uid: art.uid, slot: 'art2' }); assert.equal(ch.equip.art2, art.uid);
    for (let k = 0; k < 7; k++) artTrigger(s.actor, 'skill'); assert.ok(Math.abs(s.actor.buffMods.atk - art.val * 5) < 1e-9, 'stacks capped at 5');
    artTrigger(s.actor, 'crit'); assert.ok(!s.actor.buffs.some(b => b.src?.startsWith('art_') && b.mods.crit), 'other conditions do not fire');
    assert.ok(ART_CONDS.mark && ART_CONDS.summon);
    // ── favorites & bulk sell
    for (const [u, rr] of [['A', 1], ['B', 1], ['C', 2], ['D', 3]]) ch.inventory.push({ uid: u, kind: 'weapon', ref: DATA.wtWeapons.get(2).find(x => x.rar === rr).id, plus: 0 });
    w.handle(s, { t: 'menu', op: 'fav', uid: 'B' }); assert.equal(ch.inventory.find(i => i.uid === 'B').fav, true);
    w.handle(s, { t: 'menu', op: 'sell', uid: 'B' }); assert.ok(err().includes('お気に入り'));
    const g0 = ch.gold; const eqW = ch.equip.weapon; w.handle(s, { t: 'menu', op: 'sellBulk', rars: [1, 2] });
    for (const u of ['A', 'C']) assert.ok(!ch.inventory.some(i => i.uid === u), 'sold ' + u); for (const u of ['B', 'D', eqW]) assert.ok(ch.inventory.some(i => i.uid === u), 'kept ' + u); assert.ok(ch.gold > g0);
    w.handle(s, { t: 'menu', op: 'sell', uid: ch.inventory.find(i => i.ref === 'traitTicket').uid }); assert.ok(err().includes('売却できません'));
    // persistence
    w.save(s); const back = store.loadChar(ch.id); assert.ok(back.inventory.find(i => i.uid === 'T1').traits && back.inventory.find(i => i.uid === 'B').fav && back.equip.art2 === art.uid);
  } finally { setTimeout(() => process.exit(process.exitCode || 0), 50); }
});
