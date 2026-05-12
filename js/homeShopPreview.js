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

async function initHomeShopPreview() {
  console.log('[homeShopPreview] init — readyState:', document.readyState);
  const grid = document.getElementById("homeShopGrid");
  const buttons = document.querySelectorAll(".preview-btn");
  const section = document.querySelector(".home-shop-preview");

  if (!grid) return;

  let items = [];
  let currentFilter = "sale";
  const LIMIT = 3;

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

        div.innerHTML = `
          <img src="${imgSrc}"${imgSrcset ? ` srcset="${imgSrcset}" sizes="(max-width:600px) 100vw, (max-width:900px) 50vw, 350px"` : ''}
               alt="${p.alt || p.title}" loading="lazy" decoding="async"
               width="600" height="750" onerror="this.src='images/placeholder.jpg'">
          <div class="shop-meta">
            <span>${p.title}</span>
            ${p.price ? `<span class="price">${fmtPrice(p.price)}</span>` : ''}
          </div>
          ${p.shortDescription ? `<p class="short-desc">${p.shortDescription}</p>` : ''}
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
