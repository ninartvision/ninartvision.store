# 🔄 Sanity Changes Not Appearing - Complete Troubleshooting Guide

## Current Fix Applied ✅

**Changed `useCdn: false` in sanity-client.js** - This disables CDN caching for immediate updates.

---

## 📋 Checklist: Why Changes Don't Appear

### 1. ✅ **Publish Your Changes in Sanity Studio**

**MOST COMMON ISSUE** - Draft documents don't appear in queries!

#### Steps:
1. Open Sanity Studio
2. Find your edited document
3. Look for **green dot** or "Draft" label
4. Click **"Publish"** button (top-right)
5. Wait 5 seconds, then refresh your site

**Test Command:**
```javascript
// In browser console - check if content is published
const query = '*[_type == "artist"][0]{_id, _rev}';
const url = `https://8t5h923j.api.sanity.io/v2024-01-01/data/query/production?query=${encodeURIComponent(query)}`;
fetch(url).then(r => r.json()).then(d => console.log(d.result));
```

---

### 2. 🌐 **CDN Caching (Fixed for you)**

#### Problem:
```javascript
useCdn: true  // ⚠️ Caches responses for up to 30 minutes
```

#### Solution Applied:
```javascript
useCdn: false  // ✅ Real-time data, no caching
```

#### Production Alternative (Better Performance):
Keep `useCdn: true` but add cache-busting:
```javascript
async function fetchArtistsFromSanity(limit = null, featuredOnly = false) {
  const timestamp = Date.now();
  const url = `https://8t5h923j.apicdn.sanity.io/...&cacheBust=${timestamp}`;
  // ... rest of code
}
```

Or use Sanity webhooks to trigger rebuilds (see below).

---

### 3. 🗂️ **Browser Cache**

Your deployed site may be serving cached files.

#### Quick Fix:
```
Force refresh: Ctrl + Shift + R (Windows) or Cmd + Shift + R (Mac)
```

#### Permanent Fix:
Add cache-busting to your HTML:

```html
<!-- index.html -->
<script src="sanity-client.js?v=2"></script>
<script src="artists/artist-shop.js?v=2"></script>
```

Or use build timestamps:
```html
<script src="sanity-client.js?v=<?= time() ?>"></script>
```

---

### 4. 📦 **Deployment Platform Caching**

If using **GitHub Pages, Netlify, or Vercel**:

#### GitHub Pages:
- Changes can take 2-10 minutes to deploy
- Check: https://github.com/YOUR-USERNAME/ninartvision/actions

#### Netlify:
```bash
# In your project settings, set cache headers
# netlify.toml
[[headers]]
  for = "/*.js"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
```

#### Vercel:
```json
// vercel.json
{
  "headers": [
    {
      "source": "/(.*).js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    }
  ]
}
```

---

## 🚀 Next.js + Sanity Specific Issues

If you're planning to migrate or have a separate Next.js frontend:

### Issue 1: Static Generation Without Revalidation

#### ❌ Problem:
```javascript
// pages/artists.js
export async function getStaticProps() {
  const artists = await sanityClient.fetch(`*[_type == "artist"]`);
  return {
    props: { artists }
    // Missing: revalidate!
  };
}
```

#### ✅ Solution - ISR (Incremental Static Regeneration):
```javascript
export async function getStaticProps() {
  const artists = await sanityClient.fetch(`*[_type == "artist"]`);
  return {
    props: { artists },
    revalidate: 60  // Regenerate every 60 seconds
  };
}
```

---

### Issue 2: App Router Over-Caching

#### ❌ Problem (Next.js 13+ App Router):
```javascript
// app/artists/page.tsx
export default async function ArtistsPage() {
  const artists = await sanityClient.fetch(`*[_type == "artist"]`, {
    cache: 'force-cache'  // ⚠️ Never updates!
  });
}
```

#### ✅ Solution 1 - No Cache:
```javascript
export const revalidate = 0;  // Disable cache

export default async function ArtistsPage() {
  const artists = await sanityClient.fetch(`*[_type == "artist"]`);
  return <ArtistsList artists={artists} />;
}
```

#### ✅ Solution 2 - Time-Based Revalidation:
```javascript
export const revalidate = 60;  // Revalidate every 60 seconds

export default async function ArtistsPage() {
  const artists = await sanityClient.fetch(`*[_type == "artist"]`);
  return <ArtistsList artists={artists} />;
}
```

#### ✅ Solution 3 - On-Demand Revalidation (Best):
```javascript
// app/api/revalidate/route.ts
import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  
  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
  }

  try {
    revalidatePath('/artists');
    revalidatePath('/');
    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (err) {
    return NextResponse.json({ message: 'Error revalidating' }, { status: 500 });
  }
}
```

---

### Issue 3: Sanity Client Configuration

#### ✅ Correct Setup (@sanity/client):
```javascript
// lib/sanity.client.ts
import { createClient } from '@sanity/client';

export const client = createClient({
  projectId: '8t5h923j',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: true,  // OK for Next.js with ISR/webhooks
  perspective: 'published',  // Only fetch published documents
});
```

---

## 🪝 **Best Solution: Sanity Webhooks → Auto Rebuild**

This triggers your site to rebuild whenever you publish in Sanity.

### Step 1: Create Deploy Hook

#### For Vercel:
1. Go to Vercel Dashboard → Your Project → Settings → Git
2. Scroll to "Deploy Hooks"
3. Create new hook: `sanity-publish`
4. Copy the URL (e.g., `https://api.vercel.com/v1/integrations/deploy/...`)

