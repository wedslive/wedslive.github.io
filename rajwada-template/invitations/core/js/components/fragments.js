/*
 * weds.live invitation engine · components/fragments.js
 *
 * Markup builders shared by every template. They turn the normalised model
 * into accessible, semantic HTML with neutral `wl-` classes and data hooks
 * (data-wl-*) that the behaviour components bind to. Templates own layout
 * and art: they wrap these fragments, add their own classes and pass art in
 * through options. Every value is escaped by html``.
 */
(function (root) {
    'use strict';

    const WL = root.WL;
    const { html, raw, attrs } = WL.util;

    /* ---------- Small text helpers ---------- */

    // lang="" for content that resolved to another language than the page.
    function langAttr(ctx, value) {
        const l = ctx.i18n.sourceLang(value);
        if (value && typeof value === 'object' && typeof value['*'] === 'string' && value['@lang']) {
            return attrs({ lang: value['@lang'], dir: value['@lang'] === 'ar' ? 'rtl' : null });
        }
        return l && l !== ctx.lang ? attrs({ lang: l }) : '';
    }

    // Multi-line content (\n) -> <br>, everything escaped.
    function lines(text) {
        return raw(String(text || '').split('\n').map((line) => html`${line}`.value).join('<br>'));
    }

    function paragraphs(text, cls) {
        return String(text || '').split(/\n{2,}/).filter((p) => p.trim())
            .map((p) => html`<p${attrs({ class: cls })}>${lines(p.trim())}</p>`);
    }

    function kicker(text, cls) {
        return text ? html`<p class="${cls || 'wl-kicker'}">${text}</p>` : '';
    }

    function swatches(colors, cls) {
        if (!colors || !colors.length) return '';
        return html`<span class="${cls || 'wl-swatches'}" aria-hidden="true">${colors.map((c) => html`<i class="wl-swatch" data-color="${c}"></i>`)}</span>`;
    }

    /* ---------- Photos ---------- */

    // Responsive <img>. sizes defaults to a phone-first guess; pass the
    // template's real layout size for best results.
    function photo(ctx, p, options) {
        if (!p) return '';
        const o = options || {};
        const srcset = p.srcset && p.srcset.length ? p.srcset.map((s) => `${s.src} ${s.w}w`).join(', ') : null;
        const largest = p.srcset && p.srcset.length ? p.srcset[p.srcset.length - 1] : null;
        const alt = o.alt != null ? o.alt : ctx.text(p.alt);
        return html`<img${attrs({
            class: o.className,
            src: o.preferLarge && largest ? largest.src : p.src,
            srcset,
            sizes: srcset ? (o.sizes || '(min-width: 900px) 33vw, 80vw') : null,
            alt: alt || '',
            width: p.width || o.width || null,
            height: p.height || o.height || null,
            loading: o.eager ? 'eager' : 'lazy',
            decoding: 'async',
            fetchpriority: o.eager ? 'high' : null,
            'data-pos': p.position || null,
        })}>`;
    }

    /* ---------- Events ---------- */

    function eventTitle(ctx, ev) {
        return ev.title ? ctx.text(ev.title) : ctx.text(WL.catalog.eventType(ev.type).name);
    }

    function venueOf(ctx, ev) {
        return (ev && ev.venueId && ctx.model.venues[ev.venueId]) || null;
    }

    function eventWhen(ctx, ev) {
        return {
            date: ev.date ? ctx.i18n.date(ev.date, 'full') : '',
            time: ev.start ? ctx.i18n.timeRange(ev.start, ev.end, ev.onwards && !ev.muhurat) : '',
        };
    }

    // <dl> with date, time, venue, dress code. opts.icons: { date, time, venue, dress } SafeHTML
    function eventDetails(ctx, ev, options) {
        const o = options || {};
        const ic = o.icons || {};
        const when = eventWhen(ctx, ev);
        const venue = venueOf(ctx, ev);
        const timeLabel = ev.muhurat ? ctx.t('events.muhurat') : null;
        const row = (key, label, value, extra) => value ? html`
            <div class="wl-meta__row wl-meta__row--${key}">
                <dt class="wl-meta__label">${ic[key] || ''}<span class="wl-sr-only">${label}</span></dt>
                <dd class="wl-meta__value">${value}${extra || ''}</dd>
            </div>` : '';
        return html`<dl class="wl-meta ${o.className || ''}">
            ${ev.detail && !ev.date ? row('detail', ctx.t('events.title'), ctx.text(ev.detail)) : ''}
            ${row('date', ctx.t('countdown.kicker'), when.date)}
            ${when.time ? html`
            <div class="wl-meta__row wl-meta__row--time">
                <dt class="wl-meta__label">${ic.time || ''}<span class="wl-sr-only">${timeLabel || ctx.t('events.title')}</span></dt>
                <dd class="wl-meta__value">${timeLabel ? html`<span class="wl-meta__tag">${timeLabel}</span> ` : ''}${when.time}</dd>
            </div>` : ''}
            ${venue ? row('venue', ctx.t('events.venue'), [ctx.text(ev.spot), ctx.text(venue.name)].filter(Boolean).join(' · ')) : ''}
            ${ev.dressCode ? row('dress', ctx.t('events.dressCode'), html`<span class="wl-meta__tag">${ctx.t('events.dressCode')}</span> ${ctx.text(ev.dressCode)}`, swatches(ev.colors)) : ''}
        </dl>`;
    }

    /* ---------- Calendar ---------- */

    function calendarEntry(ctx, ev) {
        const venue = venueOf(ctx, ev);
        const where = venue ? [ctx.text(venue.name), ctx.text(venue.address)].filter(Boolean).join(', ') : '';
        return {
            uid: `${ctx.model.id}-${ev.id}`,
            title: `${eventTitle(ctx, ev)} · ${ctx.coupleNames()}`,
            start: ev.startMs,
            end: ev.endMs,
            location: where,
            description: [ctx.text(ev.note), ctx.pageUrl()].filter(Boolean).join('\n\n'),
        };
    }

    let calSeq = 0;
    // target: an event object, or 'all' for every dated event in one .ics file
    function calendarButton(ctx, target, options) {
        const o = options || {};
        const label = o.label || ctx.t(target === 'all' ? 'events.allToCalendar' : 'events.addToCalendar');
        if (target === 'all') {
            if (!ctx.model.events.some((e) => e.startMs != null)) return '';
            return html`<button type="button" class="wl-btn ${o.className || ''}" data-wl-ics="all">${o.icon || ''}<span>${label}</span></button>`;
        }
        if (!target || target.startMs == null) return '';
        const id = `wl-cal-${++calSeq}`;
        const google = WL.time.googleCalendarUrl(calendarEntry(ctx, target));
        return html`<div class="wl-cal ${o.className || ''}" data-wl-cal>
            <button type="button" class="wl-btn wl-cal__toggle" aria-expanded="false" aria-controls="${id}">${o.icon || ''}<span>${label}</span></button>
            <div class="wl-cal__menu" id="${id}" role="group" aria-label="${ctx.t('events.calendarMenu')}" hidden>
                <a class="wl-cal__item" href="${google}" target="_blank" rel="noopener noreferrer">${ctx.t('events.google')}</a>
                <button type="button" class="wl-cal__item" data-wl-ics="${target.id}">${ctx.t('events.ics')}</button>
            </div>
        </div>`;
    }

    /* ---------- Venue ---------- */

    const placeQuery = (ctx, venue) => {
        if (venue.lat != null) return `${venue.lat},${venue.lng}`;
        return [ctx.text(venue.name), ctx.text(venue.address)].filter(Boolean).join(', ');
    };

    function directionsUrl(ctx, venue) {
        if (venue.mapUrl) return venue.mapUrl;
        return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(placeQuery(ctx, venue))}`;
    }

    // The embed URL is always built here from coordinates / address, never
    // taken from config, so a crafted link can't frame another site.
    function mapEmbedUrl(ctx, venue) {
        return `https://www.google.com/maps?q=${encodeURIComponent(placeQuery(ctx, venue))}&z=15&hl=${ctx.lang}&output=embed`;
    }

    function mapFacade(ctx, venue, options) {
        const o = options || {};
        const title = ctx.t('venue.mapTitle', { venue: ctx.text(venue.name) });
        return html`<div class="wl-map ${o.className || ''}" data-wl-map data-src="${mapEmbedUrl(ctx, venue)}" data-title="${title}">
            <div class="wl-map__art" aria-hidden="true">${o.art || ''}</div>
            <button type="button" class="wl-btn wl-map__show">${o.icon || ''}<span>${ctx.t('venue.showMap')}</span></button>
        </div>`;
    }

    function venueActions(ctx, venue, options) {
        const o = options || {};
        const address = [ctx.text(venue.name), ctx.text(venue.address)].filter(Boolean).join(', ');
        return html`<div class="wl-actions ${o.className || ''}">
            <a class="wl-btn wl-btn--primary" href="${directionsUrl(ctx, venue)}" target="_blank" rel="noopener noreferrer">${o.directionsIcon || ''}<span>${ctx.t('venue.directions')}</span></a>
            <button type="button" class="wl-btn" data-wl-copy="${address}" data-done="${ctx.t('venue.copied')}">${o.copyIcon || ''}<span>${ctx.t('venue.copy')}</span></button>
        </div>`;
    }

    /* ---------- Countdown ---------- */

    function countdown(ctx, options) {
        const o = options || {};
        const target = ctx.model.countdown.targetMs;
        if (target == null) return '';
        const units = ['days', 'hours', 'minutes', 'seconds'];
        return html`<div class="wl-countdown ${o.className || ''}" data-wl-countdown data-target="${target}">
            <div class="wl-countdown__units" aria-hidden="true">
                ${units.map((u) => html`<div class="wl-countdown__unit" data-unit="${u}">
                    ${o.unitArt || ''}
                    <span class="wl-countdown__value" data-value>${ctx.i18n.num('00')}</span>
                    <span class="wl-countdown__label">${ctx.t(`countdown.${u}`)}</span>
                </div>`)}
            </div>
            <p class="wl-sr-only" data-wl-countdown-sr></p>
            <p class="wl-countdown__done" data-wl-countdown-done hidden></p>
        </div>`;
    }

    // "That is 2:01 AM on 6 February where you are (New York, EST)."
    function guestTimeHint(ctx, ev, cls) {
        if (!ev || ev.startMs == null || !ev.start) return '';
        if (!WL.time.differsFromGuest(ev.startMs, ctx.model.timezone)) return '';
        const zone = WL.time.guestZone();
        const local = ctx.i18n.instant(ev.startMs, zone);
        return html`<p class="${cls || 'wl-note'}">${ctx.t('countdown.yourTime', {
            time: local.time, date: local.date, zone: WL.time.zoneLabel(ev.startMs, zone),
        })}</p>`;
    }

    /* ---------- Gallery ---------- */

    function galleryItems(ctx, options) {
        const o = options || {};
        const photos = ctx.model.gallery.photos;
        return photos.map((p, i) => html`<li class="wl-gallery__item ${o.itemClass || ''}" ${o.reveal ? raw('data-reveal') : ''}>
            <button type="button" class="wl-gallery__open" data-wl-photo="${i}" aria-label="${ctx.t('gallery.open', { n: ctx.i18n.num(i + 1), total: ctx.i18n.num(photos.length) })}">
                ${o.frameBefore || ''}<span class="wl-gallery__frame">${photo(ctx, p, { className: 'wl-gallery__img', sizes: o.sizes, alt: '' })}</span>${o.frameAfter || ''}
            </button>
            ${o.captions && p.caption ? html`<p class="wl-gallery__caption"${langAttr(ctx, p.caption)}>${ctx.text(p.caption)}</p>` : ''}
        </li>`);
    }

    /* ---------- Contacts ---------- */

    function contacts(ctx, options) {
        const o = options || {};
        const list = ctx.model.guide.contacts;
        if (!list.length) return '';
        return html`<ul class="wl-contacts ${o.className || ''}">${list.map((c) => {
            const name = ctx.text(c.name);
            return html`<li class="wl-contact">
                <span class="wl-contact__name">${name}</span>
                ${c.relation ? html`<span class="wl-contact__relation">${ctx.text(c.relation)}</span>` : ''}
                <span class="wl-contact__actions">
                    ${c.phone ? html`<a class="wl-btn wl-btn--icon" href="${WL.util.telHref(c.phone)}" aria-label="${ctx.t('guide.call', { name })}">${o.callIcon || '☎'}</a>` : ''}
                    ${c.whatsapp ? html`<a class="wl-btn wl-btn--icon" href="${WL.util.waHref(c.whatsapp)}" target="_blank" rel="noopener noreferrer" aria-label="${ctx.t('guide.whatsapp', { name })}">${o.whatsappIcon || 'WA'}</a>` : ''}
                </span>
            </li>`;
        })}</ul>`;
    }

    /* ---------- Chrome: music + language ---------- */

    function musicButton(ctx, options) {
        if (!ctx.model.music) return '';
        const o = options || {};
        return html`<button type="button" class="wl-music ${o.className || ''}" data-wl-music aria-pressed="false" aria-label="${ctx.t('music.play')}" data-label-play="${ctx.t('music.play')}" data-label-pause="${ctx.t('music.pause')}">
            ${o.art || ''}
            <span class="wl-music__hint" aria-hidden="true">${ctx.t('music.hint')}</span>
        </button>`;
    }

    function langSwitch(ctx, options) {
        const langs = ctx.model.lang.available;
        if (langs.length < 2) return '';
        const o = options || {};
        return html`<div class="wl-lang ${o.className || ''}" role="group" aria-label="${ctx.t('lang.label')}" data-wl-lang>
            ${langs.map((l) => html`<button type="button" class="wl-lang__opt" data-lang="${l}" lang="${l}" aria-pressed="${l === ctx.lang ? 'true' : 'false'}">${WL.i18n.LANGS[l].label}</button>`)}
        </div>`;
    }

    // Compact language button that opens a small menu (for fixed page chrome).
    function langMenu(ctx, options) {
        const langs = ctx.model.lang.available;
        if (langs.length < 2) return '';
        const o = options || {};
        const short = { en: 'EN', mr: 'मरा', hi: 'हिं' };
        return html`<div class="wl-langmenu ${o.className || ''}" data-wl-langmenu>
            <button type="button" class="wl-langmenu__toggle" aria-expanded="false" aria-controls="wl-langmenu-list" aria-label="${ctx.t('lang.label')}: ${WL.i18n.LANGS[ctx.lang].label}">
                ${o.icon || ''}<span aria-hidden="true">${short[ctx.lang] || ctx.lang}</span>
            </button>
            <div class="wl-langmenu__list" id="wl-langmenu-list" data-wl-lang hidden>
                ${langs.map((l) => html`<button type="button" class="wl-lang__opt" data-lang="${l}" lang="${l}" aria-pressed="${l === ctx.lang ? 'true' : 'false'}">${WL.i18n.LANGS[l].label}</button>`)}
            </div>
        </div>`;
    }

    function credit(ctx, options) {
        if (!ctx.model.branding) return '';
        const o = options || {};
        return html`<p class="wl-credit ${o.className || ''}">${ctx.t('footer.made')} <a href="https://weds.live/" rel="noopener">weds.live</a>
            <span aria-hidden="true">·</span> <a href="https://weds.live/create.html" rel="noopener">${ctx.t('footer.create')}</a></p>`;
    }

    WL.fragments = {
        langAttr, lines, paragraphs, kicker, swatches, photo,
        eventTitle, venueOf, eventWhen, eventDetails,
        calendarEntry, calendarButton,
        directionsUrl, mapEmbedUrl, mapFacade, venueActions,
        countdown, guestTimeHint, galleryItems, contacts,
        musicButton, langSwitch, langMenu, credit,
    };
})(window);
