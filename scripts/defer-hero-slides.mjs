/**
 * Defer hero slide 2+ images (data-nv-src) for LCP. Idempotent.
 * Slide 1 must keep class="slide active" and normal src/srcset.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const file = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'index.html');
let html = fs.readFileSync(file, 'utf8');

if (html.includes('data-nv-src="./images/abstract3.webp"')) {
  console.log('Hero slides already deferred');
  process.exit(0);
}

const open = html.indexOf('<div class="hero-slides">');
const end = html.indexOf('  <div class="hero-overlay">', open);
if (open === -1 || end === -1) {
  console.error('hero-slides block not found');
  process.exit(1);
}

let block = html.slice(open, end);
const chunks = block.split(/<div class="slide(?: active)?">/);
const head = chunks[0];
const slides = chunks.slice(1);

const out =
  head +
  slides
    .map((part, i) => {
      const isFirst = i === 0;
      if (isFirst) {
        return '<div class="slide active">' + part;
      }
      let p = part;
      p = p.replace(/\ssrcset="/g, ' data-nv-srcset="');
      p = p.replace(/<img([^>]*)\ssrc="/g, '<img$1 data-nv-src="');
      p = p.replace(/\sloading="lazy"/g, '');
      return '<div class="slide">' + p;
    })
    .join('');

html = html.slice(0, open) + out + html.slice(end);
fs.writeFileSync(file, html);
console.log('Deferred', slides.length - 1, 'hero slides');
