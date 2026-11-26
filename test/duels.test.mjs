// PHASE 7 (part 1): duel AI, the Wandering Swordmaster and the Masquerade Tournament.
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
process.env.DATA_DIR = '/tmp/claude-0/abyss-duels-test';
fs.rmSync(process.env.DATA_DIR, { recursive: true, force: true });
const { World } = await import('../server/game/world.js');
const { store } = await import('../server/store.js');
const { RAVEN } = await import('../shared/data/duels.js');
const { setClockHour } = await import('../server/game/life.js');
await store.init(); setClockHour(12);
const sleep = ms => new Promise(r => setTimeout(r, ms));

test('duels', async () => {
  const w = new World();
  try {
    const out = []; const ws = { readyState: 1, bufferedAmount: 0, send: x => out.push(JSON.parse(x)), close() {} }; const last = t => [...out].reverse().find(m => m.t === t); const err = () => out.filter(m => m.t === 'err').at(-1)?.v;
    const r = store.register('duelist', 'pass1234'); const s = w.attach(ws, r.account); w.handle(s, { t: 'create', name: '挑戦者', wt: 1 }); w.handle(s, { t: 'play', id: last('chars').list[0].id });
    const ch = s.ch; ch.level = 75; ch.gold = 1e6; ch.inventory.push({ uid: 'ARM', kind: 'armor', slot: 'armor', tier: 5, plus: 5 }); ch.equip.armor = 'ARM'; s.actor.refreshStats(); s.actor.hp = s.actor.maxHp;
    // Raven wanders; he materialises in his current zone when a player is there
    const zid = w.duels.ravenZone(); assert.ok(RAVEN.route.includes(zid)); w.enterZone(s, w.zones.get(zid)); w.duels.sync();
    const rv = [...s.actor.zone.actors.values()].find(a => a.role === 'raven'); assert.ok(rv, 'raven present'); s.actor.x = rv.x + 10; s.actor.y = rv.y; out.length = 0; w.handle(s, { t: 'interact' }); assert.equal(last('open').service, 'raven');
    // duel: the AI actually fights back
    w.handle(s, { t: 'menu', op: 'raven', act: 'duel' }); const az = s.actor.zone; assert.ok(az.bout && az.bout.foe.kind === 'duelist');
    { const { T } = await import('../server/game/maps.js'); const mx = az.map.w >> 1; const p = az.tileCenter([mx, az.map.h - 1]); const sx = s.actor.x, sy = s.actor.y; s.actor.x = p.x; s.actor.y = p.y; w.checkTiles(s); assert.equal(s.actor.zone, az, 'cannot leave mid-duel via the exit mat'); s.actor.x = sx; s.actor.y = sy; void T; }
    s.actor.invulnUntil = 0; const hp0 = s.actor.hp; s.actor.x = az.bout.foe.x; s.actor.y = az.bout.foe.y + 30; for (let k = 0; k < 400 && s.actor.hp >= hp0; k++) az.tick(50); assert.ok(s.actor.hp < hp0 && !s.actor.dead, 'duelist dealt damage ' + JSON.stringify({ hp: s.actor.hp, hp0, dead: s.actor.dead, d: Math.round(Math.hypot(az.bout.foe.x - s.actor.x, az.bout.foe.y - s.actor.y)), act: az.bout.foe.action?.type, foeHp: az.bout.foe.hp, inv: s.actor.invulnUntil })); s.actor.invulnUntil = Infinity;
    // win with three different weapon types → hidden trial → true form → completion
    const winWith = async wt => { s.actor.hp = s.actor.maxHp; const z = s.actor.zone; if (!z.bout) { w.enterZone(s, w.zones.get(zid)); w.duels.sync(); const rr = [...s.actor.zone.actors.values()].find(a => a.role === 'raven'); s.actor.x = rr.x + 10; s.actor.y = rr.y; w.handle(s, { t: 'menu', op: 'raven', act: 'duel' }); }
      const b = s.actor.zone.bout; b.wt = wt; s.actor.zone.kill(b.foe, s.actor, s.actor.zone.now); await sleep(2700); };
    await winWith(1); assert.ok(ch.progress.titles.includes('剣聖に認められし者')); assert.equal(s.actor.zone.id, zid, 'returned to the field');
    await winWith(14); await winWith(44); assert.ok(w.duels.canTrue(ch), 'three weapon types');
    w.duels.sync(); const r2 = [...s.actor.zone.actors.values()].find(a => a.role === 'raven'); s.actor.x = r2.x + 10; s.actor.y = r2.y; w.handle(s, { t: 'menu', op: 'raven', act: 'true' });
    assert.ok(s.actor.zone.bout.true); assert.ok(s.actor.zone.bout.foe.maxHp > 0); s.actor.zone.kill(s.actor.zone.bout.foe, s.actor, s.actor.zone.now); await sleep(2700);
    assert.ok(w.events.prog(ch, 'ev_swordmaster').done); assert.ok(ch.progress.titles.includes('無銘を超えし者')); assert.ok(ch.inventory.some(i => i.name === '無銘・天断（レプリカ）'), 'replica (never the original)');
    assert.ok(ch.jobs.ev_swordtheory, 'swordtheory job unlocked');
    // learning: memory of this player's style accumulates across bouts
    const tac = w.duels.mem.tactics('raven', ch.id); assert.ok(tac.fights >= 4 && tac.learn >= 0.8, JSON.stringify(tac));
    // Masquerade: guide in Arcelia → qualify → register → six rounds; identities hidden in the arena
    const az2 = w.zones.get('arcelia'); w.enterZone(s, az2); const g = az2.map.npcs.find(n => n.service === 'masq'); assert.ok(g, 'guide placed'); const gp = az2.tileCenter([g.x, g.y]); s.actor.x = gp.x; s.actor.y = gp.y + 6;
    out.length = 0; w.handle(s, { t: 'interact' }); assert.equal(last('open').service, 'masq');
    w.handle(s, { t: 'menu', op: 'masq', act: 'qualify' }); w.handle(s, { t: 'menu', op: 'masq', act: 'register' }); const mz = s.actor.zone; assert.ok(mz.masq && mz.bout);
    assert.equal(mz.describe(s.actor).name, '仮面の闘士'); assert.equal(mz.describe(mz.bout.foe).name, '仮面の闘士');
    for (let round = 0; round < 6; round++) { const foe = mz.bout.foe; mz.kill(foe, s.actor, mz.now); if (round < 5) { for (let k = 0; k < 80 && mz.bout.foe === foe; k++) await sleep(100); } else for (let k = 0; k < 80 && ch.progress.masq.titles < 1; k++) await sleep(100); } // wait for the next round (robust under CPU load)
    assert.equal(ch.progress.masq.titles, 1); assert.ok(ch.progress.titles.includes('仮面の武闘祭 優勝者'));
    w.enterZone(s, az2); s.actor.x = gp.x; s.actor.y = gp.y + 6; w.handle(s, { t: 'menu', op: 'masq', act: 'register' }); assert.ok(err().includes('今日'), 'once per day');
    // after three championships: the unmasked king → arena king job
    ch.level = 80; ch.progress.masq.titles = 3; ch.progress.masq.records = 3; w.enterZone(s, az2); s.actor.x = gp.x; s.actor.y = gp.y + 6; w.handle(s, { t: 'menu', op: 'masq', act: 'face' });
    const fz = s.actor.zone; assert.ok(fz.bout.face); fz.kill(fz.bout.foe, s.actor, fz.now); await sleep(2700);
    assert.ok(w.events.prog(ch, 'ev_masquerade').done); assert.ok(ch.jobs.ev_arenaking, 'arena king unlocked');
  } finally { setTimeout(() => process.exit(process.exitCode || 0), 50); }
});
