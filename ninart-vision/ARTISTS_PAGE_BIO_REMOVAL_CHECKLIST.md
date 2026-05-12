# Artists Page Bio Removal - Quick Action Checklist

## ✅ Completed (Sanity Studio / Schema)

- [x] Keep `bio` field in artist schema (not deleted)
- [x] Remove validation requirements on `bio` field (can be empty/null)
- [x] Update `showBio` field description in artistSection schema
- [x] Update GROQ query documentation to exclude bio from Artists page
- [x] Document changes in comprehensive guides

## ⚠️ Required (Frontend Developer)

### 1. Update Artists Page GROQ Query

**Current (REMOVE bio):**
```typescript
// In your Artists page query file
const artistsPageQuery = `
  *[_type == "page" && slug.current == "artists"][0]{
    title,
    content[]{
      _type == "artistSection" => {
        artists[]->{ 
          _id, name, slug, 
          bio,  // ❌ REMOVE THIS LINE
          image{...}
        }
      }
    }
  }
`
```

**Updated (bio excluded):**
```typescript
const artistsPageQuery = `
  *[_type == "page" && slug.current == "artists"][0]{
    title,
    content[]{
      _type == "artistSection" => {
        artists[]->{ 
          _id, name, slug,
          // bio intentionally excluded
          image{...}
        }
      }
    }
  }
`
```

### 2. Remove Bio Rendering from Artists Page Component

**Example locations to check:**
```tsx
// ❌ REMOVE sections like this from Artists page component:
<div className="artist-bio">
  {artist.bio}
</div>

// ❌ REMOVE "About Artist" sections
<section className="about-artist">
  <h3>About Artist</h3>
  <p>{artist.bio}</p>
</section>
```

### 3. Remove Language Switchers (EN / KA)

**Example code to remove:**
```tsx
// ❌ REMOVE language toggles for bio content on Artists page
<div className="language-switcher">
  <button onClick={() => setLang('en')}>EN</button>
  <button onClick={() => setLang('ka')}>KA</button>
</div>

// ❌ REMOVE conditional bio rendering by language
{lang === 'en' ? artist.bioEn : artist.bioKa}
```

### 4. Add Conditional Logic (if using shared components)

If you use the same artist card component on multiple pages:

```tsx
// ✅ ADD conditional rendering
function ArtistCard({ artist, showBio = false }) {
  return (
    <div>
      <h2>{artist.name}</h2>
      <img src={artist.image.url} alt={artist.image.alt} />
      
      {/* Only show bio if explicitly enabled */}
      {showBio && artist.bio && (
        <div className="bio">{artist.bio}</div>
      )}
    </div>
  )
}

// Usage on homepage (with bio)
<ArtistCard artist={artist} showBio={true} />

// Usage on Artists page (without bio)
<ArtistCard artist={artist} showBio={false} />
```

## 📋 Testing Checklist

After making frontend changes:

- [ ] Artists page loads without errors
- [ ] Artists page displays artist names and images
- [ ] NO bio/description text appears on Artists page
- [ ] NO EN/KA language toggles appear for Artists page bio
- [ ] Homepage still shows artist bios correctly (if configured)
- [ ] Artist detail pages still show bios (if you have them)
- [ ] Creating new artists with empty bio field works (no validation errors)
- [ ] Existing artists with bio content still display on homepage

## 🎯 Scope Reminder

### ✅ Affected (Change These)
- Artists page GROQ query
- Artists page component rendering
- Artists page language switchers for bio

### ❌ Not Affected (Don't Change These)
- Homepage queries and components
- Artist detail pages
- Global language switching
- Sanity schema (bio field kept)
- Other page types

## 📚 Reference Documentation

For detailed implementation guide, see:
- [ARTISTS_PAGE_NO_BIO.md](ARTISTS_PAGE_NO_BIO.md) - Complete implementation guide
- [GROQ_QUERIES.md](GROQ_QUERIES.md#-artists-page-query-all-artists) - Updated query reference
- [ARTISTS_BIO_REMOVAL_SUMMARY.md](ARTISTS_BIO_REMOVAL_SUMMARY.md) - Summary of changes

## 🚨 Important Notes

1. **Do NOT delete the bio field** from Sanity schema
2. **Only change Artists page** - do not affect homepage or other pages
3. **Test thoroughly** - especially language switching on other pages
4. **Bio field can be empty** in Sanity without errors
5. **Studio will still show bio field** - this is expected and correct

## ✅ Done!

Once you've completed the frontend checklist above, the Artists page will:
- Show artist names and images
- NOT show bio/description text
- NOT show EN/KA language toggles for bio
- Work without validation errors for empty bio fields
