---
name: ninartvision
description: 'Expert context for the Ninart Vision website (ninartvision.store) — a Georgian art portfolio, gallery, and store. Use for: adding pages, editing HTML/CSS/JS, Sanity CMS queries, adding artists or artworks, modifying the shop, updating design, understanding page connections, lang switcher, analytics, service worker, or any change to this specific project. Triggers: ninartvision, ninart, artist page, shop, gallery, Georgian art site, add artwork, add artist, sanity schema, update nav.'
argument-hint: 'What do you want to build or change on the Ninart Vision site?'
---

# Ninart Vision — Project Knowledge Skill

## Project Identity

**Ninart Vision** (`ninartvision.store`) is an independent art platform for contemporary Georgian painters.
Three combined roles: **Portfolio** · **Store** · **Editorial**

- Primary artist: **Nini Mzhavia**; Secondary artists: Mzia Kashia, Nanuli Gogiberidze
- Prices in **Georgian Lari (₾)**; purchase via **WhatsApp** (no payment processor)
- Hosted on **GitHub Pages** with a `CNAME` pointing to `ninartvision.store`
- Languages: **Georgian (KA) primary**, English (EN) secondary

---

## Tech Stack (No Build Pipeline)

| Layer | Technology | Notes |
|---|---|---|
| HTML/CSS/JS | Vanilla — no framework | Pre-minified `.min.*` files committed directly |
| CMS | **Sanity** | Project `8t5h923j`, dataset `production`, API `2025-02-05` |
| Fonts | **FiraGO** (Georgian) + Arial (base) | FiraGO only on `about.html` |
| Auth | Firebase (stub) | All config placeholder — non-functional |
| Analytics | GA4 | `GA_MEASUREMENT_ID` placeholder — not yet active |
| Caching | Service Worker (`sw.js`) | PWA-lite, cache name `ninart-v2` |
| Image CDN | Sanity CDN | WebP auto-format via `?auto=format&w=X&q=80` |

**Important**: There is no npm build step. Edit `.js`/`.css` source files. Minified files are separate copies; update both or just instruct the user to re-minify.

---

## File Map

```
/
├── index.html              ← Homepage (hero slider, artists preview, shop preview, news)
├── about.html              ← Platform mission, bilingual KA/EN
├── gallery.html            ← Legacy gallery (data.js based, older rendering)
├── news.html               ← CMS-driven news posts
├── support.html            ← "Support a Project" — payment info modal
├── artwork.html            ← Single artwork detail (template, not yet CMS-driven)
├── admin.html              ← Internal admin panel
├── project1–7.html         ← Individual exhibition/project pages
├── sanity-diagnostic.html  ← Sanity connectivity health check
│
├── style.css               ← Single global stylesheet
├── script.js               ← Main JS: modal, hero slider, hamburger menu
├── sanity-client.js        ← Sanity REST wrapper (global helpers)
├── sanity-queries.js       ← Typed GROQ helpers and projections
├── data.js                 ← LEGACY static ARTWORKS array (fallback)
├── gallery.js              ← Renders #galleryGrid from legacy data.js
├── lang.js                 ← KA/EN language switcher
├── analytics.js            ← GA4 event wrappers
├── auth.js                 ← Firebase Google Sign-In (stub)
├── payment-modal.js        ← Payment modal with clipboard copy
├── sw.js                   ← Service Worker
│
├── artists/
│   ├── index.html          ← All artists listing
│   ├── artist.html         ← Dynamic profile: ?artist={slug}
│   ├── artist.js           ← Fetches artist+artworks from Sanity by slug
│   ├── artists.js          ← Listing with 8-per-page pagination
│   ├── artist-shop.js      ← Artist-filtered shop view
│   └── mzia/nanuli/nini.html ← Static legacy artist pages (pre-CMS)
│
├── sale/
│   ├── shop.html           ← Main filterable shop
│   ├── shop-render.js      ← Artwork grid + filter state machine
│   └── shopFilter.js       ← Filter UI event handlers
│
├── js/
│   ├── cms-news.js         ← Fetches newsPost from Sanity → .news-list
│   ├── cms-projects.js     ← Fetches projects from Sanity
│   ├── cms-settings.js     ← Fetches siteSettings singleton
│   ├── homeArtistsPreview.js ← Homepage: 3 featured artists from Sanity
│   └── homeShopPreview.js  ← Homepage: featured artworks preview
│
├── css/
│   └── artist-gallery.css  ← Gallery grid styles for artist profile pages
│
└── sanity-schemas/
    ├── index.js            ← Schema exports
    ├── heroSlide.js        ← Hero slider schema
    ├── newsPost.js         ← Bilingual news post schema
    ├── siteSettings.js     ← Global settings singleton
    └── featuredProject.js  ← Featured project schema
```

