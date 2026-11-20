// NPC adventurers: persistent, independently progressing characters with personalities, relationships and LOD AI.
import { Fighter } from './actor.js';
import { DATA, WT_BY_ID } from '../data.js';
import { newCharacter, knownSkills, grantXp, grantMastery, uid } from './progress.js';
import { STARTER_WEAPON_TYPES } from '../../shared/data/weaponTypes.js';
import { rng, hash32 } from '../../shared/util.js';
import { reachOfType } from './reach.js';
import { WORLD } from './maps.js';

const SURN = ['アルト', 'ベル', 'カイ', 'ディア', 'エル', 'フィン', 'ガロ', 'ハル', 'イリス', 'ジン', 'クロエ', 'リオ', 'ミラ', 'ノア', 'オルカ', 'ペトラ', 'クレア', 'ルカ', 'セラ', 'ティオ', 'ユナ', 'ヴィクト', 'ウィル', 'ゼノ', 'アイラ', 'ブラム', 'シエル', 'ダリウス', 'エマ', 'フレイ', 'グレン', 'ヒナ', 'イザーク', 'ジュリア', 'カレン', 'レオン', 'マオ', 'ニーナ', 'オスカー', 'リリィ', 'ラウル', 'サラ', 'トーマ', 'ヴェラ', 'ゼファー', 'ロイ', 'ナギ', 'ソフィア'];
const EPI = ['疾風の', '鉄壁の', '紅の', '静寂の', '放浪の', '黄金の', '蒼の', '若き', '老練の', '笑う', '眠れる', '孤高の', '陽気な', '慎重な', '無謀な', '寡黙な'];
const PERS = [
  { k: 'brave', n: '勇猛', bravery: 0.9, caution: 0.2, social: 0.6, greed: 0.4, lines: ['強い奴と戦いたいぜ！', '深層を目指すなら付き合うぞ。', '恐れていたら何も手に入らない。'] },
  { k: 'careful', n: '慎重', bravery: 0.3, caution: 0.9, social: 0.5, greed: 0.3, lines: ['準備は万全に。回復薬は持ったか？', '無理は禁物だよ。', '退く勇気も大切さ。'] },
  { k: 'greedy', n: '強欲', bravery: 0.6, caution: 0.4, social: 0.3, greed: 0.95, lines: ['お宝の匂いがするな…', 'レア武器は譲らないぞ。', '金は裏切らない。'] },
  { k: 'kind', n: '温厚', bravery: 0.5, caution: 0.6, social: 0.95, greed: 0.2, lines: ['困ったことがあったら言ってね。', '一緒に冒険できて嬉しいよ。', '怪我はない？'] },
  { k: 'lone', n: '孤高', bravery: 0.7, caution: 0.5, social: 0.1, greed: 0.5, lines: ['…一人の方が気楽だ。', '邪魔はするな。', '強さだけが真実だ。'] },
  { k: 'scholar', n: '探究', bravery: 0.4, caution: 0.7, social: 0.6, greed: 0.5, lines: ['この迷宮の構造は興味深い。', '古代文明の痕跡を探しているんだ。', '知識は最大の武器さ。'] },
];
const TOWNS = ['haven', 'marina', 'celestia'];

