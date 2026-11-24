// ABYSS world geography registry (names fixed by the directive; do not rename). Used by the event registry (loc ids),
// docs, and the PHASE 2 world-map build. `legacy` = cities already implemented in shared/data/cities.js (kept as-is;
// their placement on the new world map is an open decision — docs/ABYSS_CONFLICT_REPORT.md C-01).
const C = (id, name, extra = {}) => ({ id, name, ...extra });
export const CONTINENTS = [
  { id: 'eldia', name: '中央大陸エルディア', en: 'ELDIA', role: '世界の主要な冒険・交易・政治の中心',
    cities: [C('arcelia', '王都アルセリア', { capital: true }), C('gravel', 'スラム・グレイヴェル', { parent: 'arcelia', slum: true }), C('vermion', '商業都市ヴェルミオン'), C('luminas', '学術都市ルミナス'), C('drakford', '鉄鋼都市ドラクフォード'), C('marinelia', '港湾都市マリネリア'), C('celestia_holy', '聖都セレスティア'), C('elmgard', '辺境都市エルムガルド')],
    fields: [], facilities: ['王城', '大図書館', '冒険者ギルド', '王立魔法学院', '商人ギルド', '鍛冶師ギルド', '専門ギルド', '禁書庫への入口'] },
  { id: 'nordia', name: '北方大陸ノルディア', en: 'NORDIA', cities: [C('frostheim', 'フロストヘイム'), C('granberg', 'グランベルク'), C('whiteridge', 'ホワイトリッジ'), C('ignis_zero', 'イグニス・ゼロ'), C('valhart', 'ヴァルハルト')],
    fields: [C('frostvale', 'フロストヴェイル：永久凍土大雪原'), C('crystalwood', 'クリスタルウッド：氷晶樹海'), C('weissberg', 'ヴァイスベルク：白銀の巨峰'), C('glacial_grave', 'グレイシャル・グレイブ：氷河墓地'), C('arctica', 'アークティカ聖域：凍結神殿')] },
  { id: 'shengar', name: '東方大陸シェンガル', en: 'SHENGAR', cities: [C('ryuga', 'リュウガ'), C('elfilia', 'エルフィリア'), C('tenrai', 'テンライ'), C('kazane', 'カザネ'), C('shuraga', 'シュラガ')],
    fields: [C('yggdrasil_grove', 'ユグドラシル・グローヴ：世界樹の森'), C('voltplain', 'ヴォルトプレイン：雷鳴草原'), C('seiryu_bamboo', 'セイリュウの竹海：千年竹林'), C('tempest_ridge', 'テンペスト・リッジ：天空山脈'), C('amatsukami', 'アマツカミ遺跡：忘れられた神域')] },
  { id: 'saharia', name: '南方大陸サハリア', en: 'SAHARIA', cities: [C('azradia', 'アズラディア'), C('bazaruk', 'バザルーク'), C('nefer', 'ネフェル'), C('mirage', 'ミラージュ'), C('zal_qadim', 'ザル・カディム')],
    fields: [C('endless_dune', 'エンドレス・デューン：砂海'), C('dustvale', 'ダストヴェイル：砂塵峡谷'), C('necropolis', 'ネクロポリス・サンズ：沈黙の王墓群'), C('atum', 'アトゥム神殿：失われた神殿'), C('undersand', 'アンダーサンド：地下砂漠')] },
  { id: 'valgran', name: '西方大陸ヴァルグラン', en: 'VALGRAN', cities: [C('valcanos', 'ヴァルカノス'), C('greymoll', 'グレイモル'), C('baldran', 'バルドラン'), C('dragnia', 'ドラグニア'), C('ashbell', 'アッシュベル')],
    fields: [C('inferno_rift', 'インフェルノ・リフト：火山帯'), C('ashland', 'アッシュランド：灰燼の荒野'), C('magma_crevasse', 'マグマ・クレバス：溶岩大渓谷'), C('obsidian_wood', 'オブシディアン・ウッド：黒曜石の森林'), C('draconic_nest', 'ドラゴニック・ネスト：火焔龍の領域'), C('arcane_forge', 'アーケイン・フォージ：古代熔炉遺跡')] },
  { id: 'asteria', name: '外洋諸島アステリア', en: 'ASTERIA', cities: [C('nereia', 'ネレイア'), C('bluecoast', 'ブルーコースト'), C('aquaria', 'アクアリア'), C('atlantia', 'アトランティア', { note: '地上の海洋都市。沈没王国アトランティス（海底地域）とは別' }), C('seirune', 'セイルーン')],
    fields: [C('abyssal_ocean', 'アビサル・オーシャン：深蒼の大海'), C('atlantis', 'アトランティス：沈没王国', { underwater: true }), C('silent_trench', 'サイレント・トレンチ：海鳴りの海溝'), C('crystal_reef', 'クリスタル・リーフ：水晶珊瑚礁'), C('nereid_sanctuary', 'ネレイド・サンクチュアリ：海底神殿'), C('storm_archipelago', 'ストーム・アーキペラゴ：嵐の諸島')] },
];
// hidden realms: never shown on the world map until discovered (per-character discovery flag + optional world gate)
export const REALMS = [
  { id: 'astralheim', name: '天空領域アストラルヘイム', en: 'ASTRALHEIM', via: 'lg_fall_heavens', areas: ['浮遊都市セレス・アルカ', '天空遺跡エーテル・ルイン', '星見の塔ステラ・タワー', '浮遊島群スカイ・アーキペラゴ'] },
  { id: 'yggdrasil', name: '世界樹領域ユグドラシル', en: 'YGGDRASIL', via: 'lg_worldtree_dream', areas: ['世界樹の根源ルート・コア', '樹上都市アルボリア', '樹洞の迷宮ホロウ・トランク', '根源の湖エターナル・スプリング'] },
  { id: 'underrealm', name: '地底世界アンダーレルム', en: 'UNDERREALM', via: 'lg_kingdom_below', areas: ['地底王都ノクス・レガリア', '地底交易都市モルガナ', '結晶洞窟クリスタル・アビス', '地底湖ルナ・レイク', '古代王墓キングス・グレイブ'] },
  { id: 'sealed_abyss', name: '禁忌領域シールド・アビス', en: 'SEALED ABYSS', via: 'lib_sealed_abyss', areas: ['忘却の地下墓地', '腐蝕の菌窟', '灼熱の地底炉', '沈黙の水没神殿', '失われた機械都市'] },
  { id: 'luna_veil', name: '月面領域ルナ・ヴェイル', en: 'LUNA VEIL', via: 'ev_blackmoon', areas: ['黒月の観測地ノクティス', '月影の神殿セレネ・テンプル', '観測者の遺跡オブザーバトリー', '月の裏側ファーサイド'] },
  { id: 'divine_realm', name: '神域ディヴァイン・レルム', en: 'DIVINE REALM', via: 'lg_god_remains', areas: ['神々の宮殿パンテオン', '神骸の墓所ディヴァイン・グレイブ', '天上の戦場セレスティアル・ウォー', '神々の門ゲート・オブ・ディヴァイン'] },
  { id: 'outer_world', name: '世界の外側アウター・ワールド', en: 'OUTER WORLD', via: 'lg_other_side', areas: ['記録されない都市アンレコーデッド', '第零世界ゼロ・ワールド', '観測者の回廊コリドー・オブ・ウォッチャー', '現実の境界リアリティ・エッジ'] },
  { id: 'chronos_realm', name: '時間領域クロノス・レルム', en: 'CHRONOS REALM', via: 'lg_doomsday', areas: ['時間管理都市クロノポリス', '永劫の回廊エターナル・コリドー', '終末時計塔ドゥームズデイ・タワー', '時間の墓標タイムレス・グレイブ'] },
];
import { CITIES as LEGACY } from './cities.js';
export const LEGACY_CITIES = ['haven', 'marina', 'celestia', 'vulcan', 'arcanum', 'lumina'];
export const UNDERWORLD_ORGS = ['黒鴉商会', '鉄爪団', '影縫い', '赤蛇組', '灰鐘教団', '黒炉工房', '無名の子供たち'];
const ALL = {}; for (const c of CONTINENTS) { ALL[c.id] = c; for (const x of [...c.cities, ...c.fields]) ALL[x.id] = { ...x, continent: c.id }; } for (const r of REALMS) ALL[r.id] = r; for (const l of LEGACY_CITIES) ALL[l] = { id: l, name: LEGACY[l].name, legacy: true }; ALL.world = { id: 'world', name: '世界各地' };
export const PLACE = ALL;
