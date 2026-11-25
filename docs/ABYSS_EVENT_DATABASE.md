# ABYSS イベントデータベース

> 自動生成：`node tools/docs/gen-db-docs.mjs`（データ元：shared/data/events.js）。イベントの追加・変更は events.js を編集すること。

## 共通仕様

- 各イベントは ID・名称・分類・発生地域・発生条件・前提イベント・進行段階・結末・報酬・解放要素・関連イベント・再挑戦条件・共有範囲を持つ
- 共有範囲：world（世界共有：組織支配率・都市経済・世界イベント発生）／personal（個人：会話履歴・個人進行・報酬取得）／both（両方）
- 状態はサーバーの EventEngine が管理し、報酬は (キャラクター, イベント, 報酬キー) 単位で一度だけ付与（二重付与防止）
- detail=outline のイベントは指示書で詳細未確定。過剰な設定を加えず、拡張可能な枠として登録している

## 集計

総数 **71** ／ 実装済み 13 ／ 未実装 58

## 大型イベント（8章）（6）

| ID | 名称 | 分類 | 地域 | 共有 | 状態 | 詳細度 |
|---|---|---|---|---|---|---|
| ev_swordmaster | 放浪する最強の剣士<br><small>THE WANDERING SWORDMASTER</small> | NPC遭遇・世界規模・隠し・称号・職業解放 | 中央大陸エルディア・北方大陸ノルディア・東方大陸シェンガル・南方大陸サハリア・西方大陸ヴァルグラン・外洋諸島アステリア | both | 実装済み | spec |
| ev_sunken | 沈没した王国<br><small>THE SUNKEN KINGDOM</small> | 地域・ダンジョン・称号 | 外洋諸島アステリア・アトランティス：沈没王国 | both | 未実装 | spec |
| ev_blackmoon | 黒月の夜<br><small>NIGHT OF THE BLACK MOON</small> | 世界規模・条件発生型・隠し・職業解放・称号 | 世界各地・月面領域ルナ・ヴェイル | both | 未実装 | spec |
| ev_thousand_spells | 失われた千の魔法<br><small>THE LOST THOUSAND SPELLS</small> | 常設・職業解放・称号 | 世界各地 | personal | 未実装 | spec |
| ev_calamity | 眠れる災厄<br><small>THE SLEEPING CALAMITY</small> | 世界規模・地域・条件発生型 | 西方大陸ヴァルグラン・外洋諸島アステリア・東方大陸シェンガル・南方大陸サハリア | both | 未実装 | spec |
| ev_masquerade | 仮面の武闘祭<br><small>THE MASQUERADE TOURNAMENT</small> | 都市・時間限定・職業解放・称号 | 王都アルセリア・スラム・グレイヴェル | both | 実装済み | spec |

### 放浪する最強の剣士（ev_swordmaster）

- 発生条件：NPCレイヴァン・クロイツが街道・山道・森林・荒野・遺跡・ダンジョン入口を巡回。遭遇して決闘を申請すると開始
- 進行段階：1. 遭遇 → 2. 決闘申請 → 3. 決闘（学習AI） → 4. 複数武器種で勝利を重ねる → 5. 隠し試練「無銘の極致」 → 6. 真の能力との再戦
- 結末：勝利 ／ 敗北（何度でも再戦可）
- 報酬：称号「剣聖に認められし者」、称号「無銘を超えし者」、特殊剣技、「無銘・天断」のレプリカ（オリジナルは入手不可）
- 解放：職業「剣理の探究者」の解放条件
- 関連：ev_masquerade, ct_duelist, lg_undefeated
- 再挑戦：再挑戦可
- 備考：世界各地を巡回（約1時間ごとに移動）。決闘AIは相手の過去の戦い方を記録して戦術を変える（入力の先読みはしない）。3つの武器種で勝つと隠し試練「無銘の極致」

### 沈没した王国（ev_sunken）

