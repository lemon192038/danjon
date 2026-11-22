// City-expansion UI panels (installed onto UI.prototype). All data comes from the server; actions go through net.menu.
import { D, loadType } from './data.js';
import { ITEMS, CAT_NAMES } from '/shared/data/guilds.js';
import { WEAPON_TYPES, WT_BY_ID } from '/shared/data/weaponTypes.js';
import { RARITIES } from '/shared/constants.js';
import { charSprite } from './sprites.js';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const G = n => Number(n || 0).toLocaleString() + 'G';
const WX = { clear: '☀ 晴れ', cloud: '☁ 曇り', rain: '☂ 雨', snow: '❄ 雪', fog: '🌫 霧', wind: '🍃 強風', storm: '⛈ 嵐', smog: '🏭 煤煙', aurora: '✨ 魔力オーロラ' };
const PANELS = { guild: 'guild', travel: 'travel', stops: 'stops', trade: 'trade', realty: 'realty', home: 'home', myshop: 'myshop', bank: 'bank', casino: 'casino', arena: 'arena', blackmarket: 'blackmarket', lore: 'lore', info: 'info', outfit: 'outfit', furniture: 'furniture', craft: 'craft', resident: 'resident', story: 'story' };
export const OBJ_HINT = { bookcase: '本を読む', lectern: '記録を読む', statue: '碑文を読む', display: '展示を見る', telescope: '望遠鏡を覗く', globe: '天球儀を見る', altar: '祈る', vault: '金庫', slot: 'スロット', roulette: 'ルーレット', forge: '鍛造する', anvil: '鍛造する', bed: '休む', chest: '保管庫', kitchen: '料理する', board: '掲示板', node: '採集する', myshop: '店の経営' };
export function installCity(UI) {
  const P = UI.prototype;
  P.cityPanel = function (service, data) { if (!PANELS[service]) return false; this.svc = data; this.open(PANELS[service], service); return true; };
  P.onEnv = function (env) { const el = this.$('#clock'); if (el) el.textContent = `🕐 ${String(env.h).padStart(2, '0')}:${String(env.m).padStart(2, '0')}  ${WX[env.wx] || ''}`; };
  P.loading = function (text, ms, mode) { const el = document.getElementById('loadingov'); el.innerHTML = `<div><div class="lmode">${{ carriage: '🐎', ship: '⛵', rail: '🚂', airship: '🛩' }[mode] || '🚪'}</div><div>${esc(text)}</div><div class="lbar"><i style="animation-duration:${ms}ms"></i></div></div>`; el.classList.add('on'); clearTimeout(this._lt); this._lt = setTimeout(() => el.classList.remove('on'), ms + 300); };
  P.cityHint = function (z, p) {
    const h = this.state.env?.h ?? 12; let hint = '';
    for (const d of z.doors || []) if (Math.hypot(d.x * 16 + 8 - p.x, d.y * 16 + 8 - (p.y - 6)) < 22) { const open = !d.hours || (d.hours[0] < d.hours[1] ? h >= d.hours[0] && h < d.hours[1] : h >= d.hours[0] || h < d.hours[1] % 24); hint = `[F] ${d.mine ? '🏠 自宅/自分の店に入る' : '入る：' + d.name}${open ? '' : `（閉店中 ${d.hours[0]}〜${d.hours[1] % 24}時）`}`; }
    for (const s of z.stops || []) if (Math.hypot(s.x * 16 + 8 - p.x, s.y * 16 + 8 - p.y) < 26) hint = `[F] 乗合：${s.name}から移動`;
    for (const o of z.objects || []) if (Math.hypot(o.x * 16 + 8 - p.x, o.y * 16 + 8 - p.y) < 24) hint = `[F] ${OBJ_HINT[o.k] || '調べる'}`;
    for (const e of this.state.ents.values()) if (e.seen && e.d.kind === 'resident' && Math.hypot(e.x - p.x, e.y - p.y) < 26) hint = `[F] 話す：${e.d.name}（${e.d.job}）`;
    if (z.kind === 'interior') { const mx = z.w >> 1; if (Math.abs(p.x - mx * 16) < 24 && p.y > (z.h - 2) * 16) hint = '▼ 出口'; }
    return hint;
  };
  P.cityAct = function (a, t) {
    const v = t.dataset.v, m = this.net.menu.bind(this.net), d = t.dataset, sv = this.svc || {};
    const num = sel => +(this.modal.querySelector(sel)?.value || 0);
    switch (a) {
      case 'g': return m('guild', { gid: sv.id, act: d.do, id: d.id, i: +d.i }) || true;
      case 'travelGo': this.closeModal(); return m('travel', { to: v }) || true;
      case 'stopGo': this.closeModal(); return m('stop', { district: v }) || true;
      case 'tr': return m('trade', { g: v, n: +d.n, sell: d.sell === '1' }) || true;
      case 're': return m('realty', { bldg: v, act: d.do, use: d.use }) || true;
      case 'hm': return m('home', { act: d.do, uid: d.uid, k: d.k, i: +d.i }) || true;
      case 'ms': { if (d.do === 'stock') { const n = +prompt('並べる数量', '1') || 1; const price = +prompt('販売価格（G）', d.fair || '100') || 0; return m('myshop', { act: 'stock', uid: d.uid, n, price }) || true; } if (d.do === 'price') { const price = +prompt('新しい価格（G）', d.p) || 0; return m('myshop', { act: 'price', i: +d.i, price }) || true; } if (d.do === 'name') return m('myshop', { act: 'name', name: prompt('店の名前', sv.name) }) || true; return m('myshop', { act: d.do, i: +d.i, night: d.night === '1' }) || true; }
      case 'bk': return m('bank', { act: d.do, n: num('#bankn') }) || true;
      case 'cs': return m('casino', { game: d.game, pick: d.pick ?? this.modal.querySelector('#rpick')?.value, bet: num('#cbet') }) || true;
      case 'arenaGo': this.closeModal(); return m('arena') || true;
      case 'bm': return m('black', { ref: v }) || true;
      case 'infoBuy': return m('info') || true;
      case 'outfitGo': return m('outfit', { outfit: num('#of_o'), hairColor: num('#of_c'), hair: num('#of_h') }) || true;
      case 'furnBuy': return m('buyFurn', { k: v }) || true;
      case 'craftGo': return m('craft', { wt: num('#craftwt') }) || true;
      case 'reqDo': return m('req', { id: sv.id, act: d.do }) || (this.closeModal(), true);
      case 'storyDo': return m('story', { city: sv.city, choice: d.choice }) || true;
      case 'useItem': return m('use', { ref: v }) || true;
    }
    return false;
  };
  P.p_guild = function () {
    const g = this.svc; if (!g) return '';
    const rel = Object.entries(g.rel).map(([k, v]) => v.length ? `<span class="${k === 'ally' ? 'good' : k === 'enemy' ? 'warn' : ''}">${{ ally: '協力', rival: '競争', enemy: '敵対' }[k]}: ${v.map(esc).join('、')}</span>` : '').filter(Boolean).join('<br>');
    const quests = g.quests.map(q => { const act = g.active.find(a => a.id === q.id); return `<div class="srow"><div class="sh"><b>${esc(q.desc)}</b><small>貢献+${q.reward.pts} ・ ${G(q.reward.gold)} ・ EXP${q.reward.xp.toLocaleString()}</small></div>${act ? '<small class="good">受注中</small>' : `<button data-act="g" data-do="accept" data-id="${q.id}">受注</button>`}</div>`; }).join('');
    const active = g.active.map(q => `<div class="srow"><div class="sh"><b>${esc(q.desc)}</b><small>${q.kind === 'gather' || q.kind === 'fund' || q.kind === 'deliver' ? '納品/支払いで達成' : `${q.prog || 0}/${q.n || 1}`}</small></div><button class="primary" data-act="g" data-do="turnin" data-id="${q.id}">報告</button> <button data-act="g" data-do="abandon" data-id="${q.id}">破棄</button></div>`).join('');
    const shop = g.shop.map((it, i) => `<div class="irow"><span style="color:${it.rar ? RARITIES[it.rar].color : ''}">${esc(it.name)} <small>${esc(it.desc)}</small></span><span>${it.price ? G(it.price) : ''} ${it.rank ? `<small>${esc(g.ranks[it.rank])}〜</small>` : ''} <button data-act="g" data-do="buy" data-i="${i}" ${g.member ? '' : 'disabled'}>${it.kind === 'service' ? '開く' : '購入'}</button></span></div>`).join('');
    return this.wrap(`${esc(g.name)} <small>${CAT_NAMES[g.cat]}</small>`, `<div class="split"><div>
      <p class="say">「${esc(g.ideal)}」</p><p>活動：${esc(g.activity)}</p><p>本部：${esc(g.hq)} ${g.branches.length ? `／ 支部：${g.branches.map(esc).join('・')}` : ''}</p><p>規模：${esc(g.size)} ・ 代表：${esc(g.leader)}${g.officers.length ? ` ・ 幹部：${g.officers.map(esc).join('、')}` : ''}</p><p>施設：${esc(g.facility)}</p>
      <p>固有イベント：${esc(g.event)} ${g.eventActive ? '<b class="good">【開催中：報酬1.3倍】</b>' : ''}</p><p>${rel}</p>
      <h3>所属状況</h3>${g.member ? `<p>ランク <b>${esc(g.rankName)}</b> ・ 貢献 ${g.pts}${g.next != null ? ` / 次 ${g.next}` : '（最高位）'} ・ 評判 ${g.rep}</p><button data-act="g" data-do="leave">脱退する</button>` : `<p>評判 ${g.rep}</p>${g.joinBlock.length ? `<p class="warn">加入不可：${g.joinBlock.map(esc).join(' / ')}</p>` : '<button class="primary" data-act="g" data-do="join">加入する</button>'}`}
      <p class="dim">ランク：${g.ranks.map(esc).join(' → ')}</p></div>
      <div>${g.member ? `<h3>ギルド依頼（本日）</h3>${quests}<h3>受注中</h3>${active || '<p class="dim">なし</p>'}` : '<p class="dim">加入するとギルド依頼を受けられます</p>'}<h3>ギルドショップ</h3>${shop}</div></div>`);
  };
  P.p_travel = function () { const d = this.svc; return this.wrap(`${esc(d.cityName)} 発 交通案内 <small>${esc(d.weather)}</small>`, `<div class="slist">${d.routes.map(r => `<div class="srow"><div class="sh"><b>→ ${esc(r.toName)}</b><small>${esc(r.modeName)} ・ 所要${r.min}分 ・ ${G(r.fee)}</small></div>${r.blocked ? '<span class="warn">嵐のため欠航</span>' : `<button class="primary" data-act="travelGo" data-v="${r.to}">出発</button>`}</div>`).join('')}</div><p class="dim">都市間はフィールドを歩いても移動できます。交通機関は天候の影響を受けます。</p>`); };
  P.p_stops = function () { const d = this.svc; return this.wrap('街内交通（乗合）', `<div class="slist">${d.stops.filter(s => s.district !== d.here).map(s => `<div class="irow"><span>${esc(s.name)}</span><button data-act="stopGo" data-v="${s.district}">${d.fee}Gで移動</button></div>`).join('')}</div>`); };
  P.p_trade = function () { const d = this.svc; const used = Object.values(d.cargo).reduce((a, b) => a + b, 0); return this.wrap(`${esc(d.cityName)} 交易所 <small>積荷 ${used}/${d.cap}</small>`, `<table class="stats wide"><tr><th>品目</th><th>買値</th><th>売値</th><th>所持</th><th></th></tr>${d.list.map(x => `<tr><td>${esc(x.name)} <small class="good">${x.local}</small></td><td>${G(x.buy)}</td><td>${G(x.sell)}</td><td>${d.cargo[x.g] || 0}</td><td><button data-act="tr" data-v="${x.g}" data-n="1">買1</button><button data-act="tr" data-v="${x.g}" data-n="5">買5</button><button data-act="tr" data-v="${x.g}" data-n="1" data-sell="1">売1</button><button data-act="tr" data-v="${x.g}" data-n="5" data-sell="1">売5</button></td></tr>`).join('')}</table><p class="dim">特産品は安く、需要の大きい品は高く売れます。大量に売買すると相場が動き、物流（隊商・船便）で徐々に戻ります。</p><h4>物流ニュース</h4><ul class="log">${d.news.map(n => `<li>${esc(n)}</li>`).join('')}</ul>`); };
  P.p_realty = function () { const d = this.svc; return this.wrap(`${esc(d.cityName)} 不動産`, `<div class="slist">${d.list.map(p => `<div class="srow"><div class="sh"><b>${esc(p.tierName)}</b><small>${esc(p.district)} ・ 保管${p.storage} ・ 家具${p.slots}</small></div><p>購入 ${G(p.price)} ／ 賃貸 ${G(p.rent * 7)}（7日）</p>${p.owned ? `<small class="good">契約中（${p.owned.use === 'shop' ? '店舗' : '自宅'}・${p.owned.mode === 'rent' ? `${p.owned.until - d.day}日残` : '所有'}）</small> ${p.owned.mode === 'rent' ? `<button data-act="re" data-v="${p.bldg}" data-do="renew">延長</button>` : ''}<button data-act="re" data-v="${p.bldg}" data-do="release">${p.owned.mode === 'buy' ? '売却' : '解約'}</button>` : `<button class="primary" data-act="re" data-v="${p.bldg}" data-do="buy">購入</button><button data-act="re" data-v="${p.bldg}" data-do="rent">賃貸</button>${p.dtype === 'commerce' || p.dtype === 'common' ? `<button data-act="re" data-v="${p.bldg}" data-do="buy" data-use="shop">店舗として購入</button>` : ''}`}</div>`).join('')}</div><p class="dim">契約した建物の扉から入ると自宅（または自分の店）になります。家具は職人ギルドや不動産屋で購入できます。</p>`); };
  P.p_home = function () {
    const d = this.svc, ch = this.self.ch; const name = it => it.kind === 'weapon' ? D.weapons.get(it.ref)?.name : it.kind === 'armor' ? '防具' : ITEMS[it.ref]?.name || it.ref;
    return this.wrap(`${esc(d.tierName)}`, `<div class="split"><div><button class="primary" data-act="hm" data-do="rest">ベッドで休む</button> <button data-act="hm" data-do="cook">料理する（薬草2＋皮1）</button>
      <h3>保管庫 ${d.storage.length}/${d.cap}</h3>${d.storage.map(it => `<div class="irow"><span>${esc(name(it))}${it.n ? ' ×' + it.n : ''}</span><span>${it.kind === 'weapon' || it.kind === 'armor' ? `<button data-act="hm" data-do="display" data-uid="${it.uid}">${d.shown.includes(it.uid) ? '展示をやめる' : '展示'}</button>` : ''}<button data-act="hm" data-do="withdraw" data-uid="${it.uid}">取り出す</button></span></div>`).join('') || '<p class="dim">空</p>'}
      <h3>所持品を預ける</h3>${ch.inventory.filter(i => !Object.values(ch.equip).includes(i.uid)).map(it => `<div class="irow"><span>${esc(name(it))}${it.n ? ' ×' + it.n : ''}</span><button data-act="hm" data-do="deposit" data-uid="${it.uid}">預ける</button></div>`).join('')}</div>
      <div><h3>家具（${d.furn.length}/${d.slots}）</h3>${d.furn.map((k, i) => `<div class="irow"><span>${esc(d.catalog[k]?.name || k)}</span><button data-act="hm" data-do="remove" data-i="${i}">片付ける</button></div>`).join('') || '<p class="dim">まだ何も置いていない</p>'}
      <h4>手持ちの家具</h4>${Object.entries(d.owned).filter(([, n]) => n > 0).map(([k, n]) => `<div class="irow"><span>${esc(d.catalog[k]?.name || k)} ×${n}</span><button data-act="hm" data-do="place" data-k="${k}">配置</button></div>`).join('') || '<p class="dim">家具は不動産屋・職人ギルドで買えます</p>'}
      <p class="dim">武具展示：${d.shown.length}/${d.display}（保管庫の武具を展示台に飾れます）</p></div></div>`);
  };
  P.p_myshop = function () { const d = this.svc, ch = this.self.ch; const nm = st => st.kind === 'weapon' ? D.weapons.get(st.ref)?.name : ITEMS[st.ref]?.name || st.ref;
    return this.wrap(`${esc(d.name)} <small>店舗ランク${d.rank || 0} ・ 評判${d.rep}</small>`, `<div class="split"><div><p>売上累計 ${d.sales}件 ・ レジ ${G(d.till)} <button class="primary" data-act="ms" data-do="collect">売上を回収</button></p><p>従業員 ${d.staff}人（日給100G） <button data-act="ms" data-do="hire">雇う</button><button data-act="ms" data-do="fire">解雇</button></p><p>営業時間 ${d.hours[0]}〜${d.hours[1]}時 <button data-act="ms" data-do="hours">昼営業</button><button data-act="ms" data-do="hours" data-night="1">夜営業</button> <button data-act="ms" data-do="name">店名変更</button></p>
      <h3>陳列中（${d.stock.length}/12）</h3>${d.stock.map((st, i) => `<div class="irow"><span>${esc(nm(st))} ×${st.n}</span><span>${G(st.price)} <small>(相場${G(d.fair[i])})</small> <button data-act="ms" data-do="price" data-i="${i}" data-p="${st.price}">値付け</button><button data-act="ms" data-do="unstock" data-i="${i}">下げる</button></span></div>`).join('') || '<p class="dim">商品を並べましょう</p>'}</div>
      <div><h3>所持品から陳列</h3>${ch.inventory.filter(i => !Object.values(ch.equip).includes(i.uid)).map(it => `<div class="irow"><span>${esc(it.kind === 'weapon' ? D.weapons.get(it.ref)?.name : ITEMS[it.ref]?.name || it.ref)}${it.n ? ' ×' + it.n : ''}</span><button data-act="ms" data-do="stock" data-uid="${it.uid}">並べる</button></div>`).join('')}<p class="dim">街の客（NPC）が時間とともに買っていきます。相場より安いほど売れ、評判が上がります。立地（富裕区ほど客の財布が厚い）・天候・従業員数も影響します。</p></div></div>`); };
  P.p_bank = function () { const d = this.svc; return this.wrap('銀行', `<p>預金残高 <b>${G(d.bal)}</b> ・ 所持金 ${G(d.gold)}</p><p><input id="bankn" type="number" min="0" value="1000"> <button class="primary" data-act="bk" data-do="dep">預ける</button> <button data-act="bk" data-do="wd">引き出す</button></p><p class="dim">預金はダンジョンで倒れても減りません。日利0.2%（上限あり）。</p>`); };
  P.p_casino = function () { const r = this.casinoRes; return this.wrap('カジノ', `<p class="dim">ゲーム内通貨のみ使用。1日の賭け上限は200,000G。</p><p>賭け金 <input id="cbet" type="number" min="10" max="5000" value="100"> 所持金 ${G(this.self.ch.gold)}</p>
    <h3>スロット</h3><button class="primary" data-act="cs" data-game="slot">回す</button><h3>ルーレット</h3><select id="rpick"><option value="red">赤（2倍）</option><option value="black">黒（2倍）</option>${Array.from({ length: 37 }, (_, i) => `<option value="${i}">${i}（36倍）</option>`).join('')}</select> <button class="primary" data-act="cs" data-game="roulette">賭ける</button>
    ${r ? `<div class="casino"><span>${r.res.map(esc).join(' ')}</span> ${r.win ? `<b class="good">+${G(r.win)}</b>` : '<span class="warn">はずれ</span>'}</div>` : ''}`); };
  P.p_arena = function () { const d = this.svc; return this.wrap('闘技場', `<p>3連戦の試合に挑む。勝てば賞金と闘技者ギルドの評価を得られる。</p><p>通算勝利 ${d.wins} ・ 闘技者ランク ${d.rank}</p><button class="primary" data-act="arenaGo">試合に出る</button>`); };
  P.p_blackmarket = function () { const d = this.svc; return this.wrap('闇市', `<p class="warn">ここでの取引は騎士団の評判を下げる。</p><div class="slist">${d.list.map(w => `<div class="irow"><span style="color:${RARITIES[w.rar].color}">${esc(w.name)} <small>${esc(w.wt)} Lv${w.lvl}</small></span><button data-act="bm" data-v="${w.ref}">${G(w.price)}</button></div>`).join('')}${d.mats.map(x => `<div class="irow"><span>${esc(x.name)}</span><button data-act="bm" data-v="${x.ref}">${G(x.price)}</button></div>`).join('')}</div>`); };
  P.p_lore = function () { const d = this.svc; return this.wrap(esc(d.title), `<p class="lore">${esc(d.text)}</p>`); };
  P.p_info = function () { return this.wrap('情報屋', `<p>「…何が知りたい？ 300Gで一つ教えてやる」</p><button class="primary" data-act="infoBuy">情報を買う（300G）</button>`); };
  P.p_outfit = function () { const L = this.svc.look; setTimeout(() => { const cv = this.modal.querySelector('#ofprev'); if (!cv) return; const upd = () => { const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; g.clearRect(0, 0, 64, 96); g.save(); g.scale(4, 4); g.drawImage(charSprite({ ...L, outfit: +this.modal.querySelector('#of_o').value, hairColor: +this.modal.querySelector('#of_c').value, hair: +this.modal.querySelector('#of_h').value }), 0, 0); g.restore(); }; this.modal.querySelectorAll('select').forEach(s => s.onchange = upd); upd(); }, 0);
    const opt = (id, n, cur) => `<select id="${id}">${Array.from({ length: n }, (_, i) => `<option value="${i}" ${i === cur ? 'selected' : ''}>${i + 1}</option>`).join('')}</select>`;
    return this.wrap('仕立て屋', `<canvas id="ofprev" width="64" height="96" style="image-rendering:pixelated;background:#1a1430"></canvas><p>衣装 ${opt('of_o', 10, L.outfit)} 髪色 ${opt('of_c', 10, L.hairColor)} 髪型 ${opt('of_h', 6, L.hair)}</p><button class="primary" data-act="outfitGo">仕立てる（${G(this.svc.price)}）</button>`); };
  P.p_furniture = function () { const d = this.svc; return this.wrap('家具カタログ', `<div class="slist">${Object.entries(d.list).map(([k, f]) => `<div class="irow"><span>${esc(f.name)} <small>所持${d.owned[k] || 0}</small></span><button data-act="furnBuy" data-v="${k}">${G(f.price)}</button></div>`).join('')}</div>`); };
  P.p_craft = function () { const d = this.svc; return this.wrap('鍛造', `<p>強化鉱石3個＋${G(d.cost)}で武具を一本鍛える。鍛冶師ギルドのランク（現在${d.rank}）が高いほど良い品ができやすい。</p><p><select id="craftwt">${WEAPON_TYPES.filter(w => !w.myth).map(w => `<option value="${w.id}" ${w.id === this.self.d.wt ? 'selected' : ''}>${w.name}</option>`).join('')}</select> <button class="primary" data-act="craftGo">鍛造する</button></p>`); };
  P.p_resident = function () { const d = this.svc; const q = d.req; const ITN = r => ITEMS[r]?.name || r;
    return this.wrap(`${esc(d.name)} <small>${esc(d.job)} ・ ${esc(d.pers)}</small>`, `<p class="say">「${esc(d.line)}」</p>${d.family ? `<p class="dim">${esc(d.family)}家の一員</p>` : ''}${d.guild ? `<p class="dim">${esc(d.guild)}に関わる仕事をしている</p>` : ''}
    ${q ? `<h3>頼みごと</h3><p>${q.kind === 'item' ? `${esc(ITN(q.ref))}を${q.n}個持ってきてほしい` : `近くのフィールドで${esc(D.content.families.find(f => f[0] === q.fam)?.[1] || q.fam)}を${q.n}体倒してほしい`}（お礼 ${G(q.reward)}）</p>${q.active ? '<button class="primary" data-act="reqDo" data-do="turnin">報告する</button>' : '<button class="primary" data-act="reqDo" data-do="accept">引き受ける</button>'}` : ''}`); };
  P.p_story = function () { const d = this.svc; const s = d.cur;
    return this.wrap(`${esc(d.cityName)}：${esc(d.name)} <small>${Math.min(d.step + 1, d.total)}/${d.total}</small>`, `${d.outcome ? `<p class="warn">この街の運命は既に決した：${esc(d.outcome.by)}が「${esc(d.outcome.choice)}」を選んだ。${esc(d.outcome.effect)}</p>` : ''}
    ${d.done ? `<p class="good">この物語を最後まで見届けた（あなたの選択：${esc(d.mine)}）</p>` : `<p class="lore">${esc(s.text)}</p>${s.kind === 'choice' ? s.options.map(o => `<button class="primary" data-act="storyDo" data-choice="${o.id}">${esc(o.label)}</button>`).join(' ') : `<p class="dim">${s.kind === 'kill' || s.kind === 'floor' ? `進行 ${Math.min(d.prog, s.n || 1)}/${s.n || 1}` : ''}</p><button class="primary" data-act="storyDo">${s.kind === 'talk' ? '話を聞く' : s.kind === 'fund' ? `支払う（${G(s.gold)}）` : s.kind === 'deliver' ? '届ける' : '報告する'}</button>`}`}`); };
  P.p_city = function () { const c = this.cityInfo; if (!c) { this.net.menu('cityInfo'); return this.wrap('都市', '<p>読み込み中…</p>'); } const C = c.city;
    return this.wrap(`${esc(C.name)} <small>${esc(C.title)}</small>`, `<div class="split"><div><p>${esc(c.weather)} ・ ${String(c.time.hour).padStart(2, '0')}:${String(c.time.minute).padStart(2, '0')} ・ 治安 ${'★'.repeat(C.security)}${'☆'.repeat(5 - C.security)}</p>
      ${c.state ? `<p class="warn">現在の情勢：${esc(c.state.effect)}（${esc(c.state.by)}の選択）</p>` : ''}
      <h4>歴史</h4><ol>${C.history.map(h => `<li>${esc(h)}</li>`).join('')}</ol><p>成立：${esc(C.origin)}（${esc(C.founded)}）</p>
      <h4>街の姿</h4><p>地理：${esc(C.geography)}<br>気候：${esc(C.climate)}<br>建築：${esc(C.architecture)}<br>ランドマーク：${esc(C.landmark)}</p>
      <h4>経済と政治</h4><p>産業：${C.industry.map(esc).join('・')}<br>経済：${esc(C.economy)}<br>政治：${esc(C.politics)}<br>支配者：${esc(C.ruler)}<br>階級：${esc(C.classes)}</p><h4>文化と暮らし</h4><p>${esc(C.culture)}<br>${esc(C.lifestyle)}</p><p>周辺の魔物：${C.monsters.map(esc).join('・')} ／ 行事：${C.events.map(esc).join('、')}</p></div>
      <div><h4>地区と施設</h4>${C.districts.map(d => `<p><b>${esc(d.name)}</b> <small>${{ rich: '富裕・娯楽', commerce: '商業・行政', common: '庶民', slum: 'スラム' }[d.type] || ''}</small><br>${d.buildings.map(b => `${esc(b.name)}${b.hours ? `<small>(${b.hours[0]}〜${b.hours[1] % 24}時)</small>` : ''}`).join('、')}</p>`).join('')}<h4>ニュース</h4><ul class="log">${c.news.map(n => `<li>${esc(n)}</li>`).join('') || '<li class="dim">特になし</li>'}</ul></div></div>`); };
}
