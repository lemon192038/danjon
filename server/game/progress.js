// Character growth: levels, stat points, weapon mastery, job proficiency, unlocks, loot, quests.
import { DATA, WT_BY_ID } from '../data.js';
import { xpToNext, masteryXpToNext, jobXpToNext, STAT_POINTS_PER_LEVEL, enhanceCost } from '../../shared/formulas.js';
import { MAX_LEVEL, MAX_MASTERY, DIFFICULTIES, STATS } from '../../shared/constants.js';
import { STARTER_WEAPON_TYPES } from '../../shared/data/weaponTypes.js';
import { hash32, rng } from '../../shared/util.js';

let uidc = Date.now() % 100000;
export const uid = () => 'i' + (uidc++).toString(36) + Math.floor(Math.random() * 1e4).toString(36);

export function newCharacter(id, name, wtId, look) {
  if (!STARTER_WEAPON_TYPES.includes(wtId)) wtId = 1;
  const w = DATA.wtWeapons.get(wtId)[0];
  const wu = uid(), au = uid();
  const ch = {
    id, name, look, created: Date.now(), level: 1, xp: 0, statPoints: 0, stats: Object.fromEntries(STATS.map(s => [s, 0])), gold: 300,
    inventory: [{ uid: wu, kind: 'weapon', ref: w.id, plus: 0 }, { uid: au, kind: 'armor', slot: 'armor', tier: 0, plus: 0 }, { uid: uid(), kind: 'potion', ref: 'hp', n: 5 }, { uid: uid(), kind: 'mat', ref: 'ore', n: 3 }],
    equip: { weapon: wu, armor: au, accessory: null }, starterType: wtId,
    mastery: { [wtId]: { lv: 1, xp: 0 } }, job: 'warrior_0', jobs: {}, skills: { slots: [null, null, null, null], levels: {} },
    progress: { kills: 0, famKills: {}, bossKills: {}, clears: {}, abyssMax: 0, titles: ['駆け出し冒険者'], npcBond: {}, items: {}, deaths: 0, quests: {}, codex: [w.id] },
    pos: { zone: 'haven', x: null, y: null },
  };
  for (const j of DATA.jobList) if (j.tier === 0 && j.unlock.level <= 1) ch.jobs[j.id] = { rank: 0, xp: 0 };
  ch.skills.slots[0] = DATA.wtSkills.get(wtId)[0].id;
  ch.skills.slots[1] = DATA.levelSkills[0].id;
  ch.skills.slots[2] = w.skill.id;
  ch.skills.slots[3] = DATA.jobs.get('warrior_0').active.id;
  return ch;
}

export function knownSkills(ch) {
  const out = [];
  const wItem = ch.inventory.find(i => i.uid === ch.equip.weapon); const w = wItem && DATA.weapons.get(wItem.ref);
  const wt = w?.wt || ch.starterType;
  const m = ch.mastery[wt]?.lv || 0;
  for (const s of DATA.wtSkills.get(wt)) if (s.req.mastery <= m) out.push(s.id);
  if (w) out.push(w.skill.id);
  for (const s of DATA.levelSkills) if (s.req.level <= ch.level) out.push(s.id);
  const j = DATA.jobs.get(ch.job); if (j) out.push(j.active.id);
  return out;
}
export function validateSlots(ch) { const k = new Set(knownSkills(ch)); ch.skills.slots = ch.skills.slots.map(s => (s && k.has(s) && DATA.skills.get(s)?.kind !== 'passive') ? s : null); }

