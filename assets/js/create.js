/*
 * create.js — logic for the invitation builder (create.html)
 * Collects form input, validates it, packs it into a URL via InviteCodec,
 * renders a QR code for that URL, and offers copy/download/share actions.
 *
 * No backend: the generated link fully encodes the invitation. Nothing is
 * uploaded or stored on a server, so there is no login and no data at rest
 * to protect — the couple is responsible for who they share the link with.
 */
(function () {
    'use strict';

    const form = document.getElementById('invite-form');
    const eventsList = document.getElementById('events-list');
    const addEventBtn = document.getElementById('add-event-btn');
    const resultPanel = document.getElementById('result-panel');

    const QR_COLOR_DARK = '#2d0f1e';
    const QR_COLOR_LIGHT = '#ffffff';
    const QR_QUIET_ZONE = 4;        // modules of white border the QR spec requires
    const QR_SCREEN_PX = 480;       // drawn at 2x+ and shown at 200px so it stays sharp
    const QR_PRINT_PX = 1200;       // ~10 cm at 300 dpi, enough for any card size

    let eventRowCount = 0;
    let currentQrModel = null;

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function isHttpUrl(value) {
        try {
            const u = new URL(value);
            return u.protocol === 'https:' || u.protocol === 'http:';
        } catch (e) {
            return false;
        }
    }

    /* ---------- Ceremony rows ---------- */

    function addEventRow(prefill) {
        eventRowCount++;
        const n = eventRowCount;
        const row = document.createElement('div');
        row.className = 'event-row';
        row.innerHTML = `
            <div class="form-group" style="margin-bottom:0;">
                <label for="event-name-${n}">Ceremony name</label>
                <input type="text" id="event-name-${n}" class="form-control event-name" maxlength="60" placeholder="e.g. Haldi Ceremony" value="${prefill ? escapeHtml(prefill.name) : ''}">
            </div>
            <div class="form-group" style="margin-bottom:0;">
                <label for="event-detail-${n}">Date &amp; details</label>
                <input type="text" id="event-detail-${n}" class="form-control event-detail" maxlength="120" placeholder="e.g. 26 Apr 2026, 4 PM onwards" value="${prefill ? escapeHtml(prefill.detail) : ''}">
            </div>
            <button type="button" class="remove-event" aria-label="Remove this ceremony">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6L18 18M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            </button>`;
        row.querySelector('.remove-event').addEventListener('click', () => {
            row.remove();
            addEventBtn.focus();
        });
        eventsList.appendChild(row);
        return row;
    }

    addEventBtn.addEventListener('click', () => {
        addEventRow().querySelector('.event-name').focus();
    });

    // Seed with one empty ceremony row to show what's expected
    addEventRow({ name: '', detail: '' });

    // Keep the visual "active" ring in sync with the selected theme swatch
    document.querySelectorAll('#theme-swatches input[name="theme"]').forEach(input => {
        input.addEventListener('change', () => {
            document.querySelectorAll('.theme-swatch').forEach(sw => sw.classList.remove('active'));
            input.closest('.theme-swatch').classList.add('active');
        });
    });

    /* ---------- Validation ---------- */

    function clearErrors() {
        form.querySelectorAll('.field-error').forEach(el => {
            el.classList.remove('field-error');
            el.removeAttribute('aria-invalid');
            el.removeAttribute('aria-describedby');
        });
        form.querySelectorAll('.error-text').forEach(el => el.classList.remove('show'));
    }

    function markInvalid(input) {
        input.classList.add('field-error');
        input.setAttribute('aria-invalid', 'true');
        const err = input.parentElement.querySelector('.error-text');
        if (err) {
            if (!err.id) err.id = input.id + '-error';
            input.setAttribute('aria-describedby', err.id);
            err.classList.add('show');
        }
    }

    function validate() {
        clearErrors();
        let valid = true;

        ['groomName', 'brideName', 'mainDate', 'venue'].forEach(id => {
            const input = document.getElementById(id);
            if (!input.value.trim()) {
                markInvalid(input);
                valid = false;
            }
        });

        // Only real web links are allowed for the map button
        const map = document.getElementById('mapUrl');
        if (map.value.trim() && !isHttpUrl(map.value.trim())) {
            markInvalid(map);
            valid = false;
        }

        return valid;
    }

    function collectData() {
        const events = Array.from(eventsList.querySelectorAll('.event-row')).map(row => ({
            name: row.querySelector('.event-name').value.trim(),
            detail: row.querySelector('.event-detail').value.trim(),
        })).filter(e => e.name || e.detail);

        return {
            v: 1, // schema version, in case the format changes later
            groom: document.getElementById('groomName').value.trim(),
            bride: document.getElementById('brideName').value.trim(),
            type: document.getElementById('inviteType').value,
            date: document.getElementById('mainDate').value,
            time: document.getElementById('mainTime').value,
            venue: document.getElementById('venue').value.trim(),
            map: document.getElementById('mapUrl').value.trim(),
            msg: document.getElementById('message').value.trim(),
            theme: (form.querySelector('input[name="theme"]:checked') || {}).value || 'rose',
            events: events,
        };
    }

    /* ---------- QR code ---------- */

    // qrcodejs draws modules at fractional pixel sizes with no white border,
    // which looks soft and can fail to scan once printed on a coloured card.
    // We only use it to compute the module matrix (its internal _oQRCode model;
    // the library is vendored, so this won't change under us) and draw the
    // canvas ourselves: whole-pixel modules plus the required quiet zone.
    function buildQrModel(text) {
        const holder = document.createElement('div');
        // eslint-disable-next-line no-undef
        const qr = new QRCode(holder, {
            text: text,
            width: 64,
            height: 64,
            correctLevel: QRCode.CorrectLevel.M,
        });
        return qr._oQRCode;
    }

    function drawQr(model, targetPx) {
        const count = model.getModuleCount();
        const totalModules = count + QR_QUIET_ZONE * 2;
        const scale = Math.max(1, Math.ceil(targetPx / totalModules));
        const size = totalModules * scale;

        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = QR_COLOR_LIGHT;
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = QR_COLOR_DARK;
        for (let row = 0; row < count; row++) {
            for (let col = 0; col < count; col++) {
                if (model.isDark(row, col)) {
                    ctx.fillRect((col + QR_QUIET_ZONE) * scale, (row + QR_QUIET_ZONE) * scale, scale, scale);
                }
            }
        }
        return canvas;
    }

    function renderQr(url) {
        const wrap = document.getElementById('qr-canvas-wrap');
        const caption = document.getElementById('qr-caption');
        const errorEl = document.getElementById('qr-error');
        const downloadBtn = document.getElementById('download-qr-btn');

        wrap.innerHTML = '';
        errorEl.hidden = true;
        currentQrModel = null;

        try {
            currentQrModel = buildQrModel(url);
        } catch (err) {
            wrap.style.display = 'none';
            caption.hidden = true;
            downloadBtn.disabled = true;
            errorEl.textContent = 'This invitation has too much text to fit in a QR code. Shorten the message or ceremony details and generate again. The link above still works for sharing.';
            errorEl.hidden = false;
            return;
        }

        const canvas = drawQr(currentQrModel, QR_SCREEN_PX);
        canvas.className = 'qr-canvas';
        canvas.setAttribute('role', 'img');
        canvas.setAttribute('aria-label', 'QR code that opens your invitation link');
        wrap.appendChild(canvas);
        wrap.style.display = '';
        caption.hidden = false;
        downloadBtn.disabled = false;
    }

    function downloadQr(slug) {
        if (!currentQrModel) return;
        const canvas = drawQr(currentQrModel, QR_PRINT_PX);
        const link = document.createElement('a');
        link.download = `weds-live-qr-${slug}.png`;
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        link.remove();
    }

    // A QR generated on a test setup encodes that test address, not weds.live.
    // Warn so nobody prints a QR that only works on their own computer.
    function localTestWarning() {
        const { protocol, hostname } = window.location;
        if (protocol === 'file:') {
            return 'Test mode: this page was opened as a file on your computer, so the QR code points to that file and phones can\'t open it. Use a local server or weds.live for a scannable QR.';
        }
        if (/^(localhost|127\.\d+\.\d+\.\d+|\[::1\])$/.test(hostname)) {
            return 'Test mode: this QR code points to localhost, which only opens on this computer. Open this page using your computer\'s Wi-Fi IP address (e.g. http://192.168.1.5:8090/create.html) to scan it with your phone.';
        }
        if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(hostname)) {
            return 'Test mode: this QR code only works on devices connected to the same Wi-Fi. Generate the final QR for your printed cards on weds.live.';
        }
        return '';
    }

    /* ---------- Copy link ---------- */

    async function copyText(text, input) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (e) {
            // navigator.clipboard only exists on https/localhost; plain http
            // (e.g. testing on http://192.168.x.x) needs the legacy fallback
            input.focus();
            input.select();
            try {
                return document.execCommand('copy');
            } catch (err) {
                return false;
            }
        }
    }

    /* ---------- Submit ---------- */

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        if (!validate()) {
            const firstInvalid = form.querySelector('.field-error');
            if (firstInvalid) {
                firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstInvalid.focus({ preventScroll: true });
            }
            return;
        }

        const data = collectData();
        const url = InviteCodec.buildUrl(data, 'invite.html');
        const urlInput = document.getElementById('result-url');

        urlInput.value = url;
        document.getElementById('preview-invite-btn').href = url;
        renderQr(url);

        const warning = localTestWarning();
        const warnEl = document.getElementById('qr-local-warning');
        warnEl.textContent = warning;
        warnEl.hidden = !warning;

        resultPanel.style.display = 'block';
        resultPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        resultPanel.focus({ preventScroll: true });

        const copyBtn = document.getElementById('copy-link-btn');
        copyBtn.onclick = async () => {
            const ok = await copyText(url, urlInput);
            copyBtn.textContent = ok ? 'Copied!' : 'Press Ctrl+C';
            setTimeout(() => { copyBtn.textContent = 'Copy Link'; }, 1800);
        };

        const namesSlug = `${data.groom}-${data.bride}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'invite';
        document.getElementById('download-qr-btn').onclick = () => downloadQr(namesSlug);

        const whatsappText = encodeURIComponent(`You're invited! 💌 ${data.groom} & ${data.bride}'s ${data.type === 'engagement' ? 'engagement' : 'wedding'} — view the invitation here: ${url}`);
        document.getElementById('whatsapp-share-btn').onclick = () => {
            window.open(`https://wa.me/?text=${whatsappText}`, '_blank', 'noopener');
        };
    });
})();
