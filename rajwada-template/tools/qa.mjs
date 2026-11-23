// End-to-end QA for an invitation template (headless Chrome, no dependencies).
//   node tools/qa.mjs [template=rajwada] [--shots] [--only=journey,layout,...]
//
// Suites
//   layout    360 / 390 / 430 / 1280 widths: no horizontal overflow, hero text
//             stays inside the gateway arch, text never sits under artwork,
//             section screenshots (with --shots)
//   journey   envelope -> hero -> countdown -> calendar -> map -> lightbox ->
//             language switch -> music -> RSVP (demo, endpoint, WhatsApp)
//   compat    links made by /create.html (schema v1), crafted XSS payloads,
//             broken links, other traditions (Muslim, Sikh, Christian), reduced motion
//   perf      transfer size, DOM size, frame times while the envelope opens on a
//             4x CPU-throttled phone profile
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { createServer } from './serve.mjs';
import { launch } from './lib/chrome.mjs';

const args = process.argv.slice(2);
const template = args.find((a) => !a.startsWith('--')) || 'rajwada';
const shots = args.includes('--shots');
const onlyArg = (args.find((a) => a.startsWith('--only=')) || '').slice(7);
const suites = onlyArg ? onlyArg.split(',') : ['layout', 'journey', 'compat', 'perf'];
const OUT = path.resolve('qa-output', template);
mkdirSync(OUT, { recursive: true });

