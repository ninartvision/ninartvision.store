import { createClient } from '@sanity/client';
import fs from 'fs';
import path from 'path';
import vm from 'node:vm';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Sanity client configuration
const client = createClient({
  projectId: '8t5h923j',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_TOKEN || '' // You'll need to provide this
});

/** Ensure parsed ARTWORKS payload is an array of plain objects. */
function assertArtworksShape(data) {
  if (!Array.isArray(data)) {
    throw new Error('ARTWORKS must be an array');
  }
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    if (item === null || typeof item !== 'object' || Array.isArray(item)) {
      throw new Error(`ARTWORKS[${i}] must be a plain object`);
    }
  }
}

/**
 * Parse the ARTWORKS array literal from data.js.
 * Prefer strict JSON.parse when data.js is valid JSON; otherwise evaluate the
 * JS array literal inside an isolated vm context.
 */
function loadArtworksFromDataJs() {
  const dataJsContent = fs.readFileSync(path.join(__dirname, 'data.js'), 'utf-8');

  const artworksMatch = dataJsContent.match(/window\.ARTWORKS\s*=\s*(\[[\s\S]*?\]);/);
  if (!artworksMatch) {
    throw new Error('Could not find ARTWORKS array in data.js');
  }

  const raw = artworksMatch[1].trim();

  try {
    const parsed = JSON.parse(raw);
    assertArtworksShape(parsed);
    return parsed;
  } catch (jsonErr) {
    try {
      const fromVm = vm.runInNewContext(`(${raw})`, Object.create(null), {
        filename: 'data.js[ARTWORKS]',
        timeout: 10_000,
      });
      assertArtworksShape(fromVm);
      return fromVm;
    } catch (vmErr) {
      const err = new Error(
        `Could not parse ARTWORKS: JSON error: ${jsonErr.message}; VM fallback: ${vmErr.message}`
      );
      err.cause = vmErr;
      throw err;
    }
  }
}

// Upload image to Sanity
async function uploadImage(imagePath) {
  const fullPath = path.join(__dirname, imagePath);
  
  if (!fs.existsSync(fullPath)) {
    console.warn(`⚠️  Image not found: ${imagePath}`);
    return null;
  }
  
  try {
    const imageBuffer = fs.readFileSync(fullPath);
    const filename = path.basename(imagePath);
    
    const asset = await client.assets.upload('image', imageBuffer, {
      filename: filename
    });
    
    console.log(`✅ Uploaded: ${filename}`);
    return asset;
  } catch (error) {
    console.error(`❌ Failed to upload ${imagePath}:`, error.message);
    return null;
  }
}

// Find Sanity artwork by title
async function findArtworkByTitle(title) {
  const query = `*[_type == "artwork" && title == $title][0]`;
  return await client.fetch(query, { title });
}

// Update artwork with images
async function updateArtworkImages(artworkId, mainImageAsset, galleryAssets) {
  const patches = [];
  
  if (mainImageAsset) {
    patches.push({
      path: 'image',
      value: {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: mainImageAsset._id
        }
      }
    });
  }
  
  if (galleryAssets && galleryAssets.length > 0) {
    const imagesArray = galleryAssets.map(asset => ({
      _type: 'image',
      _key: Math.random().toString(36).substr(2, 9),
      asset: {
        _type: 'reference',
        _ref: asset._id
      }
    }));
    
    patches.push({
      path: 'images',
      value: imagesArray
    });
  }
  
  // Apply patches
  for (const patch of patches) {
    await client.patch(artworkId).set({ [patch.path]: patch.value }).commit();
  }
}

// Main migration function
async function migrateImages() {
  console.log('🚀 Starting image migration...\n');
  
  // Check for API token
  if (!process.env.SANITY_TOKEN) {
    console.error('❌ ERROR: SANITY_TOKEN environment variable not set!');
    console.log('\nTo fix this:');
    console.log('1. Go to https://www.sanity.io/manage/personal/tokens');
    console.log('2. Create a new token with "Editor" or "Administrator" permissions');
    console.log('3. Run: set SANITY_TOKEN=your_token_here');
    console.log('4. Then run: npm run migrate-images\n');
    process.exit(1);
  }
  
  const artworks = loadArtworksFromDataJs();
  console.log(`📚 Found ${artworks.length} artworks in data.js\n`);
  
  let successCount = 0;
  let failCount = 0;
  let skippedCount = 0;
  
  for (const artwork of artworks) {
    console.log(`\n📝 Processing: "${artwork.title || artwork.id}"`);
    
    // Find corresponding Sanity document
    const sanityArtwork = await findArtworkByTitle(artwork.title);
    
    if (!sanityArtwork) {
      console.log(`⏭️  Skipped: No Sanity document found for "${artwork.title}"`);
      skippedCount++;
      continue;
    }
    
    console.log(`   Found Sanity ID: ${sanityArtwork._id}`);
    
    try {
      // Upload main image
      let mainImageAsset = null;
      if (artwork.img) {
        console.log(`   Uploading main image: ${artwork.img}`);
        mainImageAsset = await uploadImage(artwork.img);
      }
      
      // Upload gallery images
      let galleryAssets = [];
      if (artwork.photos && artwork.photos.length > 0) {
        console.log(`   Uploading ${artwork.photos.length} gallery images...`);
        for (const photo of artwork.photos) {
          const asset = await uploadImage(photo);
          if (asset) {
            galleryAssets.push(asset);
          }
        }
      }
      
      // Update Sanity document
      if (mainImageAsset || galleryAssets.length > 0) {
        console.log(`   Updating Sanity document...`);
        await updateArtworkImages(sanityArtwork._id, mainImageAsset, galleryAssets);
        console.log(`   ✅ Successfully migrated images for "${artwork.title}"`);
        successCount++;
      } else {
        console.log(`   ⚠️  No images to upload for "${artwork.title}"`);
        skippedCount++;
      }
      
    } catch (error) {
      console.error(`   ❌ Failed to migrate "${artwork.title}":`, error.message);
      failCount++;
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Summary:');
  console.log('='.repeat(60));
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`⏭️  Skipped: ${skippedCount}`);
  console.log(`📦 Total: ${artworks.length}`);
  console.log('='.repeat(60) + '\n');
  
  if (successCount > 0) {
    console.log('🎉 Migration completed! Your artworks now have images in Sanity.');
  }
}

// Run migration
migrateImages().catch(error => {
  console.error('\n❌ Migration failed:', error);
  process.exit(1);
});
