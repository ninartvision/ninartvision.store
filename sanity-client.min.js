/**
 * SANITY CMS CLIENT CONFIGURATION
 * Handles all communication with Sanity CMS
 */

const SANITY_CONFIG = {
  projectId: '8t5h923j',
  dataset: 'production',
  apiVersion: '2025-02-05',
  useCdn: true,           // use CDN for edge caching
  perspective: 'published'
};

/* --------------------------------------------------
   LOCAL STORAGE CACHE
   Reduces redundant API calls on repeat page visits.
   TTL: 6 minutes. Quota / parse errors are ignored
   and fall through to a live fetch automatically.
-------------------------------------------------- */
const CACHE_TTL = 6 * 60 * 1000; // 6 minutes in ms
// DEBUG: cache disabled — set to false to re-enable
const CACHE_BYPASS = true;

function cacheGet(key) {
  if (CACHE_BYPASS) return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) { localStorage.removeItem(key); return null; }
    return data;
  } catch (e) { return null; }
}

function cacheSet(key, data) {
  if (CACHE_BYPASS) return;
  try {
    localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
  } catch (e) { /* storage quota exceeded — skip caching */ }
}

/* --------------------------------------------------
   SANITY IMAGE URL OPTIMIZATION
   Appends ?auto=format (WebP for modern browsers),
   width, height, quality, and fit params to Sanity CDN URLs.
-------------------------------------------------- */
/**
 * @param {string} url       Raw Sanity asset URL
 * @param {{w?:number,h?:number,q?:number,fit?:string,auto?:boolean}} [opts]
 * @returns {string}
 */
function sanityImgUrl(url, opts) {
  if (!url || typeof url !== 'string' || !url.includes('cdn.sanity.io')) return url || '';
  opts = opts || {};
  var w = opts.w, h = opts.h;
  var q = opts.q !== undefined ? opts.q : 80;
  var fit = opts.fit || 'max';
  var auto = opts.auto !== false;
  var base = url.split('?')[0];
  var p = new URLSearchParams();
  if (auto) p.set('auto', 'format');
  if (w) p.set('w', String(w));
  if (h) p.set('h', String(h));
  p.set('q', String(q));
  if ((w || h) && fit !== 'max') p.set('fit', fit);
  return base + '?' + p.toString();
}

/**
 * Generates a srcset string for responsive images.
 * @param {string} url       Raw Sanity asset URL
 * @param {number[]} [widths] Default: [400, 800, 1200]
 * @param {object}  [opts]   Additional sanityImgUrl options
 * @returns {string}
 */
function sanitySrcset(url, widths, opts) {
  if (!url || !url.includes('cdn.sanity.io')) return '';
  widths = widths || [400, 800, 1200];
  opts = opts || {};
  return widths.map(function(w) {
    return sanityImgUrl(url, Object.assign({}, opts, { w: w })) + ' ' + w + 'w';
  }).join(', ');
}

/* --------------------------------------------------
   FETCH ARTISTS
-------------------------------------------------- */
async function fetchArtistsFromSanity(limit = null, featuredOnly = false) {
  const _cKey = `nv_artists_${limit || 'all'}_${featuredOnly ? '1' : '0'}`;
  const _hit = cacheGet(_cKey);
  if (_hit) return _hit;

  try {
    let query = featuredOnly
      ? `*[_type == "artist" && featured == true]`
      : `*[_type == "artist"]`;

    query += ` | order(_createdAt desc)`;

    if (limit) {
      query += `[0...${limit}]`;
    }

    query += `{
      _id,
      name,
      "slug": slug.current,
      shortDescription,
      subtitle,
      image{
        asset->{_id, url, metadata{lqip, dimensions}},
        alt
      },
      gallery[]{
        asset->{_id, url, metadata{lqip, dimensions}},
        alt,
        _key
      },
      bio,
      style,
      status,
      featured,
      whatsapp,
      country,
      "seoTitle": seo.seoTitle,
      "seoDescription": seo.seoDescription
    }`;

    const url = `https://${SANITY_CONFIG.projectId}.apicdn.sanity.io/v${SANITY_CONFIG.apiVersion}/data/query/${SANITY_CONFIG.dataset}?query=${encodeURIComponent(query)}`;

    const res = await fetch(url);
    const data = await res.json();

    const result = data.result || [];
    cacheSet(_cKey, result);
    return result;
  } catch (err) {
    console.error('❌ fetchArtistsFromSanity error:', err);
    return [];
  }
}

