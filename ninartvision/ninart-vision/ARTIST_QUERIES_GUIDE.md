# Artist Queries Guide - Ninart Vision

## Overview
This guide explains how to display artists on different pages:
- **Homepage**: Show only Featured Artists
- **Artists Page**: Show ALL Artists

## Schema Changes Made

Updated [artistSection.ts](schemaTypes/objects/artistSection.ts) to support three modes:
- `manual` - Hand-pick specific artists
- `featured` - Show only featured artists (filtered by `featured == true`)
- **`all`** - Show all artists (NEW - no filtering)

## GROQ Query Patterns

### 1. Homepage Query (Featured Artists Only)

**File**: Typically in `sanity/lib/queries.ts` or similar

```groq
*[_type == "homepage"][0]{
  title,
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
      
      // Manual selection
      artistSource == "manual" => {
        artists[]->{
          _id,
          name,
          slug,
          bio,
          image{
            asset->{_id, url, metadata{lqip, dimensions}},
            alt
          }
        }
      },
      
      // FEATURED ONLY - for homepage
      artistSource == "featured" => {
        "artists": *[_type == "artist" && featured == true][0...^.limit]{
          _id,
          name,
          slug,
          bio,
          image{
            asset->{_id, url, metadata{lqip, dimensions}},
            alt
          }
        }
      }
    }
    
    // ... other section types
  }
}
```

### 2. Artists Page Query (All Artists)

**File**: Typically in `sanity/lib/queries.ts` or `app/artists/page.tsx`

```groq
*[_type == "page" && slug.current == "artists"][0]{
  title,
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
      
      // Manual selection
      artistSource == "manual" => {
        artists[]->{
          _id,
          name,
          slug,
          bio,
          image{
            asset->{_id, url, metadata{lqip, dimensions}},
            alt
          }
        }
      },
      
      // ALL ARTISTS - no featured filter, sorted alphabetically
      // Note: bio field excluded for Artists page - content not rendered on frontend
      artistSource == "all" => {
        "artists": *[_type == "artist"] | order(name asc)[0...^.limit]{
          _id,
          name,
          slug,
          // bio intentionally excluded
          image{
            asset->{_id, url, metadata{lqip, dimensions}},
            alt
          }
        }
      },
      
      // Featured option still available if needed
      artistSource == "featured" => {
        "artists": *[_type == "artist" && featured == true][0...^.limit]{
          _id,
          name,
          slug,
          bio,
          image{
            asset->{_id, url, metadata{lqip, dimensions}},
            alt
          }
        }
      }
    }
    
    // ... other section types
  }
}
```

### 3. Standalone Artists Listing Query (Alternative)

If you want a dedicated artists listing page WITHOUT using the page builder:

```groq
// Get all artists, sorted alphabetically
*[_type == "artist"] | order(name asc){
  _id,
  name,
  slug,
  bio,
  featured,
  image{
    asset->{
      _id,
      url,
      metadata{lqip, dimensions}
    },
    alt
  }
}
```

## Implementation Steps

### Option A: Using Sanity Studio (Recommended)

1. **Deploy Schema Changes**:
   ```bash
   npx sanity@latest schema deploy
   ```

2. **Update Homepage** (in Sanity Studio):
   - Go to Homepage document
   - Find the Artist Section
   - Set **Artist Source** to "Featured Artists"
   - Set the title to "Featured Artists"

3. **Create/Update Artists Page** (in Sanity Studio):
   - Create a new Page document with slug `artists`
   - Set **Page Title** to "Artists" (not "Featured Artists")
   - Add an Artist Section to the content
   - Set **Artist Source** to "All Artists"
   - Set the section title to "Our Artists" or "All Artists"
   - Save and publish

### Option B: Update Frontend Code

If your queries are hardcoded in your frontend:

1. **Update Homepage Query**:
   - Keep `artistSource == "featured"` filter
   - Ensure title displays "Featured Artists"

2. **Update Artists Page Query**:
   - Change filter to `artistSource == "all"`
   - Remove `featured == true` condition
   - Add `| order(name asc)` for alphabetical sorting
   - Update page metadata: `title: "Artists"` not "Featured Artists"

## Key Differences Summary

| Aspect | Homepage | Artists Page |
|--------|----------|--------------|
| **Query Filter** | `featured == true` | No filter (all artists) |
| **Artist Source** | `"featured"` | `"all"` |
| **Sorting** | Optional | `order(name asc)` |
| **Section Title** | "Featured Artists" | "Artists" or "Our Artists" |
| **Page Title** | "Home" | "Artists" |
| **SEO Meta Title** | "Ninart Vision - Home" | "All Artists - Ninart Vision" |

## Testing Checklist

- [ ] Schema deployed successfully
- [ ] Homepage shows only artists with `featured == true`
- [ ] Artists page shows ALL artists (both featured and non-featured)
- [ ] Artists page is sorted alphabetically by name
- [ ] Page titles and descriptions are correct
- [ ] Slug-based navigation works (`/artists`)
- [ ] Layouts and styling remain intact
- [ ] Links to individual artist pages work

## Notes

- **Featured artists** are controlled by the `featured` boolean field in each artist document
- The `limit` field in Artist Section controls maximum artists displayed
- Leave `limit` empty to show all artists without restriction
- Sorting by `name asc` ensures consistent alphabetical ordering
- Both pages use the same React component (`ArtistSection`) with different data
