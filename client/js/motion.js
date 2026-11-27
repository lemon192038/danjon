// WEAPON IDENTITY: per-variant attack motions and synthesized sounds (presentation only; hits are decided on the server).
// A motion style shapes the weapon's angle/extension over the attack; a sound is 1-3 synthesized layers.
const TAU = Math.PI * 2;
// style: sweep (wide arc) chop (overhead) stab (thrust) flurry (fast small cuts) spin heave (wind-up, big arc) flick (whip snap)
// twirl (spins in hand) raise (lift skyward) recoil (gun kick) draw (bow pull) float (hover bob) jab (double poke) stomp (lift & drop)
const M = (style, o = {}) => ({ style, amp: 1, ...o });
export const MOTION = {
  wave: M('sweep', { amp: 1.3, trail: 2 }), split: M('sweep', { amp: 1.6 }), core: M('heave', { glow: '#e080ff' }), deploy: M('spin'), orbit: M('float'), whip: M('flick', { ext: 14 }), mana: M('sweep', { glow: '#80c0ff' }), link: M('flurry', { amp: 0.9 }),
  heavy: M('heave', { amp: 1.3 }), quake: M('stomp'), bulwark: M('chop', { amp: 0.7 }), ignite: M('sweep', { glow: '#ff7a30', trail: 2 }), keen: M('stab', { ext: 12 }), echo: M('sweep', { trail: 3, ghost: 1 }), bleed: M('flurry', { amp: 1.1 }), frost: M('sweep', { glow: '#a0e8ff' }),
  swift: M('flurry', { amp: 0.7 }), tempo: M('flurry', { trail: 2 }), leech: M('heave', { glow: '#c02040' }), reach: M('stab', { ext: 16 }), venom: M('jab'), stun: M('chop', { amp: 1.2 }), curse: M('heave', { glow: '#a040c0' }), spark: M('sweep', { glow: '#ffe060' }),
  rush: M('stab', { ext: 10, lunge: 1 }), counter: M('sweep', { amp: 0.8 }), guardbreak: M('chop'), crystal: M('stab', { glow: '#a0e8ff' }), thunder: M('stab', { glow: '#ffe060' }), long: M('stab', { ext: 18 }), twin: M('spin', { amp: 0.6 }), hook: M('flick', { ext: 8 }), wind: M('sweep', { trail: 2 }),
  pull: M('flick', { ext: 10 }), weight: M('spin', { amp: 1.4 }), whirl: M('spin', { amp: 2 }), ret: M('sweep', { amp: 1.2 }), bounce: M('sweep', { amp: 0.9 }), mend: M('raise', { glow: '#fff0a0' }), ward: M('raise', { glow: '#a0c0ff' }), war: M('raise', { glow: '#ff6060' }),
  pierce: M('draw', { ext: -6 }), scatter: M('recoil', { kick: 6 }), rain: M('raise'), venomshot: M('draw'), homing: M('draw'), charge: M('recoil', { kick: 9 }), blast: M('recoil', { kick: 7 }), frostshot: M('draw', { glow: '#a0e8ff' }), flameshot: M('draw', { glow: '#ff7a30' }),
  hawk: M('draw'), wolf: M('draw'), wisp: M('draw', { glow: '#fff8c0' }), serpent: M('draw'), owl: M('draw'), salamander: M('draw', { glow: '#ff8040' }), rail: M('recoil', { kick: 5 }), grenade: M('recoil', { kick: 8 }), cryo: M('recoil', { kick: 4, glow: '#a0e8ff' }),
  sumWolf: M('twirl'), sumOwl: M('twirl'), sumHawk: M('twirl'), sumSerpent: M('twirl'), sumSkel: M('raise', { glow: '#e8e0d0' }), blink: M('sweep', { trail: 3, ghost: 1 }),
  axe: M('chop'), cannon: M('recoil', { kick: 8 }), scythe: M('sweep', { amp: 1.7 }), shield: M('chop', { amp: 0.6 }), lance: M('stab', { ext: 14 }), bow: M('draw'),
  lute: M('twirl', { amp: 0.4 }), drum: M('stomp', { amp: 0.6 }), flute: M('float'), violin: M('flurry', { amp: 0.4 }), horn: M('raise'), harp: M('float'), guard: M('raise'), iron: M('raise'), sniper: M('raise'), mask: M('twirl'), calamity: M('raise', { glow: '#6a3050' }),
};
// weapon angle offset (relative to facing) and extension for progress p (0..1) of attack step `step`
export function motionAngle(P, p, step) { const sw = Math.min(1, p * 2.2), dir = step % 2 ? -1 : 1, A = P.amp;
  switch (P.style) {
    case 'sweep': return dir * A * (-1.4 + sw * 2.8);
    case 'chop': return -A * 1.9 + Math.min(1, p * 3) * A * 2.1;
    case 'heave': return p < 0.35 ? dir * -A * (1.2 + p * 2) : dir * A * (-1.9 + (p - 0.35) / 0.65 * 3.6);
    case 'stab': return dir * 0.08;
    case 'jab': return dir * 0.15 * Math.sin(p * TAU * 2);
    case 'flurry': return dir * A * Math.sin(p * TAU * 3) * 0.9;
    case 'spin': return sw * TAU * A;
    case 'twirl': return p * TAU * 2 * A;
    case 'flick': return dir * (p < 0.4 ? -1.6 : -1.6 + Math.min(1, (p - 0.4) * 4) * 2.8 + Math.sin(p * 20) * 0.15 * (1 - p));
    case 'raise': return -1.4 * Math.sin(Math.min(1, p * 1.5) * Math.PI / 2) * A;
    case 'stomp': return -2 * A * Math.sin(Math.min(1, p * 2) * Math.PI) * (p < 0.5 ? 1 : 0.3);
    case 'float': return Math.sin(p * TAU) * 0.4;
    case 'recoil': case 'draw': return 0;
  } return 0; }
