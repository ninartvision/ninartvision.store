/**
 * ========================================
 * SANITY FIELD STANDARDS
 * Defines which fields are required for frontend rendering
 * Last updated: 2026-02-08
 * ========================================
 * 
 * RULES:
 * 1. Every field rendered in the UI must exist in BOTH schema AND GROQ query
 * 2. Image fields must always include: asset->url, alt, title
 * 3. Sanity is the single source of truth — no hardcoded data or fallbacks
 * 4. Missing fields return null, not fake data
 */

/**
 * Field Priority Levels
 * - CRITICAL: Must always be included in queries, app breaks without it
 * - HIGH: Should always be included for proper UX
 * - MEDIUM: Include in detail views, optional in lists
 * - LOW: Include only when specifically needed
 */

export const FIELD_PRIORITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;

/**
 * Standard image projection — use for ALL image fields
 * Ensures consistent alt + title + asset metadata + focal-point crop support.
 *
 * Flattening dimensions into explicit fields avoids nested access in component
 * code and aligns with lib/sanityImage.ts which expects:
 *   image.asset.width, .height, .aspectRatio, .lqip
 * hotspot + crop are required by @sanity/image-url for focal-point cropping.
 */
export const IMAGE_PROJECTION = `{
  asset->{
    _id,
    url,
    "width": metadata.dimensions.width,
    "height": metadata.dimensions.height,
    "aspectRatio": metadata.dimensions.aspectRatio,
    "lqip": metadata.lqip
  },
  hotspot,
  crop,
  alt,
  title
}`;

/**
 * Artist Document Field Requirements
 * Must match schemaTypes/artist.ts exactly
 */
export const ARTIST_FIELDS = {
  // System fields (always auto-included)
  _id: { priority: FIELD_PRIORITY.CRITICAL, type: 'string', auto: true },
  _type: { priority: FIELD_PRIORITY.CRITICAL, type: 'string', auto: true },
  _createdAt: { priority: FIELD_PRIORITY.LOW, type: 'datetime', auto: true },
  _updatedAt: { priority: FIELD_PRIORITY.LOW, type: 'datetime', auto: true },
  
  // Content fields
  name: { 
    priority: FIELD_PRIORITY.CRITICAL, 
    type: 'string', 
    required: true,
    description: 'Artist display name - required for all views'
  },
  slug: { 
    priority: FIELD_PRIORITY.CRITICAL, 
    type: 'slug', 
    required: true,
    description: 'URL identifier - required for routing. Query as: "slug": slug.current'
  },
  image: { 
    priority: FIELD_PRIORITY.CRITICAL, 
    type: 'image', 
    required: true,
    description: 'Profile image - REQUIRED. Has alt (required) + title (optional). Query with IMAGE_PROJECTION.'
  },
  shortDescription: { 
    priority: FIELD_PRIORITY.HIGH, 
    type: 'text', 
    required: false,
    description: 'Brief 1-2 line description (max 150 chars). Include in cards and listings.'
  },
  subtitle: { 
    priority: FIELD_PRIORITY.HIGH, 
    type: 'string', 
    required: false,
    description: 'Short label under artist avatar (max 60 chars). E.g. "Georgian Impressionist".'
  },
  specialty: { 
    priority: FIELD_PRIORITY.HIGH, 
    type: 'string', 
    required: false,
    description: 'Artist specialty or medium (max 100 chars). E.g. "Oil Painting".'
  },
  bio: { 
    priority: FIELD_PRIORITY.HIGH, 
    type: 'text', 
    required: false,
    description: 'Artist biography - include in detail views. Omit from list-only views for performance.'
  },
  style: { 
    priority: FIELD_PRIORITY.HIGH, 
    type: 'string', 
    required: false,
    description: 'Artistic style or movement. Include in cards and detail pages.'
  },
  gallery: { 
    priority: FIELD_PRIORITY.MEDIUM, 
    type: 'array', 
    required: false,
    description: 'Additional images. Query as: gallery[]{asset->{...}, alt, title, _key}'
  },
  status: { 
    priority: FIELD_PRIORITY.MEDIUM, 
    type: 'string', 
    required: true,
    description: 'Visibility control: draft | published | hidden. Filter: status == "published"'
  },
  featured: { 
    priority: FIELD_PRIORITY.MEDIUM, 
    type: 'boolean', 
    required: false,
    description: 'Featured flag - used for filtering and badges'
  },
} as const;

