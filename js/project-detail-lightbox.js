/**
 * Shared lightbox for project detail pages — pinch-zoom, pan, momentum, double-tap.
 * Binds gallery / feature images (idempotent).
 */
(function () {
  'use strict';

  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const closeBtn = document.getElementById('lightboxClose');
  if (!lightbox || !lightboxImg || !closeBtn) return;

  let viewport = lightbox.querySelector('.lightbox-viewport');
  if (!viewport) {
    viewport = document.createElement('div');
    viewport.className = 'lightbox-viewport';
    lightboxImg.parentNode.insertBefore(viewport, lightboxImg);
    viewport.appendChild(lightboxImg);
  }

  lightbox.classList.add('lightbox--touch');

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MIN_SCALE = 1;
  const MAX_SCALE = 4;
  const DOUBLE_TAP_MS = 280;
  const DOUBLE_TAP_SCALE = 2.35;

  const z = {
    scale: 1,
    x: 0,
    y: 0,
    baseW: 0,
    baseH: 0,
    pointers: new Map(),
    pinchDist0: 0,
    pinchScale0: 1,
    panLastX: 0,
    panLastY: 0,
    vx: 0,
    vy: 0,
    lastMoveT: 0,
    momentumId: null,
    lastTapT: 0,
    scrollY: 0,
    gesturing: false,
  };

  function cancelMomentum() {
    if (z.momentumId) {
      cancelAnimationFrame(z.momentumId);
      z.momentumId = null;
    }
  }

  function measureBase() {
    const prev = lightboxImg.style.transform;
    const prevTr = lightboxImg.style.transition;
    lightboxImg.style.transition = 'none';
    lightboxImg.style.transform = 'none';
    z.baseW = lightboxImg.offsetWidth;
    z.baseH = lightboxImg.offsetHeight;
    lightboxImg.style.transform = prev;
    lightboxImg.style.transition = prevTr;
  }

  function clamp() {
    if (z.scale <= MIN_SCALE + 0.001) {
      z.scale = MIN_SCALE;
      z.x = 0;
      z.y = 0;
      return;
    }
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const sw = z.baseW * z.scale;
    const sh = z.baseH * z.scale;
    const maxX = Math.max(0, (sw - vw) / 2);
    const maxY = Math.max(0, (sh - vh) / 2);
    z.x = Math.max(-maxX, Math.min(maxX, z.x));
    z.y = Math.max(-maxY, Math.min(maxY, z.y));
  }

  function applyTransform(useTransition) {
    if (useTransition && !REDUCED) {
      lightboxImg.style.transition = 'transform 0.32s cubic-bezier(0.22, 1, 0.36, 1)';
    } else {
      lightboxImg.style.transition = 'none';
    }
    lightboxImg.style.transform =
      'translate3d(' + z.x + 'px,' + z.y + 'px,0) scale(' + z.scale + ')';
  }

  function resetTransform(animate) {
    cancelMomentum();
    if (animate && !REDUCED && z.scale !== MIN_SCALE) {
      animateTo(MIN_SCALE, 0, 0);
      return;
    }
    z.scale = MIN_SCALE;
    z.x = 0;
    z.y = 0;
    z.vx = 0;
    z.vy = 0;
    applyTransform(false);
  }

  function animateTo(targetScale, targetX, targetY, done) {
    cancelMomentum();
    if (REDUCED) {
      z.scale = targetScale;
      z.x = targetX;
      z.y = targetY;
      clamp();
      applyTransform(false);
      if (done) done();
      return;
    }
    const start = { s: z.scale, x: z.x, y: z.y };
    const t0 = performance.now();
    const dur = 320;
    function frame(t) {
      const p = Math.min(1, (t - t0) / dur);
      const ease = 1 - Math.pow(1 - p, 3);
      z.scale = start.s + (targetScale - start.s) * ease;
      z.x = start.x + (targetX - start.x) * ease;
      z.y = start.y + (targetY - start.y) * ease;
      clamp();
      applyTransform(false);
      if (p < 1) {
        requestAnimationFrame(frame);
      } else if (done) {
        done();
      }
    }
    requestAnimationFrame(frame);
  }

  function zoomAround(clientX, clientY, nextScale) {
    const rect = viewport.getBoundingClientRect();
    const cx = clientX - rect.left - rect.width / 2;
    const cy = clientY - rect.top - rect.height / 2;
    const ratio = nextScale / z.scale;
    z.x = cx - (cx - z.x) * ratio;
    z.y = cy - (cy - z.y) * ratio;
    z.scale = nextScale;
    clamp();
    applyTransform(false);
  }

  function pointerDist() {
    const pts = Array.from(z.pointers.values());
    if (pts.length < 2) return 0;
    const dx = pts[1].x - pts[0].x;
    const dy = pts[1].y - pts[0].y;
    return Math.hypot(dx, dy);
  }

  function startMomentum() {
    if (REDUCED || z.scale <= MIN_SCALE) return;
    cancelMomentum();
    function tick() {
      z.vx *= 0.92;
      z.vy *= 0.92;
      z.x += z.vx;
      z.y += z.vy;
      clamp();
      applyTransform(false);
      if (Math.abs(z.vx) > 0.08 || Math.abs(z.vy) > 0.08) {
        z.momentumId = requestAnimationFrame(tick);
      } else {
        z.momentumId = null;
      }
    }
    z.momentumId = requestAnimationFrame(tick);
  }

  function lockBody() {
    z.scrollY = window.scrollY || window.pageYOffset || 0;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = '-' + z.scrollY + 'px';
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
  }

  function unlockBody() {
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    window.scrollTo(0, z.scrollY);
  }

  function onPointerDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    cancelMomentum();
    z.gesturing = true;
    z.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try {
      viewport.setPointerCapture(e.pointerId);
    } catch (_) {}

    if (z.pointers.size === 2) {
      z.pinchDist0 = pointerDist();
      z.pinchScale0 = z.scale;
    } else if (z.pointers.size === 1) {
      z.panLastX = e.clientX;
      z.panLastY = e.clientY;
      z.lastMoveT = performance.now();
      z.vx = 0;
      z.vy = 0;

      const now = Date.now();
      if (now - z.lastTapT < DOUBLE_TAP_MS) {
        e.preventDefault();
        if (z.scale > MIN_SCALE + 0.05) {
          animateTo(MIN_SCALE, 0, 0);
        } else {
          const next = Math.min(MAX_SCALE, DOUBLE_TAP_SCALE);
          const rect = viewport.getBoundingClientRect();
          const cx = e.clientX - rect.left - rect.width / 2;
          const cy = e.clientY - rect.top - rect.height / 2;
          const tx = cx - cx * next;
          const ty = cy - cy * next;
          animateTo(next, tx, ty);
        }
        z.lastTapT = 0;
        return;
      }
      z.lastTapT = now;
    }
  }

  function onPointerMove(e) {
    if (!z.pointers.has(e.pointerId)) return;

    const prev = z.pointers.get(e.pointerId);
    z.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (z.pointers.size >= 2) {
      e.preventDefault();
      const dist = pointerDist();
      if (z.pinchDist0 > 0 && dist > 0) {
        let next = z.pinchScale0 * (dist / z.pinchDist0);
        next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, next));
        const pts = Array.from(z.pointers.values());
        const cx = (pts[0].x + pts[1].x) / 2;
        const cy = (pts[0].y + pts[1].y) / 2;
        const rect = viewport.getBoundingClientRect();
        const px = cx - rect.left - rect.width / 2;
        const py = cy - rect.top - rect.height / 2;
        const ratio = next / z.scale;
        z.x = px - (px - z.x) * ratio;
        z.y = py - (py - z.y) * ratio;
        z.scale = next;
        clamp();
        applyTransform(false);
      }
      return;
    }

    if (z.scale > MIN_SCALE + 0.01) {
      e.preventDefault();
      const dx = e.clientX - z.panLastX;
      const dy = e.clientY - z.panLastY;
      const now = performance.now();
      const dt = Math.max(1, now - z.lastMoveT);
      z.vx = (dx / dt) * 16;
      z.vy = (dy / dt) * 16;
      z.lastMoveT = now;
      z.x += dx;
      z.y += dy;
      z.panLastX = e.clientX;
      z.panLastY = e.clientY;
      clamp();
      applyTransform(false);
    } else if (prev) {
      const adx = Math.abs(e.clientX - prev.x);
      const ady = Math.abs(e.clientY - prev.y);
      if (adx > 8 || ady > 8) z.lastTapT = 0;
    }
  }

  function onPointerUp(e) {
    if (!z.pointers.has(e.pointerId)) return;
    z.pointers.delete(e.pointerId);
    try {
      viewport.releasePointerCapture(e.pointerId);
    } catch (_) {}

    if (z.pointers.size === 1) {
      const remaining = Array.from(z.pointers.values())[0];
      z.panLastX = remaining.x;
      z.panLastY = remaining.y;
      z.pinchDist0 = 0;
    }

    if (z.pointers.size === 0) {
      z.gesturing = false;
      if (z.scale > MIN_SCALE + 0.01) {
        startMomentum();
      } else if (z.scale < MIN_SCALE + 0.08) {
        resetTransform(true);
      } else {
        clamp();
        applyTransform(false);
      }
    } else if (z.pointers.size === 2) {
      z.pinchDist0 = pointerDist();
      z.pinchScale0 = z.scale;
    }
  }

  viewport.addEventListener('pointerdown', onPointerDown);
  viewport.addEventListener('pointermove', onPointerMove, { passive: false });
  viewport.addEventListener('pointerup', onPointerUp);
  viewport.addEventListener('pointercancel', onPointerUp);

  lightboxImg.addEventListener('load', function () {
    if (lightbox.classList.contains('open')) measureBase();
  });

  window.addEventListener('resize', function () {
    if (lightbox.classList.contains('open')) {
      measureBase();
      clamp();
      applyTransform(false);
    }
  });

  function openLightbox(imgSrc) {
    if (!imgSrc) return;
    resetTransform(false);
    lightbox.classList.add('open');
    lightboxImg.src = imgSrc;
    lockBody();
    lightbox.setAttribute('aria-hidden', 'false');
    closeBtn.focus();
    if (lightboxImg.complete) {
      measureBase();
      applyTransform(false);
    }
  }

  function closeLightbox() {
    const wasZoomed = z.scale > MIN_SCALE + 0.01;
    function finishClose() {
      lightbox.classList.remove('open');
      unlockBody();
      lightbox.setAttribute('aria-hidden', 'true');
      lightboxImg.removeAttribute('style');
      z.scale = MIN_SCALE;
      z.x = 0;
      z.y = 0;
    }
    if (wasZoomed && !REDUCED) {
      animateTo(MIN_SCALE, 0, 0, finishClose);
    } else {
      resetTransform(false);
      finishClose();
    }
  }

  function bindImages(root) {
    const scope = root || document;
    const sel =
      '.gallery-list img, .terms-gallery-grid img, .art-gallery__grid img, ' +
      '.project-image > img, .terms-art__frame img, .art-project__feature img, ' +
      '.fp-frame img';
    scope.querySelectorAll(sel).forEach(function (img) {
      if (img.dataset.nvLbBound) return;
      img.dataset.nvLbBound = '1';
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', function () {
        openLightbox(img.getAttribute('data-full') || img.currentSrc || img.src);
      });
    });
  }

  closeBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    closeLightbox();
  });

  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox && !z.gesturing && z.scale <= MIN_SCALE + 0.01) {
      closeLightbox();
    }
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
        navigator.share({ title: shareTitle, url: shareUrl }).catch(function () {});
        return;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareUrl).then(flashCopied, function () {
          window.prompt('Copy link:', shareUrl);
        });
        return;
      }
      try {
        window.prompt('Copy link:', shareUrl);
      } catch (_) {}
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
    initShare: initShare,
  };
})();
