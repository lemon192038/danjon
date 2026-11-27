// WEAPON IDENTITY (directive: weapon identity, unique mechanics & skill visuals). Per weapon type: a theme (weapon
// circle family) and variants. Each weapon of the type gets one variant (by name keywords, else by index), which
// defines its silhouette/structure (look), its unique mechanic (server-side, data), its trade-offs, and its unique
// skill (name matches the actual effect). Weapon names, stats and acquisition are unchanged.
// Wave 1 types: 76 操偶杖, 1 片手剣, 64 変形武器, 23 鎖鎌, 75 楽器武器, 14 槍, 48 精霊弓, 52 魔導砲.
import { buildWave2 } from './identity2.js';
import { WT_BY_ID } from './weaponTypes.js';
const r2 = v => Math.round(v * 100) / 100;
const V = (key, label, kw, o) => ({ key, label, kw, ...o });
export const IDENTITY = {
  // ── 76 操偶杖: puppets are real actors with their own body, AI, attack and command skills
  76: { theme: 'thread', variants: [
    V('guard', '白銀型（防御人形）', /白|銀|聖|守|盾/, { look: { head: 'box', threads: 2, ring: 0 }, sil: '箱型の人形収納頭部',
      mech: { k: 'puppet', kind: 'pGuard', max: 2, dur: 30000 }, ability: '大型の盾人形を2体まで召喚。主の前に立ち攻撃を受け止める', style: '守りながら戦う', pros: '頑丈で主を守る', cons: '攻撃力が低く足が遅い',
      skill: { name: '傀儡陣・鉄壁布陣', cat: '人形指揮・防御', eff: () => [{ t: 'cmd', c: 'formation', dur: 6000, dr: 0.35 }], target: '召喚中の全人形', limit: '人形がいないと陣を組めない。布陣中は人形が攻撃しない' } }),
    V('iron', '黒鉄型（重装人形）', /黒|鉄|鋼|重|岩/, { look: { head: 'cage', threads: 3, ring: 0 }, sil: '鉄格子の檻を頭に持つ杖',
      mech: { k: 'puppet', kind: 'pIron', max: 2, dur: 30000 }, ability: '重装甲の人形が敵の攻撃を引き付ける（挑発）', style: '囮で隙を作る', pros: '非常に硬く敵を引き付ける', cons: 'ほとんど攻撃しない',
      skill: { name: '傀儡転位・身代わり', cat: '人形指揮・位置交換', eff: () => [{ t: 'cmd', c: 'swap' }], target: '主から最も遠い人形', limit: '人形がいないと発動できない。入れ替わった人形は挑発と障壁を得る' } }),
    V('sniper', '星詠み型（射撃人形）', /星|月|天|光|詠/, { look: { head: 'ring', threads: 4, ring: 1 }, sil: '浮遊する輪を持つ杖',
      mech: { k: 'puppet', kind: 'pSniper', max: 3, dur: 25000 }, ability: '遠距離から光線を撃つ細身の人形を3体まで召喚', style: '距離を取って撃ち合う', pros: '射程が長い', cons: '人形が脆い',
      skill: { name: '十傀・一斉光砲', cat: '人形指揮・一斉射撃', eff: m => [{ t: 'cmd', c: 'volley', max: 10, m: r2(m * 0.6) }], target: '主に近い順に最大10体の人形が、それぞれの照準の敵へ', limit: '人形がいなければ発射できない。発射中の人形は通常行動を止める' } }),
    V('twin', '双生型（連携人形）', /双|対|二|鏡|ツイン/, { look: { head: 'twin', threads: 2, ring: 0 }, sil: '二股に分かれた杖頭', 
      mech: { k: 'puppet', kind: 'pTwin', max: 4, dur: 25000, pair: 1 }, ability: '互いに連携する二体一組の人形を召喚（二組まで）', style: '素早い連携攻撃', pros: '数が多く連携で強くなる', cons: '一体ずつは弱い',
      skill: { name: '百傀・追撃連鎖', cat: '人形指揮・連鎖攻撃', eff: m => [{ t: 'cmd', c: 'chain', max: 8, m: r2(m * 0.5) }], target: '最も近い敵', limit: '前の人形の攻撃が当たると次の人形が続く。外れると連鎖が止まる' } }),
    V('mask', '百貌型（換装人形）', /百|貌|仮面|面|千/, { look: { head: 'masks', threads: 5, ring: 1 }, sil: '複数の仮面が連なる杖頭',
      mech: { k: 'puppet', kind: 'pMask', max: 3, dur: 25000 }, ability: '敵との距離で近接と射撃を切り替える人形を召喚', style: '状況に合わせて戦う', pros: 'どの距離でも戦える', cons: 'どの形態も専門の人形に劣る',
      skill: { name: '百貌・換装号令', cat: '人形指揮・形態切替', eff: () => [{ t: 'cmd', c: 'reform', dur: 8000 }], target: '召喚中の全人形', limit: '人形がいないと意味がない。換装中は攻撃速度が上がる' } }),
    V('calamity', '災厄型（大傀儡）', /災|魔|冥|獄|滅|終/, { look: { head: 'skull', threads: 6, ring: 0 }, sil: '巨大な髑髏の杖頭',
      mech: { k: 'puppet', kind: 'pCalamity', max: 1, dur: 30000 }, ability: '巨大な大傀儡を1体だけ召喚する', style: '一体の大傀儡で押し潰す', pros: '一撃が重く範囲が広い', cons: '1体のみで動きが遅い',
      skill: { name: '災傀・大地砕き', cat: '人形指揮・範囲攻撃', eff: m => [{ t: 'cmd', c: 'slam', m: r2(m * 1.3), r: 90 }], target: '大傀儡の周囲', limit: '大傀儡がいないと発動しない' } })] },
  // ── 1 片手剣: eight distinct blade structures
  1: { theme: 'bladearc', variants: [
    V('wave', '波刃', /波|潮|ウェーブ|流/, { look: { edge: 'wave' }, sil: '刀身が波打つ剣', mech: { k: 'wave', m: 0.35, rng: 140 }, ability: 'コンボの締めで斬撃の波を飛ばす', style: '中距離へ波を飛ばす', pros: '締めが遠くに届く', cons: '通常の斬撃はやや軽い', mods: { atk: -0.03 },
      skill: { name: '三重波濤斬', cat: '飛ぶ斬撃', eff: (m, el, st) => [{ t: 'hit', shape: { s: 'proj', spd: 9, rng: 220, sz: 10, n: 3, sp: 12, pierce: 9, wave: 1 }, m: r2(m * 0.5), status: st }], target: '前方の扇状3方向', limit: '近すぎる敵には当たりにくい' } }),
    V('split', '分割刃', /分|裂|割|散/, { look: { edge: 'split' }, sil: '刃が複数に分割された剣', mech: { k: 'split', n: 2, spread: 0.5, m: 0.3 }, ability: '斬撃が分かれて左右にも当たる', style: '囲まれても戦える', pros: '攻撃範囲が広い', cons: '一点への威力が下がる', mods: { atk: -0.06 },
      skill: { name: '散刃・五連分裂', cat: '分裂斬撃', eff: (m, el, st) => [0, -40, 40, -80, 80].map(rot => ({ t: 'hit', shape: { s: 'arc', r: 56, a: 50, rot }, m: r2(m * 0.35), status: st })), target: '前方の5方向', limit: '正面の一体には1発しか当たらない' } }),
    V('core', '結晶核', /結晶|晶|クリスタル|核|石/, { look: { edge: 'core' }, sil: '中央に魔力結晶を内蔵した剣', mech: { k: 'core', max: 5, m: 0.25, r: 60 }, ability: '命中で結晶に魔力を溜め、5段で締めが炸裂する', style: '溜めて爆発させる', pros: '溜まると強烈', cons: '溜まるまでは普通の剣',
      skill: { name: '結晶炸裂・核開放', cat: '蓄積解放', eff: m => [{ t: 'cmd', c: 'coreBurst', m: r2(m * 0.6), r: 70 }], target: '周囲', limit: '溜めた魔力の段数で威力が変わる。0段だと弱い' } }),
    V('deploy', '展開刃', /展|翼|広|開/, { look: { edge: 'deploy' }, sil: '使用時に刃が左右へ展開する剣', mech: { k: 'deploy', m: 0.6, r: 70 }, ability: 'コンボの締めで刃が展開し、大きく薙ぎ払う', style: '締めで一掃する', pros: '締めの範囲が非常に広い', cons: '攻撃がやや遅い', mods: { aspd: -0.05 },
      skill: { name: '展刃・半月薙ぎ', cat: '広域斬撃', eff: (m, el, st) => [{ t: 'hit', shape: { s: 'arc', r: 76, a: 210 }, m: r2(m * 1.2), kb: 60, status: st }], target: '前方の半月範囲', limit: '背後には届かない' } }),
    V('orbit', '浮遊刃', /浮|舞|飛|翔|輪/, { look: { edge: 'plain', orbit: 3 }, sil: '刃の周囲に3枚の浮遊刃を持つ剣', mech: { k: 'orbit', n: 3, m: 0.18, r: 70 }, ability: '周囲を回る3枚の浮遊刃が、攻撃のたびに近くの敵を斬る', style: '手数で押す', pros: '周囲の敵にも削りが入る', cons: '本体の斬撃が軽い', mods: { atk: -0.05 },
      skill: { name: '浮遊刃・六方包囲', cat: '包囲斬撃', eff: m => [{ t: 'cmd', c: 'orbitStorm', n: 6, m: r2(m * 0.3) }], target: '最も近い敵を6方向から', limit: '近くに敵がいないと浮遊刃は戻ってくる' } }),
    V('whip', '伸縮刃', /伸|鞭|蛇|長/, { look: { edge: 'whip' }, sil: '鞭のように伸縮する細い刀身', mech: { k: 'reach', mul: 1.5, tip: 0.2 }, ability: '刀身が伸び、間合いが1.5倍。先端で当てると威力が上がる', style: '間合いの外から斬る', pros: '間合いが長い', cons: '近距離の威力が下がる', mods: { atk: -0.08 },
      skill: { name: '伸刃・十間突き', cat: '長距離刺突', eff: (m, el, st) => [{ t: 'hit', shape: { s: 'beam', l: 260, w: 10 }, m: r2(m * 1.1), pen: 0.3, status: st }], target: '前方一直線（貫通）', limit: '幅が細く外しやすい' } }),
    V('mana', '魔力刃', /魔|霊|幻|虚|マナ/, { look: { edge: 'mana' }, sil: '刀身がなく魔力で刃を形成する柄', mech: { k: 'mana', cost: 2 }, ability: '刃が魔力でできており、攻撃が武器の属性になる（攻撃ごとにSPを少し使う）', style: '属性で弱点を突く', pros: '属性攻撃になる', cons: 'SPを消費し続ける',
      skill: { name: '魔刃・虚空形成', cat: '属性光刃', eff: (m, el, st) => [{ t: 'hit', shape: { s: 'beam', l: 180, w: 24 }, m, el: el || 'void', status: st }], target: '前方の太い光刃', limit: '射程は中程度' } }),
    V('link', '連結刃', /連|鎖|節|結/, { look: { edge: 'link' }, sil: '攻撃時に刃が連結・分離する節刃', mech: { k: 'link', m: 0.5 }, ability: 'コンボの締めで分離した刃がもう一度斬る', style: '連撃で畳みかける', pros: '締めが2回当たる', cons: '1撃目が少し弱い',
      skill: { name: '連結刃・鎖断ち', cat: '多段斬撃', eff: (m, el, st) => [{ t: 'hit', shape: { s: 'arc', r: 54, a: 150 }, m: r2(m * 0.55), status: st, echo: 240, echoN: 3 }], target: '前方（4段）', limit: '途中で吹き飛ばすと後の段が外れる' } })] },
  // ── 64 変形武器: each variant transforms into a different second form (the type's transform key)
  64: { theme: 'transform', variants: [
    V('axe', '斧変形', /斧|アックス|断|砕/, { look: { joint: 'gear', alt: 'axe' }, sil: '刃の背に折り畳まれた斧頭', mech: { k: 'alt', combo: [{ s: 'arc', r: 50, a: 160, m: 1.3, t: [220, 120, 260], st: 5 }, { s: 'slam', d: 26, r: 40, m: 1.8, t: [320, 140, 320], st: 8, kb: 60 }] }, ability: '変形すると重い斧の二連撃になる', style: '変形で一撃を重くする', pros: '変形後の一撃が重い', cons: '変形後は手数が少ない',
      skill: { name: '可変斧・断頭落とし', cat: '変形斬撃', eff: (m, el, st) => [{ t: 'hit', shape: { s: 'slam', d: 30, r: 46 }, m: r2(m * 1.5), st: 8, exec: { th: 0.3, m: 1.6 }, status: st }], target: '正面の一点', limit: '範囲が狭い' } }),
    V('cannon', '砲変形', /砲|銃|キャノン|機/, { look: { joint: 'gear', alt: 'cannon' }, sil: '刀身の中に砲身を内蔵', mech: { k: 'alt', combo: [{ s: 'proj', spd: 11, rng: 240, sz: 6, m: 0.9, t: [160, 80, 220], aoe: 30 }, { s: 'proj', spd: 13, rng: 260, sz: 8, m: 1.4, t: [260, 100, 300], aoe: 46, kb: 40 }] }, ability: '変形すると砲撃で戦う（着弾で爆発）', style: '近接と砲撃の切り替え', pros: '遠距離から範囲攻撃', cons: '砲撃形態は近接に弱い',
      skill: { name: '可変砲・榴弾連射', cat: '変形砲撃', eff: (m, el, st) => [{ t: 'barrage', n: 4, r: 40, spread: 70, delay: 400, interval: 160, m: r2(m * 0.55), status: st }], target: '照準位置の周囲4発', limit: '着弾まで時間がかかる' } }),
    V('scythe', '鎌変形', /鎌|死|冥|刈/, { look: { joint: 'hinge', alt: 'scythe' }, sil: '刃が直角に開いて鎌になる', mech: { k: 'alt', combo: [{ s: 'arc', r: 62, a: 220, m: 1.0, t: [200, 120, 220] }, { s: 'circle', r: 64, m: 1.2, t: [240, 140, 280], pull: 20 }] }, ability: '変形すると広く刈り取る鎌になる', style: '群れを刈る', pros: '範囲が広く引き寄せる', cons: '単体には威力不足',
      skill: { name: '可変鎌・円環刈り', cat: '変形範囲斬撃', eff: (m, el, st) => [{ t: 'hit', shape: { s: 'circle', r: 80 }, m: r2(m * 0.9), pull: 40, status: st }], target: '周囲の全方位', limit: '中心から離れると当たらない' } }),
    V('shield', '盾変形', /盾|守|城|壁/, { look: { joint: 'plate', alt: 'shield' }, sil: '刀身の両側に盾板が付く', mech: { k: 'alt', combo: [{ s: 'arc', r: 40, a: 120, m: 0.8, t: [180, 100, 220], kb: 40 }], altMods: { dr: 0.2 } }, ability: '変形すると盾になり、受けるダメージが20%減る', style: '守りを固めて押し返す', pros: '変形中は非常に硬い', cons: '変形中は攻撃が弱い',
      skill: { name: '可変盾・反撃の壁', cat: '変形防御', eff: m => [{ t: 'shield', amt: 0.3, dur: 5000 }, { t: 'counter', win: 800, m: r2(m * 1.6), shape: { s: 'circle', r: 56 }, reflect: 1 }], target: '自分', limit: '反撃は構えた直後だけ' } }),
    V('lance', '槍変形', /槍|突|ランス|貫/, { look: { joint: 'slide', alt: 'lance' }, sil: '刀身が伸びて槍になる', mech: { k: 'alt', combo: [{ s: 'beam', l: 120, w: 10, m: 1.0, t: [180, 80, 220] }, { s: 'beam', l: 160, w: 12, m: 1.4, t: [260, 100, 280], lg: 50 }] }, ability: '変形すると長い突きの槍になる', style: '間合いを伸ばして突く', pros: '射程が長く貫通する', cons: '横の敵に当たらない',
      skill: { name: '可変槍・伸長突撃', cat: '変形突進', eff: (m, el, st) => [{ t: 'dash', d: 140, inv: 200, hit: { s: 'beam', l: 60, w: 14 }, m: r2(m * 0.8), h: 2, status: st }], target: '突進の進路', limit: '壁にぶつかると止まる' } }),
    V('bow', '弓変形', /弓|矢|鳥|風/, { look: { joint: 'hinge', alt: 'bow' }, sil: '刃が上下に開いて弓になる', mech: { k: 'alt', combo: [{ s: 'proj', spd: 14, rng: 300, sz: 3, m: 0.7, t: [140, 60, 180], pierce: 1 }, { s: 'proj', spd: 14, rng: 300, sz: 3, m: 0.5, t: [200, 80, 220], n: 3, sp: 10 }] }, ability: '変形すると矢を放つ弓になる', style: '遠くから狙い撃つ', pros: '射程が最も長い', cons: '威力が低い',
      skill: { name: '可変弓・三連矢', cat: '変形射撃', eff: (m, el, st) => [{ t: 'hit', shape: { s: 'proj', spd: 15, rng: 320, sz: 3, n: 3, sp: 6, pierce: 2 }, m: r2(m * 0.55), status: st }], target: '前方3本', limit: '近すぎると外れる' } })] },
  // ── 23 鎖鎌: chain length and what hangs on it
  23: { theme: 'chain', variants: [
    V('long', '長鎖', /長|遠|蛇|竜/, { look: { chain: 8, tip: 'sickle' }, sil: '長い鎖の先に鎌', mech: { k: 'reach', mul: 1.4, tip: 0.25 }, ability: '鎖が長く、先端で当てると威力が上がる', style: '遠間から刈る', pros: '射程が長い', cons: '近くでは威力が落ちる', mods: { atk: -0.05 },
      skill: { name: '長鎖・遠薙ぎ', cat: '長距離薙ぎ', eff: (m, el, st) => [{ t: 'hit', shape: { s: 'arc', r: 110, a: 120 }, m: r2(m * 0.9), status: st }], target: '前方遠くまで扇状', limit: '自分の足元には当たらない' } }),
    V('weight', '分銅', /重|鉄|岩|砕/, { look: { chain: 5, tip: 'weight' }, sil: '鎌の反対に重い分銅', mech: { k: 'tip', stun: 600 }, ability: '鎖の先端（分銅）で当てると敵が気絶する', style: '止めて斬る', pros: '敵を止められる', cons: '先端で当てないと効果がない',
      skill: { name: '分銅打ち・脳天砕き', cat: '気絶打撃', eff: (m, el, st) => [{ t: 'hit', shape: { s: 'proj', spd: 10, rng: 160, sz: 7 }, m: r2(m * 1.1), st: 8, status: ['stun', 0.8, 1200] }], target: '前方の一体', limit: '一体にしか当たらない' } }),
    V('hook', '鉤鎖', /鉤|爪|引|縛/, { look: { chain: 6, tip: 'hook' }, sil: '鉤の付いた鎖', mech: { k: 'tip', pull: 30 }, ability: '鎖の先端で当てた敵を手元へ引き寄せる', style: '引き寄せて斬る', pros: '敵を引き寄せる', cons: '囲まれやすい',
      skill: { name: '鉤鎖・引き寄せ斬り', cat: '引き寄せ', eff: (m, el, st) => [{ t: 'hit', shape: { s: 'beam', l: 160, w: 12 }, m: r2(m * 0.6), pull: 80 }, { t: 'hit', shape: { s: 'arc', r: 50, a: 160 }, m: r2(m * 0.8), delay: 350, status: st }], target: '直線上の敵を引き寄せてから斬る', limit: '引き寄せは重い敵に効きにくい' } }),
    V('whirl', '旋鎖', /旋|風|渦|回/, { look: { chain: 6, tip: 'sickle', spin: 1 }, sil: '回転する二つの鎌', mech: { k: 'deploy', m: 0.5, r: 70, circle: 1 }, ability: 'コンボの締めで鎖を振り回し全方位を斬る', style: '囲まれても戦える', pros: '全方位攻撃', cons: '一撃が軽い', mods: { atk: -0.04 },
      skill: { name: '鎖旋風・円環薙ぎ', cat: '全方位連撃', eff: (m, el, st) => [{ t: 'dash', d: 60, inv: 300, hit: { s: 'circle', r: 70 }, m: r2(m * 0.4), h: 5, status: st }], target: '自分の周囲', limit: '動きながら回るので狙いが定まらない' } }),
    V('twin', '双鎌', /双|二|対|ツイン/, { look: { chain: 4, tip: 'twin' }, sil: '鎖の両端に鎌', mech: { k: 'link', m: 0.45 }, ability: 'コンボの締めでもう一方の鎌が追撃する', style: '連撃', pros: '締めが2回当たる', cons: '射程が短い', mods: { range: -0.1 },
      skill: { name: '双鎌・交差斬り', cat: '交差斬撃', eff: (m, el, st) => [{ t: 'hit', shape: { s: 'beam', l: 90, w: 14, rot: 35 }, m: r2(m * 0.7), status: st }, { t: 'hit', shape: { s: 'beam', l: 90, w: 14, rot: -35 }, m: r2(m * 0.7), status: st, delay: 120 }], target: '前方の交差範囲', limit: '交差の中心に当てると両方当たる' } }),
    V('venom', '毒鎖', /毒|蛇|腐|蠍/, { look: { chain: 6, tip: 'fang' }, sil: '牙の形をした鎌', mech: { k: 'tip', status: ['poison', 0.5, 3000] }, ability: '鎖の先端で当てると毒を与える', style: '毒で削る', pros: '毒で継続ダメージ', cons: '即効性がない',
      skill: { name: '毒鎖・蛇咬', cat: '毒連鎖', eff: (m, el, st) => [{ t: 'hit', shape: { s: 'proj', spd: 11, rng: 200, sz: 4, chain: 3 }, m: r2(m * 0.7), status: ['poison', 0.9, 4000] }], target: '敵から敵へ3回', limit: '毒が効かない敵がいる' } })] },
  // ── 75 楽器武器: a different melody every third attack
  75: { theme: 'notes', variants: [
    V('lute', 'リュート（癒しの旋律）', /リュート|癒|陽|春/, { look: { inst: 'lute' }, sil: '丸い胴のリュート', mech: { k: 'melody', every: 3, kind: 'heal' }, ability: '3回攻撃するごとに癒しの旋律で味方を回復', style: '戦いながら支える', pros: '継続回復', cons: '攻撃力が控えめ', mods: { atk: -0.05 },
      skill: { name: '癒しの旋律・陽だまりの歌', cat: '範囲回復', eff: () => [{ t: 'heal', amt: 0.2, r: 130 }, { t: 'zone', at: 'self', r: 110, dur: 6000, tick: 1000, heal: 0.03, ally: 1, el: 'holy' }], target: '周囲の味方', limit: '敵へのダメージはない' } }),
    V('drum', '太鼓（戦の律動）', /太鼓|鼓|雷|轟|戦/, { look: { inst: 'drum' }, sil: '腰に提げた戦太鼓', mech: { k: 'melody', every: 3, kind: 'beat' }, ability: '3回ごとに衝撃波を響かせる', style: '律動で押し返す', pros: '周囲を吹き飛ばす', cons: '射程が短い',
      skill: { name: '戦太鼓・地鳴りの三連打', cat: '衝撃波', eff: (m, el, st) => [0, 250, 500].map((d, i) => ({ t: 'hit', shape: { s: 'circle', r: 40 + i * 25 }, m: r2(m * 0.45), delay: d, kb: 30, status: st })), target: '自分の周囲に3回広がる', limit: '外側ほど遅れて届く' } }),
    V('flute', '横笛（風の調べ）', /笛|風|鳥|翼/, { look: { inst: 'flute' }, sil: '細長い横笛', mech: { k: 'melody', every: 3, kind: 'wind' }, ability: '3回ごとに風の音色が貫通する', style: '遠くへ届ける', pros: '貫通する遠距離攻撃', cons: '近距離が苦手',
      skill: { name: '風笛・疾風の調べ', cat: '貫通音波', eff: (m, el, st) => [{ t: 'hit', shape: { s: 'proj', spd: 12, rng: 280, sz: 5, n: 3, sp: 14, pierce: 4 }, m: r2(m * 0.5), el: 'wind', status: st }, { t: 'buff', mods: { move: 0.2 }, dur: 5000 }], target: '前方3方向に貫通', limit: '威力は低め' } }),
    V('violin', '弦楽器（不協和音）', /弦|呪|夜|悲/, { look: { inst: 'violin' }, sil: '弓で弾く弦楽器', mech: { k: 'melody', every: 3, kind: 'hex' }, ability: '3回ごとに不協和音で敵を鈍らせる', style: '弱らせて倒す', pros: '敵を遅くする', cons: '自分の威力は上がらない',
      skill: { name: '呪弦・不協和音', cat: '弱体の場', eff: (m, el, st) => [{ t: 'zone', at: 'target', r: 90, dur: 5000, tick: 600, m: r2(m * 0.15), slow: 0.45, status: ['curse', 0.6, 3000], el: 'dark' }], target: '狙った位置の範囲', limit: 'ダメージは小さい' } }),
    V('horn', '角笛（鬨の声）', /角|鬨|王|獅子|勇/, { look: { inst: 'horn' }, sil: '大きく曲がった角笛', mech: { k: 'melody', every: 3, kind: 'war' }, ability: '3回ごとに鬨の声で攻撃力が上がる', style: '味方を奮い立たせる', pros: '味方全体の攻撃強化', cons: '自分は無防備になりがち',
      skill: { name: '角笛・鬨の声', cat: '範囲強化', eff: () => [{ t: 'aura', r: 140, mods: { atk: 0.2, aspd: 0.1 }, dur: 10000 }], target: '周囲の味方', limit: '効果中もダメージは増えない場面がある（防御は上がらない）' } }),
    V('harp', '竪琴（守りの和音）', /竪琴|ハープ|聖|守|天/, { look: { inst: 'harp' }, sil: '弦が張られた三角の竪琴', mech: { k: 'melody', every: 3, kind: 'ward' }, ability: '3回ごとに守りの和音で障壁を張る', style: '守りを重ねる', pros: '障壁で被害を抑える', cons: '攻撃面は平凡',
      skill: { name: '竪琴・守りの和音', cat: '範囲障壁', eff: () => [{ t: 'shield', amt: 0.25, dur: 6000 }, { t: 'aura', r: 120, mods: { dr: 0.15 }, dur: 8000 }], target: '自分と周囲の味方', limit: '障壁は時間で消える' } })] },
  // ── 14 槍
  14: { theme: 'pierceline', variants: [
    V('crystal', '結晶槍', /結晶|晶|氷|クリスタル/, { look: { head: 'crystal' }, sil: '結晶の穂先', mech: { k: 'crystal', r: 30, m: 0.2, slow: 0.3, dur: 2500 }, ability: '突いた場所に結晶の棘が生え、触れた敵を遅くする', style: '地形を作って戦う', pros: '足止めできる', cons: '直接の威力は控えめ', mods: { atk: -0.04 },
      skill: { name: '結晶槍・晶棘陣', cat: '結晶設置', eff: (m, el, st) => [{ t: 'zone', at: 'target', r: 70, dur: 5000, tick: 500, m: r2(m * 0.25), slow: 0.5, el: el || 'ice' }], target: '狙った位置に結晶の棘', limit: '結晶は時間で砕ける' } }),
    V('thunder', '雷穂', /雷|迅|光|閃/, { look: { head: 'fork' }, sil: '二股の雷の穂先', mech: { k: 'spark', n: 2, m: 0.2 }, ability: '突きが当たると近くの敵に電撃が飛び移る', style: '群れを感電させる', pros: '複数に連鎖', cons: '連鎖は弱い',
      skill: { name: '雷穂・迅雷突き', cat: '雷撃刺突', eff: (m, el, st) => [{ t: 'hit', shape: { s: 'beam', l: 200, w: 12 }, m, el: 'thunder', status: ['shock', 0.5, 1500] }], target: '前方一直線', limit: '雷に強い敵には効きにくい' } }),
    V('long', '長柄', /長|天|遠|貫/, { look: { head: 'long' }, sil: '非常に長い柄', mech: { k: 'reach', mul: 1.3, tip: 0.15 }, ability: '間合いが長く、穂先で当てると威力が上がる', style: '間合いで勝つ', pros: '射程が長い', cons: '懐に入られると弱い', mods: { atk: -0.03 },
      skill: { name: '長柄・一閃貫通', cat: '長距離刺突', eff: (m, el, st) => [{ t: 'hit', shape: { s: 'beam', l: 300, w: 10 }, m: r2(m * 1.1), pen: 0.4, status: st }], target: '前方一直線（貫通）', limit: '細く外しやすい' } }),
    V('twin', '双頭槍', /双|二|対/, { look: { head: 'twin' }, sil: '両端に穂先', mech: { k: 'link', m: 0.4 }, ability: 'コンボの締めで反対側の穂先が追撃する', style: '連撃', pros: '締めが2回当たる', cons: '射程がやや短い', mods: { range: -0.1 },
      skill: { name: '双頭・連突二閃', cat: '二連刺突', eff: (m, el, st) => [{ t: 'hit', shape: { s: 'beam', l: 150, w: 12 }, m: r2(m * 0.7), status: st }, { t: 'hit', shape: { s: 'beam', l: 150, w: 12 }, m: r2(m * 0.7), delay: 200, status: st }], target: '前方一直線を2回', limit: '途中で敵が逃げると2発目が外れる' } }),
    V('hook', '鉤槍', /鉤|爪|引/, { look: { head: 'hook' }, sil: '穂先の横に鉤', mech: { k: 'tip', pull: 25 }, ability: '穂先で当てた敵を引き寄せる', style: '引き寄せて仕留める', pros: '敵を引き寄せる', cons: '引き寄せると反撃も受けやすい',
      skill: { name: '鉤槍・引き倒し', cat: '引き倒し', eff: (m, el, st) => [{ t: 'hit', shape: { s: 'beam', l: 160, w: 14 }, m: r2(m * 0.8), pull: 70, status: ['stun', 0.5, 800] }], target: '前方の敵を引き寄せて転ばせる', limit: '重い敵は動かない' } }),
    V('wind', '風槍', /風|嵐|空|翔/, { look: { head: 'wind' }, sil: '風の刃を纏う穂先', mech: { k: 'wave', m: 0.3, rng: 160 }, ability: 'コンボの締めで風の刃が飛ぶ', style: '突きと風で戦う', pros: '締めが遠くに届く', cons: '通常の突きが軽い', mods: { atk: -0.03 },
      skill: { name: '風槍・空裂き', cat: '飛ぶ刺突', eff: (m, el, st) => [{ t: 'hit', shape: { s: 'proj', spd: 13, rng: 300, sz: 6, pierce: 9, wave: 1 }, m, el: 'wind', status: st }], target: '前方へ飛ぶ風刃', limit: '風に強い敵には効きにくい' } })] },
  // ── 48 精霊弓: spirit creatures fly instead of some arrows
  48: { theme: 'bowstring', variants: [
    V('hawk', '鷹の精霊', /鷹|鳥|翼|空|風/, { look: { spirit: 'hawk' }, sil: '翼の形の弓', mech: { k: 'spiritShot', every: 4, kind: 'sHawk' }, ability: '4射ごとに鷹の精霊が飛び出し敵に急降下する', style: '素早く削る', pros: '精霊が速く追いかける', cons: '精霊は脆い',
      skill: { name: '鷹の精霊・急降下強襲', cat: '精霊強襲', eff: (m, el, st) => [{ t: 'barrage', n: 5, r: 24, spread: 60, delay: 300, interval: 90, m: r2(m * 0.4), status: st, el: el || 'wind' }], target: '照準位置に5回の急降下', limit: '着弾まで少し時間がかかる' } }),
    V('wolf', '狼の精霊', /狼|牙|獣|森/, { look: { spirit: 'wolf' }, sil: '牙の飾りの弓', mech: { k: 'spiritShot', every: 5, kind: 'sWolf' }, ability: '5射ごとに狼の精霊が駆け出し噛みつく', style: '精霊と挟み撃ち', pros: '精霊が前に出て戦う', cons: '発生間隔が長い',
      skill: { name: '狼の精霊・群狼の狩り', cat: '精霊召喚', eff: (m, el) => [{ t: 'summon', kind: 'sWolf', n: 3, dur: 9000, m: r2(m * 0.3), el }], target: '近くの敵を狼3体が追う', limit: '狼は時間で消える' } }),
    V('wisp', '光の精霊', /光|聖|灯|星/, { look: { spirit: 'wisp' }, sil: '灯火を宿す弓', mech: { k: 'spiritShot', every: 5, kind: 'sWisp' }, ability: '5射ごとに光の精霊が現れ、主を癒す', style: '回復しながら撃つ', pros: '継続回復', cons: '光の精霊は攻撃しない',
      skill: { name: '光精・癒しの灯', cat: '精霊回復', eff: () => [{ t: 'heal', amt: 0.18, r: 100 }, { t: 'summon', kind: 'sWisp', n: 2, dur: 10000, m: 0.2 }], target: '自分と周囲の味方', limit: 'ダメージはない' } }),
    V('serpent', '蛇の精霊', /蛇|毒|沼|蠍/, { look: { spirit: 'serpent' }, sil: '蛇が巻き付いた弓', mech: { k: 'spiritShot', every: 4, kind: 'sSerpent' }, ability: '4射ごとに蛇の精霊が這い出し毒を与える', style: '毒で削る', pros: '毒の継続ダメージ', cons: '即効性がない',
      skill: { name: '蛇精・毒牙の矢', cat: '毒連鎖', eff: (m, el, st) => [{ t: 'hit', shape: { s: 'proj', spd: 12, rng: 260, sz: 4, chain: 4 }, m: r2(m * 0.6), status: ['poison', 0.9, 4000] }], target: '敵から敵へ4回', limit: '毒が効かない敵がいる' } }),
    V('owl', '梟の精霊', /梟|夜|月|眼|見/, { look: { spirit: 'owl' }, sil: '目の装飾がある弓', mech: { k: 'spiritShot', every: 5, kind: 'sOwl' }, ability: '5射ごとに梟の精霊が敵を見張り、会心率を高める', style: '急所を狙う', pros: '会心が出やすい', cons: '精霊自体は弱い',
      skill: { name: '梟精・見破りの眼', cat: '会心強化', eff: () => [{ t: 'buff', mods: { crit: 0.25, critDmg: 0.3 }, dur: 8000 }, { t: 'summon', kind: 'sOwl', n: 1, dur: 8000, m: 0.2 }], target: '自分', limit: '会心以外の威力は変わらない' } }),
    V('salamander', '火蜥蜴の精霊', /火|炎|紅|焔|竜/, { look: { spirit: 'salamander' }, sil: '炎の紋が走る弓', mech: { k: 'spiritShot', every: 4, kind: 'sSalamander' }, ability: '4射ごとに火蜥蜴が走り、通った地面を燃やす', style: '炎で囲む', pros: '範囲の燃焼', cons: '火に強い敵には弱い',
      skill: { name: '火蜥蜴・炎走り', cat: '炎の道', eff: (m, el, st) => [{ t: 'hit', shape: { s: 'proj', spd: 8, rng: 220, sz: 8, pierce: 9 }, m: r2(m * 0.6), el: 'fire', status: ['burn', 0.7, 3000] }, { t: 'zone', at: 'target', r: 60, dur: 4000, tick: 500, m: r2(m * 0.15), el: 'fire' }], target: '前方へ走る火蜥蜴と燃える地面', limit: '燃える地面は動かない' } })] },
  // ── 52 魔導砲: bullet mechanisms
  52: { theme: 'scope', variants: [
    V('rail', '貫通弾', /レール|雷|貫|閃/, { look: { barrel: 'long' }, sil: '細長い砲身', mech: { k: 'bullet', pierce: 4, spd: 1.4, m: 0.95 }, ability: '弾が速く、敵を貫通する', style: '一列をまとめて撃ち抜く', pros: '貫通する', cons: '一発の威力がやや低い',
      skill: { name: '貫通弾・レールショット', cat: '貫通射撃', eff: (m, el, st) => [{ t: 'hit', shape: { s: 'beam', l: 320, w: 8 }, m: r2(m * 1.2), pen: 0.5, status: st }], target: '前方一直線（貫通）', limit: '細く外しやすい' } }),
    V('scatter', '散弾', /散|拡|嵐|乱/, { look: { barrel: 'wide' }, sil: '短く太い砲口', mech: { k: 'bullet', n: 4, sp: 9, m: 0.4, rng: 0.6 }, ability: '弾が4つに散る（近距離で強い）', style: '近距離で撃つ', pros: '近距離の範囲攻撃', cons: '射程が短い',
      skill: { name: '散弾・十二連拡散', cat: '拡散射撃', eff: (m, el, st) => [{ t: 'hit', shape: { s: 'proj', spd: 10, rng: 150, sz: 3, n: 12, sp: 7 }, m: r2(m * 0.22), status: st }], target: '前方の広い扇', limit: '遠くには届かない' } }),
    V('grenade', '榴弾', /榴|爆|火|紅/, { look: { barrel: 'drum' }, sil: '回転弾倉付き', mech: { k: 'bullet', aoe: 34, spd: 0.8, m: 0.9 }, ability: '弾が着弾で爆発する', style: '群れに撃ち込む', pros: '範囲攻撃', cons: '弾が遅い',
      skill: { name: '榴弾・着弾爆裂', cat: '範囲砲撃', eff: (m, el, st) => [{ t: 'barrage', n: 1, r: 80, spread: 0, delay: 500, m: r2(m * 1.4), st: 6, status: st }], target: '照準位置の大爆発', limit: '着弾まで時間がかかる' } }),
    V('cryo', '凍結弾', /氷|凍|霜|雪/, { look: { barrel: 'coil' }, sil: '冷却管を巻いた砲身', mech: { k: 'bullet', status: ['freeze', 0.12, 1200], el: 'ice' }, ability: '弾が氷属性になり、まれに凍らせる', style: '足止めして撃つ', pros: '敵を凍らせる', cons: '氷に強い敵には弱い',
      skill: { name: '凍結弾・氷檻', cat: '凍結射撃', eff: (m, el, st) => [{ t: 'hit', shape: { s: 'proj', spd: 10, rng: 240, sz: 6, aoe: 40 }, m, el: 'ice', status: ['freeze', 0.6, 1500] }], target: '着弾点の周囲', limit: 'ボスは凍りにくい' } }),
    V('homing', '追尾弾', /追|導|星|眼/, { look: { barrel: 'twin' }, sil: '照準器付きの二連砲身', mech: { k: 'bullet', hom: 0.12, m: 0.85 }, ability: '弾が敵を追いかける', style: '動きながら撃つ', pros: '当てやすい', cons: '一発がやや軽い',
      skill: { name: '追尾弾・六連誘導', cat: '誘導射撃', eff: (m, el, st) => [{ t: 'hit', shape: { s: 'proj', spd: 8, rng: 300, sz: 4, n: 6, sp: 30, hom: 0.15 }, m: r2(m * 0.35), status: st }], target: '近くの敵を自動で追う6発', limit: '1発ずつは弱い' } }),
    V('charge', '充填砲', /充|極|天|砲/, { look: { barrel: 'cannon' }, sil: '巨大な砲身と充填炉', mech: { k: 'bullet', m: 1.3, aspd: 0.8 }, ability: '一発が重いが連射が遅い', style: '狙って一撃', pros: '一発が非常に重い', cons: '連射できない', mods: { aspd: -0.15 },
      skill: { name: '充填砲・極光の一撃', cat: '溜め砲撃', eff: (m, el, st) => [{ t: 'hit', shape: { s: 'beam', l: 280, w: 30 }, m: r2(m * 1.6), st: 8, delay: 500, status: st }], target: '前方の太い光線', limit: '発射まで0.5秒動けない' } })] },
};
export const WAVE1 = Object.keys(IDENTITY).map(Number);
Object.assign(IDENTITY, buildWave2(id => WT_BY_ID[id].name)); // wave 2: the remaining 78 types from the archetype catalog
export const IDENTITY_TYPES = Object.keys(IDENTITY).map(Number);
// keywords are matched on the weapon's own name with the type name's characters removed (so 「魔弓」 does not make every bow a 魔力 bow)
export function variantOf(w) { const T = IDENTITY[w.wt]; if (!T) return null; const vs = T.variants; const tn = WT_BY_ID[w.wt]?.name.replace(/（.*）/, '') || ''; const nm = [...w.name].filter(c => !tn.includes(c)).join('');
  return vs.find(v => v.kw.test(nm)) || vs[w.idx % vs.length]; }
