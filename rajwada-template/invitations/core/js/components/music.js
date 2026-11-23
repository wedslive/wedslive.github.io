/*
 * weds.live invitation engine · components/music.js
 *
 * Background music that only ever starts from a tap on [data-wl-music]
 * (no autoplay). Supports an audio file (music.src = ".../song.mp3") or the
 * built-in "synth:tanpura" drone, rendered with Web Audio so a demo ships
 * zero audio bytes. Fades in and out, pauses while the tab is hidden and
 * resumes when the guest comes back, and shows lock-screen controls.
 */
(function (root) {
    'use strict';

    const WL = root.WL;
    const U = WL.util;

    /* ---------- Tanpura drone (additive synthesis, pre-rendered once) ---------- */

    const SYNTH_RATE = 22050;
    const SA = 146.83; // D3; strings: Pa below, Sa, Sa, low Sa (kharaj)
    const STRING_FREQS = [SA * 0.75, SA, SA, SA / 2];
    const pluckCache = new Map();

    // Pure number crunching, no AudioContext needed, so it can run in idle
    // time before the guest presses play (keeps the tap itself instant).
    function renderPluck(freq, seconds) {
        if (pluckCache.has(freq)) return pluckCache.get(freq);
        const sr = SYNTH_RATE;
        const n = Math.floor(seconds * sr);
        const out = new Float32Array(n);
        for (let k = 1; k <= 12; k++) {
            const f = freq * k * (1 + (k % 2 ? 0.0006 : -0.0004));
            if (f > sr / 2.4) break;
            const w = 2 * Math.PI * f / sr;
            const cosW = 2 * Math.cos(w);
            // Jawari: upper partials bloom late and fade early, the tanpura's shimmer.
            const weight = (k === 1 ? 0.8 : 0.9 / Math.pow(k, 0.75)) * (1 + 0.9 * Math.exp(-Math.pow((k - 8) / 3, 2)));
            const attack = Math.exp(-1 / ((0.006 + 0.045 * (k - 1)) * sr));
            const decay = Math.exp(-1 / ((3.2 / (1 + 0.14 * (k - 1))) * sr));
            let s1 = 0;
            let s2 = -Math.sin(w);
            let a = 1;
            let d = 1;
            for (let i = 0; i < n; i++) {
                const s0 = cosW * s1 - s2;
                s2 = s1;
                s1 = s0;
                a *= attack;
                d *= decay;
                out[i] += weight * (1 - a) * d * s0;
            }
        }
        let peak = 0;
        for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(out[i]));
        const fadeStart = n - Math.floor(0.4 * sr);
        for (let i = 0; i < n; i++) {
            out[i] = (out[i] / (peak || 1)) * 0.7 * (i > fadeStart ? (n - i) / (n - fadeStart) : 1);
        }
        pluckCache.set(freq, out);
        return out;
    }

    function prepareTanpura() {
        const todo = STRING_FREQS.filter((f, i) => STRING_FREQS.indexOf(f) === i && !pluckCache.has(f));
        const step = () => {
            const f = todo.shift();
            if (f == null) return;
            renderPluck(f, 4.2);
            (root.requestIdleCallback || ((fn) => setTimeout(fn, 30)))(step);
        };
        step();
    }

    // ConvolverNode needs the impulse at the context's own sample rate.
    function reverbImpulse(ac, seconds) {
        const sr = ac.sampleRate;
        const n = Math.floor(seconds * sr);
        const ir = ac.createBuffer(2, n, sr);
        for (let ch = 0; ch < 2; ch++) {
            const data = ir.getChannelData(ch);
            for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.6);
        }
        return ir;
    }

    function createTanpura() {
        const AC = root.AudioContext || root.webkitAudioContext;
        if (!AC) return null;
        const ac = new AC();
        const master = ac.createGain();
        master.gain.value = 0;
        const dry = ac.createGain();
        dry.gain.value = 0.75;
        const wet = ac.createGain();
        wet.gain.value = 0.5;
        const verb = ac.createConvolver();
        verb.buffer = reverbImpulse(ac, 2.8);
        dry.connect(master);
        verb.connect(wet);
        wet.connect(master);
        master.connect(ac.destination);

        let strings = null;
        const buildStrings = () => {
            strings = STRING_FREQS.map((f) => {
                const data = renderPluck(f, 4.2);
                const buffer = ac.createBuffer(1, data.length, SYNTH_RATE);
                buffer.getChannelData(0).set(data);
                return buffer;
            });
        };
        const gap = 0.92;
        let next = 0;
        let step = 0;
        let timer = null;

        function schedule() {
            while (next < ac.currentTime + 0.8) {
                const src = ac.createBufferSource();
                src.buffer = strings[step % 4];
                const g = ac.createGain();
                g.gain.value = 0.82 + Math.random() * 0.18;
                src.connect(g);
                g.connect(dry);
                g.connect(verb);
                src.start(next);
                next += gap * (step % 4 === 3 ? 1.55 : 1) + (Math.random() - 0.5) * 0.04;
                step += 1;
            }
        }

        function ramp(value, seconds) {
            const t = ac.currentTime;
            master.gain.cancelScheduledValues(t);
            master.gain.setValueAtTime(master.gain.value, t);
            master.gain.linearRampToValueAtTime(value, t + seconds);
        }

        return {
            async play() {
                // resume() is called synchronously inside the tap, which unlocks audio on iOS.
                const resumed = ac.resume();
                if (!strings) {
                    await new Promise((r) => setTimeout(r, 0));
                    buildStrings();
                }
                await resumed;
                if (!timer) {
                    next = Math.max(next, ac.currentTime + 0.05);
                    schedule();
                    timer = setInterval(schedule, 250);
                }
                ramp(0.55, 1.8);
            },
            pause() {
                ramp(0, 0.5);
                clearInterval(timer);
                timer = null;
                setTimeout(() => { if (!timer) ac.suspend(); }, 600);
            },
        };
    }

    /* ---------- Audio file ---------- */

    function createFilePlayer(src, onWaiting) {
        const audio = new Audio();
        audio.preload = 'none';
        audio.loop = true;
        audio.src = src;
        audio.addEventListener('waiting', () => onWaiting(true));
        audio.addEventListener('playing', () => onWaiting(false));
        let fade = null;
        function fadeTo(target, ms, done) {
            clearInterval(fade);
            const steps = Math.max(1, Math.round(ms / 40));
            const from = audio.volume;
            let i = 0;
            fade = setInterval(() => {
                i += 1;
                audio.volume = Math.max(0, Math.min(1, from + (target - from) * (i / steps)));
                if (i >= steps) { clearInterval(fade); if (done) done(); }
            }, 40);
        }
        return {
            audio,
            async play() {
                audio.volume = 0;
                await audio.play();
                fadeTo(0.85, 1200);
            },
            pause() {
                fadeTo(0, 450, () => audio.pause());
            },
        };
    }

    /* ---------- Controller ---------- */

    let player = null;
    let playing = false;
    let resumeOnShow = false;
    let unavailable = false;
    let buttons = [];
    let model = null;
    let i18n = null;

    function sync() {
        buttons.forEach((b) => {
            b.setAttribute('aria-pressed', String(playing));
            b.setAttribute('aria-label', b.getAttribute(playing ? 'data-label-pause' : 'data-label-play'));
            b.classList.toggle('is-playing', playing);
            if (unavailable) b.hidden = true;
        });
    }

    function setLoading(on) { buttons.forEach((b) => b.classList.toggle('is-loading', on)); }

    function mediaSession() {
        if (!('mediaSession' in navigator) || !root.MediaMetadata || !model) return;
        try {
            navigator.mediaSession.metadata = new root.MediaMetadata({
                title: (model.music.title && i18n && i18n.text(model.music.title)) || document.title,
                artist: (model.music.artist && i18n && i18n.text(model.music.artist)) || 'weds.live',
            });
            navigator.mediaSession.setActionHandler('play', () => play());
            navigator.mediaSession.setActionHandler('pause', () => pause());
        } catch (e) { /* optional API */ }
    }

    async function play() {
        if (unavailable || !model || !model.music) return;
        if (!player) {
            try {
                player = model.music.src === 'synth:tanpura' ? createTanpura() : createFilePlayer(model.music.src, setLoading);
            } catch (e) {
                player = null;
            }
            if (!player) { unavailable = true; sync(); return; }
            if (player.audio) {
                player.audio.addEventListener('error', () => { unavailable = true; playing = false; sync(); });
            }
            mediaSession();
        }
        playing = true;
        sync();
        try {
            await player.play();
        } catch (e) {
            playing = false;
            if (!e || e.name !== 'NotAllowedError') unavailable = true;
            sync();
        }
    }

    function pause() {
        if (player && playing) player.pause();
        playing = false;
        sync();
    }

    function toggle() { if (playing) pause(); else play(); }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden && playing) { resumeOnShow = true; pause(); }
        else if (!document.hidden && resumeOnShow) { resumeOnShow = false; play(); }
    });

    // Binds every [data-wl-music] button in scope; safe to call again after a re-render.
    function bind(scope, ctx) {
        model = ctx.model;
        i18n = ctx.i18n;
        buttons = U.$$('[data-wl-music]', scope);
        buttons.forEach((b) => b.addEventListener('click', toggle));
        sync();
    }

    // Warm up before a likely play (e.g. the guest chose "open with music").
    function prepare() {
        if (model && model.music && model.music.src === 'synth:tanpura') prepareTanpura();
    }

    WL.music = { bind, play, pause, toggle, prepare, get playing() { return playing; } };
})(window);
