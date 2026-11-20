// Server-side persistence: accounts & characters as JSON files (atomic writes). Swap for DB via same interface.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const DIR = process.env.DATA_DIR || path.resolve('saves');
fs.mkdirSync(path.join(DIR, 'accounts'), { recursive: true });
fs.mkdirSync(path.join(DIR, 'chars'), { recursive: true });
const safe = s => String(s).toLowerCase().replace(/[^a-z0-9_\-]/g, '');
function readJSON(f) { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; } }
function writeJSON(f, o) { const tmp = f + '.' + process.pid + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(o)); fs.renameSync(tmp, f); }
const hashPw = (pw, salt) => crypto.scryptSync(pw, salt, 32).toString('hex');
const tokens = new Map(); // token -> account id

export const store = {
  register(user, pw) {
    const id = safe(user);
    if (id.length < 3 || id.length > 16) return { error: 'ユーザー名は英数字3〜16文字です' };
    if (!pw || pw.length < 4) return { error: 'パスワードは4文字以上です' };
    const f = path.join(DIR, 'accounts', id + '.json');
    if (fs.existsSync(f)) return { error: 'そのユーザー名は使用されています' };
    const salt = crypto.randomBytes(12).toString('hex');
    writeJSON(f, { id, salt, hash: hashPw(pw, salt), chars: [], created: Date.now() });
    return this.login(user, pw);
  },
  login(user, pw) {
    const id = safe(user); const acc = readJSON(path.join(DIR, 'accounts', id + '.json'));
    if (!acc || hashPw(pw || '', acc.salt) !== acc.hash) return { error: 'ユーザー名またはパスワードが違います' };
    const token = crypto.randomBytes(24).toString('hex'); tokens.set(token, id);
    return { token, account: id };
  },
  auth(token) { return tokens.get(token) || null; },
  account(id) { return readJSON(path.join(DIR, 'accounts', safe(id) + '.json')); },
  saveAccount(acc) { writeJSON(path.join(DIR, 'accounts', acc.id + '.json'), acc); },
  listChars(accId) { const a = this.account(accId); return (a?.chars || []).map(cid => this.loadChar(cid)).filter(Boolean).map(c => ({ id: c.id, name: c.name, level: c.level, job: c.job, look: c.look })); },
  loadChar(cid) { return readJSON(path.join(DIR, 'chars', safe(cid) + '.json')); },
  saveChar(ch) { writeJSON(path.join(DIR, 'chars', safe(ch.id) + '.json'), ch); },
  nameTaken(name) { return fs.readdirSync(path.join(DIR, 'chars')).some(f => { const c = readJSON(path.join(DIR, 'chars', f)); return c && c.name === name; }); },
  worldState() { return readJSON(path.join(DIR, 'world.json')); },
  saveWorldState(o) { writeJSON(path.join(DIR, 'world.json'), o); },
};
