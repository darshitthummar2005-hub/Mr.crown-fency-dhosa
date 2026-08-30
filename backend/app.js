const express = require('express');
const crypto = require('crypto');
const path = require('path');
const { readData, writeData } = require('./store');
const { ADMIN_USERNAME, ADMIN_PASSWORD, issueToken, isAuthed } = require('./auth');

const ADVANCE_FEE = 99;
const TABLES = ['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3', 'C4', 'D1', 'D2', 'D3', 'D4'];
const TIME_SLOTS = [
  '6:00 PM - 7:00 PM',
  '7:00 PM - 8:00 PM',
  '8:00 PM - 9:00 PM',
  '9:00 PM - 10:00 PM',
  '10:00 PM - 11:00 PM',
  '11:00 PM - 12:00 AM'
];

function normalizeDosa(body) {
  const name = body && typeof body.name === 'string' ? body.name.trim() : '';
  const category = body && typeof body.category === 'string' ? body.category.trim() : '';
  const price = Number(body && body.price);
  if (!name || !category || !Number.isFinite(price) || price < 0) return null;
  const validBadges = ['Bestseller', 'Spicy', 'New'];
  const badge = body && typeof body.badge === 'string' && validBadges.includes(body.badge) ? body.badge : '';
  return {
    name,
    category,
    description: body && typeof body.description === 'string' ? body.description.trim() : '',
    price: Math.round(price * 100) / 100,
    imageUrl: body && typeof body.imageUrl === 'string' ? body.imageUrl.trim() : '',
    badge,
    available: body && typeof body.available === 'boolean' ? body.available : true
  };
}

