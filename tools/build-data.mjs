// Builds all generated game data into shared/gen/. Run: npm run build:data
import fs from 'node:fs';
import path from 'node:path';
import { parseLists } from './parse-lists.mjs';
import { WEAPON_TYPES } from '../shared/data/weaponTypes.js';
import { buildWeaponTypeSkill } from './gen/skills.mjs';
import { buildWeapon } from './gen/weapons.mjs';
import { buildJobs } from './gen/jobs.mjs';
import { buildEventJobs } from './gen/eventjobs.mjs';
import { buildSpells } from './gen/spells.mjs';
import { buildLevelSkills, FAMILIES, BOSS_ARCHETYPES, DUNGEONS } from './gen/content.mjs';

const OUT = path.resolve('shared/gen');
if (process.argv.includes('--if-missing') && fs.existsSync(path.join(OUT, 'index.json'))) process.exit(0);
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'types'), { recursive: true });
const weaponNames = parseLists('data/source/weapon_names.md');
const skillNames = parseLists('data/source/weapon_type_skill_names.md');
skillNames.set(39, fs.readFileSync('data/source/tonfa_skill_names.txt', 'utf8').split(/\r?\n/).filter(Boolean));

const write = (f, o) => fs.writeFileSync(path.join(OUT, f), JSON.stringify(o));
const index = { types: [], counts: {} };
let nSkills = 0, nWeapons = 0;
for (const wt of WEAPON_TYPES) {
  const sn = skillNames.get(wt.id), wn = weaponNames.get(wt.id);
  if (!sn || sn.length !== 100) throw new Error(`skill names missing for type ${wt.id}`);
  if (!wn || wn.length !== 100) throw new Error(`weapon names missing for type ${wt.id}`);
  const skills = sn.map((n, i) => buildWeaponTypeSkill(n, wt, i));
  const weapons = wn.map((n, i) => buildWeapon(n, wt, i));
  write(`types/${wt.id}.json`, { id: wt.id, skills, weapons });
  nSkills += skills.length; nWeapons += weapons.length;
  index.types.push({ id: wt.id, name: wt.name, weapons: weapons.map(w => [w.id, w.name, w.rar, w.lvl]) });
}
const jobs = [...buildJobs(), ...buildEventJobs()]; // 1,000 base jobs (unchanged) + named event jobs
write('jobs.json', jobs);
write('levelSkills.json', buildLevelSkills());
const spells = buildSpells(); write('spells.json', spells);
write('content.json', { families: FAMILIES, bosses: BOSS_ARCHETYPES, dungeons: DUNGEONS });
index.counts = { weaponTypes: WEAPON_TYPES.length, weaponTypeSkills: nSkills, weapons: nWeapons, uniqueSkills: nWeapons, jobs: jobs.length, spells: spells.length, dungeons: DUNGEONS.length, floors: DUNGEONS.length * 100 };
write('index.json', index);
console.log(index.counts);
