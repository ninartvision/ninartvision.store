# Sanity Schema Best Practices & Naming Conventions

## Table of Contents
1. [Field Naming Conventions](#field-naming-conventions)
2. [Required vs Optional Fields](#required-vs-optional-fields)
3. [Field Documentation Standards](#field-documentation-standards)
4. [Schema-Level Safeguards](#schema-level-safeguards)
5. [Workflow Checklist](#workflow-checklist)

---

## 1. Field Naming Conventions

### General Rules

| Type | Convention | Example | Avoid |
|------|-----------|---------|-------|
| **Text fields** | Singular noun | `title`, `name`, `description` | `titles`, `names` |
| **Boolean fields** | Descriptive adjective | `featured`, `published`, `enabled` | `isFeatured`, `is_published` |
| **Arrays** | Plural noun | `images`, `tags`, `categories` | `image_list`, `tag_array` |
| **References** | Singular entity name | `artist`, `author`, `category` | `artistRef`, `artist_id` |
| **Slugs** | Always `slug` | `slug` | `url_slug`, `permalink` |
| **Dates** | Past tense verb + `At` | `publishedAt`, `createdAt` | `publish_date`, `date_created` |

### Specific Field Names (Standard Across All Schemas)

```typescript
// ALWAYS USE THESE EXACT NAMES:
name: 'slug'           // NOT: urlSlug, permalink, uri
name: 'image'          // NOT: picture, photo, img
name: 'images'         // NOT: gallery, imageGallery
name: 'title'          // NOT: heading, name (unless it's a person)
name: 'description'    // NOT: desc, summary, content
name: 'featured'       // NOT: isFeatured, highlight
name: 'publishedAt'    // NOT: publishDate, pubDate
```

### Avoid These Patterns

❌ **Don't use:**
- Underscores: `artist_name`, `image_url`
- Prefixes: `str_title`, `int_year`, `bool_featured`
- Hungarian notation: `arrImages`, `objMetadata`
- Abbreviations: `desc`, `img`, `ref`

✅ **Do use:**
- camelCase: `artistName`, `imageUrl`
- Descriptive full words: `description`, `image`, `reference`
- Clear, intuitive names: `year`, `medium`, `dimensions`

---

## 2. Required vs Optional Fields

### When to Make Fields Required

```typescript
// ✅ MAKE REQUIRED when:
defineField({
  name: 'title',
  validation: (Rule) => Rule.required(),
  
  // Field is necessary for:
  // 1. Uniquely identifying the document
  // 2. Creating proper URLs/routing
  // 3. Displaying minimum viable content
  // 4. Business logic that depends on it
})

// Required field examples:
- title (content identification)
- name (person/entity identification)
- slug (URL generation)
- artist (relationship integrity)
```

### When to Make Fields Optional

```typescript
// ✅ MAKE OPTIONAL when:
defineField({
  name: 'bio',
  // No validation required
  
  // Field is:
  // 1. Enhancement to basic content
  // 2. May not apply to all entries
  // 3. Can be added later
  // 4. Not needed for minimum viable content
})

// Optional field examples:
- bio (not all artists may have one)
- style (may evolve over time)
- price (may be negotiable/hidden)
- year (may be unknown for some artworks)
```

### Conditional Requirements

```typescript
// Use when a field is required only in certain contexts
defineField({
  name: 'images',
  validation: (Rule) => 
    Rule.custom((images, context) => {
      const parent = context.parent as any
      
      // Required only if this is a gallery artwork
      if (parent?.type === 'gallery' && (!images || images.length === 0)) {
        return 'Gallery artworks must have at least one image'
      }
      
      return true
    })
})
```

---

## 3. Field Documentation Standards

### Every Field MUST Have:

```typescript
defineField({
  name: 'fieldName',
  title: 'Human-Readable Title',
  type: 'string',
  
  // 1. DESCRIPTION (what it's for)
  description: 'Brief explanation of what this field contains and when to use it',
  
  // 2. PLACEHOLDER (example value)
  placeholder: 'e.g., Contemporary Abstract',
  
  // 3. FRONTEND PRIORITY (inline comment)
  // FRONTEND: CRITICAL/HIGH/MEDIUM/LOW - When to include in queries
  
  // 4. QUERY EXAMPLE (inline comment for complex fields)
  // Query as: image{asset->{url, metadata{lqip}}, alt}
})
```

### Complete Documentation Example

```typescript
defineField({
  name: 'bio',
  title: 'About',
  type: 'text',
  description: 'Artist biography - displayed in detail pages and bio-enabled cards',
  placeholder: 'Tell us about the artist...',
  rows: 6,
  
  // FRONTEND: HIGH - Include in detail views and artist cards with bio toggle
  // Often omitted from simple list views for performance
  // Query as: bio
}),
```

### Schema File Header Documentation

```typescript
/**
 * Artist Document Schema
 * 
 * FRONTEND REQUIREMENTS:
 * - CRITICAL fields: _id, name, slug (always include)
 * - HIGH priority: image, bio, style (include in most views)
 * - MEDIUM priority: featured (filtering only)
 * 
 * Standard GROQ projections: see schemaTypes/_standards/fieldStandards.ts
 * 
 * NOTES:
 * - Bio field is optional but highly recommended
 * - Image alt text is required for accessibility
 * - Slug must be unique across all artists
 */
export const artist = defineType({
  // ...
})
```

---

## 4. Schema-Level Safeguards

### A. Validation Rules

```typescript
// Unique slugs with helpful error messages
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
```

### B. Initial Values for Booleans

```typescript
// Always provide initial values for booleans
defineField({
  name: 'featured',
  type: 'boolean',
  initialValue: false,  // ✅ ALWAYS SET THIS
  
  // Prevents undefined/null in queries
  // Makes filtering predictable
})
```

### C. Structured Lists for Enums

```typescript
// Use structured lists instead of free text
defineField({
  name: 'status',
  type: 'string',
  options: {
    list: [
      {title: 'For Sale', value: 'sale'},
      {title: 'Sold', value: 'sold'},
    ],
    layout: 'radio',  // or 'dropdown'
  },
  initialValue: 'sale',
  
  // Ensures data consistency
  // Enables reliable filtering in GROQ
})
```

### D. Image Alt Text Requirements

```typescript
// Require alt text for accessibility
defineField({
  name: 'image',
  type: 'image',
  fields: [
    defineField({
      name: 'alt',
      type: 'string',
      validation: (Rule) => 
        Rule.required().error('Alt text is required for accessibility'),
    }),
  ],
})
```

### E. Referenced Field Projection Comments

```typescript
defineField({
  name: 'artist',
  type: 'reference',
  to: [{type: 'artist'}],
  
  // FRONTEND: CRITICAL - Always dereference with artist info
  // Minimal: artist->{_id, name}
  // With detail: artist->{_id, name, "slug": slug.current}
  
  // This comment helps frontend developers know what to query
})
```

---

## 5. Workflow Checklist

### When Adding a New Field

```markdown
## New Field Checklist

### 1. Schema Definition
- [ ] Choose appropriate field type
- [ ] Use standard naming convention
- [ ] Add clear description
- [ ] Add placeholder example
- [ ] Set required/optional correctly
- [ ] Add validation rules if needed
- [ ] Set initial value (for booleans, numbers)
- [ ] Add frontend priority comment
- [ ] Add query example comment

### 2. Field Standards
- [ ] Add to `_standards/fieldStandards.ts`
- [ ] Set priority level (CRITICAL/HIGH/MEDIUM/LOW)
- [ ] Update relevant GROQ_PROJECTIONS
- [ ] Document when to include/exclude field

### 3. Frontend Integration
- [ ] Update all relevant GROQ queries
- [ ] Update TypeScript/JavaScript types
- [ ] Update rendering functions
- [ ] Add null/undefined checks
- [ ] Add sanitization if needed

### 4. Testing
- [ ] Test in Sanity Studio (create/edit)
- [ ] Test GROQ query in Vision
- [ ] Test frontend rendering (populated)
- [ ] Test frontend rendering (empty/null)
- [ ] Test with old documents (missing field)

### 5. Validation
- [ ] Run `npm run validate:sanity`
- [ ] Fix any reported errors
- [ ] Deploy schema: `npx sanity schema deploy`

### 6. Documentation
- [ ] Update schema comments
- [ ] Update GROQ query docs
- [ ] Update content editor guides
- [ ] Notify team of changes
```

### Pre-Deployment Checks

```bash
# 1. Validate schema changes
npm run validate:sanity

# 2. Deploy schema to Sanity
npx sanity schema deploy

# 3. Test queries in Vision
# Go to Sanity Studio > Vision
# Paste updated queries and verify results

# 4. Deploy frontend changes
npm run build
npm run deploy

# 5. Monitor for errors
# Check error logs for 24 hours after deployment
```

### Code Review Checklist

When reviewing schema changes, verify:

```markdown
- [ ] Field names follow conventions (camelCase, no underscores)
- [ ] All fields have descriptions
- [ ] Required fields have validation
- [ ] Boolean fields have initialValue
- [ ] Image fields have alt text requirements
- [ ] Frontend priority comments are present
- [ ] Complex fields have query examples
- [ ] Field is added to fieldStandards.ts
- [ ] Relevant GROQ projections are updated
- [ ] Validation script passes
```

---

## Common Pitfalls to Avoid

### ❌ Don't Do This:

```typescript
// 1. No description
defineField({
  name: 'style',
  type: 'string',
})

// 2. Inconsistent naming
defineField({
  name: 'artist_ref',  // Should be 'artist'
  type: 'reference',
})

// 3. No validation on required fields
defineField({
  name: 'title',
  type: 'string',
  // Missing: validation: (Rule) => Rule.required()
})

// 4. No initial value on boolean
defineField({
  name: 'featured',
  type: 'boolean',
  // Missing: initialValue: false
})

// 5. No frontend guidance
defineField({
  name: 'bio',
  type: 'text',
  // Missing: // FRONTEND: HIGH - Include in...
})
```

### ✅ Do This Instead:

```typescript
defineField({
  name: 'style',
  title: 'Artistic Style',
  type: 'string',
  description: 'Primary artistic style or movement',
  placeholder: 'e.g., Contemporary Abstract',
  
  // FRONTEND: HIGH - Include in artist cards and detail pages
  // Query as: style
})

defineField({
  name: 'artist',
  title: 'Artist',
  type: 'reference',
  to: [{type: 'artist'}],
  description: 'Artist who created this artwork',
  validation: (Rule) => Rule.required(),
  
  // FRONTEND: CRITICAL - Always dereference
  // Query as: artist->{_id, name}
})

defineField({
  name: 'featured',
  title: 'Featured',
  type: 'boolean',
  description: 'Mark as featured',
  initialValue: false,
  
  // FRONTEND: MEDIUM - Used for filtering
})
```

---

## Summary

**Golden Rules:**
1. **Consistency** - Use standard names across all schemas
2. **Documentation** - Every field needs description + priority comment
3. **Validation** - Required fields must have validation rules
4. **Defaults** - Booleans always need initialValue
5. **Accessibility** - Images always require alt text
6. **Testing** - Test in Studio, Vision, and Frontend
7. **Standards** - Update fieldStandards.ts with every new field

**Remember:** The schema is a contract between Sanity and your frontend. Clear documentation prevents mismatches and bugs.
