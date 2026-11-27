// Magic circle library (WEAPON IDENTITY directive §6-7). A circle = design family + pattern + symbol set + attribute +
// weapon theme + animation. Every skill resolves to a circle from what it actually does (effect kinds), its element and
// its weapon theme, so different effects never share one generic circle. The client draws each pattern procedurally.
export const FAMILIES = { geo: '幾何学系', glyph: '文字・記号系', summon: '召喚系', elem: '属性系', special: '特殊系', weapon: '武器紋' };
// pattern → [family, layers, animation, symbols]
export const PATTERNS = {
  rings: ['geo', 3, 'counter', null], hexagram: ['geo', 2, 'spin', null], octagram: ['geo', 2, 'spin', null], polylink: ['geo', 2, 'pulse', null], concentric: ['geo', 4, 'breathe', null],
  geomesh: ['geo', 3, 'counter', null], tiered: ['geo', 3, 'stack', null],
  ancient: ['glyph', 2, 'scroll', 'ᚠᚢᚦᚨᚱᚲᚷᚹ'], runic: ['glyph', 2, 'scroll', 'ᛁᛃᛇᛈᛉᛊᛏᛒ'], divine: ['glyph', 3, 'light', '✠✡☩✙✚✛'], formula: ['glyph', 2, 'scroll', '∑∫∂∇∞≡√π'], cipher: ['glyph', 2, 'reverse', '◐◑◒◓◔◕'], classglyph: ['glyph', 2, 'scroll', '⚔⚒⚖⚗⚙⚚'],
  crest: ['summon', 2, 'light', '❖'], skeletal: ['summon', 2, 'pulse', null], puppet: ['summon', 3, 'counter', null], multisummon: ['summon', 3, 'split', null], pact: ['summon', 2, 'light', '⛧'],
  flame: ['elem', 2, 'flicker', null], frost: ['elem', 2, 'spin', null], bolt: ['elem', 2, 'flicker', null], vortex: ['elem', 3, 'swirl', null], tide: ['elem', 2, 'wave', null], crystal: ['elem', 2, 'light', null],
  halo: ['elem', 2, 'breathe', null], erosion: ['elem', 2, 'creep', null], warp: ['elem', 3, 'fold', null], gravity: ['elem', 4, 'converge', null],
  clock: ['special', 3, 'clock', 'ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩⅪⅫ'], constellation: ['special', 1, 'light', null], gears: ['special', 3, 'gears', null], reverse: ['special', 2, 'reverse', 'ᚱᛖᚹᛖᚱᛋᛖ'], fold: ['special', 3, 'fold', null],
  chainlink: ['special', 3, 'split', null], vertical: ['special', 2, 'rise', null], floating: ['special', 2, 'bob', null],
  thread: ['weapon', 3, 'counter', null], scope: ['weapon', 2, 'spin', null], bladearc: ['weapon', 2, 'sweep', null], bowstring: ['weapon', 2, 'pulse', null], pierceline: ['weapon', 2, 'rise', null],
  staff: ['weapon', 3, 'light', null], notes: ['weapon', 2, 'wave', '♪♫♩♬'], chain: ['weapon', 2, 'swirl', null], transform: ['weapon', 3, 'gears', null] };
export const ATTRS = ['phys', 'fire', 'ice', 'thunder', 'wind', 'water', 'earth', 'holy', 'dark', 'void', 'time', 'gravity', 'heal', 'guard', 'summon'];
const ATTR_COL = { phys: ['#e8e0d0', '#a89a80'], fire: ['#ff7a30', '#ffd060'], ice: ['#a0e8ff', '#ffffff'], thunder: ['#ffe060', '#a0c0ff'], wind: ['#a0ffc0', '#e0fff0'], water: ['#60a0ff', '#a0f0ff'], earth: ['#c09050', '#80e0a0'],
  holy: ['#fff0a0', '#ffffff'], dark: ['#a060ff', '#ff60c0'], void: ['#8040c0', '#20e0ff'], time: ['#e0c080', '#80a0ff'], gravity: ['#6040a0', '#c080ff'], heal: ['#80ffa0', '#fff0c0'], guard: ['#a0c0ff', '#e0e8ff'], summon: ['#c080ff', '#ffd0ff'] };
// every pattern × attribute is a circle record (data the client draws)
export const CIRCLES = {};
for (const [p, [fam, layers, anim, sym]] of Object.entries(PATTERNS)) for (const at of ATTRS) {
  const id = `mc_${p}_${at}`; const h = [...id].reduce((t, c) => (t * 31 + c.charCodeAt(0)) >>> 0, 7);
  CIRCLES[id] = { id, designFamily: fam, geometricPattern: p, symbolSet: sym, attribute: at, weaponTheme: fam === 'weapon' ? p : null, animationPattern: anim, rotationSpeed: 0.4 + (h % 7) / 10 * (h % 2 ? 1 : -1),
    scale: 1, colorParameters: ATTR_COL[at], layerCount: layers + (h % 2), activationSequence: ['expand', 'light', anim === 'converge' ? 'collapse' : 'flash'] }; }
