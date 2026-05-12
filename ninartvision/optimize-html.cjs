/**
 * Batch HTML optimizer
 * - Replaces style.css with style.min.css (for non-render-blocking)
 * - Adds loading="lazy" to <img> tags that don't already have it
 * - Adds decoding="async" to lazy images
 * - Defers Firebase/sanity scripts (where not already deferred)
 * - Switches to minified JS references
 */

const fs = require('fs');
const path = require('path');

// HTML files to process (excluding index.html which was done manually)
const filesToProcess = [
  // Root pages
  'about.html',
  'artwork.html',
  'gallery.html',
  'news.html',
  'support.html',
  'project1.html',
  'project2.html',
  'project3.html',
  'project4.html',
  'project5.html',
  'project6.html',
  'project7.html',
  // Artists sub-pages
  'artists/index.html',
  'artists/artist.html',
  'artists/mzia.html',
  'artists/nanuli.html',
  'artists/nini.html',
  // Sale sub-pages
  'sale/shop.html',
];

const ROOT = __dirname;

function processFile(relPath) {
  const filePath = path.join(ROOT, relPath);
  if (!fs.existsSync(filePath)) {
    console.log(`⏭ Skipping (not found): ${relPath}`);
    return;
  }

  let html = fs.readFileSync(filePath, 'utf8');
  const original = html;

  // 1. Replace style.css with style.min.css
  html = html
    .replace(/href="\.\/style\.css"/g, 'href="./style.min.css"')
    .replace(/href="\.\.\/style\.css"/g, 'href="../style.min.css"');

  // 2. Replace script.js with script.min.js (and other minified scripts)
  const jsReplacements = [
    [/src="\.\/script\.js"/g, 'src="./script.min.js"'],
    [/src="\.\.\/script\.js"/g, 'src="../script.min.js"'],
    [/src="\.\/analytics\.js"/g, 'src="./analytics.min.js"'],
    [/src="\.\.\/analytics\.js"/g, 'src="../analytics.min.js"'],
    [/src="\.\/auth\.js"/g, 'src="./auth.min.js"'],
    [/src="\.\.\/auth\.js"/g, 'src="../auth.min.js"'],
    [/src="\.\/sanity-client\.js"/g, 'src="./sanity-client.min.js"'],
    [/src="\.\.\/sanity-client\.js"/g, 'src="../sanity-client.min.js"'],
    [/src="\.\/data\.js"/g, 'src="./data.min.js"'],
    [/src="\.\.\/data\.js"/g, 'src="../data.min.js"'],
    [/src="\.\/js\/homeShopPreview\.js"/g, 'src="./js/homeShopPreview.min.js"'],
    [/src="\.\.\/js\/homeShopPreview\.js"/g, 'src="../js/homeShopPreview.min.js"'],
    [/src="\.\/js\/homeArtistsPreview\.js"/g, 'src="./js/homeArtistsPreview.min.js"'],
    [/src="\.\.\/js\/homeArtistsPreview\.js"/g, 'src="../js/homeArtistsPreview.min.js"'],
    [/src="\.\/shop-render\.js"/g, 'src="./shop-render.min.js"'],
    [/src="\.\/shopFilter\.js"/g, 'src="./shopFilter.min.js"'],
    [/src="\.\/artist-shop\.js"/g, 'src="./artist-shop.min.js"'],
    [/src="\.\/artist\.js"/g, 'src="./artist.min.js"'],
    [/src="\.\/artists\.js"/g, 'src="./artists.min.js"'],
  ];
  for (const [re, rep] of jsReplacements) {
    html = html.replace(re, rep);
  }

  // 3. Add defer to Firebase scripts (if not already)
  html = html.replace(
    /(<script\b)(?![^>]*\bdefer\b)([^>]*firebasejs[^>]*>)/g,
    '$1 defer$2'
  );

  // 4. Add loading="lazy" and decoding="async" to <img> tags without it
  //    Skip: logo, favicon, og-image, avatar images (first img in header brand)
  //    Strategy: add to all imgs that don't already have loading attr
  html = html.replace(
    /<img\b([^>]*)>/g,
    (match, attrs) => {
      // Already has loading attr? Skip
      if (/\bloading\s*=/.test(attrs)) return match;
      // Skip tiny icons/avatars by checking src
      if (/favicon|logo\.png|logo\.webp|user-avatar/.test(attrs)) return match;
      // Add lazy loading and async decoding
      let newAttrs = attrs;
      if (!/\bdecoding\s*=/.test(attrs)) {
        newAttrs += ' decoding="async"';
      }
      return `<img${newAttrs} loading="lazy">`;
    }
  );

  if (html !== original) {
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`✅ Updated: ${relPath}`);
  } else {
    console.log(`ℹ  No changes: ${relPath}`);
  }
}

console.log('🚀 Batch HTML optimization...\n');
for (const f of filesToProcess) {
  processFile(f);
}
console.log('\n✅ Done!');
