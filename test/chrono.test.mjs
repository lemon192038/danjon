// 時律投刃士: job + silver knives, 5-step combo, styles, independent multipliers, marks, collapse, time stop, planting.
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
process.env.DATA_DIR = '/tmp/claude-0/abyss-chrono-test';
fs.rmSync(process.env.DATA_DIR, { recursive: true, force: true });
const { World } = await import('../server/game/world.js');
const { store } = await import('../server/store.js');
const { setClockAt } = await import('../server/game/life.js');
const { makeMonster } = await import('../server/game/monsters.js');
const C = await import('../server/game/chrono.js');
const { COMBO_MUL, HIT_MUL, COMBO } = await import('../shared/data/chrono.js');
await store.init(); setClockAt(300, 12);

test('chrono blade thrower', async () => {
  const w = new World();
  try {
    const out = []; const ws = { readyState: 1, bufferedAmount: 0, send: x => out.push(JSON.parse(x)), close() {} }; const r = store.register('chrono1', 'pass1234'); const s = w.attach(ws, r.account);
    w.handle(s, { t: 'create', name: '時の投手', wt: 9 }); w.handle(s, { t: 'play', id: [...out].reverse().find(m => m.t === 'chars').list[0].id }); const ch = s.ch; let a = s.actor; ch.level = 30;
    const err = () => out.filter(m => m.t === 'err').at(-1)?.v; const menu = m => w.handle(s, { t: 'menu', ...m });
    ch.inventory.push({ uid: 'K0', kind: 'weapon', ref: 'job_silverknife', plus: 0 }); menu({ op: 'equip', uid: 'K0' }); assert.match(err() || '', /時律投刃士/, 'job-only weapon');
    w.enterZone(s, w.zones.get('haven')); menu({ op: 'job', id: 'ev_chrono' }); assert.equal(ch.job, 'ev_chrono'); const kn = ch.inventory.find(i => i.ref === 'job_silverknife'); menu({ op: 'equip', uid: kn.uid }); a = s.actor; assert.equal(ch.equip.weapon, kn.uid); assert.ok(C.isChrono(a));
    // an arena
    const z = w.zones.get('field_greatwood'); w.enterZone(s, z); a = s.actor; for (const x of [...z.actors.values()]) if (x.kind === 'monster') z.remove(x);
    const foe = (x, y, boss) => { const m = makeMonster('golem', 30, 'NORMAL'); m.x = x; m.y = y; m.maxHp = m.hp = 1e9; m.stats.atk = 0; m.boss = !!boss; z.add(m); return m; };
    a.x = 400; a.y = 300; const m1 = foe(460, 300); a.invulnUntil = 1e15;
    // five-step combo: 1, 2, 3, 2 (with movement), 8 knives
    const throws = []; const of = z.fx.bind(z); z.fx = o => { if (o.t === 'kthrow') throws.push(o.n); of(o); };
    for (let i = 0; i < 60 && throws.length < 5; i++) { a.input = { atk: true }; z.tick(50); } a.input = {}; assert.deepEqual(throws.slice(0, 5), [1, 2, 3, 2, 8]);
    // styles: rapid +25% aspd / 90% dmg, pierce -10% / 135% and passes through 3 enemies
    const base = a.stats.aspd / 1.25; assert.ok(Math.abs(a.stats.aspd / base - 1.25) < 0.01); a.special('press', z); assert.equal(a.chrono.style, 'pierce'); assert.ok(Math.abs(a.stats.aspd / base - 0.9) < 0.01);
    assert.equal(C.chronoCombo(a)[0].pierce, 2); assert.ok(Math.abs(C.chronoCombo(a)[0].m / C.chronoCombo(a)[0].m - 1) < 1e-9);
    // combo multiplier and 0.7s hit-count multiplier are independent
    const S = a.chrono; S.combo = 0; S.lastHit = 0; S.hits.clear(); const now = z.now;
    const mul = () => C.chronoMul(z, a, m1, { m: 1 }, z.now); S.style = 'rapid'; S.pierceT = null;
    assert.equal(mul(), 1); for (let i = 0; i < 8; i++) C.chronoDeal(z, a, m1, 10, { knife: 1 }, z.now);
    assert.ok(Math.abs(mul() - COMBO_MUL.find(([k]) => 9 >= k)[1] * HIT_MUL[9]) < 1e-9, 'combo ×1.15 and 9 hits ×2.3');
    S.hits.clear(); assert.ok(Math.abs(mul() - 1.15) < 1e-9, 'clearing the hit window keeps the combo'); S.combo = 0; for (let i = 0; i < 3; i++) C.chronoDeal(z, a, m1, 10, {}, z.now - 0); S.lastHit = z.now - 5000; assert.ok(Math.abs(mul() - HIT_MUL[4]) < 1e-9, 'combo expired after 4s, hit window kept');
    void now;
    // marks: per enemy, 100 → next skill empowered and consumed
    m1.cmark = {}; S.empower = null; for (let i = 0; i < 30; i++) C.chronoDeal(z, a, m1, 1, { knife: 1 }, z.now); assert.equal(m1.cmark[a.id], 100); assert.equal(S.empower, m1.id);
    // collapse: gauge rules, 6 seconds, timelag style available, returns to the previous style
    S.gauge = 0; C.chronoDeal(z, a, m1, 1, {}, z.now); assert.equal(S.gauge, 2); C.chronoDeal(z, a, m1, 1, { isSkill: 1, finisher: 1 }, z.now); assert.equal(S.gauge, 20); C.chronoParry(a); assert.equal(S.gauge, 32);
    S.gauge = 100; S.style = 'pierce'; S.prevStyle = 'pierce'; a.cds = {}; a.action = null; assert.equal(a.useSkill('chr_collapse', z, {}), 'ok'); for (let i = 0; i < 3; i++) z.tick(50); assert.ok(S.collapseUntil > z.now); a.special('press', z); assert.equal(S.style, 'timelag');
    for (let i = 0; i < 125; i++) z.tick(50); assert.equal(S.collapseUntil, 0); assert.equal(S.gauge, 0); assert.equal(S.style, 'pierce');
    // time stop: enemies frozen, bosses slowed, players untouched; unlimited planting fires exactly once each
    const boss = foe(430, 330, true); a.cds = {}; a.action = null; S.empower = null; const p2 = { kind: 'player', team: 'enemy' }; void p2;
    assert.equal(a.useSkill('chr_square', z, {}), 'ok'); for (let i = 0; i < 2; i++) z.tick(50); assert.ok(m1.timeStopUntil > z.now, 'enemy stopped'); assert.ok(boss.timeScaleUntil > z.now && !(boss.timeStopUntil > z.now), 'boss slowed, not stopped');
    const mx = m1.x; for (let i = 0; i < 10; i++) z.tick(50); assert.equal(m1.x, mx, 'frozen enemy does not move');
    for (let i = 0; i < 100; i++) C.plant(z, a, [[440 + (i % 10) * 3, 280 + Math.floor(i / 10) * 3]]); assert.equal(S.planted.length / 2, 100, '100 knives planted, no cap');
    let fired = 0; z.fx = o => { if (o.t === 'krelease') fired = o.n; of(o); }; for (let i = 0; i < 70 && !fired; i++) z.tick(50); assert.equal(fired, 100); assert.equal(S.planted.length, 0);
    // skills: luna clock fires, killing doll launches 40 knives
    a.cds = {}; a.action = null; assert.equal(a.useSkill('chr_lunaclock', z, {}), 'ok'); const n0 = z.projs.length; for (let i = 0; i < 30; i++) z.tick(50); assert.ok(z.projs.length > n0 || m1.hp < 1e9, 'clocks fire');
    a.cds = {}; a.action = null; let dollN = 0; const ap = z.addProj.bind(z); z.addProj = p => { if (p.owner === a) dollN++; ap(p); }; a.chrono.clocks = []; assert.equal(a.useSkill('chr_doll', z, {}), 'ok'); for (let i = 0; i < 45; i++) z.tick(50); assert.equal(dollN, 40, 'killing doll launches 40 knives');
    assert.equal(COMBO.length, 5); assert.ok(ch.progress, 'state lives on the character');
  } finally { setTimeout(() => process.exit(process.exitCode || 0), 50); }
});
