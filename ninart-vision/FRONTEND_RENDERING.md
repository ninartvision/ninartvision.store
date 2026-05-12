# Homepage Dynamic Rendering - Ninart Vision

## Complete GROQ Query

```groq
// queries.ts
import { defineQuery } from 'next-sanity'

export const HOMEPAGE_QUERY = defineQuery(`
  *[_type == "homepage"][0]{
    title,
    seo{
      metaTitle,
      metaDescription,
      ogImage{
        asset->{
          _id,
          url,
          metadata{lqip, dimensions}
        }
      }
    },
    content[enabled == true]{
      _type,
      _key,
      
      // Hero Section
      _type == "heroSection" => {
        title,
        subtitle,
        image{
          asset->{
            _id,
            url,
            metadata{lqip, dimensions}
          },
          alt
        },
        cta{
          text,
          linkType,
          linkType == "internal" => {
            internalLink->{
              _type,
              _type == "page" => {slug},
              _type == "artist" => {slug},
              _type == "artwork" => {slug}
            }
          },
          linkType == "external" => {externalUrl}
        }
      },
      
      // Gallery Section
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
      },
      
      // Artist Section
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
            image{
              asset->{
                _id,
                url,
                metadata{lqip, dimensions}
              },
              alt
            }
          }
        },
        
        artistSource == "featured" => {
          "artists": *[_type == "artist" && featured == true][0...^.limit]{
            _id,
            name,
            slug,
            bio,
            image{
              asset->{
                _id,
                url,
                metadata{lqip, dimensions}
              },
              alt
            }
          }
        },
        
        artistSource == "all" => {
          "artists": *[_type == "artist"] | order(name asc)[0...^.limit]{
            _id,
            name,
            slug,
            bio,
            image{
              asset->{
                _id,
                url,
                metadata{lqip, dimensions}
              },
              alt
            }
          }
        }
      },
      
      // Article Section
      _type == "articleSection" => {
        title,
        description,
        layout,
        articleSource,
        showExcerpt,
        showImage,
        
        articleSource == "manual" => {
          articles[]->{
            _id,
            title,
            slug,
            excerpt,
            category,
            publishedAt,
            mainImage{
              asset->{
                _id,
                url,
                metadata{lqip, dimensions}
              },
              alt
            }
          }
        },
        
        articleSource == "featured" => {
          "articles": *[_type == "article" && featured == true && published == true] | order(publishedAt desc)[0...^.limit]{
            _id,
            title,
            slug,
            excerpt,
            category,
            publishedAt,
            mainImage{
              asset->{
                _id,
                url,
                metadata{lqip, dimensions}
              },
              alt
            }
          }
        },
        
        articleSource == "recent" => {
          "articles": *[_type == "article" && published == true] | order(publishedAt desc)[0...^.limit]{
            _id,
            title,
            slug,
            excerpt,
            category,
            publishedAt,
            mainImage{
              asset->{
                _id,
                url,
                metadata{lqip, dimensions}
              },
              alt
            }
          }
        },
        
        articleSource == "byCategory" => {
          "articles": *[_type == "article" && category == ^.category && published == true] | order(publishedAt desc)[0...^.limit]{
            _id,
            title,
            slug,
            excerpt,
            category,
            publishedAt,
            mainImage{
              asset->{
                _id,
                url,
                metadata{lqip, dimensions}
              },
              alt
            }
          }
        }
      },
      
      // Text Section
      _type == "textSection" => {
        title,
        content,
        alignment
      },
      
      // Slider Section (Embedded)
      _type == "sliderSection" => {
        title,
        autoplay,
        interval,
        slides[]{
          _key,
          image{
            asset->{
              _id,
              url,
              metadata{lqip, dimensions}
            },
            alt
          },
          caption,
          link{
            linkType,
            linkType == "internal" => {
              internalLink->{
                _type,
                _type == "page" => {slug},
                _type == "artist" => {slug},
                _type == "artwork" => {slug}
              }
            },
            linkType == "external" => {externalUrl}
          }
        }
      },
      
      // Slider Reference
      _type == "sliderReference" => {
        title,
        slider->{
          title,
          slides[]{
            _key,
            image{
              asset->{
                _id,
                url,
                metadata{lqip, dimensions}
              },
              alt
            },
            caption,
            link{
              linkType,
              linkType == "internal" => {
                internalLink->{
                  _type,
                  _type == "page" => {slug},
                  _type == "artist" => {slug},
                  _type == "artwork" => {slug}
                }
              },
              linkType == "external" => {externalUrl}
            }
          },
          settings{
            autoplay,
            interval,
            loop,
            showDots,
            showArrows
          }
        }
      }
    }
  }
`)
```

## TypeScript Types (Auto-generated)

```bash
# Generate types from queries
npx sanity@latest typegen generate
```

