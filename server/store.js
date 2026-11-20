// Server-side persistence. Backends: Supabase (PostgREST, service-role key; used when SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY are set) or local JSON files. The game uses a synchronous in-memory cache;
// writes are flushed to the backend asynchronously (write-behind with retry).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const SB_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const useSupabase = !!(SB_URL && SB_KEY);
const DIR = process.env.DATA_DIR || path.resolve('saves');
const safe = s => String(s).toLowerCase().replace(/[^a-z0-9_\-]/g, '');
const hashPw = (pw, salt) => crypto.scryptSync(pw, salt, 32).toString('hex');
const tokens = new Map();
const cache = { accounts: new Map(), chars: new Map(), world: null };

// ---------- backends
const fileBackend = {
  async load() {
    for (const d of ['accounts', 'chars']) fs.mkdirSync(path.join(DIR, d), { recursive: true });
    const read = f => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; } };
    for (const f of fs.readdirSync(path.join(DIR, 'accounts'))) { const a = read(path.join(DIR, 'accounts', f)); if (a) cache.accounts.set(a.id, a); }
    for (const f of fs.readdirSync(path.join(DIR, 'chars'))) { const c = read(path.join(DIR, 'chars', f)); if (c) cache.chars.set(c.id, c); }
    cache.world = read(path.join(DIR, 'world.json'));
  },
  async write(table, id, data) {
    const f = table === 'aef_world' ? path.join(DIR, 'world.json') : path.join(DIR, table === 'aef_accounts' ? 'accounts' : 'chars', safe(id) + '.json');
    const tmp = f + '.' + process.pid + '.tmp'; await fs.promises.writeFile(tmp, JSON.stringify(data)); await fs.promises.rename(tmp, f);
  },
};
const sbHeaders = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' };
async function sbSelectAll(table) {
  const out = []; const page = 1000;
  for (let from = 0; ; from += page) {
    const r = await fetch(`${SB_URL}/rest/v1/${table}?select=id,data&order=id`, { headers: { ...sbHeaders, Range: `${from}-${from + page - 1}` } });
    if (!r.ok) throw new Error(`Supabase load ${table}: ${r.status} ${await r.text()}`);
    const rows = await r.json(); out.push(...rows); if (rows.length < page) return out;
  }
}
const supabaseBackend = {
  async load() {
    for (const r of await sbSelectAll('aef_accounts')) cache.accounts.set(r.id, r.data);
    for (const r of await sbSelectAll('aef_chars')) cache.chars.set(r.id, r.data);
    cache.world = (await sbSelectAll('aef_world')).find(r => r.id === 'main')?.data || null;
  },
  async write(table, id, data) {
    const row = { id, data, updated_at: new Date().toISOString() };
    if (table === 'aef_chars') { row.account = data.account || ''; row.name = data.name; }
    const r = await fetch(`${SB_URL}/rest/v1/${table}?on_conflict=id`, { method: 'POST', headers: { ...sbHeaders, Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(row) });
    if (!r.ok) throw new Error(`Supabase write ${table}/${id}: ${r.status} ${await r.text()}`);
  },
};
const backend = useSupabase ? supabaseBackend : fileBackend;

// ---------- write-behind queue (coalesces repeated saves of the same record)
const pending = new Map(); let flushing = false;
function queue(table, id, data) { pending.set(table + ':' + id, { table, id, json: JSON.stringify(data) }); }
async function flush() {
  if (flushing || !pending.size) return; flushing = true;
  const items = [...pending.values()]; pending.clear();
  for (const it of items) {
    try { await backend.write(it.table, it.id, JSON.parse(it.json)); }
    catch (e) { console.error('[store]', e.message); if (!pending.has(it.table + ':' + it.id)) pending.set(it.table + ':' + it.id, it); }
  }
  flushing = false;
}
setInterval(flush, 2000).unref();

export const store = {
  backend: useSupabase ? 'supabase' : 'file',
  async init() { await backend.load(); console.log(`[store] ${this.backend}: ${cache.accounts.size} accounts, ${cache.chars.size} characters`); },
  flush,
  register(user, pw) {
    const id = safe(user);
    if (id.length < 3 || id.length > 16) return { error: 'ユーザー名は英数字3〜16文字です' };
    if (!pw || pw.length < 4) return { error: 'パスワードは4文字以上です' };
    if (cache.accounts.has(id)) return { error: 'そのユーザー名は使用されています' };
    const salt = crypto.randomBytes(12).toString('hex');
    this.saveAccount({ id, salt, hash: hashPw(pw, salt), chars: [], created: Date.now() });
    return this.login(user, pw);
  },
  login(user, pw) {
    const acc = cache.accounts.get(safe(user));
    if (!acc || hashPw(pw || '', acc.salt) !== acc.hash) return { error: 'ユーザー名またはパスワードが違います' };
    const token = crypto.randomBytes(24).toString('hex'); tokens.set(token, acc.id);
    return { token, account: acc.id };
  },
  auth(token) { return tokens.get(token) || null; },
  account(id) { return cache.accounts.get(safe(id)) || null; },
  saveAccount(acc) { cache.accounts.set(acc.id, acc); queue('aef_accounts', acc.id, acc); },
  listChars(accId) { const a = this.account(accId); return (a?.chars || []).map(cid => cache.chars.get(cid)).filter(Boolean).map(c => ({ id: c.id, name: c.name, level: c.level, job: c.job, look: c.look })); },
  loadChar(cid) { const c = cache.chars.get(cid); return c ? structuredClone(c) : null; },
  saveChar(ch) {
    if (!ch.account) for (const a of cache.accounts.values()) if (a.chars.includes(ch.id)) ch.account = a.id;
    cache.chars.set(ch.id, structuredClone(ch)); queue('aef_chars', ch.id, ch);
  },
  nameTaken(name) { for (const c of cache.chars.values()) if (c.name === name) return true; return false; },
  worldState() { return cache.world; },
  saveWorldState(o) { cache.world = o; queue('aef_world', 'main', o); },
};
