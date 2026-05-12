import { defineType, defineField } from 'sanity';

/**
 * FEATURED PROJECT
 * ─────────────────────────────────────────────────────────────────
 * Replaces / supplements the static project1–project7.html pages.
 *
 * Add any project from Sanity Studio — it automatically appears in
 * the homepage Featured Projects slider. Each new project also gets
 * a dedicated detail page at:
 *   project.html?p={slug}
 *
 * MIGRATION TIP: For existing static pages, fill "legacyUrl" with
 * the current path (e.g. ./project1.html).  Once you no longer need
 * the static page, leave legacyUrl empty and let project.html handle it.
 */
export default defineType({
  name: 'featuredProject',
  title: 'Featured Projects',
  type: 'document',
  icon: () => '🎨',

  orderings: [
    {
      title: 'Display Order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],

  fields: [
    // ── Identity ───────────────────────────────────────────────────
    defineField({
      name: 'titleEn',
      title: 'Title (English)',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'titleKa',
      title: 'Title (Georgian)',
      type: 'string',
    }),
    defineField({
      name: 'slug',
      title: 'Slug (URL identifier)',
      type: 'slug',
      options: { source: 'titleEn', maxLength: 80 },
      validation: (Rule) => Rule.required(),
    }),

    // ── Media ──────────────────────────────────────────────────────
    defineField({
      name: 'coverImage',
      title: 'Cover / Card Image',
      type: 'image',
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
      fields: [
        defineField({ name: 'alt', title: 'Alt text', type: 'string' }),
      ],
    }),
    defineField({
      name: 'images',
      title: 'Gallery Images',
      type: 'array',
      of: [
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({ name: 'alt', title: 'Alt text', type: 'string' }),
          ],
        },
      ],
      description: 'Additional photos shown in the "More photos" gallery on the project detail page.',
    }),

    // ── Description ────────────────────────────────────────────────
    defineField({
      name: 'shortDescEn',
      title: 'Short Description (English)',
      type: 'string',
      description: 'One sentence shown on the homepage project card (max 160 characters).',
      validation: (Rule) => Rule.max(160),
    }),
    defineField({
      name: 'bodyEn',
      title: 'Full Description (English)',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [{ title: 'Normal', value: 'normal' }],
          marks: {
            decorators: [
              { title: 'Bold',   value: 'strong' },
              { title: 'Italic', value: 'em' },
            ],
          },
        },
      ],
    }),
    defineField({
      name: 'bodyKa',
      title: 'Full Description (Georgian)',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [{ title: 'Normal', value: 'normal' }],
          marks: {
            decorators: [
              { title: 'Bold',   value: 'strong' },
              { title: 'Italic', value: 'em' },
            ],
          },
        },
      ],
    }),

    // ── Artwork details ────────────────────────────────────────────
    defineField({
      name: 'medium',
      title: 'Technique / Medium',
      type: 'string',
      description: 'e.g. Acrylic, Oil on canvas, Watercolor',
    }),
    defineField({
      name: 'dimensions',
      title: 'Size',
      type: 'string',
      description: 'e.g. 50×70 cm',
    }),
    defineField({
      name: 'year',
      title: 'Year',
      type: 'string',
    }),
    defineField({
      name: 'artist',
      title: 'Artist',
      type: 'reference',
      to: [{ type: 'artist' }],
    }),

    // ── Display settings ───────────────────────────────────────────
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Controls position in the homepage slider. Lower number = appears first.',
      initialValue: 99,
    }),
    defineField({
      name: 'active',
      title: 'Show on homepage',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'legacyUrl',
      title: 'Legacy Page URL (optional)',
      type: 'url',
      description:
        'If this project already has a static HTML page (e.g. ./project1.html), ' +
        'paste the URL here to preserve existing links. Leave empty for new projects ' +
        '— they will auto-route to project.html?p={slug}.',
    }),
  ],

  preview: {
    select: {
      title:    'titleEn',
      subtitle: 'shortDescEn',
      order:    'order',
      media:    'coverImage',
    },
    prepare: ({ title, subtitle, order, media }) => ({
      title:    title    || 'Untitled Project',
      subtitle: `#${order ?? '—'} — ${subtitle || ''}`,
      media,
    }),
  },
});