export function motionExt(P, p) { switch (P.style) {
  case 'stab': return Math.sin(Math.min(1, p * 2) * Math.PI) * (P.ext || 10);
  case 'jab': return Math.abs(Math.sin(p * TAU * 2)) * 8;
  case 'flick': return p > 0.4 ? Math.sin((p - 0.4) / 0.6 * Math.PI) * (P.ext || 10) : 0;
  case 'recoil': { const K = P.kick || 6; return p < 0.15 ? -K * p / 0.15 : -K * (1 - (p - 0.15) / 0.85); }
  case 'draw': return p < 0.6 ? -6 * p / 0.6 : -6 * (1 - (p - 0.6) / 0.4);
  case 'float': return Math.sin(p * Math.PI) * 4;
  } return 0; }
// ── sounds: layers of [f0, f1, dur, wave, gain, noise, delayMs]
const L = (f0, f1, dur, type = 'sine', g = 0.06, noise = false, at = 0) => [f0, f1, dur, type, g, noise, at];
const SW = L(1800, 400, 0.08, 'sine', 0.05, true);
export const SOUNDS = {
  sweep: [SW], chop: [L(700, 150, 0.12, 'sine', 0.08, true)], heave: [L(300, 900, 0.1, 'sine', 0.03, true), L(900, 160, 0.16, 'sine', 0.09, true, 90)], stab: [L(2600, 1200, 0.05, 'sine', 0.05, true)],
  jab: [L(2400, 1400, 0.04, 'sine', 0.04, true), L(2400, 1400, 0.04, 'sine', 0.04, true, 70)], flurry: [L(2200, 900, 0.04, 'sine', 0.035, true), L(2000, 800, 0.04, 'sine', 0.035, true, 50)],
  spin: [L(500, 1500, 0.18, 'sine', 0.05, true)], twirl: [L(1200, 1600, 0.12, 'triangle', 0.03)], flick: [L(400, 3200, 0.06, 'sine', 0.05, true), L(3000, 2000, 0.03, 'square', 0.03, false, 60)],
  raise: [L(400, 800, 0.2, 'triangle', 0.04)], stomp: [L(200, 50, 0.22, 'sine', 0.12, true)], float: [L(700, 900, 0.1, 'sine', 0.025)], recoil: [L(180, 60, 0.12, 'square', 0.08, true), L(1400, 300, 0.05, 'sawtooth', 0.04)], draw: [L(300, 500, 0.08, 'triangle', 0.03), L(1600, 700, 0.06, 'sine', 0.04, true, 60)],
  // per-variant colour layers (element / material) added on top of the style sound
  _ignite: L(900, 200, 0.12, 'sawtooth', 0.025, true), _frost: L(3000, 2400, 0.08, 'triangle', 0.025), _spark: L(4000, 1200, 0.05, 'square', 0.02), _mana: L(600, 1200, 0.1, 'sine', 0.03), _curse: L(220, 110, 0.18, 'sawtooth', 0.025),
  _leech: L(300, 180, 0.14, 'triangle', 0.03), _mend: L(880, 1320, 0.14, 'sine', 0.03), _echo: L(1800, 400, 0.08, 'sine', 0.025, true, 140), _core: L(500, 1000, 0.06, 'square', 0.02), _metal: L(3200, 3000, 0.06, 'triangle', 0.025),
};
const COLOR = { ignite: '_ignite', flameshot: '_ignite', salamander: '_ignite', frost: '_frost', frostshot: '_frost', cryo: '_frost', crystal: '_frost', spark: '_spark', thunder: '_spark', rail: '_spark', mana: '_mana', curse: '_curse', calamity: '_curse',
  leech: '_leech', mend: '_mend', ward: '_mend', echo: '_echo', blink: '_echo', core: '_core', guardbreak: '_metal', bulwark: '_metal', counter: '_metal', shield: '_metal', iron: '_metal' };
