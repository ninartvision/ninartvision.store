/**
 * Shop page rendering — Nini Mzhavia artworks only.
 * No artist filter, no search, no unnecessary state.
 * NEVER falls back to window.ARTWORKS (would show all artists).
 */
const fmtPrice = p => { const n = Number(String(p || '').replace(/[^\d.]/g, '')); return n ? '\u20BE' + n.toLocaleString('en-US') : ''; };

// Bust any stale "all artworks" localStorage cache keys left from old code
(function bustOldCache() {
  try {
    // DEBUG: clear ALL nv_shop_* and nv_artworks_* keys to force fresh fetch
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('nv_shop_') || k.startsWith('nv_artworks_') || k.startsWith('nv_featured_')) {
        localStorage.removeItem(k);
      }
    });
    console.log('[shop] All artwork caches cleared for debug');
  } catch (e) { /* ignore */ }
})();

let allRenderedItems = [];

// ========================================
// Render grid
// ========================================
function renderAllItems(artworksData) {
  const grid = document.getElementById('shopGrid');
  if (!grid) return;

  console.log('[shop-render] renderAllItems called with', artworksData?.length ?? 0, 'items', artworksData);

  // STRICT: never use window.ARTWORKS — it contains all artists
  if (!artworksData || !artworksData.length) {
    if (window.nvEmpty) window.nvEmpty(grid, 'No artworks available');
    else grid.innerHTML = '<p class="muted">No artworks available.</p>';
    return;
  }

  const source = artworksData;

  const iUrl = typeof sanityImgUrl === 'function' ? sanityImgUrl : u => u;
  const iSet = typeof sanitySrcset === 'function' ? sanitySrcset : () => '';

  const normalize = a => {
    const status  = a.status === 'sold' ? 'sold' : (a.status === 'sale' ? 'sale' : '');
    const rawUrl  = a.image?.asset?.url;
    const imgSrc  = rawUrl ? iUrl(rawUrl, {w: 400}) : `../${ (a.img || '').toLowerCase() }`;
    const srcset  = rawUrl ? iSet(rawUrl, [400, 800]) : '';
    const lqip    = a.image?.asset?.metadata?.lqip || '';
    const photos  = (Array.isArray(a.images) && a.images.length)
      ? a.images.map(i => i?.asset?.url).filter(Boolean).map(u => iUrl(u, {w: 800}))
      : (Array.isArray(a.photos) ? a.photos : [imgSrc]);
    return {
      status,
      title:  a.title || '',
      price:  String(a.price || ''),
      size:   a.size || a.dimensions || '',
      medium: a.medium || '',
      year:   String(a.year || ''),
      desc:   a.shortDescription || a.desc || a.description || '',
      keywords: a.keywords || '',
      imgSrc, srcset, lqip, photos,
    };
  };

  const items = source
    .filter(a => a.artist && a.artist.name === 'Nini Mzhavia')
    .map(normalize)
    .sort((a, b) =>
      a.status === 'sale' && b.status !== 'sale' ? -1 :
      a.status !== 'sale' && b.status === 'sale' ?  1 : 0
    );

  const frag = document.createDocumentFragment();
  allRenderedItems = items.map(a => {
    const div = document.createElement('div');
    div.className        = `shop-item ${a.status}`;
    div.dataset.status   = a.status;
    div.dataset.isSold   = String(a.status === 'sold');
    div.dataset.isOnSale = String(a.status === 'sale');
    div.dataset.title    = a.title;
    div.dataset.price    = a.price;
    div.dataset.size     = a.size;
    div.dataset.medium   = a.medium;
    div.dataset.year     = a.year;
    div.dataset.desc     = a.desc;
    div.dataset.keywords = a.keywords;
    div.dataset.photos   = a.photos.join(',');
    div.innerHTML = `
      <div class="nv-img-wrap"${a.lqip ? ` style="background-image:url(${a.lqip})"` : ''}>
        <img class="nv-lqip" src="${a.imgSrc}"
          ${a.srcset ? `srcset="${a.srcset}" sizes="(max-width:600px) 100vw, 400px"` : ''}
          alt="${a.title}" loading="lazy"
          onload="this.classList.add('nv-loaded');this.parentNode.style.backgroundImage=''"
          onerror="this.classList.add('nv-loaded');this.parentNode.style.backgroundImage=''">
      </div>
      ${a.status === 'sold' ? '<div class="sold-badge"></div>' : ''}
      <div class="shop-meta">
        <span>${a.title}</span>
        <span class="price">${fmtPrice(a.price)}</span>
      </div>
    `;
    frag.appendChild(div);
    return div;
  });

  grid.innerHTML = '';
  grid.appendChild(frag);

  if (window.initShopItems) window.initShopItems();
}

// ========================================
// Status filter pills (ALL / SALE / SOLD)
// ========================================
function applyStatusFilter(status) {
  allRenderedItems.forEach(item => {
    const visible = status === 'all' || item.dataset.status === status;
    item.classList.toggle('is-hidden', !visible);
  });
}

// ========================================
// Boot
// ========================================
document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('shopGrid');
  if (grid && window.nvSkeleton) window.nvSkeleton(grid, 8);

  // Status filter pills
  const pills = document.querySelectorAll('.filter-tabs .pill');
  let activeStatus = 'all';
  pills.forEach(p => {
    p.addEventListener('click', () => {
      pills.forEach(x => x.classList.remove('active'));
      p.classList.add('active');
      activeStatus = p.dataset.filter;
      if (typeof trackShopFilter === 'function') trackShopFilter('status', activeStatus);
      applyStatusFilter(activeStatus);
    });
  });
  pills[0]?.classList.add('active');

  // Fetch Nini Mzhavia artworks from Sanity (reference-based filter — no fallback to static data)
  let artworks = null;
  if (typeof window.fetchShopArtworks === 'function') {
    try {
      artworks = await window.fetchShopArtworks();
      console.log('[shop-render] artworks received:', artworks?.length, artworks);
    } catch (e) {
      console.error('[shop-render] Sanity fetch failed:', e);
    }
  }
  renderAllItems(artworks);
  applyStatusFilter(activeStatus);
});