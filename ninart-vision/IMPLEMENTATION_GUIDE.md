# Complete Implementation Guide: Artists Page Setup

## ✅ Schema Changes (Already Completed)

The `artistSection` schema now supports three modes:
- ✓ **`manual`** - Hand-pick specific artists
- ✓ **`featured`** - Fetch artists with `featured == true`
- ✓ **`all`** - Fetch all artists, no filter, sorted alphabetically

Schema deployed successfully ✓

---

## 📋 Part 1: Sanity Studio Configuration Steps

### Step 1: Configure Homepage (Featured Artists Only)

1. Open **Sanity Studio** in your browser
2. Navigate to **"Homepage"** document
3. Find or add an **Artist Section** in the content
4. Configure the section:
   - **Section Title**: `"Featured Artists"`
   - **Description**: `"Discover our curated selection of featured artists"`
   - **Artist Source**: Select **"Featured Artists"** ⭐
   - **Layout**: Choose your preferred layout (grid/list/carousel)
   - **Show Biography**: Toggle as desired
   - **Number of Artists to Show**: Leave empty for all featured, or set a limit (e.g., 6)
   - **Enabled**: ✓ (checked)
5. **Save** and **Publish**

### Step 2: Create/Configure Artists Page (All Artists)

1. In Sanity Studio, navigate to **"Pages"**
2. Either create a new page or find existing page with slug "artists"
3. Click **"Create"** (if new) or **Edit** (if exists)
4. Configure the page:
   - **Page Title**: `"Artists"`
   - **Slug**: `artists` (must be exactly this)
   - **SEO Meta Title**: `"All Artists - Ninart Vision"`
   - **SEO Meta Description**: `"Browse our complete collection of artists"`
5. In the **Page Content** section, add an **Artist Section**
6. Configure the Artist Section:
   - **Section Title**: `"Our Artists"` or `"All Artists"`
   - **Description**: `"Explore our complete roster of talented artists"`
   - **Artist Source**: Select **"All Artists"** 🆕
   - **Layout**: Choose your preferred layout (grid recommended)
   - **Show Biography**: Toggle as desired
   - **Number of Artists to Show**: Leave empty to show ALL artists
   - **Enabled**: ✓ (checked)
7. **Save** and **Publish**

---

## 📝 Part 2: GROQ Queries for Frontend

### Query 1: Homepage Query (Featured Artists Only)

**File**: `sanity/lib/queries.ts` or wherever you define queries

```typescript
import { defineQuery } from 'next-sanity'

export const HOMEPAGE_QUERY = defineQuery(`
  *[_type == "homepage"][0]{
    title,
    seo{
      metaTitle,
      metaDescription,
      ogImage{
        asset->{
          _id,
          url,
          metadata{lqip, dimensions}
        }
      }
    },
    content[enabled == true]{
      _type,
      _key,
      
      // Artist Section
      _type == "artistSection" => {
        title,
        description,
        layout,
        artistSource,
        showBio,
        
        // Manual selection
        artistSource == "manual" => {
          artists[]->{
            _id,
            name,
            slug,
            bio,
            image{
              asset->{
                _id,
                url,
                metadata{lqip, dimensions}
              },
              alt
            }
          }
        },
        
        // FEATURED ARTISTS ONLY (for homepage)
        artistSource == "featured" => {
          "artists": *[_type == "artist" && featured == true][0...^.limit]{
            _id,
            name,
            slug,
            bio,
            image{
              asset->{
                _id,
                url,
                metadata{lqip, dimensions}
              },
              alt
            }
          }
        }
      },
      
      // ... other section types (heroSection, gallerySection, etc.)
    }
  }
`)
```

### Query 2: Artists Page Query (All Artists)

**File**: `sanity/lib/queries.ts` or `app/artists/page.tsx`

