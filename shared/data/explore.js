// NEW WORLD EVENTS — PHASE D: exploration events (13-18). Field objects are observed under real conditions (time of day,
// weather, world state); puzzles give hints and never require brute force; small hidden dungeons, a library outside the
// map, and a phantom train whose cars, passengers and stops are recorded.
export const EXPLORE_OBJECTS = [
  { field: 'ashland', k: 'deepmarker', key: 'ash', label: '◇ 坑道の古い標石' }, { field: 'undersand', k: 'deepmarker', key: 'sand', label: '◇ 坑道の古い標石' }, { field: 'magma_crevasse', k: 'deepmarker', key: 'magma', label: '◇ 坑道の古い標石' },
  { field: 'field_capital', k: 'ghoststation', key: 'station', label: '◇ 草に埋もれた駅' },
  { field: 'yggdrasil_grove', k: 'deadtree', key: 'tree', label: '◆ 枯れない巨木' }, { field: 'yggdrasil_grove', k: 'withersample', key: 'soil', label: '◇ 黒ずんだ土' }, { field: 'yggdrasil_grove', k: 'withersample', key: 'water', label: '◇ 澱んだ湧き水' }, { field: 'yggdrasil_grove', k: 'withersample', key: 'plant', label: '◇ 季節外れの花' },
  { field: 'field_greatwood', k: 'statue17', key: 'a', label: '◇ 苔むした石像' }, { field: 'dustvale', k: 'statue17', key: 'b', label: '◇ 砂に半ば埋もれた石像' }, { field: 'crystal_reef', k: 'statue17', key: 'c', label: '◇ 珊瑚に覆われた石像' }, { field: 'tempest_ridge', k: 'hiddenruin', key: 'ruin', label: '◇ 割れた岩' },
  { field: 'crystalwood', k: 'moonlake', key: 'lake', label: '◆ 月の映らない湖' }, { field: 'crystalwood', k: 'lantern', key: 'north', label: '◇ 北の古灯籠' }, { field: 'crystalwood', k: 'lantern', key: 'east', label: '◇ 東の古灯籠' }, { field: 'crystalwood', k: 'lantern', key: 'west', label: '◇ 西の古灯籠' },
];
// statues: each one turns only under its condition; the record names the direction it then faces
export const STATUES = {
  a: { cond: 'night', hint: '夜になると向きが変わるらしい', rec: '夜、石像は東を向いた――「雷の鳴る大陸」の方角だ' },
  b: { cond: 'dusk', hint: '夕暮れどきに影が動くと聞く', rec: '夕暮れ、石像は北東を向いた――「峰が嵐に削られた山脈」の方角だ' },
  c: { cond: 'dawn', hint: '夜明け前に何かが起きるらしい', rec: '夜明け前、石像は北を向いた――「雷雲のかかる尾根」の方角だ' } };
// the lake: three observations under different skies reveal the lantern order (north → west → east)
export const LAKE = { conds: { clearnight: '晴れた夜', mistnight: '霧か曇りの夜', predawn: '夜明け前（4時台）' }, order: ['north', 'west', 'east'],
  rec: { clearnight: '晴れた夜、水面に「北の灯」が一つだけ映った', mistnight: '霧の夜、水面の「西の灯」がゆらめいた――北の次に', predawn: '夜明け前、水面の奥で「東の灯」が最後に灯った' } };
