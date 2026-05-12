# CMS-Driven Site — Sanity Schema Deployment Guide

## What Was Built

The site now has a complete CMS layer.  Four new Sanity document types
control content that was previously hard-coded in HTML:

| Schema file           | Content type    | Controls                                          |
|-----------------------|-----------------|---------------------------------------------------|
| `siteSettings.js`     | Site Settings   | Social links, WhatsApp, contact email, banner text, mission copy |
| `heroSlide.js`        | Hero Slides     | Homepage hero slider images (optional upgrade)    |
| `newsPost.js`         | News & Stories  | All news articles (bilingual ka/en)               |
| `featuredProject.js`  | Featured Projects | Homepage project cards + dynamic detail pages   |

### Frontend modules added

| Script                   | Loaded on            | Does                                           |
|--------------------------|----------------------|------------------------------------------------|
| `js/cms-settings.js`     | index.html, news.html | Applies siteSettings to social links, WhatsApp widget, banner text, mission section |
| `js/cms-news.js`         | index.html, news.html | Renders news posts dynamically                |
| `js/cms-projects.js`     | index.html            | Renders Featured Projects slider from Sanity  |
| `project.html`           | any page              | Dynamic project detail template (`project.html?p=slug`) |

All modules fall back silently to existing static HTML when Sanity
returns no data — zero risk of breaking the live site.

---

## Step 1 — Deploy the schemas to Sanity

### Option A: Add to an existing local Studio project

1. If you don't have a local Studio project, create one:
   ```bash
   npm create sanity@latest -- --project 8t5h923j --dataset production
   ```

2. Copy the four `.js` files from this folder into your studio's
   `schemaTypes/` (or `schemas/`) directory.

3. Open `schemaTypes/index.js` and add the four new types:
   ```js
   // Existing imports stay as-is
   import { siteSettings  } from './siteSettings.js'
   import { heroSlide     } from './heroSlide.js'
   import { newsPost      } from './newsPost.js'
   import { featuredProject } from './featuredProject.js'

   export const schemaTypes = [
     // … existing types (artist, artwork) …
     siteSettings,
     heroSlide,
     newsPost,
     featuredProject,
   ]
   ```

4. Run locally to verify: `npx sanity dev`

5. Deploy to the cloud: `npx sanity deploy`

### Option B: CLI deploy (no local Studio needed)

```bash
npx sanity@latest schema push --project 8t5h923j --dataset production
```

---

## Step 2 — Enter content in Sanity Studio

Open https://8t5h923j.sanity.studio/ after deploying.

### Site Settings (do this first — highest impact)

1. Click **Site Settings** → **+ New Site Settings**
2. Fill in:
   - **Facebook URL** — `https://www.facebook.com/share/1D6m5jjWW5/…`
   - **Instagram URL** — `https://www.instagram.com/ninart.vision…`
   - **WhatsApp Number** — `995579388833`
   - **Contact Email** — `ninartvision@gmail.com`
   - **Homepage Banner Text (Georgian)** — the welcome phrase
   - **Homepage Banner Text (English)** — the welcome phrase in English
   - **Mission Section Heading** — `Our Mission`
   - **Mission Text (English)** — the "Ninart Vision is an independent…" paragraph
3. Click **Publish** → changes appear on the live site immediately

> **Only create ONE Site Settings document.** Always edit the same one.

### News & Stories

1. Click **News & Stories** → **+ Create**
2. Fill in Title (English), Title (Georgian), Published Date, body text
3. Auto-generate the slug from the English title
4. **Publish** → the article replaces the matching static entry
   (or appears as a new one if no static version exists)

### Featured Projects

For the seven existing projects:
1. Click **Featured Projects** → **+ Create**
2. Fill in Title, cover image, short description, full body text
3. Set **Display Order**: 1 for Svaneti, 2 for Silent Bloom, etc.
4. Set **Legacy Page URL** to `./project1.html` (or the correct number)
   so the card still links to the existing static page
5. **Publish** — the homepage slider pulls from Sanity

For new projects (no existing static page):
1. Leave **Legacy Page URL** blank
2. The card automatically links to `project.html?p={your-slug}`

### Hero Slides (optional)

The homepage hero currently uses 19 static slides coded in `index.html`.
To move them to Sanity, add `js/cms-hero.js` (not yet created) and
populate **Hero Slides** documents. Until then the static slides remain.

---

## Step 3 — Extend to other pages (optional)

`js/cms-settings.js` can be added to any page to keep social links and
contact info in sync.  Add this before `</body>` in `about.html`,
`support.html`, and any other pages:

```html
<script defer src="./js/cms-settings.js"></script>
```

For pages in a subdirectory (`artists/`, `sale/`) use `../js/cms-settings.js`.

---

## How the CMS controls the site — summary

```
Sanity Studio (you edit here)
  │
  ├── siteSettings ──► js/cms-settings.js
  │                     updates: Facebook, Instagram, WhatsApp, email,
  │                              cloth banner text, mission paragraph
  │
  ├── newsPost ────────► js/cms-news.js
  │                     renders: index.html news section (max 3)
  │                              news.html full article list
  │
  ├── featuredProject ─► js/cms-projects.js
  │                     renders: index.html Featured Projects slider
  │                              project.html?p=slug  (detail pages)
  │
  ├── artwork ────────► homeShopPreview.js  (already working)
  │                     renders: homepage shop grid, sale/shop.html
  │
  └── artist ─────────► homeArtistsPreview.js + artist.js  (already working)
                        renders: homepage artists grid, artist profile pages
```

**Zero code edits required** once schemas are deployed and the first
documents are published in Sanity Studio.
