# Production-Ready GROQ Queries

**Copy-paste these queries into your frontend code**

---

## 🎨 Artist Page (Individual Artist + Artworks)

```javascript
// URL: /artists/nini-mzhavia
// Get artist slug from URL, fetch artist + all their artworks

const ARTIST_WITH_ARTWORKS = `*[_type == "artist" && slug.current == $slug][0]{
  _id,
  name,
  bio,
  image{
    asset->{
      _id,
      url,
      metadata{lqip, dimensions}
    },
    alt
  },
  "artworks": *[_type == "artwork" && artist._ref == ^._id && !(_id in path("drafts.**"))] | order(year desc, _createdAt desc) {
    _id,
    title,
    year,
    medium,
    dimensions,
    description,
    price,
    status,
    image{
      asset->{
        _id,
        url,
        metadata{lqip, dimensions}
      },
      alt
    },
    images[]{
      asset->{
        _id,
        url,
        metadata{lqip, dimensions}
      },
      alt,
      _key
    }
  }
}`

// Usage:
const artist = await client.fetch(ARTIST_WITH_ARTWORKS, {
  slug: 'nini-mzhavia'
})

console.log(artist.name) // "Nini Mzhavia"
console.log(artist.artworks.length) // 25
console.log(artist.artworks[0].price) // 250
console.log(artist.artworks[0].status) // "sale" or "sold"
```

---

## 👥 Artists Listing (All Artists)

```javascript
// URL: /artists
// List all artists, typically for navigation/directory

const ALL_ARTISTS = `*[_type == "artist" && !(_id in path("drafts.**"))] | order(name asc) {
  _id,
  name,
  "slug": slug.current,
  shortDescription,
  subtitle,
  specialty,
  featured,
  image{
    asset->{
      _id,
      url,
      metadata{lqip, dimensions}
    },
    alt,
    title
  },
  "artworkCount": count(*[_type == "artwork" && artist._ref == ^._id && !(_id in path("drafts.**"))])
}`

// Usage:
const artists = await client.fetch(ALL_ARTISTS)

console.log(artists.length) // 6
console.log(artists[0].artworkCount) // 25
```

---

## 🖼️ Gallery Artworks (Homepage/Featured)

```javascript
// Homepage gallery or featured section
// ⚠️ NO slug field - prevents navigation interference with modals

const GALLERY_FEATURED = `*[_type == "artwork" && featured == true && !(_id in path("drafts.**"))] | order(_createdAt desc) [0...$limit] {
  _id,
  title,
  year,
  medium,
  dimensions,
  description,
  price,
  status,
  image{
    asset->{
      _id,
      url,
      metadata{lqip, dimensions}
    },
    alt
  },
  images[]{
    asset->{
      _id,
      url,
      metadata{lqip, dimensions}
    },
    alt,
    _key
  },
  artist->{
    _id,
    name
  }
}`

// Usage:
const artworks = await client.fetch(GALLERY_FEATURED, {
  limit: 12
})
```

---

## 🎨 Gallery by Artist (Filtered)

```javascript
// Show artworks from specific artist in gallery context
// NO slug field

const GALLERY_BY_ARTIST = `*[_type == "artwork" && artist._ref == $artistId && !(_id in path("drafts.**"))] | order(year desc) [0...$limit] {
  _id,
  title,
  year,
  medium,
  dimensions,
  description,
  price,
  status,
  image{
    asset->{
      _id,
      url,
      metadata{lqip, dimensions}
    },
    alt
  },
  images[]{
    asset->{
      _id,
      url,
      metadata{lqip, dimensions}
    },
    alt,
    _key
  }
}`

// Usage:
const artworks = await client.fetch(GALLERY_BY_ARTIST, {
  artistId: '0f88a45c-eb90-4637-9105-144904daec6d',
  limit: 20
})
```

---

## 🔍 Single Artwork (Detail Page)

