# ABYSS 職業データベース

> 自動生成：`node tools/docs/gen-db-docs.mjs`（データ元：shared/gen/jobs.json ← tools/gen/jobs.mjs）。手で編集しないこと。

## 概要

- 職業数：**1000**（40系統 × 25系譜）
- 武器種とは独立：どの職業でも86武器種すべてを装備可能。職業は「武器相性（best/good）」で補正するだけで、使用禁止はない
- 1,000職 × 86武器種 = 86,000通りの組み合わせ
- 各職業：固有パッシブ（ステータス補正mods）・固有アクティブスキル・ステータス補正・武器相性・属性・解放条件・上位職/派生職・熟練度上限
- 職業熟練度はキャラクターごとに職業別で保存。転職しても武器熟練度は失われない

## ランク別

| ランク | 職数 | 代表的な解放条件 |
|---|---|---|
| 基本職 | 40 | level=3 |
| 応用職 | 240 | level=15、job=dancer_0、prof=3 |
| 上級職 | 240 | level=35、job=dancer_6、prof=5、kills=300 |
| 特殊職 | 200 | level=55、job=dancer_7、prof=6、clear={"dungeon":"d03","floor":30} |
| 希少職 | 160 | level=85、job=dancer_12、prof=8、boss={"diff":"HARD","count":10}、clear={"dungeon":"d08","floor":60} |
| 隠し職 | 120 | level=120、job=dancer_20、prof=10、hidden={"item":"relic_end"}、abyss=7 |

## 解放条件の種類（実装済み）

level（レベル）／job＋prof（前提職とその熟練度）／kills（討伐数）／clear（ダンジョン到達階）／boss（難易度別ボス討伐数）／abyss（ABYSS到達階）／hidden（隠し条件：深淵階層・NPC絆・特定アイテム）。サーバーの `jobUnlockMet` で検証。

## 固有名職業（企画で指定済み・未実装）

既存1,000職の名称は変更しない。以下は「イベント職業」として別レジストリで追加する案（ABYSS_CONFLICT_REPORT.md C-07 参照）。

| 職業 | 解放イベント | 系統 |
|---|---|---|
| 異端者 | 禁書庫：異端書1冊読了 | 大罪系 |
| 強欲／暴食／嫉妬／怠惰／傲慢／憤怒／色欲の罪人 | 異端者＋主ルート選択 | 大罪系 |
| 大罪司教（7系統） | 罪人熟練度＋最終試練、または継承決闘 | 大罪系 |
| 剣理の探究者 | 放浪する最強の剣士「無銘の極致」 | 剣士系 |
| 原初魔導師 | 失われた千の魔法「第零魔法」 | 魔法系 |
| 月影の観測者 | 黒月の夜 → 月の裏側 | 特殊系 |
| 闘技王 | 仮面の武闘祭 → 素顔の王 | 戦士系 |
| 黒炉鍛冶師 | 黒炉の鍛冶師（グラド・ベルン） | 生産系 |
| 神機技師関連職 | 地下に眠る巨大施設／神機降臨 | 古代文明系 |
| デウス・エクス・マギア | 神機降臨（詳細未確定） | 神話系 |

## 系統別一覧（40系統）

| 系統 | 基本職 | 職数 | 武器相性(best) | 最上位例 |
|---|---|---|---|---|
| warrior | 戦士 | 25 | sword | 終焉の戦士（隠し職） |
| guardian | 守護騎士 | 25 | polearm | 終焉の守護騎士（隠し職） |
| berserker | 狂戦士 | 25 | blunt | 終焉の狂戦士（隠し職） |
| gladiator | 剣闘士 | 25 | sword | 終焉の剣闘士（隠し職） |
| monk | 武僧 | 25 | fist | 終焉の武僧（隠し職） |
| bushi | 武士 | 25 | sword | 終焉の武士（隠し職） |
| ninja | 忍者 | 25 | sword | 終焉の忍者（隠し職） |
| thief | 盗賊 | 25 | sword | 終焉の盗賊（隠し職） |
| assassin | 暗殺者 | 25 | sword | 終焉の暗殺者（隠し職） |
| hunter | 狩人 | 25 | ranged | 終焉の狩人（隠し職） |
| scout | 斥候 | 25 | ranged | 終焉の斥候（隠し職） |
| mage | 魔術師 | 25 | magic | 終焉の魔術師（隠し職） |
| sorcerer | 妖術師 | 25 | magic | 終焉の妖術師（隠し職） |
| summoner | 召喚士 | 25 | magic | 終焉の召喚士（隠し職） |
| necromancer | 死霊術師 | 25 | magic | 終焉の死霊術師（隠し職） |
| elementalist | 精霊使い | 25 | magic | 終焉の精霊使い（隠し職） |
| cleric | 僧侶 | 25 | magic | 終焉の僧侶（隠し職） |
| paladin | 聖騎士 | 25 | sword | 終焉の聖騎士（隠し職） |
| priest | 神官 | 25 | magic | 終焉の神官（隠し職） |
| bard | 吟遊詩人 | 25 | mech | 終焉の吟遊詩人（隠し職） |
| dancer | 踊り子 | 25 | sword | 終焉の踊り子（隠し職） |
| alchemist | 錬金術師 | 25 | ranged | 終焉の錬金術師（隠し職） |
| machinist | 機工士 | 25 | mech | 終焉の機工士（隠し職） |
| enchanter | 付与術師 | 25 | magic | 終焉の付与術師（隠し職） |
| curser | 呪術師 | 25 | magic | 終焉の呪術師（隠し職） |
| astrologer | 占星術師 | 25 | magic | 終焉の占星術師（隠し職） |
| chronomancer | 時術師 | 25 | magic | 終焉の時術師（隠し職） |
| gravitist | 重力術師 | 25 | magic | 終焉の重力術師（隠し職） |
| tamer | 獣使い | 25 | fist | 終焉の獣使い（隠し職） |
| dragoon | 竜騎士 | 25 | polearm | 終焉の竜騎士（隠し職） |
| spellblade | 魔剣士 | 25 | sword | 終焉の魔剣士（隠し職） |
| magefist | 魔拳士 | 25 | fist | 終焉の魔拳士（隠し職） |
| warder | 結界師 | 25 | magic | 終焉の結界師（隠し職） |
| apothecary | 薬師 | 25 | magic | 終焉の薬師（隠し職） |
| merchant | 商人 | 25 | ranged | 終焉の商人（隠し職） |
| scholar | 学者 | 25 | magic | 終焉の学者（隠し職） |
| wanderer | 旅人 | 25 | sword | 終焉の旅人（隠し職） |
| pirate | 海賊 | 25 | sword | 終焉の海賊（隠し職） |
| mercenary | 傭兵 | 25 | sword | 終焉の傭兵（隠し職） |
| avenger | 復讐者 | 25 | sword | 終焉の復讐者（隠し職） |

## 全職業一覧

