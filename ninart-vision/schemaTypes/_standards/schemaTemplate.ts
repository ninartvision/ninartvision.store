import {defineType, defineField} from 'sanity'

/**
 * ========================================
 * SCHEMA TEMPLATE
 * Use this as a starting point for new document types
 * ========================================
 * 
 * CHECKLIST:
 * - [ ] Define all fields with clear descriptions
 * - [ ] Mark required fields with validation
 * - [ ] Add field to fieldStandards.ts
 * - [ ] Create GROQ projection in fieldStandards.ts
 * - [ ] Update validation script
 * - [ ] Test in Sanity Studio
 * - [ ] Deploy schema
 */

export const templateDocument = defineType({
  name: 'templateDocument',
  title: 'Template Document',
  type: 'document',
  
  // REQUIRED FIELDS FIRST
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Display title - shown in all views',
      validation: (Rule) => Rule.required().error('Title is required'),
      
      // FRONTEND PRIORITY: CRITICAL
      // Always include in GROQ queries
    }),
    
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'URL-friendly identifier',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required().custom(async (slug, context) => {
        if (!slug?.current) return true
        
        const client = context.getClient({apiVersion: '2025-02-05'})
        const id = context.document?._id?.replace(/^drafts\./, '')
        
        const existing = await client.fetch(
          `count(*[_type == "templateDocument" && slug.current == $slug && _id != $id])`,
          {slug: slug.current, id}
        )
        
        return existing === 0 || 'Slug already exists'
      }),
      
      // FRONTEND PRIORITY: CRITICAL
      // Required for routing and detail pages
    }),
    
    // HIGH PRIORITY OPTIONAL FIELDS
    defineField({
      name: 'image',
      title: 'Featured Image',
      type: 'image',
      description: 'Main image - displayed in cards and detail views',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          type: 'string',
          title: 'Alternative Text',
          description: 'Describe the image for screen readers and SEO',
          validation: (Rule) => Rule.required().error('Alt text is required for accessibility'),
        }),
      ],
      
      // FRONTEND PRIORITY: HIGH
      // Include with: image{asset->{_id, url, metadata{lqip, dimensions}}, alt}
    }),
    
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      description: 'Brief description - shown in cards and previews',
      rows: 3,
      
      // FRONTEND PRIORITY: HIGH
      // Include in card and detail views
    }),
    
    // MEDIUM PRIORITY OPTIONAL FIELDS
    defineField({
      name: 'content',
      title: 'Full Content',
      type: 'text',
      description: 'Full content - shown only on detail pages',
      rows: 10,
      
      // FRONTEND PRIORITY: MEDIUM
      // Include only in detail view queries
    }),
    
    // LOW PRIORITY FIELDS
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      description: 'Mark as featured - used for filtering',
      initialValue: false,
      
      // FRONTEND PRIORITY: LOW
      // Used for filtering, not always displayed
    }),
  ],
  
  preview: {
    select: {
      title: 'title',
      subtitle: 'description',
      media: 'image',
    },
  },
})