```javascript
// URL: /artworks/artwork-slug
// Full artwork details for dedicated page

const ARTWORK_DETAIL = `*[_type == "artwork" && slug.current == $slug][0]{
  _id,
  title,
  slug,
  year,
  medium,
  dimensions,
  description,
  price,
  status,
  featured,
  image{
    asset->{
      _id,
      url,
      metadata{lqip, dimensions}
    },
    alt
  },
  images[]{
    asset->{
      _id,
      url,
      metadata{lqip, dimensions}
    },
    alt,
    _key
  },
  artist->{
    _id,
    name,
    slug,
    image{
      asset->{url},
      alt
    }
  }
}`

// Usage:
const artwork = await client.fetch(ARTWORK_DETAIL, {
  slug: 'golden-fleece-reimagined'
})
```

---

## 🔄 All Artworks (For Admin/Inventory)

```javascript
// Complete artwork list with all fields
// Use for inventory management, stats, etc.

const ALL_ARTWORKS = `*[_type == "artwork" && !(_id in path("drafts.**"))] | order(_createdAt desc) {
  _id,
  title,
  slug,
  year,
  medium,
  dimensions,
  description,
  price,
  status,
  featured,
  _createdAt,
  _updatedAt,
  artist->{
    _id,
    name
  },
  "hasImage": defined(image),
  "hasGallery": defined(images) && count(images) > 0,
  "galleryCount": count(images)
}`

// Usage:
const allArtworks = await client.fetch(ALL_ARTWORKS)

// Filter by status
const forSale = allArtworks.filter(a => a.status === 'sale')
const sold = allArtworks.filter(a => a.status === 'sold')
```

---

## 📊 Statistics Queries

### Stats: Artworks by Artist
```javascript
const STATS_BY_ARTIST = `*[_type == "artist"] | order(name asc) {
  _id,
  name,
  "total": count(*[_type == "artwork" && artist._ref == ^._id]),
  "published": count(*[_type == "artwork" && artist._ref == ^._id && !(_id in path("drafts.**"))]),
  "forSale": count(*[_type == "artwork" && artist._ref == ^._id && status == "sale" && !(_id in path("drafts.**"))]),
  "sold": count(*[_type == "artwork" && artist._ref == ^._id && status == "sold" && !(_id in path("drafts.**"))])
}`

// Usage:
const stats = await client.fetch(STATS_BY_ARTIST)
console.log(stats)
// [
//   {name: "Nini Mzhavia", total: 25, published: 25, forSale: 12, sold: 13},
//   {name: "Mzia Kashia", total: 18, published: 18, forSale: 3, sold: 15}
// ]
```

### Stats: Price Range
```javascript
const STATS_PRICES = `{
  "minPrice": math::min(*[_type == "artwork" && defined(price)].price),
  "maxPrice": math::max(*[_type == "artwork" && defined(price)].price),
  "avgPrice": math::avg(*[_type == "artwork" && defined(price)].price),
  "totalValue": math::sum(*[_type == "artwork" && defined(price) && status == "sale"].price)
}`

// Usage:
const priceStats = await client.fetch(STATS_PRICES)
console.log(priceStats)
// {minPrice: 50, maxPrice: 550, avgPrice: 315, totalValue: 8500}
```

---

## 🖼️ Image URL Helper Function

```javascript
// Convert Sanity image reference to CDN URL
export function urlFor(source) {
  if (!source || !source.asset) return ''
  
  const ref = source.asset._ref || source.asset._id
  const [_file, id, dimensions, format] = ref.split('-')
  
  return `https://cdn.sanity.io/images/8t5h923j/production/${id}-${dimensions}.${format}`
}

// With width/height:
export function urlForSize(source, width, height) {
  const baseUrl = urlFor(source)
  return `${baseUrl}?w=${width}&h=${height}&fit=crop`
}

// Usage:
const fullSize = urlFor(artwork.image)
const thumbnail = urlForSize(artwork.image, 400, 300)
const large = urlForSize(artwork.image, 1200, 900)
```

---

## 📦 Complete Integration Example

```javascript
import {createClient} from '@sanity/client'

// Initialize client
export const client = createClient({
  projectId: '8t5h923j',
  dataset: 'production',
  apiVersion: '2025-02-05',
  useCdn: true,
})

