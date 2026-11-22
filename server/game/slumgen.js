// Slum layer generator. Fixed skeleton (region seed) + variable sections (run seed), with reachability validation/repair.
import { rng, hash32 } from '../../shared/util.js';
import { T, BLOCKING, Grid } from './maps.js';
import { REGIONS, LAYERS, EXITS, LAYER_CONTAINERS } from '../../shared/data/slum.js';

export const SW = 72, SH = 56;
const FLOOR = [T.STONEF, T.RUBBLE, T.PLANK, T.COBBLE];
// fixed points shared by all layers of a region (connectors use identical coordinates on both layers)
export function skeleton(regionId) {
  const r = rng(hash32('slum-skel:' + regionId));
  const pick = (x0, x1, y0, y1) => [x0 + Math.floor(r() * (x1 - x0)), y0 + Math.floor(r() * (y1 - y0))];
  const conn = [[], [], []]; // conn[i] connects layer i <-> i+1
  for (let i = 0; i < 3; i++) for (let k = 0; k < (i === 2 ? 2 : 3); k++) conn[i].push(pick(8 + k * 20, 20 + k * 20, 8, SH - 8));
  const exits = {}; for (const [k, e] of Object.entries(EXITS)) exits[k] = e.layer === 3 ? pick(SW - 20, SW - 6, 6, 16) : pick(6, SW - 6, 6, SH - 6);
  return { entry: [SW >> 1, SH - 5], hideout: pick(10, SW - 10, 10, SH - 14), conn, exits, quadrants: [0, 1, 2, 3].map(q => q), merchants: [pick(20, 50, 18, 38), pick(10, 60, 10, 46)] };
}
// territory quadrant of a tile
export const quadOf = (x, y) => (x < SW / 2 ? 0 : 1) + (y < SH / 2 ? 0 : 2);

