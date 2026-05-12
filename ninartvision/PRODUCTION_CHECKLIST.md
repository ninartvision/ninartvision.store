# 🚀 PRODUCTION DEPLOYMENT CHECKLIST

## ✅ Pre-Deployment Validation

### 1. **GROQ Query Consistency**
- [ ] All artist queries include: `_id, name, avatar, bio_en, bio_ka, about, style, seoTitle, seoDescription, slug`
- [ ] All artwork queries include: `_id, title, price, size, medium, year, status, desc, img, photos`
- [ ] No deprecated or removed fields in queries
- [ ] All queries use parameterized values for user input (prevent injection)

### 2. **Field Usage Validation**
- [ ] Every fetched field is used in rendering OR documented as reserved for future use
- [ ] Every rendered field is fetched in GROQ query
- [ ] No undefined/null field access without defensive checks

### 3. **Defensive Rendering Checks**
- [ ] All `artist?.field` uses optional chaining
- [ ] All array operations check `.length` before `.map()`, `.join()`, `.filter()`
- [ ] All image src attributes have `onerror` handlers or fallback logic
- [ ] All text content has fallback values (e.g., `|| 'Default text'`)

### 4. **Bio/About Rendering**
- [ ] Bio text rendered from ONE function only (getBioText)
- [ ] Priority order: bio_en/bio_ka → about → hardcoded fallback
- [ ] Language switcher updates via single updateBioText function
- [ ] No conflicting DOM writes to same element

### 5. **SEO Meta Tags**
- [ ] Page title updated dynamically from seoTitle or artist name
- [ ] Meta description updated from seoDescription
- [ ] Open Graph tags populated (og:title, og:description, og:image, og:url)
- [ ] Twitter Card tags populated
- [ ] All tags have fallback values if Sanity data is missing

### 6. **Error Handling**
- [ ] All async functions wrapped in try-catch
- [ ] User-friendly error messages displayed on failure
- [ ] Console errors include context (function name, query)
- [ ] Network errors don't break page rendering

### 7. **Performance**
- [ ] Images use lazy loading (`loading="lazy"`)
- [ ] GROQ queries limit results with `[0...N]` when appropriate
- [ ] No unnecessary re-fetching of data
- [ ] No blocking async operations without loading states

### 8. **Browser Compatibility**
- [ ] Tested in Chrome, Firefox, Safari, Edge
- [ ] Console clear of errors in all browsers
- [ ] Optional chaining (`?.`) and nullish coalescing (`??`) supported (ES2020+)
- [ ] Fetch API polyfill included if supporting older browsers

### 9. **Data Consistency**
- [ ] Artist slug in URL matches Sanity artist slug
- [ ] Artwork references point to valid artist documents
- [ ] Image CDN URLs are valid and accessible
- [ ] All required Sanity fields exist in CMS

### 10. **Code Quality**
- [ ] No hardcoded API URLs (use config constants)
- [ ] No duplicate code (use utility functions)
- [ ] Functions have single responsibility
- [ ] Variable names are descriptive

---

## 🔍 Quick Test Script

Run this in browser console on any artist page:

```javascript
// Test 1: Artist data loaded
console.log('Artist data:', window.CURRENT_ARTIST);

// Test 2: Bio text present
const bioEl = document.getElementById('aboutText');
console.log('Bio text:', bioEl?.textContent);

// Test 3: Artworks loaded
const artworkCards = document.querySelectorAll('.shop-item');
console.log('Artworks loaded:', artworkCards.length);

// Test 4: Images loaded
const images = document.querySelectorAll('.shop-item img');
const brokenImages = Array.from(images).filter(img => !img.complete || img.naturalHeight === 0);
console.log('Broken images:', brokenImages.length);

// Test 5: SEO tags
console.log('Page title:', document.title);
console.log('Meta description:', document.querySelector('meta[name="description"]')?.content);
console.log('OG image:', document.querySelector('meta[property="og:image"]')?.content);
```

---

## 🚨 Critical Issues to Prevent

### ❌ Never Do This:
```javascript
// Bad: No defensive check
avatar.src = artist.avatar;

// Bad: Direct array access without check
const firstPhoto = photos[0];

// Bad: Multiple DOM writes to same element
aboutTextEl.textContent = artist.about;
// ... later...
aboutTextEl.textContent = getBioText('en');

// Bad: Hardcoded API URLs
fetch('https://8t5h923j.api.sanity.io/...')
```

### ✅ Always Do This:
```javascript
// Good: Defensive check
if (avatar && artist?.avatar) {
  avatar.src = artist.avatar;
}

// Good: Array check
const firstPhoto = photos?.length ? photos[0] : defaultImage;

// Good: Single source of truth
function updateBioText(lang) {
  aboutTextEl.textContent = getBioText(lang);
}

// Good: Config constants
const SANITY_API_BASE = 'https://8t5h923j.api.sanity.io/v2024-01-01/data/query/production';
```

---

## 📊 File-Specific Checklist

### artist-shop.js
- [ ] Fetches artist from Sanity (not legacy window.ARTISTS)
- [ ] Bio rendered via getBioText() only
- [ ] Language switcher calls updateBioText()
- [ ] No duplicate aboutText writes
- [ ] SEO meta tags updated (if applicable to this page)

### artist.js
- [ ] Fetches artist with full projection
- [ ] Renders bio via renderBio()
- [ ] Updates all SEO meta tags via updateSEOTags()
- [ ] Defensive rendering for avatar, name, bio
- [ ] Stores artist in window.CURRENT_ARTIST

### sanity-client.js
- [ ] All functions use standard projections
- [ ] Error handling in all functions
- [ ] Returns empty arrays/null on failure (not undefined)
- [ ] API base URL in config constant

---

## 🎯 Before Git Commit

```bash
# 1. Check for console.log/debugger
grep -r "console.log" --exclude-dir=node_modules

# 2. Check for TODO/FIXME
grep -r "TODO\|FIXME" --exclude-dir=node_modules

# 3. Validate no hardcoded values
grep -r "8t5h923j" --exclude=sanity-client.js --exclude=sanity-queries.js

# 4. Check for undefined/null access
grep -r "\.\w\+\s*=" *.js | grep -v "?."
```

---

## 📋 Post-Deployment Checks

### Immediately After Deploy:
1. [ ] Visit 3+ artist pages and verify bio displays
2. [ ] Toggle language switcher (EN/KA)
3. [ ] Check browser console for errors
4. [ ] Verify images load correctly
5. [ ] Test filter buttons (ALL/SALE/SOLD)
6. [ ] View page source and verify meta tags updated

### Within 24 Hours:
1. [ ] Monitor error logs/analytics
2. [ ] Check Google Search Console for crawl errors
3. [ ] Verify social media previews (Facebook, Twitter)
4. [ ] Test on mobile devices

---

## 🛠️ Emergency Rollback Plan

If critical issue found in production:

```bash
# 1. Identify last working commit
git log --oneline

# 2. Revert to safe commit
git revert <commit-hash>

# 3. Force push (if already deployed)
git push origin main --force

# 4. Clear CDN cache if applicable
```

---

## 📞 Support Contacts

- **Sanity CMS Issues**: https://www.sanity.io/help
- **CMS Dashboard**: https://sanity.io/manage
- **API Documentation**: https://www.sanity.io/docs/query-cheat-sheet

---

**Last Updated**: February 8, 2026  
**Version**: 2.0
