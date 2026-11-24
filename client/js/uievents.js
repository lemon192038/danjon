// Event journal UI: all known events with search / filter / sort, personal log, world history, titles & discoveries.
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const WS = { dormant: '沈静', omen: '前兆', active: '発生中', resolved: '終息' };
const ago = t => { const m = Math.round((Date.now() - t) / 60000); return m < 60 ? `${m}分前` : m < 1440 ? `${Math.round(m / 60)}時間前` : `${Math.round(m / 1440)}日前`; };
export function installEvents(UI) {
  const P = UI.prototype;
  const prevPanel = P.cityPanel; P.cityPanel = function (s, data) { if (s === 'journal') { if (this.panel !== 'journal' || !this.modalOpen) this.open('journal', s); this.journal = data; this.render(); return true; } return prevPanel.call(this, s, data); };
  const prevAct = P.cityAct; P.cityAct = function (a, t) {
    if (a === 'jtab') { this.jtab = t.dataset.v; this.render(); return true; }
    if (a === 'jsort') { this.jsort = t.dataset.v; this.render(); return true; }
    if (a === 'jsel') { this.jsel = t.dataset.v; this.render(); return true; }
    return prevAct.call(this, a, t); };
  P.p_journal = function () {
    const d = this.journal; if (!d) { this.net.menu('events'); return this.wrap('イベント記録', '<p>読み込み中…</p>'); }
    const tab = this.jtab || 'list'; const tabs = `<div class="tabs">${[['list', 'イベント'], ['log', '個人の記録'], ['world', '世界の歴史'], ['titles', '称号・発見']].map(([k, n]) => `<button class="${tab === k ? 'sel' : ''}" data-act="jtab" data-v="${k}">${n}</button>`).join('')}</div>`;
    let body = '';
    if (tab === 'list') {
      const q = (this.sel.search || '').trim(); const f = this.sel.jfilter || 'all'; const sort = this.jsort || 'recent';
      let list = d.list.filter(e => (!q || (e.name + e.en + e.loc.join('') + e.kinds.join('')).includes(q)) && (f === 'all' || (f === 'active' ? e.me && !e.me.done : f === 'done' ? e.me?.done : f === 'world' ? e.world && e.world.state !== 'dormant' : e.group === f)));
      list.sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name, 'ja') : sort === 'group' ? a.group.localeCompare(b.group) : (b.me?.started || 0) - (a.me?.started || 0));
      const groups = [...new Set(d.list.map(e => e.group))];
      const sel = d.list.find(e => e.id === this.jsel) || list[0];
      body = `<div class="jbar"><input data-search placeholder="検索（名前・地域・分類）" value="${esc(q)}"> <select data-set="jfilter"><option value="all">すべて</option><option value="active" ${f === 'active' ? 'selected' : ''}>進行中</option><option value="done" ${f === 'done' ? 'selected' : ''}>達成済み</option><option value="world" ${f === 'world' ? 'selected' : ''}>世界で発生中</option>${groups.map(g => `<option value="${esc(g)}" ${f === g ? 'selected' : ''}>${esc(g)}</option>`).join('')}</select>
        <span class="dim">並び:</span> ${[['recent', '最近'], ['name', '名前'], ['group', '分類']].map(([k, n]) => `<button class="${sort === k ? 'sel' : ''}" data-act="jsort" data-v="${k}">${n}</button>`).join('')}</div>
        <div class="split"><div class="list">${list.map(e => `<div class="irow ${sel?.id === e.id ? 'sel' : ''}" data-act="jsel" data-v="${e.id}"><span>${e.me?.done ? '✔ ' : e.me ? '▶ ' : e.world?.state === 'active' ? '⚠ ' : ''}${esc(e.name)}</span><small>${esc(e.loc[0] || '')}</small></div>`).join('') || '<p class="dim">該当なし</p>'}</div>
        <div class="det">${sel ? `<h3>${esc(sel.name)} <small>${esc(sel.en || '')}</small></h3><p class="dim">${esc(sel.group)} ・ ${sel.kinds.map(esc).join('・')}</p><p>地域：${sel.loc.map(esc).join('、')}</p><p>発生条件：${esc(sel.trigger)}</p>
          ${sel.world ? `<p>世界の状態：<b>${WS[sel.world.state]}</b>（発生回数${sel.world.count}${sel.world.outcome ? '・' + esc(sel.world.outcome) : ''}）</p>` : ''}
          ${sel.stages.length ? `<ol class="stages">${sel.stages.map((st, i) => `<li class="${sel.me ? (sel.me.done || i < sel.me.stage ? 'good' : i === sel.me.stage ? 'cur' : 'dim') : 'dim'}">${sel.me && (sel.me.done || i <= sel.me.stage) ? esc(st) : '？？？'}</li>`).join('')}</ol>` : ''}
          ${sel.me ? `<p>${sel.me.done ? `<b class="good">${sel.status === 'live' && sel.group.startsWith('既存') ? '記録あり' : '達成'}</b>${sel.me.outcome ? '：' + esc(sel.me.outcome) : ''}` : '進行中'} ・ 挑戦${sel.me.attempts}回${sel.me.clears ? ` ・ 達成${sel.me.clears}回` : ''}</p>` : '<p class="dim">まだ関わっていない</p>'}
          ${sel.status === 'planned' ? '<p class="dim">（このイベントは今後のアップデートで遊べるようになります）</p>' : ''}` : ''}</div></div>`;
    } else if (tab === 'log') body = d.log.map(l => `<p><small class="dim">${ago(l.t)}</small> <b>${esc(l.name || l.id)}</b> ${esc(l.v)}</p>`).join('') || '<p class="dim">記録はまだない</p>';
    else if (tab === 'world') body = d.history.map(h => `<p><small class="dim">${ago(h.t)}</small> ${esc(h.v)}</p>`).join('') || '<p class="dim">世界はまだ静かだ</p>';
    else body = `<h3>称号（${d.titles.length}）</h3><p>${d.titles.map(t => `<span class="tag">${esc(t)}</span>`).join(' ') || '<span class="dim">なし</span>'}</p><h3>発見した地</h3><p>${d.discovered.map(esc).join('、') || '<span class="dim">なし</span>'}</p>`;
    return this.wrap('イベント記録', body, tabs);
  };
}
