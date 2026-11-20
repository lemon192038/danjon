// Client entry: boot, auth screens, character creation, main loop (input -> server, prediction, render).
import { Net, api } from './net.js';
import { Renderer } from './render.js';
import { Input } from './input.js';
import { UI } from './ui.js';
import { D, loadCore, loadType } from './data.js';
import { charSprite, weaponSprite, SKIN, HAIR, OUTFIT, T } from './sprites.js';
import { WEAPON_TYPES, WEAPON_CATEGORIES, WT_BY_ID, STARTER_WEAPON_TYPES } from '/shared/data/weaponTypes.js';
import { STAT_NAMES } from '/shared/constants.js';
import { sfx, setVolume } from './sfx.js';

const $ = s => document.querySelector(s);
const net = new Net();
const state = { ents: new Map(), me: null, meEnt: null, self: null, zone: null, projs: [], areas: [], drops: [], lastSnap: 0, myId: null, input: {} };
window.__state = state;
let renderer, input, ui;
const BLOCK = new Set([T.VOID, T.WALL, T.WATER, T.TREE, T.HOUSE, T.PILLAR, T.ROOF]);
const settings = Object.assign({ sfx: 0.35, dmgNumbers: true, shake: true, lighting: true, touch: 'auto' }, (() => { try { return JSON.parse(localStorage.getItem('aef_settings') || '{}'); } catch { return {}; } })());
export function saveSettings() { try { localStorage.setItem('aef_settings', JSON.stringify(settings)); } catch {} applySettings(); }
function applySettings() { setVolume(settings.sfx); if (renderer) Object.assign(renderer.settings, { dmgNumbers: settings.dmgNumbers, shake: settings.shake, lighting: settings.lighting }); if (input) input.showTouch(settings.touch === 'on' || (settings.touch === 'auto' && input.isTouch)); }

function screen(html) { $('#screen').innerHTML = html; $('#screen').style.display = html ? 'flex' : 'none'; }
async function boot() {
  screen(`<div class="title"><h1>ABYSS<span>:</span> ETERNAL FRONTIER</h1><p class="sub">2D トップダウン オンライン探索アクションRPG</p><div class="loading">世界を構築中…</div></div>`);
  await loadCore();
  const tok = (() => { try { return localStorage.getItem('aef_token'); } catch { return null; } })();
  loginScreen(); if (tok) connect(tok);
}
function loginScreen(msg = '') {
  const c = D.index.counts;
  screen(`<div class="title"><h1>ABYSS<span>:</span> ETERNAL FRONTIER</h1><p class="sub">武器種 ${c.weaponTypes} ・ 武器 ${c.weapons.toLocaleString()} ・ スキル ${(c.weaponTypeSkills + c.uniqueSkills).toLocaleString()} ・ 職業 ${c.jobs} ・ ダンジョン ${c.dungeons}×100階</p>
    <form class="login card" id="lf"><input id="lu" placeholder="ユーザー名 (英数字)" autocomplete="username" maxlength="16"><input id="lp" type="password" placeholder="パスワード" autocomplete="current-password">
    <div class="row"><button type="submit" class="primary">ログイン</button><button type="button" id="reg">新規登録</button></div><div class="msg">${msg}</div></form></div>`);
  const go = async reg => { const r = await api(reg ? '/api/register' : '/api/login', { user: $('#lu').value, pass: $('#lp').value }); if (r.error) return loginScreen(r.error); try { localStorage.setItem('aef_token', r.token); } catch {} connect(r.token); };
  $('#lf').onsubmit = e => { e.preventDefault(); go(false); }; $('#reg').onclick = () => go(true);
}
function connect(token) { net.stop = false; net.connect(token); }
net.on('authfail', () => { net.stop = true; net.token = null; try { localStorage.removeItem('aef_token'); } catch {} loginScreen('セッションが切れました。再ログインしてください'); });
net.on('authok', () => net.send({ t: 'chars' }));
net.on('chars', m => charSelect(m.list));
net.on('err', m => ui ? ui.toast(m.v, 'err') : alert(m.v));

