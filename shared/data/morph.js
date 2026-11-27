// TRANSFORMATION WEAPON TYPES (ids 87-106). Data for the common morph system (server/game/morph.js):
// 4 stages (0 normal, 1 partial, 2 half, 3 full); each type has its own resource (name, how it fills, how it drains),
// species/forms with their own attack kit, movement, dodge, hitbox and body plan (drawn as 2D sprites by client/js/morphs.js),
// and six form-bound skills. Existing 86 types are untouched; these are appended as new types.
const A = (r, a, m, t, o = {}) => ({ s: 'arc', r, a, m, t, ...o }), T = (l, w, m, t, o = {}) => ({ s: 'thrust', l, w, m, t, ...o }), C = (r, m, t, o = {}) => ({ s: 'circle', r, m, t, ...o });
const P = (spd, rng, m, t, o = {}) => ({ s: 'proj', spd, rng, m, t, ...o }), B = (l, w, m, t, o = {}) => ({ s: 'beam', l, w, m, t, ...o }), S = (d, r, m, t, o = {}) => ({ s: 'slam', d, r, m, t, ...o }), W = (l, a, m, t, o = {}) => ({ s: 'whip', l, a, m, t, ...o });
// attack primitives of transformed bodies (name shown in the form panel)
export const ATK = {
  bite: ['噛みつき', A(26, 90, 0.95, [60, 60, 110], { st: 2, bleed: 1 })], claw: ['爪撃', A(30, 140, 0.55, [50, 60, 100], { h: 2 })], pounce: ['飛びかかり', T(50, 18, 1.4, [120, 80, 200], { lg: 60, kb: 30 })],
  maul: ['剛腕の殴打', S(24, 34, 2.0, [260, 100, 320], { st: 6, kb: 60 })], roar: ['咆哮', C(60, 0.6, [160, 120, 240], { st: 4, status: ['fear', 0.35, 1500] })], swipe: ['薙ぎ払い', A(40, 200, 0.9, [90, 70, 150], { kb: 30 })],
  breath: ['ブレス', A(84, 50, 0.4, [200, 320, 240], { h: 5 })], tail: ['尾撃', C(48, 1.1, [140, 100, 200], { kb: 50 })], wingbeat: ['羽ばたき', C(56, 0.7, [120, 80, 180], { kb: 70 })], dive: ['急降下', T(72, 22, 1.5, [160, 60, 220], { lg: 80 })],
  sting: ['毒針', T(46, 10, 0.6, [60, 40, 100], { h: 2, status: ['poison', 0.4, 3000] })], scythe: ['鎌連斬', A(36, 160, 0.4, [40, 50, 80], { h: 3, bleed: 1 })], web: ['糸', P(7, 200, 0.6, [140, 40, 200], { sz: 6, status: ['bind', 0.6, 1500] })],
  shell: ['甲殻突進', T(44, 24, 1.6, [180, 80, 240], { lg: 40, kb: 70, st: 6 })], tentacle: ['触手', W(96, 160, 0.45, [100, 60, 160], { h: 2 })], ink: ['墨', P(6, 170, 0.5, [140, 40, 200], { sz: 7, aoe: 40, status: ['slow', 0.8, 2500] })],
  glow: ['発光', C(70, 0.6, [160, 120, 220], { status: ['stun', 0.25, 800] })], slam: ['叩きつけ', S(28, 46, 2.2, [300, 120, 360], { st: 8, kb: 80 })], beam: ['光線', B(200, 14, 1.3, [180, 80, 240])],
  bolt: ['魔弾', P(11, 240, 0.5, [90, 40, 140], { n: 3, sp: 14 })], aura: ['波動', C(70, 0.45, [180, 150, 220], { h: 2 })], phase: ['すり抜け', T(80, 20, 1.0, [90, 40, 160], { lg: 70 })], wail: ['慟哭', C(80, 0.5, [200, 150, 260], { status: ['fear', 0.4, 1500] })],
  shard: ['結晶片', P(9, 200, 0.4, [100, 40, 160], { n: 5, sp: 12, sz: 4 })], pillar: ['結晶柱', S(40, 30, 1.6, [220, 100, 260], { st: 5 })], lash: ['流体の鞭', W(110, 140, 0.9, [80, 60, 140])], blade: ['刃腕', A(40, 120, 1.1, [70, 70, 140])],
  gravity: ['重力場', C(70, 0.9, [220, 140, 260], { pull: 30 })], comet: ['星弾', P(6, 260, 1.4, [200, 60, 240], { sz: 9, aoe: 50, hom: 0.06 })], mirage: ['幻影斬', A(40, 180, 0.8, [80, 60, 120], { echo: 300 })],
  echo: ['時差の突き', T(56, 12, 1.1, [80, 50, 140], { echo: 400 })], judgement: ['裁きの槌', S(36, 50, 2.4, [320, 100, 360], { el: 'holy', st: 8 })], erosion: ['侵蝕', C(64, 0.7, [200, 160, 240], { status: ['curse', 0.5, 3000] })],
  arms: ['多腕乱打', A(46, 220, 0.45, [100, 80, 160], { h: 3 })], cannon: ['砲撃', P(12, 280, 1.6, [220, 60, 300], { sz: 7, aoe: 30 })], drill: ['掘削腕', T(50, 16, 0.35, [100, 300, 180], { h: 6 })], fist: ['鉄拳', A(30, 90, 1.2, [70, 60, 120], { kb: 40 })],
  needle: ['光針', P(14, 260, 0.45, [60, 30, 90], { n: 2, sp: 6, sz: 3 })], pulse: ['衝撃波', C(50, 1.0, [120, 100, 180])], gore: ['角突き', T(54, 20, 1.5, [140, 60, 200], { lg: 50, kb: 60 })], hoof: ['蹄撃', S(20, 30, 1.3, [120, 80, 180], { st: 5 })],
  flame: ['焔', A(60, 120, 0.4, [120, 200, 180], { h: 4, el: 'fire', status: ['burn', 0.3, 2000] })], torrent: ['奔流', B(160, 26, 0.9, [160, 120, 220], { el: 'water', kb: 50 })], gale: ['旋風', C(64, 0.35, [120, 200, 180], { h: 4, el: 'wind', pull: 10 })],
  rock: ['岩槌', S(26, 40, 2.0, [260, 100, 320], { el: 'earth', st: 8 })], spark: ['雷閃', T(90, 10, 1.0, [50, 30, 90], { el: 'thunder', lg: 90 })], ray: ['光条', B(220, 10, 1.1, [140, 60, 200], { el: 'holy' })], umbra: ['闇の顎', A(50, 160, 1.1, [100, 70, 160], { el: 'dark', status: ['curse', 0.3, 2000] })],
  rewind: ['巻き戻し斬', A(44, 160, 0.9, [70, 60, 120], { echo: 600 })], rift: ['空間断裂', B(180, 30, 1.2, [200, 100, 240], { el: 'void' })],
};
// body plans the client knows how to draw (see client/js/morphs.js)
export const PLANS = ['quad', 'bear', 'cat', 'dragon', 'wyrm', 'insect', 'spider', 'mantis', 'bee', 'griffin', 'bird', 'horse', 'octo', 'squid', 'fish', 'jelly', 'blob', 'titan', 'demon', 'elemental', 'ghost', 'crystal', 'fluid', 'star', 'armament', 'divine', 'dream', 'clock', 'chimera', 'mech', 'mechbeast', 'mechflyer', 'shadow', 'doom'];
// species: [key, name, el, plan, color, full kit (3 attacks; last = finisher), half kit, mods, extra]
const sp = (key, name, el, plan, col, full, half, mods = {}, x = {}) => ({ key, name, el, plan, col, full, half, mods, ...x });
// resource gain: hit (per hit), crit, hurt (per 1% max HP lost), kill, regen (/s), night (/s at night), still (/s standing), water (×gain underwater or rain), skill (per skill), dark (/s in dark places)
// cost: resource needed to enter stage 1/2/3; drain: /s while full (negative = full form accumulates); half: half-form duration (ms)
const R = (key, name, col, gain, cost, drain, half = 20000, o = {}) => ({ key, name, col, gain, cost, drain, half, ...o });
export const MORPH_TYPES = [
  { id: 87, key: 'beastcore', name: '獣化核', theme: 'beast', res: R('instinct', '本能', '#ff9040', { hit: 1.6, kill: 8, hurt: 0.6 }, [0, 30, 60], 6), partial: '爪と牙', half: '獣人', species: [
    sp('wolf', '狼', null, 'quad', '#a0a8b8', ['bite', 'claw', 'pounce'], ['claw', 'bite'], { move: 0.3, aspd: 0.1 }, { dodge: 'dash', role: '機動力と追跡。倒した敵の近くの敵へ自動で向かう', track: 1 }),
    sp('bear', '熊', null, 'bear', '#7a5a3a', ['swipe', 'maul', 'roar'], ['swipe', 'maul'], { dr: 0.2, hp: 0.2, move: -0.1, aspd: -0.1 }, { dodge: 'roll', r: 13, role: '耐久と重量攻撃。攻撃中は怯まない', armor: 1 }),
    sp('tiger', '虎', null, 'cat', '#e0a040', ['claw', 'swipe', 'pounce'], ['claw', 'pounce'], { atk: 0.2, crit: 0.08 }, { dodge: 'step', role: '瞬間火力と突進。突進の命中で会心が出やすい' }),
    sp('panther', '豹', 'dark', 'cat', '#30303a', ['claw', 'claw', 'bite'], ['claw', 'claw'], { aspd: 0.25, dodge: 0.08 }, { dodge: 'blink', role: '回避と連続攻撃。回避直後の攻撃が強くなる', afterDodge: 0.5 })] },
  { id: 88, key: 'dragonmail', name: '竜装', theme: 'dragon', res: R('dragon', '竜力', '#ff6030', { hit: 1.0, regen: 1.5, crit: 2 }, [0, 35, 70], 5), partial: '竜の腕と鱗', half: '竜人', species: [
    sp('fire', '火竜', 'fire', 'dragon', '#d04020', ['claw', 'tail', 'flame'], ['claw', 'flame'], { atk: 0.15 }, { fly: 1, r: 14, role: '炎のブレスと飛行' }),
    sp('ice', '氷竜', 'ice', 'dragon', '#80c8ff', ['claw', 'tail', 'breath'], ['claw', 'breath'], { dr: 0.12 }, { fly: 1, r: 14, role: '凍てつくブレスで足止め', status: ['freeze', 0.15, 1200] }),
    sp('thunder', '雷竜', 'thunder', 'wyrm', '#ffe060', ['spark', 'tail', 'bolt'], ['spark', 'bolt'], { aspd: 0.15, move: 0.15 }, { r: 12, role: '雷の突進。地を這う雷竜（飛ばない）' }),
    sp('wind', '風竜', 'wind', 'dragon', '#a0f0c0', ['wingbeat', 'dive', 'gale'], ['wingbeat', 'dive'], { move: 0.3 }, { fly: 1, r: 13, role: '高速飛行と急降下' }),
    sp('venom', '毒竜', null, 'wyrm', '#70c040', ['bite', 'tail', 'sting'], ['bite', 'sting'], { hp: 0.15 }, { r: 13, role: '毒の牙と尾。毒が重なる' })] },
  { id: 89, key: 'insectshell', name: '蟲殻', theme: 'insect', res: R('bio', '生体エネルギー', '#90e040', { kill: 10, regen: 1, hit: 0.6 }, [0, 30, 55], 4.5), partial: '甲殻と複眼', half: '昆虫人', species: [
    sp('beetle', '甲虫', null, 'insect', '#40508a', ['shell', 'slam', 'swipe'], ['shell', 'swipe'], { dr: 0.25, move: -0.15 }, { dodge: 'roll', r: 12, armor: 1, role: '防御力と重量攻撃' }),
    sp('mantis', '蟷螂', null, 'mantis', '#70c050', ['scythe', 'scythe', 'swipe'], ['scythe', 'scythe'], { aspd: 0.2, crit: 0.05 }, { dodge: 'step', role: '鎌による連続攻撃' }),
    sp('spider', '蜘蛛', 'dark', 'spider', '#3a2a40', ['bite', 'web', 'sting'], ['web', 'bite'], { move: 0.1 }, { dodge: 'hop', role: '糸による拘束と多脚移動' }),
    sp('bee', '蜂', null, 'bee', '#f0c030', ['sting', 'sting', 'dive'], ['sting', 'dive'], { move: 0.35, aspd: 0.15, hp: -0.1 }, { fly: 1, dodge: 'dash', role: '高速移動と刺突' })] },
  { id: 90, key: 'phantomhost', name: '幻獣憑依', theme: 'phantom', res: R('affinity', '親和', '#e0a0ff', { hit: 0.8, skill: 8, regen: 0.8 }, [0, 30, 60], 5), partial: '幻獣の翼と角', half: '幻獣融合', species: [
    sp('griffin', 'グリフォン', 'wind', 'griffin', '#d0b070', ['claw', 'dive', 'wingbeat'], ['claw', 'dive'], { move: 0.25 }, { fly: 1, r: 13, role: '飛行と急降下' }),
    sp('phoenix', 'フェニックス', 'fire', 'bird', '#ff8030', ['flame', 'wingbeat', 'dive'], ['flame', 'wingbeat'], { regen: 0.01 }, { fly: 1, r: 12, revive: 1, role: '一度だけ炎から蘇る' }),
    sp('unicorn', 'ユニコーン', 'holy', 'horse', '#f0f0ff', ['gore', 'hoof', 'ray'], ['gore', 'hoof'], { healPower: 0.3 }, { r: 13, heal: 1, role: '角の突進と癒しの光' }),
    sp('kirin', '麒麟', 'thunder', 'horse', '#ffe080', ['spark', 'hoof', 'bolt'], ['spark', 'hoof'], { move: 0.3, aspd: 0.1 }, { r: 13, role: '雷をまとう疾走' })] },
  { id: 91, key: 'abyssform', name: '深海化身', theme: 'abyss', res: R('abyssal', '深淵圧', '#3080c0', { hit: 1.0, regen: 0.6, water: 2.5 }, [0, 30, 60], 5), partial: '鰓と鰭', half: '深海人', species: [
    sp('octo', 'タコ', 'water', 'octo', '#c05070', ['tentacle', 'tentacle', 'ink'], ['tentacle', 'ink'], { range: 0.2 }, { r: 13, role: '8本の触手と墨' }),
    sp('squid', 'イカ', 'water', 'squid', '#e0e0f0', ['tentacle', 'ink', 'phase'], ['tentacle', 'phase'], { move: 0.25 }, { dodge: 'dash', role: '墨を吐いて高速で離脱' }),
    sp('angler', '深海魚', 'dark', 'fish', '#304060', ['bite', 'glow', 'bite'], ['bite', 'glow'], { crit: 0.08 }, { r: 12, role: '発光で眩ませ、大顎で噛む' }),
    sp('jelly', 'クラゲ', 'thunder', 'jelly', '#a0e0ff', ['glow', 'tentacle', 'aura'], ['glow', 'tentacle'], { dr: 0.1 }, { fly: 1, role: '漂いながら触れた敵を痺れさせる', status: ['shock', 0.3, 1500] })] },
  { id: 92, key: 'aberration', name: '異形核', theme: 'aberrant', res: R('mutation', '変異', '#b040a0', { hurt: 1.4, hit: 0.7, kill: 5 }, [0, 30, 60], 5), partial: '増える腕と眼', half: '人の形を残した異形', species: [
    sp('manyarm', '多腕', null, 'blob', '#8a4a7a', ['arms', 'arms', 'slam'], ['arms', 'fist'], { aspd: 0.15 }, { r: 13, arms: 1, role: '腕の数（武器ごとに2〜6本）だけ攻撃が増える' }),
    sp('eyes', '百眼', 'dark', 'blob', '#5a3a6a', ['beam', 'glow', 'beam'], ['beam', 'glow'], { range: 0.25 }, { r: 12, role: '無数の眼から光線を放つ' }),
    sp('maw', '大顎', null, 'blob', '#7a2a3a', ['bite', 'bite', 'maul'], ['bite', 'maul'], { ls: 0.05 }, { r: 14, role: '喰らうほど傷が塞がる' }),
    sp('tendril', '触腕', 'void', 'blob', '#4a5a7a', ['tentacle', 'lash', 'tentacle'], ['tentacle', 'lash'], { range: 0.3 }, { r: 13, role: '伸びる触腕で遠くを掴む' })] },
  { id: 93, key: 'demonmanifest', name: '魔神顕現', theme: 'demon', res: R('demon', '魔神', '#c02040', { hurt: 1.2, kill: 9, hit: 0.5 }, [0, 35, 70], 6), partial: '魔神の腕と角', half: '魔神の装甲', species: [
    sp('ravager', '破壊の魔神', 'fire', 'demon', '#a02020', ['maul', 'swipe', 'slam'], ['maul', 'swipe'], { atk: 0.25 }, { r: 15, armor: 1, role: '攻撃型：重い拳と叩きつけ' }),
    sp('bulwark', '城塞の魔神', 'earth', 'demon', '#605050', ['fist', 'shell', 'roar'], ['fist', 'shell'], { dr: 0.3, move: -0.1 }, { r: 15, armor: 1, role: '防御型：受けた傷を力に変える' }),
    sp('sorcery', '魔導の魔神', 'dark', 'demon', '#502080', ['bolt', 'umbra', 'beam'], ['bolt', 'umbra'], { spellDmg: 0.2 }, { r: 14, role: '魔法型：闇の魔弾と光線' }),
    sp('herald', '号令の魔神', 'dark', 'demon', '#803040', ['swipe', 'roar', 'umbra'], ['swipe', 'roar'], { auraAtk: 0.1 }, { r: 14, role: '支援型：咆哮で味方を鼓舞する', support: 1 })] },
  { id: 94, key: 'spiritborn', name: '精霊変生', theme: 'spirit', res: R('element', '属性エネルギー', '#80e0ff', { hit: 1.0, regen: 1.0 }, [0, 30, 55], 4.5), partial: '属性の腕と装甲', half: '精霊の人型', species: [
    sp('fire', '火の精霊', 'fire', 'elemental', '#ff6020', ['flame', 'flame', 'pulse'], ['flame', 'pulse'], { atk: 0.1 }, { role: '燃焼：触れた敵を燃やす', status: ['burn', 0.4, 2500] }),
    sp('water', '水の精霊', 'water', 'elemental', '#3090ff', ['torrent', 'aura', 'torrent'], ['torrent', 'aura'], { regen: 0.01 }, { dodge: 'slide', role: '流動：攻撃を受け流し、回復しながら戦う' }),
    sp('wind', '風の精霊', 'wind', 'elemental', '#a0ffc0', ['gale', 'bolt', 'gale'], ['gale', 'bolt'], { move: 0.4, aspd: 0.1 }, { fly: 1, dodge: 'dash', role: '高速移動' }),
    sp('earth', '土の精霊', 'earth', 'elemental', '#a08050', ['rock', 'pillar', 'rock'], ['rock', 'pillar'], { dr: 0.25, move: -0.15 }, { armor: 1, r: 13, role: '防御：岩の身体' }),
    sp('thunder', '雷の精霊', 'thunder', 'elemental', '#ffe040', ['spark', 'bolt', 'spark'], ['spark', 'bolt'], { aspd: 0.2 }, { dodge: 'blink', role: '瞬発力：稲妻の突進' }),
    sp('light', '光の精霊', 'holy', 'elemental', '#fff8c0', ['ray', 'needle', 'ray'], ['ray', 'needle'], { healPower: 0.2 }, { heal: 1, role: '光の条で貫き、味方を癒す' }),
    sp('dark', '闇の精霊', 'dark', 'elemental', '#6040a0', ['umbra', 'erosion', 'umbra'], ['umbra', 'erosion'], { ls: 0.04 }, { role: '闇の顎で生命を奪う' })] },
  { id: 95, key: 'shadowbeast', name: '影獣化', theme: 'shadow', res: R('shade', '影', '#504070', { hit: 0.8, night: 2.0, dark: 2.0, regen: 0.2 }, [0, 30, 55], 5, 20000, { daylight: 3 }), partial: '影の腕と爪', half: '影に置き換わる身体', species: [
    sp('hound', '影狼', 'dark', 'shadow', '#302840', ['bite', 'claw', 'pounce'], ['claw', 'bite'], { move: 0.3 }, { dodge: 'blink', role: '影から影へ跳ぶ追跡者' }),
    sp('raven', '影鴉', 'dark', 'bird', '#201828', ['dive', 'wingbeat', 'needle'], ['dive', 'needle'], { move: 0.2 }, { fly: 1, role: '空を舞う影の群れ' }),
    sp('serpent', '影蛇', 'dark', 'wyrm', '#282038', ['bite', 'lash', 'umbra'], ['bite', 'lash'], { range: 0.2 }, { r: 12, role: '影を這う長い身体' }),
    sp('stalker', '影の徘徊者', 'dark', 'shadow', '#181020', ['umbra', 'claw', 'erosion'], ['umbra', 'claw'], { crit: 0.1 }, { r: 12, role: '暗闇でさらに強くなる' })] },
  { id: 96, key: 'doomavatar', name: '終末化身', theme: 'doom', res: R('doom', '終末', '#a02060', { hit: 0.8, kill: 6, hurt: 0.5 }, [0, 40, 70], -2, 18000, { hpCost: 0.006, ult: 100 }), partial: '終末の装甲', half: '災厄の人型', species: [
    sp('ruin', '崩壊', 'earth', 'doom', '#6a5040', ['slam', 'rock', 'slam'], ['slam', 'rock'], { atk: 0.2 }, { r: 15, armor: 1, role: '崩壊：大地を砕く' }),
    sp('blight', '侵蝕', 'dark', 'doom', '#503060', ['erosion', 'umbra', 'erosion'], ['erosion', 'umbra'], { curseAmp: 0.3 }, { r: 14, role: '侵蝕：呪いを広げる' }),
    sp('rot', '腐敗', null, 'doom', '#507030', ['sting', 'erosion', 'bite'], ['sting', 'bite'], { statusChance: 0.2 }, { r: 14, role: '腐敗：毒と衰弱', status: ['poison', 0.5, 3000] }),
    sp('chaos', '混沌', 'void', 'doom', '#402060', ['rift', 'bolt', 'rift'], ['rift', 'bolt'], { elemAll: 0.15 }, { r: 14, role: '混沌：属性が入り乱れる' })] },
  { id: 97, key: 'machinegod', name: '機神装', theme: 'mech', res: R('engine', '機体エネルギー', '#60c0ff', { still: 4, hit: 0.6, regen: 0.6 }, [0, 30, 60], 5), partial: '機械の腕脚', half: '機械装甲', parts: true, species: [
    sp('frame', '人型機体', null, 'mech', '#8090a8', ['fist', 'drill', 'cannon'], ['fist', 'cannon'], { dr: 0.1 }, { r: 13, role: '人型：拳と砲の万能機' }),
    sp('hound', '獣型機体', null, 'mechbeast', '#90a0b0', ['bite', 'drill', 'pounce'], ['bite', 'pounce'], { move: 0.3 }, { r: 13, dodge: 'dash', role: '獣型：高速の四脚' }),
    sp('flyer', '飛行型機体', 'thunder', 'mechflyer', '#a0b0d0', ['needle', 'dive', 'beam'], ['needle', 'beam'], { move: 0.2 }, { fly: 1, r: 12, role: '飛行型：上空からの射撃' }),
    sp('artillery', '砲撃型機体', 'fire', 'mech', '#708070', ['cannon', 'beam', 'cannon'], ['cannon', 'beam'], { range: 0.3, move: -0.2 }, { r: 14, armor: 1, role: '砲撃型：重い砲撃' })] },
  { id: 98, key: 'crystalform', name: '結晶化身', theme: 'crystal', res: R('resonance', '共鳴', '#a0f0ff', { hit: 1.0, hurt: 0.8, regen: 0.5 }, [0, 30, 55], 4.5), partial: '結晶化した腕', half: '結晶装甲', species: [
    sp('bastion', '防壁結晶', 'earth', 'crystal', '#80c0e0', ['pillar', 'shell', 'pillar'], ['pillar', 'shell'], { dr: 0.3 }, { armor: 1, r: 13, role: '防御型' }),
    sp('mirror', '反射結晶', 'holy', 'crystal', '#e0f0ff', ['shard', 'ray', 'shard'], ['shard', 'ray'], {}, { reflect: 1, role: '反射型：飛び道具を跳ね返す' }),
    sp('lance', '穿晶', 'ice', 'crystal', '#a0e0ff', ['echo', 'shard', 'beam'], ['echo', 'shard'], { pen: 0.25 }, { role: '貫通型' }),
    sp('chorus', '共鳴晶', 'thunder', 'crystal', '#c0a0ff', ['pulse', 'shard', 'aura'], ['pulse', 'shard'], { aspd: 0.1 }, { role: '共鳴型：命中ごとに共鳴が溜まり、波動が強まる', resonate: 1 })] },
  { id: 99, key: 'fluidform', name: '流体変身', theme: 'fluid', res: R('fluid', '流動', '#60e0d0', { hit: 0.9, regen: 1.2 }, [0, 25, 50], 4), partial: '液状化する腕', half: '流体の身体', species: [
    sp('water', '水', 'water', 'fluid', '#4090ff', ['lash', 'torrent', 'lash'], ['lash', 'torrent'], { regen: 0.01 }, { dodge: 'slide', melt: 1, role: '刃・盾・多腕へ形を変える水の身体' }),
    sp('mercury', '流体金属', null, 'fluid', '#c0c8d0', ['blade', 'lash', 'blade'], ['blade', 'lash'], { dr: 0.15, atk: 0.1 }, { melt: 1, role: '刃に固まる流体金属' }),
    sp('magma', '溶岩', 'fire', 'fluid', '#ff6020', ['flame', 'lash', 'slam'], ['flame', 'lash'], { atk: 0.15, move: -0.1 }, { melt: 1, role: '触れたものを焼く溶岩', status: ['burn', 0.4, 2500] }),
    sp('slime', '粘体', 'earth', 'blob', '#80d060', ['slam', 'lash', 'arms'], ['slam', 'lash'], { hp: 0.25 }, { melt: 1, r: 13, role: '分厚い粘体で受け止める' })] },
  { id: 100, key: 'starhusk', name: '星骸化', theme: 'star', res: R('starcore', '星核', '#fff0a0', { hit: 0.8, night: 1.5, regen: 0.8 }, [0, 30, 60], 5), partial: '星の装甲', half: '宇宙の人型', species: [
    sp('nova', '新星', 'fire', 'star', '#ffd060', ['comet', 'pulse', 'comet'], ['comet', 'pulse'], { atk: 0.15 }, { fly: 1, role: '星弾を降らせる' }),
    sp('blackhole', '黒穴', 'void', 'star', '#302050', ['gravity', 'rift', 'gravity'], ['gravity', 'rift'], {}, { fly: 1, role: '重力で敵を引き寄せる' }),
    sp('nebula', '星雲', 'holy', 'star', '#c0a0ff', ['aura', 'needle', 'aura'], ['aura', 'needle'], { regen: 0.01 }, { fly: 1, role: '星雲の霧で敵を包む' }),
    sp('pulsar', '脈動星', 'thunder', 'star', '#a0e0ff', ['needle', 'pulse', 'beam'], ['needle', 'pulse'], { aspd: 0.2 }, { fly: 1, role: '規則的な光の脈動' })] },
  { id: 101, key: 'armament', name: '武装変生', theme: 'arms', res: R('arsenal', '武装', '#c0c0c0', { hit: 1.2, crit: 2, kill: 4 }, [0, 30, 55], 5), partial: '武器化した腕', half: '戦闘用の全身装備', species: [
    sp('edge', '刃型', null, 'armament', '#d0d8e0', ['blade', 'blade', 'swipe'], ['blade', 'swipe'], { crit: 0.1 }, { role: '腕そのものが刃になる' }),
    sp('gun', '砲撃型', 'fire', 'armament', '#708090', ['cannon', 'needle', 'cannon'], ['cannon', 'needle'], { range: 0.25 }, { role: '腕が砲身になる' }),
    sp('guard', '防御型', 'earth', 'armament', '#8a8a70', ['shell', 'fist', 'pulse'], ['shell', 'fist'], { dr: 0.25 }, { armor: 1, role: '全身が盾になる' }),
    sp('jet', '機動型', 'wind', 'armament', '#a0c0e0', ['dive', 'blade', 'pounce'], ['dive', 'blade'], { move: 0.35 }, { dodge: 'dash', role: '脚が推進器になる' })] },
  { id: 102, key: 'divinity', name: '神性解放', theme: 'divine', res: R('divinity', '神性', '#fff8c0', { hit: 0.7, skill: 6, regen: 0.8 }, [0, 35, 70], 5.5), partial: '光輪と神紋', half: '神性を帯びた人型', species: [
    sp('light', '光の神格', 'holy', 'divine', '#fff8c0', ['ray', 'needle', 'ray'], ['ray', 'needle'], { atk: 0.1 }, { fly: 1, role: '光：貫く光条' }),
    sp('judge', '裁定の神格', 'holy', 'divine', '#ffe080', ['judgement', 'blade', 'judgement'], ['blade', 'judgement'], { finisher: 0.3 }, { role: '裁定：呪われた敵ほど重く裁く', judge: 1 }),
    sp('create', '創造の神格', 'earth', 'divine', '#a0ffa0', ['pillar', 'aura', 'pillar'], ['pillar', 'aura'], { healPower: 0.3 }, { heal: 1, role: '創造：守りの柱と癒し' }),
    sp('ruin', '破壊の神格', 'fire', 'divine', '#ff8060', ['slam', 'flame', 'judgement'], ['slam', 'flame'], { atk: 0.25, dr: -0.1 }, { role: '破壊：守りを捨てた力' }),
    sp('aegis', '守護の神格', 'holy', 'divine', '#a0c0ff', ['shell', 'pulse', 'ray'], ['shell', 'pulse'], { dr: 0.25 }, { armor: 1, role: '守護：味方を守る光の壁', support: 1 })] },
  { id: 103, key: 'wraithgear', name: '亡霊憑装', theme: 'ghost', res: R('spectral', '霊気', '#a0c0d0', { hit: 0.8, kill: 7, night: 1.0 }, [0, 30, 55], 4.5), partial: '霊体の腕', half: '霊体との融合', species: [
    sp('knight', '亡騎士', null, 'ghost', '#a0b0c0', ['blade', 'swipe', 'slam'], ['blade', 'swipe'], { dr: 0.15 }, { role: '生前は騎士：重い剣技', phaseMove: 1 }),
    sp('archer', '亡射手', null, 'ghost', '#b0c0a0', ['needle', 'needle', 'beam'], ['needle', 'beam'], { range: 0.3 }, { role: '生前は射手：遠くから射る', phaseMove: 1 }),
    sp('mage', '亡魔導師', 'dark', 'ghost', '#a090c0', ['bolt', 'wail', 'umbra'], ['bolt', 'wail'], { spellDmg: 0.2 }, { role: '生前は魔導師：呪いの魔弾', phaseMove: 1 }),
    sp('thief', '亡盗賊', 'dark', 'ghost', '#8090a0', ['phase', 'claw', 'phase'], ['phase', 'claw'], { crit: 0.12, move: 0.2 }, { dodge: 'blink', role: '生前は盗賊：すり抜けて背後を取る', phaseMove: 1 })] },
  { id: 104, key: 'dreamform', name: '夢幻化身', theme: 'dream', res: R('dream', '夢幻', '#ffb0ff', { hit: 0.8, regen: 1.0, skill: 5 }, [0, 30, 55], 4.5), partial: '幻影化する身体', half: '現実と幻の混ざった姿', species: [
    sp('baku', '獏', null, 'quad', '#c0a0e0', ['bite', 'mirage', 'roar'], ['bite', 'mirage'], { ls: 0.04 }, { role: '悪夢を喰らう' }),
    sp('moth', '幻蛾', null, 'bee', '#e0d0ff', ['glow', 'mirage', 'needle'], ['glow', 'mirage'], { dodge: 0.1 }, { fly: 1, clones: 1, role: '鱗粉の幻で分身を生む' }),
    sp('chimeraD', '夢の獣', 'void', 'dream', '#ff90d0', ['mirage', 'claw', 'mirage'], ['mirage', 'claw'], { aspd: 0.15 }, { clones: 1, role: '回避すると幻影の分身が残る' }),
    sp('dreamer', '眠り姫', 'holy', 'dream', '#ffe0f0', ['aura', 'needle', 'aura'], ['aura', 'needle'], { statusChance: 0.2 }, { fly: 1, role: '眠りへ誘う', status: ['sleep', 0.25, 2000] })] },
  { id: 105, key: 'chronoform', name: '時空変生', theme: 'time', res: R('chrono', '時流', '#80a0ff', { hit: 0.9, regen: 1.0 }, [0, 35, 65], 5), partial: '時を刻む腕', half: '空間の歪みをまとう姿', rewind: 1, species: [
    sp('past', '過去の姿', 'void', 'clock', '#a0b0ff', ['rewind', 'echo', 'rewind'], ['rewind', 'echo'], { aspd: 0.1 }, { dodge: 'blink', role: '攻撃が遅れて再現される' }),
    sp('future', '未来の姿', 'thunder', 'clock', '#c0e0ff', ['echo', 'spark', 'rift'], ['echo', 'spark'], { move: 0.25 }, { dodge: 'blink', role: '先回りの突き' }),
    sp('fold', '折り畳む者', 'void', 'clock', '#8070ff', ['rift', 'gravity', 'rift'], ['rift', 'gravity'], { range: 0.2 }, { dodge: 'blink', role: '空間を裂いて引き寄せる' }),
    sp('still', '止まる者', 'ice', 'clock', '#d0e0ff', ['echo', 'pulse', 'beam'], ['echo', 'pulse'], { dr: 0.1 }, { dodge: 'blink', role: '触れた敵の時間を鈍らせる', status: ['slow', 0.5, 2000] })] },
  { id: 106, key: 'panorigin', name: '万象転生', theme: 'chimera', res: R('origin', '万象', '#ffffff', { hit: 1.0, kill: 5, regen: 0.6 }, [0, 30, 60], 5), partial: '因子の器官', half: '因子の融合体', chimera: true, species: [
    sp('custom', '万象体', null, 'chimera', '#e0e0e0', ['claw', 'bite', 'slam'], ['claw', 'bite'], {}, { role: '集めた因子を組み合わせた独自の生命体' })] },
];
export const MORPH_BY_ID = Object.fromEntries(MORPH_TYPES.map(t => [t.id, t]));
// species unlock by type mastery (0, 20, 40, 60, …)
export const SPECIES_UNLOCK = i => i * 20;
// 万象転生 factors: slot → options (from other transformation types). Obtained by mastery 10 of the source type or rare boss drops.
export const FACTORS = {
  head: [['wolfHead', '狼の頭', 87, 'bite', { crit: 0.05 }], ['dragonHorn', '竜の角', 88, 'gore', { atk: 0.08 }], ['insectEyes', '複眼', 89, 'sting', { range: 0.15 }], ['demonHorn', '魔神の角', 93, 'roar', { auraAtk: 0.05 }], ['ghostFace', '霊の顔', 103, 'wail', { dodge: 0.05 }]],
  arms: [['bearArms', '熊の腕', 87, 'maul', { atk: 0.1 }], ['mantisArms', '蟷螂の鎌', 89, 'scythe', { aspd: 0.1 }], ['demonArms', '魔神の腕', 93, 'fist', { atk: 0.12 }], ['tentacles', '触手', 91, 'tentacle', { range: 0.2 }], ['bladeArms', '刃の腕', 101, 'blade', { crit: 0.06 }]],
  legs: [['wolfLegs', '狼の脚', 87, null, { move: 0.25 }], ['insectLegs', '多脚', 89, null, { move: 0.1, dr: 0.05 }], ['fluidBase', '流体の下半身', 99, null, { dodge: 0.06 }], ['mechLegs', '機械の脚', 97, null, { dr: 0.08 }]],
  back: [['dragonWings', '竜の翼', 88, 'wingbeat', { move: 0.1 }, { fly: 1 }], ['finBack', '背鰭', 91, 'lash', { regen: 0.005 }], ['halo', '光輪', 102, 'ray', { healPower: 0.15 }], ['starCore', '星の核', 100, 'comet', { elemAll: 0.08 }]],
  body: [['crystalTorso', '結晶の胴体', 98, 'pillar', { dr: 0.12 }], ['mechCore', '機械の動力炉', 97, 'cannon', { aspd: 0.08 }], ['shadowBody', '影の身体', 95, 'umbra', { crit: 0.05 }], ['doomCore', '終末の核', 96, 'erosion', { atk: 0.1, dr: -0.05 }]],
};
export const FACTOR_BY_ID = Object.fromEntries(Object.entries(FACTORS).flatMap(([slot, l]) => l.map(([id, name, src, atk, mods, x]) => [id, { id, slot, name, src, atk, mods, ...(x || {}) }])));
// 機神装 parts (frame species + three part slots)
export const MECH_PARTS = { arm: [['drillArm', 'ドリル腕', 'drill', { pen: 0.15 }], ['cannonArm', '砲腕', 'cannon', { range: 0.2 }], ['clawArm', '爪腕', 'claw', { aspd: 0.12 }]],
  leg: [['tread', '無限軌道', { dr: 0.1, move: -0.05 }], ['thruster', '推進器', { move: 0.25 }], ['strut', '跳躍脚', { dodge: 0.06 }]], core: [['reactor', '魔導炉', { atk: 0.1 }], ['shieldGen', '障壁発生器', { dr: 0.12 }], ['overclock', '過給機', { aspd: 0.12 }]] };
