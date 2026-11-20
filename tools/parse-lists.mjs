// Parses the reference markdown files into ordered 86 x 100 name lists.
import fs from 'node:fs';
export function parseLists(file) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/).map(l => l.trim());
  const lists = []; let cur = null; let header = null;
  for (const l of lines) {
    const h = l.match(/^\*\*(?:No\.)?\s*0*(\d+)[\.\s]/);
    if (h && !/進捗|累計|次は|次回/.test(l)) { header = +h[1]; continue; }
    const m = l.match(/^(\d+)\.\s+(.+?)\s*$/);
    if (!m) continue;
    const n = +m[1], name = m[2].replace(/\*\*/g, '').trim();
    if (n === 1) { cur = { header, items: [] }; lists.push(cur); header = null; }
    if (cur && n === cur.items.length + 1) cur.items.push(name);
  }
  const full = lists.filter(l => l.items.length === 100);
  // assign type numbers: explicit headers win; missing headers inferred from previous
  const byType = new Map(); let prev = 0;
  for (const l of full) {
    const t = l.header ?? prev + 1; prev = t;
    if (!byType.has(t)) byType.set(t, l.items);
  }
  return byType;
}
import { fileURLToPath } from 'node:url';
if (process.argv[1] === fileURLToPath(import.meta.url) && process.argv[2]) {
  const m = parseLists(process.argv[2]);
  const missing = []; for (let i = 1; i <= 86; i++) if (!m.has(i)) missing.push(i);
  console.log('types', m.size, 'missing', missing.join(','));
  for (const [k, v] of m) if (k > 86) console.log('extra', k);
}
