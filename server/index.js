// ABYSS : ETERNAL FRONTIER — server entry: static client + REST auth + WebSocket game protocol.
import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { store } from './store.js';
import { World } from './game/world.js';
import { DATA } from './data.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const app = express();
app.use(express.json({ limit: '16kb' }));
app.use('/shared', express.static(path.join(ROOT, 'shared'), { maxAge: '1h' }));
app.use(express.static(path.join(ROOT, 'client')));
app.get('/healthz', (_, res) => res.json({ ok: true }));
const lim = new Map();
const limited = ip => { const n = Date.now(); const e = lim.get(ip) || { n: 0, t: n }; if (n - e.t > 60000) { e.n = 0; e.t = n; } e.n++; lim.set(ip, e); return e.n > 30; };
app.post('/api/register', (req, res) => { if (limited(req.ip)) return res.status(429).json({ error: 'しばらく待ってから再試行してください' }); res.json(store.register(req.body?.user, req.body?.pass)); });
app.post('/api/login', (req, res) => { if (limited(req.ip)) return res.status(429).json({ error: 'しばらく待ってから再試行してください' }); res.json(store.login(req.body?.user, req.body?.pass)); });
app.get('/api/stats', (_, res) => res.json({ weapons: DATA.weapons.size, skills: DATA.skills.size, jobs: DATA.jobs.size, dungeons: DATA.dungeons.size, online: world.sessions.size, npcs: world.npcs.list.length }));

const server = http.createServer(app);
const world = new World();
const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 8192 });
wss.on('connection', ws => {
  let s = null; let count = 0, windowStart = Date.now();
  ws.on('message', raw => {
    const now = Date.now(); if (now - windowStart > 1000) { count = 0; windowStart = now; } if (++count > 80) return; // flood guard
    let m; try { m = JSON.parse(raw); } catch { return; }
    if (!s) { if (m.t === 'auth') { const acc = store.auth(m.token); if (!acc) return ws.send(JSON.stringify({ t: 'authfail' })); s = world.attach(ws, acc); ws.send(JSON.stringify({ t: 'authok', account: acc })); } return; }
    try { world.handle(s, m); } catch (e) { console.error('handle', m.t, e); }
  });
  ws.on('close', () => { if (s) world.detach(s); });
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`ABYSS : ETERNAL FRONTIER server on :${PORT}`));
process.on('SIGTERM', () => { world.saveAll(); process.exit(0); });
