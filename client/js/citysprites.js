// City & interior art: district floors, building facades (varied per building), landmarks, decor, furniture.
import { shade } from './sprites.js';
const rnd = (x, y, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 982451653) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
export const FLOORS = { 23: ['#d8d4cc', '#cfcbc2', 'marble'], 24: ['#8a8478', '#80796e', 'cobble'], 25: ['#6a5e50', '#5e5246', 'rubble'], 26: ['#9a6e44', '#8e643c', 'plank'], 27: ['#8a2a34', '#80242e', 'carpet'], 28: ['#6e6c70', '#646266', 'stone'], 30: ['#a8a29a', '#9a948c', 'steps'], 31: ['#6a3a2a', '#5e3224', 'mat'] };
export function drawFloor(g, v, px, py, x, y, tint) {
  const [a, b, kind] = FLOORS[v] || FLOORS[24]; const r = rnd(x, y); const c1 = tint || a;
  g.fillStyle = r < 0.5 ? c1 : shade(c1, 0.95); g.fillRect(px, py, 16, 16);
  switch (kind) {
    case 'marble': g.fillStyle = shade(c1, 0.88); g.fillRect(px, py, 16, 1); g.fillRect(px, py, 1, 16); if (r > 0.7) { g.fillStyle = shade(c1, 0.8); g.fillRect(px + 3, py + 4 + (r * 8 | 0), 7, 1); } g.fillStyle = shade(c1, 1.06); g.fillRect(px + 1, py + 1, 14, 1); break;
    case 'cobble': g.fillStyle = shade(c1, 0.75); for (let j = 0; j < 4; j++) g.fillRect(px, py + j * 4, 16, 1); for (let j = 0; j < 4; j++) g.fillRect(px + ((j % 2) * 4 + (x * 3) % 8) % 16, py + j * 4, 1, 4); g.fillStyle = shade(c1, 1.1); g.fillRect(px + (r * 12 | 0), py + 1 + (r * 3 | 0) * 4, 3, 1); break;
    case 'rubble': g.fillStyle = shade(c1, 0.7); for (let k = 0; k < 4; k++) g.fillRect(px + (rnd(x, y, k) * 14 | 0), py + (rnd(x, y, k + 9) * 14 | 0), 2, 1); if (r > 0.85) { g.fillStyle = '#3a3a30'; g.fillRect(px + 4, py + 9, 5, 2); } if (r < 0.08) { g.fillStyle = 'rgba(60,80,40,.5)'; g.fillRect(px + 2, py + 2, 6, 4); } break;
    case 'plank': g.fillStyle = shade(c1, 0.78); for (let j = 0; j < 4; j++) g.fillRect(px, py + j * 4 + 3, 16, 1); g.fillRect(px + ((y * 7) % 3) * 5 + 2, py, 1, 16); break;
    case 'carpet': g.fillStyle = shade(c1, 1.15); if ((x + y) % 2 === 0) g.fillRect(px + 6, py + 6, 4, 4); g.fillStyle = shade(c1, 0.85); g.fillRect(px, py + 15, 16, 1); break;
    case 'stone': g.fillStyle = shade(c1, 0.82); g.fillRect(px, py, 16, 1); g.fillRect(px, py, 1, 16); g.fillRect(px + 8, py + 8, 8, 1); g.fillRect(px + 8, py + 8, 1, 8); break;
    case 'steps': for (let j = 0; j < 4; j++) { g.fillStyle = shade(c1, 1.1 - j * 0.07); g.fillRect(px, py + j * 4, 16, 3); g.fillStyle = shade(c1, 0.7); g.fillRect(px, py + j * 4 + 3, 16, 1); } break;
    case 'mat': g.fillStyle = '#c0a060'; g.fillRect(px + 2, py + 3, 12, 10); g.fillStyle = '#8a3a2a'; g.fillRect(px + 3, py + 4, 10, 8); g.fillStyle = 'rgba(255,240,200,.35)'; g.fillRect(px, py, 16, 16); break;
  }
}
export function drawIWall(g, px, py, col, below) {
  g.fillStyle = shade(col, 0.6); g.fillRect(px, py, 16, 16);
  if (below) { g.fillStyle = col; g.fillRect(px, py + 4, 16, 12); g.fillStyle = shade(col, 1.2); g.fillRect(px, py + 4, 16, 1); g.fillStyle = shade(col, 0.85); for (let k = 8; k < 16; k += 4) g.fillRect(px, py + k, 16, 1); g.fillStyle = shade(col, 0.5); g.fillRect(px, py + 15, 16, 1); }
}
const ICON = { guildhall: '⚔', smithy: '⚒', shop: '🛍', tavern: '🍺', inn: '🛏', bank: '¤', church: '✝', library: '📖', casino: '♦', theater: '🎭', hotel: '★', mansion: '❖', lab: '⚗', academy: '✦', workshop: '⚙', warehouse: '▦', arena: '⚔', clinic: '✚', bathhouse: '♨', station: '⇄', office: '✉', castlehall: '♛', museum: '⌂', observatory: '☾', blackmarket: '☠', shack: '', house: '' };
export const windows = []; // collected during prerender for night glow: [x,y,w,h,col]
// Building facade: deterministic variety from p.var (roof shape, windows, chimneys, balconies, awnings)
export function drawBuilding(g, p, S = 16) {
  const x = p.x * S, y = p.y * S, w = p.w * S, h = p.h * S; const v = p.var || 0; const wall = p.wall, roof = p.roof;
  const roofH = Math.round(h * (0.42 + (v % 4) * 0.04)); const style = v % 5; const rich = p.dtype === 'rich', slum = p.dtype === 'slum';
  // shadow
  g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(x + 3, y + h - 2, w, 4);
  // facade
  g.fillStyle = wall; g.fillRect(x, y + roofH - 2, w, h - roofH + 2);
  g.fillStyle = shade(wall, 0.85); for (let yy = y + roofH + 3; yy < y + h; yy += slum ? 3 : 5) g.fillRect(x, yy, w, 1);
  if (slum) { g.fillStyle = shade(wall, 0.65); for (let k = 0; k < 4; k++) g.fillRect(x + ((v * 7 + k * 13) % (w - 6)), y + roofH + ((v + k * 5) % Math.max(1, h - roofH - 6)), 5, 3); }
  g.fillStyle = shade(wall, 0.6); g.fillRect(x, y + roofH - 2, 2, h - roofH + 2); g.fillRect(x + w - 2, y + roofH - 2, 2, h - roofH + 2);
  if (rich) { g.fillStyle = shade(wall, 1.12); for (let k = x + 4; k < x + w - 4; k += 12) g.fillRect(k, y + roofH, 2, h - roofH); g.fillStyle = '#c8a850'; g.fillRect(x, y + roofH - 2, w, 2); }
  // roof
  g.fillStyle = roof;
  if (style === 0 || style === 3) { for (let k = 0; k < roofH; k++) { const inset = Math.round(k * 0.0); g.fillStyle = shade(roof, 1.15 - k / roofH * 0.35); g.fillRect(x - 2 + inset, y + k, w + 4 - inset * 2, 1); } g.fillStyle = shade(roof, 0.7); for (let k = x; k < x + w; k += 4) g.fillRect(k, y, 1, roofH - 2); g.fillStyle = shade(roof, 1.35); g.fillRect(x - 2, y, w + 4, 2); }
  else if (style === 1) { for (let k = 0; k < roofH; k++) { const inset = Math.round((roofH - k) * (w / 2) / roofH * 0.55); g.fillStyle = shade(roof, 0.8 + k / roofH * 0.4); g.fillRect(x - 2 + inset, y + k, w + 4 - inset * 2, 1); } }
  else if (style === 2) { g.fillStyle = shade(roof, 0.9); g.fillRect(x - 1, y + 2, w + 2, roofH - 2); g.fillStyle = shade(roof, 1.25); g.fillRect(x - 1, y + 2, w + 2, 2); g.fillStyle = shade(roof, 0.6); g.fillRect(x + 3, y + 5, w - 6, 1); }
  else { g.fillStyle = roof; g.beginPath(); g.ellipse(x + w / 2, y + roofH, w / 2 + 1, roofH, 0, Math.PI, 0); g.fill(); g.fillStyle = shade(roof, 1.3); g.fillRect(x + w / 2 - 1, y - 3, 2, 5); }
  // chimneys / spires
  if (v % 3 === 0 && !rich) { g.fillStyle = shade(wall, 0.5); g.fillRect(x + w - 10, y - 6, 5, 9); g.fillStyle = '#2a2420'; g.fillRect(x + w - 10, y - 6, 5, 2); }
  if (rich && v % 2) { g.fillStyle = shade(roof, 0.8); g.fillRect(x + 3, y - 8, 4, 10); g.fillStyle = '#e0c060'; g.fillRect(x + 4, y - 11, 2, 3); }
  // windows (rows), recorded for night glow
  const rows = Math.max(1, Math.floor((h - roofH - 12) / 12)); const cols = Math.max(1, Math.floor(w / 14));
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const wx = x + 5 + c * Math.floor((w - 10) / cols), wy = y + roofH + 4 + r * 12; if (Math.abs(wx + 3 - (p.door[0] * S + 8)) < 8 && r === rows - 1) continue; g.fillStyle = '#2a2430'; g.fillRect(wx - 1, wy - 1, 8, 8); g.fillStyle = slum ? '#5a6070' : '#8ab0d0'; g.fillRect(wx, wy, 6, 6); g.fillStyle = shade(wall, 0.7); g.fillRect(wx + 2, wy, 1, 6); g.fillRect(wx, wy + 2, 6, 1); if (rich) { g.fillStyle = '#c8a850'; g.fillRect(wx - 1, wy + 6, 8, 1); } windows.push([wx, wy, 6, 6, slum ? 0.45 : 1]); }
  // door
  const dx = p.door[0] * S, dy = p.door[1] * S; g.fillStyle = shade(wall, 0.45); g.fillRect(dx + 2, dy + 1, 12, 15); g.fillStyle = rich ? '#6a2a1a' : slum ? '#4a3a2a' : '#7a4a2a'; g.fillRect(dx + 3, dy + 2, 10, 14); g.fillStyle = '#e0c060'; g.fillRect(dx + 10, dy + 9, 1, 2);
  // awning for shops/taverns
  if (['shop', 'tavern', 'smithy', 'blackmarket'].includes(p.t)) { const aw = ['#c03a3a', '#3a7ac0', '#3a9a5a', '#c09a3a'][v % 4]; for (let k = 0; k < 14; k++) { g.fillStyle = k % 4 < 2 ? aw : '#f0e8d8'; g.fillRect(dx - 6 + k * 2, dy - 4, 2, 4); } }
  // sign board with icon
  if (!p.home && ICON[p.t]) { const sx = dx + 2, sy = dy - 13; g.fillStyle = '#4a3020'; g.fillRect(sx - 1, sy - 1, 14, 12); g.fillStyle = '#e8d8b0'; g.fillRect(sx, sy, 12, 10); g.fillStyle = '#3a2a1a'; g.font = '9px sans-serif'; g.textBaseline = 'top'; g.fillText(ICON[p.t], sx + 1, sy); }
  if (p.city === 'lumina' && rich) { g.fillStyle = ['#ff40a0', '#40e0ff', '#ffd040'][v % 3]; g.fillRect(x + 2, y + roofH + 1, w - 4, 1); windows.push([x + 2, y + roofH + 1, w - 4, 1, 2]); }
}
export function drawLandmark(g, p, S = 16) {
  const x = p.x * S, y = p.y * S, w = p.w * S, h = p.h * S; g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(x + 4, y + h - 3, w, 6);
  switch (p.lk) {
    case 'castle': { g.fillStyle = '#e8e4ec'; g.fillRect(x, y + h * 0.35, w, h * 0.65); for (let k = 0; k < 5; k++) { const tx = x + k * (w - 24) / 4; g.fillStyle = '#f4f0f8'; g.fillRect(tx, y + 10, 24, h - 10); g.fillStyle = '#3a4a9a'; g.beginPath(); g.moveTo(tx - 2, y + 12); g.lineTo(tx + 12, y - 14); g.lineTo(tx + 26, y + 12); g.fill(); g.fillStyle = '#e0c060'; g.fillRect(tx + 11, y - 20, 2, 7); } g.fillStyle = '#c8a850'; g.fillRect(x, y + h * 0.35, w, 3); for (let k = x + 6; k < x + w; k += 10) { g.fillStyle = '#3a3a50'; g.fillRect(k, y + h * 0.5, 4, 8); windows.push([k, y + h * 0.5, 4, 8, 1]); } g.fillStyle = '#5a3a2a'; g.fillRect(x + w / 2 - 12, y + h - 26, 24, 26); g.fillStyle = '#c8a850'; g.fillRect(x + w / 2 - 12, y + h - 26, 24, 3); break; }
    case 'lighthouse': { g.fillStyle = '#7a7a80'; g.fillRect(x, y + h - 20, w, 20); for (let k = 0; k < h - 30; k += 12) { g.fillStyle = (k / 12) % 2 ? '#d03030' : '#f0f0f0'; g.fillRect(x + 14 - k * 0.04, y + 20 + k, w - 28 + k * 0.08, 12); } g.fillStyle = '#3a3a40'; g.fillRect(x + 10, y + 6, w - 20, 16); g.fillStyle = '#ffe080'; g.fillRect(x + 14, y + 9, w - 28, 10); windows.push([x + 14, y + 9, w - 28, 10, 3]); g.fillStyle = '#d03030'; g.beginPath(); g.moveTo(x + 8, y + 6); g.lineTo(x + w / 2, y - 8); g.lineTo(x + w - 8, y + 6); g.fill(); break; }
    case 'forge': { g.fillStyle = '#3a2e2a'; g.fillRect(x, y + 20, w, h - 20); g.fillStyle = '#2a2220'; for (let k = 0; k < 3; k++) g.fillRect(x + 20 + k * 70, y - 30, 22, 60); g.fillStyle = '#5a4a44'; g.fillRect(x, y + 20, w, 4); g.fillStyle = '#ff6a10'; g.fillRect(x + w / 2 - 30, y + h - 40, 60, 30); g.fillStyle = '#ffd060'; g.fillRect(x + w / 2 - 20, y + h - 32, 40, 14); windows.push([x + w / 2 - 30, y + h - 40, 60, 30, 3]); g.fillStyle = '#8a6a3a'; for (let k = x; k < x + w; k += 18) g.fillRect(k, y + 34, 10, 3); break; }
    case 'magetower': { g.fillStyle = '#4a5ab0'; g.fillRect(x + 20, y + 30, w - 40, h - 30); g.fillStyle = '#6a7ad0'; g.fillRect(x + 24, y + 30, 6, h - 30); g.fillStyle = '#3a2a8a'; g.beginPath(); g.moveTo(x + 10, y + 34); g.lineTo(x + w / 2, y - 40); g.lineTo(x + w - 10, y + 34); g.fill(); g.fillStyle = '#a0f0ff'; g.beginPath(); g.arc(x + w / 2, y - 44, 7, 0, 7); g.fill(); windows.push([x + w / 2 - 6, y - 50, 12, 12, 3]); for (let k = y + 50; k < y + h - 20; k += 22) { g.fillStyle = '#c0e0ff'; g.fillRect(x + w / 2 - 4, k, 8, 12); windows.push([x + w / 2 - 4, k, 8, 12, 1]); } break; }
    case 'clocktower': { g.fillStyle = '#c0a050'; g.fillRect(x + 22, y + 10, w - 44, h - 10); g.fillStyle = '#e0c060'; g.fillRect(x + 22, y + 10, 4, h - 10); g.fillStyle = '#5a1a3a'; g.beginPath(); g.moveTo(x + 16, y + 14); g.lineTo(x + w / 2, y - 26); g.lineTo(x + w - 16, y + 14); g.fill(); g.fillStyle = '#f8f0d8'; g.beginPath(); g.arc(x + w / 2, y + 36, 14, 0, 7); g.fill(); g.strokeStyle = '#2a1a1a'; g.lineWidth = 2; g.beginPath(); g.moveTo(x + w / 2, y + 36); g.lineTo(x + w / 2, y + 26); g.moveTo(x + w / 2, y + 36); g.lineTo(x + w / 2 + 8, y + 38); g.stroke(); g.fillStyle = '#ff40a0'; g.font = 'bold 9px sans-serif'; g.fillText('GRAN LUX', x + 6, y + h - 26); windows.push([x + 4, y + h - 34, w - 8, 10, 2]); break; }
    case 'temple': { // white marble cathedral with a golden dome
      g.fillStyle = '#e8e4dc'; g.fillRect(x + 6, y + h * 0.4, w - 12, h * 0.6); g.fillStyle = '#d0c8b8'; for (let k = 0; k < 6; k++) g.fillRect(x + 14 + k * (w - 34) / 5, y + h * 0.45, 6, h * 0.55 - 6);
      g.fillStyle = '#c8a040'; g.beginPath(); g.arc(x + w / 2, y + h * 0.42, w * 0.22, Math.PI, 0); g.fill(); g.fillStyle = '#f0d070'; g.fillRect(x + w / 2 - 2, y + h * 0.1, 4, h * 0.12); g.fillRect(x + w / 2 - 7, y + h * 0.14, 14, 3);
      g.fillStyle = '#5a4a30'; g.fillRect(x + w / 2 - 8, y + h - 22, 16, 22); break; }
    case 'icepalace': { // translucent ice towers
      for (const [ox, tw, th] of [[0.1, 0.16, 0.7], [0.32, 0.36, 0.95], [0.74, 0.16, 0.7]]) { g.fillStyle = 'rgba(170,220,255,.85)'; g.fillRect(x + w * ox, y + h * (1 - th), w * tw, h * th); g.fillStyle = 'rgba(230,250,255,.9)'; g.fillRect(x + w * ox + 3, y + h * (1 - th), 3, h * th);
        g.fillStyle = '#e8f8ff'; g.beginPath(); g.moveTo(x + w * ox - 2, y + h * (1 - th)); g.lineTo(x + w * (ox + tw / 2), y + h * (1 - th) - 18); g.lineTo(x + w * (ox + tw) + 2, y + h * (1 - th)); g.fill(); }
      g.fillStyle = 'rgba(120,180,230,.9)'; g.fillRect(x + w / 2 - 10, y + h - 24, 20, 24); break; }
    case 'pagoda': { // five-tiered vermilion tower
      for (let k = 0; k < 5; k++) { const ty = y + h - (k + 1) * h / 5.6, tw = w * (1 - k * 0.13); g.fillStyle = '#b02a20'; g.fillRect(x + (w - tw * 0.7) / 2, ty, tw * 0.7, h / 5.6); g.fillStyle = '#2a3a3a'; g.beginPath(); g.moveTo(x + (w - tw) / 2 - 6, ty + 4); g.lineTo(x + w / 2, ty - 10); g.lineTo(x + (w + tw) / 2 + 6, ty + 4); g.fill(); }
      g.fillStyle = '#e0c040'; g.fillRect(x + w / 2 - 2, y, 4, 22); break; }
    case 'worldtree': { // young sacred tree with glowing leaves
      g.fillStyle = '#5a3a22'; g.fillRect(x + w / 2 - 12, y + h * 0.45, 24, h * 0.55); g.fillStyle = '#6a4a2a'; g.fillRect(x + w / 2 - 12, y + h * 0.45, 6, h * 0.55);
      for (const [cx, cy, r] of [[0.5, 0.3, 0.32], [0.25, 0.4, 0.22], [0.75, 0.4, 0.22], [0.5, 0.12, 0.2]]) { g.fillStyle = '#2f7a3a'; g.beginPath(); g.arc(x + w * cx, y + h * cy, w * r, 0, 7); g.fill(); g.fillStyle = 'rgba(160,255,170,.35)'; g.beginPath(); g.arc(x + w * cx - 6, y + h * cy - 6, w * r * 0.5, 0, 7); g.fill(); } break; }
    case 'pyramid': { // stepped sandstone pyramid / palace
      for (let k = 0; k < 6; k++) { const tw = w * (1 - k * 0.15); g.fillStyle = k % 2 ? '#d8b878' : '#c8a868'; g.fillRect(x + (w - tw) / 2, y + h - (k + 1) * h / 6, tw, h / 6); }
      g.fillStyle = '#3a6ad0'; g.fillRect(x + w / 2 - 6, y + 2, 12, 10); g.fillStyle = '#3a2a1a'; g.fillRect(x + w / 2 - 8, y + h - 20, 16, 20); break; }
    case 'volcano': { // smoking crater with lava glow
      g.fillStyle = '#3a2a26'; g.beginPath(); g.moveTo(x, y + h); g.lineTo(x + w * 0.38, y + h * 0.18); g.lineTo(x + w * 0.62, y + h * 0.18); g.lineTo(x + w, y + h); g.fill();
      g.fillStyle = '#ff6a20'; g.fillRect(x + w * 0.4, y + h * 0.16, w * 0.2, 6); for (let k = 0; k < 3; k++) { g.fillStyle = '#e04010'; g.fillRect(x + w * (0.45 + k * 0.04), y + h * (0.2 + k * 0.18), 4, h * 0.14); }
      g.fillStyle = 'rgba(90,80,80,.6)'; for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(x + w * 0.5 + k * 6, y + h * 0.1 - k * 10, 10 + k * 3, 0, 7); g.fill(); } break; }
    case 'windmill': { g.fillStyle = '#d8c4a0'; g.beginPath(); g.moveTo(x + 18, y + h); g.lineTo(x + 30, y + 30); g.lineTo(x + w - 30, y + 30); g.lineTo(x + w - 18, y + h); g.fill(); g.fillStyle = '#a03a2a'; g.beginPath(); g.moveTo(x + 24, y + 32); g.lineTo(x + w / 2, y + 14); g.lineTo(x + w - 24, y + 32); g.fill(); g.strokeStyle = '#6a4a2a'; g.lineWidth = 3; g.save(); g.translate(x + w / 2, y + 32); for (let k = 0; k < 4; k++) { g.rotate(Math.PI / 2); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -36); g.stroke(); g.fillStyle = '#f0e8d8'; g.fillRect(2, -34, 8, 26); } g.restore(); break; }
  }
}
// Small decor & furniture (1x1 unless noted)
import { drawSlumProp, SLUM_PROPS } from './slumsprites.js';
export function drawDecor(g, p, S = 16) {
  if (SLUM_PROPS.has(p.k)) return drawSlumProp(g, p, S);
  const x = p.x * S, y = p.y * S; const c = (col, a, b, w, h) => { g.fillStyle = col; g.fillRect(x + a, y + b, w, h); };
  switch (p.k) {
    case 'lamp': case 'brokenlamp': c('#2a2a30', 7, 2, 2, 14); c(p.k === 'lamp' ? '#ffe8a0' : '#5a5a50', 5, 0, 6, 4); break;
    case 'neon': c('#2a2a30', 7, 4, 2, 12); c(['#ff40a0', '#40e0ff', '#ffd040', '#a060ff'][p.v || 0], 3, 0, 10, 5); break;
    case 'statue': c('#9a9aa0', 4, 10, 8, 6); c('#c0c0c8', 6, 1, 4, 10); c('#e0e0e8', 7, 0, 2, 3); break;
    case 'flowerbed': c('#4a7a3a', 1, 8, 14, 7); c(['#ff8080', '#ffe060', '#c080ff', '#ffffff'][p.v || 0], 3, 9, 2, 2); c('#ff8080', 9, 11, 2, 2); break;
    case 'bench': c('#7a5a3a', 1, 8, 14, 3); c('#5a3a2a', 2, 11, 2, 4); c('#5a3a2a', 12, 11, 2, 4); break;
    case 'stall': c('#7a5a3a', 0, 8, 32, 7); for (let k = 0; k < 16; k++) c(k % 4 < 2 ? ['#c03a3a', '#3a7ac0', '#d0a030'][p.v % 3] : '#f0e8d8', k * 2, 2, 2, 6); c('#e0a040', 4, 6, 4, 3); c('#80c040', 12, 6, 4, 3); c('#c04040', 22, 6, 4, 3); break;
    case 'barrel': c('#7a4a2a', 3, 4, 10, 12); c('#4a3a2a', 3, 7, 10, 1); c('#4a3a2a', 3, 12, 10, 1); break;
    case 'crate': c('#9a7040', 2, 4, 12, 12); c('#6a4a2a', 2, 4, 12, 1); c('#6a4a2a', 7, 4, 1, 12); break;
    case 'trash': c('#4a4a40', 3, 10, 9, 5); c('#6a6a50', 5, 9, 3, 2); break;
    case 'fire': c('#3a3030', 3, 12, 10, 4); c('#ff7020', 5, 6, 6, 7); c('#ffd060', 7, 8, 2, 4); break;
    case 'well': c('#7a7a80', 2, 6, 12, 10); c('#2a4a8a', 4, 8, 8, 4); c('#5a3a2a', 2, 0, 2, 7); c('#5a3a2a', 12, 0, 2, 7); c('#8a2a2a', 1, 0, 14, 2); break;
    case 'signpost': c('#6a4a2a', 7, 4, 2, 12); c('#c8a870', 2, 3, 12, 4); break;
    case 'pipe': c('#6a5a4a', 0, 6, 16, 4); c('#8a7a6a', 0, 6, 16, 1); c('#4a3a2a', 7, 5, 3, 6); break;
    case 'steamvent': c('#4a4a4a', 4, 11, 8, 4); break;
    case 'crystal': c('#6ae0ff', 6, 2, 4, 12); c('#c0f8ff', 7, 3, 1, 8); break;
    case 'floatlight': c('#c0e8ff', 6, 2, 4, 4); break;
    case 'banner': c('#3a3a40', 7, 0, 2, 16); c('#3a4a9a', 9, 1, 6, 9); c('#e0c060', 10, 4, 4, 2); break;
    case 'net': c('rgba(200,190,160,.6)', 1, 6, 14, 8); break;
    case 'hay': c('#d8b860', 2, 8, 12, 7); c('#b89840', 2, 8, 12, 1); break;
    case 'fountain': g.fillStyle = '#9a9aa8'; g.beginPath(); g.ellipse(x + 24, y + 26, 22, 14, 0, 0, 7); g.fill(); g.fillStyle = '#4a8ad8'; g.beginPath(); g.ellipse(x + 24, y + 26, 18, 10, 0, 0, 7); g.fill(); c('#c0c0d0', 21, 8, 6, 18); c('#e0f0ff', 22, 4, 4, 6); break;
    case 'stop': c('#3a3a40', 7, 0, 2, 16); c('#2a6ac0', 2, 0, 12, 7); c('#ffffff', 4, 2, 8, 1); c('#ffffff', 4, 4, 6, 1); break;
    case 'node': { const col = { herb: '#5ac04a', wood: '#8a5a2a', gem: '#9ab0c8', crystal: '#7ae0ff' }[p.mat] || '#fff'; if (p.mat === 'herb') { c('#3a7a2a', 4, 8, 8, 8); c(col, 6, 5, 2, 4); c('#ffe060', 9, 6, 2, 2); } else if (p.mat === 'wood') { c('#5a3a1a', 2, 9, 12, 6); c('#a07040', 3, 9, 3, 3); } else { c('#6a6a70', 2, 6, 12, 10); c(col, 5, 8, 3, 3); c(col, 9, 11, 2, 2); } break; }
    // furniture / interior props
    case 'counter': case 'bar': for (let i = 0; i < p.w; i++) { g.fillStyle = '#7a4a2a'; g.fillRect(x + i * S, y + 4, S, 12); g.fillStyle = '#a06a3a'; g.fillRect(x + i * S, y + 4, S, 3); } if (p.k === 'bar') for (let i = 0; i < p.w; i += 2) c('#d0c080', i * S + 4, 0, 3, 5); break;
    case 'table': c('#8a5a30', 2, 4, p.w * S - 4, p.h * S - 8); c('#a8784a', 2, 4, p.w * S - 4, 3); c('#e0e0e0', 6, 9, 4, 3); c('#c04040', 18, 12, 3, 3); break;
    case 'bed': c('#6a4a2a', 0, 2, 32, 14); c('#e8e8f0', 2, 3, 8, 11); c(['#4a6ab0', '#b04a4a', '#4a9a5a', '#8a5ab0'][p.v || 0], 10, 3, 21, 11); break;
    case 'shelf': c('#6a4a2a', 1, 0, 14, 16); for (let k = 0; k < 3; k++) { c('#4a3020', 1, 4 + k * 5, 14, 1); c(['#c04040', '#40a0c0', '#e0c040'][k], 3, 1 + k * 5, 3, 3); c('#80c060', 9, 1 + k * 5, 3, 3); } break;
    case 'bookcase': for (let i = 0; i < p.w; i++) { g.fillStyle = '#5a3a20'; g.fillRect(x + i * S, y, S, S); for (let k = 0; k < 3; k++) for (let b = 0; b < 4; b++) { g.fillStyle = ['#8a2a2a', '#2a4a8a', '#2a6a3a', '#8a6a2a'][(b + k + i) % 4]; g.fillRect(x + i * S + 2 + b * 3, y + 1 + k * 5, 2, 4); } } break;
    case 'forge': c('#3a3030', 0, 0, 48, 32); c('#ff6a10', 8, 10, 32, 14); c('#ffd060', 14, 14, 20, 6); c('#2a2220', 18, -12, 12, 14); break;
    case 'anvil': c('#4a4a52', 3, 6, 10, 4); c('#5a5a62', 1, 5, 14, 2); c('#3a3a40', 6, 10, 4, 6); break;
    case 'weaponrack': c('#6a4a2a', 1, 2, 14, 12); c('#c0c8d0', 3, 0, 1, 14); c('#c0c8d0', 7, 0, 1, 14); c('#c0c8d0', 11, 0, 1, 14); break;
    case 'oresack': c('#8a7a5a', 3, 6, 10, 10); c('#9ab0c8', 6, 5, 4, 3); break;
    case 'display': c('#c8a870', 3, 8, 10, 8); c('#e0f0ff', 4, 2, 8, 7); c('#ffd060', 7, 4, 2, 3); break;
    case 'plant': c('#8a4a2a', 5, 10, 6, 6); c('#3a8a3a', 3, 2, 10, 9); c('#5ab04a', 6, 0, 4, 5); break;
    case 'chandelier': c('#c8a850', 4, 2, 8, 2); c('#ffe8a0', 3, 4, 2, 2); c('#ffe8a0', 11, 4, 2, 2); break;
    case 'fireplace': c('#6a5a50', 0, 0, 16, 16); c('#2a2020', 3, 6, 10, 10); c('#ff7020', 5, 10, 6, 5); break;
    case 'stage': g.fillStyle = '#6a3a2a'; g.fillRect(x, y, p.w * S, p.h * S); g.fillStyle = '#8a4a30'; for (let k = 0; k < p.w * S; k += 6) g.fillRect(x + k, y, 1, p.h * S); g.fillStyle = '#a02a3a'; g.fillRect(x, y, p.w * S, 4); break;
    case 'vault': c('#5a5a62', 0, 0, 32, 32); c('#8a8a92', 6, 6, 20, 20); c('#c8a850', 14, 14, 4, 4); break;
    case 'pillar': c('#c8c4bc', 4, 0, 8, 16); c('#e0dcd4', 4, 0, 2, 16); c('#a8a49c', 2, 0, 12, 2); break;
    case 'altar': c('#e8e0d0', 0, 4, 48, 12); c('#c8a850', 0, 4, 48, 2); c('#ffe8a0', 22, 0, 4, 6); break;
    case 'pew': c('#6a4020', 0, 6, p.w * S, 6); c('#8a5a30', 0, 6, p.w * S, 2); break;
    case 'desk': c('#7a5030', 0, 5, 32, 9); c('#f0e8d8', 6, 4, 8, 4); c('#2a2a2a', 20, 3, 2, 4); break;
    case 'lectern': c('#6a4020', 5, 6, 6, 10); c('#f0e8d8', 3, 2, 10, 5); break;
    case 'globe': c('#6a4020', 6, 10, 4, 6); c('#4a8ad8', 4, 2, 8, 8); c('#5ab04a', 6, 4, 3, 3); break;
    case 'slot': c('#a02a4a', 2, 0, 12, 16); c('#ffe060', 4, 3, 8, 5); c('#ff40a0', 3, 10, 10, 2); break;
    case 'roulette': g.fillStyle = '#2a6a3a'; g.fillRect(x, y, 32, 32); g.fillStyle = '#8a2a1a'; g.beginPath(); g.arc(x + 16, y + 16, 11, 0, 7); g.fill(); g.fillStyle = '#e0c060'; g.beginPath(); g.arc(x + 16, y + 16, 4, 0, 7); g.fill(); break;
    case 'cardtable': g.fillStyle = '#1a5a2a'; g.beginPath(); g.ellipse(x + 16, y + 16, 15, 12, 0, 0, 7); g.fill(); c('#f0f0f0', 10, 12, 4, 5); c('#f0f0f0', 18, 12, 4, 5); break;
    case 'sofa': c('#7a2a3a', 0, 4, 32, 12); c('#9a3a4a', 2, 2, 28, 6); break;
    case 'piano': c('#1a1a1a', 0, 2, 32, 14); c('#f0f0f0', 2, 12, 28, 3); break;
    case 'throne': c('#c8a850', 4, 0, 24, 32); c('#8a1a2a', 8, 6, 16, 22); break;
    case 'alembic': c('#5a4a3a', 2, 10, 12, 6); c('#7ae0a0', 5, 2, 6, 8); c('#c0fff0', 6, 3, 2, 3); break;
    case 'circle': g.strokeStyle = '#a080ff'; g.lineWidth = 1; g.beginPath(); g.arc(x + 24, y + 24, 20, 0, 7); g.stroke(); g.beginPath(); for (let k = 0; k <= 5; k++) { const a = k * 4 * Math.PI / 5; g.lineTo(x + 24 + Math.cos(a) * 18, y + 24 + Math.sin(a) * 18); } g.stroke(); break;
    case 'workbench': c('#8a6a40', 0, 6, 32, 8); c('#6a6a70', 6, 3, 6, 3); c('#c0a060', 20, 2, 3, 4); break;
    case 'gear': g.strokeStyle = '#8a8a92'; g.lineWidth = 3; g.beginPath(); g.arc(x + 8, y + 8, 5, 0, 7); g.stroke(); break;
    case 'cart': c('#7a5a3a', 0, 4, 32, 8); c('#3a2a1a', 4, 10, 6, 6); c('#3a2a1a', 22, 10, 6, 6); break;
    case 'fence': c('#7a5a3a', 0, 6, 16, 3); c('#7a5a3a', 0, 11, 16, 2); c('#5a3a2a', 7, 4, 2, 12); break;
    case 'bath': g.fillStyle = '#9ab0c0'; g.fillRect(x, y, p.w * S, p.h * S); g.fillStyle = '#6ab0e0'; g.fillRect(x + 4, y + 4, p.w * S - 8, p.h * S - 8); break;
    case 'telescope': c('#4a3a2a', 10, 18, 12, 14); g.save(); g.translate(x + 16, y + 18); g.rotate(-0.8); g.fillStyle = '#c8a850'; g.fillRect(-4, -20, 8, 26); g.restore(); break;
    case 'kitchen': c('#7a7a80', 0, 2, 48, 14); c('#2a2a2a', 6, 4, 10, 4); c('#c0c0c8', 30, 4, 12, 8); break;
    case 'chest': c('#8a5a2a', 2, 6, 12, 10); c('#c8a850', 2, 9, 12, 1); c('#c8a850', 7, 10, 2, 3); break;
    case 'aquarium': c('#3a3a40', 1, 2, 14, 13); c('#4ab0e0', 2, 3, 12, 10); c('#ff8040', 5, 6, 3, 2); break;
    case 'trophy': c('#6a4a2a', 2, 0, 12, 12); c('#a08060', 4, 3, 8, 7); c('#ffffff', 5, 4, 2, 2); break;
    case 'weaponstand': c('#5a3a20', 2, 10, 12, 6); c('#c8a850', 7, 0, 2, 11); break;
    case 'carpetrun': g.fillStyle = '#8a1a2a'; g.fillRect(x, y, p.w * S, p.h * S); g.fillStyle = '#c8a850'; g.fillRect(x, y, 2, p.h * S); g.fillRect(x + p.w * S - 2, y, 2, p.h * S); break;
    case 'painting': c('#c8a850', 2, 2, 28, 14); c(['#4a8ad8', '#5ab04a', '#d0804a', '#8a5ab0'][p.v || 0], 4, 4, 24, 10); break;
    case 'window': c('#3a3040', 2, 2, 12, 12); c('#a0c8f0', 4, 4, 8, 8); break;
    case 'board': c('#7a5030', 2, 4, 28, 20); for (let k = 0; k < 6; k++) c(['#f0e8d0', '#e0f0e0', '#f0e0e0'][k % 3], 4 + (k % 3) * 9, 6 + Math.floor(k / 3) * 9, 7, 7); break;
    case 'map': c('#e0d0a0', 2, 2, 28, 18); c('#8a6a3a', 6, 6, 12, 2); c('#4a8ad8', 18, 10, 8, 6); break;
    case 'timetable': c('#2a2a30', 2, 2, 28, 14); for (let k = 0; k < 3; k++) c('#ffe060', 4, 4 + k * 4, 22, 1); break;
    case 'clock': c('#e8e0d0', 4, 2, 10, 10); c('#2a2a2a', 8, 4, 1, 4); break;
    case 'curtain': c('#8a1a2a', 0, 0, 32, 24); c('#a02a3a', 4, 0, 4, 24); break;
    case 'candles': c('#e8e0d0', 6, 6, 2, 6); c('#ffe060', 6, 3, 2, 3); break;
  }
}
