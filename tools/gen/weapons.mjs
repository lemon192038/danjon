// Individual weapon generator (100 per type). Each weapon: rarity, stats, unique skill, passive trait, acquisition.
import { K, elementOf, statusOf } from './keywords.mjs';
import { hash32, rng } from '../../shared/util.js';
const r2 = v => Math.round(v * 100) / 100;

export const SIGNATURES = {
  nova: { name: '解放', kw: /ノヴァ|バースト|爆|解放|フレア|ブラスト/, eff: (m, el, st) => [{ t: 'hit', shape: { s: 'circle', r: 64 }, m, status: st, kb: 60 }] },
  chain: { name: '連鎖', kw: /チェイン|鎖|雷|サンダー|ボルト|ライトニング/, eff: (m, el, st) => [{ t: 'hit', shape: { s: 'proj', spd: 12, rng: 200, sz: 4, chain: 4 }, m, status: st }] },
  clone: { name: '幻影', kw: /ファントム|ミラージュ|幻|影|シャドウ|ゴースト/, eff: (m, el) => [{ t: 'summon', kind: 'clone', n: 1, dur: 8000, m: r2(m * 0.4), el }] },
  meteor: { name: '降星', kw: /メテオ|星|コメット|スター|彗|流星|隕/, eff: (m, el, st) => [{ t: 'barrage', n: 6, r: 32, spread: 90, delay: 600, interval: 140, m: r2(m * 0.5), status: st, el }] },
  vortex: { name: '渦動', kw: /渦|ヴォルテックス|サイクロン|トルネード|竜巻|ストーム|テンペスト/, eff: (m, el, st) => [{ t: 'zone', at: 'target', r: 70, dur: 3500, tick: 400, m: r2(m * 0.25), pull: 2.2, status: st, el }] },
  lance: { name: '貫光', kw: /ランス|ジャベリン|槍|光|レイ|ビーム|グングニル|ロンギヌス/, eff: (m, el, st) => [{ t: 'hit', shape: { s: 'beam', l: 240, w: 14 }, m: r2(m * 1.2), pen: 0.5, status: st }] },
  drain: { name: '吸命', kw: /ブラッド|血|ソウル|魂|イーター|ドレイン|ヴァンパ|吸/, eff: (m, el, st) => [{ t: 'hit', shape: { s: 'arc', r: 50, a: 160 }, m, ls: 0.35, status: st }] },
  aegis: { name: '神盾', kw: /ガーディアン|イージス|守|盾|ガード|フォートレス|城|要塞|アイギス/, eff: () => [{ t: 'shield', amt: 0.35, dur: 6000 }, { t: 'buff', mods: { reflect: 0.3, kbImmune: 1 }, dur: 6000 }] },
  blinkStrike: { name: '瞬撃', kw: /瞬|閃|フラッシュ|ソニック|疾風|神速|ブリンク/, eff: (m, el, st) => [{ t: 'blink', d: 140, toTarget: 1 }, { t: 'hit', shape: { s: 'arc', r: 46, a: 200 }, m: r2(m * 1.1), status: st, critAdd: 0.3 }] },
  trap: { name: '設罠', kw: /罠|トラップ|ルーン|刻印|紋|ワイヤー|糸/, eff: (m, el, st) => [{ t: 'zone', at: 'self', r: 46, dur: 15000, tick: 0, trigger: 1, m: r2(m * 1.4), status: st || ['bind', 0.8, 2000], el }] },
  echo: { name: '残響', kw: /エコー|残|響|クロノ|時|リピート/, eff: (m, el, st) => [{ t: 'hit', shape: { s: 'arc', r: 50, a: 140 }, m, status: st, echo: 500, echoN: 2 }] },
  cross: { name: '十字', kw: /クロス|十字|ホーリー|聖|セイント/, eff: (m, el, st) => [{ t: 'hit', shape: { s: 'beam', l: 120, w: 14 }, m, status: st }, { t: 'hit', shape: { s: 'beam', l: 120, w: 14, rot: 90 }, m, status: st }, { t: 'hit', shape: { s: 'beam', l: 120, w: 14, rot: -90 }, m, status: st }] },
  fan: { name: '扇撃', kw: /ファン|扇|乱射|アロー|矢|シュート|レイン|雨/, eff: (m, el, st) => [{ t: 'hit', shape: { s: 'proj', spd: 10, rng: 220, sz: 4, n: 7, sp: 12, pierce: 1 }, m: r2(m * 0.45), status: st }] },
  quake: { name: '地衝', kw: /アース|グランド|地|震|クエイク|ガイア|タイタン|ジャイアント|ハンマー|ブレイカー/, eff: (m, el, st) => [{ t: 'hit', shape: { s: 'circle', r: 40 }, m: r2(m * 0.6), st: 4, status: st }, { t: 'hit', shape: { s: 'circle', r: 80 }, m: r2(m * 0.5), st: 3, delay: 250 }, { t: 'hit', shape: { s: 'circle', r: 120 }, m: r2(m * 0.4), st: 2, delay: 500 }] },
  totem: { name: '砲台', kw: /キャノン|砲|タレット|機|メカ|マシン|ギア|ゼノ/, eff: (m, el) => [{ t: 'summon', kind: 'turret', n: 1, dur: 12000, m: r2(m * 0.3), el }] },
  blessing: { name: '祝福', kw: /祝|ブレス|エンジェル|天使|セラフ|女神|ヘヴン|ヘブン|楽園|エデン/, eff: () => [{ t: 'heal', amt: 0.25, r: 120 }, { t: 'aura', r: 120, mods: { atk: 0.15, def: 0.15 }, dur: 10000 }] },
  frenzy: { name: '狂奔', kw: /バーサ|狂|レイジ|フューリー|ベルセルク|激|鬼|修羅|羅刹/, eff: () => [{ t: 'buff', mods: { atk: 0.35, aspd: 0.3, dr: -0.15 }, dur: 10000 }] },
  execution: { name: '断罪', kw: /処刑|断罪|ギロチン|エクスキュー|ジャッジ|審判|デス|死|リーパー|キラー|スレイヤー/, eff: (m, el, st) => [{ t: 'hit', shape: { s: 'slam', d: 26, r: 38 }, m: r2(m * 1.5), exec: { th: 0.35, m: 2.2 }, st: 6, status: st }] },
  sanctuary: { name: '聖域', kw: /サンクチュア|聖域|楽園|オアシス|泉|命|ライフ|再生/, eff: () => [{ t: 'zone', at: 'self', r: 80, dur: 8000, tick: 1000, heal: 0.04, ally: 1, el: 'holy' }] },
  curseField: { name: '呪域', kw: /カース|呪|ナイトメア|アビス|冥|ヘル|奈落|深淵|黄泉/, eff: (m, el, st) => [{ t: 'zone', at: 'target', r: 80, dur: 6000, tick: 600, m: r2(m * 0.2), status: ['curse', 0.7, 3000], slow: 0.4, el: 'dark' }] },
  spiral: { name: '螺旋', kw: /スパイラル|螺旋|ドリル|ツイスト|ねじ/, eff: (m, el, st) => [{ t: 'hit', shape: { s: 'proj', spd: 6, rng: 200, sz: 5, n: 4, spiral: 1, pierce: 3 }, m: r2(m * 0.5), status: st }] },
  whirlwind: { name: '旋嵐', kw: /旋|スピン|回転|ホイール|サークル|リング|輪/, eff: (m, el, st) => [{ t: 'dash', d: 120, inv: 300, hit: { s: 'circle', r: 44 }, m: r2(m * 0.5), h: 4, status: st }] },
  mirror: { name: '鏡返', kw: /ミラー|鏡|リフレクト|反射|カウンター|リベンジ/, eff: (m, el, st) => [{ t: 'counter', win: 900, m: r2(m * 2), shape: { s: 'circle', r: 56 }, reflect: 1, status: st }] },
  gravity: { name: '重圧', kw: /グラビティ|重力|ブラックホール|プレス|圧/, eff: (m, el, st) => [{ t: 'zone', at: 'target', r: 90, dur: 1400, tick: 200, pull: 3.5, m: 0.05 }, { t: 'barrage', n: 1, r: 80, spread: 0, delay: 1400, m: r2(m * 1.6), st: 8 }] },
  storm: { name: '雷霆', kw: /ストーム|嵐|雷霆|トール|ミョルニル|ゼウス|ケラウノス/, eff: (m, el, st) => [{ t: 'zone', at: 'self', r: 130, dur: 5000, tick: 400, strike: 1, m: r2(m * 0.45), status: st || ['shock', 0.3, 1500], el: el || 'thunder' }] },
  wall: { name: '障壁', kw: /ウォール|壁|バリア|結界/, eff: () => [{ t: 'zone', at: 'front', r: 40, dur: 6000, wall: 1, blockProj: 1 }, { t: 'buff', mods: { dr: 0.2 }, dur: 6000 }] },
  phoenix: { name: '不死鳥', kw: /フェニックス|鳳凰|不死|リザレク|転生/, eff: () => [{ t: 'heal', amt: 0.15, r: 0 }, { t: 'buff', mods: { regen: 0.03, revive: 1 }, dur: 15000 }, { t: 'aura', r: 50, burnAura: 0.2, dur: 15000, el: 'fire' }] },
  timewarp: { name: '時歪', kw: /クロノ|時|タイム|刻|永劫|エターナル|インフィニティ/, eff: () => [{ t: 'buff', mods: { aspd: 0.3, move: 0.3, cdr: 0.3 }, dur: 6000 }, { t: 'zone', at: 'self', r: 120, dur: 6000, tick: 500, slow: 0.5 }] },
  starfall: { name: '星屑', kw: /アストラル|セレスティアル|天|宙|コスモ|ギャラクシ|銀河/, eff: (m, el, st) => [{ t: 'barrage', n: 14, r: 18, spread: 140, delay: 300, interval: 70, m: r2(m * 0.22), status: st, el: el || 'holy' }] },
  soulBurst: { name: '魂葬', kw: /オメガ|ゼロ|ラスト|終焉|アポカリプス|ラグナロク|カタストロフ/, eff: (m, el, st) => [{ t: 'hit', shape: { s: 'circle', r: 90 }, m: r2(m * 1.2), consumeMark: 1.5, status: st }] },
  shockwave: { name: '衝波', kw: /ソード|ブレード|エッジ|セイバー|スラッシュ|カッター/, eff: (m, el, st) => [{ t: 'hit', shape: { s: 'proj', spd: 9, rng: 200, sz: 10, pierce: 9, wave: 1 }, m, status: st }] },
};
const SIG_KEYS = Object.keys(SIGNATURES);

