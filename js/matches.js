

/* ============================================================
   matches.js — Study partner match cards
   FIXES:
   - Uses localStorage.getItem('token') — consistent key
   - Filters self by email, not name+college (reliable)
   - Compatibility score capped properly per category
   ============================================================ */

const API_BASE = 'http://localhost:3000';

/* ── SAMPLE CARDS (shown before form submitted) ─────────────── */

const SAMPLE_MATCHES = [
  { name: 'Aarav Mehta',  college: 'NIT Patna',      branch: 'CSE', subject: 'Data Structures',   availability: 'Weekdays 7–9 PM',     mode: 'Online',  avatarColor: '#3b82f6' },
  { name: 'Sneha Gupta',  college: 'BIT Mesra',       branch: 'ECE', subject: 'DBMS',              availability: 'Weekends 10 AM–1 PM', mode: 'Both',    avatarColor: '#ec4899' },
  { name: 'Rohan Singh',  college: 'IIIT Allahabad',  branch: 'IT',  subject: 'Operating Systems', availability: 'Daily 6–8 AM',        mode: 'Offline', avatarColor: '#8b5cf6' },
  { name: 'Priya Sharma', college: 'MNIT Jaipur',     branch: 'CSE', subject: 'Algorithms',        availability: 'Weekdays 8–10 PM',    mode: 'Online',  avatarColor: '#f59e0b' },
  { name: 'Karan Verma',  college: 'DTU Delhi',        branch: 'CSE', subject: 'Computer Networks', availability: 'Weekends 2–5 PM',     mode: 'Both',    avatarColor: '#10b981' },
  { name: 'Ananya Patel', college: 'VIT Vellore',     branch: 'CSE', subject: 'Discrete Math',     availability: 'Daily 5–7 PM',        mode: 'Online',  avatarColor: '#ef4444' },
];

function renderMatchCards() {
  const grid = document.getElementById('matchCards');
  if (!grid) return;
  SAMPLE_MATCHES.forEach(s => grid.appendChild(buildMatchCard(s)));
}

function buildMatchCard(student) {
  const initials = student.name
    .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const card = document.createElement('div');
  card.className = 'match-card';
  card.innerHTML = `
    <div class="mc-top">
      <div class="mc-avatar" style="background:${student.avatarColor};">${initials}</div>
      <div>
        <div class="mc-name">${escapeHTML(student.name)}</div>
        <div class="mc-college">${escapeHTML(student.college)} · ${escapeHTML(student.branch)}</div>
      </div>
    </div>
    <div class="mc-detail"><strong>Subject:</strong> ${escapeHTML(student.subject)}</div>
    <div class="mc-detail"><strong>Available:</strong> ${escapeHTML(student.availability)}</div>
    <div class="mc-detail" style="margin-bottom:1.25rem;"><strong>Mode:</strong> ${escapeHTML(student.mode)}</div>
    <button class="btn btn-connect" onclick="handleConnect('${escapeHTML(student.name)}')">Connect ↗</button>
  `;
  return card;
}

function handleConnect(name) {
  alert(`✅ Connection request sent to ${name}!\n\nIn a real app, this would open a chat or send a notification.`);
}

function randomAvatarColor() {
  const colors = ['#3b82f6','#ec4899','#8b5cf6','#10b981','#f59e0b','#ef4444'];
  return colors[Math.floor(Math.random() * colors.length)];
}

/* ── API HELPERS ────────────────────────────────────────────── */

function authHeaders() {
  // FIX: use 'token' — the key saved by login.html and auth.js
  const token = localStorage.getItem('token') || '';
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

async function saveUserToDB(userData) {
  try {
    const res = await fetch(`${API_BASE}/api/users`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(userData),
    });
    if (!res.ok) {
      const err = await res.json();
      console.error('❌ Save failed:', err.error);
      return null;
    }
    const data = await res.json();
    console.log('✅ Profile saved to DB');
    return data;
  } catch (err) {
    console.error('❌ Network error saving profile:', err);
    return null;
  }
}