/* --------------------------------------------------
   FETCH SINGLE ARTIST
-------------------------------------------------- */
async function fetchArtistBySlug(identifier) {
  const _cKey = `nv_artist_${identifier}`;
  const _hit = cacheGet(_cKey);
  if (_hit) return _hit;

  try {
    const query = `*[
      _type == "artist" &&
      (slug.current == "${identifier}" || _id == "${identifier}")
    ][0]{
      _id,
      name,
      "slug": slug.current,
      shortDescription,
      subtitle,
      image{
        asset->{_id, url, metadata{lqip, dimensions}},
        alt
      },
      gallery[]{
        asset->{_id, url, metadata{lqip, dimensions}},
        alt,
        _key
      },
      bio,
      style,
      status,
      featured,
      whatsapp,
      country,
      "seoTitle": seo.seoTitle,
      "seoDescription": seo.seoDescription,
      "keywords": seo.keywords,
      "ogImageUrl": seo.ogImage.asset->url
    }`;

    const url = `https://${SANITY_CONFIG.projectId}.apicdn.sanity.io/v${SANITY_CONFIG.apiVersion}/data/query/${SANITY_CONFIG.dataset}?query=${encodeURIComponent(query)}`;

    const res = await fetch(url);
    const data = await res.json();

    const result = data.result || null;
    if (result) cacheSet(_cKey, result);
    return result;
  } catch (err) {
    console.error('❌ fetchArtistBySlug error:', err);
    return null;
  }
}

/* --------------------------------------------------
   FETCH FEATURED ARTWORKS (MANUAL ORDER WORKS HERE)
-------------------------------------------------- */
async function fetchFeaturedArtworks(limit = null) {
  const _cKey = `nv_featured_${limit || 'all'}`;
  const _hit = cacheGet(_cKey);
  if (_hit) return _hit;

  try {
    // DEBUG: featured/status filters removed to show all artworks
    let query = `
      *[_type == "artwork"]
      | order(coalesce(order, 999) asc, _createdAt desc)
    `;

    if (limit) {
      query += `[0...${limit}]`;
    }

    query += `{
      _id,
      title,
      order,
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
      showInShop,
      featured,
      "artist": artist->{
        _id,
        name,
        "slug": slug.current
      }
    }`;

    const url = `https://${SANITY_CONFIG.projectId}.apicdn.sanity.io/v${SANITY_CONFIG.apiVersion}/data/query/${SANITY_CONFIG.dataset}?query=${encodeURIComponent(query)}`;

    const res = await fetch(url);
    const data = await res.json();

    const result = data.result || [];
    console.log('[featured] Sanity returned', result.length, 'artworks (debug — no filters)');
    cacheSet(_cKey, result);
    return result;
  } catch (err) {
    console.error('❌ fetchFeaturedArtworks error:', err);
    return [];
  }
}

/* --------------------------------------------------
   FETCH ALL SHOP ARTWORKS
   Used by the shop page — gets every artwork visible in the shop.
   Falls back gracefully to static data.js if this returns empty.
-------------------------------------------------- */
async function fetchShopArtworks(limit = null) {
  const _cKey = `nv_shop_${limit || 'all'}`;
  const _hit = cacheGet(_cKey);
  if (_hit) {
    console.log('[shop] cache hit —', _hit.length, 'artworks');
    return _hit;
  }

  try {
    let query = `
      *[_type == "artwork" && showInShop == true && artist->name == "Nini Mzhavia"]
      | order(coalesce(order, 999) asc, _createdAt desc)
    `;

    if (limit) {
      query += `[0...${limit}]`;
    }

    query += `{
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
      showInShop,
      featured,
      "artist": artist->{
        _id,
        name,
        "slug": slug.current
      }
    }`;

    const url = `https://${SANITY_CONFIG.projectId}.apicdn.sanity.io/v${SANITY_CONFIG.apiVersion}/data/query/${SANITY_CONFIG.dataset}?query=${encodeURIComponent(query)}`;

    const res = await fetch(url);
    const data = await res.json();

    const result = data.result || [];
    console.log('[shop] Sanity returned', result.length, 'Nini Mzhavia artworks');
    if (result.length) cacheSet(_cKey, result);
    return result;
  } catch (err) {
    console.error('❌ fetchShopArtworks error:', err);
    return [];
  }
}

