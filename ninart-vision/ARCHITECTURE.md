# Ninart Vision CMS Architecture

## Overview
Fully flexible, content-driven art platform where every visible element is managed through Sanity Studio.

## Schema Structure

### Documents (Independent Entities)
- **homepage**: Singleton for homepage content
- **page**: Dynamic pages with flexible layouts
- **siteSettings**: Global site configuration (navigation, footer, branding)
- **artist**: Artist profiles
- **artwork**: Individual artworks

### Objects (Reusable Components)
- **pageBuilder**: Array of section types for flexible page composition
- **heroSection**: Hero banner with image, title, subtitle, CTA
- **gallerySection**: Artwork galleries with multiple display modes
- **textSection**: Rich text content with portable text
- **sliderSection**: Image carousels with captions and links

## Content Management Principles

### 1. Everything is Editable
- No hardcoded text or images
- All visible content sourced from CMS
- Content teams have full control

### 2. Flexible Page Building
Pages use `pageBuilder` array containing section objects:
- Drag and drop reordering
- Enable/disable toggle per section
- Add/remove sections dynamically

### 3. Multiple Content Sources
Gallery sections support three modes:
- **Manual**: Hand-picked artworks
- **Featured**: Automatic featured artwork selection
- **By Artist**: All works from specific artist

### 4. Smart Linking
Link objects support:
- Internal references (pages, artists, artworks)
- External URLs
- Conditional field visibility based on link type

## Frontend Integration

### Data Fetching Pattern

#### Homepage Query

> **🔴 IMPORTANT**: Gallery queries must NOT fetch `slug` fields. See [SANITY_GLOBAL_AUDIT.md](SANITY_GLOBAL_AUDIT.md)

```groq
*[_type == "homepage"][0]{
  title,
  seo,
  content[]{
    ...,
    _type == "gallerySection" => {
      ...,
      artworkSource == "manual" => {
        artworks[]->{
          _id,
          title,
          year,
          medium,
          dimensions,
          description,
          image{
            asset->{
              _id,
              url,
              metadata{lqip, dimensions}
            },
            alt
          },
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
          image{
            asset->{
              _id,
              url,
              metadata{lqip, dimensions}
            },
            alt
          },
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
          image{
            asset->{
              _id,
              url,
              metadata{lqip, dimensions}
            },
            alt
          },
          artist->{name}
        }
      }
    }
  }
}
```

#### Dynamic Page Query
```groq
*[_type == "page" && slug.current == $slug][0]{
  title,
  seo,
  content[]{
    ...,
    _type == "heroSection" => {
      ...,
      cta{
        ...,
        internalLink->{_type, slug}
      },
      image{
        asset->{
          _id,
          url,
          metadata{lqip, dimensions}
        },
        alt
      }
    },
    _type == "sliderSection" => {
      ...,
      slides[]{
        ...,
        image{
          asset->{
            _id,
            url,
            metadata{lqip, dimensions}
          },
          alt
        },
        link{
          ...,
          internalLink->{_type, slug}
        }
      }
    }
  }
}
```

#### Site Settings Query
```groq
*[_type == "siteSettings"][0]{
  siteName,
  siteDescription,
  logo{
    asset->{
      _id,
      url,
      metadata{lqip, dimensions}
    },
    alt
  },
  mainNavigation[]{
    label,
    linkType,
    linkType == "page" => {
      pageLink->{_type, slug}
    },
    externalUrl
  },
  footer
}
```

### Rendering Pattern

#### Page Builder Renderer (React/Next.js)
```typescript
import { stegaClean } from '@sanity/client/stega'

type PageContent = Extract<NonNullable<PageResult>["content"], unknown[]>
type Section = PageContent[number]

export function PageBuilder({ content }: { content: Section[] }) {
  if (!Array.isArray(content)) return null

  return (
    <main>
      {content.map((section) => {
        // Filter disabled sections
        if (!stegaClean(section.enabled)) return null

        switch (section._type) {
          case 'heroSection':
            return <HeroSection key={section._key} {...section} />
          case 'gallerySection':
            return <GallerySection key={section._key} {...section} />
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

#### Gallery Section Logic
```typescript
function GallerySection({ title, description, artworks, layout, enabled }: GallerySectionProps) {
  if (!stegaClean(enabled)) return null

  const layoutClass = stegaClean(layout) === 'masonry' ? 'masonry' : 
                      stegaClean(layout) === 'slider' ? 'slider' : 'grid'

  return (
    <section>
      {title && <h2>{title}</h2>}
      {description && <p>{description}</p>}
      <div className={layoutClass}>
        {artworks?.map((artwork) => (
          <ArtworkCard key={artwork._id} {...artwork} />
        ))}
      </div>
    </section>
  )
}
```

#### Navigation Builder
```typescript
function Navigation({ items }: { items: NavigationItem[] }) {
  return (
    <nav>
      {items?.map((item, index) => {
        const linkType = stegaClean(item.linkType)
        
        let href = '/'
        if (linkType === 'homepage') {
          href = '/'
        } else if (linkType === 'page' && item.pageLink?.slug?.current) {
          href = `/${item.pageLink.slug.current}`
        } else if (linkType === 'external') {
          href = item.externalUrl || '#'
        }

        return (
          <Link key={index} href={href}>
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
```

## Key Features

### 1. Singleton Documents
Homepage and siteSettings use single-instance pattern:
- Only one document exists
- No slug needed
- Query by type alone

### 2. Conditional Fields
Fields show/hide based on parent values:
```typescript
hidden: ({parent}) => parent?.linkType !== 'internal'
```

### 3. Cross-Field Validation
Validation considers sibling field values:
```typescript
validation: (Rule) => Rule.custom((value, context) => {
  const parent = context.parent as any
  if (parent?.artworkSource === 'manual' && !value) {
    return 'Required when manual mode selected'
  }
  return true
})
```

### 4. Preview Optimization
All documents and objects include preview configuration:
- Shows relevant context in Studio lists
- Uses images when available
- Falls back to icons
- Displays state (enabled/disabled)

### 5. Visual Editing Ready
- Uses `_key` for array items (required for overlays)
- Image fields include alt text
- Proper hotspot configuration

## Expansion Strategy

### Adding New Section Types
1. Create new object in `schemaTypes/objects/[sectionName].ts`
2. Add to pageBuilder array in `objects/pageBuilder.ts`
3. Add to index exports
4. Implement frontend component with type extraction

### Adding New Document Types
1. Create document in `schemaTypes/[documentName].ts`
2. Add to index exports
3. Optionally add to internal link references
4. Implement frontend routing and queries

### Global Settings Extension
Add fields to siteSettings for:
- Announcement banners
- Cookie consent text
- Analytics IDs
- Contact information
- Opening hours

All manageable from CMS without code changes.