export class NpcManager {
  constructor(world, saved) {
    this.world = world; this.list = saved?.npcs || this.generate(48); this.byId = new Map(this.list.map(n => [n.id, n])); this.next = 0;
    for (const n of this.list) { n.actorId = null; if (n.state === 'party') n.state = 'rest'; n.partyWith = null; }
  }
  generate(N) {
    const r = rng(hash32('npc-world-v1')); const out = [];
    for (let i = 0; i < N; i++) {
      const wt = STARTER_WEAPON_TYPES[Math.floor(r() * STARTER_WEAPON_TYPES.length)];
      const name = EPI[Math.floor(r() * EPI.length)] + SURN[i % SURN.length];
      const lv = Math.max(1, Math.round(Math.pow(r(), 1.8) * 70));
      const look = { body: Math.floor(r() * 3), skin: Math.floor(r() * 5), hair: Math.floor(r() * 6), hairColor: Math.floor(r() * 10), outfit: Math.floor(r() * 10) };
      const ch = newCharacter('npc' + i, name, wt, look);
      ch.level = lv; for (let k = 0; k < (lv - 1) * 3; k++) { const s = WT_BY_ID[wt].good[k % WT_BY_ID[wt].good.length] || 'vit'; ch.stats[s] = (ch.stats[s] || 0) + 1; }
      ch.mastery[wt] = { lv: Math.min(100, Math.round(lv * 0.8) + 1), xp: 0 };
      equipBest(ch, wt);
      const jobs = DATA.jobList.filter(j => j.tier <= (lv >= 35 ? 2 : lv >= 15 ? 1 : 0));
      const job = jobs[Math.floor(r() * jobs.length)]; ch.job = job.id; ch.jobs[job.id] = { rank: Math.min(10, Math.floor(lv / 8)), xp: 0 };
      fillSlots(ch);
      const p = PERS[Math.floor(r() * PERS.length)];
      out.push({ id: 'npc' + i, ch, pers: p.k, home: TOWNS[Math.floor(r() * TOWNS.length)], state: 'rest', zone: null, timer: 10 + Math.floor(r() * 60), gold: 500 + lv * 200, friends: [], rival: null, log: [], best: {}, bond: {} });
    }
    for (const n of out) { n.zone = n.home; const f = out[Math.floor(r() * N)]; if (f !== n) { n.friends.push(f.id); f.friends.push(n.id); } const rv = out[Math.floor(r() * N)]; if (rv !== n && !n.friends.includes(rv.id)) n.rival = rv.id; }
    return out;
  }
  pers(n) { return PERS.find(p => p.k === n.pers) || PERS[0]; }
  log(n, msg) { n.log.unshift({ t: Date.now(), m: msg }); n.log.length = Math.min(n.log.length, 15); }
  info(n) { const j = DATA.jobs.get(n.ch.job); const wI = n.ch.inventory.find(i => i.uid === n.ch.equip.weapon); const w = DATA.weapons.get(wI?.ref); return { id: n.id, name: n.ch.name, lv: n.ch.level, wt: WT_BY_ID[w?.wt]?.name, weapon: w?.name, rar: w?.rar, job: j?.name, jobTier: j?.tierName, pers: this.pers(n).n, state: n.state, where: n.zone, log: n.log.slice(0, 10), friends: n.friends.map(f => this.byId.get(f)?.ch.name), rival: this.byId.get(n.rival)?.ch.name, best: n.best, look: n.ch.look }; }

