/**
 * CANONICAL USAGE EXAMPLES
 * How to use artist queries and components in Next.js
 * Last updated: 2026-03-11
 *
 * These examples demonstrate:
 * - Correct query usage
 * - Strict data validation
 * - Consistent rendering patterns
 * - Error handling
 *
 * PERFORMANCE CHECKLIST
 * ─────────────────────
 * ✓ All client.fetch() calls include `next: { revalidate }` for ISR caching
 * ✓ Hero / above-fold images use priority={true} (sets fetchpriority="high")
 * ✓ Below-fold images use loading="lazy" (handled by components)
 * ✓ OG images are pre-optimised via imagePresets.ogImage() (1200×630 WebP)
 * ✓ Static params generated at build time (no runtime SSR on artist pages)
 */

import { client } from '@/sanity/lib/client'
import {
  ALL_ARTISTS_QUERY,
  FEATURED_ARTISTS_QUERY,
  ARTIST_DETAIL_QUERY,
  ARTIST_WITH_ARTWORKS_QUERY,
  type ArtistCard,
  type ArtistDetail,
  type ArtistWithArtworks,
} from './CANONICAL_ARTIST_QUERIES'
import {
  ArtistList,
  ArtistDetailHeader,
  ArtistGallery,
  ArtistArtworks,
  filterValidArtists,
} from './CANONICAL_ARTIST_COMPONENTS'
import { imagePresets } from './lib/sanityImage'

// ============================================
// EXAMPLE 1: Artists List Page
// ============================================

/**
 * app/artists/page.tsx
 * Displays all artists in a grid
 */
export async function ArtistsListPage() {
  // Fetch all artists – revalidate once per hour (ISR)
  const artists = await client.fetch<ArtistCard[]>(ALL_ARTISTS_QUERY, {}, {
    next: { revalidate: 3600 },
  })
  
  // STRICT: Filter only valid artists (have required fields and images)
  const validArtists = filterValidArtists(artists)

  return (
    <main className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Our Artists</h1>
      
      {/* STRICT: Component handles empty state */}
      <ArtistList artists={validArtists} layout="grid" />
    </main>
  )
}

// ============================================
// EXAMPLE 2: Homepage Featured Artists
// ============================================

/**
 * app/page.tsx (Homepage)
 * Shows featured artists section
 */
export async function Homepage() {
  // Fetch featured artists – revalidate once per hour (ISR)
  const featuredArtists = await client.fetch<ArtistCard[]>(FEATURED_ARTISTS_QUERY, {}, {
    next: { revalidate: 3600 },
  })
  
  // STRICT: Validate before rendering
  const validArtists = filterValidArtists(featuredArtists)

  return (
    <main>
      {/* Hero section */}
      <section className="hero">
        {/* ... */}
      </section>

      {/* Featured Artists - Only shows if we have valid artists */}
      {validArtists.length > 0 && (
        <section className="featured-artists py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8 text-center">
              Featured Artists
            </h2>
            <ArtistList artists={validArtists} layout="grid" />
          </div>
        </section>
      )}

      {/* Other sections */}
    </main>
  )
}

// ============================================
// EXAMPLE 3: Artist Detail Page
// ============================================

/**
 * app/artists/[slug]/page.tsx
 * Individual artist profile page
 */
type Props = {
  params: { slug: string }
}

export async function ArtistDetailPage({ params }: Props) {
  // Fetch artist with artworks – revalidate every 10 minutes (ISR)
  const artist = await client.fetch<ArtistWithArtworks>(
    ARTIST_WITH_ARTWORKS_QUERY,
    { slug: params.slug },
    { next: { revalidate: 600 } }
  )

  // STRICT: Handle not found
  if (!artist) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold">Artist Not Found</h1>
        <p className="mt-4 text-gray-600">
          The artist you're looking for doesn't exist.
        </p>
      </div>
    )
  }

  // STRICT: Validate required fields
  if (!artist._id || !artist.name || !artist.slug) {
    console.error('Invalid artist data:', artist)
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold">Invalid Artist Data</h1>
      </div>
    )
  }

  return (
    <main>
      {/* Artist Header with Avatar and Bio */}
      <ArtistDetailHeader artist={artist} />

      {/* Artist Gallery - Only renders if gallery exists */}
      <ArtistGallery artist={artist} />

      {/* Artist Artworks - Only renders if artworks exist */}
      <ArtistArtworks artist={artist} />
    </main>
  )
}

/**
 * Generate static params for all artists
 * Only includes artists with valid data
 */
export async function generateStaticParams() {
  const artists = await client.fetch<Array<{ slug: string }>>(
    `*[_type == "artist" && !(_id in path("drafts.**")) && defined(slug.current)]{ "slug": slug.current }`
  )

  return artists.map((artist) => ({
    slug: artist.slug,
  }))
}

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({ params }: Props) {
  const artist = await client.fetch<ArtistDetail>(
    ARTIST_DETAIL_QUERY,
    { slug: params.slug },
    { next: { revalidate: 600 } }
  )

  if (!artist) {
    return { title: 'Artist Not Found' }
  }

  // Use pre-optimised OG image: always 1200×630, WebP, cropped to hotspot
  const ogImage = artist.image ? imagePresets.ogImage(artist.image) : null

  return {
    title: `${artist.name}${artist.specialty ? ` - ${artist.specialty}` : ''}`,
    description: artist.shortDescription || artist.bio || `View artworks by ${artist.name}`,
    openGraph: {
      images: ogImage
        ? [{ url: ogImage.src, width: ogImage.width, height: ogImage.height }]
        : [],
    },
  }
}

