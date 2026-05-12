# 🔴 CRITICAL FIX: Modal Gallery Navigation Issue

## Problem Summary
Clicking artwork images in modal galleries sometimes redirects to "Shop" or "Support Project" pages instead of opening the modal. This happens because:

1. Artwork data from Sanity includes `slug` fields
2. Frontend renders artworks as `<Link>` components with navigation URLs
3. When modal state breaks or there's DOM overlap, clicks fall through to these underlying links

---

## 🎯 SOLUTION OVERVIEW

The fix requires changes in **THREE** areas:
1. **Sanity GROQ Queries** - Remove slug from gallery contexts
2. **Frontend Rendering** - Never wrap gallery images in `<Link>` tags
3. **Component Logic** - Defensive modal click handling

---

## 📦 PART 1: Update GROQ Queries

### ❌ REMOVE `slug` from Gallery Section Queries

**Problem**: Current queries fetch `slug` which tempts developers to create navigation links.

**File**: `sanity/lib/queries.ts` (or wherever your queries are)

#### BEFORE (DANGEROUS):
```typescript
_type == "gallerySection" => {
  title,
  description,
  layout,
  artworkSource,
  
  artworkSource == "manual" => {
    artworks[]->{
      _id,
      title,
      slug,        // ❌ REMOVE THIS
      year,
      medium,
      image{
        asset->{_id, url, metadata{lqip, dimensions}},
        alt
      },
      artist->{name, slug}  // ❌ Remove slug from artist too
    }
  },
  
  artworkSource == "featured" => {
    "artworks": *[_type == "artwork" && featured == true][0...^.limit]{
      _id,
      title,
      slug,        // ❌ REMOVE THIS
      year,
      medium,
      image{
        asset->{_id, url, metadata{lqip, dimensions}},
        alt
      },
      artist->{name, slug}  // ❌ Remove slug from artist too
    }
  },
  
  artworkSource == "byArtist" => {
    "artworks": *[_type == "artwork" && artist._ref == ^.artist._ref][0...^.limit]{
      _id,
      title,
      slug,        // ❌ REMOVE THIS
      year,
      medium,
      image{
        asset->{_id, url, metadata{lqip, dimensions}},
        alt
      },
      artist->{name, slug}  // ❌ Remove slug from artist too
    }
  }
}
```

#### AFTER (SAFE):
```typescript
_type == "gallerySection" => {
  title,
  description,
  layout,
  artworkSource,
  
  artworkSource == "manual" => {
    artworks[]->{
      _id,
      title,
      year,
      medium,
      dimensions,
      description,
      image{
        asset->{_id, url, metadata{lqip, dimensions}},
        alt
      },
      artist->{name}  // ✅ Only name, no slug
    }
  },
  
  artworkSource == "featured" => {
    "artworks": *[_type == "artwork" && featured == true][0...^.limit]{
      _id,
      title,
      year,
      medium,
      dimensions,
      description,
      image{
        asset->{_id, url, metadata{lqip, dimensions}},
        alt
      },
      artist->{name}  // ✅ Only name, no slug
    }
  },
  
  artworkSource == "byArtist" => {
    "artworks": *[_type == "artwork" && artist._ref == ^.artist._ref][0...^.limit]{
      _id,
      title,
      year,
      medium,
      dimensions,
      description,
      image{
        asset->{_id, url, metadata{lqip, dimensions}},
        alt
      },
      artist->{name}  // ✅ Only name, no slug
    }
  }
}
```

### ✅ Key Changes:
- **REMOVED**: `slug` from artwork objects
- **REMOVED**: `slug` from artist references
- **ADDED**: `dimensions` and `description` for modal display
- **KEPT**: Only essential gallery data

---

## 🎨 PART 2: Update Frontend Component

### CRITICAL: Use `<button>` Instead of `<Link>`

**File**: `components/sections/GallerySection.tsx`

#### ❌ BEFORE (CREATES NAVIGATION LINKS):
```typescript
export function GallerySection({ title, description, layout, artworks }: Props) {
  const layoutClass = stegaClean(layout) || 'grid'

  return (
    <section className="gallery-section">
      {title && <h2>{title}</h2>}
      {description && <p>{description}</p>}
      
      <div className={`gallery-${layoutClass}`}>
        {artworks?.map((artwork) => (
          <Link                           // ❌ DANGEROUS
            key={artwork._id} 
            href={`/artworks/${artwork.slug?.current}`}
            className="artwork-card"
          >
            {artwork.image && (
              <Image
                src={urlFor(artwork.image).width(800).height(600).url()}
                alt={artwork.image.alt || artwork.title || ''}
                width={800}
                height={600}
              />
            )}
            
            <div className="artwork-info">
              <h3>{artwork.title}</h3>
              {artwork.artist && <p className="artist">{artwork.artist.name}</p>}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
```

