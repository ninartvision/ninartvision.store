/**
 * ========================================
 * CANONICAL GROQ QUERIES
 * Single source of truth for ALL frontend data fetching
 * Last updated: 2026-03-11
 *
 * PERFORMANCE NOTES (image projections)
 * ----------------------------------------
 * Every image field fetches:
 *   asset._id                  — used by @sanity/image-url for CDN URLs
 *   asset.url                  — fallback / OG images
 *   asset.metadata.lqip        — blur-up placeholder (~200 B base64)
 *   asset.metadata.dimensions  — width/height/aspectRatio for CLS prevention
 *   hotspot + crop             — focal-point cropping via URL builder
 *
 * Use lib/sanityImage.ts to convert image objects into optimised CDN URLs
 * (?auto=format → WebP/AVIF, responsive srcSet, LQIP blur‑up).
 * ========================================
 */

// ── Shared image projection (inline everywhere) ──────────────
// asset->{_id, url, "width": metadata.dimensions.width, "height": metadata.dimensions.height, "aspectRatio": metadata.dimensions.aspectRatio, "lqip": metadata.lqip}
// hotspot, crop, alt, title

// ============================================================
// ARTIST QUERIES
// ============================================================

export const ALL_ARTISTS_QUERY = `
*[_type == "artist" && status == "published" && !(_id in path("drafts.**"))]
| order(name asc) {
  _id,
  name,
  "slug": slug.current,
  shortDescription,
  subtitle,
  specialty,
  style,
  featured,
  image{
    asset->{_id, url, "width": metadata.dimensions.width, "height": metadata.dimensions.height, "aspectRatio": metadata.dimensions.aspectRatio, "lqip": metadata.lqip},
    hotspot,
    crop,
    alt,
    title
  },
  "artworkCount": count(*[_type == "artwork" && artist._ref == ^._id && status in ["published","sold"] && !(_id in path("drafts.**"))])
}
`

export const FEATURED_ARTISTS_QUERY = `
*[_type == "artist" && featured == true && status == "published" && !(_id in path("drafts.**"))]
| order(name asc)[0...6] {
  _id,
  name,
  "slug": slug.current,
  shortDescription,
  subtitle,
  specialty,
  bio,
  style,
  image{
    asset->{_id, url, "width": metadata.dimensions.width, "height": metadata.dimensions.height, "aspectRatio": metadata.dimensions.aspectRatio, "lqip": metadata.lqip},
    hotspot,
    crop,
    alt,
    title
  }
}
`

export const ARTIST_WITH_ARTWORKS_QUERY = `
*[_type == "artist" && slug.current == $slug && status == "published" && !(_id in path("drafts.**"))][0]{
  _id,
  name,
  "slug": slug.current,
  bio,
  shortDescription,
  subtitle,
  specialty,
  style,
  featured,
  image{
    asset->{_id, url, "width": metadata.dimensions.width, "height": metadata.dimensions.height, "aspectRatio": metadata.dimensions.aspectRatio, "lqip": metadata.lqip},
    hotspot,
    crop,
    alt,
    title
  },
  "artworks": *[
    _type == "artwork" &&
    artist._ref == ^._id &&
    status in ["published","sold"] &&
    !(_id in path("drafts.**"))
  ]
  | order(featured desc, coalesce(order, 999) asc, year desc, _createdAt desc) {
    _id,
    title,
    shortDescription,
    year,
    medium,
    dimensions,
    category,
    description,
    order,
    featured,
    status,
    price,
    image{
      asset->{_id, url, "width": metadata.dimensions.width, "height": metadata.dimensions.height, "aspectRatio": metadata.dimensions.aspectRatio, "lqip": metadata.lqip},
      hotspot,
      crop,
      alt,
      title
    },
    images[]{
      asset->{_id, url, "width": metadata.dimensions.width, "height": metadata.dimensions.height, "aspectRatio": metadata.dimensions.aspectRatio, "lqip": metadata.lqip},
      hotspot,
      crop,
      alt,
      title,
      _key
    }
  }
}
`

// ============================================================
// ARTWORK QUERIES
// ============================================================

