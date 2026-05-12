import {defineType, defineField} from 'sanity'
import {DocumentIcon} from '@sanity/icons'

/**
 * Page Document Schema
 * 
 * Complete control center for custom page content management.
 * 
 * CORE FIELDS:
 * - title, slug: Identity and routing
 * - shortDescription: Brief summary (optional)
 * - featuredImage: Main page image (optional)
 * - status: Visibility control (draft/published/hidden)
 * - seo: Search engine optimization
 * - content: Page builder sections
 * 
 * FRONTEND REQUIREMENTS:
 * - CRITICAL: _id, title, slug
 * - HIGH: content (pageBuilder sections)
 * - MEDIUM: status, shortDescription, featuredImage, seo
 */
export const page = defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  icon: DocumentIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Page Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'URL path for this page (e.g., "about" creates /about)',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required().custom(async (slug, context) => {
        if (!slug?.current) return true
        
        const client = context.getClient({apiVersion: '2025-02-05'})
        const id = context.document?._id?.replace(/^drafts\./, '')
        
        const existing = await client.fetch(
          `count(*[_type == "page" && slug.current == $slug && _id != $id])`,
          {slug: slug.current, id}
        )
        
        return existing === 0 || 'Slug already exists for another page'
      }),
    }),
    defineField({
      name: 'shortDescription',
      title: 'Short Description',
      type: 'text',
      description: 'Brief description of the page content (optional, used in listings)',
      rows: 2,
      validation: (Rule) => Rule.max(160).warning('Keep under 160 characters'),
    }),
    defineField({
      name: 'featuredImage',
      title: 'Featured Image',
      type: 'image',
      description: 'Optional main image for the page',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          type: 'string',
          title: 'Alternative Text',
          description: 'Describe the image for screen readers',
          validation: (Rule) =>
            Rule.required()
              .min(10)
              .max(200)
              .error('Alt text is required and should be 10-200 characters'),
        }),
        defineField({
          name: 'title',
          type: 'string',
          title: 'Image Title',
          description: 'Optional title for the image (appears on hover)',
          validation: (Rule) => Rule.max(100),
        }),
      ],
    }),
    defineField({
      name: 'status',
      title: 'Publish Status',
      type: 'string',
      description: 'Control visibility of this page on the website',
      options: {
        list: [
          {title: 'Draft - Not visible', value: 'draft'},
          {title: 'Published - Live on website', value: 'published'},
          {title: 'Hidden - Temporarily hidden', value: 'hidden'},
        ],
        layout: 'radio',
      },
      initialValue: 'draft',
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
      slug: 'slug.current',
    },
    prepare({title, slug}) {
      return {
        title,
        subtitle: slug ? `/${slug}` : 'No slug',
      }
    },
  },
})
