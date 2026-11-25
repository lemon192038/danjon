# ABYSS 現行アーキテクチャ（PHASE 0 調査結果）

調査日：2026-11-24 ／ ブランチ `claude/dazzling-galileo-mxibj0` ／ 本番：Render `abyss-eternal-frontier`（Web Service, Node 22）＋ Supabase（`aef_` テーブル）

## 1. 全体構成

| 層 | 技術 | 主なファイル |
|---|---|---|
| フロントエンド | Vanilla JS（ESモジュール）、Canvas（低解像度ピクセル層＋高解像度オーバーレイ）、DOM UI | `client/index.html`, `client/js/*.js`, `client/css/style.css` |
| バックエンド | Node 22, Express 4（REST）, ws 8（WebSocket）。権威サーバー 20Hz | `server/index.js`, `server/game/*.js` |
| データ生成 | データ駆動ジェネレータ → `shared/gen/`（gitignore。デプロイ時と起動前に生成） | `tools/build-data.mjs`, `tools/gen/*.mjs`, `tools/validate-data.mjs` |
| 共有データ | サーバー・クライアント共通の定義 | `shared/constants.js`, `shared/data/*.js` |
| 永続化 | Supabase PostgREST（service key）／ファイル（開発・フォールバック）。メモリキャッシュ＋2秒毎の書き戻し | `server/store.js` |
| テスト | `npm test` = データ検証 + node:test 5スイート（combat, world, walls, city, slum）＋ Playwright e2e（開発時） | `test/*.test.mjs` |

## 2. 認証・オンライン通信

- `/api/register` `/api/login`：アカウント（scrypt ハッシュ）→ トークン。`/ws` でトークン認証後、キャラクター選択（1アカウント4キャラ）
- クライアント → サーバー：入力（移動・攻撃・照準・自動照準フラグ）、スキル、回避、対話、メニュー操作（`menu` op）
- サーバー → クライアント：スナップショット `s`（20Hz、既知エンティティ差分＋fx キュー）、`zone`、`self`、`open`（各種画面）、`note`/`toast`
- クライアント予測＋ソフト補正。重要処理（ダメージ・ドロップ・報酬・職業解放・価格）はすべてサーバー側で決定

## 3. 永続データ

| データ | 保存先 | 内容 |
|---|---|---|
| アカウント | `aef_accounts` | id, ハッシュ, キャラ一覧 |
| キャラクター | `aef_chars`（JSON） | レベル・ステータス・装備・所持品・武器熟練度（武器種別）・職業（職業別熟練度）・スキルスロット・クエスト・称号・図鑑・ダンジョン到達・ギルド・評判・家・店・銀行・スラム探索記録・隠れ家・チュートリアル |
| 世界状態 | `aef_world`（id=main） | 冒険者NPC 48名、経済（都市情勢・交易・ニュース・物語の結末）、闇市相場（地域別需給・履歴・勢力影響力） |

同一 Supabase プロジェクトには別アプリのテーブル（users, sessions, saves, world_state）が存在する。**ABYSS は `aef_` テーブルのみ使用し、他は触らない。**

## 4. ゲームシステム一覧（実装済み）

| システム | 状態 | 主なファイル | 備考 |
|---|---|---|---|
| 武器種 86 | 完成 | `shared/data/weaponTypes.js` | コンボDSL・固有アクション（78種）・回避種別・属性傾向 |
| 武器 8,600 | 完成 | `tools/gen/weapons.mjs` | 31シグネチャ・25特性・入手条件・固有スキル |
| スキル 18,236 | 完成 | `tools/gen/skills.mjs`, `server/game/skillExec.js` | 武器種スキル 8,600＋武器固有 8,600＋職業 1,000＋レベル 36。4カテゴリ・4スロット |
| 職業 1,000 | 完成 | `tools/gen/jobs.mjs` | 40系統×25系譜、6ランク、解放条件、パッシブ・アクティブ |
| 戦闘 | 完成 | `actor.js`, `combat.js`, `specials.js` | コンボ・回避・ガード・パリィ・カウンター・状態異常・属性・自動照準 |
| モンスター | 完成 | `monsters.js`, `content.mjs` | 36系統（スラム系含む）、16ボス、精鋭・接辞、BFS経路探索＋視線判定 |
| ダンジョン | 完成 | `maps.js`, `zone.js` | 12ダンジョン×100階、EASY/NORMAL/HARD/HELL/ABYSS、ABYSS呪い |
| 冒険者NPC | 完成 | `npc.js` | 48名、自律行動・パーティー参加・絆・行動ログ |
| 都市 | 完成（38都市：既存6＋6大陸32） | `shared/data/cities.js`, `city.js` | 区画・ランドマーク・123の入れる建物・内部マップ |
| 市民生活 | 完成 | `life.js` | 時計（1ゲーム分=2秒）・天候・勤務/帰宅スケジュール・LOD |
| ギルド 60 | 完成 | `shared/data/guilds.js`, `guildsys.js` | 加入条件・ランク・依頼・ショップ・評判・関係 |
| 経済 | 完成 | `econ.js` | 交易品・物流・交通・不動産・家・自分の店・銀行・カジノ・闘技場・闇市・採集・製作・依頼 |
| 都市の物語 | 完成（5本） | `stories.js` | 選択で都市状態が世界規模に変化（最初の選択者が決定） |
| スラム探索 | 完成 | `slum.js`, `slumgen.js`, `market.js`, `hideout.js` | 6地域・4層・シード生成・脱出・闇市相場・出所・洗浄・隠れ家 |
| イベント基盤 | 完成（PHASE 1） | `events.js`, `shared/data/events.js`, `client/js/uievents.js` | 71イベント登録、世界/個人状態、冪等報酬、記録画面 |
| UI | 完成 | `ui.js`, `uicity.js`, `uislum.js`, `input.js` | PC＋タッチ（仮想スティック・円弧ボタン）、iPad 検証済み、チュートリアル |

## 5. 未実装（今回の指示書との差分の要約）

- ~~汎用イベントエンジン~~ → PHASE 1 で実装済み（server/game/events.js）
- ~~6大陸の世界地図・都市・フィールド、季節・気温~~ → PHASE 2 で実装済み。隠し領域 → PHASE 9、生活インフラ・税 → 後続
- グレイヴェルと七つの裏社会組織、組織のログアウト中シミュレーション → PHASE 3
- 強攻撃、武器個別の製作レシピ、武器の個体履歴 → PHASE 4
- 固有名職業（異端者・大罪系など）→ PHASE 5 / 8
- 決闘システム、学習型ボスAI、水中システム → PHASE 6〜7
- モンスター生態系 → PHASE 6 以降

## 6. 開発用ツール

- `DEV_START_GOLD`（開発時の初期所持金）、`DEV_TOOLS=1`（e2e 用の移動ヘルパー。本番では無効）
- `tools/docs/gen-db-docs.mjs`：武器・職業・イベントDBのドキュメントを実データから生成
- `/api/stats`, `/healthz`
