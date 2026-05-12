import {defineType, defineField} from 'sanity'
import {BlockContentIcon} from '@sanity/icons'

export const heroSection = defineType({
  name: 'heroSection',
  title: 'Hero Section',
  type: 'object',
  icon: BlockContentIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'image',
      title: 'Background Image',
      type: 'image',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          type: 'string',
          title: 'Alternative Text',
          validation: (Rule) => Rule.required().error('Alt text is required for accessibility'),
        }),
      ],
    }),
    defineField({
      name: 'cta',
      title: 'Call to Action',
      type: 'object',
      fields: [
        defineField({
          name: 'text',
          title: 'Button Text',
          type: 'string',
          validation: (Rule) => Rule.required().error('Button text is required'),
        }),
        defineField({
          name: 'linkType',
          title: 'Link Type',
          type: 'string',
          options: {
            list: [
              {title: 'Internal Page', value: 'internal'},
              {title: 'External URL', value: 'external'},
            ],
            layout: 'radio',
          },
          initialValue: 'internal',
        }),
        defineField({
          name: 'internalLink',
          title: 'Internal Link',
          type: 'reference',
          to: [{type: 'page'}, {type: 'artist'}, {type: 'artwork'}],
          hidden: ({parent}) => parent?.linkType !== 'internal',
          validation: (Rule) =>
            Rule.custom((value, context) => {
              const parent = context.parent as any
              if (parent?.linkType === 'internal' && !value) {
                return 'Internal link is required'
              }
              return true
            }),
        }),
        defineField({
          name: 'externalUrl',
          title: 'External URL',
          type: 'url',
          validation: (Rule) =>
            Rule.custom((value, context) => {
              const parent = context.parent as any
              if (parent?.linkType === 'external') {
                if (!value) return 'External URL is required'
                // Validate URL format
                if (!/^(http|https|mailto|tel):/.test(value)) {
                  return 'Must be a valid URL starting with http://, https://, mailto:, or tel:'
                }
              }
              return true
            }),
          hidden: ({parent}) => parent?.linkType !== 'external',
        }),
      ],
    }),
    defineField({
      name: 'enabled',
      title: 'Enabled',
      type: 'boolean',
      description: 'Toggle to show/hide this section',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'subtitle',
      media: 'image',
      enabled: 'enabled',
    },
    prepare({title, subtitle, media, enabled}) {
      return {
        title: title || 'Untitled Hero',
        subtitle: enabled ? subtitle || 'Hero Section' : 'Hero Section (Disabled)',
        media,
      }
    },
  },
})
