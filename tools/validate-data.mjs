// Validates generated data against the unified skill/effect schema.
import fs from 'node:fs';
import { WEAPON_TYPES } from '../shared/data/weaponTypes.js';
const EFF = new Set(['hit', 'dash', 'blink', 'buff', 'counter', 'shield', 'heal', 'zone', 'barrage', 'summon', 'enchant', 'cleanse', 'aura', 'leap', 'taunt', 'passive']);
const SHAPES = new Set(['arc', 'thrust', 'circle', 'proj', 'beam', 'slam', 'chain', 'whip']);
const errs = []; const ids = new Set();
const chk = (sk, where) => {
  if (ids.has(sk.id)) errs.push(`dup id ${sk.id}`); ids.add(sk.id);
  if (!sk.name) errs.push(`${where} no name`);
  if (!Array.isArray(sk.eff) || !sk.eff.length) errs.push(`${sk.id} no effects`);
  for (const e of sk.eff || []) {
    if (!EFF.has(e.t)) errs.push(`${sk.id} bad eff ${e.t}`);
    const sh = e.shape || (e.t === 'dash' ? e.hit : null);
    if (sh && !SHAPES.has(sh.s)) errs.push(`${sk.id} bad shape ${sh.s}`);
    if (e.m != null && !(e.m >= 0 && e.m < 100)) errs.push(`${sk.id} bad m ${e.m}`);
  }
};
for (const wt of WEAPON_TYPES) {
  for (const s of wt.combo.concat(wt.alt || [])) if (!SHAPES.has(s.s) || !s.t || s.t.length !== 3) errs.push(`type ${wt.id} bad combo`);
  const d = JSON.parse(fs.readFileSync(`shared/gen/types/${wt.id}.json`));
  if (d.skills.length !== 100 || d.weapons.length !== 100) errs.push(`type ${wt.id} count`);
  d.skills.forEach(s => chk(s, `wt${wt.id}`));
  d.weapons.forEach(w => { if (!(w.atk > 0) || !w.rar) errs.push(`weapon ${w.id}`); chk(w.skill, w.id); });
  if (new Set(d.weapons.map(w => w.name)).size !== 100) errs.push(`type ${wt.id} duplicate weapon names`);
}
const jobs = JSON.parse(fs.readFileSync('shared/gen/jobs.json'));
const jids = new Set(jobs.map(j => j.id)); const base = jobs.filter(j => !j.event), evj = jobs.filter(j => j.event);
if (base.length !== 1000 || jids.size !== jobs.length) errs.push('jobs count (1,000 base jobs + unique event jobs)');
if (new Set(jobs.map(j => j.name)).size !== jobs.length) errs.push('job names not unique');
if (evj.length < 20 || evj.some(j => !j.id.startsWith('ev_'))) errs.push('event jobs');
for (const j of jobs) { chk(j.active, j.id); if (j.unlock.job && !jids.has(j.unlock.job)) errs.push(`${j.id} unlock ref`); }
// distinctness: no two jobs with identical passive+active
const sig = new Set(jobs.map(j => JSON.stringify([j.passive.mods, j.active.eff, j.stats])));
if (sig.size !== jobs.length) errs.push(`jobs not mechanically distinct: ${sig.size}`);
JSON.parse(fs.readFileSync('shared/gen/levelSkills.json')).forEach(s => chk(s, 'level'));
const c = JSON.parse(fs.readFileSync('shared/gen/content.json'));
const fam = new Set(c.families.map(f => f[0])), boss = new Set(c.bosses.map(b => b[0]));
for (const d of c.dungeons) { if (d.bands.length !== 10) errs.push(`${d.id} bands`); for (const b of d.bands) { if (!boss.has(b.boss)) errs.push(`${d.id} boss ${b.boss}`); for (const f of b.fam) if (!fam.has(f) && !boss.has(f)) errs.push(`${d.id} fam ${f}`); } }
if (errs.length) { console.error(errs.slice(0, 40).join('\n'), `\n${errs.length} errors`); process.exit(1); }
console.log('data OK:', ids.size, 'skills validated');
