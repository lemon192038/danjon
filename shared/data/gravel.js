// Gravel (スラム・グレイヴェル): the seven underworld organisations. Names fixed by the directive.
// power/wealth/members are starting values; the world simulation moves them over time (server/game/orgs.js).
export const ORGS = {
  crow: { name: '黒鴉商会', color: '#3a3a4a', leader: '「鴉頭」ヴィクトル・ノワール', officers: ['帳場主任ミレーユ', '運び屋頭ガスパール'], members: 140, power: 60, wealth: 80, district: 'market',
    income: '盗品・密輸品の売買と高利貸し', goal: 'グレイヴェルの闇市場を独占し、王都の商人ギルドと対等に渡り合う', allies: ['blackforge'], enemies: ['redsnake', 'nameless'], trade: ['contraband', 'goods', 'art'], hostileBelow: -15, fams: ['thug', 'carrier', 'gunman'],
    desc: '灰色市場の元締め。金と帳簿で裏社会を動かす商人集団。', event: '黒鴉の大競り（闇の競売会の主催）' },
  ironclaw: { name: '鉄爪団', color: '#8a5a3a', leader: '団長ブルーノ「鉄爪」グリム', officers: ['拳闘士ロッコ', '見張り頭エルダ'], members: 220, power: 75, wealth: 40, district: 'alley',
    income: '用心棒代と地下闘技場の賭け', goal: '腕っぷしでスラム全域を縄張りにする', allies: [], enemies: ['shadowstitch', 'crow'], trade: ['material', 'consumable'], hostileBelow: 0, fams: ['thug', 'enforcer', 'thug'],
    desc: '元傭兵の荒くれ者集団。力こそ正義、縄張り争いが絶えない。', event: '鉄爪団の縄張り拡大' },
  shadowstitch: { name: '影縫い', color: '#2a2a3a', leader: '頭領「無声」シオン', officers: ['影糸のナギ', '帳消しのコウ'], members: 60, power: 55, wealth: 60, district: 'roof',
    income: '暗殺・諜報・誘拐の請負', goal: '王都の権力者の弱みを握り、影から王国を操る', allies: ['ashbell'], enemies: ['ironclaw'], trade: ['info', 'contraband'], hostileBelow: 10, fams: ['enforcer', 'gunman'],
    desc: '屋根伝いに動く暗殺者たち。姿を見た者はほとんどいない。', event: '影縫いの粛清' },
  redsnake: { name: '赤蛇組', color: '#b02a2a', leader: '組長「赤蛇」カルミネ', officers: ['毒師ベアトリス', '賭場番トト'], members: 160, power: 60, wealth: 70, district: 'alley',
    income: '賭場・違法薬物・みかじめ料', goal: '黒鴉商会から市場を奪い、賭場と薬で富を築く', allies: [], enemies: ['crow', 'nameless'], trade: ['contraband', 'consumable'], hostileBelow: 0, fams: ['thug', 'gunman', 'enforcer'],
    desc: '赤い蛇の刺青を持つ博徒の一家。薬と賭場でスラムを蝕む。', event: '赤蛇組の賭場荒らし' },
  ashbell: { name: '灰鐘教団', color: '#9a8a7a', leader: '大司祭「灰の声」オルド', officers: ['鐘撞きのリーネ', '異端審問官ヴァルス'], members: 120, power: 45, wealth: 50, district: 'hill',
    income: '信者の寄進と禁制品の儀式具', goal: '灰の鐘を鳴らし、世界の「やり直し」を迎える', allies: ['shadowstitch'], enemies: ['nameless'], trade: ['artifact', 'arcane'], hostileBelow: 5, fams: ['heretic', 'heretic', 'enforcer'],
    desc: '終末を待つ異端の教団。灰の鐘の音は信者を狂信へ導く。', event: '灰の鐘の夜（集団儀式）' },
  blackforge: { name: '黒炉工房', color: '#4a2a1a', leader: '親方グラド・ベルン', officers: ['火口番イルザ', '刃研ぎのテオ'], members: 50, power: 40, wealth: 55, district: 'forge',
    income: '無許可の武器製作と改造', goal: '王国の鍛冶規制に縛られない、最高の武器を打つ', allies: ['crow'], enemies: [], trade: ['material', 'mech'], hostileBelow: -30, fams: ['enforcer', 'thug'],
    desc: 'ドワーフの鍛冶師グラドが率いる無許可工房。腕は王都随一。', event: '黒炉の火入れ' },
  nameless: { name: '無名の子供たち', color: '#c8b070', leader: '「年長」のリト', officers: ['見張りのピピ', '物知りのセナ'], members: 90, power: 25, wealth: 15, district: 'home',
    income: 'スリ・使い走り・情報売り', goal: '誰にも売られず、誰にも消されずに大人になる', allies: [], enemies: ['redsnake', 'crow'], trade: ['info', 'consumable'], hostileBelow: -40, fams: ['scav', 'scav'],
    desc: '親を持たない子供たちの互助集団。スラムのあらゆる噂を知っている。', event: '消えた子供たちの捜索' },
};
export const ORG_IDS = Object.keys(ORGS);
