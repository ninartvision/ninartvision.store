# Homepage Schema - Ninart Vision

## Document Structure

### Homepage (Singleton)
```typescript
{
  _type: 'homepage',
  title: string,                    // Internal reference
  seo: {
    metaTitle: string,
    metaDescription: string,
    ogImage: image
  },
  content: pageBuilder[]            // Array of sections
}
```

## Section Types

### 1. Hero Section
**Purpose**: Large banner with image, title, subtitle, and call-to-action

```typescript
{
  _type: 'heroSection',
  _key: string,                     // Auto-generated
  title: string,
  subtitle: string,
  image: image,
  cta: {
    text: string,
    linkType: 'internal' | 'external',
    internalLink: reference,        // To page, artist, or artwork
    externalUrl: url
  },
  enabled: boolean
}
```

### 2. Gallery Section
**Purpose**: Display artworks in grid, masonry, or slider layout

```typescript
{
  _type: 'gallerySection',
  _key: string,
  title: string,
  description: string,
  layout: 'grid' | 'masonry' | 'slider',
  artworkSource: 'manual' | 'featured' | 'byArtist',
  
  // If manual
  artworks: reference[],            // To artwork documents
  
  // If byArtist
  artist: reference,                // To artist document
  
  // If featured or byArtist
  limit: number,                    // Max artworks to show
  
  enabled: boolean
}
```

### 3. Artist Section
**Purpose**: Showcase artists in grid, list, or carousel

```typescript
{
  _type: 'artistSection',
  _key: string,
  title: string,
  description: string,
  artistSource: 'manual' | 'featured' | 'all',
  
  // If manual
  artists: reference[],             // To artist documents
  
  // If featured
  limit: number,                    // Max artists to show
  
  layout: 'grid' | 'list' | 'carousel',
  showBio: boolean,                 // Show biography preview
  enabled: boolean
}
```

### 4. Text Section
**Purpose**: Rich text content with formatting

```typescript
{
  _type: 'textSection',
  _key: string,
  title: string,
  content: portableText[],          // Rich text editor
  alignment: 'left' | 'center' | 'right',
  enabled: boolean
}
```

### 5. Slider Section
**Purpose**: Image carousel with captions and optional links

```typescript
{
  _type: 'sliderSection',
  _key: string,
  title: string,
  slides: [{
    _key: string,
    image: image,
    caption: string,
    link: {
      linkType: 'internal' | 'external' | 'none',
      internalLink: reference,
      externalUrl: url
    }
  }],
  autoplay: boolean,
  interval: number,                 // Seconds between slides
  enabled: boolean
}
```

## Field Naming Convention

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Section heading |
| `description` | text | Section subheading or intro |
| `enabled` | boolean | Show/hide toggle |
| `_key` | string | Unique identifier for array items |
| `layout` | string | Visual arrangement option |
| `artworkSource` | string | How to select artworks |
| `artistSource` | string | How to select artists |
| `limit` | number | Max items to display |
| `linkType` | string | Internal vs external link |
| `internalLink` | reference | Link to other document |
| `externalUrl` | url | External web address |

## GROQ Query Examples

### Fetch Full Homepage

> **🔴 IMPORTANT**: Gallery sections must NOT fetch `slug` fields to prevent navigation interference.  
> See [MODAL_GALLERY_FIX.md](MODAL_GALLERY_FIX.md) and [SANITY_GLOBAL_AUDIT.md](SANITY_GLOBAL_AUDIT.md)

```groq
*[_type == "homepage"][0]{
  title,
  seo,
  content[]{
    ...,
    _type == "heroSection" => {
      ...,
      image{
        asset->{_id, url, metadata{lqip, dimensions}},
        alt
      },
      cta{
        ...,
        internalLink->{_type, slug}
      }
    },
    _type == "gallerySection" => {
      ...,
      artworkSource == "manual" => {
        artworks[]->{
          _id, title, year, medium, dimensions, description,
          image{asset->{_id, url, metadata{lqip, dimensions}}, alt},
          artist->{name}
        }
      },
      artworkSource == "featured" => {
        "artworks": *[_type == "artwork" && featured == true][0...^.limit]{
          _id, title, year, medium, dimensions, description,
          image{asset->{_id, url, metadata{lqip, dimensions}}, alt},
          artist->{name}
        }
      },
      artworkSource == "byArtist" => {
        "artworks": *[_type == "artwork" && artist._ref == ^.artist._ref][0...^.limit]{
          _id, title, year, medium, dimensions, description,
          image{asset->{_id, url, metadata{lqip, dimensions}}, alt},
          artist->{name}
        }
      }
    },
    _type == "artistSection" => {
      ...,
      artistSource == "manual" => {
        artists[]->{
          _id, name, slug,
          image{asset->{_id, url, metadata{lqip, dimensions}}, alt},
          bio
        }
      },
      artistSource == "featured" => {
        "artists": *[_type == "artist" && featured == true][0...^.limit]{
          _id, name, slug,
          image{asset->{_id, url, metadata{lqip, dimensions}}, alt},
          bio
        }
      },
      artistSource == "all" => {
        "artists": *[_type == "artist"] | order(name asc)[0...^.limit]{
          _id, name, slug,
          image{asset->{_id, url, metadata{lqip, dimensions}}, alt},
          bio
        }
      }
    },
    _type == "sliderSection" => {
      ...,
      slides[]{
        ...,
        image{asset->{_id, url, metadata{lqip, dimensions}}, alt},
        link{
          ...,
          internalLink->{_type, slug}
        }
      }
    }
  }
}
```

### Fetch Only Enabled Sections
```groq
*[_type == "homepage"][0]{
  title,
  "content": content[enabled == true]{
    // ... same projection as above
  }
}
```

## React Rendering Pattern

```typescript
export function Homepage({ content }: { content: Section[] }) {
  return (
    <main>
      {content?.map((section) => {
        if (!stegaClean(section.enabled)) return null

        switch (section._type) {
          case 'heroSection':
            return <HeroSection key={section._key} {...section} />
          case 'gallerySection':
            return <GallerySection key={section._key} {...section} />
          case 'artistSection':
            return <ArtistSection key={section._key} {...section} />
          case 'textSection':
            return <TextSection key={section._key} {...section} />
          case 'sliderSection':
            return <SliderSection key={section._key} {...section} />
          default:
            return null
        }
      })}
    </main>
  )
}
```

## CMS User Workflow

1. Navigate to **Homepage** document in Sanity Studio
2. Click **Page Content** field
3. Click **Add** to insert new section
4. Select section type from menu
5. Fill in section fields
6. Drag sections to reorder
7. Toggle **Enabled** to show/hide
8. Click **Remove** to delete section
9. Publish changes

## Key Benefits

- **Zero hardcoded content**: All text, images, links editable
- **Infinite flexibility**: Add/remove/reorder sections at will
- **Reuses existing data**: References artist and artwork documents
- **Smart content sourcing**: Manual selection or automatic featured filtering
- **Production ready**: Proper validation, previews, accessibility
