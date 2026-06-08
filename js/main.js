// // document.addEventListener('DOMContentLoaded', () => {

// //   initSubjectChips();

// //   initFormValidation();

// //   renderMatchCards();

// //   renderGroupCards();

// //   initHamburger();

// //   initActiveNavLinks();

// //   restoreSavedProfile();

// // });

// /* ═══════════════════════════════════════════════════════════════════
//    main.js — App entry point
//    Single DOMContentLoaded listener. Single form submit listener.
//    All other files expose pure functions; orchestration is here.
//    ═══════════════════════════════════════════════════════════════════ */

// document.addEventListener('DOMContentLoaded', () => {

//   // 1. Inject nav auth state (login/signup buttons OR user pill + logout)
//   //    Also fixes the hamburger menu bug.
//   if (typeof initNavAuth === 'function') initNavAuth();

//   // 2. Protect pages that require login
//   const page = window.location.pathname.split('/').pop();
//   const protectedPages = ['profile.html', 'groups.html'];
//   if (protectedPages.includes(page)) {
//     if (typeof requireAuth === 'function') requireAuth();
//   }

//   // 3. Page-specific init
//   initSubjectChips();       // form.js — renders subject chips (no-op on groups page)
//   restoreSavedProfile();    // storage.js — pre-fills form from localStorage
//   renderMatchCards();       // matches.js — shows sample match cards
//   renderGroupCards();       // groups.js  — shows study group cards
//   initActiveNavLinks();     // navbar.js  — scroll-based active link highlight

//   // 4. Form validation init (form.js)
//   initFormValidation();

//   // 5. Single form submit handler
//   //    Saves profile to localStorage AND triggers DB match rendering
//   const form = document.getElementById('registerForm');
//   if (form) {
//     form.addEventListener('submit', () => {
//       // Small delay lets form.js validation and card rendering finish first
//       setTimeout(async () => {

//         // Save profile to localStorage
//         saveProfileIfValid(); // storage.js

//         // Build current user object for DB operations
//         const currentUser = {
//           fullName:     document.getElementById('fullName')?.value.trim()     || '',
//           college:      document.getElementById('college')?.value.trim()      || '',
//           branch:       document.getElementById('branch')?.value.trim()       || '',
//           semester:     document.getElementById('semester')?.value            || '',
//           subjects:     selectedSubjects,
//           availability: document.getElementById('availability')?.value.trim() || '',
//           mode:         getSelectedRadio('mode'),
//         };

//         const isComplete =
//           currentUser.fullName &&
//           currentUser.college &&
//           currentUser.branch &&
//           currentUser.semester &&
//           currentUser.subjects.length > 0 &&
//           currentUser.availability &&
//           currentUser.mode;

//         if (!isComplete) return;

//         // Save to MongoDB and show real matches
//         try {
//           await saveUserToDB(currentUser);            // matches.js
//           await renderAdvancedMatchesFromDB(currentUser); // matches.js
//         } catch (err) {
//           console.warn('DB operations failed, using sample matches:', err);
//           // Fallback: render sample cards already shown from initial renderMatchCards()
//         }

//       }, 300);
//     });
//   }

// });

/* ============================================================
   main.js — App entry point
   Single DOMContentLoaded. Single form submit listener.
   Nav auth state handled entirely by navbar-loader.js.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // 1. Page-specific init
  initSubjectChips();    // form.js
  restoreSavedProfile(); // storage.js — restore from localStorage
  renderMatchCards();    // matches.js — sample cards
  renderGroupCards();    // groups.js  — group cards
  initActiveNavLinks();  // navbar.js  — scroll highlight

  // 2. Form validation (form.js) — renders profile card on submit
  initFormValidation();

  if (typeof renderIncomingRequests === 'function') renderIncomingRequests(); 
  
  // 3. On profile form submit — save to DB + refresh real matches
  const form = document.getElementById('registerForm');
  if (form) {
    form.addEventListener('submit', () => {

      setTimeout(async () => {

        const currentUser = {
          fullName:     document.getElementById('fullName')?.value.trim()     || '',
          college:      document.getElementById('college')?.value.trim()      || '',
          branch:       document.getElementById('branch')?.value.trim()       || '',
          semester:     document.getElementById('semester')?.value            || '',
          subjects:     selectedSubjects,
          availability: document.getElementById('availability')?.value.trim() || '',
          mode:         getSelectedRadio('mode'),
        };

        const isComplete =
          currentUser.fullName   &&
          currentUser.college    &&
          currentUser.branch     &&
          currentUser.semester   &&
          currentUser.subjects.length > 0 &&
          currentUser.availability &&
          currentUser.mode;

        if (!isComplete) return;

        // Save to localStorage
        saveProfileIfValid(); // storage.js

        // Save to MongoDB + show real matches
        const saved = await saveUserToDB(currentUser); // matches.js
        if (saved) {
          await renderAdvancedMatchesFromDB(currentUser); // matches.js
        }

      }, 300);
    });
  }

  // 4. Pre-fill form from MongoDB on page load
  loadProfileFromDB(); // defined below

});

/* ── LOAD PROFILE FROM DB ON PAGE LOAD ─────────────────────── */

async function loadProfileFromDB() {
  const token = localStorage.getItem('token');
  if (!token) return;

  // Only run on profile page
  if (!document.getElementById('registerForm')) return;

  try {
    const res = await fetch('http://localhost:3000/api/my-profile', {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!res.ok) return; // No profile yet — that's fine

    const user = await res.json();
    if (!user) return;

    // Fill text fields
    const fields = ['fullName', 'college', 'branch', 'semester', 'availability'];
    fields.forEach(id => {
      const el = document.getElementById(id);
      if (el && user[id]) el.value = user[id];
    });

    // Restore radio
    if (user.mode) {
      const radio = document.querySelector(`input[name="mode"][value="${user.mode}"]`);
      if (radio) radio.checked = true;
    }

    // Restore subject chips — FIX: use '.chip' with data-subject, not '.subject-chip.active'
    if (user.subjects && user.subjects.length > 0) {
      selectedSubjects = [...user.subjects]; // sync the global array
      document.querySelectorAll('.chip').forEach(chip => {
        if (user.subjects.includes(chip.dataset.subject)) {
          chip.classList.add('selected');
        }
      });
    }

    // Show profile card
    displayProfileCard(user); // form.js
    const preview = document.getElementById('profilePreview');
    if (preview) preview.style.display = 'block';

    // Show real matches based on saved profile
    await renderAdvancedMatchesFromDB(user);

  } catch (err) {
    console.warn('Could not load profile from DB:', err);
  }
}