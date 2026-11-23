/*
 * Rajwada · art library
 *
 * All Rajwada artwork is vector, drawn in code: cusped (multifoil) palace
 * arches built from real two-centred arch geometry, jaali lattice, lotus
 * rosettes, chhatri pavilions, kandil lanterns, caparisoned elephants, a wax
 * seal and line icons for every ceremony. Nothing here knows about a couple;
 * sections pass in sizes and text.
 *
 * Colour roles (see rajwada.css): gold #c9a24a family, maroon #4b0d19
 * family, ivory #f8f0de. Gradients live in defs() and are referenced by id.
 */
(function (root) {
    'use strict';

    const WL = root.WL;
    const r2 = (n) => Math.round(n * 100) / 100;

    /* ---------- Geometry ---------- */

    // Points along a two-centred pointed arch from (x0, sy) over the apex to (x1, sy).
    function archCurve(x0, x1, sy, apexY) {
        const w = x1 - x0;
        const H = Math.max(sy - apexY, w * 0.5);
        const R = (H * H + (w / 2) * (w / 2)) / w;
        const thetaA = Math.acos(Math.max(-1, Math.min(1, 1 - (w / 2) / R)));
        const L = R * thetaA;
        return {
            length: 2 * L,
            at(s) {
                if (s <= L) {
                    const th = s / R;
                    return [x0 + R - R * Math.cos(th), sy - R * Math.sin(th)];
                }
                const th = (2 * L - s) / R;
                return [x1 - (R - R * Math.cos(th)), sy - R * Math.sin(th)];
            },
        };
    }

    // Cusped arch opening: straight jambs, `foils` lobes, a pointed crown lobe.
    // Returns path data; closed along the bottom when `bottomY` is given.
    function cuspedArch(x0, x1, sy, apexY, bottomY, foils, depth) {
        const n = foils % 2 ? foils : foils + 1;
        const k = depth || 1.04;
        const curve = archCurve(x0, x1, sy, apexY);
        const seg = curve.length / n;
        let d = bottomY != null ? `M${r2(x0)},${r2(bottomY)} L${r2(x0)},${r2(sy)}` : `M${r2(x0)},${r2(sy)}`;
        for (let j = 0; j < n; j++) {
            const [ax, ay] = curve.at(j * seg);
            const [bx, by] = curve.at((j + 1) * seg);
            const chord = Math.hypot(bx - ax, by - ay);
            const r = (chord / 2) * k;
            if (j === (n - 1) / 2) {
                // Crown lobe rises to a soft point.
                const mx = (ax + bx) / 2;
                const peakY = Math.min(ay, by) - chord * 0.62;
                const rc = chord * 0.62;
                d += ` A${r2(rc)},${r2(rc)} 0 0 1 ${r2(mx)},${r2(peakY)} A${r2(rc)},${r2(rc)} 0 0 1 ${r2(bx)},${r2(by)}`;
            } else {
                d += ` A${r2(r)},${r2(r)} 0 0 1 ${r2(bx)},${r2(by)}`;
            }
        }
        if (bottomY != null) d += ` L${r2(x1)},${r2(bottomY)} Z`;
        return d;
    }

    // Smooth pointed arch outline (the moulding around a cusped opening).
    function pointedArch(x0, x1, sy, apexY, bottomY) {
        const curve = archCurve(x0, x1, sy, apexY);
        const steps = 40;
        let d = bottomY != null ? `M${r2(x0)},${r2(bottomY)} L${r2(x0)},${r2(sy)}` : `M${r2(x0)},${r2(sy)}`;
        for (let i = 1; i <= steps; i++) {
            const [x, y] = curve.at((curve.length * i) / steps);
            d += ` L${r2(x)},${r2(y)}`;
        }
        if (bottomY != null) d += ` L${r2(x1)},${r2(bottomY)}`;
        return d;
    }

    function beadsAlong(x0, x1, sy, apexY, count, radius) {
        const curve = archCurve(x0, x1, sy, apexY);
        let out = '';
        for (let i = 1; i < count; i++) {
            const [x, y] = curve.at((curve.length * i) / count);
            out += `<circle cx="${r2(x)}" cy="${r2(y)}" r="${radius}"/>`;
        }
        return out;
    }

    // Normalised (0..1) cusped arch for objectBoundingBox clip paths. Every
    // "a,b" pair in the path (points and arc radii alike) scales by (1/w, 1/h),
    // so on a box of the same aspect ratio the lobes stay circular.
    function archClipPath(aspect, foils) {
        const w = 300;
        const h = w / aspect;
        const d = cuspedArch(0, w, w * 0.62, w * 0.04, h, foils || 9, 1.02);
        const n = (v) => Math.round(v * 10000) / 10000;
        return d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (m, x, y) => `${n(x / w)},${n(y / h)}`);
    }

    /* ---------- Shared defs ---------- */

    function defs() {
        return `
        <svg class="wl-defs" aria-hidden="true" focusable="false">
            <defs>
                <linearGradient id="rj-gold" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stop-color="#8a6422"/><stop offset=".24" stop-color="#e6c87a"/>
                    <stop offset=".46" stop-color="#b98b3b"/><stop offset=".64" stop-color="#f6e6ae"/>
                    <stop offset=".82" stop-color="#c49744"/><stop offset="1" stop-color="#7c591c"/>
                </linearGradient>
                <linearGradient id="rj-gold-soft" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stop-color="#f3dfa0"/><stop offset=".55" stop-color="#cfa651"/><stop offset="1" stop-color="#9b7429"/>
                </linearGradient>
                <radialGradient id="rj-wax" cx=".36" cy=".3" r=".78">
                    <stop offset="0" stop-color="#c5344a"/><stop offset=".45" stop-color="#931a2d"/><stop offset="1" stop-color="#560a16"/>
                </radialGradient>
                <radialGradient id="rj-wax-inner" cx=".5" cy=".55" r=".6">
                    <stop offset="0" stop-color="#7d1224"/><stop offset="1" stop-color="#9d2034"/>
                </radialGradient>
                <radialGradient id="rj-glow" cx=".5" cy=".5" r=".5">
                    <stop offset="0" stop-color="#ffd98c" stop-opacity=".55"/><stop offset="1" stop-color="#ffd98c" stop-opacity="0"/>
                </radialGradient>
                <radialGradient id="rj-flame" cx=".5" cy=".7" r=".6">
                    <stop offset="0" stop-color="#fff4cf"/><stop offset=".5" stop-color="#ffc35c"/><stop offset="1" stop-color="#e0701f"/>
                </radialGradient>
                <clipPath id="rj-clip-arch" clipPathUnits="objectBoundingBox"><path d="${archClipPath(3 / 4, 9)}"/></clipPath>
                <clipPath id="rj-clip-arch-wide" clipPathUnits="objectBoundingBox"><path d="${archClipPath(4 / 3, 11)}"/></clipPath>
            </defs>
        </svg>`;
    }

    /* ---------- Ornaments ---------- */

    function petal(r0, r1, w) {
        const a = r1 - r0;
        return `M0,${-r0} C${w},${r2(-r0 - a * 0.28)} ${r2(w * 0.5)},${r2(-r1 + a * 0.22)} 0,${-r1} C${r2(-w * 0.5)},${r2(-r1 + a * 0.22)} ${-w},${r2(-r0 - a * 0.28)} 0,${-r0}Z`;
    }

    // Lotus rosette medallion centred on 0,0 (use inside a translated <g>).
    function rosette(r, petals) {
        const n = petals || 16;
        let out = '';
        for (let i = 0; i < n; i++) out += `<path d="${petal(r * 0.52, r * 0.98, r * 0.17)}" transform="rotate(${r2((360 / n) * i)})"/>`;
        for (let i = 0; i < n / 2; i++) out += `<path d="${petal(r * 0.2, r * 0.56, r * 0.15)}" transform="rotate(${r2((360 / (n / 2)) * i + 180 / n)})"/>`;
        return `<g class="rj-rosette">${out}<circle r="${r2(r * 0.17)}"/><circle r="${r2(r * 0.06)}" class="rj-fill"/></g>`;
    }

    function divider(cls) {
        return `<svg class="rj-divider ${cls || ''}" viewBox="0 0 280 34" aria-hidden="true" focusable="false">
            <g class="rj-line">
                <path d="M12,17 H112 M168,17 H268"/>
                <path d="M30,17 C44,9 58,9 70,17 C58,25 44,25 30,17Z M250,17 C236,9 222,9 210,17 C222,25 236,25 250,17Z" class="rj-fill-soft"/>
                <path d="M140,4 C147,10 148,22 140,30 C132,22 133,10 140,4Z"/>
                <path d="M140,30 C134,26 124,25 117,17 C127,15 136,20 140,30Z M140,30 C146,26 156,25 163,17 C153,15 144,20 140,30Z"/>
                <path d="M140,30 C137,24 130,17 126,8 C134,10 139,18 140,30Z M140,30 C143,24 150,17 154,8 C146,10 141,18 140,30Z"/>
            </g>
            <g class="rj-fill"><circle cx="8" cy="17" r="2.4"/><circle cx="272" cy="17" r="2.4"/><circle cx="112" cy="17" r="1.6"/><circle cx="168" cy="17" r="1.6"/></g>
        </svg>`;
    }

    function corner(cls) {
        return `<svg class="rj-corner ${cls || ''}" viewBox="0 0 90 90" aria-hidden="true" focusable="false">
            <g class="rj-line">
                <path d="M4,86 V4 H86 M11,86 V11 H86"/>
                <path d="M11,11 C30,12 40,24 38,38 C36,50 22,52 18,44 C14,36 22,30 28,34"/>
                <path d="M38,38 C46,30 60,30 66,22 M38,38 C30,46 30,60 22,66"/>
                <path d="M66,22 C70,16 78,16 80,22 C82,28 74,30 72,26 M22,66 C16,70 16,78 22,80 C28,82 30,74 26,72"/>
            </g>
            <g class="rj-fill"><circle cx="46" cy="46" r="2.6"/><circle cx="58" cy="12" r="1.5"/><circle cx="12" cy="58" r="1.5"/></g>
        </svg>`;
    }

    // Jaali (8-point star lattice) as a CSS background image.
    function jaaliDataUri(color, opacity) {
        const c = encodeURIComponent(color);
        const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'><g fill='none' stroke='${c}' stroke-opacity='${opacity}' stroke-width='1'><path d='M32 15 L49 32 L32 49 L15 32Z'/><path d='M20 20 H44 V44 H20Z'/><path d='M32 0 V15 M32 49 V64 M0 32 H15 M49 32 H64 M0 0 L20 20 M64 0 L44 20 M0 64 L20 44 M64 64 L44 44'/><circle cx='32' cy='32' r='4.5'/></g></svg>`;
        return `url("data:image/svg+xml,${svg.replace(/</g, '%3C').replace(/>/g, '%3E').replace(/#/g, '%23')}")`;
    }

    /* ---------- Hero frame (sized to its box) ---------- */

    function heroFrame(w, h, opts) {
        const o = opts || {};
        const inset = 8;
        const pillar = Math.max(14, Math.min(26, w * 0.05));
        const x0 = inset + pillar + 8;
        const x1 = w - x0;
        const openW = x1 - x0;
        const headH = Math.min(openW * (o.headRatio || 0.66), h * 0.36);
        const apexY = o.apexY || Math.max(78, Math.min(124, h * 0.1));
        const sy = apexY + headH;
        const bottom = h - inset - 6;
        const band = Math.max(10, Math.min(16, w * 0.032));
        const ox0 = x0 - band;
        const ox1 = x1 + band;
        const oApex = apexY - band * 1.35;
        const foils = openW > 420 ? 13 : 11;
        const cx = w / 2;

        const capital = (x, dir) => {
            const y = sy;
            return `<path d="M${r2(x - pillar / 2 - 3)},${r2(y)} H${r2(x + pillar / 2 + 3)} M${r2(x - pillar / 2)},${r2(y + 6)} Q${r2(x)},${r2(y + 16)} ${r2(x + pillar / 2)},${r2(y + 6)} M${r2(x - pillar / 2 + 2)},${r2(y - 7)} H${r2(x + pillar / 2 - 2)}"/>`
                + `<circle cx="${r2(x)}" cy="${r2(y - 12)}" r="2" class="rj-fill"/>`
                + (dir ? '' : '');
        };
        const lx = inset + pillar / 2 + 4;
        const rx = w - lx;

        return `<svg class="rj-hero__frame" viewBox="0 0 ${r2(w)} ${r2(h)}" width="${r2(w)}" height="${r2(h)}" aria-hidden="true" focusable="false">
            <g class="rj-line rj-line--frame">
                <rect x="${inset}" y="${inset}" width="${r2(w - inset * 2)}" height="${r2(h - inset * 2)}" class="rj-draw" pathLength="1"/>
                <rect x="${inset + 5}" y="${inset + 5}" width="${r2(w - inset * 2 - 10)}" height="${r2(h - inset * 2 - 10)}" class="rj-hair rj-draw" pathLength="1"/>
                <path d="${pointedArch(ox0, ox1, sy, oApex, bottom)}" class="rj-draw" pathLength="1"/>
                <path d="${cuspedArch(x0, x1, sy, apexY, bottom, foils, 1.06)}" class="rj-strong rj-draw" pathLength="1"/>
                <path d="${cuspedArch(x0 + 5, x1 - 5, sy + 2, apexY + 6, null, foils, 1.06)}" class="rj-hair rj-draw" pathLength="1"/>
                <path d="M${r2(lx - pillar / 2)},${r2(sy)} V${r2(bottom)} M${r2(lx + pillar / 2)},${r2(sy)} V${r2(bottom)} M${r2(rx - pillar / 2)},${r2(sy)} V${r2(bottom)} M${r2(rx + pillar / 2)},${r2(sy)} V${r2(bottom)}" class="rj-hair rj-draw" pathLength="1"/>
                ${capital(lx)}${capital(rx)}
            </g>
            <g class="rj-fill rj-beads">${beadsAlong(ox0 + band / 2, ox1 - band / 2, sy, oApex + band * 0.7, foils * 3, 1.3)}</g>
            <g class="rj-spandrel" transform="translate(${r2(inset + 30)},${r2(o.rosetteY || inset + 84)})">${rosette(15, 12)}</g>
            <g class="rj-spandrel" transform="translate(${r2(w - inset - 30)},${r2(o.rosetteY || inset + 84)})">${rosette(15, 12)}</g>
            <g class="rj-finial" transform="translate(${r2(cx)},${r2(oApex - 8)})">
                <path d="M0,-30 C5,-24 5,-17 0,-12 C-5,-17 -5,-24 0,-30Z M-9,-8 C-6,-14 6,-14 9,-8 C6,-3 -6,-3 -9,-8Z M-4,-12 H4 M0,-3 V4" class="rj-line"/>
                <circle cy="-34" r="2" class="rj-fill"/>
            </g>
        </svg>`;
    }

    /* ---------- Figures ---------- */

    // Caparisoned elephant, trunk raised in welcome, facing right (flip to face left).
    function elephant(cls, flip) {
        const body = 'M41,80 C47,52 76,37 110,36 C135,35 154,41 163,52 C166,40 179,31 193,33 C205,35 211,45 210,57 '
            + 'C211,66 209,74 206,80 C216,82 225,72 227,58 C229,45 224,33 231,25 C234,21 239,22 239,27 C239,31 234,32 235,37 '
            + 'C237,49 235,62 233,72 C230,86 220,95 208,97 C204,101 198,103 192,101 C190,109 186,115 181,118 '
            + 'C182,134 183,150 185,164 C185,168 183,170 180,170 L161,170 C158,170 157,168 157,165 C157,151 156,137 155,125 '
            + 'C137,133 104,134 86,125 C85,139 86,152 87,165 C87,168 85,170 82,170 L63,170 C60,170 59,168 59,165 '
            + 'C58,151 55,134 50,119 C40,108 37,94 41,80Z';
        const jhool = 'M74,46 C92,38 128,36 151,44 L154,105 C148,113 141,105 135,111 C129,105 122,113 115,107 '
            + 'C109,113 101,105 95,111 C89,105 82,113 75,106Z';
        return `<svg class="rj-elephant ${cls || ''}" viewBox="0 0 246 176" aria-hidden="true" focusable="false">
            <g${flip ? ' transform="translate(246,0) scale(-1,1)"' : ''}>
                <g class="rj-el-far">
                    <path d="M143,118 C144,134 144,150 145,165 C145,168 147,170 150,170 L166,170 C168,170 169,168 169,166 L166,118Z"/>
                    <path d="M70,118 C71,134 71,150 72,165 C72,168 74,170 77,170 L92,170 C94,170 95,168 95,166 L92,118Z"/>
                </g>
                <path d="M44,86 C33,92 30,106 33,118" class="rj-el-tail"/>
                <path d="M33,113 C27,119 28,128 34,127 C39,126 39,118 33,113Z" class="rj-el-tuft"/>
                <path d="${body}" class="rj-el-body"/>
                <path d="M171,55 C159,60 155,82 164,95 C171,104 185,100 186,87 C188,71 184,57 171,55Z" class="rj-el-ear"/>
                <path d="M167,64 C163,73 164,84 169,91" class="rj-el-crease"/>
                <path d="M199,99 C205,105 214,106 222,101" class="rj-el-tusk"/>
                <path d="M228,46 C232,47 234,50 234,53 M227,58 C231,59 233,62 232,65 M223,70 C227,72 228,75 226,78" class="rj-el-crease"/>
                <path d="${jhool}" class="rj-el-jhool"/>
                <path d="M79,52 C97,45 127,44 147,51 M78,99 C97,95 129,95 150,99" class="rj-el-trim"/>
                <path d="M113,58 C121,62 124,72 118,80 C113,87 104,85 103,78 C102,72 108,69 112,72" class="rj-el-trim"/>
                <g class="rj-el-dots">
                    <circle cx="90" cy="66" r="2"/><circle cx="138" cy="66" r="2"/><circle cx="90" cy="86" r="2"/><circle cx="138" cy="86" r="2"/>
                    <circle cx="126" cy="88" r="1.5"/><circle cx="100" cy="92" r="1.5"/>
                </g>
                <g class="rj-el-tassels"><path d="M75,106 v8 M95,111 v8 M115,107 v8 M135,111 v8 M154,105 v8"/></g>
                <path d="M188,36 C198,38 205,46 205,58 C205,68 207,76 213,84 C205,86 199,80 196,72 C193,62 191,48 188,36Z" class="rj-el-mukh"/>
                <path d="M193,44 C199,48 201,56 200,64" class="rj-el-trim"/>
                <circle cx="211" cy="86" r="2.6" class="rj-el-gem"/>
                <circle cx="191" cy="58" r="2.3" class="rj-el-eye"/>
                <path d="M162,106 C168,112 176,114 182,112" class="rj-el-trim"/>
                <g class="rj-el-bells"><circle cx="166" cy="112" r="2.4"/><circle cx="174" cy="114.5" r="2.4"/></g>
                <path d="M61,156 H86 M158,156 H184" class="rj-el-anklet"/>
            </g>
        </svg>`;
    }

    function lantern(cls) {
        return `<svg class="rj-lantern ${cls || ''}" viewBox="0 0 44 150" aria-hidden="true" focusable="false">
            <circle cx="22" cy="88" r="30" fill="url(#rj-glow)" class="rj-lantern__glow"/>
            <path d="M22,0 V46" class="rj-line rj-hair"/>
            <g class="rj-fill">${[8, 16, 24, 32, 40].map((y) => `<circle cx="22" cy="${y}" r="1.3"/>`).join('')}</g>
            <path d="M14,52 C14,46 18,43 22,42 C26,43 30,46 30,52Z" class="rj-gold-fill"/>
            <path d="M10,54 H34 L38,78 L33,104 H11 L6,78Z" class="rj-lantern__body"/>
            <path d="M10,54 H34 L38,78 L33,104 H11 L6,78Z M17,54 L15,78 L17,104 M27,54 L29,78 L27,104 M6,78 H38" class="rj-line"/>
            <path d="M11,104 C14,112 30,112 33,104Z" class="rj-gold-fill"/>
            <path d="M22,111 V122" class="rj-line"/>
            <path d="M22,122 C27,129 25,140 22,144 C19,140 17,129 22,122Z" class="rj-gold-fill"/>
        </svg>`;
    }

    function chhatri(cls) {
        return `<svg class="rj-chhatri ${cls || ''}" viewBox="0 0 120 156" aria-hidden="true" focusable="false">
            <g class="rj-line">
                <path d="M60,2 V12 M56,8 H64"/>
                <path d="M38,62 C26,52 30,38 44,30 C52,25 57,21 60,14 C63,21 68,25 76,30 C90,38 94,52 82,62Z" class="rj-gold-wash"/>
                <path d="M38,62 C42,56 48,60 51,55 C54,61 66,61 69,55 C72,60 78,56 82,62 M60,14 V24"/>
                <path d="M36,62 H84 V69 H36Z M16,69 H104 L97,80 H23Z"/>
                <path d="M28,80 V128 M36,80 V128 M84,80 V128 M92,80 V128"/>
                <path d="${cuspedArch(40, 80, 100, 86, 128, 7, 1.05)}"/>
                <path d="M20,128 H100 V135 H20Z M12,135 H108 V144 H12Z"/>
            </g>
            <circle cx="60" cy="24" r="2.5" class="rj-fill"/>
        </svg>`;
    }

    // Gold outline matching #rj-clip-arch exactly (3:4 window, 9 lobes).
    function archWindow(cls) {
        const w = 300;
        const h = 400;
        return `<svg class="rj-window ${cls || ''}" viewBox="-6 -6 312 412" preserveAspectRatio="none" aria-hidden="true" focusable="false">
            <g class="rj-line">
                <path d="${cuspedArch(0, w, w * 0.62, w * 0.04, h, 9, 1.02)}" class="rj-strong"/>
                <path d="${cuspedArch(9, w - 9, w * 0.62 + 4, w * 0.04 + 14, h - 9, 9, 1.02)}" class="rj-hair"/>
            </g>
        </svg>`;
    }

    // Jharokha balcony ledge with corbels, sits under an arch window.
    function ledge(cls) {
        return `<svg class="rj-ledge ${cls || ''}" viewBox="0 0 300 56" preserveAspectRatio="none" aria-hidden="true" focusable="false">
            <path d="M0,0 H300 V9 H0Z" class="rj-gold-fill"/>
            <path d="M8,9 H292 L284,17 H16Z" fill="#a67f2e"/>
            <g class="rj-line">
                <path d="M16,17 H284 M40,17 C40,34 58,38 62,52 M260,17 C260,34 242,38 238,52 M150,17 V40"/>
                <path d="M62,52 C66,46 74,46 74,52 M238,52 C234,46 226,46 226,52"/>
                ${[30, 60, 90, 120, 150, 180, 210, 240, 270].map((x) => `<path d="M${x},17 v5"/>`).join('')}
            </g>
            <circle cx="150" cy="44" r="3.2" class="rj-fill"/>
        </svg>`;
    }

    // Rolled end of the families scroll (farman).
    function scrollRod(cls) {
        return `<svg class="rj-rod ${cls || ''}" viewBox="0 0 360 30" preserveAspectRatio="none" aria-hidden="true" focusable="false">
            <rect x="22" y="7" width="316" height="16" rx="8" fill="url(#rj-gold)"/>
            <rect x="22" y="12" width="316" height="3" fill="#fff4d0" fill-opacity=".45"/>
            <path d="M22,7 C14,7 12,11 6,11 C2,11 2,19 6,19 C12,19 14,23 22,23Z M338,7 C346,7 348,11 354,11 C358,11 358,19 354,19 C348,19 346,23 338,23Z" fill="#a67f2e"/>
            <circle cx="4" cy="15" r="3.5" fill="#e3c47a"/><circle cx="356" cy="15" r="3.5" fill="#e3c47a"/>
        </svg>`;
    }

    // Small oil lamp for the event timeline nodes.
    function diya(cls) {
        return `<svg class="rj-diya ${cls || ''}" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
            <circle cx="24" cy="20" r="17" fill="url(#rj-glow)" class="rj-diya__glow"/>
            <path d="M24,27 C20,23 20,17 24,9 C28,17 28,23 24,27Z" fill="url(#rj-flame)" class="rj-diya__flame"/>
            <path d="M6,29 C8,37 15,41 24,41 C33,41 40,37 42,29 C34,32 14,32 6,29Z" class="rj-gold-fill"/>
            <path d="M6,29 C14,32 34,32 42,29" class="rj-line"/>
        </svg>`;
    }

    // Closing artwork: palace gateway, facing elephants, bell toran, fireworks.
    function gateway(cls) {
        const bells = Array.from({ length: 11 }, (_, i) => {
            const x = 70 + i * 16;
            const y = 52 + Math.sin((i / 10) * Math.PI) * 12;
            return `<path d="M${x},${r2(y - 10)} V${r2(y)}" class="rj-hair"/><path d="M${x - 3.2},${r2(y + 5)} C${x - 3.2},${r2(y)} ${x + 3.2},${r2(y)} ${x + 3.2},${r2(y + 5)}Z" class="rj-gold-fill"/>`;
        }).join('');
        const burst = (x, y, r, n, c) => `<g class="rj-burst ${c}" transform="translate(${x},${y})">${Array.from({ length: n }, (_, i) => {
            const a = (i / n) * Math.PI * 2;
            return `<path d="M${r2(Math.cos(a) * r * 0.35)},${r2(Math.sin(a) * r * 0.35)} L${r2(Math.cos(a) * r)},${r2(Math.sin(a) * r)}"/>`;
        }).join('')}<circle r="1.6"/></g>`;
        return `<svg class="rj-gateway ${cls || ''}" viewBox="0 0 320 250" aria-hidden="true" focusable="false">
            <g class="rj-fireworks">${burst(58, 40, 22, 14, 'rj-burst--a')}${burst(262, 30, 26, 16, 'rj-burst--b')}${burst(160, 10, 16, 12, 'rj-burst--c')}${burst(220, 70, 12, 10, 'rj-burst--d')}${burst(96, 76, 11, 10, 'rj-burst--e')}</g>
            <g class="rj-line">
                <path d="M60,250 V96 H260 V250"/>
                <path d="M66,250 V102 H254 V250" class="rj-hair"/>
                <path d="${pointedArch(92, 228, 160, 96, 250)}"/>
                <path d="${cuspedArch(102, 218, 164, 112, 250, 9, 1.05)}" class="rj-strong"/>
                <path d="M54,96 H266 M58,90 H262" class="rj-hair"/>
                <path d="M160,88 V64 M154,70 H166"/>
                ${bells}
            </g>
            <g transform="translate(78,102)">${rosette(10, 10)}</g>
            <g transform="translate(242,102)">${rosette(10, 10)}</g>
        </svg>`;
    }

    // Palace postcard for the venue card (before the real map is loaded).
    function palace(cls) {
        const stars = [[30, 26], [64, 14], [210, 20], [250, 40], [118, 30], [178, 12], [290, 18], [14, 56]]
            .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.2"/>`).join('');
        return `<svg class="rj-palace ${cls || ''}" viewBox="0 0 300 190" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">
            <g class="rj-fill rj-stars">${stars}</g>
            <path d="M246,26 a16,16 0 1,0 12,28 a20,20 0 0,1 -12,-28Z" class="rj-gold-fill rj-moon"/>
            <g class="rj-line">
                <path d="M150,22 V34 M146,28 H154"/>
                <path d="M124,86 C108,74 114,58 132,50 C142,46 147,42 150,34 C153,42 158,46 168,50 C186,58 192,74 176,86Z" class="rj-gold-wash"/>
                <path d="M100,86 H200 V172 H100Z"/>
                <path d="${cuspedArch(132, 168, 126, 104, 172, 7, 1.05)}"/>
                <path d="${cuspedArch(108, 126, 136, 124, 172, 5, 1.05)} ${cuspedArch(174, 192, 136, 124, 172, 5, 1.05)}"/>
                <path d="M96,86 H204 M96,92 H204"/>
                <path d="M66,104 C55,96 60,86 70,82 C75,80 77,78 78,73 C79,78 81,80 86,82 C96,86 101,96 90,104Z M210,104 C199,96 204,86 214,82 C219,80 221,78 222,73 C223,78 225,80 230,82 C240,86 245,96 234,104Z" class="rj-gold-wash"/>
                <path d="M58,104 H98 V172 H58Z M202,104 H242 V172 H202Z"/>
                <path d="${cuspedArch(68, 88, 140, 126, 172, 5, 1.05)} ${cuspedArch(212, 232, 140, 126, 172, 5, 1.05)}"/>
                <path d="M30,172 V82 M42,172 V82 M258,172 V82 M270,172 V82 M28,82 C28,70 44,70 44,82Z M256,82 C256,70 272,70 272,82Z"/>
                <path d="M6,172 H294 M20,180 H280"/>
            </g>
            <g class="rj-fill"><circle cx="150" cy="19" r="2.4"/><circle cx="78" cy="70" r="1.8"/><circle cx="222" cy="70" r="1.8"/><circle cx="36" cy="66" r="1.6"/><circle cx="264" cy="66" r="1.6"/></g>
        </svg>`;
    }

    // Dark-to-light section edge: a colonnade of cusped arches.
    function arcadeDataUri(fill, stroke) {
        const f = fill.replace('#', '%23');
        const s = stroke.replace('#', '%23');
        const opening = cuspedArch(9, 55, 25, 9, 46, 7, 1.05);
        const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='46' viewBox='0 0 64 46'><path fill-rule='evenodd' fill='${f}' d='M0 0H64V46H0Z ${opening}'/><path fill='none' stroke='${s}' stroke-width='1' d='${opening.replace(/ L55,46 Z$/, '').replace(/^M9,46 L/, 'M')}'/><path fill='none' stroke='${s}' stroke-width='.8' d='M0 2.5H64'/><circle cx='32' cy='5' r='1.3' fill='${s}'/></svg>`;
        return `url("data:image/svg+xml,${svg.replace(/</g, '%3C').replace(/>/g, '%3E')}")`;
    }

    // Light-to-dark section edge: a scalloped ivory border with gold bells.
    function scallopDataUri(fill, stroke) {
        const f = fill.replace('#', '%23');
        const s = stroke.replace('#', '%23');
        const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='22' viewBox='0 0 40 22'><path fill='${f}' d='M0 0H40V8 C40 16 32 16 30 8 C28 18 12 18 10 8 C8 16 0 16 0 8Z'/><path fill='none' stroke='${s}' stroke-width='1' d='M0 8 C0 16 8 16 10 8 C12 18 28 18 30 8 C32 16 40 16 40 8'/><circle cx='20' cy='17.6' r='1.6' fill='${s}'/></svg>`;
        return `url("data:image/svg+xml,${svg.replace(/</g, '%3C').replace(/>/g, '%3E')}")`;
    }

    /* ---------- Wax seal ---------- */

    function sealPath(cx, cy, r) {
        const pts = [];
        const n = 64;
        for (let i = 0; i < n; i++) {
            const t = (i / n) * Math.PI * 2;
            const rr = r + 2.2 * Math.sin(6 * t + 0.4) + 1.5 * Math.sin(11 * t + 1.3) + 1.1 * Math.sin(17 * t);
            pts.push([cx + rr * Math.cos(t), cy + rr * Math.sin(t)]);
        }
        let d = '';
        for (let i = 0; i < n; i++) {
            const [x, y] = pts[i];
            const [nx, ny] = pts[(i + 1) % n];
            const mx = (x + nx) / 2;
            const my = (y + ny) / 2;
            d += i === 0 ? `M${r2((pts[n - 1][0] + x) / 2)},${r2((pts[n - 1][1] + y) / 2)} Q${r2(x)},${r2(y)} ${r2(mx)},${r2(my)}` : ` Q${r2(x)},${r2(y)} ${r2(mx)},${r2(my)}`;
        }
        return d + 'Z';
    }

    let sealSeq = 0;
    function seal(monogram, script) {
        const esc = WL.util.esc;
        const uid = `rj-seal-${++sealSeq}`;
        const dots = Array.from({ length: 28 }, (_, i) => {
            const t = (i / 28) * Math.PI * 2;
            return `<circle cx="${r2(70 + 49 * Math.cos(t))}" cy="${r2(70 + 49 * Math.sin(t))}" r="1.25"/>`;
        }).join('');
        const body = `
            <path d="${sealPath(70, 70, 60)}" fill="url(#rj-wax)"/>
            <path d="${sealPath(70, 70, 60)}" fill="none" stroke="#3d0610" stroke-opacity=".35" stroke-width="1.5"/>
            <circle cx="70" cy="70" r="43" fill="url(#rj-wax-inner)"/>
            <circle cx="70" cy="70" r="43.5" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="1.2" transform="translate(-.8,-.8)"/>
            <circle cx="70" cy="70" r="43" fill="none" stroke="#2a0409" stroke-opacity=".45" stroke-width="1.2" transform="translate(.8,.8)"/>
            <g fill="#e8c77a" fill-opacity=".8">${dots}</g>
            <text x="70" y="70" dy="${script === 'deva' ? '0.32em' : '0.36em'}" text-anchor="middle" class="rj-seal__mono rj-seal__mono--${script}" fill="#3a050e" fill-opacity=".55" transform="translate(1.2,1.4)">${esc(monogram)}</text>
            <text x="70" y="70" dy="${script === 'deva' ? '0.32em' : '0.36em'}" text-anchor="middle" class="rj-seal__mono rj-seal__mono--${script}" fill="url(#rj-gold)">${esc(monogram)}</text>`;
        return `<svg class="rj-seal" viewBox="-8 -8 156 156" aria-hidden="true" focusable="false">
            <defs>
                <g id="${uid}-body">${body}</g>
                <clipPath id="${uid}-l"><path d="M-10,-10 H72 L66,28 L75,52 L64,80 L73,106 L67,150 H-10Z"/></clipPath>
                <clipPath id="${uid}-r"><path d="M72,-10 H150 V150 H67 L73,106 L64,80 L75,52 L66,28Z"/></clipPath>
            </defs>
            <ellipse cx="72" cy="76" rx="58" ry="56" fill="#1d0207" opacity=".35" class="rj-seal__shadow"/>
            <g class="rj-seal__half rj-seal__half--l" clip-path="url(#${uid}-l)"><use href="#${uid}-body"/></g>
            <g class="rj-seal__half rj-seal__half--r" clip-path="url(#${uid}-r)"><use href="#${uid}-body"/></g>
        </svg>`;
    }

    /* ---------- Ceremony + guest-info icons (48 x 48 line art) ---------- */

    const ICON_PATHS = {
        mandap: '<path d="M8,42 H40 M10,42 V20 M38,42 V20 M16,42 V22 M32,42 V22"/><path d="M6,20 H42 M8,20 C10,12 18,8 24,6 C30,8 38,12 40,20"/><path d="M24,6 V2"/><path d="M10,24 C14,28 18,28 22,24 M26,24 C30,28 34,28 38,24"/><path d="M24,40 C21,37 21,33 24,30 C27,33 27,37 24,40Z"/>',
        haldi: '<path d="M8,26 H40 C40,36 33,42 24,42 C15,42 8,36 8,26Z"/><path d="M14,26 C15,21 20,18 24,18 C28,18 33,21 34,26"/><path d="M24,18 C22,12 24,7 30,5 C30,11 28,15 24,18Z M24,18 C21,13 16,12 12,14 C15,18 20,19 24,18Z"/><path d="M18,32 H30"/>',
        mehendi: '<path d="M17,42 V24 C17,20 14,18 12,20 V12 C12,9 16,9 16,12 V22 M16,12 V7 C16,4 20,4 20,7 V21 M20,7 V5 C20,2 24,2 24,5 V21 M24,8 C24,5 28,5 28,8 V22 M28,14 C28,11 32,11 32,14 V30 C32,37 28,42 22,42"/><circle cx="23" cy="32" r="3.2"/><path d="M23,25 V27 M23,37 V39 M16,32 H18 M28,32 H30"/>',
        sangeet: '<ellipse cx="10" cy="26" rx="4" ry="11"/><ellipse cx="36" cy="26" rx="4" ry="11"/><path d="M10,15 C17,12 29,12 36,15 M10,37 C17,40 29,40 36,37"/><path d="M14,14 L19,38 L24,13 L29,38 L33,14"/><path d="M41,4 V13"/><ellipse cx="38.6" cy="13.4" rx="2.6" ry="2"/><path d="M41,4 C43,5 45,6 45,9"/>',
        chandelier: '<path d="M24,2 V9 M19,9 H29"/><path d="M24,9 V34"/><path d="M7,17 C9,25 17,27 24,27 C31,27 39,25 41,17"/><path d="M13,26 C15,31 20,33 24,33 C28,33 33,31 35,26"/><path d="M7,17 V13 M41,17 V13 M13,26 V22 M35,26 V22"/><path d="M7,13 C5.5,11 6,9 7,8 C8,9 8.5,11 7,13Z M41,13 C39.5,11 40,9 41,8 C42,9 42.5,11 41,13Z M13,22 C11.5,20 12,18 13,17 C14,18 14.5,20 13,22Z M35,22 C33.5,20 34,18 35,17 C36,18 36.5,20 35,22Z"/><path d="M24,34 L21,40 L24,46 L27,40Z"/>',
        rings: '<circle cx="18" cy="28" r="11"/><circle cx="30" cy="28" r="11"/><path d="M14,10 L18,6 L22,10 L18,14Z"/>',
        kalash: '<path d="M14,22 H34 M16,22 C10,26 10,38 16,42 H32 C38,38 38,26 32,22"/><path d="M18,22 C18,18 30,18 30,22"/><path d="M24,18 C24,12 22,8 24,4 C26,8 24,12 24,18"/><path d="M24,18 C18,16 14,12 12,8 C18,8 22,12 24,18Z M24,18 C30,16 34,12 36,8 C30,8 26,12 24,18Z"/><path d="M16,30 H32 M17,35 H31"/>',
        baraat: '<path d="M24,46 V14"/><path d="M6,16 C8,8 16,4 24,4 C32,4 40,8 42,16 C38,14 34,14 30,16 C28,14 20,14 18,16 C14,14 10,14 6,16Z"/><path d="M10,16 C9,20 9,22 10,24 M24,16 V22 M38,16 C39,20 39,22 38,24"/>',
        crescent: '<path d="M30,6 C20,8 14,16 14,24 C14,34 22,42 32,42 C24,46 8,40 8,24 C8,10 20,4 30,6Z"/><path d="M34,14 L36,19 L41,19 L37,22 L39,27 L34,24 L29,27 L31,22 L27,19 L32,19Z"/>',
        feast: '<ellipse cx="24" cy="32" rx="19" ry="7"/><path d="M8,30 C8,20 15,14 24,14 C33,14 40,20 40,30"/><path d="M24,14 V10 M21,10 H27"/>',
        dome: '<path d="M24,4 V10"/><path d="M12,30 C10,20 16,12 24,10 C32,12 38,20 36,30Z"/><path d="M10,30 H38 V36 H10Z M8,42 H40 M14,36 V42 M34,36 V42 M22,36 V42 M26,36 V42"/>',
        chapel: '<path d="M24,2 V12 M20,6 H28"/><path d="M12,24 L24,12 L36,24"/><path d="M14,22 V44 H34 V22"/><path d="M20,44 V34 C20,31 28,31 28,34 V44"/><circle cx="24" cy="26" r="3"/>',
        sparkle: '<path d="M24,4 C25,16 32,23 44,24 C32,25 25,32 24,44 C23,32 16,25 4,24 C16,23 23,16 24,4Z"/><path d="M38,6 C38,10 40,12 44,12 C40,12 38,14 38,18 C38,14 36,12 32,12 C36,12 38,10 38,6Z"/>',
        default: '<path d="M8,34 C8,40 16,44 24,44 C32,44 40,40 40,34Z"/><path d="M6,34 H42"/><path d="M24,30 C19,25 20,18 24,10 C28,18 29,25 24,30Z"/><path d="M24,30 C22,27 22,24 24,20 C26,24 26,27 24,30Z"/>',
        dress: '<path d="M18,4 H30 L28,12 C34,16 36,26 38,44 H10 C12,26 14,16 20,12Z"/><path d="M20,12 H28 M16,30 C22,32 26,32 32,30 M14,38 C21,40 27,40 34,38"/>',
        parking: '<rect x="6" y="6" width="36" height="36" rx="8"/><path d="M19,34 V14 H26 C30,14 33,17 33,21 C33,25 30,28 26,28 H19"/>',
        stay: '<path d="M6,42 V20 L24,8 L42,20 V42"/><path d="M6,42 H42"/><path d="${STAY_ARCH}"/>',
        gift: '<rect x="8" y="18" width="32" height="24" rx="2"/><path d="M6,12 H42 V18 H6Z M24,12 V42"/><path d="M24,12 C20,4 12,6 14,10 C15,12 20,12 24,12Z M24,12 C28,4 36,6 34,10 C33,12 28,12 24,12Z"/>',
        weather: '<circle cx="24" cy="24" r="8"/><path d="M24,4 V9 M24,39 V44 M4,24 H9 M39,24 H44 M10,10 L13.5,13.5 M34.5,34.5 L38,38 M10,38 L13.5,34.5 M34.5,13.5 L38,10"/>',
        food: '<circle cx="24" cy="26" r="16"/><circle cx="24" cy="26" r="10"/><path d="M6,8 V18 C6,20 8,22 10,22 V44 M10,8 V18"/><path d="M42,8 C38,10 38,18 42,22 V44"/>',
        kids: '<path d="M24,4 C31,4 34,10 34,16 C34,23 28,28 24,29 C20,28 14,23 14,16 C14,10 17,4 24,4Z"/><path d="M24,29 L22,32 H26Z M24,32 C24,36 28,38 26,44"/>',
        phone: '<path d="M14,6 L20,6 L24,16 L19,19 C21,24 24,27 29,29 L32,24 L42,28 V34 C42,38 38,42 34,42 C18,42 6,30 6,14 C6,10 10,6 14,6Z"/>',
        info: '<circle cx="24" cy="24" r="19"/><path d="M24,21 V34 M24,14 V15"/>',
        camera: '<path d="M6,16 H14 L18,10 H30 L34,16 H42 V40 H6Z"/><circle cx="24" cy="27" r="8"/>',
        heart: '<path d="M24,42 C10,32 4,24 4,16 C4,9 9,5 15,5 C19,5 22,8 24,11 C26,8 29,5 33,5 C39,5 44,9 44,16 C44,24 38,32 24,42Z"/>',
        pin: '<path d="M24,44 C24,44 38,30 38,19 C38,11 32,5 24,5 C16,5 10,11 10,19 C10,30 24,44 24,44Z"/><circle cx="24" cy="19" r="5"/>',
        calendar: '<rect x="6" y="9" width="36" height="33" rx="3"/><path d="M6,18 H42 M15,4 V12 M33,4 V12"/><path d="M14,26 H18 M22,26 H26 M30,26 H34 M14,33 H18 M22,33 H26"/>',
        clock: '<circle cx="24" cy="24" r="18"/><path d="M24,13 V24 L31,29"/>',
        copy: '<rect x="14" y="14" width="26" height="28" rx="3"/><path d="M8,34 V9 C8,7 9,6 11,6 H32"/>',
        whatsapp: '<path d="M8,40 L10,32 C6,25 8,15 15,10 C23,4 35,6 40,14 C45,22 42,33 34,38 C28,42 20,42 14,38Z"/><path d="M18,17 C17,19 17,22 19,25 C21,29 25,32 29,33 C31,33 33,32 33,30 L30,27 L27,29 C24,28 21,25 20,22 L22,19 L20,16 C19,16 18,16 18,17Z"/>',
        close: '<path d="M12,12 L36,36 M36,12 L12,36"/>',
        prev: '<path d="M30,10 L16,24 L30,38"/>',
        next: '<path d="M18,10 L32,24 L18,38"/>',
        check: '<path d="M10,25 L20,35 L38,13"/>',
        music: '<path d="M18,36 V10 L38,6 V32"/><circle cx="13" cy="36" r="5"/><circle cx="33" cy="32" r="5"/>',
    };
    ICON_PATHS.stay = ICON_PATHS.stay.replace('${STAY_ARCH}', cuspedArch(16, 32, 30, 22, 42, 5, 1.05));

    const icons = {};
    Object.keys(ICON_PATHS).forEach((key) => {
        icons[key] = `<svg class="rj-icon rj-icon--${key}" viewBox="0 0 48 48" aria-hidden="true" focusable="false"><g class="rj-icon__g">${ICON_PATHS[key]}</g></svg>`;
    });

    WL.art = WL.art || {};
    WL.art.rajwada = {
        archCurve, cuspedArch, pointedArch, beadsAlong, archClipPath,
        defs, rosette, divider, corner, jaaliDataUri,
        heroFrame, elephant, lantern, chhatri, palace,
        archWindow, ledge, scrollRod, diya, gateway,
        arcadeDataUri, scallopDataUri, seal, icons,
    };
})(window);
