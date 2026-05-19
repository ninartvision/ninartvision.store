/**
 * Bundle nv-gallery-modal.css into style.min.css (no runtime @import).
 * Run from repo root: npm run build:css
 *
 * Prevents FOUC / cleancss "@import after other content" warnings in production.
 * Modal transitions and safe-area rules ship in the first bytes of style.min.css.
 * Pair with npm run build:js (modal JS verifier) before deploy.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const stylePath = path.join(root, 'style.css');
const modalPath = path.join(root, 'css', 'nv-gallery-modal.css');
const cartPath = path.join(root, 'css', 'nv-cart-drawer.css');
const bundledPath = path.join(root, 'style.bundled.css');
const minPath = path.join(root, 'style.min.css');

const modalImportRe = /^@import\s+url\(['"]\.\/css\/nv-gallery-modal\.css['"]\);\s*\n/m;
const cartImportRe = /^@import\s+url\(['"]\.\/css\/nv-cart-drawer\.css['"]\);\s*\n/m;

let style = fs.readFileSync(stylePath, 'utf8');
const modalCss = fs.readFileSync(modalPath, 'utf8');
const cartCss = fs.readFileSync(cartPath, 'utf8');

let prefix = '';
if (modalImportRe.test(style)) {
  style = style.replace(modalImportRe, '');
  prefix += `/* Bundled: css/nv-gallery-modal.css */\n${modalCss}\n\n`;
} else if (!style.includes('nv-gm-space-xs')) {
  prefix += `/* Bundled: css/nv-gallery-modal.css */\n${modalCss}\n\n`;
}
if (cartImportRe.test(style)) {
  style = style.replace(cartImportRe, '');
  prefix += `/* Bundled: css/nv-cart-drawer.css */\n${cartCss}\n\n`;
} else if (!style.includes('nv-cart-drawer__panel')) {
  prefix += `/* Bundled: css/nv-cart-drawer.css */\n${cartCss}\n\n`;
}
if (prefix) style = prefix + style;

fs.writeFileSync(bundledPath, style, 'utf8');
execSync(`npx cleancss -o "${minPath}" "${bundledPath}"`, { cwd: root, stdio: 'inherit' });
fs.unlinkSync(bundledPath);

console.log('✓ style.min.css (modal + cart drawer CSS inlined, no @import)');