// Load artist page
export async function loadArtistPage(slug) {
  const query = `*[_type == "artist" && slug.current == $slug][0]{
    _id,
    name,
    bio,
    image{
      asset->{_id, url, metadata{lqip, dimensions}},
      alt
    },
    "artworks": *[_type == "artwork" && artist._ref == ^._id && !(_id in path("drafts.**"))] | order(year desc) {
      _id,
      title,
      year,
      medium,
      dimensions,
      description,
      price,
      status,
      image{
        asset->{_id, url, metadata{lqip, dimensions}},
        alt
      },
      images[]{
        asset->{_id, url, metadata{lqip, dimensions}},
        alt,
        _key
      }
    }
  }`
  
  return await client.fetch(query, {slug})
}

// Load all artists
export async function loadAllArtists() {
  const query = `*[_type == "artist" && !(_id in path("drafts.**"))] | order(name asc) {
    _id,
    name,
    slug,
    image{
      asset->{_id, url},
      alt
    },
    "artworkCount": count(*[_type == "artwork" && artist._ref == ^._id && !(_id in path("drafts.**"))])
  }`
  
  return await client.fetch(query)
}

// Load gallery artworks (featured)
export async function loadGalleryArtworks(limit = 12) {
  const query = `*[_type == "artwork" && featured == true && !(_id in path("drafts.**"))] | order(_createdAt desc) [0...$limit] {
    _id,
    title,
    year,
    medium,
    dimensions,
    description,
    price,
    status,
    image{
      asset->{_id, url, metadata{lqip, dimensions}},
      alt
    },
    images[]{
      asset->{_id, url, metadata{lqip, dimensions}},
      alt,
      _key
    },
    artist->{
      _id,
      name
    }
  }`
  
  return await client.fetch(query, {limit})
}

// Image URL builder
export function urlFor(source) {
  if (!source?.asset) return ''
  const ref = source.asset._ref || source.asset._id
  const [, id, dimensions, format] = ref.split('-')
  return `https://cdn.sanity.io/images/8t5h923j/production/${id}-${dimensions}.${format}`
}
```

---

## 🎯 Query Selection Guide

| Use Case | Query | Slug? | Price/Status? |
|----------|-------|-------|---------------|
| Artist page | `ARTIST_WITH_ARTWORKS` | ❌ No | ✅ Yes |
| Artists list | `ALL_ARTISTS` | ✅ Yes | ❌ No |
| Homepage gallery | `GALLERY_FEATURED` | ❌ No | ✅ Yes |
| Artist gallery | `GALLERY_BY_ARTIST` | ❌ No | ✅ Yes |
| Artwork detail | `ARTWORK_DETAIL` | ✅ Yes | ✅ Yes |
| Admin inventory | `ALL_ARTWORKS` | ✅ Yes | ✅ Yes |

**Rule**: Gallery contexts (modals) = NO slug. Detail pages = WITH slug.

---

## 🚨 Critical Don'ts

❌ **NEVER** fetch `slug` in gallery queries (causes navigation interference)  
❌ **NEVER** forget to filter drafts: `!(_id in path("drafts.**"))`  
❌ **NEVER** fetch all fields if you only need a few  
❌ **NEVER** use `*[_type == "artwork"]{}` without projection  
❌ **NEVER** query without `useCdn: true` (slower)  

✅ **ALWAYS** include `price` and `status` for artworks  
✅ **ALWAYS** include `images[]` for modal galleries  
✅ **ALWAYS** use specific projections `{_id, title, price}`  
✅ **ALWAYS** filter by artist: `artist._ref == ^._id`  
✅ **ALWAYS** order results: `| order(year desc)`  

---

## 📞 Need Help?

- Missing data? Check [AUDIT_REPORT.md](AUDIT_REPORT.md)
- Frontend issues? See [FRONTEND_INTEGRATION_GUIDE.md](FRONTEND_INTEGRATION_GUIDE.md)
- Modal problems? Read [MODAL_GALLERY_FIX.md](MODAL_GALLERY_FIX.md)

All queries tested and verified with `projectId: 8t5h923j`, `dataset: production`.
