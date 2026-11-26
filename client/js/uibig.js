// PHASE 7 (part 2) UI: spell research, the Sunken Kingdom ending, calamity shrines and the world-anomaly overview.
import { D } from './data.js';
const e = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const XN = { breath: '呼吸の秘薬', divingGear: '潜水装備', moonShard: '月影の欠片', calTrace: '災厄の痕跡', calMat: '災厄素材' };
export const xName = it => it.kind === 'sfrag' ? `魔法断片（${D.skills.get(it.ref)?.catName || '？'}）` : XN[it.ref] || null;
const STAGE = ['断片', '解析済', '再構築済', '実験成功', '習得', '改良'];
const EL = { fire: '火', water: '水', thunder: '雷', ice: '氷', earth: '土', wind: '風', holy: '聖', dark: '闇', void: '虚', phys: '物理' };
const CAL_OUT = { defeated: '討伐された', slept: '再び眠った', studied: '生態が解明された', coexist: '条件付きで共存している' };
export function installBig(UI) {
  const P = UI.prototype; const prevPanel = P.cityPanel;
  P.cityPanel = function (s, data) { if (['spells', 'sunkenEnd', 'calamity', 'worldInfo'].includes(s)) { this.svc = data; if (this.panel !== s || !this.modalOpen) this.open(s, s); else this.render(); return true; } return prevPanel.call(this, s, data); };
  const prevAct = P.cityAct; P.cityAct = function (a, t) { const d = t.dataset;
    if (a === 'spellLab') { this.net.menu('spells'); return true; }
    if (a === 'winfo') { this.net.menu('worldInfo'); return true; }
    if (a === 'spSel') { this.sel.spell = d.v; this.spm = { ...(this.svc.list.find(x => x.id === d.v)?.mods || {}) }; this.render(); return true; }
    if (a === 'spDo') { this.net.menu('spells', { act: d.do, id: this.sel.spell || this.svc.list[0]?.id, mods: d.do === 'improve' ? this.spm : undefined }); return true; }
    if (a === 'spMod') { const k = d.k; const cap = k === 'compound' ? 1 : 3; this.spm ||= {}; this.spm[k] = Math.max(0, Math.min(cap, (this.spm[k] || 0) + (+d.n))); this.render(); return true; }
    if (a === 'spZero') { this.net.menu('spells', { act: 'zero' }); return true; }
    if (a === 'sunk') { this.closeModal(); this.net.menu('sunken', { choice: d.v }); return true; }
    if (a === 'calA') { this.net.menu('calamity', { cal: this.svc.k, act: d.do }); return true; }
    return prevAct.call(this, a, t); };
  const prevJ = P.p_journal; P.p_journal = function () { const h = prevJ.call(this); return h.replace('<div class="tabs">', '<p><button data-act="winfo">☾ 世界の異変（黒月・災厄・沈没王国・千の魔法）</button></p><div class="tabs">'); };
  P.p_spells = function () { const d = this.svc; const sel = d.list.find(x => x.id === this.sel.spell) || d.list[0]; if (sel && !this.spm) this.spm = { ...sel.mods };
    const list = d.list.map(x => `<div class="irow ${sel?.id === x.id ? 'sel' : ''}" data-act="spSel" data-v="${x.id}"><span>${x.key ? '★' : ''}${e(x.name)}</span><small>${STAGE[Math.min(5, x.stage + (x.stage >= 4 && Object.keys(x.mods).length ? 1 : 0))]} ・ T${x.tier}</small></div>`).join('') || '<p class="dim">まだ魔法断片を持っていない。魔法系の魔物・ボス・宝箱から見つかる。</p>';
    let det = '<p class="dim">魔法を選択</p>';
    if (sel) { const used = Object.entries(this.spm || {}).reduce((t, [k, n]) => t + (k === 'compound' ? n * 2 : n), 0); const act = (k, label, dis) => `<button class="primary" data-act="spDo" data-do="${k}" ${dis || !d.atLab ? 'disabled' : ''}>${label}</button>`;
      det = `<h3>${e(sel.name)}</h3><p>${e(sel.cat)} ・ T${sel.tier}${sel.el ? ' ・ ' + (EL[sel.el] || sel.el) : ''}${sel.props ? ` ・ SP${sel.props.cost} CD${(sel.props.cd / 1000).toFixed(1)}s 詠唱${(sel.props.cast / 1000).toFixed(1)}s` : ''}</p>
      <p>研究段階：${STAGE.slice(0, 5).map((n, i) => i <= sel.stage ? `<b>${n}</b>` : `<span class="dim">${n}</span>`).join(' → ')}</p>
      ${sel.stage === 0 ? act('analyze', `構造解析（${300 * sel.tier}G）`) : ''}${sel.stage === 1 ? act('rebuild', `再構築（断片 ${sel.frags}/${sel.need}）`, sel.frags < sel.need) : ''}${sel.stage === 2 ? act('test', `実験検証（${500 * sel.tier}G・失敗あり）`) : ''}${sel.stage === 3 ? act('learn', '習得する') : ''}
      ${sel.stage >= 4 ? `<h4>改良 <small>配分 ${used}/${d.budget}点（複合化は2点）― 全性能の同時最大化はできない</small></h4>${Object.entries(d.improve).map(([k, n]) => `<p>${n} <button data-act="spMod" data-k="${k}" data-n="-1">－</button> <b>${this.spm?.[k] || 0}</b> <button data-act="spMod" data-k="${k}" data-n="1">＋</button></p>`).join('')}${act('improve', '改良を確定', used > d.budget)}` : ''}`; }
    const keys = `<h4>七つの重要魔法</h4><p>${d.keys.map(k => `<span class="${k.have ? 'good' : 'dim'}">${k.have ? e(k.name) : '？？？'}（${e(k.cat)}）</span>`).join(' ・ ')}</p><p>禁書『魔力の存在証明』：${d.book ? '<span class="good">解読済</span>' : '<span class="dim">未解読（大図書館の禁書庫）</span>'}</p>
      ${d.zero ? '<p class="good">第零魔法：オリジン を習得している</p>' : `<button class="primary" data-act="spZero" ${d.atLab ? '' : 'disabled'}>最終研究「第零魔法：オリジン」</button>`}`;
    return this.wrap(`失われた千の魔法 <small>習得 ${d.learned}/${d.total}</small>`, `${d.atLab ? '' : '<p class="warn">研究は図書館・学院・研究所（または遺物研究室のある隠れ家）で行える。ここでは閲覧のみ。</p>'}${d.labPlus ? '<p class="good"><small>研究施設拡張：研究費30%減</small></p>' : ''}<div class="split"><div class="list">${list}</div><div class="det">${det}${keys}</div></div>`); };
  P.p_sunkenEnd = function () { const D2 = { 王国再生: '古代魔法装置を修復し、王国を海上へ戻す。人々の記憶と都市が還る', 王国解放: '王国を縛る魔法を解き、魂を眠りにつかせる。海は静けさを取り戻す', 王国継承: '王の遺志と技術を継ぎ、海底都市として未来へ引き継ぐ' };
    return this.wrap('沈没王アトランティスの最期', `<p class="say">「……地上の者よ。この王国の行く末を、そなたに託そう」</p>${this.svc.options.map(o => `<p><button class="primary" data-act="sunk" data-v="${e(o)}">${e(o)}</button> <small>${e(D2[o])}</small></p>`).join('')}<p class="dim"><small>選択は世界に記録され、同じ時代の他の冒険者にも影響する。</small></p>`); };
  P.p_calamity = function () { const d = this.svc;
    return this.wrap(`${e(d.name)}の祠`, `<p>${d.outcome ? `災厄は${CAL_OUT[d.outcome]}。いずれまた目を覚ますだろう。` : d.stage >= 5 ? '<span class="warn">災厄が目覚めている！</span>' : d.stage ? `前兆 ${d.stage}/5` : '今は深く眠っている'}</p>
      <ol>${d.signs.map(x => `<li>${e(x)}</li>`).join('')}</ol><p>災厄の痕跡 ×${d.traces} ・ 災厄素材 ×${d.mats} ・ 生態記録 ${d.records}/30${d.studied ? '（解明済）' : ''}</p>
      <p><button data-act="calA" data-do="sleep">再び眠らせる儀式（前兆3以上・痕跡×5・3,000G）</button></p><p><button data-act="calA" data-do="observe">近くの災厄を観察・記録する</button></p><p><button data-act="calA" data-do="coexist">条件付き共存（生態解明済・目覚め中・災厄素材×3）</button></p>
      <p class="dim"><small>目覚めた災厄は世界共通の体力を持つワールドボス。討伐・鎮静・調査・共存のどれを選んでも災厄そのものは世界から消えず、数日後には再び眠りにつく。</small></p>`); };
  P.p_worldInfo = function () { const d = this.svc; const ms = { dormant: '静穏', omen: '前兆（月の縁が欠けている）', active: '黒月の夜！', resolved: '明けた' }[d.moon.state] || d.moon.state;
    return this.wrap('世界の異変', `<h3>☾ 黒月の夜</h3><p>${ms} ・ 月の気配 ${Math.min(100, d.moon.pressure)}%${d.moon.obsField ? ` ・ 観測者の出現地：${e(d.moon.obsField)}` : ''}</p><p>観測者との遭遇 ${d.moon.obs}/2 ・ 起動した観測装置 ${d.moon.dev}/4</p><p class="dim"><small>月の気配は時間・古代遺跡の起動・黒月の古書・強敵の討伐で高まり、満ちた夜に黒月が昇る。</small></p>
      <h3>眠れる災厄</h3>${d.cal.map(c => `<p><b>${e(c.name)}</b> ― ${c.outcome ? CAL_OUT[c.outcome] : c.stage >= 5 ? '<span class="warn">目覚めている</span>' : `前兆 ${c.stage}/5`}${c.signs.length ? `<br><small>${e(c.signs.at(-1))}</small>` : ''}</p>`).join('')}
      <h3>沈没した王国</h3><p>手がかり ${d.sunken.clues.length}/5${d.sunken.outcome ? ` ・ 世界の選択：${e(d.sunken.outcome)}` : ''}</p>
      <h3>失われた千の魔法</h3><p>習得 ${d.spells.learned} / ${d.spells.total - 1} <button data-act="spellLab">魔法研究</button></p>`); };
}
