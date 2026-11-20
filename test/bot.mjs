// Headless gameplay bot: exercises auth, char creation, movement, combat, skills, dungeon entry, NPC & party menus.
import WebSocket from 'ws';
export async function runBot(base, { wt = 1, name = 'bot' + Math.floor(Math.random() * 1e5), seconds = 12, dungeon = 'd01', diff = 'NORMAL' } = {}) {
  const post = (p, b) => fetch(base + p, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) }).then(r => r.json());
  const user = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 14) || 'botx';
  const r = await post('/api/register', { user, pass: 'pass1234' });
  if (!r.token) throw new Error('register failed ' + JSON.stringify(r));
  const ws = new WebSocket(base.replace('http', 'ws') + '/ws');
  const st = { snaps: 0, dmg: 0, kills: 0, notes: [], errors: [], zone: null, me: null, self: null, ents: new Map(), skillsOk: 0 };
  const send = o => ws.send(JSON.stringify(o));
  await new Promise(res => ws.on('open', res));
  ws.on('message', raw => {
    const m = JSON.parse(raw);
    if (m.t === 'authok') send({ t: 'create', name, wt, look: { body: 1, hair: 2 } });
    else if (m.t === 'chars' && m.list.length) send({ t: 'play', id: m.list[0].id });
    else if (m.t === 'zone') st.zone = m;
    else if (m.t === 'self') st.self = m;
    else if (m.t === 's') { st.snaps++; st.me = m.me; for (const f of m.full) st.ents.set(f.id, f); st.list = m.ents; for (const f of m.fx) { if (f.t === 'dmg' && !f.a && !f.h) st.dmg += f.v; if (f.t === 'die') st.kills++; } }
    else if (m.t === 'note') st.notes.push(m);
    else if (m.t === 'err') st.errors.push(m.v);
  });
  send({ t: 'auth', token: r.token });
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await wait(800);
  if (!st.zone) throw new Error('no zone');
  // walk east to the field
  const t0 = Date.now();
  while (st.zone.id === 'haven' && Date.now() - t0 < 15000) { send({ t: 'in', mx: 1, my: (st.me && st.me.y > st.zone.h * 8 + 6) ? -0.5 : (st.me && st.me.y < st.zone.h * 8 - 6 ? 0.5 : 0) }); await wait(50); }
  // enter dungeon via menu op
  send({ t: 'menu', op: 'dungeon', id: dungeon, diff, floor: 1 }); await wait(600);
  const end = Date.now() + seconds * 1000; let k = 0;
  while (Date.now() < end) {
    k++;
    const me = st.me; let tgt = null, bd = 1e9;
    for (const e of st.list || []) { const d = st.ents.get(e[0]); if (!d || d.team !== 'enemy' || (e[5] & 1)) continue; const dd = Math.hypot(e[1] - me.x, e[2] - me.y); if (dd < bd) { bd = dd; tgt = e; } }
    if (me.dead) send({ t: 'respawn' });
    if (tgt) { const dx = tgt[1] - me.x, dy = tgt[2] - me.y; const far = bd > 30; send({ t: 'in', mx: far ? dx / bd : 0, my: far ? dy / bd : 0, ax: tgt[1], ay: tgt[2], atk: bd < 60, spc: k % 40 < 3 }); if (k % 25 === 0) send({ t: 'skill', i: k % 4, tx: tgt[1], ty: tgt[2] }); if (k % 60 === 0) send({ t: 'dodge', dx: 1, dy: 0 }); }
    else send({ t: 'in', mx: Math.cos(k / 30), my: Math.sin(k / 47), atk: false });
    await wait(50);
  }
  ws.close();
  return st;
}
if (process.argv[2]) { const st = await runBot(process.argv[2], { wt: +(process.argv[3] || 1), seconds: +(process.argv[4] || 12) }); console.log({ zone: st.zone?.name, snaps: st.snaps, dmg: st.dmg, kills: st.kills, notes: st.notes.slice(0, 8), errors: st.errors, hp: st.me?.hp, lv: st.self?.ch.level }); process.exit(0); }