```typescript
import { defineQuery } from 'next-sanity'

export const ARTISTS_PAGE_QUERY = defineQuery(`
  *[_type == "page" && slug.current == "artists"][0]{
    title,
    seo{
      metaTitle,
      metaDescription,
      ogImage{
        asset->{
          _id,
          url,
          metadata{lqip, dimensions}
        }
      }
    },
    content[enabled == true]{
      _type,
      _key,
      
      // Artist Section
      _type == "artistSection" => {
        title,
        description,
        layout,
        artistSource,
        showBio,
        
        // Manual selection
        artistSource == "manual" => {
          artists[]->{
            _id,
            name,
            slug,
            bio,
            image{
              asset->{
                _id,
                url,
                metadata{lqip, dimensions}
              },
              alt
            }
          }
        },
        
        // ALL ARTISTS - No filter, alphabetically sorted
        artistSource == "all" => {
          "artists": *[_type == "artist"] | order(name asc)[0...^.limit]{
            _id,
            name,
            slug,
            bio,
            image{
              asset->{
                _id,
                url,
                metadata{lqip, dimensions}
              },
              alt
            }
          }
        },
        
        // Featured option (optional, if you want this on artists page too)
        artistSource == "featured" => {
          "artists": *[_type == "artist" && featured == true][0...^.limit]{
            _id,
            name,
            slug,
            bio,
            image{
              asset->{
                _id,
                url,
                metadata{lqip, dimensions}
              },
              alt
            }
          }
        }
      },
      
      // ... other section types
    }
  }
`)
```

### Query 3: Generic Dynamic Page Query

**File**: `sanity/lib/queries.ts`

If you use a single dynamic page query for all pages:

```typescript
export const PAGE_QUERY = defineQuery(`
  *[_type == "page" && slug.current == $slug][0]{
    title,
    slug,
    seo{
      metaTitle,
      metaDescription,
      ogImage{
        asset->{_id, url, metadata{lqip, dimensions}}
      }
    },
    content[enabled == true]{
      _type,
      _key,
      
      _type == "artistSection" => {
        title,
        description,
        layout,
        artistSource,
        showBio,
        
        artistSource == "manual" => {
          artists[]->{
            _id, name, slug, bio,
            image{asset->{_id, url, metadata{lqip, dimensions}}, alt}
          }
        },
        
        artistSource == "all" => {
          "artists": *[_type == "artist"] | order(name asc)[0...^.limit]{
            _id, name, slug, bio,
            image{asset->{_id, url, metadata{lqip, dimensions}}, alt}
          }
        },
        
        artistSource == "featured" => {
          "artists": *[_type == "artist" && featured == true][0...^.limit]{
            _id, name, slug, bio,
            image{asset->{_id, url, metadata{lqip, dimensions}}, alt}
          }
        }
      },
      
      // ... other sections
    }
  }
`)
```

---

## 💻 Part 3: Frontend Code Changes

### Option A: Using Existing PageBuilder Component

If you already have a `PageBuilder` component that renders sections, **no changes needed**! The component will automatically handle the new `all` artist source because:

1. The GROQ query returns an `artists` array regardless of source
2. Your existing `ArtistSection` component just maps over `artists`
3. The filtering happens at the query level, not the component level

### Option B: If You Need to Update TypeScript Types

**File**: `sanity/types.ts` or auto-generated types

After adding the queries, regenerate types:

```bash
npx sanity@latest typegen generate
```

This will create proper TypeScript types including the new `artistSource: "all"` option.

### Option C: Sample Artists Page Component (Next.js App Router)

**File**: `app/artists/page.tsx`

```typescript
import { client } from '@/sanity/lib/client'
import { ARTISTS_PAGE_QUERY } from '@/sanity/lib/queries'
import { PageBuilder } from '@/components/PageBuilder'
import type { ARTISTS_PAGE_QUERYResult } from '@/sanity/types'

export default async function ArtistsPage() {
  const page = await client.fetch<ARTISTS_PAGE_QUERYResult>(
    ARTISTS_PAGE_QUERY,
    {},
    { next: { revalidate: 60 } } // Revalidate every 60 seconds
  )
  
  if (!page) {
    return <div>Artists page not found</div>
  }

  return <PageBuilder content={page.content} />
}

export async function generateMetadata() {
  const page = await client.fetch<ARTISTS_PAGE_QUERYResult>(ARTISTS_PAGE_QUERY)
  
  return {
    title: page?.seo?.metaTitle || page?.title || 'Artists',
    description: page?.seo?.metaDescription || 'Browse all our artists',
    openGraph: {
      title: page?.seo?.metaTitle || 'Artists - Ninart Vision',
      description: page?.seo?.metaDescription,
      images: page?.seo?.ogImage?.asset?.url 
        ? [page.seo.ogImage.asset.url] 
        : []
    }
  }
}
```

