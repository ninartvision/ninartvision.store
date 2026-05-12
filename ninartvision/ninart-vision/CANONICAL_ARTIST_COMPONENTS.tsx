/**
 * CANONICAL ARTIST COMPONENTS
 * Strict conditional rendering with Sanity as single source of truth
 * Last updated: 2026-03-11
 *
 * CRITICAL RULES:
 * 1. NO fallback images - only render if Sanity URL exists
 * 2. NO placeholder content - show null/empty if data missing
 * 3. NO hardcoded data - everything from Sanity
 * 4. Strict type checking on all fields
 *
 * PERFORMANCE
 * -----------
 * All images are served through the Sanity CDN with:
 *  - ?auto=format  → WebP / AVIF per browser capability
 *  - Focal-point cropping via hotspot data
 *  - Correct width + height to prevent CLS
 *  - LQIP blur-up placeholder
 *  - Responsive srcSet + sizes for every breakpoint
 *
 * Requires next.config.js:
 *   images: { remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io' }] }
 */

import Image from 'next/image'
import Link from 'next/link'
import { imagePresets } from './lib/sanityImage'
import type { ArtistCard, ArtistDetail, ArtistWithArtworks } from './CANONICAL_ARTIST_QUERIES'

// ============================================
// ARTIST CARD (List View)
// ============================================

type ArtistCardProps = {
  artist: ArtistCard
  showBio?: boolean
  priority?: boolean
}

/**
 * Artist Card Component
 * Used in: List pages, grid views, carousels
 *
 * STRICT RULES:
 * - Only renders image if valid URL exists
 * - No placeholder or fallback images
 * - All text fields conditional
 *
 * PERFORMANCE:
 * - Uses imagePresets.artistCard() for properly-sized Sanity CDN URL
 * - WebP via ?auto=format, srcSet + sizes for responsive delivery
 * - `priority` on first 4 items (above-fold LCP candidates)
 * - LQIP blur-up placeholder on all others
 */
export function ArtistCardComponent({ artist, showBio = false, priority = false }: ArtistCardProps) {
  // STRICT: Check if avatar URL exists and is valid
  const hasAvatar = !!(
    artist.image?.asset?.url &&
    typeof artist.image.asset.url === 'string' &&
    artist.image.asset.url.trim().length > 0
  )

  // STRICT: Get alt text (guaranteed from schema)
  const altText = artist.image?.alt || `Portrait of ${artist.name}`

  // Pre-built optimised image props from Sanity CDN
  const imgProps = hasAvatar ? imagePresets.artistCard(artist.image) : null

  return (
    <Link
      href={`/artists/${artist.slug}`}
      className="artist-card group block"
    >
      {/* AVATAR - Only renders if URL exists */}
      {imgProps && (
        <div className="artist-avatar relative aspect-square overflow-hidden rounded-full bg-gray-100">
          <Image
            src={imgProps.src}
            alt={altText}
            title={artist.image.title || undefined}
            width={imgProps.width}
            height={imgProps.height}
            sizes={imgProps.sizes}
            placeholder={imgProps.blurDataURL ? 'blur' : 'empty'}
            blurDataURL={imgProps.blurDataURL}
            loading={priority ? undefined : 'lazy'}
            priority={priority}
            className="object-cover transition-transform group-hover:scale-105"
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      )}

      {/* CONTENT - All fields conditional */}
      <div className="artist-info mt-4 text-center">
        {/* Name - Always present (required field) */}
        <h3 className="text-lg font-semibold">{artist.name}</h3>

        {/* Specialty - Optional */}
        {artist.specialty && (
          <p className="mt-1 text-sm text-gray-600">{artist.specialty}</p>
        )}

        {/* Subtitle - Optional */}
        {artist.subtitle && (
          <p className="mt-1 text-sm italic text-gray-500">{artist.subtitle}</p>
        )}

        {/* Short Description - Optional */}
        {artist.shortDescription && (
          <p className="mt-2 text-sm text-gray-700 line-clamp-2">
            {artist.shortDescription}
          </p>
        )}
      </div>
    </Link>
  )
}

// ============================================
// ARTIST DETAIL HEADER
// ============================================

type ArtistDetailHeaderProps = {
  artist: ArtistDetail
}

