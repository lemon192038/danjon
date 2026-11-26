// PHASE 7 (part 2) data: special dungeons (not in the 12 regular dungeon lists), the Black Moon, the Sleeping Calamities.
export const SPECIAL_DUNGEONS = {
  sunken: { id: 'sunken', name: '沈没王国アトランティス', theme: 'sea', desc: '古代魔法装置の異常で海に沈んだ王国', minLv: 50, maxFloor: 60, underwater: true, deepFrom: 21, hidden: true,
    bands: [
      { name: '沈没港', layout: 'islands', pal: 'coral', fam: ['lizard', 'slime', 'elemIce'], gim: ['water'], boss: 'kraken', bossName: '王国の守護蟹' },
      { name: '市民街', layout: 'rooms', pal: 'wreck', fam: ['skeleton', 'lizard', 'mimic'], gim: ['water'], boss: 'knightLord', bossName: '沈没の大蛇' },
      { name: '王立図書館', layout: 'rooms', pal: 'temple', fam: ['wisp', 'mage', 'crystal'], gim: ['darkness'], boss: 'lich', bossName: '海底の書架守' },
      { name: '水晶研究所', layout: 'cave', pal: 'crystal', fam: ['crystal', 'construct', 'elemIce'], gim: ['current'], boss: 'golemKing', bossName: '王宮機械騎士' },
      { name: '王宮', layout: 'rooms', pal: 'temple', fam: ['knight', 'construct', 'lizard'], gim: ['current', 'traps'], boss: 'kraken', bossName: '深海幻灯魚の群王' },
      { name: '深海神殿', layout: 'arena', pal: 'abyssSea', fam: ['abyssal', 'shade', 'lizard'], gim: ['darkness', 'current'], boss: 'atlantis', bossName: '沈没王アトランティス' }] },
  luna: { id: 'luna', name: '月面領域ルナ・ヴェイル', theme: 'void', desc: '黒月の夜の果てに開く月面転移門の先', minLv: 70, maxFloor: 40, hidden: true,
    bands: [
      { name: '黒月の観測地ノクティス', layout: 'open', pal: 'void', fam: ['voidling', 'wisp', 'shade'], gim: ['darkness'], boss: 'voidEye', bossName: '黒月の眼' },
      { name: '月影の神殿セレネ・テンプル', layout: 'rooms', pal: 'temple', fam: ['angelFallen', 'mage', 'wisp'], gim: ['traps'], boss: 'seraph', bossName: '月影の巫女' },
      { name: '観測者の遺跡オブザーバトリー', layout: 'maze', pal: 'clock', fam: ['construct', 'voidling', 'crystal'], gim: ['darkness'], boss: 'timeWarden', bossName: '観測機構' },
      { name: '月の裏側ファーサイド', layout: 'arena', pal: 'void', fam: ['abyssal', 'voidling', 'shade'], gim: ['darkness'], boss: 'observer', bossName: '黒月の観測者・真影' }] },
};
// new boss archetypes used by these events: [key, name, sprite, abilities] (abilities from the existing boss AI)
export const EVENT_BOSSES = [['atlantis', '沈没王アトランティス', 'humanoid', ['tidal', 'tentacle', 'laser', 'summon']], ['observer', '黒月の観測者', 'eye', ['laser', 'gravity', 'predict', 'blink']],
  ['scorchDragon', '焦土の眠龍', 'dragon', ['breath', 'tailSweep', 'meteor', 'rage']], ['abyssWhale', '深海の巨鯨', 'beast', ['tidal', 'ink', 'slam']], ['forestBehemoth', '森羅の巨獣', 'beast', ['slam', 'charge', 'regrow', 'rage']], ['sandGiant', '砂塵の巨神', 'golem', ['quake', 'slam', 'laser']]];
export const BLACK_MOON = { devices: ['weissberg', 'tempest_ridge', 'atum', 'arcane_forge'], gateField: 'amatsukami', observerFields: ['frostvale', 'voltplain', 'endless_dune', 'ashland', 'crystal_reef', 'field_highland'], ruins: ['amatsukami', 'atum', 'arcane_forge', 'necropolis'] };
export const CALAMITIES = {
  scorch: { name: '焦土の眠龍', boss: 'scorchDragon', field: 'inferno_rift', lv: 110, el: 'fire', signs: ['周辺の魔物が火山から逃げ出している', '地鳴りと共に溶岩が噴き上がった', '近隣の街に「龍の寝息」を聞いたという報告が届いた', '焼け焦げた巨大な鱗が見つかる', '大地が裂け、眠龍が目を覚ました'] },
  whale: { name: '深海の巨鯨', boss: 'abyssWhale', field: 'abyssal_ocean', lv: 100, el: 'water', signs: ['沖の魚群が消えた', '海鳴りが続き、嵐が増えた', '漁師たちが「海が呼吸している」と噂している', '巨大な骨と鯨油の痕跡が浜に打ち上がる', '深海から巨鯨が浮上した'] },
  behemoth: { name: '森羅の巨獣', boss: 'forestBehemoth', field: 'yggdrasil_grove', lv: 95, el: 'earth', signs: ['森の獣が姿を消した', '大樹が揺れ、季節外れの花が咲く', 'エルフィリアの守人が異変を報告した', '巨大な足跡と苔むした角の欠片', '森羅の巨獣が目覚め、森が鳴動した'] },
  giant: { name: '砂塵の巨神', boss: 'sandGiant', field: 'endless_dune', lv: 105, el: 'earth', signs: ['砂海の魔物が北へ逃げている', '砂嵐が止まず、蜃気楼が乱れる', '隊商から「砂が立ち上がった」という報告', '石の巨腕の欠片が砂から突き出している', '砂塵の巨神が砂海から立ち上がった'] },
};
