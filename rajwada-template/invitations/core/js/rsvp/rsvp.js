/*
 * weds.live invitation engine · rsvp/rsvp.js
 *
 * RSVP form markup + behaviour. Providers (config.rsvp.provider):
 *
 *   "endpoint"  POST to an https:// URL you control (see server/ for a Google
 *               Apps Script reference that writes to a Sheet). Sent as a CORS
 *               "simple request" (text/plain JSON) so no preflight is needed.
 *   "whatsapp"  no server: opens WhatsApp with the reply pre-written to the
 *               family's number; the guest presses send.
 *   "none"      section hidden.
 *
 * Client-side protections (the server must still validate everything):
 * strict validation and length caps, a hidden honeypot field, a minimum time
 * on page, one idempotency key per guest per invitation (re-submitting
 * updates instead of duplicating), a request timeout, no cookies sent, and
 * nothing logged. The guest's last reply is remembered on their device only.
 */
(function (root) {
    'use strict';

    const WL = root.WL;
    const U = WL.util;
    const { html, attrs } = U;
    const F = WL.fragments;

    const MIN_MS_ON_PAGE = 2500;
    const TIMEOUT_MS = 15000;
    const loadedAt = Date.now();
    const storeKey = (ctx) => `wl:rsvp:${ctx.model.id}`;

    /* ---------- Markup ---------- */

    function render(ctx, options) {
        const r = ctx.model.rsvp;
        if (!r.enabled) return '';
        const o = options || {};
        const ic = o.icons || {};
        if (r.closed) return html`<p class="wl-rsvp__closed">${ctx.t('rsvp.closed')}</p>`;

        const events = r.perEvent ? r.events.map((id) => ctx.model.events.find((e) => e.id === id)).filter(Boolean) : [];
        const submitLabel = r.provider === 'whatsapp' ? ctx.t('rsvp.submitWhatsapp') : ctx.t('rsvp.submit');
        const err = (name) => html`<p class="wl-field__error" id="wl-rsvp-${name}-error" hidden></p>`;

        return html`
        <form class="wl-rsvp ${o.className || ''}" data-wl-rsvp novalidate>
            <p class="wl-rsvp__summary" role="alert" tabindex="-1" hidden></p>

            <div class="wl-field">
                <label class="wl-field__label" for="wl-rsvp-name">${ctx.t('rsvp.name')}</label>
                <input class="wl-input" id="wl-rsvp-name" name="name" type="text" autocomplete="name" maxlength="80"
                    required placeholder="${ctx.t('rsvp.namePlaceholder')}" value="${ctx.guest}" aria-describedby="wl-rsvp-name-error">
                ${err('name')}
            </div>

            <fieldset class="wl-field wl-choice" aria-describedby="wl-rsvp-attending-error">
                <legend class="wl-field__label">${ctx.t('rsvp.attending')}</legend>
                <div class="wl-choice__options">
                    <label class="wl-choice__option wl-choice__option--yes">
                        <input type="radio" name="attending" value="yes" required>
                        <span class="wl-choice__face">${ic.yes || ''}<span>${ctx.t('rsvp.yes')}</span></span>
                    </label>
                    <label class="wl-choice__option wl-choice__option--no">
                        <input type="radio" name="attending" value="no">
                        <span class="wl-choice__face">${ic.no || ''}<span>${ctx.t('rsvp.no')}</span></span>
                    </label>
                </div>
                ${err('attending')}
            </fieldset>

            <div class="wl-rsvp__yes" data-when="yes" hidden>
                <div class="wl-field wl-stepper">
                    <label class="wl-field__label" for="wl-rsvp-guests">${ctx.t('rsvp.guests')}</label>
                    <div class="wl-stepper__row">
                        <button type="button" class="wl-stepper__btn" data-step="-1" aria-label="${ctx.t('rsvp.fewer')}">−</button>
                        <input class="wl-input wl-stepper__input" id="wl-rsvp-guests" name="guests" type="number" inputmode="numeric"
                            min="1" max="${r.maxGuests}" value="1" aria-describedby="wl-rsvp-guests-hint wl-rsvp-guests-error">
                        <button type="button" class="wl-stepper__btn" data-step="1" aria-label="${ctx.t('rsvp.more')}">+</button>
                    </div>
                    <p class="wl-field__hint" id="wl-rsvp-guests-hint">${ctx.t('rsvp.guestsHint', { max: ctx.i18n.num(r.maxGuests) })}</p>
                    ${err('guests')}
                </div>

                ${events.length ? html`
                <fieldset class="wl-field wl-chips" aria-describedby="wl-rsvp-events-error">
                    <legend class="wl-field__label">${ctx.t('rsvp.events')}</legend>
                    <div class="wl-chips__list">
                        ${events.map((ev) => html`<label class="wl-chip">
                            <input type="checkbox" name="events" value="${ev.id}" checked>
                            <span class="wl-chip__face">${F.eventTitle(ctx, ev)}</span>
                        </label>`)}
                    </div>
                    ${err('events')}
                </fieldset>` : ''}

                ${r.diet.length ? html`
                <fieldset class="wl-field wl-chips">
                    <legend class="wl-field__label">${ctx.t('rsvp.diet')}</legend>
                    <div class="wl-chips__list">
                        ${r.diet.map((d, i) => html`<label class="wl-chip">
                            <input type="radio" name="diet" value="${d}"${attrs({ checked: i === 0 })}>
                            <span class="wl-chip__face">${ctx.t(`rsvp.diet.${d}`)}</span>
                        </label>`)}
                    </div>
                </fieldset>` : ''}
            </div>

            ${r.phone ? html`
            <div class="wl-field">
                <label class="wl-field__label" for="wl-rsvp-phone">${ctx.t('rsvp.phone')}</label>
                <input class="wl-input" id="wl-rsvp-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" maxlength="20" aria-describedby="wl-rsvp-phone-error">
                ${err('phone')}
            </div>` : ''}

            ${r.message ? html`
            <div class="wl-field">
                <label class="wl-field__label" for="wl-rsvp-message">${ctx.t('rsvp.message')}</label>
                <textarea class="wl-input wl-input--area" id="wl-rsvp-message" name="message" rows="3" maxlength="500"></textarea>
            </div>` : ''}

            <div class="wl-hp" aria-hidden="true">
                <label>Website <input type="text" name="website" tabindex="-1" autocomplete="off"></label>
            </div>

            <button type="submit" class="wl-btn wl-btn--primary wl-rsvp__submit">${ic.submit || ''}<span>${submitLabel}</span></button>
            <p class="wl-rsvp__status" role="status" aria-live="polite"></p>
        </form>
        <div class="wl-rsvp__done" data-wl-rsvp-done tabindex="-1" hidden>
            ${o.doneArt || ''}
            <p class="wl-rsvp__thanks"></p>
            <button type="button" class="wl-btn wl-rsvp__change">${ctx.t('rsvp.change')}</button>
        </div>`;
    }

    /* ---------- Behaviour ---------- */

    function read(form) {
        const fd = new FormData(form);
        return {
            name: U.cleanText(fd.get('name'), 80),
            attending: fd.get('attending') || '',
            guests: Number(fd.get('guests')),
            events: fd.getAll('events').map(String),
            diet: fd.get('diet') || '',
            phone: U.cleanText(fd.get('phone'), 20),
            message: U.cleanText(fd.get('message'), 500),
            website: String(fd.get('website') || ''),
        };
    }

    function validate(ctx, form, data) {
        const r = ctx.model.rsvp;
        const errors = {};
        if (data.name.length < 2) errors.name = ctx.t('rsvp.error.name');
        if (data.attending !== 'yes' && data.attending !== 'no') errors.attending = ctx.t('rsvp.error.attending');
        if (data.attending === 'yes') {
            if (!Number.isInteger(data.guests) || data.guests < 1 || data.guests > r.maxGuests) {
                errors.guests = ctx.t('rsvp.error.guests', { max: ctx.i18n.num(r.maxGuests) });
            }
            if (r.perEvent && U.$('[name="events"]', form) && !data.events.length) errors.events = ctx.t('rsvp.error.events');
        }
        if (data.phone && !U.normalisePhone(data.phone)) errors.phone = ctx.t('rsvp.error.phone');
        return errors;
    }

    function showErrors(form, errors) {
        U.$$('.wl-field__error', form).forEach((p) => { p.hidden = true; p.textContent = ''; });
        U.$$('[aria-invalid]', form).forEach((el) => el.removeAttribute('aria-invalid'));
        Object.keys(errors).forEach((name) => {
            const p = U.$(`#wl-rsvp-${name}-error`, form);
            if (p) { p.textContent = errors[name]; p.hidden = false; }
            U.$$(`[name="${name}"]`, form).forEach((el) => el.setAttribute('aria-invalid', 'true'));
        });
    }

    function payload(ctx, data, key) {
        const yes = data.attending === 'yes';
        return {
            type: 'rsvp',
            v: 1,
            invite: ctx.model.id,
            couple: ctx.coupleNames('en'),
            key,
            name: data.name,
            attending: yes,
            guests: yes ? data.guests : 0,
            events: yes ? data.events : [],
            diet: yes ? data.diet : '',
            phone: U.normalisePhone(data.phone),
            message: data.message,
            lang: ctx.lang,
            tz: WL.time.guestZone(),
            submittedAt: new Date().toISOString(),
        };
    }

    async function sendEndpoint(ctx, body) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
        try {
            const res = await fetch(ctx.model.rsvp.endpoint, {
                method: 'POST',
                mode: 'cors',
                credentials: 'omit',
                cache: 'no-store',
                redirect: 'follow',
                referrerPolicy: 'strict-origin',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(body),
                signal: controller.signal,
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const text = await res.text();
            if (text) {
                let json = null;
                try { json = JSON.parse(text); } catch (e) { /* plain-text OK responses are accepted */ }
                if (json && json.ok === false) throw new Error('rejected');
            }
        } finally {
            clearTimeout(timer);
        }
    }

    function whatsappText(ctx, body) {
        const t = ctx.t;
        const evNames = body.events.map((id) => {
            const ev = ctx.model.events.find((e) => e.id === id);
            return ev ? F.eventTitle(ctx, ev) : '';
        }).filter(Boolean);
        const linesOut = [
            `*${t('rsvp.wa.title', { couple: ctx.coupleNames() })}*`,
            `${t('rsvp.wa.name')}: ${body.name}`,
            `${t('rsvp.wa.attending')}: ${body.attending ? t('rsvp.wa.yes') : t('rsvp.wa.no')}`,
        ];
        if (body.attending) {
            linesOut.push(`${t('rsvp.wa.guests')}: ${ctx.i18n.num(body.guests)}`);
            if (evNames.length) linesOut.push(`${t('rsvp.wa.events')}: ${evNames.join(', ')}`);
            if (body.diet) linesOut.push(`${t('rsvp.wa.diet')}: ${t(`rsvp.diet.${body.diet}`)}`);
        }
        if (body.message) linesOut.push(`${t('rsvp.wa.message')}: ${body.message}`);
        return linesOut.join('\n');
    }

    function sendWhatsapp(ctx, body) {
        const url = U.waHref(ctx.model.rsvp.whatsapp, whatsappText(ctx, body));
        const win = root.open(url, '_blank', 'noopener');
        if (!win) root.location.href = url;
    }

    // Keeps what the guest has typed across a language switch re-render.
    function snapshot(scope) {
        const form = U.$('[data-wl-rsvp]', scope);
        if (!form || form.hidden) return null;
        const d = read(form);
        return { name: d.name, attending: d.attending, guests: d.guests, events: d.events, diet: d.diet, phone: d.phone, message: d.message };
    }

    function fill(form, d) {
        if (!d) return;
        const set = (name, v) => { const el = U.$(`[name="${name}"]`, form); if (el && v != null && v !== '') el.value = v; };
        set('name', d.name);
        set('guests', d.guests || 1);
        set('phone', d.phone);
        set('message', d.message);
        U.$$('[name="attending"]', form).forEach((el) => { el.checked = el.value === d.attending; });
        if (Array.isArray(d.events)) U.$$('[name="events"]', form).forEach((el) => { el.checked = d.events.includes(el.value); });
        if (d.diet) U.$$('[name="diet"]', form).forEach((el) => { el.checked = el.value === d.diet; });
    }

    function bind(scope, ctx, draft) {
        const form = U.$('[data-wl-rsvp]', scope);
        if (!form) return;
        const done = U.$('[data-wl-rsvp-done]', scope);
        const status = U.$('.wl-rsvp__status', form);
        const summary = U.$('.wl-rsvp__summary', form);
        const submit = U.$('.wl-rsvp__submit', form);
        const yesBlock = U.$('[data-when="yes"]', form);
        const guests = U.$('[name="guests"]', form);
        const max = ctx.model.rsvp.maxGuests;
        let sending = false;

        const syncYes = () => {
            const yes = (U.$('[name="attending"]:checked', form) || {}).value === 'yes';
            if (yesBlock) yesBlock.hidden = !yes;
        };
        U.$$('[name="attending"]', form).forEach((el) => el.addEventListener('change', syncYes));

        U.$$('[data-step]', form).forEach((b) => b.addEventListener('click', () => {
            const v = Math.min(max, Math.max(1, (Number(guests.value) || 1) + Number(b.getAttribute('data-step'))));
            guests.value = String(v);
            guests.dispatchEvent(new Event('input', { bubbles: true }));
        }));

        function showDone(stored) {
            const name = stored.name || '';
            const text = stored.via === 'whatsapp' ? ctx.t('rsvp.whatsappOpened')
                : ctx.t(stored.attending === 'yes' ? 'rsvp.thanksYes' : 'rsvp.thanksNo', { name });
            U.$('.wl-rsvp__thanks', done).textContent = text;
            form.hidden = true;
            done.hidden = false;
            done.classList.toggle('is-declined', stored.attending !== 'yes');
        }

        U.$('.wl-rsvp__change', done).addEventListener('click', () => {
            done.hidden = true;
            form.hidden = false;
            const stored = U.storage.get(storeKey(ctx));
            if (stored) { fill(form, stored); syncYes(); }
            U.$('[name="name"]', form).focus();
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (sending) return;
            const data = read(form);
            const errors = validate(ctx, form, data);
            showErrors(form, errors);
            const firstKey = Object.keys(errors)[0];
            if (firstKey) {
                summary.textContent = ctx.t('rsvp.error.summary');
                summary.hidden = false;
                const target = U.$(`[name="${firstKey}"]`, form);
                if (target) target.focus();
                return;
            }
            summary.hidden = true;

            const stored = U.storage.get(storeKey(ctx)) || {};
            const key = stored.key || U.randomId();
            const record = { key, name: data.name, attending: data.attending, guests: data.guests, events: data.events, diet: data.diet, phone: data.phone, message: data.message };

            // Bots fill hidden fields or submit instantly: pretend success, send nothing.
            if (data.website || Date.now() - loadedAt < MIN_MS_ON_PAGE) {
                showDone(Object.assign({}, record, { via: 'endpoint' }));
                return;
            }

            const body = payload(ctx, data, key);
            if (ctx.model.rsvp.provider === 'whatsapp') {
                sendWhatsapp(ctx, body);
                U.storage.set(storeKey(ctx), Object.assign(record, { via: 'whatsapp', at: Date.now() }));
                showDone(record);
                WL.emit('rsvp:sent', { attending: data.attending === 'yes', via: 'whatsapp' });
                done.focus();
                return;
            }

            sending = true;
            submit.disabled = true;
            const label = U.$('span', submit);
            const original = label.textContent;
            label.textContent = ctx.t('rsvp.sending');
            status.textContent = '';
            try {
                if (ctx.model.rsvp.provider === 'demo') await U.wait(900);
                else await sendEndpoint(ctx, body);
                U.storage.set(storeKey(ctx), Object.assign(record, { via: 'endpoint', at: Date.now() }));
                showDone(record);
                WL.emit('rsvp:sent', { attending: data.attending === 'yes', via: 'endpoint' });
                done.focus();
            } catch (err) {
                status.textContent = ctx.t('rsvp.error.network');
                status.classList.add('is-error');
            } finally {
                sending = false;
                submit.disabled = false;
                label.textContent = original;
            }
        });

        const stored = U.storage.get(storeKey(ctx));
        if (draft) {
            fill(form, draft);
        } else if (stored && stored.name) {
            fill(form, stored);
            showDone(stored);
        }
        syncYes();
        guests.addEventListener('change', () => {
            guests.value = String(Math.min(max, Math.max(1, Math.round(Number(guests.value) || 1))));
        });
    }

    WL.rsvp = { render, bind, snapshot, whatsappText, payload };
})(window);
