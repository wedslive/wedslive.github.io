# weds.live

A landing page for **digital wedding & engagement invitations** for Indian couples. Live at [weds.live](https://weds.live).

Built with plain HTML, CSS and a small amount of JavaScript. No frameworks, no build step. Push to `main` and GitHub Pages deploys it.

## Project files

```
wedslive.github.io/
├── index.html          ← all the markup
├── styles.css          ← all the styling (single file by design)
├── script.js           ← navbar, theme toggle, countdown, template filter
├── lotus-logo.svg      ← logo / favicon
├── CNAME               ← custom domain config for GitHub Pages
└── README.md           ← this file
```

## Working on it locally

There's no build step, so the simplest workflow is:

1. Open `index.html` in a browser.
2. Edit `index.html` / `styles.css` / `script.js`.
3. Hard refresh the browser (Ctrl + F5) to bust the cache.

If you ship a CSS or JS change, **bump the cache-buster** at the top of `index.html`:

```html
<link rel="stylesheet" href="styles.css?v=34">
<script src="script.js?v=3" defer></script>
```

Without that bump, returning visitors will see the old file from their browser cache.

## Page sections (top to bottom)

1. **Hero** — headline, phone mockup, primary CTAs
2. **Templates** — 6-card gallery with All / Wedding / Engagement filters
3. **How It Works** — four icon steps (Pick → Make → Get → Share)
4. **Features** — 9-tile grid of product capabilities
5. **Reviews** — 6 testimonial cards + trust bar
6. **Pricing** — Free / ₹499 Wedding / ₹999 Royal
7. **CTA** — closing call to action
8. **Footer** — navigation, social, legal

The order leads with the **product** (templates) before explaining the process, because most first-time visitors are visual buyers.

---

## Roadmap — make the homepage pass the 5-second test

Right now a visitor mostly understands the site within ~5 seconds, but a few small changes would push that closer to "instant". These are listed in the order I'd ship them — biggest impact first.

> **Why this matters**: a wedding invitation site competes with paper cards, WhatsApp, and a dozen other invite apps. If a visitor can't tell *what* this is and *what it costs* in five seconds, they bounce.

### 1. Make "Digital Wedding Invitation" the dominant phrase in the hero

Right now the eye lands on "Your Love Story" first, which sounds more like a journaling app or memoir blog than an invitation product. The actual product noun ("Digital Wedding Invitation") is buried in the second line at a smaller size.

**What to change**: swap the visual hierarchy in the hero headline. The romantic script becomes the smaller supporting line; the product description becomes the big bold one.

**Why**: people decide what a page is about by reading the largest text first. Make sure that text actually names the product.

### 2. Add a one-line micro-tagline above the headline

A small line directly above the main headline that answers the three questions every visitor asks at once:

- *What is it?* → "Online wedding invites"
- *What's special?* → "with RSVP, photos & countdown"
- *What's the cost?* → "free to start"

**Why**: this is the highest-leverage single change on the whole page. One line, three questions answered, before they even read the headline.

### 3. Differentiate the two hero CTAs

"Create Free Invitation" and "Browse Templates" currently look like sibling buttons of equal weight. They're not equal — one is the conversion, one is exploration.

**What to change**: keep "Create Free Invitation" as the bright pink primary button. Make "Browse Templates" smaller, ghost-style or a text link.

**Why**: when two CTAs compete, neither wins. The page needs to point at *one* thing.

### 4. Show the product working, not just the cover

The phone mockup currently shows the cover screen with a countdown. That could read as "this is a countdown app" before a viewer realises the rest of the experience exists (gallery, RSVP, venue map, wishes wall).

**Two cheap options:**

- **Cycle the phone screen** every 3-4 seconds through 2-3 sample views (cover → gallery → RSVP).
- **Show two phones side-by-side**, each with a different state.

**Why**: a digital invitation is more than a card — it's a mini-website. Visitors only believe that when they see it.

### 5. Add a small "Free to start" tag near the primary CTA

A tiny gold or pink chip under the "Create Free Invitation" button: "✓ Free to start · No credit card needed".

**Why**: defuses pricing anxiety without making them scroll all the way to the Pricing section.

---

## Other front-end gaps to clean up later

These don't block the 5-second test but they make the site feel "almost finished" rather than finished. Pick them off when you have time.

- **Broken footer links**. `Demo`, `About Us`, `Blog`, `Contact`, `Privacy Policy`, `Terms of Service`, `Wedding`, `Engagement`, `Akad Nikah`, `Anniversary`, and the bottom-row Privacy/Terms/Cookies all currently point to `#`. They look like real links but they reload the page. Either build the destination pages or remove the links until the pages exist.
- **Privacy & Terms are not optional**. Once you start collecting names, dates, RSVPs, photos — even on a free tier — you legally need a Privacy Policy and Terms of Service page. Pages can be simple, but they have to exist.
- **"View All Templates" loops to itself**. The button at the bottom of the Templates section links to `#templates`, which is the section the user is already in. Either point it at a real `/templates` page or change it to "Load More" with JS.
- **No 404 page**. A typo'd URL on the custom domain shows GitHub's default 404, which feels broken. Add a `404.html` styled to match the site.
- **Currency is fixed to ₹**. Fine for India-only, but if you want NRI couples a currency switch in the Pricing section is a nice touch.
- **Template card hover preview**. Right now hovering a card shows a small "Preview" button overlay. Clicking it does nothing. Either wire it to a modal showing the full invitation, or link each card to its own preview page.

---

## Tech notes

- **No frameworks.** Vanilla HTML/CSS/JS keeps the site small and fast.
- **Single CSS file** by design. It's ~60 KB; if it grows past ~120 KB, splitting by section would be sensible.
- **Theme** is light by default. Dark mode persists via `localStorage` and is applied before first paint to avoid a flash.
- **Countdown** targets *today + 47 days*, so the demo phone always shows a fresh date. It pauses when the tab is hidden.
- **Accessibility**: the page has a `<main>` landmark, a visible-on-focus skip link, full ARIA on the hamburger and theme toggle, and respects `prefers-reduced-motion`.
- **SEO**: full Open Graph, Twitter Card, JSON-LD `Organization` + `WebSite`, canonical URL.

## Deploying

Push to `main`. GitHub Pages picks it up within a minute or two. Hard refresh the browser to see new CSS/JS, or bump the `?v=` cache-buster in `index.html` so returning visitors get the fresh files automatically.