#### ✅ AFTER (MODAL SAFE):
```typescript
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { urlFor } from '@/sanity/lib/image'
import { stegaClean } from '@sanity/client/stega'
import type { HOMEPAGE_QUERYResult } from '@/sanity/types'

type Props = Extract<
  NonNullable<NonNullable<HOMEPAGE_QUERYResult>['content']>[number],
  { _type: 'gallerySection' }
>

export function GallerySection({ title, description, layout, artworks }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  
  const layoutClass = stegaClean(layout) || 'grid'

  const openModal = (index: number) => {
    setSelectedIndex(index)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
  }

  return (
    <>
      <section className="gallery-section">
        {title && <h2>{title}</h2>}
        {description && <p>{description}</p>}
        
        <div className={`gallery-${layoutClass}`}>
          {artworks?.map((artwork, index) => (
            <button                        // ✅ SAFE: button, not Link
              key={artwork._id}
              onClick={(e) => {
                e.preventDefault()         // ✅ Prevent any default behavior
                e.stopPropagation()        // ✅ Stop event bubbling
                openModal(index)
              }}
              className="artwork-card"
              type="button"                // ✅ Explicit button type
              aria-label={`View ${artwork.title || 'artwork'} by ${artwork.artist?.name || 'unknown artist'}`}
            >
              {artwork.image && (
                <Image
                  src={urlFor(artwork.image).width(800).height(600).url()}
                  alt={artwork.image.alt || artwork.title || ''}
                  width={800}
                  height={600}
                  placeholder={artwork.image.asset?.metadata?.lqip ? 'blur' : 'empty'}
                  blurDataURL={artwork.image.asset?.metadata?.lqip}
                />
              )}
              
              <div className="artwork-info">
                <h3>{artwork.title}</h3>
                {artwork.artist && <p className="artist">{artwork.artist.name}</p>}
                {artwork.year && <p className="year">{artwork.year}</p>}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Modal */}
      {modalOpen && artworks && artworks.length > 0 && (
        <div 
          className="modal-overlay"
          onClick={closeModal}              // ✅ Click overlay to close
          role="dialog"
          aria-modal="true"
        >
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}  // ✅ Prevent overlay click when clicking content
          >
            <button
              className="modal-close"
              onClick={closeModal}
              type="button"
              aria-label="Close modal"
            >
              ✕
            </button>
            
            {artworks[selectedIndex] && (
              <div className="modal-artwork">
                {artworks[selectedIndex].image && (
                  <Image
                    src={urlFor(artworks[selectedIndex].image).width(1600).height(1200).url()}
                    alt={artworks[selectedIndex].image.alt || artworks[selectedIndex].title || ''}
                    width={1600}
                    height={1200}
                    className="modal-image"
                  />
                )}
                
                <div className="modal-info">
                  <h2>{artworks[selectedIndex].title}</h2>
                  {artworks[selectedIndex].artist && (
                    <p className="artist">{artworks[selectedIndex].artist.name}</p>
                  )}
                  {artworks[selectedIndex].year && (
                    <p className="year">{artworks[selectedIndex].year}</p>
                  )}
                  {artworks[selectedIndex].medium && (
                    <p className="medium">{artworks[selectedIndex].medium}</p>
                  )}
                  {artworks[selectedIndex].dimensions && (
                    <p className="dimensions">{artworks[selectedIndex].dimensions}</p>
                  )}
                  {artworks[selectedIndex].description && (
                    <p className="description">{artworks[selectedIndex].description}</p>
                  )}
                </div>

                {/* Navigation buttons */}
                {artworks.length > 1 && (
                  <>
                    <button
                      className="modal-nav modal-prev"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedIndex((prev) => 
                          prev > 0 ? prev - 1 : artworks.length - 1
                        )
                      }}
                      type="button"
                      aria-label="Previous artwork"
                    >
                      ‹
                    </button>
                    <button
                      className="modal-nav modal-next"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedIndex((prev) => 
                          prev < artworks.length - 1 ? prev + 1 : 0
                        )
                      }}
                      type="button"
                      aria-label="Next artwork"
                    >
                      ›
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
```

### ✅ Key Changes:
- **REMOVED**: All `<Link>` components
- **ADDED**: `<button>` elements with proper type
- **ADDED**: `e.preventDefault()` and `e.stopPropagation()`
- **ADDED**: Modal state management
- **ADDED**: Defensive click handling
- **ADDED**: Keyboard accessibility

---

## 🎨 PART 3: Add Modal Styles

