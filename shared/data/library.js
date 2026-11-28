// PHASE 8 data: the Sealed Abyss under Arcelia, the Great Library and the Forbidden Archive (books), the Seven Sins and
// the bishop seats (initial NPC holders). Texts are short in-world fragments that seed later events (observers, god-machines).
const band = (name, layout, pal, fam, gim, boss, bossName) => ({ name, layout, pal, fam, gim, boss, bossName });
const B1 = [
  band('忘却の地下墓地', 'maze', 'grave', ['skeleton', 'zombie', 'shade'], ['curseZone'], 'graveGiant', '墓守の巨人'),
  band('腐蝕の菌窟', 'cave', 'fungus', ['spider', 'treant', 'slime'], ['poisonFog'], 'rotMother', '腐蝕母樹'),
  band('灼熱の地底炉', 'rooms', 'lava', ['elemFire', 'construct', 'demon'], ['lava', 'eruption'], 'ironExecutioner', '熔鉄の処刑者'),
  band('沈黙の水没神殿', 'islands', 'abyssSea', ['lizard', 'abyssal', 'wisp'], ['water', 'current'], 'deepPriest', '深海の祭司'),
  band('失われた機械都市', 'rooms', 'metal', ['construct', 'golem', 'crystal'], ['conveyor', 'laser'], 'ordius', '機械王オルディウス')];
// floors 51-100: the same five environments, deeper and harsher (C-12: 51-100 were not specified)
const B2 = B1.map(b => ({ ...b, name: '深層・' + b.name, gim: [...b.gim, 'darkness'], bossName: '真・' + b.bossName }));
export const SEALED = { id: 'sealed', name: '封印されし深淵', theme: 'abyss', desc: '王都アルセリアの地下に眠る禁忌の階層迷宮（HARD以上限定）', minLv: 60, maxFloor: 100, hidden: true, hardOnly: true, bands: [...B1, ...B2] };
export const SEALED_BOSSES = [['graveGiant', '墓守の巨人', 'brute', ['slam', 'charge', 'summon', 'rage']], ['rotMother', '腐蝕母樹', 'beast', ['poisonBite', 'regrow', 'summon', 'breath']],
  ['ironExecutioner', '熔鉄の処刑者', 'brute', ['charge', 'spin', 'burnAura', 'rage']], ['deepPriest', '深海の祭司', 'humanoid', ['tidal', 'curseField', 'heal', 'blink']], ['ordius', '機械王オルディウス', 'golem', ['laser', 'shield', 'quake', 'timeStop']]];
export const KEY_RATE = floor => floor / 10 / 100; // P(%) = boss floor / 10, rolled per player per kill

export const SINS = {
  greed: { name: '強欲', book: '『万象を欲する者』', trial: '果てなき所有権', theme: '奪取・収集・複製・資源蓄積・所有', ai: { aggression: 0.7, parry: 0.3, hp: 3 }, style: '相手の装備とスキル構成を分析し、弱点を突く', npc: ['マモン・ヴェルクラウン', 37] },
  gluttony: { name: '暴食', book: '『飽くなき饗宴』', trial: '終わらぬ饗宴', theme: '吸収・捕食・適応・魔力摂食', ai: { aggression: 0.8, parry: 0.25, hp: 3.6 }, style: '相手の攻撃特性を学習し、吸収・適応する', npc: ['ベルゼ・グランメル', 25] },
  envy: { name: '嫉妬', book: '『天上を妬む者』', trial: '鏡像の王', theme: '模倣・反射・鏡写し', ai: { aggression: 0.65, parry: 0.4, hp: 3, mirror: true }, style: '戦闘パターンを模倣する', npc: ['レヴィア・ミラージュ', 1] },
  sloth: { name: '怠惰', book: '『怠惰なる永劫』', trial: '永劫の静寂', theme: '自律機構・自動化・停滞', ai: { aggression: 0.45, parry: 0.3, hp: 3.4, summon: true }, style: '自律機構を展開する', npc: ['ベルフェ・スリープウォーカー', 51] },
  pride: { name: '傲慢', book: '『傲慢なる創世記』', trial: '王座なき王', theme: '領域支配・威圧・王権', ai: { aggression: 0.9, parry: 0.2, hp: 3.2 }, style: '強力な攻撃と領域支配を行う', npc: ['ルシフェ・オルドレクス', 14] },
  wrath: { name: '憤怒', book: '『憤怒の黙示録』', trial: '怒りの終着点', theme: '反撃・防御・パリィ', ai: { aggression: 0.5, parry: 0.6, hp: 3.4 }, style: '防御・パリィ・反撃を中心に戦う', npc: ['サタナ・グラヴィウス', 4] },
  lust: { name: '色欲', book: '『悦楽の深淵』', trial: '七つの心鏡', theme: '幻惑・魅了（NPC・魔物のみ。プレイヤーの意思は強制しない）', ai: { aggression: 0.6, parry: 0.35, hp: 3 }, style: '幻惑で間合いを乱す（プレイヤーの意思は強制しない）', npc: ['アスモ・ヴェールローズ', 60] },
};
export const SIN_KEYS = Object.keys(SINS);

