# Corrected GROQ Queries for Artists

**Updated:** February 8, 2026  
**Purpose:** Fix issues where artist images, titles, and alt text don't appear on website

---

## ✅ Schema Updates Applied

### Artist Image Field (Now REQUIRED)

```typescript
// schemaTypes/artist.ts
defineField({
  name: 'image',
  title: 'Artist Photo',
  type: 'image',
  validation: (Rule) => Rule.required().custom((image) => {
    if (!image?.asset) {
      return 'Artist photo is required. Please upload an image.'
    }
    return true
  }),
  fields: [
    {
      name: 'alt',
      type: 'string',
      title: 'Alternative Text',
      validation: (Rule) => Rule.required().min(10).max(200),
    },
    {
      name: 'title',
      type: 'string',
      title: 'Image Title',
      validation: (Rule) => Rule.max(100),
    },
  ],
})
```

**Key Changes:**
- ✅ Image field is now **required** (was optional)
- ✅ Validates that `asset` exists (prevents empty image objects)
- ✅ Added `title` field for image metadata
- ✅ Alt text has min/max length validation (10-200 characters)

---

## 🎯 Corrected GROQ Queries

### 1. All Artists Query (Artists Page)

```groq
*[_type == "artist" && !(_id in path("drafts.**"))]{
  _id,
  name,
  "slug": slug.current,
  shortDescription,
  specialty,
  subtitle,
  image{
    asset->{
      _id,
      url,
      "width": metadata.dimensions.width,
      "height": metadata.dimensions.height,
      "lqip": metadata.lqip
    },
    alt,
    title
  }
} | order(name asc)
```

**Purpose:** Fetch all published artists for listing page  
**Key Points:**
- Excludes drafts with `!(_id in path("drafts.**"))`
- Fetches `asset->url` for direct image access
- Includes `alt` and `title` fields
- Returns image dimensions and LQIP for optimization

---

### 2. Featured Artists Query (Homepage)

```groq
*[_type == "artist" && featured == true && !(_id in path("drafts.**"))]{
  _id,
  name,
  "slug": slug.current,
  shortDescription,
  specialty,
  subtitle,
  bio,
  image{
    asset->{
      _id,
      url,
      "width": metadata.dimensions.width,
      "height": metadata.dimensions.height,
      "lqip": metadata.lqip
    },
    alt,
    title
  }
}[0...6] | order(name asc)
```

**Purpose:** Fetch featured artists for homepage  
**Key Points:**
- Only published, featured artists
- Includes bio field for homepage cards
- Limits to 6 results

---

### 3. Single Artist Query (Artist Detail Page)

```groq
*[_type == "artist" && slug.current == $slug && !(_id in path("drafts.**"))][0]{
  _id,
  name,
  "slug": slug.current,
  shortDescription,
  specialty,
  subtitle,
  bio,
  style,
  featured,
  status,
  image{
    asset->{
      _id,
      url,
      "width": metadata.dimensions.width,
      "height": metadata.dimensions.height,
      "lqip": metadata.lqip
    },
    alt,
    title
  },
  gallery[]{
    asset->{
      _id,
      url,
      "width": metadata.dimensions.width,
      "height": metadata.dimensions.height,
      "lqip": metadata.lqip
    },
    alt,
    title,
    _key
  },
  "artworks": *[_type == "artwork" && artist._ref == ^._id && !(_id in path("drafts.**"))]{
    _id,
    title,
    year,
    medium,
    image{
      asset->{
        _id,
        url,
        "lqip": metadata.lqip
      },
      alt,
      title
    }
  } | order(year desc)
}
```

**Purpose:** Fetch single artist with all details  
**Key Points:**
- Fetches main image with full metadata
- Fetches gallery images with title and alt
- Includes related artworks
- Uses `$slug` parameter for dynamic queries

---

### 4. Artist Section Query (Page Builder)

```groq
*[_type == "page" && slug.current == $slug][0]{
  title,
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
          _id,
          name,
          "slug": slug.current,
          shortDescription,
          specialty,
          subtitle,
          image{
            asset->{
              _id,
              url,
              "lqip": metadata.lqip
            },
            alt,
            title
          }
        }
      },
      
      artistSource == "featured" => {
        "artists": *[_type == "artist" && featured == true && !(_id in path("drafts.**"))]{
          _id,
          name,
          "slug": slug.current,
          shortDescription,
          specialty,
          subtitle,
          image{
            asset->{
              _id,
              url,
              "lqip": metadata.lqip
            },
            alt,
            title
          }
        }[0...^.limit] | order(name asc)
      },
      
      artistSource == "all" => {
        "artists": *[_type == "artist" && !(_id in path("drafts.**"))]{
          _id,
          name,
          "slug": slug.current,
          shortDescription,
          specialty,
          subtitle,
          image{
            asset->{
              _id,
              url,
              "lqip": metadata.lqip
            },
            alt,
            title
          }
        }[0...^.limit] | order(name asc)
      }
    }
  }
}
```

**Purpose:** Fetch artists for page builder sections  
**Key Points:**
- Supports multiple artist sources (manual, featured, all)
- Excludes bio from "all" source for performance
- Always excludes drafts

---

## 📦 TypeScript Types (Reference)

```typescript
type Artist = {
  _id: string
  name: string
  slug: string
  shortDescription?: string
  specialty?: string
  subtitle?: string
  bio?: string
  style?: string
  featured?: boolean
  status?: 'draft' | 'published' | 'hidden'
  image: {
    asset: {
      _id: string
      url: string
      width?: number
      height?: number
      lqip?: string
    }
    alt: string
    title?: string
  }
  gallery?: Array<{
    asset: {
      _id: string
      url: string
      width?: number
      height?: number
      lqip?: string
    }
    alt: string
    title?: string
    _key: string
  }>
  artworks?: Artwork[]
}
```

