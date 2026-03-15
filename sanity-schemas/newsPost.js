import { defineType, defineField } from 'sanity';

/**
 * NEWS POST  (bilingual: Georgian + English)
 * ─────────────────────────────────────────────────────────────────
 * Each document is one article shown in the News & Stories section on
 * both news.html and the homepage news preview.
 *
 * • Publish a document → it appears on the site immediately.
 * • Change publishedAt → controls the date shown and sort order.
 * • Both ka and en bodies are optional (you can write just one language).
 */
export default defineType({
  name: 'newsPost',
  title: 'News & Stories',
  type: 'document',
  icon: () => '📰',

  orderings: [
    {
      title: 'Newest First',
      name: 'dateDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
  ],

  fields: [
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
      title: 'Slug',
      type: 'slug',
      options: { source: 'titleEn', maxLength: 80 },
      validation: (Rule) => Rule.required(),
      description: 'Auto-generated from the English title. Used in URLs.',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published Date',
      type: 'date',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'bodyEn',
      title: 'Article Body (English)',
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
      title: 'Article Body (Georgian)',
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
  ],

  preview: {
    select: { title: 'titleEn', subtitle: 'publishedAt' },
    prepare: ({ title, subtitle }) => ({
      title:    title    || 'Untitled',
      subtitle: subtitle || 'No date set',
    }),
  },
});
