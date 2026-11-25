// City generation from shared/data/cities.js: districts (Voronoi), avenues/alleys/bridges/stairs, unique buildings
// (each with an enterable interior), landmarks, decoration props, fast-travel stops and resident homes.
import { rng, hash32 } from '../../shared/util.js';
import { CITIES } from '../../shared/data/cities.js';
import { T, BLOCKING, Grid } from './maps.js';

export const SIZES = { S: [5, 4], M: [7, 5], L: [9, 6], XL: [13, 7] };
const DFLOOR = { rich: T.MARBLE, commerce: T.COBBLE, common: T.PATH, slum: T.RUBBLE, special: T.COBBLE };
const LANDMARK_SIZE = { windmill: [6, 7], lighthouse: [5, 9], castle: [22, 11], forge: [14, 9], magetower: [8, 13], clocktower: [9, 11], temple: [14, 11], icepalace: [18, 11], pagoda: [8, 13], worldtree: [12, 13], pyramid: [14, 10], volcano: [16, 11] };
// palettes per city & district for building walls/roofs
const STYLE = {
  haven: { rich: ['#d8c4a0', ['#a03a2a', '#2a5aa0']], commerce: ['#d8c4a0', ['#a03a2a', '#2a5aa0', '#3a7a3a']], common: ['#c8b090', ['#8a4a2a', '#5a6a3a']], slum: ['#9a8a70', ['#5a4a3a']] },
  marina: { rich: ['#f0ece4', ['#2a6ab0', '#3a8ac0']], commerce: ['#ece4d4', ['#2a5aa0', '#c07a3a']], common: ['#a8583a', ['#6a3a2a', '#4a4a5a']], slum: ['#8a7a6a', ['#4a3a3a', '#3a4a4a']] },
  celestia: { rich: ['#f4f0f8', ['#c0a040', '#3a4a9a']], commerce: ['#e8e4dc', ['#4a5aa0', '#a0a8c0']], common: ['#d0b894', ['#8a3a2a', '#3a5a3a']], slum: ['#7a6a5a', ['#4a3a30']] },
  vulcan: { rich: ['#d8d4cc', ['#6a7a8a', '#9a6a3a']], commerce: ['#4a3a34', ['#2a2a30', '#5a3a2a']], common: ['#6a4a3a', ['#3a2a24', '#4a4a4a']], slum: ['#4a4038', ['#2a2420']] },
  arcanum: { rich: ['#c8d4f0', ['#3a4ab0', '#6a3ab0']], commerce: ['#b8c4e0', ['#2a6a9a', '#5a3a9a']], common: ['#a8a0c0', ['#4a3a7a', '#2a4a6a']], slum: ['#6a6478', ['#3a3048']] },
  lumina: { rich: ['#2a2438', ['#c0902a', '#a02a6a']], commerce: ['#e0d8c8', ['#8a2a3a', '#2a2a40']], common: ['#a07858', ['#5a3a2a', '#3a4a5a']], slum: ['#5a4a40', ['#2a2420', '#3a3028']] },
};
// regional architecture for the six-continent cities (walls, roof palettes per district type)
const CONT_STYLE = {
  eldia: STYLE.celestia, nordia: { rich: ['#c8ccd4', ['#2a3a6a', '#e8eef4']], commerce: ['#9aa0a8', ['#3a4a6a', '#5a3a2a']], common: ['#7a6a5a', ['#2a2a3a', '#4a3a30']], slum: ['#5a524a', ['#2a2420']], special: ['#a8b0bc', ['#2a3a6a']] },
  shengar: { rich: ['#f0e8dc', ['#b02a20', '#2a2a2a']], commerce: ['#e8dcc8', ['#2a2a2a', '#8a2a20']], common: ['#c8b89a', ['#3a3a3a', '#5a4a3a']], slum: ['#8a7a64', ['#3a3028']], special: ['#f0e8dc', ['#b02a20']] },
  saharia: { rich: ['#f0e4c8', ['#2a6ad0', '#e8e0d0']], commerce: ['#e0c89a', ['#c87a3a', '#2a8a9a']], common: ['#d0b080', ['#a86a3a', '#8a6a4a']], slum: ['#a8906a', ['#6a5a40']], special: ['#f0e4c8', ['#2a6ad0']] },
  valgran: { rich: ['#5a4a48', ['#a02a20', '#2a2a30']], commerce: ['#3a3234', ['#6a2a20', '#2a2a30']], common: ['#4a3e38', ['#3a2a24', '#5a3a2a']], slum: ['#3a3430', ['#2a2420']], special: ['#5a4a48', ['#a02a20']] },
  asteria: { rich: ['#f8f8f4', ['#2a8ac0', '#3ab0b0']], commerce: ['#f0f0e8', ['#2a6ab0', '#e0a03a']], common: ['#e8e4d8', ['#3a7aa0', '#4a6a8a']], slum: ['#b0a898', ['#4a5a6a']], special: ['#f8f8f4', ['#2a8ac0']] },
};
const CONT_DECOR = { nordia: ['well', 'banner', 'barrel'], shengar: ['lamp', 'flowerbed', 'tree', 'statue'], saharia: ['stall', 'stall', 'barrel', 'well'], valgran: ['steamvent', 'pipe', 'fire', 'pipe'], asteria: ['net', 'crate', 'barrel', 'flowerbed'], eldia: ['banner', 'flowerbed'] };
const DECOR = { rich: ['lamp', 'lamp', 'statue', 'flowerbed', 'tree', 'bench'], commerce: ['lamp', 'stall', 'stall', 'barrel', 'bench', 'signpost'], common: ['lamp', 'barrel', 'crate', 'tree', 'bench', 'well'], slum: ['trash', 'crate', 'barrel', 'brokenlamp', 'fire'], special: ['lamp'] };
const CITY_DECOR = { vulcan: ['pipe', 'pipe', 'steamvent'], arcanum: ['crystal', 'floatlight'], lumina: ['neon', 'neon'], marina: ['crate', 'net'], celestia: ['banner', 'statue'], haven: ['hay'] };

