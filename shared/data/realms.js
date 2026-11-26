// PHASE 9: hidden special realms. Each realm = a hub city (built by the regular city generator, never linked to the
// overland map), a realm dungeon covering its other areas, and a discovery event (the "導線" registered in the event
// database) run by the city-event engine. Realms stay off the world map until discovered (events.discover).
// Lore is kept minimal on purpose: the large events of PHASE 10 extend these realms.
const W = (k) => ({ clear: 4, cloud: 3, fog: 1, ...(k || {}) });
const city = (id, name, short, realm, arch, pal, title, landmark, lore) => [id, name, short, 'realm', arch, 'portal', { realm, pal, title, landmark, founded: '不明', origin: lore[0], history: lore.slice(1),
  geography: lore[0], climate: '常に穏やか', architecture: '地上のどこにも似ていない', industry: ['不明'], economy: '地上の通貨も使える', politics: '不明', ruler: '不明', security: 4, classes: '—', culture: '—', lifestyle: '—',
  weather: W(), monsters: [], goods: { produce: ['crystal'], demand: ['wine'] } }];
export const REALM_CITY_ROWS = [
  city('cele_arca', '浮遊都市セレス・アルカ', 'セレス・アルカ', 'astralheim', 'holy', 'marble', '雲海に浮かぶ白亜の都', { k: 'clocktower', name: '星詠みの尖塔', district: 'rich' }, ['雲の上に浮かぶ都。誰が浮かべたのかは記録にない。', '地上で「天空の落日」と呼ばれる日、都の半分が雲の下へ落ちたという。']),
  city('arboria', '樹上都市アルボリア', 'アルボリア', 'yggdrasil', 'frontier', 'grass', '世界樹の枝に抱かれた街', { k: 'fountain', name: '樹液の泉', district: 'commerce' }, ['世界樹の枝の上に築かれた街。', '住民は世界樹の見る夢を読み取って暮らしてきた。']),
  city('nox_regalia', '地底王都ノクス・レガリア', 'ノクス・レガリア', 'underrealm', 'capital', 'obsidian', '光の届かぬ王都', { k: 'castle', name: '黒曜の王城', district: 'rich' }, ['地の底に広がる王国の都。', '地上の王国より古く、地上との交わりを自ら断った。']),
  city('morgana', '地底交易都市モルガナ', 'モルガナ', 'underrealm', 'trade', 'ash', '地底を結ぶ交易の要', { k: 'fountain', name: '光苔の広場', district: 'commerce' }, ['地底の各地を結ぶ交易都市。', '地上の品は、ここでは宝物として扱われる。']),
  city('chronopolis', '時間管理都市クロノポリス', 'クロノポリス', 'chronos_realm', 'scholar', 'arcane', '刻を管理する都', { k: 'clocktower', name: '大時計院', district: 'rich' }, ['世界の時間を見守るという都。', '住民は皆、自分の「残り時間」を知っている。']),
  city('unrecorded', '記録されない都市アンレコーデッド', 'アンレコーデッド', 'outer_world', 'frontier', 'ice', 'どの記録にも存在しない都市', { k: 'statue', name: '名前のない像', district: 'commerce' }, ['どの地図にも、どの記録にも存在しない都市。', '訪れた者の記憶にだけ残る。']),
];
const band = (name, layout, pal, fam, gim, boss, bossName) => ({ name, layout, pal, fam, gim, boss, bossName });
export const REALM_DUNGEONS = {
  astral: { id: 'astral', name: '天空遺跡群', theme: 'sky', desc: 'アストラルヘイムの遺跡と浮遊島', minLv: 70, maxFloor: 30, hidden: true, realm: 'astralheim', bands: [
    band('天空遺跡エーテル・ルイン', 'rooms', 'marble', ['angelFallen', 'wisp', 'construct'], ['wind'], 'seraph', '遺跡の守護天使'), band('星見の塔ステラ・タワー', 'maze', 'sky', ['harpy', 'elemThunder', 'mage'], ['lightning'], 'phoenix', '星を読む不死鳥'),
    band('浮遊島群スカイ・アーキペラゴ', 'islands', 'sky', ['harpy', 'dragonkin', 'angelFallen'], ['wind', 'void'], 'skyLord', '天空の落日を見た竜')] },
  yggdra: { id: 'yggdra', name: '世界樹の内奥', theme: 'forest', desc: 'ユグドラシルの樹洞と根源', minLv: 65, maxFloor: 30, hidden: true, realm: 'yggdrasil', bands: [
    band('樹洞の迷宮ホロウ・トランク', 'maze', 'moss', ['treant', 'spider', 'wisp'], ['roots'], 'hydra', '樹洞の大蛇'), band('根源の湖エターナル・スプリング', 'islands', 'lake', ['lizard', 'wisp', 'elemIce'], ['water'], 'kraken', '湖底の守り手'),
    band('世界樹の根源ルート・コア', 'cave', 'fungus', ['treant', 'shade', 'spider'], ['poisonFog', 'roots'], 'treeDream', '世界樹の夢')] },
  underdeep: { id: 'underdeep', name: '地底の深奥', theme: 'cave', desc: 'アンダーレルムの洞窟・地底湖・王墓', minLv: 70, maxFloor: 30, hidden: true, realm: 'underrealm', bands: [
    band('結晶洞窟クリスタル・アビス', 'cave', 'crystal', ['crystal', 'golem', 'bat'], ['darkness'], 'golemKing', '結晶の巨像'), band('地底湖ルナ・レイク', 'islands', 'lake', ['lizard', 'shade', 'wisp'], ['water', 'darkness'], 'kraken', '月なき湖の主'),
    band('古代王墓キングス・グレイブ', 'rooms', 'grave', ['skeleton', 'knight', 'shade'], ['curseZone', 'traps'], 'deepKing', '地底王国の始祖王')] },
  divine: { id: 'divine', name: '神域', theme: 'holy', desc: 'ディヴァイン・レルムの宮殿・墓所・戦場・門', minLv: 90, maxFloor: 40, hidden: true, realm: 'divine_realm', bands: [
    band('神々の宮殿パンテオン', 'rooms', 'marble', ['angelFallen', 'knight', 'wisp'], ['judgment'], 'seraph', '宮殿の門衛'), band('神骸の墓所ディヴァイン・グレイブ', 'maze', 'grave', ['shade', 'angelFallen', 'construct'], ['curseZone'], 'lich', '神骸の番人'),
    band('天上の戦場セレスティアル・ウォー', 'open', 'sky', ['angelFallen', 'demon', 'dragonkin'], ['judgment', 'lightning'], 'abyssLord', '戦場に残る戦神の影'), band('神々の門ゲート・オブ・ディヴァイン', 'arena', 'marble', ['angelFallen', 'voidling', 'knight'], ['judgment'], 'godShard', '門を守る神の欠片')] },
  outer: { id: 'outer', name: '世界の外側', theme: 'void', desc: 'アウター・ワールドの第零世界・回廊・境界', minLv: 95, maxFloor: 30, hidden: true, realm: 'outer_world', bands: [
    band('第零世界ゼロ・ワールド', 'open', 'void', ['voidling', 'shade', 'wisp'], ['void', 'darkness'], 'voidEye', '白紙の眼'), band('観測者の回廊コリドー・オブ・ウォッチャー', 'maze', 'clock', ['construct', 'voidling', 'mage'], ['echo'], 'timeWarden', '回廊の記録装置'),
    band('現実の境界リアリティ・エッジ', 'arena', 'void', ['voidling', 'abyssal', 'shade'], ['void'], 'edgeWatcher', '境界に立つもの')] },
  chronos: { id: 'chronos', name: '時間の深層', theme: 'clock', desc: 'クロノス・レルムの回廊・時計塔・墓標', minLv: 85, maxFloor: 30, hidden: true, realm: 'chronos_realm', bands: [
    band('永劫の回廊エターナル・コリドー', 'maze', 'clock', ['construct', 'wisp', 'mage'], ['timeZone'], 'timeWarden', '回廊の時守'), band('終末時計塔ドゥームズデイ・タワー', 'rooms', 'clock', ['construct', 'golem', 'voidling'], ['timeZone', 'conveyor'], 'golemKing', '時計仕掛けの巨人'),
    band('時間の墓標タイムレス・グレイブ', 'arena', 'grave', ['shade', 'construct', 'voidling'], ['timeZone', 'darkness'], 'doomHand', '終末時計の針')] },
};
export const REALM_BOSSES = [['skyLord', '天空の落日を見た竜', 'dragon', ['breath', 'fly', 'meteor', 'tailSweep']], ['treeDream', '世界樹の夢', 'beast', ['regrow', 'poisonBite', 'summon', 'breath']],
  ['deepKing', '地底王国の始祖王', 'humanoid', ['charge', 'guard', 'rally', 'summon']], ['edgeWatcher', '境界に立つもの', 'eye', ['laser', 'gravity', 'erase', 'predict']], ['doomHand', '終末時計の針', 'golem', ['timeStop', 'laser', 'echo', 'quake']]];
