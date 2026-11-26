// PHASE 7 (part 2): Sunken Kingdom (underwater special dungeon), Night of the Black Moon (world cycle + observer + devices +
// Luna Veil), Sleeping Calamities (world states, world bosses with shared HP, four outcomes, never permanently removed).
import { SPECIAL_DUNGEONS, BLACK_MOON, CALAMITIES } from '../../shared/data/bigevents.js';
import { clock } from './life.js';
import { addItem, uid } from './progress.js';
import { makeBoss } from './monsters.js';
import { Actor } from './actor.js';
import { makeDuelChar, spawnDuelist, duelArena } from './duel.js';
import { DATA } from '../data.js';
import { T } from './maps.js';

const night = () => { const h = clock().hour; return h >= 20 || h < 5; };
const CLUES = ['海底の石畳', '巨大な門', '古代文字', '不自然な光', '海底の鐘'];
export class BigEvents {
  constructor(world) {
    this.world = world; const E = world.events, F = E.w.flags; F.moon ||= { p: 20 }; F.cal ||= {}; for (const k of Object.keys(CALAMITIES)) F.cal[k] ||= { stage: 0, since: Date.now(), hp: null, records: 0, studied: 0, outcome: null };
    E.register('bigevents', h => this.simulate(h));
  }
  // ── place clue/device/shrine objects into fields (on open ground from the field's spawn cells)
  decorate(zones) {
    const put = (zid, k, extra = {}, prop = 'statue') => { const z = zones.get(zid); if (!z) return; const m = z.map; const used = new Set(m.objects.map(o => o.x + ',' + (o.y - 1)));
      const cands = m.spawns.filter(c => !used.has(c[0] + ',' + c[1]) && m.tiles[(c[1] + 1) * m.w + c[0]] !== T.BLOCK && m.tiles[(c[1] + 1) * m.w + c[0]] !== T.WALL); if (!cands.length) return;
      const cell = cands[(m.objects.length * 7 + k.length * 3) % cands.length]; m.spawns = m.spawns.filter(c => c !== cell); m.tiles[cell[1] * m.w + cell[0]] = T.BLOCK;
      for (const a of [...z.actors.values()]) if (a.spawnCell === cell) z.remove(a);
      m.objects.push({ k, x: cell[0], y: cell[1] + 1, ...extra }); m.props.push({ k: prop, x: cell[0], y: cell[1], w: 1, h: 1, v: 1 }); };
    CLUES.forEach((c, i) => put('abyssal_ocean', 'clue', { clue: c, i }, i === 1 ? 'pillar' : i === 4 ? 'altar' : 'statue')); put('abyssal_ocean', 'sunkengate', {}, 'altar');
    for (const f of BLACK_MOON.devices) put(f, 'moondevice', { f }, 'telescope'); put(BLACK_MOON.gateField, 'moongate', {}, 'altar'); for (const f of BLACK_MOON.ruins) put(f, 'moonruin', { f }, 'pillar');
    for (const [k, c] of Object.entries(CALAMITIES)) { put(c.field, 'calshrine', { cal: k }, 'altar'); for (let i = 0; i < 3; i++) put(c.field, 'caltrace', { cal: k }, 'crystal'); }
  }
  useObject(s, z, o) {
    switch (o.k) {
      case 'clue': return this.clue(s, o); case 'sunkengate': return this.sunkenGate(s);
      case 'moondevice': return this.device(s, o); case 'moongate': return this.moonGate(s); case 'moonruin': return this.ruin(s, o);
      case 'calshrine': return this.shrine(s, o.cal); case 'caltrace': return this.trace(s, o.cal);
    } return false;
  }
  // ── hourly world simulation (also runs to catch up after downtime)
  simulate(h) {
    const E = this.world.events, F = E.w.flags; const chance = p => 1 - Math.pow(1 - p, h);
    // Black Moon pressure accumulates with time and world activity (ruins, black-moon books, boss kills); it erupts only at night once full
    F.moon.p = Math.min(140, F.moon.p + 2 * h);
    const W = E.worldOf('ev_blackmoon');
    if (W.state !== 'active' && W.state !== 'omen' && F.moon.p >= 60) E.setWorld('ev_blackmoon', 'omen', { note: '人々が月を見上げている。月の縁が、わずかに黒く欠けていた' });
    if (W.state === 'omen' && F.moon.p >= 100 && night()) { E.setWorld('ev_blackmoon', 'active', { note: '黒月の夜が始まった。夜の魔物が凶暴化し、どこかに観測者が現れる' }); F.moon.obsField = BLACK_MOON.observerFields[clock().day % BLACK_MOON.observerFields.length]; }
    if (W.state === 'active' && !night()) { E.setWorld('ev_blackmoon', 'resolved', { note: '夜が明け、黒月は消えた' }); F.moon.p = 0; F.moon.obsField = null; }
    // calamities slowly wake through 5 signs (and fall asleep again some days after any outcome: never permanently removed)
    for (const [k, C] of Object.entries(CALAMITIES)) { const c = F.cal[k];
      if (c.outcome && Date.now() - c.since > 3 * 86400000) { c.outcome = null; c.stage = 0; c.since = Date.now(); }
      if (c.outcome || c.stage >= 5) continue;
      if (Math.random() < chance(c.stage === 0 ? 0.02 : 0.06)) { c.stage++; c.since = Date.now(); this.world.econ.addNews(`【${C.name}】${C.signs[c.stage - 1]}`); if (c.stage === 5) { E.history('ev_calamity', `${C.name}が目覚めた`); for (const ss of this.world.sessions.values()) ss.send({ t: 'chat', from: '世界', v: `${C.name}が目覚めた！` }); } } }
  }
  onBoss() { const F = this.world.events.w.flags; F.moon.p = Math.min(140, F.moon.p + 0.5); }
  // stronger night monsters while the Black Moon is up
  empower(m) { if (!this.bmActive()) return; m.maxHp = Math.round(m.maxHp * 1.3); m.hp = m.maxHp; m.stats.atk = Math.round(m.stats.atk * 1.2); m.xp = Math.round(m.xp * 1.5); m.blackMoon = true; }
  bmActive() { return this.world.events.w.ev.ev_blackmoon?.state === 'active' && night(); }
  // ── Sunken Kingdom
  clue(s, o) { const ch = s.ch, E = this.world.events; ch.progress.clues ||= {}; if (!ch.progress.clues[o.clue]) { ch.progress.clues[o.clue] = 1; s.send({ t: 'toast', v: `手がかり「${o.clue}」を見つけた（${Object.keys(ch.progress.clues).length}/5）` }); }
    if (!E.prog(ch, 'ev_sunken')) { E.start(s, 'ev_sunken'); E.grant(s, 'ev_sunken', 'found', { title: '沈没王国の発見者' }); E.discover(s, 'atlantis'); } }
  sunkenGate(s) { const ch = s.ch; if (!this.world.events.prog(ch, 'ev_sunken')) return s.send({ t: 'err', v: '巨大な門が海底に沈んでいる。周囲の手がかりを調べてみよう' });
    const E = this.world.events, P = E.prog(ch, 'ev_sunken'); if (P && !P.done && P.stage < 1) E.advance(s, 'ev_sunken', 1); s.send({ t: 'open', service: 'gate', data: { dungeons: ['sunken'], special: true } }); }
  // underwater rules (called every half second for players in underwater dungeons)
  underwater(s) { const a = s.actor, z = a.zone, ch = s.ch; if (!z.dungeon?.underwater) { a.o2 = null; return; }
    const deep = z.floor >= (z.dungeon.deepFrom || 999); const gear = ch.inventory.some(i => i.ref === 'divingGear') || (ch.progress.breathUntil || 0) > Date.now();
    a.o2 ??= 100; if (!deep || gear) { a.o2 = Math.min(100, a.o2 + 10); return; }
    a.o2 = Math.max(0, a.o2 - 2.5); if (a.o2 === 0 && !a.dead) { const d = Math.round(a.maxHp * 0.03); a.hp -= d; z.fx({ t: 'dmg', x: Math.round(a.x), y: Math.round(a.y - 10), v: d, e: 'water', a: 1 }); if (a.hp <= 0) z.kill(a, a, z.now); }
    if (a.o2 === 50 || a.o2 === 20) s.send({ t: 'toast', v: '息が続かない！ 潜水装備か呼吸の秘薬が必要だ（深部）', cls: 'big' }); }
  onFloor(s, z) { if (z.dungeon?.id !== 'sunken') return; const E = this.world.events, P = E.prog(s.ch, 'ev_sunken'); if (!P || P.done) return; const st = Math.min(7, 2 + Math.floor((z.floor - 1) / 10)); if (P.stage < st) E.advance(s, 'ev_sunken', st, { silent: st !== 6 }); if (z.floor === 60 && P.stage < 8) E.advance(s, 'ev_sunken', 8); }
  info(s) { const F = this.world.events.w.flags, W = this.world.events.w.ev; const M = this.moon(s.ch);
    return { moon: { state: W.ev_blackmoon?.state || 'dormant', pressure: Math.round(F.moon.p), night: night(), obs: M.obs, dev: Object.keys(M.dev).length, obsField: this.bmActive() ? F.moon.obsField : null },
      cal: Object.entries(CALAMITIES).map(([k, C]) => { const c = this.cal(k); return { k, name: C.name, field: C.field, stage: c.stage, outcome: c.outcome, signs: C.signs.slice(0, c.stage), studied: !!c.studied }; }),
      sunken: { clues: Object.keys(s.ch.progress.clues || {}), prog: this.world.events.prog(s.ch, 'ev_sunken'), state: W.ev_sunken?.state || 'dormant', outcome: W.ev_sunken?.data?.outcome || null },
      spells: { learned: this.world.spells.learned(s.ch).length, total: DATA.spells.length } }; }
  onSunkenBoss(s, z) { if (z.dungeon?.id !== 'sunken' || z.floor !== 60) return; s.send({ t: 'open', service: 'sunkenEnd', data: { options: ['王国再生', '王国解放', '王国継承'] } }); }
  sunkenChoice(s, m) { const ch = s.ch, E = this.world.events; const P = E.prog(ch, 'ev_sunken'); if (!P || P.done) return; if ((ch.progress.clears?.sunken?.max || 0) < 60) return s.send({ t: 'err', v: '沈没王を倒していない' });
    const o = ['王国再生', '王国解放', '王国継承'].find(x => x === m.choice); if (!o) return; E.complete(s, 'ev_sunken', o);
    E.grant(s, 'ev_sunken', 'end', { xp: 60000, gold: 30000, title: { 王国再生: '沈没王国を蘇らせし者', 王国解放: '沈没王国を解き放ちし者', 王国継承: '沈没王国の継承者' }[o] });
    if (!E.hasReward(ch, 'ev_sunken', 'gear')) { E.grant(s, 'ev_sunken', 'gear', {}); addItem(ch, { kind: 'mat', ref: 'divingGear', n: 1 }); for (const id of ['sp_0_120', 'sp_1_120', 'sp_2_120']) (ch.spells ||= {})[id] = { stage: 4 }; }
    if (!E.w.ev.ev_sunken || E.w.ev.ev_sunken.state !== 'resolved') E.setWorld('ev_sunken', 'resolved', { outcome: o, note: `${ch.name}の選択により沈没王国は「${o}」の道を歩む` });
    E.discover(s, 'atlantis'); this.world.sendSelf(s); }
  // ── Night of the Black Moon
  moon(ch) { return ch.progress.moon ||= { obs: 0, dev: {} }; }
  ruin(s, o) { const ch = s.ch, F = this.world.events.w.flags; const k = `ruin:${o.f}:${clock().day}`; ch.progress.flags ||= {}; if (ch.progress.flags[k]) return s.send({ t: 'toast', v: '遺跡は静まり返っている' }); ch.progress.flags[k] = 1; F.moon.p = Math.min(140, F.moon.p + 4); s.send({ t: 'toast', v: '古代遺跡の石柱が淡く光った。月の気配が濃くなった気がする' }); }
  readBook(s) { if (Math.random() < 0.1) { const F = this.world.events.w.flags; F.moon.p = Math.min(140, F.moon.p + 3); s.send({ t: 'toast', v: '黒い月の記述がある古書だ――読み進めるうちに、背筋が冷えた' }); } }
  device(s, o) { if (!this.bmActive()) return s.send({ t: 'toast', v: '古い観測装置だ。黒月の夜にしか動かないらしい' }); const M = this.moon(s.ch); if (M.dev[o.f]) return s.send({ t: 'toast', v: 'この装置は既に起動した' }); M.dev[o.f] = 1; s.send({ t: 'toast', v: `観測装置が起動した（${Object.keys(M.dev).length}/4）`, cls: 'big' }); this.progressMoon(s); }
  observerSync() { const F = this.world.events.w.flags; const zid = this.bmActive() ? F.moon.obsField : null;
    for (const [id, z] of this.world.zones) { const o = [...z.actors.values()].find(a => a.role === 'observer'); if (o && (id !== zid || !z.players.size)) z.remove(o); }
    const z = zid && this.world.zones.get(zid); if (!z || !z.players.size || [...z.actors.values()].some(a => a.role === 'observer')) return; const c = z.tileCenter(z.map.start);
    z.add(new Actor({ kind: 'slumnpc', team: 'neutral', role: 'observer', name: '黒月の観測者の影', job: '観測者', look: { body: 2, skin: 4, hair: 5, hairColor: 9, outfit: 5 }, x: c.x - 50, y: c.y - 30, r: 6, stats: { atk: 0, matk: 0, def: 9999, crit: 0, critDmg: 1, dr: 1, mods: {}, range: 1, move: 0 }, maxHp: 1, hp: 1, level: 0, invulnUntil: Infinity, facing: Math.PI / 2 })); }
  observerDuel(s) { const ch = s.ch; const back = s.actor.zone.id; const az = duelArena(this.world, s, `duel:${ch.id}`, '黒月の観測者', back); az.returnField = back;
    const dc = makeDuelChar('黒月の観測者', 57, Math.max(40, ch.level + 10), { body: 2, skin: 4, hair: 5, hairColor: 9, outfit: 5 }); const f = spawnDuelist(az, dc, { key: 'observer', hpMul: 4, parry: 0.3, aggression: 0.8, memo: this.world.duels.mem.tactics('observer', ch.id) });
    const p = az.tileCenter([az.map.w >> 1, Math.round(az.map.h * 0.6)]); s.actor.x = p.x; s.actor.y = p.y; az.bout = { kind: 'observer', sid: ch.id, foe: f, wt: s.actor.wt.id }; s.send({ t: 'toast', v: '観測者があなたを“観測”している――', cls: 'big' }); }
  onObserverDown(s) { const M = this.moon(s.ch); M.obs++; s.send({ t: 'toast', v: `観測者を退けた（${M.obs}/2）`, cls: 'big' }); this.progressMoon(s); }
  progressMoon(s) { const E = this.world.events, ch = s.ch, M = this.moon(ch); if (!E.prog(ch, 'ev_blackmoon')) E.start(s, 'ev_blackmoon', { silent: true }); const P = E.prog(ch, 'ev_blackmoon'); if (P.done) return;
    const st = M.obs >= 2 && Object.keys(M.dev).length >= 4 ? 4 : Object.keys(M.dev).length ? 3 : M.obs ? 2 : 1; if (P.stage < st) E.advance(s, 'ev_blackmoon', st, { silent: st < 4 }); }
  moonGate(s) { const ch = s.ch, M = this.moon(ch), E = this.world.events; if (!(M.obs >= 2 && Object.keys(M.dev).length >= 4)) return s.send({ t: 'toast', v: '月の紋様が刻まれた石の門だ。観測者と観測装置――何かが足りない' });
    const P = E.prog(ch, 'ev_blackmoon'); if (P && !P.done) { if (P.stage < 5) E.advance(s, 'ev_blackmoon', 5); E.complete(s, 'ev_blackmoon', '月の裏側到達'); E.grant(s, 'ev_blackmoon', 'farside', { title: '月の裏側を見た者', xp: 40000 }); for (const id of ['sp_0_7', 'sp_0_16', 'sp_6_7']) (ch.spells ||= {})[id] = { stage: 4 }; }
    E.discover(s, 'luna_veil'); s.send({ t: 'open', service: 'gate', data: { dungeons: ['luna'], special: true } }); }
  onLunaBoss(s, z) { if (z.dungeon?.id !== 'luna' || z.floor !== 40) return; const ch = s.ch, E = this.world.events; if (E.hasReward(ch, 'ev_blackmoon', 'eclipse')) return; E.grant(s, 'ev_blackmoon', 'eclipse', { xp: 50000 });
    ch.inventory.push({ uid: uid(), kind: 'artifact', ref: 'artifact', name: '黒天月蝕', cond: 'mark', eff: 'dark', val: 0.6, dur: 12, stack: 1, from: ['月の裏側の観測者・真影'] }); this.world.note(s, { t: 'msg', v: '「黒天月蝕」を手に入れた' }); }
  // ── Sleeping Calamities
  cal(k) { return this.world.events.w.flags.cal[k]; }
  fieldCal(zid) { return Object.entries(CALAMITIES).find(([, c]) => c.field === zid)?.[0]; }
  calSync() { for (const [k, C] of Object.entries(CALAMITIES)) { const c = this.cal(k); const z = this.world.zones.get(C.field); if (!z) continue; const b = [...z.actors.values()].find(a => a.calamity === k);
    if (c.stage < 5 || c.outcome || !z.players.size) { if (b) { c.hp = b.hp; z.remove(b); } continue; } if (b) continue;
    const boss = makeBoss(C.boss, C.lv, 'HARD', 100); boss.calamity = k; boss.maxHp = Math.round(boss.maxHp * 4); boss.hp = c.hp ?? boss.maxHp; boss.el = C.el; const cc = z.tileCenter(z.map.spawns[0] || z.map.start); boss.x = cc.x; boss.y = cc.y; boss.home = [cc.x, cc.y]; boss.name = C.name; z.add(boss); } }
  onEnterField(s, z) { const k = this.fieldCal(z.id); if (!k) return; const c = this.cal(k); if (c.stage >= 1 && !c.outcome) s.send({ t: 'toast', v: `【${CALAMITIES[k].name}】${CALAMITIES[k].signs[Math.min(4, c.stage - 1)]}` }); }
  shouldSkipSpawn(z) { const k = this.fieldCal(z.id); const c = k && this.cal(k); return !!c && !c.outcome && c.stage >= 2 && Math.random() < 0.5; } // wildlife flees
  trace(s, k) { const c = this.cal(k); if (c.stage < 3 || c.outcome) return s.send({ t: 'toast', v: '妙な形の岩だ' }); addItem(s.ch, { kind: 'mat', ref: 'calTrace', n: 1 }); s.send({ t: 'toast', v: `${CALAMITIES[k].name}の痕跡を採取した` }); this.calEv(s, 1); }
  calEv(s, st) { const E = this.world.events; if (!E.prog(s.ch, 'ev_calamity')) E.start(s, 'ev_calamity', { silent: true }); const P = E.prog(s.ch, 'ev_calamity'); if (!P.done && P.stage < st) E.advance(s, 'ev_calamity', st, { silent: true }); }
  shrine(s, k) { const c = this.cal(k), C = CALAMITIES[k]; s.send({ t: 'open', service: 'calamity', data: { k, name: C.name, stage: c.stage, outcome: c.outcome, signs: C.signs.slice(0, c.stage), studied: c.studied, records: c.records, traces: s.ch.inventory.filter(i => i.ref === 'calTrace').reduce((t, i) => t + i.n, 0), mats: s.ch.inventory.filter(i => i.ref === 'calMat').reduce((t, i) => t + i.n, 0) } }); }
  calAct(s, m) { const k = m.cal, c = this.cal(k), C = CALAMITIES[k]; if (!C) return; const ch = s.ch, err = v => s.send({ t: 'err', v }); const z = s.actor.zone; if (z.id !== C.field) return err('災厄の地の祠で行う');
    const has = (ref, n) => ch.inventory.filter(i => i.ref === ref).reduce((t, i) => t + i.n, 0) >= n; const take = (ref, n) => { let l = n; for (const i of ch.inventory.filter(x => x.ref === ref)) { const q = Math.min(l, i.n); i.n -= q; l -= q; } ch.inventory = ch.inventory.filter(i => !(i.ref === ref && i.n <= 0)); };
    if (m.act === 'sleep') { if (c.stage < 3 || c.outcome) return err('今は眠らせる必要はない'); if (!has('calTrace', 5) || ch.gold < 3000) return err('痕跡×5と儀式料3,000Gが必要'); take('calTrace', 5); ch.gold -= 3000; this.resolve(s, k, 'slept', '再び眠らせた'); }
    else if (m.act === 'coexist') { if (!c.studied || c.outcome) return err('生態が解明されていなければ共存の道は開けない'); if (c.stage < 5) return err('災厄が目覚めていない'); if (!has('calMat', 3)) return err('災厄素材×3を供物にする'); take('calMat', 3); this.resolve(s, k, 'coexist', '条件付きの共存を選んだ'); }
    else if (m.act === 'observe') { const b = [...z.actors.values()].find(a => a.calamity === k && !a.dead); if (!b) return err('災厄の姿が見えない'); if (Math.hypot(b.x - s.actor.x, b.y - s.actor.y) > 200) return err('もっと近づいて観察する'); const now = Date.now(); if ((s.lastObs || 0) > now - 8000) return err('観察を続けている…'); s.lastObs = now;
      ch.progress.ecology ||= {}; ch.progress.ecology[k] = (ch.progress.ecology[k] || 0) + 1; c.records++; s.send({ t: 'toast', v: `生態を記録した（${ch.progress.ecology[k]}/10）` }); this.calEv(s, 3);
      if (ch.progress.ecology[k] === 10) this.world.events.grant(s, 'ev_calamity', 'eco:' + k, { title: `${C.name}の観察者`, xp: 20000 }); if (c.records >= 30) { c.studied = 1; this.resolve(s, k, 'studied', '生態が解明され、災厄は静かに眠りについた'); } }
    this.world.sendSelf(s); this.shrine(s, k); }
  onCalamityKilled(z, b) { const k = b.calamity; this.cal(k).hp = null; const parts = [...z.players]; for (const p of parts) this.reward(p.session, k, 'defeated'); this.resolve(parts[0]?.session, k, 'defeated', '討伐された', true); }
  resolve(s, k, outcome, label, rewarded) { const c = this.cal(k), C = CALAMITIES[k]; c.outcome = outcome; c.since = Date.now(); c.stage = 0; c.records = 0; this.world.events.history('ev_calamity', `【${C.name}】${label}${s ? `（${s.ch.name}）` : ''}。だが災厄は滅びず、いつか再び目を覚ます`); this.world.econ.addNews(`【${C.name}】${label}`);
    const z = this.world.zones.get(C.field); for (const a of [...(z?.actors.values() || [])]) if (a.calamity === k && !a.dead) z.remove(a); if (s && !rewarded) this.reward(s, k, outcome); }
  reward(s, k, outcome) { if (!s) return; const C = CALAMITIES[k], E = this.world.events, ch = s.ch; this.calEv(s, 4); const P = E.prog(ch, 'ev_calamity'); const lbl = { defeated: '討伐', slept: '再び眠らせる', studied: '生態調査', coexist: '条件付き共存' }[outcome];
    if (P && !P.done) E.complete(s, 'ev_calamity', lbl); else E.record(s, 'ev_calamity', `${C.name}：${lbl}`, { clear: true });
    addItem(ch, { kind: 'mat', ref: 'calMat', n: 3 }); E.grant(s, 'ev_calamity', `${k}:${outcome}`, { title: { defeated: `${C.name}を討ちし者`, slept: `${C.name}を鎮めし者`, studied: `${C.name}の観察者`, coexist: `${C.name}と共に在る者` }[outcome], xp: 30000, gold: 10000 });
    if (!E.hasReward(ch, 'ev_calamity', 'legend:' + k)) { E.grant(s, 'ev_calamity', 'legend:' + k, {}); const pool = [...DATA.weapons.values()].filter(w => w.rar === 5 && !w.myth); const w = pool[Math.floor(Math.random() * pool.length)]; addItem(ch, { kind: 'weapon', ref: w.id, plus: 0 }); ch.inventory.push({ uid: uid(), kind: 'artifact', ref: 'artifact', name: `${C.name}の眷属`, cond: 'summon', eff: C.el === 'fire' ? 'fire' : C.el === 'water' ? 'water' : 'earth', val: 0.45, dur: 12, stack: 1, from: [C.name] }); this.world.note(s, { t: 'msg', v: `伝説の武器「${w.name}」と「${C.name}の眷属」を得た` }); } }
}
void SPECIAL_DUNGEONS;
