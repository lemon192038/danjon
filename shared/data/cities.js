import { NEW_CITIES } from './worldcities.js';
// ABYSS : ETERNAL FRONTIER — City definitions (data-driven). Every city: lore, districts, buildings, landmark, climate, economy.
// District types: rich / commerce / common / slum / special. Building `t` = interior template key (server/game/interiors.js).
// Building `svc` = service opened by the NPC at the counter. `hours` = [open, close] in game hours (omit = 24h).
const B = (id, name, t, size, o = {}) => ({ id, name, t, size, ...o });

export const CITIES = {
  haven: {
    name: '始まりの街ヘイヴン', title: '辺境開拓の玄関口', size: [88, 66], pal: 'town', landmark: { k: 'windmill', name: '開拓者の大風車', district: 'commerce' },
    founded: '開拓暦12年', history: [
      '深淵大陸の発見後、最初の開拓団が築いた砦が起源。大風車は開拓団長エルドが風の精霊と契約して建てたと伝わる。',
      '開拓暦80年の「翠緑の古洞」魔物溢れでは砦の半分が焼失し、現在の旧市街の石垣だけが当時の名残として残る。',
      '王都が冒険者の育成拠点に指定してから人口が三倍に増え、新米冒険者と彼らを相手にする商人の町になった。'],
    origin: '大陸開拓の前線基地として、ダンジョン群に最も近い安全な丘に築かれた。', geography: '緩やかな丘陵と草原。東に翠風の平原が広がる。', climate: '温暖。春風が強い。',
    architecture: '木骨造の素朴な家屋と石垣。屋根は赤・青の瓦。', industry: ['冒険者向け商売', '農業', '製粉'], economy: '冒険者の落とす金で回る小規模経済。物価は安い。',
    politics: '開拓者評議会（町長は選挙制）', ruler: '町長グレタ・ハーヴィル', security: 4, classes: '貧富の差は小さい。旧市街の石垣沿いに日雇い労働者の長屋がある。',
    culture: '新しい冒険者を祝う「門出の祭」が年に一度開かれる。', lifestyle: '日の出とともに働き、夕方には酒場で冒険談に花を咲かせる。',
    weather: { clear: 5, cloud: 3, rain: 2, wind: 2 }, fields: ['field_green'], monsters: ['スライム', '巨大鼠', 'ゴブリン'],
    districts: [
      { id: 'commerce', name: '風車広場', type: 'commerce', at: [0.5, 0.35], buildings: [
        B('h_guild', '冒険者ギルド ヘイヴン支部', 'guildhall', 'L', { svc: 'quest', guild: 'adventurers' }), B('h_weapon', 'ブランドン武具店', 'shop', 'M', { svc: 'weapon', hours: [7, 20] }),
        B('h_item', 'ハーブと道具の店', 'shop', 'S', { svc: 'item', hours: [6, 22] }), B('h_gate', 'ダンジョン案内所', 'office', 'S', { svc: 'gate' }), B('h_station', '乗合馬車の停留所', 'station', 'S', { svc: 'travel' })] },
      { id: 'common', name: '石垣通り', type: 'common', at: [0.3, 0.72], buildings: [
        B('h_inn', '宿屋「黄金の麦穂」', 'inn', 'M', { svc: 'inn' }), B('h_tavern', '酒場「最初の一杯」', 'tavern', 'M', { hours: [11, 3] }), B('h_smith', '鍛冶屋ドワイト', 'smithy', 'M', { svc: 'smith', hours: [7, 19] }),
        B('h_armor', '防具工房マルタ', 'shop', 'S', { svc: 'armor', hours: [8, 19] }), B('h_job', '職業ギルド 出張所', 'guildhall', 'M', { svc: 'guild' }), B('h_realty', '開拓地不動産', 'office', 'S', { svc: 'realty', hours: [8, 18] })] },
      { id: 'old', name: '旧市街の長屋', type: 'slum', at: [0.75, 0.72], buildings: [B('haven_under', 'スラム深部への入口', 'shack', 'M', { svc: 'slum', region: 'haven_old' }), B('h_clinic', '診療所', 'clinic', 'S', { svc: 'inn' }), B('h_shrine', '風の祠', 'church', 'S', { lore: 'haven_shrine' })] },
    ],
    events: ['門出の祭（新米冒険者の経験値+20%）', '風車の点検日（製粉所の依頼が増える）'],
    goods: { produce: ['wheat'], demand: ['ore', 'spice'] }, wealth: { commerce: 2, common: 2, old: 1 },
  },
  marina: {
    name: '交易港湾都市マリナ', title: '七つの海の十字路', size: [110, 84], pal: 'town', sea: 'south', landmark: { k: 'lighthouse', name: '大灯台「導きの炎」', district: 'port' },
    founded: '海運暦前140年', history: [
      '漁村マリナは、深海神殿から流れ出る「蒼潮」によって魚が豊富に獲れることで栄えた。',
      '120年前、商人王ヴェルディが大灯台を建て、嵐の海でも夜間入港を可能にしたことで世界の交易船が集まるようになった。',
      '30年前の「黒潮戦争」で私掠船団を退けた際、海運会社が自警艦隊を組織。以来、市政は海運会社連合が握っている。',
      '関税の重さに耐えかねた小商人たちが密輸に走り、倉庫街の裏路地には密輸組織「海猫」の根城ができた。'],
    origin: '深海から湧く暖流が作る天然の良港に漁村が生まれた。', geography: '南が海。湾に沿って港と倉庫街、丘の上に商人の邸宅。', climate: '温暖湿潤。夏は嵐が多く、朝は海霧が出る。',
    architecture: '白い漆喰壁と青い屋根、港には煉瓦造りの倉庫群。', industry: ['海上交易', '造船', '漁業', '海洋研究'], economy: '世界一の物流量。関税収入で潤う一方、港湾労働者の賃金は低い。',
    politics: '海運会社連合による寡頭制（評議会議長＝最大海運会社社長）', ruler: '議長イザベラ・ヴェルディ', security: 3,
    classes: '丘の上の商人層と、倉庫街の港湾労働者層に二分。関税に苦しむ小商人の一部は密輸に関わる。',
    culture: '船乗りの迷信と海神信仰。出港前に灯台へ祈りを捧げる習慣がある。', lifestyle: '夜明け前に漁船が出て、昼は荷揚げ、夜は船員酒場が満員になる。',
    weather: { clear: 4, cloud: 3, rain: 3, fog: 3, storm: 1 }, fields: ['field_green', 'field_coast'], monsters: ['リザードマン', 'クラーケンの幼体', 'ハーピー'],
    districts: [
      { id: 'hill', name: '潮見の丘（商人邸宅街）', type: 'rich', at: [0.25, 0.22], buildings: [
        B('m_hotel', 'グランドホテル・マリーナ', 'hotel', 'L', { svc: 'inn' }), B('m_mansion', 'ヴェルディ家の邸宅', 'mansion', 'L', { story: 'marina' }), B('m_jewel', '宝石商ギルド本部', 'shop', 'M', { guild: 'jewelers', hours: [10, 19] }),
        B('m_realty', 'マリナ不動産商会', 'office', 'S', { svc: 'realty', hours: [9, 18] })] },
      { id: 'market', name: '中央市場と商館通り', type: 'commerce', at: [0.6, 0.35], buildings: [
        B('m_merchant', '商人ギルド本部', 'guildhall', 'L', { guild: 'merchants' }), B('m_trade', '貿易商ギルド', 'office', 'M', { guild: 'traders', svc: 'trade' }), B('m_bank', 'マリナ海洋銀行', 'bank', 'M', { svc: 'bank', hours: [9, 17] }),
        B('m_weapon', '舶来武具店', 'shop', 'M', { svc: 'weapon', hours: [8, 21] }), B('m_item', '市場の道具屋', 'shop', 'S', { svc: 'item' }), B('m_guild', '冒険者ギルド マリナ支部', 'guildhall', 'M', { svc: 'quest', guild: 'adventurers' }),
        B('m_job', '職業ギルド マリナ支部', 'guildhall', 'M', { svc: 'guild' }), B('m_appraise', '鑑定士ギルド', 'office', 'S', { guild: 'appraisers' })] },
      { id: 'port', name: '大港と倉庫街', type: 'common', at: [0.55, 0.78], buildings: [
        B('m_port', '海運会社ターミナル', 'station', 'L', { svc: 'travel', guild: 'shipping' }), B('m_tavern', '船員酒場「錨亭」', 'tavern', 'M', { hours: [10, 4] }), B('m_sailor', '船乗りギルド', 'guildhall', 'M', { guild: 'sailors' }),
        B('m_research', '海洋研究所', 'lab', 'M', { guild: 'beastlore', hours: [8, 18] }), B('m_smith', '造船所の鍛冶場', 'smithy', 'M', { svc: 'smith', hours: [6, 18] }), B('m_armor', '船具と防具の店', 'shop', 'S', { svc: 'armor', hours: [7, 20] }),
        B('m_warehouse', '第三倉庫', 'warehouse', 'L', { guild: 'transport' }), B('m_inn', '港の安宿', 'inn', 'S', { svc: 'inn' })] },
      { id: 'alley', name: '裏路地「猫の小径」', type: 'slum', at: [0.88, 0.62], buildings: [B('marina_under', 'スラム深部への入口', 'shack', 'M', { svc: 'slum', region: 'marina_cats' }), 
        B('m_smuggle', '密輸組織「海猫」のアジト', 'blackmarket', 'M', { guild: 'smugglers', hours: [20, 5], svc: 'blackmarket' }), B('m_info', '情報屋の小部屋', 'shack', 'S', { guild: 'infobrokers', svc: 'info' })] },
    ],
    events: ['大商船団の入港（交易品の価格が変動）', '灯台祭（夜に花火）', '嵐の夜（出航停止・酒場が満員）'],
    goods: { produce: ['spice', 'fish', 'silk'], demand: ['ore', 'wine'] }, wealth: { hill: 4, market: 3, port: 2, alley: 1 },
  },
  celestia: {
    name: '王都セレスティア', title: '天空を戴く王都', size: [120, 92], pal: 'town', landmark: { k: 'castle', name: '天空王城セレスティア', district: 'castle' },
    founded: '王暦元年', history: [
      '天空の浮遊遺跡から墜ちた「天の礎石」の上に初代王アウレリウスが城を築いたのが始まり。礎石は今も王城の地下で光を放つ。',
      '三百年前の「大継承戦争」で王家が二つに割れ、勝利したセレス家が現王朝となった。敗れた分家は今も貴族院で影響力を持つ。',
      '王立騎士団の創設と街道整備で大陸全土の行政の中心となり、冒険者ギルド本部もここに置かれた。',
      '近年、王の病で摂政派と王女派の対立が激化し、貴族街では毒殺の噂が絶えない。下層区は再開発の名目で取り壊しが進む。'],
    origin: '天から墜ちた魔力の礎石を守るため、王が城を築き人が集った。', geography: '北の高台に王城、中央に大聖堂と行政区、南に市民街、外壁の外に下層区。', climate: '冷涼で晴天が多い。冬は雪。',
    architecture: '白大理石と金装飾の荘厳な建築。下層区は煤けた木造長屋。', industry: ['行政', '商業', '金融', '学術'], economy: '大陸最大の消費地。物価は高いが職も多い。',
    politics: '絶対王政＋貴族院（実権は摂政と貴族院）', ruler: '国王アウレリウス七世（病床）／摂政ロデリック公', security: 5,
    classes: '貴族・高位聖職者・大商人が上層、職人と市民が中層、外壁外の下層区には地方から流れてきた貧民が暮らす。',
    culture: '宮廷文化と騎士道。大聖堂の鐘が時を告げる。', lifestyle: '鐘の音で一日が動く。貴族は午後に茶会、市民は夜に広場の大道芸を楽しむ。',
    weather: { clear: 6, cloud: 3, snow: 2, rain: 1 }, fields: ['field_highland'], monsters: ['堕天使', '古代機兵', 'ハーピー'],
    districts: [
      { id: 'castle', name: '王城と貴族街', type: 'rich', at: [0.5, 0.18], buildings: [
        B('c_castle', '王城・謁見の間', 'castlehall', 'XL', { story: 'celestia' }), B('c_knights', '王立騎士団本部', 'guildhall', 'L', { guild: 'knights' }), B('c_noble', '貴族ロデリック公の邸宅', 'mansion', 'L'),
        B('c_museum', '王立美術館', 'museum', 'L', { hours: [9, 18], lore: 'celestia_museum' }), B('c_boutique', '仕立屋「銀糸」', 'shop', 'M', { guild: 'tailors', svc: 'outfit', hours: [10, 19] })] },
      { id: 'center', name: '大聖堂区と行政街', type: 'commerce', at: [0.5, 0.48], buildings: [
        B('c_cathedral', 'セレスティア大聖堂', 'church', 'XL', { svc: 'inn', lore: 'celestia_cathedral', guild: 'physicians' }), B('c_library', '王立図書館', 'library', 'L', { guild: 'sages', lore: 'celestia_library' }),
        B('c_advguild', '冒険者ギルド本部', 'guildhall', 'XL', { svc: 'quest', guild: 'adventurers' }), B('c_bank', '王立中央銀行', 'bank', 'L', { svc: 'bank', guild: 'finance', hours: [9, 17] }),
        B('c_job', '職業ギルド本部', 'guildhall', 'L', { svc: 'guild' }), B('c_weapon', '王室御用達武具店', 'shop', 'M', { svc: 'weapon', hours: [9, 20] }), B('c_gate', '王立ダンジョン管理局', 'office', 'M', { svc: 'gate' }),
        B('c_station', '王都飛空艇発着場', 'station', 'L', { svc: 'travel' }), B('c_auction', 'オークションハウス', 'theater', 'M', { guild: 'auction', hours: [12, 22] })] },
      { id: 'citizen', name: '市民街', type: 'common', at: [0.3, 0.75], buildings: [
        B('c_inn', '宿屋「白鳩亭」', 'inn', 'M', { svc: 'inn' }), B('c_tavern', '大衆酒場「騎士の休息」', 'tavern', 'M', { hours: [11, 2] }), B('c_smith', '王都鍛冶組合', 'smithy', 'M', { svc: 'smith', guild: 'smiths', hours: [7, 19] }),
        B('c_armor', '防具職人組合', 'shop', 'M', { svc: 'armor', guild: 'armorers', hours: [8, 19] }), B('c_item', '市民市場の道具屋', 'shop', 'S', { svc: 'item' }), B('c_bath', '公衆浴場', 'bathhouse', 'M', { svc: 'inn', hours: [6, 24] }),
        B('c_realty', '王都不動産', 'office', 'S', { svc: 'realty', hours: [9, 18] }), B('c_arena', '王立闘技場', 'arena', 'L', { guild: 'gladiators', svc: 'arena', hours: [10, 22] })] },
      { id: 'lower', name: '外壁下層区', type: 'slum', at: [0.8, 0.82], buildings: [B('c_clockshop', '時計屋の工房', 'shack', 'S', { hours: [0, 3] }), B('celestia_under', 'スラム深部への入口', 'shack', 'M', { svc: 'slum', region: 'celestia_lower' }), 
        B('c_shack', '取り壊し予定の長屋', 'shack', 'S', { lore: 'celestia_lower' }), B('c_thieves', '盗賊ギルド「灰鼠」', 'blackmarket', 'M', { guild: 'thieves', hours: [19, 5], svc: 'blackmarket' }),
        B('c_bounty', '賞金稼ぎ組合', 'tavern', 'S', { guild: 'bounty' })] },
    ],
    events: ['王家の祝典（王城の一部が一般公開）', '騎士団の閲兵式', '下層区の取り壊し抗議'],
    goods: { produce: ['silk', 'book'], demand: ['spice', 'wine', 'crystal', 'fish'] }, wealth: { castle: 5, center: 4, citizen: 2, lower: 1 },
  },
  vulcan: {
    name: '鉄鋼都市ヴァルカンブルク', title: '炎と鉄の都', size: [110, 84], pal: 'industrial', landmark: { k: 'forge', name: '大溶鉱炉「ヴァルカンの心臓」', district: 'works' },
    founded: '鉄暦元年', history: [
      'ドワーフの採掘者たちが霧の高原東の山脈で「星鉄」の鉱脈を発見し、坑夫の町を開いた。',
      '百年前、魔導技師ヘルガが大溶鉱炉を完成させ、星鉄を大量精錬できるようになって世界の武具の七割がここで作られるようになった。',
      '二十年前の落盤事故「黒の日」で坑夫三百人が犠牲に。補償を拒んだ鉱山会社への怒りから職人組合が力を持ち、現在は組合と会社の二重支配。',
      '主鉱脈の枯渇が近いという噂があり、深層採掘を巡って安全派と増産派が対立している。'],
    origin: '星鉄の鉱脈の上にドワーフの採掘キャンプが築かれた。', geography: '山脈の谷間。北に鉱山、中央に溶鉱炉と工房、南に労働者街。煙突と蒸気管が街を這う。', climate: '乾燥。煤と蒸気で空はいつも霞んでいる。',
    architecture: '黒煉瓦と鉄骨、銅の配管。上流区だけが白い石造り。', industry: ['採掘', '製錬', '鍛冶', '魔導機械'], economy: '武具の輸出で巨額の富。利益は鉱山会社と工房主に集中。',
    politics: '鉱山会社と職人組合の二重支配（市長は組合推薦）', ruler: '鉱山会社総裁ボルグ／組合長ヘルガ二世', security: 3,
    classes: '工房主と技術者の上層、熟練職人の中層、坑夫と日雇いの下層。坑夫の寿命は短い。', culture: '腕前がすべて。名工の打った武具は家宝として受け継がれる。',
    lifestyle: '三交代制で溶鉱炉は眠らない。終業の汽笛とともに坑夫酒場が開く。', weather: { clear: 3, cloud: 3, smog: 4, wind: 1, snow: 1 }, fields: ['field_mine'], monsters: ['ゴーレム', '古代機兵', '炎の精霊'],
    districts: [
      { id: 'upper', name: '技師街', type: 'rich', at: [0.75, 0.25], buildings: [
        B('v_magitech', '魔導具職人ギルド', 'workshop', 'L', { guild: 'magitech', hours: [8, 20] }), B('v_premium', '名工の武具ギャラリー', 'shop', 'M', { svc: 'weapon', hours: [10, 20] }), B('v_company', '鉱山会社本社', 'office', 'L', { story: 'vulcan' }),
        B('v_realty', '鉄鋼不動産', 'office', 'S', { svc: 'realty', hours: [9, 18] })] },
      { id: 'works', name: '大溶鉱炉と工房街', type: 'commerce', at: [0.45, 0.45], buildings: [
        B('v_smithguild', '鍛冶師ギルド本部', 'smithy', 'XL', { svc: 'smith', guild: 'smiths' }), B('v_armor', '防具職人ギルド本部', 'workshop', 'L', { svc: 'armor', guild: 'armorers' }),
        B('v_jeweler', '宝飾師ギルド', 'workshop', 'M', { guild: 'jewelcrafters', hours: [9, 19] }), B('v_carpenter', '木工職人ギルド', 'workshop', 'M', { guild: 'woodworkers', hours: [7, 18] }), B('v_architect', '建築士ギルド', 'office', 'M', { guild: 'architects', hours: [8, 18] }),
        B('v_guild', '冒険者ギルド ヴァルカン支部', 'guildhall', 'M', { svc: 'quest', guild: 'adventurers' }), B('v_job', '職業ギルド 鉄鋼支部', 'guildhall', 'M', { svc: 'guild' }), B('v_station', '貨物鉄道駅', 'station', 'L', { svc: 'travel', guild: 'transport' })] },
      { id: 'workers', name: '労働者街', type: 'common', at: [0.3, 0.78], buildings: [
        B('v_tavern', '坑夫酒場「黒い金床」', 'tavern', 'M', { hours: [14, 4] }), B('v_inn', '労働者の宿', 'inn', 'M', { svc: 'inn' }), B('v_item', '組合購買部', 'shop', 'S', { svc: 'item' }),
        B('v_miners', '採掘師ギルド', 'guildhall', 'M', { guild: 'miners' }), B('v_clinic', '坑夫診療所', 'clinic', 'S', { svc: 'inn', guild: 'physicians' }), B('v_memorial', '「黒の日」慰霊碑の礼拝所', 'church', 'S', { lore: 'vulcan_memorial' })] },
      { id: 'mines', name: '旧坑道スラム', type: 'slum', at: [0.15, 0.25], buildings: [B('vulcan_under', 'スラム深部への入口', 'shack', 'M', { svc: 'slum', region: 'vulcan_mines' }), 
        B('v_scrap', 'くず鉄市', 'blackmarket', 'M', { svc: 'blackmarket', guild: 'blackmarket', hours: [18, 6] }), B('v_shack', '坑夫の長屋', 'shack', 'S', { lore: 'vulcan_shack' })] },
    ],
    events: ['溶鉱炉の大火入れ（鍛冶の成功率上昇）', '新鉱脈の発見（鉱石が安くなる）', '坑夫のストライキ'],
    goods: { produce: ['ore', 'steel'], demand: ['wheat', 'fish', 'wine'] }, wealth: { upper: 4, works: 3, workers: 2, mines: 1 },
  },
  arcanum: {
    name: '魔導学術都市アルカナリア', title: '叡智の湖上都市', size: [110, 84], pal: 'arcane', lake: true, landmark: { k: 'magetower', name: '星詠みの大魔導塔', district: 'academy' },
    founded: '叡智暦元年', history: [
      '霧の高原の西、魔力が湧き出す「月鏡湖」の島に、古代文明の観測塔の遺跡があった。賢者ミネルヴァがそれを修復し学院を開いたのが始まり。',
      '五百年前の「禁呪暴走事件」で東区画が消滅し、今も立入禁止の魔法実験区域として残っている。',
      '学院は王国から自治権を得て、知識の自由を掲げる学術共和国となった。各国の魔術師が集い、魔導具の輸出で栄える。',
      '最近、古代遺跡から出土した「終焉の鍵」の欠片の研究を巡り、開示派と封印派の教授が激しく対立している。'],
    origin: '魔力の湧く湖と古代の観測塔を求めて学者が集まった。', geography: '湖の中央島に大魔導塔と学院、周囲の岸辺に研究区と市場、橋で結ばれる。', climate: '霧が多く、夜は湖面に魔力のオーロラが出る。',
    architecture: '青い石材と水晶の尖塔。浮遊する灯りが道を照らす。', industry: ['魔法研究', '魔導具', '錬金術', '古代遺物'], economy: '研究費と魔導具輸出。学生街は貧しいが活気がある。',
    politics: '学術共和制（七賢議会。議長は学院長）', ruler: '学院長オルフェ・ミネルヴァ', security: 4,
    classes: '教授と大魔導師が上層、研究員と職人が中層、貧乏学生と失敗した魔術師が下層に暮らす。', culture: '知識こそ力。論文の発表会は祭りのように盛り上がる。',
    lifestyle: '夜型の住民が多い。深夜まで研究室の灯りが消えない。', weather: { clear: 3, fog: 4, rain: 2, aurora: 2 }, fields: ['field_lake'], monsters: ['ウィスプ', '魔術師の亡霊', '虚無の落とし子'],
    districts: [
      { id: 'academy', name: '学院島', type: 'rich', at: [0.5, 0.4], buildings: [
        B('a_academy', '魔法学院本館', 'academy', 'XL', { guild: 'mages', story: 'arcanum' }), B('a_library', '大図書館アストラルム', 'library', 'XL', { guild: 'sages', lore: 'arcanum_library' }),
        B('a_observatory', '星辰観測所', 'observatory', 'M', { guild: 'astrologers', hours: [18, 6] }), B('a_lab', '魔法研究所', 'lab', 'L', { guild: 'magicresearch' })] },
      { id: 'market', name: '魔法市場', type: 'commerce', at: [0.25, 0.65], buildings: [
        B('a_magitools', '魔導具専門店', 'shop', 'M', { svc: 'weapon', hours: [9, 22] }), B('a_alchemy', '錬金術師ギルド工房', 'lab', 'M', { guild: 'alchemists', svc: 'item' }), B('a_guild', '冒険者ギルド 学院支部', 'guildhall', 'M', { svc: 'quest', guild: 'adventurers' }),
        B('a_job', '職業ギルド 学院支部', 'guildhall', 'M', { svc: 'guild' }), B('a_summon', '召喚術師ギルド', 'church', 'M', { guild: 'summoners' }), B('a_station', '浮遊ゴンドラ発着場', 'station', 'M', { svc: 'travel' }),
        B('a_realty', '学院住宅課', 'office', 'S', { svc: 'realty', hours: [9, 18] }), B('a_armor', '護符と法衣の店', 'shop', 'S', { svc: 'armor', hours: [9, 21] })] },
      { id: 'student', name: '学生街', type: 'common', at: [0.75, 0.72], buildings: [
        B('a_tavern', '学生酒場「三つの瓶」', 'tavern', 'M', { hours: [16, 4] }), B('a_inn', '下宿屋「月見草」', 'inn', 'S', { svc: 'inn' }), B('a_smith', '魔導鍛冶工房', 'smithy', 'M', { svc: 'smith', hours: [8, 20] }),
        B('a_ruins', '古代文明研究ギルド', 'museum', 'M', { guild: 'ancients', lore: 'arcanum_ruins' }), B('a_herb', '調合師ギルド', 'lab', 'S', { guild: 'apothecaries' })] },
      { id: 'forbidden', name: '禁呪跡地', type: 'slum', at: [0.85, 0.22], buildings: [B('arcanum_under', 'スラム深部への入口', 'shack', 'M', { svc: 'slum', region: 'arcanum_forbidden' }), B('a_hex', '呪術師ギルドの隠れ家', 'blackmarket', 'S', { guild: 'hexers', svc: 'blackmarket', hours: [21, 5] }), B('a_ruinshack', '崩れた研究棟', 'shack', 'S', { lore: 'arcanum_forbidden' })] },
    ],
    events: ['学術大祭（魔法スキルの熟練度+50%）', '湖上オーロラの夜（魔力が満ちSP回復上昇）', '禁呪区画の封印点検'],
    goods: { produce: ['crystal', 'book'], demand: ['silk', 'wheat', 'steel'] }, wealth: { academy: 4, market: 3, student: 2, forbidden: 1 },
  },
  lumina: {
    name: '歓楽都市ルクスガルド', title: '眠らない黄金の街', size: [116, 88], pal: 'neon', river: true, landmark: { k: 'clocktower', name: '黄金の時計台とカジノ「グラン・ルクス」', district: 'grand' },
    founded: '炭鉱暦30年（歓楽都市としては新暦元年）', history: [
      '元は「灰の谷」と呼ばれた炭鉱町。百年にわたり魔石炭を掘り、王都へ送っていた。',
      '五十年前に魔石炭が枯渇し、町は一度死にかけた。そこへ商会王ルキウス・ヴァレンが莫大な資本でカジノと劇場を誘致し、「新暦元年」を宣言した。',
      '大通りは黄金に輝く歓楽街へ生まれ変わったが、旧炭鉱区は再開発から外され、職を失った坑夫たちが取り残されてスラムになった。',
      '現在、街の利権は表のヴァレン商会と裏の犯罪組織「黒薔薇」が分け合い、市長は両者の操り人形と噂される。改革を訴える市民団体「夜明けの灯」が密かに活動している。'],
    origin: '魔石炭の鉱脈に炭鉱町が生まれ、枯渇後にカジノ資本が街を作り替えた。', geography: '川が街を二分する。北岸に黄金の歓楽街と高級区、南岸に旧市街・炭鉱跡のスラム。', climate: '温暖。夜はネオンが雲を照らし、雨の日が多い。',
    architecture: '北岸は金とガラスの摩天楼とネオン。南岸は煤けた煉瓦の旧炭鉱施設と崩れかけたアパート。', industry: ['娯楽', '観光', '金融', '（裏）闇取引'], economy: '巨額の金が動くが、富は北岸に集中。南岸の失業率は五割。',
    politics: '名目上は市長制。実権はヴァレン商会と黒薔薇が握る', ruler: '市長カルロ・デマルコ（傀儡）／商会王ルキウス・ヴァレン／黒薔薇の首領「夫人」', security: 2,
    classes: '北岸の富豪と観光客、川沿いの従業員層、南岸の元坑夫とその子どもたち。カジノの客の金が南岸に降りることはない。', culture: '一夜の夢と破滅。オペラと賭博が文化の中心。',
    lifestyle: '昼は眠り夜に目覚める街。南岸の住民は北岸の店で低賃金で働く。', weather: { clear: 3, cloud: 2, rain: 4, fog: 2 }, fields: ['field_coast'], monsters: ['シェイド', '深淵教徒', 'グール'],
    districts: [
      { id: 'grand', name: '黄金大通り（富裕・娯楽区）', type: 'rich', at: [0.35, 0.2], buildings: [
        B('l_casino', 'カジノ「グラン・ルクス」', 'casino', 'XL', { svc: 'casino', guild: 'gamblers' }), B('l_opera', 'ルクスガルド歌劇場', 'theater', 'L', { guild: 'musicians', hours: [17, 24], lore: 'lumina_opera' }),
        B('l_hotel', '五つ星ホテル「ヴァレン・パレス」', 'hotel', 'L', { svc: 'inn' }), B('l_boutique', 'ブティック「月光」', 'shop', 'M', { svc: 'outfit', hours: [11, 23] }), B('l_tower', 'ヴァレン・タワー（高級マンション）', 'mansion', 'L', { story: 'lumina' }),
        B('l_bank', 'ヴァレン銀行', 'bank', 'M', { svc: 'bank', guild: 'finance', hours: [10, 18] })] },
      { id: 'civic', name: '時計台広場（商業・行政区）', type: 'commerce', at: [0.72, 0.3], buildings: [
        B('l_hall', '市庁舎', 'office', 'L', { hours: [9, 17], lore: 'lumina_hall' }), B('l_guild', '冒険者ギルド ルクス支部', 'guildhall', 'M', { svc: 'quest', guild: 'adventurers' }), B('l_job', '職業ギルド 歓楽街支部', 'guildhall', 'M', { svc: 'guild' }),
        B('l_station', '中央駅', 'station', 'L', { svc: 'travel' }), B('l_weapon', '武具店「赤い靴」', 'shop', 'M', { svc: 'weapon', hours: [10, 24] }), B('l_realty', 'ルクス不動産', 'office', 'S', { svc: 'realty', hours: [10, 20] }), B('l_artist', '芸術家ギルド', 'museum', 'M', { guild: 'artists', hours: [10, 20] })] },
      { id: 'oldtown', name: '川沿い商店街（庶民区）', type: 'common', at: [0.3, 0.6], buildings: [
        B('l_tavern', '大衆酒場「七番目の月」', 'tavern', 'M', { hours: [12, 5] }), B('l_inn', '川沿いの宿', 'inn', 'S', { svc: 'inn' }), B('l_smith', '下町の鍛冶屋', 'smithy', 'S', { svc: 'smith', hours: [8, 20] }),
        B('l_item', '商店街の道具屋', 'shop', 'S', { svc: 'item' }), B('l_armor', '古着と防具の店', 'shop', 'S', { svc: 'armor' }), B('l_dawn', '市民団体「夜明けの灯」集会所', 'shack', 'S', { lore: 'lumina_dawn' })] },
      { id: 'slum', name: '旧炭鉱スラム', type: 'slum', at: [0.72, 0.8], buildings: [B('lumina_under', 'スラム深部への入口', 'shack', 'M', { svc: 'slum', region: 'lumina_kowloon' }), 
        B('l_black', '闇市', 'blackmarket', 'L', { svc: 'blackmarket', guild: 'blackmarket' }), B('l_pit', '地下闘技場', 'arena', 'L', { svc: 'arena', guild: 'gladiators', hours: [20, 5] }),
        B('l_rose', '黒薔薇の館', 'mansion', 'M', { guild: 'assassins', hours: [22, 5] }), B('l_clinic', 'もぐりの診療所', 'clinic', 'S', { svc: 'inn' }), B('l_factory', '廃工場', 'warehouse', 'L', { lore: 'lumina_factory' })] },
    ],
    events: ['黄金の夜（カジノの配当1.2倍）', '黒薔薇の抗争（スラムの治安悪化）', '夜明けの灯の集会'],
    goods: { produce: ['wine'], demand: ['silk', 'crystal', 'spice', 'fish', 'steel'] }, wealth: { grand: 5, civic: 3, oldtown: 2, slum: 1 },
  },
};
// PHASE 2: the six-continent world (archetype + per-city identity), merged after the original six cities (unchanged)
Object.assign(CITIES, NEW_CITIES);
for (const id of ['haven', 'marina', 'celestia', 'vulcan', 'arcanum', 'lumina']) CITIES[id].continent ||= 'eldia';
export const CITY_IDS = Object.keys(CITIES);

