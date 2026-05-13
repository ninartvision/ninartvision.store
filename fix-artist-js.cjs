/**
 * Point artist HTML at production .min.js bundles (same cache-bust ?query preserved).
 * Sources: artists/*.js — outputs from `npm run build:js` / CI. Use if pages still reference .js.
 */
const fs = require('fs');
const files = ['artists/mzia.html', 'artists/nanuli.html', 'artists/nini.html', 'artists/artist.html'];
const names = ['artist-shop', 'artists', 'artist'];
for (const f of files) {
  let c = fs.readFileSync(f, 'utf8');
  const orig = c;
  for (const name of names) {
    const re = new RegExp('src="(\\.\\/)?' + name + '\\.js(\\?[^"]*)?"', 'g');
    c = c.replace(re, (_, pre, q) => 'src="' + (pre || '') + name + '.min.js' + (q || '') + '"');
  }
  if (c !== orig) {
    fs.writeFileSync(f, c);
    console.log('Updated:', f);
  } else {
    console.log('No change:', f);
  }
}