  // ---- LOD: abstract simulation for NPCs not near players (cheap, every 5s, staggered)
  abstractTick() {
    const batch = Math.ceil(this.list.length / 5);
    for (let k = 0; k < batch; k++) {
      const n = this.list[this.next++ % this.list.length]; if (n.state === 'party') continue;
      n.timer--; if (n.timer > 0) continue;
      const P = this.pers(n);
      if (n.state === 'rest') {
        // shopping: upgrade weapon when wealthy
        const cur = currentWeapon(n.ch); const better = DATA.wtWeapons.get(cur.wt).filter(w => w.acq.src === 'shop' && w.lvl <= n.ch.level + 3 && w.atk > cur.atk && w.price <= n.gold).pop();
        if (better) { n.gold -= better.price; const u = uid(); n.ch.inventory.push({ uid: u, kind: 'weapon', ref: better.id, plus: 0 }); n.ch.equip.weapon = u; this.log(n, `${better.name}を購入した`); this.refreshActor(n); }
        // depart for a dungeon fitting level & bravery
        const ds = DATA.dungeonList.filter(d => d.minLv <= n.ch.level + 5 * P.bravery);
        const d = ds[Math.min(ds.length - 1, Math.floor(Math.random() * ds.length))];
        n.state = 'dungeon'; n.run = { d: d.id, floor: (n.best[d.id] || 0) > 10 ? Math.floor((n.best[d.id]) / 10) * 10 + 1 : 1, diff: n.ch.level > d.minLv + 60 ? 'HARD' : 'NORMAL', with: n.friends.filter(f => this.byId.get(f)?.state === 'rest').slice(0, P.social > 0.5 ? 2 : 0) };
        for (const f of n.run.with) { const fr = this.byId.get(f); fr.state = 'dungeon'; fr.run = { ...n.run, with: [n.id], follower: true }; }
        this.log(n, `${d.name}へ出発した${n.run.with.length ? '（仲間と共に）' : ''}`);
        n.zone = 'dungeon'; n.timer = 3 + Math.floor(Math.random() * 3); this.despawn(n);
      } else if (n.state === 'dungeon') {
        const d = DATA.dungeons.get(n.run.d); const flv = d.minLv + n.run.floor * 0.9 * (n.run.diff === 'HARD' ? 1.3 : 1);
        const power = n.ch.level + (n.ch.mastery[currentWeapon(n.ch).wt]?.lv || 0) * 0.2 + n.run.with.length * 6;
        const pWin = Math.max(0.05, Math.min(0.97, 0.75 + (power - flv) * 0.03));
        if (Math.random() < pWin) {
          const boss = n.run.floor % 10 === 0;
          grantXp(n.ch, (20 + flv * 12) * (boss ? 8 : 2)); grantMastery(n.ch, currentWeapon(n.ch).wt, 20 + n.run.floor);
          n.gold += Math.round((10 + flv * 3) * (boss ? 10 : 2) * (0.5 + P.greed));
          n.best[n.run.d] = Math.max(n.best[n.run.d] || 0, n.run.floor);
          if (boss) this.log(n, `${d.name} ${n.run.floor}階のボスを撃破した！`);
          if (n.run.floor % 25 === 0) this.log(n, `${d.name} ${n.run.floor}階に到達した`);
          n.run.floor++;
          if (n.run.floor > 100 || Math.random() < 0.08 * P.caution + 0.02) this.goHome(n, '帰還した');
        } else { this.goHome(n, `${d.name} ${n.run.floor}階で敗北し撤退した`); n.injured = true; }
        n.timer = 2;
      }
    }
  }
  goHome(n, msg) { n.state = 'rest'; n.zone = Math.random() < 0.7 ? n.home : TOWNS[Math.floor(Math.random() * 3)]; n.timer = 20 + Math.floor(Math.random() * 40); this.log(n, msg); fillSlots(n.ch); }
  // ---- materialize NPCs whose abstract location is an active overworld zone
  syncZones() {
    for (const n of this.list) {
      if (n.state === 'party') continue;
      const z = n.state === 'rest' ? this.world.zones.get(n.zone) : null;
      if (z && z.players.size && !n.actorId) this.spawn(n, z);
      if (n.actorId && (!z || !z.players.size)) this.despawn(n);
    }
  }
  spawn(n, z, at) {
    const f = new Fighter(n.ch, { kind: 'npc', team: 'ally', npcId: n.id, look: n.ch.look });
    const p = at || (() => { const c = z.map.npcs?.length && Math.random() < 0.5 ? z.map.npcs[Math.floor(Math.random() * z.map.npcs.length)] : { x: z.map.start[0] + (Math.random() * 10 - 5 | 0), y: z.map.start[1] - 4 + (Math.random() * 6 | 0) }; return z.tileCenter([c.x + (Math.random() * 4 - 2) | 0, c.y + 1]); })();
    f.x = p.x; f.y = p.y; if (z.blocked(f.x, f.y)) { const s = z.tileCenter(z.map.start); f.x = s.x; f.y = s.y; }
    z.add(f); n.actorId = f.id; n.actorZone = z.id; f.npc = n; f.wander = null; return f;
  }
  despawn(n) { if (!n.actorId) return; const z = this.world.zones.get(n.actorZone); const a = z?.actors.get(n.actorId); if (a) { z.fx({ t: 'blink', x: Math.round(a.x), y: Math.round(a.y) }); z.remove(a); } n.actorId = null; }
  refreshActor(n) { const z = this.world.zones.get(n.actorZone); const a = z?.actors.get(n.actorId); if (a) a.refreshStats(); }

