import { EXITS } from '/shared/data/slum.js';
// Renderer: low-res pixel layer (scaled crisp) + full-res text overlay. Lighting, shadows, animations, effects.
import { renderTileMap, charSprite, weaponSprite, monsterSprite, PALETTES, T, EL_COL, shade, windows } from './sprites.js';
import { ELEMENT_COLORS, RARITIES, STATUS } from '/shared/constants.js';
import { WT_BY_ID } from '/shared/data/weaponTypes.js';
import { vfxProfile, motifParticles, drawMotifParticle } from './vfx.js';
import { drawMagicCircle } from './circles.js';
import { identWeapon, drawWielder, drawBody, isBody } from './identity.js';

const TAU = Math.PI * 2;
const ec = e => ELEMENT_COLORS[e] || '#fff';
export class Renderer {
  constructor(game, overlay) {
    this.c = game; this.g = game.getContext('2d'); this.o = overlay; this.og = overlay.getContext('2d');
    this.light = document.createElement('canvas'); this.lg = this.light.getContext('2d');
    this.fx = []; this.texts = []; this.parts = []; this.shake = 0; this.cam = { x: 0, y: 0 }; this.zone = null; this.time = 0;
    this.settings = { dmgNumbers: true, shake: true, lighting: true };
    this.resize(); addEventListener('resize', () => this.resize());
  }
  resize() {
    const W = innerWidth, H = innerHeight; const scale = Math.max(2, Math.min(5, Math.round(Math.min(W / 420, H / 250)))); this.scale = scale;
    this.w = Math.ceil(W / scale); this.h = Math.ceil(H / scale);
    for (const c of [this.c, this.light]) { c.width = this.w; c.height = this.h; }
    this.c.style.width = this.w * scale + 'px'; this.c.style.height = this.h * scale + 'px';
    const dpr = devicePixelRatio || 1; this.o.width = W * dpr; this.o.height = H * dpr; this.o.style.width = W + 'px'; this.o.style.height = H + 'px'; this.og.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.g.imageSmoothingEnabled = false;
  }
  setZone(z) {
    this.zone = z; this.tileCanvas = renderTileMap(z, z.pal); this.windows = windows.slice(); this.pal = PALETTES[z.pal] || PALETTES.moss; this.wxParts = []; this.fade = 1;
    this.anim = []; for (let y = 0; y < z.h; y++) for (let x = 0; x < z.w; x++) { const v = z.tiles[y * z.w + x]; if (v === T.WATER || v === T.SHALLOW || v === T.LAVA || v === T.PORTAL || v === T.EXIT || v === T.STAIRS) this.anim.push([x, y, v]); }
    this.mini = document.createElement('canvas'); this.mini.width = z.w; this.mini.height = z.h; const mg = this.mini.getContext('2d'); const id = mg.createImageData(z.w, z.h);
    const MC = { 22: [120, 90, 70], 23: [220, 215, 205], 24: [150, 145, 135], 25: [110, 100, 85], 29: [60, 50, 45], 30: [170, 165, 155], 31: [200, 160, 80], 14: [255, 220, 120], 0: [5, 4, 10], 2: [60, 55, 70], 12: [30, 70, 30], 13: [140, 110, 80], 19: [150, 60, 50], 18: [60, 55, 70], 3: [40, 90, 180], 4: [60, 120, 200], 5: [220, 80, 20], 8: [255, 220, 80], 9: [80, 160, 255], 17: [180, 100, 255] };
    for (let i = 0; i < z.tiles.length; i++) { const c = MC[z.tiles[i]] || [150, 140, 120]; id.data.set([...c, 255], i * 4); }
    mg.putImageData(id, 0, 0); this.fx = []; this.parts = []; this.texts = [];
  }
  rerender() { this.tileCanvas = renderTileMap(this.zone, this.zone.pal); this.windows = windows.slice(); }
  updateTile(x, y, v) { const z = this.zone; z.tiles[y * z.w + x] = v; this.tileCanvas = renderTileMap(z, z.pal); if (v === T.STAIRS) this.anim.push([x, y, v]); }
  addFx(f, ents, me) {
    const now = this.time; const E = id => ents.get(id);
    switch (f.t) {
      case 'sh': { const pv = f.v ? vfxProfile(f.v, f.e !== 'phys' ? f.e : null) : null; this.fx.push({ k: 'shape', ...f, pv, t0: now, dur: (f.s === 'beam' ? 220 : f.s === 'circle' ? 260 : 180) * (pv ? 1.7 : 1) }); if (pv) { const rad = f.r || f.l || 30; const o = f.s === 'slam' ? { x: f.x + Math.cos(f.a) * f.d, y: f.y + Math.sin(f.a) * f.d } : f; motifParticles(this, pv, o.x, o.y, rad, f.a, f.s === 'arc' ? f.ar * Math.PI / 180 : f.s === 'thrust' || f.s === 'beam' ? 0.3 : Math.PI * 2); if (pv.motif === 'lightning' || pv.motif === 'pillars') for (let i = 0; i < 3; i++) this.fx.push({ k: pv.motif === 'lightning' ? 'bolt' : 'pillar', x: o.x + Math.cos(f.a) * rad * Math.random(), y: o.y + Math.sin(f.a) * rad * Math.random(), e: f.e, c: pv.c2, t0: now + i * 40, dur: 260 }); } } if (f.s === 'slam') this.ring(f.x + Math.cos(f.a) * f.d, f.y + Math.sin(f.a) * f.d, f.r, f.e); break;
      case 'tele': this.fx.push({ k: 'tele', ...f, pv: f.v ? vfxProfile(f.v, f.e !== 'phys' ? f.e : null) : null, t0: now, dur: f.d }); break;
      case 'boom': if (f.v) { const pv = vfxProfile(f.v, f.e !== 'phys' ? f.e : null); motifParticles(this, pv, f.x, f.y, f.r); this.fx.push({ k: 'sigil', x: f.x, y: f.y, r: f.r * 1.1, pv, t0: now, dur: 500 }); }
        this.ring(f.x, f.y, f.r, f.e); for (let i = 0; i < Math.min(30, f.r); i++) this.part(f.x, f.y, ec(f.e), 40 + Math.random() * 60, 500); this.fx.push({ k: 'flash', x: f.x, y: f.y, r: f.r * 1.4, e: f.e, t0: now, dur: 300 }); if (this.settings.shake) this.shake = Math.max(this.shake, Math.min(6, f.r / 12)); break;
      case 'bolt': this.fx.push({ k: 'bolt', x: f.x, y: f.y, e: f.e, t0: now, dur: 200 }); break;
      case 'blink': for (let i = 0; i < 12; i++) this.part(f.x, f.y, ec(f.e || 'void'), 30, 400); break;
      case 'dmg': if (this.settings.dmgNumbers || f.a) this.texts.push({ x: f.x + (Math.random() - 0.5) * 10, y: f.y, v: f.v, c: f.c, e: f.e, h: f.h, a: f.a, dot: f.dot, t0: now }); { const e = [...ents.values()].find(e => Math.abs(e.x - f.x) < 14 && Math.abs(e.y - 10 - f.y) < 14); if (e && !f.h) e.flash = now; } if (!f.h && !f.dot) for (let i = 0; i < (f.c ? 10 : 4); i++) this.part(f.x, f.y + 6, f.c ? '#ffe060' : ec(f.e), 50, 250); break;
      case 'atk': { const e = E(f.id); if (e) e.atk = { t0: now, dur: f.d, step: f.s, sh: f.sh }; break; }
      case 'dodge': { const e = E(f.id); if (e) e.dodgeAt = now; break; }
      case 'skill': { const e = E(f.id); if (e) { const pv = vfxProfile(f.sid || f.n, f.e !== 'phys' ? f.e : null); this.texts.push({ x: e.x, y: e.y - 26, v: f.n, skill: 1, e: f.e, col: pv.c1, t0: now }); e.cast = { t0: now, dur: Math.max(380, f.c || 0), kind: f.k, pv }; this.fx.push({ k: 'sigil', follow: e, x: e.x, y: e.y, r: 18 + (f.c ? 10 : 0), pv, t0: now, dur: Math.max(500, (f.c || 0) + 300), under: 1, mc: f.c1, mc2: f.c2 }); motifParticles(this, pv, e.x, e.y - 8, 16); } break; }
      case 'parry': case 'counter': { const e = f.id ? E(f.id) : null; const x = e ? e.x : f.x, y = e ? e.y : f.y; this.fx.push({ k: 'flash', x, y, r: 26, e: 'holy', t0: now, dur: 200 }); for (let i = 0; i < 10; i++) this.part(x, y, '#fff', 70, 300); this.texts.push({ x, y: y - 20, v: f.t === 'parry' ? 'PARRY' : 'COUNTER', skill: 1, e: 'holy', t0: now }); break; }
      case 'charge': { const e = E(f.id); if (e) { this.fx.push({ k: 'tele', t: 'tele', s: 'circle', x: e.x, y: e.y, r: 26, d: f.d, e: 'fire', ally: 1, t0: now, dur: Math.max(120, f.d) }); this.texts.push({ x: e.x, y: e.y - 26, v: f.f ? '派生！' : '溜め', skill: 1, e: 'fire', t0: now }); } break; }
      case 'stagger': { const e = E(f.id); if (e) this.texts.push({ x: e.x, y: e.y - 22, v: 'BREAK', skill: 1, e: 'fire', t0: now }); break; }
      case 'st': { const e = E(f.id); if (e) for (let i = 0; i < 6; i++) this.part(e.x, e.y, STATUS[f.s]?.color || '#fff', 25, 500, true); break; }
      case 'heal': for (let i = 0; i < 18; i++) this.part(f.x + (Math.random() - 0.5) * f.r, f.y + (Math.random() - 0.5) * f.r, '#80ff90', 20, 800, true); break;
      case 'buff': case 'shield': { const e = E(f.id); if (e) for (let i = 0; i < 12; i++) this.part(e.x, e.y, f.t === 'shield' ? '#80c0ff' : ec(f.e || 'holy'), 25, 700, true); break; }
      case 'say': { const e = E(f.id); if (e) e.say = { v: f.v, t0: now }; break; }
      case 'mc': { const e = E(f.id); if (e) this.fx.push({ k: 'mc', follow: e, x: e.x, y: e.y, mc: f.c, r: f.r || 14, t0: now, dur: f.d || 600 }); break; }
      case 'mech': { const v = String(f.v), [kind, sub] = v.split(':'); const col = { wave: '#9ad8ff', split: '#c0c8d8', core: '#e080ff', deploy: '#a0a8b8', link: '#ffd060', orbit: '#d0d8e8', orbitHit: '#ffffff', crystal: '#a0e8ff', tip: '#ffe0a0', melody: '#fff0a0', spirit: '#a0ffd0', heal: '#80ffa0' }[kind] || '#fff';
        const n = kind === 'core' || kind === 'deploy' ? 18 : 6; for (let i = 0; i < n; i++) this.part(f.x, f.y - 8, col, kind === 'core' ? 60 : 30, 400);
        if (kind === 'core' || kind === 'deploy') this.fx.push({ k: 'ring', x: f.x, y: f.y, r: kind === 'core' ? 60 : 70, e: kind === 'core' ? 'dark' : 'phys', t0: now, dur: 350 });
        if (kind === 'melody') this.texts.push({ x: f.x, y: f.y - 30, v: { heal: '♪癒', beat: '♫響', wind: '♪風', hex: '♩呪', war: '♬鼓舞', ward: '♪守' }[sub] || '♪', skill: 1, e: 'holy', col, t0: now });
        if (kind === 'spirit') this.fx.push({ k: 'mc', x: f.x, y: f.y, mc: 'mc_pact_summon', r: 14, t0: now, dur: 500 });
        break; }
      case 'mode': { const e = E(f.id); if (e) this.texts.push({ x: e.x, y: e.y - 26, v: f.v, skill: 1, e: f.e || 'holy', t0: now }); break; }
      case 'die': { const e = E(f.id); if (e) { e.dieAt = now; for (let i = 0; i < 20; i++) this.part(e.x, e.y, e.d.kind === 'monster' ? '#c0c0c0' : '#ff6060', 60, 600); } break; }
      case 'phase': { const e = E(f.id); if (e) { this.texts.push({ x: e.x, y: e.y - 40, v: f.v === 'rage' ? '激昂！' : f.v === 'rebirth' ? '再誕！' : `PHASE ${f.v}`, skill: 1, e: 'fire', t0: now, big: 1 }); this.ring(e.x, e.y, 80, 'fire'); this.shake = 8; } break; }
      case 'shake': if (this.settings.shake) this.shake = Math.max(this.shake, f.v); break;
      case 'timestop': this.fx.push({ k: 'timestop', x: f.x, y: f.y, r: f.r, t0: now, dur: f.d }); break;
      case 'charge': case 'stance': { const e = E(f.id); if (e) e.stanceAt = now; break; }
      case 'steam': { const e = E(f.id); if (e) for (let i = 0; i < 16; i++) this.part(e.x, e.y, '#ddd', 30, 700, true); break; }
      case 'markpop': this.ring(f.x, f.y, 20, 'dark'); break;
      case 'artfx': { const e = E(f.id); if (e) { this.texts.push({ x: e.x, y: e.y - 30, v: `${f.v}${f.n > 1 ? ' ×' + f.n : ''}`, skill: 1, e: 'holy', col: '#ffd070', t0: now }); this.ring(e.x, e.y, 16, 'holy'); } break; }
      case 'revive': { const e = E(f.id); if (e) { e.dieAt = 0; this.ring(e.x, e.y, 30, 'holy'); } break; }
      case 'miss': this.texts.push({ x: f.x, y: f.y - 12, v: 'MISS', skill: 1, e: 'phys', t0: now }); break;
    }
  }
  ring(x, y, r, e) { this.fx.push({ k: 'ring', x, y, r, e, t0: this.time, dur: 350 }); }
  part(x, y, col, spd, life, up) { if (this.parts.length > 600) return; const a = Math.random() * TAU, s = Math.random() * spd; this.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - (up ? 30 : 0), col, t0: this.time, life: life * (0.6 + Math.random() * 0.6), g: up ? -20 : 60 }); }

  draw(state, dt) {
    this.time += dt; const now = this.time; const g = this.g, z = this.zone; if (!z) return;
    const me = state.me; const W = this.w, H = this.h;
    // camera
    let cx = me ? me.x - W / 2 : 0, cy = me ? me.y - H / 2 - 8 : 0;
    cx = Math.max(-16, Math.min(z.w * 16 - W + 16, cx)); cy = Math.max(-16, Math.min(z.h * 16 - H + 16, cy));
    if (z.w * 16 < W) cx = (z.w * 16 - W) / 2; if (z.h * 16 < H) cy = (z.h * 16 - H) / 2;
    this.cam.x += (cx - this.cam.x) * Math.min(1, dt / 80); this.cam.y += (cy - this.cam.y) * Math.min(1, dt / 80);
    if (Math.abs(this.cam.x - cx) > 200) { this.cam.x = cx; this.cam.y = cy; }
    let sx = 0, sy = 0; if (this.shake > 0.1) { sx = (Math.random() - 0.5) * this.shake; sy = (Math.random() - 0.5) * this.shake; this.shake *= 0.86; }
    const ox = Math.round(-this.cam.x + sx), oy = Math.round(-this.cam.y + sy); this.ox = ox; this.oy = oy;
    g.fillStyle = z.pal === 'sky' ? '#7aa0d8' : '#05040a'; g.fillRect(0, 0, W, H);
    g.drawImage(this.tileCanvas, ox, oy);
    // animated tiles
    for (const [x, y, v] of this.anim) {
      const px = x * 16 + ox, py = y * 16 + oy; if (px < -16 || py < -16 || px > W || py > H) continue;
      if (v === T.WATER || v === T.SHALLOW) { const ph = Math.sin(now / 500 + x * 0.7 + y * 1.3); g.fillStyle = `rgba(255,255,255,${0.06 + ph * 0.05})`; g.fillRect(px + ((now / 120 + x * 5) % 12) | 0, py + 4 + (y % 3) * 4, 4, 1); }
      else if (v === T.LAVA) { g.fillStyle = `rgba(255,${180 + Math.sin(now / 300 + x) * 60 | 0},60,${0.25 + Math.sin(now / 400 + x * y) * 0.15})`; g.fillRect(px, py, 16, 16); }
      else if (v === T.PORTAL) { g.strokeStyle = `hsla(${(now / 10) % 360},90%,70%,.8)`; g.beginPath(); g.arc(px + 8, py + 8, 4 + Math.sin(now / 200) * 2, 0, TAU); g.stroke(); }
      else if (v === T.STAIRS || v === T.EXIT) { g.fillStyle = `rgba(${v === T.EXIT ? '120,200,255' : '255,220,120'},${0.2 + Math.sin(now / 300) * 0.15})`; g.fillRect(px, py, 16, 16); }
    }
    // ground fx: areas, telegraphs, drops
    for (const a of state.areas || []) this.drawArea(a, ox, oy, now);
    for (const f of this.fx) if (f.k === 'tele') this.drawTele(f, ox, oy, now); else if (f.k === 'sigil' && f.under) { if (f.mc) this.drawCircleFx(f, ox, oy, now); else this.drawSigil(f, ox, oy, now, 1 - Math.max(0, (now - f.t0) / f.dur - 0.6) / 0.4); } else if (f.k === 'mc') this.drawCircleFx(f, ox, oy, now);
    for (const d of state.drops || []) { const x = d[1] + ox, y = d[2] + oy + Math.sin(now / 300 + d[1]) * 1.5; if (d[3] === 'chest') { g.fillStyle = '#8a5a2a'; g.fillRect(x - 6, y - 5, 12, 9); g.fillStyle = '#e0c060'; g.fillRect(x - 6, y - 2, 12, 1); g.fillRect(x - 1, y - 2, 2, 3); } else { const col = d[3] === 'weapon' ? (RARITIES[d[4]]?.color || '#fff') : d[3] === 'armor' ? '#a0c0ff' : '#c0ff90'; g.fillStyle = col; g.fillRect(x - 2, y - 2, 4, 4); g.fillStyle = '#fff'; g.fillRect(x - 1, y - 2, 1, 1); g.globalAlpha = 0.25 + Math.sin(now / 200) * 0.15; g.fillRect(x - 1, y - 14, 2, 12); g.globalAlpha = 1; } }
    // entities sorted by y
    if (!this.staticNpcs || this.staticZone !== z) { this.staticZone = z; this.staticNpcs = (z.npcs || []).map((n, i) => ({ d: { kind: 'npc', name: n.name, look: { body: i % 3, skin: (i * 3) % 5, hair: i % 6, hairColor: (i * 7) % 10, outfit: (i * 3 + 1) % 10 }, r: 6, service: 1 }, x: n.x * 16 + 8, y: n.y * 16 + 8, facing: Math.PI / 2, seen: true, flags: 0, hp: 1000, svc: true })); }
    const list = [...state.ents.values()].filter(e => e.seen).concat(this.staticNpcs).sort((a, b) => a.y - b.y);
    for (const e of list) this.drawShadow(e, ox, oy);
    for (const e of list) this.drawEntity(e, ox, oy, now, state);
    // projectiles
    for (const p of state.projs || []) this.drawProj(p, ox, oy, now);
    // fx
    this.fx = this.fx.filter(f => now - f.t0 < f.dur);
    for (const f of this.fx) if (f.k !== 'tele') this.drawFx(f, ox, oy, now);
    // particles
    this.parts = this.parts.filter(p => now - p.t0 < p.life);
    for (const p of this.parts) { const k = dt / 1000; p.x += p.vx * k; p.y += p.vy * k; p.vy += p.g * k; p.vx *= 0.96; const a = 1 - (now - p.t0) / p.life; if (p.shape) { drawMotifParticle(g, p, Math.round(p.x + ox), Math.round(p.y + oy), a); continue; } g.globalAlpha = a; g.fillStyle = p.col; g.fillRect(Math.round(p.x + ox), Math.round(p.y + oy), 1, 1); }
    g.globalAlpha = 1;
    // fog
    if (this.pal.fog) { g.fillStyle = this.pal.fog; for (let i = 0; i < 6; i++) { g.globalAlpha = 0.05; const fx = ((now / 60 + i * 97) % (W + 120)) - 60, fy = (i * 53 + Math.sin(now / 3000 + i) * 20) % H; g.beginPath(); g.ellipse(fx, fy, 80, 26, 0, 0, TAU); g.fill(); } g.globalAlpha = 1; }
    this.drawLighting(state, ox, oy, now);
    if (z.kind === 'town' || z.kind === 'field') this.drawWeather(state.env?.wx, dt, now);
    if (this.fade > 0) { g.fillStyle = `rgba(0,0,0,${this.fade})`; g.fillRect(0, 0, W, H); this.fade = Math.max(0, this.fade - dt / 450); }
    this.drawOverlay(state, list, ox, oy, now);
  }
  drawArea(a, ox, oy, now) {
    const g = this.g; const [x, y, r, el, kind, ally] = a; const col = ec(el || (ally ? 'holy' : 'dark'));
    g.save(); g.translate(x + ox, y + oy);
    if (kind === 3) { for (let i = 0; i < 5; i++) { const an = now / 200 + i * TAU / 5; g.fillStyle = '#d0e8ff'; g.fillRect(Math.cos(an) * r * 0.8 - 2, Math.sin(an) * r * 0.8 - 1, 4, 2); } g.restore(); return; }
    g.globalAlpha = kind === 2 ? 0.35 : 0.16 + Math.sin(now / 250) * 0.04; g.fillStyle = col; g.beginPath(); g.ellipse(0, 0, r, r * 0.75, 0, 0, TAU); g.fill();
    g.globalAlpha = 0.6; g.strokeStyle = col; g.lineWidth = 1; g.setLineDash(kind === 2 ? [2, 2] : []); g.beginPath(); g.ellipse(0, 0, r, r * 0.75, 0, 0, TAU); g.stroke(); g.setLineDash([]);
    if (kind === 4) { g.globalAlpha = 0.5; for (let i = 0; i < 3; i++) { const rr = r * (1 - ((now / 600 + i / 3) % 1)); g.beginPath(); g.ellipse(0, 0, rr, rr * 0.75, 0, 0, TAU); g.stroke(); } }
    if (kind === 1) { g.globalAlpha = 0.5; for (let i = 0; i < 4; i++) { const an = now / 600 + i * TAU / 4; g.fillStyle = col; g.fillRect(Math.cos(an) * r * 0.7, Math.sin(an) * r * 0.5 - (now / 30 % 10), 1, 3); } }
    g.restore(); g.globalAlpha = 1;
  }
  drawTele(f, ox, oy, now) {
    const g = this.g; const p = Math.min(1, (now - f.t0) / f.dur); const col = f.pv ? f.pv.c1 : f.e && f.e !== 'phys' ? ec(f.e) : '#ff4040';
    if (f.pv && f.ally) { this.drawSigil({ x: f.x, y: f.y, r: f.r, pv: f.pv, t0: f.t0, dur: f.dur }, ox, oy, now, 0.5 + p * 0.5); return; }
    g.save(); g.translate(f.x + ox, f.y + oy); g.globalAlpha = 0.18 + p * 0.2; g.fillStyle = col; g.strokeStyle = col;
    const path = (k) => { g.beginPath(); if (f.s === 'circle') g.arc(0, 0, f.r * k, 0, TAU); else if (f.s === 'arc') { g.moveTo(0, 0); g.arc(0, 0, f.r * k, f.a - f.ar * Math.PI / 360, f.a + f.ar * Math.PI / 360); g.closePath(); } else if (f.s === 'slam') g.arc(Math.cos(f.a) * f.dd, Math.sin(f.a) * f.dd, f.r * k, 0, TAU); else { g.rotate(f.a); g.rect(0, -f.w / 2, f.l * k, f.w); } };
    path(1); g.globalAlpha = 0.15; g.fill(); g.globalAlpha = 0.55; g.lineWidth = 1; g.stroke(); g.restore(); g.save(); g.translate(f.x + ox, f.y + oy); g.fillStyle = col; path(p); g.globalAlpha = 0.3; g.fill(); g.restore(); g.globalAlpha = 1;
  }
  drawShadow(e, ox, oy) { if (e.svc && this.zone.kind === 'interior') return; const g = this.g; const r = e.d.boss ? 14 : (e.d.r || 6); g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(Math.round(e.x + ox), Math.round(e.y + oy + 1), r, r * 0.45, 0, 0, TAU); g.fill(); }
  drawEntity(e, ox, oy, now, state) {
    const g = this.g; const d = e.d; if (e.svc && this.zone.kind === 'interior') return; const x = Math.round(e.x + ox), y = Math.round(e.y + oy);
    if (x < -40 || y < -40 || x > this.w + 40 || y > this.h + 40) return;
    const dead = e.flags & 1; if (dead && e.dieAt && now - e.dieAt > 900 && d.kind === 'monster') return;
    const air = e.flags & 32 ? -8 : 0; const stealth = e.flags & 256;
    g.save(); if (dead) g.globalAlpha = Math.max(0, 1 - (now - (e.dieAt || now)) / 900); if (stealth) g.globalAlpha = 0.35; if ((e.flags & 2) && d.kind !== 'monster') g.globalAlpha *= 0.7;
    const moving = Math.hypot(e.vx || 0, e.vy || 0) > 0.02; e.walk = (e.walk || 0) + (moving ? 1 : 0);
    const flash = e.flash && now - e.flash < 90;
    if (d.kind === 'monster' || (d.kind === 'summon' && !d.look)) {
      const sc = d.boss ? 2 : d.kind === 'summon' ? 0.75 : 1; const spr = d.kind === 'summon' ? monsterSprite({ sprite: { clone: 'spirit', familiar: 'spirit', golem: 'golem', spirit: 'spirit', turret: 'golem', skeleton: 'undead', beast: 'beast', puppet: 'humanoid', tome: 'eye' }[d.sk] || 'spirit', fam: d.sk, el: 'holy' }, Math.floor(now / 300) % 2) : monsterSprite(d, Math.floor(now / (300 - (moving ? 120 : 0))) % 2);
      g.translate(x, y + air); const flip = Math.cos(e.facing) < 0 ? -1 : 1; g.scale(flip * sc, sc);
      if (e.flags & 512) { g.shadowColor = '#ff2040'; g.shadowBlur = 6; }
      if (isBody(d.sk)) drawBody(g, d.sk, now, e.act); else g.drawImage(spr, -12, -20);
      if (flash && !isBody(d.sk)) { g.globalCompositeOperation = 'source-atop'; g.globalAlpha = 0.8; g.fillStyle = '#fff'; g.fillRect(-12, -20, 24, 24); }
      g.restore();
    } else {
      const look = d.look || {}; const c = Math.cos(e.facing), s = Math.sin(e.facing); const dir = Math.abs(c) > 0.55 ? 2 : s < 0 ? 1 : 0;
      const frame = moving ? Math.floor(e.walk / 6) % 4 : 0;
      const spr = charSprite(look, dir, frame);
      const wt = WT_BY_ID[d.wt]; const wcol = RARITIES[d.wr || 1]?.color;
      g.translate(x, y + air);
      const flip = dir === 2 && c < 0;
      const drawW = () => { if (!wt) return; const wsp = d.wl ? identWeapon(weaponSprite(wt.vis, wcol), d.wl, e.flags & 4096, wcol) : weaponSprite(wt.vis, wcol); const ang = this.weaponAngle(e, now, wt); g.save(); g.translate(flip ? -3 : 3, -9); g.rotate(ang); const ext = this.weaponExt(e, now); g.drawImage(wsp, -2 + ext, -12); g.restore(); };
      if (dir === 1) drawW();
      g.save(); if (flip) g.scale(-1, 1); if (e.dodgeAt && now - e.dodgeAt < 250) { g.rotate((now - e.dodgeAt) / 250 * TAU * (flip ? -1 : 1) * 0.5); }
      g.drawImage(spr, -8, -22); if (d.mask && dir !== 1) { g.fillStyle = '#efe8d8'; g.fillRect(-5, -18, 10, 4); g.fillStyle = '#1a1a1a'; g.fillRect(-3, -17, 2, 1); g.fillRect(1, -17, 2, 1); } if (flash) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(255,255,255,.8)'; g.fillRect(-8, -22, 16, 24); } g.restore();
      if (dir !== 1) drawW();
      if (d.wl) drawWielder(g, d.wl, e.flags, now);
      if (e.flags & 4) { g.strokeStyle = 'rgba(140,200,255,.8)'; g.beginPath(); g.arc(Math.cos(e.facing) * 6, Math.sin(e.facing) * 6 - 8, 9, e.facing - 1, e.facing + 1); g.stroke(); }
      if (e.flags & 2048 || (e.stanceAt && now - e.stanceAt < 500)) { g.strokeStyle = `rgba(255,255,200,${0.5 + Math.sin(now / 50) * 0.3})`; g.beginPath(); g.arc(0, -10, 12, 0, TAU); g.stroke(); }
      if (e.cast && now - e.cast.t0 < e.cast.dur) { const pv = e.cast.pv, p = (now - e.cast.t0) / e.cast.dur; g.globalAlpha = 0.6 * (1 - p); g.strokeStyle = pv.c1; g.beginPath(); g.arc(0, -10, 8 + p * 8, 0, TAU); g.stroke(); g.globalAlpha = 1; g.fillStyle = pv.c2; for (let i = 0; i < 3; i++) { const an = now / 90 + i * 2.1; g.fillRect(Math.cos(an) * 9, -10 + Math.sin(an) * 5 - p * 8, 1, 1); } }
      if (e.ench) { g.globalAlpha = 0.5; g.fillStyle = ec(e.ench); for (let i = 0; i < 2; i++) g.fillRect(Math.cos(now / 100 + i * 3) * 8, -10 + Math.sin(now / 130 + i) * 6, 1, 1); }
      if (e.flags & 1024) { g.globalAlpha = 0.7; g.fillStyle = '#fff'; g.fillRect(-10, -16 + Math.sin(now / 100) * 2, 4, 2); g.fillRect(6, -16 + Math.sin(now / 100) * 2, 4, 2); }
      g.restore();
    }
    if (e.flags & 64) { g.strokeStyle = 'rgba(120,180,255,.7)'; g.beginPath(); g.arc(x, y - 8, (d.r || 6) + 6, 0, TAU); g.stroke(); }
    if (e.flags & 128) { g.fillStyle = '#c040ff'; g.fillRect(x - 1, y - 30 - (d.boss ? 18 : 0), 3, 3); }
    if (e.flags & 8) { g.fillStyle = 'rgba(160,220,255,.35)'; g.fillRect(x - 7, y - 20, 14, 20); }
  }
  weaponAngle(e, now, wt) {
    const base = e.facing; const a = e.atk;
    if (e.cast && now - e.cast.t0 < e.cast.dur) { const p = (now - e.cast.t0) / e.cast.dur; const k = e.cast.kind; if (k === 'spin' || k === 'multi') return base + p * TAU * 2; if (['buff', 'guard', 'summon', 'zone', 'barrage', 'job', 'heal', 'aegis', 'blessing', 'sanctuary', 'meteor', 'starfall'].includes(k)) return -Math.PI / 2 + Math.sin(p * 12) * 0.15; if (k === 'heavy' || k === 'leap') return base - 2 + p * 2.4; }
    if (a && now - a.t0 < a.dur) {
      const p = Math.min(1, (now - a.t0) / a.dur), sw = Math.min(1, p * 2.2); const dirn = a.step % 2 ? -1 : 1;
      if (a.sh === 'arc' || a.sh === 'whip') return base + dirn * (-1.4 + sw * 2.8);
      if (a.sh === 'circle') return base + sw * TAU;
      if (a.sh === 'slam') return base - 1.8 + sw * 1.9;
      return base;
    }
    if (e.flags & 4) return base - 0.3;
    return base + (Math.cos(base) < 0 ? -0.9 : 0.9) * 0.6;
  }
  weaponExt(e, now) { const a = e.atk; if (!a || now - a.t0 > a.dur) return 0; if (a.sh === 'thrust' || a.sh === 'chain') { const p = (now - a.t0) / a.dur; return Math.sin(Math.min(1, p * 2) * Math.PI) * 8; } return 0; }
  drawProj(p, ox, oy, now) {
    const g = this.g; const [x0, y0, a, sz, el, k, , v] = p; const x = x0 + ox, y = y0 + oy; const col = ec(el || 'phys');
    if (v) { const pv = vfxProfile(v, el || null); g.save(); g.translate(x, y); g.rotate(a);
      const s2 = sz + 1; g.globalAlpha = 0.35; g.fillStyle = pv.c2; for (let t = 1; t <= 3; t++) g.fillRect(-s2 * t * 1.2, -s2 / 2 + 0.5, s2, s2 - 1);
      g.globalAlpha = 1; g.fillStyle = pv.c1;
      switch (pv.motif) {
        case 'crescent': case 'afterimage': g.strokeStyle = pv.c1; g.lineWidth = 2; g.beginPath(); g.arc(-s2, 0, s2 + 2, -1.2, 1.2); g.stroke(); break;
        case 'shards': case 'prism': g.beginPath(); g.moveTo(s2 + 2, 0); g.lineTo(-s2, -s2 / 2); g.lineTo(-s2, s2 / 2); g.closePath(); g.fill(); g.fillStyle = '#fff'; g.fillRect(0, 0, 2, 1); break;
        case 'stars': case 'glyphs': g.rotate(this.time / 80); for (let i = 0; i < 4; i++) { g.rotate(Math.PI / 2); g.fillRect(0, -0.5, s2 + 2, 1.5); } break;
        case 'feathers': case 'leaves': case 'petals': g.fillRect(-s2, -1, s2 * 2 + 2, 2); g.fillStyle = pv.c2; g.fillRect(-s2, 1, s2 * 2, 1); break;
        case 'lightning': case 'sparks': g.strokeStyle = pv.c1; g.beginPath(); g.moveTo(-s2 * 2, 0); for (let i = -1; i <= 2; i++) g.lineTo(i * s2, (Math.random() - 0.5) * s2 * 1.6); g.stroke(); break;
        default: { const grd = g.createRadialGradient(0, 0, 0, 0, 0, s2 + 2); grd.addColorStop(0, '#fff'); grd.addColorStop(0.45, pv.c1); grd.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = grd; g.beginPath(); g.arc(0, 0, s2 + 2, 0, TAU); g.fill(); g.strokeStyle = pv.c2; g.beginPath(); g.arc(0, 0, s2 + 3 + Math.sin(this.time / 60), this.time / 90, this.time / 90 + 2); g.stroke(); }
      }
      g.restore(); if (Math.random() < 0.5 && this.parts.length < 900) this.parts.push({ x: x0, y: y0, vx: 0, vy: 0, col: pv.c2, t0: this.time, life: 300, g: 0, shape: pv.motif, size: 1, rot: 0, vr: 0 }); return; }
    g.save(); g.translate(x, y); g.rotate(a);
    if (['bow', 'crossbow', 'repeater', 'magibow', 'spiritbow'].includes(k)) { g.fillStyle = '#e8d8b0'; g.fillRect(-6, 0, 8, 1); g.fillStyle = el ? col : '#ccc'; g.fillRect(2, -1, 2, 3); g.fillStyle = '#fff'; g.fillRect(-7, -1, 2, 1); g.fillRect(-7, 1, 2, 1); }
    else if (['chakram', 'boomerang', 'warring', 'tomahawk', 'twinblade', 'bigball', 'chainball'].includes(k)) { g.rotate(now / 40); g.fillStyle = k === 'bigball' || k === 'chainball' ? '#6a7078' : '#d8d0a0'; if (k === 'bigball' || k === 'chainball') { g.beginPath(); g.arc(0, 0, sz, 0, TAU); g.fill(); } else { g.fillRect(-sz, -1, sz * 2, 2); g.fillRect(-1, -sz, 2, sz * 2); } }
    else if (['flysword', 'floatblade', 'godsword', 'demonsword'].includes(k)) { g.fillStyle = '#e8f0ff'; g.fillRect(-sz, -1, sz * 2, 2); g.fillStyle = col; g.fillRect(-sz - 2, -1, 2, 2); }
    else if (k === 'javelin' || k === 'angelspear' || k === 'trident') { g.fillStyle = '#b8a070'; g.fillRect(-10, 0, 14, 1); g.fillStyle = el ? col : '#ddd'; g.fillRect(4, -1, 3, 3); }
    else { const grd = g.createRadialGradient(0, 0, 0, 0, 0, sz + 2); grd.addColorStop(0, '#fff'); grd.addColorStop(0.4, col); grd.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = grd; g.beginPath(); g.arc(0, 0, sz + 2, 0, TAU); g.fill(); g.globalAlpha = 0.4; g.fillStyle = col; g.fillRect(-sz * 2.5, -1, sz * 2, 2); }
    g.restore();
  }
  drawFx(f, ox, oy, now) {
    const g = this.g; const p = (now - f.t0) / f.dur; const col = ec(f.e); g.save(); g.translate(f.x + ox, f.y + oy);
    if (f.k === 'shape') {
      const pv = f.pv; g.globalAlpha = 1 - p; g.strokeStyle = pv ? pv.c1 : f.e === 'phys' ? '#fff' : col; g.fillStyle = pv ? pv.c2 : f.e === 'phys' ? 'rgba(255,255,255,.3)' : col;
      if (pv && f.s === 'arc') { for (let k = 0; k <= pv.trail; k++) { g.globalAlpha = (1 - p) * (1 - k / (pv.trail + 1)); g.strokeStyle = k % 2 ? pv.c2 : pv.c1; g.lineWidth = pv.width - k * 0.4 + 1; const ar2 = f.ar * Math.PI / 360; g.beginPath(); g.arc(0, 0, f.r * (0.55 + k * 0.12 + p * 0.3), f.a - ar2 - k * 0.12, f.a - ar2 + ar2 * 2 * Math.min(1, p * 2.5) - k * 0.12); g.stroke(); } g.globalAlpha = 1 - p; g.strokeStyle = '#fff'; g.lineWidth = 1; }
      const ar = f.ar * Math.PI / 360;
      if (f.s === 'arc') { g.lineWidth = 3 * (1 - p) + 1; g.beginPath(); g.arc(0, 0, f.r * (0.7 + p * 0.3), f.a - ar, f.a - ar + ar * 2 * Math.min(1, p * 2.5)); g.stroke(); g.globalAlpha = (1 - p) * 0.25; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, f.r, f.a - ar, f.a + ar); g.closePath(); g.fill(); }
      else if (f.s === 'circle') { g.lineWidth = pv ? pv.width : 2; const rr = pv ? pv.rings : 1; for (let k = 0; k < rr; k++) { g.strokeStyle = k % 2 && pv ? pv.c2 : g.strokeStyle; g.beginPath(); g.arc(0, 0, f.r * (0.4 + p * 0.6) * (1 - k * 0.22), 0, TAU); g.stroke(); } g.globalAlpha = (1 - p) * 0.15; g.fill(); if (pv?.motif === 'spiral' || pv?.motif === 'tendrils') { g.globalAlpha = 1 - p; g.beginPath(); for (let t = 0; t < 30; t++) { const an = t * 0.5 + now / 80, rd = f.r * t / 30; g.lineTo(Math.cos(an) * rd, Math.sin(an) * rd); } g.stroke(); } }
      else if (f.s === 'whip') { g.lineWidth = 2; g.beginPath(); g.arc(0, 0, f.l, f.a - ar, f.a + ar * (p * 2 - 1)); g.stroke(); }
      else if (f.s === 'slam') { g.beginPath(); g.arc(Math.cos(f.a) * f.d, Math.sin(f.a) * f.d, f.r * (0.4 + p * 0.6), 0, TAU); g.globalAlpha = (1 - p) * 0.4; g.fill(); }
      else { g.rotate(f.a); const w = Math.max(2, f.w || 6) * (1 - p * 0.5); if (f.s === 'beam') { const grd = g.createLinearGradient(0, 0, f.l, 0); grd.addColorStop(0, '#fff'); grd.addColorStop(1, col); g.fillStyle = grd; g.fillRect(0, -w / 2, f.l, w); g.fillStyle = '#fff'; g.fillRect(0, -1, f.l, 2); } else { g.fillRect(0, -w / 4, f.l * Math.min(1, p * 3), w / 2); g.fillStyle = '#fff'; g.fillRect(f.l * Math.min(1, p * 3) - 3, -1, 3, 2); } }
    } else if (f.k === 'ring') { g.globalAlpha = 1 - p; g.strokeStyle = col; g.lineWidth = 2; g.beginPath(); g.ellipse(0, 0, f.r * (0.3 + p), f.r * (0.3 + p) * 0.75, 0, 0, TAU); g.stroke(); }
    else if (f.k === 'flash') { g.globalAlpha = (1 - p) * 0.6; const grd = g.createRadialGradient(0, 0, 0, 0, 0, f.r); grd.addColorStop(0, '#fff'); grd.addColorStop(0.3, col); grd.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = grd; g.beginPath(); g.arc(0, 0, f.r, 0, TAU); g.fill(); }
    else if (f.k === 'bolt') { g.globalAlpha = 1 - p; g.strokeStyle = col; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -80); for (let i = 1; i <= 6; i++) g.lineTo((Math.random() - 0.5) * 10, -80 + i * 13.3); g.stroke(); }
    else if (f.k === 'sigil') { g.restore(); if (!f.under) this.drawSigil(f, ox, oy, now, 1 - p); return; }
    else if (f.k === 'pillar') { if (now < f.t0) { g.restore(); return; } g.globalAlpha = 1 - p; const grd = g.createLinearGradient(0, -60, 0, 0); grd.addColorStop(0, 'rgba(0,0,0,0)'); grd.addColorStop(1, f.c || col); g.fillStyle = grd; g.fillRect(-3, -60, 6, 60); g.fillStyle = '#fff'; g.fillRect(-1, -60, 2, 60); }
    else if (f.k === 'timestop') { g.globalAlpha = 0.25 * (1 - p); g.fillStyle = '#c0d0ff'; g.beginPath(); g.arc(0, 0, f.r, 0, TAU); g.fill(); g.globalAlpha = 0.6; g.strokeStyle = '#e0e8ff'; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(now / 300) * f.r * 0.5, Math.sin(now / 300) * f.r * 0.5); g.stroke(); }
    g.restore(); g.globalAlpha = 1;
  }
  drawCircleFx(f, ox, oy, now) { const x = (f.follow ? f.follow.x : f.x) + ox, y = (f.follow ? f.follow.y : f.y) + oy; const p = Math.min(1, (now - f.t0) / f.dur); const r = Math.max(f.r, 22);
    drawMagicCircle(this.g, f.mc, x, y, r, p, now, 0.75); if (f.mc2) drawMagicCircle(this.g, f.mc2, x, y, r * 0.55, p, now * -1, 0.9); }
  drawSigil(f, ox, oy, now, alpha) {
    const g = this.g, pv = f.pv; const x = (f.follow ? f.follow.x : f.x) + ox, y = (f.follow ? f.follow.y : f.y) + oy; const p = Math.min(1, (now - f.t0) / f.dur);
    const r = f.r * (f.under ? Math.min(1, p * 4) : 0.6 + p * 0.5);
    g.save(); g.translate(x, y); g.scale(1, 0.55); g.globalAlpha = Math.max(0, alpha); g.strokeStyle = pv.c1; g.lineWidth = 1;
    const rot = now / 400 * (pv.spin > 0 ? 1 : -1) + pv.spin * now;
    for (let k = 0; k < pv.rings; k++) { g.beginPath(); g.arc(0, 0, r * (1 - k * 0.25), 0, TAU); g.stroke(); }
    g.strokeStyle = pv.c2; g.beginPath(); for (let i = 0; i <= pv.sides; i++) { const a = rot + i * TAU / pv.sides * (pv.sides % 2 ? 2 : 1); g.lineTo(Math.cos(a) * r * 0.85, Math.sin(a) * r * 0.85); } g.stroke();
    g.fillStyle = pv.c3; for (let i = 0; i < pv.sides; i++) { const a = -rot + i * TAU / pv.sides; g.fillRect(Math.cos(a) * r - 1, Math.sin(a) * r - 1, 2, 2); }
    g.restore(); g.globalAlpha = 1;
  }
  drawWeather(wx, dt, now) {
    if (!wx || wx === 'clear' || wx === 'cloud') return; const g = this.g, W = this.w, H = this.h; const P = this.wxParts ||= [];
    const rate = { rain: 6, storm: 10, snow: 2, wind: 3, smog: 1, aurora: 0, fog: 0 }[wx] || 0;
    for (let i = 0; i < rate; i++) P.push({ x: Math.random() * (W + 60) - 30, y: -5, vx: wx === 'wind' || wx === 'storm' ? -120 : wx === 'snow' ? (Math.random() - 0.5) * 20 : -30, vy: wx === 'snow' ? 25 + Math.random() * 15 : wx === 'wind' ? 30 : 260 + Math.random() * 60, life: 2500 });
    const k = dt / 1000; g.globalAlpha = 0.55;
    for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; p.x += p.vx * k; p.y += p.vy * k; p.life -= dt; if (p.y > H || p.life <= 0) { P.splice(i, 1); continue; }
      if (wx === 'snow') { g.fillStyle = '#fff'; g.fillRect(p.x | 0, p.y | 0, 1, 1); } else if (wx === 'wind') { g.fillStyle = '#e0e8f0'; g.fillRect(p.x | 0, p.y | 0, 4, 1); } else if (wx === 'smog') { g.fillStyle = 'rgba(80,70,60,.5)'; g.fillRect(p.x | 0, p.y | 0, 3, 3); } else { g.fillStyle = '#a0c0e8'; g.fillRect(p.x | 0, p.y | 0, 1, 3); } }
    if (P.length > 600) P.splice(0, P.length - 600);
    g.globalAlpha = 1;
    if (wx === 'fog' || wx === 'smog') { g.fillStyle = wx === 'fog' ? 'rgba(220,225,235,.22)' : 'rgba(90,80,70,.22)'; g.fillRect(0, 0, W, H); }
    if (wx === 'storm' && Math.random() < 0.004) this.flashT = now; if (this.flashT && now - this.flashT < 120) { g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(0, 0, W, H); }
    if (wx === 'aurora' && this.night > 0.3) { for (let i = 0; i < 3; i++) { const grd = g.createLinearGradient(0, 0, W, 0); grd.addColorStop(0, 'rgba(80,255,180,0)'); grd.addColorStop(0.5, `rgba(${100 + i * 60},${200 - i * 40},255,.18)`); grd.addColorStop(1, 'rgba(80,255,180,0)'); g.fillStyle = grd; g.fillRect(0, 10 + i * 12 + Math.sin(now / 1500 + i) * 8, W, 10); } }
  }
  drawLighting(state, ox, oy, now) {
    if (!this.settings.lighting) return;
    const z = this.zone; let dark = this.pal.dark + (z.darkness ? 0.3 : 0);
    const hr = state.env ? state.env.h + state.env.m / 60 : 12; this.night = Math.max(0, Math.cos(hr / 24 * TAU)); // 1 at midnight, 0 by day
    if (z.kind === 'town' || z.kind === 'field') { dark = Math.max(dark, this.night * 0.62); const wx = state.env?.wx; if (wx === 'rain' || wx === 'storm' || wx === 'smog') dark += 0.12; if (wx === 'fog') dark += 0.06; }
    if (z.kind === 'interior') dark = Math.max(0.12, dark * 0.6);
    if (dark <= 0.02) return;
    const L = this.lg, W = this.w, H = this.h; L.globalCompositeOperation = 'source-over'; L.clearRect(0, 0, W, H); L.fillStyle = `rgba(4,3,14,${Math.min(0.92, dark)})`; L.fillRect(0, 0, W, H);
    L.globalCompositeOperation = 'destination-out';
    const hole = (x, y, r, a = 1) => { if (x < -r || y < -r || x > W + r || y > H + r) return; const grd = L.createRadialGradient(x, y, 0, x, y, r); grd.addColorStop(0, `rgba(0,0,0,${a})`); grd.addColorStop(0.6, `rgba(0,0,0,${a * 0.6})`); grd.addColorStop(1, 'rgba(0,0,0,0)'); L.fillStyle = grd; L.beginPath(); L.arc(x, y, r, 0, TAU); L.fill(); };
    const me = state.me; if (me) hole(me.x + ox, me.y + oy - 8, z.darkness ? 70 : 110);
    for (const e of state.ents.values()) if (e.seen && (e.d.kind === 'player' || e.d.kind === 'npc') && e !== state.meEnt) hole(e.x + ox, e.y + oy - 8, 50, 0.7);
    for (const [lx, ly] of z.lights || []) hole(lx * 16 + 8 + ox, ly * 16 + 8 + oy, 54 + Math.sin(now / 120 + lx) * 4, 0.9);
    if (this.night > 0.25) for (const [wx, wy, ww, wh, k] of this.windows || []) if (k) hole(wx + ww / 2 + ox, wy + wh / 2 + oy, k === 3 ? 60 : 14, k === 2 ? 0.9 : 0.6);
    for (const p of state.projs || []) hole(p[0] + ox, p[1] + oy, 22, 0.8);
    for (const f of this.fx) if (f.k === 'flash' || f.k === 'ring') hole(f.x + ox, f.y + oy, f.r * 1.5, 1 - (now - f.t0) / f.dur);
    for (const [x, y, v] of this.anim) if (v === T.LAVA || v === T.PORTAL || v === T.STAIRS || v === T.EXIT) hole(x * 16 + 8 + ox, y * 16 + 8 + oy, v === T.LAVA ? 22 : 30, 0.6);
    this.g.drawImage(this.light, 0, 0);
    // colored glow
    const g = this.g; g.globalCompositeOperation = 'lighter';
    for (const [lx, ly] of z.lights || []) { const x = lx * 16 + 8 + ox, y = ly * 16 + 8 + oy; if (x < -40 || y < -40 || x > W + 40 || y > H + 40) continue; const grd = g.createRadialGradient(x, y, 0, x, y, 40); grd.addColorStop(0, 'rgba(255,170,80,.25)'); grd.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = grd; g.fillRect(x - 40, y - 40, 80, 80); g.fillStyle = '#ffd080'; g.fillRect(x - 1, y - 3 - (Math.sin(now / 90 + lx) > 0 ? 1 : 0), 2, 3); }
    if (this.night > 0.2) for (const [wx, wy, ww, wh, k] of this.windows || []) { const x = wx + ox, y = wy + oy; if (x < -60 || y < -60 || x > W + 60 || y > H + 60 || !k) continue; const lit = k === 2 ? ['#ff40a0', '#40e0ff', '#ffd040'][(wx + Math.floor(now / 700)) % 3] : k === 3 ? '#ffd060' : (((wx * 7 + wy) % 5) < 3 ? '#ffd890' : null); if (!lit) continue; g.globalAlpha = Math.min(1, this.night * 1.4) * (k === 2 ? 0.8 + Math.sin(now / 90 + wx) * 0.2 : 0.85); g.fillStyle = lit; g.fillRect(x, y, ww, wh); }
    g.globalAlpha = 1;
    for (const p of state.projs || []) { const x = p[0] + ox, y = p[1] + oy; const grd = g.createRadialGradient(x, y, 0, x, y, 14); grd.addColorStop(0, ec(p[4] || 'phys') + '88'); grd.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = grd; g.fillRect(x - 14, y - 14, 28, 28); }
    g.globalCompositeOperation = 'source-over';
  }
  drawOverlay(state, list, ox, oy, now) {
    const o = this.og, S = this.scale; o.clearRect(0, 0, innerWidth, innerHeight); o.textAlign = 'center';
    for (const e of list) {
      const d = e.d; const x = (e.x + ox) * S, y = (e.y + oy) * S; if (x < -50 || y < -50 || x > innerWidth + 50 || y > innerHeight + 50) continue;
      const dead = e.flags & 1; const top = y - (d.boss ? 48 : d.kind === 'monster' ? 24 : 28) * S;
      if (!dead && (d.kind !== 'player' || e !== state.meEnt)) {
        if (d.kind === 'monster' && (e.hp < 1000 || d.boss || d.elite)) { const w = d.boss ? 60 * S / 2 : 14 * S; o.fillStyle = 'rgba(0,0,0,.6)'; o.fillRect(x - w / 2 - 1, top - 1, w + 2, 5); o.fillStyle = d.boss ? '#ff3050' : '#e04040'; o.fillRect(x - w / 2, top, w * e.hp / 1000, 3); }
        if (d.kind === 'resident' || d.kind === 'slumnpc') { if (state.me && Math.hypot(e.x - state.me.x, e.y - state.me.y) < (d.kind === 'slumnpc' ? 90 : 56)) { o.font = '10px sans-serif'; o.fillStyle = d.kind === 'slumnpc' ? '#ffd8a0' : '#e8e0c8'; o.strokeStyle = 'rgba(0,0,0,.8)'; o.lineWidth = 3; const l = `${d.name}（${d.job}）`; o.strokeText(l, x, top + 4); o.fillText(l, x, top + 4); } continue; }
        if (d.service) { o.font = 'bold 12px sans-serif'; o.fillStyle = '#ffd070'; o.strokeStyle = 'rgba(0,0,0,.85)'; o.lineWidth = 3; o.strokeText('▼ ' + d.name, x, top - 4); o.fillText('▼ ' + d.name, x, top - 4); continue; }
        if (d.kind !== 'monster' || d.boss || d.elite || e.hover) { o.font = `${d.boss ? 'bold 14px' : '11px'} sans-serif`; o.fillStyle = d.kind === 'player' ? '#ffffff' : d.kind === 'npc' ? '#a0e0ff' : d.boss ? '#ffb040' : d.elite ? '#ffd070' : '#ddd'; o.strokeStyle = 'rgba(0,0,0,.8)'; o.lineWidth = 3; const label = `${d.kind === 'npc' ? '◆' : ''}${d.name}${d.lv ? ' Lv' + d.lv : ''}`; o.strokeText(label, x, top - 4); o.fillText(label, x, top - 4); if (d.affix?.length) { o.font = '10px sans-serif'; o.fillStyle = '#ff80c0'; o.strokeText(d.affix.join('・'), x, top - 16); o.fillText(d.affix.join('・'), x, top - 16); } }
        if (d.kind !== 'monster' && e.hp < 1000) { o.fillStyle = 'rgba(0,0,0,.6)'; o.fillRect(x - 15, top, 30, 4); o.fillStyle = '#50e070'; o.fillRect(x - 15, top, 30 * e.hp / 1000, 3); }
      }
      if (e.sts) { let i = 0; o.font = '9px sans-serif'; for (const s of e.sts.split(',')) { if (!s) continue; o.fillStyle = STATUS[s]?.color || '#fff'; o.fillText(STATUS[s]?.name || s, x - 20 + i * 20, top + 14); i++; } }
      if (e.say && now - e.say.t0 < 3500) { o.font = '12px sans-serif'; const w = Math.min(220, o.measureText(e.say.v).width + 12); o.fillStyle = 'rgba(255,255,255,.92)'; o.fillRect(x - w / 2, top - 36, w, 20); o.fillStyle = '#222'; o.fillText(e.say.v.slice(0, 30), x, top - 22); }
    }
    if (state.me) { o.font = '11px sans-serif'; o.lineWidth = 3; o.strokeStyle = 'rgba(0,0,0,.85)'; for (const d of this.zone.doors || []) { if (d.home && !d.mine) continue; const dxw = d.x * 16 + 8, dyw = d.y * 16; if (Math.abs(dxw - state.me.x) > 170 || Math.abs(dyw - state.me.y) > 120) continue; const x = (dxw + ox) * S, y = (dyw - 18 + oy) * S; const n = d.mine ? '🏠 マイホーム' : d.name; o.fillStyle = d.mine ? '#a0ffb0' : '#fff0c8'; o.strokeText(n, x, y); o.fillText(n, x, y); } }
    if (state.me && this.zone.kind === 'field') { o.font = 'bold 11px sans-serif'; o.lineWidth = 3; o.strokeStyle = 'rgba(0,0,0,.85)'; const BL = { clue: ['◇ 調べる', '#9fe8ff'], sunkengate: ['◆ 海底の巨大な門', '#60d0ff'], moondevice: ['☾ 古い観測装置', '#c8b0ff'], moongate: ['☾ 月紋の石門', '#d0a0ff'], moonruin: ['◇ 古代遺跡の石柱', '#b0a0d0'], calshrine: ['◆ 災厄の祠', '#ffb070'], caltrace: ['◇ 妙な痕跡', '#e0c080'], machinecore: ['⚙ 古代遺跡の中枢', '#60e0ff'] };
      for (const ob of this.zone.objects || []) { const L = BL[ob.k] || (ob.label ? [ob.label, '#a8e0ff'] : null); if (!L) continue; const wx = ob.x * 16 + 8, wy = ob.y * 16 - 4; if (Math.hypot(wx - state.me.x, wy - state.me.y) > 140) continue; const x = (wx + ox) * S, y = (wy - 18 + oy) * S; o.fillStyle = L[1]; o.strokeText(L[0], x, y); o.fillText(L[0], x, y); } }
    if (this.zone.kind === 'slum' && state.me) { o.font = 'bold 11px sans-serif'; o.lineWidth = 3; o.strokeStyle = 'rgba(0,0,0,.85)';
      for (const ob of this.zone.objects || []) { const wx = ob.x * 16 + 8, wy = ob.y * 16 - 4; const dd = Math.hypot(wx - state.me.x, wy - state.me.y); if (dd > 200) continue; const x = (wx + ox) * S, y = (wy - 14 + oy) * S; let t = '', col = '#fff';
        if (ob.k === 'exit') { t = '⇪ 脱出：' + (EXITS[ob.type]?.name || ob.type); col = '#70ff90'; } else if (ob.k === 'ladder') { t = ob.dir > 0 ? '▲ 上の層へ' : '▼ 下の層へ'; col = ob.temp ? '#ff90c0' : '#ffe070'; } else if (ob.k === 'entry') { t = '潜入口'; col = '#a0c8ff'; } else if (ob.k === 'hideout') { t = '隠れ家への抜け道'; col = '#ffb070'; }
        else if (ob.k === 'cont' && dd < 90) { t = ob.looted ? '（漁り済み）' : '◇ 調べる'; col = ob.looted ? '#888' : '#ffd070'; }
        if (t) { o.fillStyle = col; o.strokeText(t, x, y); o.fillText(t, x, y); } } }
    o.font = 'bold 12px sans-serif'; o.fillStyle = '#d0b0ff'; o.strokeStyle = '#000'; o.lineWidth = 3;
    for (const gt of this.zone.gates || []) { const x = (gt.x * 16 + 8 + ox) * S, y = (gt.y * 16 - 10 + oy) * S; const n = '◆ ' + (this.dungeonNames?.[gt.dungeon] || gt.dungeon); o.strokeText(n, x, y); o.fillText(n, x, y); }
    this.texts = this.texts.filter(t => now - t.t0 < (t.skill ? 1100 : 900));
    for (const t of this.texts) {
      const p = (now - t.t0) / (t.skill ? 1100 : 900); const x = (t.x + ox) * S, y = (t.y + oy) * S - p * 30 * (t.skill ? 0.6 : 1);
      o.globalAlpha = Math.min(1, 2 - p * 2);
      if (t.skill) { o.font = `bold ${t.big ? 22 : 13}px sans-serif`; o.fillStyle = t.col || (ec(t.e) === '#e8e8e8' ? '#fff' : ec(t.e)); }
      else { o.font = `bold ${t.c ? 20 : t.dot ? 11 : 14}px sans-serif`; o.fillStyle = t.h ? '#70ff90' : t.a ? '#ff6060' : t.c ? '#ffe040' : t.e && t.e !== 'phys' ? ec(t.e) : '#fff'; }
      o.strokeStyle = '#000'; o.lineWidth = 3; const v = t.skill ? t.v : (t.h ? '+' : '') + t.v + (t.c ? '!' : ''); o.strokeText(v, x, y); o.fillText(v, x, y);
    }
    o.globalAlpha = 1;
  }
  screenToWorld(mx, my) { return { x: mx / this.scale - this.ox, y: my / this.scale - this.oy }; }
}
