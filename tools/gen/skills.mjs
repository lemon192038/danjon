// Weapon-type skill generator: 100 named skills per weapon type -> concrete, executable effect lists.
import { K, elementOf, statusOf } from './keywords.mjs';
import { hash32, rng } from '../../shared/util.js';

const r2 = v => Math.round(v * 100) / 100;
export function reachOf(wt) {
  let reach = 0, ranged = false;
  for (const s of wt.combo) {
    if (s.s === 'proj') { ranged = true; reach = Math.max(reach, s.rng); }
    else if (s.s === 'beam') { ranged = true; reach = Math.max(reach, s.l); }
    else reach = Math.max(reach, s.r || 0, s.l || 0, (s.d || 0) + (s.r || 0));
  }
  return { reach, ranged };
}
const ELEMENT_STATUS = { fire: 'burn', ice: 'freeze', thunder: 'shock', wind: 'slow', earth: 'stun', water: 'slow', holy: 'stun', dark: 'curse', void: 'silence' };

// Native shape for a weapon type, scaled.
function nativeShape(wt, R, k = 1) {
  const last = wt.combo[wt.combo.length - 1];
  const sh = { ...last }; delete sh.m; delete sh.t; delete sh.h; delete sh.lg;
  for (const p of ['r', 'l', 'rng', 'd']) if (sh[p]) sh[p] = Math.round(sh[p] * k);
  if (sh.s === 'proj') { sh.rng = Math.round(Math.max(sh.rng, 160) * k); }
  return sh;
}

