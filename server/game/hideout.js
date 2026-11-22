// Player hideouts in the slums: acquisition, facilities, storage/stash, crafting, terminal, abstract exposure & raids.
// Raids are abstract game events (no real-world intrusion methods) and never wipe long-term assets:
// at most a small share of low-value loose storage can be lost; stash, weapons, gold and facilities are always safe.
import { Grid } from './maps.js';
import { T } from './maps.js';
import { REGIONS, LOOT, HIDEOUT_LEVELS, FACILITIES, FACTIONS } from '../../shared/data/slum.js';
import { CITIES } from '../../shared/data/cities.js';
import { Zone } from './zone.js';
import { DATA, WT_BY_ID } from '../data.js';
import { addItem, grantXp, grantMastery, uid } from './progress.js';
import { clock } from './life.js';

const FAC_POS = [[2, 3], [6, 3], [10, 3], [14, 3], [18, 3], [22, 3], [2, 7], [20, 7], [2, 11], [22, 11], [6, 11], [18, 11]];
export class Hideout {
  constructor(world) { this.world = world; }
  get(ch) { return ch.hideout || null; }
  summary(ch) { const h = ch.hideout; if (!h) return { owned: false, can: this.acquireOptions(ch) }; return { owned: true, rid: h.rid, region: REGIONS[h.rid].name, lv: h.lv, name: HIDEOUT_LEVELS[h.lv].name, exposure: Math.round(h.exposure), fac: h.fac, vis: h.vis }; }
  acquireOptions(ch) {
    const out = []; const ex = (ch.progress.extractions || []).filter(e => e.ok).length; const deed = ch.inventory.find(i => i.kind === 'loot' && i.ref === 'deed');
    out.push({ k: 'buy', name: '空き部屋を買い取る', cost: 5000, ok: ch.gold >= 5000 && this.world.guilds.rep(ch, 'blackmarket') >= -10, cond: '5,000G・闇商人連合の評判-10以上' });
    const fav = Object.entries(FACTIONS).find(([, f]) => f.guild && this.world.guilds.rep(ch, f.guild) >= 30); out.push({ k: 'gift', name: '勢力から譲り受ける', ok: !!fav, cond: 'いずれかのスラム勢力の評判30以上', by: fav?.[1].name });
    out.push({ k: 'deed', name: '隠し物件の権利書を使う', ok: !!deed, cond: '探索で「隠し物件の権利書」を入手' });
    out.push({ k: 'quest', name: '情報屋の紹介（脱出3回）', ok: ex >= 3, cond: `探索から3回脱出（現在${ex}回）` });
    return out;
  }
  acquire(s, k, rid) {
    const ch = s.ch; if (ch.hideout) return this.err(s, '既に隠れ家を持っている'); if (!REGIONS[rid]) return; const o = this.acquireOptions(ch).find(x => x.k === k); if (!o?.ok) return this.err(s, '条件を満たしていません：' + (o?.cond || ''));
    if (k === 'buy') ch.gold -= 5000; if (k === 'deed') this.takeLoot(ch, 'deed', 1);
    ch.hideout = { rid, lv: 0, fac: {}, storage: [], stash: [], exposure: 5, vis: 'private', log: [{ t: Date.now(), v: `${REGIONS[rid].name}に隠れ家を構えた` }], visits: [], at: Date.now(), lastCheck: Date.now() };
    this.world.note(s, { t: 'msg', v: `隠れ家を手に入れた：${REGIONS[rid].name}「${HIDEOUT_LEVELS[0].name}」` }); this.world.slumQuest(s, { kind: 'hideout' }); this.world.sendSelf(s); this.view(s);
  }
  // materials: count across inventory loot + hideout storage
  have(ch, ref) { return ch.inventory.filter(i => i.kind === 'loot' && i.ref === ref).reduce((a, i) => a + i.n, 0) + (ch.hideout?.storage || []).filter(i => i.ref === ref).reduce((a, i) => a + i.n, 0); }
  takeLoot(ch, ref, n) { for (const list of [ch.inventory, ch.hideout?.storage || []]) for (const i of list.filter(x => (x.kind === 'loot' || !x.kind) && x.ref === ref)) { const k = Math.min(n, i.n); i.n -= k; n -= k; if (i.n <= 0) list.splice(list.indexOf(i), 1); if (!n) return true; } return !n; }
  pay(s, cost) { const ch = s.ch; const miss = Object.entries(cost).filter(([k, v]) => k === 'gold' ? ch.gold < v : this.have(ch, k) < v).map(([k, v]) => `${k === 'gold' ? 'ゴールド' : LOOT[k]?.name} ×${v}`); if (miss.length) { this.err(s, '不足：' + miss.join('、')); return false; } for (const [k, v] of Object.entries(cost)) if (k === 'gold') ch.gold -= v; else this.takeLoot(ch, k, v); return true; }
  // ── zone
  enter(s) {
    const ch = s.ch, h = ch.hideout; if (!h) return this.err(s, '隠れ家を持っていない'); const key = `hideout:${ch.id}`; let z = this.world.zones.get(key);
    if (!z) { const cz = this.world.zones.get(REGIONS[h.rid].city); const door = cz.map.doors.find(d => d.svc === 'slum'); z = new Zone(this.world, key, { kind: 'interior', hideout: true, owner: ch, city: REGIONS[h.rid].city, door, bldg: { id: 'hideout', name: '隠れ家', t: 'hideout' } }); this.world.zones.set(key, z); }
    s.send({ t: 'loading', v: '隠れ家', ms: 700 }); this.world.enterZone(s, z); this.view(s);
  }
  build(z, opts) {
    const h = opts.owner.hideout; const L = HIDEOUT_LEVELS[h.lv]; const [W, H] = L.size; const g = new Grid(W, H, T.PLANK);
    g.rect(0, 0, W, 2, T.IWALL); g.rect(0, 0, 1, H, T.IWALL); g.rect(W - 1, 0, 1, H, T.IWALL); g.rect(0, H - 1, W, 1, T.IWALL); const mx = W >> 1; g.set(mx, H - 1, T.MAT); g.set(mx - 1, H - 1, T.MAT);
    for (let k = 1; k < L.rooms; k++) { const x = Math.round(k * W / L.rooms); for (let y = 2; y < H - 1; y++) if (y % 6 !== 4 && y % 6 !== 5) g.set(x, y, T.IWALL); }
    for (let y = 2; y < H - 1; y++) for (let x = 1; x < W - 1; x++) if (g.get(x, y) === T.PLANK && (x + y * 3) % 11 === 0) g.set(x, y, T.STONEF);
    const props = [{ k: 'sdecor', v: 'wires', x: 1, y: 0, w: W - 2, h: 2, wall: 1 }, { k: 'lantern', x: mx, y: 2, w: 1, h: 1 }], objects = [], lights = [[mx, 3], [2, H - 3], [W - 3, H - 3]];
    const keys = Object.keys(h.fac); keys.forEach((f, i) => { const p = FAC_POS[i]; if (!p || p[0] >= W - 2 || p[1] >= H - 2) return; g.set(p[0], p[1], T.BLOCK); g.set(p[0] + 1, p[1], T.BLOCK); props.push({ k: 'hfac', f, lv: h.fac[f], x: p[0], y: p[1], w: 2, h: 1 }); objects.push({ k: 'fac', f, x: p[0] + 1, y: p[1] + 1 }); if (['forge', 'alchemy', 'lab', 'terminal'].includes(f)) lights.push([p[0], p[1]]); });
    props.push({ k: 'chest', x: W - 3, y: H - 4, w: 1, h: 1 }); g.set(W - 3, H - 4, T.BLOCK); objects.push({ k: 'hstore', x: W - 3, y: H - 3 });
    z.map = { w: W, h: H, tiles: g.t, pal: 'interior', floor: T.PLANK, wallCol: '#3a2f2a', start: [mx, H - 3], props, objects, lights, npcs: [], spots: [], exits: [], gates: [], spawns: [], kind: 'interior', grid: g, name: `隠れ家（${L.name}）`, slots: L.slots };
    z.kind = 'interior'; z.cityId = opts.city; z.door = opts.door; z.bldgId = 'hideout'; z.hideout = opts.owner.id; z.name = `${opts.owner.name}の隠れ家（${L.name}）`; z.gim = []; z.home = null;
    if (h.fac.fence) z.map.npcs.push({ service: 'hfence', name: '故買屋', x: W - 4, y: 4 });
  }
  rebuild(s) { const k = `hideout:${s.ch.id}`; const z = this.world.zones.get(k); if (!z) return; const ps = [...z.players].map(p => p.session); this.world.zones.delete(k); for (const p of ps) if (p === s) this.enter(p); else this.world.exitBuilding(p); }
  view(s) {
    const ch = s.ch, h = ch.hideout; if (!h) return s.send({ t: 'open', service: 'hideout', data: { owned: false, can: this.acquireOptions(ch), regions: Object.entries(REGIONS).map(([k, r]) => ({ k, name: r.name, city: CITIES[r.city].name, tier: r.tier })) } });
    this.check(s); const L = HIDEOUT_LEVELS[h.lv];
    s.send({ t: 'open', service: 'hideout', data: { owned: true, rid: h.rid, region: REGIONS[h.rid].name, lv: h.lv, name: L.name, next: HIDEOUT_LEVELS[h.lv + 1] ? { name: HIDEOUT_LEVELS[h.lv + 1].name, cost: HIDEOUT_LEVELS[h.lv + 1].cost } : null, slots: L.slots, storageCap: L.storage, stashCap: h.fac.stash ? 20 * h.fac.stash : 0,
      fac: Object.entries(FACILITIES).map(([k, f]) => ({ k, name: f.name, desc: f.desc, lv: h.fac[k] || 0, cost: this.facCost(k, h.fac[k] || 0) })), storage: h.storage, stash: h.stash, exposure: Math.round(h.exposure), risk: this.riskLabel(h), vis: h.vis, log: h.log.slice(-8).reverse(), visits: (h.visits || []).slice(-5).reverse(), inv: ch.inventory.filter(i => i.kind === 'loot'), inside: s.actor?.zone?.hideout === ch.id } });
  }
  facCost(k, lv) { const c = FACILITIES[k].cost; const m = Math.pow(2.2, lv); return Object.fromEntries(Object.entries(c).map(([a, v]) => [a, Math.round(v * m)])); }
  riskLabel(h) { const e = h.exposure; return e < 20 ? '低' : e < 45 ? '中' : e < 70 ? '高' : '危険'; }
  upgrade(s) { const h = s.ch.hideout; if (!h) return; const N = HIDEOUT_LEVELS[h.lv + 1]; if (!N) return this.err(s, '最大段階です'); if (!this.pay(s, N.cost)) return; h.lv++; h.log.push({ t: Date.now(), v: `隠れ家を「${N.name}」へ拡張した` }); this.world.slumQuest(s, { kind: 'hideout' }); this.rebuild(s); this.world.sendSelf(s); this.view(s); }
  install(s, k) { const h = s.ch.hideout; const F = FACILITIES[k]; if (!h || !F) return; const lv = h.fac[k] || 0; if (!lv && Object.keys(h.fac).length >= HIDEOUT_LEVELS[h.lv].slots) return this.err(s, '設備枠が足りません（隠れ家を拡張してください）'); if (lv >= 3) return this.err(s, '最大強化です'); if (!this.pay(s, this.facCost(k, lv))) return; h.fac[k] = lv + 1; h.log.push({ t: Date.now(), v: `${F.name}を${lv ? '強化' : '設置'}した（Lv${lv + 1}）` }); this.rebuild(s); this.world.sendSelf(s); this.view(s); }
  // storage: move loot between inventory and storage/stash
  store(s, uidv, to) { const ch = s.ch, h = ch.hideout; if (!h || s.actor.zone.hideout !== ch.id) return this.err(s, '隠れ家の中で操作してください'); const cap = to === 'stash' ? 20 * (h.fac.stash || 0) : HIDEOUT_LEVELS[h.lv].storage; const list = to === 'stash' ? h.stash : h.storage;
    const it = ch.inventory.find(i => i.uid === uidv && i.kind === 'loot'); if (!it) return; if (list.reduce((a, i) => a + i.n, 0) + it.n > cap) return this.err(s, '収納がいっぱいです'); ch.inventory = ch.inventory.filter(i => i !== it); list.push({ ref: it.ref, prov: it.prov, q: it.q, n: it.n, uid: it.uid }); this.world.sendSelf(s); this.view(s); }
  take(s, idx, from) { const ch = s.ch, h = ch.hideout; if (!h || s.actor.zone.hideout !== ch.id) return; const list = from === 'stash' ? h.stash : h.storage; const it = list.splice(idx | 0, 1)[0]; if (!it) return; this.world.slum.addLoot(ch, it); this.world.sendSelf(s); this.view(s); }
  // facilities
  use(s, f, m = {}) {
    const ch = s.ch, h = ch.hideout; if (!h?.fac[f]) return; const lv = h.fac[f]; const ok = v => { this.world.sendSelf(s); if (v) s.send({ t: 'toast', v }); this.view(s); };
    switch (f) {
      case 'workbench': { const it = ch.inventory.find(i => i.uid === m.uid && i.kind === 'loot'); if (!it) return s.send({ t: 'open', service: 'hfac', data: { f, lv, items: ch.inventory.filter(i => i.kind === 'loot' && Object.keys(LOOT[i.ref].use || {}).some(k => ['ore', 'hide', 'herb', 'crystal', 'gem', 'wood', 'relic'].includes(k))) } });
        const u = LOOT[it.ref].use; const got = []; for (const [k, v] of Object.entries(u)) { if (!['ore', 'hide', 'herb', 'crystal', 'gem', 'wood', 'relic'].includes(k)) continue; const n = Math.max(1, Math.round(v * (it.q || 1) * (1 + lv * 0.25) * it.n)); addItem(ch, { kind: 'mat', ref: k, n }); got.push(`${k}×${n}`); }
        ch.inventory = ch.inventory.filter(i => i !== it); return ok('分解した：' + got.join(' ')); }
      case 'forge': { if (!m.wt) return s.send({ t: 'open', service: 'hfac', data: { f, lv, parts: this.have(ch, 'parts'), tune: this.have(ch, 'tuning') } });
        if (m.act === 'tune') { const w = ch.inventory.find(i => i.uid === ch.equip.weapon); if (!w || !this.takeLoot(ch, 'tuning', 1)) return this.err(s, '調律キットが必要'); w.plus = Math.min(20, (w.plus || 0) + 1); return ok(`武器を調律した（+${w.plus}）`); }
        const wt = m.wt | 0; if (!WT_BY_ID[wt] || WT_BY_ID[wt].myth) return this.err(s, 'その武器種は鍛造できません'); const need = 3 + lv; if (!this.takeLoot(ch, 'parts', 3)) return this.err(s, '非合法武器部品×3が必要');
        const rar = Math.min(5, 2 + lv + (Math.random() < 0.15 ? 1 : 0)); const pool = [...DATA.weapons.values()].filter(w => w.wt === wt && w.rar === rar && w.lvl <= ch.level + 15); const w = pool[Math.floor(Math.random() * pool.length)] || [...DATA.weapons.values()].find(x => x.wt === wt);
        addItem(ch, { kind: 'weapon', ref: w.id, plus: 0 }, n => this.world.note(s, n)); void need; return ok(`闇鍛冶炉で${w.name}を鍛えた`); }
      case 'alchemy': { const herb = ch.inventory.find(i => i.kind === 'loot' && ['herbbag', 'manashard'].includes(i.ref)); if (!herb) return this.err(s, '薬草の包みか魔晶片が必要'); herb.n--; if (herb.n <= 0) ch.inventory = ch.inventory.filter(i => i !== herb); addItem(ch, { kind: 'potion', ref: herb.ref === 'herbbag' ? 'hp' : 'sp', n: 2 + lv }); return ok(`ポーションを${2 + lv}個調合した`); }
      case 'terminal': return s.send({ t: 'open', service: 'terminal', data: { regions: Object.keys(REGIONS).map(r => { const v = this.world.market.view(r); return { ...v, items: v.items.sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct)).slice(0, 8 + lv * 2) }; }), omen: Object.fromEntries(Object.keys(REGIONS).map(r => [r, this.world.slum.omen(r)])) } });
      case 'maptable': return s.send({ t: 'open', service: 'lore', data: { title: '地図管理台', text: `記録済みの区域：${Object.keys(ch.progress.slumMap || {}).map(k => REGIONS[k.split(':')[0]]?.name + ' ' + ['地下', '地上', '中層', '屋上'][+k.split(':')[1]]).join('、') || 'なし'}\n固定区画（主要通路・常設出口・梯子）は探索マップに常に表示されます。` } });
      case 'rest': { const a = s.actor; a.hp = a.maxHp; a.sp = a.maxSp; a.addBuff({ xp: 0.05 * lv }, 30 * 60000, 'hideout_rest'); ch.mods ||= {}; return ok('休息した（HP/SP全回復、30分間経験値+' + 5 * lv + '%）'); }
      case 'lab': { const it = ch.inventory.find(i => i.kind === 'loot' && LOOT[i.ref].cat === 'artifact'); if (!it) return this.err(s, '研究できる遺物がない'); it.n--; if (it.n <= 0) ch.inventory = ch.inventory.filter(i => i !== it); const xp = LOOT[it.ref].v * (1 + lv * 0.5); grantXp(ch, xp, n => this.world.note(s, n)); grantMastery(ch, s.actor.wt.id, Math.round(xp / 10)); this.world.guilds.addRep(ch, 'ancients', 1); return ok(`${LOOT[it.ref].name}を研究した（経験値+${Math.round(xp)}）`); }
      case 'display': { const it = ch.inventory.find(i => i.uid === m.uid); if (it) { h.display ||= []; if (h.display.length < 4 * lv) h.display.push(it.kind === 'weapon' ? DATA.weapons.get(it.ref)?.name : LOOT[it.ref]?.name); } return s.send({ t: 'open', service: 'lore', data: { title: '武具展示棚', text: (h.display || []).join('\n') || 'まだ何も飾っていない（武器のuidを指定して飾る）' } }); }
      case 'security': return ok(`警備設備Lv${lv}：発覚リスクの上昇を${lv * 25}%軽減`);
      case 'stash': return ok(`隠し収納：${20 * lv}枠（襲撃でも奪われない）`);
      case 'fence': return this.world.openMarket(s, h.rid, { fence: true, who: '故買屋' });
    }
  }
  // exposure grows with visible activity; security reduces it. Abstract raid check runs when the owner looks at the hideout / extracts.
  onExtract(ch, rid, val) { const h = ch.hideout; if (!h) return; const sec = h.fac.security || 0; h.exposure = Math.min(100, h.exposure + (rid === h.rid ? 2 : 0.5) * (1 + val / 5000) * (1 - sec * 0.25) * (h.vis === 'public' ? 1.5 : 1)); }
  check(s) {
    const ch = s.ch, h = ch.hideout; if (!h) return; const now = Date.now(); const hours = (now - (h.lastCheck || now)) / 3600000; h.lastCheck = now; if (hours <= 0.01) return;
    h.exposure = Math.max(0, h.exposure - hours * (1 + (h.fac.security || 0)));
    const p = Math.min(0.5, hours * Math.max(0, h.exposure - 30) / 400); if (Math.random() >= p) return;
    // abstract raid: security strength vs. faction pressure; losses limited to ≤10% of low-value loose storage
    const def = (h.fac.security || 0) * 30 + 20 + Math.random() * 40; const atk = h.exposure + Math.random() * 40; const fac = FACTIONS[this.world.market.controller(h.rid)]?.name || '何者か';
    if (def >= atk) { h.log.push({ t: now, v: `${fac}の手の者が隠れ家を嗅ぎ回ったが、警備で追い払った` }); h.exposure = Math.max(0, h.exposure - 15); this.world.note(s, { t: 'msg', v: '隠れ家への襲撃を撃退した！' }); return; }
    const loose = h.storage.filter(i => LOOT[i.ref]?.v <= 300); const n = Math.max(0, Math.floor(h.storage.reduce((a, i) => a + i.n, 0) * 0.1)); const lost = [];
    for (let k = 0; k < n && loose.length; k++) { const i = loose[Math.floor(Math.random() * loose.length)]; i.n--; lost.push(LOOT[i.ref].name); if (i.n <= 0) { h.storage.splice(h.storage.indexOf(i), 1); loose.splice(loose.indexOf(i), 1); } }
    h.exposure = Math.max(0, h.exposure - 30); h.log.push({ t: now, v: `${fac}に荒らされた。${lost.length ? '失った物：' + lost.join('、') : '被害なし'}（隠し収納・設備・武器・所持金は無事）` });
    this.world.note(s, { t: 'msg', v: `隠れ家が荒らされた（被害${lost.length}点）。警備設備で防げる。` });
  }
  setVis(s, v) { const h = s.ch.hideout; if (!h || !['private', 'party', 'public'].includes(v)) return; h.vis = v; this.view(s); }
  canVisit(ch, owner) { const h = owner.hideout; if (!h) return false; if (owner.id === ch.id || h.vis === 'public') return true; return h.vis === 'party' && this.world.partyOf(owner.id)?.members.includes(ch.id); }
  visit(s, name) { const o = [...this.world.sessions.values()].find(x => x.ch?.name === name); if (!o || !this.canVisit(s.ch, o.ch)) return this.err(s, '訪問できません（相手の公開設定を確認）'); const key = `hideout:${o.ch.id}`; let z = this.world.zones.get(key); if (!z) { const cz = this.world.zones.get(REGIONS[o.ch.hideout.rid].city); z = new Zone(this.world, key, { kind: 'interior', hideout: true, owner: o.ch, city: REGIONS[o.ch.hideout.rid].city, door: cz.map.doors.find(d => d.svc === 'slum'), bldg: { id: 'hideout', name: '隠れ家', t: 'hideout' } }); this.world.zones.set(key, z); }
    (o.ch.hideout.visits ||= []).push({ t: Date.now(), who: s.ch.name }); this.world.enterZone(s, z); }
  err(s, v) { s.send({ t: 'err', v }); }
}
void clock; void uid;
