// Awakening of the Machine God (new EVENT 05) and DEUS MACHINA (神機降臨, chapter 11): one chain. The awakening is a
// world-shared event (ancient sites start up, god-machines act by role, the control facility decides the world outcome);
// the descent is the personal culmination that opens the way to デウス・エクス・マギア. Builds on the Gravel buried
// facility (sl_facility) and the god-machine books of the Forbidden Archive.
export const MACHINA_SITES = {
  arcane_forge: { name: '炉心遺跡', role: 'fabricator', fam: 'construct' }, atum: { name: '星図の演算塔', role: 'watcher', fam: 'construct' },
  undersand: { name: '砂中の格納庫', role: 'guardian', fam: 'golem' }, glacial_grave: { name: '氷下の観測所', role: 'scout', fam: 'construct' },
  tempest_ridge: { name: '雷鳴の砲台', role: 'war', fam: 'golem' }, silent_trench: { name: '深海の中継局', role: 'scout', fam: 'construct' },
};
export const ROLES = {
  scout: { name: '探索型', desc: '地形と生物を記録して回る。人が近づくと距離を取る' }, guardian: { name: '防衛型', desc: '遺跡の中枢を守る。中枢に近づく者だけを迎え撃つ' },
  fabricator: { name: '生産型', desc: '遺跡の資材で部品を作り続ける。作った部品は遺跡の周りに置かれる' }, watcher: { name: '監視型', desc: '周囲を見張る。神機が攻撃されると全機に警報を出す' },
  war: { name: '戦闘型', desc: '遺跡の周囲を巡回し、侵入者と交戦する' }, overseer: { name: '管理型', desc: '全ての神機を統括する。制御施設の最奥にいる' },
};
export const MACHINA_DUNGEON = { id: 'machina', name: '神機制御施設', theme: 'machine', desc: '各地の神機を統括する古代の制御施設', minLv: 75, maxFloor: 30, hidden: true, bands: [
  { name: '外殻管制区画', layout: 'rooms', pal: 'metal', fam: ['construct', 'golem', 'crystal'], gim: ['laser', 'conveyor'], boss: 'golemKing', bossName: '外殻の守護機' },
  { name: '演算回廊', layout: 'maze', pal: 'circuit', fam: ['construct', 'voidling', 'mage'], gim: ['laser', 'echo'], boss: 'timeWarden', bossName: '演算回廊の管理端末' },
  { name: '中央演算室', layout: 'arena', pal: 'circuit', fam: ['construct', 'golem', 'voidling'], gim: ['laser'], boss: 'overseer', bossName: '管理型神機オーバーシア' }] };
export const MACHINA_BOSSES = [['overseer', '管理型神機オーバーシア', 'golem', ['laser', 'shield', 'summon', 'quake']], ['deusCore', '神機デウス', 'golem', ['laser', 'timeStop', 'summon', 'shield', 'meteor']]];
export const MECH_WT = [52, 69, 70]; // 魔導砲・魔導機械腕・ドリルランス (existing official types)
const T = text => ({ k: 'talk', text });
export const MACHINA_EVENTS = {
  nx05: { host: { name: '神機研究者イルマ', city: 'luminas', near: 'lu_g_magicresearch' }, needWorld: true, gate: 'machina', service: 'workshop', reward: { xp: 30000, gold: 10000, title: '神機の理解者', flag: 'machinist' }, steps: [
    T('「各地の古代遺跡が動き出したの。神機――古代神機文明の機械よ。暴れているわけじゃない。それぞれが“役目”を果たしているみたい」'),
    { k: 'sites', n: 3, text: '起動した遺跡を3か所調べ、神機の役割を記録する（遺跡の中枢を調べる）' },
    T('「記録が揃ったわ。探索、防衛、生産、監視、戦闘……全部を束ねる“管理型”がどこかにいる。制御施設の入口座標を割り出した」'),
    { k: 'floor', dungeon: 'machina', floor: 30, text: '神機制御施設（ここから入れる）の最奥で管理型神機と相対する' },
    { k: 'choice', text: '管理型神機の記録：「本機群ノ目的：文明ノ存続ヲ観測シ、必要ナラバ保護スル」。どうする？', options: [
      { id: 'stop', label: '神機を停止する', effect: '各地の神機は眠りにつき、遺跡に資材が残された', world: { machina: 'stopped' } },
      { id: 'control', label: '制御権を取り戻す', effect: '神機は人の指示を受けるようになり、遺跡の工房が使えるようになった', world: { machina: 'controlled' } },
      { id: 'cooperate', label: '神機と協力する', effect: '神機は人と並んで働き始め、生産型が部品を分けてくれるようになった', world: { machina: 'allied' } },
      { id: 'research', label: '技術を研究機関に提供する', effect: '神機の技術が学院に渡り、学術都市が潤った', world: { machina: 'researched', supply: { city: 'luminas', v: 0.15 } } },
      { id: 'watch', label: '神機の判断を尊重して見守る', effect: '神機は今も独自の判断で世界を見守っている', world: { machina: 'watched' } }] }] },
  lg_deus_machina: { host: { name: '神機研究者イルマ', city: 'luminas', near: 'lu_g_magicresearch' }, reward: { xp: 60000, title: '神機降臨を見届けた者' }, steps: [
    T('「管理型の記録の奥に、もう一つの名前があったの。“デウス”――全ての神機の原型。目覚めの日に、空から降りてくるって」'),
    { k: 'event', id: 'nx05', text: '神機の目覚めを見届ける（イベント「神機の目覚め」）' },
    { k: 'level', n: 110, text: '神機の原型に耐えられる力（Lv110）' },
    { k: 'gather', ref: 'machinePart', n: 10, text: 'デウスとの対話装置を組む：神機部品を10個集める' },
    { k: 'bossduel', boss: 'deusCore', name: '神機デウス', lv: 10, hp: 6, text: '降臨した神機デウスと相対する' },
    { k: 'choice', text: 'デウスの声が響く。「魔法ト機械ノ境界ヲ、汝ハ越エルカ」', options: [
      { id: 'fuse', label: '魔法と機械を一つにする道を選ぶ', effect: 'デウスは光となり、あなたの中で魔法と機械が一つになった', reward: { flag: 'deusFused' } },
      { id: 'seal', label: 'デウスを眠らせ、境界を守る', effect: 'デウスは再び空へ還った', reward: { flag: 'deusSealed' } }] }] },
};
