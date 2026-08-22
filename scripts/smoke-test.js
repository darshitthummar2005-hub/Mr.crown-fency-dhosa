const assert = require('assert');
const { createApp } = require('../backend/app');

const PORT = 3100;
const BASE = 'http://127.0.0.1:' + PORT;

async function main() {
  const app = createApp({ serveStatic: true });
  await new Promise((resolve) => app.listen(PORT, resolve));
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      passed++;
      console.log('PASS - ' + name);
    } catch (err) {
      failed++;
      console.log('FAIL - ' + name + ' :: ' + err.message);
    }
  }

  const get = async (p) => {
    const res = await fetch(BASE + p);
    return { res, body: await res.text() };
  };
  const send = async (method, p, data, token) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = 'Bearer ' + token;
    const res = await fetch(BASE + p, { method, headers, body: data ? JSON.stringify(data) : undefined });
    let json = null;
    try { json = await res.json(); } catch (e) {}
    return { res, json };
  };

  await test('GET / serves index.html', async () => {
    const { res, body } = await get('/');
    assert.strictEqual(res.status, 200);
    assert.ok(body.includes('<title>Mr. Crown Fancy Dosa'), 'missing title');
  });

  await test('static css/js/robots/admin served', async () => {
    assert.strictEqual((await get('/css/style.css')).res.status, 200);
    assert.strictEqual((await get('/js/app.js')).res.status, 200);
    assert.strictEqual((await get('/js/admin.js')).res.status, 200);
    assert.strictEqual((await get('/admin.html')).res.status, 200);
    assert.ok((await get('/robots.txt')).body.includes('Sitemap'));
  });

  await test('GET /api/dosas returns default menu', async () => {
    const { res, json } = await send('GET', '/api/dosas');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(json) && json.length >= 12, 'expected 12+ dosas');
    assert.ok(json.some((d) => d.name === 'Masala Dosa'));
  });

  await test('GET /api/booking-config', async () => {
    const { res, json } = await send('GET', '/api/booking-config');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(json.advanceFee, 99);
    assert.strictEqual(json.tables.length, 16);
    assert.strictEqual(json.timeSlots.length, 6);
  });

  await test('POST /api/login rejects bad password', async () => {
    const { res } = await send('POST', '/api/login', { username: 'admin', password: 'wrong' });
    assert.strictEqual(res.status, 401);
  });

  let token = '';
  await test('POST /api/login issues stateless token', async () => {
    const { res, json } = await send('POST', '/api/login', { username: 'admin', password: 'crown123' });
    assert.strictEqual(res.status, 200);
    token = json.token;
    assert.ok(/^[0-9]+\.[a-f0-9]{64}$/.test(token), 'token format unexpected');
  });

  let newId = '';
  await test('POST /api/dosas adds item (auth)', async () => {
    const { res, json } = await send('POST', '/api/dosas', {
      name: 'Test Dosa', category: 'Test', price: 55, description: 'temp'
    }, token);
    assert.strictEqual(res.status, 201);
    newId = json.id;
  });

  await test('PUT /api/dosas/:id updates item (auth)', async () => {
    const { res, json } = await send('PUT', '/api/dosas/' + newId, { price: 60 }, token);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(json.price, 60);
  });

  await test('DELETE /api/dosas/:id removes item (auth)', async () => {
    const { res } = await send('DELETE', '/api/dosas/' + newId, null, token);
    assert.strictEqual(res.status, 200);
  });

  await test('unauthenticated writes rejected', async () => {
    const { res } = await send('POST', '/api/dosas', { name: 'X', category: 'Y', price: 1 });
    assert.strictEqual(res.status, 401);
  });

  const today = new Date();
  const date = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
  let bookingId = '';

  await test('POST /api/bookings creates booking', async () => {
    const { res, json } = await send('POST', '/api/bookings', {
      name: 'Test Guest', phone: '9876543210', date,
      slot: '7:00 PM - 8:00 PM', guests: 3, tableId: 'B2'
    });
    assert.strictEqual(res.status, 201);
    bookingId = json.id;
    assert.strictEqual(json.advanceFee, 99);
  });

  await test('double booking same table+slot returns 409', async () => {
    const { res } = await send('POST', '/api/bookings', {
      name: 'Other Guest', phone: '9999988888', date,
      slot: '7:00 PM - 8:00 PM', guests: 2, tableId: 'B2'
    });
    assert.strictEqual(res.status, 409);
  });

  await test('GET /api/bookings?date lists bookings', async () => {
    const { res, json } = await send('GET', '/api/bookings?date=' + date);
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(json) && json.length >= 1);
    assert.ok(!json[0].phone && !json[0].name, 'public list must hide personal details');
  });

  await test('PUT /api/bookings/:id confirm (auth)', async () => {
    const { res, json } = await send('PUT', '/api/bookings/' + bookingId, { status: 'confirmed' }, token);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(json.status, 'confirmed');
  });

  await test('DELETE /api/bookings/:id cancel (auth)', async () => {
    const { res } = await send('DELETE', '/api/bookings/' + bookingId, null, token);
    assert.strictEqual(res.status, 200);
    const { json } = await send('GET', '/api/bookings?date=' + date);
    assert.ok(!json.some((b) => b.id === bookingId));
  });

  await test('invalid booking payload returns 400', async () => {
    const { res } = await send('POST', '/api/bookings', { name: 'A', phone: '123', date: 'bad', slot: 'x', guests: 0, tableId: 'ZZ' });
    assert.strictEqual(res.status, 400);
  });

  app.close ? app.close() : null;
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error('Smoke test crashed:', err);
  process.exit(1);
});
