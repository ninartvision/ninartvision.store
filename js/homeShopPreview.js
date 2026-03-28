/**
 * Home Shop Preview - Artworks Section
 * Displays artworks with showInShop === true
 * Auto-rotation and SALE/SOLD filtering
 */
const fmtPrice = p => { const n = Number(String(p || '').replace(/[^\d.]/g, '')); return n ? '\u20BE' + n.toLocaleString('en-US') : ''; };

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
    if (typeof window.fetchShopArtworks === 'function') {
      raw = await window.fetchShopArtworks();
    } else if (typeof window.fetchFeaturedArtworks === 'function') {
      raw = await window.fetchFeaturedArtworks();
    }

    console.log('[homeShopPreview] raw Sanity response:', raw?.length ?? 'null', 'items');
    if (raw && raw.length > 0) {
      console.log('[homeShopPreview] sample item:', JSON.stringify({
        _id: raw[0]._id,
        title: raw[0].title,
        status: raw[0].status,
        artist: raw[0].artist,
        hasImage: !!(raw[0].image?.asset?.url)
      }));
    }

    if (raw && raw.length > 0) {
      // Deduplicate by _id, limit to 6 for homepage grid
      const seen = new Set();
      const deduped = raw.filter(a => {
        if (!a._id || seen.has(a._id)) return false;
        seen.add(a._id);
        return true;
      }).slice(0, 6);

      console.log('[homeShopPreview] after dedup/limit:', deduped.length, 'items');

      items = deduped.map(artwork => ({
        id: artwork._id,
        status: artwork.status || '',
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
  console.log('[homeShopPreview] render artworks');
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
