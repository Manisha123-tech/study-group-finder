

/* ============================================================
   navbar-loader.js
   - Fetches navbar.html and injects it
   - Manages login/logout UI state
   - TOKEN KEY: 'token' (matches login.html and all other files)
   ============================================================ */

fetch('navbar.html')
  .then(response => response.text())
  .then(html => {
    document.getElementById('navbar').innerHTML = html;
    initializeNavbar();
  })
  .catch(err => console.error('Failed to load navbar:', err));


function initializeNavbar() {

  const token = localStorage.getItem('token');
  const email = localStorage.getItem('email');

  const guestButtons   = document.getElementById('guestButtons');
  const profileSection = document.getElementById('profileSection');
  const userEmail      = document.getElementById('userEmail');

  // ── SHOW CORRECT STATE ────────────────────────────────────
  if (token && email) {
    if (guestButtons)   guestButtons.style.display   = 'none';
    if (profileSection) profileSection.style.display = 'flex';
    if (userEmail)      userEmail.textContent         = email;
  } else {
    if (guestButtons)   guestButtons.style.display   = 'flex';
    if (profileSection) profileSection.style.display = 'none';
  }

  // ── DROPDOWN TOGGLE ───────────────────────────────────────
  const profileBtn      = document.getElementById('profileBtn');
  const profileDropdown = document.getElementById('profileDropdown');

  if (profileBtn && profileDropdown) {
    profileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      profileDropdown.classList.toggle('show');
    });

    // Close dropdown when clicking anywhere else
    document.addEventListener('click', () => {
      profileDropdown.classList.remove('show');
    });
  }

  // ── LOGOUT ────────────────────────────────────────────────
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('email');
      localStorage.removeItem('studyGroupProfile');
      window.location.href = 'login.html';
    });
  }

  // ── HAMBURGER ─────────────────────────────────────────────
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.querySelector('.nav-links');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      hamburger.classList.toggle('active');
    });
    navLinks.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        hamburger.classList.remove('active');
      });
    });
  }

  // ── ROUTE GUARD ───────────────────────────────────────────
  // Redirect to login if on a protected page without a token
  const page = window.location.pathname.split('/').pop();
  const protectedPages = ['profile.html', 'groups.html'];
  if (protectedPages.includes(page) && !token) {
    window.location.href = 'login.html';
  }
}

// fetch('navbar.html')

//   .then(response => response.text())

//   .then(data => {

//     document.getElementById('navbar').innerHTML = data;

//     initializeNavbar();

//   });


// function initializeNavbar() {

//   const token = localStorage.getItem('token');

//   const email = localStorage.getItem('email');

//   const guestButtons =
//     document.getElementById('guestButtons');

//   const profileSection =
//     document.getElementById('profileSection');

//   const userEmail =
//     document.getElementById('userEmail');


//   // IF LOGGED IN
//   if (token && email) {

//     guestButtons.style.display = 'none';

//     profileSection.style.display = 'block';

//     userEmail.textContent = email;

//   }


//   // DROPDOWN
//   const profileBtn =
//     document.getElementById('profileBtn');

//   const profileDropdown =
//     document.getElementById('profileDropdown');

//   profileBtn.addEventListener('click', () => {

//     profileDropdown.classList.toggle('show');

//   });


//   // LOGOUT
//   document.getElementById('logoutBtn')
//   .addEventListener('click', () => {

//     localStorage.removeItem('token');

//     localStorage.removeItem('email');

//     window.location.href = 'login.html';

//   });

// }

