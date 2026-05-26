/**
 * Premium 1200×630 social preview — gold NV monogram, bilingual taglines.
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
const BG = '#FFFFFF';

const KA_LINE = 'თანამედროვე ხელოვნება · ქართველი მხატვრები · ორიგინალური ნახატები';
const EN_LINE = 'Contemporary Art · Georgian Artists · Original Paintings · Collectible Artworks';
const DOMAIN = 'ninartvision.store';

const FONT_STACK = 'FiraGO, Segoe UI, Sylfaen, DejaVu Sans, Noto Sans Georgian, sans-serif';
const SERIF_STACK = 'Cormorant Garamond, Sylfaen, Georgia, serif';

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

function buildTextSvg({ logoH, blockTop }) {
  const brandY = blockTop + logoH + 52;
  const accentY = brandY + 28;
  const kaY = accentY + 46;
  const enY = kaY + 44;
  const domainY = enY + 48;
  const lineW = 320;
  const lineX1 = CX - lineW / 2;
  const lineX2 = CX + lineW / 2;

  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#E8D5A8" stop-opacity="0"/>
      <stop offset="20%" stop-color="#C9A962"/>
      <stop offset="50%" stop-color="#B8924A"/>
      <stop offset="80%" stop-color="#C9A962"/>
      <stop offset="100%" stop-color="#E8D5A8" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="goldText" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#C9A962"/>
      <stop offset="50%" stop-color="#B8924A"/>
      <stop offset="100%" stop-color="#96742E"/>
    </linearGradient>
    <radialGradient id="bgGlow" cx="50%" cy="42%" r="55%">
      <stop offset="0%" stop-color="#FAF6EF" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="${BG}"/>
  <rect width="${W}" height="${H}" fill="url(#bgGlow)"/>
  <text x="${CX}" y="${brandY}" text-anchor="middle" font-family='${SERIF_STACK}' font-size="32" font-weight="600" fill="#1A1514" letter-spacing="0.08em">Ninart Vision</text>
  <line x1="${lineX1}" y1="${accentY}" x2="${lineX2}" y2="${accentY}" stroke="url(#gold)" stroke-width="1.5" stroke-linecap="round"/>
  <text x="${CX}" y="${kaY}" text-anchor="middle" font-family='${FONT_STACK}' font-size="24" font-weight="600" fill="#2A2620" letter-spacing="0.015em">${escapeXml(KA_LINE)}</text>
  <line x1="${lineX1 + 40}" y1="${kaY + 18}" x2="${lineX2 - 40}" y2="${kaY + 18}" stroke="#EDE6DA" stroke-width="0.75"/>
  <text x="${CX}" y="${enY}" text-anchor="middle" font-family='${SERIF_STACK}' font-size="17" font-weight="500" fill="#6B635A" letter-spacing="0.05em">${escapeXml(EN_LINE)}</text>
  <text x="${CX}" y="${domainY}" text-anchor="middle" font-family='${SERIF_STACK}' font-size="14" font-weight="500" fill="url(#goldText)" letter-spacing="0.22em">${DOMAIN.toUpperCase()}</text>
</svg>`);
}

async function main() {
  const logoSize = 148;
  const logoMeta = await sharp(LOGO).metadata();
  const logoW = logoSize;
  const logoH = Math.round((logoMeta.height / logoMeta.width) * logoSize);

  const logoBuf = await sharp(LOGO)
    .resize(logoW, logoH, { fit: 'inside' })
    .png()
    .toBuffer();

  const textBlockH = logoH + 52 + 28 + 46 + 44 + 48 + 20;
  const blockTop = Math.round(SAFE.y + (SAFE.h - textBlockH) / 2);
  const logoLeft = Math.round(CX - logoW / 2);
  const logoTop = blockTop;

  const textSvg = buildTextSvg({ logoH, blockTop });
  const base = await sharp(textSvg).png().toBuffer();

  const png = await sharp(base)
    .composite([{ input: logoBuf, left: logoLeft, top: logoTop }])
    .png({ compressionLevel: 9, adaptiveFiltering: true, effort: 10 })
    .toBuffer();

  await sharp(png).toFile(OUT_PNG);
  await sharp(png).webp({ quality: 90, effort: 6, smartSubsample: true }).toFile(OUT_WEBP);

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
