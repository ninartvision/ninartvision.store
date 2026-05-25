/**
 * Add Roseslover lightbox script to migrated product pages;
 * remove broken footer year script.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const productsDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'products');

const LIGHTBOX_SCRIPT = `<script>
  (function () {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const closeBtn = document.getElementById('lightboxClose');
    if (!lightbox || !lightboxImg || !closeBtn) return;

    function openLightbox(imgSrc) {
      lightbox.classList.add('open');
      lightboxImg.src = imgSrc;
      document.body.style.overflow = 'hidden';
      lightbox.setAttribute('aria-hidden', 'false');
      closeBtn.focus();
    }

    function closeLightbox() {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
      lightbox.setAttribute('aria-hidden', 'true');
    }

    document.querySelectorAll('.gallery-list img').forEach(function (img) {
      img.addEventListener('click', function () {
        openLightbox(img.getAttribute('data-full') || img.src);
      });
    });

    closeBtn.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox();
    });
  }());
</script>
`;

function fix(html) {
  let out = html;
  out = out.replace(/\s*\/\/ Footer year[\s\S]*?getElementById\('yr'\)[\s\S]*?;\s*/g, '\n');
  out = out.replace(/\s*document\.getElementById\('yr'\)[^;]*;\s*/g, '\n');

  if (!out.includes('id="lightbox"')) {
    out = out.replace(
      '</main>',
      `</main>\n\n<div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-hidden="true">
  <span class="close" id="lightboxClose" aria-label="Close lightbox">&times;</span>
  <img class="lightbox-img" id="lightboxImg" src="" alt="Enlarged view" decoding="async" loading="lazy">
</div>\n`
    );
  }

  if (!out.includes('function openLightbox')) {
    if (out.includes('</body>')) {
      out = out.replace('</body>', LIGHTBOX_SCRIPT + '\n</body>');
    } else {
      out = out.trimEnd() + '\n' + LIGHTBOX_SCRIPT + '\n</body>\n</html>\n';
    }
  } else if (!out.includes('</body>')) {
    out = out.trimEnd() + '\n</body>\n</html>\n';
  }

  return out;
}

let n = 0;
for (const name of readdirSync(productsDir)) {
  const idx = join(productsDir, name, 'index.html');
  if (!existsSync(idx)) continue;
  const html = readFileSync(idx, 'utf8');
  if (!html.includes('class="project-page"')) continue;
  const next = fix(html);
  if (next !== html) {
    writeFileSync(idx, next, 'utf8');
    console.log(`fixed → products/${name}/index.html`);
    n++;
  }
}
console.log(`Done. ${n} file(s) updated.`);
