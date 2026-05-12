# Artwork Manual Ordering Guide

**Updated:** February 8, 2026  
**Purpose:** Control the display order of artworks on the website

---

## ✅ Schema Update Applied

### New Field: `order`

```typescript
// schemaTypes/artwork.ts
defineField({
  name: 'order',
  title: 'Display Order',
  type: 'number',
  description: 'Control the display order of artworks (lower numbers appear first)',
  validation: (Rule) => 
    Rule.integer()
      .min(0)
      .warning('Order should be 0 or greater'),
})
```

**Key Features:**
- ✅ **Integer field** - accepts whole numbers only (0, 1, 2, 3...)
- ✅ **Positive validation** - warns if negative numbers are used
- ✅ **Optional field** - artworks can be left without an order value
- ✅ **Fully editable** in Sanity Studio

---

## 🎯 How It Works

### Ordering Behavior

| Order Value | Display Position | Notes |
|-------------|------------------|-------|
| `0` | First | Highest priority |
| `1, 2, 3...` | In sequence | Lower numbers = earlier position |
| `undefined` (empty) | Last | Appears after all ordered items |

### Example

```
Database:
- Artwork A: order = 1
- Artwork B: order = 5
- Artwork C: order = 2
- Artwork D: no order value
- Artwork E: order = 0
- Artwork F: no order value

Display Order:
1. Artwork E (order = 0)
2. Artwork A (order = 1)
3. Artwork C (order = 2)
4. Artwork B (order = 5)
5. Artwork D (no order, by creation date)
6. Artwork F (no order, by creation date)
```

---

## 📝 GROQ Query Patterns

### 1. Manual Order First, Then By Creation Date (Recommended)

```groq
*[_type == "artwork" && !(_id in path("drafts.**"))]{
  _id,
  title,
  order,
  year,
  image{
    asset->{url, "lqip": metadata.lqip},
    alt
  },
  artist->{_id, name}
} | order(coalesce(order, 999) asc, _createdAt desc)
```

**How it works:**
- `coalesce(order, 999)` treats empty order values as `999`
- Artworks with `order` values (0-998) appear first
- Artworks without `order` appear last, sorted by creation date

**Best for:** General galleries where manual ordering is primary

---

### 2. Manual Order First, Then By Year

```groq
*[_type == "artwork" && status == "published"]{
  _id,
  title,
  order,
  year,
  image{asset->{url}, alt},
  artist->{name}
} | order(coalesce(order, 999) asc, year desc)
```

**How it works:**
- Manual order takes priority
- Unordered items sort by year (newest first)

**Best for:** Artist portfolios showing chronological progression

---

### 3. Manual Order First, Then By Title

```groq
*[_type == "artwork" && artist._ref == $artistId]{
  _id,
  title,
  order,
  image{asset->{url}, alt}
} | order(coalesce(order, 999) asc, title asc)
```

**How it works:**
- Manual order takes priority
- Unordered items sort alphabetically

**Best for:** Alphabetical fallback ordering

---

### 4. Featured Artworks with Manual Order

```groq
*[_type == "artwork" && featured == true && status == "published"]{
  _id,
  title,
  order,
  image{asset->{url}, alt},
  artist->{name}
} | order(coalesce(order, 0) asc, _createdAt desc)[0...6]
```

**How it works:**
- Only featured artworks
- Manual order controls featured position
- Limits to 6 results

**Best for:** Homepage featured galleries

---

### 5. Strict Manual Order Only (Exclude Unordered)

```groq
*[_type == "artwork" && defined(order)]{
  _id,
  title,
  order,
  image{asset->{url}, alt}
} | order(order asc)
```

**How it works:**
- Only returns artworks WITH an order value
- Pure manual ordering

**Best for:** Curated collections where every item must be positioned

---

### 6. Artist's Artworks with Manual Order

```groq
*[_type == "artwork" && artist._ref == $artistId && !(_id in path("drafts.**"))]{
  _id,
  title,
  order,
  year,
  medium,
  dimensions,
  image{
    asset->{url, metadata{lqip, dimensions}},
    alt
  }
} | order(coalesce(order, 999) asc, year desc, _createdAt desc)
```

**How it works:**
- Filters by artist reference
- Manual order first
- Then by year
- Then by creation date

**Best for:** Artist detail pages

---

## 🎨 Frontend Implementation

### TypeScript Type

```typescript
type Artwork = {
  _id: string
  title: string
  order?: number  // Optional - may be undefined
  year?: number
  image: {
    asset: { url: string; lqip?: string }
    alt?: string
  }
  artist: {
    _id: string
    name: string
  }
}
```

### React Component Example

```tsx
// Fetch artworks from your API/client
const artworks = await client.fetch(`
  *[_type == "artwork" && status == "published"]{
    _id,
    title,
    order,
    image{asset->{url}, alt},
    artist->{name}
  } | order(coalesce(order, 999) asc, _createdAt desc)