/**
 * Artwork Document Field Requirements
 * Must match schemaTypes/artwork.ts exactly
 */
export const ARTWORK_FIELDS = {
  // System fields
  _id: { priority: FIELD_PRIORITY.CRITICAL, type: 'string', auto: true },
  _type: { priority: FIELD_PRIORITY.CRITICAL, type: 'string', auto: true },
  
  // Content fields
  title: { 
    priority: FIELD_PRIORITY.CRITICAL, 
    type: 'string', 
    required: true,
    description: 'Artwork title - required for all views'
  },
  slug: { 
    priority: FIELD_PRIORITY.CRITICAL, 
    type: 'slug', 
    required: true,
    description: 'URL identifier - DO NOT include in modal galleries (causes navigation conflicts)'
  },
  artist: { 
    priority: FIELD_PRIORITY.CRITICAL, 
    type: 'reference', 
    required: true,
    description: 'Artist reference - dereference with artist->{_id, name} minimum'
  },
  image: { 
    priority: FIELD_PRIORITY.CRITICAL, 
    type: 'image', 
    required: true,
    description: 'Main artwork image - REQUIRED. Has alt (required) + title (optional). Query with IMAGE_PROJECTION.'
  },
  shortDescription: { 
    priority: FIELD_PRIORITY.HIGH, 
    type: 'text', 
    required: false,
    description: 'Brief 1-2 line description (max 150 chars). Include in cards.'
  },
  images: { 
    priority: FIELD_PRIORITY.HIGH, 
    type: 'array', 
    required: false,
    description: 'Gallery images for modal views. Query as: images[]{asset->{...}, alt, title, _key}'
  },
  year: { 
    priority: FIELD_PRIORITY.MEDIUM, 
    type: 'number', 
    required: false,
    description: 'Creation year - include in detail views and cards'
  },
  medium: { 
    priority: FIELD_PRIORITY.MEDIUM, 
    type: 'string', 
    required: false,
    description: 'Art medium - include in detail views'
  },
  dimensions: { 
    priority: FIELD_PRIORITY.MEDIUM, 
    type: 'string', 
    required: false,
    description: 'Physical dimensions - include in detail views'
  },
  category: { 
    priority: FIELD_PRIORITY.MEDIUM, 
    type: 'string', 
    required: false,
    description: 'Style/type categorization - include for filtering'
  },
  description: { 
    priority: FIELD_PRIORITY.MEDIUM, 
    type: 'text', 
    required: false,
    description: 'Artwork description - include in detail/modal views'
  },
  order: { 
    priority: FIELD_PRIORITY.MEDIUM, 
    type: 'number', 
    required: false,
    description: 'Manual display order. Query: | order(coalesce(order, 999) asc, _createdAt desc)'
  },
  price: { 
    priority: FIELD_PRIORITY.LOW, 
    type: 'number', 
    required: false,
    description: 'Price - include only in e-commerce contexts'
  },
  status: { 
    priority: FIELD_PRIORITY.MEDIUM, 
    type: 'string', 
    required: true,
    description: 'Visibility: draft | published | sold | hidden. Filter: status in ["published", "sold"]'
  },
  featured: { 
    priority: FIELD_PRIORITY.MEDIUM, 
    type: 'boolean', 
    required: false,
    description: 'Featured flag - used for filtering'
  },
} as const;

/**
 * Standard GROQ Projections by Context
 * 
 * RULES:
 * 1. ALL image projections include: asset->{_id, url, metadata{lqip, dimensions}}, alt, title
 * 2. Slug is ALWAYS projected as: "slug": slug.current (returns string, not object)
 * 3. No slug in modal/gallery contexts (prevents navigation interference)
 * 4. All queries must filter drafts AND status
 */
