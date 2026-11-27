// Magic circle renderer: draws every pattern of the shared circle library procedurally with its own animation
// (spin / counter / pulse / flicker / clock / gears / fold / converge …). Outer circle = what the skill does,
// inner circle2 = the weapon's theme. Drawn flat (y-squashed) under the caster with low fill so the field stays readable.
import { CIRCLES, PATTERNS } from '/shared/data/circles.js';
const TAU = Math.PI * 2;
function poly(g, n, r, rot, step = 1) { g.beginPath(); for (let i = 0; i <= n; i++) { const a = rot + i * step * TAU / n; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.stroke(); }
function ring(g, r) { g.beginPath(); g.arc(0, 0, Math.max(0.5, r), 0, TAU); g.stroke(); }
function glyphs(g, s, r, rot, size) { if (!s) return; const ch = [...s]; g.font = `${size}px serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; for (let i = 0; i < ch.length; i++) { const a = rot + i * TAU / ch.length; g.save(); g.translate(Math.cos(a) * r, Math.sin(a) * r); g.rotate(a + Math.PI / 2); g.fillText(ch[i], 0, 0); g.restore(); } }
// draw circle `id` at (x,y) radius r; p = 0..1 progress of its activation; t = ms clock
export function drawMagicCircle(g, id, x, y, r, p, t, alpha = 1, flat = 0.55) {
  const C = CIRCLES[id]; if (!C) return; const [fam, , anim, sym] = PATTERNS[C.geometricPattern]; const [c1, c2] = C.colorParameters; const pat = C.geometricPattern;
  const sp = C.rotationSpeed * t / 1000; const L = C.layerCount;
  // activation sequence: expand → light → flash/collapse
  const ex = Math.min(1, p * 4), fl = p > 0.75 ? (anim === 'converge' ? 1 - (p - 0.75) * 3 : 1 + (p - 0.75) * 0.6) : 1; const R = r * ex * fl;
  g.save(); g.translate(x, y); g.scale(1, flat); g.globalAlpha = alpha * (p > 0.85 ? (1 - p) / 0.15 : 1); g.lineWidth = 1.2; g.strokeStyle = c1; g.fillStyle = c1;
  const pulse = anim === 'pulse' || anim === 'breathe' ? 1 + Math.sin(t / (anim === 'pulse' ? 120 : 400)) * 0.06 : 1; const flick = anim === 'flicker' ? 0.7 + Math.random() * 0.3 : 1;
  g.globalAlpha *= flick;
  // base rings (counter = alternating direction per layer)
  for (let k = 0; k < L; k++) { const rr = R * pulse * (1 - k * 0.2); g.strokeStyle = k % 2 ? c2 : c1; if (anim === 'stack') { g.save(); g.translate(0, -k * 4 * ex); ring(g, rr); g.restore(); } else ring(g, rr); }
  g.globalAlpha *= 0.9; const rot = anim === 'reverse' ? -sp * 1.5 : anim === 'counter' ? sp : sp;
  switch (pat) {
    case 'hexagram': g.strokeStyle = c2; poly(g, 3, R * 0.85, rot); poly(g, 3, R * 0.85, rot + Math.PI); break;
    case 'octagram': g.strokeStyle = c2; poly(g, 8, R * 0.85, rot, 3); break;
    case 'polylink': g.strokeStyle = c2; for (let i = 0; i < 5; i++) { const a = rot + i * TAU / 5; g.save(); g.translate(Math.cos(a) * R * 0.5, Math.sin(a) * R * 0.5); ring(g, R * 0.25); g.restore(); } break;
    case 'geomesh': g.strokeStyle = c2; poly(g, 6, R * 0.8, rot); poly(g, 6, R * 0.8, -rot, 2); poly(g, 4, R * 0.5, rot * 2); break;
    case 'tiered': g.strokeStyle = c2; poly(g, 4, R * 0.9, rot); poly(g, 4, R * 0.6, -rot + Math.PI / 4); break;
    case 'rings': case 'concentric': g.strokeStyle = c2; for (let i = 0; i < 12; i++) { const a = rot + i * TAU / 12; g.beginPath(); g.moveTo(Math.cos(a) * R * 0.75, Math.sin(a) * R * 0.75); g.lineTo(Math.cos(a) * R * 0.95, Math.sin(a) * R * 0.95); g.stroke(); } break;
    case 'puppet': case 'thread': g.strokeStyle = c2; for (let i = 0; i < 6; i++) { const a = rot + i * TAU / 6; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(Math.cos(a + 0.6) * R * 0.5, Math.sin(a + 0.6) * R * 0.5, Math.cos(a) * R, Math.sin(a) * R); g.stroke(); g.fillRect(Math.cos(a) * R - 1.5, Math.sin(a) * R - 1.5, 3, 3); } break;
    case 'multisummon': g.strokeStyle = c2; for (let i = 0; i < 4; i++) { const a = rot + i * TAU / 4; g.save(); g.translate(Math.cos(a) * R * 0.6 * ex, Math.sin(a) * R * 0.6 * ex); ring(g, R * 0.22); poly(g, 3, R * 0.2, -rot); g.restore(); } break;
    case 'skeletal': g.strokeStyle = c2; for (let i = 0; i < 8; i++) { const a = rot + i * TAU / 8; g.beginPath(); g.moveTo(Math.cos(a) * R * 0.4, Math.sin(a) * R * 0.4); g.lineTo(Math.cos(a) * R * 0.9, Math.sin(a) * R * 0.9); g.stroke(); ring(g, R * 0.12); } break;
    case 'flame': g.strokeStyle = c2; for (let i = 0; i < 10; i++) { const a = rot + i * TAU / 10, h = R * (0.8 + Math.sin(t / 90 + i) * 0.12); g.beginPath(); g.moveTo(Math.cos(a - 0.15) * R * 0.6, Math.sin(a - 0.15) * R * 0.6); g.lineTo(Math.cos(a) * h, Math.sin(a) * h); g.lineTo(Math.cos(a + 0.15) * R * 0.6, Math.sin(a + 0.15) * R * 0.6); g.stroke(); } break;
    case 'frost': case 'crystal': g.strokeStyle = c2; for (let i = 0; i < 6; i++) { const a = rot + i * TAU / 6; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * R * 0.9, Math.sin(a) * R * 0.9); g.stroke(); const m = R * 0.55; g.beginPath(); g.moveTo(Math.cos(a) * m, Math.sin(a) * m); g.lineTo(Math.cos(a + 0.3) * m * 1.25, Math.sin(a + 0.3) * m * 1.25); g.moveTo(Math.cos(a) * m, Math.sin(a) * m); g.lineTo(Math.cos(a - 0.3) * m * 1.25, Math.sin(a - 0.3) * m * 1.25); g.stroke(); } break;
    case 'bolt': g.strokeStyle = c2; for (let i = 0; i < 5; i++) { const a = rot + i * TAU / 5; g.beginPath(); let px = 0, py = 0; g.moveTo(0, 0); for (let k = 1; k <= 4; k++) { px = Math.cos(a) * R * k / 4 + (Math.random() - 0.5) * 5; py = Math.sin(a) * R * k / 4 + (Math.random() - 0.5) * 5; g.lineTo(px, py); } g.stroke(); } break;
    case 'vortex': case 'chain': g.strokeStyle = c2; for (let i = 0; i < 4; i++) { g.beginPath(); for (let k = 0; k < 30; k++) { const a = rot * 2 + i * TAU / 4 + k * 0.18, rr = R * k / 30; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.stroke(); } break;
    case 'tide': g.strokeStyle = c2; for (let k = 1; k <= 3; k++) { g.beginPath(); for (let i = 0; i <= 48; i++) { const a = i * TAU / 48; const rr = R * (0.3 + k * 0.18) + Math.sin(a * 6 + t / 200 + k) * 2.5; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.stroke(); } break;
    case 'halo': case 'divine': g.strokeStyle = c2; for (let i = 0; i < 16; i++) { const a = rot + i * TAU / 16; g.beginPath(); g.moveTo(Math.cos(a) * R * 0.3, Math.sin(a) * R * 0.3); g.lineTo(Math.cos(a) * R * (i % 2 ? 0.7 : 0.95), Math.sin(a) * R * (i % 2 ? 0.7 : 0.95)); g.stroke(); } break;
    case 'erosion': g.strokeStyle = c2; for (let i = 0; i < 7; i++) { const a = rot + i * 0.9; g.beginPath(); g.arc(Math.cos(a) * R * 0.4, Math.sin(a) * R * 0.4, R * 0.35, a, a + 2.2); g.stroke(); } break;
    case 'warp': case 'fold': g.strokeStyle = c2; for (let k = 0; k < 3; k++) { const s = (t / 600 + k / 3) % 1; poly(g, 4, R * (1 - s), rot + k); } break;
    case 'gravity': g.strokeStyle = c2; for (let k = 0; k < 4; k++) { const s = 1 - ((t / 500 + k / 4) % 1); ring(g, R * s); } break;
    case 'clock': { g.strokeStyle = c2; for (let i = 0; i < 12; i++) { const a = i * TAU / 12; g.beginPath(); g.moveTo(Math.cos(a) * R * 0.82, Math.sin(a) * R * 0.82); g.lineTo(Math.cos(a) * R * 0.95, Math.sin(a) * R * 0.95); g.stroke(); } const h = t / 160; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(h) * R * 0.7, Math.sin(h) * R * 0.7); g.moveTo(0, 0); g.lineTo(Math.cos(h / 12) * R * 0.45, Math.sin(h / 12) * R * 0.45); g.stroke(); break; }
    case 'constellation': g.fillStyle = c2; g.strokeStyle = c2; { const pts = []; for (let i = 0; i < 7; i++) { const a = rot + i * 2.4; pts.push([Math.cos(a) * R * (0.4 + (i % 3) * 0.2), Math.sin(a) * R * (0.4 + (i % 3) * 0.2)]); } g.beginPath(); pts.forEach(([a, b], i) => i ? g.lineTo(a, b) : g.moveTo(a, b)); g.stroke(); for (const [a, b] of pts) g.fillRect(a - 1.5, b - 1.5, 3, 3); } break;
    case 'gears': case 'transform': g.strokeStyle = c2; for (const [ox, oy, rr, dir] of [[-R * 0.35, 0, R * 0.4, 1], [R * 0.4, 0, R * 0.3, -1.33]]) { g.save(); g.translate(ox, oy); g.rotate(rot * 3 * dir); ring(g, rr); for (let i = 0; i < 8; i++) { const a = i * TAU / 8; g.fillRect(Math.cos(a) * rr - 1.5, Math.sin(a) * rr - 1.5, 3, 3); } g.restore(); } break;
    case 'chainlink': g.strokeStyle = c2; for (let i = 0; i < 10; i++) { const a = rot + i * TAU / 10; g.save(); g.translate(Math.cos(a) * R * 0.8, Math.sin(a) * R * 0.8); g.rotate(a + (i % 2) * Math.PI / 2); g.beginPath(); g.ellipse(0, 0, 4, 2, 0, 0, TAU); g.stroke(); g.restore(); } break;
    case 'vertical': case 'pierceline': g.strokeStyle = c2; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * R * 0.25, -R * 0.8); g.lineTo(i * R * 0.25, R * 0.8); g.stroke(); } poly(g, 4, R * 0.5, Math.PI / 4); break;
    case 'floating': case 'bowstring': g.strokeStyle = c2; g.beginPath(); g.arc(0, 0, R * 0.8, -1.2 + rot * 0.2, 1.2 + rot * 0.2); g.stroke(); g.beginPath(); g.moveTo(Math.cos(-1.2 + rot * 0.2) * R * 0.8, Math.sin(-1.2 + rot * 0.2) * R * 0.8); g.lineTo(Math.cos(1.2 + rot * 0.2) * R * 0.8, Math.sin(1.2 + rot * 0.2) * R * 0.8); g.stroke(); break;
    case 'scope': g.strokeStyle = c2; ring(g, R * 0.5); for (let i = 0; i < 4; i++) { const a = rot + i * Math.PI / 2; g.beginPath(); g.moveTo(Math.cos(a) * R * 0.2, Math.sin(a) * R * 0.2); g.lineTo(Math.cos(a) * R, Math.sin(a) * R); g.stroke(); } break;
    case 'bladearc': g.strokeStyle = c2; for (let i = 0; i < 3; i++) { const a = rot * 2 + i * TAU / 3; g.beginPath(); g.arc(0, 0, R * 0.7, a, a + 1.3); g.stroke(); } break;
    case 'staff': g.strokeStyle = c2; poly(g, 5, R * 0.8, rot, 2); ring(g, R * 0.25); break;
    case 'crest': case 'pact': g.strokeStyle = c2; poly(g, 5, R * 0.8, rot, 2); break;
  }
  if (sym) { g.fillStyle = c2; glyphs(g, sym, R * 0.88, anim === 'scroll' ? sp * 0.6 : anim === 'reverse' ? -sp : sp * 0.3, Math.max(6, R * 0.16)); }
  if (p < 0.3 && fam !== 'weapon') { g.globalAlpha = alpha * (0.3 - p) * 1.5; g.fillStyle = c1; g.beginPath(); g.arc(0, 0, R, 0, TAU); g.fill(); } // light-up flash
  g.restore(); g.globalAlpha = 1;
}
