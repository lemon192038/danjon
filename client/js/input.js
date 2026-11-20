// Keyboard/mouse + touch (virtual joystick & buttons). Produces an abstract input state.
export class Input {
  constructor(canvas) {
    this.keys = new Set(); this.mouse = { x: 0, y: 0, l: false, r: false, in: false }; this.pressed = []; this.touch = { active: false, mx: 0, my: 0, atk: false, spc: false };
    this.enabled = true; this.isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    addEventListener('keydown', e => { if (!this.enabled || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return; const k = e.key.toLowerCase(); if (!this.keys.has(k)) this.pressed.push(k); this.keys.add(k); if ([' ', 'tab'].includes(k)) e.preventDefault(); });
    addEventListener('keyup', e => this.keys.delete(e.key.toLowerCase()));
    addEventListener('blur', () => { this.keys.clear(); this.mouse.l = this.mouse.r = false; });
    canvas.addEventListener('mousemove', e => { const r = canvas.getBoundingClientRect(); this.mouse.x = e.clientX - r.left; this.mouse.y = e.clientY - r.top; this.mouse.in = true; });
    canvas.addEventListener('mousedown', e => { if (e.button === 0) this.mouse.l = true; if (e.button === 2) this.mouse.r = true; });
    addEventListener('mouseup', e => { if (e.button === 0) this.mouse.l = false; if (e.button === 2) this.mouse.r = false; });
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    if (this.isTouch) this.buildTouch();
  }
  take() { const p = this.pressed; this.pressed = []; return p; }
  move() {
    let x = 0, y = 0; const k = this.keys;
    if (k.has('w') || k.has('arrowup')) y -= 1; if (k.has('s') || k.has('arrowdown')) y += 1; if (k.has('a') || k.has('arrowleft')) x -= 1; if (k.has('d') || k.has('arrowright')) x += 1;
    if (this.touch.active) { x = this.touch.mx; y = this.touch.my; }
    return { x, y };
  }
  buildTouch() {
    const root = document.createElement('div'); root.id = 'touch'; root.innerHTML = `<div id="joy"><div id="knob"></div></div>
      <div id="tbtns"><button data-t="atk" class="big">攻撃</button><button data-t="spc">特殊</button><button data-t="dodge">回避</button>
      <button data-t="s0">1</button><button data-t="s1">2</button><button data-t="s2">3</button><button data-t="s3">4</button><button data-t="f">調べる</button><button data-t="q">回復</button></div>`;
    document.body.appendChild(root); this.touchRoot = root;
    const joy = root.querySelector('#joy'), knob = root.querySelector('#knob'); let jid = null, cx = 0, cy = 0;
    joy.addEventListener('touchstart', e => { const t = e.changedTouches[0]; jid = t.identifier; const r = joy.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; this.touch.active = true; e.preventDefault(); }, { passive: false });
    addEventListener('touchmove', e => { for (const t of e.changedTouches) if (t.identifier === jid) { let dx = t.clientX - cx, dy = t.clientY - cy; const d = Math.hypot(dx, dy), m = 50; if (d > m) { dx = dx / d * m; dy = dy / d * m; } knob.style.transform = `translate(${dx}px,${dy}px)`; this.touch.mx = dx / m; this.touch.my = dy / m; } }, { passive: true });
    addEventListener('touchend', e => { for (const t of e.changedTouches) if (t.identifier === jid) { jid = null; knob.style.transform = ''; this.touch.mx = this.touch.my = 0; this.touch.active = false; } });
    for (const b of root.querySelectorAll('#tbtns button')) {
      const t = b.dataset.t;
      b.addEventListener('touchstart', e => { e.preventDefault(); if (t === 'atk') this.touch.atk = true; else if (t === 'spc') this.touch.spc = true; else this.pressed.push({ dodge: ' ', s0: '1', s1: '2', s2: '3', s3: '4', f: 'f', q: 'q' }[t]); }, { passive: false });
      b.addEventListener('touchend', e => { e.preventDefault(); if (t === 'atk') this.touch.atk = false; if (t === 'spc') this.touch.spc = false; }, { passive: false });
    }
  }
  showTouch(v) { if (this.touchRoot) this.touchRoot.style.display = v ? '' : 'none'; }
}
