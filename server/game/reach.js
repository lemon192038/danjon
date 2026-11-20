const cache = new Map();
export function reachOfType(wt) {
  if (cache.has(wt.id)) return cache.get(wt.id);
  let reach = 0, ranged = false;
  for (const s of wt.combo) { if (s.s === 'proj') { ranged = true; reach = Math.max(reach, s.rng); } else if (s.s === 'beam') { ranged = true; reach = Math.max(reach, s.l); } else reach = Math.max(reach, s.r || 0, s.l || 0, (s.d || 0) + (s.r || 0)); }
  const o = { reach: Math.max(24, reach), ranged }; cache.set(wt.id, o); return o;
}
