/**
 * WebP Conversion Script
 * Converts all JPG/JPEG/PNG images to WebP format for better compression.
 * Original files are kept as fallback for older browsers.
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, 'images');
const QUALITY = 82; // Good balance between quality and file size
const MAX_WIDTH = 1920; // Cap maximum width to reduce payload

let converted = 0;
let skipped = 0;
let errors = 0;

function getAllImageFiles(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllImageFiles(fullPath));
    } else if (/\.(jpe?g|png)$/i.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

async function convertImage(srcPath) {
  const ext = path.extname(srcPath);
  const webpPath = srcPath.replace(/\.(jpe?g|png)$/i, '.webp');

  // Skip if WebP already exists and is newer than source
  if (fs.existsSync(webpPath)) {
    const srcStat = fs.statSync(srcPath);
    const webpStat = fs.statSync(webpPath);
    if (webpStat.mtimeMs > srcStat.mtimeMs) {
      skipped++;
      return;
    }
  }

  try {
    const img = sharp(srcPath);
    const meta = await img.metadata();

    // Resize if wider than MAX_WIDTH
    let pipeline = img;
    if (meta.width && meta.width > MAX_WIDTH) {
      pipeline = pipeline.resize(MAX_WIDTH, null, { withoutEnlargement: true });
    }

    await pipeline.webp({ quality: QUALITY }).toFile(webpPath);

    const srcSize = fs.statSync(srcPath).size;
    const webpSize = fs.statSync(webpPath).size;
    const savings = Math.round((1 - webpSize / srcSize) * 100);
    console.log(`✅ ${path.relative(__dirname, srcPath)} → .webp (${savings}% smaller)`);
    converted++;
  } catch (err) {
    console.error(`❌ Error converting ${srcPath}: ${err.message}`);
    errors++;
  }
}

async function main() {
  console.log('🖼️  Starting WebP conversion...\n');
  const files = getAllImageFiles(IMAGES_DIR);
  console.log(`Found ${files.length} image files\n`);

  // Process in batches of 8 for parallelism without overwhelming memory
  const BATCH = 8;
  for (let i = 0; i < files.length; i += BATCH) {
    const batch = files.slice(i, i + BATCH);
    await Promise.all(batch.map(convertImage));
  }

  console.log(`\n📊 Done! Converted: ${converted}, Skipped (already up-to-date): ${skipped}, Errors: ${errors}`);
}

main();
