// City life: global game clock, per-city weather, and citizens (staff + residents) with daily schedules.
// LOD: citizens are simulated abstractly (location state machine every game 10 min); actors are materialized only
// in city/interior zones that currently contain players.
import { CITIES, WEATHER } from '../../shared/data/cities.js';
import { Actor } from './actor.js';
import { rng, hash32 } from '../../shared/util.js';

export const GAME_MIN_MS = 2000; // 1 game minute = 2 real seconds -> 1 day = 48 minutes
let OFFSET = 0; // ms; test hook to pin the game hour
export function setClockHour(h) { const t = Math.floor(Date.now() / GAME_MIN_MS); const cur = Math.floor(t / 60) % 24; OFFSET = ((h - cur + 24) % 24) * 60 * GAME_MIN_MS; }
export function setClockAt(day, h) { OFFSET = (day * 1440 + h * 60) * GAME_MIN_MS - Date.now() + 1000; } // test hook: pin game day and hour
export function clock(now = Date.now()) { const total = Math.floor((now + OFFSET) / GAME_MIN_MS); return { total, day: Math.floor(total / 1440), hour: Math.floor(total / 60) % 24, minute: total % 60 }; }
// seasons: 4 seasons x 7 game days. Climate of each continent sets the base temperature; weather and night adjust it.
export const SEASONS = [{ id: 'spring', name: '春', t: 0, wx: { rain: 1.5, clear: 1.1 } }, { id: 'summer', name: '夏', t: 9, wx: { storm: 1.8, clear: 1.3, snow: 0 } }, { id: 'autumn', name: '秋', t: -1, wx: { fog: 1.8, wind: 1.5, cloud: 1.2 } }, { id: 'winter', name: '冬', t: -11, wx: { snow: 3, clear: 0.8, storm: 0.6 } }];
export const season = (day = clock().day) => SEASONS[Math.floor(((day % 28) + 28) % 28 / 7)];
const BASE_T = { realm: 15, eldia: 16, nordia: -6, shengar: 18, saharia: 31, valgran: 27, asteria: 23 };
const WX_T = { clear: 2, cloud: 0, rain: -3, snow: -6, fog: -1, wind: -2, storm: -4, smog: 1, aurora: -3 };
export function temperature(cityId, wx, c = clock()) { const cont = CITIES[cityId]?.continent || 'eldia'; const se = season(c.day); const night = c.hour < 6 || c.hour >= 20 ? (cont === 'saharia' ? -14 : -5) : 0; return Math.round(BASE_T[cont] + se.t * (cont === 'saharia' ? 0.4 : 1) + (WX_T[wx] || 0) + night); }
export const isOpen = (hours, h) => !hours ? true : hours[0] < hours[1] ? h >= hours[0] && h < hours[1] : h >= hours[0] || h < hours[1] % 24 || (hours[1] === 24 && h >= hours[0]);

