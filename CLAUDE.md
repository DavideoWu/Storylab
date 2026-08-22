# Storylab

A small demo website for Storylab. It has exactly three pages:

1. **Home** (`home.html`) — describes the current Storylab workshop/program
2. **Works** (`index.html`) — displays children's creative works (stories, drawings, etc.)
3. **About** (`about.html`) — a short section about Storylab

Note the filenames don't match the nav labels 1:1: `index.html` is the Works page, not Home — that was a deliberate choice to keep the existing Works/About pages untouched when Home was added, rather than renaming files around. One consequence: static hosts (including Netlify) serve `index.html` at the bare site root (`/`) by default, so visiting the root URL lands on Works, not Home — Home is only reachable via `home.html` or the nav link. Don't try to silently fix this by renaming files unless asked; it'd touch both existing pages for a cosmetic reason.

## Philosophy

This is a demo site, not a product. Keep it simple on purpose:

- No build step, no bundler, no package.json, no framework for the site itself.
- Plain HTML, CSS, and a sprinkle of vanilla JS — nothing else.
- Three pages, shared nav/footer, one stylesheet.
- No database, no user accounts, no general auth system. Works content is static data (JSON or hardcoded HTML) checked into the repo.
- **One deliberate exception**: two small serverless functions power uploading and deleting works (see "Uploads" below). This is the only server-side code in the project — don't let it grow into a general backend.
- If a feature would require adding a build tool or framework to justify itself, that's a signal to cut the feature, not add the tool.

Whenever making changes, favor deleting/simplifying over adding. Do not introduce a framework, CMS, or general backend/auth system beyond the one upload function, unless explicitly asked.

## Structure

```
/
├── home.html           # Home page — describes the current workshop/program
├── index.html          # Works page (despite the filename, this is NOT Home — see note above)
├── about.html          # About page
├── styles.css          # Single shared stylesheet
├── script.js           # Small vanilla JS (nav toggle, gallery filtering, upload/delete buttons, etc.)
├── works.json          # Static data for children's works — every entry has title, author, age, image, description, pdf (all required)
├── assets/
│   └── works/          # Images/thumbnails/PDFs for each piece
└── netlify/
    └── functions/
        ├── upload.js   # Password-checks the sister, then adds a work
        └── delete.js   # Password-checks the sister, then removes a work
```

## Pages

### Home page (`home.html`)
- Describes whatever program Storylab is currently running (e.g. a specific workshop) — headline, a few paragraphs, and a plain "Details" list (grades, schedule, duration, fee, group size).
- The whole page is three full-viewport-height `<section class="hero-section">` blocks stacked inside `<main>`, each with its own full-bleed background image (`assets/home/hero-*.svg`, placeholders for now) and a dark overlay behind the text for readability — scrolling from one section to the next changes the background. Pure CSS, no JS involved.
- `<main>` on this page uses the `.home-main` class to opt out of the normal `main { max-width; padding; margin }` rule (used by Works/About) so the hero sections can go edge-to-edge — each section's own `.hero-section__content` box handles the readable-width text column instead.
- Static content, no data-driven parts — just HTML/CSS like the About page.
- This is the content someone lands on when they click "Home" in the nav; it is not served by default at the bare site root (see the filename note above).

### Works page (`index.html`)
- Grid/gallery of children's works.
- Each item has a required image, title, child's name/age, short description, and an attached PDF. Every card is clickable — most of the card is a link that opens the full PDF in a new tab. No optional-field handling anywhere: every entry always has every field.
- Every card also has a small **×** button in the top-right corner that deletes the work — password-gated, same as uploading. See "Uploads" below for how this is wired up.
- Data-driven from `works.json` so adding a new piece doesn't require touching HTML.
- An **"Upload"** button opens a small form (title, author, age, description, image file, PDF file, password field) — all fields required, matching the `works.json` schema exactly. It's visible to everyone, but only submits successfully if the password matches — in practice this means only one person (the site owner's sister) can actually publish through it. See "Uploads" below for how this is wired up.