// Trade goods (regional production & demand drive prices; logistics refill supply)
export const GOODS = {
  wheat: { name: '小麦', base: 30 }, fish: { name: '干物', base: 40 }, spice: { name: '香辛料', base: 120 }, silk: { name: '絹織物', base: 200 },
  ore: { name: '星鉄鉱石', base: 90 }, steel: { name: '鋼材', base: 160 }, crystal: { name: '魔晶石', base: 260 }, book: { name: '魔導写本', base: 220 }, wine: { name: '葡萄酒', base: 110 },
};
// Inter-city transport network: [from, to, mode, minutes(game), fee]
export const ROUTES = [
  ['haven', 'marina', 'carriage', 90, 60], ['haven', 'celestia', 'carriage', 180, 150], ['marina', 'lumina', 'ship', 120, 200], ['marina', 'celestia', 'ship', 200, 260],
  ['celestia', 'vulcan', 'rail', 120, 180], ['celestia', 'arcanum', 'airship', 60, 400], ['vulcan', 'arcanum', 'rail', 150, 160], ['lumina', 'celestia', 'airship', 80, 450], ['vulcan', 'lumina', 'rail', 180, 220], ['haven', 'vulcan', 'carriage', 240, 180],
];
// overland routes inside each new continent (carriage / rail / airship by city), and sea & sky lanes between continents
for (const [a, b, mode, min, fee] of [
  ['haven', 'arcelia', 'carriage', 150, 120], ['arcelia', 'gravel', 'carriage', 20, 10], ['celestia', 'arcelia', 'carriage', 160, 140], ['arcelia', 'vermion', 'carriage', 80, 70], ['arcelia', 'elmgard', 'carriage', 110, 90], ['vermion', 'luminas', 'carriage', 90, 80], ['vermion', 'drakford', 'rail', 70, 90],
  ['arcelia', 'marinelia', 'carriage', 100, 90], ['arcelia', 'celestia_holy', 'carriage', 120, 100], ['marina', 'marinelia', 'ship', 60, 80], ['drakford', 'vulcan', 'rail', 140, 150], ['luminas', 'arcanum', 'airship', 70, 300],
  ['frostheim', 'granberg', 'carriage', 90, 90], ['granberg', 'whiteridge', 'carriage', 80, 80], ['frostheim', 'ignis_zero', 'airship', 50, 260], ['ignis_zero', 'valhart', 'carriage', 100, 90],
  ['ryuga', 'kazane', 'carriage', 80, 70], ['ryuga', 'elfilia', 'carriage', 100, 80], ['kazane', 'tenrai', 'carriage', 90, 80], ['tenrai', 'shuraga', 'carriage', 90, 80], ['ryuga', 'tenrai', 'airship', 40, 250],
  ['azradia', 'bazaruk', 'carriage', 100, 90], ['bazaruk', 'mirage', 'carriage', 120, 110], ['azradia', 'nefer', 'carriage', 90, 80], ['mirage', 'zal_qadim', 'carriage', 110, 100],
  ['valcanos', 'dragnia', 'carriage', 90, 90], ['valcanos', 'greymoll', 'carriage', 100, 90], ['greymoll', 'baldran', 'carriage', 90, 80], ['baldran', 'ashbell', 'carriage', 100, 90],
  ['nereia', 'bluecoast', 'ship', 60, 70], ['nereia', 'atlantia', 'ship', 70, 80], ['atlantia', 'aquaria', 'ship', 60, 70], ['bluecoast', 'seirune', 'ship', 80, 90],
  // between continents: ocean lanes from Eldia's port and sky lanes from the capital
  ['marinelia', 'nereia', 'ship', 240, 600], ['marinelia', 'frostheim', 'ship', 300, 700], ['marinelia', 'ryuga', 'ship', 320, 750], ['marinelia', 'valcanos', 'ship', 300, 700],
  ['arcelia', 'azradia', 'airship', 200, 900], ['arcelia', 'ryuga', 'airship', 220, 950], ['nereia', 'ryuga', 'ship', 260, 650], ['valcanos', 'azradia', 'carriage', 280, 400],
  ['elmgard', 'nameless_village', 'carriage', 60, 40]]) ROUTES.push([a, b, mode, min, fee]);
export const TRANSPORT = { carriage: { name: '乗合馬車', stormBlocked: false }, ship: { name: '定期船', stormBlocked: true }, rail: { name: '魔導鉄道', stormBlocked: false }, airship: { name: '飛空艇', stormBlocked: true } };
export const WEATHER = { clear: '晴れ', cloud: '曇り', rain: '雨', snow: '雪', fog: '霧', wind: '強風', storm: '嵐', smog: '煤煙', aurora: '魔力オーロラ' };