#### For Netlify:
1. Go to Site Settings → Build & Deploy → Build Hooks
2. Add build hook: `Sanity Publish`
3. Copy the URL

### Step 2: Add Webhook in Sanity Studio

1. Go to https://sanity.io/manage
2. Select your project (`8t5h923j`)
3. Go to **API** → **Webhooks**
4. Click **"Create webhook"**

**Configuration:**
```
Name: Deploy Production Site
URL: [Your Vercel/Netlify deploy hook URL]
Dataset: production
Trigger on: Create, Update, Delete
Filter: _type in ["artist", "artwork"]  (optional - only rebuild for specific types)
HTTP method: POST
API version: v2024-01-01
```

5. Click **"Save"**

### Step 3: Test Webhook

1. Edit an artist in Sanity Studio
2. Click **Publish**
3. Webhook fires → Deploy starts
4. Wait 1-2 minutes for build
5. Your live site now shows the changes!

---

## 🧪 Testing & Verification

### Test 1: Check Sanity API Directly
```javascript
// Run in browser console
const query = '*[_type == "artist"]{name, _updatedAt}';
const url = `https://8t5h923j.api.sanity.io/v2024-01-01/data/query/production?query=${encodeURIComponent(query)}`;

fetch(url)
  .then(r => r.json())
  .then(d => {
    console.log('Artists from Sanity:', d.result);
    console.log('Last updated:', d.result[0]?._updatedAt);
  });
```

### Test 2: Check CDN vs API
```javascript
// CDN (cached)
const cdnUrl = 'https://8t5h923j.apicdn.sanity.io/v2024-01-01/data/query/production?query=*[_type=="artist"][0]{_updatedAt}';

// Direct API (real-time)
const apiUrl = 'https://8t5h923j.api.sanity.io/v2024-01-01/data/query/production?query=*[_type=="artist"][0]{_updatedAt}';

Promise.all([fetch(cdnUrl), fetch(apiUrl)])
  .then(responses => Promise.all(responses.map(r => r.json())))
  .then(([cdnData, apiData]) => {
    console.log('CDN updated at:', cdnData.result?._updatedAt);
    console.log('API updated at:', apiData.result?._updatedAt);
    console.log('Match:', cdnData.result?._updatedAt === apiData.result?._updatedAt ? '✅' : '❌ CDN is cached!');
  });
```

### Test 3: Clear All Caches
```bash
# 1. Force refresh browser
Ctrl + Shift + R

# 2. Clear Service Workers (if any)
# Chrome DevTools → Application → Service Workers → Unregister

# 3. Clear browser cache
# Chrome → Settings → Privacy → Clear browsing data

# 4. Check incognito mode
# If it works in incognito, it's a cache issue
```

---

## 📊 Quick Decision Matrix

| Scenario | Solution | Update Speed |
|----------|----------|--------------|
| **Development** | `useCdn: false` | Instant ⚡ |
| **Production (Simple)** | `useCdn: false` | Instant ⚡ (slower globally) |
| **Production (Optimized)** | `useCdn: true` + ISR | 1-60 seconds |
| **Production (Best)** | `useCdn: true` + Webhooks | 1-2 minutes 🏆 |

---

## 🎯 Recommended Setup for Your Project

### Current (Vanilla JS):
**Already Applied:** `useCdn: false` ✅

**Next Step:** Add Vercel/Netlify webhook (5 min setup, instant updates forever)

### If Migrating to Next.js:
```javascript
// lib/sanity.client.ts
export const client = createClient({
  projectId: '8t5h923j',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
  perspective: 'published',
});

// pages/artists.js
export async function getStaticProps() {
  const artists = await client.fetch(`*[_type == "artist"]`);
  return {
    props: { artists },
    revalidate: 60  // ISR
  };
}
```

**Plus:** Sanity webhook → Vercel auto-deploy

---

## 🔗 Useful Resources

- [Sanity CDN Documentation](https://www.sanity.io/docs/api-cdn)
- [Next.js ISR Guide](https://nextjs.org/docs/basic-features/data-fetching/incremental-static-regeneration)
- [Sanity Webhooks Setup](https://www.sanity.io/docs/webhooks)
- [Vercel Deploy Hooks](https://vercel.com/docs/concepts/git/deploy-hooks)

---

## ✅ Final Checklist

- [ ] Published document in Sanity Studio (not just saved draft)
- [ ] Set `useCdn: false` for instant updates (already done ✅)
- [ ] Force refresh browser (Ctrl + Shift + R)
- [ ] Wait 2-5 minutes for deployment platform
- [ ] Check Sanity API directly (test script above)
- [ ] Set up webhooks for automated rebuilds (recommended)

---

**Need More Help?**
Run this diagnostic in your browser console:
```javascript
console.log('🔍 Sanity Diagnostic:');
console.log('Project:', '8t5h923j');
console.log('Using CDN:', window.SANITY_CONFIG?.useCdn ?? 'unknown');
console.log('Browser cache:', navigator.onLine ? 'online' : 'offline');
console.log('Test API:', 'https://8t5h923j.api.sanity.io/v2024-01-01/data/query/production');
```
