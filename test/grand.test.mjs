// NEW WORLD EVENTS — PHASE F (25-30) and PHASE G (01-04, 06): trials, unknown species, legendary catalog, rally,
// artisan contest, star readers, sky castle, unrecorded people, world serpent, boundary collapse, the tower.
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
process.env.DATA_DIR = '/tmp/claude-0/abyss-grand-test';
fs.rmSync(process.env.DATA_DIR, { recursive: true, force: true });
const { World } = await import('../server/game/world.js');
const { store } = await import('../server/store.js');
const { setClockAt } = await import('../server/game/life.js');
const { EVENT_BY_ID } = await import('../shared/data/events.js');
const { GRAND_EVENTS, SPECIES, STARS, UNRECORDED, SERPENT_SEGS, RIFT_FIELDS } = await import('../shared/data/grand.js');
const { DATA } = await import('../server/data.js');
await store.init(); setClockAt(240, 12);

test('challenge, collection and great world events', async () => {
  const w = new World();
  try {
    const mk = (u, name) => { const out = []; const ws = { readyState: 1, bufferedAmount: 0, send: x => out.push(JSON.parse(x)), close() {} }; const r = store.register(u, 'pass1234'); const s = w.attach(ws, r.account); w.handle(s, { t: 'create', name, wt: 1 }); w.handle(s, { t: 'play', id: [...out].reverse().find(m => m.t === 'chars').list[0].id }); s.out = out; return s; };
    const s = mk('grand1', '挑戦者'), s2 = mk('grand2', '協力者'); const ch = s.ch; ch.level = 80; ch.gold = 1e6; const E = w.events, G = w.grand.G;
    const err = (x = s) => x.out.filter(m => m.t === 'err').at(-1)?.v; const toast = (x = s) => x.out.filter(m => m.t === 'toast').at(-1)?.v;
    const menu = (m, x = s) => w.handle(x, { t: 'menu', op: 'cev', ...m });
    const host = (ev, x = s) => { const H = GRAND_EVENTS[ev].host; const z = w.zones.get(H.city); w.enterZone(x, z); const n = z.map.npcs.find(q => q.ev === ev); assert.ok(n, 'host placed ' + ev); const p = z.tileCenter([n.x, n.y]); x.actor.x = p.x; x.actor.y = p.y + 10; };
    for (const id of Object.keys(GRAND_EVENTS)) assert.equal(EVENT_BY_ID[id].status, 'live', id);
    const go = (ev, extra = {}, x = s) => { host(ev, x); menu({ ev, act: 'go', ...extra }, x); };
    const svc = (ev, mode, ref, x = s) => { host(ev, x); menu({ ev, act: 'svc', mode, ref }, x); };
    // ── 25 trials: measured from the character's own records; claimed into rewards and titles
    host('nx25'); menu({ ev: 'nx25', act: 'start' }); go('nx25'); go('nx25'); assert.match(err(), /試練の達成が足りない/);
    ch.progress.kills = 2500; ch.progress.famKills = Object.fromEntries(['slime', 'rat', 'goblin', 'wolf', 'bat', 'spider', 'golem', 'imp', 'wisp'].map(f => [f, 5])); ch.gold = 400000;
    svc('nx25', 'claim'); assert.ok(w.grand.P(ch).trials.length >= 10, 'trials claimed: ' + w.grand.P(ch).trials.length); assert.ok(ch.progress.titles.includes('試練の挑戦者'));
    go('nx25'); assert.equal(E.prog(ch, 'nx25').stage, 2);
    // ── 26 species: a family under its condition becomes a record; reported to the bureau
    const zf = w.zones.get('field_greatwood'); setClockAt(240, 22); w.grand.onKill(s, { fam: 'wolf' }, zf); assert.ok(w.grand.P(ch).species.nightwolf, 'night wolf recorded');
    setClockAt(240, 12); w.grand.onKill(s, { fam: 'knight', elite: true }, zf); w.grand.onKill(s, { fam: 'spider', elite: true }, zf); w.grand.onKill(s, { fam: 'wolf' }, zf);
    host('nx26'); menu({ ev: 'nx26', act: 'start' }); go('nx26'); svc('nx26', 'report'); assert.equal(w.grand.P(ch).reported.length, 3); go('nx26'); assert.equal(E.prog(ch, 'nx26').stage, 2);
    // ── 27 catalog: types with an UR+ weapon in the codex
    const urs = []; for (const [wt, ws] of DATA.wtWeapons) { const u = ws.find(x => x.rar >= 5); if (u) urs.push(u.id); if (urs.length >= 5) break; }
    ch.progress.codex.push(...urs); svc('nx27', 'catalog'); assert.ok(w.grand.P(ch).catalogMiles.includes(5)); host('nx27'); menu({ ev: 'nx27', act: 'start' }); go('nx27'); go('nx27'); assert.equal(E.prog(ch, 'nx27').stage, 2);
    // ── 28 rally: checkpoints in order, time recorded and ranked
    host('nx28'); menu({ ev: 'nx28', act: 'start' }); go('nx28'); svc('nx28', 'start'); const course = w.grand.course();
    w.enterZone(s, w.zones.get(course[2])); assert.equal(w.grand.P(ch).rally.cp, 0, 'out-of-order checkpoint ignored');
    for (const c of course) w.enterZone(s, w.zones.get(c)); assert.ok(w.grand.P(ch).rally.done); assert.equal(w.grand.rallyRank()[0].name, '挑戦者'); go('nx28'); go('nx28'); assert.ok(E.prog(ch, 'nx28').done);
    // ── 29 artisan: entry scored from the weapon (not taken), judged at the end, top 3 awarded
    setClockAt(240, 12); w.grand.sim(1); const wid = ch.inventory.find(i => i.kind === 'weapon'); wid.plus = 9;
    host('nx29'); menu({ ev: 'nx29', act: 'start' }); go('nx29'); if (w.grand.artisanOpen()) { svc('nx29', 'enter', wid.uid); assert.ok(ch.inventory.includes(wid), 'weapon kept'); go('nx29'); go('nx29'); assert.ok(E.prog(ch, 'nx29').done); w.grand.judge(); assert.ok(ch.progress.titles.includes('至高の職人')); }
    // ── 30 stars: field stones at night, clear sky, the constellation's hours
    const star = STARS[0]; const sz = w.zones.get(star.field); const obj = sz.map.objects.find(o => o.k === 'starstone'); assert.ok(obj, 'star stone placed'); w.enterZone(s, sz);
    setClockAt(241, 12); w.grand.onObject(s, obj, sz); assert.ok(!w.grand.P(ch).stars.crown, 'not in daytime');
    w.life.weather[w.cityNear(sz)] = 'clear'; setClockAt(241, star.h[0]); w.grand.onObject(s, obj, sz); assert.ok(w.grand.P(ch).stars.crown, 'observed at night under a clear sky');
    // ── 02 unrecorded people: met at night in the fields
    for (const U of UNRECORDED.slice(0, 3)) { const z = w.zones.get(U.field); const o = z.map.objects.find(x => x.k === 'unrecorded' && x.key === U.key); assert.ok(o, 'person ' + U.key); setClockAt(241, 22); w.grand.onObject(s, o, z); }
    host('nx02'); menu({ ev: 'nx02', act: 'start' }); go('nx02'); go('nx02'); assert.equal(E.prog(ch, 'nx02').stage, 2);
    // ── 01 sky castle: appears on its cycle, barrier lowered by everyone; the castle dungeon opens only then
    setClockAt(252, 12); w.grand.sim(1); assert.equal(G.sky.state, 'barrier'); host('nx01'); menu({ ev: 'nx01', act: 'start' }); go('nx01'); go('nx01'); assert.match(err(), /障壁/);
    for (let i = 0; i < 160; i++) { w.grand.onKill(s, { fam: 'slime' }, zf); w.grand.onKill(s2, { fam: 'slime' }, zf); } assert.equal(G.sky.state, 'open'); go('nx01'); assert.equal(E.prog(ch, 'nx01').stage, 2);
    assert.equal(w.grand.gateBlock('sky_castle'), null); w.cev.onFloor(s, { dungeon: { id: 'sky_castle' }, floor: 15 }, true); go('nx01', { choice: 'study' }); assert.ok(E.prog(ch, 'nx01').done);
    // ── 03 serpent: four segments, sealed by contributions in their fields (never killed)
    setClockAt(260, 12); w.grand.sim(1); assert.equal(G.serpent.state, 'active');
    for (const seg of SERPENT_SEGS) { const z = w.zones.get(seg.field); for (let i = 0; i < 120; i++) w.grand.onKill(i % 2 ? s : s2, { fam: 'slime' }, z); }
    assert.equal(G.serpent.state, 'sealed'); host('nx03'); menu({ ev: 'nx03', act: 'start' }); go('nx03'); go('nx03'); go('nx03'); go('nx03'); assert.ok(E.prog(ch, 'nx03').done);
    // ── 04 boundary collapse: rifts close by contributions; requires the forbidden library's truth
    setClockAt(269, 12); w.grand.sim(1); assert.equal(G.rift.state, 'active'); for (const r of RIFT_FIELDS) { const z = w.zones.get(r.field); for (let i = 0; i < 100; i++) w.grand.onKill(i % 2 ? s : s2, { fam: 'slime' }, z); }
    assert.equal(G.rift.state, 'closed'); host('nx04'); menu({ ev: 'nx04', act: 'start' }); go('nx04'); go('nx04'); assert.match(err(), /禁書庫/);
    // ── 06 tower: grows daily, pushed back by descending it; never destroys anything
    const h0 = G.tower.h; setClockAt(270, 12); w.grand.sim(1); assert.ok(G.tower.h > h0); w.grand.onBoss(s, { dungeon: { id: 'sea_tower' } }); assert.ok(G.tower.h < h0 + 4);
    host('nx06'); menu({ ev: 'nx06', act: 'start' }); go('nx06'); w.cev.onFloor(s, { dungeon: { id: 'sea_tower' }, floor: 10 }, true); w.cev.onFloor(s, { dungeon: { id: 'sea_tower' }, floor: 20 }, true); go('nx06', { choice: 'seal' }); assert.ok(E.prog(ch, 'nx06').done);
    // panels render for every event
    for (const ev of Object.keys(GRAND_EVENTS).filter(k => GRAND_EVENTS[k].service === 'grand')) { const v = w.grand.view(s, ev); assert.equal(v.kind, 'grand'); assert.ok(v.rows.length, ev); }
    void SPECIES; void toast;
  } finally { setTimeout(() => process.exit(process.exitCode || 0), 50); }
});
