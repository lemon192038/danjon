// NEW WORLD EVENTS — PHASE E: regional, economic and social events (19-24). World- and region-shared states with
// player contributions recorded per character; NPC nations, routes and the village keep simulating while everyone is
// offline (cheap hourly steps). No client-side decisions: every change is validated and saved by the server.
const B = (id, name, t, size, o = {}) => ({ id, name, t, size, ...o });
// ── 19 the nameless village: a real town whose buildings come from its facilities
export const VILLAGE_ID = 'nameless_village';
export const VILLAGE_ROW = [VILLAGE_ID, '名もなき村', '名もなき村', 'eldia', 'village', 'carriage', { title: '辺境の小さな集落', landmark: { k: 'well', name: '共同井戸', district: 'common' }, pal: 'grass', founded: '不明', origin: 'エルム大森林の外れに、数家族が身を寄せ合って暮らす小さな集落。', history: ['名前もない小さな集落。旅人もめったに訪れない。'],
  geography: '森の外れの小さな丘。', climate: '穏やか。', architecture: '木造の小屋。', industry: ['農業'], economy: '自給自足。', politics: '村長の合議', ruler: '村長マルタ', security: 2, classes: '農民ばかり。', culture: '収穫祭だけが楽しみ。', lifestyle: '日の出とともに起き、日没とともに眠る。',
  weather: { clear: 4, cloud: 3, rain: 2 }, monsters: ['狼', 'ゴブリン'], goods: { produce: ['wheat'], demand: ['ore', 'cloth'] } }];
