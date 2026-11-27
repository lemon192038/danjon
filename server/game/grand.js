// NEW WORLD EVENTS — PHASE F (25-30) and PHASE G (01-04, 06). Personal records (trials, species, catalog, rally,
// artisan entries, star observations, unrecorded people) live in ch.progress.grand; world-shared states (sky castle
// barrier, serpent segments, boundary rifts, the tower) and rankings live in events.w.flags.grand and are stepped
// hourly by the event engine, also while everyone is offline. All results are decided here on the server.
import { TRIAL_CATS, TRIAL_TITLES, SPECIES, CATALOG_MILES, RALLY_COURSES, ARTISAN_THEMES, STARS, UNRECORDED, SERPENT_SEGS, RIFT_FIELDS, GRAND_EVENTS } from '../../shared/data/grand.js';
import { EVENT_BY_ID } from '../../shared/data/events.js';
import { CITIES } from '../../shared/data/cities.js';
import { WEAPON_TYPES } from '../../shared/data/weaponTypes.js';
import { ITEMS } from '../../shared/data/guilds.js';
import { clock } from './life.js';
import { addItem } from './progress.js';
import { DATA } from '../data.js';
import { PLACE } from '../../shared/data/world.js';

const night = h => h >= 20 || h < 5; const cityName = c => CITIES[c]?.name || c;
const SKY_EVERY = 12, SKY_LEN = 4, SKY_BARRIER = 300, SERPENT_EVERY = 15, SERPENT_LEN = 4, SERPENT_HP = 120, RIFT_EVERY = 20, RIFT_LEN = 5, RIFT_HP = 100;
export class Grand {
  constructor(world) { this.world = world; const F = this.world.events.w.flags; F.grand ||= {}; const G = this.G;
    G.sky ||= { state: 'dormant', barrier: 0, since: -1, contrib: {} }; G.serpent ||= { state: 'dormant', segs: {}, since: -1, contrib: {} }; G.rift ||= { state: 'dormant', rifts: {}, since: -1, contrib: {} };
    G.tower ||= { h: 20, day: -1 }; G.rank ||= { trials: {}, catalog: {} }; G.rally ||= { week: -1, times: {} }; G.artisan ||= { period: -1, entries: {}, awards: [] }; G.pend ||= {}; G.unrec ||= { recorded: 0 };
    world.events.register('grand', h => this.sim(h)); }
  get G() { return this.world.events.w.flags.grand; }
  P(ch) { return ch.progress.grand ||= { trials: [], species: {}, reported: [], catalogMiles: [], stars: {}, unrec: {}, rally: null, rallyBest: {}, artisan: {} }; }
  ev() { return this.world.events; }
  toast(s, v) { s.send({ t: 'toast', v }); }
  // ════ world simulation (hourly; bounded while offline)
  sim(h) { if (h <= 0) return; const d = clock().day, G = this.G;
    // 01 sky castle: appears every 12 days for 4 days; the barrier falls only by everyone's effort
    const sp = ((d % SKY_EVERY) + SKY_EVERY) % SKY_EVERY; if (sp < SKY_LEN && G.sky.state === 'dormant') { Object.assign(G.sky, { state: 'barrier', barrier: SKY_BARRIER, since: d, contrib: {} }); this.news('空に城が現れた。障壁に包まれ、近づくことはできない'); this.ev().setWorld('nx01', 'omen'); }
    if (sp >= SKY_LEN && G.sky.state !== 'dormant') { G.sky.state = 'dormant'; this.news('天空城は雲の向こうへ去った'); this.ev().setWorld('nx01', 'resolved', { outcome: '城は空へ去った' }); }
    // 03 world serpent: surfaces every 15 days for 4 days; sealed (never killed) when all segments are calmed
    const ss = ((d - 5) % SERPENT_EVERY + SERPENT_EVERY) % SERPENT_EVERY; if (ss < SERPENT_LEN && G.serpent.state === 'dormant') { Object.assign(G.serpent, { state: 'active', segs: Object.fromEntries(SERPENT_SEGS.map(x => [x.id, SERPENT_HP])), since: d, contrib: {} }); this.news('世界を囲う巨蛇が浮上した。四つの地方に巨体が現れている'); this.ev().setWorld('nx03', 'active'); }
    if (ss >= SERPENT_LEN && G.serpent.state !== 'dormant') { if (G.serpent.state === 'active') { this.news('巨蛇は暴れたまま潜っていった。沿岸の物資が少し不足している'); this.supply(['marinelia'], -0.15); } G.serpent.state = 'dormant'; this.ev().setWorld('nx03', 'dormant'); }
    // 04 boundary collapse: only once someone has learned the forbidden library's truth; rifts every 20 days
    const rs = ((d - 9) % RIFT_EVERY + RIFT_EVERY) % RIFT_EVERY;
    if (rs < RIFT_LEN && G.rift.state === 'dormant') { Object.assign(G.rift, { state: 'active', rifts: Object.fromEntries(RIFT_FIELDS.map(x => [x.id, RIFT_HP])), since: d, contrib: {} }); this.news('境界が崩れ、各地のフィールドに亀裂が開いた'); this.ev().setWorld('nx04', 'active'); }
    if (rs >= RIFT_LEN && G.rift.state !== 'dormant') { G.rift.state = 'dormant'; this.ev().setWorld('nx04', 'dormant'); }
    // 06 the tower grows a little every day unless people descend it (it never destroys anything; it strains trade)
    if (G.tower.day !== d) { G.tower.day = d; const grow = this.world.events.flag('ct:tower') === 'sealed' ? 1 : 4; G.tower.h = Math.min(100, G.tower.h + grow); if (G.tower.h >= 80) this.supply(['marinelia'], -0.05); }
    // 28 rally weekly reset, 29 artisan judging at the end of each contest
    this.syncRally();
    this.syncArt(); if (G.artisan.period >= 0 && !this.artisanOpen() && !G.artisan.judged) this.judge(); }
  news(v) { this.world.econ.addNews(v); }
  supply(cities, v) { const S = this.world.econ.supply; for (const c of cities) if (S[c]) for (const g of Object.keys(S[c])) S[c][g] = Math.max(0.35, Math.min(2.5, S[c][g] + v)); }
  pend(chId, ev, key, rew) { (this.G.pend[chId] ||= []).push({ ev, key, rew }); const s = [...this.world.sessions.values()].find(x => x.ch?.id === chId); if (s) this.onLogin(s); }
  onLogin(s) { const L = this.G.pend[s.ch.id]; if (!L?.length) return; delete this.G.pend[s.ch.id]; for (const p of L) { this.ev().grant(s, p.ev, p.key, p.rew); } this.world.sendSelf(s); }
  // ════ condition steps
  cond(s, id) { const ch = s.ch, P = this.P(ch), G = this.G; const [k, v] = id.split(':'); const n = +v;
    switch (k) {
      case 'job': { const need = +id.split(':')[2] || 0; return (ch.jobs?.[v]?.rank ?? -1) >= need ? null : `前提職の熟練が足りない（${v === 'ev_bladethrower' ? '投刃士' : v} 熟練${need}以上）`; }
      case 'trials': return P.trials.length >= n ? null : `試練の達成が足りない（${P.trials.length}/${n}）。試練の記録から達成済みの試練を受け取ろう`;
      case 'bureau': return P.reported.length >= n ? null : `報告した記録が足りない（${P.reported.length}/${n}）`;
      case 'catalog': return this.catalog(ch).length >= n ? null : `UR以上を入手した武器種が足りない（${this.catalog(ch).length}/${n}）`;
      case 'rally': return P.rally?.done && P.rally.week === this.wk() ? null : '今週のコースをまだ完走していない';
      case 'artisan': return P.artisan[G.artisan.period] != null && this.artisanOpen() ? null : this.artisanOpen() ? 'まだ出品していない' : '品評会の会期外';
      case 'stars': return Object.keys(P.stars).length >= n ? null : `観測した星座が足りない（${Object.keys(P.stars).length}/${n}）`;
      case 'unrec': return Object.keys(P.unrec).length >= n ? null : `会えた人が足りない（${Object.keys(P.unrec).length}/${n}）`;
      case 'sky': return G.sky.state === 'open' ? null : G.sky.state === 'barrier' ? `障壁が残っている（${Math.ceil(G.sky.barrier)}/${SKY_BARRIER}）` : '城はまだ空に現れていない';
      case 'serpent': if (v === 'sealed') return G.serpent.state === 'sealed' ? null : G.serpent.state === 'active' ? '鎮まっていない部位がある' : '巨蛇はいま海の底だ（浮上を待とう）';
        return (G.serpent.contrib[ch.id] || 0) >= n ? null : G.serpent.state === 'active' ? `貢献が足りない（${G.serpent.contrib[ch.id] || 0}/${n}）` : '巨蛇はいま海の底だ（浮上を待とう）';
      case 'rift': if (v === 'active') return G.rift.state !== 'dormant' ? null : '境界はまだ保たれている（崩壊を待とう）'; if (v === 'closed') return G.rift.state === 'closed' ? null : G.rift.state === 'active' ? '開いたままの亀裂がある' : '亀裂は消えてしまった（次の崩壊で）';
        return (G.rift.contrib[ch.id] || 0) >= n ? null : `貢献が足りない（${G.rift.contrib[ch.id] || 0}/${n}）`;
    } return '条件を満たしていない'; }
  gateBlock(dId) { if (dId === 'sky_castle' && this.G.sky.state !== 'open') return '天空城の障壁はまだ解けていない'; return null; }
  // ════ 25 trials
  measure(ch, k) { const p = ch.progress; switch (k) {
    case 'level': return ch.level; case 'kills': return p.kills || 0; case 'bosses': return Object.values(p.bossKills || {}).reduce((t, v) => t + v, 0);
    case 'fams': return Object.keys(p.famKills || {}).length; case 'mastery': return Object.values(ch.mastery || {}).filter(m => m.lv >= 30).length; case 'codex': return (p.codex || []).length;
    case 'dungeons': return Object.values(p.clears || {}).filter(c => Math.max(0, ...Object.values(c || {})) >= 10).length; case 'titles': return (p.titles || []).length;
    case 'events': { const E = this.ev(); return Object.keys(E.pc(ch).prog).filter(id => E.isDone(ch, id)).length; } case 'gold': return ch.gold; } return 0; }
  trialRows(ch) { const P = this.P(ch); return TRIAL_CATS.map(c => { const v = this.measure(ch, c.k); return { c, v, tiers: c.t.map((t, i) => ({ id: `${c.k}${i}`, t, ok: v >= t, got: P.trials.includes(`${c.k}${i}`) })) }; }); }
  claimTrials(s) { const ch = s.ch, P = this.P(ch); let n = 0; for (const r of this.trialRows(ch)) for (const [i, t] of r.tiers.entries()) if (t.ok && !t.got) { P.trials.push(t.id); n++; this.ev().grant(s, 'nx25', 'trial:' + t.id, { gold: 500 * (i + 1) * (i + 1), xp: 1000 * (i + 1) * (i + 1) }); }
    for (const [k, title] of TRIAL_TITLES) if (P.trials.length >= k) this.ev().grant(s, 'nx25', 'ttl:' + k, { title });
    this.G.rank.trials[ch.id] = { n: P.trials.length, name: ch.name }; this.toast(s, n ? `試練を${n}個達成した（合計${P.trials.length}/100）` : '新しく達成した試練はない'); }
  // ════ 26 species
  onKill(s, m, z) { const ch = s.ch, P = this.P(ch), G = this.G; const h = clock().hour; const wx = this.world.life.weatherOf(this.world.cityNear(z) || 'haven');
    for (const sp of SPECIES) if (!P.species[sp.id] && m.fam === sp.fam && this.condOk(sp.cond, h, wx, m)) { P.species[sp.id] = Date.now(); this.toast(s, `【未確認生物】${sp.name}を記録した（調査局に報告しよう）`); }
    const fid = z.id; // world contributions by fighting where the world event happens
    if (G.sky.state === 'barrier' && (fid === 'astral' || z.dungeon?.id === 'astral' || z.kind === 'field')) this.skyHit(s, z.dungeon?.id === 'astral' ? 3 : 1);
    if (G.serpent.state === 'active') { const seg = SERPENT_SEGS.find(x => x.field === fid); if (seg && G.serpent.segs[seg.id] > 0) this.serpentHit(s, seg, 1); }
    if (G.rift.state === 'active') { const r = RIFT_FIELDS.find(x => x.field === fid); if (r && G.rift.rifts[r.id] > 0) { this.riftHit(s, r, 1); if (Math.random() < 0.08) { addItem(ch, { kind: 'mat', ref: 'relic', n: 1 }); this.toast(s, '亀裂から遺物がこぼれ落ちた'); } } } }
  condOk(c, h, wx, m) { return c === 'night' ? night(h) : c === 'midnight' ? h === 0 : c === 'dawn' ? h >= 4 && h < 6 : c === 'elite' ? !!m.elite : c === 'rain' ? wx === 'rain' : c === 'storm' ? wx === 'storm' || wx === 'thunder' : c === 'fog' ? wx === 'fog' : c === 'snow' ? wx === 'snow' || wx === 'blizzard' : false; }
  report(s) { const ch = s.ch, P = this.P(ch); const fresh = Object.keys(P.species).filter(k => !P.reported.includes(k)); if (!fresh.length) return this.toast(s, '新しく報告できる記録はない');
    for (const k of fresh) { P.reported.push(k); this.ev().grant(s, 'nx26', 'sp:' + k, { gold: 3000, xp: 5000 }); } this.toast(s, `${fresh.length}種を報告した（${P.reported.length}/${SPECIES.length}）`); if (P.reported.length >= SPECIES.length) this.ev().grant(s, 'nx26', 'all', { title: '生態の記録者', gold: 30000 }); }
  // ════ 27 catalog
  catalog(ch) { const have = new Set(); for (const id of ch.progress.codex || []) { const w = DATA.weapons.get(id); if (w && w.rar >= 5) have.add(w.wt); } return [...have]; }
  catalogClaim(s) { const ch = s.ch, P = this.P(ch); const n = this.catalog(ch).length; let got = 0; for (const [k, r] of CATALOG_MILES) if (n >= k && !P.catalogMiles.includes(k)) { P.catalogMiles.push(k); this.ev().grant(s, 'nx27', 'mile:' + k, r); got++; }
    this.G.rank.catalog[ch.id] = { n, name: ch.name }; this.toast(s, got ? `目録の節目を${got}つ達成した` : `目録：${n}/86種`); }
  // ════ 28 rally
  wk() { return Math.floor(clock().day / 7); }
  course() { return RALLY_COURSES[((this.wk() % RALLY_COURSES.length) + RALLY_COURSES.length) % RALLY_COURSES.length]; }
  rallyStart(s) { const P = this.P(s.ch); const c = this.course(); if (s.actor.zone.cityId !== 'marinelia' && s.actor.zone.cityId !== c[0]) return this.toast(s, '受付（マリネリア）で出走しよう'); this.syncRally(); P.rally = { week: this.wk(), t0: Date.now(), cp: 0, done: false }; this.toast(s, `出走！ 最初のチェックポイントは${cityName(c[0])}`); }
  onEnterZone(s, z) { const P = this.P(s.ch); const R = P.rally; if (!R || R.done || R.week !== this.wk() || !z.cityId) return; this.syncRally(); const c = this.course(); if (z.cityId !== c[R.cp]) return; R.cp++;
    if (R.cp < c.length) return this.toast(s, `チェックポイント通過（${R.cp}/${c.length}）次は${cityName(c[R.cp])}`);
    R.done = true; R.time = Date.now() - R.t0; const G = this.G; const best = G.rally.times[s.ch.id]; if (!best || R.time < best) { G.rally.times[s.ch.id] = R.time; (G.rally.names ||= {})[s.ch.id] = s.ch.name; }
    this.toast(s, `ゴール！ 記録 ${fmt(R.time)}（受付で報告しよう）`); }
  syncRally() { if (this.G.rally.week !== this.wk()) { if (this.G.rally.week >= 0) this.rallyAwards(); this.G.rally = { week: this.wk(), times: {}, names: {} }; } }
  rallyRank() { const G = this.G.rally; return Object.entries(G.times).sort((a, b) => a[1] - b[1]).slice(0, 10).map(([id, t]) => ({ id, name: G.names?.[id] || '?', t })); }
  rallyAwards() { this.rallyRank().slice(0, 3).forEach((r, i) => this.pend(r.id, 'nx28', 'rank:' + this.G.rally.week, { gold: [30000, 15000, 8000][i], title: i === 0 ? '大陸横断レースの覇者' : '大陸横断レースの上位入賞者' })); }
  // ════ 29 artisan
  artisanOpen() { return clock().day % 10 < 4; }
  theme() { return ARTISAN_THEMES[Math.floor(clock().day / 10) % ARTISAN_THEMES.length] || ARTISAN_THEMES[0]; }
  syncArt() { const d = clock().day, ap = Math.floor(d / 10), A = this.G.artisan; if (A.period !== ap) { if (A.period >= 0 && !A.judged) this.judge(); if (d % 10 < 4) this.G.artisan = { period: ap, entries: {}, awards: this.G.artisan.awards || [], judged: false }; } }
  score(it, k) { const w = DATA.weapons.get(it.ref); if (!w) return 0; const tr = it.traits || w.traits || []; return k === 'plus' ? (it.plus || 0) * 10 + w.rar : k === 'traits' ? tr.length * 20 + tr.reduce((t, x) => t + Object.values(x.mods || {}).reduce((a, b) => a + Math.abs(b) * 100, 0), 0) : k === 'rar' ? w.rar * 20 + (it.plus || 0) : Math.round(w.atk * (1 + (it.plus || 0) * 0.05)); }
  enter(s, uid) { this.syncArt(); const ch = s.ch, P = this.P(ch), G = this.G; if (!this.artisanOpen()) return this.toast(s, '品評会の会期外'); const it = ch.inventory.find(i => i.uid === uid && i.kind === 'weapon'); if (!it) return;
    const sc = this.score(it, this.theme().k); P.artisan[G.artisan.period] = sc; G.artisan.entries[ch.id] = { name: ch.name, sc, w: DATA.weapons.get(it.ref)?.name, plus: it.plus || 0 }; this.toast(s, `「${DATA.weapons.get(it.ref)?.name}」を出品した（審査点${sc}）`); }
  judge() { const G = this.G.artisan; G.judged = true; const top = Object.entries(G.entries).sort((a, b) => b[1].sc - a[1].sc); top.slice(0, 3).forEach(([id], i) => this.pend(id, 'nx29', 'award:' + G.period, { gold: [50000, 25000, 12000][i], title: i === 0 ? '至高の職人' : '名匠' }));
    G.awards = [{ period: G.period, theme: this.theme().name, winners: top.slice(0, 3).map(([, e]) => e.name) }, ...(G.awards || [])].slice(0, 5); if (top.length) this.news(`至高の職人の品評会：「${this.theme().name}」の優勝は${top[0][1].name}`); }
  // ════ field objects: 30 stars, 02 unrecorded people (placed by the exploration module)
  onObject(s, o, z) { const ch = s.ch, P = this.P(ch), h = clock().hour, say = v => this.toast(s, v); const wx = this.world.life.weatherOf(this.world.cityNear(z) || 'haven');
    if (o.k === 'starstone') { const S = STARS.find(x => x.key === o.key); if (!S) return true; const inH = h >= S.h[0] && h < S.h[1] || (S.h[1] === 24 && h === 23);
      if (!night(h)) return say('昼の石台には、星の位置を刻んだ溝が並んでいるだけだ'), true; if (!['clear', 'cloud'].includes(wx) || wx === 'cloud' && Math.random() < 0.5) return say('空が曇っていて、星が見えない'), true;
      if (!inH) return say(`${S.name}は、まだ（もう）この時刻には昇っていない（${S.h[0]}〜${S.h[1]}時）`), true;
      if (!P.stars[S.key]) { P.stars[S.key] = Date.now(); say(`【星座観測】${S.rec}`); this.world.events.log(ch, 'nx30', `${S.name}を観測`); } else say(`${S.name}が静かに瞬いている`); return true; }
    if (o.k === 'unrecorded') { const U = UNRECORDED.find(x => x.key === o.key); if (!U) return true; if (!night(h)) return say('焚き火の跡だけが残っている。夜になれば、誰かが戻ってくるのかもしれない'), true;
      if (!P.unrec[U.key]) { P.unrec[U.key] = Date.now(); this.world.events.log(ch, 'nx02', `${U.mark}に会った`); } say(`${U.say}（${U.mark}）`); return true; }
    return false; }
  // ════ world contributions
  skyHit(s, n) { const S = this.G.sky; S.barrier = Math.max(0, S.barrier - n); S.contrib[s.ch.id] = (S.contrib[s.ch.id] || 0) + n; if (S.barrier <= 0 && S.state === 'barrier') { S.state = 'open'; this.news('天空城の障壁が解けた！ 城が地上近くまで降りてきている'); this.ev().setWorld('nx01', 'active'); } }
  serpentHit(s, seg, n) { const S = this.G.serpent; S.segs[seg.id] = Math.max(0, S.segs[seg.id] - n); S.contrib[s.ch.id] = (S.contrib[s.ch.id] || 0) + n;
    if (S.segs[seg.id] === 0) this.news(`巨蛇の${seg.name}が鎮まった`); if (S.state === 'active' && Object.values(S.segs).every(v => v <= 0)) { S.state = 'sealed'; this.news('巨蛇は眠りに戻った。世界中の冒険者の力で鎮められた'); this.ev().setWorld('nx03', 'resolved', { outcome: '巨蛇を鎮めた' }); this.supply(['marinelia'], 0.1); } }
  riftHit(s, r, n) { const S = this.G.rift; S.rifts[r.id] = Math.max(0, S.rifts[r.id] - n); S.contrib[s.ch.id] = (S.contrib[s.ch.id] || 0) + n;
    if (S.state === 'active' && Object.values(S.rifts).every(v => v <= 0)) { S.state = 'closed'; this.news('すべての境界の亀裂が閉じた'); this.ev().setWorld('nx04', 'resolved', { outcome: '亀裂を閉じた' }); } }
  offer(s, ev, ref) { const ch = s.ch, G = this.G; const val = { relic: 6, abyssShard: 10, crystal: 3, gem: 3 }[ref]; if (!val) return; if (!this.world.cev.take(ch, ref, 1)) return this.toast(s, `${ITEMS[ref]?.name}がない`);
    if (ev === 'nx01' && G.sky.state === 'barrier') this.skyHit(s, val * 2); else if (ev === 'nx03' && G.serpent.state === 'active') { const seg = SERPENT_SEGS.find(x => G.serpent.segs[x.id] > 0); if (seg) this.serpentHit(s, seg, val); }
    else if (ev === 'nx04' && G.rift.state === 'active') { const r = RIFT_FIELDS.find(x => G.rift.rifts[x.id] > 0); if (r) this.riftHit(s, r, val); } else { addItem(ch, { kind: 'mat', ref, n: 1 }); return this.toast(s, '今は献納できない'); }
    this.toast(s, `${ITEMS[ref]?.name}を献納した`); }
  onBoss(s, z) { if (z.dungeon?.id === 'sea_tower') { const T = this.G.tower; T.h = Math.max(0, T.h - 15); this.news('海底の塔の成長が押し戻された'); } }
  onFloor(s, z) { if (z.dungeon?.id === 'sea_tower') { const T = this.G.tower; T.h = Math.max(0, T.h - 0.5); } }
  // ════ panel (service kind 'grand': generic rows with bars and buttons)
  view(s, ev) { const ch = s.ch, P = this.P(ch), G = this.G; const B = (label, op, o = {}) => ({ label, op, ...o }); const rows = [];
    switch (ev) {
      case 'nx25': { const tr = this.trialRows(ch); rows.push({ h: `試練の記録 ${P.trials.length}/100`, btns: [B('達成した試練を受け取る', 'claim')] });
        for (const r of tr) rows.push({ h: `${r.c.name}（現在 ${r.v.toLocaleString()}${r.c.unit}）`, text: r.tiers.map(t => `${t.got ? '★' : t.ok ? '☆' : '・'}${t.t.toLocaleString()}`).join(' ') });
        rows.push({ h: '順位', text: rank(G.rank.trials) }); break; }
      case 'nx26': rows.push({ h: `記録 ${Object.keys(P.species).length}/${SPECIES.length} ・ 報告済み ${P.reported.length}`, btns: [B('記録を報告する', 'report')] }); for (const sp of SPECIES) rows.push({ h: `${P.species[sp.id] ? '◆' : '◇'} ${P.species[sp.id] ? sp.name : '？？？'}`, text: sp.hint }); break;
      case 'nx27': { const have = new Set(this.catalog(ch)); rows.push({ h: `目録 ${have.size}/86種`, btns: [B('目録を更新する', 'catalog')], text: CATALOG_MILES.map(([k]) => `${P.catalogMiles.includes(k) ? '★' : '・'}${k}種`).join(' ') });
        rows.push({ text: WEAPON_TYPES.map(w => `${have.has(w.id) ? '■' : '□'}${w.name}`).join(' ') }); rows.push({ h: '順位', text: rank(G.rank.catalog) }); break; }
      case 'nx28': { const c = this.course(), R = P.rally; rows.push({ h: `今週のコース`, text: c.map((x, i) => `${R && R.week === this.wk() && R.cp > i ? '✔' : `${i + 1}.`}${cityName(x)}`).join(' → '), btns: [B(R && R.week === this.wk() && !R.done ? '出走し直す' : '出走する', 'start')] });
        if (R?.done && R.week === this.wk()) rows.push({ text: `あなたの記録：${fmt(R.time)}` }); rows.push({ h: '今週の順位（上位3人に賞金と称号）', text: this.rallyRank().map((r, i) => `${i + 1}位 ${r.name} ${fmt(r.t)}`).join(' ／ ') || 'まだ誰も完走していない' }); break; }
      case 'nx29': { const th = this.theme(); rows.push({ h: this.artisanOpen() ? `開催中：お題「${th.name}」（${th.desc}）` : `会期外（次のお題は${ARTISAN_THEMES[(G.artisan.period + 1) % ARTISAN_THEMES.length].name}）` });
        if (this.artisanOpen()) for (const it of ch.inventory.filter(i => i.kind === 'weapon').slice(0, 30)) { const w = DATA.weapons.get(it.ref); rows.push({ text: `${w?.name}${it.plus ? ' +' + it.plus : ''}（審査点${this.score(it, th.k)}）`, btns: [B('出品', 'enter', { arg: it.uid })] }); }
        rows.push({ h: '出品一覧', text: Object.values(G.artisan.entries).sort((a, b) => b.sc - a.sc).slice(0, 10).map(e => `${e.name}「${e.w}」${e.sc}`).join(' ／ ') || 'なし' });
        rows.push({ h: '過去の受賞', text: (G.artisan.awards || []).map(a => `${a.theme}：${a.winners.join('、') || '—'}`).join(' ／ ') || 'なし' }); break; }
      case 'nx30': rows.push({ h: `観測した星座 ${Object.keys(P.stars).length}/7`, text: '星見の石台は各地のフィールドにある。晴れた夜、星座ごとの時刻に' }); for (const S of STARS) rows.push({ h: `${P.stars[S.key] ? '★' : '☆'} ${S.name}`, text: P.stars[S.key] ? S.rec : `見える場所：${fieldName(S.field)}・${S.h[0]}〜${S.h[1]}時` }); break;
      case 'nx02': rows.push({ h: `会えた人 ${Object.keys(P.unrec).length}/${UNRECORDED.length}`, text: '夜のフィールドで、記録にない人々に会える' }); for (const U of UNRECORDED) rows.push({ h: P.unrec[U.key] ? `◆ ${U.mark}` : '◇ ？？？', text: P.unrec[U.key] ? U.say : `${fieldName(U.field)}のどこかで` }); break;
      case 'nx01': { const S = G.sky; rows.push({ h: { dormant: '天空城は現れていない（12日ごとに4日間現れる）', barrier: '天空城の障壁', open: '天空城の障壁が解けている！' }[S.state], bar: S.state === 'barrier' ? [S.barrier, SKY_BARRIER] : null, text: S.state === 'barrier' ? 'どこのフィールドでも魔物を倒すと障壁が下がる（天空遺跡群では3倍）。献納でも下がる' : '', btns: S.state === 'barrier' ? [B('遺物を献納', 'offer', { arg: 'relic' }), B('深淵の欠片を献納', 'offer', { arg: 'abyssShard' })] : [] });
        rows.push({ text: `あなたの貢献：${S.contrib[ch.id] || 0}` }); break; }
      case 'nx03': { const S = G.serpent; rows.push({ h: { dormant: '巨蛇は海の底で眠っている（15日ごとに浮上）', active: '巨蛇が浮上している', sealed: '巨蛇は鎮められた' }[S.state], btns: S.state === 'active' ? [B('遺物を献納', 'offer', { arg: 'relic' }), B('深淵の欠片を献納', 'offer', { arg: 'abyssShard' })] : [] });
        if (S.state !== 'dormant') for (const g of SERPENT_SEGS) rows.push({ h: `${g.name}（${fieldName(g.field)}）`, bar: [S.segs[g.id] || 0, SERPENT_HP] }); rows.push({ text: `あなたの貢献：${S.contrib[ch.id] || 0}` }); break; }
      case 'nx04': { const S = G.rift; rows.push({ h: { dormant: '境界は保たれている', active: '境界が崩れ、亀裂が開いている', closed: '亀裂はすべて閉じた' }[S.state], btns: S.state === 'active' ? [B('宝石を献納', 'offer', { arg: 'gem' }), B('結晶を献納', 'offer', { arg: 'crystal' })] : [] });
        if (S.state !== 'dormant') for (const r of RIFT_FIELDS) rows.push({ h: `${r.name}（${fieldName(r.field)}）`, bar: [S.rifts[r.id] || 0, RIFT_HP] }); rows.push({ text: `あなたの貢献：${S.contrib[ch.id] || 0}　亀裂のフィールドでは遺物が見つかることがある` }); break; }
      case 'nx06': rows.push({ h: '塔の高さ', bar: [G.tower.h, 100], text: `毎日伸びる。塔の中を降りると押し戻せる（最深部の海竜を倒すと大きく下がる）${G.tower.h >= 80 ? '。港の交易に影響が出ている' : ''}` }); break;
    } return { kind: 'grand', rows }; }
  svc(s, ev, m) { switch (m.mode || m.op) { case 'claim': return this.claimTrials(s); case 'report': return this.report(s); case 'catalog': return this.catalogClaim(s); case 'start': return this.rallyStart(s); case 'enter': return this.enter(s, m.ref); case 'offer': return this.offer(s, ev, m.ref); } }
}
const fmt = ms => { const t = Math.round(ms / 1000); return `${Math.floor(t / 60)}分${String(t % 60).padStart(2, '0')}秒`; };
const rank = o => Object.values(o).sort((a, b) => b.n - a.n).slice(0, 5).map((r, i) => `${i + 1}位 ${r.name}（${r.n}）`).join(' ／ ') || 'まだ記録がない';
const fieldName = f => (PLACE[f]?.name || { field_capital: '王都近郊の平原', field_greatwood: 'エルム大森林' }[f] || f).split('：')[0];
export { GRAND_EVENTS };
