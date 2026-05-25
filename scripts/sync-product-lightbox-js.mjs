/**
 * Replace inline lightbox IIFE on product pages with shared project-detail-lightbox.js
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const productsDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'products');
const CSS_VER = 'nv20260615';
const LB_SCRIPT = `<script defer src="../../js/project-detail-lightbox.min.js?v=${CSS_VER}"></script>`;
const LB_RE = /<script>[\s\S]*?function openLightbox\(imgSrc\)[\s\S]*?<\/script>\s*/g;

function patch(html) {
  let out = html;
  out = out.replace(/style\.min\.css\?v=[^"]+/g, `style.min.css?v=${CSS_VER}`);
  out = out.replace(/script\.min\.js\?v=[^"]+/g, `script.min.js?v=${CSS_VER}`);
  out = out.replace(LB_RE, '');
  if (!out.includes('project-detail-lightbox.min.js')) {
    out = out.replace(
      /<script defer src="\.\.\/\.\.\/script\.min\.js[^>]*><\/script>/,
      `${LB_SCRIPT}\n<script defer src="../../script.min.js?v=${CSS_VER}"></script>`
    );
  }
  return out;
}

let n = 0;
for (const name of readdirSync(productsDir)) {
  const idx = join(productsDir, name, 'index.html');
  if (!existsSync(idx)) continue;
  const html = readFileSync(idx, 'utf8');
  if (!html.includes('class="project-page"')) continue;
  const next = patch(html);
  if (next !== html) {
    writeFileSync(idx, next, 'utf8');
    console.log(`  ✓ products/${name}/index.html`);
    n++;
  }
}
console.log(`Done. ${n} updated.`);
