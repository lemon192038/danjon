// In-game UI: HUD, skill bar, minimap, chat, notifications and all menu screens (data-driven from shared JSON).
import { D, loadType, wtOfWeapon } from './data.js';
import { WEAPON_TYPES, WEAPON_CATEGORIES, WT_BY_ID, categoryOf } from '/shared/data/weaponTypes.js';
import { STAT_NAMES, STATS, RARITIES, ELEMENT_NAMES, ELEMENT_COLORS, DIFFICULTIES, STATUS, MAX_MASTERY } from '/shared/constants.js';
import { describeSkill, modsText, SRC_NAMES, ACQ_NAMES, unlockText } from '/shared/skillText.js';
import { xpToNext, masteryXpToNext, jobXpToNext, enhanceCost, armorDef } from '/shared/formulas.js';
import { weaponSprite } from './sprites.js';
import { sfx } from './sfx.js';
import { Tutorial } from './tutorial.js';
import { installCity } from './uicity.js';
import { installSlum, installOrgs, installSlumEvents } from './uislum.js';
import { installEvents } from './uievents.js';
import { installItems, matName, artDesc } from './uiitems.js';
import { installDuels } from './uiduels.js';
import { installBig, xName } from './uibig.js';
import { installLib } from './uilib.js';
import { installCev } from './uicev.js';
import { CONTINENTS, REALMS, LEGACY_CITIES } from '/shared/data/world.js';
import { CITIES } from '/shared/data/cities.js';
import { LOOT, PROV } from '/shared/data/slum.js';
import { ITEMS } from '/shared/data/guilds.js';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rar = r => RARITIES[r] || RARITIES[1];
const pct = v => Math.round(v * 100) + '%';
const KIND_ICON = { strike: '⚔', heavy: '🔨', thrust: '➶', multi: '✦', spin: '◎', proj: '➹', beam: '═', dash: '»', leap: '⤒', counter: '↺', guard: '⛨', buff: '▲', zone: '◌', barrage: '☄', summon: '☥', passive: '◇', job: '★' };
const GAUGE_NAMES = { heat: '熱量', chi: '気', tempo: 'テンポ', soul: '魂', unlock: '解錠', pile: '装填', chain: '連鎖' };
const DODGE = { roll: 'ローリング', dash: 'ダッシュ', step: 'ステップ', blink: 'ブリンク', slide: 'スライド', hop: 'ホップ' };
const SPECIAL_NAMES = { guard: 'ガード/盾撃', charge: '溜め斬り', iai: '居合', frenzy: '乱舞', parry: 'パリィ', riposte: '受け流し', dashStrike: '突進斬り', execute: '処刑', throwSpin: '回転投擲', backstab: '背面取り', bloodPact: '血の契約', orbit: '周回刃', vault: '棒高跳び', guardCharge: '盾突進', hook: '鉤引き', sweepTrip: '足払い', tide: '激流', spinGuard: '回転防御', leap: '跳躍斬り', brace: '迎撃構え', reap: '刈り取り', rage: '激昂', whirl: '大旋回', spin: '遠心回転', volley: '一斉投擲', armorBreak: '鎧砕き', superArmor: '不動', blessStrike: '祝福打', spikeBurst: '棘爆', tauntRoar: '咆哮', roll: '鉄球転がし', pileLoad: '杭装填', chi: '気功解放', grab: '掴み投げ', pounce: '飛びかかり', tempo: 'テンポ解放', launch: '蹴り上げ', overclock: '過駆動', auraBurst: '闘気解放', aim: '引き絞り', boltSwap: '矢弾切替', barrage: '制圧射撃', manaArrow: '魔力矢', spirit: '精霊召喚', pinThrow: '縫い止め', ricochet: '跳弾', recallStrike: '呼び戻し', heatVent: '排熱爆破', channel: '詠唱', elemShift: '属性切替', quickcast: '高速詠唱', pageSummon: '頁召喚', spellChain: '連鎖詠唱', orbBarrier: '魔力障壁', ringSwap: '指輪切替', rune: 'ルーン刻印', library: '書架展開', modeToggle: '形態切替', transform: '変形', lash: '絡め取り', wireTrap: '鋼線罠', hammerThrow: '鉄球投擲', drill: '穿孔', rev: '回転鋸', umbrellaGuard: '傘防御・反射', rally: '軍旗', song: '旋律', puppet: '人形召喚', divineJudgment: '神の裁き', demonForm: '魔神化', dragonBreath: '竜の吐息', wings: '光翼', soulHarvest: '魂の解放', timeStop: '時間停止', gravityWell: '重力井戸', erase: '消去', meteor: '流星群', unlock: '解錠' };

