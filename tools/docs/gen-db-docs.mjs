// Generates docs/ABYSS_WEAPON_DATABASE.md and docs/ABYSS_CLASS_DATABASE.md from the real game data
// (shared/data + shared/gen), so the docs never drift from what the server actually uses.
import fs from 'node:fs';
import { WEAPON_TYPES, WEAPON_CATEGORIES, STARTER_WEAPON_TYPES } from '../../shared/data/weaponTypes.js';
const gen = p => JSON.parse(fs.readFileSync(new URL('../../shared/gen/' + p, import.meta.url)));
const jobs = gen('jobs.json');
const catOf = id => WEAPON_CATEGORIES.find(c => id >= c.range[0] && id <= c.range[1]);
const DODGE = { roll: '回転回避', step: 'ステップ', backflip: 'バク転', blink: '短距離転移', dash: 'ダッシュ', guard: 'ガード', parry: 'パリィ' };
let w = `# ABYSS 武器データベース\n\n> 自動生成：\`node tools/docs/gen-db-docs.mjs\`（データ元：shared/data/weaponTypes.js, shared/gen/types/*.json）。手で編集しないこと。\n\n`;
w += `## 概要\n\n- 正式武器種：**${WEAPON_TYPES.length}種**（固定。統合・削除・改名禁止）\n- キャラクター作成時に選択可能：${STARTER_WEAPON_TYPES.length}種（77〜86の神話・超常系は不可）\n- 武器：各武器種100本 × ${WEAPON_TYPES.length} = **${WEAPON_TYPES.length * 100}本**（全て固有ID・性能・特性・入手方法・固有スキル付き）\n- 武器種スキル：各武器種100（熟練度1〜100で順に習得）\n- 弓（44）とクロスボウ（45「クロスボウ（弩）」）は別武器種。「弩」はクロスボウの別名として45に統合済み（正式リスト通り）\n\n`;
w += `## 武器の共通データ項目（実装済み）\n\n| 項目 | 実装 |\n|---|---|\n| 固有ID | \`<武器種>_<001-100>\` |\n| 名称 | 企画資料の武器名リスト（data/source/weapon_names.md） |\n| レアリティ | 1〜6（神話系は4〜6） |\n| 基本性能 | 攻撃力・装備Lv・攻撃速度・会心・ステータス補正 |\n| 属性 | 武器種の属性傾向から決定 |\n| 特殊特性 | 25種の特性（貫通・吸血・会心強化など） |\n| 固有スキル | 武器1本ごとに1つ（31種の効果シグネチャ） |\n| 入手方法 | 店売り／ドロップ／宝箱／ボス／クエスト（階層・難易度条件付き） |\n| 強化 | +0〜+20（強化鉱石・ゴールド） |\n| 外観 | 武器種ごとのピクセルスプライト＋レアリティ色 |\n\n`;
w += `## 未実装・拡張予定（ロードマップ PHASE 4）\n\n- 強攻撃（現状は通常コンボ＋右クリックの固有アクション）\n- 武器ごとの製作素材・強化先（現状は共通の強化鉱石のみ）\n- 武器の個体履歴（イベント「名もなき武器」）\n- 熟練度による新コンボ・専用称号・上位武器条件・特殊試練\n- 武器固有スキルの質の見直し（自動生成のため、武器種と効果の組み合わせが不自然なものがある）\n\n`;
w += `## 86武器種一覧\n\n| ID | 武器種 | 系統 | 固有アクション | 回避 | 主属性 | コンボ段数 | 初期選択 |\n|---|---|---|---|---|---|---|---|\n`;
for (const t of WEAPON_TYPES) w += `| ${t.id} | ${t.name} | ${catOf(t.id)?.name} | ${t.special?.type || '-'} | ${DODGE[t.dodge] || t.dodge || '-'} | ${(t.elem || []).join('・') || '物理'} | ${t.combo.length} | ${t.myth ? '×' : '○'} |\n`;
w += `\n## 武器種ごとの武器内訳（レアリティ別本数・代表武器）\n\n| ID | 武器種 | R1 | R2 | R3 | R4 | R5 | R6 | 最上位武器 |\n|---|---|---|---|---|---|---|---|---|\n`;
for (const t of WEAPON_TYPES) { const d = gen(`types/${t.id}.json`); const c = [0, 0, 0, 0, 0, 0, 0]; for (const x of d.weapons) c[x.rar]++; const top = d.weapons.at(-1); w += `| ${t.id} | ${t.name} | ${c.slice(1).join(' | ')} | ${top.name}（Lv${top.lvl}） |\n`; }
fs.writeFileSync(new URL('../../docs/ABYSS_WEAPON_DATABASE.md', import.meta.url), w);
// ---- classes
const tiers = {}; for (const j of jobs) (tiers[j.tierName] ||= []).push(j);
const roles = {}; for (const j of jobs) (roles[j.role] ||= []).push(j);
let c = `# ABYSS 職業データベース\n\n> 自動生成：\`node tools/docs/gen-db-docs.mjs\`（データ元：shared/gen/jobs.json ← tools/gen/jobs.mjs）。手で編集しないこと。\n\n`;
c += `## 概要\n\n- 職業数：**${jobs.length}**（40系統 × 25系譜）\n- 武器種とは独立：どの職業でも86武器種すべてを装備可能。職業は「武器相性（best/good）」で補正するだけで、使用禁止はない\n- 1,000職 × 86武器種 = 86,000通りの組み合わせ\n- 各職業：固有パッシブ（ステータス補正mods）・固有アクティブスキル・ステータス補正・武器相性・属性・解放条件・上位職/派生職・熟練度上限\n- 職業熟練度はキャラクターごとに職業別で保存。転職しても武器熟練度は失われない\n\n`;
c += `## ランク別\n\n| ランク | 職数 | 代表的な解放条件 |\n|---|---|---|\n`;
for (const [k, v] of Object.entries(tiers)) { const u = v[Math.floor(v.length / 2)].unlock; c += `| ${k} | ${v.length} | ${Object.entries(u).map(([a, b]) => `${a}=${typeof b === 'object' ? JSON.stringify(b) : b}`).join('、')} |\n`; }
c += `\n## 解放条件の種類（実装済み）\n\nlevel（レベル）／job＋prof（前提職とその熟練度）／kills（討伐数）／clear（ダンジョン到達階）／boss（難易度別ボス討伐数）／abyss（ABYSS到達階）／hidden（隠し条件：深淵階層・NPC絆・特定アイテム）。サーバーの \`jobUnlockMet\` で検証。\n\n`;
c += `## 固有名職業（企画で指定済み・未実装）\n\n既存1,000職の名称は変更しない。以下は「イベント職業」として別レジストリで追加する案（ABYSS_CONFLICT_REPORT.md C-07 参照）。\n\n| 職業 | 解放イベント | 系統 |\n|---|---|---|\n| 異端者 | 禁書庫：異端書1冊読了 | 大罪系 |\n| 強欲／暴食／嫉妬／怠惰／傲慢／憤怒／色欲の罪人 | 異端者＋主ルート選択 | 大罪系 |\n| 大罪司教（7系統） | 罪人熟練度＋最終試練、または継承決闘 | 大罪系 |\n| 剣理の探究者 | 放浪する最強の剣士「無銘の極致」 | 剣士系 |\n| 原初魔導師 | 失われた千の魔法「第零魔法」 | 魔法系 |\n| 月影の観測者 | 黒月の夜 → 月の裏側 | 特殊系 |\n| 闘技王 | 仮面の武闘祭 → 素顔の王 | 戦士系 |\n| 黒炉鍛冶師 | 黒炉の鍛冶師（グラド・ベルン） | 生産系 |\n| 神機技師関連職 | 地下に眠る巨大施設／神機降臨 | 古代文明系 |\n| デウス・エクス・マギア | 神機降臨（詳細未確定） | 神話系 |\n\n`;
c += `## 系統別一覧（40系統）\n\n| 系統 | 基本職 | 職数 | 武器相性(best) | 最上位例 |\n|---|---|---|---|---|\n`;
for (const [k, v] of Object.entries(roles)) { const b = v.find(j => j.tier === 0); const top = v.reduce((a, x) => x.tier > a.tier ? x : a, v[0]); c += `| ${k} | ${b?.name} | ${v.length} | ${(b?.affinity?.best || []).join('・')} | ${top.name}（${top.tierName}） |\n`; }
c += `\n## 全職業一覧\n\n| ID | 職業 | ランク | 固有パッシブ | 固有アクティブ | 解放条件 |\n|---|---|---|---|---|---|\n`;
for (const j of jobs) c += `| ${j.id} | ${j.name} | ${j.tierName} | ${j.passive?.name || '-'} | ${j.active?.name || '-'} | ${Object.entries(j.unlock).map(([a, b]) => `${a}:${typeof b === 'object' ? JSON.stringify(b).replace(/"/g, '') : b}`).join(' ')} |\n`;
fs.writeFileSync(new URL('../../docs/ABYSS_CLASS_DATABASE.md', import.meta.url), c);
console.log('docs written', w.length, c.length);
// ---- events
const { EVENTS, EVENT_KINDS, EVENT_GROUPS } = await import('../../shared/data/events.js');
const { PLACE } = await import('../../shared/data/world.js');
const pl = ids => ids.map(i => PLACE[i]?.name || i).join('・');
const ST = { planned: '未実装', partial: '一部実装', live: '実装済み' };
let e = `# ABYSS イベントデータベース\n\n> 自動生成：\`node tools/docs/gen-db-docs.mjs\`（データ元：shared/data/events.js）。イベントの追加・変更は events.js を編集すること。\n\n`;
e += `## 共通仕様\n\n- 各イベントは ID・名称・分類・発生地域・発生条件・前提イベント・進行段階・結末・報酬・解放要素・関連イベント・再挑戦条件・共有範囲を持つ\n- 共有範囲：world（世界共有：組織支配率・都市経済・世界イベント発生）／personal（個人：会話履歴・個人進行・報酬取得）／both（両方）\n- 状態はサーバーの EventEngine が管理し、報酬は (キャラクター, イベント, 報酬キー) 単位で一度だけ付与（二重付与防止）\n- detail=outline のイベントは指示書で詳細未確定。過剰な設定を加えず、拡張可能な枠として登録している\n\n`;
const cnt = {}; for (const x of EVENTS) cnt[x.status] = (cnt[x.status] || 0) + 1;
e += `## 集計\n\n総数 **${EVENTS.length}** ／ ${Object.entries(cnt).map(([k, v]) => `${ST[k]} ${v}`).join(' ／ ')}\n\n`;
for (const [g, gname] of Object.entries(EVENT_GROUPS)) {
  const list = EVENTS.filter(x => x.group === g); if (!list.length) continue;
  e += `## ${gname}（${list.length}）\n\n| ID | 名称 | 分類 | 地域 | 共有 | 状態 | 詳細度 |\n|---|---|---|---|---|---|---|\n`;
  for (const x of list) e += `| ${x.id} | ${x.name}${x.en ? `<br><small>${x.en}</small>` : ''} | ${x.kinds.map(k => EVENT_KINDS[k]).join('・')} | ${pl(x.loc)} | ${x.scope} | ${ST[x.status]} | ${x.detail} |\n`;
  e += '\n';
  for (const x of list.filter(x => x.detail === 'spec' || x.stages.length)) {
    e += `### ${x.name}（${x.id}）\n\n`;
    if (x.trigger) e += `- 発生条件：${x.trigger}\n`; if (x.prereq.length) e += `- 前提：${x.prereq.join(', ')}\n`;
    if (x.stages.length) e += `- 進行段階：${x.stages.map((s, i) => `${i + 1}. ${s}`).join(' → ')}\n`; if (x.outcomes.length) e += `- 結末：${x.outcomes.join(' ／ ')}\n`;
    if (x.rewards.length) e += `- 報酬：${x.rewards.join('、')}\n`; if (x.unlocks.length) e += `- 解放：${x.unlocks.join('、')}\n`;
    if (x.links.length) e += `- 関連：${x.links.join(', ')}\n`; e += `- 再挑戦：${{ none: 'なし（一度きり）', daily: '日替わり', cycle: '世界状態で再発生', rechallenge: '再挑戦可' }[x.repeat]}\n`; if (x.notes) e += `- 備考：${x.notes}\n`; e += '\n';
  }
}
e += `## 関連グラフ（イベント → 関連イベント）\n\n\`\`\`\n${EVENTS.filter(x => x.links.length).map(x => `${x.id} -> ${x.links.join(', ')}`).join('\n')}\n\`\`\`\n`;
fs.writeFileSync(new URL('../../docs/ABYSS_EVENT_DATABASE.md', import.meta.url), e);
console.log('events doc', e.length);
