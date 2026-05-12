import { defineType, defineField, defineArrayMember, type SlugRule } from 'sanity'
import { ImageIcon } from '@sanity/icons'

/* ─────────────────────────────────────────────────────────────────────────────
   SLUG HELPERS
   These run inside Sanity Studio (browser context).
───────────────────────────────────────────────────────────────────────────── */

/**
 * Convert a raw string to a URL-safe slug.
 * "Pomegranate Emotion" → "pomegranate-emotion"
 * '"My Artwork"'        → "my-artwork"
 */
export function slugify(input: string): string {
  return String(input || '')
    .toLowerCase()
    // remove typographic quotes of any kind
    .replace(/['"«»\u201c\u201d\u2018\u2019\u201e\u201f]/g, '')
    // remove anything that isn't a word character, space, or hyphen
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    // no leading or trailing hyphens
    .replace(/^-+|-+$/g, '')
}

/**
 * Check whether a slug is already used by another artwork document.
 * Called by the validation rule so editors see an error in real-time.
 */
async function isSlugUnique(
  slug: string,
  context: {document?: {_id?: string}; getClient: (opts: {apiVersion: string}) => {fetch: (query: string, params: Record<string, unknown>) => Promise<unknown[]>}}
): Promise<boolean> {
  const {document, getClient} = context
  const client = getClient({apiVersion: '2025-02-05'})

  // Strip the `drafts.` prefix so draft and published are treated as the same doc
  const currentId = (document?._id ?? '').replace(/^drafts\./, '')

  const docs = await client.fetch(
    `*[_type == "artwork" && slug.current == $slug && !(_id in [$id, "drafts." + $id])]{_id}`,
    {slug, id: currentId}
  ) as {_id: string}[]
  return docs.length === 0
}

export const artwork = defineType({
  name: 'artwork',
  title: 'Artwork',
  type: 'document',
  icon: ImageIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'details', title: 'Details'},
    {name: 'seo', title: 'SEO & Discovery'},
  ],

  fields: [
    // =============================
    // BASIC INFO
    // =============================
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: Rule => Rule.required(),
    }),

    defineField({
      name: 'slug',
      title: 'Slug (URL)',
      type: 'slug',
      description: 'URL-safe identifier used for the product page. Must be unique. Auto-generated from the title.',
      options: {
        source: 'title',
        maxLength: 96,
        // Replace the default slugify so it strips quotes too
        slugify: (input: string) => slugify(input),
      },
      validation: (Rule: SlugRule) =>
        Rule.required()
          .custom(async (slug, context) => {
            if (!slug?.current) return 'Slug is required'
            if (slug.current !== slugify(slug.current)) {
              return `Slug contains invalid characters. Try: "${slugify(slug.current)}"`
            }
            const unique = await isSlugUnique(slug.current, context as Parameters<typeof isSlugUnique>[1])
            if (!unique) {
              return `"${slug.current}" is already used by another artwork — choose a unique slug (e.g. add a descriptor like -landscape or -2024)`
            }
            return true
          }),
    }),

    defineField({
      name: 'artist',
      title: 'Artist',
      type: 'reference',
      to: [{ type: 'artist' }],
      validation: Rule => Rule.required(),
    }),

    // =============================
    // DISPLAY ORDER (IMPORTANT)
    // =============================
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Lower number = appears first on the website',
      initialValue: 999,
      validation: Rule =>
        Rule.integer().min(0).warning('Order should be 0 or greater'),
    }),

    // =============================
    // DESCRIPTIONS
    // =============================
    defineField({
      name: 'shortDescription',
      title: 'Short Description',
      type: 'text',
      rows: 2,
      validation: Rule =>
        Rule.max(150).warning('Keep under 150 characters'),
    }),

    defineField({
      name: 'description',
      title: 'Full Description',
      type: 'text',
      rows: 6,
      validation: Rule =>
        Rule.min(20).warning('Consider adding a longer description'),
    }),

    // =============================
    // IMAGES
    // =============================
    defineField({
      name: 'image',
      title: 'Main Image',
      type: 'image',
      options: { hotspot: true },
      validation: Rule => Rule.required(),
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          validation: Rule =>
            Rule.required()
              .min(10)
              .max(200)
              .error('Alt text is required (10–200 chars)'),
        }),
      ],
    }),

    defineField({
      name: 'images',
      title: 'Image Gallery',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({
              name: 'alt',
              title: 'Alt Text',
              type: 'string',
              validation: Rule =>
                Rule.required()
                  .min(10)
                  .max(200),
            }),
          ],
        }),
      ],
    }),

    // =============================
    // DETAILS
    // =============================
    defineField({
      name: 'year',
      title: 'Year',
      type: 'number',
    }),

    defineField({
      name: 'medium',
      title: 'Medium',
      type: 'string',
    }),

    defineField({
      name: 'dimensions',
      title: 'Dimensions',
      type: 'string',
    }),

    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
    }),

    // =============================
    // STATUS & VISIBILITY
    // =============================
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'For Sale', value: 'sale' },
          { title: 'Sold', value: 'sold' },
        ],
        layout: 'radio',
      },
      initialValue: 'sale',
      validation: Rule => Rule.required(),
    }),

    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      initialValue: false,
    }),

    defineField({
      name: 'price',
      title: 'Price',
      type: 'number',
      validation: Rule => Rule.min(0),
    }),

    // =============================
    // SEO
    // =============================
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seoMeta',
      group: 'seo',
    }),
  ],

  // =============================
  // STUDIO LIST PREVIEW
  // =============================
  preview: {
    select: {
      title: 'title',
      artistName: 'artist.name',
      media: 'image',
      year: 'year',
      status: 'status',
      order: 'order',
    },
    prepare({ title, artistName, media, year, status, order }) {
      const orderLabel =
        typeof order === 'number' ? `#${order}` : '#—'

      const statusLabel =
        status === 'sold'
          ? 'Sold'
          : status === 'sale'
          ? 'For Sale'
          : '—'

      return {
        title: `${orderLabel} ${title}`,
        subtitle: `${artistName || 'Unknown Artist'}${year ? ` (${year})` : ''} · ${statusLabel}`,
        media,
      }
    },
  },
})
