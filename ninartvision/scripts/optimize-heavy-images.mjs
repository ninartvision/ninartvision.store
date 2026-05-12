import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const dir = path.resolve('./images');
const exts = new Set(['.webp', '.jpg', '.jpeg', '.png']);

const files = fs
  .readdirSync(dir)
  .filter((f) => exts.has(path.extname(f).toLowerCase()))
  .map((f) => path.join(dir, f));

let scanned = 0;
let optimized = 0;
let bytesBefore = 0;
let bytesAfter = 0;

for (const file of files) {
  const st = fs.statSync(file);
  scanned += 1;

  if (st.size < 700 * 1024) continue;

  const ext = path.extname(file).toLowerCase();
  const img = sharp(file, { failOn: 'none' });
  const meta = await img.metadata();

  let pipeline = img.rotate();
  if ((meta.width || 0) > 1600) {
    pipeline = pipeline.resize({ width: 1600, withoutEnlargement: true });
  }

  let outBuffer;
  if (ext === '.webp') {
    outBuffer = await pipeline.webp({ quality: 76, effort: 5 }).toBuffer();
  } else if (ext === '.jpg' || ext === '.jpeg') {
    outBuffer = await pipeline.jpeg({ quality: 80, mozjpeg: true, progressive: true }).toBuffer();
  } else if (ext === '.png') {
    outBuffer = await pipeline.png({ compressionLevel: 9, palette: true, quality: 80 }).toBuffer();
  } else {
    continue;
  }

  const nb = outBuffer.length;
  if (nb < st.size) {
    try {
      fs.writeFileSync(file, outBuffer);
      optimized += 1;
      bytesBefore += st.size;
      bytesAfter += nb;
      console.log(`optimized ${path.basename(file)} ${st.size} -> ${nb}`);
    } catch (err) {
      console.warn(`skip ${path.basename(file)} (${err.code || err.message || err})`);
    }
  }
}

console.log(
  JSON.stringify(
    {
      scanned,
      optimized,
      bytesBefore,
      bytesAfter,
      saved: bytesBefore - bytesAfter,
    },
    null,
    2,
  ),
);