/* --------------------------------------------------
   FETCH ALL ARTWORKS (used by gallery.js)
   Returns every artwork that has an image, sorted by
   manual order then creation date descending.
-------------------------------------------------- */
async function fetchAllArtworks() {
  const _cKey = 'nv_artworks_all';
  const _hit = cacheGet(_cKey);
  if (_hit) return _hit;

  try {
    const query = `
      *[_type == "artwork" && defined(image)]
      | order(order asc, _createdAt desc) {
        _id,
        _createdAt,
        title,
        "img": image.asset->url,
        "lqip": image.asset->metadata.lqip,
        "photos": images[].asset->url,
        medium,
        "size": dimensions,
        price,
        status,
        order,
        description,
        "slug": slug.current,
        featured,
        "seoTitle": seo.seoTitle,
        "seoDescription": seo.seoDescription,
        "keywords": seo.keywords,
        "artist": artist->{
          _id,
          name,
          "slug": slug.current
        }
      }
    `;

    const url = `https://${SANITY_CONFIG.projectId}.apicdn.sanity.io/v${SANITY_CONFIG.apiVersion}/data/query/${SANITY_CONFIG.dataset}?query=${encodeURIComponent(query)}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();

    const result = data.result || [];
    cacheSet(_cKey, result);
    return result;
  } catch (err) {
    console.error('❌ fetchAllArtworks error:', err);
    return [];
  }
}

/* --------------------------------------------------
   DYNAMIC SEO — updateSEO(data)

   Accepts a raw Sanity data object directly.
   Handles both artwork and artist data shapes.
   Creates meta tags if missing from the HTML.
   Caches element references after first lookup.

   Fallback chains:
     TITLE:  seoTitle → title → name → 'Ninart Vision'
     DESC:   seoDescription → shortDescription → default
     IMAGE:  image.asset.url → img (gallery shape)
             → gallery[0].asset.url → photos[0] → og-image.png

   Usage:
     window.updateSEO(artworkData);
     window.updateSEO(artistData);
     window.updateSEO({ title: 'Gallery', imageUrl: '...' });
-------------------------------------------------- */
const _seoRefs = {}; // cached element refs — avoids repeated DOM queries

function updateSEO(data) {
  data = data || {};
  const SITE    = 'Ninart Vision';
  const DEFIMG  = 'https://ninartvision.store/images/og-image.png';
  const DEFDESC = 'Discover original Georgian art on Ninart Vision.';
  const BASE_KW = 'Georgian art, original paintings, contemporary art, Georgian artists, Ninart Vision';
  const SUFFIX  = ' | ' + SITE;            // 16 chars
  const MAX_T   = 60;
  const MAX_D   = 160;

  // --- TITLE fallback chain (≤60 chars) ---
  const rawTitle = data.seoTitle || data.title || data.name || SITE;
  let pageTitle;
  if (rawTitle.includes(SITE)) {
    pageTitle = rawTitle.length > MAX_T
      ? rawTitle.substring(0, MAX_T - 1) + '…'
      : rawTitle;
  } else {
    const maxRaw = MAX_T - SUFFIX.length; // 44 chars budget for the actual title
    const trimmed = rawTitle.length > maxRaw
      ? rawTitle.substring(0, maxRaw - 1) + '…'
      : rawTitle;
    pageTitle = trimmed + SUFFIX;
  }

  // --- DESCRIPTION fallback chain (≤160 chars) ---
  const rawDesc = data.seoDescription || data.shortDescription || DEFDESC;
  const desc = rawDesc.length > MAX_D
    ? rawDesc.substring(0, MAX_D - 1) + '…'
    : rawDesc;

  // --- IMAGE fallback chain ---
  // Handles: explicit imageUrl, artwork (image.asset.url), gallery.js shape (img),
  // artist gallery array (gallery[].asset.url), photos array (photos[])
  const img =
    data.imageUrl ||
    (data.image && data.image.asset && data.image.asset.url) ||
    data.img ||
    (Array.isArray(data.gallery) && data.gallery[0] && data.gallery[0].asset && data.gallery[0].asset.url) ||
    (Array.isArray(data.photos) && data.photos[0]) ||
    DEFIMG;

  // --- KEYWORDS — Sanity array or string + artist name + base site keywords ---
  const kw = (function() {
    var custom = '';
    if (Array.isArray(data.keywords) && data.keywords.length) {
      custom = data.keywords.join(', ');
    } else if (typeof data.keywords === 'string' && data.keywords.trim()) {
      custom = data.keywords.trim();
    }
    var artistName = data.name || (data.artist && data.artist.name) || '';
    if (artistName && !custom.includes(artistName)) {
      custom = custom ? custom + ', ' + artistName : artistName;
    }
    return custom ? custom + ', ' + BASE_KW : BASE_KW;
  })();

  document.title = pageTitle;

  // Get or create a meta element, cache the ref
  function getMeta(cacheKey, attr, attrVal) {
    if (_seoRefs[cacheKey]) return _seoRefs[cacheKey];
    let el = document.querySelector(`meta[${attr}="${attrVal}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, attrVal);
      document.head.appendChild(el);
    }
    _seoRefs[cacheKey] = el;
    return el;
  }

  getMeta('desc',    'name',     'description').setAttribute('content', desc);
  getMeta('kw',      'name',     'keywords').setAttribute('content', kw);
  getMeta('ogt',     'property', 'og:title').setAttribute('content', pageTitle);
  getMeta('ogd',     'property', 'og:description').setAttribute('content', desc);
  getMeta('ogi',     'property', 'og:image').setAttribute('content', img);
  getMeta('twt',     'name',     'twitter:title').setAttribute('content', pageTitle);
  getMeta('twd',     'name',     'twitter:description').setAttribute('content', desc);
  getMeta('twi',     'name',     'twitter:image').setAttribute('content', img);

  // --- CANONICAL URL — inject or update <link rel="canonical"> ---
  if (data.canonicalUrl) {
    var canonEl = document.querySelector('link[rel="canonical"]');
    if (!canonEl) {
      canonEl = document.createElement('link');
      canonEl.rel = 'canonical';
      document.head.appendChild(canonEl);
    }
    canonEl.href = data.canonicalUrl;
  }
}