export class UI {
  static install() { installCity(UI); installSlum(UI); installEvents(UI); installItems(UI); installOrgs(UI); installSlumEvents(UI); installDuels(UI); installBig(UI); installLib(UI); installCev(UI); }
  constructor(net, state, ctx) {
    this.net = net; this.state = state; this.ctx = ctx; this.modalOpen = false; this.chatOpen = false; this.panel = null; this.service = null; this.sel = {};
    const hud = document.getElementById('hud');
    hud.innerHTML = `<div id="pinfo"><div id="pname"></div><div class="bar hp"><i></i><span></span></div><div class="bar sp"><i></i><span></span></div><div class="bar xp"><i></i></div><div id="gauges"></div><div id="buffs"></div></div>
      <div id="zinfo"><div id="zname"></div><div id="clock"></div><canvas id="mini" width="140" height="110"></canvas><div id="curses"></div></div>
      <div id="bossbar"><div id="bossname"></div><div class="bar boss"><i></i></div></div>
      <div id="skillbar"></div><div id="notes"></div><div id="toasts"></div>
      <div id="menubtns">${[['u', '都市'], ['i', '所持品'], ['c', 'ステータス'], ['k', 'スキル'], ['j', '職業'], ['b', '図鑑'], ['l', 'クエスト'], ['h', '記録'], ['p', 'パーティー'], ['n', '冒険者'], ['m', 'マップ'], ['o', '設定']].map(([k, n]) => `<button data-key="${k}" title="${n} [${k.toUpperCase()}]">${n}</button>`).join('')}</div>
      <div id="chat"><div id="chatlog"></div><input id="chatin" maxlength="120" placeholder="Enterでチャット"></div>
      <div id="deadov"><h2>戦闘不能</h2><button id="respawn" class="primary">街へ帰還する</button></div><div id="interact"></div>`;
    this.$ = s => hud.querySelector(s);
    this.modal = document.getElementById('modal');
    this.modal.addEventListener('click', e => this.onClick(e)); this.modal.addEventListener('change', e => this.onChange(e)); this.modal.addEventListener('input', e => this.onInputEv(e));
    hud.querySelector('#menubtns').addEventListener('click', e => { const k = e.target.dataset.key; if (k) this.key(k); });
    this.$('#respawn').onclick = () => net.send({ t: 'respawn' });
    const ci = this.$('#chatin'); ci.addEventListener('keydown', e => { if (e.key === 'Enter') { if (ci.value.trim()) net.send({ t: 'chat', v: ci.value }); ci.value = ''; ci.blur(); } if (e.key === 'Escape') ci.blur(); e.stopPropagation(); });
    ci.addEventListener('focus', () => this.chatOpen = true); ci.addEventListener('blur', () => this.chatOpen = false);
    net.on('chat', m => this.chat(m.from, m.v)); net.on('cityInfo', m => { this.cityInfo = m; if (this.panel === 'city') this.render(); }); net.on('casinoResult', m => { this.casinoRes = m; if (this.panel === 'casino') this.render(); }); net.on('open', m => m.service && this.openService(m.service, m.data)); net.on('party', m => { if (this.state.self) this.state.self.party = m.v; if (this.panel === 'party') this.render(); });
    net.on('invite', m => { if (confirm(`${m.from} からパーティーに招待されました。参加しますか？`)) net.menu('accept', { pid: m.pid }); });
    net.on('npcList', m => { this.npcList = m.list; if (this.panel === 'party' || this.panel === 'npcs') this.render(); });
    net.on('players', m => { this.players = m.list; if (this.panel === 'party') this.render(); });
    net.on('evoInfo', m => { (this.evo ||= {})[m.key] = m; if (this._evoReq) delete this._evoReq[m.key]; if (this.panel === 'inventory' || this.panel === 'smith') this.render(); });
    net.on('skillfail', m => { const r = { cd: 'クールダウン中', sp: 'SPが足りない', busy: '行動中', ng: '使用できない' }[m.r]; if (r) this.toast(r, 'err', 900); });
    this.slotSel = null; this.skillTab = 'wtype'; this.codexType = 1; this.codexTab = 'profile';
    this.tut = new Tutorial(net, () => !!ctx.input.touchOn); this.initSlum(); this.initItems(); this.initLib();
  }
  // ---------- events from net
  onZone(z) { this.tut.event('zone:' + z.kind); this.onEnv(this.state.env || { h: 12, m: 0, wx: z.wx }); this.closeModal(); this.$('#zname').textContent = z.name; this.$('#curses').innerHTML = (z.curses || []).map(c => `<span>${esc(c)}</span>`).join(''); this.drawMini(); this.toast(z.name, 'zone', 2200); }
  onSelf(m) { this.self = m; this.renderSkillbar(); this.tut.sync(m.ch); this.$('#pname').innerHTML = `<b>${esc(m.ch.name)}</b> Lv${m.ch.level} <small>${esc(D.jobMap.get(m.ch.job)?.name || '')} / ${esc(WT_BY_ID[m.d.wt].name)}</small>${m.ch.statPoints ? ` <em class="pts">+${m.ch.statPoints}</em>` : ''} <span class="gold">${m.ch.gold.toLocaleString()}G</span>`; if (this.modalOpen) this.render(); }
  onSnap(m) {
    const me = m.me; this.me = me;
    this.bar('.hp', me.hp / me.mhp, `${me.hp}/${me.mhp}${me.sh ? ` (+${me.sh})` : ''}`); this.bar('.sp', me.sp / me.msp, `${me.sp}/${me.msp}`);
    if (this.self) { const ch = this.self.ch; this.$('.bar.xp i').style.width = Math.min(100, ch.xp / xpToNext(ch.level) * 100) + '%'; }
    const g = me.g ? Object.entries(me.g).filter(([k, v]) => v > 0) : []; this.$('#gauges').innerHTML = g.map(([k, v]) => `<span class="gauge">${GAUGE_NAMES[k] || k} ${Math.floor(v * 10) / 10}</span>`).join('') + (me.alt ? '<span class="gauge">第二形態</span>' : '');
    this.$('#buffs').innerHTML = me.bm ? `<span class="buff">${esc(modsText(me.bm)).slice(0, 80)}</span>` : '';
    for (let i = 0; i < 4; i++) { const id = this.self?.ch.skills.slots[i]; const el = this.$(`#sk${i} .cd`); if (!el) continue; const cd = id && me.cds[id]; const sk = D.skills.get(id); el.style.height = cd && sk ? Math.min(100, cd / sk.cd * 100) + '%' : '0'; this.$(`#sk${i} .cdt`).textContent = cd ? (cd / 1000).toFixed(1) : ''; }
    if (this.self) { const ch = this.self.ch; this.ctx.input.setTouchInfo({ cds: ch.skills.slots.map(id => { const sk = D.skills.get(id); return id && me.cds[id] && sk ? Math.min(1, me.cds[id] / sk.cd) : 0; }), pot: (() => { const r = (ch.potSlots || ['hp', 'sp'])[0]; return `${(ITEMS[r]?.name || r).slice(0, 4)} ${ch.inventory.filter(i => i.ref === r).reduce((t, i) => t + i.n, 0)}`; })(), spc: SPECIAL_NAMES[WT_BY_ID[this.self.d.wt].special.type] }); }
    this.$('#deadov').style.display = me.dead ? 'flex' : 'none';
    let boss = null; for (const e of this.state.ents.values()) if (e.seen && e.d.boss && !(e.flags & 1)) boss = e;
    this.$('#bossbar').style.display = boss ? 'block' : 'none'; if (boss) { this.$('#bossname').textContent = boss.d.name; this.$('.bar.boss i').style.width = boss.hp / 10 + '%'; }
    // interaction hint
    const z = this.state.zone; let hint = '';
    if (z && this.state.me) { const p = this.state.me; for (const n of z.npcs) if (Math.hypot(n.x * 16 + 8 - p.x, n.y * 16 + 8 - p.y) < 30) hint = `[F] ${n.name}`; for (const gt of z.gates) if (Math.hypot(gt.x * 16 + 8 - p.x, gt.y * 16 + 8 - p.y) < 30) hint = `[F] ${D.dungeons[gt.dungeon]?.name}へ`; for (const e of this.state.ents.values()) if (e.seen && e.d.kind === 'npc' && Math.hypot(e.x - p.x, e.y - p.y) < 30) hint = `[F] ${e.d.name}と話す`; for (const d of this.state.drops) if (d[3] === 'chest' && Math.hypot(d[1] - p.x, d[2] - p.y) < 26) hint = '[F] 宝箱を開ける'; if (z.exit && Math.hypot(z.exit[0] * 16 + 8 - p.x, z.exit[1] * 16 + 8 - p.y) < 30) hint = '[F] 出口：街へ帰還'; hint = this.cityHint(z, p) || hint; }
    const ih = this.$('#interact'); ih.textContent = hint; ih.style.display = hint ? 'block' : 'none';
  }
  bar(sel, f, txt) { const b = this.$('.bar' + sel); b.querySelector('i').style.width = Math.max(0, Math.min(100, f * 100)) + '%'; const s = b.querySelector('span'); if (s) s.textContent = txt; }
  frame() { if ((this.miniT = (this.miniT || 0) + 1) % 6 === 0) this.drawMini(); }
  drawMini() {
    const cv = this.$('#mini'), r = this.ctx.renderer; if (!r.mini || !this.state.me) return; const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; g.fillStyle = '#000'; g.fillRect(0, 0, 140, 110);
    const z = this.state.zone, s = Math.min(140 / z.w, 110 / z.h) * 1.6; const mx = this.state.me.x / 16, my = this.state.me.y / 16;
    g.save(); g.translate(70 - mx * s, 55 - my * s); g.drawImage(r.mini, 0, 0, z.w * s, z.h * s);
    for (const e of this.state.ents.values()) { if (!e.seen || (e.flags & 1)) continue; g.fillStyle = e.d.team === 'enemy' ? (e.d.boss ? '#ff00ff' : '#ff4040') : e.d.kind === 'npc' ? '#60d0ff' : '#60ff80'; g.fillRect(e.x / 16 * s - 1, e.y / 16 * s - 1, e.d.boss ? 4 : 2, e.d.boss ? 4 : 2); }
    g.restore(); g.fillStyle = '#fff'; g.fillRect(69, 54, 3, 3);
  }
  renderSkillbar() {
    const ch = this.self.ch;
    this.$('#skillbar').innerHTML = `<div class="sk basic" title="通常攻撃 (左クリック)"><b>攻</b><small>LMB</small></div><div class="sk basic" title="${esc(SPECIAL_NAMES[WT_BY_ID[this.self.d.wt].special.type])} (右クリック/Shift)"><b>特</b><small>RMB</small></div>` +
      (this.touchSync(), ch.skills.slots).map((id, i) => { const s = D.skills.get(id); return `<div class="sk" id="sk${i}" title="${esc(s ? s.name + '\n' + describeSkill(s) : '空きスロット')}"><b style="color:${s?.el ? ELEMENT_COLORS[s.el] : '#fff'}">${s ? (KIND_ICON[s.kind] || '✧') : '·'}</b><span>${esc(s?.name?.slice(0, 6) || '')}</span><div class="cd"></div><div class="cdt"></div><small>${i + 1}</small></div>`; }).join('') +
      `<div class="sk basic" title="回避 (Space)"><b>避</b><small>SPC</small></div>${(ch.potSlots || ['hp', 'sp']).map((r, i) => `<div class="sk basic pot" title="${esc(ITEMS[r]?.name || r)} (${'QE'[i]})"><b>${esc((ITEMS[r]?.name || r).slice(0, 2))}</b><small>${'QE'[i]} ${ch.inventory.filter(x => x.ref === r).reduce((t, x) => t + x.n, 0)}</small></div>`).join('')}`;
  }
  touchSync() { const ch = this.self?.ch; if (!ch) return; this.ctx.input.setTouchSkills(ch.skills.slots.map(id => { const s = D.skills.get(id); return s ? { name: s.name, color: s.el ? ELEMENT_COLORS[s.el] : '' } : null; })); }
  flashSlot(i) { const e = this.$(`#sk${i}`); if (e) { e.classList.remove('fl'); void e.offsetWidth; e.classList.add('fl'); } }
  chat(from, v) { const l = this.$('#chatlog'); const d = document.createElement('div'); d.innerHTML = `<b>${esc(from)}</b>: ${esc(v)}`; l.appendChild(d); while (l.children.length > 40) l.firstChild.remove(); l.scrollTop = 1e9; }
  toast(v, cls = '', ms = 2600) { const t = document.createElement('div'); t.className = 'toast ' + cls; t.textContent = v; this.$('#toasts').appendChild(t); setTimeout(() => t.remove(), ms); }
  note(n) {
    const add = (txt, cls = '') => { const d = document.createElement('div'); d.className = 'note ' + cls; d.innerHTML = txt; this.$('#notes').prepend(d); setTimeout(() => d.remove(), 6000); while (this.$('#notes').children.length > 7) this.$('#notes').lastChild.remove(); };
    switch (n.k) {
      case 'levelup': add(`★ レベル ${n.lv} に上昇！ ステータスポイント+3`, 'gold'); sfx.level(); this.toast(`LEVEL UP! Lv${n.lv}`, 'big'); break;
      case 'learn': add(`新スキル習得: ${esc(n.n)}`, 'blue'); break;
      case 'mastery': add(`${esc(WT_BY_ID[n.wt].name)}熟練度 ${n.lv}${n.n ? ` ― 「${esc(n.n)}」習得` : ''}`, 'blue'); break;
      case 'jobrank': add(`${esc(D.jobMap.get(n.job)?.name)} 熟練度ランク${n.rank}`, 'blue'); break;
      case 'jobunlock': add(`新職業解放: 【${esc(n.tier)}】${esc(n.n)}`, 'gold'); this.toast(`職業解放: ${n.n}`, 'big'); break;
      case 'skilllv': add(`${esc(n.n)} がスキルLv${n.lv}に成長`, 'blue'); break;
      case 'loot': { const it = n.it; let name = it.kind === 'weapon' ? D.weapons.get(it.ref)?.name : it.kind === 'armor' ? armorDef(it.slot, it.tier).name : { hp: '回復薬', sp: '魔力薬', ore: '強化鉱石', abyssShard: '深淵の欠片' }[it.ref]; const r = it.kind === 'weapon' ? D.weapons.get(it.ref)?.rar : 1; add(`入手: <span style="color:${rar(r).color}">${esc(name)}</span>${it.n > 1 ? ' ×' + it.n : ''}`, it.myth ? 'gold' : ''); sfx.loot(); if (r >= 4) this.toast(`${rar(r).key} ${name} を入手！`, 'big'); break; }
      case 'title': add(`称号獲得: 「${esc(n.v)}」`, 'gold'); break;
      case 'quest': add(esc(n.v), 'gold'); break;
      case 'dead': sfx.die(); break;
      case 'msg': add(esc(n.v)); break;
    }
  }
  // ---------- keys & modal
  key(k) {
    const map = { u: 'city', i: 'inventory', tab: 'inventory', c: 'status', k: 'skills', j: 'jobs', b: 'codex', l: 'quests', h: 'journal', p: 'party', n: 'npcs', m: 'map', o: 'settings' };
    if (k === 'escape') { if (this.modalOpen) this.closeModal(); else this.open('settings'); return; }
    if (k === 'enter') { this.$('#chatin').focus(); return; }
    if (map[k]) { if (this.panel === map[k] && this.modalOpen) this.closeModal(); else this.open(map[k]); }
  }
  open(p, service = null) { if (p === 'skills') this.tut.event('menu'); if (p === 'city') this.cityInfo = null; if (p === 'journal') { this.journal = null; } this.panel = p; this.service = service; this.modalOpen = true; this.modal.style.display = 'flex'; sfx.ui(); if (p === 'party' || p === 'npcs') { this.net.menu('npcList'); this.net.menu('players'); } this.render(); }
  closeModal() { this.modalOpen = false; this.modal.style.display = 'none'; this.panel = null; this.service = null; }
  openService(s, data) {
    if (this.cityPanel(s, data)) return;
    this.svc = data;
    if (s === 'inn') { this.toast('宿屋で休息し、HPとSPが全回復した'); return; }
    if (s === 'exit') { this.open('exitConfirm'); return; }
    const p = { weapon: 'shopW', armor: 'shopA', item: 'shopI', smith: 'smith', guild: 'jobs', quest: 'quests', gate: 'dungeon', npc: 'npc' }[s];
    if (s === 'weapon') { const wts = [...new Set(data.stock.map(wtOfWeapon))]; this.shopWt = wts.includes(this.self.d.wt) ? this.self.d.wt : wts[0]; loadType(this.shopWt).then(() => this.render()); }
    this.open(p, s);
  }
  wrap(title, body, tabs = '') { return `<div class="panel"><div class="ph"><h2>${title}</h2>${tabs}<button data-act="close" class="x">✕</button></div><div class="pb">${body}</div></div>`; }
  render() { if (!this.modalOpen || !this.self) return; const fn = this['p_' + this.panel]; this.modal.innerHTML = fn ? fn.call(this) : ''; }
  onChange(e) { const t = e.target; if (t.dataset.shopwt) { this.shopWt = +t.value; loadType(this.shopWt).then(() => this.render()); return; } if (t.dataset.set) { this.sel[t.dataset.set] = t.value; this.render(); } if (t.dataset.setting) { const s = this.ctx.settings; s[t.dataset.setting] = t.type === 'checkbox' ? t.checked : t.type === 'range' ? +t.value : t.value; this.ctx.saveSettings(); } }
  onInputEv(e) { const t = e.target; if (t.dataset.search) { this.sel.search = t.value; clearTimeout(this._st); this._st = setTimeout(() => { this.render(); const n = this.modal.querySelector('[data-search]'); if (n) { n.focus(); n.selectionStart = n.value.length; } }, 250); } }
  onClick(e) {
    const t = e.target.closest('[data-act]'); if (!t) { if (e.target === this.modal) this.closeModal(); return; }
    const a = t.dataset.act, v = t.dataset.v, m = this.net.menu.bind(this.net); sfx.ui(); if (this.cityAct(a, t)) return;
    if (a === 'potSlot') { m('potSlot', { i: +t.dataset.i, ref: v }); return; }
    switch (a) {
      case 'close': return this.closeModal();
      case 'tab': this.sel[t.dataset.k] = v; return this.render();
      case 'equip': return m('equip', { uid: v }); case 'sell': if (confirm('売却しますか？')) m('sell', { uid: v }); return; case 'enhance': if (this.evo) delete this.evo[v]; return m('enhance', { uid: v }); case 'evolve': if (!confirm('進化させますか？（強化値は半分になります。来歴は引き継がれます）')) return; if (this.evo) delete this.evo[v]; return m('evolve', { uid: v });
      case 'alloc': return m('alloc', { stat: v, n: +t.dataset.n || 1 }); case 'resetStats': if (confirm('ゴールドを支払いステータスを再分配しますか？')) m('resetStats'); return;
      case 'pickSkill': this.slotSel = v; return this.render(); case 'slot': if (this.slotSel !== null) m('slot', { i: +v, id: this.slotSel === '' ? null : this.slotSel }); this.slotSel = null; return;
      case 'skillTab': this.skillTab = v; return this.render();
      case 'job': this.sel.job = v; return this.render(); case 'changeJob': return m('job', { id: v });
      case 'codexType': this.codexType = +v; loadType(+v).then(() => this.render()); return this.render(); case 'codexTab': this.codexTab = v; loadType(this.codexType).then(() => this.render()); return this.render();
      case 'item': this.sel.item = v; if (this.evo) delete this.evo[v]; return this.render();
      case 'buyW': return m('buy', { kind: 'weapon', ref: v }); case 'buyA': return m('buy', { kind: 'armor', tier: +v, slot: t.dataset.slot }); case 'buyI': return m('buy', { kind: 'item', ref: v, n: +(t.dataset.n || 1) });
      case 'shopWt': this.shopWt = +v; loadType(+v).then(() => this.render()); return;
      case 'qAccept': return m('quest', { act: 'accept', id: v }); case 'qTurn': return m('quest', { act: 'turnin', id: v }); case 'qAbandon': return m('quest', { act: 'abandon', id: v });
      case 'dsel': this.sel.dun = v; return this.render(); case 'diff': this.sel.diff = v; return this.render();
      case 'enter': this.closeModal(); return m('dungeon', { id: this.sel.dun, diff: this.sel.diff || 'NORMAL', floor: +v });
      case 'leave': this.closeModal(); return m('leave');
      case 'invite': { const n = this.modal.querySelector('#invname')?.value; if (n) m('invite', { name: n }); return; }
      case 'leaveParty': return m('leaveParty'); case 'kick': return m('kick', { id: v });
      case 'npcInfo': return m('npcInfo', { id: v }); case 'npcInvite': m('npcInvite', { id: v }); return this.closeModal();
      case 'logout': try { localStorage.removeItem('aef_token'); } catch {} location.reload(); return;
      case 'page': this.sel.page = +v; return this.render();
      case 'tutReset': this.closeModal(); return this.tut.restart();
    }
  }
  // ---------- panels
  p_inventory() {
    const ch = this.self.ch; const eq = new Set(Object.values(ch.equip)); const inTown = this.state.zone.kind === 'town' || this.state.zone.kind === 'interior';
    const q = (this.sel.search || '').trim(), kf = this.sel.ikind || 'all', srt = this.sel.isort || 'kind';
    const nmOf = it => it.kind === 'amat' ? matName(it) : it.kind === 'artifact' ? it.name : it.kind === 'weapon' ? D.weapons.get(it.ref)?.name || '' : it.kind === 'armor' ? armorDef(it.slot, it.tier).name : it.kind === 'loot' ? LOOT[it.ref]?.name || '' : xName(it) || ITEMS[it.ref]?.name || it.ref;
    const wOf = it => it.kind === 'weapon' ? D.weapons.get(it.ref) : null;
    const items = ch.inventory.filter(it => (kf === 'all' || (kf === 'mat' ? !['weapon', 'armor', 'loot', 'artifact', 'amat'].includes(it.kind) : it.kind === kf)) && (!q || nmOf(it).includes(q) || (wOf(it) && WT_BY_ID[wOf(it).wt].name.includes(q))))
      .sort((a, b) => (eq.has(b.uid) - eq.has(a.uid)) || (srt === 'rar' ? (wOf(b)?.rar || 0) - (wOf(a)?.rar || 0) : srt === 'lvl' ? (wOf(b)?.lvl || 0) - (wOf(a)?.lvl || 0) : srt === 'name' ? nmOf(a).localeCompare(nmOf(b), 'ja') : (a.kind > b.kind ? 1 : -1)));
    const ibar = `<div class="jbar"><input data-search placeholder="名前・武器種で検索" value="${esc(q)}"><select data-set="ikind">${[['all', 'すべて'], ['weapon', '武器'], ['armor', '防具'], ['artifact', 'アーティファクト'], ['amat', 'アーティファクト素材'], ['loot', '戦利品'], ['mat', '消耗品・素材']].map(([k, n]) => `<option value="${k}" ${kf === k ? 'selected' : ''}>${n}</option>`).join('')}</select><select data-set="isort">${[['kind', '種類順'], ['rar', 'レア度順'], ['lvl', 'Lv順'], ['name', '名前順']].map(([k, n]) => `<option value="${k}" ${srt === k ? 'selected' : ''}>${n}</option>`).join('')}</select></div>`;
    const name = it => it.kind === 'weapon' ? D.weapons.get(it.ref)?.name : it.kind === 'armor' ? armorDef(it.slot, it.tier).name : it.kind === 'loot' ? `${LOOT[it.ref]?.name}${it.prov === 'laundered' ? '' : '〔' + PROV[it.prov] + '〕'}` : it.kind === 'amat' ? matName(it) : it.kind === 'artifact' ? it.name : xName(it) || ITEMS[it.ref]?.name || it.ref;
    const list = items.map(it => { const w = it.kind === 'weapon' ? D.weapons.get(it.ref) : null; const col = w ? rar(w.rar).color : it.kind === 'armor' ? '#a0c0ff' : '#ccc'; return `<div class="irow ${this.sel.item === it.uid ? 'sel' : ''}" data-act="item" data-v="${it.uid}"><span style="color:${col}">${eq.has(it.uid) ? '[E] ' : ''}${it.fav ? '★' : ''}${esc(name(it))}${it.plus ? ' +' + it.plus : ''}${it.n ? ' ×' + it.n : ''}</span><small>${w ? `${rar(w.rar).key} ${WT_BY_ID[w.wt].name} Lv${w.lvl}` : it.kind === 'armor' ? (it.slot === 'armor' ? '鎧' : '装飾') : it.kind === 'artifact' ? 'アーティファクト' : it.kind === 'amat' ? 'アーティファクト素材' : '消耗/素材'}</small></div>`; }).join('');
    const it = ch.inventory.find(i => i.uid === this.sel.item); let det = '<p class="dim">アイテムを選択してください</p>';
    if (it) {
      if (it.kind === 'weapon') det = this.weaponDetail(D.weapons.get(it.ref), it) + `<p><button data-act="fav" data-v="${it.uid}">${it.fav ? '★ お気に入り解除' : '☆ お気に入り登録'}</button></p>` + this.weaponExtra(it, inTown);
      else if (it.kind === 'artifact') { const slot = ['art1', 'art2'].find(k => ch.equip[k] === it.uid); det = `<h3>${esc(it.name)}</h3><p>${esc(artDesc(it))}</p><p class="dim"><small>素材：${it.from.map(esc).join(' ／ ')}</small></p><p>${slot ? `装備中（枠${slot === 'art1' ? 1 : 2}） <button data-act="artUnequip" data-v="${it.uid}">外す</button>` : `<button class="primary" data-act="artEquip" data-v="${it.uid}" data-slot="art1">枠1に装備</button> <button data-act="artEquip" data-v="${it.uid}" data-slot="art2">枠2に装備</button>`}</p><p><button data-act="fav" data-v="${it.uid}">${it.fav ? '★ お気に入り解除' : '☆ お気に入り登録'}</button></p>`; }
      else if (it.kind === 'amat') det = `<h3>${esc(matName(it))}</h3><p>${esc(it.floor)}F ${esc(it.diff)} のボスから入手 ・ 強さ ${it.pow}</p><p class="dim">鍛冶屋でもう一方の核と組み合わせてアーティファクトを作る</p>`;
      else if (it.kind === 'armor') { const a = armorDef(it.slot, it.tier); det = `<h3>${a.name}${it.plus ? ' +' + it.plus : ''}</h3><p>防御 ${a.def} / HP+${a.hp}${a.sp ? ` / SP+${a.sp}` : ''}${a.crit ? ` / 会心+${pct(a.crit)}` : ''} ・ 必要Lv${Math.max(1, a.lvl - 10)}</p>`; }
      else if (it.kind === 'loot') { const L = LOOT[it.ref]; det = `<h3>${esc(name(it))} ×${it.n}</h3><p>${['', '一般', '良品', '希少', '貴重', '伝説'][L.r]}・${L.w}kg・基準価値${L.v}G・品質${it.q}</p><p>出所：${PROV[it.prov]}（${it.prov === 'legal' || it.prov === 'laundered' ? '正規店で売却可' : '闇市・故買屋・鑑定屋で扱える'}）</p>`; }
      else det = `<h3>${esc(name(it))} ×${it.n}</h3><p>${esc(ITEMS[it.ref]?.desc || '')}${(ch.potSlots || ['hp', 'sp']).map((r, i) => r === it.ref ? ` [${'QE'[i]}]` : '').join('')}</p>${ITEMS[it.ref]?.use ? `<button class="primary" data-act="useItem" data-v="${it.ref}">使う</button>` : ''}${it.kind === 'potion' || ITEMS[it.ref]?.use ? ` <button data-act="potSlot" data-i="0" data-v="${it.ref}">Q枠に設定</button> <button data-act="potSlot" data-i="1" data-v="${it.ref}">E枠に設定</button>` : ''}`;
      det += `<div class="btns">${(it.kind === 'weapon' || it.kind === 'armor') && !eq.has(it.uid) ? `<button class="primary" data-act="equip" data-v="${it.uid}">装備</button>` : ''}${inTown && (it.kind === 'weapon' || it.kind === 'armor') ? `<button data-act="enhance" data-v="${it.uid}">強化 (${(() => { const c = enhanceCost(it.kind === 'weapon' ? D.weapons.get(it.ref) : { lvl: it.tier * 15 + 1 }, it.plus || 0); return `${c.gold}G 鉱石${c.ore} 成功率${pct(c.rate)}`; })()})</button>` : ''}${inTown && !eq.has(it.uid) ? `<button data-act="sell" data-v="${it.uid}">売却</button>` : ''}</div>`;
    }
    const cargo = Object.entries(ch.cargo || {}).filter(([, n]) => n > 0).map(([g, n]) => `${({ wheat: '小麦', fish: '干物', spice: '香辛料', silk: '絹織物', ore: '星鉄鉱石', steel: '鋼材', crystal: '魔晶石', book: '魔導写本', wine: '葡萄酒' })[g]}×${n}`).join('、');
    return this.wrap(`所持品・装備 <small>${ch.inventory.length}/200 ・ ${ch.gold.toLocaleString()}G${ch.bank?.bal ? ` ・ 預金${ch.bank.bal.toLocaleString()}G` : ''}</small>`, `${cargo ? `<p class="dim">積荷：${cargo}</p>` : ''}${ibar}${inTown ? this.bulkBar() : ''}<div class="split"><div class="list">${list || '<p class="dim">該当なし</p>'}</div><div class="det">${det}</div></div>`);
  }
  // weapon history (来歴・二つ名), evolution path (強化先) with materials, mastery milestones — data from the server
  weaponExtra(it, inTown) {
    const k = it.uid; const info = this.evo?.[k]; if (!info) { if (!this._evoReq?.[k]) { (this._evoReq ||= {})[k] = 1; this.net.menu('evoInfo', { uid: k }); } return '<p class="dim">来歴を読み込み中…</p>'; }
    const r = info.recipe, h = info.hist; const ch = this.self.ch; const have = ref => ch.inventory.find(i => i.ref === ref && i.kind !== 'loot')?.n || 0;
    const m = ch.mastery[D.weapons.get(it.ref)?.wt]?.lv || 1;
    return `<h4>来歴</h4>${h ? `<p>撃破 ${h.k} ・ ボス ${h.b} ・ 使用開始 ${new Date(h.since).toLocaleDateString()}${h.top.length ? `<br><small class="dim">よく倒した相手：${h.top.map(([n, c]) => `${esc(n)}×${c}`).join('、')}</small>` : ''}</p>` : '<p class="dim">まだ戦いの記録がない（装備して戦うと刻まれていく）</p>'}
      ${info.epi ? `<p>二つ名：<b class="good">「${esc(info.epi.name)}」</b> <small>${esc(modsText(info.epi.mods))}</small></p>` : '<p class="dim">二つ名：撃破300で刻まれる</p>'}
      <h4>強化先（進化）</h4>${r ? `<p>→ <b style="color:${rar(r.toRar).color}">${esc(r.toName)}</b>（${rar(r.toRar).key}・Lv${r.toLvl}）</p><p><small>条件：+${r.plus}以上 ・ ${r.gold.toLocaleString()}G ・ ${Object.entries(r.mats).map(([x, n]) => `<span class="${have(x) >= n ? '' : 'warn'}">${esc(ITEMS[x]?.name || x)}×${n}（所持${have(x)}）</span>`).join('、')}</small></p>${inTown ? `<button data-act="evolve" data-v="${it.uid}">進化させる</button>` : '<p class="dim">街の鍛冶屋で進化できる</p>'}` : '<p class="dim">この武器は最終段階</p>'}
      <h4>武器種の熟練度 ${m}/100</h4><p><small>${info.mastery.map(x => `<span class="${m >= x.lv ? 'good' : 'dim'}">Lv${x.lv} ${esc(x.name || x.msg)}</span>`).join(' ／ ')}</small></p>
      <p class="dim"><small>強攻撃：[R]キー／⚡ボタン（最終段の溜め版。SP6）</small></p>`;
  }
  weaponDetail(w, it) {
    if (!w || w.stub) { loadType(w?.wt || 1).then(() => this.render()); return '<p>読み込み中…</p>'; }
    const wt = WT_BY_ID[w.wt]; const r = rar(w.rar); const owned = this.self.ch.progress.codex.includes(w.id);
    return `<div class="wdh"><canvas class="wicon" data-w="${w.wt}"></canvas><div><h3 style="color:${r.color}">${esc(w.name)}${it?.plus ? ' +' + it.plus : ''}</h3><p>${r.key}（${r.name}）・ ${esc(wt.name)} ・ Lv${w.lvl}${owned ? '' : ' ・ <span class="dim">未入手</span>'}</p></div></div>
      <p>攻撃力 <b>${w.atk}</b> ・ 会心 ${pct(w.crit)} ・ 攻速 ${pct(w.spd)}${w.el ? ` ・ <span style="color:${ELEMENT_COLORS[w.el]}">${ELEMENT_NAMES[w.el]}属性</span>` : ''}</p>
      <p>能力補正: ${Object.entries(w.stats).map(([k, v]) => `${STAT_NAMES[k]}+${v}`).join(' ')}</p>
      <h4>武器特性${it?.traits ? ' <small class="good">（祭壇で変更済み）</small>' : ''}</h4>${(it?.traits || w.traits).map(t => `<p>◆ ${esc(t.name)}: ${esc(modsText(t.mods))}</p>`).join('') || '<p class="dim">なし</p>'}
      <h4>固有スキル「${esc(w.skill.name)}」</h4><p>${esc(describeSkill(w.skill))}</p><p class="dim">SP${w.skill.cost} ・ CD${w.skill.cd / 1000}秒${w.skill.cast ? ` ・ 詠唱${w.skill.cast}ms` : ''}</p>
      <h4>入手方法</h4><p>${ACQ_NAMES[w.acq.src] || w.acq.src}（${w.acq.diff}以上・${w.acq.minFloor}階〜） ・ 売値目安 ${Math.round(w.price * 0.3).toLocaleString()}G</p>`;
  }
  p_status() {
    const ch = this.self.ch, d = this.self.d; const sp = ch.statPoints;
    const rows = STATS.map(s => `<tr><th>${STAT_NAMES[s]}</th><td>${d.st[s]}</td><td class="dim">(振分${ch.stats[s]})</td><td>${sp ? `<button data-act="alloc" data-v="${s}">+1</button><button data-act="alloc" data-v="${s}" data-n="5">+5</button>` : ''}</td></tr>`).join('');
    const wt = WT_BY_ID[d.wt]; const mast = Object.entries(ch.mastery).sort((a, b) => b[1].lv - a[1].lv).slice(0, 12).map(([k, v]) => `<li>${esc(WT_BY_ID[k].name)} <b>${v.lv}</b>/${MAX_MASTERY} <small class="dim">(${v.xp}/${masteryXpToNext(v.lv)})</small></li>`).join('');
    const clears = Object.entries(ch.progress.clears).map(([k, v]) => `<li>${esc(D.dungeons[k]?.name)}: ${DIFFICULTIES.filter(x => v[x.id]).map(x => `${x.id} ${v[x.id]}F`).join(' / ')}</li>`).join('') || '<li class="dim">なし</li>';
    return this.wrap('ステータス', `<div class="split"><div><h3>${esc(ch.name)} Lv${ch.level} <small>EXP ${ch.xp}/${xpToNext(ch.level)}</small></h3><p>職業: ${esc(D.jobMap.get(ch.job)?.name)} ・ 武器種: ${esc(wt.name)}${d.affinity ? ` <span class="good">（職業相性 +${pct(d.affinity)}）</span>` : ''}</p>
      <p>ステータスポイント: <b>${sp}</b> ${this.state.zone.kind === 'town' ? `<button data-act="resetStats">再分配(${ch.level * 100}G)</button>` : ''}</p><table class="stats">${rows}</table>
      <p class="dim">${esc(wt.name)}の得意: ${wt.good.map(s => STAT_NAMES[s]).join('・')} ／ 苦手: ${wt.weak.map(s => STAT_NAMES[s]).join('・') || 'なし'}</p></div>
      <div><h3>戦闘能力</h3><table class="stats"><tr><th>攻撃力</th><td>${d.atk}</td><th>魔法攻撃</th><td>${d.matk}</td></tr><tr><th>防御力</th><td>${d.def}</td><th>被ダメ軽減</th><td>${pct(d.dr)}</td></tr><tr><th>最大HP</th><td>${d.maxHp}</td><th>最大SP</th><td>${d.maxSp}</td></tr><tr><th>会心率</th><td>${pct(d.crit)}</td><th>会心威力</th><td>${pct(d.critDmg)}</td></tr><tr><th>攻撃速度</th><td>${pct(d.aspd)}</td><th>移動速度</th><td>${pct(d.move)}</td></tr><tr><th>CD短縮</th><td>${pct(d.cdr)}</td><th></th><td></td></tr></table>
      <p class="mods">${esc(modsText(Object.fromEntries(Object.entries(d.mods).filter(([k, v]) => typeof v === 'number' || (k === 'elemDmg')))))}</p>
      <h3>武器熟練度</h3><ul class="mast">${mast}</ul><h3>記録</h3><p>討伐数 ${ch.progress.kills} ・ ボス撃破 ${Object.entries(ch.progress.bossKills).map(([k, v]) => k + ':' + v).join(' ') || 0} ・ ABYSS最高 ${ch.progress.abyssMax}F</p><ul>${clears}</ul><p>称号: ${ch.progress.titles.map(esc).join('、')}</p></div></div>`);
  }
  p_skills() {
    const ch = this.self.ch, known = new Set(this.self.known), wt = this.self.d.wt; const tab = this.skillTab;
    const m = ch.mastery[wt]?.lv || 0;
    let list = [];
    if (tab === 'wtype') { const t = D.types.get(wt); if (!t) { loadType(wt).then(() => this.render()); } list = t ? t.skills : []; }
    if (tab === 'weapon') list = ch.inventory.filter(i => i.kind === 'weapon').map(i => D.weapons.get(i.ref)?.skill).filter(Boolean);
    if (tab === 'level') list = D.levelSkills;
    if (tab === 'job') list = Object.keys(ch.jobs).map(j => D.jobMap.get(j)?.active).filter(Boolean);
    if (tab === 'spell') list = Object.entries(ch.spells || {}).filter(([, v]) => v.stage >= 4).map(([id]) => D.skills.get(id)).filter(Boolean);
    const lvOf = id => ch.skills.levels[id]?.lv || 1;
    const rows = list.map(s => { const ok = known.has(s.id); const req = s.src === 'wtype' ? `熟練${s.req.mastery}` : s.src === 'level' ? `Lv${s.req.level}` : s.src === 'job' ? (s.job === ch.job ? '現職' : '転職で使用可') : s.src === 'spell' ? `${s.catName} T${s.tier}${ch.spells?.[s.id]?.mods && Object.keys(ch.spells[s.id].mods).length ? ' ・ 改良済' : ''}` : (ch.equip.weapon && D.weapons.get(ch.inventory.find(i => i.uid === ch.equip.weapon)?.ref)?.skill.id === s.id ? '装備中' : '装備で使用可');
      return `<div class="srow ${ok ? '' : 'locked'} ${this.slotSel === s.id ? 'sel' : ''}" ${ok && s.kind !== 'passive' ? `data-act="pickSkill" data-v="${s.id}"` : ''}><div class="sh"><b style="color:${s.el ? ELEMENT_COLORS[s.el] : '#fff'}">${KIND_ICON[s.kind] || '✧'} ${esc(s.name)}</b><small>${req}${ok && ch.skills.levels[s.id] ? ` ・ SkLv${lvOf(s.id)}` : ''}${s.kind === 'passive' ? ' ・ パッシブ' : ` ・ SP${s.cost} CD${(s.cd / 1000).toFixed(1)}s`}${s.ult ? ' ・ 奥義' : ''}</small></div><p>${esc(describeSkill(s))}</p></div>`; }).join('');
    const slots = ch.skills.slots.map((id, i) => `<button class="slotb ${this.slotSel !== null ? 'hl' : ''}" data-act="slot" data-v="${i}">${i + 1}: ${esc(D.skills.get(id)?.name || '―')}</button>`).join('');
    const tabs = `<div class="tabs">${Object.entries({ ...SRC_NAMES, spell: '魔法' }).map(([k, n]) => `<button class="${tab === k ? 'sel' : ''}" data-act="skillTab" data-v="${k}">${n}</button>`).join('')}</div>`;
    const wtd = WT_BY_ID[wt];
    return this.wrap('スキル', `<div class="slots">${slots}<button data-act="pickSkill" data-v="">外す</button></div><p class="dim">${this.slotSel !== null ? 'セットするスロットを選択してください' : 'スキルを選んでからスロットを押すとセットできます（4枠）。武器種スキルは武器熟練度で習得、固有スキルは装備武器、レベルスキルはレベル、職業スキルは現職で使用できます。'}</p>
      ${tab === 'wtype' ? `<p>${esc(wtd.name)} 熟練度 <b>${m}</b>/100 ・ 習得 ${Math.min(100, m)}/100 ・ 特殊アクション: ${SPECIAL_NAMES[wtd.special.type]} ・ 回避: ${DODGE[wtd.dodge]}</p>` : ''}${tab === 'spell' ? `<p>習得した失われた魔法 ${list.length}種 <button class="primary" data-act="spellLab">魔法研究を開く</button></p>${list.length ? '' : '<p class="dim">魔物や宝箱から「魔法断片」を集め、図書館・学院・研究所で解析→再構築→実験→習得しよう。</p>'}` : ''}<div class="slist">${rows}</div>`, tabs);
  }
  p_jobs() {
    const ch = this.self.ch; const tier = this.sel.tier ?? 'all', role = this.sel.role ?? 'all', q = this.sel.search || ''; const page = this.sel.page || 0;
    let js = D.jobs.filter(j => (tier === 'all' || j.tier === +tier) && (role === 'all' || j.role === role) && (!q || j.name.includes(q)));
    if (this.sel.owned === '1') js = js.filter(j => ch.jobs[j.id]);
    const per = 60, pages = Math.ceil(js.length / per); const shown = js.slice(page * per, page * per + per);
    const roles = [...new Set(D.jobs.filter(j => !j.event).map(j => j.role))].map(r => [r, D.jobs.find(j => j.role === r && j.tier === 0)?.name || r]);
    const list = shown.map(j => `<div class="irow ${this.sel.job === j.id ? 'sel' : ''} ${ch.jobs[j.id] ? '' : 'locked'}" data-act="job" data-v="${j.id}"><span>${ch.job === j.id ? '★' : ''}${esc(j.name)}</span><small>${j.tierName}${ch.jobs[j.id] ? ` R${ch.jobs[j.id].rank}` : ''}</small></div>`).join('');
    const j = D.jobMap.get(this.sel.job || ch.job); const jp = ch.jobs[j.id];
    const det = `<h3>${esc(j.name)} <small>${j.tierName}${j.el ? ` ・ <span style="color:${ELEMENT_COLORS[j.el]}">${ELEMENT_NAMES[j.el]}</span>` : ''}</small></h3><p>${esc(j.desc)}</p>
      <p>ステータス補正: ${Object.entries(j.stats).map(([k, v]) => `${STAT_NAMES[k]}+${v}`).join(' ')}</p><h4>固有パッシブ「${esc(j.passive.name)}」</h4><p>${esc(modsText(j.passive.mods))}<br><small class="dim">熟練度ランクごとに効果+10%</small></p>
      <h4>固有アクティブ「${esc(j.active.name)}」</h4><p>${esc(describeSkill(j.active))}</p><p class="dim">SP${j.active.cost} ・ CD${j.active.cd / 1000}秒</p>
      <p>武器相性: ◎${j.affinity.best.map(c => WEAPON_CATEGORIES.find(x => x.id === c)?.name).join('・')} ○${j.affinity.good.map(c => WEAPON_CATEGORIES.find(x => x.id === c)?.name).join('・') || 'なし'}（装備制限なし）</p>
      <p>解放条件: ${esc(unlockText(j.unlock, D.dungeons))}</p>${j.parent ? `<p>派生元: ${esc(D.jobMap.get(j.parent)?.name)}</p>` : ''}${j.children.length ? `<p>派生先: ${j.children.slice(0, 8).map(c => esc(D.jobMap.get(c)?.name)).join('、')}${j.children.length > 8 ? '…' : ''}</p>` : ''}
      ${jp ? `<p>熟練度ランク ${jp.rank}/10 ${jp.rank < 10 ? `(${jp.xp}/${jobXpToNext(jp.rank)})` : ''}</p>` : ''}
      ${ch.job !== j.id ? `<button class="primary" data-act="changeJob" data-v="${j.id}" ${this.state.zone.kind !== 'town' ? 'disabled' : ''}>${jp ? '転職する' : '条件を満たしていれば解放して転職'}</button>${this.state.zone.kind !== 'town' ? '<small class="dim"> ※街で転職できます</small>' : ''}` : '<p class="good">現在の職業</p>'}`;
    const filters = `<div class="filters"><select data-set="tier"><option value="all">全階級</option>${['基本職', '応用職', '上級職', '特殊職', '希少職', '隠し職', '固有職'].map((t, i) => `<option value="${i}" ${+tier === i && tier !== 'all' ? 'selected' : ''}>${t}</option>`).join('')}</select><select data-set="role"><option value="all">全系統</option>${roles.map(([r, n]) => `<option value="${r}" ${role === r ? 'selected' : ''}>${n}系</option>`).join('')}</select><select data-set="owned"><option value="0">全て</option><option value="1" ${this.sel.owned === '1' ? 'selected' : ''}>解放済のみ</option></select><input data-search="1" placeholder="名前検索" value="${esc(q)}"><span>${js.length}件 ・ 解放 ${Object.keys(ch.jobs).length}/${D.jobs.length}</span></div>`;
    const pager = pages > 1 ? `<div class="pager">${Array.from({ length: pages }, (_, i) => `<button class="${i === page ? 'sel' : ''}" data-act="page" data-v="${i}">${i + 1}</button>`).join('')}</div>` : '';
    return this.wrap('職業', `${filters}<div class="split"><div class="list">${list}${pager}</div><div class="det">${det}</div></div>`);
  }
  p_codex() {
    const id = this.codexType, wt = WT_BY_ID[id], t = D.types.get(id); if (!t) loadType(id).then(() => this.render());
    const cats = WEAPON_CATEGORIES.map(c => `<div class="cat"><h4>${c.name}</h4>${WEAPON_TYPES.filter(w => w.id >= c.range[0] && w.id <= c.range[1]).map(w => `<button class="${w.id === id ? 'sel' : ''}" data-act="codexType" data-v="${w.id}">${w.id}.${w.name}</button>`).join('')}</div>`).join('');
    const tab = this.codexTab; const codex = new Set(this.self.ch.progress.codex);
    let body = '';
    if (tab === 'profile') body = `<h3>${wt.id}. ${esc(wt.name)} <small>${categoryOf(wt.id).name}${wt.myth ? ' ・ 初期選択不可' : ''}</small></h3><p>◎ ${esc(wt.pros)}</p><p>△ ${esc(wt.cons)}</p>
      <h4>通常攻撃コンボ</h4>${(wt.alt ? [['第一形態', wt.combo], ['第二形態', wt.alt]] : [['', wt.combo]]).map(([n, c]) => `${n ? `<p><b>${n}</b></p>` : ''}<ol>${c.map(s => `<li>${{ arc: '斬撃', thrust: '刺突', circle: '回転', proj: '射撃', beam: '光線', slam: '叩きつけ', chain: '鎖', whip: '鞭' }[s.s]} 威力${pct(s.m)}${s.h > 1 ? '×' + s.h : ''} ・ 出${s.t[0]}ms/持続${s.t[1]}ms/硬直${s.t[2]}ms${s.r ? ` ・ 半径${s.r}` : ''}${s.l ? ` ・ 長さ${s.l}` : ''}${s.rng ? ` ・ 射程${s.rng}` : ''}${s.a ? ` ・ ${s.a}°` : ''}${s.st ? ` ・ 怯み${s.st}` : ''}${s.pen ? ` ・ 貫通${pct(s.pen)}` : ''}${s.el ? ` ・ ${ELEMENT_NAMES[s.el] || '武器'}属性` : ''}</li>`).join('')}</ol>`).join('')}
      <p>特殊アクション: <b>${SPECIAL_NAMES[wt.special.type]}</b> ・ 回避: ${DODGE[wt.dodge]} ・ 移動速度 ${pct(wt.move)}</p><p>能力倍率: ${Object.entries(wt.scale).map(([k, v]) => `${STAT_NAMES[k]}×${v}`).join(' ')} ・ 得意: ${wt.good.map(s => STAT_NAMES[s]).join('・')} ・ 苦手: ${wt.weak.map(s => STAT_NAMES[s]).join('・') || 'なし'}</p>
      <p>相性属性: ${wt.elem.map(e => `<span style="color:${ELEMENT_COLORS[e]}">${ELEMENT_NAMES[e]}</span>`).join(' ') || 'なし'} ・ 得意状態異常: ${wt.status.map(s => STATUS[s]?.name).join('・') || 'なし'}</p>`;
    else if (tab === 'skills') body = t ? `<div class="slist">${t.skills.map(s => `<div class="srow"><div class="sh"><b style="color:${s.el ? ELEMENT_COLORS[s.el] : '#fff'}">${KIND_ICON[s.kind] || ''} ${s.req.mastery}. ${esc(s.name)}</b><small>${s.kind === 'passive' ? 'パッシブ' : `SP${s.cost} CD${s.cd / 1000}s`}${s.ult ? ' 奥義' : ''}</small></div><p>${esc(describeSkill(s))}</p></div>`).join('')}</div>` : '読み込み中…';
    else body = t ? `<div class="split"><div class="list">${t.weapons.map(w => `<div class="irow ${this.sel.cw === w.id ? 'sel' : ''}" data-act="tab" data-k="cw" data-v="${w.id}"><span style="color:${rar(w.rar).color}">${codex.has(w.id) ? '' : '？'}${esc(w.name)}</span><small>${rar(w.rar).key} Lv${w.lvl}</small></div>`).join('')}</div><div class="det">${this.sel.cw && D.weapons.get(this.sel.cw)?.wt === id ? this.weaponDetail(D.weapons.get(this.sel.cw)) : `<p>図鑑登録 ${t.weapons.filter(w => codex.has(w.id)).length}/100</p>`}</div></div>` : '読み込み中…';
    const tabs = `<div class="tabs">${[['profile', '戦闘スタイル'], ['skills', '武器種スキル100'], ['weapons', '武器100']].map(([k, n]) => `<button class="${tab === k ? 'sel' : ''}" data-act="codexTab" data-v="${k}">${n}</button>`).join('')}</div>`;
    return this.wrap(`武器図鑑 <small>全${D.index.counts.weapons.toLocaleString()}種 ・ 登録${codex.size}</small>`, `<div class="codex"><div class="cats">${cats}</div><div class="cbody">${body}</div></div>`, tabs);
  }
  p_quests() {
    const ch = this.self.ch; const mine = Object.entries(ch.progress.quests).filter(([, q]) => !q.done);
    const my = mine.map(([id, q]) => `<div class="srow"><div class="sh"><b>${esc(q.def.name)}</b><small>${q.ready ? '<span class="good">達成</span>' : `${q.prog || 0}/${q.def.n || 1}`}</small></div><p>${esc(q.def.desc)} ・ 報酬 ${q.def.reward.gold?.toLocaleString()}G / EXP${q.def.reward.xp?.toLocaleString()}${q.def.reward.myth ? ' / 神話武器' : ''}</p>${this.service === 'quest' && q.ready ? `<button class="primary" data-act="qTurn" data-v="${id}">報告</button>` : ''}<button data-act="qAbandon" data-v="${id}">破棄</button></div>`).join('') || '<p class="dim">受注中のクエストはありません</p>';
    const board = this.service === 'quest' && this.svc?.board ? this.svc.board.filter(q => !ch.progress.quests[q.id]).map(q => `<div class="srow ${q.special ? 'special' : ''}"><div class="sh"><b>${q.special ? '【特別】' : ''}${esc(q.name)}</b><small>${q.diff || ''}</small></div><p>${esc(q.desc)} ・ 報酬 ${q.reward.gold.toLocaleString()}G / EXP${q.reward.xp.toLocaleString()}${q.reward.myth ? ' / 神話武器' : ''}${q.reward.item ? ' / ボス級武器' : ''}</p><button data-act="qAccept" data-v="${q.id}">受注</button></div>`).join('') : '';
    return this.wrap('クエスト', `${board ? `<h3>クエスト掲示板</h3><div class="slist">${board}</div>` : '<p class="dim">街のクエスト掲示板で新しい依頼を受注できます</p>'}<h3>受注中</h3><div class="slist">${my}</div>`);
  }
  p_dungeon() {
    const ids = this.svc?.dungeons || D.content.dungeons.map(d => d.id); if (!this.sel.dun || !ids.includes(this.sel.dun)) this.sel.dun = ids[0];
    const d = D.dungeons[this.sel.dun]; const ch = this.self.ch; const c = ch.progress.clears[d.id] || {}; const diff = this.sel.diff || 'NORMAL'; const best = c[diff] || 0;
    const top = d.maxFloor || 100; const floors = [1]; for (let f = 11; f <= Math.min(top - 9, best + 1); f += 10) floors.push(f);
    const lockMsg = d.hardOnly && !['HARD', 'HELL', 'ABYSS'].includes(diff) ? 'HARD以上でのみ挑める' : diff === 'ABYSS' && !(c.HELL >= 100) && ch.level < 150 ? 'HELL100階踏破 または Lv150で解放' : diff === 'HELL' && !(c.HARD >= 50) && ch.level < 80 ? 'HARD50階踏破 または Lv80で解放' : '';
    return this.wrap('ダンジョン', `<div class="split"><div class="list">${ids.map(id => { const x = D.dungeons[id]; return `<div class="irow ${id === d.id ? 'sel' : ''}" data-act="dsel" data-v="${id}"><span>${esc(x.name)}</span><small>推奨Lv${x.minLv}〜</small></div>`; }).join('')}</div>
      <div class="det"><h3>${esc(d.name)}</h3><p>${esc(d.desc)} ・ 全${top}階${d.underwater ? ` ・ 水中（${d.deepFrom}階以降は潜水装備か呼吸の秘薬が必要）` : ''} ・ 推奨Lv${d.minLv}〜</p><div class="tabs">${DIFFICULTIES.map(x => `<button class="${x.id === diff ? 'sel' : ''}" style="color:${x.color}" data-act="diff" data-v="${x.id}">${x.name}</button>`).join('')}</div>
      <p>最高到達: ${DIFFICULTIES.map(x => `${x.id} ${c[x.id] || 0}F`).join(' / ')}</p>${diff === 'ABYSS' ? '<p class="warn">ABYSS: 敵は先読み・包囲・弱者狙いを行い、階層呪いと複数の凶悪な変異を伴う。神話装備でも30階付近から突破は困難を極める。</p>' : ''}
      <ol class="bands">${d.bands.map((b, i) => `<li>${i * 10 + 1}〜${i * 10 + 10}F <b>${esc(b.name)}</b> <small>${{ cave: '洞窟', rooms: '部屋', maze: '迷路', islands: '浮島', open: '開けた地', arena: '闘技場' }[b.layout]} ・ ${b.gim.map(g => ({ lava: '溶岩', water: '水場', ice: '氷床', spikes: '棘罠', traps: '罠', poisonFog: '毒霧', darkness: '暗闇', eruption: '噴火', blizzard: '吹雪', lightning: '落雷', curseZone: '呪域', wind: '強風', void: '虚空', collapse: '崩落', current: '海流', laser: 'レーザー', steam: '蒸気', conveyor: '搬送床', timeZone: '時間歪曲', echo: '残響', judgment: '裁きの光', sandstorm: '砂嵐', roots: '根' }[g] || g)).join('・') || '特殊ギミックなし'} ・ BOSS:${esc(b.bossName || D.content.bosses.find(x => x[0] === b.boss)?.[1])}</small></li>`).join('')}</ol>
      ${lockMsg ? `<p class="warn">${lockMsg}</p>` : `<p>開始階層: ${floors.map(f => `<button class="primary" data-act="enter" data-v="${f}">${f}F</button>`).join(' ')}</p>`}${this.state.zone.kind === 'dungeon' ? '<button data-act="leave">ダンジョンから帰還</button>' : ''}</div></div>`);
  }
  p_shopW() {
    const stock = this.svc.stock; const wts = [...new Set(stock.map(wtOfWeapon))]; const wt = this.shopWt;
    const t = D.types.get(wt); const items = stock.filter(r => wtOfWeapon(r) === wt).map(r => D.weapons.get(r)).filter(Boolean);
    const sel = D.weapons.get(this.sel.sw);
    return this.wrap(`武器屋 <small>${this.self.ch.gold.toLocaleString()}G</small>`, `<div class="filters">${wts.length > 1 ? `<select data-shopwt="1">${wts.map(w => `<option value="${w}" ${w === wt ? 'selected' : ''}>${WT_BY_ID[w].name}</option>`).join('')}</select>` : ''}</div>
      <div class="split"><div class="list">${!t ? '読み込み中…' : items.map(w => `<div class="irow ${this.sel.sw === w.id ? 'sel' : ''}" data-act="tab" data-k="sw" data-v="${w.id}"><span style="color:${rar(w.rar).color}">${esc(w.name)}</span><small>Lv${w.lvl} ${w.price?.toLocaleString()}G</small></div>`).join('')}</div>
      <div class="det">${sel && !sel.stub ? this.weaponDetail(sel) + `<button class="primary" data-act="buyW" data-v="${sel.id}">${sel.price.toLocaleString()}Gで購入</button>` : '<p class="dim">武器を選択</p>'}</div></div>`);
  }
  p_shopA() { return this.wrap(`防具屋 <small>${this.self.ch.gold.toLocaleString()}G</small>`, `<div class="slist">${this.svc.stock.map(tier => ['armor', 'accessory'].map(slot => { const a = armorDef(slot, tier); const price = Math.round(200 * Math.pow(2.2, tier)); return `<div class="srow"><div class="sh"><b>${a.name}</b><small>必要Lv${Math.max(1, a.lvl - 10)}</small></div><p>防御${a.def} HP+${a.hp}${a.sp ? ` SP+${a.sp}` : ''}${a.crit ? ` 会心+${pct(a.crit)}` : ''}</p><button data-act="buyA" data-v="${tier}" data-slot="${slot}">${price.toLocaleString()}G</button></div>`; }).join('')).join('')}</div>`); }
  p_shopI() { const N = { hp: '回復薬 (HP35%)', sp: '魔力薬 (SP40%)', ore: '強化鉱石', breath: '呼吸の秘薬 (水中呼吸10分)', divingGear: '潜水装備 (所持で水中呼吸)' }; return this.wrap(`道具屋 <small>${this.self.ch.gold.toLocaleString()}G</small>`, `<div class="slist">${this.svc.stock.map(s => `<div class="srow"><div class="sh"><b>${N[s.ref]}</b><small>${s.price}G</small></div>${[1, 5, 10].map(n => `<button data-act="buyI" data-v="${s.ref}" data-n="${n}">×${n} (${s.price * n}G)</button>`).join('')}</div>`).join('')}</div>`); }
  p_smith() { this.sel.item = this.sel.item || this.self.ch.equip.weapon; return this.p_inventory().replace('所持品・装備', '鍛冶屋 ― 装備強化').replace(/<\/div><\/div>$/, `<div class="artcraft">${this.artifactCraft()}</div></div></div>`); }
  p_party() {
    const p = this.self.party; const me = this.self.ch.id;
    const mem = p ? p.members.map(m => `<div class="irow"><span>${m.id === p.leader ? '👑' : ''}${esc(m.name)} Lv${m.lv}</span>${p.leader === me && m.id !== me ? `<button data-act="kick" data-v="${m.id}">除名</button>` : ''}</div>`).join('') + p.npcs.map(n => `<div class="irow"><span>◆${esc(n.name)} Lv${n.lv} (NPC)</span>${p.leader === me ? `<button data-act="kick" data-v="${n.id}">解散</button>` : ''}<button data-act="npcInfo" data-v="${n.id}">情報</button></div>`).join('') : '<p class="dim">パーティー未結成。招待するかNPC冒険者を勧誘すると結成されます。</p>';
    const pl = (this.players || []).map(o => `<div class="irow"><span>${esc(o.name)} Lv${o.lv}</span><small>${esc(o.zone || '')}</small></div>`).join('');
    return this.wrap('パーティー', `<div class="split"><div><h3>メンバー（最大6人）</h3>${mem}<div class="filters"><input id="invname" placeholder="プレイヤー名"><button data-act="invite">招待</button>${p ? '<button data-act="leaveParty">離脱</button>' : ''}</div><p class="dim">パーティーで同じダンジョン・階層に一緒に入場します。経験値はボーナス付きで全員に分配されます。</p></div><div><h3>オンラインプレイヤー</h3>${pl || '<p class="dim">…</p>'}</div></div>`);
  }
  p_npcs() {
    const l = this.npcList || [];
    return this.wrap(`NPC冒険者 <small>${l.length}人</small>`, `<p class="dim">NPC冒険者は独自に冒険・成長・買い物を行います。街で話しかけるとパーティーに勧誘できます（絆が深いほど成功しやすい）。</p><div class="slist">${l.map(n => `<div class="irow" data-act="npcInfo" data-v="${n.id}"><span>${esc(n.name)} Lv${n.lv}</span><small>${{ rest: '街で休息', dungeon: '冒険中', party: 'パーティー中' }[n.state] || n.state} ・ ${esc({ haven: 'ヘイヴン', marina: 'マリナ', celestia: 'セレスティア', dungeon: 'ダンジョン' }[n.where] || n.where)} ・ 絆${Math.round(n.bond)}</small></div>`).join('')}</div>`);
  }
  p_npc() {
    const n = this.svc; if (!n) return '';
    return this.wrap(`${esc(n.name)} <small>Lv${n.lv}</small>`, `${n.line ? `<p class="say">「${esc(n.line)}」</p>` : ''}<p>武器: ${esc(n.weapon)} <small>(${esc(n.wt)})</small> ・ 職業: ${esc(n.job)} <small>${esc(n.jobTier)}</small> ・ 性格: ${esc(n.pers)}</p><p>状態: ${esc({ rest: '休息中', dungeon: '冒険中', party: 'パーティー中' }[n.state] || n.state)} ・ 絆: ${Math.round(n.bond)} ・ 友人: ${esc(n.friends.filter(Boolean).join('、') || 'なし')} ・ ライバル: ${esc(n.rival || 'なし')}</p>
      <p>到達記録: ${Object.entries(n.best || {}).map(([k, v]) => `${esc(D.dungeons[k]?.name)} ${v}F`).join(' / ') || 'なし'}</p><h4>冒険履歴</h4><ul class="log">${n.log.map(l => `<li>${esc(l.m)}</li>`).join('') || '<li class="dim">まだ記録がない</li>'}</ul>
      ${!n.inParty && !n.remote && n.state !== 'party' ? `<button class="primary" data-act="npcInvite" data-v="${n.id}">パーティーに勧誘</button>` : ''}${n.inParty ? `<button data-act="kick" data-v="${n.id}">パーティーから外す</button>` : ''}`);
  }
  // world overview: continents → cities (visited ✓, current ◉) and hidden realms only once discovered
  worldList() {
    const ch = this.self.ch; const vis = new Set(ch.progress.visited || []); const cur = this.state.zone.cityId; const seen = ch.events?.seen || {};
    const conts = CONTINENTS.map(c => { const extra = c.id === 'eldia' ? LEGACY_CITIES : []; const ids = [...extra, ...c.cities.map(x => x.id)].filter(id => CITIES[id]);
      return `<details ${ids.includes(cur) ? 'open' : ''}><summary><b>${esc(c.name)}</b> <small>${ids.filter(i => vis.has(i)).length}/${ids.length}</small></summary><p class="wcities">${ids.map(id => `<span class="${id === cur ? 'good' : vis.has(id) ? '' : 'dim'}">${id === cur ? '◉' : vis.has(id) ? '✓' : '・'}${esc(CITIES[id].name)}</span>`).join(' ')}</p></details>`; }).join('');
    const realms = REALMS.filter(r => seen[r.id]); return conts + `<h4>特殊領域</h4>${realms.length ? realms.map(r => `<p>✦ ${esc(r.name)}</p>`).join('') : '<p class="dim">まだ見ぬ領域が世界のどこかにある…</p>'}<p class="dim"><small>大陸間は港（船）と飛空艇発着場から移動できる</small></p>`;
  }
  p_map() {
    const z = this.state.zone; setTimeout(() => { const cv = this.modal.querySelector('#bigmap'); if (!cv) return; const g = cv.getContext('2d'); const s = Math.min(cv.width / z.w, cv.height / z.h); g.imageSmoothingEnabled = false; g.drawImage(this.ctx.renderer.mini, 0, 0, z.w * s, z.h * s); g.fillStyle = '#fff'; const me = this.state.me; g.fillRect(me.x / 16 * s - 2, me.y / 16 * s - 2, 5, 5); g.font = '11px sans-serif'; g.fillStyle = '#ffd070'; for (const n of z.npcs) g.fillText(n.name, n.x * s, n.y * s); g.fillStyle = '#c0a0ff'; for (const gt of z.gates) g.fillText(D.dungeons[gt.dungeon]?.name, gt.x * s - 20, gt.y * s - 4); g.fillStyle = '#80c0ff'; for (const e of z.exits) g.fillText('→' + e.to, e.x * s - 30, e.y * s); }, 0);
    return this.wrap(`マップ ― ${esc(z.name)}`, `<div class="split"><canvas id="bigmap" width="520" height="420"></canvas><div><h3>世界</h3>${this.worldList()}<p class="dim">各街のダンジョン門番からは全ダンジョンに入場できます。</p>${z.kind === 'dungeon' ? `<p>${z.floor}F / ${z.diff}</p><button data-act="leave">帰還する</button>` : ''}</div></div>`);
  }
  p_exitConfirm() { const d = this.svc || {}; return `<div class="panel small"><div class="ph"><h2>ダンジョンから帰還</h2><button data-act="close" class="x">✕</button></div><div class="pb"><p>${esc(d.name || '')} ${d.floor || ''}階から街へ帰還しますか？</p><p class="dim">到達した階層は記録され、次回は10階ごとの区切りから再開できます。</p><div class="btns"><button class="primary" data-act="leave">帰還する</button> <button data-act="close">キャンセル</button></div></div></div>`; }
  p_settings() {
    const s = this.ctx.settings;
    return this.wrap('設定', `<div class="settings"><label>効果音 <input type="range" min="0" max="1" step="0.05" value="${s.sfx}" data-setting="sfx"></label><label><input type="checkbox" ${s.dmgNumbers ? 'checked' : ''} data-setting="dmgNumbers"> ダメージ数値表示</label><label><input type="checkbox" ${s.shake ? 'checked' : ''} data-setting="shake"> 画面揺れ</label><label><input type="checkbox" ${s.lighting ? 'checked' : ''} data-setting="lighting"> ライティング</label>
      <label>タッチ操作 <select data-setting="touch"><option value="auto" ${s.touch === 'auto' ? 'selected' : ''}>自動</option><option value="on" ${s.touch === 'on' ? 'selected' : ''}>常に表示</option><option value="off" ${s.touch === 'off' ? 'selected' : ''}>非表示</option></select></label>
      <h3>操作</h3><p>移動: WASD ・ 攻撃: 左クリック(長押しでコンボ) ・ 特殊アクション: 右クリック/Shift ・ 回避: Space ・ スキル: 1〜4 (マウス位置に発動) ・ 回復薬: Q/E ・ 調べる: F ・ チャット: Enter</p><p>メニュー: I所持品 C状態 Kスキル J職業 B図鑑 Lクエスト Pパーティー N冒険者 Mマップ O設定</p>
      <button data-act="tutReset">チュートリアルを最初から</button> <button data-act="logout">ログアウト</button></div>`);
  }
}

UI.install();
