// NEW WORLD EVENTS — PHASE F (25-30: challenge & collection) and PHASE G (01-04, 06: great world events).
// Narrative steps run on the city-event engine; world-shared states (castle barrier, serpent segments, rifts, the tower)
// and rankings live in events.w.flags and are stepped by server/game/grand.js. `cond` steps ask that module whether a
// condition (personal or world) is met. Nothing here destroys long-earned assets; calamities are sealed, never killed.
const T = text => ({ k: 'talk', text });
const C = (id, text) => ({ k: 'cond', id, text });
const band = (name, layout, pal, fam, gim, boss, bossName) => ({ name, layout, pal, fam, gim, boss, bossName });
export const GRAND_DUNGEONS = {
  sky_castle: { id: 'sky_castle', name: '天空城ヴァルハイト', theme: 'sky', desc: '障壁が解けたときだけ降りてくる天空の城', minLv: 70, maxFloor: 15, hidden: true, bands: [band('天空城の回廊', 'rooms', 'marble', ['angelFallen', 'construct', 'harpy'], ['wind'], 'seraph', '天空城の主')] },
  sea_tower: { id: 'sea_tower', name: '海底から伸びる塔', theme: 'void', desc: '海の底から伸び続ける螺旋の塔', minLv: 60, maxFloor: 20, hidden: true, bands: [band('沈んだ螺旋', 'maze', 'ruin', ['lizard', 'elemIce', 'shade'], ['water'], 'hydra', '塔に巻きつく海竜')] },
};
// ── 25 the hundred trials: 10 categories × 10 tiers, measured from the character's own records
export const TRIAL_CATS = [
  { k: 'level', name: 'レベル', unit: '', t: [5, 10, 20, 30, 45, 60, 80, 100, 125, 150] },
  { k: 'kills', name: '魔物討伐', unit: '体', t: [50, 200, 500, 1000, 2000, 4000, 7000, 10000, 15000, 20000] },
  { k: 'bosses', name: 'ボス討伐', unit: '体', t: [1, 5, 10, 20, 35, 50, 75, 100, 150, 200] },
  { k: 'fams', name: '討伐した魔物の種類', unit: '種', t: [5, 8, 11, 14, 17, 20, 24, 28, 32, 36] },
  { k: 'mastery', name: '熟練度30以上の武器種', unit: '種', t: [1, 2, 3, 5, 8, 12, 18, 25, 32, 40] },
  { k: 'codex', name: '入手した武器', unit: '本', t: [10, 30, 60, 100, 200, 350, 500, 800, 1200, 2000] },
  { k: 'dungeons', name: '10階以上踏破したダンジョン', unit: '箇所', t: [1, 2, 3, 5, 7, 10, 13, 16, 20, 24] },
  { k: 'titles', name: '称号', unit: '個', t: [3, 6, 10, 15, 20, 28, 36, 45, 55, 70] },
  { k: 'events', name: '達成したイベント', unit: '件', t: [1, 3, 6, 10, 15, 20, 28, 36, 45, 60] },
  { k: 'gold', name: '所持金', unit: 'G', t: [10000, 30000, 80000, 150000, 300000, 600000, 1000000, 2000000, 5000000, 10000000] },
];
export const TRIAL_TITLES = [[10, '試練の挑戦者'], [25, '試練を越えし者'], [50, '半百の試練者'], [75, '試練の覇者'], [100, '百の試練の踏破者']];
// ── 26 unknown species: a family seen under a condition (time, weather, elite) is a new entry
export const SPECIES = [
  { id: 'nightwolf', name: '月影の魔狼', fam: 'wolf', cond: 'night', hint: '夜にだけ群れを率いる魔狼がいる' },
  { id: 'rainslime', name: '雨溶けスライム', fam: 'slime', cond: 'rain', hint: '雨の日に姿を変えるスライム' },
  { id: 'stormharpy', name: '嵐呼びのハーピー', fam: 'harpy', cond: 'storm', hint: '嵐の空で群れるハーピー' },
  { id: 'fogshade', name: '霧影', fam: 'shade', cond: 'fog', hint: '霧の中でしか輪郭を持たない影' },
  { id: 'snowgolem', name: '雪纏いのゴーレム', fam: 'golem', cond: 'snow', hint: '雪の日に体を雪で覆うゴーレム' },
  { id: 'dawnwisp', name: '暁のウィスプ', fam: 'wisp', cond: 'dawn', hint: '夜明け前（4〜5時）にだけ灯るウィスプ' },
  { id: 'eliteknight', name: '名のある呪騎士', fam: 'knight', cond: 'elite', hint: '強化個体の呪われた騎士' },
  { id: 'elitespider', name: '女王蜘蛛', fam: 'spider', cond: 'elite', hint: '強化個体の洞窟蜘蛛' },
  { id: 'nightbat', name: '真夜中の吸血蝙蝠', fam: 'bat', cond: 'midnight', hint: '真夜中（0時台）に群れる蝙蝠' },
  { id: 'rainlizard', name: '雨乞いのリザードマン', fam: 'lizard', cond: 'rain', hint: '雨の日に祈りを捧げるリザードマン' },
  { id: 'eliteconstruct', name: '再起動した機兵長', fam: 'construct', cond: 'elite', hint: '強化個体の古代機兵' },
  { id: 'voidnight', name: '夜渡りの落とし子', fam: 'voidling', cond: 'night', hint: '夜にだけ現れる虚無の落とし子' },
];
// ── 27 legendary armament catalog milestones (a type counts when you own an UR-or-better weapon of it)
export const CATALOG_MILES = [[5, { gold: 20000, xp: 20000 }], [15, { gold: 50000, title: '伝説武器の蒐集家' }], [30, { gold: 100000, xp: 80000 }], [50, { gold: 200000, title: '伝説武器の目録者' }], [86, { gold: 500000, title: '八十六の伝説を識る者' }]];
// ── 28 continental rally: a weekly course of checkpoints (cities in order)
export const RALLY_COURSES = [['haven', 'arcelia', 'drakford', 'marinelia', 'luminas'], ['luminas', 'vermion', 'arcelia', 'elmgard', 'haven'], ['marinelia', 'frostheim', 'drakford', 'vermion', 'celestia_holy'], ['elmgard', 'celestia_holy', 'luminas', 'marinelia', 'arcelia']];
// ── 29 the ultimate artisan: contest themes (scored from the submitted weapon; the weapon is not taken)
export const ARTISAN_THEMES = [{ k: 'plus', name: '鍛え抜かれた一振り', desc: '強化値が最も高い武器' }, { k: 'traits', name: '特性の妙', desc: '特性の数と強さ' }, { k: 'rar', name: '至高の素材', desc: 'レア度と強化値' }, { k: 'atk', name: '剛の武器', desc: '攻撃力（強化込み）' }];
// ── 30 the star readers: constellations observed in fields at night under a clear sky
export const STARS = [
  { key: 'crown', name: '王冠座', field: 'field_capital', h: [21, 23], rec: '王冠座――七つの星が王の冠を描く。最も暗い星が、黒い月の昇る方角を指していた' },
  { key: 'wolf', name: '狼座', field: 'field_greatwood', h: [0, 2], rec: '狼座――狼の目にあたる星が、ほかより早く瞬いている' },
  { key: 'glass', name: '砂時計座', field: 'dustvale', h: [22, 24], rec: '砂時計座――上の砂がほとんど残っていない形をしている' },
  { key: 'serpent', name: '海竜座', field: 'crystal_reef', h: [1, 3], rec: '海竜座――尾が、世界を一周して頭に届きかけている' },
  { key: 'crow', name: '灰鴉座', field: 'ashland', h: [20, 22], rec: '灰鴉座――翼の先に、見慣れない赤い星がある' },
  { key: 'moon', name: '月輪座', field: 'crystalwood', h: [2, 4], rec: '月輪座――輪の中心が空っぽだ。そこにあるはずの月が描かれていない' },
  { key: 'gate', name: '門座', field: 'tempest_ridge', h: [23, 24], rec: '門座――二本の柱の間に、星のない帯が走っている。境界の亀裂のように' },
];
// ── 02 the unrecorded people: people who exist but are in no record, met in the fields at night
export const UNRECORDED = [
  { key: 'u1', field: 'field_capital', label: '◇ 焚き火のそばの旅人', say: '「名前？ 昔はあったよ。台帳から落ちてしまっただけさ」', mark: 'かつて王都の鐘を磨いていた男' },
  { key: 'u2', field: 'field_greatwood', label: '◇ 木陰の少女', say: '「村の名簿にわたしの名前がないの。でも、母さんは覚えてるって」', mark: '名簿から消えた村の少女' },
  { key: 'u3', field: 'dustvale', label: '◇ 砂に座る老人', say: '「わしの店は、地図から消えた街にあった」', mark: '消えた街の雑貨屋' },
  { key: 'u4', field: 'crystal_reef', label: '◇ 浜辺の漁師', say: '「沈んだ王国の船乗りだった。帰る港の名前を、誰も覚えていない」', mark: '沈んだ王国の船乗り' },
  { key: 'u5', field: 'crystalwood', label: '◇ 湖畔の書記', say: '「記録係だったんだ。だから、自分の名前を書き忘れた」', mark: '名前を書き忘れた記録係' },
];
// ── 03 world serpent segments, 04 boundary rifts
export const SERPENT_SEGS = [{ id: 'head', name: '頭', field: 'crystal_reef' }, { id: 'coil', name: '胴', field: 'dustvale' }, { id: 'fin', name: '鰭', field: 'tempest_ridge' }, { id: 'tail', name: '尾', field: 'ashland' }];
export const RIFT_FIELDS = [{ id: 'r1', field: 'field_greatwood', name: '森の亀裂' }, { id: 'r2', field: 'undersand', name: '砂の亀裂' }, { id: 'r3', field: 'magma_crevasse', name: '溶岩の亀裂' }];
// field objects (placed by the exploration module; interaction handled by grand.js)
export const GRAND_OBJECTS = [...STARS.map(s => ({ field: s.field, k: 'starstone', key: s.key, label: '◇ 星見の石台' })), ...UNRECORDED.map(u => ({ field: u.field, k: 'unrecorded', key: u.key, label: u.label }))];