`)

// Render gallery
export function ArtworkGallery({ artworks }: { artworks: Artwork[] }) {
  return (
    <div className="artwork-gallery">
      {artworks.map((artwork) => (
        <div key={artwork._id} className="artwork-card">
          <img 
            src={artwork.image.asset.url} 
            alt={artwork.image.alt || artwork.title}
          />
          <h3>{artwork.title}</h3>
          <p>{artwork.artist.name}</p>
          
          {/* Debug: Show order value in dev mode */}
          {process.env.NODE_ENV === 'development' && artwork.order !== undefined && (
            <span className="debug-order">Order: {artwork.order}</span>
          )}
        </div>
      ))}
    </div>
  )
}
```

---

## 🔧 Usage in Sanity Studio

### Setting Order Values

1. Open an artwork document in Sanity Studio
2. Scroll to the **"Display Order"** field
3. Enter a number (0, 1, 2, 3...)
   - **0** = First position
   - **1** = Second position
   - **2** = Third position
   - etc.
4. Leave empty for automatic ordering (appears last)
5. Publish the document

### Best Practices

**For Featured Collections:**
```
Hero artwork: order = 0
Second priority: order = 1
Third priority: order = 2
Regular artworks: leave empty
```

**For Artist Portfolios:**
```
Featured piece: order = 0
Recent works: order = 1-5
Older works: leave empty (sorted by year)
```

**For Exhibition Pages:**
```
Entrance piece: order = 0
Wall 1 artworks: order = 1-5
Wall 2 artworks: order = 6-10
Remaining pieces: leave empty
```

---

## 📊 Query Performance

### Optimal Ordering Pattern

```groq
// ✅ GOOD: Single coalesce in order clause
| order(coalesce(order, 999) asc, _createdAt desc)

// ❌ AVOID: Multiple projections and filters
| order(order asc) + separate query for undefined
```

### Indexing Considerations

The `order` field is automatically indexed by Sanity for efficient sorting. No additional configuration needed.

---

## 🔄 Migration Guide

### For Existing Artworks

All existing artworks will have `order = undefined` by default.

**To set initial order values:**

```javascript
// Option 1: Manual assignment in Studio (recommended)
// Open each artwork and set order values

// Option 2: Bulk update via Sanity CLI (advanced)
import {getCliClient} from 'sanity/cli'

const client = getCliClient()

// Fetch all artworks
const artworks = await client.fetch('*[_type == "artwork"]')

// Set order based on creation date
const updates = artworks
  .sort((a, b) => new Date(a._createdAt) - new Date(b._createdAt))
  .map((artwork, index) => ({
    id: artwork._id,
    patch: {
      set: { order: index }
    }
  }))

// Apply patches
await Promise.all(
  updates.map(({id, patch}) => 
    client.patch(id).set(patch.set).commit()
  )
)
```

---

## 🎯 Complete Query Examples

### Homepage Featured Gallery

```groq
*[_type == "homepage"][0]{
  content[enabled == true]{
    _type == "gallerySection" => {
      title,
      "artworks": *[_type == "artwork" && featured == true && status == "published"]{
        _id,
        title,
        year,
        image{asset->{url, "lqip": metadata.lqip}, alt},
        artist->{name}
      } | order(coalesce(order, 999) asc, _createdAt desc)[0...6]
    }
  }
}
```

### Artist Detail Page

```groq
*[_type == "artist" && slug.current == $slug][0]{
  _id,
  name,
  bio,
  "artworks": *[_type == "artwork" && artist._ref == ^._id && status == "published"]{
    _id,
    title,
    order,
    year,
    medium,
    dimensions,
    image{asset->{url}, alt}
  } | order(coalesce(order, 999) asc, year desc)
}
```

### All Artworks Gallery

```groq
*[_type == "artwork" && status in ["published", "sold"] && !(_id in path("drafts.**"))]{
  _id,
  title,
  order,
  year,
  status,
  image{asset->{url, "lqip": metadata.lqip}, alt},
  artist->{_id, name, "slug": slug.current}
} | order(coalesce(order, 999) asc, year desc, title asc)
```

---

## ✅ Validation Rules

The schema enforces:

- ✅ **Integer only** - no decimals (1, 2, 3... not 1.5)
- ✅ **Positive numbers** - 0 or greater (warning for negative)
- ✅ **Optional** - can be left empty
- ✅ **No length limit** - can use any number, but recommend 0-999

---

## 🚨 Common Patterns

### Pattern 1: Priority Tiers

```
VIP artworks: 0-9
Featured artworks: 10-99
Regular artworks: leave empty
```

### Pattern 2: Chronological with Highlights

```
Highlight piece: 0
Other recent works: leave empty (sorted by year)
```

### Pattern 3: Exhibition Flow

```
Room 1: 1-10
Room 2: 11-20
Room 3: 21-30
Outdoor: 31-40
```

---

## Summary

**Schema Changes:**
- ✅ Added `order` field (integer, min 0)
- ✅ Optional field - backward compatible
- ✅ Validates positive numbers
- ✅ Editable in Sanity Studio

**GROQ Ordering:**
- ✅ Use `coalesce(order, 999)` to handle undefined values
- ✅ Manual order takes priority
- ✅ Artworks without order appear last
- ✅ Secondary sort by year, date, or title

**Frontend Behavior:**
- ✅ Lower numbers appear first (0, 1, 2...)
- ✅ Unordered items appear last
- ✅ Full control over display order
- ✅ Reliable and predictable sorting

This gives **full and reliable control** over artwork ordering on your website! 🎨