const ROLE = { receptionist: '受付係', adventurer: '冒険者', clerk: '事務員', smith: '鍛冶職人', apprentice: '見習い', shopkeeper: '店主', customer: '客', barkeep: '酒場の主人', patron: '常連客', bard: '吟遊詩人', innkeeper: '宿の主人', traveler: '旅人', banker: '銀行員', guard: '衛兵', priest: '司祭', worshipper: '参拝者', librarian: '司書', scholar: '学者', dealer: 'ディーラー', gambler: '賭博客', performer: '役者', audience: '観客', usher: '案内係', concierge: 'コンシェルジュ', guest: '宿泊客', bellboy: 'ベルボーイ', butler: '執事', noble: '貴族', researcher: '研究員', assistant: '助手', professor: '教授', student: '学生', craftsman: '職人', foreman: '現場監督', porter: '荷運び', arenamaster: '闘技場主', gladiator: '闘士', spectator: '観戦客', doctor: '医師', patient: '患者', attendant: '番台', bather: '入浴客', stationmaster: '駅長', curator: '学芸員', visitor: '見学者', astronomer: '天文学者', fence: '故買屋', thug: 'ごろつき', shady: '怪しい男', resident: '住民', king: '摂政', citizen: '市民' };
const VISITOR = new Set(['customer', 'patron', 'traveler', 'worshipper', 'gambler', 'audience', 'guest', 'patient', 'bather', 'visitor', 'spectator', 'adventurer', 'shady', 'student', 'scholar']);
const SURN = ['アベル', 'ブリギッテ', 'カール', 'ドロテア', 'エミル', 'フリーダ', 'ゴットフリート', 'ハンナ', 'イーヴォ', 'ユリア', 'クラウス', 'レナ', 'マティアス', 'ノラ', 'オスヴァルト', 'パウラ', 'ルーベン', 'ザビーネ', 'テオ', 'ウルスラ', 'ヴィム', 'ヤスミン', 'ゾフィー', 'アントン', 'ベラ', 'コンラート', 'ダニエラ', 'エーリク', 'フィーネ', 'グスタフ', 'ヘルミーネ', 'イグナーツ', 'ヨナス', 'カティア', 'ルドルフ', 'ミリアム', 'ニコ', 'オティーリエ', 'ペーター', 'ローザ'];
const PERS = ['陽気', '寡黙', '世話好き', '頑固', '臆病', '野心家', '皮肉屋', '夢見がち', '几帳面', 'お調子者'];
const SCHED = { day: 'day', night: 'night', noble: 'noble', slum: 'slum', scholar: 'scholar' };
const NIGHT_T = new Set(['tavern', 'casino', 'theater', 'blackmarket']);