function charSelect(list) {
  screen(`<div class="title small"><h1>ABYSS<span>:</span> ETERNAL FRONTIER</h1><div class="card chars"><h2>キャラクター選択</h2>
    <div class="clist">${list.map(c => `<button class="cslot" data-id="${c.id}"><canvas width="32" height="48" data-look='${JSON.stringify(c.look)}'></canvas><b>${c.name}</b><span>Lv${c.level} ${D.jobMap.get(c.job)?.name || ''}</span></button>`).join('')}
    ${list.length < 4 ? '<button class="cslot new" id="newc">＋ 新規作成</button>' : ''}</div><button id="logout" class="ghost">ログアウト</button></div></div>`);
  for (const cv of document.querySelectorAll('.cslot canvas')) { const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; g.scale(2, 2); g.drawImage(charSprite(JSON.parse(cv.dataset.look)), 0, 0); }
  for (const b of document.querySelectorAll('.cslot[data-id]')) b.onclick = () => { net.send({ t: 'play', id: b.dataset.id }); screen(''); };
  if ($('#newc')) $('#newc').onclick = () => createScreen();
  $('#logout').onclick = () => { try { localStorage.removeItem('aef_token'); } catch {} net.stop = true; net.ws?.close(); loginScreen(); };
}
function createScreen() {
  const look = { body: 0, skin: 0, hair: 0, hairColor: 0, outfit: 0 }; let wt = 1, cat = 'sword';
  const opt = (k, n, label) => `<div class="opt"><label>${label}</label><button data-k="${k}" data-d="-1">◀</button><span id="v_${k}">1</span><button data-k="${k}" data-d="1">▶</button></div>`;
  screen(`<div class="create card"><h2>キャラクター作成</h2><div class="cgrid"><div class="cleft"><canvas id="prev" width="96" height="120"></canvas>
    ${opt('body', 3, '体型')}${opt('skin', 5, '肌')}${opt('hair', 6, '髪型')}${opt('hairColor', 10, '髪色')}${opt('outfit', 10, '衣装')}
    <input id="cname" maxlength="12" placeholder="名前 (2〜12文字)"><button id="cgo" class="primary">冒険を始める</button><button id="cback" class="ghost">戻る</button></div>
    <div class="cright"><div class="tabs" id="cats">${WEAPON_CATEGORIES.filter(c => c.id !== 'myth').map(c => `<button data-c="${c.id}">${c.name}</button>`).join('')}</div><div id="wlist" class="wlist"></div><div id="wdet" class="wdet"></div>
    <p class="hint">※ 神話・超常武器系（77〜86）は特別なコンテンツでのみ獲得できます。職業は武器種と独立しており、どの職業でも全武器を装備できます。</p></div></div></div>`);
  const max = { body: 3, skin: 5, hair: 6, hairColor: 10, outfit: 10 };
  const draw = () => { const cv = $('#prev'), g = cv.getContext('2d'); g.imageSmoothingEnabled = false; g.clearRect(0, 0, 96, 120); g.save(); g.scale(4, 4); g.drawImage(charSprite(look, 0, Math.floor(performance.now() / 200) % 4), 4, 4); g.translate(15, 18); g.rotate(0.6); g.drawImage(weaponSprite(WT_BY_ID[wt].vis), -2, -12); g.restore(); for (const k in look) $('#v_' + k).textContent = look[k] + 1; };
  const timer = setInterval(() => { if (!$('#prev')) return clearInterval(timer); draw(); }, 200);
  for (const b of document.querySelectorAll('.opt button')) b.onclick = () => { const k = b.dataset.k; look[k] = (look[k] + +b.dataset.d + max[k]) % max[k]; draw(); };
  const showList = () => { const c = WEAPON_CATEGORIES.find(x => x.id === cat); $('#wlist').innerHTML = WEAPON_TYPES.filter(w => w.id >= c.range[0] && w.id <= c.range[1]).map(w => `<button class="wbtn ${w.id === wt ? 'sel' : ''}" data-w="${w.id}">${w.id}. ${w.name}</button>`).join(''); for (const b of document.querySelectorAll('.wbtn')) b.onclick = () => { wt = +b.dataset.w; showList(); showDet(); draw(); }; for (const b of document.querySelectorAll('#cats button')) b.classList.toggle('sel', b.dataset.c === cat); };
  const showDet = () => { const w = WT_BY_ID[wt]; $('#wdet').innerHTML = `<h3>${w.name}</h3><p>◎ ${w.pros}</p><p>△ ${w.cons}</p><p>得意: ${w.good.map(s => STAT_NAMES[s]).join('・') || 'なし'} / 苦手: ${w.weak.map(s => STAT_NAMES[s]).join('・') || 'なし'}</p><p>コンボ ${(w.alt ? w.combo.length + '+' + w.alt.length : w.combo.length)}段 ・ 回避:${{ roll: 'ローリング', dash: 'ダッシュ', step: 'ステップ', blink: 'ブリンク', slide: 'スライド', hop: 'ホップ' }[w.dodge]} ・ 移動${Math.round(w.move * 100)}%</p>`; };
  for (const b of document.querySelectorAll('#cats button')) b.onclick = () => { cat = b.dataset.c; showList(); };
  showList(); showDet(); draw();
  $('#cgo').onclick = () => net.send({ t: 'create', name: $('#cname').value, wt, look });
  $('#cback').onclick = () => net.send({ t: 'chars' });
}

