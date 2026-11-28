// Player duels: challenge/accept, private arena with opposite teams, no death, damage cap, rounds, Elo, return & restore,
// forfeit and disconnect.
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
process.env.DATA_DIR = '/tmp/claude-0/abyss-pvp-test';
fs.rmSync(process.env.DATA_DIR, { recursive: true, force: true });
const { World } = await import('../server/game/world.js');
const { store } = await import('../server/store.js');
const { setClockAt } = await import('../server/game/life.js');
const { dealDamage } = await import('../server/game/combat.js');
await store.init(); setClockAt(310, 12);

test('player vs player duels', async () => {
  const w = new World();
  try {
    const mk = (u, name) => { const out = []; const ws = { readyState: 1, bufferedAmount: 0, send: x => out.push(JSON.parse(x)), close() {} }; const r = store.register(u, 'pass1234'); const s = w.attach(ws, r.account); w.handle(s, { t: 'create', name, wt: 1 }); w.handle(s, { t: 'play', id: [...out].reverse().find(m => m.t === 'chars').list[0].id }); s.out = out; return s; };
    const A = mk('pvpa', '剣士A'), B = mk('pvpb', '剣士B'); const town = w.zones.get('haven'); w.enterZone(A, town); w.enterZone(B, town);
    B.actor.x = A.actor.x + 40; B.actor.y = A.actor.y; const ax = A.actor.x, ay = A.actor.y; const goldA = A.ch.gold, invA = A.ch.inventory.length;
    const menu = (s, m) => w.handle(s, { t: 'menu', op: 'pvp', ...m }); const err = s => s.out.filter(m => m.t === 'err').at(-1)?.v;
    menu(A, { do: 'challenge', id: B.ch.id, rounds: 3 }); assert.ok(B.out.some(m => m.t === 'open' && m.service === 'pvp' && m.data.inv.length === 1), 'B sees the invitation');
    menu(B, { do: 'accept', from: A.ch.id }); const z = A.actor.zone; assert.ok(z.pvp, 'both in a private arena'); assert.equal(B.actor.zone, z); assert.notEqual(A.actor.team, B.actor.team); assert.ok(z.enemiesOf(A.actor).includes(B.actor));
    // countdown: no damage
    assert.equal(dealDamage(z, A.actor, B.actor, { m: 5 }, z.now), 0); for (let i = 0; i < 65; i++) z.tick(50);
    const hp0 = B.actor.hp; const d = dealDamage(z, A.actor, B.actor, { m: 500 }, z.now); assert.ok(d > 0 && d <= Math.round(B.actor.maxHp * 0.25), 'a single hit is capped at 25%: ' + d + '/' + B.actor.maxHp); assert.ok(B.actor.hp < hp0);
    // a round ends at 1 HP — nobody dies
    for (let i = 0; i < 6 && z.pvp && !w.pvp.matches.get(z.pvp.id)?.over; i++) dealDamage(z, A.actor, B.actor, { m: 500 }, z.now); const M = w.pvp.matches.get(z.pvp.id);
    assert.ok(M.over && !B.actor.dead && B.actor.hp >= 1, 'round over, B alive'); assert.equal(M.score[A.ch.id], 1);
    for (let i = 0; i < 40; i++) z.tick(50); assert.equal(M.round, 2, 'second round started'); assert.equal(B.actor.hp, B.actor.maxHp, 'HP refilled for the next round');
    for (let i = 0; i < 65; i++) z.tick(50); for (let i = 0; i < 8 && !M.over; i++) dealDamage(z, A.actor, B.actor, { m: 500 }, z.now); for (let i = 0; i < 40; i++) z.tick(50);
    assert.ok(M.done, 'best of three decided 2-0'); assert.equal(A.actor.zone, town); assert.equal(B.actor.zone, town); assert.ok(Math.abs(A.actor.x - ax) < 1 && Math.abs(A.actor.y - ay) < 1, 'returned to where they were');
    const R = w.events.w.flags.pvp.ratings; assert.ok(R[A.ch.id].r > 1500 && R[B.ch.id].r < 1500); assert.equal(R[A.ch.id].w, 1); assert.equal(A.ch.progress.pvp.w, 1); assert.equal(B.ch.progress.pvp.l, 1);
    assert.equal(A.ch.gold, goldA); assert.equal(A.ch.inventory.length, invA, 'nothing is at stake');
    // forfeit
    menu(B, { do: 'challenge', id: A.ch.id }); menu(A, { do: 'accept', from: B.ch.id }); assert.ok(A.actor.zone.pvp); menu(A, { do: 'forfeit' }); assert.equal(A.actor.zone, town); assert.equal(w.events.w.flags.pvp.ratings[B.ch.id].w, 1);
    // disconnect → the other wins and is returned
    menu(A, { do: 'challenge', id: B.ch.id }); menu(B, { do: 'accept', from: A.ch.id }); assert.ok(B.actor.zone.pvp); w.detach(A); assert.equal(B.actor.zone, town); assert.equal(w.events.w.flags.pvp.ratings[B.ch.id].w, 2);
    // time stop in a duel: the opponent player's time stops (collapse and the time-stop square); the user's does not
    const C = await import('../server/game/chrono.js');
    const Cc = mk('pvpc', '剣士C'); w.enterZone(Cc, town); Cc.actor.x = B.actor.x + 30; Cc.actor.y = B.actor.y;
    menu(Cc, { do: 'challenge', id: B.ch.id }); menu(B, { do: 'accept', from: Cc.ch.id }); const dz = B.actor.zone; assert.ok(dz.pvp); for (let i = 0; i < 65; i++) dz.tick(50);
    const pa = B.actor, pb = Cc.actor; // B uses chrono
    B.ch.job = 'ev_chrono'; B.ch.inventory.push({ uid: 'KX', kind: 'weapon', ref: 'job_silverknife', plus: 0 }); B.ch.equip.weapon = 'KX'; pa.refreshStats(); assert.ok(C.isChrono(pa));
    pa.chrono.gauge = 100; pa.action = null; pa.cds = {}; assert.equal(pa.useSkill('chr_collapse', dz, {}), 'ok'); dz.tick(50);
    assert.ok(C.isTimeFrozen(dz, pb, dz.now), 'the opponent is frozen ' + JSON.stringify({ cu: dz.collapseUntil - dz.now, ct: dz.collapseTeam, bt: pb.team, at: pa.team, pvp: !!dz.pvp, same: pb.zone === dz, g: pa.chrono.gauge, cc: pa.chrono.collapseUntil - dz.now })); assert.ok(!C.isTimeFrozen(dz, pa, dz.now), 'the user is not'); assert.ok(!pb.canAct(dz.now), 'the opponent cannot act');
    const bx = pb.x, bhp = pb.hp; pb.input = { mx: 1, my: 0 }; for (let i = 0; i < 10; i++) dz.tick(50); assert.equal(pb.x, bx, 'cannot move'); assert.equal(dealDamage(dz, pa, pb, { m: 3 }, dz.now), 0, 'takes no damage while stopped');
    assert.equal(pb.attack(dz.now, dz), false, 'cannot attack'); pb.input = {}; for (let i = 0; i < 120; i++) dz.tick(50); assert.ok(!C.isTimeFrozen(dz, pb, dz.now), 'time resumes'); assert.ok(pb.canAct(dz.now));
    pa.action = null; pa.cds = {}; pa.x = pb.x - 40; pa.y = pb.y; assert.equal(pa.useSkill('chr_square', dz, {}), 'ok'); dz.tick(50); assert.ok(pb.timeStopUntil > dz.now, 'the square stops the opponent too');
    menu(Cc, { do: 'forfeit' }); void bhp;
    // no duels from dungeons / expired invitations
    menu(B, { do: 'accept', from: 'nobody' }); assert.match(err(B), /期限切れ/);
  } finally { setTimeout(() => process.exit(process.exitCode || 0), 50); }
});