```typescript
// types.ts - Example generated types
import type { HOMEPAGE_QUERYResult } from '@/sanity/types'

type Homepage = NonNullable<HOMEPAGE_QUERYResult>
type Section = NonNullable<Homepage['content']>[number]

// Extract specific section types
type HeroSection = Extract<Section, { _type: 'heroSection' }>
type GallerySection = Extract<Section, { _type: 'gallerySection' }>
type ArtistSection = Extract<Section, { _type: 'artistSection' }>
type ArticleSection = Extract<Section, { _type: 'articleSection' }>
type TextSection = Extract<Section, { _type: 'textSection' }>
type SliderSection = Extract<Section, { _type: 'sliderSection' }>
type SliderReference = Extract<Section, { _type: 'sliderReference' }>
```

## React Page Component

```typescript
// app/page.tsx (Next.js App Router)
import { client } from '@/sanity/lib/client'
import { HOMEPAGE_QUERY } from '@/sanity/lib/queries'
import { PageBuilder } from '@/components/PageBuilder'
import type { HOMEPAGE_QUERYResult } from '@/sanity/types'

export default async function HomePage() {
  const homepage = await client.fetch<HOMEPAGE_QUERYResult>(HOMEPAGE_QUERY)
  
  if (!homepage) {
    return <div>Homepage not found</div>
  }

  return (
    <>
      <PageBuilder content={homepage.content} />
    </>
  )
}

// Generate metadata
export async function generateMetadata() {
  const homepage = await client.fetch<HOMEPAGE_QUERYResult>(HOMEPAGE_QUERY)
  
  return {
    title: homepage?.seo?.metaTitle || homepage?.title || 'Ninart Vision',
    description: homepage?.seo?.metaDescription || 'Art platform',
    openGraph: {
      images: homepage?.seo?.ogImage?.asset?.url 
        ? [homepage.seo.ogImage.asset.url] 
        : []
    }
  }
}
```

## Page Builder Component

```typescript
// components/PageBuilder.tsx
import { stegaClean } from '@sanity/client/stega'
import type { HOMEPAGE_QUERYResult } from '@/sanity/types'

import { HeroSection } from './sections/HeroSection'
import { GallerySection } from './sections/GallerySection'
import { ArtistSection } from './sections/ArtistSection'
import { ArticleSection } from './sections/ArticleSection'
import { TextSection } from './sections/TextSection'
import { SliderSection } from './sections/SliderSection'
import { SliderReferenceSection } from './sections/SliderReferenceSection'

type Section = NonNullable<NonNullable<HOMEPAGE_QUERYResult>['content']>[number]

export function PageBuilder({ content }: { content: Section[] | null }) {
  if (!Array.isArray(content)) return null

  return (
    <main>
      {content.map((section) => {
        // Note: enabled filter already applied in GROQ query
        // Additional check only needed if query doesn't filter
        
        switch (section._type) {
          case 'heroSection':
            return <HeroSection key={section._key} {...section} />
          
          case 'gallerySection':
            return <GallerySection key={section._key} {...section} />
          
          case 'artistSection':
            return <ArtistSection key={section._key} {...section} />
          
          case 'articleSection':
            return <ArticleSection key={section._key} {...section} />
          
          case 'textSection':
            return <TextSection key={section._key} {...section} />
          
          case 'sliderSection':
            return <SliderSection key={section._key} {...section} />
          
          case 'sliderReference':
            return <SliderReferenceSection key={section._key} {...section} />
          
          default:
            return null
        }
      })}
    </main>
  )
}
```

## Section Components

### Hero Section
```typescript
// components/sections/HeroSection.tsx
import Image from 'next/image'
import Link from 'next/link'
import { urlFor } from '@/sanity/lib/image'
import { stegaClean } from '@sanity/client/stega'
import type { HOMEPAGE_QUERYResult } from '@/sanity/types'

type Props = Extract<
  NonNullable<NonNullable<HOMEPAGE_QUERYResult>['content']>[number],
  { _type: 'heroSection' }
>

export function HeroSection({ title, subtitle, image, cta }: Props) {
  const getLink = () => {
    if (!cta) return '#'
    
    const linkType = stegaClean(cta.linkType)
    
    if (linkType === 'internal' && cta.internalLink) {
      const type = stegaClean(cta.internalLink._type)
      const slug = stegaClean(cta.internalLink.slug?.current)
      
      if (type === 'page') return `/${slug}`
      if (type === 'artist') return `/artists/${slug}`
      if (type === 'artwork') return `/artworks/${slug}`
    }
    
    if (linkType === 'external') return cta.externalUrl || '#'
    
    return '#'
  }

  return (
    <section className="hero">
      {image && (
        <div className="hero-image">
          <Image
            src={urlFor(image).width(1920).height(1080).url()}
            alt={image.alt || ''}
            width={1920}
            height={1080}
            priority
            placeholder={image.asset?.metadata?.lqip ? 'blur' : 'empty'}
            blurDataURL={image.asset?.metadata?.lqip}
          />
        </div>
      )}
      
      <div className="hero-content">
        {title && <h1>{title}</h1>}
        {subtitle && <p>{subtitle}</p>}
        
        {cta?.text && (
          <Link href={getLink()} className="cta-button">
            {cta.text}
          </Link>
        )}
      </div>
    </section>
  )
}
```

