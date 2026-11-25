// Artifact drops, crafting, equipping and runtime triggers (server authoritative).
import { ART_CONDS, ART_EFFECTS, DUNGEON_ART, matPower, artifactStats, artName } from '../../shared/data/artifacts.js';
import { DATA } from '../data.js';
import { uid } from './progress.js';

export const ART_SLOTS = ['art1', 'art2'];
// 10% per player from HARD/HELL/ABYSS dungeon bosses; condition or effect material (50/50)
export function rollArtifactMat(z, ch) {
  if (!['HARD', 'HELL', 'ABYSS'].includes(z.diff) || !z.dungeon || Math.random() >= 0.1) return null;
  const D = DUNGEON_ART[z.dungeon.id] || DUNGEON_ART.d01; const isCond = Math.random() < 0.5; const list = isCond ? D.cond : D.eff; const k = list[Math.floor(Math.random() * list.length)];
  const it = { uid: uid(), kind: 'amat', ref: isCond ? 'acond' : 'aeff', key: k, dg: z.dungeon.id, floor: z.floor, diff: z.diff, pow: matPower(z.floor, z.diff), n: 1 };
  ch.inventory.push(it); return it;
}
export const matName = it => it.ref === 'acond' ? `条件の核「${ART_CONDS[it.key].name}」` : `効果の核「${ART_EFFECTS[it.key].name}」`;
export function craftArtifact(ch, condUid, effUid) {
  const c = ch.inventory.find(i => i.uid === condUid && i.kind === 'amat' && i.ref === 'acond'), e = ch.inventory.find(i => i.uid === effUid && i.kind === 'amat' && i.ref === 'aeff');
  if (!c || !e) return { error: '条件の核と効果の核を1つずつ選んでください' };
  const cost = Math.round(2000 * (c.pow + e.pow)); if (ch.gold < cost) return { error: `${cost}G必要です` };
  ch.gold -= cost; ch.inventory = ch.inventory.filter(i => i !== c && i !== e);
  const st = artifactStats(c.key, e.key, c.pow, e.pow);
  const art = { uid: uid(), kind: 'artifact', ref: 'artifact', name: artName(c.key, e.key), cond: c.key, eff: e.key, ...st, from: [`${DATA.dungeons.get(c.dg)?.name} ${c.floor}F ${c.diff}`, `${DATA.dungeons.get(e.dg)?.name} ${e.floor}F ${e.diff}`] };
  ch.inventory.push(art); return { ok: true, art, cost };
}
// runtime: called from combat/actor hooks with the trigger kind; applies (stacking) timed buffs
export function artTrigger(a, kind) {
  const ch = a.ch; if (!ch || a.dead) return; const now = a.zone?.now || 0;
  for (const slot of ART_SLOTS) { const it = ch.equip?.[slot] && ch.inventory.find(i => i.uid === ch.equip[slot]); if (!it || it.cond !== kind) continue;
    const key = 'art_' + it.uid; a.artStacks ||= {}; const prev = a.artStacks[key]; const stacks = prev && prev.until > now ? Math.min(it.stack, prev.n + 1) : 1; a.artStacks[key] = { n: stacks, until: now + it.dur * 1000 };
    if (kind === 'lowhp' && prev && prev.until > now) { a.artStacks[key].n = 1; } // continuous: just refresh
    a.addBuff({ [ART_EFFECTS[it.eff].key]: it.val * a.artStacks[key].n }, it.dur * 1000, key);
    if (!prev || prev.until <= now || stacks > (prev?.n || 0)) a.zone?.fx({ t: 'artfx', id: a.id, v: it.name, n: stacks }); }
}
export function describeArtifact(it) { const E = ART_EFFECTS[it.eff]; return `${ART_CONDS[it.cond].name}：${E.name}+${Math.round(it.val * 1000) / 10}%（${it.dur}秒${it.stack > 1 ? `・最大${it.stack}重` : ''}）`; }
