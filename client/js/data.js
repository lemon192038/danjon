// Client-side game data cache (static generated JSON served from /shared/gen).
import { SPECIAL_DUNGEONS, EVENT_BOSSES } from '/shared/data/bigevents.js';
import { SEALED, SEALED_BOSSES } from '/shared/data/library.js';
import { CITY_DUNGEONS, CITY_BOSSES } from '/shared/data/cityevents.js';
import { REALM_DUNGEONS, REALM_BOSSES } from '/shared/data/realms.js';
import { MACHINA_DUNGEON, MACHINA_BOSSES } from '/shared/data/machina.js';
export const D = { index: null, jobs: null, jobMap: new Map(), levelSkills: null, content: null, types: new Map(), skills: new Map(), weapons: new Map(), dungeons: {} };
const J = p => fetch(p).then(r => r.json());
export async function loadCore() {
  const [index, jobs, ls, content, spells] = await Promise.all([J('/shared/gen/index.json'), J('/shared/gen/jobs.json'), J('/shared/gen/levelSkills.json'), J('/shared/gen/content.json'), J('/shared/gen/spells.json')]);
  Object.assign(D, { index, jobs, levelSkills: ls, content });
  for (const j of jobs) { D.jobMap.set(j.id, j); D.skills.set(j.active.id, j.active); }
  for (const s of ls) D.skills.set(s.id, s); D.spells = spells; for (const s of spells) D.skills.set(s.id, s);
  for (const d of content.dungeons) D.dungeons[d.id] = d;
  for (const d of [...Object.values(SPECIAL_DUNGEONS), SEALED, ...Object.values(CITY_DUNGEONS), ...Object.values(REALM_DUNGEONS), MACHINA_DUNGEON]) D.dungeons[d.id] = d; for (const b of [...EVENT_BOSSES, ...SEALED_BOSSES, ...CITY_BOSSES, ...REALM_BOSSES, ...MACHINA_BOSSES]) if (!content.bosses.some(x => x[0] === b[0])) content.bosses.push(b);
  for (const t of index.types) for (const [id, name, rar, lvl] of t.weapons) D.weapons.set(id, { id, name, rar, lvl, wt: t.id, stub: true });
}
const pending = new Map();
export function loadType(id) {
  id = +id; if (D.types.has(id)) return Promise.resolve(D.types.get(id)); if (pending.has(id)) return pending.get(id);
  const p = J(`/shared/gen/types/${id}.json`).then(t => { D.types.set(id, t); for (const s of t.skills) D.skills.set(s.id, s); for (const w of t.weapons) { D.weapons.set(w.id, w); D.skills.set(w.skill.id, w.skill); } pending.delete(id); return t; });
  pending.set(id, p); return p;
}
export const wtOfWeapon = ref => +String(ref).split('_')[0];
