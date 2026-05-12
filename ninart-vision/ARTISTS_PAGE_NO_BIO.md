# Artists Page - Biography Removal Guide

## Overview
This guide documents the changes made to remove/disable the "About Artist" (bio) content from the Artists page while keeping the field in the Sanity schema.

## Changes Made

### 1. Schema Updates

#### Artist Schema (`schemaTypes/artist.ts`)
- **No changes** - The `bio` field (titled "About") remains in the schema
- The field has **no validation requirements** - it can be empty or null
- Content editors can still add bio content if needed for other purposes

#### Artist Section Schema (`schemaTypes/objects/artistSection.ts`)
- Updated `showBio` field description to note: "For Artists page, set to false - bio content is not rendered on frontend."
- The `showBio` toggle should be set to **false** for Artist Sections on the Artists page

### 2. GROQ Query Updates

#### Artists Page Query (Updated)
The GROQ query for the Artists page **excludes** the `bio` field:

```groq
*[_type == "page" && slug.current == "artists"][0]{
  title,
  seo,
  content[enabled == true]{
    _type,
    _key,
    
    _type == "artistSection" => {
      title,
      description,
      layout,
      artistSource,
      // Note: showBio intentionally excluded - bio content not rendered on Artists page
      
      artistSource == "manual" => {
        artists[]->{
          _id,
          name,
          slug,
          // Note: bio field excluded for Artists page
          image{asset->{_id, url, metadata{lqip, dimensions}}, alt}
        }
      },
      
      artistSource == "all" => {
        "artists": *[_type == "artist"] | order(name asc)[0...^.limit]{
          _id,
          name,
          slug,
          // Note: bio field excluded for Artists page
          image{asset->{_id, url, metadata{lqip, dimensions}}, alt}
        }
      }
    }
  }
}
```

#### Homepage Query (Unchanged)
The homepage still **includes** `bio` and `showBio` for featured artists:

```groq
*[_type == "homepage"][0]{
  content[enabled == true]{
    _type == "artistSection" => {
      title,
      description,
      layout,
      artistSource,
      showBio,  // Still included for homepage
      
      artistSource == "featured" => {
        "artists": *[_type == "artist" && featured == true][0...^.limit]{
          _id,
          name,
          slug,
          bio,  // Still included for homepage
          image{asset->{_id, url, metadata{lqip, dimensions}}, alt}
        }
      }
    }
  }
}
```

## Frontend Implementation

### What to Change in Your Frontend Code

1. **Artists Page Query**: Update your GROQ query to exclude `bio` field (as shown above)

2. **Remove Bio Rendering**: In your Artists page component, remove any code that renders:
   - Artist bio/description text
   - "About Artist" section
   - Language switchers (EN/KA) for bio content

3. **Conditional Rendering**: If you have shared components, add conditional logic:
   ```tsx
   // Example React/Next.js pseudocode
   {isArtistsPage ? null : (
     <div className="artist-bio">
       {artist.bio}
     </div>
   )}
   ```

4. **Language Switchers**: Remove EN/KA language toggles specifically for the Artists page bio section

### What NOT to Change

- Do **NOT** remove the `bio` field from the artist schema in Sanity
- Do **NOT** change bio rendering on other pages (homepage, individual artist pages, etc.)
- Do **NOT** modify global language switching logic

## Sanity Studio Configuration

### Artists Page Setup

When configuring the Artists page in Sanity Studio:

1. Navigate to the **Artists** page document
2. In the Artist Section:
   - Set **Show Biography** toggle to **OFF** (false)
   - This visually indicates that bios won't be displayed
3. Save and publish

### Result

- The `bio` field remains available in the Artist document for future use
- The Artists page frontend will **not receive** bio data in the query response
- No language switchers needed since bio content isn't rendered
- Other pages (like homepage) can still display artist bios if configured

## Technical Summary

| Aspect | Status | Notes |
|--------|--------|-------|
| **Bio field in schema** | ✅ Kept | No deletion, field remains available |
| **Bio validation** | ✅ Removed | Field can be empty/null |
| **Artists page GROQ query** | ✅ Updated | Excludes `bio` field |
| **Homepage GROQ query** | ✅ Unchanged | Still includes `bio` |
| **showBio field** | ✅ Updated | Documentation notes Artists page behavior |
| **Frontend rendering** | ⚠️ Required | Frontend must remove bio rendering for Artists page |
| **Language switchers** | ⚠️ Required | Frontend must remove EN/KA toggles for Artists page bio |

## Files Modified

1. [`schemaTypes/objects/artistSection.ts`](schemaTypes/objects/artistSection.ts) - Updated `showBio` description
2. [`GROQ_QUERIES.md`](GROQ_QUERIES.md) - Updated Artists page query documentation
3. This guide - [`ARTISTS_PAGE_NO_BIO.md`](ARTISTS_PAGE_NO_BIO.md)

## Next Steps for Frontend Developer

1. Update your Artists page GROQ query to exclude `bio` field
2. Remove bio rendering code from Artists page component
3. Remove EN/KA language switchers for Artists page bio section
4. Test that other pages (homepage, artist detail pages) still display bios correctly
5. Verify no validation errors occur when artist bio field is empty
