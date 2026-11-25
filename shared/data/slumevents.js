// Gravel story events (PHASE 3b). Each event = host NPC (placed beside a Gravel building) + ordered steps.
// Step kinds: talk | night (talk only 20:00-05:00) | kill {fam|faction, n} | raid {n: containers searched in the Gravel
// underground, then extract} | deliver {ref (slum loot), n} | fund {gold} | duel {fam, name, lv, hp} | choice {options}.
// Choice options carry world effects (shared by everyone) and personal rewards. Texts avoid graphic content.
export const SLUM_EVENTS = {
  sl_children: { host: { name: '見張りのピピ', near: 'gr_nameless' }, reward: { gold: 3000, xp: 6000, title: '子供たちの味方', orgRep: { nameless: 25 } }, steps: [
    { k: 'talk', text: '「ねえ、仲間が三人いなくなったんだ。夜に“白い服の大人”が来て、お菓子をくれるって……それっきり」' },
    { k: 'raid', n: 3, text: 'グレイヴェル地下街で手がかりを探す（物資を3つ調べて脱出）' },
    { k: 'talk', text: '回収した帳面には「魔力適性検査」「収容」の文字。地下街の奥に、許可のない研究施設があるらしい。' },
    { k: 'kill', faction: 'redsnake', n: 5, text: '施設の見張りを務める赤蛇組の構成員を5人退ける（地下街）' },
    { k: 'duel', fam: 'mage', name: '白衣の監督官ゼーレ', lv: 6, hp: 6, text: '施設の監督官と対峙する' },
    { k: 'choice', text: '子供たちを助け出した。施設の記録をどうする？', options: [
      { id: 'expose', label: '記録を王都の衛兵に届ける', effect: '施設は摘発され、赤蛇組が力を落とした', world: { orgInf: { redsnake: -8, nameless: 4 } }, reward: { orgRep: { redsnake: -20 } } },
      { id: 'nameless', label: '記録を無名の子供たちに預ける', effect: '子供たちは記録を盾に身を守る術を得た', world: { orgInf: { nameless: 8 } }, reward: { orgRep: { nameless: 15 } } }] },
  ] },
  sl_facility: { host: { name: '廃坑夫トビアス', near: 'gr_under' }, reward: { gold: 2500, xp: 8000, title: '神機の遺構を見た者', flag: 'machinist' }, steps: [
    { k: 'talk', text: '「地下街のさらに下で、鉄でも石でもない壁を見た。叩くと、中で何かが“数を数える”音がするんだ」' },
    { k: 'raid', n: 5, text: '地下街の深部を調べる（物資を5つ調べて脱出）' },
    { k: 'deliver', ref: 'core', n: 1, text: '施設の扉を動かす「魔導機関の核」を手に入れて渡す' },
    { k: 'talk', text: '扉の向こうには、星図のように光る演算装置。古代神機文明の研究記録が眠っていた。' },
    { k: 'duel', fam: 'construct', name: '施設の守護機兵', lv: 8, hp: 8, text: '目を覚ました守護機兵を止める' },
    { k: 'talk', text: '演算装置が一行だけ記録を吐き出した。「第一世代の神機使いへ。工房への道は、図書館の奥にある」' },
  ] },
  sl_plague: { host: { name: '診療所の医師ミラ', near: 'w_gravel_clinic' }, world: 'plague', reward: { gold: 2000, xp: 5000, title: '灰の街の治療者' }, steps: [
    { k: 'talk', text: '「咳と青い斑点……ただの風邪じゃない。地下水に何か混じってる」' },
    { k: 'deliver', ref: 'herbbag', n: 3, text: '治療用に薬草の包みを3つ届ける' },
    { k: 'raid', n: 3, text: '地下水路で汚染の元を探す（物資を3つ調べて脱出）' },
    { k: 'kill', faction: 'scavs', n: 4, text: '水路に巣くう屑拾いを4人追い払う（地下街）' },
    { k: 'fund', gold: 3000, text: '浄化薬の材料費を出す' },
    { k: 'choice', text: '菌の正体は魔力を吸う胞子だった。浄化の方法は？', options: [
      { id: 'purify', label: '水路ごと浄化する（時間はかかるが確実）', effect: '疫病は終息に向かい、市場の薬の値も落ち着いた', world: { resolve: 'plague', market: { consumable: -0.6 } } },
      { id: 'seal', label: '汚染区画を封鎖する（早いが住民が追われる）', effect: '疫病は止まったが、封鎖で住処を失った者が出た', world: { resolve: 'plague', orgInf: { nameless: -3 } }, reward: { gold: 1500 } }] },
  ] },
  sl_false_hero: { host: { name: 'アルベルト・ヴァイス', near: 'gr_market' }, reward: { gold: 2000, xp: 7000 }, steps: [
    { k: 'talk', text: '「やあ、旅の人。僕はこの街を良くしたいだけなんだ。手を貸してくれないか？」（住民からの評判はすこぶる良い）' },
    { k: 'deliver', ref: 'canned', n: 3, text: '炊き出し用の保存食を3つ届ける' },
    { k: 'raid', n: 2, text: 'アルベルトの依頼で地下街の“荷物”を回収する（物資を2つ調べて脱出）' },
    { k: 'talk', text: '回収した荷物の中に、組織の首領たちを陥れる偽の証文が入っていた。アルベルトは街を乗っ取るつもりだ。' },
    { k: 'choice', text: 'アルベルトの正体を知った。どうする？', options: [
      { id: 'expose', label: '正体を暴く（証文を住民に見せる）', effect: 'アルベルトは街を追われた', world: { flag: 'albert:exposed', orgInf: { crow: 3, ironclaw: 3 } }, reward: { title: '偽りを見抜いた者' } },
      { id: 'ally', label: '協力する（彼の改革に乗る）', effect: 'アルベルトが「市民代表」を名乗り、組織の縄張りが揺らいだ', world: { flag: 'albert:ruler', orgInf: { crow: -5, ironclaw: -5, redsnake: -5 } }, reward: { gold: 6000 } },
      { id: 'oppose', label: '対立する（組織側に通報する）', effect: '組織がアルベルト一派を締め出した', world: { flag: 'albert:opposed', orgInf: { ironclaw: 5 } }, reward: { orgRep: { ironclaw: 10, crow: 10 } } },
      { id: 'duel', label: '決闘で決着をつける', effect: '決闘に敗れたアルベルトは街を去った', duel: { fam: 'knight', name: '偽りの英雄アルベルト', lv: 6, hp: 6 }, world: { flag: 'albert:defeated' }, reward: { title: '偽りの英雄を討った者' } }] },
  ] },
  sl_auction: { host: { name: '黒鴉の案内人', near: 'gr_crow' }, reward: { xp: 3000 }, steps: [
    { k: 'night', text: '「…招待状がなければ通せない。ただし“紹介料”を払えば別だ」（闇の競売会は夜にだけ開かれる）' },
    { k: 'fund', gold: 2000, text: '紹介料を払って招待状を手に入れる' },
    { k: 'talk', text: '招待状を手に入れた。以後、夜の黒鴉商会本部で闇の競売会に参加できる。', unlock: 'auction' },
  ] },
  sl_colosseum: { host: { name: '闘技場の呼び込み', near: 'gr_colosseum' }, reward: { gold: 4000, xp: 6000, title: '地下闘技場の新星' }, steps: [
    { k: 'talk', text: '「素性は問わねえ。ここじゃ勝った奴が正義だ。登録するかい？」' },
    { k: 'wins', n: 3, text: '無名の地下闘技場で3回勝ち抜く（夜18時〜朝6時）' },
    { k: 'talk', text: '「やるじゃねえか。ランキング表に名前を載せといてやる。20勝すれば“無名の覇者”だ」', unlock: 'colosseumRank' },
  ] },
  sl_carriers: { host: { name: '夜番の老婆', near: 'gr_ashbell' }, reward: { gold: 2500, xp: 6000, title: '死者の行方を知る者' }, steps: [
    { k: 'night', text: '「夜になると、布をかけた荷車が灰鐘の坂を下りていく。あれは死者さ。どこへ運ばれるのか、誰も知らない」' },
    { k: 'kill', faction: 'ashbell', n: 4, text: '地下街で荷車を護衛する灰鐘教団の信者を4人退ける' },
    { k: 'raid', n: 3, text: '荷車の行き先を地下街で探る（物資を3つ調べて脱出）' },
    { k: 'talk', text: '運び込まれた先には、記憶を写し取る奇妙な装置と、焼け焦げた写本の断片。「魂の再構築」という題が読めた。' },
    { k: 'choice', text: '装置をどうする？', options: [
      { id: 'destroy', label: '装置を壊す', effect: '灰鐘教団の儀式は滞り、教団の勢いが衰えた', world: { orgInf: { ashbell: -8 } }, reward: { orgRep: { ashbell: -25 } } },
      { id: 'keep', label: '写本の断片を持ち帰る', effect: '断片は禁書庫への手がかりになりそうだ', world: {}, reward: { flag: 'soulFragment' } }] },
  ] },
  sl_capital_shadow: { host: { name: '貴族の使いレイモンド', near: 'w_gravel_station' }, reward: { gold: 3000, xp: 8000 }, steps: [
    { k: 'talk', text: '「王都の貴族院は、この街の“整理”を考えています。住民の名簿を集めていただければ報酬を」' },
    { k: 'deliver', ref: 'ledger', n: 1, text: '貴族とスラムの取引を記した裏帳簿を手に入れる' },
    { k: 'talk', text: '帳簿には、貴族が組織に金を流してスラムを“管理”させてきた記録があった。' },
    { k: 'choice', text: 'この帳簿をどう使う？', options: [
      { id: 'autonomy', label: '住民に公開し、自治を求める', effect: 'グレイヴェルは自治会を作り、王都の干渉が弱まった', world: { flag: 'gravel:autonomy', orgInf: { nameless: 4, crow: -4 } }, reward: { title: 'グレイヴェル自治の立役者' } },
      { id: 'nobles', label: '貴族に渡して取り入る', effect: '王都の管理が強まり、組織は表向き大人しくなった', world: { flag: 'gravel:controlled', orgInf: { ironclaw: -4, redsnake: -4 } }, reward: { gold: 9000 } },
      { id: 'sell', label: '黒鴉商会に売りつける', effect: '黒鴉商会が貴族を脅し、裏の権力を握った', world: { flag: 'gravel:crow', orgInf: { crow: 8 } }, reward: { gold: 6000, orgRep: { crow: 20 } } }] },
  ] },
  sl_blackforge: { host: { name: 'グラド・ベルン', near: 'gr_blackforge' }, reward: { xp: 9000, title: '黒炉の門弟', flag: 'blackforgeSmith', orgRep: { blackforge: 30 } }, steps: [
    { k: 'talk', text: '「王国の鍛冶規制なんざ糞喰らえだ。本物の刃が見たけりゃ、素材を持ってこい」' },
    { k: 'deliver', ref: 'parts', n: 2, text: '非合法武器部品を2つ届ける' },
    { k: 'deliver', ref: 'starsteel', n: 1, text: '高純度星鉄を1つ届ける' },
    { k: 'duel', fam: 'golem', name: '試し斬りの鉄人形', lv: 5, hp: 5, text: 'グラドの鉄人形で腕を示す' },
    { k: 'talk', text: '「…合格だ。黒炉の改造をしてやる。武器に新しい特性を一つ刻み込める（特性は3つまで）」', unlock: 'blackforgeMod' },
  ] },
  sl_last_resident: { host: { name: '最後の住人エドガー', near: 'gr_edgar' }, reward: { xp: 7000, title: '記録の継承者', flag: 'edgarClue' }, steps: [
    { k: 'talk', text: '「この街の地下には、王都より古い街がある。わしはそこで生まれ、そこを最後に出た住人じゃ」' },
    { k: 'deliver', ref: 'map', n: 1, text: '旧市街の古地図を持ってくる' },
    { k: 'talk', text: '「この地図の端……ここに“記録されない街”と書かれておる。わしの故郷は、記録から消されたのじゃ」' },
    { k: 'deliver', ref: 'tablet', n: 1, text: '封印の石板を持ってくる' },
    { k: 'talk', text: '「石板の文字は、大図書館の地下——禁書庫の書式と同じじゃ。“観測者”という言葉が何度も出てくる。気をつけなされ、世界の外側を覗く者は、覗き返される」' },
  ] },
};
