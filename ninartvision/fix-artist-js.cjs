const fs = require('fs');
const files = ['artists/mzia.html','artists/nanuli.html','artists/nini.html','artists/artist.html'];
files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  const orig = c;
  c = c.replace(/src="artist-shop\.js"/g, 'src="artist-shop.min.js"');
  c = c.replace(/src="artist\.js"/g, 'src="artist.min.js"');
  c = c.replace(/src="artists\.js"/g, 'src="artists.min.js"');
  if (c !== orig) { fs.writeFileSync(f, c); console.log('Updated:', f); }
  else console.log('No change:', f);
});