- 発生条件：海底の石畳・巨大な門・古代文字・不自然な光・海底の鐘のいずれかを発見
- 進行段階：1. 手がかり発見 → 2. 浅瀬探索（通常装備可） → 3. 沈没港 → 4. 市民街 → 5. 王立図書館 → 6. 水晶研究所 → 7. 王宮（深部：水中装備・呼吸魔法が必要） → 8. 深海神殿 → 9. 沈没王アトランティス戦 → 10. 結末選択
- 結末：王国再生 ／ 王国解放 ／ 王国継承
- 報酬：水中装備、古代魔法、水中都市へのアクセス、称号「沈没王国の発見者」
- 解放：アステリア海底地域
- 関連：ev_thousand_spells, ev_calamity
- 再挑戦：再挑戦可

### 黒月の夜（ev_blackmoon）

- 発生条件：周期固定ではなく世界状態で発生：地域の魔力蓄積・遺跡起動・ボス長期未討伐・天体イベント・黒月関連書籍の発見の累積
- 進行段階：1. 前兆（NPCが月を見上げる・魔物の変化・魔法の色・夜だけ見える建物・黒い羽根） → 2. 黒月の夜（世界イベント） → 3. 黒月の観測者と遭遇（複数回） → 4. 各地の観測装置を起動 → 5. 隠しイベント「月の裏側」 → 6. 月面転移門
- 結末：観測者撃退 ／ 月の裏側到達
- 報酬：黒月系魔法、武器「黒天月蝕」、称号「月の裏側を見た者」、黒月素材
- 解放：職業「月影の観測者」、ルナ・ヴェイル
- 関連：lg_last_observer, lg_other_side
- 再挑戦：世界状態で再発生

### 失われた千の魔法（ev_thousand_spells）

- 発生条件：世界各地で魔法断片を発見
- 進行段階：1. 断片の発見 → 2. 構造解析（属性・消費・発動条件・射程・範囲・持続・特殊効果） → 3. 再構築 → 4. 実験検証 → 5. 習得 → 6. 改良（範囲・速度・消費・持続・複合化／全性能同時最大化は不可） → 7. 最終研究「第零魔法：オリジン」
- 報酬：称号「千の魔法を識る者」、第零魔法、研究施設の拡張
- 解放：職業「原初魔導師」
- 関連：lib_forbidden, ct_academy
- 再挑戦：なし（一度きり）

### 眠れる災厄（ev_calamity）

- 発生条件：魔物がいない地域・巨大な足跡・遺跡の記録・魔物の逃走・採集物の異常反応
- 進行段階：1. 周辺魔物の行動変化 → 2. 地鳴り・異常気象 → 3. NPCからの報告 → 4. 特殊採集物・痕跡 → 5. 目覚め
- 結末：討伐 ／ 再び眠らせる ／ 生態調査 ／ 条件付き共存
- 報酬：災厄素材、伝説級武器レシピ、称号、生態記録、災厄の眷属、特殊装備
- 関連：lg_territory
- 再挑戦：世界状態で再発生
- 備考：焦土の眠龍（火山）・深海の巨鯨（海底）・森羅の巨獣（森林）・砂塵の巨神（砂漠）。討伐しても世界から永久には消えない

### 仮面の武闘祭（ev_masquerade）

- 発生条件：裏路地・酒場・秘密の案内人に接触
- 進行段階：1. 案内人に接触 → 2. 資格確認 → 3. 仮面受領 → 4. 登録 → 5. 予選 → 6. 本戦 → 7. 決勝 → 8. 仮面の王 → 9. （複数回優勝＋正体記録）素顔の王
- 結末：優勝 ／ 敗退
- 報酬：大会報酬、称号
- 解放：職業「闘技王」への道
- 関連：ev_swordmaster, sl_colosseum
- 再挑戦：世界状態で再発生
- 備考：参加者の名前・職業・称号は非表示、外観は統一、能力は均一化しない。不足時はNPC補充

