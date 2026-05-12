import {defineType, defineField} from 'sanity'
import {ImagesIcon} from '@sanity/icons'

export const gallerySection = defineType({
  name: 'gallerySection',
  title: 'Gallery Section',
  type: 'object',
  icon: ImagesIcon,
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
      name: 'layout',
      title: 'Layout',
      type: 'string',
      options: {
        list: [
          {title: 'Grid', value: 'grid'},
          {title: 'Masonry', value: 'masonry'},
          {title: 'Slider', value: 'slider'},
        ],
        layout: 'radio',
      },
      initialValue: 'grid',
    }),
    defineField({
      name: 'artworkSource',
      title: 'Artwork Source',
      type: 'string',
      options: {
        list: [
          {title: 'Select Manually', value: 'manual'},
          {title: 'Featured Artworks', value: 'featured'},
          {title: 'By Artist', value: 'byArtist'},
        ],
        layout: 'radio',
      },
      initialValue: 'manual',
    }),
    defineField({
      name: 'artworks',
      title: 'Artworks',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'artwork'}]}],
      hidden: ({parent}) => parent?.artworkSource !== 'manual',
      validation: (Rule) =>
        Rule.custom((artworks, context) => {
          const parent = context.parent as any
          if (parent?.artworkSource === 'manual' && (!artworks || artworks.length === 0)) {
            return 'Add at least one artwork'
          }
          return true
        }),
    }),
    defineField({
      name: 'artist',
      title: 'Artist',
      type: 'reference',
      to: [{type: 'artist'}],
      hidden: ({parent}) => parent?.artworkSource !== 'byArtist',
      validation: (Rule) =>
        Rule.custom((artist, context) => {
          const parent = context.parent as any
          if (parent?.artworkSource === 'byArtist' && !artist) {
            return 'Select an artist'
          }
          return true
        }),
    }),
    defineField({
      name: 'limit',
      title: 'Number of Artworks to Show',
      type: 'number',
      description: 'Leave empty to show all',
      validation: (Rule) => Rule.min(1).max(50),
      hidden: ({parent}) => parent?.artworkSource === 'manual',
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
      source: 'artworkSource',
      enabled: 'enabled',
    },
    prepare({title, layout, source, enabled}) {
      return {
        title: title || 'Untitled Gallery',
        subtitle: enabled
          ? `${layout || 'grid'} • ${source || 'manual'}`
          : 'Gallery Section (Disabled)',
        media: ImagesIcon,
      }
    },
  },
})
