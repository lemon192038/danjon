// NEW WORLD EVENTS — PHASE D runner for exploration objects and places: observation under real conditions (time, weather,
// world state), the statue records, the lake lantern order, the phantom train (appearances, cars, passengers, stops — all
// recorded), the library outside the map (books written from the reader's own record and the world), underground trade.
import { EXPLORE_OBJECTS, STATUES, LAKE, TRAIN, MAPLESS_BOOKS, UNDER_TRADE } from '../../shared/data/explore.js';
import { EVENT_BY_ID } from '../../shared/data/events.js';
import { PLACE, REALMS } from '../../shared/data/world.js';
import { REALM_EVENTS, REALM_LINK } from '../../shared/data/realms.js';
import { ITEMS } from '../../shared/data/guilds.js';
import { CITIES } from '../../shared/data/cities.js';
import { Zone } from './zone.js';
import { clock } from './life.js';
import { addItem } from './progress.js';
import { hash32 } from '../../shared/util.js';
import { T } from './maps.js';

const H = () => clock().hour;
const COND = { night: h => h >= 20 || h < 5, dusk: h => h >= 17 && h < 20, dawn: h => h >= 4 && h < 7 };
export class Explore {
  constructor(world) { this.world = world; const F = world.events.w.flags; F.train ||= { seen: [], rides: 0 }; }
  decorate(zones) { for (const O of EXPLORE_OBJECTS) { const z = zones.get(O.field); if (!z) continue; const m = z.map; const used = new Set(m.objects.map(o => o.x + ',' + (o.y - 1)));
    const cands = m.spawns.filter(c => !used.has(c[0] + ',' + c[1]) && m.tiles[(c[1] + 1) * m.w + c[0]] !== T.BLOCK && m.tiles[(c[1] + 1) * m.w + c[0]] !== T.WALL); if (!cands.length) continue;
    const cell = cands[(hash32(O.field + O.k + O.key) >>> 0) % cands.length]; m.spawns = m.spawns.filter(c => c !== cell); m.tiles[cell[1] * m.w + cell[0]] = T.BLOCK;
    m.objects.push({ k: O.k, key: O.key, label: O.label, x: cell[0], y: cell[1] + 1 }); m.props.push({ k: O.k === 'moonlake' ? 'fountain' : O.k === 'deadtree' ? 'tree' : O.k === 'lantern' ? 'lamp' : 'statue', x: cell[0], y: cell[1], w: 1, h: 1, v: 1 }); } }
  weather(z) { const c = this.world.cityNear(z); return c ? this.world.life.weatherOf(c) : 'clear'; }
  useObject(s, z, o) { const cev = this.world.cev, ch = s.ch, h = H(), say = v => s.send({ t: 'toast', v });
    switch (o.k) {
      case 'deepmarker': say('古い標石だ。同じ形の刻みが、別の洞窟にもあるという'); return cev.onObserve(s, o.k, o.key);
      case 'withersample': if (o.key === 'plant') { addItem(ch, { kind: 'mat', ref: 'witherbloom', n: 1 }); say('季節外れの花を採取した（枯れ木の花）'); } else say(o.key === 'soil' ? '土は黒ずみ、魔力がほとんど残っていない' : '湧き水は澱み、底に細い根が絡みついている'); return cev.onObserve(s, o.k, o.key);
      case 'deadtree': if (COND.night(h)) { say('夜の巨木は、周りの魔力を淡い光の筋として吸い上げている'); cev.onObserve(s, o.k, 'night', 'night'); } else say('枯れているのに、倒れる気配がない巨木だ'); return cev.onObserve(s, o.k, 'tree');
      case 'statue17': { const S = STATUES[o.key]; if (!COND[S.cond](h)) return say(`石像はじっとしている。${S.hint}`); (ch.progress.statues ||= {})[o.key] = 1; say(S.rec); return cev.onObserve(s, o.k, o.key, S.cond); }
      case 'hiddenruin': { const P = this.world.events.prog(ch, 'nx17'); if (!P || P.stage < 2) return say('ただの割れた岩だ'); say('岩の割れ目の奥に、階段が続いていた――視線の交わる遺跡だ'); return cev.onObserve(s, o.k, o.key); }
      case 'moonlake': { if (!COND.night(h) && !COND.dawn(h)) return say('昼の湖は、ただ静かに空を映している'); const wx = this.weather(z); const c = h === 4 ? 'predawn' : (wx === 'fog' || wx === 'cloud') ? 'mistnight' : wx === 'clear' && COND.night(h) ? 'clearnight' : null;
        if (!c) return say('夜空が荒れていて、水面がよく見えない'); (ch.progress.lake ||= {})[c] = 1; say(LAKE.rec[c]); return cev.onObserve(s, o.k, c, c); }
      case 'lantern': return this.lantern(s, o.key);
      case 'ghoststation': cev.onObserve(s, o.k, o.key); return this.station(s, z);
    } return false; }
  // ── the lake: lanterns in the observed order (wrong order resets with a hint; no penalty)
  lantern(s, key) { const P = this.world.events.prog(s.ch, 'nx18'); const st = P && !P.done ? this.world.cev.stepOf('nx18', P.stage) : null; if (st?.k !== 'sequence') return s.send({ t: 'toast', v: '古い灯籠だ。灯す理由がまだない' });
    P.data.seq ||= []; P.data.seq.push(key); const want = LAKE.order; const ok = P.data.seq.every((k, i) => k === want[i]);
    if (!ok) { P.data.seq = []; return s.send({ t: 'toast', v: '灯が消えた。湖で見た順番を思い出そう（記録：' + Object.keys(s.ch.progress.lake || {}).map(c => LAKE.rec[c]).join(' / ') + '）' }); }
    s.send({ t: 'toast', v: `灯がともった（${P.data.seq.length}/3）` }); if (P.data.seq.length === 3) this.world.cev.next(s, 'nx18'); }
  // ── the phantom train: comes at night (0-3) on nights decided by the world state; never a fast-travel replacement
  trainTonight() { const c = clock(); if (c.hour < TRAIN.hours[0] || c.hour >= TRAIN.hours[1]) return false; const bm = this.world.events.w.ev.ev_blackmoon?.state; return bm === 'active' || bm === 'omen' || hash32('train:' + c.day) % 3 !== 0; }
  station(s, z) { const F = this.world.events.w.flags.train; if (!this.trainTonight()) return s.send({ t: 'toast', v: COND.night(H()) || H() < 4 ? '今夜は汽笛が聞こえない……' : '草に埋もれた駅だ。昼間は何も来ない' });
    const d = clock().day; if (!F.seen.includes(d)) { F.seen.push(d); if (F.seen.length > 60) F.seen.shift(); }
    this.board(s, z); }
  board(s, from) { const ch = s.ch, F = this.world.events.w.flags.train; F.rides++; const key = 'train:' + ch.id; let tz = this.world.zones.get(key);
    if (!tz) { tz = new Zone(this.world, key, { kind: 'interior', city: 'arcelia', bldg: { id: 'phantom_train', name: '幻の列車', t: 'inn', size: 'M' }, door: null }); tz.train = true; tz.map.npcs = [{ service: 'train', name: '顔の見えない車掌', x: tz.map.w >> 1, y: 3 }]; this.world.zones.set(key, tz); }
    tz.returnTo = from.id; ch.progress.train ||= { cars: {}, stops: [], rides: 0 }; ch.progress.train.rides++; ch.progress.train.from = from.id;
    s.send({ t: 'loading', v: '幻の列車' }); this.world.enterZone(s, tz); this.world.cev.onBoard(s); this.openTrain(s); }
  openTrain(s) { const T2 = s.ch.progress.train || { cars: {}, stops: [] }; const n = Object.keys(T2.cars).length;
    s.send({ t: 'open', service: 'train', data: { cars: TRAIN.cars.map(c => ({ id: c.id, name: c.name, act: c.act, seen: !!T2.cars[c.id], text: T2.cars[c.id] ? c.text : null, locked: c.need && n < c.need })), stops: T2.stops, canStop: n >= 3, rides: T2.rides || 0 } }); }
  trainAct(s, m) { const z = s.actor.zone; if (!z.train) return; const ch = s.ch, T2 = ch.progress.train;
    if (m.car) { const c = TRAIN.cars.find(x => x.id === m.car); if (!c) return; if (c.need && Object.keys(T2.cars).length < c.need) return s.send({ t: 'err', v: '他の車両を見てからだ' });
      if (!T2.cars[c.id]) { T2.cars[c.id] = Date.now(); if (c.item) addItem(ch, { kind: 'mat', ref: c.item, n: 1 }); if (c.give) (ch.progress.flags ||= {})[c.give + 'Met'] = true; this.world.cev.onCar(s, Object.keys(T2.cars).length); } return this.openTrain(s); }
    if (m.stop) { if (Object.keys(T2.cars).length < 3) return s.send({ t: 'err', v: 'まだ停車しない（車両を巡ろう）' }); const d = clock().day; const st = TRAIN.stops[(hash32(ch.id + ':' + d + ':' + T2.rides) >>> 0) % TRAIN.stops.length];
      T2.stops = [...new Set([...(T2.stops || []), st.name])]; this.world.events.log(ch, 'nx15', `幻の列車が「${st.name}」に停車`); const R = st.reward || {};
      if (R.item) addItem(ch, { kind: 'mat', ref: R.item, n: 1 }); if (R.mat) addItem(ch, { kind: 'mat', ref: R.mat, n: R.n || 1 }); if (R.flag) (ch.progress.flags ||= {})[R.flag] = true;
      s.send({ t: 'open', service: 'trainstop', data: { name: st.name, text: st.text } }); if (T2.stops.length >= 3) this.world.events.grant(s, 'nx15', 'allstops', { title: '終点を知らない旅人', xp: 10000 });
      const back = this.world.zones.get(T2.from) || this.world.zones.get('field_capital'); setTimeout(() => { if (s.actor?.zone === z) this.world.enterZone(s, back); }, 300); } }
  // ── the library outside the map
  enterMapless(s) { const ch = s.ch; const P = this.world.events.prog(ch, 'nx13'); if (!P || (!P.done && P.stage < 5)) return s.send({ t: 'err', v: 'まだ入口は見つかっていない' }); const z0 = s.actor.zone; const key = 'mapless:' + ch.id; let mz = this.world.zones.get(key);
    if (!mz) { mz = new Zone(this.world, key, { kind: 'interior', city: z0.cityId || 'arcelia', bldg: { id: 'mapless', name: '地図にない図書館', t: 'library', size: 'L' }, door: z0.map.doors?.find(d => d.id === 'w_arcelia_library') || null }); mz.mapless = true; mz.map.npcs = [{ service: 'mapless', name: '名もなき司書', x: mz.map.w >> 1, y: 3 }]; mz.map.wallCol = '#3a2a1a'; this.world.zones.set(key, mz); }
    s.send({ t: 'loading', v: '地図にない図書館' }); this.world.enterZone(s, mz); }
  bookText(ch, id) { const E = this.world.events, W = E.w; const done = Object.entries(ch.events?.prog || {}).filter(([, p]) => p.done).sort((a, b) => (a[1].finished || 0) - (b[1].finished || 0)).map(([k]) => EVENT_BY_ID[k]?.name).filter(Boolean);
    switch (id) {
      case 'steps': return done.length ? `この本には、あなたの名前がある。「${ch.name}は、${done.length}の出来事を見届けた。最近の頁：${done.slice(-3).join('、')}」` : `頁は白紙だ。表紙に小さく「${ch.name}」とだけ書かれている。`;
      case 'now': { const st = k => ({ dormant: '静穏', omen: '前兆', active: '発生中', resolved: '収束' })[W.ev[k]?.state || 'dormant']; return `黒月の夜：${st('ev_blackmoon')}。神機の目覚め：${st('nx05')}${W.flags.machina?.outcome ? '（' + W.flags.machina.outcome + '）' : ''}。眠れる災厄：${Object.values(W.flags.cal || {}).filter(c => c.stage >= 5 && !c.outcome).length}体が目覚めている。沈没王国：${W.ev.ev_sunken?.data?.outcome || '未決'}。`; }
      case 'unknown': { const left = REALMS.filter(r => !E.discovered(ch, r.id)); return left.length ? '未踏の地：' + left.map(r => { const ev = REALM_LINK[r.id]?.ev; const host = ev && REALM_EVENTS[ev]?.host; return `${r.name}${host ? `（手掛かり：${CITIES[host.city]?.name}の${host.name}）` : ''}`; }).join(' ／ ') : 'あなたは、全ての領域に足跡を残した。'; }
      case 'nextpage': { const n = Object.values(W.ev).filter(e => e.state === 'resolved').length; return n < 3 ? '頁はまだ白い。世界がもう少し動けば、続きが書かれるだろう。' : n < 6 ? '「世界は動き始めた。観測者は、頁をめくる手の数を数えている」' : '「七つの席、目覚めた機械、眠らぬ災厄。次に頁をめくるのは、誰か」'; }
      case 'lostcity': return '旋律の街アウレア。鐘の音だけが記録に残り、街の名は記録から消された。楽士は、その街の最後の鐘つきだった。';
      case 'people': return '記録されない人々は、確かに生きている。台帳から名前がこぼれ落ちただけだ。――その名前を拾う者が、いつか現れる。';
      case 'librarian': return '司書の手記：「私もかつて、どの記録にも残らない者だった。だから、忘れられたものを集めている。あなたが読むたびに、ここは少しだけ広くなる」';
    } return ''; }
  canRead(ch, b) { const n = b.need; if (!n) return true; if (n.event) return this.world.events.isDone(ch, n.event); if (n.book) return (ch.progress.books?.[n.book] || 0) >= 2; if (n.all) return MAPLESS_BOOKS.filter(x => !x.need?.all).every(x => ch.progress.mapless?.[x.id]); return true; }
  openMapless(s) { const ch = s.ch; const rd = ch.progress.mapless || {}; s.send({ t: 'open', service: 'mapless', data: { books: MAPLESS_BOOKS.map(b => { const ok = this.canRead(ch, b); const text = ok ? this.bookText(ch, b.id) : null; const v = text ? hash32(text) : null; return { id: b.id, title: b.title, ok, read: !!rd[b.id], added: !!rd[b.id] && v !== rd[b.id], text: rd[b.id] ? text : null }; }) } }); }
  readMapless(s, id) { if (!s.actor.zone.mapless) return; const ch = s.ch, b = MAPLESS_BOOKS.find(x => x.id === id); if (!b || !this.canRead(ch, b)) return s.send({ t: 'err', v: '頁が開かない（まだ読む条件を満たしていない）' });
    const first = !ch.progress.mapless?.[id]; (ch.progress.mapless ||= {})[id] = hash32(this.bookText(ch, id)); if (first) this.world.cev.onMapless(s); this.openMapless(s); }
  // ── underground trade (after the world beneath opened its trade route)
  underTrade(s, m) { const ch = s.ch, err = v => s.send({ t: 'err', v }); if (this.world.events.flag('ct:under') !== 'trade') return err('地下交易路はまだ開かれていない'); const t = UNDER_TRADE[m.i | 0]; if (!t) return;
    if (!this.world.cev.take(ch, t.give, t.n)) return err(`${ITEMS[t.give].name}×${t.n}が必要`); addItem(ch, { kind: 'mat', ref: t.get, n: t.m }); s.send({ t: 'toast', v: `地下の民と交換した：${ITEMS[t.get].name}×${t.m}` }); this.world.sendSelf(s); }
}
void PLACE;
