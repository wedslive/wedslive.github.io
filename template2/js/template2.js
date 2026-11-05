(function () {
    'use strict';

    const MUSIC_DEFAULT = 'assets/music/sound.wav';

    const galleryImages = [
        { src: 'assets/gallery/1.jpg', alt: 'Aria and Rohan at the beach', caption: 'First trip together — Goa, 2019' },
        { src: 'assets/gallery/2.jpg', alt: 'Aria laughing', caption: 'Candid moments' },
        { src: 'assets/gallery/3.jpg', alt: 'Rohan cooking', caption: 'Sunday mornings' },
        { src: 'assets/gallery/4.jpg', alt: 'Couple selfie', caption: 'Anniversary dinner, 2023' },
        { src: 'assets/gallery/5.jpg', alt: 'Aria and Rohan with friends', caption: 'Housewarming party' },
        { src: 'assets/gallery/6.jpg', alt: 'Rohan proposing', caption: 'The moment — Marine Drive, 2024' },
        { src: 'assets/gallery/7.jpg', alt: 'Engagement ring', caption: 'Yes, a thousand times' },
        { src: 'assets/gallery/8.jpg', alt: 'Pre-wedding shoot', caption: 'Counting down the days' },
    ];

    let audio = null;
    let musicUnavailable = false;
    let welcomeShown = false;
    let scrollLocks = 0;

    const prefersReducedMotion = () =>
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function lockScroll() {
        scrollLocks += 1;
        document.body.classList.add('is-locked');
    }

    function unlockScroll() {
        scrollLocks = Math.max(0, scrollLocks - 1);
        if (scrollLocks === 0) document.body.classList.remove('is-locked');
    }

    function initLoading() {
        const loadingPage = document.getElementById('loading');
        const loadingBar = document.getElementById('loading-bar');
        const loadingCount = document.getElementById('loading-count');
        const progress = loadingPage.querySelector('[role="progressbar"]');

        lockScroll();

        const assets = Array.from(loadingPage.ownerDocument.images).filter(
            img => img.getAttribute('loading') !== 'lazy' && img.currentSrc !== ''
        );

        const total = assets.length;
        let loaded = 0;

        function finish() {
            loadingBar.style.width = '100%';
            loadingCount.textContent = '100%';
            progress.setAttribute('aria-valuenow', '100');
            setTimeout(showWelcome, 250);
        }

        if (total === 0) {
            finish();
            return;
        }

        function update() {
            loaded += 1;
            const percent = Math.min(Math.round((loaded / total) * 100), 100);
            loadingBar.style.width = percent + '%';
            loadingCount.textContent = percent + '%';
            progress.setAttribute('aria-valuenow', String(percent));
            if (loaded === total) finish();
        }

        assets.forEach(asset => {
            if (asset.complete) {
                update();
            } else {
                asset.addEventListener('load', update, { once: true });
                asset.addEventListener('error', update, { once: true });
            }
        });

        setTimeout(finish, 6000);
    }

    function showWelcome() {
        if (welcomeShown) return;
        welcomeShown = true;

        document.getElementById('loading').hidden = true;
        document.getElementById('loading').removeAttribute('aria-busy');

        const welcomePage = document.getElementById('welcome');
        welcomePage.hidden = false;

        initGuestName();
        document.getElementById('open-invitation').focus();
    }

    function initGuestName() {
        const display = document.getElementById('guest-name-display');
        const name = new URLSearchParams(window.location.search).get('to');
        if (!name) return;

        const label = document.createElement('p');
        label.textContent = 'Kepada Yth Bapak/Ibu/Saudara/i';

        const guest = document.createElement('h2');
        guest.textContent = name;

        display.append(label, guest);
    }

    function initAudio() {
        if (audio || musicUnavailable) return null;

        const toggle = document.getElementById('music-toggle');
        audio = new Audio(toggle.dataset.musicSrc || MUSIC_DEFAULT);
        audio.loop = true;
        audio.volume = 0.5;
        audio.addEventListener('error', () => {
            musicUnavailable = true;
            audio = null;
            toggle.hidden = true;
        });
        return audio;
    }

    async function playMusic() {
        if (musicUnavailable) return;
        const aud = initAudio();
        if (!aud) return;

        const toggle = document.getElementById('music-toggle');
        try {
            await aud.play();
            toggle.classList.add('playing');
            toggle.setAttribute('aria-pressed', 'true');
            toggle.setAttribute('aria-label', 'Pause music');
        } catch (err) {
            if (err && err.name === 'NotAllowedError') return;
            musicUnavailable = true;
            toggle.hidden = true;
        }
    }

    function pauseMusic() {
        if (audio) audio.pause();
        const toggle = document.getElementById('music-toggle');
        toggle.classList.remove('playing');
        toggle.setAttribute('aria-pressed', 'false');
        toggle.setAttribute('aria-label', 'Play music');
    }

    function toggleMusic() {
        if (audio && !audio.paused) {
            pauseMusic();
        } else {
            playMusic();
        }
    }

    function openInvitation() {
        const openBtn = document.getElementById('open-invitation');
        openBtn.disabled = true;

        document.getElementById('welcome').hidden = true;
        unlockScroll();

        if (!musicUnavailable) document.getElementById('music-toggle').hidden = false;

        playMusic();
        startCountdown();
        if (!prefersReducedMotion()) launchCelebration();
        initAOS();

        document.getElementById('main').focus();
    }

    function startCountdown() {
        const root = document.querySelector('.hero-countdown');
        if (!root) return;

        const message = root.querySelector('.countdown-message');
        const dEl = root.querySelector('#countdown-days');
        const hEl = root.querySelector('#countdown-hours');
        const mEl = root.querySelector('#countdown-minutes');
        const sEl = root.querySelector('#countdown-seconds');

        const target = new Date(root.dataset.weddingDate).getTime();
        if (Number.isNaN(target)) return;

        const pad = n => String(Math.max(0, n)).padStart(2, '0');

        const tick = () => {
            const diff = target - Date.now();

            if (diff <= 0) {
                root.hidden = true;
                if (message) message.hidden = false;
                return;
            }

            dEl.textContent = pad(Math.floor(diff / 86400000));
            hEl.textContent = pad(Math.floor((diff % 86400000) / 3600000));
            mEl.textContent = pad(Math.floor((diff % 3600000) / 60000));
            sEl.textContent = pad(Math.floor((diff % 60000) / 1000));
        };

        tick();
        setInterval(tick, 1000);
    }

    function launchCelebration() {
        if (typeof window.confetti !== 'function') return;

        const duration = 8000;
        const end = Date.now() + duration;
        const colors = ['#a67c4a', '#d4b88c', '#fdfbf7', '#b88d5a'];
        const randomInRange = (min, max) => Math.random() * (max - min) + min;

        const heart = confetti.shapeFromPath({
            path: 'M167 72c19,-38 37,-56 75,-56 42,0 76,33 76,75 0,76 -76,151 -151,227 -76,-76 -151,-151 -151,-227 0,-42 33,-75 75,-75 38,0 57,18 76,56z',
            matrix: [0.03, 0, 0, 0.03, -5.5, -5.5]
        });

        function frame() {
            const timeLeft = end - Date.now();

            confetti({
                particleCount: 3,
                startVelocity: randomInRange(20, 40),
                spread: randomInRange(60, 120),
                origin: { x: randomInRange(0.2, 0.8), y: 0.9 },
                zIndex: 9998,
                colors: colors,
                scalar: randomInRange(0.8, 1.5)
            });

            colors.forEach(color => {
                confetti({
                    particleCount: 2,
                    startVelocity: 0,
                    ticks: Math.max(40, 100 * (timeLeft / duration)),
                    origin: { x: Math.random(), y: Math.random() * 0.5 },
                    zIndex: 9998,
                    colors: [color],
                    shapes: [heart],
                    drift: randomInRange(-0.8, 0.8),
                    gravity: randomInRange(0.3, 0.8),
                    scalar: randomInRange(0.6, 1.2)
                });
            });

            if (timeLeft > 0) requestAnimationFrame(frame);
        }

        frame();
    }

    function initAOS() {
        if (prefersReducedMotion()) return;

        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        document.querySelectorAll('[data-aos]').forEach(el => {
            const delay = el.dataset.aosDelay || 0;
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = `opacity 0.8s ease ${delay}ms, transform 0.8s ease ${delay}ms`;
            observer.observe(el);
        });
    }

    function initNavigation() {
        const toggle = document.querySelector('.nav-toggle');
        const nav = document.querySelector('.nav-primary');
        const backdrop = document.querySelector('.nav-backdrop');

        function closeMenu() {
            nav.classList.remove('open');
            backdrop.hidden = true;
            toggle.setAttribute('aria-expanded', 'false');
        }

        toggle.addEventListener('click', () => {
            const isOpen = nav.classList.toggle('open');
            backdrop.hidden = !isOpen;
            toggle.setAttribute('aria-expanded', String(isOpen));
        });

        backdrop.addEventListener('click', closeMenu);

        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) closeMenu();
            });
        });

        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && !backdrop.hidden) closeMenu();
        });
    }

    function initGallery() {
        const grid = document.getElementById('gallery-grid');
        const lightbox = document.getElementById('lightbox');
        const lbImage = lightbox.querySelector('.lightbox-image');
        const lbCaption = lightbox.querySelector('.lightbox-caption');

        let currentIndex = 0;

        galleryImages.forEach((img, i) => {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            item.setAttribute('role', 'listitem');
            item.tabIndex = 0;

            const el = document.createElement('img');
            el.src = img.src;
            el.alt = img.alt;
            el.loading = 'lazy';
            el.width = 800;
            el.height = 1000;
            item.appendChild(el);

            item.addEventListener('click', () => openLightbox(i));
            item.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openLightbox(i);
                }
            });
            grid.appendChild(item);
        });

        function updateLightbox() {
            const img = galleryImages[currentIndex];
            lbImage.src = img.src;
            lbImage.alt = img.alt;
            lbCaption.textContent = img.caption || '';
        }

        function navigate(dir) {
            currentIndex = (currentIndex + dir + galleryImages.length) % galleryImages.length;
            updateLightbox();
        }

        function openLightbox(index) {
            currentIndex = index;
            updateLightbox();
            lightbox.hidden = false;
            lockScroll();
            lightbox.querySelector('.lightbox-close').focus();
        }

        function closeLightbox() {
            if (lightbox.hidden) return;
            lightbox.hidden = true;
            unlockScroll();
        }

        lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
        lightbox.querySelector('.lightbox-prev').addEventListener('click', () => navigate(-1));
        lightbox.querySelector('.lightbox-next').addEventListener('click', () => navigate(1));

        lightbox.addEventListener('click', e => {
            if (e.target === lightbox) closeLightbox();
        });

        lightbox.addEventListener('keydown', e => {
            if (e.key === 'Tab') {
                const focusable = lightbox.querySelectorAll('button');
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        });

        document.addEventListener('keydown', e => {
            if (lightbox.hidden) return;
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') navigate(-1);
            if (e.key === 'ArrowRight') navigate(1);
        });
    }

    function initRSVP() {
        const form = document.getElementById('rsvp-form');
        const success = document.getElementById('rsvp-success');
        const guestsWrapper = document.getElementById('guests-count-wrapper');

        form.querySelectorAll('input[name="attending"]').forEach(radio => {
            radio.addEventListener('change', () => {
                guestsWrapper.hidden = radio.value !== 'yes' || !radio.checked;
            });
        });

        form.addEventListener('submit', async e => {
            e.preventDefault();

            if (!form.reportValidity()) return;

            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';

            try {
                const response = await fetch(form.dataset.endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(Object.fromEntries(new FormData(form).entries()))
                });

                if (!response.ok) throw new Error('Request failed: ' + response.status);

                form.hidden = true;
                success.hidden = false;
                success.setAttribute('tabindex', '-1');
                success.focus();
            } catch (err) {
                console.error(err);
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit RSVP';
                const note = form.querySelector('.form-note');
                note.textContent = 'Something went wrong. Please try again, or email us directly.';
                note.classList.add('form-note--error');
            }
        });
    }

    function initSmoothScroll() {
        const header = document.querySelector('.site-header');

        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const target = document.querySelector(this.getAttribute('href'));
                if (!target) return;
                e.preventDefault();
                const top = target.getBoundingClientRect().top + window.pageYOffset - header.offsetHeight;
                window.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
                if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
                target.focus({ preventScroll: true });
            });
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        initLoading();

        document.getElementById('open-invitation').addEventListener('click', openInvitation);
        document.getElementById('music-toggle').addEventListener('click', toggleMusic);

        initNavigation();
        initGallery();
        initRSVP();
        initSmoothScroll();
    });
})();