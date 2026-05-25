// Disable browser scroll restoration — always start at top
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

// Footer year — auto-update so the copyright never goes stale
const footerYearEl = document.getElementById('footer-year');
if (footerYearEl) footerYearEl.textContent = new Date().getFullYear();

// Mobile Menu Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');

function setMenuOpen(open) {
    if (!hamburger || !navMenu) return;
    hamburger.classList.toggle('active', open);
    navMenu.classList.toggle('active', open);
    hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
    hamburger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
}

if (hamburger) {
    hamburger.addEventListener('click', () => {
        const isOpen = navMenu.classList.contains('active');
        setMenuOpen(!isOpen);
    });
}

// Close mobile menu when clicking on a link
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        if (window.innerWidth <= 968) setMenuOpen(false);
    });
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (!hamburger || !navMenu) return;
    if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
        setMenuOpen(false);
    }
});

// Close menu on Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navMenu && navMenu.classList.contains('active')) {
        setMenuOpen(false);
        if (hamburger) hamburger.focus();
    }
});

// Theme Toggle
const themeToggle = document.querySelector('.theme-toggle');

// Sync state set by the pre-paint inline script in <head>
function syncThemeAria() {
    if (!themeToggle) return;
    const isDark = document.body.classList.contains('dark-mode');
    themeToggle.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
}
syncThemeAria();

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const theme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
        try { localStorage.setItem('theme', theme); } catch (e) {}
        syncThemeAria();
    });
}

// Smooth scroll handled by CSS (`html { scroll-behavior: smooth }`).
// JS scroll only used to offset for the fixed navbar.
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (!href || href === '#' || href.length < 2) return;
        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        const navHeight = document.querySelector('.navbar')?.offsetHeight || 0;
        window.scrollTo({
            top: target.offsetTop - navHeight,
            behavior: 'smooth'
        });
    });
});

// Merged scroll listener — navbar class, progress bar, active nav link
const navbar = document.querySelector('.navbar');
const navProgress = document.querySelector('.nav-progress');
const sections = document.querySelectorAll('section[id]');
let ticking = false;

function handleScroll() {
    if (ticking) return;
    requestAnimationFrame(() => {
        const currentScroll = window.pageYOffset;

        if (navbar) navbar.classList.toggle('scrolled', currentScroll > 50);

        if (navProgress) {
            const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const pct = windowHeight > 0 ? (currentScroll / windowHeight) * 100 : 0;
            navProgress.style.width = pct + '%';
        }

        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionId = section.getAttribute('id');
            const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
            if (!navLink) return;
            if (currentScroll > sectionTop && currentScroll <= sectionTop + section.offsetHeight) {
                navLinks.forEach(link => link.classList.remove('active'));
                navLink.classList.add('active');
            }
        });

        ticking = false;
    });
    ticking = true;
}

window.addEventListener('scroll', handleScroll, { passive: true });

// Live countdown — always targets today + 47 days, updates every second when visible
(function() {
    const DAYS_AHEAD = 47;

    const DAYS_OF_WEEK = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const MONTHS = ['January','February','March','April','May','June',
                    'July','August','September','October','November','December'];

    function getTargetDate() {
        const t = new Date();
        t.setHours(0, 0, 0, 0);
        t.setDate(t.getDate() + DAYS_AHEAD);
        return t;
    }

    function formatDate(d) {
        const day = DAYS_OF_WEEK[d.getDay()].toUpperCase().slice(0, 3);
        return `${day}, ${d.getDate()} ${MONTHS[d.getMonth()].toUpperCase().slice(0,3)} ${d.getFullYear()}`;
    }

    const dateEl = document.getElementById('cd-date');
    if (dateEl) dateEl.textContent = formatDate(getTargetDate());

    const dEl = document.getElementById('cd-days');
    const hEl = document.getElementById('cd-hrs');
    const mEl = document.getElementById('cd-min');
    const sEl = document.getElementById('cd-sec');

    if (!dEl && !hEl && !mEl && !sEl) return;

    const pad = n => String(n).padStart(2, '0');

    function updateCountdown() {
        const now = new Date();
        const target = getTargetDate();
        target.setHours(23, 59, 59, 999);
        const diff = target - now;

        const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
        const hrs  = Math.max(0, Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
        const min  = Math.max(0, Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)));
        const sec  = Math.max(0, Math.floor((diff % (1000 * 60)) / 1000));

        if (dEl) dEl.textContent = pad(days);
        if (hEl) hEl.textContent = pad(hrs);
        if (mEl) mEl.textContent = pad(min);
        if (sEl) sEl.textContent = pad(sec);
    }

    let timer = null;
    function start() {
        updateCountdown();
        if (timer) clearInterval(timer);
        timer = setInterval(updateCountdown, 1000);
    }
    function stop() {
        if (timer) { clearInterval(timer); timer = null; }
    }

    start();
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) stop(); else start();
    });
})();

// Template filter
const filterBtns = document.querySelectorAll('.filter-btn');
const templateCards = document.querySelectorAll('.template-card');

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.dataset.filter;
        templateCards.forEach(card => {
            const show = filter === 'all' || card.dataset.category === filter;
            card.style.display = show ? '' : 'none';
        });
    });
});
