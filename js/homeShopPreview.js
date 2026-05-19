/**
 * Home Shop Preview - Artworks Section
 * Loads shop artworks from Sanity (fetchShopArtworks) and SALE/SOLD tabs.
 */
const fmtPrice = p => { const n = Number(String(p || '').replace(/[^\d.]/g, '')); return n ? '\u20BE' + n.toLocaleString('en-US') : ''; };

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/'/g, '&#39;');
}

function homeNormStatus(raw) {
  if (typeof window.normalizeArtworkListingStatus === 'function') {
    return window.normalizeArtworkListingStatus(raw);
  }
  const s = String(raw == null ? '' : raw).trim().toLowerCase();
  if (s === 'sold') return 'sold';
  if (s === 'sale' || s === 'published') return 'sale';
  return '';
}

/** Same projection as sanity-client fetchShopArtworks — inlined so home works when OLD cached sanity excludes `published`. */
const NV_DIRECT_SHOP_QUERY = `
*[_type == "artwork" && status in ["sale", "sold", "published"] && artist->name == "Nini Mzhavia"]
| order(coalesce(order, 999) asc, _createdAt desc){
  _id,
  title,
  "slug": slug.current,
  shortDescription,
  image{
    asset->{_id, url, metadata{lqip, dimensions}},
    alt
  },
  images[]{
    asset->{_id, url, metadata{lqip, dimensions}},
    alt,
    _key
  },
  year,
  medium,
  dimensions,
  category,
  description,
  price,
  status,
  "seoTitle": seo.seoTitle,
  "seoDescription": seo.seoDescription,
  "keywords": seo.keywords,
  featured,
  "artist": artist->{
    _id,
    name,
    "slug": slug.current
  }
}`;

const NV_EMBEDDED_SANITY = { projectId: '8t5h923j', dataset: 'production', apiVersion: '2025-02-05' };

function nvDistinctNormalizedSalePoolCount(rows) {
  if (!Array.isArray(rows) || !rows.length) return 0;
  const seen = new Set();
  let saleN = 0;
  rows.forEach(a => {
    const id = a && a._id;
    if (!id || seen.has(id)) return;
    seen.add(id);
    if (homeNormStatus(a.status) === 'sale') saleN++;
  });
  return saleN;
}

