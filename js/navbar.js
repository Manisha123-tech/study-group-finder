

/* ═══════════════════════════════════════════════════════════════════
   navbar.js — Hamburger + Active Nav Links
   NOTE: Hamburger wiring is now handled inside auth.js → initNavAuth()
         so it works whether or not the user is logged in.
         initHamburger() is kept here as a no-op fallback so main.js
         doesn't throw if called before auth.js loads.
   ═══════════════════════════════════════════════════════════════════ */

function initHamburger() {
  // Intentionally empty — handled by initNavAuth() in auth.js
  // which correctly targets the .nav-links CLASS (not the old
  // non-existent id="navLinks" that was the original bug).
}

/* ═══════════════════════════════════════════════════════════════════
   ACTIVE NAV LINK on scroll
   Highlights the nav link whose section is currently in view.
   ═══════════════════════════════════════════════════════════════════ */
function initActiveNavLinks() {
  const sections = document.querySelectorAll('section[id], header[id]');
  const navLinks  = document.querySelectorAll('.nav-link');

  const linkMap = {};
  navLinks.forEach(link => {
    const href = link.getAttribute('href') || '';
    // Support both "#section" and "page.html#section" hrefs
    const id = href.includes('#') ? href.split('#').pop() : '';
    if (id) linkMap[id] = link;
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(l => l.classList.remove('active'));
        const id = entry.target.getAttribute('id');
        if (linkMap[id]) linkMap[id].classList.add('active');
      }
    });
  }, {
    rootMargin: '-40% 0px -55% 0px',
  });

  sections.forEach(section => observer.observe(section));
}// /* ═══════════════════════════════════════════════════════════════════
//    5. HAMBURGER MENU (Mobile)
//    ═══════════════════════════════════════════════════════════════════ */

// function initHamburger() {
//   const btn   = document.getElementById('hamburger');
//   const links = document.getElementById('navLinks');
//   if (!btn || !links) return;

//   // Toggle open/close on click
//   btn.addEventListener('click', () => {
//     links.classList.toggle('open');

//     // Animate hamburger lines into an × shape
//     btn.classList.toggle('active');
//   });

//   // Close menu when any nav link is clicked (for single-page navigation)
//   links.querySelectorAll('.nav-link').forEach(link => {
//     link.addEventListener('click', () => {
//       links.classList.remove('open');
//       btn.classList.remove('active');
//     });
//   });
// }


// /* ═══════════════════════════════════════════════════════════════════
//    6. ACTIVE NAV LINK on scroll
//    Highlights the nav link whose section is currently in view.
//    ═══════════════════════════════════════════════════════════════════ */

// function initActiveNavLinks() {
//   const sections = document.querySelectorAll('section[id], header[id]');
//   const navLinks  = document.querySelectorAll('.nav-link');

//   // Build a map: section id → nav link element
//   const linkMap = {};
//   navLinks.forEach(link => {
//     // href="#find-groups" → key is "find-groups"
//     const id = link.getAttribute('href').replace('#', '');
//     linkMap[id] = link;
//   });

//   // Use IntersectionObserver to detect which section is in view
//   const observer = new IntersectionObserver((entries) => {
//     entries.forEach(entry => {
//       if (entry.isIntersecting) {
//         // Remove active from all links
//         navLinks.forEach(l => l.classList.remove('active'));

//         // Add active to the matching link (if it exists in the nav)
//         const id = entry.target.getAttribute('id');
//         if (linkMap[id]) linkMap[id].classList.add('active');
//       }
//     });
//   }, {
//     rootMargin: '-40% 0px -55% 0px', // Trigger when section is ~centre of viewport
//   });

//   sections.forEach(section => observer.observe(section));
// }