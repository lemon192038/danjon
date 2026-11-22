// City economy & life services: travel, in-city stops, trade market with regional supply/logistics, real estate & homes,
// player shops, bank, casino (in-game gold only), arena, black market, info broker, tailoring, furniture, crafting,
// gathering nodes, citizen requests, city stories. All state is server-side.
import { CITIES, GOODS, ROUTES, TRANSPORT, WEATHER } from '../../shared/data/cities.js';
import { GUILD_BY_ID, ITEMS } from '../../shared/data/guilds.js';
import { DATA, WT_BY_ID } from '../data.js';
import { categoryOf } from '../../shared/data/weaponTypes.js';
import { clock, isOpen } from './life.js';
import { HOME_TPL, genInterior } from './city.js';
import { Zone } from './zone.js';
import { makeMonster } from './monsters.js';
import { addItem, grantXp, uid } from './progress.js';
import { armorDef } from '../../shared/formulas.js';
import { STORIES, LORE, INFO } from './stories.js';
import { hash32, rng } from '../../shared/util.js';

export const HOME_PRICE = [800, 6000, 25000, 80000, 250000, 900000];
export const FURNITURE = {
  rug: { name: '織物の絨毯', price: 300 }, plantpot: { name: '観葉植物', price: 200 }, bookcase: { name: '本棚', price: 600 }, sofa: { name: 'ソファ', price: 900 }, table: { name: '食卓', price: 500 },
  painting: { name: '風景画', price: 1200 }, statue: { name: '小さな彫像', price: 2500 }, chandelier: { name: 'シャンデリア', price: 4000 }, piano: { name: 'ピアノ', price: 8000 }, aquarium: { name: '水槽', price: 3000 },
  globe: { name: '天球儀', price: 2000 }, trophy: { name: '魔物の剥製', price: 1500 }, banner: { name: 'ギルド旗', price: 700 }, fireplace: { name: '暖炉', price: 3500 }, crystal: { name: '魔晶灯', price: 5000 },
};
const DTYPE_TIER = { slum: 0, common: 1, commerce: 2, rich: 3 };
const WEALTH = { slum: 0.6, common: 1, commerce: 1.3, rich: 1.6, special: 1 };
const MATS = { beast: 'hide', flyer: 'hide', bug: 'hide', plant: 'herb', golem: 'gem', spirit: 'crystal', undead: 'relic', demon: 'relic', blob: 'herb', humanoid: 'hide', angel: 'crystal' };

