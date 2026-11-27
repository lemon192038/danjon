// 時律投刃士 (Chrono Blade Thrower): job-exclusive silver knives, five-step throwing combo, rapid / pierce / timelag styles,
// combo multiplier, 0.7s hit-count multiplier, per-enemy time marks, time collapse, time stop with unlimited knife placement.
// All numbers below are the directive's values; the server (server/game/chrono.js) is authoritative.
export const CHRONO_JOB = 'ev_chrono';
export const KNIFE_ID = 'job_silverknife';
export const SILVER_KNIFE = { id: KNIFE_ID, name: '銀の投げナイフ', wt: 9, idx: 0, rar: 3, lvl: 1, atk: 42, crit: 0.08, spd: 1.1, el: null, stats: { dex: 4, agi: 3 }, traits: [], jobOnly: CHRONO_JOB,
  acq: { src: 'job', minFloor: 1, diff: 'EASY' }, price: 0, desc: '時律投刃士だけが扱える銀の投げナイフ。時間操作の淡い青白い光を宿す',
  skill: { id: 'chr_collapse', name: '時刻崩壊', src: 'job', kind: 'chrono', eff: [{ t: 'chrono', c: 'collapse' }], cost: 0, cd: 1000, cast: 0, note: '時刻崩壊ゲージ100で発動（6秒）' } };
// five-step combo 銀刃連舞: knives (n), spread, forward movement (lg) per step
export const COMBO = [
  { name: 'シングルスロー', n: 1, sp: 0, lg: 6, m: 0.55, t: [70, 40, 110] },
  { name: 'ツインスロー', n: 2, sp: 8, lg: 8, m: 0.5, t: [70, 40, 110] },
  { name: 'クロスエッジ', n: 3, sp: 14, lg: 8, m: 0.48, t: [80, 50, 120] },
  { name: 'ミラージュスラッシュ', n: 2, sp: 6, lg: 46, m: 0.6, t: [90, 60, 140], mirage: 1 },
  { name: 'シルバーレイン', n: 8, sp: 45, lg: 0, m: 0.42, t: [120, 60, 220], ring: 1, finisher: 1 },
];
export const STYLES = { rapid: { name: 'ラピッド', aspd: 0.25, dmg: 0.9, pierce: 0 }, pierce: { name: 'ピアス', aspd: -0.1, dmg: 1.35, pierce: 2 }, timelag: { name: 'タイムラグ', aspd: 0, dmg: 1.0, pierce: 0 } };
export const COMBO_MUL = [[51, 2.1], [31, 1.85], [21, 1.6], [11, 1.35], [6, 1.15], [1, 1.0]];
export const HIT_MUL = [1.0, 1.0, 1.1, 1.2, 1.35, 1.5, 1.7, 1.9, 2.1, 2.3]; // index = hits in the last 0.7s (9+ → 2.3)
export const GAUGE = { normal: 2, skill: 8, parry: 12, finisher: 10, weak: 5 };
export const MARK = { knife: 4, pierce: 6, skill: 10 };
export const SKILLS = [
  { id: 'chr_misdirection', name: 'ミスディレクション', src: 'job', job: CHRONO_JOB, kind: 'chrono', eff: [{ t: 'chrono', c: 'misdirect', m: 0.7 }], cost: 14, cd: 6000, cast: 0, note: '短距離を移動し、経路に最大5本のナイフ。側面+10%・背面+20%' },
  { id: 'chr_square', name: 'プライベートスクウェア', src: 'job', job: CHRONO_JOB, kind: 'chrono', eff: [{ t: 'chrono', c: 'square' }], cost: 30, cd: 20000, cast: 0, note: '半径8mの時間停止領域（3秒）。通常の敵と敵の飛び道具は停止、ボスは約20%の速度に' },
  { id: 'chr_lunaclock', name: 'ルナクロック', src: 'job', job: CHRONO_JOB, kind: 'chrono', eff: [{ t: 'chrono', c: 'clock', m: 0.5 }], cost: 24, cd: 16000, cast: 0, note: '時計3つ（8秒・射程12m）。各時計が1秒ごとに自動でナイフを放つ。3つが同じ敵に当たると時間共鳴' },
  { id: 'chr_doll', name: '殺人ドール', src: 'job', job: CHRONO_JOB, kind: 'chrono', eff: [{ t: 'chrono', c: 'doll', m: 0.32 }], cost: 40, cd: 24000, cast: 0, note: '最大40本のナイフを召喚し、射程18mの敵へ時間差で追尾させる。ロックオン対象を優先' },
];
export const M = 16; // pixels per metre (1 tile = 1 m)
