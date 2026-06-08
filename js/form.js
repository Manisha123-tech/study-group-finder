

/* ═══════════════════════════════════════════════════════════════════
   form.js — Subject chips + form validation + profile card display
   escapeHTML is defined here first so groups.js and matches.js
   (loaded after) can use it safely.
   ═══════════════════════════════════════════════════════════════════ */

/* ── SHARED UTILITY ─────────────────────────────────────────── */
/**
 * Escape special HTML characters to prevent XSS.
 * Defined here (first loaded) so all other scripts can use it.
 * @param {string} str
 * @returns {string}
 */
function escapeHTML(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(String(str)));
  return div.innerHTML;
}

/* ── SUBJECT CHIPS ───────────────────────────────────────────── */
const SUBJECTS = [
  'Data Structures', 'Algorithms', 'Operating Systems',
  'DBMS', 'Computer Networks', 'OOP', 'TOC',
  'Discrete Math', 'Digital Electronics', 'Microprocessors',
];

// Global: tracks currently selected subjects
// Accessed by storage.js, matches.js, main.js
let selectedSubjects = [];

function initSubjectChips() {
  const container = document.getElementById('subjectChips');
  if (!container) return;

  SUBJECTS.forEach(subject => {
    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.textContent = subject;
    chip.dataset.subject = subject;
    chip.addEventListener('click', () => toggleChip(chip, subject));
    container.appendChild(chip);
  });
}

function toggleChip(chip, subject) {
  const idx = selectedSubjects.indexOf(subject);
  if (idx === -1) {
    selectedSubjects.push(subject);
    chip.classList.add('selected');
  } else {
    selectedSubjects.splice(idx, 1);
    chip.classList.remove('selected');
  }
}

