/**
 * script.js — Study Group Finder
 * ─────────────────────────────────────────────────────────────────────
 * Responsibilities:
 *  1. Render subject-selection chips in the registration form
 *  2. Validate the form on submit and show errors
 *  3. Display a dynamic profile card from form data
 *  4. Render sample "Study Partner Match" cards
 *  5. Render sample "Study Group" cards
 *  6. Mobile hamburger menu toggle
 *  7. Active nav-link highlight on scroll
 * ─────────────────────────────────────────────────────────────────────
 */

// ── Wait until the DOM is fully loaded before running any code ──────
document.addEventListener('DOMContentLoaded', () => {

  // Entry point — call each initialiser in order
  initSubjectChips();
  initFormValidation();
  renderMatchCards();
  renderGroupCards();
  initHamburger();
  initActiveNavLinks();

});


/* ═══════════════════════════════════════════════════════════════════
   1. SUBJECT CHIPS
   Renders a list of clickable chips for selecting multiple subjects.
   ═══════════════════════════════════════════════════════════════════ */

// All subjects a student can choose from
const SUBJECTS = [
  'Data Structures', 'Algorithms', 'Operating Systems',
  'DBMS', 'Computer Networks', 'OOP', 'TOC',
  'Discrete Math', 'Digital Electronics', 'Microprocessors',
];

// Track which subjects the user has selected
let selectedSubjects = [];

function initSubjectChips() {
  const container = document.getElementById('subjectChips');
  if (!container) return;

  SUBJECTS.forEach(subject => {
    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.textContent = subject;
    chip.dataset.subject = subject;

    // Toggle selection when a chip is clicked
    chip.addEventListener('click', () => toggleChip(chip, subject));

    container.appendChild(chip);
  });
}

/**
 * Toggle a chip's selected state and update selectedSubjects array.
 * @param {HTMLElement} chip     - The chip element clicked
 * @param {string}      subject  - The subject string it represents
 */
function toggleChip(chip, subject) {
  const idx = selectedSubjects.indexOf(subject);

  if (idx === -1) {
    // Not selected → select it
    selectedSubjects.push(subject);
    chip.classList.add('selected');
  } else {
    // Already selected → deselect it
    selectedSubjects.splice(idx, 1);
    chip.classList.remove('selected');
  }
}


/* ═══════════════════════════════════════════════════════════════════
   2. FORM VALIDATION & PROFILE CARD DISPLAY
   ═══════════════════════════════════════════════════════════════════ */