export function genCity(id, links) {
  const def = CITIES[id]; const r = rng(hash32('city:' + id)); const [W, H] = def.size;
  const g = new Grid(W, H, T.GRASS);
  g.rect(0, 0, W, 2, T.WALL); g.rect(0, H - 2, W, 2, T.WALL); g.rect(0, 0, 2, H, T.WALL); g.rect(W - 2, 0, 2, H, T.WALL);
  const props = [], lights = [], doors = [], stops = [], plazas = [], homes = [], lore = [];
  const dist = def.districts.map(d => ({ ...d, cx: Math.round(d.at[0] * W), cy: Math.round(d.at[1] * H) }));
  // district map (Voronoi)
  const dmap = new Int8Array(W * H);
  for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) { let b = 0, bd = 1e9; dist.forEach((d, i) => { const dd = (x - d.cx) ** 2 * 1 + (y - d.cy) ** 2 * 1.3; if (dd < bd) { bd = dd; b = i; } }); dmap[y * W + x] = b; const t = dist[b].type; g.set(x, y, t === 'common' && r() < 0.18 ? T.GRASS : DFLOOR[t] ?? T.PATH); }
  const dAt = (x, y) => dist[dmap[y * W + x]];
  // water features
  if (def.sea === 'south') { g.rect(2, H - 14, W - 4, 12, T.WATER); for (let k = 0; k < 4; k++) { const px = 12 + k * Math.floor((W - 24) / 4); g.rect(px, H - 14, 3, 8, T.BRIDGE); } g.rect(2, H - 15, W - 4, 1, T.STONEF); }
  if (def.lake) { const cx = Math.round(W * 0.5), cy = Math.round(H * 0.4); for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) { const e = ((x - cx) / 30) ** 2 + ((y - cy) / 20) ** 2; if (e < 1 && e > 0.55) g.set(x, y, T.WATER); } for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) g.line(cx + dx * 18, cy + dy * 12, cx + dx * 31, cy + dy * 21, T.BRIDGE, 3); }
  if (def.river) { const ry = Math.round(H * 0.45); for (let x = 2; x < W - 2; x++) { const yy = ry + Math.round(Math.sin(x / 9) * 2); g.rect(x, yy - 2, 1, 5, T.WATER); } for (const bx of [Math.round(W * 0.3), Math.round(W * 0.68)]) g.rect(bx - 1, ry - 5, 4, 11, T.BRIDGE); }
  // avenues between district centres (3 wide), stairs where a rich district meets others
  const road = (x0, y0, x1, y1, wdt, tile) => { const paint = (x, y) => { for (let j = -(wdt >> 1); j <= wdt >> 1; j++) for (let i = -(wdt >> 1); i <= wdt >> 1; i++) { const v = g.get(x + i, y + j); if (v === T.WATER) g.set(x + i, y + j, T.BRIDGE); else if (v !== T.WALL && v !== T.BRIDGE) g.set(x + i, y + j, tile); } }; for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) paint(x, y0); for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) paint(x1, y); };
  const order = dist.map((d, i) => i);
  for (let i = 1; i < order.length; i++) { const a = dist[order[i - 1]], b = dist[order[i]]; road(a.cx, a.cy, b.cx, b.cy, 3, T.COBBLE); }
  if (dist.length > 2) road(dist[0].cx, dist[0].cy, dist[dist.length - 1].cx, dist[dist.length - 1].cy, 3, T.COBBLE);
  // city gates on the sides that link to fields
  const exits = [];
  for (const [dir, to] of Object.entries(links || {})) {
    const pos = { east: [W - 2, Math.round(H * 0.5)], west: [1, Math.round(H * 0.5)], north: [Math.round(W * 0.5), 1], south: [Math.round(W * 0.5), H - 2] }[dir];
    const near = dist.reduce((b, d) => (Math.hypot(d.cx - pos[0], d.cy - pos[1]) < Math.hypot(b.cx - pos[0], b.cy - pos[1]) ? d : b), dist[0]);
    road(pos[0], pos[1], near.cx, near.cy, 3, T.COBBLE);
    for (let k = -2; k <= 2; k++) g.set(dir === 'east' || dir === 'west' ? pos[0] : pos[0] + k, dir === 'east' || dir === 'west' ? pos[1] + k : pos[1], T.EXIT);
    if (dir === 'east' || dir === 'west') { g.set(pos[0] + (dir === 'east' ? 1 : -1), pos[1], T.WALL); }
    exits.push({ dir, to, x: pos[0], y: pos[1] });
  }
  // plazas + fast-travel stop + decor per district
  for (const d of dist) {
    const rad = d.type === 'slum' ? 2 : 4; for (let y = -rad; y <= rad; y++) for (let x = -rad; x <= rad; x++) if (x * x + y * y <= rad * rad && g.get(d.cx + x, d.cy + y) !== T.WATER && g.get(d.cx + x, d.cy + y) !== T.WALL) g.set(d.cx + x, d.cy + y, d.type === 'rich' ? T.MARBLE : d.type === 'slum' ? T.RUBBLE : T.COBBLE);
    plazas.push({ district: d.id, name: d.name, x: d.cx, y: d.cy, type: d.type });
    if (d.type === 'commerce' && !def.lake) { g.disc(d.cx, d.cy, 1, T.SHALLOW); props.push({ k: 'fountain', x: d.cx - 1, y: d.cy - 1, w: 3, h: 3 }); lights.push([d.cx, d.cy]); }
    if (dist.length > 2) { const sx = d.cx + 3, sy = d.cy - 3; if (!BLOCKING.has(g.get(sx, sy))) { stops.push({ district: d.id, name: d.name, x: sx, y: sy }); props.push({ k: 'stop', x: sx, y: sy, w: 1, h: 1, label: d.type === 'slum' ? '乗合荷車' : def.lake ? 'ゴンドラ乗り場' : '路面馬車' }); } }
  }
  // stairs at transitions between rich & non-rich roads (visual elevation)
  for (let y = 3; y < H - 3; y++) for (let x = 3; x < W - 3; x++) { const v = g.get(x, y); if (v !== T.COBBLE) continue; const a = dAt(x, y), b = dAt(x, y - 1); if (a !== b && (a.type === 'rich' || b.type === 'rich')) g.set(x, y, T.STEPS); }
  const occ = new Uint8Array(W * H); const mark = (x, y, w, h) => { for (let j = y - 1; j < y + h + 1; j++) for (let i = x - 1; i < x + w + 1; i++) if (i >= 0 && j >= 0 && i < W && j < H) occ[j * W + i] = 1; };
  const free = (x, y, w, h, di) => { if (x < 3 || y < 3 || x + w > W - 3 || y + h + 2 > H - 3) return false; for (let j = y; j < y + h + 1; j++) for (let i = x; i < x + w; i++) { const v = g.get(i, j); if (occ[j * W + i] || v === T.WATER || v === T.BRIDGE || v === T.COBBLE || v === T.STEPS || v === T.EXIT || v === T.WALL || v === T.SHALLOW || (di != null && dmap[j * W + i] !== di)) return false; } return true; };
  const place = (w, h, d, di, tries = 500) => { for (let k = 0; k < tries; k++) { const rad = 3 + k / 8; const a = r() * Math.PI * 2; const x = Math.round(d.cx + Math.cos(a) * rad - w / 2), y = Math.round(d.cy + Math.sin(a) * rad * 0.8 - h / 2); if (free(x, y, w, h, k < 350 ? di : null)) return [x, y]; } return null; };
  for (let i = 0; i < plazas.length; i++) mark(plazas[i].x - 4, plazas[i].y - 4, 9, 9);
  const st = STYLE[id] || CONT_STYLE[def.continent] || STYLE.haven;
  const building = (b, d, di, x, y, w, h, extra = {}) => {
    g.rect(x, y, w, h, T.BLOCK); const dx = x + (w >> 1), dy = y + h; // door tile under the facade
    g.set(dx, dy - 1, T.DOOR); g.set(dx, dy, d.type === 'rich' ? T.MARBLE : d.type === 'slum' ? T.RUBBLE : T.PATH);
    // connect the door to the nearest road
    let cx = dx, cy = dy + 1; for (let k = 0; k < 40; k++) { const v = g.get(cx, cy); if (v === T.COBBLE || v === T.STEPS || v === T.BRIDGE || v === T.MARBLE && k > 2) break; if (v === T.WATER || v === T.WALL || occ[cy * W + cx] === 2) break; if (!BLOCKING.has(v)) g.set(cx, cy, d.type === 'rich' ? T.MARBLE : d.type === 'slum' ? T.RUBBLE : T.PATH); const near = dist[di]; if (Math.abs(near.cy - cy) > Math.abs(near.cx - cx)) cy += Math.sign(near.cy - cy) || 1; else cx += Math.sign(near.cx - cx) || 1; }
    mark(x, y, w, h); for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) occ[j * W + i] = 2;
    const sty = st[d.type] || st.common; const hh = hash32(b.id);
    const p = { k: 'bldg', id: b.id, name: b.name, x, y, w, h, door: [dx, dy - 1], t: b.t, dtype: d.type, wall: sty[0], roof: sty[1][hh % sty[1].length], var: hh % 997, city: id, ...extra };
    props.push(p); doors.push({ id: b.id, name: b.name, x: dx, y: dy - 1, hours: b.hours || null, t: b.t, svc: b.svc || null, guild: b.guild || null, district: d.id, dtype: d.type, home: extra.home || false });
    lights.push([x, y + h], [x + w - 1, y + h]);
    if (b.lore) lore.push({ bldg: b.id, key: b.lore });
    return p;
  };
  // landmark first
  if (def.landmark) {
    const di = dist.findIndex(d => d.id === def.landmark.district); const d = dist[Math.max(0, di)]; const [lw, lh] = LANDMARK_SIZE[def.landmark.k] || [8, 8];
    let pos = def.landmark.k === 'lighthouse' && def.sea ? [W - 14, H - 26] : place(lw, lh, d, di, 800);
    if (pos) { const [x, y] = pos; g.rect(x, y, lw, lh, T.BLOCK); mark(x, y, lw, lh); for (let j = y; j < y + lh; j++) for (let i = x; i < x + lw; i++) occ[j * W + i] = 2; props.push({ k: 'landmark', lk: def.landmark.k, name: def.landmark.name, x, y, w: lw, h: lh, city: id }); lights.push([x + (lw >> 1), y], [x, y + lh], [x + lw - 1, y + lh]); }
  }
  // named buildings
  dist.forEach((d, di) => { for (const b of d.buildings) { const [w, h] = SIZES[b.size] || SIZES.M; const pos = place(w, h, d, di, 1200); if (pos) building(b, d, di, pos[0], pos[1], w, h); } });
  // resident homes & vacant properties (every district)
  dist.forEach((d, di) => {
    const n = d.type === 'slum' ? 7 : d.type === 'rich' ? 3 : d.type === 'commerce' ? 3 : 6;
    for (let k = 0; k < n; k++) { const w = d.type === 'rich' ? 7 : d.type === 'slum' ? 4 : 5, h = d.type === 'rich' ? 5 : 4; const pos = place(w, h, d, di, 400); if (!pos) continue; const hid = `${id}_home_${d.id}_${k}`; const nm = d.type === 'rich' ? '邸宅' : d.type === 'slum' ? 'バラック' : d.type === 'commerce' ? '集合住宅' : '民家'; const p = building({ id: hid, name: nm, t: d.type === 'rich' ? 'mansion' : d.type === 'slum' ? 'shack' : 'house', size: 'S' }, d, di, pos[0], pos[1], w, h, { home: true }); homes.push({ id: hid, district: d.id, dtype: d.type }); p.home = true; }
  });
  // decorations
  const dec = [...(CITY_DECOR[id] || (STYLE[id] ? [] : CONT_DECOR[def.continent]) || [])];
  for (let k = 0; k < W * H / 45; k++) {
    const x = 3 + Math.floor(r() * (W - 6)), y = 3 + Math.floor(r() * (H - 6)); if (occ[y * W + x]) continue; const v = g.get(x, y); if (BLOCKING.has(v) || v === T.WATER || v === T.BRIDGE || v === T.EXIT || v === T.DOOR || v === T.COBBLE && r() < 0.7) continue;
    const d = dAt(x, y); const pool = DECOR[d.type].concat(r() < 0.35 ? dec : []); const kd = pool[Math.floor(r() * pool.length)];
    if (kd === 'tree') { g.set(x, y, T.TREE); continue; }
    const blocking = !['flowerbed', 'trash', 'net', 'hay', 'steamvent'].includes(kd);
    if (blocking) g.set(x, y, T.BLOCK); occ[y * W + x] = 1; props.push({ k: kd, x, y, w: kd === 'stall' ? 2 : 1, h: 1, v: Math.floor(r() * 4) }); if (kd === 'stall') { if (!BLOCKING.has(g.get(x + 1, y))) g.set(x + 1, y, T.BLOCK); }
    if (['lamp', 'neon', 'fire', 'crystal', 'floatlight', 'steamvent'].includes(kd)) lights.push([x, y]);
  }
  // slum: narrow alleys and broken lights; rich: lamp rows along avenues
  for (let y = 4; y < H - 4; y += 6) for (let x = 4; x < W - 4; x += 6) { if (g.get(x, y) === T.COBBLE && !occ[y * W + x] && dAt(x, y).type === 'rich') { props.push({ k: 'lamp', x, y: y - 2, w: 1, h: 1 }); lights.push([x, y - 2]); } }
  const start = dist.find(d => d.type === 'commerce') || dist[0];
  // connectivity: every door front, gate and stop must be walkable from the start plaza; carve paths when not
  const reach = () => { const seen = new Uint8Array(W * H); const q = [start.cy * W + start.cx]; seen[q[0]] = 1; while (q.length) { const c = q.pop(); const x = c % W, y = (c / W) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = (y + dy) * W + x + dx; if (!seen[n] && !BLOCKING.has(g.t[n]) && g.t[n] !== T.WATER) { seen[n] = 1; q.push(n); } } } return seen; };
  let seen = reach();
  const targets = [...doors.map(d => [d.x, d.y + 1]), ...exits.map(e => [e.x + (e.dir === 'east' ? -2 : e.dir === 'west' ? 2 : 0), e.y + (e.dir === 'south' ? -2 : e.dir === 'north' ? 2 : 0)]), ...stops.map(s => [s.x, s.y + 1])];
  for (const [tx, ty] of targets) {
    if (seen[ty * W + tx]) continue; let x = tx, y = ty;
    for (let k = 0; k < 200 && !seen[y * W + x]; k++) { const v = g.get(x, y); if (v !== T.DOOR && v !== T.EXIT && (BLOCKING.has(v) || v === T.WATER) && occ[y * W + x] !== 2) g.set(x, y, v === T.WATER ? T.BRIDGE : T.PATH); else if (occ[y * W + x] !== 2 && !BLOCKING.has(v)) {} if (Math.abs(start.cy - y) > Math.abs(start.cx - x)) y += Math.sign(start.cy - y); else x += Math.sign(start.cx - x); if (occ[y * W + x] === 2) { y += 1; } }
    seen = reach();
  }
  const unreachable = targets.filter(([x, y]) => !seen[y * W + x]).length;
  return { unreachable, w: W, h: H, tiles: g.t, pal: def.pal, start: [start.cx, start.cy + 2], spawns: [], npcs: [], gates: [], exits, lights, props, doors, stops, plazas, homes, lore, grid: g, kind: 'town', name: def.name, city: id };
}

