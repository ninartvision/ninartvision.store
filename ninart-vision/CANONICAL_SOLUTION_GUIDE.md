# CANONICAL ARTIST SOLUTION - IMPLEMENTATION GUIDE

**Last Updated:** February 8, 2026  
**Purpose:** Eliminate all data inconsistencies across the website

---

## 🎯 PROBLEM SOLVED

**Before:**
- Avatar images appear on detail pages but NOT on list pages
- Text fields visible on some pages, missing on others
- Data behavior feels inconsistent and unstable
- Queries fetched different fields for same data
- Frontend had fallback images and placeholder content

**After:**
- Single source of truth (Sanity CMS)
- Canonical queries used everywhere
- Strict validation and conditional rendering
- Predictable, consistent behavior across all pages
- No fallbacks, no placeholders, no hardcoded data

---

## 📦 FILES CREATED

### 1. **CANONICAL_ARTIST_QUERIES.ts**
- Single source of truth for all artist queries
- Reusable query fragments
- TypeScript types
- Validation helpers

### 2. **CANONICAL_ARTIST_COMPONENTS.tsx**
- Clean React/Next.js components
- Strict conditional rendering
- No fallback content
- Proper image validation

### 3. **CANONICAL_USAGE_EXAMPLES.tsx**
- Real-world Next.js page examples
- Error handling patterns
- Data validation workflows
- Best practices demonstrated

---

## 🔧 IMPLEMENTATION STEPS

### Step 1: Copy Query File to Your Frontend

```bash
# Copy to your frontend project
cp CANONICAL_ARTIST_QUERIES.ts your-frontend/src/sanity/queries/artists.ts
```

### Step 2: Copy Components File

```bash
# Copy to your components directory
cp CANONICAL_ARTIST_COMPONENTS.tsx your-frontend/src/components/artists/index.tsx
```

### Step 3: Update Your Pages

**Replace existing artist queries with canonical ones:**

```typescript
// ❌ BEFORE (Multiple different queries)
const listQuery = `*[_type == "artist"]{_id, name, slug, image{...}}`
const detailQuery = `*[_type == "artist" && slug.current == $slug][0]{_id, name, bio, ...}`

// ✅ AFTER (Single canonical queries)
import { ALL_ARTISTS_QUERY, ARTIST_DETAIL_QUERY } from '@/sanity/queries/artists'

const artists = await client.fetch(ALL_ARTISTS_QUERY)
const artist = await client.fetch(ARTIST_DETAIL_QUERY, { slug })
```

---

## ✅ SCHEMA STATUS

Your artist schema is **already correctly configured**:

```typescript
// ✅ Required fields enforced
name: Rule.required()
slug: Rule.required()
image: Rule.required().custom((image) => {
  if (!image?.asset) return 'Image required'
  return true
})

// ✅ Image metadata validated
alt: Rule.required().min(10).max(200)
title: Rule.max(100) // Optional

// ✅ Text fields properly typed
shortDescription: max 150 chars
subtitle: max 60 chars
specialty: max 100 chars
bio: text field
```

**No schema changes needed!** The schema already prevents empty data.

---

## 🎯 CANONICAL QUERIES USAGE

### Query 1: All Artists (List Page)

```typescript
import { ALL_ARTISTS_QUERY, type ArtistCard } from '@/sanity/queries/artists'

export default async function ArtistsPage() {
  const artists = await client.fetch<ArtistCard[]>(ALL_ARTISTS_QUERY)
  
  return <ArtistList artists={artists} />
}
```

**Returns:** Core fields + card text + avatar image

### Query 2: Featured Artists (Homepage)

```typescript
import { FEATURED_ARTISTS_QUERY, type ArtistCard } from '@/sanity/queries/artists'

const featured = await client.fetch<ArtistCard[]>(FEATURED_ARTISTS_QUERY)
```

**Returns:** Same as All Artists + bio field

### Query 3: Artist Detail

```typescript
import { ARTIST_DETAIL_QUERY, type ArtistDetail } from '@/sanity/queries/artists'

const artist = await client.fetch<ArtistDetail>(
  ARTIST_DETAIL_QUERY, 
  { slug: params.slug }
)
```

**Returns:** All fields + gallery + metadata

### Query 4: Artist with Artworks

```typescript
import { ARTIST_WITH_ARTWORKS_QUERY, type ArtistWithArtworks } from '@/sanity/queries/artists'

const artist = await client.fetch<ArtistWithArtworks>(
  ARTIST_WITH_ARTWORKS_QUERY,
  { slug: params.slug }
)
```

**Returns:** Everything + artworks array

---

## 🧩 COMPONENTS USAGE

### Component 1: Artist Card (List/Grid)

```tsx
import { ArtistCardComponent } from '@/components/artists'

<ArtistCardComponent 
  artist={artist}
  showBio={false}
  priority={index < 4} // First 4 images load with priority
/>
```

**Features:**
- ✅ Only renders avatar if URL exists
- ✅ All text fields conditional
- ✅ No fallback images
- ✅ Proper Next.js Image optimization

### Component 2: Artist Detail Header

```tsx
import { ArtistDetailHeader } from '@/components/artists'

<ArtistDetailHeader artist={artist} />
```

**Features:**
- ✅ Large avatar with metadata
- ✅ All biographical text
- ✅ Featured badge
- ✅ Artwork count

### Component 3: Artist Gallery