## スラム起点（9章）（12）

| ID | 名称 | 分類 | 地域 | 共有 | 状態 | 詳細度 |
|---|---|---|---|---|---|---|
| sl_graymarket | 灰色市場<br><small>GRAY MARKET</small> | 常設・スラム | スラム・グレイヴェル | world | 実装済み | spec |
| sl_children | 消えた子供たち<br><small>THE MISSING CHILDREN</small> | スラム・条件発生型 | スラム・グレイヴェル | both | 未実装 | spec |
| sl_factions | 七つの裏社会<br><small>SEVEN UNDERWORLD FACTIONS</small> | 常設・スラム・世界規模 | スラム・グレイヴェル | world | 実装済み | spec |
| sl_facility | 地下に眠る巨大施設<br><small>THE BURIED FACILITY</small> | スラム・ダンジョン・隠し・職業解放 | スラム・グレイヴェル | both | 未実装 | spec |
| sl_plague | スラムの疫病<br><small>PLAGUE OF THE SLUMS</small> | スラム・条件発生型・世界規模 | スラム・グレイヴェル | world | 未実装 | spec |
| sl_false_hero | 偽りの英雄<br><small>THE FALSE HERO</small> | スラム・NPC遭遇 | スラム・グレイヴェル | both | 未実装 | spec |
| sl_auction | 闇の競売会<br><small>AUCTION OF SHADOWS</small> | スラム・時間限定 | スラム・グレイヴェル | both | 未実装 | spec |
| sl_colosseum | 無名の地下闘技場<br><small>THE HIDDEN COLOSSEUM</small> | スラム・常設・称号 | スラム・グレイヴェル | both | 未実装 | spec |
| sl_carriers | 死者の運び屋<br><small>THE CARRIERS OF THE DEAD</small> | スラム・隠し | スラム・グレイヴェル | both | 未実装 | spec |
| sl_capital_shadow | 王都の裏側<br><small>THE SHADOW OF THE CAPITAL</small> | スラム・都市・世界規模 | スラム・グレイヴェル・王都アルセリア | world | 未実装 | spec |
| sl_blackforge | 黒炉の鍛冶師<br><small>THE BLACKFORGE</small> | スラム・NPC遭遇・職業解放 | スラム・グレイヴェル | both | 未実装 | spec |
| sl_last_resident | 最後の住人<br><small>THE LAST RESIDENT</small> | スラム・NPC遭遇・隠し | スラム・グレイヴェル | both | 未実装 | spec |

### 灰色市場（sl_graymarket）

- 発生条件：常設（グレイヴェル闇市場）
- 進行段階：1. 入荷 → 2. 価格変動 → 3. 組織による市場支配
- 報酬：希少品の購入機会
- 関連：sl_auction, sl_factions
- 再挑戦：日替わり
- 備考：地域「グレイヴェル地下街」の闇市相場。供給・需要・在庫・組織の支配率で価格が動き、上下限で暴騰暴落を防ぐ

### 消えた子供たち（sl_children）

- 発生条件：スラムで子供の失踪の噂を聞く
- 進行段階：1. 調査 → 2. 証拠収集 → 3. 違法な魔力適性研究施設の発見 → 4. 救出 → 5. 関係者との対峙
- 結末：救出成功 ／ 一部救出
- 報酬：名声、無名の子供たちとの友好
- 関連：sl_factions
- 再挑戦：なし（一度きり）
- 備考：過度に残虐な表現は避け、物語と救出を中心にする

### 七つの裏社会（sl_factions）

- 発生条件：常設
- 進行段階：1. 勢力図 → 2. 抗争 → 3. 同盟 → 4. リーダー交代
- 関連：sl_graymarket, sl_false_hero, sl_capital_shadow
- 再挑戦：世界状態で再発生
- 備考：七組織の縄張り・資金・構成員・首領は世界共有でログアウト中も進行。拠点で仕事を受け、加入できる

