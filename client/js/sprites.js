// Procedural pixel-art: tilesets per biome palette, characters (look), weapons (86 type visuals), monsters, items.
export const T = { VOID: 0, FLOOR: 1, WALL: 2, WATER: 3, SHALLOW: 4, LAVA: 5, ICE: 6, SPIKE: 7, STAIRS: 8, EXIT: 9, GRASS: 10, PATH: 11, TREE: 12, HOUSE: 13, DOOR: 14, BRIDGE: 15, POISON: 16, PORTAL: 17, PILLAR: 18, ROOF: 19, CURSE: 20, CURRENT: 21, BLOCK: 22, MARBLE: 23, COBBLE: 24, RUBBLE: 25, PLANK: 26, CARPET: 27, STONEF: 28, IWALL: 29, STEPS: 30, MAT: 31 };
const P = (floor, floor2, wallTop, wallFace, water, accent, dark, fog) => ({ floor, floor2, wallTop, wallFace, water, accent, dark, fog });
export const PALETTES = {
  town: P('#7a6a52', '#6e5e48', '#5b4d3c', '#3f342a', '#3a78c8', '#e8c070', 0.0, null), grass: P('#4f8a3a', '#467d33', '#2f5a2a', '#24461f', '#3a78c8', '#f0e070', 0.0, null), highland: P('#6b8a5a', '#5f7d50', '#4a5a4a', '#353f35', '#4a80b8', '#d0e0ff', 0.1, '#c8d0e0'),
  moss: P('#3d5a3a', '#344f32', '#5a7a4a', '#22301f', '#2a5a7a', '#9aff7a', 0.45, null), fungus: P('#4a3d5a', '#40344f', '#6a5a80', '#241c30', '#3a4a8a', '#e080ff', 0.5, '#402060'), dirt: P('#6a5038', '#5e4630', '#8a6c4c', '#3a2a1c', '#3a5a7a', '#ffb060', 0.45, null),
  lake: P('#4a6a6a', '#405e5e', '#2e4a4a', '#1e3232', '#2a7ab0', '#80e0ff', 0.4, null), lava: P('#4a2a22', '#40241e', '#6a3a2a', '#221010', '#ff5a10', '#ff9030', 0.45, '#401008'), obsidian: P('#2e2a36', '#28242f', '#1a1820', '#100e14', '#ff5a10', '#c080ff', 0.55, null),
  ash: P('#5a5550', '#504b46', '#3a3632', '#26231f', '#506070', '#ff8040', 0.5, '#605850'), ice: P('#9ab8d0', '#8eabc4', '#6a88a8', '#4a6080', '#5aa0e0', '#e0f8ff', 0.3, '#d0e8ff'), snow: P('#d8e0ea', '#cdd6e2', '#9aa8b8', '#6a7888', '#6aa8e0', '#ffffff', 0.15, '#e8eef8'),
  crystal: P('#5a6a9a', '#50608e', '#3a4a7a', '#26305a', '#6a8aff', '#a0f0ff', 0.4, null), ruin: P('#6a6a62', '#5e5e57', '#46463f', '#2e2e29', '#3a5a6a', '#e0d0a0', 0.45, null), grave: P('#4a4a50', '#424248', '#6a6a74', '#26262c', '#2a3a4a', '#a0ffd0', 0.6, '#304040'),
  blood: P('#5a2a2e', '#4f2428', '#3a181c', '#240e10', '#8a1020', '#ff4060', 0.55, '#401018'), sky: P('#c8d4e8', '#bcc8dc', '#9aa8c0', '#6e7c98', '#000000', '#ffffff', 0.0, null), marble: P('#d8d4c8', '#ccc8bc', '#aaa496', '#7e786c', '#5aa0e0', '#ffe8a0', 0.1, null),
  coral: P('#3a6a7a', '#32606e', '#2a4a5a', '#1a323e', '#2a80c0', '#ff80a0', 0.45, '#103850'), wreck: P('#5a4a3a', '#504232', '#3a3026', '#241e18', '#2a5a8a', '#e0c080', 0.5, '#103040'), temple: P('#4a7a8a', '#407080', '#2e5a6a', '#1e3e4a', '#2a90d0', '#ffe080', 0.4, '#104060'),
  abyssSea: P('#1e2e4a', '#1a2842', '#121c30', '#0a1020', '#102a5a', '#60a0ff', 0.7, '#081830'), metal: P('#5a6068', '#50565e', '#3a3e46', '#24282e', '#3a6a9a', '#60e0ff', 0.45, null), circuit: P('#2a3a4a', '#243442', '#18242e', '#0e161e', '#2a6aaa', '#40ffd0', 0.5, null),
  rust: P('#6a4a3a', '#5e4232', '#463026', '#2e2018', '#4a6a5a', '#ff9040', 0.5, '#403020'), hell: P('#4a1a1e', '#40161a', '#2a0e10', '#180608', '#ff3010', '#ff5030', 0.55, '#300808'), clock: P('#6a5a4a', '#5e5042', '#46382e', '#2e241e', '#4a6aaa', '#ffd070', 0.45, null),
  industrial: P('#5a5048', '#524840', '#3a3430', '#2a2420', '#3a5a6a', '#ff9040', 0.15, '#6a6058'), arcane: P('#5a6a8a', '#52627e', '#3a4a6a', '#2a3450', '#3a6ad0', '#a0e0ff', 0.1, '#a0b0d0'), neon: P('#4a4450', '#423c48', '#2a2630', '#1a1820', '#2a3a6a', '#ff40a0', 0.1, null), interior: P('#8a6a4a', '#7e6044', '#5a4030', '#3a2a20', '#3a6aa0', '#ffd080', 0.25, null),
  sand: P('#c8a870', '#bc9c66', '#9a7c4e', '#6e5636', '#4a90c0', '#fff0a0', 0.2, '#d0b080'), void: P('#2a2440', '#241f38', '#16122a', '#0c0a18', '#000000', '#a080ff', 0.6, '#100820'), abyss: P('#2a1a34', '#24162e', '#4a3060', '#100818', '#2a0040', '#c040ff', 0.75, '#0a0010'),
};
export const SKIN = ['#f6d7b8', '#e8b890', '#c88a60', '#8a5a3a', '#e0c8f0'];
export const HAIR = ['#2a1e18', '#6a4228', '#c8a050', '#e8e0d0', '#b02a2a', '#2a4ab0', '#3aa060', '#8a40c0', '#f080a0', '#303040'];
export const OUTFIT = [['#3a5aa0', '#2a3a70'], ['#a03a3a', '#702a2a'], ['#3a8a4a', '#2a6034'], ['#6a4a8a', '#4a3060'], ['#8a6a3a', '#604a28'], ['#2a2a2e', '#18181c'], ['#c8c8d0', '#8a8a96'], ['#c0902a', '#806010'], ['#2a8a8a', '#1a5a5a'], ['#a04a7a', '#6a2a50']];

