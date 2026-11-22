// Integration test for the city expansion: buildings/interiors, guilds, travel, trade, housing, shops, bank, casino,
// arena, crafting, gathering, citizens, stories.
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
process.env.DATA_DIR = '/tmp/claude-0/abyss-city-test';
fs.rmSync(process.env.DATA_DIR, { recursive: true, force: true });
const { World } = await import('../server/game/world.js');
const { store } = await import('../server/store.js');
const { CITIES } = await import('../shared/data/cities.js');
const { GUILDS } = await import('../shared/data/guilds.js');
const { STORIES } = await import('../server/game/stories.js');
await store.init();
const { setClockHour } = await import('../server/game/life.js'); setClockHour(12);
const sleep = ms => new Promise(r => setTimeout(r, ms));

test('city systems', async () => {
  const w = new World();
  try {
    const out = []; const ws = { readyState: 1, send: x => out.push(JSON.parse(x)), close() {} };
    const r = store.register('citizen1', 'pass1234'); const s = w.attach(ws, r.account);
    const send = m => w.handle(s, m); const last = t => [...out].reverse().find(m => m.t === t); const errs = () => out.filter(m => m.t === 'err').map(m => m.v);
    send({ t: 'create', name: '市民', wt: 1 }); send({ t: 'play', id: last('chars').list[0].id });
    const ch = s.ch; ch.gold = 5_000_000; ch.level = 60;
    const goDoor = (id) => { const z = s.actor.zone; const d = z.map.doors.find(x => x.id === id); assert.ok(d, 'door ' + id); const p = z.tileCenter([d.x, d.y + 1]); s.actor.x = p.x; s.actor.y = p.y; out.length = 0; send({ t: 'interact' }); };
    const goNpc = (svc) => { const z = s.actor.zone; const n = z.map.npcs.find(x => x.service === svc); assert.ok(n, 'npc ' + svc + ' in ' + z.id); const p = z.tileCenter([n.x, n.y + 2]); s.actor.x = p.x; s.actor.y = p.y; out.length = 0; send({ t: 'interact' }); return last('open'); };
    const exit = () => { const z = s.actor.zone; const p = z.tileCenter([z.map.w >> 1, z.map.h - 1]); s.actor.x = p.x; s.actor.y = p.y; w.checkTiles(s); };
    // all 6 cities exist as towns with all named buildings
    for (const id of Object.keys(CITIES)) { const z = w.zones.get(id); assert.equal(z.kind, 'town'); assert.equal(z.map.doors.filter(d => !d.home).length, CITIES[id].districts.flatMap(d => d.buildings).length, id); assert.ok(w.life.byCity[id].list.length > 30); }
    // enter guild hall, join adventurers guild, take & finish a quest
    goDoor('h_guild'); assert.equal(s.actor.zone.id, 'in:h_guild');
    const g = goNpc('guildhq'); assert.equal(g.service, 'guild'); assert.equal(g.data.member, false);
    send({ t: 'menu', op: 'guild', gid: 'adventurers', act: 'join' }); assert.ok(ch.guilds.adventurers);
    const q = last('open').data.quests.find(x => x.kind === 'kill') || last('open').data.quests[0]; send({ t: 'menu', op: 'guild', gid: 'adventurers', act: 'accept', id: q.id }); assert.ok(ch.gquests[q.id]);
    ch.gquests[q.id].prog = 999; if (q.kind === 'gather') ch.inventory.push({ uid: 'm1', kind: 'mat', ref: q.mat, n: 99 }); if (q.kind === 'deliver') { ch.cargo = { [q.good]: 99 }; }
    if (q.kind !== 'deliver') { send({ t: 'menu', op: 'guild', gid: 'adventurers', act: 'turnin', id: q.id }); assert.ok(!ch.gquests[q.id], 'turned in ' + JSON.stringify(errs())); assert.ok(ch.guilds.adventurers.pts > 0); }
    // enemy-guild rule: knights refuse thieves members
    ch.guilds.thieves = { rank: 0, pts: 0 }; assert.ok(w.guilds.canJoin(ch, GUILDS.find(x => x.id === 'knights')).some(x => x.includes('敵対')));
    delete ch.guilds.thieves;
    exit(); assert.equal(s.actor.zone.id, 'haven');
    // in-city stops
    const stop = s.actor.zone.map.stops[0]; const sp = s.actor.zone.tileCenter([stop.x, stop.y]); s.actor.x = sp.x; s.actor.y = sp.y + 4; out.length = 0; send({ t: 'interact' }); assert.equal(last('open').service, 'stops');
    // travel to marina by carriage
    goDoor('h_station'); goNpc('travel'); const rt = last('open').data.routes.find(x => x.to === 'marina'); assert.ok(rt);
    send({ t: 'menu', op: 'travel', to: 'marina' }); await sleep(1200 + rt.min * 12 + 200); assert.equal(s.actor.zone.id, 'marina'); assert.ok(ch.progress.visited.includes('marina'));
    // trade: buy spice in marina (local product), price rises with purchases
    goDoor('m_trade'); const t0 = goNpc('trade'); const p0 = t0.data.list.find(x => x.g === 'spice').buy;
    send({ t: 'menu', op: 'trade', g: 'spice', n: 10 }); assert.equal(ch.cargo.spice, 10); const p1 = last('open').data.list.find(x => x.g === 'spice').buy; assert.ok(p1 > p0, 'price rises');
    exit();
    // real estate: buy a home, enter, storage, furniture, display, rest
    goDoor('m_realty'); goNpc('realty'); const homeP = last('open').data.list.find(x => x.dtype === 'common') || last('open').data.list[0];
    send({ t: 'menu', op: 'realty', bldg: homeP.bldg, act: 'buy' }); assert.ok(ch.homes.find(h => h.bldg === homeP.bldg), JSON.stringify(errs()));
    send({ t: 'menu', op: 'buyFurn', k: 'sofa' }); exit();
    goDoor(homeP.bldg); assert.ok(s.actor.zone.home, 'in my home ' + s.actor.zone.id);
    const wpn = ch.inventory.find(i => i.kind === 'weapon'); const spare = { uid: 'spare1', kind: 'weapon', ref: '1_010', plus: 0 }; ch.inventory.push(spare);
    send({ t: 'menu', op: 'home', act: 'deposit', uid: 'spare1' }); assert.ok(ch.storage.find(i => i.uid === 'spare1'));
    send({ t: 'menu', op: 'home', act: 'display', uid: 'spare1' }); send({ t: 'menu', op: 'home', act: 'place', k: 'sofa' }); assert.ok(s.actor.zone.map.props.some(p => p.k === 'sofa')); assert.ok(s.actor.zone.map.props.some(p => p.k === 'weaponstand'));
    send({ t: 'menu', op: 'home', act: 'rest' }); assert.equal(s.actor.hp, s.actor.maxHp); void wpn;
    exit();
    // shop property: stock & simulated sales
    goDoor('m_realty'); goNpc('realty'); const shopP = last('open').data.list.find(x => (x.dtype === 'commerce' || x.dtype === 'common') && !x.owned);
    send({ t: 'menu', op: 'realty', bldg: shopP.bldg, act: 'buy', use: 'shop' }); assert.ok(ch.shops.length === 1, JSON.stringify(errs())); exit();
    goDoor(shopP.bldg); ch.inventory.push({ uid: 'pp', kind: 'potion', ref: 'hp', n: 40 }); send({ t: 'menu', op: 'myshop', act: 'stock', uid: 'pp', n: 40, price: 30 });
    w.econ.simShops(ch, 48); assert.ok(ch.shops[0].sales > 0, 'npc customers bought'); const till = ch.shops[0].till; send({ t: 'menu', op: 'myshop', act: 'collect' }); assert.ok(till > 0);
    exit();
    // bank
    goDoor('m_bank'); goNpc('bank'); const g0 = ch.gold; send({ t: 'menu', op: 'bank', act: 'dep', n: 1000 }); assert.equal(ch.bank.bal, 1000); assert.equal(ch.gold, g0 - 1000); exit();
    // casino in lumina: house edge
    w.enterZone(s, w.zones.get('lumina')); goDoor('l_casino'); goNpc('casino'); let spent = 0, won = 0; for (let i = 0; i < 400; i++) { const before = ch.gold; send({ t: 'menu', op: 'casino', game: i % 2 ? 'slot' : 'roulette', pick: 'red', bet: 100 }); spent += 100; won += ch.gold - before + 100; }
    assert.ok(won / spent < 1.15, 'casino return ' + (won / spent).toFixed(2)); exit();
    // black market & info & craft
    goDoor('l_black'); goNpc('blackmarket'); assert.ok(last('open').data.list.length > 0); send({ t: 'menu', op: 'info' }); assert.equal(last('open').service, 'lore'); exit();
    goDoor('l_smith'); ch.inventory.push({ uid: 'ore9', kind: 'mat', ref: 'ore', n: 30 }); const nW = ch.inventory.filter(i => i.kind === 'weapon').length; send({ t: 'menu', op: 'craft', wt: 3 }); assert.equal(ch.inventory.filter(i => i.kind === 'weapon').length, nW + 1, JSON.stringify(errs())); exit();
    // arena: 3 waves
    setClockHour(22); goDoor('l_pit'); assert.equal(s.actor.zone.id, 'in:l_pit', 'arena open at night'); const ah = w.zones.get('lumina').map.doors.find(d => d.id === 'l_pit'); void ah;
    if (s.actor.zone.id === 'in:l_pit') { goNpc('arena'); send({ t: 'menu', op: 'arena' }); const az = s.actor.zone; assert.equal(az.kind, 'arena');
      for (let wave = 0; wave < 3; wave++) { for (const m of [...az.actors.values()]) if (m.kind === 'monster' && !m.dead) az.kill(m, s.actor, az.now); await sleep(1700); }
      assert.ok((ch.progress.arenaWins || 0) >= 1); await sleep(2700); }
    setClockHour(12);
    // citizens talk
    w.enterZone(s, w.zones.get('lumina')); w.life.sync(s.actor.zone); const res = [...s.actor.zone.actors.values()].find(x => x.kind === 'resident');
    if (res) { s.actor.x = res.x; s.actor.y = res.y + 10; out.length = 0; send({ t: 'interact' }); const o = last('open'); assert.ok(o && (o.service === 'resident' || o.service), 'talked'); }
    // story chain with a world-changing choice
    ch.stories = {}; const st = STORIES.lumina; for (const step of st.steps) { if (step.kind === 'choice') send({ t: 'menu', op: 'story', city: 'lumina', choice: 'reform' }); else { if (step.kind === 'kill' || step.kind === 'floor') ch.stories.lumina.prog = 99; send({ t: 'menu', op: 'story', city: 'lumina' }); } }
    assert.equal(w.econ.cityState.lumina.flag, 'reform'); assert.ok(ch.rep.dawn > 0);
    // consumable use
    ch.inventory.push({ uid: 'el', kind: 'potion', ref: 'atkTonic', n: 1 }); send({ t: 'menu', op: 'use', ref: 'atkTonic' }); assert.ok(s.actor.buffMods.atk > 0);
    // persistence
    w.saveAll(); await store.flush(); const saved = store.loadChar(ch.id); assert.ok(saved.homes.length >= 2 && saved.guilds.adventurers && saved.storage.length === 1);
    console.log('errors seen:', errs().slice(0, 5));
  } finally { setTimeout(() => process.exit(process.exitCode || 0), 50); }
});
