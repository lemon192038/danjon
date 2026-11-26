// PHASE 8 UI: Great Library reception, the Forbidden Archive (books, Seven Sins, bishop seats and succession history).
const e = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const when = t => { const d = new Date(t); return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
export function installLib(UI) {
  const P = UI.prototype; const prevPanel = P.cityPanel;
  P.cityPanel = function (s, data) { if (s === 'library' || s === 'archive') { this.svc = data; if (this.panel !== s || !this.modalOpen) this.open(s, s); else this.render(); return true; } return prevPanel.call(this, s, data); };
  const prevAct = P.cityAct; P.cityAct = function (a, t) { const d = t.dataset;
    if (a === 'libEnter') { this.closeModal(); this.net.menu('library', { act: 'enter' }); return true; }
    if (a === 'arTab') { this.arTab = d.v; this.render(); return true; }
    if (a === 'bkOpen') { this.book = { id: d.v, page: +d.p, text: null }; const b = this.svc.books.find(x => x.id === d.v); this.net.menu('library', { act: 'read', id: d.v, page: b?.done ? 1 : +d.p > 0 ? 0 : 1 }); this.render(); return true; }
    if (a === 'bkNext') { this.net.menu('library', { act: 'read', id: this.book.id, page: this.book.page + 1 }); return true; }
    if (a === 'bkClose') { this.book = null; this.net.menu('library', { act: 'view' }); return true; }
    if (a === 'sinPick') { this.net.menu('sinRoute', { sin: d.v }); return true; }
    if (a === 'sinTrial') { this.closeModal(); this.net.menu('library', { act: 'trial' }); return true; }
    if (a === 'succ') { this.closeModal(); this.net.menu('library', { act: 'challenge', sin: d.v }); return true; }
    return prevAct.call(this, a, t); };
  P.initLib = function () { this.net.on('book', m => { if (!this.book || this.book.id !== m.id) this.book = { id: m.id }; Object.assign(this.book, { page: m.page, text: m.text, last: !!m.last }); if (this.panel === 'archive') this.render(); }); };
  P.p_library = function () { const d = this.svc;
    return this.wrap('大図書館 <small>受付</small>', `<p class="say">「ようこそ、王立大図書館へ。三層の書架には世界史・魔法史・文化・地理・生態の書が揃っております」</p>
      <p>禁書庫の鍵：<b>${d.keys}</b>本 <small class="dim">（封印されし深淵の10階ごとのボスから。取引・売却不可）</small></p>
      ${d.keys ? '<p class="warn">鍵が淡く光っている……。受付の奥に、記録にない扉がある。</p><button class="primary" data-act="libEnter">鍵を1本使って禁書庫へ</button>' : '<p class="dim">書架の書物は自由に読めます（館内の本棚を調べる）。</p>'}`); };
  P.p_archive = function () { const d = this.svc; const tab = this.arTab || 'books';
    const tabs = `<div class="tabs">${[['books', '書架'], ['sins', '七つの大罪'], ['seats', '大罪司教の座']].map(([k, n]) => `<button class="${tab === k ? 'sel' : ''}" data-act="arTab" data-v="${k}">${n}</button>`).join('')}</div>`;
    let body = `<p class="say">記録管理者アーカイヴ：${e(d.line)}</p>`;
    if (this.book) { const b = d.books.find(x => x.id === this.book.id); body += `<div class="det"><h3>${e(b?.title)}</h3><p class="dim">${this.book.page || 0} / ${b?.n} 頁</p><p class="say">${e(this.book.text || '…')}</p>
        ${this.book.last || (b && this.book.page >= b.n) ? '<p class="good">読み終えた。</p>' : '<button class="primary" data-act="bkNext">次の頁へ</button>'} <button data-act="bkClose">書架へ戻る</button></div>`; return this.wrap('禁書庫', body, tabs); }
    if (tab === 'books') body += Object.entries(d.cats).map(([c, n]) => `<h4>${e(n)}</h4><div class="slist">${d.books.filter(b => b.cat === c).map(b => `<div class="irow" data-act="bkOpen" data-v="${b.id}" data-p="${b.page}"><span>${b.done ? '✓ ' : ''}${e(b.title)}</span><small>${b.done ? '読了' : b.page ? `${b.page}/${b.n}頁` : '未読'}</small></div>`).join('')}</div>`).join('');
    if (tab === 'sins') body += `<p>${d.heretic ? '異端者として、七つの研究ルートが開かれている。' : '<span class="dim">大罪の書を1冊読み終えると「異端者」が解放される（Lv60）。</span>'} 主ルート：<b>${d.route ? e(d.sins.find(x => x.k === d.route).name) : '未選択'}</b></p>
      <div class="slist">${d.sins.map(x => `<div class="srow ${d.route === x.k ? 'sel' : ''}"><div class="sh"><b>${e(x.name)}</b><small>${e(x.book)} ・ 最終試練「${e(x.trial)}」</small></div><p><small>${e(x.theme)}</small></p>
        <p>${x.sinner != null ? `罪人 熟練度${x.sinner}` : ''}${x.trialDone ? ' ・ <span class="good">試練達成</span>' : ''}${x.bishop ? ' ・ <span class="good">大罪司教</span>' : ''}</p>
        ${d.heretic && !d.route ? `<button data-act="sinPick" data-v="${x.k}">主ルートに選ぶ</button>` : ''}${d.route === x.k && !x.trialDone ? `<button class="primary" data-act="sinTrial" ${x.sinner >= 8 && d.lv >= 100 ? '' : 'disabled'}>最終試練に挑む（罪人熟練度8・Lv100）</button>` : ''}</div>`).join('')}</div>
      <p class="dim"><small>罪人への進化には主ルートの選択が必要（進化後は変更不可）。最終試練は何度でも挑め、失敗しても職業や熟練度は失わない。大罪司教は1キャラクター1系統。他ルートの書も読める。</small></p>`;
    if (tab === 'seats') body += `<div class="slist">${d.sins.map(x => `<div class="srow"><div class="sh"><b>${e(x.name)}の座</b><small>${x.seat.kind === 'npc' ? 'NPC' : 'プレイヤー'} ・ ${when(x.since)}〜</small></div><p>現職：<b>${e(x.seat.name)}</b>${x.mine ? '（あなた）' : ''} ・ 戦い方：${e(x.style)}</p>
        ${d.route === x.k && !x.mine ? `<button class="primary" data-act="succ" data-v="${x.k}">継承決闘を申し込む</button>` : ''}</div>`).join('')}</div>
      <h4>継承の歴史</h4>${d.hist.length ? `<div class="slist">${d.hist.map(h => `<div class="irow"><span>${when(h.t)} ${e(h.by)} → ${e(h.vs)}</span><small>${e(d.sins.find(x => x.k === h.sin)?.name)}の座 ・ ${e(h.result)} ・ ${e(h.byJob)} / ${e(h.byWt)}</small></div>`).join('')}</div>` : '<p class="dim">まだ継承決闘は行われていない</p>'}
      ${d.former.length ? `<h4>元大罪司教</h4><p>${d.former.map(f => `${e(f.name)}（${e(d.sins.find(x => x.k === f.sin)?.name)}）`).join('、')}</p>` : ''}
      <p class="dim"><small>NPCの現職は必ず決闘を受ける。プレイヤーの現職には、その記録された戦い方（AI）と戦う。座を得ても、試練の報酬は試練でしか得られない。</small></p>`;
    return this.wrap('禁書庫', body, tabs); };
}
