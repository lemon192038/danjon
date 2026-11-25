// Artifacts: combine one CONDITION material and one EFFECT material (both drop at 10% from HARD+ dungeon bosses).
// The stricter the condition, the bigger the effect. Each dungeon's effect material grants its own effect family;
// the boss floor (and difficulty) scales magnitude / duration. Elemental effects use larger % than generic ones.
export const ART_CONDS = {
  skill: { name: 'スキル使用時', desc: 'スキルを使うたびに発動（最大5回まで重ね掛け）', mul: 0.45, dur: 6, stack: 5 },
  crit: { name: '会心時', desc: '会心の一撃を与えたとき', mul: 0.8, dur: 5 },
  kill: { name: '撃破時', desc: '敵を倒したとき', mul: 1.0, dur: 8 },
  mark: { name: '印破壊時', desc: '敵に刻んだ印を攻撃で破壊したとき', mul: 1.4, dur: 8 },
  parry: { name: 'パリィ・反撃成功時', desc: 'パリィやカウンターに成功したとき', mul: 1.3, dur: 6 },
  summon: { name: '召喚物死亡時', desc: '自分の召喚物が倒れたとき', mul: 1.6, dur: 10 },
  lowhp: { name: '瀕死時', desc: 'HPが30%以下の間（常時）', mul: 1.5, dur: 2 },
};
// effect families: base value at floor 50 HARD; `el` marks elemental damage (bigger numbers)
export const ART_EFFECTS = {
  atk: { name: '攻撃力', key: 'atk', base: 0.10, fmt: 'pct' }, crit: { name: '会心率', key: 'crit', base: 0.06, fmt: 'pct' }, critDmg: { name: '会心ダメージ', key: 'critDmg', base: 0.18, fmt: 'pct' },
  aspd: { name: '攻撃速度', key: 'aspd', base: 0.10, fmt: 'pct' }, dr: { name: '被ダメージ軽減', key: 'dr', base: 0.07, fmt: 'pct' },
  fire: { name: '火属性ダメージ', key: 'el_fire', base: 0.22, el: 1 }, ice: { name: '氷属性ダメージ', key: 'el_ice', base: 0.22, el: 1 }, thunder: { name: '雷属性ダメージ', key: 'el_thunder', base: 0.22, el: 1 },
  wind: { name: '風属性ダメージ', key: 'el_wind', base: 0.22, el: 1 }, water: { name: '水属性ダメージ', key: 'el_water', base: 0.22, el: 1 }, earth: { name: '土属性ダメージ', key: 'el_earth', base: 0.22, el: 1 },
  holy: { name: '聖属性ダメージ', key: 'el_holy', base: 0.24, el: 1 }, dark: { name: '闇属性ダメージ', key: 'el_dark', base: 0.24, el: 1 }, void: { name: '虚無属性ダメージ', key: 'el_void', base: 0.26, el: 1 },
};
// which effects each dungeon's effect material can carry (rolled from this list) and which conditions its condition material can carry
export const DUNGEON_ART = {
  d01: { eff: ['wind', 'aspd'], cond: ['skill', 'kill'] }, d02: { eff: ['fire', 'atk'], cond: ['kill', 'crit'] }, d03: { eff: ['ice', 'crit'], cond: ['crit', 'parry'] },
  d04: { eff: ['dark', 'critDmg'], cond: ['summon', 'kill'] }, d05: { eff: ['thunder', 'aspd'], cond: ['skill', 'mark'] }, d06: { eff: ['water', 'dr'], cond: ['parry', 'lowhp'] },
  d07: { eff: ['atk', 'critDmg'], cond: ['summon', 'skill'] }, d08: { eff: ['dark', 'atk'], cond: ['lowhp', 'mark'] }, d09: { eff: ['earth', 'aspd'], cond: ['skill', 'parry'] },
  d10: { eff: ['holy', 'crit'], cond: ['mark', 'crit'] }, d11: { eff: ['void', 'critDmg'], cond: ['summon', 'lowhp'] }, d12: { eff: ['void', 'atk', 'critDmg'], cond: ['mark', 'lowhp', 'summon'] },
};
export const DIFF_MUL = { HARD: 1, HELL: 1.3, ABYSS: 1.7 };
// power of a material from its boss floor and difficulty (1.0 at floor 50 HARD)
export const matPower = (floor, diff) => Math.round((0.6 + floor / 125) * (DIFF_MUL[diff] || 1) * 100) / 100;
export function artifactStats(cond, eff, pCond, pEff) {
  const C = ART_CONDS[cond], E = ART_EFFECTS[eff]; const p = (pCond + pEff) / 2;
  const val = Math.round(E.base * C.mul * p * 1000) / 1000; const dur = Math.round(C.dur * (0.8 + pCond * 0.4) * 10) / 10;
  return { val, dur, stack: C.stack || 1 };
}
export const artName = (cond, eff) => `${ART_CONDS[cond].name.replace(/時$/, '').replace('・反撃成功', '')}の${ART_EFFECTS[eff].el ? ART_EFFECTS[eff].name.replace('ダメージ', '') : ART_EFFECTS[eff].name}護符`;
