/* ============================================================
   auth.js — Study Group Finder
   Handles: signup, login, logout, session guard
   TOKEN KEY: 'token' and 'email' — consistent with navbar-loader.js
   Nav state is handled by navbar-loader.js, NOT here.
   ============================================================ */

const API_BASE = 'http://localhost:3000';

/* ── SESSION HELPERS ────────────────────────────────────────── */

function getToken() {
  return localStorage.getItem('token');
}

function getEmail() {
  return localStorage.getItem('email');
}

function saveSession(token, email) {
  localStorage.setItem('token', token);
  localStorage.setItem('email', email);
}

function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('email');
  localStorage.removeItem('studyGroupProfile');
}

function isLoggedIn() {
  return !!getToken();
}

/* ── ROUTE GUARDS ───────────────────────────────────────────── */

function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = 'login.html';
  }
}

function redirectIfLoggedIn() {
  if (isLoggedIn()) {
    window.location.href = 'profile.html';
  }
}

/* ── ALERT BANNER ───────────────────────────────────────────── */

function showAlert(message, type = 'error') {
  const el = document.getElementById('authAlert');
  if (!el) return;
  el.textContent = message;
  el.className = `auth-alert ${type}`;
  el.style.display = 'block';
  if (type === 'success') {
    setTimeout(() => { el.style.display = 'none'; }, 4000);
  }
}

function hideAlert() {
  const el = document.getElementById('authAlert');
  if (el) el.style.display = 'none';
}

/* ── FIELD ERRORS ───────────────────────────────────────────── */

function clearAuthErrors() {
  document.querySelectorAll('.auth-err').forEach(el => el.textContent = '');
  document.querySelectorAll('.auth-field-group input').forEach(el => el.classList.remove('invalid'));
  hideAlert();
}

function setFieldError(inputId, errId, message) {
  const input = document.getElementById(inputId);
  const err   = document.getElementById(errId);
  if (input) input.classList.add('invalid');
  if (err)   err.textContent = message;
}

/* ── BUTTON LOADING ─────────────────────────────────────────── */

function setLoading(btnId, textId, spinnerId, loading) {
  const btn     = document.getElementById(btnId);
  const text    = document.getElementById(textId);
  const spinner = document.getElementById(spinnerId);
  if (!btn) return;
  btn.disabled = loading;
  if (text)    text.style.display    = loading ? 'none'         : 'inline';
  if (spinner) spinner.style.display = loading ? 'inline-block' : 'none';
}

/* ── PASSWORD STRENGTH ──────────────────────────────────────── */

function updatePasswordStrength(password) {
  const fill  = document.getElementById('pwStrengthFill');
  const label = document.getElementById('pwStrengthLabel');
  if (!fill || !label) return;

  let score = 0;
  if (password.length >= 6)          score++;
  if (password.length >= 10)         score++;
  if (/[A-Z]/.test(password))        score++;
  if (/[0-9]/.test(password))        score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { pct: 0,   color: 'transparent', text: '' },
    { pct: 20,  color: '#ef4444',     text: 'Very weak' },
    { pct: 40,  color: '#f97316',     text: 'Weak' },
    { pct: 60,  color: '#eab308',     text: 'Fair' },
    { pct: 80,  color: '#22c55e',     text: 'Strong' },
    { pct: 100, color: '#3ecf8e',     text: 'Very strong' },
  ];

  const level = password.length === 0 ? levels[0] : levels[Math.min(score, 5)];
  fill.style.width      = level.pct + '%';
  fill.style.background = level.color;
  label.textContent     = level.text;
  label.style.color     = level.color;
}

/* ── SIGNUP ─────────────────────────────────────────────────── */