function initFormValidation() {
  const form = document.getElementById('registerForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault(); // Prevent default page reload

    // Clear all previous errors before re-validating
    clearAllErrors();

    // Collect values from form fields
    const data = {
      fullName:     document.getElementById('fullName').value.trim(),
      college:      document.getElementById('college').value.trim(),
      branch:       document.getElementById('branch').value.trim(),
      semester:     document.getElementById('semester').value,
      subjects:     selectedSubjects,
      availability: document.getElementById('availability').value.trim(),
      mode:         getSelectedRadio('mode'),
    };

    // Validate; if any field fails, stop and show errors
    const isValid = validateForm(data);
    if (!isValid) return;

    // ✅ All valid — render the profile card and scroll to it
    displayProfileCard(data);

    const preview = document.getElementById('profilePreview');
    preview.style.display = 'block';
    preview.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

/**
 * Run all validation rules.
 * Returns true if everything passes, false otherwise.
 * @param {Object} data - The collected form values
 */
function validateForm(data) {
  let valid = true;

  if (!data.fullName) {
    showError('err-fullName', 'fullName', 'Please enter your full name.');
    valid = false;
  }
  if (!data.college) {
    showError('err-college', 'college', 'Please enter your college name.');
    valid = false;
  }
  if (!data.branch) {
    showError('err-branch', 'branch', 'Please enter your branch.');
    valid = false;
  }
  if (!data.semester) {
    showError('err-semester', 'semester', 'Please select your semester.');
    valid = false;
  }
  if (data.subjects.length === 0) {
    // Chips have no id, so we mark the container instead
    document.getElementById('subjectChips').classList.add('invalid');
    document.getElementById('err-subjects').textContent = 'Select at least one subject.';
    valid = false;
  }
  if (!data.availability) {
    showError('err-availability', 'availability', 'Please mention your availability.');
    valid = false;
  }
  if (!data.mode) {
    document.getElementById('err-mode').textContent = 'Please choose a study mode.';
    valid = false;
  }

  return valid;
}

/**
 * Show an error message and mark the input as invalid.
 * @param {string} errId   - ID of the <span> error element
 * @param {string} inputId - ID of the <input> or <select>
 * @param {string} message - Error text to display
 */
function showError(errId, inputId, message) {
  document.getElementById(errId).textContent = message;
  const input = document.getElementById(inputId);
  if (input) input.classList.add('invalid');
}

/** Remove all error highlights and messages */
function clearAllErrors() {
  document.querySelectorAll('.error-msg').forEach(el => el.textContent = '');
  document.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
}

/**
 * Get the value of the checked radio in a named group.
 * Returns '' if nothing is selected.
 * @param {string} name - The radio group name
 */
function getSelectedRadio(name) {
  const checked = document.querySelector(`input[name="${name}"]:checked`);
  return checked ? checked.value : '';
}

/**
 * Build and insert a profile card from submitted data.
 * @param {Object} data - The validated form data
 */
function displayProfileCard(data) {
  const card = document.getElementById('profileCard');
  if (!card) return;

  // Build initials for the avatar (up to 2 characters)
  const initials = data.fullName
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Build subject tag HTML
  const subjectTags = data.subjects
    .map(s => `<span class="tag">${s}</span>`)
    .join('');

  // Inject all fields as HTML
  card.innerHTML = `
    <div class="pc-header">
      <div class="pc-avatar">${initials}</div>
      <div>
        <div class="pc-name">${escapeHTML(data.fullName)}</div>
        <div class="pc-college">${escapeHTML(data.college)}</div>
      </div>
    </div>
    <div class="pc-body">
      <div class="pc-field">
        <label>Branch</label>
        <p>${escapeHTML(data.branch)}</p>
      </div>
      <div class="pc-field">
        <label>Semester</label>
        <p>${escapeHTML(data.semester)}</p>
      </div>
      <div class="pc-field">
        <label>Availability</label>
        <p>${escapeHTML(data.availability)}</p>
      </div>
      <div class="pc-field">
        <label>Study Mode</label>
        <p>${escapeHTML(data.mode)}</p>
      </div>
      <div class="pc-field" style="grid-column: 1 / -1;">
        <label>Subjects</label>
        <div class="pc-subjects">${subjectTags}</div>
      </div>
    </div>
  `;
}

/**
 * Escape special HTML characters to prevent XSS when inserting user input.
 * @param {string} str
 * @returns {string}
 */
function escapeHTML(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}


/* ═══════════════════════════════════════════════════════════════════
   3. SAMPLE STUDY PARTNER MATCH CARDS
   ═══════════════════════════════════════════════════════════════════ */

// Sample data representing matched students
const SAMPLE_MATCHES = [
  {
    name:         'Aarav Mehta',
    college:      'NIT Patna',
    branch:       'CSE',
    subject:      'Data Structures',
    availability: 'Weekdays 7–9 PM',
    mode:         'Online',
    avatarColor:  '#3b82f6',   // blue
  },
  {
    name:         'Sneha Gupta',
    college:      'BIT Mesra',
    branch:       'ECE',
    subject:      'DBMS',
    availability: 'Weekends 10 AM–1 PM',
    mode:         'Both',
    avatarColor:  '#ec4899',   // pink
  },
  {
    name:         'Rohan Singh',
    college:      'IIIT Allahabad',
    branch:       'IT',
    subject:      'Operating Systems',
    availability: 'Daily 6–8 AM',
    mode:         'Offline',
    avatarColor:  '#8b5cf6',   // purple
  },
  {
    name:         'Priya Sharma',
    college:      'MNIT Jaipur',
    branch:       'CSE',
    subject:      'Algorithms',
    availability: 'Weekdays 8–10 PM',
    mode:         'Online',
    avatarColor:  '#f59e0b',   // amber
  },
  {
    name:         'Karan Verma',
    college:      'DTU Delhi',
    branch:       'CSE',
    subject:      'Computer Networks',
    availability: 'Weekends 2–5 PM',
    mode:         'Both',
    avatarColor:  '#10b981',   // green
  },
  {
    name:         'Ananya Patel',
    college:      'VIT Vellore',
    branch:       'CSE',
    subject:      'Discrete Math',
    availability: 'Daily 5–7 PM',
    mode:         'Online',
    avatarColor:  '#ef4444',   // red
  },
];

function renderMatchCards() {
  const grid = document.getElementById('matchCards');
  if (!grid) return;

  SAMPLE_MATCHES.forEach(student => {
    const card = buildMatchCard(student);
    grid.appendChild(card);
  });
}

/**
 * Create a match card DOM element for one student.
 * @param {Object} student
 * @returns {HTMLElement}
 */
function buildMatchCard(student) {
  // Get initials for the avatar
  const initials = student.name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

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
    <div class="mc-detail">
      <strong>Subject:</strong> ${escapeHTML(student.subject)}
    </div>
    <div class="mc-subject-tag">
      <span class="tag">${escapeHTML(student.subject)}</span>
    </div>
    <div class="mc-detail">
      <strong>Available:</strong> ${escapeHTML(student.availability)}
    </div>
    <div class="mc-detail" style="margin-bottom:1.25rem;">
      <strong>Mode:</strong> ${escapeHTML(student.mode)}
    </div>
    <button class="btn btn-connect" onclick="handleConnect('${escapeHTML(student.name)}')">
      Connect ↗
    </button>
  `;

  return card;
}

/**
 * Called when the "Connect" button on a match card is clicked.
 * In a real app this would open a chat or send a request.
 * @param {string} name - The matched student's name
 */
function handleConnect(name) {
  alert(`✅ Connection request sent to ${name}!\n\nIn a real app, this would open a chat or send a notification.`);
}


/* ═══════════════════════════════════════════════════════════════════
   4. SAMPLE STUDY GROUP CARDS
   ═══════════════════════════════════════════════════════════════════ */

const SAMPLE_GROUPS = [
  {
    name:    'DBMS Study Group',
    icon:    '🗄️',
    subject: 'Database Management Systems',
    members: 18,
    topic:   'ER diagrams, SQL, Normalization, Transactions',
    open:    true,
  },
  {
    name:    'Operating Systems Group',
    icon:    '⚙️',
    subject: 'Operating Systems',
    members: 24,
    topic:   'Process scheduling, Memory management, Deadlocks',
    open:    true,
  },
  {
    name:    'Computer Networks Group',
    icon:    '🌐',
    subject: 'Computer Networks',
    members: 15,
    topic:   'OSI model, TCP/IP, Routing, Socket programming',
    open:    true,
  },
  {
    name:    'DSA Competitive Group',
    icon:    '🧩',
    subject: 'Data Structures & Algorithms',
    members: 31,
    topic:   'Trees, Graphs, DP, Competitive coding prep',
    open:    true,
  },
  {
    name:    'Algorithms Deep-Dive',
    icon:    '🔬',
    subject: 'Algorithms',
    members: 12,
    topic:   'Sorting, Greedy, Divide & Conquer, NP problems',
    open:    false,
  },
  {
    name:    'Discrete Math Gang',
    icon:    '∑',
    subject: 'Discrete Mathematics',
    members: 9,
    topic:   'Graph theory, Combinatorics, Logic & Proofs',
    open:    true,
  },
];

function renderGroupCards() {
  const grid = document.getElementById('groupCards');
  if (!grid) return;

  SAMPLE_GROUPS.forEach(group => {
    const card = buildGroupCard(group);
    grid.appendChild(card);
  });
}

/**
 * Create a group card DOM element.
 * @param {Object} group
 * @returns {HTMLElement}
 */
function buildGroupCard(group) {
  const card = document.createElement('div');
  card.className = 'group-card';

  // Show "Full" badge if the group is not open
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

/**
 * Called when the "Join Group" button is clicked.
 * @param {string} groupName
 */
function handleJoin(groupName) {
  alert(`🎉 You've requested to join "${groupName}"!\n\nIn a real app, this would add you to the group chat.`);
}


/* ═══════════════════════════════════════════════════════════════════
   5. HAMBURGER MENU (Mobile)
   ═══════════════════════════════════════════════════════════════════ */

function initHamburger() {
  const btn   = document.getElementById('hamburger');
  const links = document.getElementById('navLinks');
  if (!btn || !links) return;

  // Toggle open/close on click
  btn.addEventListener('click', () => {
    links.classList.toggle('open');

    // Animate hamburger lines into an × shape
    btn.classList.toggle('active');
  });

  // Close menu when any nav link is clicked (for single-page navigation)
  links.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      links.classList.remove('open');
      btn.classList.remove('active');
    });
  });
}