const results = [];
const check = (name, ok, detail = '') => {
    results.push({ ok: !!ok, name, detail });
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  —  ${detail}` : ''}`);
};
const enc = (obj) => Buffer.from(JSON.stringify(obj), 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const { server, received } = createServer();
await new Promise((r) => server.listen(0, r));
const BASE = `http://localhost:${server.address().port}`;
const PAGE = `${BASE}/invitations/templates/${template}/`;
const browser = await launch();
const ev = (expr) => browser.eval(expr);

async function openEnvelope() {
    await browser.waitUntil('document.querySelector("[data-wl-envelope].is-ready")', { timeout: 8000 });
    await browser.click('[data-wl-envelope-open]');
    await browser.waitUntil('!document.querySelector("[data-wl-envelope]")', { timeout: 8000 });
    await sleep(2600);
}

// Every visible text box inside `scope`, as client rects.
const TEXT_RECTS = `(scope) => {
    const out = [];
    const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walker.nextNode())) {
        if (!n.textContent.trim()) continue;
        const el = n.parentElement;
        if (!el || el.closest('[aria-hidden="true"], .wl-sr-only, [hidden], .wl-hp, script, style')) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || +cs.opacity === 0) continue;
        const range = document.createRange();
        range.selectNodeContents(n);
        for (const r of range.getClientRects()) if (r.width > 2 && r.height > 2) out.push({ x: r.left, y: r.top, w: r.width, h: r.height, t: n.textContent.trim().slice(0, 24) });
    }
    return out;
}`;

async function layoutChecks(w, h) {
    await browser.viewport(w, h);
    await browser.goto(`${PAGE}?to=${encodeURIComponent('Rahul Sharma & Family')}`, { settle: 300 });
    const dir = path.join(OUT, `${w}`);
    mkdirSync(dir, { recursive: true });
    await browser.waitUntil('document.querySelector("[data-wl-envelope].is-ready")', { timeout: 8000 });
    await sleep(1400);
    if (shots) await browser.screenshot(path.join(dir, '00-envelope.png'));
    const envOverflow = await ev('document.documentElement.scrollWidth - window.innerWidth');
    check(`${w}px envelope fits the screen`, envOverflow <= 0, `overflow ${envOverflow}px`);
    const envBox = await ev(`(() => { const r = document.querySelector('.rj-env__envelope, [data-wl-envelope-open]').getBoundingClientRect(); return { top: r.top, bottom: r.bottom, h: innerHeight }; })()`);
    check(`${w}px envelope is fully visible`, envBox.top >= 0 && envBox.bottom <= envBox.h, JSON.stringify(envBox));

    await browser.click('[data-wl-envelope-open]');
    await sleep(1150);
    if (shots) await browser.screenshot(path.join(dir, '01-opening.png'));
    await browser.waitUntil('!document.querySelector("[data-wl-envelope]")', { timeout: 8000 });
    await sleep(2800);
    if (shots) await browser.screenshot(path.join(dir, '02-hero.png'));

    // Hero text must sit inside the cusped opening of the gateway.
    const hero = await ev(`(() => {
        const rects = (${TEXT_RECTS})(document.querySelector('.rj-hero__content'));
        const path = document.querySelector('.rj-hero__frame path.rj-strong');
        if (!path) return { error: 'no frame' };
        const svg = path.ownerSVGElement;
        const m = svg.getScreenCTM();
        const len = path.getTotalLength();
        const poly = [];
        for (let i = 0; i <= 400; i++) { const p = path.getPointAtLength(len * i / 400).matrixTransform(m); poly.push([p.x, p.y]); }
        const inside = (x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) c = !c; } return c; };
        const bad = rects.filter((r) => ![[r.x, r.y], [r.x + r.w, r.y], [r.x, r.y + r.h], [r.x + r.w, r.y + r.h]].every(([x, y]) => inside(x, y)));
        const els = [...document.querySelectorAll('.rj-hero__elephant')].map((e) => e.getBoundingClientRect());
        const underEl = rects.filter((r) => els.some((e) => r.x < e.right && r.x + r.w > e.left && r.y < e.bottom && r.y + r.h > e.top));
        return { n: rects.length, outside: bad.map((r) => r.t), underElephants: underEl.map((r) => r.t) };
    })()`);
    check(`${w}px hero text stays inside the arch`, hero.n > 4 && !hero.outside.length, hero.outside.length ? `outside: ${hero.outside.join(' | ')}` : `${hero.n} text boxes`);
    check(`${w}px hero text clear of the elephants`, !hero.underElephants.length, hero.underElephants.join(' | '));

    // Every section: no overflow, no text under decorative art.
    const sections = await ev(`[...document.querySelectorAll('#wl-main > [data-section]')].map((s) => s.getAttribute('data-section'))`);
    for (const id of sections) {
        // Scroll through the section the way a guest would, so reveals fire.
        const span = await ev(`(() => { const r = document.querySelector('#wl-main > [data-section="${id}"]').getBoundingClientRect(); return { top: r.top + scrollY, h: r.height }; })()`);
        for (let y = span.top; y < span.top + span.h; y += Math.round(h * 0.6)) {
            await ev(`window.scrollTo(0, ${y})`);
            await sleep(160);
        }
        await ev(`window.scrollTo(0, ${span.top})`);
        await sleep(1300);
        const res = await ev(`(() => {
            const s = document.querySelector('#wl-main > [data-section="${id}"]');
            const rects = (${TEXT_RECTS})(s);
            const art = [...s.querySelectorAll('.rj-panel__corner, .rj-letter__corner, .rj-cd__lantern, .rj-thanks__elephant, .rj-hero__wing, .rj-thanks__gate')]
                .map((e) => ({ r: e.getBoundingClientRect(), c: e.getAttribute('class').split(' ')[0] }));
            const hits = [];
            rects.forEach((t) => art.forEach((a) => {
                const ix = Math.min(t.x + t.w, a.r.right) - Math.max(t.x, a.r.left);
                const iy = Math.min(t.y + t.h, a.r.bottom) - Math.max(t.y, a.r.top);
                if (ix > 3 && iy > 3) hits.push(t.t + ' × ' + a.c);
            }));
            const clipped = [...s.querySelectorAll('h1, h2, h3, p, dd, .wl-btn, label, legend')].filter((el) => {
                if (el.closest('[aria-hidden="true"]')) return false;
                const cs = getComputedStyle(el);
                return cs.overflow !== 'visible' ? false : el.scrollWidth > el.clientWidth + 2 && cs.whiteSpace === 'nowrap';
            }).map((el) => el.textContent.trim().slice(0, 30));
            const small = [...s.querySelectorAll('button, a')].filter((b) => {
                if (b.closest('[hidden], [aria-hidden="true"]') || b.offsetParent === null) return false;
                const r = b.getBoundingClientRect();
                return r.width < 40 || r.height < 40;
            }).map((b) => (b.getAttribute('aria-label') || b.textContent).trim().slice(0, 24));
            return { hits, clipped, small, height: Math.round(s.getBoundingClientRect().height), overflow: document.documentElement.scrollWidth - innerWidth };
        })()`);
        check(`${w}px ${id}: no horizontal overflow`, res.overflow <= 0, `${res.overflow}px`);
        check(`${w}px ${id}: text clear of artwork`, !res.hits.length, res.hits.slice(0, 4).join(' | '));
        check(`${w}px ${id}: no clipped one-line text`, !res.clipped.length, res.clipped.join(' | '));
        check(`${w}px ${id}: touch targets >= 40px`, !res.small.length, res.small.slice(0, 5).join(' | '));
        if (shots) {
            const box = await ev(`(() => { const r = document.querySelector('#wl-main > [data-section="${id}"]').getBoundingClientRect(); return { x: 0, y: r.top + scrollY, width: innerWidth, height: Math.min(r.height, 4200) }; })()`);
            await browser.screenshot(path.join(dir, `s-${id}.png`), { clip: box });
        }
    }
    const errs = browser.errors.filter((e) => !/favicon/.test(e));
    check(`${w}px no console errors`, !errs.length, errs.join(' | '));
}

async function journey() {
    await browser.viewport(390, 844);
    await browser.goto(`${PAGE}?to=${encodeURIComponent('Rahul Sharma')}`, { settle: 300 });
    const env = await ev(`({ guest: document.querySelector('.rj-env__to-name')?.textContent.trim(), inert: document.getElementById('wl-main').hasAttribute('inert'), focus: document.activeElement?.hasAttribute('data-wl-envelope-open'), locked: document.documentElement.classList.contains('wl-locked') })`);
    await sleep(600);
    const focus2 = await ev(`document.activeElement?.hasAttribute('data-wl-envelope-open')`);
    check('envelope greets the guest by name', env.guest === 'Rahul Sharma', env.guest);
    check('page behind the envelope is inert and scroll-locked', env.inert && env.locked);
    check('envelope button gets keyboard focus', focus2);

    await browser.key('Enter', 'Enter', 13);
    await browser.waitUntil('!document.querySelector("[data-wl-envelope]")', { timeout: 8000 });
    const after = await ev(`({ inert: document.getElementById('wl-main').hasAttribute('inert'), locked: document.documentElement.classList.contains('wl-locked'), h1: document.querySelector('h1')?.textContent.replace(/\\s+/g, ' ').trim() })`);
    check('Enter opens the envelope, page becomes interactive', !after.inert && !after.locked, after.h1);
    check('hero shows both names', /Aniruddha/.test(after.h1) && /Gayatri/.test(after.h1), after.h1);

    const c1 = await ev(`document.querySelector('[data-unit="seconds"] [data-value]').textContent`);
    await sleep(1300);
    const c2 = await ev(`document.querySelector('[data-unit="seconds"] [data-value]').textContent`);
    const days = await ev(`document.querySelector('[data-unit="days"] [data-value]').textContent`);
    check('countdown ticks every second', c1 !== c2 && Number(days) > 0, `${days} days, ${c1} -> ${c2}`);
    const target = await ev(`+document.querySelector('[data-wl-countdown]').getAttribute('data-target')`);
    check('countdown targets 12:31 IST on 6 Feb 2027 (07:01 UTC)', new Date(target).toISOString() === '2027-02-06T07:01:00.000Z', new Date(target).toISOString());

    // Calendar: menu + .ics contents
    await browser.click('.rj-sec--countdown .wl-cal__toggle');
    const menuOpen = await ev(`!document.querySelector('.rj-sec--countdown .wl-cal__menu').hidden`);
    const gHref = await ev(`document.querySelector('.rj-sec--countdown .wl-cal__item').href`);
    check('calendar menu opens with a Google Calendar link', menuOpen && /calendar\.google\.com.*dates=20270206T070100Z%2F20270206T100100Z/.test(gHref), gHref.slice(0, 120));
    // Capture the generated file (the page's CSP rightly forbids fetch(blob:)).
    await ev(`(() => {
        window.__dl = null;
        const blobs = new Map();
        const create = URL.createObjectURL.bind(URL);
        URL.createObjectURL = (b) => { const u = create(b); blobs.set(u, b); return u; };
        const orig = HTMLAnchorElement.prototype.click;
        HTMLAnchorElement.prototype.click = function () {
            if (this.download) { window.__dl = { name: this.download, blob: blobs.get(this.href) }; return; }
            return orig.call(this);
        };
    })()`);
    await browser.click('.rj-sec--countdown [data-wl-ics]');
    await sleep(200);
    const readIcs = `(async () => { if (!window.__dl || !window.__dl.blob) return null; return { name: window.__dl.name, t: await window.__dl.blob.text() }; })()`;
    const ics = await ev(readIcs);
    check('.ics download has the wedding in UTC with a reminder', ics && /BEGIN:VCALENDAR/.test(ics.t) && /DTSTART:20270206T070100Z/.test(ics.t) && /BEGIN:VALARM/.test(ics.t) && ics.t.split('\r\n').every((l) => new TextEncoder().encode(l).length <= 75), ics ? ics.name + (ics.err || '') : 'no download');
    await ev('window.__dl = null');
    await browser.click('.rj-sec--events [data-wl-ics="all"]');
    await sleep(200);
    const allIcs = await ev(readIcs);
    const all = allIcs ? (allIcs.t.match(/BEGIN:VEVENT/g) || []).length : 0;
    check('"add all" exports every ceremony', all === 5, `${all} events`);

    // Map facade
    await browser.click('.rj-venue .wl-map__show');
    await sleep(300);
    const frame = await ev(`document.querySelector('.rj-venue .wl-map__frame')?.src || ''`);
    check('map loads only on request, from google.com/maps', /^https:\/\/www\.google\.com\/maps\?q=16\.7188%2C74\.2365/.test(frame), frame.slice(0, 80));
    const dir = await ev(`document.querySelector('.rj-venue .wl-actions a').href`);
    check('directions link opens Google Maps', /google\.com\/maps\/dir\/\?api=1&destination=16\.7188/.test(dir), dir);

    // Lightbox
    await browser.click('.rj-gallery [data-wl-photo="0"]');
    await sleep(400);
    const lb1 = await ev(`({ open: document.querySelector('.wl-lightbox').open, count: document.querySelector('.wl-lightbox__counter').textContent, cap: document.querySelector('.wl-lightbox__caption').textContent })`);
    await browser.key('ArrowRight', 'ArrowRight', 39);
    await sleep(300);
    const lb2 = await ev(`document.querySelector('.wl-lightbox__counter').textContent`);
    await browser.key('Escape', 'Escape', 27);
    await sleep(300);
    const lb3 = await ev(`({ open: document.querySelector('.wl-lightbox').open, focus: document.activeElement?.getAttribute('data-wl-photo') })`);
    check('lightbox opens, arrows navigate, Esc closes and restores focus', lb1.open && lb1.count === '1 / 8' && lb2 === '2 / 8' && !lb3.open && lb3.focus === '0', `${lb1.count} -> ${lb2}, caption "${lb1.cap}"`);

    // Music (Web Audio tanpura)
    await ev(`document.querySelector('.rj-hero').scrollIntoView()`);
    await browser.click('.rj-hero__music');
    await sleep(900);
    const m1 = await ev(`document.querySelector('.rj-hero__music').getAttribute('aria-pressed')`);
    await browser.click('.rj-hero__music');
    await sleep(300);
    const m2 = await ev(`document.querySelector('.rj-hero__music').getAttribute('aria-pressed')`);
    check('music plays and pauses from a tap (never autoplays)', m1 === 'true' && m2 === 'false', `${m1} -> ${m2}`);

    // Language switch (closing section) keeps the RSVP draft
    await ev(`document.querySelector('.rj-sec--rsvp').scrollIntoView()`);
    await sleep(500);
    await ev(`document.querySelector('[name="message"]').value = 'Shubhechha!'`);
    await browser.click('.rj-thanks__lang [data-lang="mr"]');
    await sleep(700);
    const mr = await ev(`({ lang: document.documentElement.lang, h1: document.querySelector('h1').textContent.replace(/\\s+/g, ' ').trim(), date: document.querySelector('.rj-hero__numeric').textContent, kept: document.querySelector('[name="message"]').value, title: document.title, inv: document.querySelector('.rj-hero__invocation').textContent })`);
    check('switching to Marathi re-renders in Devanagari with Marathi numerals', mr.lang === 'mr' && /अनिरुद्ध/.test(mr.h1) && mr.date === '०६ · ०२ · २०२७' && /श्री गणेशाय नमः/.test(mr.inv), `${mr.h1} · ${mr.date}`);
    check('RSVP draft survives the language switch', mr.kept === 'Shubhechha!', mr.kept);
    const deadline = await ev(`document.querySelector('.rj-rsvp__deadline').textContent`);
    check('Marathi dates read naturally', /२० जानेवारी, २०२७/.test(deadline), deadline);
    const muhurat = await ev(`document.querySelector('.rj-prose').textContent`);
    check('Marathi announcement spells out the muhurat', /दुपारी १२ वाजून ३१ मिनिटांनी/.test(muhurat) && /चि\. सौ\. कां\. गायत्री/.test(muhurat), muhurat.slice(0, 60));
    if (shots) {
        for (const id of ['hero', 'announcement', 'countdown', 'events']) {
            await ev(`document.querySelector('[data-section="${id}"]').scrollIntoView()`);
            await sleep(1200);
            const box = await ev(`(() => { const r = document.querySelector('[data-section="${id}"]').getBoundingClientRect(); return { x: 0, y: r.top + scrollY, width: innerWidth, height: Math.min(r.height, 2600) }; })()`);
            await browser.screenshot(path.join(OUT, `mr-${id}.png`), { clip: box });
        }
    }
    await browser.click('.rj-thanks__lang [data-lang="hi"]');
    await sleep(600);
    const hi = await ev(`({ time: document.querySelector('.rj-muhurat__time').textContent, msg: document.querySelector('.rj-prose').textContent })`);
    check('Hindi uses Hindi time words', /दोपहर 12:31 बजे/.test(hi.time) && /दोपहर 12 बजकर 31 मिनट पर/.test(hi.msg), hi.time);
    if (shots) {
        await ev(`document.querySelector('.rj-hero').scrollIntoView()`);
        await sleep(500);
        await browser.screenshot(path.join(OUT, 'hero-hi.png'));
    }
    await browser.click('.rj-thanks__lang [data-lang="en"]');
    await sleep(600);

    // RSVP validation + demo submit
    await ev(`document.querySelector('[name="name"]').value = ''`);
    await browser.click('.wl-rsvp__submit');
    await sleep(200);
    const v = await ev(`({ summary: !document.querySelector('.wl-rsvp__summary').hidden, nameErr: document.getElementById('wl-rsvp-name-error').textContent, focus: document.activeElement?.name })`);
    check('RSVP validation flags missing fields and focuses the first', v.summary && v.nameErr && v.focus === 'name', v.nameErr);
    await ev(`document.querySelector('[name="name"]').value = 'Rahul Sharma'`);
    await browser.click('.wl-choice__option--yes');
    await browser.click('[data-step="1"]');
    await browser.click('[data-step="1"]');
    const guests = await ev(`document.querySelector('[name="guests"]').value`);
    await browser.click('.wl-rsvp__submit');
    await browser.waitUntil('!document.querySelector("[data-wl-rsvp-done]").hidden', { timeout: 5000 });
    const done = await ev(`({ text: document.querySelector('.wl-rsvp__thanks').textContent, stored: localStorage.length })`);
    check('RSVP (demo) accepts and thanks the guest by name', guests === '3' && /Rahul Sharma/.test(done.text), `${guests} guests · ${done.text}`);
    await browser.goto(`${PAGE}?open=1`, { settle: 1200 });
    const remembered = await ev(`!document.querySelector('[data-wl-rsvp-done]').hidden`);
    check('returning guest sees their reply instead of a blank form', remembered);
    await ev('localStorage.clear()');

    // Endpoint provider against the local mock server (a trimmed config keeps
    // the #i= link under the 24 KB cap the engine accepts).
    const raw = await ev(`JSON.parse(document.getElementById('wl-config').textContent)`);
    delete raw.gallery; delete raw.guide; delete raw.families; delete raw.thankyou;
    raw.rsvp = { provider: 'endpoint', endpoint: `${BASE}/__rsvp`, maxGuests: 4, perEvent: true };
    await browser.goto(`${PAGE}?open=1#i=${enc(raw)}`, { settle: 1200 });
    await sleep(2600);
    await ev(`document.querySelector('.rj-sec--rsvp').scrollIntoView()`);
    await ev(`document.querySelector('[name="name"]').value = 'Meera Iyer'`);
    await browser.click('.wl-choice__option--yes');
    await browser.click('.wl-rsvp__submit');
    await browser.waitUntil('!document.querySelector("[data-wl-rsvp-done]").hidden', { timeout: 6000 });
    const got = received[received.length - 1];
    check('endpoint RSVP posts a simple text/plain JSON request', got && got.json && got.json.name === 'Meera Iyer' && got.json.attending === true && /text\/plain/.test(got.contentType) && /^[0-9a-f-]{32,36}$/.test(got.json.key), got ? JSON.stringify(got.json).slice(0, 140) : 'nothing received');
    const keyBefore = got && got.json.key;
    await browser.click('.wl-rsvp__change');
    await browser.click('.wl-choice__option--no');
    await browser.click('.wl-rsvp__submit');
    await browser.waitUntil('!document.querySelector("[data-wl-rsvp-done]").hidden', { timeout: 6000 });
    const got2 = received[received.length - 1];
    check('changing a reply reuses the same idempotency key', got2.json.key === keyBefore && got2.json.attending === false);
    await ev(`(() => { localStorage.clear(); document.querySelector('.wl-rsvp__change').click(); document.querySelector('[name="website"]').value = 'spam'; document.querySelector('[name="name"]').value = 'Bot'; document.querySelector('[name="attending"][value="yes"]').checked = true; })()`);
    const before = received.length;
    await ev(`document.querySelector('.wl-rsvp__submit').click()`);
    await sleep(600);
    check('honeypot submissions are silently dropped', received.length === before);

    // WhatsApp provider
    raw.rsvp = { provider: 'whatsapp', whatsapp: '+91 90000 00009', perEvent: false, diet: false };
    await browser.goto(`${PAGE}?open=1#i=${enc(raw)}`, { settle: 1200 });
    await sleep(2600);
    await ev(`(() => { window.__opened = null; window.open = (u) => { window.__opened = u; return {}; }; })()`);
    await ev(`document.querySelector('[name="name"]').value = 'Kabir'`);
    await browser.click('.wl-choice__option--yes');
    await browser.click('.wl-rsvp__submit');
    await sleep(400);
    const wa = await ev('window.__opened');
    check('WhatsApp RSVP opens wa.me with a pre-written reply', /^https:\/\/wa\.me\/919000000009\?text=/.test(wa || '') && decodeURIComponent(wa.split('text=')[1]).includes('Kabir'), wa ? decodeURIComponent(wa.split('text=')[1]).replace(/\n/g, ' / ') : 'not opened');
    await ev('localStorage.clear()');
}

async function compat() {
    await browser.viewport(390, 844);
    // Link generated by today's /create.html (schema v1)
    const v1 = {
        v: 1, groom: 'Mangesh', bride: 'Pooja', type: 'wedding', date: '2026-12-12', time: '12:19',
        venue: 'Aarti Celebration, Nandura, Dist. Buldhana', map: 'https://maps.app.goo.gl/cCj7rQNzKZRLdzBC6', theme: 'rose',
        msg: 'With the blessings of our families, we joyfully invite you.',
        events: [{ name: "Pooja's Mehndi", detail: '10 Dec 2026, 4:00 PM onwards' }, { name: 'Haldi Ceremony', detail: '12 Dec 2026, 7:00 AM' }],
    };
    await browser.goto(`${PAGE}?to=Uncle%20Ramesh#i=${enc(v1)}`, { settle: 600 });
    const v1env = await ev(`document.querySelector('.rj-env__to-name')?.textContent`);
    await openEnvelope();
    const v1view = await ev(`({ h1: document.querySelector('h1').textContent.replace(/\\s+/g, ' ').trim(), events: document.querySelectorAll('.rj-event').length, msg: document.querySelector('.rj-prose')?.textContent.trim(), dir: document.querySelector('.rj-venue .wl-actions a')?.href, gallery: !!document.querySelector('.rj-sec--gallery'), rsvp: !!document.querySelector('.rj-sec--rsvp'), robots: document.querySelector('meta[name="robots"]')?.content })`);
    check('v1 links from /create.html render in Rajwada', /Mangesh/.test(v1view.h1) && /Pooja/.test(v1view.h1) && v1view.events === 2 && v1view.msg === v1.msg && v1view.dir === v1.map && v1env === 'Uncle Ramesh', JSON.stringify(v1view).slice(0, 160));
    check('sections without data are hidden (gallery, RSVP)', !v1view.gallery && !v1view.rsvp);
    check('personal invitations are not indexed', v1view.robots === 'noindex, nofollow', v1view.robots);
    check('v1 render has no console errors', !browser.errors.filter((e) => !/favicon/.test(e)).length, browser.errors.join(' | '));

    // Crafted payloads must stay inert
    const evil = {
        v: 2, couple: { groom: { name: '<img src=x onerror="window.__xss=1">' }, bride: { name: 'B<script>window.__xss=2</script>' } },
        events: [{ type: 'wedding', date: '2027-01-01', start: '10:00', venue: 'v' }],
        venues: { v: { name: 'Hall', mapUrl: 'javascript:window.__xss=3', lat: 'nope' } },
        gallery: { photos: [{ src: 'javascript:alert(1)' }, { src: 'https://example.com/a.jpg', caption: '<b>x</b>' }] },
        music: { src: 'javascript:alert(2)' },
        rsvp: { provider: 'endpoint', endpoint: 'http://evil.example/collect' },
        sections: ['hero', 'gallery', 'venue', 'rsvp', '__proto__'],
        labels: { en: { 'hero.weddingOf': '<i onmouseover=alert(3)>hi</i>' } },
    };
    await browser.goto(`${PAGE}?open=1#i=${enc(evil)}`, { settle: 1500 });
    const x = await ev(`({ xss: window.__xss, injected: document.querySelectorAll('#wl-main img[src="x"], #wl-main script, #wl-main [onerror], #wl-main [onmouseover], #wl-main b').length, mapLinks: [...document.querySelectorAll('#wl-main a')].filter((a) => a.href.startsWith('javascript')).length, photos: document.querySelectorAll('.wl-gallery__img').length, rsvp: !!document.querySelector('[data-wl-rsvp]'), music: !!document.querySelector('[data-wl-music]'), h1: document.querySelector('h1').textContent.slice(0, 40) })`);
    check('crafted links cannot inject markup or javascript: URLs', x.xss === undefined && x.injected === 0 && x.mapLinks === 0, JSON.stringify(x));
    check('unsafe photo / music / plain-http RSVP URLs are dropped', x.photos === 1 && !x.rsvp && !x.music);

    await browser.goto(`${PAGE}#i=eyJncm9vbSI6`, { settle: 800 });
    const nf = await ev(`document.querySelector('.wl-notfound__title')?.textContent`);
    check('a truncated link shows a friendly message', /incomplete/.test(nf || ''), nf);

    // Other traditions keep their own invocation and ceremony names
    const base = await (async () => { await browser.goto(`${PAGE}?open=1`, { settle: 600 }); return ev(`JSON.parse(document.getElementById('wl-config').textContent)`); })();
    delete base.gallery; delete base.guide; delete base.families;
    const variants = [
        ['muslim', 'nikah', /بِسْمِ/, 'Nikah', 'ar'],
        ['sikh', 'anandkaraj', /ੴ/, 'Anand Karaj', 'pa'],
        ['christian', 'church', /What God has joined/, 'Holy Matrimony', null],
    ];
    for (const [tradition, type, inv, title, lang] of variants) {
        const cfg = JSON.parse(JSON.stringify(base));
        cfg.tradition = tradition;
        cfg.events = cfg.events.map((e) => (e.id === 'wedding' ? { ...e, type, muhurat: false } : e)).filter((e) => e.type !== 'haldi');
        cfg.announcement = {};
        await browser.goto(`${PAGE}?open=1#i=${enc(cfg)}`, { settle: 1600 });
        const r = await ev(`({ inv: document.querySelector('.rj-hero__invocation')?.textContent || '', invLang: document.querySelector('.rj-hero__invocation')?.getAttribute('lang'), titles: [...document.querySelectorAll('.rj-event__title')].map((t) => t.textContent), font: document.documentElement.className })`);
        check(`${tradition}: own invocation and ceremony name`, inv.test(r.inv) && r.titles.includes(title) && (lang ? r.invLang === lang : true), `${r.inv.slice(0, 30)} · ${r.titles.join(', ')}`);
        if (shots) await browser.screenshot(path.join(OUT, `tradition-${tradition}.png`));
    }

    // Reduced motion
    await browser.media([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await browser.goto(PAGE, { settle: 300 });
    await browser.waitUntil('document.querySelector("[data-wl-envelope].is-ready")', { timeout: 8000 });
    const t0 = Date.now();
    await browser.click('[data-wl-envelope-open]');
    await browser.waitUntil('!document.querySelector("[data-wl-envelope]")', { timeout: 4000 });
    const took = Date.now() - t0;
    const rm = await ev(`({ cls: document.documentElement.className, op: getComputedStyle(document.querySelector('.rj-hero__names')).opacity, translate: [...document.querySelectorAll('[data-parallax]')].map((e) => e.style.translate).join('') })`);
    check('reduced motion: envelope opens instantly, nothing drifts', took < 1500 && rm.op === '1' && !rm.translate && /wl-reduced/.test(rm.cls), `${took}ms`);
    await browser.media([]);
}

async function perf() {
    await browser.viewport(390, 844, { mobile: true, dpr: 2.6 });
    await browser.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6 * 1024 * 1024 / 8 * 10, uploadThroughput: 750 * 1024 / 8 * 10 });
    await browser.goto(PAGE, { settle: 300 });
    await browser.waitUntil('document.querySelector("[data-wl-envelope].is-ready")', { timeout: 15000 });
    const load = await ev(`(() => {
        const res = performance.getEntriesByType('resource');
        const sum = (f) => Math.round(res.filter(f).reduce((a, r) => a + (r.transferSize || r.encodedBodySize || 0), 0) / 1024);
        const nav = performance.getEntriesByType('navigation')[0];
        return { totalKB: sum(() => true) + Math.round((nav.transferSize || 0) / 1024), fontsKB: sum((r) => /gstatic/.test(r.name)), imagesKB: sum((r) => r.initiatorType === 'img' || /\\.(webp|jpg|png)/.test(r.name)), requests: res.length, dom: document.getElementsByTagName('*').length, readyMs: Math.round(performance.now()) };
    })()`);
    check('first view stays light (< 600 KB before scrolling)', load.totalKB < 600, JSON.stringify(load));
    await browser.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await ev(`(() => { window.__frames = []; let last = performance.now(); const tick = (t) => { window.__frames.push(t - last); last = t; if (window.__frames.length < 400) requestAnimationFrame(tick); }; requestAnimationFrame(tick); })()`);
    await browser.click('[data-wl-envelope-open]');
    await sleep(4200);
    const frames = await ev(`(() => { const f = window.__frames.slice(2, 240); const slow = f.filter((d) => d > 34).length; const avg = f.reduce((a, b) => a + b, 0) / f.length; return { n: f.length, avgMs: +avg.toFixed(1), slowFrames: slow, worstMs: Math.round(Math.max(...f)) }; })()`);
    check('envelope + hero entrance stays smooth at 4x CPU throttle', frames.slowFrames <= Math.ceil(frames.n * 0.08) && frames.worstMs < 220, JSON.stringify(frames));
    await browser.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    await browser.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
}

try {
    if (suites.includes('layout')) for (const [w, h] of [[360, 780], [390, 844], [430, 932], [1280, 800]]) await layoutChecks(w, h);
    if (suites.includes('journey')) await journey();
    if (suites.includes('compat')) await compat();
    if (suites.includes('perf')) await perf();
} catch (err) {
    check('QA run completed', false, err.stack || String(err));
} finally {
    await browser.close();
    server.close();
}

const failed = results.filter((r) => !r.ok);
writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(results, null, 1));
console.log(`\n${results.length - failed.length}/${results.length} checks passed${failed.length ? `\nFailed:\n  ${failed.map((f) => f.name).join('\n  ')}` : ''}`);
process.exit(failed.length ? 1 : 0);
