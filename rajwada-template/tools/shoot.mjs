// Quick visual check: screenshot a page at one or more viewport sizes.
//   node tools/shoot.mjs <path-or-url> <out-prefix> [WxH ...] [--full] [--wait=ms] [--js="expr"] [--reduce]
// Example:
//   node tools/shoot.mjs /invitations/templates/rajwada/?open=1 qa-output/hero 360x780 1280x800
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { createServer } from './serve.mjs';
import { launch } from './lib/chrome.mjs';

const args = process.argv.slice(2);
const flags = Object.fromEntries(args.filter((a) => a.startsWith('--')).map((a) => {
    const [k, ...v] = a.slice(2).split('=');
    return [k, v.length ? v.join('=') : true];
}));
const [target, prefix, ...sizes] = args.filter((a) => !a.startsWith('--'));
if (!target || !prefix) {
    console.log('usage: node tools/shoot.mjs <path-or-url> <out-prefix> [WxH ...] [--full] [--wait=ms] [--js=expr] [--reduce]');
    process.exit(1);
}

const { server } = createServer();
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}`;
const url = /^https?:/.test(target) ? target : base + target;
mkdirSync(path.dirname(path.resolve(prefix)), { recursive: true });

const browser = await launch();
try {
    if (flags.reduce) await browser.media([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    for (const size of (sizes.length ? sizes : ['390x844'])) {
        const [w, h] = size.split('x').map(Number);
        await browser.viewport(w, h);
        await browser.goto(url, { settle: 300 });
        await sleep(Number(flags.wait || 1500));
        const js = flags.jsfile ? readFileSync(flags.jsfile, 'utf8') : flags.js;
        if (js) { console.log('js ->', await browser.eval(js)); await sleep(Number(flags.after || 600)); }
        const file = `${prefix}-${w}x${h}.png`;
        await browser.screenshot(file, { fullPage: !!flags.full });
        console.log('saved', file);
    }
    if (browser.errors.length) console.log('page errors:\n  ' + browser.errors.join('\n  '));
} finally {
    await browser.close();
    server.close();
}
