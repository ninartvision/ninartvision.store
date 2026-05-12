import {defineType, defineField} from 'sanity'

export const slide = defineType({
  name: 'slide',
  title: 'Slide',
  type: 'object',
  fields: [
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true},
      validation: (Rule) => Rule.required(),
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
      name: 'caption',
      title: 'Caption',
      type: 'string',
    }),
    defineField({
      name: 'link',
      title: 'Link (Optional)',
      type: 'object',
      fields: [
        defineField({
          name: 'linkType',
          title: 'Link Type',
          type: 'string',
          options: {
            list: [
              {title: 'Internal Page', value: 'internal'},
              {title: 'External URL', value: 'external'},
              {title: 'No Link', value: 'none'},
            ],
            layout: 'radio',
          },
          initialValue: 'none',
        }),
        defineField({
          name: 'internalLink',
          title: 'Internal Link',
          type: 'reference',
          to: [{type: 'page'}, {type: 'artist'}, {type: 'artwork'}],
          hidden: ({parent}) => parent?.linkType !== 'internal',
        }),
        defineField({
          name: 'externalUrl',
          title: 'External URL',
          type: 'url',
          validation: (Rule) =>
            Rule.uri({
              scheme: ['http', 'https'],
            }),
          hidden: ({parent}) => parent?.linkType !== 'external',
        }),
      ],
    }),
  ],
  preview: {
    select: {
      media: 'image',
      caption: 'caption',
    },
    prepare({media, caption}) {
      return {
        title: caption || 'Untitled Slide',
        media,
      }
    },
  },
})
