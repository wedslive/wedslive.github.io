/* weds.live — Main JS */

// ---------- Navbar scroll effect ----------
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
  scrollTopBtn.classList.toggle('visible', window.scrollY > 400);
});

// ---------- Mobile menu ----------
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');

function openMenu() {
  hamburger.classList.add('open');
  mobileMenu.classList.add('open');
  mobileMenuOverlay.classList.add('open');
  hamburger.setAttribute('aria-expanded', 'true');
  hamburger.setAttribute('aria-label', 'Close navigation menu');
  document.body.classList.add('menu-open');
}

function closeMenu() {
  hamburger.classList.remove('open');
  mobileMenu.classList.remove('open');
  mobileMenuOverlay.classList.remove('open');
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.setAttribute('aria-label', 'Menu');
  document.body.classList.remove('menu-open');
}

hamburger.addEventListener('click', () => {
  if (hamburger.classList.contains('open')) {
    closeMenu();
  } else {
    openMenu();
  }
});

// Close menu when clicking overlay
mobileMenuOverlay.addEventListener('click', closeMenu);

mobileMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', closeMenu);
});

// Close menu on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
    closeMenu();
  }
});

// Close menu if viewport resizes to desktop
window.addEventListener('resize', () => {
  if (window.innerWidth > 768 && mobileMenu.classList.contains('open')) {
    closeMenu();
  }
});

// ---------- Scroll to top ----------
const scrollTopBtn = document.getElementById('scrollTop');
scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// ---------- Fade-up on scroll (IntersectionObserver) ----------
const fadeEls = document.querySelectorAll('.fade-up');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
fadeEls.forEach(el => observer.observe(el));

// ---------- Template filter ----------
const filterBtns = document.querySelectorAll('.filter-btn');
const templateCards = document.querySelectorAll('.template-card');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;
    templateCards.forEach(card => {
      const show = filter === 'all' || card.dataset.category === filter;
      card.style.display = show ? 'block' : 'none';
    });
  });
});

// ---------- Floating petals ----------
function createPetals() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const colors = ['#C9748F', '#C9A96E', '#F2D4D7', '#f5c6d0', '#fff'];
  for (let i = 0; i < 18; i++) {
    const petal = document.createElement('div');
    petal.className = 'petal';
    petal.style.cssText = `
      left: ${Math.random() * 100}%;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      width: ${4 + Math.random() * 8}px;
      height: ${4 + Math.random() * 8}px;
      animation-duration: ${6 + Math.random() * 10}s;
      animation-delay: ${Math.random() * 8}s;
      opacity: ${0.3 + Math.random() * 0.5};
    `;
    hero.appendChild(petal);
  }
}
createPetals();

// ---------- Phone countdown demo ----------
function updatePhoneCountdown() {
  const target = new Date();
  target.setDate(target.getDate() + 47);
  target.setHours(10, 0, 0, 0);

  const now = new Date();
  const diff = target - now;

  const days    = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  const el = id => document.getElementById(id);
  if (el('cd-days'))    el('cd-days').textContent    = String(days).padStart(2, '0');
  if (el('cd-hours'))   el('cd-hours').textContent   = String(hours).padStart(2, '0');
  if (el('cd-minutes')) el('cd-minutes').textContent = String(minutes).padStart(2, '0');
  if (el('cd-seconds')) el('cd-seconds').textContent = String(seconds).padStart(2, '0');
}
updatePhoneCountdown();
setInterval(updatePhoneCountdown, 1000);

// ---------- Smooth anchor scroll ----------
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ---------- Counter animation ----------
function animateCounter(el, target, duration = 1800) {
  let start = 0;
  const step = target / (duration / 16);
  const timer = setInterval(() => {
    start += step;
    if (start >= target) { start = target; clearInterval(timer); }
    el.textContent = Math.floor(start).toLocaleString() + (el.dataset.suffix || '');
  }, 16);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      animateCounter(el, parseInt(el.dataset.target));
      counterObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('[data-target]').forEach(el => counterObserver.observe(el));