export class Econ {
  constructor(world, saved) {
    this.world = world; this.supply = saved?.supply || {}; this.cityState = saved?.cityState || {}; this.news = saved?.news || []; this.lastHour = -1;
    for (const c of Object.keys(CITIES)) { this.supply[c] ||= {}; for (const g of Object.keys(GOODS)) this.supply[c][g] ??= 1; }
    this.services = {
      travel: (s, z) => this.openTravel(s, z), trade: (s, z) => this.openTrade(s, z), realty: (s, z) => this.openRealty(s, z), bank: s => this.openBank(s), casino: s => s.send({ t: 'open', service: 'casino', data: { gold: s.ch.gold } }),
      arena: (s, z) => s.send({ t: 'open', service: 'arena', data: { city: z.cityId, rank: s.ch.guilds?.gladiators?.rank || 0, wins: s.ch.progress.arenaWins || 0 } }), blackmarket: (s, z) => this.openBlack(s, z),
      info: s => s.send({ t: 'open', service: 'info', data: { price: 300 } }), outfit: s => s.send({ t: 'open', service: 'outfit', data: { price: 500, look: s.ch.look } }), furniture: s => s.send({ t: 'open', service: 'furniture', data: { list: FURNITURE, owned: s.ch.furniture || {} } }),
      story: (s, z, npc) => this.openStory(s, npc?.story || z.cityId), myshop: (s, z) => this.openMyShop(s, z),
    };
  }
  saveState() { return { supply: this.supply, cityState: this.cityState, news: this.news.slice(0, 30) }; }
  addNews(v) { this.news.unshift({ t: Date.now(), v }); this.news.length = Math.min(this.news.length, 30); }
  flag(city) { return this.cityState[city]?.flag || null; }
  priceMod(city) { const f = this.flag(city); return f === 'regent' ? 1.1 : 1; }
  cargoCap(ch) { return 20 + (ch.guilds?.traders?.rank || 0) * 5 + (ch.guilds?.merchants?.rank || 0) * 3 + (ch.guilds?.transport?.rank || 0) * 5; }
  goodPrice(city, g) { const c = CITIES[city]; const base = GOODS[g].base * (c.goods.produce.includes(g) ? 0.6 : c.goods.demand.includes(g) ? 1.45 : 1) * this.priceMod(city); let m = 1; if (city === 'marina' && this.flag('marina') === 'freeport') m = 0.9; if ((g === 'ore' || g === 'steel') && this.flag('vulcan') === 'boom') m *= 0.7; return Math.max(5, Math.round(base * m / Math.sqrt(Math.max(0.35, this.supply[city][g])))); }
  // ── hourly simulation: supply recovery, production, caravans (logistics), player shop sales, rent
  hourly() {
    const t = clock(); if (t.hour === this.lastHour) return; this.lastHour = t.hour;
    for (const [c, def] of Object.entries(CITIES)) for (const g of Object.keys(GOODS)) { let s = this.supply[c][g]; const target = def.goods.produce.includes(g) ? 1.4 : def.goods.demand.includes(g) ? 0.7 : 1; s += (target - s) * 0.08; this.supply[c][g] = Math.round(s * 1000) / 1000; }
    if (Math.random() < 0.6) { const [a, b, mode] = ROUTES[Math.floor(Math.random() * ROUTES.length)]; const from = Math.random() < 0.5 ? a : b, to = from === a ? b : a; const g = CITIES[from].goods.produce[Math.floor(Math.random() * CITIES[from].goods.produce.length)]; const wx = this.world.life.weatherOf(from); if (TRANSPORT[mode].stormBlocked && wx === 'storm') this.addNews(`${CITIES[from].name}は嵐のため${TRANSPORT[mode].name}が欠航`); else { this.supply[to][g] = Math.min(2.5, this.supply[to][g] + 0.25); this.supply[from][g] = Math.max(0.35, this.supply[from][g] - 0.1); this.addNews(`${TRANSPORT[mode].name}で${CITIES[from].name}の${GOODS[g].name}が${CITIES[to].name}へ到着`); } }
    for (const s of this.world.sessions.values()) if (s.ch) { this.simShops(s.ch, 1); this.chargeRent(s); }
  }
  // ── travel
  openTravel(s, z) {
    const city = z.cityId; const wx = this.world.life.weatherOf(city);
    const routes = ROUTES.filter(r => r[0] === city || r[1] === city).map(([a, b, mode, min, fee]) => ({ to: a === city ? b : a, toName: CITIES[a === city ? b : a].name, mode, modeName: TRANSPORT[mode].name, min, fee, blocked: TRANSPORT[mode].stormBlocked && (wx === 'storm' || this.world.life.weatherOf(a === city ? b : a) === 'storm') }));
    s.send({ t: 'open', service: 'travel', data: { city, cityName: CITIES[city].name, routes, weather: WEATHER[wx] } });
  }
  travel(s, to) {
    const z = s.actor.zone; const r = ROUTES.find(x => (x[0] === z.cityId && x[1] === to) || (x[1] === z.cityId && x[0] === to)); if (!r) return this.err(s, 'その路線はありません');
    const [, , mode, min, fee] = r; if (TRANSPORT[mode].stormBlocked && (this.world.life.weatherOf(z.cityId) === 'storm' || this.world.life.weatherOf(to) === 'storm')) return this.err(s, '嵐のため欠航しています');
    if (s.ch.gold < fee) return this.err(s, 'ゴールドが足りません'); s.ch.gold -= fee;
    s.send({ t: 'loading', v: `${TRANSPORT[mode].name}で${CITIES[to].name}へ（所要${min}分）`, mode, ms: 1200 + min * 12 });
    setTimeout(() => { if (!s.actor) return; const cz = this.world.zones.get(to); const st = cz.map.doors.find(d => d.svc === 'travel'); this.world.enterZone(s, cz, st ? cz.tileCenter([st.x, st.y + 2]) : null); }, 1200 + min * 12);
  }
  stop(s, district) { const z = s.actor.zone; const p = z.map.plazas.find(x => x.district === district); if (!p) return; if (s.ch.gold < 10) return this.err(s, '運賃10Gが必要です'); s.ch.gold -= 10; s.send({ t: 'loading', v: `${p.name}へ`, ms: 700 }); setTimeout(() => { if (s.actor?.zone === z) { const c = z.tileCenter([p.x, p.y + 2]); s.actor.x = c.x; s.actor.y = c.y; this.world.enterZone(s, z, c); } }, 700); }
  // ── trade
  openTrade(s, z) { const city = z.cityId; const list = Object.keys(GOODS).map(g => ({ g, name: GOODS[g].name, buy: this.goodPrice(city, g), sell: Math.round(this.goodPrice(city, g) * 0.9), local: CITIES[city].goods.produce.includes(g) ? '特産' : CITIES[city].goods.demand.includes(g) ? '需要大' : '' })); s.send({ t: 'open', service: 'trade', data: { city, cityName: CITIES[city].name, list, cargo: s.ch.cargo || {}, cap: this.cargoCap(s.ch), news: this.news.slice(0, 6).map(n => n.v) } }); }
  trade(s, g, n, sell) {
    const z = s.actor.zone; const city = z.cityId; if (!GOODS[g]) return; n = Math.max(1, Math.min(20, n | 0)); const ch = s.ch; ch.cargo ||= {}; let total = 0;
    for (let i = 0; i < n; i++) {
      if (sell) { if (!(ch.cargo[g] > 0)) break; const p = Math.round(this.goodPrice(city, g) * 0.9); ch.cargo[g]--; ch.gold += p; total += p; this.supply[city][g] = Math.min(2.5, this.supply[city][g] + 0.05); }
      else { const tot = Object.values(ch.cargo).reduce((a, b) => a + b, 0); if (tot >= this.cargoCap(ch)) break; const p = this.goodPrice(city, g); if (ch.gold < p) break; ch.gold -= p; ch.cargo[g] = (ch.cargo[g] || 0) + 1; total += p; this.supply[city][g] = Math.max(0.35, this.supply[city][g] - 0.05); }
    }
    this.world.sendSelf(s); this.openTrade(s, z); if (total) s.send({ t: 'toast', v: `${sell ? '売却' : '購入'} ${total.toLocaleString()}G` });
  }
  // ── real estate & homes
  properties(city) { const z = this.world.zones.get(city); return z.map.doors.filter(d => d.home).map(d => { let tier = DTYPE_TIER[d.dtype] ?? 1; if (d.dtype === 'rich' && hash32(d.id) % 3 === 0) tier = 4; if (d.dtype === 'rich' && (city === 'celestia' || city === 'lumina') && d.id.endsWith('_0')) tier = 5; const mul = { haven: 0.8, marina: 1.1, celestia: 1.4, vulcan: 1, arcanum: 1.1, lumina: 1.3 }[city]; const price = Math.round(HOME_PRICE[tier] * mul); return { bldg: d.id, district: d.district, dtype: d.dtype, tier, tierName: HOME_TPL[tier].name, price, rent: Math.max(20, Math.round(price / 60)), storage: HOME_TPL[tier].storage, slots: HOME_TPL[tier].slots }; }); }
  openRealty(s, z) { const city = z.cityId; const mine = (s.ch.homes || []).filter(h => h.city === city); s.send({ t: 'open', service: 'realty', data: { city, cityName: CITIES[city].name, list: this.properties(city).map(p => ({ ...p, district: CITIES[city].districts.find(d => d.id === p.district)?.name, owned: mine.find(h => h.bldg === p.bldg) || null })), day: clock().day, shops: (s.ch.shops || []).filter(x => x.city === city) } }); }
  realty(s, m) {
    const ch = s.ch, city = s.actor.zone.cityId; const p = this.properties(city).find(x => x.bldg === m.bldg); if (!p) return; ch.homes ||= []; ch.shops ||= [];
    const owned = ch.homes.find(h => h.city === city && h.bldg === p.bldg);
    if (m.act === 'buy' || m.act === 'rent') {
      if (owned) return this.err(s, '既に契約済みです'); if (ch.homes.length >= 4) return this.err(s, '物件は4件まで所有できます');
      if (m.use === 'shop' && p.dtype !== 'commerce' && p.dtype !== 'common') return this.err(s, '店舗にできるのは商業区・庶民区の物件だけです');
      const cost = m.act === 'buy' ? p.price : p.rent * 7; if (ch.gold < cost) return this.err(s, `${cost.toLocaleString()}Gが必要です`); ch.gold -= cost;
      ch.homes.push({ city, bldg: p.bldg, tier: p.tier, mode: m.act, until: m.act === 'rent' ? clock().day + 7 : null, use: m.use === 'shop' ? 'shop' : 'home' });
      if (m.use === 'shop') ch.shops.push({ city, bldg: p.bldg, name: `${ch.name}の店`, stock: [], till: 0, sales: 0, rep: 0, staff: 0, hours: [9, 21], last: clock().total });
      this.world.note(s, { t: 'msg', v: `${p.tierName}を${m.act === 'buy' ? '購入' : '賃貸契約'}した（${m.use === 'shop' ? '店舗' : '自宅'}）` });
    } else if (m.act === 'renew' && owned?.mode === 'rent') { const cost = p.rent * 7; if (ch.gold < cost) return this.err(s, 'ゴールドが足りません'); ch.gold -= cost; owned.until += 7; }
    else if (m.act === 'release' && owned) { ch.homes = ch.homes.filter(h => h !== owned); ch.shops = ch.shops.filter(x => !(x.city === city && x.bldg === p.bldg)); if (owned.mode === 'buy') { ch.gold += Math.round(p.price * 0.6); } }
    this.world.sendSelf(s); this.openRealty(s, s.actor.zone);
  }
  chargeRent(s) { const ch = s.ch; const d = clock().day; for (const h of ch.homes || []) if (h.mode === 'rent' && h.until < d) { h.evicted = true; } const ev = (ch.homes || []).filter(h => h.evicted); if (ev.length) { ch.homes = ch.homes.filter(h => !h.evicted); ch.shops = (ch.shops || []).filter(x => ev.every(e => !(e.city === x.city && e.bldg === x.bldg))); this.world.note(s, { t: 'msg', v: '家賃の期限が切れた物件の契約が終了した' }); } }
  // home decoration: furniture slots + weapon/armor displays become props of the home interior
  decorate(z, ch) {
    const own = (ch.homes || []).find(h => h.city === z.cityId && h.bldg === z.bldgId); if (!own) return; const isShop = own.use === 'shop';
    const base = genInterior(...z.genArgs);
    const map = z.map; map.props = base.props.slice(); map.tiles = base.tiles.slice(); map.objects = base.objects.slice();
    const W = map.w, H = map.h; const slots = [];
    for (let y = 3; y < H - 3; y += 2) for (let x = 2; x < W - 2; x += 3) if (map.tiles[y * W + x] !== 22 && map.tiles[y * W + x] !== 29 && Math.abs(x - (W >> 1)) > 1) slots.push([x, y]);
    const furn = (ch.homeFurn ||= {})[z.bldgId] || [];
    furn.forEach((k, i) => { const p = slots[i]; if (!p || !FURNITURE[k]) return; map.props.push({ k: k === 'plantpot' ? 'plant' : k === 'rug' ? 'carpetrun' : k, x: p[0], y: p[1], w: 1, h: 1, furn: 1 }); if (k !== 'rug') map.tiles[p[1] * W + p[0]] = 22; });
    const disp = (ch.homeDisplay ||= {})[z.bldgId] || [];
    disp.forEach((u, i) => { const it = ch.inventory.find(x => x.uid === u) || (ch.storage || []).find(x => x.uid === u); if (!it) return; const x = 2 + i * 2; if (x >= W - 2) return; map.props.push({ k: 'weaponstand', x, y: 2, w: 1, h: 1, wt: it.kind === 'weapon' ? DATA.weapons.get(it.ref)?.wt : null, rar: it.kind === 'weapon' ? DATA.weapons.get(it.ref)?.rar : 1, armor: it.kind === 'armor' ? 1 : 0 }); map.tiles[2 * W + x] = 22; });
    if (isShop) { const sh = ch.shops.find(x => x.city === z.cityId && x.bldg === z.bldgId); map.objects.push({ k: 'myshop', x: W >> 1, y: 4 }); sh?.stock.slice(0, 8).forEach((st, i) => map.props.push({ k: 'display', x: 2 + (i % 4) * 3, y: 6 + Math.floor(i / 4) * 2, w: 1, h: 1 })); }
    map.slots = slots.length;
  }
  home(s, m) {
    const ch = s.ch, z = s.actor.zone; if (!z.home || z.home.owner !== ch.id) return this.err(s, '自宅の中で操作してください');
    ch.storage ||= []; ch.homeFurn ||= {}; ch.homeDisplay ||= {}; ch.furniture ||= {};
    const tier = HOME_TPL[z.home.tier] || HOME_TPL[0];
    if (m.act === 'deposit') { const it = ch.inventory.find(i => i.uid === m.uid); if (!it || Object.values(ch.equip).includes(it.uid)) return this.err(s, '装備中は預けられません'); if (ch.storage.length >= tier.storage) return this.err(s, '保管庫がいっぱいです'); ch.inventory = ch.inventory.filter(i => i !== it); ch.storage.push(it); }
    else if (m.act === 'withdraw') { const it = ch.storage.find(i => i.uid === m.uid); if (!it) return; ch.storage = ch.storage.filter(i => i !== it); ch.inventory.push(it); }
    else if (m.act === 'place') { const k = m.k; if (!(ch.furniture[k] > 0)) return this.err(s, '家具を持っていません'); const list = ch.homeFurn[z.bldgId] ||= []; if (list.length >= tier.slots) return this.err(s, '置き場所がありません'); list.push(k); ch.furniture[k]--; }
    else if (m.act === 'remove') { const list = ch.homeFurn[z.bldgId] || []; const k = list.splice(m.i | 0, 1)[0]; if (k) ch.furniture[k] = (ch.furniture[k] || 0) + 1; }
    else if (m.act === 'display') { const list = ch.homeDisplay[z.bldgId] ||= []; if (list.includes(m.uid)) ch.homeDisplay[z.bldgId] = list.filter(u => u !== m.uid); else { if (list.length >= tier.display) return this.err(s, '展示台がいっぱいです'); list.push(m.uid); } }
    else if (m.act === 'rest') { const a = s.actor; a.hp = a.maxHp; a.sp = a.maxSp; a.addBuff({ xp: 0.1, regen: 0.004 }, 30 * 60000, 'rested'); ch.mods ||= {}; this.world.note(s, { t: 'msg', v: 'ぐっすり眠った。HP・SP全回復、30分間 経験値+10%' }); }
    else if (m.act === 'cook') { const h = ch.inventory.find(i => i.ref === 'herb'), d = ch.inventory.find(i => i.ref === 'hide'); if (!(h?.n >= 2) || !(d?.n >= 1)) return this.err(s, '薬草2つと魔獣の皮1つが必要です'); h.n -= 2; d.n -= 1; ch.inventory = ch.inventory.filter(i => !(i.kind === 'mat' && i.n <= 0)); addItem(ch, { kind: 'potion', ref: 'meal', n: 2 }, n => this.world.note(s, n)); }
    this.decorate(z, ch); this.world.sendSelf(s); s.send({ t: 'homeRefresh', props: z.map.props, tiles: Buffer.from(z.map.tiles).toString('base64') }); this.openHome(s);
  }
  openHome(s) { const ch = s.ch, z = s.actor.zone; if (!z.home) return; const tier = HOME_TPL[z.home.tier]; s.send({ t: 'open', service: 'home', data: { tierName: tier.name, storage: ch.storage || [], cap: tier.storage, slots: tier.slots, display: tier.display, furn: (ch.homeFurn || {})[z.bldgId] || [], shown: (ch.homeDisplay || {})[z.bldgId] || [], owned: ch.furniture || {}, catalog: FURNITURE } }); }
  buyFurniture(s, k) { const f = FURNITURE[k]; if (!f) return; if (s.ch.gold < f.price) return this.err(s, 'ゴールドが足りません'); s.ch.gold -= f.price; s.ch.furniture ||= {}; s.ch.furniture[k] = (s.ch.furniture[k] || 0) + 1; this.world.sendSelf(s); s.send({ t: 'toast', v: `${f.name}を購入した（自宅で配置できます）` }); }
  // ── player shops
  fairPrice(st) { if (st.kind === 'weapon') return Math.round((DATA.weapons.get(st.ref)?.price || 100) * 0.8); if (st.kind === 'armor') return Math.round(150 * Math.pow(2.2, st.tier || 0)); return ITEMS[st.ref]?.price || GOODS[st.ref]?.base || 50; }
  simShops(ch, hours) {
    for (const sh of ch.shops || []) {
      const def = CITIES[sh.city]; const dtype = this.world.zones.get(sh.city)?.map.doors.find(d => d.id === sh.bldg)?.dtype || 'common'; const t = clock();
      for (let h = 0; h < hours; h++) {
        const hour = (t.hour - h + 24) % 24; if (!isOpen(sh.hours, hour)) continue;
        for (const st of sh.stock) {
          if (st.n <= 0) continue; const fair = this.fairPrice(st); const ratio = st.price / fair; const pf = Math.max(0.03, Math.min(1.5, 1.6 - ratio));
          const p = 0.35 * (1 + sh.staff * 0.5) * WEALTH[dtype] * pf * (1 + sh.rep / 100) * (this.world.life.weatherOf(sh.city) === 'rain' ? 0.8 : 1);
          if (Math.random() < p) { st.n--; sh.till += st.price; sh.sales++; sh.rep = Math.max(-50, Math.min(100, sh.rep + (ratio <= 1.2 ? 1 : -1))); }
        }
        sh.stock = sh.stock.filter(x => x.n > 0);
      }
      if (t.day !== sh.wageDay) { sh.wageDay = t.day; sh.till -= sh.staff * 100; }
      sh.rank = Math.floor(Math.log2(sh.sales / 20 + 1)); sh.last = t.total; void def;
    }
  }
  catchUp(ch) { const t = clock(); for (const sh of ch.shops || []) { const hrs = Math.min(48, Math.floor((t.total - (sh.last || t.total)) / 60)); if (hrs > 0) this.simShops({ shops: [sh] }, hrs); } }
  openMyShop(s, z) { const sh = (s.ch.shops || []).find(x => x.city === z.cityId && x.bldg === z.bldgId); if (!sh) return this.err(s, 'あなたの店ではありません'); s.send({ t: 'open', service: 'myshop', data: { ...sh, fair: sh.stock.map(st => this.fairPrice(st)) } }); }
  myshop(s, m) {
    const ch = s.ch, z = s.actor.zone; const sh = (ch.shops || []).find(x => x.city === z.cityId && x.bldg === z.bldgId); if (!sh) return this.err(s, '自分の店の中で操作してください');
    if (m.act === 'stock') { const it = ch.inventory.find(i => i.uid === m.uid); if (!it || Object.values(ch.equip).includes(it.uid)) return this.err(s, '装備中の品は並べられません'); if (sh.stock.length >= 12) return this.err(s, '陳列棚がいっぱいです'); const n = it.n ? Math.min(it.n, m.n | 0 || it.n) : 1; const st = { kind: it.kind, ref: it.ref, tier: it.tier, slot: it.slot, n, price: 0 }; st.price = Math.max(1, m.price | 0 || this.fairPrice(st)); if (it.n && it.n > n) it.n -= n; else ch.inventory = ch.inventory.filter(i => i !== it); sh.stock.push(st); }
    else if (m.act === 'price') { const st = sh.stock[m.i | 0]; if (st) st.price = Math.max(1, m.price | 0); }
    else if (m.act === 'unstock') { const st = sh.stock.splice(m.i | 0, 1)[0]; if (st) for (let k = 0; k < (st.kind === 'weapon' || st.kind === 'armor' ? st.n : 1); k++) addItem(ch, st.kind === 'weapon' ? { kind: 'weapon', ref: st.ref, plus: 0 } : st.kind === 'armor' ? { kind: 'armor', slot: st.slot, tier: st.tier, plus: 0 } : { kind: st.kind, ref: st.ref, n: st.n }); }
    else if (m.act === 'collect') { ch.gold += Math.max(0, sh.till); sh.till = Math.min(0, sh.till); }
    else if (m.act === 'hire') { if (sh.staff >= 3) return this.err(s, '従業員は3人まで'); sh.staff++; } else if (m.act === 'fire') sh.staff = Math.max(0, sh.staff - 1);
    else if (m.act === 'hours') sh.hours = m.night ? [18, 4] : [9, 21];
    else if (m.act === 'name') sh.name = String(m.name || '').slice(0, 16) || sh.name;
    this.decorate(z, ch); this.world.sendSelf(s); this.openMyShop(s, z);
  }
  // ── bank
  openBank(s) { const ch = s.ch; const d = clock().day; ch.bank ||= { bal: 0, day: d }; if (d > ch.bank.day) { ch.bank.bal += Math.min(2000 * (d - ch.bank.day), Math.round(ch.bank.bal * 0.002 * (d - ch.bank.day))); ch.bank.day = d; } s.send({ t: 'open', service: 'bank', data: { bal: ch.bank.bal, gold: ch.gold } }); }
  bank(s, m) { const ch = s.ch; ch.bank ||= { bal: 0, day: clock().day }; const n = Math.max(0, Math.floor(m.n || 0)); if (m.act === 'dep') { const v = Math.min(n, ch.gold); ch.gold -= v; ch.bank.bal += v; } else { const v = Math.min(n, ch.bank.bal); ch.bank.bal -= v; ch.gold += v; } this.world.sendSelf(s); this.openBank(s); }
  // ── casino (in-game currency only; house edge; daily wager cap)
  casino(s, m) {
    const ch = s.ch; const bet = Math.max(10, Math.min(5000, Math.floor(m.bet || 0))); const d = clock().day; ch.casino ||= { day: d, wager: 0 }; if (ch.casino.day !== d) ch.casino = { day: d, wager: 0 };
    if (ch.casino.wager + bet > 200000) return this.err(s, '本日の賭け上限（200,000G）に達しました'); if (ch.gold < bet) return this.err(s, 'ゴールドが足りません');
    ch.gold -= bet; ch.casino.wager += bet; let win = 0, res;
    const golden = (hash32('gamblers') + d) % 4 === 0 ? 1.2 : 1;
    if (m.game === 'slot') { const SYM = ['🍒', '🔔', '💎', '7', '🌙']; const W = [40, 28, 16, 6, 10]; const roll = () => { let x = Math.random() * 100; for (let i = 0; i < 5; i++) { x -= W[i]; if (x <= 0) return i; } return 0; }; const r = [roll(), roll(), roll()]; res = r.map(i => SYM[i]); const pay = { 0: 4, 1: 10, 2: 30, 3: 150, 4: 20 }; if (r[0] === r[1] && r[1] === r[2]) win = bet * pay[r[0]]; else if (r[0] === r[1] || r[1] === r[2]) win = Math.round(bet * (r[1] === 0 ? 1.2 : 1.6)); }
    else { const n = Math.floor(Math.random() * 37); const red = n !== 0 && [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(n); res = [n, n === 0 ? '緑' : red ? '赤' : '黒']; if (m.pick === 'red' && red || m.pick === 'black' && !red && n !== 0) win = bet * 2; else if (+m.pick === n && m.pick !== '' && !isNaN(+m.pick)) win = bet * 36; }
    win = Math.round(win * golden); ch.gold += win; if (win) this.world.guilds.addRep(ch, 'gamblers', 1);
    this.world.sendSelf(s); s.send({ t: 'casinoResult', res, win, bet, gold: ch.gold });
  }
  // ── arena (instanced waves)
  startArena(s) {
    const z = s.actor.zone; if (z.kind !== 'interior') return; const city = z.cityId; const key = `arena:${s.ch.id}`; const lv = Math.max(1, s.ch.level);
    const az = new Zone(this.world, key, { kind: 'interior', city, bldg: { id: 'arena_' + city, name: '闘技場・試合中', t: 'arena', size: 'L' }, door: z.door }); az.kind = 'arena'; az.returnTo = city; az.arena = { wave: 0, lv, from: z };
    az.map.npcs = []; this.world.zones.set(key, az); this.world.enterZone(s, az); this.nextWave(az);
  }
  nextWave(az) {
    const A = az.arena; A.wave++; const fams = ['goblin', 'wolf', 'lizard', 'knight', 'demon', 'dragonkin']; const n = 1 + A.wave;
    for (let i = 0; i < n; i++) { const m = makeMonster(fams[Math.min(fams.length - 1, Math.floor(A.lv / 25) + A.wave - 1)], A.lv + A.wave, 'NORMAL', { elite: A.wave === 3 && i === 0 }); const c = az.tileCenter([(az.map.w >> 1) + (i - n / 2) * 2, 5]); m.x = c.x; m.y = c.y; m.xp = Math.round(m.xp * 0.5); az.add(m); }
    az.fx({ t: 'phase', id: 0, v: `WAVE ${A.wave}` }); for (const p of az.players) p.session.send({ t: 'toast', v: `第${A.wave}試合 開始！`, cls: 'big' });
  }
  arenaKill(az) { if (!az.arena) return; if ([...az.actors.values()].some(a => a.kind === 'monster' && !a.dead)) return; if (az.arena.wave < 3) return void setTimeout(() => this.nextWave(az), 1500);
    for (const p of az.players) { const s = p.session, ch = s.ch; const prize = 300 + az.arena.lv * 60; ch.gold += prize; ch.progress.arenaWins = (ch.progress.arenaWins || 0) + 1; this.world.guilds.addRep(ch, 'gladiators', 3); this.world.guilds.event(s, { kind: 'arena' }); this.world.note(s, { t: 'quest', v: `闘技場で勝利！ 賞金${prize}G` }); }
    az.arena.done = true; for (const p of [...az.players]) setTimeout(() => p.session.actor?.zone === az && this.leaveArena(p.session), 2500);
  }
  leaveArena(s) { const az = s.actor.zone; const back = az.arena?.from; this.world.enterZone(s, back && this.world.zones.has(back.id) ? back : this.world.zones.get(az.returnTo)); }
  // ── black market / info / outfit
  openBlack(s, z) {
    if (z.cityId === 'marina' && this.flag('marina') === 'crackdown') return this.err(s, '闇市は摘発され、もぬけの殻だ…');
    const d = clock().day; const r = rng(hash32('black:' + z.cityId + d)); const pool = [...DATA.weapons.values()].filter(w => !WT_BY_ID[w.wt].myth && (w.rar === 3 || w.rar === 4));
    const mod = z.cityId === 'lumina' ? (this.flag('lumina') === 'rose' ? 0.8 : this.flag('lumina') === 'reform' ? 1.3 : 1) : 1;
    const list = Array.from({ length: 6 }, () => pool[Math.floor(r() * pool.length)]).map(w => ({ ref: w.id, name: w.name, rar: w.rar, wt: WT_BY_ID[w.wt].name, lvl: w.lvl, price: Math.round(w.price * 1.6 * mod) }));
    s.send({ t: 'open', service: 'blackmarket', data: { list, mats: ['relic', 'crystal', 'gem', 'abyssShard'].map(k => ({ ref: k, name: ITEMS[k].name, price: Math.round(ITEMS[k].price * 1.8 * mod) })) } });
  }
  blackBuy(s, m) { const z = s.actor.zone; const ch = s.ch; const d = clock().day; const r = rng(hash32('black:' + z.cityId + d)); void r; const w = DATA.weapons.get(m.ref); const it = ITEMS[m.ref];
    const mod = z.cityId === 'lumina' ? (this.flag('lumina') === 'rose' ? 0.8 : this.flag('lumina') === 'reform' ? 1.3 : 1) : 1;
    const price = w ? Math.round(w.price * 1.6 * mod) : it ? Math.round(it.price * 1.8 * mod) : 0; if (!price) return; if (ch.gold < price) return this.err(s, 'ゴールドが足りません'); ch.gold -= price;
    addItem(ch, w ? { kind: 'weapon', ref: w.id, plus: 0 } : { kind: 'mat', ref: m.ref, n: 1 }, n => this.world.note(s, n)); this.world.guilds.addRep(ch, 'blackmarket', 1); this.world.guilds.addRep(ch, 'knights', -1); this.world.sendSelf(s); }
  info(s) { if (s.ch.gold < 300) return this.err(s, '300Gが必要です'); s.ch.gold -= 300; const v = INFO[Math.floor(Math.random() * INFO.length)]; this.world.sendSelf(s); s.send({ t: 'open', service: 'lore', data: { title: '情報屋の耳打ち', text: v } }); }
  outfit(s, m) { if (s.ch.gold < 500) return this.err(s, '500Gが必要です'); s.ch.gold -= 500; const L = s.ch.look; L.outfit = (m.outfit | 0) % 10; L.hairColor = (m.hairColor | 0) % 10; L.hair = (m.hair | 0) % 6; this.world.sendSelf(s); this.world.enterZone(s, s.actor.zone, { x: s.actor.x, y: s.actor.y }); s.send({ t: 'toast', v: '新しい装いになった' }); }
  // ── crafting at a forge (smiths guild rank improves quality)
  craft(s, wt) {
    const ch = s.ch; const z = s.actor.zone; if (!(z.kind === 'interior' && z.map.props.some(p => p.k === 'forge' || p.k === 'anvil'))) return this.err(s, '鍛冶場の炉で鍛造できます'); wt = wt | 0; if (!WT_BY_ID[wt] || WT_BY_ID[wt].myth) return;
    const ore = ch.inventory.find(i => i.ref === 'ore'); const cost = 200 + ch.level * 15; if (!ore || ore.n < 3 || ch.gold < cost) return this.err(s, `強化鉱石3個と${cost}Gが必要です`);
    ore.n -= 3; if (ore.n <= 0) ch.inventory = ch.inventory.filter(i => i !== ore); ch.gold -= cost;
    const rank = ch.guilds?.smiths?.rank || 0; const bonus = this.flag('vulcan') === 'safety' ? 0.05 : 0; const roll = Math.random() + rank * 0.06 + bonus; const rar = roll > 1.15 ? 4 : roll > 0.85 ? 3 : roll > 0.45 ? 2 : 1;
    const pool = DATA.wtWeapons.get(wt).filter(w => w.rar === rar && w.lvl <= ch.level + 15); const w = pool.length ? pool[Math.floor(Math.random() * pool.length)] : DATA.wtWeapons.get(wt)[0];
    addItem(ch, { kind: 'weapon', ref: w.id, plus: 0 }, n => this.world.note(s, n)); this.world.guilds.event(s, { kind: 'craft' }); ch.progress.crafted = (ch.progress.crafted || 0) + 1; this.world.sendSelf(s);
  }
  // ── gathering & monster materials
  gather(s, z, o) { const ch = s.ch; ch.nodes ||= {}; const key = z.id + ':' + o.x + ',' + o.y; const now = Date.now(); if ((ch.nodes[key] || 0) > now) return this.err(s, 'まだ採れない（しばらく待とう）'); ch.nodes[key] = now + 180000; const n = 1 + Math.floor(Math.random() * 2); addItem(ch, { kind: 'mat', ref: o.mat, n }, nn => this.world.note(s, nn)); this.world.sendSelf(s); }
  monsterMat(s, m) { if (Math.random() > 0.2) return; const mat = MATS[DATA.families.get(m.fam)?.sprite] || 'herb'; if (mat === 'relic' && Math.random() > 0.15) return; addItem(s.ch, { kind: 'mat', ref: mat, n: 1 }, n => this.world.note(s, n)); }
  // ── citizens' personal requests
  residentRequest(s, c) {
    const d = clock().day; const r = rng(hash32(c.id + ':' + d)); if (r() > 0.45) return null; const have = s.ch.reqs?.[c.id];
    if (have && have.day === d) return { ...have, active: true };
    const field = CITIES[c.city].fields[0]; const fams = [...new Set(((this.world.zones.get(field)?.map && (await_world_fams(field))) || ['slime']))];
    const kind = r() < 0.5 ? 'item' : 'kill';
    return kind === 'item' ? { kind, ref: ['hp', 'meal', 'herb', 'hide'][Math.floor(r() * 4)], n: 1 + Math.floor(r() * 3), reward: 150 + Math.floor(r() * 300), day: d } : { kind, fam: fams[Math.floor(r() * fams.length)], n: 3 + Math.floor(r() * 5), reward: 250 + Math.floor(r() * 400), day: d };
  }
  request(s, m) {
    const ch = s.ch; const c = this.world.life.citizens.find(x => x.id === m.id); if (!c) return; ch.reqs ||= {}; const cur = ch.reqs[c.id];
    if (m.act === 'accept') { const q = this.residentRequest(s, c); if (!q || q.active) return; ch.reqs[c.id] = { ...q, prog: 0, name: c.name }; s.send({ t: 'toast', v: `${c.name}の頼みを引き受けた` }); }
    else if (m.act === 'turnin' && cur) {
      if (cur.kind === 'item') { const it = ch.inventory.find(i => i.ref === cur.ref && (i.n || 0) >= cur.n); if (!it) return this.err(s, `${ITEMS[cur.ref].name}が${cur.n}個必要です`); it.n -= cur.n; if (it.n <= 0) ch.inventory = ch.inventory.filter(x => x !== it); }
      else if ((cur.prog || 0) < cur.n) return this.err(s, 'まだ終わっていない');
      delete ch.reqs[c.id]; ch.gold += cur.reward; ch.progress.cityBond ||= {}; ch.progress.cityBond[c.city] = (ch.progress.cityBond[c.city] || 0) + 1; this.world.note(s, { t: 'quest', v: `${c.name}の頼みを達成（+${cur.reward}G）` });
    }
    this.world.sendSelf(s);
  }
  requestKill(s, fam) { for (const q of Object.values(s.ch.reqs || {})) if (q.kind === 'kill' && q.fam === fam) q.prog = (q.prog || 0) + 1; }
  // ── city stories
  openStory(s, city) { const st = STORIES[city]; if (!st) return; const prog = (s.ch.stories ||= {})[city] || { step: 0, prog: 0 }; const step = st.steps[prog.step]; const cs = this.cityState[city]; s.send({ t: 'open', service: 'story', data: { city, cityName: CITIES[city].name, name: st.name, step: prog.step, total: st.steps.length, cur: step || null, prog: prog.prog || 0, done: prog.step >= st.steps.length, outcome: cs ? { by: cs.by, effect: cs.effect, choice: cs.label } : null, mine: prog.choice || null } }); }
  story(s, m) {
    const ch = s.ch; const st = STORIES[m.city]; if (!st) return; ch.stories ||= {}; const p = ch.stories[m.city] ||= { step: 0, prog: 0 }; const step = st.steps[p.step]; if (!step) return;
    const adv = () => { p.step++; p.prog = 0; };
    if (step.kind === 'talk') adv();
    else if (step.kind === 'fund') { if (ch.gold < step.gold) return this.err(s, 'ゴールドが足りません'); ch.gold -= step.gold; adv(); }
    else if (step.kind === 'deliver') { ch.cargo ||= {}; if ((ch.cargo[step.good] || 0) < step.n) return this.err(s, `${GOODS[step.good].name}が${step.n}個必要です`); ch.cargo[step.good] -= step.n; adv(); }
    else if (step.kind === 'kill' || step.kind === 'floor') { if ((p.prog || 0) < (step.n || 1)) return this.err(s, 'まだ達成していない'); adv(); }
    else if (step.kind === 'choice') {
      const o = step.options.find(x => x.id === m.choice); if (!o) return; p.choice = o.id; adv(); if (o.gold) ch.gold += o.gold; for (const [g, v] of Object.entries(o.rep || {})) this.world.guilds.addRep(ch, g, v); grantXp(ch, 5000 + ch.level * 200, n => this.world.note(s, n));
      if (!this.cityState[m.city]) { this.cityState[m.city] = { flag: o.id, by: ch.name, label: o.label, effect: o.effect, at: Date.now() }; this.addNews(`【${CITIES[m.city].name}】${ch.name}の選択により情勢が変わった：${o.effect}`); for (const ss of this.world.sessions.values()) ss.send({ t: 'chat', from: '号外', v: `${CITIES[m.city].name}：${o.effect}` }); }
      ch.progress.titles.push(`${st.name}の${o.id === step.options[0].id ? '英雄' : '影'}`);
    }
    this.world.sendSelf(s); this.openStory(s, m.city);
  }
  storyEvent(s, ev) { for (const [city, p] of Object.entries(s.ch.stories || {})) { const step = STORIES[city]?.steps[p.step]; if (!step) continue; if (step.kind === 'kill' && ev.kind === 'kill' && ev.fam === step.fam) p.prog = (p.prog || 0) + 1; if (step.kind === 'floor' && ev.kind === 'floor' && ev.dungeon === step.dungeon && ev.floor >= step.floor) p.prog = 1; } }
  lore(s, key, z) { const def = CITIES[z.cityId]; const text = LORE[key] || def?.history[hash32(key + clock().day) % def.history.length]; s.send({ t: 'open', service: 'lore', data: { title: '記録を読む', text } }); }
  err(s, v) { s.send({ t: 'err', v }); }
}
import { WORLD } from './maps.js';
const await_world_fams = f => (WORLD[f]?.fams || []).flat();
