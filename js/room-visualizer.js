/**
 * Room / wall artwork preview — pinch, pan, rotate, corner handles (mobile-first).
 */
(function () {
  'use strict';

  const stage = document.getElementById('nvrStage');
  const roomImg = document.getElementById('nvrRoom');
  const artWrap = document.getElementById('nvrArtWrap');
  const artImg = document.getElementById('nvrArtImg');
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
  let activeUploadToken = 0;
  let fullscreenPreviewModal = null;
  let fullscreenPreviewScene = null;
  let fullscreenPreviewVisible = false;
  let fullscreenCloseTimer = null;
  let stageRestoreParent = null;
  let stageRestoreNext = null;
  let interactiveStage = stage;
  let interactiveArtWrap = artWrap;
  let handlesEl = null;
  /** Center x,y as % of stage; width as % of stage width; rotation deg */
  let cx = 50;
  let cy = 45;
  let sw = 32;
  let rot = 0;

  const MIN_SW = 8;
  const MAX_SW = 95;
  const NON_PASSIVE = { passive: false };

  const gesture = {
    mode: null,
    handle: null,
    pointers: new Map(),
    sw0: 32,
    rot0: 0,
    cx0: 50,
    cy0: 45,
    dist0: 0,
    angle0: 0,
    panX: 0,
    panY: 0,
    stageW: 0,
    stageH: 0,
  };

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
   * Exterior matte: edge flood + iterative halo; triple color refs from corners, border, cleared median.
   * Residual peel + shave; skips pixels anchored to inward opaque color vs matte (protects light wood corners).
   */
  function knockOutMatteFromImage(im) {
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

    var patch = Math.max(6, Math.min(18, Math.round(Math.min(w, h) * 0.022)));

    function sampleCornerMedianColor() {
      var arr = [];
      var corners = [
        [0, 0],
        [w - patch, 0],
        [0, h - patch],
        [w - patch, h - patch]
      ];
      var c;
      var ox;
      var oy;
      var dx;
      var dy;
      var x;
      var y;
      var i;
      for (c = 0; c < 4; c++) {
        ox = corners[c][0];
        oy = corners[c][1];
        for (dy = 0; dy < patch; dy++) {
          for (dx = 0; dx < patch; dx++) {
            x = ox + dx;
            y = oy + dy;
            if (x >= w || y >= h) continue;
            i = (y * w + x) * 4;
            arr.push({ r: d[i], g: d[i + 1], b: d[i + 2] });
          }
        }
      }
      arr.sort(function (u, v) {
        return u.r + u.g + u.b - (v.r + v.g + v.b);
      });
      var m = arr[Math.floor(arr.length / 2)];
      return { r: m.r, g: m.g, b: m.b };
    }

    /** Full-edge neutrals — catches gray studio matte when corners show wood frame. */
    function sampleBorderNeutralMedian(borderPx, satMax, lumMin, lumMax) {
      var bw = Math.max(1, Math.min(borderPx, Math.round(Math.min(w, h) * 0.025)));
      var samp = [];
      var bx;
      var by;
      var bi;
      var br;
      var bg;
      var bb;
      var ls;
      for (by = 0; by < h; by++) {
        for (bx = 0; bx < w; bx++) {
          if (
            bx >= bw &&
            bx < w - bw &&
            by >= bw &&
            by < h - bw
          ) {
            continue;
          }
          bi = (by * w + bx) * 4;
          br = d[bi];
          bg = d[bi + 1];
          bb = d[bi + 2];
          ls = lumSatRGB(br, bg, bb);
          if (ls.lum >= lumMin && ls.lum <= lumMax && ls.sat <= satMax) {
            samp.push({ r: br, g: bg, b: bb });
          }
        }
      }
      if (samp.length < Math.max(48, Math.floor((w + h) * 2 * bw * 0.08))) {
        return null;
      }
      samp.sort(function (u, v) {
        return u.r + u.g + u.b - (v.r + v.g + v.b);
      });
      var mm = samp[Math.floor(samp.length / 2)];
      return { r: mm.r, g: mm.g, b: mm.b };
    }

    function matteDistDual(cornerRef, borderRef, r, g, b) {
      var dc = colorDist(cornerRef, r, g, b);
      if (!borderRef) return dc;
      var db = colorDist(borderRef, r, g, b);
      return dc < db ? dc : db;
    }

    /** Median RGB of flood-cleared pixels — tracks actual matte/halo color on this asset. */
    function sampleClearedMatteMedian(minPts) {
      var arr = [];
      var cx;
      var cy;
      var cii;
      var ci;
      for (cy = 0; cy < h; cy++) {
        for (cx = 0; cx < w; cx++) {
          cii = ix(cx, cy);
          ci = cii * 4;
          if (d[ci + 3] !== 0) continue;
          arr.push({ r: d[ci], g: d[ci + 1], b: d[ci + 2] });
        }
      }
      if (arr.length < minPts) return null;
      arr.sort(function (u, v) {
        return u.r + u.g + u.b - (v.r + v.g + v.b);
      });
      var cm = arr[Math.floor(arr.length / 2)];
      return { r: cm.r, g: cm.g, b: cm.b };
    }

    function matteDistTriple(cornerRef, borderRef, clearedRef, r, g, b) {
      var m = matteDistDual(cornerRef, borderRef, r, g, b);
      if (!clearedRef) return m;
      var dk = colorDist(clearedRef, r, g, b);
      return m < dk ? m : dk;
    }

    /** Halo / snap / shave — uses cleared matte median when available. */
    function matteLikePeel(cornerRef, borderRef, clearedRef, r, g, b, tol, lumFloor, satCeil) {
      var ls = lumSatRGB(r, g, b);
      if (ls.lum < lumFloor || ls.sat > satCeil) return false;
      return matteDistTriple(cornerRef, borderRef, clearedRef, r, g, b) <= tol;
    }

    function lumSatRGB(r, g, b) {
      var lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      var maxc = r > g ? r : g;
      maxc = maxc > b ? maxc : b;
      var minc = r < g ? r : g;
      minc = minc < b ? minc : b;
      var sat = maxc === 0 ? 0 : (maxc - minc) / maxc;
      return { lum: lum, sat: sat };
    }

    function colorDist(ref, r, g, b) {
      var dr = ref.r - r;
      var dg = ref.g - g;
      var db = ref.b - b;
      return Math.sqrt(dr * dr + dg * dg + db * db);
    }

    function matteLikeSeed(cornerRef, borderRef, r, g, b, tol, lumFloor, satCeil) {
      var ls = lumSatRGB(r, g, b);
      if (ls.lum < lumFloor || ls.sat > satCeil) return false;
      return matteDistDual(cornerRef, borderRef, r, g, b) <= tol;
    }

    function matteLikeFlood(cornerRef, borderRef, r, g, b, tol, lumFloor, satCeil) {
      var ls = lumSatRGB(r, g, b);
      if (ls.lum < lumFloor || ls.sat > satCeil) return false;
      return matteDistDual(cornerRef, borderRef, r, g, b) <= tol;
    }

    var cornerRef = sampleCornerMedianColor();
    var borderRef = sampleBorderNeutralMedian(3, 0.58, 0.22, 0.99);
    var tolSeed = 46;
    var tolFlood = 86;
    var lumSeed = 0.48;
    var satSeed = 0.46;
    var lumFlood = 0.22;
    var satFlood = 0.66;

    var visited = new Uint8Array(w * h);
    var queue = [];
    var qi = 0;

    function ix(x, y) {
      return y * w + x;
    }

    function enqueue(x, y) {
      var ii = ix(x, y);
      if (visited[ii]) return;
      var i = ii * 4;
      var r = d[i];
      var g = d[i + 1];
      var b = d[i + 2];
      if (!matteLikeSeed(cornerRef, borderRef, r, g, b, tolSeed, lumSeed, satSeed)) return;
      visited[ii] = 1;
      queue.push(x);
      queue.push(y);
    }

    function enqueueLoose(x, y) {
      var ii = ix(x, y);
      if (visited[ii]) return;
      var i = ii * 4;
      var r = d[i];
      var g = d[i + 1];
      var b = d[i + 2];
      if (!matteLikeSeed(cornerRef, borderRef, r, g, b, 82, 0.22, 0.62)) return;
      visited[ii] = 1;
      queue.push(x);
      queue.push(y);
    }

    var xx;
    var yy;
    for (xx = 0; xx < w; xx++) {
      enqueue(xx, 0);
      enqueue(xx, h - 1);
    }
    for (yy = 0; yy < h; yy++) {
      enqueue(0, yy);
      enqueue(w - 1, yy);
    }

    if (queue.length === 0) {
      for (xx = 0; xx < w; xx++) {
        enqueueLoose(xx, 0);
        enqueueLoose(xx, h - 1);
      }
      for (yy = 0; yy < h; yy++) {
        enqueueLoose(0, yy);
        enqueueLoose(w - 1, yy);
      }
    }

    var dirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1]
    ];
    var di;
    var nx;
    var ny;
    var nii;
    var ni;
    var nr;
    var ng;
    var nb;

    while (qi < queue.length) {
      xx = queue[qi++];
      yy = queue[qi++];
      ni = ix(xx, yy) * 4;
      d[ni + 3] = 0;

      for (di = 0; di < 8; di++) {
        nx = xx + dirs[di][0];
        ny = yy + dirs[di][1];
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        nii = ix(nx, ny);
        if (visited[nii]) continue;
        ni = nii * 4;
        nr = d[ni];
        ng = d[ni + 1];
        nb = d[ni + 2];
        if (!matteLikeFlood(cornerRef, borderRef, nr, ng, nb, tolFlood, lumFlood, satFlood)) continue;
        visited[nii] = 1;
        queue.push(nx);
        queue.push(ny);
      }
    }

    var clearedMatteRef = sampleClearedMatteMedian(64);

    /** True when pixel is anchored to chromatic inward neighbors (wood), not gray backing band. */
    function pixelAnchoredToOpaqueInterior(alphaBuf, px, py, pr, pg, pb) {
      var rs = [];
      var gs = [];
      var bs = [];
      var kk;
      var qx;
      var qy;
      var qi2;
      var qo;
      var rr;
      var gg;
      var bb;
      var nls;
      var woodish = 0;
      for (kk = 0; kk < 8; kk++) {
        qx = px + dirs[kk][0];
        qy = py + dirs[kk][1];
        if (qx < 0 || qy < 0 || qx >= w || qy >= h) continue;
        qi2 = ix(qx, qy);
        if (alphaBuf[qi2] === 0) continue;
        qo = qi2 * 4;
        rr = d[qo];
        gg = d[qo + 1];
        bb = d[qo + 2];
        rs.push(rr);
        gs.push(gg);
        bs.push(bb);
        nls = lumSatRGB(rr, gg, bb);
        if (nls.sat >= 0.11) woodish++;
      }
      if (rs.length < 3 || woodish < 3) return false;
      rs.sort(function (a, b) {
        return a - b;
      });
      gs.sort(function (a, b) {
        return a - b;
      });
      bs.sort(function (a, b) {
        return a - b;
      });
      var mid = rs.length >> 1;
      var med = { r: rs[mid], g: gs[mid], b: bs[mid] };
      var medLs = lumSatRGB(med.r, med.g, med.b);
      if (medLs.sat < 0.108) return false;

      var pixLs = lumSatRGB(pr, pg, pb);
      var dMatte = clearedMatteRef ? colorDist(clearedMatteRef, pr, pg, pb) : 220;
      if (clearedMatteRef && dMatte < 54 && pixLs.sat < 0.34) return false;

      var dSolid = colorDist(med, pr, pg, pb);
      return dSolid + 12 < dMatte && dSolid < dMatte * 0.88;
    }

    var alphaPrev = new Uint8Array(w * h);
    var xi;
    var yi;
    var ii;
    var pass;
    var touchesClear;
    var dd;
    var maxHaloPasses = 36;
    var haloStableCap = 4;
    var minPassesBeforeHaloExit = 22;
    var stableRun = 0;
    var tolH;
    var lumH;
    var satH;
    var haloChanged;

    for (pass = 0; pass < maxHaloPasses; pass++) {
      tolH = tolFlood + 10 + Math.min(pass, 20) * 8;
      lumH = Math.max(0.12, lumFlood - 0.02 - pass * 0.024);
      satH = Math.min(0.8, satFlood + 0.02 + pass * 0.028);
      if (pass === 8 || pass === 14 || pass === 20 || pass === 26 || pass === 32) {
        var refreshedRef = sampleClearedMatteMedian(96);
        if (refreshedRef) clearedMatteRef = refreshedRef;
      }
      haloChanged = false;

      for (yi = 0; yi < h; yi++) {
        for (xi = 0; xi < w; xi++) {
          alphaPrev[ix(xi, yi)] = d[ix(xi, yi) * 4 + 3];
        }
      }
      for (yi = 0; yi < h; yi++) {
        for (xi = 0; xi < w; xi++) {
          ii = ix(xi, yi);
          if (alphaPrev[ii] === 0) continue;
          touchesClear = false;
          for (dd = 0; dd < 8; dd++) {
            nx = xi + dirs[dd][0];
            ny = yi + dirs[dd][1];
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) {
              touchesClear = true;
              break;
            }
            if (alphaPrev[ix(nx, ny)] === 0) {
              touchesClear = true;
              break;
            }
          }
          if (!touchesClear) continue;
          ni = ii * 4;
          nr = d[ni];
          ng = d[ni + 1];
          nb = d[ni + 2];
          if (
            matteLikePeel(cornerRef, borderRef, clearedMatteRef, nr, ng, nb, tolH + 42, lumH, satH) &&
            !pixelAnchoredToOpaqueInterior(alphaPrev, xi, yi, nr, ng, nb)
          ) {
            d[ni + 3] = 0;
            haloChanged = true;
          }
        }
      }
      if (!haloChanged) {
        stableRun++;
        if (pass >= minPassesBeforeHaloExit && stableRun >= haloStableCap) break;
      } else {
        stableRun = 0;
      }
    }

    function snapSemiTransparentFringe() {
      var px;
      var py;
      var ip;
      var ap;
      var rp;
      var gp;
      var bp;
      for (py = 0; py < h; py++) {
        for (px = 0; px < w; px++) {
          alphaPrev[ix(px, py)] = d[ix(px, py) * 4 + 3];
        }
      }
      for (py = 0; py < h; py++) {
        for (px = 0; px < w; px++) {
          ip = ix(px, py) * 4;
          ap = d[ip + 3];
          if (ap === 0 || ap === 255) continue;
          rp = d[ip];
          gp = d[ip + 1];
          bp = d[ip + 2];
          if (
            matteLikePeel(
              cornerRef,
              borderRef,
              clearedMatteRef,
              rp,
              gp,
              bp,
              tolFlood + 74,
              lumFlood - 0.26,
              satFlood + 0.22
            ) &&
            !pixelAnchoredToOpaqueInterior(alphaPrev, px, py, rp, gp, bp)
          ) {
            d[ip + 3] = 0;
          } else {
            d[ip + 3] = 255;
          }
        }
      }
    }

    function shaveOpaqueMatteBoundary() {
      var px;
      var py;
      var iix;
      var iip;
      var d2;
      var clearCt;
      var iter;
      for (iter = 0; iter < 3; iter++) {
        for (py = 0; py < h; py++) {
          for (px = 0; px < w; px++) {
            alphaPrev[ix(px, py)] = d[ix(px, py) * 4 + 3];
          }
        }
        for (py = 0; py < h; py++) {
          for (px = 0; px < w; px++) {
            iix = ix(px, py);
            if (alphaPrev[iix] === 0) continue;
            clearCt = 0;
            for (d2 = 0; d2 < 8; d2++) {
              nx = px + dirs[d2][0];
              ny = py + dirs[d2][1];
              if (nx < 0 || ny < 0 || nx >= w || ny >= h) {
                clearCt++;
              } else if (alphaPrev[ix(nx, ny)] === 0) {
                clearCt++;
              }
            }
            if (clearCt < 3) continue;
            iip = iix * 4;
            nr = d[iip];
            ng = d[iip + 1];
            nb = d[iip + 2];
            if (
              matteLikePeel(
                cornerRef,
                borderRef,
                clearedMatteRef,
                nr,
                ng,
                nb,
                tolFlood + 52,
                lumFlood - 0.16,
                satFlood + 0.18
              ) &&
              !pixelAnchoredToOpaqueInterior(alphaPrev, px, py, nr, ng, nb)
            ) {
              d[iip + 3] = 0;
            }
          }
        }
      }
    }

    /** Near-neutral JPEG fringe hugging transparency after main halo/shave. */
    function peelResidualStudioFringe(rounds) {
      var rnd;
      var px;
      var py;
      var ls;
      var hit;
      var distK;
      var postRef;
      for (rnd = 0; rnd < rounds; rnd++) {
        postRef = sampleClearedMatteMedian(160);
        if (postRef) clearedMatteRef = postRef;
        for (py = 0; py < h; py++) {
          for (px = 0; px < w; px++) {
            alphaPrev[ix(px, py)] = d[ix(px, py) * 4 + 3];
          }
        }
        for (py = 0; py < h; py++) {
          for (px = 0; px < w; px++) {
            ii = ix(px, py);
            if (alphaPrev[ii] === 0) continue;
            touchesClear = false;
            for (dd = 0; dd < 8; dd++) {
              nx = px + dirs[dd][0];
              ny = py + dirs[dd][1];
              if (nx < 0 || ny < 0 || nx >= w || ny >= h) {
                touchesClear = true;
                break;
              }
              if (alphaPrev[ix(nx, ny)] === 0) {
                touchesClear = true;
                break;
              }
            }
            if (!touchesClear) continue;
            ni = ii * 4;
            nr = d[ni];
            ng = d[ni + 1];
            nb = d[ni + 2];
            ls = lumSatRGB(nr, ng, nb);
            if (ls.lum < 0.26 || ls.lum > 0.996) continue;
            if (ls.sat > 0.55) continue;
            hit = false;
            distK = clearedMatteRef ? colorDist(clearedMatteRef, nr, ng, nb) : 999;
            if (clearedMatteRef && distK <= 72 + rnd * 11) hit = true;
            if (
              !hit &&
              matteLikePeel(
                cornerRef,
                borderRef,
                clearedMatteRef,
                nr,
                ng,
                nb,
                tolFlood + 94 + rnd * 14,
                0.095,
                0.79
              )
            ) {
              hit = true;
            }
            if (
              !hit &&
              clearedMatteRef &&
              ls.sat < 0.24 &&
              ls.lum >= 0.34 &&
              distK <= 112 + rnd * 12
            ) {
              hit = true;
            }
            if (
              hit &&
              !pixelAnchoredToOpaqueInterior(alphaPrev, px, py, nr, ng, nb)
            ) {
              d[ni + 3] = 0;
            }
          }
        }
      }
    }

    snapSemiTransparentFringe();
    shaveOpaqueMatteBoundary();
    peelResidualStudioFringe(6);
    snapSemiTransparentFringe();

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
            var png = knockOutMatteFromImage(im);
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
    artWrap.style.transform = 'translate3d(-50%, -50%, 0) rotate(' + rot + 'deg)';
    if (scaleInput && scaleVal) {
      var swClamped = clamp(Math.round(sw), MIN_SW, MAX_SW);
      scaleInput.value = String(swClamped);
      scaleVal.textContent = swClamped + '%';
    }
    if (rotateInput && rotateVal) {
      var rotNorm = Math.round(rot);
      rotateInput.value = String(clamp(rotNorm, Number(rotateInput.min), Number(rotateInput.max)));
      rotateVal.textContent = rotNorm + '°';
    }
  }

  function ensureArtHandles() {
    if (handlesEl) return handlesEl;
    handlesEl = document.createElement('div');
    handlesEl.className = 'nvr-art-handles';
    handlesEl.setAttribute('aria-hidden', 'true');
    ['nw', 'ne', 'sw', 'se', 'rotate'].forEach(function (name) {
      var el = document.createElement('span');
      el.className = 'nvr-handle nvr-handle--' + name;
      el.dataset.handle = name;
      el.setAttribute('role', 'presentation');
      handlesEl.appendChild(el);
    });
    artWrap.appendChild(handlesEl);
    return handlesEl;
  }

  /** JPEG EXIF Orientation tag (1–8); 1 = no transform. */
  function readExifOrientation(arrayBuffer) {
    var view = new DataView(arrayBuffer);
    if (view.byteLength < 12 || view.getUint16(0, false) !== 0xffd8) return 1;
    var offset = 2;
    while (offset + 4 < view.byteLength) {
      if (view.getUint8(offset) !== 0xff) return 1;
      var marker = view.getUint8(offset + 1);
      if (marker === 0xe1) {
        if (view.byteLength < offset + 10 || view.getUint32(offset + 4, false) !== 0x45786966) {
          return 1;
        }
        var tiff = offset + 10;
        var le = view.getUint16(tiff, false) === 0x4949;
        var u16 = function (p) {
          return view.getUint16(p, le);
        };
        var u32 = function (p) {
          return view.getUint32(p, le);
        };
        if (u16(tiff) !== 42) return 1;
        var ifd0 = tiff + u32(tiff + 4);
        if (ifd0 + 2 > view.byteLength) return 1;
        var n = u16(ifd0);
        for (var i = 0; i < n; i++) {
          var e = ifd0 + 2 + i * 12;
          if (e + 12 > view.byteLength) break;
          if (u16(e) === 274) {
            var v = u16(e + 8);
            return v >= 1 && v <= 8 ? v : 1;
          }
        }
        return 1;
      }
      if (marker === 0xda || marker === 0xd9) break;
      var len = view.getUint16(offset + 2, false);
      if (len < 2) return 1;
      offset += 2 + len;
    }
    return 1;
  }

  function canvasSizeForExif(orientation, w, h) {
    if (orientation >= 5 && orientation <= 8) return { width: h, height: w };
    return { width: w, height: h };
  }

  function drawSourceWithExif(ctx, source, orientation, srcW, srcH) {
    var cw = ctx.canvas.width;
    var ch = ctx.canvas.height;
    ctx.save();
    switch (orientation) {
      case 2:
        ctx.translate(cw, 0);
        ctx.scale(-1, 1);
        break;
      case 3:
        ctx.translate(cw, ch);
        ctx.rotate(Math.PI);
        break;
      case 4:
        ctx.translate(0, ch);
        ctx.scale(1, -1);
        break;
      case 5:
        ctx.translate(cw, 0);
        ctx.rotate(Math.PI / 2);
        ctx.scale(-1, 1);
        break;
      case 6:
        ctx.translate(cw, 0);
        ctx.rotate(Math.PI / 2);
        break;
      case 7:
        ctx.translate(0, ch);
        ctx.rotate(-Math.PI / 2);
        ctx.scale(-1, 1);
        break;
      case 8:
        ctx.translate(0, ch);
        ctx.rotate(-Math.PI / 2);
        break;
      default:
        break;
    }
    ctx.drawImage(source, 0, 0, srcW, srcH);
    ctx.restore();
  }

  function bitmapToPreviewUrl(bitmap, file, exifOrientation, usedExifAuto, callback) {
    var srcW = bitmap.width;
    var srcH = bitmap.height;
    if (!srcW || !srcH) {
      if (bitmap.close) bitmap.close();
      callback(null, 'raw');
      return;
    }
    var orient = usedExifAuto ? 1 : exifOrientation;
    var size = canvasSizeForExif(orient, srcW, srcH);
    var canvas = document.createElement('canvas');
    canvas.width = size.width;
    canvas.height = size.height;
    var ctx = canvas.getContext('2d');
    if (!ctx) {
      if (bitmap.close) bitmap.close();
      callback(null, 'raw');
      return;
    }
    if (orient === 1) {
      ctx.drawImage(bitmap, 0, 0);
    } else {
      drawSourceWithExif(ctx, bitmap, orient, srcW, srcH);
    }
    if (bitmap.close) bitmap.close();

    var mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    var quality = mime === 'image/jpeg' ? 0.92 : undefined;
    canvas.toBlob(
      function (blob) {
        if (!blob) {
          callback(null, 'raw');
          return;
        }
        callback(URL.createObjectURL(blob), 'baked');
      },
      mime,
      quality
    );
  }

  /**
   * Room photo preview: EXIF-aware, no crop (CSS contain), no forced landscape.
   */
  function loadRoomPreviewFromFile(file, callback) {
    if (!file || !/^image\//.test(file.type)) {
      callback(null, 'raw');
      return;
    }

    function finish(url, mode) {
      callback(url, mode || 'raw');
    }

    function rawBlobFallback() {
      finish(URL.createObjectURL(file), 'raw');
    }

    var reader = new FileReader();
    reader.onerror = rawBlobFallback;
    reader.onload = function () {
      var buffer = reader.result;
      var exifOrient = readExifOrientation(buffer);
      var blob = new Blob([buffer], { type: file.type || 'image/jpeg' });

      if (typeof createImageBitmap !== 'function') {
        var img = new Image();
        img.onload = function () {
          var c = document.createElement('canvas');
          var sz = canvasSizeForExif(exifOrient, img.naturalWidth, img.naturalHeight);
          c.width = sz.width;
          c.height = sz.height;
          var cx = c.getContext('2d');
          if (!cx) {
            URL.revokeObjectURL(img.src);
            rawBlobFallback();
            return;
          }
          if (exifOrient === 1) {
            cx.drawImage(img, 0, 0);
          } else {
            drawSourceWithExif(cx, img, exifOrient, img.naturalWidth, img.naturalHeight);
          }
          URL.revokeObjectURL(img.src);
          var mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          c.toBlob(
            function (b) {
              if (!b) rawBlobFallback();
              else finish(URL.createObjectURL(b), 'baked');
            },
            mime,
            mime === 'image/jpeg' ? 0.92 : undefined
          );
        };
        img.onerror = rawBlobFallback;
        img.src = URL.createObjectURL(blob);
        return;
      }

      createImageBitmap(blob, { imageOrientation: 'from-image' })
        .then(function (bitmap) {
          bitmapToPreviewUrl(bitmap, file, exifOrient, true, finish);
        })
        .catch(function () {
          createImageBitmap(blob)
            .then(function (bitmap) {
              bitmapToPreviewUrl(bitmap, file, exifOrient, false, finish);
            })
            .catch(rawBlobFallback);
        });
    };
    reader.readAsArrayBuffer(file);
  }

  function clearRoomPreviewState() {
    if (fullscreenPreviewVisible) {
      closeFullscreenPreview();
    }
    if (roomObjectUrl) {
      URL.revokeObjectURL(roomObjectUrl);
      roomObjectUrl = null;
    }
    roomImg.removeAttribute('data-nvr-orient');
    roomImg.removeAttribute('src');
    roomImg.src = '';
  }

  function applyRoomPreviewSrc(url, orientMode) {
    if (!url) return;
    clearRoomPreviewState();
    roomObjectUrl = url;
    roomImg.src = url;
    if (orientMode === 'baked') {
      roomImg.setAttribute('data-nvr-orient', 'baked');
    } else {
      roomImg.setAttribute('data-nvr-orient', 'raw');
    }
  }

  function revealStage(show) {
    placeholder.hidden = show;
    stageWrap.hidden = !show;
    resetBtn.dataset.visible = show ? '1' : '0';
    if (!show) roomImg.removeAttribute('src');
    if (heroVisual) heroVisual.classList.toggle('nvr-hero-visual--live', !!show);
  }

  function rememberStageHome() {
    stageRestoreParent = stage.parentNode;
    stageRestoreNext = stage.nextSibling;
  }

  function restoreStageHome() {
    if (!stageRestoreParent) return;
    if (stageRestoreNext) {
      stageRestoreParent.insertBefore(stage, stageRestoreNext);
    } else {
      stageRestoreParent.appendChild(stage);
    }
    stageRestoreParent = null;
    stageRestoreNext = null;
  }

  function prepareStageForFullscreen() {
    stage.classList.add('nvr-stage--fullscreen');
    roomImg.style.pointerEvents = 'none';
    artWrap.style.pointerEvents = 'auto';
    artWrap.style.touchAction = 'none';
    if (handlesEl) handlesEl.style.pointerEvents = 'auto';
    stage.style.touchAction = 'none';
  }

  function restoreStageInlineStyles() {
    stage.classList.remove('nvr-stage--fullscreen');
    roomImg.style.pointerEvents = '';
    artWrap.style.pointerEvents = '';
    artWrap.style.touchAction = '';
    if (handlesEl) handlesEl.style.pointerEvents = '';
    stage.style.touchAction = '';
  }

  function cancelActiveGesture() {
    stage.removeEventListener('touchmove', onStageTouchMove, NON_PASSIVE);
    stage.removeEventListener('touchend', onStageTouchEnd);
    stage.removeEventListener('touchcancel', onStageTouchEnd);
    window.removeEventListener('pointermove', onStagePointerMove, NON_PASSIVE);
    window.removeEventListener('pointerup', onStagePointerUp);
    window.removeEventListener('pointercancel', onStagePointerUp);
    gesture.mode = null;
    gesture.handle = null;
    gesture.pointers.clear();
    artWrap.classList.remove('is-dragging', 'is-gesturing');
  }

  function setFullscreenInteractionTargets() {
    interactiveStage = stage;
    interactiveArtWrap = artWrap;
  }

  function clearFullscreenInteractionTargets() {
    interactiveStage = stage;
    interactiveArtWrap = artWrap;
  }

  function handleNameFromTarget(target) {
    var el = target && target.closest ? target.closest('[data-handle]') : null;
    return el ? el.dataset.handle : null;
  }

  function isArtTarget(target) {
    return !!(target && target.closest && target.closest('#nvrArtWrap') && !artWrap.hidden);
  }

  function artCenterClient() {
    var rect = artWrap.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }

  function touchPairDist(t0, t1) {
    return Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
  }

  function touchPairAngle(t0, t1) {
    return Math.atan2(t1.clientY - t0.clientY, t1.clientX - t0.clientX);
  }

  function touchPairCenter(t0, t1) {
    return { x: (t0.clientX + t1.clientX) / 2, y: (t0.clientY + t1.clientY) / 2 };
  }

  function beginPan(clientX, clientY) {
    var r = stageRect();
    gesture.mode = 'pan';
    gesture.panX = clientX;
    gesture.panY = clientY;
    gesture.cx0 = cx;
    gesture.cy0 = cy;
    gesture.stageW = r.width;
    gesture.stageH = r.height;
    artWrap.classList.add('is-dragging', 'is-gesturing');
  }

  function updatePan(clientX, clientY) {
    var dx = clientX - gesture.panX;
    var dy = clientY - gesture.panY;
    cx = clamp(gesture.cx0 + (dx / gesture.stageW) * 100, 2, 98);
    cy = clamp(gesture.cy0 + (dy / gesture.stageH) * 100, 2, 98);
    applyArtTransform();
  }

  function beginPinch(t0, t1) {
    var r = stageRect();
    gesture.mode = 'pinch';
    gesture.dist0 = touchPairDist(t0, t1);
    gesture.angle0 = touchPairAngle(t0, t1);
    gesture.sw0 = sw;
    gesture.rot0 = rot;
    gesture.cx0 = cx;
    gesture.cy0 = cy;
    gesture.pinchCenter0 = touchPairCenter(t0, t1);
    gesture.stageW = r.width;
    gesture.stageH = r.height;
    artWrap.classList.add('is-gesturing');
  }

  function updatePinch(t0, t1) {
    if (gesture.dist0 <= 0) return;
    var dist = touchPairDist(t0, t1);
    var angle = touchPairAngle(t0, t1);
    var ratio = dist / gesture.dist0;
    sw = clamp(gesture.sw0 * ratio, MIN_SW, MAX_SW);
    rot = gesture.rot0 + ((angle - gesture.angle0) * 180) / Math.PI;
    var center = touchPairCenter(t0, t1);
    var dx = center.x - gesture.pinchCenter0.x;
    var dy = center.y - gesture.pinchCenter0.y;
    cx = clamp(gesture.cx0 + (dx / gesture.stageW) * 100, 2, 98);
    cy = clamp(gesture.cy0 + (dy / gesture.stageH) * 100, 2, 98);
    applyArtTransform();
  }

  function beginHandleDrag(handle, clientX, clientY) {
    var center = artCenterClient();
    gesture.mode = 'handle';
    gesture.handle = handle;
    gesture.sw0 = sw;
    gesture.rot0 = rot;
    gesture.dist0 = Math.max(24, Math.hypot(clientX - center.x, clientY - center.y));
    gesture.angle0 = Math.atan2(clientY - center.y, clientX - center.x);
    gesture.px0 = clientX;
    gesture.py0 = clientY;
    artWrap.classList.add('is-gesturing');
  }

  function updateHandleDrag(clientX, clientY) {
    var center = artCenterClient();
    if (gesture.handle === 'rotate') {
      var ang = Math.atan2(clientY - center.y, clientX - center.x);
      rot = gesture.rot0 + ((ang - gesture.angle0) * 180) / Math.PI;
      applyArtTransform();
      return;
    }
    var dist = Math.max(24, Math.hypot(clientX - center.x, clientY - center.y));
    var ratio = dist / gesture.dist0;
    sw = clamp(gesture.sw0 * ratio, MIN_SW, MAX_SW);
    applyArtTransform();
  }

  function onStageTouchStart(e) {
    if (artWrap.hidden) return;
    var handle = handleNameFromTarget(e.target);
    if (handle) {
      e.preventDefault();
      beginHandleDrag(handle, e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      stage.addEventListener('touchmove', onStageTouchMove, NON_PASSIVE);
      stage.addEventListener('touchend', onStageTouchEnd, NON_PASSIVE);
      stage.addEventListener('touchcancel', onStageTouchEnd, NON_PASSIVE);
      return;
    }
    if (!isArtTarget(e.target)) return;
    if (e.touches.length >= 2) {
      e.preventDefault();
      beginPinch(e.touches[0], e.touches[1]);
    } else if (e.touches.length === 1) {
      e.preventDefault();
      beginPan(e.touches[0].clientX, e.touches[0].clientY);
    }
    stage.addEventListener('touchmove', onStageTouchMove, NON_PASSIVE);
    stage.addEventListener('touchend', onStageTouchEnd, NON_PASSIVE);
    stage.addEventListener('touchcancel', onStageTouchEnd, NON_PASSIVE);
  }

  function onStageTouchMove(e) {
    if (!gesture.mode) return;
    if (gesture.mode === 'handle' && e.touches.length >= 1) {
      e.preventDefault();
      var t = e.touches[0];
      updateHandleDrag(t.clientX, t.clientY);
      return;
    }
    if (gesture.mode === 'pinch' && e.touches.length >= 2) {
      e.preventDefault();
      updatePinch(e.touches[0], e.touches[1]);
      return;
    }
    if (gesture.mode === 'pan' && e.touches.length === 1) {
      e.preventDefault();
      updatePan(e.touches[0].clientX, e.touches[0].clientY);
      return;
    }
    if (e.touches.length >= 2 && isArtTarget(e.target)) {
      e.preventDefault();
      beginPinch(e.touches[0], e.touches[1]);
      updatePinch(e.touches[0], e.touches[1]);
    }
  }

  function onStageTouchEnd(e) {
    if (e.touches.length >= 2 && gesture.mode === 'pinch') {
      beginPinch(e.touches[0], e.touches[1]);
      return;
    }
    if (e.touches.length === 1 && gesture.mode === 'pinch') {
      beginPan(e.touches[0].clientX, e.touches[0].clientY);
      return;
    }
    if (e.touches.length === 0) {
      cancelActiveGesture();
    }
  }

  function onStagePointerDown(e) {
    if (artWrap.hidden) return;
    if (e.pointerType === 'touch') return;
    if (e.button !== 0) return;
    var handle = handleNameFromTarget(e.target);
    if (handle) {
      e.preventDefault();
      beginHandleDrag(handle, e.clientX, e.clientY);
      gesture.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      window.addEventListener('pointermove', onStagePointerMove, NON_PASSIVE);
      window.addEventListener('pointerup', onStagePointerUp);
      window.addEventListener('pointercancel', onStagePointerUp);
      return;
    }
    if (!isArtTarget(e.target)) return;
    e.preventDefault();
    gesture.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (gesture.pointers.size >= 2) {
      var pts = Array.from(gesture.pointers.values());
      beginPinch({ clientX: pts[0].x, clientY: pts[0].y }, { clientX: pts[1].x, clientY: pts[1].y });
    } else {
      beginPan(e.clientX, e.clientY);
    }
    window.addEventListener('pointermove', onStagePointerMove, NON_PASSIVE);
    window.addEventListener('pointerup', onStagePointerUp);
    window.addEventListener('pointercancel', onStagePointerUp);
  }

  function onStagePointerMove(e) {
    if (e.pointerType === 'touch') return;
    if (!gesture.mode) return;
    if (!gesture.pointers.has(e.pointerId) && gesture.mode !== 'handle') return;
    gesture.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (gesture.mode === 'handle') {
      e.preventDefault();
      updateHandleDrag(e.clientX, e.clientY);
      return;
    }
    if (gesture.pointers.size >= 2) {
      e.preventDefault();
      var pts = Array.from(gesture.pointers.values());
      if (gesture.mode !== 'pinch') {
        beginPinch({ clientX: pts[0].x, clientY: pts[0].y }, { clientX: pts[1].x, clientY: pts[1].y });
      }
      updatePinch({ clientX: pts[0].x, clientY: pts[0].y }, { clientX: pts[1].x, clientY: pts[1].y });
      return;
    }
    if (gesture.mode === 'pan') {
      e.preventDefault();
      updatePan(e.clientX, e.clientY);
    }
  }

  function onStagePointerUp(e) {
    if (e.pointerType === 'touch') return;
    gesture.pointers.delete(e.pointerId);
    if (gesture.pointers.size >= 2) {
      var pts = Array.from(gesture.pointers.values());
      beginPinch({ clientX: pts[0].x, clientY: pts[0].y }, { clientX: pts[1].x, clientY: pts[1].y });
      return;
    }
    if (gesture.pointers.size === 1) {
      var rem = Array.from(gesture.pointers.values())[0];
      beginPan(rem.x, rem.y);
      return;
    }
    cancelActiveGesture();
  }

  function initArtGestures() {
    ensureArtHandles();
    stage.addEventListener('touchstart', onStageTouchStart, NON_PASSIVE);
    stage.addEventListener('pointerdown', onStagePointerDown, NON_PASSIVE);
  }

  function ensureFullscreenPreviewModal() {
    if (fullscreenPreviewModal) return fullscreenPreviewModal;

    fullscreenPreviewModal = document.createElement('div');
    fullscreenPreviewModal.className = 'nvr-fullscreen-preview';
    fullscreenPreviewModal.setAttribute('aria-hidden', 'true');
    fullscreenPreviewModal.innerHTML = '<div class="nvr-fullscreen-preview__backdrop"></div><div class="nvr-fullscreen-preview__frame"><div class="nvr-fullscreen-preview__scene"></div><button type="button" class="nvr-fullscreen-preview__close" aria-label="Close fullscreen preview">&times;</button></div>';
    fullscreenPreviewScene = fullscreenPreviewModal.querySelector('.nvr-fullscreen-preview__scene');
    var backdrop = fullscreenPreviewModal.querySelector('.nvr-fullscreen-preview__backdrop');
    var closeBtn = fullscreenPreviewModal.querySelector('.nvr-fullscreen-preview__close');

    backdrop.addEventListener('click', closeFullscreenPreview);
    closeBtn.addEventListener('click', closeFullscreenPreview);
    fullscreenPreviewModal.addEventListener('click', function (event) {
      if (
        event.target === fullscreenPreviewModal ||
        event.target.classList.contains('nvr-fullscreen-preview__backdrop')
      ) {
        closeFullscreenPreview();
      }
    });

    fullscreenPreviewScene.addEventListener('click', function (event) {
      if (!event.target.closest('.nvr-art-wrap, .nvr-handle')) {
        event.stopPropagation();
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && fullscreenPreviewVisible) {
        closeFullscreenPreview();
      }
    });

    document.body.appendChild(fullscreenPreviewModal);
    return fullscreenPreviewModal;
  }

  function openFullscreenPreview() {
    if (!roomImg.getAttribute('src')) return;
    if (fullscreenPreviewVisible) return;
    ensureFullscreenPreviewModal();

    rememberStageHome();
    prepareStageForFullscreen();
    /* Move live stage (not a clone) — keeps artWrap/corner listeners and transform state */
    fullscreenPreviewScene.appendChild(stage);
    setFullscreenInteractionTargets();
    applyArtTransform();

    fullscreenPreviewModal.setAttribute('aria-hidden', 'false');
    fullscreenPreviewModal.classList.add('is-open');
    fullscreenPreviewVisible = true;
    if (fullscreenCloseTimer) {
      clearTimeout(fullscreenCloseTimer);
    }
    requestAnimationFrame(function () {
      fullscreenPreviewModal.classList.add('is-visible');
    });
  }

  function closeFullscreenPreview() {
    if (!fullscreenPreviewModal || !fullscreenPreviewVisible) return;
    fullscreenPreviewVisible = false;
    fullscreenPreviewModal.classList.remove('is-visible');

    cancelActiveGesture();

    if (stage.parentNode === fullscreenPreviewScene) {
      restoreStageHome();
    }
    restoreStageInlineStyles();
    clearFullscreenInteractionTargets();

    if (fullscreenCloseTimer) {
      clearTimeout(fullscreenCloseTimer);
    }
    fullscreenCloseTimer = setTimeout(function () {
      fullscreenPreviewModal.classList.remove('is-open');
      fullscreenPreviewModal.setAttribute('aria-hidden', 'true');
    }, 180);
  }

  function updateArtVisibility() {
    const hasRoom = !!roomImg.getAttribute('src');
    const hasArt = !!(selectedId && artImg.getAttribute('src'));
    artWrap.hidden = !(hasRoom && hasArt);
    if (hasRoom && hasArt) {
      ensureArtHandles();
      artWrap.classList.add('is-editing');
    } else {
      artWrap.classList.remove('is-editing', 'is-gesturing', 'is-dragging');
    }
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
    return (interactiveStage && interactiveStage.getBoundingClientRect) ? interactiveStage.getBoundingClientRect() : stage.getBoundingClientRect();
  }

  function clamp(n, lo, hi) {
    return Math.min(hi, Math.max(lo, n));
  }

  scaleInput.addEventListener('input', () => {
    sw = clamp(Number(scaleInput.value), MIN_SW, MAX_SW);
    applyArtTransform();
  });

  rotateInput.addEventListener('input', () => {
    rot = clamp(Number(rotateInput.value), Number(rotateInput.min), Number(rotateInput.max));
    applyArtTransform();
  });

  roomImg.addEventListener('click', function () {
    if (!roomImg.getAttribute('src')) return;
    openFullscreenPreview();
  });

  fileInput.addEventListener('change', () => {
    const f = fileInput.files && fileInput.files[0];
    if (!f || !/^image\//.test(f.type)) return;
    const uploadToken = ++activeUploadToken;
    clearRoomPreviewState();
    loadRoomPreviewFromFile(f, function (url, orientMode) {
      if (uploadToken !== activeUploadToken) return;
      if (!url) return;
      applyRoomPreviewSrc(url, orientMode);
      revealStage(true);
      updateArtVisibility();
    });
  });

  resetBtn.addEventListener('click', () => {
    activeUploadToken += 1;
    clearRoomPreviewState();
    fileInput.value = '';
    revealStage(false);
    updateArtVisibility();
  });

  if (expandBtn) {
    expandBtn.addEventListener('click', () => {
      openFullscreenPreview();
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
    initArtGestures();

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
