# 📋 SANITY SCHEMA QUICK REFERENCE

> Print this page and keep it visible at your desk

---

## 🎯 FIELD PRIORITY LEVELS

| Priority | When to Include | Artist Examples |
|----------|----------------|----------------|
| ⭐ **CRITICAL** | Always, every query | `_id`, `name`, `slug` |
| 🔥 **HIGH** | Most queries, user-facing | `image`, `bio`, `style` |
| 🟡 **MEDIUM** | Detail views, optional lists | `featured` |
| 🟢 **LOW** | Specific contexts only | `_createdAt`, `price` |

---

## ✅ NEW FIELD CHECKLIST

```
When adding ANY new field to Sanity:

Schema Level:
☐ Add to schema file with type
☐ Add clear description
☐ Add placeholder example
☐ Set required/optional correctly
☐ Add validation if required
☐ Add initialValue (booleans/numbers)
☐ Add // FRONTEND: PRIORITY comment
☐ Add // Query as: ... example

Standards Level:
☐ Add to _standards/fieldStandards.ts
☐ Set priority level
☐ Update GROQ_PROJECTIONS
☐ Document when to include/exclude

Frontend Level:
☐ Update ALL relevant GROQ queries
☐ Test in Sanity Vision
☐ Update rendering functions
☐ Add null/undefined checks
☐ Test with empty values

Validation Level:
☐ Add to validation script
☐ Run: npm run validate:sanity
☐ Fix any errors

Deploy:
☐ Deploy schema: npx sanity schema deploy
☐ Deploy frontend changes
☐ Monitor error logs for 24h
```

---

## 🔍 STANDARD GROQ PROJECTIONS

### Artist Queries

**Minimal (dropdowns, selects):**
```groq
_id, name
```

**Card View:**
```groq
_id,
name,
"slug": slug.current,
style,
featured,
image{asset->{_id, url, metadata{lqip, dimensions}}, alt}
```

**Card with Bio:**
```groq
_id,
name,
"slug": slug.current,
bio,
style,
featured,
image{asset->{_id, url, metadata{lqip, dimensions}}, alt}
```

**Detail Page:**
```groq
_id,
name,
"slug": slug.current,
bio,
style,
featured,
image{
  asset->{_id, url, metadata{lqip, dimensions, palette}},
  alt,
  hotspot
}
```

---

### Artwork Queries

**Gallery Grid:**
```groq
_id,
title,
year,
image{asset->{_id, url, metadata{lqip, dimensions}}, alt},
artist->{_id, name}
```

**Modal View:**
```groq
_id,
title,
year,
medium,
dimensions,
description,
image{asset->{_id, url, metadata{lqip, dimensions}}, alt},
images[]{asset->{_id, url, metadata{lqip, dimensions}}, alt, _key},
artist->{_id, name, "slug": slug.current}
```
⚠️ **NO SLUG in modal queries!**

**Detail Page:**
```groq
_id,
title,
"slug": slug.current,
year,
medium,
dimensions,
description,
price,
status,
featured,
image{asset->{_id, url, metadata{lqip, dimensions}}, alt},
images[]{asset->{_id, url, metadata{lqip, dimensions}}, alt, _key},
artist->{_id, name, "slug": slug.current, bio, image{asset->{url}, alt}}
```

---

## 🚨 COMMON MISTAKES TO AVOID

| ❌ Don't | ✅ Do |
|---------|------|
| `artist_name` | `artistName` |
| `isFeatured` | `featured` |
| `imgUrl` | `image` |
| Missing description | Always add description |
| No validation on required | Add `.required()` |
| Boolean without initialValue | Set `initialValue: false` |
| Image without alt | Require alt text |
| No frontend comment | Add `// FRONTEND: PRIORITY` |

---

## 🛡️ SAFEGUARD SYSTEM

```
Layer 1: Schema Comments      → Guides developers
Layer 2: Field Standards      → Centralized reference
Layer 3: Validation Script    → Pre-deploy checks
Layer 4: Runtime Validation   → Production safety
Layer 5: TypeScript           → Compile-time errors
Layer 6: Studio Warnings      → Editor guidance
Layer 7: Monitoring           → Production tracking
```

**Run before every deployment:**
```bash
npm run validate:sanity
```

---

## 📝 FIELD NAMING CONVENTIONS

**General Rules:**
- Use camelCase: `artistName` ✅
- No underscores: `artist_name` ❌
- No prefixes: `strTitle`, `boolFeatured` ❌
- Descriptive names: `description` not `desc` ✅

**Standard Names (use these exactly):**
- `slug` (not urlSlug, permalink)
- `image` (not picture, photo)
- `images` (not gallery, imageArray)
- `title` (not heading, name)
- `description` (not desc, content)
- `featured` (not isFeatured, highlight)
- `publishedAt` (not publishDate, pubDate)

---

## 🎓 REQUIRED VS OPTIONAL

**Make Required When:**
- Needed for unique identification
- Needed for URL/routing
- Core to document purpose
- Business logic depends on it

**Make Optional When:**
- Enhancement to content
- May not apply to all entries
- Can be added later
- Not needed for minimum viability

**Examples:**
- Required: `title`, `name`, `slug`, `artist`
- Optional: `bio`, `style`, `year`, `price`

---

## 🔎 DEBUGGING MISSING FIELDS

**Browser Console Check:**
```javascript
// Check if field is in data
console.log('Artist data:', artistsData[0]);
console.log('Has bio?', 'bio' in artistsData[0]);
console.log('Has style?', 'style' in artistsData[0]);
```

**Sanity Vision Check:**
1. Go to Sanity Studio → Vision
2. Paste your GROQ query
3. Click "Execute"
4. Expand first result
5. Verify all expected fields present

**Network Tab Check:**
1. Open DevTools → Network
2. Find Sanity API request
3. Click → Preview
4. Check returned fields

---

## 📊 KEY METRICS

Track monthly:
- [ ] Field Coverage: 100% of HIGH/CRITICAL fields in queries
- [ ] Validation: All pre-deploy checks passing
- [ ] Production Errors: 0 missing field errors
- [ ] Documentation: All new fields have priority comments

---

## 🚀 QUICK COMMANDS

```bash
# Test query in terminal
sanity exec scripts/test-query.js

# Deploy schema changes
npx sanity schema deploy

# Run validation
npm run validate:sanity

# Check for errors
npm run lint
```

---

## 📞 HELP & RESOURCES

**Files to Reference:**
- `_standards/fieldStandards.ts` - Standard projections
- `SANITY_SCHEMA_BEST_PRACTICES.md` - Complete guide
- `SCHEMA_FRONTEND_SAFEGUARDS.md` - Safeguard system
- `SANITY_SCHEMA_REVIEW_SUMMARY.md` - Executive summary

**When Stuck:**
1. Check inline schema comments
2. Review standard projections
3. Run validation script
4. Check console for errors
5. Review best practices doc

---

**Last Updated:** 2026-02-08  
**Maintain This Document:** Update when standards change