// ---------- game
net.on('zone', m => {
  const tiles = Uint8Array.from(atob(m.tiles), c => c.charCodeAt(0));
  state.zone = { ...m, tiles }; state.ents.clear(); state.me = null; state.meEnt = null;
  if (!renderer) startGame();
  renderer.setZone(state.zone); ui.onZone(state.zone); screen('');
});
net.on('self', m => { state.self = m; const w = m.ch.inventory.find(i => i.uid === m.ch.equip.weapon); const wts = new Set(m.ch.inventory.filter(i => i.kind === 'weapon').map(i => +i.ref.split('_')[0])); wts.add(m.d.wt); Promise.all([...wts].map(loadType)).then(() => ui.onSelf(m)); ui.onSelf(m); });
net.on('s', m => {
  state.lastSnap = performance.now(); state.myId = m.me.id;
  for (const f of m.full) { const e = state.ents.get(f.id); if (e) e.d = f; else state.ents.set(f.id, { d: f, x: 0, y: 0, tx: 0, ty: 0, seen: false, fresh: true }); }
  const seen = new Set();
  for (const r of m.ents) {
    const [id, x, y, fa, hp, flags, sts, act, ench] = r; let e = state.ents.get(id); if (!e) continue; seen.add(id);
    if (e.fresh || !e.seen) { e.x = x; e.y = y; e.fresh = false; }
    e.vx = x - e.tx; e.vy = y - e.ty; e.tx = x; e.ty = y; e.facing = fa; if (hp < (e.hp ?? 1000) && e.d.kind !== 'monster' && id === state.myId) sfx.hurt(); e.hp = hp; e.flags = flags; e.sts = sts; e.act = act; e.ench = ench; e.seen = true;
  }
  for (const e of state.ents.values()) if (!seen.has(e.d.id)) e.seen = false;
  state.projs = m.projs; state.areas = m.areas; state.drops = m.drops;
  const meE = state.ents.get(m.me.id); state.meEnt = meE; state.meServer = m.me;
  if (!state.me) state.me = { x: m.me.x, y: m.me.y };
  for (const f of m.fx) { renderer.addFx(f, state.ents, state.me); if (f.t === 'tiles') renderer.updateTile(f.x, f.y, f.v); playSfx(f, m.me.id); if (f.t === 'bossdown') ui.toast(`${f.n} を撃破した！ 階段が開いた`, 'big'); }
  ui.onSnap(m);
});
function playSfx(f, myId) { if (f.t === 'atk' && f.id === myId) (f.sh === 'proj' || f.sh === 'beam' ? sfx.shoot : f.sh === 'slam' ? sfx.heavy : sfx.swing)(); else if (f.t === 'dmg' && !f.a && !f.h && !f.dot) (f.c ? sfx.crit : sfx.hit)(); else if (f.t === 'boom') sfx.boom(); else if (f.t === 'skill' && f.id === myId) sfx.skill(); else if (f.t === 'parry' || f.t === 'counter') sfx.parry(); else if (f.t === 'dodge' && f.id === myId) sfx.dodge(); }
net.on('note', m => ui.note(m));
net.on('toast', m => ui.toast(m.v));
net.on('open', () => {});
net.on('closed', () => { if (ui) ui.toast('サーバーとの接続が切れました。再接続中…', 'err'); });