async function getAllUsersFromDB() {
  try {
    const res = await fetch(`${API_BASE}/api/users`, {
      headers: authHeaders(),
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error('❌ Network error fetching users:', err);
    return [];
  }
}

/* ── COMPATIBILITY SCORING ──────────────────────────────────── */
/*
   Max points per category (total = 100):
   - Semester match:  25 pts
   - Branch match:    20 pts
   - Mode compatible: 15 pts
   - Subjects shared: up to 30 pts (10 per subject, max 3 counted)
   - Availability:    10 pts
*/
function calculateCompatibility(currentUser, otherUser) {
  let score = 0;

  // Semester
  if (currentUser.semester === otherUser.semester) score += 25;

  // Branch
  if ((currentUser.branch || '').toLowerCase() === (otherUser.branch || '').toLowerCase()) score += 20;

  // Mode — compatible if same, or either chose "Both"
  const modeA = currentUser.mode || '';
  const modeB = otherUser.mode   || '';
  if (modeA === modeB || modeA === 'Both' || modeB === 'Both') score += 15;

  // Subjects — cap at 3 shared subjects, 10 pts each = max 30
  const subjectsA = currentUser.subjects || [];
  const subjectsB = otherUser.subjects   || [];
  const commonCount = Math.min(
    subjectsB.filter(s => subjectsA.includes(s)).length,
    3   // cap so subjects alone can't dominate score
  );
  score += commonCount * 10;

  // Availability — simple time-of-day match
  const avA = (currentUser.availability || '').toLowerCase();
  const avB = (otherUser.availability   || '').toLowerCase();
  const timeWords = ['morning', 'afternoon', 'evening', 'night', 'am', 'pm', 'weekend', 'weekday'];
  const sharedTime = timeWords.some(t => avA.includes(t) && avB.includes(t));
  if (sharedTime) score += 10;

  return Math.min(score, 100);
}

/* ── RENDER REAL MATCHES FROM DB ────────────────────────────── */

async function renderAdvancedMatchesFromDB(currentUser) {
  const grid = document.getElementById('matchCards');
  if (!grid) return;

  grid.innerHTML = '<p style="padding:1rem;color:var(--text-muted);">Finding your matches…</p>';

  const allUsers = await getAllUsersFromDB();

  // FIX: filter self by email, not by name+college
  const currentEmail = localStorage.getItem('email') || '';
  const others = allUsers.filter(u => u.email !== currentEmail);

  // Score, filter weak matches, sort best first
  const scored = others
    .map(u => ({ user: u, score: calculateCompatibility(currentUser, u) }))
    .filter(m => m.score >= 30)
    .sort((a, b) => b.score - a.score);

  grid.innerHTML = '';

  if (scored.length === 0) {
    grid.innerHTML = `
      <div style="text-align:center;padding:2rem;color:var(--text-muted);">
        <h3 style="color:var(--white);margin-bottom:0.5rem;">No matches yet 😔</h3>
        <p>More students need to join. Share the app with your classmates!</p>
      </div>`;
    return;
  }

  scored.forEach(({ user, score }) => {
    const initials = (user.fullName || '??')
      .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    const color = randomAvatarColor();

    const card = document.createElement('div');
    card.className = 'match-card';
    card.dataset.email = user.email;
    card.innerHTML = `
      <div class="mc-top">
        <div class="mc-avatar" style="background:${color};">${initials}</div>
        <div>
          <div class="mc-name">${escapeHTML(user.fullName)}</div>
          <div class="mc-college">${escapeHTML(user.college)} · ${escapeHTML(user.branch)}</div>
        </div>
      </div>
      <div style="margin:1rem 0;">
        <div style="display:flex;justify-content:space-between;font-size:0.85rem;font-weight:600;margin-bottom:0.4rem;">
          <span style="color:var(--text-muted);">Compatibility</span>
          <span style="color:var(--amber);">${score}%</span>
        </div>
        <div style="width:100%;height:8px;background:var(--navy-light);border-radius:999px;overflow:hidden;">
          <div style="width:${score}%;height:100%;background:linear-gradient(90deg,#3b82f6,#8b5cf6);border-radius:999px;transition:width 0.6s ease;"></div>
        </div>
      </div>
      <div class="mc-detail"><strong>Subjects:</strong> ${escapeHTML((user.subjects || []).join(', '))}</div>
      <div class="mc-detail"><strong>Available:</strong> ${escapeHTML(user.availability || '')}</div>
      <div class="mc-detail" style="margin-bottom:1.2rem;"><strong>Mode:</strong> ${escapeHTML(user.mode || '')}</div>
      <button class="btn btn-connect" onclick="sendConnectionRequest('${escapeHTML(user.email)}',this)">Connect ↗</button>
    `;
    grid.appendChild(card);
  });
  const connectionMap = await loadMyConnections();
applyConnectionStatuses(connectionMap);
}

// /* ═══════════════════════════════════════════════════════════════════
//    matches.js — Study partner match cards
//    FIXES vs original:
//    - Removed duplicate form submit listener (now in main.js only)
//    - Removed calls to getAllUsers() which was commented-out/undefined
//    - randomAvatarColor() confirmed defined here and used correctly
//    - findMatches() / findAdvancedMatches() still present but use
//      localStorage array passed in, not a missing global function
//    ═══════════════════════════════════════════════════════════════════ */

// /* ── CONFIG ─────────────────────────────────────────────────── */
// const API_BASE = 'http://localhost:3000';

// /* ── SAMPLE DATA (shown before any real users exist) ─────────── */
// const SAMPLE_MATCHES = [
//   { name: 'Aarav Mehta',   college: 'NIT Patna',       branch: 'CSE', subject: 'Data Structures',    availability: 'Weekdays 7–9 PM',     mode: 'Online',  avatarColor: '#3b82f6' },
//   { name: 'Sneha Gupta',   college: 'BIT Mesra',        branch: 'ECE', subject: 'DBMS',               availability: 'Weekends 10 AM–1 PM', mode: 'Both',    avatarColor: '#ec4899' },
//   { name: 'Rohan Singh',   college: 'IIIT Allahabad',   branch: 'IT',  subject: 'Operating Systems',  availability: 'Daily 6–8 AM',        mode: 'Offline', avatarColor: '#8b5cf6' },
//   { name: 'Priya Sharma',  college: 'MNIT Jaipur',      branch: 'CSE', subject: 'Algorithms',         availability: 'Weekdays 8–10 PM',    mode: 'Online',  avatarColor: '#f59e0b' },
//   { name: 'Karan Verma',   college: 'DTU Delhi',         branch: 'CSE', subject: 'Computer Networks',  availability: 'Weekends 2–5 PM',     mode: 'Both',    avatarColor: '#10b981' },
//   { name: 'Ananya Patel',  college: 'VIT Vellore',      branch: 'CSE', subject: 'Discrete Math',      availability: 'Daily 5–7 PM',        mode: 'Online',  avatarColor: '#ef4444' },
// ];

// /* ── RENDER SAMPLE CARDS ─────────────────────────────────────── */
// function renderMatchCards() {
//   const grid = document.getElementById('matchCards');
//   if (!grid) return;

//   SAMPLE_MATCHES.forEach(student => {
//     grid.appendChild(buildMatchCard(student));
//   });
// }

// /**
//  * Build a match card DOM element.
//  * @param {Object} student
//  * @returns {HTMLElement}
//  */
// function buildMatchCard(student) {
//   const initials = student.name
//     .split(' ')
//     .map(w => w[0])
//     .slice(0, 2)
//     .join('')
//     .toUpperCase();

//   const card = document.createElement('div');
//   card.className = 'match-card';
//   card.innerHTML = `
//     <div class="mc-top">
//       <div class="mc-avatar" style="background:${student.avatarColor};">${initials}</div>
//       <div>
//         <div class="mc-name">${escapeHTML(student.name)}</div>
//         <div class="mc-college">${escapeHTML(student.college)} · ${escapeHTML(student.branch)}</div>
//       </div>
//     </div>
//     <div class="mc-detail"><strong>Subject:</strong> ${escapeHTML(student.subject)}</div>
//     <div class="mc-subject-tag"><span class="tag">${escapeHTML(student.subject)}</span></div>
//     <div class="mc-detail"><strong>Available:</strong> ${escapeHTML(student.availability)}</div>
//     <div class="mc-detail" style="margin-bottom:1.25rem;"><strong>Mode:</strong> ${escapeHTML(student.mode)}</div>
//     <button class="btn btn-connect" onclick="handleConnect('${escapeHTML(student.name)}')">Connect ↗</button>
//   `;
//   return card;
// }

// /* ── CONNECT HANDLER ─────────────────────────────────────────── */
// function handleConnect(name) {
//   alert(`✅ Connection request sent to ${name}!\n\nIn a real app, this would open a chat or send a notification.`);
// }

// /* ── AVATAR COLOR ────────────────────────────────────────────── */
// function randomAvatarColor() {
//   const colors = ['#3b82f6','#ec4899','#8b5cf6','#10b981','#f59e0b','#ef4444'];
//   return colors[Math.floor(Math.random() * colors.length)];
// }

// /* ── DB: SAVE USER ───────────────────────────────────────────── */
// async function saveUserToDB(userData) {
//   try {
//     const token = localStorage.getItem('token') || '';
//     const res = await fetch(`${API_BASE}/api/users`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${token}`,
//       },
//       body: JSON.stringify(userData),
//     });
//     const data = await res.json();
//     console.log('✅ User saved to DB:', data);
//     return data;
//   } catch (err) {
//     console.error('❌ Failed to save user:', err);
//   }
// }

// /* ── DB: FETCH ALL USERS ─────────────────────────────────────── */
// async function getAllUsersFromDB() {
//   try {
//     const token = localStorage.getItem('token') || '';
//     const res = await fetch(`${API_BASE}/api/users`, {
//       headers: { 'Authorization': `Bearer ${token}` },
//     });
//     return await res.json();
//   } catch (err) {
//     console.error('❌ Failed to fetch users:', err);
//     return [];
//   }
// }

// /* ── COMPATIBILITY SCORE ─────────────────────────────────────── */
// function calculateCompatibility(currentUser, otherUser) {
//   let score = 0;

//   if (currentUser.semester === otherUser.semester)                            score += 30;
//   if (currentUser.branch?.toLowerCase() === otherUser.branch?.toLowerCase()) score += 20;
//   if (currentUser.mode === otherUser.mode || currentUser.mode === 'Both' || otherUser.mode === 'Both') score += 20;

//   const commonSubjects = (otherUser.subjects || []).filter(s => (currentUser.subjects || []).includes(s));
//   score += commonSubjects.length * 15;

//   const avA = (currentUser.availability || '').toLowerCase();
//   const avB = (otherUser.availability   || '').toLowerCase();
//   if (avA.includes('pm') && avB.includes('pm')) score += 15;
//   if (avA.includes('am') && avB.includes('am')) score += 15;

//   return Math.min(score, 100);
// }

// /* ── DB: RENDER ADVANCED MATCHES ─────────────────────────────── */
// async function renderAdvancedMatchesFromDB(currentUser) {
//   const grid = document.getElementById('matchCards');
//   if (!grid) return;

//   grid.innerHTML = '<p style="padding:1rem;color:var(--text-muted);">Finding your matches…</p>';

//   const allUsers = await getAllUsersFromDB();

//   // Remove self from pool
//   const others = allUsers.filter(u =>
//     u.email !== currentUser.email
//   );

//   // Score + filter
//   const scored = others
//     .map(user => ({ user, compatibility: calculateCompatibility(currentUser, user) }))
//     .filter(m => m.compatibility >= 40)
//     .sort((a, b) => b.compatibility - a.compatibility);

//   grid.innerHTML = '';

//   if (scored.length === 0) {
//     grid.innerHTML = `
//       <div class="empty-state" style="text-align:center;padding:2rem;color:var(--text-muted);">
//         <h3 style="color:var(--white);margin-bottom:0.5rem;">No strong matches yet 😔</h3>
//         <p>More students need to join first. Share the app with your classmates!</p>
//       </div>`;
//     return;
//   }

//   scored.forEach(({ user, compatibility }) => {
//     const card = document.createElement('div');
//     card.className = 'match-card';
//     const initials = (user.fullName || '??').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

//     card.innerHTML = `
//       <div class="mc-top">
//         <div class="mc-avatar" style="background:${randomAvatarColor()};">${initials}</div>
//         <div>
//           <div class="mc-name">${escapeHTML(user.fullName)}</div>
//           <div class="mc-college">${escapeHTML(user.college)} · ${escapeHTML(user.branch)}</div>
//         </div>
//       </div>
//       <div style="margin:1rem 0;">
//         <div style="display:flex;justify-content:space-between;font-weight:600;margin-bottom:0.4rem;font-size:0.85rem;">
//           <span style="color:var(--text-muted);">Compatibility</span>
//           <span style="color:var(--amber);">${compatibility}%</span>
//         </div>
//         <div style="width:100%;height:8px;background:var(--navy-light);border-radius:999px;overflow:hidden;">
//           <div style="width:${compatibility}%;height:100%;background:linear-gradient(90deg,#3b82f6,#8b5cf6);border-radius:999px;"></div>
//         </div>
//       </div>
//       <div class="mc-detail"><strong>Subjects:</strong> ${escapeHTML((user.subjects || []).join(', '))}</div>
//       <div class="mc-detail"><strong>Available:</strong> ${escapeHTML(user.availability)}</div>
//       <div class="mc-detail" style="margin-bottom:1.2rem;"><strong>Mode:</strong> ${escapeHTML(user.mode)}</div>
//       <button class="btn btn-connect" onclick="handleConnect('${escapeHTML(user.fullName)}')">Connect ↗</button>
//     `;
//     grid.appendChild(card);
//   });
// }

// // AUTO LOAD MATCHES AFTER PAGE REFRESH

// window.addEventListener('DOMContentLoaded', async () => {

//   const token = localStorage.getItem('token');

//   if (!token) return;

//   try {

//     const allUsers = await getAllUsersFromDB();

//     const currentEmail =
//       localStorage.getItem('email');

//     const currentUser =
//       allUsers.find(user =>
//         user.email === currentEmail
//       );

//     if (currentUser) {

//       renderAdvancedMatchesFromDB(
//         currentUser
//       );

//     }

//   } catch (error) {

//     console.log(error);

//   }

// });// /* ═══════════════════════════════════════════════════════════════════
// //    3. SAMPLE STUDY PARTNER MATCH CARDS
// //    ═══════════════════════════════════════════════════════════════════ */

// // // Sample data representing matched students
// // const SAMPLE_MATCHES = [
// //   {
// //     name:         'Aarav Mehta',
// //     college:      'NIT Patna',
// //     branch:       'CSE',
// //     subject:      'Data Structures',
// //     availability: 'Weekdays 7–9 PM',
// //     mode:         'Online',
// //     avatarColor:  '#3b82f6',   // blue
// //   },
// //   {
// //     name:         'Sneha Gupta',
// //     college:      'BIT Mesra',
// //     branch:       'ECE',
// //     subject:      'DBMS',
// //     availability: 'Weekends 10 AM–1 PM',
// //     mode:         'Both',
// //     avatarColor:  '#ec4899',   // pink
// //   },
// //   {
// //     name:         'Rohan Singh',
// //     college:      'IIIT Allahabad',
// //     branch:       'IT',
// //     subject:      'Operating Systems',
// //     availability: 'Daily 6–8 AM',
// //     mode:         'Offline',
// //     avatarColor:  '#8b5cf6',   // purple
// //   },
// //   {
// //     name:         'Priya Sharma',
// //     college:      'MNIT Jaipur',
// //     branch:       'CSE',
// //     subject:      'Algorithms',
// //     availability: 'Weekdays 8–10 PM',
// //     mode:         'Online',
// //     avatarColor:  '#f59e0b',   // amber
// //   },
// //   {
// //     name:         'Karan Verma',
// //     college:      'DTU Delhi',
// //     branch:       'CSE',
// //     subject:      'Computer Networks',
// //     availability: 'Weekends 2–5 PM',
// //     mode:         'Both',
// //     avatarColor:  '#10b981',   // green
// //   },
// //   {
// //     name:         'Ananya Patel',
// //     college:      'VIT Vellore',
// //     branch:       'CSE',
// //     subject:      'Discrete Math',
// //     availability: 'Daily 5–7 PM',
// //     mode:         'Online',
// //     avatarColor:  '#ef4444',   // red
// //   },
// // ];

// // function renderMatchCards() {
// //   const grid = document.getElementById('matchCards');
// //   if (!grid) return;

// //   SAMPLE_MATCHES.forEach(student => {
// //     const card = buildMatchCard(student);
// //     grid.appendChild(card);
// //   });
// // }

// // /**
// //  * Create a match card DOM element for one student.
// //  * @param {Object} student
// //  * @returns {HTMLElement}
// //  */
// // function buildMatchCard(student) {
// //   // Get initials for the avatar
// //   const initials = student.name
// //     .split(' ')
// //     .map(w => w[0])
// //     .slice(0, 2)
// //     .join('')
// //     .toUpperCase();

// //   const card = document.createElement('div');
// //   card.className = 'match-card';

// //   card.innerHTML = `
// //     <div class="mc-top">
// //       <div class="mc-avatar" style="background:${student.avatarColor};">${initials}</div>
// //       <div>
// //         <div class="mc-name">${escapeHTML(student.name)}</div>
// //         <div class="mc-college">${escapeHTML(student.college)} · ${escapeHTML(student.branch)}</div>
// //       </div>
// //     </div>
// //     <div class="mc-detail">
// //       <strong>Subject:</strong> ${escapeHTML(student.subject)}
// //     </div>
// //     <div class="mc-subject-tag">
// //       <span class="tag">${escapeHTML(student.subject)}</span>
// //     </div>
// //     <div class="mc-detail">
// //       <strong>Available:</strong> ${escapeHTML(student.availability)}
// //     </div>
// //     <div class="mc-detail" style="margin-bottom:1.25rem;">
// //       <strong>Mode:</strong> ${escapeHTML(student.mode)}
// //     </div>
// //     <button class="btn btn-connect" onclick="handleConnect('${escapeHTML(student.name)}')">
// //       Connect ↗
// //     </button>
// //   `;

// //   return card;
// // }

// // /**
// //  * Called when the "Connect" button on a match card is clicked.
// //  * In a real app this would open a chat or send a request.
// //  * @param {string} name - The matched student's name
// //  */
// // function handleConnect(name) {
// //   alert(`✅ Connection request sent to ${name}!\n\nIn a real app, this would open a chat or send a notification.`);
// // }


// // ////////////////////////////////////////

// // // function saveUserToUsersArray(userData) {

// // //   // Get existing users
// // //   let users =
// // //     JSON.parse(localStorage.getItem('studyGroupUsers'))
// // //     || [];

// // //   // Avoid duplicate users by full name + college
// // //   const alreadyExists = users.some(user =>
// // //     user.fullName === userData.fullName &&
// // //     user.college === userData.college
// // //   );

// // //   if (!alreadyExists) {

// // //     users.push(userData);

// // //     localStorage.setItem(
// // //       'studyGroupUsers',
// // //       JSON.stringify(users)
// // //     );

// // //     console.log('✅ User added to users array');

// // //   } else {

// // //     console.log('⚠ User already exists');

// // //   }
// // // }


// // // /**
// // //  * Get all stored users
// // //  */
// // // function getAllUsers() {

// // //   return JSON.parse(
// // //     localStorage.getItem('studyGroupUsers')
// // //   ) || [];
// // // }


// // /**
// //  * Find matching users
// //  */


// // // ── CONFIG — change this when you deploy ──
// // const API_BASE = 'http://localhost:3000';

// // /**
// //  * Save user to MongoDB via API
// //  */
// // async function saveUserToDB(userData) {
// //   try {
// //     const res = await fetch(`${API_BASE}/api/users`, {
// //       method: 'POST',
// //       headers: { 'Content-Type': 'application/json' },
// //       body: JSON.stringify(userData)
// //     });
// //     const data = await res.json();
// //     console.log('✅ User saved to DB:', data);
// //     return data;
// //   } catch (err) {
// //     console.error('❌ Failed to save user:', err);
// //   }
// // }

// // /**
// //  * Get all users from MongoDB via API
// //  */
// // async function getAllUsersFromDB() {
// //   try {
// //     const res = await fetch(`${API_BASE}/api/users`);
// //     return await res.json();
// //   } catch (err) {
// //     console.error('❌ Failed to fetch users:', err);
// //     return [];
// //   }
// // }

// // /**
// //  * Find + render advanced matches using real DB users
// //  */
// // async function renderAdvancedMatchesFromDB(currentUser) {
// //   const grid = document.getElementById('matchCards');
// //   if (!grid) return;

// //   grid.innerHTML = '<p style="padding:1rem;">Finding matches...</p>';

// //   const allUsers = await getAllUsersFromDB();

// //   // Remove current user from pool
// //   const others = allUsers.filter(u =>
// //     !(u.fullName === currentUser.fullName && u.college === currentUser.college)
// //   );

// //   // Score each user
// //   const scored = others
// //     .map(user => ({ user, compatibility: calculateCompatibility(currentUser, user) }))
// //     .filter(m => m.compatibility >= 40)
// //     .sort((a, b) => b.compatibility - a.compatibility);

// //   grid.innerHTML = '';

// //   if (scored.length === 0) {
// //     grid.innerHTML = `
// //       <div class="empty-state">
// //         <h3>No strong matches yet 😔</h3>
// //         <p>More students need to join first.</p>
// //       </div>`;
// //     return;
// //   }

// //   scored.forEach(({ user, compatibility }) => {
// //     // reuse your existing card building logic
// //     const card = document.createElement('div');
// //     card.className = 'match-card';
// //     const initials = user.fullName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

// //     card.innerHTML = `
// //       <div class="mc-top">
// //         <div class="mc-avatar" style="background:${randomAvatarColor()};">${initials}</div>
// //         <div>
// //           <div class="mc-name">${escapeHTML(user.fullName)}</div>
// //           <div class="mc-college">${escapeHTML(user.college)} · ${escapeHTML(user.branch)}</div>
// //         </div>
// //       </div>
// //       <div style="margin:1rem 0;">
// //         <div style="display:flex;justify-content:space-between;font-weight:600;margin-bottom:0.4rem;">
// //           <span>Compatibility</span><span>${compatibility}%</span>
// //         </div>
// //         <div style="width:100%;height:10px;background:#e5e7eb;border-radius:999px;overflow:hidden;">
// //           <div style="width:${compatibility}%;height:100%;background:linear-gradient(90deg,#3b82f6,#8b5cf6);"></div>
// //         </div>
// //       </div>
// //       <div class="mc-detail"><strong>Subjects:</strong> ${escapeHTML(user.subjects.join(', '))}</div>
// //       <div class="mc-detail"><strong>Available:</strong> ${escapeHTML(user.availability)}</div>
// //       <div class="mc-detail" style="margin-bottom:1.2rem;"><strong>Mode:</strong> ${escapeHTML(user.mode)}</div>
// //       <button class="btn btn-connect" onclick="handleConnect('${escapeHTML(user.fullName)}')">Connect ↗</button>
// //     `;
// //     grid.appendChild(card);
// //   });
// // }

// // function findMatches(currentUser) {

// //   const users = getAllUsers();

// //   // Remove current user from matching
// //   const otherUsers = users.filter(user =>
// //     !(
// //       user.fullName === currentUser.fullName &&
// //       user.college === currentUser.college
// //     )
// //   );

// //   // Match logic
// //   const matches = otherUsers.filter(user => {

// //     // Same semester
// //     const sameSemester =
// //       user.semester === currentUser.semester;

// //     // Same study mode or both
// //     const compatibleMode =
// //       user.mode === currentUser.mode ||
// //       user.mode === 'Both' ||
// //       currentUser.mode === 'Both';

// //     // At least one common subject
// //     const commonSubjects =
// //       user.subjects.some(subject =>
// //         currentUser.subjects.includes(subject)
// //       );

// //     return (
// //       sameSemester &&
// //       compatibleMode &&
// //       commonSubjects
// //     );

// //   });

// //   return matches;
// // }


// // /**
// //  * Render REAL dynamic matches
// //  */
// // function renderRealMatches(currentUser) {

// //   const grid =
// //     document.getElementById('matchCards');

// //   if (!grid) return;

// //   // Clear old cards
// //   grid.innerHTML = '';

// //   const matches = findMatches(currentUser);

// //   // No matches found
// //   if (matches.length === 0) {

// //     grid.innerHTML = `
// //       <div class="empty-state">
// //         <h3>No matches yet 😔</h3>
// //         <p>
// //           Ask more students to create profiles.
// //         </p>
// //       </div>
// //     `;

// //     return;
// //   }

// //   // Render real matches
// //   matches.forEach(user => {

// //     const card = buildMatchCard({

// //       name:
// //         user.fullName,

// //       college:
// //         user.college,

// //       branch:
// //         user.branch,

// //       subject:
// //         user.subjects[0],

// //       availability:
// //         user.availability,

// //       mode:
// //         user.mode,

// //       avatarColor:
// //         randomAvatarColor(),

// //     });

// //     grid.appendChild(card);

// //   });

// // }


// // /**
// //  * Generate random avatar color
// //  */
// // function randomAvatarColor() {

// //   const colors = [
// //     '#3b82f6',
// //     '#ec4899',
// //     '#8b5cf6',
// //     '#10b981',
// //     '#f59e0b',
// //     '#ef4444',
// //   ];

// //   return colors[
// //     Math.floor(Math.random() * colors.length)
// //   ];
// // }


// // /* ──────────────────────────────────────────────────────────────────
// //    AUTO SAVE USER + GENERATE MATCHES
// //    ────────────────────────────────────────────────────────────────── */

// // // window.addEventListener('load', () => {

// // //   const form =
// // //     document.getElementById('registerForm');

// // //   if (!form) return;

// // //   form.addEventListener('submit', () => {

// // //     setTimeout(() => {

// // //       const currentUser = {

// // //         fullName:
// // //           document.getElementById('fullName')
// // //           .value.trim(),

// // //         college:
// // //           document.getElementById('college')
// // //           .value.trim(),

// // //         branch:
// // //           document.getElementById('branch')
// // //           .value.trim(),

// // //         semester:
// // //           document.getElementById('semester')
// // //           .value,

// // //         subjects:
// // //           selectedSubjects,

// // //         availability:
// // //           document.getElementById('availability')
// // //           .value.trim(),

// // //         mode:
// // //           getSelectedRadio('mode'),
// // //       };

// // //       // Save only if valid
// // //       if (
// // //         currentUser.fullName &&
// // //         currentUser.college &&
// // //         currentUser.branch &&
// // //         currentUser.semester &&
// // //         currentUser.subjects.length > 0 &&
// // //         currentUser.availability &&
// // //         currentUser.mode
// // //       ) {

// // //         // Save user into users array
// // //         saveUserToUsersArray(currentUser);

// // //         // Generate real matches
// // //         renderRealMatches(currentUser);

// // //       }

    
// // //     }, 200);

// // //   });

// // // });

// // window.addEventListener('load', () => {

// //   const form = document.getElementById('registerForm');
// //   if (!form) return;

// //   form.addEventListener('submit', () => {

// //     setTimeout(async () => {

// //       const currentUser = {
// //         fullName:     document.getElementById('fullName').value.trim(),
// //         college:      document.getElementById('college').value.trim(),
// //         branch:       document.getElementById('branch').value.trim(),
// //         semester:     document.getElementById('semester').value,
// //         subjects:     selectedSubjects,
// //         availability: document.getElementById('availability').value.trim(),
// //         mode:         getSelectedRadio('mode'),
// //       };

// //       if (
// //         currentUser.fullName &&
// //         currentUser.college &&
// //         currentUser.branch &&
// //         currentUser.semester &&
// //         currentUser.subjects.length > 0 &&
// //         currentUser.availability &&
// //         currentUser.mode
// //       ) {
// //         await saveUserToDB(currentUser);
// //         await renderAdvancedMatchesFromDB(currentUser);
// //       }

// //     }, 300);

// //   });

// // });

// // /* ═══════════════════════════════════════════════════════════════════
// //    9. ADVANCED MATCH COMPATIBILITY SYSTEM
// //    ═══════════════════════════════════════════════════════════════════ */


// // /**
// //  * Calculate compatibility score between two users
// //  */
// // function calculateCompatibility(currentUser, otherUser) {

// //   let score = 0;

// //   // Same semester → +30
// //   if (
// //     currentUser.semester === otherUser.semester
// //   ) {
// //     score += 30;
// //   }

// //   // Same branch → +20
// //   if (
// //     currentUser.branch.toLowerCase() ===
// //     otherUser.branch.toLowerCase()
// //   ) {
// //     score += 20;
// //   }

// //   // Compatible study mode → +20
// //   if (
// //     currentUser.mode === otherUser.mode ||
// //     currentUser.mode === 'Both' ||
// //     otherUser.mode === 'Both'
// //   ) {
// //     score += 20;
// //   }

// //   // Common subjects → +15 each
// //   const commonSubjects =
// //     otherUser.subjects.filter(subject =>
// //       currentUser.subjects.includes(subject)
// //     );

// //   score += commonSubjects.length * 15;

// //   // Similar availability → +15
// //   const availabilityA =
// //     currentUser.availability.toLowerCase();

// //   const availabilityB =
// //     otherUser.availability.toLowerCase();

// //   if (
// //     availabilityA.includes('pm') &&
// //     availabilityB.includes('pm')
// //   ) {
// //     score += 15;
// //   }

// //   if (
// //     availabilityA.includes('am') &&
// //     availabilityB.includes('am')
// //   ) {
// //     score += 15;
// //   }

// //   // Maximum cap = 100
// //   if (score > 100) {
// //     score = 100;
// //   }

// //   return score;
// // }


// // /**
// //  * Find best matches sorted by compatibility
// //  */
// // function findAdvancedMatches(currentUser) {

// //   const users = getAllUsers();

// //   // Remove current user
// //   const otherUsers = users.filter(user =>
// //     !(
// //       user.fullName === currentUser.fullName &&
// //       user.college === currentUser.college
// //     )
// //   );

// //   // Build scored matches
// //   const scoredMatches = otherUsers.map(user => {

// //     const compatibility =
// //       calculateCompatibility(
// //         currentUser,
// //         user
// //       );

// //     return {
// //       user,
// //       compatibility
// //     };

// //   });

// //   // Only keep decent matches
// //   const filteredMatches =
// //     scoredMatches.filter(match =>
// //       match.compatibility >= 40
// //     );

// //   // Highest compatibility first
// //   filteredMatches.sort(
// //     (a, b) =>
// //       b.compatibility - a.compatibility
// //   );

// //   return filteredMatches;
// // }


// // /**
// //  * Render advanced compatibility match cards
// //  */
// // function renderAdvancedMatches(currentUser) {

// //   const grid =
// //     document.getElementById('matchCards');

// //   if (!grid) return;

// //   // Clear old cards
// //   grid.innerHTML = '';

// //   const matches =
// //     findAdvancedMatches(currentUser);

// //   // No matches
// //   if (matches.length === 0) {

// //     grid.innerHTML = `
// //       <div class="empty-state">
// //         <h3>No strong matches yet 😔</h3>
// //         <p>
// //           More students need to join first.
// //         </p>
// //       </div>
// //     `;

// //     return;
// //   }

// //   // Render cards
// //   matches.forEach(match => {

// //     const user = match.user;

// //     const compatibility =
// //       match.compatibility;

// //     const card =
// //       document.createElement('div');

// //     card.className = 'match-card';

// //     // Avatar initials
// //     const initials =
// //       user.fullName
// //       .split(' ')
// //       .map(w => w[0])
// //       .slice(0, 2)
// //       .join('')
// //       .toUpperCase();

// //     card.innerHTML = `

// //       <div class="mc-top">

// //         <div
// //           class="mc-avatar"
// //           style="background:${randomAvatarColor()};"
// //         >
// //           ${initials}
// //         </div>

// //         <div>
// //           <div class="mc-name">
// //             ${escapeHTML(user.fullName)}
// //           </div>

// //           <div class="mc-college">
// //             ${escapeHTML(user.college)}
// //             ·
// //             ${escapeHTML(user.branch)}
// //           </div>
// //         </div>

// //       </div>


// //       <!-- Compatibility Score -->
// //       <div
// //         style="
// //           margin:1rem 0;
// //         "
// //       >

// //         <div
// //           style="
// //             display:flex;
// //             justify-content:space-between;
// //             margin-bottom:0.4rem;
// //             font-weight:600;
// //           "
// //         >
// //           <span>Compatibility</span>
// //           <span>${compatibility}%</span>
// //         </div>

// //         <div
// //           style="
// //             width:100%;
// //             height:10px;
// //             background:#e5e7eb;
// //             border-radius:999px;
// //             overflow:hidden;
// //           "
// //         >

// //           <div
// //             style="
// //               width:${compatibility}%;
// //               height:100%;
// //               background:linear-gradient(
// //                 90deg,
// //                 #3b82f6,
// //                 #8b5cf6
// //               );
// //             "
// //           ></div>

// //         </div>

// //       </div>


// //       <div class="mc-detail">
// //         <strong>Subjects:</strong>
// //         ${escapeHTML(
// //           user.subjects.join(', ')
// //         )}
// //       </div>

// //       <div class="mc-detail">
// //         <strong>Available:</strong>
// //         ${escapeHTML(user.availability)}
// //       </div>

// //       <div
// //         class="mc-detail"
// //         style="margin-bottom:1.2rem;"
// //       >
// //         <strong>Mode:</strong>
// //         ${escapeHTML(user.mode)}
// //       </div>

// //       <button
// //         class="btn btn-connect"
// //         onclick="handleConnect('${escapeHTML(user.fullName)}')"
// //       >
// //         Connect ↗
// //       </button>

// //     `;

// //     grid.appendChild(card);

// //   });

// // }


// // /* ──────────────────────────────────────────────────────────────────
// //    AUTO GENERATE ADVANCED MATCHES
// //    ────────────────────────────────────────────────────────────────── */

// // window.addEventListener('load', () => {

// //   const form =
// //     document.getElementById('registerForm');

// //   if (!form) return;

// //   form.addEventListener('submit', () => {

// //     setTimeout(() => {

// //       const currentUser = {

// //         fullName:
// //           document.getElementById('fullName')
// //           .value.trim(),

// //         college:
// //           document.getElementById('college')
// //           .value.trim(),

// //         branch:
// //           document.getElementById('branch')
// //           .value.trim(),

// //         semester:
// //           document.getElementById('semester')
// //           .value,

// //         subjects:
// //           selectedSubjects,

// //         availability:
// //           document.getElementById('availability')
// //           .value.trim(),

// //         mode:
// //           getSelectedRadio('mode'),
// //       };

// //       // Generate advanced matches
// //       renderAdvancedMatches(currentUser);

// //     }, 300);

// //   });

// // });