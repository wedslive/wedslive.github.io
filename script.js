// Disable browser scroll restoration — always start at top
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

// Mobile Menu Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');
const dropdowns = document.querySelectorAll('.dropdown');

// Toggle mobile menu
hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
    document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
});

// Mobile dropdown toggle
dropdowns.forEach(dropdown => {
    const link = dropdown.querySelector('.nav-link');
    link.addEventListener('click', (e) => {
        if (window.innerWidth <= 968) {
            e.preventDefault();
            dropdown.classList.toggle('active');
        }
    });
});

// Close mobile menu when clicking on a link
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        if (!link.closest('.dropdown') || window.innerWidth > 968) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
        document.body.style.overflow = '';
    }
});

// Navbar scroll effect with class toggle
const navbar = document.querySelector('.navbar');
const navProgress = document.querySelector('.nav-progress');

// Theme Toggle
const themeToggle = document.querySelector('.theme-toggle');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

// Check for saved theme preference or default to light mode
const currentTheme = localStorage.getItem('theme') || 'light';

if (currentTheme === 'dark') {
    document.body.classList.add('dark-mode');
}

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const theme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        
        if (target) {
            const navHeight = document.querySelector('.navbar').offsetHeight;
            const targetPosition = target.offsetTop - navHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Merged scroll listener — navbar class, progress bar, active nav link
const sections = document.querySelectorAll('section[id]');
let ticking = false;

function handleScroll() {
    if (!ticking) {
        requestAnimationFrame(() => {
            const currentScroll = window.pageYOffset;

            // Navbar scrolled class
            navbar.classList.toggle('scrolled', currentScroll > 50);

            // Progress bar
            const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            navProgress.style.width = ((currentScroll / windowHeight) * 100) + '%';

            // Active nav link
            sections.forEach(section => {
                const sectionTop = section.offsetTop - 100;
                const sectionId = section.getAttribute('id');
                const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);

                if (currentScroll > sectionTop && currentScroll <= sectionTop + section.offsetHeight) {
                    navLinks.forEach(link => link.classList.remove('active'));
                    if (navLink) navLink.classList.add('active');
                }
            });

            ticking = false;
        });
        ticking = true;
    }
}

window.addEventListener('scroll', handleScroll);

// Live countdown — always targets today + 47 days, updates daily
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
        const day = DAYS_OF_WEEK[d.getDay()].toUpperCase().slice(0, 3); // MON, TUE…
        return `${day}, ${d.getDate()} ${MONTHS[d.getMonth()].toUpperCase().slice(0,3)} ${d.getFullYear()}`;
    }

    // Set the date label once
    const dateEl = document.getElementById('cd-date');
    if (dateEl) dateEl.textContent = formatDate(getTargetDate());

    function updateCountdown() {
        const now = new Date();
        const target = getTargetDate();
        // target is midnight — add 24h so it counts to end of that day
        target.setHours(23, 59, 59, 999);
        const diff = target - now;

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hrs  = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const min  = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const sec  = Math.floor((diff % (1000 * 60)) / 1000);

        const pad = n => String(n).padStart(2, '0');

        const dEl = document.getElementById('cd-days');
        const hEl = document.getElementById('cd-hrs');
        const mEl = document.getElementById('cd-min');
        const sEl = document.getElementById('cd-sec');

        if (dEl) dEl.textContent = pad(days);
        if (hEl) hEl.textContent = pad(hrs);
        if (mEl) mEl.textContent = pad(min);
        if (sEl) sEl.textContent = pad(sec);
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
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
            if (filter === 'all' || card.dataset.category === filter) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    });
});
