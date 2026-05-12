# 🚨 NEW ARTWORKS NOT APPEARING - SOLUTION

## 🔍 **ROOT CAUSE IDENTIFIED**

Your new artworks have `status: "draft"` (default value from schema), which was blocking them from appearing on the website.

**The Query Was:**
```javascript
// OLD - Only showed artworks WITH status "published" or "sold"
*[_type == "artwork" && status in ["published", "sold"]]
```

**Why Old Artworks Showed:**
- Created before `status` field existed
- Have `status: null` or `status: undefined`
- Were NOT caught by the filter

**Why New Artworks Didn't Show:**
- Have `status: "draft"` (schema default)
- Were BLOCKED by the strict filter

---

## ✅ **FIXES APPLIED**

### **1. Updated Query Filter (3 files)**
**Files Fixed:**
- `n:\ninartvision\artists\artist.js`
- `n:\ninartvision\sanity-client.js`
- `n:\ninartvision\sanity-queries.js`

**New Filter:**
```javascript
// NEW - Shows artworks with NO status (legacy) OR published/sold
(!defined(status) || status in ["published", "sold"])
```

This handles:
- ✅ **Legacy artworks** with no status field → show them
- ✅ **New artworks** with `status: "published"` → show them
- ✅ **New artworks** with `status: "sold"` → show them  
- ❌ **New artworks** with `status: "draft"` → hide them
- ❌ **New artworks** with `status: "hidden"` → hide them

---

## 🎯 **WHAT YOU NEED TO DO NOW**

### **Step 1: Update Status in Sanity Studio**

For each new artwork that should appear on the website:

1. Open the artwork in Sanity Studio
2. Scroll to **"Status"** field
3. Change from `Draft - Not visible` to:
   - **`Published - Live on website`** (for artworks for sale)
   - **`Sold - Marked as sold`** (for sold artworks)
4. Click **Publish**

### **Step 2: Verify Artist Reference**

Make sure each artwork has an artist selected:

1. Open the artwork in Sanity Studio
2. Check the **"Artist"** field is filled
3. Verify it links to the correct artist
4. Click **Publish**

### **Step 3: Deploy Website**

```bash
cd n:\ninartvision
git add .
git commit -m "Fix: Update artwork queries to handle legacy and new status fields"
git push origin main
```

Then:
1. Wait 1-2 minutes for deployment
2. Hard refresh: **Ctrl + Shift + R**
3. Visit artist pages
4. **New artworks should now appear!**

---

## 🧪 **DIAGNOSTIC QUERIES**

Run these in Sanity Vision (Tools → Vision) to check your data:

### **Check All Artworks and Their Status:**
```groq
*[_type == "artwork"] {
  _id,
  title,
  "artistName": artist->name,
  status,
  "hasStatus": defined(status)
} | order(_createdAt desc)
```

**What to look for:**
- `hasStatus: false` = Old artwork (no status field) → **will show on website**
- `hasStatus: true, status: "published"` → **will show**
- `hasStatus: true, status: "sold"` → **will show**
- `hasStatus: true, status: "draft"` → **will NOT show** ⚠️
- `hasStatus: true, status: "hidden"` → **will NOT show** ⚠️

### **Find Draft Artworks (Not Visible):**
```groq
*[_type == "artwork" && status == "draft"] {
  _id,
  title,
  "artistName": artist->name,
  status
}
```

**Action:** Change these to "published" to make them visible.

### **Find Artworks with Missing Artist:**
```groq
*[_type == "artwork" && !defined(artist)] {
  _id,
  title,
  status
}
```

**Action:** Add artist reference to these artworks.

### **Test Query for Specific Artist:**
```groq
// Replace "nini-mzhavia" with your artist's slug
*[_type == "artwork" && artist->slug.current == "nini-mzhavia" && (!defined(status) || status in ["published", "sold"])] {
  _id,
  title,
  status,
  "hasStatus": defined(status)
} | order(_createdAt desc)
```

**What to expect:** This should return ALL artworks for that artist that will appear on the website.

