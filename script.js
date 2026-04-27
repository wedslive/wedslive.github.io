// ============================================
// PAGE LOAD HANDLING - Prevent FOUC
// ============================================

// Mark page as loaded once everything is ready
function markPageAsLoaded() {
    document.body.classList.add('loaded');
}

// Wait for both DOM and CSS to be ready
if (document.readyState === 'loading') {
    // DOM is still loading
    document.addEventListener('DOMContentLoaded', markPageAsLoaded);
} else {
    // DOM is already loaded
    markPageAsLoaded();
}

// Fallback: ensure page shows even if there's a delay
window.addEventListener('load', markPageAsLoaded);

// Emergency fallback: show page after 1 second no matter what
setTimeout(markPageAsLoaded, 1000);

// ============================================
// CONFIGURATION DATA LOADER
// ============================================

/**
 * Load and apply configuration data from config.js
 */
function loadConfigData() {
    if (typeof CONFIG === 'undefined') {
        console.error('❌ CONFIG not found. Make sure config.js is loaded before script.js');
        return;
    }

    console.log('✅ Loading configuration data...');

    // Update stats with data-stat attributes
    const statElements = document.querySelectorAll('[data-stat]');
    
    if (statElements.length === 0) {
        console.warn('⚠️ No elements with data-stat attribute found');
        return;
    }
    
    console.log(`📊 Found ${statElements.length} stat elements to update`);
    
    statElements.forEach(element => {
        const statKey = element.getAttribute('data-stat');
        let value = CONFIG.stats[statKey];
        
        if (value !== undefined) {
            // Format the value based on the stat type
            let formattedValue = value;
            
            switch(statKey) {
                case 'invitationsSent':
                case 'happyCouples':
                    formattedValue = value >= 1000 ? `${Math.floor(value / 1000)},${(value % 1000).toString().padStart(3, '0')}+` : `${value}+`;
                    break;
                case 'templates':
                    formattedValue = `${value}+`;
                    break;
                case 'satisfaction':
                    formattedValue = `${value}%`;
                    break;
                case 'averageRating':
                    formattedValue = `${value} / 5`;
                    break;
                default:
                    formattedValue = value;
            }
            
            element.textContent = formattedValue;
            console.log(`  ✓ Updated ${statKey}: ${formattedValue}`);
        } else {
            console.warn(`  ⚠️ No value found for stat key: ${statKey}`);
        }
    });
    
    console.log('✅ Configuration data loaded successfully');
}

// ============================================
// SCROLL RESTORATION
// ============================================

// Disable browser scroll restoration — always start at top
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

// ============================================
// MOBILE MENU FUNCTIONALITY
// ============================================

const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');
const dropdowns = document.querySelectorAll('.dropdown');

/**
 * Toggle mobile menu open/closed
 */
function toggleMobileMenu() {
    const isActive = navMenu.classList.toggle('active');
    hamburger.classList.toggle('active');
    document.body.style.overflow = isActive ? 'hidden' : '';
}

/**
 * Close mobile menu
 */
function closeMobileMenu() {
    hamburger.classList.remove('active');
    navMenu.classList.remove('active');
    document.body.style.overflow = '';
}

// Toggle mobile menu on hamburger click
hamburger.addEventListener('click', toggleMobileMenu);

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
            closeMobileMenu();
        }
    });
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
        closeMobileMenu();
    }
});

// ============================================
// THEME TOGGLE
// ============================================

const themeToggle = document.querySelector('.theme-toggle');

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

// ============================================
// SMOOTH SCROLLING
// ============================================

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

// ============================================
// NAVBAR SCROLL EFFECTS
// ============================================

const navbar = document.querySelector('.navbar');
const navProgress = document.querySelector('.nav-progress');
const sections = document.querySelectorAll('section[id]');
let ticking = false;

/**
 * Handle scroll events for navbar effects
 */
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

// ============================================
// COUNTDOWN TIMER
// ============================================

(function initCountdown() {
    // Get days ahead from config, fallback to 47
    const DAYS_AHEAD = (typeof CONFIG !== 'undefined' && CONFIG.countdown) 
        ? CONFIG.countdown.daysAhead 
        : 47;
        
    const DAYS_OF_WEEK = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const MONTHS = ['January','February','March','April','May','June',
                    'July','August','September','October','November','December'];

    /**
     * Get target date (today + DAYS_AHEAD)
     */
    function getTargetDate() {
        const t = new Date();
        t.setHours(0, 0, 0, 0);
        t.setDate(t.getDate() + DAYS_AHEAD);
        return t;
    }

    /**
     * Format date for display
     */
    function formatDate(d) {
        const day = DAYS_OF_WEEK[d.getDay()].toUpperCase().slice(0, 3);
        return `${day}, ${d.getDate()} ${MONTHS[d.getMonth()].toUpperCase().slice(0,3)} ${d.getFullYear()}`;
    }

    /**
     * Pad number with leading zero
     */
    function pad(n) {
        return String(n).padStart(2, '0');
    }

    /**
     * Update countdown display
     */
    function updateCountdown() {
        const now = new Date();
        const target = getTargetDate();
        target.setHours(23, 59, 59, 999);
        const diff = target - now;

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hrs  = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const min  = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const sec  = Math.floor((diff % (1000 * 60)) / 1000);

        const dEl = document.getElementById('cd-days');
        const hEl = document.getElementById('cd-hrs');
        const mEl = document.getElementById('cd-min');
        const sEl = document.getElementById('cd-sec');

        if (dEl) dEl.textContent = pad(days);
        if (hEl) hEl.textContent = pad(hrs);
        if (mEl) mEl.textContent = pad(min);
        if (sEl) sEl.textContent = pad(sec);
    }

    // Set the date label once
    const dateEl = document.getElementById('cd-date');
    if (dateEl) dateEl.textContent = formatDate(getTargetDate());

    // Update countdown every second
    updateCountdown();
    setInterval(updateCountdown, 1000);
})();

// ============================================
// TEMPLATE FILTER
// ============================================

const filterBtns = document.querySelectorAll('.filter-btn');
const templateCards = document.querySelectorAll('.template-card');
const noResultsMsg = document.querySelector('.templates-no-results');

/**
 * Filter templates by category
 */
function filterTemplates(category) {
    let visibleCount = 0;

    templateCards.forEach(card => {
        const cardCategory = card.dataset.category;
        const shouldShow = category === 'all' || cardCategory === category;
        
        card.style.display = shouldShow ? 'block' : 'none';
        if (shouldShow) visibleCount++;
    });

    // Show/hide no results message
    if (noResultsMsg) {
        noResultsMsg.style.display = visibleCount === 0 ? 'block' : 'none';
    }
}

// Add click handlers to filter buttons
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Update active state
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Filter templates
        const filter = btn.dataset.filter;
        filterTemplates(filter);
    });
});

// ============================================
// INITIALIZATION
// ============================================

// Run on page load
document.addEventListener('DOMContentLoaded', () => {
    // Load configuration data
    loadConfigData();
    
    // Initial scroll handler call
    handleScroll();
    
    // Log initialization (can be removed in production)
    if (window.console && console.log) {
        console.log('weds.live initialized successfully');
        if (typeof CONFIG !== 'undefined') {
            console.log('Configuration loaded:', CONFIG);
        }
    }
});
