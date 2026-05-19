const fmtPrice = p => { const n = Number(String(p || '').replace(/[^\d.]/g, '')); return n ? '\u20BE' + n.toLocaleString('en-US') : ''; };

/** Plain-text / HTML body contexts (e.g. inside <span>). */
function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Double-quoted attribute values (src, alt, data-*, style url(...)). */
function escapeAttr(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/'/g, '&#39;');
}

document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("shopGrid");
  const title = document.querySelector(".artist-name");
  const avatar = document.getElementById("artistAvatar");
  const pills = document.querySelectorAll(".pill");

  if (!grid || !title) return;

  // ---------------------------
  // GET ARTIST SLUG
  // ---------------------------
  const params = new URLSearchParams(location.search);
  const artistSlug = params.get("artist");
  
  if (!artistSlug) {
    title.textContent = "Artist not found";
    return;
  }

  // ---------------------------
  // STATE
  // ---------------------------
  let artistData = null;
  let currentLang = "ka";
  const SANITY_PROJECT = window.SANITY_CONFIG?.projectId || '8t5h923j';
  const SANITY_DATASET = window.SANITY_CONFIG?.dataset || 'production';
  const SANITY_API_VERSION = window.SANITY_CONFIG?.apiVersion || '2025-02-05';

  function sanityQueryUrl(query) {
    return `https://${SANITY_PROJECT}.apicdn.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}?query=${encodeURIComponent(query)}`;
  }

  // ---------------------------
  // FETCH ARTIST FROM SANITY
  // ---------------------------
  async function fetchArtistData() {
    try {
      const slugLit = JSON.stringify(String(artistSlug));
      const query = `
        *[_type == "artist" && slug.current == ${slugLit}][0]{
          _id,
          name,
          "avatar": image.asset->url,
          bio_en,
          bio_ka,
          about,
          style,
          seoTitle,
          seoDescription,
          "slug": slug.current
        }
      `;

      const res = await fetch(sanityQueryUrl(query));

      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);

      const { result } = await res.json();
      return result;
    } catch (err) {
      console.error("Error fetching artist:", err);
      return null;
    }
  }

  // ---------------------------
  // INITIALIZE ARTIST DATA
  // ---------------------------
  async function initializeArtist() {
    artistData = await fetchArtistData();

    // Set artist name
    title.textContent = artistData?.name || "Artist";

    // Set avatar (defensive)
    if (avatar && artistData?.avatar) {
      const avatarUrl = artistData.avatar.startsWith('http')
        ? (typeof window.sanityImgUrl === 'function'
            ? window.sanityImgUrl(artistData.avatar, { w: 600, q: 80 })
            : artistData.avatar)
        : "../" + artistData.avatar;
      avatar.src = avatarUrl;
      avatar.style.display = "block";
    } else if (avatar) {
      avatar.style.display = "none";
    }

    // Store globally for legacy compatibility
    window.CURRENT_ARTIST = artistData;

    // Initialize bio rendering
    initializeBio();
  }

  // ---------------------------
  // BIO TEXT - SINGLE SOURCE OF TRUTH
  // ---------------------------
  function getBioText(lang) {
    if (!artistData) return "Biography loading...";

    // Priority 1: Requested language from Sanity
    const requestedBio = lang === 'en' ? artistData.bio_en : artistData.bio_ka;
    if (requestedBio?.trim()) return requestedBio;

    // Priority 2: Fallback to other language from Sanity
    const fallbackBio = lang === 'en' ? artistData.bio_ka : artistData.bio_en;
    if (fallbackBio?.trim()) return fallbackBio;

    // Priority 3: Legacy 'about' field
    if (artistData.about?.trim()) return artistData.about;

    return "No biography available.";
  }

  // ---------------------------
  // BIO RENDERING - ONE PLACE ONLY
  // ---------------------------
  function updateBioText(lang) {
    const bioText = document.getElementById("aboutText");
    if (!bioText) return;

    currentLang = lang;
    bioText.textContent = getBioText(lang);

    // Update language switcher button styles
    const langSwitches = document.querySelectorAll(".lang-switch");
    langSwitches.forEach(btn => {
      if (btn.dataset.lang === lang) {
        btn.style.background = "#1a1a1a";
        btn.style.color = "#fff";
        btn.style.opacity = "1";
      } else {
        btn.style.background = "#e8e8e8";
        btn.style.color = "#666";
        btn.style.opacity = "0.7";
      }
    });
  }

  // ---------------------------
  // INITIALIZE BIO
  // ---------------------------
  function initializeBio() {
    const savedLang = localStorage.getItem("siteLang") || "ka";
    updateBioText(savedLang);

    // Language switcher event listeners
    const langSwitches = document.querySelectorAll(".lang-switch");
    langSwitches.forEach(btn => {
      btn.addEventListener("click", () => {
        const lang = btn.dataset.lang;
        updateBioText(lang);
        localStorage.setItem("siteLang", lang);
      });
    });
  }

  // ---------------------------
  // ABOUT TOGGLE - UNIFIED (ONE CLICK ONLY)
  // ---------------------------
  const aboutToggle = document.getElementById("aboutToggle");
  const aboutContent = document.getElementById("aboutArtist");

  if (aboutToggle && aboutContent) {
    // Set initial state
    aboutContent.style.display = "none";
    aboutToggle.innerHTML = "About artist ▼";

    // Single unified toggle
    aboutToggle.addEventListener("click", () => {
      const isCurrentlyHidden = aboutContent.style.display === "none" || aboutContent.style.display === "";
      aboutContent.style.display = isCurrentlyHidden ? "block" : "none";
      aboutToggle.innerHTML = isCurrentlyHidden ? "About artist ▲" : "About artist ▼";
    });
  }

  // ---------------------------
  // START: Initialize artist data
  // ---------------------------
  initializeArtist();


  // ---------------------------
  // ARTWORKS (FROM SANITY ONLY)
  // ---------------------------
  let allArtworks = [];

  // Show loading state
  grid.innerHTML = '<p class="muted">Loading artworks...</p>';

  async function loadArtworks() {
    if (!artistSlug) {
      grid.innerHTML = '<p class="muted">Artist not found.</p>';
      return;
    }

    try {
      const slugLit = JSON.stringify(String(artistSlug));
      const query = `
        *[_type == "artwork" && artist->slug.current == ${slugLit} && status in ["sale", "sold", "published"]] | order(_createdAt desc) {
          _id,
          title,
          price,
          status,
          "size": dimensions,
          medium,
          year,
          description,
          image{
            asset->{
              _id,
              url
            },
            alt
          },
          "img": image.asset->url,
          images[]{
            asset->{
              _id,
              url
            },
            alt,
            _key
          },
          "photos": images[].asset->url,
          "slug": slug.current,
          featured
        }
      `;

      const res = await fetch(sanityQueryUrl(query));

      if (!res.ok) {
        throw new Error(`HTTP error: ${res.status}`);
      }

      const { result } = await res.json();

      const imgOpt = typeof window.sanityImgUrl === 'function'
        ? (u, w) => window.sanityImgUrl(u, { w: w || 600, q: 80 })
        : (u) => u;

      const norm =
        typeof window.normalizeArtworkListingStatus === 'function'
          ? window.normalizeArtworkListingStatus
          : (s =>
              String(s || '').trim().toLowerCase() === 'sold'
                ? 'sold'
                : (String(s || '').trim().toLowerCase() === 'sale' ||
                    String(s || '').trim().toLowerCase() === 'published'
                    ? 'sale'
                    : ''));

      const seenIds = new Set();
      allArtworks = (result || [])
        .filter(a => a.img)
        .filter(a => {
          const id = a._id || '';
          if (!id || seenIds.has(id)) return false;
          seenIds.add(id);
          return true;
        })
        .map(a => ({
          title: a.title || "Untitled",
          price: Number(String(a.price || '').replace(/[^\d.]/g, '')) || '',
          status: norm(a.status),
          size: a.size || "",
          medium: a.medium || "",
          year: a.year || "",
          img: imgOpt(a.img, 600),
          imgSrcset: typeof window.sanitySrcset === 'function'
            ? window.sanitySrcset(a.img, [400, 600, 800])
            : '',
          description: a.description || "",
          alt: a.image?.alt || a.title || "Artwork image",
          // Lightbox photos at higher resolution
          slug: a.slug?.current || a.slug || "",
          photos: a.photos?.length
            ? a.photos.map(u => imgOpt(u, 1200))
            : [imgOpt(a.img, 1200)]
        }));

      render("all");
    } catch (err) {
      console.error("❌ Error loading artworks:", err);
      grid.innerHTML = '<p class="muted">Failed to load artworks. Please try again later.</p>';
    }
  }

  function render(filter = "all") {
    const items = filter === "all"
      ? allArtworks
      : allArtworks.filter(a => a.status === filter);

    if (!items.length) {
      grid.innerHTML = "<p class='muted'>No artworks found.</p>";
      return;
    }


    grid.innerHTML = items.map(a => {
      const stClass = a.status === 'sold' ? 'sold' : (a.status === 'sale' ? 'sale' : '');
      return `
      <div class="shop-item${stClass ? ' ' + stClass : ''}"
        data-img="${escapeAttr(a.img)}"
        data-artist="${escapeAttr(artistSlug)}"
        data-artist-name="${escapeAttr(artistData?.name || '')}"
        data-slug="${escapeAttr(a.slug || '')}"
        data-status="${escapeAttr(a.status)}"
        data-is-sold="${String(a.status === 'sold')}"
        data-is-on-sale="${String(a.status === 'sale')}"
        data-title="${escapeAttr(a.title)}"
        data-price="${escapeAttr(String(a.price))}"
        data-size="${escapeAttr(a.size)}"
        data-medium="${escapeAttr(a.medium)}"
        data-year="${escapeAttr(a.year)}"
        data-desc="${escapeAttr(String(a.description || ''))}"
        data-alt="${escapeAttr(a.alt)}"
        data-photos="${escapeAttr(a.photos.join(','))}">

        <div class="nv-img-wrap shop-item__visual">
        <img src="${escapeAttr(a.img)}"
             ${a.imgSrcset ? `srcset="${escapeAttr(a.imgSrcset)}" sizes="(max-width:600px) 100vw, (max-width:900px) 50vw, 300px"` : ''}
             alt="${escapeAttr(a.alt)}" loading="lazy" decoding="async"
             width="600" height="750" onerror="this.src='../images/placeholder.jpg'">
        ${a.status !== 'sold' ? `<button type="button" class="shop-item__cart-btn" aria-label="Add to cart — inquire via WhatsApp"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg></button>` : ''}
        </div>

        ${a.status === 'sold' ? '<div class="sold-badge"></div>' : ''}

        <div class="shop-meta">
          <span>${escapeHtml(a.title)}</span>
          ${a.price ? `<span class="price">${fmtPrice(a.price)}</span>` : ""}
        </div>
      </div>
    `;
    }).join("");

    // Initialize modal/gallery
    if (window.initShopItems) window.initShopItems();
  }

  // Load artworks
  loadArtworks();

  // ---------------------------
  // FILTER BUTTONS
  // ---------------------------
  pills.forEach(btn => {
    btn.addEventListener("click", () => {
      pills.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      render(btn.dataset.filter);
    });
  });
});
