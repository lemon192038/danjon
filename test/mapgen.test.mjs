// Regression: dungeon stairs/exit/monsters/chests are always reachable on foot from the arrival point;
// field monsters & gathering nodes are never wedged between trees (open ground, reachable from the center).
import test from 'node:test';
import assert from 'node:assert';
const { genDungeonFloor, genOverworld, walkDist, WORLD, T, BLOCKING } = await import('../server/game/maps.js');
const { DATA } = await import('../server/data.js');

test('every dungeon floor: stairs, exit, spawns and chests reachable from the start', () => {
  const bad = []; let n = 0;
  for (const d of DATA.dungeonList) for (const diff of ['NORMAL', 'HARD']) for (let f = 1; f <= 100; f++) {
    const m = genDungeonFloor(d, f, diff); n++; const dist = walkDist(m.grid, m.start); const ok = c => c && dist[c[1] * m.w + c[0]] >= 0;
    if (!ok(m.stairs)) bad.push(`${d.id} ${diff} ${f}F stairs`); if (m.exit && !ok(m.exit)) bad.push(`${d.id} ${diff} ${f}F exit`);
    for (const s of m.spawns) if (!ok(s)) { bad.push(`${d.id} ${diff} ${f}F spawn`); break; } for (const c of m.chests) if (!ok(c)) { bad.push(`${d.id} ${diff} ${f}F chest`); break; }
    if (m.boss && !ok([m.bossAt[0], m.bossAt[1]])) bad.push(`${d.id} ${diff} ${f}F boss`);
  }
  assert.deepEqual(bad.slice(0, 10), [], `${bad.length}/${n} floors broken`);
});

test('field monsters spawn on open, reachable ground', () => {
  const bad = [];
  for (const [id, def] of Object.entries(WORLD)) { if (def.kind !== 'field') continue; const m = genOverworld(id); const dist = walkDist(m.grid, m.start);
    for (const [x, y] of m.spawns) { let open = true; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (BLOCKING.has(m.grid.get(x + i, y + j))) open = false; if (!open || dist[y * m.w + x] < 0) { bad.push(`${id} ${x},${y}`); break; } } }
  assert.deepEqual(bad, []); void T;
});
