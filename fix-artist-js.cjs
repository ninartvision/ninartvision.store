/**
 * Normalize artist HTML script tags to source .js files.
 * artist.js, artist-shop.js, and artists.js are shipped as plain source; there
 * are no committed artist*.min.js files. Use this if pages were pointed at .min.js by mistake.
 */
const fs = require('fs');
const files = ['artists/mzia.html', 'artists/nanuli.html', 'artists/nini.html', 'artists/artist.html'];
// Longer names first so patterns stay unambiguous
const names = ['artist-shop', 'artists', 'artist'];
for (const f of files) {
  let c = fs.readFileSync(f, 'utf8');
  const orig = c;
  for (const name of names) {
    const re = new RegExp('src="(\\.\\/)?' + name + '\\.min\\.js(\\?[^"]*)?"', 'g');
    c = c.replace(re, (_, pre, q) => 'src="' + (pre || '') + name + '.js' + (q || '') + '"');
  }
  if (c !== orig) {
    fs.writeFileSync(f, c);
    console.log('Updated:', f);
  } else {
    console.log('No change:', f);
  }
}
