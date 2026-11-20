// Shared game constants (server + client).
export const TICK_RATE = 20;
export const TICK_MS = 1000 / TICK_RATE;
export const TILE = 16;
export const STATS = ['str', 'vit', 'dex', 'agi', 'int', 'mnd', 'luk'];
export const STAT_NAMES = { str: '筋力', vit: '体力', dex: '器用', agi: '敏捷', int: '知力', mnd: '精神', luk: '幸運' };
export const ELEMENTS = ['fire', 'ice', 'thunder', 'wind', 'earth', 'water', 'holy', 'dark', 'void'];
export const ELEMENT_NAMES = { phys: '物理', fire: '炎', ice: '氷', thunder: '雷', wind: '風', earth: '地', water: '水', holy: '聖', dark: '闇', void: '虚無' };
export const ELEMENT_COLORS = { phys: '#e8e8e8', fire: '#ff7a30', ice: '#9ae0ff', thunder: '#ffe84a', wind: '#9affc0', earth: '#c8a060', water: '#4aa8ff', holy: '#fff4b0', dark: '#b060ff', void: '#8a8aff' };
// attacker element -> defender element multiplier (elemental wheel)
export const ELEMENT_CHART = {
  fire: { ice: 1.5, wind: 1.25, water: 0.6, fire: 0.5, earth: 0.9 },
  ice: { wind: 1.5, water: 1.25, fire: 0.6, ice: 0.5 },
  thunder: { water: 1.5, wind: 1.2, earth: 0.6, thunder: 0.5 },
  wind: { earth: 1.5, thunder: 1.2, ice: 0.7, wind: 0.5 },
  earth: { thunder: 1.5, fire: 1.2, wind: 0.6, earth: 0.5 },
  water: { fire: 1.5, earth: 1.25, thunder: 0.6, water: 0.5 },
  holy: { dark: 1.6, void: 1.2, holy: 0.4 },
  dark: { holy: 1.6, void: 0.8, dark: 0.4 },
  void: { holy: 1.25, dark: 1.25, void: 0.3 },
};
export const STATUS = {
  burn: { name: '炎上', dot: 0.015, color: '#ff7a30' },
  freeze: { name: '凍結', stop: true, color: '#9ae0ff' },
  shock: { name: '感電', dot: 0.008, stunTick: true, color: '#ffe84a' },
  bleed: { name: '出血', dot: 0.02, stack: true, color: '#d02030' },
  poison: { name: '毒', dot: 0.012, stack: true, color: '#70d040' },
  stun: { name: '気絶', stop: true, color: '#ffffa0' },
  slow: { name: '鈍足', move: -0.45, color: '#80a0c0' },
  curse: { name: '呪い', dmgTaken: 0.2, color: '#a040c0' },
  fear: { name: '恐怖', flee: true, color: '#6030a0' },
  bind: { name: '拘束', root: true, color: '#c0a060' },
  armorbreak: { name: '防御低下', def: -0.35, color: '#c08040' },
  sleep: { name: '睡眠', stop: true, wakeOnHit: true, color: '#a0a0ff' },
  silence: { name: '沈黙', noSkill: true, color: '#808080' },
  stop: { name: '時間停止', stop: true, color: '#c0d0ff' },
};
export const RARITIES = [
  null,
  { id: 1, key: 'N', name: 'ノーマル', color: '#c8c8c8', mult: 1.0 },
  { id: 2, key: 'R', name: 'レア', color: '#5ab0ff', mult: 1.15 },
  { id: 3, key: 'SR', name: 'スーパーレア', color: '#b070ff', mult: 1.32 },
  { id: 4, key: 'SSR', name: 'ダブルスーパーレア', color: '#ffb030', mult: 1.52 },
  { id: 5, key: 'UR', name: 'ウルトラレア', color: '#ff5070', mult: 1.75 },
  { id: 6, key: 'MYTH', name: '神話', color: '#fff080', mult: 2.05 },
];
export const DIFFICULTIES = [
  { id: 'EASY', name: 'EASY', hp: 0.7, atk: 0.6, def: 0.8, ai: 0, xp: 0.8, drop: 0.8, color: '#7fe07f' },
  { id: 'NORMAL', name: 'NORMAL', hp: 1.0, atk: 1.0, def: 1.0, ai: 1, xp: 1.0, drop: 1.0, color: '#e0e0e0' },
  { id: 'HARD', name: 'HARD', hp: 1.8, atk: 1.5, def: 1.3, ai: 2, xp: 1.6, drop: 1.5, color: '#ffb040' },
  { id: 'HELL', name: 'HELL', hp: 3.4, atk: 2.4, def: 1.7, ai: 3, xp: 2.6, drop: 2.2, color: '#ff4040' },
  { id: 'ABYSS', name: 'ABYSS', hp: 7.0, atk: 4.2, def: 2.4, ai: 4, xp: 4.5, drop: 3.5, color: '#b040ff' },
];
export const MAX_LEVEL = 200;
export const MAX_MASTERY = 100;
export const SKILL_SLOTS = 4;
