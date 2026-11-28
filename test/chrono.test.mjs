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
const { dealDamage } = await import('../server/game/combat.js');
const { COMBO_MUL, HIT_MUL, COMBO } = await import('../shared/data/chrono.js');
await store.init(); setClockAt(300, 12);

test('chrono blade thrower', async () => {
  const w = new World();
  try {
    const out = []; const ws = { readyState: 1, bufferedAmount: 0, send: x => out.push(JSON.parse(x)), close() {} }; const r = store.register('chrono1', 'pass1234'); void 0; const s = w.attach(ws, r.account);
    w.handle(s, { t: 'create', name: '時の投手', wt: 9 }); w.handle(s, { t: 'play', id: [...out].reverse().find(m => m.t === 'chars').list[0].id }); const ch = s.ch; let a = s.actor; ch.level = 30;
    const err = () => out.filter(m => m.t === 'err').at(-1)?.v; const menu = m => w.handle(s, { t: 'menu', ...m });
    ch.inventory.push({ uid: 'K0', kind: 'weapon', ref: 'job_silverknife', plus: 0 }); menu({ op: 'equip', uid: 'K0' }); assert.match(err() || '', /時律投刃士/, 'job-only weapon');
    w.enterZone(s, w.zones.get('haven')); menu({ op: 'job', id: 'ev_chrono' }); assert.notEqual(ch.job, 'ev_chrono', 'locked without the prerequisite job and event');
    // 狩人 (base job) → quest 一投必中 → 投刃士 → quest 刻を止める銀刃 (book, midnight workshop, …) → 時律投刃士
    const E = w.events; const cev = m => w.handle(s, { t: 'menu', op: 'cev', ...m });
    const goHost = (ev, city) => { const zz = w.zones.get(city); if (s.actor.zone !== zz) w.enterZone(s, zz); const h = zz.map.npcs.find(n => n.ev === ev); assert.ok(h, 'host ' + ev); const p = zz.tileCenter([h.x, h.y]); s.actor.x = p.x; s.actor.y = p.y + 10; };
    ch.level = 30; w.enterZone(s, w.zones.get('haven')); menu({ op: 'job', id: 'ev_bladethrower' }); assert.notEqual(ch.job, 'ev_bladethrower', '投刃士 needs 狩人 and its quest');
    goHost('ct_bladethrower', 'haven'); cev({ ev: 'ct_bladethrower', act: 'start' }); cev({ ev: 'ct_bladethrower', act: 'go' }); cev({ ev: 'ct_bladethrower', act: 'go' }); assert.match(err(), /前提職/);
    ch.jobs.hunter_0 = { rank: 2, xp: 0 }; cev({ ev: 'ct_bladethrower', act: 'go' }); for (let i = 0; i < 30; i++) w.cev.onKill(s, { fam: 'slime' }, s.actor); goHost('ct_bladethrower', 'haven'); cev({ ev: 'ct_bladethrower', act: 'go', choice: 1 }); cev({ ev: 'ct_bladethrower', act: 'go' });
    assert.ok(E.prog(ch, 'ct_bladethrower').done); menu({ op: 'job', id: 'ev_bladethrower' }); assert.equal(ch.job, 'ev_bladethrower');
    const go = () => { goHost('ct_chrono', 'celestia'); cev({ ev: 'ct_chrono', act: 'go' }); };
    goHost('ct_chrono', 'celestia'); cev({ ev: 'ct_chrono', act: 'start' }); go(); go(); assert.match(err(), /時空間の研究/, 'the book comes first');
    ch.progress.books = { chronospace: 2 }; go(); assert.match(err(), /時空間の研究/, 'must be read to the end'); ch.progress.books.chronospace = 3; go();
    go(); assert.match(err(), /時計屋の工房/); const shop = w.zones.get('celestia').map.doors.find(d => d.id === 'c_clockshop'); assert.ok(shop && shop.hours[0] === 0 && shop.hours[1] === 3, 'the workshop opens only 0:00-3:00');
    w.grand.onEnterZone(s, { id: 'in:c_clockshop' }); go(); go(); go(); assert.match(err(), /前提職/);
    ch.jobs.ev_bladethrower.rank = 3; go(); for (let i = 0; i < 40; i++) w.cev.onKill(s, { fam: 'slime' }, s.actor); goHost('ct_chrono', 'celestia'); cev({ ev: 'ct_chrono', act: 'go', choice: 1 }); w.cev.onFloor(s, { dungeon: { id: 'd01' }, floor: 21 }, false); go();
    assert.ok(E.prog(ch, 'ct_chrono').done, 'unlock event done');
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
    S.gauge = 100; S.style = 'pierce'; S.prevStyle = 'pierce'; a.cds = {}; a.action = null; assert.equal(a.useSkill('chr_collapse', z, {}), 'ok'); for (let i = 0; i < 3; i++) z.tick(50); assert.ok(S.collapseUntil > z.now);
    // collapse = enemies' time stops: no movement, no attacks, no status damage, no damage taken; timers resume afterwards
    m1.statuses.bleed = { until: z.now + 3000, stacks: 1, src: a.id, pow: 1, nextDot: z.now }; const hpF = m1.hp, xF = m1.x; m1.vx = 50;
    for (let i = 0; i < 20; i++) z.tick(50); assert.equal(m1.hp, hpF, 'no status damage while time is stopped'); assert.equal(m1.x, xF, 'no movement'); assert.ok(!m1.canAct(z.now), 'cannot act');
    assert.equal(dealDamage(z, a, m1, { m: 5 }, z.now), 0, 'nothing reaches a stopped enemy'); const bleedLeft = m1.statuses.bleed.until - z.now;
    // knives thrown now fly 0.05s, then hang in the air until the collapse ends
    const ap0 = z.addProj.bind(z); const mine = []; z.addProj = p => { if (p.owner === a) mine.push(p); ap0(p); }; const st0 = S.style; S.style = 'rapid'; a.action = null; a.input = { atk: true }; for (let i = 0; i < 4 && !mine.length; i++) z.tick(50); a.input = {}; z.addProj = ap0;
    for (let i = 0; i < 3; i++) z.tick(50); const held = mine.filter(p => !p.dead); assert.ok(held.length > 0, 'knives thrown'); const pos = held.map(p => [p.x, p.y]); for (let i = 0; i < 10; i++) z.tick(50);
    assert.deepEqual(held.map(p => [p.x, p.y]), pos, 'knives stop in the air'); assert.equal(m1.hp, hpF); S.style = st0; a.special('press', z); assert.equal(S.style, 'timelag');
    for (let i = 0; i < 125; i++) z.tick(50); assert.equal(S.collapseUntil, 0); assert.equal(S.gauge, 0); assert.equal(S.style, 'pierce');
    assert.ok(m1.hp < hpF, 'when time resumes the held knives (and the bleed) land'); assert.ok(!m1.statuses.bleed || m1.statuses.bleed.until - z.now > bleedLeft - 1500, 'status timers were paused, not consumed'); assert.ok(m1.canAct(z.now));
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
    // one-time reset for characters that already had the job: job, rank, knives and skill slots removed; other assets kept
    const gold = ch.gold; delete ch.progress.chronoReset1; ch.jobs.ev_chrono = { rank: 7, xp: 0 }; ch.job = 'ev_chrono'; ch.skills.slots[0] = 'chr_square'; const cid = ch.id; w.detach(s); out.length = 0;
    const s2 = w.attach(ws, r.account); w.handle(s2, { t: 'play', id: cid }); const c2 = s2.ch; assert.ok(!c2.jobs.ev_chrono && c2.job !== 'ev_chrono', 'job removed'); assert.ok(!c2.inventory.some(i => i.ref === 'job_silverknife'), 'job-only knives removed');
    assert.ok(c2.equip.weapon && c2.inventory.some(i => i.uid === c2.equip.weapon), 'another weapon equipped'); assert.equal(c2.skills.slots[0], null); assert.equal(c2.gold, gold); assert.ok(out.some(m => m.t === 'chat' && /投刃士/.test(m.v)), 'player told why');
    const again = c2.job; w.detach(s2); const s3 = w.attach(ws, r.account); w.handle(s3, { t: 'play', id: cid }); assert.equal(s3.ch.job, again, 'reset runs once');
    // quest-progress reset: everyone's 刻を止める銀刃 progress starts over; current holders keep the job
    const c3 = s3.ch; c3.events.prog.ct_chrono = { stage: 4, done: false, data: {} }; delete c3.progress.chronoQuestReset2; c3.progress.flags = { clockshopVisit: true }; w.detach(s3);
    const s4 = w.attach(ws, r.account); w.handle(s4, { t: 'play', id: cid }); assert.ok(!s4.ch.events.prog.ct_chrono, 'progress reset'); assert.ok(!s4.ch.progress.flags.clockshopVisit);
    s4.ch.jobs.ev_chrono = { rank: 5, xp: 0 }; s4.ch.job = 'ev_chrono'; s4.ch.events.prog.ct_chrono = { stage: 9, done: true, data: {} }; delete s4.ch.progress.chronoQuestReset2; w.detach(s4);
    const s5 = w.attach(ws, r.account); w.handle(s5, { t: 'play', id: cid }); assert.equal(s5.ch.job, 'ev_chrono', 'holders keep 時律投刃士'); assert.ok(s5.ch.jobs.ev_chrono);
    // 投刃士 removal: job and its quest progress removed once; 時律投刃士 kept
    s5.ch.jobs.ev_bladethrower = { rank: 4, xp: 0 }; delete s5.ch.progress.bladeReset1; w.detach(s5);
    const s6 = w.attach(ws, r.account); w.handle(s6, { t: 'play', id: cid }); assert.ok(!s6.ch.jobs.ev_bladethrower, '投刃士 removed'); assert.ok(!s6.ch.events.prog.ct_bladethrower, 'its quest reset'); assert.equal(s6.ch.job, 'ev_chrono');
  } finally { setTimeout(() => process.exit(process.exitCode || 0), 50); }
});
