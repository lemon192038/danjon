// Awakening of the Machine God (nx05) → DEUS MACHINA (lg_deus_machina): world awakening, role AI, alarm, world outcome,
// workshop, the descent duel and the god-machine job line.
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
process.env.DATA_DIR = '/tmp/claude-0/abyss-machina-test';
fs.rmSync(process.env.DATA_DIR, { recursive: true, force: true });
const { World } = await import('../server/game/world.js');
const { store } = await import('../server/store.js');
const { DATA } = await import('../server/data.js');
const { setClockAt } = await import('../server/game/life.js');
const { MACHINA_SITES, MECH_WT } = await import('../shared/data/machina.js');
const { EVENT_BY_ID } = await import('../shared/data/events.js');
const { dealDamage } = await import('../server/game/combat.js');
await store.init(); setClockAt(130, 12);
const sleep = ms => new Promise(r => setTimeout(r, ms));

test('machine god', async () => {
  const w = new World();
  try {
    const out = []; const ws = { readyState: 1, bufferedAmount: 0, send: x => out.push(JSON.parse(x)), close() {} }; const last = t => [...out].reverse().find(m => m.t === t); const err = () => out.filter(m => m.t === 'err').at(-1)?.v;
    const r = store.register('mach', 'pass1234'); const s = w.attach(ws, r.account); w.handle(s, { t: 'create', name: '技師', wt: 1 }); w.handle(s, { t: 'play', id: last('chars').list[0].id });
    const ch = s.ch; ch.level = 80; ch.gold = 1e6; const E = w.events; const menu = m => w.handle(s, { t: 'menu', op: 'cev', ...m });
    assert.equal(EVENT_BY_ID.nx05.status, 'live'); assert.equal(EVENT_BY_ID.lg_deus_machina.status, 'live'); assert.ok(DATA.dungeons.get('machina')); assert.ok(DATA.bosses.has('deusCore'));
    const host = (ev) => { const z = w.zones.get('luminas'); w.enterZone(s, z); const n = z.map.npcs.find(x => x.ev === ev); const p = z.tileCenter([n.x, n.y]); s.actor.x = p.x; s.actor.y = p.y + 10; };
    // dormant: nothing to start; pressure from records → omen → awakening
    host('nx05'); menu({ ev: 'nx05', act: 'start' }); assert.match(err(), /まだ何も起きていない/);
    w.machina.bump(60); assert.equal(E.w.ev.nx05.state, 'omen'); w.machina.bump(45); assert.equal(E.w.ev.nx05.state, 'active');
    // sites: machines appear with roles; calm machines do not fight; attacking near a watcher raises the alarm
    const site = Object.entries(MACHINA_SITES).find(([, S]) => S.role === 'watcher')[0]; const z = w.zones.get(site); w.enterZone(s, z); w.machina.sync();
    const ms = [...z.actors.values()].filter(a => a.machina); assert.equal(ms.length, 3); assert.ok(ms.every(a => !a.machina.hostile), 'watcher site machines are calm');
    for (const a of [...z.actors.values()]) if (a.kind === 'monster' && !a.machina) z.remove(a); z.respawns.length = 0;
    s.actor.hp = s.actor.maxHp; const hp0 = s.actor.hp; s.actor.x = ms[0].x + 20; s.actor.y = ms[0].y; for (let i = 0; i < 60; i++) z.tick(50); assert.equal(s.actor.hp, hp0, 'calm machines leave the player alone');
    dealDamage(z, s.actor, ms[0], { m: 1 }, z.now); assert.ok(ms.every(a => a.machina.hostile), 'alarm spreads to every machine'); assert.ok(out.some(m => m.t === 'toast' && /警報/.test(m.v)));
    // the event: record three sites, then the control facility, then the world outcome
    host('nx05'); menu({ ev: 'nx05', act: 'start' }); menu({ ev: 'nx05', act: 'go' });
    for (const f of Object.keys(MACHINA_SITES).slice(0, 3)) { const fz = w.zones.get(f); w.enterZone(s, fz); w.useObject(s, fz, fz.map.objects.find(o => o.k === 'machinecore')); }
    assert.equal(E.prog(ch, 'nx05').stage, 2); assert.ok(Object.keys(ch.progress.machina).length >= 3);
    host('nx05'); menu({ ev: 'nx05', act: 'go' }); w.handle(s, { t: 'menu', op: 'dungeon', id: 'machina', diff: 'NORMAL', floor: 1 }); assert.equal(s.actor.zone.dungeon?.id, 'machina', 'the control facility opens');
    w.cev.onFloor(s, { dungeon: { id: 'machina' }, floor: 30 }, true); assert.equal(E.prog(ch, 'nx05').stage, 4);
    host('nx05'); menu({ ev: 'nx05', act: 'go', choice: 'allied' }); menu({ ev: 'nx05', act: 'go', choice: 'cooperate' });
    assert.ok(E.prog(ch, 'nx05').done); assert.equal(w.machina.M.outcome, 'allied'); assert.equal(E.w.ev.nx05.state, 'resolved'); assert.ok(ch.progress.titles.includes('神機の理解者')); assert.ok(ch.progress.flags.machinist);
    assert.ok(ch.jobs.ev_godmachinist, 'god-machinist job unlocked');
    // allied world: machines at every site stay calm
    w.enterZone(s, z); w.machina.sync(); assert.ok([...z.actors.values()].filter(a => a.machina).every(a => !a.machina.hostile));
    // workshop: a weapon of an official mechanical type
    ch.inventory.push({ uid: 'MP', kind: 'mat', ref: 'machinePart', n: 20 }); host('nx05'); menu({ ev: 'nx05', act: 'svc', wt: 69 }); const mw = ch.inventory.filter(i => i.kind === 'weapon').map(i => DATA.weapons.get(i.ref)); assert.ok(mw.some(x => MECH_WT.includes(x.wt)), 'mechanical weapon built');
    // DEUS MACHINA: requirements, the descent duel, and the path to デウス・エクス・マギア
    host('lg_deus_machina'); menu({ ev: 'lg_deus_machina', act: 'start' }); menu({ ev: 'lg_deus_machina', act: 'go' }); menu({ ev: 'lg_deus_machina', act: 'go' }); menu({ ev: 'lg_deus_machina', act: 'go' }); assert.match(err(), /Lv110/);
    ch.level = 130; menu({ ev: 'lg_deus_machina', act: 'go' }); menu({ ev: 'lg_deus_machina', act: 'go' }); menu({ ev: 'lg_deus_machina', act: 'go' });
    const dz = s.actor.zone; assert.equal(dz.kind, 'arena'); const deus = [...dz.actors.values()].find(a => a.duelBoss); assert.equal(deus.name, '神機デウス'); dz.kill(deus, s.actor, dz.now); await sleep(2100);
    host('lg_deus_machina'); menu({ ev: 'lg_deus_machina', act: 'go', choice: 'fuse' }); assert.ok(E.prog(ch, 'lg_deus_machina').done); assert.ok(ch.progress.titles.includes('神機降臨を見届けた者'));
    ch.jobs.ev_godpilot = { rank: 8, xp: 0 }; const { checkJobUnlocks } = await import('../server/game/progress.js'); checkJobUnlocks(ch); assert.ok(ch.jobs.ev_deusmagia, 'デウス・エクス・マギア unlocked');
  } finally { setTimeout(() => process.exit(process.exitCode || 0), 50); }
});
