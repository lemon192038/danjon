// World: owns zones, sessions, parties, dungeon instances, NPC manager, progression hooks and menu operations.
import { Zone } from './zone.js';
import { Fighter } from './actor.js';
import { NpcManager } from './npc.js';
import { WORLD, T } from './maps.js';
import { DATA, WT_BY_ID } from '../data.js';
import { store } from '../store.js';
import { TICK_MS, DIFFICULTIES, STATS, TILE, SKILL_SLOTS } from '../../shared/constants.js';
import { weaponHistory, evolveRecipe, MASTERY_MILESTONES, masteryTitle, rerollTrait } from './progress.js';
import { rollArtifactMat, craftArtifact, artTrigger, ART_SLOTS, matName } from './artifacts.js';
import { categoryOf } from '../../shared/data/weaponTypes.js';
import { newCharacter, knownSkills, validateSlots, grantXp, grantMastery, grantJobXp, skillUsed, rollLoot, addItem, enhance, shopStock, ITEM_PRICES, questBoard, jobUnlockMet, uid, checkJobUnlocks } from './progress.js';
import { armorDef } from '../../shared/formulas.js';
import { STARTER_WEAPON_TYPES } from '../../shared/data/weaponTypes.js';
import { Life, clock, isOpen, season, temperature, setClockHour, setClockAt } from './life.js';
import { interiorRoles, findBuilding, HOME_TPL } from './city.js';
import { Guilds } from './guildsys.js';
import { Econ } from './econ.js';
import { ITEMS } from '../../shared/data/guilds.js';
import { CITIES, ROUTES, TRANSPORT, WEATHER } from '../../shared/data/cities.js';
import { Slum, regionOfCity, weight, value } from './slum.js';
import { Hideout } from './hideout.js';
import { Market } from './market.js';
import { EventEngine } from './events.js';
import { Orgs } from './orgs.js';
import { SlumEvents } from './slumevents.js';
import { Duels } from './duels.js';
import { Spells } from './spells.js';
import { BigEvents } from './bigevents.js';
import { Library } from './library.js';
import { CityEvents } from './cityevents.js';
import { StoryNpcs } from './storynpc.js';
import { Machina } from './machina.js';
import { Explore } from './explore.js';
import { Society } from './society.js';
import { STORY_NPCS } from '../../shared/data/sagas.js';
import { REGIONS, LOOT, LAYERS, FACTIONS, PROV, LOOT_CAT } from '../../shared/data/slum.js';
import { dangerAt, skeleton, SW, SH } from './slumgen.js';
export const isTown = z => z.kind === 'town' || z.kind === 'interior';