### Option D: Sample Homepage Component (Next.js App Router)

**File**: `app/page.tsx`

```typescript
import { client } from '@/sanity/lib/client'
import { HOMEPAGE_QUERY } from '@/sanity/lib/queries'
import { PageBuilder } from '@/components/PageBuilder'
import type { HOMEPAGE_QUERYResult } from '@/sanity/types'

export default async function HomePage() {
  const homepage = await client.fetch<HOMEPAGE_QUERYResult>(
    HOMEPAGE_QUERY,
    {},
    { next: { revalidate: 60 } }
  )
  
  if (!homepage) {
    return <div>Homepage not found</div>
  }

  return <PageBuilder content={homepage.content} />
}

export async function generateMetadata() {
  const homepage = await client.fetch<HOMEPAGE_QUERYResult>(HOMEPAGE_QUERY)
  
  return {
    title: homepage?.seo?.metaTitle || 'Ninart Vision',
    description: homepage?.seo?.metaDescription || 'Art Platform',
    openGraph: {
      images: homepage?.seo?.ogImage?.asset?.url 
        ? [homepage.seo.ogImage.asset.url] 
        : []
    }
  }
}
```

---

## 🔍 Part 4: Verification Checklist

### In Sanity Studio:

- [ ] Homepage has Artist Section with **artistSource = "featured"**
- [ ] Artists Page exists with slug **"artists"**
- [ ] Artists Page has Artist Section with **artistSource = "all"**
- [ ] Page titles are correct (Homepage: "Featured Artists", Artists Page: "Artists")
- [ ] Both sections are **enabled**

### In Frontend:

- [ ] Homepage query includes `artistSource == "featured"` branch
- [ ] Artists page query includes `artistSource == "all"` branch
- [ ] TypeScript types regenerated (if using `typegen`)
- [ ] Homepage displays only artists with `featured: true`
- [ ] Artists page displays ALL artists
- [ ] Artists page sorts alphabetically by name
- [ ] Navigation link `/artists` works correctly
- [ ] Individual artist links work: `/artists/{slug}`
- [ ] No layout or styling broken

### Test Data:

- [ ] Create at least 3 artists with `featured: true`
- [ ] Create at least 2 artists with `featured: false`
- [ ] Homepage should show 3 artists (featured only)
- [ ] Artists page should show 5 artists (all)

---

## 🎯 Quick Summary

| **Page** | **Artist Source** | **GROQ Filter** | **What Shows** |
|----------|------------------|-----------------|----------------|
| **Homepage** | `featured` | `featured == true` | Only featured artists |
| **Artists Page** | `all` | No filter | ALL artists (A-Z) |

### Key Query Differences:

```groq
// HOMEPAGE (Featured only)
artistSource == "featured" => {
  "artists": *[_type == "artist" && featured == true][0...^.limit]{...}
}

// ARTISTS PAGE (All artists)
artistSource == "all" => {
  "artists": *[_type == "artist"] | order(name asc)[0...^.limit]{...}
}
```

---

## 🚨 Important Notes

1. **No Breaking Changes**: Existing layouts, styles, and navigation remain unchanged
2. **Schema Already Deployed**: The `all` option is already available in Studio
3. **Backward Compatible**: Existing `manual` and `featured` modes still work
4. **Sorting**: `all` mode sorts alphabetically by name for consistency
5. **Limit Field**: Leave empty to show all, or set a number to limit results
6. **TypeScript**: Run `npx sanity@latest typegen generate` after updating queries

---

## 🆘 Troubleshooting

**Problem**: "All Artists" option not showing in Studio
- **Solution**: Run `npx sanity@latest schema deploy` again

**Problem**: Artists page shows featured only
- **Solution**: Check Artist Section → ensure "Artist Source" is set to "All Artists"

**Problem**: TypeScript errors in frontend
- **Solution**: Run `npx sanity@latest typegen generate`

**Problem**: Artists not sorted alphabetically
- **Solution**: Verify query includes `| order(name asc)`

**Problem**: Page not found at /artists
- **Solution**: Ensure page document has slug.current = "artists" (exactly)
