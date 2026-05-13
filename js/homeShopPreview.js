/**
 * Home Shop Preview - Artworks Section
 * Loads shop artworks from Sanity (fetchShopArtworks) and SALE/SOLD tabs.
 */
const fmtPrice = p => { const n = Number(String(p || '').replace(/[^\d.]/g, '')); return n ? '\u20BE' + n.toLocaleString('en-US') : ''; };

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
    const result = data.result || [];
    const h = {};
    result.forEach(x => {
      const k = String(x.status == null ? '(missing)' : x.status);
      h[k] = (h[k] || 0) + 1;
    });
    console.log('[homeShopPreview][direct Sanity] histogram:', h, '| count:', result.length);
    return result;
  } catch (e) {
    console.warn('[homeShopPreview][direct Sanity] fetch failed:', e);
    return null;
  }
}

async function initHomeShopPreview() {
  /** Old cached sanity-client bundles skip this — keep home filters consistent. */
  if (typeof window.normalizeArtworkListingStatus !== 'function') {
    window.normalizeArtworkListingStatus = homeNormStatus;
  }

  console.log('[homeShopPreview] init — readyState:', document.readyState);
  const grid = document.getElementById("homeShopGrid");
  const buttons = document.querySelectorAll(".preview-btn");
  const section = document.querySelector(".home-shop-preview");

  if (!grid) return;

  let items = [];
  let currentFilter = "sale";
  const LIMIT = 6;

  function shuffle(arr) {
    return [...arr].sort(() => Math.random() - 0.5);
  }

  function render() {
    const filtered = items.filter(item => item.status === currentFilter);
    const show = shuffle(filtered).slice(0, LIMIT);

    if (!(window).__nvDbgHomeShop) window.__nvDbgHomeShop = { renders: 0 };
    window.__nvDbgHomeShop.renders += 1;
    const noisy = Boolean(window.__nvDbgHomeVerbose);
    if (noisy || window.__nvDbgHomeShop.renders <= 3 || (filtered.length === 0 && currentFilter === 'sale')) {
      console.log('[homeShopPreview] pre-render:', {
        tab: currentFilter,
        itemsTotal: items.length,
        filteredLen: filtered.length,
        displayLen: show.length,
        filteredPreview: filtered.slice(0, 12).map(i => ({ title: i.title, normStatus: i.status })),
        note: noisy ? '(verbose)' : '(first 3 rotations or empty SALE pool only; set window.__nvDbgHomeVerbose=true for all)'
      });
    }

    // Build all nodes in a detached fragment — zero reflows during construction
    const frag = document.createDocumentFragment();

    if (!show.length) {
      const p = document.createElement('p');
      p.className = 'muted';
      p.textContent = 'No artworks available.';
      frag.appendChild(p);
    } else {
      show.forEach(p => {
        const div = document.createElement("div");
        div.className = "shop-item " + p.status;

        const imgSrc = (typeof window.sanityImgUrl === 'function')
          ? window.sanityImgUrl(p.image, { w: 600, q: 80 })
          : p.image;
        const imgSrcset = (typeof window.sanitySrcset === 'function')
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
        // Pre-build searchBlob so applyHomeSearch can filter without DOM reads
        div.dataset.searchBlob = [
          p.title || '',
          p.keywords || ''
        ].map(s => s.trim()).filter(Boolean).join(' ').toLowerCase();

        div.dataset.slug = p.slug || '';
        div.dataset.artist = 'nini';

        const cartBtn = p.status === 'sale'
          ? `<button type="button" class="shop-item__cart-btn" aria-label="Add to cart — inquire via WhatsApp"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg></button>`
          : '';

        div.innerHTML = `
          <div class="nv-img-wrap shop-item__visual">
          <img src="${imgSrc}"${imgSrcset ? ` srcset="${imgSrcset}" sizes="(max-width:600px) 100vw, (max-width:900px) 50vw, 350px"` : ''}
               alt="${p.alt || p.title}" loading="lazy" decoding="async"
               width="600" height="750" onerror="this.src='images/placeholder.jpg'">
          ${cartBtn}
          </div>
          <div class="shop-meta">
            <span>${p.title}</span>
            ${p.price ? `<span class="price">${fmtPrice(p.price)}</span>` : ''}
          </div>
        `;

        frag.appendChild(div);
      });
    }

    // Single DOM mutation — replaces all children atomically
    grid.replaceChildren(frag);

    if (window.initShopItems) window.initShopItems();
    if (window.applyHomeSearch) window.applyHomeSearch();
  }

  // Load artworks — use fetchShopArtworks (no featured constraint, GROQ already
  // filters to Nini Mzhavia). Falls back to fetchFeaturedArtworks if unavailable.
  try {
    let raw = null;
    let fetchSource = '(none)';
    if (typeof window.fetchShopArtworks === 'function') {
      fetchSource = 'fetchShopArtworks';
      raw = await window.fetchShopArtworks();
    } else if (typeof window.fetchFeaturedArtworks === 'function') {
      fetchSource = 'fetchFeaturedArtworks';
      raw = await window.fetchFeaturedArtworks();
    }

    const salePrimary =
      nvDistinctNormalizedSalePoolCount(Array.isArray(raw) ? raw : []);
    const primaryEmptyOrNoSale =
      !Array.isArray(raw) || raw.length === 0 || salePrimary === 0;
    /** When primary returns no SALE pool (legacy GROQ or empty), merge from direct published-inclusive CDN query. */
    if (primaryEmptyOrNoSale) {
      console.warn('[homeShopPreview] Direct Sanity fetch (sale|sold|published):',
        !Array.isArray(raw) || !raw.length
          ? 'primary_empty_or_invalid'
          : 'zero_SALE_after_normalize');
      const alt = await nvDirectFetchPublishedInclusiveShopRows();
      const altLen = Array.isArray(alt) ? alt.length : 0;
      const saleAlt =
        nvDistinctNormalizedSalePoolCount(Array.isArray(alt) ? alt : []);
      const primaryVacant =
        !Array.isArray(raw) || raw.length === 0;
      if (altLen && (saleAlt > 0 || primaryVacant)) {
        raw = alt;
        fetchSource += '→nvDirect';
      }
    }

    console.log('[homeShopPreview] bundle check — normalizeArtworkListingStatus:',
      typeof window.normalizeArtworkListingStatus,
      '| fetch:', fetchSource);
    console.log('[homeShopPreview] raw Sanity response:', raw?.length ?? 'null', 'items');

    try {
      if (Array.isArray(raw) && raw.length) {
        const serialRaw = JSON.parse(JSON.stringify(raw));
        console.log('[homeShopPreview] raw artworks FULL (serialized):', serialRaw);
      } else {
        console.log('[homeShopPreview] raw artworks FULL: (empty or not an array)');
      }
    } catch (serErr) {
      console.warn('[homeShopPreview] could not serialize raw artworks:', serErr);
    }
    if (raw && raw.length > 0) {
      console.log('[homeShopPreview] sample item:', JSON.stringify({
        _id: raw[0]._id,
        title: raw[0].title,
        status: raw[0].status,
        artist: raw[0].artist,
        hasImage: !!(raw[0].image?.asset?.url)
      }));
      const hist = {};
      raw.forEach(a => {
        const k = a.status === undefined || a.status === null || a.status === ''
          ? '(missing)'
          : String(a.status);
        hist[k] = (hist[k] || 0) + 1;
      });
      console.log('[homeShopPreview] raw status histogram:', hist);
      console.log('[homeShopPreview] raw preview (first 25 title+status):', raw.slice(0, 25).map(a => ({
        title: a.title,
        status: a.status
      })));
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

      console.log('[homeShopPreview] after dedup/sort SALE-first:', deduped.length, '/', dedupedAll.length, 'items');

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
      const normalizedHist = {};
      items.forEach(i => {
        const k = i.status || '(empty)';
        normalizedHist[k] = (normalizedHist[k] || 0) + 1;
      });
      console.log('[homeShopPreview] normalized status histogram:', normalizedHist);
      console.log('[homeShopPreview] SALE pool size:', items.filter(i => i.status === 'sale').length,
        '| SOLD pool size:', items.filter(i => i.status === 'sold').length);
    } else {
      items = [];
    }
  } catch (error) {
    console.error('❌ Error loading artworks:', error);
    items = [];
  }

  console.log('[homeShopPreview] data loaded —', items.length, 'artworks');

  // Always show section if we have data
  if (section && items.length > 0) {
    section.style.display = 'block';
  }

  // Initial render and auto-rotation
  console.log('[homeShopPreview] initial paint (tab default:', currentFilter + ')');
  render();

  // Pause rotation when the page tab is not visible (saves CPU/battery)
  let rotationInterval = setInterval(render, 5000);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearInterval(rotationInterval);
      rotationInterval = null;
    } else if (!rotationInterval) {
      rotationInterval = setInterval(render, 5000);
    }
  });

  // Filter button handlers
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.filter;
      const f = items.filter(item => item.status === currentFilter);
      console.log('[homeShopPreview] tab switched →', currentFilter, '| filtered:', f.length + '/' + items.length);
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
