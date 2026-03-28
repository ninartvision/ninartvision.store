/**
 * Shop page rendering with artist filtering from Sanity
 * Optimized: items rendered once via DocumentFragment;
 * filter/search changes only toggle a CSS class — no DOM rebuild.
 */

// ========================================
// State
// ========================================

let selectedArtist = "all";
let selectedFilter = "all";
let selectedSearch = "";
let allArtists = [];
let allRenderedItems = []; // DOM node refs — avoids re-render on filter change

// Debounce helper
function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

// Slug to ID mapping (matches artist.js)
const slugToId = {
  'nini-mzhavia': 'nini',
  'mzia-kashia': 'mzia',
  'nanuli-gogiberidze': 'nanuli'
};

// ========================================
// Fetch and populate artist filter
// ========================================

async function populateArtistFilter() {
  const artistFilter = document.getElementById("artistFilter");
  
  if (!artistFilter) {
    console.warn('Artist filter element not found');
    return;
  }

  try {
    // Fetch all artists from Sanity
    allArtists = await fetchArtistsFromSanity();
    
    if (!allArtists || allArtists.length === 0) {
      console.warn('No artists found in Sanity');
      return;
    }

    // Populate dropdown with artists
    artistFilter.innerHTML = '<option value="all">All Artists</option>';
    
    allArtists.forEach(artist => {
      const artistId = artist.slug ? slugToId[artist.slug] : null;
      if (artistId) {
        const option = document.createElement('option');
        option.value = artistId;
        option.textContent = artist.name;
        artistFilter.appendChild(option);
      }
    });

  } catch (error) {
    console.error('Error fetching artists:', error);
  }
}

// ========================================
// Initial render — builds all items once via DocumentFragment
// artworksData: optional array from Sanity (normalised on-the-fly);
//               pass null to fall back to window.ARTWORKS (data.js shape)
// ========================================
function renderAllItems(artworksData) {
  const grid = document.getElementById("shopGrid");
  if (!grid) return;

  const source = artworksData || window.ARTWORKS;
  if (!source || !source.length) {
    if (window.nvEmpty) window.nvEmpty(grid, 'No artworks available');
    else grid.innerHTML = '<p class="muted">No artworks available.</p>';
    return;
  }

  // Normalise: handles both Sanity-shaped and static data.js-shaped artworks
  const normalize = a => {
    // Artist: Sanity returns {_id, name, slug}; data.js returns string ID
    const artist = typeof a.artist === 'object'
      ? (slugToId[a.artist?.slug] || a.artist?.slug || '')
      : (a.artist || '');
    // Status: Sanity uses "published" for for-sale items — map to "sale"
    const status = a.status === 'published' ? 'sale' : (a.status || 'sale');
    // Image src: Sanity CDN full URL vs relative path (shop page is in /sale/)
    const imgSrc = a.image?.asset?.url || `../${ (a.img || '').toLowerCase() }`;
    // Photos array
    const photos = (Array.isArray(a.images) && a.images.length)
      ? a.images.map(i => i?.asset?.url).filter(Boolean)
      : (Array.isArray(a.photos) ? a.photos : [imgSrc]);
    const title    = a.title    || '';
    const keywords = a.keywords || '';
    const lqip = a.image?.asset?.metadata?.lqip || '';
    return {
      artist,
      status,
      title,
      keywords,
      lqip,
      price:  String(a.price  || ''),
      size:   a.size || a.dimensions || '',
      medium: a.medium || '',
      year:   String(a.year || ''),
      desc:   a.shortDescription || a.desc || a.description || '',
      imgSrc,
      photos,
      // Pre-build searchBlob: title + comma-split keywords, all lowercased
      searchBlob: [title, ...keywords.split(',').map(k => k.trim()).filter(Boolean)]
        .join(' ').toLowerCase(),
      // When artworksData comes from Sanity it's already filtered; otherwise check flag
      showInShop: artworksData ? true : (a.showInShop === true),
    };
  };

  const shopItems = source
    .map(normalize)
    .filter(a => a.showInShop)
    .sort((a, b) =>
      a.status === 'sale' && b.status !== 'sale' ? -1 :
      a.status !== 'sale' && b.status === 'sale' ?  1 : 0
    );

  const frag = document.createDocumentFragment();
  allRenderedItems = shopItems.map(a => {
    const div = document.createElement('div');
    div.className        = `shop-item ${a.status}`;
    div.dataset.artist   = a.artist;
    div.dataset.status   = a.status;
    div.dataset.title    = a.title;
    div.dataset.titleLow = a.title.toLowerCase();
    div.dataset.keywords = a.keywords;
    div.dataset.searchBlob = a.searchBlob;
    div.dataset.price    = a.price;
    div.dataset.size     = a.size;
    div.dataset.medium   = a.medium;
    div.dataset.year     = a.year;
    div.dataset.desc     = a.desc;
    div.dataset.photos   = a.photos.join(',');
    div.innerHTML = `
      <div class="nv-img-wrap"${a.lqip ? ` style="background-image:url(${a.lqip})"` : ''}>
        <img class="nv-lqip" src="${a.imgSrc}" alt="${a.title}" loading="lazy"
          onload="this.classList.add('nv-loaded');this.parentNode.style.backgroundImage=''"
          onerror="this.classList.add('nv-loaded');this.parentNode.style.backgroundImage=''">
      </div>
      ${a.status === 'sold' ? '<div class="sold-badge"></div>' : ''}
      <div class="shop-meta">
        <span>${a.title}</span>
        <span class="price">₾${a.price}</span>
      </div>
    `;
    frag.appendChild(div);
    return div;
  });

  // Clear any previous content (skeleton or stale results) before appending
  grid.innerHTML = '';
  // Single DOM mutation — append all items at once
  grid.appendChild(frag);

  // Set up event delegation once (idempotent inside initShopItems)
  if (window.initShopItems) window.initShopItems();
}

