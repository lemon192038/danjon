// ABYSS : ETERNAL FRONTIER — Underground slum extraction system (data-driven).
// SlumRegion (one per city underworld) -> 4 SlumLayers (地下/地上/中層/屋上) generated from a fixed region skeleton
// + a per-run seed. Factions, loot, exits, events, hideout facilities are all defined here.
export const LAYERS = [
  { id: 0, key: 'under', name: '地下層', desc: '下水道・廃地下鉄・密輸路・遺跡', dark: 0.82, lootMul: 1.4, danger: 1, pal: 'sewer' },
  { id: 1, key: 'ground', name: '地上層', desc: '狭い路地・屋台・住居・廃棄物置き場', dark: 0.55, lootMul: 1.0, danger: 0, pal: 'slumground' },
  { id: 2, key: 'mid', name: '中層', desc: '違法な連絡通路・増築階段・吊り橋・隠れ市場', dark: 0.62, lootMul: 1.2, danger: 1, pal: 'slummid' },
  { id: 3, key: 'roof', name: '屋上層', desc: '屋上の物資置き場・飛空艇発着場・危険な足場', dark: 0.35, lootMul: 1.3, danger: 2, pal: 'slumroof' },
];
export const FACTIONS = {
  greyrats: { name: '灰鼠', guild: 'thieves', color: '#9a9aa8', trade: ['info', 'contraband'], hostileBelow: -20, desc: '貧民の互助を掲げる盗賊団。情報と盗品を扱う。' },
  blackrose: { name: '黒薔薇', guild: 'assassins', color: '#c02a5a', trade: ['contraband', 'artifact'], hostileBelow: 10, desc: 'ルクスガルドを牛耳る犯罪組織。縄張りに踏み込む者に容赦しない。' },
  seacats: { name: '海猫', guild: 'smugglers', color: '#3a8ac0', trade: ['goods', 'contraband'], hostileBelow: -10, desc: '密輸組織。地下水路と廃港を押さえている。' },
  miners: { name: '旧坑夫組合', guild: 'miners', color: '#c08a3a', trade: ['material', 'mech'], hostileBelow: -30, desc: '黒の日の生き残りたち。廃坑の奥で鉄と部品を掘り返す。' },
  heretics: { name: '禁呪信奉会', guild: 'hexers', color: '#8a4ad0', trade: ['artifact', 'arcane'], hostileBelow: 0, desc: '禁呪の復活を目論む異端の魔術師集団。' },
  dawn: { name: '夜明けの灯', guild: 'dawn', color: '#f0c050', trade: ['consumable', 'info'], hostileBelow: -50, desc: 'スラムに灯りを取り戻そうとする互助組織。' },
  scavs: { name: '屑拾い', guild: null, color: '#7a6a5a', trade: ['material'], hostileBelow: 999, desc: '縄張りを持たない漁り屋。誰にでも牙をむく。' },
};
// region = one extraction map per city underworld. tier = base danger (1 beginner .. 5 lethal). pvp from tier 3.
export const REGIONS = {
  haven_old: { city: 'haven', name: '旧市街の地下水路', tier: 1, factions: ['dawn', 'scavs'], bias: { material: 1.2 }, theme: 'stone', desc: '石垣の下に広がる古い水路。初心者向け。装備を失わない。' },
  marina_cats: { city: 'marina', name: '猫の小径と廃港地下', tier: 2, factions: ['seacats', 'greyrats', 'scavs'], bias: { goods: 1.3, contraband: 1.2 }, theme: 'harbor', desc: '密輸路が網の目のように走る港の裏側。' },
  celestia_lower: { city: 'celestia', name: '外壁下層区・旧地下街', tier: 3, factions: ['greyrats', 'dawn', 'scavs'], bias: { artifact: 1.2, info: 1.4 }, theme: 'old', desc: '取り壊しを待つ下層区の地下に、王朝以前の街が眠る。' },
  vulcan_mines: { city: 'vulcan', name: '旧坑道スラム・廃鉱脈', tier: 3, factions: ['miners', 'scavs', 'heretics'], bias: { mech: 1.4, material: 1.3 }, theme: 'mine', desc: '黒の日以来放棄された坑道。魔導機械の残骸が眠る。' },
  arcanum_forbidden: { city: 'arcanum', name: '禁呪跡地・地下研究棟', tier: 4, factions: ['heretics', 'scavs'], bias: { arcane: 1.5, artifact: 1.3 }, theme: 'arcane', desc: '五百年前の暴走で消えた研究区画。異常現象が頻発する。' },
  lumina_kowloon: { city: 'lumina', name: '旧炭鉱スラム「九層街」', tier: 5, factions: ['blackrose', 'greyrats', 'dawn', 'scavs'], bias: { contraband: 1.4, artifact: 1.2 }, theme: 'kowloon', desc: '増築に増築を重ねた九層の巨大違法建築。黒薔薇の本拠地。' },
};
// loot (SlumLootTable entries). w = weight(kg), v = base value, r = rarity 1..5, prov = default provenance,
// use = how it connects to existing systems (converts to existing materials / crafting / guild demand)
export const LOOT = {
  scrap: { name: '鉄屑', cat: 'material', r: 1, w: 2, v: 30, prov: 'slum', use: { ore: 0.34 } },
  wire: { name: '銅線の束', cat: 'material', r: 1, w: 1, v: 45, prov: 'slum', use: { ore: 0.2 } },
  cloth: { name: '古布', cat: 'material', r: 1, w: 1, v: 20, prov: 'slum', use: { hide: 0.5 } },
  herbbag: { name: '薬草の包み', cat: 'consumable', r: 1, w: 0.5, v: 35, prov: 'slum', use: { herb: 2 } },
  canned: { name: '保存食', cat: 'consumable', r: 1, w: 0.5, v: 40, prov: 'legal', use: { meal: 1 } },
  fuse: { name: '魔導ヒューズ', cat: 'mech', r: 2, w: 0.3, v: 160, prov: 'slum', key: 'subway', use: {} },
  gears: { name: '精密歯車', cat: 'mech', r: 2, w: 1, v: 140, prov: 'slum', use: { ore: 1 } },
  coil: { name: '魔導コイル', cat: 'mech', r: 3, w: 1.5, v: 420, prov: 'slum', use: { crystal: 1 } },
  core: { name: '魔導機関の核', cat: 'mech', r: 4, w: 3, v: 1600, prov: 'ruins', use: { crystal: 3 } },
  starsteel: { name: '高純度星鉄', cat: 'material', r: 3, w: 2, v: 600, prov: 'slum', use: { ore: 4 } },
  manashard: { name: '高純度魔晶', cat: 'arcane', r: 3, w: 0.5, v: 700, prov: 'slum', use: { crystal: 2 } },
  voidsalt: { name: '虚無の塩', cat: 'arcane', r: 4, w: 0.3, v: 1900, prov: 'ruins', use: { abyssShard: 0.3 } },
  parts: { name: '非合法武器部品', cat: 'contraband', r: 3, w: 1, v: 550, prov: 'illegal', use: { craft: 1 } },
  tuning: { name: '違法チューニングキット', cat: 'contraband', r: 4, w: 1, v: 1400, prov: 'illegal', use: { tune: 1 } },
  drugs: { name: '禁制の秘薬', cat: 'contraband', r: 2, w: 0.2, v: 300, prov: 'illegal', use: { atkTonic: 1 } },
  ledger: { name: '裏帳簿', cat: 'info', r: 3, w: 0.5, v: 900, prov: 'illegal', use: {} },
  letters: { name: '密書', cat: 'info', r: 2, w: 0.1, v: 350, prov: 'unknown', use: {} },
  map: { name: '旧市街の古地図', cat: 'info', r: 2, w: 0.2, v: 260, prov: 'unknown', use: { reveal: 1 } },
  coin: { name: '王朝以前の古銭', cat: 'artifact', r: 2, w: 0.1, v: 320, prov: 'ruins', use: {} },
  idol: { name: '古代の神像', cat: 'artifact', r: 3, w: 3, v: 1200, prov: 'ruins', use: { relic: 2 } },
  tablet: { name: '封印の石板', cat: 'artifact', r: 4, w: 4, v: 2800, prov: 'ruins', use: { relic: 4 } },
  keyshard: { name: '終焉の鍵の微片', cat: 'artifact', r: 5, w: 0.2, v: 9000, prov: 'ruins', use: { relic: 8, abyssShard: 1 } },
  painting: { name: '盗まれた名画', cat: 'art', r: 3, w: 2, v: 1500, prov: 'illegal', use: {} },
  vase: { name: '骨董の花瓶', cat: 'art', r: 2, w: 2, v: 500, prov: 'unknown', use: {} },
  jewel: { name: '宝石のブローチ', cat: 'art', r: 3, w: 0.1, v: 1100, prov: 'unknown', use: { gem: 2 } },
  goldbar: { name: '金の延べ棒', cat: 'art', r: 4, w: 1, v: 3500, prov: 'unknown', use: {} },
  exitkey: { name: '隠し扉の鍵', cat: 'material', r: 3, w: 0.1, v: 200, prov: 'slum', key: 'hidden', use: {} },
  medkit: { name: '応急キット', cat: 'consumable', r: 2, w: 0.5, v: 120, prov: 'legal', use: { hp: 2 } },
  guildbox: { name: '封印された依頼品', cat: 'guild', r: 3, w: 2, v: 800, prov: 'slum', use: {} },
  deed: { name: '隠し物件の権利書', cat: 'info', r: 4, w: 0.1, v: 3000, prov: 'unknown', use: { deed: 1 } },
};
export const LOOT_CAT = { material: '一般素材', mech: '魔導機械部品', arcane: '高純度魔導素材', contraband: '非合法品', info: '情報資料', artifact: '古代の遺物', art: '美術品・骨董', consumable: '消耗品', guild: 'ギルド依頼品', goods: '交易品' };
export const PROV = { legal: '正規流通品', slum: 'スラムで発見', ruins: '遺跡由来', illegal: '非合法取引品', unknown: '出所不明', laundered: '鑑定済み' };
// containers placed in layers; layer bias toward categories
export const CONTAINERS = {
  crate: { name: '木箱', time: 1200, rolls: 2, cats: ['material', 'consumable', 'mech'] }, locker: { name: 'ロッカー', time: 1500, rolls: 2, cats: ['consumable', 'contraband', 'info'] },
  safe: { name: '金庫', time: 3000, rolls: 3, cats: ['art', 'info', 'contraband'], minR: 2 }, corpse: { name: '倒れた探索者', time: 1800, rolls: 2, cats: ['material', 'mech', 'consumable', 'info'] },
  relic: { name: '遺跡の祭壇', time: 3500, rolls: 2, cats: ['artifact', 'arcane'], minR: 2 }, cargo: { name: '密輸コンテナ', time: 2500, rolls: 3, cats: ['contraband', 'goods', 'mech'] },
  trash: { name: 'ゴミ山', time: 900, rolls: 1, cats: ['material'] }, desk: { name: '研究机', time: 2000, rolls: 2, cats: ['info', 'arcane'] },
};
export const LAYER_CONTAINERS = [['corpse', 'cargo', 'relic', 'trash', 'crate'], ['crate', 'trash', 'locker', 'corpse'], ['locker', 'safe', 'crate', 'desk'], ['cargo', 'safe', 'crate']];
// SlumExitPoint types. cond: null (always) | pay | night | item | timed | power | rep
export const EXITS = {
  sewer: { name: '地下下水道の排水口', layer: 0, cond: null }, subway: { name: '放棄された地下鉄駅', layer: 0, cond: 'power', desc: '魔導ヒューズを配電盤に挿すと電車が動く' },
  smuggle: { name: '密輸用通路', layer: 0, cond: 'pay', fee: 800, desc: '密輸業者に通行料を払う' }, port: { name: '廃港の小舟', layer: 1, cond: 'night', desc: '夜（19〜5時）だけ小舟が出る' },
  checkpoint: { name: '非合法な関所', layer: 1, cond: 'rep', desc: '支配勢力と良好な関係なら通れる（または賄賂1,500G）', fee: 1500 },
  airship: { name: '屋上の飛空艇発着場', layer: 3, cond: 'timed', desc: '数分おきに飛空艇が短時間だけ着陸する' }, hidden: { name: '隠し出口', layer: 2, cond: 'item', item: 'exitkey', desc: '隠し扉の鍵が必要' },
  stairs: { name: '地上への非常階段', layer: 1, cond: null },
};
// per-run events (SlumEvent): applied at instance creation; each has real effects on generation/NPCs/trade/exits
export const EVENTS = {
  convoy: { name: '物資輸送隊の通過', desc: '運び屋の一団が貨物コンテナを運んでいる。襲えば戦利品、見逃せば勢力の評判が上がる。' },
  popup: { name: '臨時の闇店舗', desc: '流れの商人が臨時店舗を開いている。スラム内で売買できる。' },
  sealed: { name: '区画封鎖', desc: '一部の区画が封鎖され通れない。別の道を探せ。' },
  tunnel: { name: '旧地下通路の開放', desc: '古い地下通路が開き、追加の連絡路と脱出口が使える。' },
  relicfind: { name: '希少遺物の発見', desc: '奥地で遺物が見つかったらしい。守衛に守られた祭壇がある。' },
  occupation: { name: '勢力の区域占拠', desc: '支配勢力が区域を占拠し、構成員が巡回している。' },
  merchant: { name: '移動商人', desc: '物々交換に応じる移動商人が徘徊している。' },
  client: { name: '依頼人の出現', desc: '特殊な依頼を持つ人物がいる。条件を満たして脱出すれば高額報酬。' },
  anomaly: { name: '異常現象', desc: '空間が歪み危険だが、魔晶や虚無の塩が湧き出ている。' },
  blackout: { name: '停電', desc: '照明が落ちて視界が悪い。代わりに警備が手薄になる。' },
};
// hideout (PlayerHideout / HideoutRoom / HideoutFacility)
export const HIDEOUT_LEVELS = [
  { name: '物置部屋', size: [10, 8], rooms: 1, slots: 3, storage: 30, cost: { gold: 0 } },
  { name: '改装した倉庫', size: [14, 10], rooms: 2, slots: 5, storage: 60, cost: { gold: 8000, scrap: 10, wire: 5 } },
  { name: '地下アジト', size: [18, 12], rooms: 3, slots: 7, storage: 100, cost: { gold: 30000, gears: 6, starsteel: 3 } },
  { name: '要塞化した拠点', size: [22, 14], rooms: 4, slots: 9, storage: 150, cost: { gold: 90000, coil: 5, starsteel: 6 } },
  { name: '九層の隠し城', size: [26, 16], rooms: 5, slots: 12, storage: 220, cost: { gold: 250000, core: 2, tablet: 1 } },
];
export const FACILITIES = {
  workbench: { name: '作業台', cost: { gold: 1500, scrap: 5 }, desc: '戦利品を素材に変換・分解する' },
  forge: { name: '闇鍛冶炉', cost: { gold: 6000, starsteel: 2, scrap: 10 }, desc: '非合法武器部品で武具を鍛造（レアリティ保証）' },
  alchemy: { name: '錬金台', cost: { gold: 4000, manashard: 1 }, desc: '薬草や魔晶から消耗品を作る' },
  terminal: { name: '情報端末', cost: { gold: 5000, coil: 1, wire: 4 }, desc: '闇市相場と次回探索の兆候を閲覧' },
  maptable: { name: '地図管理台', cost: { gold: 2500, map: 1 }, desc: '探索地図を記録し固定区画を常に表示' },
  display: { name: '武具展示棚', cost: { gold: 1200 }, desc: '武具やトロフィーを飾る' },
  rest: { name: '休憩スペース', cost: { gold: 1000, cloth: 4 }, desc: '休んで回復・経験値ボーナス' },
  fence: { name: '商人用スペース', cost: { gold: 8000, ledger: 1 }, desc: '故買屋が訪れ戦利品を買い取る（出所を問わない）' },
  lab: { name: '遺物研究室', cost: { gold: 20000, idol: 1, manashard: 2 }, desc: '遺物を研究して経験値と熟練度を得る' },
  stash: { name: '隠し収納', cost: { gold: 6000, gears: 2 }, desc: '襲撃でも奪われない保管枠（20）' },
  security: { name: '警備設備', cost: { gold: 4000, wire: 6, gears: 2 }, desc: '発覚リスクを下げる（段階強化可）' },
};
export const RAID_MINUTES = 25;
export const EXTRACT_SECONDS = 8;
export const BASE_CAPACITY = 30; // kg
export const FACTION_FAMS = { greyrats: ['thug', 'scav'], blackrose: ['gunman', 'enforcer'], seacats: ['thug', 'scav'], miners: ['enforcer', 'thug'], heretics: ['heretic'], dawn: ['thug'], scavs: ['scav', 'thug'] };
export const TIER_LV = [0, 6, 20, 38, 58, 80];
// job-role bonuses in the slum (connects the 1,000-job system via role keys)
export const ROLE_BONUS = { thief: { search: 0.6, cap: 5 }, scout: { search: 0.7 }, assassin: { search: 0.75 }, ninja: { search: 0.7 }, hunter: { search: 0.85, cap: 5 }, merchant: { sell: 1.1, buy: 0.95 }, scholar: { appraise: 0.5 }, astrologer: { appraise: 0.6 }, machinist: { craft: 1 }, alchemist: { craft: 1 }, wanderer: { cap: 10 }, warrior: { cap: 5 }, guardian: { cap: 8 }, berserker: { cap: 5 }, pirate: { sell: 1.05, cap: 5 } };