### 地下に眠る巨大施設（sl_facility）

- 発生条件：グレイヴェル地下の探索で古代神機文明の痕跡を発見
- 進行段階：1. 発見 → 2. 演算装置の起動 → 3. 研究記録の回収
- 解放：神機技師関連職業
- 関連：lg_deus_machina, sl_last_resident
- 再挑戦：なし（一度きり）

### スラムの疫病（sl_plague）

- 発生条件：地下水汚染・魔力性菌類の蔓延（世界状態）
- 進行段階：1. 原因調査 → 2. サンプル収集 → 3. 研究 → 4. 浄化
- 結末：浄化 ／ 長期化
- 報酬：薬師ギルド評価
- 再挑戦：なし（一度きり）
- 備考：NPCの生活・商店・物流に影響

### 偽りの英雄（sl_false_hero）

- 発生条件：NPCアルベルト・ヴァイスの評判を聞く
- 進行段階：1. 接触 → 2. 調査
- 結末：正体を暴く ／ 協力する ／ 対立する ／ 決闘する
- 関連：sl_capital_shadow, sl_factions
- 再挑戦：なし（一度きり）
- 備考：選択でスラムの政治状況が変化（世界共有）

### 闇の競売会（sl_auction）

- 発生条件：招待状または情報屋
- 進行段階：1. 招待 → 2. 入札 → 3. 落札
- 報酬：希少品・古代遺物・特殊装備・情報
- 関連：sl_graymarket, ct_royal_auction
- 再挑戦：世界状態で再発生

### 無名の地下闘技場（sl_colosseum）

- 発生条件：常設
- 進行段階：1. 登録 → 2. 試合 → 3. ランキング → 4. 武器種別大会
- 報酬：報酬、称号
- 関連：ev_masquerade
- 再挑戦：日替わり

### 死者の運び屋（sl_carriers）

- 発生条件：夜間に遺体搬送の一団を目撃
- 進行段階：1. 追跡 → 2. 調査 → 3. 魂・記憶の再現研究の発覚
- 関連：lib_forbidden
- 再挑戦：なし（一度きり）

### 王都の裏側（sl_capital_shadow）

- 発生条件：貴族による搾取の証拠
- 進行段階：1. 証拠 → 2. 交渉 → 3. 決断
- 結末：自治権獲得 ／ 王都の管理強化 ／ 現状維持
- 関連：sl_false_hero, ct_succession
- 再挑戦：なし（一度きり）

### 黒炉の鍛冶師（sl_blackforge）

- 発生条件：NPCグラド・ベルン（ドワーフ鍛冶師）に会う
- 進行段階：1. 依頼 → 2. 特殊素材の収集 → 3. 武器改造 → 4. 特殊製作技術の伝授
- 解放：職業「黒炉鍛冶師」
- 関連：ct_hundred_arms, lg_unnamed_arms
- 再挑戦：なし（一度きり）

### 最後の住人（sl_last_resident）

- 発生条件：NPCエドガー（古代文明研究者）と交流
- 進行段階：1. 交流 → 2. 記録の断片
- 関連：lib_forbidden, lg_other_side
- 再挑戦：なし（一度きり）

## 都市起点（10章）（20）

