import {defineType, defineField} from 'sanity'
import {UserIcon} from '@sanity/icons'

/**
 * Artist Document Schema
 * 
 * Complete control center for artist content management.
 * 
 * CORE FIELDS:
 * - name, slug: Identity and routing
 * - image, gallery: Visual content (main photo + additional images)
 * - shortDescription, subtitle, bio: Text content (brief to detailed)
 * - style: Artistic categorization
 * - status: Visibility control (draft/published/hidden)
 * - featured: Homepage/special section highlighting
 * 
 * FRONTEND REQUIREMENTS:
 * - CRITICAL fields: _id, name, slug (always include)
 * - HIGH priority: shortDescription, subtitle, image, bio, style (include in most views)
 * - MEDIUM priority: gallery, status, featured (filtering and detail views)
 * 
 * Standard GROQ projections: see schemaTypes/_standards/fieldStandards.ts
 */
export const artist = defineType({
  name: 'artist',
  title: 'Artist',
  type: 'document',
  icon: UserIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'seo', title: 'SEO & Discovery'},
  ],
  fields: [
    // ==========================================
    // REQUIRED FIELDS (CRITICAL PRIORITY)
    // ==========================================
    
    defineField({
      name: 'name',
      title: 'Artist Name',
      type: 'string',
      description: 'Full artist name - displayed in all views',
      validation: (Rule) => Rule.required(),
      
      // FRONTEND: CRITICAL - Always include in queries
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'URL-friendly identifier for routing',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required().custom(async (slug, context) => {
        if (!slug?.current) return true
        
        const client = context.getClient({apiVersion: '2025-02-05'})
        const id = context.document?._id?.replace(/^drafts\./, '')
        
        const existing = await client.fetch(
          `count(*[_type == "artist" && slug.current == $slug && _id != $id])`,
          {slug: slug.current, id}
        )
        
        return existing === 0 || 'Slug already exists for another artist'
      }),
      
      // FRONTEND: CRITICAL - Required for routing to detail pages
      // Query as: "slug": slug.current
    }),
    
    // ==========================================
    // HIGH PRIORITY OPTIONAL FIELDS
    // ==========================================
    
    defineField({
      name: 'shortDescription',
      title: 'Short Description',
      type: 'text',
      description: 'Brief 1-2 line description of the artist',
      rows: 2,
      validation: (Rule) => Rule.max(150).warning('Keep under 150 characters for best display'),
      
      // FRONTEND: HIGH - Include in artist cards and listings
      // Short description appearing under artist name
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle',
      type: 'string',
      description: 'Short description displayed under artist avatar (e.g., "Georgian Impressionist")',
      placeholder: 'e.g., Contemporary Abstract Artist',
      validation: (Rule) => Rule.max(60).warning('Keep under 60 characters for best display'),
      
      // FRONTEND: HIGH - Include in artist cards and avatar displays
      // This appears as the subtitle under the artist name/avatar
    }),
    defineField({
      name: 'specialty',
      title: 'Specialty',
      type: 'string',
      description: 'Artist specialty or medium (e.g., "Oil Painting", "Sculpture")',
      placeholder: 'e.g., Oil Painting, Mixed Media',
      validation: (Rule) => Rule.max(100),
      
      // FRONTEND: HIGH - Include in artist cards
      // Alternative to subtitle for categorization
    }),
    
    // ==========================================
    // REQUIRED FIELDS (CRITICAL PRIORITY)
    // ==========================================
    
    defineField({
      name: 'image',
      title: 'Artist Photo',
      type: 'image',
      description: 'Artist profile photo - REQUIRED for visibility on website',
      options: {
        hotspot: true,
      },
      validation: (Rule) => Rule.required().custom((image) => {
        // Ensure image asset exists, not just empty image object
        if (!image?.asset) {
          return 'Artist photo is required. Please upload an image.'
        }
        return true
      }).error('Artist photo is required for publication'),
      fields: [
        defineField({
          name: 'alt',
          type: 'string',
          title: 'Alternative Text',
          description: 'Describe the image for screen readers (required for accessibility)',
          placeholder: 'e.g., Portrait of artist in their studio',
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
          placeholder: 'e.g., Artist Name - Official Portrait',
          validation: (Rule) => Rule.max(100),
        }),
      ],
      
      // FRONTEND: CRITICAL - Required in all user-facing views
      // Query as: image{asset->{_id, url, metadata{lqip, dimensions}}, alt, title}
    }),
    defineField({
      name: 'gallery',
      title: 'Artist Gallery',
      type: 'array',
      description: 'Additional images showcasing the artist\'s work or studio',
      of: [
        {
          type: 'image',
          options: {hotspot: true},
          fields: [
            defineField({
              name: 'alt',
              type: 'string',
              title: 'Alternative Text',
              description: 'Describe this image for screen readers',
              validation: (Rule) => 
                Rule.required()
                  .min(10)
                  .max(200)
                  .error('Alt text is required for all gallery images'),
            }),
            defineField({
              name: 'title',
              type: 'string',
              title: 'Image Title',
              description: 'Optional title for this gallery image',
              validation: (Rule) => Rule.max(100),
            }),
          ],
        },
      ],
      
      // FRONTEND: HIGH - Include in artist detail pages
      // Query as: gallery[]{asset->{_id, url, metadata{lqip, dimensions}}, alt, title, _key}
    }),
    defineField({
      name: 'bio',
      title: 'About',
      type: 'text',
      description: 'Artist biography - displayed in detail pages and bio-enabled cards',
      rows: 6,
      
      // FRONTEND: HIGH - Include in detail views and artist cards with bio toggle
      // Often omitted from simple list views for performance
    }),
    defineField({
      name: 'style',
      title: 'Artistic Style',
      type: 'string',
      description: 'Primary artistic style or movement (e.g., Contemporary Abstract, Impressionist)',
      placeholder: 'e.g., Contemporary Abstract & Impressionist',
      
      // FRONTEND: HIGH - Include in artist cards and detail pages
      // Provides important context for viewers
    }),
    
    // ==========================================
    // MEDIUM PRIORITY FIELDS
    // ==========================================
    
    defineField({
      name: 'status',
      title: 'Publish Status',
      type: 'string',
      description: 'Control visibility of this artist on the website',
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
      
      // FRONTEND: MEDIUM - Use for filtering visible content
      // Query filter: *[_type == "artist" && status == "published"]
    }),
    defineField({
      name: 'featured',
      title: 'Featured Artist',
      type: 'boolean',
      description: 'Show this artist in featured sections and homepage highlights',
      initialValue: false,
      
      // FRONTEND: MEDIUM - Used primarily for filtering
      // Query filter: *[_type == "artist" && featured == true]
      // Include field to show featured badges in UI
    }),

    // ==========================================
    // SEO FIELDS
    // ==========================================

    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seoMeta',
      group: 'seo',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'subtitle',
      media: 'image',
      featured: 'featured',
      status: 'status',
    },
    prepare({title, subtitle, media, featured, status}) {
      const statusLabel = status === 'draft' ? ' (Draft)' : status === 'hidden' ? ' (Hidden)' : ''
      const featuredLabel = featured && status === 'published' ? ' ⭐' : ''
      
      return {
        title: title + statusLabel + featuredLabel,
        subtitle: subtitle || (featured ? 'Featured Artist' : 'Artist'),
        media,
      }
    },
  },
})
