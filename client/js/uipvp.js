// Player duels: nearby players, invitations, forfeit, rating and ranking. PC and touch.
const e = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export function installPvp(UI) {
  const P = UI.prototype; const prevPanel = P.cityPanel;
  P.cityPanel = function (s, data) { if (s === 'pvp') { this.svc = data; if (this.panel !== 'pvp' || !this.modalOpen) this.open('pvp', 'pvp'); else this.render(); return true; } return prevPanel.call(this, s, data); };
  const prevAct = P.cityAct; P.cityAct = function (a, t) { if (a !== 'pv') return prevAct.call(this, a, t); const d = t.dataset; const o = { do: d.do }; if (d.id) o.id = d.id; if (d.from) o.from = d.from; if (d.rounds) o.rounds = +d.rounds; if (d.do === 'accept' || d.do === 'forfeit') this.closeModal(); this.net.menu('pvp', o); return true; };
  P.p_pvp = function () { const d = this.svc; if (!d) return this.wrap('決闘', '');
    const inv = d.inv.map(i => `<div class="srow"><div class="sh"><b>${e(i.name)}からの申し込み</b><small>${i.rounds === 3 ? '3本勝負' : '1本勝負'}</small></div><button class="primary" data-act="pv" data-do="accept" data-from="${e(i.from)}">受ける</button> <button data-act="pv" data-do="decline" data-from="${e(i.from)}">断る</button></div>`).join('');
    const near = d.near.map(p => `<div class="irow"><span>${e(p.name)} <small>Lv${p.lv}・レート${p.r}</small></span><span><button data-act="pv" data-do="challenge" data-id="${e(p.id)}" data-rounds="1" ${d.canHere ? '' : 'disabled'}>1本勝負</button><button data-act="pv" data-do="challenge" data-id="${e(p.id)}" data-rounds="3" ${d.canHere ? '' : 'disabled'}>3本勝負</button></span></div>`).join('') || '<p class="dim">近くに他のプレイヤーがいない</p>';
    return this.wrap('決闘 <small>プレイヤー同士</small>', `${d.inMatch ? '<p><button data-act="pv" data-do="forfeit">降参する</button></p>' : ''}${inv ? `<h4>申し込み</h4>${inv}` : ''}
      <p class="dim"><small>専用の決闘場で戦う。体力が尽きても倒れず、装備やお金を失うことはない。終われば体力は元に戻り、元の場所へ帰る。1回の攻撃は最大HPの25%まで。制限時間は1戦2分（時間切れは残り体力の多い方の勝ち）。時間停止はプレイヤーには効かない</small></p>
      <div class="split"><div><h4>近くのプレイヤー</h4>${near}</div><div><h4>あなたの戦績</h4><p>レート <b>${d.me.r}</b> ・ ${d.me.w}勝${d.me.l}敗</p><h4>ランキング</h4>${d.top.map((t, i) => `<p class="${t.me ? 'good' : ''}">${i + 1}. ${e(t.name)} ${t.r}（${t.w}勝${t.l}敗）</p>`).join('') || '<p class="dim">まだ記録がない</p>'}
      <h4>最近の決闘</h4>${d.log.map(l => `<p class="dim"><small>${e(l.w)} ${e(l.score)} ${e(l.l)}（${e(l.why)}）</small></p>`).join('')}</div></div>`); };
}
