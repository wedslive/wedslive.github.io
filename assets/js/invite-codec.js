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

    // Unicode-safe base64, then made URL-safe (no +, /, = which can break in some chat apps)
    function encode(obj) {
        const json = JSON.stringify(obj);
        const b64 = btoa(unescape(encodeURIComponent(json)));
        return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    function decode(str) {
        if (!str) return null;
        let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
        while (b64.length % 4) b64 += '=';
        try {
            const json = decodeURIComponent(escape(atob(b64)));
            return JSON.parse(json);
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