async function nvDirectFetchPublishedInclusiveShopRows() {
  const cfg = Object.assign({}, NV_EMBEDDED_SANITY, window.SANITY_CONFIG || {});
  try {
    const url = `https://${cfg.projectId}.apicdn.sanity.io/v${cfg.apiVersion}/data/query/${cfg.dataset}?query=${encodeURIComponent(NV_DIRECT_SHOP_QUERY.trim())}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.result || [];
  } catch (e) {
    return null;
  }
}

async function initHomeShopPreview() {
  /** Old cached sanity-client bundles skip this — keep home filters consistent. */
  if (typeof window.normalizeArtworkListingStatus !== 'function') {
    window.normalizeArtworkListingStatus = homeNormStatus;
  }

  const track = document.getElementById('homeShopGrid');
  const buttons = document.querySelectorAll('.preview-btn');
  const section = document.querySelector('.home-shop-preview');

  if (!track) return;

  const carouselRoot = track.closest('[data-home-shop-carousel]');

  let items = [];
  let currentFilter = 'sale';
  let slideIndex = 0;
  let carouselTimer = null;
  let carouselPaused = false;
  const CAROUSEL_MS = 5500;

  function prefersReducedMotion() {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  }

  function getPerSlide() {
    return 3;
  }

  function chunk(arr, size) {
    const out = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  }

  function stopCarousel() {
    if (carouselTimer) {
      clearInterval(carouselTimer);
      carouselTimer = null;
    }
  }

  function getViewportWidth() {
    return track.parentElement?.clientWidth || track.clientWidth;
  }

  function applySlideTransform(pageCount) {
    if (pageCount <= 1) {
      track.style.transform = '';
      return;
    }
    const offset = slideIndex * getViewportWidth();
    track.style.transform = `translate3d(-${offset}px, 0, 0)`;
  }

  function startCarousel(pageCount) {
    stopCarousel();
    if (pageCount <= 1 || prefersReducedMotion() || carouselPaused) return;
    carouselTimer = setInterval(() => {
      if (carouselPaused) return;
      slideIndex = (slideIndex + 1) % pageCount;
      applySlideTransform(pageCount);
    }, CAROUSEL_MS);
  }

  function createShopItem(p) {
    const div = document.createElement('div');
    const stClass = p.status === 'sold' ? 'sold' : p.status === 'sale' ? 'sale' : '';
    div.className = 'shop-item' + (stClass ? ' ' + stClass : '');

    const imgSrc =
      typeof window.sanityImgUrl === 'function'
        ? window.sanityImgUrl(p.image, { w: 600, q: 80 })
        : p.image;
    const imgSrcset =
      typeof window.sanitySrcset === 'function'
        ? window.sanitySrcset(p.image, [400, 600, 800])
        : '';

    div.dataset.title = p.title || '';
    div.dataset.status = p.status || '';
    div.dataset.isSold = String(p.status === 'sold');
    div.dataset.isOnSale = String(p.status === 'sale');
    div.dataset.price = String(p.price || '').replace(/[^\d.]/g, '');
    div.dataset.photos = (p.photos || [imgSrc]).join(',');
    div.dataset.desc = p.shortDescription || '';
    div.dataset.keywords = p.keywords || '';
    div.dataset.searchBlob = [p.title || '', p.keywords || '']
      .map(s => s.trim())
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    div.dataset.slug = p.slug || '';
    div.dataset.artist = 'nini';
    div.dataset.artistName = 'Nini Mzhavia';

    const cartBtn =
      p.status === 'sale'
        ? `<button type="button" class="shop-item__cart-btn" aria-label="Add to cart — inquire via WhatsApp"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg></button>`
        : '';

    div.innerHTML = `
          <div class="nv-img-wrap shop-item__visual">
          <img src="${escapeAttr(imgSrc)}"${imgSrcset ? ` srcset="${escapeAttr(imgSrcset)}" sizes="(max-width:600px) 100vw, (max-width:900px) 50vw, 350px"` : ''}
               alt="${escapeAttr(p.alt || p.title)}" loading="lazy" decoding="async"
               width="600" height="750" onerror="this.src='images/placeholder.jpg'">
          ${cartBtn}
          </div>
          <div class="shop-meta">
            <span>${escapeHtml(p.title)}</span>
            ${p.price ? `<span class="price">${fmtPrice(p.price)}</span>` : ''}
          </div>
        `;

    return div;
  }

  function render() {
    stopCarousel();
    slideIndex = 0;

    const filtered = items.filter(item => item.status === currentFilter);
    const perSlide = getPerSlide();
    const pages = chunk(filtered, perSlide);

    const frag = document.createDocumentFragment();

    if (!pages.length) {
      const p = document.createElement('p');
      p.className = 'muted';
      p.textContent = 'No artworks available.';
      frag.appendChild(p);
      track.style.transform = '';
    } else {
      pages.forEach(pageItems => {
        const slide = document.createElement('div');
        slide.className = 'home-shop-carousel__slide';
        pageItems.forEach(item => slide.appendChild(createShopItem(item)));
        frag.appendChild(slide);
      });
    }

    track.replaceChildren(frag);
    applySlideTransform(pages.length);
    requestAnimationFrame(() => startCarousel(pages.length));

    if (window.initShopItems) window.initShopItems();
    if (window.applyHomeSearch) window.applyHomeSearch();
  }

  // Load artworks — use fetchShopArtworks (no featured constraint, GROQ already
  // filters to Nini Mzhavia). Falls back to fetchFeaturedArtworks if unavailable.
  try {
    let raw = null;
    if (typeof window.fetchShopArtworks === 'function') {
      raw = await window.fetchShopArtworks();
    } else if (typeof window.fetchFeaturedArtworks === 'function') {
      raw = await window.fetchFeaturedArtworks();
    }

    const salePrimary =
      nvDistinctNormalizedSalePoolCount(Array.isArray(raw) ? raw : []);
    const primaryEmptyOrNoSale =
      !Array.isArray(raw) || raw.length === 0 || salePrimary === 0;
    /** When primary returns no SALE pool (legacy GROQ or empty), merge from direct published-inclusive CDN query. */
    if (primaryEmptyOrNoSale) {
      const alt = await nvDirectFetchPublishedInclusiveShopRows();
      const altLen = Array.isArray(alt) ? alt.length : 0;
      const saleAlt =
        nvDistinctNormalizedSalePoolCount(Array.isArray(alt) ? alt : []);
      const primaryVacant =
        !Array.isArray(raw) || raw.length === 0;
      if (altLen && (saleAlt > 0 || primaryVacant)) {
        raw = alt;
      }
    }

    if (raw && raw.length > 0) {
      // Dedupe full list — then prefer for-sale/listing listings before slicing (avoids OLD GROQ
      // bundles that only returned sold: first rows were exclusively sold → empty SALE tab).
      const seen = new Set();
      const dedupedAll = raw.filter(a => {
        if (!a._id || seen.has(a._id)) return false;
        seen.add(a._id);
        return true;
      });
      dedupedAll.sort((a, b) => {
        const sa = homeNormStatus(a.status);
        const sb = homeNormStatus(b.status);
        if (sa === 'sale' && sb !== 'sale') return -1;
        if (sa !== 'sale' && sb === 'sale') return 1;
        return 0;
      });
      const deduped = dedupedAll.slice(0, 48);

      items = deduped.map(artwork => ({
        id: artwork._id,
        status: homeNormStatus(artwork.status),
        title: artwork.title || 'Untitled',
        slug: artwork.slug?.current || artwork.slug || '',
        shortDescription: (artwork.shortDescription || '').trim().toLowerCase() === (artwork.title || '').trim().toLowerCase()
          ? ''
          : (artwork.shortDescription || ''),
        price: artwork.price || '',
        keywords: artwork.keywords || '',
        // Prefer explicit asset URL, fall back to older shapes
        image: artwork.image?.asset?.url || (Array.isArray(artwork.images) && artwork.images[0]?.asset?.url) || 'images/placeholder.jpg',
        photos: Array.isArray(artwork.images) ? artwork.images.map(i => i?.asset?.url).filter(Boolean) : (artwork.image?.asset?.url ? [artwork.image.asset.url] : []),
        alt: artwork.image?.alt || artwork.title || 'Artwork'
      }));
    } else {
      items = [];
    }
  } catch (error) {
    console.error('❌ Error loading artworks:', error);
    items = [];
  }

  // Always show section if we have data
  if (section && items.length > 0) {
    section.style.display = 'block';
  }

  render();

  if (carouselRoot) {
    carouselRoot.addEventListener('mouseenter', () => {
      carouselPaused = true;
    });
    carouselRoot.addEventListener('mouseleave', () => {
      carouselPaused = false;
      const pageCount = track.querySelectorAll('.home-shop-carousel__slide').length;
      startCarousel(pageCount);
    });
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const pageCount = track.querySelectorAll('.home-shop-carousel__slide').length;
      if (pageCount > 1) applySlideTransform(pageCount);
      else render();
    }, 200);
  });

  // Filter button handlers
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.filter;
      render();
    });
  });
}

// Runs immediately when loaded because DOMContentLoaded has already fired
// (this script is injected via requestIdleCallback, after page is interactive).
// The readyState guard ensures it still works if somehow loaded before DCL.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHomeShopPreview);
} else {
  initHomeShopPreview();
}
