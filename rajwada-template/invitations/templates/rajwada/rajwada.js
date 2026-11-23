/*
 * Rajwada · template
 *
 * Art direction: a night at a Rajput–Maratha palace. Maroon courts lit by
 * gold leaf alternate with ivory parchment, like turning the leaves of a
 * royal card. The cusped (multifoil) arch is the recurring motif: hero
 * gateway, photo windows, section colonnades, envelope flap.
 *
 * Motion language: things are unveiled, never bounced. Seals break, flaps
 * lift, the gateway draws itself in gold, scrolls unroll, diyas light as you
 * reach each ceremony, lanterns sway.
 */
(function (root) {
    'use strict';

    const WL = root.WL;
    const A = WL.art.rajwada;
    const F = WL.fragments;
    const U = WL.util;
    const { html, raw, attrs } = U;

    const TONES = {
        hero: 'dark', announcement: 'light', couple: 'dark', families: 'light', countdown: 'dark',
        events: 'light', venue: 'dark', guide: 'light', gallery: 'dark', rsvp: 'light', thankyou: 'dark',
    };
    const svg = (markup) => raw(markup);
    const icon = (key) => raw(A.icons[key] || A.icons.default);

    /* ---------- Shared pieces ---------- */

    function head(ctx, id, kicker, title, opts) {
        const o = opts || {};
        return html`<header class="rj-head" data-reveal>
            ${kicker ? html`<p class="rj-kicker">${kicker}</p>` : ''}
            <h2 class="rj-title" id="s-${id}-title">${title}</h2>
            ${svg(A.divider(o.dividerClass))}
        </header>`;
    }

    function section(ctx, id, inner, opts) {
        const o = opts || {};
        return html`<section class="rj-sec rj-sec--${id} ${o.className || ''}" id="s-${id}" data-section="${id}" data-tone="${TONES[id]}" aria-labelledby="s-${id}-title" data-inview>
            ${inner}
        </section>`;
    }

    const monogramOf = (ctx) => {
        const { first, second } = ctx.model.couple;
        const custom = ctx.text(ctx.model.envelope.monogram);
        const mono = custom || `${ctx.initial(first)}${ctx.lang === 'en' ? '&' : ' '}${ctx.initial(second)}`;
        return { mono, script: /[\u0900-\u097F]/.test(mono) ? 'deva' : 'latn' };
    };

    const textOf = (ctx, value) => html`<span${ctx.langAttr(value)}>${ctx.text(value)}</span>`;

    /* ---------- Envelope ---------- */

    function envelope(ctx) {
        const { first, second } = ctx.model.couple;
        const { mono, script } = monogramOf(ctx);
        const main = ctx.model.mainEvent;
        // Envelope back in a 300 x 420 box; the flap (300 x 262) is a gently
        // convex V that ends in a soft point at (150, 232), where the seal sits.
        const flap = 'M0,0 H300 V4 C262,64 196,170 164,220 C158,230 142,230 136,220 C104,170 38,64 0,4Z';
        const flapLine = 'M16,9 H284 C250,66 190,162 160,206 C155,213 145,213 140,206 C110,162 50,66 16,9Z';
        return html`<div class="rj-env" data-wl-envelope role="dialog" aria-modal="true" aria-labelledby="rj-env-title">
            <div class="rj-env__bg" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
            ${F.langSwitch(ctx, { className: 'rj-env__lang' })}
            <div class="rj-env__scene">
                <p class="rj-env__to" id="rj-env-title">
                    ${ctx.guest ? html`<span class="rj-env__to-label">${ctx.t('envelope.for')}</span>
                        <span class="rj-env__to-name">${ctx.guest}</span>`
        : html`<span class="rj-env__to-name">${ctx.t('envelope.invited')}</span>`}
                </p>
                <button type="button" class="rj-env__open" data-wl-envelope-open aria-expanded="false" aria-label="${ctx.t('envelope.open')}">
                    <span class="rj-env__envelope" aria-hidden="true">
                        <span class="rj-env__back"></span>
                        <span class="rj-env__card">
                            <span class="rj-env__card-inner">
                                <span class="rj-env__card-kicker">${ctx.t(ctx.model.kind === 'engagement' ? 'hero.engagementOf' : 'hero.weddingOf')}</span>
                                <span class="rj-env__card-names">${ctx.name(first)}<em>${ctx.t('joiner')}</em>${ctx.name(second)}</span>
                                ${main && main.date ? html`<span class="rj-env__card-date">${ctx.i18n.date(main.date, 'numeric')}</span>` : ''}
                            </span>
                        </span>
                        <span class="rj-env__pocket">${svg(`<svg viewBox="0 0 300 420" preserveAspectRatio="none" focusable="false">
                            <path d="M0,8 L150,200 L300,8 V420 H0Z" class="rj-env__pocket-fill"/>
                            <path d="M0,420 L150,232 L300,420" class="rj-env__pocket-fold"/>
                            <path d="M0,8 L150,200 L300,8" class="rj-env__pocket-edge"/>
                            <path d="M12,28 L150,212 L288,28 V408 H12Z" class="rj-env__pocket-line"/>
                        </svg>`)}</span>
                        <span class="rj-env__flap">
                            <span class="rj-env__flap-face rj-env__flap-face--front">${svg(`<svg viewBox="0 0 300 262" preserveAspectRatio="none" focusable="false">
                                <path d="${flap}" class="rj-env__flap-fill"/>
                                <path d="${flap}" class="rj-env__flap-edge"/>
                                <path d="${flapLine}" class="rj-env__flap-line"/>
                                <path d="${flapLine}" class="rj-env__flap-beads"/>
                            </svg>`)}</span>
                            <span class="rj-env__flap-face rj-env__flap-face--back">${svg(`<svg viewBox="0 0 300 262" preserveAspectRatio="none" focusable="false">
                                <path d="${flap}" class="rj-env__lining"/><path d="${flap}" class="rj-env__flap-edge"/>
                            </svg>`)}</span>
                        </span>
                        <span class="rj-env__crest">${svg(`<svg viewBox="-80 -80 160 160" focusable="false"><g class="rj-line">${A.rosette(76, 24)}</g></svg>`)}</span>
                        ${svg(A.corner('rj-env__corner rj-env__corner--bl'))}${svg(A.corner('rj-env__corner rj-env__corner--br'))}
                        <span class="rj-env__seal">${svg(A.seal(mono, script))}</span>
                    </span>
                </button>
                <p class="rj-env__hint" aria-hidden="true">${ctx.t('envelope.hint')}</p>
            </div>
        </div>`;
    }

    /* ---------- Sections ---------- */

    function hero(ctx) {
        const { first, second } = ctx.model.couple;
        const main = ctx.model.mainEvent;
        const venue = main && F.venueOf(ctx, main);
        const place = venue ? (ctx.text(venue.city) || ctx.text(venue.name)) : '';
        const inv = ctx.model.invocation;
        return section(ctx, 'hero', html`
            <div class="rj-hero__bg" data-parallax="0.18" aria-hidden="true"></div>
            <div class="rj-hero__dust wl-loop" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
            <div class="rj-hero__wings" aria-hidden="true">
                <div class="rj-hero__wing rj-hero__wing--l">${svg(A.chhatri())}${svg(A.lantern('wl-loop rj-sway'))}</div>
                <div class="rj-hero__wing rj-hero__wing--r">${svg(A.chhatri())}${svg(A.lantern('wl-loop rj-sway rj-sway--late'))}</div>
            </div>
            <div class="rj-hero__stage">
                <div class="rj-hero__frame" data-art aria-hidden="true"></div>
                <div class="rj-hero__content">
                    ${inv ? html`<p class="rj-hero__invocation rj-in"${ctx.langAttr(inv)}>${ctx.text(inv)}</p>` : ''}
                    <div class="rj-hero__main">
                        ${ctx.guest ? html`<p class="rj-hero__guest rj-in"><span>${ctx.t('hero.dear')}</span> ${ctx.guest}</p>` : ''}
                        <p class="rj-kicker rj-in">${ctx.t(ctx.model.kind === 'engagement' ? 'hero.engagementOf' : 'hero.weddingOf')}</p>
                        <h1 class="rj-hero__names rj-in" id="s-hero-title">
                            <span class="rj-hero__name" data-fit="26">${ctx.name(first)}</span>
                            <span class="rj-hero__amp">${ctx.t('joiner')}</span>
                            <span class="rj-hero__name" data-fit="26">${ctx.name(second)}</span>
                        </h1>
                        ${svg(A.divider('rj-in rj-hero__divider'))}
                        ${main && main.date ? html`<p class="rj-hero__date rj-in">
                            <span class="rj-hero__weekday">${ctx.i18n.date(main.date, 'weekday')}</span>
                            <span class="rj-hero__numeric">${ctx.i18n.date(main.date, 'numeric')}</span>
                        </p>` : ''}
                        ${place ? html`<p class="rj-hero__place rj-in">${place}</p>` : ''}
                        ${ctx.model.music ? html`<button type="button" class="rj-hero__music rj-in" data-wl-music aria-pressed="false"
                            aria-label="${ctx.t('music.play')}" data-label-play="${ctx.t('music.play')}" data-label-pause="${ctx.t('music.pause')}">
                            ${icon('music')}<span class="rj-hero__music-play">${ctx.t('music.play')}</span><span class="rj-hero__music-pause">${ctx.t('music.pause')}</span>
                        </button>` : ''}
                    </div>
                    <a class="rj-hero__scroll rj-in" href="#s-${ctx.model.sections[1] || 'hero'}">
                        <span>${ctx.t('hero.scroll')}</span>
                        ${svg('<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6,9 L12,15 L18,9" class="rj-scroll-chev"/></svg>')}
                    </a>
                </div>
                <div class="rj-hero__elephants" data-parallax="-0.05" aria-hidden="true">
                    ${svg(A.elephant('rj-hero__elephant rj-hero__elephant--l', false))}
                    ${svg(A.elephant('rj-hero__elephant rj-hero__elephant--r', true))}
                </div>
            </div>`, { className: 'rj-hero' });
    }

    function announcement(ctx) {
        const a = ctx.model.announcement;
        const message = ctx.announcement();
        const lead = message.split(/\n{2,}/);
        return section(ctx, 'announcement', html`
            <div class="rj-panel" data-reveal>
                ${svg(A.corner('rj-panel__corner rj-panel__corner--tl'))}${svg(A.corner('rj-panel__corner rj-panel__corner--tr'))}
                ${svg(A.corner('rj-panel__corner rj-panel__corner--bl'))}${svg(A.corner('rj-panel__corner rj-panel__corner--br'))}
                ${head(ctx, 'announcement', ctx.text(a.kicker) || ctx.t('announcement.kicker'), ctx.text(a.title) || ctx.t('announcement.title'))}
                <div class="rj-prose rj-prose--lead"${ctx.langAttr(a.message)}>
                    ${lead.map((p, i) => html`<p${attrs({ class: i === 0 ? 'rj-dropcap' : null })}>${F.lines(p.trim())}</p>`)}
                </div>
            </div>`);
    }

    function person(ctx, p, side) {
        const role = p.role === 'partner' ? 'couple.partner' : `couple.${p.role}`;
        const parentsKey = p.role === 'groom' ? 'couple.sonOf' : p.role === 'bride' ? 'couple.daughterOf' : 'couple.childOf';
        const hon = ctx.honorific(p);
        const photo = p.photo ? F.photo(ctx, p.photo, { className: 'rj-person__img', sizes: '(min-width: 900px) 300px, 64vw', alt: ctx.text(p.photo.alt) || ctx.name(p) }) : '';
        return html`<article class="rj-person rj-person--${side}" data-reveal>
            <div class="rj-person__window">
                <div class="rj-person__photo">${photo || html`<span class="rj-person__mono" aria-hidden="true">${ctx.initial(p)}</span>`}</div>
                ${svg(A.archWindow('rj-person__frame'))}
            </div>
            ${svg(A.ledge('rj-person__ledge'))}
            <p class="rj-kicker">${ctx.t(role)}</p>
            <h3 class="rj-person__name">${hon ? html`<span class="rj-person__hon">${hon}</span> ` : ''}${ctx.fullName(p)}</h3>
            ${p.parents ? html`<p class="rj-person__parents">${ctx.t(parentsKey, { parents: ctx.text(p.parents) })}</p>` : ''}
            ${p.bio ? html`<p class="rj-person__bio"${ctx.langAttr(p.bio)}>${ctx.text(p.bio)}</p>` : ''}
        </article>`;
    }

    function couple(ctx) {
        const { first, second } = ctx.model.couple;
        if (!first.name || !second.name) return '';
        return section(ctx, 'couple', html`
            ${head(ctx, 'couple', ctx.t('couple.kicker'), ctx.t('couple.title'))}
            <div class="rj-couple">
                ${person(ctx, first, 'a')}
                <div class="rj-couple__and" aria-hidden="true" data-reveal="scale">
                    ${svg(`<svg viewBox="-40 -40 80 80" focusable="false"><g class="rj-line">${A.rosette(36, 16)}</g></svg>`)}
                    <span>${ctx.t('joiner')}</span>
                </div>
                ${person(ctx, second, 'b')}
            </div>`);
    }

    function families(ctx) {
        const f = ctx.model.families;
        const sides = [['groom', 'families.groomSide'], ['bride', 'families.brideSide']].filter(([k]) => f[k]);
        if (!sides.length && !f.blessings && !f.hosts && !f.welcome) return '';
        const block = (label, value) => value ? html`<div class="rj-scroll__block">
            <p class="rj-kicker">${label}</p><p class="rj-scroll__text"${ctx.langAttr(value)}>${F.lines(ctx.text(value))}</p>
        </div>` : '';
        return section(ctx, 'families', html`
            ${head(ctx, 'families', ctx.t('families.kicker'), ctx.t('families.title'))}
            <div class="rj-scroll" data-reveal="fade">
                ${svg(A.scrollRod('rj-scroll__rod rj-scroll__rod--top'))}
                <div class="rj-scroll__paper">
                    ${block(ctx.t('families.blessings'), f.blessings)}
                    ${sides.length ? html`<div class="rj-scroll__sides">
                        ${sides.map(([k, key]) => html`<div class="rj-scroll__side">
                            <h3 class="rj-scroll__side-title">${ctx.text(f[k].label) || ctx.t(key)}</h3>
                            ${f[k].members ? html`<p class="rj-scroll__text"${ctx.langAttr(f[k].members)}>${F.lines(ctx.text(f[k].members))}</p>` : ''}
                            ${f[k].place ? html`<p class="rj-scroll__place">${ctx.text(f[k].place)}</p>` : ''}
                        </div>`)}
                    </div>` : ''}
                    ${block(ctx.t('families.hosts'), f.hosts)}
                    ${block(ctx.t('families.welcome'), f.welcome)}
                </div>
                ${svg(A.scrollRod('rj-scroll__rod rj-scroll__rod--bottom'))}
            </div>`);
    }

    function countdown(ctx) {
        const ev = ctx.model.countdown.event;
        if (!ev || !ev.date) return '';
        const parts = ctx.i18n.dateParts(ev.date);
        const medal = svg(`<svg class="rj-medal" viewBox="-50 -50 100 100" aria-hidden="true" focusable="false">
            <circle r="47" class="rj-medal__disc"/><g class="rj-line">${A.rosette(46, 16)}</g><circle r="30" class="rj-medal__core"/></svg>`);
        return section(ctx, 'countdown', html`
            ${svg(A.lantern('rj-cd__lantern rj-cd__lantern--l wl-loop rj-sway'))}
            ${svg(A.lantern('rj-cd__lantern rj-cd__lantern--r wl-loop rj-sway rj-sway--late'))}
            ${head(ctx, 'countdown', ctx.t('countdown.kicker'), ctx.t('countdown.title'))}
            <div class="rj-plaque" data-reveal="scale">
                <span class="rj-plaque__weekday">${parts.weekday}</span>
                <span class="rj-plaque__day">${parts.day}</span>
                <span class="rj-plaque__month">${parts.month} ${parts.year}</span>
            </div>
            ${ev.start ? html`<p class="rj-muhurat" data-reveal>
                <span class="rj-kicker">${ev.muhurat ? ctx.t('events.muhurat') : F.eventTitle(ctx, ev)}</span>
                <span class="rj-muhurat__time">${ctx.i18n.time(ev.start)}</span>
            </p>` : ''}
            <div data-reveal>${F.countdown(ctx, { className: 'rj-countdown', unitArt: medal })}</div>
            ${F.guestTimeHint(ctx, ev, 'rj-note')}
            <div class="rj-cd__actions" data-reveal>${F.calendarButton(ctx, ev, { icon: icon('calendar'), className: 'rj-btn' })}</div>`);
    }

    function events(ctx) {
        const list = ctx.model.events.filter((e) => e.listed);
        if (!list.length) return '';
        const ic = { date: icon('calendar'), time: icon('clock'), venue: icon('pin'), dress: icon('dress') };
        return section(ctx, 'events', html`
            ${head(ctx, 'events', ctx.t('events.kicker'), ctx.t('events.title'))}
            <ol class="rj-timeline">
                <li class="rj-timeline__rail" aria-hidden="true"><span class="rj-timeline__fill"></span></li>
                ${list.map((ev, i) => {
        const venue = F.venueOf(ctx, ev);
        return html`<li class="rj-event ${i % 2 ? 'rj-event--alt' : ''} ${ev.main ? 'rj-event--main' : ''}" data-reveal="${i % 2 ? 'right' : 'left'}">
                    <span class="rj-event__node" aria-hidden="true">${svg(A.diya())}</span>
                    <article class="rj-event__card" aria-labelledby="rj-ev-${ev.id}">
                        <span class="rj-event__icon" aria-hidden="true">${icon(ev.icon)}</span>
                        <h3 class="rj-event__title" id="rj-ev-${ev.id}">${F.eventTitle(ctx, ev)}</h3>
                        ${F.eventDetails(ctx, ev, { icons: ic, className: 'rj-event__meta' })}
                        ${ev.note ? html`<p class="rj-event__note"${ctx.langAttr(ev.note)}>${ctx.text(ev.note)}</p>` : ''}
                        ${venue || ev.startMs != null ? html`<div class="rj-event__actions">
                            ${venue ? html`<a class="wl-btn rj-btn rj-btn--small" href="${F.directionsUrl(ctx, venue)}" target="_blank" rel="noopener noreferrer">${icon('pin')}<span>${ctx.t('events.directions')}</span></a>` : ''}
                            ${F.calendarButton(ctx, ev, { icon: icon('calendar'), className: 'rj-btn rj-btn--small' })}
                        </div>` : ''}
                    </article>
                </li>`;
    })}
            </ol>
            <div class="rj-events__all" data-reveal>${F.calendarButton(ctx, 'all', { icon: icon('calendar'), className: 'rj-btn' })}</div>`);
    }

    function venue(ctx) {
        const used = [];
        ctx.model.events.forEach((e) => { if (e.venueId && !used.includes(e.venueId)) used.push(e.venueId); });
        Object.keys(ctx.model.venues).forEach((id) => { if (!used.includes(id)) used.push(id); });
        const venues = used.map((id) => ctx.model.venues[id]).filter(Boolean);
        if (!venues.length) return '';
        return section(ctx, 'venue', html`
            ${head(ctx, 'venue', ctx.t('venue.kicker'), ctx.t('venue.title'))}
            <div class="rj-venues">
                ${venues.map((v) => {
        const hosted = ctx.model.events.filter((e) => e.listed && e.venueId === v.id).map((e) => F.eventTitle(ctx, e));
        return html`<article class="rj-venue" data-reveal>
                    ${F.mapFacade(ctx, v, { className: 'rj-venue__map', art: svg(A.palace()), icon: icon('pin') })}
                    <div class="rj-venue__body">
                        <h3 class="rj-venue__name">${ctx.text(v.name)}</h3>
                        ${v.address ? html`<p class="rj-venue__address"${ctx.langAttr(v.address)}>${F.lines(ctx.text(v.address))}</p>` : ''}
                        ${hosted.length ? html`<p class="rj-venue__events"><span class="rj-kicker">${ctx.t('venue.hosting')}</span>${hosted.join(' · ')}</p>` : ''}
                        ${v.note ? html`<p class="rj-venue__note"${ctx.langAttr(v.note)}>${ctx.text(v.note)}</p>` : ''}
                        ${F.venueActions(ctx, v, { className: 'rj-venue__actions', directionsIcon: icon('pin'), copyIcon: icon('copy') })}
                    </div>
                </article>`;
    })}
            </div>`);
    }

    function guide(ctx) {
        const g = ctx.model.guide;
        if (!g.dressCode && !g.items.length && !g.contacts.length) return '';
        return section(ctx, 'guide', html`
            ${head(ctx, 'guide', ctx.t('guide.kicker'), ctx.t('guide.title'))}
            <ul class="rj-niches" data-stagger="80">
                ${g.dressCode ? html`<li class="rj-niche rj-niche--dress" data-reveal>
                    <span class="rj-niche__icon" aria-hidden="true">${icon('dress')}</span>
                    <h3 class="rj-niche__title">${ctx.t('guide.dressCode')}</h3>
                    <p class="rj-niche__text"${ctx.langAttr(g.dressCode)}>${ctx.text(g.dressCode)}</p>
                    ${F.swatches(g.colors, 'wl-swatches rj-niche__swatches')}
                </li>` : ''}
                ${g.items.map((it) => html`<li class="rj-niche" data-reveal>
                    <span class="rj-niche__icon" aria-hidden="true">${icon(it.icon)}</span>
                    ${it.title ? html`<h3 class="rj-niche__title">${ctx.text(it.title)}</h3>` : ''}
                    ${it.text ? html`<p class="rj-niche__text"${ctx.langAttr(it.text)}>${ctx.text(it.text)}</p>` : ''}
                </li>`)}
            </ul>
            ${g.contacts.length ? html`<div class="rj-contacts" data-reveal>
                <p class="rj-kicker">${ctx.t('guide.contacts')}</p>
                ${F.contacts(ctx, { className: 'rj-contacts__list', callIcon: icon('phone'), whatsappIcon: icon('whatsapp') })}
            </div>` : ''}`);
    }

    function gallery(ctx) {
        const g = ctx.model.gallery;
        if (!g.photos.length) return '';
        return section(ctx, 'gallery', html`
            ${head(ctx, 'gallery', ctx.text(g.kicker) || ctx.t('gallery.kicker'), ctx.text(g.title) || ctx.t('gallery.title'))}
            <div class="rj-gallery" data-wl-gallery>
                <ul class="rj-gallery__track" data-stagger="70">
                    ${F.galleryItems(ctx, { itemClass: 'rj-gallery__item', sizes: '(min-width: 900px) 280px, 62vw', captions: true, reveal: true, frameAfter: svg(A.archWindow('rj-gallery__window')) })}
                </ul>
            </div>
            ${g.photos.length > 2 ? html`<p class="rj-gallery__hint" aria-hidden="true">${ctx.t('gallery.swipe')}</p>` : ''}`);
    }

    function rsvp(ctx) {
        const r = ctx.model.rsvp;
        if (!r.enabled) return '';
        return section(ctx, 'rsvp', html`
            ${head(ctx, 'rsvp', ctx.t('rsvp.kicker'), ctx.t('rsvp.title'))}
            ${r.deadline && !r.closed ? html`<p class="rj-rsvp__deadline" data-reveal>${ctx.t('rsvp.deadline', { date: ctx.i18n.date(r.deadline, 'long') })}</p>` : ''}
            ${r.note ? html`<p class="rj-rsvp__note" data-reveal${ctx.langAttr(r.note)}>${ctx.text(r.note)}</p>` : ''}
            <div class="rj-letter" data-reveal>
                ${svg(A.corner('rj-letter__corner rj-letter__corner--tl'))}${svg(A.corner('rj-letter__corner rj-letter__corner--tr'))}
                ${svg(A.corner('rj-letter__corner rj-letter__corner--bl'))}${svg(A.corner('rj-letter__corner rj-letter__corner--br'))}
                ${WL.rsvp.render(ctx, {
        className: 'rj-rsvp',
        icons: { yes: icon('check'), no: icon('close'), submit: icon('heart') },
        doneArt: svg(`<span class="rj-rsvp__stamp">${A.seal(monogramOf(ctx).mono, monogramOf(ctx).script)}</span>`),
    })}
            </div>`);
    }

    function thankyou(ctx) {
        const ty = ctx.model.thankyou;
        const main = ctx.model.mainEvent;
        return section(ctx, 'thankyou', html`
            <div class="rj-thanks__art" aria-hidden="true">
                ${svg(A.gateway('rj-thanks__gate'))}
                <span class="rj-thanks__mono">${svg(A.seal(monogramOf(ctx).mono, monogramOf(ctx).script))}</span>
                ${svg(A.elephant('rj-thanks__elephant rj-thanks__elephant--l', false))}
                ${svg(A.elephant('rj-thanks__elephant rj-thanks__elephant--r', true))}
            </div>
            <h2 class="rj-thanks__title" id="s-thankyou-title" data-reveal>${ctx.text(ty.title) || ctx.t('thankyou.title')}</h2>
            <p class="rj-thanks__msg" data-reveal${ctx.langAttr(ty.message)}>${ctx.text(ty.message) || ctx.t('thankyou.message')}</p>
            ${svg(A.divider('rj-thanks__divider'))}
            <p class="rj-thanks__names" data-reveal>${ctx.coupleNames()}</p>
            ${main && main.date ? html`<p class="rj-thanks__date" data-reveal>${ctx.i18n.date(main.date, 'numeric')}</p>` : ''}
            ${ctx.model.couple.hashtag ? html`<p class="rj-thanks__tag" data-reveal>${ctx.model.couple.hashtag}</p>` : ''}
            ${F.langSwitch(ctx, { className: 'rj-thanks__lang' })}
            ${F.credit(ctx, { className: 'rj-credit' })}`);
    }

    /* ---------- Layout: tone-aware edges between sections ---------- */

    function layout(ctx, list) {
        const out = [];
        list.forEach((s, i) => {
            const prev = list[i - 1];
            const tone = TONES[s.id];
            if (prev) {
                const pt = TONES[prev.id];
                const kind = pt === 'dark' && tone === 'light' ? 'arcade' : pt === 'light' && tone === 'dark' ? 'scallop' : `same-${tone}`;
                out.push(html`<div class="rj-edge rj-edge--${kind}" aria-hidden="true">${kind.startsWith('same') ? svg(A.divider()) : ''}</div>`);
            }
            out.push(s.html);
        });
        return out;
    }

    /* ---------- Page chrome ---------- */

    // Only music floats over the page. Language is chosen on the envelope (and
    // again in the closing section), so nothing else covers the invitation text.
    function chrome(ctx) {
        return html`
            ${F.musicButton(ctx, {
        className: 'rj-music',
        art: svg(`<svg class="rj-music__disc" viewBox="-30 -30 60 60" aria-hidden="true" focusable="false"><circle r="28" class="rj-music__ring"/><g class="rj-line">${A.rosette(22, 12)}</g></svg>
                <span class="rj-music__bars" aria-hidden="true"><i></i><i></i><i></i></span>`),
    })}`;
    }

    /* ---------- Open Graph card (1200 x 630, rendered with ?mode=og) ---------- */

    function og(ctx) {
        const { first, second } = ctx.model.couple;
        const main = ctx.model.mainEvent;
        const venue = main && F.venueOf(ctx, main);
        return html`<div class="rj rj-og">
            <div class="rj-og__frame">${svg(A.heroFrame(470, 610, { headRatio: 0.62, apexY: 70 }))}</div>
            ${svg(A.elephant('rj-og__elephant rj-og__elephant--l', false))}
            ${svg(A.elephant('rj-og__elephant rj-og__elephant--r', true))}
            ${svg(A.chhatri('rj-og__chhatri rj-og__chhatri--l'))}${svg(A.chhatri('rj-og__chhatri rj-og__chhatri--r'))}
            ${svg(A.lantern('rj-og__lantern rj-og__lantern--l'))}${svg(A.lantern('rj-og__lantern rj-og__lantern--r'))}
            <div class="rj-og__content">
                <p class="rj-kicker">${ctx.t(ctx.model.kind === 'engagement' ? 'hero.engagementOf' : 'hero.weddingOf')}</p>
                <p class="rj-og__names"><span>${ctx.name(first)}</span><em>${ctx.t('joiner')}</em><span>${ctx.name(second)}</span></p>
                ${svg(A.divider())}
                ${main && main.date ? html`<p class="rj-og__date">${ctx.i18n.date(main.date, 'numeric')}</p>` : ''}
                ${venue ? html`<p class="rj-og__place">${ctx.text(venue.city) || ctx.text(venue.name)}</p>` : ''}
            </div>
        </div>`;
    }

    /* ---------- Behaviour ---------- */

    function mount(ctx, app, info) {
        const docEl = document.documentElement;
        const rootEl = document.body;
        U.setVars(rootEl, {
            '--rj-jaali-dark': A.jaaliDataUri('#e3c47a', 0.09),
            '--rj-jaali-light': A.jaaliDataUri('#a67f2e', 0.08),
            '--rj-arcade': A.arcadeDataUri('#4b0d19', '#c9a24a'),
            '--rj-scallop': A.scallopDataUri('#f8f0de', '#c9a24a'),
        });
        const stops = [];

        // Hero gateway drawn to the exact size of its box.
        const frame = U.$('.rj-hero__frame', app);
        if (frame) {
            let last = '';
            const draw = () => {
                const w = Math.round(frame.clientWidth);
                const h = Math.round(frame.clientHeight);
                if (!w || !h || `${w}x${h}` === last) return;
                last = `${w}x${h}`;
                frame.innerHTML = A.heroFrame(w, h);
                const inset = 8;
                const pillar = Math.max(14, Math.min(26, w * 0.05));
                const openW = w - 2 * (inset + pillar + 8);
                const apexY = Math.max(78, Math.min(124, h * 0.1));
                const headH = Math.min(openW * 0.66, h * 0.36);
                // Text starts where the arch is wide enough for the invocation line.
                U.setVars(frame.parentElement, {
                    '--rj-open-top': `${Math.round(apexY + headH * 0.42)}px`,
                    '--rj-open-w': `${Math.round(openW)}px`,
                });
            };
            draw();
            if ('ResizeObserver' in root) {
                const ro = new ResizeObserver(U.debounce(draw, 60));
                ro.observe(frame);
                stops.push(() => ro.disconnect());
            }
        }

        // Families scroll: the bottom rod starts rolled up against the top one.
        const scroll = U.$('.rj-scroll', app);
        if (scroll) {
            const setH = () => U.setVars(scroll, { '--rj-paper-h': `${U.$('.rj-scroll__paper', scroll).offsetHeight}px` });
            setH();
            stops.push(U.on(root, 'resize', U.debounce(setH, 150)));
        }

        // Timeline rail fills with gold as the guest scrolls through the ceremonies.
        const timeline = U.$('.rj-timeline', app);
        if (timeline && !ctx.reduced) {
            const fill = U.$('.rj-timeline__fill', timeline);
            const update = U.rafThrottle(() => {
                const r = timeline.getBoundingClientRect();
                const p = Math.max(0, Math.min(1, (root.innerHeight * 0.62 - r.top) / r.height));
                fill.style.transform = `scaleY(${p.toFixed(3)})`;
            });
            update();
            stops.push(U.on(root, 'scroll', update, { passive: true }));
        } else if (timeline) {
            U.$('.rj-timeline__fill', timeline).style.transform = 'scaleY(1)';
        }

        // Hero words arrive one after another.
        U.$$('.rj-hero .rj-in', app).forEach((el, i) => U.setVars(el, { '--i': String(i) }));

        // Floating music / language controls appear once the cover is behind the guest.
        const heroSection = U.$('.rj-hero', app);
        if (heroSection && 'IntersectionObserver' in root) {
            const io = new IntersectionObserver(([entry]) => {
                docEl.classList.toggle('rj-past-hero', !entry.isIntersecting);
            }, { threshold: 0, rootMargin: '-35% 0px 0px 0px' });
            io.observe(heroSection);
            stops.push(() => io.disconnect());
        } else {
            docEl.classList.add('rj-past-hero');
        }

        // The tanpura is rendered ahead of time, when the browser is idle.
        U.$$('[data-wl-music]', app).forEach((b) => b.addEventListener('pointerdown', () => WL.music.prepare(), { once: true }));
        const warm = setTimeout(() => WL.music.prepare(), 5000);
        stops.push(() => clearTimeout(warm));
        // A language switch re-renders the page: don't replay the entrance.
        if (info.opened) {
            const heroEl = U.$('.rj-hero', app);
            if (heroEl) heroEl.classList.add('rj-settled');
        }

        // Without an envelope the entrance plays straight away.
        if (!info.envelope) docEl.classList.add('rj-opened');
        return () => stops.forEach((s) => s());
    }

    WL.registerTemplate('rajwada', {
        name: 'Rajwada',
        themeColor: '#33070f',
        sectionOrder: ['hero', 'announcement', 'couple', 'families', 'countdown', 'events', 'venue', 'guide', 'gallery', 'rsvp', 'thankyou'],
        fonts: {
            extra: {
                arab: 'family=Amiri:wght@400',
                guru: 'family=Noto+Serif+Gurmukhi:wght@400;600',
            },
        },
        timing: { envelope: 2350, envelopeFade: 950 },
        icons: A.icons,
        lightbox: {
            className: 'rj-lightbox',
            closeIcon: icon('close'), prevIcon: icon('prev'), nextIcon: icon('next'),
        },
        defs: () => raw(A.defs()),
        envelope,
        sections: { hero, announcement, couple, families, countdown, events, venue, guide, gallery, rsvp, thankyou },
        layout,
        chrome,
        og,
        mount,
        onOpening() { document.documentElement.classList.add('rj-opening'); },
        onOpened() { document.documentElement.classList.add('rj-opened'); },
    });
})(window);
