const menuGrid = document.getElementById('menuGrid');
const searchInput = document.getElementById('searchInput');
const chipsWrap = document.getElementById('categoryChips');
const emptyMsg = document.getElementById('emptyMsg');

const FALLBACK_IMG = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">' +
  '<rect width="600" height="400" fill="#14141b"/>' +
  '<circle cx="300" cy="200" r="120" fill="#f5b301" opacity="0.9"/>' +
  '<circle cx="300" cy="200" r="90" fill="#c41e3a"/>' +
  '<text x="300" y="215" font-family="Georgia,serif" font-size="36" fill="#f5b301" text-anchor="middle" font-weight="bold">Dosa</text>' +
  '</svg>'
);

const state = { dosas: [], category: 'All', query: '' };

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function formatPrice(price) {
  return '\u20B9' + Number(price || 0).toLocaleString('en-IN');
}

async function loadDosas() {
  try {
    const res = await fetch('/api/dosas');
    if (!res.ok) throw new Error('Failed to load menu');
    state.dosas = await res.json();
    Object.keys(cart).forEach((id) => {
      if (!state.dosas.find((d) => d.id === id)) delete cart[id];
    });
    saveCart();
    renderCart();
    renderChips();
    render();
  } catch (err) {
    console.error(err);
    showToast('Could not load the menu. Please try again.', 'error');
  }
}

function renderChips() {
  const cats = ['All', ...new Set(state.dosas.map((d) => d.category).filter(Boolean))];
  chipsWrap.innerHTML = cats.map((c) =>
    `<button class="chip ${c === state.category ? 'active' : ''}" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</button>`
  ).join('');
}

function render() {
  const q = state.query.trim().toLowerCase();
  const filtered = state.dosas.filter((d) => {
    const matchCat = state.category === 'All' || d.category === state.category;
    const matchQ = !q ||
      (d.name || '').toLowerCase().includes(q) ||
      (d.description || '').toLowerCase().includes(q) ||
      (d.category || '').toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  emptyMsg.hidden = filtered.length > 0;

  menuGrid.innerHTML = filtered.map((d, i) => {
    const soldOut = d.available === false;
    return `
      <article class="dosa-card" style="animation-delay:${Math.min(i * 60, 420)}ms">
        <div class="card-img-wrap">
          <img src="${escapeHtml(d.imageUrl || FALLBACK_IMG)}" alt="${escapeHtml(d.name)}" loading="lazy"
               onerror="this.onerror=null;this.src=FALLBACK_IMG">
          <span class="card-tag">${escapeHtml(d.category)}</span>
          ${d.badge ? `<span class="card-badge ${d.badge.toLowerCase()}">${escapeHtml(d.badge)}</span>` : ''}
          ${soldOut ? '<div class="card-sold"><span>Out of Stock</span></div>' : ''}
        </div>
        <div class="card-body">
          <h3>${escapeHtml(d.name)}</h3>
          <p>${escapeHtml(d.description || 'Crispy, golden and absolutely delicious.')}</p>
          <div class="card-foot">
            <span class="price">${formatPrice(d.price)}</span>
            ${soldOut
              ? '<span class="btn btn-ghost btn-sm" style="opacity:.55;cursor:not-allowed">Unavailable</span>'
              : `<button class="btn btn-gold btn-sm add-btn" data-add="${d.id}">+ Add</button>`}
          </div>
        </div>
      </article>`;
  }).join('');
}

function observeReveals() {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('visible'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal:not(.visible)').forEach((el) => io.observe(el));
}

chipsWrap.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  state.category = chip.dataset.cat;
  renderChips();
  render();
});

searchInput.addEventListener('input', () => {
  state.query = searchInput.value;
  render();
});

const nav = document.getElementById('nav');
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
  navToggle.classList.toggle('open');
});

navLinks.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
  navLinks.classList.remove('open');
  navToggle.classList.remove('open');
}));

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
});

function refresh() {
  loadDosas();
}

window.addEventListener('focus', refresh);
setInterval(refresh, 30000);

const WHATSAPP_NUMBER = '919904941966';
const CART_KEY = 'crownCart';

const cartBtn = document.getElementById('cartBtn');
const cartCount = document.getElementById('cartCount');
const cartDrawer = document.getElementById('cartDrawer');
const cartOverlay = document.getElementById('cartOverlay');
const cartClose = document.getElementById('cartClose');
const cartItems = document.getElementById('cartItems');
const cartEmpty = document.getElementById('cartEmpty');
const cartTotal = document.getElementById('cartTotal');
const placeOrderBtn = document.getElementById('placeOrderBtn');
const toTop = document.getElementById('toTop');

function loadCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || {}; } catch (e) { return {}; }
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function findDosa(id) {
  return state.dosas.find((d) => d.id === id);
}

let cart = loadCart();

function addToCart(id) {
  const d = findDosa(id);
  if (!d || d.available === false) return;
  cart[id] = (cart[id] || 0) + 1;
  saveCart();
  renderCart();
  openCart();
}

function setQty(id, qty) {
  if (qty <= 0) delete cart[id];
  else cart[id] = qty;
  saveCart();
  renderCart();
}

function cartArray() {
  return Object.keys(cart)
    .map((id) => ({ id, dosa: findDosa(id), qty: cart[id] }))
    .filter((x) => x.dosa);
}

function cartSubtotal() {
  return cartArray().reduce((s, x) => s + Number(x.dosa.price) * x.qty, 0);
}

function renderCart() {
  const items = cartArray();
  const total = cartSubtotal();
  const qtyCount = items.reduce((s, x) => s + x.qty, 0);
  cartCount.hidden = qtyCount === 0;
  cartCount.textContent = qtyCount;
  cartEmpty.style.display = items.length ? 'none' : '';
  cartItems.style.display = items.length ? '' : 'none';
  cartTotal.textContent = formatPrice(total);
  cartItems.innerHTML = items.map((x) => `
    <div class="cart-item">
      <img src="${escapeHtml(x.dosa.imageUrl || FALLBACK_IMG)}" alt="${escapeHtml(x.dosa.name)}" onerror="this.onerror=null;this.src=FALLBACK_IMG">
      <div class="cart-item-info">
        <strong>${escapeHtml(x.dosa.name)}</strong>
        <span>${formatPrice(x.dosa.price)} each</span>
        <div class="qty">
          <button data-dec="${x.id}" aria-label="Decrease">&#8722;</button>
          <b>${x.qty}</b>
          <button data-inc="${x.id}" aria-label="Increase">+</button>
        </div>
      </div>
      <span class="cart-item-line">${formatPrice(Number(x.dosa.price) * x.qty)}</span>
      <button class="cart-item-remove" data-rm="${x.id}" aria-label="Remove">&#10005;</button>
    </div>`).join('');
}

function openCart() {
  cartDrawer.classList.add('open');
  cartOverlay.hidden = false;
  requestAnimationFrame(() => cartOverlay.classList.add('open'));
}

function closeCart() {
  cartDrawer.classList.remove('open');
  cartOverlay.classList.remove('open');
  setTimeout(() => { cartOverlay.hidden = true; }, 300);
}

cartBtn.addEventListener('click', openCart);
cartClose.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCart(); });

cartItems.addEventListener('click', (e) => {
  const inc = e.target.closest('[data-inc]');
  const dec = e.target.closest('[data-dec]');
  const rm = e.target.closest('[data-rm]');
  if (inc) setQty(inc.dataset.inc, cart[inc.dataset.inc] + 1);
  else if (dec) setQty(dec.dataset.dec, cart[dec.dataset.dec] - 1);
  else if (rm) setQty(rm.dataset.rm, 0);
});

menuGrid.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-add]');
  if (btn) addToCart(btn.dataset.add);
});

placeOrderBtn.addEventListener('click', () => {
  const items = cartArray();
  if (!items.length) {
    showToast('Your cart is empty.', 'error');
    return;
  }
  let msg = 'Hello Mr. Crown Fancy Dosa! I would like to place an order:\n\n';
  items.forEach((x) => {
    msg += '\u2022 ' + x.qty + 'x ' + x.dosa.name + ' \u2014 ' + formatPrice(Number(x.dosa.price) * x.qty) + '\n';
  });
  msg += '\nTotal: ' + formatPrice(cartSubtotal());
  msg += '\n\nPlease share your name and delivery address so you can send my order to me. Thank you!';
  window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(msg), '_blank');
});

window.addEventListener('scroll', () => {
  toTop.classList.toggle('show', window.scrollY > 500);
});

toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