export const GALLERY_FEATURED_QUERY = `
*[_type == "artwork" && status in ["published","sold"] && !(_id in path("drafts.**"))]
| order(featured desc, coalesce(order, 999) asc, _createdAt desc)[0...$limit] {
  _id,
  title,
  shortDescription,
  year,
  medium,
  dimensions,
  category,
  description,
  price,
  status,
  featured,
  image{
    asset->{_id, url, "width": metadata.dimensions.width, "height": metadata.dimensions.height, "aspectRatio": metadata.dimensions.aspectRatio, "lqip": metadata.lqip},
    hotspot,
    crop,
    alt,
    title
  },
  images[]{
    asset->{_id, url, "width": metadata.dimensions.width, "height": metadata.dimensions.height, "aspectRatio": metadata.dimensions.aspectRatio, "lqip": metadata.lqip},
    hotspot,
    crop,
    alt,
    title,
    _key
  },
  artist->{_id, name, "slug": slug.current}
}
`

export const GALLERY_BY_ARTIST_QUERY = `
*[_type == "artwork" && artist._ref == $artistId && status in ["published","sold"] && !(_id in path("drafts.**"))]
| order(featured desc, coalesce(order, 999) asc, year desc)[0...$limit] {
  _id,
  title,
  shortDescription,
  year,
  medium,
  dimensions,
  category,
  description,
  price,
  status,
  featured,
  image{
    asset->{_id, url, "width": metadata.dimensions.width, "height": metadata.dimensions.height, "aspectRatio": metadata.dimensions.aspectRatio, "lqip": metadata.lqip},
    hotspot,
    crop,
    alt,
    title
  },
  images[]{
    asset->{_id, url, "width": metadata.dimensions.width, "height": metadata.dimensions.height, "aspectRatio": metadata.dimensions.aspectRatio, "lqip": metadata.lqip},
    hotspot,
    crop,
    alt,
    title,
    _key
  }
}
`

export const ARTWORK_DETAIL_QUERY = `
*[_type == "artwork" && slug.current == $slug && status in ["published","sold"] && !(_id in path("drafts.**"))][0]{
  _id,
  title,
  "slug": slug.current,
  shortDescription,
  year,
  medium,
  dimensions,
  category,
  description,
  price,
  status,
  featured,
  order,
  image{
    asset->{_id, url, "width": metadata.dimensions.width, "height": metadata.dimensions.height, "aspectRatio": metadata.dimensions.aspectRatio, "lqip": metadata.lqip},
    hotspot,
    crop,
    alt,
    title
  },
  images[]{
    asset->{_id, url, "width": metadata.dimensions.width, "height": metadata.dimensions.height, "aspectRatio": metadata.dimensions.aspectRatio, "lqip": metadata.lqip},
    hotspot,
    crop,
    alt,
    title,
    _key
  },
  artist->{
    _id,
    name,
    "slug": slug.current
  }
}
`

// ============================================================
// ARTICLE QUERIES
// ============================================================

/** Image fragment for articles (same projection as artworks) */
const ARTICLE_IMAGE = `asset->{_id, url, "width": metadata.dimensions.width, "height": metadata.dimensions.height, "aspectRatio": metadata.dimensions.aspectRatio, "lqip": metadata.lqip}, hotspot, crop, alt, title`

export const ALL_ARTICLES_QUERY = `
*[_type == "article" && status == "published" && !(_id in path("drafts.**"))]
| order(featured desc, publishedAt desc) {
  _id,
  title,
  "slug": slug.current,
  excerpt,
  category,
  publishedAt,
  featured,
  mainImage{
    ${ARTICLE_IMAGE}
  },
  relatedArtists[]->{_id, name, "slug": slug.current}
}
`

export const FEATURED_ARTICLES_QUERY = `
*[_type == "article" && status == "published" && featured == true && !(_id in path("drafts.**"))]
| order(publishedAt desc)[0...6] {
  _id,
  title,
  "slug": slug.current,
  excerpt,
  category,
  publishedAt,
  mainImage{
    ${ARTICLE_IMAGE}
  }
}
`

export const RECENT_ARTICLES_QUERY = `
*[_type == "article" && status == "published" && !(_id in path("drafts.**"))]
| order(publishedAt desc)[0...$limit] {
  _id,
  title,
  "slug": slug.current,
  excerpt,
  category,
  publishedAt,
  mainImage{
    ${ARTICLE_IMAGE}
  }
}
`