// ========================================
// Apply filters — toggles CSS class, no DOM rebuild
// ========================================
function applyFilters() {
  const grid = document.getElementById("shopGrid");
  if (!grid) return;

  // Split query into terms — "oil portrait" requires both words to match
  const terms = selectedSearch ? selectedSearch.trim().split(/\s+/).filter(Boolean) : [];

  let visibleCount = 0;
  allRenderedItems.forEach(item => {
    const visible =
      (selectedArtist === 'all' || item.dataset.artist === selectedArtist) &&
      (selectedFilter === 'all' || item.dataset.status === selectedFilter) &&
      (!terms.length || terms.every(t => item.dataset.searchBlob.includes(t)));
    item.classList.toggle('is-hidden', !visible);
    if (visible) visibleCount++;
  });

  let empty = grid.querySelector('.no-results-msg');
  if (!visibleCount && allRenderedItems.length) {
    if (!empty) {
      empty = document.createElement('div');
      empty.className = 'no-results-msg';
      empty.style.cssText = 'grid-column:1/-1;text-align:center;padding:40px;color:#999';
      empty.innerHTML = '<p>No artworks found for the selected filters.</p>';
      grid.appendChild(empty);
    }
  } else if (empty) {
    empty.remove();
  }
}

// ========================================
// Event listeners
// ========================================

document.addEventListener("DOMContentLoaded", async () => {
  // Show skeleton immediately — before any async work
  const _skGrid = document.getElementById("shopGrid");
  if (_skGrid && window.nvSkeleton) window.nvSkeleton(_skGrid, 8);

  await populateArtistFilter();

  // Artist filter change
  const artistFilter = document.getElementById("artistFilter");
  if (artistFilter) {
    artistFilter.addEventListener("change", e => {
      selectedArtist = e.target.value;
      if (typeof trackShopFilter === 'function') {
        const artistName = allArtists.find(a => {
          const id = a.slug ? slugToId[a.slug] : null;
          return id === e.target.value;
        })?.name || e.target.value;
        trackShopFilter('artist', artistName);
      }
      applyFilters();
    });
  }

  // Status filter pills
  const pills = document.querySelectorAll(".filter-tabs .pill");
  pills.forEach(p => {
    p.addEventListener("click", () => {
      pills.forEach(x => x.classList.remove("active"));
      p.classList.add("active");
      selectedFilter = p.dataset.filter;
      if (typeof trackShopFilter === 'function') trackShopFilter('status', selectedFilter);
      applyFilters();
    });
  });
  pills[0]?.classList.add("active");

  // Search — debounced 150 ms to avoid re-filter on every keystroke
  const shopSearch = document.getElementById('shopSearch');
  if (shopSearch) {
    const debouncedSearch = debounce(() => {
      selectedSearch = shopSearch.value.trim().toLowerCase();
      applyFilters();
    }, 150);
    shopSearch.addEventListener('input', debouncedSearch);
    shopSearch.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        shopSearch.value = '';
        selectedSearch = '';
        applyFilters();
        shopSearch.blur();
      }
    });
  }

  // Try Sanity first; fall back to static window.ARTWORKS if unavailable or empty
  let sanityArtworks = null;
  if (typeof window.fetchShopArtworks === 'function') {
    try {
      sanityArtworks = await window.fetchShopArtworks();
      console.log('[shop-render] Loaded from Sanity:', sanityArtworks?.length, 'artworks');
    } catch (e) {
      console.warn('[shop-render] Sanity fetch failed, using static data:', e);
    }
  }
  renderAllItems(sanityArtworks && sanityArtworks.length ? sanityArtworks : null);
  applyFilters();
});