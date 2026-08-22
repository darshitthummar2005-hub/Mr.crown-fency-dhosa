const fs = require('fs');
const path = require('path');
const { DEFAULT_DOSAS } = require('./defaultData');
const mongo = require('./mongoStore');

const REST_URL = (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '').replace(/\/$/, '');
const REST_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
const USE_REDIS = Boolean(REST_URL && REST_TOKEN);

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const FILES = {
  dosas: 'dosas.json',
  bookings: 'bookings.json'
};
const DEFAULTS = {
  dosas: DEFAULT_DOSAS,
  bookings: []
};

const memCache = {};

function localRead(kind) {
  const file = FILES[kind];
  const filePath = path.join(DATA_DIR, file);
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(DEFAULTS[kind], null, 2));
    return DEFAULTS[kind];
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    console.error('Local read failed for', file, err.message);
    return DEFAULTS[kind];
  }
}

function localWrite(kind, data) {
  const filePath = path.join(DATA_DIR, FILES[kind]);
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

async function redisCmd(body) {
  const res = await fetch(REST_URL, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + REST_TOKEN,
      'Content-Type': 'text/plain'
    },
    body
  });
  if (!res.ok) throw new Error('Redis request failed (' + res.status + ')');
  return res.text();
}

async function redisGetB64(key) {
  const text = await redisCmd('GET ' + key);
  if (!text) return null;
  const lines = text.split(/\r?\n/);
  if (lines[0] === '$-1' || lines[0] === '-1') return null;
  if (lines[0].startsWith('-')) throw new Error('Redis error: ' + text.trim());
  return lines[1] || '';
}

async function redisSetB64(key, b64) {
  const text = await redisCmd('SET ' + key + ' ' + b64);
  if (text.startsWith('-')) throw new Error('Redis error: ' + text.trim());
}

async function readData(kind) {
  if (mongo.USE_MONGO) return mongo.readData(kind);
  if (USE_REDIS) {
    try {
      const cached = memCache['r:' + kind];
      if (cached && Date.now() - cached.at < 4000) return cached.data;
      const b64 = await redisGetB64('crown:' + kind);
      let data;
      if (b64 === null || b64 === '') {
        data = DEFAULTS[kind];
        await redisSetB64('crown:' + kind, Buffer.from(JSON.stringify(data)).toString('base64'));
      } else {
        data = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
      }
      memCache['r:' + kind] = { at: Date.now(), data };
      return data;
    } catch (err) {
      console.error('Redis read failed, using fallback:', err.message);
      return localRead(kind);
    }
  }
  return localRead(kind);
}

async function writeData(kind, data) {
  if (mongo.USE_MONGO) return mongo.writeData(kind, data);
  if (USE_REDIS) {
    await redisSetB64('crown:' + kind, Buffer.from(JSON.stringify(data)).toString('base64'));
    memCache['r:' + kind] = { at: Date.now(), data };
    return;
  }
  localWrite(kind, data);
}

module.exports = { readData, writeData, USE_REDIS };