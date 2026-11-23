/*
 * weds.live invitation engine · motion/envelope.js
 *
 * Behaviour for the opening envelope. Each template draws its own envelope
 * (markup + CSS keyframes); this controller only manages state:
 *
 *   [data-wl-envelope]       the full-screen overlay
 *   [data-wl-envelope-open]  the button (usually the seal) that opens it
 *
 * Classes on the overlay: .is-ready -> .is-opening -> .is-opened, after which
 * the overlay is removed. The page underneath is `inert` until then, so
 * keyboard and screen-reader users land on the open button first.
 */
(function (root) {
    'use strict';

    const WL = root.WL;
    const docEl = document.documentElement;

    function setInert(el, value) {
        if (!el) return;
        if (value) {
            el.setAttribute('inert', '');
            el.setAttribute('aria-hidden', 'true');
        } else {
            el.removeAttribute('inert');
            el.removeAttribute('aria-hidden');
        }
    }

    // options: { main, duration (ms of the template's opening), fade (ms), reduced, onOpening, onOpened }
    function mount(overlay, options) {
        const opts = options || {};
        if (!overlay) return null;
        const button = overlay.querySelector('[data-wl-envelope-open]');
        const main = opts.main;
        let state = 'closed';

        docEl.classList.add('wl-locked');
        setInert(main, true);

        function ready() {
            overlay.classList.add('is-ready');
            if (button) button.focus({ preventScroll: true });
        }

        function finish() {
            state = 'opened';
            overlay.classList.add('is-opened');
            docEl.classList.remove('wl-locked');
            setInert(main, false);
            if (opts.onOpened) opts.onOpened();
            WL.emit('envelope:opened');
            setTimeout(() => overlay.remove(), opts.reduced ? 250 : (opts.fade || 900));
        }

        function open() {
            if (state !== 'closed') return;
            state = 'opening';
            overlay.classList.add('is-opening');
            if (button) button.setAttribute('aria-expanded', 'true');
            if (opts.onOpening) opts.onOpening();
            WL.emit('envelope:opening');
            setTimeout(finish, opts.reduced ? 60 : (opts.duration || 2400));
        }

        if (button) button.addEventListener('click', open);
        return { ready, open, get state() { return state; } };
    }

    WL.envelope = { mount, setInert };
})(window);
