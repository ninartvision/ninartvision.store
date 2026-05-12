# 🚀 QUICK DEPLOYMENT GUIDE

## Step 1: Commit Changes
```bash
cd n:\ninartvision
git add .
git commit -m "Fix: Update Sanity queries for new schema fields (gallery, status, shortDescription)"
git push origin main
```

## Step 2: Wait for Deployment
- **GitHub Pages:** Usually 1-2 minutes
- Check: https://github.com/YOUR_USERNAME/YOUR_REPO/actions

## Step 3: Clear Browser Cache
```
Hard Refresh:
- Windows: Ctrl + Shift + R
- Mac: Cmd + Shift + R

Or use Incognito mode to test
```

## Step 4: Test on Website
1. Visit an artist page
2. Check if gallery images appear
3. Verify short descriptions show
4. Test status filtering (hidden artists don't show)

## ✅ Success Indicators
- Gallery images visible
- New descriptions appear
- Changes reflect within seconds
- No console errors

## ❌ If Still Not Working
1. Check if code deployed:
   - View page source
   - Search for "v2025-02-05"
   - Should appear in JavaScript files

2. Check Sanity:
   - Are documents published (not draft)?
   - Is status = "published"?
   - Are gallery images added?

3. Check browser:
   - Open DevTools (F12)
   - Look for errors in Console
   - Check Network tab for failed requests

---

**Need help?** Check `SANITY_SYNC_FIX_COMPLETE.md` for full troubleshooting guide.
