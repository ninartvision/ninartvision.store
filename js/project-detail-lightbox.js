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
    scope.querySelectorAll('.gallery-list img, .terms-gallery-grid img, .art-gallery__grid img').forEach(function (img) {
      if (img.dataset.nvLbBound) return;
      img.dataset.nvLbBound = '1';
      img.addEventListener('click', function () {
        openLightbox(img.getAttribute('data-full') || img.currentSrc || img.src);
      });
    });
    scope.querySelectorAll('.project-image > img, .terms-art__frame img, .art-project__feature img').forEach(function (img) {
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

  function initShare() {
    var btn = document.getElementById('shareBtn');
    var msg = document.getElementById('shareMsg');
    if (!btn) return;
    if (btn.dataset.nvShareBound || btn.dataset.fpShareBound) return;
    btn.dataset.nvShareBound = '1';
    if (msg) {
      msg.style.display = 'none';
      msg.setAttribute('aria-live', 'polite');
    }
    var shareUrl = btn.getAttribute('data-share-url') || location.href;
    var shareTitle = btn.getAttribute('data-share-title') || document.title;
    function flashCopied() {
      if (!msg) return;
      msg.style.display = 'block';
      window.clearTimeout(initShare._t);
      initShare._t = window.setTimeout(function () {
        msg.style.display = 'none';
      }, 3000);
    }
    btn.addEventListener('click', function () {
      if (navigator.share) {
        navigator.share({ title: shareTitle, url: shareUrl })
          .catch(function () { /* user dismissed */ });
        return;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareUrl).then(flashCopied, function () {
          window.prompt('Copy link:', shareUrl);
        });
        return;
      }
      try { window.prompt('Copy link:', shareUrl); } catch (_) {}
    });
  }

  function initAll() {
    bindImages();
    initShare();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  window.NVProjectDetail = {
    bindImages: bindImages,
    openLightbox: openLightbox,
    closeLightbox: closeLightbox,
    initShare: initShare
  };
})();
