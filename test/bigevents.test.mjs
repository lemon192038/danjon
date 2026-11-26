// PHASE 7 (part 2): the Lost Thousand Spells, the Sunken Kingdom, the Night of the Black Moon, the Sleeping Calamities.
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
process.env.DATA_DIR = '/tmp/claude-0/abyss-big-test';
fs.rmSync(process.env.DATA_DIR, { recursive: true, force: true });
const { World } = await import('../server/game/world.js');
const { store } = await import('../server/store.js');
const { DATA } = await import('../server/data.js');
const { setClockHour } = await import('../server/game/life.js');
const { CALAMITIES, BLACK_MOON } = await import('../shared/data/bigevents.js');
const { knownSkills } = await import('../server/game/progress.js');
const { dealDamage } = await import('../server/game/combat.js');
await store.init(); setClockHour(12);
const sleep = ms => new Promise(r => setTimeout(r, ms));

test('big events', async () => {
  const w = new World();
  try {
    const out = []; const ws = { readyState: 1, bufferedAmount: 0, send: x => out.push(JSON.parse(x)), close() {} }; const last = t => [...out].reverse().find(m => m.t === t); const err = () => out.filter(m => m.t === 'err').at(-1)?.v;
    const r = store.register('bigev', 'pass1234'); const s = w.attach(ws, r.account); w.handle(s, { t: 'create', name: '探究者', wt: 1 }); w.handle(s, { t: 'play', id: last('chars').list[0].id });
    const ch = s.ch; ch.level = 90; ch.gold = 5e6; s.actor.refreshStats();
    const E = w.events; const menu = m => w.handle(s, { t: 'menu', ...m });
    // ── data: hidden special dungeons are registered but never listed in the regular gate list
    assert.ok(DATA.dungeons.get('sunken') && DATA.dungeons.get('luna')); assert.ok(!DATA.dungeonList.some(d => d.id === 'sunken' || d.id === 'luna'));
    for (const k of ['atlantis', 'observer', 'scorchDragon', 'abyssWhale', 'forestBehemoth', 'sandGiant']) assert.ok(DATA.bosses.has(k), k);
    assert.equal(DATA.spells.length, 1001); assert.equal(DATA.spells.filter(x => x.key).length, 7);

    // ── Thousand spells: fragment → analyse → rebuild → experiment → learn (research only at a library/academy/lab)
    const sp = DATA.spells.find(x => !x.key && !x.zero && x.tier === 1); for (let i = 0; i < sp.frags; i++) w.spells.giveFrag(s, sp);
    assert.ok(E.prog(ch, 'ev_thousand_spells'), 'event starts on the first fragment');
    menu({ op: 'spells', act: 'analyze', id: sp.id }); assert.match(err(), /図書館/); assert.equal(ch.spells[sp.id].stage, 0, 'no research in the field');
    const az = w.zones.get('arcanum'); w.enterZone(s, az); const door = az.map.doors.find(d => d.t === 'library' || d.t === 'lab'); assert.ok(door, 'research building'); w.enterBuilding(s, door); assert.equal(s.actor.zone.kind, 'interior');
    assert.ok(w.spells.atLab(s));
    menu({ op: 'spells', act: 'analyze', id: sp.id }); menu({ op: 'spells', act: 'rebuild', id: sp.id }); assert.equal(ch.spells[sp.id].stage, 2);
    for (let i = 0; i < 30 && ch.spells[sp.id].stage < 3; i++) menu({ op: 'spells', act: 'test', id: sp.id }); menu({ op: 'spells', act: 'learn', id: sp.id });
    assert.equal(ch.spells[sp.id].stage, 4); assert.ok(knownSkills(ch).includes(sp.id), 'learned spell is a usable skill');
    // improvement is a trade-off: over budget is refused; the custom copy changes cost/speed
    menu({ op: 'spells', act: 'improve', id: sp.id, mods: { range: 3, speed: 3 } }); assert.match(err(), /合計4点/);
    menu({ op: 'spells', act: 'improve', id: sp.id, mods: { cost: 2, speed: 2 } }); const cu = w.spells.custom(ch, sp); assert.ok(cu.cost < sp.cost && cu !== sp);
    { const v = w.spells.view(s).list.find(x => x.id === sp.id); assert.ok(v.now && v.now.cost < v.props.cost, 'research view shows the improved numbers'); w.sendSelf(s); const self = [...out].reverse().find(m => m.t === 'self'); assert.equal(self.cs[sp.id].cost, cu.cost, 'client receives the improved spell'); }
    // 第零魔法 needs all 7 key spells AND the forbidden book
    menu({ op: 'spells', act: 'zero' }); assert.match(err(), /七つ/);
    for (const k of DATA.spells.filter(x => x.key)) ch.spells[k.id] = { stage: 4 }; menu({ op: 'spells', act: 'zero' }); assert.match(err(), /魔力の存在証明/);
    (ch.progress.flags ||= {}).proofOfMana = true; menu({ op: 'spells', act: 'zero' }); assert.ok(E.prog(ch, 'ev_thousand_spells').done); assert.ok(ch.progress.titles.includes('千の魔法を識る者')); assert.ok(ch.jobs.ev_origin, 'origin mage job');

    // ── Sunken Kingdom: hidden until a clue is found; deep floors drain oxygen without gear
    menu({ op: 'dungeon', id: 'sunken', diff: 'NORMAL', floor: 1 }); assert.match(err(), /見つかっていない/);
    const oc = w.zones.get('abyssal_ocean'); w.enterZone(s, oc); const clue = oc.map.objects.find(o => o.k === 'clue'); assert.ok(clue && oc.map.objects.some(o => o.k === 'sunkengate'));
    w.useObject(s, oc, clue); assert.ok(E.prog(ch, 'ev_sunken')); assert.ok(ch.progress.titles.includes('沈没王国の発見者'));
    menu({ op: 'dungeon', id: 'sunken', diff: 'NORMAL', floor: 1 }); const sz = s.actor.zone; assert.equal(sz.dungeon.id, 'sunken'); assert.ok(sz.name.includes('沈没港'));
    w.big.underwater(s); assert.equal(s.actor.o2, 100, 'shallow floors: normal gear is fine');
    ch.progress.clears.sunken = { NORMAL: 30, max: 30 }; menu({ op: 'dungeon', id: 'sunken', diff: 'NORMAL', floor: 31 }); assert.equal(s.actor.zone.floor, 31);
    for (let i = 0; i < 50; i++) w.big.underwater(s); assert.equal(s.actor.o2, 0); assert.ok(s.actor.hp < s.actor.maxHp, 'drowning damage');
    s.actor.hp = s.actor.maxHp; ch.progress.breathUntil = Date.now() + 60000; w.big.underwater(s); assert.ok(s.actor.o2 > 0 && s.actor.hp === s.actor.maxHp, 'breathing tonic');
    // underwater combat: fire fizzles, projectiles slow
    { const foe = [...s.actor.zone.actors.values()].find(a => a.kind === 'monster' && !a.dead); foe.invulnUntil = 0; const hp0 = foe.hp; foe.hp = foe.maxHp = 1e9; let d1 = 0, d2 = 0; foe.el = null; for (let i = 0; i < 300; i++) { d1 += dealDamage(s.actor.zone, s.actor, foe, { m: 20, el: 'fire', critAdd: -9, noCounter: 1 }, s.actor.zone.now); d2 += dealDamage(s.actor.zone, s.actor, foe, { m: 20, el: 'water', critAdd: -9, noCounter: 1 }, s.actor.zone.now); } assert.ok(d2 > d1 * 1.8, `water ${d2} > fire ${d1}`); void hp0; }
    // final boss → three-way choice (server validated)
    ch.progress.clears.sunken = { NORMAL: 60, max: 60 }; menu({ op: 'sunken', choice: '世界征服' }); assert.ok(!E.prog(ch, 'ev_sunken').done);
    menu({ op: 'sunken', choice: '王国継承' }); assert.ok(E.prog(ch, 'ev_sunken').done); assert.equal(E.prog(ch, 'ev_sunken').outcome, '王国継承'); assert.ok(ch.inventory.some(i => i.ref === 'divingGear'), 'underwater gear');
    assert.equal(w.events.w.ev.ev_sunken.state, 'resolved');

    // ── Black Moon: driven by world pressure, omen first, active only at night
    w.events.w.flags.moon.p = 70; w.big.simulate(0.1); assert.equal(E.w.ev.ev_blackmoon.state, 'omen');
    w.events.w.flags.moon.p = 120; setClockHour(12); w.big.simulate(0.1); assert.equal(E.w.ev.ev_blackmoon.state, 'omen', 'not in daylight');
    setClockHour(22); w.big.simulate(0.1); assert.equal(E.w.ev.ev_blackmoon.state, 'active'); assert.ok(w.big.bmActive());
    const of = w.zones.get(w.events.w.flags.moon.obsField); assert.ok(BLACK_MOON.observerFields.includes(of.id));
    menu({ op: 'dungeon', id: 'luna', diff: 'NORMAL', floor: 1 }); assert.match(err(), /閉ざされ/);
    for (let k = 0; k < 2; k++) { w.enterZone(s, of); w.big.observerSync(); const ob = [...of.actors.values()].find(a => a.role === 'observer'); assert.ok(ob, 'observer appears'); s.actor.x = ob.x + 10; s.actor.y = ob.y; w.handle(s, { t: 'interact' });
      const bz = s.actor.zone; assert.equal(bz.bout?.kind, 'observer'); bz.kill(bz.bout.foe, s.actor, bz.now); await sleep(2700); }
    assert.equal(ch.progress.moon.obs, 2); assert.ok(w.duels.mem.tactics('observer', ch.id).fights >= 2, 'observer learns');
    for (const f of BLACK_MOON.devices) { const z = w.zones.get(f); w.enterZone(s, z); w.useObject(s, z, z.map.objects.find(o => o.k === 'moondevice')); }
    const gz = w.zones.get(BLACK_MOON.gateField); w.enterZone(s, gz); w.useObject(s, gz, gz.map.objects.find(o => o.k === 'moongate'));
    assert.ok(E.prog(ch, 'ev_blackmoon').done); assert.ok(ch.progress.titles.includes('月の裏側を見た者')); assert.ok(ch.jobs.ev_moonshadow, 'moonshadow job'); assert.deepEqual(last('open').data.dungeons, ['luna']);
    menu({ op: 'dungeon', id: 'luna', diff: 'NORMAL', floor: 1 }); assert.equal(s.actor.zone.dungeon.id, 'luna');
    setClockHour(9); w.big.simulate(0.1); assert.equal(E.w.ev.ev_blackmoon.state, 'resolved'); assert.equal(w.events.w.flags.moon.p, 0);

    // ── Calamities: five signs → world boss with shared HP → outcome → asleep again (never permanently removed)
    setClockHour(12); const C = CALAMITIES.scorch; const fz = w.zones.get(C.field); const c = w.events.w.flags.cal.scorch;
    c.stage = 3; w.enterZone(s, fz); const tr = fz.map.objects.find(o => o.k === 'caltrace'); w.useObject(s, fz, tr); assert.ok(ch.inventory.some(i => i.ref === 'calTrace'));
    c.stage = 5; w.big.calSync(); const boss = [...fz.actors.values()].find(a => a.calamity === 'scorch'); assert.ok(boss && boss.name === C.name);
    boss.hp = Math.round(boss.maxHp / 2); w.enterZone(s, w.zones.get('arcelia')); w.big.calSync(); assert.ok(![...fz.actors.values()].some(a => a.calamity), 'despawns when empty'); assert.equal(c.hp, boss.hp, 'shared HP persists');
    w.enterZone(s, fz); w.big.calSync(); const b2 = [...fz.actors.values()].find(a => a.calamity === 'scorch'); assert.equal(b2.hp, c.hp);
    fz.kill(b2, s.actor, fz.now); assert.equal(c.outcome, 'defeated'); assert.equal(c.stage, 0); assert.ok(E.prog(ch, 'ev_calamity').done); assert.ok(ch.progress.titles.includes(`${C.name}を討ちし者`));
    assert.ok(ch.inventory.some(i => i.kind === 'artifact' && i.name === `${C.name}の眷属`));
    c.since = Date.now() - 4 * 86400000; w.big.simulate(0.01); assert.equal(c.outcome, null, 'the calamity returns to sleep and can wake again');
    // sleep ritual (needs traces), ecological study → coexistence (validated)
    const g = w.events.w.flags.cal.giant; g.stage = 3; const gz2 = w.zones.get(CALAMITIES.giant.field); w.enterZone(s, gz2); menu({ op: 'calamity', cal: 'giant', act: 'sleep' }); assert.match(err(), /痕跡×5/);
    ch.inventory.push({ uid: 'TR', kind: 'mat', ref: 'calTrace', n: 5 }); menu({ op: 'calamity', cal: 'giant', act: 'sleep' }); assert.equal(g.outcome, 'slept');
    menu({ op: 'calamity', cal: 'giant', act: 'coexist' }); assert.ok(err());
    // info panel
    menu({ op: 'worldInfo' }); const inf = last('open'); assert.equal(inf.service, 'worldInfo'); assert.equal(inf.data.cal.length, 4);
  } finally { setTimeout(() => process.exit(process.exitCode || 0), 50); }
});