export class Life {
  constructor(world) { this.world = world; this.weather = {}; this.citizens = []; this.byCity = {}; this.nextWx = 0; this.last = -1; }
  get time() { return clock(); }
  weatherOf(cityId) { return this.weather[cityId] || 'clear'; }
  rollWeather(now) {
    const se = season(); for (const [id, c] of Object.entries(CITIES)) { const warm = ['saharia', 'valgran'].includes(c.continent); const tbl = Object.entries(c.weather).map(([k, w]) => [k, w * (k === 'snow' && warm ? 0 : se.wx[k] ?? 1)]).concat(se.id === 'winter' && !warm && !c.weather.snow ? [['snow', 1.5]] : []); const tot = tbl.reduce((a, [, w]) => a + w, 0); let x = Math.random() * tot; for (const [k, w] of tbl) { x -= w; if (x <= 0) { this.weather[id] = k; break; } } }
  }
  // Build citizens from a generated city map (staff for each building role + families for homes)
  populate(cityId, map, interiorRoles) {
    const r = rng(hash32('citizens:' + cityId)); const list = [];
    const name = () => SURN[Math.floor(r() * SURN.length)];
    const workplaces = map.doors.filter(d => !d.home);
    for (const d of workplaces) {
      const roles = interiorRoles(d.t) || [];
      roles.forEach((role, i) => {
        if (VISITOR.has(role) && i > 0) return; // visitors come from the resident pool instead
        const sched = d.hours && (d.hours[0] >= 16 || d.hours[1] <= 6) ? 'night' : NIGHT_T.has(d.t) ? 'night' : ['lab', 'academy', 'library', 'observatory'].includes(d.t) ? 'scholar' : 'day';
        list.push({ id: `${cityId}:${d.id}:${i}`, city: cityId, name: name(), role, job: ROLE[role] || role, work: d.id, workSpot: i, fixed: i === 0, svc: i === 0 ? d.svc : null, guild: d.guild || null, sched, home: null, district: d.district, pers: PERS[Math.floor(r() * PERS.length)], money: Math.round(200 + r() * 2000 * (d.dtype === 'rich' ? 4 : d.dtype === 'slum' ? 0.2 : 1)), look: { body: Math.floor(r() * 3), skin: Math.floor(r() * 5), hair: Math.floor(r() * 6), hairColor: Math.floor(r() * 10), outfit: Math.floor(r() * 10) }, loc: null, friends: [] });
      });
    }
    for (const h of map.homes) {
      const n = 1 + Math.floor(r() * 3); const fam = SURN[Math.floor(r() * SURN.length)];
      for (let i = 0; i < n; i++) {
        const sched = h.dtype === 'rich' ? 'noble' : h.dtype === 'slum' ? 'slum' : cityId === 'arcanum' && r() < 0.5 ? 'scholar' : 'day';
        const role = sched === 'noble' ? 'noble' : sched === 'scholar' ? 'student' : 'citizen';
        const wp = sched === 'day' || sched === 'scholar' ? workplaces.filter(w => sched === 'scholar' ? ['lab', 'academy', 'library'].includes(w.t) : !NIGHT_T.has(w.t))[Math.floor(r() * workplaces.length) % Math.max(1, workplaces.length)] : null;
        list.push({ id: `${cityId}:${h.id}:${i}`, city: cityId, name: `${name()}・${fam}`, role, job: sched === 'slum' ? (r() < 0.5 ? '日雇い労働者' : '元坑夫') : sched === 'noble' ? '貴族' : wp ? `${wp.name}の勤め人` : '市民', work: wp?.id || null, fixed: false, sched, home: h.id, district: h.district, pers: PERS[Math.floor(r() * PERS.length)], money: Math.round(50 + r() * (h.dtype === 'rich' ? 20000 : h.dtype === 'slum' ? 80 : 1500)), look: { body: Math.floor(r() * 3), skin: Math.floor(r() * 5), hair: Math.floor(r() * 6), hairColor: Math.floor(r() * 10), outfit: Math.floor(r() * 10) }, family: fam, loc: null, friends: [] });
      }
    }
    // relationships: family share a home; friends in the same district
    for (const c of list) { const same = list.filter(o => o !== c && o.district === c.district); for (let k = 0; k < 2 && same.length; k++) c.friends.push(same[Math.floor(r() * same.length)].id); }
    this.byCity[cityId] = { list, map, places: this.places(map) };
    this.citizens.push(...list);
    return list;
  }
  places(map) { const by = t => map.doors.filter(d => !d.home && d.t === t).map(d => d.id); return { tavern: by('tavern'), market: map.doors.filter(d => d.t === 'shop').map(d => d.id), leisure: [...by('museum'), ...by('theater'), ...by('hotel'), ...by('casino'), ...by('bathhouse')], dark: [...by('blackmarket'), ...by('tavern')], labor: [...by('warehouse'), ...by('station'), ...by('smithy'), ...by('workshop')], church: by('church') }; }
  desired(c, h, wx) {
    const P = this.byCity[c.city].places; const pick = (arr, alt) => arr?.length ? arr[hash32(c.id + Math.floor(Date.now() / 3600000)) % arr.length] : alt; const home = c.home ? 'b:' + c.home : `p:${c.district}`;
    const wet = wx === 'rain' || wx === 'storm' || wx === 'snow';
    const work = c.work ? 'b:' + c.work : null;
    const door = c.work ? this.byCity[c.city].map.doors.find(d => d.id === c.work) : null;
    if (c.fixed || (work && door && !door.home && c.sched !== 'noble' && c.sched !== 'slum')) {
      if (door?.hours) return isOpen(door.hours, h) ? work : (h >= 0 && h < 7 ? home : wet ? 'b:' + pick(P.tavern, c.work) : `p:${c.district}`);
      if (c.sched === 'night') return h >= 17 || h < 4 ? work : h < 12 ? home : `p:${c.district}`;
      if (c.sched === 'scholar') return h >= 8 && h < 23 ? work : home;
      if (h >= 7 && h < 18) return h === 12 && !c.fixed ? 'b:' + pick(P.tavern, c.work) : work;
      if (h >= 18 && h < 21) return wet ? 'b:' + pick(P.tavern, c.work) : `p:${c.district}`;
      return c.fixed && !c.home ? work : home;
    }
    if (c.sched === 'noble') return h >= 10 && h < 12 || h >= 18 && h < 23 ? 'b:' + pick(P.leisure, null) || home : home;
    if (c.sched === 'slum') return h >= 8 && h < 17 ? (hash32(c.id + this.time.day) % 2 ? 'b:' + pick(P.labor, null) : `p:${c.district}`) : h >= 18 || h < 2 ? 'b:' + pick(P.dark, null) : home;
    if (h >= 8 && h < 17) return work || 'b:' + pick(P.market, null);
    if (h >= 17 && h < 21) return wet ? 'b:' + pick(P.tavern, null) : (hash32(c.id) % 3 ? `p:${c.district}` : 'b:' + pick(P.market, null));
    return home;
  }
  // abstract step every game 10 minutes
  step() {
    const t = this.time; if (t.total === this.last) return; this.last = t.total;
    if (t.total >= this.nextWx) { this.rollWeather(); this.nextWx = t.total + 120; }
    if (t.minute % 10 !== 0 && this.inited) return; this.inited = true;
    for (const c of this.citizens) {
      const want = this.desired(c, t.hour, this.weatherOf(c.city)) || (c.home ? 'b:' + c.home : `p:${c.district}`);
      if (c.loc === want && !c.moving) continue;
      if (!c.loc) { c.loc = want; continue; }
      if (c.moving?.to === want) continue;
      c.moving = { from: c.loc, to: want, at: Date.now() };
    }
  }
  // materialize / move actors in active zones (called every tick per active city/interior zone)
  sync(zone) {
    const cityId = zone.cityId; const pack = this.byCity[cityId]; if (!pack) return;
    const inside = zone.kind === 'interior' ? zone.bldgId : null;
    for (const c of pack.list) {
      let a = c.actor && c.actorZone === zone ? c.actor : null;
      const here = inside ? (c.loc === 'b:' + inside && !c.moving) || (c.moving && c.moving.from === 'b:' + inside) : (c.loc?.startsWith('p:') && !c.moving) || !!c.moving;
      if (!here) { if (a) { zone.remove(a); c.actor = null; } continue; }
      if (!a) a = this.spawn(zone, c, inside);
      if (!a) continue;
      if (inside && c.moving && c.moving.from === 'b:' + inside) { a.goal = zone.tileCenter([zone.map.w >> 1, zone.map.h - 1]); a.leaving = true; }
      else if (!inside && c.moving) { a.goal = this.placePos(zone, c.moving.to); a.arriveTo = c.moving.to; }
    }
  }
  placePos(zone, loc) { if (!loc) return null; const [k, id] = loc.split(':'); if (k === 'b') { const d = zone.map.doors?.find(x => x.id === id); if (d) return zone.tileCenter([d.x, d.y + 1]); } else { const p = zone.map.plazas?.find(x => x.district === id); if (p) return zone.tileCenter([p.x + (Math.random() * 6 - 3 | 0), p.y + (Math.random() * 4 - 2 | 0)]); } return null; }
  spawn(zone, c, inside) {
    let pos;
    if (inside) { const spots = zone.map.spots || []; const s = c.fixed && c.work === inside ? spots.find(x => x.fixed) : spots[Math.floor(Math.random() * spots.length)]; if (!s) return null; pos = zone.tileCenter([s.x, s.y]); }
    else if (c.moving) pos = this.placePos(zone, c.moving.from) || this.placePos(zone, c.moving.to);
    else pos = this.placePos(zone, c.loc);
    if (!pos) return null;
    const a = new Actor({ kind: 'resident', team: 'neutral', name: `${c.name}`, job: c.job, cit: c, x: pos.x, y: pos.y, r: 5, look: c.look, level: 0, stats: { atk: 0, matk: 0, def: 9999, crit: 0, critDmg: 1, dr: 1, mods: {}, range: 1, move: 1 }, maxHp: 1, hp: 1, fixed: c.fixed && inside === c.work, facing: Math.PI / 2 });
    zone.add(a); c.actor = a; c.actorZone = zone; return a;
  }
  tick(zone, a, now) {
    const c = a.cit; if (!c) return;
    if (a.fixed) { a.vx = a.vy = 0; return; }
    let g = a.goal;
    if (!g) { if (!a.wanderAt || now > a.wanderAt) { a.wanderAt = now + 3000 + Math.random() * 5000; const sp = zone.map.spots; if (sp?.length && zone.kind === 'interior') { const s = sp[Math.floor(Math.random() * sp.length)]; a.wgoal = zone.tileCenter([s.x, s.y]); } else a.wgoal = { x: a.x + (Math.random() - 0.5) * 60, y: a.y + (Math.random() - 0.5) * 40 }; } g = a.wgoal; }
    if (!g) return;
    const dx = g.x - a.x, dy = g.y - a.y, d = Math.hypot(dx, dy);
    if (d < 8) {
      a.vx = a.vy = 0; if (a.wgoal === g) a.wgoal = null;
      if (a.leaving || (a.goal && a.arriveTo)) { // finished a trip: hand off to abstract state
        if (c.moving) { c.loc = c.moving.to; c.moving = null; }
        zone.remove(a); c.actor = null; a.goal = null; return;
      }
      return;
    }
    const nd = zone.navDir(a, g); const spd = a.goal ? 42 : 18; a.vx = nd.x * spd; a.vy = nd.y * spd; a.facing = Math.atan2(nd.y, nd.x);
  }
  // simple contextual dialogue
  talk(c, ch, cityId) {
    const def = CITIES[cityId]; const t = this.time; const wx = WEATHER[this.weatherOf(cityId)];
    const lines = [];
    const greet = t.hour < 5 ? 'こんな夜更けに…' : t.hour < 11 ? 'おはよう。' : t.hour < 17 ? 'やあ。' : 'こんばんは。';
    lines.push(`${greet}今日は${wx}だね。`);
    const byRole = {
      receptionist: ['依頼なら掲示板を見ていってね。ランクが上がれば報酬もいいものになるよ。'], smith: ['いい鉄は叩けば叩くほど応えてくれる。強化なら任せな。'], barkeep: ['何にする？ 噂話ならタダで聞かせてやるよ。'],
      priest: ['神はすべての者を見守っておられます。下層区の人々も、です。'], banker: ['預金は死んでも消えませんよ。冒険者には必須です。'], dealer: ['運命の女神は気まぐれでね。賭け金はほどほどに。'],
      thug: ['…何見てんだ。ここは黒薔薇の縄張りだぜ。'], fence: ['表じゃ売れない品？ 見せてみな。'], noble: ['下々の暮らしには興味ありませんの。…でも冒険の話なら少し聞いてあげてもよくてよ。'],
      citizen: ['最近は物価が上がって大変だよ。'], student: ['次の論文が通らないと退学なんだ…。'], porter: ['荷が重くてな。運送ギルドの給料は安いんだ。'],
    };
    lines.push(...(byRole[c.role] || byRole.citizen));
    const hist = def.history[hash32(c.id + t.day) % def.history.length]; lines.push(`知ってるかい？ ${hist}`);
    if (c.sched === 'slum') lines.push(`${def.classes}`.split('。')[0] + '…それがこの街の現実さ。');
    if (c.guild) lines.push(`ここは${c.guild ? 'ギルドの仕事場' : ''}でもあるんだ。加入するなら受付で話してくれ。`);
    return lines[hash32(c.id + ch.id + t.hour) % lines.length] + (Math.random() < 0.4 ? ' ' + lines[1] : '');
  }
}
