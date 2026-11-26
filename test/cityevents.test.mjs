// PHASE 6: twenty city events (hosts, steps, schedules, services, world effects).
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
process.env.DATA_DIR = '/tmp/claude-0/abyss-cev-test';
fs.rmSync(process.env.DATA_DIR, { recursive: true, force: true });
const { World } = await import('../server/game/world.js');
const { store } = await import('../server/store.js');
const { setClockAt } = await import('../server/game/life.js');
const { CITY_EVENTS } = await import('../shared/data/cityevents.js');
const { EVENT_BY_ID } = await import('../shared/data/events.js');
await store.init(); setClockAt(70, 12); // day 70: 70 % 7 = 0 → festival on
const sleep = ms => new Promise(r => setTimeout(r, ms));

test('city events', async () => {
  const w = new World();
  try {
    const out = []; const ws = { readyState: 1, bufferedAmount: 0, send: x => out.push(JSON.parse(x)), close() {} }; const last = t => [...out].reverse().find(m => m.t === t); const err = () => out.filter(m => m.t === 'err').at(-1)?.v;
    const r = store.register('cevs', 'pass1234'); const s = w.attach(ws, r.account); w.handle(s, { t: 'create', name: '街歩き', wt: 1 }); w.handle(s, { t: 'play', id: last('chars').list[0].id });
    const ch = s.ch; ch.level = 60; ch.gold = 1e6; const E = w.events; const menu = m => w.handle(s, { t: 'menu', op: 'cev', ...m });
    // all twenty registered as live with real stage names, and every host placed in its city
    assert.equal(Object.keys(CITY_EVENTS).length, 20);
    for (const [id, D] of Object.entries(CITY_EVENTS)) { assert.equal(EVENT_BY_ID[id].status, 'live', id); for (const h of D.hosts || [D.host]) { const z = w.zones.get(h.city); assert.ok(z.map.npcs.some(n => n.service === 'cev' && n.ev === id), `${id} host in ${h.city}`); } }
    const goHost = (ev, city) => { const z = w.zones.get(city || (CITY_EVENTS[ev].hosts ? CITY_EVENTS[ev].hosts[0] : CITY_EVENTS[ev].host).city); if (s.actor.zone !== z) w.enterZone(s, z); const n = z.map.npcs.find(x => x.ev === ev); const p = z.tileCenter([n.x, n.y]); s.actor.x = p.x; s.actor.y = p.y + 10; return z; };
    // interact opens the panel
    goHost('ct_vanished_district'); out.length = 0; w.handle(s, { t: 'interact' }); assert.equal(last('open').service, 'cev'); assert.equal(last('open').data.ev, 'ct_vanished_district');
    // linear event: visit → quiz → talk → duel → choice (world effect)
    menu({ ev: 'ct_vanished_district', act: 'start' }); menu({ ev: 'ct_vanished_district', act: 'go' });
    const vz = w.zones.get('vermion'); for (const id of ['w_vermion_tavern', 'w_vermion_bank', 'w_vermion_station']) { w.enterZone(s, vz); w.enterBuilding(s, vz.map.doors.find(d => d.id === id)); }
    assert.equal(E.prog(ch, 'ct_vanished_district').stage, 2, 'visited all three ' + JSON.stringify(E.prog(ch, 'ct_vanished_district')) + s.actor.zone.id + err());
    goHost('ct_vanished_district'); menu({ ev: 'ct_vanished_district', act: 'go', choice: '0' }); assert.match(err(), /違う/); menu({ ev: 'ct_vanished_district', act: 'go', choice: '1' }); menu({ ev: 'ct_vanished_district', act: 'go' });
    menu({ ev: 'ct_vanished_district', act: 'go' }); const dz = s.actor.zone; assert.equal(dz.kind, 'arena'); const boss = [...dz.actors.values()].find(a => a.duelBoss); dz.kill(boss, s.actor, dz.now); await sleep(2100);
    assert.equal(s.actor.zone.id, 'vermion'); assert.equal(E.prog(ch, 'ct_vanished_district').stage, 5);
    const sup0 = w.econ.supply.vermion.grain ?? Object.values(w.econ.supply.vermion)[0]; goHost('ct_vanished_district'); menu({ ev: 'ct_vanished_district', act: 'go', choice: 'restore' });
    assert.ok(E.prog(ch, 'ct_vanished_district').done); assert.ok(ch.progress.titles.includes('消えた街を見つけた者')); assert.equal(E.flag('ct:suzuran'), 'restored'); assert.ok((w.econ.supply.vermion.grain ?? Object.values(w.econ.supply.vermion)[0]) >= sup0);
    // scheduled: the festival is on (day 70) → kills progress; once per festival; closed on other days
    goHost('ct_festival'); menu({ ev: 'ct_festival', act: 'start' }); menu({ ev: 'ct_festival', act: 'go' }); const P = E.prog(ch, 'ct_festival'); assert.equal(P.stage, 1);
    for (let i = 0; i < 15; i++) w.cev.onKill(s, { fam: 'slime' }, s.actor); assert.equal(P.stage, 2);
    ch.inventory.push({ uid: 'H', kind: 'mat', ref: 'herb', n: 5 }); goHost('ct_festival'); menu({ ev: 'ct_festival', act: 'go' }); menu({ ev: 'ct_festival', act: 'go', choice: 'parade' }); assert.ok(P.done); assert.ok(ch.progress.titles.includes('大祭典の常連'));
    menu({ ev: 'ct_festival', act: 'start' }); assert.match(err(), /今回の開催/);
    menu({ ev: 'ct_festival', act: 'svc', ref: 'meal' }); assert.ok(ch.inventory.some(i => i.ref === 'meal'), 'festival stall');
    setClockAt(72, 12); goHost('ct_festival'); menu({ ev: 'ct_festival', act: 'svc', ref: 'meal' }); assert.match(err(), /次回の開催/);
    setClockAt(77, 12); goHost('ct_festival'); menu({ ev: 'ct_festival', act: 'start' }); assert.ok(!E.prog(ch, 'ct_festival').done, 'next festival: can join again');
    // midnight shop only at night; thirteenth chime only at 0:00
    setClockAt(77, 12); goHost('ct_midnight_shop'); menu({ ev: 'ct_midnight_shop', act: 'start' }); assert.match(err(), /夜/); setClockAt(77, 22); menu({ ev: 'ct_midnight_shop', act: 'svc', ref: 'elixir' }); assert.ok(ch.inventory.some(i => i.ref === 'elixir'));
    goHost('ct_thirteenth'); menu({ ev: 'ct_thirteenth', act: 'start' }); menu({ ev: 'ct_thirteenth', act: 'go' }); menu({ ev: 'ct_thirteenth', act: 'go' }); assert.match(err(), /0時台/); setClockAt(78, 0); menu({ ev: 'ct_thirteenth', act: 'go' }); assert.equal(E.prog(ch, 'ct_thirteenth').stage, 2);
    // roaming troupe: only in today's city
    setClockAt(80, 12); const tday = CITY_EVENTS.ct_troupe.hosts[80 % 5].city; const other = CITY_EVENTS.ct_troupe.hosts.find(h => h.city !== tday).city; goHost('ct_troupe', other); menu({ ev: 'ct_troupe', act: 'start' }); assert.match(err(), /今日は/); goHost('ct_troupe', tday); menu({ ev: 'ct_troupe', act: 'start' }); assert.ok(E.prog(ch, 'ct_troupe'));
    // hundred arms: all 86 weapon types are listed; try once per type; 5 types to clear the contest
    setClockAt(75, 12); goHost('ct_hundred_arms'); menu({ ev: 'ct_hundred_arms', act: 'start' }); const sv = last('open').data.service; assert.equal(sv.types.length, 86);
    menu({ ev: 'ct_hundred_arms', act: 'svc', mode: 'try', wt: 44 }); const n1 = ch.inventory.filter(i => i.kind === 'weapon').length; menu({ ev: 'ct_hundred_arms', act: 'svc', mode: 'try', wt: 44 }); assert.match(err(), /試用済み/); assert.equal(ch.inventory.filter(i => i.kind === 'weapon').length, n1);
    menu({ ev: 'ct_hundred_arms', act: 'go' }); for (const wt of [1, 4, 14, 25, 44]) w.cev.onKill(s, { fam: 'slime' }, { wt: { id: wt, name: 'x' } }); assert.equal(E.prog(ch, 'ct_hundred_arms').stage, 2);
    // hidden dungeon gate opens only through its event
    menu({ ev: 'x' }); w.handle(s, { t: 'menu', op: 'dungeon', id: 'undercity', diff: 'NORMAL', floor: 1 }); assert.match(err(), /見つかっていない/);
    goHost('ct_undercity'); menu({ ev: 'ct_undercity', act: 'start' }); menu({ ev: 'ct_undercity', act: 'go' }); w.handle(s, { t: 'menu', op: 'dungeon', id: 'undercity', diff: 'NORMAL', floor: 1 }); assert.equal(s.actor.zone.dungeon?.id, 'undercity');
    // adventurer rank test (F → E)
    goHost('ct_promotion'); menu({ ev: 'ct_promotion', act: 'start' }); menu({ ev: 'ct_promotion', act: 'go' }); menu({ ev: 'ct_promotion', act: 'go' }); assert.match(err(), /戦闘試験/);
    for (let i = 0; i < 10; i++) w.cev.onKill(s, { fam: 'slime' }, s.actor); E.prog(ch, 'ct_promotion').data.r.floor = 5; menu({ ev: 'ct_promotion', act: 'go', quiz: 1 }); ch.inventory.push({ uid: 'H2', kind: 'mat', ref: 'herb', n: 2 }); menu({ ev: 'ct_promotion', act: 'go' });
    assert.equal(ch.progress.advRank, 1); assert.ok(ch.progress.titles.includes('Eランク冒険者'));
    // the great fire is a world event: closed while calm, active after the simulation sets it
    goHost('ct_great_fire'); menu({ ev: 'ct_great_fire', act: 'start' }); assert.match(err(), /平穏/); E.setWorld('ct_great_fire', 'active'); menu({ ev: 'ct_great_fire', act: 'start' }); assert.ok(E.prog(ch, 'ct_great_fire'));
    // Drakford duelists: learning duel AI, records and reputation
    goHost('ct_duelist'); menu({ ev: 'ct_duelist', act: 'svc', id: 'kai' }); const az = s.actor.zone; assert.equal(az.bout?.kind, 'ctduel'); az.kill(az.bout.foe, s.actor, az.now); await sleep(2700);
    assert.equal(ch.progress.duelRec.kai.w, 1); assert.equal(E.w.flags.duelists.kai.l, 1); assert.ok(ch.progress.titles.includes('酒場の決闘者'));
  } finally { setTimeout(() => process.exit(process.exitCode || 0), 50); }
});
