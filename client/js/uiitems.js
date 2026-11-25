// Item features: favorites, bulk sell by rarity, trait reroll at the altar, artifact crafting & equipping.
import { D } from './data.js';
import { RARITIES } from '/shared/constants.js';
import { modsText } from '/shared/skillText.js';
import { ART_CONDS, ART_EFFECTS } from '/shared/data/artifacts.js';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rar = r => RARITIES[r] || RARITIES[1];
export const matName = it => it.ref === 'acond' ? `条件の核「${ART_CONDS[it.key]?.name}」` : `効果の核「${ART_EFFECTS[it.key]?.name}」`;
export const artDesc = it => `${ART_CONDS[it.cond].name}：${ART_EFFECTS[it.eff].name}+${Math.round(it.val * 1000) / 10}%（${it.dur}秒${it.stack > 1 ? `・最大${it.stack}重` : ''}）`;
export function installItems(UI) {
  const P = UI.prototype;
  const prevPanel = P.cityPanel; P.cityPanel = function (s, data) { if (s === 'altar') { this.svc = data; if (this.panel !== 'altar' || !this.modalOpen) this.open('altar', s); else this.render(); return true; } return prevPanel.call(this, s, data); };
  P.initItems = function () { this.net.on('traitResult', m => { this.traitRes = m; if (this.panel === 'altar') this.render(); }); this.net.on('note', () => {}); };
  // bulk sell bar (shown in town on the inventory screen)
  P.bulkBar = function () {
    const ch = this.self.ch; const eq = new Set(Object.values(ch.equip)); const sel = this.sel.bulk ||= new Set([1, 2]);
    const list = ch.inventory.filter(i => i.kind === 'weapon' && !i.fav && !eq.has(i.uid) && sel.has(D.weapons.get(i.ref)?.rar));
    const total = list.reduce((t, i) => t + Math.round((D.weapons.get(i.ref)?.price || 0) * 0.3), 0);
    return `<div class="bulk"><b>一括売却</b> ${[1, 2, 3, 4, 5, 6].map(r => `<label class="chk"><input type="checkbox" data-bulk="${r}" ${sel.has(r) ? 'checked' : ''}><span style="color:${rar(r).color}">${rar(r).key}</span></label>`).join('')}
      <button data-act="bulkSell" ${list.length ? '' : 'disabled'}>${list.length}本を売却（${total.toLocaleString()}G）</button><small class="dim">装備中・★お気に入りは売られません</small></div>`;
  };
  const prevChange = P.onChange; P.onChange = function (e) { const t = e.target; if (t.dataset.bulk) { const r = +t.dataset.bulk; const s = this.sel.bulk ||= new Set(); if (t.checked) s.add(r); else s.delete(r); return this.render(); } return prevChange.call(this, e); };
  const prevAct = P.cityAct; P.cityAct = function (a, t) {
    const d = t.dataset, m = this.net.menu.bind(this.net);
    switch (a) {
      case 'fav': return m('fav', { uid: d.v }) || true;
      case 'bulkSell': { const ch = this.self.ch; const eq = new Set(Object.values(ch.equip)); const rs = [...(this.sel.bulk || [])]; const n = ch.inventory.filter(i => i.kind === 'weapon' && !i.fav && !eq.has(i.uid) && rs.includes(D.weapons.get(i.ref)?.rar)).length;
        if (!confirm(`${rs.map(r => rar(r).key).join('・')} の武器 ${n}本を一括売却します（装備中・お気に入りは除外）。よろしいですか？`)) return true; return m('sellBulk', { rars: rs }) || true; }
      case 'traitPick': this.sel.tw = d.v; this.sel.ts = 0; this.traitRes = null; this.render(); return true;
      case 'traitSlot': this.sel.ts = +d.v; this.render(); return true;
      case 'traitGo': if (!confirm('特性変更チケットを1枚使い、選んだ特性をランダムな別の特性に変えます。よろしいですか？')) return true; return m('trait', { uid: this.sel.tw, slot: this.sel.ts || 0 }) || true;
      case 'pray': return m('pray') || true;
      case 'artSel': this.sel[d.k] = d.v; this.render(); return true;
      case 'artGo': return m('artifact', { cond: this.sel.acond, eff: this.sel.aeff }) || (this.sel.acond = this.sel.aeff = null, true);
      case 'artEquip': return m('equip', { uid: d.v, slot: d.slot }) || true;
      case 'artUnequip': return m('unequip', { uid: d.v }) || true;
    }
    return prevAct.call(this, a, t);
  };
  P.p_altar = function () {
    const d = this.svc; const ws = d.weapons; const w = ws.find(x => x.uid === this.sel.tw) || ws.find(x => x.eq) || ws[0]; const r = this.traitRes;
    const list = ws.map(x => `<div class="irow ${w?.uid === x.uid ? 'sel' : ''}" data-act="traitPick" data-v="${x.uid}"><span style="color:${rar(x.rar).color}">${x.eq ? '[E] ' : ''}${x.fav ? '★' : ''}${esc(x.name)}${x.plus ? ' +' + x.plus : ''}</span><small>特性${x.traits.length}</small></div>`).join('') || '<p class="dim">特性を持つ武器がない</p>';
    const det = w ? `<h3 style="color:${rar(w.rar).color}">${esc(w.name)}</h3><p>変更する特性を選ぶ：</p>${w.traits.map((t, i) => `<div class="irow ${(this.sel.tw === w.uid ? this.sel.ts || 0 : 0) === i ? 'sel' : ''}" data-act="traitSlot" data-v="${i}"><span>◆ ${esc(t.name)}</span><small>${esc(modsText(t.mods))}</small></div>`).join('')}
      <p class="dim">変更後の特性はランダム（同じレア度帯の特性から、今ある特性以外が選ばれる）</p><button class="primary" data-act="traitGo" ${d.tickets ? '' : 'disabled'}>チケットを使って変更</button>
      ${r && r.uid === w.uid ? `<p class="good">「${esc(r.old.name)}」→「${esc(r.next.name)}」（${esc(modsText(r.next.mods))}）</p>` : ''}` : '';
    if (w && this.sel.tw !== w.uid) this.sel.tw = w.uid;
    return this.wrap(`祭壇 ― 特性変更 <small>チケット ${d.tickets}枚</small>`, `<p class="dim">特性変更チケットは HARD 以上の50階以降のボスを倒すと2枚手に入る。</p><div class="split"><div class="list">${list}</div><div class="det">${det}</div></div><p><button data-act="pray">祭壇に祈る</button></p>`);
  };
  // artifact crafting section (appended to the blacksmith screen)
  P.artifactCraft = function () {
    const ch = this.self.ch; const conds = ch.inventory.filter(i => i.kind === 'amat' && i.ref === 'acond'), effs = ch.inventory.filter(i => i.kind === 'amat' && i.ref === 'aeff');
    const row = (it, k) => `<div class="irow ${this.sel[k] === it.uid ? 'sel' : ''}" data-act="artSel" data-k="${k}" data-v="${it.uid}"><span>${esc(matName(it))}</span><small>${esc(this.ctx.renderer.dungeonNames?.[it.dg] || it.dg)} ${it.floor}F ${it.diff} ・ 強さ${it.pow}</small></div>`;
    const c = conds.find(i => i.uid === this.sel.acond), e = effs.find(i => i.uid === this.sel.aeff);
    return `<h3>アーティファクト作成</h3><p class="dim">HARD以上のダンジョンボスから10%で出る「条件の核」と「効果の核」を1つずつ組み合わせる。条件が厳しいほど効果が大きく、ボスの階層・難易度が高いほど効果量と効果時間が伸びる。</p>
      <div class="split"><div><h4>条件の核（${conds.length}）</h4>${conds.map(i => row(i, 'acond')).join('') || '<p class="dim">なし</p>'}</div><div><h4>効果の核（${effs.length}）</h4>${effs.map(i => row(i, 'aeff')).join('') || '<p class="dim">なし</p>'}</div></div>
      ${c && e ? `<p>完成予定：<b>${esc(ART_CONDS[c.key].name)}</b>に<b>${esc(ART_EFFECTS[e.key].name)}</b>上昇（費用 ${Math.round(2000 * (c.pow + e.pow)).toLocaleString()}G）</p><button class="primary" data-act="artGo">作成する</button>` : '<p class="dim">条件と効果を1つずつ選ぶ</p>'}`;
  };
}