export const GROQ_PROJECTIONS = {
  
  // ==========================================
  // ARTIST PROJECTIONS
  // ==========================================
  
  /** Minimal artist data (for lightweight references) */
  ARTIST_MINIMAL: `
    _id,
    name,
    "slug": slug.current
  `,
  
  /** Artist card for listings (no bio) */
  ARTIST_CARD: `
    _id,
    name,
    "slug": slug.current,
    shortDescription,
    subtitle,
    specialty,
    style,
    featured,
    image{
      asset->{_id, url, metadata{lqip, dimensions}},
      alt,
      title
    }
  `,
  
  /** Artist card including bio (for sections with showBio toggle) */
  ARTIST_CARD_WITH_BIO: `
    _id,
    name,
    "slug": slug.current,
    shortDescription,
    subtitle,
    specialty,
    bio,
    style,
    featured,
    image{
      asset->{_id, url, metadata{lqip, dimensions}},
      alt,
      title
    }
  `,
  
  /** Full artist detail page */
  ARTIST_DETAIL: `
    _id,
    _type,
    name,
    "slug": slug.current,
    shortDescription,
    subtitle,
    specialty,
    bio,
    style,
    featured,
    status,
    image{
      asset->{
        _id,
        url,
        metadata{
          lqip,
          dimensions,
          palette{
            dominant{background, foreground}
          }
        }
      },
      alt,
      title,
      hotspot
    },
    gallery[]{
      asset->{_id, url, metadata{lqip, dimensions}},
      alt,
      title,
      _key
    }
  `,
  
  // ==========================================
  // ARTWORK PROJECTIONS
  // ==========================================
  
  /** Artwork grid card (for listings — no slug for modal safety) */
  ARTWORK_GRID: `
    _id,
    title,
    shortDescription,
    year,
    category,
    image{
      asset->{_id, url, metadata{lqip, dimensions}},
      alt,
      title
    },
    artist->{_id, name}
  `,
  
  /** Artwork modal (full detail — NO slug to prevent navigation conflicts) */
  ARTWORK_MODAL: `
    _id,
    title,
    shortDescription,
    year,
    medium,
    dimensions,
    category,
    description,
    image{
      asset->{_id, url, metadata{lqip, dimensions}},
      alt,
      title
    },
    images[]{
      asset->{_id, url, metadata{lqip, dimensions}},
      alt,
      title,
      _key
    },
    artist->{_id, name, "slug": slug.current}
  `,
  
  /** Artwork detail page (WITH slug for routing) */
  ARTWORK_DETAIL: `
    _id,
    _type,
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
      asset->{_id, url, metadata{lqip, dimensions, palette}},
      alt,
      title,
      hotspot
    },
    images[]{
      asset->{_id, url, metadata{lqip, dimensions}},
      alt,
      title,
      _key
    },
    artist->{
      _id,
      name,
      "slug": slug.current,
      bio,
      image{asset->{_id, url}, alt, title}
    }
  `,
  
  // ==========================================
  // ARTICLE PROJECTIONS
  // ==========================================
  
  /** Article card for listings */
  ARTICLE_CARD: `
    _id,
    title,
    "slug": slug.current,
    excerpt,
    category,
    publishedAt,
    featured,
    mainImage{
      asset->{_id, url, metadata{lqip, dimensions}},
      alt,
      title
    }
  `,
  
  /** Article detail page */
  ARTICLE_DETAIL: `
    _id,
    _type,
    title,
    "slug": slug.current,
    excerpt,
    category,
    publishedAt,
    featured,
    status,
    content,
    mainImage{
      asset->{_id, url, metadata{lqip, dimensions}},
      alt,
      title
    },
    relatedArtists[]->{
      _id,
      name,
      "slug": slug.current,
      image{asset->{_id, url}, alt, title}
    },
    relatedArtworks[]->{
      _id,
      title,
      "slug": slug.current,
      image{asset->{_id, url}, alt, title}
    },
    seo
  `,
  
} as const;

/**
 * Field validation helper
 * Use this to validate query results contain required fields
 */
export function validateFields(
  data: any,
  requiredFields: string[],
  context: string = 'Data'
): boolean {
  if (!data || typeof data !== 'object') {
    console.error(`${context}: Invalid data - not an object`);
    return false;
  }
  
  const missing: string[] = [];
  
  requiredFields.forEach(field => {
    const hasField = field in data;
    if (!hasField) {
      missing.push(field);
    }
  });
  
  if (missing.length > 0) {
    console.error(`${context}: Missing required fields:`, missing);
    return false;
  }
  
  return true;
}

/**
 * Get required fields by priority
 */
export function getFieldsByPriority(
  fields: typeof ARTIST_FIELDS | typeof ARTWORK_FIELDS,
  minPriority: keyof typeof FIELD_PRIORITY = 'HIGH'
): string[] {
  const priorityOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  const minIndex = priorityOrder.indexOf(minPriority);
  
  return Object.entries(fields)
    .filter(([_, config]) => {
      const fieldPriorityIndex = priorityOrder.indexOf(
        config.priority.toUpperCase()
      );
      return fieldPriorityIndex <= minIndex;
    })
    .map(([fieldName]) => fieldName);
}