  // ---- full AI while materialized (same combat API as players)
  fighterTick(z, a, now) {
    const n = a.npc; if (!n) return;
    const leader = n.partyWith ? [...z.players].find(p => p.ch.id === n.partyWith) : null;
    const reach = reachOfType(a.wt);
    let t = z.nearestEnemy(a, z.kind === 'town' ? 0 : leader ? 200 : 140 + this.pers(n).bravery * 80);
    if (t && !leader && t.level > a.level + 8 && this.pers(n).caution > 0.5) t = null;
    a.attackHeld = false;
    if (t) {
      const dx = t.x - a.x, dy = t.y - a.y, d = Math.hypot(dx, dy);
      a.aimX = t.x; a.aimY = t.y; a.facing = Math.atan2(dy, dx);
      // dodge telegraphed attacks
      if (t.action?.type === 'cast' && d < 80 && Math.random() < 0.12) { a.dodge(z, -dx, -dy); return; }
      // low HP: heal/retreat
      if (a.hp < a.maxHp * (0.25 + this.pers(n).caution * 0.15)) {
        const heal = a.ch.skills.slots.find(s => s && DATA.skills.get(s)?.eff.some(e => e.t === 'heal' || e.t === 'shield'));
        if (heal && a.useSkill(heal, z) === 'ok') return;
        if (this.pers(n).caution > 0.5) { a.vx = -dx / d * 80; a.vy = -dy / d * 80; return; }
      }
      const want = reach.ranged ? Math.min(reach.reach * 0.7, 150) : reach.reach * 0.7;
      const spd = 80 * a.stats.move; const mm = a.action?.lockMove && a.action.until > now ? 0 : a.action?.moveMul ?? 1;
      if (d > want || !z.los(a, t)) { const nd = z.navDir(a, t); a.vx = nd.x * spd * mm; a.vy = nd.y * spd * mm; } else if (reach.ranged && d < want * 0.5) { a.vx = -dx / d * spd * mm; a.vy = -dy / d * spd * mm; } else { a.vx = a.vy = 0; }
      if (d < want + t.r + 10) {
        const s = a.ch.skills.slots[Math.floor(Math.random() * 4)];
        if (s && Math.random() < 0.08 && a.useSkill(s, z, { tx: t.x, ty: t.y }) === 'ok') return;
        a.attackHeld = true; a.attack(now, z);
      }
      return;
    }
    // follow party leader
    if (leader) { const dx = leader.x - a.x, dy = leader.y - a.y, d = Math.hypot(dx, dy); if (d > 300) { a.x = leader.x; a.y = leader.y; } else if (d > 40) { const nd = z.navDir(a, leader); a.vx = nd.x * 85 * a.stats.move; a.vy = nd.y * 85 * a.stats.move; } else a.vx = a.vy = 0; return; }
    // town/field wandering
    if (!a.wander || now > a.wander.until) { const pts = z.map.npcs?.length ? z.map.npcs : null; const tgt = pts && Math.random() < 0.5 ? z.tileCenter([pts[Math.floor(Math.random() * pts.length)].x, pts[0].y + 2]) : { x: a.x + (Math.random() - 0.5) * 120, y: a.y + (Math.random() - 0.5) * 120 }; a.wander = { x: tgt.x, y: tgt.y, until: now + 4000 + Math.random() * 6000 }; if (Math.random() < 0.15) z.fx({ t: 'say', id: a.id, v: this.pers(n).lines[Math.floor(Math.random() * 3)] }); }
    const dx = a.wander.x - a.x, dy = a.wander.y - a.y, d = Math.hypot(dx, dy);
    if (d > 8) { a.vx = dx / d * 40; a.vy = dy / d * 40; a.facing = Math.atan2(dy, dx); } else a.vx = a.vy = 0;
  }
  talk(n, ch) {
    const P = this.pers(n); const b = (n.bond[ch.id] ||= 0); const today = new Date().toDateString();
    if (n.lastTalk?.[ch.id] !== today) { n.lastTalk ||= {}; n.lastTalk[ch.id] = today; n.bond[ch.id] = b + 2; ch.progress.npcBond[n.id] = n.bond[ch.id]; }
    const extra = n.best && Object.keys(n.best).length ? `最近は${DATA.dungeons.get(Object.keys(n.best)[0])?.name}の${Object.values(n.best)[0]}階まで行ったよ。` : '';
    return P.lines[Math.floor(Math.random() * P.lines.length)] + ' ' + extra;
  }
  invite(n, ch) {
    const P = this.pers(n); const b = n.bond[ch.id] || 0;
    const ok = b >= 20 || Math.random() < P.social * 0.8 + b / 50;
    if (!ok) return { ok: false, msg: `${n.ch.name}「${P.k === 'lone' ? '群れるのは好きじゃない。' : '今は遠慮しておくよ。'}」` };
    n.state = 'party'; n.partyWith = ch.id; this.log(n, `${ch.name}のパーティーに加入した`);
    return { ok: true, msg: `${n.ch.name}がパーティーに加わった！` };
  }
  leaveParty(n) { n.state = 'rest'; n.partyWith = null; n.zone = n.home; n.timer = 5; }
}
export function currentWeapon(ch) { const i = ch.inventory.find(x => x.uid === ch.equip.weapon); return DATA.weapons.get(i?.ref) || DATA.wtWeapons.get(ch.starterType)[0]; }
function equipBest(ch, wt) {
  const list = DATA.wtWeapons.get(wt).filter(w => w.lvl <= ch.level && w.rar <= 3);
  const w = list[list.length - 1] || DATA.wtWeapons.get(wt)[0]; const u = uid();
  ch.inventory.push({ uid: u, kind: 'weapon', ref: w.id, plus: Math.floor(ch.level / 15) }); ch.equip.weapon = u;
}
export function fillSlots(ch) {
  const k = knownSkills(ch).map(id => DATA.skills.get(id)).filter(s => s && s.kind !== 'passive');
  const atk = k.filter(s => s.src === 'wtype').slice(-2); const heal = k.filter(s => s.eff.some(e => e.t === 'heal'))[0];
  ch.skills.slots = [atk[1]?.id || null, atk[0]?.id || null, k.find(s => s.src === 'weapon')?.id || null, heal?.id || k.find(s => s.src === 'job')?.id || null];
}