/**
 * Artist Detail Header
 * Used in: Individual artist pages
 *
 * STRICT RULES:
 * - No fallbacks for missing data
 * - All fields strictly typed and checked
 *
 * PERFORMANCE:
 * - Uses imagePresets.artistHero() — larger size, full srcSet
 * - priority=true because this is always the LCP element on artist pages
 * - fetchPriority="high" hint for the browser's preload scanner
 */
export function ArtistDetailHeader({ artist }: ArtistDetailHeaderProps) {
  const hasAvatar = !!(
    artist.image?.asset?.url &&
    typeof artist.image.asset.url === 'string' &&
    artist.image.asset.url.trim()
  )

  const altText = artist.image?.alt || `Portrait of ${artist.name}`
  const imgProps = hasAvatar ? imagePresets.artistHero(artist.image) : null

  return (
    <header className="artist-header">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">

          {/* AVATAR COLUMN - Only if valid */}
          {imgProps && (
            <div className="md:col-span-1">
              <div className="aspect-square relative overflow-hidden rounded-lg shadow-lg">
                <Image
                  src={imgProps.src}
                  alt={altText}
                  title={artist.image.title || undefined}
                  width={imgProps.width}
                  height={imgProps.height}
                  sizes={imgProps.sizes}
                  placeholder={imgProps.blurDataURL ? 'blur' : 'empty'}
                  blurDataURL={imgProps.blurDataURL}
                  priority
                  className="object-cover"
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            </div>
          )}

          {/* INFO COLUMN */}
          <div className={imgProps ? 'md:col-span-2' : 'md:col-span-3'}>
            {/* Name - Required */}
            <h1 className="text-4xl font-bold">{artist.name}</h1>

            {/* Specialty - Optional */}
            {artist.specialty && (
              <p className="mt-2 text-xl text-gray-600">{artist.specialty}</p>
            )}

            {/* Subtitle - Optional */}
            {artist.subtitle && (
              <p className="mt-1 text-lg italic text-gray-500">{artist.subtitle}</p>
            )}

            {/* Style - Optional */}
            {artist.style && (
              <p className="mt-3 text-sm text-gray-500 uppercase tracking-wide">
                {artist.style}
              </p>
            )}

            {/* Short Description - Optional */}
            {artist.shortDescription && (
              <p className="mt-4 text-lg text-gray-700 font-medium">
                {artist.shortDescription}
              </p>
            )}

            {/* Bio - Optional */}
            {artist.bio && (
              <div className="mt-6 prose max-w-none">
                <p className="text-gray-800 whitespace-pre-wrap">{artist.bio}</p>
              </div>
            )}

            {/* Metadata - Optional */}
            <div className="mt-6 flex gap-4 text-sm text-gray-500">
              {artist.featured && (
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-800">
                  ⭐ Featured Artist
                </span>
              )}
              {typeof artist.artworkCount === 'number' && artist.artworkCount > 0 && (
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800">
                  {artist.artworkCount} {artist.artworkCount === 1 ? 'Artwork' : 'Artworks'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

// ============================================
// ARTIST GALLERY
// ============================================

type ArtistGalleryProps = {
  artist: ArtistDetail
}

/**
 * Artist Gallery
 * Displays artist's additional images
 *
 * STRICT RULES:
 * - Only renders if gallery exists and has items
 * - Each image validated for URL
 *
 * PERFORMANCE:
 * - Lazy-loaded images below the fold
 * - Proper srcSet + sizes for responsive grid
 * - LQIP blur-up placeholder
 */
export function ArtistGallery({ artist }: ArtistGalleryProps) {
  // STRICT: Check if gallery exists and has items
  if (!artist.gallery || artist.gallery.length === 0) {
    return null
  }

  return (
    <section className="artist-gallery py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6">Gallery</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {artist.gallery.map((galleryItem) => {
            // STRICT: Validate each gallery item
            const hasValidImage = !!(
              galleryItem.asset?.url &&
              typeof galleryItem.asset.url === 'string' &&
              galleryItem.asset.url.trim()
            )

            if (!hasValidImage) return null

            const altText = galleryItem.alt || `${artist.name} gallery image`
            const imgProps = imagePresets.artworkCard(galleryItem)

            return (
              <div
                key={galleryItem._key}
                className="aspect-square relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow"
              >
                <Image
                  src={imgProps.src}
                  alt={altText}
                  title={galleryItem.title || undefined}
                  width={imgProps.width}
                  height={imgProps.height}
                  sizes={imgProps.sizes}
                  placeholder={imgProps.blurDataURL ? 'blur' : 'empty'}
                  blurDataURL={imgProps.blurDataURL}
                  loading="lazy"
                  className="object-cover"
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ============================================
// ARTIST ARTWORKS GRID
// ============================================

type ArtistArtworksProps = {
  artist: ArtistWithArtworks
}

/**
 * Artist Artworks Grid
 * Displays artist's artworks
 *
 * STRICT RULES:
 * - Only renders if artworks exist
 * - Each artwork validated for image URL
 *
 * PERFORMANCE:
 * - Lazy-loaded thumbnails (artwork grids are always below the fold)
 * - Proper srcSet + sizes for 2→4 column responsive grid
 * - LQIP blur-up placeholder
 */
export function ArtistArtworks({ artist }: ArtistArtworksProps) {
  // STRICT: Check if artworks exist
  if (!artist.artworks || artist.artworks.length === 0) {
    return (
      <section className="artist-artworks py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">Artworks</h2>
          <p className="text-gray-500 italic">No artworks available yet.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="artist-artworks py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6">
          Artworks ({artist.artworks.length})
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {artist.artworks.map((artwork) => {
            // STRICT: Validate artwork image
            const hasValidImage = !!(
              artwork.image?.asset?.url &&
              typeof artwork.image.asset.url === 'string' &&
              artwork.image.asset.url.trim()
            )

            if (!hasValidImage) return null

            const altText = artwork.image.alt || artwork.title || 'Artwork'
            const imgProps = imagePresets.artworkCard(artwork.image)

            return (
              <div
                key={artwork._id}
                className="artwork-card group cursor-pointer"
              >
                <div className="aspect-[3/4] relative overflow-hidden rounded-lg shadow-md group-hover:shadow-xl transition-shadow">
                  <Image
                    src={imgProps.src}
                    alt={altText}
                    title={artwork.image.title || undefined}
                    width={imgProps.width}
                    height={imgProps.height}
                    sizes={imgProps.sizes}
                    placeholder={imgProps.blurDataURL ? 'blur' : 'empty'}
                    blurDataURL={imgProps.blurDataURL}
                    loading="lazy"
                    className="object-cover"
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>

                {/* Artwork Info */}
                <div className="mt-3">
                  <h3 className="font-semibold text-sm">{artwork.title}</h3>

                  <div className="mt-1 text-xs text-gray-600 space-y-1">
                    {artwork.year && <p>{artwork.year}</p>}
                    {artwork.medium && <p>{artwork.medium}</p>}
                    {artwork.dimensions && <p>{artwork.dimensions}</p>}
                  </div>

                  {/* Price and sold status */}
                  <div className="mt-2 flex items-center text-sm">
                    <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
                    {artwork.status === 'sold' && (
                      <span className="text-red-500 ml-1">sold</span>
                    )}
                    {artwork.price != null && (
                      <span className="ml-2">€{artwork.price}</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ============================================
// ARTIST LIST/GRID
// ============================================

type ArtistListProps = {
  artists: ArtistCard[]
  layout?: 'grid' | 'list'
}

/**
 * Artist List/Grid
 * Used in: Artists page, filtered views
 * 
 * STRICT RULES:
 * - Shows message if no artists
 * - No placeholder artists
 */
export function ArtistList({ artists, layout = 'grid' }: ArtistListProps) {
  // STRICT: Handle empty state
  if (!artists || artists.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 italic">No artists available.</p>
      </div>
    )
  }

  const gridClass = layout === 'grid' 
    ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8'
    : 'space-y-6'

  return (
    <div className={gridClass}>
      {artists.map((artist, index) => (
        <ArtistCardComponent 
          key={artist._id} 
          artist={artist}
          priority={index < 4} // Prioritize first 4 images
        />
      ))}
    </div>
  )
}

// ============================================
// VALIDATION UTILITIES
// ============================================

/**
 * Validate artist data before rendering
 */
export function validateArtistData(artist: ArtistCard | ArtistDetail): boolean {
  // Must have required fields
  if (!artist._id || !artist.name || !artist.slug) {
    console.error('Artist missing required fields:', artist)
    return false
  }

  // Must have valid image
  if (!artist.image?.asset?.url) {
    console.warn('Artist missing image:', artist.name)
    return false
  }

  return true
}

/**
 * Filter valid artists from array
 */
export function filterValidArtists<T extends ArtistCard>(artists: T[]): T[] {
  return artists.filter(validateArtistData)
}
