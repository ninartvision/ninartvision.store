# 🚀 QUICK FIX GUIDE: Modal Gallery Navigation

> **TL;DR**: Replace `<Link>` with `<button>` for gallery artworks. Remove `slug` from queries.

---

## ⚡ 3-Step Fix

### 1️⃣ Update Your GROQ Query

**File**: `sanity/lib/queries.ts`

**Find this** (in gallerySection):
```groq
artworks[]->{
  _id,
  title,
  slug,        // ❌ REMOVE
  // ...
  artist->{
    name,
    slug       // ❌ REMOVE
  }
}
```

**Replace with**:
```groq
artworks[]->{
  _id,
  title,
  year,
  medium,
  dimensions,
  description,
  image{asset->{_id, url, metadata{lqip, dimensions}}, alt},
  artist->{name}  // ✅ No slug
}
```

---

### 2️⃣ Update Gallery Component

**File**: `components/sections/GallerySection.tsx`

**Find this**:
```tsx
<Link href={`/artworks/${artwork.slug?.current}`}>
  <Image src={...} />
</Link>
```

**Replace with**:
```tsx
'use client'
import { useState } from 'react'

// ... in component:
const [modalOpen, setModalOpen] = useState(false)
const [selectedIndex, setSelectedIndex] = useState(0)

return (
  <button
    onClick={(e) => {
      e.preventDefault()
      e.stopPropagation()
      setSelectedIndex(index)
      setModalOpen(true)
    }}
    type="button"
  >
    <Image src={...} />
  </button>
)
```

---

### 3️⃣ Add Modal

After the gallery `<section>`:

```tsx
{modalOpen && (
  <div className="modal-overlay" onClick={() => setModalOpen(false)}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      <button className="modal-close" onClick={() => setModalOpen(false)}>✕</button>
      
      {artworks[selectedIndex]?.image && (
        <Image
          src={urlFor(artworks[selectedIndex].image).width(1600).url()}
          alt={artworks[selectedIndex].image.alt}
          width={1600}
          height={1200}
        />
      )}
      
      {/* Modal info and navigation - see full guide */}
    </div>
  </div>
)}
```

---

## 📋 Complete Code

Full implementation: [MODAL_GALLERY_FIX.md](MODAL_GALLERY_FIX.md)

---

## 🎨 Quick CSS

```css
.artwork-card {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 1400px;
  max-height: 90vh;
  overflow: auto;
}
```

Full styles: [MODAL_GALLERY_FIX.md](MODAL_GALLERY_FIX.md#part-3-add-modal-styles)

---

## ✅ Test

- [ ] Click artwork → modal opens (no navigation)
- [ ] Click overlay → modal closes
- [ ] No redirects to Shop/Support pages

---

## 🆘 Full Docs

- [MODAL_GALLERY_FIX.md](MODAL_GALLERY_FIX.md) - Complete guide
- [GROQ_QUERIES.md](GROQ_QUERIES.md) - Safe query patterns
- [FRONTEND_RENDERING.md](FRONTEND_RENDERING.md) - Full component code