export const GRAND_EVENTS = {
  nx25: { host: { name: '試練官グラディス', city: 'haven', near: 'h_guild' }, service: 'grand', reward: { xp: 50000, title: '百の試練に挑む者' }, steps: [
    T('「百の試練――剣の腕、旅の長さ、集めた武器、見届けた出来事。あなたのこれまでを、百の物差しで測らせてほしい」'),
    C('trials:10', '試練を10個達成する（試練の記録から受け取る）'),
    T('「十を越えたか。ここからが本番だ。試練は、あなたが積み上げたものしか見ない」'),
    C('trials:30', '試練を30個達成する'),
    T('「名を刻もう。百を越える者が現れるまで、この記録は残る」')] },
  nx26: { host: { name: '調査局長オスカー', city: 'vermion', near: 'w_vermion_inn' }, service: 'grand', reward: { xp: 40000, title: '未確認生物調査員' }, steps: [
    T('「図鑑に載っていない魔物がいる。同じ種でも、夜や雨や嵐の中でだけ姿を変える個体だ。条件ごとに一体ずつ記録してほしい」'),
    C('bureau:3', '未確認の個体を3種記録して報告する'),
    T('「やはりいた。条件が生態を変える――魔物は環境と一緒に生きているんだ」'),
    C('bureau:8', '未確認の個体を8種記録して報告する'),
    { k: 'choice', text: '集めた記録をどう扱う？', options: [
      { id: 'publish', label: '図鑑に加えて公開する', effect: '冒険者たちが新しい生態を知り、狩りが安全になった', world: { flag: 'bureau:published' }, reward: { gold: 30000 } },
      { id: 'protect', label: '希少な個体は保護区として伏せる', effect: '一部の個体は人目を離れて静かに生き続ける', world: { flag: 'bureau:protected' }, reward: { gold: 15000, xp: 30000 } }] }] },
  nx27: { host: { name: '目録編纂者ルカ', city: 'drakford', near: 'w_drakford_weapon' }, service: 'grand', reward: { xp: 60000, title: '伝説武器の目録編纂者' }, steps: [
    T('「八十六の武器種、それぞれの頂点にある武器を目録にしたい。UR以上の一本を手にした武器種を、記録として数えさせてくれ」'),
    C('catalog:5', '5つの武器種でUR以上の武器を入手する'),
    T('「伝説には由来がある。同じ種類でも、作り手と時代で別物だ。……続けてくれ」'),
    C('catalog:15', '15の武器種でUR以上の武器を入手する'),
    T('「目録は世界中の冒険者で埋めていく。あなたの頁は、もう誰にも消せない」')] },
  nx28: { host: { name: 'レース主催者ミラ', city: 'marinelia', near: 'w_marinelia_station' }, service: 'grand', sched: { on: 0, every: 7, len: 7, label: '毎週コースが変わる' }, repeat: 'cycle', reward: { xp: 15000, gold: 5000 }, steps: [
    T('「大陸横断レースへようこそ！ 今週のコースの街を、順番どおりに巡ってゴールして。移動手段は自由よ」'),
    C('rally:done', '今週のコースを完走する（受付で出走してから、チェックポイントの街を順番に訪れる）'),
    T('「完走おめでとう！ 記録は週の終わりまで順位表に載るわ」')] },
  nx29: { host: { name: '匠の組合長ハンス', city: 'luminas', near: 'w_luminas_smith' }, service: 'grand', sched: { on: 0, every: 10, len: 4, label: '10日ごとに4日間' }, repeat: 'cycle', reward: { xp: 15000, gold: 8000 }, steps: [
    T('「至高の職人を決める品評会だ。今回のお題に合う武器を一振り出品してくれ。武器は見せてもらうだけで、預かりはしない」'),
    C('artisan:entry', '今回のお題で武器を出品する'),
    T('「審査は会期の終わりだ。上位の三人には、組合から特別な称号を贈る」')] },
  nx30: { host: { name: '星詠みの老女セレネ', city: 'celestia_holy', near: 'w_celestia_holy_library' }, service: 'grand', reward: { xp: 60000, title: '星を読む者', items: [{ kind: 'mat', ref: 'starChart', n: 1 }] }, steps: [
    T('「星は、地上で起きることを少し先に映すのよ。七つの星座を、それぞれの地で、晴れた夜に見てきて。星見の石台から見えるわ」'),
    C('stars:3', '星座を3つ観測する（各地の星見の石台・晴れた夜の決まった時刻）'),
    T('「砂時計、狼の目、空っぽの月……並べるほど、ひとつの予兆に見えてくる」'),
    C('stars:7', '七つの星座をすべて観測する'),
    { k: 'choice', text: '星が告げる予兆を、どうする？', options: [
      { id: 'share', label: '各地の教会に伝えて備えさせる', effect: '黒い月の前兆が、各地で少し早く告げられるようになった', world: { flag: 'stars:shared' }, reward: { gold: 20000 } },
      { id: 'keep', label: '星詠みの秘密として胸にしまう', effect: '予兆はあなたと星詠みだけが知っている', reward: { xp: 40000, flag: 'starSecret' } }] }] },
  nx01: { host: { name: '天文台の観測士リゼ', city: 'luminas', near: 'w_luminas_station' }, service: 'grand', gate: 'sky_castle', repeat: 'cycle', reward: { xp: 80000, gold: 40000, title: '天空城に至りし者' }, steps: [
    T('「空に城が浮かんでいるの。障壁に守られていて、近づけない。魔物の魔力が障壁を支えているみたい――みんなで削れば、きっと降りてくる」'),
    C('sky:open', '天空城の障壁を解く（世界中の冒険者の討伐・献納で障壁が下がる。城が現れている間だけ）'),
    { k: 'floor', dungeon: 'sky_castle', floor: 15, text: '降りてきた天空城（ここから入れる）の最上階で城の主を倒す' },
    { k: 'choice', text: '天空城の核をどうする？', options: [
      { id: 'return', label: '核を空に還し、城を眠らせる', effect: '城は雲の向こうへ去った。また空に現れる日まで', reward: { gold: 20000 } },
      { id: 'study', label: '核の欠片を天文台に持ち帰る', effect: '天文台は城の軌道を予測できるようになった', world: { flag: 'sky:studied' }, reward: { xp: 30000 } }] }] },
  nx02: { host: { name: '戸籍係ノーマン', city: 'arcelia', near: 'w_arcelia_bank' }, service: 'grand', reward: { xp: 40000, title: '名を拾う者' }, steps: [
    T('「台帳と人数が合わない。どこにも記録がないのに、確かに暮らしている人たちがいるらしい。夜の野原で見かけるそうだ」'),
    C('unrec:3', '記録されない人々に3人会う（夜の各地のフィールド）'),
    T('「話を聞いてきたか。彼らは消えたんじゃない。名前だけが台帳からこぼれたんだ」'),
    C('unrec:5', '記録されない人々5人すべてに会う'),
    { k: 'choice', text: '彼らのことを、どうする？', options: [
      { id: 'record', label: '聞いた来歴を台帳に書き戻す', effect: '台帳に新しい頁が加わった。世界の記録が少しだけ正しくなる', world: { flag: 'unrec:recorded' }, reward: { gold: 15000 } },
      { id: 'leave', label: '記録に縛られない暮らしを尊重する', effect: '彼らは今夜も、名前のないまま焚き火を囲む', reward: { xp: 30000 } }] }] },
  nx03: { host: { name: '海図師マレーネ', city: 'marinelia', near: 'w_marinelia_trade' }, service: 'grand', repeat: 'cycle', reward: { xp: 60000, gold: 30000, title: '巨蛇を鎮めし者' }, steps: [
    T('「世界を囲う巨蛇が、また浮上してきた。頭・胴・鰭・尾が、四つの地方に同時に現れる。倒すことはできない――鎮めて、海の底へ帰すの」'),
    C('serpent:5', '浮上した巨蛇の部位を鎮める（部位が現れた地方のフィールドで魔物を倒す・献納する。5回以上貢献）'),
    C('serpent:sealed', '四つの部位すべてを鎮める（世界中の冒険者と協力）'),
    T('「巨蛇は眠りに戻った。いつかまた浮上する。そのときも、誰かが鎮めるわ」')] },
  nx04: { host: { name: '境界観測者ユーリ', city: 'arcelia', near: 'ar_biglib' }, service: 'grand', repeat: 'cycle', reward: { xp: 70000, gold: 30000, title: '境界を繕う者' }, steps: [
    T('「禁書庫の封印が揺らいだせいで、世界の境界がほつれ始めている。崩れたら、各地のフィールドに亀裂が開く」'),
    { k: 'event', id: 'lib_forbidden', text: '禁書庫の真実を知る（イベント「禁書庫」を達成）' },
    C('rift:active', '境界の崩壊が起きるのを待つ（世界の状況による）'),
    C('rift:10', '亀裂の開いたフィールドで魔物を倒し、亀裂を縫い合わせる（10回以上貢献）'),
    C('rift:closed', 'すべての亀裂を閉じる（世界中の冒険者と協力）'),
    T('「境界は繕われた。ほつれはまた生まれる。だから、繕う人がいる」')] },
  nx06: { host: { name: '灯台守ギルバート', city: 'marinelia', near: 'w_marinelia_tavern' }, service: 'grand', gate: 'sea_tower', reward: { xp: 70000, gold: 35000, title: '螺旋の塔を降りた者' }, steps: [
    T('「沖に塔が生えた。海の底から、毎日少しずつ伸びている。沈んだ王国と関係があるに違いない。塔の中から伸びるのを抑えてくれ」'),
    { k: 'floor', dungeon: 'sea_tower', floor: 10, text: '塔（ここから入れる）の10階まで降りる' },
    { k: 'floor', dungeon: 'sea_tower', floor: 20, text: '塔の最深部で、塔に巻きつく海竜を倒す' },
    { k: 'choice', text: '塔の根元で、沈んだ王国の紋章を見つけた', options: [
      { id: 'seal', label: '紋章を封じ、塔の成長を止める', effect: '塔の伸びは緩やかになった', world: { flag: 'tower:sealed' }, reward: { gold: 20000 } },
      { id: 'study', label: '紋章を持ち帰り、沈没王国の研究に役立てる', effect: '沈んだ王国の記録が一つ増えた', reward: { xp: 30000, items: [{ kind: 'mat', ref: 'relic', n: 3 }] } }] }] },
};
