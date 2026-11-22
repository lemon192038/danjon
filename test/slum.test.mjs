// Integration test for slum extraction: entrance, instance/layers, search, ladders, exits, extraction, death rules,
// market price movement, laundering, hideout acquire/facility/upgrade, PvP teams, rejoin.
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
process.env.DATA_DIR = '/tmp/claude-0/abyss-slum-test';
fs.rmSync(process.env.DATA_DIR, { recursive: true, force: true });
const { World } = await import('../server/game/world.js');
const { store } = await import('../server/store.js');
const { LOOT, REGIONS } = await import('../shared/data/slum.js');
await store.init();
const { setClockHour } = await import('../server/game/life.js'); setClockHour(12);
const sleep = ms => new Promise(r => setTimeout(r, ms));

function player(w, name) {
  const out = []; const ws = { readyState: 1, send: x => out.push(JSON.parse(x)), close() {} };
  const r = store.register(name, 'pass1234'); const s = w.attach(ws, r.account); const send = m => w.handle(s, m);
  const last = t => [...out].reverse().find(m => m.t === t);
  send({ t: 'create', name, wt: 1 }); send({ t: 'play', id: last('chars').list[0].id });
  return { s, out, send, last, errs: () => out.filter(m => m.t === 'err').map(m => m.v) };
}
const goDoor = (P, svc) => { const z = P.s.actor.zone; const d = z.map.doors.find(x => x.svc === svc); assert.ok(d, 'door ' + svc); const p = z.tileCenter([d.x, d.y + 1]); P.s.actor.x = p.x; P.s.actor.y = p.y; P.send({ t: 'interact' }); };
const goNpc = (P, svc) => { const z = P.s.actor.zone; const n = z.map.npcs.find(x => x.service === svc); const p = z.tileCenter([n.x, n.y + 2]); P.s.actor.x = p.x; P.s.actor.y = p.y; P.out.length = 0; P.send({ t: 'interact' }); return P.last('open'); };
const goObj = (P, pred) => { const z = P.s.actor.zone; const o = z.map.objects.find(pred); assert.ok(o, 'object'); const p = z.tileCenter([o.x, o.y]); P.s.actor.x = p.x; P.s.actor.y = p.y; P.out.length = 0; P.send({ t: 'interact' }); return o; };

