// EventEngine (PHASE 1 foundation). Server-authoritative, data-driven by shared/data/events.js.
//  - world-shared state (event phase, flags, history) is persisted in aef_world under `events`
//  - personal state (progress, attempts, outcomes, granted rewards, log, discovered places) lives on the character
//  - rewards are idempotent per (character, event, reward key): duplicates are impossible even on replayed requests
//  - progress only moves forward; completion is validated against the event definition
//  - condition evaluator for discovery/trigger rules; offline region simulators run on elapsed time (bounded)
import { EVENTS, EVENT_BY_ID, EVENT_KINDS, EVENT_GROUPS } from '../../shared/data/events.js';
import { PLACE } from '../../shared/data/world.js';
import { STORIES } from './stories.js';
import { addItem, grantXp, checkJobUnlocks } from './progress.js';

const LOG_CAP = 200, HIST_CAP = 400, MAX_SIM_HOURS = 72;
export class EventEngine {
  constructor(world, saved) {
    this.world = world; this.w = { ev: {}, flags: {}, history: [], sims: {}, ...(saved || {}) }; this.simulators = new Map();
  }
  save() { return { ...this.w, history: this.w.history.slice(-HIST_CAP) }; }
  def(id) { const d = EVENT_BY_ID[id]; if (!d) throw new Error('unknown event ' + id); return d; }
  // ── personal state
  pc(ch) { ch.events ||= { prog: {}, rewards: {}, log: [], seen: {} }; return ch.events; }
  prog(ch, id) { return this.pc(ch).prog[id] || null; }
  log(ch, id, v) { const P = this.pc(ch); P.log.push({ t: Date.now(), id, v }); if (P.log.length > LOG_CAP) P.log.splice(0, P.log.length - LOG_CAP); }
  notify(s, id, v) { if (!s) return; s.send({ t: 'evUpdate', id, v }); if (v) this.world.note(s, { t: 'msg', v: `【${this.def(id).name}】${v}` }); }
  // start (or restart, for repeatable events). Returns {ok} or {error}.
  start(s, id, opt = {}) {
    const d = this.def(id), ch = s.ch, P = this.pc(ch); const cur = P.prog[id];
    if (cur && !cur.done) return { error: '進行中です' };
    if (cur?.done && d.repeat === 'none') return { error: 'このイベントは完了済みです' };
    for (const pre of d.prereq) if (!this.isDone(ch, pre)) return { error: `前提イベント「${this.def(pre).name}」が未完了です` };
    if (d.cond && !this.cond(ch, d.cond)) return { error: '発生条件を満たしていません' };
    P.prog[id] = { stage: 0, started: Date.now(), done: false, outcome: null, attempts: (cur?.attempts || 0) + 1, clears: cur?.clears || 0, data: opt.data || {} };
    this.log(ch, id, cur ? '再挑戦を開始' : '開始'); this.notify(s, id, opt.silent ? null : (cur ? '再挑戦を開始した' : 'イベントを開始した')); s.dirty = true;
    return { ok: true };
  }
  // forward-only stage progression (stage index into d.stages)
  advance(s, id, stage, opt = {}) {
    const d = this.def(id), p = this.prog(s.ch, id); if (!p || p.done) return { error: '進行中ではありません' };
    if (!Number.isInteger(stage) || stage <= p.stage || (d.stages.length && stage >= d.stages.length)) return { error: '不正な段階です' };
    p.stage = stage; if (opt.data) Object.assign(p.data, opt.data);
    this.log(s.ch, id, `段階${stage + 1}：${d.stages[stage] || ''}`); this.notify(s, id, opt.silent ? null : d.stages[stage] ? `「${d.stages[stage]}」へ進んだ` : null); s.dirty = true; return { ok: true };
  }
  complete(s, id, outcome = null, opt = {}) {
    const d = this.def(id), p = this.prog(s.ch, id); if (!p || p.done) return { error: '進行中ではありません' };
    if (outcome && d.outcomes.length && !d.outcomes.includes(outcome)) return { error: '不正な結末です' };
    p.done = true; p.outcome = outcome; p.finished = Date.now(); p.clears = (p.clears || 0) + 1;
    this.log(s.ch, id, `完了${outcome ? '：' + outcome : ''}`); this.history(id, `${s.ch.name}が「${d.name}」を${outcome ? `「${outcome}」で` : ''}達成`, { who: s.ch.name, outcome });
    this.notify(s, id, opt.silent ? null : `達成${outcome ? '：' + outcome : ''}`); checkJobUnlocks(s.ch, n => this.world.note(s, n)); s.dirty = true; return { ok: true };
  }
  isDone(ch, id) { const p = this.prog(ch, id); return !!p?.done || (p?.clears || 0) > 0 || this.w.ev[id]?.state === 'resolved'; }
  // idempotent reward: key is unique per event (+ attempt for rechallenge rewards with perAttempt)
  grant(s, id, key, reward, opt = {}) {
    this.def(id); const ch = s.ch, P = this.pc(ch); const p = P.prog[id];
    const rk = `${id}:${key}${opt.perAttempt ? '#' + (p?.attempts || 0) : ''}`; if (P.rewards[rk]) return false;
    P.rewards[rk] = Date.now(); const note = n => this.world.note(s, n); const got = [];
    if (reward.gold) { ch.gold += reward.gold; got.push(`${reward.gold}G`); }
    if (reward.xp) { grantXp(ch, reward.xp, note); got.push(`EXP${reward.xp}`); }
    if (reward.title && !ch.progress.titles.includes(reward.title)) { ch.progress.titles.push(reward.title); note({ t: 'title', v: reward.title }); got.push(`称号「${reward.title}」`); }
    for (const it of reward.items || []) { addItem(ch, { ...it }, note); got.push(it.ref); }
    if (reward.flag) Object.assign(P.data ||= {}, { [reward.flag]: true });
    this.log(ch, id, `報酬：${got.join('、') || key}`); checkJobUnlocks(ch, note); s.dirty = true; return true;
  }
  hasReward(ch, id, key) { return !!this.pc(ch).rewards[`${id}:${key}`]; }
  // ── world-shared state
  worldOf(id) { this.def(id); return this.w.ev[id] ||= { state: 'dormant', stage: 0, since: Date.now(), count: 0, data: {} }; }
  setWorld(id, state, opt = {}) {
    const e = this.worldOf(id); const ORDER = ['dormant', 'omen', 'active', 'resolved'];
    if (!ORDER.includes(state)) throw new Error('bad state'); if (e.state === state && !opt.force) return false;
    if (state === 'active' && e.state !== 'active') e.count++; e.state = state; e.since = Date.now(); if (opt.outcome) e.outcome = opt.outcome; if (opt.data) Object.assign(e.data, opt.data);
    this.history(id, opt.note || `「${this.def(id).name}」が${{ dormant: '沈静化した', omen: '前兆を見せている', active: '発生した', resolved: '終息した' }[state]}`, { state });
    if (state === 'active' || state === 'omen') for (const ss of this.world.sessions.values()) ss.send({ t: 'chat', from: '世界', v: opt.note || `${this.def(id).name}：${state === 'active' ? '発生' : '前兆'}` });
    return true;
  }
  flag(k, v) { if (v === undefined) return this.w.flags[k]; this.w.flags[k] = v; return v; }
  history(id, v, extra = {}) { this.w.history.push({ t: Date.now(), id, v, ...extra }); if (this.w.history.length > HIST_CAP) this.w.history.splice(0, this.w.history.length - HIST_CAP); }
  // ── discovery of places (hidden realms stay off the map until discovered)
  discover(s, place) { if (!PLACE[place]) return false; const P = this.pc(s.ch); if (P.seen[place]) return false; P.seen[place] = Date.now(); this.log(s.ch, 'ex_dungeons', `発見：${PLACE[place].name}`); this.world.note(s, { t: 'msg', v: `新たな地を発見した：${PLACE[place].name}` }); s.dirty = true; return true; }
  discovered(ch, place) { return !!this.pc(ch).seen[place]; }
  // ── condition evaluator (data-driven triggers)
  cond(ch, c) {
    if (!c) return true; if (Array.isArray(c)) return c.every(x => this.cond(ch, x));
    if (c.all) return c.all.every(x => this.cond(ch, x)); if (c.any) return c.any.some(x => this.cond(ch, x)); if (c.not) return !this.cond(ch, c.not);
    if (c.level != null && ch.level < c.level) return false;
    if (c.job && !ch.jobs?.[c.job]) return false;
    if (c.title && !ch.progress.titles.includes(c.title)) return false;
    if (c.item && !ch.inventory.some(i => i.ref === c.item && (i.n ?? 1) >= (c.n || 1))) return false;
    if (c.event) { const p = this.prog(ch, c.event); if (c.done ? !this.isDone(ch, c.event) : (!p || (c.stage != null && p.stage < c.stage))) return false; }
    if (c.world) { const e = this.w.ev[c.world]; if ((e?.state || 'dormant') !== (c.state || 'active')) return false; }
    if (c.flag && !this.w.flags[c.flag]) return false;
    if (c.discovered && !this.discovered(ch, c.discovered)) return false;
    if (c.hour) { const h = this.world.clockHour(); const [a, b] = c.hour; if (!(a <= b ? h >= a && h < b : h >= a || h < b)) return false; }
    if (c.mastery) { const [wt, lv] = c.mastery; if ((ch.mastery?.[wt]?.lv || 0) < lv) return false; }
    if (c.floor) { const [dg, f] = c.floor; if ((ch.progress.clears?.[dg]?.max || 0) < f) return false; }
    return true;
  }
  // ── offline/background simulation: simulators get the elapsed game-hours since their last run (bounded)
  register(name, fn) { this.simulators.set(name, fn); }
  simulate(now = Date.now()) {
    for (const [name, fn] of this.simulators) {
      const last = this.w.sims[name] || now; const hours = Math.min(MAX_SIM_HOURS, (now - last) / 3600000);
      if (hours >= 1 / 60 || !this.w.sims[name]) { this.w.sims[name] = now; if (hours > 0) try { fn(hours); } catch (e) { console.error('[events] sim', name, e); } }
    }
  }
  // ── adoption of already-implemented content into the journal/history (no behaviour change)
  onStory(s, city, p, st) {
    const id = 'st_' + city; if (!EVENT_BY_ID[id]) return; const P = this.pc(s.ch); const done = p.step >= st.steps.length;
    const cur = P.prog[id] ||= { stage: 0, started: Date.now(), done: false, outcome: null, attempts: 1, data: {} };
    cur.stage = Math.min(p.step, st.steps.length - 1); if (p.choice) cur.outcome = p.choice;
    if (done && !cur.done) { cur.done = true; cur.finished = Date.now(); this.history(id, `${s.ch.name}が「${st.name}」を見届けた`, { who: s.ch.name, outcome: p.choice }); }
    this.log(s.ch, id, done ? '物語を見届けた' : `段階${p.step + 1}へ`);
  }
  // repeatable live content (raids, arena, dungeon bosses): counts attempts and clears, never 'in progress'
  record(s, id, v, opt = {}) { if (!EVENT_BY_ID[id]) return; const P = this.pc(s.ch); const p = P.prog[id] ||= { stage: 0, started: Date.now(), done: true, outcome: null, attempts: 0, clears: 0, data: {} }; p.attempts++; if (opt.clear) p.clears = (p.clears || 0) + 1; p.done = true; p.last = Date.now(); this.log(s.ch, id, v); }
  // ── journal for the client (personal progress + visible world events). Hidden events appear only once touched.
  journal(ch) {
    const P = this.pc(ch); const list = [];
    for (const d of EVENTS) {
      const p = P.prog[d.id]; const w = this.w.ev[d.id]; const visible = p || (w && w.state !== 'dormant' && !d.kinds.includes('hidden')) || (d.status === 'live' && !d.kinds.includes('hidden'));
      if (!visible) continue;
      list.push({ id: d.id, name: d.name, en: d.en, group: EVENT_GROUPS[d.group], kinds: d.kinds.map(k => EVENT_KINDS[k]), loc: d.loc.map(l => PLACE[l]?.name || l), stages: d.stages, status: d.status, scope: d.scope,
        me: p ? { stage: p.stage, done: p.done, outcome: p.outcome, attempts: p.attempts, clears: p.clears || 0, started: p.started } : null, world: w ? { state: w.state, count: w.count, outcome: w.outcome } : null, trigger: p || d.status !== 'planned' ? d.trigger : '???' });
    }
    return { list, log: P.log.slice(-60).reverse().map(l => ({ ...l, name: EVENT_BY_ID[l.id]?.name })), history: this.w.history.slice(-40).reverse().map(h => ({ ...h, name: EVENT_BY_ID[h.id]?.name })), titles: ch.progress.titles, discovered: Object.keys(P.seen).map(k => PLACE[k]?.name || k) };
  }
}
void STORIES;