export function grantXp(ch, n, notify) {
  if (ch.level >= MAX_LEVEL) return;
  ch.xp += Math.round(n);
  while (ch.level < MAX_LEVEL && ch.xp >= xpToNext(ch.level)) {
    ch.xp -= xpToNext(ch.level); ch.level++; ch.statPoints += STAT_POINTS_PER_LEVEL;
    notify?.({ t: 'levelup', lv: ch.level });
    for (const s of DATA.levelSkills) if (s.req.level === ch.level) notify?.({ t: 'learn', n: s.name, src: 'level' });
  }
  checkJobUnlocks(ch, notify);
}
export function grantMastery(ch, wt, n, notify) {
  const m = ch.mastery[wt] ||= { lv: 1, xp: 0 }; if (m.lv >= MAX_MASTERY) return;
  m.xp += n;
  while (m.lv < MAX_MASTERY && m.xp >= masteryXpToNext(m.lv)) { m.xp -= masteryXpToNext(m.lv); m.lv++; const s = DATA.wtSkills.get(wt)[m.lv - 1]; notify?.({ t: 'mastery', wt, lv: m.lv, n: s?.name }); }
}
export function grantJobXp(ch, n, notify) {
  const j = ch.jobs[ch.job]; if (!j || j.rank >= 10) return;
  j.xp += n;
  while (j.rank < 10 && j.xp >= jobXpToNext(j.rank)) { j.xp -= jobXpToNext(j.rank); j.rank++; notify?.({ t: 'jobrank', job: ch.job, rank: j.rank }); }
  checkJobUnlocks(ch, notify);
}
export function jobUnlockMet(ch, job) {
  const u = job.unlock, p = ch.progress;
  if (ch.level < (u.level || 1)) return false;
  if (u.job && (ch.jobs[u.job]?.rank ?? -1) < (u.prof || 0)) return false;
  if (u.kills && p.kills < u.kills) return false;
  if (u.clear && (p.clears[u.clear.dungeon]?.max || 0) < u.clear.floor) return false;
  if (u.boss && (p.bossKills[u.boss.diff] || 0) + (u.boss.diff === 'HARD' ? (p.bossKills.HELL || 0) + (p.bossKills.ABYSS || 0) : 0) < u.boss.count) return false;
  if (u.abyss && p.abyssMax < u.abyss) return false;
  if (u.hidden) { const h = u.hidden; if (h.abyssFloor && p.abyssMax < h.abyssFloor) return false; if (h.npcBond && !Object.values(p.npcBond).some(v => v >= h.npcBond)) return false; if (h.item && !p.items[h.item]) return false; }
  return true;
}
export function checkJobUnlocks(ch, notify) {
  for (const j of DATA.jobList) if (!ch.jobs[j.id] && jobUnlockMet(ch, j)) { ch.jobs[j.id] = { rank: 0, xp: 0 }; notify?.({ t: 'jobunlock', job: j.id, n: j.name, tier: j.tierName }); }
}
export function skillUsed(ch, id, notify) {
  const s = ch.skills.levels[id] ||= { lv: 1, uses: 0 }; s.uses++;
  const TH = [0, 10, 25, 50, 90, 140, 200, 280, 380, 500];
  if (s.lv < 10 && s.uses >= TH[s.lv]) { s.lv++; notify?.({ t: 'skilllv', id, lv: s.lv, n: DATA.skills.get(id)?.name }); }
}

