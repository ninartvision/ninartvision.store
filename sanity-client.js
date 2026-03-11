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
      seoTitle,
      seoDescription
    }`;

    const url = `https://${SANITY_CONFIG.projectId}.apicdn.sanity.io/v${SANITY_CONFIG.apiVersion}/data/query/${SANITY_CONFIG.dataset}?query=${encodeURIComponent(query)}`;

    const res = await fetch(url);
    const data = await res.json();

    return data.result || [];
  } catch (err) {
    console.error('❌ fetchArtistsFromSanity error:', err);
    return [];
  }
}

/* --------------------------------------------------
   FETCH SINGLE ARTIST
-------------------------------------------------- */
async function fetchArtistBySlug(identifier) {
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
      seoTitle,
      seoDescription
    }`;

    const url = `https://${SANITY_CONFIG.projectId}.apicdn.sanity.io/v${SANITY_CONFIG.apiVersion}/data/query/${SANITY_CONFIG.dataset}?query=${encodeURIComponent(query)}`;

    const res = await fetch(url);
    const data = await res.json();

    return data.result || null;
  } catch (err) {
    console.error('❌ fetchArtistBySlug error:', err);
    return null;
  }
}

/* --------------------------------------------------
   FETCH FEATURED ARTWORKS (MANUAL ORDER WORKS HERE)
-------------------------------------------------- */
async function fetchFeaturedArtworks(limit = null) {
  try {
    let query = `
      *[
        _type == "artwork" &&
        featured == true &&
        (!defined(status) || status in ["published", "sold"])
      ]
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

    return data.result || [];
  } catch (err) {
    console.error('❌ fetchFeaturedArtworks error:', err);
    return [];
  }
}

/* --------------------------------------------------
   EXPOSE GLOBAL FUNCTIONS
-------------------------------------------------- */
window.fetchArtistsFromSanity = fetchArtistsFromSanity;
window.fetchArtistBySlug = fetchArtistBySlug;
window.fetchFeaturedArtworks = fetchFeaturedArtworks;
window.sanityImgUrl = sanityImgUrl;
window.sanitySrcset = sanitySrcset;