/* ═══════════════════════════════════════════════════════════════════
   6. ACTIVE NAV LINK on scroll
   Highlights the nav link whose section is currently in view.
   ═══════════════════════════════════════════════════════════════════ */

function initActiveNavLinks() {
  const sections = document.querySelectorAll('section[id], header[id]');
  const navLinks  = document.querySelectorAll('.nav-link');

  // Build a map: section id → nav link element
  const linkMap = {};
  navLinks.forEach(link => {
    // href="#find-groups" → key is "find-groups"
    const id = link.getAttribute('href').replace('#', '');
    linkMap[id] = link;
  });

  // Use IntersectionObserver to detect which section is in view
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Remove active from all links
        navLinks.forEach(l => l.classList.remove('active'));

        // Add active to the matching link (if it exists in the nav)
        const id = entry.target.getAttribute('id');
        if (linkMap[id]) linkMap[id].classList.add('active');
      }
    });
  }, {
    rootMargin: '-40% 0px -55% 0px', // Trigger when section is ~centre of viewport
  });

  sections.forEach(section => observer.observe(section));
}
  /* ═══════════════════════════════════════════════════════════════════
   7. LOCAL STORAGE SUPPORT
   Save and restore user profile automatically
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Save profile data in browser localStorage
 * @param {Object} data
 */