// ---- loot
const POOL_CACHE = new Map();
function weaponPool(src, floor, diff, myth) {
  const key = src + floor + diff + myth; if (POOL_CACHE.has(key)) return POOL_CACHE.get(key);
  const di = DIFFICULTIES.findIndex(d => d.id === diff);
  const out = [];
  for (const w of DATA.weapons.values()) {
    const wt = WT_BY_ID[w.wt]; if (!!wt.myth !== myth) continue;
    if (!src.includes(w.acq.src)) continue;
    if (w.acq.minFloor > floor) continue;
    if (DIFFICULTIES.findIndex(d => d.id === w.acq.diff) > di) continue;
    out.push(w);
  }
  POOL_CACHE.set(key, out); if (POOL_CACHE.size > 400) POOL_CACHE.clear(); return out;
}
// Prefer weapon types the party actually uses (smarter drops), but allow all.
export function rollLoot({ floor, diff, boss, chest, mythChance = 0, luck = 0, preferWt }) {
  const items = []; const di = DIFFICULTIES.findIndex(d => d.id === diff);
  const pWeapon = boss ? 1 : chest ? 0.8 : 0.045 + di * 0.01 + luck;
  if (Math.random() < pWeapon) {
    const src = boss ? ['boss', 'drop', 'chest', 'quest'] : chest ? ['chest', 'drop', 'shop'] : ['drop', 'shop'];
    let pool = weaponPool(src, floor, diff, false);
    if (preferWt && Math.random() < 0.5) { const p2 = pool.filter(w => w.wt === preferWt); if (p2.length) pool = p2; }
    if (pool.length) { pool = pool.slice().sort((a, b) => b.lvl - a.lvl); const w = pool[Math.floor(Math.pow(Math.random(), 2.2) * Math.min(pool.length, 60))]; items.push({ kind: 'weapon', ref: w.id, plus: 0 }); }
  }
  if (mythChance && Math.random() < mythChance) { const pool = weaponPool(['abyssBoss', 'godEvent', 'specialQuest', 'hiddenEvent', 'specialBoss'], floor, diff, true); if (pool.length) items.push({ kind: 'weapon', ref: pool[Math.floor(Math.random() * pool.length)].id, plus: 0, myth: 1 }); }
  if (Math.random() < (boss ? 1 : 0.06)) items.push({ kind: 'armor', slot: Math.random() < 0.6 ? 'armor' : 'accessory', tier: Math.min(9, Math.floor(floor / 11) + Math.floor(di / 2) + (boss ? 1 : 0)), plus: 0 });
  if (Math.random() < (boss ? 1 : 0.15)) items.push({ kind: 'mat', ref: 'ore', n: boss ? 3 + di : 1 });
  if (Math.random() < 0.08) items.push({ kind: 'potion', ref: Math.random() < 0.7 ? 'hp' : 'sp', n: 1 });
  if (boss && di >= 3 && Math.random() < 0.3) items.push({ kind: 'mat', ref: 'abyssShard', n: 1 });
  return items;
}
export function addItem(ch, it, notify) {
  if (it.kind === 'mat' || it.kind === 'potion') { const ex = ch.inventory.find(i => i.kind === it.kind && i.ref === it.ref); if (ex) ex.n += it.n; else ch.inventory.push({ uid: uid(), ...it }); }
  else { if (ch.inventory.filter(i => i.kind === 'weapon' || i.kind === 'armor').length >= 200) { notify?.({ t: 'msg', v: 'インベントリが満杯です' }); return false; } ch.inventory.push({ uid: uid(), ...it }); }
  if (it.kind === 'weapon' && !ch.progress.codex.includes(it.ref)) ch.progress.codex.push(it.ref);
  notify?.({ t: 'loot', it });
  return true;
}
export function enhance(ch, itemUid) {
  const it = ch.inventory.find(i => i.uid === itemUid); if (!it || (it.kind !== 'weapon' && it.kind !== 'armor')) return { error: '強化できません' };
  if ((it.plus || 0) >= 20) return { error: '最大強化です' };
  const base = it.kind === 'weapon' ? DATA.weapons.get(it.ref) : { lvl: (it.tier || 0) * 15 + 1 };
  const c = enhanceCost(base, it.plus || 0); const ore = ch.inventory.find(i => i.ref === 'ore');
  if (ch.gold < c.gold || !ore || ore.n < c.ore) return { error: `ゴールド${c.gold}と強化鉱石${c.ore}個が必要です` };
  ch.gold -= c.gold; ore.n -= c.ore; if (ore.n <= 0) ch.inventory = ch.inventory.filter(i => i !== ore);
  if (Math.random() < c.rate) { it.plus = (it.plus || 0) + 1; return { ok: true, plus: it.plus }; }
  return { ok: false, plus: it.plus };
}

