import {defineType, defineField} from 'sanity'
import {HomeIcon} from '@sanity/icons'

export const homepage = defineType({
  name: 'homepage',
  title: 'Homepage',
  type: 'document',
  icon: HomeIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Page Title',
      type: 'string',
      description: 'For internal reference and SEO',
      validation: (Rule) => Rule.required(),
      initialValue: 'Homepage',
    }),
    defineField({
      name: 'status',
      title: 'Publish Status',
      type: 'string',
      description: 'Control visibility of the homepage',
      options: {
        list: [
          {title: 'Draft - Not visible', value: 'draft'},
          {title: 'Published - Live on website', value: 'published'},
          {title: 'Hidden - Temporarily hidden', value: 'hidden'},
        ],
        layout: 'radio',
      },
      initialValue: 'published',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      description: 'Search engine optimization settings',
      fields: [
        defineField({
          name: 'metaTitle',
          title: 'Meta Title',
          type: 'string',
          description: 'Page title for search engines (leave empty to use default)',
          validation: (Rule) => Rule.max(60).warning('Keep under 60 characters for best SEO'),
        }),
        defineField({
          name: 'metaDescription',
          title: 'Meta Description',
          type: 'text',
          description: 'Page description for search engines',
          rows: 3,
          validation: (Rule) => Rule.max(160).warning('Keep under 160 characters for best SEO'),
        }),
        defineField({
          name: 'ogImage',
          title: 'Social Share Image',
          type: 'image',
          description: 'Image shown when shared on social media (Facebook, Twitter, etc.)',
          options: {hotspot: true},
        }),
      ],
    }),
    defineField({
      name: 'content',
      title: 'Page Content',
      type: 'pageBuilder',
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'title',
    },
    prepare({title}) {
      return {
        title: title || 'Homepage',
        subtitle: 'Singleton',
      }
    },
  },
})