### About page (`about.html`)
- Short mission statement for Storylab.
- Simple, no complex layout — a headline, a paragraph or two, maybe a photo.

## Uploads & deletion (the one exception to "no backend")

There's exactly one person besides the site owner who can add or remove works: the owner's sister. There's no account system — it's a single shared password, not a login, used by both functions.

- The upload form on the Works page posts to `netlify/functions/upload.js`; each card's × button posts to `netlify/functions/delete.js`.
- Both functions check the submitted password against the same secret stored as an environment variable (`UPLOAD_PASSWORD`) — never hardcode it in the repo.
- `upload.js` requires title, author, age, description, image, and PDF — if any are missing, it rejects the request before touching GitHub. This keeps every entry in `works.json` shaped identically, so the gallery template never needs to handle missing fields. On success, it commits the image and the PDF into `assets/works/` via the GitHub API, then appends the new entry (`{ title, author, age, image, description, pdf }`) to `works.json`.
- `delete.js` takes just a `title`, finds the matching entry in `works.json`, removes its image and PDF files from `assets/works/` via the GitHub API, then removes the entry itself from `works.json`.
- On failure (wrong password, missing fields, or title not found), each function just returns an error — no accounts, no sessions, no password reset flow, no rate limiting beyond whatever the host gives for free.
- Keep these functions small and single-purpose. If they start needing multiple endpoints, roles, or a database, that's a sign to stop and reconsider rather than expand them.
- **Required environment variables** (set in the Netlify dashboard, not the repo): `UPLOAD_PASSWORD` (the shared password), `GITHUB_TOKEN` (a token with contents write access to this repo), `GITHUB_REPO` (`owner/repo`), and optionally `GITHUB_BRANCH` (defaults to `main`).

## Conventions

- Semantic HTML (`<header>`, `<main>`, `<footer>`, `<nav>`).
- Mobile-first CSS, one `styles.css` file — don't split into multiple stylesheets.
- No inline styles; no CSS frameworks (Bootstrap/Tailwind) unless asked.
- Keep JS minimal and framework-free (no React/Vue/etc.).
- Test by opening `index.html` directly in a browser or serving the folder with any static server — no build/compile step required.
- The one exception: `netlify/functions/upload.js` and `netlify/functions/delete.js` need a serverless host (e.g. Netlify) to run and test end-to-end. The rest of the site must keep working with zero hosting at all (plain `file://` or any static server) even if uploads/deletion aren't available in that context.

## Roadmap

- [ ] **v0.1 — Skeleton**: `index.html`, `about.html`, shared `styles.css`, nav/footer, placeholder content.
- [ ] **v0.2 — Works gallery**: `works.json` with a handful of sample entries; render as a responsive grid on the Works page.
- [ ] **v0.3 — About content**: Write real About copy and add a simple hero/photo.
- [ ] **v0.4 — Polish**: Basic responsive tweaks, favicon, page titles/meta tags, simple hover/transition details.
- [ ] **v0.5 — Optional nice-to-haves** (only if still simple): client-side search/filter on Works page, "featured work" on the home page, light/dark toggle.
- [ ] **v0.6 — Sister upload**: Upload button + form on Works page; `netlify/functions/upload.js` with password check via env var; on success, commits PDF to `assets/works/` and appends to `works.json`.
- [ ] **v0.7 — Delete a work**: × button on each card; `netlify/functions/delete.js` with the same password check; on success, removes the work's files from `assets/works/` and its entry from `works.json`.
- [ ] **v0.8 — Home page**: `home.html` describing the current workshop/program, added to the shared nav on all pages.
- **Explicitly out of scope for this demo**: general user accounts/login, CMS, public API, comments, build tooling, animations library, multi-user auth beyond the single shared upload/delete password.