export const VILLAGE_ARCH = { size: [80, 62], pal: 'grass', dist: [['common', 0.4, 0.5, []], ['commerce', 0.72, 0.4, []]] };
export const VILLAGE_BASE = [B('nv_chief', '村長の家', 'shack', 'S', { svc: 'village' }), B('nv_store', '簡易倉庫', 'warehouse', 'S')];
// facilities: stage needed, cost (materials + gold, shared by all contributors; one player may fill at most half), effects
export const FACILITIES = {
  farm: { name: '農地', stage: 1, cost: { herb: 10, wood: 6 }, eff: { food: 4, jobs: { farmer: 3 } }, bld: B('nv_farm', '農具小屋', 'shack', 'S') },
  well2: { name: '第二の井戸', stage: 1, cost: { ore: 6, wood: 4 }, eff: { water: 4 } },
  inn: { name: '宿屋', stage: 2, cost: { wood: 15, ore: 5, gold: 5000 }, eff: { sat: 8, trade: 2, jobs: { innkeeper: 1 } }, bld: B('nv_inn', '村の宿', 'inn', 'S', { svc: 'inn' }) },
  shop: { name: '商店', stage: 2, cost: { wood: 12, gem: 3, gold: 6000 }, eff: { econ: 6, jobs: { merchant: 2 } }, bld: B('nv_shop', '村の商店', 'shop', 'S', { svc: 'vshop' }) },
  smithy: { name: '鍛冶場', stage: 2, cost: { ore: 15, wood: 6, gold: 6000 }, eff: { econ: 4, safety: 4, jobs: { smith: 2 } }, bld: B('nv_smith', '村の鍛冶場', 'smithy', 'S', { svc: 'smith' }) },
  barn: { name: '大きな倉庫', stage: 2, cost: { wood: 20, gold: 3000 }, eff: { store: 1, food: 1 }, bld: B('nv_barn', '大きな倉庫', 'warehouse', 'M') },
  watch: { name: '見張り櫓', stage: 2, cost: { wood: 12, ore: 8, gold: 4000 }, eff: { safety: 12, jobs: { guard: 3 } }, bld: B('nv_watch', '見張り櫓', 'shack', 'S') },
  trade: { name: '交易所', stage: 3, cost: { wood: 15, gem: 6, gold: 12000 }, eff: { trade: 8, econ: 6, jobs: { merchant: 2 } }, bld: B('nv_trade', '村の交易所', 'office', 'S', { svc: 'trade' }) },
  tavern: { name: '酒場', stage: 3, cost: { wood: 15, herb: 10, gold: 8000 }, eff: { sat: 10, jobs: { traveler: 2 } }, bld: B('nv_tavern', '村の酒場', 'tavern', 'S') },
  guild: { name: '冒険者ギルド出張所', stage: 4, cost: { wood: 25, ore: 15, gold: 20000 }, eff: { safety: 10, econ: 6, jobs: { guard: 2 } }, bld: B('nv_guild', '冒険者ギルド出張所', 'guildhall', 'M', { svc: 'quest' }) },
  church: { name: '小さな教会', stage: 4, cost: { wood: 20, crystal: 6, gold: 15000 }, eff: { sat: 12 }, bld: B('nv_church', '小さな教会', 'church', 'S', { svc: 'inn' }) },
  workshop: { name: '共同工房', stage: 4, cost: { ore: 20, wood: 20, relic: 2, gold: 20000 }, eff: { econ: 8, jobs: { builder: 3 } }, bld: B('nv_work', '共同工房', 'workshop', 'S', { svc: 'smith' }) },
  station: { name: '停留所', stage: 5, cost: { wood: 30, ore: 20, gold: 30000 }, eff: { trade: 12 }, bld: B('nv_station', '村の停留所', 'station', 'S', { svc: 'travel' }) },
  library: { name: '図書室', stage: 5, cost: { wood: 25, relic: 4, gold: 25000 }, eff: { sat: 8, jobs: { researcher: 2 } }, bld: B('nv_library', '村の図書室', 'library', 'S') },
};
export const VILLAGE_STAGES = [{ n: 1, name: '小さな集落' }, { n: 2, name: '集落', pop: 14, fac: 2 }, { n: 3, name: '交易の村', pop: 26, fac: 5, econ: 20 }, { n: 4, name: '町', pop: 45, fac: 8, econ: 40 }, { n: 5, name: '独立した都市', pop: 80, fac: 12, econ: 70 }];
export const VILLAGE_CRISES = {
  raid: { name: '魔物の襲撃', text: 'エルム大森林から魔物が押し寄せている', need: { kill: 25 }, hit: { safety: -15, sat: -8 } },
  food: { name: '食料不足', text: '不作で蓄えが尽きかけている', need: { herb: 15, hide: 8 }, hit: { food: -20, sat: -10 } },
  material: { name: '建築資材不足', text: '修繕の木材が足りない', need: { wood: 20 }, hit: { sat: -5 } },
  merchant: { name: '商人の撤退', text: '危険を嫌った行商人が来なくなった', need: { gold: 8000 }, hit: { trade: -6, econ: -5 } },
  politics: { name: '領主の課税', text: '近隣の領主が通行税を求めてきた', choice: [{ id: 'pay', label: '税を払う（村の資金から）', eff: { econ: -8 } }, { id: 'talk', label: '交渉する（王都の書状を求める）', eff: { sat: 4 } }, { id: 'refuse', label: '拒否する', eff: { safety: -8, sat: 6 } }] } };
export const VILLAGE_SHOP = [{ ref: 'meal', price: 50, label: '村の素朴なパン（定食扱い）' }, { ref: 'herb', price: 20 }, { ref: 'wood', price: 30 }];
export const VILLAGE_TITLES = [[30, '村の協力者'], [150, '村の功労者'], [500, '村を育てた者']];
// ── 20 the lost trade route
export const ROUTE_CAUSES = {
  monsters: { name: '魔物の出現', text: '街道に魔物の群れが居着いた', need: { kill: 30 } },
  bridge: { name: '橋の崩落', text: '街道の橋が崩れた', need: { wood: 30, ore: 15 } },
  bandits: { name: '盗賊団', text: '盗賊団が通行を妨げている', need: { duel: 1 }, alt: { gold: 20000 } },
  politics: { name: '政治的な封鎖', text: '関所が閉ざされた', need: { quiz: 1, gold: 8000 } },
  disaster: { name: '土砂崩れ', text: '大雨で街道が埋まった', need: { wood: 20, herb: 20 } } };
