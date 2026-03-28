---
name: js-syntax-debug
description: 'Diagnose and fix "Uncaught SyntaxError: Unexpected identifier" and broken console.log statements in Vanilla JS + Sanity CMS sites. Use for: fixing unquoted bracket identifiers in console.log (e.g. [shop] without quotes), validating JS file syntax, verifying renderAllItems receives correct Sanity data, adding safe debug logs. Triggers: SyntaxError, unexpected identifier, console.log broken, shop-render error, renderAllItems not called, Sanity data not rendering, fix JS logging, debug shop page.'
argument-hint: 'Describe the error or file to fix (e.g. "Uncaught SyntaxError in shop-render.js" or "shop page not rendering artworks")'
---

# JS Syntax Debug — Vanilla JS + Sanity CMS

## When to Use

- Browser console shows `Uncaught SyntaxError: Unexpected identifier`
- `console.log` calls have unquoted `[tag]` prefixes like `console.log([shop] items)` instead of `console.log('[shop] items')`
- `renderAllItems()` receives `null` / `undefined` / 0 items
- Shop page or gallery doesn't render — silent fail with no visible error
- Sanity data is fetched but not passed correctly to the render function

---

## Step 1 — Scan for Unquoted Bracket Identifiers

Search all non-minified JS files for `console.log` calls where the first argument starts with `[` but is **not** a string literal:

```
grep pattern: console\.log\(\s*\[(?!['"`])
```

**Tool**: `grep_search` with `isRegexp: true` across `**/*.js` (exclude `*.min.js`)

Common bad patterns that cause `Unexpected identifier`:
```js
// ❌ BAD — [shop] is parsed as array index, not string
console.log([shop] artworks loaded);
console.log([shop-render] renderAllItems called);

// ✅ GOOD — wrap in single quotes, double quotes, or backticks
console.log('[shop] artworks loaded');
console.log('[shop-render] renderAllItems called');
console.log(`[shop-render] renderAllItems called with ${items.length} items`);
```

---

## Step 2 — Validate Syntax with Node

Run Node's built-in syntax checker on every target file:

```powershell
node --check "path/to/sanity-client.js"
node --check "path/to/sale/shop-render.js"
node --check "path/to/js/homeShopPreview.js"
```

- No output = no syntax errors ✅
- Any output = file path + line number of the error ❌

For this project, the three critical files are:
| File | Role |
|------|------|
| `sanity-client.js` | Fetch functions: `fetchShopArtworks`, `fetchFeaturedArtworks`, `fetchAllArtworks` |
| `sale/shop-render.js` | `renderAllItems()`, status filter, boot sequence |
| `js/homeShopPreview.js` | Home page shop preview widget |

---

## Step 3 — Fix Broken console.log Statements

### Pattern: Tag prefix not quoted
```js
// Before
console.log([shop] Sanity returned, result.length, artworks);

// After
console.log('[shop] Sanity returned', result.length, 'artworks');
```

### Pattern: Multi-word tag with hyphen
```js
// Before (hyphen causes "Unexpected identifier" — parsed as subtraction)
console.log([shop-render] renderAllItems called);

// After
console.log('[shop-render] renderAllItems called');
```

### Safe debug log templates
Add these at key data-flow checkpoints:

**In `fetchShopArtworks` (sanity-client.js), after receiving results:**
```js
console.log('[shop] Sanity returned', result.length, 'artworks total');
```

**In `renderAllItems` (shop-render.js), first line of function:**
```js
console.log('[shop-render] renderAllItems called with', artworksData?.length ?? 0, 'items');
```

**In the DOMContentLoaded boot of shop-render.js, after awaiting fetch:**
```js
console.log('[shop-render] artworks received:', artworks?.length, artworks);
```

---

## Step 4 — Verify renderAllItems Data Flow

Check that data flows correctly from Sanity → render function:

### Check 1: `fetchShopArtworks` is exposed on `window`

In `sanity-client.js`, the function must be accessible globally:
```js
// Either defined at top level (no wrapping IIFE) — ✅ already global
async function fetchShopArtworks(limit = null) { ... }

// Or explicitly exported
window.fetchShopArtworks = fetchShopArtworks;
```

### Check 2: `shop-render.js` calls the right function

In the DOMContentLoaded handler:
```js
if (typeof window.fetchShopArtworks === 'function') {
  artworks = await window.fetchShopArtworks();
}
renderAllItems(artworks);  // must receive the array, not null
```

### Check 3: Script load order in HTML

`sanity-client.js` must load **before** `shop-render.js`:
```html
<script src="../sanity-client.js"></script>  <!-- defines fetchShopArtworks -->
<script src="shop-render.js"></script>       <!-- uses it -->
```

### Check 4: renderAllItems guard

`renderAllItems` should handle null/empty gracefully:
```js
function renderAllItems(artworksData) {
  if (!artworksData || !artworksData.length) {
    grid.innerHTML = '<p class="muted">No artworks available.</p>';
    return;
  }
  // ... render loop
}
```

---

## Step 5 — Verify in Browser

1. Open DevTools → **Console** tab
2. Hard-refresh (Ctrl+Shift+R / Cmd+Shift+R)
3. Look for the log sequence:
   ```
   [shop] Sanity returned N artworks total
   [shop-render] artworks received: N [...]
   [shop-render] renderAllItems called with N items
   ```
4. If N is 0 at `[shop] Sanity returned` → Sanity query problem (check GROQ, dataset, projectId)
5. If N > 0 at `[shop] Sanity returned` but 0 at `renderAllItems` → data not passed correctly
6. If N > 0 at `renderAllItems` but grid is empty → check `normalize()` function, `showInShop` filter, or status mismatch

---

## Rules

- **Do NOT** change HTML structure, CSS, or design — only fix JS errors and logging
- **Do NOT** change `.min.js` files by hand — those are build artifacts; fix the source then re-minify
- **Do NOT** add fallback to `window.ARTWORKS` in shop-render.js — it contains all artists, not just Nini Mzhavia
- Always test with cache bypass (`CACHE_BYPASS = true` in `sanity-client.js`) during debugging
- After fixing, reset `CACHE_BYPASS` to `false` to re-enable 6-minute LocalStorage cache

---

## Quick Reference: This Project's Sanity Config

```js
const SANITY_CONFIG = {
  projectId: '8t5h923j',
  dataset: 'production',
  apiVersion: '2025-02-05',
  useCdn: true,
  perspective: 'published'
};
```

GROQ query URL pattern:
```
https://8t5h923j.apicdn.sanity.io/v2025-02-05/data/query/production?query=<encoded>
```
