/**
 * CANONICAL ARTIST QUERIES
 * Single source of truth for artist data fetching
 * Last updated: 2026-03-11
 *
 * CRITICAL RULES:
 * 1. Sanity is the ONLY data source
 * 2. All queries exclude drafts
 * 3. Images must have valid asset URLs
 * 4. No placeholders or fallbacks in queries
 * 5. Missing fields return null (not defaults)
 *
 * PERFORMANCE NOTES
 * -----------------
 * All image projections now include `hotspot` and `crop` so that
 * lib/sanityImage.ts can apply focal-point cropping via the Sanity CDN.
 * The CDN also serves WebP/AVIF automatically when ?auto=format is used.
 */

// ============================================
// BASE QUERY FRAGMENTS
// ============================================

/**
 * Core artist fields (ALWAYS required)
 * Use this as base for all artist queries
 */
const ARTIST_CORE_FIELDS = `
  _id,
  name,
  "slug": slug.current
`

/**
 * Avatar image with full metadata + hotspot/crop for focal-point CDN URLs.
 * CRITICAL: Must check image?.asset?.url in frontend.
 * Pass the full image object (incl. hotspot/crop) to lib/sanityImage.ts.
 */
const ARTIST_AVATAR = `
  image{
    asset->{
      _id,
      url,
      "width": metadata.dimensions.width,
      "height": metadata.dimensions.height,
      "aspectRatio": metadata.dimensions.aspectRatio,
      "lqip": metadata.lqip
    },
    hotspot,
    crop,
    alt,
    title
  }
`

/**
 * Text fields for cards/listings
 */
const ARTIST_CARD_TEXT = `
  shortDescription,
  subtitle,
  specialty
`

/**
 * Extended text fields for detail pages
 */
const ARTIST_DETAIL_TEXT = `
  bio,
  style
`

/**
 * Gallery images with full metadata + hotspot/crop for focal-point CDN URLs.
 */
const ARTIST_GALLERY = `
  gallery[]{
    asset->{
      _id,
      url,
      "lqip": metadata.lqip,
      "width": metadata.dimensions.width,
      "height": metadata.dimensions.height,
      "aspectRatio": metadata.dimensions.aspectRatio
    },
    hotspot,
    crop,
    alt,
    title,
    _key
  }
`

/**
 * Metadata fields
 */
const ARTIST_METADATA = `
  featured,
  status
`

// ============================================
// CANONICAL QUERIES
// ============================================

/**
 * ALL ARTISTS (List Page)
 * Fetches published artists with card-level data
 * 
 * Usage: Artist list/grid pages
 */
export const ALL_ARTISTS_QUERY = `
*[_type == "artist" && status == "published" && !(_id in path("drafts.**"))] | order(name asc){
  ${ARTIST_CORE_FIELDS},
  ${ARTIST_CARD_TEXT},
  ${ARTIST_AVATAR}
}
`

/**
 * FEATURED ARTISTS (Homepage)
 * Fetches featured artists only
 * 
 * Usage: Homepage featured sections
 */
export const FEATURED_ARTISTS_QUERY = `
*[_type == "artist" && featured == true && status == "published" && !(_id in path("drafts.**"))] | order(name asc){
  ${ARTIST_CORE_FIELDS},
  ${ARTIST_CARD_TEXT},
  bio,
  ${ARTIST_AVATAR}
}[0...6]
`

/**
 * SINGLE ARTIST (Detail Page)
 * Fetches complete artist data
 * 
 * Usage: Individual artist detail pages
 * Params: { slug: string }
 */
export const ARTIST_DETAIL_QUERY = `
*[_type == "artist" && slug.current == $slug && status == "published" && !(_id in path("drafts.**"))][0]{
  ${ARTIST_CORE_FIELDS},
  ${ARTIST_CARD_TEXT},
  ${ARTIST_DETAIL_TEXT},
  ${ARTIST_AVATAR},
  ${ARTIST_GALLERY},
  ${ARTIST_METADATA},
  "artworkCount": count(*[_type == "artwork" && artist._ref == ^._id && !(_id in path("drafts.**"))])
}
`

/**
 * ARTIST WITH ARTWORKS (Detail Page + Gallery)
 * Fetches artist with all their artworks
 * 
 * Usage: Artist profile with artwork gallery
 * Params: { slug: string }
 */
