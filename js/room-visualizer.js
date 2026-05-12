/**
 * Room / wall artwork preview — uses fetchAllArtworks + sanityImgUrl.
 * Drag artwork to reposition; drag corner handle to resize; sliders for refine.
 */
(function () {
  'use strict';

  const stage = document.getElementById('nvrStage');
  const roomImg = document.getElementById('nvrRoom');
  const artWrap = document.getElementById('nvrArtWrap');
  const artImg = document.getElementById('nvrArtImg');
  const corner = document.getElementById('nvrCorner');
  const placeholder = document.getElementById('nvrPlaceholder');
  const stageWrap = document.getElementById('nvrStageWrap');
  const catalogEl = document.getElementById('nvrCatalog');
  const fileInput = document.getElementById('nvrFile');
  const resetBtn = document.getElementById('nvrResetRoom');
  const scaleInput = document.getElementById('nvrScale');
  const rotateInput = document.getElementById('nvrRotate');
  const expandBtn = document.getElementById('nvrExpand');
  const scaleVal = document.getElementById('nvrScaleVal');
  const rotateVal = document.getElementById('nvrRotateVal');

  if (!stage || !catalogEl) return;

  let artworks = [];
  let roomObjectUrl = null;
  let selectedId = null;
  /** Center x,y as % of stage; width as % of stage width; rotation deg */
  let cx = 50;
  let cy = 45;
  let sw = 32;
  let rot = 0;

  let dragMode = null;
  let dragStart = null;

  function imgUrlForArt(a) {
    if (!a || !a.img) return '';
    return typeof window.sanityImgUrl === 'function'
      ? window.sanityImgUrl(a.img, { w: 1200, q: 88 })
      : a.img;
  }

  function thumbUrlForArt(a) {
    if (!a || !a.img) return 'images/placeholder.jpg';
    return typeof window.sanityImgUrl === 'function'
      ? window.sanityImgUrl(a.img, { w: 400, q: 75 })
      : a.img;
  }

  function applyArtTransform() {
    artWrap.style.left = cx + '%';
    artWrap.style.top = cy + '%';
    artWrap.style.width = sw + '%';
    artWrap.style.transform = 'translate(-50%, -50%) rotate(' + rot + 'deg)';
    if (scaleInput && scaleVal) {
      scaleInput.value = String(Math.round(sw));
      scaleVal.textContent = Math.round(sw) + '%';
    }
    if (rotateInput && rotateVal) {
      rotateInput.value = String(Math.round(rot));
      rotateVal.textContent = rot + '°';
    }
  }

  function revealStage(show) {
    placeholder.hidden = show;
    stageWrap.hidden = !show;
    resetBtn.dataset.visible = show ? '1' : '0';
    if (!show) roomImg.removeAttribute('src');
  }

  function updateArtVisibility() {
    const hasRoom = !!roomImg.getAttribute('src');
    const hasArt = !!(selectedId && artImg.getAttribute('src'));
    artWrap.hidden = !(hasRoom && hasArt);
    corner.hidden = artWrap.hidden;
  }

  function setSelectedArtwork(id) {
    selectedId = id;
    catalogEl.querySelectorAll('.nvr-cat-card').forEach(btn => {
      btn.classList.toggle('is-selected', btn.dataset.id === id);
    });
    const a = artworks.find(x => x._id === id);
    if (!a || !imgUrlForArt(a)) {
      artImg.removeAttribute('src');
      updateArtVisibility();
      return;
    }
    artImg.alt = a.title || 'Artwork';
    artImg.src = imgUrlForArt(a);
    applyArtTransform();
    updateArtVisibility();
  }

  function stageRect() {
    return stage.getBoundingClientRect();
  }

  function clamp(n, lo, hi) {
    return Math.min(hi, Math.max(lo, n));
  }

  function onPointerMove(e) {
    if (!dragMode || !dragStart) return;
    if (dragMode === 'move') {
      const dx = e.clientX - dragStart.px;
      const dy = e.clientY - dragStart.py;
      cx = clamp(dragStart.cx + (dx / dragStart.rw) * 100, 5, 95);
      cy = clamp(dragStart.cy + (dy / dragStart.rh) * 100, 5, 95);
      applyArtTransform();
    } else if (dragMode === 'resize') {
      const dx = e.clientX - dragStart.px;
      const deltaPct = (dx / dragStart.rw) * 100 * 2;
      sw = clamp(dragStart.sw + deltaPct, Number(scaleInput.min), Number(scaleInput.max));
      applyArtTransform();
    }
  }

  function onPointerUp(e) {
    if (!dragMode) return;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerUp);
    dragMode = null;
    dragStart = null;
    artWrap.classList.remove('is-dragging');
  }

  artWrap.addEventListener('pointerdown', e => {
    if (dragMode) return;
    if (e.target.closest('.nvr-resize-corner')) return;
    e.preventDefault();
    const r = stageRect();
    dragMode = 'move';
    dragStart = { px: e.clientX, py: e.clientY, cx, cy, rw: r.width, rh: r.height };
    artWrap.classList.add('is-dragging');
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  });

  corner.addEventListener('pointerdown', e => {
    if (dragMode) return;
    e.preventDefault();
    e.stopPropagation();
    const r = stageRect();
    dragMode = 'resize';
    dragStart = { px: e.clientX, py: e.clientY, sw, rw: r.width };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  });

  scaleInput.addEventListener('input', () => {
    sw = clamp(Number(scaleInput.value), Number(scaleInput.min), Number(scaleInput.max));
    applyArtTransform();
  });

  rotateInput.addEventListener('input', () => {
    rot = clamp(Number(rotateInput.value), Number(rotateInput.min), Number(rotateInput.max));
    applyArtTransform();
  });

  fileInput.addEventListener('change', () => {
    const f = fileInput.files && fileInput.files[0];
    if (!f || !/^image\//.test(f.type)) return;
    if (roomObjectUrl) URL.revokeObjectURL(roomObjectUrl);
    roomObjectUrl = URL.createObjectURL(f);
    roomImg.src = roomObjectUrl;
    revealStage(true);
    updateArtVisibility();
  });

  resetBtn.addEventListener('click', () => {
    if (roomObjectUrl) URL.revokeObjectURL(roomObjectUrl);
    roomObjectUrl = null;
    fileInput.value = '';
    revealStage(false);
    updateArtVisibility();
  });

  if (expandBtn) {
    expandBtn.addEventListener('click', () => {
      stageWrap.classList.toggle('nvr-stage--tall');
      expandBtn.setAttribute(
        'aria-pressed',
        stageWrap.classList.contains('nvr-stage--tall') ? 'true' : 'false'
      );
    });
  }

  function renderCatalog() {
    catalogEl.innerHTML = '';
    artworks.forEach(a => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nvr-cat-card';
      btn.dataset.id = a._id;
      btn.setAttribute('aria-pressed', 'false');

      const im = document.createElement('img');
      im.alt = '';
      im.src = thumbUrlForArt(a);
      im.draggable = false;
      im.onerror = function () { this.src = 'images/placeholder.jpg'; };

      const body = document.createElement('div');
      body.className = 'nvr-card-body';
      const t = document.createElement('div');
      t.className = 'nvr-card-title';
      t.textContent = a.title || 'Untitled';
      body.appendChild(t);
      const sub = document.createElement('div');
      sub.className = 'muted small';
      sub.textContent = (a.artist && a.artist.name) ? a.artist.name : '';
      body.appendChild(sub);

      btn.appendChild(im);
      btn.appendChild(body);
      btn.addEventListener('click', () => {
        catalogEl.querySelectorAll('.nvr-cat-card').forEach(c => {
          c.setAttribute('aria-pressed', String(c.dataset.id === a._id));
        });
        setSelectedArtwork(a._id);
      });

      catalogEl.appendChild(btn);
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    placeholder.hidden = false;
    stageWrap.hidden = true;

    try {
      if (typeof window.fetchAllArtworks !== 'function') {
        catalogEl.innerHTML = '<p class="muted">Artwork catalogue could not be loaded.</p>';
        return;
      }
      artworks = await window.fetchAllArtworks() || [];
      if (!artworks.length) {
        catalogEl.innerHTML = '<p class="muted">No artworks in catalogue.</p>';
        return;
      }
      renderCatalog();
    } catch (err) {
      console.error('[room-visualizer]', err);
      catalogEl.innerHTML = '<p class="muted">Could not load artworks. Please refresh.</p>';
    }
  });

})();
