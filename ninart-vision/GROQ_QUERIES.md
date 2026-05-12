# GROQ Queries Reference - Artists & Galleries

> **🔴 CRITICAL**: For gallery sections displaying artworks in modals, **NEVER** fetch `slug` fields.  
> Slugs create navigation links that interfere with modal behavior. See [MODAL_GALLERY_FIX.md](MODAL_GALLERY_FIX.md) for details.

> **📝 NOTE**: The Artists page **excludes** the `bio` field from artist queries. Bio content is not rendered on the Artists page frontend. See [ARTISTS_PAGE_NO_BIO.md](ARTISTS_PAGE_NO_BIO.md) for details.

---

## 🏠 Homepage Query (Featured Artists Only)

```groq
*[_type == "homepage"][0]{
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
      showBio,
      
      artistSource == "manual" => {
        artists[]->{
          _id,
          name,
          "slug": slug.current,
          shortDescription,
          subtitle,
          specialty,
          bio,
          image{
            asset->{_id, url, metadata{lqip, dimensions}},
            alt,
            title
          }
        }
      },
      
      artistSource == "featured" => {
        "artists": *[_type == "artist" && featured == true][0...^.limit]{
          _id,
          name,
          "slug": slug.current,
          shortDescription,
          subtitle,
          specialty,
          bio,
          image{
            asset->{_id, url, metadata{lqip, dimensions}},
            alt,
            title
          }
        }
      }
    },
    
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
          image{asset->{_id, url, metadata{lqip, dimensions}}, alt},
          artist->{name}
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
          image{asset->{_id, url, metadata{lqip, dimensions}}, alt},
          artist->{name}
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
          image{asset->{_id, url, metadata{lqip, dimensions}}, alt},
          artist->{name}
        }
      }
    }
  }
}
```

> **⚠️ NOTICE**: Gallery queries above DO NOT include `slug` fields to prevent navigation interference with modals.

---

## 👥 Artists Page Query (All Artists)

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
          "slug": slug.current,
          shortDescription,
          subtitle,
          specialty,
          // Note: bio field excluded for Artists page
          image{
            asset->{_id, url, metadata{lqip, dimensions}},
            alt,
            title
          }
        }
      },
      
      artistSource == "all" => {
        "artists": *[_type == "artist"] | order(name asc)[0...^.limit]{
          _id,
          name,
          "slug": slug.current,
          shortDescription,
          subtitle,
          specialty,
          // Note: bio field excluded for Artists page
          image{
            asset->{_id, url, metadata{lqip, dimensions}},
            alt,
            title
          }
        }
      }
    }
  }
}
```

---

## 🔧 Key Differences

| Query Part | Homepage | Artists Page |
|------------|----------|--------------|
| **Document Type** | `homepage` | `page` |
| **Filter** | `featured == true` | No filter |
| **Artist Source** | `"featured"` | `"all"` |
| **Sorting** | Not specified | `order(name asc)` |
| **Bio Field** | ✅ Included | ❌ Excluded |
| **showBio Field** | ✅ Included | ❌ Excluded |

---

## 📦 Complete artistSection Projection

Use this in ANY page query (homepage, dynamic pages, etc.):

```groq
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
      slug,
      bio,
      image{asset->{_id, url, metadata{lqip, dimensions}}, alt}
    }
  },
  
  artistSource == "featured" => {
    "artists": *[_type == "artist" && featured == true][0...^.limit]{
      _id,
      name,
      slug,
      bio,
      image{asset->{_id, url, metadata{lqip, dimensions}}, alt}
    }
  },
  
  artistSource == "all" => {
    "artists": *[_type == "artist"] | order(name asc)[0...^.limit]{
      _id,
      name,
      "slug": slug.current,
      shortDescription,
      subtitle,
      specialty,
      // Note: bio field excluded when using "all" source (typically Artists page)
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

## ⚡ Quick Copy-Paste

### For TypeScript Query File

```typescript
import { defineQuery } from 'next-sanity'

export const HOMEPAGE_QUERY = defineQuery(`
  *[_type == "homepage"][0]{
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
        showBio,
        artistSource == "manual" => { artists[]->{_id, name, "slug": slug.current, shortDescription, subtitle, specialty, bio, image{asset->{_id, url, metadata{lqip, dimensions}}, alt, title}} },
        artistSource == "featured" => { "artists": *[_type == "artist" && featured == true][0...^.limit]{_id, name, "slug": slug.current, shortDescription, subtitle, specialty, bio, image{asset->{_id, url, metadata{lqip, dimensions}}, alt, title}} }
      }
    }
  }
`)

export const ARTISTS_PAGE_QUERY = defineQuery(`
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
        showBio,
        artistSource == "manual" => { artists[]->{_id, name, "slug": slug.current, shortDescription, subtitle, specialty, bio, image{asset->{_id, url, metadata{lqip, dimensions}}, alt, title}} },
        artistSource == "all" => { "artists": *[_type == "artist"] | order(name asc)[0...^.limit]{_id, name, "slug": slug.current, shortDescription, subtitle, specialty, bio, image{asset->{_id, url, metadata{lqip, dimensions}}, alt, title}} }
      }
    }
  }
`)
```