export const TRAIN = { hours: [0, 3], cars: [
  { id: 'coach', name: '一般客車', text: '居眠りをする乗客たち。窓の外は見たことのない星空だ。迷子の少女ミオが「エルムガルドに帰りたいの」とつぶやいた。', act: '話を聞く', give: 'mio' },
  { id: 'dining', name: '食堂車', text: '名もなき楽士が、聞き覚えのある旋律を弾いている。給仕が「この列車ではお代はいりません」と笑う。', act: '席に着く' },
  { id: 'cargo', name: '荷物車', text: '宛先のない荷物が積まれている。一つだけ、あなた宛ての古い切符があった。', act: '調べる', item: 'oldTicket' },
  { id: 'conductor', name: '車掌室', text: '顔の見えない車掌が言う。「停車駅は毎回変わります。お客様が“覚えている場所”に止まるのです」', act: '尋ねる' },
  { id: 'special', name: '特殊な客室', text: '扉には名札がない。中の乗客は、どの記録にも残っていないと言った。「あなたには、私が見えるんですね」', act: '扉を叩く' },
  { id: 'last', name: '最後尾の車両', text: '後ろの線路が、通り過ぎたそばから消えていく。この列車は、過去へは戻らない。', act: '見つめる', need: 5 }],
  stops: [{ id: 'nowhere', name: 'どこでもない駅', text: 'ホームの名札は白紙だった。ベンチに、誰かが置いていった星図がある。', reward: { item: 'starChart' } },
    { id: 'mirror', name: '逆さの湖畔駅', text: '駅の前の湖に、北・西・東の順に灯がともって見えた。どこかの湖と同じ形だ。', reward: { flag: 'lakeHint' } },
    { id: 'ash', name: '灰の終着駅', text: '灰に埋もれた終着駅。古い荷札に包まれた遺物が残されていた。', reward: { mat: 'relic', n: 3 } }] };
const band = (name, layout, pal, fam, gim, boss, bossName) => ({ name, layout, pal, fam, gim, boss, bossName });
export const EXPLORE_DUNGEONS = {
  witherroot: { id: 'witherroot', name: '枯れ木の根の間', theme: 'forest', desc: '枯れない巨木の内部', minLv: 45, maxFloor: 10, hidden: true, bands: [band('根の間', 'cave', 'fungus', ['treant', 'spider', 'wisp'], ['poisonFog', 'roots'], 'hydra', '吸い上げる根の主')] },
  statue_ruin: { id: 'statue_ruin', name: '視線の交わる遺跡', theme: 'ruin', desc: '石像たちが見つめていた隠し遺跡', minLv: 50, maxFloor: 10, hidden: true, bands: [band('交点の遺跡', 'rooms', 'ruin', ['construct', 'golem', 'knight'], ['traps'], 'golemKing', '石像の主')] },
  mirror_lake: { id: 'mirror_lake', name: '湖の向こう側', theme: 'void', desc: '月の映らない湖の水面の奥', minLv: 55, maxFloor: 10, hidden: true, bands: [band('逆さの湖底', 'islands', 'void', ['wisp', 'shade', 'elemIce'], ['darkness', 'water'], 'voidEye', '水面に映る月の眼')] },
};
// the library outside the map: books whose text depends on the reader and the world (built server-side)
export const MAPLESS_BOOKS = [{ id: 'steps', title: '『あなたの足跡』' }, { id: 'now', title: '『世界の現在』' }, { id: 'unknown', title: '『未踏の地』' }, { id: 'nextpage', title: '『次の頁』' },
  { id: 'lostcity', title: '『忘れられた街』', need: { event: 'nx10' } }, { id: 'people', title: '『記録されない人々』', need: { book: 'unrecorded' } }, { id: 'librarian', title: '『司書の手記』', need: { all: true } }];