function rnd(x, y, s = 0) { let h = (x * 374761393 + y * 668265263 + s * 982451653) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function shade(hex, f) { const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255; r = Math.max(0, Math.min(255, r * f)); g = Math.max(0, Math.min(255, g * f)); b = Math.max(0, Math.min(255, b * f)); return `rgb(${r | 0},${g | 0},${b | 0})`; }
export { shade };

// ---------- tile map prerender (static layer)
import { drawFloor, drawIWall, drawBuilding, drawLandmark, drawDecor, windows, FLOORS } from './citysprites.js';
export { windows };
export function renderTileMap(map, palKey) {
  const pal = PALETTES[palKey] || PALETTES.moss; const S = 16;
  const c = document.createElement('canvas'); c.width = map.w * S; c.height = map.h * S; const g = c.getContext('2d');
  const at = (x, y) => (x < 0 || y < 0 || x >= map.w || y >= map.h) ? T.VOID : map.tiles[y * map.w + x];
  const isWallish = v => v === T.WALL || v === T.HOUSE || v === T.ROOF;
  // roof regions get one color each
  const roofCol = new Map(); let rc = 0;
  for (let i = 0; i < map.tiles.length; i++) if (map.tiles[i] === T.ROOF && !roofCol.has(i)) { const st = [i]; roofCol.set(i, rc); while (st.length) { const c = st.pop(); const cx = c % map.w, cy = (c / map.w) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = (cy + dy) * map.w + cx + dx; if (cx + dx >= 0 && cx + dx < map.w && map.tiles[n] === T.ROOF && !roofCol.has(n)) { roofCol.set(n, rc); st.push(n); } } } rc++; }
  const ROOFS = ['#a03a2a', '#2a5aa0', '#3a7a3a', '#8a4a9a', '#a07a2a'];
  for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) {
    let v = at(x, y); const px = x * S, py = y * S, r = rnd(x, y);
    if (v === T.BLOCK) { v = map.floorTile || [at(x - 1, y), at(x + 1, y), at(x, y + 1), at(x, y - 1)].find(n => n !== T.BLOCK && n !== T.WALL && n !== T.IWALL && n !== T.VOID) || T.COBBLE; if (v === T.BLOCK) v = T.COBBLE; }
    if (FLOORS[v]) { drawFloor(g, v, px, py, x, y, v === map.floorTile && map.kind === 'interior' ? null : null); continue; }
    if (v === T.IWALL) { drawIWall(g, px, py, map.wallCol || '#6a4a3a', at(x, y + 1) !== T.IWALL); continue; }
    const floorBase = (col1, col2) => { g.fillStyle = r < 0.5 ? col1 : col2; g.fillRect(px, py, S, S); for (let k = 0; k < 5; k++) { const a = rnd(x, y, k + 1); g.fillStyle = shade(col1, 0.82 + rnd(x, y, k + 9) * 0.3); g.fillRect(px + Math.floor(a * 15), py + Math.floor(rnd(x, y, k + 20) * 15), 1 + (a > 0.8 ? 1 : 0), 1); } if (r > 0.9) { g.fillStyle = shade(col1, 0.7); g.fillRect(px + 3, py + 8, 4, 1); g.fillRect(px + 9, py + 4, 1, 3); } };
    switch (v) {
      case T.VOID: { g.fillStyle = palKey === 'sky' ? '#7aa0d8' : '#05040a'; g.fillRect(px, py, S, S); if (palKey === 'sky' && r > 0.85) { g.fillStyle = '#e8f0ff'; g.fillRect(px + 2, py + 6, 8, 3); } else if (r > 0.97) { g.fillStyle = '#a0a0ff'; g.fillRect(px + 7, py + 7, 1, 1); } break; }
      case T.FLOOR: case T.STAIRS: case T.EXIT: case T.SPIKE: case T.POISON: case T.CURSE: case T.CURRENT: case T.PORTAL: case T.DOOR: floorBase(pal.floor, pal.floor2); break;
      case T.GRASS: floorBase('#4f8a3a', '#4a8236'); if (r > 0.6) { g.fillStyle = '#6aaa4a'; g.fillRect(px + Math.floor(r * 12), py + 5, 1, 2); g.fillRect(px + Math.floor(r * 7) + 4, py + 11, 1, 2); } if (r > 0.95) { g.fillStyle = ['#ff8080', '#ffff80', '#a0a0ff'][Math.floor(r * 300) % 3]; g.fillRect(px + 6, py + 6, 2, 2); } break;
      case T.PATH: floorBase('#9a8462', '#907a58'); if (r > 0.7) { g.fillStyle = '#7a6648'; g.fillRect(px + 2, py + 2, 5, 4); g.fillStyle = '#a89070'; g.fillRect(px + 2, py + 2, 5, 1); } break;
      case T.WATER: case T.SHALLOW: g.fillStyle = v === T.WATER ? shade(pal.water, 0.8) : pal.water; g.fillRect(px, py, S, S); g.fillStyle = shade(pal.water, 1.25); if (r > 0.5) g.fillRect(px + 3, py + 5 + Math.floor(r * 4), 4, 1); if (at(x, y - 1) !== v && at(x, y - 1) !== T.WATER && at(x, y - 1) !== T.SHALLOW) { g.fillStyle = shade(pal.water, 1.5); g.fillRect(px, py, S, 1); } break;
      case T.LAVA: g.fillStyle = '#c83a08'; g.fillRect(px, py, S, S); g.fillStyle = '#ff8a20'; for (let k = 0; k < 4; k++) g.fillRect(px + Math.floor(rnd(x, y, k) * 13), py + Math.floor(rnd(x, y, k + 5) * 13), 3, 2); g.fillStyle = '#ffd060'; g.fillRect(px + Math.floor(r * 12), py + Math.floor(r * 9), 2, 1); break;
      case T.ICE: g.fillStyle = '#a8d8f0'; g.fillRect(px, py, S, S); g.fillStyle = '#e0f8ff'; g.fillRect(px + 2, py + 3, 6, 1); g.fillRect(px + 9, py + 10, 4, 1); break;
      case T.BRIDGE: g.fillStyle = '#7a5a38'; g.fillRect(px, py, S, S); g.fillStyle = '#5a4028'; for (let k = 0; k < S; k += 4) g.fillRect(px, py + k, S, 1); break;
      case T.WALL: case T.PILLAR: { floorBase(pal.floor, pal.floor2); const below = at(x, y + 1); const face = !isWallish(below) && v === T.WALL; g.fillStyle = pal.wallTop; if (v === T.PILLAR) { g.fillStyle = shade(pal.wallFace, 1.1); g.fillRect(px + 3, py + 2, 10, 14); g.fillStyle = pal.wallTop; g.fillRect(px + 2, py, 12, 4); g.fillStyle = shade(pal.wallTop, 1.3); g.fillRect(px + 2, py, 12, 1); break; }
        const inner = isWallish(at(x - 1, y)) && isWallish(at(x + 1, y)) && isWallish(at(x, y - 1)) && isWallish(at(x, y + 1));
        if (inner && !face) { g.fillStyle = shade(pal.wallFace, 0.55); g.fillRect(px, py, S, S); g.fillStyle = shade(pal.wallFace, 0.7); if (r > 0.6) g.fillRect(px + (r * 12 | 0), py + (r * 7 | 0) + 3, 3, 2); break; }
        g.fillRect(px, py, S, face ? 7 : S); g.fillStyle = shade(pal.wallTop, 1.15);
        { g.fillStyle = shade(pal.wallTop, 1.5); if (!isWallish(at(x - 1, y))) g.fillRect(px, py, 1, face ? 7 : S); if (!isWallish(at(x + 1, y))) g.fillRect(px + S - 1, py, 1, face ? 7 : S); g.fillStyle = shade(pal.wallTop, 1.15); } for (let k = 0; k < 3; k++) g.fillRect(px + Math.floor(rnd(x, y, k + 40) * 14), py + Math.floor(rnd(x, y, k + 50) * (face ? 5 : 14)), 2, 1);
        if (!isWallish(at(x, y - 1)) && at(x, y - 1) !== T.VOID) { g.fillStyle = shade(pal.wallTop, 1.35); g.fillRect(px, py, S, 1); }
        if (face) { g.fillStyle = pal.wallFace; g.fillRect(px, py + 7, S, 9); g.fillStyle = shade(pal.wallFace, 0.75); for (let k = 9; k < S; k += 3) g.fillRect(px + ((k / 3) % 2 ? 0 : 4), py + k, S, 1); g.fillStyle = shade(pal.wallFace, 1.25); g.fillRect(px, py + 7, S, 1); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(px, py + S, S, 0); }
        break; }
      case T.TREE: floorBase(palKey === 'town' ? '#4f8a3a' : pal.floor, palKey === 'town' ? '#4a8236' : pal.floor2); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(px + 2, py + 12, 12, 3); g.fillStyle = '#5a3a20'; g.fillRect(px + 7, py + 9, 3, 6); g.fillStyle = '#2a5a24'; g.fillRect(px + 2, py + 2, 12, 9); g.fillStyle = '#3a7a30'; g.fillRect(px + 3, py + 1, 10, 7); g.fillStyle = '#5aa040'; g.fillRect(px + 5, py + 2, 4, 2); break;
      case T.HOUSE: g.fillStyle = '#d8c4a0'; g.fillRect(px, py, S, S); g.fillStyle = '#b8a07c'; for (let k = 3; k < S; k += 5) g.fillRect(px, py + k, S, 1); g.fillStyle = '#6a4a2a'; if (at(x - 1, y) !== T.HOUSE) g.fillRect(px, py, 2, S); if (at(x + 1, y) !== T.HOUSE) g.fillRect(px + S - 2, py, 2, S); if (x % 2 === 0 && at(x - 1, y) === T.HOUSE && at(x + 1, y) === T.HOUSE && at(x, y + 1) !== T.HOUSE) { g.fillStyle = '#3a2a1a'; g.fillRect(px + 4, py + 3, 8, 7); g.fillStyle = '#ffe8a0'; g.fillRect(px + 5, py + 4, 6, 5); g.fillStyle = '#6a4a2a'; g.fillRect(px + 7, py + 4, 1, 5); g.fillRect(px + 5, py + 6, 6, 1); } g.fillStyle = 'rgba(0,0,0,.25)'; if (at(x, y + 1) !== T.HOUSE) g.fillRect(px, py + S - 1, S, 1); break;
      case T.ROOF: { const base = ROOFS[roofCol.get(y * map.w + x) % ROOFS.length]; g.fillStyle = base; g.fillRect(px, py, S, S); g.fillStyle = shade(base, 0.8); for (let k = 2; k < S; k += 4) for (let j = (k / 4 | 0) % 2 * 3; j < S; j += 6) g.fillRect(px + j, py + k, 4, 1); if (at(x, y - 1) !== T.ROOF) { g.fillStyle = shade(base, 1.3); g.fillRect(px, py, S, 2); } if (at(x, y + 1) !== T.ROOF) { g.fillStyle = shade(base, 0.6); g.fillRect(px, py + S - 2, S, 2); } if (at(x - 1, y) !== T.ROOF) { g.fillStyle = shade(base, 0.7); g.fillRect(px, py, 1, S); } if (at(x + 1, y) !== T.ROOF) { g.fillStyle = shade(base, 0.7); g.fillRect(px + S - 1, py, 1, S); } break; }
    }
    // overlays
    if (v === T.STAIRS) { g.fillStyle = '#1a1410'; g.fillRect(px + 2, py + 2, 12, 12); for (let k = 0; k < 4; k++) { g.fillStyle = shade(pal.floor, 1.2 - k * 0.2); g.fillRect(px + 2, py + 2 + k * 3, 12 - k * 2, 2); } }
    if (v === T.EXIT) { g.fillStyle = '#3a8aff'; g.fillRect(px + 3, py + 3, 10, 10); g.fillStyle = '#a0e0ff'; g.fillRect(px + 5, py + 5, 6, 6); }
    if (v === T.SPIKE) { g.fillStyle = '#9aa0a8'; for (let k = 0; k < 3; k++) for (let j = 0; j < 3; j++) { g.fillRect(px + 3 + k * 4, py + 4 + j * 4, 1, 2); } }
    if (v === T.POISON) { g.fillStyle = 'rgba(120,220,60,.45)'; g.fillRect(px, py, S, S); }
    if (v === T.CURSE) { g.fillStyle = 'rgba(150,40,200,.4)'; g.fillRect(px, py, S, S); g.fillStyle = '#c060ff'; g.fillRect(px + 7, py + 3, 1, 9); g.fillRect(px + 4, py + 7, 8, 1); }
    if (v === T.CURRENT) { g.fillStyle = 'rgba(80,160,255,.35)'; g.fillRect(px, py, S, S); g.fillStyle = '#a0d0ff'; g.fillRect(px + 4, py + 7, 7, 1); g.fillRect(px + 9, py + 6, 1, 3); }
    if (v === T.PORTAL) { g.fillStyle = '#2a1a4a'; g.beginPath(); g.ellipse(px + 8, py + 8, 7, 7, 0, 0, 7); g.fill(); g.fillStyle = '#8a5aff'; g.beginPath(); g.ellipse(px + 8, py + 8, 5, 5, 0, 0, 7); g.fill(); }
    if (v === T.DOOR) { g.fillStyle = '#5a3a1a'; g.fillRect(px + 4, py, 8, 12); g.fillStyle = '#e0c060'; g.fillRect(px + 10, py + 6, 1, 1); }
    // ambient occlusion near walls
    if (!isWallish(v) && v !== T.VOID && v !== T.TREE && isWallish(at(x, y - 1))) { g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(px, py, S, 4); }
  }
  // props: decor/furniture first, then buildings & landmarks sorted by bottom edge (painter's order)
  windows.length = 0;
  const props = (map.props || []).slice().sort((a, b) => (a.y + a.h) - (b.y + b.h));
  for (const p of props) { if (p.k === 'bldg') drawBuilding(g, p); else if (p.k === 'landmark') drawLandmark(g, p); else drawDecor(g, p); }
  return c;
}

