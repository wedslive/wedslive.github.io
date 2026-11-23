/*
 * weds.live invitation engine · foundation/time.js
 *
 * Event times are written as wall-clock time at the venue ("2027-02-06",
 * "12:31", "Asia/Kolkata"). Guests open the invitation from anywhere, so
 * every countdown and calendar export converts through the venue's zone
 * instead of trusting the guest's device clock zone.
 */
(function (root) {
    'use strict';

    const WL = root.WL;
    const { parseDate, parseTime } = WL.i18n;

    const offsetFormatters = new Map();
    function partsIn(timeZone) {
        if (!offsetFormatters.has(timeZone)) {
            offsetFormatters.set(timeZone, new Intl.DateTimeFormat('en-US', {
                timeZone, hourCycle: 'h23',
                year: 'numeric', month: 'numeric', day: 'numeric',
                hour: 'numeric', minute: 'numeric', second: 'numeric',
            }));
        }
        return offsetFormatters.get(timeZone);
    }

    // Offset (ms) of `timeZone` from UTC at instant `utcMs`.
    function zoneOffset(utcMs, timeZone) {
        const parts = partsIn(timeZone).formatToParts(new Date(utcMs));
        const v = {};
        parts.forEach((p) => { if (p.type !== 'literal') v[p.type] = +p.value; });
        const asUtc = Date.UTC(v.year, v.month - 1, v.day, v.hour % 24, v.minute, v.second);
        return asUtc - Math.floor(utcMs / 1000) * 1000;
    }

    function isValidZone(timeZone) {
        try { partsIn(timeZone); return true; } catch (e) { return false; }
    }

    // Wall-clock date + time at `timeZone` -> UTC epoch ms (DST-safe).
    function zonedToUtc(dateIso, hhmm, timeZone) {
        const d = parseDate(dateIso);
        if (!d) return null;
        const t = parseTime(hhmm || '00:00') || { h: 0, min: 0 };
        const wall = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), t.h, t.min);
        const tz = isValidZone(timeZone) ? timeZone : 'Asia/Kolkata';
        let guess = wall - zoneOffset(wall, tz);
        const second = wall - zoneOffset(guess, tz);
        if (second !== guess) guess = second;
        return guess;
    }

    function guestZone() {
        try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { return ''; }
    }

    // True when the guest's clock shows a different offset than the venue's.
    function differsFromGuest(utcMs, venueZone) {
        const gz = guestZone();
        if (!gz || !isValidZone(venueZone)) return false;
        return zoneOffset(utcMs, gz) !== zoneOffset(utcMs, venueZone);
    }

    function zoneLabel(utcMs, timeZone) {
        try {
            const city = timeZone.split('/').pop().replace(/_/g, ' ');
            const short = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'short' })
                .formatToParts(new Date(utcMs)).find((p) => p.type === 'timeZoneName');
            return short ? `${city}, ${short.value}` : city;
        } catch (e) {
            return timeZone;
        }
    }

    /* ---------- Countdown ---------- */

    function splitDuration(ms) {
        const s = Math.max(0, Math.floor(ms / 1000));
        return {
            days: Math.floor(s / 86400),
            hours: Math.floor((s % 86400) / 3600),
            minutes: Math.floor((s % 3600) / 60),
            seconds: s % 60,
        };
    }

    // Calls onTick({ days, hours, minutes, seconds, done }) once a second,
    // aligned to the wall-clock second, and pauses while the tab is hidden.
    function countdown(targetMs, onTick) {
        let timer = null;
        let stopped = false;

        function tick() {
            const diff = targetMs - Date.now();
            onTick(Object.assign(splitDuration(diff), { done: diff <= 0 }));
            if (diff <= 0 || stopped) return;
            timer = setTimeout(tick, 1000 - (Date.now() % 1000) + 8);
        }

        function onVisibility() {
            clearTimeout(timer);
            if (!document.hidden && !stopped) tick();
        }

        document.addEventListener('visibilitychange', onVisibility);
        tick();
        return function stop() {
            stopped = true;
            clearTimeout(timer);
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }

    /* ---------- Calendar export ---------- */

    const pad = (n) => String(n).padStart(2, '0');
    function icsStamp(ms) {
        const d = new Date(ms);
        return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
    }

    const icsEscape = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');

    // RFC 5545 folds lines longer than 75 octets.
    function fold(line) {
        const bytes = new TextEncoder().encode(line);
        if (bytes.length <= 75) return line;
        const out = [];
        let current = '';
        let size = 0;
        for (const ch of line) {
            const n = new TextEncoder().encode(ch).length;
            if (size + n > (out.length ? 74 : 75)) {
                out.push(current);
                current = '';
                size = 0;
            }
            current += ch;
            size += n;
        }
        out.push(current);
        return out.join('\r\n ');
    }

    // events: [{ uid, title, start (ms), end (ms), location, description, url }]
    function buildIcs(events, calendarName) {
        const now = icsStamp(Date.now());
        const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//weds.live//Invitation//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
        if (calendarName) lines.push(`X-WR-CALNAME:${icsEscape(calendarName)}`);
        events.forEach((ev) => {
            lines.push('BEGIN:VEVENT',
                `UID:${icsEscape(ev.uid)}@weds.live`,
                `DTSTAMP:${now}`,
                `DTSTART:${icsStamp(ev.start)}`,
                `DTEND:${icsStamp(ev.end)}`,
                `SUMMARY:${icsEscape(ev.title)}`);
            if (ev.location) lines.push(`LOCATION:${icsEscape(ev.location)}`);
            if (ev.description) lines.push(`DESCRIPTION:${icsEscape(ev.description)}`);
            if (ev.url) lines.push(`URL:${icsEscape(ev.url)}`);
            lines.push('BEGIN:VALARM', 'TRIGGER:-PT3H', 'ACTION:DISPLAY', `DESCRIPTION:${icsEscape(ev.title)}`, 'END:VALARM', 'END:VEVENT');
        });
        lines.push('END:VCALENDAR');
        return lines.map(fold).join('\r\n') + '\r\n';
    }

    function downloadIcs(events, fileName, calendarName) {
        const blob = new Blob([buildIcs(events, calendarName)], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = (fileName || 'invitation').replace(/[^a-z0-9-]+/gi, '-').toLowerCase() + '.ics';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
    }

    function googleCalendarUrl(ev) {
        const q = new URLSearchParams({
            action: 'TEMPLATE',
            text: ev.title,
            dates: `${icsStamp(ev.start)}/${icsStamp(ev.end)}`,
        });
        if (ev.location) q.set('location', ev.location);
        if (ev.description) q.set('details', ev.description);
        return `https://calendar.google.com/calendar/render?${q.toString()}`;
    }

    WL.time = {
        zoneOffset, isValidZone, zonedToUtc, guestZone, differsFromGuest, zoneLabel,
        splitDuration, countdown,
        buildIcs, downloadIcs, googleCalendarUrl,
    };
})(window);
