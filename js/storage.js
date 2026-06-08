

/* ═══════════════════════════════════════════════════════════════════
   storage.js — LocalStorage profile save / restore
   FIXES:
   - Removed duplicate DOMContentLoaded listener (was running
     restoreSavedProfile twice; main.js already calls it once)
   - Auto-save now fires via the single submit listener in main.js
     by exposing saveProfileIfValid() for main.js to call
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Save profile data in browser localStorage.
 * @param {Object} data
 */
function saveProfile(data) {
  localStorage.setItem('studyGroupProfile', JSON.stringify(data));
}

/**
 * Collect current form values and save if all required fields exist.
 * Called by main.js after successful form submission.
 */
function saveProfileIfValid() {
  const data = {
    fullName:     document.getElementById('fullName')?.value.trim()    || '',
    college:      document.getElementById('college')?.value.trim()     || '',
    branch:       document.getElementById('branch')?.value.trim()      || '',
    semester:     document.getElementById('semester')?.value           || '',
    subjects:     selectedSubjects,
    availability: document.getElementById('availability')?.value.trim() || '',
    mode:         getSelectedRadio('mode'),
  };

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
}

/**
 * Load saved profile when page opens and pre-fill the form.
 * Called once by main.js inside DOMContentLoaded.
 */
function restoreSavedProfile() {
  const saved = localStorage.getItem('studyGroupProfile');
  if (!saved) return;

  let data;
  try {
    data = JSON.parse(saved);
  } catch {
    return; // Corrupted data — skip
  }

  // Restore selectedSubjects array (defined in form.js)
  selectedSubjects = data.subjects || [];

  // Restore text inputs
  const fields = ['fullName', 'college', 'branch', 'semester', 'availability'];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = data[id] || '';
  });

  // Restore radio button
  if (data.mode) {
    const radio = document.querySelector(`input[name="mode"][value="${data.mode}"]`);
    if (radio) radio.checked = true;
  }

  // Restore chip selections visually
  document.querySelectorAll('.chip').forEach(chip => {
    if (selectedSubjects.includes(chip.dataset.subject)) {
      chip.classList.add('selected');
    }
  });

  // Show profile card if preview section exists
  const preview = document.getElementById('profilePreview');
  const card    = document.getElementById('profileCard');
  if (preview && card) {
    displayProfileCard(data);
    preview.style.display = 'block';
  }
}//  /* ═══════════════════════════════════════════════════════════════════
//    7. LOCAL STORAGE SUPPORT
//    Save and restore user profile automatically
//    ═══════════════════════════════════════════════════════════════════ */

// /**
//  * Save profile data in browser localStorage
//  * @param {Object} data
//  */
// function saveProfile(data) {
//   localStorage.setItem(
//     'studyGroupProfile',
//     JSON.stringify(data)
//   );
// }

// /**
//  * Load saved profile when page opens
//  */
// function restoreSavedProfile() {

//   // Get stored profile
//   const saved = localStorage.getItem('studyGroupProfile');

//   // Stop if nothing exists
//   if (!saved) return;

//   // Convert string → object
//   const data = JSON.parse(saved);

//   // Restore selected subjects array
//   selectedSubjects = data.subjects || [];

//   // Restore form values
//   document.getElementById('fullName').value =
//     data.fullName || '';

//   document.getElementById('college').value =
//     data.college || '';

//   document.getElementById('branch').value =
//     data.branch || '';

//   document.getElementById('semester').value =
//     data.semester || '';

//   document.getElementById('availability').value =
//     data.availability || '';

//   // Restore radio button
//   if (data.mode) {
//     const radio = document.querySelector(
//       `input[name="mode"][value="${data.mode}"]`
//     );

//     if (radio) radio.checked = true;
//   }

//   // Restore chip selection visually
//   document.querySelectorAll('.chip').forEach(chip => {

//     const subject = chip.dataset.subject;

//     if (selectedSubjects.includes(subject)) {
//       chip.classList.add('selected');
//     }
//   });

//   // Show profile card again
//   displayProfileCard(data);

//   // Show preview section
//   document.getElementById('profilePreview').style.display = 'block';
// }


// /* ──────────────────────────────────────────────────────────────────
//    AUTO SAVE PROFILE AFTER FORM SUBMIT
//    ────────────────────────────────────────────────────────────────── */

// document.addEventListener('DOMContentLoaded', () => {

//   // Restore old profile immediately
//   restoreSavedProfile();

//   // Listen for form submit
//   const form = document.getElementById('registerForm');

//   if (!form) return;

//   form.addEventListener('submit', () => {

//     // Delay slightly so existing validation code finishes first
//     setTimeout(() => {

//       // Collect latest form data
//       const data = {
//         fullName:
//           document.getElementById('fullName').value.trim(),

//         college:
//           document.getElementById('college').value.trim(),

//         branch:
//           document.getElementById('branch').value.trim(),

//         semester:
//           document.getElementById('semester').value,

//         subjects:
//           selectedSubjects,

//         availability:
//           document.getElementById('availability').value.trim(),

//         mode:
//           getSelectedRadio('mode'),
//       };

//       // Save only if required fields exist
//       if (
//         data.fullName &&
//         data.college &&
//         data.branch &&
//         data.semester &&
//         data.subjects.length > 0 &&
//         data.availability &&
//         data.mode
//       ) {
//         saveProfile(data);
//       }

//     }, 100);

//   });

// });