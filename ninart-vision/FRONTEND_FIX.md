# 🔧 FRONTEND FIX: Add Support for artistSource "all"

## Problem
Artists page shows "No artists available" because the frontend GROQ query doesn't include the `artistSource == "all"` conditional.

## Solution
Add the missing conditional to your frontend GROQ queries.

---

## 📍 FILES TO MODIFY

Look for these files in your **frontend repository** (not this Sanity Studio repo):

1. **`sanity/lib/queries.ts`** or **`lib/queries.ts`**
2. **`app/artists/page.tsx`** or **`pages/artists.tsx`** (if queries are inline)
3. Any file containing `HOMEPAGE_QUERY`, `PAGE_QUERY`, or `ARTISTS_PAGE_QUERY`

---

## 🔧 FIX #1: Update GROQ Queries

### File: `sanity/lib/queries.ts` (or wherever your queries are defined)

Find the **artistSection** projection in your queries and add the missing `artistSource == "all"` case:

```typescript
// BEFORE (Missing "all" support)
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
  
  artistSource == "featured" => {
    "artists": *[_type == "artist" && featured == true][0...^.limit]{
      _id, name, slug, bio,
      image{asset->{_id, url, metadata{lqip, dimensions}}, alt}
    }
  }
  // ❌ Missing "all" case!
}
```

```typescript
// AFTER (With "all" support added) ✅
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
  
  artistSource == "featured" => {
    "artists": *[_type == "artist" && featured == true][0...^.limit]{
      _id, name, slug, bio,
      image{asset->{_id, url, metadata{lqip, dimensions}}, alt}
    }
  },
  
  // ✅ ADD THIS:
  artistSource == "all" => {
    "artists": *[_type == "artist"] | order(name asc)[0...^.limit]{
      _id, name, slug, bio,
      image{asset->{_id, url, metadata{lqip, dimensions}}, alt}
    }
  }
}
```

---

## 🔧 FIX #2: Complete Query Examples

### For Homepage Query (if not already correct)

**File**: `sanity/lib/queries.ts`

```typescript
import { defineQuery } from 'next-sanity'

export const HOMEPAGE_QUERY = defineQuery(`
  *[_type == "homepage"][0]{
    title,
    seo{
      metaTitle,
      metaDescription,
      ogImage{asset->{_id, url, metadata{lqip, dimensions}}}
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
        
        artistSource == "featured" => {
          "artists": *[_type == "artist" && featured == true][0...^.limit]{
            _id, name, slug, bio,
            image{asset->{_id, url, metadata{lqip, dimensions}}, alt}
          }
        }
      }
      
      // ... other section types
    }
  }
`)
```

### For Artists Page Query (add "all" support)

**File**: `sanity/lib/queries.ts` or `app/artists/page.tsx`

```typescript
import { defineQuery } from 'next-sanity'

export const ARTISTS_PAGE_QUERY = defineQuery(`
  *[_type == "page" && slug.current == "artists"][0]{
    title,
    seo{
      metaTitle,
      metaDescription,
      ogImage{asset->{_id, url, metadata{lqip, dimensions}}}
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
        
        // ✅ THIS IS THE KEY FIX:
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
      }
      
      // ... other section types
    }
  }
`)
```

### For Generic Page Query (if you use one query for all pages)

**File**: `sanity/lib/queries.ts`

```typescript
export const PAGE_QUERY = defineQuery(`
  *[_type == "page" && slug.current == $slug][0]{
    title,
    slug,
    seo,
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
        
        // ✅ ADD THIS:
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
      }
      
      // ... other section types
    }
  }
`)
```

---

## 🔧 FIX #3: Component Code (Usually No Changes Needed)

Your **ArtistSection** component should already work because it just maps over the `artists` array. But verify it looks like this:

**File**: `components/sections/ArtistSection.tsx`

```typescript
export function ArtistSection({ title, description, layout, artists, showBio }: Props) {
  const layoutClass = stegaClean(layout) || 'grid'
  const displayBio = stegaClean(showBio)

  // ✅ This should handle all cases (manual, featured, all)
  if (!artists || artists.length === 0) {
    return (
      <section className="artist-section">
        {title && <h2>{title}</h2>}
        <p>No artists available</p>
      </section>
    )
  }

  return (
    <section className="artist-section">
      {title && <h2>{title}</h2>}
      {description && <p>{description}</p>}
      
      <div className={`artists-${layoutClass}`}>
        {artists.map((artist) => (
          <Link 
            key={artist._id} 
            href={`/artists/${artist.slug?.current}`}
            className="artist-card"
          >
            {/* Artist card content */}
          </Link>
        ))}
      </div>
    </section>
  )
}
```

**Note**: If your component receives `artists` prop, no changes are needed. The issue is in the query, not the component.

---

## 🔧 FIX #4: Regenerate TypeScript Types

After updating queries, regenerate types:

**In your frontend repository:**

```bash
npx sanity@latest typegen generate
```

This ensures TypeScript recognizes `artistSource: "all"` as a valid option.

---

## ✅ TESTING THE FIX

1. **Apply the fix** in your frontend repository
2. **Restart dev server**: `npm run dev`
3. **Clear cache** (if using Next.js): `rm -rf .next`
4. **Visit** `/artists` page
5. **Verify** all artists appear (not just featured)

---

## 📋 CHECKLIST

- [ ] Found your frontend repository (separate from this Sanity Studio repo)
- [ ] Located query file (`sanity/lib/queries.ts` or similar)
- [ ] Added `artistSource == "all"` case to the query
- [ ] Verified query fetches all artists with `*[_type == "artist"]`
- [ ] Verified query sorts by name: `| order(name asc)`
- [ ] Regenerated TypeScript types
- [ ] Restarted dev server
- [ ] Tested `/artists` page - all artists now show

---

## 🎯 EXACT CODE TO ADD

**Search for this pattern in your frontend:**

```typescript
artistSource == "featured" => {
  "artists": *[_type == "artist" && featured == true][0...^.limit]{
```

**Add this immediately after:**

```typescript
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
```

---

## 💡 WHY THIS HAPPENS

The Sanity Studio schema was updated to support `artistSource: "all"`, but:
1. ✅ Sanity Studio knows about it (schema deployed)
2. ✅ Content editors can select "All Artists" in Studio
3. ❌ **Frontend query doesn't handle it** (missing conditional)
4. Result: Query returns empty `artists` array when `artistSource === "all"`

The fix adds the missing GROQ conditional to fetch all artists when that option is selected.

---

## 🚨 IMPORTANT

- **This fix goes in your FRONTEND repository**, not this Sanity Studio repo
- Look for files containing `defineQuery` or GROQ query strings
- The component code probably doesn't need changes
- Only the GROQ query needs the `artistSource == "all"` case added

---

## 📞 Quick Summary

**File to modify**: `sanity/lib/queries.ts` (in your frontend repo)

**What to add**: 
```groq
artistSource == "all" => {
  "artists": *[_type == "artist"] | order(name asc)[0...^.limit]{
    _id, name, slug, bio,
    image{asset->{_id, url, metadata{lqip, dimensions}}, alt}
  }
}
```

**Where to add it**: Inside the `_type == "artistSection"` projection, alongside the `manual` and `featured` cases.
