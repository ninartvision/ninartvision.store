/**
 * Migrate existing products/<slug>/index.html from legacy product-layout
 * to Roseslover project-page markup (no Sanity fetch).
 * Idempotent — skips files already on project-page layout.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const productsDir = join(ROOT, 'products');
const CSS_VER = 'nv20260614';

const LIGHTBOX_BLOCK = `
<div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-hidden="true">
  <span class="close" id="lightboxClose" aria-label="Close lightbox">&times;</span>
  <img class="lightbox-img" id="lightboxImg" src="" alt="Enlarged view" decoding="async" loading="lazy">
</div>
`;

const LIGHTBOX_SCRIPT = `
<script>
  (function () {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const closeBtn = document.getElementById('lightboxClose');
    if (!lightbox || !lightboxImg || !closeBtn) return;

    function openLightbox(imgSrc) {
      lightbox.classList.add('open');
      lightboxImg.src = imgSrc;
      document.body.style.overflow = 'hidden';
      lightbox.setAttribute('aria-hidden', 'false');
      closeBtn.focus();
    }

    function closeLightbox() {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
      lightbox.setAttribute('aria-hidden', 'true');
    }

    document.querySelectorAll('.gallery-list img').forEach(function (img) {
      img.addEventListener('click', function () {
        openLightbox(img.getAttribute('data-full') || img.src);
      });
    });

    closeBtn.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox();
    });
  }());
</script>
`;

function bumpCssVer(html) {
  return html.replace(
    /href="\.\.\/\.\.\/style\.min\.css\?v=[^"]+"/g,
    `href="../../style.min.css?v=${CSS_VER}"`
  ).replace(
    /src="\.\.\/\.\.\/script\.min\.js\?v=[^"]+"/g,
    `src="../../script.min.js?v=${CSS_VER}"`
  );
}

function extractBetween(html, start, end) {
  const a = html.indexOf(start);
  if (a === -1) return '';
  const b = html.indexOf(end, a + start.length);
  if (b === -1) return '';
  return html.slice(a + start.length, b);
}

function migrateFile(absPath) {
  let html = readFileSync(absPath, 'utf8');
  if (html.includes('class="project-page"') && html.includes('class="project-hero"')) {
    const bumped = bumpCssVer(html);
    if (bumped !== html) {
      writeFileSync(absPath, bumped, 'utf8');
      return 'bumped';
    }
    return 'skip';
  }

  if (!html.includes('product-layout')) return 'skip';

  const mainImgMatch = html.match(/<img id="mainImg"[^>]*>/i);
  const mainImgTag = mainImgMatch ? mainImgMatch[0].replace(/\s*style="[^"]*"/gi, '') : '';

  const thumbTags = [...html.matchAll(/<img[^>]*class="product-thumb"[^>]*>/gi)];
  const galleryImgs = thumbTags.map((m) => {
    let tag = m[0].replace(/\s*onclick="[^"]*"/gi, '');
    const srcM = tag.match(/src="([^"]+)"/i);
    if (!srcM) return '';
    const thumb = srcM[1];
    const full = thumb.replace(/w=120/, 'w=1600').replace(/q=75/, 'q=90');
    tag = tag.replace(/class="product-thumb"/, '');
    if (!/loading=/.test(tag)) tag = tag.replace(/<img /i, '<img loading="lazy" ');
    if (!/decoding=/.test(tag)) tag = tag.replace(/<img /i, '<img decoding="async" ');
    if (!/data-full=/.test(tag)) {
      tag = tag.replace(/<img /i, `<img data-full="${full.replace(/"/g, '&quot;')}" `);
    }
    return tag;
  }).filter(Boolean).join('\n        ');

  const rightBlock = extractBetween(html, '<div class="product-right">', '</div>\n\n    </div>');
  if (!rightBlock) return 'fail';

  let right = rightBlock;
  right = right.replace(/<h1[^>]*>/i, '<h1>');
  right = right.replace(/class="product-info"/g, 'class="project-details"');
  right = right.replace(/<li><b>/gi, '<li><strong>').replace(/<\/b>/gi, '</strong>');
  right = right.replace(/<a href="[^"]*sale\/shop\.html"[^>]*>[^<]*<\/a>\s*/i, '');
  right = right.replace(/\s*style="[^"]*"/gi, '');

  const gallerySection = galleryImgs
    ? `\n  <section class="project-gallery">\n    <h2>More photos</h2>\n    <div class="gallery-list">\n        ${galleryImgs}\n    </div>\n  </section>\n`
    : '';

  const body = `
<main class="project-page">

  <section class="project-hero">
    <div class="project-text">
${right}
      <a class="link back-link" href="../../sale/shop.html">← Back to Shop</a>
    </div>

    <div class="project-image">
      ${mainImgTag || '<p class="muted">No image available.</p>'}
    </div>
  </section>
${gallerySection}
</main>
`;

  const prodStart = html.indexOf('<!-- ── PRODUCT');
  const scriptStart = html.indexOf('<script defer src="../../script.min.js');
  if (prodStart === -1 || scriptStart === -1) return 'fail';

  const tailEnd = html.indexOf('</body>');
  const tail = tailEnd !== -1 ? html.slice(scriptStart, tailEnd) : html.slice(scriptStart);
  const shareScript = tail.replace(/<script defer[^>]*><\/script>\s*/i, '');

  let head = html.slice(0, prodStart);
  head = bumpCssVer(head);

  let out = head + body + LIGHTBOX_BLOCK + '\n'
    + `<script defer src="../../script.min.js?v=${CSS_VER}"></script>\n`
    + shareScript.trim() + '\n'
    + LIGHTBOX_SCRIPT + '\n</body>\n</html>\n';

  writeFileSync(absPath, out, 'utf8');
  return 'migrated';
}

function main() {
  if (!existsSync(productsDir)) {
    console.error('No products/ directory.');
    process.exit(1);
  }
  const counts = { migrated: 0, bumped: 0, skip: 0, fail: 0 };
  for (const name of readdirSync(productsDir)) {
    const idx = join(productsDir, name, 'index.html');
    if (!existsSync(idx)) continue;
    const r = migrateFile(idx);
    counts[r] = (counts[r] || 0) + 1;
    if (r === 'migrated' || r === 'bumped') console.log(`  ${r} → products/${name}/index.html`);
  }
  console.log('\nDone.', counts);
}

main();