export const ARTICLES_BY_CATEGORY_QUERY = `
*[_type == "article" && status == "published" && category == $category && !(_id in path("drafts.**"))]
| order(publishedAt desc)[0...$limit] {
  _id,
  title,
  "slug": slug.current,
  excerpt,
  category,
  publishedAt,
  mainImage{
    ${ARTICLE_IMAGE}
  }
}
`

export const ARTICLE_DETAIL_QUERY = `
*[_type == "article" && slug.current == $slug && status == "published" && !(_id in path("drafts.**"))][0]{
  _id,
  title,
  "slug": slug.current,
  excerpt,
  category,
  publishedAt,
  featured,
  content,
  mainImage{
    ${ARTICLE_IMAGE}
  },
  relatedArtists[]->{
    _id,
    name,
    "slug": slug.current,
    shortDescription,
    image{
      asset->{_id, url, "width": metadata.dimensions.width, "height": metadata.dimensions.height, "aspectRatio": metadata.dimensions.aspectRatio, "lqip": metadata.lqip},
      hotspot,
      crop,
      alt,
      title
    }
  },
  relatedArtworks[]->{
    _id,
    title,
    "slug": slug.current,
    year,
    medium,
    status,
    price,
    image{
      asset->{_id, url, "width": metadata.dimensions.width, "height": metadata.dimensions.height, "aspectRatio": metadata.dimensions.aspectRatio, "lqip": metadata.lqip},
      hotspot,
      crop,
      alt,
      title
    }
  },
  seo
}
`

// ============================================================
// PAGE QUERY
// ============================================================

export const ALL_PAGES_QUERY = `
*[_type == "page" && status == "published" && !(_id in path("drafts.**"))]
| order(title asc) {
  _id,
  title,
  "slug": slug.current,
  shortDescription,
  status
}
`