export function genSlumLayer(regionId, layer, seed, events = []) {
  const R = REGIONS[regionId]; const L = LAYERS[layer]; const sk = skeleton(regionId);
  const fixed = rng(hash32(`slum-fixed:${regionId}:${layer}`)); const vr = rng(hash32(`slum-run:${regionId}:${layer}:${seed}`));
  const floor = FLOOR[layer];
  const base = layer === 0 ? T.WALL : layer === 1 ? T.WALL : T.VOID;
  const g = new Grid(SW, SH, base);
  const props = [], objects = [], lights = [], spots = [], closed = [];
  const carve = (x, y, w, h, t = floor) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (i > 0 && j > 0 && i < SW - 1 && j < SH - 1) g.set(i, j, t); };
  const corridor = (x0, y0, x1, y1, w, t) => { for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) carve(x, y0 - (w >> 1), 1, w, t); for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) carve(x1 - (w >> 1), y, w, 1, t); };
  // ── fixed skeleton per layer type
  if (layer === 1) { // ground: block city of slum walls with alley grid
    const xs = [4], ys = [4]; while (xs.at(-1) < SW - 8) xs.push(xs.at(-1) + 7 + Math.floor(fixed() * 5)); while (ys.at(-1) < SH - 8) ys.push(ys.at(-1) + 6 + Math.floor(fixed() * 4));
    for (const x of xs) carve(x, 2, 2, SH - 4); for (const y of ys) carve(2, y, SW - 4, 2);
    for (let k = 0; k < 6; k++) { const x = xs[Math.floor(fixed() * xs.length)], y = ys[Math.floor(fixed() * ys.length)]; carve(x - 2, y - 2, 6, 5, T.COBBLE); spots.push({ kind: 'market', x, y }); } // fixed small squares
    g.xs = xs; g.ys = ys;
  } else if (layer === 0) { // underground: sewer trunk + tunnels + ruin chambers
    const cy = SH >> 1; carve(2, cy - 2, SW - 4, 5, floor); carve(2, cy, SW - 4, 1, T.SHALLOW);
    for (let k = 0; k < 7; k++) { const x = 6 + Math.floor(fixed() * (SW - 12)); corridor(x, cy, x + Math.floor(fixed() * 10) - 5, 4 + Math.floor(fixed() * (SH - 8)), 2, floor); }
    for (let k = 0; k < 4; k++) { const x = 6 + Math.floor(fixed() * (SW - 18)), y = 4 + Math.floor(fixed() * (SH - 14)); carve(x, y, 9, 7, T.STONEF); spots.push({ kind: 'ruin', x: x + 4, y: y + 3 }); }
  } else if (layer === 2) { // mid: building floors over a void, linked by walkways
    for (let k = 0; k < 16; k++) { const w = 6 + Math.floor(fixed() * 6), h = 4 + Math.floor(fixed() * 4), x = 3 + Math.floor(fixed() * (SW - w - 6)), y = 3 + Math.floor(fixed() * (SH - h - 6)); carve(x, y, w, h); spots.push({ kind: 'floor', x: x + (w >> 1), y: y + (h >> 1) }); }
    for (let k = 1; k < spots.length; k++) { const a = spots[k - 1], b = spots[k]; corridor(a.x, a.y, b.x, b.y, 1, T.BRIDGE); }
  } else { // roof: rooftops separated by gaps
    for (let k = 0; k < 14; k++) { const w = 7 + Math.floor(fixed() * 7), h = 5 + Math.floor(fixed() * 5), x = 3 + Math.floor(fixed() * (SW - w - 6)), y = 3 + Math.floor(fixed() * (SH - h - 6)); carve(x, y, w, h); spots.push({ kind: 'roof', x: x + (w >> 1), y: y + (h >> 1) }); }
    for (let k = 1; k < spots.length; k++) if (fixed() < 0.75) { const a = spots[k - 1], b = spots[k]; corridor(a.x, a.y, b.x, b.y, 1, T.BRIDGE); }
  }
  // fixed points: entry (ground), hideout door (ground), connectors, exits of this layer
  const pad = (x, y, r = 1, t = floor) => carve(x - r, y - r, r * 2 + 1, r * 2 + 1, t);
  if (layer === 1) { pad(sk.entry[0], sk.entry[1], 2, T.COBBLE); pad(sk.hideout[0], sk.hideout[1] + 1, 1); }
  const conns = [];
  if (layer > 0) for (const [x, y] of sk.conn[layer - 1]) { pad(x, y); conns.push({ x, y, dir: -1 }); }
  if (layer < 3) for (const [x, y] of sk.conn[layer]) { pad(x, y); conns.push({ x, y, dir: 1 }); }
  // ── variable sections (run seed)
  const extra = events.includes('tunnel') ? 2 : 1;
  if (layer < 3) for (let k = 0; k < extra; k++) { const x = 6 + Math.floor(vr() * (SW - 12)), y = 6 + Math.floor(vr() * (SH - 12)); pad(x, y); conns.push({ x, y, dir: 1, temp: true }); } // 仮設階段 (other side carved by the layer above)
  if (layer > 0) for (let k = 0; k < (events.includes('tunnel') ? 2 : 1); k++) { const pr = rng(hash32(`slum-run:${regionId}:${layer - 1}:${seed}`)); for (let s = 0; s <= k; s++) { const x = 6 + Math.floor(pr() * (SW - 12)), y = 6 + Math.floor(pr() * (SH - 12)); if (s === k) { pad(x, y); conns.push({ x, y, dir: -1, temp: true }); } } }
  if (layer === 1) { // open some building interiors as hidden rooms, block some alley segments
    for (let k = 0; k < 8; k++) { const x = 6 + Math.floor(vr() * (SW - 14)), y = 6 + Math.floor(vr() * (SH - 12)); if (g.get(x, y) !== T.WALL) continue; carve(x, y, 4, 3, T.PLANK); g.set(x + 1, y + 3, T.PLANK); props.push({ k: 'shutter', x: x + 1, y: y + 3, w: 1, h: 1, open: 1 }); spots.push({ kind: 'room', x: x + 1, y: y + 1 }); }
  }
  const nBlock = 6 + (events.includes('sealed') ? 8 : 0);
  for (let k = 0; k < nBlock; k++) { const x = 3 + Math.floor(vr() * (SW - 6)), y = 3 + Math.floor(vr() * (SH - 6)); const v = g.get(x, y); if (v === floor || v === T.BRIDGE || v === T.PLANK) { g.set(x, y, T.BLOCK); closed.push([x, y]); props.push({ k: v === T.BRIDGE ? 'gap' : layer === 1 && vr() < 0.5 ? 'shutter' : 'collapse', x, y, w: 1, h: 1 }); } }
  // ── validation & repair: every important point must be reachable from the layer's anchor
  const anchor = layer === 1 ? sk.entry : (conns.find(c => !c.temp) || conns[0]);
  const ax = anchor.x ?? anchor[0], ay = anchor.y ?? anchor[1];
  const walk = v => !BLOCKING.has(v);
  const reach = () => { const seen = new Uint8Array(SW * SH); const q = [ay * SW + ax]; seen[q[0]] = 1; while (q.length) { const c = q.pop(); const x = c % SW, y = (c / SW) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = (y + dy) * SW + x + dx; if (!seen[n] && walk(g.t[n])) { seen[n] = 1; q.push(n); } } } return seen; };
  const layerExits = Object.entries(sk.exits).filter(([k]) => EXITS[k].layer === layer);
  for (const [, [x, y]] of layerExits) pad(x, y);
  const must = [...conns.map(c => [c.x, c.y]), ...layerExits.map(([, p]) => p)]; if (layer === 1) must.push([sk.hideout[0], sk.hideout[1] + 1]);
  let seen = reach(); let repaired = 0;
  for (const [tx, ty] of must) { if (seen[ty * SW + tx]) continue; let x = tx, y = ty; for (let k = 0; k < 300 && !seen[y * SW + x]; k++) { if (!walk(g.get(x, y))) { g.set(x, y, layer >= 2 ? T.BRIDGE : floor); repaired++; } if (Math.abs(ay - y) > Math.abs(ax - x)) y += Math.sign(ay - y); else x += Math.sign(ax - x); } seen = reach(); }
  const reachable = must.every(([x, y]) => seen[y * SW + x]);
  // ── containers (variable) on reachable floor cells, density by layer
  const cells = []; for (let y = 2; y < SH - 2; y++) for (let x = 2; x < SW - 2; x++) if (seen[y * SW + x] && g.get(x, y) !== T.BRIDGE && g.get(x, y) !== T.SHALLOW) cells.push([x, y]);
  const nCont = 16 + R.tier * 2 + (events.includes('anomaly') && layer === 0 ? 5 : 0);
  const kinds = LAYER_CONTAINERS[layer];
  for (let k = 0; k < nCont && cells.length; k++) { const [x, y] = cells[Math.floor(vr() * cells.length)]; if (Math.abs(x - ax) + Math.abs(y - ay) < 6) continue; const ck = events.includes('anomaly') && layer === 0 && k < 5 ? 'relic' : kinds[Math.floor(vr() * kinds.length)]; g.set(x, y, T.BLOCK); props.push({ k: 'cont', ck, x, y, w: 1, h: 1 }); objects.push({ k: 'cont', ck, id: `c${layer}_${x}_${y}`, x, y: y + 1, danger: dangerAt(R.tier, layer, x, y, ax, ay) }); }
  if (events.includes('relicfind') && layer === 0) { const s = spots.find(p => p.kind === 'ruin') || { x: SW >> 1, y: 8 }; const x = s.x, y = s.y; g.set(x, y, T.BLOCK); props.push({ k: 'cont', ck: 'relic', x, y, w: 1, h: 1, glow: 1 }); objects.push({ k: 'cont', ck: 'relic', id: `relicfind`, x, y: y + 1, danger: 5, bonus: 2 }); }
  for (const c of conns) { props.push({ k: c.dir > 0 ? 'ladderUp' : 'ladderDown', x: c.x, y: c.y, w: 1, h: 1, temp: c.temp ? 1 : 0 }); objects.push({ k: 'ladder', dir: c.dir, x: c.x, y: c.y, temp: !!c.temp }); lights.push([c.x, c.y]); }
  for (const [k, [x, y]] of layerExits) { objects.push({ k: 'exit', type: k, x, y }); }
  if (layer === 1) { props.push({ k: 'hideoutdoor', x: sk.hideout[0], y: sk.hideout[1], w: 1, h: 1 }); objects.push({ k: 'hideout', x: sk.hideout[0], y: sk.hideout[1] + 1 }); props.push({ k: 'entrysign', x: sk.entry[0], y: sk.entry[1] - 2, w: 1, h: 1 }); objects.push({ k: 'entry', x: sk.entry[0], y: sk.entry[1] }); }
  // ── decor: wires, pipes, laundry, lanterns, neon, puddles (lighting & atmosphere)
  for (let k = 0; k < 90; k++) { const x = 2 + Math.floor(fixed() * (SW - 4)), y = 2 + Math.floor(fixed() * (SH - 4)); const v = g.get(x, y); if (v === T.WALL && g.get(x, y + 1) !== T.WALL && layer >= 1) { const d = ['wires', 'sign', 'laundry', 'lantern', 'ac', 'neonsign'][Math.floor(fixed() * 6)]; props.push({ k: 'sdecor', d, x, y, w: 1, h: 1, v: Math.floor(fixed() * 4) }); if (d === 'lantern' || d === 'neonsign') lights.push([x, y + 1]); } else if ((v === floor || v === T.COBBLE) && fixed() < 0.25) props.push({ k: 'sdecor', d: layer === 0 ? 'drip' : 'puddle', x, y, w: 1, h: 1 }); }
  // npc spots (variable)
  const npcSpots = []; for (let k = 0; k < 14 + R.tier * 2; k++) { const [x, y] = cells[Math.floor(vr() * cells.length)] || [ax, ay]; if (Math.abs(x - ax) + Math.abs(y - ay) > 8) npcSpots.push([x, y]); }
  return { w: SW, h: SH, tiles: g.t, pal: L.pal, kind: 'slum', layer, start: [ax, ay], props, objects, lights, spots, npcSpots, conns, exits: [], gates: [], spawns: [], npcs: [], doors: [], reachable, repaired, closed: closed.length, name: `${R.name}・${L.name}` };
}
export function dangerAt(tier, layer, x, y, ax, ay) { const d = Math.hypot(x - ax, y - ay) / Math.hypot(SW, SH); return Math.max(1, Math.min(5, Math.round(tier + LAYERS[layer].danger * 0.6 + d * 2 - 0.6))); }
