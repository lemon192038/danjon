// Shared progression & combat formulas. Pure functions used by server (authoritative) and client (previews).
import { STATS, RARITIES } from './constants.js';
import { WT_BY_ID, categoryOf } from './data/weaponTypes.js';

export const xpToNext = lv => Math.round(40 * Math.pow(lv, 1.55) + 60);
export const masteryXpToNext = lv => Math.round(25 * Math.pow(lv, 1.35) + 30);
export const jobXpToNext = rank => Math.round(120 * Math.pow(rank + 1, 1.8));
export const STAT_POINTS_PER_LEVEL = 3;

export function enhanceMult(plus) { return 1 + plus * 0.06 + (plus > 10 ? (plus - 10) * 0.05 : 0); }
export function enhanceCost(item, plus) { return { gold: Math.round((50 + (item.lvl || 1) * 20) * Math.pow(1.45, plus)), ore: 1 + Math.floor(plus / 3), rate: Math.max(0.15, 1 - plus * 0.06) }; }

// Armor & accessory are procedurally defined by tier (data-driven, no per-item code).
export const ARMOR_TIERS = ['布', '革', '鎖', '鋼', 'ミスリル', 'アダマン', 'オリハルコン', '竜鱗', '神鉄', '星霜'];
export function armorDef(slot, tier) {
  const t = ARMOR_TIERS[tier] || ARMOR_TIERS[0];
  if (slot === 'armor') return { name: `${t}の鎧`, def: 6 + tier * tier * 4 + tier * 10, hp: tier * 40, lvl: tier * 15 + 1 };
  return { name: `${t}の護符`, def: 2 + tier * 4, hp: tier * 15, sp: 10 + tier * 12, crit: 0.01 * tier, lvl: tier * 15 + 1 };
}

function addMods(dst, mods, k = 1) {
  for (const [key, v] of Object.entries(mods || {})) {
    if (typeof v === 'number') dst[key] = (dst[key] || 0) + v * k;
    else if (Array.isArray(v)) (dst[key + 'List'] ||= []).push(v);
    else if (v && typeof v === 'object') { dst[key] ||= {}; for (const [e, x] of Object.entries(v)) dst[key][e] = (dst[key][e] || 0) + x * k; }
  }
}

// data: { weapon(ref), job(id), wtSkills(wt) }
export function computeStats(ch, data, extraMods = null) {
  const inv = ch.inventory || [];
  const wItem = inv.find(i => i.uid === ch.equip?.weapon);
  const weapon = wItem ? data.weapon(wItem.ref) : null;
  const wt = WT_BY_ID[weapon?.wt || ch.starterType || 1];
  const job = data.job(ch.job);
  const jp = ch.jobs?.[ch.job] || { rank: 0 };
  const mods = {};
  const st = {};
  for (const s of STATS) st[s] = 5 + (ch.stats?.[s] || 0) + Math.floor((ch.level - 1) * 0.5);
  if (weapon) for (const [s, v] of Object.entries(weapon.stats || {})) st[s] += Math.round(v * enhanceMult(wItem.plus || 0) * 0.5 + v * 0.5);
  if (job) {
    for (const [s, v] of Object.entries(job.stats)) st[s] += v;
    addMods(mods, job.passive.mods, 1 + jp.rank * 0.1);
  }
  if (mods.all) for (const s of STATS) st[s] = Math.round(st[s] * (1 + mods.all));
  if (weapon) for (const t of weapon.traits) addMods(mods, t.mods);
  if (wItem?.epi?.mods) addMods(mods, wItem.epi.mods); // epithet earned through the weapon's own history
  // learned weapon-type passives
  const m = ch.mastery?.[wt.id]?.lv || 0;
  for (const sk of data.wtSkills(wt.id) || []) if (sk.kind === 'passive' && sk.req.mastery <= m) addMods(mods, sk.eff[0].mods);
  // armor
  let armorDefV = 0, hpAdd = 0, spAdd = 0;
  for (const slot of ['armor', 'accessory']) {
    const it = inv.find(i => i.uid === ch.equip?.[slot]);
    if (!it) continue;
    const a = armorDef(slot, it.tier || 0); const em = enhanceMult(it.plus || 0);
    armorDefV += a.def * em; hpAdd += (a.hp || 0) * em; spAdd += (a.sp || 0) * em; if (a.crit) mods.crit = (mods.crit || 0) + a.crit;
  }
  if (extraMods) addMods(mods, extraMods);
  // job weapon affinity (bonus only, never restriction)
  const cat = categoryOf(wt.id)?.id;
  let affinity = 0;
  if (job && cat) affinity = job.affinity.best.includes(cat) ? 0.12 : job.affinity.good.includes(cat) ? 0.06 : 0;
  // stat scaling
  let scale = 0; for (const [s, k] of Object.entries(wt.scale)) scale += st[s] * k;
  const goodBonus = wt.good.reduce((a, s) => a + st[s] * 0.15, 0) - wt.weak.reduce((a, s) => a + Math.max(0, 20 - st[s]) * 0.1, 0);
  const baseAtk = weapon ? weapon.atk * enhanceMult(wItem.plus || 0) : 8;
  const atk = baseAtk * (1 + (scale + goodBonus) / 60) * (1 + (mods.atk || 0) + affinity + m * 0.004);
  const maxHp = Math.round((120 + st.vit * 14 + ch.level * 18 + hpAdd) * (1 + (mods.hp || 0)));
  const maxSp = Math.round((60 + st.int * 2.5 + st.mnd * 3 + ch.level * 2 + spAdd) * (1 + (mods.sp || 0)));
  return {
    st, mods, wt: wt.id, weapon, affinity,
    atk: Math.round(atk), matk: Math.round(atk * (0.6 + st.int / 80) * (1 + (mods.spellDmg || 0))),
    def: Math.round(st.vit * 1.6 + armorDefV + ch.level * 0.8),
    maxHp, maxSp,
    crit: Math.min(0.8, 0.05 + st.dex * 0.0012 + st.luk * 0.0025 + (weapon?.crit || 0) + (mods.crit || 0)),
    critDmg: 1.5 + st.luk * 0.004 + (mods.critDmg || 0),
    aspd: Math.min(2.2, (1 + st.agi * 0.0035 + (mods.aspd || 0)) * (weapon?.spd || 1)),
    move: Math.min(2, wt.move * (1 + st.agi * 0.0015 + (mods.move || 0))),
    dr: Math.min(0.75, mods.dr || 0),
    cdr: Math.min(0.6, mods.cdr || 0),
    spRegen: 1.2 + st.mnd * 0.04 + (mods.spRegen || 0),
    regen: mods.regen || 0,
    range: 1 + (mods.range || 0),
  };
}

export function damage(atk, mult, defense, pen = 0) {
  const d = Math.max(0, defense * (1 - Math.min(0.95, pen)));
  return atk * mult * (100 / (100 + d));
}
export const rarity = r => RARITIES[r] || RARITIES[1];
