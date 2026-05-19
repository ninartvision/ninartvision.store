/**
 * Ninart Vision — right-side cart drawer (presentation layer)
 * Load: injected from script.min.js after DOMContentLoaded
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

  function slugFromPath() {
    const m = String(global.location?.pathname || '').match(/\/products\/([^/]+)\/?/);
    return m ? m[1] : '';
  }

  function parseProductPageLayout(layout) {
    const root = layout || document.querySelector('section .product-layout');
    if (!root) return null;
    const right = root.querySelector('.product-right') || root;
    const h1 = right.querySelector('h1');
    const title = (h1?.textContent || '').trim();
    const priceEl = right.querySelector('.product-price');
    const mainImg = root.querySelector('#mainImg');
    const sizeLi = [...right.querySelectorAll('.product-info li')].find(li =>
      /^\s*size\s*:/i.test(li.textContent || '')
    );
    const size = sizeLi
      ? String(sizeLi.textContent || '')
          .replace(/^\s*size\s*:\s*/i, '')
          .trim()
      : '';
    const artistEl = right.querySelector('p.muted');
    const artistName = artistEl
      ? String(artistEl.textContent || '')
          .replace(/^\s*by\s+/i, '')
          .trim()
      : '';
    const slug = slugFromPath();
    return {
      id: slug || itemIdFromDataset({ slug, title }),
      title,
      price: parsePriceNum(priceEl?.textContent),
      size,
      image: mainImg?.currentSrc || mainImg?.src || '',
      slug,
      artistName,
      artistId: '',
    };
  }

  function productPageAddonOptions() {
    return {
      frameSelection: Boolean(document.getElementById('frameSelectionToggle')?.checked),
      giftPackaging: Boolean(document.getElementById('giftPackagingToggle')?.checked),
      courierDelivery: Boolean(document.getElementById('courierDeliveryToggle')?.checked),
    };
  }

  function isStaticProductPage() {
    return (
      /\/products\//.test(String(global.location?.pathname || '')) &&
      Boolean(document.querySelector('section .product-layout')) &&
      !document.getElementById('productModal')
    );
  }

  let root = null;
  let bodyEl = null;
  let subtotalEl = null;
  let eventsBound = false;

  function mount() {
    if (document.getElementById('nvCartDrawer')) {
      root = document.getElementById('nvCartDrawer');
      bodyEl = document.getElementById('nvCartDrawerBody');
      subtotalEl = document.getElementById('nvCartSubtotal');
      return;
    }

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
      '<div class="nv-cart-drawer__banks">' +
      '<button type="button" class="nv-cart-drawer__bank nv-cart-drawer__bank--bog" id="nvCartPayBog" aria-label="საქართველოს ბანკი">' +
      '<span class="nv-cart-drawer__bank-logo">' +
      '<img src="/images/nv-logo-bog.png" alt="საქართველოს ბანკი" width="140" height="40" loading="lazy" decoding="async">' +
      '</span>' +
      '</button>' +
      '<button type="button" class="nv-cart-drawer__bank nv-cart-drawer__bank--tbc" id="nvCartPayTbc" aria-label="თიბისი ბანკი">' +
      '<span class="nv-cart-drawer__bank-logo">' +
      '<img src="/images/nv-logo-tbc.png" alt="თიბისი ბანკი" width="140" height="40" loading="lazy" decoding="async">' +
      '</span>' +
      '</button>' +
      '</div>' +
      '<button type="button" class="nv-cart-drawer__pay nv-cart-drawer__pay--wa" id="nvCartPayWhatsApp">Order via WhatsApp</button>' +
      '<p class="nv-cart-drawer__pay-note">TBC: we send transfer details after you confirm. WhatsApp: instant order message.</p>' +
      '</footer>' +
      '</aside>';

    document.body.appendChild(wrap);
    root = wrap;
    bodyEl = document.getElementById('nvCartDrawerBody');
    subtotalEl = document.getElementById('nvCartSubtotal');
  }

  function bindEvents() {
    if (eventsBound || !root) return;
    eventsBound = true;

    root.querySelectorAll('[data-nv-cart-close]').forEach(el => {
      el.addEventListener('click', close);
    });

    document.getElementById('nvCartPayBog')?.addEventListener('click', checkoutBog);
    document.getElementById('nvCartPayTbc')?.addEventListener('click', checkoutTbc);
    document.getElementById('nvCartPayWhatsApp')?.addEventListener('click', checkoutWhatsApp);

    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape' || !root?.classList.contains('is-open')) return;
      const menu = document.getElementById('menuOverlay');
      if (menu?.classList.contains('active')) return;
      const modal = document.getElementById('productModal');
      if (modal?.classList.contains('open')) return;
      close();
    });

    document.querySelectorAll('a.header-cart, a.menu-link-cart').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const menu = document.getElementById('menuOverlay');
        if (menu?.classList.contains('active')) {
          document.getElementById('closeMenu')?.click();
        }
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
        const next = (it.qty || 1) + delta;
        if (next < 1) list.splice(idx, 1);
        else it.qty = next;
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
    bindEvents();
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
        size: ds.size || '',
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
  }

  function addFromProductPage(layout, options = {}) {
    const data = parseProductPageLayout(layout);
    if (!data?.title) return;
    if (layout?.querySelector?.('.status.sold')) return;

    const addons = {
      frame: Boolean(options.frameSelection),
      gift: Boolean(options.giftPackaging),
      courier: Boolean(options.courierDelivery),
    };

    const list = readItems();
    let item = list.find(i => i.id === data.id);
    if (item) {
      item.qty = (item.qty || 1) + 1;
      if (addons.frame) item.addons = { ...item.addons, frame: true };
      if (addons.gift) item.addons = { ...item.addons, gift: true };
      if (addons.courier) item.addons = { ...item.addons, courier: true };
    } else {
      item = { ...data, qty: 1, addons };
      list.push(item);
    }
    writeItems(list);
  }

  let productPageCartBound = false;

  function bindProductPageCart() {
    if (productPageCartBound || !isStaticProductPage()) return;
    productPageCartBound = true;

    const layout = document.querySelector('section .product-layout');
    if (!layout || layout.querySelector('.status.sold')) return;

    const onAdd = e => {
      e.preventDefault();
      e.stopPropagation();
      addFromProductPage(layout, productPageAddonOptions());
      open();
    };

    const addBtn = document.getElementById('addToCartBtn');
    if (addBtn && !addBtn.closest('#productModal')) {
      addBtn.addEventListener('click', onAdd);
      return;
    }

    const waBtn = layout.querySelector('.product-buy a[href*="wa.me"]');
    if (waBtn) {
      waBtn.setAttribute('href', '#');
      waBtn.addEventListener('click', onAdd);
    }
  }

  function formatCartLine(it, index) {
    const addonStr = addonLabels(it).join(', ');
    const url = it.slug ? 'https://ninartvision.store/products/' + it.slug + '/' : '';
    const parts = [
      index + 1 + '. ' + (it.title || 'Artwork'),
      it.size ? 'ზომა: ' + it.size : '',
      'რაოდენობა: ' + (it.qty || 1),
      'ფასი: ' + fmtGel(lineTotal(it)),
      addonStr ? 'დამატებები: ' + addonStr : '',
      url || '',
    ];
    return parts.filter(Boolean).join('\n');
  }

  function buildOrderMessage(prefix) {
    const items = readItems();
    if (!items.length) return '';
    const lines = items.map((it, i) => formatCartLine(it, i));
    return prefix + '\n\n' + lines.join('\n\n') + '\n\nჯამი: ' + fmtGel(cartSubtotal(items));
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

  function checkoutBog() {
    const items = readItems();
    if (!items.length) return;
    const msg = encodeURIComponent(
      buildOrderMessage('გამარჯობა, საქართველოს ბანკით გადახდა მინდა შემდეგი შეკვეთისთვის:')
    );
    global.open('https://wa.me/' + DEFAULT_WA + '?text=' + msg, '_blank', 'noopener');
  }

  function checkoutTbc() {
    const items = readItems();
    if (!items.length) return;
    const msg = encodeURIComponent(
      buildOrderMessage('გამარჯობა, თიბისი ბანკით გადახდა მინდა შემდეგი შეკვეთისთვის:')
    );
    global.open('https://wa.me/' + DEFAULT_WA + '?text=' + msg, '_blank', 'noopener');
  }

  function getTotalQty() {
    return cartTotalQty(readItems());
  }

  function init() {
    mount();
    bindEvents();
    bindProductPageCart();
    render();
    if (typeof global.nvSyncCartBadges === 'function') global.nvSyncCartBadges();
  }

  global.nvCart = {
    addFromShopItem,
    addFromProductPage,
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
