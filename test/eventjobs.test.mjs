// PHASE 5 event jobs: 1,000 base jobs untouched + named event jobs; unlock rules (event / flag / sin route /
// one bishop per character); event completion unlocks and lets you change jobs; stats & active skills work.
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
process.env.DATA_DIR = '/tmp/claude-0/abyss-evjobs-test';
fs.rmSync(process.env.DATA_DIR, { recursive: true, force: true });
const { World } = await import('../server/game/world.js');
const { store } = await import('../server/store.js');
const { DATA } = await import('../server/data.js');
const { jobUnlockMet, checkJobUnlocks } = await import('../server/game/progress.js');
const { makeMonster } = await import('../server/game/monsters.js');
await store.init();

test('event jobs', async () => {
  const w = new World();
  try {
    const base = DATA.jobList.filter(j => !j.event), ev = DATA.jobList.filter(j => j.event);
    assert.equal(base.length, 1000); assert.ok(ev.length >= 20);
    for (const n of ['異端者', '強欲の罪人', '大罪司教・憤怒担当', '剣理の探究者', '原初魔導師', '月影の観測者', '闘技王', '黒炉鍛冶師', '神機技師', 'デウス・エクス・マギア']) assert.ok(ev.some(j => j.name === n), n);
    const out = []; const ws = { readyState: 1, send: x => out.push(JSON.parse(x)), close() {} }; const last = t => [...out].reverse().find(m => m.t === t); const err = () => out.filter(m => m.t === 'err').at(-1)?.v;
    const r = store.register('jobber', 'pass1234'); const s = w.attach(ws, r.account); w.handle(s, { t: 'create', name: '転職者', wt: 1 }); w.handle(s, { t: 'play', id: last('chars').list[0].id });
    const ch = s.ch; ch.level = 120;
    const J = id => DATA.jobs.get(id);
    // event / flag unlocks
    assert.equal(jobUnlockMet(ch, J('ev_blackforge')), false); ch.events = { prog: { sl_blackforge: { done: true, clears: 1 } }, rewards: {}, log: [], seen: {} }; assert.equal(jobUnlockMet(ch, J('ev_blackforge')), true);
    assert.equal(jobUnlockMet(ch, J('ev_godmachinist')), false); ch.progress.flags = { machinist: true }; assert.equal(jobUnlockMet(ch, J('ev_godmachinist')), true);
    checkJobUnlocks(ch, () => {}); assert.ok(ch.jobs.ev_blackforge && ch.jobs.ev_godmachinist); assert.ok(!ch.jobs.ev_godpilot, 'needs godmachinist rank 6');
    // sin route: heretic → sinner of the chosen route only; only one bishop
    ch.events.prog.lib_forbidden = { done: true, clears: 1 }; checkJobUnlocks(ch, () => {}); assert.ok(ch.jobs.ev_heretic);
    w.handle(s, { t: 'menu', op: 'sinRoute', sin: 'wrath' }); assert.equal(ch.progress.sinRoute, 'wrath'); ch.jobs.ev_heretic.rank = 3; checkJobUnlocks(ch, () => {});
    assert.ok(ch.jobs.ev_sinner_wrath); assert.ok(!ch.jobs.ev_sinner_greed, 'other routes stay locked');
    w.handle(s, { t: 'menu', op: 'sinRoute', sin: 'greed' }); assert.ok(err().includes('変えられない'));
    ch.events.prog.lib_sins = { done: true, clears: 1 }; ch.jobs.ev_sinner_wrath.rank = 8; checkJobUnlocks(ch, () => {}); assert.ok(ch.jobs.ev_bishop_wrath);
    ch.jobs.ev_bishop_greed = undefined; delete ch.jobs.ev_bishop_greed; ch.progress.sinRoute = 'greed'; ch.jobs.ev_sinner_greed = { rank: 8, xp: 0 }; assert.equal(jobUnlockMet(ch, J('ev_bishop_greed')), false, 'one bishop per character');
    // completing a Gravel event unlocks the job immediately (via the event engine) and you can switch to it in town
    const r2 = store.register('smithy2', 'pass1234'); const s2 = w.attach({ readyState: 1, send: x => out.push(JSON.parse(x)), close() {} }, r2.account); w.handle(s2, { t: 'create', name: '鍛冶見習い', wt: 27 }); w.handle(s2, { t: 'play', id: [...out].reverse().find(m => m.t === 'chars').list[0].id });
    s2.ch.level = 40; w.events.start(s2, 'sl_blackforge'); w.events.complete(s2, 'sl_blackforge'); assert.ok(s2.ch.jobs.ev_blackforge, 'unlocked on completion');
    w.handle(s2, { t: 'menu', op: 'job', id: 'ev_blackforge' }); assert.equal(s2.ch.job, 'ev_blackforge');
    // stats/passive apply and the active skill fires
    s2.actor.refreshStats(); assert.ok(s2.actor.stats.mods.pen >= 0.12);
    s2.ch.skills.slots[0] = 'job_ev_blackforge'; const z = s2.actor.zone; s2.actor.sp = 999; assert.equal(s2.actor.useSkill('job_ev_blackforge', z, {}), 'ok');
    void makeMonster;
  } finally { setTimeout(() => process.exit(process.exitCode || 0), 50); }
});
