// Loads generated, data-driven content into lookup maps (server-side source of truth).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WEAPON_TYPES, WT_BY_ID } from '../shared/data/weaponTypes.js';

const GEN = path.join(path.dirname(fileURLToPath(import.meta.url)), '../shared/gen');
const J = f => JSON.parse(fs.readFileSync(path.join(GEN, f), 'utf8'));
import { SPECIAL_DUNGEONS, EVENT_BOSSES } from '../shared/data/bigevents.js';
import { SEALED, SEALED_BOSSES } from '../shared/data/library.js';
export const DATA = { weapons: new Map(), skills: new Map(), wtSkills: new Map(), wtWeapons: new Map(), jobs: new Map(), jobList: [], levelSkills: [], families: new Map(), bosses: new Map(), dungeons: new Map(), dungeonList: [] };

for (const wt of WEAPON_TYPES) {
  const d = J(`types/${wt.id}.json`);
  DATA.wtSkills.set(wt.id, d.skills); DATA.wtWeapons.set(wt.id, d.weapons);
  for (const s of d.skills) DATA.skills.set(s.id, s);
  for (const w of d.weapons) { DATA.weapons.set(w.id, w); DATA.skills.set(w.skill.id, w.skill); }
}
DATA.jobList = J('jobs.json');
for (const j of DATA.jobList) { DATA.jobs.set(j.id, j); DATA.skills.set(j.active.id, j.active); }
DATA.levelSkills = J('levelSkills.json');
DATA.spells = J('spells.json'); for (const s of DATA.spells) DATA.skills.set(s.id, s);
for (const s of DATA.levelSkills) DATA.skills.set(s.id, s);
const c = J('content.json');
for (const f of c.families) DATA.families.set(f[0], { key: f[0], name: f[1], ai: f[2], hp: f[3], atk: f[4], def: f[5], spd: f[6], range: f[7], el: f[8], sprite: f[9], abilities: f[10] });
for (const b of c.bosses) DATA.bosses.set(b[0], { key: b[0], name: b[1], sprite: b[2], abilities: b[3] });
DATA.dungeonList = c.dungeons;
for (const d of c.dungeons) DATA.dungeons.set(d.id, d);
// PHASE 7 part 2: event bosses and hidden special dungeons (not part of dungeonList: never in gates/guild lists)
for (const b of [...EVENT_BOSSES, ...SEALED_BOSSES]) if (!DATA.bosses.has(b[0])) DATA.bosses.set(b[0], { key: b[0], name: b[1], sprite: b[2], abilities: b[3] });
for (const d of [...Object.values(SPECIAL_DUNGEONS), SEALED]) DATA.dungeons.set(d.id, d);

export const dataAccess = { weapon: id => DATA.weapons.get(id), job: id => DATA.jobs.get(id), wtSkills: wt => DATA.wtSkills.get(wt) };
export { WEAPON_TYPES, WT_BY_ID };