---

## Design System

### Colors (Strictly monochrome — gallery aesthetic)
```css
body          → background: #ffffff; color: #000000
Primary text  → #111111
Card/section bg → #f5f5f5, #f9f9f9
Borders       → rgba(0,0,0,0.06) to rgba(0,0,0,0.20)
Header        → rgba(255,255,255,0.9) + backdrop-filter: blur(10px)
Buttons       → background: #111; color: #fff; border-radius: 12px
```
**Do not add color accents**. The monochrome palette is intentional.

### Typography
- Base: `Arial, Helvetica, sans-serif`
- Georgian text: `FiraGO` (Google Fonts — only loaded where needed)
- Nav links: `font-size: 14px; font-weight: 600`
- Hero H1: `clamp(26px, 6.5vw, 42px)` fluid

### Layout
```css
.container { width: min(1100px, 92%); margin: 0 auto; }
```
- Single breakpoint at **900px** for hamburger nav
- Grid/Flexbox only — no framework grid

### Component Patterns

**Artist Card:**
```html
<a class="artist-card" href="artists/artist.html?artist={slug}">
  <div class="artist-avatar" style="background-image:url(...)"></div>
  <h3 class="artist-name">...</h3>
  <p class="artist-style">...</p>
</a>
```

**Shop Item Card** (used on homepage, artist pages, shop):
```html
<div class="shop-item sale" data-title="..." data-price="..." data-photos="url1,url2" data-desc="...">
  <img srcset="..." sizes="(max-width:600px) 100vw, 33vw" loading="lazy">
  <div class="shop-meta">
    <span>Title</span>
    <span class="price">₾X</span>
  </div>
</div>
```
Status class on `.shop-item`: `sale` | `sold` (no class = unavailable)

**Product Modal:** Opened by `openModal(item)` in `script.js`. The modal reads `data-*` attributes from the clicked `.shop-item`. To make an item clickable, ensure it has `data-photos`, `data-title`, `data-price`.

**Filter Pills:**
```html
<div class="filter-tabs">
  <button class="pill active" data-filter="all">ALL</button>
  <button class="pill" data-filter="sale">SALE</button>
  <button class="pill" data-filter="sold">SOLD</button>
</div>
```

**Mobile Menu:** `#menuOverlay` (fullscreen), toggled by `#openMenu` / `#closeMenu` buttons. Duplicated on every page — **must be updated manually** on each HTML file.

---

## Navigation Structure

Every page has the **same nav HTML** — there is no templating. Nav links:

```
Home          → /index.html  (or ../ from subdirectory pages)
Support       → /support.html
Shop          → /sale/shop.html
Artists       → /artists/
News          → /news.html
About         → /about.html
```

When adding a new page or modifying the nav, **update every HTML file** by hand (or use grep to find the nav block then replace in all files).

Path prefix rule: pages in `/artists/` and `/sale/` use `../` prefixes for root assets.

---

## Sanity CMS Integration

### Configuration (in `sanity-client.js`)
```js
const SANITY_CONFIG = {
  projectId: '8t5h923j',
  dataset: 'production',
  apiVersion: '2025-02-05',
  perspective: 'published'
};
```

### Content Types (deployed to Sanity cloud)

| Type | Key Fields |
|---|---|
| `artist` | `name`, `slug.current`, `image`, `gallery[]`, `bio`, `style`, `whatsapp`, SEO fields |
| `artwork` | `title`, `slug.current`, `image`, `images[]`, `price`, `medium`, `dimensions`, `category`, `status` (`sale`/`sold`/`unavailable`), `showInShop` (bool), `artist` (reference) |
| `heroSlide` | `image`, `order`, `active` |
| `newsPost` | `titleKa`, `titleEn`, `bodyKa[]` (PT), `bodyEn[]` (PT), `publishedAt`, `slug.current` |
| `siteSettings` | Singleton — social URLs, contact email, banner copy |
| `featuredProject` | Featured project for homepage block |

