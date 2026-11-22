// Slum extraction UI: entrance, raid HUD, bag/pouch, fog-of-war layered map, black market (sparklines), laundering,
// hideout & facilities, terminal, raid result. All state is server-authoritative; actions go through net.menu.
import { LOOT, LOOT_CAT, PROV, EXITS, LAYERS, FACILITIES, EVENTS } from '/shared/data/slum.js';
import { WEAPON_TYPES } from '/shared/data/weaponTypes.js';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const G = n => Number(n || 0).toLocaleString() + 'G';
const RCOL = ['#bbb', '#ddd', '#60d060', '#50a0ff', '#c070ff', '#ffb030'];
const DCOL = ['', '#3a8a3a', '#8a8a2a', '#a0602a', '#a02a2a', '#6a1a6a'];
const lootName = r => LOOT[r]?.name || r;
const spark = (h, w = 90, ht = 22) => { if (!h || h.length < 2) return '<span class="dim">—</span>'; const mn = Math.min(...h), mx = Math.max(...h), sp = mx - mn || 1; const pts = h.map((v, i) => `${(i / (h.length - 1) * w).toFixed(1)},${(ht - 2 - (v - mn) / sp * (ht - 4)).toFixed(1)}`).join(' '); const up = h.at(-1) >= h[0]; return `<svg width="${w}" height="${ht}" class="spark"><polyline fill="none" stroke="${up ? '#70e090' : '#ff7070'}" stroke-width="1.5" points="${pts}"/></svg>`; };
const cost = c => Object.entries(c).map(([k, v]) => k === 'gold' ? G(v) : `${lootName(k)}×${v}`).join('・');
import { OBJ_HINT } from './uicity.js';
Object.assign(OBJ_HINT, { cont: '物資を調べる', ladder: '梯子を使う', exit: '脱出する', entry: '潜入口（撤退）', hideout: '隠れ家への抜け道', fac: '設備を使う', hstore: '保管庫を開く' });
export function installSlum(UI) {
  const P = UI.prototype;
  const prevHint = P.cityHint; P.cityHint = function (z, p) { let h = prevHint.call(this, z, p); for (const e of this.state.ents.values()) if (e.seen && e.d.kind === 'slumnpc' && Math.hypot(e.x - p.x, e.y - p.y) < 28) h = `[F] 話す：${e.d.name}`; if (z.kind === 'slum') for (const o of z.objects || []) if (o.k === 'cont' && o.looted && Math.hypot(o.x * 16 + 8 - p.x, o.y * 16 + 8 - p.y) < 24) h = '漁り済み'; return h; };
  const PANELS = { slum: 'slum', raidbag: 'raidbag', market: 'market', hideout: 'hideout', hfac: 'hfac', terminal: 'terminal' };
  const prevPanel = P.cityPanel; P.cityPanel = function (s, data) { if (PANELS[s]) { this.svc = data; this.open(PANELS[s], s); return true; } return prevPanel.call(this, s, data); };
  P.initSlum = function () {
    const n = this.net; this.slumMaps = {};
    n.on('raidStart', m => { this.raid = m; this.toast(`${m.name}に潜入した — 制限時間${Math.round((m.ends - Date.now()) / 60000)}分`, 'big', 3500); if (m.events?.length) this.note({ k: 'msg', v: '今回の異変：' + m.events.map(e => e.name).join('・') }); });
    n.on('raidResult', m => { this.raidRes = m; this.raid = null; this.open('raidResult'); });
    n.on('progress', m => this.progress(m.v, m.ms));
    const hud = document.getElementById('hud'); const div = document.createElement('div'); div.id = 'raidhud'; hud.appendChild(div); this.rhud = div;
    div.addEventListener('click', e => { const k = e.target.closest('[data-rk]')?.dataset.rk; if (k === 'bag') n.menu('slum', { act: 'bag' }); if (k === 'map') this.open('map'); });
    const pb = document.createElement('div'); pb.id = 'progbar'; hud.appendChild(pb); this.pbar = pb;
  };
  P.progress = function (v, ms) { const el = this.pbar; if (!ms) { el.style.display = 'none'; if (v) this.toast(v, 'err', 1200); return; } el.style.display = 'block'; el.innerHTML = `<div>${esc(v)}</div><div class="lbar"><i style="animation-duration:${ms}ms"></i></div>`; clearTimeout(this._pb); this._pb = setTimeout(() => el.style.display = 'none', ms + 150); };
  const prevSnap = P.onSnap; P.onSnap = function (m) { prevSnap.call(this, m); const r = m.me.raid; const z = this.state.zone;
    if (!r || z?.kind !== 'slum') { this.rhud.style.display = 'none'; return; }
    this.rhud.style.display = 'block'; const mm = Math.floor(r.t / 60), ss = r.t % 60; const L = z.slum; const heavy = r.w > r.cap * 0.85;
    const tx = Math.floor(m.me.x / 16), ty = Math.floor(m.me.y / 16); const dg = L.danger[Math.floor(ty / L.cell)]?.[Math.floor(tx / L.cell)] || 1;
    this.rhud.innerHTML = `<div class="rt ${r.t < 300 ? 'warn' : ''}">⏱ ${mm}:${String(ss).padStart(2, '0')}</div><div>${esc(L.region)} ・ <b>${esc(L.layers[r.L])}</b> ・ 危険度 <b style="color:${DCOL[dg]}">${'◆'.repeat(dg)}</b>${L.pvp ? ' ・ <span class="warn">PvP</span>' : ''}</div>
      <div>🎒 <span class="${heavy ? 'warn' : ''}">${r.w}/${r.cap}kg</span> ・ ${r.n}点 ・ 推定 ${G(r.v)} ・ 保険${r.pn}/2</div>${r.ex != null ? `<div class="good">脱出まで ${r.ex}s — 動かないで</div>` : ''}<div><button data-rk="bag">バッグ [G]</button> <button data-rk="map">地図 [M]</button></div>`;
    // fog of war
    const key = z.id; let fm = this.slumMaps[key]; if (!fm) fm = this.slumMaps[key] = { w: z.w, h: z.h, tiles: z.tiles, objects: z.objects, fog: new Uint8Array(z.w * z.h), layer: L.layer, inst: z.id.split(':')[1] };
    for (let j = -7; j <= 7; j++) for (let i = -8; i <= 8; i++) { const x = tx + i, y = ty + j; if (x >= 0 && y >= 0 && x < z.w && y < z.h && i * i + j * j < 64) fm.fog[y * z.w + x] = 1; }
  };
  const prevKey = P.key; P.key = function (k) { if (k === 'g' && this.state.zone?.kind === 'slum') return this.net.menu('slum', { act: 'bag' }); return prevKey.call(this, k); };
  const prevMap = P.p_map; P.p_map = function () { const z = this.state.zone; if (z?.kind !== 'slum') return prevMap.call(this);
    const L = z.slum; const inst = z.id.split(':')[1]; const sel = this.mapLayer ?? L.layer; const fm = this.slumMaps[`slum:${inst}:${sel}`];
    setTimeout(() => { const cv = this.modal.querySelector('#slummap'); if (!cv || !fm) return; const g = cv.getContext('2d'); const s = Math.min(cv.width / fm.w, cv.height / fm.h); g.fillStyle = '#0a0a10'; g.fillRect(0, 0, cv.width, cv.height);
      const pass = v => ![0, 2, 3, 12, 13, 18, 19, 22, 29].includes(v);
      for (let y = 0; y < fm.h; y++) for (let x = 0; x < fm.w; x++) { const v = fm.tiles[y * fm.w + x]; const seen = fm.fog[y * fm.w + x]; if (!seen) continue; g.fillStyle = pass(v) ? (v === 15 ? '#6a5a3a' : '#5a5a60') : '#22222a'; g.fillRect(x * s, y * s, s + 0.5, s + 0.5); }
      if (sel === L.layer) for (let y = 0; y < fm.h; y++) for (let x = 0; x < fm.w; x++) { if (!fm.fog[y * fm.w + x]) continue; const dv = L.danger[Math.floor(y / L.cell)]?.[Math.floor(x / L.cell)] || 1; if (dv < 2) continue; g.fillStyle = DCOL[dv] + '55'; g.fillRect(x * s, y * s, s + 0.5, s + 0.5); }
      g.font = '11px sans-serif'; for (const o of fm.objects) { const known = fm.fog[o.y * fm.w + o.x] || (L.fixedMap && !o.temp && (o.k === 'ladder' || o.k === 'entry')); if (!known) continue; const c = { exit: '#70ff90', ladder: o.temp ? '#ff90c0' : '#ffe070', entry: '#a0c8ff', hideout: '#ffb070', cont: o.looted ? '#555' : '#d0a040' }[o.k]; if (!c) continue; g.fillStyle = c; g.fillRect(o.x * s - 2, o.y * s - 2, o.k === 'cont' ? 3 : 6, o.k === 'cont' ? 3 : 6); if (o.k !== 'cont') g.fillText(o.k === 'exit' ? EXITS[o.type]?.name || '出口' : o.k === 'ladder' ? (o.dir > 0 ? '▲' : '▼') : o.k === 'entry' ? '潜入口' : '抜け道', o.x * s + 5, o.y * s + 4); }
      if (sel === L.layer && this.state.me) { g.fillStyle = '#fff'; g.beginPath(); g.arc(this.state.me.x / 16 * s, this.state.me.y / 16 * s, 4, 0, 7); g.fill(); }
      for (const e of this.state.ents.values()) if (sel === L.layer && e.seen && e.d.kind === 'player' && e !== this.state.meEnt) { g.fillStyle = e.d.team === L.team ? '#60c0ff' : '#ff5050'; g.fillRect(e.x / 16 * s - 2, e.y / 16 * s - 2, 4, 4); } }, 0);
    const tabs = `<div class="tabs">${L.layers.map((n, i) => `<button class="${sel === i ? 'sel' : ''}" data-act="slayer" data-v="${i}">${esc(n)}${this.slumMaps[`slum:${inst}:${i}`] ? '' : '（未踏）'}</button>`).join('')}</div>`;
    const ex = this.raid?.exits || [];
    return this.wrap(`探索地図 ― ${esc(L.region)}`, `<div class="split"><canvas id="slummap" width="560" height="440" style="max-width:100%"></canvas><div><h3>脱出地点（今回）</h3>${ex.map(e => `<p><b>${esc(e.name)}</b> <small>${esc(e.layer)}</small>${e.free ? ' <span class="good">確実</span>' : ''}<br><small class="dim">${esc(e.desc || '条件なし')}</small></p>`).join('') || '<p class="dim">不明</p>'}
      <h3>凡例</h3><p><span style="color:#70ff90">■</span>出口 <span style="color:#ffe070">■</span>梯子 <span style="color:#ff90c0">■</span>臨時通路 <span style="color:#d0a040">■</span>未調査 <span style="color:#60c0ff">■</span>味方 <span style="color:#ff5050">■</span>敵対者</p>
      <p class="dim">色の濃い区画ほど危険（良い戦利品も多い）。歩いた範囲だけ地図に残る${L.fixedMap ? '／地図管理台により固定区画を表示中' : '。隠れ家の地図管理台で固定区画を常時表示できる'}。</p>
      <h3>勢力</h3>${L.factions.map(f => `<p>${esc(f.name)} 評判${f.rep ?? '—'} ${f.rep != null && f.rep < f.hostileBelow ? '<span class="warn">敵対</span>' : '<span class="good">中立</span>'}</p>`).join('')}</div></div>`, tabs); };
  const prevAct = P.cityAct; P.cityAct = function (a, t) { const d = t.dataset, m = this.net.menu.bind(this.net);
    switch (a) {
      case 'slayer': this.mapLayer = +d.v; this.render(); return true;
      case 'sl': return m('slum', { act: d.do, id: d.id, insure: d.ins === '1', i: +d.i, to: d.to === '1' ? 1 : 0 }) || true;
      case 'mk': return m('market', { act: d.do, uid: d.uid, i: +d.i, ref: d.ref, channel: d.ch, how: d.how, fence: this.svc?.fence ? 1 : 0, n: +d.n || 0 }) || true;
      case 'ho': return m('hideout', { act: d.do, k: d.k, f: d.f, uid: d.uid, i: +d.i, to: d.to, from: d.from, rid: d.rid, v: d.v, wt: +(this.modal.querySelector('#hwt')?.value || 0) }) || true;
      case 'hoVisit': return m('hideout', { act: 'visit', name: prompt('訪問するプレイヤー名') || '' }) || true;
      case 'forgeGo': return m('hideout', { act: 'use', f: 'forge', wt: +(this.modal.querySelector('#hwt')?.value || 0) }) || true;
      case 'tuneGo': return m('hideout', { act: 'use', f: 'forge', sub: 'tune' }) || true;
    }
    return prevAct.call(this, a, t); };
  P.p_slum = function () { const d = this.svc;
    const q = d.quests.map(x => { const act = d.active.find(a => a.id === x.id); return `<div class="srow"><div class="sh"><b>${esc(x.desc)}</b><small>${G(x.reward.gold)} ・ EXP${x.reward.xp}</small></div>${act ? (act.ready ? `<button class="primary" data-act="sl" data-do="turnin" data-id="${x.id}">報告</button>` : `<small>${act.prog || 0}/${act.n || 1}</small> <button data-act="sl" data-do="abandon" data-id="${x.id}">破棄</button>`) : `<button data-act="sl" data-do="accept" data-id="${x.id}">受ける</button>`}</div>`; }).join('');
    const h = d.hideout;
    return this.wrap(`${esc(d.name)} <small>危険度 ${'◆'.repeat(d.tier)} ・ ${esc(d.cityName)}</small>`, `<div class="split"><div><p class="lore">${esc(d.desc)}</p>
      <p>支配勢力：<b>${esc(d.controller)}</b>（${Object.entries(d.influence).map(([k, v]) => `${esc(k)} ${v}`).join(' / ')}）</p><p>噂される兆候：${d.omen.map(esc).join('、')}</p>
      <h3>ルール</h3><ul class="rules"><li>制限時間 25分。時間切れは「行方不明」扱い。</li><li>倒れると<b>探索バッグ</b>の中身を失う。<b>保険ポーチ（2枠・1kg以下）</b>の品は必ず持ち帰れる。</li>
      <li>${d.gearLoss ? '<span class="warn">この区域では倒れると装備中の武器も失う（保険で回避／予備武器は常に残る）</span>' : '装備は失わない'}</li><li>${d.pvp ? '<span class="warn">他パーティーと敵対（PvPvE）</span>' : '他の探索者とは協力関係'}</li>
      <li>運べる重量 ${d.cap}kg（職業・レベルで増加）。切断時は生存中なら復帰でき、装備は失わない。</li>${d.tier <= 1 ? '<li class="good">初心者区域：潜入口からいつでも撤退できる</li>' : '<li>潜入口からの撤退は潜入後2分以内のみ</li>'}</ul>
      ${d.raid ? '<p class="warn">探索中です</p>' : `<button class="primary" data-act="sl" data-do="start">潜入する</button> ${d.insureCost ? `<button data-act="sl" data-do="start" data-ins="1">武器に保険をかけて潜入（${G(d.insureCost)}）</button>` : ''}`}
      <h3>最近の探索</h3>${(d.history || []).slice().reverse().map(e => `<p class="${e.ok ? 'good' : 'warn'}">${e.ok ? '脱出成功' : { death: '死亡', mia: '行方不明', dc: '切断' }[e.cause] || '失敗'} ${e.ok ? G(e.value) : ''}</p>`).join('') || '<p class="dim">なし</p>'}</div>
      <div><h3>スラム依頼（本日）</h3>${q}<h3>隠れ家</h3>${h.owned ? `<p>${esc(h.region)}「${esc(h.name)}」 発覚度 ${h.exposure}</p><button data-act="sl" data-do="hideout">隠れ家へ</button>` : `<p class="dim">未所有</p><button data-act="sl" data-do="hideout">入手方法を見る</button>`}
      <h3>闇相場</h3><button data-act="mk" data-do="view">この地域の相場・売買</button></div></div>`); };
  P.p_raidbag = function () { const d = this.svc; const row = (it, i, pouch) => `<div class="irow"><span style="color:${RCOL[LOOT[it.ref].r]}">${esc(lootName(it.ref))}${it.q >= 1.2 ? '★' : ''} <small>${LOOT_CAT[LOOT[it.ref].cat]} ${LOOT[it.ref].w}kg ${esc(PROV[it.prov])}</small></span><span>${pouch ? `<button data-act="sl" data-do="pouch" data-i="${i}" data-to="0">バッグへ</button>` : `<button data-act="sl" data-do="pouch" data-i="${i}" data-to="1">ポーチへ</button> <button data-act="sl" data-do="drop" data-i="${i}">捨てる</button>`}</span></div>`;
    return this.wrap(`探索バッグ <small>${d.w}/${d.cap}kg ・ 推定${G(d.v)}</small>`, `<h3>保険ポーチ（${d.pouch.length}/2）— 倒れても失わない</h3>${d.pouch.map((it, i) => row(it, i, true)).join('') || '<p class="dim">空</p>'}<h3>バッグ</h3>${d.bag.map((it, i) => row(it, i, false)).join('') || '<p class="dim">空</p>'}`); };
  P.p_market = function () { const d = this.svc; const inv = d.mine;
    const items = d.items.slice().sort((a, b) => a.r - b.r).map(it => `<tr><td style="color:${RCOL[it.r]}">${esc(it.name)}<br><small>${esc(it.cat)}</small></td><td>${G(it.price)}<br><small class="${it.pct >= 0 ? 'good' : 'warn'}">${it.pct >= 0 ? '+' : ''}${it.pct}%</small></td><td>${spark(it.hist)}</td><td><small>供給${it.supply} 需要${it.demand}<br>在庫${it.stock} ・ ${it.hint}</small></td><td>${['guildbox', 'deed'].includes(it.k) ? '' : `<button data-act="mk" data-do="buy" data-ref="${it.k}">買 ${G(it.buy)}</button>`}</td></tr>`).join('');
    const mine = inv.map(it => d.inraid ? `<div class="irow"><span>${esc(it.name)} <small>${esc(it.provName)}</small></span><button data-act="mk" data-do="sell" data-i="${it.i}">売る ${G(Math.round(it.black * 0.85))}</button></div>`
      : `<div class="srow"><div class="sh"><b style="color:${RCOL[it.r]}">${esc(it.name)} ×${it.n}</b><small>${esc(it.provName)} ・ 品質${it.q}</small></div><p>${d.fence ? '故買' : '闇市'} ${G(it.black)} ・ 正規店 ${it.regular ? G(it.regular) : '<span class="warn">不可</span>'} ・ ギルド ${it.guild ? G(it.guild) : '不可'}</p>
        <button class="primary" data-act="mk" data-do="sell" data-uid="${it.uid}" data-ch="${d.fence ? 'fence' : 'black'}">${d.fence ? '故買屋に売る' : '闇市で売る'}</button> ${it.guild ? `<button data-act="mk" data-do="sell" data-uid="${it.uid}" data-ch="guild">ギルドに売る</button>` : ''}
        <button data-act="mk" data-do="launder" data-how="pawn" data-uid="${it.uid}">質屋に流す</button> ${['unknown', 'ruins', 'slum'].includes(it.prov) ? `<button data-act="mk" data-do="launder" data-how="appraise" data-uid="${it.uid}">鑑定（出所証明）</button>` : ''} ${it.prov === 'illegal' ? `<button data-act="mk" data-do="launder" data-how="fence" data-uid="${it.uid}">出所洗浄</button>` : ''}</div>`).join('');
    return this.wrap(`${esc(d.who)} ― ${esc(d.name)} <small>支配：${esc(d.ctlName)} ・ 所持 ${G(d.gold)}</small>`, `<p class="dim">相場は需要と供給で少しずつ動く。グラフは過去の推移で、将来の価格を保証するものではない。${d.inraid ? '探索中の売却は手数料15%。' : ''}</p>
      <div class="split"><div style="overflow:auto"><table class="stats wide"><tr><th>品目</th><th>価格</th><th>推移</th><th>需給</th><th></th></tr>${items}</table></div><div><h3>${d.inraid ? 'バッグの品' : '手持ちの戦利品'}</h3>${mine || '<p class="dim">売れる品がない</p>'}
      <h3>噂</h3>${d.news.map(n => `<p class="dim">・${esc(n)}</p>`).join('') || '<p class="dim">特になし</p>'}<h3>最近の取引</h3>${d.tx.slice(0, 6).map(t => `<p class="dim">${t.side === 'sell' ? '売' : '買'} ${esc(t.name)}×${t.n} ${G(t.price)}</p>`).join('')}</div></div>`); };
  P.p_hideout = function () { const d = this.svc;
    if (!d.owned) return this.wrap('隠れ家', `<p>スラムに隠れ家を持てば、戦利品の保管・分解・鍛造・研究ができ、同じ地域の探索では隠れ家への抜け道から脱出できる。</p>
      <h3>入手方法</h3>${d.can.map(o => `<div class="srow"><div class="sh"><b>${esc(o.name)}</b><small>${esc(o.cond)}${o.by ? ' ・ ' + esc(o.by) : ''}</small></div>${d.regions.map(r => `<button ${o.ok ? '' : 'disabled'} data-act="ho" data-do="acquire" data-k="${o.k}" data-rid="${r.k}">${esc(r.name)}</button>`).join(' ')}</div>`).join('')}`);
    const facs = d.fac.map(f => `<div class="srow"><div class="sh"><b>${esc(f.name)} ${f.lv ? 'Lv' + f.lv : ''}</b><small>${esc(f.desc)}</small></div><p class="dim">${f.lv >= 3 ? '最大' : cost(f.cost)}</p>${d.inside ? `${f.lv < 3 ? `<button data-act="ho" data-do="install" data-k="${f.k}">${f.lv ? '強化' : '設置'}</button>` : ''} ${f.lv ? `<button class="primary" data-act="ho" data-do="use" data-f="${f.k}">使う</button>` : ''}` : ''}</div>`).join('');
    const st = (list, from) => list.map((it, i) => `<div class="irow"><span>${esc(lootName(it.ref))} ×${it.n}</span>${d.inside ? `<button data-act="ho" data-do="take" data-i="${i}" data-from="${from}">取り出す</button>` : ''}</div>`).join('') || '<p class="dim">空</p>';
    return this.wrap(`隠れ家「${esc(d.name)}」 <small>${esc(d.region)} ・ 段階${d.lv + 1}</small>`, `<div class="split"><div><p>発覚リスク <b class="${d.exposure >= 45 ? 'warn' : ''}">${esc(d.risk)}</b>（${d.exposure}） ・ 公開設定 ${['private', 'party', 'public'].map(v => `<button class="${d.vis === v ? 'sel' : ''}" data-act="ho" data-do="vis" data-v="${v}">${{ private: '非公開', party: 'パーティー', public: '公開' }[v]}</button>`).join('')}</p>
      <p class="dim">発覚度は探索・洗浄で上がり、時間と警備設備で下がる。荒らされても失うのは保管庫の安価な品の一部（最大10%）だけ。隠し収納・設備・武器・所持金は守られる。</p>
      ${d.inside ? (d.next ? `<p>次の段階「${esc(d.next.name)}」：${cost(d.next.cost)} <button class="primary" data-act="ho" data-do="upgrade">拡張</button></p>` : '<p class="good">最大段階</p>') : `<button class="primary" data-act="ho" data-do="enter">隠れ家に入る</button>`} <button data-act="hoVisit">他の隠れ家を訪ねる</button>
      <h3>設備（${d.fac.filter(f => f.lv).length}/${d.slots}）</h3>${facs}</div>
      <div><h3>保管庫 ${d.storage.reduce((a, i) => a + i.n, 0)}/${d.storageCap}</h3>${st(d.storage, 'storage')}<h3>隠し収納 ${d.stash.reduce((a, i) => a + i.n, 0)}/${d.stashCap}</h3>${st(d.stash, 'stash')}
      ${d.inside ? `<h3>手持ちの戦利品を預ける</h3>${d.inv.map(it => `<div class="irow"><span>${esc(lootName(it.ref))} ×${it.n}</span><span><button data-act="ho" data-do="store" data-uid="${it.uid}" data-to="storage">保管庫</button>${d.stashCap ? ` <button data-act="ho" data-do="store" data-uid="${it.uid}" data-to="stash">隠し収納</button>` : ''}</span></div>`).join('') || '<p class="dim">なし</p>'}` : ''}
      <h3>記録</h3>${d.log.map(l => `<p class="dim">${esc(l.v)}</p>`).join('')}${d.visits.length ? `<p class="dim">訪問者：${d.visits.map(v => esc(v.who)).join('、')}</p>` : ''}</div></div>`); };
  P.p_hfac = function () { const d = this.svc;
    if (d.f === 'workbench') return this.wrap(`作業台 Lv${d.lv}`, `<p>戦利品を分解して既存の素材（強化鉱石・皮・薬草・魔晶片・遺物の欠片など）に変える。Lvが高いほど収率が上がる。</p>${d.items.map(it => `<div class="irow"><span>${esc(lootName(it.ref))} ×${it.n}</span><button data-act="ho" data-do="use" data-f="workbench" data-uid="${it.uid}">分解</button></div>`).join('') || '<p class="dim">分解できる品がない</p>'}`);
    if (d.f === 'forge') return this.wrap(`闇鍛冶炉 Lv${d.lv}`, `<p>非合法武器部品×3で武器を鍛造（レア度${Math.min(5, 2 + d.lv)}以上を保証）。所持：部品${d.parts}・調律キット${d.tune}</p><p><select id="hwt">${WEAPON_TYPES.filter(w => !w.myth).map(w => `<option value="${w.id}">${w.id}. ${esc(w.name)}</option>`).join('')}</select> <button class="primary" data-act="forgeGo">鍛造する</button></p><p><button data-act="tuneGo">装備中の武器を調律（+1）</button></p>`);
    return this.wrap('設備', '<p>—</p>'); };
  P.p_terminal = function () { const d = this.svc; return this.wrap('情報端末 ― 各地の闇相場', d.regions.map(r => `<h3>${esc(r.name)} <small>支配：${esc(r.ctlName)} ・ 兆候：${(d.omen[r.region] || []).map(esc).join('、')}</small></h3><table class="stats wide">${r.items.map(it => `<tr><td>${esc(it.name)}</td><td>${G(it.price)}</td><td class="${it.pct >= 0 ? 'good' : 'warn'}">${it.pct >= 0 ? '+' : ''}${it.pct}%</td><td>${spark(it.hist, 70, 18)}</td><td><small>${it.hint}</small></td></tr>`).join('')}</table>`).join('') + '<p class="dim">兆候は噂であり、必ず起きるとは限らない。</p>'); };
  P.p_raidResult = function () { const r = this.raidRes; if (!r) return '';
    if (r.ok) return this.wrap('<span class="good">脱出成功</span>', `<p>${esc(r.via)}から脱出した。所要 ${Math.floor(r.time / 60)}分${r.time % 60}秒 ・ 撃破 ${r.kills}</p><h3>持ち帰った戦利品（推定 ${G(r.value)}）</h3>${r.items.map(it => `<p style="color:${RCOL[LOOT[it.ref].r]}">${esc(lootName(it.ref))} ×${it.n || 1} <small>${esc(PROV[it.prov])}</small></p>`).join('') || '<p class="dim">なし</p>'}<p class="dim">戦利品は所持品に入った。闇市・ギルド・正規店（出所による）で売るか、隠れ家で加工できる。</p>`);
    return this.wrap(`<span class="warn">${{ death: '探索失敗：戦闘不能', mia: '探索失敗：行方不明', dc: '探索終了：接続切れ' }[r.cause] || '探索失敗'}</span>`, `<h3>失ったもの</h3>${r.lost.map(x => `<p class="warn">${esc(x.name)} ×${x.n}</p>`).join('') || '<p class="dim">なし</p>'}${r.lostWeapon ? `<p class="warn">装備武器「${esc(r.lostWeapon)}」を失った（予備の武器を装備した）</p>` : r.insured ? '<p class="good">武器は保険で守られた</p>' : ''}
      <h3>持ち帰ったもの（保険ポーチ）</h3>${r.kept.map(x => `<p class="good">${esc(x.name)} ×${x.n}</p>`).join('') || '<p class="dim">なし</p>'}<p class="tip">💡 ${esc(r.tip)}</p>`); };
}
void FACILITIES; void EVENTS; void LAYERS;
