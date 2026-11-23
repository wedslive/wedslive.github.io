/*
 * weds.live invitation engine · domain/config.js
 *
 * Loads a wedding config and normalises it into the model every template
 * renders from. Sources, first match wins:
 *
 *   1. #i=<payload>   links made by /create.html (schema v1) or a v2 config,
 *                     packed exactly like /assets/js/invite-codec.js does.
 *   2. ?c=<name>      a JSON file from the content folder (demos, QA).
 *   3. <script type="application/json" id="wl-config"> inline in the page
 *                     (template demos and published invitations).
 *
 * Every field is untrusted: anyone can hand-craft a #i= link. Strings are
 * trimmed and length-capped, URLs pass through WL.util.safeUrl, numbers are
 * clamped, unknown keys are dropped. Problems become warnings, not crashes.
 */
(function (root) {
    'use strict';

    const WL = root.WL;
    const U = WL.util;
    const { parseDate, parseTime } = WL.i18n;
    const { EVENT_TYPES } = WL.catalog;

    const SECTION_IDS = ['hero', 'announcement', 'couple', 'families', 'countdown', 'events',
        'venue', 'guide', 'gallery', 'rsvp', 'thankyou'];
    const DIETS = ['veg', 'jain', 'vegan', 'nonveg'];
    const SYNTHS = ['synth:tanpura'];

    /* ---------- #i= payload codec (compatible with invite-codec.js) ---------- */

    function decodePayload(str) {
        if (typeof str !== 'string' || !str || str.length > 24000) return null;
        let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
        while (b64.length % 4) b64 += '=';
        try {
            const bin = atob(b64);
            const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
            const data = JSON.parse(new TextDecoder().decode(bytes));
            return data && typeof data === 'object' && !Array.isArray(data) ? data : null;
        } catch (e) {
            return null;
        }
    }

    function encodePayload(obj) {
        const bytes = new TextEncoder().encode(JSON.stringify(obj));
        let bin = '';
        bytes.forEach((b) => { bin += String.fromCharCode(b); });
        return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    // Schema v1 is what /create.html produces today:
    // { v, groom, bride, type, date, time, venue, map, msg, theme, events: [{ name, detail }] }
    function fromV1(d) {
        const ceremonies = (Array.isArray(d.events) ? d.events : [])
            .filter((ev) => ev && typeof ev === 'object' && (ev.name || ev.detail))
            .slice(0, 12)
            .map((ev, i) => ({ id: `ceremony-${i + 1}`, type: 'other', title: ev.name, detail: ev.detail }));
        const mainType = d.type === 'engagement' ? 'engagement' : 'wedding';
        return {
            v: 2,
            source: 'v1',
            kind: mainType,
            couple: { groom: { name: d.groom }, bride: { name: d.bride } },
            announcement: d.msg ? { message: d.msg } : undefined,
            venues: { main: { name: d.venue, mapUrl: d.map } },
            events: [{ id: 'main', type: mainType, date: d.date, start: d.time, venue: 'main', main: true, listed: false }]
                .concat(ceremonies),
            rsvp: { enabled: false },
        };
    }

    /* ---------- Field normalisers ---------- */

    function content(value, max) {
        if (value == null) return null;
        if (typeof value === 'string' || typeof value === 'number') {
            const s = U.cleanText(value, max);
            return s || null;
        }
        if (typeof value !== 'object' || Array.isArray(value)) return null;
        const out = {};
        let any = false;
        Object.keys(value).forEach((k) => {
            if (k === '@lang') {
                if (typeof value[k] === 'string' && /^[a-z]{2,3}$/.test(value[k])) out[k] = value[k];
                return;
            }
            if (!/^([a-z]{2}|\*)$/.test(k)) return;
            const s = U.cleanText(value[k], max);
            if (s) { out[k] = s; any = true; }
        });
        return any ? out : null;
    }

    const int = (value, min, max, fallback) => {
        const n = Math.round(Number(value));
        return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
    };

    const coord = (value, limit) => {
        const n = Number(value);
        return Number.isFinite(n) && Math.abs(n) <= limit ? n : null;
    };

    const colors = (list) => (Array.isArray(list) ? list.map(U.safeColor).filter(Boolean).slice(0, 6) : []);

    const slugId = (value, fallback) =>
        (typeof value === 'string' && /^[a-zA-Z0-9_-]{1,40}$/.test(value) ? value : fallback);

    const UNSPLASH = /^https:\/\/images\.unsplash\.com\//;

    function srcsetFrom(value) {
        if (Array.isArray(value)) {
            return value.map((s) => s && ({ src: U.safeUrl(s.src), w: int(s.width || s.w, 1, 8000, 0) }))
                .filter((s) => s && s.src && s.w);
        }
        if (typeof value === 'string') {
            return value.split(',').map((part) => {
                const m = /^\s*(\S+)\s+(\d{2,4})w\s*$/.exec(part);
                return m ? { src: U.safeUrl(m[1]), w: +m[2] } : null;
            }).filter((s) => s && s.src);
        }
        return [];
    }

    function photo(value) {
        if (!value) return null;
        const p = typeof value === 'string' ? { src: value } : value;
        if (typeof p !== 'object') return null;
        const src = U.safeUrl(p.src);
        if (!src) return null;
        let srcset = srcsetFrom(p.srcset);
        // Unsplash resizes on the fly, so give phones a right-sized file.
        if (!srcset.length && UNSPLASH.test(src)) {
            const base = src.split('?')[0];
            srcset = [480, 800, 1200].map((w) => ({ src: `${base}?auto=format&fit=crop&q=70&w=${w}`, w }));
        }
        const position = typeof p.position === 'string' && /^\d{1,3}% \d{1,3}%$/.test(p.position.trim()) ? p.position.trim() : '';
        return {
            src,
            srcset,
            width: int(p.width, 1, 10000, 0),
            height: int(p.height, 1, 10000, 0),
            alt: content(p.alt, 160),
            caption: content(p.caption, 160),
            position,
        };
    }

    function personFrom(p, role) {
        const x = p && typeof p === 'object' ? p : {};
        const r = ['groom', 'bride', 'partner'].includes(x.role) ? x.role : role;
        return {
            role: r,
            name: content(x.name, 60),
            fullName: content(x.fullName, 100),
            honorific: x.honorific === false ? false : content(x.honorific, 30),
            photo: photo(x.photo),
            parents: content(x.parents, 240),
            relation: content(x.relation, 240),
            bio: content(x.bio, 420),
        };
    }

    function familySide(f) {
        if (!f || typeof f !== 'object') return null;
        const side = { label: content(f.label, 60), members: content(f.members, 400), place: content(f.place, 160) };
        return side.members || side.place ? side : null;
    }

    function venueFrom(v, id) {
        if (!v || typeof v !== 'object') return null;
        const venue = {
            id,
            name: content(v.name, 100),
            city: content(v.city, 60),
            address: content(v.address, 260),
            lat: coord(v.lat, 90),
            lng: coord(v.lng, 180),
            mapUrl: U.safeUrl(v.mapUrl || v.map, { relative: false }),
            note: content(v.note, 260),
            photo: photo(v.photo),
        };
        if (venue.lat == null || venue.lng == null) { venue.lat = null; venue.lng = null; }
        return venue.name || venue.address ? venue : null;
    }

    /* ---------- Normalise ---------- */

    function normalize(input, options) {
        const opts = options || {};
        const warnings = [];
        const warn = (msg) => warnings.push(msg);
        const src = input && typeof input === 'object' ? (input.v === 1 || (!input.v && input.groom) ? fromV1(input) : input) : {};

        const timezone = WL.time.isValidZone(src.timezone) ? src.timezone : 'Asia/Kolkata';
        if (src.timezone && timezone !== src.timezone) warn(`timezone "${src.timezone}" is not a valid IANA zone`);

        const tradition = WL.catalog.TRADITIONS[src.tradition] ? src.tradition : 'none';
        const tradPreset = WL.catalog.tradition(tradition);

        /* Languages */
        const langIn = src.lang && typeof src.lang === 'object' ? src.lang : { default: src.lang };
        let available = (Array.isArray(langIn.available) ? langIn.available : [])
            .filter((l) => WL.i18n.isSupported(l));
        const defaultLang = WL.i18n.isSupported(langIn.default) ? langIn.default : (available[0] || 'en');
        if (!available.includes(defaultLang)) available.unshift(defaultLang);
        available = available.filter((l, i) => available.indexOf(l) === i);
        const numerals = ['native', 'latin', 'auto'].includes(langIn.numerals) ? langIn.numerals : 'auto';

        /* Couple */
        const c = src.couple && typeof src.couple === 'object' ? src.couple : {};
        let first;
        let second;
        if (Array.isArray(c.partners) && c.partners.length >= 2) {
            first = personFrom(c.partners[0], 'partner');
            second = personFrom(c.partners[1], 'partner');
        } else {
            const groom = personFrom(c.groom, 'groom');
            const bride = personFrom(c.bride, 'bride');
            [first, second] = c.order === 'bride-first' ? [bride, groom] : [groom, bride];
        }
        if (!first.name || !second.name) warn('couple names are missing');
        const honorificsOn = c.honorifics !== false && !!tradPreset.honorifics;
        const hashtag = typeof c.hashtag === 'string' && /^#?[\p{L}\p{N}_]{2,40}$/u.test(c.hashtag.trim())
            ? '#' + c.hashtag.trim().replace(/^#/, '') : '';

        /* Venues */
        const venues = {};
        const venueInput = src.venues && typeof src.venues === 'object' ? src.venues : {};
        if (Array.isArray(venueInput)) {
            venueInput.forEach((v, i) => {
                const id = slugId(v && v.id, `venue-${i + 1}`);
                const venue = venueFrom(v, id);
                if (venue) venues[id] = venue;
            });
        } else {
            Object.keys(venueInput).slice(0, 12).forEach((key) => {
                const id = slugId(key, null);
                const venue = id && venueFrom(venueInput[key], id);
                if (venue) venues[id] = venue;
            });
        }

        /* Events */
        const eventInput = Array.isArray(src.events) ? src.events.slice(0, 16) : [];
        const usedIds = new Set();
        let events = eventInput.map((e, i) => {
            if (!e || typeof e !== 'object') return null;
            let id = slugId(e.id, `event-${i + 1}`);
            while (usedIds.has(id)) id += '-x';
            usedIds.add(id);
            const type = EVENT_TYPES[e.type] ? e.type : 'other';
            const date = parseDate(e.date) ? e.date : null;
            if (e.date && !date) warn(`events[${i}].date "${e.date}" must be YYYY-MM-DD`);
            const start = parseTime(e.start || e.time) ? (e.start || e.time).trim() : null;
            const end = parseTime(e.end) ? e.end.trim() : null;
            let venueId = null;
            if (typeof e.venue === 'string' && venues[e.venue]) venueId = e.venue;
            else if (e.venue && typeof e.venue === 'object') {
                const v = venueFrom(e.venue, `${id}-venue`);
                if (v) { venues[v.id] = v; venueId = v.id; }
            } else if (e.venue) warn(`events[${i}].venue "${e.venue}" is not defined in venues`);
            const startMs = date ? WL.time.zonedToUtc(date, start || '00:00', timezone) : null;
            let endMs = null;
            if (date && end) {
                endMs = WL.time.zonedToUtc(date, end, timezone);
                if (endMs <= startMs) endMs += 86400000; // ends after midnight
            } else if (startMs != null) {
                endMs = startMs + WL.catalog.eventType(type).hours * 3600000;
            }
            const ev = {
                id, type,
                title: content(e.title, 80),
                date, start, end,
                onwards: e.onwards != null ? !!e.onwards : !end,
                muhurat: !!e.muhurat,
                venueId,
                spot: content(e.spot, 80),
                dressCode: content(e.dressCode, 140),
                colors: colors(e.colors),
                note: content(e.note, 260),
                detail: content(e.detail, 160),
                main: !!e.main,
                listed: e.listed !== false,
                startMs, endMs,
                icon: WL.catalog.eventType(type).icon,
            };
            return ev.title || ev.date || ev.detail || type !== 'other' ? ev : null;
        }).filter(Boolean);

        // Dated events in time order; undated ones keep their given order after them.
        const dated = events.filter((e) => e.startMs != null).sort((a, b) => a.startMs - b.startMs);
        const undated = events.filter((e) => e.startMs == null);
        events = dated.concat(undated);

        const mainEvent = events.find((e) => e.main)
            || events.find((e) => e.type === tradPreset.mainType)
            || events.find((e) => WL.catalog.eventType(e.type).main)
            || dated[0] || events[0] || null;
        if (mainEvent) mainEvent.main = true;
        if (!mainEvent || !mainEvent.date) warn('no dated main event: the countdown and calendar are hidden');

        const kind = src.kind === 'engagement' || (mainEvent && mainEvent.type === 'engagement') ? 'engagement' : 'wedding';

        const cd = src.countdown && typeof src.countdown === 'object' ? src.countdown : {};
        const cdEvent = events.find((e) => e.id === cd.event && e.startMs != null) || mainEvent;

        /* Sections */
        const sectionList = Array.isArray(src.sections) ? src.sections : (opts.defaultSections || SECTION_IDS);
        const sections = [];
        sectionList.forEach((s) => {
            const id = typeof s === 'string' ? s : (s && s.id);
            const hidden = s && typeof s === 'object' && s.hidden === true;
            if (SECTION_IDS.includes(id) && !hidden && !sections.includes(id)) sections.push(id);
        });

        /* RSVP */
        const r = src.rsvp && typeof src.rsvp === 'object' ? src.rsvp : {};
        // https only; plain http is accepted for a localhost endpoint while developing.
        let endpoint = U.safeUrl(r.endpoint, { relative: false, protocols: ['https:', 'http:'] });
        if (endpoint && endpoint.startsWith('http:') && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(endpoint)) endpoint = '';
        if (r.endpoint && !endpoint) warn('rsvp.endpoint must be an https:// URL');
        const whatsapp = U.normalisePhone(r.whatsapp);
        // "demo" simulates a successful reply without sending anything (template previews).
        let provider = ['endpoint', 'whatsapp', 'demo', 'none'].includes(r.provider) ? r.provider
            : endpoint ? 'endpoint' : whatsapp ? 'whatsapp' : 'none';
        if (provider === 'endpoint' && !endpoint) provider = whatsapp ? 'whatsapp' : 'none';
        if (provider === 'whatsapp' && !whatsapp) provider = 'none';
        const deadline = parseDate(r.deadline) ? r.deadline : null;
        const deadlineMs = deadline ? WL.time.zonedToUtc(deadline, '23:59', timezone) : null;
        const rsvpEventIds = Array.isArray(r.events) ? r.events.filter((id) => events.some((e) => e.id === id)) : null;
        const rsvp = {
            enabled: r.enabled !== false && provider !== 'none',
            provider, endpoint, whatsapp,
            deadline, closed: deadlineMs != null && Date.now() > deadlineMs,
            maxGuests: int(r.maxGuests, 1, 20, 4),
            perEvent: !!r.perEvent,
            events: rsvpEventIds || events.filter((e) => e.listed && e.date).map((e) => e.id),
            diet: r.diet === false ? [] : (Array.isArray(r.diet) ? r.diet.filter((d) => DIETS.includes(d)) : ['veg', 'jain', 'nonveg']),
            phone: r.phone !== false,
            message: r.message !== false,
            note: content(r.note, 260),
        };

        /* Guide */
        const g = src.guide && typeof src.guide === 'object' ? src.guide : {};
        const guide = {
            dressCode: content(g.dressCode, 260),
            colors: colors(g.colors),
            items: (Array.isArray(g.items) ? g.items : []).slice(0, 12).map((it) => it && ({
                icon: typeof it.icon === 'string' && /^[a-z-]{1,24}$/.test(it.icon) ? it.icon : 'info',
                title: content(it.title, 70),
                text: content(it.text, 420),
            })).filter((it) => it && (it.title || it.text)),
            contacts: (Array.isArray(g.contacts) ? g.contacts : []).slice(0, 6).map((ct) => ct && ({
                name: content(ct.name, 60),
                relation: content(ct.relation, 60),
                phone: U.normalisePhone(ct.phone),
                whatsapp: ct.whatsapp === false ? '' : U.normalisePhone(ct.whatsapp || ct.phone),
            })).filter((ct) => ct && ct.name && (ct.phone || ct.whatsapp)),
        };

        /* Gallery, music, envelope, SEO */
        const gal = src.gallery && typeof src.gallery === 'object' ? src.gallery : {};
        const photos = (Array.isArray(gal.photos) ? gal.photos : Array.isArray(src.gallery) ? src.gallery : [])
            .slice(0, 40).map(photo).filter(Boolean);

        const m = src.music && typeof src.music === 'object' ? src.music : {};
        const musicSrc = typeof m.src === 'string' && SYNTHS.includes(m.src) ? m.src : U.safeUrl(m.src);

        const env = src.envelope;
        const envelope = {
            enabled: env !== false && !(env && env.enabled === false),
            monogram: content(env && env.monogram, 16),
        };

        const seo = src.seo && typeof src.seo === 'object' ? src.seo : {};

        const labels = {};
        if (src.labels && typeof src.labels === 'object') {
            Object.keys(src.labels).forEach((l) => {
                if (!WL.i18n.isSupported(l) || typeof src.labels[l] !== 'object') return;
                labels[l] = {};
                Object.keys(src.labels[l]).slice(0, 200).forEach((k) => {
                    const v = U.cleanText(src.labels[l][k], 300);
                    if (/^[a-zA-Z0-9.]{1,60}$/.test(k) && v) labels[l][k] = v;
                });
            });
        }

        const firstName = (p) => (p.name && (typeof p.name === 'string' ? p.name : (p.name.en || p.name[Object.keys(p.name)[0]]))) || '';
        const id = U.hashString([firstName(first), firstName(second), mainEvent && mainEvent.date].join('|'));

        const model = {
            v: 2,
            id,
            source: src.source || 'config',
            template: typeof src.template === 'string' ? src.template : null,
            kind,
            lang: { default: defaultLang, available, numerals },
            timezone,
            tradition,
            invocation: src.invocation === false || src.invocation === 'none' ? null
                : (src.invocation == null || src.invocation === 'auto') ? tradPreset.invocation
                    : content(src.invocation, 160),
            couple: { first, second, honorifics: honorificsOn ? tradPreset.honorifics : null, hashtag },
            announcement: {
                kicker: content(src.announcement && src.announcement.kicker, 80),
                title: content(src.announcement && src.announcement.title, 80),
                message: content(src.announcement && src.announcement.message, 1200),
            },
            families: {
                groom: familySide(src.families && src.families.groom),
                bride: familySide(src.families && src.families.bride),
                blessings: content(src.families && src.families.blessings, 400),
                hosts: content(src.families && src.families.hosts, 400),
                welcome: content(src.families && src.families.welcome, 400),
            },
            venues,
            events,
            mainEvent,
            countdown: { event: cdEvent, targetMs: cdEvent ? cdEvent.startMs : null },
            guide,
            gallery: { kicker: content(gal.kicker, 60), title: content(gal.title, 80), photos },
            music: musicSrc ? { src: musicSrc, title: content(m.title, 80), artist: content(m.artist, 80) } : null,
            rsvp,
            thankyou: {
                title: content(src.thankyou && src.thankyou.title, 80),
                message: content(src.thankyou && src.thankyou.message, 600),
            },
            sections,
            envelope,
            seo: {
                title: content(seo.title, 120),
                description: content(seo.description, 240),
                image: U.safeUrl(seo.image),
                indexable: !!seo.indexable,
            },
            branding: src.branding !== false,
            labels,
            warnings,
        };
        return model;
    }

    /* ---------- Loading ---------- */

    function readInline() {
        const el = document.getElementById('wl-config');
        if (!el) return null;
        try {
            return JSON.parse(el.textContent);
        } catch (e) {
            console.error('[weds.live] The inline #wl-config JSON is not valid:', e.message);
            return null;
        }
    }

    // Resolves to { raw, origin } or { error }.
    async function load() {
        const hashParams = new URLSearchParams(root.location.hash.replace(/^#/, ''));
        if (hashParams.has('i')) {
            const data = decodePayload(hashParams.get('i'));
            return data ? { raw: data, origin: 'link' } : { error: 'invalid-link' };
        }

        const name = U.params().get('c');
        if (name && /^[a-z0-9-]{1,64}$/.test(name)) {
            const base = document.body.getAttribute('data-wl-content') || '../../content/';
            try {
                const res = await fetch(`${base}${name}.json`, { credentials: 'same-origin' });
                if (res.ok) return { raw: await res.json(), origin: 'file' };
                console.warn(`[weds.live] content "${name}" not found (${res.status}); using the inline config`);
            } catch (e) {
                console.warn('[weds.live] could not load content file:', e.message);
            }
        }

        const inline = readInline();
        return inline ? { raw: inline, origin: 'inline' } : { error: 'missing' };
    }

    WL.config = { SECTION_IDS, load, normalize, fromV1, decodePayload, encodePayload, content };
})(window);
