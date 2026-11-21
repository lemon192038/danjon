// Step-by-step guided tutorial. Progress is stored server-side (ch.progress.tut). Steps advance on real actions.
const STEPS = [
  { id: 'welcome', title: 'ようこそ ABYSS : ETERNAL FRONTIER へ', pc: 'この世界で武器・職業・スキルを組み合わせ、100階のダンジョンに挑もう。まずは基本操作を覚えよう。', touch: 'この世界で武器・職業・スキルを組み合わせ、100階のダンジョンに挑もう。まずは基本操作を覚えよう。', next: true },
  { id: 'move', ev: 'move', title: '移動', pc: 'W A S D キーで移動しよう。', touch: '画面の左半分のどこかに指を置いて動かすと移動できる。キャラクターは指の方向を向くよ。' },
  { id: 'attack', ev: 'attack', title: '通常攻撃', pc: 'マウスで狙いを定め、左クリックで攻撃。押し続けると武器ごとのコンボが続く。', touch: '右下の大きな「攻撃」ボタンで攻撃。押し続けるとコンボが続き、近くの敵へ自動で狙いを合わせる。' },
  { id: 'dodge', ev: 'dodge', title: '回避', pc: 'Space で回避。回避中は無敵！ 敵の攻撃予告（赤い範囲）が見えたら避けよう。', touch: '「回避」ボタンで回避。回避中は無敵！ 敵の攻撃予告（赤い範囲）が見えたら避けよう。' },
  { id: 'skill', ev: 'skill', title: 'スキル', pc: '1〜4キーでスキル発動（マウスの位置へ）。スキルはSPを消費し、使うほど成長する。', touch: '攻撃ボタンの周りの4つがスキル。SPを消費して強力な技を放つ。使うほど成長する。' },
  { id: 'special', ev: 'special', title: '武器の特殊アクション', pc: '右クリック（またはShift）で武器種ごとの特殊アクション。ガード・溜め・居合・変形など武器ごとに違う！', touch: '左下の「◆特殊」で武器種ごとの特殊アクション。ガード・溜め・居合・変形など武器ごとに違う！ 長押しが有効な武器もある。' },
  { id: 'menu', ev: 'menu', title: 'メニュー', pc: 'K でスキル画面を開こう。4つのスロットに好きなスキルをセットできる（武器種・武器固有・レベル・職業の4系統）。', touch: '右上の「スキル」を開こう。4つのスロットに好きなスキルをセットできる（武器種・武器固有・レベル・職業の4系統）。' },
  { id: 'talk', ev: 'interact', title: '街の人と話す', pc: '▼印の人物（店・ギルド・門番）や◆NPC冒険者に近づいて F キー。転職は職業ギルド、強化は鍛冶屋で。', touch: '▼印の人物（店・ギルド・門番）や◆NPC冒険者に近づいて「💬会話」。転職は職業ギルド、強化は鍛冶屋で。' },
  { id: 'field', ev: 'zone:field', title: 'フィールドへ', pc: '街の東の出口（青く光るマス）から「翠風の平原」へ出よう。', touch: '街の東の出口（青く光るマス）から「翠風の平原」へ出よう。' },
  { id: 'kill', ev: 'kill3', title: 'モンスター討伐', pc: 'モンスターを3体倒そう。経験値・お金・武器熟練度が手に入り、熟練度で新スキルを覚える。HPが減ったら Q で回復薬。', touch: 'モンスターを3体倒そう。経験値・お金・武器熟練度が手に入り、熟練度で新スキルを覚える。HPが減ったら「⚗回復」。' },
  { id: 'dungeon', ev: 'zone:dungeon', title: 'ダンジョンへ', pc: '平原の紫の門（◆翠緑の古洞）に近づいて F → 難易度を選んで入場。各階の階段を探して下へ進もう。', touch: '平原の紫の門（◆翠緑の古洞）に近づいて「💬会話」→ 難易度を選んで入場。各階の階段を探して下へ進もう。' },
  { id: 'done', title: 'チュートリアル完了！', pc: 'レベルアップでステータスポイントを振ろう（C）。職業（J）は条件で上位職が解放される。困ったら設定（O）から操作説明を確認できる。良い冒険を！', touch: 'レベルアップでステータスポイントを振ろう（ステータス）。職業は条件で上位職が解放される。困ったら設定から操作説明を確認できる。良い冒険を！', next: true, last: true },
];
export class Tutorial {
  constructor(net, isTouch) {
    this.net = net; this.isTouch = isTouch; this.step = null; this.kills0 = null;
    this.el = document.createElement('div'); this.el.id = 'tutorial'; document.getElementById('hud').appendChild(this.el);
    this.el.addEventListener('click', e => { const a = e.target.dataset.tut; if (a === 'next') this.advance(); if (a === 'skip') this.set(STEPS.length); });
  }
  sync(ch) { if (this.step === null) this.set(ch.progress.tut || 0, true); if (this.cur?.ev === 'kill3') { if (this.kills0 === null) this.kills0 = ch.progress.kills; if (ch.progress.kills - this.kills0 >= 3) this.advance(); } }
  get cur() { return STEPS[this.step]; }
  set(i, silent) { this.step = i; if (!silent) this.net.menu('tut', { s: i }); this.kills0 = null; this.render(); }
  restart() { this.net.menu('tut', { s: 0, reset: 1 }); this.step = 0; this.render(); }
  advance() { this.set(this.step + 1); }
  event(ev) { if (this.cur && this.cur.ev === ev) { clearTimeout(this.t); this.t = setTimeout(() => this.advance(), 600); } }
  render() {
    const s = this.cur; if (!s) { this.el.style.display = 'none'; return; }
    this.el.style.display = 'block';
    this.el.innerHTML = `<div class="th"><b>${s.title}</b><span>${this.step + 1}/${STEPS.length}</span></div><p>${this.isTouch() ? s.touch : s.pc}</p><div class="tb">${s.next ? `<button data-tut="next" class="primary">${s.last ? '閉じる' : '次へ'}</button>` : '<span class="wait">▶ やってみよう</span>'}${s.last ? '' : '<button data-tut="skip" class="ghost">スキップ</button>'}</div>`;
  }
}