function saveProfile(data) {
  localStorage.setItem(
    'studyGroupProfile',
    JSON.stringify(data)
  );
}

/**
 * Load saved profile when page opens
 */
function restoreSavedProfile() {

  // Get stored profile
  const saved = localStorage.getItem('studyGroupProfile');

  // Stop if nothing exists
  if (!saved) return;

  // Convert string → object
  const data = JSON.parse(saved);

  // Restore selected subjects array
  selectedSubjects = data.subjects || [];

  // Restore form values
  document.getElementById('fullName').value =
    data.fullName || '';

  document.getElementById('college').value =
    data.college || '';

  document.getElementById('branch').value =
    data.branch || '';

  document.getElementById('semester').value =
    data.semester || '';

  document.getElementById('availability').value =
    data.availability || '';

  // Restore radio button
  if (data.mode) {
    const radio = document.querySelector(
      `input[name="mode"][value="${data.mode}"]`
    );

    if (radio) radio.checked = true;
  }

  // Restore chip selection visually
  document.querySelectorAll('.chip').forEach(chip => {

    const subject = chip.dataset.subject;

    if (selectedSubjects.includes(subject)) {
      chip.classList.add('selected');
    }
  });

  // Show profile card again
  displayProfileCard(data);

  // Show preview section
  document.getElementById('profilePreview').style.display = 'block';
}


/* ──────────────────────────────────────────────────────────────────
   AUTO SAVE PROFILE AFTER FORM SUBMIT
   ────────────────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {

  // Restore old profile immediately
  restoreSavedProfile();

  // Listen for form submit
  const form = document.getElementById('registerForm');

  if (!form) return;

  form.addEventListener('submit', () => {

    // Delay slightly so existing validation code finishes first
    setTimeout(() => {

      // Collect latest form data
      const data = {
        fullName:
          document.getElementById('fullName').value.trim(),

        college:
          document.getElementById('college').value.trim(),

        branch:
          document.getElementById('branch').value.trim(),

        semester:
          document.getElementById('semester').value,

        subjects:
          selectedSubjects,

        availability:
          document.getElementById('availability').value.trim(),

        mode:
          getSelectedRadio('mode'),
      };

      // Save only if required fields exist
      if (
        data.fullName &&
        data.college &&
        data.branch &&
        data.semester &&
        data.subjects.length > 0 &&
        data.availability &&
        data.mode
      ) {
        saveProfile(data);
      }

    }, 100);

  });

});


/* ═══════════════════════════════════════════════════════════════════
   8. MULTI-USER STORAGE + REAL MATCHING SYSTEM
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Save current user into a users array
 */
function saveUserToUsersArray(userData) {

  // Get existing users
  let users =
    JSON.parse(localStorage.getItem('studyGroupUsers'))
    || [];

  // Avoid duplicate users by full name + college
  const alreadyExists = users.some(user =>
    user.fullName === userData.fullName &&
    user.college === userData.college
  );

  if (!alreadyExists) {

    users.push(userData);

    localStorage.setItem(
      'studyGroupUsers',
      JSON.stringify(users)
    );

    console.log('✅ User added to users array');

  } else {

    console.log('⚠ User already exists');

  }
}


/**
 * Get all stored users
 */
function getAllUsers() {

  return JSON.parse(
    localStorage.getItem('studyGroupUsers')
  ) || [];
}


/**
 * Find matching users
 */