export const PAGE_DETAIL_QUERY = `
*[_type == "page" && slug.current == $slug && status == "published" && !(_id in path("drafts.**"))][0]{
  _id,
  title,
  "slug": slug.current,
  shortDescription,
  status,
  seo,
  featuredImage{
    asset->{_id, url, "width": metadata.dimensions.width, "height": metadata.dimensions.height, "aspectRatio": metadata.dimensions.aspectRatio, "lqip": metadata.lqip},
    hotspot,
    crop,
    alt,
    title
  },
  content[]{
    _type,
    _key,
    enabled,

    _type == "heroSection" => {
      title,
      subtitle,
      enabled,
      cta,
      image{
        asset->{_id, url, "width": metadata.dimensions.width, "height": metadata.dimensions.height, "aspectRatio": metadata.dimensions.aspectRatio, "lqip": metadata.lqip},
        hotspot,
        crop,
        alt,
        title
      }
    },

    _type == "gallerySection" => {
      title,
      description,
      layout,
      artworkSource,
      limit,
      enabled,

      artworkSource == "manual" => {
        artworks[]->{
          _id,
          title,
          shortDescription,
          year,
          status,
          price,
          image{
            asset->{_id, url, "width": metadata.dimensions.width, "height": metadata.dimensions.height, "aspectRatio": metadata.dimensions.aspectRatio, "lqip": metadata.lqip},
            hotspot,
            crop,
            alt,
            title
          },
          artist->{name}
        }
      },

      artworkSource == "featured" => {
        "artworks": *[_type == "artwork" && status in ["published","sold"] && !(_id in path("drafts.**"))]
          | order(featured desc, coalesce(order,999) asc, _createdAt desc)[0...^.limit]{
          _id,
          title,
          shortDescription,
          year,
          status,
          price,
          image{
            asset->{_id, url, "width": metadata.dimensions.width, "height": metadata.dimensions.height, "aspectRatio": metadata.dimensions.aspectRatio, "lqip": metadata.lqip},
            hotspot,
            crop,
            alt,
            title
          },
          artist->{name}
        }
      },

      artworkSource == "byArtist" => {
        artist->{_id, name},
        "artworks": *[_type == "artwork" && artist._ref == ^.artist._ref && status in ["published","sold"] && !(_id in path("drafts.**"))]
          | order(featured desc, coalesce(order,999) asc, year desc)[0...^.limit]{
          _id,
          title,
          shortDescription,
          year,
          status,
          price,
          image{
            asset->{_id, url, "width": metadata.dimensions.width, "height": metadata.dimensions.height, "aspectRatio": metadata.dimensions.aspectRatio, "lqip": metadata.lqip},
            hotspot,
            crop,
            alt,
            title
          }
        }
      }
    },

    _type == "artistSection" => {
      title,
      description,
      layout,
      artistSource,
      limit,
      showBio,
      enabled,

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
            asset->{_id, url, "width": metadata.dimensions.width, "height": metadata.dimensions.height, "aspectRatio": metadata.dimensions.aspectRatio, "lqip": metadata.lqip},
            hotspot,
            crop,
            alt,
            title
          }
        }
      },

      artistSource == "featured" => {
        "artists": *[_type == "artist" && featured == true && status == "published" && !(_id in path("drafts.**"))]
          | order(name asc)[0...^.limit]{
          _id,
          name,
          "slug": slug.current,
          shortDescription,
          subtitle,
          specialty,
          bio,
          image{
            asset->{_id, url, "width": metadata.dimensions.width, "height": metadata.dimensions.height, "aspectRatio": metadata.dimensions.aspectRatio, "lqip": metadata.lqip},
            hotspot,
            crop,
            alt,
            title
          }
        }
      },

      artistSource == "all" => {
        "artists": *[_type == "artist" && status == "published" && !(_id in path("drafts.**"))]
          | order(name asc)[0...^.limit]{
          _id,
          name,
          "slug": slug.current,
          shortDescription,
          subtitle,
          specialty,
          image{
            asset->{_id, url, "width": metadata.dimensions.width, "height": metadata.dimensions.height, "aspectRatio": metadata.dimensions.aspectRatio, "lqip": metadata.lqip},
            hotspot,
            crop,
            alt,
            title
          }
        }
      }
    },

    _type == "articleSection" => {
      title,
      description,
      articleSource,
      category,
      limit,
      enabled,

      articleSource == "manual" => {
        articles[]->{
          _id,
          title,
          "slug": slug.current,
          excerpt,
          category,
          publishedAt,
          mainImage{
            asset->{_id, url, "width": metadata.dimensions.width, "height": metadata.dimensions.height, "aspectRatio": metadata.dimensions.aspectRatio, "lqip": metadata.lqip},
            hotspot,
            crop,
            alt,
            title
          }
        }
      },

      articleSource == "featured" => {
        "articles": *[_type == "article" && status == "published" && featured == true && !(_id in path("drafts.**"))]
          | order(publishedAt desc)[0...^.limit]{
          _id,
          title,
          "slug": slug.current,
          excerpt,
          category,
          publishedAt,
          mainImage{
            asset->{_id, url, "width": metadata.dimensions.width, "height": metadata.dimensions.height, "aspectRatio": metadata.dimensions.aspectRatio, "lqip": metadata.lqip},
            hotspot,
            crop,
            alt,
            title
          }
        }
      },

      articleSource == "recent" => {
        "articles": *[_type == "article" && status == "published" && !(_id in path("drafts.**"))]
          | order(publishedAt desc)[0...^.limit]{
          _id,
          title,
          "slug": slug.current,
          excerpt,
          category,
          publishedAt,
          mainImage{
            asset->{_id, url, "width": metadata.dimensions.width, "height": metadata.dimensions.height, "aspectRatio": metadata.dimensions.aspectRatio, "lqip": metadata.lqip},
            hotspot,
            crop,
            alt,
            title
          }
        }
      },

      articleSource == "byCategory" => {
        "articles": *[_type == "article" && status == "published" && category == ^.category && !(_id in path("drafts.**"))]
          | order(publishedAt desc)[0...^.limit]{
          _id,
          title,
          "slug": slug.current,
          excerpt,
          category,
          publishedAt,
          mainImage{
            asset->{_id, url, "width": metadata.dimensions.width, "height": metadata.dimensions.height, "aspectRatio": metadata.dimensions.aspectRatio, "lqip": metadata.lqip},
            hotspot,
            crop,
            alt,
            title
          }
        }
      }
    },

    _type == "textSection" => {
      title,
      content,
      alignment,
      enabled
    },

    _type == "sliderSection" => {
      title,
      autoplay,
      interval,
      enabled,
      slides[]{
        _key,
        caption,
        link,
        image{
          asset->{_id, url, "width": metadata.dimensions.width, "height": metadata.dimensions.height, "aspectRatio": metadata.dimensions.aspectRatio, "lqip": metadata.lqip},
          hotspot,
          crop,
          alt
        }
      }
    },

    _type == "sliderReference" => {
      title,
      enabled,
      slider->{
        _id,
        title,
        settings,
        slides[]{
          _key,
          caption,
          link,
          image{
            asset->{_id, url, "width": metadata.dimensions.width, "height": metadata.dimensions.height, "aspectRatio": metadata.dimensions.aspectRatio, "lqip": metadata.lqip},
            hotspot,
            crop,
            alt
          }
        }
      }
    }
  }
}
`

