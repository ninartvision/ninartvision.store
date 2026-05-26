/**
 * Luxury 1200×630 social preview — gold NV monogram focal point, English-only copy.
 * Safe-zone layout keeps content centered for mobile square crops.
 *
 * Usage: npm run generate:og-image
 */
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT_PNG = path.join(ROOT, 'images/og-image.png');
const OUT_WEBP = path.join(ROOT, 'images/og-image.webp');
const LOGO = path.join(ROOT, 'images/favicon.webp');

const W = 1200;
const H = 630;

const TITLE = 'Ninart Vision';
const SUBTITLE = 'Original Contemporary Art by Georgian Artists';
const DOMAIN = 'NINARTVISION.STORE';

const SERIF_STACK = 'Cormorant Garamond, Didot, Playfair Display, Georgia, serif';
const SANS_STACK = 'Helvetica Neue, Arial, sans-serif';

/** Keep all content inside this box for WhatsApp / Telegram square crops. */
const SAFE = { x: 120, y: 80, w: 960, h: 470 };
const CX = W / 2;

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildBackgroundSvg() {
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bgBase" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FAF6F0"/>
      <stop offset="45%" stop-color="#F3EDE4"/>
      <stop offset="100%" stop-color="#EBE3D8"/>
    </linearGradient>
    <radialGradient id="logoGlow" cx="50%" cy="38%" r="42%">
      <stop offset="0%" stop-color="#FFFCF7" stop-opacity="0.95"/>
      <stop offset="55%" stop-color="#F5EFE6" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#F3EDE4" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#E8D5A8" stop-opacity="0"/>
      <stop offset="18%" stop-color="#D4B978"/>
      <stop offset="50%" stop-color="#B8924A"/>
      <stop offset="82%" stop-color="#D4B978"/>
      <stop offset="100%" stop-color="#E8D5A8" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="goldText" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#C9A962"/>
      <stop offset="50%" stop-color="#A8843A"/>
      <stop offset="100%" stop-color="#96742E"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bgBase)"/>
  <rect width="${W}" height="${H}" fill="url(#logoGlow)"/>
</svg>`);
}

function buildTextSvg({ logoH, blockTop }) {
  const titleY = blockTop + logoH + 38;
  const accentY = titleY + 26;
  const subtitleY = accentY + 34;
  const domainY = subtitleY + 46;
  const lineW = 280;
  const lineX1 = CX - lineW / 2;
  const lineX2 = CX + lineW / 2;
  const thinLineW = 48;

  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#E8D5A8" stop-opacity="0"/>
      <stop offset="18%" stop-color="#D4B978"/>
      <stop offset="50%" stop-color="#B8924A"/>
      <stop offset="82%" stop-color="#D4B978"/>
      <stop offset="100%" stop-color="#E8D5A8" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="goldText" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#C9A962"/>
      <stop offset="50%" stop-color="#A8843A"/>
      <stop offset="100%" stop-color="#96742E"/>
    </linearGradient>
  </defs>
  <text x="${CX}" y="${titleY}" text-anchor="middle" font-family='${SERIF_STACK}' font-size="36" font-weight="500" fill="#1C1816" letter-spacing="0.14em">${escapeXml(TITLE)}</text>
  <line x1="${lineX1}" y1="${accentY}" x2="${lineX2}" y2="${accentY}" stroke="url(#gold)" stroke-width="1" stroke-linecap="round"/>
  <line x1="${CX - thinLineW / 2}" y1="${accentY}" x2="${CX + thinLineW / 2}" y2="${accentY}" stroke="#B8924A" stroke-width="1.25" stroke-linecap="round" opacity="0.85"/>
  <text x="${CX}" y="${subtitleY}" text-anchor="middle" font-family='${SERIF_STACK}' font-size="17" font-weight="400" font-style="italic" fill="#7A7268" letter-spacing="0.04em">${escapeXml(SUBTITLE)}</text>
  <text x="${CX}" y="${domainY}" text-anchor="middle" font-family='${SANS_STACK}' font-size="11" font-weight="400" fill="url(#goldText)" letter-spacing="0.32em">${escapeXml(DOMAIN)}</text>
</svg>`);
}

async function createLogoWithShadow(logoW, logoH) {
  const logoBuf = await sharp(LOGO)
    .resize(logoW * 2, logoH * 2, { fit: 'inside', kernel: sharp.kernel.lanczos3 })
    .resize(logoW, logoH, { fit: 'inside', kernel: sharp.kernel.lanczos3 })
    .sharpen({ sigma: 0.6, m1: 0.5, m2: 0.3 })
    .png()
    .toBuffer();

  const pad = 56;
  const canvasW = logoW + pad * 2;
  const canvasH = logoH + pad * 2;
  const logoB64 = logoBuf.toString('base64');

  const logoSvg = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${canvasW}" height="${canvasH}" viewBox="0 0 ${canvasW} ${canvasH}">
  <defs>
    <filter id="logoShadow" x="-35%" y="-35%" width="170%" height="170%" color-interpolation-filters="sRGB">
      <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#8B7355" flood-opacity="0.22"/>
      <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#C4A574" flood-opacity="0.14"/>
    </filter>
  </defs>
  <image x="${pad}" y="${pad}" width="${logoW}" height="${logoH}" xlink:href="data:image/png;base64,${logoB64}" filter="url(#logoShadow)"/>
</svg>`);

  const logoComposite = await sharp(logoSvg).png().toBuffer();

  return { logoComposite, compositeW: canvasW, compositeH: canvasH, logoH };
}

async function main() {
  const logoSize = 360;
  const logoMeta = await sharp(LOGO).metadata();
  const logoW = logoSize;
  const logoH = Math.round((logoMeta.height / logoMeta.width) * logoSize);

  const { logoComposite, compositeW, compositeH } = await createLogoWithShadow(logoW, logoH);

  const textBlockH = compositeH + 38 + 26 + 34 + 46 + 18;
  const blockTop = Math.round(SAFE.y + (SAFE.h - textBlockH) / 2);
  const logoLeft = Math.round(CX - compositeW / 2);
  const logoTop = blockTop;

  const bgSvg = buildBackgroundSvg();
  const textSvg = buildTextSvg({ logoH: compositeH, blockTop });

  const base = await sharp(bgSvg).png().toBuffer();
  const withText = await sharp(base)
    .composite([{ input: textSvg, left: 0, top: 0 }])
    .png()
    .toBuffer();

  const png = await sharp(withText)
    .composite([{ input: logoComposite, left: logoLeft, top: logoTop }])
    .png({ compressionLevel: 9, adaptiveFiltering: true, effort: 10 })
    .toBuffer();

  await sharp(png).toFile(OUT_PNG);
  await sharp(png).webp({ quality: 92, effort: 6, smartSubsample: true }).toFile(OUT_WEBP);

  const stat = await sharp(OUT_PNG).metadata();
  const fs = await import('fs');
  const bytes = fs.statSync(OUT_PNG).size;
  console.log(`✓ og-image.png  ${stat.width}×${stat.height}  ${(bytes / 1024).toFixed(1)} KB  → ${OUT_PNG}`);
  console.log(`✓ og-image.webp  → ${OUT_WEBP}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