const EL_PATTERN = { fire: 'flame', ice: 'frost', thunder: 'bolt', wind: 'vortex', water: 'tide', earth: 'crystal', holy: 'halo', dark: 'erosion', void: 'warp' };
// choose a circle from what the skill actually does; weapon theme wins for weapon-unique skills
export function circleFor(sk, theme) {
  if (!sk) return 'mc_rings_phys'; if (sk.circle) return sk.circle; const ef = sk.eff || []; const kinds = new Set(ef.map(e => e.t)); const el = sk.el || ef.find(e => e.el)?.el || null; const at = el && ATTRS.includes(el) ? el : 'phys';
  const has = k => kinds.has(k);
  if (has('heal') || ef.some(e => e.heal)) return `mc_${has('aura') ? 'concentric' : 'halo'}_heal`;
  if (has('shield') || ef.some(e => e.wall)) return `mc_${has('buff') ? 'tiered' : 'rings'}_guard`;
  if (has('summon')) { const k = ef.find(e => e.t === 'summon')?.kind; return `mc_${k === 'skeleton' ? 'skeletal' : k === 'puppet' ? 'puppet' : (ef.find(e => e.t === 'summon')?.n || 1) > 1 ? 'multisummon' : 'pact'}_summon`; }
  if (ef.some(e => e.mods?.cdr || e.mods?.aspd) && has('zone')) return `mc_clock_time`;
  if (ef.some(e => e.pull)) return `mc_gravity_${at === 'phys' ? 'gravity' : at}`;
  if (has('blink') || has('dash')) return `mc_fold_${at}`;
  if (has('barrage')) return `mc_constellation_${at}`;
  if (has('counter')) return `mc_reverse_${at}`;
  if (has('buff') || has('aura')) return `mc_${has('aura') ? 'divine' : 'runic'}_${at}`;
  if (has('zone')) return `mc_${EL_PATTERN[el] || 'geomesh'}_${at}`;
  if (theme) return `mc_${theme}_${at}`;
  const sh = ef.find(e => e.shape)?.shape?.s; if (sh === 'beam') return `mc_${el ? EL_PATTERN[el] || 'octagram' : 'octagram'}_${at}`; if (sh === 'proj') return `mc_${el ? 'hexagram' : 'polylink'}_${at}`; if (sh === 'circle') return `mc_${EL_PATTERN[el] || 'concentric'}_${at}`;
  return `mc_${el ? EL_PATTERN[el] || 'ancient' : ['ancient', 'formula', 'cipher', 'classglyph'][(sk.id || '').length % 4]}_${at}`; }
const PATTERN_JA = { rings: '重環陣', hexagram: '六芒陣', octagram: '八芒陣', polylink: '連環多角陣', concentric: '同心陣', geomesh: '幾何網陣', tiered: '多層障壁陣', ancient: '古代文字陣', runic: 'ルーン陣', divine: '神聖紋陣', formula: '数式陣', cipher: '暗号陣', classglyph: '職紋陣',
  crest: '紋章召喚陣', skeletal: '骸骨召喚陣', puppet: '傀儡召喚陣', multisummon: '多重召喚陣', pact: '契約陣', flame: '火炎紋', frost: '氷晶紋', bolt: '雷紋', vortex: '旋風紋', tide: '潮流紋', crystal: '結晶紋', halo: '光輪紋', erosion: '侵蝕紋', warp: '空間歪曲紋', gravity: '重力収束紋',
  clock: '時計陣', constellation: '星座陣', gears: '歯車陣', reverse: '反転陣', fold: '空間折畳陣', chainlink: '連鎖陣', vertical: '垂直陣', floating: '浮遊陣', thread: '糸繰り紋', scope: '照準紋', bladearc: '剣閃紋', bowstring: '弦紋', pierceline: '貫通線紋', staff: '杖紋', notes: '音符紋', chain: '鎖紋', transform: '変形機構紋' };
const ATTR_JA = { phys: '無', fire: '炎', ice: '氷', thunder: '雷', wind: '風', water: '水', earth: '地', holy: '聖', dark: '闇', void: '虚', time: '時', gravity: '重', heal: '癒', guard: '護', summon: '召' };
export function circleName(id) { const C = CIRCLES[id]; return C ? `${PATTERN_JA[C.geometricPattern]}（${ATTR_JA[C.attribute]}）` : '魔法陣'; }
