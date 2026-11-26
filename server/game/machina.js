// Awakening of the Machine God / DEUS MACHINA: world pressure → omen → awakening; god-machines at six ancient sites act
// by role while calm (scout keeps its distance, guardian defends the core, fabricator produces parts, watcher raises an
// alarm, war machine patrols and fights); attacking a machine makes it hostile, and a watcher spreads the alarm. The world
// outcome chosen at the control facility changes every site for everyone. No input prediction anywhere.
import { MACHINA_SITES, ROLES, MECH_WT } from '../../shared/data/machina.js';
import { makeMonster } from './monsters.js';
import { addItem } from './progress.js';
import { DATA } from '../data.js';
import { T } from './maps.js';

const PASSIVE_OUTCOMES = new Set(['controlled', 'allied', 'watched', 'researched']);
export class Machina {
  constructor(world) { this.world = world; const F = world.events.w.flags; F.machina ||= { p: 0, outcome: null, alarms: 0 }; world.events.register('machina', h => this.sim(h)); }
  get M() { return this.world.events.w.flags.machina; }
  state() { return this.world.events.worldOf('nx05').state; }
  bump(v) { if (this.state() === 'dormant' || this.state() === 'omen') { this.M.p = Math.min(150, this.M.p + v); this.sim(0); } }
  sim(h) { const E = this.world.events, st = this.state();
    if (st === 'dormant' || st === 'omen') this.M.p = Math.min(150, this.M.p + 0.5 * h);
    if (st === 'dormant' && this.M.p >= 50) E.setWorld('nx05', 'omen', { note: '各地の古代遺跡から、規則正しい機械音が聞こえるという' });
    if (this.state() === 'omen' && this.M.p >= 100) { E.setWorld('nx05', 'active', { note: '古代遺跡が一斉に起動した――神機が目を覚ました' }); this.world.econ?.addNews('【神機の目覚め】各地の遺跡で神機が活動を始めた'); } }
  active() { const st = this.state(); if (st === 'active') return true; return st === 'resolved' && this.M.outcome !== 'stopped'; }
  // ── site cores in the fields
  decorate(zones) { for (const [f, S] of Object.entries(MACHINA_SITES)) { const z = zones.get(f); if (!z) continue; const m = z.map; const used = new Set(m.objects.map(o => o.x + ',' + (o.y - 1)));
    const cands = m.spawns.filter(c => !used.has(c[0] + ',' + c[1]) && m.tiles[(c[1] + 1) * m.w + c[0]] !== T.BLOCK && m.tiles[(c[1] + 1) * m.w + c[0]] !== T.WALL); const cell = cands[Math.floor(cands.length / 2)]; if (!cell) continue;
    m.spawns = m.spawns.filter(c => c !== cell && Math.hypot(c[0] - cell[0], c[1] - cell[1]) > 9); m.tiles[cell[1] * m.w + cell[0]] = T.BLOCK; // the machines' territory: wildlife keeps away
    for (const a of [...z.actors.values()]) if (a.kind === 'monster' && a.spawnCell && Math.hypot(a.spawnCell[0] - cell[0], a.spawnCell[1] - cell[1]) <= 9) z.remove(a); m.objects.push({ k: 'machinecore', x: cell[0], y: cell[1] + 1, site: f, name: S.name }); m.props.push({ k: 'pillar', x: cell[0], y: cell[1], w: 1, h: 1, v: 1 }); S.core = cell; } }
  // ── machines appear at active sites while players are around
  sync() { for (const [f, S] of Object.entries(MACHINA_SITES)) { const z = this.world.zones.get(f); if (!z) continue; const have = [...z.actors.values()].filter(a => a.machina && !a.dead);
    if (!this.active() || !z.players.size) { for (const a of have) z.remove(a); continue; } if (have.length >= 3 || !S.core) continue;
    const c = z.tileCenter(S.core); const lv = Math.max(30, Math.round(((z.lv?.[0] || 40) + (z.lv?.[1] || 70)) / 2)); const calm = PASSIVE_OUTCOMES.has(this.M.outcome);
    for (let i = have.length; i < 3; i++) { const m = makeMonster(S.fam, lv, 'HARD', { elite: true }); m.name = `${ROLES[S.role].name}神機`; m.machina = { role: S.role, site: f, hostile: S.role === 'war' && !calm, home: { x: c.x + (i - 1) * 40, y: c.y + 30 }, t: 0 };
      m.x = m.machina.home.x; m.y = m.machina.home.y; m.home = [m.x, m.y]; if (z.blocked(m.x, m.y)) { m.x = c.x; m.y = c.y + 24; } z.add(m); } } }
  // calm behaviour (called from the monster AI while the machine is not hostile)
  passive(zone, m, now) { const R = m.machina; const ps = [...zone.players].filter(p => !p.dead); const near = (r, pt = m) => ps.find(p => Math.hypot(p.x - pt.x, p.y - pt.y) < r);
    const go = (tx, ty, spd) => { const d = Math.hypot(tx - m.x, ty - m.y); if (d < 6) { m.vx = m.vy = 0; return; } const nd = zone.navDir(m, { x: tx, y: ty }); m.vx = nd.x * spd; m.vy = nd.y * spd; m.facing = Math.atan2(nd.y, nd.x); };
    const core = MACHINA_SITES[R.site].core ? zone.tileCenter(MACHINA_SITES[R.site].core) : R.home;
    if (R.role === 'scout') { const p = near(90); if (p) { const a = Math.atan2(m.y - p.y, m.x - p.x); return go(m.x + Math.cos(a) * 40, m.y + Math.sin(a) * 40, 55); } if (!R.wp || now > R.t) { R.t = now + 4000; R.wp = { x: R.home.x + (Math.random() - 0.5) * 220, y: R.home.y + (Math.random() - 0.5) * 220 }; } return go(R.wp.x, R.wp.y, 30); }
    if (R.role === 'guardian') { if (near(70, core) && !PASSIVE_OUTCOMES.has(this.M.outcome)) { R.hostile = true; zone.fx({ t: 'say', id: m.id, v: '中枢ヘノ接近ヲ確認。排除スル' }); return; } return go(R.home.x, R.home.y, 30); }
    if (R.role === 'fabricator') { go(R.home.x, R.home.y, 20); if (now > R.t) { R.t = now + (this.M.outcome === 'allied' ? 15000 : 30000); const p = near(60); if (p?.session) { addItem(p.ch, { kind: 'mat', ref: 'machinePart', n: 1 }); p.session.send({ t: 'toast', v: '生産型神機が組み上げた部品を足元に置いた（神機部品）' }); } } return; }
    if (R.role === 'watcher') { m.vx = m.vy = 0; m.facing += 0.02; return; }
    if (R.role === 'war') return go(R.home.x + Math.cos(now / 3000) * 120, R.home.y + Math.sin(now / 3000) * 80, 35); }
  provoked(zone, m) { if (!m.machina || m.machina.hostile) return; m.machina.hostile = true; const watcher = [...zone.actors.values()].some(a => a.machina?.role === 'watcher' && !a.dead);
    if (watcher || MACHINA_SITES[m.machina.site].role === 'watcher') { this.M.alarms++; for (const a of zone.actors.values()) if (a.machina) a.machina.hostile = true; for (const p of zone.players) p.session?.send({ t: 'toast', v: '監視型神機が警報を発した――遺跡の神機が全機こちらを向いた', cls: 'big' }); } }
  onKilled(s, m) { if (!m.machina) return; addItem(s.ch, { kind: 'mat', ref: 'machinePart', n: 1 + (Math.random() < 0.4 ? 1 : 0) }); }
  // observing a core records the site's role (personal), feeds the city event, and is how players learn what the machines do
  observe(s, o) { const S = MACHINA_SITES[o.site]; if (!this.active()) return s.send({ t: 'toast', v: this.state() === 'resolved' ? '中枢は静かに眠っている。神機は停止したままだ' : '古い機械の柱だ。まだ動いていない' });
    const ch = s.ch; ch.progress.machina ||= {}; const first = !ch.progress.machina[o.site]; ch.progress.machina[o.site] = S.role; s.send({ t: 'toast', v: `【${S.name}】${ROLES[S.role].name}：${ROLES[S.role].desc}` }); if (first) this.world.cev.onSite(s, o.site); }
  resolve(s, outcome) { const E = this.world.events; if (this.M.outcome) return false; this.M.outcome = outcome; E.setWorld('nx05', 'resolved', { outcome, note: `${s.ch.name}の選択で神機の行く末が決まった` });
    for (const f of Object.keys(MACHINA_SITES)) { const z = this.world.zones.get(f); if (!z) continue; for (const a of [...z.actors.values()]) if (a.machina) { if (outcome === 'stopped') z.remove(a); else a.machina.hostile = false; } } return true; }
  // the ruin workshop (after the awakening): build a machine weapon of the official mechanical types
  workshop(s, m) { const ch = s.ch, err = v => s.send({ t: 'err', v }); const ok = this.world.events.isDone(ch, 'nx05') || ['controlled', 'allied', 'researched'].includes(this.M.outcome); if (!ok) return err('神機の目覚めを見届けてから');
    const wt = MECH_WT.includes(m.wt | 0) ? m.wt | 0 : MECH_WT[0]; const need = this.M.outcome === 'controlled' ? 4 : 6; const have = ch.inventory.filter(i => i.ref === 'machinePart').reduce((t, i) => t + i.n, 0); if (have < need || ch.gold < 5000) return err(`神機部品×${need}と5,000Gが必要（所持${have}）`);
    let l = need; for (const i of ch.inventory.filter(x => x.ref === 'machinePart')) { const q = Math.min(l, i.n); i.n -= q; l -= q; } ch.inventory = ch.inventory.filter(i => !(i.ref === 'machinePart' && i.n <= 0)); ch.gold -= 5000;
    const pool = (DATA.wtWeapons.get(wt) || []).filter(w => w.rar <= 4 && !w.myth); const w = pool[Math.floor(Math.random() * pool.length)]; addItem(ch, { kind: 'weapon', ref: w.id, plus: 0 }); this.world.events.log(ch, 'nx05', `神機工房で「${w.name}」を製作`); s.send({ t: 'toast', v: `神機工房で「${w.name}」を組み上げた` }); }
}
