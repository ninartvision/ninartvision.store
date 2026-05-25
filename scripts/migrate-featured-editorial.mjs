/**
 * Apply Svaneti-style featured project editorial layout to all homepage featured projects.
 * Preserves each file's <head> meta (products) and header/menu markup.
 *
 * Usage: node scripts/migrate-featured-editorial.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const CACHE = 'nv20260626';

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function galleryImg(item) {
  const src = item.src;
  const full = item.dataFull || src;
  const alt = esc(item.alt || '');
  const df = full !== src ? ` data-full="${esc(full)}"` : '';
  return `        <img${df} decoding="async" loading="lazy" src="${esc(src)}" alt="${alt}">`;
}

function buildMain(p) {
  const slug = p.slug;
  const purchase =
    p.price != null
      ? `
    <aside class="fp-purchase" data-art-reveal aria-label="შეძენა და გაზიარება">
      <p class="fp-purchase__price">₾${esc(String(p.price))}</p>
      ${p.sold ? '<p class="fp-purchase__status">Sold</p>' : ''}
      <button type="button" class="fp-purchase__btn" id="shareBtn" data-share-url="${esc(p.shareUrl)}" data-share-title="${esc(p.shareTitle)}">გაზიარება</button>
      <p id="shareMsg" class="fp-purchase__msg" style="display:none;">ბმული კოპირებულია</p>
    </aside>`
      : '';

  const mainAttrs = p.mainFetch
    ? ' fetchpriority="high" loading="eager"'
    : ' decoding="async" loading="lazy"';

  const gallery = (p.gallery || []).map(galleryImg).join('\n');

  return `<main class="fp-project">
  <div class="fp-project__ambient" aria-hidden="true"></div>

  <div class="fp-project__wrap">
    <header class="fp-hero" data-art-reveal>
      <p class="fp-hero__label">Featured Project</p>
      <h1 class="fp-hero__title">${esc(p.title)}</h1>
      <div class="fp-hero__divider" aria-hidden="true"></div>
      <p class="fp-hero__intro">${esc(p.intro)}</p>
    </header>

    <div class="fp-split" data-art-reveal>
      <div class="fp-split__copy">
        <div class="fp-accordion" id="${slug}Accordion">
          <div class="fp-accordion__item is-open" data-accordion-item>
            <button type="button" class="fp-accordion__trigger" aria-expanded="true" aria-controls="${slug}-ka-panel" id="${slug}-ka-trigger">
              <span>
                <span class="fp-accordion__trigger-label">აღწერა</span>
                <span class="fp-accordion__trigger-hint">ქართული</span>
              </span>
              <span class="fp-accordion__arrow" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </span>
            </button>
            <div class="fp-accordion__panel" id="${slug}-ka-panel" role="region" aria-labelledby="${slug}-ka-trigger">
              <div class="fp-accordion__panel-inner">
                <div class="fp-accordion__body">
                  <p>${esc(p.bodyKa)}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="fp-accordion__item" data-accordion-item>
            <button type="button" class="fp-accordion__trigger" aria-expanded="false" aria-controls="${slug}-en-panel" id="${slug}-en-trigger">
              <span>
                <span class="fp-accordion__trigger-label">Description</span>
                <span class="fp-accordion__trigger-hint">English</span>
              </span>
              <span class="fp-accordion__arrow" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </span>
            </button>
            <div class="fp-accordion__panel" id="${slug}-en-panel" role="region" aria-labelledby="${slug}-en-trigger" hidden>
              <div class="fp-accordion__panel-inner">
                <div class="fp-accordion__body" lang="en">
                  <p>${esc(p.bodyEn)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <figure class="fp-split__frame art-project__feature">
        <div class="fp-frame-wrap">
          <div class="fp-frame">
            <img id="mainImg"
                 src="${esc(p.mainImage)}"
                 alt="${esc(p.mainAlt)}"
                 decoding="async"${mainAttrs}${p.mainDataFull ? ` data-full="${esc(p.mainDataFull)}"` : ''}>
          </div>
        </div>
      </figure>
    </div>

    <div class="fp-specs" data-art-reveal aria-label="Artwork details">
      <div class="fp-specs__col">
        <span class="fp-specs__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M12 3v18"/><path d="M8 7l4-4 4 4"/><path d="M8 17h8"/></svg>
        </span>
        <p class="fp-specs__label">Medium</p>
        <p class="fp-specs__value">${esc(p.medium)}</p>
      </div>
      <div class="fp-specs__col">
        <span class="fp-specs__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="12" rx="1"/><path d="M8 10h8M8 14h5"/></svg>
        </span>
        <p class="fp-specs__label">Size</p>
        <p class="fp-specs__value">${esc(p.size)}</p>
      </div>
      <div class="fp-specs__col">
        <span class="fp-specs__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
        </span>
        <p class="fp-specs__label">Year</p>
        <p class="fp-specs__value">${esc(p.year)}</p>
      </div>
      <div class="fp-specs__col">
        <span class="fp-specs__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
        </span>
        <p class="fp-specs__label">Category</p>
        <p class="fp-specs__value">${esc(p.category)}</p>
      </div>
    </div>
${purchase}

    <section class="fp-gallery art-project__gallery" data-art-reveal aria-labelledby="${slug}GalleryTitle">
      <h2 id="${slug}GalleryTitle" class="fp-gallery__title">More photos</h2>
      <div class="art-gallery__grid">
${gallery}
      </div>
    </section>

    <a class="fp-back" href="${esc(p.backHref)}">${esc(p.backLabel)}</a>
  </div>
</main>`;
}

function tailScripts(assetPrefix) {
  const p = assetPrefix;
  return `
<div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-hidden="true">
  <span class="close" id="lightboxClose" aria-label="Close lightbox">&times;</span>
  <img class="lightbox-img" id="lightboxImg" src="" alt="Enlarged view" decoding="async" loading="lazy">
</div>

<script defer src="${p}js/project-detail-lightbox.min.js?v=${CACHE}"></script>
<script defer src="${p}js/featured-project-page.min.js?v=${CACHE}"></script>
<script defer src="${p}script.min.js?v=${CACHE}"></script>
</body>
</html>`;
}

function injectHead(html, assetPrefix) {
  let out = html;
  if (!/class="[^"]*page-art-project/.test(out)) {
    out = out.replace(/<body(\s[^>]*)?>/i, function (m, attrs) {
      const a = attrs || '';
      if (/class="/i.test(a)) {
        return '<body' + a.replace(/class="/, 'class="page-art-project ') + '>';
      }
      return '<body class="page-art-project"' + a + '>';
    });
  }

  const stylePath = `${assetPrefix}css/project-featured-editorial.css?v=${CACHE}`;
  out = out.replace(/\s*<link[^>]*project-svaneti-editorial[^>]*>\s*/gi, '\n');
  if (!out.includes('project-featured-editorial.css')) {
    out = out.replace(
      /(<link rel="stylesheet" href="[^"]*style\.min\.css[^"]*"[^>]*>)/i,
      `$1\n  <link rel="stylesheet" href="${stylePath}" />`
    );
  } else {
    out = out.replace(/project-featured-editorial\.css\?v=[^"]+/, `project-featured-editorial.css?v=${CACHE}`);
  }

  if (!out.includes('Cormorant+Garamond')) {
    const fonts = `  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preload" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=FiraGO:wght@400;600;700&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=FiraGO:wght@400;600;700&display=swap"></noscript>`;
    out = out.replace(/<\/head>/i, `${fonts}\n</head>`);
  }

  out = out.replace(/style\.min\.css\?v=[^"]+/g, `style.min.css?v=${CACHE}`);
  return out;
}

function migrateFile(relPath, project) {
  const filePath = path.join(root, relPath);
  let html = fs.readFileSync(filePath, 'utf8');
  const assetPrefix = project.assetPrefix;

  const mainStart = html.search(/<main[\s>]/i);
  const bodyEnd = html.lastIndexOf('</html>');
  if (mainStart < 0) {
    console.warn('Skip (no <main>):', relPath);
    return;
  }

  const beforeMain = html.slice(0, mainStart);
  const main = buildMain(project);
  const tail = tailScripts(assetPrefix);

  html = injectHead(beforeMain, assetPrefix) + main + tail;
  fs.writeFileSync(filePath, html, 'utf8');
  console.log('✓', relPath);
}

const PROJECTS = [
  {
    file: 'products/svaneti-svaneti/index.html',
    assetPrefix: '../../',
    slug: 'svaneti',
    title: 'Svaneti – სვანეთი',
    intro: 'თოვლიანი მწვერვები, უძველესი კოშკები და მდინარე — სვანეთის ხმაურიანი პეიზაჟი',
    bodyKa:
      'ეს ნამუშევარი მიგიყვანთ საქართველოს ერთ-ერთ ყველაზე შთამოგონებისმომგვრელ კუთხეში — სვანეთში, სადაც თოვლიანი მთები ჰორიზონტს რბილად ეხურება, ხოლო სვანური კოშკები დროისა და სიმტკიცის უხვრელ სიმბოლოებად რჩება. მდინარე კომპოზიციას ჰაეროვნებს, ხაზს უსვამს სიღრმეს და მთის სიჩუმის პოეტურ რიტმს. ფერთა გადასვლები და ნაზი სინათლე ქმნის თბილ, თანამედროვე ატმოსფეროს — ისეთს, რომელიც სივრცეში არა მხოლოდ პეიზაჟს, არამედ სიმშვიდეს, სილამაზესა და ძალის განცდას მოიტანს.',
    bodyEn:
      "This painting invites you into one of Georgia's most breathtaking regions — Svaneti, where snow-covered mountains soften the horizon and ancient Svan towers stand as quiet symbols of endurance and time. A winding river breathes movement into the composition, guiding the eye through depth, silence, and the poetic rhythm of the highlands. Gentle light and layered tones create a warm, contemporary atmosphere — a piece that brings not only landscape into a room, but a sense of calm, beauty, and enduring strength.",
    mainImage:
      'https://cdn.sanity.io/images/8t5h923j/production/5e093ded70cfb080c931f89579e62e8697eac0f6-1500x1125.jpg?auto=format&w=1200&q=85',
    mainDataFull:
      'https://cdn.sanity.io/images/8t5h923j/production/5e093ded70cfb080c931f89579e62e8697eac0f6-1500x1125.jpg?auto=format&w=1600&q=90',
    mainAlt: 'Svaneti — original acrylic painting by Nini Mzhavia',
    mainFetch: true,
    medium: 'Acrylic on canvas',
    size: '60 × 70 cm',
    year: '2026',
    category: 'Landscape',
    price: 300,
    sold: true,
    shareUrl: 'https://ninartvision.store/products/svaneti-svaneti/',
    shareTitle: 'Svaneti – სვანეთი',
    backHref: '../../sale/shop.html',
    backLabel: '← მაღაზიაში დაბრუნება',
    gallery: [
      { src: 'https://cdn.sanity.io/images/8t5h923j/production/52723bb45fb390dc3f19e739c84f64ad085d7034-2729x3639.jpg?auto=format&w=800&q=80', dataFull: 'https://cdn.sanity.io/images/8t5h923j/production/52723bb45fb390dc3f19e739c84f64ad085d7034-2729x3639.jpg?auto=format&w=1600&q=90', alt: 'Svaneti detail 2' },
      { src: 'https://cdn.sanity.io/images/8t5h923j/production/182655c3a0f538598f6d9512277d4ac553ca57ad-4032x3024.jpg?auto=format&w=800&q=80', dataFull: 'https://cdn.sanity.io/images/8t5h923j/production/182655c3a0f538598f6d9512277d4ac553ca57ad-4032x3024.jpg?auto=format&w=1600&q=90', alt: 'Svaneti detail 3' },
      { src: 'https://cdn.sanity.io/images/8t5h923j/production/5a5f6a69b24b11aaa9621c267ec6abfd384fe156-4032x3024.jpg?auto=format&w=800&q=80', dataFull: 'https://cdn.sanity.io/images/8t5h923j/production/5a5f6a69b24b11aaa9621c267ec6abfd384fe156-4032x3024.jpg?auto=format&w=1600&q=90', alt: 'Svaneti detail 4' },
      { src: 'https://cdn.sanity.io/images/8t5h923j/production/a4a23c64b82ca4bb4ec343879719570170d7190a-3024x4032.jpg?auto=format&w=800&q=80', dataFull: 'https://cdn.sanity.io/images/8t5h923j/production/a4a23c64b82ca4bb4ec343879719570170d7190a-3024x4032.jpg?auto=format&w=1600&q=90', alt: 'Svaneti detail 5' },
      { src: 'https://cdn.sanity.io/images/8t5h923j/production/4a3f44d10073059a8f20cabf0cf356583ba6cdc9-3024x4032.jpg?auto=format&w=800&q=80', dataFull: 'https://cdn.sanity.io/images/8t5h923j/production/4a3f44d10073059a8f20cabf0cf356583ba6cdc9-3024x4032.jpg?auto=format&w=1600&q=90', alt: 'Svaneti detail 6' },
      { src: 'https://cdn.sanity.io/images/8t5h923j/production/e75b5a8213b50196a5627033533108e15cd05f5b-3024x4032.jpg?auto=format&w=800&q=80', dataFull: 'https://cdn.sanity.io/images/8t5h923j/production/e75b5a8213b50196a5627033533108e15cd05f5b-3024x4032.jpg?auto=format&w=1600&q=90', alt: 'Svaneti detail 7' },
      { src: 'https://cdn.sanity.io/images/8t5h923j/production/0f80bb91cdbecc62dac7b965bd8579c2d1980bd3-1500x2000.jpg?auto=format&w=800&q=80', dataFull: 'https://cdn.sanity.io/images/8t5h923j/production/0f80bb91cdbecc62dac7b965bd8579c2d1980bd3-1500x2000.jpg?auto=format&w=1600&q=90', alt: 'Svaneti detail 8' },
      { src: 'https://cdn.sanity.io/images/8t5h923j/production/8fb44011728287677d99cc097c7a044ded44970f-1500x2000.jpg?auto=format&w=800&q=80', dataFull: 'https://cdn.sanity.io/images/8t5h923j/production/8fb44011728287677d99cc097c7a044ded44970f-1500x2000.jpg?auto=format&w=1600&q=90', alt: 'Svaneti detail 9' },
      { src: 'https://cdn.sanity.io/images/8t5h923j/production/92d382c8bd335e9adc2f6131dd40e6fae342a3b8-1500x2000.jpg?auto=format&w=800&q=80', dataFull: 'https://cdn.sanity.io/images/8t5h923j/production/92d382c8bd335e9adc2f6131dd40e6fae342a3b8-1500x2000.jpg?auto=format&w=1600&q=90', alt: 'Svaneti detail 10' },
    ],
  },
  {
    file: 'products/silent-bloom/index.html',
    assetPrefix: '../../',
    slug: 'silent-bloom',
    title: 'Silent Bloom – ჩუმი ყვავილობა',
    intro: 'Delicate dandelion textures capturing lightness and freedom.',
    bodyKa: 'ნაზი ბანკის ტექსტურები, რომლებიც სიმსუბუქესა და თავისუფლებას გადმოსცემს. თბილი პასტელური ტონები და ჰაეროვანი კომპოზიცია ქმნის მშვიდ, თანამედროვე ატმოსფეროს.',
    bodyEn:
      'Delicate dandelion textures capturing lightness and freedom. Warm pastel tones and an airy composition create a calm, contemporary atmosphere — a piece that brings softness and quiet beauty into any interior.',
    mainImage:
      'https://cdn.sanity.io/images/8t5h923j/production/e8f86d53b5f971f374692feb0d400cb729262dd0-1500x2000.jpg?auto=format&w=1200&q=85',
    mainDataFull:
      'https://cdn.sanity.io/images/8t5h923j/production/e8f86d53b5f971f374692feb0d400cb729262dd0-1500x2000.jpg?auto=format&w=1600&q=90',
    mainAlt: 'Silent Bloom — original acrylic painting by Nini Mzhavia',
    mainFetch: true,
    medium: 'Acrylic on canvas',
    size: '60 × 80 cm',
    year: '2025',
    category: 'Floral',
    price: 350,
    sold: true,
    shareUrl: 'https://ninartvision.store/products/silent-bloom/',
    shareTitle: 'Silent Bloom – ჩუმი ყვავილობა',
    backHref: '../../sale/shop.html',
    backLabel: '← მაღაზიაში დაბრუნება',
    gallery: [
      { src: 'https://cdn.sanity.io/images/8t5h923j/production/528235f402a1226a0ab1b01d3be01b2c92e22876-3024x3158.jpg?auto=format&w=800&q=80', dataFull: 'https://cdn.sanity.io/images/8t5h923j/production/528235f402a1226a0ab1b01d3be01b2c92e22876-3024x3158.jpg?auto=format&w=1600&q=90', alt: 'Silent Bloom detail 2' },
      { src: 'https://cdn.sanity.io/images/8t5h923j/production/9271ed94eecd8540f84bcac2d177be8e1604a8e8-2764x3722.jpg?auto=format&w=800&q=80', dataFull: 'https://cdn.sanity.io/images/8t5h923j/production/9271ed94eecd8540f84bcac2d177be8e1604a8e8-2764x3722.jpg?auto=format&w=1600&q=90', alt: 'Silent Bloom detail 3' },
      { src: 'https://cdn.sanity.io/images/8t5h923j/production/d59c78be3467b5e4cf86138c37d3238351c93ae5-1152x2048.jpg?auto=format&w=800&q=80', dataFull: 'https://cdn.sanity.io/images/8t5h923j/production/d59c78be3467b5e4cf86138c37d3238351c93ae5-1152x2048.jpg?auto=format&w=1600&q=90', alt: 'Silent Bloom detail 4' },
      { src: 'https://cdn.sanity.io/images/8t5h923j/production/8dd23b81b158a6bfd4b286084da5facdab7f5fb1-1500x2000.jpg?auto=format&w=800&q=80', dataFull: 'https://cdn.sanity.io/images/8t5h923j/production/8dd23b81b158a6bfd4b286084da5facdab7f5fb1-1500x2000.jpg?auto=format&w=1600&q=90', alt: 'Silent Bloom detail 5' },
      { src: 'https://cdn.sanity.io/images/8t5h923j/production/fe64c278663251dc9ca6c63d31d5a0b57aa173a7-1500x2000.jpg?auto=format&w=800&q=80', dataFull: 'https://cdn.sanity.io/images/8t5h923j/production/fe64c278663251dc9ca6c63d31d5a0b57aa173a7-1500x2000.jpg?auto=format&w=1600&q=90', alt: 'Silent Bloom detail 6' },
      { src: 'https://cdn.sanity.io/images/8t5h923j/production/6193fd0365a8aaf33c3bd097dd40855806d8eb97-1500x2000.jpg?auto=format&w=800&q=80', dataFull: 'https://cdn.sanity.io/images/8t5h923j/production/6193fd0365a8aaf33c3bd097dd40855806d8eb97-1500x2000.jpg?auto=format&w=1600&q=90', alt: 'Silent Bloom detail 7' },
    ],
  },
  {
    file: 'products/magical-world/index.html',
    assetPrefix: '../../',
    slug: 'magical-world',
    title: 'Magical World – ზღაპრული სამყარო',
    intro: 'A dreamlike world of golden light, harmony, and nature.',
    bodyKa: 'ოქროსფერი სინათლის, ჰარმონიისა და ბუნების ზღაპრული სამყარო — თბილი ტონები და ფენობრივი სიღრმე ქმნის მშვიდ, ემოციურ ატმოსფეროს.',
    bodyEn:
      'A dreamlike world of golden light, harmony, and nature. Layered tones and gentle depth create a calm, emotionally rich atmosphere — a piece that brings warmth and imagination into contemporary interiors.',
    mainImage:
      'https://cdn.sanity.io/images/8t5h923j/production/a8107fd83a53abd5bc1e95d8839a5a1c1ed0f619-1500x1125.jpg?auto=format&w=1200&q=85',
    mainDataFull:
      'https://cdn.sanity.io/images/8t5h923j/production/a8107fd83a53abd5bc1e95d8839a5a1c1ed0f619-1500x1125.jpg?auto=format&w=1600&q=90',
    mainAlt: 'Magical World — original acrylic painting by Nini Mzhavia',
    mainFetch: true,
    medium: 'Acrylic on canvas',
    size: '80 × 100 cm',
    year: '2025',
    category: 'Fantasy',
    price: 500,
    sold: true,
    shareUrl: 'https://ninartvision.store/products/magical-world/',
    shareTitle: 'Magical World – ზღაპრული სამყარო',
    backHref: '../../sale/shop.html',
    backLabel: '← მაღაზიაში დაბრუნება',
    gallery: [
      { src: 'https://cdn.sanity.io/images/8t5h923j/production/85e565e5294425a3d964de9628c2168fb610361e-3024x4032.jpg?auto=format&w=800&q=80', dataFull: 'https://cdn.sanity.io/images/8t5h923j/production/85e565e5294425a3d964de9628c2168fb610361e-3024x4032.jpg?auto=format&w=1600&q=90', alt: 'Magical World detail 2' },
      { src: 'https://cdn.sanity.io/images/8t5h923j/production/1823f543edc58edf15bf2026a406eb1ba6b57484-3024x4032.jpg?auto=format&w=800&q=80', dataFull: 'https://cdn.sanity.io/images/8t5h923j/production/1823f543edc58edf15bf2026a406eb1ba6b57484-3024x4032.jpg?auto=format&w=1600&q=90', alt: 'Magical World detail 3' },
      { src: 'https://cdn.sanity.io/images/8t5h923j/production/0495de2b903aaf1b4e10d3dd18a51dc62ed74900-3024x4032.jpg?auto=format&w=800&q=80', dataFull: 'https://cdn.sanity.io/images/8t5h923j/production/0495de2b903aaf1b4e10d3dd18a51dc62ed74900-3024x4032.jpg?auto=format&w=1600&q=90', alt: 'Magical World detail 4' },
      { src: 'https://cdn.sanity.io/images/8t5h923j/production/c91742c596494f97a82aa816e7ca4980f448f83a-3024x4032.jpg?auto=format&w=800&q=80', dataFull: 'https://cdn.sanity.io/images/8t5h923j/production/c91742c596494f97a82aa816e7ca4980f448f83a-3024x4032.jpg?auto=format&w=1600&q=90', alt: 'Magical World detail 5' },
      { src: 'https://cdn.sanity.io/images/8t5h923j/production/d54daa49b0de85c714e8d7edf219f1084b85c65b-3024x4032.jpg?auto=format&w=800&q=80', dataFull: 'https://cdn.sanity.io/images/8t5h923j/production/d54daa49b0de85c714e8d7edf219f1084b85c65b-3024x4032.jpg?auto=format&w=1600&q=90', alt: 'Magical World detail 6' },
      { src: 'https://cdn.sanity.io/images/8t5h923j/production/83a8618eba15078d8a8183c624d2bebac75283dc-3024x4032.jpg?auto=format&w=800&q=80', dataFull: 'https://cdn.sanity.io/images/8t5h923j/production/83a8618eba15078d8a8183c624d2bebac75283dc-3024x4032.jpg?auto=format&w=1600&q=90', alt: 'Magical World detail 7' },
      { src: 'https://cdn.sanity.io/images/8t5h923j/production/aa780523d416cb35328be7076346e849685391ba-1151x1535.jpg?auto=format&w=800&q=80', dataFull: 'https://cdn.sanity.io/images/8t5h923j/production/aa780523d416cb35328be7076346e849685391ba-1151x1535.jpg?auto=format&w=1600&q=90', alt: 'Magical World detail 8' },
    ],
  },
  {
    file: 'products/the-way-to-the-monastery/index.html',
    assetPrefix: '../../',
    slug: 'monastery',
    title: 'The Way to the Monastery',
    intro: 'Layered acrylics capturing depth and perspective in Georgian landscapes.',
    bodyKa: 'ფენობრივი აკრილები, რომლებიც ქართული პეიზაჟის სიღრმესა და პერსპექტივას ასახავს — მშვიდი ხაზები და თბილი ტონები ქმნის პოეტურ, თანამედროვე ატმოსფეროს.',
    bodyEn:
      'Layered acrylics capturing depth and perspective in Georgian landscapes. Quiet lines and warm tones create a poetic, contemporary atmosphere — a piece that brings calm and cultural resonance into the room.',
    mainImage:
      'https://cdn.sanity.io/images/8t5h923j/production/122cd7e652d5e0bcc984a659f7f412125e823f62-1500x1125.jpg?auto=format&w=1200&q=85',
    mainDataFull:
      'https://cdn.sanity.io/images/8t5h923j/production/122cd7e652d5e0bcc984a659f7f412125e823f62-1500x1125.jpg?auto=format&w=1600&q=90',
    mainAlt: 'The Way to the Monastery — original acrylic painting by Nini Mzhavia',
    mainFetch: true,
    medium: 'Acrylic on canvas',
    size: '30 × 40 cm',
    year: '2025',
    category: 'Landscape',
    price: 300,
    sold: true,
    shareUrl: 'https://ninartvision.store/products/the-way-to-the-monastery/',
    shareTitle: 'The Way to the Monastery',
    backHref: '../../sale/shop.html',
    backLabel: '← მაღაზიაში დაბრუნება',
    gallery: [
      { src: 'https://cdn.sanity.io/images/8t5h923j/production/65123e72b0113105dced4feb13bc769e2228c497-3024x4032.jpg?auto=format&w=800&q=80', dataFull: 'https://cdn.sanity.io/images/8t5h923j/production/65123e72b0113105dced4feb13bc769e2228c497-3024x4032.jpg?auto=format&w=1600&q=90', alt: 'The Way to the Monastery detail 2' },
      { src: 'https://cdn.sanity.io/images/8t5h923j/production/a4f745b8a5d751934ad148be56e295a454f76a77-3024x4032.jpg?auto=format&w=800&q=80', dataFull: 'https://cdn.sanity.io/images/8t5h923j/production/a4f745b8a5d751934ad148be56e295a454f76a77-3024x4032.jpg?auto=format&w=1600&q=90', alt: 'The Way to the Monastery detail 3' },
      { src: 'https://cdn.sanity.io/images/8t5h923j/production/84778ae10b2b9046b012a5e2e3eae97a5bdcb762-1500x2000.jpg?auto=format&w=800&q=80', dataFull: 'https://cdn.sanity.io/images/8t5h923j/production/84778ae10b2b9046b012a5e2e3eae97a5bdcb762-1500x2000.jpg?auto=format&w=1600&q=90', alt: 'The Way to the Monastery detail 4' },
      { src: 'https://cdn.sanity.io/images/8t5h923j/production/eafebadf052538559822440d1897528999bb4b7e-1500x2000.jpg?auto=format&w=800&q=80', dataFull: 'https://cdn.sanity.io/images/8t5h923j/production/eafebadf052538559822440d1897528999bb4b7e-1500x2000.jpg?auto=format&w=1600&q=90', alt: 'The Way to the Monastery detail 5' },
    ],
  },
  {
    file: 'project3.html',
    assetPrefix: './',
    slug: 'roseslover',
    title: 'Roseslover',
    intro: 'A tender rose composition in warm pastel tones and romantic elegance.',
    bodyKa:
      'ეს ნამუშევარი ასახავს ვარდების ნაზ კომპოზიციას, სადაც სამი გაშლილი ყვავილი და კვირტები ბუნებრივ ჰარმონიას ქმნის. თბილი პასტელური ტონები კომპოზიციას სინაზესა და სინათლის ეფექტს მატებს. რბილი, გადამავალი ფონური ფერები აძლიერებს სიმშვიდის განცდას და უსვამს ხაზს ყვავილების ელეგანტურობას. ეს ნახატი იდეალურად ერგება თანამედროვე და რომანტიკულ ინტერიერს, სადაც ბუნებრივი დეტალები სივრცეს სითბოს მატებს.',
    bodyEn:
      'This artwork presents a delicate rose composition, where three blooming flowers and gentle buds create a natural sense of harmony. Warm pastel tones add softness and a subtle glow to the overall piece. The smoothly blended background enhances the calm atmosphere and highlights the elegance of the flowers. This painting is a perfect fit for modern and romantic interiors, bringing warmth and beauty into any space.',
    mainImage: './images/me6.webp',
    mainAlt: 'Roseslover original acrylic painting by Nini Mzhavia',
    medium: 'Acrylic on canvas',
    size: '40 × 50 cm',
    year: '2025',
    category: 'Floral',
    backHref: 'index.html',
    backLabel: '← Back',
    gallery: [
      { src: './images/rose1.webp', alt: 'Roseslover detail' },
      { src: './images/rose2.webp', alt: 'Roseslover detail' },
      { src: './images/rose5.webp', alt: 'Roseslover detail' },
      { src: './images/rose8.webp', alt: 'Roseslover detail' },
      { src: './images/rose3.webp', alt: 'Roseslover detail' },
      { src: './images/rose4.webp', alt: 'Roseslover detail' },
      { src: './images/rose9.webp', alt: 'Roseslover detail' },
      { src: './images/rose11.webp', alt: 'Roseslover detail' },
      { src: './images/rose12.webp', alt: 'Roseslover detail' },
    ],
  },
  {
    file: 'project4.html',
    assetPrefix: './',
    slug: 'origin',
    title: 'The Origin of Nature – ბუნების საწყისი',
    intro: 'An abstract exploration of nature’s awakening energy and depth.',
    bodyKa:
      'ბუნების საწყისი — აბსტრაქტული კომპოზიციაა, სადაც ცივი ცისფერი და მწვანე ტონები ოქროსფერ აქცენტებთან ერთად ბუნების გაღვიძებისა და ენერგიის განცდას ქმნის. ტექსტურული ფენები და თავისუფალი ხაზები მოძრაობას და სივრცის სიღრმეს უსვამს ხაზს, ქმნის მშვიდ, მაგრამ ძლიერ ემოციურ ატმოსფეროს.',
    bodyEn:
      'The Origin of Nature is an abstract composition where cool blue and green tones meet golden accents, evoking the awakening energy of nature. Layered textures and free-flowing lines create depth and movement, forming a calm yet emotionally powerful atmosphere.',
    mainImage: './images/me5.webp',
    mainAlt: 'The Origin of Nature original acrylic painting by Nini Mzhavia',
    medium: 'Acrylic on canvas',
    size: '40 × 50 cm',
    year: '2025',
    category: 'Abstract',
    backHref: 'index.html',
    backLabel: '← Back',
    gallery: [
      { src: './images/abstract3.webp', alt: 'The Origin of Nature detail' },
      { src: './images/abstract6.webp', alt: 'The Origin of Nature detail' },
      { src: './images/abstract7.webp', alt: 'The Origin of Nature detail' },
      { src: './images/abstract9.webp', alt: 'The Origin of Nature detail' },
      { src: './images/abstract10.webp', alt: 'The Origin of Nature detail' },
      { src: './images/abstract8.webp', alt: 'The Origin of Nature detail' },
      { src: './images/abstract1.webp', alt: 'The Origin of Nature detail' },
      { src: './images/abstract2.webp', alt: 'The Origin of Nature detail' },
      { src: './images/abstract4.webp', alt: 'The Origin of Nature detail' },
    ],
  },
  {
    file: 'project7.html',
    assetPrefix: './',
    slug: 'amber',
    title: 'Amber Glow – ქარვისფერი ნათება',
    intro: 'A vibrant sunset seascape filled with warmth and freedom.',
    bodyKa: 'ნამუშევარი ასახავს ზღვის ჰორიზონტს მზის ჩასვლისას, სადაც თბილი ოქროსფერი სხივები წყლის ზედაპირზე ირეკლება.',
    bodyEn:
      'This artwork captures the sea horizon at sunset, where warm golden light reflects across the water and fills the space with a luminous glow. The composition is built through energetic brushstrokes, giving the waves movement and a vivid rhythm. Cool blue and turquoise tones blend harmoniously with warm orange and rosy shades in the sky, creating an emotional contrast and a strong sense of depth. The painting conveys a feeling of freedom and serenity.',
    mainImage: './images/me7.webp',
    mainAlt: 'Amber Glow original acrylic painting by Nini Mzhavia',
    medium: 'Acrylic on canvas',
    size: '60 × 80 cm',
    year: '2025',
    category: 'Seascape',
    backHref: 'index.html',
    backLabel: '← Back',
    gallery: [
      { src: './images/seaorange8.webp', alt: 'Amber Glow detail' },
      { src: './images/seaorange6.webp', alt: 'Amber Glow detail' },
      { src: './images/seaorange3.webp', alt: 'Amber Glow detail' },
      { src: './images/seaorange4.webp', alt: 'Amber Glow detail' },
      { src: './images/seaorange2.webp', alt: 'Amber Glow detail' },
      { src: './images/seaorange1.webp', alt: 'Amber Glow detail' },
      { src: './images/seaorange7.webp', alt: 'Amber Glow detail' },
      { src: './images/seaorange5.webp', alt: 'Amber Glow detail' },
    ],
  },
];

for (const p of PROJECTS) {
  migrateFile(p.file, p);
}

console.log('\nDone. Cache:', CACHE);
