// Slum extraction raids: instances (seeded, shared by parties, PvPvE), layers, containers, faction NPCs, events,
// extraction points with conditions, success/failure handling, slum quests. All authoritative.
import { REGIONS, LAYERS, LOOT, CONTAINERS, EXITS, EVENTS, FACTIONS, FACTION_FAMS, TIER_LV, ROLE_BONUS, RAID_MINUTES, EXTRACT_SECONDS, BASE_CAPACITY, LOOT_CAT } from '../../shared/data/slum.js';
import { CITIES } from '../../shared/data/cities.js';
import { Zone } from './zone.js';
import { Actor } from './actor.js';
import { makeMonster } from './monsters.js';
import { genSlumLayer, skeleton, quadOf, SW, SH } from './slumgen.js';
import { clock } from './life.js';
import { DATA } from '../data.js';
import { grantXp, uid } from './progress.js';
import { hash32, rng } from '../../shared/util.js';

const MAX_PLAYERS = 8, JOIN_WINDOW = 8 * 60000;
export const regionOfCity = c => Object.entries(REGIONS).find(([, r]) => r.city === c)?.[0];
const weight = bag => Math.round(bag.reduce((a, it) => a + (LOOT[it.ref]?.w || 0) * (it.n || 1), 0) * 10) / 10;
const value = bag => bag.reduce((a, it) => a + (LOOT[it.ref]?.v || 0) * (it.q || 1) * (it.n || 1), 0) | 0;