// Backward-compatible alias
const applySeoMeta = updateSEO;

/* --------------------------------------------------
   UX UTILITIES — Skeleton loaders, empty & error states

   nvSkeleton(el, count)       — replaces el content with shimmer cards
   nvEmpty(el, msg)            — "no results" state with icon
   nvError(el, msg, retryFn)   — error message + optional retry button
-------------------------------------------------- */

function nvSkeleton(el, count) {
  if (!el) return;
  count = count || 8;
  var html = '';
  for (var i = 0; i < count; i++) {
    html += '<div class="nv-skel-card" aria-hidden="true">' +
      '<div class="nv-skeleton nv-skel-img"></div>' +
      '<div class="nv-skel-body">' +
        '<div class="nv-skeleton nv-skel-line"></div>' +
        '<div class="nv-skeleton nv-skel-line s"></div>' +
        '<div class="nv-skeleton nv-skel-line xs"></div>' +
      '</div>' +
    '</div>';
  }
  el.innerHTML = html;
}

function nvEmpty(el, msg) {
  if (!el) return;
  el.innerHTML =
    '<div class="nv-empty">' +
      '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">' +
        '<rect x="3" y="3" width="18" height="18" rx="2"/>' +
        '<path d="M3 9h18M9 21V9"/>' +
      '</svg>' +
      '<p>' + (msg || 'No artworks available') + '</p>' +
    '</div>';
}

