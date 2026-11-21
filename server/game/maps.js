// Procedural map generation: towns, fields and 1,200 dungeon floors (seeded, layout varies per biome band).
import { rng, hash32 } from '../../shared/util.js';
import { TILE } from '../../shared/constants.js';
export const T = { VOID: 0, FLOOR: 1, WALL: 2, WATER: 3, SHALLOW: 4, LAVA: 5, ICE: 6, SPIKE: 7, STAIRS: 8, EXIT: 9, GRASS: 10, PATH: 11, TREE: 12, HOUSE: 13, DOOR: 14, BRIDGE: 15, POISON: 16, PORTAL: 17, PILLAR: 18, ROOF: 19, CURSE: 20, CURRENT: 21 };
export const BLOCKING = new Set([T.VOID, T.WALL, T.WATER, T.TREE, T.HOUSE, T.PILLAR, T.ROOF]);

class Grid {
  constructor(w, h, fill) { this.w = w; this.h = h; this.t = new Uint8Array(w * h).fill(fill); }
  get(x, y) { return x < 0 || y < 0 || x >= this.w || y >= this.h ? T.VOID : this.t[y * this.w + x]; }
  set(x, y, v) { if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.t[y * this.w + x] = v; }
  rect(x, y, w, h, v) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, v); }
  disc(cx, cy, r, v, only) { for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (i * i + j * j <= r * r && (only == null || this.get(cx + i, cy + j) === only)) this.set(cx + i, cy + j, v); }
  line(x0, y0, x1, y1, v, wdt = 1) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1; for (let k = 0; k <= n; k++) { const x = Math.round(x0 + (x1 - x0) * k / n), y = Math.round(y0 + (y1 - y0) * k / n); this.rect(x - (wdt >> 1), y - (wdt >> 1), wdt, wdt, v); } }
  passable(x, y) { return !BLOCKING.has(this.get(x, y)); }
}
function floodLargest(g, walk) {
  const seen = new Uint8Array(g.w * g.h); let best = [];
  for (let i = 0; i < g.t.length; i++) {
    if (seen[i] || !walk(g.t[i])) continue;
    const comp = [], st = [i]; seen[i] = 1;
    while (st.length) { const c = st.pop(); comp.push(c); const x = c % g.w, y = (c / g.w) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= g.w || ny >= g.h) continue; const n = ny * g.w + nx; if (!seen[n] && walk(g.t[n])) { seen[n] = 1; st.push(n); } } }
    if (comp.length > best.length) best = comp;
  }
  return best;
}
function cave(r, w, h) {
  const g = new Grid(w, h, T.WALL);
  for (let i = 0; i < g.t.length; i++) g.t[i] = r() < 0.46 ? T.WALL : T.FLOOR;
  for (let it = 0; it < 5; it++) { const n = new Uint8Array(g.t); for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { let c = 0; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (g.get(x + i, y + j) === T.WALL) c++; n[y * w + x] = c >= 5 ? T.WALL : T.FLOOR; } g.t = n; }
  g.rect(0, 0, w, 1, T.WALL); g.rect(0, h - 1, w, 1, T.WALL); g.rect(0, 0, 1, h, T.WALL); g.rect(w - 1, 0, 1, h, T.WALL);
  const keep = new Set(floodLargest(g, v => v === T.FLOOR)); for (let i = 0; i < g.t.length; i++) if (g.t[i] === T.FLOOR && !keep.has(i)) g.t[i] = T.WALL;
  return g;
}
function rooms(r, w, h) {
  const g = new Grid(w, h, T.WALL); const rs = [];
  for (let k = 0; k < 60 && rs.length < 14; k++) {
    const rw = 6 + Math.floor(r() * 9), rh = 6 + Math.floor(r() * 7), x = 2 + Math.floor(r() * (w - rw - 4)), y = 2 + Math.floor(r() * (h - rh - 4));
    if (rs.some(o => x < o.x + o.w + 2 && x + rw + 2 > o.x && y < o.y + o.h + 2 && y + rh + 2 > o.y)) continue;
    rs.push({ x, y, w: rw, h: rh }); g.rect(x, y, rw, rh, T.FLOOR);
  }
  rs.sort((a, b) => a.x - b.x);
  for (let i = 1; i < rs.length; i++) { const a = rs[i - 1], b = rs[i]; const ax = a.x + (a.w >> 1), ay = a.y + (a.h >> 1), bx = b.x + (b.w >> 1), by = b.y + (b.h >> 1); g.line(ax, ay, bx, ay, T.FLOOR, 3); g.line(bx, ay, bx, by, T.FLOOR, 3); }
  for (let i = 0; i < 3 && rs.length > 3; i++) { const a = rs[Math.floor(r() * rs.length)], b = rs[Math.floor(r() * rs.length)]; g.line(a.x + 2, a.y + 2, b.x + 2, b.y + 2, T.FLOOR, 2); }
  for (const o of rs) if (o.w > 9 && o.h > 8 && r() < 0.5) { g.set(o.x + 2, o.y + 2, T.PILLAR); g.set(o.x + o.w - 3, o.y + 2, T.PILLAR); g.set(o.x + 2, o.y + o.h - 3, T.PILLAR); g.set(o.x + o.w - 3, o.y + o.h - 3, T.PILLAR); }
  g.rooms = rs; return g;
}
function maze(r, w, h) {
  const cs = 4, cw = Math.floor((w - 2) / cs), ch = Math.floor((h - 2) / cs); const g = new Grid(w, h, T.WALL);
  const vis = new Uint8Array(cw * ch); const st = [[0, 0]]; vis[0] = 1;
  const open = (cx, cy) => g.rect(1 + cx * cs, 1 + cy * cs, cs - 1, cs - 1, T.FLOOR);
  open(0, 0);
  while (st.length) {
    const [cx, cy] = st[st.length - 1]; const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [cx + dx, cy + dy, dx, dy]).filter(([x, y]) => x >= 0 && y >= 0 && x < cw && y < ch && !vis[y * cw + x]);
    if (!nb.length) { st.pop(); continue; }
    const [nx, ny, dx, dy] = nb[Math.floor(r() * nb.length)]; vis[ny * cw + nx] = 1; open(nx, ny);
    g.rect(1 + Math.min(cx, nx) * cs + (dx ? cs - 1 : 0), 1 + Math.min(cy, ny) * cs + (dy ? cs - 1 : 0), dx ? 1 : cs - 1, dy ? 1 : cs - 1, T.FLOOR);
    st.push([nx, ny]);
  }
  for (let k = 0; k < cw * ch / 6; k++) { const x = 1 + Math.floor(r() * (w - 3)), y = 1 + Math.floor(r() * (h - 3)); g.rect(x, y, 2, 2, T.FLOOR); }
  for (let k = 0; k < 4; k++) { const x = 4 + Math.floor(r() * (w - 12)), y = 4 + Math.floor(r() * (h - 12)); g.rect(x, y, 7, 7, T.FLOOR); }
  return g;
}
function islands(r, w, h, sea) {
  const g = new Grid(w, h, sea); const pts = [];
  for (let k = 0; k < 9; k++) { const x = 8 + Math.floor(r() * (w - 16)), y = 8 + Math.floor(r() * (h - 16)), rad = 4 + Math.floor(r() * 5); pts.push([x, y]); g.disc(x, y, rad, T.FLOOR); }
  pts.sort((a, b) => a[0] + a[1] - b[0] - b[1]);
  for (let i = 1; i < pts.length; i++) { const [ax, ay] = pts[i - 1], [bx, by] = pts[i]; for (let k = 0; k <= 40; k++) { const x = Math.round(ax + (bx - ax) * k / 40), y = Math.round(ay + (by - ay) * k / 40); for (let j = -1; j <= 1; j++) for (let ii = -1; ii <= 1; ii++) if (g.get(x + ii, y + j) === sea) g.set(x + ii, y + j, T.BRIDGE); } }
  return g;
}
function open(r, w, h, blocker) {
  const g = new Grid(w, h, T.FLOOR); g.rect(0, 0, w, 1, T.WALL); g.rect(0, h - 1, w, 1, T.WALL); g.rect(0, 0, 1, h, T.WALL); g.rect(w - 1, 0, 1, h, T.WALL);
  for (let k = 0; k < w * h / 30; k++) { const x = 2 + Math.floor(r() * (w - 4)), y = 2 + Math.floor(r() * (h - 4)); if (r() < 0.25) g.disc(x, y, 1 + Math.floor(r() * 2), blocker); else g.set(x, y, blocker); }
  return g;
}
function arena(r, w, h) {
  const g = new Grid(w, h, T.WALL); const cx = w >> 1, cy = (h >> 1) - 2;
  g.disc(cx, cy, Math.min(w, h) / 2 - 5, T.FLOOR); g.rect(cx - 2, cy, 5, h - cy - 2, T.FLOOR);
  for (let a = 0; a < 8; a++) { const ang = a / 8 * Math.PI * 2; g.disc(Math.round(cx + Math.cos(ang) * 11), Math.round(cy + Math.sin(ang) * 11), 1, T.PILLAR); }
  g.start = [cx, h - 4]; g.bossAt = [cx, cy]; return g;
}
function floorCells(g) { const c = []; for (let y = 1; y < g.h - 1; y++) for (let x = 1; x < g.w - 1; x++) { const v = g.get(x, y); if (v === T.FLOOR || v === T.GRASS || v === T.PATH) c.push([x, y]); } return c; }
const GIMMICK_TILE = { lava: T.LAVA, water: T.SHALLOW, ice: T.ICE, spikes: T.SPIKE, traps: T.SPIKE, poisonFog: T.POISON, curseZone: T.CURSE, current: T.CURRENT };

