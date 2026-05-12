/**
 * ============================================================
 * SANITY IMAGE OPTIMIZATION UTILITY
 * ============================================================
 * Generates performance-optimized image URLs via the Sanity CDN.
 *
 * Features enabled:
 *  - Auto WebP / AVIF  (?auto=format — browser picks best codec)
 *  - Responsive srcSet strings for <img sizes="…"> / next/image
 *  - Hotspot-aware focal-point cropping
 *  - Configurable quality (default 80)
 *  - LQIP blur-up placeholder access
 *  - Explicit width / height for CLS prevention
 *
 * Usage in Next.js frontend:
 *   import { buildSanityImageUrl, buildSanityImageSrcSet, imagePresets } from '@/lib/sanityImage'
 *
 * IMPORTANT — add Sanity CDN to next.config.js:
 *   images: {
 *     remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io' }],
 *   }
 * ============================================================
 */

import imageUrlBuilder from '@sanity/image-url'
import type {SanityImageSource} from '@sanity/image-url'

// ── Project config ──────────────────────────────────────────
const PROJECT_ID = '8t5h923j'
const DATASET = 'production'

const builder = imageUrlBuilder({projectId: PROJECT_ID, dataset: DATASET})

function urlFor(source: SanityImageSource) {
  return builder.image(source)
}

// ── Shared types ────────────────────────────────────────────

export type SanityImageAsset = {
  _id?: string
  /** Kept so @sanity/image-url can resolve the CDN path without a round-trip fetch */
  _ref?: string
  url?: string
  metadata?: {
    dimensions?: {
      width: number
      height: number
      aspectRatio: number
    }
    /** Low-Quality Image Placeholder – base64 data URI, ~200 bytes */
    lqip?: string
  }
}

export type SanityImageField = {
  asset?: SanityImageAsset
  /** Hotspot focal point (0–1 range, origin top-left). Sanity may return null. */
  hotspot?: {x: number; y: number; width: number; height: number} | null
  /** Crop margins (0–1 range). Sanity may return null. */
  crop?: {top: number; bottom: number; left: number; right: number} | null
  alt?: string | null
  title?: string | null
}

export type BuildImageOptions = {
  width?: number
  height?: number
  /** 1–100, default 80 */
  quality?: number
  fit?: 'clip' | 'crop' | 'fill' | 'fillmax' | 'max' | 'scale' | 'min'
}

// ── Core URL builder ────────────────────────────────────────

/**
 * Returns a single optimized image URL.
 * Always appends ?auto=format so browsers receive WebP/AVIF automatically.
 *
 * @example
 *   buildSanityImageUrl(image, { width: 800, quality: 85 })
 */
export function buildSanityImageUrl(
  image: SanityImageField,
  options: BuildImageOptions = {},
): string {
  if (!image?.asset) return ''

  const {width, height, quality = 80, fit = 'crop'} = options

  // Pass the full image object so the builder can apply hotspot / crop
  let b = urlFor(image as SanityImageSource).auto('format').quality(quality).fit(fit)

  if (width) b = b.width(width)
  if (height) b = b.height(height)

  return b.url()
}

// ── srcSet builder ──────────────────────────────────────────

/** Default responsive breakpoints (px widths) */
const DEFAULT_BREAKPOINTS = [320, 480, 640, 768, 1024, 1280, 1536, 1920]

/**
 * Generates a `srcset` string for responsive images.
 * Skips widths larger than 1.5× the source image to avoid upscaling artefacts.
 *
 * @example
 *   // In a standard <img> tag:
 *   <img
 *     src={buildSanityImageUrl(image, { width: 800 })}
 *     srcSet={buildSanityImageSrcSet(image)}
 *     sizes="(max-width: 768px) 100vw, 50vw"
 *     width={image.asset?.metadata?.dimensions?.width}
 *     height={image.asset?.metadata?.dimensions?.height}
 *   />
 */
export function buildSanityImageSrcSet(
  image: SanityImageField,
  options: {
    breakpoints?: number[]
    /** Fix the height by an aspect ratio (w / aspectRatio = h) */
    aspectRatio?: number
    quality?: number
  } = {},
): string {
  if (!image?.asset) return ''

  const {breakpoints = DEFAULT_BREAKPOINTS, quality = 80, aspectRatio} = options

  const originalWidth = image.asset?.metadata?.dimensions?.width

  return breakpoints
    .filter((w) => !originalWidth || w <= originalWidth * 1.5)
    .map((w) => {
      let b = urlFor(image as SanityImageSource)
        .auto('format')
        .quality(quality)
        .fit('crop')
        .width(w)

      if (aspectRatio) {
        b = b.height(Math.round(w / aspectRatio))
      }

      return `${b.url()} ${w}w`
    })
    .join(', ')
}

