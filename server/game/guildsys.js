// Guild system: membership, conditions, ranks, daily guild quests (templates -> live game events), guild shops,
// reputation with spill-over along ally/rival/enemy relations, and guild events.
import { GUILDS, GUILD_BY_ID, RANKS, RANK_POINTS, ITEMS } from '../../shared/data/guilds.js';
import { CITIES, GOODS } from '../../shared/data/cities.js';
import { DATA, WT_BY_ID } from '../data.js';
import { categoryOf } from '../../shared/data/weaponTypes.js';
import { rng, hash32 } from '../../shared/util.js';
import { clock } from './life.js';
import { grantXp, addItem, checkJobUnlocks } from './progress.js';

const FAM = { elem: ['elemFire', 'elemIce', 'elemThunder', 'wisp'], dark: ['shade', 'zombie', 'skeleton', 'cultist', 'bat'], lizard: ['lizard'], harpy: ['harpy'] };
const BEASTS = ['wolf', 'harpy', 'lizard', 'spider', 'bat', 'rat'];
const day = () => clock().day;
export const rankName = (g, r) => RANKS[g.ranks][Math.min(r, RANKS[g.ranks].length - 1)];

export class Guilds {
  constructor(world) { this.world = world; }
  st(ch, gid) { ch.guilds ||= {}; return ch.guilds[gid]; }
  rep(ch, gid) { ch.rep ||= {}; return ch.rep[gid] || 0; }
  addRep(ch, gid, v) { ch.rep ||= {}; ch.rep[gid] = Math.max(-100, Math.min(100, (ch.rep[gid] || 0) + v)); }
  eventActive(g) { return (hash32(g.id) + day()) % 4 === 0; }
  canJoin(ch, g) {
    const r = []; const J = g.join || {}; const m = ch.guilds || {};
    if (ch.level < (J.level || 1)) r.push(`Lv${J.level}以上`);
    if (J.night) { const h = clock().hour; if (!(h >= 19 || h < 5)) r.push('夜（19時〜5時）にのみ受け付けている'); }
    for (const e of g.rel.enemy) if (m[e]) r.push(`敵対組織「${GUILD_BY_ID[e].name}」に所属している`);
    if (this.rep(ch, g.id) <= -30) r.push('評判が悪すぎる');
    const special = { delvers: () => Object.values(ch.progress.clears || {}).some(c => (c.max || 0) >= 30) || 'いずれかのダンジョン30階踏破', shipping: () => (m.traders?.rank || 0) >= 1 || '貿易商ギルド 手代以上', sages: () => (m.mages?.rank || 0) >= 2 || '魔術師ギルド 研究員以上', assassins: () => (m.thieves?.rank || 0) >= 2 || '盗賊ギルド 刃以上', finance: () => ch.gold >= 10000 || '所持金10,000G以上' }[g.id];
    if (special) { const v = special(); if (v !== true) r.push(v); }
    return r;
  }
  // daily quests for a guild & rank (deterministic per day)
  quests(ch, g) {
    const rank = this.st(ch, g.id)?.rank || 0; const r = rng(hash32(`${g.id}:${day()}:${rank}`)); const out = [];
    const hqFields = CITIES[g.hq]?.fields || ['field_green']; const famPool = [...new Set(hqFields.flatMap(f => (this.world.zones.get(f) && WORLD_FAMS(f)) || []))];
    const pick = a => a[Math.floor(r() * a.length)];
    const dIdx = Math.min(11, rank * 2 + Math.floor(r() * 2)); const dun = DATA.dungeonList[dIdx];
    for (let i = 0; i < 3; i++) {
      const tpl = g.quests[(i + Math.floor(r() * 3)) % g.quests.length]; const [kind, arg] = tpl.split(':'); const id = `${g.id}_${day()}_${rank}_${i}`; const k = rank + 1;
      let q;
      if (kind === 'kill') { const f = pick(famPool.length ? famPool : ['slime']); q = { kind: 'kill', fam: f, n: 5 + rank * 3, desc: `${DATA.families.get(f)?.name}を${5 + rank * 3}体討伐` }; }
      else if (kind === 'killBeast') { const f = pick(BEASTS); q = { kind: 'kill', fam: f, n: 6 + rank * 3, desc: `魔獣「${DATA.families.get(f).name}」を${6 + rank * 3}体狩る` }; }
      else if (kind === 'killFam') { const f = pick(FAM[arg] || famPool.length && famPool || ['slime']); q = { kind: 'kill', fam: f, n: 5 + rank * 2, desc: `${DATA.families.get(f)?.name}を${5 + rank * 2}体討伐（調査用）` }; }
      else if (kind === 'killElite') q = { kind: 'elite', n: 2 + rank, desc: `精鋭モンスターを${2 + rank}体討伐` };
      else if (kind === 'floor') q = { kind: 'floor', dungeon: dun.id, floor: 5 + rank * 8, desc: `${dun.name}の${5 + rank * 8}階に到達` };
      else if (kind === 'boss') { const fl = 10 * (1 + Math.min(4, rank)); q = { kind: 'boss', dungeon: dun.id, floor: fl, desc: `${dun.name}${fl}階のボスを撃破` }; }
      else if (kind === 'gather') { const n = 3 + rank * 2; q = { kind: 'gather', mat: arg, n, desc: `${ITEMS[arg].name}を${n}個納品` }; }
      else if (kind === 'deliver') { const goods = Object.keys(GOODS); const gd = pick(goods); const dests = [g.hq, ...g.branches].filter(c => !CITIES[c].goods.produce.includes(gd)); const to = pick(dests.length ? dests : [g.hq]); const n = 3 + rank * 2; q = { kind: 'deliver', good: gd, to, n, desc: `${GOODS[gd].name}を${n}個、${CITIES[to].name}の${g.name}へ届ける` }; }
      else if (kind === 'craft') q = { kind: 'craft', n: 1 + rank, desc: `鍛冶場で武具を${1 + rank}本鍛造する` };
      else if (kind === 'fund') { const amt = 400 * k * k; q = { kind: 'fund', gold: amt, desc: `活動資金として${amt.toLocaleString()}Gを寄付` }; }
      else if (kind === 'arena') q = { kind: 'arena', n: 1 + Math.floor(rank / 2), desc: `闘技場で${1 + Math.floor(rank / 2)}勝する` };
      else { const cs = Object.keys(CITIES).filter(c => c !== g.hq); const c = pick(cs); q = { kind: 'visit', city: c, desc: `${CITIES[c].name}を訪れて現地の様子を報告` }; }
      const mult = this.eventActive(g) ? 1.3 : 1;
      out.push({ id, guild: g.id, ...q, reward: { pts: Math.round((q.kind === 'fund' ? 8 : 12) + rank * 5), gold: Math.round(250 * Math.pow(k, 1.6) * mult), xp: Math.round(180 * Math.pow(k, 1.9) * mult) } });
    }
    return out;
  }
  shop(ch, g) {
    const st = this.st(ch, g.id); const rank = st?.rank || 0; const disc = 1 - Math.min(0.25, Math.max(0, this.rep(ch, g.id)) / 400) - rank * 0.02;
    const r = rng(hash32(g.id + ':shop:' + day())); const out = [];
    for (const e of g.shop) {
      const [k, arg] = e.split(':');
      if (ITEMS[k]) out.push({ kind: 'item', ref: k, name: ITEMS[k].name, desc: ITEMS[k].desc, price: Math.round(ITEMS[k].price * disc), rank: 0 });
      else if (k === 'weapons') { const cat = arg; const pool = [...DATA.weapons.values()].filter(w => !WT_BY_ID[w.wt].myth && w.rar <= 2 + rank && w.rar >= 2 && (cat === 'any' || categoryOf(w.wt).id === cat || (cat === 'instrument' && w.wt === 75))); for (let i = 0; i < 4 && pool.length; i++) { const w = pool[Math.floor(r() * pool.length)]; out.push({ kind: 'weapon', ref: w.id, name: w.name, desc: `${WT_BY_ID[w.wt].name} Lv${w.lvl}`, price: Math.round(w.price * 0.9 * disc), rank: 1, rar: w.rar }); } }
      else if (k === 'armor' || k === 'accessory') out.push({ kind: 'armorpiece', slot: k, tier: Math.min(9, 2 + rank), name: k === 'armor' ? 'ギルド製の鎧' : 'ギルド製の護符', desc: `Tier${Math.min(9, 2 + rank)}`, price: Math.round(200 * Math.pow(2.2, Math.min(9, 2 + rank)) * disc), rank: 1 });
      else if (k.endsWith('Good')) { const gd = k.replace('Good', ''); out.push({ kind: 'good', ref: gd, name: GOODS[gd].name + '（卸値）', desc: '交易品', price: Math.round(GOODS[gd].base * 0.7 * disc), rank: 1 }); }
      else if (k === 'furniture') out.push({ kind: 'service', ref: 'furniture', name: '家具カタログ', desc: '自宅に置ける家具を購入', price: 0, rank: 0 });
      else if (k === 'info' || k === 'outfit') out.push({ kind: 'service', ref: k, name: k === 'info' ? '情報を買う' : '衣装の仕立て', desc: '', price: 0, rank: 0 });
    }
    return out;
  }
  view(ch, g) {
    const st = this.st(ch, g.id); const rk = st?.rank || 0;
    return { id: g.id, name: g.name, cat: g.cat, ideal: g.ideal, activity: g.activity, hq: CITIES[g.hq].name, branches: g.branches.map(c => CITIES[c].name), size: g.size, leader: g.leader, officers: g.officers || [], facility: g.facility, event: g.event, eventActive: this.eventActive(g),
      member: !!st, rank: rk, rankName: rankName(g, rk), ranks: RANKS[g.ranks], pts: st?.pts || 0, next: RANK_POINTS[rk + 1] ?? null, rep: this.rep(ch, g.id), joinCond: g.join, joinBlock: st ? [] : this.canJoin(ch, g),
      rel: Object.fromEntries(Object.entries(g.rel).map(([k, v]) => [k, v.map(x => GUILD_BY_ID[x].name)])), quests: st ? this.quests(ch, g) : [], active: Object.values(ch.gquests || {}).filter(q => q.guild === g.id), shop: this.shop(ch, g) };
  }
  open(s, gid) { const g = GUILD_BY_ID[gid]; if (!g) return; s.send({ t: 'open', service: 'guild', data: this.view(s.ch, g) }); }
  menu(s, m) {
    const ch = s.ch, g = GUILD_BY_ID[m.gid]; if (!g) return; const err = v => s.send({ t: 'err', v }); const st = this.st(ch, g.id);
    const here = s.actor.zone; const atGuild = here.kind === 'interior' && here.map.npcs.some(n => n.guild === g.id);
    if (!atGuild && m.act !== 'leave') return err('ギルドの窓口で手続きしてください');
    switch (m.act) {
      case 'join': { if (st) return; const b = this.canJoin(ch, g); if (b.length) return err('加入条件: ' + b.join(' / ')); ch.guilds[g.id] = { rank: 0, pts: 0, done: 0, joined: Date.now() }; this.addRep(ch, g.id, 5); for (const e of g.rel.enemy) this.addRep(ch, e, -10); this.world.note(s, { t: 'msg', v: `${g.name}に加入した` }); break; }
      case 'leave': { if (!st) return; delete ch.guilds[g.id]; this.addRep(ch, g.id, -15); break; }
      case 'accept': { if (!st) return err('メンバーのみ受注できます'); const q = this.quests(ch, g).find(x => x.id === m.id); if (!q) return; ch.gquests ||= {}; if (ch.gquests[q.id]) return; if (Object.keys(ch.gquests).length >= 10) return err('ギルド依頼は同時に10件まで'); ch.gquests[q.id] = { ...q, prog: 0 }; break; }
      case 'turnin': {
        const q = ch.gquests?.[m.id]; if (!q || q.guild !== g.id) return;
        if (q.kind === 'gather') { const it = ch.inventory.find(i => i.kind === 'mat' && i.ref === q.mat); if (!it || it.n < q.n) return err(`${ITEMS[q.mat].name}が${q.n}個必要です`); it.n -= q.n; if (it.n <= 0) ch.inventory = ch.inventory.filter(x => x !== it); }
        else if (q.kind === 'fund') { if (ch.gold < q.gold) return err('ゴールドが足りません'); ch.gold -= q.gold; }
        else if (q.kind === 'deliver') { if (here.cityId !== q.to) return err(`${CITIES[q.to].name}の窓口に届けてください`); ch.cargo ||= {}; if ((ch.cargo[q.good] || 0) < q.n) return err(`${GOODS[q.good].name}が${q.n}個必要です（交易所で仕入れ）`); ch.cargo[q.good] -= q.n; }
        else if ((q.prog || 0) < (q.n || 1)) return err('まだ達成していません');
        delete ch.gquests[q.id]; this.reward(s, g, q); break;
      }
      case 'abandon': if (ch.gquests?.[m.id]) delete ch.gquests[m.id]; break;
      case 'buy': {
        if (!st) return err('メンバー専用ショップです'); const it = this.shop(ch, g)[m.i | 0]; if (!it) return; if ((st.rank || 0) < it.rank) return err(`ランク「${rankName(g, it.rank)}」以上で購入できます`);
        if (it.kind === 'service') return this.world.openService(s, it.ref);
        if (ch.gold < it.price) return err('ゴールドが足りません'); ch.gold -= it.price;
        if (it.kind === 'item') addItem(ch, { kind: ITEMS[it.ref].mat ? 'mat' : 'potion', ref: it.ref, n: 1 }, n => this.world.note(s, n));
        else if (it.kind === 'weapon') addItem(ch, { kind: 'weapon', ref: it.ref, plus: 0 }, n => this.world.note(s, n));
        else if (it.kind === 'armorpiece') addItem(ch, { kind: 'armor', slot: it.slot, tier: it.tier, plus: 0 }, n => this.world.note(s, n));
        else if (it.kind === 'good') { ch.cargo ||= {}; const cap = this.world.econ.cargoCap(ch); const tot = Object.values(ch.cargo).reduce((a, b) => a + b, 0); if (tot >= cap) { ch.gold += it.price; return err('積荷がいっぱいです'); } ch.cargo[it.ref] = (ch.cargo[it.ref] || 0) + 1; }
        break;
      }
    }
    this.world.sendSelf(s); this.open(s, g.id);
  }
  reward(s, g, q) {
    const ch = s.ch; const st = ch.guilds[g.id]; const R = q.reward;
    ch.gold += R.gold; grantXp(ch, R.xp, n => this.world.note(s, n)); st.pts += R.pts; st.done++;
    this.addRep(ch, g.id, 5); for (const a of g.rel.ally) this.addRep(ch, a, 2); for (const r of g.rel.rival) this.addRep(ch, r, -1); for (const e of g.rel.enemy) this.addRep(ch, e, -3);
    while (RANK_POINTS[st.rank + 1] != null && st.pts >= RANK_POINTS[st.rank + 1] && st.rank < RANKS[g.ranks].length - 1 && ch.level >= st.rank * 10) { st.rank++; this.world.note(s, { t: 'title', v: `${g.name} ${rankName(g, st.rank)}` }); ch.progress.titles.push(`${g.name}・${rankName(g, st.rank)}`); }
    this.world.note(s, { t: 'quest', v: `ギルド依頼達成：${q.desc}（+${R.gold}G / 貢献${R.pts}）` });
    checkJobUnlocks(ch, n => this.world.note(s, n));
  }
  // progress from live game events
  event(s, ev) {
    const qs = s.ch.gquests; if (!qs) return;
    for (const q of Object.values(qs)) {
      if (q.kind === 'kill' && ev.kind === 'kill' && ev.fam === q.fam) q.prog++;
      else if (q.kind === 'elite' && ev.kind === 'kill' && ev.elite) q.prog++;
      else if ((q.kind === 'floor' || q.kind === 'boss') && ev.kind === q.kind && ev.dungeon === q.dungeon && ev.floor >= q.floor) q.prog = 1;
      else if (q.kind === 'craft' && ev.kind === 'craft') q.prog++;
      else if (q.kind === 'arena' && ev.kind === 'arena') q.prog++;
      else if (q.kind === 'visit' && ev.kind === 'visit' && ev.city === q.city) q.prog = 1;
      else continue;
      if ((q.prog || 0) >= (q.n || 1) && !q.noted) { q.noted = true; this.world.note(s, { t: 'quest', v: `ギルド依頼「${q.desc}」達成！ ギルド窓口で報告しよう` }); }
    }
  }
}
import { WORLD } from './maps.js';
const WORLD_FAMS = f => (WORLD[f]?.fams || []).flat();
export { GUILDS };