// summon bodies (puppets and spirits): body, AI, attack — used by the server simulation and the client drawing
export const SUMMON_BODIES = {
  pGuard: { name: '白銀の盾人形', hp: 1.1, r: 10, ai: 'guard', move: 0.7, atk: 'slam', cd: 1100, m: 0.8, taunt: true, dr: 0.25, body: { h: 18, w: 10, head: 'helm', arms: 'shield', col: '#d8dce8' } },
  pIron: { name: '黒鉄の重人形', hp: 1.6, r: 11, ai: 'guard', move: 0.5, atk: 'arc', cd: 1500, m: 0.5, taunt: true, dr: 0.4, body: { h: 19, w: 12, head: 'visor', arms: 'heavy', col: '#4a4e58' } },
  pSniper: { name: '星詠みの射手人形', hp: 0.35, r: 6, ai: 'ranged', rng: 260, keep: 150, move: 1.0, atk: 'beam', cd: 1500, m: 1.2, body: { h: 15, w: 6, head: 'lens', arms: 'rifle', col: '#c8d8ff' } },
  pTwin: { name: '双生人形', hp: 0.4, r: 6, ai: 'melee', move: 1.3, atk: 'arc', cd: 650, m: 0.6, link: true, body: { h: 12, w: 6, head: 'round', arms: 'blades', col: '#ffd0e0' } },
  pMask: { name: '百貌の人形', hp: 0.6, r: 7, ai: 'adapt', rng: 200, move: 1.0, atk: 'adapt', cd: 850, m: 0.7, body: { h: 15, w: 8, head: 'mask', arms: 'mixed', col: '#e8c890' } },
  pCalamity: { name: '災厄の大傀儡', hp: 2.6, r: 16, ai: 'melee', move: 0.45, atk: 'quake', cd: 2200, m: 2.2, body: { h: 30, w: 18, head: 'skull', arms: 'claws', col: '#6a3050' } },
  sHawk: { name: '鷹の精霊', hp: 0.2, r: 5, ai: 'dive', move: 2.0, atk: 'arc', cd: 900, m: 0.7, fly: 1, body: { kind: 'hawk', col: '#a0ffd0' } },
  sWolf: { name: '狼の精霊', hp: 0.45, r: 7, ai: 'melee', move: 1.6, atk: 'arc', cd: 700, m: 0.6, body: { kind: 'wolf', col: '#c0d0ff' } },
  sWisp: { name: '光の精霊', hp: 0.25, r: 5, ai: 'support', move: 1.2, atk: 'heal', cd: 2000, m: 0, heal: 0.03, fly: 1, body: { kind: 'wisp', col: '#fff8c0' } },
  sSerpent: { name: '蛇の精霊', hp: 0.3, r: 5, ai: 'melee', move: 1.1, atk: 'bite', cd: 900, m: 0.4, status: ['poison', 0.6, 3000], body: { kind: 'serpent', col: '#90e070' } },
  sOwl: { name: '梟の精霊', hp: 0.25, r: 5, ai: 'ranged', rng: 180, keep: 120, move: 1.2, atk: 'mark', cd: 1600, m: 0.3, fly: 1, body: { kind: 'owl', col: '#d0b080' } },
  sSalamander: { name: '火蜥蜴の精霊', hp: 0.35, r: 6, ai: 'melee', move: 1.4, atk: 'trail', cd: 700, m: 0.5, el: 'fire', body: { kind: 'salamander', col: '#ff8040' } },
};
