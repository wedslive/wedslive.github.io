/*
 * weds.live invitation engine · components/widgets.js
 *
 * Behaviour for the fragments in fragments.js. Everything binds through
 * data-wl-* hooks, so any template markup that keeps the hooks works.
 *   countdown  [data-wl-countdown]
 *   calendar   [data-wl-cal] menus and [data-wl-ics] downloads
 *   map        [data-wl-map] click-to-load Google Maps (no iframe cost until asked)
 *   copy       [data-wl-copy]
 *   paint      [data-color] swatches, [data-pos] image focal points (CSP-safe CSSOM)
 */
(function (root) {
    'use strict';

    const WL = root.WL;
    const U = WL.util;
    const F = WL.fragments;

    /* ---------- Countdown ---------- */

    function bindCountdown(scope, ctx) {
        const stops = [];
        U.$$('[data-wl-countdown]', scope).forEach((el) => {
            const target = +el.getAttribute('data-target');
            if (!target) return;
            const values = {};
            U.$$('[data-unit]', el).forEach((u) => { values[u.getAttribute('data-unit')] = U.$('[data-value]', u); });
            const sr = U.$('[data-wl-countdown-sr]', el);
            const done = U.$('[data-wl-countdown-done]', el);
            let lastMinute = -1;
            const pad = (n) => ctx.i18n.num(String(n).padStart(2, '0'));

            stops.push(WL.time.countdown(target, (left) => {
                Object.keys(values).forEach((unit) => {
                    const node = values[unit];
                    if (!node) return;
                    const next = pad(left[unit]);
                    if (node.textContent !== next) {
                        node.textContent = next;
                        node.classList.remove('is-tick');
                        void node.offsetWidth; // restart the CSS tick animation
                        node.classList.add('is-tick');
                    }
                });
                if (sr && left.minutes !== lastMinute) {
                    lastMinute = left.minutes;
                    sr.textContent = ctx.t('countdown.left', { days: ctx.i18n.num(left.days), hours: ctx.i18n.num(left.hours) });
                }
                if (left.done && done) {
                    const sameDay = Date.now() - target < 86400000;
                    done.textContent = ctx.t(sameDay ? 'countdown.today' : 'countdown.done');
                    done.hidden = false;
                    el.classList.add('is-done');
                }
            }));
        });
        return () => stops.forEach((s) => s());
    }

    /* ---------- Calendar ---------- */

    function bindCalendar(scope, ctx) {
        const menus = U.$$('[data-wl-cal]', scope);
        const closeAll = (except) => menus.forEach((m) => {
            if (m === except) return;
            const btn = U.$('.wl-cal__toggle', m);
            const menu = U.$('.wl-cal__menu', m);
            if (btn) btn.setAttribute('aria-expanded', 'false');
            if (menu) menu.hidden = true;
        });

        menus.forEach((m) => {
            const btn = U.$('.wl-cal__toggle', m);
            const menu = U.$('.wl-cal__menu', m);
            btn.addEventListener('click', () => {
                const open = btn.getAttribute('aria-expanded') !== 'true';
                closeAll(m);
                btn.setAttribute('aria-expanded', String(open));
                menu.hidden = !open;
                if (open) { const first = U.$('.wl-cal__item', menu); if (first) first.focus(); }
            });
            m.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && !menu.hidden) { closeAll(); btn.focus(); }
            });
        });

        const offOutside = U.on(document, 'click', (e) => {
            if (!menus.some((m) => m.contains(e.target))) closeAll();
        });

        U.$$('[data-wl-ics]', scope).forEach((b) => b.addEventListener('click', () => {
            const key = b.getAttribute('data-wl-ics');
            const list = ctx.model.events.filter((ev) => ev.startMs != null && (key === 'all' ? ev.listed || ev.main : ev.id === key));
            if (!list.length) return;
            const names = ctx.coupleNames();
            WL.time.downloadIcs(list.map((ev) => F.calendarEntry(ctx, ev)), key === 'all' ? names : `${names}-${key}`, names);
            closeAll();
        }));

        return offOutside;
    }

    /* ---------- Map facade ---------- */

    function bindMaps(scope) {
        U.$$('[data-wl-map]', scope).forEach((wrap) => {
            const btn = U.$('.wl-map__show', wrap);
            if (!btn) return;
            btn.addEventListener('click', () => {
                const src = wrap.getAttribute('data-src');
                if (!/^https:\/\/www\.google\.com\/maps\?/.test(src)) return;
                const frame = document.createElement('iframe');
                frame.className = 'wl-map__frame';
                frame.src = src;
                frame.title = wrap.getAttribute('data-title') || 'Map';
                frame.loading = 'lazy';
                frame.referrerPolicy = 'no-referrer-when-downgrade';
                frame.setAttribute('allowfullscreen', '');
                wrap.appendChild(frame);
                wrap.classList.add('is-loaded');
                btn.remove();
                frame.focus();
            });
        });
    }

    /* ---------- Copy to clipboard ---------- */

    async function copyText(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (e) {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.setAttribute('readonly', '');
            ta.className = 'wl-sr-only';
            document.body.appendChild(ta);
            ta.select();
            let ok = false;
            try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
            ta.remove();
            return ok;
        }
    }

    function bindCopy(scope) {
        U.$$('[data-wl-copy]', scope).forEach((b) => b.addEventListener('click', async () => {
            const label = U.$('span', b) || b;
            const original = label.textContent;
            if (await copyText(b.getAttribute('data-wl-copy'))) {
                label.textContent = b.getAttribute('data-done') || '✓';
                WL.announce(label.textContent);
                setTimeout(() => { label.textContent = original; }, 2200);
            }
        }));
    }

    /* ---------- CSP-safe painting of data values ---------- */

    function paint(scope) {
        U.$$('[data-color]', scope).forEach((el) => {
            const c = U.safeColor(el.getAttribute('data-color'));
            if (c) el.style.backgroundColor = c;
        });
        U.$$('img[data-pos]', scope).forEach((img) => {
            const p = img.getAttribute('data-pos');
            if (/^\d{1,3}% \d{1,3}%$/.test(p)) img.style.objectPosition = p;
        });
    }

    WL.widgets = { bindCountdown, bindCalendar, bindMaps, bindCopy, paint, copyText };
})(window);
