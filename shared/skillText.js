// Human-readable Japanese descriptions generated from the unified effect schema (no hand-written per-skill text).
import { ELEMENT_NAMES, STATUS, STAT_NAMES } from './constants.js';
const pct = v => Math.round(v * 100) + '%';
const SHAPE = sh => {
  if (!sh) return '';
  switch (sh.s) {
    case 'arc': return `前方${sh.a}°扇状(半径${sh.r})`;
    case 'circle': return `周囲円形(半径${sh.r})`;
    case 'thrust': return `前方直線(長さ${sh.l})`;
    case 'beam': return `光線(長さ${sh.l}${sh.rot ? '・十字' : ''})`;
    case 'slam': return `前方叩きつけ(半径${sh.r})`;
    case 'whip': return `鞭状(射程${sh.l})`;
    case 'chain': return `鎖射出(射程${sh.l})`;
    case 'proj': return `${sh.n > 1 ? sh.n + '発の' : ''}${sh.wave ? '衝撃波' : '飛翔体'}(射程${sh.rng}${sh.pierce ? `・貫通${sh.pierce >= 9 ? '∞' : sh.pierce}` : ''}${sh.hom ? '・追尾' : ''}${sh.chain ? `・連鎖${sh.chain}` : ''}${sh.aoe ? '・爆発' : ''}${sh.ret ? '・帰還' : ''})`;
  }
  return '';
};
export const MOD_NAMES = { atk: '攻撃力', dr: '被ダメ軽減', hp: '最大HP', sp: '最大SP', crit: '会心率', critDmg: '会心威力', aspd: '攻撃速度', move: '移動速度', cdr: 'CD短縮', ls: '吸命', regen: 'HP自然回復/秒', spRegen: 'SP回復', thorns: '反射ダメージ', killHeal: '撃破時回復', execDmg: '止め威力', firstStrike: '先制威力', finisher: 'コンボ締め威力', lowHpAtk: '瀕死時攻撃', fullHpAtk: '万全時攻撃', iframe: '回避無敵(ms)', range: '攻撃範囲', stagger: '怯み値', pen: '防御貫通', drop: 'ドロップ率', xp: '経験値', masteryXp: '熟練度', healPower: '回復量', summonPower: '召喚体強化', statusChance: '状態異常率', statusDur: '状態異常時間', spellDmg: '魔法威力', counterDmg: 'カウンター威力', guardDr: 'ガード性能', dodge: '回避率', backstab: '背後攻撃', projSpd: '弾速', potion: '薬効', gold: '獲得ゴールド', elemAll: '全属性威力', enchantPower: '付与効果', curseAmp: '呪い増幅', zonePower: '領域強化', auraAtk: '周囲味方攻撃', partyAtk: 'PT攻撃', raiseOnKill: '撃破時骸骨召喚', onHitMagic: '命中時魔力追撃', spOnHit: '命中時SP回復', kb: 'ノックバック', leapDmg: '跳躍威力', cloneOnDodge: '回避時分身', revive: '自動蘇生', all: '全ステータス', chargeSpd: '溜め速度', mastery: '熟練補正', nextHit: '次の一撃威力', kbImmune: 'のけぞり無効', reflect: '反射', stealth: '隠密', spCost: 'SP消費軽減', spDrain: 'SP消費/秒', def: '防御力' };
export function modsText(mods) {
  const out = [];
  for (const [k, v] of Object.entries(mods || {})) {
    if (k === 'elemDmg') { for (const [e, x] of Object.entries(v)) out.push(`${ELEMENT_NAMES[e]}威力+${pct(x)}`); continue; }
    if (k === 'onHitStatus') { out.push(`命中時${STATUS[v[0]]?.name || v[0]}付与(${pct(v[1])})`); continue; }
    const n = MOD_NAMES[k] || k;
    if (k === 'iframe') out.push(`${n}+${v}`); else if (['kbImmune', 'stealth', 'revive'].includes(k)) out.push(n);
    else if (k === 'regen') out.push(`${n}${pct(v)}`); else if (k === 'spRegen' || k === 'spOnHit' || k === 'spDrain') out.push(`${n}+${v}`);
    else out.push(`${n}${v >= 0 ? '+' : ''}${pct(v)}`);
  }
  return out.join(' / ');
}
const stTxt = s => s ? `${STATUS[s[0]]?.name || s[0]}付与(${pct(s[1])})` : '';
export function effText(e) {
  const parts = [];
  const el = e.el && e.el !== 'auto' ? ELEMENT_NAMES[e.el] + '属性 ' : e.el === 'auto' ? '武器属性 ' : '';
  switch (e.t) {
    case 'hit': parts.push(`${SHAPE(e.shape)}に${el}威力${pct(e.m)}${e.h > 1 ? `×${e.h}回` : ''}`); break;
    case 'dash': parts.push(`${e.back ? '後方' : '前方'}へ${e.d}移動${e.inv ? `(無敵${e.inv}ms)` : ''}${e.hit ? `し通過した敵に威力${pct(e.m)}` : ''}`); break;
    case 'blink': parts.push(e.toTarget ? `敵の${e.back ? '背後' : '眼前'}へ瞬間移動` : `${e.d}先へ瞬間移動`); break;
    case 'buff': parts.push(`自身強化: ${modsText(e.mods)} (${e.dur / 1000}秒)`); break;
    case 'counter': parts.push(`${e.win}msの反撃態勢、被弾時に無効化し威力${pct(e.m)}で反撃${e.reflect ? '・飛び道具反射' : ''}`); break;
    case 'shield': parts.push(`最大HPの${pct(e.amt)}のシールド(${e.dur / 1000}秒)`); break;
    case 'heal': parts.push(`${e.r ? `半径${e.r}の味方の` : ''}HPを${pct(e.amt)}回復`); break;
    case 'cleanse': parts.push('味方の状態異常を解除'); break;
    case 'zone': parts.push(`${e.at === 'self' ? '足元' : '指定地点'}に${e.trigger ? '罠' : e.ally ? '加護領域' : '領域'}(半径${e.r}・${e.dur / 1000}秒)${e.m ? ` ${el}威力${pct(e.m)}${e.trigger ? '' : '/' + (e.tick / 1000) + '秒'}` : ''}${e.pull ? '・吸引' : ''}${e.heal ? `・回復${pct(e.heal)}/秒` : ''}${e.slow ? '・鈍足' : ''}${e.strike ? '・落雷' : ''}${e.mark ? '・印付与' : ''}${e.blockProj ? '・飛び道具遮断' : ''}`); break;
    case 'aura': parts.push(`半径${e.r}の味方に${modsText(e.mods || {})}${e.burnAura ? '炎のオーラ' : ''}(${e.dur / 1000}秒)`); break;
    case 'barrage': parts.push(`${e.n}発の降り注ぐ攻撃(半径${e.r}) ${el}威力${pct(e.m)}`); break;
    case 'cmd': parts.push({ volley: `近い順に最大${e.max}体の人形が各自の標的へ光線（威力${Math.round(e.m * 100)}%）。発射まで人形は静止`, formation: `人形が主の周囲に布陣し被ダメージ-${Math.round(e.dr * 100)}%（${e.dur / 1000}秒・人形は攻撃停止）`, swap: '最も遠い人形と位置を入れ替え、人形が挑発＋障壁', chain: `人形が順に最大${e.max}連撃（威力${Math.round(e.m * 100)}%）。外れると連鎖終了`, reform: `人形の換装（近接⇔遠隔）と攻撃速度+40%（${(e.dur || 8000) / 1000}秒）`, slam: `大傀儡が半径${e.r}を叩き割る（威力${Math.round(e.m * 100)}%）`, coreBurst: `蓄積した魔力核を解放（半径${e.r}・1段ごと威力+25%）`, orbitStorm: `浮遊刃が${e.n}方向から連続斬撃（各${Math.round(e.m * 100)}%）` }[e.c] || '指揮'); break;
    case 'summon': parts.push(`${{ clone: '分身', familiar: '使い魔', golem: 'ゴーレム', spirit: '精霊', turret: '自動砲台', skeleton: '骸骨兵', beast: '魔獣', puppet: '人形', tome: '魔導書' }[e.kind] || e.kind}を${e.n || 1}体召喚(${e.dur / 1000}秒)`); break;
    case 'enchant': parts.push(`武器に${e.el === 'cycle' ? '循環属性' : e.el === 'best' ? '弱点属性' : ELEMENT_NAMES[e.el] + '属性'}を付与 威力+${pct(e.m)}(${e.dur / 1000}秒)`); break;
    case 'leap': parts.push(`跳躍し着地点(半径${e.r})に威力${pct(e.m)}${e.launch ? '・打ち上げ' : ''}`); break;
    case 'taunt': parts.push(`半径${e.r}の敵を挑発(${e.dur / 1000}秒)`); break;
    case 'passive': parts.push(`常時: ${modsText(e.mods)}`); break;
  }
  const r = [];
  if (e.status) r.push(stTxt(e.status));
  if (e.ls) r.push(`吸命${pct(e.ls)}`); if (e.exec) r.push(`HP${pct(e.exec.th)}以下の敵に${pct(e.exec.m)}`); if (e.critAdd) r.push(`会心率+${pct(e.critAdd)}`);
  if (e.pen) r.push(`防御貫通${pct(e.pen)}`); if (e.vs) r.push(`${STATUS[e.vs.status]?.name}状態の敵に${pct(e.vs.m)}${e.vs.consume ? '(消費)' : ''}`);
  if (e.mark) r.push('印を刻む'); if (e.consumeMark) r.push(`印を破裂させ+${pct(e.consumeMark)}`); if (e.resetOnKill) r.push('撃破でCDリセット'); if (e.link) r.push('命中で他スキルCD短縮');
  if (e.pull) r.push('引き寄せ'); if (e.kb) r.push('吹き飛ばし'); if (e.launch && e.t !== 'leap') r.push('打ち上げ'); if (e.strip) r.push('強化解除'); if (e.echo) r.push(`${e.echoN || 1}回の残響`); if (e.goldScale) r.push('所持金で威力上昇');
  if (e.delay) parts.unshift(`${e.delay}ms後:`);
  return parts.join('') + (r.length ? ` [${r.join('・')}]` : '');
}
export function describeSkill(sk) { return sk.eff.map(effText).join(' → '); }
export const SRC_NAMES = { wtype: '武器種スキル', weapon: '武器固有スキル', level: 'レベルスキル', job: '職業スキル' };
export const ACQ_NAMES = { shop: 'ショップ', drop: 'モンスタードロップ', chest: '宝箱', boss: 'ボス報酬', quest: 'クエスト報酬', abyssBoss: 'ABYSSボス', godEvent: '神々のイベント', specialQuest: '特別クエスト', hiddenEvent: '隠しイベント', specialBoss: '特殊ボス討伐' };
const EVENT_NAMES = { lib_forbidden: '禁書庫（異端書を読み通す）', lib_sins: '七つの大罪（最終試練）', ev_swordmaster: '放浪する最強の剣士', ev_thousand_spells: '失われた千の魔法', ev_blackmoon: '黒月の夜', ev_masquerade: '仮面の武闘祭', sl_blackforge: '黒炉の鍛冶師', lg_deus_machina: '神機降臨' };
const FLAG_NAMES = { machinist: 'イベント「地下に眠る巨大施設」で神機文明の施設に触れる' };
const SIN_NAMES = { greed: '強欲', gluttony: '暴食', envy: '嫉妬', sloth: '怠惰', pride: '傲慢', wrath: '憤怒', lust: '色欲' };
export function unlockText(u, dungeons) {
  const r = [];
  if (u.level > 1) r.push(`Lv${u.level}以上`); if (u.job) r.push(`前提職熟練度${u.prof}`); if (u.kills) r.push(`累計撃破${u.kills}体`);
  if (u.clear) r.push(`${dungeons?.[u.clear.dungeon]?.name || u.clear.dungeon} ${u.clear.floor}階踏破`); if (u.boss) r.push(`${u.boss.diff}以上のボス${u.boss.count}体撃破`); if (u.abyss) r.push(`ABYSS ${u.abyss}階到達`);
  if (u.event) r.push(`イベント「${EVENT_NAMES[u.event] || u.event}」達成`); if (u.flag) r.push(FLAG_NAMES[u.flag] || `条件「${u.flag}」`); if (u.sin) r.push(`主ルート「${SIN_NAMES[u.sin]}」を選択`); if (u.bishop) r.push('大罪司教は1キャラクター1系統（継承決闘でも就任可）');
  if (u.hidden) r.push(u.hidden.abyssFloor ? `【隠し】ABYSS${u.hidden.abyssFloor}階到達` : u.hidden.npcBond ? `【隠し】NPC冒険者との絆${u.hidden.npcBond}以上` : `【隠し】秘宝の入手`);
  return r.length ? r.join(' / ') : '初期解放';
}
export { STAT_NAMES };
