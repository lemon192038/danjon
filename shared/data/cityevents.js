// PHASE 6: twenty city events. Data-driven like the Gravel events: host NPC(s) beside a city building, ordered steps,
// choices with world-shared effects, idempotent rewards, optional schedules (game-day cycles) and services.
// Step kinds: talk | night (20-05) | midnight (0:00-0:59, the "thirteenth chime") | fund {gold} | gather {ref, n} (materials)
// | kill {n, fam?} | arms {n} (defeat monsters with n different weapon types) | duel {fam, name, lv, hp} (monster duel)
// | npcduel {name, wt, lvAdd, hp, parry, aggression} (learning duel AI) | floor {dungeon?, floor} | visit {zones, label}
// | quiz {q, options, a} | spells {n} (lost spells learned) | rank (adventurer rank test) | choice {options}.
// Option world effects: supply {city, v} (all goods), flag 'k:v', state (world state of this event), news.
const T = text => ({ k: 'talk', text });
export const CITY_DUNGEONS = {
  undercity: { id: 'undercity', name: '王都の地下水路', theme: 'sewer', desc: '街の下に張り巡らされた古い水路網', minLv: 15, maxFloor: 20, hidden: true,
    bands: [{ name: '旧水路', layout: 'maze', pal: 'lake', fam: ['rat', 'slime', 'bat'], gim: ['water'], boss: 'kingSlime', bossName: '水路の主' },
      { name: '封鎖区画', layout: 'rooms', pal: 'ruin', fam: ['thug', 'lizard', 'zombie'], gim: ['traps', 'current'], boss: 'hydra', bossName: '水門の番竜' }] },
  kingtomb: { id: 'kingtomb', name: '地下に眠る王の墓所', theme: 'crypt', desc: '王都の礎の下に眠る古代王の墓所', minLv: 45, maxFloor: 30, hidden: true,
    bands: [{ name: '礎の回廊', layout: 'rooms', pal: 'ruin', fam: ['skeleton', 'zombie', 'bat'], gim: ['traps'], boss: 'knightLord', bossName: '墓所の近衛長' },
      { name: '眠りの聖堂', layout: 'maze', pal: 'grave', fam: ['shade', 'skeleton', 'knight'], gim: ['curseZone', 'darkness'], boss: 'lich', bossName: '王の書記官' },
      { name: '玉座の間', layout: 'arena', pal: 'temple', fam: ['knight', 'shade', 'construct'], gim: ['darkness'], boss: 'beneathKing', bossName: '古代王アルス・フンダトール' }] },
};
export const CITY_BOSSES = [['beneathKing', '古代王アルス・フンダトール', 'humanoid', ['charge', 'guard', 'spin', 'rally', 'summon']]];
export const ADV_RANKS = ['F', 'E', 'D', 'C', 'B', 'A', 'S'];
export const CITY_EVENTS = {
  ct_festival: { host: { name: '祭典委員長ベルタ', city: 'arcelia', near: 'w_arcelia_tavern' }, sched: { every: 7, on: 0, len: 2, label: '7日ごとに2日間' }, repeat: 'cycle', service: 'festival',
    reward: { gold: 3000, xp: 5000, title: '大祭典の常連' }, steps: [
      T('「ようこそ、王都の大祭典へ！ 屋台に競技、今日だけの品もあるよ。まずは腕試しの狩猟競技からどう？」'),
      { k: 'kill', n: 15, text: '狩猟競技：街の外で魔物を15体倒す' },
      { k: 'gather', ref: 'herb', n: 3, text: '屋台の料理番に薬草を3つ届ける' },
      { k: 'choice', text: '祭りの締めくくり。どの催しに花を添える？', options: [
        { id: 'parade', label: '騎士団の行進に寄付する', effect: '王都の人出が増え、市場が賑わった', world: { supply: { city: 'arcelia', v: 0.15 } }, reward: { title: '祭典の後援者' } },
        { id: 'stalls', label: '屋台通りの灯りに寄付する', effect: '屋台通りが夜まで賑わった', world: { supply: { city: 'arcelia', v: 0.1 } }, reward: { gold: 1500 } }] }] },
  ct_vanished_district: { host: { name: '地図職人ヨハン', city: 'vermion', near: 'w_vermion_realty' }, reward: { gold: 4000, xp: 9000, title: '消えた街を見つけた者' }, steps: [
    T('「この地図を見てくれ。三番街の先に“鈴蘭通り”があったはずなんだ。なのに誰も覚えていない」'),
    { k: 'visit', zones: ['in:w_vermion_tavern', 'in:w_vermion_bank', 'in:w_vermion_station'], label: '酒場・銀行・駅で住民の記憶と記録を調べる', text: '住民の記憶・建物記録・旅人の噂を集める（酒場・銀行・駅）' },
    { k: 'quiz', text: '集めた記録を照らし合わせる。', q: '鈴蘭通りが記録から消えた理由として、最も筋が通るのは？', options: ['大火で焼けた', '地図の版が差し替えられた', '住民が全員引っ越した'], a: 1 },
    T('古い版の地図と最新版を重ねると、通り一本分だけ“空白”が描き足されていた。誰かが通りを隠したのだ。'),
    { k: 'duel', fam: 'thug', name: '地図を書き換えた密売人', lv: 4, hp: 4, text: '隠し通りで密売を続けていた男と対峙する' },
    { k: 'choice', text: '鈴蘭通りをどうする？', options: [
      { id: 'restore', label: '地図に通りを戻す', effect: '鈴蘭通りが地図に戻り、小さな商店が再び店を開いた', world: { supply: { city: 'vermion', v: 0.1 }, flag: 'suzuran:restored' } },
      { id: 'secret', label: '秘密の抜け道として残す', effect: '通りは知る人ぞ知る抜け道になった', world: { flag: 'suzuran:secret' }, reward: { gold: 3000 } }] }] },
  ct_royal_auction: { host: { name: '競売人モンテクレール', city: 'arcelia', near: 'w_arcelia_bank' }, sched: { every: 7, on: 3, len: 1, label: '7日ごとに1日' }, repeat: 'cycle', service: 'auction',
    reward: { xp: 3000, title: '王立競売の顔' }, steps: [
      T('「王立オークションへようこそ。出品は希少装備・素材・遺物・情報。入場には保証金をお預かりします」'),
      { k: 'fund', gold: 2000, text: '保証金（2,000G）を預ける（入札資格）' },
      T('「資格は確認いたしました。本日の出品目録をどうぞ。競りは一度きり、お見逃しなく」')] },
  ct_troupe: { hosts: [{ city: 'arcelia', near: 'w_arcelia_inn' }, { city: 'vermion', near: 'w_vermion_inn' }, { city: 'marinelia', near: 'w_marinelia_inn' }, { city: 'luminas', near: 'w_luminas_inn' }, { city: 'elmgard', near: 'w_elmgard_inn' }], host: { name: '座長ピエリーノ' }, roam: true, repeat: 'cycle',
    reward: { gold: 2000, xp: 6000, title: '一座の友' }, steps: [
      T('「我らは月影座！ 今日の公演はもうすぐ。……実は、看板役者が舞台道具をなくしてしまってね」'),
      { k: 'gather', ref: 'wood', n: 2, text: '舞台装置の修理用に霊木材を2つ届ける' },
      T('公演は大成功。終演後、座長が声を潜める。「旅の途中で聞いた噂を一つ。世界の果てに“十三時を打つ時計”があるそうだ」'),
      { k: 'choice', text: '座長がお礼に一つ芸を教えてくれるという。', options: [
        { id: 'juggle', label: '投げ物の芸（器用さが鍛えられた）', effect: '一座の評判が広まった', reward: { gold: 1000 } },
        { id: 'story', label: '各地の噂話（隠し情報）', effect: '各地の噂が記録された', reward: { flag: 'troupeRumor' } }] }] },
  ct_haunted: { host: { name: '屋敷の管理人グレタ', city: 'celestia_holy', near: 'w_celestia_holy_library' }, reward: { gold: 3500, xp: 8000, title: '怪奇を解いた者' }, steps: [
    T('「旧伯爵邸で、夜になるとピアノが鳴るの。誰も住んでいないのに……」'),
    { k: 'night', text: '夜（20時〜5時）に屋敷の様子を聞き込む' },
    { k: 'kill', n: 6, fam: 'wisp', text: '屋敷のまわりを漂うウィスプを6体鎮める' },
    T('ピアノの上に、宛名のない手紙があった。“約束の曲を、もう一度だけ”。'),
    { k: 'duel', fam: 'shade', name: '屋敷に残る想い', lv: 3, hp: 4, text: '屋敷に残った想いと向き合う' },
    { k: 'choice', text: '想いは静かに消えかけている。', options: [
      { id: 'play', label: '約束の曲を弾いて送る', effect: '屋敷のピアノは静かになった', reward: { title: '最後の一曲を奏でた者' } },
      { id: 'keep', label: '屋敷を記念館として残す', effect: '旧伯爵邸は小さな記念館になった', world: { flag: 'mansion:museum' } }] }] },
  ct_promotion: { host: { name: '昇格試験官ラウル', city: 'haven', near: 'h_guild' }, repeat: 'rechallenge', rank: true, reward: { gold: 1000, xp: 3000 }, steps: [
    T('「冒険者ランクの昇格試験だ。戦闘・探索・採集・知識――全部できてこそ一人前だぞ」'),
    { k: 'rank', text: '試験の課題に取り組む（課題はランクで変わる）' }] },
  ct_duelist: { host: { name: '酒場の仕切り屋ブルーノ', city: 'drakford', near: 'w_drakford_tavern' }, repeat: 'rechallenge', service: 'duelists', reward: { xp: 4000 }, steps: [
    T('「この酒場には腕自慢が集まる。名を上げたきゃ、誰かの申し込みを受けてみな」（決闘者の性格・戦績・評判が見られる）')] },
  ct_lost_party: { host: { name: 'ギルド受付ノエル', city: 'elmgard', near: 'w_elmgard_guild' }, reward: { gold: 5000, xp: 12000, title: '捜索隊の灯' }, steps: [
    T('「“銀の矢”の四人が、深い迷宮へ潜ったきり十日戻らないんです」'),
    { k: 'floor', floor: 25, text: 'いずれかのダンジョンで25階まで足跡を追う' },
    T('25階の小部屋に、銀の矢の紋章と“奥で仲間が動けない”という走り書き。'),
    { k: 'duel', fam: 'golem', name: '通路を塞ぐ岩人形', lv: 5, hp: 5, text: '仲間の待つ部屋を塞ぐ岩人形を倒す' },
    { k: 'choice', text: '銀の矢の四人は無事だった。だが一人は足を痛めている。', options: [
      { id: 'carry', label: '背負って地上まで運ぶ', effect: '銀の矢は全員で街に戻った', reward: { title: '仲間を見捨てない者' } },
      { id: 'supply', label: '物資を渡して救助隊を呼ぶ', effect: '救助隊が組織され、ギルドの備えが厚くなった', world: { supply: { city: 'elmgard', v: 0.08 } }, reward: { gold: 2000 } }] }] },
  ct_hundred_arms: { host: { name: '武器商組合長ガラハド', city: 'drakford', near: 'w_drakford_weapon' }, sched: { every: 7, on: 5, len: 2, label: '7日ごとに2日間' }, repeat: 'cycle', service: 'arms', reward: { gold: 3000, xp: 8000, title: '百の武器を知る者' }, steps: [
    T('「百武器の祭典へようこそ！ 正式な86の武器種すべてを展示している。試し振りも製作もできるぞ」'),
    { k: 'arms', n: 5, text: '競技「五種の型」：5種類の武器種でそれぞれ魔物を倒す' },
    { k: 'gather', ref: 'ore', n: 3, text: '製作体験：強化鉱石を3つ持ち込む' }] },
  ct_succession: { host: { name: '宮廷書記官エルネスト', city: 'arcelia', near: 'ar_castle' }, reward: { gold: 4000, xp: 10000 }, steps: [
    T('「陛下のご容態が思わしくない。王太子派と王弟派、宮廷は真っ二つだ」（セレスティアの王位継承とは別の、アルセリア王家の話）'),
    { k: 'visit', zones: ['in:w_arcelia_bank', 'in:ar_g_merchants', 'in:w_arcelia_church'], label: '銀行・商人ギルド・教会で各派の後ろ盾を調べる', text: '各派の支持者を調べる（銀行・商人ギルド・教会）' },
    T('王弟派の資金は商人ギルドから、王太子派の支持は教会と民衆から。どちらも王国を思う気持ちは本物らしい。'),
    { k: 'choice', text: 'あなたの集めた情報は、どちらに届ける？', options: [
      { id: 'prince', label: '王太子派に届ける（民衆の支持）', effect: '王太子が後継に指名された。民の祭りが増える', world: { flag: 'arcelia:prince', supply: { city: 'arcelia', v: 0.05 } }, reward: { title: '王太子の盟友' } },
      { id: 'duke', label: '王弟派に届ける（商人の支持）', effect: '王弟が摂政に就いた。交易が活発になる', world: { flag: 'arcelia:duke', supply: { city: 'vermion', v: 0.1 } }, reward: { title: '摂政の協力者' } },
      { id: 'both', label: '両派に同じ情報を届ける（対話を促す）', effect: '両派は和解し、共同統治が始まった', world: { flag: 'arcelia:council' }, reward: { title: '和解を促した者', gold: 2000 } }] }] },
  ct_merchants_war: { host: { name: '交易商ギルド代表ソフィア', city: 'vermion', near: 've_g_traders' }, reward: { gold: 6000, xp: 9000 }, steps: [
    T('「競売ギルドが価格を吊り上げて、街道の荷を独占しようとしているの。このままじゃ小さな店が潰れる」'),
    { k: 'gather', ref: 'hide', n: 3, text: '独占されていない仕入れ先から魔獣の皮を3つ集める' },
    { k: 'kill', n: 10, text: '街道で荷馬車を狙う魔物を10体倒す' },
    { k: 'fund', gold: 5000, text: '小売店の共同仕入れに出資する（5,000G）' },
    { k: 'choice', text: '交渉の席。どう決着をつける？', options: [
      { id: 'fair', label: '公正価格の協定を結ばせる', effect: 'ヴェルミオンの物価が落ち着いた', world: { supply: { city: 'vermion', v: 0.2 } }, reward: { title: '公正な市場の守り手' } },
      { id: 'win', label: '交易商ギルドの勝利で決着させる', effect: '交易商ギルドが街道を押さえ、交易路が広がった', world: { supply: { city: 'marinelia', v: 0.15 } }, reward: { gold: 6000 } }] }] },
  ct_great_fire: { host: { name: '王都消防団長ハインツ', city: 'arcelia', near: 'w_arcelia_inn' }, world: true, repeat: 'cycle', reward: { gold: 3000, xp: 10000, title: '炎の中の英雄' }, steps: [
    T('「火事だ！ 職人街から火の手が上がった。避難誘導と救助を手伝ってくれ！」'),
    { k: 'visit', zones: ['in:w_arcelia_smith', 'in:w_arcelia_weapon', 'in:w_arcelia_armor'], label: '燃える鍛冶屋・武器屋・防具屋に入って人々を避難させる', text: '取り残された人を避難させる（鍛冶屋・武器屋・防具屋）' },
    { k: 'gather', ref: 'herb', n: 3, text: '負傷者の手当てに薬草を3つ届ける' },
    { k: 'fund', gold: 3000, text: '復興資金を寄付する（3,000G）' },
    { k: 'choice', text: '火は消えた。復興をどう進める？', options: [
      { id: 'stone', label: '石造りの防火街区に建て替える', effect: '王都は燃えにくい街に生まれ変わった', world: { state: 'resolved', supply: { city: 'arcelia', v: 0.1 } } },
      { id: 'quick', label: '急いで元通りに建て直す', effect: '職人街はすぐに再開したが、火の備えは今まで通りだ', world: { state: 'resolved', supply: { city: 'arcelia', v: 0.2 } }, reward: { gold: 2000 } }] }] },
  ct_delegation: { host: { name: '使節団の通訳ミーナ', city: 'marinelia', near: 'w_marinelia_trade' }, sched: { every: 7, on: 1, len: 2, label: '7日ごとに2日間' }, repeat: 'cycle', reward: { gold: 4000, xp: 6000, title: '海を越えた友' }, steps: [
    T('「遠い大陸から交易使節団が到着しました。友好のしるしに、こちらの特産品を贈りたいのです」'),
    { k: 'gather', ref: 'gem', n: 2, text: '贈答品として原石を2つ用意する' },
    { k: 'quiz', text: '使節団との会食。', q: '他大陸の客人を迎える場で、最もふさわしいのは？', options: ['こちらの作法だけを押し通す', '互いの作法を尋ね、合わせる', '会話を避けて食事に集中する'], a: 1 },
    { k: 'choice', text: '使節団は交易協定を提案してきた。', options: [
      { id: 'trade', label: '交易協定を結ぶ', effect: '港に他大陸の品が並ぶようになった', world: { supply: { city: 'marinelia', v: 0.2 } } },
      { id: 'culture', label: '文化交流を優先する', effect: '学者と芸術家の行き来が始まった', world: { supply: { city: 'luminas', v: 0.1 } }, reward: { gold: 2000 } }] }] },
  ct_undercity: { host: { name: '水路番の老人オットー', city: 'arcelia', near: 'w_arcelia_clinic' }, gate: 'undercity', reward: { gold: 4000, xp: 10000, title: '地下水路の踏破者' }, steps: [
    T('「街の下には昔の水路が迷路みたいに残っとる。最近、奥の水門の向こうで灯りを見たんじゃ」'),
    { k: 'floor', dungeon: 'undercity', floor: 10, text: '地下水路（ここから入れる）を10階まで調べる' },
    T('旧水路の壁に、新しい扉。中には誰かが使っていた倉庫と、さらに奥への階段があった。'),
    { k: 'floor', dungeon: 'undercity', floor: 20, text: '封鎖区画の最奥（20階）の水門の番竜を倒す' },
    { k: 'choice', text: '隠された倉庫と通路をどうする？', options: [
      { id: 'report', label: '衛兵に報告する', effect: '密輸路が摘発された', world: { flag: 'undercity:closed' } },
      { id: 'map', label: '地図に記して冒険者に開放する', effect: '地下水路は冒険者の近道になった', world: { flag: 'undercity:open' }, reward: { gold: 3000 } }] }] },
  ct_thirteenth: { host: { name: '時計塔守ルカ', city: 'luminas', near: 'w_luminas_library' }, reward: { gold: 3000, xp: 9000, title: '十三時を聞いた者' }, steps: [
    T('「この時計塔は真夜中に十三回鳴ることがある。でも、十三時なんて時刻は存在しないはずだろう？」'),
    { k: 'midnight', text: '真夜中（0時台）に時計塔の鐘を聞く' },
    T('十三番目の鐘が鳴った瞬間、街の音が消えた。時計の針は「XIII」を指している。文字盤に、存在しない数字が浮かんでいた。'),
    { k: 'gather', ref: 'crystal', n: 2, text: '歪んだ時間を測るため魔晶片を2つ用意する' },
    { k: 'duel', fam: 'construct', name: '止まった時間の番人', lv: 6, hp: 5, text: '十三時の間にだけ現れる番人と対峙する' },
    { k: 'choice', text: '針を戻すか、十三時を残すか。', options: [
      { id: 'fix', label: '時計を正しく直す', effect: '時計塔は普通の時を刻むようになった', world: { flag: 'clock:fixed' } },
      { id: 'keep', label: '十三時をそのままにしておく', effect: 'ルミナスでは今も時々、十三回の鐘が鳴る', world: { flag: 'clock:thirteen' }, reward: { flag: 'thirteenth' } }] }] },
  ct_portrait: { host: { name: '画廊主ヴィオラ', city: 'celestia_holy', near: 'w_celestia_holy_church' }, reward: { gold: 3000, xp: 8000, title: '名を取り戻させた者' }, steps: [
    T('「この肖像画、題も署名もないの。でも見る人はみんな“どこかで会った気がする”って言うのよ」'),
    { k: 'visit', zones: ['in:w_celestia_holy_library', 'in:w_luminas_library'], label: '聖都とルミナスの図書館で記録を探す', text: '図書館で古い記録を探す（聖都・ルミナス）' },
    { k: 'quiz', text: '記録の断片をつなげる。', q: '肖像画の人物が「記録から消された」理由として、記録が示しているのは？', options: ['罪を犯したから', '世界の外側について書き残したから', 'ただの画家の想像だったから'], a: 1 },
    { k: 'choice', text: '肖像画の人物は、禁書庫に名を残す「記録されない存在」と同じ人物らしい。', options: [
      { id: 'name', label: '肖像画に名前をつけて展示する', effect: '肖像画は「旅人」と名付けられた', reward: { title: '名付け親' } },
      { id: 'hide', label: '画廊の奥にしまう', effect: '肖像画は静かに眠りについた', reward: { flag: 'portraitKept' } }] }] },
  ct_midnight_shop: { host: { name: '夜鳴き商人ノクス', city: 'marinelia', near: 'w_marinelia_tavern' }, nightOnly: true, repeat: 'rechallenge', service: 'midnight', reward: { xp: 2000 }, steps: [
    T('「いらっしゃい。ここは夜の間だけ開く店さ。昼に来ても、扉はただの壁だよ」')] },
  ct_academy: { host: { name: '学院研究主任セレーネ', city: 'luminas', near: 'lu_g_magicresearch' }, sched: { every: 7, on: 4, len: 2, label: '7日ごとに2日間' }, repeat: 'cycle', reward: { gold: 2000, xp: 8000, title: '公開研究会の発表者' }, steps: [
    T('「王立魔法学院の公開研究会へようこそ。今年の主題は“失われた魔法の再構築”です」'),
    { k: 'quiz', text: '研究発表を聞く。', q: '魔法を改良するとき、学院が推奨する考え方は？', options: ['全ての性能を同時に最大まで上げる', '目的に合わせて配分し、何かを諦める', '改良はしない'], a: 1 },
    { k: 'spells', n: 1, text: '失われた魔法を1つ習得して研究者と語り合う' },
    { k: 'choice', text: '研究者たちが共同研究に誘ってくれた。', options: [
      { id: 'theory', label: '理論研究に参加する', effect: '学院の研究が進んだ', reward: { spellFrags: 3 } },
      { id: 'field', label: '実地研究に参加する', effect: '学院の調査隊が組まれた', reward: { gold: 3000 } }] }] },
  ct_stranger: { hosts: [{ city: 'arcelia', near: 'w_arcelia_station' }, { city: 'vermion', near: 'w_vermion_station' }, { city: 'luminas', near: 'w_luminas_station' }, { city: 'marinelia', near: 'w_marinelia_station' }, { city: 'drakford', near: 'w_drakford_station' }], host: { name: '見慣れない服の旅人' }, roam: true, reward: { gold: 2000, xp: 9000, title: '異邦人と語らった者' }, steps: [
    T('「……ここは、どこですか？ 地図が読めない。文字は読めるのに、地名が一つもわからない」'),
    { k: 'quiz', text: '旅人に、この世界のことを教える。', q: '旅人に最初に教えるべきことは？', options: ['この街の名前と、宿の場所', '魔物の倒し方', '王位継承の噂'], a: 0 },
    T('旅人は、こちらの言葉を手帳に書き写しながら言った。「私の世界では、空の上から誰かがこちらを“操作”しているという話があるんです」'),
    { k: 'choice', text: '旅人は帰り方を探している。', options: [
      { id: 'guide', label: '大図書館の禁書庫の噂を教える', effect: '旅人は王都へ向かった', reward: { title: '境界の案内人' } },
      { id: 'stay', label: 'この世界で暮らすことを勧める', effect: '旅人は宿で働き始めた', reward: { gold: 2000 } }] }] },
  ct_king_beneath: { host: { name: '王立考古学者アデル', city: 'arcelia', near: 'ar_biglib' }, gate: 'kingtomb', reward: { gold: 8000, xp: 20000, title: '地下の王に謁見した者' }, steps: [
    T('「王都の礎の下に、王国以前の王の墓所がある――伝説だと思っていたけれど、地下水路の奥に封印の扉が見つかったの」'),
    { k: 'gather', ref: 'relic', n: 2, text: '封印を解く鍵として遺物の欠片を2つ持ってくる' },
    { k: 'floor', dungeon: 'kingtomb', floor: 20, text: '墓所（ここから入れる）を20階まで進む' },
    { k: 'floor', dungeon: 'kingtomb', floor: 30, text: '玉座の間（30階）で古代王と相対する' },
    { k: 'choice', text: '古代王は言った。「余はこの都の礎。眠りを乱した者よ、何を望む」', options: [
      { id: 'rest', label: '再び安らかに眠ってもらう', effect: '王は眠りにつき、王都の地盤が安定した', world: { flag: 'king:rest', supply: { city: 'arcelia', v: 0.05 } }, reward: { title: '王の眠りを守る者' } },
      { id: 'guard', label: '都の守護者として目覚めてもらう', effect: '古代王は王都を見守る守護霊となった', world: { flag: 'king:guardian' }, reward: { title: '古き王の盟友' } },
      { id: 'record', label: '王の記憶を記録に残す', effect: '王国以前の歴史が記録された', world: { flag: 'king:recorded' }, reward: { gold: 5000 } }] }] },
};
// adventurer rank tests (ct_promotion): one test per rank up
export const RANK_TESTS = [
  { kill: 10, gather: { ref: 'herb', n: 2 }, floor: 5, q: { q: '毒霧のある階層で最初にすべきことは？', options: ['走り抜ける', '霧の範囲と出口を確認する', '戦い続ける'], a: 1 } },
  { kill: 20, gather: { ref: 'hide', n: 3 }, floor: 15, q: { q: '盾持ちの敵に有効なのは？', options: ['正面から連打', '背後や側面に回る', '逃げる'], a: 1 } },
  { kill: 30, gather: { ref: 'gem', n: 3 }, floor: 25, q: { q: 'ボスの大技の前触れが見えたら？', options: ['攻撃を続ける', '回避や防御の準備をする', '回復薬を飲む'], a: 1 } },
  { kill: 40, gather: { ref: 'crystal', n: 3 }, floor: 40, q: { q: '属性相性で、火に強いのは一般に？', options: ['水', '風', '雷'], a: 0 } },
  { kill: 60, gather: { ref: 'relic', n: 2 }, floor: 60, q: { q: 'パーティーで回復役が倒れたとき最優先は？', options: ['ボスを急いで倒す', '安全を確保して立て直す', '一人で突撃する'], a: 1 } },
  { kill: 80, gather: { ref: 'abyssShard', n: 1 }, floor: 80, q: { q: 'Sランク冒険者に求められるものは？', options: ['強さだけ', '仲間と街を守る判断力', '名声'], a: 1 } }];
// duelists of the Drakford tavern (personality, record and reputation shape the duel AI)
export const DUELISTS = [
  { id: 'kai', name: '若き剣士カイ', wt: 1, lvAdd: -2, pers: '血気盛ん', aggression: 0.85, parry: 0.15, hp: 2.5, rep: 20 },
  { id: 'mira', name: '槍使いミラ', wt: 14, lvAdd: 0, pers: '冷静', aggression: 0.55, parry: 0.35, hp: 2.8, rep: 45 },
  { id: 'gord', name: '斧のゴルド', wt: 25, lvAdd: 2, pers: '豪快', aggression: 0.9, parry: 0.1, hp: 3.4, rep: 55 },
  { id: 'sei', name: '弓兵セイ', wt: 44, lvAdd: 1, pers: '慎重', aggression: 0.45, parry: 0.3, hp: 2.6, rep: 50 },
  { id: 'rena', name: '双剣のレナ', wt: 4, lvAdd: 4, pers: '挑発的', aggression: 0.8, parry: 0.3, hp: 3, rep: 70 },
  { id: 'old', name: '老拳士ドウ', wt: 37, lvAdd: 6, pers: '泰然', aggression: 0.5, parry: 0.55, hp: 3.4, rep: 85 }];
