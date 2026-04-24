/**
 * WedsLive Navbar — script.js
 * Handles: sticky scroll shadow, hamburger toggle, mobile menu, scroll lock
 */

(function () {
  'use strict';

  // ── Element refs ──────────────────────────────────────────────────────────
  const navbar       = document.getElementById('navbar');
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const mobileMenu   = document.getElementById('mobileMenu');
  const mobileLinks  = mobileMenu.querySelectorAll('.mobile-menu__link, .mobile-menu__cta');

  // ── State ─────────────────────────────────────────────────────────────────
  let menuOpen = false;

  // ── Sticky navbar shadow on scroll ────────────────────────────────────────
  function handleScroll() {
    if (window.scrollY > 10) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true });

  // Run once on load in case page is already scrolled
  handleScroll();

  // ── Open / close mobile menu ──────────────────────────────────────────────
  function openMenu() {
    menuOpen = true;
    mobileMenu.classList.add('is-open');
    hamburgerBtn.classList.add('is-active');
    hamburgerBtn.setAttribute('aria-expanded', 'true');
    hamburgerBtn.setAttribute('aria-label', 'Close navigation menu');
    document.body.classList.add('menu-open');

    // Move focus into menu for accessibility
    const firstLink = mobileMenu.querySelector('.mobile-menu__link, .mobile-menu__cta');
    if (firstLink) firstLink.focus();
  }

  function closeMenu() {
    menuOpen = false;
    mobileMenu.classList.remove('is-open');
    hamburgerBtn.classList.remove('is-active');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    hamburgerBtn.setAttribute('aria-label', 'Open navigation menu');
    document.body.classList.remove('menu-open');

    // Return focus to hamburger button
    hamburgerBtn.focus();
  }

  function toggleMenu() {
    if (menuOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  // ── Event listeners ───────────────────────────────────────────────────────

  // Hamburger click
  hamburgerBtn.addEventListener('click', toggleMenu);

  // Close menu when a mobile link is clicked
  mobileLinks.forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  // Close menu on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menuOpen) {
      closeMenu();
    }
  });

  // Close menu if viewport resizes to desktop width
  window.addEventListener('resize', function () {
    if (window.innerWidth > 768 && menuOpen) {
      closeMenu();
    }
  }, { passive: true });

})();
