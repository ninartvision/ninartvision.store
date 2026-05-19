/**
 * Ninart Vision — Premium gallery modal system
 *
 * ARCHITECTURE (single owner — do not duplicate in script.js):
 * - Mount: #productModal (static HTML on shop/artist pages, or MODAL_HTML inject on homepage)
 * - init(): once per page (_inited guard); binds events, shop grids, mobile viewer
 * - Public API: window.openProductModal, window.nvWhatsAppCartFromShopItem, window.initShopItems
 *
 * FORBIDDEN: HTML tags named "motion.div" or createElement with that name — invalid in
 * Safari (unknown custom element). Use normal div elements + CSS transitions only.
 *
 * Load order: nv-gallery-modal.min.js BEFORE script.min.js
 * CI: npm run verify:modal (runs after build:js)
 */
(function (global) {
  'use strict';

  const MODAL_ID = 'productModal';
  const MOBILE_VIEWER_ID = 'mobileImageViewer';
  const MOBILE_MQ = '(max-width: 768px)';
  const SHOP_DELEGATED_ATTR = 'shopDelegated';

  const SHOP_GRID_SELECTORS = [
    '#shopGrid',
    '#homeShopGrid',
    '#artistWorksGrid',
    '.shop-grid',
    '.shop-grid-small',
    '.home-shop-grid',
  ];

  const MODAL_HTML = "<div class=\"product-modal\" id=\"productModal\" aria-hidden=\"true\"><div class=\"product-modal-box\"><button class=\"product-close\" id=\"productClose\" type=\"button\" aria-label=\"Close\">✕</button><div class=\"product-layout\"><div class=\"product-left\"><div class=\"product-gallery\"><button class=\"gallery-arrow left\" id=\"galleryPrev\" type=\"button\" aria-label=\"Previous photo\">‹</button><img id=\"productImg\" src=\"\" alt=\"Artwork\" decoding=\"async\" loading=\"lazy\"><button class=\"gallery-arrow right\" id=\"galleryNext\" type=\"button\" aria-label=\"Next photo\">›</button></div></div><div class=\"product-right\"><h2 id=\"productTitle\"></h2><p class=\"muted\" id=\"productDesc\"></p><ul class=\"product-info\"><li><b>Size:</b> <span id=\"productSize\"></span></li><li><b>Medium:</b> <span id=\"productMedium\"></span></li><li><b>Year:</b> <span id=\"productYear\"></span></li></ul><div class=\"product-buy\"><div class=\"product-buy__price-row\"><div class=\"product-price\" id=\"productPrice\"></div></div><button class=\"morePhotosBtn\" id=\"morePhotosBtn\" type=\"button\" aria-expanded=\"false\">More photos <span class=\"arrow\">↓</span></button><div class=\"product-thumbs-shell\" id=\"productThumbsShell\" aria-hidden=\"true\"><div class=\"product-thumbs-shell__inner\"><div class=\"product-thumbs\" id=\"productThumbs\"></div></div></div><div class=\"product-modal-gift-card\" id=\"frameSelectionCard\" role=\"group\" aria-labelledby=\"frameSelectionLabel\"><div class=\"product-modal-gift-card__main\"><div class=\"product-modal-gift-card__text\"><span class=\"product-modal-gift-card__title\" id=\"frameSelectionLabel\">ჩარჩო</span><span class=\"product-modal-gift-card__meta\">+ 50 ₾</span></div></div><label class=\"product-modal-gift-switch\"><input type=\"checkbox\" id=\"frameSelectionToggle\" class=\"product-modal-gift-switch__input\"><span class=\"product-modal-gift-switch__track\"><span class=\"product-modal-gift-switch__thumb\"></span></span></label></div><div class=\"product-modal-gift-card\" id=\"giftPackagingCard\" role=\"group\" aria-labelledby=\"giftPackagingLabel\"><div class=\"product-modal-gift-card__main\"><div class=\"product-modal-gift-card__text\"><span class=\"product-modal-gift-card__title\" id=\"giftPackagingLabel\">სასაჩუქრე შეფუთვა</span><span class=\"product-modal-gift-card__meta\">+ 10 ₾</span></div></div><label class=\"product-modal-gift-switch\"><input type=\"checkbox\" id=\"giftPackagingToggle\" class=\"product-modal-gift-switch__input\"><span class=\"product-modal-gift-switch__track\"><span class=\"product-modal-gift-switch__thumb\"></span></span></label></div><div class=\"product-modal-gift-card\" id=\"courierDeliveryCard\" role=\"group\" aria-labelledby=\"courierDeliveryLabel\"><div class=\"product-modal-gift-card__main\"><div class=\"product-modal-gift-card__text\"><span class=\"product-modal-gift-card__title\" id=\"courierDeliveryLabel\">საკურიერო მომსახურება</span><span class=\"product-modal-gift-card__meta\">+ 5 ₾</span></div></div><label class=\"product-modal-gift-switch\"><input type=\"checkbox\" id=\"courierDeliveryToggle\" class=\"product-modal-gift-switch__input\"><span class=\"product-modal-gift-switch__track\"><span class=\"product-modal-gift-switch__thumb\"></span></span></label></div><button type=\"button\" id=\"addToCartBtn\" class=\"product-modal-add-cart\" aria-label=\"Add to cart — inquire via WhatsApp\">Add to Cart</button></div></div></div></div></div></div>";

  const isDev =
    typeof global.location !== 'undefined' &&
    (global.location.hostname === 'localhost' ||
      global.location.hostname === '127.0.0.1' ||
      global.localStorage?.getItem('nvGmDebug') === '1');

  function devWarn(...args) {
    if (isDev) console.warn('[NVGalleryModal]', ...args);
  }

  function mountModalIfMissing() {
    const existing = document.querySelectorAll(`#${MODAL_ID}`);
    if (existing.length > 1) {
      devWarn(`Multiple #${MODAL_ID} nodes (${existing.length}) — use one modal root only.`);
    }
    if (existing.length >= 1) return;
    const tpl = document.createElement('template');
    tpl.innerHTML = MODAL_HTML;
    document.body.appendChild(tpl.content);
    document.body.dataset.nvGmMounted = '1';
  }
  const ARTIST_THEMES = {
    nini: { id: 'nini', label: 'Nini Mzhavia' },
    mzia: { id: 'mzia', label: 'Mzia Kashia' },
    nanuli: { id: 'nanuli', label: 'Nanuli Gogiberidze' },
    default: { id: 'default', label: '' },
  };

  const fmtPrice = p => {
    const n = Number(String(p || '').replace(/[^\d.]/g, ''));
    return n ? '\u20BE' + n.toLocaleString('en-US') : '';
  };

  const slugify =
    typeof global.generateSlug === 'function'
      ? global.generateSlug
      : function (str) {
          return String(str || '')
            .toLowerCase()
            .replace(/['"«»""''„"]/g, '')
            .replace(/[^\w\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
        };

  function resolveArtist(artistId) {
    const id = String(artistId || '').toLowerCase().trim();
    return global.CURRENT_ARTIST || global.ARTISTS?.find(a => a.id === id) || null;
  }

  function normalizeFromShopItem(item) {
    if (!item || !item.dataset) return null;
    const ds = item.dataset;
    const artistId = (ds.artist || '').toLowerCase().trim();
    const artist = resolveArtist(artistId);
    return {
      title: ds.title || '',
      desc: ds.desc || '',
      size: ds.size || '',
      medium: ds.medium || '',
      year: ds.year || '',
      price: ds.price || '',
      status: ds.status || '',
      isSold: String(ds.isSold || '').toLowerCase() === 'true',
      isOnSale: String(ds.isOnSale || '').toLowerCase() === 'true',
      slug: ds.slug || '',
      artistId: artistId || 'default',
      artistName: ds.artistName || artist?.name || '',
      collection: ds.collection || '',
      keywords: ds.keywords || '',
      photos: (ds.photos || '')
        .split(',')
        .map(p => p.trim())
        .filter(Boolean),
      fallbackImg: item.querySelector('img')?.src || '',
    };
  }

  function fixPhotoPaths(photos, isSubPage) {
    return photos.map(p => {
      if (p.startsWith('http://') || p.startsWith('https://')) return p;
      return isSubPage ? '../' + p.toLowerCase() : p.toLowerCase();
    });
  }

  function isMobileViewport() {
    return global.matchMedia?.(MOBILE_MQ).matches ?? global.innerWidth <= 768;
  }

  const NVGalleryModal = {
    _modal: null,
    _els: {},
    _photos: [],
    _index: 0,
    _currentItem: null,
    _currentPayload: null,
    _inited: false,
    _scrollLocked: false,
    _scrollY: 0,
    _mobileViewerOpen: false,
    _onKeydown: null,
    _onModalClick: null,
    _shopClickHandler: null,
    _eventsBound: false,
    _mobileViewerBound: false,

    /* ── Lifecycle: single init ───────────────────────────────────── */
    init() {
      if (this._inited) {
        devWarn('init() skipped — already initialized (single-init rule).');
        return this;
      }
      mountModalIfMissing();
      const modal = document.getElementById(MODAL_ID);
      if (!modal) return this;

      this._modal = modal;
      modal.classList.add('nv-gm');
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-hidden', 'true');

      modal.querySelector('.product-modal-box')?.classList.add('nv-gm__shell');

      this._bindElements();
      this._ensureMetaSlots();
      this._bindEvents();
      this._ensureMobileViewer();
      this._bindShopGrids();

      global.openProductModal = item => this.openFromShopItem(item);
      global.nvWhatsAppCartFromShopItem = (item, opts) => this.whatsAppFromShopItem(item, opts);
      global.initShopItems = () => this.bindShopGrids();

      this._inited = true;
      return this;
    },

    _bindElements() {
      const g = id => document.getElementById(id);
      this._els = {
        closeBtn: g('productClose'),
        productImg: g('productImg'),
        productTitle: g('productTitle'),
        productDesc: g('productDesc'),
        productSize: g('productSize'),
        productMedium: g('productMedium'),
        productYear: g('productYear'),
        productPrice: g('productPrice'),
        giftPackagingCard: g('giftPackagingCard'),
        giftPackagingToggle: g('giftPackagingToggle'),
        frameSelectionCard: g('frameSelectionCard'),
        frameSelectionToggle: g('frameSelectionToggle'),
        courierDeliveryCard: g('courierDeliveryCard'),
        courierDeliveryToggle: g('courierDeliveryToggle'),
        productThumbs: g('productThumbs'),
        productThumbsShell: g('productThumbsShell'),
        galleryPrev: g('galleryPrev'),
        galleryNext: g('galleryNext'),
        morePhotosBtn: g('morePhotosBtn'),
        addToCartBtn: g('addToCartBtn'),
        productArtist: g('productArtist'),
        productCollection: g('productCollection'),
      };
    },

    _ensureMetaSlots() {
      const title = this._els.productTitle;
      if (!title?.parentNode) return;

      if (!this._els.productArtist) {
        const artist = document.createElement('p');
        artist.id = 'productArtist';
        artist.className = 'nv-gm__artist muted';
        artist.hidden = true;
        title.insertAdjacentElement('afterend', artist);
        this._els.productArtist = artist;
      }

      if (!this._els.productCollection) {
        const col = document.createElement('span');
        col.id = 'productCollection';
        col.className = 'nv-gm__collection';
        col.hidden = true;
        title.insertAdjacentElement('beforebegin', col);
        this._els.productCollection = col;
      }
    },

    _lockBody() {
      if (this._scrollLocked) return;
      this._scrollY = global.scrollY || document.documentElement.scrollTop || 0;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${this._scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      this._scrollLocked = true;
    },

    _unlockBody() {
      if (!this._scrollLocked) return;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      global.scrollTo(0, this._scrollY || 0);
      this._scrollLocked = false;
    },

    _syncBodyScrollLock() {
      const modalOpen = this._modal?.classList.contains('open');
      if (modalOpen || this._mobileViewerOpen) this._lockBody();
      else this._unlockBody();
    },

    applyArtistTheme(artistId) {
      const key = ARTIST_THEMES[artistId] ? artistId : 'default';
      this._modal?.setAttribute('data-nv-artist', key);
    },

    openFromShopItem(item) {
      const payload = normalizeFromShopItem(item);
      if (!payload) return;
      this._currentItem = item;
      this.open(payload);
    },

    open(payload) {
      if (!this._modal || !payload) return;
      this._currentPayload = payload;

      const isSubPage =
        location.pathname.includes('/artists/') || location.pathname.includes('/sale/');

      let photos = payload.photos?.length
        ? payload.photos.slice()
        : payload.fallbackImg
          ? [payload.fallbackImg]
          : [];

      photos = fixPhotoPaths(photos, isSubPage);
      if (!photos.length && payload.fallbackImg) {
        photos = fixPhotoPaths([payload.fallbackImg], isSubPage);
      }

      this._photos = photos;
      this._index = 0;
      this.showPhoto(0);

      const e = this._els;
      if (e.productTitle) e.productTitle.textContent = payload.title || '';
      if (e.productDesc) e.productDesc.textContent = payload.desc || '';
      if (e.productSize) e.productSize.textContent = payload.size || '';
      if (e.productMedium) e.productMedium.textContent = payload.medium || '';
      if (e.productYear) e.productYear.textContent = payload.year || '';

      if (e.productArtist) {
        const name = payload.artistName || '';
        e.productArtist.textContent = name;
        e.productArtist.hidden = !name;
      }

      if (e.productCollection) {
        const col = payload.collection || '';
        e.productCollection.textContent = col;
        e.productCollection.hidden = !col;
      }

      if (e.productPrice) e.productPrice.textContent = fmtPrice(payload.price);

      if (e.giftPackagingToggle) e.giftPackagingToggle.checked = false;
      if (e.frameSelectionToggle) e.frameSelectionToggle.checked = false;
      if (e.courierDeliveryToggle) e.courierDeliveryToggle.checked = false;

      this.setDetailStatus(payload);
      this.applyArtistTheme(payload.artistId || 'default');
      this._renderThumbs();

      const rawSlug = payload.slug || slugify(payload.title || '');
      const productUrl = rawSlug
        ? `https://ninartvision.store/products/${rawSlug}/`
        : global.location.href;

      if (this._currentItem) this._currentItem._productUrl = productUrl;

      const ogImage =
        this._photos[0] && this._photos[0].startsWith('http') ? this._photos[0] : '';

      if (typeof global.updateOgTags === 'function') {
        global.updateOgTags({
          title: payload.title || '',
          description: payload.desc || '',
          imageUrl: ogImage,
          pageUrl: productUrl,
        });
      }

      this._modal.classList.add('open');
      this._modal.setAttribute('aria-hidden', 'false');
      this._syncBodyScrollLock();

      requestAnimationFrame(() => {
        e.closeBtn?.focus({ preventScroll: true });
      });
    },

    close() {
      if (!this._modal) return;
      this._closeMobileViewer();
      this._modal.classList.remove('open');
      this._modal.setAttribute('aria-hidden', 'true');
      this.closeThumbsAccordion();
      this._syncBodyScrollLock();
    },

    showPhoto(i) {
      if (!this._photos.length || !this._els.productImg) return;
      this._index = i;
      const src = this._photos[this._index];
      const img = this._els.productImg;
      if (img.getAttribute('src') !== src) {
        img.src = src;
      }
      const thumbs = this._els.productThumbs?.children;
      if (thumbs) {
        for (let t = 0; t < thumbs.length; t++) {
          thumbs[t].classList.toggle('active', t === this._index);
        }
      }
    },

    _renderThumbs() {
      const shell = this._els.productThumbs;
      if (!shell) return;
      this.closeThumbsAccordion();
      shell.innerHTML = '';
      const frag = document.createDocumentFragment();
      this._photos.forEach((src, i) => {
        const img = document.createElement('img');
        img.src = src;
        img.className = 'product-thumb';
        img.loading = 'lazy';
        img.decoding = 'async';
        img.alt = '';
        img.addEventListener('click', ev => {
          ev.stopPropagation();
          this.showPhoto(i);
        });
        frag.appendChild(img);
      });
      shell.appendChild(frag);
    },

    closeThumbsAccordion() {
      this._els.productThumbsShell?.classList.remove('is-open');
      this._els.morePhotosBtn?.classList.remove('open');
      this._els.morePhotosBtn?.setAttribute('aria-expanded', 'false');
      this._els.productThumbsShell?.setAttribute('aria-hidden', 'true');
    },

    toggleThumbsAccordion() {
      const open = !this._els.productThumbsShell?.classList.contains('is-open');
      this._els.productThumbsShell?.classList.toggle('is-open', open);
      this._els.morePhotosBtn?.classList.toggle('open', open);
      this._els.morePhotosBtn?.setAttribute('aria-expanded', open ? 'true' : 'false');
      this._els.productThumbsShell?.setAttribute('aria-hidden', open ? 'false' : 'true');
    },

    ensureStatusEl() {
      const productPrice = this._els.productPrice;
      if (!productPrice?.parentElement) return null;
      let statusEl = document.getElementById('productStatus');
      if (!statusEl) {
        statusEl = document.createElement('span');
        statusEl.id = 'productStatus';
        statusEl.className = 'status';
        statusEl.setAttribute('role', 'status');
        statusEl.hidden = true;
        productPrice.insertAdjacentElement('afterend', statusEl);
      }
      return statusEl;
    },

    setDetailStatus(payloadOrItem) {
      const statusEl = this.ensureStatusEl();
      if (!statusEl) return;

      const ds = payloadOrItem?.dataset || payloadOrItem || {};
      const rawStatus = String(ds.status || '').toLowerCase().trim();
      const isSold =
        String(ds.isSold || '').toLowerCase() === 'true' || rawStatus === 'sold';
      const isOnSale =
        !isSold &&
        (String(ds.isOnSale || '').toLowerCase() === 'true' || rawStatus === 'sale');

      const cartBtn = this._els.addToCartBtn;
      if (cartBtn) {
        cartBtn.hidden = isSold;
        cartBtn.setAttribute('aria-hidden', isSold ? 'true' : 'false');
      }

      [this._els.giftPackagingCard, this._els.frameSelectionCard, this._els.courierDeliveryCard].forEach(
        card => {
          if (card) {
            card.hidden = isSold;
            card.setAttribute('aria-hidden', isSold ? 'true' : 'false');
          }
        }
      );

      if (isSold) {
        if (this._els.giftPackagingToggle) this._els.giftPackagingToggle.checked = false;
        if (this._els.frameSelectionToggle) this._els.frameSelectionToggle.checked = false;
        if (this._els.courierDeliveryToggle) this._els.courierDeliveryToggle.checked = false;
        statusEl.className = 'status sold';
        statusEl.textContent = 'Sold';
        statusEl.hidden = false;
        return;
      }

      if (isOnSale) {
        statusEl.className = 'status sale';
        statusEl.textContent = 'Sale';
        statusEl.hidden = false;
        return;
      }

      statusEl.className = 'status';
      statusEl.textContent = '';
      statusEl.hidden = true;
    },

    whatsAppFromShopItem(item, options = {}) {
      if (!item) return;
      const sold =
        String(item.dataset?.isSold || '').toLowerCase() === 'true' ||
        String(item.dataset?.status || '').toLowerCase().trim() === 'sold';
      if (sold) return;

      const giftPackaging = Boolean(options.giftPackaging);
      const frameSelection = Boolean(options.frameSelection);
      const courierDelivery = Boolean(options.courierDelivery);

      const title = item.dataset.title || '';
      const price = fmtPrice(item.dataset.price);
      const artistId = item.dataset.artist || '';
      const artist = resolveArtist(artistId);
      const artistName = item.dataset.artistName || artist?.name || '';
      const phone = artist?.whatsapp || '995579388833';

      if (typeof global.trackWhatsAppClick === 'function') {
        global.trackWhatsAppClick(artistName, 'cart');
      }

      const rawSlug = item.dataset.slug || slugify(title);
      const productUrl = rawSlug
        ? `https://ninartvision.store/products/${rawSlug}/`
        : global.location.href;

      const frameLine = frameSelection ? '\nჩარჩო: დიახ (+ 50 ₾)' : '';
      const giftLine = giftPackaging ? '\nსასაჩუქრე შეფუთვა: დიახ (+ 10 ₾)' : '';
      const courierLine = courierDelivery ? '\nსაკურიერო მომსახურება: დიახ (+ 5 ₾)' : '';

      const msg = encodeURIComponent(
        `გამარჯობა, მაინტერესებს ნახატი: ${title}, ავტორი ${artistName}, ფასი ${price}${frameLine}${giftLine}${courierLine}\n${productUrl}`
      );

      global.open(`https://wa.me/${phone}?text=${msg}`, '_blank', 'noopener');
      if (typeof global.nvIncrementCartCount === 'function') {
        global.nvIncrementCartCount(1);
      }
    },

    _bindEvents() {
      if (this._eventsBound) {
        devWarn('_bindEvents() skipped — listeners already attached.');
        return;
      }
      this._eventsBound = true;

      const { closeBtn, galleryPrev, galleryNext, morePhotosBtn, addToCartBtn } = this._els;

      if (closeBtn) {
        closeBtn.addEventListener('click', e => {
          e.preventDefault();
          this.close();
        });
      }

      this._onModalClick = e => {
        if (e.target === this._modal) this.close();
      };
      this._modal?.addEventListener('click', this._onModalClick);

      this._onKeydown = e => {
        if (e.key !== 'Escape' || !this._modal?.classList.contains('open')) return;
        if (this._mobileViewerOpen) {
          this._closeMobileViewer();
          return;
        }
        const mo = document.getElementById('menuOverlay');
        if (mo?.classList.contains('active')) return;
        this.close();
      };
      document.addEventListener('keydown', this._onKeydown);

      galleryPrev?.addEventListener('click', e => {
        e.stopPropagation();
        this.showPhoto((this._index - 1 + this._photos.length) % this._photos.length);
      });

      galleryNext?.addEventListener('click', e => {
        e.stopPropagation();
        this.showPhoto((this._index + 1) % this._photos.length);
      });

      morePhotosBtn?.addEventListener('click', e => {
        e.stopPropagation();
        this.toggleThumbsAccordion();
      });

      addToCartBtn?.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        if (!this._currentItem) return;
        this.whatsAppFromShopItem(this._currentItem, {
          frameSelection: Boolean(this._els.frameSelectionToggle?.checked),
          giftPackaging: Boolean(this._els.giftPackagingToggle?.checked),
          courierDelivery: Boolean(this._els.courierDeliveryToggle?.checked),
        });
      });
    },

    bindShopGrids() {
      if (!this._shopClickHandler) {
        this._shopClickHandler = e => {
          const cartHit = e.target.closest('.shop-item__cart-btn');
          if (cartHit) {
            e.preventDefault();
            e.stopPropagation();
            const item = cartHit.closest('.shop-item');
            if (item) this.whatsAppFromShopItem(item);
            return;
          }
          if (e.target.closest('a, button')) return;
          const item = e.target.closest('.shop-item');
          if (!item) return;
          if (typeof global.trackArtworkClick === 'function') {
            const title = item.dataset.title || 'Unknown';
            const artistId = item.dataset.artist || '';
            const artist = resolveArtist(artistId);
            global.trackArtworkClick(title, title, artist?.name || artistId);
          }
          this.openFromShopItem(item);
        };
      }

      SHOP_GRID_SELECTORS.forEach(sel => {
        document.querySelectorAll(sel).forEach(container => {
          if (container.dataset[SHOP_DELEGATED_ATTR]) return;
          container.dataset[SHOP_DELEGATED_ATTR] = '1';
          container.addEventListener('click', this._shopClickHandler);
        });
      });

      if (typeof global.nvRevealLqipImages === 'function') {
        global.nvRevealLqipImages(document);
      }
    },

    _bindShopGrids() {
      this.bindShopGrids();
    },

    _ensureMobileViewer() {
      if (this._mobileViewerBound || document.getElementById(MOBILE_VIEWER_ID)) {
        this._mobileViewerBound = true;
        return;
      }

      const viewer = document.createElement('div');
      viewer.id = MOBILE_VIEWER_ID;
      viewer.className = 'mobile-image-viewer';
      viewer.innerHTML = `
      <div class="mobile-viewer-container">
        <div class="mobile-viewer-top">
          <button class="mobile-viewer-back" id="mobileViewerBack" type="button" aria-label="Back">←</button>
          <button class="mobile-viewer-zoom" id="mobileViewerZoom" type="button" aria-label="Zoom">🔍</button>
        </div>
        <div class="mobile-viewer-image-container">
          <img id="mobileViewerImage" class="mobile-viewer-image" src="" alt="Product image" decoding="async">
          <div class="mobile-viewer-arrows">
            <button class="mobile-viewer-arrow" id="mobileViewerPrev" type="button" aria-label="Previous">‹</button>
            <button class="mobile-viewer-arrow" id="mobileViewerNext" type="button" aria-label="Next">›</button>
          </div>
        </div>
        <button class="mobile-viewer-toggle-thumbs" id="mobileToggleThumbs" type="button">
          More photos <span class="arrow">↑</span>
        </button>
        <div class="mobile-viewer-bottom" id="mobileViewerBottom">
          <div class="mobile-viewer-thumbs" id="mobileViewerThumbs"></div>
        </div>
      </div>`;
      document.body.appendChild(viewer);

      this._mobile = {
        root: document.getElementById('mobileImageViewer'),
        image: document.getElementById('mobileViewerImage'),
        back: document.getElementById('mobileViewerBack'),
        zoom: document.getElementById('mobileViewerZoom'),
        prev: document.getElementById('mobileViewerPrev'),
        next: document.getElementById('mobileViewerNext'),
        toggleThumbs: document.getElementById('mobileToggleThumbs'),
        bottom: document.getElementById('mobileViewerBottom'),
        thumbs: document.getElementById('mobileViewerThumbs'),
        index: 0,
        isZoomed: false,
        touchStartX: 0,
        touchStartY: 0,
        imageX: 0,
        imageY: 0,
        swipeStartX: 0,
      };

      const m = this._mobile;
      if (!m.root || !this._els.productImg) return;

      m.showPhoto = i => {
        if (!this._photos.length) return;
        m.index = i;
        m.image.src = this._photos[m.index];
        m.isZoomed = false;
        m.image.classList.remove('zoomed');
        m.image.style.transform = '';
        m.imageX = 0;
        m.imageY = 0;
        m.thumbs?.querySelectorAll('.mobile-viewer-thumb').forEach((t, idx) => {
          t.classList.toggle('active', idx === m.index);
        });
      };

      this._closeMobileViewer = () => {
        if (!m.root?.classList.contains('open')) return;
        m.root.classList.remove('open');
        this._mobileViewerOpen = false;
        m.bottom?.classList.remove('show');
        m.toggleThumbs?.classList.remove('open');
        m.isZoomed = false;
        m.image?.classList.remove('zoomed');
        if (m.image) m.image.style.transform = '';
        this._syncBodyScrollLock();
      };

      const openMobileViewer = (startIndex = 0) => {
        if (!isMobileViewport() || !this._photos.length) return;
        m.index = startIndex;
        m.showPhoto(m.index);
        m.root.classList.add('open');
        this._mobileViewerOpen = true;
        this._syncBodyScrollLock();

        if (m.thumbs) {
          m.thumbs.innerHTML = '';
          const frag = document.createDocumentFragment();
          this._photos.forEach((src, i) => {
            const thumb = document.createElement('img');
            thumb.src = src;
            thumb.className = 'mobile-viewer-thumb';
            thumb.loading = 'lazy';
            thumb.decoding = 'async';
            if (i === m.index) thumb.classList.add('active');
            thumb.addEventListener('click', () => {
              m.showPhoto(i);
              m.bottom?.classList.remove('show');
              m.toggleThumbs?.classList.remove('open');
            });
            frag.appendChild(thumb);
          });
          m.thumbs.appendChild(frag);
        }

        const multi = this._photos.length > 1;
        if (m.toggleThumbs) m.toggleThumbs.style.display = multi ? 'flex' : 'none';
        if (m.prev) m.prev.style.display = multi ? 'flex' : 'none';
        if (m.next) m.next.style.display = multi ? 'flex' : 'none';
      };

      this._els.productImg.addEventListener('click', e => {
        e.stopPropagation();
        if (isMobileViewport()) openMobileViewer(this._index);
      });

      m.back?.addEventListener('click', e => {
        e.preventDefault();
        this._closeMobileViewer();
      });

      m.zoom?.addEventListener('click', e => {
        e.preventDefault();
        m.isZoomed = !m.isZoomed;
        m.image.classList.toggle('zoomed', m.isZoomed);
        if (!m.isZoomed) {
          m.image.style.transform = '';
          m.imageX = 0;
          m.imageY = 0;
        }
      });

      m.prev?.addEventListener('click', () => {
        m.showPhoto((m.index - 1 + this._photos.length) % this._photos.length);
      });

      m.next?.addEventListener('click', () => {
        m.showPhoto((m.index + 1) % this._photos.length);
      });

      m.toggleThumbs?.addEventListener('click', () => {
        m.bottom?.classList.toggle('show');
        m.toggleThumbs?.classList.toggle('open');
      });

      m.image?.addEventListener('touchstart', e => {
        if (m.isZoomed) {
          m.touchStartX = e.touches[0].clientX;
          m.touchStartY = e.touches[0].clientY;
          return;
        }
        m.swipeStartX = e.touches[0].clientX;
      });

      m.image?.addEventListener('touchmove', e => {
        if (!m.isZoomed) return;
        e.preventDefault();
        const touchX = e.touches[0].clientX;
        const touchY = e.touches[0].clientY;
        m.imageX += touchX - m.touchStartX;
        m.imageY += touchY - m.touchStartY;
        const maxX = m.image.width * 0.5;
        const maxY = m.image.height * 0.5;
        m.imageX = Math.max(-maxX, Math.min(maxX, m.imageX));
        m.imageY = Math.max(-maxY, Math.min(maxY, m.imageY));
        m.image.style.transform = `scale(2) translate(${m.imageX / 2}px, ${m.imageY / 2}px)`;
        m.touchStartX = touchX;
        m.touchStartY = touchY;
      }, { passive: false });

      m.image?.addEventListener('touchend', e => {
        if (m.isZoomed) return;
        const diff = m.swipeStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
          m.showPhoto(
            diff > 0
              ? (m.index + 1) % this._photos.length
              : (m.index - 1 + this._photos.length) % this._photos.length
          );
        }
      });

      this._mobileViewerBound = true;
    },

  };

  global.NVGalleryModal = NVGalleryModal;

  /* ── Boot: once per page (defer-safe) ───────────────────────────── */
  function bootGalleryModal() {
    mountModalIfMissing();
    NVGalleryModal.init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootGalleryModal);
  } else {
    bootGalleryModal();
  }
})(typeof window !== 'undefined' ? window : globalThis);
