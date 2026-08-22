const API = '/api';
let token = sessionStorage.getItem('crownToken') || '';
let dosas = [];
let editingId = null;

const loginView = document.getElementById('loginView');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('loginForm');
const loginPassword = document.getElementById('loginPassword');
const loginUsername = document.getElementById('loginUsername');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');

const statsRow = document.getElementById('statsRow');
const tableBody = document.getElementById('tableBody');
const tableEmpty = document.getElementById('tableEmpty');
const itemCount = document.getElementById('itemCount');
const catList = document.getElementById('catList');
const bookingsBody = document.getElementById('bookingsBody');
const bookingsEmpty = document.getElementById('bookingsEmpty');
const bookingCount = document.getElementById('bookingCount');
let bookings = [];

const dosaForm = document.getElementById('dosaForm');
const formTitle = document.getElementById('formTitle');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const fName = document.getElementById('fName');
const fCategory = document.getElementById('fCategory');
const fPrice = document.getElementById('fPrice');
const fBadge = document.getElementById('fBadge');
const fImage = document.getElementById('fImage');
const fDesc = document.getElementById('fDesc');
const fAvailable = document.getElementById('fAvailable');
const imgPreview = document.getElementById('imgPreview');

const DEFAULT_CATEGORIES = ['Classic', 'Cheese Burst', 'Indo-Chinese', 'Paneer Special', 'Sweet', 'Special'];

const FALLBACK_IMG = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">' +
  '<rect width="600" height="400" fill="#14141b"/>' +
  '<circle cx="300" cy="200" r="120" fill="#f5b301" opacity="0.9"/>' +
  '<circle cx="300" cy="200" r="90" fill="#c41e3a"/>' +
  '<text x="300" y="215" font-family="Georgia,serif" font-size="36" fill="#f5b301" text-anchor="middle" font-weight="bold">Dosa</text>' +
  '</svg>'
);

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function formatPrice(price) {
  return '\u20B9' + Number(price || 0).toLocaleString('en-IN');
}

function authHeaders() {
  const h = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = 'Bearer ' + token;
  return h;
}

async function api(path, opts = {}) {
  const res = await fetch(API + path, { ...opts, headers: authHeaders() });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    logout();
    throw new Error('Session expired. Please login again.');
  }
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function showDashboard() {
  loginView.hidden = true;
  dashboard.hidden = false;
}

function showLogin() {
  dashboard.hidden = true;
  loginView.hidden = false;
}

function logout() {
  token = '';
  sessionStorage.removeItem('crownToken');
  showLogin();
}

logoutBtn.addEventListener('click', logout);

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.hidden = true;
  try {
    const res = await fetch(API + '/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: loginUsername.value.trim(), password: loginPassword.value })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    token = data.token;
    sessionStorage.setItem('crownToken', token);
    loginPassword.value = '';
    await load();
    showDashboard();
  } catch (err) {
    loginError.textContent = err.message;
    loginError.hidden = false;
  }
});

async function load() {
  dosas = await api('/dosas');
  bookings = await api('/bookings');
  renderStats();
  renderTable();
  renderBookings();
  fillCatList();
}

function renderBookings() {
  bookingCount.textContent = bookings.length + ' bookings';
  bookingsEmpty.hidden = bookings.length > 0;
  const sorted = [...bookings].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  bookingsBody.innerHTML = sorted.map((b) => `
    <tr>
      <td><strong>${escapeHtml(b.id)}</strong></td>
      <td>
        <div><strong>${escapeHtml(b.name)}</strong></div>
        <small style="color:var(--muted)">${escapeHtml(b.phone)} &middot; ${b.guests} guests</small>
      </td>
      <td><span class="chip-sm">${escapeHtml(b.tableId)}</span></td>
      <td>${escapeHtml(prettyDate(b.date))}<br><small style="color:var(--muted)">${escapeHtml(b.slot)}</small></td>
      <td class="price-cell">\u20B9${b.advanceFee}</td>
      <td><button class="status-toggle ${b.status === 'confirmed' ? 'on' : ''}" data-bstatus="${b.id}">${escapeHtml(b.status === 'confirmed' ? 'Confirmed' : 'Pending')}</button></td>
      <td>
        <div class="actions-cell">
          <a class="btn btn-ghost btn-sm" href="https://wa.me/91${escapeHtml(b.phone)}?text=${encodeURIComponent('Hello ' + b.name + ', your table ' + b.tableId + ' at Mr. Crown Fancy Dosa on ' + prettyDate(b.date) + ' (' + b.slot + ') is confirmed. Booking ID: ' + b.id)}" target="_blank" rel="noopener">WhatsApp</a>
          <button class="btn btn-danger btn-sm" data-bdel="${b.id}">Cancel</button>
        </div>
      </td>
    </tr>`).join('');
}

function prettyDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