// ── 21 shifting borders: six nations, contested border regions
export const NATIONS = {
  eldia: { name: 'エルディア王国', capital: 'arcelia', gov: '王政', leader: '国王エドワルド三世' }, nordia: { name: 'ノルディア連邦', capital: 'frostheim', gov: '連邦議会', leader: '議長ハーラル' },
  shengar: { name: 'シェンガル皇国', capital: 'ryuga', gov: '皇帝親政', leader: '皇帝龍胤' }, saharia: { name: 'サハリア首長国連合', capital: 'azradia', gov: '首長会議', leader: '大首長ザヒル' },
  valgran: { name: 'ヴァルグラン帝国', capital: 'valcanos', gov: '軍事帝政', leader: '皇帝グラディウス' }, asteria: { name: 'アステリア諸島同盟', capital: 'nereia', gov: '諸島同盟', leader: '盟主ネレイス' } };
export const BORDERS = [{ id: 'storm_archipelago', a: 'asteria', b: 'eldia' }, { id: 'glacial_grave', a: 'nordia', b: 'valgran' }, { id: 'undersand', a: 'saharia', b: 'valgran' },
  { id: 'seiryu_bamboo', a: 'shengar', b: 'eldia' }, { id: 'crystal_reef', a: 'asteria', b: 'shengar' }, { id: 'dustvale', a: 'saharia', b: 'shengar' }];
// ── 22 the grand merchant festival
export const GRAND_FESTIVAL = { every: 21, len: 3, cities: ['arcelia', 'vermion', 'marinelia', 'frostheim', 'azradia', 'nereia', 'ryuga', 'valcanos'], fee: 2000, stallMax: 4,
  goods: [{ ref: 'abyssShard', price: 2600, n: 2, name: '深淵の欠片（他大陸の商人）' }, { ref: 'relic', price: 500, n: 5 }, { ref: 'luckCharm', price: 900, n: 3 }, { ref: 'traitTicket', price: 22000, n: 1 }] };
// ── 23 after the calamity
export const RECOVERY_PHASES = ['被害発生', '緊急支援', '復旧作業', '地域の再建', '復興後'];
export const RECOVERY_NEEDS = { 1: { herb: 20, hp: 10 }, 2: { wood: 25, ore: 15, kill: 20 }, 3: { gold: 20000 } };
// ── 24 the fractured guild
export const FACTIONS = { trad: { name: '伝統派', desc: '冒険者の安全と新人支援を重視する', task: '新人支援：Lv30以下の魔物を10体倒し、回復薬を3つ寄付する' },
  reform: { name: '改革派', desc: '効率と収益、高難度の大規模案件を重視する', task: '大規模案件：ダンジョンのボスを1体倒す' },
  indep: { name: '独立派', desc: '各地域の自由な運営と冒険者の裁量を重視する', task: '地方巡回：異なる2都市の冒険者ギルドを訪ねる' } };
export const SOCIETY_HOSTS = { nx19: { name: '村の代表マルタ', city: 'elmgard', near: 'w_elmgard_inn' }, nx20: { name: '交易路監督官ガイウス', city: 'vermion', near: 'w_vermion_trade' }, nx21: { name: '国際仲裁官リュシアン', city: 'arcelia', near: 'w_arcelia_bank' },
  nx22: { name: '商業祭の告知人', city: 'vermion', near: 'w_vermion_bank' }, nx23: { name: '復興支援隊のハンナ', city: 'arcelia', near: 'w_arcelia_clinic' }, nx24: { name: 'ギルド評議会の書記', city: 'haven', near: 'h_guild' } };
