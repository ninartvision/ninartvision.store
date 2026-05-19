import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const tpl = fs.readFileSync(path.join(root, 'scripts', 'project-redirect.html'), 'utf8');
const base = 'https://ninartvision.store';

const redirects = {
  'project1.html': `${base}/products/svaneti-svaneti/`,
  'project2.html': `${base}/products/silent-bloom/`,
  'project5.html': `${base}/products/magical-world/`,
  'project6.html': `${base}/products/the-way-to-the-monastery/`,
};

for (const [file, canonical] of Object.entries(redirects)) {
  const html = tpl.replace(/\{\{CANONICAL\}\}/g, canonical);
  fs.writeFileSync(path.join(root, file), html);
  console.log('redirect', file, '→', canonical);
}
