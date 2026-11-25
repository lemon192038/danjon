// PHASE 3b: Gravel story events — hosts placed in Gravel, every step kind, choices with world effects,
// idempotent rewards, night-only steps, duels, world-shared plague, black auction, Blackforge mod, colosseum ranking.
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
process.env.DATA_DIR = '/tmp/claude-0/abyss-sev-test';
fs.rmSync(process.env.DATA_DIR, { recursive: true, force: true });
const { World } = await import('../server/game/world.js');
const { store } = await import('../server/store.js');
const { SLUM_EVENTS } = await import('../shared/data/slumevents.js');
const { setClockHour } = await import('../server/game/life.js');
await store.init(); setClockHour(12);
const sleep = ms => new Promise(r => setTimeout(r, ms));

test('gravel story events', async () => {
  const w = new World();
  try {
    const out = []; const ws = { readyState: 1, send: x => out.push(JSON.parse(x)), close() {} }; const last = t => [...out].reverse().find(m => m.t === t); const err = () => out.filter(m => m.t === 'err').at(-1)?.v;
    const r = store.register('storyteller', 'pass1234'); const s = w.attach(ws, r.account); w.handle(s, { t: 'create', name: '語り部', wt: 1 }); w.handle(s, { t: 'play', id: last('chars').list[0].id });
    const ch = s.ch; ch.level = 60; ch.gold = 1e6; s.actor.refreshStats();
    const gz = w.zones.get('gravel'); const hosts = gz.map.npcs.filter(n => n.service === 'sev'); assert.equal(hosts.length, Object.keys(SLUM_EVENTS).length, 'all hosts placed');
    const go = ev => { if (s.actor.zone !== gz) w.enterZone(s, gz); const n = hosts.find(h => h.ev === ev); const p = gz.tileCenter([n.x, n.y]); s.actor.x = p.x; s.actor.y = p.y + 4; };
    const act = (ev, a = 'go', extra = {}) => { go(ev); w.handle(s, { t: 'menu', op: 'sev', ev, act: a, ...extra }); };
    const P = ev => w.events.prog(ch, ev);
    // talking to the host opens the event dialog
    go('sl_children'); out.length = 0; w.handle(s, { t: 'interact' }); assert.equal(last('open').service, 'sev');
    // ── 消えた子供たち: talk → raid → talk → kill → duel → choice
    act('sl_children', 'start'); act('sl_children'); assert.equal(P('sl_children').stage, 1);
    act('sl_children'); assert.ok(err().includes('まだ'), 'raid step needs the underground'); P('sl_children').data.searched = 3; w.sev.onRaid(s, { kind: 'extract', rid: 'gravel_under' }); assert.equal(P('sl_children').stage, 2);
    act('sl_children'); for (let k = 0; k < 5; k++) w.sev.onKill(s, { faction: 'redsnake' }); assert.equal(P('sl_children').stage, 4);
    act('sl_children'); const dz = s.actor.zone; assert.ok(dz.duel, 'in duel arena'); const boss = [...dz.actors.values()].find(a => a.duelBoss); dz.kill(boss, s.actor, dz.now); await sleep(2100);
    assert.equal(P('sl_children').stage, 5); assert.equal(s.actor.zone.id, 'gravel');
    const inf0 = w.market.influence.gravel_under.redsnake; act('sl_children', 'go', { choice: 'expose' });
    assert.ok(P('sl_children').done); assert.equal(P('sl_children').outcome, '記録を王都の衛兵に届ける'); assert.ok(w.market.influence.gravel_under.redsnake < inf0, 'world effect');
    assert.ok(ch.progress.titles.includes('子供たちの味方')); const g = ch.gold; act('sl_children', 'go', { choice: 'expose' }); assert.equal(ch.gold, g, 'no double reward');
    // ── night-only step and the black auction
    act('sl_auction', 'start'); act('sl_auction'); assert.ok(err().includes('夜')); setClockHour(22); act('sl_auction'); act('sl_auction'); act('sl_auction'); assert.ok(P('sl_auction').done); assert.ok(w.sev.unlocks(ch).auction);
    w.enterBuilding(s, gz.map.doors.find(d => d.id === 'gr_crow')); const lots = w.sev.lots();
    w.handle(s, { t: 'menu', op: 'sev', ev: 'sl_auction', act: 'auction', lot: lots[2].id, bid: lots[2].min }); // low bid can lose
    ch.gold = 1e9; const lw = lots[0]; const n0 = ch.inventory.filter(i => i.ref === lw.ref).length; w.handle(s, { t: 'menu', op: 'sev', ev: 'sl_auction', act: 'auction', lot: lw.id, bid: lw.value * 3 }); assert.equal(ch.inventory.filter(i => i.ref === lw.ref).length, n0 + 1, 'won lot');
    w.handle(s, { t: 'menu', op: 'sev', ev: 'sl_auction', act: 'auction', lot: lw.id, bid: lw.value * 3 }); assert.ok(err().includes('既に'), 'one bid per lot'); setClockHour(12);
    // ── plague is world-shared: active until someone purifies it
    assert.equal(w.events.worldOf('sl_plague').state, 'active'); act('sl_plague', 'start'); act('sl_plague');
    for (let k = 0; k < 3; k++) w.slum.addLoot(ch, { ref: 'herbbag', n: 1, q: 1, prov: 'slum' }); act('sl_plague'); P('sl_plague').data.searched = 3; w.sev.onRaid(s, { kind: 'extract', rid: 'gravel_under' });
    for (let k = 0; k < 4; k++) w.sev.onKill(s, { faction: 'scavs' }); act('sl_plague'); act('sl_plague', 'go', { choice: 'purify' }); assert.equal(w.events.worldOf('sl_plague').state, 'resolved');
    // ── Blackforge: deliveries, duel, then the modification service adds a 3rd trait at most
    act('sl_blackforge', 'start'); act('sl_blackforge'); for (let k = 0; k < 4; k++) w.slum.addLoot(ch, { ref: 'parts', n: 1, q: 1, prov: 'illegal' }); w.slum.addLoot(ch, { ref: 'starsteel', n: 1, q: 1, prov: 'slum' });
    act('sl_blackforge'); act('sl_blackforge'); act('sl_blackforge'); const dz2 = s.actor.zone; dz2.kill([...dz2.actors.values()].find(a => a.duelBoss), s.actor, dz2.now); await sleep(2100); act('sl_blackforge'); assert.ok(P('sl_blackforge').done && w.sev.unlocks(ch).blackforgeMod);
    for (let k = 0; k < 2; k++) w.slum.addLoot(ch, { ref: 'parts', n: 1, q: 1, prov: 'illegal' }); const wpn = ch.inventory.find(i => i.uid === ch.equip.weapon); const t0 = (wpn.traits || []).length || 1;
    act('sl_blackforge', 'bfmod', { uid: wpn.uid }); assert.equal(wpn.traits.length, t0 + 1, 'trait carved ' + err());
    // ── colosseum: 3 wins finishes the event; ranking is world-shared
    act('sl_colosseum', 'start'); act('sl_colosseum'); for (let k = 0; k < 3; k++) w.sev.onArenaWin(s, 'gravel'); act('sl_colosseum'); assert.ok(P('sl_colosseum').done); assert.equal(w.sev.ranking()[0].name, ch.name);
    // ── journal shows these as live with their real step texts
    const j = w.events.journal(ch).list.find(e => e.id === 'sl_children'); assert.equal(j.status, 'live'); assert.equal(j.stages.length, SLUM_EVENTS.sl_children.steps.length);
    w.save(s); assert.ok(store.loadChar(ch.id).events.prog.sl_children.done);
  } finally { setTimeout(() => process.exit(process.exitCode || 0), 50); }
});
