# 🔥 QUICK FIX - Add This Code to Your Frontend

## Problem
Artists page shows "No artists available" because frontend query is missing `artistSource == "all"` support.

---

## 🎯 THE FIX

### File to Modify
**Your frontend repository** → `sanity/lib/queries.ts` (or wherever you define GROQ queries)

### What to Add

Find this pattern in your query:

```typescript
_type == "artistSection" => {
  // ... existing code ...
  
  artistSource == "featured" => {
    "artists": *[_type == "artist" && featured == true][0...^.limit]{
      _id,
      name,
      "slug": slug.current,
      shortDescription,
      specialty,
      subtitle,
      bio,
      image{
        asset->{_id, url, metadata{lqip, dimensions}},
        alt,
        title
      }
    }
  }
}
```

**Add this block immediately after the `featured` case:**

```typescript
,
artistSource == "all" => {
  "artists": *[_type == "artist"] | order(name asc)[0...^.limit]{
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
        metadata{lqip, dimensions}
      },
      alt,
      title
    }
  }
}
```

---

## 📋 Complete artistSection Projection

Here's the complete projection with all three cases:

```typescript
_type == "artistSection" => {
  title,
  description,
  layout,
  artistSource,
  showBio,
  
  // Case 1: Manual selection
  artistSource == "manual" => {
    artists[]->{
      _id,
      name,
      "slug": slug.current,
      shortDescription,
      specialty,
      subtitle,
      bio,
      image{
        asset->{_id, url, metadata{lqip, dimensions}},
        alt,
        title
      }
    }
  },
  
  // Case 2: Featured artists only
  artistSource == "featured" => {
    "artists": *[_type == "artist" && featured == true][0...^.limit]{
      _id,
      name,
      "slug": slug.current,
      shortDescription,
      specialty,
      subtitle,
      bio,
      image{
        asset->{_id, url, metadata{lqip, dimensions}},
        alt,
        title
      }
    }
  },
  
  // Case 3: ALL artists (alphabetically sorted) ✅ ADD THIS
  artistSource == "all" => {
    "artists": *[_type == "artist"] | order(name asc)[0...^.limit]{
      _id,
      name,
      "slug": slug.current,
      shortDescription,
      specialty,
      subtitle,
      bio,
      image{
        asset->{_id, url, metadata{lqip, dimensions}},
        alt,
        title
      }
    }
  }
}
```

---

## 🔄 After Making Changes

1. **Save the file**
2. **Restart your dev server**: `npm run dev` or `yarn dev`
3. **Clear Next.js cache** (if applicable): `rm -rf .next`
4. **Regenerate types**: `npx sanity@latest typegen generate`
5. **Test**: Visit `/artists` page

---

## ✅ Expected Result

- ✅ Artists page now shows ALL artists
- ✅ Artists are sorted alphabetically by name
- ✅ No "No artists available" message
- ✅ Homepage still shows only featured artists (unchanged)

---

## 📍 Where to Find This File

Look in your **frontend repository** (NOT this Sanity Studio repo):

- `sanity/lib/queries.ts`
- `lib/queries.ts`
- `lib/sanity/queries.ts`
- `app/artists/page.tsx` (if query is inline)
- `src/lib/queries.ts`
- Search for: `HOMEPAGE_QUERY` or `PAGE_QUERY` or `defineQuery`