export const TRAITS = {
  onHitStatus: (p, st) => ({ name: `命中時${STN[st]}付与`, mods: { onHitStatus: [st, r2(0.06 + p * 0.06), 2500] } }),
  crit: p => ({ name: '会心強化', mods: { crit: r2(0.03 + p * 0.03) } }),
  critDmg: p => ({ name: '会心威力', mods: { critDmg: r2(0.1 + p * 0.08) } }),
  lifesteal: p => ({ name: '吸命', mods: { ls: r2(0.01 + p * 0.012) } }),
  elemDmg: (p, st, el) => ({ name: `${el}威力上昇`, mods: { elemDmg: { [el]: r2(0.06 + p * 0.06) } } }),
  move: p => ({ name: '疾走', mods: { move: r2(0.03 + p * 0.025) } }),
  spRegen: p => ({ name: '魔力循環', mods: { spRegen: r2(0.2 + p * 0.25) } }),
  cdr: p => ({ name: '技巧', mods: { cdr: r2(0.03 + p * 0.025) } }),
  def: p => ({ name: '堅牢', mods: { dr: r2(0.02 + p * 0.02) } }),
  thorns: p => ({ name: '反撃の棘', mods: { thorns: r2(0.08 + p * 0.06) } }),
  killHeal: p => ({ name: '戦果回復', mods: { killHeal: r2(0.02 + p * 0.015) } }),
  execute: p => ({ name: '止めの一撃', mods: { execDmg: r2(0.1 + p * 0.08) } }),
  firstStrike: p => ({ name: '先制', mods: { firstStrike: r2(0.2 + p * 0.15) } }),
  finisher: p => ({ name: '連撃の締め', mods: { finisher: r2(0.1 + p * 0.08) } }),
  desperate: p => ({ name: '背水', mods: { lowHpAtk: r2(0.1 + p * 0.1) } }),
  fullHp: p => ({ name: '万全', mods: { fullHpAtk: r2(0.06 + p * 0.05) } }),
  dodge: p => ({ name: '見切り', mods: { iframe: Math.round(40 + p * 30) } }),
  aspd: p => ({ name: '迅速', mods: { aspd: r2(0.03 + p * 0.025) } }),
  range: p => ({ name: '長射程', mods: { range: r2(0.04 + p * 0.03) } }),
  hp: p => ({ name: '活力', mods: { hp: r2(0.04 + p * 0.03) } }),
  stagger: p => ({ name: '剛撃', mods: { stagger: r2(0.15 + p * 0.1) } }),
  pen: p => ({ name: '貫通', mods: { pen: r2(0.04 + p * 0.03) } }),
  luck: p => ({ name: '幸運', mods: { drop: r2(0.05 + p * 0.05) } }),
  xp: p => ({ name: '修練', mods: { xp: r2(0.05 + p * 0.04), masteryXp: r2(0.1 + p * 0.06) } }),
};
const TRAIT_KEYS = Object.keys(TRAITS);
const ELN = { fire: '炎', ice: '氷', thunder: '雷', wind: '風', earth: '地', water: '水', holy: '聖', dark: '闇', void: '虚無' };
const STN = { burn: '炎上', freeze: '凍結', shock: '感電', bleed: '出血', poison: '毒', stun: '気絶', slow: '鈍足', curse: '呪い', fear: '恐怖', bind: '拘束', armorbreak: '防御低下', sleep: '睡眠', silence: '沈黙', stop: '時間停止' };
const ELEMENT_STATUS = { fire: 'burn', ice: 'freeze', thunder: 'shock', wind: 'slow', earth: 'stun', water: 'slow', holy: 'stun', dark: 'curse', void: 'silence' };

