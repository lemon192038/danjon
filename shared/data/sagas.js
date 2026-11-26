// NEW WORLD EVENTS — PHASE C: NPC-centred events (07-12). Story NPCs live inside the city life simulation (home, work,
// meals, rest, weather, danger) with schedules that change with each event's state; the events run on the city-event
// engine with NPC hosts. Texts avoid graphic content. Plans: [fromHour, toHour, place] with place = home | tavern |
// gate (city entrance) | plaza:<districtType> | work:<doorId>.
export const STORY_NPCS = {
  arvel: { name: 'アーヴェル・クロード', job: '村の便利屋', city: 'elmgard', district: 'common', look: { body: 0, skin: 1, hair: 5, hairColor: 7, outfit: 2 }, ev: 'nx07',
    plan: { base: [[6, 12, 'plaza:common'], [12, 13, 'tavern'], [13, 18, 'work:el_g_herbalists'], [18, 21, 'plaza:commerce']], adventure: [[6, 9, 'work:w_elmgard_guild'], [9, 12, 'plaza:common'], [12, 13, 'tavern'], [13, 18, 'work:el_g_mercenaries']] } },
  noah: { name: 'ノア・ヴェルナー', job: '旅の商人', city: 'vermion', district: 'commerce', look: { body: 1, skin: 2, hair: 3, hairColor: 4, outfit: 6 }, ev: 'nx08', roam: 'trader',
    plan: { base: [[7, 19, 'plaza:commerce'], [19, 22, 'tavern']] } },
  harold: { name: 'ハロルド老人', job: '元船大工', city: 'marinelia', district: 'common', look: { body: 0, skin: 0, hair: 1, hairColor: 9, outfit: 1 }, ev: 'nx09',
    plan: { base: [[8, 11, 'plaza:commerce'], [11, 13, 'tavern'], [15, 18, 'gate']], waitRain: true, done: [[8, 11, 'plaza:commerce'], [11, 14, 'tavern'], [15, 18, 'plaza:common']] } },
  erik: { name: '灯台守エリク', job: '灯台守', city: 'seirune', district: 'commerce', look: { body: 0, skin: 2, hair: 2, hairColor: 9, outfit: 3 },
    plan: { base: [[6, 18, 'plaza:commerce'], [18, 20, 'tavern']] } },
  bard: { name: '名もなき楽士', job: '楽士', city: 'vermion', district: 'commerce', look: { body: 1, skin: 1, hair: 4, hairColor: 0, outfit: 8 }, ev: 'nx10', roam: 'route',
    route: ['vermion', 'luminas', 'arcelia', 'marinelia', 'celestia_holy', 'elmgard', 'drakford'], plan: { base: [[10, 17, 'plaza:commerce'], [18, 22, 'plaza:commerce']] }, perform: [18, 22] },
  garou: { name: '剣士ガロウ', job: '鍛冶場の用心棒', city: 'drakford', district: 'commerce', look: { body: 0, skin: 3, hair: 0, hairColor: 2, outfit: 4 },
    plan: { base: [[7, 12, 'work:w_drakford_smith'], [12, 13, 'tavern'], [13, 19, 'work:w_drakford_smith']] } },
  lily: { name: '旅人リリィ', job: '旅の娘', city: 'vermion', district: 'commerce', look: { body: 1, skin: 0, hair: 3, hairColor: 5, outfit: 9 }, ev: 'nx12',
    plan: { base: [[9, 12, 'work:w_vermion_item'], [12, 14, 'tavern'], [14, 18, 'plaza:commerce']], palace: [[9, 18, 'plaza:rich']] } },
};
// lines by event state (personal progress first, then world state)
export const STORY_LINES = {
  arvel: { pre: '「ん？ 旅の人か。畑の柵を直すんで、そこの板を取ってくれるかい」', mid: '「昔話？ ……大したことはしとらんよ」', secret: '「あの話は、二人だけの秘密にしてくれて助かった」', companions: '「あいつらの手紙、毎晩読み返しとる。ありがとうな」', adventure: '「たまには剣を振るのも悪くない。若いのに稽古をつけてやろう」', public: '「村のみんなが妙に丁寧でな……落ち着かん」', nothing: '「今日もいい天気だ。畑日和だな」' },
  noah: { pre: '「いらっしゃい。旅の品はどれも一点物ですよ」', friend: '「あなたとの取引は、いつも気持ちがいい」' },
  harold: { pre: '「……今日も来なかったか。いや、何でもないよ」', reunite: '「あいつがな、この港に帰ってきたんだ。五十年ぶりだよ」', news: '「生きていてくれた。それだけで十分さ」', hide: '「あいつはきっと、遠い海で元気にやってる」', letter: '「手紙の字が昔のままでな。泣けてしまったよ」', respect: '「待つのも、悪くない人生だったよ」' },
  erik: { pre: '「灯りを絶やさないのが仕事でね。……昔、マリネリアに約束を置いてきた」', reunite: '「港の夕日はやっぱりいい。あいつの隣で見るのが一番だ」' },
  bard: { pre: '（名もなき楽士が、聞いたことのない旋律を奏でている）', mid: '「この曲をどこで覚えたのか……思い出せないんだ」', named: '「名前をもらえるなんて。今日から私は、その名で弾こう」', search: '「まだ探すよ。旋律が道を覚えている」' },
  garou: { pre: '「弟子？ ……そんなもの、もう取らん」', reunite: '「あの小僧が、まさかここまで来るとはな」' },
  lily: { pre: '「わあ、この市場ってこんなに品物があるのね！」', hide: '「秘密を守ってくれてありがとう。もう少しだけ、普通の旅人でいさせて」', public: '「名乗ってしまったからには、王女として恥じない旅にするわ」', reform: '「市場で見たことを、ちゃんと王宮に伝えたの。少しずつ変えていく」', journey: '「次はどこへ行こうかしら。あなたのおかげで世界が広がった」', duty: '「王宮に戻るわ。……でも、また会いに来て」' },
};
const T = text => ({ k: 'talk', text });
const T2 = (at, text) => ({ k: 'talk', text, at });
export const SAGA_EVENTS = {
  nx07: { npc: 'arvel', reward: { xp: 15000, title: '英雄を知る者' }, service: 'hero', steps: [
    { k: 'gossip', city: 'elmgard', n: 3, text: 'エルムガルドの住民3人から昔話を聞く（「昔すごい冒険者が住み着いた」という噂）' },
    T('「わしが？ 英雄？ はっは、ただの便利屋だよ。……その噂、誰から聞いた？」'),
    { k: 'days', n: 3, text: '日をまたいで3回、アーヴェルの仕事を手伝いながら話す' },
    { k: 'quiz', text: '柵を直しながら、アーヴェルがふと尋ねた。', q: '「森で巨大な獣と出くわしたら、まず何を見る？」', options: ['目を見て威嚇する', '足の運びと退路を見る', '武器を構えて突撃する'], a: 1 },
    { k: 'visit', zones: ['in:w_vermion_guild', 'in:w_arcelia_library', 'in:el_g_mercenaries'], label: '仲間の証言と記録を集める（ヴェルミオンの冒険者ギルド・王都の図書館・傭兵ギルド）', text: 'かつての仲間の証言と冒険の記録を集める（ヴェルミオンの冒険者ギルド・王都の図書館・エルムガルドの傭兵ギルド）' },
    T('記録と証言をつなぐと、真実が見えた。二十年前、アーヴェルの一行は目覚めた「森羅の巨獣」を再び眠らせた。その儀式から、仲間の魔術師だけが戻らなかった。彼は剣を置き、仲間が愛したこの土地を耕すことにしたのだ。'),
    { k: 'choice', text: 'アーヴェルは静かに言った。「……知ってしまったか。で、どうするね」', options: [
      { id: 'secret', label: '秘密を守る', effect: 'アーヴェルの過去は二人だけの秘密になった', reward: { flag: 'arvelSecret' } },
      { id: 'companions', label: 'かつての仲間を探して手紙を届ける', effect: '各地に散った仲間から返事が届き、アーヴェルは時々ヴェルミオンへ出かけるようになった', world: { flag: 'arvel:companions' } },
      { id: 'adventure', label: 'もう一度冒険を提案する', effect: 'アーヴェルは朝だけギルドに顔を出し、若手に稽古をつけ始めた', world: { flag: 'arvel:adventure' } },
      { id: 'public', label: '功績を公表する', effect: 'エルムガルドに英雄の記念碑が建った', world: { flag: 'arvel:public', supply: { city: 'elmgard', v: 0.05 } } },
      { id: 'nothing', label: '何もしない（彼の意思を尊重する）', effect: 'アーヴェルは今日も畑を耕している' }] }] },
  nx08: { npc: 'noah', reward: { xp: 12000, gold: 5000, title: '世界を巡る者' }, service: 'trader', repeat: 'none', steps: [
    T('「旅の商人ノアと申します。私は取引相手の評判を大切にしていましてね。まずは何かお買い上げを」'),
    { k: 'trade', n: 3, text: 'ノアと3回取引する（ノアは日ごとに交易の盛んな安全な街へ移動する）' },
    { k: 'gather', ref: 'wood', n: 5, text: '仕入れを手伝う：霊木材を5つ届ける' },
    T('「実は、ある品を探して旅をしているのです。“最初の硬貨”――私の一族が最初に商いをした街の硬貨を」'),
    { k: 'gather', ref: 'relic', n: 3, text: '古い硬貨の手掛かりとして遺物の欠片を3つ届ける' },
    { k: 'choice', text: '遺物の中に、見たことのない刻印の硬貨が混じっていた。', options: [
      { id: 'friend', label: '硬貨をノアに贈る（友好）', effect: 'ノアは特別な品を卸してくれるようになった', reward: { flag: 'noahFriend' } },
      { id: 'rival', label: '他の商人と競える情報と交換する', effect: 'ノアの扱う品の値が少し下がった', world: { flag: 'noah:competitive' }, reward: { gold: 5000 } },
      { id: 'secret', label: 'ノアの一族の秘密を尋ねる', effect: '硬貨は「記録されない都市」の古い通貨だった', reward: { flag: 'noahSecret' } }] }] },
  nx09: { npc: 'harold', reward: { xp: 12000, title: '約束を届けた者' }, steps: [
    { k: 'gossip', city: 'marinelia', n: 2, text: 'マリネリアの住民から、夕方になると港の入口に立つ老人の話を聞く' },
    { k: 'days', n: 2, text: '日をまたいで2回、ハロルドの夕方の散歩に付き合う' },
    T('「五十年前、相棒のエリクは“沈んだ王国の手掛かりを見つけたら帰る”と言って船に乗った。……それきりさ」'),
    { k: 'visit', zones: ['in:w_marinelia_trade', 'in:mn_g_sailors'], label: '交易所と船乗りギルドで古い航海記録を探す', text: '古い航海記録と手紙を探す（交易所・船乗りギルド）' },
    T('記録によれば、エリクの船は嵐でセイルーンに流れ着いた。その後の足取りは、灯台の勤務記録に残っていた。'),
    { k: 'meet', npc: 'erik', text: 'アステリアのセイルーンで灯台守エリクに会う' },
    T2('erik', 'エリクは目を伏せた。「沈没王国の手掛かりを見つけられなかった。帰る顔がなかったんだ」 彼は一通の古い手紙を差し出した。'),
    { k: 'choice', text: 'ハロルドに何を届ける？', options: [
      { id: 'reunite', label: 'エリクを連れてマリネリアへ帰る', effect: 'エリクは五十年ぶりにマリネリアへ帰り、二人は港で夕日を眺めるようになった', world: { flag: 'promise:reunite', move: { npc: 'erik', city: 'marinelia' } } },
      { id: 'news', label: '消息だけを伝える', effect: 'ハロルドは「生きていた」とだけ聞き、穏やかに笑った', world: { flag: 'promise:news' } },
      { id: 'letter', label: '手紙を届ける', effect: '五十年越しの手紙が届いた', world: { flag: 'promise:letter' } },
      { id: 'hide', label: '真実を伏せる', effect: 'ハロルドは今日も港の入口に立つ', world: { flag: 'promise:hide' } },
      { id: 'respect', label: '待ち続けることを尊重する', effect: 'ハロルドは自分の意思で待ち続けることを選んだ', world: { flag: 'promise:respect' } }] }] },
  nx10: { npc: 'bard', reward: { xp: 15000, title: '失われた旋律を聴いた者' }, steps: [
    { k: 'listen', n: 1, text: '夕方（18〜22時）、広場で名もなき楽士の演奏を聴く' },
    T('旋律を聴いた瞬間、見知らぬ街の景色が浮かんだ。白い石畳、鐘の音、名前の刻まれていない門――。'),
    { k: 'listen', n: 4, distinct: true, text: '楽士は日ごとに街を移る。4つの異なる街で演奏を聴き、楽曲を記録する' },
    { k: 'quiz', text: '記録した楽曲を並べると、共通する旋律が浮かび上がった。', q: '四つの曲に共通する主旋律が表しているのは？', options: ['港の汽笛', '同じ街の鐘の音', '戦場の太鼓'], a: 1 },
    T('楽士は自分の過去を覚えていない。だが旋律は、地図から消えた街――記録されない街の鐘を、正確に再現していた。'),
    { k: 'choice', text: '楽士は「この曲の街を知っているのか」と尋ねた。', options: [
      { id: 'name', label: '旋律の街の名を贈る（「アウレア」と呼ぶ）', effect: '楽士は「アウレアの楽士」と名乗るようになった', world: { flag: 'bard:named' } },
      { id: 'search', label: '一緒に探し続けると約束する', effect: '楽士は今も旋律の街を探して旅を続けている', world: { flag: 'bard:search' } },
      { id: 'academy', label: '楽曲を学院に記録として残す', effect: '学院に「失われた旋律」の楽譜が収められた', world: { flag: 'bard:recorded' }, reward: { gold: 3000 } }] }] },
  nx11: { npc: null, host: { name: 'ギルドの新人リオ', city: 'haven', near: 'h_guild' }, reward: { xp: 15000, title: '導き手' }, service: 'apprentice', steps: [
    T('「あ、あの！ 師匠を探してるんです。ガロウっていう剣士で……一年前に“鍛え直してくる”って出ていったきりで」'),
    { k: 'visit', zones: ['in:w_vermion_guild', 'in:w_elmgard_guild', 'in:w_drakford_guild'], label: '各地のギルドで師匠の目撃情報を集める', text: '師匠ガロウの目撃情報を集める（ヴェルミオン・エルムガルド・ドラクフォードのギルド）' },
    { k: 'choice', teach: true, text: '旅の途中、リオが「何を一番鍛えるべきですか」と聞いてきた。', options: [
      { id: 'blade', label: '前に立つ強さ（剣と盾）', effect: 'リオは前衛として鍛えることにした', next: true },
      { id: 'scout', label: '道を読む力（探索と弓）', effect: 'リオは斥候として鍛えることにした', next: true },
      { id: 'support', label: '仲間を守る技（支援と杖）', effect: 'リオは支援役として鍛えることにした', next: true }] },
    { k: 'escort', npc: 'rio', n: 15, text: 'リオをパーティーに入れて一緒に魔物を15体倒す（リオは自分で判断して戦い、成長する）' },
    { k: 'meet', npc: 'garou', text: 'ドラクフォードの鍛冶場で師匠ガロウを見つける' },
    T('ガロウは鍛冶場の用心棒をしていた。「……剣が錆びてな。弟子に見せる顔がなかった」'),
    { k: 'choice', text: 'リオと師匠の再会。二人の道をどうする？', options: [
      { id: 'reunite', label: '師弟として再び旅立たせる', effect: 'ガロウとリオは再び師弟として旅を始めた', world: { flag: 'rio:reunite' } },
      { id: 'independent', label: 'リオが独り立ちする道を選ぶ', effect: 'リオはヘイヴンの新人教官になった', world: { flag: 'rio:independent' } },
      { id: 'training', label: '師匠から正式な修行を受けさせる', effect: 'リオはガロウのもとで修行を始めた', world: { flag: 'rio:training' } },
      { id: 'inherit', label: '師匠の教えを受け継がせる', effect: 'ガロウは自らの剣をリオに託した', world: { flag: 'rio:inherit' } }] }] },
  nx12: { npc: 'lily', reward: { xp: 15000, title: '王族の友人' }, service: 'diplomacy', steps: [
    T('「こんにちは！ 旅の途中なの。この街の市場、案内してくれる？」'),
    { k: 'days', n: 2, text: '日をまたいで2回、リリィと買い物や食事をする' },
    { k: 'visit', zones: ['in:w_vermion_item', 'in:w_vermion_inn'], label: 'リリィと道具屋と宿の食堂を巡る', text: 'リリィと街を巡る（道具屋・宿の食堂）' },
    { k: 'quiz', text: '食堂で、遠くの席の男たちがリリィから目を離さない。彼女の首飾りには小さな紋章があった。', q: '白百合と七本の街道の紋章が示すのは？', options: ['ヴェルミオン商人ギルド', 'アルセリア王家', '聖都の教会'], a: 1 },
    T('「……ばれちゃった。私はリリアーナ。アルセリア王家の第二王女よ。民の暮らしを、自分の目で見たかったの」'),
    { k: 'choice', text: 'リリアーナは「どうするのが正しいと思う？」と尋ねた。', options: [
      { id: 'hide', label: '正体を秘密にして旅を続けさせる', effect: 'リリィは普通の旅人として旅を続けた', world: { flag: 'heir:hide' } },
      { id: 'public', label: '正体を公表する', effect: '第二王女の市井の旅が評判になった', world: { flag: 'heir:public' } },
      { id: 'reform', label: '見聞きしたことで改革を支える', effect: '王宮で市場税の見直しが始まった', world: { flag: 'heir:reform', supply: { city: 'arcelia', v: 0.1 } } },
      { id: 'journey', label: '旅を手助けする', effect: 'リリィは次の街へ旅立った', world: { flag: 'heir:journey' } },
      { id: 'duty', label: '王族の責任を果たすよう説得する', effect: 'リリアーナは王宮に戻り、公務に励むようになった', world: { flag: 'heir:duty' } }] }] },
};
// apprentice growth by what the player taught (applied to the world NPC)
export const RIO_PATHS = { blade: { wt: 1, name: '前衛' }, scout: { wt: 44, name: '斥候' }, support: { wt: 53, name: '支援' } };
export const DIPLOMACY = ['vermion', 'luminas', 'drakford', 'marinelia', 'celestia_holy', 'elmgard'];
