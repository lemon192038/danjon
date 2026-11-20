// WebSocket client with auto-reconnect and handler registry.
export class Net {
  constructor() { this.h = {}; this.ws = null; this.token = null; this.queue = []; }
  on(t, fn) { (this.h[t] ||= []).push(fn); }
  emit(m) { for (const fn of this.h[m.t] || []) fn(m); for (const fn of this.h['*'] || []) fn(m); }
  connect(token) {
    this.token = token; const url = (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws';
    const ws = this.ws = new WebSocket(url);
    ws.onopen = () => { ws.send(JSON.stringify({ t: 'auth', token })); this.emit({ t: 'open' }); };
    ws.onmessage = e => { let m; try { m = JSON.parse(e.data); } catch { return; } this.emit(m); };
    ws.onclose = () => { this.emit({ t: 'closed' }); if (this.token && !this.stop) setTimeout(() => this.connect(this.token), 2000); };
  }
  send(o) { if (this.ws?.readyState === 1) this.ws.send(JSON.stringify(o)); }
  menu(op, o = {}) { this.send({ t: 'menu', op, ...o }); }
}
export async function api(path, body) { const r = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }); return r.json(); }
