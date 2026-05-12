import {defineType, defineField} from 'sanity'

/**
 * Reusable SEO object — attach to any document type.
 *
 * Fields are intentionally labelled for non-technical editors:
 * "SEO Title", "Meta Description", "Social Share Image", "Keywords".
 * Each description guides the editor without requiring SEO knowledge.
 */
export const seoMeta = defineType({
  name: 'seoMeta',
  title: 'SEO',
  type: 'object',
  fields: [
    defineField({
      name: 'seoTitle',
      title: 'SEO Title',
      type: 'string',
      description:
        'Overrides the page title shown in Google results. If left empty, the content title is used automatically. Maximum 60 characters.',
      validation: (Rule) =>
        Rule.max(60).warning('Google truncates titles over 60 characters — keep it concise'),
    }),
    defineField({
      name: 'seoDescription',
      title: 'Meta Description',
      type: 'text',
      rows: 3,
      description:
        'Short summary shown below the title in Google results. If left empty, the short description is used. Maximum 160 characters.',
      validation: (Rule) =>
        Rule.max(160).warning('Google truncates descriptions over 160 characters'),
    }),
    defineField({
      name: 'ogImage',
      title: 'Social Share Image',
      type: 'image',
      description:
        'Image shown when this page is shared on Facebook, WhatsApp, or other social platforms. Recommended size: 1200 × 630 px.',
      options: {hotspot: true},
    }),
    defineField({
      name: 'keywords',
      title: 'Keywords',
      type: 'string',
      description:
        'Comma-separated keywords that describe this page. Example: Georgian art, oil painting, contemporary art',
    }),
  ],
})