// ── Dimension helpers ───────────────────────────────────────

/**
 * Returns the stored image dimensions.
 * Use these as the `width` / `height` on <img> or next/image to prevent CLS.
 */
export function getImageDimensions(image: SanityImageField): {
  width: number | null
  height: number | null
  aspectRatio: number | null
} {
  const d = image?.asset?.metadata?.dimensions
  return {
    width: d?.width ?? null,
    height: d?.height ?? null,
    aspectRatio: d?.aspectRatio ?? null,
  }
}

/**
 * Returns the Low-Quality Image Placeholder data URI for blur-up effect.
 * Pass to Next.js `blurDataURL` or use as a CSS background while the full
 * image loads.
 */
export function getBlurDataUrl(image: SanityImageField): string | undefined {
  return image?.asset?.metadata?.lqip
}

// ── Ready-to-use presets ────────────────────────────────────

/**
 * Pre-configured image presets for common contexts.
 * Each function returns { src, srcSet, width, height, blurDataURL }.
 *
 * @example
 *   const img = imagePresets.artworkCard(artwork.image)
 *   <Image src={img.src} srcSet={img.srcSet} width={img.width} height={img.height}
 *          placeholder="blur" blurDataURL={img.blurDataURL} />
 */
export const imagePresets = {
  /**
   * Artist card avatar – 1:1, shown in grids and listings.
   * Rendered at ≤300 px; srcSet up to 600 px for hi-DPI screens.
   */
  artistCard(image: SanityImageField) {
    return {
      src: buildSanityImageUrl(image, {width: 300, height: 300, fit: 'crop'}),
      srcSet: buildSanityImageSrcSet(image, {
        breakpoints: [150, 300, 450, 600],
        aspectRatio: 1,
      }),
      sizes: '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw',
      width: 300,
      height: 300,
      blurDataURL: getBlurDataUrl(image),
    }
  },

  /**
   * Artist detail hero – larger portrait shown on the artist profile page.
   * Rendered at ≤600 px wide on desktop.
   */
  artistHero(image: SanityImageField) {
    return {
      src: buildSanityImageUrl(image, {width: 600, height: 600, fit: 'crop'}),
      srcSet: buildSanityImageSrcSet(image, {
        breakpoints: [300, 450, 600, 900, 1200],
        aspectRatio: 1,
      }),
      sizes: '(max-width: 768px) 100vw, 33vw',
      width: 600,
      height: 600,
      blurDataURL: getBlurDataUrl(image),
    }
  },

  /**
   * Artwork card thumbnail – 3:4 portrait ratio used in artwork grids.
   */
  artworkCard(image: SanityImageField) {
    return {
      src: buildSanityImageUrl(image, {width: 400, height: 533, fit: 'crop'}),
      srcSet: buildSanityImageSrcSet(image, {
        breakpoints: [200, 300, 400, 600, 800],
        aspectRatio: 400 / 533,
      }),
      sizes: '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw',
      width: 400,
      height: 533,
      blurDataURL: getBlurDataUrl(image),
    }
  },

  /**
   * Artwork full/modal view – high-fidelity large image.
   */
  artworkFull(image: SanityImageField) {
    const dims = getImageDimensions(image)
    const w = Math.min(dims.width ?? 1200, 1200)
    const h = dims.height ? Math.round((dims.height / (dims.width ?? w)) * w) : undefined
    return {
      src: buildSanityImageUrl(image, {width: w, height: h, quality: 85}),
      srcSet: buildSanityImageSrcSet(image, {
        breakpoints: [480, 768, 1024, 1200],
        quality: 85,
      }),
      sizes: '(max-width: 768px) 100vw, 80vw',
      width: w,
      height: h ?? w,
      blurDataURL: getBlurDataUrl(image),
    }
  },

  /**
   * Homepage / page-builder hero section – full-width banner.
   */
  hero(image: SanityImageField) {
    const dims = getImageDimensions(image)
    return {
      src: buildSanityImageUrl(image, {width: 1920, quality: 85}),
      srcSet: buildSanityImageSrcSet(image, {
        breakpoints: [640, 960, 1280, 1536, 1920],
        quality: 85,
      }),
      sizes: '100vw',
      width: dims.width ?? 1920,
      height: dims.height ?? 1080,
      blurDataURL: getBlurDataUrl(image),
    }
  },

  /**
   * Open Graph / social-share image – always 1200×630.
   */
  ogImage(image: SanityImageField) {
    return {
      src: buildSanityImageUrl(image, {width: 1200, height: 630, fit: 'crop', quality: 85}),
      width: 1200,
      height: 630,
    }
  },
} as const
