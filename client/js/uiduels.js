// Duel events UI: the Wandering Swordmaster and the Masquerade Tournament.
const e = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export function installDuels(UI) {
  const P = UI.prototype; const prevPanel = P.cityPanel;
  P.cityPanel = function (s, data) { if (s === 'raven' || s === 'masq') { this.svc = data; if (this.panel !== s || !this.modalOpen) this.open(s, s); else this.render(); return true; } return prevPanel.call(this, s, data); };
  const prevAct = P.cityAct; P.cityAct = function (a, t) { const d = t.dataset;
    if (a === 'rv') { this.closeModal(); return this.net.menu('raven', { act: d.do }) || true; }
    if (a === 'mq') { if (d.do !== 'qualify') this.closeModal(); return this.net.menu('masq', { act: d.do }) || true; }
    return prevAct.call(this, a, t); };
  P.p_raven = function () { const d = this.svc;
    return this.wrap(`${e(d.name)} <small>${e(d.job)} ・ 「${e(d.weapon)}」</small>`, `<p class="say">${e(d.line)}</p>
      <p>あなたとの決闘：${d.fights}戦 ・ 敗北${d.losses}</p><p>勝利した武器種：${d.wins.map(w => `${e(w.wt)}×${w.n}`).join('、') || 'まだない'}</p>
      ${d.trueWon ? '<p class="good">「無銘の極致」を越えた。レイヴァンは今もあなたの再戦を受けてくれる。</p>' : d.canTrue ? '<p class="warn">レイヴァンの気配が変わった――隠し試練「無銘の極致」に挑める</p>' : `<p class="dim">あと${d.need}つの武器種で彼に勝てば、何かが起きる。</p>`}
      <p class="dim"><small>彼は戦うたびにあなたの癖を覚え、次の戦いで戦術を変えてくる。今の武器：${e(d.myWt)}</small></p>
      <button class="primary" data-act="rv" data-do="duel">決闘を申し込む</button> ${d.canTrue ? '<button class="primary" data-act="rv" data-do="true">「無銘の極致」に挑む</button>' : ''}`); };
  P.p_masq = function () { const d = this.svc;
    const st = d.stage >= 2 ? (d.todayDone ? '<p class="dim">今日の大会には出場済み。また明日。</p>' : '<button class="primary" data-act="mq" data-do="register">登録して出場する（参加費1,000G）</button>') : `<button class="primary" data-act="mq" data-do="qualify" ${d.lv < 30 ? 'disabled' : ''}>資格を示し、仮面を受け取る（Lv30以上）</button>`;
    return this.wrap('仮面の武闘祭 <small>THE MASQUERADE TOURNAMENT</small>', `<p class="say">${e(d.guide.line)}</p>
      <p>大会の流れ：${d.rounds.map(e).join(' → ')}</p><p class="dim"><small>参加者の名前・職業・称号は伏せられ、外見は大会用の装束に統一される（能力はそのまま）。特殊な参加者が紛れ込むことがある。</small></p>
      <p>優勝 ${d.titles}回 ・ 正体の記録 ${d.records}/3</p>${st}
      ${d.canFace ? '<p class="warn">仮面の王の正体を掴んだ。素顔の王に挑めば「闘技王」への道が開く。</p><button class="primary" data-act="mq" data-do="face">素顔の王に挑む</button>' : d.faced ? '<p class="good">素顔の王を破った</p>' : ''}`); };
}
