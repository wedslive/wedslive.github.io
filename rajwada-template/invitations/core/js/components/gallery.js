/*
 * weds.live invitation engine · components/gallery.js
 *
 * Lightbox for [data-wl-gallery] containers whose buttons carry
 * data-wl-photo="<index>". Uses a native <dialog> (focus trap, Esc and an
 * inert page for free), adds swipe, arrow keys, neighbour preloading and
 * returns focus to the photo that opened it.
 */
(function (root) {
    'use strict';

    const WL = root.WL;
    const U = WL.util;
    const { html } = U;

    let dialog = null;
    let state = null;

    function build(ctx, options) {
        const o = options || {};
        const el = document.createElement('dialog');
        el.className = `wl-lightbox ${o.className || ''}`;
        el.setAttribute('aria-label', ctx.t('gallery.dialog'));
        el.innerHTML = html`
            <div class="wl-lightbox__stage">
                <figure class="wl-lightbox__figure">
                    <img class="wl-lightbox__img" alt="" decoding="async">
                    <figcaption class="wl-lightbox__caption"></figcaption>
                </figure>
            </div>
            <p class="wl-lightbox__counter" aria-live="polite"></p>
            <button type="button" class="wl-lightbox__btn wl-lightbox__close" aria-label="${ctx.t('gallery.close')}">${o.closeIcon || '×'}</button>
            <button type="button" class="wl-lightbox__btn wl-lightbox__prev" aria-label="${ctx.t('gallery.prev')}">${o.prevIcon || '‹'}</button>
            <button type="button" class="wl-lightbox__btn wl-lightbox__next" aria-label="${ctx.t('gallery.next')}">${o.nextIcon || '›'}</button>`.toString();
        document.body.appendChild(el);
        return el;
    }

    function largest(p) {
        return p.srcset && p.srcset.length ? p.srcset[p.srcset.length - 1].src : p.src;
    }

    function show(index, direction) {
        const { ctx, photos } = state;
        const n = photos.length;
        state.index = (index + n) % n;
        const p = photos[state.index];
        const img = U.$('.wl-lightbox__img', dialog);
        const cap = U.$('.wl-lightbox__caption', dialog);
        const figure = U.$('.wl-lightbox__figure', dialog);

        figure.classList.remove('is-from-left', 'is-from-right', 'is-in');
        if (direction) figure.classList.add(direction > 0 ? 'is-from-right' : 'is-from-left');
        img.src = largest(p);
        img.alt = ctx.text(p.alt) || ctx.text(p.caption) || '';
        cap.textContent = ctx.text(p.caption);
        cap.hidden = !cap.textContent;
        U.$('.wl-lightbox__counter', dialog).textContent = ctx.t('gallery.counter', { n: ctx.i18n.num(state.index + 1), total: ctx.i18n.num(n) });
        requestAnimationFrame(() => requestAnimationFrame(() => figure.classList.add('is-in')));

        [1, -1].forEach((d) => { const q = photos[(state.index + d + n) % n]; if (q) { const pre = new Image(); pre.src = largest(q); } });
    }

    function close() {
        if (!dialog || !dialog.open) return;
        dialog.close();
    }

    function bind(scope, ctx, options) {
        const containers = U.$$('[data-wl-gallery]', scope);
        if (!containers.length || !ctx.model.gallery.photos.length) return () => {};
        if (dialog) dialog.remove();
        dialog = build(ctx, options);
        state = { ctx, photos: ctx.model.gallery.photos, index: 0, opener: null };

        U.$('.wl-lightbox__close', dialog).addEventListener('click', close);
        U.$('.wl-lightbox__prev', dialog).addEventListener('click', () => show(state.index - 1, -1));
        U.$('.wl-lightbox__next', dialog).addEventListener('click', () => show(state.index + 1, 1));
        dialog.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') { e.preventDefault(); show(state.index + 1, 1); }
            if (e.key === 'ArrowLeft') { e.preventDefault(); show(state.index - 1, -1); }
        });
        dialog.addEventListener('click', (e) => { if (e.target === dialog || e.target.classList.contains('wl-lightbox__stage')) close(); });
        dialog.addEventListener('close', () => {
            document.documentElement.classList.remove('wl-locked');
            if (state.opener && state.opener.isConnected) state.opener.focus({ preventScroll: true });
        });

        // Swipe left / right on touch screens.
        let start = null;
        dialog.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') start = { x: e.clientX, y: e.clientY }; });
        dialog.addEventListener('pointerup', (e) => {
            if (!start) return;
            const dx = e.clientX - start.x;
            const dy = e.clientY - start.y;
            start = null;
            if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) show(state.index + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
        });

        containers.forEach((c) => c.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-wl-photo]');
            if (!btn) return;
            state.opener = btn;
            show(+btn.getAttribute('data-wl-photo'), 0);
            document.documentElement.classList.add('wl-locked');
            dialog.showModal();
        }));

        return () => { if (dialog) { dialog.remove(); dialog = null; } };
    }

    WL.gallery = { bind, close };
})(window);