export const UNDER_TRADE = [{ give: 'ore', n: 3, get: 'crystal', m: 2 }, { give: 'herb', n: 4, get: 'gem', m: 1 }, { give: 'wood', n: 3, get: 'relic', m: 1 }, { give: 'gem', n: 2, get: 'abyssShard', m: 1 }];
const T = text => ({ k: 'talk', text });
export const EXPLORE_EVENTS = {
  nx13: { host: { name: '書誌学者ヴェルナ', city: 'arcelia', near: 'w_arcelia_library' }, service: 'mapless', reward: { xp: 20000, title: '地図にない場所を見つけた者' }, steps: [
    T('「どの目録にも載っていない図書館がある――そう書かれた断片が、各地の図書館に一枚ずつ挟まっているの」'),
    { k: 'visit', zones: ['in:w_arcelia_library', 'in:w_luminas_library', 'in:w_celestia_holy_library', 'in:lu_g_sages'], label: '4つの図書館で断片を探す', text: '王都・ルミナス・聖都・賢者の書庫で断片を探す' },
    { k: 'quiz', text: '四枚の断片を並べる。', q: '断片が示す「入口が開く条件」は？', options: ['満月の夜、王都の門の前で', '誰も本を開いていない真夜中、最後に訪れた書架の前で', '雨の日の港で'], a: 1 },
    { k: 'midnight', text: '真夜中（0時台）、書架の前で断片を重ねる' },
    T('断片が一冊の本になり、書架の奥に扉が現れた。ヴェルナが息をのむ。「……地図にない図書館よ」'),
    { k: 'mapless', n: 4, text: '地図にない図書館で本を4冊読む（ヴェルナに入口を開いてもらう）' },
    T('司書の手記の一節：「ここは、世界が忘れたことと、まだ起きていないことを保存する場所。読む者によって頁が変わる」'),
    { k: 'choice', text: 'この図書館のことを、どうする？', options: [
      { id: 'visit', label: '自分だけの秘密として通い続ける', effect: '地図にない図書館は、今もあなたを待っている', reward: { flag: 'maplessFriend' } },
      { id: 'archive', label: '禁書庫のアーカイヴに伝える', effect: 'アーカイヴは「ようやく見つけたのですね」とだけ言った', world: { flag: 'mapless:archive' } },
      { id: 'seal', label: '入口を封じる', effect: '断片は白紙に戻った。図書館は再び誰にも見つからない', world: { flag: 'mapless:sealed' } }] }] },
  nx14: { host: { name: '地下測量士ドーラ', city: 'drakford', near: 'w_drakford_trade' }, service: 'undertrade', reward: { xp: 20000, title: '地底世界の探究者', flag: 'deepPick' }, steps: [
    T('「各地の洞窟に、同じ形の古い標石が埋まっているの。ばらばらの洞窟じゃない。地下でつながってる」'),
    { k: 'dungeons', n: 3, floor: 10, text: '異なる3つのダンジョンで10階まで潜り、地下の構造を確かめる' },
    { k: 'observe', obj: 'deepmarker', n: 3, text: 'アッシュランド・アンダーサンド・マグマ・クレバスの古い標石を調べる' },
    T('標石の刻みは一枚の地図になった。地下通路は大陸の下を走り、どこかの集落へ続いている。'),
    { k: 'kill', n: 8, fam: 'crystal', text: '地下の生態を調べる：結晶生物を8体調べる（倒して標本を採る）' },
    T('坑道の奥で、光苔の灯りを掲げた地下の民が手を振った。「地上の人だ。久しぶりに見た」'),
    { k: 'choice', text: '地下の集落とどう付き合う？', options: [
      { id: 'trade', label: '地上との交易を始める', effect: '地下交易路が開かれ、地上の品と地下の品が行き来するようになった', world: { flag: 'under:trade' } },
      { id: 'guide', label: '地底世界への案内を頼む', effect: '地下の民が、地底世界アンダーレルムへの抜け道を教えてくれた', reward: { realm: 'underrealm' } },
      { id: 'secret', label: '集落の存在を秘密にする', effect: '地下の民は静かな暮らしを続けている', reward: { gold: 5000 } }] }] },
  nx15: { host: { name: '元車掌のグスタフ', city: 'arcelia', near: 'w_arcelia_station' }, service: 'train', repeat: 'rechallenge', reward: { xp: 15000, title: '幻の列車の乗客' }, steps: [
    T('「王都街道の外れに、廃線の駅が残っとる。……真夜中、そこに列車が来ると言ったら笑うかね」'),
    { k: 'observe', obj: 'ghoststation', n: 1, text: '王都街道で、地図にない駅を見つける' },
    { k: 'board', text: '真夜中（0〜3時）、駅で列車を待って乗車する（列車が来ない夜もある）' },
    { k: 'cars', n: 6, text: '車両を巡る（一般客車・食堂車・荷物車・車掌室・特殊な客室・最後尾）' },
    T('汽笛が鳴った。列車は、あなたが一度も行ったことのない駅に止まった。')] },
  nx16: { host: { name: '植物学者フローラ', city: 'luminas', near: 'w_luminas_library' }, gate: 'witherroot', service: 'alchemy', reward: { xp: 18000, title: '枯れない樹木の研究者' }, steps: [
    T('「ユグドラシル・グローヴに、何十年も枯れたままの巨木がある。枯れているのに、周りの草花だけが季節外れに咲くの」'),
    { k: 'observe', obj: 'deadtree', n: 1, text: 'ユグドラシル・グローヴで枯れない巨木を見つける' },
    { k: 'observe', obj: 'withersample', n: 3, text: '巨木の周りの土・湧き水・花を調べる' },
    { k: 'observe', obj: 'deadtree', cond: 'night', key: 'night', n: 1, text: '夜、巨木を観察する（吸収の様子は夜にしか見えない）' },
    T('夜の巨木は、周りの魔力と養分を淡い光の筋として吸い上げていた。根の奥に、空洞がある。'),
    { k: 'floor', dungeon: 'witherroot', floor: 10, text: '巨木の根の間（ここから入れる）の最奥を調べる' },
    { k: 'choice', text: '巨木の運命を選ぶ。', options: [
      { id: 'revive', label: '巨木を再生させる', effect: '巨木は芽吹き、ユグドラシル・グローヴの薬草がよく採れるようになった', world: { flag: 'tree:revived' } },
      { id: 'stop', label: '吸収を止める', effect: '巨木は静かに朽ち、周りの森が元の季節を取り戻した', world: { flag: 'tree:stopped' } },
      { id: 'study', label: '研究対象として保存する', effect: '学院が巨木の研究を始め、学術都市が潤った', world: { flag: 'tree:studied', supply: { city: 'luminas', v: 0.08 } } }] }] },
  nx17: { host: { name: '遺跡測量士オルガ', city: 'celestia_holy', near: 'w_celestia_holy_library' }, gate: 'statue_ruin', reward: { xp: 18000, title: '石像の視線を追う者', art: { name: '石像の観測鏡', cond: 'crit', eff: 'critDmg', val: 0.5, dur: 8 } }, steps: [
    T('「エルム大森林、ダストヴェイル、クリスタル・リーフの古い石像が、ときどき向きを変えるの。いつ、どちらを向くのか記録してきて」'),
    { k: 'observe', obj: 'statue17', n: 3, statue: true, text: '3体の石像が向きを変える瞬間を記録する（時間帯で動く。外れた時はヒントが得られる）' },
    { k: 'quiz', text: '記録を地図に重ねる。東の雷の大陸、嵐に削られた山脈、雷雲のかかる尾根――三つの視線が交わる場所は？', q: '視線の交点は？', options: ['ヴォルトプレイン', 'テンペスト・リッジ', 'セイリュウの竹海', 'ユグドラシル・グローヴ'], a: 1, hint: '雷の大陸はシェンガル。嵐と雷雲が重なる尾根を地図で探そう' },
    { k: 'observe', obj: 'hiddenruin', n: 1, text: 'テンペスト・リッジの割れた岩を調べる' },
    { k: 'floor', dungeon: 'statue_ruin', floor: 10, text: '視線の交わる遺跡（ここから入れる）の最奥へ' }] },
  nx18: { host: { name: '湖畔の漁師エルザ', city: 'frostheim', near: 'w_frostheim_inn' }, gate: 'mirror_lake', reward: { xp: 20000, title: '月のない湖を見た者', items: [{ kind: 'mat', ref: 'moonShard', n: 3 }], spell: 'sp_6_7' }, steps: [
    T('「クリスタルウッドの湖には、月が映らないの。昔からずっと。でも、たまに“別の景色”が映る夜があるのよ」'),
    { k: 'observe', obj: 'moonlake', n: 3, lake: true, text: '条件の違う3つの夜に湖を観測する（晴れた夜・霧か曇りの夜・夜明け前）' },
    T('水面に、白い神殿と黒い月が映った。湖の周りの三つの古灯籠には、それぞれ方角が刻まれている。'),
    { k: 'sequence', text: '観測で見た順に古灯籠に灯をともす（間違えると灯は消え、ヒントが得られる）' },
    { k: 'floor', dungeon: 'mirror_lake', floor: 10, text: '湖の向こう側（ここから入れる）の最奥へ' },
    T('湖が映していたのは、月の裏側だった。ルナ・ヴェイルの観測者たちは、ここからこちら側を見ていたのかもしれない。')] },
};
