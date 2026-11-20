// 1,000 jobs = 40 roles (core mechanic) x 25 lineages (element / twist / tier). Weapon-independent.
const r2 = v => Math.round(v * 100) / 100;
// role: [key, name, desc, statMods, passiveMods, activeName, activeEff(power), affinity cats]
export const ROLES = [
  ['warrior', '戦士', '屈強な肉体で前線を支える万能の戦闘職', { str: 3, vit: 3 }, { hp: 0.1, atk: 0.05 }, '雄叫び', p => [{ t: 'buff', mods: { atk: r2(0.2 * p), dr: 0.1 }, dur: 10000 }, { t: 'taunt', r: 120, dur: 4000 }], ['sword', 'blunt']],
  ['guardian', '守護騎士', '仲間を庇い攻撃を受け止める盾役', { vit: 5, mnd: 1 }, { dr: 0.08, guardDr: 0.15 }, '守護の誓い', p => [{ t: 'shield', amt: r2(0.2 * p), dur: 6000 }, { t: 'aura', r: 110, mods: { dr: r2(0.12 * p) }, dur: 8000 }], ['polearm', 'sword']],
  ['berserker', '狂戦士', '傷つくほどに力を増す破壊者', { str: 5, vit: 1 }, { lowHpAtk: 0.3, ls: 0.02 }, '狂化', p => [{ t: 'buff', mods: { atk: r2(0.4 * p), aspd: 0.25, dr: -0.2 }, dur: 10000 }], ['blunt', 'sword']],
  ['gladiator', '剣闘士', '観衆を沸かせる連撃の締めと先制の名手', { str: 2, agi: 2, dex: 2 }, { finisher: 0.25, firstStrike: 0.2 }, '闘技の宣誓', p => [{ t: 'buff', mods: { crit: r2(0.2 * p), finisher: 0.3 }, dur: 10000 }, { t: 'taunt', r: 90, dur: 3000 }], ['sword', 'fist']],
  ['monk', '武僧', '気を練り上げ素早い体術で戦う修行者', { agi: 3, mnd: 3 }, { aspd: 0.08, iframe: 60 }, '発勁', p => [{ t: 'hit', shape: { s: 'circle', r: 56 }, m: r2(2.2 * p), kb: 90, st: 5 }], ['fist']],
  ['bushi', '武士', '一太刀に全てを懸ける会心の剣客', { dex: 4, str: 2 }, { crit: 0.06, critDmg: 0.2 }, '一刀の境地', p => [{ t: 'buff', mods: { nextHit: r2(2.0 * p), crit: 0.5 }, dur: 6000 }], ['sword']],
  ['ninja', '忍者', '影に紛れ分身と回避で翻弄する隠密', { agi: 4, dex: 2 }, { dodge: 0.08, move: 0.08 }, '影分身', p => [{ t: 'summon', kind: 'clone', n: 2, dur: 8000, m: r2(0.4 * p) }, { t: 'buff', mods: { dodge: 0.2 }, dur: 5000 }], ['sword', 'ranged']],
  ['thief', '盗賊', '敵の背後を取り戦利品を掠め取る', { agi: 3, luk: 3 }, { drop: 0.15, backstab: 0.3 }, '煙玉', p => [{ t: 'blink', d: 100, back: 1 }, { t: 'buff', mods: { stealth: 1, nextHit: r2(1.0 * p) }, dur: 4000 }], ['sword', 'fist']],
  ['assassin', '暗殺者', '急所を貫き瀕死の敵を確実に仕留める', { dex: 3, agi: 3 }, { execDmg: 0.3, backstab: 0.2 }, '暗殺', p => [{ t: 'blink', d: 150, toTarget: 1, back: 1 }, { t: 'hit', shape: { s: 'thrust', l: 30, w: 14 }, m: r2(3.0 * p), exec: { th: 0.3, m: 2.5 }, critAdd: 0.5 }], ['sword', 'fist']],
  ['hunter', '狩人', '罠と射撃で獲物を追い詰める', { dex: 4, agi: 2 }, { range: 0.12, projSpd: 0.15 }, '狩猟罠', p => [{ t: 'zone', at: 'target', r: 40, dur: 15000, trigger: 1, m: r2(2.0 * p), status: ['bind', 0.9, 2500] }], ['ranged', 'polearm']],
  ['scout', '斥候', '戦場を見渡し弱点を暴く偵察兵', { agi: 3, dex: 2, luk: 1 }, { move: 0.1, xp: 0.1 }, '鷹の目', p => [{ t: 'zone', at: 'self', r: 160, dur: 300, tick: 100, mark: 1, m: 0 }, { t: 'buff', mods: { crit: r2(0.15 * p) }, dur: 8000 }], ['ranged', 'sword']],
  ['mage', '魔術師', '魔力を操り属性魔法で殲滅する', { int: 5, mnd: 1 }, { spellDmg: 0.12, sp: 0.15 }, '魔力暴走', p => [{ t: 'buff', mods: { spellDmg: r2(0.3 * p), spCost: 0.3 }, dur: 8000 }, { t: 'barrage', n: 6, r: 30, spread: 90, delay: 300, interval: 100, m: r2(0.8 * p) }], ['magic']],
  ['sorcerer', '妖術師', '状態異常を操り敵を蝕む異能者', { int: 4, luk: 2 }, { statusChance: 0.15, statusDur: 0.25 }, '妖術陣', p => [{ t: 'zone', at: 'target', r: 80, dur: 6000, tick: 600, m: r2(0.3 * p), status: ['poison', 0.6, 3000], slow: 0.3 }], ['magic', 'mech']],
  ['summoner', '召喚士', '異界の存在を呼び寄せ共に戦う', { int: 3, mnd: 3 }, { summonPower: 0.25 }, '召喚', p => [{ t: 'summon', kind: 'familiar', n: 2, dur: 20000, m: r2(0.5 * p) }], ['magic']],
  ['necromancer', '死霊術師', '倒した敵を使役する死の術者', { int: 4, mnd: 2 }, { killHeal: 0.03, raiseOnKill: 0.25 }, '死者の軍勢', p => [{ t: 'summon', kind: 'skeleton', n: 3, dur: 15000, m: r2(0.35 * p) }], ['magic', 'polearm']],
  ['elementalist', '精霊使い', '精霊と契約し属性を自在に操る', { int: 3, mnd: 3 }, { elemAll: 0.1 }, '精霊契約', p => [{ t: 'summon', kind: 'spirit', n: 1, dur: 20000, m: r2(0.6 * p) }, { t: 'enchant', el: 'cycle', dur: 12000, m: r2(0.2 * p) }], ['magic', 'ranged']],
  ['cleric', '僧侶', '癒しの奇跡で仲間を支える', { mnd: 5, vit: 1 }, { healPower: 0.25, regen: 0.004 }, '癒しの光', p => [{ t: 'heal', amt: r2(0.3 * p), r: 140 }, { t: 'cleanse', r: 140 }], ['magic', 'blunt']],
  ['paladin', '聖騎士', '聖なる力で守り、悪を討つ', { vit: 3, mnd: 2, str: 1 }, { dr: 0.06, healPower: 0.1, elemDmg: { holy: 0.15 } }, '聖なる盾', p => [{ t: 'shield', amt: r2(0.25 * p), dur: 6000 }, { t: 'heal', amt: r2(0.12 * p), r: 100 }], ['sword', 'blunt', 'polearm']],
  ['priest', '神官', '神への祈りで加護と魔力を授ける', { mnd: 4, int: 2 }, { spRegen: 0.5, healPower: 0.15 }, '祝福', p => [{ t: 'aura', r: 140, mods: { atk: r2(0.12 * p), dr: r2(0.1 * p), spRegen: 1 }, dur: 15000 }], ['magic']],
  ['bard', '吟遊詩人', '歌で仲間を鼓舞する旅の楽士', { mnd: 3, dex: 2, luk: 1 }, { auraAtk: 0.06 }, '英雄の歌', p => [{ t: 'aura', r: 160, mods: { atk: r2(0.18 * p), aspd: r2(0.1 * p), move: 0.1 }, dur: 15000 }], ['mech', 'ranged']],
  ['dancer', '踊り子', '舞いながら斬り、敵の刃を躱す', { agi: 4, dex: 2 }, { dodge: 0.06, aspd: 0.06 }, '剣の舞', p => [{ t: 'buff', mods: { dodge: 0.15, aspd: 0.2 }, dur: 8000 }, { t: 'hit', shape: { s: 'circle', r: 48 }, m: r2(0.5 * p), h: 4, interval: 120 }], ['sword', 'mech']],
  ['alchemist', '錬金術師', '薬品と爆薬を調合する研究者', { int: 3, dex: 3 }, { potion: 0.3, statusChance: 0.08 }, '爆薬瓶', p => [{ t: 'hit', shape: { s: 'proj', spd: 6, rng: 180, sz: 6, aoe: 50 }, m: r2(2.0 * p), status: ['poison', 0.7, 4000] }], ['ranged', 'magic']],
  ['machinist', '機工士', '機械仕掛けの兵器を設置する技術者', { dex: 3, int: 3 }, { summonPower: 0.15, pen: 0.08 }, '自動砲台', p => [{ t: 'summon', kind: 'turret', n: 1, dur: 20000, m: r2(0.5 * p) }], ['mech', 'ranged']],
  ['enchanter', '付与術師', '武器に魔力を付与し威力を高める', { int: 3, dex: 2, mnd: 1 }, { enchantPower: 0.3 }, '武器付与', p => [{ t: 'enchant', el: 'best', dur: 15000, m: r2(0.35 * p) }, { t: 'aura', r: 100, mods: { atk: 0.08 }, dur: 15000 }], ['magic', 'sword']],
  ['curser', '呪術師', '呪いで敵を弱らせる禁術の使い手', { int: 3, mnd: 3 }, { curseAmp: 0.2, statusChance: 0.05 }, '呪詛', p => [{ t: 'zone', at: 'target', r: 90, dur: 7000, tick: 700, m: r2(0.2 * p), status: ['curse', 0.8, 4000] }], ['magic', 'polearm']],
  ['astrologer', '占星術師', '星の巡りを読み幸運と会心を引き寄せる', { luk: 4, int: 2 }, { crit: 0.05, drop: 0.08 }, '星の導き', p => [{ t: 'barrage', n: 10, r: 22, spread: 120, delay: 300, interval: 80, m: r2(0.4 * p), el: 'holy' }, { t: 'buff', mods: { crit: 0.15 }, dur: 8000 }], ['magic', 'ranged']],
  ['chronomancer', '時術師', '時の流れを歪め技の回転を速める', { int: 3, agi: 3 }, { cdr: 0.1 }, '時間加速', p => [{ t: 'buff', mods: { aspd: r2(0.25 * p), cdr: 0.25, move: 0.15 }, dur: 8000 }, { t: 'zone', at: 'self', r: 120, dur: 6000, tick: 500, slow: 0.4 }], ['magic', 'myth']],
  ['gravitist', '重力術師', '重力を操り敵を押し潰す', { int: 4, vit: 2 }, { stagger: 0.25, kb: 0.2 }, '重力場', p => [{ t: 'zone', at: 'target', r: 100, dur: 3000, tick: 300, pull: 3, m: r2(0.2 * p), status: ['slow', 0.8, 2000] }], ['magic', 'blunt']],
  ['tamer', '獣使い', '魔獣を従え共に狩る', { mnd: 3, agi: 2, vit: 1 }, { summonPower: 0.2, move: 0.04 }, '獣の咆哮', p => [{ t: 'summon', kind: 'beast', n: 1, dur: 25000, m: r2(0.7 * p) }], ['fist', 'ranged']],
  ['dragoon', '竜騎士', '天高く跳躍し竜の如く降下する', { str: 3, agi: 3 }, { leapDmg: 0.3, iframe: 30 }, '竜跳躍', p => [{ t: 'leap', d: 160, r: 60, m: r2(3.0 * p), st: 6 }], ['polearm']],
  ['spellblade', '魔剣士', '剣技と魔法を融合する魔法剣士', { str: 2, int: 3, dex: 1 }, { onHitMagic: 0.2 }, '魔刃', p => [{ t: 'enchant', el: 'best', dur: 10000, m: r2(0.25 * p) }, { t: 'hit', shape: { s: 'proj', spd: 10, rng: 200, sz: 10, pierce: 9, wave: 1 }, m: r2(1.8 * p) }], ['sword', 'magic']],
  ['magefist', '魔拳士', '拳に魔力を込め打撃で魔力を回復する', { str: 2, int: 2, agi: 2 }, { spOnHit: 1, aspd: 0.04 }, '魔力解放', p => [{ t: 'hit', shape: { s: 'circle', r: 64 }, m: r2(2.0 * p), kb: 70 }, { t: 'buff', mods: { spellDmg: 0.2, atk: 0.1 }, dur: 8000 }], ['fist', 'magic']],
  ['warder', '結界師', '結界で戦場を区切り守る', { mnd: 4, vit: 2 }, { dr: 0.05, zonePower: 0.25 }, '結界', p => [{ t: 'zone', at: 'self', r: 90, dur: 8000, tick: 1000, ally: 1, aura: { dr: r2(0.2 * p) }, blockProj: 1 }], ['magic', 'polearm']],
  ['apothecary', '薬師', '薬草と霊薬で継戦能力を支える', { mnd: 3, int: 2, vit: 1 }, { regen: 0.006, potion: 0.4 }, '霊薬', p => [{ t: 'heal', amt: r2(0.2 * p), r: 120 }, { t: 'cleanse', r: 120 }, { t: 'buff', mods: { regen: 0.02 }, dur: 8000 }], ['magic', 'ranged']],
  ['merchant', '商人', '財力が力。金貨すら武器にする', { luk: 4, dex: 2 }, { gold: 0.25, drop: 0.1 }, '投げ銭', p => [{ t: 'hit', shape: { s: 'proj', spd: 11, rng: 200, sz: 4, n: 5, sp: 10 }, m: r2(0.6 * p), goldScale: 1 }], ['ranged', 'blunt']],
  ['scholar', '学者', '敵を分析し成長を早める知の探究者', { int: 4, luk: 2 }, { xp: 0.15, masteryXp: 0.2 }, '弱点看破', p => [{ t: 'zone', at: 'target', r: 90, dur: 300, tick: 100, mark: 1, status: ['armorbreak', 1, 6000], m: 0 }], ['magic', 'mech']],
  ['wanderer', '旅人', '何にでも適応する放浪者', { str: 1, vit: 1, dex: 1, agi: 1, int: 1, mnd: 1 }, { all: 0.03, move: 0.05 }, '旅の知恵', p => [{ t: 'buff', mods: { atk: r2(0.1 * p), dr: 0.1, move: 0.15, regen: 0.01 }, dur: 12000 }], ['sword', 'polearm', 'blunt', 'fist', 'ranged', 'magic', 'mech']],
  ['pirate', '海賊', '略奪と砲撃で海を荒らす無法者', { str: 2, luk: 2, dex: 2 }, { crit: 0.04, ls: 0.015 }, '一斉砲撃', p => [{ t: 'barrage', n: 8, r: 34, spread: 110, delay: 400, interval: 110, m: r2(0.7 * p), el: 'fire' }], ['sword', 'ranged']],
  ['mercenary', '傭兵', '報酬次第でどんな戦場にも立つ戦術家', { str: 2, vit: 2, dex: 2 }, { partyAtk: 0.04, firstStrike: 0.1 }, '戦術指揮', p => [{ t: 'aura', r: 150, mods: { atk: r2(0.1 * p), crit: 0.08, dr: 0.08 }, dur: 12000 }], ['sword', 'polearm', 'ranged']],
  ['avenger', '復讐者', '受けた痛みを倍にして返す', { vit: 3, str: 3 }, { thorns: 0.2, counterDmg: 0.3 }, '報復', p => [{ t: 'counter', win: 1200, m: r2(3.0 * p), shape: { s: 'circle', r: 60 } }], ['sword', 'blunt']],
];
// lineage: [prefix, tier, element, extraPassive, rider(eff mutator description), parentIdx]
export const TIERS = ['基本職', '応用職', '上級職', '特殊職', '希少職', '隠し職'];
export const LINEAGES = [
  ['', 0, null, {}, null, -1],
  ['炎刃の', 1, 'fire', { elemDmg: { fire: 0.12 } }, 'burn', 0], ['氷霜の', 1, 'ice', { elemDmg: { ice: 0.12 } }, 'freeze', 0], ['迅雷の', 1, 'thunder', { elemDmg: { thunder: 0.12 }, aspd: 0.03 }, 'shock', 0],
  ['疾風の', 1, 'wind', { move: 0.06, elemDmg: { wind: 0.1 } }, 'slow', 0], ['大地の', 1, 'earth', { dr: 0.04, elemDmg: { earth: 0.1 } }, 'stun', 0], ['流水の', 1, 'water', { regen: 0.003, elemDmg: { water: 0.1 } }, 'slow', 0],
  ['聖光の', 2, 'holy', { healPower: 0.1, elemDmg: { holy: 0.15 } }, 'stun', 6], ['闇夜の', 2, 'dark', { ls: 0.015, elemDmg: { dark: 0.15 } }, 'curse', 4], ['鋼鉄の', 2, null, { dr: 0.07, stagger: 0.2 }, 'armorbreak', 5],
  ['血盟の', 2, null, { ls: 0.02, lowHpAtk: 0.15 }, 'bleed', 1], ['幻影の', 2, null, { dodge: 0.06, cloneOnDodge: 0.15 }, 'fear', 2], ['星詠の', 2, 'holy', { crit: 0.05, critDmg: 0.15 }, 'starfall', 3],
  ['黄昏の', 3, 'dark', { elemDmg: { holy: 0.12, dark: 0.12 } }, 'twilight', 7], ['深淵の', 3, 'void', { curseAmp: 0.2, elemDmg: { void: 0.15 } }, 'curse', 8], ['竜血の', 3, 'fire', { hp: 0.12, atk: 0.06 }, 'dragon', 10],
  ['機巧の', 3, null, { summonPower: 0.15, pen: 0.06 }, 'turret', 9], ['霊樹の', 3, 'earth', { regen: 0.006, healPower: 0.15 }, 'sanctuary', 11],
  ['時渡りの', 4, 'void', { cdr: 0.12, aspd: 0.05 }, 'timewarp', 12], ['重界の', 4, 'void', { stagger: 0.3, kb: 0.3 }, 'gravity', 14], ['虚無の', 4, 'void', { pen: 0.12, elemDmg: { void: 0.2 } }, 'erase', 13], ['神託の', 4, 'holy', { all: 0.06, healPower: 0.1 }, 'blessing', 17],
  ['終焉の', 5, 'void', { atk: 0.12, execDmg: 0.3 }, 'apocalypse', 20], ['原初の', 5, null, { all: 0.1 }, 'genesis', 21], ['永劫の', 5, 'void', { cdr: 0.15, regen: 0.008, revive: 1 }, 'eternity', 18],
];
const RIDER_TEXT = { burn: '炎上', freeze: '凍結', shock: '感電', slow: '鈍足', stun: '気絶', curse: '呪い', armorbreak: '防御低下', bleed: '出血', fear: '恐怖' };
function applyRider(eff, rider, el, p) {
  const out = eff.map(e => ({ ...e }));
  const STATUSES = ['burn', 'freeze', 'shock', 'slow', 'stun', 'curse', 'armorbreak', 'bleed', 'fear'];
  if (STATUSES.includes(rider)) for (const e of out) if (['hit', 'zone', 'barrage', 'leap', 'counter'].includes(e.t)) { e.status = e.status || [rider, r2(0.3 + 0.1 * p), 2500]; if (el) e.el = el; }
  if (el) for (const e of out) if (e.t === 'enchant' && e.el === 'best') e.el = el;
  switch (rider) {
    case 'starfall': out.push({ t: 'barrage', n: 5, r: 20, spread: 90, delay: 300, interval: 90, m: r2(0.3 * p), el: 'holy' }); break;
    case 'twilight': out.push({ t: 'hit', shape: { s: 'circle', r: 70 }, m: r2(0.8 * p), el: 'holy' }, { t: 'hit', shape: { s: 'circle', r: 70 }, m: r2(0.8 * p), el: 'dark', delay: 250 }); break;
    case 'dragon': out.push({ t: 'buff', mods: { dr: 0.12, atk: 0.12 }, dur: 8000 }, { t: 'hit', shape: { s: 'arc', r: 90, a: 50 }, m: r2(0.4 * p), h: 4, interval: 150, el: 'fire', status: ['burn', 0.4, 3000] }); break;
    case 'turret': out.push({ t: 'summon', kind: 'turret', n: 1, dur: 10000, m: r2(0.3 * p) }); break;
    case 'sanctuary': out.push({ t: 'zone', at: 'self', r: 70, dur: 6000, tick: 1000, heal: 0.03, ally: 1 }); break;
    case 'timewarp': out.push({ t: 'buff', mods: { cdr: 0.3, aspd: 0.2 }, dur: 6000 }); break;
    case 'gravity': out.push({ t: 'zone', at: 'target', r: 90, dur: 2000, tick: 250, pull: 3, m: r2(0.1 * p) }); break;
    case 'erase': out.push({ t: 'hit', shape: { s: 'circle', r: 80 }, m: r2(0.6 * p), el: 'void', strip: 1, exec: { th: 0.12, m: 9 } }); break;
    case 'blessing': out.push({ t: 'aura', r: 140, mods: { atk: 0.1, dr: 0.1 }, dur: 10000 }, { t: 'heal', amt: 0.1, r: 140 }); break;
    case 'apocalypse': out.push({ t: 'barrage', n: 12, r: 34, spread: 140, delay: 500, interval: 80, m: r2(0.6 * p), el: 'void' }); break;
    case 'genesis': out.push({ t: 'buff', mods: { atk: 0.2, dr: 0.2, aspd: 0.2, move: 0.2, regen: 0.01 }, dur: 12000 }); break;
    case 'eternity': out.push({ t: 'buff', mods: { cdr: 0.4, revive: 1 }, dur: 15000 }, { t: 'heal', amt: 0.2, r: 0 }); break;
  }
  return out;
}
const DUNGEON_FOR_TIER = ['', '', '', 'd04', 'd08', 'd12'];
export function buildJobs() {
  const jobs = [];
  ROLES.forEach((role, ri) => {
    const [key, name, desc, statMods, pmods, aname, aeff, aff] = role;
    LINEAGES.forEach((lin, li) => {
      const [prefix, tier, el, extra, rider, parent] = lin;
      const p = 1 + tier * 0.22;
      const id = `${key}_${li}`;
      const passive = { ...Object.fromEntries(Object.entries(pmods).map(([k, v]) => [k, typeof v === 'number' ? r2(v * (1 + tier * 0.15)) : v])) };
      for (const [k, v] of Object.entries(extra)) passive[k] = typeof v === 'object' ? { ...(passive[k] || {}), ...v } : r2((passive[k] || 0) + v);
      const stats = Object.fromEntries(Object.entries(statMods).map(([k, v]) => [k, Math.round(v * (1 + tier * 0.5))]));
      let unlock;
      if (tier === 0) unlock = ri < 12 ? { level: 1 } : { level: 3 + (ri % 10) * 2 };
      else if (tier === 1) unlock = { level: 15, job: `${key}_0`, prof: 3 };
      else if (tier === 2) unlock = { level: 35, job: `${key}_${parent}`, prof: 5, kills: 300 };
      else if (tier === 3) unlock = { level: 55, job: `${key}_${parent}`, prof: 6, clear: { dungeon: ['d03', 'd04', 'd05', 'd06', 'd07'][li - 13], floor: 30 } };
      else if (tier === 4) unlock = { level: 85, job: `${key}_${parent}`, prof: 8, boss: { diff: 'HARD', count: 10 + ri % 5 }, clear: { dungeon: ['d08', 'd09', 'd10', 'd11'][li - 18], floor: 60 } };
      else unlock = { level: 120, job: `${key}_${parent}`, prof: 10, hidden: [{ abyssFloor: 10 + (ri % 10) }, { npcBond: 80 }, { item: 'relic_' + ['end', 'origin', 'eternity'][li - 22] }][ri % 3], abyss: 5 + (ri % 6) };
      const affinity = { best: aff.slice(0, 1), good: aff.slice(1) };
      jobs.push({
        id, role: key, lineage: li, name: `${prefix}${name}`, tier, tierName: TIERS[tier], el,
        desc: prefix ? `${desc}。${prefix.replace('の', '')}の力を継承し${rider && RIDER_TEXT[rider] ? RIDER_TEXT[rider] + 'を操る' : '独自の秘技を持つ'}` : desc,
        stats, passive: { name: `${prefix}${name}の心得`, mods: passive },
        active: { id: `job_${id}`, name: `${prefix ? prefix.replace('の', '・') : ''}${aname}`, src: 'job', job: id, el, eff: applyRider(aeff(p), rider, el, p), cost: Math.round(15 + tier * 6), cd: Math.round(14000 + tier * 1000), kind: 'job' },
        affinity, unlock, parent: parent >= 0 ? `${key}_${parent}` : null, profMax: 10,
      });
    });
  });
  // children list for tree
  const byId = Object.fromEntries(jobs.map(j => [j.id, j]));
  for (const j of jobs) { j.children = []; }
  for (const j of jobs) if (j.parent && byId[j.parent]) byId[j.parent].children.push(j.id);
  return jobs;
}
