# Featured Artworks Schema Suggestion

## Overview
Add a `featured` boolean field to the artwork schema to enable featuring specific artworks on the homepage.

## Required Schema Changes

### Option 1: Cloud-only Schema (No local Studio)
If you don't have a local Sanity Studio, use the Sanity MCP tool to deploy this schema:

```javascript
{
  name: 'artwork',
  type: 'document',
  title: 'Artwork',
  fields: [
    {
      name: 'title',
      type: 'string',
      title: 'Title',
      validation: Rule => Rule.required()
    },
    {
      name: 'artist',
      type: 'reference',
      title: 'Artist',
      to: [{type: 'artist'}],
      validation: Rule => Rule.required()
    },
    {
      name: 'image',
      type: 'image',
      title: 'Image',
      options: {
        hotspot: true
      },
      validation: Rule => Rule.required()
    },
    {
      name: 'price',
      type: 'number',
      title: 'Price (₾)',
      validation: Rule => Rule.required().min(0)
    },
    {
      name: 'size',
      type: 'string',
      title: 'Size (e.g., 50x70 cm)'
    },
    {
      name: 'medium',
      type: 'string',
      title: 'Medium (e.g., Oil on Canvas)'
    },
    {
      name: 'year',
      type: 'number',
      title: 'Year Created'
    },
    {
      name: 'status',
      type: 'string',
      title: 'Status',
      options: {
        list: [
          {title: 'For Sale', value: 'sale'},
          {title: 'Sold', value: 'sold'}
        ]
      },
      validation: Rule => Rule.required()
    },
    {
      name: 'description',
      type: 'text',
      title: 'Description'
    },
    {
      name: 'featured',
      type: 'boolean',
      title: 'Featured Artwork',
      description: 'Show this artwork on the homepage',
      initialValue: false
    },
    {
      name: 'slug',
      type: 'slug',
      title: 'Slug',
      options: {
        source: 'title',
        maxLength: 96
      }
    }
  ]
}
```

### Option 2: Local Studio Schema
If you have a local Sanity Studio (schemaTypes/ folder), add this field to your artwork schema file:

**File: `schemaTypes/artwork.ts` or `schemaTypes/artwork.js`**

```javascript
// Add this field to your existing artwork schema
{
  name: 'featured',
  type: 'boolean',
  title: 'Featured Artwork',
  description: 'Show this artwork on the homepage',
  initialValue: false
}
```

Then deploy the schema:
```bash
npx sanity@latest schema deploy
```

## Frontend Implementation

The frontend code has been updated in:
- `sanity-client.js` - Added `fetchFeaturedArtworks()` function
- `js/homeShopPreview.js` - Updated to fetch and display featured artworks from Sanity

## Usage in Sanity Studio

1. **Create or edit an artwork** in your Sanity Studio
2. **Toggle the "Featured Artwork" checkbox** to mark it as featured
3. **Publish the document** to make it live
4. The homepage will **automatically display** up to 3 random featured artworks
5. If no featured artworks exist, the section will **hide automatically**

## Benefits

✅ **Curated Content** - Manually select which artworks to showcase  
✅ **Dynamic Updates** - Change featured artworks without code changes  
✅ **Auto-rotation** - Featured artworks rotate every 5 seconds  
✅ **Graceful Fallback** - Section hides if no featured artworks exist  
✅ **Multi-artist Support** - Can feature artworks from any artist  

## Migration Note

Current implementation filters by `artist === "nini"` from `window.ARTWORKS` array. After adding the `featured` field to Sanity and marking artworks as featured, the new implementation will automatically use Sanity data instead.