// ───────────────────────── interiors ─────────────────────────
// Each template: base size, floor, wall tint, prop recipe and NPC roles. Size scales with the building size class.
const TPL = {
  guildhall: { s: [22, 15], floor: T.PLANK, wall: '#6a4a2a', recipe: [['counter', 'top', 7], ['board', 'wallTop', 2], ['table', 'scatter', 5], ['banner', 'wallTop', 2], ['bookcase', 'wallLeft', 2], ['plant', 'corners', 2], ['chandelier', 'center', 1]], npc: ['receptionist', 'adventurer', 'adventurer', 'clerk'] },
  smithy: { s: [18, 13], floor: T.STONEF, wall: '#4a3a30', recipe: [['forge', 'topLeft', 1], ['anvil', 'near:forge', 2], ['counter', 'right', 4], ['weaponrack', 'wallTop', 3], ['crate', 'scatter', 4], ['barrel', 'scatter', 2], ['oresack', 'scatter', 2]], npc: ['smith', 'apprentice'] },
  shop: { s: [14, 10], floor: T.PLANK, wall: '#7a5a3a', recipe: [['counter', 'top', 5], ['shelf', 'wallLeft', 3], ['shelf', 'wallRight', 3], ['display', 'scatter', 2], ['plant', 'corners', 1]], npc: ['shopkeeper', 'customer'] },
  tavern: { s: [20, 14], floor: T.PLANK, wall: '#5a3a24', recipe: [['bar', 'top', 8], ['barrel', 'wallTop', 3], ['table', 'scatter', 6], ['fireplace', 'wallLeft', 1], ['stage', 'right', 1], ['chandelier', 'center', 1]], npc: ['barkeep', 'patron', 'patron', 'patron', 'bard'] },
  inn: { s: [18, 13], floor: T.CARPET, wall: '#6a4a3a', recipe: [['counter', 'top', 5], ['bed', 'wallRight', 3], ['table', 'scatter', 2], ['fireplace', 'wallLeft', 1], ['plant', 'corners', 2]], npc: ['innkeeper', 'traveler'] },
  bank: { s: [18, 12], floor: T.MARBLE, wall: '#8a8070', recipe: [['counter', 'top', 9], ['vault', 'topRight', 1], ['pillar', 'rows', 4], ['bench', 'scatter', 2], ['plant', 'corners', 2]], npc: ['banker', 'guard', 'customer'] },
  church: { s: [18, 18], floor: T.MARBLE, wall: '#a8a0b0', recipe: [['altar', 'top', 1], ['pew', 'rows', 8], ['candles', 'wallTop', 4], ['window', 'wallLeft', 3], ['window', 'wallRight', 3], ['pillar', 'sides', 4]], npc: ['priest', 'worshipper', 'worshipper'] },
  library: { s: [22, 16], floor: T.CARPET, wall: '#5a4a6a', recipe: [['bookcase', 'rows', 12], ['desk', 'scatter', 4], ['lectern', 'top', 1], ['globe', 'corners', 1], ['candles', 'wallTop', 2]], npc: ['librarian', 'scholar', 'scholar'] },
  casino: { s: [26, 17], floor: T.CARPET, wall: '#3a1a2a', recipe: [['slot', 'wallTop', 6], ['roulette', 'center', 2], ['cardtable', 'scatter', 4], ['bar', 'right', 5], ['chandelier', 'center', 2], ['pillar', 'sides', 4]], npc: ['dealer', 'gambler', 'gambler', 'gambler', 'guard'] },
  theater: { s: [24, 18], floor: T.CARPET, wall: '#5a1a2a', recipe: [['stage', 'top', 1], ['pew', 'rows', 10], ['chandelier', 'center', 2], ['curtain', 'wallTop', 2]], npc: ['performer', 'audience', 'audience', 'usher'] },
  hotel: { s: [22, 14], floor: T.MARBLE, wall: '#c0a880', recipe: [['counter', 'top', 6], ['sofa', 'scatter', 4], ['plant', 'corners', 4], ['chandelier', 'center', 2], ['pillar', 'sides', 4], ['piano', 'right', 1]], npc: ['concierge', 'guest', 'bellboy'] },
  mansion: { s: [20, 15], floor: T.CARPET, wall: '#8a6a5a', recipe: [['fireplace', 'wallTop', 1], ['sofa', 'scatter', 3], ['painting', 'wallTop', 3], ['statue', 'corners', 2], ['table', 'center', 1], ['chandelier', 'center', 1], ['bookcase', 'wallLeft', 2]], npc: ['butler', 'noble'] },
  lab: { s: [18, 13], floor: T.STONEF, wall: '#3a4a5a', recipe: [['alembic', 'wallTop', 4], ['desk', 'scatter', 3], ['crystal', 'corners', 3], ['bookcase', 'wallLeft', 2], ['circle', 'center', 1]], npc: ['researcher', 'assistant'] },
  academy: { s: [24, 17], floor: T.MARBLE, wall: '#4a4a8a', recipe: [['lectern', 'top', 1], ['desk', 'rows', 8], ['bookcase', 'wallLeft', 3], ['bookcase', 'wallRight', 3], ['circle', 'center', 1], ['floatlight', 'scatter', 3]], npc: ['professor', 'student', 'student', 'student'] },
  workshop: { s: [18, 13], floor: T.PLANK, wall: '#5a4a3a', recipe: [['workbench', 'wallTop', 4], ['gear', 'scatter', 3], ['crate', 'scatter', 3], ['counter', 'right', 3], ['pipe', 'wallLeft', 2]], npc: ['craftsman', 'apprentice'] },
  warehouse: { s: [22, 15], floor: T.STONEF, wall: '#5a5048', recipe: [['crate', 'rows', 16], ['barrel', 'scatter', 6], ['cart', 'scatter', 1]], npc: ['foreman', 'porter', 'porter'] },
  arena: { s: [24, 18], floor: T.FLOOR, wall: '#5a4a3a', recipe: [['fence', 'ring', 1], ['banner', 'wallTop', 3], ['weaponrack', 'wallLeft', 2]], npc: ['arenamaster', 'gladiator', 'spectator', 'spectator'] },
  clinic: { s: [14, 10], floor: T.STONEF, wall: '#b0b8c0', recipe: [['bed', 'wallRight', 3], ['counter', 'top', 3], ['shelf', 'wallLeft', 2], ['plant', 'corners', 1]], npc: ['doctor', 'patient'] },
  bathhouse: { s: [18, 13], floor: T.STONEF, wall: '#8aa0b0', recipe: [['bath', 'center', 1], ['counter', 'top', 3], ['bench', 'scatter', 3], ['plant', 'corners', 2]], npc: ['attendant', 'bather', 'bather'] },
  station: { s: [24, 13], floor: T.COBBLE, wall: '#6a6a70', recipe: [['counter', 'top', 6], ['bench', 'rows', 6], ['timetable', 'wallTop', 2], ['crate', 'scatter', 3], ['clock', 'wallTop', 1]], npc: ['stationmaster', 'traveler', 'traveler', 'porter'] },
  office: { s: [14, 10], floor: T.PLANK, wall: '#6a5a4a', recipe: [['counter', 'top', 4], ['desk', 'scatter', 2], ['bookcase', 'wallLeft', 2], ['plant', 'corners', 1], ['map', 'wallTop', 1]], npc: ['clerk', 'clerk'] },
  castlehall: { s: [28, 20], floor: T.CARPET, wall: '#9a8a7a', recipe: [['throne', 'top', 1], ['pillar', 'sides', 8], ['banner', 'wallTop', 4], ['chandelier', 'center', 2], ['statue', 'corners', 2], ['carpetrun', 'center', 1]], npc: ['king', 'guard', 'guard', 'noble', 'noble'] },
  museum: { s: [20, 14], floor: T.MARBLE, wall: '#a09888', recipe: [['statue', 'rows', 4], ['painting', 'wallTop', 4], ['display', 'scatter', 4], ['plant', 'corners', 2]], npc: ['curator', 'visitor', 'visitor'] },
  observatory: { s: [16, 14], floor: T.STONEF, wall: '#2a2a4a', recipe: [['telescope', 'center', 1], ['desk', 'scatter', 2], ['globe', 'corners', 2], ['bookcase', 'wallLeft', 2]], npc: ['astronomer'] },
  blackmarket: { s: [18, 13], floor: T.RUBBLE, wall: '#3a2a2a', recipe: [['stall', 'scatter', 5], ['crate', 'scatter', 5], ['fire', 'center', 1], ['curtain', 'wallTop', 2]], npc: ['fence', 'thug', 'shady'] },
  shack: { s: [10, 8], floor: T.RUBBLE, wall: '#5a4a3a', recipe: [['bed', 'wallRight', 1], ['crate', 'scatter', 2], ['table', 'center', 1], ['trash', 'scatter', 2]], npc: ['resident'] },
  house: { s: [12, 9], floor: T.PLANK, wall: '#8a6a4a', recipe: [['bed', 'wallRight', 1], ['table', 'center', 1], ['shelf', 'wallLeft', 1], ['fireplace', 'wallTop', 1], ['plant', 'corners', 1]], npc: ['resident'] },
};
const SCALE = { S: 0.8, M: 1, L: 1.15, XL: 1.35 };
// home tiers
export const HOME_TPL = [
  { s: [9, 7], floor: T.RUBBLE, wall: '#5a4a3a', slots: 3, display: 1, storage: 20, name: 'スラムの小部屋' }, { s: [12, 9], floor: T.PLANK, wall: '#8a6a4a', slots: 5, display: 2, storage: 40, name: '一般住宅' },
  { s: [14, 10], floor: T.PLANK, wall: '#a08a6a', slots: 7, display: 3, storage: 60, name: '商業区のマンション' }, { s: [16, 12], floor: T.CARPET, wall: '#c0b090', slots: 9, display: 4, storage: 90, name: '高級マンション' },
  { s: [20, 14], floor: T.CARPET, wall: '#8a6a5a', slots: 12, display: 6, storage: 130, name: '貴族街の邸宅' }, { s: [22, 15], floor: T.MARBLE, wall: '#e0d8c8', slots: 15, display: 8, storage: 200, name: '最上階ペントハウス' },
];
export function genInterior(key, b, cityId, homeTier = null) {
  const tpl = homeTier != null ? { ...HOME_TPL[homeTier], recipe: [['bed', 'wallRight', 1], ['chest', 'topLeft', 1], ['kitchen', 'wallTop', 1]], npc: [] } : TPL[b.t] || TPL.house;
  const sc = homeTier != null ? 1 : SCALE[b.size] || 1; const r = rng(hash32('in:' + key));
  const W = Math.max(10, Math.round(tpl.s[0] * sc)), H = Math.max(8, Math.round(tpl.s[1] * sc));
  const g = new Grid(W, H, tpl.floor); g.rect(0, 0, W, 2, T.IWALL); g.rect(0, 0, 1, H, T.IWALL); g.rect(W - 1, 0, 1, H, T.IWALL); g.rect(0, H - 1, W, 1, T.IWALL);
  const mx = W >> 1; g.set(mx, H - 1, T.MAT); g.set(mx - 1, H - 1, T.MAT); // exit mat in the bottom wall opening
  const props = [], npcs = [], spots = [], lights = [], objects = [];
  const used = new Uint8Array(W * H); const okAt = (x, y, w, h) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) { if (i < 1 || j < 2 || i >= W - 1 || j >= H - 1 || used[j * W + i] || g.get(i, j) !== tpl.floor) return false; if (Math.abs(i - mx) <= 1 && j >= H - 4) return false; } return true; };
  const put = (k, x, y, w = 1, h = 1, block = true, extra = {}) => { if (!okAt(x, y, w, h)) return false; for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) { used[j * W + i] = 1; if (block) g.set(i, j, T.BLOCK); } props.push({ k, x, y, w, h, v: Math.floor(r() * 4), ...extra }); return true; };
  for (const [k, where, n] of tpl.recipe) {
    const blk = !['carpetrun', 'circle', 'stage', 'curtain', 'painting', 'window', 'banner', 'board', 'map', 'timetable', 'clock', 'candles', 'chandelier', 'floatlight', 'trash'].includes(k);
    const wallDecor = ['painting', 'window', 'banner', 'board', 'map', 'timetable', 'clock', 'curtain', 'candles'].includes(k);
    if (wallDecor) { for (let i = 0; i < n; i++) { const x = where === 'wallLeft' ? 0 : where === 'wallRight' ? W - 1 : 2 + Math.floor((i + 0.5) * (W - 4) / n); const y = where === 'wallTop' ? 0 : 3 + Math.floor((i + 0.5) * (H - 6) / n); props.push({ k, x, y, w: where === 'wallTop' ? 2 : 1, h: where === 'wallTop' ? 2 : 1, wall: 1 }); if (k === 'candles') lights.push([x, y + 1]); if (k === 'board') objects.push({ k: 'board', x, y: y + 2 }); } continue; }
    const sz = { counter: [n, 1], bar: [n, 1], bed: [2, 1], table: [2, 2], forge: [3, 2], vault: [2, 2], altar: [3, 1], pew: [4, 1], bookcase: [2, 1], roulette: [2, 2], cardtable: [2, 2], stage: [6, 3], sofa: [2, 1], piano: [2, 1], throne: [2, 2], bath: [6, 4], telescope: [2, 2], circle: [3, 3], carpetrun: [2, H - 6], fence: [1, 1], cart: [2, 1], desk: [2, 1], workbench: [2, 1], kitchen: [3, 1], chest: [1, 1], display: [1, 1] }[k] || [1, 1];
    const [w, h] = sz;
    for (let i = 0; i < (where === 'top' || where === 'right' || where === 'center' && ['stage', 'circle', 'carpetrun', 'bath', 'telescope'].includes(k) ? 1 : n); i++) {
      let placed = false;
      for (let tries = 0; tries < 60 && !placed; tries++) {
        let x, y;
        switch (where) {
          case 'top': x = Math.max(1, mx - (w >> 1)); y = 3; break;
          case 'topLeft': x = 2 + tries % 3; y = 2; break; case 'topRight': x = W - 2 - w - tries % 3; y = 2; break;
          case 'right': x = W - 2 - w; y = 3 + tries; break; case 'center': x = mx - (w >> 1) + (tries % 5) - 2; y = (k === 'carpetrun' ? 3 : (H >> 1) - (h >> 1)) + Math.floor(tries / 5); break;
          case 'wallLeft': x = 1; y = 3 + Math.floor((i + 0.5) * (H - 6) / n) + (tries % 3); break; case 'wallRight': x = W - 1 - w; y = 3 + Math.floor((i + 0.5) * (H - 6) / n) + (tries % 3); break;
          case 'wallTop': x = 2 + Math.floor((i + 0.5) * (W - 4) / n) + (tries % 3) - 1; y = 2; break;
          case 'corners': { const c = [[1, 2], [W - 2, 2], [1, H - 2], [W - 2, H - 2]][(i + tries) % 4]; x = c[0]; y = c[1]; break; }
          case 'rows': { const cols = Math.max(1, Math.floor((W - 4) / (w + 2))); x = 2 + (i % cols) * (w + 2) + (tries % 2); y = 4 + Math.floor(i / cols) * 2 + Math.floor(tries / 2); break; }
          case 'sides': x = i % 2 ? W - 3 : 2; y = 4 + Math.floor(i / 2) * 3 + tries % 2; break;
          case 'ring': { // arena fence ring with a gap toward the exit
            const cx = mx, cy = H >> 1, rx = (W >> 1) - 4, ry = (H >> 1) - 4; for (let a = 0; a < 64; a++) { const an = a / 64 * Math.PI * 2; if (Math.abs(an - Math.PI / 2) < 0.35) continue; put('fence', Math.round(cx + Math.cos(an) * rx), Math.round(cy + Math.sin(an) * ry)); } placed = true; continue; }
          case 'near:forge': { const f = props.find(p => p.k === 'forge'); x = (f ? f.x + 3 : 4) + tries % 3; y = (f ? f.y + 1 : 3) + Math.floor(tries / 3); break; }
          default: x = 2 + Math.floor(r() * (W - 4 - w)); y = 3 + Math.floor(r() * (H - 6 - h));
        }
        placed = put(k, x, y, w, h, blk);
      }
      if (placed && ['forge', 'fireplace', 'chandelier', 'candles', 'crystal', 'floatlight', 'fire', 'alembic', 'slot'].includes(k)) { const p = props[props.length - 1]; lights.push([p.x + (p.w >> 1), p.y]); }
      if (placed && ['bookcase', 'lectern', 'altar', 'statue', 'display', 'telescope', 'vault', 'chest', 'bed', 'kitchen', 'forge', 'slot', 'roulette', 'board'].includes(k)) { const p = props[props.length - 1]; objects.push({ k, x: p.x + (p.w >> 1), y: p.y + p.h }); }
    }
  }
  // NPC spots: the first role stands behind the counter/bar/altar when present
  const counter = props.find(p => ['counter', 'bar', 'altar', 'throne', 'lectern', 'stage'].includes(p.k));
  (tpl.npc || []).forEach((role, i) => {
    let x, y; if (i === 0 && counter) { x = counter.x + (counter.w >> 1); y = counter.k === 'stage' ? counter.y + 1 : counter.y - 1; if (g.get(x, y) !== tpl.floor && counter.k !== 'stage') y = counter.y + counter.h; }
    else for (let t = 0; t < 60; t++) { x = 2 + Math.floor(r() * (W - 4)); y = 3 + Math.floor(r() * (H - 5)); if (g.get(x, y) === tpl.floor && !used[y * W + x]) break; }
    spots.push({ role, x, y, fixed: i === 0 });
  });
  for (let y = 3; y < H - 2; y++) for (let x = 2; x < W - 2; x++) if (g.get(x, y) === tpl.floor && r() < 0.05) spots.push({ role: 'wander', x, y });
  lights.push([mx, H - 2]);
  return { w: W, h: H, tiles: g.t, pal: 'interior', floor: tpl.floor, wallCol: tpl.wall, start: [mx, H - 3], props, spots, objects, lights, npcs, exits: [], gates: [], spawns: [], kind: 'interior', grid: g, name: b.name, slots: tpl.slots || 0 };
}

export const interiorRoles = t => (TPL[t] || TPL.house).npc;
export function findBuilding(cityId, id) { for (const d of CITIES[cityId]?.districts || []) for (const b of d.buildings) if (b.id === id) return { ...b, district: d.id, dtype: d.type }; return null; }