export function genDungeonFloor(dungeon, floor, diff) {
  const band = dungeon.bands[Math.min(9, Math.floor((floor - 1) / 10))];
  const seed = hash32(`${dungeon.id}:${floor}:${diff}`); const r = rng(seed);
  const boss = floor % 10 === 0;
  const size = 44 + Math.floor((floor % 10) * 2) + Math.floor(r() * 8);
  const sea = /sky|void/.test(band.pal) ? T.VOID : T.WATER;
  let g;
  if (boss) g = arena(r, 40, 40);
  else switch (band.layout) {
    case 'cave': g = cave(r, size, size); break;
    case 'rooms': g = rooms(r, size + 6, size); break;
    case 'maze': g = maze(r, size, size); break;
    case 'islands': g = islands(r, size + 8, size + 8, sea); break;
    case 'open': g = open(r, size + 10, size, /moss|forest/.test(band.pal) ? T.TREE : T.PILLAR); break;
    default: g = cave(r, size, size);
  }
  let cells = floorCells(g);
  if (!cells.length) { g = cave(r, 50, 50); cells = floorCells(g); }
  // gimmick tiles
  if (!boss) for (const gm of band.gim) {
    const tile = GIMMICK_TILE[gm]; if (tile == null) continue;
    const n = gm === 'traps' || gm === 'spikes' ? 18 : 7;
    for (let k = 0; k < n; k++) { const [x, y] = cells[Math.floor(r() * cells.length)]; if (tile === T.SPIKE) g.set(x, y, tile); else g.disc(x, y, 1 + Math.floor(r() * 3), tile, T.FLOOR); }
  }
  // start & stairs: farthest apart
  let start = g.start || cells[Math.floor(r() * cells.length)];
  let far = start, fd = -1;
  for (let k = 0; k < 300; k++) { const c = cells[Math.floor(r() * cells.length)]; const d = (c[0] - start[0]) ** 2 + (c[1] - start[1]) ** 2; if (d > fd) { fd = d; far = c; } }
  for (const [x, y] of [start, far]) for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (g.get(x + i, y + j) !== T.WALL && !BLOCKING.has(g.get(x + i, y + j))) g.set(x + i, y + j, T.FLOOR);
  const stairs = boss ? [g.bossAt[0], g.bossAt[1] - 3] : far; const stairsPos = stairs;
  g.set(stairs[0], stairs[1], boss ? T.FLOOR : T.STAIRS);
  // exit portal placed next to (not on) the spawn point
  // exit portal: placed 5-9 tiles away from the arrival point so it can't be stepped on by accident
  let ex = null; const cand = floorCells(g).filter(([x, y]) => { const d = Math.hypot(x - start[0], y - start[1]); return d >= 5 && d <= 9 && (x !== stairsPos[0] || y !== stairsPos[1]); });
  if (cand.length) ex = cand[Math.floor(r() * cand.length)];
  else { const any = floorCells(g).filter(([x, y]) => Math.hypot(x - start[0], y - start[1]) >= 4); if (any.length) ex = any[0]; }
  if (ex) g.set(ex[0], ex[1], T.EXIT);
  cells = floorCells(g);
  const spawns = []; const nMon = boss ? 0 : (floor <= 3 && dungeon.minLv < 10 ? 6 : 10) + Math.floor(floor / 8) + Math.floor(r() * 6);
  for (let k = 0; k < nMon * 3 && spawns.length < nMon; k++) { const c = cells[Math.floor(r() * cells.length)]; if ((c[0] - start[0]) ** 2 + (c[1] - start[1]) ** 2 > 100) spawns.push(c); }
  const chests = []; if (!boss) for (let k = 0; k < 1 + Math.floor(r() * 3); k++) chests.push(cells[Math.floor(r() * cells.length)]);
  const lights = []; for (let k = 0; k < 10; k++) lights.push(cells[Math.floor(r() * cells.length)]);
  return { w: g.w, h: g.h, tiles: g.t, pal: band.pal, band, start, stairs, exit: ex, stairsOpen: !boss, spawns, chests, lights, boss, bossAt: g.bossAt, seed, grid: g };
}

