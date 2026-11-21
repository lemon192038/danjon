// Per-skill visual signatures. Every skill id maps deterministically to a unique combination of
// motif x element palette x secondary hue x rune geometry x particle style x trail style.
import { ELEMENT_COLORS } from '/shared/constants.js';
const MOTIFS = ['crescent', 'petals', 'shards', 'runes', 'lightning', 'flames', 'feathers', 'stars', 'tendrils', 'bubbles', 'leaves', 'sparks', 'rings', 'pillars', 'spiral', 'afterimage', 'glyphs', 'snow', 'embers', 'prism'];
const EL_MOTIF = { fire: ['flames', 'embers', 'crescent'], ice: ['shards', 'snow', 'prism'], thunder: ['lightning', 'sparks', 'rings'], wind: ['feathers', 'leaves', 'spiral'], earth: ['shards', 'pillars', 'rings'], water: ['bubbles', 'spiral', 'rings'], holy: ['feathers', 'pillars', 'stars', 'glyphs'], dark: ['tendrils', 'runes', 'afterimage'], void: ['stars', 'runes', 'prism', 'spiral'] };
function h32(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function hexToHsl(hex) { const n = parseInt(hex.slice(1), 16); let r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let hh = 0, s = 0, l = (mx + mn) / 2; if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); hh = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; hh *= 60; } return [hh, s * 100, l * 100]; }
const cache = new Map();
export function vfxProfile(id, el) {
  const key = id + '|' + (el || ''); if (cache.has(key)) return cache.get(key);
  const h = h32(id); const r = k => ((h >>> (k * 3)) & 1023) / 1023;
  const pool = EL_MOTIF[el] || MOTIFS;
  const motif = r(1) < 0.7 ? pool[h % pool.length] : MOTIFS[(h >>> 7) % MOTIFS.length];
  const base = ELEMENT_COLORS[el] || `hsl(${h % 360},70%,70%)`;
  const [bh, bs] = base.startsWith('#') ? hexToHsl(base) : [h % 360, 70];
  const hue2 = (bh + 25 + r(2) * 120 * (r(3) < 0.5 ? 1 : -1) + 360) % 360;
  const p = {
    motif, c1: base, c2: `hsl(${hue2 | 0},${Math.max(55, bs) | 0}%,${60 + r(4) * 20 | 0}%)`, c3: `hsl(${(bh + 180) % 360 | 0},80%,85%)`,
    sides: 3 + (h % 6), rings: 1 + ((h >>> 4) % 3), spin: (r(5) - 0.5) * 0.02, count: 8 + ((h >>> 9) % 14), size: 1 + ((h >>> 11) % 3),
    trail: (h >>> 13) % 4, width: 2 + ((h >>> 15) % 3), glyph: '✦✧❖✶✷✸✹✺❂☼☽✡⚝⛤⟡◈◇'.charAt((h >>> 17) % 17),
  };
  cache.set(key, p); return p;
}
// Particles emitted along/around an effect according to motif
export function motifParticles(R, p, x, y, rad, ang = 0, arc = Math.PI * 2) {
  const n = Math.min(40, p.count + Math.round(rad / 6));
  for (let i = 0; i < n; i++) {
    const a = ang - arc / 2 + Math.random() * arc, d = Math.random() * rad;
    const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d;
    const out = { x: px, y: py, vx: Math.cos(a) * 20, vy: Math.sin(a) * 20, col: Math.random() < 0.5 ? p.c1 : p.c2, t0: R.time, life: 500 + Math.random() * 500, g: 0, shape: p.motif, size: p.size, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.3 };
    switch (p.motif) {
      case 'flames': case 'embers': out.vy = -40 - Math.random() * 40; out.vx *= 0.3; out.g = -10; break;
      case 'snow': case 'feathers': case 'leaves': case 'petals': out.vy = -10 + Math.random() * 20; out.vx = (Math.random() - 0.5) * 40; out.g = 25; out.life += 300; break;
      case 'shards': case 'prism': out.vx = Math.cos(a) * (80 + Math.random() * 60); out.vy = Math.sin(a) * (80 + Math.random() * 60); out.g = 120; break;
      case 'bubbles': out.vy = -25 - Math.random() * 25; out.g = -5; break;
      case 'tendrils': out.vx = -Math.cos(a) * 30; out.vy = -Math.sin(a) * 30; break;
      case 'spiral': out.vx = Math.cos(a + 1.5) * 60; out.vy = Math.sin(a + 1.5) * 60; break;
      case 'stars': case 'sparks': out.vx = Math.cos(a) * (40 + Math.random() * 80); out.vy = Math.sin(a) * (40 + Math.random() * 80); break;
      case 'pillars': out.vy = -90; out.vx = 0; out.life = 400; break;
    }
    if (R.parts.length < 900) R.parts.push(out);
  }
}
// Small particle sprites per motif (drawn at low resolution)
export function drawMotifParticle(g, q, x, y, a) {
  g.globalAlpha = a; g.fillStyle = q.col; const s = q.size || 1;
  switch (q.shape) {
    case 'petals': case 'leaves': g.save(); g.translate(x, y); g.rotate(q.rot += q.vr); g.fillRect(-s, 0, s * 2 + 1, 1); g.fillRect(0, -1, 1, 3); g.restore(); break;
    case 'feathers': g.fillRect(x, y, 1, s + 2); g.fillRect(x - 1, y + 1, 3, 1); break;
    case 'shards': case 'prism': g.save(); g.translate(x, y); g.rotate(q.rot); g.fillRect(0, 0, s + 2, 1); g.fillStyle = '#fff'; g.fillRect(0, 0, 1, 1); g.restore(); break;
    case 'stars': case 'sparks': g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3); break;
    case 'bubbles': g.strokeStyle = q.col; g.beginPath(); g.arc(x, y, s + 0.5, 0, 6.28); g.stroke(); break;
    case 'snow': g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3); g.fillStyle = '#fff'; g.fillRect(x, y, 1, 1); break;
    case 'pillars': g.fillRect(x, y - 4, 1, 6); break;
    case 'flames': case 'embers': g.fillRect(x, y, s, s + 1); g.fillStyle = '#fff6'; g.fillRect(x, y, 1, 1); break;
    default: g.fillRect(x, y, s, s);
  }
}