test('slum extraction loop', async () => {
  const w = new World();
  try {
    const A = player(w, 'raiderA'); const ch = A.s.ch; ch.level = 30; ch.gold = 1_000_000;
    // entrance in the slum district
    goDoor(A, 'slum'); assert.equal(A.s.actor.zone.kind, 'interior');
    const ent = goNpc(A, 'slum'); assert.equal(ent.service, 'slum'); assert.equal(ent.data.rid, 'haven_old'); assert.ok(ent.data.quests.length >= 5);
    A.send({ t: 'menu', op: 'slum', act: 'accept', id: ent.data.quests.find(q => q.kind === 'search').id });
    A.send({ t: 'menu', op: 'slum', act: 'start', insure: true });
    assert.ok(ch.raid, 'raid started ' + A.errs()); const z1 = A.s.actor.zone; assert.equal(z1.kind, 'slum'); assert.equal(z1.layer, 1);
    assert.ok(A.last('zone').slum.danger.length > 0); assert.ok(A.last('raidStart').exits.length >= 4);
    // search a container (timed, bag gets loot)
    for (let k = 0; k < 3; k++) { A.s.actor.invulnUntil = Infinity; for (const m of A.s.actor.zone.actors.values()) if (m.kind === "monster") m.staggerUntil = Infinity; const o = goObj(A, x => x.k === "cont" && !x.looted); A.s.actor.action = null; await sleep(3600); assert.ok(o.looted, 'looted'); }
    assert.ok(ch.raid.bag.length > 0, 'bag has loot');
    // ladder → another layer, shared looted state per instance
    const lad = goObj(A, x => x.k === 'ladder'); assert.notEqual(A.s.actor.zone.layer, 1, 'changed layer'); void lad;
    assert.ok(w.slum.inst.get(ch.raid.inst).looted.size >= 3);
    // pouch rule: ≤1kg items, 2 slots
    ch.raid.bag.push({ ref: 'jewel', n: 1, q: 1, prov: 'unknown' }); A.send({ t: 'menu', op: 'slum', act: 'pouch', i: ch.raid.bag.length - 1, to: 1 }); assert.equal(ch.raid.pouch.length, 1);
    // extraction via guaranteed exit (8s still)
    const I = w.slum.inst.get(ch.raid.inst); const free = I.free[0]; const L = { sewer: 0, stairs: 1 }[free] ?? 0;
    const zz = w.slum.zone(I, L); w.enterZone(A.s, zz); const ex = zz.map.objects.find(o => o.k === 'exit' && o.type === free); assert.ok(ex, 'free exit present ' + free);
    ch.raid.bag.push({ ref: 'scrap', n: 1, q: 1, prov: 'slum' }, { ref: 'parts', n: 1, q: 1, prov: 'illegal' }, { ref: 'idol', n: 1, q: 1, prov: 'ruins' });
    goObj(A, o => o === ex); assert.ok(ch.raid.extracting, "extracting " + A.errs() + JSON.stringify({ dead: A.s.actor.dead, act: A.s.actor.action, ex, near: zz.map.objects.filter(o => Math.abs(o.x - ex.x) < 3 && Math.abs(o.y - ex.y) < 3) }));
    ch.raid.extracting.until = Date.now(); w.slum.tickSession(A.s);
    assert.equal(ch.raid, null); assert.equal(A.last('raidResult').ok, true); assert.ok(ch.inventory.some(i => i.kind === 'loot' && i.ref === 'jewel'));
    assert.equal(A.s.actor.zone.id, 'haven'); assert.equal(ch.progress.extractions.at(-1).ok, true);
    // provenance: regular shop refuses illegal parts, accepts slum scrap
    const parts = ch.inventory.find(i => i.ref === 'parts'); A.send({ t: 'menu', op: 'sell', uid: parts.uid }); assert.ok(A.errs().at(-1).includes('正規'));
    // market: selling lowers price; laundering (fence) converts illegal → laundered
    goDoor(A, 'slum'); goNpc(A, 'slum');
    const before = w.market.m.haven_old.idol.price; for (let k = 0; k < 6; k++) w.slum.addLoot(ch, { ref: 'idol', n: 1, q: 1, prov: 'ruins' });
    const idol = ch.inventory.find(i => i.ref === 'idol'); A.send({ t: 'menu', op: 'market', act: 'sell', uid: idol.uid }); assert.ok(w.market.m.haven_old.idol.price < before, 'price dropped');
    A.send({ t: 'menu', op: 'market', act: 'launder', how: 'fence', uid: parts.uid }); assert.equal(parts.prov, 'laundered');
    const mv = A.last('open'); assert.equal(mv.service, 'market'); assert.ok(mv.data.items[0].hist); assert.ok(!('future' in mv.data.items[0]));
    for (let k = 0; k < 5; k++) { w.market.lastStep = -999; w.market.step(); }
    // hideout: acquire by purchase, install workbench, upgrade
    A.send({ t: 'menu', op: 'hideout', act: 'acquire', k: 'buy', rid: 'haven_old' }); assert.ok(ch.hideout, 'hideout ' + A.errs());
    A.send({ t: 'menu', op: 'hideout', act: 'enter' }); assert.equal(A.s.actor.zone.hideout, ch.id);
    for (let k = 0; k < 20; k++) w.slum.addLoot(ch, { ref: 'scrap', n: 1, q: 1, prov: 'slum' }); for (let k = 0; k < 10; k++) w.slum.addLoot(ch, { ref: 'wire', n: 1, q: 1, prov: 'slum' });
    A.send({ t: 'menu', op: 'hideout', act: 'install', k: 'workbench' }); assert.equal(ch.hideout.fac.workbench, 1, A.errs().join());
    assert.ok(A.s.actor.zone.map.objects.some(o => o.k === 'fac' && o.f === 'workbench'));
    A.send({ t: 'menu', op: 'hideout', act: 'upgrade' }); assert.equal(ch.hideout.lv, 1, A.errs().join());
    const scrap = ch.inventory.find(i => i.ref === 'scrap'); A.send({ t: 'menu', op: 'hideout', act: 'use', f: 'workbench', uid: scrap?.uid }); assert.ok(ch.inventory.some(i => i.kind === 'mat' && i.ref === 'ore'));
    // abstract raid never touches stash / weapons / gold
    const gold = ch.gold; const wn = ch.inventory.filter(i => i.kind === 'weapon').length; ch.hideout.exposure = 100; ch.hideout.lastCheck = Date.now() - 50 * 3600000; ch.hideout.fac.security = 0; w.hideout.check(A.s);
    assert.equal(ch.gold, gold); assert.equal(ch.inventory.filter(i => i.kind === 'weapon').length, wn);
    // death in tier-1: lose bag, keep pouch & weapon; corpse container left for others
    w.exitBuilding(A.s); goDoor(A, 'slum'); goNpc(A, 'slum'); A.send({ t: 'menu', op: 'slum', act: 'start' }); assert.ok(ch.raid);
    ch.raid.bag.push({ ref: 'goldbar', n: 1, q: 1, prov: 'unknown' }); ch.raid.pouch.push({ ref: 'coin', n: 1, q: 1, prov: 'ruins' }); const wep = ch.equip.weapon; const dz = A.s.actor.zone;
    dz.kill(A.s.actor, A.s.actor, dz.now); assert.equal(ch.raid, null); const res = A.last('raidResult'); assert.equal(res.ok, false); assert.equal(ch.equip.weapon, wep); assert.ok(ch.inventory.some(i => i.ref === 'coin'));
    assert.ok(dz.map.objects.some(o => o.ck === 'corpse' && o.items?.some(i => i.ref === 'goldbar')), 'corpse with bag');
    A.send({ t: 'respawn' }); assert.equal(A.s.actor.zone.id, 'haven');
    // PvP teams in tier>=3, shared instance between two solo players, rejoin after disconnect
    const B = player(w, 'raiderB'); const C = player(w, 'raiderC'); for (const P of [B, C]) { P.s.ch.level = 40; w.travelTest = 1; }
    for (const P of [B, C]) { const cz = w.zones.get('celestia'); w.enterZone(P.s, cz); goDoor(P, 'slum'); goNpc(P, 'slum'); P.send({ t: 'menu', op: 'slum', act: 'start' }); assert.ok(P.s.ch.raid, 'raid ' + P.errs()); }
    assert.equal(B.s.ch.raid.inst, C.s.ch.raid.inst, 'shared instance'); assert.notEqual(B.s.actor.team, C.s.actor.team, 'pvp teams'); assert.ok(B.s.actor.zone.enemiesOf(B.s.actor).includes(C.s.actor));
    w.detach(B.s); assert.ok(B.s.ch.raid); const B2 = { out: [] }; const ws2 = { readyState: 1, send: x => B2.out.push(JSON.parse(x)), close() {} }; const s2 = w.attach(ws2, B.s.account); w.handle(s2, { t: 'play', id: B.s.ch.id });
    assert.equal(s2.actor.zone.kind, 'slum', 'rejoined');
    // faction NPCs exist and are passive toward neutral rep players unless provoked
    const fm = [...s2.actor.zone.actors.values()].find(o => o.kind === 'monster' && o.faction && o.hostileBelow < 0); if (fm) assert.equal(w.slum.passiveFor(fm, s2.actor), true);
    // all regions have reachable layers
    for (const rid of Object.keys(REGIONS)) { const I2 = w.slum.getInstance(rid, 'x' + rid); for (let L2 = 0; L2 < 4; L2++) assert.ok(w.slum.zone(I2, L2).map.reachable, rid + L2); }
    void LOOT;
  } finally { setTimeout(() => process.exit(process.exitCode || 0), 50); }
});