| ID | 職業 | ランク | 固有パッシブ | 固有アクティブ | 解放条件 |
|---|---|---|---|---|---|
| warrior_0 | 戦士 | 基本職 | 戦士の心得 | 雄叫び | level:1 |
| warrior_1 | 炎刃の戦士 | 応用職 | 炎刃の戦士の心得 | 炎刃・雄叫び | level:15 job:warrior_0 prof:3 |
| warrior_2 | 氷霜の戦士 | 応用職 | 氷霜の戦士の心得 | 氷霜・雄叫び | level:15 job:warrior_0 prof:3 |
| warrior_3 | 迅雷の戦士 | 応用職 | 迅雷の戦士の心得 | 迅雷・雄叫び | level:15 job:warrior_0 prof:3 |
| warrior_4 | 疾風の戦士 | 応用職 | 疾風の戦士の心得 | 疾風・雄叫び | level:15 job:warrior_0 prof:3 |
| warrior_5 | 大地の戦士 | 応用職 | 大地の戦士の心得 | 大地・雄叫び | level:15 job:warrior_0 prof:3 |
| warrior_6 | 流水の戦士 | 応用職 | 流水の戦士の心得 | 流水・雄叫び | level:15 job:warrior_0 prof:3 |
| warrior_7 | 聖光の戦士 | 上級職 | 聖光の戦士の心得 | 聖光・雄叫び | level:35 job:warrior_6 prof:5 kills:300 |
| warrior_8 | 闇夜の戦士 | 上級職 | 闇夜の戦士の心得 | 闇夜・雄叫び | level:35 job:warrior_4 prof:5 kills:300 |
| warrior_9 | 鋼鉄の戦士 | 上級職 | 鋼鉄の戦士の心得 | 鋼鉄・雄叫び | level:35 job:warrior_5 prof:5 kills:300 |
| warrior_10 | 血盟の戦士 | 上級職 | 血盟の戦士の心得 | 血盟・雄叫び | level:35 job:warrior_1 prof:5 kills:300 |
| warrior_11 | 幻影の戦士 | 上級職 | 幻影の戦士の心得 | 幻影・雄叫び | level:35 job:warrior_2 prof:5 kills:300 |
| warrior_12 | 星詠の戦士 | 上級職 | 星詠の戦士の心得 | 星詠・雄叫び | level:35 job:warrior_3 prof:5 kills:300 |
| warrior_13 | 黄昏の戦士 | 特殊職 | 黄昏の戦士の心得 | 黄昏・雄叫び | level:55 job:warrior_7 prof:6 clear:{dungeon:d03,floor:30} |
| warrior_14 | 深淵の戦士 | 特殊職 | 深淵の戦士の心得 | 深淵・雄叫び | level:55 job:warrior_8 prof:6 clear:{dungeon:d04,floor:30} |
| warrior_15 | 竜血の戦士 | 特殊職 | 竜血の戦士の心得 | 竜血・雄叫び | level:55 job:warrior_10 prof:6 clear:{dungeon:d05,floor:30} |
| warrior_16 | 機巧の戦士 | 特殊職 | 機巧の戦士の心得 | 機巧・雄叫び | level:55 job:warrior_9 prof:6 clear:{dungeon:d06,floor:30} |
| warrior_17 | 霊樹の戦士 | 特殊職 | 霊樹の戦士の心得 | 霊樹・雄叫び | level:55 job:warrior_11 prof:6 clear:{dungeon:d07,floor:30} |
| warrior_18 | 時渡りの戦士 | 希少職 | 時渡りの戦士の心得 | 時渡り・雄叫び | level:85 job:warrior_12 prof:8 boss:{diff:HARD,count:10} clear:{dungeon:d08,floor:60} |
| warrior_19 | 重界の戦士 | 希少職 | 重界の戦士の心得 | 重界・雄叫び | level:85 job:warrior_14 prof:8 boss:{diff:HARD,count:10} clear:{dungeon:d09,floor:60} |
| warrior_20 | 虚無の戦士 | 希少職 | 虚無の戦士の心得 | 虚無・雄叫び | level:85 job:warrior_13 prof:8 boss:{diff:HARD,count:10} clear:{dungeon:d10,floor:60} |
| warrior_21 | 神託の戦士 | 希少職 | 神託の戦士の心得 | 神託・雄叫び | level:85 job:warrior_17 prof:8 boss:{diff:HARD,count:10} clear:{dungeon:d11,floor:60} |
| warrior_22 | 終焉の戦士 | 隠し職 | 終焉の戦士の心得 | 終焉・雄叫び | level:120 job:warrior_20 prof:10 hidden:{abyssFloor:10} abyss:5 |
| warrior_23 | 原初の戦士 | 隠し職 | 原初の戦士の心得 | 原初・雄叫び | level:120 job:warrior_21 prof:10 hidden:{abyssFloor:10} abyss:5 |
| warrior_24 | 永劫の戦士 | 隠し職 | 永劫の戦士の心得 | 永劫・雄叫び | level:120 job:warrior_18 prof:10 hidden:{abyssFloor:10} abyss:5 |
| guardian_0 | 守護騎士 | 基本職 | 守護騎士の心得 | 守護の誓い | level:1 |
| guardian_1 | 炎刃の守護騎士 | 応用職 | 炎刃の守護騎士の心得 | 炎刃・守護の誓い | level:15 job:guardian_0 prof:3 |
| guardian_2 | 氷霜の守護騎士 | 応用職 | 氷霜の守護騎士の心得 | 氷霜・守護の誓い | level:15 job:guardian_0 prof:3 |
| guardian_3 | 迅雷の守護騎士 | 応用職 | 迅雷の守護騎士の心得 | 迅雷・守護の誓い | level:15 job:guardian_0 prof:3 |
| guardian_4 | 疾風の守護騎士 | 応用職 | 疾風の守護騎士の心得 | 疾風・守護の誓い | level:15 job:guardian_0 prof:3 |
| guardian_5 | 大地の守護騎士 | 応用職 | 大地の守護騎士の心得 | 大地・守護の誓い | level:15 job:guardian_0 prof:3 |
| guardian_6 | 流水の守護騎士 | 応用職 | 流水の守護騎士の心得 | 流水・守護の誓い | level:15 job:guardian_0 prof:3 |
| guardian_7 | 聖光の守護騎士 | 上級職 | 聖光の守護騎士の心得 | 聖光・守護の誓い | level:35 job:guardian_6 prof:5 kills:300 |
| guardian_8 | 闇夜の守護騎士 | 上級職 | 闇夜の守護騎士の心得 | 闇夜・守護の誓い | level:35 job:guardian_4 prof:5 kills:300 |
| guardian_9 | 鋼鉄の守護騎士 | 上級職 | 鋼鉄の守護騎士の心得 | 鋼鉄・守護の誓い | level:35 job:guardian_5 prof:5 kills:300 |
| guardian_10 | 血盟の守護騎士 | 上級職 | 血盟の守護騎士の心得 | 血盟・守護の誓い | level:35 job:guardian_1 prof:5 kills:300 |
| guardian_11 | 幻影の守護騎士 | 上級職 | 幻影の守護騎士の心得 | 幻影・守護の誓い | level:35 job:guardian_2 prof:5 kills:300 |
| guardian_12 | 星詠の守護騎士 | 上級職 | 星詠の守護騎士の心得 | 星詠・守護の誓い | level:35 job:guardian_3 prof:5 kills:300 |
| guardian_13 | 黄昏の守護騎士 | 特殊職 | 黄昏の守護騎士の心得 | 黄昏・守護の誓い | level:55 job:guardian_7 prof:6 clear:{dungeon:d03,floor:30} |
| guardian_14 | 深淵の守護騎士 | 特殊職 | 深淵の守護騎士の心得 | 深淵・守護の誓い | level:55 job:guardian_8 prof:6 clear:{dungeon:d04,floor:30} |
| guardian_15 | 竜血の守護騎士 | 特殊職 | 竜血の守護騎士の心得 | 竜血・守護の誓い | level:55 job:guardian_10 prof:6 clear:{dungeon:d05,floor:30} |
| guardian_16 | 機巧の守護騎士 | 特殊職 | 機巧の守護騎士の心得 | 機巧・守護の誓い | level:55 job:guardian_9 prof:6 clear:{dungeon:d06,floor:30} |
| guardian_17 | 霊樹の守護騎士 | 特殊職 | 霊樹の守護騎士の心得 | 霊樹・守護の誓い | level:55 job:guardian_11 prof:6 clear:{dungeon:d07,floor:30} |
| guardian_18 | 時渡りの守護騎士 | 希少職 | 時渡りの守護騎士の心得 | 時渡り・守護の誓い | level:85 job:guardian_12 prof:8 boss:{diff:HARD,count:11} clear:{dungeon:d08,floor:60} |
| guardian_19 | 重界の守護騎士 | 希少職 | 重界の守護騎士の心得 | 重界・守護の誓い | level:85 job:guardian_14 prof:8 boss:{diff:HARD,count:11} clear:{dungeon:d09,floor:60} |
| guardian_20 | 虚無の守護騎士 | 希少職 | 虚無の守護騎士の心得 | 虚無・守護の誓い | level:85 job:guardian_13 prof:8 boss:{diff:HARD,count:11} clear:{dungeon:d10,floor:60} |
| guardian_21 | 神託の守護騎士 | 希少職 | 神託の守護騎士の心得 | 神託・守護の誓い | level:85 job:guardian_17 prof:8 boss:{diff:HARD,count:11} clear:{dungeon:d11,floor:60} |
| guardian_22 | 終焉の守護騎士 | 隠し職 | 終焉の守護騎士の心得 | 終焉・守護の誓い | level:120 job:guardian_20 prof:10 hidden:{npcBond:80} abyss:6 |
| guardian_23 | 原初の守護騎士 | 隠し職 | 原初の守護騎士の心得 | 原初・守護の誓い | level:120 job:guardian_21 prof:10 hidden:{npcBond:80} abyss:6 |
| guardian_24 | 永劫の守護騎士 | 隠し職 | 永劫の守護騎士の心得 | 永劫・守護の誓い | level:120 job:guardian_18 prof:10 hidden:{npcBond:80} abyss:6 |
| berserker_0 | 狂戦士 | 基本職 | 狂戦士の心得 | 狂化 | level:1 |
| berserker_1 | 炎刃の狂戦士 | 応用職 | 炎刃の狂戦士の心得 | 炎刃・狂化 | level:15 job:berserker_0 prof:3 |
| berserker_2 | 氷霜の狂戦士 | 応用職 | 氷霜の狂戦士の心得 | 氷霜・狂化 | level:15 job:berserker_0 prof:3 |
| berserker_3 | 迅雷の狂戦士 | 応用職 | 迅雷の狂戦士の心得 | 迅雷・狂化 | level:15 job:berserker_0 prof:3 |
| berserker_4 | 疾風の狂戦士 | 応用職 | 疾風の狂戦士の心得 | 疾風・狂化 | level:15 job:berserker_0 prof:3 |
| berserker_5 | 大地の狂戦士 | 応用職 | 大地の狂戦士の心得 | 大地・狂化 | level:15 job:berserker_0 prof:3 |
| berserker_6 | 流水の狂戦士 | 応用職 | 流水の狂戦士の心得 | 流水・狂化 | level:15 job:berserker_0 prof:3 |
| berserker_7 | 聖光の狂戦士 | 上級職 | 聖光の狂戦士の心得 | 聖光・狂化 | level:35 job:berserker_6 prof:5 kills:300 |
| berserker_8 | 闇夜の狂戦士 | 上級職 | 闇夜の狂戦士の心得 | 闇夜・狂化 | level:35 job:berserker_4 prof:5 kills:300 |
| berserker_9 | 鋼鉄の狂戦士 | 上級職 | 鋼鉄の狂戦士の心得 | 鋼鉄・狂化 | level:35 job:berserker_5 prof:5 kills:300 |
| berserker_10 | 血盟の狂戦士 | 上級職 | 血盟の狂戦士の心得 | 血盟・狂化 | level:35 job:berserker_1 prof:5 kills:300 |
| berserker_11 | 幻影の狂戦士 | 上級職 | 幻影の狂戦士の心得 | 幻影・狂化 | level:35 job:berserker_2 prof:5 kills:300 |
| berserker_12 | 星詠の狂戦士 | 上級職 | 星詠の狂戦士の心得 | 星詠・狂化 | level:35 job:berserker_3 prof:5 kills:300 |
| berserker_13 | 黄昏の狂戦士 | 特殊職 | 黄昏の狂戦士の心得 | 黄昏・狂化 | level:55 job:berserker_7 prof:6 clear:{dungeon:d03,floor:30} |
| berserker_14 | 深淵の狂戦士 | 特殊職 | 深淵の狂戦士の心得 | 深淵・狂化 | level:55 job:berserker_8 prof:6 clear:{dungeon:d04,floor:30} |
| berserker_15 | 竜血の狂戦士 | 特殊職 | 竜血の狂戦士の心得 | 竜血・狂化 | level:55 job:berserker_10 prof:6 clear:{dungeon:d05,floor:30} |
| berserker_16 | 機巧の狂戦士 | 特殊職 | 機巧の狂戦士の心得 | 機巧・狂化 | level:55 job:berserker_9 prof:6 clear:{dungeon:d06,floor:30} |
| berserker_17 | 霊樹の狂戦士 | 特殊職 | 霊樹の狂戦士の心得 | 霊樹・狂化 | level:55 job:berserker_11 prof:6 clear:{dungeon:d07,floor:30} |
| berserker_18 | 時渡りの狂戦士 | 希少職 | 時渡りの狂戦士の心得 | 時渡り・狂化 | level:85 job:berserker_12 prof:8 boss:{diff:HARD,count:12} clear:{dungeon:d08,floor:60} |
| berserker_19 | 重界の狂戦士 | 希少職 | 重界の狂戦士の心得 | 重界・狂化 | level:85 job:berserker_14 prof:8 boss:{diff:HARD,count:12} clear:{dungeon:d09,floor:60} |
| berserker_20 | 虚無の狂戦士 | 希少職 | 虚無の狂戦士の心得 | 虚無・狂化 | level:85 job:berserker_13 prof:8 boss:{diff:HARD,count:12} clear:{dungeon:d10,floor:60} |
| berserker_21 | 神託の狂戦士 | 希少職 | 神託の狂戦士の心得 | 神託・狂化 | level:85 job:berserker_17 prof:8 boss:{diff:HARD,count:12} clear:{dungeon:d11,floor:60} |
| berserker_22 | 終焉の狂戦士 | 隠し職 | 終焉の狂戦士の心得 | 終焉・狂化 | level:120 job:berserker_20 prof:10 hidden:{item:relic_end} abyss:7 |
| berserker_23 | 原初の狂戦士 | 隠し職 | 原初の狂戦士の心得 | 原初・狂化 | level:120 job:berserker_21 prof:10 hidden:{item:relic_origin} abyss:7 |
| berserker_24 | 永劫の狂戦士 | 隠し職 | 永劫の狂戦士の心得 | 永劫・狂化 | level:120 job:berserker_18 prof:10 hidden:{item:relic_eternity} abyss:7 |
| gladiator_0 | 剣闘士 | 基本職 | 剣闘士の心得 | 闘技の宣誓 | level:1 |
| gladiator_1 | 炎刃の剣闘士 | 応用職 | 炎刃の剣闘士の心得 | 炎刃・闘技の宣誓 | level:15 job:gladiator_0 prof:3 |
| gladiator_2 | 氷霜の剣闘士 | 応用職 | 氷霜の剣闘士の心得 | 氷霜・闘技の宣誓 | level:15 job:gladiator_0 prof:3 |
| gladiator_3 | 迅雷の剣闘士 | 応用職 | 迅雷の剣闘士の心得 | 迅雷・闘技の宣誓 | level:15 job:gladiator_0 prof:3 |
| gladiator_4 | 疾風の剣闘士 | 応用職 | 疾風の剣闘士の心得 | 疾風・闘技の宣誓 | level:15 job:gladiator_0 prof:3 |
| gladiator_5 | 大地の剣闘士 | 応用職 | 大地の剣闘士の心得 | 大地・闘技の宣誓 | level:15 job:gladiator_0 prof:3 |
| gladiator_6 | 流水の剣闘士 | 応用職 | 流水の剣闘士の心得 | 流水・闘技の宣誓 | level:15 job:gladiator_0 prof:3 |
| gladiator_7 | 聖光の剣闘士 | 上級職 | 聖光の剣闘士の心得 | 聖光・闘技の宣誓 | level:35 job:gladiator_6 prof:5 kills:300 |
| gladiator_8 | 闇夜の剣闘士 | 上級職 | 闇夜の剣闘士の心得 | 闇夜・闘技の宣誓 | level:35 job:gladiator_4 prof:5 kills:300 |
| gladiator_9 | 鋼鉄の剣闘士 | 上級職 | 鋼鉄の剣闘士の心得 | 鋼鉄・闘技の宣誓 | level:35 job:gladiator_5 prof:5 kills:300 |
| gladiator_10 | 血盟の剣闘士 | 上級職 | 血盟の剣闘士の心得 | 血盟・闘技の宣誓 | level:35 job:gladiator_1 prof:5 kills:300 |
| gladiator_11 | 幻影の剣闘士 | 上級職 | 幻影の剣闘士の心得 | 幻影・闘技の宣誓 | level:35 job:gladiator_2 prof:5 kills:300 |
| gladiator_12 | 星詠の剣闘士 | 上級職 | 星詠の剣闘士の心得 | 星詠・闘技の宣誓 | level:35 job:gladiator_3 prof:5 kills:300 |
| gladiator_13 | 黄昏の剣闘士 | 特殊職 | 黄昏の剣闘士の心得 | 黄昏・闘技の宣誓 | level:55 job:gladiator_7 prof:6 clear:{dungeon:d03,floor:30} |
| gladiator_14 | 深淵の剣闘士 | 特殊職 | 深淵の剣闘士の心得 | 深淵・闘技の宣誓 | level:55 job:gladiator_8 prof:6 clear:{dungeon:d04,floor:30} |
| gladiator_15 | 竜血の剣闘士 | 特殊職 | 竜血の剣闘士の心得 | 竜血・闘技の宣誓 | level:55 job:gladiator_10 prof:6 clear:{dungeon:d05,floor:30} |
| gladiator_16 | 機巧の剣闘士 | 特殊職 | 機巧の剣闘士の心得 | 機巧・闘技の宣誓 | level:55 job:gladiator_9 prof:6 clear:{dungeon:d06,floor:30} |
| gladiator_17 | 霊樹の剣闘士 | 特殊職 | 霊樹の剣闘士の心得 | 霊樹・闘技の宣誓 | level:55 job:gladiator_11 prof:6 clear:{dungeon:d07,floor:30} |
| gladiator_18 | 時渡りの剣闘士 | 希少職 | 時渡りの剣闘士の心得 | 時渡り・闘技の宣誓 | level:85 job:gladiator_12 prof:8 boss:{diff:HARD,count:13} clear:{dungeon:d08,floor:60} |
| gladiator_19 | 重界の剣闘士 | 希少職 | 重界の剣闘士の心得 | 重界・闘技の宣誓 | level:85 job:gladiator_14 prof:8 boss:{diff:HARD,count:13} clear:{dungeon:d09,floor:60} |
| gladiator_20 | 虚無の剣闘士 | 希少職 | 虚無の剣闘士の心得 | 虚無・闘技の宣誓 | level:85 job:gladiator_13 prof:8 boss:{diff:HARD,count:13} clear:{dungeon:d10,floor:60} |
| gladiator_21 | 神託の剣闘士 | 希少職 | 神託の剣闘士の心得 | 神託・闘技の宣誓 | level:85 job:gladiator_17 prof:8 boss:{diff:HARD,count:13} clear:{dungeon:d11,floor:60} |
| gladiator_22 | 終焉の剣闘士 | 隠し職 | 終焉の剣闘士の心得 | 終焉・闘技の宣誓 | level:120 job:gladiator_20 prof:10 hidden:{abyssFloor:13} abyss:8 |
| gladiator_23 | 原初の剣闘士 | 隠し職 | 原初の剣闘士の心得 | 原初・闘技の宣誓 | level:120 job:gladiator_21 prof:10 hidden:{abyssFloor:13} abyss:8 |
| gladiator_24 | 永劫の剣闘士 | 隠し職 | 永劫の剣闘士の心得 | 永劫・闘技の宣誓 | level:120 job:gladiator_18 prof:10 hidden:{abyssFloor:13} abyss:8 |
| monk_0 | 武僧 | 基本職 | 武僧の心得 | 発勁 | level:1 |
| monk_1 | 炎刃の武僧 | 応用職 | 炎刃の武僧の心得 | 炎刃・発勁 | level:15 job:monk_0 prof:3 |
| monk_2 | 氷霜の武僧 | 応用職 | 氷霜の武僧の心得 | 氷霜・発勁 | level:15 job:monk_0 prof:3 |
| monk_3 | 迅雷の武僧 | 応用職 | 迅雷の武僧の心得 | 迅雷・発勁 | level:15 job:monk_0 prof:3 |
| monk_4 | 疾風の武僧 | 応用職 | 疾風の武僧の心得 | 疾風・発勁 | level:15 job:monk_0 prof:3 |
| monk_5 | 大地の武僧 | 応用職 | 大地の武僧の心得 | 大地・発勁 | level:15 job:monk_0 prof:3 |
| monk_6 | 流水の武僧 | 応用職 | 流水の武僧の心得 | 流水・発勁 | level:15 job:monk_0 prof:3 |
| monk_7 | 聖光の武僧 | 上級職 | 聖光の武僧の心得 | 聖光・発勁 | level:35 job:monk_6 prof:5 kills:300 |
| monk_8 | 闇夜の武僧 | 上級職 | 闇夜の武僧の心得 | 闇夜・発勁 | level:35 job:monk_4 prof:5 kills:300 |
| monk_9 | 鋼鉄の武僧 | 上級職 | 鋼鉄の武僧の心得 | 鋼鉄・発勁 | level:35 job:monk_5 prof:5 kills:300 |
| monk_10 | 血盟の武僧 | 上級職 | 血盟の武僧の心得 | 血盟・発勁 | level:35 job:monk_1 prof:5 kills:300 |
| monk_11 | 幻影の武僧 | 上級職 | 幻影の武僧の心得 | 幻影・発勁 | level:35 job:monk_2 prof:5 kills:300 |
| monk_12 | 星詠の武僧 | 上級職 | 星詠の武僧の心得 | 星詠・発勁 | level:35 job:monk_3 prof:5 kills:300 |
| monk_13 | 黄昏の武僧 | 特殊職 | 黄昏の武僧の心得 | 黄昏・発勁 | level:55 job:monk_7 prof:6 clear:{dungeon:d03,floor:30} |
| monk_14 | 深淵の武僧 | 特殊職 | 深淵の武僧の心得 | 深淵・発勁 | level:55 job:monk_8 prof:6 clear:{dungeon:d04,floor:30} |
| monk_15 | 竜血の武僧 | 特殊職 | 竜血の武僧の心得 | 竜血・発勁 | level:55 job:monk_10 prof:6 clear:{dungeon:d05,floor:30} |
| monk_16 | 機巧の武僧 | 特殊職 | 機巧の武僧の心得 | 機巧・発勁 | level:55 job:monk_9 prof:6 clear:{dungeon:d06,floor:30} |
| monk_17 | 霊樹の武僧 | 特殊職 | 霊樹の武僧の心得 | 霊樹・発勁 | level:55 job:monk_11 prof:6 clear:{dungeon:d07,floor:30} |
| monk_18 | 時渡りの武僧 | 希少職 | 時渡りの武僧の心得 | 時渡り・発勁 | level:85 job:monk_12 prof:8 boss:{diff:HARD,count:14} clear:{dungeon:d08,floor:60} |
| monk_19 | 重界の武僧 | 希少職 | 重界の武僧の心得 | 重界・発勁 | level:85 job:monk_14 prof:8 boss:{diff:HARD,count:14} clear:{dungeon:d09,floor:60} |
| monk_20 | 虚無の武僧 | 希少職 | 虚無の武僧の心得 | 虚無・発勁 | level:85 job:monk_13 prof:8 boss:{diff:HARD,count:14} clear:{dungeon:d10,floor:60} |
| monk_21 | 神託の武僧 | 希少職 | 神託の武僧の心得 | 神託・発勁 | level:85 job:monk_17 prof:8 boss:{diff:HARD,count:14} clear:{dungeon:d11,floor:60} |
| monk_22 | 終焉の武僧 | 隠し職 | 終焉の武僧の心得 | 終焉・発勁 | level:120 job:monk_20 prof:10 hidden:{npcBond:80} abyss:9 |
| monk_23 | 原初の武僧 | 隠し職 | 原初の武僧の心得 | 原初・発勁 | level:120 job:monk_21 prof:10 hidden:{npcBond:80} abyss:9 |
| monk_24 | 永劫の武僧 | 隠し職 | 永劫の武僧の心得 | 永劫・発勁 | level:120 job:monk_18 prof:10 hidden:{npcBond:80} abyss:9 |
| bushi_0 | 武士 | 基本職 | 武士の心得 | 一刀の境地 | level:1 |
| bushi_1 | 炎刃の武士 | 応用職 | 炎刃の武士の心得 | 炎刃・一刀の境地 | level:15 job:bushi_0 prof:3 |
| bushi_2 | 氷霜の武士 | 応用職 | 氷霜の武士の心得 | 氷霜・一刀の境地 | level:15 job:bushi_0 prof:3 |
| bushi_3 | 迅雷の武士 | 応用職 | 迅雷の武士の心得 | 迅雷・一刀の境地 | level:15 job:bushi_0 prof:3 |
| bushi_4 | 疾風の武士 | 応用職 | 疾風の武士の心得 | 疾風・一刀の境地 | level:15 job:bushi_0 prof:3 |
| bushi_5 | 大地の武士 | 応用職 | 大地の武士の心得 | 大地・一刀の境地 | level:15 job:bushi_0 prof:3 |
| bushi_6 | 流水の武士 | 応用職 | 流水の武士の心得 | 流水・一刀の境地 | level:15 job:bushi_0 prof:3 |
| bushi_7 | 聖光の武士 | 上級職 | 聖光の武士の心得 | 聖光・一刀の境地 | level:35 job:bushi_6 prof:5 kills:300 |
| bushi_8 | 闇夜の武士 | 上級職 | 闇夜の武士の心得 | 闇夜・一刀の境地 | level:35 job:bushi_4 prof:5 kills:300 |
| bushi_9 | 鋼鉄の武士 | 上級職 | 鋼鉄の武士の心得 | 鋼鉄・一刀の境地 | level:35 job:bushi_5 prof:5 kills:300 |
| bushi_10 | 血盟の武士 | 上級職 | 血盟の武士の心得 | 血盟・一刀の境地 | level:35 job:bushi_1 prof:5 kills:300 |
| bushi_11 | 幻影の武士 | 上級職 | 幻影の武士の心得 | 幻影・一刀の境地 | level:35 job:bushi_2 prof:5 kills:300 |
| bushi_12 | 星詠の武士 | 上級職 | 星詠の武士の心得 | 星詠・一刀の境地 | level:35 job:bushi_3 prof:5 kills:300 |
| bushi_13 | 黄昏の武士 | 特殊職 | 黄昏の武士の心得 | 黄昏・一刀の境地 | level:55 job:bushi_7 prof:6 clear:{dungeon:d03,floor:30} |
| bushi_14 | 深淵の武士 | 特殊職 | 深淵の武士の心得 | 深淵・一刀の境地 | level:55 job:bushi_8 prof:6 clear:{dungeon:d04,floor:30} |
| bushi_15 | 竜血の武士 | 特殊職 | 竜血の武士の心得 | 竜血・一刀の境地 | level:55 job:bushi_10 prof:6 clear:{dungeon:d05,floor:30} |
| bushi_16 | 機巧の武士 | 特殊職 | 機巧の武士の心得 | 機巧・一刀の境地 | level:55 job:bushi_9 prof:6 clear:{dungeon:d06,floor:30} |
| bushi_17 | 霊樹の武士 | 特殊職 | 霊樹の武士の心得 | 霊樹・一刀の境地 | level:55 job:bushi_11 prof:6 clear:{dungeon:d07,floor:30} |
| bushi_18 | 時渡りの武士 | 希少職 | 時渡りの武士の心得 | 時渡り・一刀の境地 | level:85 job:bushi_12 prof:8 boss:{diff:HARD,count:10} clear:{dungeon:d08,floor:60} |
| bushi_19 | 重界の武士 | 希少職 | 重界の武士の心得 | 重界・一刀の境地 | level:85 job:bushi_14 prof:8 boss:{diff:HARD,count:10} clear:{dungeon:d09,floor:60} |
| bushi_20 | 虚無の武士 | 希少職 | 虚無の武士の心得 | 虚無・一刀の境地 | level:85 job:bushi_13 prof:8 boss:{diff:HARD,count:10} clear:{dungeon:d10,floor:60} |
| bushi_21 | 神託の武士 | 希少職 | 神託の武士の心得 | 神託・一刀の境地 | level:85 job:bushi_17 prof:8 boss:{diff:HARD,count:10} clear:{dungeon:d11,floor:60} |
| bushi_22 | 終焉の武士 | 隠し職 | 終焉の武士の心得 | 終焉・一刀の境地 | level:120 job:bushi_20 prof:10 hidden:{item:relic_end} abyss:10 |
| bushi_23 | 原初の武士 | 隠し職 | 原初の武士の心得 | 原初・一刀の境地 | level:120 job:bushi_21 prof:10 hidden:{item:relic_origin} abyss:10 |
| bushi_24 | 永劫の武士 | 隠し職 | 永劫の武士の心得 | 永劫・一刀の境地 | level:120 job:bushi_18 prof:10 hidden:{item:relic_eternity} abyss:10 |
| ninja_0 | 忍者 | 基本職 | 忍者の心得 | 影分身 | level:1 |
| ninja_1 | 炎刃の忍者 | 応用職 | 炎刃の忍者の心得 | 炎刃・影分身 | level:15 job:ninja_0 prof:3 |
| ninja_2 | 氷霜の忍者 | 応用職 | 氷霜の忍者の心得 | 氷霜・影分身 | level:15 job:ninja_0 prof:3 |
| ninja_3 | 迅雷の忍者 | 応用職 | 迅雷の忍者の心得 | 迅雷・影分身 | level:15 job:ninja_0 prof:3 |
| ninja_4 | 疾風の忍者 | 応用職 | 疾風の忍者の心得 | 疾風・影分身 | level:15 job:ninja_0 prof:3 |
| ninja_5 | 大地の忍者 | 応用職 | 大地の忍者の心得 | 大地・影分身 | level:15 job:ninja_0 prof:3 |
| ninja_6 | 流水の忍者 | 応用職 | 流水の忍者の心得 | 流水・影分身 | level:15 job:ninja_0 prof:3 |
| ninja_7 | 聖光の忍者 | 上級職 | 聖光の忍者の心得 | 聖光・影分身 | level:35 job:ninja_6 prof:5 kills:300 |
| ninja_8 | 闇夜の忍者 | 上級職 | 闇夜の忍者の心得 | 闇夜・影分身 | level:35 job:ninja_4 prof:5 kills:300 |
| ninja_9 | 鋼鉄の忍者 | 上級職 | 鋼鉄の忍者の心得 | 鋼鉄・影分身 | level:35 job:ninja_5 prof:5 kills:300 |
| ninja_10 | 血盟の忍者 | 上級職 | 血盟の忍者の心得 | 血盟・影分身 | level:35 job:ninja_1 prof:5 kills:300 |
| ninja_11 | 幻影の忍者 | 上級職 | 幻影の忍者の心得 | 幻影・影分身 | level:35 job:ninja_2 prof:5 kills:300 |
| ninja_12 | 星詠の忍者 | 上級職 | 星詠の忍者の心得 | 星詠・影分身 | level:35 job:ninja_3 prof:5 kills:300 |
| ninja_13 | 黄昏の忍者 | 特殊職 | 黄昏の忍者の心得 | 黄昏・影分身 | level:55 job:ninja_7 prof:6 clear:{dungeon:d03,floor:30} |
| ninja_14 | 深淵の忍者 | 特殊職 | 深淵の忍者の心得 | 深淵・影分身 | level:55 job:ninja_8 prof:6 clear:{dungeon:d04,floor:30} |
| ninja_15 | 竜血の忍者 | 特殊職 | 竜血の忍者の心得 | 竜血・影分身 | level:55 job:ninja_10 prof:6 clear:{dungeon:d05,floor:30} |
| ninja_16 | 機巧の忍者 | 特殊職 | 機巧の忍者の心得 | 機巧・影分身 | level:55 job:ninja_9 prof:6 clear:{dungeon:d06,floor:30} |
| ninja_17 | 霊樹の忍者 | 特殊職 | 霊樹の忍者の心得 | 霊樹・影分身 | level:55 job:ninja_11 prof:6 clear:{dungeon:d07,floor:30} |
| ninja_18 | 時渡りの忍者 | 希少職 | 時渡りの忍者の心得 | 時渡り・影分身 | level:85 job:ninja_12 prof:8 boss:{diff:HARD,count:11} clear:{dungeon:d08,floor:60} |
| ninja_19 | 重界の忍者 | 希少職 | 重界の忍者の心得 | 重界・影分身 | level:85 job:ninja_14 prof:8 boss:{diff:HARD,count:11} clear:{dungeon:d09,floor:60} |
| ninja_20 | 虚無の忍者 | 希少職 | 虚無の忍者の心得 | 虚無・影分身 | level:85 job:ninja_13 prof:8 boss:{diff:HARD,count:11} clear:{dungeon:d10,floor:60} |
| ninja_21 | 神託の忍者 | 希少職 | 神託の忍者の心得 | 神託・影分身 | level:85 job:ninja_17 prof:8 boss:{diff:HARD,count:11} clear:{dungeon:d11,floor:60} |
| ninja_22 | 終焉の忍者 | 隠し職 | 終焉の忍者の心得 | 終焉・影分身 | level:120 job:ninja_20 prof:10 hidden:{abyssFloor:16} abyss:5 |
| ninja_23 | 原初の忍者 | 隠し職 | 原初の忍者の心得 | 原初・影分身 | level:120 job:ninja_21 prof:10 hidden:{abyssFloor:16} abyss:5 |
| ninja_24 | 永劫の忍者 | 隠し職 | 永劫の忍者の心得 | 永劫・影分身 | level:120 job:ninja_18 prof:10 hidden:{abyssFloor:16} abyss:5 |
| thief_0 | 盗賊 | 基本職 | 盗賊の心得 | 煙玉 | level:1 |
| thief_1 | 炎刃の盗賊 | 応用職 | 炎刃の盗賊の心得 | 炎刃・煙玉 | level:15 job:thief_0 prof:3 |
| thief_2 | 氷霜の盗賊 | 応用職 | 氷霜の盗賊の心得 | 氷霜・煙玉 | level:15 job:thief_0 prof:3 |
| thief_3 | 迅雷の盗賊 | 応用職 | 迅雷の盗賊の心得 | 迅雷・煙玉 | level:15 job:thief_0 prof:3 |
| thief_4 | 疾風の盗賊 | 応用職 | 疾風の盗賊の心得 | 疾風・煙玉 | level:15 job:thief_0 prof:3 |
| thief_5 | 大地の盗賊 | 応用職 | 大地の盗賊の心得 | 大地・煙玉 | level:15 job:thief_0 prof:3 |
| thief_6 | 流水の盗賊 | 応用職 | 流水の盗賊の心得 | 流水・煙玉 | level:15 job:thief_0 prof:3 |
| thief_7 | 聖光の盗賊 | 上級職 | 聖光の盗賊の心得 | 聖光・煙玉 | level:35 job:thief_6 prof:5 kills:300 |
| thief_8 | 闇夜の盗賊 | 上級職 | 闇夜の盗賊の心得 | 闇夜・煙玉 | level:35 job:thief_4 prof:5 kills:300 |
| thief_9 | 鋼鉄の盗賊 | 上級職 | 鋼鉄の盗賊の心得 | 鋼鉄・煙玉 | level:35 job:thief_5 prof:5 kills:300 |
| thief_10 | 血盟の盗賊 | 上級職 | 血盟の盗賊の心得 | 血盟・煙玉 | level:35 job:thief_1 prof:5 kills:300 |
| thief_11 | 幻影の盗賊 | 上級職 | 幻影の盗賊の心得 | 幻影・煙玉 | level:35 job:thief_2 prof:5 kills:300 |
| thief_12 | 星詠の盗賊 | 上級職 | 星詠の盗賊の心得 | 星詠・煙玉 | level:35 job:thief_3 prof:5 kills:300 |
| thief_13 | 黄昏の盗賊 | 特殊職 | 黄昏の盗賊の心得 | 黄昏・煙玉 | level:55 job:thief_7 prof:6 clear:{dungeon:d03,floor:30} |
| thief_14 | 深淵の盗賊 | 特殊職 | 深淵の盗賊の心得 | 深淵・煙玉 | level:55 job:thief_8 prof:6 clear:{dungeon:d04,floor:30} |
| thief_15 | 竜血の盗賊 | 特殊職 | 竜血の盗賊の心得 | 竜血・煙玉 | level:55 job:thief_10 prof:6 clear:{dungeon:d05,floor:30} |
| thief_16 | 機巧の盗賊 | 特殊職 | 機巧の盗賊の心得 | 機巧・煙玉 | level:55 job:thief_9 prof:6 clear:{dungeon:d06,floor:30} |
| thief_17 | 霊樹の盗賊 | 特殊職 | 霊樹の盗賊の心得 | 霊樹・煙玉 | level:55 job:thief_11 prof:6 clear:{dungeon:d07,floor:30} |
| thief_18 | 時渡りの盗賊 | 希少職 | 時渡りの盗賊の心得 | 時渡り・煙玉 | level:85 job:thief_12 prof:8 boss:{diff:HARD,count:12} clear:{dungeon:d08,floor:60} |
| thief_19 | 重界の盗賊 | 希少職 | 重界の盗賊の心得 | 重界・煙玉 | level:85 job:thief_14 prof:8 boss:{diff:HARD,count:12} clear:{dungeon:d09,floor:60} |
| thief_20 | 虚無の盗賊 | 希少職 | 虚無の盗賊の心得 | 虚無・煙玉 | level:85 job:thief_13 prof:8 boss:{diff:HARD,count:12} clear:{dungeon:d10,floor:60} |
| thief_21 | 神託の盗賊 | 希少職 | 神託の盗賊の心得 | 神託・煙玉 | level:85 job:thief_17 prof:8 boss:{diff:HARD,count:12} clear:{dungeon:d11,floor:60} |
| thief_22 | 終焉の盗賊 | 隠し職 | 終焉の盗賊の心得 | 終焉・煙玉 | level:120 job:thief_20 prof:10 hidden:{npcBond:80} abyss:6 |
| thief_23 | 原初の盗賊 | 隠し職 | 原初の盗賊の心得 | 原初・煙玉 | level:120 job:thief_21 prof:10 hidden:{npcBond:80} abyss:6 |
| thief_24 | 永劫の盗賊 | 隠し職 | 永劫の盗賊の心得 | 永劫・煙玉 | level:120 job:thief_18 prof:10 hidden:{npcBond:80} abyss:6 |
| assassin_0 | 暗殺者 | 基本職 | 暗殺者の心得 | 暗殺 | level:1 |
| assassin_1 | 炎刃の暗殺者 | 応用職 | 炎刃の暗殺者の心得 | 炎刃・暗殺 | level:15 job:assassin_0 prof:3 |
| assassin_2 | 氷霜の暗殺者 | 応用職 | 氷霜の暗殺者の心得 | 氷霜・暗殺 | level:15 job:assassin_0 prof:3 |
| assassin_3 | 迅雷の暗殺者 | 応用職 | 迅雷の暗殺者の心得 | 迅雷・暗殺 | level:15 job:assassin_0 prof:3 |
| assassin_4 | 疾風の暗殺者 | 応用職 | 疾風の暗殺者の心得 | 疾風・暗殺 | level:15 job:assassin_0 prof:3 |
| assassin_5 | 大地の暗殺者 | 応用職 | 大地の暗殺者の心得 | 大地・暗殺 | level:15 job:assassin_0 prof:3 |
| assassin_6 | 流水の暗殺者 | 応用職 | 流水の暗殺者の心得 | 流水・暗殺 | level:15 job:assassin_0 prof:3 |
| assassin_7 | 聖光の暗殺者 | 上級職 | 聖光の暗殺者の心得 | 聖光・暗殺 | level:35 job:assassin_6 prof:5 kills:300 |
| assassin_8 | 闇夜の暗殺者 | 上級職 | 闇夜の暗殺者の心得 | 闇夜・暗殺 | level:35 job:assassin_4 prof:5 kills:300 |
| assassin_9 | 鋼鉄の暗殺者 | 上級職 | 鋼鉄の暗殺者の心得 | 鋼鉄・暗殺 | level:35 job:assassin_5 prof:5 kills:300 |
| assassin_10 | 血盟の暗殺者 | 上級職 | 血盟の暗殺者の心得 | 血盟・暗殺 | level:35 job:assassin_1 prof:5 kills:300 |
| assassin_11 | 幻影の暗殺者 | 上級職 | 幻影の暗殺者の心得 | 幻影・暗殺 | level:35 job:assassin_2 prof:5 kills:300 |
| assassin_12 | 星詠の暗殺者 | 上級職 | 星詠の暗殺者の心得 | 星詠・暗殺 | level:35 job:assassin_3 prof:5 kills:300 |
| assassin_13 | 黄昏の暗殺者 | 特殊職 | 黄昏の暗殺者の心得 | 黄昏・暗殺 | level:55 job:assassin_7 prof:6 clear:{dungeon:d03,floor:30} |
| assassin_14 | 深淵の暗殺者 | 特殊職 | 深淵の暗殺者の心得 | 深淵・暗殺 | level:55 job:assassin_8 prof:6 clear:{dungeon:d04,floor:30} |
| assassin_15 | 竜血の暗殺者 | 特殊職 | 竜血の暗殺者の心得 | 竜血・暗殺 | level:55 job:assassin_10 prof:6 clear:{dungeon:d05,floor:30} |
| assassin_16 | 機巧の暗殺者 | 特殊職 | 機巧の暗殺者の心得 | 機巧・暗殺 | level:55 job:assassin_9 prof:6 clear:{dungeon:d06,floor:30} |
| assassin_17 | 霊樹の暗殺者 | 特殊職 | 霊樹の暗殺者の心得 | 霊樹・暗殺 | level:55 job:assassin_11 prof:6 clear:{dungeon:d07,floor:30} |
| assassin_18 | 時渡りの暗殺者 | 希少職 | 時渡りの暗殺者の心得 | 時渡り・暗殺 | level:85 job:assassin_12 prof:8 boss:{diff:HARD,count:13} clear:{dungeon:d08,floor:60} |
| assassin_19 | 重界の暗殺者 | 希少職 | 重界の暗殺者の心得 | 重界・暗殺 | level:85 job:assassin_14 prof:8 boss:{diff:HARD,count:13} clear:{dungeon:d09,floor:60} |
| assassin_20 | 虚無の暗殺者 | 希少職 | 虚無の暗殺者の心得 | 虚無・暗殺 | level:85 job:assassin_13 prof:8 boss:{diff:HARD,count:13} clear:{dungeon:d10,floor:60} |
| assassin_21 | 神託の暗殺者 | 希少職 | 神託の暗殺者の心得 | 神託・暗殺 | level:85 job:assassin_17 prof:8 boss:{diff:HARD,count:13} clear:{dungeon:d11,floor:60} |
| assassin_22 | 終焉の暗殺者 | 隠し職 | 終焉の暗殺者の心得 | 終焉・暗殺 | level:120 job:assassin_20 prof:10 hidden:{item:relic_end} abyss:7 |
| assassin_23 | 原初の暗殺者 | 隠し職 | 原初の暗殺者の心得 | 原初・暗殺 | level:120 job:assassin_21 prof:10 hidden:{item:relic_origin} abyss:7 |
| assassin_24 | 永劫の暗殺者 | 隠し職 | 永劫の暗殺者の心得 | 永劫・暗殺 | level:120 job:assassin_18 prof:10 hidden:{item:relic_eternity} abyss:7 |
| hunter_0 | 狩人 | 基本職 | 狩人の心得 | 狩猟罠 | level:1 |
| hunter_1 | 炎刃の狩人 | 応用職 | 炎刃の狩人の心得 | 炎刃・狩猟罠 | level:15 job:hunter_0 prof:3 |
| hunter_2 | 氷霜の狩人 | 応用職 | 氷霜の狩人の心得 | 氷霜・狩猟罠 | level:15 job:hunter_0 prof:3 |
| hunter_3 | 迅雷の狩人 | 応用職 | 迅雷の狩人の心得 | 迅雷・狩猟罠 | level:15 job:hunter_0 prof:3 |
| hunter_4 | 疾風の狩人 | 応用職 | 疾風の狩人の心得 | 疾風・狩猟罠 | level:15 job:hunter_0 prof:3 |
| hunter_5 | 大地の狩人 | 応用職 | 大地の狩人の心得 | 大地・狩猟罠 | level:15 job:hunter_0 prof:3 |
| hunter_6 | 流水の狩人 | 応用職 | 流水の狩人の心得 | 流水・狩猟罠 | level:15 job:hunter_0 prof:3 |
| hunter_7 | 聖光の狩人 | 上級職 | 聖光の狩人の心得 | 聖光・狩猟罠 | level:35 job:hunter_6 prof:5 kills:300 |
| hunter_8 | 闇夜の狩人 | 上級職 | 闇夜の狩人の心得 | 闇夜・狩猟罠 | level:35 job:hunter_4 prof:5 kills:300 |
| hunter_9 | 鋼鉄の狩人 | 上級職 | 鋼鉄の狩人の心得 | 鋼鉄・狩猟罠 | level:35 job:hunter_5 prof:5 kills:300 |
| hunter_10 | 血盟の狩人 | 上級職 | 血盟の狩人の心得 | 血盟・狩猟罠 | level:35 job:hunter_1 prof:5 kills:300 |
| hunter_11 | 幻影の狩人 | 上級職 | 幻影の狩人の心得 | 幻影・狩猟罠 | level:35 job:hunter_2 prof:5 kills:300 |
| hunter_12 | 星詠の狩人 | 上級職 | 星詠の狩人の心得 | 星詠・狩猟罠 | level:35 job:hunter_3 prof:5 kills:300 |
| hunter_13 | 黄昏の狩人 | 特殊職 | 黄昏の狩人の心得 | 黄昏・狩猟罠 | level:55 job:hunter_7 prof:6 clear:{dungeon:d03,floor:30} |
| hunter_14 | 深淵の狩人 | 特殊職 | 深淵の狩人の心得 | 深淵・狩猟罠 | level:55 job:hunter_8 prof:6 clear:{dungeon:d04,floor:30} |
| hunter_15 | 竜血の狩人 | 特殊職 | 竜血の狩人の心得 | 竜血・狩猟罠 | level:55 job:hunter_10 prof:6 clear:{dungeon:d05,floor:30} |
| hunter_16 | 機巧の狩人 | 特殊職 | 機巧の狩人の心得 | 機巧・狩猟罠 | level:55 job:hunter_9 prof:6 clear:{dungeon:d06,floor:30} |
| hunter_17 | 霊樹の狩人 | 特殊職 | 霊樹の狩人の心得 | 霊樹・狩猟罠 | level:55 job:hunter_11 prof:6 clear:{dungeon:d07,floor:30} |
| hunter_18 | 時渡りの狩人 | 希少職 | 時渡りの狩人の心得 | 時渡り・狩猟罠 | level:85 job:hunter_12 prof:8 boss:{diff:HARD,count:14} clear:{dungeon:d08,floor:60} |
| hunter_19 | 重界の狩人 | 希少職 | 重界の狩人の心得 | 重界・狩猟罠 | level:85 job:hunter_14 prof:8 boss:{diff:HARD,count:14} clear:{dungeon:d09,floor:60} |
| hunter_20 | 虚無の狩人 | 希少職 | 虚無の狩人の心得 | 虚無・狩猟罠 | level:85 job:hunter_13 prof:8 boss:{diff:HARD,count:14} clear:{dungeon:d10,floor:60} |
| hunter_21 | 神託の狩人 | 希少職 | 神託の狩人の心得 | 神託・狩猟罠 | level:85 job:hunter_17 prof:8 boss:{diff:HARD,count:14} clear:{dungeon:d11,floor:60} |
| hunter_22 | 終焉の狩人 | 隠し職 | 終焉の狩人の心得 | 終焉・狩猟罠 | level:120 job:hunter_20 prof:10 hidden:{abyssFloor:19} abyss:8 |
| hunter_23 | 原初の狩人 | 隠し職 | 原初の狩人の心得 | 原初・狩猟罠 | level:120 job:hunter_21 prof:10 hidden:{abyssFloor:19} abyss:8 |
| hunter_24 | 永劫の狩人 | 隠し職 | 永劫の狩人の心得 | 永劫・狩猟罠 | level:120 job:hunter_18 prof:10 hidden:{abyssFloor:19} abyss:8 |
| scout_0 | 斥候 | 基本職 | 斥候の心得 | 鷹の目 | level:1 |
| scout_1 | 炎刃の斥候 | 応用職 | 炎刃の斥候の心得 | 炎刃・鷹の目 | level:15 job:scout_0 prof:3 |
| scout_2 | 氷霜の斥候 | 応用職 | 氷霜の斥候の心得 | 氷霜・鷹の目 | level:15 job:scout_0 prof:3 |
| scout_3 | 迅雷の斥候 | 応用職 | 迅雷の斥候の心得 | 迅雷・鷹の目 | level:15 job:scout_0 prof:3 |
| scout_4 | 疾風の斥候 | 応用職 | 疾風の斥候の心得 | 疾風・鷹の目 | level:15 job:scout_0 prof:3 |
| scout_5 | 大地の斥候 | 応用職 | 大地の斥候の心得 | 大地・鷹の目 | level:15 job:scout_0 prof:3 |
| scout_6 | 流水の斥候 | 応用職 | 流水の斥候の心得 | 流水・鷹の目 | level:15 job:scout_0 prof:3 |
| scout_7 | 聖光の斥候 | 上級職 | 聖光の斥候の心得 | 聖光・鷹の目 | level:35 job:scout_6 prof:5 kills:300 |
| scout_8 | 闇夜の斥候 | 上級職 | 闇夜の斥候の心得 | 闇夜・鷹の目 | level:35 job:scout_4 prof:5 kills:300 |
| scout_9 | 鋼鉄の斥候 | 上級職 | 鋼鉄の斥候の心得 | 鋼鉄・鷹の目 | level:35 job:scout_5 prof:5 kills:300 |
| scout_10 | 血盟の斥候 | 上級職 | 血盟の斥候の心得 | 血盟・鷹の目 | level:35 job:scout_1 prof:5 kills:300 |
| scout_11 | 幻影の斥候 | 上級職 | 幻影の斥候の心得 | 幻影・鷹の目 | level:35 job:scout_2 prof:5 kills:300 |
| scout_12 | 星詠の斥候 | 上級職 | 星詠の斥候の心得 | 星詠・鷹の目 | level:35 job:scout_3 prof:5 kills:300 |
| scout_13 | 黄昏の斥候 | 特殊職 | 黄昏の斥候の心得 | 黄昏・鷹の目 | level:55 job:scout_7 prof:6 clear:{dungeon:d03,floor:30} |
| scout_14 | 深淵の斥候 | 特殊職 | 深淵の斥候の心得 | 深淵・鷹の目 | level:55 job:scout_8 prof:6 clear:{dungeon:d04,floor:30} |
| scout_15 | 竜血の斥候 | 特殊職 | 竜血の斥候の心得 | 竜血・鷹の目 | level:55 job:scout_10 prof:6 clear:{dungeon:d05,floor:30} |
| scout_16 | 機巧の斥候 | 特殊職 | 機巧の斥候の心得 | 機巧・鷹の目 | level:55 job:scout_9 prof:6 clear:{dungeon:d06,floor:30} |
| scout_17 | 霊樹の斥候 | 特殊職 | 霊樹の斥候の心得 | 霊樹・鷹の目 | level:55 job:scout_11 prof:6 clear:{dungeon:d07,floor:30} |
| scout_18 | 時渡りの斥候 | 希少職 | 時渡りの斥候の心得 | 時渡り・鷹の目 | level:85 job:scout_12 prof:8 boss:{diff:HARD,count:10} clear:{dungeon:d08,floor:60} |
| scout_19 | 重界の斥候 | 希少職 | 重界の斥候の心得 | 重界・鷹の目 | level:85 job:scout_14 prof:8 boss:{diff:HARD,count:10} clear:{dungeon:d09,floor:60} |
| scout_20 | 虚無の斥候 | 希少職 | 虚無の斥候の心得 | 虚無・鷹の目 | level:85 job:scout_13 prof:8 boss:{diff:HARD,count:10} clear:{dungeon:d10,floor:60} |
| scout_21 | 神託の斥候 | 希少職 | 神託の斥候の心得 | 神託・鷹の目 | level:85 job:scout_17 prof:8 boss:{diff:HARD,count:10} clear:{dungeon:d11,floor:60} |
| scout_22 | 終焉の斥候 | 隠し職 | 終焉の斥候の心得 | 終焉・鷹の目 | level:120 job:scout_20 prof:10 hidden:{npcBond:80} abyss:9 |
| scout_23 | 原初の斥候 | 隠し職 | 原初の斥候の心得 | 原初・鷹の目 | level:120 job:scout_21 prof:10 hidden:{npcBond:80} abyss:9 |
| scout_24 | 永劫の斥候 | 隠し職 | 永劫の斥候の心得 | 永劫・鷹の目 | level:120 job:scout_18 prof:10 hidden:{npcBond:80} abyss:9 |
| mage_0 | 魔術師 | 基本職 | 魔術師の心得 | 魔力暴走 | level:1 |
| mage_1 | 炎刃の魔術師 | 応用職 | 炎刃の魔術師の心得 | 炎刃・魔力暴走 | level:15 job:mage_0 prof:3 |
| mage_2 | 氷霜の魔術師 | 応用職 | 氷霜の魔術師の心得 | 氷霜・魔力暴走 | level:15 job:mage_0 prof:3 |
| mage_3 | 迅雷の魔術師 | 応用職 | 迅雷の魔術師の心得 | 迅雷・魔力暴走 | level:15 job:mage_0 prof:3 |
| mage_4 | 疾風の魔術師 | 応用職 | 疾風の魔術師の心得 | 疾風・魔力暴走 | level:15 job:mage_0 prof:3 |
| mage_5 | 大地の魔術師 | 応用職 | 大地の魔術師の心得 | 大地・魔力暴走 | level:15 job:mage_0 prof:3 |
| mage_6 | 流水の魔術師 | 応用職 | 流水の魔術師の心得 | 流水・魔力暴走 | level:15 job:mage_0 prof:3 |
| mage_7 | 聖光の魔術師 | 上級職 | 聖光の魔術師の心得 | 聖光・魔力暴走 | level:35 job:mage_6 prof:5 kills:300 |
| mage_8 | 闇夜の魔術師 | 上級職 | 闇夜の魔術師の心得 | 闇夜・魔力暴走 | level:35 job:mage_4 prof:5 kills:300 |
| mage_9 | 鋼鉄の魔術師 | 上級職 | 鋼鉄の魔術師の心得 | 鋼鉄・魔力暴走 | level:35 job:mage_5 prof:5 kills:300 |
| mage_10 | 血盟の魔術師 | 上級職 | 血盟の魔術師の心得 | 血盟・魔力暴走 | level:35 job:mage_1 prof:5 kills:300 |
| mage_11 | 幻影の魔術師 | 上級職 | 幻影の魔術師の心得 | 幻影・魔力暴走 | level:35 job:mage_2 prof:5 kills:300 |
| mage_12 | 星詠の魔術師 | 上級職 | 星詠の魔術師の心得 | 星詠・魔力暴走 | level:35 job:mage_3 prof:5 kills:300 |
| mage_13 | 黄昏の魔術師 | 特殊職 | 黄昏の魔術師の心得 | 黄昏・魔力暴走 | level:55 job:mage_7 prof:6 clear:{dungeon:d03,floor:30} |
| mage_14 | 深淵の魔術師 | 特殊職 | 深淵の魔術師の心得 | 深淵・魔力暴走 | level:55 job:mage_8 prof:6 clear:{dungeon:d04,floor:30} |
| mage_15 | 竜血の魔術師 | 特殊職 | 竜血の魔術師の心得 | 竜血・魔力暴走 | level:55 job:mage_10 prof:6 clear:{dungeon:d05,floor:30} |
| mage_16 | 機巧の魔術師 | 特殊職 | 機巧の魔術師の心得 | 機巧・魔力暴走 | level:55 job:mage_9 prof:6 clear:{dungeon:d06,floor:30} |
| mage_17 | 霊樹の魔術師 | 特殊職 | 霊樹の魔術師の心得 | 霊樹・魔力暴走 | level:55 job:mage_11 prof:6 clear:{dungeon:d07,floor:30} |
| mage_18 | 時渡りの魔術師 | 希少職 | 時渡りの魔術師の心得 | 時渡り・魔力暴走 | level:85 job:mage_12 prof:8 boss:{diff:HARD,count:11} clear:{dungeon:d08,floor:60} |
| mage_19 | 重界の魔術師 | 希少職 | 重界の魔術師の心得 | 重界・魔力暴走 | level:85 job:mage_14 prof:8 boss:{diff:HARD,count:11} clear:{dungeon:d09,floor:60} |
| mage_20 | 虚無の魔術師 | 希少職 | 虚無の魔術師の心得 | 虚無・魔力暴走 | level:85 job:mage_13 prof:8 boss:{diff:HARD,count:11} clear:{dungeon:d10,floor:60} |
| mage_21 | 神託の魔術師 | 希少職 | 神託の魔術師の心得 | 神託・魔力暴走 | level:85 job:mage_17 prof:8 boss:{diff:HARD,count:11} clear:{dungeon:d11,floor:60} |
| mage_22 | 終焉の魔術師 | 隠し職 | 終焉の魔術師の心得 | 終焉・魔力暴走 | level:120 job:mage_20 prof:10 hidden:{item:relic_end} abyss:10 |
| mage_23 | 原初の魔術師 | 隠し職 | 原初の魔術師の心得 | 原初・魔力暴走 | level:120 job:mage_21 prof:10 hidden:{item:relic_origin} abyss:10 |
| mage_24 | 永劫の魔術師 | 隠し職 | 永劫の魔術師の心得 | 永劫・魔力暴走 | level:120 job:mage_18 prof:10 hidden:{item:relic_eternity} abyss:10 |
| sorcerer_0 | 妖術師 | 基本職 | 妖術師の心得 | 妖術陣 | level:7 |
| sorcerer_1 | 炎刃の妖術師 | 応用職 | 炎刃の妖術師の心得 | 炎刃・妖術陣 | level:15 job:sorcerer_0 prof:3 |
| sorcerer_2 | 氷霜の妖術師 | 応用職 | 氷霜の妖術師の心得 | 氷霜・妖術陣 | level:15 job:sorcerer_0 prof:3 |
| sorcerer_3 | 迅雷の妖術師 | 応用職 | 迅雷の妖術師の心得 | 迅雷・妖術陣 | level:15 job:sorcerer_0 prof:3 |
| sorcerer_4 | 疾風の妖術師 | 応用職 | 疾風の妖術師の心得 | 疾風・妖術陣 | level:15 job:sorcerer_0 prof:3 |
| sorcerer_5 | 大地の妖術師 | 応用職 | 大地の妖術師の心得 | 大地・妖術陣 | level:15 job:sorcerer_0 prof:3 |
| sorcerer_6 | 流水の妖術師 | 応用職 | 流水の妖術師の心得 | 流水・妖術陣 | level:15 job:sorcerer_0 prof:3 |
| sorcerer_7 | 聖光の妖術師 | 上級職 | 聖光の妖術師の心得 | 聖光・妖術陣 | level:35 job:sorcerer_6 prof:5 kills:300 |
| sorcerer_8 | 闇夜の妖術師 | 上級職 | 闇夜の妖術師の心得 | 闇夜・妖術陣 | level:35 job:sorcerer_4 prof:5 kills:300 |
| sorcerer_9 | 鋼鉄の妖術師 | 上級職 | 鋼鉄の妖術師の心得 | 鋼鉄・妖術陣 | level:35 job:sorcerer_5 prof:5 kills:300 |
| sorcerer_10 | 血盟の妖術師 | 上級職 | 血盟の妖術師の心得 | 血盟・妖術陣 | level:35 job:sorcerer_1 prof:5 kills:300 |
| sorcerer_11 | 幻影の妖術師 | 上級職 | 幻影の妖術師の心得 | 幻影・妖術陣 | level:35 job:sorcerer_2 prof:5 kills:300 |
| sorcerer_12 | 星詠の妖術師 | 上級職 | 星詠の妖術師の心得 | 星詠・妖術陣 | level:35 job:sorcerer_3 prof:5 kills:300 |
| sorcerer_13 | 黄昏の妖術師 | 特殊職 | 黄昏の妖術師の心得 | 黄昏・妖術陣 | level:55 job:sorcerer_7 prof:6 clear:{dungeon:d03,floor:30} |
| sorcerer_14 | 深淵の妖術師 | 特殊職 | 深淵の妖術師の心得 | 深淵・妖術陣 | level:55 job:sorcerer_8 prof:6 clear:{dungeon:d04,floor:30} |
| sorcerer_15 | 竜血の妖術師 | 特殊職 | 竜血の妖術師の心得 | 竜血・妖術陣 | level:55 job:sorcerer_10 prof:6 clear:{dungeon:d05,floor:30} |
| sorcerer_16 | 機巧の妖術師 | 特殊職 | 機巧の妖術師の心得 | 機巧・妖術陣 | level:55 job:sorcerer_9 prof:6 clear:{dungeon:d06,floor:30} |
| sorcerer_17 | 霊樹の妖術師 | 特殊職 | 霊樹の妖術師の心得 | 霊樹・妖術陣 | level:55 job:sorcerer_11 prof:6 clear:{dungeon:d07,floor:30} |
| sorcerer_18 | 時渡りの妖術師 | 希少職 | 時渡りの妖術師の心得 | 時渡り・妖術陣 | level:85 job:sorcerer_12 prof:8 boss:{diff:HARD,count:12} clear:{dungeon:d08,floor:60} |
| sorcerer_19 | 重界の妖術師 | 希少職 | 重界の妖術師の心得 | 重界・妖術陣 | level:85 job:sorcerer_14 prof:8 boss:{diff:HARD,count:12} clear:{dungeon:d09,floor:60} |
| sorcerer_20 | 虚無の妖術師 | 希少職 | 虚無の妖術師の心得 | 虚無・妖術陣 | level:85 job:sorcerer_13 prof:8 boss:{diff:HARD,count:12} clear:{dungeon:d10,floor:60} |
| sorcerer_21 | 神託の妖術師 | 希少職 | 神託の妖術師の心得 | 神託・妖術陣 | level:85 job:sorcerer_17 prof:8 boss:{diff:HARD,count:12} clear:{dungeon:d11,floor:60} |
| sorcerer_22 | 終焉の妖術師 | 隠し職 | 終焉の妖術師の心得 | 終焉・妖術陣 | level:120 job:sorcerer_20 prof:10 hidden:{abyssFloor:12} abyss:5 |
| sorcerer_23 | 原初の妖術師 | 隠し職 | 原初の妖術師の心得 | 原初・妖術陣 | level:120 job:sorcerer_21 prof:10 hidden:{abyssFloor:12} abyss:5 |
| sorcerer_24 | 永劫の妖術師 | 隠し職 | 永劫の妖術師の心得 | 永劫・妖術陣 | level:120 job:sorcerer_18 prof:10 hidden:{abyssFloor:12} abyss:5 |
| summoner_0 | 召喚士 | 基本職 | 召喚士の心得 | 召喚 | level:9 |
| summoner_1 | 炎刃の召喚士 | 応用職 | 炎刃の召喚士の心得 | 炎刃・召喚 | level:15 job:summoner_0 prof:3 |
| summoner_2 | 氷霜の召喚士 | 応用職 | 氷霜の召喚士の心得 | 氷霜・召喚 | level:15 job:summoner_0 prof:3 |
| summoner_3 | 迅雷の召喚士 | 応用職 | 迅雷の召喚士の心得 | 迅雷・召喚 | level:15 job:summoner_0 prof:3 |
| summoner_4 | 疾風の召喚士 | 応用職 | 疾風の召喚士の心得 | 疾風・召喚 | level:15 job:summoner_0 prof:3 |
| summoner_5 | 大地の召喚士 | 応用職 | 大地の召喚士の心得 | 大地・召喚 | level:15 job:summoner_0 prof:3 |
| summoner_6 | 流水の召喚士 | 応用職 | 流水の召喚士の心得 | 流水・召喚 | level:15 job:summoner_0 prof:3 |
| summoner_7 | 聖光の召喚士 | 上級職 | 聖光の召喚士の心得 | 聖光・召喚 | level:35 job:summoner_6 prof:5 kills:300 |
| summoner_8 | 闇夜の召喚士 | 上級職 | 闇夜の召喚士の心得 | 闇夜・召喚 | level:35 job:summoner_4 prof:5 kills:300 |
| summoner_9 | 鋼鉄の召喚士 | 上級職 | 鋼鉄の召喚士の心得 | 鋼鉄・召喚 | level:35 job:summoner_5 prof:5 kills:300 |
| summoner_10 | 血盟の召喚士 | 上級職 | 血盟の召喚士の心得 | 血盟・召喚 | level:35 job:summoner_1 prof:5 kills:300 |
| summoner_11 | 幻影の召喚士 | 上級職 | 幻影の召喚士の心得 | 幻影・召喚 | level:35 job:summoner_2 prof:5 kills:300 |
| summoner_12 | 星詠の召喚士 | 上級職 | 星詠の召喚士の心得 | 星詠・召喚 | level:35 job:summoner_3 prof:5 kills:300 |
| summoner_13 | 黄昏の召喚士 | 特殊職 | 黄昏の召喚士の心得 | 黄昏・召喚 | level:55 job:summoner_7 prof:6 clear:{dungeon:d03,floor:30} |
| summoner_14 | 深淵の召喚士 | 特殊職 | 深淵の召喚士の心得 | 深淵・召喚 | level:55 job:summoner_8 prof:6 clear:{dungeon:d04,floor:30} |
| summoner_15 | 竜血の召喚士 | 特殊職 | 竜血の召喚士の心得 | 竜血・召喚 | level:55 job:summoner_10 prof:6 clear:{dungeon:d05,floor:30} |
| summoner_16 | 機巧の召喚士 | 特殊職 | 機巧の召喚士の心得 | 機巧・召喚 | level:55 job:summoner_9 prof:6 clear:{dungeon:d06,floor:30} |
| summoner_17 | 霊樹の召喚士 | 特殊職 | 霊樹の召喚士の心得 | 霊樹・召喚 | level:55 job:summoner_11 prof:6 clear:{dungeon:d07,floor:30} |
| summoner_18 | 時渡りの召喚士 | 希少職 | 時渡りの召喚士の心得 | 時渡り・召喚 | level:85 job:summoner_12 prof:8 boss:{diff:HARD,count:13} clear:{dungeon:d08,floor:60} |
| summoner_19 | 重界の召喚士 | 希少職 | 重界の召喚士の心得 | 重界・召喚 | level:85 job:summoner_14 prof:8 boss:{diff:HARD,count:13} clear:{dungeon:d09,floor:60} |
| summoner_20 | 虚無の召喚士 | 希少職 | 虚無の召喚士の心得 | 虚無・召喚 | level:85 job:summoner_13 prof:8 boss:{diff:HARD,count:13} clear:{dungeon:d10,floor:60} |
| summoner_21 | 神託の召喚士 | 希少職 | 神託の召喚士の心得 | 神託・召喚 | level:85 job:summoner_17 prof:8 boss:{diff:HARD,count:13} clear:{dungeon:d11,floor:60} |
| summoner_22 | 終焉の召喚士 | 隠し職 | 終焉の召喚士の心得 | 終焉・召喚 | level:120 job:summoner_20 prof:10 hidden:{npcBond:80} abyss:6 |
| summoner_23 | 原初の召喚士 | 隠し職 | 原初の召喚士の心得 | 原初・召喚 | level:120 job:summoner_21 prof:10 hidden:{npcBond:80} abyss:6 |
| summoner_24 | 永劫の召喚士 | 隠し職 | 永劫の召喚士の心得 | 永劫・召喚 | level:120 job:summoner_18 prof:10 hidden:{npcBond:80} abyss:6 |
| necromancer_0 | 死霊術師 | 基本職 | 死霊術師の心得 | 死者の軍勢 | level:11 |
| necromancer_1 | 炎刃の死霊術師 | 応用職 | 炎刃の死霊術師の心得 | 炎刃・死者の軍勢 | level:15 job:necromancer_0 prof:3 |
| necromancer_2 | 氷霜の死霊術師 | 応用職 | 氷霜の死霊術師の心得 | 氷霜・死者の軍勢 | level:15 job:necromancer_0 prof:3 |
| necromancer_3 | 迅雷の死霊術師 | 応用職 | 迅雷の死霊術師の心得 | 迅雷・死者の軍勢 | level:15 job:necromancer_0 prof:3 |
| necromancer_4 | 疾風の死霊術師 | 応用職 | 疾風の死霊術師の心得 | 疾風・死者の軍勢 | level:15 job:necromancer_0 prof:3 |
| necromancer_5 | 大地の死霊術師 | 応用職 | 大地の死霊術師の心得 | 大地・死者の軍勢 | level:15 job:necromancer_0 prof:3 |
| necromancer_6 | 流水の死霊術師 | 応用職 | 流水の死霊術師の心得 | 流水・死者の軍勢 | level:15 job:necromancer_0 prof:3 |
| necromancer_7 | 聖光の死霊術師 | 上級職 | 聖光の死霊術師の心得 | 聖光・死者の軍勢 | level:35 job:necromancer_6 prof:5 kills:300 |
| necromancer_8 | 闇夜の死霊術師 | 上級職 | 闇夜の死霊術師の心得 | 闇夜・死者の軍勢 | level:35 job:necromancer_4 prof:5 kills:300 |
| necromancer_9 | 鋼鉄の死霊術師 | 上級職 | 鋼鉄の死霊術師の心得 | 鋼鉄・死者の軍勢 | level:35 job:necromancer_5 prof:5 kills:300 |
| necromancer_10 | 血盟の死霊術師 | 上級職 | 血盟の死霊術師の心得 | 血盟・死者の軍勢 | level:35 job:necromancer_1 prof:5 kills:300 |
| necromancer_11 | 幻影の死霊術師 | 上級職 | 幻影の死霊術師の心得 | 幻影・死者の軍勢 | level:35 job:necromancer_2 prof:5 kills:300 |
| necromancer_12 | 星詠の死霊術師 | 上級職 | 星詠の死霊術師の心得 | 星詠・死者の軍勢 | level:35 job:necromancer_3 prof:5 kills:300 |
| necromancer_13 | 黄昏の死霊術師 | 特殊職 | 黄昏の死霊術師の心得 | 黄昏・死者の軍勢 | level:55 job:necromancer_7 prof:6 clear:{dungeon:d03,floor:30} |
| necromancer_14 | 深淵の死霊術師 | 特殊職 | 深淵の死霊術師の心得 | 深淵・死者の軍勢 | level:55 job:necromancer_8 prof:6 clear:{dungeon:d04,floor:30} |
| necromancer_15 | 竜血の死霊術師 | 特殊職 | 竜血の死霊術師の心得 | 竜血・死者の軍勢 | level:55 job:necromancer_10 prof:6 clear:{dungeon:d05,floor:30} |
| necromancer_16 | 機巧の死霊術師 | 特殊職 | 機巧の死霊術師の心得 | 機巧・死者の軍勢 | level:55 job:necromancer_9 prof:6 clear:{dungeon:d06,floor:30} |
| necromancer_17 | 霊樹の死霊術師 | 特殊職 | 霊樹の死霊術師の心得 | 霊樹・死者の軍勢 | level:55 job:necromancer_11 prof:6 clear:{dungeon:d07,floor:30} |
| necromancer_18 | 時渡りの死霊術師 | 希少職 | 時渡りの死霊術師の心得 | 時渡り・死者の軍勢 | level:85 job:necromancer_12 prof:8 boss:{diff:HARD,count:14} clear:{dungeon:d08,floor:60} |
| necromancer_19 | 重界の死霊術師 | 希少職 | 重界の死霊術師の心得 | 重界・死者の軍勢 | level:85 job:necromancer_14 prof:8 boss:{diff:HARD,count:14} clear:{dungeon:d09,floor:60} |
| necromancer_20 | 虚無の死霊術師 | 希少職 | 虚無の死霊術師の心得 | 虚無・死者の軍勢 | level:85 job:necromancer_13 prof:8 boss:{diff:HARD,count:14} clear:{dungeon:d10,floor:60} |
| necromancer_21 | 神託の死霊術師 | 希少職 | 神託の死霊術師の心得 | 神託・死者の軍勢 | level:85 job:necromancer_17 prof:8 boss:{diff:HARD,count:14} clear:{dungeon:d11,floor:60} |
| necromancer_22 | 終焉の死霊術師 | 隠し職 | 終焉の死霊術師の心得 | 終焉・死者の軍勢 | level:120 job:necromancer_20 prof:10 hidden:{item:relic_end} abyss:7 |
| necromancer_23 | 原初の死霊術師 | 隠し職 | 原初の死霊術師の心得 | 原初・死者の軍勢 | level:120 job:necromancer_21 prof:10 hidden:{item:relic_origin} abyss:7 |
| necromancer_24 | 永劫の死霊術師 | 隠し職 | 永劫の死霊術師の心得 | 永劫・死者の軍勢 | level:120 job:necromancer_18 prof:10 hidden:{item:relic_eternity} abyss:7 |
| elementalist_0 | 精霊使い | 基本職 | 精霊使いの心得 | 精霊契約 | level:13 |
| elementalist_1 | 炎刃の精霊使い | 応用職 | 炎刃の精霊使いの心得 | 炎刃・精霊契約 | level:15 job:elementalist_0 prof:3 |
| elementalist_2 | 氷霜の精霊使い | 応用職 | 氷霜の精霊使いの心得 | 氷霜・精霊契約 | level:15 job:elementalist_0 prof:3 |
| elementalist_3 | 迅雷の精霊使い | 応用職 | 迅雷の精霊使いの心得 | 迅雷・精霊契約 | level:15 job:elementalist_0 prof:3 |
| elementalist_4 | 疾風の精霊使い | 応用職 | 疾風の精霊使いの心得 | 疾風・精霊契約 | level:15 job:elementalist_0 prof:3 |
| elementalist_5 | 大地の精霊使い | 応用職 | 大地の精霊使いの心得 | 大地・精霊契約 | level:15 job:elementalist_0 prof:3 |
| elementalist_6 | 流水の精霊使い | 応用職 | 流水の精霊使いの心得 | 流水・精霊契約 | level:15 job:elementalist_0 prof:3 |
| elementalist_7 | 聖光の精霊使い | 上級職 | 聖光の精霊使いの心得 | 聖光・精霊契約 | level:35 job:elementalist_6 prof:5 kills:300 |
| elementalist_8 | 闇夜の精霊使い | 上級職 | 闇夜の精霊使いの心得 | 闇夜・精霊契約 | level:35 job:elementalist_4 prof:5 kills:300 |
| elementalist_9 | 鋼鉄の精霊使い | 上級職 | 鋼鉄の精霊使いの心得 | 鋼鉄・精霊契約 | level:35 job:elementalist_5 prof:5 kills:300 |
| elementalist_10 | 血盟の精霊使い | 上級職 | 血盟の精霊使いの心得 | 血盟・精霊契約 | level:35 job:elementalist_1 prof:5 kills:300 |
| elementalist_11 | 幻影の精霊使い | 上級職 | 幻影の精霊使いの心得 | 幻影・精霊契約 | level:35 job:elementalist_2 prof:5 kills:300 |
| elementalist_12 | 星詠の精霊使い | 上級職 | 星詠の精霊使いの心得 | 星詠・精霊契約 | level:35 job:elementalist_3 prof:5 kills:300 |
| elementalist_13 | 黄昏の精霊使い | 特殊職 | 黄昏の精霊使いの心得 | 黄昏・精霊契約 | level:55 job:elementalist_7 prof:6 clear:{dungeon:d03,floor:30} |
| elementalist_14 | 深淵の精霊使い | 特殊職 | 深淵の精霊使いの心得 | 深淵・精霊契約 | level:55 job:elementalist_8 prof:6 clear:{dungeon:d04,floor:30} |
| elementalist_15 | 竜血の精霊使い | 特殊職 | 竜血の精霊使いの心得 | 竜血・精霊契約 | level:55 job:elementalist_10 prof:6 clear:{dungeon:d05,floor:30} |
| elementalist_16 | 機巧の精霊使い | 特殊職 | 機巧の精霊使いの心得 | 機巧・精霊契約 | level:55 job:elementalist_9 prof:6 clear:{dungeon:d06,floor:30} |
| elementalist_17 | 霊樹の精霊使い | 特殊職 | 霊樹の精霊使いの心得 | 霊樹・精霊契約 | level:55 job:elementalist_11 prof:6 clear:{dungeon:d07,floor:30} |
| elementalist_18 | 時渡りの精霊使い | 希少職 | 時渡りの精霊使いの心得 | 時渡り・精霊契約 | level:85 job:elementalist_12 prof:8 boss:{diff:HARD,count:10} clear:{dungeon:d08,floor:60} |
| elementalist_19 | 重界の精霊使い | 希少職 | 重界の精霊使いの心得 | 重界・精霊契約 | level:85 job:elementalist_14 prof:8 boss:{diff:HARD,count:10} clear:{dungeon:d09,floor:60} |
| elementalist_20 | 虚無の精霊使い | 希少職 | 虚無の精霊使いの心得 | 虚無・精霊契約 | level:85 job:elementalist_13 prof:8 boss:{diff:HARD,count:10} clear:{dungeon:d10,floor:60} |
| elementalist_21 | 神託の精霊使い | 希少職 | 神託の精霊使いの心得 | 神託・精霊契約 | level:85 job:elementalist_17 prof:8 boss:{diff:HARD,count:10} clear:{dungeon:d11,floor:60} |
| elementalist_22 | 終焉の精霊使い | 隠し職 | 終焉の精霊使いの心得 | 終焉・精霊契約 | level:120 job:elementalist_20 prof:10 hidden:{abyssFloor:15} abyss:8 |
| elementalist_23 | 原初の精霊使い | 隠し職 | 原初の精霊使いの心得 | 原初・精霊契約 | level:120 job:elementalist_21 prof:10 hidden:{abyssFloor:15} abyss:8 |
| elementalist_24 | 永劫の精霊使い | 隠し職 | 永劫の精霊使いの心得 | 永劫・精霊契約 | level:120 job:elementalist_18 prof:10 hidden:{abyssFloor:15} abyss:8 |
| cleric_0 | 僧侶 | 基本職 | 僧侶の心得 | 癒しの光 | level:15 |
| cleric_1 | 炎刃の僧侶 | 応用職 | 炎刃の僧侶の心得 | 炎刃・癒しの光 | level:15 job:cleric_0 prof:3 |
| cleric_2 | 氷霜の僧侶 | 応用職 | 氷霜の僧侶の心得 | 氷霜・癒しの光 | level:15 job:cleric_0 prof:3 |
| cleric_3 | 迅雷の僧侶 | 応用職 | 迅雷の僧侶の心得 | 迅雷・癒しの光 | level:15 job:cleric_0 prof:3 |
| cleric_4 | 疾風の僧侶 | 応用職 | 疾風の僧侶の心得 | 疾風・癒しの光 | level:15 job:cleric_0 prof:3 |
| cleric_5 | 大地の僧侶 | 応用職 | 大地の僧侶の心得 | 大地・癒しの光 | level:15 job:cleric_0 prof:3 |
| cleric_6 | 流水の僧侶 | 応用職 | 流水の僧侶の心得 | 流水・癒しの光 | level:15 job:cleric_0 prof:3 |
| cleric_7 | 聖光の僧侶 | 上級職 | 聖光の僧侶の心得 | 聖光・癒しの光 | level:35 job:cleric_6 prof:5 kills:300 |
| cleric_8 | 闇夜の僧侶 | 上級職 | 闇夜の僧侶の心得 | 闇夜・癒しの光 | level:35 job:cleric_4 prof:5 kills:300 |
| cleric_9 | 鋼鉄の僧侶 | 上級職 | 鋼鉄の僧侶の心得 | 鋼鉄・癒しの光 | level:35 job:cleric_5 prof:5 kills:300 |
| cleric_10 | 血盟の僧侶 | 上級職 | 血盟の僧侶の心得 | 血盟・癒しの光 | level:35 job:cleric_1 prof:5 kills:300 |
| cleric_11 | 幻影の僧侶 | 上級職 | 幻影の僧侶の心得 | 幻影・癒しの光 | level:35 job:cleric_2 prof:5 kills:300 |
| cleric_12 | 星詠の僧侶 | 上級職 | 星詠の僧侶の心得 | 星詠・癒しの光 | level:35 job:cleric_3 prof:5 kills:300 |
| cleric_13 | 黄昏の僧侶 | 特殊職 | 黄昏の僧侶の心得 | 黄昏・癒しの光 | level:55 job:cleric_7 prof:6 clear:{dungeon:d03,floor:30} |
| cleric_14 | 深淵の僧侶 | 特殊職 | 深淵の僧侶の心得 | 深淵・癒しの光 | level:55 job:cleric_8 prof:6 clear:{dungeon:d04,floor:30} |
| cleric_15 | 竜血の僧侶 | 特殊職 | 竜血の僧侶の心得 | 竜血・癒しの光 | level:55 job:cleric_10 prof:6 clear:{dungeon:d05,floor:30} |
| cleric_16 | 機巧の僧侶 | 特殊職 | 機巧の僧侶の心得 | 機巧・癒しの光 | level:55 job:cleric_9 prof:6 clear:{dungeon:d06,floor:30} |
| cleric_17 | 霊樹の僧侶 | 特殊職 | 霊樹の僧侶の心得 | 霊樹・癒しの光 | level:55 job:cleric_11 prof:6 clear:{dungeon:d07,floor:30} |
| cleric_18 | 時渡りの僧侶 | 希少職 | 時渡りの僧侶の心得 | 時渡り・癒しの光 | level:85 job:cleric_12 prof:8 boss:{diff:HARD,count:11} clear:{dungeon:d08,floor:60} |
| cleric_19 | 重界の僧侶 | 希少職 | 重界の僧侶の心得 | 重界・癒しの光 | level:85 job:cleric_14 prof:8 boss:{diff:HARD,count:11} clear:{dungeon:d09,floor:60} |
| cleric_20 | 虚無の僧侶 | 希少職 | 虚無の僧侶の心得 | 虚無・癒しの光 | level:85 job:cleric_13 prof:8 boss:{diff:HARD,count:11} clear:{dungeon:d10,floor:60} |
| cleric_21 | 神託の僧侶 | 希少職 | 神託の僧侶の心得 | 神託・癒しの光 | level:85 job:cleric_17 prof:8 boss:{diff:HARD,count:11} clear:{dungeon:d11,floor:60} |
| cleric_22 | 終焉の僧侶 | 隠し職 | 終焉の僧侶の心得 | 終焉・癒しの光 | level:120 job:cleric_20 prof:10 hidden:{npcBond:80} abyss:9 |
| cleric_23 | 原初の僧侶 | 隠し職 | 原初の僧侶の心得 | 原初・癒しの光 | level:120 job:cleric_21 prof:10 hidden:{npcBond:80} abyss:9 |
| cleric_24 | 永劫の僧侶 | 隠し職 | 永劫の僧侶の心得 | 永劫・癒しの光 | level:120 job:cleric_18 prof:10 hidden:{npcBond:80} abyss:9 |
| paladin_0 | 聖騎士 | 基本職 | 聖騎士の心得 | 聖なる盾 | level:17 |
| paladin_1 | 炎刃の聖騎士 | 応用職 | 炎刃の聖騎士の心得 | 炎刃・聖なる盾 | level:15 job:paladin_0 prof:3 |
| paladin_2 | 氷霜の聖騎士 | 応用職 | 氷霜の聖騎士の心得 | 氷霜・聖なる盾 | level:15 job:paladin_0 prof:3 |
| paladin_3 | 迅雷の聖騎士 | 応用職 | 迅雷の聖騎士の心得 | 迅雷・聖なる盾 | level:15 job:paladin_0 prof:3 |
| paladin_4 | 疾風の聖騎士 | 応用職 | 疾風の聖騎士の心得 | 疾風・聖なる盾 | level:15 job:paladin_0 prof:3 |
| paladin_5 | 大地の聖騎士 | 応用職 | 大地の聖騎士の心得 | 大地・聖なる盾 | level:15 job:paladin_0 prof:3 |
| paladin_6 | 流水の聖騎士 | 応用職 | 流水の聖騎士の心得 | 流水・聖なる盾 | level:15 job:paladin_0 prof:3 |
| paladin_7 | 聖光の聖騎士 | 上級職 | 聖光の聖騎士の心得 | 聖光・聖なる盾 | level:35 job:paladin_6 prof:5 kills:300 |
| paladin_8 | 闇夜の聖騎士 | 上級職 | 闇夜の聖騎士の心得 | 闇夜・聖なる盾 | level:35 job:paladin_4 prof:5 kills:300 |
| paladin_9 | 鋼鉄の聖騎士 | 上級職 | 鋼鉄の聖騎士の心得 | 鋼鉄・聖なる盾 | level:35 job:paladin_5 prof:5 kills:300 |
| paladin_10 | 血盟の聖騎士 | 上級職 | 血盟の聖騎士の心得 | 血盟・聖なる盾 | level:35 job:paladin_1 prof:5 kills:300 |
| paladin_11 | 幻影の聖騎士 | 上級職 | 幻影の聖騎士の心得 | 幻影・聖なる盾 | level:35 job:paladin_2 prof:5 kills:300 |
| paladin_12 | 星詠の聖騎士 | 上級職 | 星詠の聖騎士の心得 | 星詠・聖なる盾 | level:35 job:paladin_3 prof:5 kills:300 |
| paladin_13 | 黄昏の聖騎士 | 特殊職 | 黄昏の聖騎士の心得 | 黄昏・聖なる盾 | level:55 job:paladin_7 prof:6 clear:{dungeon:d03,floor:30} |
| paladin_14 | 深淵の聖騎士 | 特殊職 | 深淵の聖騎士の心得 | 深淵・聖なる盾 | level:55 job:paladin_8 prof:6 clear:{dungeon:d04,floor:30} |
| paladin_15 | 竜血の聖騎士 | 特殊職 | 竜血の聖騎士の心得 | 竜血・聖なる盾 | level:55 job:paladin_10 prof:6 clear:{dungeon:d05,floor:30} |
| paladin_16 | 機巧の聖騎士 | 特殊職 | 機巧の聖騎士の心得 | 機巧・聖なる盾 | level:55 job:paladin_9 prof:6 clear:{dungeon:d06,floor:30} |
| paladin_17 | 霊樹の聖騎士 | 特殊職 | 霊樹の聖騎士の心得 | 霊樹・聖なる盾 | level:55 job:paladin_11 prof:6 clear:{dungeon:d07,floor:30} |
| paladin_18 | 時渡りの聖騎士 | 希少職 | 時渡りの聖騎士の心得 | 時渡り・聖なる盾 | level:85 job:paladin_12 prof:8 boss:{diff:HARD,count:12} clear:{dungeon:d08,floor:60} |
| paladin_19 | 重界の聖騎士 | 希少職 | 重界の聖騎士の心得 | 重界・聖なる盾 | level:85 job:paladin_14 prof:8 boss:{diff:HARD,count:12} clear:{dungeon:d09,floor:60} |
| paladin_20 | 虚無の聖騎士 | 希少職 | 虚無の聖騎士の心得 | 虚無・聖なる盾 | level:85 job:paladin_13 prof:8 boss:{diff:HARD,count:12} clear:{dungeon:d10,floor:60} |
| paladin_21 | 神託の聖騎士 | 希少職 | 神託の聖騎士の心得 | 神託・聖なる盾 | level:85 job:paladin_17 prof:8 boss:{diff:HARD,count:12} clear:{dungeon:d11,floor:60} |
| paladin_22 | 終焉の聖騎士 | 隠し職 | 終焉の聖騎士の心得 | 終焉・聖なる盾 | level:120 job:paladin_20 prof:10 hidden:{item:relic_end} abyss:10 |
| paladin_23 | 原初の聖騎士 | 隠し職 | 原初の聖騎士の心得 | 原初・聖なる盾 | level:120 job:paladin_21 prof:10 hidden:{item:relic_origin} abyss:10 |
| paladin_24 | 永劫の聖騎士 | 隠し職 | 永劫の聖騎士の心得 | 永劫・聖なる盾 | level:120 job:paladin_18 prof:10 hidden:{item:relic_eternity} abyss:10 |
| priest_0 | 神官 | 基本職 | 神官の心得 | 祝福 | level:19 |
| priest_1 | 炎刃の神官 | 応用職 | 炎刃の神官の心得 | 炎刃・祝福 | level:15 job:priest_0 prof:3 |
| priest_2 | 氷霜の神官 | 応用職 | 氷霜の神官の心得 | 氷霜・祝福 | level:15 job:priest_0 prof:3 |
| priest_3 | 迅雷の神官 | 応用職 | 迅雷の神官の心得 | 迅雷・祝福 | level:15 job:priest_0 prof:3 |
| priest_4 | 疾風の神官 | 応用職 | 疾風の神官の心得 | 疾風・祝福 | level:15 job:priest_0 prof:3 |
| priest_5 | 大地の神官 | 応用職 | 大地の神官の心得 | 大地・祝福 | level:15 job:priest_0 prof:3 |
| priest_6 | 流水の神官 | 応用職 | 流水の神官の心得 | 流水・祝福 | level:15 job:priest_0 prof:3 |
| priest_7 | 聖光の神官 | 上級職 | 聖光の神官の心得 | 聖光・祝福 | level:35 job:priest_6 prof:5 kills:300 |
| priest_8 | 闇夜の神官 | 上級職 | 闇夜の神官の心得 | 闇夜・祝福 | level:35 job:priest_4 prof:5 kills:300 |
| priest_9 | 鋼鉄の神官 | 上級職 | 鋼鉄の神官の心得 | 鋼鉄・祝福 | level:35 job:priest_5 prof:5 kills:300 |
| priest_10 | 血盟の神官 | 上級職 | 血盟の神官の心得 | 血盟・祝福 | level:35 job:priest_1 prof:5 kills:300 |
| priest_11 | 幻影の神官 | 上級職 | 幻影の神官の心得 | 幻影・祝福 | level:35 job:priest_2 prof:5 kills:300 |
| priest_12 | 星詠の神官 | 上級職 | 星詠の神官の心得 | 星詠・祝福 | level:35 job:priest_3 prof:5 kills:300 |
| priest_13 | 黄昏の神官 | 特殊職 | 黄昏の神官の心得 | 黄昏・祝福 | level:55 job:priest_7 prof:6 clear:{dungeon:d03,floor:30} |
| priest_14 | 深淵の神官 | 特殊職 | 深淵の神官の心得 | 深淵・祝福 | level:55 job:priest_8 prof:6 clear:{dungeon:d04,floor:30} |
| priest_15 | 竜血の神官 | 特殊職 | 竜血の神官の心得 | 竜血・祝福 | level:55 job:priest_10 prof:6 clear:{dungeon:d05,floor:30} |
| priest_16 | 機巧の神官 | 特殊職 | 機巧の神官の心得 | 機巧・祝福 | level:55 job:priest_9 prof:6 clear:{dungeon:d06,floor:30} |
| priest_17 | 霊樹の神官 | 特殊職 | 霊樹の神官の心得 | 霊樹・祝福 | level:55 job:priest_11 prof:6 clear:{dungeon:d07,floor:30} |
| priest_18 | 時渡りの神官 | 希少職 | 時渡りの神官の心得 | 時渡り・祝福 | level:85 job:priest_12 prof:8 boss:{diff:HARD,count:13} clear:{dungeon:d08,floor:60} |
| priest_19 | 重界の神官 | 希少職 | 重界の神官の心得 | 重界・祝福 | level:85 job:priest_14 prof:8 boss:{diff:HARD,count:13} clear:{dungeon:d09,floor:60} |
| priest_20 | 虚無の神官 | 希少職 | 虚無の神官の心得 | 虚無・祝福 | level:85 job:priest_13 prof:8 boss:{diff:HARD,count:13} clear:{dungeon:d10,floor:60} |
| priest_21 | 神託の神官 | 希少職 | 神託の神官の心得 | 神託・祝福 | level:85 job:priest_17 prof:8 boss:{diff:HARD,count:13} clear:{dungeon:d11,floor:60} |
| priest_22 | 終焉の神官 | 隠し職 | 終焉の神官の心得 | 終焉・祝福 | level:120 job:priest_20 prof:10 hidden:{abyssFloor:18} abyss:5 |
| priest_23 | 原初の神官 | 隠し職 | 原初の神官の心得 | 原初・祝福 | level:120 job:priest_21 prof:10 hidden:{abyssFloor:18} abyss:5 |
| priest_24 | 永劫の神官 | 隠し職 | 永劫の神官の心得 | 永劫・祝福 | level:120 job:priest_18 prof:10 hidden:{abyssFloor:18} abyss:5 |
| bard_0 | 吟遊詩人 | 基本職 | 吟遊詩人の心得 | 英雄の歌 | level:21 |
| bard_1 | 炎刃の吟遊詩人 | 応用職 | 炎刃の吟遊詩人の心得 | 炎刃・英雄の歌 | level:15 job:bard_0 prof:3 |
| bard_2 | 氷霜の吟遊詩人 | 応用職 | 氷霜の吟遊詩人の心得 | 氷霜・英雄の歌 | level:15 job:bard_0 prof:3 |
| bard_3 | 迅雷の吟遊詩人 | 応用職 | 迅雷の吟遊詩人の心得 | 迅雷・英雄の歌 | level:15 job:bard_0 prof:3 |
| bard_4 | 疾風の吟遊詩人 | 応用職 | 疾風の吟遊詩人の心得 | 疾風・英雄の歌 | level:15 job:bard_0 prof:3 |
| bard_5 | 大地の吟遊詩人 | 応用職 | 大地の吟遊詩人の心得 | 大地・英雄の歌 | level:15 job:bard_0 prof:3 |
| bard_6 | 流水の吟遊詩人 | 応用職 | 流水の吟遊詩人の心得 | 流水・英雄の歌 | level:15 job:bard_0 prof:3 |
| bard_7 | 聖光の吟遊詩人 | 上級職 | 聖光の吟遊詩人の心得 | 聖光・英雄の歌 | level:35 job:bard_6 prof:5 kills:300 |
| bard_8 | 闇夜の吟遊詩人 | 上級職 | 闇夜の吟遊詩人の心得 | 闇夜・英雄の歌 | level:35 job:bard_4 prof:5 kills:300 |
| bard_9 | 鋼鉄の吟遊詩人 | 上級職 | 鋼鉄の吟遊詩人の心得 | 鋼鉄・英雄の歌 | level:35 job:bard_5 prof:5 kills:300 |
| bard_10 | 血盟の吟遊詩人 | 上級職 | 血盟の吟遊詩人の心得 | 血盟・英雄の歌 | level:35 job:bard_1 prof:5 kills:300 |
| bard_11 | 幻影の吟遊詩人 | 上級職 | 幻影の吟遊詩人の心得 | 幻影・英雄の歌 | level:35 job:bard_2 prof:5 kills:300 |
| bard_12 | 星詠の吟遊詩人 | 上級職 | 星詠の吟遊詩人の心得 | 星詠・英雄の歌 | level:35 job:bard_3 prof:5 kills:300 |
| bard_13 | 黄昏の吟遊詩人 | 特殊職 | 黄昏の吟遊詩人の心得 | 黄昏・英雄の歌 | level:55 job:bard_7 prof:6 clear:{dungeon:d03,floor:30} |
| bard_14 | 深淵の吟遊詩人 | 特殊職 | 深淵の吟遊詩人の心得 | 深淵・英雄の歌 | level:55 job:bard_8 prof:6 clear:{dungeon:d04,floor:30} |
| bard_15 | 竜血の吟遊詩人 | 特殊職 | 竜血の吟遊詩人の心得 | 竜血・英雄の歌 | level:55 job:bard_10 prof:6 clear:{dungeon:d05,floor:30} |
| bard_16 | 機巧の吟遊詩人 | 特殊職 | 機巧の吟遊詩人の心得 | 機巧・英雄の歌 | level:55 job:bard_9 prof:6 clear:{dungeon:d06,floor:30} |
| bard_17 | 霊樹の吟遊詩人 | 特殊職 | 霊樹の吟遊詩人の心得 | 霊樹・英雄の歌 | level:55 job:bard_11 prof:6 clear:{dungeon:d07,floor:30} |
| bard_18 | 時渡りの吟遊詩人 | 希少職 | 時渡りの吟遊詩人の心得 | 時渡り・英雄の歌 | level:85 job:bard_12 prof:8 boss:{diff:HARD,count:14} clear:{dungeon:d08,floor:60} |
| bard_19 | 重界の吟遊詩人 | 希少職 | 重界の吟遊詩人の心得 | 重界・英雄の歌 | level:85 job:bard_14 prof:8 boss:{diff:HARD,count:14} clear:{dungeon:d09,floor:60} |
| bard_20 | 虚無の吟遊詩人 | 希少職 | 虚無の吟遊詩人の心得 | 虚無・英雄の歌 | level:85 job:bard_13 prof:8 boss:{diff:HARD,count:14} clear:{dungeon:d10,floor:60} |
| bard_21 | 神託の吟遊詩人 | 希少職 | 神託の吟遊詩人の心得 | 神託・英雄の歌 | level:85 job:bard_17 prof:8 boss:{diff:HARD,count:14} clear:{dungeon:d11,floor:60} |
| bard_22 | 終焉の吟遊詩人 | 隠し職 | 終焉の吟遊詩人の心得 | 終焉・英雄の歌 | level:120 job:bard_20 prof:10 hidden:{npcBond:80} abyss:6 |
| bard_23 | 原初の吟遊詩人 | 隠し職 | 原初の吟遊詩人の心得 | 原初・英雄の歌 | level:120 job:bard_21 prof:10 hidden:{npcBond:80} abyss:6 |
| bard_24 | 永劫の吟遊詩人 | 隠し職 | 永劫の吟遊詩人の心得 | 永劫・英雄の歌 | level:120 job:bard_18 prof:10 hidden:{npcBond:80} abyss:6 |
| dancer_0 | 踊り子 | 基本職 | 踊り子の心得 | 剣の舞 | level:3 |
| dancer_1 | 炎刃の踊り子 | 応用職 | 炎刃の踊り子の心得 | 炎刃・剣の舞 | level:15 job:dancer_0 prof:3 |
| dancer_2 | 氷霜の踊り子 | 応用職 | 氷霜の踊り子の心得 | 氷霜・剣の舞 | level:15 job:dancer_0 prof:3 |
| dancer_3 | 迅雷の踊り子 | 応用職 | 迅雷の踊り子の心得 | 迅雷・剣の舞 | level:15 job:dancer_0 prof:3 |
| dancer_4 | 疾風の踊り子 | 応用職 | 疾風の踊り子の心得 | 疾風・剣の舞 | level:15 job:dancer_0 prof:3 |
| dancer_5 | 大地の踊り子 | 応用職 | 大地の踊り子の心得 | 大地・剣の舞 | level:15 job:dancer_0 prof:3 |
| dancer_6 | 流水の踊り子 | 応用職 | 流水の踊り子の心得 | 流水・剣の舞 | level:15 job:dancer_0 prof:3 |
| dancer_7 | 聖光の踊り子 | 上級職 | 聖光の踊り子の心得 | 聖光・剣の舞 | level:35 job:dancer_6 prof:5 kills:300 |
| dancer_8 | 闇夜の踊り子 | 上級職 | 闇夜の踊り子の心得 | 闇夜・剣の舞 | level:35 job:dancer_4 prof:5 kills:300 |
| dancer_9 | 鋼鉄の踊り子 | 上級職 | 鋼鉄の踊り子の心得 | 鋼鉄・剣の舞 | level:35 job:dancer_5 prof:5 kills:300 |
| dancer_10 | 血盟の踊り子 | 上級職 | 血盟の踊り子の心得 | 血盟・剣の舞 | level:35 job:dancer_1 prof:5 kills:300 |
| dancer_11 | 幻影の踊り子 | 上級職 | 幻影の踊り子の心得 | 幻影・剣の舞 | level:35 job:dancer_2 prof:5 kills:300 |
| dancer_12 | 星詠の踊り子 | 上級職 | 星詠の踊り子の心得 | 星詠・剣の舞 | level:35 job:dancer_3 prof:5 kills:300 |
| dancer_13 | 黄昏の踊り子 | 特殊職 | 黄昏の踊り子の心得 | 黄昏・剣の舞 | level:55 job:dancer_7 prof:6 clear:{dungeon:d03,floor:30} |
| dancer_14 | 深淵の踊り子 | 特殊職 | 深淵の踊り子の心得 | 深淵・剣の舞 | level:55 job:dancer_8 prof:6 clear:{dungeon:d04,floor:30} |
| dancer_15 | 竜血の踊り子 | 特殊職 | 竜血の踊り子の心得 | 竜血・剣の舞 | level:55 job:dancer_10 prof:6 clear:{dungeon:d05,floor:30} |
| dancer_16 | 機巧の踊り子 | 特殊職 | 機巧の踊り子の心得 | 機巧・剣の舞 | level:55 job:dancer_9 prof:6 clear:{dungeon:d06,floor:30} |
| dancer_17 | 霊樹の踊り子 | 特殊職 | 霊樹の踊り子の心得 | 霊樹・剣の舞 | level:55 job:dancer_11 prof:6 clear:{dungeon:d07,floor:30} |
| dancer_18 | 時渡りの踊り子 | 希少職 | 時渡りの踊り子の心得 | 時渡り・剣の舞 | level:85 job:dancer_12 prof:8 boss:{diff:HARD,count:10} clear:{dungeon:d08,floor:60} |
| dancer_19 | 重界の踊り子 | 希少職 | 重界の踊り子の心得 | 重界・剣の舞 | level:85 job:dancer_14 prof:8 boss:{diff:HARD,count:10} clear:{dungeon:d09,floor:60} |
| dancer_20 | 虚無の踊り子 | 希少職 | 虚無の踊り子の心得 | 虚無・剣の舞 | level:85 job:dancer_13 prof:8 boss:{diff:HARD,count:10} clear:{dungeon:d10,floor:60} |
| dancer_21 | 神託の踊り子 | 希少職 | 神託の踊り子の心得 | 神託・剣の舞 | level:85 job:dancer_17 prof:8 boss:{diff:HARD,count:10} clear:{dungeon:d11,floor:60} |
| dancer_22 | 終焉の踊り子 | 隠し職 | 終焉の踊り子の心得 | 終焉・剣の舞 | level:120 job:dancer_20 prof:10 hidden:{item:relic_end} abyss:7 |
| dancer_23 | 原初の踊り子 | 隠し職 | 原初の踊り子の心得 | 原初・剣の舞 | level:120 job:dancer_21 prof:10 hidden:{item:relic_origin} abyss:7 |
| dancer_24 | 永劫の踊り子 | 隠し職 | 永劫の踊り子の心得 | 永劫・剣の舞 | level:120 job:dancer_18 prof:10 hidden:{item:relic_eternity} abyss:7 |
| alchemist_0 | 錬金術師 | 基本職 | 錬金術師の心得 | 爆薬瓶 | level:5 |
| alchemist_1 | 炎刃の錬金術師 | 応用職 | 炎刃の錬金術師の心得 | 炎刃・爆薬瓶 | level:15 job:alchemist_0 prof:3 |
| alchemist_2 | 氷霜の錬金術師 | 応用職 | 氷霜の錬金術師の心得 | 氷霜・爆薬瓶 | level:15 job:alchemist_0 prof:3 |
| alchemist_3 | 迅雷の錬金術師 | 応用職 | 迅雷の錬金術師の心得 | 迅雷・爆薬瓶 | level:15 job:alchemist_0 prof:3 |
| alchemist_4 | 疾風の錬金術師 | 応用職 | 疾風の錬金術師の心得 | 疾風・爆薬瓶 | level:15 job:alchemist_0 prof:3 |
| alchemist_5 | 大地の錬金術師 | 応用職 | 大地の錬金術師の心得 | 大地・爆薬瓶 | level:15 job:alchemist_0 prof:3 |
| alchemist_6 | 流水の錬金術師 | 応用職 | 流水の錬金術師の心得 | 流水・爆薬瓶 | level:15 job:alchemist_0 prof:3 |
| alchemist_7 | 聖光の錬金術師 | 上級職 | 聖光の錬金術師の心得 | 聖光・爆薬瓶 | level:35 job:alchemist_6 prof:5 kills:300 |
| alchemist_8 | 闇夜の錬金術師 | 上級職 | 闇夜の錬金術師の心得 | 闇夜・爆薬瓶 | level:35 job:alchemist_4 prof:5 kills:300 |
| alchemist_9 | 鋼鉄の錬金術師 | 上級職 | 鋼鉄の錬金術師の心得 | 鋼鉄・爆薬瓶 | level:35 job:alchemist_5 prof:5 kills:300 |
| alchemist_10 | 血盟の錬金術師 | 上級職 | 血盟の錬金術師の心得 | 血盟・爆薬瓶 | level:35 job:alchemist_1 prof:5 kills:300 |
| alchemist_11 | 幻影の錬金術師 | 上級職 | 幻影の錬金術師の心得 | 幻影・爆薬瓶 | level:35 job:alchemist_2 prof:5 kills:300 |
| alchemist_12 | 星詠の錬金術師 | 上級職 | 星詠の錬金術師の心得 | 星詠・爆薬瓶 | level:35 job:alchemist_3 prof:5 kills:300 |
| alchemist_13 | 黄昏の錬金術師 | 特殊職 | 黄昏の錬金術師の心得 | 黄昏・爆薬瓶 | level:55 job:alchemist_7 prof:6 clear:{dungeon:d03,floor:30} |
| alchemist_14 | 深淵の錬金術師 | 特殊職 | 深淵の錬金術師の心得 | 深淵・爆薬瓶 | level:55 job:alchemist_8 prof:6 clear:{dungeon:d04,floor:30} |
| alchemist_15 | 竜血の錬金術師 | 特殊職 | 竜血の錬金術師の心得 | 竜血・爆薬瓶 | level:55 job:alchemist_10 prof:6 clear:{dungeon:d05,floor:30} |
| alchemist_16 | 機巧の錬金術師 | 特殊職 | 機巧の錬金術師の心得 | 機巧・爆薬瓶 | level:55 job:alchemist_9 prof:6 clear:{dungeon:d06,floor:30} |
| alchemist_17 | 霊樹の錬金術師 | 特殊職 | 霊樹の錬金術師の心得 | 霊樹・爆薬瓶 | level:55 job:alchemist_11 prof:6 clear:{dungeon:d07,floor:30} |
| alchemist_18 | 時渡りの錬金術師 | 希少職 | 時渡りの錬金術師の心得 | 時渡り・爆薬瓶 | level:85 job:alchemist_12 prof:8 boss:{diff:HARD,count:11} clear:{dungeon:d08,floor:60} |
| alchemist_19 | 重界の錬金術師 | 希少職 | 重界の錬金術師の心得 | 重界・爆薬瓶 | level:85 job:alchemist_14 prof:8 boss:{diff:HARD,count:11} clear:{dungeon:d09,floor:60} |
| alchemist_20 | 虚無の錬金術師 | 希少職 | 虚無の錬金術師の心得 | 虚無・爆薬瓶 | level:85 job:alchemist_13 prof:8 boss:{diff:HARD,count:11} clear:{dungeon:d10,floor:60} |
| alchemist_21 | 神託の錬金術師 | 希少職 | 神託の錬金術師の心得 | 神託・爆薬瓶 | level:85 job:alchemist_17 prof:8 boss:{diff:HARD,count:11} clear:{dungeon:d11,floor:60} |
| alchemist_22 | 終焉の錬金術師 | 隠し職 | 終焉の錬金術師の心得 | 終焉・爆薬瓶 | level:120 job:alchemist_20 prof:10 hidden:{abyssFloor:11} abyss:8 |
| alchemist_23 | 原初の錬金術師 | 隠し職 | 原初の錬金術師の心得 | 原初・爆薬瓶 | level:120 job:alchemist_21 prof:10 hidden:{abyssFloor:11} abyss:8 |
| alchemist_24 | 永劫の錬金術師 | 隠し職 | 永劫の錬金術師の心得 | 永劫・爆薬瓶 | level:120 job:alchemist_18 prof:10 hidden:{abyssFloor:11} abyss:8 |
| machinist_0 | 機工士 | 基本職 | 機工士の心得 | 自動砲台 | level:7 |
| machinist_1 | 炎刃の機工士 | 応用職 | 炎刃の機工士の心得 | 炎刃・自動砲台 | level:15 job:machinist_0 prof:3 |
| machinist_2 | 氷霜の機工士 | 応用職 | 氷霜の機工士の心得 | 氷霜・自動砲台 | level:15 job:machinist_0 prof:3 |
| machinist_3 | 迅雷の機工士 | 応用職 | 迅雷の機工士の心得 | 迅雷・自動砲台 | level:15 job:machinist_0 prof:3 |
| machinist_4 | 疾風の機工士 | 応用職 | 疾風の機工士の心得 | 疾風・自動砲台 | level:15 job:machinist_0 prof:3 |
| machinist_5 | 大地の機工士 | 応用職 | 大地の機工士の心得 | 大地・自動砲台 | level:15 job:machinist_0 prof:3 |
| machinist_6 | 流水の機工士 | 応用職 | 流水の機工士の心得 | 流水・自動砲台 | level:15 job:machinist_0 prof:3 |
| machinist_7 | 聖光の機工士 | 上級職 | 聖光の機工士の心得 | 聖光・自動砲台 | level:35 job:machinist_6 prof:5 kills:300 |
| machinist_8 | 闇夜の機工士 | 上級職 | 闇夜の機工士の心得 | 闇夜・自動砲台 | level:35 job:machinist_4 prof:5 kills:300 |
| machinist_9 | 鋼鉄の機工士 | 上級職 | 鋼鉄の機工士の心得 | 鋼鉄・自動砲台 | level:35 job:machinist_5 prof:5 kills:300 |
| machinist_10 | 血盟の機工士 | 上級職 | 血盟の機工士の心得 | 血盟・自動砲台 | level:35 job:machinist_1 prof:5 kills:300 |
| machinist_11 | 幻影の機工士 | 上級職 | 幻影の機工士の心得 | 幻影・自動砲台 | level:35 job:machinist_2 prof:5 kills:300 |
| machinist_12 | 星詠の機工士 | 上級職 | 星詠の機工士の心得 | 星詠・自動砲台 | level:35 job:machinist_3 prof:5 kills:300 |
| machinist_13 | 黄昏の機工士 | 特殊職 | 黄昏の機工士の心得 | 黄昏・自動砲台 | level:55 job:machinist_7 prof:6 clear:{dungeon:d03,floor:30} |
| machinist_14 | 深淵の機工士 | 特殊職 | 深淵の機工士の心得 | 深淵・自動砲台 | level:55 job:machinist_8 prof:6 clear:{dungeon:d04,floor:30} |
| machinist_15 | 竜血の機工士 | 特殊職 | 竜血の機工士の心得 | 竜血・自動砲台 | level:55 job:machinist_10 prof:6 clear:{dungeon:d05,floor:30} |
| machinist_16 | 機巧の機工士 | 特殊職 | 機巧の機工士の心得 | 機巧・自動砲台 | level:55 job:machinist_9 prof:6 clear:{dungeon:d06,floor:30} |
| machinist_17 | 霊樹の機工士 | 特殊職 | 霊樹の機工士の心得 | 霊樹・自動砲台 | level:55 job:machinist_11 prof:6 clear:{dungeon:d07,floor:30} |
| machinist_18 | 時渡りの機工士 | 希少職 | 時渡りの機工士の心得 | 時渡り・自動砲台 | level:85 job:machinist_12 prof:8 boss:{diff:HARD,count:12} clear:{dungeon:d08,floor:60} |
| machinist_19 | 重界の機工士 | 希少職 | 重界の機工士の心得 | 重界・自動砲台 | level:85 job:machinist_14 prof:8 boss:{diff:HARD,count:12} clear:{dungeon:d09,floor:60} |
| machinist_20 | 虚無の機工士 | 希少職 | 虚無の機工士の心得 | 虚無・自動砲台 | level:85 job:machinist_13 prof:8 boss:{diff:HARD,count:12} clear:{dungeon:d10,floor:60} |
| machinist_21 | 神託の機工士 | 希少職 | 神託の機工士の心得 | 神託・自動砲台 | level:85 job:machinist_17 prof:8 boss:{diff:HARD,count:12} clear:{dungeon:d11,floor:60} |
| machinist_22 | 終焉の機工士 | 隠し職 | 終焉の機工士の心得 | 終焉・自動砲台 | level:120 job:machinist_20 prof:10 hidden:{npcBond:80} abyss:9 |
| machinist_23 | 原初の機工士 | 隠し職 | 原初の機工士の心得 | 原初・自動砲台 | level:120 job:machinist_21 prof:10 hidden:{npcBond:80} abyss:9 |
| machinist_24 | 永劫の機工士 | 隠し職 | 永劫の機工士の心得 | 永劫・自動砲台 | level:120 job:machinist_18 prof:10 hidden:{npcBond:80} abyss:9 |
| enchanter_0 | 付与術師 | 基本職 | 付与術師の心得 | 武器付与 | level:9 |
| enchanter_1 | 炎刃の付与術師 | 応用職 | 炎刃の付与術師の心得 | 炎刃・武器付与 | level:15 job:enchanter_0 prof:3 |
| enchanter_2 | 氷霜の付与術師 | 応用職 | 氷霜の付与術師の心得 | 氷霜・武器付与 | level:15 job:enchanter_0 prof:3 |
| enchanter_3 | 迅雷の付与術師 | 応用職 | 迅雷の付与術師の心得 | 迅雷・武器付与 | level:15 job:enchanter_0 prof:3 |
| enchanter_4 | 疾風の付与術師 | 応用職 | 疾風の付与術師の心得 | 疾風・武器付与 | level:15 job:enchanter_0 prof:3 |
| enchanter_5 | 大地の付与術師 | 応用職 | 大地の付与術師の心得 | 大地・武器付与 | level:15 job:enchanter_0 prof:3 |
| enchanter_6 | 流水の付与術師 | 応用職 | 流水の付与術師の心得 | 流水・武器付与 | level:15 job:enchanter_0 prof:3 |
| enchanter_7 | 聖光の付与術師 | 上級職 | 聖光の付与術師の心得 | 聖光・武器付与 | level:35 job:enchanter_6 prof:5 kills:300 |
| enchanter_8 | 闇夜の付与術師 | 上級職 | 闇夜の付与術師の心得 | 闇夜・武器付与 | level:35 job:enchanter_4 prof:5 kills:300 |
| enchanter_9 | 鋼鉄の付与術師 | 上級職 | 鋼鉄の付与術師の心得 | 鋼鉄・武器付与 | level:35 job:enchanter_5 prof:5 kills:300 |
| enchanter_10 | 血盟の付与術師 | 上級職 | 血盟の付与術師の心得 | 血盟・武器付与 | level:35 job:enchanter_1 prof:5 kills:300 |
| enchanter_11 | 幻影の付与術師 | 上級職 | 幻影の付与術師の心得 | 幻影・武器付与 | level:35 job:enchanter_2 prof:5 kills:300 |
| enchanter_12 | 星詠の付与術師 | 上級職 | 星詠の付与術師の心得 | 星詠・武器付与 | level:35 job:enchanter_3 prof:5 kills:300 |
| enchanter_13 | 黄昏の付与術師 | 特殊職 | 黄昏の付与術師の心得 | 黄昏・武器付与 | level:55 job:enchanter_7 prof:6 clear:{dungeon:d03,floor:30} |
| enchanter_14 | 深淵の付与術師 | 特殊職 | 深淵の付与術師の心得 | 深淵・武器付与 | level:55 job:enchanter_8 prof:6 clear:{dungeon:d04,floor:30} |
| enchanter_15 | 竜血の付与術師 | 特殊職 | 竜血の付与術師の心得 | 竜血・武器付与 | level:55 job:enchanter_10 prof:6 clear:{dungeon:d05,floor:30} |
| enchanter_16 | 機巧の付与術師 | 特殊職 | 機巧の付与術師の心得 | 機巧・武器付与 | level:55 job:enchanter_9 prof:6 clear:{dungeon:d06,floor:30} |
| enchanter_17 | 霊樹の付与術師 | 特殊職 | 霊樹の付与術師の心得 | 霊樹・武器付与 | level:55 job:enchanter_11 prof:6 clear:{dungeon:d07,floor:30} |
| enchanter_18 | 時渡りの付与術師 | 希少職 | 時渡りの付与術師の心得 | 時渡り・武器付与 | level:85 job:enchanter_12 prof:8 boss:{diff:HARD,count:13} clear:{dungeon:d08,floor:60} |
| enchanter_19 | 重界の付与術師 | 希少職 | 重界の付与術師の心得 | 重界・武器付与 | level:85 job:enchanter_14 prof:8 boss:{diff:HARD,count:13} clear:{dungeon:d09,floor:60} |
| enchanter_20 | 虚無の付与術師 | 希少職 | 虚無の付与術師の心得 | 虚無・武器付与 | level:85 job:enchanter_13 prof:8 boss:{diff:HARD,count:13} clear:{dungeon:d10,floor:60} |
| enchanter_21 | 神託の付与術師 | 希少職 | 神託の付与術師の心得 | 神託・武器付与 | level:85 job:enchanter_17 prof:8 boss:{diff:HARD,count:13} clear:{dungeon:d11,floor:60} |
| enchanter_22 | 終焉の付与術師 | 隠し職 | 終焉の付与術師の心得 | 終焉・武器付与 | level:120 job:enchanter_20 prof:10 hidden:{item:relic_end} abyss:10 |
| enchanter_23 | 原初の付与術師 | 隠し職 | 原初の付与術師の心得 | 原初・武器付与 | level:120 job:enchanter_21 prof:10 hidden:{item:relic_origin} abyss:10 |
| enchanter_24 | 永劫の付与術師 | 隠し職 | 永劫の付与術師の心得 | 永劫・武器付与 | level:120 job:enchanter_18 prof:10 hidden:{item:relic_eternity} abyss:10 |
| curser_0 | 呪術師 | 基本職 | 呪術師の心得 | 呪詛 | level:11 |
| curser_1 | 炎刃の呪術師 | 応用職 | 炎刃の呪術師の心得 | 炎刃・呪詛 | level:15 job:curser_0 prof:3 |
| curser_2 | 氷霜の呪術師 | 応用職 | 氷霜の呪術師の心得 | 氷霜・呪詛 | level:15 job:curser_0 prof:3 |
| curser_3 | 迅雷の呪術師 | 応用職 | 迅雷の呪術師の心得 | 迅雷・呪詛 | level:15 job:curser_0 prof:3 |
| curser_4 | 疾風の呪術師 | 応用職 | 疾風の呪術師の心得 | 疾風・呪詛 | level:15 job:curser_0 prof:3 |
| curser_5 | 大地の呪術師 | 応用職 | 大地の呪術師の心得 | 大地・呪詛 | level:15 job:curser_0 prof:3 |
| curser_6 | 流水の呪術師 | 応用職 | 流水の呪術師の心得 | 流水・呪詛 | level:15 job:curser_0 prof:3 |
| curser_7 | 聖光の呪術師 | 上級職 | 聖光の呪術師の心得 | 聖光・呪詛 | level:35 job:curser_6 prof:5 kills:300 |
| curser_8 | 闇夜の呪術師 | 上級職 | 闇夜の呪術師の心得 | 闇夜・呪詛 | level:35 job:curser_4 prof:5 kills:300 |
| curser_9 | 鋼鉄の呪術師 | 上級職 | 鋼鉄の呪術師の心得 | 鋼鉄・呪詛 | level:35 job:curser_5 prof:5 kills:300 |
| curser_10 | 血盟の呪術師 | 上級職 | 血盟の呪術師の心得 | 血盟・呪詛 | level:35 job:curser_1 prof:5 kills:300 |
| curser_11 | 幻影の呪術師 | 上級職 | 幻影の呪術師の心得 | 幻影・呪詛 | level:35 job:curser_2 prof:5 kills:300 |
| curser_12 | 星詠の呪術師 | 上級職 | 星詠の呪術師の心得 | 星詠・呪詛 | level:35 job:curser_3 prof:5 kills:300 |
| curser_13 | 黄昏の呪術師 | 特殊職 | 黄昏の呪術師の心得 | 黄昏・呪詛 | level:55 job:curser_7 prof:6 clear:{dungeon:d03,floor:30} |
| curser_14 | 深淵の呪術師 | 特殊職 | 深淵の呪術師の心得 | 深淵・呪詛 | level:55 job:curser_8 prof:6 clear:{dungeon:d04,floor:30} |
| curser_15 | 竜血の呪術師 | 特殊職 | 竜血の呪術師の心得 | 竜血・呪詛 | level:55 job:curser_10 prof:6 clear:{dungeon:d05,floor:30} |
| curser_16 | 機巧の呪術師 | 特殊職 | 機巧の呪術師の心得 | 機巧・呪詛 | level:55 job:curser_9 prof:6 clear:{dungeon:d06,floor:30} |
| curser_17 | 霊樹の呪術師 | 特殊職 | 霊樹の呪術師の心得 | 霊樹・呪詛 | level:55 job:curser_11 prof:6 clear:{dungeon:d07,floor:30} |
| curser_18 | 時渡りの呪術師 | 希少職 | 時渡りの呪術師の心得 | 時渡り・呪詛 | level:85 job:curser_12 prof:8 boss:{diff:HARD,count:14} clear:{dungeon:d08,floor:60} |
| curser_19 | 重界の呪術師 | 希少職 | 重界の呪術師の心得 | 重界・呪詛 | level:85 job:curser_14 prof:8 boss:{diff:HARD,count:14} clear:{dungeon:d09,floor:60} |
| curser_20 | 虚無の呪術師 | 希少職 | 虚無の呪術師の心得 | 虚無・呪詛 | level:85 job:curser_13 prof:8 boss:{diff:HARD,count:14} clear:{dungeon:d10,floor:60} |
| curser_21 | 神託の呪術師 | 希少職 | 神託の呪術師の心得 | 神託・呪詛 | level:85 job:curser_17 prof:8 boss:{diff:HARD,count:14} clear:{dungeon:d11,floor:60} |
| curser_22 | 終焉の呪術師 | 隠し職 | 終焉の呪術師の心得 | 終焉・呪詛 | level:120 job:curser_20 prof:10 hidden:{abyssFloor:14} abyss:5 |
| curser_23 | 原初の呪術師 | 隠し職 | 原初の呪術師の心得 | 原初・呪詛 | level:120 job:curser_21 prof:10 hidden:{abyssFloor:14} abyss:5 |
| curser_24 | 永劫の呪術師 | 隠し職 | 永劫の呪術師の心得 | 永劫・呪詛 | level:120 job:curser_18 prof:10 hidden:{abyssFloor:14} abyss:5 |
| astrologer_0 | 占星術師 | 基本職 | 占星術師の心得 | 星の導き | level:13 |
| astrologer_1 | 炎刃の占星術師 | 応用職 | 炎刃の占星術師の心得 | 炎刃・星の導き | level:15 job:astrologer_0 prof:3 |
| astrologer_2 | 氷霜の占星術師 | 応用職 | 氷霜の占星術師の心得 | 氷霜・星の導き | level:15 job:astrologer_0 prof:3 |
| astrologer_3 | 迅雷の占星術師 | 応用職 | 迅雷の占星術師の心得 | 迅雷・星の導き | level:15 job:astrologer_0 prof:3 |
| astrologer_4 | 疾風の占星術師 | 応用職 | 疾風の占星術師の心得 | 疾風・星の導き | level:15 job:astrologer_0 prof:3 |
| astrologer_5 | 大地の占星術師 | 応用職 | 大地の占星術師の心得 | 大地・星の導き | level:15 job:astrologer_0 prof:3 |
| astrologer_6 | 流水の占星術師 | 応用職 | 流水の占星術師の心得 | 流水・星の導き | level:15 job:astrologer_0 prof:3 |
| astrologer_7 | 聖光の占星術師 | 上級職 | 聖光の占星術師の心得 | 聖光・星の導き | level:35 job:astrologer_6 prof:5 kills:300 |
| astrologer_8 | 闇夜の占星術師 | 上級職 | 闇夜の占星術師の心得 | 闇夜・星の導き | level:35 job:astrologer_4 prof:5 kills:300 |
| astrologer_9 | 鋼鉄の占星術師 | 上級職 | 鋼鉄の占星術師の心得 | 鋼鉄・星の導き | level:35 job:astrologer_5 prof:5 kills:300 |
| astrologer_10 | 血盟の占星術師 | 上級職 | 血盟の占星術師の心得 | 血盟・星の導き | level:35 job:astrologer_1 prof:5 kills:300 |
| astrologer_11 | 幻影の占星術師 | 上級職 | 幻影の占星術師の心得 | 幻影・星の導き | level:35 job:astrologer_2 prof:5 kills:300 |
| astrologer_12 | 星詠の占星術師 | 上級職 | 星詠の占星術師の心得 | 星詠・星の導き | level:35 job:astrologer_3 prof:5 kills:300 |
| astrologer_13 | 黄昏の占星術師 | 特殊職 | 黄昏の占星術師の心得 | 黄昏・星の導き | level:55 job:astrologer_7 prof:6 clear:{dungeon:d03,floor:30} |
| astrologer_14 | 深淵の占星術師 | 特殊職 | 深淵の占星術師の心得 | 深淵・星の導き | level:55 job:astrologer_8 prof:6 clear:{dungeon:d04,floor:30} |
| astrologer_15 | 竜血の占星術師 | 特殊職 | 竜血の占星術師の心得 | 竜血・星の導き | level:55 job:astrologer_10 prof:6 clear:{dungeon:d05,floor:30} |
| astrologer_16 | 機巧の占星術師 | 特殊職 | 機巧の占星術師の心得 | 機巧・星の導き | level:55 job:astrologer_9 prof:6 clear:{dungeon:d06,floor:30} |
| astrologer_17 | 霊樹の占星術師 | 特殊職 | 霊樹の占星術師の心得 | 霊樹・星の導き | level:55 job:astrologer_11 prof:6 clear:{dungeon:d07,floor:30} |
| astrologer_18 | 時渡りの占星術師 | 希少職 | 時渡りの占星術師の心得 | 時渡り・星の導き | level:85 job:astrologer_12 prof:8 boss:{diff:HARD,count:10} clear:{dungeon:d08,floor:60} |
| astrologer_19 | 重界の占星術師 | 希少職 | 重界の占星術師の心得 | 重界・星の導き | level:85 job:astrologer_14 prof:8 boss:{diff:HARD,count:10} clear:{dungeon:d09,floor:60} |
| astrologer_20 | 虚無の占星術師 | 希少職 | 虚無の占星術師の心得 | 虚無・星の導き | level:85 job:astrologer_13 prof:8 boss:{diff:HARD,count:10} clear:{dungeon:d10,floor:60} |
| astrologer_21 | 神託の占星術師 | 希少職 | 神託の占星術師の心得 | 神託・星の導き | level:85 job:astrologer_17 prof:8 boss:{diff:HARD,count:10} clear:{dungeon:d11,floor:60} |
| astrologer_22 | 終焉の占星術師 | 隠し職 | 終焉の占星術師の心得 | 終焉・星の導き | level:120 job:astrologer_20 prof:10 hidden:{npcBond:80} abyss:6 |
| astrologer_23 | 原初の占星術師 | 隠し職 | 原初の占星術師の心得 | 原初・星の導き | level:120 job:astrologer_21 prof:10 hidden:{npcBond:80} abyss:6 |
| astrologer_24 | 永劫の占星術師 | 隠し職 | 永劫の占星術師の心得 | 永劫・星の導き | level:120 job:astrologer_18 prof:10 hidden:{npcBond:80} abyss:6 |
| chronomancer_0 | 時術師 | 基本職 | 時術師の心得 | 時間加速 | level:15 |
| chronomancer_1 | 炎刃の時術師 | 応用職 | 炎刃の時術師の心得 | 炎刃・時間加速 | level:15 job:chronomancer_0 prof:3 |
| chronomancer_2 | 氷霜の時術師 | 応用職 | 氷霜の時術師の心得 | 氷霜・時間加速 | level:15 job:chronomancer_0 prof:3 |
| chronomancer_3 | 迅雷の時術師 | 応用職 | 迅雷の時術師の心得 | 迅雷・時間加速 | level:15 job:chronomancer_0 prof:3 |
| chronomancer_4 | 疾風の時術師 | 応用職 | 疾風の時術師の心得 | 疾風・時間加速 | level:15 job:chronomancer_0 prof:3 |
| chronomancer_5 | 大地の時術師 | 応用職 | 大地の時術師の心得 | 大地・時間加速 | level:15 job:chronomancer_0 prof:3 |
| chronomancer_6 | 流水の時術師 | 応用職 | 流水の時術師の心得 | 流水・時間加速 | level:15 job:chronomancer_0 prof:3 |
| chronomancer_7 | 聖光の時術師 | 上級職 | 聖光の時術師の心得 | 聖光・時間加速 | level:35 job:chronomancer_6 prof:5 kills:300 |
| chronomancer_8 | 闇夜の時術師 | 上級職 | 闇夜の時術師の心得 | 闇夜・時間加速 | level:35 job:chronomancer_4 prof:5 kills:300 |
| chronomancer_9 | 鋼鉄の時術師 | 上級職 | 鋼鉄の時術師の心得 | 鋼鉄・時間加速 | level:35 job:chronomancer_5 prof:5 kills:300 |
| chronomancer_10 | 血盟の時術師 | 上級職 | 血盟の時術師の心得 | 血盟・時間加速 | level:35 job:chronomancer_1 prof:5 kills:300 |
| chronomancer_11 | 幻影の時術師 | 上級職 | 幻影の時術師の心得 | 幻影・時間加速 | level:35 job:chronomancer_2 prof:5 kills:300 |
| chronomancer_12 | 星詠の時術師 | 上級職 | 星詠の時術師の心得 | 星詠・時間加速 | level:35 job:chronomancer_3 prof:5 kills:300 |
| chronomancer_13 | 黄昏の時術師 | 特殊職 | 黄昏の時術師の心得 | 黄昏・時間加速 | level:55 job:chronomancer_7 prof:6 clear:{dungeon:d03,floor:30} |
| chronomancer_14 | 深淵の時術師 | 特殊職 | 深淵の時術師の心得 | 深淵・時間加速 | level:55 job:chronomancer_8 prof:6 clear:{dungeon:d04,floor:30} |
| chronomancer_15 | 竜血の時術師 | 特殊職 | 竜血の時術師の心得 | 竜血・時間加速 | level:55 job:chronomancer_10 prof:6 clear:{dungeon:d05,floor:30} |
| chronomancer_16 | 機巧の時術師 | 特殊職 | 機巧の時術師の心得 | 機巧・時間加速 | level:55 job:chronomancer_9 prof:6 clear:{dungeon:d06,floor:30} |
| chronomancer_17 | 霊樹の時術師 | 特殊職 | 霊樹の時術師の心得 | 霊樹・時間加速 | level:55 job:chronomancer_11 prof:6 clear:{dungeon:d07,floor:30} |
| chronomancer_18 | 時渡りの時術師 | 希少職 | 時渡りの時術師の心得 | 時渡り・時間加速 | level:85 job:chronomancer_12 prof:8 boss:{diff:HARD,count:11} clear:{dungeon:d08,floor:60} |
| chronomancer_19 | 重界の時術師 | 希少職 | 重界の時術師の心得 | 重界・時間加速 | level:85 job:chronomancer_14 prof:8 boss:{diff:HARD,count:11} clear:{dungeon:d09,floor:60} |
| chronomancer_20 | 虚無の時術師 | 希少職 | 虚無の時術師の心得 | 虚無・時間加速 | level:85 job:chronomancer_13 prof:8 boss:{diff:HARD,count:11} clear:{dungeon:d10,floor:60} |
| chronomancer_21 | 神託の時術師 | 希少職 | 神託の時術師の心得 | 神託・時間加速 | level:85 job:chronomancer_17 prof:8 boss:{diff:HARD,count:11} clear:{dungeon:d11,floor:60} |
| chronomancer_22 | 終焉の時術師 | 隠し職 | 終焉の時術師の心得 | 終焉・時間加速 | level:120 job:chronomancer_20 prof:10 hidden:{item:relic_end} abyss:7 |
| chronomancer_23 | 原初の時術師 | 隠し職 | 原初の時術師の心得 | 原初・時間加速 | level:120 job:chronomancer_21 prof:10 hidden:{item:relic_origin} abyss:7 |
| chronomancer_24 | 永劫の時術師 | 隠し職 | 永劫の時術師の心得 | 永劫・時間加速 | level:120 job:chronomancer_18 prof:10 hidden:{item:relic_eternity} abyss:7 |
| gravitist_0 | 重力術師 | 基本職 | 重力術師の心得 | 重力場 | level:17 |
| gravitist_1 | 炎刃の重力術師 | 応用職 | 炎刃の重力術師の心得 | 炎刃・重力場 | level:15 job:gravitist_0 prof:3 |
| gravitist_2 | 氷霜の重力術師 | 応用職 | 氷霜の重力術師の心得 | 氷霜・重力場 | level:15 job:gravitist_0 prof:3 |
| gravitist_3 | 迅雷の重力術師 | 応用職 | 迅雷の重力術師の心得 | 迅雷・重力場 | level:15 job:gravitist_0 prof:3 |
| gravitist_4 | 疾風の重力術師 | 応用職 | 疾風の重力術師の心得 | 疾風・重力場 | level:15 job:gravitist_0 prof:3 |
| gravitist_5 | 大地の重力術師 | 応用職 | 大地の重力術師の心得 | 大地・重力場 | level:15 job:gravitist_0 prof:3 |
| gravitist_6 | 流水の重力術師 | 応用職 | 流水の重力術師の心得 | 流水・重力場 | level:15 job:gravitist_0 prof:3 |
| gravitist_7 | 聖光の重力術師 | 上級職 | 聖光の重力術師の心得 | 聖光・重力場 | level:35 job:gravitist_6 prof:5 kills:300 |
| gravitist_8 | 闇夜の重力術師 | 上級職 | 闇夜の重力術師の心得 | 闇夜・重力場 | level:35 job:gravitist_4 prof:5 kills:300 |
| gravitist_9 | 鋼鉄の重力術師 | 上級職 | 鋼鉄の重力術師の心得 | 鋼鉄・重力場 | level:35 job:gravitist_5 prof:5 kills:300 |
| gravitist_10 | 血盟の重力術師 | 上級職 | 血盟の重力術師の心得 | 血盟・重力場 | level:35 job:gravitist_1 prof:5 kills:300 |
| gravitist_11 | 幻影の重力術師 | 上級職 | 幻影の重力術師の心得 | 幻影・重力場 | level:35 job:gravitist_2 prof:5 kills:300 |
| gravitist_12 | 星詠の重力術師 | 上級職 | 星詠の重力術師の心得 | 星詠・重力場 | level:35 job:gravitist_3 prof:5 kills:300 |
| gravitist_13 | 黄昏の重力術師 | 特殊職 | 黄昏の重力術師の心得 | 黄昏・重力場 | level:55 job:gravitist_7 prof:6 clear:{dungeon:d03,floor:30} |
| gravitist_14 | 深淵の重力術師 | 特殊職 | 深淵の重力術師の心得 | 深淵・重力場 | level:55 job:gravitist_8 prof:6 clear:{dungeon:d04,floor:30} |
| gravitist_15 | 竜血の重力術師 | 特殊職 | 竜血の重力術師の心得 | 竜血・重力場 | level:55 job:gravitist_10 prof:6 clear:{dungeon:d05,floor:30} |
| gravitist_16 | 機巧の重力術師 | 特殊職 | 機巧の重力術師の心得 | 機巧・重力場 | level:55 job:gravitist_9 prof:6 clear:{dungeon:d06,floor:30} |
| gravitist_17 | 霊樹の重力術師 | 特殊職 | 霊樹の重力術師の心得 | 霊樹・重力場 | level:55 job:gravitist_11 prof:6 clear:{dungeon:d07,floor:30} |
| gravitist_18 | 時渡りの重力術師 | 希少職 | 時渡りの重力術師の心得 | 時渡り・重力場 | level:85 job:gravitist_12 prof:8 boss:{diff:HARD,count:12} clear:{dungeon:d08,floor:60} |
| gravitist_19 | 重界の重力術師 | 希少職 | 重界の重力術師の心得 | 重界・重力場 | level:85 job:gravitist_14 prof:8 boss:{diff:HARD,count:12} clear:{dungeon:d09,floor:60} |
| gravitist_20 | 虚無の重力術師 | 希少職 | 虚無の重力術師の心得 | 虚無・重力場 | level:85 job:gravitist_13 prof:8 boss:{diff:HARD,count:12} clear:{dungeon:d10,floor:60} |
| gravitist_21 | 神託の重力術師 | 希少職 | 神託の重力術師の心得 | 神託・重力場 | level:85 job:gravitist_17 prof:8 boss:{diff:HARD,count:12} clear:{dungeon:d11,floor:60} |
| gravitist_22 | 終焉の重力術師 | 隠し職 | 終焉の重力術師の心得 | 終焉・重力場 | level:120 job:gravitist_20 prof:10 hidden:{abyssFloor:17} abyss:8 |
| gravitist_23 | 原初の重力術師 | 隠し職 | 原初の重力術師の心得 | 原初・重力場 | level:120 job:gravitist_21 prof:10 hidden:{abyssFloor:17} abyss:8 |
| gravitist_24 | 永劫の重力術師 | 隠し職 | 永劫の重力術師の心得 | 永劫・重力場 | level:120 job:gravitist_18 prof:10 hidden:{abyssFloor:17} abyss:8 |
| tamer_0 | 獣使い | 基本職 | 獣使いの心得 | 獣の咆哮 | level:19 |
| tamer_1 | 炎刃の獣使い | 応用職 | 炎刃の獣使いの心得 | 炎刃・獣の咆哮 | level:15 job:tamer_0 prof:3 |
| tamer_2 | 氷霜の獣使い | 応用職 | 氷霜の獣使いの心得 | 氷霜・獣の咆哮 | level:15 job:tamer_0 prof:3 |
| tamer_3 | 迅雷の獣使い | 応用職 | 迅雷の獣使いの心得 | 迅雷・獣の咆哮 | level:15 job:tamer_0 prof:3 |
| tamer_4 | 疾風の獣使い | 応用職 | 疾風の獣使いの心得 | 疾風・獣の咆哮 | level:15 job:tamer_0 prof:3 |
| tamer_5 | 大地の獣使い | 応用職 | 大地の獣使いの心得 | 大地・獣の咆哮 | level:15 job:tamer_0 prof:3 |
| tamer_6 | 流水の獣使い | 応用職 | 流水の獣使いの心得 | 流水・獣の咆哮 | level:15 job:tamer_0 prof:3 |
| tamer_7 | 聖光の獣使い | 上級職 | 聖光の獣使いの心得 | 聖光・獣の咆哮 | level:35 job:tamer_6 prof:5 kills:300 |
| tamer_8 | 闇夜の獣使い | 上級職 | 闇夜の獣使いの心得 | 闇夜・獣の咆哮 | level:35 job:tamer_4 prof:5 kills:300 |
| tamer_9 | 鋼鉄の獣使い | 上級職 | 鋼鉄の獣使いの心得 | 鋼鉄・獣の咆哮 | level:35 job:tamer_5 prof:5 kills:300 |
| tamer_10 | 血盟の獣使い | 上級職 | 血盟の獣使いの心得 | 血盟・獣の咆哮 | level:35 job:tamer_1 prof:5 kills:300 |
| tamer_11 | 幻影の獣使い | 上級職 | 幻影の獣使いの心得 | 幻影・獣の咆哮 | level:35 job:tamer_2 prof:5 kills:300 |
| tamer_12 | 星詠の獣使い | 上級職 | 星詠の獣使いの心得 | 星詠・獣の咆哮 | level:35 job:tamer_3 prof:5 kills:300 |
| tamer_13 | 黄昏の獣使い | 特殊職 | 黄昏の獣使いの心得 | 黄昏・獣の咆哮 | level:55 job:tamer_7 prof:6 clear:{dungeon:d03,floor:30} |
| tamer_14 | 深淵の獣使い | 特殊職 | 深淵の獣使いの心得 | 深淵・獣の咆哮 | level:55 job:tamer_8 prof:6 clear:{dungeon:d04,floor:30} |
| tamer_15 | 竜血の獣使い | 特殊職 | 竜血の獣使いの心得 | 竜血・獣の咆哮 | level:55 job:tamer_10 prof:6 clear:{dungeon:d05,floor:30} |
| tamer_16 | 機巧の獣使い | 特殊職 | 機巧の獣使いの心得 | 機巧・獣の咆哮 | level:55 job:tamer_9 prof:6 clear:{dungeon:d06,floor:30} |
| tamer_17 | 霊樹の獣使い | 特殊職 | 霊樹の獣使いの心得 | 霊樹・獣の咆哮 | level:55 job:tamer_11 prof:6 clear:{dungeon:d07,floor:30} |
| tamer_18 | 時渡りの獣使い | 希少職 | 時渡りの獣使いの心得 | 時渡り・獣の咆哮 | level:85 job:tamer_12 prof:8 boss:{diff:HARD,count:13} clear:{dungeon:d08,floor:60} |
| tamer_19 | 重界の獣使い | 希少職 | 重界の獣使いの心得 | 重界・獣の咆哮 | level:85 job:tamer_14 prof:8 boss:{diff:HARD,count:13} clear:{dungeon:d09,floor:60} |
| tamer_20 | 虚無の獣使い | 希少職 | 虚無の獣使いの心得 | 虚無・獣の咆哮 | level:85 job:tamer_13 prof:8 boss:{diff:HARD,count:13} clear:{dungeon:d10,floor:60} |
| tamer_21 | 神託の獣使い | 希少職 | 神託の獣使いの心得 | 神託・獣の咆哮 | level:85 job:tamer_17 prof:8 boss:{diff:HARD,count:13} clear:{dungeon:d11,floor:60} |
| tamer_22 | 終焉の獣使い | 隠し職 | 終焉の獣使いの心得 | 終焉・獣の咆哮 | level:120 job:tamer_20 prof:10 hidden:{npcBond:80} abyss:9 |
| tamer_23 | 原初の獣使い | 隠し職 | 原初の獣使いの心得 | 原初・獣の咆哮 | level:120 job:tamer_21 prof:10 hidden:{npcBond:80} abyss:9 |
| tamer_24 | 永劫の獣使い | 隠し職 | 永劫の獣使いの心得 | 永劫・獣の咆哮 | level:120 job:tamer_18 prof:10 hidden:{npcBond:80} abyss:9 |
| dragoon_0 | 竜騎士 | 基本職 | 竜騎士の心得 | 竜跳躍 | level:21 |
| dragoon_1 | 炎刃の竜騎士 | 応用職 | 炎刃の竜騎士の心得 | 炎刃・竜跳躍 | level:15 job:dragoon_0 prof:3 |
| dragoon_2 | 氷霜の竜騎士 | 応用職 | 氷霜の竜騎士の心得 | 氷霜・竜跳躍 | level:15 job:dragoon_0 prof:3 |
| dragoon_3 | 迅雷の竜騎士 | 応用職 | 迅雷の竜騎士の心得 | 迅雷・竜跳躍 | level:15 job:dragoon_0 prof:3 |
| dragoon_4 | 疾風の竜騎士 | 応用職 | 疾風の竜騎士の心得 | 疾風・竜跳躍 | level:15 job:dragoon_0 prof:3 |
| dragoon_5 | 大地の竜騎士 | 応用職 | 大地の竜騎士の心得 | 大地・竜跳躍 | level:15 job:dragoon_0 prof:3 |
| dragoon_6 | 流水の竜騎士 | 応用職 | 流水の竜騎士の心得 | 流水・竜跳躍 | level:15 job:dragoon_0 prof:3 |
| dragoon_7 | 聖光の竜騎士 | 上級職 | 聖光の竜騎士の心得 | 聖光・竜跳躍 | level:35 job:dragoon_6 prof:5 kills:300 |
| dragoon_8 | 闇夜の竜騎士 | 上級職 | 闇夜の竜騎士の心得 | 闇夜・竜跳躍 | level:35 job:dragoon_4 prof:5 kills:300 |
| dragoon_9 | 鋼鉄の竜騎士 | 上級職 | 鋼鉄の竜騎士の心得 | 鋼鉄・竜跳躍 | level:35 job:dragoon_5 prof:5 kills:300 |
| dragoon_10 | 血盟の竜騎士 | 上級職 | 血盟の竜騎士の心得 | 血盟・竜跳躍 | level:35 job:dragoon_1 prof:5 kills:300 |
| dragoon_11 | 幻影の竜騎士 | 上級職 | 幻影の竜騎士の心得 | 幻影・竜跳躍 | level:35 job:dragoon_2 prof:5 kills:300 |
| dragoon_12 | 星詠の竜騎士 | 上級職 | 星詠の竜騎士の心得 | 星詠・竜跳躍 | level:35 job:dragoon_3 prof:5 kills:300 |
| dragoon_13 | 黄昏の竜騎士 | 特殊職 | 黄昏の竜騎士の心得 | 黄昏・竜跳躍 | level:55 job:dragoon_7 prof:6 clear:{dungeon:d03,floor:30} |
| dragoon_14 | 深淵の竜騎士 | 特殊職 | 深淵の竜騎士の心得 | 深淵・竜跳躍 | level:55 job:dragoon_8 prof:6 clear:{dungeon:d04,floor:30} |
| dragoon_15 | 竜血の竜騎士 | 特殊職 | 竜血の竜騎士の心得 | 竜血・竜跳躍 | level:55 job:dragoon_10 prof:6 clear:{dungeon:d05,floor:30} |
| dragoon_16 | 機巧の竜騎士 | 特殊職 | 機巧の竜騎士の心得 | 機巧・竜跳躍 | level:55 job:dragoon_9 prof:6 clear:{dungeon:d06,floor:30} |
| dragoon_17 | 霊樹の竜騎士 | 特殊職 | 霊樹の竜騎士の心得 | 霊樹・竜跳躍 | level:55 job:dragoon_11 prof:6 clear:{dungeon:d07,floor:30} |
| dragoon_18 | 時渡りの竜騎士 | 希少職 | 時渡りの竜騎士の心得 | 時渡り・竜跳躍 | level:85 job:dragoon_12 prof:8 boss:{diff:HARD,count:14} clear:{dungeon:d08,floor:60} |
| dragoon_19 | 重界の竜騎士 | 希少職 | 重界の竜騎士の心得 | 重界・竜跳躍 | level:85 job:dragoon_14 prof:8 boss:{diff:HARD,count:14} clear:{dungeon:d09,floor:60} |
| dragoon_20 | 虚無の竜騎士 | 希少職 | 虚無の竜騎士の心得 | 虚無・竜跳躍 | level:85 job:dragoon_13 prof:8 boss:{diff:HARD,count:14} clear:{dungeon:d10,floor:60} |
| dragoon_21 | 神託の竜騎士 | 希少職 | 神託の竜騎士の心得 | 神託・竜跳躍 | level:85 job:dragoon_17 prof:8 boss:{diff:HARD,count:14} clear:{dungeon:d11,floor:60} |
| dragoon_22 | 終焉の竜騎士 | 隠し職 | 終焉の竜騎士の心得 | 終焉・竜跳躍 | level:120 job:dragoon_20 prof:10 hidden:{item:relic_end} abyss:10 |
| dragoon_23 | 原初の竜騎士 | 隠し職 | 原初の竜騎士の心得 | 原初・竜跳躍 | level:120 job:dragoon_21 prof:10 hidden:{item:relic_origin} abyss:10 |
| dragoon_24 | 永劫の竜騎士 | 隠し職 | 永劫の竜騎士の心得 | 永劫・竜跳躍 | level:120 job:dragoon_18 prof:10 hidden:{item:relic_eternity} abyss:10 |
| spellblade_0 | 魔剣士 | 基本職 | 魔剣士の心得 | 魔刃 | level:3 |
| spellblade_1 | 炎刃の魔剣士 | 応用職 | 炎刃の魔剣士の心得 | 炎刃・魔刃 | level:15 job:spellblade_0 prof:3 |
| spellblade_2 | 氷霜の魔剣士 | 応用職 | 氷霜の魔剣士の心得 | 氷霜・魔刃 | level:15 job:spellblade_0 prof:3 |
| spellblade_3 | 迅雷の魔剣士 | 応用職 | 迅雷の魔剣士の心得 | 迅雷・魔刃 | level:15 job:spellblade_0 prof:3 |
| spellblade_4 | 疾風の魔剣士 | 応用職 | 疾風の魔剣士の心得 | 疾風・魔刃 | level:15 job:spellblade_0 prof:3 |
| spellblade_5 | 大地の魔剣士 | 応用職 | 大地の魔剣士の心得 | 大地・魔刃 | level:15 job:spellblade_0 prof:3 |
| spellblade_6 | 流水の魔剣士 | 応用職 | 流水の魔剣士の心得 | 流水・魔刃 | level:15 job:spellblade_0 prof:3 |
| spellblade_7 | 聖光の魔剣士 | 上級職 | 聖光の魔剣士の心得 | 聖光・魔刃 | level:35 job:spellblade_6 prof:5 kills:300 |
| spellblade_8 | 闇夜の魔剣士 | 上級職 | 闇夜の魔剣士の心得 | 闇夜・魔刃 | level:35 job:spellblade_4 prof:5 kills:300 |
| spellblade_9 | 鋼鉄の魔剣士 | 上級職 | 鋼鉄の魔剣士の心得 | 鋼鉄・魔刃 | level:35 job:spellblade_5 prof:5 kills:300 |
| spellblade_10 | 血盟の魔剣士 | 上級職 | 血盟の魔剣士の心得 | 血盟・魔刃 | level:35 job:spellblade_1 prof:5 kills:300 |
| spellblade_11 | 幻影の魔剣士 | 上級職 | 幻影の魔剣士の心得 | 幻影・魔刃 | level:35 job:spellblade_2 prof:5 kills:300 |
| spellblade_12 | 星詠の魔剣士 | 上級職 | 星詠の魔剣士の心得 | 星詠・魔刃 | level:35 job:spellblade_3 prof:5 kills:300 |
| spellblade_13 | 黄昏の魔剣士 | 特殊職 | 黄昏の魔剣士の心得 | 黄昏・魔刃 | level:55 job:spellblade_7 prof:6 clear:{dungeon:d03,floor:30} |
| spellblade_14 | 深淵の魔剣士 | 特殊職 | 深淵の魔剣士の心得 | 深淵・魔刃 | level:55 job:spellblade_8 prof:6 clear:{dungeon:d04,floor:30} |
| spellblade_15 | 竜血の魔剣士 | 特殊職 | 竜血の魔剣士の心得 | 竜血・魔刃 | level:55 job:spellblade_10 prof:6 clear:{dungeon:d05,floor:30} |
| spellblade_16 | 機巧の魔剣士 | 特殊職 | 機巧の魔剣士の心得 | 機巧・魔刃 | level:55 job:spellblade_9 prof:6 clear:{dungeon:d06,floor:30} |
| spellblade_17 | 霊樹の魔剣士 | 特殊職 | 霊樹の魔剣士の心得 | 霊樹・魔刃 | level:55 job:spellblade_11 prof:6 clear:{dungeon:d07,floor:30} |
| spellblade_18 | 時渡りの魔剣士 | 希少職 | 時渡りの魔剣士の心得 | 時渡り・魔刃 | level:85 job:spellblade_12 prof:8 boss:{diff:HARD,count:10} clear:{dungeon:d08,floor:60} |
| spellblade_19 | 重界の魔剣士 | 希少職 | 重界の魔剣士の心得 | 重界・魔刃 | level:85 job:spellblade_14 prof:8 boss:{diff:HARD,count:10} clear:{dungeon:d09,floor:60} |
| spellblade_20 | 虚無の魔剣士 | 希少職 | 虚無の魔剣士の心得 | 虚無・魔刃 | level:85 job:spellblade_13 prof:8 boss:{diff:HARD,count:10} clear:{dungeon:d10,floor:60} |
| spellblade_21 | 神託の魔剣士 | 希少職 | 神託の魔剣士の心得 | 神託・魔刃 | level:85 job:spellblade_17 prof:8 boss:{diff:HARD,count:10} clear:{dungeon:d11,floor:60} |
| spellblade_22 | 終焉の魔剣士 | 隠し職 | 終焉の魔剣士の心得 | 終焉・魔刃 | level:120 job:spellblade_20 prof:10 hidden:{abyssFloor:10} abyss:5 |
| spellblade_23 | 原初の魔剣士 | 隠し職 | 原初の魔剣士の心得 | 原初・魔刃 | level:120 job:spellblade_21 prof:10 hidden:{abyssFloor:10} abyss:5 |
| spellblade_24 | 永劫の魔剣士 | 隠し職 | 永劫の魔剣士の心得 | 永劫・魔刃 | level:120 job:spellblade_18 prof:10 hidden:{abyssFloor:10} abyss:5 |
| magefist_0 | 魔拳士 | 基本職 | 魔拳士の心得 | 魔力解放 | level:5 |
| magefist_1 | 炎刃の魔拳士 | 応用職 | 炎刃の魔拳士の心得 | 炎刃・魔力解放 | level:15 job:magefist_0 prof:3 |
| magefist_2 | 氷霜の魔拳士 | 応用職 | 氷霜の魔拳士の心得 | 氷霜・魔力解放 | level:15 job:magefist_0 prof:3 |
| magefist_3 | 迅雷の魔拳士 | 応用職 | 迅雷の魔拳士の心得 | 迅雷・魔力解放 | level:15 job:magefist_0 prof:3 |
| magefist_4 | 疾風の魔拳士 | 応用職 | 疾風の魔拳士の心得 | 疾風・魔力解放 | level:15 job:magefist_0 prof:3 |
| magefist_5 | 大地の魔拳士 | 応用職 | 大地の魔拳士の心得 | 大地・魔力解放 | level:15 job:magefist_0 prof:3 |
| magefist_6 | 流水の魔拳士 | 応用職 | 流水の魔拳士の心得 | 流水・魔力解放 | level:15 job:magefist_0 prof:3 |
| magefist_7 | 聖光の魔拳士 | 上級職 | 聖光の魔拳士の心得 | 聖光・魔力解放 | level:35 job:magefist_6 prof:5 kills:300 |
| magefist_8 | 闇夜の魔拳士 | 上級職 | 闇夜の魔拳士の心得 | 闇夜・魔力解放 | level:35 job:magefist_4 prof:5 kills:300 |
| magefist_9 | 鋼鉄の魔拳士 | 上級職 | 鋼鉄の魔拳士の心得 | 鋼鉄・魔力解放 | level:35 job:magefist_5 prof:5 kills:300 |
| magefist_10 | 血盟の魔拳士 | 上級職 | 血盟の魔拳士の心得 | 血盟・魔力解放 | level:35 job:magefist_1 prof:5 kills:300 |
| magefist_11 | 幻影の魔拳士 | 上級職 | 幻影の魔拳士の心得 | 幻影・魔力解放 | level:35 job:magefist_2 prof:5 kills:300 |
| magefist_12 | 星詠の魔拳士 | 上級職 | 星詠の魔拳士の心得 | 星詠・魔力解放 | level:35 job:magefist_3 prof:5 kills:300 |
| magefist_13 | 黄昏の魔拳士 | 特殊職 | 黄昏の魔拳士の心得 | 黄昏・魔力解放 | level:55 job:magefist_7 prof:6 clear:{dungeon:d03,floor:30} |
| magefist_14 | 深淵の魔拳士 | 特殊職 | 深淵の魔拳士の心得 | 深淵・魔力解放 | level:55 job:magefist_8 prof:6 clear:{dungeon:d04,floor:30} |
| magefist_15 | 竜血の魔拳士 | 特殊職 | 竜血の魔拳士の心得 | 竜血・魔力解放 | level:55 job:magefist_10 prof:6 clear:{dungeon:d05,floor:30} |
| magefist_16 | 機巧の魔拳士 | 特殊職 | 機巧の魔拳士の心得 | 機巧・魔力解放 | level:55 job:magefist_9 prof:6 clear:{dungeon:d06,floor:30} |
| magefist_17 | 霊樹の魔拳士 | 特殊職 | 霊樹の魔拳士の心得 | 霊樹・魔力解放 | level:55 job:magefist_11 prof:6 clear:{dungeon:d07,floor:30} |
| magefist_18 | 時渡りの魔拳士 | 希少職 | 時渡りの魔拳士の心得 | 時渡り・魔力解放 | level:85 job:magefist_12 prof:8 boss:{diff:HARD,count:11} clear:{dungeon:d08,floor:60} |
| magefist_19 | 重界の魔拳士 | 希少職 | 重界の魔拳士の心得 | 重界・魔力解放 | level:85 job:magefist_14 prof:8 boss:{diff:HARD,count:11} clear:{dungeon:d09,floor:60} |
| magefist_20 | 虚無の魔拳士 | 希少職 | 虚無の魔拳士の心得 | 虚無・魔力解放 | level:85 job:magefist_13 prof:8 boss:{diff:HARD,count:11} clear:{dungeon:d10,floor:60} |
| magefist_21 | 神託の魔拳士 | 希少職 | 神託の魔拳士の心得 | 神託・魔力解放 | level:85 job:magefist_17 prof:8 boss:{diff:HARD,count:11} clear:{dungeon:d11,floor:60} |
| magefist_22 | 終焉の魔拳士 | 隠し職 | 終焉の魔拳士の心得 | 終焉・魔力解放 | level:120 job:magefist_20 prof:10 hidden:{npcBond:80} abyss:6 |
| magefist_23 | 原初の魔拳士 | 隠し職 | 原初の魔拳士の心得 | 原初・魔力解放 | level:120 job:magefist_21 prof:10 hidden:{npcBond:80} abyss:6 |
| magefist_24 | 永劫の魔拳士 | 隠し職 | 永劫の魔拳士の心得 | 永劫・魔力解放 | level:120 job:magefist_18 prof:10 hidden:{npcBond:80} abyss:6 |
| warder_0 | 結界師 | 基本職 | 結界師の心得 | 結界 | level:7 |
| warder_1 | 炎刃の結界師 | 応用職 | 炎刃の結界師の心得 | 炎刃・結界 | level:15 job:warder_0 prof:3 |
| warder_2 | 氷霜の結界師 | 応用職 | 氷霜の結界師の心得 | 氷霜・結界 | level:15 job:warder_0 prof:3 |
| warder_3 | 迅雷の結界師 | 応用職 | 迅雷の結界師の心得 | 迅雷・結界 | level:15 job:warder_0 prof:3 |
| warder_4 | 疾風の結界師 | 応用職 | 疾風の結界師の心得 | 疾風・結界 | level:15 job:warder_0 prof:3 |
| warder_5 | 大地の結界師 | 応用職 | 大地の結界師の心得 | 大地・結界 | level:15 job:warder_0 prof:3 |
| warder_6 | 流水の結界師 | 応用職 | 流水の結界師の心得 | 流水・結界 | level:15 job:warder_0 prof:3 |
| warder_7 | 聖光の結界師 | 上級職 | 聖光の結界師の心得 | 聖光・結界 | level:35 job:warder_6 prof:5 kills:300 |
| warder_8 | 闇夜の結界師 | 上級職 | 闇夜の結界師の心得 | 闇夜・結界 | level:35 job:warder_4 prof:5 kills:300 |
| warder_9 | 鋼鉄の結界師 | 上級職 | 鋼鉄の結界師の心得 | 鋼鉄・結界 | level:35 job:warder_5 prof:5 kills:300 |
| warder_10 | 血盟の結界師 | 上級職 | 血盟の結界師の心得 | 血盟・結界 | level:35 job:warder_1 prof:5 kills:300 |
| warder_11 | 幻影の結界師 | 上級職 | 幻影の結界師の心得 | 幻影・結界 | level:35 job:warder_2 prof:5 kills:300 |
| warder_12 | 星詠の結界師 | 上級職 | 星詠の結界師の心得 | 星詠・結界 | level:35 job:warder_3 prof:5 kills:300 |
| warder_13 | 黄昏の結界師 | 特殊職 | 黄昏の結界師の心得 | 黄昏・結界 | level:55 job:warder_7 prof:6 clear:{dungeon:d03,floor:30} |
| warder_14 | 深淵の結界師 | 特殊職 | 深淵の結界師の心得 | 深淵・結界 | level:55 job:warder_8 prof:6 clear:{dungeon:d04,floor:30} |
| warder_15 | 竜血の結界師 | 特殊職 | 竜血の結界師の心得 | 竜血・結界 | level:55 job:warder_10 prof:6 clear:{dungeon:d05,floor:30} |
| warder_16 | 機巧の結界師 | 特殊職 | 機巧の結界師の心得 | 機巧・結界 | level:55 job:warder_9 prof:6 clear:{dungeon:d06,floor:30} |
| warder_17 | 霊樹の結界師 | 特殊職 | 霊樹の結界師の心得 | 霊樹・結界 | level:55 job:warder_11 prof:6 clear:{dungeon:d07,floor:30} |
| warder_18 | 時渡りの結界師 | 希少職 | 時渡りの結界師の心得 | 時渡り・結界 | level:85 job:warder_12 prof:8 boss:{diff:HARD,count:12} clear:{dungeon:d08,floor:60} |
| warder_19 | 重界の結界師 | 希少職 | 重界の結界師の心得 | 重界・結界 | level:85 job:warder_14 prof:8 boss:{diff:HARD,count:12} clear:{dungeon:d09,floor:60} |
| warder_20 | 虚無の結界師 | 希少職 | 虚無の結界師の心得 | 虚無・結界 | level:85 job:warder_13 prof:8 boss:{diff:HARD,count:12} clear:{dungeon:d10,floor:60} |
| warder_21 | 神託の結界師 | 希少職 | 神託の結界師の心得 | 神託・結界 | level:85 job:warder_17 prof:8 boss:{diff:HARD,count:12} clear:{dungeon:d11,floor:60} |
| warder_22 | 終焉の結界師 | 隠し職 | 終焉の結界師の心得 | 終焉・結界 | level:120 job:warder_20 prof:10 hidden:{item:relic_end} abyss:7 |
| warder_23 | 原初の結界師 | 隠し職 | 原初の結界師の心得 | 原初・結界 | level:120 job:warder_21 prof:10 hidden:{item:relic_origin} abyss:7 |
| warder_24 | 永劫の結界師 | 隠し職 | 永劫の結界師の心得 | 永劫・結界 | level:120 job:warder_18 prof:10 hidden:{item:relic_eternity} abyss:7 |
| apothecary_0 | 薬師 | 基本職 | 薬師の心得 | 霊薬 | level:9 |
| apothecary_1 | 炎刃の薬師 | 応用職 | 炎刃の薬師の心得 | 炎刃・霊薬 | level:15 job:apothecary_0 prof:3 |
| apothecary_2 | 氷霜の薬師 | 応用職 | 氷霜の薬師の心得 | 氷霜・霊薬 | level:15 job:apothecary_0 prof:3 |
| apothecary_3 | 迅雷の薬師 | 応用職 | 迅雷の薬師の心得 | 迅雷・霊薬 | level:15 job:apothecary_0 prof:3 |
| apothecary_4 | 疾風の薬師 | 応用職 | 疾風の薬師の心得 | 疾風・霊薬 | level:15 job:apothecary_0 prof:3 |
| apothecary_5 | 大地の薬師 | 応用職 | 大地の薬師の心得 | 大地・霊薬 | level:15 job:apothecary_0 prof:3 |
| apothecary_6 | 流水の薬師 | 応用職 | 流水の薬師の心得 | 流水・霊薬 | level:15 job:apothecary_0 prof:3 |
| apothecary_7 | 聖光の薬師 | 上級職 | 聖光の薬師の心得 | 聖光・霊薬 | level:35 job:apothecary_6 prof:5 kills:300 |
| apothecary_8 | 闇夜の薬師 | 上級職 | 闇夜の薬師の心得 | 闇夜・霊薬 | level:35 job:apothecary_4 prof:5 kills:300 |
| apothecary_9 | 鋼鉄の薬師 | 上級職 | 鋼鉄の薬師の心得 | 鋼鉄・霊薬 | level:35 job:apothecary_5 prof:5 kills:300 |
| apothecary_10 | 血盟の薬師 | 上級職 | 血盟の薬師の心得 | 血盟・霊薬 | level:35 job:apothecary_1 prof:5 kills:300 |
| apothecary_11 | 幻影の薬師 | 上級職 | 幻影の薬師の心得 | 幻影・霊薬 | level:35 job:apothecary_2 prof:5 kills:300 |
| apothecary_12 | 星詠の薬師 | 上級職 | 星詠の薬師の心得 | 星詠・霊薬 | level:35 job:apothecary_3 prof:5 kills:300 |
| apothecary_13 | 黄昏の薬師 | 特殊職 | 黄昏の薬師の心得 | 黄昏・霊薬 | level:55 job:apothecary_7 prof:6 clear:{dungeon:d03,floor:30} |
| apothecary_14 | 深淵の薬師 | 特殊職 | 深淵の薬師の心得 | 深淵・霊薬 | level:55 job:apothecary_8 prof:6 clear:{dungeon:d04,floor:30} |
| apothecary_15 | 竜血の薬師 | 特殊職 | 竜血の薬師の心得 | 竜血・霊薬 | level:55 job:apothecary_10 prof:6 clear:{dungeon:d05,floor:30} |
| apothecary_16 | 機巧の薬師 | 特殊職 | 機巧の薬師の心得 | 機巧・霊薬 | level:55 job:apothecary_9 prof:6 clear:{dungeon:d06,floor:30} |
| apothecary_17 | 霊樹の薬師 | 特殊職 | 霊樹の薬師の心得 | 霊樹・霊薬 | level:55 job:apothecary_11 prof:6 clear:{dungeon:d07,floor:30} |
| apothecary_18 | 時渡りの薬師 | 希少職 | 時渡りの薬師の心得 | 時渡り・霊薬 | level:85 job:apothecary_12 prof:8 boss:{diff:HARD,count:13} clear:{dungeon:d08,floor:60} |
| apothecary_19 | 重界の薬師 | 希少職 | 重界の薬師の心得 | 重界・霊薬 | level:85 job:apothecary_14 prof:8 boss:{diff:HARD,count:13} clear:{dungeon:d09,floor:60} |
| apothecary_20 | 虚無の薬師 | 希少職 | 虚無の薬師の心得 | 虚無・霊薬 | level:85 job:apothecary_13 prof:8 boss:{diff:HARD,count:13} clear:{dungeon:d10,floor:60} |
| apothecary_21 | 神託の薬師 | 希少職 | 神託の薬師の心得 | 神託・霊薬 | level:85 job:apothecary_17 prof:8 boss:{diff:HARD,count:13} clear:{dungeon:d11,floor:60} |
| apothecary_22 | 終焉の薬師 | 隠し職 | 終焉の薬師の心得 | 終焉・霊薬 | level:120 job:apothecary_20 prof:10 hidden:{abyssFloor:13} abyss:8 |
| apothecary_23 | 原初の薬師 | 隠し職 | 原初の薬師の心得 | 原初・霊薬 | level:120 job:apothecary_21 prof:10 hidden:{abyssFloor:13} abyss:8 |
| apothecary_24 | 永劫の薬師 | 隠し職 | 永劫の薬師の心得 | 永劫・霊薬 | level:120 job:apothecary_18 prof:10 hidden:{abyssFloor:13} abyss:8 |
| merchant_0 | 商人 | 基本職 | 商人の心得 | 投げ銭 | level:11 |
| merchant_1 | 炎刃の商人 | 応用職 | 炎刃の商人の心得 | 炎刃・投げ銭 | level:15 job:merchant_0 prof:3 |
| merchant_2 | 氷霜の商人 | 応用職 | 氷霜の商人の心得 | 氷霜・投げ銭 | level:15 job:merchant_0 prof:3 |
| merchant_3 | 迅雷の商人 | 応用職 | 迅雷の商人の心得 | 迅雷・投げ銭 | level:15 job:merchant_0 prof:3 |
| merchant_4 | 疾風の商人 | 応用職 | 疾風の商人の心得 | 疾風・投げ銭 | level:15 job:merchant_0 prof:3 |
| merchant_5 | 大地の商人 | 応用職 | 大地の商人の心得 | 大地・投げ銭 | level:15 job:merchant_0 prof:3 |
| merchant_6 | 流水の商人 | 応用職 | 流水の商人の心得 | 流水・投げ銭 | level:15 job:merchant_0 prof:3 |
| merchant_7 | 聖光の商人 | 上級職 | 聖光の商人の心得 | 聖光・投げ銭 | level:35 job:merchant_6 prof:5 kills:300 |
| merchant_8 | 闇夜の商人 | 上級職 | 闇夜の商人の心得 | 闇夜・投げ銭 | level:35 job:merchant_4 prof:5 kills:300 |
| merchant_9 | 鋼鉄の商人 | 上級職 | 鋼鉄の商人の心得 | 鋼鉄・投げ銭 | level:35 job:merchant_5 prof:5 kills:300 |
| merchant_10 | 血盟の商人 | 上級職 | 血盟の商人の心得 | 血盟・投げ銭 | level:35 job:merchant_1 prof:5 kills:300 |
| merchant_11 | 幻影の商人 | 上級職 | 幻影の商人の心得 | 幻影・投げ銭 | level:35 job:merchant_2 prof:5 kills:300 |
| merchant_12 | 星詠の商人 | 上級職 | 星詠の商人の心得 | 星詠・投げ銭 | level:35 job:merchant_3 prof:5 kills:300 |
| merchant_13 | 黄昏の商人 | 特殊職 | 黄昏の商人の心得 | 黄昏・投げ銭 | level:55 job:merchant_7 prof:6 clear:{dungeon:d03,floor:30} |
| merchant_14 | 深淵の商人 | 特殊職 | 深淵の商人の心得 | 深淵・投げ銭 | level:55 job:merchant_8 prof:6 clear:{dungeon:d04,floor:30} |
| merchant_15 | 竜血の商人 | 特殊職 | 竜血の商人の心得 | 竜血・投げ銭 | level:55 job:merchant_10 prof:6 clear:{dungeon:d05,floor:30} |
| merchant_16 | 機巧の商人 | 特殊職 | 機巧の商人の心得 | 機巧・投げ銭 | level:55 job:merchant_9 prof:6 clear:{dungeon:d06,floor:30} |
| merchant_17 | 霊樹の商人 | 特殊職 | 霊樹の商人の心得 | 霊樹・投げ銭 | level:55 job:merchant_11 prof:6 clear:{dungeon:d07,floor:30} |
| merchant_18 | 時渡りの商人 | 希少職 | 時渡りの商人の心得 | 時渡り・投げ銭 | level:85 job:merchant_12 prof:8 boss:{diff:HARD,count:14} clear:{dungeon:d08,floor:60} |
| merchant_19 | 重界の商人 | 希少職 | 重界の商人の心得 | 重界・投げ銭 | level:85 job:merchant_14 prof:8 boss:{diff:HARD,count:14} clear:{dungeon:d09,floor:60} |
| merchant_20 | 虚無の商人 | 希少職 | 虚無の商人の心得 | 虚無・投げ銭 | level:85 job:merchant_13 prof:8 boss:{diff:HARD,count:14} clear:{dungeon:d10,floor:60} |
| merchant_21 | 神託の商人 | 希少職 | 神託の商人の心得 | 神託・投げ銭 | level:85 job:merchant_17 prof:8 boss:{diff:HARD,count:14} clear:{dungeon:d11,floor:60} |
| merchant_22 | 終焉の商人 | 隠し職 | 終焉の商人の心得 | 終焉・投げ銭 | level:120 job:merchant_20 prof:10 hidden:{npcBond:80} abyss:9 |
| merchant_23 | 原初の商人 | 隠し職 | 原初の商人の心得 | 原初・投げ銭 | level:120 job:merchant_21 prof:10 hidden:{npcBond:80} abyss:9 |
| merchant_24 | 永劫の商人 | 隠し職 | 永劫の商人の心得 | 永劫・投げ銭 | level:120 job:merchant_18 prof:10 hidden:{npcBond:80} abyss:9 |
| scholar_0 | 学者 | 基本職 | 学者の心得 | 弱点看破 | level:13 |
| scholar_1 | 炎刃の学者 | 応用職 | 炎刃の学者の心得 | 炎刃・弱点看破 | level:15 job:scholar_0 prof:3 |
| scholar_2 | 氷霜の学者 | 応用職 | 氷霜の学者の心得 | 氷霜・弱点看破 | level:15 job:scholar_0 prof:3 |
| scholar_3 | 迅雷の学者 | 応用職 | 迅雷の学者の心得 | 迅雷・弱点看破 | level:15 job:scholar_0 prof:3 |
| scholar_4 | 疾風の学者 | 応用職 | 疾風の学者の心得 | 疾風・弱点看破 | level:15 job:scholar_0 prof:3 |
| scholar_5 | 大地の学者 | 応用職 | 大地の学者の心得 | 大地・弱点看破 | level:15 job:scholar_0 prof:3 |
| scholar_6 | 流水の学者 | 応用職 | 流水の学者の心得 | 流水・弱点看破 | level:15 job:scholar_0 prof:3 |
| scholar_7 | 聖光の学者 | 上級職 | 聖光の学者の心得 | 聖光・弱点看破 | level:35 job:scholar_6 prof:5 kills:300 |
| scholar_8 | 闇夜の学者 | 上級職 | 闇夜の学者の心得 | 闇夜・弱点看破 | level:35 job:scholar_4 prof:5 kills:300 |
| scholar_9 | 鋼鉄の学者 | 上級職 | 鋼鉄の学者の心得 | 鋼鉄・弱点看破 | level:35 job:scholar_5 prof:5 kills:300 |
| scholar_10 | 血盟の学者 | 上級職 | 血盟の学者の心得 | 血盟・弱点看破 | level:35 job:scholar_1 prof:5 kills:300 |
| scholar_11 | 幻影の学者 | 上級職 | 幻影の学者の心得 | 幻影・弱点看破 | level:35 job:scholar_2 prof:5 kills:300 |
| scholar_12 | 星詠の学者 | 上級職 | 星詠の学者の心得 | 星詠・弱点看破 | level:35 job:scholar_3 prof:5 kills:300 |
| scholar_13 | 黄昏の学者 | 特殊職 | 黄昏の学者の心得 | 黄昏・弱点看破 | level:55 job:scholar_7 prof:6 clear:{dungeon:d03,floor:30} |
| scholar_14 | 深淵の学者 | 特殊職 | 深淵の学者の心得 | 深淵・弱点看破 | level:55 job:scholar_8 prof:6 clear:{dungeon:d04,floor:30} |
| scholar_15 | 竜血の学者 | 特殊職 | 竜血の学者の心得 | 竜血・弱点看破 | level:55 job:scholar_10 prof:6 clear:{dungeon:d05,floor:30} |
| scholar_16 | 機巧の学者 | 特殊職 | 機巧の学者の心得 | 機巧・弱点看破 | level:55 job:scholar_9 prof:6 clear:{dungeon:d06,floor:30} |
| scholar_17 | 霊樹の学者 | 特殊職 | 霊樹の学者の心得 | 霊樹・弱点看破 | level:55 job:scholar_11 prof:6 clear:{dungeon:d07,floor:30} |
| scholar_18 | 時渡りの学者 | 希少職 | 時渡りの学者の心得 | 時渡り・弱点看破 | level:85 job:scholar_12 prof:8 boss:{diff:HARD,count:10} clear:{dungeon:d08,floor:60} |
| scholar_19 | 重界の学者 | 希少職 | 重界の学者の心得 | 重界・弱点看破 | level:85 job:scholar_14 prof:8 boss:{diff:HARD,count:10} clear:{dungeon:d09,floor:60} |
| scholar_20 | 虚無の学者 | 希少職 | 虚無の学者の心得 | 虚無・弱点看破 | level:85 job:scholar_13 prof:8 boss:{diff:HARD,count:10} clear:{dungeon:d10,floor:60} |
| scholar_21 | 神託の学者 | 希少職 | 神託の学者の心得 | 神託・弱点看破 | level:85 job:scholar_17 prof:8 boss:{diff:HARD,count:10} clear:{dungeon:d11,floor:60} |
| scholar_22 | 終焉の学者 | 隠し職 | 終焉の学者の心得 | 終焉・弱点看破 | level:120 job:scholar_20 prof:10 hidden:{item:relic_end} abyss:10 |
| scholar_23 | 原初の学者 | 隠し職 | 原初の学者の心得 | 原初・弱点看破 | level:120 job:scholar_21 prof:10 hidden:{item:relic_origin} abyss:10 |
| scholar_24 | 永劫の学者 | 隠し職 | 永劫の学者の心得 | 永劫・弱点看破 | level:120 job:scholar_18 prof:10 hidden:{item:relic_eternity} abyss:10 |
| wanderer_0 | 旅人 | 基本職 | 旅人の心得 | 旅の知恵 | level:15 |
| wanderer_1 | 炎刃の旅人 | 応用職 | 炎刃の旅人の心得 | 炎刃・旅の知恵 | level:15 job:wanderer_0 prof:3 |
| wanderer_2 | 氷霜の旅人 | 応用職 | 氷霜の旅人の心得 | 氷霜・旅の知恵 | level:15 job:wanderer_0 prof:3 |
| wanderer_3 | 迅雷の旅人 | 応用職 | 迅雷の旅人の心得 | 迅雷・旅の知恵 | level:15 job:wanderer_0 prof:3 |
| wanderer_4 | 疾風の旅人 | 応用職 | 疾風の旅人の心得 | 疾風・旅の知恵 | level:15 job:wanderer_0 prof:3 |
| wanderer_5 | 大地の旅人 | 応用職 | 大地の旅人の心得 | 大地・旅の知恵 | level:15 job:wanderer_0 prof:3 |
| wanderer_6 | 流水の旅人 | 応用職 | 流水の旅人の心得 | 流水・旅の知恵 | level:15 job:wanderer_0 prof:3 |
| wanderer_7 | 聖光の旅人 | 上級職 | 聖光の旅人の心得 | 聖光・旅の知恵 | level:35 job:wanderer_6 prof:5 kills:300 |
| wanderer_8 | 闇夜の旅人 | 上級職 | 闇夜の旅人の心得 | 闇夜・旅の知恵 | level:35 job:wanderer_4 prof:5 kills:300 |
| wanderer_9 | 鋼鉄の旅人 | 上級職 | 鋼鉄の旅人の心得 | 鋼鉄・旅の知恵 | level:35 job:wanderer_5 prof:5 kills:300 |
| wanderer_10 | 血盟の旅人 | 上級職 | 血盟の旅人の心得 | 血盟・旅の知恵 | level:35 job:wanderer_1 prof:5 kills:300 |
| wanderer_11 | 幻影の旅人 | 上級職 | 幻影の旅人の心得 | 幻影・旅の知恵 | level:35 job:wanderer_2 prof:5 kills:300 |
| wanderer_12 | 星詠の旅人 | 上級職 | 星詠の旅人の心得 | 星詠・旅の知恵 | level:35 job:wanderer_3 prof:5 kills:300 |
| wanderer_13 | 黄昏の旅人 | 特殊職 | 黄昏の旅人の心得 | 黄昏・旅の知恵 | level:55 job:wanderer_7 prof:6 clear:{dungeon:d03,floor:30} |
| wanderer_14 | 深淵の旅人 | 特殊職 | 深淵の旅人の心得 | 深淵・旅の知恵 | level:55 job:wanderer_8 prof:6 clear:{dungeon:d04,floor:30} |
| wanderer_15 | 竜血の旅人 | 特殊職 | 竜血の旅人の心得 | 竜血・旅の知恵 | level:55 job:wanderer_10 prof:6 clear:{dungeon:d05,floor:30} |
| wanderer_16 | 機巧の旅人 | 特殊職 | 機巧の旅人の心得 | 機巧・旅の知恵 | level:55 job:wanderer_9 prof:6 clear:{dungeon:d06,floor:30} |
| wanderer_17 | 霊樹の旅人 | 特殊職 | 霊樹の旅人の心得 | 霊樹・旅の知恵 | level:55 job:wanderer_11 prof:6 clear:{dungeon:d07,floor:30} |
| wanderer_18 | 時渡りの旅人 | 希少職 | 時渡りの旅人の心得 | 時渡り・旅の知恵 | level:85 job:wanderer_12 prof:8 boss:{diff:HARD,count:11} clear:{dungeon:d08,floor:60} |
| wanderer_19 | 重界の旅人 | 希少職 | 重界の旅人の心得 | 重界・旅の知恵 | level:85 job:wanderer_14 prof:8 boss:{diff:HARD,count:11} clear:{dungeon:d09,floor:60} |
| wanderer_20 | 虚無の旅人 | 希少職 | 虚無の旅人の心得 | 虚無・旅の知恵 | level:85 job:wanderer_13 prof:8 boss:{diff:HARD,count:11} clear:{dungeon:d10,floor:60} |
| wanderer_21 | 神託の旅人 | 希少職 | 神託の旅人の心得 | 神託・旅の知恵 | level:85 job:wanderer_17 prof:8 boss:{diff:HARD,count:11} clear:{dungeon:d11,floor:60} |
| wanderer_22 | 終焉の旅人 | 隠し職 | 終焉の旅人の心得 | 終焉・旅の知恵 | level:120 job:wanderer_20 prof:10 hidden:{abyssFloor:16} abyss:5 |
| wanderer_23 | 原初の旅人 | 隠し職 | 原初の旅人の心得 | 原初・旅の知恵 | level:120 job:wanderer_21 prof:10 hidden:{abyssFloor:16} abyss:5 |
| wanderer_24 | 永劫の旅人 | 隠し職 | 永劫の旅人の心得 | 永劫・旅の知恵 | level:120 job:wanderer_18 prof:10 hidden:{abyssFloor:16} abyss:5 |
| pirate_0 | 海賊 | 基本職 | 海賊の心得 | 一斉砲撃 | level:17 |
| pirate_1 | 炎刃の海賊 | 応用職 | 炎刃の海賊の心得 | 炎刃・一斉砲撃 | level:15 job:pirate_0 prof:3 |
| pirate_2 | 氷霜の海賊 | 応用職 | 氷霜の海賊の心得 | 氷霜・一斉砲撃 | level:15 job:pirate_0 prof:3 |
| pirate_3 | 迅雷の海賊 | 応用職 | 迅雷の海賊の心得 | 迅雷・一斉砲撃 | level:15 job:pirate_0 prof:3 |
| pirate_4 | 疾風の海賊 | 応用職 | 疾風の海賊の心得 | 疾風・一斉砲撃 | level:15 job:pirate_0 prof:3 |
| pirate_5 | 大地の海賊 | 応用職 | 大地の海賊の心得 | 大地・一斉砲撃 | level:15 job:pirate_0 prof:3 |
| pirate_6 | 流水の海賊 | 応用職 | 流水の海賊の心得 | 流水・一斉砲撃 | level:15 job:pirate_0 prof:3 |
| pirate_7 | 聖光の海賊 | 上級職 | 聖光の海賊の心得 | 聖光・一斉砲撃 | level:35 job:pirate_6 prof:5 kills:300 |
| pirate_8 | 闇夜の海賊 | 上級職 | 闇夜の海賊の心得 | 闇夜・一斉砲撃 | level:35 job:pirate_4 prof:5 kills:300 |
| pirate_9 | 鋼鉄の海賊 | 上級職 | 鋼鉄の海賊の心得 | 鋼鉄・一斉砲撃 | level:35 job:pirate_5 prof:5 kills:300 |
| pirate_10 | 血盟の海賊 | 上級職 | 血盟の海賊の心得 | 血盟・一斉砲撃 | level:35 job:pirate_1 prof:5 kills:300 |
| pirate_11 | 幻影の海賊 | 上級職 | 幻影の海賊の心得 | 幻影・一斉砲撃 | level:35 job:pirate_2 prof:5 kills:300 |
| pirate_12 | 星詠の海賊 | 上級職 | 星詠の海賊の心得 | 星詠・一斉砲撃 | level:35 job:pirate_3 prof:5 kills:300 |
| pirate_13 | 黄昏の海賊 | 特殊職 | 黄昏の海賊の心得 | 黄昏・一斉砲撃 | level:55 job:pirate_7 prof:6 clear:{dungeon:d03,floor:30} |
| pirate_14 | 深淵の海賊 | 特殊職 | 深淵の海賊の心得 | 深淵・一斉砲撃 | level:55 job:pirate_8 prof:6 clear:{dungeon:d04,floor:30} |
| pirate_15 | 竜血の海賊 | 特殊職 | 竜血の海賊の心得 | 竜血・一斉砲撃 | level:55 job:pirate_10 prof:6 clear:{dungeon:d05,floor:30} |
| pirate_16 | 機巧の海賊 | 特殊職 | 機巧の海賊の心得 | 機巧・一斉砲撃 | level:55 job:pirate_9 prof:6 clear:{dungeon:d06,floor:30} |
| pirate_17 | 霊樹の海賊 | 特殊職 | 霊樹の海賊の心得 | 霊樹・一斉砲撃 | level:55 job:pirate_11 prof:6 clear:{dungeon:d07,floor:30} |
| pirate_18 | 時渡りの海賊 | 希少職 | 時渡りの海賊の心得 | 時渡り・一斉砲撃 | level:85 job:pirate_12 prof:8 boss:{diff:HARD,count:12} clear:{dungeon:d08,floor:60} |
| pirate_19 | 重界の海賊 | 希少職 | 重界の海賊の心得 | 重界・一斉砲撃 | level:85 job:pirate_14 prof:8 boss:{diff:HARD,count:12} clear:{dungeon:d09,floor:60} |
| pirate_20 | 虚無の海賊 | 希少職 | 虚無の海賊の心得 | 虚無・一斉砲撃 | level:85 job:pirate_13 prof:8 boss:{diff:HARD,count:12} clear:{dungeon:d10,floor:60} |
| pirate_21 | 神託の海賊 | 希少職 | 神託の海賊の心得 | 神託・一斉砲撃 | level:85 job:pirate_17 prof:8 boss:{diff:HARD,count:12} clear:{dungeon:d11,floor:60} |
| pirate_22 | 終焉の海賊 | 隠し職 | 終焉の海賊の心得 | 終焉・一斉砲撃 | level:120 job:pirate_20 prof:10 hidden:{npcBond:80} abyss:6 |
| pirate_23 | 原初の海賊 | 隠し職 | 原初の海賊の心得 | 原初・一斉砲撃 | level:120 job:pirate_21 prof:10 hidden:{npcBond:80} abyss:6 |
| pirate_24 | 永劫の海賊 | 隠し職 | 永劫の海賊の心得 | 永劫・一斉砲撃 | level:120 job:pirate_18 prof:10 hidden:{npcBond:80} abyss:6 |
| mercenary_0 | 傭兵 | 基本職 | 傭兵の心得 | 戦術指揮 | level:19 |
| mercenary_1 | 炎刃の傭兵 | 応用職 | 炎刃の傭兵の心得 | 炎刃・戦術指揮 | level:15 job:mercenary_0 prof:3 |
| mercenary_2 | 氷霜の傭兵 | 応用職 | 氷霜の傭兵の心得 | 氷霜・戦術指揮 | level:15 job:mercenary_0 prof:3 |
| mercenary_3 | 迅雷の傭兵 | 応用職 | 迅雷の傭兵の心得 | 迅雷・戦術指揮 | level:15 job:mercenary_0 prof:3 |
| mercenary_4 | 疾風の傭兵 | 応用職 | 疾風の傭兵の心得 | 疾風・戦術指揮 | level:15 job:mercenary_0 prof:3 |
| mercenary_5 | 大地の傭兵 | 応用職 | 大地の傭兵の心得 | 大地・戦術指揮 | level:15 job:mercenary_0 prof:3 |
| mercenary_6 | 流水の傭兵 | 応用職 | 流水の傭兵の心得 | 流水・戦術指揮 | level:15 job:mercenary_0 prof:3 |
| mercenary_7 | 聖光の傭兵 | 上級職 | 聖光の傭兵の心得 | 聖光・戦術指揮 | level:35 job:mercenary_6 prof:5 kills:300 |
| mercenary_8 | 闇夜の傭兵 | 上級職 | 闇夜の傭兵の心得 | 闇夜・戦術指揮 | level:35 job:mercenary_4 prof:5 kills:300 |
| mercenary_9 | 鋼鉄の傭兵 | 上級職 | 鋼鉄の傭兵の心得 | 鋼鉄・戦術指揮 | level:35 job:mercenary_5 prof:5 kills:300 |
| mercenary_10 | 血盟の傭兵 | 上級職 | 血盟の傭兵の心得 | 血盟・戦術指揮 | level:35 job:mercenary_1 prof:5 kills:300 |
| mercenary_11 | 幻影の傭兵 | 上級職 | 幻影の傭兵の心得 | 幻影・戦術指揮 | level:35 job:mercenary_2 prof:5 kills:300 |
| mercenary_12 | 星詠の傭兵 | 上級職 | 星詠の傭兵の心得 | 星詠・戦術指揮 | level:35 job:mercenary_3 prof:5 kills:300 |
| mercenary_13 | 黄昏の傭兵 | 特殊職 | 黄昏の傭兵の心得 | 黄昏・戦術指揮 | level:55 job:mercenary_7 prof:6 clear:{dungeon:d03,floor:30} |
| mercenary_14 | 深淵の傭兵 | 特殊職 | 深淵の傭兵の心得 | 深淵・戦術指揮 | level:55 job:mercenary_8 prof:6 clear:{dungeon:d04,floor:30} |
| mercenary_15 | 竜血の傭兵 | 特殊職 | 竜血の傭兵の心得 | 竜血・戦術指揮 | level:55 job:mercenary_10 prof:6 clear:{dungeon:d05,floor:30} |
| mercenary_16 | 機巧の傭兵 | 特殊職 | 機巧の傭兵の心得 | 機巧・戦術指揮 | level:55 job:mercenary_9 prof:6 clear:{dungeon:d06,floor:30} |
| mercenary_17 | 霊樹の傭兵 | 特殊職 | 霊樹の傭兵の心得 | 霊樹・戦術指揮 | level:55 job:mercenary_11 prof:6 clear:{dungeon:d07,floor:30} |
| mercenary_18 | 時渡りの傭兵 | 希少職 | 時渡りの傭兵の心得 | 時渡り・戦術指揮 | level:85 job:mercenary_12 prof:8 boss:{diff:HARD,count:13} clear:{dungeon:d08,floor:60} |
| mercenary_19 | 重界の傭兵 | 希少職 | 重界の傭兵の心得 | 重界・戦術指揮 | level:85 job:mercenary_14 prof:8 boss:{diff:HARD,count:13} clear:{dungeon:d09,floor:60} |
| mercenary_20 | 虚無の傭兵 | 希少職 | 虚無の傭兵の心得 | 虚無・戦術指揮 | level:85 job:mercenary_13 prof:8 boss:{diff:HARD,count:13} clear:{dungeon:d10,floor:60} |
| mercenary_21 | 神託の傭兵 | 希少職 | 神託の傭兵の心得 | 神託・戦術指揮 | level:85 job:mercenary_17 prof:8 boss:{diff:HARD,count:13} clear:{dungeon:d11,floor:60} |
| mercenary_22 | 終焉の傭兵 | 隠し職 | 終焉の傭兵の心得 | 終焉・戦術指揮 | level:120 job:mercenary_20 prof:10 hidden:{item:relic_end} abyss:7 |
| mercenary_23 | 原初の傭兵 | 隠し職 | 原初の傭兵の心得 | 原初・戦術指揮 | level:120 job:mercenary_21 prof:10 hidden:{item:relic_origin} abyss:7 |
| mercenary_24 | 永劫の傭兵 | 隠し職 | 永劫の傭兵の心得 | 永劫・戦術指揮 | level:120 job:mercenary_18 prof:10 hidden:{item:relic_eternity} abyss:7 |
| avenger_0 | 復讐者 | 基本職 | 復讐者の心得 | 報復 | level:21 |
| avenger_1 | 炎刃の復讐者 | 応用職 | 炎刃の復讐者の心得 | 炎刃・報復 | level:15 job:avenger_0 prof:3 |
| avenger_2 | 氷霜の復讐者 | 応用職 | 氷霜の復讐者の心得 | 氷霜・報復 | level:15 job:avenger_0 prof:3 |
| avenger_3 | 迅雷の復讐者 | 応用職 | 迅雷の復讐者の心得 | 迅雷・報復 | level:15 job:avenger_0 prof:3 |
| avenger_4 | 疾風の復讐者 | 応用職 | 疾風の復讐者の心得 | 疾風・報復 | level:15 job:avenger_0 prof:3 |
| avenger_5 | 大地の復讐者 | 応用職 | 大地の復讐者の心得 | 大地・報復 | level:15 job:avenger_0 prof:3 |
| avenger_6 | 流水の復讐者 | 応用職 | 流水の復讐者の心得 | 流水・報復 | level:15 job:avenger_0 prof:3 |
| avenger_7 | 聖光の復讐者 | 上級職 | 聖光の復讐者の心得 | 聖光・報復 | level:35 job:avenger_6 prof:5 kills:300 |
| avenger_8 | 闇夜の復讐者 | 上級職 | 闇夜の復讐者の心得 | 闇夜・報復 | level:35 job:avenger_4 prof:5 kills:300 |
| avenger_9 | 鋼鉄の復讐者 | 上級職 | 鋼鉄の復讐者の心得 | 鋼鉄・報復 | level:35 job:avenger_5 prof:5 kills:300 |
| avenger_10 | 血盟の復讐者 | 上級職 | 血盟の復讐者の心得 | 血盟・報復 | level:35 job:avenger_1 prof:5 kills:300 |
| avenger_11 | 幻影の復讐者 | 上級職 | 幻影の復讐者の心得 | 幻影・報復 | level:35 job:avenger_2 prof:5 kills:300 |
| avenger_12 | 星詠の復讐者 | 上級職 | 星詠の復讐者の心得 | 星詠・報復 | level:35 job:avenger_3 prof:5 kills:300 |
| avenger_13 | 黄昏の復讐者 | 特殊職 | 黄昏の復讐者の心得 | 黄昏・報復 | level:55 job:avenger_7 prof:6 clear:{dungeon:d03,floor:30} |
| avenger_14 | 深淵の復讐者 | 特殊職 | 深淵の復讐者の心得 | 深淵・報復 | level:55 job:avenger_8 prof:6 clear:{dungeon:d04,floor:30} |
| avenger_15 | 竜血の復讐者 | 特殊職 | 竜血の復讐者の心得 | 竜血・報復 | level:55 job:avenger_10 prof:6 clear:{dungeon:d05,floor:30} |
| avenger_16 | 機巧の復讐者 | 特殊職 | 機巧の復讐者の心得 | 機巧・報復 | level:55 job:avenger_9 prof:6 clear:{dungeon:d06,floor:30} |
| avenger_17 | 霊樹の復讐者 | 特殊職 | 霊樹の復讐者の心得 | 霊樹・報復 | level:55 job:avenger_11 prof:6 clear:{dungeon:d07,floor:30} |
| avenger_18 | 時渡りの復讐者 | 希少職 | 時渡りの復讐者の心得 | 時渡り・報復 | level:85 job:avenger_12 prof:8 boss:{diff:HARD,count:14} clear:{dungeon:d08,floor:60} |
| avenger_19 | 重界の復讐者 | 希少職 | 重界の復讐者の心得 | 重界・報復 | level:85 job:avenger_14 prof:8 boss:{diff:HARD,count:14} clear:{dungeon:d09,floor:60} |
| avenger_20 | 虚無の復讐者 | 希少職 | 虚無の復讐者の心得 | 虚無・報復 | level:85 job:avenger_13 prof:8 boss:{diff:HARD,count:14} clear:{dungeon:d10,floor:60} |
| avenger_21 | 神託の復讐者 | 希少職 | 神託の復讐者の心得 | 神託・報復 | level:85 job:avenger_17 prof:8 boss:{diff:HARD,count:14} clear:{dungeon:d11,floor:60} |
| avenger_22 | 終焉の復讐者 | 隠し職 | 終焉の復讐者の心得 | 終焉・報復 | level:120 job:avenger_20 prof:10 hidden:{abyssFloor:19} abyss:8 |
| avenger_23 | 原初の復讐者 | 隠し職 | 原初の復讐者の心得 | 原初・報復 | level:120 job:avenger_21 prof:10 hidden:{abyssFloor:19} abyss:8 |
| avenger_24 | 永劫の復讐者 | 隠し職 | 永劫の復讐者の心得 | 永劫・報復 | level:120 job:avenger_18 prof:10 hidden:{abyssFloor:19} abyss:8 |
