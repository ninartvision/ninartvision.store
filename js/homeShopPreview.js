/**
 * Home Shop Preview - Artworks Section
 * Displays artworks with showInShop === true
 * Auto-rotation and SALE/SOLD filtering
 */

document.addEventListener("DOMContentLoaded", async () => {
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
    grid.innerHTML = "";

    const filtered = items.filter(
      item => item.status === currentFilter
    );

    const show = shuffle(filtered).slice(0, LIMIT);

    if (!show.length) {
      grid.innerHTML = `<p class="muted">No artworks available.</p>`;
      return;
    }

    show.forEach(p => {
      const div = document.createElement("div");
      div.className = "shop-item " + p.status;

      const imgSrc = (typeof window.sanityImgUrl === 'function')
        ? window.sanityImgUrl(p.image, { w: 600, q: 80 })
        : p.image;
      const imgSrcset = (typeof window.sanitySrcset === 'function')
        ? window.sanitySrcset(p.image, [400, 600, 800])
        : '';

      div.innerHTML = `
        <img src="${imgSrc}"${imgSrcset ? ` srcset="${imgSrcset}" sizes="(max-width:600px) 100vw, (max-width:900px) 50vw, 350px"` : ''}
             alt="${p.alt || p.title}" loading="lazy" decoding="async"
             width="600" height="750" onerror="this.src='images/placeholder.jpg'">
        <div class="shop-meta">
          <span>${p.title}</span>
          ${p.price ? `<span class="price">${p.price}</span>` : ''}
        </div>
        ${p.shortDescription ? `<p class="short-desc">${p.shortDescription}</p>` : ''}
      `;

      grid.appendChild(div);
    });
  }

  // Load artworks - prioritize Sanity featured, fallback to showInShop artworks
  try {
    const featuredArtworks = await fetchFeaturedArtworks();
    
    if (featuredArtworks && featuredArtworks.length > 0) {
      // Use Sanity featured artworks with new image structure
      items = featuredArtworks.map(artwork => ({
        status: artwork.status || 'sale',
        title: artwork.title || 'Untitled',
        shortDescription: artwork.shortDescription || '',
        price: artwork.price ? `₾${artwork.price}` : '',
        // Prefer explicit asset URL, fall back to older shapes
        image: artwork.image?.asset?.url || (Array.isArray(artwork.images) && artwork.images[0]?.asset?.url) || artwork.image || 'images/placeholder.jpg',
        photos: Array.isArray(artwork.images) ? artwork.images.map(i => i?.asset?.url).filter(Boolean) : (artwork.image?.asset?.url ? [artwork.image.asset.url] : []),
        alt: artwork.image?.alt || artwork.title || 'Artwork'
      }));
    } else {
      // Fallback to legacy data with showInShop filter
      if (window.ARTWORKS) {
          items = window.ARTWORKS
            .filter(a => a.showInShop === true) // Only show artworks marked for shop
            .map(a => ({
              status: a.status || 'sale',
              title: a.title || 'Untitled',
              shortDescription: a.shortDescription || a.desc || '',
              price: a.price ? `₾${a.price}` : '',
              image: (a.img || '').toLowerCase(),
              photos: a.photos || [a.img],
              alt: a.alt || a.title || 'Artwork'
            }));
        }
    }
  } catch (error) {
    console.error('❌ Error loading featured artworks:', error);
    
    // Fallback to legacy data with showInShop filter
    if (window.ARTWORKS) {
      items = window.ARTWORKS
        .filter(a => a.showInShop === true) // Only show artworks marked for shop
        .map(a => ({
          status: a.status || 'sale',
          title: a.title || 'Untitled',
          shortDescription: a.shortDescription || a.desc || '',
          price: a.price ? `₾${a.price}` : '',
          image: (a.img || '').toLowerCase(),
          photos: a.photos || [a.img],
          alt: a.alt || a.title || 'Artwork'
        }));
    }
  }

  // Always show section if we have data
  if (section && items.length > 0) {
    section.style.display = 'block';
  }

  // Initial render and auto-rotation
  render();
  setInterval(render, 5000); // 🔁 Auto-rotate every 5 seconds

  // Filter button handlers
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.filter;
      render();
    });
  });
});
