# Artist Multi-Language Bio Schema

## Recommended Sanity Schema Changes

### Option 1: Separate Fields (Simpler, Recommended)

Add these fields to your artist schema in Sanity Studio:

```typescript
{
  name: 'bio_en',
  title: 'Biography (English)',
  type: 'text',
  description: 'Artist biography in English',
  rows: 4
},
{
  name: 'bio_ka',
  title: 'Biography (Georgian)',
  type: 'text',
  description: 'Artist biography in Georgian (ქართული)',
  rows: 4
}
```

### Option 2: Localized Object (More Structured)

```typescript
{
  name: 'bio',
  title: 'Biography',
  type: 'object',
  fields: [
    {
      name: 'en',
      title: 'English',
      type: 'text',
      rows: 4
    },
    {
      name: 'ka',
      title: 'Georgian (ქართული)',
      type: 'text',
      rows: 4
    }
  ]
}
```

## Implementation Choice

This implementation uses **Option 1 (Separate Fields)** for simplicity and backward compatibility.

## Migration Steps

1. Open your Sanity Studio
2. Add the schema fields above to your artist schema
3. Deploy schema: `npx sanity deploy`
4. Edit existing artist documents to add bilingual biographies
5. Publish the documents

## Fallback Behavior

- If `bio_en` is empty, display `bio_ka`
- If `bio_ka` is empty, display `bio_en`
- If both are empty, display the legacy `about` field
- If all are empty, show "No biography available"