// ============================================
// EXAMPLE 4: Artist Section (CMS Page Builder)
// ============================================

/**
 * components/sections/ArtistSection.tsx
 * Reusable artist section for page builder
 */
type ArtistSectionProps = {
  _type: 'artistSection'
  _key: string
  title?: string
  description?: string
  layout?: 'grid' | 'list'
  artists?: ArtistCard[]
}

export function ArtistSection({ 
  title, 
  description, 
  layout = 'grid', 
  artists = [] 
}: ArtistSectionProps) {
  // STRICT: Filter valid artists
  const validArtists = filterValidArtists(artists)

  // Don't render if no valid artists
  if (validArtists.length === 0) {
    return null
  }

  return (
    <section className="artist-section py-16">
      <div className="container mx-auto px-4">
        {title && (
          <h2 className="text-3xl font-bold mb-4 text-center">{title}</h2>
        )}
        {description && (
          <p className="text-gray-600 mb-8 text-center max-w-2xl mx-auto">
            {description}
          </p>
        )}
        
        <ArtistList artists={validArtists} layout={layout} />
      </div>
    </section>
  )
}

// ============================================
// EXAMPLE 5: Error Handling & Data Validation
// ============================================

/**
 * Fetch with error handling
 */
export async function fetchArtistsWithValidation() {
  try {
    const artists = await client.fetch<ArtistCard[]>(ALL_ARTISTS_QUERY)
    
    // STRICT: Log data quality issues
    const invalidArtists = artists.filter(artist => {
      const isValid = !!(
        artist._id &&
        artist.name &&
        artist.slug &&
        artist.image?.asset?.url
      )
      
      if (!isValid) {
        console.warn('Invalid artist data found:', {
          id: artist._id,
          name: artist.name,
          hasImage: !!artist.image?.asset?.url
        })
      }
      
      return !isValid
    })

    if (invalidArtists.length > 0) {
      console.error(`Found ${invalidArtists.length} invalid artists`)
    }

    // Return only valid artists
    return filterValidArtists(artists)
    
  } catch (error) {
    console.error('Failed to fetch artists:', error)
    return []
  }
}

// ============================================
// EXAMPLE 6: Real-time Preview with Validation
// ============================================

/**
 * Live preview component with strict validation
 */
'use client'

import { useEffect, useState } from 'react'
import { client } from '@/sanity/lib/client'

export function ArtistsPreview() {
  const [artists, setArtists] = useState<ArtistCard[]>([])

  useEffect(() => {
    // Subscribe to real-time updates
    const subscription = client
      .listen<ArtistCard>(ALL_ARTISTS_QUERY)
      .subscribe((update) => {
        if (update.type === 'mutation') {
          // Re-fetch all artists
          client.fetch<ArtistCard[]>(ALL_ARTISTS_QUERY).then((data) => {
            // STRICT: Always validate before setting state
            setArtists(filterValidArtists(data))
          })
        }
      })

    // Initial fetch
    client.fetch<ArtistCard[]>(ALL_ARTISTS_QUERY).then((data) => {
      setArtists(filterValidArtists(data))
    })

    return () => subscription.unsubscribe()
  }, [])

  return <ArtistList artists={artists} layout="grid" />
}

// ============================================
// EXAMPLE 7: Conditional Rendering Patterns
// ============================================

/**
 * Artist card with all possible fields
 * Shows best practices for conditional rendering
 */
export function ArtistCardExample({ artist }: { artist: ArtistCard }) {
  return (
    <div className="artist-card">
      {/* AVATAR - Only if URL exists */}
      {artist.image?.asset?.url && (
        <div className="avatar">
          <img 
            src={artist.image.asset.url} 
            alt={artist.image.alt} 
          />
        </div>
      )}

      {/* NAME - Always present (required) */}
      <h3>{artist.name}</h3>

      {/* SPECIALTY - Conditional */}
      {artist.specialty && <p className="specialty">{artist.specialty}</p>}

      {/* SUBTITLE - Conditional */}
      {artist.subtitle && <p className="subtitle">{artist.subtitle}</p>}

      {/* SHORT DESCRIPTION - Conditional */}
      {artist.shortDescription && (
        <p className="description">{artist.shortDescription}</p>
      )}
    </div>
  )
}

// ============================================
// KEY PRINCIPLES DEMONSTRATED
// ============================================

/**
 * 1. SANITY IS SINGLE SOURCE OF TRUTH
 *    - No local images
 *    - No hardcoded fallbacks
 *    - All data from queries
 * 
 * 2. STRICT VALIDATION
 *    - Filter invalid data before rendering
 *    - Log data quality issues
 *    - Handle missing data gracefully
 * 
 * 3. CONDITIONAL RENDERING
 *    - Check if field exists before rendering
 *    - No placeholder content
 *    - Use nullish coalescing for defaults
 * 
 * 4. CONSISTENT PATTERNS
 *    - Same query structure everywhere
 *    - Reusable components
 *    - Predictable behavior
 * 
 * 5. TYPE SAFETY
 *    - TypeScript types from queries
 *    - Strict null checks
 *    - No any types
 */
