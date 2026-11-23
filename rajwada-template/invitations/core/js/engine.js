/*
 * weds.live invitation engine · engine.js
 *
 * Boots a template page:
 *   <body data-wl-template="rajwada">  +  <div id="wl-app">  +  #wl-loader
 *
 * 1. load + normalise the wedding config (domain/config.js)
 * 2. pick the language (?lang= > guest's last choice > config default)
 * 3. build the render context and let the template render its sections
 * 4. bind shared behaviour (countdown, calendar, map, gallery, RSVP, music, motion)
 * 5. run the envelope, then hand over to the template's entrance choreography
 *
 * URL options: ?to=Guest+Name  ?lang=mr  ?open=1 (skip envelope)
 *              ?s=venue (skip envelope, jump to a section)  ?motion=reduce  ?mode=og
 */
(function (root) {
    'use strict';

    const WL = root.WL;
    const U = WL.util;
    const F = WL.fragments;
    const { html, raw } = U;
    const docEl = document.documentElement;

    WL.i18n.extend({
        en: {
            'meta.title': '{couple} · Wedding Invitation',
            'meta.titleEngagement': '{couple} · Engagement Invitation',
            'meta.description': 'You are invited to celebrate with us on {date}.',
            'meta.descriptionVenue': 'You are invited to celebrate with us on {date} at {venue}.',
            'announcement.default': 'With the blessings of our elders, we joyfully invite you and your family to celebrate the wedding of {first} and {second} on {date}. Your presence will make our celebration complete.',
            'announcement.defaultEngagement': 'With the blessings of our elders, we joyfully invite you and your family to the engagement of {first} and {second} on {date}.',
        },
        mr: {
            'meta.title': '{couple} · शुभविवाह निमंत्रण',
            'meta.titleEngagement': '{couple} · साखरपुडा निमंत्रण',
            'meta.description': '{date} रोजी आपणास सस्नेह निमंत्रण.',
            'meta.descriptionVenue': '{date} रोजी {venue} येथे आपणास सस्नेह निमंत्रण.',
            'announcement.default': 'वडीलधाऱ्यांच्या आशीर्वादाने {first} आणि {second} यांचा शुभविवाह {date} रोजी करण्याचे योजिले आहे. तरी या मंगलप्रसंगी आपण सहकुटुंब, सहपरिवार उपस्थित राहून वधू-वरांस शुभाशीर्वाद द्यावेत, ही नम्र विनंती.',
            'announcement.defaultEngagement': 'वडीलधाऱ्यांच्या आशीर्वादाने {first} आणि {second} यांचा साखरपुडा {date} रोजी करण्याचे योजिले आहे. आपण अवश्य उपस्थित राहावे, ही नम्र विनंती.',
        },
        hi: {
            'meta.title': '{couple} · शुभ विवाह निमंत्रण',
            'meta.titleEngagement': '{couple} · सगाई निमंत्रण',
            'meta.description': '{date} को आपको सादर आमंत्रण।',
            'meta.descriptionVenue': '{date} को {venue} में आपको सादर आमंत्रण।',
            'announcement.default': 'बड़ों के आशीर्वाद से {first} एवं {second} का शुभ विवाह {date} को होना निश्चित हुआ है। इस मंगल अवसर पर आप सपरिवार पधारकर वर-वधू को अपना आशीर्वाद प्रदान करें।',
            'announcement.defaultEngagement': 'बड़ों के आशीर्वाद से {first} एवं {second} की सगाई {date} को होना निश्चित हुई है। आप सपरिवार अवश्य पधारें।',
        },
    });

    const state = { tpl: null, model: null, raw: null, lang: 'en', ctx: null, app: null, stops: [], envelopeOpened: false };

    /* ---------- Context ---------- */

    const GUEST_ALLOWED = /[^\p{L}\p{M}\p{N}\s.,&'’()\-/]/gu;
    const cleanGuest = (value) => U.cleanText(String(value || '').replace(GUEST_ALLOWED, ''), 60);

    const DEVA_LETTER = /[\u0904-\u0939\u0958-\u0961\u0972-\u097F]/;
    function initialOf(name) {
        const s = String(name || '').trim();
        if (!s) return '';
        const deva = s.match(DEVA_LETTER);
        if (deva && s.indexOf(deva[0]) === 0) return deva[0];
        const first = Array.from(s)[0];
        return first.toLocaleUpperCase();
    }

    function buildCtx(model, tpl, lang) {
        const i18n = WL.i18n.create({
            lang, fallback: model.lang.default, numerals: model.lang.numerals,
            layers: [tpl.strings, model.labels],
        });
        const { first, second } = model.couple;
        const main = model.mainEvent;
        const name = (p) => i18n.text(p.name);
        const joiner = i18n.t('joiner');

        const ctx = {
            model, tpl, i18n,
            lang: i18n.lang,
            t: i18n.t,
            has: i18n.has,
            guest: cleanGuest(U.params().get('to')),
            reduced: WL.prefersReducedMotion(),
            html, raw, attrs: U.attrs, u: U,
            name,
            fullName: (p) => i18n.text(p.fullName) || name(p),
            initial: (p) => initialOf(name(p)),
            honorific(p) {
                if (p.honorific === false) return '';
                if (p.honorific) return i18n.text(p.honorific);
                const h = model.couple.honorifics && model.couple.honorifics[i18n.lang];
                return (h && h[p.role]) || '';
            },
            coupleNames(langOverride) {
                if (langOverride && langOverride !== i18n.lang) {
                    const other = WL.i18n.create({ lang: langOverride, fallback: model.lang.default });
                    return `${other.text(first.name)} & ${other.text(second.name)}`;
                }
                return `${name(first)} ${joiner} ${name(second)}`;
            },
            pageUrl: () => root.location.href.split('#')[0] + (root.location.hash.startsWith('#i=') ? root.location.hash : ''),
            icon: (key) => (tpl.icons && (tpl.icons[key] || tpl.icons.default)) || '',
            langAttr: (value) => F.langAttr(ctx, value),
        };

        const venue = main && F.venueOf(ctx, main);
        const vars = {
            groom: name(first.role === 'groom' ? first : second),
            bride: name(first.role === 'bride' ? first : second),
            first: name(first),
            second: name(second),
            date: main && main.date ? i18n.date(main.date, 'full') : '',
            day: main && main.date ? i18n.date(main.date, 'weekday') : '',
            time: main && main.start ? i18n.time(main.start) : '',
            timeLong: main && main.start ? i18n.timeLong(main.start) : '',
            venue: venue ? i18n.text(venue.name) : '',
        };
        ctx.vars = vars;
        ctx.text = (value) => i18n.text(value, vars);
        ctx.announcement = () => {
            const msg = model.announcement.message;
            if (msg) return ctx.text(msg);
            return ctx.t(model.kind === 'engagement' ? 'announcement.defaultEngagement' : 'announcement.default', vars);
        };
        return ctx;
    }

    /* ---------- Language ---------- */

    const langKey = () => `wl:lang:${state.model.id}`;

    function pickLang(model) {
        const fromUrl = U.params().get('lang');
        if (fromUrl && model.lang.available.includes(fromUrl)) return fromUrl;
        const stored = U.storage.get(`wl:lang:${model.id}`);
        if (stored && model.lang.available.includes(stored)) return stored;
        return model.lang.default;
    }

    function setLang(lang) {
        if (lang === state.lang || !state.model.lang.available.includes(lang)) return;
        // Keep the guest's place: remember which section is at the top of the screen.
        const sections = U.$$('#wl-main > [data-section]', state.app);
        const anchor = sections.find((s) => s.getBoundingClientRect().bottom > 80);
        const anchorId = anchor && anchor.getAttribute('data-section');
        const offset = anchor ? anchor.getBoundingClientRect().top : 0;

        state.lang = lang;
        U.storage.set(langKey(), lang);
        render({ first: false });

        const again = anchorId && U.$(`#wl-main > [data-section="${anchorId}"]`, state.app);
        if (again) root.scrollTo(0, again.getBoundingClientRect().top + root.scrollY - offset);
        const btn = U.$(`[data-wl-lang]:not([hidden]) [data-lang="${lang}"]`, state.app) || U.$('.wl-langmenu__toggle', state.app);
        if (btn) btn.focus({ preventScroll: true });
    }

    function bindLang(scope) {
        U.$$('[data-wl-lang] [data-lang]', scope).forEach((b) => b.addEventListener('click', () => setLang(b.getAttribute('data-lang'))));
        U.$$('[data-wl-langmenu]', scope).forEach((menu) => {
            const toggle = U.$('.wl-langmenu__toggle', menu);
            const list = U.$('.wl-langmenu__list', menu);
            const setOpen = (open) => { toggle.setAttribute('aria-expanded', String(open)); list.hidden = !open; };
            toggle.addEventListener('click', () => {
                const open = list.hidden;
                setOpen(open);
                if (open) U.$('[aria-pressed="true"]', list).focus();
            });
            menu.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !list.hidden) { setOpen(false); toggle.focus(); } });
            state.stops.push(U.on(document, 'click', (e) => { if (!menu.contains(e.target)) setOpen(false); }));
        });
    }

    /* ---------- Fonts ---------- */

    function ensureFonts(rawConfig, tpl, lang) {
        const extra = (tpl.fonts && tpl.fonts.extra) || {};
        const blob = JSON.stringify(rawConfig || {}) + (lang === 'en' ? '' : 'अ');
        Object.keys(WL.catalog.SCRIPTS).forEach((script) => {
            const needs = WL.catalog.SCRIPTS[script].test.test(blob);
            docEl.classList.toggle(`wl-script-${script}`, needs);
            if (!needs || !extra[script] || document.querySelector(`link[data-wl-font="${script}"]`)) return;
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = `https://fonts.googleapis.com/css2?${extra[script]}&display=swap`;
            link.setAttribute('data-wl-font', script);
            document.head.appendChild(link);
        });
    }

    function fontsReady(ms) {
        if (!document.fonts || !document.fonts.ready) return U.wait(0);
        return Promise.race([document.fonts.ready, U.wait(ms)]);
    }

    /* ---------- Meta / SEO ---------- */

    function setMeta(selector, attr, value, create) {
        let el = document.head.querySelector(selector);
        if (!el && create) {
            el = document.createElement('meta');
            Object.keys(create).forEach((k) => el.setAttribute(k, create[k]));
            document.head.appendChild(el);
        }
        if (el && value) el.setAttribute(attr, value);
    }

    function applyMeta(ctx) {
        const m = ctx.model;
        const main = m.mainEvent;
        const venue = main && F.venueOf(ctx, main);
        const title = ctx.text(m.seo.title) || ctx.t(m.kind === 'engagement' ? 'meta.titleEngagement' : 'meta.title', { couple: ctx.coupleNames() });
        const description = ctx.text(m.seo.description)
            || ctx.t(venue ? 'meta.descriptionVenue' : 'meta.description', { date: ctx.vars.date || '', venue: venue ? ctx.text(venue.name) : '' });
        document.title = title;
        setMeta('meta[name="description"]', 'content', description, { name: 'description' });
        setMeta('meta[property="og:title"]', 'content', title, { property: 'og:title' });
        setMeta('meta[property="og:description"]', 'content', description, { property: 'og:description' });
        if (!m.seo.indexable) setMeta('meta[name="robots"]', 'content', 'noindex, nofollow', { name: 'robots' });

        const old = document.getElementById('wl-jsonld');
        if (old) old.remove();
        if (main && main.startMs != null) {
            const offsetMin = WL.time.zoneOffset(main.startMs, m.timezone) / 60000;
            const sign = offsetMin >= 0 ? '+' : '-';
            const abs = Math.abs(offsetMin);
            const tz = `${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;
            const ld = {
                '@context': 'https://schema.org',
                '@type': 'Event',
                name: title,
                description,
                startDate: `${main.date}T${main.start || '00:00'}:00${tz}`,
                eventStatus: 'https://schema.org/EventScheduled',
                eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
            };
            if (venue) ld.location = { '@type': 'Place', name: ctx.text(venue.name), address: ctx.text(venue.address) || ctx.text(venue.name) };
            const s = document.createElement('script');
            s.type = 'application/ld+json';
            s.id = 'wl-jsonld';
            s.textContent = JSON.stringify(ld).replace(/</g, '\\u003c');
            document.head.appendChild(s);
        }
        const theme = ctx.tpl.themeColor;
        if (theme) setMeta('meta[name="theme-color"]', 'content', theme, { name: 'theme-color' });
    }

    /* ---------- Rendering ---------- */

    function renderSections(ctx) {
        const out = [];
        ctx.model.sections.forEach((id) => {
            const fn = ctx.tpl.sections && ctx.tpl.sections[id];
            if (!fn) return;
            const markup = fn(ctx);
            if (markup && String(markup).trim()) out.push({ id, html: markup });
        });
        if (ctx.tpl.layout) return ctx.tpl.layout(ctx, out);
        return out.map((s) => s.html);
    }

    function skipEnvelope(model) {
        const p = U.params();
        return !model.envelope.enabled || p.get('open') === '1' || p.has('s');
    }

    function render(opts) {
        const { tpl, model, app } = state;
        const draft = opts.first ? null : WL.rsvp.snapshot(app);
        state.stops.forEach((stop) => { try { stop(); } catch (e) { /* ignore */ } });
        state.stops = [];

        const ctx = buildCtx(model, tpl, state.lang);
        state.ctx = ctx;
        docEl.lang = ctx.lang;
        docEl.dir = ctx.i18n.dir;
        docEl.setAttribute('data-wl-lang', ctx.lang);

        const withEnvelope = !state.envelopeOpened && !skipEnvelope(model) && tpl.envelope;
        app.innerHTML = html`
            ${tpl.defs ? tpl.defs(ctx) : ''}
            ${withEnvelope ? tpl.envelope(ctx) : ''}
            <main id="wl-main" class="wl-main" tabindex="-1">${renderSections(ctx)}</main>
            ${tpl.chrome ? tpl.chrome(ctx) : html`${F.langSwitch(ctx)}${F.musicButton(ctx)}`}
            <div class="wl-sr-only" data-wl-announcer aria-live="polite"></div>`.toString();

        const main = U.$('#wl-main', app);
        WL.widgets.paint(app);
        state.stops.push(
            WL.widgets.bindCountdown(app, ctx),
            WL.widgets.bindCalendar(app, ctx),
            WL.gallery.bind(app, ctx, tpl.lightbox),
        );
        WL.widgets.bindMaps(app);
        WL.widgets.bindCopy(app);
        WL.music.bind(app, ctx);
        WL.rsvp.bind(app, ctx, draft);
        bindLang(app);
        applyMeta(ctx);
        state.stops.push(WL.motion.init(main, { reduced: ctx.reduced }));

        if (tpl.mount) {
            const stop = tpl.mount(ctx, app, { first: opts.first, envelope: !!withEnvelope, opened: state.envelopeOpened });
            if (typeof stop === 'function') state.stops.push(stop);
        }

        const overlay = withEnvelope ? U.$('[data-wl-envelope]', app) : null;
        state.envelope = overlay ? WL.envelope.mount(overlay, {
            main,
            duration: (tpl.timing && tpl.timing.envelope) || 2400,
            fade: (tpl.timing && tpl.timing.envelopeFade) || 900,
            reduced: ctx.reduced,
            onOpening: () => { if (tpl.onOpening) tpl.onOpening(state.ctx, app); },
            onOpened: () => {
                state.envelopeOpened = true;
                if (tpl.onOpened) tpl.onOpened(state.ctx, app);
                main.focus({ preventScroll: true });
            },
        }) : null;
        if (overlay && !opts.first) state.envelope.ready();
        return ctx;
    }

    function renderNotFound(app, tpl) {
        const t = WL.i18n.create({ lang: 'en' }).t;
        docEl.classList.add('wl-is-notfound');
        app.innerHTML = html`<main class="wl-notfound" id="wl-main">
            <h1 class="wl-notfound__title">${t('notFound.title')}</h1>
            <p class="wl-notfound__body">${t('notFound.body')}</p>
            <a class="wl-btn wl-btn--primary" href="https://weds.live/create.html">${t('notFound.cta')}</a>
        </main>`.toString();
        hideLoader();
    }

    function hideLoader() {
        const loader = document.getElementById('wl-loader');
        if (!loader) return;
        loader.classList.add('is-done');
        setTimeout(() => loader.remove(), 700);
    }

    // Templates may lazy-render sections (content-visibility). Render them all
    // for a moment so a deep link lands exactly, then let the browser relax.
    function jumpTo(section) {
        docEl.classList.add('wl-cv-off');
        requestAnimationFrame(() => {
            section.scrollIntoView({ block: 'start' });
            setTimeout(() => docEl.classList.remove('wl-cv-off'), 1200);
        });
    }

    WL.announce = (message) => {
        const el = document.querySelector('[data-wl-announcer]');
        if (!el) return;
        el.textContent = '';
        setTimeout(() => { el.textContent = message; }, 30);
    };

    /* ---------- Boot ---------- */

    async function boot() {
        const app = document.getElementById('wl-app');
        const tpl = WL.templates[document.body.getAttribute('data-wl-template')];
        if (!app || !tpl) {
            console.error('[weds.live] missing #wl-app or unknown data-wl-template');
            return;
        }
        state.app = app;
        state.tpl = tpl;
        docEl.classList.add('wl-js');

        const loaded = await WL.config.load();
        if (loaded.error) { renderNotFound(app, tpl); return; }

        const model = WL.config.normalize(loaded.raw, { defaultSections: tpl.sectionOrder });
        model.warnings.forEach((w) => console.warn('[weds.live] config:', w));
        state.model = model;
        state.raw = loaded.raw;
        state.lang = pickLang(model);
        ensureFonts(loaded.raw, tpl, state.lang);

        if (U.params().get('mode') === 'og' && tpl.og) {
            const ctx = buildCtx(model, tpl, state.lang);
            docEl.classList.add('wl-og');
            docEl.lang = ctx.lang;
            app.innerHTML = html`${tpl.defs ? tpl.defs(ctx) : ''}${tpl.og(ctx)}`.toString();
            hideLoader();
            await fontsReady(4000);
            docEl.setAttribute('data-og-ready', '1');
            return;
        }

        const ctx = render({ first: true });
        await fontsReady(1800);
        hideLoader();

        if (state.envelope) {
            setTimeout(() => state.envelope.ready(), 250);
        } else {
            state.envelopeOpened = true;
            if (tpl.onOpened) tpl.onOpened(ctx, app);
            const target = U.params().get('s');
            const section = target && /^[a-z]{2,20}$/.test(target) && U.$(`#wl-main > [data-section="${target}"]`, app);
            if (section) setTimeout(() => jumpTo(section), 300);
        }
        WL.emit('ready', { ctx });
    }

    root.addEventListener('hashchange', () => {
        if (root.location.hash.startsWith('#i=')) root.location.reload();
    });

    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

    WL.engine = { boot, setLang, state, buildCtx, initialOf };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})(window);
