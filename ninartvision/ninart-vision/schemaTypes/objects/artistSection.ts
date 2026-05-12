import {defineType, defineField} from 'sanity'
import {UserIcon} from '@sanity/icons'

export const artistSection = defineType({
  name: 'artistSection',
  title: 'Artist Section',
  type: 'object',
  icon: UserIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Section Title',
      type: 'string',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'artistSource',
      title: 'Artist Source',
      type: 'string',
      options: {
        list: [
          {title: 'Select Manually', value: 'manual'},
          {title: 'Featured Artists', value: 'featured'},
          {title: 'All Artists', value: 'all'},
        ],
        layout: 'radio',
      },
      initialValue: 'manual',
    }),
    defineField({
      name: 'artists',
      title: 'Artists',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'artist'}]}],
      hidden: ({parent}) => parent?.artistSource !== 'manual',
      validation: (Rule) =>
        Rule.custom((artists, context) => {
          const parent = context.parent as any
          if (parent?.artistSource === 'manual' && (!artists || artists.length === 0)) {
            return 'Add at least one artist'
          }
          return true
        }),
    }),
    defineField({
      name: 'limit',
      title: 'Number of Artists to Show',
      type: 'number',
      description: 'Leave empty to show all',
      validation: (Rule) => Rule.min(1).max(20),
      hidden: ({parent}) => parent?.artistSource === 'manual',
    }),
    defineField({
      name: 'layout',
      title: 'Layout',
      type: 'string',
      options: {
        list: [
          {title: 'Grid', value: 'grid'},
          {title: 'List', value: 'list'},
          {title: 'Carousel', value: 'carousel'},
        ],
        layout: 'radio',
      },
      initialValue: 'grid',
    }),
    defineField({
      name: 'showBio',
      title: 'Show Biography',
      type: 'boolean',
      description: 'Display artist biography in preview. Note: For Artists page, set to false - bio content is not rendered on frontend.',
      initialValue: true,
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
      layout: 'layout',
      source: 'artistSource',
      enabled: 'enabled',
    },
    prepare({title, layout, source, enabled}) {
      return {
        title: title || 'Untitled Artist Section',
        subtitle: enabled
          ? `${layout || 'grid'} • ${source || 'manual'}`
          : 'Artist Section (Disabled)',
        media: UserIcon,
      }
    },
  },
})