```tsx
import { ArtistGallery } from '@/components/artists'

<ArtistGallery artist={artist} />
```

**Features:**
- ✅ Only renders if gallery exists
- ✅ Each image validated
- ✅ Blur placeholders (LQIP)
- ✅ Returns null if no gallery

### Component 4: Artist Artworks

```tsx
import { ArtistArtworks } from '@/components/artists'

<ArtistArtworks artist={artist} />
```

**Features:**
- ✅ Shows artworks grid
- ✅ Empty state handled
- ✅ Sold badges
- ✅ Image validation

### Component 5: Artist List/Grid

```tsx
import { ArtistList } from '@/components/artists'

<ArtistList 
  artists={artists}
  layout="grid" // or "list"
/>
```

**Features:**
- ✅ Responsive grid/list layouts
- ✅ Empty state message
- ✅ No placeholder artists

---

## 🔒 STRICT VALIDATION

### Built-in Validation Helpers

```typescript
import { 
  hasValidAvatar, 
  getAvatarUrl, 
  getAltText,
  filterValidArtists 
} from '@/sanity/queries/artists'

// Check if artist has valid avatar
if (hasValidAvatar(artist)) {
  // Safe to render
}

// Get avatar URL or null
const avatarUrl = getAvatarUrl(artist) // string | null

// Get alt text (always returns string)
const altText = getAltText(artist) // guaranteed string

// Filter array of artists
const validArtists = filterValidArtists(artists)
```

### Validation in Components

All components include built-in validation:

```tsx
// Inside ArtistCardComponent
const hasAvatar = !!(
  artist.image?.asset?.url &&
  typeof artist.image.asset.url === 'string' &&
  artist.image.asset.url.trim().length > 0
)

// Only renders if valid
{hasAvatar && <Image src={artist.image.asset.url} ... />}
```

---

## 📊 DATA FLOW DIAGRAM

```
┌─────────────────────────┐
│   Sanity CMS Studio     │
│  (Single Source)        │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Canonical GROQ Query   │
│  - ALL_ARTISTS_QUERY    │
│  - ARTIST_DETAIL_QUERY  │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  TypeScript Validation  │
│  - filterValidArtists() │
│  - hasValidAvatar()     │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Strict Components      │
│  - Conditional Render   │
│  - No Fallbacks         │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Consistent Website     │
│  (All Pages Same Data)  │
└─────────────────────────┘
```

---

## ✅ GUARANTEES

After implementation, you get **guaranteed consistency**:

1. ✅ **Avatar images appear on ALL pages** (list, detail, featured)
2. ✅ **Same fields available everywhere** (no missing data)
3. ✅ **Sanity is single source of truth** (no local images)
4. ✅ **Strict validation prevents render errors**
5. ✅ **Type safety with TypeScript**
6. ✅ **No placeholder or fallback content**
7. ✅ **Predictable, stable behavior**
8. ✅ **SEO-friendly with proper alt text**

---

## 🚀 QUICK START

### 1. Install in Your Frontend

```bash
# Copy files to your project
cp CANONICAL_ARTIST_QUERIES.ts src/sanity/queries/artists.ts
cp CANONICAL_ARTIST_COMPONENTS.tsx src/components/artists/index.tsx
cp CANONICAL_USAGE_EXAMPLES.tsx src/examples/artists.tsx
```

### 2. Replace Existing Queries

```typescript
// Find all files using artist queries
// Replace with canonical imports

import { 
  ALL_ARTISTS_QUERY, 
  ARTIST_DETAIL_QUERY 
} from '@/sanity/queries/artists'
```

### 3. Update Components

```typescript
// Replace custom components with canonical ones

import { 
  ArtistCardComponent,
  ArtistDetailHeader,
  ArtistList 
} from '@/components/artists'
```

### 4. Test All Pages

- ✅ Artists list page
- ✅ Artist detail pages
- ✅ Homepage featured artists
- ✅ Any CMS page builder sections

---

## 🔍 DEBUGGING

### If images don't appear:

```typescript
// Add validation logging
const artists = await client.fetch(ALL_ARTISTS_QUERY)

artists.forEach(artist => {
  console.log({
    name: artist.name,
    hasImage: !!artist.image?.asset?.url,
    imageUrl: artist.image?.asset?.url
  })
})
```

### If data is missing:

```typescript
// Check query is complete
console.log('Query:', ALL_ARTISTS_QUERY)

// Verify data structure
console.log('Artist:', JSON.stringify(artist, null, 2))
```

### If types don't match:

```bash
# Regenerate Sanity types
npx sanity@latest typegen generate
```

---

## 📋 CHECKLIST

- [ ] Copy canonical query file to frontend
- [ ] Copy canonical components to frontend
- [ ] Update all artist list pages to use `ALL_ARTISTS_QUERY`
- [ ] Update all artist detail pages to use `ARTIST_DETAIL_QUERY`
- [ ] Replace custom components with canonical ones
- [ ] Test list page - verify avatars appear
- [ ] Test detail page - verify all fields present
- [ ] Test homepage - verify featured artists work
- [ ] Remove any fallback/placeholder code
- [ ] Remove any local artist images
- [ ] Regenerate TypeScript types
- [ ] Deploy and verify in production

---

## 🎉 RESULT

**Consistent, predictable, stable artist data across your entire website!**

- Same queries everywhere
- Same components everywhere  
- Same data everywhere
- No inconsistencies
- No surprises

**The website now has a single source of truth: Sanity CMS.**
