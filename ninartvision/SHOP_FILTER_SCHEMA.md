# Shop Filter Schema Update

## Overview
To control which artworks appear in the main Shop page vs only on artist pages, add a `showInShop` boolean field to the Artwork schema in Sanity.

## Schema Update Required

Add this field to your Artwork schema in Sanity Studio:

```javascript
{
  name: 'showInShop',
  title: 'Show in Main Shop',
  type: 'boolean',
  description: 'When enabled, this artwork appears in the main Shop page. When disabled, it only appears on the artist\'s individual page.',
  initialValue: false, // Default to NOT showing in shop
  validation: Rule => Rule.required()
}
```

## Implementation Details

### Schema Location
Add this field to your existing artwork schema type (likely named `artwork` or similar) in your Sanity Studio schema files.

### Default Behavior
- **Default value: `false`** - New artworks will NOT appear in shop by default
- This ensures only explicitly selected artworks are visible in the main shop
- All artworks still appear on their respective artist pages

### How to Use in Sanity Studio
1. Open any artwork document in Sanity Studio
2. You'll see a new checkbox: "Show in Main Shop"
3. Check the box to make the artwork visible in the main shop
4. Uncheck to hide it from the main shop (still visible on artist page)

## What This Achieves

### Shop Page (sale/shop.html)
- ✅ Shows only artworks where `showInShop == true`
- ✅ Filtered by selected artist (if any)
- ✅ Filtered by status (all/sale/sold)
- ✅ Perfect for featuring only your (Nini's) best work

### Artist Pages (artist.html?artist=slug)
- ✅ Shows ALL artworks for that artist
- ✅ Ignores the `showInShop` field completely
- ✅ Ensures complete artist portfolio visibility

## Example Usage Scenario

**Nini's artworks:**
- Painting 1: `showInShop: true` → Shows in Shop ✓
- Painting 2: `showInShop: true` → Shows in Shop ✓
- Painting 3: `showInShop: false` → Only on Nini's page

**Nanuli's artworks:**
- Artwork A: `showInShop: false` → Only on Nanuli's page
- Artwork B: `showInShop: false` → Only on Nanuli's page

**Result:**
- Main Shop shows only Nini's Painting 1 & 2
- Nini's artist page shows all 3 paintings
- Nanuli's artist page shows both artworks
- Shop can filter by "Nanuli" but shows nothing (because all her `showInShop == false`)

## Migration Steps

1. **Add the field to your Sanity schema** (see above)
2. **Deploy the schema**: Run `npx sanity@latest schema deploy` in your Sanity Studio directory
3. **Update existing artworks in Sanity Studio**:
   - Go through your artworks
   - Check "Show in Main Shop" for artworks you want in the shop
4. **Code is already updated** - The query changes are implemented automatically

## Technical Implementation

The code has been updated in:
- `data.js` - Added `showInShop` field to legacy ARTWORKS array
- `sale/shop-render.js` - Filters by `showInShop === true`
- `artists/artist.js` - Unchanged (shows all artworks)

No UI, CSS, or layout changes were made.
