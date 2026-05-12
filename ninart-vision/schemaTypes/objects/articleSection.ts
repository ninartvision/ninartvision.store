import {defineType, defineField} from 'sanity'
import {DocumentTextIcon} from '@sanity/icons'

export const articleSection = defineType({
  name: 'articleSection',
  title: 'Article Section',
  type: 'object',
  icon: DocumentTextIcon,
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
      name: 'articleSource',
      title: 'Article Source',
      type: 'string',
      options: {
        list: [
          {title: 'Select Manually', value: 'manual'},
          {title: 'Featured Articles', value: 'featured'},
          {title: 'Recent Articles', value: 'recent'},
          {title: 'By Category', value: 'byCategory'},
        ],
        layout: 'radio',
      },
      initialValue: 'recent',
    }),
    defineField({
      name: 'articles',
      title: 'Articles',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'article'}]}],
      hidden: ({parent}) => parent?.articleSource !== 'manual',
      validation: (Rule) =>
        Rule.custom((articles, context) => {
          const parent = context.parent as any
          if (parent?.articleSource === 'manual' && (!articles || articles.length === 0)) {
            return 'Add at least one article'
          }
          return true
        }),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          {title: 'News', value: 'news'},
          {title: 'Exhibition', value: 'exhibition'},
          {title: 'Interview', value: 'interview'},
          {title: 'Review', value: 'review'},
          {title: 'Essay', value: 'essay'},
        ],
      },
      hidden: ({parent}) => parent?.articleSource !== 'byCategory',
      validation: (Rule) =>
        Rule.custom((category, context) => {
          const parent = context.parent as any
          if (parent?.articleSource === 'byCategory' && !category) {
            return 'Select a category'
          }
          return true
        }),
    }),
    defineField({
      name: 'limit',
      title: 'Number of Articles to Show',
      type: 'number',
      description: 'Leave empty to show all',
      validation: (Rule) => Rule.min(1).max(20),
      initialValue: 3,
      hidden: ({parent}) => parent?.articleSource === 'manual',
    }),
    defineField({
      name: 'layout',
      title: 'Layout',
      type: 'string',
      options: {
        list: [
          {title: 'Grid', value: 'grid'},
          {title: 'List', value: 'list'},
          {title: 'Featured', value: 'featured'},
        ],
        layout: 'radio',
      },
      initialValue: 'grid',
    }),
    defineField({
      name: 'showExcerpt',
      title: 'Show Excerpt',
      type: 'boolean',
      description: 'Display article excerpt in preview',
      initialValue: true,
    }),
    defineField({
      name: 'showImage',
      title: 'Show Image',
      type: 'boolean',
      description: 'Display article main image',
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
      source: 'articleSource',
      layout: 'layout',
      enabled: 'enabled',
    },
    prepare({title, source, layout, enabled}) {
      return {
        title: title || 'Untitled Article Section',
        subtitle: enabled
          ? `${layout || 'grid'} • ${source || 'recent'}`
          : 'Article Section (Disabled)',
        media: DocumentTextIcon,
      }
    },
  },
})
