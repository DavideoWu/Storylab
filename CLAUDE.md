# Storylab

A small demo website for Storylab. It has exactly two pages:

1. **Works** — displays children's creative works (stories, drawings, etc.)
2. **About** — a short section about Storylab

## Philosophy

This is a demo site, not a product. Keep it simple on purpose:

- No build step, no bundler, no package.json, no framework for the site itself.
- Plain HTML, CSS, and a sprinkle of vanilla JS — nothing else.
- Two pages, shared nav/footer, one stylesheet.
- No database, no user accounts, no general auth system. Works content is static data (JSON or hardcoded HTML) checked into the repo.
- **One deliberate exception**: a single serverless function powers PDF uploads to the gallery (see "Uploads" below). This is the only server-side code in the project — don't let it grow into a general backend.
- If a feature would require adding a build tool or framework to justify itself, that's a signal to cut the feature, not add the tool.

Whenever making changes, favor deleting/simplifying over adding. Do not introduce a framework, CMS, or general backend/auth system beyond the one upload function, unless explicitly asked.

## Structure

```
/
├── index.html          # Works page (home)
├── about.html          # About page
├── styles.css          # Single shared stylesheet
├── script.js           # Small vanilla JS (nav toggle, gallery filtering, upload button, etc.)
├── works.json          # Static data for children's works (title, author, image/pdf, description)
├── assets/
│   └── works/          # Images/thumbnails/PDFs for each piece
└── netlify/
    └── functions/
        └── upload.js   # The one serverless function: password-checks the sister, then adds the PDF
```

## Pages

### Works page (`index.html`)
- Grid/gallery of children's works.
- Each item: A pdf of the story. Shows up on the gallery as title only; clicking it
brings up full PDF.
- Data-driven from `works.json` so adding a new piece doesn't require touching HTML.
- An **"Upload"** button opens a small form (title, description, PDF file, password field). It's visible to everyone, but only submits successfully if the password matches — in practice this means only one person (the site owner's sister) can actually publish through it. See "Uploads" below for how this is wired up.

### About page (`about.html`)
- Short mission statement for Storylab.
- Simple, no complex layout — a headline, a paragraph or two, maybe a photo.

## Uploads (the one exception to "no backend")

There's exactly one person besides the site owner who can add works: the owner's sister. There's no account system — it's a single shared password, not a login.

- The upload form on the Works page posts to one serverless function (`netlify/functions/upload.js`).
- The function checks the submitted password against a single secret stored as an environment variable (e.g. `UPLOAD_PASSWORD`) — never hardcode it in the repo.
- On success, the function stores the PDF (e.g. commits it to `assets/works/` via the GitHub API, or uploads to a blob store) and appends the new entry to `works.json`.
- On failure (wrong password), it just returns an error — no accounts, no sessions, no password reset flow, no rate limiting beyond whatever the host gives for free.
- Keep this function small and single-purpose. If it starts needing multiple endpoints, roles, or a database, that's a sign to stop and reconsider rather than expand it.
- **Required environment variables** (set in the Netlify dashboard, not the repo): `UPLOAD_PASSWORD` (the shared password), `GITHUB_TOKEN` (a token with contents write access to this repo), `GITHUB_REPO` (`owner/repo`), and optionally `GITHUB_BRANCH` (defaults to `main`).
- **Known gap**: new entries from `upload.js` are shaped `{ title, description, pdf }` (no `image`/`author`/`age`), but the v0.2 gallery cards still render `image`/`author`/`age`. Uploaded works won't display correctly until the gallery is reworked to the title-only/click-to-view-PDF model described above — deferred on purpose for now.

## Conventions

- Semantic HTML (`<header>`, `<main>`, `<footer>`, `<nav>`).
- Mobile-first CSS, one `styles.css` file — don't split into multiple stylesheets.
- No inline styles; no CSS frameworks (Bootstrap/Tailwind) unless asked.
- Keep JS minimal and framework-free (no React/Vue/etc.).
- Test by opening `index.html` directly in a browser or serving the folder with any static server — no build/compile step required.
- The one exception: `netlify/functions/upload.js` needs a serverless host (e.g. Netlify) to run and test end-to-end. The rest of the site must keep working with zero hosting at all (plain `file://` or any static server) even if uploads aren't available in that context.

## Roadmap

- [ ] **v0.1 — Skeleton**: `index.html`, `about.html`, shared `styles.css`, nav/footer, placeholder content.
- [ ] **v0.2 — Works gallery**: `works.json` with a handful of sample entries; render as a responsive grid on the Works page.
- [ ] **v0.3 — About content**: Write real About copy and add a simple hero/photo.
- [ ] **v0.4 — Polish**: Basic responsive tweaks, favicon, page titles/meta tags, simple hover/transition details.
- [ ] **v0.5 — Optional nice-to-haves** (only if still simple): client-side search/filter on Works page, "featured work" on the home page, light/dark toggle.
- [ ] **v0.6 — Sister upload**: Upload button + form on Works page; `netlify/functions/upload.js` with password check via env var; on success, commits PDF to `assets/works/` and appends to `works.json`.
- **Explicitly out of scope for this demo**: general user accounts/login, CMS, public API, comments, build tooling, animations library, multi-user auth beyond the single shared upload password.