function nvError(el, msg, retryFn) {
  if (!el) return;
  el.innerHTML =
    '<div class="nv-error">' +
      '<p>' + (msg || 'Could not load content. Please check your connection.') + '</p>' +
      (retryFn ? '<button class="nv-retry" type="button">Try again</button>' : '') +
    '</div>';
  if (retryFn) {
    el.querySelector('.nv-retry').addEventListener('click', retryFn);
  }
}

/* --------------------------------------------------
   STRUCTURED DATA — injectSchema(type, data)

   Generates and injects Schema.org JSON-LD into <head>.
   Replaces any existing NV-injected schema to prevent duplicates.

   Supported types:
     'artwork'  → schema:VisualArtwork
     'person'   → schema:Person  (artists)
     'article'  → schema:BlogPosting (news posts)

   data: single Sanity object OR array (arrays → @graph block)

   Usage:
     window.injectSchema('person',  artistData);
     window.injectSchema('artwork', artworkData);
     window.injectSchema('article', postsArray);
-------------------------------------------------- */
const _SITE_URL = 'https://ninartvision.store';

function _buildSchema(type, d) {
  if (!d || typeof d !== 'object') return null;

  /* shared image URL — same fallback chain as updateSEO */
  function _img(src, w) {
    var raw = src.imageUrl ||
      (src.image && src.image.asset && src.image.asset.url) ||
      src.img ||
      (Array.isArray(src.gallery) && src.gallery[0] && src.gallery[0].asset && src.gallery[0].asset.url) ||
      (Array.isArray(src.photos) && src.photos[0]) ||
      null;
    return raw ? sanityImgUrl(raw, { w: w || 1200, q: 85 }) : null;
  }

  /* deep-strip null / undefined — keeps JSON-LD clean */
  function _clean(obj) {
    if (obj === null || obj === undefined) return undefined;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) {
      var a = obj.map(_clean).filter(function(v) { return v !== undefined && v !== null; });
      return a.length ? a : undefined;
    }
    var out = {};
    for (var k in obj) {
      var v = _clean(obj[k]);
      if (v !== undefined && v !== null) out[k] = v;
    }
    return Object.keys(out).length ? out : undefined;
  }

  if (type === 'artwork') {
    var availMap = {
      sold:      'https://schema.org/SoldOut',
      published: 'https://schema.org/InStock',
      sale:      'https://schema.org/InStock'
    };
    var avail      = availMap[d.status] || 'https://schema.org/InStock';
    var artworkUrl = d.slug ? (_SITE_URL + '/gallery.html?artwork=' + d.slug) : _SITE_URL;

    return _clean({
      '@context':    'https://schema.org',
      '@type':       'VisualArtwork',
      'name':        d.title || 'Untitled',
      'url':         artworkUrl,
      'creator':     d.artist ? { '@type': 'Person', 'name': d.artist.name } : undefined,
      'image':       _img(d, 1200),
      'artMedium':   d.medium || undefined,
      'dateCreated': d.year ? String(d.year) : undefined,
      'description': d.description || d.shortDescription || undefined,
      'offers':      d.price ? {
        '@type':         'Offer',
        'price':         d.price,
        'priceCurrency': 'GEL',
        'availability':  avail,
        'url':           artworkUrl
      } : (d.status === 'sold' ? {
        '@type':        'Offer',
        'availability': 'https://schema.org/SoldOut'
      } : undefined)
    });
  }

  if (type === 'person') {
    var sameAs = [
      d.whatsapp ? ('https://wa.me/' + d.whatsapp.replace(/\D/g, '')) : null,
      d.instagram || null,
      d.facebook  || null,
      d.website   || null
    ].filter(Boolean);

    return _clean({
      '@context':    'https://schema.org',
      '@type':       'Person',
      'name':        d.name || 'Artist',
      'url':         d.slug ? (_SITE_URL + '/artists/artist.html?artist=' + d.slug) : _SITE_URL,
      'image':       _img(d, 800),
      'description': d.bio || d.shortDescription || undefined,
      'sameAs':      sameAs.length ? sameAs : undefined
    });
  }

  if (type === 'article') {
    /* Extract plain-text excerpt from Sanity Portable Text blocks */
    function _ptText(blocks) {
      if (!Array.isArray(blocks)) return undefined;
      var text = blocks
        .filter(function(b) { return b._type === 'block' && Array.isArray(b.children); })
        .map(function(b) { return b.children.map(function(c) { return c.text || ''; }).join(''); })
        .join(' ');
      return text.trim() || undefined;
    }

    var headline = d.titleEn || d.titleKa || d.title || d.headline || 'News';
    var imgUrl   = _img(d, 1200) || (_SITE_URL + '/images/og-image.png');
    var desc     = d.excerpt || _ptText(d.bodyEn) || _ptText(d.bodyKa) || undefined;

    return _clean({
      '@context':      'https://schema.org',
      '@type':         'BlogPosting',
      'headline':      headline,
      'image':         imgUrl,
      'datePublished': d.publishedAt || d._createdAt || undefined,
      'author':        { '@type': 'Organization', 'name': 'Ninart Vision', 'url': _SITE_URL },
      'description':   desc,
      'publisher': {
        '@type': 'Organization',
        'name':  'Ninart Vision',
        'url':   _SITE_URL,
        'logo':  { '@type': 'ImageObject', 'url': _SITE_URL + '/images/og-image.png' }
      }
    });
  }

  return null;
}