// ---------- characters (16x24 frame), drawn per direction: 0 down,1 up,2 side
const charCache = new Map();
export function charSprite(look = {}, dir = 0, frame = 0) {
  const key = `${look.body}|${look.skin}|${look.hair}|${look.hairColor}|${look.outfit}|${dir}|${frame}`;
  if (charCache.has(key)) return charCache.get(key);
  const c = document.createElement('canvas'); c.width = 16; c.height = 24; const g = c.getContext('2d');
  const skin = SKIN[look.skin | 0] || SKIN[0], hair = HAIR[look.hairColor | 0] || HAIR[0], [o1, o2] = OUTFIT[look.outfit | 0] || OUTFIT[0];
  const px = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const step = [0, 1, 0, -1][frame % 4];
  const big = look.body === 2 ? 1 : 0, slim = look.body === 1 ? 1 : 0;
  // legs
  px(5 + slim, 18, 2, 4 + (step > 0 ? 1 : 0), shade(o2, 0.8)); px(9 - slim, 18, 2, 4 + (step < 0 ? 1 : 0), shade(o2, 0.8));
  px(5 + slim, 22 + (step > 0 ? 1 : 0), 2, 1, '#2a1e18'); px(9 - slim, 22 + (step < 0 ? 1 : 0), 2, 1, '#2a1e18');
  // body
  px(4 - big + slim, 11, 8 + big * 2 - slim * 2, 8, o1); px(4 - big + slim, 17, 8 + big * 2 - slim * 2, 2, o2); px(4 - big + slim, 11, 8 + big * 2 - slim * 2, 1, shade(o1, 1.3));
  px(7, 12, 2, 5, shade(o1, 0.8)); // trim
  // arms
  px(3 - big, 12 + (dir === 2 ? 0 : step * 0), 1, 5, skin); px(12 + big, 12, 1, 5, skin);
  // head
  px(4, 3, 8, 8, skin); px(4, 10, 8, 1, shade(skin, 0.85));
  if (dir === 0) { px(6, 6, 1, 2, '#1a1a2a'); px(9, 6, 1, 2, '#1a1a2a'); px(7, 9, 2, 1, shade(skin, 0.7)); }
  if (dir === 2) { px(9, 6, 1, 2, '#1a1a2a'); px(11, 7, 1, 1, shade(skin, 0.8)); }
  // hair styles
  const hs = look.hair | 0;
  px(4, 2, 8, 2, hair); px(3, 3, 1, 4, hair); px(12, 3, 1, 4, hair);
  if (dir === 1) px(4, 2, 8, 8, hair);
  if (hs === 1) { px(3, 3, 1, 8, hair); px(12, 3, 1, 8, hair); if (dir === 1) px(4, 10, 8, 2, hair); }
  if (hs === 2) { px(5, 0, 2, 2, hair); px(9, 1, 2, 1, hair); px(4, 1, 8, 1, hair); }
  if (hs === 3) { px(11, 4, 3, 7, hair); px(2, 4, 2, 4, hair); }
  if (hs === 4) { px(4, 4, 8, 1, hair); px(3, 2, 10, 2, shade(hair, 1.1)); }
  if (hs === 5 && dir !== 0) px(6, 10, 4, 4, hair);
  if (dir === 0 && hs !== 1) px(5, 4, 6, 1, hair);
  px(4, 2, 8, 1, shade(hair, 1.3));
  charCache.set(key, c); return c;
}

