// Black market economy: per-region supply/demand, gradual price movement with caps, history, transactions,
// faction influence, provenance rules, laundering (pawn/appraise/fence), regular-shop and guild buyback channels.
import { REGIONS, LOOT, LOOT_CAT, PROV, FACTIONS } from '../../shared/data/slum.js';
import { clock } from './life.js';
import { hash32, rng } from '../../shared/util.js';

const GUILD_BUY = { artifact: 'ancients', mech: 'magitech', info: 'infobrokers', art: 'jewelers', arcane: 'alchemists', material: 'smiths', guild: 'adventurers', consumable: 'apothecaries', contraband: 'blackmarket' };
const clampPx = (p, b) => Math.max(b * 0.35, Math.min(b * 3, p));
export class Market {
  constructor(saved) {
    this.m = saved?.m || {}; this.tx = saved?.tx || {}; this.influence = saved?.influence || {}; this.news = saved?.news || []; this.lastStep = 0;
    for (const [rid, R] of Object.entries(REGIONS)) {
      this.m[rid] ||= {}; this.tx[rid] ||= [];
      this.influence[rid] ||= Object.fromEntries(R.factions.map(f => [f, f === 'scavs' ? 20 : 40 + (hash32(rid + f) % 30)]));
      for (const [k, it] of Object.entries(LOOT)) { const e = this.m[rid][k] ||= { supply: 1, demand: 1, price: it.v, hist: [], vol: 0, stock: 2 + (hash32(rid + k) % 5) }; e.price ||= it.v; }
    }
  }
  save() { return { m: this.m, tx: Object.fromEntries(Object.entries(this.tx).map(([k, v]) => [k, v.slice(0, 40)])), influence: this.influence, news: this.news.slice(0, 20) }; }
  controller(rid) { const inf = this.influence[rid]; return Object.entries(inf).filter(([f]) => f !== 'scavs').sort((a, b) => b[1] - a[1])[0]?.[0]; }
  base(rid, k) { const it = LOOT[k]; return it.v * (REGIONS[rid].bias[it.cat] || 1); }
  target(rid, k) { const e = this.m[rid][k]; const b = this.base(rid, k); const ctl = FACTIONS[this.controller(rid)]; const fav = ctl?.trade.includes(LOOT[k].cat) ? 0.92 : 1; return clampPx(b * Math.pow(e.demand / Math.max(0.2, e.supply), 0.6) * fav, b); }
  // hourly-ish step (called each game 10 min): prices drift toward target (max 4%), supply/demand relax, history sample
  step() {
    const t = clock(); if (t.total - this.lastStep < 10) return; this.lastStep = t.total;
    for (const [rid] of Object.entries(REGIONS)) for (const [k, e] of Object.entries(this.m[rid])) {
      const tg = this.target(rid, k); const d = tg - e.price; e.price = Math.round(e.price + Math.sign(d) * Math.min(Math.abs(d), e.price * 0.04));
      e.supply += (1 - e.supply) * 0.03; e.demand += (1 - e.demand) * 0.02; e.vol *= 0.9; e.stock = Math.max(0, Math.min(20, e.stock + (Math.random() < 0.1 ? 1 : 0)));
      if (t.minute === 0 || !e.hist.length) { e.hist.push(e.price); if (e.hist.length > 24) e.hist.shift(); }
    }
    if (Math.random() < 0.15) this.demandEvent();
  }
  demandEvent() { const rid = Object.keys(REGIONS)[Math.floor(Math.random() * 6)]; const k = Object.keys(LOOT)[Math.floor(Math.random() * Object.keys(LOOT).length)]; this.m[rid][k].demand = Math.min(3, this.m[rid][k].demand + 0.6); this.addNews(`${REGIONS[rid].name}で「${LOOT[k].name}」の需要が急増しているらしい`); }
  addNews(v) { this.news.unshift({ t: Date.now(), v }); this.news.length = Math.min(20, this.news.length); }
  quote(rid, k, q = 1) { const e = this.m[rid][k]; return { buy: Math.round(e.price * 1.25), sell: Math.round(e.price * 0.8 * q) }; }
  // provenance gates: black market buys all; regular shops only legal/laundered; ruins items pay a little less
  sellPrice(rid, item, channel) {
    const it = LOOT[item.ref]; if (!it) return 0; const q = item.q || 1; const p = item.prov || it.prov;
    if (channel === 'black') return Math.round(this.quote(rid, item.ref, q).sell * (p === 'ruins' ? 0.9 : 1));
    if (channel === 'regular') return ['legal', 'laundered'].includes(p) ? Math.round(it.v * 0.6 * q) : p === 'slum' && it.cat === 'material' ? Math.round(it.v * 0.4 * q) : 0;
    if (channel === 'guild') return ['legal', 'laundered', 'slum'].includes(p) || it.cat === 'contraband' ? Math.round(it.v * 1.3 * q) : 0;
    if (channel === 'fence') return Math.round(this.quote(rid, item.ref, q).sell * 0.9);
    return 0;
  }
  guildFor(ref) { return GUILD_BUY[LOOT[ref]?.cat]; }
  // record a transaction; selling raises supply (price pressure down), buying raises demand/consumes stock
  trade(rid, ref, n, side, price, who) {
    const e = this.m[rid][ref]; const rar = LOOT[ref].r;
    if (side === 'sell') { e.supply = Math.min(4, e.supply + n * 0.06 / rar); e.stock = Math.min(20, e.stock + n); }
    else { e.demand = Math.min(4, e.demand + n * 0.05 / rar); e.stock = Math.max(0, e.stock - n); }
    e.vol += n; this.tx[rid].unshift({ t: Date.now(), ref, n, side, price, who }); this.tx[rid].length = Math.min(40, this.tx[rid].length);
    // immediate slippage so dumping in one go is not free (the drift then continues over time)
    e.price = Math.round(clampPx(e.price * (side === 'sell' ? Math.pow(0.995, n) : Math.pow(1.004, n)), this.base(rid, ref)));
  }
  shift(rid, faction, v) { const inf = this.influence[rid]; if (inf?.[faction] == null) return; inf[faction] = Math.max(0, Math.min(100, inf[faction] + v)); }
  view(rid) {
    const ctl = this.controller(rid);
    return { region: rid, name: REGIONS[rid].name, controller: ctl, ctlName: FACTIONS[ctl]?.name, influence: this.influence[rid], news: this.news.slice(0, 6).map(n => n.v),
      items: Object.entries(this.m[rid]).map(([k, e]) => { const b = Math.round(this.base(rid, k)); const prev = e.hist.at(-2) ?? e.price; const tg = this.target(rid, k); return { k, name: LOOT[k].name, cat: LOOT_CAT[LOOT[k].cat], r: LOOT[k].r, price: e.price, base: b, prev, chg: e.price - prev, pct: Math.round((e.price - prev) / Math.max(1, prev) * 1000) / 10, supply: Math.round(e.supply * 100), demand: Math.round(e.demand * 100), stock: e.stock, vol: Math.round(e.vol * 10) / 10, hist: e.hist, buy: Math.round(e.price * 1.25), sell: Math.round(e.price * 0.8), hint: tg > e.price * 1.05 ? '上昇圧力' : tg < e.price * 0.95 ? '下落圧力' : '横ばい' }; }),
      tx: this.tx[rid].slice(0, 10).map(t => ({ ...t, name: LOOT[t.ref]?.name })) };
  }
}
export { PROV, GUILD_BUY };
