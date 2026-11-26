// The Lost Thousand Spells: 8 categories x 125 = 1,000 spells + 第零魔法. Effects use the shared skill schema
// (executed by server/game/skillExec.js). Seven "key spells" (重要魔法) gate the final research.
const r2 = v => Math.round(v * 100) / 100;
const EL = ['fire', 'ice', 'thunder', 'wind', 'earth', 'water', 'holy', 'dark', 'void'];
const ELN = { fire: '焔', ice: '氷', thunder: '雷', wind: '風', earth: '岩', water: '水', holy: '聖', dark: '闇', void: '虚' };
const ADJ = ['蒼き', '紅き', '白銀の', '黒曜の', '翠玉の', '琥珀の', '月影の', '陽炎の', '星屑の', '朧の', '暁の', '黄昏の', '深淵の', '天穹の', '鉄血の', '幽玄の', '螺旋の', '残響の', '久遠の', '忘却の', '原野の', '泡沫の', '霜夜の', '雷鳴の', '灰燼の'];
export const SPELL_CATS = [
  { k: 'lostel', name: '失伝属性魔法', forms: ['弾', '槍', '環', '奔流', '雨'], mk: (el, p, f) => f === 4 ? [{ t: 'barrage', n: 6 + Math.round(p * 2), r: 24, spread: 100, delay: 300, interval: 80, m: r2(0.35 * p), el }] : [{ t: 'hit', shape: f === 2 ? { s: 'circle', r: 60 + 10 * p } : { s: 'proj', spd: 7 + f, rng: 200 + 30 * p, sz: 5 + f, aoe: f === 3 ? 50 : 0 }, m: r2(1.6 * p), el }] },
  { k: 'ancient', name: '古代魔法', forms: ['碑文', '王冠', '方陣', '門', '詠唱'], mk: (el, p) => [{ t: 'barrage', n: 8, r: 28, spread: 130, delay: 450, interval: 70, m: r2(0.45 * p), el: el === 'fire' ? 'holy' : el }, { t: 'buff', mods: { spellDmg: r2(0.08 * p) }, dur: 8000 }] },
  { k: 'compound', name: '複合魔法', forms: ['双極', '交差', '融合', '螺旋', '連鎖'], mk: (el, p, f, el2) => [{ t: 'hit', shape: { s: 'circle', r: 70 }, m: r2(1.0 * p), el }, { t: 'hit', shape: { s: 'circle', r: 90 }, m: r2(0.9 * p), el: el2, delay: 250 }] },
  { k: 'space', name: '空間魔法', forms: ['転位', '断層', '歪曲', '引力', '虚門'], mk: (el, p, f) => f === 0 ? [{ t: 'blink', d: 110 + 10 * p }, { t: 'hit', shape: { s: 'circle', r: 60 }, m: r2(1.2 * p), el }] : [{ t: 'zone', at: 'target', r: 80 + 8 * p, dur: 2500, tick: 300, pull: f === 3 ? 4 : 1, m: r2(0.25 * p), el }] },
  { k: 'time', name: '時間魔法', forms: ['停滞', '加速', '刻印', '巻き戻し', '永劫'], mk: (el, p, f) => f === 1 ? [{ t: 'buff', mods: { aspd: r2(0.15 * p), cdr: r2(0.1 * p) }, dur: 9000 }] : f === 3 ? [{ t: 'heal', amt: r2(0.12 * p), r: 120 }, { t: 'buff', mods: { cdr: 0.15 }, dur: 6000 }] : [{ t: 'zone', at: 'target', r: 90, dur: 4000, tick: 400, m: r2(0.2 * p), slow: 0.6, el }] },
  { k: 'summon', name: '召喚魔法', forms: ['使い魔', '精霊', '守護像', '幻獣', '書霊'], mk: (el, p, f) => [{ t: 'summon', kind: ['familiar', 'spirit', 'golem', 'beast', 'tome'][f], n: f === 2 ? 1 : 2, dur: 15000 + 1000 * p, m: r2(0.4 * p) }] },
  { k: 'null', name: '無属性魔法', forms: ['衝', '貫', '砕', '盾', '理'], mk: (el, p, f) => f === 3 ? [{ t: 'shield', amt: r2(0.15 * p), dur: 6000 }] : [{ t: 'hit', shape: f === 1 ? { s: 'thrust', l: 120, w: 14 } : { s: 'circle', r: 70 }, m: r2(1.7 * p), pen: 0.3 }] },
  { k: 'forbidden', name: '禁忌魔法', forms: ['呪縛', '代償', '冥火', '終焉', '侵蝕'], mk: (el, p, f) => [{ t: 'zone', at: 'target', r: 90, dur: 5000, tick: 500, m: r2(0.4 * p), status: ['curse', 0.6, 3000], el: 'dark' }, { t: 'buff', mods: { spellDmg: r2(0.2 * p), dr: -0.1 }, dur: 8000 }] },
];
const KEY = ['原初の焔', '古代王の門', '双極の環', '虚空の扉', '刻停め', '星霊召喚', '無の理'];
export function buildSpells() {
  const out = [];
  SPELL_CATS.forEach((C, ci) => { for (let i = 0; i < 125; i++) {
    const adj = ADJ[i % 25], f = Math.floor(i / 25), el = EL[(i + ci * 3) % 9], el2 = EL[(i + ci * 3 + 4) % 9]; const tier = 1 + Math.floor(i / 25); const p = 1 + tier * 0.25;
    const key = i === 124 && ci < 7; const name = key ? KEY[ci] : `${adj}${ELN[el]}${C.forms[f]}`;
    out.push({ id: `sp_${ci}_${i}`, name, src: 'spell', kind: 'spell', cat: C.k, catName: C.name, tier, key, el: ['summon', 'null'].includes(C.k) ? null : el,
      eff: C.mk(el, key ? p * 1.4 : p, f, el2), cost: Math.round(14 + tier * 6 + (key ? 10 : 0)), cd: Math.round(9000 + tier * 1500), cast: ['ancient', 'forbidden'].includes(C.k) ? 500 : 0, frags: tier <= 2 ? 2 : 3 });
  } });
  out.push({ id: 'sp_zero', name: '第零魔法：オリジン', src: 'spell', kind: 'spell', cat: 'origin', catName: '第零魔法', tier: 6, key: false, zero: true, el: 'void', eff: [{ t: 'barrage', n: 16, r: 36, spread: 180, delay: 500, interval: 60, m: 1.1, el: 'void' }, { t: 'buff', mods: { spellDmg: 0.4, cdr: 0.2 }, dur: 12000 }], cost: 80, cd: 40000, cast: 800, frags: 0 });
  return out;
}
