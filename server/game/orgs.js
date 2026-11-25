// Gravel's seven underworld organisations: world-shared simulation (runs while players are offline, bounded by the
// EventEngine simulator), territory = market influence in 'gravel_under' (so raids & gray-market prices react),
// leaders/officers with succession, feuds and alliances, per-player reputation, affiliation and organisation jobs.
import { ORGS, ORG_IDS } from '../../shared/data/gravel.js';
import { LOOT } from '../../shared/data/slum.js';
import { clock } from './life.js';
import { hash32, rng } from '../../shared/util.js';
import { grantXp } from './progress.js';

const RID = 'gravel_under';
export class Orgs {
  constructor(world, saved) {
    this.world = world; this.s = saved || { orgs: {}, feuds: [], news: [] };
    for (const id of ORG_IDS) { const O = ORGS[id]; this.s.orgs[id] ||= { leader: O.leader, officers: [...O.officers], members: O.members, power: O.power, wealth: O.wealth, allies: [...O.allies], enemies: [...O.enemies], leaders: [{ name: O.leader, since: Date.now() }], mood: 0 }; }
    world.events.register('orgs', h => this.simulate(h));
  }
  save() { return { ...this.s, news: this.s.news.slice(0, 30) }; }
  inf() { return this.world.market.influence[RID]; }
  share(id) { const inf = this.inf(); const tot = ORG_IDS.reduce((a, k) => a + (inf[k] || 0), 0) || 1; return Math.round((inf[id] || 0) / tot * 1000) / 10; }
  controller() { return ORG_IDS.slice().sort((a, b) => (this.inf()[b] || 0) - (this.inf()[a] || 0))[0]; }
  news(v, id) { this.s.news.unshift({ t: Date.now(), v }); this.s.news.length = Math.min(30, this.s.news.length); this.world.events.history('sl_factions', v, { org: id }); }
  // one simulated hour per step (offline catch-up runs up to 72h at once)
  simulate(hours) {
    const steps = Math.min(72, Math.max(1, Math.round(hours))); const r = rng(hash32('orgs:' + clock().total));
    for (let k = 0; k < steps; k++) {
      const inf = this.inf();
      for (const id of ORG_IDS) { const o = this.s.orgs[id]; const sh = this.share(id) / 100;
        o.wealth = Math.max(0, Math.min(200, o.wealth + sh * 6 - o.members * 0.01)); o.power = Math.max(5, Math.min(150, o.power + (o.wealth > 60 ? 0.3 : -0.2) + (r() - 0.5)));
        inf[id] = Math.max(1, Math.min(100, (inf[id] || 10) + (o.power - 50) * 0.01 + (r() - 0.5) * 0.6)); }
      // feuds: an enemy pair clashes; the stronger side takes territory, both lose members
      if (r() < 0.12) { const a = ORG_IDS[Math.floor(r() * ORG_IDS.length)]; const A = this.s.orgs[a]; const b = A.enemies[Math.floor(r() * A.enemies.length)];
        if (b) { const B = this.s.orgs[b]; const win = A.power * (0.7 + r() * 0.6) > B.power * (0.7 + r() * 0.6) ? [a, b] : [b, a]; const W = this.s.orgs[win[0]], L = this.s.orgs[win[1]];
          const take = 2 + r() * 4; inf[win[1]] = Math.max(1, inf[win[1]] - take); inf[win[0]] = Math.min(100, inf[win[0]] + take); W.members = Math.max(10, W.members - Math.round(r() * 4)); L.members = Math.max(10, L.members - Math.round(3 + r() * 8)); L.mood -= 1;
          this.news(`${ORGS[win[0]].name}が${ORGS[win[1]].name}との抗争に勝ち、縄張りを広げた`, win[0]); } }
      // succession: weakened or unhappy organisations may see their leader replaced by an officer
      for (const id of ORG_IDS) { const o = this.s.orgs[id]; if ((o.mood < -3 && r() < 0.08) || r() < 0.0015) { const old = o.leader; const nu = o.officers.shift() || `新顔の${ORGS[id].name}幹部`; o.officers.push(`元首領の側近（${old.replace(/「.*?」/, '')}派）`); o.leader = nu; o.mood = 0; o.leaders.push({ name: nu, since: Date.now(), from: old }); this.news(`【${ORGS[id].name}】首領が交代した：${old} → ${nu}`, id); } }
      // alliances drift rarely
      if (r() < 0.01) { const a = ORG_IDS[Math.floor(r() * ORG_IDS.length)], b = ORG_IDS[Math.floor(r() * ORG_IDS.length)]; const A = this.s.orgs[a], B = this.s.orgs[b];
        if (a !== b && !A.enemies.includes(b) && !A.allies.includes(b)) { A.allies.push(b); B.allies.push(a); this.news(`${ORGS[a].name}と${ORGS[b].name}が手を結んだという噂だ`, a); } }
    }
  }
  // ── players
  rep(ch, id) { return ch.orgRep?.[id] || 0; }
  addRep(ch, id, v) { ch.orgRep ||= {}; ch.orgRep[id] = Math.max(-100, Math.min(100, (ch.orgRep[id] || 0) + v)); for (const e of this.s.orgs[id]?.enemies || []) if (v > 0) ch.orgRep[e] = Math.max(-100, (ch.orgRep[e] || 0) - v * 0.5); }
  view(ch, id) { const O = ORGS[id], o = this.s.orgs[id];
    return { id, name: O.name, color: O.color, desc: O.desc, income: O.income, goal: O.goal, event: O.event, leader: o.leader, officers: o.officers, members: o.members, power: Math.round(o.power), wealth: Math.round(o.wealth), share: this.share(id),
      allies: o.allies.map(x => ORGS[x].name), enemies: o.enemies.map(x => ORGS[x].name), rep: Math.round(this.rep(ch, id)), member: ch.org === id, hostile: this.rep(ch, id) < O.hostileBelow, leaders: o.leaders.slice(-5).reverse(),
      jobs: this.jobs(ch, id), active: Object.values(ch.orgJobs || {}).filter(j => j.org === id), board: ORG_IDS.map(k => ({ id: k, name: ORGS[k].name, share: this.share(k), color: ORGS[k].color, leader: this.s.orgs[k].leader })).sort((a, b) => b.share - a.share), news: this.s.news.slice(0, 6).map(n => n.v), controller: ORGS[this.controller()].name }; }
  jobs(ch, id) { const d = clock().day; const r = rng(hash32(id + ':job:' + d)); const o = this.s.orgs[id]; const out = []; const lootK = Object.keys(LOOT).filter(k => ORGS[id].trade.includes(LOOT[k].cat));
    const foe = o.enemies[Math.floor(r() * o.enemies.length)]; if (foe) out.push({ id: `${id}_${d}_0`, org: id, kind: 'hit', target: foe, n: 4, desc: `グレイヴェル地下街で${ORGS[foe].name}の構成員を4人倒す`, rep: 8, gold: 1200 });
    const it = lootK[Math.floor(r() * lootK.length)]; if (it) out.push({ id: `${id}_${d}_1`, org: id, kind: 'deliver', ref: it, n: 1 + Math.floor(r() * 2), desc: `${LOOT[it].name}を届ける`, rep: 6, gold: Math.round(LOOT[it].v * 1.6) });
    out.push({ id: `${id}_${d}_2`, org: id, kind: 'tribute', gold: 0, cost: 800 + Math.floor(r() * 5) * 200, desc: '上納金を納める（組織の縄張り拡大に使われる）', rep: 5 });
    return out; }
  menu(s, m) {
    const ch = s.ch, id = m.org; if (!ORGS[id]) return; const err = v => s.send({ t: 'err', v }); const z = s.actor.zone;
    if (!(z.kind === 'interior' && z.map.npcs?.some(n => n.service === 'org' && n.org === id))) return err(`${ORGS[id].name}の拠点で話してください`);
    if (this.rep(ch, id) < ORGS[id].hostileBelow - 20 && m.act !== 'view') return err(`${ORGS[id].name}はあなたを門前払いした（評判が低すぎる）`);
    ch.orgJobs ||= {};
    switch (m.act) {
      case 'join': if (ch.org === id) return; if (this.rep(ch, id) < 10) return err('評判10以上で加入できる'); if (ch.org) this.addRep(ch, ch.org, -15); ch.org = id; this.addRep(ch, id, 10); this.world.note(s, { t: 'msg', v: `${ORGS[id].name}に加わった` }); this.world.events.record(s, 'sl_factions', `${ORGS[id].name}に加入`); break;
      case 'leave': if (ch.org !== id) return; ch.org = null; this.addRep(ch, id, -10); break;
      case 'accept': { const j = this.jobs(ch, id).find(x => x.id === m.id); if (!j || ch.orgJobs[j.id]) return; if (Object.keys(ch.orgJobs).length >= 3) return err('組織の仕事は3件まで'); ch.orgJobs[j.id] = { ...j, prog: 0 }; break; }
      case 'turnin': { const j = ch.orgJobs[m.id]; if (!j) return;
        if (j.kind === 'tribute') { if (ch.gold < j.cost) return err(`${j.cost}G必要`); ch.gold -= j.cost; this.world.market.shift(RID, id, 1.5); }
        else if (j.kind === 'deliver') { const it = ch.inventory.find(i => i.kind === 'loot' && i.ref === j.ref && i.n >= j.n); if (!it) return err(`${LOOT[j.ref].name}×${j.n}が必要`); it.n -= j.n; if (it.n <= 0) ch.inventory = ch.inventory.filter(i => i !== it); this.world.market.shift(RID, id, 0.8); }
        else if ((j.prog || 0) < j.n) return err(`まだ達成していない（${j.prog || 0}/${j.n}）`);
        delete ch.orgJobs[m.id]; ch.gold += j.gold || 0; grantXp(ch, 400 + (j.gold || 300), n => this.world.note(s, n)); this.addRep(ch, id, j.rep); this.s.orgs[id].mood = Math.min(5, this.s.orgs[id].mood + 0.5);
        this.world.events.record(s, 'sl_factions', `${ORGS[id].name}の仕事「${j.desc}」を果たした`, { clear: true }); break; }
      case 'abandon': delete ch.orgJobs[m.id]; this.addRep(ch, id, -2); break;
    }
    this.world.sendSelf(s); this.open(s, id);
  }
  open(s, id) { s.send({ t: 'open', service: 'org', data: this.view(s.ch, id) }); }
  // a Gravel faction member died in the underground raid
  onKill(s, faction) { if (!ORGS[faction] || !s) return; const ch = s.ch; this.addRep(ch, faction, -2); for (const j of Object.values(ch.orgJobs || {})) if (j.kind === 'hit' && j.target === faction) { j.prog = Math.min(j.n, (j.prog || 0) + 1); if (j.prog >= j.n) this.world.note(s, { t: 'quest', v: `組織の仕事「${j.desc}」達成！拠点で報告しよう` }); }
    const o = this.s.orgs[faction]; o.members = Math.max(10, o.members - 1); o.mood -= 0.05; }
}
