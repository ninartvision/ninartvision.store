/**
 * STANDARDIZED SANITY GROQ QUERIES
 * Production-ready query patterns with all required fields
 * REAL-TIME MODE: No CDN, immediate updates
 */

const SANITY_API_BASE = 'https://8t5h923j.apicdn.sanity.io/v2025-02-05/data/query/production';

/**
 * Standard artist projection - use this in all artist queries
 */
const ARTIST_PROJECTION = `{
  _id,
  name,
  "slug": slug.current,
  shortDescription,
  subtitle,
  image{
    asset->{
      _id,
      url,
      metadata{lqip, dimensions}
    },
    alt
  },
  gallery[]{
    asset->{
      _id,
      url,
      metadata{lqip, dimensions}
    },
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

/**
 * Standard artwork projection - use this in all artwork queries
 * Filter includes legacy artworks (no status) and published/sold artworks
 */
const ARTWORK_PROJECTION = `{
  _id,
  title,
  "slug": slug.current,
  shortDescription,
  image{
    asset->{
      _id,
      url,
      metadata{lqip, dimensions}
    },
    alt
  },
  images[]{
    asset->{
      _id,
      url,
      metadata{lqip, dimensions}
    },
    alt,
    _key
  },
  year,
  medium,
  "size": dimensions,
  category,
  "desc": description,
  price,
  status,
  featured,
  "artist": artist->{
    _id,
    name,
    "slug": slug.current
  }
}`;

/**
 * Standard status filter for artworks
 * Shows legacy artworks (no status) AND published/sold artworks
 */
const ARTWORK_STATUS_FILTER = '(!defined(status) || status in ["published", "sold"])';

/**
 * Fetch single artist by slug
 */
async function fetchArtistBySlug(slug) {
  const query = `*[_type == "artist" && slug.current == $slug][0]${ARTIST_PROJECTION}`;
  return executeSanityQuery(query, { slug });
}

/**
 * Fetch all artists (with optional filters)
 */
async function fetchArtists(options = {}) {
  const { limit = null, featuredOnly = false } = options;
  
  let query = featuredOnly 
    ? `*[_type == "artist" && featured == true]`
    : `*[_type == "artist"]`;
  
  query += ` | order(_createdAt desc)`;
  
  if (limit) {
    query += `[0...${limit}]`;
  }
  
  query += ARTIST_PROJECTION;
  
  return executeSanityQuery(query);
}

/**
 * Fetch artworks by artist slug
 */
async function fetchArtworksByArtist(artistSlug) {
  const query = `*[_type == "artwork" && artist->slug.current == $artistSlug && ${ARTWORK_STATUS_FILTER}] | order(_createdAt desc)${ARTWORK_PROJECTION}`;
  return executeSanityQuery(query, { artistSlug });
}

/**
 * Fetch featured artworks
 */
async function fetchFeaturedArtworks(limit = null) {
  let query = `*[_type == "artwork" && featured == true && ${ARTWORK_STATUS_FILTER}] | order(_createdAt desc)`;
  
  if (limit) {
    query += `[0...${limit}]`;
  }
  
  query += ARTWORK_PROJECTION;

  return executeSanityQuery(query);
}

/**
 * Execute a GROQ query against the Sanity API with params and cache-busting
 */
async function executeSanityQuery(query, params = {}) {
  try {
    const url = `${SANITY_API_BASE}?query=${encodeURIComponent(query)}`;
    const urlWithParams = params && Object.keys(params).length > 0
      ? `${url}&${new URLSearchParams(Object.entries(params).map(([k, v]) => [`$${k}`, v]))}`
      : url;
    
    const response = await fetch(urlWithParams);
    
    if (!response.ok) {
      throw new Error(`Sanity API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.result;
    
  } catch (error) {
    console.error('❌ Sanity query failed:', error);
    throw error;
  }
}

// ============================================================
// CMS-DRIVEN SITE  —  new content type queries
// Added to support full dynamic rendering without HTML edits.
// ============================================================

/**
 * Fetch the siteSettings singleton (always [0]).
 * Controls: social links, WhatsApp, contact email, banner text, mission.
 */
async function fetchSiteSettings() {
  const query = `*[_type == "siteSettings"][0]{
    facebookUrl,
    instagramUrl,
    whatsappNumber,
    contactEmail,
    clothBannerKa,
    clothBannerEn,
    missionTitle,
    missionTextEn
  }`;
  return executeSanityQuery(query);
}

/**
 * Fetch active hero slides ordered by display order.
 */
async function fetchHeroSlides() {
  const query = `*[_type == "heroSlide" && active != false] | order(order asc){
    _id,
    image{
      asset->{ _id, url, metadata{lqip, dimensions} },
      alt
    },
    altText,
    order
  }`;
  return executeSanityQuery(query);
}

/**
 * Fetch published news posts, newest first.
 * @param {number|null} limit  Optional maximum count
 */
async function fetchNewsPosts(limit = null) {
  let query = `*[_type == "newsPost"] | order(publishedAt desc)`;
  if (limit) query += `[0...${limit}]`;
  query += `{
    _id,
    titleKa,
    titleEn,
    "slug": slug.current,
    publishedAt,
    bodyKa,
    bodyEn
  }`;
  return executeSanityQuery(query);
}

/**
 * Fetch active featured projects ordered by display order.
 */
async function fetchFeaturedProjects() {
  const query = `*[_type == "featuredProject" && active != false] | order(order asc){
    _id,
    titleKa,
    titleEn,
    "slug": slug.current,
    coverImage{
      asset->{ _id, url, metadata{lqip, dimensions} },
      alt
    },
    shortDescEn,
    legacyUrl,
    order
  }`;
  return executeSanityQuery(query);
}

/**
 * Fetch a single featured project by slug (for project.html?p=slug).
 * @param {string} slug
 */
async function fetchProjectBySlug(slug) {
  const query = `*[_type == "featuredProject" && slug.current == $slug][0]{
    _id,
    titleKa,
    titleEn,
    "slug": slug.current,
    coverImage{
      asset->{ _id, url, metadata{lqip, dimensions} },
      alt
    },
    images[]{
      asset->{ _id, url, metadata{lqip, dimensions} },
      alt,
      _key
    },
    shortDescEn,
    bodyKa,
    bodyEn,
    medium,
    "size": dimensions,
    year,
    "artist": artist->{ _id, name, "slug": slug.current }
  }`;
  return executeSanityQuery(query, { slug });
}
