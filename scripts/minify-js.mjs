/**
 * Reproducible JS minification: source .js → .min.js (Terser).
 * Run from repo root: npm run build:js
 *
 * Modal ownership: all product-modal logic lives in js/nv-gallery-modal.js.
 * After minify, scripts/verify-no-motion-div.mjs runs — build FAILs on invalid
 * <motion.div> markup (Safari-incompatible custom elements).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { minify } from 'terser';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

/** [sourceRelative, outputRelative] — HTML references .min.js; CI runs `npm run build:js` to regenerate outputs from these sources. */
const PAIRS = [
  ['analytics.js', 'analytics.min.js'],
  ['auth.js', 'auth.min.js'],
  ['data.js', 'data.min.js'],
  ['gallery.js', 'gallery.min.js'],
  ['payment-modal.js', 'payment-modal.min.js'],
  ['sanity-client.js', 'sanity-client.min.js'],
  ['script.js', 'script.min.js'],
  ['artists/artist-shop.js', 'artists/artist-shop.min.js'],
  ['artists/artist.js', 'artists/artist.min.js'],
  ['js/editorial-rule.js', 'js/editorial-rule.min.js'],
  ['js/homeArtistsPreview.js', 'js/homeArtistsPreview.min.js'],
  ['js/homeShopPreview.js', 'js/homeShopPreview.min.js'],
  ['js/news-cards.js', 'js/news-cards.min.js'],
  ['js/room-visualizer.js', 'js/room-visualizer.min.js'],
  ['js/project-detail-lightbox.js', 'js/project-detail-lightbox.min.js'],
  ['js/nv-gallery-modal.js', 'js/nv-gallery-modal.min.js'],
  ['js/nv-cart-drawer.js', 'js/nv-cart-drawer.min.js'],
  ['sale/shop-render.js', 'sale/shop-render.min.js'],
  ['sale/shopFilter.js', 'sale/shopFilter.min.js'],
];

const terserOpts = {
  compress: true,
  mangle: true,
  format: { comments: false },
};

let ok = 0;
let skipped = 0;

for (const [relIn, relOut] of PAIRS) {
  const inputPath = path.join(root, relIn);
  const outputPath = path.join(root, relOut);
  if (!fs.existsSync(inputPath)) {
    console.warn(`⏭ skip (missing source): ${relIn}`);
    skipped++;
    continue;
  }
  const code = fs.readFileSync(inputPath, 'utf8');
  const result = await minify(code, terserOpts);
  if (result.error) {
    console.error(`✖ ${relIn}:`, result.error);
    console.error('\nBuild aborted: fix JS syntax errors before deploy.');
    process.exit(1);
  }
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, result.code || '', 'utf8');
  console.log(`✓ ${relIn} → ${relOut}`);
  ok++;
}

console.log(`\nDone: ${ok} minified${skipped ? `, ${skipped} skipped` : ''}.`);

if (process.exitCode) {
  console.error('\nBuild aborted: one or more inputs failed to minify.');
  process.exit(process.exitCode);
}

const verifyPath = path.join(root, 'scripts', 'verify-no-motion-div.mjs');
if (!fs.existsSync(verifyPath)) {
  console.error('\nBuild aborted: missing scripts/verify-no-motion-div.mjs');
  process.exit(1);
}

const { spawnSync } = await import('child_process');
const r = spawnSync(process.execPath, [verifyPath], { cwd: root, stdio: 'inherit' });
if (r.status !== 0) {
  console.error('\nBuild aborted: modal markup verification failed (exit ' + r.status + ').');
  process.exit(r.status ?? 1);
}
