// The Lost Thousand Spells: fragment drops, research steps (analyze → reconstruct → experiment → learn), improvement
// with a fixed budget (no spell can be maxed on every axis), and the final research 第零魔法 (all 7 key spells + the
// forbidden book 『魔力の存在証明』 from the Forbidden Archive).
import { DATA } from '../data.js';
import { addItem } from './progress.js';

const MAGIC_FAMS = new Set(['mage', 'wisp', 'cultist', 'imp', 'voidling', 'angelFallen', 'demon', 'heretic', 'elemFire', 'elemIce', 'elemThunder', 'crystal', 'shade']);
const KEY_BOSS = { lich: 0, phoenix: 1, golemKing: 2, voidEye: 3, timeWarden: 4, seraph: 5, abyssLord: 6 }; // boss key → key spell category
export const IMPROVE = { range: '範囲', speed: '発動速度', cost: '魔力消費', duration: '持続時間', compound: '複合化' };
export const BUDGET = 4; // total improvement points; each axis max 3, compound costs 2
const RESEARCH_PLACES = new Set(['library', 'academy', 'lab', 'observatory']);
export class Spells {
  constructor(world) { this.world = world; this.byCat = {}; for (const s of DATA.spells) (this.byCat[s.cat] ||= []).push(s); this.cache = new Map(); }
  st(ch, id) { return (ch.spells ||= {})[id]; }
  // ── drops
  dropFor(s, z, m) { const ch = s.ch; let sp = null;
    if (m.boss && KEY_BOSS[m.fam] != null && ['HARD', 'HELL', 'ABYSS'].includes(z.diff) && Math.random() < 0.15) sp = DATA.spells.find(x => x.key && x.cat === ['lostel', 'ancient', 'compound', 'space', 'time', 'summon', 'null'][KEY_BOSS[m.fam]]);
    else if (m.boss ? Math.random() < 0.25 : MAGIC_FAMS.has(m.fam) && Math.random() < 0.02) { const tierMax = Math.min(5, 1 + Math.floor((m.level || 1) / 25)); const pool = DATA.spells.filter(x => !x.key && !x.zero && x.tier <= tierMax); sp = pool[Math.floor(Math.random() * pool.length)]; }
    if (sp) this.giveFrag(s, sp); }
  chestFrag(s, z) { const tierMax = Math.min(5, 1 + Math.floor((z.floor || 1) / 20)); const pool = DATA.spells.filter(x => !x.key && !x.zero && x.tier <= tierMax); this.giveFrag(s, pool[Math.floor(Math.random() * pool.length)]); }
  giveFrag(s, sp) { const ch = s.ch; addItem(ch, { kind: 'sfrag', ref: sp.id, n: 1 }); const st = (ch.spells ||= {})[sp.id] ||= { stage: 0 }; void st;
    this.world.note(s, { t: 'msg', v: `魔法断片を発見：${st.stage >= 1 ? sp.name : '未解析の' + sp.catName}` }); const E = this.world.events; if (!E.prog(ch, 'ev_thousand_spells')) E.start(s, 'ev_thousand_spells', { silent: true }); }
  frags(ch, id) { return ch.inventory.filter(i => i.kind === 'sfrag' && i.ref === id).reduce((t, i) => t + i.n, 0); }
  take(ch, id, n) { let left = n; for (const i of ch.inventory.filter(x => x.kind === 'sfrag' && x.ref === id)) { const k = Math.min(left, i.n); i.n -= k; left -= k; if (!left) break; } ch.inventory = ch.inventory.filter(i => !(i.kind === 'sfrag' && i.n <= 0)); }
  atLab(s) { const z = s.actor.zone; if (z.kind !== 'interior') return false; const t = z.opts?.bldg?.t; return RESEARCH_PLACES.has(t) || !!z.hideout && s.ch.hideout?.fac?.lab; }
  learned(ch) { return Object.entries(ch.spells || {}).filter(([, v]) => v.stage >= 4).map(([k]) => k); }
  stageUp(s, n) { const E = this.world.events; const P = E.prog(s.ch, 'ev_thousand_spells') || (E.start(s, 'ev_thousand_spells', { silent: true }), E.prog(s.ch, 'ev_thousand_spells')); if (!P.done && P.stage < n) E.advance(s, 'ev_thousand_spells', n, { silent: true }); }
  view(s) { const ch = s.ch; const list = Object.entries(ch.spells || {}).map(([id, v]) => { const sp = DATA.skills.get(id); return { id, stage: v.stage, frags: this.frags(ch, id), need: sp.frags, name: v.stage >= 1 ? sp.name : `未解析の${sp.catName}`, cat: sp.catName, tier: sp.tier, key: v.stage >= 1 && sp.key, mods: v.mods || {}, el: v.stage >= 1 ? sp.el : null, props: v.stage >= 1 ? { cost: sp.cost, cd: sp.cd, cast: sp.cast } : null }; });
    const keys = DATA.spells.filter(x => x.key).map(x => ({ id: x.id, name: x.name, cat: x.catName, have: this.st(ch, x.id)?.stage >= 4 }));
    return { list: list.sort((a, b) => b.stage - a.stage || b.tier - a.tier), learned: this.learned(ch).length, total: DATA.spells.length - 1, keys, book: !!ch.progress.flags?.proofOfMana, atLab: this.atLab(s), zero: this.st(ch, 'sp_zero')?.stage >= 4, labPlus: !!ch.progress.flags?.labPlus, budget: BUDGET, improve: IMPROVE }; }
  open(s) { s.send({ t: 'open', service: 'spells', data: this.view(s) }); }
  act(s, m) {
    const ch = s.ch, err = v => s.send({ t: 'err', v }); const sp = DATA.skills.get(m.id); const st = sp && this.st(ch, m.id); const cost = n => Math.round(n * (ch.progress.flags?.labPlus ? 0.7 : 1));
    if (m.act !== 'view' && m.act !== 'zero' && (!sp || sp.src !== 'spell' || !st)) return;
    if (m.act !== 'view' && !this.atLab(s)) return err('研究は図書館・学院・研究所（または隠れ家の遺物研究室）で行える');
    switch (m.act) {
      case 'analyze': { if (st.stage !== 0) return; const g = cost(300 * sp.tier); if (ch.gold < g) return err(`解析費${g}G`); ch.gold -= g; st.stage = 1; this.stageUp(s, 1); s.send({ t: 'toast', v: `解析完了：${sp.name}（${sp.catName}）` }); break; }
      case 'rebuild': { if (st.stage !== 1) return; if (this.frags(ch, m.id) < sp.frags) return err(`断片が${sp.frags}つ必要（所持${this.frags(ch, m.id)}）`); this.take(ch, m.id, sp.frags); st.stage = 2; this.stageUp(s, 2); s.send({ t: 'toast', v: '魔法式を再構築した' }); break; }
      case 'test': { if (st.stage !== 2) return; const g = cost(500 * sp.tier); if (ch.gold < g) return err(`実験費${g}G`); ch.gold -= g; const chance = 0.55 + Math.min(0.4, (ch.stats.int || 0) / 400);
        if (Math.random() < chance) { st.stage = 3; this.stageUp(s, 3); s.send({ t: 'toast', v: '実験成功！ 魔法として発動を確認した' }); } else s.send({ t: 'toast', v: '実験失敗…（式は無事。もう一度試せる）' }); break; }
      case 'learn': if (st.stage !== 3) return; st.stage = 4; this.stageUp(s, 4); this.world.note(s, { t: 'msg', v: `魔法「${sp.name}」を習得した（スキル枠に設定できる）` }); if (this.learned(ch).length >= 100) this.world.events.grant(s, 'ev_thousand_spells', 'hundred', { title: '百の魔法を識る者' }); break;
      case 'improve': { if (st.stage < 4) return; const v = {}; let used = 0; for (const k of Object.keys(IMPROVE)) { const n = Math.max(0, Math.min(k === 'compound' ? 1 : 3, m.mods?.[k] | 0)); if (n) v[k] = n; used += k === 'compound' ? n * 2 : n; }
        if (used > BUDGET) return err(`改良の配分は合計${BUDGET}点まで（複合化は2点）`); st.mods = v; this.cache.delete(ch.id + m.id); this.stageUp(s, 5); s.send({ t: 'toast', v: '魔法を改良した' }); break; }
      case 'zero': { if (this.st(ch, 'sp_zero')?.stage >= 4) return; const keys = DATA.spells.filter(x => x.key); if (!keys.every(k => this.st(ch, k.id)?.stage >= 4)) return err('七つの重要魔法をすべて習得する必要がある'); if (!ch.progress.flags?.proofOfMana) return err('禁書『魔力の存在証明』を読み解く必要がある（大図書館の禁書庫）');
        ch.spells.sp_zero = { stage: 4 }; (ch.progress.flags ||= {}).labPlus = true; const E = this.world.events; this.stageUp(s, 6); E.complete(s, 'ev_thousand_spells'); E.grant(s, 'ev_thousand_spells', 'zero', { title: '千の魔法を識る者', xp: 50000 }); break; }
    }
    this.world.sendSelf(s); this.open(s);
  }
  // per-character improved spell (used when casting); cached
  custom(ch, sk) { const mods = this.st(ch, sk.id)?.mods; if (!mods || !Object.keys(mods).length) return sk; const key = ch.id + sk.id; if (this.cache.has(key)) return this.cache.get(key);
    const c = JSON.parse(JSON.stringify(sk)); const R = 1 + 0.2 * (mods.range || 0), D = 1 + 0.25 * (mods.duration || 0);
    for (const e of c.eff) { if (e.r) e.r = Math.round(e.r * R); if (e.shape?.r) e.shape.r = Math.round(e.shape.r * R); if (e.shape?.rng) e.shape.rng = Math.round(e.shape.rng * R); if (e.shape?.l) e.shape.l = Math.round(e.shape.l * R); if (e.dur) e.dur = Math.round(e.dur * D); }
    c.cast = Math.round((c.cast || 0) * (1 - 0.25 * (mods.speed || 0))); c.cd = Math.round(c.cd * (1 - 0.1 * (mods.speed || 0))); c.cost = Math.max(1, Math.round(c.cost * (1 - 0.12 * (mods.cost || 0))));
    if (mods.compound) c.eff.push({ t: 'hit', shape: { s: 'circle', r: 60 }, m: 0.6, el: c.el === 'void' ? 'holy' : 'void', delay: 300 });
    this.cache.set(key, c); return c; }
}