| ID | 名称 | 分類 | 地域 | 共有 | 状態 | 詳細度 |
|---|---|---|---|---|---|---|
| ct_festival | 王都の大祭典<br><small>GRAND FESTIVAL OF THE CAPITAL</small> | 都市・時間限定 | 王都アルセリア | both | 未実装 | outline |
| ct_vanished_district | 消えた商店街<br><small>THE VANISHED DISTRICT</small> | 都市・隠し | 中央大陸エルディア | both | 未実装 | outline |
| ct_royal_auction | 王立オークション<br><small>ROYAL AUCTION</small> | 都市・時間限定 | 王都アルセリア | both | 未実装 | outline |
| ct_troupe | 旅芸人一座<br><small>THE WANDERING TROUPE</small> | 都市・NPC遭遇 | 世界各地 | both | 未実装 | outline |
| ct_haunted | 幽霊屋敷の噂<br><small>THE HAUNTED MANSION</small> | 都市・隠し | 中央大陸エルディア | both | 未実装 | outline |
| ct_promotion | 冒険者ギルドの昇格試験<br><small>GUILD PROMOTION</small> | 都市・常設 | 世界各地 | both | 未実装 | outline |
| ct_duelist | 決闘の申し込み<br><small>THE DUELIST'S CHALLENGE</small> | 都市・NPC遭遇 | 世界各地 | both | 未実装 | outline |
| ct_lost_party | 失踪した冒険者パーティー<br><small>THE LOST PARTY</small> | 都市・ダンジョン | 世界各地 | both | 未実装 | outline |
| ct_hundred_arms | 百武器の祭典<br><small>FESTIVAL OF A HUNDRED ARMS</small> | 都市・時間限定 | 中央大陸エルディア | both | 未実装 | outline |
| ct_succession | 王位継承の噂<br><small>THE SUCCESSION CRISIS</small> | 都市・世界規模 | 王都アルセリア | both | 未実装 | outline |
| ct_merchants_war | 商人ギルドの経済戦争<br><small>MERCHANTS' WAR</small> | 都市・世界規模 | 商業都市ヴェルミオン | both | 未実装 | outline |
| ct_great_fire | 王都の大火災<br><small>THE GREAT FIRE</small> | 都市・世界規模 | 王都アルセリア | both | 未実装 | outline |
| ct_delegation | 国際交易使節団<br><small>THE FOREIGN DELEGATION</small> | 都市・時間限定 | 世界各地 | both | 未実装 | outline |
| ct_undercity | 街の地下水路<br><small>THE UNDERCITY NETWORK</small> | 都市・ダンジョン・隠し | 中央大陸エルディア | both | 未実装 | outline |
| ct_thirteenth | 時計塔の十三時<br><small>THE THIRTEENTH HOUR</small> | 都市・隠し | 中央大陸エルディア | both | 未実装 | outline |
| ct_portrait | 名もなき肖像画<br><small>THE PORTRAIT WITHOUT A NAME</small> | 都市・隠し | 中央大陸エルディア | both | 未実装 | outline |
| ct_midnight_shop | 夜だけ営業する店<br><small>THE MIDNIGHT SHOP</small> | 都市・条件発生型 | 中央大陸エルディア | both | 未実装 | outline |
| ct_academy | 王立魔法学院の公開研究会<br><small>ROYAL ACADEMY</small> | 都市・時間限定 | 学術都市ルミナス | both | 未実装 | outline |
| ct_stranger | 街に現れた異邦人<br><small>THE STRANGER</small> | 都市・NPC遭遇・隠し | 世界各地 | both | 未実装 | outline |
| ct_king_beneath | 街の地下に眠る王<br><small>THE KING BENEATH THE CITY</small> | 都市・ダンジョン・隠し | 王都アルセリア | both | 未実装 | outline |

## その他の大型イベント候補（11章）（21）

