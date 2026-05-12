import {defineType, defineField} from 'sanity'
import {CogIcon} from '@sanity/icons'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  icon: CogIcon,
  fields: [
    defineField({
      name: 'siteName',
      title: 'Site Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'siteDescription',
      title: 'Site Description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
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
      name: 'mainNavigation',
      title: 'Main Navigation',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'navLink',
          title: 'Navigation Link',
          fields: [
            defineField({
              name: 'label',
              title: 'Label',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'linkType',
              title: 'Link Type',
              type: 'string',
              options: {
                list: [
                  {title: 'Homepage', value: 'homepage'},
                  {title: 'Page', value: 'page'},
                  {title: 'External URL', value: 'external'},
                ],
                layout: 'radio',
              },
              initialValue: 'page',
            }),
            defineField({
              name: 'pageLink',
              title: 'Page',
              type: 'reference',
              to: [{type: 'page'}],
              hidden: ({parent}) => parent?.linkType !== 'page',
              validation: (Rule) =>
                Rule.custom((value, context) => {
                  const parent = context.parent as any
                  if (parent?.linkType === 'page' && !value) {
                    return 'Page link is required'
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
                    if (!/^(http|https):/.test(value)) {
                      return 'Must be a valid URL starting with http:// or https://'
                    }
                  }
                  return true
                }),
              hidden: ({parent}) => parent?.linkType !== 'external',
            }),
          ],
          preview: {
            select: {
              title: 'label',
              linkType: 'linkType',
            },
            prepare({title, linkType}) {
              return {
                title: title || 'Untitled',
                subtitle: linkType || 'Link',
              }
            },
          },
        },
      ],
    }),
    defineField({
      name: 'footer',
      title: 'Footer',
      type: 'object',
      fields: [
        defineField({
          name: 'text',
          title: 'Footer Text',
          type: 'text',
          rows: 3,
        }),
        defineField({
          name: 'socialLinks',
          title: 'Social Links',
          type: 'array',
          of: [
            {
              type: 'object',
              name: 'socialLink',
              title: 'Social Link',
              fields: [
                defineField({
                  name: 'platform',
                  title: 'Platform',
                  type: 'string',
                  options: {
                    list: [
                      {title: 'Instagram', value: 'instagram'},
                      {title: 'Facebook', value: 'facebook'},
                      {title: 'Twitter', value: 'twitter'},
                      {title: 'LinkedIn', value: 'linkedin'},
                      {title: 'YouTube', value: 'youtube'},
                    ],
                  },
                  validation: (Rule) => Rule.required(),
                }),
                defineField({
                  name: 'url',
                  title: 'URL',
                  type: 'url',
                  validation: (Rule) =>
                    Rule.uri({
                      scheme: ['http', 'https'],
                    }).required().error('URL is required'),
                }),
              ],
              preview: {
                select: {
                  title: 'platform',
                  url: 'url',
                },
                prepare({title, url}) {
                  return {
                    title: title || 'Social Link',
                    subtitle: url,
                  }
                },
              },
            },
          ],
        }),
      ],
    }),
    defineField({
      name: 'seo',
      title: 'SEO Defaults',
      type: 'seoMeta',
      description:
        'Default SEO values used when a specific page has no SEO content set. These appear in Google results for the homepage and any page without custom SEO.',
    }),
  ],
  preview: {
    select: {
      title: 'siteName',
    },
    prepare({title}) {
      return {
        title: title || 'Site Settings',
        subtitle: 'Singleton',
      }
    },
  },
})
