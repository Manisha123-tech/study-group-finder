// js/chat.js

const API = 'http://localhost:3000';

const params      = new URLSearchParams(window.location.search);
const otherUserId = params.get('userId');
const otherName   = decodeURIComponent(params.get('name') || 'User');

const chatHeaderName  = document.getElementById('chat-header-name');
const chatHeaderInit  = document.getElementById('chat-header-initials');
const messagesEl      = document.getElementById('chat-messages');
const messageInput    = document.getElementById('chat-input');
const sendBtn         = document.getElementById('chat-send-btn');
const backBtn         = document.getElementById('chat-back-btn');
const emptyState      = document.getElementById('chat-empty');

function getToken()  { return localStorage.getItem('token') || ''; }
function getEmail()  { return localStorage.getItem('email') || ''; }

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateLabel(iso) {
  const d = new Date(iso), now = new Date();
  const same = (a, b) => a.getDate()===b.getDate() && a.getMonth()===b.getMonth() && a.getFullYear()===b.getFullYear();
  if (same(d, now)) return 'Today';
  const yest = new Date(); yest.setDate(now.getDate()-1);
  if (same(d, yest)) return 'Yesterday';
  return d.toLocaleDateString([], { weekday:'long', month:'short', day:'numeric' });
}

function escapeHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
                  .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

function getInitials(name) {
  return (name||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
}

if (chatHeaderName) chatHeaderName.textContent = otherName;
if (chatHeaderInit) chatHeaderInit.textContent  = getInitials(otherName);
document.title = `Chat · ${otherName}`;

// ── Render bubble ─────────────────────────────────────────────────────────────
let lastDate = '';
function appendBubble(msg, isMine) {
  const dateLabel = formatDateLabel(msg.createdAt);
  if (dateLabel !== lastDate) {
    lastDate = dateLabel;
    const div = document.createElement('div');
    div.className = 'chat-date-divider';
    div.textContent = dateLabel;
    messagesEl.appendChild(div);
  }

  if ((msg.type === 'image' || msg.type === 'document') && window.buildFileBubble) {
    messagesEl.appendChild(window.buildFileBubble(msg, isMine));
    return;
  }

  const wrap = document.createElement('div');
  wrap.className = `chat-bubble-wrap ${isMine ? 'mine' : 'theirs'}`;
  wrap.dataset.id = msg._id;

  if (!isMine) {
    const av = document.createElement('div');
    av.className = 'bubble-avatar';
    av.textContent = getInitials(otherName);
    wrap.appendChild(av);
  }

  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble';
  bubble.innerHTML = `
    <div class="bubble-text">${escapeHtml(msg.content)}</div>
    <div class="bubble-meta">
      <span class="bubble-time">${formatTime(msg.createdAt)}</span>
      ${isMine ? `<span class="bubble-tick">${msg.read ? '✓✓' : '✓'}</span>` : ''}
    </div>`;
  wrap.appendChild(bubble);
  messagesEl.appendChild(wrap);
}

function scrollBottom() { messagesEl.scrollTop = messagesEl.scrollHeight; }

function showError(msg) {
  messagesEl.innerHTML = `
    <div class="chat-error-state">
      <div class="chat-error-icon">💬</div>
      <p>${escapeHtml(msg)}</p>
    </div>`;
}

// ── Load full history ─────────────────────────────────────────────────────────
async function loadMessages() {
  if (!getToken()) { window.location.href = 'login.html'; return; }
  if (!otherUserId) { showError('No user specified.'); return; }

  try {
    const res = await fetch(`${API}/api/chat/${otherUserId}`, { headers: authHeaders() });
    if (res.status === 403) { showError('You are not connected with this user yet.'); return; }
    if (!res.ok) throw new Error();

    const msgs = await res.json();
    messagesEl.innerHTML = '';
    lastDate = '';

    const myEmail = getEmail();
    if (msgs.length === 0) {
      emptyState && (emptyState.style.display = 'flex');
    } else {
      emptyState && (emptyState.style.display = 'none');
      msgs.forEach(m => appendBubble(m, m.senderEmail === myEmail));
    }
    scrollBottom();
    markRead();
  } catch {
    showError('Could not load messages. Is the server running?');
  }
}

// ── Send ──────────────────────────────────────────────────────────────────────
async function sendMessage() {
  const content = messageInput.value.trim();
  if (!content || sendBtn.disabled) return;

  messageInput.value = '';
  messageInput.style.height = 'auto';
  sendBtn.disabled = true;
  emptyState && (emptyState.style.display = 'none');

  const myEmail = getEmail();
  const tempId  = 'tmp-' + Date.now();
  const tempMsg = { _id: tempId, senderEmail: myEmail, content, createdAt: new Date().toISOString(), read: false };
  appendBubble(tempMsg, true);
  const tempEl = messagesEl.querySelector(`[data-id="${tempId}"]`);
  if (tempEl) tempEl.classList.add('sending');
  scrollBottom();

  try {
    const res   = await fetch(`${API}/api/chat/${otherUserId}`, {
      method: 'POST', headers: authHeaders(), body: JSON.stringify({ content }),
    });
    const saved = await res.json();
    if (!res.ok) throw new Error(saved.error);
    if (tempEl) { tempEl.dataset.id = saved._id; tempEl.classList.remove('sending'); }
  } catch {
    if (tempEl) tempEl.classList.add('failed');
  } finally {
    sendBtn.disabled = false;
    messageInput.focus();
  }
}

// ── Polling ───────────────────────────────────────────────────────────────────
let pollTimer = null;

function stopPolling() {
  // FIX: was clearInterval(pollTimer) && (pollTimer=null)
  // clearInterval returns undefined (falsy) so pollTimer never became null
  // causing startPolling() to skip restarting after tab was re-focused
  clearInterval(pollTimer);
  pollTimer = null;                          // ← separate statement, always runs
}

function startPolling() {
  if (pollTimer) return;                     // already running
  pollTimer = setInterval(poll, 2000);       // ← 2s for snappier delivery
}

async function poll() {
  try {
    const res = await fetch(`${API}/api/chat/${otherUserId}`, { headers: authHeaders() });
    if (!res.ok) return;
    const msgs    = await res.json();
    const myEmail = getEmail();

    // Collect IDs already rendered (including temp ones)
    const existing = new Set(
      [...messagesEl.querySelectorAll('[data-id]')].map(e => e.dataset.id)
    );

    const newMsgs = msgs.filter(m => !existing.has(m._id));
    if (!newMsgs.length) return;

    emptyState && (emptyState.style.display = 'none');
    newMsgs.forEach(m => appendBubble(m, m.senderEmail === myEmail));
    scrollBottom();
    markRead();
  } catch { /* silent — server may be temporarily unreachable */ }
}

async function markRead() {
  try {
    await fetch(`${API}/api/chat/${otherUserId}/read`, {
      method: 'PATCH', headers: authHeaders(),
    });
  } catch {}
}

// ── Events ────────────────────────────────────────────────────────────────────
messageInput?.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});
messageInput?.addEventListener('input', () => {
  messageInput.style.height = 'auto';
  messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
});
sendBtn?.addEventListener('click', sendMessage);
backBtn?.addEventListener('click', () => window.history.back());

// FIX: split into two clear statements so pollTimer is always properly reset
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopPolling();   // tab hidden  → stop polling
  } else {
    startPolling();  // tab visible → restart polling
  }
});

loadMessages().then(startPolling);