// ---------- weapons: drawn into a canvas pointing right (+x), handle at (4, h/2)
const wCache = new Map();
export function weaponSprite(vis, rarCol) {
  const key = JSON.stringify(vis) + rarCol; if (wCache.has(key)) return wCache.get(key);
  const L = 40, H = 24, c = document.createElement('canvas'); c.width = L; c.height = H; const g = c.getContext('2d'); const cy = H / 2;
  const col = vis.col || '#ccc', dk = shade(col, 0.6), lt = shade(col, 1.35), glow = vis.glow;
  const px = (x, y, w, h, cc) => { g.fillStyle = cc; g.fillRect(x, y, w, h); };
  const grip = (len = 4) => { px(0, cy - 1, len, 2, '#5a3a22'); px(0, cy - 1, 1, 2, rarCol || '#e0c060'); };
  switch (vis.k) {
    case 'blade': case 'dual': case 'twin': {
      const len = Math.min(34, vis.len || 14), w = vis.w || 2; grip(4);
      if (vis.guard) px(4, cy - 1 - vis.guard, 1 + (vis.guard > 2 ? 1 : 0), 2 + vis.guard * 2, rarCol || '#d0b060');
      for (let i = 0; i < len; i++) { const bend = vis.curve ? Math.round(Math.sin(i / len * Math.PI * 0.8) * vis.curve * 0.6) : 0; const ww = vis.tip === 'flat' ? w : Math.max(1, Math.round(w * (i > len - 3 ? (len - i) / 3 : 1))); px(6 + i, cy - Math.ceil(ww / 2) - bend, 1, ww, i % 5 === 0 && vis.saw ? lt : col); px(6 + i, cy - Math.ceil(ww / 2) - bend, 1, 1, lt); if (vis.seg && i % 4 === 3) px(6 + i, cy - 2 - bend, 1, 4, dk); if (vis.saw && i % 2) px(6 + i, cy + Math.floor(ww / 2) - bend, 1, 1, dk); }
      if (vis.k === 'twin') { for (let i = 0; i < len / 2; i++) { px(-0, 0, 0, 0, col); } }
      if (vis.fang) px(6 + len - 4, cy + 1, 3, 2, '#fff0d0');
      if (vis.chain) for (let i = 0; i < 4; i++) px(6 + len * 0.3 + i * 3, cy + 2, 1, 1, '#888');
      if (vis.mech) { px(10, cy - 2, 4, 4, dk); px(11, cy - 1, 2, 2, '#ffb030'); }
      break; }
    case 'pole': { const len = Math.min(36, vis.len || 26); px(0, cy - 1, len - 6, 2, '#6a4a2a'); px(0, cy - 1, len - 6, 1, '#8a6a3a'); const hx = len - 7;
      switch (vis.head) {
        case 'spear': case 'pike': px(hx, cy - 2, 6, 4, col); px(hx + 6, cy - 1, 2, 2, lt); px(hx - 1, cy - 2, 1, 4, rarCol || '#d0b060'); break;
        case 'lance': for (let i = 0; i < 10; i++) px(hx - 4 + i, cy - Math.max(1, 4 - i / 2.5) | 0, 1, Math.max(2, 8 - i * 0.8) | 0, i % 3 ? col : lt); break;
        case 'halberd': px(hx, cy - 1, 7, 2, col); px(hx + 1, cy - 6, 4, 5, col); px(hx + 1, cy - 6, 4, 1, lt); px(hx + 2, cy + 1, 2, 3, dk); break;
        case 'partisan': px(hx, cy - 3, 7, 6, col); px(hx + 7, cy - 1, 2, 2, lt); px(hx - 1, cy - 4, 2, 2, col); px(hx - 1, cy + 2, 2, 2, col); break;
        case 'trident': px(hx, cy - 4, 1, 9, col); for (const o of [-4, 0, 4]) px(hx, cy + o, 7, 1, lt); break;
        case 'naginata': for (let i = 0; i < 9; i++) px(hx + i, cy - 1 - Math.round(i * 0.35), 1, 3, i > 6 ? lt : col); break;
        case 'glaive': px(hx, cy - 3, 8, 5, col); px(hx + 2, cy - 4, 6, 1, lt); break;
        case 'scythe': for (let i = 0; i < 12; i++) px(hx - i * 0.6 | 0, cy - 2 - i, 3, 2, i < 2 ? dk : col); px(hx - 7, cy - 12, 3, 1, lt); break;
        case 'drill': for (let i = 0; i < 10; i++) { const w = Math.max(1, 8 - i * 0.8) | 0; px(hx - 2 + i, cy - w / 2 | 0, 1, w, i % 2 ? col : dk); } break;
        case 'flag': px(hx + 5, cy - 1, 2, 2, col); px(hx - 6, cy - 10, 10, 8, rarCol || '#c03030'); px(hx - 6, cy - 10, 10, 1, '#fff6'); break;
        default: px(hx, cy - 2, 6, 4, col);
      }
      if (vis.shield) { px(4, cy + 1, 7, 9, '#7a8696'); px(5, cy + 2, 5, 7, '#9aa6b6'); px(7, cy + 3, 1, 5, rarCol || '#d0b060'); }
      break; }
    case 'axe': { const len = vis.len || 15; px(0, cy - 1, len, 2, '#6a4a2a'); px(len - 5, cy - 6, 5, 7, col); px(len - 5, cy - 6, 1, 7, lt); if (vis.head === 'double') px(len - 5, cy, 5, 6, col); break; }
    case 'hammer': { const len = vis.len || 15; px(0, cy - 1, len, 2, '#5a3a22'); const hx = len - 3;
      if (vis.head === 'huge') { px(hx - 4, cy - 7, 9, 14, col); px(hx - 4, cy - 7, 9, 2, lt); }
      else if (vis.head === 'pick') { px(hx - 1, cy - 4, 4, 6, col); px(hx + 3, cy - 1, 4, 2, lt); px(hx - 4, cy - 1, 3, 2, dk); }
      else if (vis.head === 'spiked' || vis.head === 'flange' || vis.head === 'star') { g.fillStyle = col; g.beginPath(); g.arc(hx + 1, cy, 4, 0, 7); g.fill(); for (let a = 0; a < 6.28; a += 1.05) px(hx + 1 + Math.cos(a) * 5 | 0, cy + Math.sin(a) * 5 | 0, 1, 1, vis.head === 'star' ? '#fff8a0' : lt); }
      else if (vis.head === 'club') { for (let i = 0; i < 8; i++) px(len - 8 + i, cy - 1 - i / 3 | 0, 1, 2 + i * 2 / 3 | 0, col); }
      else if (vis.head === 'pile') { px(hx - 4, cy - 4, 6, 8, dk); px(hx + 2, cy - 1, 6, 2, '#d0d4da'); }
      else { px(hx - 3, cy - 5, 7, 10, col); px(hx - 3, cy - 5, 7, 1, lt); }
      break; }
    case 'flail': { px(0, cy - 1, 8, 2, '#5a3a22'); for (let i = 0; i < (vis.len || 9); i++) px(8 + i, cy + (i % 2), 1, 1, '#999'); const bx = 8 + (vis.len || 9), r = vis.head === 'bigball' ? 6 : 3; g.fillStyle = col; g.beginPath(); g.arc(bx + r, cy, r, 0, 7); g.fill(); px(bx + r - 1, cy - r, 1, 1, lt); break; }
    case 'chainweapon': { px(0, cy - 1, 5, 2, '#5a3a22'); for (let i = 0; i < 7; i++) px(5 + i * 0.8 | 0, cy - 1 - i, 2, 1, col); for (let i = 0; i < 8; i++) px(1, cy + 2 + i, 1, 1, '#999'); break; }
    case 'fist': case 'claw': case 'mechfist': case 'tonfa': case 'nunchaku': case 'boots': {
      if (vis.k === 'claw') { for (const o of [-2, 0, 2]) for (let i = 0; i < 8; i++) px(4 + i, cy + o - (i > 5 ? 1 : 0), 1, 1, col); }
      else if (vis.k === 'tonfa') { px(0, cy - 1, 14, 2, col); px(3, cy + 1, 2, 3, dk); }
      else if (vis.k === 'nunchaku') { px(0, cy - 1, 6, 2, col); px(6, cy, 3, 1, '#999'); px(9, cy - 1, 6, 2, col); }
      else if (vis.k === 'boots') { px(2, cy - 2, 6, 5, col); px(2, cy - 2, 6, 1, shade(col, 1.3)); }
      else { const b = vis.big ? 2 : 0; px(2, cy - 3 - b, 6 + b, 6 + b * 2, col); px(2, cy - 3 - b, 6 + b, 1, lt); if (vis.ring) px(5, cy - 1, 2, 2, '#ffd060'); }
      break; }
    case 'bow': { g.strokeStyle = col; g.lineWidth = 2; g.beginPath(); g.arc(4, cy, 10, -1.2, 1.2); g.stroke(); px(4 + Math.cos(1.2) * 10 | 0, cy - 9, 1, 19, '#eee8'); break; }
    case 'crossbow': { px(0, cy - 1, 14, 3, col); px(10, cy - 7, 2, 15, dk); px(10, cy - 7, 1, 15, '#ddd8'); if (vis.rep) px(4, cy - 4, 5, 3, dk); break; }
    case 'ring': { g.strokeStyle = col; g.lineWidth = vis.big ? 3 : 2; g.beginPath(); g.arc(10, cy, vis.big ? 8 : 6, 0, 7); g.stroke(); break; }
    case 'boomerang': { for (let i = 0; i < 7; i++) { px(4 + i, cy - i, 2, 2, col); px(4 + i, cy + i, 2, 2, col); } break; }
    case 'cannon': { px(0, cy - 3, 18, 6, col); px(16, cy - 4, 4, 8, dk); px(0, cy - 3, 18, 1, shade(col, 1.3)); break; }
    case 'staff': { const len = vis.len || 22; px(0, cy - 1, len, 2, col); px(len - 1, cy - 3, 4, 6, vis.gem || '#f0f'); px(len, cy - 2, 2, 2, '#fff'); if (vis.strings) for (let i = 0; i < 3; i++) px(len - 2, cy + 3 + i * 2, 1, 6, '#ddd6'); break; }
    case 'book': { px(2, cy - 5, 11, 10, col); px(3, cy - 4, 9, 8, shade(col, 1.4)); px(7, cy - 5, 1, 10, dk); break; }
    case 'orb': { const r = vis.big ? 6 : 4; g.fillStyle = col; g.beginPath(); g.arc(8, cy, r, 0, 7); g.fill(); px(6, cy - r + 1, 2, 2, '#fff'); break; }
    case 'stone': { px(4, cy - 4, 8, 8, col); px(6, cy - 2, 4, 1, glow || '#8ff'); px(7, cy - 3, 1, 5, glow || '#8ff'); break; }
    case 'shelf': { px(0, cy - 8, 12, 16, col); for (let k = 0; k < 3; k++) { px(1, cy - 7 + k * 5, 10, 4, ['#a03030', '#3050a0', '#30803a'][k]); } break; }
    case 'whip': { for (let i = 0; i < 18; i++) px(4 + i, cy + Math.round(Math.sin(i / 3) * 2), 1, 1, i % 3 ? col : shade(col, 1.4)); grip(4); break; }
    case 'wire': { grip(3); for (let i = 0; i < 20; i++) px(3 + i, cy + Math.round(Math.sin(i / 2) * 1.5), 1, 1, col + 'aa'); break; }
    case 'floatblades': { for (let k = 0; k < 3; k++) px(6 + k * 5, cy - 6 + k * 5, 4, 1, col); break; }
    case 'umbrella': { px(0, cy - 1, 16, 1, '#5a3a22'); for (let i = 0; i < 8; i++) px(14 - i, cy - 6 + i * 0.2 | 0, 1, 12 - i * 1.4 | 0, i % 2 ? col : shade(col, 1.3)); break; }
    case 'lute': { g.fillStyle = col; g.beginPath(); g.ellipse(6, cy, 5, 4, 0, 0, 7); g.fill(); px(10, cy - 1, 10, 2, shade(col, 0.6)); px(5, cy - 1, 2, 2, '#2a1a0a'); break; }
    case 'key': { px(0, cy - 3, 6, 6, col); px(2, cy - 1, 2, 2, '#0008'); px(6, cy - 1, 14, 2, col); px(16, cy + 1, 2, 3, col); px(19, cy + 1, 1, 4, col); break; }
    default: px(0, cy - 1, 14, 2, col);
  }
  if (glow) { const gl = document.createElement('canvas'); gl.width = L; gl.height = H; const gg = gl.getContext('2d'); gg.shadowColor = glow; gg.shadowBlur = 4; gg.drawImage(c, 0, 0); gg.globalCompositeOperation = 'source-atop'; gg.fillStyle = glow + '30'; gg.fillRect(0, 0, L, H); wCache.set(key, gl); return gl; }
  wCache.set(key, c); return c;
}