function dateStr(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function createApiRouter() {
  const router = express.Router();

  router.get('/dosas', async (req, res) => {
    try {
      res.json(await readData('dosas'));
    } catch (err) {
      res.status(500).json({ error: 'Could not load menu.' });
    }
  });

  router.post('/login', (req, res) => {
    const username = req.body && req.body.username;
    const password = req.body && req.body.password;
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      return res.json({ token: issueToken() });
    }
    return res.status(401).json({ error: 'Incorrect password.' });
  });

  router.post('/dosas', async (req, res) => {
    if (!isAuthed(req)) return res.status(401).json({ error: 'Unauthorized.' });
    const dosa = normalizeDosa(req.body);
    if (!dosa) return res.status(400).json({ error: 'Invalid item data.' });
    try {
      const dosas = await readData('dosas');
      dosa.id = crypto.randomBytes(4).toString('hex');
      dosas.push(dosa);
      await writeData('dosas', dosas);
      res.status(201).json(dosa);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not save item. Please try again.' });
    }
  });

  router.put('/dosas/:id', async (req, res) => {
    if (!isAuthed(req)) return res.status(401).json({ error: 'Unauthorized.' });
    try {
      const dosas = await readData('dosas');
      const index = dosas.findIndex((d) => d.id === req.params.id);
      if (index === -1) return res.status(404).json({ error: 'Item not found.' });
      const dosa = normalizeDosa({ ...dosas[index], ...req.body });
      if (!dosa) return res.status(400).json({ error: 'Invalid item data.' });
      dosa.id = dosas[index].id;
      dosas[index] = dosa;
      await writeData('dosas', dosas);
      res.json(dosa);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not update item. Please try again.' });
    }
  });

  router.delete('/dosas/:id', async (req, res) => {
    if (!isAuthed(req)) return res.status(401).json({ error: 'Unauthorized.' });
    try {
      let dosas = await readData('dosas');
      const before = dosas.length;
      dosas = dosas.filter((d) => d.id !== req.params.id);
      if (dosas.length === before) return res.status(404).json({ error: 'Item not found.' });
      await writeData('dosas', dosas);
      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not delete item. Please try again.' });
    }
  });

  router.get('/booking-config', (req, res) => {
    res.json({ tables: TABLES, timeSlots: TIME_SLOTS, advanceFee: ADVANCE_FEE });
  });

  router.get('/bookings', async (req, res) => {
    try {
      let bookings = await readData('bookings');
      const date = req.query.date;
      if (date) bookings = bookings.filter((b) => b.date === date);
      res.json(bookings.map((b) => ({
        id: b.id,
        tableId: b.tableId,
        date: b.date,
        slot: b.slot,
        guests: b.guests,
        status: b.status
      })));
    } catch (err) {
      res.status(500).json({ error: 'Could not load bookings.' });
    }
  });

  router.post('/bookings', async (req, res) => {
    const body = req.body || {};
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const phone = typeof body.phone === 'string' ? body.phone.replace(/\D/g, '') : '';
    const tableId = typeof body.tableId === 'string' ? body.tableId.toUpperCase() : '';
    const slot = typeof body.slot === 'string' ? body.slot.trim() : '';
    const date = typeof body.date === 'string' ? body.date.trim() : '';
    const guests = Number(body.guests);

    if (!name || name.length < 2) return res.status(400).json({ error: 'Please enter your full name.' });
    if (phone.length < 10) return res.status(400).json({ error: 'Please enter a valid 10-digit phone number.' });
    if (!TABLES.includes(tableId)) return res.status(400).json({ error: 'Please select a valid table.' });
    if (!TIME_SLOTS.includes(slot)) return res.status(400).json({ error: 'Please select a valid time slot.' });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: 'Please select a valid date.' });

    const today = new Date();
    const todayStr = dateStr(today);
    const maxDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const maxDateStr = dateStr(maxDate);
    if (date < todayStr) return res.status(400).json({ error: 'Booking date cannot be in the past.' });
    if (date > maxDateStr) return res.status(400).json({ error: 'Bookings are open only 30 days in advance.' });

    if (!Number.isFinite(guests) || guests < 1 || guests > 12) {
      return res.status(400).json({ error: 'Guests must be between 1 and 12.' });
    }

    try {
      const bookings = await readData('bookings');
      const conflict = bookings.find((b) =>
        b.date === date && b.slot === slot && b.tableId === tableId &&
        (b.status === 'confirmed' || b.status === 'pending')
      );
      if (conflict) {
        return res.status(409).json({ error: 'Table ' + tableId + ' is already booked for ' + slot + '. Please choose another table or slot.' });
      }

      const booking = {
        id: crypto.randomBytes(4).toString('hex').toUpperCase(),
        name,
        phone,
        tableId,
        date,
        slot,
        guests,
        advanceFee: ADVANCE_FEE,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      bookings.push(booking);
      try {
        await writeData('bookings', bookings);
      } catch (writeErr) {
        console.error('Booking could not be saved to storage (continuing via WhatsApp):', writeErr.message);
      }
      res.status(201).json(booking);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Booking could not be saved. Please try again or call us directly.' });
    }
  });

  router.put('/bookings/:id', async (req, res) => {
    if (!isAuthed(req)) return res.status(401).json({ error: 'Unauthorized.' });
    try {
      const bookings = await readData('bookings');
      const booking = bookings.find((b) => b.id === req.params.id);
      if (!booking) return res.status(404).json({ error: 'Booking not found.' });
      if (req.body && typeof req.body.status === 'string' && ['pending', 'confirmed', 'cancelled'].includes(req.body.status)) {
        booking.status = req.body.status;
      }
      await writeData('bookings', bookings);
      res.json(booking);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not update booking.' });
    }
  });

  router.delete('/bookings/:id', async (req, res) => {
    if (!isAuthed(req)) return res.status(401).json({ error: 'Unauthorized.' });
    try {
      let bookings = await readData('bookings');
      const before = bookings.length;
      bookings = bookings.filter((b) => b.id !== req.params.id);
      if (bookings.length === before) return res.status(404).json({ error: 'Booking not found.' });
      await writeData('bookings', bookings);
      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not delete booking.' });
    }
  });

  return router;
}

function createApp(options) {
  const opts = options || {};
  const app = express();

  app.use(express.json({ limit: '1mb' }));

  if (!opts.serveStatic) {
    app.use((req, res, next) => {
      if (!/^\/api(\/|$)/.test(req.url)) {
        req.url = '/api' + (req.url.startsWith('/') ? '' : '/') + req.url;
      }
      next();
    });
  }

  app.use('/api', createApiRouter());

  if (opts.serveStatic) {
    const rootDir = path.join(__dirname, '..');
    app.use('/css', express.static(path.join(rootDir, 'css')));
    app.use('/js', express.static(path.join(rootDir, 'js')));
    ['robots.txt', 'sitemap.xml'].forEach((f) => {
      app.get('/' + f, (req, res) => res.sendFile(path.join(rootDir, f)));
    });
    app.get('/', (req, res) => res.sendFile(path.join(rootDir, 'index.html')));
    app.get('/index.html', (req, res) => res.sendFile(path.join(rootDir, 'index.html')));
    app.get(['/admin', '/admin.html'], (req, res) => res.sendFile(path.join(rootDir, 'admin.html')));
  }

  app.get('/admin', (req, res) => res.redirect('/admin.html'));

  app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

  return app;
}

module.exports = { createApp };