| ID | 名称 | 分類 | 地域 | 共有 | 状態 | 詳細度 |
|---|---|---|---|---|---|---|
| lg_god_remains | 神骸発掘<br><small>REMNANTS OF GOD</small> | 世界規模 | 神域ディヴァイン・レルム | both | 未実装 | outline |
| lg_kingdom_below | 地底王国<br><small>KINGDOM BELOW</small> | 世界規模 | 地底世界アンダーレルム | both | 未実装 | outline |
| lg_fall_heavens | 天空の落日<br><small>FALL OF THE HEAVENS</small> | 世界規模 | 天空領域アストラルヘイム | both | 未実装 | outline |
| lg_worldtree_dream | 世界樹の夢<br><small>WORLD TREE DREAM</small> | 世界規模 | 世界樹領域ユグドラシル | both | 未実装 | outline |
| lg_deus_machina | 神機降臨<br><small>DEUS MACHINA</small> | 世界規模 | 世界各地 | both | 未実装 | outline |
| lg_forgotten_hero | 忘却された英雄<br><small>THE FORGOTTEN HERO</small> | 世界規模 | 世界各地 | both | 未実装 | outline |
| lg_unnamed_arms | 名もなき武器<br><small>THE UNNAMED ARMAMENT</small> | 世界規模・称号 | 世界各地 | personal | 実装済み | outline |
| lg_wandering_merchant | 名もなき商人<br><small>THE WANDERING MERCHANT</small> | 世界規模 | 世界各地 | both | 未実装 | outline |
| lg_rebuild | 滅びた村の再建<br><small>REBUILD THE LOST</small> | 世界規模 | 中央大陸エルディア | both | 未実装 | outline |
| lg_civil_war | 王国の内乱<br><small>CIVIL WAR</small> | 世界規模 | 中央大陸エルディア | both | 未実装 | outline |
| lg_territory | 古龍の縄張り争い<br><small>TERRITORIAL DOMINION</small> | 世界規模 | 西方大陸ヴァルグラン | both | 未実装 | outline |
| lg_vanished_city | 消えた都市<br><small>THE VANISHED CITY</small> | 世界規模 | 世界各地 | both | 未実装 | outline |
| lg_undefeated | 無敗の挑戦者 | 世界規模 | 世界各地 | both | 未実装 | outline |
| lg_abyss_walker | 深淵の踏破者 | 世界規模 | 世界各地 | both | 未実装 | outline |
| lg_veteran | 百戦錬磨 | 世界規模 | 世界各地 | both | 未実装 | outline |
| lg_collector | 万物の収集家 | 世界規模 | 世界各地 | both | 未実装 | outline |
| lg_nameless_savior | 無名の救世主 | 世界規模 | 世界各地 | both | 未実装 | outline |
| lg_last_observer | 最後の観測者 | 世界規模 | 世界の外側アウター・ワールド | both | 未実装 | outline |
| lg_other_side | 世界の裏側<br><small>THE OTHER SIDE</small> | 世界規模 | 世界の外側アウター・ワールド | both | 未実装 | outline |
| lg_divine_war | 神々の戦争<br><small>WAR OF THE DIVINES</small> | 世界規模 | 神域ディヴァイン・レルム | both | 未実装 | outline |
| lg_doomsday | 終末時計<br><small>DOOMSDAY CLOCK</small> | 世界規模 | 時間領域クロノス・レルム | both | 未実装 | outline |

### 名もなき武器（lg_unnamed_arms）

- 発生条件：武器を装備して戦い続ける（武器の個体ごとに記録）
- 進行段階：1. 武器を使い込む → 2. 二つ名が刻まれる
- 報酬：二つ名（300撃破〜）と攻撃補正、称号「武器に刻む者」
- 関連：ct_hundred_arms, sl_blackforge
- 再挑戦：再挑戦可
- 備考：長期使用した武器に固有の歴史（撃破数・ボス討伐・最多討伐種・進化歴）が蓄積し、節目で二つ名と小さな補正が刻まれる

## 禁書庫・大罪（12〜14章）（4）

| ID | 名称 | 分類 | 地域 | 共有 | 状態 | 詳細度 |
|---|---|---|---|---|---|---|
| lib_sealed_abyss | 封印されし深淵<br><small>SEALED ABYSS</small> | ダンジョン・常設 | 王都アルセリア | personal | 未実装 | spec |
| lib_forbidden | 禁書庫<br><small>THE FORBIDDEN ARCHIVE</small> | 隠し・職業解放・称号 | 王都アルセリア | personal | 未実装 | spec |
| lib_sins | 七つの大罪<br><small>SEVEN SINS</small> | 職業解放・世界規模 | 王都アルセリア | both | 未実装 | spec |
| lib_succession | 大罪司教の継承決闘<br><small>SUCCESSION DUEL</small> | 世界規模・NPC遭遇 | 王都アルセリア | world | 未実装 | spec |

