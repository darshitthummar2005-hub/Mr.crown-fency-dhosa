const crypto = require('crypto');

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'crown123';
const TOKEN_SECRET = crypto
  .createHash('sha256')
  .update('mr-crown-v1::' + ADMIN_PASSWORD + '::' + (process.env.AUTH_SECRET || ''))
  .digest();
const TOKEN_TTL = 1000 * 60 * 60 * 24 * 7;

function sign(value) {
  return crypto.createHmac('sha256', TOKEN_SECRET).update(String(value)).digest('hex');
}

function issueToken() {
  const exp = Date.now() + TOKEN_TTL;
  return exp + '.' + sign(exp);
}

function verifyToken(token) {
  if (typeof token !== 'string') return false;
  const dot = token.indexOf('.');
  if (dot < 1) return false;
  const exp = Number(token.slice(0, dot));
  const sig = token.slice(dot + 1);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const expected = sign(exp);
  if (sig.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch (err) {
    return false;
  }
}

function isAuthed(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  return verifyToken(token);
}

module.exports = { ADMIN_USERNAME, ADMIN_PASSWORD, issueToken, isAuthed };
