// Integration test of the full gameplay loop through World message handling (no network).
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
process.env.DATA_DIR = '/tmp/claude-0/abyss-world-test';
fs.rmSync(process.env.DATA_DIR, { recursive: true, force: true });
const { World } = await import('../server/game/world.js');
const { store } = await import('../server/store.js');
const { DATA } = await import('../server/data.js');
await store.init();

function client(world, user) {
  const out = []; const ws = { readyState: 1, send: s => out.push(JSON.parse(s)), close() {} };
  const r = store.register(user, 'pass1234'); const s = world.attach(ws, r.account);
  return { s, out, last: t => [...out].reverse().find(m => m.t === t), send: m => world.handle(s, m) };
}
const tickZone = (z, n = 1) => { for (let i = 0; i < n; i++) z.tick(50); };

test('full loop', async () => {
  const world = new World();
  try {
  const a = client(world, 'alice');
  // myth weapon types cannot be chosen at creation
  a.send({ t: 'create', name: 'ズル', wt: 80 }); assert.match(a.last('err').v, /初期選択/);
  a.send({ t: 'create', name: 'アリス', wt: 3, look: {} });
  const cid = a.last('chars').list[0].id; a.send({ t: 'play', id: cid });
  assert.equal(a.s.actor.zone.id, 'haven');
  // shop & item
  a.send({ t: 'menu', op: 'buy', kind: 'item', ref: 'hp', n: 2 }); assert.ok(a.s.ch.inventory.find(i => i.ref === 'hp').n >= 7);
  // quest accept
  const board = (await import('../server/game/progress.js')).questBoard('haven', Math.floor(Date.now() / 86400000));
  const kq = board.find(q => q.kind === 'kill'); a.send({ t: 'menu', op: 'quest', act: 'accept', id: kq.id }); assert.ok(a.s.ch.progress.quests[kq.id]);
  // enter dungeon
  a.send({ t: 'menu', op: 'dungeon', id: 'd01', diff: 'NORMAL', floor: 1 });
  const z = a.s.actor.zone; assert.equal(z.kind, 'dungeon');
  // stepping on the exit tile must NOT leave the dungeon; interacting opens a confirmation
  { const ex = z.map.exit; assert.ok(ex); const c = z.tileCenter(ex); a.s.actor.x = c.x; a.s.actor.y = c.y; world.checkTiles(a.s); assert.equal(a.s.actor.zone, z); a.send({ t: 'interact' }); assert.equal(a.last('open').service, 'exit'); const st = z.tileCenter(z.map.start); a.s.actor.x = st.x; a.s.actor.y = st.y; }
  const p = a.s.actor; const mons = [...z.actors.values()].filter(m => m.kind === 'monster');
  // kill monsters by fighting
  let killed = 0;
  for (const m of mons.slice(0, 4)) { m.x = p.x + 20; m.y = p.y; for (let i = 0; i < 400 && !m.dead; i++) { p.input = { atk: true }; p.aimX = m.x; p.aimY = m.y; if (p.hp < p.maxHp * 0.5) p.hp = p.maxHp; tickZone(z); } if (m.dead) killed++; }
  assert.ok(killed >= 3, 'killed ' + killed);
  assert.ok(a.s.ch.progress.kills >= 3); assert.ok(a.s.ch.xp > 0 || a.s.ch.level > 1); assert.ok(a.s.ch.mastery[3].xp > 0 || a.s.ch.mastery[3].lv > 1);
  // quest progress from kills of the right family
  a.s.ch.progress.quests[kq.id].prog = kq.n - 1; world.questCheck(a.s, { kind: 'kill', fam: kq.fam }); assert.ok(a.s.ch.progress.quests[kq.id].ready);
  // boss floor -> stairs open after kill
  a.send({ t: 'menu', op: 'leave' }); assert.equal(a.s.actor.zone.kind, 'town');
  a.s.ch.progress.clears.d01 = { NORMAL: 9 };
  const bz = world.instance(a.s.ch.id, 'd01', 'NORMAL', 10); bz.returnTo = 'haven'; world.enterZone(a.s, bz);
  const boss = bz.actors.get(bz.bossId); assert.ok(boss?.boss);
  bz.kill(boss, a.s.actor, bz.now); assert.ok(bz.map.stairsOpen); assert.ok(a.s.ch.progress.bossKills.NORMAL >= 1);
  // death & respawn
  const pa = a.s.actor; pa.hp = 1; bz.kill(pa, boss, bz.now); assert.equal(a.last('note').k, 'dead');
  a.send({ t: 'respawn' }); assert.equal(a.s.actor.zone.id, 'haven'); assert.ok(!a.s.actor.dead);
  // enhancement at smith
  const w = a.s.ch.inventory.find(i => i.kind === 'weapon'); a.s.ch.gold = 1e6; a.s.ch.inventory.find(i => i.ref === 'ore').n = 50;
  for (let i = 0; i < 6; i++) a.send({ t: 'menu', op: 'enhance', uid: w.uid }); assert.ok(w.plus >= 1);
  // job change: base job allowed, locked advanced job refused
  a.send({ t: 'menu', op: 'job', id: 'mage_0' }); assert.equal(a.s.ch.job, 'mage_0');
  a.send({ t: 'menu', op: 'job', id: 'mage_22' }); assert.equal(a.s.ch.job, 'mage_0');
  // skill slot assignment validation
  a.send({ t: 'menu', op: 'slot', i: 0, id: DATA.levelSkills[30].id }); assert.ok(a.last('err').v.includes('使用できません'));
  // NPC adventurer invite & follow into dungeon
  const n = world.npcs.list.find(x => x.state === 'rest') || world.npcs.list[0]; n.state = 'rest'; n.zone = 'haven'; world.npcs.spawn(n, a.s.actor.zone); n.bond[a.s.ch.id] = 50;
  a.send({ t: 'menu', op: 'npcInvite', id: n.id }); const party = world.partyOf(a.s.ch.id); assert.ok(party?.npcs.includes(n.id));
  a.send({ t: 'menu', op: 'dungeon', id: 'd01', diff: 'NORMAL', floor: 1 });
  assert.ok([...a.s.actor.zone.actors.values()].some(x => x.kind === 'npc' && x.npc === n), 'npc followed into dungeon');
  // second player: party invite & shared instance
  const b = client(world, 'bob'); b.send({ t: 'create', name: 'ボブ', wt: 44 }); b.send({ t: 'play', id: b.last('chars').list[0].id });
  a.send({ t: 'menu', op: 'leave' }); a.send({ t: 'menu', op: 'invite', name: 'ボブ' }); b.send({ t: 'menu', op: 'accept', pid: b.last('invite').pid });
  assert.deepEqual(world.partyOf(b.s.ch.id).members.sort(), [a.s.ch.id, b.s.ch.id].sort());
  a.send({ t: 'menu', op: 'dungeon', id: 'd02', diff: 'NORMAL', floor: 1 });
  assert.equal(a.s.actor.zone, b.s.actor.zone, 'party shares instance');
  // snapshots carry entities of both players
  world.broadcast(a.s.actor.zone); const snap = a.last('s'); assert.ok(snap.ents.some(e => e[0] === b.s.actor.id));
  // NPC abstract simulation progresses
  for (let i = 0; i < 200; i++) world.npcs.abstractTick();
  assert.ok(world.npcs.list.some(x => x.log.length > 0));
  world.saveAll(); assert.ok(store.loadChar(a.s.ch.id).progress.kills >= 3);
  } finally { setTimeout(() => process.exit(process.exitCode || 0), 50); }
});