// instruments play notes, not swings
const NOTE = { lute: [523, 659], drum: [110, 82], flute: [880, 988], violin: [440, 415], horn: [262, 330], harp: [784, 1047] };
export function identSound(key) { const n = NOTE[key]; if (n) return [L(n[0], n[0], 0.14, key === 'drum' ? 'sine' : 'triangle', 0.06, key === 'drum'), L(n[1], n[1], 0.12, 'triangle', 0.04, false, 90)];
  const P = MOTION[key]; if (!P) return null; const base = SOUNDS[P.style] || [SW]; const c = COLOR[key]; return c ? [...base, SOUNDS[c]] : base; }
// a skill cast: the variant's sound, then a rising tone
export function identSkillSound(key) { const s = identSound(key) || [SW]; return [...s, L(400, 1400, 0.18, 'triangle', 0.06, false, 120)]; }
export const MECH_SOUND = { wave: [L(1200, 300, 0.2, 'sine', 0.05, true)], core: [L(200, 900, 0.1, 'square', 0.04), L(900, 80, 0.3, 'sine', 0.1, true, 100)], deploy: [L(400, 1600, 0.15, 'triangle', 0.04)], quake: [L(120, 40, 0.3, 'sine', 0.12, true)],
  link: [L(1500, 800, 0.06, 'square', 0.03)], echo: [L(1800, 600, 0.08, 'sine', 0.03, true)], tempo: [L(800, 1600, 0.06, 'triangle', 0.03)], rain: [L(2500, 800, 0.3, 'sine', 0.03, true)], phase: [L(1600, 200, 0.12, 'sine', 0.05), L(200, 1600, 0.12, 'sine', 0.05, false, 100)],
  spirit: [L(660, 990, 0.15, 'triangle', 0.04)], melody: [L(784, 784, 0.1, 'triangle', 0.04), L(988, 988, 0.12, 'triangle', 0.04, false, 100)], crystal: [L(3000, 2600, 0.1, 'triangle', 0.03)], orbitHit: [L(2600, 1800, 0.03, 'square', 0.02)] };
