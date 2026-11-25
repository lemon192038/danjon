// PHASE 3a Gravel: city next to Arcelia, seven organisations (world-shared simulation with succession & feuds,
// HQ jobs, affiliation, reputation driving NPC hostility), gray market, staged hideout discovery.
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
process.env.DATA_DIR = '/tmp/claude-0/abyss-gravel-test';
fs.rmSync(process.env.DATA_DIR, { recursive: true, force: true });
const { World } = await import('../server/game/world.js');
const { store } = await import('../server/store.js');
const { ORGS, ORG_IDS } = await import('../shared/data/gravel.js');
const { Orgs } = await import('../server/game/orgs.js');
const { setClockHour } = await import('../server/game/life.js');
await store.init(); setClockHour(12);

test('gravel and the seven organisations', async () => {
  const w = new World();
  try {
    const out = []; const ws = { readyState: 1, send: x => out.push(JSON.parse(x)), close() {} }; const last = t => [...out].reverse().find(m => m.t === t); const err = () => out.filter(m => m.t === 'err').at(-1)?.v;
    const r = store.register('slumdog', 'pass1234'); const s = w.attach(ws, r.account); w.handle(s, { t: 'create', name: '灰の子', wt: 3 }); w.handle(s, { t: 'play', id: last('chars').list[0].id });
    const ch = s.ch; ch.level = 40; ch.gold = 1e6;
    // Gravel is a town that adjoins Arcelia on foot
    const az = w.zones.get('arcelia'); const gz = w.zones.get('gravel'); assert.equal(gz.kind, 'town'); w.enterZone(s, az); const ex = az.map.exits.find(e => e.to === 'gravel'); assert.ok(ex, 'arcelia → gravel exit');
    const p = az.tileCenter([ex.x, ex.y]); s.actor.x = p.x; s.actor.y = p.y; w.checkTiles(s); assert.equal(s.actor.zone.id, 'gravel');
    // every organisation has a headquarters building with its NPC
    for (const id of ORG_IDS) { const d = gz.map.doors.find(x => x.org === id); assert.ok(d, 'hq ' + id); }
    const enterOrg = id => { w.enterZone(s, gz); w.enterBuilding(s, gz.map.doors.find(x => x.org === id)); const n = s.actor.zone.map.npcs.find(x => x.service === 'org'); const q = s.actor.zone.tileCenter([n.x, n.y + 2]); s.actor.x = q.x; s.actor.y = q.y; out.length = 0; w.handle(s, { t: 'interact' }); return last('open'); };
    const v = enterOrg('crow'); assert.equal(v.service, 'org'); assert.equal(v.data.name, '黒鴉商会'); assert.equal(v.data.board.length, 7); assert.ok(v.data.jobs.length >= 2);
    // jobs: tribute raises territory & rep; join needs rep 10
    w.handle(s, { t: 'menu', op: 'org', org: 'crow', act: 'join' }); assert.ok(err().includes('評判10'));
    const tri = v.data.jobs.find(j => j.kind === 'tribute'); const inf0 = w.market.influence.gravel_under.crow;
    w.handle(s, { t: 'menu', op: 'org', org: 'crow', act: 'accept', id: tri.id }); w.handle(s, { t: 'menu', op: 'org', org: 'crow', act: 'turnin', id: tri.id });
    assert.ok(w.market.influence.gravel_under.crow > inf0, 'tribute grows territory'); assert.ok(w.orgs.rep(ch, 'crow') >= 5);
    assert.ok(w.orgs.rep(ch, 'redsnake') < 0, 'enemies of crow dislike you');
    ch.orgRep.crow = 12; w.handle(s, { t: 'menu', op: 'org', org: 'crow', act: 'join' }); assert.equal(ch.org, 'crow');
    // hit job progresses when you defeat the target faction in the underground
    const hit = w.orgs.jobs(ch, 'crow').find(j => j.kind === 'hit'); w.handle(s, { t: 'menu', op: 'org', org: 'crow', act: 'accept', id: hit.id }); for (let k = 0; k < hit.n; k++) w.orgs.onKill(s, hit.target); assert.equal(ch.orgJobs[hit.id].prog, hit.n);
    // faction hostility in the raid follows per-organisation reputation
    const fake = { faction: 'redsnake', hostileBelow: ORGS.redsnake.hostileBelow }; ch.orgRep.redsnake = 50; assert.equal(w.slum.passiveFor(fake, s.actor), true); ch.orgRep.redsnake = -50; assert.equal(w.slum.passiveFor(fake, s.actor), false);
    // gray market (Gravel underground region) opens with history graphs
    w.enterZone(s, gz); w.enterBuilding(s, gz.map.doors.find(x => x.id === 'gr_market')); const n = s.actor.zone.map.npcs.find(x => x.service === 'graymarket'); const q = s.actor.zone.tileCenter([n.x, n.y + 2]); s.actor.x = q.x; s.actor.y = q.y; out.length = 0; w.handle(s, { t: 'interact' });
    assert.equal(last('open').service, 'market'); assert.equal(last('open').data.region, 'gravel_under');
    // world simulation: 72h moves territory; succession & feuds produce news; state survives save/load
    const before = JSON.stringify(w.market.influence.gravel_under); w.orgs.s.orgs.ironclaw.mood = -10; for (let k = 0; k < 6; k++) w.orgs.simulate(72);
    assert.notEqual(JSON.stringify(w.market.influence.gravel_under), before); assert.ok(w.orgs.s.news.length > 0, 'news');
    assert.ok(w.orgs.s.orgs.ironclaw.leaders.length > 1 || w.orgs.s.orgs.ironclaw.leader !== ORGS.ironclaw.leader, 'unhappy org changed leader');
    const O2 = new Orgs(w, JSON.parse(JSON.stringify(w.orgs.save()))); assert.equal(O2.s.orgs.ironclaw.leader, w.orgs.s.orgs.ironclaw.leader);
    // hideout in Gravel: staged discovery, never wipes stash/weapons/gold
    ch.hideout = { rid: 'gravel_under', lv: 0, fac: {}, storage: [{ ref: 'scrap', n: 40 }], stash: [{ ref: 'jewel', n: 3 }], exposure: 100, vis: 'public', log: [], visits: [], lastCheck: 0, stage: 0 };
    const gold = ch.gold; const stages = new Set(); for (let k = 0; k < 40; k++) { ch.hideout.lastCheck = Date.now() - 20 * 3600000; ch.hideout.exposure = 100; w.hideout.check(s); stages.add(ch.hideout.stage); }
    assert.ok(stages.size >= 3, 'passes through stages ' + [...stages]); assert.equal(ch.hideout.stash[0].n, 3); assert.equal(ch.gold, gold); assert.ok(ch.hideout.storage.reduce((a, i) => a + i.n, 0) > 0, 'never fully wiped');
    // underground raid region of Gravel exists with the seven organisations
    assert.ok(w.slum.getInstance('gravel_under', 'x').id); assert.equal(w.events.journal(ch).list.find(e => e.id === 'sl_factions')?.status, 'live');
  } finally { setTimeout(() => process.exit(process.exitCode || 0), 50); }
});
