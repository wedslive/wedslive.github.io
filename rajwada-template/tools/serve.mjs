// Static dev server for the invitation templates (no dependencies).
//   node tools/serve.mjs [port]      -> http://localhost:8090/invitations/templates/rajwada/
// Also exposes a mock RSVP endpoint for local testing:
//   POST /__rsvp   stores the JSON body in memory, answers {"ok":true}
//   GET  /__rsvp   lists what was received (QA uses this)
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = {
    '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif',
    '.ico': 'image/x-icon', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
    '.md': 'text/plain; charset=utf-8', '.ics': 'text/calendar',
};

export function createServer() {
    const received = [];
    const server = http.createServer(async (req, res) => {
        const url = new URL(req.url, 'http://localhost');
        if (url.pathname === '/__rsvp') {
            res.setHeader('Access-Control-Allow-Origin', '*');
            if (req.method === 'POST') {
                let body = '';
                for await (const chunk of req) { body += chunk; if (body.length > 20000) break; }
                let json = null;
                try { json = JSON.parse(body); } catch { /* invalid */ }
                received.push({ at: Date.now(), contentType: req.headers['content-type'] || '', json });
                res.writeHead(json ? 200 : 400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: !!json }));
                return;
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(received));
            return;
        }
        let file = path.normalize(path.join(ROOT, decodeURIComponent(url.pathname)));
        if (!file.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
        try {
            const s = await stat(file);
            if (s.isDirectory()) file = path.join(file, 'index.html');
            const data = await readFile(file);
            res.writeHead(200, {
                'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
                'Cache-Control': 'no-store',
            });
            res.end(data);
        } catch {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not found');
        }
    });
    return { server, received };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const port = Number(process.argv[2]) || 8090;
    createServer().server.listen(port, () => {
        console.log(`Serving ${ROOT}\n  http://localhost:${port}/invitations/templates/rajwada/`);
    });
}