const day = () => Math.floor(Date.now() / 86400000);
export class World {
  constructor() {
    this.zones = new Map(); this.sessions = new Map(); this.parties = new Map(); this.tick = 0;
    this.life = new Life(this); this.life.rollWeather(); this.guilds = new Guilds(this); this.guildEvent = (s, ev) => this.guilds.event(s, ev);
    for (const id of Object.keys(WORLD)) { const z = new Zone(this, id, { kind: 'over' }); this.zones.set(id, z); if (z.kind === 'town') this.life.populate(id, z.map, interiorRoles); }
    this.life.step();
    this.market = new Market(store.worldState()?.market); this.events = new EventEngine(this, store.worldState()?.events); this.orgs = new Orgs(this, store.worldState()?.orgs); this.sev = new SlumEvents(this); this.sev.place(this.zones.get('gravel')); this.duels = new Duels(this); this.duels.placeGuide(this.zones.get('arcelia')); this.slum = new Slum(this); this.hideout = new Hideout(this);
    this.spells = new Spells(this); this.big = new BigEvents(this); this.library = new Library(this); this.cev = new CityEvents(this); this.cev.place(this.zones); this.machina = new Machina(this); this.machina.decorate(this.zones); this.explore = new Explore(this); this.explore.decorate(this.zones); this.big.decorate(this.zones);
    this.npcs = new NpcManager(this, store.worldState()); this.econ = new Econ(this, store.worldState()?.econ); this.home = { decorate: (z, ch) => this.econ.decorate(z, ch) };
    this.story = new StoryNpcs(this); this.society = new Society(this); this.society.place(this.zones);
    this.last = Date.now();
    setInterval(() => this.step(), TICK_MS);
    setInterval(() => this.npcs.abstractTick(), 1000);
    setInterval(() => this.saveAll(), 30000);
  }
  step() {
    const now = Date.now(); let dt = now - this.last; this.last = now; dt = Math.min(dt, 100);
    this.tick++;
    for (const [id, z] of this.zones) {
      const active = z.players.size > 0;
      if (!active && (z.kind === 'dungeon' || z.kind === 'interior' || z.kind === 'arena')) { if (!z.emptySince) z.emptySince = now; if (now - z.emptySince > (z.kind === 'dungeon' ? 60000 : 30000)) { for (const a of [...z.actors.values()]) if (a.cit) a.cit.actor = null; this.zones.delete(id); } continue; }
      if (active && (z.kind === 'town' || z.kind === 'interior') && !z.home && this.tick % 10 === 0) this.life.sync(z);
      z.emptySince = 0;
      if (!active && z.kind !== 'dungeon' && this.tick % 10) continue; // overworld LOD: idle zones simulate at 2Hz
      z.tick(active ? dt : dt * 10);
      if (active) this.broadcast(z);
      z.fxq.length = 0;
    }
    if (this.tick % 20 === 0) this.npcs.syncZones();
    if (this.tick % 20 === 0) this.life.step();
    if (this.tick % 40 === 0) this.econ.hourly();
    if (this.tick % 20 === 0) { this.market.step(); this.slum.cleanup(); }
    if (this.tick % 200 === 0) { this.events.simulate(); this.story.daily(); }
    if (this.tick % 20 === 0) { this.duels.sync(); this.big.observerSync(); this.big.calSync(); this.machina.sync(); }
    if (this.tick % 40 === 0) { const c = clock(); for (const ss of this.sessions.values()) { const cid = ss.actor?.zone.cityId || this.cityNear(ss.actor?.zone); const wx = cid ? this.life.weatherOf(cid) : 'clear'; ss.send({ t: 'env', h: c.hour, m: c.minute, wx, city: cid || null, se: season(c.day).name, temp: cid ? temperature(cid, wx, c) : null }); } }
    if (this.tick % 10 === 0) for (const s of this.sessions.values()) if (s.actor) { this.checkTiles(s); if (s.ch.raid) { this.slum.tickSession(s); if (!s.actor) continue; } if (!s.actor.dead && s.actor.hp < s.actor.maxHp * 0.3) artTrigger(s.actor, 'lowhp'); this.big.underwater(s); if (!s.actor) continue; if (s.dirty) { s.dirty = false; this.sendSelf(s); } }
  }
  broadcast(z) {
    const fx = z.fxq;
    for (const p of z.players) {
      const s = p.session; if (!s || s.ws.readyState !== 1) continue;
      if (s.ws.bufferedAmount > 512 * 1024) continue; // slow link: skip this snapshot instead of piling up data (the next one supersedes it)
      const snap = z.snapshot(p);
      const now = z.now; const cds = {}; for (const id of p.ch.skills.slots) if (id && p.cds[id] > now) cds[id] = Math.round(p.cds[id] - now);
      s.send({ t: 's', me: { id: p.id, x: Math.round(p.x), y: Math.round(p.y), hp: Math.round(p.hp), mhp: p.maxHp, sp: Math.round(p.sp), msp: p.maxSp, cds, g: p.gauge || null, alt: p.altMode ? 1 : 0, sh: p.shield ? Math.round(p.shield.amt) : 0, dead: p.dead ? 1 : 0, bm: Object.keys(p.buffMods).length ? p.buffMods : null, raid: p.ch.raid && z.kind === 'slum' ? this.raidHud(p.ch, z) : null }, ...snap, fx });
    }
  }
  // ---------- sessions
  attach(ws, account) { const s = { ws, account, send: o => { if (ws.readyState === 1) ws.send(JSON.stringify(o)); } }; return s; }
  play(s, cid) {
    const acc = store.account(s.account); if (!acc.chars.includes(cid)) return s.send({ t: 'err', v: 'キャラクターが見つかりません' });
    // close & save the previous connection FIRST, so the character we load includes everything up to this moment
    for (const o of [...this.sessions.values()]) if (o !== s && o.ch?.id === cid) { o.send({ t: 'kicked', v: '別の接続でログインしました' }); this.detach(o); o.ws.close(); }
    const ch = store.loadChar(cid); if (!ch) return s.send({ t: 'err', v: 'キャラクターが見つかりません' });
    migrate(ch); s.ch = ch; this.sessions.set(cid, s); this.econ.catchUp(ch);
    const zid = this.zones.has(ch.pos.zone) && WORLD[ch.pos.zone] ? ch.pos.zone : 'haven';
    if (!(ch.raid && this.slum.rejoin(s))) { this.enterZone(s, this.zones.get(zid), ch.pos.zone === zid ? ch.pos : null); if (ch.raid) this.slum.fail(s, 'dc'); }
    s.send({ t: 'chat', from: 'system', v: `ようこそ、${ch.name}。ABYSS : ETERNAL FRONTIER へ。` }); this.society.onLogin(s);
  }
  detach(s) {
    if (!s.ch) return;
    this.save(s); const party = this.partyOf(s.ch.id);
    if (s.actor) { s.actor.zone.remove(s.actor); }
    if (party) this.leaveParty(s.ch.id, true);
    this.sessions.delete(s.ch.id); s.actor = null;
  }
  save(s) {
    if (!s.ch) return; const z = s.actor?.zone;
    if (z?.kind === 'slum' && s.ch.raid) { s.ch.raid.pos = { x: Math.round(s.actor.x), y: Math.round(s.actor.y) }; s.ch.raid.layer = z.layer; s.ch.pos = { zone: z.cityId, x: null, y: null }; }
    else if (z) { if (z.kind === 'dungeon' || z.kind === 'arena') s.ch.pos = { zone: z.returnTo || 'haven', x: null, y: null }; else if (z.kind === 'interior') { const p = z.door ? this.zones.get(z.cityId).tileCenter([z.door.x, z.door.y + 1]) : null; s.ch.pos = { zone: z.cityId, x: p?.x ?? null, y: p?.y ?? null }; } else s.ch.pos = { zone: z.id, x: Math.round(s.actor.x), y: Math.round(s.actor.y) }; }
    store.saveChar(s.ch);
  }
  clockHour() { return clock().hour; }
  cityNear(z) { if (!z) return null; if (z.cityId) return z.cityId; if (z.returnTo) return z.returnTo; const l = WORLD[z.id]?.links; if (l) for (const v of Object.values(l)) if (WORLD[v]?.kind === 'town') return v; return null; }
  // ---------- buildings
  enterBuilding(s, door) {
    const z = s.actor.zone; const c = clock();
    if (door.hours && !isOpen(door.hours, c.hour)) return s.send({ t: 'err', v: `${door.name}は閉まっている（営業 ${door.hours[0]}:00〜${door.hours[1] % 24}:00）` });
    const own = door.home && (s.ch.homes || []).find(h => h.city === z.cityId && h.bldg === door.id);
    let key, opts; const b = findBuilding(z.cityId, door.id) || { id: door.id, name: door.name, t: door.t, size: 'S' };
    if (own) { const shop = own.use === 'shop'; key = `home:${s.ch.id}:${door.id}`; opts = { kind: 'interior', city: z.cityId, bldg: shop ? { ...b, t: 'shop', size: 'M', name: (s.ch.shops || []).find(x => x.bldg === door.id)?.name || '自分の店' } : { ...b, name: HOME_TPL[own.tier].name }, door, homeTier: shop ? null : own.tier, home: { owner: s.ch.id, ownerName: s.ch.name, tier: own.tier, shop } }; }
    else { key = `in:${door.id}`; opts = { kind: 'interior', city: z.cityId, bldg: b, door }; }
    let iz = this.zones.get(key); if (!iz) { iz = new Zone(this, key, opts); this.zones.set(key, iz); }
    if (iz.home) this.home?.decorate(iz, s.ch);
    s.send({ t: 'loading', v: door.name }); this.enterZone(s, iz, door.id === 'ar_biglib' ? this.library.libraryPos(s, iz) : null);
  }
  useObject(s, z, o) {
    const b = z.bldgId ? findBuilding(z.cityId, z.bldgId) : null;
    if (!z.home && ['lectern', 'circle', 'telescope', 'alembic'].includes(o.k) && this.spells.atLab(s)) return this.spells.open(s); // research desks
    switch (o.k) {
      case 'node': return this.econ.gather(s, z, o);
      case 'board': return b?.guild ? this.guilds.open(s, b.guild) : this.openService(s, 'quest');
      case 'altar': if (z.home) return false; return this.openAltar(s, b);
      case 'bookcase': case 'lectern': case 'statue': case 'display': case 'telescope': case 'globe': if (z.home) return false; if (o.k === 'bookcase' || o.k === 'lectern') this.big.readBook(s); return this.econ.lore(s, b?.lore || `${z.id}:${o.k}`, z);
      case 'vault': return this.econ.openBank(s);
      case 'slot': case 'roulette': return this.econ.services.casino(s);
      case 'forge': return s.send({ t: 'open', service: 'craft', data: { cost: 200 + s.ch.level * 15, rank: s.ch.guilds?.smiths?.rank || 0 } });
      case 'bed': case 'chest': case 'kitchen': return z.home ? this.econ.openHome(s) : false;
      case 'myshop': return this.econ.openMyShop(s, z);
      case 'cont': if (z.kind === 'slum' && s.ch.raid) return this.slum.search(s, z, o); return false;
      case 'ladder': if (z.kind === 'slum' && s.ch.raid) return this.slum.ladder(s, o); return false;
      case 'exit': if (z.kind === 'slum' && s.ch.raid) return this.slum.exitCheck(s, z, o); return false;
      case 'entry': if (z.kind !== 'slum' || !s.ch.raid) return false; if (REGIONS[z.inst.rid].tier <= 1 || Date.now() - s.ch.raid.started < 120000) return this.slum.exitCheck(s, z, { type: 'entry' }); return s.send({ t: 'err', v: '入口は封鎖された。脱出地点を探せ（地図：M）' });
      case 'hideout': if (z.kind !== 'slum' || !s.ch.raid) return false; if (s.ch.hideout?.rid !== z.inst.rid) return s.send({ t: 'err', v: 'ここは誰かの隠れ家への抜け道だ（この地域に隠れ家を持てば脱出口になる）' }); return this.slum.exitCheck(s, z, { type: 'hideout' });
      case 'fac': if (z.hideout === s.ch.id) return this.hideout.use(s, o.f); return false;
      case 'hstore': if (z.hideout === s.ch.id) return this.hideout.view(s); return false;
    }
    if (o.k === 'machinecore') return this.machina.observe(s, o);
    if (['deepmarker', 'withersample', 'deadtree', 'statue17', 'hiddenruin', 'moonlake', 'lantern', 'ghoststation'].includes(o.k)) return this.explore.useObject(s, z, o);
    return this.big.useObject(s, z, o);
  }
  exitBuilding(s) { const z = s.actor.zone; const cz = this.zones.get(z.cityId); this.enterZone(s, cz, z.door ? cz.tileCenter([z.door.x, z.door.y + 1]) : null); }
  saveAll() { for (const s of this.sessions.values()) this.save(s); store.saveWorldState({ npcs: this.npcs.list.map(n => ({ ...n, actorId: null })), econ: this.econ.saveState(), market: this.market.save(), events: this.events.save(), orgs: this.orgs.save() }); }
  enterZone(s, z, pos) {
    const old = s.actor;
    let hp = 1, sp = 1; if (old) { hp = old.hp / old.maxHp; sp = old.sp / old.maxSp; old.zone.remove(old); if (old.dead) hp = 1; }
    const a = new Fighter(s.ch, { kind: 'player', team: 'ally', session: s, look: s.ch.look });
    a.hp = Math.max(1, Math.round(a.maxHp * hp)); a.sp = Math.round(a.maxSp * sp);
    a.onSkillUsed = sk => skillUsed(s.ch, sk.id, n => this.note(s, n));
    const p = pos?.x != null ? pos : z.tileCenter(z.map.start); a.x = p.x; a.y = p.y;
    if (z.blocked(a.x, a.y)) { const st = z.tileCenter(z.map.start); a.x = st.x; a.y = st.y; }
    if (z.kind === 'slum') a.team = this.slum.teamFor(s, z);
    z.add(a); s.actor = a; s.zone = z;
    if (z.kind === 'town' || z.kind === 'field') s.ch.pos = { zone: z.id, x: null, y: null };
    if (z.cityId) { s.ch.progress.visited ||= []; if (!s.ch.progress.visited.includes(z.cityId)) { s.ch.progress.visited.push(z.cityId); this.note(s, { t: 'msg', v: `新しい都市を訪れた：${CITIES[z.cityId].name}` }); this.guildEvent?.(s, { kind: 'visit', city: z.cityId }); } }
    const c = clock(); const cid = z.cityId || this.cityNear(z);
    const owned = new Set((s.ch.homes || []).filter(h => h.city === z.cityId).map(h => h.bldg));
    s.send({ t: 'zone', cityId: z.cityId || null, doors: (z.map.doors || []).map(d => ({ ...d, mine: owned.has(d.id) })), stops: z.map.stops || [], plazas: z.map.plazas || [], props: z.map.props || [], objects: z.map.objects || [], floorTile: z.map.floor || null, wallCol: z.map.wallCol || null, clock: { h: c.hour, m: c.minute }, wx: cid ? this.life.weatherOf(cid) : 'clear', home: z.home ? { owner: z.home.owner, slots: z.map.slots } : null, exit: z.map.exit || null, id: z.id, name: z.name, kind: z.kind, w: z.map.w, h: z.map.h, tiles: Buffer.from(z.map.tiles).toString('base64'), pal: z.map.pal, lights: z.map.lights, npcs: z.map.npcs || [], gates: z.map.gates || [], exits: z.map.exits || [], darkness: !!z.darkness, curses: z.curses?.list || [], floor: z.floor || 0, diff: z.diff || null, dungeon: z.dungeon?.id || null, stairsOpen: z.map.stairsOpen, gim: z.gim, slum: z.kind === 'slum' ? this.slumInfo(s, z) : null, hideout: z.hideout ? { owner: z.hideout } : null });
    this.sendSelf(s);
    // party NPCs follow the player
    for (const nid of this.partyOf(s.ch.id)?.npcs || []) { const n = this.npcs.byId.get(nid); if (!n) continue; this.npcs.despawn(n); this.npcs.spawn(n, z, { x: a.x + 12, y: a.y + 10 }); const na = n.actorId && z.actors.get(n.actorId); if (na) na.team = a.team; }
    if (z.kind === 'dungeon') { this.onFloorReached(s, z); this.big.onFloor(s, z); this.library.onEnterSealed(s, z); this.cev.onFloor(s, z, false); }
    this.cev.onEnterZone(s, z); this.society?.onEnterZone(s, z);
    if (z.kind === 'field') this.big.onEnterField(s, z);
  }
  // story NPCs: their own event panel, or the event whose current step needs them, or a plain talk with their current line
  storyTalk(s, c) { const id = c.story, S = STORY_NPCS[id]; if (S.ev) return this.cev.open(s, S.ev);
    for (const [ev, P] of Object.entries(s.ch.events?.prog || {})) { if (P.done) continue; const st = this.cev.stepOf?.(ev, P.stage); if ((st?.k === 'meet' && st.npc === id) || st?.at === id) return this.cev.open(s, ev); }
    s.send({ t: 'open', service: 'resident', data: { id: c.id, name: c.name, job: c.job, pers: '—', line: this.story.line(id, s.ch), guild: null, family: null } }); }
  sendSelf(s) {
    const a = s.actor; validateSlots(s.ch); a?.refreshStats();
    const st = a.stats;
    s.send({ t: 'self', ch: s.ch, d: { atk: st.atk, matk: st.matk, def: st.def, maxHp: st.maxHp, maxSp: st.maxSp, crit: st.crit, critDmg: st.critDmg, aspd: st.aspd, move: st.move, dr: st.dr, cdr: st.cdr, st: st.st, wt: st.wt, affinity: st.affinity, mods: st.mods }, known: knownSkills(s.ch), party: this.partyView(s.ch.id), cs: this.spells?.customOf(s.ch) || null });
  }
  note(s, n) { s.send({ ...n, k: n.t, t: 'note' }); s.dirty = true; }
  // ---------- per-tick interaction checks (tiles)
  checkTiles(s) {
    const a = s.actor, z = a.zone; if (a.dead) return;
    const tx = Math.floor(a.x / TILE), ty = Math.floor(a.y / TILE); const tile = z.map.tiles[ty * z.map.w + tx];
    if (tile === T.EXIT) {
      if (z.kind === 'dungeon') return; // dungeon exits require interaction + confirmation
      const ex = z.map.exits.find(e => Math.abs(e.x - tx) <= 2 && Math.abs(e.y - ty) <= 2); if (!ex) return;
      const to = this.zones.get(ex.to); const back = to.map.exits.find(e => e.to === z.id);
      const p = back ? to.tileCenter([back.x + (back.dir === 'east' ? -3 : back.dir === 'west' ? 3 : 0), back.y + (back.dir === 'south' ? -3 : back.dir === 'north' ? 3 : 0)]) : null;
      this.enterZone(s, to, p);
    } else if (tile === T.STAIRS && z.kind === 'dungeon' && z.map.stairsOpen) this.nextFloor(s, z);
    else if (tile === T.MAT && (z.kind === 'interior' || z.kind === 'arena')) { if ((z.bout && !z.bout.done) || (z.arena && !z.arena.duel && !z.arena.done && !z.bout)) { if (!s.matWarn || Date.now() - s.matWarn > 4000) { s.matWarn = Date.now(); s.send({ t: 'toast', v: '決闘中は闘技場から出られない' }); } return; } if (z.kind === 'arena') this.econ?.leaveArena(s); else this.exitBuilding(s); }
    // auto pickup drops
    // iterate over a snapshot: picking up can drop items again (overweight), which must never be re-picked in the same pass
    for (const d of [...z.drops]) if (!d.chest && d.owner === a.id && d.until > z.now && Math.hypot(d.x - a.x, d.y - a.y) < 18) { if (d.it.kind === 'sloot') { if (!s.ch.raid) continue; const { kind, ...it } = d.it; void kind; if (!this.slum.hasRoom(s.ch, it)) { if (!d.warned) { d.warned = 1; s.send({ t: 'toast', v: `重量オーバーで${this.slum.lootName(it)}を拾えない（バッグ [G] で捨てるか保険ポーチへ）` }); } continue; } d.until = 0; this.slum.toBag(s, it, z); continue; } d.until = 0; addItem(s.ch, d.it, n => this.note(s, n)); }
  }
  // ---------- dungeon flow
  enterDungeon(s, dId, diff, floor) {
    const d = DATA.dungeons.get(dId); if (!d || !DIFFICULTIES.some(x => x.id === diff)) return;
    if (d.id === 'sunken' && !this.events.prog(s.ch, 'ev_sunken')) return s.send({ t: 'err', v: '沈没王国への道はまだ見つかっていない' });
    if (d.id === 'luna' && !this.events.isDone(s.ch, 'ev_blackmoon')) return s.send({ t: 'err', v: '月面転移門は閉ざされている' });
    if (d.maxFloor && floor > d.maxFloor) floor = 1;
    if (!this.cev.canEnterDungeon(s, d)) return;
    if (d.hardOnly && !['HARD', 'HELL', 'ABYSS'].includes(diff)) return s.send({ t: 'err', v: `${d.name}はHARD以上でのみ挑める` });
    const best = s.ch.progress.clears[dId]?.[diff] || 0;
    if (floor !== 1 && (floor - 1) % 10 !== 0) floor = 1; if (floor > best + 1) floor = 1;
    if (diff === 'ABYSS' && !(s.ch.progress.clears[dId]?.HELL >= 100) && s.ch.level < 150) return s.send({ t: 'err', v: 'ABYSSはHELL100階踏破またはLv150以上で解放されます' });
    if (diff === 'HELL' && !(s.ch.progress.clears[dId]?.HARD >= 50) && s.ch.level < 80) return s.send({ t: 'err', v: 'HELLはHARD50階踏破またはLv80以上で解放されます' });
    // return point: interiors are freed when empty, so remember the city and the door instead of the interior itself
    const cz = s.actor.zone; let ret = cz.id, retPos = null;
    if (cz.kind === 'dungeon') { ret = cz.returnTo; retPos = cz.returnPos; } else if (cz.kind === 'interior' && cz.cityId) { ret = cz.cityId; const cty = this.zones.get(cz.cityId); if (cz.door && cty) retPos = cty.tileCenter([cz.door.x, cz.door.y + 1]); }
    const members = this.partyMembersHere(s);
    const key = this.partyOf(s.ch.id)?.id || s.ch.id;
    const z = this.instance(key, dId, diff, floor); z.returnTo = ret; z.returnPos = retPos;
    for (const m of members) this.enterZone(m, z);
  }
  instance(key, dId, diff, floor) { const id = `dg:${key}:${dId}:${diff}:${floor}`; let z = this.zones.get(id); if (!z) { z = new Zone(this, id, { kind: 'dungeon', dungeon: dId, diff, floor }); this.zones.set(id, z); } return z; }
  partyMembersHere(s) { const p = this.partyOf(s.ch.id); if (!p) return [s]; return p.members.map(id => this.sessions.get(id)).filter(m => m?.actor && m.actor.zone === s.actor.zone); }
  nextFloor(s, z) {
    if (z.floor >= (z.dungeon.maxFloor || 100)) { this.leaveDungeon(s); return; }
    const nz = this.instance(this.partyOf(s.ch.id)?.id || s.ch.id, z.dungeon.id, z.diff, z.floor + 1); nz.returnTo = z.returnTo; nz.returnPos = z.returnPos;
    for (const m of [...z.players].map(p => p.session)) this.enterZone(m, nz);
  }
  leaveDungeon(s) { const z = s.actor.zone; let to = this.zones.get(z.returnTo), pos = z.returnPos || null;
    if (!to && String(z.returnTo).startsWith('in:')) { const did = z.returnTo.slice(3); for (const tz of this.zones.values()) { const d = tz.kind === 'town' && (tz.map.doors || []).find(x => x.id === did); if (d) { to = tz; pos = tz.tileCenter([d.x, d.y + 1]); break; } } }
    if (!to || to.kind === 'dungeon' || to.kind === 'arena') { to = this.zones.get(this.cityNear(z)) || this.zones.get('haven'); pos = null; } // freed or invalid return zone: go to the nearest town
    if (!pos) { const g = (to.map.gates || []).find(g => g.dungeon === z.dungeon?.id); pos = g ? to.tileCenter([g.x, g.y + 2]) : null; }
    this.enterZone(s, to, pos); }
  onFloorReached(s, z) {
    const c = s.ch.progress.clears[z.dungeon.id] ||= {};
    const reached = z.floor - 1; if (reached > (c[z.diff] || 0)) c[z.diff] = reached;
    c.max = Math.max(c.max || 0, ...Object.values(c).filter(v => typeof v === 'number'));
    if (z.diff === 'ABYSS') s.ch.progress.abyssMax = Math.max(s.ch.progress.abyssMax, z.floor);
    this.questCheck(s, { kind: 'floor', dungeon: z.dungeon.id, floor: z.floor, diff: z.diff }); this.guilds.event(s, { kind: 'floor', dungeon: z.dungeon.id, floor: z.floor }); this.econ.storyEvent(s, { kind: 'floor', dungeon: z.dungeon.id, floor: z.floor });
    checkJobUnlocks(s.ch, n => this.note(s, n));
  }
  onMonsterKilled(z, m, killer) {
    const fighters = [...z.actors.values()].filter(a => (a.kind === 'player' || a.kind === 'npc') && !a.dead && Math.hypot(a.x - m.x, a.y - m.y) < 600);
    const bonus = 1 + 0.1 * Math.max(0, fighters.length - 1);
    for (const f of fighters) {
      const ch = f.ch; const mods = f.stats.mods; const s = f.session;
      const notify = s ? n => this.note(s, n) : null;
      const lvGap = (m.level || 1) - ch.level; const gapMul = Math.max(0.1, Math.min(1.5, 1 + lvGap * 0.05));
      grantXp(ch, m.xp * gapMul * bonus * (1 + (mods.xp || 0)), notify);
      grantMastery(ch, f.wt.id, Math.round((3 + (m.level || 1) * 0.4) * (m.boss ? 10 : m.elite ? 3 : 1) * (1 + (mods.masteryXp || 0))), notify);
      grantJobXp(ch, Math.round((2 + (m.level || 1) * 0.3) * (m.boss ? 10 : 1)), notify);
      if (f.npc) { f.npc.gold += m.gold; if (f.npc.partyWith) f.npc.bond[f.npc.partyWith] = Math.min(100, (f.npc.bond[f.npc.partyWith] || 0) + 0.2); continue; }
      if (weaponHistory(ch, { kill: true, fam: m.fam }, notify)) this.unnamedArms(s);
      ch.gold += Math.round(m.gold * (1 + (mods.gold || 0))); ch.progress.kills++; s.dirty = true; ch.progress.famKills[m.fam] = (ch.progress.famKills[m.fam] || 0) + 1;
      const floor = z.floor || Math.round((m.level || 1) * 0.8);
      const loot = z.kind === 'slum' ? [] : rollLoot({ floor, diff: z.diff || 'NORMAL', boss: false, luck: mods.drop ? mods.drop * 0.03 : 0, preferWt: f.wt.id });
      if (loot.length) z.dropLoot(f, m.x, m.y, loot);
      this.questCheck(s, { kind: 'kill', fam: m.fam }); this.sev.onKill(s, m); this.guilds.event(s, { kind: 'kill', fam: m.fam, elite: !!m.elite }); this.econ.monsterMat(s, m); this.spells.dropFor(s, z, m); this.cev.onKill(s, m, f); this.machina.onKilled(s, m); this.society.onKill(s, m, z); if (this.big.bmActive() && Math.random() < 0.03) { addItem(ch, { kind: 'mat', ref: 'moonShard', n: 1 }); this.note(s, { t: 'msg', v: '月影の欠片を手に入れた' }); } this.econ.requestKill(s, m.fam); this.econ.storyEvent(s, { kind: 'kill', fam: m.fam });
    }
    if (z.duel) { if (m.duelBoss) { if (z.duel.cev) this.cev.onDuelKill(z); else this.sev.onDuelKill(z); } } else if (z.arena) this.econ.arenaKill(z);
    if (z.kind === 'slum') this.slum.onKill(z, m, killer?.kind === 'player' ? killer : [...z.players][0]);
    for (const p of z.players) { const pt = this.partyOf(p.ch.id); for (const nid of pt?.npcs || []) { const n = this.npcs.byId.get(nid); if (n) p.ch.progress.npcBond[nid] = n.bond[p.ch.id] = Math.min(100, (n.bond[p.ch.id] || 0) + 0.2); } }
  }
  onBossKilled(z, b) {
    for (const p of z.players) {
      const s = p.session; const ch = p.ch; const diff = z.diff || 'NORMAL';
      ch.progress.bossKills[diff] = (ch.progress.bossKills[diff] || 0) + 1; if (weaponHistory(ch, { boss: true, floor: z.floor }, n => this.note(s, n))) this.unnamedArms(s);
      const di = DIFFICULTIES.findIndex(d => d.id === diff);
      const myth = diff === 'ABYSS' ? 0.08 + z.floor * 0.003 : diff === 'HELL' && z.floor >= 50 ? 0.03 : 0;
      z.dropLoot(p, b.x, b.y, rollLoot({ floor: z.floor, diff, boss: true, mythChance: myth, preferWt: p.wt.id }));
      if (z.floor % 10 === 0) this.events.record(s, 'ex_dungeons', `${z.dungeon.name} ${z.floor}階 [${diff}] のボスを討伐`, { clear: true });
      if (z.floor === (z.dungeon.maxFloor || 100) && !ch.progress.titles.includes(z.dungeon.name + '踏破者')) { ch.progress.titles.push(z.dungeon.name + '踏破者'); this.note(s, { t: 'title', v: z.dungeon.name + '踏破者' }); }
      this.questCheck(s, { kind: 'boss', dungeon: z.dungeon.id, floor: z.floor, diff }); this.guilds.event(s, { kind: 'boss', dungeon: z.dungeon.id, floor: z.floor });
      const c = ch.progress.clears[z.dungeon.id] ||= {}; if (z.floor > (c[diff] || 0)) c[diff] = z.floor; c.max = Math.max(c.max || 0, z.floor);
      if (['HARD', 'HELL', 'ABYSS'].includes(diff) && z.floor >= 50) { addItem(ch, { kind: 'mat', ref: 'traitTicket', n: 2 }); this.note(s, { t: 'msg', v: '特性変更チケット×2を手に入れた' }); }
      const am = rollArtifactMat(z, ch); if (am) this.note(s, { t: 'msg', v: `アーティファクト素材：${matName(am)}（${z.dungeon.name} ${z.floor}F ${diff}）を手に入れた` });
      this.big.onSunkenBoss(s, z); this.big.onLunaBoss(s, z); this.big.onBoss(); this.library.onBossKilled(s, z); this.cev.onFloor(s, z, true);
      checkJobUnlocks(ch, n => this.note(s, n));
      this.sendSelf(s);
      void di;
    }
    for (const n of this.npcs.list) if (n.actorZone === z.id && n.partyWith) this.npcs.log(n, `${z.dungeon.name}${z.floor}階のボス「${b.name}」を討伐した`);
  }
  onFighterDied(z, a) {
    if (a.kind === 'duelist') return this.duels.onDuelistDown(z, a);
    if (a.kind === 'player') { if (z.bout) this.duels.onPlayerDown(z, a.session); a.ch.progress.deaths++; this.note(a.session, { t: 'dead' }); if (z.kind === 'slum') this.slum.onDeath(a.session); if (z.kind === 'dungeon') a.ch.gold = Math.floor(a.ch.gold * 0.95); }
    else if (a.npc) { const n = a.npc; this.npcs.log(n, '戦闘不能になり街へ戻った'); z.schedule(z.now + 1500, () => z.remove(a)); n.actorId = null; const owner = n.partyWith; if (owner) { const p = this.partyOf(owner); if (p) p.npcs = p.npcs.filter(x => x !== n.id); this.pushParty(owner); } this.npcs.leaveParty(n); }
  }
  respawn(s) {
    const a = s.actor; if (!a?.dead) return;
    const z = a.zone; const town = this.cityNear(z) || 'haven';
    const tz = this.zones.get(WORLD[town]?.kind === 'town' ? town : 'haven');
    a.dead = false; this.enterZone(s, tz); s.actor.hp = s.actor.maxHp;
  }
  // ---------- quests
  questCheck(s, ev) {
    if (!s) return; const qs = s.ch.progress.quests;
    for (const [id, q] of Object.entries(qs)) {
      if (q.done) continue; const d = q.def;
      if (d.kind === 'kill' && ev.kind === 'kill' && ev.fam === d.fam) q.prog = (q.prog || 0) + 1;
      if (d.kind === ev.kind && (d.kind === 'floor' || d.kind === 'boss') && ev.dungeon === d.dungeon && ev.floor >= d.floor && (!d.diff || DIFFICULTIES.findIndex(x => x.id === ev.diff) >= DIFFICULTIES.findIndex(x => x.id === d.diff))) q.prog = d.n || 1;
      if ((q.prog || 0) >= (d.n || 1) && !q.ready) { q.ready = true; this.note(s, { t: 'quest', v: `クエスト「${d.name}」達成！掲示板で報告しよう` }); }
    }
  }
  // ---------- parties
  partyOf(cid) { for (const p of this.parties.values()) if (p.members.includes(cid)) return p; return null; }
  partyView(cid) { const p = this.partyOf(cid); if (!p) return null; return { id: p.id, leader: p.leader, members: p.members.map(id => ({ id, name: this.sessions.get(id)?.ch.name || '?', lv: this.sessions.get(id)?.ch.level })), npcs: p.npcs.map(id => ({ id, name: this.npcs.byId.get(id)?.ch.name, lv: this.npcs.byId.get(id)?.ch.level })) }; }
  pushParty(cid) { const p = this.partyOf(cid); const ids = p ? p.members : [cid]; for (const id of ids) { const s = this.sessions.get(id); s?.send({ t: 'party', v: this.partyView(id) }); } }
  ensureParty(cid) { let p = this.partyOf(cid); if (!p) { p = { id: 'p' + uid(), leader: cid, members: [cid], npcs: [], invites: new Set() }; this.parties.set(p.id, p); } return p; }
  leaveParty(cid, silent) {
    const p = this.partyOf(cid); if (!p) return;
    p.members = p.members.filter(m => m !== cid);
    if (p.leader === cid) { for (const nid of p.npcs) { const n = this.npcs.byId.get(nid); if (n) { this.npcs.despawn(n); this.npcs.leaveParty(n); } } p.npcs = []; p.leader = p.members[0]; }
    if (!p.members.length) this.parties.delete(p.id);
    for (const m of p.members) this.pushParty(m); if (!silent) this.pushParty(cid);
  }
  openAltar(s, b) { const ch = s.ch; s.send({ t: 'open', service: 'altar', data: { tickets: ch.inventory.filter(i => i.ref === 'traitTicket').reduce((t, i) => t + i.n, 0), lore: b?.lore ? true : false, weapons: ch.inventory.filter(i => i.kind === 'weapon').map(i => { const w = DATA.weapons.get(i.ref); return { uid: i.uid, name: w.name, rar: w.rar, plus: i.plus || 0, fav: !!i.fav, eq: ch.equip.weapon === i.uid, traits: i.traits || w.traits }; }).filter(x => x.traits.length) } }); }
  // 名もなき武器: the first epithet starts and completes the event; later epithets are logged
  unnamedArms(s) { const E = this.events; const it = s.ch.inventory.find(i => i.uid === s.ch.equip.weapon); const nm = `${DATA.weapons.get(it.ref)?.name}「${it.epi.name}」`;
    if (!E.prog(s.ch, 'lg_unnamed_arms')) { E.start(s, 'lg_unnamed_arms', { silent: true }); E.advance(s, 'lg_unnamed_arms', 1, { silent: true }); E.complete(s, 'lg_unnamed_arms', null, { silent: true }); E.grant(s, 'lg_unnamed_arms', 'first', { title: '武器に刻む者' }); }
    E.record(s, 'lg_unnamed_arms', `二つ名を得た：${nm}`, { clear: true }); }
  // ---------- slum / market / hideout glue
  raidHud(ch, z) { const r = ch.raid; return { t: Math.max(0, Math.round((r.ends - Date.now()) / 1000)), w: weight(r.bag), cap: this.slum.capacity(ch), v: value(r.bag) + value(r.pouch), n: r.bag.length, pn: r.pouch.length, L: z.layer, ex: r.extracting ? Math.max(0, Math.round((r.extracting.until - Date.now()) / 100) / 10) : null }; }
  slumInfo(s, z) {
    const I = z.inst; const R = REGIONS[I.rid]; const sk = skeleton(I.rid); const grid = [];
    for (let y = 0; y < SH; y += 8) { const row = []; for (let x = 0; x < SW; x += 8) row.push(dangerAt(R.tier, z.layer, x + 4, y + 4, sk.entry[0], sk.entry[1])); grid.push(row); }
    const key = I.rid + ':' + z.layer; s.ch.progress.slumMap ||= {}; s.ch.progress.slumMap[key] = 1;
    return { rid: I.rid, region: R.name, tier: R.tier, layer: z.layer, layers: LAYERS.map(l => l.name), danger: grid, cell: 8, events: I.events, fixedMap: !!s.ch.hideout?.fac?.maptable, pvp: R.tier >= 3, team: s.actor?.team, factions: R.factions.map(f => ({ k: f, name: FACTIONS[f].name, rep: FACTIONS[f].guild || FACTIONS[f].org ? Math.round(this.slum.repOf(s.ch, f)) : null, hostileBelow: FACTIONS[f].hostileBelow })) };
  }
  slumQuest(s, ev) {
    const ch = s.ch; ch.squests ||= {}; this.sev?.onRaid(s, ev);
    for (const q of Object.values(ch.squests)) {
      if (q.ready) continue; let inc = 0;
      if (q.kind === 'search' && ev.kind === 'search') inc = 1;
      if (q.kind === 'faction' && ev.kind === 'faction' && ev.faction === q.faction) inc = 1;
      if (q.kind === 'sell' && ev.kind === 'sell') inc = ev.n || 1;
      if (q.kind === 'hideout' && ev.kind === 'hideout' && (ch.hideout?.lv ?? -1) + 1 >= q.lv + 1) inc = 99;
      if (ev.kind === 'extract' && ev.rid === q.rid) {
        if (q.kind === 'collect') inc = ev.items.filter(i => i.ref === q.ref).reduce((a, i) => a + (i.n || 1), 0);
        if (q.kind === 'artifact' && ev.items.some(i => LOOT[i.ref].cat === 'artifact' && LOOT[i.ref].r >= 3)) inc = 99;
        if (q.kind === 'exitvia' && ev.via === q.via) inc = 99;
      }
      if (inc) { q.prog = Math.min(q.n || 1, (q.prog || 0) + inc); if (q.prog >= (q.n || 1)) { q.ready = true; this.note(s, { t: 'quest', v: `スラム依頼「${q.desc}」達成！入口で報告しよう` }); } }
    }
    if (ev.kind === 'extract' && ch.raid?.client && ev.items.some(i => i.ref === 'guildbox')) { ch.gold += 5000; const it = ch.inventory.find(i => i.kind === 'loot' && i.ref === 'guildbox'); if (it) { it.n--; if (it.n <= 0) ch.inventory = ch.inventory.filter(i => i !== it); } this.note(s, { t: 'msg', v: '謎の依頼人から5,000Gが届いた' }); }
  }
  slumMenu(s, m) {
    const ch = s.ch, a = s.actor; const err = v => s.send({ t: 'err', v });
    switch (m.act) {
      case 'start': if (a.zone.kind !== 'interior' || !a.zone.map.npcs?.some(n => n.service === 'slum')) return err('スラム深部への入口から潜入できます'); return this.slum.start(s, { insure: !!m.insure });
      case 'bag': return this.slum.bagView(s);
      case 'pouch': this.slum.pouch(s, m.i | 0, !!m.to); return;
      case 'drop': return this.slum.drop(s, m.i | 0);
      case 'accept': { const rid = regionOfCity(a.zone.cityId); const q = this.slum.board(ch, rid).find(x => x.id === m.id); ch.squests ||= {}; if (!q || ch.squests[q.id]) return; if (Object.keys(ch.squests).length >= 5) return err('スラム依頼は5件まで'); ch.squests[q.id] = { ...q, prog: 0 }; if (q.kind === 'hideout' && ch.hideout && ch.hideout.lv + 1 >= q.lv + 1) { ch.squests[q.id].ready = true; } s.send({ t: 'toast', v: '依頼を受けた' }); return this.slum.open(s, a.zone, null); }
      case 'turnin': { const q = ch.squests?.[m.id]; if (!q?.ready) return err('未達成です'); delete ch.squests[m.id]; ch.gold += q.reward.gold; grantXp(ch, q.reward.xp, n => this.note(s, n)); if (q.reward.guild) this.guilds.addRep(ch, q.reward.guild, 3); this.sendSelf(s); s.send({ t: 'toast', v: `報酬 ${q.reward.gold}G` }); return this.slum.open(s, a.zone, null); }
      case 'abandon': if (ch.squests) delete ch.squests[m.id]; return this.slum.open(s, a.zone, null);
      case 'hideout': return ch.hideout ? (ch.hideout.rid === regionOfCity(a.zone.cityId) ? this.hideout.enter(s) : err(`隠れ家は${REGIONS[ch.hideout.rid].name}にある`)) : this.hideout.view(s);
    }
  }
  // market view: region prices + the player's loot with prices per channel (black / regular / guild / fence) and laundering
  openMarket(s, rid, opts = {}) {
    rid ||= regionOfCity(s.actor.zone.cityId) || 'haven_old'; const ch = s.ch; const v = this.market.view(rid); const inraid = !!opts.inraid;
    const items = inraid ? ch.raid.bag.map((it, i) => ({ i, ...it, name: LOOT[it.ref].name, prov: it.prov, provName: PROV[it.prov], black: this.market.sellPrice(rid, it, 'black'), cat: LOOT_CAT[LOOT[it.ref].cat], r: LOOT[it.ref].r, w: LOOT[it.ref].w }))
      : ch.inventory.filter(i => i.kind === 'loot').map(it => ({ uid: it.uid, ...it, name: LOOT[it.ref].name, provName: PROV[it.prov], cat: LOOT_CAT[LOOT[it.ref].cat], r: LOOT[it.ref].r, black: this.market.sellPrice(rid, it, opts.fence ? 'fence' : 'black'), regular: this.market.sellPrice(rid, it, 'regular'), guild: this.market.sellPrice(rid, it, 'guild'), guildName: this.market.guildFor(it.ref) }));
    s.send({ t: 'open', service: 'market', data: { ...v, who: opts.who || '闇市', inraid, fence: !!opts.fence, mine: items, gold: ch.gold, launder: inraid ? null : { pawn: 0.35, appraise: 0.15, fence: 0.25 } } });
  }
  marketMenu(s, m) {
    const ch = s.ch, a = s.actor, z = a.zone; const err = v => s.send({ t: 'err', v }); const inraid = z.kind === 'slum' && !!ch.raid;
    const rid = inraid ? z.inst.rid : m.fence ? ch.hideout?.rid : regionOfCity(z.cityId); if (!rid) return;
    const atBlack = inraid ? [...z.actors.values()].some(o => o.kind === 'slumnpc' && (o.role === 'merchant' || o.role === 'trader') && Math.hypot(o.x - a.x, o.y - a.y) < 60) : (z.map.npcs || []).some(n => ['blackmarket', 'slum', 'hfence'].includes(n.service)) || z.hideout === ch.id;
    if (!atBlack && m.act !== 'view') return err('闇商人の近くで取引してください');
    const role = this.slum.role(ch);
    switch (m.act) {
      case 'view': return this.openMarket(s, rid, { inraid, fence: !!m.fence });
      case 'sell': {
        if (inraid) { const it = ch.raid.bag[m.i | 0]; if (!it) return; const p = Math.round(this.market.sellPrice(rid, it, 'black') * 0.85 * (1 + (role.sell || 0))); ch.raid.bag.splice(m.i | 0, 1); ch.gold += p; this.market.trade(rid, it.ref, 1, 'sell', p, ch.name); this.slumQuest(s, { kind: 'sell', n: 1 }); this.sendSelf(s); s.send({ t: 'toast', v: `${p}Gで売った（探索中の売却は手数料15%）` }); return this.openMarket(s, rid, { inraid, who: m.who }); }
        const it = ch.inventory.find(i => i.uid === m.uid && i.kind === 'loot'); if (!it) return; const n = Math.max(1, Math.min(it.n, m.n | 0 || it.n)); const ch2 = m.channel === 'guild' ? 'guild' : m.fence ? 'fence' : 'black';
        if (ch2 === 'guild') { const g = this.market.guildFor(it.ref); if (!(z.map.npcs || []).some(x => x.service === 'guildhq' && x.guild === g)) return err(`${g}ギルドの窓口で売却できます`); }
        const unit = this.market.sellPrice(rid, it, ch2); if (!unit) return err('この経路では売れない'); const p = Math.round(unit * n * (1 + (role.sell || 0)));
        it.n -= n; if (it.n <= 0) ch.inventory = ch.inventory.filter(i => i !== it); ch.gold += p; this.market.trade(rid, it.ref, n, 'sell', p, ch.name); this.slumQuest(s, { kind: 'sell', n });
        if (ch2 !== 'guild') { this.guilds.addRep(ch, 'blackmarket', 0.5); if (['illegal'].includes(it.prov)) this.guilds.addRep(ch, 'knights', -0.5); } else this.guilds.addRep(ch, this.market.guildFor(it.ref), 1);
        this.market.shift(rid, this.market.controller(rid), 0.2); this.sendSelf(s); s.send({ t: 'toast', v: `${LOOT[it.ref].name}×${n}を${p}Gで売却` }); return this.openMarket(s, rid, { fence: !!m.fence }); }
      case 'buy': { const k = m.ref; const e = this.market.m[rid][k]; if (!e || !LOOT[k] || ['guildbox', 'deed'].includes(k)) return; if (e.stock <= 0) return err('在庫切れ'); const p = Math.round(e.price * 1.25 * (1 - (role.buy || 0))); if (ch.gold < p) return err('ゴールドが足りません'); ch.gold -= p; this.market.trade(rid, k, 1, 'buy', p, ch.name);
        if (inraid) this.slum.toBag(s, { ref: k, n: 1, q: 1, prov: 'illegal' }, z); else this.slum.addLoot(ch, { ref: k, n: 1, q: 1, prov: 'illegal' }); this.sendSelf(s); return this.openMarket(s, rid, { inraid }); }
      case 'launder': { // pawn: sell anything cheaply / appraise: unknown & ruins → laundered for a fee / fence: illegal → laundered (fee, rep risk)
        const it = ch.inventory.find(i => i.uid === m.uid && i.kind === 'loot'); if (!it) return; const L = LOOT[it.ref]; const base = L.v * (it.q || 1) * it.n;
        if (m.how === 'pawn') { const p = Math.round(base * 0.35); ch.gold += p; ch.inventory = ch.inventory.filter(i => i !== it); this.sendSelf(s); s.send({ t: 'toast', v: `質屋に${p}Gで流した` }); return this.openMarket(s, rid); }
        if (m.how === 'appraise') { if (!['unknown', 'ruins', 'slum'].includes(it.prov)) return err('鑑定屋は出所不明・遺跡由来・スラム発見品のみ扱う'); const fee = Math.round(base * 0.15 * (1 - (role.appraise || 0))); if (ch.gold < fee) return err(`鑑定料${fee}G`); ch.gold -= fee; it.prov = 'laundered'; this.guilds.addRep(ch, 'ancients', 0.5); this.sendSelf(s); s.send({ t: 'toast', v: `鑑定書付きになった（${fee}G）。正規店でも売れる` }); return this.openMarket(s, rid); }
        if (m.how === 'fence') { if (it.prov !== 'illegal') return err('故買屋の洗浄は非合法品のみ'); const fee = Math.round(base * 0.25); if (ch.gold < fee) return err(`手数料${fee}G`); ch.gold -= fee; it.prov = 'laundered'; this.guilds.addRep(ch, 'knights', -1); this.guilds.addRep(ch, 'thieves', 1); if (ch.hideout) ch.hideout.exposure = Math.min(100, ch.hideout.exposure + 2); this.sendSelf(s); s.send({ t: 'toast', v: `出所を洗浄した（${fee}G）` }); return this.openMarket(s, rid); }
        return; }
    }
  }
  hideoutMenu(s, m) {
    const ch = s.ch, z = s.actor.zone; const inside = z.hideout === ch.id;
    switch (m.act) {
      case 'view': return this.hideout.view(s);
      case 'acquire': { const rid = REGIONS[m.rid] ? m.rid : regionOfCity(z.cityId); return this.hideout.acquire(s, m.k, rid); }
      case 'enter': return this.slumMenu(s, { act: 'hideout' });
      case 'upgrade': if (!inside) return s.send({ t: 'err', v: '隠れ家の中で行ってください' }); return this.hideout.upgrade(s);
      case 'install': if (!inside) return s.send({ t: 'err', v: '隠れ家の中で行ってください' }); return this.hideout.install(s, String(m.k));
      case 'use': if (!inside) return; return this.hideout.use(s, String(m.f), m);
      case 'store': return this.hideout.store(s, m.uid, m.to === 'stash' ? 'stash' : 'storage');
      case 'take': return this.hideout.take(s, m.i, m.from === 'stash' ? 'stash' : 'storage');
      case 'vis': return this.hideout.setVis(s, m.v);
      case 'visit': return this.hideout.visit(s, String(m.name || ''));
    }
  }
  // ---------- client messages
  handle(s, m) {
    if (!s.ch) {
      if (m.t === 'chars') return s.send({ t: 'chars', list: store.listChars(s.account) });
      if (m.t === 'create') return this.create(s, m);
      if (m.t === 'play') return this.play(s, String(m.id));
      return;
    }
    const a = s.actor; if (!a) return;
    switch (m.t) {
      case 'in': a.input = { mx: clampN(m.mx), my: clampN(m.my), atk: !!m.atk, spc: !!m.spc }; a.autoAim = !!m.au; if (Number.isFinite(m.ax) && Number.isFinite(m.ay)) { a.aimX = m.ax; a.aimY = m.ay; } else { a.aimX = a.aimY = null; } break;
      case 'dodge': a.dodge(a.zone, clampN(m.dx), clampN(m.dy)); break;
      case 'heavy': { if (a.dead) break; if (Number.isFinite(m.ax) && Number.isFinite(m.ay) && a.canAct(a.zone.now) && !a.action) { a.facing = Math.atan2(m.ay - a.y, m.ax - a.x); } const r = a.heavy(a.zone); if (r !== 'ok') s.send({ t: 'skillfail', i: -1, r }); break; }
      case 'skill': { const id = s.ch.skills.slots[m.i | 0]; if (!id || a.dead) break; if (!knownSkills(s.ch).includes(id)) break; const tx = Number.isFinite(m.tx) ? m.tx : undefined, ty = Number.isFinite(m.ty) ? m.ty : undefined; if (tx !== undefined && ty !== undefined && (tx !== a.x || ty !== a.y) && a.canAct(a.zone.now)) { a.facing = Math.atan2(ty - a.y, tx - a.x); a.aimX = tx; a.aimY = ty; } const r = a.useSkill(id, a.zone, { tx, ty }); if (r !== 'ok') s.send({ t: 'skillfail', i: m.i, r }); break; }
      case 'potion': { const ref = String(m.ref || ''); const ch2 = s.ch; const it = ch2.inventory.find(i => i.ref === ref && i.n > 0 && (i.kind === 'potion' || ITEMS[i.ref]?.use)); if (!it || a.dead || (a.potCd || 0) > a.zone.now) break;
        const u = ITEMS[ref]?.use; if (u?.ret && a.zone.kind !== 'dungeon') { s.send({ t: 'err', v: 'ダンジョン内で使えます' }); break; }
        a.potCd = a.zone.now + 3000; it.n--; if (it.n <= 0) ch2.inventory = ch2.inventory.filter(i => i !== it); const k = 1 + (a.stats.mods.potion || 0);
        if (ref === 'breath') { ch2.progress.breathUntil = Date.now() + 600000; s.send({ t: 'toast', v: '呼吸の秘薬を飲んだ（10分間 水中で呼吸できる）' }); }
        else if (ref === 'hp') a.heal(a.maxHp * 0.35 * k, a.zone); else if (ref === 'sp') a.sp = Math.min(a.maxSp, a.sp + a.maxSp * 0.4 * k);
        else if (u) { if (u.heal) a.heal(a.maxHp, a.zone); if (u.sp) a.sp = a.maxSp; if (u.buff) a.addBuff(u.buff, u.dur, 'item_' + ref); if (u.ret) { this.sendSelf(s); this.leaveDungeon(s); break; } s.send({ t: 'toast', v: `${ITEMS[ref].name}を使った` }); }
        this.sendSelf(s); break; }
      case 'interact': this.interact(s); break;
      case 'respawn': this.respawn(s); break;
      case 'chat': { const v = String(m.v || '').slice(0, 120); if (!v) break; const msg = { t: 'chat', from: s.ch.name, v }; for (const p of a.zone.players) p.session.send(msg); a.zone.fx({ t: 'say', id: a.id, v }); break; }
      case 'menu': this.menu(s, m); break;
    }
  }
  create(s, m) {
    const acc = store.account(s.account); if (acc.chars.length >= 4) return s.send({ t: 'err', v: 'キャラクターは4人までです' });
    const name = String(m.name || '').trim().slice(0, 12); if (name.length < 2 || /[<>&"']/.test(name)) return s.send({ t: 'err', v: '名前は2〜12文字で入力してください' });
    if (store.nameTaken(name)) return s.send({ t: 'err', v: 'その名前は使用されています' });
    const wt = m.wt | 0; if (!STARTER_WEAPON_TYPES.includes(wt)) return s.send({ t: 'err', v: 'その武器種は初期選択できません' });
    const L = m.look || {}; const look = { body: (L.body | 0) % 3, skin: (L.skin | 0) % 5, hair: (L.hair | 0) % 6, hairColor: (L.hairColor | 0) % 10, outfit: (L.outfit | 0) % 10 };
    const ch = newCharacter('c' + uid(), name, wt, look); ch.account = acc.id; acc.chars.push(ch.id); store.saveAccount(acc); store.saveChar(ch);
    s.send({ t: 'chars', list: store.listChars(s.account) });
  }
  interact(s) {
    const a = s.actor, z = a.zone;
    if (a.dead) return;
    for (const o of z.map.objects || []) if (o.k === 'altar') { const p = z.tileCenter([o.x, o.y]); if (Math.hypot(p.x - a.x, p.y - a.y) < 20 && this.useObject(s, z, o) !== false) return; } // standing at the altar beats the priest
    for (const n of z.map.npcs || []) { const p = z.tileCenter([n.x, n.y]); if (Math.hypot(p.x - a.x, p.y - a.y) < (z.kind === 'interior' ? 44 : 30)) return this.openService(s, n.service, n); }
    for (const d of z.map.doors || []) { const p = z.tileCenter([d.x, d.y]); if (Math.hypot(p.x - a.x, p.y - (a.y - 6)) < 22) return this.enterBuilding(s, d); }
    for (const st of z.map.stops || []) { const p = z.tileCenter([st.x, st.y]); if (Math.hypot(p.x - a.x, p.y - a.y) < 26) return s.send({ t: 'open', service: 'stops', data: { here: st.district, stops: z.map.stops.map(x => ({ district: x.district, name: x.name })), fee: 10 } }); }
    const near = (z.map.objects || []).map(o => { const p = z.tileCenter([o.x, o.y]); return [Math.hypot(p.x - a.x, p.y - a.y), o]; }).filter(x => x[0] < 24).sort((x, y) => x[0] - y[0]);
    for (const [, o] of near) { const r = this.useObject(s, z, o); if (r !== false) return; }
    { let best = null, bd = 26; for (const o of z.actors.values()) if (o.kind === 'resident') { const d = Math.hypot(o.x - a.x, o.y - a.y) - (o.cit?.story ? 20 : 0); if (d < bd) { bd = d; best = o; } } if (best) var nearRes = best; }
    for (const o of nearRes ? [nearRes] : []) { const c = o.cit; o.facing = Math.atan2(a.y - o.y, a.x - o.x); if (c.story) return this.storyTalk(s, c); this.cev.onResidentTalk(s, c); return s.send({ t: 'open', service: 'resident', data: { id: c.id, name: c.name, job: c.job, pers: c.pers, line: this.life.talk(c, s.ch, c.city), guild: c.guild, family: c.family || null, req: this.econ?.residentRequest?.(s, c) || null } }); }
    if (z.kind === 'dungeon' && z.map.exit) { const p = z.tileCenter(z.map.exit); if (Math.hypot(p.x - a.x, p.y - a.y) < 30) return s.send({ t: 'open', service: 'exit', data: { name: z.dungeon.name, floor: z.floor } }); }
    for (const g of z.map.gates || []) { const p = z.tileCenter([g.x, g.y]); if (Math.hypot(p.x - a.x, p.y - a.y) < 30) return this.openService(s, 'gate', g.dungeon); }
    for (const d of z.drops) if (d.chest && Math.hypot(d.x - a.x, d.y - a.y) < 26) { d.chest = false; d.until = 0; const loot = rollLoot({ floor: z.floor || 1, diff: z.diff || 'NORMAL', chest: true, preferWt: a.wt.id }); for (const it of loot) addItem(s.ch, it, n => this.note(s, n)); if (Math.random() < 0.1) this.spells.chestFrag(s, z); z.fx({ t: 'boom', x: Math.round(d.x), y: Math.round(d.y), r: 14, e: 'holy' }); this.sendSelf(s); return; }
    for (const o of z.actors.values()) if (o.kind === 'slumnpc' && Math.hypot(o.x - a.x, o.y - a.y) < (o.role === 'raven' || o.role === 'observer' ? 40 : 28)) { o.facing = Math.atan2(a.y - o.y, a.x - o.x); if (o.role === 'observer') return this.big.observerDuel(s); return o.role === 'raven' ? this.duels.openRaven(s) : this.slum.talk(s, o); }
    // NPC adventurers
    for (const o of z.actors.values()) if (o.kind === 'npc' && Math.hypot(o.x - a.x, o.y - a.y) < 30) { const n = o.npc; return s.send({ t: 'open', service: 'npc', data: { ...this.npcs.info(n), line: this.npcs.talk(n, s.ch), bond: n.bond[s.ch.id] || 0, inParty: n.partyWith === s.ch.id } }); }
  }
  openService(s, service, dungeon) {
    const z = s.actor.zone; const town = z.cityId || z.id; const npc = typeof dungeon === 'object' ? dungeon : null; if (npc) dungeon = null;
    if (this.econ?.services[service]) return this.econ.services[service](s, z, npc);
    if (service === 'guildhq') return this.guilds.open(s, npc.guild);
    if (service === 'slum') return this.slum.open(s, z, npc);
    if (service === 'org') return this.orgs.open(s, npc.org);
    if (service === 'sev') return this.sev.open(s, npc.ev);
    if (service === 'masq') return this.duels.openMasq(s);
    if (service === 'library') return this.library.openLibrary(s);
    if (service === 'archive') { this.library.syncSins(s); return this.library.open(s); }
    if (service === 'sealgate') return this.library.sealGate(s);
    if (service === 'cev') return this.cev.open(s, npc.ev);
    if (service === 'realmgate') return this.cev.realmGate(s);
    if (service === 'train') return this.explore.openTrain(s);
    if (service === 'soc') return this.society.open(s, npc.ev);
    if (service === 'village' || service === 'vshop') return this.society.openVillage(s);
    if (service === 'mapless') return this.explore.openMapless(s);
    if (service === 'graymarket') { this.events.record(s, 'sl_graymarket', '灰色市場を訪れた'); return this.openMarket(s, 'gravel_under', { who: '灰色市場' }); }
    if (service === 'hfence') return this.openMarket(s, s.ch.hideout?.rid, { fence: true, who: '故買屋' });
    const data = { service };
    if (service === 'weapon') data.stock = shopStock(town, 'weapon');
    if (service === 'armor') data.stock = shopStock(town, 'armor');
    if (service === 'item') data.stock = shopStock(town, 'item').map(r => ({ ref: r, price: ITEM_PRICES[r] }));
    if (service === 'quest') data.board = questBoard(town, day());
    if (service === 'inn') { s.actor.hp = s.actor.maxHp; s.actor.sp = s.actor.maxSp; for (const k of Object.keys(s.actor.statuses)) delete s.actor.statuses[k]; }
    if (service === 'gate') data.dungeons = (dungeon ? [dungeon] : DATA.dungeonList.map(d => d.id));
    s.send({ t: 'open', service, data });
  }
  menu(s, m) {
    const ch = s.ch, a = s.actor; const ok = (v) => { this.sendSelf(s); if (v) s.send({ t: 'toast', v }); }; const err = v => s.send({ t: 'err', v });
    const inTown = isTown(a.zone);
    switch (m.op) {
      case 'equip': { const it = ch.inventory.find(i => i.uid === m.uid); if (!it) return; if (a.action && a.action.until > a.zone.now) return err('行動中は変更できません');
        if (it.kind === 'weapon') { const w = DATA.weapons.get(it.ref); if (w.lvl > ch.level + 10 && !WT_BY_ID[w.wt].myth) return err(`Lv${w.lvl - 10}以上で装備できます`); ch.equip.weapon = it.uid; ch.mastery[w.wt] ||= { lv: 1, xp: 0 }; }
        else if (it.kind === 'armor') { if (armorDef(it.slot, it.tier).lvl > ch.level + 10) return err('レベルが足りません'); ch.equip[it.slot] = it.uid; }
        else if (it.kind === 'artifact') { const slot = ART_SLOTS.includes(m.slot) ? m.slot : ART_SLOTS.find(k => !ch.equip[k]) || 'art1'; for (const k of ART_SLOTS) if (ch.equip[k] === it.uid) ch.equip[k] = null; ch.equip[slot] = it.uid; }
        else return;
        a.comboStep = 0; a.altMode = false; a.gauge = null; return ok('装備を変更しました'); }
      case 'alloc': { const st = m.stat; const n = Math.max(1, Math.min(ch.statPoints, m.n | 0 || 1)); if (!STATS.includes(st) || ch.statPoints < n) return; ch.stats[st] += n; ch.statPoints -= n; return ok(); }
      case 'resetStats': { if (!inTown) return err('街でのみ可能です'); const cost = ch.level * 100; if (ch.gold < cost) return err(`${cost}G必要です`); ch.gold -= cost; let sum = 0; for (const k of STATS) { sum += ch.stats[k]; ch.stats[k] = 0; } ch.statPoints += sum; return ok('ステータスを再分配できます'); }
      case 'slot': { const i = m.i | 0; if (i < 0 || i >= SKILL_SLOTS) return; const id = m.id || null; if (id && (!knownSkills(ch).includes(id) || DATA.skills.get(id)?.kind === 'passive')) return err('そのスキルは使用できません'); ch.skills.slots = ch.skills.slots.map(x => x === id ? null : x); ch.skills.slots[i] = id; return ok(); }
      case 'job': { if (!inTown) return err('職業ギルド（街）で転職できます'); const j = DATA.jobs.get(m.id); if (!j) return; if (!ch.jobs[j.id]) { if (!jobUnlockMet(ch, j)) return err('解放条件を満たしていません'); ch.jobs[j.id] = { rank: 0, xp: 0 }; } ch.job = j.id; return ok(`${j.name}に転職しました`); }
      case 'buy': { if (!inTown) return; const kind = m.kind; const town = a.zone.id;
        if (kind === 'weapon') { if (!shopStock(town, 'weapon').includes(m.ref)) return err('在庫がありません'); const w = DATA.weapons.get(m.ref); if (ch.gold < w.price) return err('ゴールドが足りません'); ch.gold -= w.price; addItem(ch, { kind: 'weapon', ref: w.id, plus: 0 }, n => this.note(s, n)); return ok(`${w.name}を購入しました`); }
        if (kind === 'armor') { const tier = m.tier | 0; if (!shopStock(town, 'armor').includes(tier)) return; const slot = m.slot === 'accessory' ? 'accessory' : 'armor'; const price = Math.round(200 * Math.pow(2.2, tier)); if (ch.gold < price) return err('ゴールドが足りません'); ch.gold -= price; addItem(ch, { kind: 'armor', slot, tier, plus: 0 }); return ok(`${armorDef(slot, tier).name}を購入しました`); }
        if (kind === 'item') { const n = Math.max(1, Math.min(99, m.n | 0 || 1)); const price = ITEM_PRICES[m.ref]; if (!price) return; if (ch.gold < price * n) return err('ゴールドが足りません'); ch.gold -= price * n; addItem(ch, { kind: m.ref === 'ore' || m.ref === 'divingGear' ? 'mat' : 'potion', ref: m.ref, n }); return ok('購入しました'); }
        return; }
      case 'sell': { if (!inTown) return; const it = ch.inventory.find(i => i.uid === m.uid); if (!it || Object.values(ch.equip).includes(it.uid)) return err('装備中のアイテムは売却できません'); if (it.fav) return err('お気に入りの品は売却できません（お気に入りを外してください）'); if (ITEMS[it.ref]?.nosell || it.kind === 'amat') return err('この品は売却できません'); if (it.kind === 'loot') { const rid = regionOfCity(a.zone.cityId) || 'haven_old'; const p = this.market.sellPrice(rid, it, 'regular') * it.n; if (!p) return err(`${PROV[it.prov]}の品は正規の店では買い取ってもらえない（闇市・故買屋・鑑定屋へ）`); ch.gold += p; ch.inventory = ch.inventory.filter(i => i !== it); return ok(`${p}Gで売却しました`); }
        let price = 10; if (it.kind === 'weapon') price = Math.round(DATA.weapons.get(it.ref).price * 0.3); else if (it.kind === 'armor') price = Math.round(60 * Math.pow(2.2, it.tier)); else price = (ITEM_PRICES[it.ref] || 20) * 0.3 * (it.n || 1); ch.gold += Math.round(price); ch.inventory = ch.inventory.filter(i => i !== it); return ok(`${Math.round(price)}Gで売却しました`); }
      case 'unequip': { for (const k of ART_SLOTS) if (ch.equip[k] === m.uid) ch.equip[k] = null; return ok(); }
      case 'fav': { const it = ch.inventory.find(i => i.uid === m.uid); if (!it) return; it.fav = !it.fav; return ok(it.fav ? 'お気に入りに登録しました' : 'お気に入りを解除しました'); }
      case 'sellBulk': { if (!inTown) return err('街の中で売却できます'); const rars = new Set((Array.isArray(m.rars) ? m.rars : []).map(Number)); if (!rars.size) return err('レア度を選んでください');
        const eqs = new Set(Object.values(ch.equip)); const list = ch.inventory.filter(i => i.kind === 'weapon' && !i.fav && !eqs.has(i.uid) && rars.has(DATA.weapons.get(i.ref)?.rar)); if (!list.length) return err('売却対象がありません（装備中・お気に入りは除外）');
        let total = 0; for (const it of list) total += Math.round(DATA.weapons.get(it.ref).price * 0.3); const set = new Set(list); ch.inventory = ch.inventory.filter(i => !set.has(i)); ch.gold += total; return ok(`${list.length}本を${total.toLocaleString()}Gで一括売却しました`); }
      case 'pray': { const z = a.zone; const b = z.bldgId ? findBuilding(z.cityId, z.bldgId) : null; return this.econ.lore(s, b?.lore || `${z.id}:altar`, z); }
      case 'trait': { if (!a.zone.map.objects?.some(o => o.k === 'altar') || a.zone.home) return err('街の祭壇で変更できます'); const r = rerollTrait(ch, m.uid, m.slot | 0); if (r.error) return err(r.error); this.sendSelf(s); s.send({ t: 'traitResult', uid: m.uid, old: r.old, next: r.next }); return this.openAltar(s); }
      case 'artifact': { if (!a.zone.map.npcs?.some(n => n.service === 'smith')) return err('鍛冶屋でアーティファクトを作成できます'); const r = craftArtifact(ch, m.cond, m.eff); if (r.error) return err(r.error); this.events.record(s, 'ex_dungeons', `アーティファクト「${r.art.name}」を作成`); return ok(`アーティファクト「${r.art.name}」を作成しました（${r.cost.toLocaleString()}G）`); }
      case 'evoInfo': { const it = ch.inventory.find(i => i.uid === m.uid && i.kind === 'weapon'); const w = it ? DATA.weapons.get(it.ref) : DATA.weapons.get(m.ref); if (!w) return; return s.send({ t: 'evoInfo', key: m.uid || m.ref, recipe: evolveRecipe(w, categoryOf(w.wt).id), hist: it?.hist ? { k: it.hist.k, b: it.hist.b, since: it.hist.since, top: Object.entries(it.hist.fam).sort((x, y) => y[1] - x[1]).slice(0, 3).map(([f, n]) => [DATA.families.get(f)?.name || f, n]) } : null, epi: it?.epi || null, mastery: MASTERY_MILESTONES.map(x => ({ ...x, name: x.title ? masteryTitle(w.wt, x.lv) : null })) }); }
      case 'evolve': { if (!inTown) return err('鍛冶屋（街）で進化できます'); const it = ch.inventory.find(i => i.uid === m.uid && i.kind === 'weapon'); if (!it) return; const w = DATA.weapons.get(it.ref); const r = evolveRecipe(w, categoryOf(w.wt).id); if (!r) return err('この武器にはこれ以上の強化先がありません');
        if ((it.plus || 0) < r.plus) return err(`+${r.plus}以上に強化してから進化できます`); if (r.toLvl > ch.level + 10) return err(`Lv${r.toLvl - 10}以上で進化できます`); if (ch.gold < r.gold) return err('ゴールドが足りません');
        const cnt = k => ch.inventory.filter(i => i.ref === k && i.kind !== 'loot').reduce((t, i) => t + (i.n || 0), 0); const miss = Object.entries(r.mats).filter(([k, n]) => cnt(k) < n).map(([k, n]) => `${ITEMS[k]?.name || k}×${n}`); if (miss.length) return err('素材不足：' + miss.join('、'));
        ch.gold -= r.gold; for (const [k, n] of Object.entries(r.mats)) { let left = n; for (const x of ch.inventory.filter(i => i.ref === k && i.kind !== 'loot')) { const t = Math.min(left, x.n); x.n -= t; left -= t; if (!left) break; } ch.inventory = ch.inventory.filter(i => !(i.ref in r.mats && i.kind !== 'loot' && i.n <= 0)); }
        const from = w.name; it.ref = r.to; it.plus = Math.floor((it.plus || 0) / 2); if (!ch.progress.codex.includes(r.to)) ch.progress.codex.push(r.to); (it.hist ||= { k: 0, b: 0, since: Date.now(), fam: {}, floors: 0 }).evo = [...(it.hist.evo || []), from];
        a.refreshStats(); return ok(`${from}は${r.toName}へと進化した（来歴は引き継がれる）`); }
      case 'enhance': { if (!inTown) return err('鍛冶屋で強化できます'); const r = enhance(ch, m.uid); if (r.error) return err(r.error); return ok(r.ok ? `強化成功！ +${r.plus}` : '強化失敗…（素材は消費されました）'); }
      case 'quest': { const board = questBoard(a.zone.id, day()); const q = board.find(x => x.id === m.id) || ch.progress.quests[m.id]?.def;
        if (m.act === 'accept') { if (!q || ch.progress.quests[q.id]) return; if (Object.values(ch.progress.quests).filter(x => !x.done).length >= 8) return err('同時受注は8件までです'); ch.progress.quests[q.id] = { def: q, prog: 0 }; return ok(`「${q.name}」を受注しました`); }
        if (m.act === 'turnin') { const st = ch.progress.quests[m.id]; if (!st?.ready || st.done) return err('未達成です'); st.done = true; const r = st.def.reward; const qm = this.society.questMul(st, ch); ch.gold += Math.round((r.gold || 0) * qm); grantXp(ch, Math.round((r.xp || 0) * qm), n => this.note(s, n)); if (r.ore) addItem(ch, { kind: 'mat', ref: 'ore', n: r.ore });
          if (r.item === 'weaponBoss') for (const it of rollLoot({ floor: st.def.floor, diff: 'HARD', boss: true, preferWt: a.wt.id })) addItem(ch, it, n => this.note(s, n));
          if (r.myth) for (const it of rollLoot({ floor: 100, diff: 'ABYSS', boss: false, mythChance: 1 })) if (it.myth) addItem(ch, it, n => this.note(s, n));
          if (r.relic) ch.progress.items[r.relic] = 1; checkJobUnlocks(ch, n => this.note(s, n));
          return ok(`クエスト報酬を受け取りました`); }
        if (m.act === 'abandon') { delete ch.progress.quests[m.id]; return ok(); } return; }
      case 'dungeon': return this.enterDungeon(s, m.id, m.diff, m.floor | 0 || 1);
      case 'spells': if (m.act) return this.spells.act(s, m); return this.spells.open(s);
      case 'sunken': return this.big.sunkenChoice(s, m);
      case 'calamity': return this.big.calAct(s, m);
      case 'potSlot': { const i = m.i | 0; const ref = String(m.ref || ''); if (i < 0 || i > 1) return; if (!(['hp', 'sp', 'breath'].includes(ref) || (ITEMS[ref]?.use))) return err('その品はクイック枠に設定できません'); ch.potSlots = [...(ch.potSlots || ['hp', 'sp'])]; ch.potSlots[i] = ref; return ok(`${'QE'[i]}枠に「${ITEMS[ref]?.name || ref}」を設定した`); }
      case 'library': return this.library.menu(s, m);
      case 'cev': return this.cev.act(s, m);
      case 'realm': return this.cev.realmAct(s, m);
      case 'train': return this.explore.trainAct(s, m);
      case 'soc': return this.society.menu(s, m);
      case 'mapless': return this.explore.readMapless(s, m.id);
      case 'worldInfo': return s.send({ t: 'open', service: 'worldInfo', data: this.big.info(s) });
      case 'leave': if (a.zone.kind === 'dungeon') this.leaveDungeon(s); return;
      case 'invite': { const t = [...this.sessions.values()].find(o => o.ch?.name === m.name); if (!t || t === s) return err('プレイヤーが見つかりません'); const p = this.ensureParty(ch.id); if (p.leader !== ch.id) return err('リーダーのみ招待できます'); if (p.members.length + p.npcs.length >= 6) return err('パーティーは6人までです'); p.invites.add(t.ch.id); t.send({ t: 'invite', from: ch.name, pid: p.id }); this.pushParty(ch.id); return ok(`${t.ch.name}を招待しました`); }
      case 'accept': { const p = this.parties.get(m.pid); if (!p || !p.invites.has(ch.id)) return err('招待が無効です'); this.leaveParty(ch.id, true); p.invites.delete(ch.id); p.members.push(ch.id); for (const id of p.members) this.pushParty(id); return ok('パーティーに参加しました'); }
      case 'leaveParty': this.leaveParty(ch.id); return ok('パーティーを離脱しました');
      case 'kick': { const p = this.partyOf(ch.id); if (!p || p.leader !== ch.id) return; if (p.members.includes(m.id)) { this.leaveParty(m.id); } else if (p.npcs.includes(m.id)) { const n = this.npcs.byId.get(m.id); this.npcs.despawn(n); this.npcs.leaveParty(n); p.npcs = p.npcs.filter(x => x !== m.id); this.pushParty(ch.id); } return ok(); }
      case 'npcInvite': { const n = this.npcs.byId.get(m.id); if (!n || n.state === 'party' || !n.actorId) return err('勧誘できません'); const p = this.ensureParty(ch.id); if (p.leader !== ch.id) return err('リーダーのみ勧誘できます'); if (p.members.length + p.npcs.length >= 6) return err('パーティーは6人までです'); const r = this.npcs.invite(n, ch); if (r.ok) { p.npcs.push(n.id); this.pushParty(ch.id); } return ok(r.msg); }
      case 'npcList': return s.send({ t: 'npcList', list: this.npcs.list.map(n => ({ id: n.id, name: n.ch.name, lv: n.ch.level, state: n.state, where: n.zone, bond: n.bond[ch.id] || 0 })) });
      case 'npcInfo': { const n = this.npcs.byId.get(m.id); if (n) s.send({ t: 'open', service: 'npc', data: { ...this.npcs.info(n), bond: n.bond[ch.id] || 0, inParty: n.partyWith === ch.id, remote: !n.actorId || n.actorZone !== a.zone.id } }); return; }
      case 'tut': { const v = Math.max(0, Math.min(99, m.s | 0)); if (v > (ch.progress.tut || 0) || m.reset) ch.progress.tut = m.reset ? 0 : v; return; }
      case 'guild': return this.guilds.menu(s, m);
      case 'travel': return this.econ.travel(s, String(m.to));
      case 'stop': return this.econ.stop(s, String(m.district));
      case 'trade': if (a.zone.kind !== 'interior') return err('交易所で取引できます'); return this.econ.trade(s, String(m.g), m.n, !!m.sell);
      case 'realty': if (!inTown) return; return this.econ.realty(s, m);
      case 'home': return m.act === 'open' ? this.econ.openHome(s) : this.econ.home(s, m);
      case 'buyFurn': if (!inTown) return; return this.econ.buyFurniture(s, String(m.k));
      case 'myshop': return this.econ.myshop(s, m);
      case 'bank': if (a.zone.map.npcs?.some(n => n.service === 'bank')) return this.econ.bank(s, m); return err('銀行で手続きしてください');
      case 'casino': if (a.zone.map.npcs?.some(n => n.service === 'casino')) return this.econ.casino(s, m); return;
      case 'arena': if (a.zone.map.npcs?.some(n => n.service === 'arena')) return this.econ.startArena(s); return;
      case 'black': if (a.zone.map.npcs?.some(n => n.service === 'blackmarket')) return this.econ.blackBuy(s, m); return;
      case 'info': return this.econ.info(s);
      case 'outfit': if (!inTown) return; return this.econ.outfit(s, m);
      case 'craft': return this.econ.craft(s, m.wt);
      case 'req': return this.econ.request(s, m);
      case 'story': return this.econ.story(s, m);
      case 'use': { const it = s.ch.inventory.find(i => i.ref === m.ref && i.n > 0 && ITEMS[i.ref]?.use); if (!it) return; const u = ITEMS[it.ref].use; if (u.ret && a.zone.kind !== 'dungeon') return err('ダンジョン内で使えます'); it.n--; if (it.n <= 0) s.ch.inventory = s.ch.inventory.filter(x => x !== it); if (u.heal) a.hp = a.maxHp; if (u.sp) a.sp = a.maxSp; if (u.buff) a.addBuff(u.buff, u.dur, 'item_' + it.ref); if (u.ret) { this.sendSelf(s); return this.leaveDungeon(s); } return ok(`${ITEMS[it.ref].name}を使った`); }
      case 'cityInfo': { const cid = this.cityNear(a.zone); if (!cid) return; const c = CITIES[cid]; const t = clock(); return s.send({ t: 'cityInfo', id: cid, city: { name: c.name, title: c.title, founded: c.founded, history: c.history, origin: c.origin, geography: c.geography, climate: c.climate, architecture: c.architecture, industry: c.industry, economy: c.economy, politics: c.politics, ruler: c.ruler, security: c.security, classes: c.classes, culture: c.culture, lifestyle: c.lifestyle, landmark: c.landmark.name, monsters: c.monsters, events: c.events, districts: c.districts.map(d => ({ name: d.name, type: d.type, buildings: d.buildings.map(b => ({ name: b.name, hours: b.hours || null, guild: b.guild || null })) })) }, weather: WEATHER[this.life.weatherOf(cid)], time: t, season: season(t.day).name, temp: temperature(cid, this.life.weatherOf(cid), t), continent: c.continent, state: this.econ.cityState[cid] || null, news: this.econ.news.slice(0, 8).map(n => n.v), prices: Object.keys(c.goods ? {} : {}), guildsHere: [] }); }
      case 'dev': { if (process.env.DEV_TOOLS !== '1') return; const z = a.zone; // e2e helper only (never enabled in production)
        if (m.door) { const d = z.map.doors.find(x => x.svc === m.door || x.id === m.door); if (d) { const p = z.tileCenter([d.x, d.y + 1]); a.x = p.x; a.y = p.y; } }
        if (m.npc) { const n = z.map.npcs.find(x => x.service === m.npc && (!m.ev || x.ev === m.ev)); if (n) { const p = z.tileCenter([n.x, n.y + (z.kind === 'town' ? 1 : 2)]); a.x = p.x; a.y = p.y; } }
        if (m.obj) { const o = z.map.objects.find(x => x.k === m.obj && !x.looted && (!m.type || x.type === m.type)); if (o) { const p = z.tileCenter([o.x, o.y]); a.x = p.x; a.y = p.y; } }
        if (m.moon != null) { this.events.w.flags.moon.p = +m.moon; this.events.simulate(Date.now() + 120000); }
        if (m.cal) { const c = this.events.w.flags.cal[m.cal]; if (c) { c.stage = m.stage | 0; c.outcome = null; } this.big.calSync(); }
        if (m.spfrag) { const sp = DATA.skills.get(m.spfrag); if (sp?.src === 'spell') for (let i = 0; i < (m.n | 0 || 1); i++) this.spells.giveFrag(s, sp); }
        if (m.flag) (ch.progress.flags ||= {})[m.flag] = true;
        if (m.key) addItem(ch, { kind: 'mat', ref: 'archiveKey', n: m.key | 0 });
        if (m.story) { const c = this.story.cits[m.story]; if (c && c.city === z.cityId) { this.life.sync(z); if (c.actor && c.actor.zone === z) { a.x = c.actor.x + 8; a.y = c.actor.y; } } }
        if (m.machina != null) this.machina.bump(+m.machina);
        if (Array.isArray(m.tp)) { a.x = +m.tp[0] || a.x; a.y = +m.tp[1] || a.y; }
        if (m.day != null) setClockAt(m.day | 0, m.hour ?? 12);
        if (m.hour != null && m.day == null) setClockHour(m.hour | 0);
        if (m.raven) { ch.level = Math.max(ch.level, m.level | 0); this.enterZone(s, this.zones.get(this.duels.ravenZone())); this.duels.sync(); const r = [...s.actor.zone.actors.values()].find(x => x.role === 'raven'); if (r) { s.actor.x = r.x + 12; s.actor.y = r.y; } return this.sendSelf(s); }
        if (m.zone && this.zones.get(m.zone)) { this.enterZone(s, this.zones.get(m.zone)); return; }
        if (m.level) { ch.level = m.level | 0; } if (m.gold) ch.gold = m.gold | 0; if (m.give) { addItem(ch, { kind: 'mat', ref: 'traitTicket', n: 3 }); const W = DATA.wtWeapons.get(1); for (const r of [1, 1, 2, 3]) ch.inventory.push({ uid: uid(), kind: 'weapon', ref: W.find(x => x.rar === r && x.traits.length).id, plus: 0 }); ch.inventory.push({ uid: uid(), kind: 'amat', ref: 'acond', key: 'skill', dg: 'd05', floor: 80, diff: 'HARD', pow: 1.24, n: 1 }, { uid: uid(), kind: 'amat', ref: 'aeff', key: 'fire', dg: 'd02', floor: 90, diff: 'HELL', pow: 1.72, n: 1 }); } if (m.loot) for (const r of m.loot) this.slum.addLoot(ch, { ref: r, n: 3, q: 1.1, prov: LOOT[r].prov }); return this.sendSelf(s); }
      case 'events': return s.send({ t: 'open', service: 'journal', data: this.events.journal(ch) });
      case 'sinRoute': { if (!ch.jobs.ev_heretic) return err('異端者になると主ルートを選べる'); if (Object.keys(ch.jobs).some(k => k.startsWith('ev_sinner_'))) return err('罪人に進化した後は主ルートを変えられない'); if (!['greed', 'gluttony', 'envy', 'sloth', 'pride', 'wrath', 'lust'].includes(m.sin)) return; ch.progress.sinRoute = m.sin; this.library.onRoute(s); if (a.zone.archive) this.library.open(s); return ok('主ルートを選んだ'); }
      case 'org': return this.orgs.menu(s, m);
      case 'sev': return this.sev.act(s, m);
      case 'raven': return this.duels.ravenDuel(s, m.act === 'true');
      case 'masq': return this.duels.masqAct(s, m);
      case 'slum': return this.slumMenu(s, m);
      case 'market': return this.marketMenu(s, m);
      case 'hideout': return this.hideoutMenu(s, m);
      case 'players': return s.send({ t: 'players', list: [...this.sessions.values()].filter(o => o.ch).map(o => ({ name: o.ch.name, lv: o.ch.level, zone: o.actor?.zone.name })) });
    }
  }
}
function clampN(v) { v = +v; return Number.isFinite(v) ? Math.max(-1, Math.min(1, v)) : 0; }
function migrate(ch) { ch.progress.codex ||= []; ch.progress.quests ||= {}; ch.progress.items ||= {}; ch.progress.npcBond ||= {}; ch.skills.levels ||= {}; }
