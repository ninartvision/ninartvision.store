/**
 * generate-product-pages.mjs
 *
 * Fetches every published artwork from Sanity and writes a static
 * /products/{slug}/index.html for each one.  Because the OG tags live
 * directly in the HTML <head>, WhatsApp and Facebook crawlers see the
 * correct product image, title and description without executing any JS.
 *
 * Run:  node scripts/generate-product-pages.mjs
 *
 * Requires Node 18+ (native fetch).
 */

import { existsSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join, dirname }                                  from 'path';
import { fileURLToPath }                                  from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = join(__dirname, '..');   // ninartvision/

/* ── Sanity config ──────────────────────────────────────────────────────── */
const SANITY = {
  projectId: '8t5h923j',
  dataset:   'production',
  apiVersion:'2025-02-05',
};

/* ── Helpers ──────────────────────────────────────────────────────────────── */

/** Convert any title to a URL-safe slug */
function generateSlug(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/['"«»\u201c\u201d\u2018\u2019\u201e\u201f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g,  '-');
}

/** Sanitize an existing Sanity slug — strips trailing whitespace and hyphens */
function sanitizeSlug(raw) {
  return String(raw || '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g,  '-')
    .replace(/^-+|-+$/g, '');  // no leading/trailing hyphens
}

/** Append Sanity image transformation params */
function sanityImg(url, { w, h, fit, q = 80 } = {}) {
  if (!url || !url.includes('cdn.sanity.io')) return url || '';
  const base = url.split('?')[0];
  const p = new URLSearchParams();
  p.set('auto', 'format');
  if (w)   p.set('w',   String(w));
  if (h)   p.set('h',   String(h));
  if (fit) p.set('fit', fit);
  p.set('q', String(q));
  return base + '?' + p.toString();
}

/** Escape for HTML attribute values */
function escAttr(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Escape for HTML text content */
function escText(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Escape for a JS single-quoted string literal */
function escJs(str) {
  return String(str || '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g,  "\\'")
    .replace(/\r/g, '')
    .replace(/\n/g, '\\n');
}

/** Format price with ₾ symbol */
function fmtPrice(raw) {
  const n = Number(String(raw || '').replace(/[^\d.]/g, ''));
  return n ? '₾' + n.toLocaleString('en-US') : '';
}

/* ── Sanity fetch ───────────────────────────────────────────────────────── */

async function fetchAllArtworks() {
  const query = `
    *[_type == "artwork" && defined(slug.current) && status in ["sale", "sold"]]
    | order(coalesce(order, 999) asc, _createdAt desc) {
      _id,
      title,
      "slug": slug.current,
      shortDescription,
      description,
      image{
        asset->{ _id, url, metadata{ dimensions } },
        alt
      },
      images[]{
        asset->{ _id, url },
        alt,
        _key
      },
      year,
      medium,
      dimensions,
      price,
      status,
      "seoTitle":       seo.seoTitle,
      "seoDescription": seo.seoDescription,
      "artist": artist->{
        _id,
        name,
        "slug": slug.current,
        whatsapp
      }
    }
  `.trim();

  const apiUrl =
    `https://${SANITY.projectId}.apicdn.sanity.io/v${SANITY.apiVersion}` +
    `/data/query/${SANITY.dataset}?query=${encodeURIComponent(query)}`;

  const res = await fetch(apiUrl);
  if (!res.ok) throw new Error(`Sanity API error: ${res.status} ${res.statusText}`);
  const json = await res.json();
  return json.result || [];
}

/* ── HTML template ──────────────────────────────────────────────────────── */

function buildPage(a) {
  const slug       = sanitizeSlug(a.slug) || generateSlug(a.title || '');
  const title      = a.seoTitle || a.title || 'Artwork';
  const artistName = a.artist?.name || '';
  const rawDesc    = a.seoDescription || a.shortDescription || a.description || '';
  const desc       = rawDesc ||
    `Original artwork${artistName ? ' by ' + artistName : ''}. Available at Ninart Vision.`;

  const rawImgUrl  = a.image?.asset?.url || '';

  // OG image: 1200×630, cropped — used by WhatsApp / Facebook crawlers
  const ogImage = rawImgUrl
    ? sanityImg(rawImgUrl, { w: 1200, h: 630, fit: 'crop', q: 85 })
    : 'https://ninartvision.store/images/og-image.png';

  // Display image: full-width on the page
  const displayImg = rawImgUrl ? sanityImg(rawImgUrl, { w: 900, q: 85 }) : '';

  const pageUrl  = `https://ninartvision.store/products/${slug}/`;
  const price    = fmtPrice(a.price);
  const isSold   = String(a.status || '').toLowerCase() === 'sold';
  const phone    = a.artist?.whatsapp || '995579388833';

  // WhatsApp link (static — works without JS)
  const waMsg  = encodeURIComponent(
    `გამარჯობა, მაინტერესებს ნახატი: ${a.title || title}, ავტორი ${artistName}, ფასი ${price}\n${pageUrl}`
  );
  const waUrl  = `https://wa.me/${phone}?text=${waMsg}`;

  // Extra gallery photos
  const extraPhotos = (a.images || [])
    .map(i => i?.asset?.url)
    .filter(Boolean)
    .filter(u => u !== rawImgUrl);   // avoid duplicating the hero

  const thumbsHtml = extraPhotos.length
    ? extraPhotos.map((u, i) =>
        `<img src="${sanityImg(u, { w: 120, q: 75 })}" class="product-thumb" ` +
        `alt="${escAttr((a.title || 'photo') + ' ' + (i + 2))}" ` +
        `onclick="document.getElementById('mainImg').src='${escAttr(sanityImg(u, { w: 900, q: 85 }))}'">`
      ).join('\n        ')
    : '';

  // Schema.org Product
  const offerPrice = Number(String(a.price || '').replace(/[^\d.]/g, '')) || null;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type':    'Product',
    name:        a.title || title,
    description: desc,
    image:       ogImage,
    url:         pageUrl,
    brand:       { '@type': 'Brand', name: 'Ninart Vision' },
    ...(artistName ? { creator: { '@type': 'Person', name: artistName } } : {}),
    offers: {
      '@type':        'Offer',
      priceCurrency:  'GEL',
      ...(offerPrice ? { price: offerPrice } : {}),
      availability: isSold
        ? 'https://schema.org/SoldOut'
        : 'https://schema.org/InStock',
      url: pageUrl,
    },
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>${escAttr(title)} | Ninart Vision</title>
  <meta name="description"  content="${escAttr(desc)}">
  <meta name="robots"       content="index, follow">
  <link rel="canonical"     href="${pageUrl}">

  <!-- ═══════════════════════════════════════════════════════════════════════
       OPEN GRAPH — static, hard-coded, visible to WhatsApp / Facebook / all
       social crawlers that do NOT execute JavaScript.
  ═══════════════════════════════════════════════════════════════════════════ -->
  <meta property="og:type"         content="product">
  <meta property="og:site_name"    content="Ninart Vision">
  <meta property="og:title"        content="${escAttr(title)}">
  <meta property="og:description"  content="${escAttr(desc)}">
  <meta property="og:image"        content="${ogImage}">
  <meta property="og:image:width"  content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt"    content="${escAttr(a.title || title)}">
  <meta property="og:url"          content="${pageUrl}">

  <!-- Twitter Card -->
  <meta name="twitter:card"        content="summary_large_image">
  <meta name="twitter:title"       content="${escAttr(title)}">
  <meta name="twitter:description" content="${escAttr(desc)}">
  <meta name="twitter:image"       content="${ogImage}">

  <!-- Schema.org -->
  <script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
  </script>

  <link rel="stylesheet" href="../../style.min.css" />
  <link rel="icon"       href="../../images/favicon.png">
</head>
<body>

<!-- ── HEADER ──────────────────────────────────────────────────────────── -->
<header class="header">
  <div class="container header-row">
    <a class="brand" href="../../index.html">
      <img src="../../images/logo.webp" alt="Ninart Vision Logo">
    </a>
    <nav class="nav desktop-nav">
      <a href="../../index.html">Home</a>
      <a href="../../support.html">Support a Project</a>
      <a href="../../sale/shop.html" class="active">Shop</a>
      <a href="../../artists/">Artists</a>
      <a href="../../news.html">News</a>
      <a href="../../about.html">About</a>
    </nav>
    <div class="header-actions">
      <button class="hamburger" id="openMenu" aria-label="Open menu">&#9776;</button>
    </div>
  </div>
</header>

<!-- ── MOBILE MENU ─────────────────────────────────────────────────────── -->
<div class="menu-overlay" id="menuOverlay">
  <div class="menu-links">
    <button class="menu-close" id="closeMenu" aria-label="Close menu">&#10005;</button>
    <a class="menu-link" href="../../index.html">Home</a>
    <a class="menu-link" href="../../support.html">Support a Project</a>
    <a class="menu-link" href="../../sale/shop.html">Shop</a>
    <a class="menu-link" href="../../artists/">Artists</a>
    <a class="menu-link" href="../../news.html">News</a>
    <a class="menu-link" href="../../about.html">About</a>
  </div>
</div>

<!-- ── PRODUCT ─────────────────────────────────────────────────────────── -->
<section class="section" style="padding-top:100px; min-height:70vh;">
  <div class="container">

    <a href="../../sale/shop.html" class="btn btn-dark" style="margin-bottom:2rem;">&#8592; Back to Shop</a>

    <div class="product-layout">

      <!-- LEFT: image gallery -->
      <div class="product-left">
        <div class="product-gallery">
          ${displayImg
            ? `<img id="mainImg" src="${displayImg}"
               alt="${escAttr(a.image?.alt || a.title || title)}"
               decoding="async"
               style="width:100%;max-width:600px;display:block;border-radius:8px;">`
            : '<p class="muted">No image available.</p>'
          }
        </div>
        ${thumbsHtml
          ? `<div class="product-thumbs" style="margin-top:1rem;display:flex;flex-wrap:wrap;gap:8px;">
        ${thumbsHtml}
      </div>`
          : ''
        }
      </div>

      <!-- RIGHT: details -->
      <div class="product-right">
        <h1 style="margin-bottom:.5rem;">${escText(a.title || title)}</h1>
        ${artistName ? `<p class="muted" style="margin-bottom:1rem;">by ${escText(artistName)}</p>` : ''}
        ${desc        ? `<p class="muted">${escText(desc)}</p>` : ''}

        <ul class="product-info" style="margin:1.25rem 0;">
          ${a.dimensions ? `<li><b>Size:</b>   ${escText(a.dimensions)}</li>` : ''}
          ${a.medium     ? `<li><b>Medium:</b> ${escText(a.medium)}</li>`     : ''}
          ${a.year       ? `<li><b>Year:</b>   ${escText(String(a.year))}</li>` : ''}
        </ul>

        <div class="product-buy">
          ${price ? `<div class="product-price">${escText(price)}</div>` : ''}

          <p class="status ${isSold ? 'sold' : 'sale'}" style="margin-top:.75rem;">
            ${isSold ? 'Sold' : 'Available'}
          </p>

          ${!isSold
            ? `<a class="btn btn-dark"
                 href="${waUrl}"
                 target="_blank" rel="noopener noreferrer"
                 style="margin-top:1rem;display:inline-block;">
                Buy via WhatsApp
               </a>`
            : ''
          }

          <button class="btn" id="shareBtn"
                  style="margin-top:.75rem;background:transparent;border:1px solid currentColor;cursor:pointer;">
            Share this artwork
          </button>
          <p id="shareMsg" class="muted" style="font-size:.8rem;margin-top:.5rem;display:none;">
            Link copied!
          </p>
        </div>
      </div>

    </div>
  </div>
</section>

<!-- ── FOOTER ──────────────────────────────────────────────────────────── -->
<footer class="footer" style="margin-top:4rem;">
  <div class="container footer-bottom">
    <p>&copy; <span id="yr"></span> Ninart Vision. All rights reserved.</p>
  </div>
</footer>

<script>
  // Footer year
  document.getElementById('yr').textContent = new Date().getFullYear();

  // Mobile menu
  (function () {
    const open    = document.getElementById('openMenu');
    const close   = document.getElementById('closeMenu');
    const overlay = document.getElementById('menuOverlay');
    if (!open || !close || !overlay) return;
    open.addEventListener('click',    () => overlay.classList.add('active'));
    close.addEventListener('click',   () => overlay.classList.remove('active'));
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('active'); });
  }());

  // Share button
  (function () {
    const btn = document.getElementById('shareBtn');
    const msg = document.getElementById('shareMsg');
    const url = '${escJs(pageUrl)}';
    if (!btn) return;
    btn.addEventListener('click', function () {
      if (navigator.share) {
        navigator.share({ title: '${escJs(title)}', url: url }).catch(function () {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(function () {
          msg.style.display = 'block';
          setTimeout(function () { msg.style.display = 'none'; }, 3000);
        });
      }
    });
  }());
</script>

</body>
</html>
`;
}

/* ── Main ───────────────────────────────────────────────────────────────── */

async function main() {
  const args    = process.argv.slice(2);
  const clean   = args.includes('--clean');
  const dryRun  = args.includes('--dry-run');
  const filter  = args.find(a => a.startsWith('--slug='))?.replace('--slug=', '');

  const productsDir = join(ROOT, 'products');

  if (clean && !dryRun) {
    if (existsSync(productsDir)) {
      rmSync(productsDir, { recursive: true, force: true });
      console.log('🗑  Removed existing /products/ directory');
    }
  }

  if (!existsSync(productsDir)) mkdirSync(productsDir, { recursive: true });

  console.log('⏳ Fetching artworks from Sanity…');
  let artworks = await fetchAllArtworks();
  console.log(`   Found ${artworks.length} artworks\n`);

  if (filter) {
    artworks = artworks.filter(a => (a.slug || '') === filter || generateSlug(a.title || '') === filter);
    console.log(`   Filtered to ${artworks.length} matching slug "${filter}"\n`);
  }

  let generated = 0;
  let skipped   = 0;
  const usedSlugs = new Map(); // slug → artwork title (for collision messages)

  // ── Pre-flight: detect collisions before writing any files ──────────────
  const collisionReport = [];
  for (const artwork of artworks) {
    const slug = sanitizeSlug(artwork.slug) || generateSlug(artwork.title || '');
    if (!slug) continue;
    if (usedSlugs.has(slug)) {
      collisionReport.push({ slug, a: artwork, existing: usedSlugs.get(slug) });
    } else {
      usedSlugs.set(slug, artwork.title || artwork._id);
    }
  }

  if (collisionReport.length) {
    console.error('');
    console.error('❌  SLUG COLLISIONS DETECTED — generation aborted.\n');
    console.error('   Fix these in Sanity Studio before re-running the generator.');
    console.error('   Run `node scripts/audit-slugs.mjs` for suggestions.\n');
    for (const { slug, a, existing } of collisionReport) {
      console.error(`   Duplicate slug: "${slug}"`);
      console.error(`     → "${existing}"`);
      console.error(`     → "${a.title || a._id}" (id: ${a._id})\n`);
    }
    process.exit(2);
  }

  // ── Generate ─────────────────────────────────────────────────────────────
  for (const artwork of artworks) {
    const slug = sanitizeSlug(artwork.slug) || generateSlug(artwork.title || '');
    if (!slug) {
      console.warn(`  ⚠ Skipped (no slug): "${artwork.title}"`);
      skipped++;
      continue;
    }

    const dir = join(productsDir, slug);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    const html     = buildPage({ ...artwork, slug });
    const outPath  = join(dir, 'index.html');

    if (dryRun) {
      console.log(`  [dry-run] would write → products/${slug}/index.html`);
    } else {
      writeFileSync(outPath, html, 'utf8');
      console.log(`  ✓  products/${slug}/`);
    }
    generated++;
  }

  console.log(`\n${dryRun ? '[dry-run] ' : ''}Done.  Generated: ${generated}  Skipped: ${skipped}`);
}

main().catch(err => {
  console.error('\n❌', err.message || err);
  process.exit(1);
});
