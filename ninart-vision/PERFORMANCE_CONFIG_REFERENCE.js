/**
 * ============================================================
 * NEXT.JS PERFORMANCE CONFIGURATION REFERENCE
 * ============================================================
 * Copy the relevant sections into your Next.js project's
 * next.config.js / next.config.ts and related files.
 *
 * Targets a Lighthouse mobile score ≥ 90 by addressing:
 *  ✓ Largest Contentful Paint (LCP)
 *  ✓ Cumulative Layout Shift (CLS)
 *  ✓ Unused CSS / JS (code splitting + tree-shaking)
 *  ✓ Render-blocking resources
 *  ✓ Static asset caching
 *  ✓ Network payload reduction (compression, image sizing)
 * ============================================================
 */

// ── 1. next.config.js ───────────────────────────────────────
// Place this file at the root of your Next.js project.

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── Image optimisation ─────────────────────────────
  // Allows Next.js to proxy Sanity CDN images through /_next/image,
  // converting them to WebP / AVIF and applying additional resizing.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        // Pattern matches all Sanity CDN image paths
        pathname: '/images/**',
      },
    ],
    // Serve AVIF first (smallest), then WebP, then original format
    formats: ['image/avif', 'image/webp'],
    // Responsive widths next/image uses when generating srcSet
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Extend the CDN cache TTL to 1 year (31536000 s)
    minimumCacheTTL: 31536000,
    // Disable the blurry placeholder for very small images (saves requests)
    dangerouslyAllowSVG: false,
  },

  // ── Compression ────────────────────────────────────
  // Enable gzip/brotli for all server responses
  compress: true,

  // ── Bundle optimisation ────────────────────────────
  // Removed in Next.js 15 (always enabled), but kept here for older versions
  // swcMinify: true,

  // ── Experimental features (Next.js 14+) ───────────
  experimental: {
    // Optimise CSS for production builds (removes unused rules)
    optimizeCss: true,
    // Package-level tree-shaking for known large ESM packages
    optimizePackageImports: ['styled-components', '@sanity/icons', '@sanity/ui'],
  },

  // ── Headers – static asset caching ────────────────
  // Sets long-lived Cache-Control headers on built JS/CSS files.
  // Next.js already does this for /_next/static/ automatically, but this
  // additional rule covers /public/ assets (fonts, icons, OG images, etc.).
  async headers() {
    return [
      {
        // Cache all public static assets for 1 year
        source: '/(:path*\\.(?:js|css|woff2?|ttf|otf|eot|ico|svg|png|jpg|jpeg|webp|avif|gif))',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Short cache for HTML pages (revalidated on every request)
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          // DNS prefetch for Sanity CDN
          {
            key: 'Link',
            value: '<https://cdn.sanity.io>; rel=preconnect, <https://cdn.sanity.io>; rel=dns-prefetch',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig


// ── 2. app/layout.tsx – resource hints ──────────────────────
// Add these <link> tags inside <head> to eliminate render-blocking by
// preloading critical assets and pre-connecting to external origins.
//
// import type { Metadata } from 'next'
//
// export const metadata: Metadata = {
//   // ... your SEO metadata
// }
//
// export default function RootLayout({ children }) {
//   return (
//     <html lang="en">
//       <head>
//         {/* ── Preconnect to Sanity CDN (images load faster) ── */}
//         <link rel="preconnect" href="https://cdn.sanity.io" crossOrigin="anonymous" />
//         <link rel="dns-prefetch" href="https://cdn.sanity.io" />
//
//         {/* ── Preconnect to Google Fonts if used ── */}
//         {/* <link rel="preconnect" href="https://fonts.googleapis.com" /> */}
//         {/* <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" /> */}
//
//         {/* ── Viewport meta (prevents FOUT / layout reflow on mobile) ── */}
//         <meta name="viewport" content="width=device-width, initial-scale=1" />
//       </head>
//       <body>{children}</body>
//     </html>
//   )
// }


// ── 3. LCP optimisation patterns ────────────────────────────
//
// a) Mark the HERO / first visible image with priority={true}
//    (sets fetchpriority="high" + preload <link> in <head>)
//
//    import Image from 'next/image'
//    <Image src={...} priority sizes="100vw" ... />
//
// b) For artwork grids / artist listings, use:
//    priority={index < 4}   ← eager-load the first 4, lazy-load the rest
//
// c) For the featured-artworks carousel on the homepage, set
//    priority on the first slide only and leave the rest lazy.


// ── 4. Reducing render-blocking JS ──────────────────────────
//
// a) Use dynamic() for heavy components loaded below the fold:
//
//    import dynamic from 'next/dynamic'
//    const Modal = dynamic(() => import('@/components/Modal'), { ssr: false })
//    const Gallery = dynamic(() => import('@/components/Gallery'))
//
// b) Load third-party scripts (analytics, chat widgets) with
//    next/script strategy="lazyOnload":
//
//    import Script from 'next/script'
//    <Script src="https://analytics.example.com/script.js" strategy="lazyOnload" />


// ── 5. Font optimisation ─────────────────────────────────────
//
// Use next/font (zero layout shift, subset, self-hosted):
//
//    import { Inter } from 'next/font/google'
//    const inter = Inter({
//      subsets: ['latin'],
//      display: 'swap',       ← FOUT instead of FOIT
//      preload: true,
//    })
//    // Apply: <html className={inter.className}>


// ── 6. CSS – reducing unused rules ──────────────────────────
//
// If using Tailwind CSS, make sure purge/content is configured:
//
//    // tailwind.config.js
//    module.exports = {
//      content: [
//        './app/**/*.{js,ts,jsx,tsx}',
//        './components/**/*.{js,ts,jsx,tsx}',
//      ],
//      // ...
//    }
//
// This removes all unused Tailwind classes at build time.
// Combined with experimental.optimizeCss in next.config above,
// the final CSS bundle is typically < 10 KB gzipped.


// ── 7. Sanity client – CDN + cache-friendly config ───────────
//
// In your sanity/lib/client.ts:
//
//    import { createClient } from '@sanity/client'
//
//    export const client = createClient({
//      projectId: '8t5h923j',
//      dataset: 'production',
//      apiVersion: '2025-01-01',
//
//      // useCdn: true  → serves from the Sanity CDN edge cache
//      //               → responses cached for ~60 s automatically
//      // Set to false only in preview / draft mode
//      useCdn: true,
//
//      // perspectve: 'published'  → only published documents
//      // Avoids returning draft content on the public site
//      perspective: 'published',
//    })
//
//    // Preview client (draft mode only, NOT useCdn)
//    export const previewClient = createClient({
//      projectId: '8t5h923j',
//      dataset: 'production',
//      apiVersion: '2025-01-01',
//      useCdn: false,
//      token: process.env.SANITY_API_READ_TOKEN,
//    })
//
// ── 8. Next.js fetch cache (App Router) ─────────────────────
//
// Use revalidate to cache GROQ responses at the edge:
//
//    // Revalidate the artists list at most once per hour
//    const artists = await client.fetch(ALL_ARTISTS_QUERY, {}, {
//      next: { revalidate: 3600 }
//    })
//
//    // Static page that rarely changes – revalidate once per day
//    const homepage = await client.fetch(HOMEPAGE_QUERY, {}, {
//      next: { revalidate: 86400 }  // 24 h
//    })
//
//    // Dynamic page (detail) – 10 minutes is a good starting point
//    const artist = await client.fetch(ARTIST_DETAIL_QUERY, { slug }, {
//      next: { revalidate: 600 }
//    })