const bk = (id, cat, title, pages, fx = {}) => ({ id, cat, title, pages, ...fx });
export const BOOK_CATS = { heresy: '異端書', taboo: '禁忌書', lost: '失伝書', prophecy: '予言書', other: '異界書', sin: '大罪の書' };
export const BOOKS = [
  bk('celestial', 'heresy', '『天球の欺瞞』', ['夜空の星は、本当に遠くにあるのだろうか。', '観測を続けた著者は、星々が「描かれている」と結論した。その記述は途中で途切れている。']),
  bk('creation', 'heresy', '『神々は世界を創造したのか』', ['神話は世界の始まりを語る。しかし神話を語ったのは誰か。', '著者は、神々より先に「記録する者」がいたと記した。']),
  bk('proof', 'heresy', '『魔力の存在証明』', ['魔力は観測されるから存在するのか、存在するから観測されるのか。', '証明は七つの基礎魔法の構造から出発する――原初の焔、古代王の門、双極の環、虚空の扉、刻停め、星霊召喚、無の理。', '全てを重ねた先に、名前のない式がある。著者はそれを第零と呼んだ。'], { flag: 'proofOfMana' }),
  bk('lineage', 'heresy', '『生命の系譜』', ['魔物と人は同じ根から分かれた――という仮説。', '系譜図の最上段は、空白のまま残されている。']),
  bk('soul', 'taboo', '『魂の再構築』', ['魂を記録として扱い、写し取る研究の記録。', '研究者たちは「記録は戻せても、本人は戻らない」と結論し、研究を封じた。'], { flag: 'soulFragment' }),
  bk('nullmagic', 'taboo', '『無属性魔法の真実』', ['無属性とは属性がないのではなく、全ての属性を打ち消した後に残るものだ。', '無の理を扱う者は、自分の存在まで薄めてしまう危険がある。']),
  bk('copy', 'taboo', '『存在の複製』', ['同じ物を二つ作ることはできる。同じ「者」を作ることはできるのか。', '頁の後半は丁寧に切り取られている。']),
  bk('beyonddeath', 'taboo', '『死を超える理論』', ['死を終わりではなく「記録の終了」と捉える理論。', '結びには一行だけ。「終わらない記録は、もう物語ではない」']),
  bk('rift', 'taboo', '『空間の裂け目』', ['世界には縫い目がある。縫い目の向こうは、こちらと同じ形をしていない。', '裂け目の位置を示す地図は、なぜか毎回違う形に見える。']),
  bk('causality', 'taboo', '『因果律の観測』', ['原因と結果の間には、観測者がいる。', '観測者が目を離した瞬間だけ、世界は少しだけ自由になる。']),
  bk('nomana', 'taboo', '『魔力を持たぬ魔術師』', ['魔力を一切持たない者が、なぜか魔法を使えた記録。', '彼は「世界の側に頼んだだけだ」と答えたという。']),
  bk('godmachine', 'lost', '『神機文明年代記』', ['かつて魔法と機械が一つだった時代があった。', '神機と呼ばれた存在は、ある日いっせいに沈黙した。']),
  bk('chronospace', 'lost', '『時空間の研究』', ['時は川のように流れるのではない。刻まれた瞬間が、一枚ずつ積み重なっているだけだ。', '一枚の刻を押さえれば、その上にあるものは動けない。止まった刻の中では、放たれた刃もまた止まる。', '刻を押さえる者は、刻を離す瞬間を選べる。――著者の名は削り取られ、王都の古い時計屋の印だけが残っている。']),
  bk('lostjobs', 'lost', '『失われた職業体系』', ['現在の職業体系は、古い体系の一部に過ぎない。', '欠けた頁には、名前だけが残る職業がいくつも並んでいる。']),
  bk('fusion', 'lost', '『機械と魔法の融合論』', ['魔力を歯車に流す方法。', '最後の図面には、人の形をした機構が描かれている。']),
  bk('firstgen', 'lost', '『第一世代の神機使い』', ['神機と心を通わせた最初の世代の記録。', '彼らは神機を「道具」ではなく「隣人」と呼んだ。']),
  bk('computer', 'lost', '『世界を演算する装置』', ['この世界のすべてを計算し続ける装置がどこかにある、という説。', '装置が止まれば、世界はどうなるのか。答えは書かれていない。']),
  bk('workshop', 'lost', '『忘れられた工房への道』', ['神機を造った工房への道順。', '地名はどれも、今の地図には存在しない。']),
  bk('sevencal', 'prophecy', '『七つの災厄と最後の観測者』', ['七つの災厄が目を覚ますとき、最後の観測者が現れる。', '黒い月は、その合図に過ぎない。'], { moon: 6 }),
  bk('thisside', 'other', '『こちら側の世界について』', ['「こちら側」という言葉を使う著者は、明らかに「あちら側」を知っている。', '本は、読者に向かって話しかける文体で書かれている。']),
  bk('observerlog', 'other', '『観測者の記録』', ['観測者は世界に干渉しない。ただ記録する。', '最後の記録：「この世界は、まだ観測に値する」'], { moon: 6 }),
  bk('zeroworld', 'other', '『第零世界』', ['この世界が「第一」なら、その前には何があったのか。', '第零世界の頁は、白紙のまま綴じられている。']),
  bk('unrecorded', 'other', '『記録されない存在』', ['どの記録にも残らない者がいる。', 'その者は、自分が読まれていることに気づいている。']),
  bk('outside', 'other', '『現実の外側』', ['外側から見れば、この世界は一冊の本のようなものかもしれない。', '頁をめくる手は、誰のものだろう。']),
  bk('player', 'other', '『プレイヤーという概念』', ['世界の外から、世界の中の誰かを動かす存在――「プレイヤー」。', 'アーカイヴはこの本について、何も語ろうとしない。']),
  ...Object.entries(SINS).map(([k, s]) => bk('sin_' + k, 'sin', s.book, [`${s.name}の罪について記された異端の書。`, `テーマ：${s.theme}。`, `最後の頁には試練の名が刻まれている――「${s.trial}」。`], { sin: k })),
];
export const BOOK_BY_ID = Object.fromEntries(BOOKS.map(b => [b.id, b]));
