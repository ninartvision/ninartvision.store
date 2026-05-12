# ⚡ QUICK FIX GUIDE - New Artworks Not Showing

## 🎯 **IMMEDIATE ACTIONS**

### **1. Update Artwork Status in Sanity (2 minutes)**

For EACH new artwork that should be visible:

1. Open Sanity Studio: https://ninart-vision.sanity.studio
2. Go to **Artworks** section
3. Open each new artwork
4. Find **"Status"** field (near bottom)
5. **CRITICAL:** Change from `Draft - Not visible` to `Published - Live on website`
6. Click **Publish** button (green button at bottom)
7. Verify green "Published" indicator shows

**Repeat for all new artworks.**

---

### **2. Deploy Website Code (3 minutes)**

```bash
# Navigate to website folder
cd n:\ninartvision

# Stage all changes
git add .

# Commit with message
git commit -m "Fix: Handle legacy artworks without status field"

# Push to deploy
git push origin main
```

**Wait 1-2 minutes** for GitHub Pages to rebuild.

---

### **3. Test on Website (1 minute)**

1. Go to an artist page where you added new artworks
2. **Hard refresh:** Press `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
3. Check if new artworks appear
4. If not, check browser console for errors (F12)

---

## ✅ **SUCCESS INDICATORS**

You'll know it's working when:

- ✅ New artworks appear on artist pages
- ✅ Gallery images load correctly
- ✅ No console errors
- ✅ Old artworks still visible
- ✅ Draft artworks hidden (as expected)

---

## 🔍 **DIAGNOSTIC TEST**

### **Quick Check in Sanity Vision:**

1. Open Sanity Studio
2. Go to **Vision** (Tools → Vision)
3. Paste this query:

```groq
*[_type == "artwork"] {
  _id,
  title,
  "artist": artist->name,
  status,
  "hasStatus": defined(status),
  _createdAt
} | order(_createdAt desc)[0...10]
```

4. Click **Query**

**Look for your new artworks:**
- If `hasStatus: false` → Will show (legacy)
- If `status: "published"` → Will show ✅
- If `status: "draft"` → Won't show ⚠️ (change to published!)
- If `status: "hidden"` → Won't show (correct)

---

## 🆘 **STILL NOT WORKING?**

### **Check #1: Artwork Status**
```groq
// Find artworks that are still in draft
*[_type == "artwork" && status == "draft"] {
  _id,
  title,
  "artist": artist->name
}
```

**Fix:** Change each one to "published" in Sanity Studio.

---

### **Check #2: Artist Reference**
```groq
// Find artworks with no artist assigned
*[_type == "artwork" && !defined(artist)] {
  _id,
  title,
  status
}
```

**Fix:** Assign an artist to each artwork.

---

### **Check #3: Deployment Status**
- Go to: `https://github.com/YOUR_USERNAME/ninartvision/actions`
- Check if latest workflow is green ✅
- If red ❌, click to see error

---

### **Check #4: Browser Cache**
- Try **Incognito mode** to rule out caching
- Or clear browser cache completely
- Make sure you're doing **hard refresh** (Ctrl+Shift+R)

---

## 📞 **GET HELP**

If artworks still don't appear after all steps:

1. **Check dataset:** Is artwork in "production" dataset?
2. **Check publication:** Is document published (not just saved)?
3. **Check artist slug:** Does it match the URL?
4. **Check console:** Any JavaScript errors?

**Read full guide:** [NEW_ARTWORKS_FIX.md](./NEW_ARTWORKS_FIX.md)

---

## 🎉 **AFTER IT WORKS**

**For future artworks:**

1. Create artwork in Sanity
2. Fill all fields (especially Artist)
3. **Set Status to "Published"** ← Don't forget!
4. Click Publish
5. Wait ~30 seconds
6. Artwork appears on website ✨

No deployment needed for content changes - only for code changes!

---

*Quick Reference - Keep this handy when adding artworks*