// ---------- monsters: procedurally assembled per sprite archetype, colored by element / family
const EL_COL = { fire: '#e0502a', ice: '#7ac8f0', thunder: '#e8d040', wind: '#6ad090', earth: '#a07a4a', water: '#3a80d0', holy: '#f0e0a0', dark: '#7a3aa0', void: '#5a4ab0' };
const mCache = new Map();
export function monsterSprite(d, frame = 0) {
  const key = d.sprite + (d.fam || '') + (d.el || '') + frame + (d.boss ? 'B' : '') + (d.elite ? 'E' : '');
  if (mCache.has(key)) return mCache.get(key);
  let h = 0; for (const ch of (d.fam || 'x')) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const base = EL_COL[d.el] || `hsl(${h % 360},40%,${40 + (h >> 8) % 15}%)`;
  const S = 24, c = document.createElement('canvas'); c.width = S; c.height = S; const g = c.getContext('2d');
  const px = (x, y, w, hh, col) => { g.fillStyle = col; g.fillRect(x, y, w, hh); };
  const col = base.startsWith('#') ? base : base; const dk = base.startsWith('#') ? shade(base, 0.6) : `hsl(${h % 360},40%,25%)`; const lt = base.startsWith('#') ? shade(base, 1.4) : `hsl(${h % 360},50%,65%)`;
  const bob = frame % 2;
  const eyes = (x, y, cc = '#fff', gap = 4) => { px(x, y, 2, 2, cc); px(x + gap, y, 2, 2, cc); px(x + 1, y + 1, 1, 1, '#000'); px(x + gap + 1, y + 1, 1, 1, '#000'); };
  switch (d.sprite) {
    case 'blob': g.fillStyle = col; g.beginPath(); g.ellipse(12, 16 - bob, 8 + bob, 6 - bob, 0, 0, 7); g.fill(); px(7, 12 - bob, 4, 2, lt); eyes(9, 14 - bob); break;
    case 'beast': px(4, 11 + bob, 15, 7, col); px(16, 8, 6, 6, col); px(4, 11 + bob, 15, 1, lt); px(5, 18, 2, 4 - bob, dk); px(15, 18, 2, 3 + bob, dk); px(2, 10, 3, 2, col); px(19, 6, 2, 2, col); px(19, 10, 1, 1, '#f44'); px(21, 12, 2, 1, '#fff'); break;
    case 'humanoid': px(8, 4, 8, 7, col); px(7, 11, 10, 8, dk); px(7, 11, 10, 1, lt); px(8, 19, 3, 4 - bob, dk); px(13, 19, 3, 3 + bob, dk); eyes(9, 6, '#ff4'); px(17, 12, 2, 7, '#aaa'); break;
    case 'undead': px(8, 3, 8, 8, '#d8d4c8'); px(9, 6, 2, 2, '#000'); px(13, 6, 2, 2, '#000'); px(10, 9, 4, 1, '#000'); px(9, 11, 6, 8, '#bcb8ac'); for (let i = 0; i < 3; i++) px(9, 12 + i * 2, 6, 1, '#7a766c'); px(9, 19, 2, 4, '#bcb8ac'); px(13, 19, 2, 4, '#bcb8ac'); px(9, 6, 1, 1, col); break;
    case 'flyer': px(9, 9 + bob, 6, 6, col); const wy = bob ? 6 : 11; px(2, wy, 7, 3, dk); px(15, wy, 7, 3, dk); eyes(9, 10 + bob, '#f44', 3); break;
    case 'bug': px(7, 10, 10, 8, col); px(10, 7, 4, 4, dk); for (let i = 0; i < 3; i++) { px(4, 11 + i * 3 + bob, 3, 1, dk); px(17, 11 + i * 3 - bob, 3, 1, dk); } eyes(10, 8, '#f44', 2); break;
    case 'golem': px(5, 6, 14, 14, col); px(5, 6, 14, 2, lt); px(2, 9, 4, 9, dk); px(18, 9, 4, 9, dk); px(7, 20, 4, 3, dk); px(13, 20, 4, 3, dk); px(9, 10, 6, 2, '#ffe060'); break;
    case 'demon': px(7, 6, 10, 9, col); px(6, 3, 2, 4, '#eee'); px(16, 3, 2, 4, '#eee'); px(6, 15, 12, 6, dk); px(2, 8, 5, 8, shade('#401020', 1)); px(17, 8, 5, 8, '#401020'); eyes(9, 9, '#ff0'); px(9, 21, 2, 2, dk); px(13, 21, 2, 2, dk); break;
    case 'spirit': g.fillStyle = col + ''; g.globalAlpha = 0.85; g.beginPath(); g.ellipse(12, 11 - bob, 6, 7, 0, 0, 7); g.fill(); px(7, 16 - bob, 10, 4, col); px(8, 20 - bob, 2, 2, col); px(13, 20 - bob, 2, 2, col); g.globalAlpha = 1; eyes(9, 9 - bob, '#fff'); break;
    case 'plant': px(10, 8, 4, 14, '#5a3a20'); px(4, 4, 16, 9, '#2a6a2a'); px(5, 3, 14, 3, '#3a8a3a'); px(2, 10, 6, 3, '#5a3a20'); px(16, 9, 6, 3, '#5a3a20'); eyes(9, 13, '#ff6'); break;
    case 'chest': px(4, 9, 16, 12, '#8a5a2a'); px(4, 9, 16, 3, '#a87a3a'); px(4, 12 + bob, 16, 2, '#200'); for (let i = 0; i < 5; i++) px(5 + i * 3, 12 + bob, 1, 2, '#fff'); px(11, 15, 2, 3, '#e0c060'); break;
    case 'angel': px(9, 4, 6, 6, '#f6e0c8'); px(8, 1, 8, 1, '#ffe060'); px(8, 10, 8, 10, '#e8e8f0'); px(1, 7 + bob, 7, 8, '#ffffff'); px(16, 7 + bob, 7, 8, '#ffffff'); px(10, 6, 1, 1, '#22a'); px(13, 6, 1, 1, '#22a'); break;
    case 'dragon': px(3, 10, 16, 9, col); px(16, 5, 7, 7, col); px(3, 10, 16, 2, lt); px(0, 6 + bob, 7, 6, dk); px(8, 4 + bob, 7, 6, dk); px(20, 7, 2, 2, '#ff0'); px(4, 19, 3, 4, dk); px(14, 19, 3, 4, dk); break;
    case 'eye': g.fillStyle = '#e8e0f0'; g.beginPath(); g.arc(12, 12, 9, 0, 7); g.fill(); g.fillStyle = col; g.beginPath(); g.arc(12, 12, 5, 0, 7); g.fill(); px(11, 10, 3, 4, '#000'); for (let i = 0; i < 5; i++) px(4 + i * 4, 20 + (i + bob) % 2, 1, 3, dk); break;
    default: px(6, 6, 12, 12, col);
  }
  if (d.elite) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(255,200,60,.18)'; g.fillRect(0, 0, S, S); g.globalCompositeOperation = 'source-over'; }
  mCache.set(key, c); return c;
}
export { EL_COL };
