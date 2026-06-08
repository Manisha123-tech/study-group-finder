

/* ═══════════════════════════════════════════════════════════════════
   groups.js — Study group cards
   Depends on: escapeHTML() from form.js (loaded before this file)
   ═══════════════════════════════════════════════════════════════════ */

const SAMPLE_GROUPS = [
  { name: 'DBMS Study Group',        icon: '🗄️', subject: 'Database Management Systems',   members: 18, topic: 'ER diagrams, SQL, Normalization, Transactions',          open: true  },
  { name: 'Operating Systems Group', icon: '⚙️', subject: 'Operating Systems',             members: 24, topic: 'Process scheduling, Memory management, Deadlocks',        open: true  },
  { name: 'Computer Networks Group', icon: '🌐', subject: 'Computer Networks',             members: 15, topic: 'OSI model, TCP/IP, Routing, Socket programming',           open: true  },
  { name: 'DSA Competitive Group',   icon: '🧩', subject: 'Data Structures & Algorithms', members: 31, topic: 'Trees, Graphs, DP, Competitive coding prep',               open: true  },
  { name: 'Algorithms Deep-Dive',    icon: '🔬', subject: 'Algorithms',                   members: 12, topic: 'Sorting, Greedy, Divide & Conquer, NP problems',           open: false },
  { name: 'Discrete Math Gang',      icon: '∑',  subject: 'Discrete Mathematics',         members: 9,  topic: 'Graph theory, Combinatorics, Logic & Proofs',              open: true  },
];

function renderGroupCards() {
  const grid = document.getElementById('groupCards');
  if (!grid) return;

  SAMPLE_GROUPS.forEach(group => {
    grid.appendChild(buildGroupCard(group));
  });
}

function buildGroupCard(group) {
  const card = document.createElement('div');
  card.className = 'group-card';

  const statusBadge = group.open
    ? `<span class="gc-members">● ${group.members} members · Open</span>`
    : `<span class="gc-members" style="color:var(--red);">● ${group.members} members · Full</span>`;

  const joinBtn = group.open
    ? `<button class="btn btn-join" onclick="handleJoin('${escapeHTML(group.name)}')">Join Group →</button>`
    : `<button class="btn btn-join" style="opacity:0.45;cursor:not-allowed;" disabled>Group Full</button>`;

  card.innerHTML = `
    <div class="gc-icon">${group.icon}</div>
    <div class="gc-name">${escapeHTML(group.name)}</div>
    <div class="gc-meta">${escapeHTML(group.topic)}</div>
    ${statusBadge}
    ${joinBtn}
  `;

  return card;
}

function handleJoin(groupName) {
  alert(`🎉 You've requested to join "${groupName}"!\n\nIn a real app, this would add you to the group chat.`);
}// const SAMPLE_GROUPS = [
//   {
//     name:    'DBMS Study Group',
//     icon:    '🗄️',
//     subject: 'Database Management Systems',
//     members: 18,
//     topic:   'ER diagrams, SQL, Normalization, Transactions',
//     open:    true,
//   },
//   {
//     name:    'Operating Systems Group',
//     icon:    '⚙️',
//     subject: 'Operating Systems',
//     members: 24,
//     topic:   'Process scheduling, Memory management, Deadlocks',
//     open:    true,
//   },
//   {
//     name:    'Computer Networks Group',
//     icon:    '🌐',
//     subject: 'Computer Networks',
//     members: 15,
//     topic:   'OSI model, TCP/IP, Routing, Socket programming',
//     open:    true,
//   },
//   {
//     name:    'DSA Competitive Group',
//     icon:    '🧩',
//     subject: 'Data Structures & Algorithms',
//     members: 31,
//     topic:   'Trees, Graphs, DP, Competitive coding prep',
//     open:    true,
//   },
//   {
//     name:    'Algorithms Deep-Dive',
//     icon:    '🔬',
//     subject: 'Algorithms',
//     members: 12,
//     topic:   'Sorting, Greedy, Divide & Conquer, NP problems',
//     open:    false,
//   },
//   {
//     name:    'Discrete Math Gang',
//     icon:    '∑',
//     subject: 'Discrete Mathematics',
//     members: 9,
//     topic:   'Graph theory, Combinatorics, Logic & Proofs',
//     open:    true,
//   },
// ];

// function renderGroupCards() {
//   const grid = document.getElementById('groupCards');
//   if (!grid) return;

//   SAMPLE_GROUPS.forEach(group => {
//     const card = buildGroupCard(group);
//     grid.appendChild(card);
//   });
// }

// /**
//  * Create a group card DOM element.
//  * @param {Object} group
//  * @returns {HTMLElement}
//  */
// function buildGroupCard(group) {
//   const card = document.createElement('div');
//   card.className = 'group-card';

//   // Show "Full" badge if the group is not open
//   const statusBadge = group.open
//     ? `<span class="gc-members">● ${group.members} members · Open</span>`
//     : `<span class="gc-members" style="color:var(--red);">● ${group.members} members · Full</span>`;

//   const joinBtn = group.open
//     ? `<button class="btn btn-join" onclick="handleJoin('${escapeHTML(group.name)}')">Join Group →</button>`
//     : `<button class="btn btn-join" style="opacity:0.45;cursor:not-allowed;" disabled>Group Full</button>`;

//   card.innerHTML = `
//     <div class="gc-icon">${group.icon}</div>
//     <div class="gc-name">${escapeHTML(group.name)}</div>
//     <div class="gc-meta">${escapeHTML(group.topic)}</div>
//     ${statusBadge}
//     ${joinBtn}
//   `;

//   return card;
// }

// /**
//  * Called when the "Join Group" button is clicked.
//  * @param {string} groupName
//  */
// function handleJoin(groupName) {
//   alert(`🎉 You've requested to join "${groupName}"!\n\nIn a real app, this would add you to the group chat.`);
// }



