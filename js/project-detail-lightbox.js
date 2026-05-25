/**
 * Shared lightbox for Roseslover-style project detail pages.
 * Binds .gallery-list img and .project-image > img (idempotent).
 */
(function () {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const closeBtn = document.getElementById('lightboxClose');
  if (!lightbox || !lightboxImg || !closeBtn) return;

  function openLightbox(imgSrc) {
    if (!imgSrc) return;
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

  function bindImages(root) {
    const scope = root || document;
    scope.querySelectorAll('.gallery-list img').forEach(function (img) {
      if (img.dataset.nvLbBound) return;
      img.dataset.nvLbBound = '1';
      img.addEventListener('click', function () {
        openLightbox(img.getAttribute('data-full') || img.currentSrc || img.src);
      });
    });
    scope.querySelectorAll('.project-image > img').forEach(function (img) {
      if (img.dataset.nvLbBound) return;
      img.dataset.nvLbBound = '1';
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', function () {
        openLightbox(img.getAttribute('data-full') || img.currentSrc || img.src);
      });
    });
  }

  closeBtn.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { bindImages(); });
  } else {
    bindImages();
  }

  window.NVProjectDetail = { bindImages: bindImages, openLightbox: openLightbox, closeLightbox: closeLightbox };
})();