// ---- shops (data-driven from weapon acquisition table)
export function shopStock(town, kind) {
  const tier = { haven: 0, marina: 1, celestia: 2 }[town] ?? 0;
  if (kind === 'weapon') { const out = []; for (const list of DATA.wtWeapons.values()) for (const w of list) if (w.acq.src === 'shop' && w.acq.minFloor <= [15, 40, 100][tier] && w.acq.minFloor >= [0, 5, 20][tier]) out.push(w.id); return out; }
  if (kind === 'armor') return Array.from({ length: 4 }, (_, i) => Math.min(9, tier * 3 + i));
  return ['hp', 'sp', 'ore'];
}
export const ITEM_PRICES = { hp: 40, sp: 60, ore: 120 };

// ---- quests: generated per town per day, data-driven
export function questBoard(town, day) {
  const r = rng(hash32(town + ':' + day)); const out = [];
  const fams = [...DATA.families.keys()];
  const dun = DATA.dungeonList.filter(d => ({ haven: d.minLv < 40, marina: d.minLv >= 20 && d.minLv < 90, celestia: d.minLv >= 60 }[town]));
  for (let i = 0; i < 6; i++) {
    const kind = ['kill', 'kill', 'floor', 'boss', 'floor', 'kill'][i]; const d = dun[Math.floor(r() * dun.length)];
    const id = `${town}_${day}_${i}`;
    if (kind === 'kill') { const f = fams[Math.floor(r() * fams.length)]; const n = 10 + Math.floor(r() * 20); out.push({ id, kind, fam: f, n, name: `${DATA.families.get(f).name}討伐`, desc: `${DATA.families.get(f).name}を${n}体討伐する`, reward: { gold: 150 * n, xp: 60 * n } }); }
    else if (kind === 'floor') { const fl = 5 + Math.floor(r() * 40); out.push({ id, kind, dungeon: d.id, floor: fl, name: `${d.name}踏破`, desc: `${d.name}の${fl}階に到達する`, reward: { gold: 400 * fl, xp: 200 * fl, ore: 2 } }); }
    else { const fl = 10 * (1 + Math.floor(r() * 5)); out.push({ id, kind, dungeon: d.id, floor: fl, name: `${d.name}の守護者`, desc: `${d.name}${fl}階のボスを撃破する`, reward: { gold: 900 * fl, xp: 500 * fl, item: 'weaponBoss' } }); }
  }
  // fixed special quests (myth weapon routes)
  out.push({ id: 'sp_gods', kind: 'boss', dungeon: 'd10', floor: 50, diff: 'HARD', special: 1, name: '神々の試練', desc: '神々の試練場50階のボスをHARD以上で撃破する（神話武器獲得）', reward: { gold: 100000, xp: 200000, myth: 1 } });
  out.push({ id: 'sp_abyss', kind: 'floor', dungeon: 'd12', floor: 30, diff: 'ABYSS', special: 1, name: '深淵への到達', desc: '終焉の深淵ABYSS難易度で30階に到達する（神話武器・隠し職の鍵）', reward: { gold: 500000, xp: 1000000, myth: 1, relic: 'relic_end' } });
  out.push({ id: 'sp_origin', kind: 'boss', dungeon: 'd11', floor: 100, diff: 'HELL', special: 1, name: '原初の残響', desc: '虚無の境界100階をHELL以上で踏破する', reward: { gold: 300000, xp: 800000, myth: 1, relic: 'relic_origin' } });
  out.push({ id: 'sp_eternity', kind: 'boss', dungeon: 'd09', floor: 100, diff: 'HARD', special: 1, name: '永劫の時計', desc: '星霜の時計塔100階のボスを撃破する', reward: { gold: 200000, xp: 500000, myth: 1, relic: 'relic_eternity' } });
  return out;
}
