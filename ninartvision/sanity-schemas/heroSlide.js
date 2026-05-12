import { defineType, defineField } from 'sanity';

/**
 * HERO SLIDE
 * ─────────────────────────────────────────────────────────────────
 * Each document is one slide in the homepage hero slideshow.
 * Set "order" to control the sequence (1, 2, 3 …).
 * Toggle "active" to temporarily hide a slide without deleting it.
 *
 * NOTE: Once you add slides in Sanity Studio, the frontend
 * js/cms-hero.js (if included) will replace the static HTML slides.
 * Until then the static slides in index.html remain the fallback.
 */
export default defineType({
  name: 'heroSlide',
  title: 'Hero Slides',
  type: 'document',
  icon: () => '🖼️',

  orderings: [
    {
      title: 'Display Order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],

  fields: [
    defineField({
      name: 'image',
      title: 'Slide Image',
      type: 'image',
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'altText',
      title: 'Image Alt Text',
      type: 'string',
      description: 'Brief description for screen readers and SEO.',
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description:
        'Lower numbers appear first. Use 1, 2, 3 … Leave empty to append at the end.',
      initialValue: 99,
    }),
    defineField({
      name: 'active',
      title: 'Active (show this slide)',
      type: 'boolean',
      initialValue: true,
    }),
  ],

  preview: {
    select: { title: 'altText', order: 'order', media: 'image' },
    prepare: ({ title, order, media }) => ({
      title: title || 'Untitled slide',
      subtitle: `Order: ${order ?? '—'}`,
      media,
    }),
  },
});
