# Template 2 — "Modern Minimal" (Enhanced)

Light, elegant, editorial-style wedding invitation template with **loading → welcome → celebration** flow.

## Experience Flow (like Template 1)
1. **Loading Page** — Progress bar loads all images first
2. **Welcome Page** — Full-screen photo, couple names, "Open Invitation" button
3. **Celebration** — Click "Open" → confetti hearts + music starts + countdown begins
4. **Main Content** — Smooth scroll-reveal animations (AOS-style)

## Design Direction
- **Palette**: Warm ivory/cream base + champagne gold accent (`#a67c4a`)
- **Typography**: Cormorant Garamond (headings) + DM Sans (body)
- **Vibe**: Airy, spacious, premium — high-end wedding magazine feel

## Sections
1. **Hero** — Full-screen background, couple names, live countdown, scroll indicator
2. **Our Story** — Split layout: photo + narrative with pull quote
3. **Events** — Timeline cards (Mehndi, Haldi, Wedding), featured styling for main day
4. **Gallery** — Masonry grid, lazy-loaded, lightbox viewer
5. **RSVP** — Accessible form with conditional guest count, POST to API
6. **Footer** — Names, date, WhatsApp/email links, weds.live credit

## Features
- ✅ Loading screen with progress bar (6s failsafe timeout)
- ✅ Welcome page with guest personalization (`?to=Name`, injected via `textContent` — XSS-safe)
- ✅ Celebration animation (heart confetti, skipped under `prefers-reduced-motion`)
- ✅ Background music with toggle button (source configurable via `data-music-src`)
- ✅ Live countdown timer (date configurable via `data-wedding-date`; shows a past-date message)
- ✅ Scroll-reveal animations (IntersectionObserver, honours `data-aos-delay`)
- ✅ Lazy-loaded gallery with lightbox and focus trap
- ✅ Accessible RSVP form with inline validation
- ✅ Mobile-first responsive
- ✅ Works without JavaScript (`<noscript>` reveals main content)
- ✅ Scroll locked while overlays are open, keyboard navigation, ARIA labels

## Configuration

All couple-specific data lives in markup so a builder can template it:

| What | Where |
|------|-------|
| Wedding datetime | `.hero-countdown[data-wedding-date]` (ISO 8601) |
| Music file | `#music-toggle[data-music-src]` |
| RSVP endpoint | `#rsvp-form[data-endpoint]` |
| Gallery images | `galleryImages[]` in `js/template2.js` |
| Colours / fonts | CSS custom properties in `:root` |

## Placeholder Assets
- `assets/images/hero-bg.jpg`, `welcome-bg.jpg`, `story-photo.jpg` — reused from template1
- `assets/gallery/1-8.jpg` — reused from template1 (1/7 and 2/8 are duplicates)
- `assets/music/sound.wav` — 12s royalty-free ambient pad generated in-repo
  (22050 Hz mono, seamless loop). Swap for an MP3 by changing `data-music-src`.

> Performance note: `welcome-bg.jpg` and `gallery/4.jpg` are ~2.8 MB each.
> Compress or re-encode before shipping real invitations.

## Deployment
Static files — works on GitHub Pages, Netlify, Vercel, any static host.
Bump the `?v=` query on `template2.css` / `template2.js` when you update them.