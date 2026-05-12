# Reusable Slider Pattern - Ninart Vision

## Two Slider Approaches

### 1. Embedded Slider (sliderSection)
**Use case**: Unique slider specific to one page section
- Slides defined inline
- Not reusable across pages
- Simpler for one-off sliders

### 2. Referenced Slider (slider + sliderReference)
**Use case**: Reusable slider across multiple pages/sections
- Slider defined once as document
- Referenced in multiple locations
- Edit once, updates everywhere
- Better for global sliders (e.g., homepage hero)

## Schema Structure

### Slider Document
```typescript
{
  _type: 'slider',
  _id: string,
  title: string,                    // Internal name
  slides: [{
    _key: string,
    image: {
      asset: reference,
      alt: string
    },
    caption: string,
    link: {
      linkType: 'internal' | 'external' | 'none',
      internalLink: reference,
      externalUrl: url
    }
  }],
  settings: {
    autoplay: boolean,
    interval: number,               // Seconds
    loop: boolean,
    showDots: boolean,
    showArrows: boolean
  }
}
```

### Slider Reference Object
```typescript
{
  _type: 'sliderReference',
  _key: string,
  title: string,                    // Optional section title
  slider: reference,                // To slider document
  enabled: boolean
}
```

### Embedded Slider Object
```typescript
{
  _type: 'sliderSection',
  _key: string,
  title: string,
  slides: [/* same as slider document */],
  autoplay: boolean,
  interval: number,
  enabled: boolean
}
```

## Usage Examples

### Homepage with Referenced Slider
```typescript
// Create slider document
{
  _type: 'slider',
  _id: 'main-hero-slider',
  title: 'Homepage Hero Slider',
  slides: [
    {
      _key: 'slide-1',
      image: { /* ... */ },
      caption: 'New Collection 2026',
      link: {
        linkType: 'internal',
        internalLink: { _ref: 'artwork-123' }
      }
    },
    {
      _key: 'slide-2',
      image: { /* ... */ },
      caption: 'Featured Artist',
      link: {
        linkType: 'internal',
        internalLink: { _ref: 'artist-456' }
      }
    }
  ],
  settings: {
    autoplay: true,
    interval: 5,
    loop: true,
    showDots: true,
    showArrows: true
  }
}

// Reference in homepage
{
  _type: 'homepage',
  content: [
    {
      _type: 'sliderReference',
      _key: 'abc123',
      title: null,                  // No section title
      slider: {
        _ref: 'main-hero-slider'
      },
      enabled: true
    }
  ]
}
```

### Multiple Pages Using Same Slider
```typescript
// Homepage
{
  _type: 'homepage',
  content: [{
    _type: 'sliderReference',
    slider: { _ref: 'featured-works-slider' }
  }]
}

// About page
{
  _type: 'page',
  slug: 'about',
  content: [{
    _type: 'sliderReference',
    title: 'Our Gallery',
    slider: { _ref: 'featured-works-slider' }
  }]
}
```

### Embedded Slider (One-off)
```typescript
{
  _type: 'page',
  slug: 'exhibitions',
  content: [
    {
      _type: 'sliderSection',       // Not reusable
      _key: 'def456',
      title: '2026 Exhibitions',
      slides: [
        {
          _key: 'slide-1',
          image: { /* ... */ },
          caption: 'Spring Exhibition'
        }
      ],
      autoplay: false,
      enabled: true
    }
  ]
}
```

## GROQ Queries

### Fetch Referenced Slider
```groq
*[_type == "homepage"][0]{
  content[]{
    ...,
    _type == "sliderReference" => {
      ...,
      slider->{
        title,
        slides[]{
          ...,
          image{
            asset->{_id, url, metadata{lqip, dimensions}},
            alt
          },
          link{
            ...,
            internalLink->{_type, slug}
          }
        },
        settings
      }
    }
  }
}
```

### Fetch Embedded Slider
```groq
*[_type == "page" && slug.current == $slug][0]{
  content[]{
    ...,
    _type == "sliderSection" => {
      ...,
      slides[]{
        ...,
        image{
          asset->{_id, url, metadata{lqip, dimensions}},
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

## React Components

### Slider Component (Shared)
```typescript
import Image from 'next/image'
import { urlFor } from '@/sanity/lib/image'
import { stegaClean } from '@sanity/client/stega'

type Slide = {
  _key: string
  image: SanityImage
  caption?: string
  link?: {
    linkType: string
    internalLink?: { _type: string; slug: { current: string } }
    externalUrl?: string
  }
}

type SliderSettings = {
  autoplay?: boolean
  interval?: number
  loop?: boolean
  showDots?: boolean
  showArrows?: boolean
}

export function Slider({ 
  slides, 
  settings 
}: { 
  slides: Slide[]
  settings?: SliderSettings 
}) {
  const autoplay = stegaClean(settings?.autoplay) || false
  const interval = stegaClean(settings?.interval) || 5
  
  return (
    <div className="slider" data-autoplay={autoplay} data-interval={interval}>
      {slides?.map((slide) => (
        <div key={slide._key} className="slide">
          <Image
            src={urlFor(slide.image).width(1920).height(1080).url()}
            alt={slide.image.alt || ''}
            width={1920}
            height={1080}
          />
          {slide.caption && <p className="caption">{slide.caption}</p>}
        </div>
      ))}
    </div>
  )
}
```

### Slider Reference Renderer
```typescript
type SliderReferenceProps = Extract<
  PageContent[number],
  { _type: 'sliderReference' }
>

export function SliderReferenceSection({ 
  title, 
  slider, 
  enabled 
}: SliderReferenceProps) {
  if (!stegaClean(enabled)) return null
  if (!slider) return null

  return (
    <section>
      {title && <h2>{title}</h2>}
      <Slider slides={slider.slides} settings={slider.settings} />
    </section>
  )
}
```

### Embedded Slider Renderer
```typescript
type SliderSectionProps = Extract<
  PageContent[number],
  { _type: 'sliderSection' }
>

export function SliderSection({ 
  title, 
  slides, 
  autoplay, 
  interval, 
  enabled 
}: SliderSectionProps) {
  if (!stegaClean(enabled)) return null

  return (
    <section>
      {title && <h2>{title}</h2>}
      <Slider 
        slides={slides} 
        settings={{ autoplay, interval }} 
      />
    </section>
  )
}
```

## When to Use Which Pattern

| Scenario | Use |
|----------|-----|
| Homepage hero slider used on multiple pages | **Referenced** |
| Global "Featured Works" slider | **Referenced** |
| Testimonials slider reused across site | **Referenced** |
| One-off exhibition slider | **Embedded** |
| Page-specific image gallery | **Embedded** |
| Testing slider before making it global | **Embedded** → migrate to **Referenced** |

## CMS Workflow

### Create Reusable Slider
1. Navigate to **Content** → **Sliders**
2. Click **Create** → **Slider**
3. Set internal title (e.g., "Homepage Hero 2026")
4. Add slides with images and captions
5. Configure autoplay settings
6. Publish

### Use Slider in Homepage
1. Open **Homepage** document
2. Add section → **Slider Reference**
3. Select your published slider
4. Optionally add section title
5. Publish

### Benefits
- Edit slider once → updates everywhere it's referenced
- Reorder slides by dragging
- Toggle individual slides on/off (remove from array)
- Control all slider behavior from one place
- Can create multiple sliders for different purposes
