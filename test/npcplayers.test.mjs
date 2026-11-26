// Quick potion slots (choose which potion Q/E use) and NPC players living in every town.
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
process.env.DATA_DIR = '/tmp/claude-0/abyss-npcp-test';
fs.rmSync(process.env.DATA_DIR, { recursive: true, force: true });
const { World } = await import('../server/game/world.js');
const { store } = await import('../server/store.js');
const { PER_TOWN } = await import('../server/game/npc.js');
await store.init();

test('potion slots and npc players', async () => {
  const w = new World();
  try {
    const out = []; const ws = { readyState: 1, bufferedAmount: 0, send: x => out.push(JSON.parse(x)), close() {} }; const last = t => [...out].reverse().find(m => m.t === t); const err = () => out.filter(m => m.t === 'err').at(-1)?.v;
    const r = store.register('npcp', 'pass1234'); const s = w.attach(ws, r.account); w.handle(s, { t: 'create', name: '薬師', wt: 1 }); w.handle(s, { t: 'play', id: last('chars').list[0].id });
    const ch = s.ch; const a = () => s.actor;
    // potion slots: default Q=hp E=sp; set Q to elixir / E to a tonic; invalid refs are refused
    ch.inventory.push({ uid: 'E1', kind: 'potion', ref: 'elixir', n: 2 }, { uid: 'T1', kind: 'potion', ref: 'atkTonic', n: 1 });
    w.handle(s, { t: 'menu', op: 'potSlot', i: 0, ref: 'elixir' }); w.handle(s, { t: 'menu', op: 'potSlot', i: 1, ref: 'atkTonic' }); assert.deepEqual(ch.potSlots, ['elixir', 'atkTonic']);
    w.handle(s, { t: 'menu', op: 'potSlot', i: 0, ref: 'ore' }); assert.match(err(), /設定できません/); assert.equal(ch.potSlots[0], 'elixir');
    a().hp = 1; a().sp = 0; w.handle(s, { t: 'potion', ref: 'elixir' }); assert.equal(a().hp, a().maxHp); assert.equal(a().sp, a().maxSp); assert.equal(ch.inventory.find(i => i.ref === 'elixir').n, 1);
    w.handle(s, { t: 'potion', ref: 'atkTonic' }); assert.ok(ch.inventory.some(i => i.ref === 'atkTonic'), 'cooldown blocks a second potion right away');
    a().potCd = 0; w.handle(s, { t: 'potion', ref: 'atkTonic' }); assert.ok(a().buffs.some(b => b.src === 'item_atkTonic'), 'tonic buff applied');
    // NPC players: every town has home-town adventurers; resting ones appear when a player visits
    const towns = w.npcs.towns(); assert.ok(towns.length >= 40); for (const t of towns) assert.ok(w.npcs.list.filter(n => n.home === t).length >= PER_TOWN, t);
    for (const t of ['frostheim', 'nereia', 'azradia', 'gravel', 'cele_arca']) { const z = w.zones.get(t); if (!z) continue; for (const n of w.npcs.list.filter(n => n.home === t)) { n.state = 'rest'; n.zone = t; } w.enterZone(s, z); w.npcs.syncZones(); const here = [...z.actors.values()].filter(x => x.kind === 'npc'); assert.ok(here.length >= PER_TOWN, `${t}: ${here.length} NPC players present`); }
    const lv = w.npcs.list.filter(n => n.home === 'valcanos').map(n => n.ch.level); if (lv.length) assert.ok(Math.min(...lv) >= 55, 'regional level band');
    // they talk when someone is near
    const z = w.zones.get('frostheim'); w.enterZone(s, z); w.npcs.syncZones(); const np = [...z.actors.values()].find(x => x.kind === 'npc'); s.actor.x = np.x + 10; s.actor.y = np.y; np.chatAt = 0; z.fxq.length = 0; w.npcs.fighterTick(z, np, z.now + 1); assert.ok(z.fxq.some(f => f.t === 'say' && f.id === np.id), 'NPC player said something');
  } finally { setTimeout(() => process.exit(process.exitCode || 0), 50); }
});