bookingsBody.addEventListener('click', async (e) => {
  const delBtn = e.target.closest('[data-bdel]');
  const stBtn = e.target.closest('[data-bstatus]');
  try {
    if (delBtn) {
      if (confirm('Cancel and remove this booking?')) {
        await api('/bookings/' + delBtn.dataset.bdel, { method: 'DELETE' });
        showToast('Booking cancelled.');
        await load();
      }
    } else if (stBtn) {
      const b = bookings.find((x) => x.id === stBtn.dataset.bstatus);
      if (!b) return;
      await api('/bookings/' + b.id, {
        method: 'PUT',
        body: JSON.stringify({ status: b.status === 'confirmed' ? 'pending' : 'confirmed' })
      });
      showToast('Booking marked ' + (b.status === 'confirmed' ? 'pending.' : 'confirmed.'));
      await load();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
});

function fillCatList() {
  const cats = new Set([...DEFAULT_CATEGORIES, ...dosas.map((d) => d.category).filter(Boolean)]);
  catList.innerHTML = [...cats].map((c) => `<option value="${escapeHtml(c)}"></option>`).join('');
}

function renderStats() {
  const cats = new Set(dosas.map((d) => d.category)).size;
  const inStock = dosas.filter((d) => d.available !== false).length;
  const avg = dosas.length ? dosas.reduce((s, d) => s + Number(d.price || 0), 0) / dosas.length : 0;
  statsRow.innerHTML = `
    <div class="stat-card"><strong>${dosas.length}</strong><span>Total Items</span></div>
    <div class="stat-card"><strong>${cats}</strong><span>Categories</span></div>
    <div class="stat-card"><strong>${inStock}</strong><span>In Stock</span></div>
    <div class="stat-card"><strong>\u20B9${avg.toFixed(0)}</strong><span>Avg Price</span></div>`;
}

function renderTable() {
  itemCount.textContent = dosas.length + ' items';
  tableEmpty.hidden = dosas.length > 0;
  tableBody.innerHTML = dosas.map((d) => `
    <tr>
      <td>
        <div class="item-cell">
          <img class="thumb" src="${escapeHtml(d.imageUrl || FALLBACK_IMG)}" alt="${escapeHtml(d.name)}"
               onerror="this.onerror=null;this.src=FALLBACK_IMG">
          <div>
            <strong>${escapeHtml(d.name)}</strong>
            <small>${escapeHtml(d.description || '')}</small>
          </div>
        </div>
      </td>
      <td><span class="chip-sm">${escapeHtml(d.category)}</span>${d.badge ? ' <span class="chip-sm badge-tag badge-' + d.badge.toLowerCase() + '">' + escapeHtml(d.badge) + '</span>' : ''}</td>
      <td class="price-cell">${formatPrice(d.price)}</td>
      <td><button class="status-toggle ${d.available !== false ? 'on' : ''}" data-toggle="${d.id}">${d.available !== false ? 'In Stock' : 'Out of Stock'}</button></td>
      <td>
        <div class="actions-cell">
          <button class="btn btn-ghost btn-sm" data-edit="${d.id}">Edit</button>
          <button class="btn btn-danger btn-sm" data-del="${d.id}">Delete</button>
        </div>
      </td>
    </tr>`).join('');
}

tableBody.addEventListener('click', async (e) => {
  const editBtn = e.target.closest('[data-edit]');
  const delBtn = e.target.closest('[data-del]');
  const togBtn = e.target.closest('[data-toggle]');
  if (!editBtn && !delBtn && !togBtn) return;
  try {
    if (editBtn) {
      const d = dosas.find((x) => x.id === editBtn.dataset.edit);
      if (d) fillForm(d);
    } else if (delBtn) {
      const d = dosas.find((x) => x.id === delBtn.dataset.del);
      if (d && confirm('Delete "' + d.name + '" from the menu?')) {
        await api('/dosas/' + d.id, { method: 'DELETE' });
        showToast('Deleted ' + d.name);
        await load();
      }
    } else if (togBtn) {
      const d = dosas.find((x) => x.id === togBtn.dataset.toggle);
      if (d) {
        await api('/dosas/' + d.id, {
          method: 'PUT',
          body: JSON.stringify({ available: d.available !== false ? false : true })
        });
        await load();
      }
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
});

dosaForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    name: fName.value.trim(),
    category: fCategory.value.trim(),
    price: Number(fPrice.value),
    description: fDesc.value.trim(),
    imageUrl: fImage.value.trim(),
    badge: fBadge.value,
    available: fAvailable.checked
  };
  if (!payload.name || !payload.category || !(payload.price >= 0)) {
    showToast('Name, category and a valid price are required.', 'error');
    return;
  }
  try {
    if (editingId) {
      await api('/dosas/' + editingId, { method: 'PUT', body: JSON.stringify(payload) });
      showToast('Dosa updated.');
    } else {
      await api('/dosas', { method: 'POST', body: JSON.stringify(payload) });
      showToast('Dosa added to the menu.');
    }
    clearForm();
    await load();
  } catch (err) {
    showToast(err.message, 'error');
  }
});

function fillForm(d) {
  editingId = d.id;
  fName.value = d.name;
  fCategory.value = d.category;
  fPrice.value = d.price;
  fBadge.value = d.badge || '';
  fImage.value = d.imageUrl || '';
  fDesc.value = d.description || '';
  fAvailable.checked = d.available !== false;
  updatePreview();
  formTitle.textContent = 'Edit Dosa';
  cancelEditBtn.hidden = false;
  dosaForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function clearForm() {
  editingId = null;
  dosaForm.reset();
  fAvailable.checked = true;
  updatePreview();
  formTitle.textContent = 'Add New Dosa';
  cancelEditBtn.hidden = true;
}

cancelEditBtn.addEventListener('click', clearForm);

fImage.addEventListener('input', updatePreview);

function updatePreview() {
  const val = fImage.value.trim();
  if (val) {
    imgPreview.hidden = false;
    imgPreview.src = val;
  } else {
    imgPreview.hidden = true;
    imgPreview.removeAttribute('src');
  }
}

imgPreview.addEventListener('error', () => {
  imgPreview.src = FALLBACK_IMG;
});

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

(async function init() {
  fillCatList();
  if (!token) {
    showLogin();
    return;
  }
  try {
    await load();
    showDashboard();
  } catch (err) {
    showLogin();
  }
})();

window.addEventListener('focus', () => {
  if (loginView.hidden) load().catch(() => {});
});