// Overworld: towns & fields
export const WORLD = {
  haven: { name: '始まりの街ヘイヴン', kind: 'town', pal: 'town', links: { east: 'field_green' }, gates: [], services: ['weapon', 'armor', 'item', 'smith', 'guild', 'quest', 'inn', 'gate'] },
  field_green: { name: '翠風の平原', kind: 'field', pal: 'grass', links: { west: 'haven', east: 'marina', north: 'field_highland' }, gates: ['d01', 'd02', 'd04'], lv: [1, 18] },
  marina: { name: '港町マリナ', kind: 'town', pal: 'town', links: { west: 'field_green' }, gates: ['d06', 'd03'], services: ['weapon', 'armor', 'item', 'smith', 'guild', 'quest', 'inn', 'gate'] },
  field_highland: { name: '霧の高原', kind: 'field', pal: 'highland', links: { south: 'field_green', north: 'celestia' }, gates: ['d05', 'd07', 'd08', 'd09'], lv: [20, 60] },
  celestia: { name: '天空都市セレスティア', kind: 'town', pal: 'town', links: { south: 'field_highland' }, gates: ['d10', 'd11', 'd12'], services: ['weapon', 'armor', 'item', 'smith', 'guild', 'quest', 'inn', 'gate'] },
};
export function genOverworld(id) {
  const def = WORLD[id]; const r = rng(hash32('world:' + id));
  const W = def.kind === 'town' ? 60 : 90, H = def.kind === 'town' ? 46 : 70;
  const g = new Grid(W, H, def.kind === 'town' ? T.PATH : T.GRASS);
  g.rect(0, 0, W, 1, T.TREE); g.rect(0, H - 1, W, 1, T.TREE); g.rect(0, 0, 1, H, T.TREE); g.rect(W - 1, 0, 1, H, T.TREE);
  const npcs = [], gates = [], exits = [], lights = [];
  const cx = W >> 1, cy = H >> 1;
  if (def.kind === 'town') {
    g.rect(1, 1, W - 2, H - 2, T.GRASS); g.rect(cx - 8, cy - 6, 17, 13, T.PATH); g.rect(2, cy - 1, W - 4, 3, T.PATH); g.rect(cx - 1, 2, 3, H - 4, T.PATH);
    g.disc(cx, cy, 2, T.SHALLOW); g.set(cx, cy, T.WATER);
    const SV = { weapon: '武器屋', armor: '防具屋', item: '道具屋', smith: '鍛冶屋', guild: '職業ギルド', quest: 'クエスト掲示板', inn: '宿屋', gate: 'ダンジョン門番' };
    const spots = [[cx - 20, cy - 14], [cx - 8, cy - 14], [cx + 8, cy - 14], [cx + 18, cy - 14], [cx - 20, cy + 8], [cx - 8, cy + 9], [cx + 8, cy + 9], [cx + 18, cy + 8]];
    def.services.forEach((s, i) => { const [hx, hy] = spots[i]; g.rect(hx - 3, hy - 3, 7, 4, T.ROOF); g.rect(hx - 3, hy + 1, 7, 2, T.HOUSE); g.set(hx, hy + 2, T.DOOR); npcs.push({ service: s, name: SV[s], x: hx, y: hy + 4 }); lights.push([hx - 3, hy + 3], [hx + 3, hy + 3]); g.line(hx, hy + 3, hx, cy, T.PATH, 1); });
    for (let k = 0; k < 30; k++) { const x = 2 + Math.floor(r() * (W - 4)), y = 2 + Math.floor(r() * (H - 4)); if (g.get(x, y) === T.GRASS && Math.abs(x - cx) > 10) g.set(x, y, T.TREE); }
    lights.push([cx - 3, cy - 3], [cx + 3, cy - 3], [cx - 3, cy + 3], [cx + 3, cy + 3]);
    for (const gid of def.gates) gates.push({ dungeon: gid, x: cx + 4 + gates.length * 3, y: cy + 5 });
  } else {
    for (let k = 0; k < W * H / 14; k++) { const x = 2 + Math.floor(r() * (W - 4)), y = 2 + Math.floor(r() * (H - 4)); if (r() < 0.3) g.disc(x, y, 1 + Math.floor(r() * 2), T.TREE); else if (r() < 0.2) g.set(x, y, T.PILLAR); }
    for (let k = 0; k < 4; k++) g.disc(5 + Math.floor(r() * (W - 10)), 5 + Math.floor(r() * (H - 10)), 2 + Math.floor(r() * 3), T.SHALLOW);
    g.rect(1, cy - 1, W - 2, 3, T.PATH); g.rect(cx - 1, 1, 3, H - 2, T.PATH);
    def.gates.forEach((gid, i) => { const ang = (i + 0.5) / def.gates.length * Math.PI * 2; const x = Math.round(cx + Math.cos(ang) * W * 0.3), y = Math.round(cy + Math.sin(ang) * H * 0.3); g.rect(x - 3, y - 3, 7, 7, T.PATH); g.set(x - 2, y - 2, T.PILLAR); g.set(x + 2, y - 2, T.PILLAR); g.set(x, y, T.PORTAL); gates.push({ dungeon: gid, x, y }); lights.push([x - 2, y - 1], [x + 2, y - 1]); g.line(x, y, cx, cy, T.PATH, 1); });
  }
  const edge = { east: [W - 2, cy], west: [1, cy], north: [cx, 1], south: [cx, H - 2] };
  for (const [dir, to] of Object.entries(def.links)) { const [x, y] = edge[dir]; g.rect(dir === 'east' ? W - 3 : dir === 'west' ? 0 : cx - 2, dir === 'north' ? 0 : dir === 'south' ? H - 3 : cy - 2, dir === 'east' || dir === 'west' ? 3 : 5, dir === 'east' || dir === 'west' ? 5 : 3, T.PATH); for (let k = -2; k <= 2; k++) g.set(dir === 'east' || dir === 'west' ? x : x + k, dir === 'east' || dir === 'west' ? y + k : y, T.EXIT); exits.push({ dir, to, x, y }); }
  for (const gt of gates) g.set(gt.x, gt.y, T.PORTAL);
  const cells = floorCells(g); const spawns = [];
  if (def.kind === 'field') for (let k = 0; k < 26; k++) { const c = cells[Math.floor(r() * cells.length)]; if (Math.abs(c[0] - cx) + Math.abs(c[1] - cy) > 8) spawns.push(c); }
  return { w: W, h: H, tiles: g.t, pal: def.pal, start: [cx, cy + 2], spawns, npcs, gates, exits, lights, grid: g, kind: def.kind, name: def.name, lv: def.lv };
}
export const tileAt = (map, px, py) => { const x = Math.floor(px / TILE), y = Math.floor(py / TILE); return x < 0 || y < 0 || x >= map.w || y >= map.h ? T.VOID : map.tiles[y * map.w + x]; };
export const blockedAt = (map, px, py) => BLOCKING.has(tileAt(map, px, py));