export const ARTIST_WITH_ARTWORKS_QUERY = `
*[_type == "artist" && slug.current == $slug && status == "published" && !(_id in path("drafts.**"))][0]{
  ${ARTIST_CORE_FIELDS},
  ${ARTIST_CARD_TEXT},
  ${ARTIST_DETAIL_TEXT},
  ${ARTIST_AVATAR},
  ${ARTIST_GALLERY},
  ${ARTIST_METADATA},
  "artworks": *[_type == "artwork" && artist._ref == ^._id && status in ["published","sold"] && !(_id in path("drafts.**"))] | order(coalesce(order, 999) asc, year desc, _createdAt desc){
    _id,
    title,
    year,
    medium,
    dimensions,
    order,
    status,
    price,
    image{
      asset->{
        _id,
        url,
        "width": metadata.dimensions.width,
        "height": metadata.dimensions.height,
        "aspectRatio": metadata.dimensions.aspectRatio,
        "lqip": metadata.lqip
      },
      hotspot,
      crop,
      alt,
      title
    }
  }
}
`

/**
 * ARTIST SECTION (Page Builder)
 * Supports multiple artist sources
 * 
 * Usage: CMS page builder artist sections
 */
export const ARTIST_SECTION_PROJECTION = `
_type == "artistSection" => {
  title,
  description,
  layout,
  artistSource,
  showBio,
  
  artistSource == "manual" => {
    artists[]->{
      ${ARTIST_CORE_FIELDS},
      ${ARTIST_CARD_TEXT},
      bio,
      ${ARTIST_AVATAR}
    }
  },
  
  artistSource == "featured" => {
    "artists": *[_type == "artist" && featured == true && status == "published" && !(_id in path("drafts.**"))]{
      ${ARTIST_CORE_FIELDS},
      ${ARTIST_CARD_TEXT},
      bio,
      ${ARTIST_AVATAR}
    }[0...^.limit] | order(name asc)
  },
  
  artistSource == "all" => {
    "artists": *[_type == "artist" && status == "published" && !(_id in path("drafts.**"))]{
      ${ARTIST_CORE_FIELDS},
      ${ARTIST_CARD_TEXT},
      ${ARTIST_AVATAR}
    }[0...^.limit] | order(name asc)
  }
}
`

// ============================================
// TYPESCRIPT TYPES
// ============================================

/** Hotspot focal point (values 0–1, origin top-left) */
export type SanityHotspot = {x: number; y: number; width: number; height: number}
/** Crop margins (values 0–1) */
export type SanityCrop = {top: number; bottom: number; left: number; right: number}

/**
 * Artist type for list views
 */
export type ArtistCard = {
  _id: string
  name: string
  slug: string
  shortDescription?: string | null
  subtitle?: string | null
  specialty?: string | null
  image: {
    asset: {
      _id: string
      url: string
      width?: number
      height?: number
      aspectRatio?: number
      lqip?: string
    }
    hotspot?: SanityHotspot | null
    crop?: SanityCrop | null
    alt: string
    title?: string | null
  }
}

/**
 * Artist type for detail views
 */
export type ArtistDetail = ArtistCard & {
  bio?: string | null
  style?: string | null
  featured?: boolean
  status?: 'draft' | 'published' | 'hidden'
  gallery?: Array<{
    asset: {
      _id: string
      url: string
      width?: number
      height?: number
      aspectRatio?: number
      lqip?: string
    }
    hotspot?: SanityHotspot | null
    crop?: SanityCrop | null
    alt: string
    title?: string | null
    _key: string
  }> | null
  artworkCount?: number
}

/**
 * Artist with artworks
 */
export type ArtistWithArtworks = ArtistDetail & {
  artworks?: Array<{
    _id: string
    title: string
    year?: number
    medium?: string
    dimensions?: string
    order?: number
    status?: string
    price?: number | null
    image: {
      asset: {
        _id: string
        url: string
        width?: number
        height?: number
        aspectRatio?: number
        lqip?: string
      }
      hotspot?: SanityHotspot | null
      crop?: SanityCrop | null
      alt?: string
      title?: string
    }
  }> | null
}

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Check if artist has valid avatar image
 */
export function hasValidAvatar(artist: ArtistCard | ArtistDetail): boolean {
  return !!(
    artist.image?.asset?.url &&
    typeof artist.image.asset.url === 'string' &&
    artist.image.asset.url.trim().length > 0
  )
}

/**
 * Get avatar URL or null
 */
export function getAvatarUrl(artist: ArtistCard | ArtistDetail): string | null {
  return hasValidAvatar(artist) ? artist.image.asset.url : null
}

/**
 * Get alt text (guaranteed string)
 */
export function getAltText(artist: ArtistCard | ArtistDetail): string {
  return artist.image?.alt || `Portrait of ${artist.name}`
}
