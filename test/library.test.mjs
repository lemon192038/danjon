// PHASE 8: Sealed Abyss keys, Great Library → Forbidden Archive, books, heretic → sinner → trial → bishop, succession duels.
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
process.env.DATA_DIR = '/tmp/claude-0/abyss-lib-test';
fs.rmSync(process.env.DATA_DIR, { recursive: true, force: true });
const { World } = await import('../server/game/world.js');
const { store } = await import('../server/store.js');
const { DATA } = await import('../server/data.js');
const { setClockHour } = await import('../server/game/life.js');
const { BOOKS, SINS } = await import('../shared/data/library.js');
await store.init(); setClockHour(12);
const sleep = ms => new Promise(r => setTimeout(r, ms));

test('library & sins', async () => {
  const w = new World();
  try {
    const mk = (u, name) => { const out = []; const ws = { readyState: 1, bufferedAmount: 0, send: x => out.push(JSON.parse(x)), close() {} }; const r = store.register(u, 'pass1234'); const s = w.attach(ws, r.account); w.handle(s, { t: 'create', name, wt: 1 }); w.handle(s, { t: 'play', id: out.findLast(m => m.t === 'chars').list[0].id }); s.out = out; return s; };
    const s = mk('libr', '読書家'); const ch = s.ch; ch.level = 100; ch.gold = 1e6; const E = w.events; const menu = m => w.handle(s, { t: 'menu', ...m }); const err = () => s.out.filter(m => m.t === 'err').at(-1)?.v; const last = t => s.out.findLast(m => m.t === t);
    // Sealed Abyss: hidden, HARD+ only, entered from the castle; 100 floors with 10 bands
    const d = DATA.dungeons.get('sealed'); assert.ok(d && d.bands.length === 10 && !DATA.dungeonList.includes(d));
    const az = w.zones.get('arcelia'); w.enterZone(s, az); const castle = az.map.doors.find(x => x.id === 'ar_castle'); w.enterBuilding(s, castle); const gk = s.actor.zone.map.npcs.find(n => n.service === 'sealgate'); assert.ok(gk);
    w.openService(s, 'sealgate'); assert.deepEqual(last('open').data.dungeons, ['sealed']);
    menu({ op: 'dungeon', id: 'sealed', diff: 'NORMAL', floor: 1 }); assert.match(err(), /HARD以上/);
    ch.progress.clears.sealed = { HARD: 99, max: 99 }; menu({ op: 'dungeon', id: 'sealed', diff: 'HARD', floor: 91 }); const dz = s.actor.zone; assert.equal(dz.dungeon.id, 'sealed'); assert.ok(dz.name.includes('深層・'), dz.name);
    // keys: P% = floor/10, per player; untradeable/unsellable
    const orig = Math.random; let got = 0; Math.random = () => 0.05; try { w.library.onBossKilled(s, { dungeon: d, floor: 100, diff: 'HARD' }); got = w.library.keys(ch); } finally { Math.random = orig; } assert.equal(got, 1, '10% at 100F');
    Math.random = () => 0.011; try { w.library.onBossKilled(s, { dungeon: d, floor: 10, diff: 'HARD' }); } finally { Math.random = orig; } assert.equal(w.library.keys(ch), 1, '1% at 10F misses at 1.1%');
    assert.ok(E.isDone(ch, 'lib_sealed_abyss'));
    menu({ op: 'leave' }); assert.equal(s.actor.zone.id, 'arcelia', 'back to Arcelia from the castle gate');
    // Great Library: key holders are guided to the reception; a key opens the Forbidden Archive
    const lib = az.map.doors.find(x => x.id === 'ar_biglib'); ch.inventory.find(i => i.ref === 'archiveKey').n = 2; w.enterBuilding(s, lib); const rec = s.actor.zone.map.npcs.find(n => n.service === 'library'); assert.ok(rec);
    assert.ok(Math.hypot(s.actor.x - s.actor.zone.tileCenter([rec.x, rec.y]).x, s.actor.y - s.actor.zone.tileCenter([rec.x, rec.y]).y) < 40, 'teleported to the reception');
    menu({ op: 'sell', uid: ch.inventory.find(i => i.ref === 'archiveKey').uid }); assert.ok(w.library.keys(ch) === 2, 'not sellable');
    menu({ op: 'library', act: 'enter' }); assert.ok(s.actor.zone.archive); assert.equal(w.library.keys(ch), 1, 'one key consumed'); assert.ok(ch.progress.titles.includes('初めての禁書庫'));
    assert.ok(s.actor.zone.map.npcs.some(n => n.service === 'archive'));
    // books are read page by page (server keeps the page); skipping ahead is refused
    menu({ op: 'library', act: 'read', id: 'proof', page: 3 }); assert.equal(last('book').page, 0);
    for (let p = 1; p <= BOOKS.find(b => b.id === 'proof').pages.length; p++) menu({ op: 'library', act: 'read', id: 'proof', page: p }); assert.ok(ch.progress.flags.proofOfMana, 'proof of mana → zero magic condition');
    assert.ok(!ch.jobs.ev_heretic); for (let p = 1; p <= 3; p++) menu({ op: 'library', act: 'read', id: 'sin_wrath', page: p });
    assert.ok(E.prog(ch, 'lib_forbidden').done); assert.ok(ch.jobs.ev_heretic, 'heretic after one sin book');
    // route → sinner → trial (retryable, failure keeps everything) → bishop
    menu({ op: 'sinRoute', sin: 'wrath' }); assert.ok(E.prog(ch, 'lib_sins')); ch.jobs.ev_heretic.rank = 3; w.handle(s, { t: 'menu', op: 'events' }); // job unlock check happens on progress
    const { checkJobUnlocks } = await import('../server/game/progress.js'); checkJobUnlocks(ch); assert.ok(ch.jobs.ev_sinner_wrath, 'wrath sinner'); assert.ok(!ch.jobs.ev_sinner_greed, 'only the main route');
    menu({ op: 'sinRoute', sin: 'greed' }); assert.match(err(), /変えられない/);
    menu({ op: 'library', act: 'trial' }); assert.match(err(), /熟練度8/); ch.jobs.ev_sinner_wrath.rank = 8;
    menu({ op: 'library', act: 'trial' }); let bz = s.actor.zone; assert.equal(bz.bout?.kind, 'sintrial'); bz.onBossKilled && 0; w.duels.onPlayerDown(bz, s); assert.ok(!E.prog(ch, 'lib_sins').done && ch.jobs.ev_sinner_wrath.rank === 8, 'failure loses nothing');
    w.enterZone(s, w.zones.get('fa:' + ch.id)); menu({ op: 'library', act: 'trial' }); bz = s.actor.zone; bz.kill(bz.bout.foe, s.actor, bz.now); await sleep(2700);
    assert.ok(E.prog(ch, 'lib_sins').done); assert.ok(ch.jobs.ev_bishop_wrath, 'wrath bishop'); assert.ok(ch.progress.titles.includes(`「${SINS.wrath.trial}」を越えし者`));
    // succession: NPC holder always accepts; on defeat the NPC remains as a former bishop; history is recorded
    w.enterZone(s, w.zones.get('fa:' + ch.id)); assert.equal(w.library.seats.wrath.holder.kind, 'npc'); const npcName = w.library.seats.wrath.holder.name;
    menu({ op: 'library', act: 'challenge', sin: 'greed' }); assert.match(err(), /主ルート/);
    menu({ op: 'library', act: 'challenge', sin: 'wrath' }); bz = s.actor.zone; assert.equal(bz.bout?.kind, 'succession'); bz.kill(bz.bout.foe, s.actor, bz.now); await sleep(2700);
    assert.equal(w.library.seats.wrath.holder.id, ch.id); const F = E.w.flags; assert.ok(F.formerBishops.some(f => f.name === npcName), 'NPC remains as former bishop'); const h = F.seatHist.at(-1); assert.equal(h.result, '継承'); assert.equal(h.vs, npcName); assert.ok(h.byJob && h.byWt);
    // another player: seat-only path grants the bishop job to a qualified sinner, but never the trial reward
    const s2 = mk('libr2', '挑戦者'); const c2 = s2.ch; c2.level = 100; c2.progress.sinRoute = 'wrath'; c2.jobs.ev_heretic = { rank: 3, xp: 0 }; c2.jobs.ev_sinner_wrath = { rank: 8, xp: 0 }; w.enterZone(s2, w.zones.get('fa:' + ch.id));
    w.handle(s2, { t: 'menu', op: 'library', act: 'challenge', sin: 'wrath' }); const z2 = s2.actor.zone; assert.equal(z2.bout.holder.id, ch.id, 'fights the player holder (recorded build)'); assert.ok(s.out.some(m => m.t === 'toast' && /継承決闘/.test(m.v)), 'holder notified');
    z2.kill(z2.bout.foe, s2.actor, z2.now); await sleep(2700);
    assert.equal(w.library.seats.wrath.holder.id, c2.id); assert.ok(c2.jobs.ev_bishop_wrath, 'bishop via succession'); assert.ok(!c2.progress.titles.includes(`「${SINS.wrath.trial}」を越えし者`), 'trial reward is separate');
    assert.ok(ch.jobs.ev_bishop_wrath, 'the former holder keeps the job');
    // one bishop line per character
    ch.progress.sinRoute = 'pride'; menu({ op: 'library', act: 'trial' }); assert.ok(err());
  } finally { setTimeout(() => process.exit(process.exitCode || 0), 50); }
});