function injectSchema(type, data) {
  /* Remove any schema already injected by this system — one per page */
  var prev = document.querySelector('script[type="application/ld+json"][data-nv-ld]');
  if (prev) prev.remove();

  var items   = Array.isArray(data) ? data : [data];
  var schemas = items.map(function(d) { return _buildSchema(type, d); }).filter(Boolean);
  if (!schemas.length) return;

  var payload;
  if (schemas.length === 1) {
    payload = schemas[0];
  } else {
    /* Multiple items on one page → single @graph block */
    payload = {
      '@context': 'https://schema.org',
      '@graph':   schemas.map(function(s) {
        var copy = Object.assign({}, s);
        delete copy['@context'];
        return copy;
      })
    };
  }

  var el = document.createElement('script');
  el.type = 'application/ld+json';
  el.setAttribute('data-nv-ld', '1');  /* sentinel — prevents double-inject */
  el.textContent = JSON.stringify(payload);
  document.head.appendChild(el);
}

/* --------------------------------------------------
   FETCH SITE SETTINGS (SEO DEFAULTS + BRANDING)
-------------------------------------------------- */
async function fetchSiteSettings() {
  const _cKey = 'nv_site_settings';
  const _hit = cacheGet(_cKey);
  if (_hit) return _hit;

  try {
    const query = `*[_type == "siteSettings"][0]{
      siteName,
      siteDescription,
      "seo": seo{
        seoTitle,
        seoDescription,
        "ogImageUrl": ogImage.asset->url,
        keywords
      }
    }`;

    const url = `https://${SANITY_CONFIG.projectId}.apicdn.sanity.io/v${SANITY_CONFIG.apiVersion}/data/query/${SANITY_CONFIG.dataset}?query=${encodeURIComponent(query)}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();

    const result = data.result || null;
    if (result) cacheSet(_cKey, result);
    return result;
  } catch (err) {
    console.error('❌ fetchSiteSettings error:', err);
    return null;
  }
}

/* --------------------------------------------------
   EXPOSE GLOBAL FUNCTIONS
-------------------------------------------------- */
window.SANITY_CONFIG = SANITY_CONFIG;
window.fetchArtistsFromSanity = fetchArtistsFromSanity;
window.fetchArtistBySlug = fetchArtistBySlug;
window.fetchFeaturedArtworks = fetchFeaturedArtworks;
window.fetchShopArtworks = fetchShopArtworks;
window.fetchAllArtworks = fetchAllArtworks;
window.fetchSiteSettings = fetchSiteSettings;
window.updateSEO = updateSEO;
window.applySeoMeta = updateSEO; // backward-compatible alias
window.sanityImgUrl = sanityImgUrl;
window.sanitySrcset = sanitySrcset;
window.injectSchema = injectSchema;
window.nvSkeleton = nvSkeleton;
window.nvEmpty = nvEmpty;
window.nvError = nvError;