/* ── FORM VALIDATION & PROFILE CARD ─────────────────────────── */
function initFormValidation() {
  const form = document.getElementById('registerForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearAllErrors();

    const data = {
      fullName:     document.getElementById('fullName').value.trim(),
      college:      document.getElementById('college').value.trim(),
      branch:       document.getElementById('branch').value.trim(),
      semester:     document.getElementById('semester').value,
      subjects:     selectedSubjects,
      availability: document.getElementById('availability').value.trim(),
      mode:         getSelectedRadio('mode'),
    };

    if (!validateForm(data)) return;

    displayProfileCard(data);

    const preview = document.getElementById('profilePreview');
    preview.style.display = 'block';
    preview.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

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

function showError(errId, inputId, message) {
  document.getElementById(errId).textContent = message;
  const input = document.getElementById(inputId);
  if (input) input.classList.add('invalid');
}

function clearAllErrors() {
  document.querySelectorAll('.error-msg').forEach(el => el.textContent = '');
  document.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
}

function getSelectedRadio(name) {
  const checked = document.querySelector(`input[name="${name}"]:checked`);
  return checked ? checked.value : '';
}

function displayProfileCard(data) {
  const card = document.getElementById('profileCard');
  if (!card) return;

  const initials = (data.fullName || '')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const subjectTags = (data.subjects || [])
    .map(s => `<span class="tag">${escapeHTML(s)}</span>`)
    .join('');

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
}// const SUBJECTS = [
//   'Data Structures', 'Algorithms', 'Operating Systems',
//   'DBMS', 'Computer Networks', 'OOP', 'TOC',
//   'Discrete Math', 'Digital Electronics', 'Microprocessors',
// ];

// // Track which subjects the user has selected
// let selectedSubjects = [];

// function initSubjectChips() {
//   const container = document.getElementById('subjectChips');
//   if (!container) return;

//   SUBJECTS.forEach(subject => {
//     const chip = document.createElement('div');
//     chip.className = 'chip';
//     chip.textContent = subject;
//     chip.dataset.subject = subject;

//     // Toggle selection when a chip is clicked
//     chip.addEventListener('click', () => toggleChip(chip, subject));

//     container.appendChild(chip);
//   });
// }

// /**
//  * Toggle a chip's selected state and update selectedSubjects array.
//  * @param {HTMLElement} chip     - The chip element clicked
//  * @param {string}      subject  - The subject string it represents
//  */
// function toggleChip(chip, subject) {
//   const idx = selectedSubjects.indexOf(subject);

//   if (idx === -1) {
//     // Not selected → select it
//     selectedSubjects.push(subject);
//     chip.classList.add('selected');
//   } else {
//     // Already selected → deselect it
//     selectedSubjects.splice(idx, 1);
//     chip.classList.remove('selected');
//   }
// }


// /* ═══════════════════════════════════════════════════════════════════
//    2. FORM VALIDATION & PROFILE CARD DISPLAY
//    ═══════════════════════════════════════════════════════════════════ */

// function initFormValidation() {
//   const form = document.getElementById('registerForm');
//   if (!form) return;

//   form.addEventListener('submit', (e) => {
//     e.preventDefault(); // Prevent default page reload

//     // Clear all previous errors before re-validating
//     clearAllErrors();

//     // Collect values from form fields
//     const data = {
//       fullName:     document.getElementById('fullName').value.trim(),
//       college:      document.getElementById('college').value.trim(),
//       branch:       document.getElementById('branch').value.trim(),
//       semester:     document.getElementById('semester').value,
//       subjects:     selectedSubjects,
//       availability: document.getElementById('availability').value.trim(),
//       mode:         getSelectedRadio('mode'),
//     };

//     // Validate; if any field fails, stop and show errors
//     const isValid = validateForm(data);
//     if (!isValid) return;

//     // ✅ All valid — render the profile card and scroll to it
//     displayProfileCard(data);

//     const preview = document.getElementById('profilePreview');
//     preview.style.display = 'block';
//     preview.scrollIntoView({ behavior: 'smooth', block: 'start' });
//   });
// }

// /**
//  * Run all validation rules.
//  * Returns true if everything passes, false otherwise.
//  * @param {Object} data - The collected form values
//  */
// function validateForm(data) {
//   let valid = true;

//   if (!data.fullName) {
//     showError('err-fullName', 'fullName', 'Please enter your full name.');
//     valid = false;
//   }
//   if (!data.college) {
//     showError('err-college', 'college', 'Please enter your college name.');
//     valid = false;
//   }
//   if (!data.branch) {
//     showError('err-branch', 'branch', 'Please enter your branch.');
//     valid = false;
//   }
//   if (!data.semester) {
//     showError('err-semester', 'semester', 'Please select your semester.');
//     valid = false;
//   }
//   if (data.subjects.length === 0) {
//     // Chips have no id, so we mark the container instead
//     document.getElementById('subjectChips').classList.add('invalid');
//     document.getElementById('err-subjects').textContent = 'Select at least one subject.';
//     valid = false;
//   }
//   if (!data.availability) {
//     showError('err-availability', 'availability', 'Please mention your availability.');
//     valid = false;
//   }
//   if (!data.mode) {
//     document.getElementById('err-mode').textContent = 'Please choose a study mode.';
//     valid = false;
//   }

//   return valid;
// }

// /**
//  * Show an error message and mark the input as invalid.
//  * @param {string} errId   - ID of the <span> error element
//  * @param {string} inputId - ID of the <input> or <select>
//  * @param {string} message - Error text to display
//  */
// function showError(errId, inputId, message) {
//   document.getElementById(errId).textContent = message;
//   const input = document.getElementById(inputId);
//   if (input) input.classList.add('invalid');
// }

// /** Remove all error highlights and messages */
// function clearAllErrors() {
//   document.querySelectorAll('.error-msg').forEach(el => el.textContent = '');
//   document.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
// }

// /**
//  * Get the value of the checked radio in a named group.
//  * Returns '' if nothing is selected.
//  * @param {string} name - The radio group name
//  */
// function getSelectedRadio(name) {
//   const checked = document.querySelector(`input[name="${name}"]:checked`);
//   return checked ? checked.value : '';
// }

// /**
//  * Build and insert a profile card from submitted data.
//  * @param {Object} data - The validated form data
//  */
// function displayProfileCard(data) {
//   const card = document.getElementById('profileCard');
//   if (!card) return;

//   // Build initials for the avatar (up to 2 characters)
//   const initials = data.fullName
//     .split(' ')
//     .map(w => w[0])
//     .slice(0, 2)
//     .join('')
//     .toUpperCase();

//   // Build subject tag HTML
//   const subjectTags = data.subjects
//     .map(s => `<span class="tag">${s}</span>`)
//     .join('');

//   // Inject all fields as HTML
//   card.innerHTML = `
//     <div class="pc-header">
//       <div class="pc-avatar">${initials}</div>
//       <div>
//         <div class="pc-name">${escapeHTML(data.fullName)}</div>
//         <div class="pc-college">${escapeHTML(data.college)}</div>
//       </div>
//     </div>
//     <div class="pc-body">
//       <div class="pc-field">
//         <label>Branch</label>
//         <p>${escapeHTML(data.branch)}</p>
//       </div>
//       <div class="pc-field">
//         <label>Semester</label>
//         <p>${escapeHTML(data.semester)}</p>
//       </div>
//       <div class="pc-field">
//         <label>Availability</label>
//         <p>${escapeHTML(data.availability)}</p>
//       </div>
//       <div class="pc-field">
//         <label>Study Mode</label>
//         <p>${escapeHTML(data.mode)}</p>
//       </div>
//       <div class="pc-field" style="grid-column: 1 / -1;">
//         <label>Subjects</label>
//         <div class="pc-subjects">${subjectTags}</div>
//       </div>
//     </div>
//   `;
// }

// /**
//  * Escape special HTML characters to prevent XSS when inserting user input.
//  * @param {string} str
//  * @returns {string}
//  */
// function escapeHTML(str) {
//   const div = document.createElement('div');
//   div.appendChild(document.createTextNode(str));
//   return div.innerHTML;
// }