// six form-bound skills per type: [stage needed (or 'p' passive / 'u' ultimate), name, effect template, power]
// templates use the type's own body: see morphSkillEff in tools/gen/morph.mjs
export const MORPH_SKILLS = {
  87: [[0, '獣の嗅覚', 'track'], [1, '裂爪', 'rend'], [2, '獣人の跳躍', 'pounceSk'], [3, '群狼の咆哮', 'roarSk'], ['p', '野生の血', { lowHpAtk: 0.2, regen: 0.004 }], ['u', '百獣の王', 'frenzy']],
  88: [[0, '竜の目覚め', 'charge'], [1, '鱗の守り', 'scales'], [2, '竜翼の滑空', 'glide'], [3, '竜の息吹', 'breathSk'], ['p', '竜血', { elemAll: 0.08, hp: 0.06 }], ['u', '天地を焼く竜', 'cataclysm']],
  89: [[0, '脱皮', 'molt'], [1, '甲殻硬化', 'harden'], [2, '糸の結界', 'webSk'], [3, '群れの羽音', 'swarm'], ['p', '外骨格', { dr: 0.06, kbImmune: 1 }], ['u', '蟲の女王', 'queen']],
  90: [[0, '契約の印', 'pact'], [1, '幻獣の加護', 'blessing'], [2, '幻翼の突進', 'diveSk'], [3, '幻獣の権能', 'mythSk'], ['p', '親和の絆', { healPower: 0.1, move: 0.05 }], ['u', '幻獣顕現', 'avatar']],
  91: [[0, '深海の呼吸', 'breathe'], [1, '墨幕', 'inkSk'], [2, '水圧の抱擁', 'crush'], [3, '深淵の触腕', 'tentacleSk'], ['p', '鰓呼吸', { regen: 0.004, statusResist: 0.1 }], ['u', '海溝の主', 'leviathan']],
  92: [[0, '異形の胎動', 'pulseSk'], [1, '増殖する腕', 'armsSk'], [2, '異形の捕食', 'devour'], [3, '名状しがたき姿', 'horror'], ['p', '変異適応', { dr: 0.05, ls: 0.02 }], ['u', '異形の目覚め', 'mutate']],
  93: [[0, '魔神の契約', 'pact'], [1, '魔神の拳', 'demonFist'], [2, '魔神の装甲', 'armorSk'], [3, '魔神の権能', 'mythSk'], ['p', '魔の血統', { lowHpAtk: 0.15, ls: 0.02 }], ['u', '魔神降臨', 'avatar']],
  94: [[0, '属性の共鳴', 'charge'], [1, '属性の腕', 'elemArm'], [2, '精霊の疾走', 'glide'], [3, '精霊の奔流', 'elemBurst'], ['p', '属性親和', { elemAll: 0.1 }], ['u', '元素の融合', 'fusion']],
  95: [[0, '影溜まり', 'shadowPool'], [1, '影縫い', 'shadowBind'], [2, '影渡り', 'shadowStep'], [3, '影の群れ', 'swarm'], ['p', '夜の眷属', { crit: 0.05, dodge: 0.04 }], ['u', '永夜の獣', 'eclipse']],
  96: [[0, '終末の兆し', 'omen'], [1, '崩壊の装甲', 'armorSk'], [2, '災厄の行進', 'march'], [3, '終末の権能', 'horror'], ['p', '滅びの予感', { atk: 0.06, lowHpAtk: 0.15 }], ['u', '終焉の鐘', 'doomsday']],
  97: [[0, '機体整備', 'repair'], [1, '換装', 'swapParts'], [2, '推進加速', 'boost'], [3, '全砲門開放', 'barrageSk'], ['p', '魔導機関', { pen: 0.06, dr: 0.04 }], ['u', '機神起動', 'overdrive']],
  98: [[0, '共鳴音', 'resonance'], [1, '結晶の盾', 'crystalShield'], [2, '結晶柱の林', 'pillars'], [3, '結晶の嵐', 'shardStorm'], ['p', '結晶の身体', { dr: 0.06, pen: 0.04 }], ['u', '万華の結晶', 'prism']],
  99: [[0, '液化', 'melt'], [1, '流体の刃', 'fluidBlade'], [2, '奔流化', 'flow'], [3, '大渦', 'whirlpool'], ['p', '不定形', { dodge: 0.06, regen: 0.003 }], ['u', '流体の海', 'flood']],
  100: [[0, '星読み', 'charge'], [1, '星の装甲', 'scales'], [2, '重力浮遊', 'glide'], [3, '流星群', 'meteor'], ['p', '星の加護', { elemAll: 0.06, crit: 0.04 }], ['u', '超新星', 'supernova']],
  101: [[0, '研ぎ澄ます', 'sharpen'], [1, '武器化', 'demonFist'], [2, '突撃形態', 'boost'], [3, '全武装展開', 'barrageSk'], ['p', '兵器の身体', { pen: 0.08, crit: 0.04 }], ['u', '人型兵器', 'overdrive']],
  102: [[0, '祈り', 'pray'], [1, '神紋の加護', 'blessing'], [2, '光の翼', 'glide'], [3, '神罰', 'judgementSk'], ['p', '神性', { healPower: 0.12, dr: 0.04 }], ['u', '神格顕現', 'avatar']],
  103: [[0, '霊を呼ぶ', 'pact'], [1, '霊体化', 'phaseSk'], [2, '憑依突進', 'diveSk'], [3, '亡者の行進', 'march'], ['p', '霊の囁き', { dodge: 0.05, crit: 0.04 }], ['u', '百鬼夜行', 'nightParade']],
  104: [[0, '白昼夢', 'dreamSk'], [1, '幻影の分身', 'clonesSk'], [2, '夢渡り', 'shadowStep'], [3, '悪夢の園', 'nightmare'], ['p', '夢の住人', { dodge: 0.06, statusChance: 0.08 }], ['u', '終わらない夢', 'endlessDream']],
  105: [[0, '刻読み', 'charge'], [1, '時差斬り', 'echoSk'], [2, '空間跳躍', 'shadowStep'], [3, '時の巻き戻し', 'rewindSk'], ['p', '時を知る者', { cdr: 0.06, aspd: 0.04 }], ['u', '時空断絶', 'timeBreak']],
  106: [[0, '因子の調律', 'charge'], [1, '器官の発現', 'elemArm'], [2, '融合の脈動', 'pulseSk'], [3, '万象の咆哮', 'roarSk'], ['p', '万象の器', { atk: 0.04, dr: 0.04, move: 0.04 }], ['u', '万象転生', 'mutate']],
};
