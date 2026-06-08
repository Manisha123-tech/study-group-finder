// js/chat-injector.js
// Watches for connected user cards and injects a Chat button.
// Does NOT touch any existing file.

(function () {

  const API = 'http://localhost:3000';

  function getToken() {
    return localStorage.getItem('token') || '';
  }

  function getMyEmail() {
    return localStorage.getItem('email') || '';
  }

  // Fetch all accepted connections for the current user
  async function getAcceptedEmails() {
    try {
      const res = await fetch(`${API}/api/connections/my`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) return {};
      const list = await res.json();
      const myEmail = getMyEmail();
      const map = {};  // email → { status, _id, fullName }
      list.forEach(c => {
        if (c.status !== 'accepted') return;
        const otherEmail = c.fromEmail === myEmail ? c.toEmail : c.fromEmail;
        const otherName  = c.fromEmail === myEmail ? c.toName  : c.fromName;
        map[otherEmail] = { name: otherName || otherEmail };
      });
      return map;
    } catch { return {}; }
  }

  // Build the chat button element
  function makeChatBtn(userId, userName) {
    const btn = document.createElement('button');
    btn.className = 'btn-chat';
    btn.title = `Chat with ${userName}`;
    btn.setAttribute('data-chat-injected', '1');
    btn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg> Chat`;
    btn.onclick = () => {
      window.location.href =
        'chat.html?userId=' + userId +
        '&name=' + encodeURIComponent(userName);
    };
    return btn;
  }

  // Inject chat buttons into all connected cards
  async function injectChatButtons() {
    if (!getToken()) return; // not logged in

    const acceptedMap = await getAcceptedEmails();
    if (Object.keys(acceptedMap).length === 0) return;

    // Re-fetch users to get their _id (needed for chat URL)
    let userIdMap = {};
    try {
      const res = await fetch(`${API}/api/users`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const users = await res.json();
        users.forEach(u => { userIdMap[u.email] = { _id: u._id, name: u.fullName }; });
      }
    } catch {}

    document.querySelectorAll('.match-card[data-email]').forEach(card => {
      const email = card.dataset.email;
      if (!acceptedMap[email]) return;           // not connected
      if (card.querySelector('[data-chat-injected]')) return; // already added

      const userData = userIdMap[email];
      if (!userData) return;

      const connectBtn = card.querySelector('.btn-connect');
      if (connectBtn) {
        const btn = makeChatBtn(userData._id, userData.name);
        // Insert right after the connect button
        connectBtn.insertAdjacentElement('afterend', btn);
      }
    });
  }

  // Watch for cards being added to the DOM (since cards load async)
  const observer = new MutationObserver(() => {
    const cards = document.querySelectorAll('.match-card[data-email]');
    if (cards.length > 0) injectChatButtons();
  });

  document.addEventListener('DOMContentLoaded', () => {
    observer.observe(document.body, { childList: true, subtree: true });
    // Also run once immediately in case cards already exist
    injectChatButtons();
  });

})();