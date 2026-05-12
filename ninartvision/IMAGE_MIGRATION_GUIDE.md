# Image Migration Guide

This guide will help you upload all existing artwork images from your local filesystem to Sanity.

## Overview

Currently, **37 artworks have been created and published in Sanity**, but they don't have images attached yet. This script will:

1. ✅ Upload all main artwork images (`img` field from data.js)
2. ✅ Upload all gallery images (`photos` array from data.js)
3. ✅ Attach images to the correct Sanity artwork documents
4. ✅ Preserve your existing image files (no changes to local files)

## Quick Start

### Step 1: Get Your Sanity API Token

1. Go to https://www.sanity.io/manage/personal/tokens
2. Click **"Create new token"**
3. Give it a name like "Image Migration"
4. Set permissions to **"Editor"** or **"Administrator"**
5. Click **"Create"** and copy the token

### Step 2: Install Dependencies

Open PowerShell in this directory and run:

```powershell
npm install
```

### Step 3: Set Your API Token

In PowerShell, run:

```powershell
$env:SANITY_TOKEN="your_token_here"
```

Replace `your_token_here` with the token you copied in Step 1.

### Step 4: Run the Migration

```powershell
npm run migrate-images
```

## What to Expect

The script will:
- Process all 37+ artworks from data.js
- Upload each image to Sanity's CDN
- Update the corresponding Sanity documents
- Show progress for each artwork
- Display a summary at the end

Example output:
```
🚀 Starting image migration...

📚 Found 37 artworks in data.js

📝 Processing: "Still Life Collection"
   Found Sanity ID: 58c03f9b-b14a-45f1-bbc4-f9f6bac5e80e
   Uploading main image: images/naturmort6.jpg
   ✅ Uploaded: naturmort6.jpg
   Updating Sanity document...
   ✅ Successfully migrated images for "Still Life Collection"

...

============================================================
📊 Migration Summary:
============================================================
✅ Successful: 37
❌ Failed: 0
⏭️  Skipped: 0
📦 Total: 37
============================================================

🎉 Migration completed! Your artworks now have images in Sanity.
```

## Troubleshooting

### "SANITY_TOKEN environment variable not set"
- Make sure you ran the `$env:SANITY_TOKEN="..."` command
- The token is only set for the current PowerShell session
- If you close PowerShell, you'll need to set it again

### "Image not found"
- The script looks for images in the `images/` folder
- Make sure all image files exist at the paths specified in data.js

### "Failed to upload"
- Check your internet connection
- Verify your API token has the correct permissions
- Try running the script again (it will skip already-uploaded images)

## After Migration

Once the migration is complete:

1. ✅ Visit your Sanity Studio: https://ninartvision.sanity.studio/
2. ✅ Check a few artworks to verify images are attached
3. ✅ Test your website to ensure images load correctly
4. ✅ Your website will now load all artworks (old and new) from Sanity!

## Important Notes

- ✅ **No frontend changes needed** - Your existing queries will work automatically
- ✅ **Original images are preserved** - The script only uploads copies to Sanity
- ✅ **Safe to re-run** - If something fails, you can run it again
- ✅ **No data loss** - Only adds images, doesn't modify other fields

## Need Help?

If you encounter any issues:
1. Check the error message carefully
2. Verify your API token is valid
3. Make sure all image files exist in the images/ folder
4. Try running the script again

## Clean Up (Optional)

After successful migration, you can optionally:
- Keep package.json and migrate-images.js for future reference
- Or delete them if you don't need them anymore
- The node_modules folder can be deleted to save space

---

**Ready to migrate?** Follow the Quick Start steps above! 🚀