async function handleSignup() {
  clearAuthErrors();

  const email    = document.getElementById('email')?.value.trim();
  const password = document.getElementById('password')?.value;
  const confirm  = document.getElementById('confirmPassword')?.value;

  let valid = true;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setFieldError('email', 'err-email', 'Please enter a valid email address.');
    valid = false;
  }
  if (!password || password.length < 6) {
    setFieldError('password', 'err-password', 'Password must be at least 6 characters.');
    valid = false;
  }
  if (password !== confirm) {
    setFieldError('confirmPassword', 'err-confirmPassword', 'Passwords do not match.');
    valid = false;
  }
  if (!valid) return;

  setLoading('signupBtn', 'signupBtnText', 'signupSpinner', true);

  try {
    const res  = await fetch(`${API_BASE}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      showAlert(data.error || 'Signup failed. Please try again.');
      return;
    }

    saveSession(data.token, data.email);
    showAlert('Account created! Redirecting…', 'success');
    setTimeout(() => { window.location.href = 'profile.html'; }, 1200);

  } catch {
    showAlert('Cannot reach the server. Make sure the backend is running.');
  } finally {
    setLoading('signupBtn', 'signupBtnText', 'signupSpinner', false);
  }
}

/* ── LOGIN ──────────────────────────────────────────────────── */

async function handleLogin() {
  clearAuthErrors();

  const email    = document.getElementById('email')?.value.trim();
  const password = document.getElementById('password')?.value;

  let valid = true;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setFieldError('email', 'err-email', 'Please enter a valid email address.');
    valid = false;
  }
  if (!password) {
    setFieldError('password', 'err-password', 'Please enter your password.');
    valid = false;
  }
  if (!valid) return;

  setLoading('loginBtn', 'loginBtnText', 'loginSpinner', true);

  try {
    const res  = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      showAlert(data.error || 'Login failed. Check your credentials.');
      return;
    }

    saveSession(data.token, data.email);
    showAlert('Welcome back! Redirecting…', 'success');
    setTimeout(() => { window.location.href = 'profile.html'; }, 1000);

  } catch {
    showAlert('Cannot reach the server. Make sure the backend is running.');
  } finally {
    setLoading('loginBtn', 'loginBtnText', 'loginSpinner', false);
  }
}

/* ── AUTO-RUN ON AUTH PAGES ─────────────────────────────────── */
// Redirect already-logged-in users away from login/signup pages
const currentPage = window.location.pathname.split('/').pop();
if (currentPage === 'login.html' || currentPage === 'signup.html') {
  redirectIfLoggedIn();
}


// /* ============================================================
//    auth.js — Study Group Finder
//    Handles: signup, login, logout, session guard, nav state
//    ============================================================ */

// const API_BASE = 'http://localhost:3000';

// /* ── HELPERS ────────────────────────────────────────────────── */

// function getToken() {
//   return localStorage.getItem('sgf_token');
// }

// function getEmail() {
//   return localStorage.getItem('sgf_email');
// }

// function saveSession(token, email) {
//   localStorage.setItem('sgf_token', token);
//   localStorage.setItem('sgf_email', email);
// }

// function clearSession() {
//   localStorage.removeItem('sgf_token');
//   localStorage.removeItem('sgf_email');
//   localStorage.removeItem('studyGroupProfile');
// }

// function isLoggedIn() {
//   return !!getToken();
// }

// /* ── SESSION GUARD ──────────────────────────────────────────── */
// /**
//  * Call this on protected pages (profile.html, groups.html, index.html after login).
//  * Redirects to login.html if not authenticated.
//  */
// function requireAuth() {
//   if (!isLoggedIn()) {
//     window.location.href = 'login.html';
//   }
// }

// /**
//  * Call this on auth pages (login.html, signup.html).
//  * Redirects already-logged-in users away.
//  */
// function redirectIfLoggedIn() {
//   if (isLoggedIn()) {
//     window.location.href = 'profile.html';
//   }
// }

// /* ── SHOW ALERT BANNER ──────────────────────────────────────── */
// function showAlert(message, type = 'error') {
//   const el = document.getElementById('authAlert');
//   if (!el) return;
//   el.textContent = message;
//   el.className = `auth-alert ${type}`;
//   el.style.display = 'block';

//   // Auto-hide success messages
//   if (type === 'success') {
//     setTimeout(() => { el.style.display = 'none'; }, 4000);
//   }
// }

// function hideAlert() {
//   const el = document.getElementById('authAlert');
//   if (el) el.style.display = 'none';
// }

// /* ── FIELD VALIDATION ───────────────────────────────────────── */
// function clearAuthErrors() {
//   document.querySelectorAll('.auth-err').forEach(el => el.textContent = '');
//   document.querySelectorAll('.auth-field-group input').forEach(el => el.classList.remove('invalid'));
//   hideAlert();
// }

// function setFieldError(inputId, errId, message) {
//   const input = document.getElementById(inputId);
//   const err = document.getElementById(errId);
//   if (input) input.classList.add('invalid');
//   if (err) err.textContent = message;
// }

// /* ── BUTTON LOADING STATE ───────────────────────────────────── */
// function setLoading(btnId, textId, spinnerId, loading) {
//   const btn = document.getElementById(btnId);
//   const text = document.getElementById(textId);
//   const spinner = document.getElementById(spinnerId);
//   if (!btn) return;
//   btn.disabled = loading;
//   if (text) text.style.display = loading ? 'none' : 'inline';
//   if (spinner) spinner.style.display = loading ? 'inline-block' : 'none';
// }

// /* ── PASSWORD STRENGTH ──────────────────────────────────────── */
// function updatePasswordStrength(password) {
//   const fill = document.getElementById('pwStrengthFill');
//   const label = document.getElementById('pwStrengthLabel');
//   if (!fill || !label) return;

//   let score = 0;
//   if (password.length >= 6)  score++;
//   if (password.length >= 10) score++;
//   if (/[A-Z]/.test(password)) score++;
//   if (/[0-9]/.test(password)) score++;
//   if (/[^A-Za-z0-9]/.test(password)) score++;

//   const levels = [
//     { pct: 0,   color: 'transparent', text: '' },
//     { pct: 20,  color: '#ef4444',     text: 'Very weak' },
//     { pct: 40,  color: '#f97316',     text: 'Weak' },
//     { pct: 60,  color: '#eab308',     text: 'Fair' },
//     { pct: 80,  color: '#22c55e',     text: 'Strong' },
//     { pct: 100, color: '#3ecf8e',     text: 'Very strong' },
//   ];

//   const level = password.length === 0 ? levels[0] : levels[Math.min(score, 5)];
//   fill.style.width = level.pct + '%';
//   fill.style.background = level.color;
//   label.textContent = level.text;
//   label.style.color = level.color;
// }

// /* ── SIGNUP ─────────────────────────────────────────────────── */
// async function handleSignup() {
//   clearAuthErrors();

//   const email    = document.getElementById('email')?.value.trim();
//   const password = document.getElementById('password')?.value;
//   const confirm  = document.getElementById('confirmPassword')?.value;

//   let valid = true;

//   if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
//     setFieldError('email', 'err-email', 'Please enter a valid email address.');
//     valid = false;
//   }
//   if (!password || password.length < 6) {
//     setFieldError('password', 'err-password', 'Password must be at least 6 characters.');
//     valid = false;
//   }
//   if (password !== confirm) {
//     setFieldError('confirmPassword', 'err-confirmPassword', 'Passwords do not match.');
//     valid = false;
//   }
//   if (!valid) return;

//   setLoading('signupBtn', 'signupBtnText', 'signupSpinner', true);

//   try {
//     const res = await fetch(`${API_BASE}/api/auth/signup`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ email, password }),
//     });

//     const data = await res.json();

//     if (!res.ok) {
//       showAlert(data.error || 'Signup failed. Please try again.');
//       return;
//     }

//     // Save token + redirect to profile
//     saveSession(data.token, data.email);
//     showAlert('Account created! Redirecting…', 'success');
//     setTimeout(() => { window.location.href = 'profile.html'; }, 1200);

//   } catch (err) {
//     showAlert('Cannot reach the server. Make sure the backend is running.');
//   } finally {
//     setLoading('signupBtn', 'signupBtnText', 'signupSpinner', false);
//   }
// }

// /* ── LOGIN ──────────────────────────────────────────────────── */
// async function handleLogin() {
//   clearAuthErrors();

//   const email    = document.getElementById('email')?.value.trim();
//   const password = document.getElementById('password')?.value;

//   let valid = true;

//   if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
//     setFieldError('email', 'err-email', 'Please enter a valid email address.');
//     valid = false;
//   }
//   if (!password) {
//     setFieldError('password', 'err-password', 'Please enter your password.');
//     valid = false;
//   }
//   if (!valid) return;

//   setLoading('loginBtn', 'loginBtnText', 'loginSpinner', true);

//   try {
//     const res = await fetch(`${API_BASE}/api/auth/login`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ email, password }),
//     });

//     const data = await res.json();

//     if (!res.ok) {
//       showAlert(data.error || 'Login failed. Check your credentials.');
//       return;
//     }

//     saveSession(data.token, data.email);
//     showAlert('Welcome back! Redirecting…', 'success');
//     setTimeout(() => { window.location.href = 'profile.html'; }, 1000);

//   } catch (err) {
//     showAlert('Cannot reach the server. Make sure the backend is running.');
//   } finally {
//     setLoading('loginBtn', 'loginBtnText', 'loginSpinner', false);
//   }
// }

// /* ── LOGOUT ─────────────────────────────────────────────────── */
// function handleLogout() {
//   clearSession();
//   window.location.href = 'login.html';
// }

// /* ── INJECT NAV AUTH STATE ──────────────────────────────────── */
// /**
//  * Call this on every page (index, profile, groups).
//  * Replaces the static nav buttons with either:
//  *   - login/signup buttons (not logged in)
//  *   - user pill + logout button (logged in)
//  */
// function initNavAuth() {
//   // Fix hamburger bug: the nav element uses CLASS nav-links, not id navLinks
//   const hamburgerBtn = document.getElementById('hamburger');
//   const navLinksEl   = document.querySelector('.nav-links');

//   if (hamburgerBtn && navLinksEl) {
//     hamburgerBtn.addEventListener('click', () => {
//       navLinksEl.classList.toggle('open');
//       hamburgerBtn.classList.toggle('active');
//     });
//     navLinksEl.querySelectorAll('.nav-link').forEach(link => {
//       link.addEventListener('click', () => {
//         navLinksEl.classList.remove('open');
//         hamburgerBtn.classList.remove('active');
//       });
//     });
//   }

//   // Inject auth controls into nav
//   const navContainer = document.querySelector('.nav-container');
//   if (!navContainer) return;

//   // Remove any existing auth element first
//   const existing = navContainer.querySelector('.nav-user, .nav-auth-btns');
//   if (existing) existing.remove();

//   if (isLoggedIn()) {
//     const email    = getEmail() || '';
//     const initials = email.slice(0, 2).toUpperCase();

//     const userEl = document.createElement('div');
//     userEl.className = 'nav-user';
//     userEl.innerHTML = `
//       <div class="nav-user-pill">
//         <div class="nav-user-avatar">${initials}</div>
//         <span class="nav-email">${email}</span>
//       </div>
//       <button class="btn-logout" id="logoutBtn">Log Out</button>
//     `;
//     navContainer.appendChild(userEl);
//     document.getElementById('logoutBtn').addEventListener('click', handleLogout);

//   } else {
//     const authEl = document.createElement('div');
//     authEl.className = 'nav-auth-btns';
//     authEl.innerHTML = `
//       <button class="btn-nav-login" onclick="window.location.href='login.html'">Log In</button>
//       <button class="btn-nav-signup" onclick="window.location.href='signup.html'">Sign Up</button>
//     `;
//     navContainer.appendChild(authEl);
//   }
// }

// /* ── AUTO-RUN ON AUTH PAGES ─────────────────────────────────── */
// // Redirect already-logged-in users away from login/signup
// const currentPage = window.location.pathname.split('/').pop();
// if (currentPage === 'login.html' || currentPage === 'signup.html') {
//   redirectIfLoggedIn();
// }