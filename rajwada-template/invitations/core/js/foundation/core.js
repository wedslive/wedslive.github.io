/*
 * weds.live invitation engine · foundation/core.js
 *
 * Namespace, auto-escaping HTML templates, URL sanitising and small DOM
 * helpers. Nothing in this file knows about weddings, so every template
 * and engine module can build on it.
 *
 * Content arrives from couples' configs and from hand-craftable #i= links,
 * so every value is untrusted: render it through html`` (escapes by
 * default) and pass every URL through safeUrl().
 */
(function (root) {
    'use strict';

    const WL = (root.WL = root.WL || {});
    WL.version = '1.0.0';
    WL.templates = WL.templates || {};

    /* ---------- Auto-escaping HTML templates ---------- */

    class SafeHTML {
        constructor(value) { this.value = value; }
        toString() { return this.value; }
    }

    const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' };
    const esc = (value) => String(value == null ? '' : value).replace(/[&<>"'`]/g, (c) => ESCAPES[c]);
    const raw = (markup) => new SafeHTML(markup == null ? '' : String(markup));

    function toHtml(value) {
        if (value == null || value === false || value === true) return '';
        if (value instanceof SafeHTML) return value.value;
        if (Array.isArray(value)) return value.map(toHtml).join('');
        return esc(value);
    }

    // html`<p>${text}</p>` escapes every interpolation. Nest html`` or raw()
    // for markup. `cond && html`…`` renders nothing when cond is false.
    function html(strings, ...values) {
        let out = strings[0];
        for (let i = 0; i < values.length; i++) out += toHtml(values[i]) + strings[i + 1];
        return new SafeHTML(out);
    }

    // attrs({ src, alt: '', hidden: true, width: null }) -> ' src="…" alt="" hidden'
    // null / undefined / false are skipped; always produces quoted values.
    function attrs(map) {
        let out = '';
        for (const key of Object.keys(map)) {
            const value = map[key];
            if (value == null || value === false) continue;
            if (!/^[a-zA-Z_:][-a-zA-Z0-9_:.]*$/.test(key)) continue;
            out += value === true ? ` ${key}` : ` ${key}="${esc(value)}"`;
        }
        return new SafeHTML(out);
    }

    /* ---------- Sanitising ---------- */

    const CONTROL_CHARS = /[\u0000-\u001f\u007f-\u009f\u2028\u2029]/;
    const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

    // Returns a safe URL string or '' (never throws). Relative paths are kept
    // as-is when allowed; absolute URLs must use one of `protocols`.
    function safeUrl(value, options) {
        const opts = options || {};
        const protocols = opts.protocols || ['https:', 'http:'];
        const allowRelative = opts.relative !== false;
        if (typeof value !== 'string') return '';
        const v = value.trim();
        if (!v || v.length > 2048 || CONTROL_CHARS.test(v)) return '';
        if (!HAS_SCHEME.test(v)) {
            if (!allowRelative || v.startsWith('//') || v.startsWith('\\')) return '';
            return v;
        }
        try {
            const u = new URL(v);
            return protocols.includes(u.protocol) ? u.href : '';
        } catch (e) {
            return '';
        }
    }

    const safeColor = (value) =>
        (typeof value === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value.trim()))
            ? value.trim() : '';

    // Trims, removes control characters and caps the length of free text.
    function cleanText(value, max) {
        if (value == null) return '';
        const limit = max || 400;
        let s = String(value).replace(/\r\n?/g, '\n').replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, '').trim();
        if (s.length > limit) s = s.slice(0, limit).trim();
        return s;
    }

    // "+91 98220 12345" -> "+919822012345"; '' when it isn't a plausible number.
    function normalisePhone(value) {
        if (typeof value !== 'string' && typeof value !== 'number') return '';
        const s = String(value).trim();
        const digits = s.replace(/\D/g, '');
        if (digits.length < 7 || digits.length > 15) return '';
        return (s.startsWith('+') ? '+' : '') + digits;
    }

    const telHref = (phone) => { const p = normalisePhone(phone); return p ? `tel:${p}` : ''; };
    const waHref = (phone, text) => {
        const p = normalisePhone(phone).replace('+', '');
        if (!p) return '';
        return `https://wa.me/${p}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
    };

    /* ---------- DOM helpers ---------- */

    const $ = (selector, scope) => (scope || document).querySelector(selector);
    const $$ = (selector, scope) => Array.from((scope || document).querySelectorAll(selector));

    function on(target, type, handler, options) {
        target.addEventListener(type, handler, options);
        return () => target.removeEventListener(type, handler, options);
    }

    // CSSOM writes are allowed by a strict CSP, unlike style="" attributes.
    function setVars(el, vars) {
        for (const key of Object.keys(vars)) el.style.setProperty(key, vars[key]);
    }

    function rafThrottle(fn) {
        let queued = false;
        return function throttled() {
            if (queued) return;
            queued = true;
            requestAnimationFrame(() => { queued = false; fn(); });
        };
    }

    function debounce(fn, ms) {
        let timer = null;
        return function debounced() {
            clearTimeout(timer);
            timer = setTimeout(fn, ms);
        };
    }

    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    // Small, stable, non-cryptographic id (FNV-1a) for storage keys.
    function hashString(str) {
        let h = 0x811c9dc5;
        for (let i = 0; i < str.length; i++) {
            h ^= str.charCodeAt(i);
            h = Math.imul(h, 0x01000193);
        }
        return (h >>> 0).toString(36);
    }

    function randomId() {
        if (root.crypto && root.crypto.randomUUID) return root.crypto.randomUUID();
        const bytes = new Uint8Array(16);
        (root.crypto || { getRandomValues: (a) => a.map(() => Math.floor(Math.random() * 256)) }).getRandomValues(bytes);
        return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    }

    const storage = {
        get(key) {
            try { const v = root.localStorage.getItem(key); return v == null ? null : JSON.parse(v); } catch (e) { return null; }
        },
        set(key, value) {
            try { root.localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* private mode / quota */ }
        },
        remove(key) {
            try { root.localStorage.removeItem(key); } catch (e) { /* ignore */ }
        },
    };

    const params = () => new URLSearchParams(root.location.search);

    /* ---------- Events ---------- */

    const listeners = {};
    WL.on = function onEvent(type, fn) {
        (listeners[type] = listeners[type] || []).push(fn);
        return () => { listeners[type] = (listeners[type] || []).filter((f) => f !== fn); };
    };
    WL.emit = function emit(type, detail) {
        (listeners[type] || []).slice().forEach((fn) => {
            try { fn(detail); } catch (e) { console.error('[weds.live]', type, e); }
        });
    };

    /* ---------- Motion preference ---------- */

    const reduceQuery = root.matchMedia ? root.matchMedia('(prefers-reduced-motion: reduce)') : null;
    // ?motion=reduce forces the reduced experience (used by QA and support).
    WL.prefersReducedMotion = () =>
        (reduceQuery ? reduceQuery.matches : false) || params().get('motion') === 'reduce';

    /* ---------- Templates ---------- */

    WL.registerTemplate = function registerTemplate(id, manifest) {
        WL.templates[id] = Object.assign({ id }, manifest);
        return WL.templates[id];
    };

    WL.util = {
        SafeHTML, html, raw, esc, attrs,
        safeUrl, safeColor, cleanText, normalisePhone, telHref, waHref,
        $, $$, on, setVars, rafThrottle, debounce, wait,
        hashString, randomId, storage, params,
    };
})(window);