### 封印されし深淵（lib_sealed_abyss）

- 発生条件：アルセリア地下。HARD以上限定
- 進行段階：1. 1-10 忘却の地下墓地（墓守の巨人） → 2. 11-20 腐蝕の菌窟（腐蝕母樹） → 3. 21-30 灼熱の地底炉（熔鉄の処刑者） → 4. 31-40 沈黙の水没神殿（深海の祭司） → 5. 41-50 失われた機械都市（機械王オルディウス） → 6. 51-100（環境・ボス未定義）
- 報酬：禁書庫の鍵（10F毎ボス：P% = 階層/10、個別抽選、取引・売却不可、入場時1本消費）
- 関連：lib_forbidden
- 再挑戦：再挑戦可

### 禁書庫（lib_forbidden）

- 発生条件：大図書館に禁書庫の鍵を持って入場（1本消費）
- 前提：lib_sealed_abyss
- 進行段階：1. 初回訪問（称号「初めての禁書庫」） → 2. 書籍閲覧（異端書・禁忌書・失伝書・予言書・異界書） → 3. 異端書1冊読了 → 異端者
- 報酬：称号「初めての禁書庫」
- 解放：職業「異端者」
- 関連：lib_sins, ev_thousand_spells, sl_carriers, lg_other_side
- 再挑戦：なし（一度きり）

### 七つの大罪（lib_sins）

- 発生条件：異端者になる
- 前提：lib_forbidden
- 進行段階：1. 主ルート選択（強欲・暴食・嫉妬・怠惰・傲慢・憤怒・色欲） → 2. 罪人 → 3. 熟練度・条件 → 4. 最終試練（再挑戦可・失敗しても職業/熟練度は失わない） → 5. 大罪司教
- 解放：罪人7種、大罪司教7系統（1キャラ1系統）
- 関連：lib_succession
- 再挑戦：なし（一度きり）

### 大罪司教の継承決闘（lib_succession）

- 発生条件：現職の大罪司教（プレイヤーまたはNPC）に継承決闘を申請。NPCは必ず受諾
- 前提：lib_sins
- 進行段階：1. 申請 → 2. 決闘 → 3. 継承または防衛
- 結末：挑戦者が継承（敗者は元大罪司教として残る） ／ 現職が防衛
- 関連：lib_sins
- 再挑戦：再挑戦可
- 備考：継承履歴（現職・歴代・日時・勝敗・職業・武器種）を世界状態に記録。座の継承だけで試練報酬は自動解放しない

## 既存実装（統合対象）（8）

| ID | 名称 | 分類 | 地域 | 共有 | 状態 | 詳細度 |
|---|---|---|---|---|---|---|
| st_celestia | 王位継承の陰謀 | 都市・世界規模 | 王都セレスティア | both | 実装済み | spec |
| st_marina | 灯台の消えた夜 | 都市・世界規模 | 交易港湾都市マリナ | both | 実装済み | spec |
| st_vulcan | 深層採掘の是非 | 都市・世界規模 | 鉄鋼都市ヴァルカンブルク | both | 実装済み | spec |
| st_arcanum | 終焉の鍵の欠片 | 都市・世界規模 | 魔導学術都市アルカナリア | both | 実装済み | spec |
| st_lumina | 夜明けの灯 | 都市・世界規模 | 歓楽都市ルクスガルド | both | 実装済み | spec |
| ex_slum_raid | スラム探索・脱出<br><small>SLUM EXTRACTION</small> | スラム・常設・ダンジョン | 始まりの街ヘイヴン・交易港湾都市マリナ・王都セレスティア・鉄鋼都市ヴァルカンブルク・魔導学術都市アルカナリア・歓楽都市ルクスガルド | both | 実装済み | spec |
| ex_arena | 闘技場<br><small>ARENA</small> | 都市・常設 | 交易港湾都市マリナ・歓楽都市ルクスガルド | both | 実装済み | spec |
| ex_dungeons | 12ダンジョン×100階層<br><small>DUNGEONS</small> | ダンジョン・常設 | 世界各地 | both | 実装済み | spec |

