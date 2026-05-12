import {defineType, defineField} from 'sanity'
import {DocumentTextIcon} from '@sanity/icons'

/**
 * Article Document Schema
 * 
 * Complete control center for article/blog content management.
 * 
 * CORE FIELDS:
 * - title, slug: Identity and routing
 * - shortDescription: Brief summary for listings and SEO
 * - mainImage: Featured/hero image
 * - content: Full article content (portable text)
 * - category: Article categorization
 * - status: Visibility control (draft/published/hidden)
 * - publishedAt: Publication date/time
 * - featured: Homepage/special section highlighting
 * - relatedArtists, relatedArtworks: Content relationships
 * 
 * FRONTEND REQUIREMENTS:
 * - CRITICAL: _id, title, slug
 * - HIGH: shortDescription, mainImage, content, publishedAt
 * - MEDIUM: category, status, featured, related references
 */
export const article = defineType({
  name: 'article',
  title: 'Article',
  type: 'document',
  icon: DocumentTextIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'seo', title: 'SEO & Discovery'},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required().custom(async (slug, context) => {
        if (!slug?.current) return true
        
        const client = context.getClient({apiVersion: '2025-02-05'})
        const id = context.document?._id?.replace(/^drafts\./, '')
        
        const existing = await client.fetch(
          `count(*[_type == "article" && slug.current == $slug && _id != $id])`,
          {slug: slug.current, id}
        )
        
        return existing === 0 || 'Slug already exists for another article'
      }),
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      description: 'Brief summary for previews and SEO',
      validation: (Rule) => Rule.max(200).warning('Keep under 200 characters for best results'),
    }),
    defineField({
      name: 'mainImage',
      title: 'Featured Image',
      type: 'image',
      description: 'Main image displayed at the top of the article and in listings',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          type: 'string',
          title: 'Alternative Text',
          description: 'Describe the image for screen readers',
          validation: (Rule) => Rule.required().error('Alt text is required for accessibility'),
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
      name: 'content',
      title: 'Article Content',
      type: 'portableTextBlock',
      description: 'Full article content with rich text formatting',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      description: 'Article category for filtering and organization',
      options: {
        list: [
          {title: 'News', value: 'news'},
          {title: 'Exhibition', value: 'exhibition'},
          {title: 'Interview', value: 'interview'},
          {title: 'Review', value: 'review'},
          {title: 'Essay', value: 'essay'},
        ],
      },
    }),
    defineField({
      name: 'publishedAt',
      title: 'Publication Date',
      type: 'datetime',
      description: 'Date and time the article was published',
      validation: (Rule) => Rule.required(),
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'status',
      title: 'Publish Status',
      type: 'string',
      description: 'Control visibility of this article on the website',
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
      name: 'featured',
      title: 'Featured Article',
      type: 'boolean',
      description: 'Highlight this article in featured sections and homepage',
      initialValue: false,
    }),
    defineField({
      name: 'relatedArtists',
      title: 'Related Artists',
      type: 'array',
      description: 'Artists mentioned or featured in this article',
      of: [{type: 'reference', to: [{type: 'artist'}]}],
    }),
    defineField({
      name: 'relatedArtworks',
      title: 'Related Artworks',
      type: 'array',
      description: 'Artworks mentioned or featured in this article',
      of: [{type: 'reference', to: [{type: 'artwork'}]}],
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seoMeta',
      group: 'seo',
    }),
  ],
  orderings: [
    {
      title: 'Published Date, New',
      name: 'publishedAtDesc',
      by: [{field: 'publishedAt', direction: 'desc'}],
    },
    {
      title: 'Published Date, Old',
      name: 'publishedAtAsc',
      by: [{field: 'publishedAt', direction: 'asc'}],
    },
    {
      title: 'Title A-Z',
      name: 'titleAsc',
      by: [{field: 'title', direction: 'asc'}],
    },
  ],
  preview: {
    select: {
      title: 'title',
      category: 'category',
      media: 'mainImage',
      status: 'status',
      featured: 'featured',
    },
    prepare({title, category, media, status, featured}) {
      const statusLabel = status === 'draft' ? '(Draft)' : status === 'hidden' ? '(Hidden)' : ''
      const featuredLabel = featured && status === 'published' ? '(Featured)' : ''
      return {
        title,
        subtitle: `${category || 'Article'} ${statusLabel || featuredLabel}`.trim(),
        media,
      }
    },
  },
})
