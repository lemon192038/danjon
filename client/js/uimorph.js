// Transformation UI: the form panel (stages, resource, species/forms with their attack kits, form-bound skills,
// mech parts, 万象転生 factor builds and presets). Opened from the HUD gauge (PC & touch).
const e = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ST = ['通常形態', '部分変身', '半変身', '完全変身'];
const GN = { hit: '命中', crit: '会心', hurt: '被弾', kill: '撃破', regen: '時間', night: '夜', still: '静止', water: '水中・雨（倍率）', skill: 'スキル', dark: '暗所' };
export function installMorph(UI) {
  const P = UI.prototype; const prevPanel = P.cityPanel;
  P.cityPanel = function (s, data) { if (s === 'morph') { this.svc = data; if (this.panel !== 'morph' || !this.modalOpen) this.open('morph', 'morph'); else this.render(); return true; } return prevPanel.call(this, s, data); };
  const prevAct = P.cityAct; P.cityAct = function (a, t) { if (a !== 'mo') return prevAct.call(this, a, t); const d = t.dataset; const o = { do: d.do }; for (const k of ['key', 'slot']) if (d[k] != null) o[k] = d[k]; if (d.i != null) o.i = +d.i; this.net.menu('morph', o); return true; };
  P.p_morph = function () { const d = this.svc; if (!d) return this.wrap('変身', '<p class="dim">変身系の武器を装備していない</p>');
    const R = d.res; const stages = ST.map((n, i) => `<span class="${i === d.stage ? 'good' : 'dim'}">${i === d.stage ? '▶' : ''}${n}</span>`).join(' → ');
    const sp = d.species.map(s => `<div class="srow"><div class="sh"><b>${s.cur ? '◆ ' : ''}${e(s.name)}</b><small>${s.unlocked ? `成長Lv${s.lv}` : `熟練度${s.need}で解放`}${s.fly ? '・飛行' : ''}</small></div><p><small>${e(s.role)}</small></p><p><small>攻撃：${s.kit.map(e).join(' → ')}</small></p>${s.unlocked && !s.cur ? `<button data-act="mo" data-do="species" data-key="${s.key}">この姿にする</button>` : ''}</div>`).join('');
    const sk = d.skills.map(k => `<p><small>${k.kind === 'passive' ? '【常時】' : k.kind === 'ult' ? '【必殺】' : `【${ST[k.form]}】`} <b>${e(k.name)}</b> ${e(k.note)}</small></p>`).join('');
    const parts = d.parts ? `<h4>機体パーツ</h4>${Object.entries(d.parts.opts).map(([slot, l]) => `<p>${{ arm: '腕', leg: '脚', core: 'コア' }[slot]}：${l.map(p => `<button data-act="mo" data-do="part" data-slot="${slot}" data-key="${p.id}" ${d.parts.cur[slot] === p.id ? 'class="primary"' : ''}>${e(p.name)}</button>`).join(' ')}</p>`).join('')}` : '';
    const chi = d.chimera ? `<h4>変身因子の組み合わせ（他の変身系武器種の熟練度10で解放・ボスから入手）</h4>${Object.entries(d.chimera.slots).map(([slot, l]) => `<p>${{ head: '頭', arms: '腕', legs: '脚', back: '背', body: '胴' }[slot]}：${l.map(f => `<button data-act="mo" data-do="factor" data-slot="${slot}" data-key="${f.id}" ${!f.own ? 'disabled' : d.chimera.build[slot] === f.id ? 'class="primary"' : ''}>${e(f.name)}</button>`).join(' ')}</p>`).join('')}
      <p>保存：${[0, 1, 2].map(i => `<button data-act="mo" data-do="save" data-i="${i}">枠${i + 1}に保存</button><button data-act="mo" data-do="load" data-i="${i}" ${d.chimera.presets[i] ? '' : 'disabled'}>呼び出す</button>`).join(' ')}</p>` : '';
    return this.wrap(`${e(d.name)} <small>変身</small>`, `<p>${stages}</p><p>${e(R.name)}：<b>${R.v}</b>/100 ・ 半変身に${R.cost[1]}・完全変身に${R.cost[2]}が必要 ・ 半変身は${R.half}秒 ・ 完全変身中は${R.drain > 0 ? `毎秒${R.drain}減る` : `毎秒${-R.drain}溜まる（必殺技に${R.ult}）`}</p>
      <p class="dim"><small>${e(R.name)}が溜まる行動：${Object.entries(R.gain).map(([k, v]) => `${GN[k] || k}${k === 'water' ? `×${v}` : `+${v}`}`).join('・')}</small></p>
      <p class="dim"><small>操作：特殊（右クリック／◆）を押す＝次の段階（部分→半→完全）、完全変身中に押す＝姿ごとの固有技、長押し＝変身解除。強攻撃（R／⚡）は今の姿の締め技</small></p>
      <div class="split"><div><h4>姿（完全変身先）</h4>${sp}</div><div><h4>形態別スキル</h4>${sk}${parts}${chi}</div></div>`); };
}
