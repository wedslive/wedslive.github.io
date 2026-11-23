// Minimal Chrome DevTools Protocol client (Node 22+, no dependencies).
// Launches headless Chrome or Edge and drives one tab.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const CANDIDATES = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
].filter(Boolean);

export async function launch({ port = 9333 + Math.floor(Math.random() * 400), width = 1280, height = 900 } = {}) {
    const exe = CANDIDATES.find((p) => existsSync(p));
    if (!exe) throw new Error('Chrome/Edge not found; set CHROME_PATH');
    const profile = mkdtempSync(path.join(os.tmpdir(), 'wl-chrome-'));
    const proc = spawn(exe, [
        '--headless=new', `--remote-debugging-port=${port}`, '--remote-allow-origins=*',
        `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check',
        '--autoplay-policy=no-user-gesture-required', '--hide-scrollbars', '--mute-audio',
        `--window-size=${width},${height}`, 'about:blank',
    ], { stdio: 'ignore' });

    let target = null;
    for (let i = 0; i < 100 && !target; i++) {
        try {
            const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
            target = list.find((t) => t.type === 'page');
        } catch { /* starting */ }
        if (!target) await sleep(150);
    }
    if (!target) { proc.kill(); throw new Error('browser did not start'); }

    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
    let seq = 0;
    const pending = new Map();
    const listeners = new Set();
    ws.onmessage = (ev) => {
        const msg = JSON.parse(ev.data);
        if (msg.id && pending.has(msg.id)) {
            const { resolve, reject } = pending.get(msg.id);
            pending.delete(msg.id);
            if (msg.error) reject(new Error(msg.error.message)); else resolve(msg.result);
        } else if (msg.method) listeners.forEach((l) => l(msg));
    };
    const send = (method, params = {}) => new Promise((resolve, reject) => {
        const id = ++seq;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
    });
    const waitFor = (method, timeout = 20000) => new Promise((resolve, reject) => {
        const t = setTimeout(() => { listeners.delete(l); reject(new Error(`timeout waiting for ${method}`)); }, timeout);
        const l = (m) => { if (m.method === method) { clearTimeout(t); listeners.delete(l); resolve(m.params); } };
        listeners.add(l);
    });

    const errors = [];
    const consoleMessages = [];
    listeners.add((m) => {
        if (m.method === 'Runtime.exceptionThrown') {
            const d = m.params.exceptionDetails;
            errors.push((d.exception && d.exception.description) || d.text);
        }
        if (m.method === 'Runtime.consoleAPICalled') {
            const text = m.params.args.map((a) => a.value ?? a.description ?? '').join(' ');
            consoleMessages.push({ type: m.params.type, text });
            if (m.params.type === 'error') errors.push(`console.error: ${text}`);
        }
        if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') {
            errors.push(`${m.params.entry.text} ${m.params.entry.url || ''}`.trim());
        }
    });
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Log.enable');
    await send('Network.enable');

    const api = {
        send, waitFor, errors, consoleMessages, listeners,
        async viewport(w, h, { mobile = w < 800, dpr = 1 } = {}) {
            await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile });
            await send('Emulation.setTouchEmulationEnabled', { enabled: mobile });
        },
        async media(features) {
            await send('Emulation.setEmulatedMedia', { features });
        },
        async goto(url, { settle = 400 } = {}) {
            errors.length = 0;
            consoleMessages.length = 0;
            const loaded = waitFor('Page.loadEventFired', 30000);
            await send('Page.navigate', { url });
            await loaded;
            await sleep(settle);
        },
        async eval(expression) {
            const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true });
            if (r.exceptionDetails) {
                throw new Error('eval failed: ' + ((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text));
            }
            return r.result.value;
        },
        async waitUntil(expression, { timeout = 15000, interval = 100 } = {}) {
            const end = Date.now() + timeout;
            while (Date.now() < end) {
                if (await api.eval(`!!(${expression})`)) return true;
                await sleep(interval);
            }
            throw new Error(`timeout: ${expression}`);
        },
        async click(selector) {
            // Scroll, then wait until the element stops moving (lazy-rendered
            // sections can shift layout just after a jump) before pressing.
            const measure = () => api.eval(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return null;
                const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
            const found = await api.eval(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return false;
                el.scrollIntoView({ block: 'center', inline: 'center' }); return true; })()`);
            if (!found) throw new Error(`click: no element ${selector}`);
            let box = await measure();
            for (let i = 0; i < 20; i++) {
                await sleep(80);
                const next = await measure();
                const still = Math.abs(next.x - box.x) < 0.5 && Math.abs(next.y - box.y) < 0.5;
                box = next;
                if (still && i > 0) break;
                if (!still) await api.eval(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({ block: 'center', inline: 'center' })`);
            }
            for (const type of ['mousePressed', 'mouseReleased']) {
                await send('Input.dispatchMouseEvent', { type, x: box.x, y: box.y, button: 'left', clickCount: 1 });
            }
        },
        async tap(selector) {
            const box = await api.eval(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return null;
                const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
            if (!box) throw new Error(`tap: no element ${selector}`);
            await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x, y: box.y }] });
            await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        },
        async key(key, code = key, keyCode = 0) {
            // Enter / Space need `text` so Chrome also fires keypress (button activation).
            const text = key === 'Enter' ? '\r' : key === ' ' ? ' ' : undefined;
            await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode, ...(text ? { text, unmodifiedText: text } : {}) });
            await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode });
        },
        async type(text) { await send('Input.insertText', { text }); },
        async screenshot(file, { clip, fullPage = false, format = 'png', quality } = {}) {
            const params = { format, captureBeyondViewport: fullPage || !!clip };
            if (quality) params.quality = quality;
            if (clip) params.clip = { ...clip, scale: 1 };
            else if (fullPage) {
                const size = await api.eval('({ w: document.documentElement.clientWidth, h: Math.min(document.documentElement.scrollHeight, 16000) })');
                params.clip = { x: 0, y: 0, width: size.w, height: size.h, scale: 1 };
            }
            const r = await send('Page.captureScreenshot', params);
            if (file) writeFileSync(file, Buffer.from(r.data, 'base64'));
            return r.data;
        },
        async close() {
            try { ws.close(); } catch { /* ignore */ }
            proc.kill();
            await sleep(300);
            try { rmSync(profile, { recursive: true, force: true }); } catch { /* locked files */ }
        },
    };
    return api;
}
