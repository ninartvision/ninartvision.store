/**
 * Ninart Vision — unified site footer (legal links + payment logos).
 * Runs on every page that loads script.min.js; resolves relative paths by depth.
 */
(function (global) {
  'use strict';

  const LEGAL = global.NV_LEGAL || {
    brand: 'Ninart Vision',
    lastUpdated: '2026',
  };

  function assetRoot() {
    const path = String(global.location?.pathname || '/');
    const depth = (path.match(/\//g) || []).length - 1;
    if (path.includes('/products/')) return '../../';
    if (path.includes('/artists/') || path.includes('/sale/')) return '../';
    return './';
  }

  function paymentLogoHtml(root, cls) {
    return (
      '<img class="' +
      cls +
      '" src="' +
      root +
      'images/payments/visa.svg" alt="Visa" width="140" height="70" loading="lazy" decoding="async">' +
      '<img class="' +
      cls +
      '" src="' +
      root +
      'images/payments/mastercard.svg" alt="Mastercard" width="140" height="70" loading="lazy" decoding="async">'
    );
  }

  function footerHtml(root) {
    return (
      '<div class="container">' +
      '<nav class="site-footer__links" aria-label="Legal links">' +
      '<a href="' +
      root +
      'terms.html">მომსახურების პირობები</a>' +
      '<a href="' +
      root +
      'privacy.html">კონფიდენციალურობა</a>' +
      '<a href="' +
      root +
      'returns.html">თანხის დაბრუნება</a>' +
      '<a href="' +
      root +
      'contact.html">კონტაქტი</a>' +
      '</nav>' +
      '<div class="site-footer__payments" aria-label="Accepted payment methods">' +
      paymentLogoHtml(root, 'site-footer__pay-logo') +
      '</div>' +
      '<p class="site-footer__copy">&copy; 2026 ' +
      (LEGAL.brand || 'Ninart Vision') +
      ' &middot; Original Georgian Art</p>' +
      '</div>'
    );
  }

  function ensureFooter() {
    const root = assetRoot();
    let footer = document.querySelector('.site-footer');
    if (!footer) {
      footer = document.createElement('footer');
      footer.className = 'site-footer';
      footer.setAttribute('aria-label', 'Site footer');
      document.body.appendChild(footer);
    }
    footer.innerHTML = footerHtml(root);
  }

  function init() {
    ensureFooter();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  global.nvEnsureSiteFooter = ensureFooter;
})(typeof window !== 'undefined' ? window : globalThis);