export function buildWeaponTypeSkill(name, wt, i) {
  const r = rng(hash32(wt.key + ':' + name + ':' + i));
  const { reach, ranged } = reachOf(wt);
  const R = Math.max(40, reach);
  const has = re => re.test(name);
  const ult = has(K.ult) && i >= 60;
  const tier = Math.floor(i / 20);
  let el = elementOf(name);
  let st = statusOf(name) || (el ? ELEMENT_STATUS[el] : null) || (r() < 0.35 && wt.status.length ? wt.status[Math.floor(r() * wt.status.length)] : null);
  const myth = !!wt.myth;
  const base = (1.5 + i * 0.032) * (myth ? 1.25 : 1) * (ult ? 1.6 : 1);
  const sk = { id: `w${wt.id}_${String(i + 1).padStart(3, '0')}`, name, src: 'wtype', wt: wt.id, req: { mastery: i + 1 }, tier, el, eff: [], cost: Math.round(8 + i * 0.32 + (ult ? 20 : 0)), cd: 4000, cast: 0 };
  const status = st ? [st, r2(0.25 + r() * 0.35 + (tier * 0.05)), 2000 + Math.round(r() * 2000)] : null;
  const hit = (shape, m, o = {}) => ({ t: 'hit', shape, m: r2(m), ...(status ? { status } : {}), ...o });
  let kind;

  if (has(K.passive) && !has(K.ult)) {
    kind = 'passive';
    const mods = {};
    if (has(K.guard)) mods.dr = r2(0.04 + tier * 0.01);
    if (has(K.counter)) mods.counterDmg = r2(0.15 + tier * 0.04);
    if (has(/リーチ|レンジ|エクステンド|ワイド/)) mods.range = r2(0.08 + tier * 0.02);
    if (has(/アクセル|スピード|テクニック|コントロール/)) mods.aspd = r2(0.05 + tier * 0.015);
    if (has(/シャープネス|クリティカル|エッジ/)) mods.crit = r2(0.03 + tier * 0.01);
    if (has(/チャージ/)) mods.chargeSpd = r2(0.15 + tier * 0.04);
    if (!Object.keys(mods).length) { mods.atk = r2(0.04 + tier * 0.012); mods.mastery = r2(0.05); }
    sk.eff.push({ t: 'passive', mods }); sk.cost = 0; sk.cd = 0;
  } else if (has(K.counter)) {
    kind = 'counter';
    sk.eff.push({ t: 'counter', win: Math.round(500 + r() * 400), m: r2(base * 1.5), shape: ranged ? { s: 'proj', spd: 10, rng: 220, sz: 5, pierce: 3 } : nativeShape(wt, R, 1.1), reflect: has(/リフレクト|反射|水鏡/) ? 1 : 0, ...(status ? { status } : {}) });
    sk.cd = 6000 + tier * 1000;
  } else if (has(K.guard)) {
    kind = 'guard';
    sk.eff.push({ t: 'shield', amt: r2(0.12 + tier * 0.03 + (ult ? 0.2 : 0)), dur: 5000 });
    sk.eff.push({ t: 'buff', mods: { dr: r2(0.2 + tier * 0.04), kbImmune: 1 }, dur: 4000 + tier * 500 });
    if (has(K.heavy) || has(/バッシュ|チャージ|ダッシュ|スラスト/)) sk.eff.push(hit(nativeShape(wt, R, 0.9), base * 0.8, { st: 3, kb: 50 }));
    if (has(/天地|守護|陣|神盾|竜鱗|ラストスタンド/)) sk.eff.push({ t: 'aura', r: 90, mods: { dr: r2(0.1 + tier * 0.02) }, dur: 6000 });
    sk.cd = 12000 + tier * 1500;
  } else if (has(K.summon)) {
    kind = 'summon';
    sk.eff.push({ t: 'summon', kind: has(/分身|クローン|影|ファントム|ミラージュ|幻/) ? 'clone' : has(/ゴーレム|人形|ドール|パペット/) ? 'golem' : has(/精霊|フェニックス|ドラゴン|竜|龍/) ? 'spirit' : 'familiar', n: ult ? 3 : 1 + (tier >= 3 ? 1 : 0), dur: 10000 + tier * 2000, m: r2(base * 0.35), el });
    sk.cd = 18000 + tier * 2000;
  } else if (has(K.buff) && !has(K.heavy) && !has(K.thrust)) {
    kind = 'buff';
    const mods = {};
    if (el) { sk.eff.push({ t: 'enchant', el, dur: 10000 + tier * 2000, m: r2(0.15 + tier * 0.05) }); }
    if (has(/構え|スタンス|不動|心眼|明鏡|無念/)) { mods.crit = r2(0.15 + tier * 0.04); mods.dr = r2(0.1); mods.move = -0.2; }
    if (has(/覚醒|アウェイク|解放|降臨|フォーム|トランス|狂|バーサク|レイジ/)) { mods.atk = r2(0.25 + tier * 0.06); mods.aspd = r2(0.15); mods.dr = -0.1; }
    if (has(/オーバードライブ|リミット|オーバーロード|ブースト|ハイ$/)) { mods.aspd = r2(0.3 + tier * 0.05); mods.cdr = r2(0.2); }
    if (has(/鼓舞|号令|士気|加護/)) { sk.eff.push({ t: 'aura', r: 120, mods: { atk: r2(0.12 + tier * 0.03), def: 0.1 }, dur: 12000 }); }
    if (has(/チャージ|充填|闘気|集中/)) { mods.nextHit = r2(1.0 + tier * 0.4); }
    if (!Object.keys(mods).length && !el) { mods.atk = r2(0.2 + tier * 0.05); mods.crit = 0.1; }
    if (Object.keys(mods).length) sk.eff.push({ t: 'buff', mods, dur: 10000 + tier * 1500 });
    sk.cd = 20000 + tier * 2000; sk.cost += 5;
  } else if (has(K.zone)) {
    kind = 'zone';
    sk.eff.push({ t: 'zone', at: 'target', r: Math.round(50 + tier * 8 + (ult ? 40 : 0)), dur: 4000 + tier * 800, tick: 500, m: r2(base * 0.3), trigger: has(/罠|トラップ|設置|ルーン/) ? 1 : 0, pull: has(K.pull) ? 1.5 : 0, ...(status ? { status } : {}), el });
    sk.cd = 12000 + tier * 1500;
  } else if (has(K.barrage)) {
    kind = 'barrage';
    sk.eff.push({ t: 'barrage', n: Math.round(4 + tier * 1.5 + (ult ? 8 : 0)), r: 26 + tier * 3, spread: 70 + tier * 10, delay: 500, interval: 120, m: r2(base * 0.45), ...(status ? { status } : {}), el });
    sk.cd = 10000 + tier * 1500; sk.cast = 200;
  } else if (has(K.dash) && !has(K.thrust)) {
    kind = 'dash';
    const d = Math.round(90 + r() * 50 + tier * 10);
    sk.eff.push({ t: 'dash', d, inv: 250 + tier * 30, hit: has(/ステップ$|サイドステップ|バックステップ|エスケープ/) ? null : { s: 'circle', r: 26 }, m: r2(base * 0.9), back: has(/バック|リトリート|エスケープ/) ? 1 : 0 });
    if (has(/ステップ$|ステップ/) && !has(K.multi)) sk.eff.push({ t: 'buff', mods: { nextHit: r2(0.5 + tier * 0.2) }, dur: 2500 });
    sk.cd = 3500 + tier * 600;
  } else if (has(K.jump)) {
    kind = 'leap';
    sk.eff.push({ t: 'leap', d: Math.round(100 + tier * 15), r: Math.round(42 + tier * 6 + (ult ? 30 : 0)), m: r2(base * 1.2), st: 4, launch: has(/ライジング|昇|アッパー|天翔/) ? 1 : 0, ...(status ? { status } : {}) });
    sk.cd = 7000 + tier * 1000;
  } else if (has(K.beam) && (ranged || has(/一閃|閃光/))) {
    kind = 'beam';
    if (!ranged && has(/一閃/)) sk.eff.push({ t: 'dash', d: Math.round(110 + tier * 15), inv: 300, hit: { s: 'beam', l: 30, w: 16 }, m: r2(base * 1.4), line: 1 });
    else sk.eff.push(hit({ s: 'beam', l: Math.round(Math.max(R, 140) * 1.2), w: 10 + tier * 2 + (ult ? 14 : 0) }, base * 1.3, { h: 1 + Math.floor(tier / 2) }));
    sk.cd = 8000 + tier * 1200; sk.cast = ranged ? 250 : 0;
  } else if (has(K.spin)) {
    kind = 'spin';
    sk.eff.push(hit({ s: 'circle', r: Math.round(Math.max(36, R * 0.8) + tier * 6 + (ult ? 30 : 0)) }, base * 0.45, { h: 3 + tier + (ult ? 3 : 0), interval: 120, pull: has(K.pull) ? 15 : 0 }));
    sk.cd = 7000 + tier * 900;
  } else if (has(K.multi)) {
    kind = 'multi';
    const n = has(/千|百|無限|エンドレス/) ? 8 + tier * 2 : has(/五/) ? 5 : has(/トリプル|三/) ? 3 : has(/ダブル|二|ツイン|双|デュアル/) ? 2 : 4 + tier;
    sk.eff.push(hit(ranged ? { s: 'proj', spd: 10, rng: Math.round(R), sz: 4, n: 1 } : nativeShape(wt, R, 1.05), base * (1.6 / Math.sqrt(n)), { h: n, interval: Math.round(70 + r() * 40), lg: ranged ? 0 : 6 }));
    sk.cd = 6000 + tier * 900;
  } else if (has(K.thrust)) {
    kind = 'thrust';
    sk.eff.push(hit({ s: 'thrust', l: Math.round(Math.max(56, R * 1.25) + tier * 6), w: 12 + tier * 2 }, base * 1.35, { lg: has(K.dash) ? 60 : 20, pen: r2(0.2 + tier * 0.08), h: has(/ドリル|スパイラル/) ? 4 : 1 }));
    sk.cd = 5000 + tier * 900;
  } else if (has(K.heavy)) {
    kind = 'heavy';
    sk.eff.push(hit({ s: 'slam', d: Math.round(Math.min(40, R * 0.5)), r: Math.round(34 + tier * 6 + (ult ? 40 : 0)) }, base * 1.7, { st: 6 + tier, kb: 70 }));
    sk.cast = 250 + tier * 50; sk.cd = 7000 + tier * 1100;
  } else if (has(K.proj) || ranged) {
    kind = 'proj';
    const n = has(/ダブル|ツイン/) ? 2 : has(/トリプル|三/) ? 3 : 1 + (tier >= 2 ? Math.floor(r() * 3) : 0);
    sk.eff.push(hit({ s: 'proj', spd: Math.round(8 + r() * 4), rng: Math.round(Math.max(R, 180) * 1.2), sz: 4 + tier, n, sp: 14, pierce: tier >= 2 ? 2 + tier : 0, hom: has(/ホーミング|追尾|ガイド/) ? 0.08 : 0, aoe: has(/バースト|爆|ブラスト|エクスプロ/) ? 36 + tier * 6 : 0 }, base * (1.3 / Math.sqrt(n))));
    sk.cd = 4500 + tier * 900;
  } else {
    kind = 'strike';
    const v = Math.floor(r() * 6);
    if (v === 0) sk.eff.push(hit(nativeShape(wt, R, 1.2 + tier * 0.05), base * 1.5, { lg: 12, st: 2 }));
    else if (v === 1) sk.eff.push(hit({ s: 'arc', r: Math.round(Math.max(36, R * 0.9) + tier * 4), a: 220 }, base * 1.25, { st: 2, kb: 30 }));
    else if (v === 2) sk.eff.push(hit(nativeShape(wt, R, 1.0), base * 1.6, { lg: 60, st: 3 }));
    else if (v === 3) sk.eff.push(hit(nativeShape(wt, R, 1.0), base * 0.85, { h: 2, interval: 160 }));
    else if (v === 4) sk.eff.push(hit(nativeShape(wt, R, 1.0), base * 1.3, { launch: 1, st: 3 }));
    else sk.eff.push(hit({ s: 'slam', d: Math.round(Math.min(30, R * 0.4)), r: 40 + tier * 5 }, base * 1.3, { kb: 110, st: 4 }));
    sk.cd = 4500 + tier * 900;
  }
  // Riders: interactions with other skills / statuses
  const atk = sk.eff.find(e => e.t === 'hit' || e.t === 'leap' || e.t === 'dash' || e.t === 'barrage' || e.t === 'counter');
  if (atk) {
    if (has(K.drain)) atk.ls = r2(0.15 + tier * 0.04);
    if (has(K.execute)) atk.exec = { th: 0.3, m: r2(1.6 + tier * 0.2) };
    if (has(K.crit)) atk.critAdd = r2(0.25 + tier * 0.05);
    if (has(K.pull) && !atk.pull) atk.pull = 30;
    const roll = r();
    if (roll < 0.18 && el) atk.vs = { status: el === 'fire' ? 'freeze' : el === 'ice' ? 'burn' : el === 'thunder' ? 'freeze' : 'stun', m: 1.6, consume: 1 };
    else if (roll < 0.3) atk.mark = 1;          // applies mark consumed by other skills
    else if (roll < 0.42) atk.consumeMark = r2(0.8 + tier * 0.2);
    else if (roll < 0.5) atk.resetOnKill = 1;
    else if (roll < 0.6) atk.link = r2(0.3);    // reduces other skill cooldowns
  }
  if (ult) { sk.cd = Math.max(sk.cd, 30000 + tier * 4000); sk.ult = 1; }
  if (myth) sk.cd = Math.round(sk.cd * 0.9);
  sk.kind = kind;
  sk.cd = Math.round(sk.cd);
  return sk;
}
