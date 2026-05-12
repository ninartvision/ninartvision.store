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
  const heroVisual = document.querySelector('.nvr-hero-visual');
  const catalogEl = document.getElementById('nvrCatalog');
  const fileInput = document.getElementById('nvrFile');
  const resetBtn = document.getElementById('nvrResetRoom');
  const scaleInput = document.getElementById('nvrScale');
  const rotateInput = document.getElementById('nvrRotate');
  const expandBtn = document.getElementById('nvrExpand');
  const scaleVal = document.getElementById('nvrScaleVal');
  const rotateVal = document.getElementById('nvrRotateVal');

  if (!stage || !catalogEl) return;

  /** Catalog lists only artworks by Nini Mzhavia (matches shop Sanity filter). */
  function isNiniMzhaviaArtwork(a) {
    var n = a && a.artist && a.artist.name;
    return String(n || '').trim().toLowerCase() === 'nini mzhavia';
  }

  /** Align with shop / sanity-client: sale | sold only (published → sale). */
  function listingNorm(raw) {
    if (typeof window.normalizeArtworkListingStatus === 'function') {
      return window.normalizeArtworkListingStatus(raw);
    }
    var s = String(raw == null ? '' : raw).trim().toLowerCase();
    if (s === 'sold') return 'sold';
    if (s === 'sale' || s === 'published') return 'sale';
    return '';
  }

  function isSaleOrSoldListing(a) {
    var n = listingNorm(a.status);
    return n === 'sale' || n === 'sold';
  }

  function formatSizeLine(a) {
    var d = a.size != null ? a.size : a.dimensions;
    if (d == null || d === '') return '';
    if (typeof d === 'string') return d.trim();
    if (typeof d === 'object') {
      if (d.width != null && d.height != null) {
        var u = d.unit ? String(d.unit) : 'cm';
        return d.width + ' × ' + d.height + ' ' + u;
      }
      if (d.width != null) return String(d.width);
    }
    return '';
  }

  function plainDescription(a) {
    var d = a.shortDescription || a.description;
    if (!d) return '';
    if (typeof d === 'string') return d.replace(/\s+/g, ' ').trim();
    if (!Array.isArray(d)) return '';
    var parts = [];
    d.forEach(function (block) {
      if (!block || !block.children) return;
      block.children.forEach(function (ch) {
        if (ch && ch.text) parts.push(ch.text);
      });
    });
    return parts.join(' ').replace(/\s+/g, ' ').trim();
  }

  function fmtPrice(p) {
    var n = Number(String(p || '').replace(/[^\d.]/g, ''));
    return n ? '\u20BE' + n.toLocaleString('en-US') : '';
  }

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

  /**
   * Remove typical JPEG scan-white matte only near image edges (preserves canvas whites / saturated frame wood).
   * Returns PNG data URL or '' on failure.
   */
  function knockOutEdgeMatteFromImage(im) {
    var w = im.naturalWidth;
    var h = im.naturalHeight;
    if (!w || !h) return '';
    var canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(im, 0, 0);
    var id = ctx.getImageData(0, 0, w, h);
    var d = id.data;
    var edgeBand = Math.max(6, Math.round(Math.min(w, h) * 0.13));
    var x;
    var y;
    var i;
    var r;
    var g;
    var b;
    var a;
    var lum;
    var maxc;
    var minc;
    var sat;
    var dist;
    var edgeF;
    var matteW;
    var invA;

    for (y = 0; y < h; y++) {
      for (x = 0; x < w; x++) {
        dist = Math.min(x, y, w - 1 - x, h - 1 - y);
        if (dist >= edgeBand) continue;

        i = (y * w + x) * 4;
        r = d[i];
        g = d[i + 1];
        b = d[i + 2];
        a = d[i + 3];
        if (a === 0) continue;

        lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        maxc = r > g ? r : g;
        maxc = maxc > b ? maxc : b;
        minc = r < g ? r : g;
        minc = minc < b ? minc : b;
        sat = maxc === 0 ? 0 : (maxc - minc) / maxc;

        edgeF = 1 - dist / edgeBand;
        edgeF *= edgeF;

        matteW =
          Math.max(0, Math.min(1, (lum - 0.68) / 0.32)) *
          Math.max(0, Math.min(1, (0.48 - sat) / 0.48));

        invA = 1 - matteW * edgeF;
        d[i + 3] = Math.round(a * invA);
      }
    }

    ctx.putImageData(id, 0, 0);
    return canvas.toDataURL('image/png');
  }

  function loadArtWithMatteRemoval(imageUrl, callback) {
    if (!imageUrl || typeof fetch !== 'function') {
      callback(null);
      return;
    }
    fetch(imageUrl, { mode: 'cors', credentials: 'omit' })
      .then(function (res) {
        if (!res.ok) throw new Error('fetch');
        return res.blob();
      })
      .then(function (blob) {
        var objUrl = URL.createObjectURL(blob);
        var im = new Image();
        im.onload = function () {
          try {
            var png = knockOutEdgeMatteFromImage(im);
            URL.revokeObjectURL(objUrl);
            callback(png && png.indexOf('data:image/png') === 0 ? png : null);
          } catch (err) {
            URL.revokeObjectURL(objUrl);
            callback(null);
          }
        };
        im.onerror = function () {
          URL.revokeObjectURL(objUrl);
          callback(null);
        };
        im.src = objUrl;
      })
      .catch(function () {
        callback(null);
      });
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
    if (heroVisual) heroVisual.classList.toggle('nvr-hero-visual--live', !!show);
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
      artWrap.removeAttribute('data-nvr-art-alpha');
      artImg.removeAttribute('src');
      updateArtVisibility();
      return;
    }
    artImg.alt = a.title || 'Artwork';
    var canonicalUrl = imgUrlForArt(a);
    loadArtWithMatteRemoval(canonicalUrl, function (pngDataUrl) {
      if (selectedId !== id) return;
      if (pngDataUrl) {
        artWrap.setAttribute('data-nvr-art-alpha', '1');
        artImg.src = pngDataUrl;
      } else {
        artWrap.removeAttribute('data-nvr-art-alpha');
        artImg.src = canonicalUrl;
      }
      applyArtTransform();
      updateArtVisibility();
    });
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
      var listSt = listingNorm(a.status);
      btn.classList.toggle('is-sold', listSt === 'sold');
      btn.dataset.id = a._id;
      btn.dataset.listingStatus = listSt;
      btn.setAttribute('aria-pressed', 'false');

      const im = document.createElement('img');
      im.alt = a.title || '';
      im.src = thumbUrlForArt(a);
      im.draggable = false;
      im.onerror = function () { this.src = 'images/placeholder.jpg'; };

      const body = document.createElement('div');
      body.className = 'nvr-card-body';

      const titleEl = document.createElement('div');
      titleEl.className = 'nvr-card-title';
      titleEl.textContent = a.title || 'Untitled';
      body.appendChild(titleEl);

      const artistEl = document.createElement('div');
      artistEl.className = 'nvr-card-artist muted small';
      artistEl.textContent = (a.artist && a.artist.name) ? a.artist.name : '';
      body.appendChild(artistEl);

      var priceTxt = fmtPrice(a.price);
      if (priceTxt) {
        const priceEl = document.createElement('div');
        priceEl.className = 'nvr-card-price';
        priceEl.textContent = priceTxt;
        body.appendChild(priceEl);
      }

      var descTxt = plainDescription(a);
      if (descTxt) {
        const descEl = document.createElement('div');
        descEl.className = 'nvr-card-desc';
        descEl.textContent = descTxt;
        body.appendChild(descEl);
      }

      var sizeTxt = formatSizeLine(a);
      var mediumTxt = a.medium ? String(a.medium).trim() : '';
      var metaParts = [];
      if (sizeTxt) metaParts.push(sizeTxt);
      if (mediumTxt) metaParts.push(mediumTxt);
      if (metaParts.length) {
        const metaEl = document.createElement('div');
        metaEl.className = 'nvr-card-meta muted small';
        metaEl.textContent = metaParts.join(' · ');
        body.appendChild(metaEl);
      }

      const statusEl = document.createElement('div');
      statusEl.className = 'nvr-cat-status';
      statusEl.textContent = listSt === 'sold' ? 'SOLD' : 'SALE';
      body.appendChild(statusEl);

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
      artworks = (await window.fetchAllArtworks() || [])
        .filter(isNiniMzhaviaArtwork)
        .filter(isSaleOrSoldListing);
      artworks.sort(function (a, b) {
        var na = listingNorm(a.status);
        var nb = listingNorm(b.status);
        if (na === 'sale' && nb !== 'sale') return -1;
        if (na !== 'sale' && nb === 'sale') return 1;
        return 0;
      });
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