**File**: `app/globals.css` or `styles/gallery.css`

```css
/* Gallery Cards - Remove link styling */
.artwork-card {
  display: block;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: transform 0.2s, box-shadow 0.2s;
}

.artwork-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.artwork-card:focus-visible {
  outline: 2px solid #007bff;
  outline-offset: 2px;
}

/* Modal Overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 2rem;
  cursor: pointer;
}

/* Modal Content */
.modal-content {
  position: relative;
  max-width: 1400px;
  max-height: 90vh;
  background: white;
  border-radius: 8px;
  overflow: auto;
  cursor: default;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

/* Modal Close Button */
.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 24px;
  cursor: pointer;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.modal-close:hover {
  background: rgba(0, 0, 0, 0.9);
}

/* Modal Image */
.modal-image {
  width: 100%;
  height: auto;
  display: block;
}

/* Modal Info */
.modal-info {
  padding: 2rem;
}

.modal-info h2 {
  margin: 0 0 1rem;
  font-size: 2rem;
}

.modal-info .artist {
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.modal-info .year,
.modal-info .medium,
.modal-info .dimensions {
  color: #888;
  margin: 0.25rem 0;
}

.modal-info .description {
  margin-top: 1rem;
  line-height: 1.6;
  color: #333;
}

/* Modal Navigation */
.modal-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  width: 50px;
  height: 50px;
  font-size: 32px;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  z-index: 10;
}

.modal-nav:hover {
  background: rgba(0, 0, 0, 0.8);
}

.modal-prev {
  left: 1rem;
}

.modal-next {
  right: 1rem;
}
```

---

## 🔐 PART 4: Additional Safety Measures

### A. TypeScript Type Updates

**File**: `sanity/types.ts` or wherever your types are generated

Ensure artwork types in gallery contexts DO NOT include `slug`:

```typescript
// Gallery Artwork Type (Modal Context)
export interface GalleryArtwork {
  _id: string
  title: string
  year?: number
  medium?: string
  dimensions?: string
  description?: string
  image: SanityImage
  artist?: {
    name: string
    // NO slug field
  }
  // NO slug field here
}

// Full Artwork Type (Detail Page Context)
export interface Artwork extends GalleryArtwork {
  slug: { current: string }  // Only include slug for detail pages
  // ... other fields
}
```

### B. Prevent Accidental Link Wrapping

Add a ESLint rule to catch accidental Link usage:

**File**: `.eslintrc.js` or `eslint.config.mjs`

```javascript
rules: {
  'no-restricted-syntax': [
    'error',
    {
      selector: 'JSXElement[openingElement.name.name="Link"] > JSXElement[openingElement.name.name="Image"]',
      message: 'Do not wrap gallery images in Link components. Use buttons with onClick handlers instead.',
    },
  ],
}
```

---

## ✅ TESTING CHECKLIST

After implementing the fix:

- [ ] Gallery displays correctly (grid/masonry/slider)
- [ ] Clicking any artwork opens modal (not navigation)
- [ ] Modal displays correct artwork information
- [ ] Modal navigation buttons work (prev/next)
- [ ] Modal close button works
- [ ] Clicking overlay closes modal
- [ ] ESC key closes modal
- [ ] No redirects to "Shop" or "Support Project"
- [ ] Works across all artists
- [ ] Works on mobile devices
- [ ] Keyboard navigation works (Tab, Enter, Esc)

---

## 🚨 CRITICAL RULES

### DO NOT:
1. ❌ Fetch `slug` in gallery GROQ queries
2. ❌ Wrap gallery images in `<Link>` components
3. ❌ Use `<a>` tags for gallery items
4. ❌ Auto-bind navigation to artwork clicks
5. ❌ Trust Sanity data to not contain navigation fields

### ALWAYS:
1. ✅ Use `<button>` for gallery items
2. ✅ Add `e.preventDefault()` and `e.stopPropagation()`
3. ✅ Set explicit `type="button"`
4. ✅ Manage modal state in component
5. ✅ Query only required fields for context

---

## 📚 RELATED FILES

Update these files in your frontend:

1. `sanity/lib/queries.ts` - Remove slug from gallery queries
2. `components/sections/GallerySection.tsx` - Replace Link with button
3. `app/globals.css` - Add modal styles
4. `sanity/types.ts` - Update TypeScript types
5. `.eslintrc.js` - Add preventive lint rules

---

## 🎯 EXPECTED OUTCOME

After this fix:
- ✅ Clicking artworks ALWAYS opens modal
- ✅ Modal NEVER triggers navigation
- ✅ Stable modal behavior across all artists
- ✅ No unexpected redirects
- ✅ Clean separation: galleries for viewing, detail pages for navigation
