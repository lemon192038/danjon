// WEAPON IDENTITY client visuals: per-variant weapon silhouettes, puppet / spirit bodies, and on-body indicators
// (orbiting blades, mana core stacks, transform state, floating notes, guiding spirits). Purely presentation;
// every result shown here was decided on the server.
import { SUMMON_BODIES } from '/shared/data/identity.js';
const TAU = Math.PI * 2; const cache = new Map();
const sh = (c, f) => { const n = parseInt(c.slice(1), 16); const r = Math.min(255, ((n >> 16) & 255) * f) | 0, g = Math.min(255, ((n >> 8) & 255) * f) | 0, b = Math.min(255, (n & 255) * f) | 0; return `rgb(${r},${g},${b})`; };
export const isBody = k => !!SUMMON_BODIES[k];
// ── weapon sprite with the variant's own structure layered on top of the type base (40×24, grip at x=0, tip at +x)
export function identWeapon(base, look, alt, rarCol) {
  const key = JSON.stringify(look) + (alt ? 'A' : '') + rarCol; if (cache.has(key)) return cache.get(key);
  const c = document.createElement('canvas'); c.width = 40; c.height = 24; const g = c.getContext('2d'); const cy = 12;
  const px = (x, y, w, h, cc) => { g.fillStyle = cc; g.fillRect(x | 0, y | 0, w, h); }; const rc = rarCol || '#e0c060';
  const redraw = look.chain || look.threads || look.inst || (look.alt && alt) || look.barrel || look.spirit || look.head && !look.threads && ['crystal', 'fork', 'long', 'twin', 'hook', 'wind'].includes(look.head);
  if (!redraw) g.drawImage(base, 0, 0);
  if (look.edge) { const L = 20; // one-handed sword variants
    if (look.edge === 'wave') for (let i = 0; i < L; i++) px(6 + i, cy - 2 + Math.round(Math.sin(i / 2) * 1), 1, 3, i % 3 ? '#9ad8ff' : '#e0f6ff');
    if (look.edge === 'split') { px(10, cy - 4, 14, 1, '#c0c8d8'); px(10, cy + 3, 14, 1, '#c0c8d8'); }
    if (look.edge === 'core') { px(8, cy - 2, 4, 4, '#402060'); px(9, cy - 1, 2, 2, '#e080ff'); }
    if (look.edge === 'deploy') { for (const o of [10, 16, 22]) px(o, cy - 4, 2, 2, '#a0a8b8'); }
    if (look.edge === 'whip') for (let i = 0; i < 6; i++) px(8 + i * 3, cy - 1, 2, 2, i % 2 ? '#8a92a0' : '#d0d6e0');
    if (look.edge === 'mana') { px(6, cy - 1, 18, 2, '#80c0ff'); px(6, cy, 18, 1, '#ffffff'); }
    if (look.edge === 'link') { px(6, cy + 2, 16, 1, '#ffd060'); px(6, cy - 3, 16, 1, '#ffd060'); }
  }
  if (look.joint && !alt) { px(10, cy - 3, 4, 6, '#30343c'); px(11, cy - 2, 2, 4, look.joint === 'gear' ? '#ffb030' : look.joint === 'hinge' ? '#a0e0ff' : look.joint === 'plate' ? '#c0c0d0' : '#80ff90'); }
  if (look.joint && alt) { px(0, cy - 1, 12, 2, '#5a3a22'); switch (look.alt) { // transformed form: a different weapon silhouette
    case 'axe': px(10, cy - 7, 8, 12, '#9aa4b0'); px(10, cy - 7, 1, 12, '#e0e6ee'); break;
    case 'cannon': px(8, cy - 4, 22, 8, '#4a5260'); px(28, cy - 3, 4, 6, '#ff8040'); px(12, cy - 5, 6, 2, '#30343c'); break;
    case 'scythe': px(10, cy - 1, 16, 2, '#6a4a2a'); for (let i = 0; i < 12; i++) px(26 - i * 0.7, cy - 2 - i, 3, 2, '#c0c8d8'); break;
    case 'shield': px(6, cy - 9, 14, 18, '#7a8696'); px(8, cy - 7, 10, 14, '#9aa6b6'); px(12, cy - 5, 2, 10, rc); break;
    case 'lance': for (let i = 0; i < 24; i++) px(8 + i, cy - Math.max(1, 5 - i / 5), 1, Math.max(2, 10 - i * 0.4), i % 4 ? '#b0b8c8' : '#e0e8f0'); break;
    case 'bow': g.strokeStyle = '#8a6a3a'; g.lineWidth = 2; g.beginPath(); g.arc(4, cy, 10, -1.3, 1.3); g.stroke(); g.strokeStyle = '#fff'; g.lineWidth = 1; g.beginPath(); g.moveTo(6.7, cy - 9.6); g.lineTo(6.7, cy + 9.6); g.stroke(); break; } }
  if (look.chain) { px(0, cy - 1, 5, 3, '#5a3a22'); px(4, cy - 2, 2, 5, '#9098a4'); for (let i = 0; i < look.chain; i++) px(4 + i * 3, cy + (i % 2 ? 1 : -1), 2, 2, '#9098a4');
    const tx = 4 + look.chain * 3; if (look.tip === 'sickle') for (let i = 0; i < 6; i++) px(tx + i, cy - 1 - i, 2, 2, '#d0d6e0');
    if (look.tip === 'weight') { px(tx, cy - 3, 6, 6, '#50545c'); px(tx + 1, cy - 2, 2, 2, '#a0a4ac'); }
    if (look.tip === 'hook') { px(tx, cy - 1, 4, 2, '#c0c8d0'); px(tx + 3, cy - 4, 2, 4, '#c0c8d0'); }
    if (look.tip === 'twin') { px(tx, cy - 4, 5, 2, '#d0d6e0'); px(tx, cy + 2, 5, 2, '#d0d6e0'); }
    if (look.tip === 'fang') { px(tx, cy - 2, 5, 4, '#f0e8d0'); px(tx + 5, cy - 1, 2, 2, '#ffffff'); } }
  if (look.inst) { const W = '#b07a40', D = '#704a20'; switch (look.inst) {
    case 'lute': g.fillStyle = W; g.beginPath(); g.ellipse(10, cy, 8, 6, 0, 0, TAU); g.fill(); px(16, cy - 1, 18, 2, D); px(32, cy - 2, 4, 4, D); px(9, cy - 1, 3, 2, '#2a1a10'); break;
    case 'drum': px(6, cy - 7, 16, 14, '#a03030'); px(6, cy - 7, 16, 2, '#f0e0c0'); px(6, cy + 5, 16, 2, '#f0e0c0'); for (let i = 0; i < 4; i++) px(8 + i * 4, cy - 5, 1, 10, '#e0c060'); px(24, cy - 1, 12, 2, D); break;
    case 'flute': px(2, cy - 1, 34, 3, '#d8c8a0'); for (let i = 0; i < 6; i++) px(12 + i * 4, cy, 2, 1, '#3a2a10'); break;
    case 'violin': g.fillStyle = '#8a3a1a'; g.beginPath(); g.ellipse(10, cy - 2, 6, 4, 0, 0, TAU); g.ellipse(10, cy + 3, 7, 4, 0, 0, TAU); g.fill(); px(16, cy - 1, 16, 2, '#2a1a10'); px(4, cy + 8, 30, 1, '#e0d0b0'); break;
    case 'horn': for (let i = 0; i < 26; i++) px(4 + i, cy - Math.max(1, i / 3), 1, Math.max(2, i / 1.5), '#e0b040'); break;
    case 'harp': g.strokeStyle = '#e0c060'; g.lineWidth = 2; g.beginPath(); g.moveTo(6, cy + 9); g.lineTo(6, cy - 9); g.quadraticCurveTo(24, cy - 9, 30, cy + 9); g.closePath(); g.stroke(); g.lineWidth = 1; g.strokeStyle = '#ffffff'; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(9 + i * 4, cy - 7 + i); g.lineTo(9 + i * 4, cy + 8); g.stroke(); } break; } }
  if (look.head && !look.threads && ['crystal', 'fork', 'long', 'twin', 'hook', 'wind'].includes(look.head)) { const len = look.head === 'long' ? 34 : 28; px(0, cy - 1, len - 6, 2, '#6a4a2a'); const hx = len - 7;
    if (look.head === 'crystal') { px(hx, cy - 3, 6, 6, '#a0e8ff'); px(hx + 6, cy - 1, 3, 2, '#ffffff'); px(hx + 1, cy - 2, 2, 2, '#ffffff'); }
    if (look.head === 'fork') { px(hx, cy - 4, 1, 9, '#ffe060'); px(hx, cy - 4, 7, 1, '#ffe060'); px(hx, cy + 4, 7, 1, '#ffe060'); px(hx + 1, cy - 1, 4, 2, '#a0c0ff'); }
    if (look.head === 'long') { px(hx, cy - 2, 7, 4, '#c9b48a'); px(hx + 7, cy - 1, 3, 2, '#fff'); }
    if (look.head === 'twin') { px(hx, cy - 2, 6, 4, '#c9b48a'); px(1, cy - 2, 4, 4, '#c9b48a'); }
    if (look.head === 'hook') { px(hx, cy - 2, 6, 4, '#c9b48a'); px(hx + 1, cy + 2, 2, 4, '#c9b48a'); px(hx - 1, cy + 5, 3, 1, '#c9b48a'); }
    if (look.head === 'wind') { px(hx, cy - 2, 6, 4, '#a0ffc0'); for (const o of [-4, 4]) px(hx - 4, cy + o, 6, 1, '#e0fff0'); } }
  if (look.spirit) { const SC = { hawk: '#a0ffd0', wolf: '#c0d0ff', wisp: '#fff8c0', serpent: '#90e070', owl: '#d0b080', salamander: '#ff8040' }[look.spirit]; g.strokeStyle = '#5a8a5a'; g.lineWidth = 2; g.beginPath();
    if (look.spirit === 'serpent') { g.moveTo(4, cy - 10); g.bezierCurveTo(14, cy - 4, 0, cy + 4, 4, cy + 10); } else if (look.spirit === 'owl') g.arc(0, cy, 11, -1.1, 1.1); else g.arc(-2, cy, 12, -1.0, 1.0);
    g.stroke(); g.strokeStyle = SC; g.lineWidth = 1; g.beginPath(); g.moveTo(4, cy - 10); g.lineTo(4, cy + 10); g.stroke(); g.fillStyle = SC; g.beginPath(); g.arc(9, cy, 2.5, 0, TAU); g.fill(); // spirit gem on the grip
    if (look.spirit === 'hawk') { px(10, cy - 7, 3, 2, SC); px(10, cy + 5, 3, 2, SC); } if (look.spirit === 'salamander') px(9, cy - 1, 6, 2, '#ffd060'); }
  if (look.barrel) { const G = '#5a6270'; switch (look.barrel) {
    case 'long': px(4, cy - 2, 34, 3, G); px(16, cy - 4, 6, 2, '#a0c0ff'); break;
    case 'wide': px(4, cy - 3, 18, 6, G); px(22, cy - 5, 6, 10, '#3a4250'); break;
    case 'drum': px(4, cy - 2, 26, 4, G); g.fillStyle = '#30343c'; g.beginPath(); g.arc(12, cy, 5, 0, TAU); g.fill(); px(10, cy - 1, 4, 2, '#ffb030'); break;
    case 'coil': px(4, cy - 2, 28, 4, G); for (let i = 0; i < 5; i++) px(10 + i * 4, cy - 4, 2, 8, '#a0e8ff'); break;
    case 'twin': px(4, cy - 4, 28, 3, G); px(4, cy + 1, 28, 3, G); break;
    case 'cannon': px(4, cy - 4, 24, 8, G); px(26, cy - 5, 6, 10, '#3a4250'); px(28, cy - 2, 2, 4, '#ff8040'); break; } }
  if (look.head && ['box', 'cage', 'ring', 'masks', 'skull'].includes(look.head) || look.head === 'twin' && look.threads) { // puppet staves: the head says which puppet answers
    const hx = 30; px(0, cy - 1, 30, 2, '#5a4060'); px(0, cy - 1, 30, 1, '#7a6080'); px(27, cy - 2, 3, 4, '#e0a0ff'); switch (look.head) { case 'box': px(hx, cy - 4, 7, 7, '#d8dce8'); px(hx + 1, cy - 3, 5, 1, '#fff'); break; case 'cage': for (let i = 0; i < 4; i++) px(hx + i * 2, cy - 4, 1, 8, '#4a4e58'); break;
      case 'ring': g.strokeStyle = '#c8d8ff'; g.lineWidth = 1.5; g.beginPath(); g.arc(hx + 3, cy, 4, 0, TAU); g.stroke(); break; case 'twin': px(hx, cy - 4, 3, 3, '#ffd0e0'); px(hx + 4, cy + 1, 3, 3, '#ffd0e0'); break;
      case 'masks': px(hx, cy - 4, 4, 4, '#e8c890'); px(hx + 3, cy, 4, 4, '#fff'); break; case 'skull': px(hx, cy - 4, 7, 6, '#e8e0d0'); px(hx + 1, cy - 2, 2, 2, '#6a3050'); px(hx + 4, cy - 2, 2, 2, '#6a3050'); break; }
    if (look.threads) { g.strokeStyle = 'rgba(255,240,255,.7)'; g.lineWidth = 0.5; for (let i = 0; i < look.threads; i++) { g.beginPath(); g.moveTo(hx + 3, cy); g.lineTo(hx + 3 + (i - look.threads / 2) * 1.5, cy + 8); g.stroke(); } } }
  cache.set(key, c); return c;
}
// ── indicators drawn around the wielder (local coords: g already translated to the entity's feet)
export function drawWielder(g, look, flags, now) {
  if (!look) return; const core = (flags >> 13) & 7;
  if (look.orbit) for (let i = 0; i < look.orbit; i++) { const a = now / 380 + i * TAU / look.orbit; const x = Math.cos(a) * 16, y = Math.sin(a) * 7 - 10; g.save(); g.translate(x, y); g.rotate(a + Math.PI / 2); g.fillStyle = '#d0d8e8'; g.fillRect(-1, -4, 2, 8); g.fillStyle = '#fff'; g.fillRect(-0.5, -4, 1, 3); g.restore(); }
  if (look.edge === 'core' && core) for (let i = 0; i < core; i++) { const a = now / 500 + i * TAU / 5; g.fillStyle = '#e080ff'; g.globalAlpha = 0.8; g.beginPath(); g.arc(Math.cos(a) * 10, -20 + Math.sin(a) * 3, 1.6, 0, TAU); g.fill(); g.globalAlpha = 1; }
  if (look.inst && Math.floor(now / 700) % 2) { g.fillStyle = '#fff0a0'; g.font = '7px serif'; g.fillText('♪', 6 + Math.sin(now / 300) * 3, -24 - (now % 700) / 70); }
  if (look.spirit) { const a = now / 600; g.fillStyle = { hawk: '#a0ffd0', wolf: '#c0d0ff', wisp: '#fff8c0', serpent: '#90e070', owl: '#d0b080', salamander: '#ff8040' }[look.spirit]; g.globalAlpha = 0.6; g.beginPath(); g.arc(Math.cos(a) * 9, -24 + Math.sin(a * 2) * 2, 1.8, 0, TAU); g.fill(); g.globalAlpha = 1; }
  if (look.threads && Math.floor(now / 200) % 3 === 0) { g.strokeStyle = 'rgba(255,220,255,.35)'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(4, -12); g.lineTo(14, -2); g.stroke(); }
  if (look.joint && (flags & 4096)) { g.strokeStyle = '#ffb030'; g.globalAlpha = 0.5; g.beginPath(); g.arc(0, -8, 12, now / 200, now / 200 + 1.2); g.stroke(); g.globalAlpha = 1; }
}
// ── puppet & spirit bodies (local coords at feet, facing handled by caller flip)
export function drawBody(g, kind, now, act) {
  const B = SUMMON_BODIES[kind]?.body; if (!B) return; const col = B.col, dk = sh(col, 0.6), lt = sh(col, 1.3); const t = now / 1000; const bob = Math.sin(t * 6) * 1;
  const px = (x, y, w, h, cc) => { g.fillStyle = cc; g.fillRect(Math.round(x), Math.round(y), w, h); };
  if (B.kind) { const fy = SUMMON_BODIES[kind].fly ? -10 + Math.sin(t * 4) * 2 : 0; g.globalAlpha *= 0.85; g.shadowColor = col; g.shadowBlur = 6;
    switch (B.kind) {
      case 'hawk': { const w = Math.sin(t * 14) * 4; px(-3, fy - 3, 6, 3, col); g.fillStyle = lt; g.beginPath(); g.moveTo(-1, fy - 2); g.lineTo(-9, fy - 4 - w); g.lineTo(-2, fy); g.moveTo(1, fy - 2); g.lineTo(9, fy - 4 - w); g.lineTo(2, fy); g.fill(); px(3, fy - 3, 2, 1, '#ffd060'); break; }
      case 'wolf': px(-7, -7 + bob, 12, 5, col); px(4, -9 + bob, 5, 4, lt); px(8, -8 + bob, 2, 2, dk); px(5, -10 + bob, 1, 2, lt); for (const o of [-6, -3, 1, 3]) px(o, -2, 1, 2 + (Math.floor(t * 8 + o) % 2), dk); px(-9, -8 + bob, 3, 1, lt); break;
      case 'wisp': { const r = 4 + Math.sin(t * 5); g.fillStyle = col; g.beginPath(); g.arc(0, fy - 4, r, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(0, fy - 4, r * 0.5, 0, TAU); g.fill(); break; }
      case 'serpent': for (let i = 0; i < 8; i++) px(-8 + i * 2, -3 + Math.sin(t * 6 + i * 0.8) * 2, 2, 2, i === 7 ? lt : col); px(8, -4 + Math.sin(t * 6 + 5.6) * 2, 1, 1, '#ff3030'); break;
      case 'owl': px(-4, fy - 9, 8, 9, col); px(-3, fy - 7, 2, 2, '#ffe060'); px(1, fy - 7, 2, 2, '#ffe060'); px(-1, fy - 5, 2, 1, dk); px(-6, fy - 7, 2, 5 + Math.sin(t * 10), dk); px(4, fy - 7, 2, 5 - Math.sin(t * 10), dk); break;
      case 'salamander': px(-6, -4, 12, 3, col); px(5, -5, 4, 3, lt); for (const o of [-5, 2]) px(o, -2, 2, 2, dk); px(-10, -4 + Math.sin(t * 8), 4, 2, '#ffd060'); break;
    } g.shadowBlur = 0; return; }
  // puppets: wooden / metal dolls hanging from faint threads
  const H = B.h, W = B.w; const top = -H - 4 + bob; const atk = act === 'attack' || (now % 1000 < 120);
  g.strokeStyle = 'rgba(255,230,255,.25)'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(-W / 2, top); g.lineTo(-W / 2, top - 14); g.moveTo(W / 2, top); g.lineTo(W / 2, top - 14); g.stroke();
  px(-W / 2, top + 6, W, H - 10, col); px(-W / 2, top + 6, W, 1, lt); px(-1, top + 8, 2, H - 14, dk); // torso + seam
  px(-W / 2 + 1, top + H - 4, 2, 4, dk); px(W / 2 - 3, top + H - 4, 2, 4, dk); // legs (jointed)
  switch (B.head) { case 'helm': px(-4, top, 8, 6, col); px(-3, top + 2, 6, 1, '#202030'); break; case 'visor': px(-5, top, 10, 6, dk); px(-4, top + 2, 8, 1, '#ff4040'); break;
    case 'lens': px(-3, top + 1, 6, 5, col); px(-1, top + 2, 2, 2, '#60a0ff'); break; case 'round': g.fillStyle = col; g.beginPath(); g.arc(0, top + 3, 3.5, 0, TAU); g.fill(); px(-2, top + 2, 1, 1, '#302030'); px(1, top + 2, 1, 1, '#302030'); break;
    case 'mask': { const m = Math.floor(now / 2000) % 3; px(-4, top, 8, 6, ['#ffffff', '#202020', '#e8c890'][m]); px(-3, top + 2, 2, 1, m === 1 ? '#fff' : '#000'); px(1, top + 2, 2, 1, m === 1 ? '#fff' : '#000'); break; }
    case 'skull': px(-7, top - 4, 14, 10, '#e8e0d0'); px(-5, top - 1, 4, 3, '#6a3050'); px(1, top - 1, 4, 3, '#6a3050'); px(-4, top + 4, 8, 1, '#3a1020'); for (const o of [-6, 4]) px(o, top - 7, 2, 4, '#e8e0d0'); break; }
  const sw = atk ? 4 : 0; switch (B.arms) {
    case 'shield': px(W / 2, top + 6, 5, 9, '#9aa6b6'); px(W / 2 + 1, top + 8, 3, 5, '#e0e8f0'); break; case 'heavy': px(-W / 2 - 4, top + 6, 4, 8, dk); px(W / 2, top + 6 - sw, 4, 8, dk); break;
    case 'rifle': px(W / 2 - 1, top + 9, 12, 2, '#3a4050'); px(W / 2 + 9, top + 8, 2, 4, '#a0c0ff'); break; case 'blades': px(W / 2, top + 8 - sw, 1, 7, '#e0e8f0'); px(-W / 2 - 1, top + 8 + sw, 1, 7, '#e0e8f0'); break;
    case 'mixed': px(W / 2, top + 8, 6, 1, '#e0e8f0'); px(-W / 2 - 2, top + 8, 2, 5, '#a08060'); break; case 'claws': for (const s of [-1, 1]) for (let i = 0; i < 3; i++) px(s * (W / 2 + 2) + (s < 0 ? -2 : 0), top + 12 + i * 3 - sw, 3, 1, '#f0e0d0'); px(-W / 2 - 3, top + 6, 3, 8, dk); px(W / 2, top + 6, 3, 8, dk); break; }
}
