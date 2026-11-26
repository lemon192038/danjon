// PHASE 8: the Sealed Abyss (archive keys), the Great Library and the Forbidden Archive (books), the Seven Sins
// (heretic → sinner → final trial → bishop) and the bishop seats with succession duels and a permanent history.
import { SINS, SIN_KEYS, BOOKS, BOOK_BY_ID, BOOK_CATS, KEY_RATE } from '../../shared/data/library.js';
import { addItem, checkJobUnlocks } from './progress.js';
import { makeDuelChar, spawnDuelist, duelArena } from './duel.js';
import { Zone } from './zone.js';
import { store } from '../store.js';
import { WT_BY_ID, DATA } from '../data.js';

const HIST_CAP = 300;
const LOOK = { body: 2, skin: 2, hair: 4, hairColor: 8, outfit: 7 };
export class Library {
  constructor(world) {
    this.world = world; const F = world.events.w.flags;
    F.seats ||= Object.fromEntries(SIN_KEYS.map(k => [k, { holder: { kind: 'npc', id: 'npc_' + k, name: SINS[k].npc[0], wt: SINS[k].npc[1], job: `大罪司教・${SINS[k].name}担当` }, since: Date.now() }]));
    F.seatHist ||= []; F.formerBishops ||= [];
  }
  get seats() { return this.world.events.w.flags.seats; }
  keys(ch) { return ch.inventory.filter(i => i.ref === 'archiveKey').reduce((t, i) => t + i.n, 0); }
  // ── Sealed Abyss: archive keys from every 10th-floor boss, P% = floor/10, rolled per player
  onBossKilled(s, z) { if (z.dungeon?.id !== 'sealed' || z.floor % 10 !== 0 || !['HARD', 'HELL', 'ABYSS'].includes(z.diff)) return; const E = this.world.events, ch = s.ch;
    if (!E.prog(ch, 'lib_sealed_abyss')) E.start(s, 'lib_sealed_abyss', { silent: true });
    const st = Math.min(5, Math.floor((z.floor - 1) / 10)); const P = E.prog(ch, 'lib_sealed_abyss'); if (!P.done && P.stage < st) E.advance(s, 'lib_sealed_abyss', st, { silent: true });
    if (Math.random() < KEY_RATE(z.floor)) { addItem(ch, { kind: 'mat', ref: 'archiveKey', n: 1 }); this.world.note(s, { t: 'msg', v: `「禁書庫の鍵」を手に入れた（${z.floor}階・確率${z.floor / 10}%）` }); if (!P.done) E.complete(s, 'lib_sealed_abyss'); else E.record(s, 'lib_sealed_abyss', `禁書庫の鍵を入手（${z.floor}F）`, { clear: true }); } }
  onEnterSealed(s, z) { if (z.dungeon?.id !== 'sealed') return; const E = this.world.events; if (!E.prog(s.ch, 'lib_sealed_abyss')) E.start(s, 'lib_sealed_abyss'); }
  // ── Great Library: key holders are guided to the reception; one key opens the Forbidden Archive
  libraryPos(s, iz) { if (!this.keys(s.ch)) return null; const n = iz.map.npcs.find(x => x.service === 'library'); if (!n) return null; s.send({ t: 'toast', v: '鍵が淡く光り、あなたを受付へと導いた' }); return iz.tileCenter([n.x, n.y + 2]); }
  openLibrary(s) { s.send({ t: 'open', service: 'library', data: { keys: this.keys(s.ch), visited: !!this.world.events.prog(s.ch, 'lib_forbidden') } }); }
  enterArchive(s) { const ch = s.ch, E = this.world.events, z = s.actor.zone; if (z.bldgId !== 'ar_biglib') return s.send({ t: 'err', v: '大図書館の受付で' });
    if (!this.keys(ch)) return s.send({ t: 'err', v: '禁書庫の鍵が必要（封印されし深淵の10階ごとのボスから）' });
    let l = 1; for (const i of ch.inventory.filter(x => x.ref === 'archiveKey')) { const q = Math.min(l, i.n); i.n -= q; l -= q; } ch.inventory = ch.inventory.filter(i => !(i.ref === 'archiveKey' && i.n <= 0));
    const key = 'fa:' + ch.id; let az = this.world.zones.get(key);
    if (!az) { az = new Zone(this.world, key, { kind: 'interior', city: z.cityId, bldg: { id: 'forbidden', name: '禁書庫', t: 'library', size: 'XL' }, door: z.door });
      az.archive = true; az.map.npcs = []; const c = az.map.start; az.map.npcs.push({ service: 'archive', name: '記録管理者アーカイヴ', x: az.map.w >> 1, y: Math.max(3, c[1] - 6) }); az.map.wallCol = '#2a1a4a'; az.map.lights = [...(az.map.lights || []), ...Array.from({ length: 8 }, (_, i) => [3 + i * 3, 3])];
      this.world.zones.set(key, az); }
    s.send({ t: 'loading', v: '禁書庫' }); this.world.enterZone(s, az);
    if (!E.isDone(ch, 'lib_sealed_abyss')) { if (!E.prog(ch, 'lib_sealed_abyss')) E.start(s, 'lib_sealed_abyss', { silent: true }); E.complete(s, 'lib_sealed_abyss', null, { silent: true }); } // holding a key proves the abyss
    if (!E.prog(ch, 'lib_forbidden')) { const r = E.start(s, 'lib_forbidden'); if (r.ok) E.grant(s, 'lib_forbidden', 'first', { title: '初めての禁書庫' }); } else E.log(ch, 'lib_forbidden', '禁書庫を訪れた');
    this.world.sendSelf(s); }
  // ── Forbidden Archive: the archivist and the books (read page by page; the server keeps the page)
  view(s) { const ch = s.ch, F = this.world.events.w.flags; const rd = ch.progress.books || {};
    const players = SIN_KEYS.filter(k => this.seats[k].holder.kind === 'player').length;
    return { cats: BOOK_CATS, books: BOOKS.map(b => ({ id: b.id, cat: b.cat, title: b.title, n: b.pages.length, page: rd[b.id] || 0, done: (rd[b.id] || 0) >= b.pages.length, sin: b.sin || null })),
      heretic: !!ch.jobs.ev_heretic, route: ch.progress.sinRoute || null, sins: SIN_KEYS.map(k => ({ k, name: SINS[k].name, book: SINS[k].book, trial: SINS[k].trial, theme: SINS[k].theme, style: SINS[k].style, sinner: ch.jobs['ev_sinner_' + k]?.rank ?? null, bishop: !!ch.jobs['ev_bishop_' + k], trialDone: this.world.events.hasReward(ch, 'lib_sins', 'trial:' + k), seat: this.seats[k].holder, since: this.seats[k].since, mine: this.seats[k].holder.kind === 'player' && this.seats[k].holder.id === ch.id })),
      hist: F.seatHist.slice(-40).reverse(), former: F.formerBishops.slice(-20), lv: ch.level, full: players === 7,
      line: players === 7 ? '「七つの席が埋まったのですね。ならば、次に現れるものは……。」' : ch.jobs.ev_heretic ? '「読みなさい。ただし、読んだものは、あなたを読み返します」' : '「ここは記録の墓所。どの書から読みますか」' }; }
  open(s) { s.send({ t: 'open', service: 'archive', data: this.view(s) }); }
  read(s, id, page) { const ch = s.ch, b = BOOK_BY_ID[id]; if (!b || !s.actor.zone.archive) return; const rd = ch.progress.books ||= {}; const cur = rd[id] || 0; if (cur >= b.pages.length && page >= 1 && page <= b.pages.length) return s.send({ t: 'book', id, page, text: b.pages[page - 1], last: page === b.pages.length }); // re-reading
    if (page !== cur + 1 || page > b.pages.length) return s.send({ t: 'book', id, page: cur, text: b.pages[Math.max(0, cur - 1)] || '' });
    rd[id] = page; s.send({ t: 'book', id, page, text: b.pages[page - 1], last: page === b.pages.length });
    if (page === b.pages.length) this.finished(s, b); }
  finished(s, b) { const ch = s.ch, E = this.world.events; E.log(ch, 'lib_forbidden', `${b.title}を読み終えた`);
    if (b.flag) (ch.progress.flags ||= {})[b.flag] = true;
    if (b.moon) { const F = E.w.flags; F.moon.p = Math.min(140, F.moon.p + b.moon); }
    if (b.sin) { const P = E.prog(ch, 'lib_forbidden'); if (P && !P.done) { if (P.stage < 2) E.advance(s, 'lib_forbidden', 2); E.complete(s, 'lib_forbidden'); } if (ch.level < 60) s.send({ t: 'toast', v: '異端の知識が刻まれた（Lv60で「異端者」に転職できる）' }); }
    checkJobUnlocks(ch, n => this.world.note(s, n)); this.world.sendSelf(s); }
  // main route (called after the existing sinRoute op succeeds)
  onRoute(s) { const E = this.world.events; if (!E.prog(s.ch, 'lib_sins')) E.start(s, 'lib_sins'); this.syncSins(s); }
  syncSins(s) { const E = this.world.events, ch = s.ch, k = ch.progress.sinRoute; const P = E.prog(ch, 'lib_sins'); if (!P || P.done || !k) return; const r = ch.jobs['ev_sinner_' + k]?.rank;
    const st = r == null ? 0 : r >= 8 ? 2 : 1; if (P.stage < st) E.advance(s, 'lib_sins', st); }
  // ── final trial (retryable; failure costs nothing)
  trial(s) { const ch = s.ch, k = ch.progress.sinRoute, err = v => s.send({ t: 'err', v }); if (!k) return err('主ルートを選んでいない'); if ((ch.jobs['ev_sinner_' + k]?.rank ?? -1) < 8) return err(`${SINS[k].name}の罪人の熟練度8が必要`); if (ch.level < 100) return err('Lv100が必要');
    if (Object.keys(ch.jobs).some(j => j.startsWith('ev_bishop_') && j !== 'ev_bishop_' + k)) return err('大罪司教は1キャラクター1系統');
    this.syncSins(s); const P = this.world.events.prog(ch, 'lib_sins'); if (P && !P.done && P.stage < 3) this.world.events.advance(s, 'lib_sins', 3);
    const S = SINS[k]; const dc = makeDuelChar(`試練の影「${S.trial}」`, S.npc[1], ch.level + 5, LOOK); this.bout(s, dc, { kind: 'sintrial', sin: k, title: `最終試練「${S.trial}」` }); }
  // ── succession duel: NPC holders always accept; player holders are fought as their recorded build (AI)
  challenge(s, k) { const ch = s.ch, err = v => s.send({ t: 'err', v }); const S = SINS[k]; if (!S) return; const seat = this.seats[k];
    if (ch.progress.sinRoute !== k) return err(`主ルートが「${S.name}」でなければ挑めない`); if (!ch.jobs['ev_bishop_' + k] && (ch.jobs['ev_sinner_' + k]?.rank ?? -1) < 8) return err(`${S.name}の罪人の熟練度8（または${S.name}の大罪司教）が必要`);
    if (seat.holder.kind === 'player' && seat.holder.id === ch.id) return err('あなたが現職だ'); if ((s.lastSucc || 0) > Date.now() - 60000) return err('呼吸を整えてから挑め（1分）');
    s.lastSucc = Date.now(); let dc;
    if (seat.holder.kind === 'player') { const hc = this.world.sessions.get(seat.holder.id)?.ch || store.loadChar(seat.holder.id); if (!hc) { this.transfer(s, k, '不在'); return; } dc = structuredClone(hc); dc.id = 'succ_' + hc.id;
      this.world.sessions.get(seat.holder.id)?.send({ t: 'toast', v: `${ch.name}が${S.name}の座に継承決闘を挑んだ（あなたの記録された戦い方で迎え撃つ）`, cls: 'big' }); }
    else dc = makeDuelChar(seat.holder.name, seat.holder.wt, Math.max(100, ch.level + 5), LOOK);
    this.bout(s, dc, { kind: 'succession', sin: k, title: `継承決闘「${S.name}の座」`, holder: { ...seat.holder } }); }
  bout(s, dc, o) { const back = s.actor.zone.id; const az = duelArena(this.world, s, `duel:${s.ch.id}`, o.title, back); az.returnField = back; const S = SINS[o.sin];
    const memKey = o.kind === 'succession' ? 'bishop_' + o.sin : 'trial_' + o.sin;
    const f = spawnDuelist(az, dc, { key: memKey, display: o.kind === 'succession' ? `${o.holder.name}（${S.name}の座）` : dc.name, hpMul: o.holder?.kind === 'player' ? 1.5 : S.ai.hp, parry: S.ai.parry, aggression: S.ai.aggression, memo: this.world.duels.mem.tactics(memKey, s.ch.id) });
    const p = az.tileCenter([az.map.w >> 1, Math.round(az.map.h * 0.6)]); s.actor.x = p.x; s.actor.y = p.y; az.bout = { ...o, memKey, sid: s.ch.id, foe: f, wt: s.actor.wt.id }; s.send({ t: 'toast', v: `${o.title}――${S.style}`, cls: 'big' }); }
  onDuelEnd(s, z, b, won) { const ch = s.ch, E = this.world.events, k = b.sin, S = SINS[k];
    if (b.kind === 'sintrial') { if (!won) return; const P = E.prog(ch, 'lib_sins'); if (P && !P.done) { if (P.stage < 4) E.advance(s, 'lib_sins', 4, { silent: true }); E.complete(s, 'lib_sins'); }
      E.grant(s, 'lib_sins', 'trial:' + k, { title: `「${S.trial}」を越えし者`, xp: 60000 }); checkJobUnlocks(ch, n => this.world.note(s, n)); return this.world.duels.leave(s, z, `最終試練「${S.trial}」を越えた`); }
    // succession
    this.hist({ sin: k, by: ch.name, byJob: this.jobName(ch), byWt: WT_BY_ID[b.wt]?.name, vs: b.holder.name, vsKind: b.holder.kind, result: won ? '継承' : '防衛' });
    E.record(s, 'lib_succession', `${S.name}の座への継承決闘：${won ? '勝利・継承' : '敗北'}（相手：${b.holder.name}）`, { clear: won });
    if (!won) return; this.transfer(s, k, '決闘'); this.world.duels.leave(s, z, `${S.name}の座を継承した！`); }
  transfer(s, k, how) { const ch = s.ch, S = SINS[k], seat = this.seats[k], F = this.world.events.w.flags; const old = seat.holder;
    F.formerBishops.push({ ...old, sin: k, until: Date.now(), how }); if (F.formerBishops.length > 100) F.formerBishops.shift();
    seat.holder = { kind: 'player', id: ch.id, name: ch.name, wt: s.actor?.wt?.id ?? null, job: this.jobName(ch) }; seat.since = Date.now();
    // the seat alone grants the bishop job only to a qualified sinner of that sin; trial rewards stay separate
    if (!ch.jobs['ev_bishop_' + k] && !Object.keys(ch.jobs).some(j => j.startsWith('ev_bishop_')) && (ch.jobs['ev_sinner_' + k]?.rank ?? -1) >= 8) { ch.jobs['ev_bishop_' + k] = { rank: 0, xp: 0 }; this.world.note(s, { t: 'jobunlock', job: 'ev_bishop_' + k, n: `大罪司教・${S.name}担当`, tier: '固有職' }); }
    if (!ch.progress.titles.includes(`${S.name}の座を継ぎし者`)) { ch.progress.titles.push(`${S.name}の座を継ぎし者`); this.world.note(s, { t: 'title', v: `${S.name}の座を継ぎし者` }); }
    this.world.events.history('lib_succession', `${ch.name}が${old.name}から${S.name}の座を継承した（${how}）`);
    const os = old.kind === 'player' && this.world.sessions.get(old.id); if (os) os.send({ t: 'toast', v: `${S.name}の座は${ch.name}に継承された。あなたは元大罪司教として名を残す`, cls: 'big' });
    for (const ss of this.world.sessions.values()) ss.send({ t: 'chat', from: '禁書庫', v: `${S.name}の座が${ch.name}に継承された` });
    if (SIN_KEYS.every(x => this.seats[x].holder.kind === 'player')) this.world.events.history('lib_succession', '七つの席が埋まった'); this.world.sendSelf(s); }
  hist(h) { const F = this.world.events.w.flags; F.seatHist.push({ t: Date.now(), ...h }); if (F.seatHist.length > HIST_CAP) F.seatHist.shift(); }
  jobName(ch) { return DATA.jobs.get(ch.job)?.name || ch.job; }
  sealGate(s) { s.send({ t: 'open', service: 'gate', data: { dungeons: ['sealed'], special: true } }); }
  menu(s, m) { switch (m.act) {
    case 'enter': return this.enterArchive(s); case 'read': return this.read(s, m.id, m.page | 0); case 'trial': if (!s.actor.zone.archive) return; return this.trial(s);
    case 'challenge': if (!s.actor.zone.archive) return; return this.challenge(s, m.sin); case 'view': return s.actor.zone.archive ? this.open(s) : this.openLibrary(s); } }
}