export function rarityFor(wt, i) {
  if (wt.myth) return i < 50 ? 4 : i < 85 ? 5 : 6;
  return i < 30 ? 1 : i < 55 ? 2 : i < 75 ? 3 : i < 90 ? 4 : 5;
}
function acquisition(wt, i, rar, r) {
  if (wt.myth) {
    const src = ['abyssBoss', 'godEvent', 'specialQuest', 'hiddenEvent', 'specialBoss'];
    return { src: src[i % 5], minFloor: 30 + Math.floor(i * 0.7), diff: i < 50 ? 'HELL' : 'ABYSS' };
  }
  if (rar === 1) return { src: i < 12 ? 'shop' : 'drop', minFloor: 1 + Math.floor(i * 0.6), diff: 'EASY' };
  if (rar === 2) return { src: i < 40 ? 'shop' : 'drop', minFloor: 10 + Math.floor((i - 30) * 1.2), diff: 'NORMAL' };
  if (rar === 3) return { src: r() < 0.5 ? 'drop' : 'chest', minFloor: 30 + (i - 55) * 2, diff: 'NORMAL' };
  if (rar === 4) return { src: r() < 0.6 ? 'boss' : 'quest', minFloor: 50 + (i - 75) * 2, diff: 'HARD' };
  return { src: r() < 0.5 ? 'boss' : 'quest', minFloor: 70 + (i - 90) * 3, diff: 'HELL' };
}