function showToast(msg, type) {
  let wrap = document.getElementById('toastWrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'toastWrap';
    wrap.className = 'toast-wrap';
    document.body.appendChild(wrap);
  }
  const t = document.createElement('div');
  t.className = 'toast' + (type ? ' ' + type : '');
  t.textContent = msg;
  wrap.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

loadDosas();
observeReveals();

/* ---------- Table Booking ---------- */
const WHATSAPP_BOOKING = '919904941966';
const ADVANCE_FEE = 99;

const bookingForm = document.getElementById('bookingForm');
const bkDate = document.getElementById('bkDate');
const bkSlot = document.getElementById('bkSlot');
const bkGuests = document.getElementById('bkGuests');
const bkName = document.getElementById('bkName');
const bkPhone = document.getElementById('bkPhone');
const tablesGrid = document.getElementById('tablesGrid');
const tableHint = document.getElementById('tableHint');
const bookingsLoadMsg = document.getElementById('bookingsLoadMsg');
const bkSubmit = document.getElementById('bkSubmit');
const bookingSuccess = document.getElementById('bookingSuccess');
const bookingDetails = document.getElementById('bookingDetails');
const waConfirmBtn = document.getElementById('waConfirmBtn');
const newBookingBtn = document.getElementById('newBookingBtn');
const slotBoard = document.getElementById('slotBoard');
const boardDateLabel = document.getElementById('boardDateLabel');

let bookingConfig = { tables: [], timeSlots: [], advanceFee: ADVANCE_FEE };
let selectedTable = null;
let bookedMap = {};
let bookedList = [];

function todayStr() {
  const t = new Date();
  return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
}

function maxDateStr() {
  const t = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
}

async function initBooking() {
  try {
    const res = await fetch('/api/booking-config');
    bookingConfig = await res.json();
  } catch (e) {
    bookingConfig.tables = [];
  }

  bkDate.min = todayStr();
  bkDate.max = maxDateStr();
  if (!bkDate.value) bkDate.value = todayStr();

  bkSlot.innerHTML = '<option value="">Select time slot</option>' +
    bookingConfig.timeSlots.map((s) => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');

  const guestOpts = [];
  for (let i = 1; i <= 12; i++) guestOpts.push(`<option value="${i}" ${i === 2 ? 'selected' : ''}>${i} Guest${i > 1 ? 's' : ''}</option>`);
  bkGuests.innerHTML = guestOpts.join('');

  renderTables();
  await refreshBooked();
}

function renderTables() {
  const rows = ['A', 'B', 'C', 'D'];
  tablesGrid.innerHTML = rows.map((row) => `
    <div class="tables-row">
      <span class="row-label">${row}</span>
      ${[1, 2, 3, 4].map((n) => {
        const id = row + n;
        return `<button type="button" class="table-seat" data-table="${id}">
          <b>${id}</b><small>4 seats</small>
        </button>`;
      }).join('')}
    </div>`).join('');
}

async function refreshBooked() {
  const date = bkDate.value || todayStr();
  try {
    const res = await fetch('/api/bookings?date=' + encodeURIComponent(date));
    bookedList = await res.json();
  } catch (e) {
    bookedList = [];
  }
  bookedMap = {};
  bookedList.forEach((b) => {
    if (b.status !== 'cancelled') {
      bookedMap[b.tableId + '|' + b.slot] = true;
    }
  });
  bookingsLoadMsg.hidden = true;
  tablesGrid.classList.remove('disabled');
  if (boardDateLabel) boardDateLabel.textContent = prettyDate(date);
  renderSlotOptions();
  updateSeatStates();
}

function activeBookings(slot) {
  return bookedList.filter((b) => b.status !== 'cancelled' && b.slot === slot);
}

function renderSlotOptions() {
  const total = bookingConfig.tables.length || 16;
  const current = bkSlot.value;
  bkSlot.innerHTML = '<option value="">Select time slot</option>' +
    bookingConfig.timeSlots.map((s) => {
      const taken = activeBookings(s).length;
      let label = s;
      if (taken >= total) label += ' \u2014 FULL';
      else if (taken > 0) label += ' \u2014 ' + taken + '/' + total + ' booked';
      return `<option value="${escapeHtml(s)}">${escapeHtml(label)}</option>`;
    }).join('');
  if ([...bkSlot.options].some((o) => o.value === current)) bkSlot.value = current;
}

function renderSlotBoard() {
  if (!slotBoard) return;
  const total = bookingConfig.tables.length || 16;
  slotBoard.innerHTML = bookingConfig.timeSlots.map((s) => {
    const act = activeBookings(s);
    const taken = act.length;
    const full = taken >= total;
    const pct = Math.round((taken / total) * 100);
    const statusCls = full ? 'st-full' : taken ? 'st-part' : 'st-free';
    const statusTxt = full ? 'FULL' : taken ? taken + '/' + total + ' booked' : 'All free';
    const tablesTxt = taken
      ? 'Booked: ' + escapeHtml(act.map((b) => b.tableId).sort().join(', '))
      : 'Every table open \u2014 book yours!';
    return `
      <button type="button" class="slot-row${full ? ' full' : ''}${bkSlot.value === s ? ' active' : ''}" data-slot="${escapeHtml(s)}">
        <span class="slot-top">
          <b class="slot-time">${escapeHtml(s)}</b>
          <em class="slot-status ${statusCls}">${statusTxt}</em>
        </span>
        <span class="slot-meter"><i class="${statusCls}" style="width:${pct}%"></i></span>
        <span class="slot-tables">${tablesTxt}</span>
      </button>`;
  }).join('');
}

function updateSeatStates() {
  const slot = bkSlot.value;
  tablesGrid.querySelectorAll('.table-seat').forEach((btn) => {
    const id = btn.dataset.table;
    const taken = slot && bookedMap[id + '|' + slot];
    btn.classList.toggle('booked', !!taken);
    btn.disabled = !!taken;
    btn.querySelector('small').textContent = taken ? 'Booked' : 'Available';
    if (taken && selectedTable === id) {
      selectedTable = null;
      tableHint.textContent = 'That table got booked. Pick another.';
    }
  });
  tablesGrid.querySelectorAll('.table-seat').forEach((btn) => {
    btn.classList.toggle('selected', btn.dataset.table === selectedTable);
  });
  if (!slot) tableHint.textContent = 'Select a time slot first';
  else if (!selectedTable) tableHint.textContent = 'Click a green table to select';
  else tableHint.textContent = 'Table ' + selectedTable + ' selected';
  renderSlotBoard();
}

slotBoard.addEventListener('click', (e) => {
  const row = e.target.closest('.slot-row');
  if (!row) return;
  bkSlot.value = row.dataset.slot;
  updateSeatStates();
  tablesGrid.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

setInterval(() => {
  if (!document.hidden && !bookingForm.hidden) refreshBooked();
}, 20000);

window.addEventListener('focus', () => {
  if (!bookingForm.hidden) refreshBooked();
});

tablesGrid.addEventListener('click', (e) => {
  const seat = e.target.closest('.table-seat');
  if (!seat || seat.disabled) return;
  selectedTable = seat.dataset.table === selectedTable ? null : seat.dataset.table;
  updateSeatStates();
});

bkSlot.addEventListener('change', updateSeatStates);
bkDate.addEventListener('change', () => { selectedTable = null; refreshBooked(); });

bookingForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!bkSlot.value) { showToast('Please select a time slot.', 'error'); return; }
  if (!selectedTable) { showToast('Please select a table.', 'error'); return; }

  const payload = {
    name: bkName.value.trim(),
    phone: bkPhone.value.trim(),
    date: bkDate.value,
    slot: bkSlot.value,
    guests: Number(bkGuests.value),
    tableId: selectedTable
  };

  bkSubmit.disabled = true;
  bkSubmit.textContent = 'Reserving...';
  try {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Booking failed');

    showBookingSuccess(data);
    await refreshBooked();
  } catch (err) {
    showToast(err.message, 'error');
    await refreshBooked();
  } finally {
    bkSubmit.disabled = false;
    bkSubmit.innerHTML = 'Reserve Now &mdash; &#8377;99 Advance';
  }
});

function prettyDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function showBookingSuccess(b) {
  bookingForm.hidden = true;
  bookingSuccess.hidden = false;
  bookingSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
  bookingDetails.innerHTML = `
    <div><span>Booking ID</span><strong>${escapeHtml(b.id)}</strong></div>
    <div><span>Name</span><strong>${escapeHtml(b.name)}</strong></div>
    <div><span>Table</span><strong>${escapeHtml(b.tableId)}</strong></div>
    <div><span>Date</span><strong>${prettyDate(b.date)}</strong></div>
    <div><span>Time</span><strong>${escapeHtml(b.slot)}</strong></div>
    <div><span>Guests</span><strong>${b.guests}</strong></div>
    <div><span>Advance Fee</span><strong class="gold">\u20B9${b.advanceFee}</strong></div>`;
  const msg = `Hello Mr. Crown Fancy Dosa! I have booked a table:\n\n`
    + `Booking ID: ${b.id}\nName: ${b.name}\nPhone: ${b.phone}\n`
    + `Table: ${b.tableId}\nDate: ${prettyDate(b.date)}\nTime: ${b.slot}\nGuests: ${b.guests}\n\n`
    + `I will pay the \u20B9${b.advanceFee} advance fee. Please confirm my booking.`;
  waConfirmBtn.href = 'https://wa.me/' + WHATSAPP_BOOKING + '?text=' + encodeURIComponent(msg);
}

newBookingBtn.addEventListener('click', () => {
  bookingSuccess.hidden = true;
  bookingForm.hidden = false;
  bookingForm.reset();
  selectedTable = null;
  bkDate.value = todayStr();
  bkSlot.innerHTML = '<option value="">Select time slot</option>' +
    bookingConfig.timeSlots.map((s) => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
  initBooking();
});

initBooking();