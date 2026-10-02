/*
 * invite-view.js — renders the invitation viewer (invite.html)
 * Reads the "?to=" query param for guest personalization and the "#i="
 * hash for the invitation data (see invite-codec.js), then builds the page.
 */
(function () {
    'use strict';

    const THEMES = {
        rose:      { bg: '#1a0a0f', accent: '#e8547a', wash: 'rgba(180, 48, 96, 0.35)' },
        royal:     { bg: '#0a1628', accent: '#5b8fd6', wash: 'rgba(30, 65, 120, 0.4)' },
        garden:    { bg: '#0d1f0d', accent: '#6fbf6f', wash: 'rgba(30, 90, 40, 0.4)' },
        lavender:  { bg: '#1a1428', accent: '#a68ad4', wash: 'rgba(90, 60, 150, 0.4)' },
        golden:    { bg: '#1f1208', accent: '#d4a552', wash: 'rgba(140, 90, 20, 0.4)' },
    };

    function escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Anyone can hand-craft an invite link, so never trust data.map as-is:
    // only plain web links are allowed (blocks javascript:, data:, etc.)
    function safeHttpUrl(value) {
        if (typeof value !== 'string' || !value) return '';
        try {
            const u = new URL(value);
            return (u.protocol === 'https:' || u.protocol === 'http:') ? u.href : '';
        } catch (e) {
            return '';
        }
    }

    function formatDate(dateStr, timeStr) {
        if (typeof dateStr !== 'string' || !dateStr) return '';
        const [y, m, d] = dateStr.split('-').map(Number);
        const dt = new Date(y, (m || 1) - 1, d || 1);
        if (isNaN(dt.getTime())) return dateStr;
        const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        let out = `${DAYS[dt.getDay()]}, ${dt.getDate()} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`;
        if (typeof timeStr === 'string' && /^\d{1,2}:\d{2}$/.test(timeStr)) {
            const [hh, mm] = timeStr.split(':').map(Number);
            const period = hh >= 12 ? 'PM' : 'AM';
            const hour12 = ((hh + 11) % 12) + 1;
            out += ` at ${hour12}:${String(mm).padStart(2, '0')} ${period}`;
        }
        return out;
    }

    function getEventTimestamp(dateStr, timeStr) {
        if (!dateStr) return null;
        const iso = `${dateStr}T${timeStr || '00:00'}:00`;
        const t = new Date(iso).getTime();
        return isNaN(t) ? null : t;
    }

    function renderNotFound(root) {
        root.innerHTML = `
        <div class="invite-notfound">
            <div>
                <h1 style="font-family:'Playfair Display', serif; font-size:1.6rem; margin-bottom:0.75rem;">Invitation link looks incomplete</h1>
                <p style="opacity:0.7; font-family:'Poppins', sans-serif; font-size:0.9rem; max-width:420px; margin:0 auto 1.5rem;">
                    This link may have been cut off when it was shared, or the invitation was never generated. Ask the couple to resend the full link.
                </p>
                <a href="create.html" style="color:#f5b8c8; font-family:'Poppins', sans-serif; font-size:0.9rem;">Create your own invitation →</a>
            </div>
        </div>`;
    }

    function startCountdown(targetTs) {
        const dEl = document.getElementById('inv-cd-days');
        const hEl = document.getElementById('inv-cd-hrs');
        const mEl = document.getElementById('inv-cd-min');
        const sEl = document.getElementById('inv-cd-sec');
        if (!dEl) return;

        const pad = n => String(Math.max(0, n)).padStart(2, '0');

        function tick() {
            const diff = targetTs - Date.now();
            if (diff <= 0) {
                dEl.textContent = hEl.textContent = mEl.textContent = sEl.textContent = '00';
                return;
            }
            dEl.textContent = pad(Math.floor(diff / 86400000));
            hEl.textContent = pad(Math.floor((diff % 86400000) / 3600000));
            mEl.textContent = pad(Math.floor((diff % 3600000) / 60000));
            sEl.textContent = pad(Math.floor((diff % 60000) / 1000));
        }

        tick();
        setInterval(tick, 1000);
    }

    function render(data) {
        const root = document.getElementById('invite-root');
        const theme = Object.prototype.hasOwnProperty.call(THEMES, data.theme) ? THEMES[data.theme] : THEMES.rose;
        const mapUrl = safeHttpUrl(data.map);
        const events = (Array.isArray(data.events) ? data.events : [])
            .filter(ev => ev && typeof ev === 'object' && (ev.name || ev.detail));

        document.body.style.background = theme.bg;
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.bg);

        const guestName = new URLSearchParams(window.location.search).get('to');
        const label = data.type === 'engagement' ? 'Engagement' : 'Wedding';

        document.title = `${data.groom} & ${data.bride}'s ${label} — weds.live`;

        const targetTs = getEventTimestamp(data.date, data.time);

        const eventsHtml = events.length
            ? `<div class="invite-events">${events.map(ev => `
                <div class="invite-event-card" style="border-color:${theme.accent}33;">
                    <div class="invite-event-name" style="color:${theme.accent};">${escapeHtml(ev.name)}</div>
                    <div class="invite-event-detail">${escapeHtml(ev.detail)}</div>
                </div>`).join('')}</div>`
            : '';

        root.innerHTML = `
        <section class="invite-hero" style="background: radial-gradient(circle at 50% 20%, ${theme.wash}, ${theme.bg} 70%);">
            <div class="invite-hero-inner">
                ${guestName ? `
                <div class="invite-guest-line">Dear</div>
                <div class="invite-guest-name">${escapeHtml(guestName)}</div>` : ''}

                <div class="invite-script">You are invited to our</div>
                <h1 class="invite-names" style="color:${theme.accent};">${escapeHtml(data.groom)} &amp; ${escapeHtml(data.bride)}</h1>
                <div class="invite-date">${escapeHtml(formatDate(data.date, data.time))}${data.venue ? ' · ' + escapeHtml(data.venue) : ''}</div>

                ${targetTs ? `
                <div class="invite-countdown">
                    <div class="invite-countdown-box"><span class="invite-countdown-num" id="inv-cd-days">00</span><span class="invite-countdown-unit">DAYS</span></div>
                    <div class="invite-countdown-box"><span class="invite-countdown-num" id="inv-cd-hrs">00</span><span class="invite-countdown-unit">HRS</span></div>
                    <div class="invite-countdown-box"><span class="invite-countdown-num" id="inv-cd-min">00</span><span class="invite-countdown-unit">MIN</span></div>
                    <div class="invite-countdown-box"><span class="invite-countdown-num" id="inv-cd-sec">00</span><span class="invite-countdown-unit">SEC</span></div>
                </div>` : ''}

                <div class="invite-scroll-hint">↓ Scroll down for details</div>
            </div>
        </section>

        ${data.msg ? `
        <section class="invite-section">
            <h2 class="invite-section-title" style="color:${theme.accent};">Our Message to You</h2>
            <p class="invite-message">${escapeHtml(data.msg)}</p>
        </section>` : ''}

        ${eventsHtml ? `
        <section class="invite-section">
            <h2 class="invite-section-title" style="color:${theme.accent};">Ceremony Schedule</h2>
            ${eventsHtml}
        </section>` : ''}

        ${mapUrl ? `
        <section class="invite-section" style="padding-top:0;">
            <a href="${escapeHtml(mapUrl)}" target="_blank" rel="noopener" class="invite-map-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 21s7-6.5 7-11a7 7 0 1 0-14 0c0 4.5 7 11 7 11Z" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="10" r="2.5" stroke="currentColor" stroke-width="1.8"/></svg>
                View Venue on Google Maps
            </a>
        </section>` : ''}

        <footer class="invite-footer">
            Made with ♥ using <a href="index.html">weds.live</a> — create your own free digital invitation
        </footer>`;

        if (targetTs) startCountdown(targetTs);
    }

    document.addEventListener('DOMContentLoaded', function () {
        const data = InviteCodec.readFromHash();
        if (!data || !data.groom || !data.bride || !data.date) {
            renderNotFound(document.getElementById('invite-root'));
            return;
        }
        render(data);
    });

    // Pasting a different invite link into the same tab only changes the hash,
    // which doesn't reload the page by itself
    window.addEventListener('hashchange', () => window.location.reload());
})();
