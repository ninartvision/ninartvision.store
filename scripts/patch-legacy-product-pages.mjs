/**
 * Patch older product listing HTML under products/<slug>/index.html
 * when full Sanity regeneration is blocked by slug collisions.
 * Idempotent — safe to run multiple times.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const productsDir = join(ROOT, 'products');

const SHELL_SNIPPET = `<!-- ── HEADER ──────────────────────────────────────────────────────────── -->
<header class="header">
  <div class="container header-row">
    <a class="brand" href="../../index.html">
      <img src="../../images/logo.webp" alt="Ninart Vision Logo" width="751" height="134" decoding="async">
    </a>
    <nav class="nav desktop-nav">
      <a href="../../index.html">Home</a>
      <a href="../../support.html">Support a Project</a>
      <a href="../../sale/shop.html" class="active">Shop</a>
      <a href="../../room-visualizer.html">Room preview</a>
      <a href="../../artists/">Artists</a>
      <a href="../../news.html">News</a>
      <a href="../../about.html">About</a>
    </nav>
    <div class="header-tools">
      <a href="../../sale/shop.html" class="header-cart" aria-label="Shopping cart">
        <span class="header-cart__surface">
          <svg class="header-cart__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="18" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.73L23 6H6"/></svg>
        </span>
        <span class="header-cart__badge is-empty" data-cart-badge aria-live="polite" aria-hidden="true"></span>
      </a>
      <button class="hamburger" id="openMenu" aria-label="Open menu" type="button">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
</header>

<!-- ── MOBILE MENU ─────────────────────────────────────────────────────── -->
<div class="menu-overlay" id="menuOverlay">
  <button class="menu-close" id="closeMenu" type="button" aria-label="Close menu">✕</button>

  <nav class="menu-links" aria-label="Mobile navigation">
    <a class="menu-link" href="../../index.html">HOME</a>
    <a class="menu-link" href="../../support.html">SUPPORT A PROJECT</a>
    <a class="menu-link" href="../../sale/shop.html">SHOP</a>
    <a class="menu-link" href="../../room-visualizer.html">ROOM PREVIEW</a>
    <a class="menu-link" href="../../artists/">ARTISTS</a>
    <a class="menu-link" href="../../news.html">NEWS</a>
    <a class="menu-link" href="../../about.html">ABOUT</a>
    <a class="menu-link menu-link-cart" href="../../sale/shop.html">CART <span class="header-cart__badge header-cart__badge--menu is-empty" data-cart-badge aria-live="polite" aria-hidden="true"></span></a>
  </nav>
</div>

`;

const DEFER_TAG = `<script defer src="../../script.min.js?v=nv20260518"></script>\n`;

function patchFile(absPath) {
  let html = readFileSync(absPath, 'utf8');
  const orig = html;

  html = html.replace(
    /<meta name="viewport" content="width=device-width, initial-scale=1\.0, maximum-scale=1\.0, user-scalable=no"\s*\/?>/i,
    '<meta name="viewport" content="width=device-width, initial-scale=1" />'
  );

  const hdr = html.indexOf('<!-- ── HEADER');
  const prod = html.indexOf('<!-- ── PRODUCT');
  if (hdr !== -1 && prod !== -1 && hdr < prod) {
    html = html.slice(0, hdr) + SHELL_SNIPPET + html.slice(prod);
  }

  html = html.replace(/\s*\/\/ Mobile menu[\s\S]*?\}\)\(\);\s*/g, '\n');
  html = html.replace(/\s*\/\/ Mobile menu[\s\S]*?\}\(\)\);\s*/g, '\n');

  if (!html.includes('script.min.js')) {
    html = html.replace(/<script>\s*\n\s*\/\/ Footer year/i, `${DEFER_TAG}<script>\n  // Footer year`);
  }

  html = html.replace(
    /<script defer src="\.\.\/\.\.\/script\.min\.js\?v=[^"]*"><\/script>/,
    `<script defer src="../../script.min.js?v=nv20260518"></script>`
  );

  if (html !== orig) writeFileSync(absPath, html, 'utf8');
  return html !== orig;
}

function main() {
  if (!existsSync(productsDir)) {
    console.error('No products/ directory.');
    process.exit(1);
  }
  let n = 0;
  for (const name of readdirSync(productsDir)) {
    const idx = join(productsDir, name, 'index.html');
    if (existsSync(idx) && patchFile(idx)) {
      console.log(`Patched → products/${name}/index.html`);
      n++;
    }
  }
  console.log(`Done. Updated ${n} file(s).`);
}

main();