---

## 🔧 Frontend Implementation

### React Component (Standard `<img>` Tag)

```tsx
type Artist = {
  _id: string
  name: string
  slug: string
  specialty?: string
  subtitle?: string
  image: {
    asset: {
      url: string
      lqip?: string
    }
    alt: string
    title?: string
  }
}

export function ArtistCard({ artist }: { artist: Artist }) {
  return (
    <div className="artist-card">
      <div className="artist-image">
        <img
          src={artist.image.asset.url}
          alt={artist.image.alt}
          title={artist.image.title}
          loading="lazy"
          width="400"
          height="400"
        />
      </div>
      
      <div className="artist-info">
        <h3>{artist.name}</h3>
        {artist.specialty && <p className="specialty">{artist.specialty}</p>}
        {artist.subtitle && <p className="subtitle">{artist.subtitle}</p>}
      </div>
    </div>
  )
}
```

### Next.js Image Component

```tsx
import Image from 'next/image'

export function ArtistCard({ artist }: { artist: Artist }) {
  return (
    <div className="artist-card">
      <div className="artist-image">
        <Image
          src={artist.image.asset.url}
          alt={artist.image.alt}
          title={artist.image.title}
          width={400}
          height={400}
          placeholder={artist.image.asset.lqip ? 'blur' : 'empty'}
          blurDataURL={artist.image.asset.lqip}
          loading="lazy"
          style={{ objectFit: 'cover' }}
        />
      </div>
      
      <div className="artist-info">
        <h3>{artist.name}</h3>
        {artist.specialty && <p className="specialty">{artist.specialty}</p>}
        {artist.subtitle && <p className="subtitle">{artist.subtitle}</p>}
      </div>
    </div>
  )
}
```

**Key Features:**
- ✅ No conditional rendering needed (image is required)
- ✅ Alt text always available (required field)
- ✅ Optional title attribute for tooltip
- ✅ LQIP blur placeholder for smooth loading

---

## ✅ Data Integrity Checklist

Before publishing artists to the website:

- [ ] **Artist Name:** Required, filled in
- [ ] **Slug:** Required, unique, generated from name
- [ ] **Image:** Required, uploaded with valid asset
- [ ] **Alt Text:** Required, 10-200 characters, descriptive
- [ ] **Title (optional):** If provided, max 100 characters
- [ ] **Specialty/Subtitle:** Recommended for better UX
- [ ] **Status:** Set to "Published" (not "Draft" or "Hidden")
- [ ] **Document Published:** Not in drafts system

---

## 🚨 Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Image not showing | Draft document | Exclude drafts: `!(_id in path("drafts.**"))` |
| Alt text missing | Old schema didn't require it | Re-save document after schema update |
| Empty image object | Asset not uploaded | Schema validation now prevents this |
| Title not showing | Added in schema update | Add `title` to GROQ projection |
| Specialty field missing | New field in schema | Optional, won't break existing data |

---

## 📋 Migration Steps

If you have existing artists without images or alt text:

### 1. Check for Missing Images

```groq
*[_type == "artist" && !defined(image.asset._ref)]{
  _id,
  name,
  "hasImage": defined(image)
}
```

### 2. Check for Missing Alt Text

```groq
*[_type == "artist" && defined(image.asset._ref) && !defined(image.alt)]{
  _id,
  name,
  "imageHasAlt": defined(image.alt)
}
```

### 3. Update Process

1. Open each artist document in Sanity Studio
2. Upload an image if missing (now required)
3. Add alt text (required field)
4. Optionally add title for tooltips
5. Publish the document

---

## 🎯 Quick Reference

### Minimal Query (Cards/Lists)
```groq
{
  _id,
  name,
  "slug": slug.current,
  image{asset->{url}, alt, title}
}
```

### Standard Query (Most Use Cases)
```groq
{
  _id,
  name,
  "slug": slug.current,
  specialty,
  subtitle,
  image{asset->{url, "lqip": metadata.lqip}, alt, title}
}
```

### Complete Query (Detail Pages)
```groq
{
  _id,
  name,
  "slug": slug.current,
  specialty,
  subtitle,
  bio,
  style,
  image{
    asset->{url, metadata{lqip, dimensions}},
    alt,
    title
  },
  gallery[]{
    asset->{url, metadata{lqip, dimensions}},
    alt,
    title,
    _key
  }
}
```

---

## Summary

**Schema Changes:**
1. ✅ Artist `image` field is now **required**
2. ✅ Image validation ensures asset exists (no empty objects)
3. ✅ Added `title` field to image and gallery images
4. ✅ Alt text has length validation (10-200 characters)
5. ✅ Added `specialty` field for better artist categorization

**Query Changes:**
1. ✅ Always fetch `asset->url` (not just `asset`)
2. ✅ Always include `alt` and `title` in projections
3. ✅ Exclude drafts with `!(_id in path("drafts.**"))`
4. ✅ Fetch metadata (lqip, dimensions) for optimization

**Frontend Changes:**
1. ✅ No conditional rendering needed (image is required)
2. ✅ Use `alt` and `title` attributes
3. ✅ Leverage LQIP for blur placeholders
4. ✅ TypeScript types guarantee data structure

This ensures artist avatar images, titles, and alt text are **always available and visible** on the frontend.
