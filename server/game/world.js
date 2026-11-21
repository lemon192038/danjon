// World: owns zones, sessions, parties, dungeon instances, NPC manager, progression hooks and menu operations.
import { Zone } from './zone.js';
import { Fighter } from './actor.js';
import { NpcManager } from './npc.js';
import { WORLD, T } from './maps.js';
import { DATA, WT_BY_ID } from '../data.js';
import { store } from '../store.js';
import { TICK_MS, DIFFICULTIES, STATS, TILE, SKILL_SLOTS } from '../../shared/constants.js';
import { newCharacter, knownSkills, validateSlots, grantXp, grantMastery, grantJobXp, skillUsed, rollLoot, addItem, enhance, shopStock, ITEM_PRICES, questBoard, jobUnlockMet, uid, checkJobUnlocks } from './progress.js';
import { armorDef } from '../../shared/formulas.js';
import { STARTER_WEAPON_TYPES } from '../../shared/data/weaponTypes.js';

const day = () => Math.floor(Date.now() / 86400000);
export class World {
  constructor() {
    this.zones = new Map(); this.sessions = new Map(); this.parties = new Map(); this.tick = 0;
    for (const id of Object.keys(WORLD)) this.zones.set(id, new Zone(this, id, { kind: 'over' }));
    this.npcs = new NpcManager(this, store.worldState());
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
      if (!active && z.kind === 'dungeon') { if (!z.emptySince) z.emptySince = now; if (now - z.emptySince > 60000) this.zones.delete(id); continue; }
      z.emptySince = 0;
      if (!active && z.kind !== 'dungeon' && this.tick % 10) continue; // overworld LOD: idle zones simulate at 2Hz
      z.tick(active ? dt : dt * 10);
      if (active) this.broadcast(z);
      z.fxq.length = 0;
    }
    if (this.tick % 20 === 0) this.npcs.syncZones();
    if (this.tick % 10 === 0) for (const s of this.sessions.values()) if (s.actor) { this.checkTiles(s); if (s.dirty) { s.dirty = false; this.sendSelf(s); } }
  }
  broadcast(z) {
    const fx = z.fxq;
    for (const p of z.players) {
      const s = p.session; if (!s || s.ws.readyState !== 1) continue;
      const snap = z.snapshot(p);
      const now = z.now; const cds = {}; for (const id of p.ch.skills.slots) if (id && p.cds[id] > now) cds[id] = Math.round(p.cds[id] - now);
      s.send({ t: 's', me: { id: p.id, x: Math.round(p.x), y: Math.round(p.y), hp: Math.round(p.hp), mhp: p.maxHp, sp: Math.round(p.sp), msp: p.maxSp, cds, g: p.gauge || null, alt: p.altMode ? 1 : 0, sh: p.shield ? Math.round(p.shield.amt) : 0, dead: p.dead ? 1 : 0, bm: Object.keys(p.buffMods).length ? p.buffMods : null }, ...snap, fx });
    }
  }
  // ---------- sessions
  attach(ws, account) { const s = { ws, account, send: o => { if (ws.readyState === 1) ws.send(JSON.stringify(o)); } }; return s; }
  play(s, cid) {
    const ch = store.loadChar(cid); const acc = store.account(s.account);
    if (!ch || !acc.chars.includes(cid)) return s.send({ t: 'err', v: 'キャラクターが見つかりません' });
    for (const o of this.sessions.values()) if (o.ch?.id === cid) { o.send({ t: 'err', v: '別の接続でログインしました' }); this.detach(o); o.ws.close(); }
    migrate(ch); s.ch = ch; this.sessions.set(cid, s);
    const zid = this.zones.has(ch.pos.zone) && !ch.pos.zone.startsWith('dg:') ? ch.pos.zone : 'haven';
    this.enterZone(s, this.zones.get(zid), ch.pos.zone === zid ? ch.pos : null);
    s.send({ t: 'chat', from: 'system', v: `ようこそ、${ch.name}。ABYSS : ETERNAL FRONTIER へ。` });
  }
  detach(s) {
    if (!s.ch) return;
    this.save(s); const party = this.partyOf(s.ch.id);
    if (s.actor) { s.actor.zone.remove(s.actor); }
    if (party) this.leaveParty(s.ch.id, true);
    this.sessions.delete(s.ch.id); s.actor = null;
  }
  save(s) { if (!s.ch) return; if (s.actor) s.ch.pos = { zone: s.actor.zone.kind === 'dungeon' ? s.actor.zone.returnTo || 'haven' : s.actor.zone.id, x: s.actor.zone.kind === 'dungeon' ? null : Math.round(s.actor.x), y: s.actor.zone.kind === 'dungeon' ? null : Math.round(s.actor.y) }; store.saveChar(s.ch); }
  saveAll() { for (const s of this.sessions.values()) this.save(s); store.saveWorldState({ npcs: this.npcs.list.map(n => ({ ...n, actorId: null })) }); }
  enterZone(s, z, pos) {
    const old = s.actor;
    let hp = 1, sp = 1; if (old) { hp = old.hp / old.maxHp; sp = old.sp / old.maxSp; old.zone.remove(old); if (old.dead) hp = 1; }
    const a = new Fighter(s.ch, { kind: 'player', team: 'ally', session: s, look: s.ch.look });
    a.hp = Math.max(1, Math.round(a.maxHp * hp)); a.sp = Math.round(a.maxSp * sp);
    a.onSkillUsed = sk => skillUsed(s.ch, sk.id, n => this.note(s, n));
    const p = pos?.x != null ? pos : z.tileCenter(z.map.start); a.x = p.x; a.y = p.y;
    if (z.blocked(a.x, a.y)) { const st = z.tileCenter(z.map.start); a.x = st.x; a.y = st.y; }
    z.add(a); s.actor = a; s.zone = z;
    if (z.kind !== 'dungeon') s.ch.pos = { zone: z.id, x: null, y: null };
    s.send({ t: 'zone', id: z.id, name: z.name, kind: z.kind, w: z.map.w, h: z.map.h, tiles: Buffer.from(z.map.tiles).toString('base64'), pal: z.map.pal, lights: z.map.lights, npcs: z.map.npcs || [], gates: z.map.gates || [], exits: z.map.exits || [], darkness: !!z.darkness, curses: z.curses?.list || [], floor: z.floor || 0, diff: z.diff || null, dungeon: z.dungeon?.id || null, stairsOpen: z.map.stairsOpen, gim: z.gim });
    this.sendSelf(s);
    // party NPCs follow the player
    for (const nid of this.partyOf(s.ch.id)?.npcs || []) { const n = this.npcs.byId.get(nid); if (!n) continue; this.npcs.despawn(n); this.npcs.spawn(n, z, { x: a.x + 12, y: a.y + 10 }); }
    if (z.kind === 'dungeon') this.onFloorReached(s, z);
  }
  sendSelf(s) {
    const a = s.actor; validateSlots(s.ch); a?.refreshStats();
    const st = a.stats;
    s.send({ t: 'self', ch: s.ch, d: { atk: st.atk, matk: st.matk, def: st.def, maxHp: st.maxHp, maxSp: st.maxSp, crit: st.crit, critDmg: st.critDmg, aspd: st.aspd, move: st.move, dr: st.dr, cdr: st.cdr, st: st.st, wt: st.wt, affinity: st.affinity, mods: st.mods }, known: knownSkills(s.ch), party: this.partyView(s.ch.id) });
  }
  note(s, n) { s.send({ ...n, k: n.t, t: 'note' }); s.dirty = true; }
  // ---------- per-tick interaction checks (tiles)
  checkTiles(s) {
    const a = s.actor, z = a.zone; if (a.dead) return;
    const tx = Math.floor(a.x / TILE), ty = Math.floor(a.y / TILE); const tile = z.map.tiles[ty * z.map.w + tx];
    if (tile === T.EXIT) {
      if (z.kind === 'dungeon') return this.leaveDungeon(s);
      const ex = z.map.exits.find(e => Math.abs(e.x - tx) <= 2 && Math.abs(e.y - ty) <= 2); if (!ex) return;
      const to = this.zones.get(ex.to); const back = to.map.exits.find(e => e.to === z.id);
      const p = back ? to.tileCenter([back.x + (back.dir === 'east' ? -3 : back.dir === 'west' ? 3 : 0), back.y + (back.dir === 'south' ? -3 : back.dir === 'north' ? 3 : 0)]) : null;
      this.enterZone(s, to, p);
    } else if (tile === T.STAIRS && z.kind === 'dungeon' && z.map.stairsOpen) this.nextFloor(s, z);
    // auto pickup drops
    for (const d of z.drops) if (!d.chest && d.owner === a.id && Math.hypot(d.x - a.x, d.y - a.y) < 18) { d.until = 0; addItem(s.ch, d.it, n => this.note(s, n)); }
  }
  // ---------- dungeon flow
  enterDungeon(s, dId, diff, floor) {
    const d = DATA.dungeons.get(dId); if (!d || !DIFFICULTIES.some(x => x.id === diff)) return;
    const best = s.ch.progress.clears[dId]?.[diff] || 0;
    if (floor !== 1 && (floor - 1) % 10 !== 0) floor = 1; if (floor > best + 1) floor = 1;
    if (diff === 'ABYSS' && !(s.ch.progress.clears[dId]?.HELL >= 100) && s.ch.level < 150) return s.send({ t: 'err', v: 'ABYSSはHELL100階踏破またはLv150以上で解放されます' });
    if (diff === 'HELL' && !(s.ch.progress.clears[dId]?.HARD >= 50) && s.ch.level < 80) return s.send({ t: 'err', v: 'HELLはHARD50階踏破またはLv80以上で解放されます' });
    const ret = s.actor.zone.kind === 'dungeon' ? s.actor.zone.returnTo : s.actor.zone.id;
    const members = this.partyMembersHere(s);
    const key = this.partyOf(s.ch.id)?.id || s.ch.id;
    const z = this.instance(key, dId, diff, floor); z.returnTo = ret;
    for (const m of members) this.enterZone(m, z);
  }
  instance(key, dId, diff, floor) { const id = `dg:${key}:${dId}:${diff}:${floor}`; let z = this.zones.get(id); if (!z) { z = new Zone(this, id, { kind: 'dungeon', dungeon: dId, diff, floor }); this.zones.set(id, z); } return z; }
  partyMembersHere(s) { const p = this.partyOf(s.ch.id); if (!p) return [s]; return p.members.map(id => this.sessions.get(id)).filter(m => m?.actor && m.actor.zone === s.actor.zone); }
  nextFloor(s, z) {
    if (z.floor >= 100) { this.leaveDungeon(s); return; }
    const nz = this.instance(this.partyOf(s.ch.id)?.id || s.ch.id, z.dungeon.id, z.diff, z.floor + 1); nz.returnTo = z.returnTo;
    for (const m of [...z.players].map(p => p.session)) this.enterZone(m, nz);
  }
  leaveDungeon(s) { const z = s.actor.zone; const to = this.zones.get(z.returnTo || 'haven'); const g = to.map.gates.find(g => g.dungeon === z.dungeon?.id); this.enterZone(s, to, g ? to.tileCenter([g.x, g.y + 2]) : null); }
  onFloorReached(s, z) {
    const c = s.ch.progress.clears[z.dungeon.id] ||= {};
    const reached = z.floor - 1; if (reached > (c[z.diff] || 0)) c[z.diff] = reached;
    c.max = Math.max(c.max || 0, ...Object.values(c).filter(v => typeof v === 'number'));
    if (z.diff === 'ABYSS') s.ch.progress.abyssMax = Math.max(s.ch.progress.abyssMax, z.floor);
    this.questCheck(s, { kind: 'floor', dungeon: z.dungeon.id, floor: z.floor, diff: z.diff });
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
      ch.gold += Math.round(m.gold * (1 + (mods.gold || 0))); ch.progress.kills++; s.dirty = true; ch.progress.famKills[m.fam] = (ch.progress.famKills[m.fam] || 0) + 1;
      const floor = z.floor || Math.round((m.level || 1) * 0.8);
      const loot = rollLoot({ floor, diff: z.diff || 'NORMAL', boss: false, luck: mods.drop ? mods.drop * 0.03 : 0, preferWt: f.wt.id });
      if (loot.length) z.dropLoot(f, m.x, m.y, loot);
      this.questCheck(s, { kind: 'kill', fam: m.fam });
    }
    for (const p of z.players) { const pt = this.partyOf(p.ch.id); for (const nid of pt?.npcs || []) { const n = this.npcs.byId.get(nid); if (n) p.ch.progress.npcBond[nid] = n.bond[p.ch.id] = Math.min(100, (n.bond[p.ch.id] || 0) + 0.2); } }
  }
  onBossKilled(z, b) {
    for (const p of z.players) {
      const s = p.session; const ch = p.ch; const diff = z.diff || 'NORMAL';
      ch.progress.bossKills[diff] = (ch.progress.bossKills[diff] || 0) + 1;
      const di = DIFFICULTIES.findIndex(d => d.id === diff);
      const myth = diff === 'ABYSS' ? 0.08 + z.floor * 0.003 : diff === 'HELL' && z.floor >= 50 ? 0.03 : 0;
      z.dropLoot(p, b.x, b.y, rollLoot({ floor: z.floor, diff, boss: true, mythChance: myth, preferWt: p.wt.id }));
      if (z.floor === 100 && !ch.progress.titles.includes(z.dungeon.name + '踏破者')) { ch.progress.titles.push(z.dungeon.name + '踏破者'); this.note(s, { t: 'title', v: z.dungeon.name + '踏破者' }); }
      this.questCheck(s, { kind: 'boss', dungeon: z.dungeon.id, floor: z.floor, diff });
      const c = ch.progress.clears[z.dungeon.id] ||= {}; if (z.floor > (c[diff] || 0)) c[diff] = z.floor; c.max = Math.max(c.max || 0, z.floor);
      checkJobUnlocks(ch, n => this.note(s, n));
      this.sendSelf(s);
      void di;
    }
    for (const n of this.npcs.list) if (n.actorZone === z.id && n.partyWith) this.npcs.log(n, `${z.dungeon.name}${z.floor}階のボス「${b.name}」を討伐した`);
  }
  onFighterDied(z, a) {
    if (a.kind === 'player') { a.ch.progress.deaths++; this.note(a.session, { t: 'dead' }); if (z.kind === 'dungeon') a.ch.gold = Math.floor(a.ch.gold * 0.95); }
    else if (a.npc) { const n = a.npc; this.npcs.log(n, '戦闘不能になり街へ戻った'); z.schedule(z.now + 1500, () => z.remove(a)); n.actorId = null; const owner = n.partyWith; if (owner) { const p = this.partyOf(owner); if (p) p.npcs = p.npcs.filter(x => x !== n.id); this.pushParty(owner); } this.npcs.leaveParty(n); }
  }
  respawn(s) {
    const a = s.actor; if (!a?.dead) return;
    const z = a.zone; const town = z.kind === 'dungeon' ? (z.returnTo || 'haven') : (z.kind === 'town' ? z.id : WORLD[z.id].links.west || WORLD[z.id].links.south || 'haven');
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
      case 'in': a.input = { mx: clampN(m.mx), my: clampN(m.my), atk: !!m.atk, spc: !!m.spc }; if (Number.isFinite(m.ax) && Number.isFinite(m.ay)) { a.aimX = m.ax; a.aimY = m.ay; } else { a.aimX = a.aimY = null; } break;
      case 'dodge': a.dodge(a.zone, clampN(m.dx), clampN(m.dy)); break;
      case 'skill': { const id = s.ch.skills.slots[m.i | 0]; if (!id || a.dead) break; if (!knownSkills(s.ch).includes(id)) break; const tx = Number.isFinite(m.tx) ? m.tx : undefined, ty = Number.isFinite(m.ty) ? m.ty : undefined; const r = a.useSkill(id, a.zone, { tx, ty }); if (r !== 'ok') s.send({ t: 'skillfail', i: m.i, r }); break; }
      case 'potion': { const it = s.ch.inventory.find(i => i.kind === 'potion' && i.ref === m.ref && i.n > 0); if (!it || a.dead || (a.potCd || 0) > a.zone.now) break; a.potCd = a.zone.now + 3000; it.n--; if (it.n <= 0) s.ch.inventory = s.ch.inventory.filter(i => i !== it); const k = 1 + (a.stats.mods.potion || 0); if (m.ref === 'hp') a.heal(a.maxHp * 0.35 * k, a.zone); else a.sp = Math.min(a.maxSp, a.sp + a.maxSp * 0.4 * k); this.sendSelf(s); break; }
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
    for (const n of z.map.npcs || []) { const p = z.tileCenter([n.x, n.y]); if (Math.hypot(p.x - a.x, p.y - a.y) < 30) return this.openService(s, n.service); }
    for (const g of z.map.gates || []) { const p = z.tileCenter([g.x, g.y]); if (Math.hypot(p.x - a.x, p.y - a.y) < 30) return this.openService(s, 'gate', g.dungeon); }
    for (const d of z.drops) if (d.chest && Math.hypot(d.x - a.x, d.y - a.y) < 26) { d.chest = false; d.until = 0; const loot = rollLoot({ floor: z.floor || 1, diff: z.diff || 'NORMAL', chest: true, preferWt: a.wt.id }); for (const it of loot) addItem(s.ch, it, n => this.note(s, n)); z.fx({ t: 'boom', x: Math.round(d.x), y: Math.round(d.y), r: 14, e: 'holy' }); this.sendSelf(s); return; }
    // NPC adventurers
    for (const o of z.actors.values()) if (o.kind === 'npc' && Math.hypot(o.x - a.x, o.y - a.y) < 30) { const n = o.npc; return s.send({ t: 'open', service: 'npc', data: { ...this.npcs.info(n), line: this.npcs.talk(n, s.ch), bond: n.bond[s.ch.id] || 0, inParty: n.partyWith === s.ch.id } }); }
  }
  openService(s, service, dungeon) {
    const z = s.actor.zone; const town = z.id;
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
    const inTown = a.zone.kind === 'town';
    switch (m.op) {
      case 'equip': { const it = ch.inventory.find(i => i.uid === m.uid); if (!it) return; if (a.action && a.action.until > a.zone.now) return err('行動中は変更できません');
        if (it.kind === 'weapon') { const w = DATA.weapons.get(it.ref); if (w.lvl > ch.level + 10 && !WT_BY_ID[w.wt].myth) return err(`Lv${w.lvl - 10}以上で装備できます`); ch.equip.weapon = it.uid; ch.mastery[w.wt] ||= { lv: 1, xp: 0 }; }
        else if (it.kind === 'armor') { if (armorDef(it.slot, it.tier).lvl > ch.level + 10) return err('レベルが足りません'); ch.equip[it.slot] = it.uid; }
        a.comboStep = 0; a.altMode = false; a.gauge = null; return ok('装備を変更しました'); }
      case 'alloc': { const st = m.stat; const n = Math.max(1, Math.min(ch.statPoints, m.n | 0 || 1)); if (!STATS.includes(st) || ch.statPoints < n) return; ch.stats[st] += n; ch.statPoints -= n; return ok(); }
      case 'resetStats': { if (!inTown) return err('街でのみ可能です'); const cost = ch.level * 100; if (ch.gold < cost) return err(`${cost}G必要です`); ch.gold -= cost; let sum = 0; for (const k of STATS) { sum += ch.stats[k]; ch.stats[k] = 0; } ch.statPoints += sum; return ok('ステータスを再分配できます'); }
      case 'slot': { const i = m.i | 0; if (i < 0 || i >= SKILL_SLOTS) return; const id = m.id || null; if (id && (!knownSkills(ch).includes(id) || DATA.skills.get(id)?.kind === 'passive')) return err('そのスキルは使用できません'); ch.skills.slots = ch.skills.slots.map(x => x === id ? null : x); ch.skills.slots[i] = id; return ok(); }
      case 'job': { if (!inTown) return err('職業ギルド（街）で転職できます'); const j = DATA.jobs.get(m.id); if (!j) return; if (!ch.jobs[j.id]) { if (!jobUnlockMet(ch, j)) return err('解放条件を満たしていません'); ch.jobs[j.id] = { rank: 0, xp: 0 }; } ch.job = j.id; return ok(`${j.name}に転職しました`); }
      case 'buy': { if (!inTown) return; const kind = m.kind; const town = a.zone.id;
        if (kind === 'weapon') { if (!shopStock(town, 'weapon').includes(m.ref)) return err('在庫がありません'); const w = DATA.weapons.get(m.ref); if (ch.gold < w.price) return err('ゴールドが足りません'); ch.gold -= w.price; addItem(ch, { kind: 'weapon', ref: w.id, plus: 0 }, n => this.note(s, n)); return ok(`${w.name}を購入しました`); }
        if (kind === 'armor') { const tier = m.tier | 0; if (!shopStock(town, 'armor').includes(tier)) return; const slot = m.slot === 'accessory' ? 'accessory' : 'armor'; const price = Math.round(200 * Math.pow(2.2, tier)); if (ch.gold < price) return err('ゴールドが足りません'); ch.gold -= price; addItem(ch, { kind: 'armor', slot, tier, plus: 0 }); return ok(`${armorDef(slot, tier).name}を購入しました`); }
        if (kind === 'item') { const n = Math.max(1, Math.min(99, m.n | 0 || 1)); const price = ITEM_PRICES[m.ref]; if (!price) return; if (ch.gold < price * n) return err('ゴールドが足りません'); ch.gold -= price * n; addItem(ch, { kind: m.ref === 'ore' ? 'mat' : 'potion', ref: m.ref, n }); return ok('購入しました'); }
        return; }
      case 'sell': { if (!inTown) return; const it = ch.inventory.find(i => i.uid === m.uid); if (!it || Object.values(ch.equip).includes(it.uid)) return err('装備中のアイテムは売却できません'); let price = 10; if (it.kind === 'weapon') price = Math.round(DATA.weapons.get(it.ref).price * 0.3); else if (it.kind === 'armor') price = Math.round(60 * Math.pow(2.2, it.tier)); else price = (ITEM_PRICES[it.ref] || 20) * 0.3 * (it.n || 1); ch.gold += Math.round(price); ch.inventory = ch.inventory.filter(i => i !== it); return ok(`${Math.round(price)}Gで売却しました`); }
      case 'enhance': { if (!inTown) return err('鍛冶屋で強化できます'); const r = enhance(ch, m.uid); if (r.error) return err(r.error); return ok(r.ok ? `強化成功！ +${r.plus}` : '強化失敗…（素材は消費されました）'); }
      case 'quest': { const board = questBoard(a.zone.id, day()); const q = board.find(x => x.id === m.id) || ch.progress.quests[m.id]?.def;
        if (m.act === 'accept') { if (!q || ch.progress.quests[q.id]) return; if (Object.values(ch.progress.quests).filter(x => !x.done).length >= 8) return err('同時受注は8件までです'); ch.progress.quests[q.id] = { def: q, prog: 0 }; return ok(`「${q.name}」を受注しました`); }
        if (m.act === 'turnin') { const st = ch.progress.quests[m.id]; if (!st?.ready || st.done) return err('未達成です'); st.done = true; const r = st.def.reward; ch.gold += r.gold || 0; grantXp(ch, r.xp || 0, n => this.note(s, n)); if (r.ore) addItem(ch, { kind: 'mat', ref: 'ore', n: r.ore });
          if (r.item === 'weaponBoss') for (const it of rollLoot({ floor: st.def.floor, diff: 'HARD', boss: true, preferWt: a.wt.id })) addItem(ch, it, n => this.note(s, n));
          if (r.myth) for (const it of rollLoot({ floor: 100, diff: 'ABYSS', boss: false, mythChance: 1 })) if (it.myth) addItem(ch, it, n => this.note(s, n));
          if (r.relic) ch.progress.items[r.relic] = 1; checkJobUnlocks(ch, n => this.note(s, n));
          return ok(`クエスト報酬を受け取りました`); }
        if (m.act === 'abandon') { delete ch.progress.quests[m.id]; return ok(); } return; }
      case 'dungeon': return this.enterDungeon(s, m.id, m.diff, m.floor | 0 || 1);
      case 'leave': if (a.zone.kind === 'dungeon') this.leaveDungeon(s); return;
      case 'invite': { const t = [...this.sessions.values()].find(o => o.ch?.name === m.name); if (!t || t === s) return err('プレイヤーが見つかりません'); const p = this.ensureParty(ch.id); if (p.leader !== ch.id) return err('リーダーのみ招待できます'); if (p.members.length + p.npcs.length >= 6) return err('パーティーは6人までです'); p.invites.add(t.ch.id); t.send({ t: 'invite', from: ch.name, pid: p.id }); this.pushParty(ch.id); return ok(`${t.ch.name}を招待しました`); }
      case 'accept': { const p = this.parties.get(m.pid); if (!p || !p.invites.has(ch.id)) return err('招待が無効です'); this.leaveParty(ch.id, true); p.invites.delete(ch.id); p.members.push(ch.id); for (const id of p.members) this.pushParty(id); return ok('パーティーに参加しました'); }
      case 'leaveParty': this.leaveParty(ch.id); return ok('パーティーを離脱しました');
      case 'kick': { const p = this.partyOf(ch.id); if (!p || p.leader !== ch.id) return; if (p.members.includes(m.id)) { this.leaveParty(m.id); } else if (p.npcs.includes(m.id)) { const n = this.npcs.byId.get(m.id); this.npcs.despawn(n); this.npcs.leaveParty(n); p.npcs = p.npcs.filter(x => x !== m.id); this.pushParty(ch.id); } return ok(); }
      case 'npcInvite': { const n = this.npcs.byId.get(m.id); if (!n || n.state === 'party' || !n.actorId) return err('勧誘できません'); const p = this.ensureParty(ch.id); if (p.leader !== ch.id) return err('リーダーのみ勧誘できます'); if (p.members.length + p.npcs.length >= 6) return err('パーティーは6人までです'); const r = this.npcs.invite(n, ch); if (r.ok) { p.npcs.push(n.id); this.pushParty(ch.id); } return ok(r.msg); }
      case 'npcList': return s.send({ t: 'npcList', list: this.npcs.list.map(n => ({ id: n.id, name: n.ch.name, lv: n.ch.level, state: n.state, where: n.zone, bond: n.bond[ch.id] || 0 })) });
      case 'npcInfo': { const n = this.npcs.byId.get(m.id); if (n) s.send({ t: 'open', service: 'npc', data: { ...this.npcs.info(n), bond: n.bond[ch.id] || 0, inParty: n.partyWith === ch.id, remote: !n.actorId || n.actorZone !== a.zone.id } }); return; }
      case 'tut': { const v = Math.max(0, Math.min(99, m.s | 0)); if (v > (ch.progress.tut || 0) || m.reset) ch.progress.tut = m.reset ? 0 : v; return; }
      case 'players': return s.send({ t: 'players', list: [...this.sessions.values()].filter(o => o.ch).map(o => ({ name: o.ch.name, lv: o.ch.level, zone: o.actor?.zone.name })) });
    }
  }
}
function clampN(v) { v = +v; return Number.isFinite(v) ? Math.max(-1, Math.min(1, v)) : 0; }
function migrate(ch) { ch.progress.codex ||= []; ch.progress.quests ||= {}; ch.progress.items ||= {}; ch.progress.npcBond ||= {}; ch.skills.levels ||= {}; }
