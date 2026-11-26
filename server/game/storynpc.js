// Story NPCs (NEW WORLD EVENTS, PHASE C): named NPCs injected into the city life simulation. They keep a home, go to work,
// eat at the tavern, rest at night, shelter from rain and danger, and change their schedules with event outcomes.
// Roaming NPCs move between cities: the trader by a small utility AI over the trade routes (demand, safety, freshness),
// the bard along a fixed tour. Position is world-shared (events.w.flags.story) and survives restarts.
import { STORY_NPCS, STORY_LINES } from '../../shared/data/sagas.js';
import { CITIES, ROUTES } from '../../shared/data/cities.js';
import { clock } from './life.js';

export class StoryNpcs {
  constructor(world) {
    this.world = world; const F = world.events.w.flags; F.story ||= {}; this.cits = {};
    for (const [id, S] of Object.entries(STORY_NPCS)) { const st = F.story[id] ||= { city: S.city, day: -1, visits: [] }; this.inject(id, st.city); }
  }
  state(id) { return this.world.events.w.flags.story[id]; }
  inject(id, city) {
    const S = STORY_NPCS[id], L = this.world.life; const pack = L.byCity[city]; if (!pack) return null;
    const homes = pack.map.homes || []; const dist = CITIES[city].districts.find(x => x.type === S.district)?.id || CITIES[city].districts[0].id;
    const home = homes.find(h => h.district === dist) || homes[0];
    const c = { id: 'story:' + id, story: id, city, name: S.name, role: 'story', job: S.job, sched: 'story', home: home?.id || null, district: dist, look: S.look, pers: '—', friends: [], fixed: false, work: null };
    pack.list.push(c); L.citizens.push(c); this.cits[id] = c; return c;
  }
  move(id, city) { const c = this.cits[id]; const L = this.world.life; if (!c || c.city === city || !L.byCity[city]) return;
    const old = L.byCity[c.city]; if (old) old.list = old.list.filter(x => x !== c); L.citizens = L.citizens.filter(x => x !== c); if (c.actor) { c.actorZone?.remove(c.actor); c.actor = null; }
    this.state(id).city = city; this.inject(id, city); }
  cityOf(id) { return this.cits[id]?.city; }
  // schedule → life location key (null = fall back to the default citizen behaviour)
  planLoc(c, h, wx) { const S = STORY_NPCS[c.story]; const P = S.plan; const F = this.world.events.w.flags; const E = this.world.events;
    let plan = P.base; const flag = k => F['ct:' + k];
    if (c.story === 'arvel' && flag('arvel') === 'adventure') plan = P.adventure;
    if (c.story === 'harold' && flag('promise') && !['hide', 'respect'].includes(flag('promise'))) plan = P.done;
    if (c.story === 'lily' && flag('heir') === 'duty') plan = P.palace || plan;
    // danger: during the great fire (Arcelia) or an awake calamity near the city, everyone shelters at home
    if (c.city === 'arcelia' && E.w.ev.ct_great_fire?.state === 'active') return c.home ? 'b:' + c.home : null;
    const wet = wx === 'rain' || wx === 'storm' || wx === 'snow'; const pack = this.world.life.byCity[c.city];
    for (const [a, b, place] of plan) { if (h < a || h >= b) continue;
      if (place === 'gate') return wet && !P.waitRain ? 'b:' + (pack.places.tavern[0] || c.home) : 'g:entrance';
      if (place === 'home') return c.home ? 'b:' + c.home : null;
      if (place === 'tavern') return pack.places.tavern[0] ? 'b:' + pack.places.tavern[0] : null;
      if (place.startsWith('work:')) { const id = place.slice(5); return pack.map.doors.some(d => d.id === id) ? 'b:' + id : null; }
      if (place.startsWith('plaza:')) { const t = place.slice(6); const d = CITIES[c.city].districts.find(x => x.type === t) || CITIES[c.city].districts[0]; return wet ? 'b:' + (pack.places.tavern[0] || c.home) : 'p:' + d.id; } }
    return c.home ? 'b:' + c.home : null; }
  // ── roaming (called on every new game day)
  daily() { const day = clock().day; for (const [id, S] of Object.entries(STORY_NPCS)) { if (!S.roam) continue; const st = this.state(id); if (st.day === day) continue; st.day = day;
    if (S.roam === 'route') this.move(id, S.route[day % S.route.length]);
    else if (S.roam === 'trader') this.move(id, this.nextTraderCity(st)); } }
  // trader AI: score neighbours by demand (low supply), safety (weather, fire, calamity), freshness (not recently visited)
  nextTraderCity(st) { const here = st.city; const econ = this.world.econ; const W = this.world.life; const E = this.world.events;
    const nb = [...new Set(ROUTES.filter(r => r[0] === here || r[1] === here).map(r => r[0] === here ? r[1] : r[0]))].filter(c => CITIES[c] && CITIES[c].continent !== 'realm');
    if (!nb.length) return here; let best = here, bs = -1e9;
    for (const c of nb) { const sup = Object.values(econ.supply[c] || {}); const demand = sup.length ? sup.reduce((t, v) => t + (1.2 - v), 0) / sup.length : 0;
      const wx = W.weatherOf(c); const danger = (wx === 'storm' ? 1 : 0) + (c === 'arcelia' && E.w.ev.ct_great_fire?.state === 'active' ? 2 : 0);
      const fresh = st.visits.includes(c) ? -0.6 : 0.3; const s = demand * 2 - danger + fresh + (this.world.econ.flag?.(c) === 'regent' ? -0.2 : 0);
      if (s > bs) { bs = s; best = c; } }
    st.visits = [best, ...st.visits.filter(x => x !== best)].slice(0, 4); return best; }
  line(id, ch) { const L = STORY_LINES[id] || {}; const F = this.world.events.w.flags; const E = this.world.events;
    const key = { arvel: 'arvel', harold: 'promise', erik: 'promise', bard: 'bard', garou: 'rio', lily: 'heir' }[id]; const w = key && F['ct:' + key];
    const ev = STORY_NPCS[id].ev; const P = ev ? E.prog(ch, ev) : null;
    if (id === 'arvel' && P?.done) return L[P.data.choice] || L[w] || L.nothing;
    if (id === 'noah') return ch.progress.flags?.noahFriend ? L.friend : L.pre;
    if (id === 'bard') return w === 'named' ? L.named : w === 'search' ? L.search : P && !P.done ? L.mid : L.pre;
    if (w && L[w]) return L[w]; return P && !P.done && L.mid ? L.mid : L.pre; }
  near(s, id, r = 70) { const c = this.cits[id]; const a = c?.actor; return !!a && a.zone === s.actor.zone && Math.hypot(a.x - s.actor.x, a.y - s.actor.y) < r; }
  performing(id) { const S = STORY_NPCS[id]; const h = clock().hour; return S.perform ? h >= S.perform[0] && h < S.perform[1] : true; }
}
