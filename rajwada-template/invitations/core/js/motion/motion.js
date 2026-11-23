/*
 * weds.live invitation engine · motion/motion.js
 *
 * Declarative, template-agnostic motion. Templates only add attributes:
 *
 *   data-reveal[="up|fade|scale|draw|left|right"]  animate in once when scrolled into view
 *   data-delay="120"                                 extra delay (ms) for one element
 *   data-stagger="90"                                on a parent: children reveal one after another
 *   data-parallax="0.2"                              drift while scrolling (positive = slower than page)
 *   data-inview                                      gets .is-visible while on screen, so CSS can pause
 *                                                    looping animations (lanterns, sparkles) off screen
 *   data-fit[="min px"]                              shrink a one-line heading until it fits its box
 *
 * Only transform and opacity are animated. With reduced motion everything is
 * shown immediately and parallax is off (see WL.prefersReducedMotion).
 */
(function (root) {
    'use strict';

    const WL = root.WL;
    const U = WL.util;
    const docEl = document.documentElement;

    function revealAll(scope) {
        U.$$('[data-reveal]', scope).forEach((el) => el.classList.add('is-in'));
    }

    function applyDelays(scope) {
        U.$$('[data-stagger]', scope).forEach((group) => {
            const step = +group.getAttribute('data-stagger') || 90;
            U.$$('[data-reveal]', group).forEach((el, i) => {
                if (!el.hasAttribute('data-delay')) el.setAttribute('data-delay', String(i * step));
            });
        });
        U.$$('[data-reveal][data-delay]', scope).forEach((el) => {
            U.setVars(el, { '--wl-delay': `${Math.min(4000, +el.getAttribute('data-delay') || 0)}ms` });
        });
    }

    function initReveal(scope, reduced) {
        applyDelays(scope);
        if (reduced || !('IntersectionObserver' in root)) {
            revealAll(scope);
            return () => {};
        }
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-in');
                io.unobserve(entry.target);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
        U.$$('[data-reveal]:not(.is-in)', scope).forEach((el) => io.observe(el));
        return () => io.disconnect();
    }

    function initInView(scope) {
        if (!('IntersectionObserver' in root)) {
            U.$$('[data-inview]', scope).forEach((el) => el.classList.add('is-visible'));
            return () => {};
        }
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => entry.target.classList.toggle('is-visible', entry.isIntersecting));
        }, { rootMargin: '10% 0px 10% 0px' });
        U.$$('[data-inview]', scope).forEach((el) => io.observe(el));
        return () => io.disconnect();
    }

    // Moves layers with the CSS `translate` property so it composes with any
    // transform a template already uses. Only layers near the viewport update.
    function initParallax(scope, reduced) {
        const layers = U.$$('[data-parallax]', scope);
        if (reduced || !layers.length || !('IntersectionObserver' in root)) return () => {};
        const active = new Set();
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => (entry.isIntersecting ? active.add(entry.target) : active.delete(entry.target)));
            update();
        }, { rootMargin: '25% 0px 25% 0px' });
        layers.forEach((el) => io.observe(el));

        function update() {
            const vh = root.innerHeight;
            active.forEach((el) => {
                const speed = Math.max(-1, Math.min(1, parseFloat(el.getAttribute('data-parallax')) || 0));
                const host = el.offsetParent || el.parentElement;
                const r = host.getBoundingClientRect();
                const offset = (r.top + r.height / 2 - vh / 2) * speed;
                el.style.translate = `0 ${offset.toFixed(1)}px`;
            });
        }
        const onScroll = U.rafThrottle(update);
        root.addEventListener('scroll', onScroll, { passive: true });
        root.addEventListener('resize', onScroll, { passive: true });
        update();
        return () => {
            io.disconnect();
            root.removeEventListener('scroll', onScroll);
            root.removeEventListener('resize', onScroll);
            layers.forEach((el) => { el.style.translate = ''; });
        };
    }

    // One-line headings (long names) shrink instead of overflowing or wrapping.
    function fitText(scope) {
        U.$$('[data-fit]', scope).forEach((el) => {
            el.style.fontSize = '';
            const min = +el.getAttribute('data-fit') || 18;
            const available = el.clientWidth;
            const needed = el.scrollWidth;
            if (!available || needed <= available + 1) return;
            const size = parseFloat(getComputedStyle(el).fontSize);
            el.style.fontSize = `${Math.max(min, Math.floor(size * (available / needed) * 0.98))}px`;
        });
    }

    function initFit(scope) {
        fitText(scope);
        const refit = U.debounce(() => fitText(scope), 150);
        root.addEventListener('resize', refit, { passive: true });
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => fitText(scope));
        return () => root.removeEventListener('resize', refit);
    }

    function init(scope, options) {
        const reduced = !!(options && options.reduced);
        docEl.classList.toggle('wl-motion', !reduced);
        docEl.classList.toggle('wl-reduced', reduced);
        const stops = [initReveal(scope, reduced), initInView(scope), initParallax(scope, reduced), initFit(scope)];
        return () => stops.forEach((stop) => stop());
    }

    WL.motion = { init, fitText, revealAll };
})(window);