---

## 📋 **CHECKLIST FOR NEW ARTWORKS**

Before expecting an artwork to appear on the website:

- ✅ **Document is PUBLISHED** (not just saved as draft)
- ✅ **Artist field is filled** (linked to an artist)
- ✅ **Status is "published" or "sold"** (not "draft" or "hidden")
- ✅ **Artist has correct slug** (matches URL)
- ✅ **Website is deployed** (latest code is live)
- ✅ **Browser cache cleared** (hard refresh: Ctrl+Shift+R)

---

## 🔄 **MIGRATION STRATEGY (Optional)**

If you want to update all existing artworks to have proper status:

### **Option A: Bulk Update in Sanity**

Run in Sanity CLI or use Sanity Mutations API:

```javascript
// Set all artworks without status to "published"
sanity documents query "*[_type == 'artwork' && !defined(status)]" | \
sanity documents create --replace \
  --set 'status="published"'
```

### **Option B: Manual Update**

1. Go to Sanity Studio
2. Filter artworks by "No status"
3. Open each one
4. Set status to "published" or "sold"
5. Publish

---

## 🚀 **EXPECTED BEHAVIOR AFTER FIX**

### **Before:**
- Old artworks (no status) ✅ Visible
- New artworks (status: draft) ❌ Hidden
- New artworks (status: published) ❌ Hidden (due to bug)

### **After:**
- Old artworks (no status) ✅ Visible
- New artworks (status: draft) ❌ Hidden (correct)
- New artworks (status: published) ✅ **Visible** 🎉
- New artworks (status: sold) ✅ **Visible** 🎉
- New artworks (status: hidden) ❌ Hidden (correct)

---

## 💡 **BEST PRACTICES GOING FORWARD**

### **When Creating New Artworks:**

1. **Fill all required fields:**
   - Title ✅
   - Artist ✅
   - Image ✅
   - Status ✅

2. **Set status appropriately:**
   - Start as "Draft" while working
   - Change to "Published" when ready to go live
   - Change to "Sold" when artwork sells
   - Use "Hidden" to temporarily hide

3. **Publish the document:**
   - Click **Publish** button (not just Save)
   - Check green "Published" indicator

4. **Verify on website:**
   - Wait ~1 minute (no CDN cache)
   - Hard refresh browser
   - Check artist page

---

## 🆘 **TROUBLESHOOTING**

### **Issue: New artwork still not showing after setting status to "published"**

**Checklist:**
1. Did you click **Publish** (not just Save)?
2. Is the artist reference filled?
3. Does the artist slug match the URL?
4. Did you deploy the updated code?
5. Did you hard refresh the browser?
6. Is the artwork in the correct dataset (production)?

**Test:**
```javascript
// Open browser console on artist page
console.log('Artist slug:', new URLSearchParams(location.search).get('artist'))

// Then run this query in Sanity Vision with that slug:
// *[_type == "artwork" && artist->slug.current == "YOUR-SLUG-HERE" && (!defined(status) || status in ["published", "sold"])]
```

### **Issue: Old artworks disappeared**

**Unlikely** - the fix specifically includes artworks with no status field.

**Check:**
```groq
// In Sanity Vision
*[_type == "artwork" && !defined(status)] {
  _id,
  title,
  "artistName": artist->name
}
```

If this returns results, old artworks should still show.

---

## 📊 **SUMMARY**

**Problem:**
- Strict status filter blocked new artworks with `status: "draft"`

**Solution:**
- Updated query to show: legacy artworks (no status) OR published/sold artworks
- Documented workflow for setting artwork status

**Action Required:**
1. ✅ Set new artworks to `status: "published"` in Sanity
2. ✅ Deploy updated website code
3. ✅ Hard refresh browser

**Result:**
- ✅ Old artworks continue to show
- ✅ New published artworks now show
- ✅ Draft artworks correctly hidden
- ✅ Full control via status field

---

*Last Updated: 2026-02-08*
*Fix Version: 2.0 - Legacy Compatible Status Filter*
