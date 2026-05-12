# Artist Placeholder Guide

## Overview
You now have **15 artist slots** in your website (3 real artists + 12 placeholders).

## Current Artists
1. **Nini Mzhavia** - Real artist
2. **Mzia Kashia** - Real artist  
3. **Nanuli Gogiberidze** - Real artist
4. **Artist 4** - Placeholder
5. **Artist 5** - Placeholder
6. **Artist Name** (artist6-15) - 10 new placeholders

---

## How to Replace a Placeholder Artist

### Step 1: Prepare Artist Image
1. Create or get a square artist photo (recommended: 500x500px)
2. Save it as `images/artists/artistname.jpg` (e.g., `images/artists/johndoe.jpg`)
3. Use a clear, professional photo with good lighting

### Step 2: Update data.js
Open `data.js` and find the placeholder you want to replace (e.g., artist6):

**BEFORE:**
```javascript
{
  id: "artist6",
  name: "Artist Name",
  avatar: "images/artists/placeholder.jpg",
  whatsapp: "995000000002",
  country: "georgia",
  style: "Artist Style"
}
```

**AFTER:**
```javascript
{
  id: "johndoe",                           // ← Change to unique ID (lowercase, no spaces)
  name: "John Doe",                        // ← Update artist name
  avatar: "images/artists/johndoe.jpg",    // ← Your new image path
  whatsapp: "995123456789",                // ← Artist's WhatsApp number
  country: "georgia",
  style: "Contemporary Abstract",          // ← Artist's style/genre
  about: "John Doe is a contemporary..."   // ← Optional: Add biography
}
```

### Step 3: Test
1. Refresh your website
2. Check the homepage Artists section
3. Check the `/artists/` page
4. Click on the artist card to verify it works

---

## Placeholder Image (Optional)

If you want placeholder images to show instead of empty circles:

1. Create a generic placeholder image (e.g., a gray circle with "Artist Photo" text)
2. Save it as `images/artists/placeholder.jpg`
3. All placeholder artists will automatically use this image

---

## Hide Placeholders (Optional)

If you want to hide placeholder artists until you're ready:

### On Homepage (index.html):
Edit `js/homeArtistsPreview.js`, line 13:
```javascript
// Change this:
const validArtists = artists;

// To this:
const validArtists = artists.filter(a => a.avatar && !a.avatar.includes('placeholder.jpg'));
```

### On Artists Page:
Edit `artists/index.html`, line 67:
```javascript
// Change this:
const validArtists = ARTISTS;

// To this:
const validArtists = ARTISTS.filter(a => a.avatar && !a.avatar.includes('placeholder.jpg'));
```

---

## Grid Layout

The artist grid is **fully responsive**:
- **Desktop**: Auto-fit columns (minimum 240px width)
- **Tablet (≤900px)**: 3 columns
- **Mobile (≤520px)**: 4 columns

All cards have:
- Same height and width (auto-adjusted)
- Consistent spacing (32px gap on desktop, 6px on mobile)
- Hover effects (lift + shadow)
- Clean borders and rounded corners

**No layout changes needed** - just replace the data!

---

## Adding More Artists

To add beyond artist15:

1. Open `data.js`
2. Before the closing `];` add:
```javascript
  ,
  {
    id: "artist16",
    name: "Artist Name",
    avatar: "images/artists/placeholder.jpg",
    whatsapp: "995000000012",
    country: "georgia",
    style: "Artist Style"
  }
```

You can add as many as you want - the grid will auto-adjust!

---

## Tips

✅ **DO:**
- Use square images (1:1 ratio)
- Keep file sizes under 500KB for fast loading
- Use descriptive artist IDs (e.g., "johndoe" not "artist16")
- Add unique WhatsApp numbers for each artist

❌ **DON'T:**
- Use spaces in artist IDs
- Upload very large images (>2MB)
- Use special characters in filenames
- Duplicate artist IDs

---

## Need Help?

All artist data is in: `data.js` (lines 1-100)
All styling is in: `style.css` (search for `.artist-card`)
Homepage script: `js/homeArtistsPreview.js`
Artists page script: `artists/index.html` (bottom script tag)
