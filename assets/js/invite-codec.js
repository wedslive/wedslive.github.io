/*
 * invite-codec.js
 * Shared helpers for encoding/decoding invitation data into a URL-safe string.
 * Used by both create.html (the builder) and invite.html (the viewer).
 *
 * The whole invitation is packed into the URL hash itself (#i=...), so no
 * backend or database is required — the link IS the invitation. Keep field
 * keys short since every character ends up in the shared URL.
 *
 * Printed QR codes point at invite.html#i=... forever, so never rename
 * invite.html or change decode() in a way that stops old links working.
 */
const InviteCodec = (() => {

    // Short keys to keep URL (and QR) compact
    const KEY_MAP = {
        v: 'v',       // schema version
        groom: 'g',
        bride: 'b',
        type: 't',
        date: 'd',
        time: 'i',
        venue: 'n',   // 'venue' -> 'n' (place)
        map: 'm',
        msg: 'x',
        theme: 'h',
        events: 'e'
    };

    const REV_KEY_MAP = Object.fromEntries(Object.entries(KEY_MAP).map(([k, v]) => [v, k]));

    function toShortKeys(obj) {
        const out = {};
        for (const [key, val] of Object.entries(obj)) {
            if (val === '' || val === undefined || val === null) continue;
            if (Array.isArray(val) && val.length === 0) continue;
            const shortKey = KEY_MAP[key] || key;
            out[shortKey] = val;
        }
        return out;
    }

    function toLongKeys(obj) {
        const out = {};
        for (const [key, val] of Object.entries(obj)) {
            const longKey = REV_KEY_MAP[key] || key;
            out[longKey] = val;
        }
        // Ensure all expected fields exist (backward compat)
        const defaults = { v: 1, groom: '', bride: '', type: 'wedding', date: '', time: '11:00', venue: '', map: '', msg: '', theme: 'rose', events: [] };
        return { ...defaults, ...out };
    }

    // Unicode-safe base64, then made URL-safe (no +, /, = which can break in some chat apps)
    function encode(obj) {
        const compact = toShortKeys(obj);
        const json = JSON.stringify(compact);
        const b64 = btoa(unescape(encodeURIComponent(json)));
        return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    function decode(str) {
        if (!str) return null;
        let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
        while (b64.length % 4) b64 += '=';
        try {
            const json = decodeURIComponent(escape(atob(b64)));
            const compact = JSON.parse(json);
            return toLongKeys(compact);
        } catch (e) {
            return null;
        }
    }

    // Build the full shareable URL for a given data object, resolved relative
    // to the current page. Works on weds.live, on a local test server
    // (http://192.168.x.x:8090) and when create.html is opened straight from disk.
    function buildUrl(data, basePath = 'invite.html') {
        const url = new URL(basePath, window.location.href);
        url.search = '';
        url.hash = 'i=' + encode(data);
        return url.href;
    }

    function readFromHash() {
        const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        return decode(params.get('i'));
    }

    return { encode, decode, buildUrl, readFromHash };
})();
