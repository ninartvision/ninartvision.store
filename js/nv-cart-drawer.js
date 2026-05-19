/**
 * Ninart Vision — right-side inquiry cart drawer
 * Load after nv-gallery-modal.min.js, before or with script.min.js
 */
(function (global) {
  'use strict';

  const STORAGE_KEY = 'nv_cart_items';
  const ADDON_GEL = { frame: 50, gift: 10, courier: 5 };
  const DEFAULT_WA = '995579388833';

  function parsePriceNum(raw) {
    const n = Number(String(raw || '').replace(/[^\d.]/g, ''));
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  function fmtGel(n) {
    if (!n) return '';
    return '\u20BE' + n.toLocaleString('en-US');
  }

  function resolveArtist(artistId) {
    const id = String(artistId || '').toLowerCase().trim();
    return global.CURRENT_ARTIST || global.ARTISTS?.find(a => a.id === id) || null;
  }

  function readItems() {
    try {
      const raw = global.localStorage?.getItem(STORAGE_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  function writeItems(items) {
    try {
      global.localStorage?.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
    if (typeof global.nvSyncCartBadges === 'function') global.nvSyncCartBadges();
    render();
  }

  function itemIdFromDataset(ds) {
    return String(ds.slug || ds.id || ds.title || '').trim() || 'item-' + Date.now();
  }

  function lineUnitPrice(item) {
    let total = parsePriceNum(item.price);
    if (item.addons?.frame) total += ADDON_GEL.frame;
    if (item.addons?.gift) total += ADDON_GEL.gift;
    if (item.addons?.courier) total += ADDON_GEL.courier;
    return total;
  }

  function lineTotal(item) {
    return lineUnitPrice(item) * (item.qty || 1);
  }

  function cartTotalQty(items) {
    return items.reduce((s, i) => s + (i.qty || 1), 0);
  }

  function cartSubtotal(items) {
    return items.reduce((s, i) => s + lineTotal(i), 0);
  }

  function addonLabels(item) {
    const parts = [];
    if (item.addons?.frame) parts.push('ჩარჩო (+50 ₾)');
    if (item.addons?.gift) parts.push('სასაჩუქრე შეფუთვა (+10 ₾)');
    if (item.addons?.courier) parts.push('საკურიერო (+5 ₾)');
    return parts;
  }

  function shopItemThumb(el) {
    const img = el.querySelector('img');
    return img?.currentSrc || img?.src || '';
  }

  let root = null;
  let bodyEl = null;
  let subtotalEl = null;

  function mount() {
    if (document.getElementById('nvCartDrawer')) return;

    const wrap = document.createElement('div');
    wrap.id = 'nvCartDrawer';
    wrap.className = 'nv-cart-drawer';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.innerHTML =
      '<div class="nv-cart-drawer__backdrop" data-nv-cart-close tabindex="-1" aria-hidden="true"></div>' +
      '<aside class="nv-cart-drawer__panel" role="dialog" aria-modal="true" aria-labelledby="nvCartDrawerTitle">' +
      '<header class="nv-cart-drawer__head">' +
      '<h2 class="nv-cart-drawer__title" id="nvCartDrawerTitle">Your cart</h2>' +
      '<button type="button" class="nv-cart-drawer__close" data-nv-cart-close aria-label="Close cart">✕</button>' +
      '</header>' +
      '<div class="nv-cart-drawer__body" id="nvCartDrawerBody"></div>' +
      '<footer class="nv-cart-drawer__checkout">' +
      '<div class="nv-cart-drawer__subtotal">' +
      '<span class="nv-cart-drawer__subtotal-label">Subtotal</span>' +
      '<span class="nv-cart-drawer__subtotal-val" id="nvCartSubtotal">₾0</span>' +
      '</div>' +
      '<button type="button" class="nv-cart-drawer__pay nv-cart-drawer__pay--tbc" id="nvCartPayTbc">Pay with TBC Bank</button>' +
      '<button type="button" class="nv-cart-drawer__pay nv-cart-drawer__pay--wa" id="nvCartPayWhatsApp">Order via WhatsApp</button>' +
      '<p class="nv-cart-drawer__pay-note">TBC: we send transfer details after you confirm. WhatsApp: instant order message.</p>' +
      '</footer>' +
      '</aside>';

    document.body.appendChild(wrap);
    root = wrap;
    bodyEl = document.getElementById('nvCartDrawerBody');
    subtotalEl = document.getElementById('nvCartSubtotal');

    wrap.querySelectorAll('[data-nv-cart-close]').forEach(el => {
      el.addEventListener('click', close);
    });

    document.getElementById('nvCartPayTbc')?.addEventListener('click', checkoutTbc);
    document.getElementById('nvCartPayWhatsApp')?.addEventListener('click', checkoutWhatsApp);

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && root?.classList.contains('is-open')) close();
    });

    document.querySelectorAll('a.header-cart, a.menu-link-cart').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        open();
      });
    });

    global.addEventListener('storage', e => {
      if (e.key === STORAGE_KEY) render();
    });
  }

  function render() {
    if (!bodyEl) return;
    const items = readItems();
    if (subtotalEl) subtotalEl.textContent = fmtGel(cartSubtotal(items)) || '₾0';

    if (!items.length) {
      bodyEl.innerHTML =
        '<p class="nv-cart-drawer__empty">Your cart is empty. Add an artwork from the shop or gallery.</p>';
      return;
    }

    bodyEl.innerHTML = items
      .map((item, index) => {
        const addons = addonLabels(item);
        const addonsHtml = addons.length
          ? '<p class="nv-cart-drawer__addons">' + addons.join(' · ') + '</p>'
          : '';
        const thumb = item.image
          ? '<img class="nv-cart-drawer__thumb" src="' +
            escapeAttr(item.image) +
            '" alt="" decoding="async" loading="lazy">'
          : '<div class="nv-cart-drawer__thumb" aria-hidden="true"></div>';
        return (
          '<article class="nv-cart-drawer__item" data-nv-cart-index="' +
          index +
          '">' +
          thumb +
          '<div class="nv-cart-drawer__item-main">' +
          '<h3 class="nv-cart-drawer__item-title">' +
          escapeHtml(item.title || 'Untitled') +
          '</h3>' +
          (item.artistName
            ? '<p class="nv-cart-drawer__item-artist">' + escapeHtml(item.artistName) + '</p>'
            : '') +
          addonsHtml +
          '<div class="nv-cart-drawer__item-row">' +
          '<div class="nv-cart-drawer__qty">' +
          '<button type="button" data-nv-cart-qty="-1" aria-label="Decrease quantity">−</button>' +
          '<span class="nv-cart-drawer__qty-val">' +
          (item.qty || 1) +
          '</span>' +
          '<button type="button" data-nv-cart-qty="1" aria-label="Increase quantity">+</button>' +
          '</div>' +
          '<span class="nv-cart-drawer__item-price">' +
          fmtGel(lineTotal(item)) +
          '</span>' +
          '</div>' +
          '<button type="button" class="nv-cart-drawer__remove" data-nv-cart-remove>Remove</button>' +
          '</div>' +
          '</article>'
        );
      })
      .join('');

    bodyEl.querySelectorAll('[data-nv-cart-qty]').forEach(btn => {
      btn.addEventListener('click', () => {
        const row = btn.closest('.nv-cart-drawer__item');
        const idx = Number(row?.dataset.nvCartIndex);
        const delta = Number(btn.dataset.nvCartQty);
        if (!Number.isFinite(idx) || !Number.isFinite(delta)) return;
        const list = readItems();
        const it = list[idx];
        if (!it) return;
        it.qty = Math.max(1, (it.qty || 1) + delta);
        writeItems(list);
      });
    });

    bodyEl.querySelectorAll('[data-nv-cart-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.closest('.nv-cart-drawer__item')?.dataset.nvCartIndex);
        if (!Number.isFinite(idx)) return;
        const list = readItems();
        list.splice(idx, 1);
        writeItems(list);
      });
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escapeAttr(s) {
    return escapeHtml(s).replace(/'/g, '&#39;');
  }

  function open() {
    mount();
    render();
    root?.classList.add('is-open');
    root?.setAttribute('aria-hidden', 'false');
    document.body.classList.add('nv-cart-drawer-open');
    root?.querySelector('.nv-cart-drawer__close')?.focus();
  }

  function close() {
    root?.classList.remove('is-open');
    root?.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('nv-cart-drawer-open');
  }

  function addFromShopItem(el, options = {}) {
    if (!el?.dataset) return;
    const ds = el.dataset;
    const sold =
      String(ds.isSold || '').toLowerCase() === 'true' ||
      String(ds.status || '').toLowerCase().trim() === 'sold';
    if (sold) return;

    const id = itemIdFromDataset(ds);
    const artist = resolveArtist(ds.artist);
    const list = readItems();
    let item = list.find(i => i.id === id);
    const addons = {
      frame: Boolean(options.frameSelection),
      gift: Boolean(options.giftPackaging),
      courier: Boolean(options.courierDelivery),
    };

    if (item) {
      item.qty = (item.qty || 1) + 1;
      if (addons.frame) item.addons = { ...item.addons, frame: true };
      if (addons.gift) item.addons = { ...item.addons, gift: true };
      if (addons.courier) item.addons = { ...item.addons, courier: true };
    } else {
      item = {
        id,
        title: ds.title || '',
        price: parsePriceNum(ds.price),
        artistName: ds.artistName || artist?.name || '',
        artistId: ds.artist || '',
        image: ds.image || shopItemThumb(el),
        slug: ds.slug || '',
        qty: 1,
        addons,
      };
      list.push(item);
    }

    writeItems(list);
    if (typeof global.trackArtworkClick === 'function') {
      global.trackArtworkClick(item.title, item.title, item.artistName);
    }
  }

  function buildOrderMessage(prefix) {
    const items = readItems();
    if (!items.length) return '';
    const lines = items.map((it, i) => {
      const addonStr = addonLabels(it).join(', ');
      const url = it.slug
        ? 'https://ninartvision.store/products/' + it.slug + '/'
        : '';
      return (
        (i + 1) +
        '. ' +
        (it.title || 'Artwork') +
        ' ×' +
        (it.qty || 1) +
        ' — ' +
        fmtGel(lineTotal(it)) +
        (addonStr ? ' (' + addonStr + ')' : '') +
        (url ? '\n   ' + url : '')
      );
    });
    const total = fmtGel(cartSubtotal(items));
    return prefix + '\n\n' + lines.join('\n') + '\n\nჯამი: ' + total;
  }

  function checkoutWhatsApp() {
    const items = readItems();
    if (!items.length) return;
    const first = items[0];
    const artist = resolveArtist(first.artistId);
    const phone = artist?.whatsapp || DEFAULT_WA;
    if (typeof global.trackWhatsAppClick === 'function') {
      global.trackWhatsAppClick(first.artistName || '', 'cart-drawer');
    }
    const msg = encodeURIComponent(
      buildOrderMessage('გამარჯობა, მინდა შევიძინო შემდეგი ნახატ(ებ)ი:')
    );
    global.open('https://wa.me/' + phone + '?text=' + msg, '_blank', 'noopener');
  }

  function checkoutTbc() {
    const items = readItems();
    if (!items.length) return;
    const msg = encodeURIComponent(
      buildOrderMessage('გამარჯობა, TBC Bank-ით გადახდა მინდა შემდეგი შეკვეთისთვის:')
    );
    global.open('https://wa.me/' + DEFAULT_WA + '?text=' + msg, '_blank', 'noopener');
  }

  function getTotalQty() {
    return cartTotalQty(readItems());
  }

  function init() {
    mount();
    render();
    if (typeof global.nvSyncCartBadges === 'function') global.nvSyncCartBadges();
  }

  global.nvCart = {
    addFromShopItem,
    open,
    close,
    render,
    getTotalQty,
    readItems,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : globalThis);
