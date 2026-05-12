# Frontend Integration Guide - Ninart Vision

## Overview
This guide shows how to integrate your static HTML/JS frontend with Sanity CMS for artworks and artists.

---

## 🔧 Sanity Client Setup

### 1. Install Dependencies
```bash
npm install @sanity/client@latest
```

### 2. Create Sanity Client (`js/sanity-client.js`)
```javascript
import {createClient} from '@sanity/client'

export const client = createClient({
  projectId: '8t5h923j',
  dataset: 'production',
  apiVersion: '2025-02-05',
  useCdn: true, // Use CDN for faster reads
})

// Image URL builder helper
export function urlFor(source) {
  return `https://cdn.sanity.io/images/8t5h923j/production/${source.asset._ref
    .replace('image-', '')
    .replace('-jpg', '.jpg')
    .replace('-png', '.png')
    .replace('-webp', '.webp')}`
}
```

---

## 📦 GROQ Queries

### Artist Page Query (Individual Artist)
```javascript
// Query for artist pages (e.g., /artists/nini-mzhavia)
const ARTIST_PAGE_QUERY = `*[_type == "artist" && slug.current == $slug][0]{
  _id,
  name,
  bio,
  image{
    asset->{_id, url, metadata{lqip, dimensions}},
    alt
  },
  "artworks": *[_type == "artwork" && artist._ref == ^._id && !(_id in path("drafts.**"))] | order(_createdAt desc) {
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

// Usage:
async function loadArtistPage(slug) {
  const artist = await client.fetch(ARTIST_PAGE_QUERY, {slug})
  return artist
}
```

### All Artists Query (Artists Listing Page)
```javascript
const ALL_ARTISTS_QUERY = `*[_type == "artist" && !(_id in path("drafts.**"))] | order(name asc) {
  _id,
  name,
  slug,
  image{
    asset->{_id, url, metadata{lqip, dimensions}},
    alt
  }
}`

async function loadAllArtists() {
  const artists = await client.fetch(ALL_ARTISTS_QUERY)
  return artists
}
```

### Gallery Section Query (Homepage/Pages)
```javascript
// ⚠️ CRITICAL: NO slug field in gallery queries!
const GALLERY_ARTWORKS_QUERY = `*[_type == "artwork" && featured == true && !(_id in path("drafts.**"))] | order(_createdAt desc) [0...12] {
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
  artist->{name}
}`

async function loadGalleryArtworks() {
  const artworks = await client.fetch(GALLERY_ARTWORKS_QUERY)
  return artworks
}
```

---

## 🎯 Frontend Rendering (Fixing Your Issues)

### Problem 1: Flashing/Disappearing Artworks

**Root Cause**: Race condition between legacy and Sanity data

#### ❌ WRONG (Causes Flashing):
```javascript
// data.js
export const legacyArtworks = [...]

// main.js
let artworks = legacyArtworks // Render immediately

// Then later:
loadSanityArtworks().then(sanityData => {
  artworks = sanityData // Replaces entire array - CAUSES FLASH
  renderArtworks()
})
```

#### ✅ CORRECT (Merge Strategy):
```javascript
// main.js
let artworks = []
let legacyArtworks = []
let sanityArtworks = []

async function initializeArtworks() {
  // 1. Load legacy as fallback
  legacyArtworks = await import('./data.js').then(m => m.artworks)
  
  // 2. Try to load from Sanity
  try {
    sanityArtworks = await loadGalleryArtworks()
  } catch (error) {
    console.warn('Sanity unavailable, using legacy data:', error)
    sanityArtworks = []
  }
  
  // 3. Merge (Sanity takes priority, legacy fills gaps)
  artworks = sanityArtworks.length > 0 ? sanityArtworks : legacyArtworks
  
  // 4. Render ONCE
  renderArtworks(artworks)
}

// Call on page load
initializeArtworks()
```

### Problem 2: Artist Pages Show Mixed Artworks

**Root Cause**: Not filtering by artist correctly

#### ✅ FIX: Filter in GROQ Query
```javascript
async function loadArtistArtworks(artistSlug) {
  const query = `*[_type == "artist" && slug.current == $slug][0]{
    _id,
    name,
    "artworks": *[_type == "artwork" && artist._ref == ^._id && !(_id in path("drafts.**"))] {
      _id,
      title,
      price,
      status,
      image,
      images
    }
  }`
  
  const result = await client.fetch(query, {slug: artistSlug})
  return result
}
```

### Problem 3: Images Don't Open in Modal

**Root Cause**: Wrapping images in `<a>` tags interferes with modal

#### ❌ WRONG (Creates Navigation Links):
```html
<a href="/artworks/artwork-slug">
  <img src="artwork.jpg" onclick="openModal(artwork)">
</a>
```

#### ✅ CORRECT (Pure Button/Div):
```html
<div class="artwork-card" onclick="openModal(artwork)" style="cursor: pointer;">
  <img src="artwork.jpg" alt="">
  <h3>Title</h3>
</div>
```

### Problem 4: Modal Gallery Images

**Fix**: Use `images[]` array with fallback to main `image`

```javascript
function openModal(artwork) {
  // Get all images for gallery
  const galleryImages = artwork.images && artwork.images.length > 0
    ? artwork.images
    : artwork.image
      ? [artwork.image]
      : []
  
  if (galleryImages.length === 0) {
    console.warn('No images available for:', artwork.title)
    return
  }
  
  // Populate modal
  const modal = document.getElementById('artwork-modal')
  const gallery = modal.querySelector('.modal-gallery')
  
  gallery.innerHTML = galleryImages.map((img, index) => `
    <img 
      src="${urlFor(img).width(1200).url()}" 
      alt="${img.alt || artwork.title}"
      class="modal-image ${index === 0 ? 'active' : ''}"
    >
  `).join('')
  
  // Show modal
  modal.classList.add('active')
  document.body.style.overflow = 'hidden'
}
```

### Problem 5: Price Rendering (₾null)

**Fix**: Proper null handling and formatting

```javascript
function formatPrice(artwork) {
  if (!artwork.price || artwork.price === null) {
    return '' // Don't show price if not set
  }
  
  return `₾${artwork.price}`
}

function getStatusBadge(artwork) {
  if (!artwork.status) {
    return '' // No badge if status missing
  }
  
  return artwork.status === 'sold' 
    ? '<span class="badge sold">SOLD</span>'
    : '<span class="badge sale">FOR SALE</span>'
}

// Usage in template:
function renderArtworkCard(artwork) {
  const priceText = formatPrice(artwork)
  const statusBadge = getStatusBadge(artwork)
  
  return `
    <div class="artwork-card" onclick="openModal(${JSON.stringify(artwork).replace(/"/g, '&quot;')})">
      <img src="${urlFor(artwork.image).width(400).url()}" alt="${artwork.image?.alt || artwork.title}">
      <h3>${artwork.title}</h3>
      <p class="artist">${artwork.artist?.name || 'Unknown Artist'}</p>
      ${priceText ? `<p class="price">${priceText}</p>` : ''}
      ${statusBadge}
    </div>
  `
}
```

---

## 🚀 Complete Integration Example

### HTML Structure
```html
<!DOCTYPE html>
<html>
<head>
  <title>Artist - Ninart Vision</title>
</head>
<body>
  <div id="loading">Loading...</div>
  <div id="error" style="display:none;">Failed to load artworks</div>
  
  <section id="artist-section" style="display:none;">
    <div id="artist-info"></div>
    <div id="artworks-grid"></div>
  </section>
  
  <!-- Modal -->
  <div id="artwork-modal" class="modal">
    <button class="modal-close" onclick="closeModal()">×</button>
    <div class="modal-content">
      <div class="modal-gallery"></div>
      <div class="modal-info"></div>
    </div>
  </div>
  
  <script type="module" src="/js/artist-page.js"></script>
</body>
</html>
```

### Complete JS (`js/artist-page.js`)
```javascript
import {client, urlFor} from './sanity-client.js'
import {legacyArtworks} from './data.js'

// Get artist slug from URL
const urlParams = new URLSearchParams(window.location.search)
const artistSlug = urlParams.get('artist') || window.location.pathname.split('/').pop()

let currentArtist = null
let currentArtworks = []

async function loadArtistData() {
  const loading = document.getElementById('loading')
  const error = document.getElementById('error')
  const section = document.getElementById('artist-section')
  
  try {
    // Load from Sanity
    const query = `*[_type == "artist" && slug.current == $slug][0]{
      _id,
      name,
      bio,
      image,
      "artworks": *[_type == "artwork" && artist._ref == ^._id && !(_id in path("drafts.**"))] | order(year desc, _createdAt desc) {
        _id,
        title,
        year,
        medium,
        dimensions,
        description,
        price,
        status,
        image,
        images
      }
    }`
    
    const artist = await client.fetch(query, {slug: artistSlug})
    
    if (!artist) {
      throw new Error('Artist not found')
    }
    
    currentArtist = artist
    currentArtworks = artist.artworks || []
    
    // Fallback to legacy if no Sanity artworks
    if (currentArtworks.length === 0) {
      currentArtworks = legacyArtworks.filter(a => 
        a.artistSlug === artistSlug
      )
    }
    
    renderArtistPage()
    
    loading.style.display = 'none'
    section.style.display = 'block'
    
  } catch (err) {
    console.error('Failed to load artist:', err)
    error.style.display = 'block'
    loading.style.display = 'none'
    
    // Try legacy fallback
    renderLegacyFallback()
  }
}

function renderArtistPage() {
  // Render artist info
  document.getElementById('artist-info').innerHTML = `
    <h1>${currentArtist.name}</h1>
    ${currentArtist.bio ? `<p>${currentArtist.bio}</p>` : ''}
  `
  
  // Render artworks grid
  const grid = document.getElementById('artworks-grid')
  
  if (currentArtworks.length === 0) {
    grid.innerHTML = '<p>No artworks available yet.</p>'
    return
  }
  
  grid.innerHTML = currentArtworks.map(artwork => {
    const price = artwork.price ? `₾${artwork.price}` : ''
    const status = artwork.status === 'sold' 
      ? '<span class="badge sold">SOLD</span>'
      : artwork.status === 'sale'
        ? '<span class="badge sale">FOR SALE</span>'
        : ''
    
    return `
      <div class="artwork-card" onclick='openModal(${JSON.stringify(artwork)})'>
        ${artwork.image ? `
          <img 
            src="${urlFor(artwork.image).width(400).height(300).url()}" 
            alt="${artwork.image.alt || artwork.title}"
          >
        ` : '<div class="no-image">No Image</div>'}
        
        <div class="artwork-info">
          <h3>${artwork.title}</h3>
          ${artwork.year ? `<p class="year">${artwork.year}</p>` : ''}
          ${artwork.medium ? `<p class="medium">${artwork.medium}</p>` : ''}
          ${price ? `<p class="price">${price}</p>` : ''}
          ${status}
        </div>
      </div>
    `
  }).join('')
}

// CRITICAL: Modal must use button/div, NOT <a> tags
window.openModal = function(artwork) {
  const modal = document.getElementById('artwork-modal')
  const gallery = modal.querySelector('.modal-gallery')
  const info = modal.querySelector('.modal-info')
  
  // Get gallery images (with fallback)
  const images = artwork.images && artwork.images.length > 0
    ? artwork.images
    : artwork.image
      ? [artwork.image]
      : []
  
  if (images.length === 0) {
    alert('No images available')
    return
  }
  
  // Render gallery
  gallery.innerHTML = images.map((img, i) => `
    <img 
      src="${urlFor(img).width(1200).url()}" 
      alt="${img.alt || artwork.title}"
      class="modal-image ${i === 0 ? 'active' : ''}"
      onclick="event.stopPropagation()"
    >
  `).join('')
  
  // Render info
  const price = artwork.price ? `₾${artwork.price}` : ''
  const status = artwork.status === 'sold' ? 'SOLD' : 'FOR SALE'
  
  info.innerHTML = `
    <h2>${artwork.title}</h2>
    ${artwork.year ? `<p><strong>Year:</strong> ${artwork.year}</p>` : ''}
    ${artwork.medium ? `<p><strong>Medium:</strong> ${artwork.medium}</p>` : ''}
    ${artwork.dimensions ? `<p><strong>Dimensions:</strong> ${artwork.dimensions}</p>` : ''}
    ${artwork.description ? `<p>${artwork.description}</p>` : ''}
    ${price ? `<p class="price"><strong>Price:</strong> ${price}</p>` : ''}
    ${artwork.status ? `<p class="status ${artwork.status}">${status}</p>` : ''}
  `
  
  modal.classList.add('active')
  document.body.style.overflow = 'hidden'
}

window.closeModal = function() {
  const modal = document.getElementById('artwork-modal')
  modal.classList.remove('active')
  document.body.style.overflow = ''
}

// Initialize on page load
loadArtistData()
```

---

## 📋 Checklist: Frontend Fixes

Apply these changes to your frontend code:

### ✅ Sanity Client
- [ ] Install `@sanity/client`
- [ ] Create client with projectId `8t5h923j`
- [ ] Use `useCdn: true` for performance

### ✅ GROQ Queries
- [ ] Artist page: Include `"artworks"` with filter `artist._ref == ^._id`
- [ ] Gallery: NO `slug` field
- [ ] Include `price`, `status`, `image`, `images[]`
- [ ] Filter drafts: `!(_id in path("drafts.**"))`

### ✅ Rendering Logic
- [ ] Load Sanity first, fallback to legacy
- [ ] Merge strategy (not replace)
- [ ] Render only once (no double render)
- [ ] NO `<a>` tags around gallery images
- [ ] Use `<div onclick>` or `<button>` for modals

### ✅ Modal Gallery
- [ ] Use `images[]` if available
- [ ] Fallback to `image` if `images[]` empty
- [ ] Stop event propagation on modal content
- [ ] Lock body scroll when open

### ✅ Price & Status
- [ ] Check `if (price)` before rendering
- [ ] Format: `₾${price}`
- [ ] Status badges: sold/sale classes
- [ ] Don't show if null/undefined

### ✅ Artist Filtering
- [ ] Query: `artist._ref == ^._id`
- [ ] Order: `order(year desc, _createdAt desc)`
- [ ] Only published: `!(_id in path("drafts.**"))`

---

## 🐛 Common Issues & Solutions

| Problem | Cause | Solution |
|---------|-------|----------|
| Artworks flash then disappear | Replace instead of merge | Use merge strategy |
| ₾null displayed | No null check | `if (price)` before render |
| Modal doesn't open | `<a>` tag interference | Use `<div>` or `<button>` |
| Wrong artist's works | No filter in query | Add `artist._ref == ^._id` |
| No gallery images | Not using `images[]` | Fallback to `image` |
| "Unknown fields" | Cached schema | Hard refresh browser |
| Double rendering | Multiple event listeners | Call render once |

---

## 🎯 Next Steps

1. **Locate your frontend code** (separate from this Sanity workspace)
2. **Apply the integration code** above
3. **Test with one artist page** first
4. **Verify modal works** before deploying
5. **Remove legacy data.js** once Sanity is stable

Need help with specific frontend code? Share the actual HTML/JS files and I'll provide targeted fixes.