export function buildWeapon(name, wt, i) {
  const r = rng(hash32('weapon:' + wt.key + ':' + name));
  const rar = rarityFor(wt, i);
  const lvl = wt.myth ? 60 + Math.round(i * 1.4) : 1 + Math.round(i * 1.25);
  const weight = (wt.combo.reduce((a, s) => a + s.m, 0) / wt.combo.length);
  const atk = Math.round((8 + lvl * 2.6) * (0.85 + weight * 0.25) * [0, 1, 1.12, 1.27, 1.45, 1.66, 1.95][rar]);
  let el = elementOf(name) || (i >= 25 && wt.elem.length && r() < 0.5 ? wt.elem[Math.floor(r() * wt.elem.length)] : null);
  const st = statusOf(name) || (el ? ELEMENT_STATUS[el] : null) || (wt.status[0] || null);
  const h = hash32(name + wt.key);
  const matches = SIG_KEYS.filter(k => k !== 'shockwave' && SIGNATURES[k].kw.test(name));
  let sig = matches.length ? matches[h % matches.length] : (SIGNATURES.shockwave.kw.test(name) && h % 3 === 0 ? 'shockwave' : SIG_KEYS[h % SIG_KEYS.length]);
  const pw = rar - 1; // 0..5
  const m = r2((1.4 + lvl * 0.012) * (1 + pw * 0.22));
  const status = st ? [st, r2(0.3 + pw * 0.08), 2500] : undefined;
  const eff = SIGNATURES[sig].eff(m, el, status);
  for (const e of eff) if (el && !e.el && (e.t === 'hit' || e.t === 'barrage')) e.el = el;
  const skill = { id: `u${wt.id}_${String(i + 1).padStart(3, '0')}`, name: `${name}・${SIGNATURES[sig].name}`, src: 'weapon', wt: wt.id, el, sig, eff, cost: Math.round(14 + pw * 5), cd: Math.round(9000 + (sig === 'aegis' || sig === 'frenzy' || sig === 'timewarp' || sig === 'phoenix' || sig === 'blessing' ? 9000 : 0) - pw * 400), cast: ['meteor', 'gravity', 'starfall'].includes(sig) ? 300 : 0, kind: sig };
  // traits: N=1, R=1, SR=2, SSR=2, UR=3, MYTH=3
  const nTraits = [0, 1, 1, 2, 2, 3, 3][rar];
  const traits = []; const used = new Set();
  const prefer = [];
  if (st && el) prefer.push('onHitStatus', 'elemDmg');
  if (K.drain.test(name)) prefer.push('lifesteal');
  if (K.crit.test(name)) prefer.push('crit');
  if (K.guard.test(name)) prefer.push('def', 'thorns');
  if (K.execute.test(name)) prefer.push('execute');
  while (traits.length < nTraits) {
    const key = prefer.length ? prefer.shift() : TRAIT_KEYS[Math.floor(r() * TRAIT_KEYS.length)];
    if (used.has(key) || (key === 'elemDmg' && !el) || (key === 'onHitStatus' && !st)) continue;
    used.add(key);
    traits.push({ key, ...TRAITS[key](pw, st, ELN[el] ? el : 'fire') });
  }
  for (const t of traits) if (t.key === 'elemDmg') t.name = `${ELN[el]}威力上昇`;
  const sub = {}; // stat bonuses
  for (const s of wt.good) sub[s] = Math.round((2 + lvl * 0.12) * (1 + pw * 0.3));
  return {
    id: `${wt.id}_${String(i + 1).padStart(3, '0')}`, name, wt: wt.id, idx: i, rar, lvl, atk, el, stats: sub, traits, skill,
    spd: r2(0.95 + r() * 0.1), crit: r2(0.02 + (wt.key === 'rapier' || wt.key === 'katana' ? 0.05 : 0) + pw * 0.01), acq: acquisition(wt, i, rar, r),
    price: Math.round(atk * 12 * [0, 1, 2, 5, 12, 30, 80][rar]),
  };
}