export class Slum {
  constructor(world) { this.world = world; this.inst = new Map(); }
  role(ch) { return ROLE_BONUS[DATA.jobs.get(ch.job)?.role] || {}; }
  capacity(ch) { return BASE_CAPACITY + (this.role(ch).cap || 0) + (ch.level >= 50 ? 10 : ch.level >= 20 ? 5 : 0); }
  // ── entrance (city building "スラム深部への入口")
  open(s, z, npc) {
    const rid = npc?.region || regionOfCity(z.cityId); const R = REGIONS[rid]; const ch = s.ch; const w = ch.inventory.find(i => i.uid === ch.equip.weapon); const wd = w && DATA.weapons.get(w.ref);
    const ctl = this.world.market.controller(rid);
    s.send({ t: 'open', service: 'slum', data: { rid, ...R, cityName: CITIES[R.city].name, pvp: R.tier >= 3, gearLoss: R.tier >= 4, insureCost: wd ? Math.round(wd.price * 0.1) : 0, weaponName: wd?.name, cap: this.capacity(ch), controller: FACTIONS[ctl]?.name, influence: Object.fromEntries(Object.entries(this.world.market.influence[rid]).map(([f, v]) => [FACTIONS[f].name, Math.round(v)])),
      hideout: this.world.hideout.summary(ch), quests: this.board(ch, rid), active: Object.values(ch.squests || {}).filter(q => q.rid === rid), history: (ch.progress.extractions || []).filter(e => e.rid === rid).slice(-5), raid: ch.raid ? { rid: ch.raid.rid } : null, omen: this.omen(rid) } });
  }
  omen(rid) { const k = Object.keys(EVENTS); const r = rng(hash32(rid + ':omen:' + Math.floor(clock().total / 60))); return [k[Math.floor(r() * k.length)], k[Math.floor(r() * k.length)]].map(e => EVENTS[e].name); }
  // ── instances & matchmaking
  getInstance(rid, partyKey) {
    const now = Date.now();
    for (const I of this.inst.values()) if (I.rid === rid && now - I.created < JOIN_WINDOW && I.players.size < MAX_PLAYERS && !I.closed) { I.parties.add(partyKey); return I; }
    const seed = (hash32(rid + now + Math.random()) % 1e9) + 1; const R = REGIONS[rid]; const r = rng(seed);
    const keys = Object.keys(EVENTS); const events = []; const n = 1 + (R.tier >= 3 ? 1 : 0) + (r() < 0.3 ? 1 : 0); while (events.length < n) { const e = keys[Math.floor(r() * keys.length)]; if (!events.includes(e)) events.push(e); }
    const exitKeys = Object.keys(EXITS); const always = r() < 0.5 ? 'sewer' : 'stairs'; const active = new Set([always]); while (active.size < 4) active.add(exitKeys[Math.floor(r() * exitKeys.length)]); if (events.includes('tunnel')) active.add('smuggle');
    const I = { id: 'i' + seed.toString(36), rid, seed, events, active: [...active], free: events.includes('tunnel') ? ['smuggle', always] : [always], created: now, players: new Set(), parties: new Set([partyKey]), zones: {}, looted: new Set(), power: false, closed: false };
    this.inst.set(I.id, I); return I;
  }
  zone(I, L) {
    const key = `slum:${I.id}:${L}`; let z = this.world.zones.get(key);
    if (!z) { z = new Zone(this.world, key, { kind: 'slum', inst: I, layer: L }); this.world.zones.set(key, z); I.zones[L] = key; this.populate(z, I, L); }
    return z;
  }
  build(z, I, L) { // called from Zone constructor
    const R = REGIONS[I.rid]; z.map = genSlumLayer(I.rid, L, I.seed, I.events); z.kind = 'slum'; z.inst = I; z.layer = L; z.cityId = R.city; z.name = z.map.name; z.gim = []; z.darkness = L === 0 || I.events.includes('blackout');
    z.map.objects = z.map.objects.filter(o => o.k !== 'exit' || I.active.includes(o.type)); z.lv = TIER_LV[R.tier] + L * 3; z.diff = 'NORMAL';
    for (const o of z.map.objects) if (o.k === 'cont' && I.looted.has(o.id)) o.looted = true;
  }
  populate(z, I, L) {
    const R = REGIONS[I.rid]; const r = rng(hash32(I.seed + ':npc:' + L)); const occupy = I.events.includes('occupation'); const ctl = this.world.market.controller(I.rid);
    const spots = z.map.npcSpots; const thin = I.events.includes('blackout') ? 0.7 : 1;
    spots.forEach(([x, y], i) => {
      if (r() > thin) return; const terr = occupy && r() < 0.6 ? ctl : R.factions[quadOf(x, y) % R.factions.length]; const fams = FACTION_FAMS[terr];
      if (r() < 0.22 && terr !== 'scavs') return this.spawnNpc(z, terr, x, y, r() < 0.4 ? 'resident' : 'trader');
      const m = makeMonster(fams[Math.floor(r() * fams.length)], z.lv + Math.floor(r() * 4), 'NORMAL', { elite: r() < 0.05 * R.tier }); const c = z.tileCenter([x, y]); m.x = c.x; m.y = c.y; m.home = [c.x, c.y];
      m.faction = terr; m.name = `${FACTIONS[terr].name}・${m.name}`; m.hostileBelow = FACTIONS[terr].hostileBelow + (occupy && terr === ctl ? 20 : 0); z.add(m);
    });
    // event actors
    const ev = I.events; const G = layer => layer === L;
    if (ev.includes('convoy') && G(1)) for (let k = 0; k < 3; k++) { const m = makeMonster('carrier', z.lv, 'NORMAL'); const c = z.tileCenter([10 + k * 3, SH >> 1]); m.x = c.x; m.y = c.y; m.home = [z.tileCenter([SW - 10, SH >> 1]).x, c.y]; m.faction = R.factions[0]; m.hostileBelow = -999; m.name = `${FACTIONS[m.faction].name}・運び屋`; m.convoy = true; z.add(m); }
    if (ev.includes('relicfind') && G(0)) { const o = z.map.objects.find(o => o.id === 'relicfind'); if (o) for (let k = 0; k < 2; k++) { const m = makeMonster(FACTION_FAMS[ctl][0], z.lv + 5, 'NORMAL', { elite: true }); const c = z.tileCenter([o.x + k * 2 - 1, o.y + 1]); m.x = c.x; m.y = c.y; m.home = [c.x, c.y]; m.faction = ctl; m.hostileBelow = 999; z.add(m); } }
    if (ev.includes('popup') && G(1)) { const p = skeleton(I.rid).merchants[0]; this.spawnNpc(z, 'dawn', p[0], p[1], 'merchant', '臨時闇店舗の商人'); }
    if (ev.includes('merchant') && G(2)) { const sp = spots[0] || z.map.start; this.spawnNpc(z, 'scavs', sp[0], sp[1], 'merchant', '移動商人'); }
    if (ev.includes('client') && G((I.seed % 3) + 0)) { const sp = spots[1] || z.map.start; this.spawnNpc(z, 'greyrats', sp[0], sp[1], 'client', '謎の依頼人'); }
    if (L === 1) { const p = skeleton(I.rid).merchants[1]; this.spawnNpc(z, R.factions[0] === 'scavs' ? 'dawn' : R.factions[0], p[0], p[1], 'merchant', '常設の密売人'); }
    if (ev.includes('anomaly') && G(0)) for (let k = 0; k < 4; k++) { const sp = spots[k + 2]; if (!sp) break; const c = z.tileCenter(sp); z.addArea({ owner: { id: -2, team: 'hazard', stats: { atk: 20 + z.lv * 6, matk: 0, crit: 0, critDmg: 1, mods: {}, range: 1 }, buffMods: {}, facing: 0, dead: false, kind: 'monster' }, x: c.x, y: c.y, r: 40, until: Date.now() * 10, tick: 900, next: 0, opt: { m: 0.6, el: 'void', dot: true }, e: { both: 1, anomaly: 1 } }); }
  }
  spawnNpc(z, faction, x, y, role, name) {
    const c = z.tileCenter([x, y]); const r = rng(hash32(z.id + x + ':' + y));
    const a = new Actor({ kind: 'slumnpc', team: 'neutral', name: name || `${FACTIONS[faction].name}の${{ resident: '住民', trader: '売人', merchant: '商人', client: '依頼人' }[role]}`, job: { resident: '住民', trader: '売人', merchant: '商人', client: '依頼人' }[role], role, faction, x: c.x, y: c.y, r: 5, look: { body: Math.floor(r() * 3), skin: Math.floor(r() * 5), hair: Math.floor(r() * 6), hairColor: Math.floor(r() * 10), outfit: Math.floor(r() * 10) }, stats: { atk: 0, matk: 0, def: 9999, crit: 0, critDmg: 1, dr: 1, mods: {}, range: 1, move: 1 }, maxHp: 1, hp: 1, level: 0, invulnUntil: Infinity, facing: Math.PI / 2 });
    z.add(a); return a;
  }
  // faction NPC behaviour hook (called from monster target selection)
  passiveFor(m, t) { if (!m.faction || m.provoked) return false; if (!t.ch) return true; const g = FACTIONS[m.faction].guild; const rep = g ? this.world.guilds.rep(t.ch, g) : 0; return rep >= m.hostileBelow; }
  provoked(z, m, src) { if (!m.faction || m.provoked) return; m.provoked = true; for (const o of z.actors.values()) if (o.faction === m.faction && o.kind === 'monster' && Math.hypot(o.x - m.x, o.y - m.y) < 160) o.provoked = true; const g = FACTIONS[m.faction].guild; const ch = src?.ch || src?.owner?.ch; if (g && ch) this.world.guilds.addRep(ch, g, -3); }
  // ── raid lifecycle
  start(s, opts = {}) {
    const ch = s.ch; const z = s.actor.zone; if (ch.raid) return this.err(s, '既に探索中です');
    const rid = opts.rid || regionOfCity(z.cityId); const R = REGIONS[rid]; if (!R) return; if (ch.level < [0, 1, 10, 25, 45, 70][R.tier]) return this.err(s, `この区域はLv${[0, 1, 10, 25, 45, 70][R.tier]}以上で挑めます`);
    const pty = this.world.partyOf(ch.id); const pk = pty?.id || ch.id; const I = this.getInstance(rid, pk);
    const members = this.world.partyMembersHere(s);
    for (const m of members) {
      const c = m.ch; if (c.raid) continue; const w = c.inventory.find(i => i.uid === c.equip.weapon); const wd = w && DATA.weapons.get(w.ref);
      let insured = false; if (opts.insure && m === s && wd) { const fee = Math.round(wd.price * 0.1); if (c.gold >= fee) { c.gold -= fee; insured = true; } }
      c.raid = { inst: I.id, rid, layer: 1, bag: [], pouch: [], party: pk, started: Date.now(), ends: Date.now() + RAID_MINUTES * 60000, insured: insured ? w.uid : null, kills: 0, warned: 0 };
      I.players.add(c.id); m.send({ t: 'loading', v: `${R.name}へ潜入…`, ms: 1400 });
      const zz = this.zone(I, 1); const p = zz.tileCenter(zz.map.start); this.world.enterZone(m, zz, { x: p.x + (Math.random() * 20 - 10), y: p.y });
      m.send({ t: 'raidStart', rid, name: R.name, events: I.events.map(e => EVENTS[e]), exits: I.active.map(k => ({ k, name: EXITS[k].name, layer: LAYERS[EXITS[k].layer].name, cond: EXITS[k].cond, desc: EXITS[k].desc || '', free: I.free.includes(k) })), ends: c.raid.ends, pvp: R.tier >= 3, gearLoss: R.tier >= 4 && !insured, seed: I.seed });
    }
  }
  teamFor(s, z) { const R = REGIONS[z.inst.rid]; return R.tier >= 3 ? 'raid:' + (s.ch.raid?.party || s.ch.id) : 'ally'; }
  ladder(s, o) { const z = s.actor.zone; const I = z.inst; const L = z.layer + o.dir; if (L < 0 || L > 3) return; const nz = this.zone(I, L); s.ch.raid.layer = L; s.send({ t: 'loading', v: `${LAYERS[L].name}へ`, ms: 500 }); this.world.enterZone(s, nz, nz.tileCenter([o.x, o.y + 1])); }
  search(s, z, o) {
    if (o.looted) return this.err(s, '既に漁られている'); const a = s.actor; if (a.action && a.action.until > z.now) return;
    const C = CONTAINERS[o.ck]; const t = Math.round(C.time * (this.role(s.ch).search || 1)); a.action = { type: 'search', until: z.now + t, lockMove: true }; s.send({ t: 'progress', v: `${C.name}を調べている…`, ms: t });
    z.schedule(z.now + t, () => { if (a.dead || a.zone !== z || o.looted || Math.hypot(z.tileCenter([o.x, o.y]).x - a.x, z.tileCenter([o.x, o.y]).y - a.y) > 30) return; o.looted = true; z.inst.looted.add(o.id); z.fx({ t: 'objUpdate', x: o.x, y: o.y - 1, looted: 1 }); const got = this.rollLoot(C, o, z, s.ch); for (const it of got) this.toBag(s, it, z); if (!got.length) s.send({ t: 'toast', v: '何も見つからなかった' }); this.world.slumQuest(s, { kind: 'search' }); });
  }
  rollLoot(C, o, z, ch) {
    const out = []; const R = REGIONS[z.inst.rid]; const L = LAYERS[z.layer]; const danger = o.danger || R.tier;
    if (o.items) return o.items.splice(0);
    for (let k = 0; k < C.rolls + (o.bonus || 0); k++) {
      if (Math.random() < 0.18) continue; const cats = C.cats; const cat = cats[Math.floor(Math.random() * cats.length)];
      const pool = Object.entries(LOOT).filter(([, it]) => it.cat === cat && it.r <= Math.min(5, danger + 1) && it.r >= (C.minR || 1) && !['guildbox', 'deed'].includes(it.k)); if (!pool.length) continue;
      const wts = pool.map(([, it]) => Math.pow(0.42, Math.max(0, it.r - 1)) * (R.bias[it.cat] || 1) * L.lootMul * (it.r >= 3 ? 1 + danger * 0.15 : 1)); let x = Math.random() * wts.reduce((a, b) => a + b, 0); let pick = pool[0];
      for (let i = 0; i < pool.length; i++) { x -= wts[i]; if (x <= 0) { pick = pool[i]; break; } }
      out.push({ ref: pick[0], n: 1, q: Math.round((0.8 + Math.random() * 0.5) * 10) / 10, prov: pick[1].prov });
    }
    if (Math.random() < 0.01 * danger) out.push({ ref: 'deed', n: 1, q: 1, prov: 'unknown' });
    if (z.inst.events.includes('client') && Math.random() < 0.08 && !z.inst.boxPlaced) { z.inst.boxPlaced = true; out.push({ ref: 'guildbox', n: 1, q: 1, prov: 'slum' }); }
    if (Math.random() < 0.06 && o.ck !== 'trash') out.push({ ref: 'fuse', n: 1, q: 1, prov: 'slum' });
    return out;
  }
  toBag(s, it, z) { const r = s.ch.raid; if (!r) return; if (weight(r.bag) + (LOOT[it.ref].w || 0) > this.capacity(s.ch)) { z.dropLoot(s.actor, s.actor.x, s.actor.y, [{ kind: 'sloot', ...it }]); return s.send({ t: 'toast', v: `重量オーバー！ ${LOOT[it.ref].name}を足元に置いた` }); } r.bag.push(it); s.send({ t: 'toast', v: `入手：${LOOT[it.ref].name}${it.q >= 1.2 ? '（高品質）' : ''}` }); }
  pouch(s, i, toPouch) { const r = s.ch.raid; if (!r) return; if (toPouch) { const it = r.bag[i]; if (!it || r.pouch.length >= 2 || (LOOT[it.ref].w || 0) > 1) return this.err(s, '保険ポーチは2枠・1kg以下の品のみ'); r.bag.splice(i, 1); r.pouch.push(it); } else { const it = r.pouch.splice(i, 1)[0]; if (it) r.bag.push(it); } this.bagView(s); }
  drop(s, i) { const r = s.ch.raid; const it = r?.bag.splice(i, 1)[0]; if (it) s.actor.zone.dropLoot(s.actor, s.actor.x, s.actor.y, [{ kind: 'sloot', ...it }]); this.bagView(s); }
  bagView(s) { const r = s.ch.raid; if (!r) return; s.send({ t: 'open', service: 'raidbag', data: { bag: r.bag, pouch: r.pouch, w: weight(r.bag), cap: this.capacity(s.ch), v: value(r.bag) + value(r.pouch) } }); }
  // ── extraction
  exitCheck(s, z, o) {
    const I = z.inst; const E = EXITS[o.type] || { name: o.type === 'hideout' ? '隠れ家への抜け道' : '潜入口', cond: 'none' }; const ch = s.ch; const r = ch.raid; const free = !EXITS[o.type] || I.free.includes(o.type);
    const fail = v => (this.err(s, `${E.name}：${v}`), false);
    if (!free) switch (E.cond) {
      case 'power': if (!I.power) { const f = r.bag.findIndex(i => i.ref === 'fuse'); if (f < 0) return fail('配電盤が死んでいる。魔導ヒューズが必要だ'); r.bag.splice(f, 1); I.power = true; this.world.note(s, { t: 'msg', v: '魔導ヒューズを挿した。地下鉄が動き出した（この探索中は誰でも利用可）' }); } break;
      case 'pay': if (ch.gold < E.fee) return fail(`通行料${E.fee}Gが必要`); ch.gold -= E.fee; this.world.market.shift(I.rid, 'seacats', 0.5); break;
      case 'night': { const h = clock().hour; if (!(h >= 19 || h < 5)) return fail('小舟は夜（19〜5時）しか出ない'); break; }
      case 'item': { const f = r.bag.findIndex(i => i.ref === E.item); if (f < 0) return fail('隠し扉の鍵が必要'); r.bag.splice(f, 1); break; }
      case 'timed': { const phase = (Date.now() - I.created) % 240000; if (phase > 60000) return fail(`飛空艇は${Math.ceil((240000 - phase) / 1000)}秒後に着陸する`); break; }
      case 'rep': { const ctl = this.world.market.controller(I.rid); const g = FACTIONS[ctl]?.guild; if (!(g && this.world.guilds.rep(ch, g) >= 0)) { if (ch.gold < E.fee) return fail(`${FACTIONS[ctl]?.name}に睨まれている。賄賂${E.fee}Gが必要`); ch.gold -= E.fee; } this.world.market.shift(I.rid, ctl, 0.5); break; }
    }
    r.extracting = { type: o.type, x: s.actor.x, y: s.actor.y, until: Date.now() + EXTRACT_SECONDS * 1000 };
    s.send({ t: 'progress', v: `${E.name}から脱出中…（その場を動かないで）`, ms: EXTRACT_SECONDS * 1000 }); return true;
  }
  tickSession(s) {
    const r = s.ch.raid; const a = s.actor; if (!r || !a) return; const now = Date.now();
    if (r.extracting) { if (a.dead || a.zone.kind !== 'slum' || Math.hypot(a.x - r.extracting.x, a.y - r.extracting.y) > 40) { r.extracting = null; s.send({ t: 'progress', v: '脱出を中断した', ms: 0 }); } else if (now >= r.extracting.until) return this.extract(s, r.extracting.type); }
    const left = r.ends - now; if (left < 300000 && r.warned < 1) { r.warned = 1; s.send({ t: 'toast', v: '残り5分！ 脱出地点へ向かえ', cls: 'big' }); } if (left < 60000 && r.warned < 2) { r.warned = 2; s.send({ t: 'toast', v: '残り1分！', cls: 'big' }); }
    if (left <= 0 && a.zone.kind === 'slum') this.fail(s, 'mia');
  }
  extract(s, via) {
    const ch = s.ch, r = ch.raid; const I = this.inst.get(r.inst); const items = [...r.bag, ...r.pouch]; const val = value(items);
    const got = []; for (const it of items) { this.addLoot(ch, it); got.push(it); }
    ch.progress.extractions ||= []; ch.progress.extractions.push({ rid: r.rid, at: Date.now(), via, value: val, n: items.length, kills: r.kills, seed: I?.seed, ok: true }); if (ch.progress.extractions.length > 50) ch.progress.extractions.shift();
    grantXp(ch, Math.round(200 + val / 8), n => this.world.note(s, n)); this.world.guilds.addRep(ch, 'explorers', 2); this.world.guilds.addRep(ch, 'adventurers', 1);
    const res = { ok: true, via: EXITS[via]?.name || (via === 'hideout' ? '隠れ家' : '潜入口'), items: got, value: val, kills: r.kills, time: Math.round((Date.now() - r.started) / 1000), rid: r.rid };
    this.world.slumQuest(s, { kind: 'extract', rid: r.rid, via, items: got });
    this.world.hideout.onExtract(ch, r.rid, val);
    this.world.events?.record(s, 'ex_slum_raid', `${REGIONS[r.rid].name}から脱出（${EXITS[via]?.name || (via === 'hideout' ? '隠れ家' : '潜入口')}・推定${val}G）`, { clear: true });
    I?.players.delete(ch.id); ch.raid = null; s.ch.progress.raids = (s.ch.progress.raids || 0) + 1;
    const dest = via === 'hideout' ? null : this.cityEntrance(REGIONS[res.rid].city);
    if (via === 'hideout') this.world.hideout.enter(s); else this.world.enterZone(s, dest.z, dest.p);
    s.send({ t: 'raidResult', ...res }); this.world.sendSelf(s);
  }
  addLoot(ch, it) { const ex = ch.inventory.find(i => i.kind === 'loot' && i.ref === it.ref && i.prov === it.prov && i.q === it.q); if (ex) ex.n += it.n || 1; else ch.inventory.push({ uid: uid(), kind: 'loot', ref: it.ref, prov: it.prov, q: it.q || 1, n: it.n || 1 }); }
  cityEntrance(city) { const cz = this.world.zones.get(city); const d = cz.map.doors.find(x => x.svc === 'slum'); return { z: cz, p: d ? cz.tileCenter([d.x, d.y + 1]) : null }; }
  // failure: death, MIA (time), or unresolved disconnect. Clear, fair rules.
  fail(s, cause) {
    const ch = s.ch, r = ch.raid; if (!r) return; const R = REGIONS[r.rid]; const I = this.inst.get(r.inst); const a = s.actor; const z = a?.zone?.kind === 'slum' ? a.zone : null;
    const lost = [...r.bag]; const kept = [...r.pouch]; for (const it of kept) this.addLoot(ch, it);
    let lostWeapon = null;
    if (cause === 'death' && R.tier >= 4 && r.insured !== ch.equip.weapon) { const w = ch.inventory.find(i => i.uid === ch.equip.weapon); const others = ch.inventory.filter(i => i.kind === 'weapon' && i !== w); if (w && others.length) { ch.inventory = ch.inventory.filter(i => i !== w); ch.equip.weapon = others[0].uid; lostWeapon = DATA.weapons.get(w.ref)?.name; lost.push({ ref: 'weapon', name: lostWeapon, wref: w.ref }); } }
    // the dead raider's bag becomes a lootable corpse for others in the instance (PvPvE)
    if (z && cause === 'death' && r.bag.length) { const tx = Math.floor(a.x / 16), ty = Math.floor(a.y / 16); const id = `dead_${ch.id}_${Date.now()}`; z.map.objects.push({ k: 'cont', ck: 'corpse', id, x: tx, y: ty + 1, danger: R.tier, items: r.bag.map(x => ({ ...x })) }); z.map.props.push({ k: 'cont', ck: 'corpse', x: tx, y: ty, w: 1, h: 1 }); z.fx({ t: 'objUpdate', x: tx, y: ty, add: 'corpse' }); }
    this.world.events?.record(s, 'ex_slum_raid', `${R.name}で探索失敗（${{ death: '戦闘不能', mia: '行方不明', dc: '切断' }[cause] || cause}）`);
    ch.progress.extractions ||= []; ch.progress.extractions.push({ rid: r.rid, at: Date.now(), ok: false, cause, value: value(lost.filter(x => LOOT[x.ref])) }); I?.players.delete(ch.id); ch.raid = null;
    s.send({ t: 'raidResult', ok: false, cause, lost: lost.map(x => ({ name: x.name || LOOT[x.ref]?.name, n: x.n || 1 })), kept: kept.map(x => ({ name: LOOT[x.ref].name, n: x.n || 1 })), lostWeapon, insured: !!r.insured, rid: r.rid, tip: cause === 'death' ? (R.tier >= 4 ? '高危険度区域では装備を失う。武器に保険をかけるか、保険ポーチに貴重品を入れよう。' : '倒れると探索バッグの中身を失う。貴重品は保険ポーチ（2枠）へ。') : cause === 'mia' ? '制限時間内に脱出地点へ。残り5分で警告が出る。' : '接続が切れたまま探索が終了した。装備は失っていない。' });
    if (cause === 'mia' && a) { const dest = this.cityEntrance(R.city); this.world.enterZone(s, dest.z, dest.p); }
    this.world.sendSelf(s);
  }
  onDeath(s) { if (s.ch.raid) this.fail(s, 'death'); }
  onKill(z, m, killer) { const s = killer?.session; if (m.faction) { this.world.market.shift(z.inst.rid, m.faction, -0.6); if (s) this.world.slumQuest(s, { kind: 'faction', faction: m.faction }); } if (s?.ch.raid) s.ch.raid.kills++; const drops = []; if (Math.random() < 0.5) { const pool = Object.entries(LOOT).filter(([, it]) => ['material', 'mech', 'contraband', 'consumable'].includes(it.cat) && it.r <= 2 + (m.elite ? 2 : 0)); const [k, it] = pool[Math.floor(Math.random() * pool.length)]; drops.push({ kind: 'sloot', ref: k, n: 1, q: 1, prov: it.prov }); } if (m.convoy) drops.push({ kind: 'sloot', ref: 'parts', n: 1, q: 1, prov: 'illegal' }, { kind: 'sloot', ref: 'goldbar', n: 1, q: 1, prov: 'unknown' }); if (killer && drops.length) z.dropLoot(killer.session ? killer : killer, m.x, m.y, drops); }
  rejoin(s) { const r = s.ch.raid; const I = r && this.inst.get(r.inst); if (I && Date.now() < r.ends) { const z = this.zone(I, r.layer ?? 1); this.world.enterZone(s, z, r.pos || null); s.send({ t: 'toast', v: '探索に復帰した' }); return true; } if (r) { s.actor = s.actor || null; this.fail(s, 'dc'); } return false; }
  cleanup() { const now = Date.now(); for (const [id, I] of this.inst) { const active = Object.values(I.zones).some(k => this.world.zones.get(k)?.players.size); if (!active && now - I.created > (RAID_MINUTES + 3) * 60000) { for (const k of Object.values(I.zones)) this.world.zones.delete(k); this.inst.delete(id); } if (now - I.created > JOIN_WINDOW) I.closed = true; } }
  // ── slum NPC interaction (talk / trade / client job)
  talk(s, a) {
    const z = s.actor.zone; const F = FACTIONS[a.faction]; const I = z.inst; const lines = [`${F.name}：${F.desc}`];
    const act = I.active.map(k => EXITS[k]); lines.push(`噂じゃ今は「${act[Math.floor(Math.random() * act.length)].name}」が使えるらしい。`);
    if (I.events.length) lines.push(`今日は${EVENTS[I.events[0]].name}だ。${EVENTS[I.events[0]].desc}`);
    if (a.role === 'merchant' || a.role === 'trader') return this.world.openMarket(s, I.rid, { inraid: true, who: a.name });
    if (a.role === 'client') { s.ch.raid.client = true; return s.send({ t: 'open', service: 'lore', data: { title: a.name, text: '「封印された依頼品がどこかの箱に紛れ込んだ。見つけて持ち帰ってくれれば5,000G払う。脱出すれば勝手に届く手筈だ」' } }); }
    s.send({ t: 'open', service: 'lore', data: { title: a.name, text: lines[Math.floor(Math.random() * lines.length)] } });
  }
  // ── slum quests (board per region per day)
  board(ch, rid) {
    const d = clock().day; const r = rng(hash32(rid + ':sq:' + d)); const R = REGIONS[rid]; const out = []; const lootK = Object.keys(LOOT).filter(k => !['guildbox', 'deed', 'keyshard'].includes(k));
    const mk = (kind, o, desc, gold, guild) => out.push({ id: `${rid}_${d}_${out.length}`, rid, kind, ...o, desc, reward: { gold: Math.round(gold * (1 + R.tier * 0.4)), xp: Math.round(gold * 1.5), guild } });
    const it = lootK[Math.floor(r() * lootK.length)]; const n = 1 + Math.floor(r() * 3);
    mk('collect', { ref: it, n }, `${LOOT[it].name}を${n}個持ち帰る（脱出時に判定）`, 400 + LOOT[it].v * n * 0.6, 'explorers');
    mk('artifact', {}, 'レア度3以上の古代の遺物を持ち帰る', 1500, 'ancients');
    const ex = Object.keys(EXITS)[Math.floor(r() * 8)]; mk('exitvia', { via: ex }, `「${EXITS[ex].name}」から脱出する`, 900, 'infobrokers');
    const f = R.factions.filter(x => x !== 'dawn')[Math.floor(r() * (R.factions.length - (R.factions.includes('dawn') ? 1 : 0)))] || 'scavs'; mk('faction', { faction: f, n: 5 }, `${FACTIONS[f].name}の構成員を5人倒す`, 800, 'bounty');
    mk('sell', { n: 5 }, '闇市で戦利品を5個売る', 500, 'blackmarket'); mk('search', { n: 8 }, 'スラムで物資の箱を8つ調べる', 600, 'explorers');
    mk('hideout', { lv: 1 + Math.floor(r() * 2) }, '隠れ家を手に入れ、拡張する（段階' + (2 + Math.floor(r() * 2)) + '以上）', 2000, 'realestate');
    return out;
  }
  err(s, v) { s.send({ t: 'err', v }); }
}
export { weight, value };