### 王位継承の陰謀（st_celestia）

- 発生条件：都市の物語NPC（server/game/stories.js）
- 進行段階：1. 段階進行 → 2. 選択（最初の選択者が都市の運命を決定）
- 関連：ct_succession
- 再挑戦：なし（一度きり）

### 灯台の消えた夜（st_marina）

- 発生条件：都市の物語NPC（server/game/stories.js）
- 進行段階：1. 段階進行 → 2. 選択（最初の選択者が都市の運命を決定）
- 再挑戦：なし（一度きり）

### 深層採掘の是非（st_vulcan）

- 発生条件：都市の物語NPC（server/game/stories.js）
- 進行段階：1. 段階進行 → 2. 選択（最初の選択者が都市の運命を決定）
- 再挑戦：なし（一度きり）

### 終焉の鍵の欠片（st_arcanum）

- 発生条件：都市の物語NPC（server/game/stories.js）
- 進行段階：1. 段階進行 → 2. 選択（最初の選択者が都市の運命を決定）
- 再挑戦：なし（一度きり）

### 夜明けの灯（st_lumina）

- 発生条件：都市の物語NPC（server/game/stories.js）
- 進行段階：1. 段階進行 → 2. 選択（最初の選択者が都市の運命を決定）
- 再挑戦：なし（一度きり）

### スラム探索・脱出（ex_slum_raid）

- 発生条件：各都市「スラム深部への入口」
- 進行段階：1. 潜入 → 2. 探索 → 3. 脱出
- 関連：sl_graymarket
- 再挑戦：再挑戦可

### 闘技場（ex_arena）

- 発生条件：闘技場NPC
- 進行段階：1. 3連戦
- 関連：sl_colosseum
- 再挑戦：日替わり

### 12ダンジョン×100階層（ex_dungeons）

- 発生条件：ダンジョンゲート
- 進行段階：1. EASY〜ABYSS
- 関連：lg_abyss_walker
- 再挑戦：再挑戦可

## 関連グラフ（イベント → 関連イベント）

```
ev_swordmaster -> ev_masquerade, ct_duelist, lg_undefeated
ev_sunken -> ev_thousand_spells, ev_calamity
ev_blackmoon -> lg_last_observer, lg_other_side
ev_thousand_spells -> lib_forbidden, ct_academy
ev_calamity -> lg_territory
ev_masquerade -> ev_swordmaster, sl_colosseum
sl_graymarket -> sl_auction, sl_factions
sl_children -> sl_factions
sl_factions -> sl_graymarket, sl_false_hero, sl_capital_shadow
sl_facility -> lg_deus_machina, sl_last_resident
sl_false_hero -> sl_capital_shadow, sl_factions
sl_auction -> sl_graymarket, ct_royal_auction
sl_colosseum -> ev_masquerade
sl_carriers -> lib_forbidden
sl_capital_shadow -> sl_false_hero, ct_succession
sl_blackforge -> ct_hundred_arms, lg_unnamed_arms
sl_last_resident -> lib_forbidden, lg_other_side
lg_unnamed_arms -> ct_hundred_arms, sl_blackforge
lib_sealed_abyss -> lib_forbidden
lib_forbidden -> lib_sins, ev_thousand_spells, sl_carriers, lg_other_side
lib_sins -> lib_succession
lib_succession -> lib_sins
st_celestia -> ct_succession
ex_slum_raid -> sl_graymarket
ex_arena -> sl_colosseum
ex_dungeons -> lg_abyss_walker
```
