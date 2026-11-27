// Tiny synthesized sound effects (WebAudio, no assets).
let ctx = null, vol = 0.35;
export function setVolume(v) { vol = v; }
function ac() { if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; } } if (ctx.state === 'suspended') ctx.resume(); return ctx; }
function tone(f0, f1, dur, type = 'square', g = 0.2, noise = false) {
  const a = ac(); if (!a || vol <= 0) return; const t = a.currentTime; const gain = a.createGain(); gain.gain.setValueAtTime(g * vol, t); gain.gain.exponentialRampToValueAtTime(0.001, t + dur); gain.connect(a.destination);
  if (noise) { const b = a.createBuffer(1, a.sampleRate * dur, a.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length); const s = a.createBufferSource(); s.buffer = b; const f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = f0; s.connect(f); f.connect(gain); s.start(t); return; }
  const o = a.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur); o.connect(gain); o.start(t); o.stop(t + dur);
}
// layered synthesized sound: [f0, f1, dur, wave, gain, noise, delayMs] × n, scaled by g (distance)
export function playLayers(list, g = 1) { if (!list) return; for (const [f0, f1, d, ty, gn, nz, at] of list) { if (at) setTimeout(() => tone(f0, f1, d, ty, gn * g, nz), at); else tone(f0, f1, d, ty, gn * g, nz); } }
export const sfx = {
  swing: () => tone(1800, 400, 0.08, 'sine', 0.05, true), heavy: () => tone(500, 120, 0.18, 'sine', 0.12, true), shoot: () => tone(900, 300, 0.1, 'triangle', 0.08),
  hit: () => tone(220, 60, 0.08, 'square', 0.1), crit: () => { tone(880, 220, 0.12, 'square', 0.1); tone(2400, 800, 0.08, 'sine', 0.05, true); }, hurt: () => tone(160, 50, 0.15, 'sawtooth', 0.12),
  skill: () => tone(400, 1200, 0.15, 'triangle', 0.08), boom: () => tone(300, 40, 0.35, 'sine', 0.2, true), parry: () => tone(2000, 1500, 0.12, 'square', 0.08), dodge: () => tone(600, 1400, 0.07, 'sine', 0.04, true),
  level: () => { tone(523, 523, 0.12, 'square', 0.08); setTimeout(() => tone(659, 659, 0.12, 'square', 0.08), 110); setTimeout(() => tone(784, 1046, 0.25, 'square', 0.08), 220); }, loot: () => tone(1200, 1800, 0.1, 'triangle', 0.06), die: () => tone(300, 40, 0.4, 'sawtooth', 0.1),
  ui: () => tone(700, 900, 0.04, 'square', 0.03),
};