### Gallery Section

> **🔴 CRITICAL**: DO NOT wrap gallery artworks in `<Link>` components!  
> Use `<button>` elements with modal state instead. See [MODAL_GALLERY_FIX.md](MODAL_GALLERY_FIX.md)

```typescript
// components/sections/GallerySection.tsx
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
            <button
              key={artwork._id}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                openModal(index)
              }}
              className="artwork-card"
              type="button"
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
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
        >
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
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

                {/* Navigation */}
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

### Artist Section
```typescript
// components/sections/ArtistSection.tsx
import Image from 'next/image'
import Link from 'next/link'
import { urlFor } from '@/sanity/lib/image'
import { stegaClean } from '@sanity/client/stega'
import type { HOMEPAGE_QUERYResult } from '@/sanity/types'

type Props = Extract<
  NonNullable<NonNullable<HOMEPAGE_QUERYResult>['content']>[number],
  { _type: 'artistSection' }
>

export function ArtistSection({ title, description, layout, artists, showBio }: Props) {
  const layoutClass = stegaClean(layout) || 'grid'
  const displayBio = stegaClean(showBio)

  return (
    <section className="artist-section">
      {title && <h2>{title}</h2>}
      {description && <p>{description}</p>}
      
      <div className={`artists-${layoutClass}`}>
        {artists?.map((artist) => (
          <Link 
            key={artist._id} 
            href={`/artists/${artist.slug?.current}`}
            className="artist-card"
          >
            {artist.image && (
              <Image
                src={urlFor(artist.image).width(400).height(400).url()}
                alt={artist.image.alt || artist.name || ''}
                width={400}
                height={400}
                placeholder={artist.image.asset?.metadata?.lqip ? 'blur' : 'empty'}
                blurDataURL={artist.image.asset?.metadata?.lqip}
              />
            )}
            
            <div className="artist-info">
              <h3>{artist.name}</h3>
              {displayBio && artist.bio && <p className="bio">{artist.bio}</p>}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
```

### Article Section
```typescript
// components/sections/ArticleSection.tsx
import Image from 'next/image'
import Link from 'next/link'
import { urlFor } from '@/sanity/lib/image'
import { stegaClean } from '@sanity/client/stega'
import type { HOMEPAGE_QUERYResult } from '@/sanity/types'

type Props = Extract<
  NonNullable<NonNullable<HOMEPAGE_QUERYResult>['content']>[number],
  { _type: 'articleSection' }
>

export function ArticleSection({ 
  title, 
  description, 
  layout, 
  articles, 
  showExcerpt, 
  showImage 
}: Props) {
  const layoutClass = stegaClean(layout) || 'grid'
  const displayExcerpt = stegaClean(showExcerpt)
  const displayImage = stegaClean(showImage)

  return (
    <section className="article-section">
      {title && <h2>{title}</h2>}
      {description && <p>{description}</p>}
      
      <div className={`articles-${layoutClass}`}>
        {articles?.map((article) => (
          <Link 
            key={article._id} 
            href={`/articles/${article.slug?.current}`}
            className="article-card"
          >
            {displayImage && article.mainImage && (
              <Image
                src={urlFor(article.mainImage).width(600).height(400).url()}
                alt={article.mainImage.alt || article.title || ''}
                width={600}
                height={400}
                placeholder={article.mainImage.asset?.metadata?.lqip ? 'blur' : 'empty'}
                blurDataURL={article.mainImage.asset?.metadata?.lqip}
              />
            )}
            
            <div className="article-info">
              {article.category && (
                <span className="category">{article.category}</span>
              )}
              <h3>{article.title}</h3>
              {displayExcerpt && article.excerpt && (
                <p className="excerpt">{article.excerpt}</p>
              )}
              {article.publishedAt && (
                <time dateTime={article.publishedAt}>
                  {new Date(article.publishedAt).toLocaleDateString()}
                </time>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
```

### Text Section
```typescript
// components/sections/TextSection.tsx
import { PortableText } from '@portabletext/react'
import { stegaClean } from '@sanity/client/stega'
import { portableTextComponents } from '@/sanity/lib/portableTextComponents'
import type { HOMEPAGE_QUERYResult } from '@/sanity/types'

type Props = Extract<
  NonNullable<NonNullable<HOMEPAGE_QUERYResult>['content']>[number],
  { _type: 'textSection' }
>

export function TextSection({ title, content, alignment }: Props) {
  const align = stegaClean(alignment) || 'left'

  return (
    <section className="text-section" data-align={align}>
      {title && <h2>{title}</h2>}
      {content && (
        <div className="prose">
          <PortableText value={content} components={portableTextComponents} />
        </div>
      )}
    </section>
  )
}
```

### Slider Section
```typescript
// components/sections/SliderSection.tsx
'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { urlFor } from '@/sanity/lib/image'
import { stegaClean } from '@sanity/client/stega'
import type { HOMEPAGE_QUERYResult } from '@/sanity/types'

type Props = Extract<
  NonNullable<NonNullable<HOMEPAGE_QUERYResult>['content']>[number],
  { _type: 'sliderSection' }
>

export function SliderSection({ title, slides, autoplay, interval }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const shouldAutoplay = stegaClean(autoplay)
  const slideInterval = stegaClean(interval) || 5

  useEffect(() => {
    if (!shouldAutoplay || !slides || slides.length <= 1) return

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length)
    }, slideInterval * 1000)

    return () => clearInterval(timer)
  }, [shouldAutoplay, slideInterval, slides])

  if (!slides || slides.length === 0) return null

  return (
    <section className="slider-section">
      {title && <h2>{title}</h2>}
      
      <div className="slider">
        {slides.map((slide, index) => (
          <div
            key={slide._key}
            className="slide"
            style={{ display: index === currentIndex ? 'block' : 'none' }}
          >
            {slide.image && (
              <Image
                src={urlFor(slide.image).width(1920).height(1080).url()}
                alt={slide.image.alt || ''}
                width={1920}
                height={1080}
                priority={index === 0}
                placeholder={slide.image.asset?.metadata?.lqip ? 'blur' : 'empty'}
                blurDataURL={slide.image.asset?.metadata?.lqip}
              />
            )}
            {slide.caption && <p className="caption">{slide.caption}</p>}
          </div>
        ))}
        
        <div className="slider-controls">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={index === currentIndex ? 'active' : ''}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
```

## Portable Text Components

```typescript
// sanity/lib/portableTextComponents.tsx
import Image from 'next/image'
import Link from 'next/link'
import type { PortableTextComponents } from '@portabletext/react'
import { urlFor } from './image'

export const portableTextComponents: PortableTextComponents = {
  types: {
    image: ({ value }) => {
      if (!value?.asset) return null
      
      return (
        <figure>
          <Image
            src={urlFor(value).width(800).url()}
            alt={value.alt || ''}
            width={800}
            height={600}
            placeholder={value.asset.metadata?.lqip ? 'blur' : 'empty'}
            blurDataURL={value.asset.metadata?.lqip}
          />
          {value.caption && <figcaption>{value.caption}</figcaption>}
        </figure>
      )
    },
  },
  marks: {
    link: ({ children, value }) => {
      return (
        <a 
          href={value?.href} 
          target={value?.blank ? '_blank' : undefined}
          rel={value?.blank ? 'noopener noreferrer' : undefined}
        >
          {children}
        </a>
      )
    },
    internalLink: ({ children, value }) => {
      if (!value?.reference) return <>{children}</>
      
      const type = value.reference._type
      const slug = value.reference.slug?.current
      
      let href = '/'
      if (type === 'page') href = `/${slug}`
      else if (type === 'article') href = `/articles/${slug}`
      else if (type === 'artist') href = `/artists/${slug}`
      else if (type === 'artwork') href = `/artworks/${slug}`
      
      return <Link href={href}>{children}</Link>
    },
  },
  block: {
    h2: ({ children }) => <h2>{children}</h2>,
    h3: ({ children }) => <h3>{children}</h3>,
    h4: ({ children }) => <h4>{children}</h4>,
    blockquote: ({ children }) => <blockquote>{children}</blockquote>,
  },
  list: {
    bullet: ({ children }) => <ul>{children}</ul>,
    number: ({ children }) => <ol>{children}</ol>,
  },
}
```

## Image URL Builder

```typescript
// sanity/lib/image.ts
import createImageUrlBuilder from '@sanity/image-url'
import { dataset, projectId } from '../env'

const builder = createImageUrlBuilder({ projectId, dataset })

export const urlFor = (source: any) => {
  return builder.image(source)
}
```

## Key Implementation Notes

1. **Enabled Filtering**: Done in GROQ query (`content[enabled == true]`)
2. **Type Safety**: Extract specific section types from query result
3. **Always use `_key`**: For React reconciliation and Visual Editing
4. **Clean stega values**: When using in logic/className (`stegaClean()`)
5. **LQIP**: Always query `metadata{lqip, dimensions}` for blur placeholders
6. **Link building**: Handle internal references with type-based routing
7. **No hardcoded text**: All content from Sanity (titles, descriptions, buttons)
