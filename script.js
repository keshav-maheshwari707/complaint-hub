/* ============================================================
   Complaint Management System — Vanilla JS
   Modules: storage, auth, complaints, ui
   ============================================================ */

// ---------- STORAGE ----------
const Storage = {
  getUsers: () => JSON.parse(localStorage.getItem('cms_users') || '[]'),
  setUsers: (u) => localStorage.setItem('cms_users', JSON.stringify(u)),
  getComplaints: () => JSON.parse(localStorage.getItem('cms_complaints') || '[]'),
  setComplaints: (c) => localStorage.setItem('cms_complaints', JSON.stringify(c)),
  getSession: () => JSON.parse(localStorage.getItem('cms_session') || 'null'),
  setSession: (s) => localStorage.setItem('cms_session', JSON.stringify(s)),
  clearSession: () => localStorage.removeItem('cms_session'),
};

// ---------- TOAST ----------
function toast(msg, type = 'success') {
  let wrap = document.querySelector('.toast-wrap');
  if (!wrap) { wrap = document.createElement('div'); wrap.className = 'toast-wrap'; document.body.appendChild(wrap); }
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  wrap.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(120%)'; t.style.transition = '.3s'; }, 2800);
  setTimeout(() => t.remove(), 3200);
}

// ---------- AUTH ----------
const Auth = {
  signup({ name, email, password, role }) {
    const users = Storage.getUsers();
    if (users.find(u => u.email === email)) throw new Error('Email already registered');
    const user = { id: 'U' + Date.now(), name, email, password, role };
    users.push(user); Storage.setUsers(users);
    return user;
  },
  login({ email, password, role }) {
    const user = Storage.getUsers().find(u => u.email === email && u.password === password && u.role === role);
    if (!user) throw new Error('Invalid credentials or role mismatch');
    Storage.setSession({ id: user.id, name: user.name, email: user.email, role: user.role });
    return user;
  },
  logout() { Storage.clearSession(); window.location.href = 'index.html'; },
  resetPassword(email, newPassword) {
    const users = Storage.getUsers();
    const i = users.findIndex(u => u.email === email);
    if (i < 0) throw new Error('No account with that email');
    users[i].password = newPassword;
    Storage.setUsers(users);
  },
  guard(requiredRole) {
    const s = Storage.getSession();
    if (!s) { window.location.href = 'index.html'; return null; }
    if (requiredRole && s.role !== requiredRole) {
      window.location.href = s.role === 'admin' ? 'admin.html' : 'dashboard.html';
      return null;
    }
    return s;
  }
};

// ---------- COMPLAINTS ----------
const Complaints = {
  create({ title, description, category, userId, userName, userEmail }) {
    const all = Storage.getComplaints();
    const c = {
      id: 'CMP-' + Date.now().toString(36).toUpperCase(),
      title, description, category, userId, userName, userEmail,
      status: 'Pending', remarks: '', date: new Date().toISOString(), updatedAt: new Date().toISOString()
    };
    all.unshift(c); Storage.setComplaints(all); return c;
  },
  update(id, patch) {
    const all = Storage.getComplaints();
    const i = all.findIndex(c => c.id === id);
    if (i < 0) throw new Error('Not found');
    all[i] = { ...all[i], ...patch, updatedAt: new Date().toISOString() };
    Storage.setComplaints(all); return all[i];
  },
  delete(id) {
    Storage.setComplaints(Storage.getComplaints().filter(c => c.id !== id));
  },
  byUser(userId) { return Storage.getComplaints().filter(c => c.userId === userId); },
  all() { return Storage.getComplaints(); }
};

// ---------- UI HELPERS ----------
function badge(status) {
  const map = { 'Pending': 'badge-pending', 'In Progress': 'badge-progress', 'Resolved': 'badge-resolved' };
  return `<span class="badge ${map[status]}">${status}</span>`;
}
function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}
function initials(name) { return (name || '?').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase(); }

function confirmDialog(message, onYes) {
  const bg = document.getElementById('confirmModal');
  document.getElementById('confirmMsg').textContent = message;
  bg.classList.add('show');
  const yes = document.getElementById('confirmYes');
  const no = document.getElementById('confirmNo');
  const cleanup = () => { bg.classList.remove('show'); yes.onclick = no.onclick = null; };
  yes.onclick = () => { cleanup(); onYes(); };
  no.onclick = cleanup;
}

// expose globally
window.CMS = { Storage, Auth, Complaints, toast, badge, formatDate, initials, confirmDialog };
