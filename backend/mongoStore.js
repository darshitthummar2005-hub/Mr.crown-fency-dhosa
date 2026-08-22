const { MongoClient } = require('mongodb');
const { DEFAULT_DOSAS } = require('./defaultData');

const MONGODB_URI = process.env.MONGODB_URI || '';
const DB_NAME = process.env.MONGODB_DB || 'mrcrown';
const USE_MONGO = Boolean(MONGODB_URI);

const KEYS = {
  dosas: 'crown:dosas',
  bookings: 'crown:bookings'
};
const DEFAULTS = {
  dosas: DEFAULT_DOSAS,
  bookings: []
};

let clientPromise = null;

function getClient() {
  if (!clientPromise) {
    const client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
      maxIdleTimeMS: 15000,
      appName: 'mr-crown-site'
    });
    clientPromise = client.connect().then(() => client);
  }
  return clientPromise;
}

function collection() {
  return getClient().then((client) => client.db(DB_NAME).collection('store'));
}

async function readData(kind) {
  const col = await collection();
  const doc = await col.findOne({ _id: KEYS[kind] });
  if (!doc || !Array.isArray(doc.items)) {
    const seed = DEFAULTS[kind];
    await col.updateOne(
      { _id: KEYS[kind] },
      { $setOnInsert: { items: seed } },
      { upsert: true }
    );
    return seed;
  }
  return doc.items;
}

async function writeData(kind, data) {
  const col = await collection();
  await col.updateOne(
    { _id: KEYS[kind] },
    { $set: { items: data, updatedAt: new Date().toISOString() } },
    { upsert: true }
  );
}

module.exports = { USE_MONGO, readData, writeData };