function startGame() {
  $('#game').style.display = 'block';
  renderer = new Renderer($('#game'), $('#overlay')); input = new Input($('#overlay')); renderer.dungeonNames = Object.fromEntries(Object.entries(D.dungeons).map(([k, v]) => [k, v.name])); window.__net = net; window.__input = input; window.__renderer = renderer;
  ui = new UI(net, state, { renderer, input, settings, saveSettings }); applySettings();
  let last = performance.now(), sendAcc = 0;
  const frame = t => {
    const dt = Math.min(50, t - last); last = t;
    if (state.zone && state.me) { tickInput(dt); sendAcc += dt; if (sendAcc >= 50) { sendAcc = 0; sendInput(); } predict(dt); }
    for (const e of state.ents.values()) { if (!e.seen) continue; if (e.d.id === state.myId && state.me) { e.x = state.me.x; e.y = state.me.y; continue; } e.x += (e.tx - e.x) * Math.min(1, dt / 70); e.y += (e.ty - e.y) * Math.min(1, dt / 70); }
    renderer.draw(state, dt); ui.frame(dt);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
function aimPoint() {
  if (input.mouse.in && !input.touch.active && !input.isTouch) return renderer.screenToWorld(input.mouse.x, input.mouse.y);
  // touch / no mouse: auto-aim nearest enemy
  let best = null, bd = 220; for (const e of state.ents.values()) { if (!e.seen || e.d.team !== 'enemy' || (e.flags & 1)) continue; const d = Math.hypot(e.x - state.me.x, e.y - state.me.y); if (d < bd) { bd = d; best = e; } }
  if (best) return { x: best.x, y: best.y };
  const f = state.meEnt?.facing ?? 0; return { x: state.me.x + Math.cos(f) * 60, y: state.me.y + Math.sin(f) * 60 };
}
function tickInput() {
  for (const k of input.take()) {
    if (ui.chatOpen) continue;
    if (k === ' ') { const mv = input.move(); net.send({ t: 'dodge', dx: mv.x, dy: mv.y }); }
    else if ('1234'.includes(k) && k.length === 1) { const a = aimPoint(); net.send({ t: 'skill', i: +k - 1, tx: a.x, ty: a.y }); ui.flashSlot(+k - 1); }
    else if (k === 'q') net.send({ t: 'potion', ref: 'hp' }); else if (k === 'e') net.send({ t: 'potion', ref: 'sp' });
    else if (k === 'f') net.send({ t: 'interact' });
    else ui.key(k);
  }
}
function sendInput() {
  const mv = input.move(); const a = aimPoint(); const blocked = ui.modalOpen || ui.chatOpen;
  state.input = { mx: blocked ? 0 : mv.x, my: blocked ? 0 : mv.y };
  net.send({ t: 'in', mx: state.input.mx, my: state.input.my, ax: Math.round(a.x), ay: Math.round(a.y), atk: !blocked && (input.mouse.l || input.touch.atk || input.keys.has('j') && false), spc: !blocked && (input.mouse.r || input.touch.spc || input.keys.has('shift')) });
}
function predict(dt) {
  const me = state.me, sv = state.meServer, z = state.zone; if (!sv || !state.self) return;
  const moving = Math.hypot(state.input.mx || 0, state.input.my || 0) > 0.05;
  const act = state.meEnt?.act; const flags = state.meEnt?.flags || 0;
  let mm = !act || act === 'skillAnim' ? 1 : act === 'attack' ? 0.3 : ['guard', 'charge', 'aim', 'iai', 'spin', 'drill', 'rev', 'barrage', 'breath', 'channel'].includes(act) ? 0.4 : 0;
  if (sv.dead || (flags & 8) || (flags & 16)) mm = 0;
  if (moving && mm > 0) {
    const l = Math.max(1, Math.hypot(state.input.mx, state.input.my)); const spd = 82 * (state.self.d.move || 1) * (1 + (sv.bm?.move || 0)) * mm;
    const dx = state.input.mx / l * spd * dt / 1000, dy = state.input.my / l * spd * dt / 1000; const r = 4.8;
    const blk = (x, y) => { const tx = Math.floor(x / 16), ty = Math.floor(y / 16); return tx < 0 || ty < 0 || tx >= z.w || ty >= z.h || BLOCK.has(z.tiles[ty * z.w + tx]); };
    const can = (x, y) => !blk(x - r, y - r) && !blk(x + r, y - r) && !blk(x - r, y + r) && !blk(x + r, y + r);
    if (can(me.x + dx, me.y)) me.x += dx; if (can(me.x, me.y + dy)) me.y += dy;
  }
  const ex = sv.x - me.x, ey = sv.y - me.y, err = Math.hypot(ex, ey);
  if (err > 48) { me.x = sv.x; me.y = sv.y; } else { const k = moving && mm > 0 ? 0.06 : 0.25; me.x += ex * k * dt / 16; me.y += ey * k * dt / 16; }
}
boot();
