# Artist SEO Metadata Schema

## Recommended Sanity Schema Changes

### Option 1: Separate Fields (Simpler)

Add these fields to your artist schema in Sanity Studio:

```typescript
{
  name: 'seoTitle',
  title: 'SEO Title',
  type: 'string',
  description: 'Custom page title for SEO (max 60 characters recommended)',
  validation: Rule => Rule.max(60).warning('Titles longer than 60 characters may be truncated in search results')
},
{
  name: 'seoDescription',
  title: 'SEO Description',
  type: 'text',
  rows: 3,
  description: 'Meta description for search engines (max 160 characters recommended)',
  validation: Rule => Rule.max(160).warning('Descriptions longer than 160 characters may be truncated')
}
```

### Option 2: SEO Object (More Organized)

```typescript
{
  name: 'seo',
  title: 'SEO Settings',
  type: 'object',
  description: 'Search Engine Optimization metadata',
  fields: [
    {
      name: 'title',
      title: 'Meta Title',
      type: 'string',
      description: 'Custom page title (max 60 characters)',
      validation: Rule => Rule.max(60)
    },
    {
      name: 'description',
      title: 'Meta Description',
      type: 'text',
      rows: 3,
      description: 'Page description for search results (max 160 characters)',
      validation: Rule => Rule.max(160)
    },
    {
      name: 'image',
      title: 'Social Share Image',
      type: 'image',
      description: 'Custom image for social media sharing (Open Graph)'
    }
  ]
}
```

## Implementation Choice

This implementation uses **Option 1 (Separate Fields)** for simplicity.

## Fallback Logic

When SEO fields are empty, metadata is auto-generated:

1. **SEO Title**: 
   - If `seoTitle` exists → use it
   - Otherwise → `"{Artist Name} - Contemporary Artist | Ninart Vision"`

2. **SEO Description**:
   - If `seoDescription` exists → use it
   - Otherwise → First 160 chars of `bio_en` or `bio_ka`
   - Otherwise → `"Discover artworks by {Artist Name}, specializing in {style}."`

3. **Open Graph Image**:
   - Uses artist avatar image from Sanity

## Migration Steps

1. Open your Sanity Studio
2. Add the SEO fields to your artist schema
3. Deploy schema: `npx sanity deploy`
4. Optionally edit artist documents to add custom SEO metadata
5. Publish the documents

## Benefits

- ✅ Improved search engine visibility
- ✅ Better social media sharing (Facebook, Twitter, LinkedIn)
- ✅ Custom titles and descriptions per artist
- ✅ Automatic fallbacks ensure metadata always exists
- ✅ No manual HTML editing required