function findMatches(currentUser) {

  const users = getAllUsers();

  // Remove current user from matching
  const otherUsers = users.filter(user =>
    !(
      user.fullName === currentUser.fullName &&
      user.college === currentUser.college
    )
  );

  // Match logic
  const matches = otherUsers.filter(user => {

    // Same semester
    const sameSemester =
      user.semester === currentUser.semester;

    // Same study mode or both
    const compatibleMode =
      user.mode === currentUser.mode ||
      user.mode === 'Both' ||
      currentUser.mode === 'Both';

    // At least one common subject
    const commonSubjects =
      user.subjects.some(subject =>
        currentUser.subjects.includes(subject)
      );

    return (
      sameSemester &&
      compatibleMode &&
      commonSubjects
    );

  });

  return matches;
}


/**
 * Render REAL dynamic matches
 */
function renderRealMatches(currentUser) {

  const grid =
    document.getElementById('matchCards');

  if (!grid) return;

  // Clear old cards
  grid.innerHTML = '';

  const matches = findMatches(currentUser);

  // No matches found
  if (matches.length === 0) {

    grid.innerHTML = `
      <div class="empty-state">
        <h3>No matches yet 😔</h3>
        <p>
          Ask more students to create profiles.
        </p>
      </div>
    `;

    return;
  }

  // Render real matches
  matches.forEach(user => {

    const card = buildMatchCard({

      name:
        user.fullName,

      college:
        user.college,

      branch:
        user.branch,

      subject:
        user.subjects[0],

      availability:
        user.availability,

      mode:
        user.mode,

      avatarColor:
        randomAvatarColor(),

    });

    grid.appendChild(card);

  });

}


/**
 * Generate random avatar color
 */
function randomAvatarColor() {

  const colors = [
    '#3b82f6',
    '#ec4899',
    '#8b5cf6',
    '#10b981',
    '#f59e0b',
    '#ef4444',
  ];

  return colors[
    Math.floor(Math.random() * colors.length)
  ];
}


/* ──────────────────────────────────────────────────────────────────
   AUTO SAVE USER + GENERATE MATCHES
   ────────────────────────────────────────────────────────────────── */

window.addEventListener('load', () => {

  const form =
    document.getElementById('registerForm');

  if (!form) return;

  form.addEventListener('submit', () => {

    setTimeout(() => {

      const currentUser = {

        fullName:
          document.getElementById('fullName')
          .value.trim(),

        college:
          document.getElementById('college')
          .value.trim(),

        branch:
          document.getElementById('branch')
          .value.trim(),

        semester:
          document.getElementById('semester')
          .value,

        subjects:
          selectedSubjects,

        availability:
          document.getElementById('availability')
          .value.trim(),

        mode:
          getSelectedRadio('mode'),
      };

      // Save only if valid
      if (
        currentUser.fullName &&
        currentUser.college &&
        currentUser.branch &&
        currentUser.semester &&
        currentUser.subjects.length > 0 &&
        currentUser.availability &&
        currentUser.mode
      ) {

        // Save user into users array
        saveUserToUsersArray(currentUser);

        // Generate real matches
        renderRealMatches(currentUser);

      }

    }, 200);

  });

});

/* ═══════════════════════════════════════════════════════════════════
   9. ADVANCED MATCH COMPATIBILITY SYSTEM
   ═══════════════════════════════════════════════════════════════════ */


/**
 * Calculate compatibility score between two users
 */
function calculateCompatibility(currentUser, otherUser) {

  let score = 0;

  // Same semester → +30
  if (
    currentUser.semester === otherUser.semester
  ) {
    score += 30;
  }

  // Same branch → +20
  if (
    currentUser.branch.toLowerCase() ===
    otherUser.branch.toLowerCase()
  ) {
    score += 20;
  }

  // Compatible study mode → +20
  if (
    currentUser.mode === otherUser.mode ||
    currentUser.mode === 'Both' ||
    otherUser.mode === 'Both'
  ) {
    score += 20;
  }

  // Common subjects → +15 each
  const commonSubjects =
    otherUser.subjects.filter(subject =>
      currentUser.subjects.includes(subject)
    );

  score += commonSubjects.length * 15;

  // Similar availability → +15
  const availabilityA =
    currentUser.availability.toLowerCase();

  const availabilityB =
    otherUser.availability.toLowerCase();

  if (
    availabilityA.includes('pm') &&
    availabilityB.includes('pm')
  ) {
    score += 15;
  }

  if (
    availabilityA.includes('am') &&
    availabilityB.includes('am')
  ) {
    score += 15;
  }

  // Maximum cap = 100
  if (score > 100) {
    score = 100;
  }

  return score;
}