// ============================================================
// HOMEPAGE QUERY
// Identical page-builder structure, targeted at homepage singleton
// ============================================================

export const HOMEPAGE_QUERY = `
*[_type == "homepage" && !(_id in path("drafts.**"))][0]{
  _id,
  title,
  status,
  seo,
  content[]{
    _type,
    _key,
    enabled,

    _type == "heroSection" => {
      title,
      subtitle,
      enabled,
      cta,
      image{
        asset->{_id, url, "width": metadata.dimensions.width, "height": metadata.dimensions.height, "aspectRatio": metadata.dimensions.aspectRatio, "lqip": metadata.lqip},
        hotspot,
        crop,
        alt,
        title
      }
    },

    _type == "gallerySection" => {
      title,
      description,
      layout,
      artworkSource,
      limit,
      enabled,

      artworkSource == "manual" => {
        artworks[]->{
          _id,
          title,
          shortDescription,
          year,
          status,
          price,
          image{
            asset->{_id, url, "width": metadata.dimensions.width, "height": metadata.dimensions.height, "aspectRatio": metadata.dimensions.aspectRatio, "lqip": metadata.lqip},
            hotspot,
            crop,
            alt,
            title
          },
          artist->{name}
        }
      },

      artworkSource == "featured" => {
        "artworks": *[_type == "artwork" && status in ["published","sold"] && !(_id in path("drafts.**"))]
          | order(featured desc, coalesce(order,999) asc, _createdAt desc)[0...^.limit]{
          _id,
          title,
          shortDescription,
          year,
          status,
          price,
          image{
            asset->{_id, url, "width": metadata.dimensions.width, "height": metadata.dimensions.height, "aspectRatio": metadata.dimensions.aspectRatio, "lqip": metadata.lqip},
            hotspot,
            crop,
            alt,
            title
          },
          artist->{name}
        }
      },

      artworkSource == "byArtist" => {
        artist->{_id, name},
        "artworks": *[_type == "artwork" && artist._ref == ^.artist._ref && status in ["published","sold"] && !(_id in path("drafts.**"))]
          | order(featured desc, coalesce(order,999) asc, year desc)[0...^.limit]{
          _id,
          title,
          shortDescription,
          year,
          status,
          price,
          image{
            asset->{_id, url, "width": metadata.dimensions.width, "height": metadata.dimensions.height, "aspectRatio": metadata.dimensions.aspectRatio, "lqip": metadata.lqip},
            hotspot,
            crop,
            alt,
            title
          }
        }
      }
    },

    _type == "artistSection" => {
      title,
      description,
      layout,
      artistSource,
      limit,
      showBio,
      enabled,

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
            asset->{_id, url, "width": metadata.dimensions.width, "height": metadata.dimensions.height, "aspectRatio": metadata.dimensions.aspectRatio, "lqip": metadata.lqip},
            hotspot,
            crop,
            alt,
            title
          }
        }
      },

      artistSource == "featured" => {
        "artists": *[_type == "artist" && featured == true && status == "published" && !(_id in path("drafts.**"))]
          | order(name asc)[0...^.limit]{
          _id,
          name,
          "slug": slug.current,
          shortDescription,
          subtitle,
          specialty,
          bio,
          image{
            asset->{_id, url, "width": metadata.dimensions.width, "height": metadata.dimensions.height, "aspectRatio": metadata.dimensions.aspectRatio, "lqip": metadata.lqip},
            hotspot,
            crop,
            alt,
            title
          }
        }
      },

      artistSource == "all" => {
        "artists": *[_type == "artist" && status == "published" && !(_id in path("drafts.**"))]
          | order(name asc)[0...^.limit]{
          _id,
          name,
          "slug": slug.current,
          shortDescription,
          subtitle,
          specialty,
          image{
            asset->{_id, url, "width": metadata.dimensions.width, "height": metadata.dimensions.height, "aspectRatio": metadata.dimensions.aspectRatio, "lqip": metadata.lqip},
            hotspot,
            crop,
            alt,
            title
          }
        }
      }
    },

    _type == "articleSection" => {
      title,
      description,
      articleSource,
      category,
      limit,
      enabled,

      articleSource == "manual" => {
        articles[]->{
          _id,
          title,
          "slug": slug.current,
          excerpt,
          category,
          publishedAt,
          mainImage{
            asset->{_id, url, "width": metadata.dimensions.width, "height": metadata.dimensions.height, "aspectRatio": metadata.dimensions.aspectRatio, "lqip": metadata.lqip},
            hotspot,
            crop,
            alt,
            title
          }
        }
      },

      articleSource == "featured" => {
        "articles": *[_type == "article" && status == "published" && featured == true && !(_id in path("drafts.**"))]
          | order(publishedAt desc)[0...^.limit]{
          _id,
          title,
          "slug": slug.current,
          excerpt,
          category,
          publishedAt,
          mainImage{
            asset->{_id, url, "width": metadata.dimensions.width, "height": metadata.dimensions.height, "aspectRatio": metadata.dimensions.aspectRatio, "lqip": metadata.lqip},
            hotspot,
            crop,
            alt,
            title
          }
        }
      },

      articleSource == "recent" => {
        "articles": *[_type == "article" && status == "published" && !(_id in path("drafts.**"))]
          | order(publishedAt desc)[0...^.limit]{
          _id,
          title,
          "slug": slug.current,
          excerpt,
          category,
          publishedAt,
          mainImage{
            asset->{_id, url, "width": metadata.dimensions.width, "height": metadata.dimensions.height, "aspectRatio": metadata.dimensions.aspectRatio, "lqip": metadata.lqip},
            hotspot,
            crop,
            alt,
            title
          }
        }
      },

      articleSource == "byCategory" => {
        "articles": *[_type == "article" && status == "published" && category == ^.category && !(_id in path("drafts.**"))]
          | order(publishedAt desc)[0...^.limit]{
          _id,
          title,
          "slug": slug.current,
          excerpt,
          category,
          publishedAt,
          mainImage{
            asset->{_id, url, "width": metadata.dimensions.width, "height": metadata.dimensions.height, "aspectRatio": metadata.dimensions.aspectRatio, "lqip": metadata.lqip},
            hotspot,
            crop,
            alt,
            title
          }
        }
      }
    },

    _type == "textSection" => {
      title,
      content,
      alignment,
      enabled
    },

    _type == "sliderSection" => {
      title,
      autoplay,
      interval,
      enabled,
      slides[]{
        _key,
        caption,
        link,
        image{
          asset->{_id, url, "width": metadata.dimensions.width, "height": metadata.dimensions.height, "aspectRatio": metadata.dimensions.aspectRatio, "lqip": metadata.lqip},
          hotspot,
          crop,
          alt
        }
      }
    },

    _type == "sliderReference" => {
      title,
      enabled,
      slider->{
        _id,
        title,
        settings,
        slides[]{
          _key,
          caption,
          link,
          image{
            asset->{_id, url, "width": metadata.dimensions.width, "height": metadata.dimensions.height, "aspectRatio": metadata.dimensions.aspectRatio, "lqip": metadata.lqip},
            hotspot,
            crop,
            alt
          }
        }
      }
    }
  }
}
`

// ============================================================
// SITE SETTINGS QUERY
// ============================================================

export const SITE_SETTINGS_QUERY = `
*[_type == "siteSettings"][0]{
  _id,
  siteName,
  siteDescription,
  logo{
    asset->{_id, url, "width": metadata.dimensions.width, "height": metadata.dimensions.height, "lqip": metadata.lqip},
    hotspot,
    crop,
    alt
  },
  mainNavigation[]{
    label,
    linkType,
    externalUrl,
    pageLink->{ _id, title, "slug": slug.current }
  },
  footer{
    text,
    socialLinks[]{
      platform,
      url
    }
  }
}
`

