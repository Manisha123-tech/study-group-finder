/* ============================================================
   SNIPPET 2 — CREATE THIS AS A NEW FILE: js/connections.js
   This is a completely new file. Create it inside your js/ folder.
   ============================================================ */

const CONN_API = 'http://localhost:3000';

function connHeaders() {
  const token = localStorage.getItem('token') || '';
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

/* ── SEND REQUEST (called from Connect button) ──────────────── */

async function sendConnectionRequest(toEmail, btnEl) {
  if (!toEmail) {
    showConnToast('Could not find this user\'s email.', 'error');
    return;
  }

  btnEl.disabled = true;
  btnEl.textContent = 'Sending…';

  try {
    const res  = await fetch(`${CONN_API}/api/connections/send`, {
      method: 'POST',
      headers: connHeaders(),
      body: JSON.stringify({ toEmail }),
    });
    const data = await res.json();

    if (res.status === 201) {
      btnEl.textContent = '✓ Requested';
      btnEl.classList.add('btn-requested');
      showConnToast('Connection request sent!', 'success');
    } else if (res.status === 409) {
      if (data.status === 'accepted') {
        btnEl.textContent = '✓ Connected';
        btnEl.classList.add('btn-connected');
      } else {
        btnEl.textContent = '✓ Requested';
        btnEl.classList.add('btn-requested');
      }
      showConnToast(data.error, 'info');
    } else {
      btnEl.disabled = false;
      btnEl.textContent = 'Connect ↗';
      showConnToast(data.error || 'Failed to send request.', 'error');
    }
  } catch {
    btnEl.disabled = false;
    btnEl.textContent = 'Connect ↗';
    showConnToast('Server error. Is the backend running?', 'error');
  }
}

/* ── LOAD MY CONNECTIONS (returns email→status map) ─────────── */

async function loadMyConnections() {
  try {
    const res = await fetch(`${CONN_API}/api/connections/my`, {
      headers: connHeaders(),
    });
    if (!res.ok) return {};

    const list     = await res.json();
    const myEmail  = localStorage.getItem('email') || '';
    const map      = {};

    list.forEach(conn => {
      const other = conn.fromEmail === myEmail ? conn.toEmail : conn.fromEmail;
      map[other]  = conn.status;
    });

    return map;
  } catch {
    return {};
  }
}

/* ── UPDATE BUTTON STATES ON MATCH CARDS ────────────────────── */

function applyConnectionStatuses(connectionMap) {
  document.querySelectorAll('.match-card[data-email]').forEach(card => {
    const email = card.dataset.email;
    const btn   = card.querySelector('.btn-connect');
    if (!btn || !email) return;

    const status = connectionMap[email];
    if (status === 'accepted') {
      btn.textContent = '✓ Connected';
      btn.classList.add('btn-connected');
      btn.disabled = true;
    } else if (status === 'pending') {
      btn.textContent = '✓ Requested';
      btn.classList.add('btn-requested');
      btn.disabled = true;
    }
  });
}

/* ── RENDER INCOMING REQUESTS SECTION ───────────────────────── */

async function renderIncomingRequests() {
  const section = document.getElementById('incomingSection');
  const grid    = document.getElementById('incomingRequests');
  if (!grid) return;

  try {
    const res = await fetch(`${CONN_API}/api/connections/incoming`, {
      headers: connHeaders(),
    });
    if (!res.ok) return;

    const requests = await res.json();

    if (requests.length === 0) {
      if (section) section.style.display = 'none';
      return;
    }

    if (section) section.style.display = 'block';

    const badge = document.getElementById('incomingCount');
    if (badge) badge.textContent = requests.length;

    grid.innerHTML = '';

    const colors = ['#3b82f6','#ec4899','#8b5cf6','#10b981','#f59e0b','#ef4444'];

    requests.forEach(req => {
      const initials = req.fromName
        .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
      const color = colors[Math.floor(Math.random() * colors.length)];

      const card = document.createElement('div');
      card.className   = 'request-card';
      card.dataset.id  = req._id;
      card.innerHTML = `
        <div class="rq-top">
          <div class="rq-avatar" style="background:${color};">${escapeHTML(initials)}</div>
          <div class="rq-info">
            <div class="rq-name">${escapeHTML(req.fromName)}</div>
            <div class="rq-email">${escapeHTML(req.fromEmail)}</div>
          </div>
        </div>
        <p class="rq-msg">wants to connect with you</p>
        <div class="rq-actions">
          <button class="btn btn-accept" onclick="respondToRequest('${req._id}','accepted',this)">✓ Accept</button>
          <button class="btn btn-reject" onclick="respondToRequest('${req._id}','rejected',this)">✕ Decline</button>
        </div>
      `;
      grid.appendChild(card);
    });

  } catch (err) {
    console.warn('Could not load incoming requests:', err);
  }
}

/* ── RESPOND TO REQUEST ─────────────────────────────────────── */

async function respondToRequest(requestId, action, btnEl) {
  const card = btnEl.closest('.request-card');
  card.querySelectorAll('button').forEach(b => b.disabled = true);

  try {
    const res  = await fetch(`${CONN_API}/api/connections/${requestId}/respond`, {
      method: 'PATCH',
      headers: connHeaders(),
      body: JSON.stringify({ action }),
    });
    const data = await res.json();

    if (res.ok) {
      const actionsEl = card.querySelector('.rq-actions');
      if (action === 'accepted') {
        actionsEl.innerHTML = `<span class="rq-status accepted">✓ Connected</span>`;
        showConnToast(`You are now connected with ${card.querySelector('.rq-name').textContent}!`, 'success');
      } else {
        actionsEl.innerHTML = `<span class="rq-status rejected">Request declined</span>`;
        showConnToast('Request declined.', 'info');
      }

      setTimeout(() => {
        card.style.opacity    = '0';
        card.style.transition = 'opacity 0.4s';
        setTimeout(() => {
          card.remove();
          const grid = document.getElementById('incomingRequests');
          if (grid && grid.children.length === 0) {
            const sec = document.getElementById('incomingSection');
            if (sec) sec.style.display = 'none';
          }
          const badge = document.getElementById('incomingCount');
          if (badge) {
            const count = document.querySelectorAll('.request-card').length;
            badge.textContent = count;
          }
        }, 450);
      }, 1200);

    } else {
      showConnToast(data.error || 'Failed to respond.', 'error');
      card.querySelectorAll('button').forEach(b => b.disabled = false);
    }

  } catch {
    showConnToast('Server error.', 'error');
    card.querySelectorAll('button').forEach(b => b.disabled = false);
  }
}

/* ── TOAST ──────────────────────────────────────────────────── */

function showConnToast(message, type = 'info') {
  const old = document.getElementById('connToast');
  if (old) old.remove();

  const toast = document.createElement('div');
  toast.id        = 'connToast';
  toast.className = `conn-toast conn-toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('conn-toast-show'));

  setTimeout(() => {
    toast.classList.remove('conn-toast-show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function openChat(userId, userName) {
  window.location.href =
    'chat.html?userId=' + userId +
    '&name=' + encodeURIComponent(userName);
}