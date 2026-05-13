/**
 * Reproducible JS minification: source .js → .min.js (Terser).
 * Run from repo root: npm run build:js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { minify } from 'terser';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

/** [sourceRelative, outputRelative] — keep in sync with HTML / optimize-html.cjs */
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
  ['artists/artists.js', 'artists/artists.min.js'],
  ['js/editorial-rule.js', 'js/editorial-rule.min.js'],
  ['js/homeArtistsPreview.js', 'js/homeArtistsPreview.min.js'],
  ['js/homeShopPreview.js', 'js/homeShopPreview.min.js'],
  ['js/news-cards.js', 'js/news-cards.min.js'],
  ['js/room-visualizer.js', 'js/room-visualizer.min.js'],
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
    process.exitCode = 1;
    break;
  }
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, result.code || '', 'utf8');
  console.log(`✓ ${relIn} → ${relOut}`);
  ok++;
}

console.log(`\nDone: ${ok} minified${skipped ? `, ${skipped} skipped` : ''}.`);
