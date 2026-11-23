// Static checks: JS syntax for every engine/template file, and JSON validity
// of every inline #wl-config block and content/*.json file.
//   node tools/check.mjs
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const walk = (dir) => readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
});
const files = walk(path.join(ROOT, 'invitations'));
let failures = 0;

for (const f of files.filter((p) => p.endsWith('.js'))) {
    try {
        execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' });
        console.log('ok    ', path.relative(ROOT, f));
    } catch (e) {
        failures++;
        console.log('FAIL  ', path.relative(ROOT, f), '\n', String(e.stderr));
    }
}

const CONFIG_RE = /<script type="application\/json" id="wl-config">([\s\S]*?)<\/script>/;
for (const f of files.filter((p) => p.endsWith('.html'))) {
    const m = readFileSync(f, 'utf8').match(CONFIG_RE);
    if (!m) continue;
    try {
        const cfg = JSON.parse(m[1]);
        console.log('ok    ', path.relative(ROOT, f), `(config: ${(cfg.events || []).length} events)`);
    } catch (e) {
        failures++;
        console.log('FAIL  ', path.relative(ROOT, f), e.message);
    }
}

for (const f of files.filter((p) => p.endsWith('.json'))) {
    try {
        JSON.parse(readFileSync(f, 'utf8'));
        console.log('ok    ', path.relative(ROOT, f));
    } catch (e) {
        failures++;
        console.log('FAIL  ', path.relative(ROOT, f), e.message);
    }
}

console.log(failures ? `\n${failures} problem(s)` : '\nall checks passed');
process.exit(failures ? 1 : 0);
