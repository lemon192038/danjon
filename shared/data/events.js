// ABYSS event registry (single source of truth for docs/ABYSS_EVENT_DATABASE.md and the server event engine).
// Fields: id, name, en, group, kinds[], loc (region/city/realm ids from shared/data/world.js), scope ('world'|'personal'|'both'),
// trigger (human-readable discovery/start condition), prereq [event ids], stages [], outcomes [], rewards [], unlocks [],
// links [event ids], repeat ('none'|'daily'|'cycle'|'rechallenge'), detail ('spec' = fully specified by the directive,
// 'outline' = registered as extendable shell; do not invent heavy lore until specified), status ('planned'|'partial'|'live').
// overrides for registry entries that are already playable
const LIVE = { lg_unnamed_arms: { status: 'live', kinds: ['world', 'title'], scope: 'personal', trigger: '武器を装備して戦い続ける（武器の個体ごとに記録）', stages: ['武器を使い込む', '二つ名が刻まれる'], rewards: ['二つ名（300撃破〜）と攻撃補正', '称号「武器に刻む者」'], repeat: 'rechallenge', links: ['ct_hundred_arms', 'sl_blackforge'] } };
const E = (id, name, en, group, o) => ({ id, name, en, group, kinds: [], loc: [], scope: 'both', trigger: '', prereq: [], stages: [], outcomes: [], rewards: [], unlocks: [], links: [], repeat: 'none', detail: 'spec', status: 'planned', ...o });
export const EVENT_KINDS = { permanent: '常設', conditional: '条件発生型', timed: '時間限定', world: '世界規模', regional: '地域', city: '都市', slum: 'スラム', hidden: '隠し', title: '称号', job: '職業解放', npc: 'NPC遭遇', dungeon: 'ダンジョン' };
export const EVENT_GROUPS = { major: '大型イベント（8章）', slum: 'スラム起点（9章）', city: '都市起点（10章）', large: 'その他の大型イベント候補（11章）', library: '禁書庫・大罪（12〜14章）', existing: '既存実装（統合対象）' };
export const EVENTS = [
  // ── 8. major events
  E('ev_swordmaster', '放浪する最強の剣士', 'THE WANDERING SWORDMASTER', 'major', { kinds: ['npc', 'world', 'hidden', 'title', 'job'], loc: ['eldia', 'nordia', 'shengar', 'saharia', 'valgran', 'asteria'], scope: 'both',
    trigger: 'NPCレイヴァン・クロイツが街道・山道・森林・荒野・遺跡・ダンジョン入口を巡回。遭遇して決闘を申請すると開始',
    stages: ['遭遇', '決闘申請', '決闘（学習AI）', '複数武器種で勝利を重ねる', '隠し試練「無銘の極致」', '真の能力との再戦'], outcomes: ['勝利', '敗北（何度でも再戦可）'],
    rewards: ['称号「剣聖に認められし者」', '称号「無銘を超えし者」', '特殊剣技', '「無銘・天断」のレプリカ（オリジナルは入手不可）'], unlocks: ['職業「剣理の探究者」の解放条件'], status: 'live', notes: '世界各地を巡回（約1時間ごとに移動）。決闘AIは相手の過去の戦い方を記録して戦術を変える（入力の先読みはしない）。3つの武器種で勝つと隠し試練「無銘の極致」', links: ['ev_masquerade', 'ct_duelist', 'lg_undefeated'], repeat: 'rechallenge' }),
  E('ev_sunken', '沈没した王国', 'THE SUNKEN KINGDOM', 'major', { kinds: ['regional', 'dungeon', 'title'], loc: ['asteria', 'atlantis'], trigger: '海底の石畳・巨大な門・古代文字・不自然な光・海底の鐘のいずれかを発見',
    stages: ['手がかり発見', '浅瀬探索（通常装備可）', '沈没港', '市民街', '王立図書館', '水晶研究所', '王宮（深部：水中装備・呼吸魔法が必要）', '深海神殿', '沈没王アトランティス戦', '結末選択'],
    outcomes: ['王国再生', '王国解放', '王国継承'], rewards: ['水中装備', '古代魔法', '水中都市へのアクセス', '称号「沈没王国の発見者」'], unlocks: ['アステリア海底地域'], links: ['ev_thousand_spells', 'ev_calamity'], repeat: 'rechallenge', status: 'live', notes: 'アビサル・オーシャンの手がかりから隠しダンジョン「沈没王国アトランティス」（全60階・6区域）へ。21階以降の深部は潜水装備か呼吸の秘薬がないと酸素が尽きる。水中では火属性半減・水/雷1.25倍・飛び道具が遅い。結末は世界状態に記録' }),
  E('ev_blackmoon', '黒月の夜', 'NIGHT OF THE BLACK MOON', 'major', { kinds: ['world', 'conditional', 'hidden', 'job', 'title'], loc: ['world', 'luna_veil'], scope: 'both',
    trigger: '周期固定ではなく世界状態で発生：地域の魔力蓄積・遺跡起動・ボス長期未討伐・天体イベント・黒月関連書籍の発見の累積',
    stages: ['前兆（NPCが月を見上げる・魔物の変化・魔法の色・夜だけ見える建物・黒い羽根）', '黒月の夜（世界イベント）', '黒月の観測者と遭遇（複数回）', '各地の観測装置を起動', '隠しイベント「月の裏側」', '月面転移門'],
    outcomes: ['観測者撃退', '月の裏側到達'], rewards: ['黒月系魔法', '武器「黒天月蝕」', '称号「月の裏側を見た者」', '黒月素材'], unlocks: ['職業「月影の観測者」', 'ルナ・ヴェイル'], links: ['lg_last_observer', 'lg_other_side'], repeat: 'cycle', status: 'live', notes: '月の気配（時間・遺跡・古書・強敵討伐で蓄積）が満ちた夜にのみ発生。観測者は戦い方を記録して戦術を変える。観測者2回撃退＋観測装置4基で月紋の石門（アマツカミ）が開く' }),
  E('ev_thousand_spells', '失われた千の魔法', 'THE LOST THOUSAND SPELLS', 'major', { kinds: ['permanent', 'job', 'title'], loc: ['world'], scope: 'personal',
    trigger: '世界各地で魔法断片を発見', stages: ['断片の発見', '構造解析（属性・消費・発動条件・射程・範囲・持続・特殊効果）', '再構築', '実験検証', '習得', '改良（範囲・速度・消費・持続・複合化／全性能同時最大化は不可）', '最終研究「第零魔法：オリジン」'],
    rewards: ['称号「千の魔法を識る者」', '第零魔法', '研究施設の拡張'], unlocks: ['職業「原初魔導師」'], links: ['lib_forbidden', 'ct_academy'], repeat: 'none', status: 'live', notes: '1000種の失われた魔法＋第零魔法。研究は図書館・学院・研究所・観測所で。改良は合計4点の配分制（全性能の同時最大化は不可）。第零魔法には七つの重要魔法と禁書『魔力の存在証明』（PHASE 8の禁書庫で入手）が必要' }),
  E('ev_calamity', '眠れる災厄', 'THE SLEEPING CALAMITY', 'major', { kinds: ['world', 'regional', 'conditional'], loc: ['valgran', 'asteria', 'shengar', 'saharia'], scope: 'both',
    trigger: '魔物がいない地域・巨大な足跡・遺跡の記録・魔物の逃走・採集物の異常反応', stages: ['周辺魔物の行動変化', '地鳴り・異常気象', 'NPCからの報告', '特殊採集物・痕跡', '目覚め'],
    outcomes: ['討伐', '再び眠らせる', '生態調査', '条件付き共存'], rewards: ['災厄素材', '伝説級武器レシピ', '称号', '生態記録', '災厄の眷属', '特殊装備'], links: ['lg_territory'], repeat: 'cycle', status: 'live', notes: '前兆は5段階でニュースに流れる。目覚めた災厄は世界共通HPのワールドボス。焦土の眠龍（火山）・深海の巨鯨（海底）・森羅の巨獣（森林）・砂塵の巨神（砂漠）。討伐しても世界から永久には消えない' }),
  E('ev_masquerade', '仮面の武闘祭', 'THE MASQUERADE TOURNAMENT', 'major', { kinds: ['city', 'timed', 'job', 'title'], loc: ['arcelia', 'gravel'], trigger: '裏路地・酒場・秘密の案内人に接触',
    stages: ['案内人に接触', '資格確認', '仮面受領', '登録', '予選', '本戦', '決勝', '仮面の王', '（複数回優勝＋正体記録）素顔の王'], outcomes: ['優勝', '敗退'],
    rewards: ['大会報酬', '称号'], unlocks: ['職業「闘技王」への道'], links: ['ev_swordmaster', 'sl_colosseum'], repeat: 'cycle', status: 'live', notes: '参加者の名前・職業・称号は非表示、外観は統一、能力は均一化しない。不足時はNPC補充' }),
  // ── 9. slum (Gravel)
  E('sl_graymarket', '灰色市場', 'GRAY MARKET', 'slum', { kinds: ['permanent', 'slum'], loc: ['gravel'], scope: 'world', trigger: '常設（グレイヴェル闇市場）', stages: ['入荷', '価格変動', '組織による市場支配'], rewards: ['希少品の購入機会'], links: ['sl_auction', 'sl_factions'], repeat: 'daily', status: 'live', notes: '地域「グレイヴェル地下街」の闇市相場。供給・需要・在庫・組織の支配率で価格が動き、上下限で暴騰暴落を防ぐ' }),
  E('sl_children', '消えた子供たち', 'THE MISSING CHILDREN', 'slum', { kinds: ['slum', 'conditional'], loc: ['gravel'], trigger: 'スラムで子供の失踪の噂を聞く', stages: ['調査', '証拠収集', '違法な魔力適性研究施設の発見', '救出', '関係者との対峙'], outcomes: ['救出成功', '一部救出'], rewards: ['名声', '無名の子供たちとの友好'], links: ['sl_factions'], notes: '過度に残虐な表現は避け、物語と救出を中心にする' }),
  E('sl_factions', '七つの裏社会', 'SEVEN UNDERWORLD FACTIONS', 'slum', { kinds: ['permanent', 'slum', 'world'], loc: ['gravel'], scope: 'world', trigger: '常設', stages: ['勢力図', '抗争', '同盟', 'リーダー交代'], links: ['sl_graymarket', 'sl_false_hero', 'sl_capital_shadow'], repeat: 'cycle', status: 'live', notes: '七組織の縄張り・資金・構成員・首領は世界共有でログアウト中も進行。拠点で仕事を受け、加入できる' }),
  E('sl_facility', '地下に眠る巨大施設', 'THE BURIED FACILITY', 'slum', { kinds: ['slum', 'dungeon', 'hidden', 'job'], loc: ['gravel'], trigger: 'グレイヴェル地下の探索で古代神機文明の痕跡を発見', stages: ['発見', '演算装置の起動', '研究記録の回収'], unlocks: ['神機技師関連職業'], links: ['lg_deus_machina', 'sl_last_resident'] }),
  E('sl_plague', 'スラムの疫病', 'PLAGUE OF THE SLUMS', 'slum', { kinds: ['slum', 'conditional', 'world'], loc: ['gravel'], scope: 'world', trigger: '地下水汚染・魔力性菌類の蔓延（世界状態）', stages: ['原因調査', 'サンプル収集', '研究', '浄化'], outcomes: ['浄化', '長期化'], rewards: ['薬師ギルド評価'], notes: 'NPCの生活・商店・物流に影響' }),
  E('sl_false_hero', '偽りの英雄', 'THE FALSE HERO', 'slum', { kinds: ['slum', 'npc'], loc: ['gravel'], scope: 'both', trigger: 'NPCアルベルト・ヴァイスの評判を聞く', stages: ['接触', '調査'], outcomes: ['正体を暴く', '協力する', '対立する', '決闘する'], links: ['sl_capital_shadow', 'sl_factions'], notes: '選択でスラムの政治状況が変化（世界共有）' }),
  E('sl_auction', '闇の競売会', 'AUCTION OF SHADOWS', 'slum', { kinds: ['slum', 'timed'], loc: ['gravel'], trigger: '招待状または情報屋', stages: ['招待', '入札', '落札'], rewards: ['希少品・古代遺物・特殊装備・情報'], links: ['sl_graymarket', 'ct_royal_auction'], repeat: 'cycle' }),
  E('sl_colosseum', '無名の地下闘技場', 'THE HIDDEN COLOSSEUM', 'slum', { kinds: ['slum', 'permanent', 'title'], loc: ['gravel'], trigger: '常設', stages: ['登録', '試合', 'ランキング', '武器種別大会'], rewards: ['報酬', '称号'], links: ['ev_masquerade'], repeat: 'daily' }),
  E('sl_carriers', '死者の運び屋', 'THE CARRIERS OF THE DEAD', 'slum', { kinds: ['slum', 'hidden'], loc: ['gravel'], trigger: '夜間に遺体搬送の一団を目撃', stages: ['追跡', '調査', '魂・記憶の再現研究の発覚'], links: ['lib_forbidden'] }),
  E('sl_capital_shadow', '王都の裏側', 'THE SHADOW OF THE CAPITAL', 'slum', { kinds: ['slum', 'city', 'world'], loc: ['gravel', 'arcelia'], scope: 'world', trigger: '貴族による搾取の証拠', stages: ['証拠', '交渉', '決断'], outcomes: ['自治権獲得', '王都の管理強化', '現状維持'], links: ['sl_false_hero', 'ct_succession'] }),
  E('sl_blackforge', '黒炉の鍛冶師', 'THE BLACKFORGE', 'slum', { kinds: ['slum', 'npc', 'job'], loc: ['gravel'], trigger: 'NPCグラド・ベルン（ドワーフ鍛冶師）に会う', stages: ['依頼', '特殊素材の収集', '武器改造', '特殊製作技術の伝授'], unlocks: ['職業「黒炉鍛冶師」'], links: ['ct_hundred_arms', 'lg_unnamed_arms'] }),
  E('sl_last_resident', '最後の住人', 'THE LAST RESIDENT', 'slum', { kinds: ['slum', 'npc', 'hidden'], loc: ['gravel'], trigger: 'NPCエドガー（古代文明研究者）と交流', stages: ['交流', '記録の断片'], links: ['lib_forbidden', 'lg_other_side'] }),
  // ── 10. city events
  ...[['ct_festival', '王都の大祭典', 'GRAND FESTIVAL OF THE CAPITAL', ['arcelia'], ['city', 'timed'], '屋台・競技・NPC交流・特殊商店・期間限定報酬。アルセリアの経済とNPC生活に影響'],
    ['ct_vanished_district', '消えた商店街', 'THE VANISHED DISTRICT', ['eldia'], ['city', 'hidden'], '住民の記憶・地図・建物記録を調査し隠された区域を発見'],
    ['ct_royal_auction', '王立オークション', 'ROYAL AUCTION', ['arcelia'], ['city', 'timed'], '希少装備・素材・遺物・情報の競売'],
    ['ct_troupe', '旅芸人一座', 'THE WANDERING TROUPE', ['world'], ['city', 'npc'], '都市を移動して公演、イベントや隠し情報を提供'],
    ['ct_haunted', '幽霊屋敷の噂', 'THE HAUNTED MANSION', ['eldia'], ['city', 'hidden'], '屋敷の怪奇現象の調査'],
    ['ct_promotion', '冒険者ギルドの昇格試験', 'GUILD PROMOTION', ['world'], ['city', 'permanent'], '戦闘・探索・採集・知識の課題でランク昇格'],
    ['ct_duelist', '決闘の申し込み', "THE DUELIST'S CHALLENGE", ['world'], ['city', 'npc'], 'NPCやプレイヤーからの決闘。性格・戦績・評判を反映'],
    ['ct_lost_party', '失踪した冒険者パーティー', 'THE LOST PARTY', ['world'], ['city', 'dungeon'], '消息不明のパーティーを捜索'],
    ['ct_hundred_arms', '百武器の祭典', 'FESTIVAL OF A HUNDRED ARMS', ['eldia'], ['city', 'timed'], '86武器種すべての展示・試用・競技・製作'],
    ['ct_succession', '王位継承の噂', 'THE SUCCESSION CRISIS', ['arcelia'], ['city', 'world'], '王位継承を巡る政治対立'],
    ['ct_merchants_war', '商人ギルドの経済戦争', "MERCHANTS' WAR", ['vermion'], ['city', 'world'], '価格競争・交易路争奪・商品供給。ヴェルミオンなどの交易に影響'],
    ['ct_great_fire', '王都の大火災', 'THE GREAT FIRE', ['arcelia'], ['city', 'world'], 'NPC避難・消火・救助・施設被害・復興'],
    ['ct_delegation', '国際交易使節団', 'THE FOREIGN DELEGATION', ['world'], ['city', 'timed'], '他大陸の商人・外交官が来訪し、各大陸の物価・供給に影響'],
    ['ct_undercity', '街の地下水路', 'THE UNDERCITY NETWORK', ['eldia'], ['city', 'dungeon', 'hidden'], '地下水路で隠された通路・施設を発見'],
    ['ct_thirteenth', '時計塔の十三時', 'THE THIRTEENTH HOUR', ['eldia'], ['city', 'hidden'], '存在しない十三時の時間異常'],
    ['ct_portrait', '名もなき肖像画', 'THE PORTRAIT WITHOUT A NAME', ['eldia'], ['city', 'hidden'], '名前の記録されていない人物の肖像画を調査'],
    ['ct_midnight_shop', '夜だけ営業する店', 'THE MIDNIGHT SHOP', ['eldia'], ['city', 'conditional'], '夜間のみ出現する特殊な店舗'],
    ['ct_academy', '王立魔法学院の公開研究会', 'ROYAL ACADEMY', ['luminas'], ['city', 'timed'], '魔法研究・実験・研究者との交流・特殊魔法の解放'],
    ['ct_stranger', '街に現れた異邦人', 'THE STRANGER', ['world'], ['city', 'npc', 'hidden'], '世界の常識から外れた人物が現れる'],
    ['ct_king_beneath', '街の地下に眠る王', 'THE KING BENEATH THE CITY', ['arcelia'], ['city', 'dungeon', 'hidden'], '都市地下に眠る古代の王']]
    .map(([id, n, en, loc, kinds, notes]) => E(id, n, en, 'city', { loc, kinds, notes, detail: 'outline' })),
  // ── 11. other large events (outline only — not enough spec yet; extend when defined)
  ...[['lg_god_remains', '神骸発掘', 'REMNANTS OF GOD', ['divine_realm'], 'ディヴァイン・レルムへの導線'], ['lg_kingdom_below', '地底王国', 'KINGDOM BELOW', ['underrealm'], 'アンダーレルムへの導線'],
    ['lg_fall_heavens', '天空の落日', 'FALL OF THE HEAVENS', ['astralheim'], 'アストラルヘイムへの導線'], ['lg_worldtree_dream', '世界樹の夢', 'WORLD TREE DREAM', ['yggdrasil'], 'ユグドラシルへの導線'],
    ['lg_deus_machina', '神機降臨', 'DEUS MACHINA', ['world'], '神機関連職業・デウス・エクス・マギアの解放'], ['lg_forgotten_hero', '忘却された英雄', 'THE FORGOTTEN HERO', ['world'], ''],
    ['lg_unnamed_arms', '名もなき武器', 'THE UNNAMED ARMAMENT', ['world'], '長期使用した武器に固有の歴史（撃破数・ボス討伐・最多討伐種・進化歴）が蓄積し、節目で二つ名と小さな補正が刻まれる'], ['lg_wandering_merchant', '名もなき商人', 'THE WANDERING MERCHANT', ['world'], ''],
    ['lg_rebuild', '滅びた村の再建', 'REBUILD THE LOST', ['eldia'], ''], ['lg_civil_war', '王国の内乱', 'CIVIL WAR', ['eldia'], ''],
    ['lg_territory', '古龍の縄張り争い', 'TERRITORIAL DOMINION', ['valgran'], '大型モンスターの生態系・縄張り'], ['lg_vanished_city', '消えた都市', 'THE VANISHED CITY', ['world'], ''],
    ['lg_undefeated', '無敗の挑戦者', '', ['world'], '称号イベント'], ['lg_abyss_walker', '深淵の踏破者', '', ['world'], '称号イベント（ダンジョン踏破）'], ['lg_veteran', '百戦錬磨', '', ['world'], '称号イベント'],
    ['lg_collector', '万物の収集家', '', ['world'], '称号イベント（収集）'], ['lg_nameless_savior', '無名の救世主', '', ['world'], '称号イベント'], ['lg_last_observer', '最後の観測者', '', ['outer_world'], '予言書『七つの災厄と最後の観測者』と関連'],
    ['lg_other_side', '世界の裏側', 'THE OTHER SIDE', ['outer_world'], 'アウター・ワールドへの導線'], ['lg_divine_war', '神々の戦争', 'WAR OF THE DIVINES', ['divine_realm'], ''], ['lg_doomsday', '終末時計', 'DOOMSDAY CLOCK', ['chronos_realm'], 'クロノス・レルムへの導線']]
    .map(([id, n, en, loc, notes]) => E(id, n, en, 'large', { loc, kinds: ['world'], notes, detail: 'outline', ...(LIVE[id] || {}) })),
  // ── 12-14 library & sins
  E('lib_sealed_abyss', '封印されし深淵', 'SEALED ABYSS', 'library', { kinds: ['dungeon', 'permanent'], loc: ['arcelia'], scope: 'personal', trigger: 'アルセリア地下。HARD以上限定', stages: ['1-10 忘却の地下墓地（墓守の巨人）', '11-20 腐蝕の菌窟（腐蝕母樹）', '21-30 灼熱の地底炉（熔鉄の処刑者）', '31-40 沈黙の水没神殿（深海の祭司）', '41-50 失われた機械都市（機械王オルディウス）', '51-100（環境・ボス未定義）'],
    rewards: ['禁書庫の鍵（10F毎ボス：P% = 階層/10、個別抽選、取引・売却不可、入場時1本消費）'], links: ['lib_forbidden'], repeat: 'rechallenge', status: 'live', notes: '入口は王都アルセリアの王城（地下への封印門）。全100階。51〜100階は1〜50階の環境の深層版（C-12）' }),
  E('lib_forbidden', '禁書庫', 'THE FORBIDDEN ARCHIVE', 'library', { kinds: ['hidden', 'job', 'title'], loc: ['arcelia'], scope: 'personal', trigger: '大図書館に禁書庫の鍵を持って入場（1本消費）', prereq: ['lib_sealed_abyss'],
    stages: ['初回訪問（称号「初めての禁書庫」）', '書籍閲覧（異端書・禁忌書・失伝書・予言書・異界書）', '異端書1冊読了 → 異端者'], rewards: ['称号「初めての禁書庫」'], unlocks: ['職業「異端者」'], links: ['lib_sins', 'ev_thousand_spells', 'sl_carriers', 'lg_other_side'], status: 'live', notes: '大図書館の受付で鍵を1本消費。31冊（異端書・禁忌書・失伝書・予言書・異界書・大罪の書7）。『魔力の存在証明』は第零魔法の条件' }),
  E('lib_sins', '七つの大罪', 'SEVEN SINS', 'library', { kinds: ['job', 'world'], loc: ['arcelia'], scope: 'both', trigger: '異端者になる', prereq: ['lib_forbidden'],
    stages: ['主ルート選択（強欲・暴食・嫉妬・怠惰・傲慢・憤怒・色欲）', '罪人', '熟練度・条件', '最終試練（再挑戦可・失敗しても職業/熟練度は失わない）', '大罪司教'], unlocks: ['罪人7種', '大罪司教7系統（1キャラ1系統）'], links: ['lib_succession'], status: 'live' }),
  E('lib_succession', '大罪司教の継承決闘', 'SUCCESSION DUEL', 'library', { kinds: ['world', 'npc'], loc: ['arcelia'], scope: 'world', trigger: '現職の大罪司教（プレイヤーまたはNPC）に継承決闘を申請。NPCは必ず受諾', prereq: ['lib_sins'],
    stages: ['申請', '決闘', '継承または防衛'], outcomes: ['挑戦者が継承（敗者は元大罪司教として残る）', '現職が防衛'], links: ['lib_sins'], repeat: 'rechallenge', status: 'live', notes: '継承履歴（現職・歴代・日時・勝敗・職業・武器種）を世界状態に記録。座の継承だけで試練報酬は自動解放しない' }),
];
// already-implemented content that the event engine adopts (kept as-is; see docs/ABYSS_CONFLICT_REPORT.md)
EVENTS.push(
  ...[['celestia', '王位継承の陰謀', 'ct_succession'], ['marina', '灯台の消えた夜', ''], ['vulcan', '深層採掘の是非', ''], ['arcanum', '終焉の鍵の欠片', ''], ['lumina', '夜明けの灯', '']]
    .map(([c, n, l]) => E('st_' + c, n, '', 'existing', { kinds: ['city', 'world'], loc: [c], scope: 'both', trigger: '都市の物語NPC（server/game/stories.js）', stages: ['段階進行', '選択（最初の選択者が都市の運命を決定）'], links: l ? [l] : [], status: 'live' })),
  E('ex_slum_raid', 'スラム探索・脱出', 'SLUM EXTRACTION', 'existing', { kinds: ['slum', 'permanent', 'dungeon'], loc: ['haven', 'marina', 'celestia', 'vulcan', 'arcanum', 'lumina'], trigger: '各都市「スラム深部への入口」', stages: ['潜入', '探索', '脱出'], links: ['sl_graymarket'], repeat: 'rechallenge', status: 'live' }),
  E('ex_arena', '闘技場', 'ARENA', 'existing', { kinds: ['city', 'permanent'], loc: ['marina', 'lumina'], trigger: '闘技場NPC', stages: ['3連戦'], links: ['sl_colosseum'], repeat: 'daily', status: 'live' }),
  E('ex_dungeons', '12ダンジョン×100階層', 'DUNGEONS', 'existing', { kinds: ['dungeon', 'permanent'], loc: ['world'], trigger: 'ダンジョンゲート', stages: ['EASY〜ABYSS'], links: ['lg_abyss_walker'], repeat: 'rechallenge', status: 'live' }),
);
export const EVENT_BY_ID = Object.fromEntries(EVENTS.map(e => [e.id, e]));