// realm → hub city / host city of its discovery event / dungeon
export const REALM_LINK = { astralheim: { hub: 'cele_arca', dungeon: 'astral', ev: 'lg_fall_heavens' }, yggdrasil: { hub: 'arboria', dungeon: 'yggdra', ev: 'lg_worldtree_dream' }, underrealm: { hub: 'nox_regalia', hub2: 'morgana', dungeon: 'underdeep', ev: 'lg_kingdom_below' },
  divine_realm: { hub: 'celestia_holy', dungeon: 'divine', ev: 'lg_god_remains' }, outer_world: { hub: 'unrecorded', dungeon: 'outer', ev: 'lg_other_side' }, chronos_realm: { hub: 'chronopolis', dungeon: 'chronos', ev: 'lg_doomsday' } };
const T = text => ({ k: 'talk', text });
// discovery events (run by the city-event engine). Only the path into each realm; PHASE 10 extends the stories.
export const REALM_EVENTS = {
  lg_fall_heavens: { host: { name: '星見の老学者ヘルガ', city: 'luminas', near: 'w_luminas_inn' }, realm: 'astralheim', reward: { xp: 20000, title: '天空を仰ぐ者' }, steps: [
    T('「三十年前、空の一部が“落ちてきた”夜がある。落ちた星の欠片は、雲の上にもう一つの大地があると教えてくれた」'),
    { k: 'level', n: 70, text: '雲の上の大地に耐えられる力（Lv70）' },
    { k: 'night', text: '夜に星図を読み解く' },
    { k: 'gather', ref: 'crystal', n: 5, text: '星の欠片の代わりに魔晶片を5つ集め、天空への標を作る' },
    T('標が空へ光の筋を伸ばした。雲海の向こうに、白い都の影が見える――天空領域アストラルヘイムへの道が開いた。')] },
  lg_worldtree_dream: { host: { name: 'エルフの夢読みリーネ', city: 'elmgard', near: 'el_g_herbalists' }, realm: 'yggdrasil', reward: { xp: 20000, title: '世界樹の夢を見た者' }, steps: [
    T('「最近、皆が同じ夢を見るの。大きな樹の枝の上に街があって、誰かが“おいで”と呼ぶ夢」'),
    { k: 'level', n: 65, text: '世界樹の中へ踏み込める力（Lv65）' },
    { k: 'kill', n: 10, fam: 'treant', text: '夢に呼応して騒ぐトレントを10体鎮める（森林地帯）' },
    { k: 'gather', ref: 'herb', n: 5, text: '夢見の香を焚くため薬草を5つ集める' },
    { k: 'night', text: '夜、香を焚いて夢に入る' },
    T('夢の中で、枝の上の街の門が開いた。目覚めても、その道は消えなかった――世界樹領域ユグドラシルへの道が開いた。')] },
  lg_kingdom_below: { host: { name: '坑夫頭ブラム', city: 'drakford', near: 'dr_g_miners' }, realm: 'underrealm', reward: { xp: 20000, title: '地底を訪れし者' }, steps: [
    T('「最深部の坑道を掘り抜いたら、下に“空”があった。黒い石の街並みと、光る苔の灯りが見えたんだ」'),
    { k: 'level', n: 70, text: '地の底に降りられる力（Lv70）' },
    { k: 'floor', floor: 40, text: 'いずれかのダンジョンで40階まで潜り、深い場所に体を慣らす' },
    { k: 'gather', ref: 'gem', n: 5, text: '地底の民への手土産に原石を5つ用意する' },
    T('坑道の底の扉が開き、地底の門番が言った。「地上の者よ、通るがよい」――地底世界アンダーレルムへの道が開いた。')] },
  lg_god_remains: { host: { name: '聖都の発掘隊長セラ', city: 'celestia_holy', near: 'w_celestia_holy_library' }, realm: 'divine_realm', reward: { xp: 30000, title: '神骸に触れし者' }, steps: [
    T('「聖都の地下から、人のものではない巨大な骨が見つかった。神の亡骸――神骸、と私たちは呼んでいる」'),
    { k: 'level', n: 90, text: '神域の気配に耐えられる力（Lv90）' },
    { k: 'event', id: 'ct_king_beneath', text: '王都の地下に眠る王の記録を手に入れる（イベント「街の地下に眠る王」）' },
    { k: 'gather', ref: 'relic', n: 5, text: '神骸の封印を解く遺物の欠片を5つ持ってくる' },
    T('神骸の胸に、扉の形の紋章が浮かんだ。その向こうから鐘の音――神域ディヴァイン・レルムへの道が開いた。')] },
  lg_other_side: { host: { name: '司書補ミレイユ', city: 'arcelia', near: 'ar_biglib' }, realm: 'outer_world', reward: { xp: 30000, title: '世界の裏側を覗いた者' }, steps: [
    T('「禁書庫の“異界書”を全部読んだ人だけが見つけられる頁がある――アーカイヴ様はそう言っていたわ」'),
    { k: 'level', n: 95, text: '世界の外側に触れられる力（Lv95）' },
    { k: 'books', cat: 'other', n: 6, text: '禁書庫の異界書を6冊すべて読み終える' },
    { k: 'midnight', text: '真夜中、読み終えた頁を並べる' },
    T('並べた頁の余白に、地図にない都市の名前が浮かんだ。「アンレコーデッド」――世界の外側アウター・ワールドへの道が開いた。')] },
  lg_doomsday: { host: { name: '時計職人オルロ', city: 'luminas', near: 'w_luminas_smith' }, realm: 'chronos_realm', reward: { xp: 25000, title: '終末時計を見た者' }, steps: [
    T('「十三時を打つ時計塔の話は聞いたか？ あれは世界の“終末時計”の写しだと、わしの師匠は言っていた」'),
    { k: 'level', n: 85, text: '時の歪みに耐えられる力（Lv85）' },
    { k: 'event', id: 'ct_thirteenth', text: '時計塔の十三時を確かめる（イベント「時計塔の十三時」）' },
    { k: 'gather', ref: 'crystal', n: 5, text: '時の歯車を組むため魔晶片を5つ集める' },
    { k: 'midnight', text: '真夜中、歯車を時計塔の十三番目の目盛りに合わせる' },
    T('針が「XIII」を指したまま止まり、文字盤の奥に都市が見えた――時間領域クロノス・レルムへの道が開いた。')] },
};
