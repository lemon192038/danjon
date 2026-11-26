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
    // Floating joystick: touching anywhere on the left half spawns the stick under the finger.
    const root = document.createElement('div'); root.id = 'touch';
    root.innerHTML = `<div id="joyzone"><div id="joy"><div id="knob"></div></div><span class="joyhint">左側どこでも移動</span></div>
      <div id="tleft"><button data-t="f" class="tsm"><b>💬</b><small>会話</small></button></div>
      <div id="tright"><button data-t="dodge" class="tsk dodge"><b>≋</b><small>回避</small></button>
        <button data-t="spc" class="tsk tspcb"><b>◆</b><small id="tspc">特殊</small></button><button data-t="q" class="tsk tpotb"><b>⚗</b><small id="tpot">回復</small></button>
        ${[0, 1, 2, 3].map(i => `<button data-t="s${i}" class="tsk s${i}"><small class="tsn" id="tsn${i}">${i + 1}</small><i class="tcd" id="tcd${i}"></i></button>`).join('')}
        <button data-t="hv" class="tsk thv"><b>⚡</b><small>強攻撃</small></button><button data-t="atk" class="tatk">攻撃</button></div>`;
    document.body.appendChild(root); this.touchRoot = root;
    const zone = root.querySelector('#joyzone'), joy = root.querySelector('#joy'), knob = root.querySelector('#knob'); let jid = null, cx = 0, cy = 0; const R = 56;
    zone.addEventListener('touchstart', e => { if (jid !== null) return; const t = e.changedTouches[0]; jid = t.identifier; cx = t.clientX; cy = t.clientY; joy.style.left = cx - 65 + 'px'; joy.style.top = cy - 65 + 'px'; joy.classList.add('on'); this.touch.active = true; this.touch.mx = this.touch.my = 0; e.preventDefault(); }, { passive: false });
    const move = e => { for (const t of e.changedTouches) if (t.identifier === jid) { let dx = t.clientX - cx, dy = t.clientY - cy; const d = Math.hypot(dx, dy); if (d > R) { // stick follows the finger so the reactive range never runs out
          cx += dx / d * (d - R); cy += dy / d * (d - R); joy.style.left = cx - 65 + 'px'; joy.style.top = cy - 65 + 'px'; dx = dx / d * R; dy = dy / d * R; }
        knob.style.transform = `translate(${dx}px,${dy}px)`; const m = Math.hypot(dx, dy) / R; const dead = m < 0.12; this.touch.mx = dead ? 0 : dx / R; this.touch.my = dead ? 0 : dy / R; if (!dead) this.touch.dir = Math.atan2(dy, dx); } };
    const end = e => { for (const t of e.changedTouches) if (t.identifier === jid) { jid = null; knob.style.transform = ''; joy.classList.remove('on'); this.touch.mx = this.touch.my = 0; this.touch.active = false; } };
    zone.addEventListener('touchmove', move, { passive: true }); zone.addEventListener('touchend', end); zone.addEventListener('touchcancel', end);
    for (const b of root.querySelectorAll('button')) {
      const t = b.dataset.t;
      b.addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); b.classList.add('down'); if (t === 'atk') this.touch.atk = true; else if (t === 'spc') this.touch.spc = true; else this.pressed.push({ dodge: ' ', s0: '1', s1: '2', s2: '3', s3: '4', f: 'f', q: 'q', hv: 'r' }[t]); }, { passive: false });
      const up = e => { e.preventDefault(); b.classList.remove('down'); if (t === 'atk') this.touch.atk = false; if (t === 'spc') this.touch.spc = false; };
      b.addEventListener('touchend', up, { passive: false }); b.addEventListener('touchcancel', up, { passive: false });
    }
  }
  setTouchSkills(list) { if (!this.touchRoot) return; list.forEach((sk, i) => { const el = this.touchRoot.querySelector('#tsn' + i); if (el) { el.textContent = sk ? sk.name : '―'; el.style.color = sk?.color || ''; } }); }
  setTouchInfo({ cds, pot, spc }) { if (!this.touchRoot) return; for (let i = 0; i < 4; i++) { const el = this.touchRoot.querySelector('#tcd' + i); if (el) { el.style.height = (cds[i] || 0) * 100 + '%'; } } if (pot != null) this.touchRoot.querySelector('#tpot').textContent = pot; if (spc) this.touchRoot.querySelector('#tspc').textContent = spc; }
  showTouch(v) { if (v && !this.touchRoot) this.buildTouch(); if (this.touchRoot) this.touchRoot.style.display = v ? '' : 'none'; this.touchOn = !!v && !!this.touchRoot; document.body.classList.toggle('touchui', this.touchOn); }
}