/**
 * Find best matches sorted by compatibility
 */
function findAdvancedMatches(currentUser) {

  const users = getAllUsers();

  // Remove current user
  const otherUsers = users.filter(user =>
    !(
      user.fullName === currentUser.fullName &&
      user.college === currentUser.college
    )
  );

  // Build scored matches
  const scoredMatches = otherUsers.map(user => {

    const compatibility =
      calculateCompatibility(
        currentUser,
        user
      );

    return {
      user,
      compatibility
    };

  });

  // Only keep decent matches
  const filteredMatches =
    scoredMatches.filter(match =>
      match.compatibility >= 40
    );

  // Highest compatibility first
  filteredMatches.sort(
    (a, b) =>
      b.compatibility - a.compatibility
  );

  return filteredMatches;
}


/**
 * Render advanced compatibility match cards
 */
function renderAdvancedMatches(currentUser) {

  const grid =
    document.getElementById('matchCards');

  if (!grid) return;

  // Clear old cards
  grid.innerHTML = '';

  const matches =
    findAdvancedMatches(currentUser);

  // No matches
  if (matches.length === 0) {

    grid.innerHTML = `
      <div class="empty-state">
        <h3>No strong matches yet 😔</h3>
        <p>
          More students need to join first.
        </p>
      </div>
    `;

    return;
  }

  // Render cards
  matches.forEach(match => {

    const user = match.user;

    const compatibility =
      match.compatibility;

    const card =
      document.createElement('div');

    card.className = 'match-card';

    // Avatar initials
    const initials =
      user.fullName
      .split(' ')
      .map(w => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    card.innerHTML = `

      <div class="mc-top">

        <div
          class="mc-avatar"
          style="background:${randomAvatarColor()};"
        >
          ${initials}
        </div>

        <div>
          <div class="mc-name">
            ${escapeHTML(user.fullName)}
          </div>

          <div class="mc-college">
            ${escapeHTML(user.college)}
            ·
            ${escapeHTML(user.branch)}
          </div>
        </div>

      </div>


      <!-- Compatibility Score -->
      <div
        style="
          margin:1rem 0;
        "
      >

        <div
          style="
            display:flex;
            justify-content:space-between;
            margin-bottom:0.4rem;
            font-weight:600;
          "
        >
          <span>Compatibility</span>
          <span>${compatibility}%</span>
        </div>

        <div
          style="
            width:100%;
            height:10px;
            background:#e5e7eb;
            border-radius:999px;
            overflow:hidden;
          "
        >

          <div
            style="
              width:${compatibility}%;
              height:100%;
              background:linear-gradient(
                90deg,
                #3b82f6,
                #8b5cf6
              );
            "
          ></div>

        </div>

      </div>


      <div class="mc-detail">
        <strong>Subjects:</strong>
        ${escapeHTML(
          user.subjects.join(', ')
        )}
      </div>

      <div class="mc-detail">
        <strong>Available:</strong>
        ${escapeHTML(user.availability)}
      </div>

      <div
        class="mc-detail"
        style="margin-bottom:1.2rem;"
      >
        <strong>Mode:</strong>
        ${escapeHTML(user.mode)}
      </div>

      <button
        class="btn btn-connect"
        onclick="handleConnect('${escapeHTML(user.fullName)}')"
      >
        Connect ↗
      </button>

    `;

    grid.appendChild(card);

  });

}


/* ──────────────────────────────────────────────────────────────────
   AUTO GENERATE ADVANCED MATCHES
   ────────────────────────────────────────────────────────────────── */

window.addEventListener('load', () => {

  const form =
    document.getElementById('registerForm');

  if (!form) return;

  form.addEventListener('submit', () => {

    setTimeout(() => {

      const currentUser = {

        fullName:
          document.getElementById('fullName')
          .value.trim(),

        college:
          document.getElementById('college')
          .value.trim(),

        branch:
          document.getElementById('branch')
          .value.trim(),

        semester:
          document.getElementById('semester')
          .value,

        subjects:
          selectedSubjects,

        availability:
          document.getElementById('availability')
          .value.trim(),

        mode:
          getSelectedRadio('mode'),
      };

      // Generate advanced matches
      renderAdvancedMatches(currentUser);

    }, 300);

  });

});