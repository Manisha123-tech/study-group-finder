// js/chat-media.js — REPLACE existing file
// Now uploads files to the server so they persist across sessions.

(function () {

  const API = 'http://localhost:3000';

  const EMOJIS = {
    smileys:    ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🥸','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','😈','👿'],
    gestures:   ['👋','🤚','🖐','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','🫶','👐','🤲','🙏','✍️','💅','🤳','💪','🦵','🦶','👂','🦻','👃','👀','👁','👅','👄'],
    animals:    ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🐤','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐜','🐢','🐍','🦎','🐙','🦑','🦐','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🐊','🐅','🐆','🦓','🦍','🐘','🦛','🦏','🐪','🐫','🦒','🦘','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🐐','🦌','🐕','🐩','🐈','🐓','🦃','🦚','🦜','🦢','🦩','🕊','🐇','🦝','🐁','🐀','🐿','🦔'],
    food:       ['🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶','🧄','🧅','🥔','🍠','🥐','🥯','🍞','🥖','🥨','🧀','🥚','🍳','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🌭','🍔','🍟','🍕','🥪','🥙','🧆','🌮','🌯','🥗','🥘','🥫','🍝','🍜','🍲','🍛','🍣','🍱','🥟','🍤','🍙','🍚','🍘','🍥','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🍩','🍪','🌰','🥜','🍯','🧃','🥤','🧋','☕','🍵','🍶','🍺','🍻','🥂','🍷','🥃','🍸','🍹','🧉','🍾'],
    activities: ['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🪀','🏓','🏸','🏒','🥍','🏑','⛳','🏹','🎣','🤿','🥊','🥋','🎽','🛹','🛼','🛷','⛸','🥌','🎿','⛷','🏂','🪂','🏋️','🤸','⛹️','🤺','🤾','🏌️','🏇','🧘','🏄','🏊','🤽','🚣','🧗','🚵','🚴','🏆','🥇','🥈','🥉','🏅','🎖','🏵','🎗','🎫','🎟','🎪','🤹','🎭','🩰','🎨','🎬','🎤','🎧','🎼','🎵','🎶','🥁','🪘','🎷','🎺','🎸','🪗','🎻','🎹','🪅','🎲','♟','🎮','🎳'],
    travel:     ['🚗','🚕','🚙','🚌','🚎','🏎','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🚜','🏍','🛵','🛺','🚲','🛴','🛹','🛼','🚏','⛽','🛞','🚨','🚥','🚦','🛑','🚧','⚓','🛟','⛵','🚤','🛥','🛳','⛴','🚢','✈️','🛩','🛫','🛬','🪂','💺','🚁','🚟','🚠','🚡','🛰','🚀','🛸','🪐','🌍','🌎','🌏','🌐','🗺','🧭','🏔','⛰','🌋','🗻','🏕','🏖','🏜','🏝','🏞','🏟','🏛','🏗','🛖','🏘','🏚','🏠','🏡','🏢','🏣','🏤','🏥','🏦','🏨','🏩','🏪','🏫','🏬','🏭','🏯','🏰','💒','🗼','🗽','⛪','🕌','🛕','🕍','⛩','🕋'],
    objects:    ['⌚','📱','📲','💻','⌨️','🖥','🖨','🖱','🖲','🕹','🗜','💽','💾','💿','📀','📼','📷','📸','📹','🎥','📽','🎞','📞','☎️','📟','📠','📺','📻','🧭','⏱','⏲','⏰','🕰','⌛','⏳','📡','🔋','🔌','💡','🔦','🕯','🧯','🛢','💰','💴','💵','💶','💷','💎','⚖️','🪜','🧲','🔧','🔨','⚒','🛠','⛏','🪚','🔩','🪛','🔗','⛓','🪝','🧱','🪞','🪟','🛋','🪑','🚽','🚿','🛁','🧴','🧷','🧹','🧺','🧻','🧼','🪥','🧽','🪣','🛒','🚪','🏮','🪔','📦','📫','📪','📬','📭','📮','🗳','✏️','✒️','🖊','🖋','📝','📁','📂','🗂','📅','📆','🗒','🗓','📇','📈','📉','📊','📋','📌','📍','✂️','🖇','📎','🗃','🗄','🗑','🔒','🔓','🔏','🔐','🔑','🗝','🪤','🔨','⛏','⚒','🛠','🗡','⚔️','🛡','🔫','🪃','🏹','🪚','🔧','🪛','🔩','🗜','⚙️','🪤','🧰','🪝','🧲','🪜','🧪','🧫','🧬','🔬','🔭','📡','💉','🩸','💊','🩹','🩺','🚪','🛏','🛋','🪑','🚽','🪠','🚿','🛁','🪤','🧴','🧷','🧹','🧺','🧻','🪣','🧼','🫧','🪥','🧽','🧯','🛒'],
    symbols:    ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉','✡️','🔯','☯️','☦️','🛐','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','🆔','⚛️','☢️','☣️','📴','📳','🈶','🈚','🈸','🈺','🈷️','✴️','🆚','🉑','🉐','㊙️','㊗️','🈴','🈵','🈹','🈲','🅰️','🅱️','🆎','🆑','🅾️','🆘','❌','⭕','🛑','⛔','📛','🚫','💯','💢','♨️','🚷','🚯','🚳','🚱','🔞','📵','🚭','❗','❕','❓','❔','‼️','⁉️','🔅','🔆','🔱','⚜️','🔰','♻️','✅','💹','❎','🌐','💠','Ⓜ️','🌀','💤','🏧','🚾','♿','🅿️','🈳','🈹','🚺','🚹','🚼','⚧','🚻','🚮','🎦','📶','🈁','ℹ️','🆖','🆗','🆙','🆒','🆕','🆓','0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟','🔢','#️⃣','*️⃣','⏏️','▶️','⏸','⏹','⏺','⏭','⏮','⏩','⏪','⏫','⏬','◀️','🔼','🔽','➡️','⬅️','⬆️','⬇️','↗️','↘️','↙️','↖️','↕️','↔️','↪️','↩️','⤴️','⤵️','🔀','🔁','🔂','➕','➖','➗','✖️','♾','💲','💱','™️','©️','®️','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','🟤','🔺','🔻','🔸','🔹','🔶','🔷','🔳','🔲','▪️','▫️','◾','◽','◼️','◻️','🟥','🟧','🟨','🟩','🟦','🟪','⬛','⬜','🟫','🔈','🔇','🔉','🔊','🔔','🔕','📣','📢','💬','💭','🗯','♠️','♣️','♥️','♦️','🃏','🎴','🀄'],
  };

  // ── DOM refs ───────────────────────────────────────────────────────────────
  const emojiPanel      = document.getElementById('emoji-panel');
  const emojiGrid       = document.getElementById('emoji-grid');
  const emojiToggleBtn  = document.getElementById('emoji-toggle-btn');
  const attachMenu      = document.getElementById('attach-menu');
  const attachToggleBtn = document.getElementById('attach-toggle-btn');
  const attachImageBtn  = document.getElementById('attach-image-btn');
  const attachDocBtn    = document.getElementById('attach-doc-btn');
  const fileImageInput  = document.getElementById('file-image-input');
  const fileDocInput    = document.getElementById('file-doc-input');
  const chatInput       = document.getElementById('chat-input');
  const messagesEl      = document.getElementById('chat-messages');
  const emptyState      = document.getElementById('chat-empty');

  if (!emojiPanel || !chatInput) return;

  function getToken()  { return localStorage.getItem('token') || ''; }

  // Read userId from URL
  const otherUserId = new URLSearchParams(window.location.search).get('userId');

  // ── Emoji rendering ────────────────────────────────────────────────────────
  let activeCategory = 'smileys';

  function renderEmojiCategory(cat) {
    emojiGrid.innerHTML = '';
    (EMOJIS[cat] || []).forEach(em => {
      const btn = document.createElement('button');
      btn.className = 'emoji-btn';
      btn.textContent = em;
      btn.type = 'button';
      btn.onclick = () => {
        const s = chatInput.selectionStart, e = chatInput.selectionEnd;
        chatInput.value = chatInput.value.slice(0,s) + em + chatInput.value.slice(e);
        chatInput.selectionStart = chatInput.selectionEnd = s + em.length;
        chatInput.focus();
        chatInput.dispatchEvent(new Event('input'));
      };
      emojiGrid.appendChild(btn);
    });
  }

  document.querySelectorAll('.emoji-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.emoji-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeCategory = tab.dataset.cat;
      renderEmojiCategory(activeCategory);
    });
  });

  // ── Toggle panels ──────────────────────────────────────────────────────────
  function closeAll() {
    emojiPanel.hidden = true;
    attachMenu.hidden = true;
    emojiToggleBtn.classList.remove('active');
    attachToggleBtn.classList.remove('active');
  }

  emojiToggleBtn.addEventListener('click', e => {
    e.stopPropagation();
    const wasOpen = !emojiPanel.hidden;
    closeAll();
    if (!wasOpen) { emojiPanel.hidden = false; emojiToggleBtn.classList.add('active'); renderEmojiCategory(activeCategory); }
  });

  attachToggleBtn.addEventListener('click', e => {
    e.stopPropagation();
    const wasOpen = !attachMenu.hidden;
    closeAll();
    if (!wasOpen) { attachMenu.hidden = false; attachToggleBtn.classList.add('active'); }
  });

  document.addEventListener('click', e => {
    if (!emojiPanel.contains(e.target) && e.target !== emojiToggleBtn &&
        !attachMenu.contains(e.target) && e.target !== attachToggleBtn) closeAll();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAll(); });
  chatInput.addEventListener('keydown', () => { if (!emojiPanel.hidden) closeAll(); });

  // ── Upload file to server ──────────────────────────────────────────────────
  async function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    // Show uploading indicator
    const tempWrap = document.createElement('div');
    tempWrap.className = 'chat-bubble-wrap mine';
    tempWrap.innerHTML = `<div class="chat-bubble"><div class="bubble-text" style="opacity:.5;font-size:0.82rem;padding:10px 14px;">
      Uploading ${file.name}…</div></div>`;
    messagesEl.appendChild(tempWrap);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    emptyState && (emptyState.style.display = 'none');

    try {
      const res  = await fetch(`${API}/api/chat/${otherUserId}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      const saved = await res.json();
      if (!res.ok) throw new Error(saved.error || 'Upload failed');

      // Replace temp with real bubble
      const realBubble = buildFileBubble(saved, true);
      tempWrap.replaceWith(realBubble);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    } catch (err) {
      tempWrap.querySelector('.bubble-text').textContent = '⚠ Upload failed: ' + err.message;
      tempWrap.querySelector('.bubble-text').style.opacity = '1';
    }
  }

  // ── Build file/image bubble from a saved message object ────────────────────
  // This is also exported so chat.js can call it when rendering history
  window.buildFileBubble = function(msg, isMine) {
    const wrap = document.createElement('div');
    wrap.className = `chat-bubble-wrap ${isMine ? 'mine' : 'theirs'}`;
    wrap.dataset.id = msg._id;

    const inner = document.createElement('div');
    inner.className = 'chat-bubble';

    const fileUrl = API + msg.fileUrl;
    const time    = new Date(msg.createdAt).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });

    if (msg.type === 'image') {
      inner.innerHTML = `
        <div class="img-bubble">
          <img src="${fileUrl}" alt="${msg.fileName}" loading="lazy"/>
        </div>
        <div class="bubble-meta ${isMine ? '' : ''}">
          <span class="bubble-time">${time}</span>
          ${isMine ? '<span class="bubble-tick">✓</span>' : ''}
        </div>`;
      const img = inner.querySelector('img');
      img.onclick = () => {
        const lb = document.createElement('div');
        lb.className = 'chat-lightbox';
        lb.innerHTML = `<img src="${fileUrl}" alt="Preview"/>`;
        lb.onclick = () => lb.remove();
        document.body.appendChild(lb);
      };
    } else {
      const size = formatBytes(msg.fileSize || 0);
      inner.innerHTML = `
        <div class="file-bubble">
          <div class="file-bubble-icon">${getFileIcon(msg.fileName)}</div>
          <div class="file-bubble-info">
            <div class="file-bubble-name">${msg.fileName}</div>
            <div class="file-bubble-size">${size}</div>
          </div>
          <a class="file-bubble-dl" href="${fileUrl}" download="${msg.fileName}" target="_blank" title="Download">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </a>
        </div>
        <div class="bubble-meta" style="${isMine ? 'justify-content:flex-end' : ''}">
          <span class="bubble-time">${time}</span>
          ${isMine ? '<span class="bubble-tick">✓</span>' : ''}
        </div>`;
    }

    wrap.appendChild(inner);
    return wrap;
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  function formatBytes(b) {
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b/1024).toFixed(1) + ' KB';
    return (b/1048576).toFixed(1) + ' MB';
  }

  function getFileIcon(name) {
    const ext = (name || '').split('.').pop().toLowerCase();
    if (ext === 'pdf')                       return '📄';
    if (['doc','docx'].includes(ext))        return '📝';
    if (['xls','xlsx'].includes(ext))        return '📊';
    if (['ppt','pptx'].includes(ext))        return '📋';
    if (['txt','md'].includes(ext))          return '📃';
    return '📎';
  }

  // ── File input triggers ────────────────────────────────────────────────────
  attachImageBtn.addEventListener('click', () => { closeAll(); fileImageInput.click(); });
  attachDocBtn.addEventListener('click',   () => { closeAll(); fileDocInput.click(); });

  fileImageInput.addEventListener('change', () => {
    const file = fileImageInput.files[0];
    if (file) uploadFile(file);
    fileImageInput.value = '';
  });

  fileDocInput.addEventListener('change', () => {
    const file = fileDocInput.files[0];
    if (file) uploadFile(file);
    fileDocInput.value = '';
  });

})();