### Querying Pattern
Use `executeSanityQuery()` from `sanity-queries.js`. GROQ projections are defined as constants:
```js
const ARTIST_PROJECTION = `{ _id, name, "slug": slug.current, image, style, ... }`;
const ARTWORK_PROJECTION = `{ _id, title, "slug": slug.current, image, images, price, status, ... }`;
const ARTWORK_STATUS_FILTER = '(!defined(status) || status in ["published", "sold"])';
```

### Image URL Helper
```js
// From sanity-client.js (global):
sanityImgUrl(imageRef, width)    // → CDN URL with ?auto=format&w=X&q=80
sanitySrcset(imageRef)           // → "url?w=400 400w, url?w=800 800w, url?w=1200 1200w"
```

### Known Issue: Shop Not Fully Migrated
`sale/shop-render.js` currently filters the **legacy `window.ARTWORKS`** static array, not Sanity. The artist slug→ID mapping is hardcoded:
```js
const slugToId = { 'nini-mzhavia': 'nini', 'mzia-kashia': 'mzia', 'nanuli-gogiberidze': 'nanuli' };
```
Adding a 4th artist requires updating this object.

---

## Multilingual Support (`lang.js`)

Elements carry both language strings as `data-ka` / `data-en` attributes:
```html
<h1 data-ka="ჩვენ შესახებ" data-en="About Us">ჩვენ შესახებ</h1>
```
`setLang('en')` iterates all `[data-en]` elements and swaps `innerHTML`. Persisted in `localStorage` as `siteLang`. Default: `"ka"`.

Language toggle buttons are only present on `about.html`. Most pages are English-only.

---

## Analytics (`analytics.js`)

GA4 wrapper with GDPR flags. Currently inactive (placeholder measurement ID).

| Function | GA4 Event |
|---|---|
| `trackArtistView(slug, name)` | `artist_view` |
| `trackArtworkClick(title, id, artist)` | `artwork_click` |
| `trackWhatsAppClick(artist)` | `whatsapp_click` |
| `trackPurchaseIntent(title, price)` | `purchase_intent` |

All events include `anonymize_ip: true`.

---

## Service Worker (`sw.js`)

Two caches:
- `ninart-v2` — **network-first** for HTML pages
- `ninart-assets-v2` — **cache-first** for CSS/JS/images/fonts

Pre-cached on install: `./`, `style.min.css`, `script.min.js`, `logo.png`, `logo.webp`, `garden9.webp`.
Bump the cache name string when deploying breaking asset changes.

---

## Performance Conventions

- Critical CSS is **inlined** in `<style>` in `<head>` of `index.html` (prevents FOUC)
- Full `style.min.css` loaded **asynchronously** via `rel="preload"` + `onload` swap
- LCP image (`garden9.webp`) has `fetchpriority="high"` and is preloaded
- All Sanity images use `srcset` with `400w 800w 1200w` and `loading="lazy"`
- Scripts use `defer` or are placed before `</body>`

---

## Common Tasks

### Add a New HTML Page
1. Copy the structure of the closest existing page
2. Update `<title>`, `<meta>` description, `og:*` tags
3. Replace the `<main>` content block
4. Verify nav links use correct relative paths (`../` for subdirectory pages)
5. Add the page to `sitemap.xml`
6. If the page has shop items, ensure `.shop-item` elements have required `data-*` attributes

### Add a New Artist
1. Create the artist document in Sanity Studio
2. Add a new `data-slug` entry in `sale/shop-render.js` `slugToId` map
3. Optionally create a static `artists/{slug}.html` for legacy/SEO purposes

### Add a New Artwork to the Shop
1. Create `artwork` document in Sanity with `showInShop: true` and `status: "sale"`
2. Also add to `data.js` `ARTWORKS` array for the legacy shop renderer (until shop is fully migrated)

### Edit Navigation on All Pages
Use grep/replace across all `.html` files to update the duplicated nav block.

### Deploy
Push to the `main` branch of the GitHub repo — GitHub Pages auto-deploys from root.
Custom domain is set via `CNAME` file (do not delete it).

---

## Known Architectural Gaps (Do Not "Fix" Without Asking)

- **Nav duplication** — deliberate until a templating solution is chosen
- **Auth stub** — Firebase config intentionally left as placeholder; not deployed
- **Legacy `data.js`** — kept as CMS fallback; do not delete
- **Static artist pages** (`mzia.html`, etc.) — kept for SEO/backwards-compat
- **GA4 placeholder** — not yet replaced with live ID
