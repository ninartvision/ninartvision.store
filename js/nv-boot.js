/**
 * Early boot: language attribute + mark UI when document is stable.
 * Load synchronously from <head> on index (and optionally other pages).
 */
(function () {
  'use strict';

  try {
    var saved = localStorage.getItem('siteLang');
    document.documentElement.lang = saved === 'en' ? 'en' : 'ka';
  } catch (e) { /* ignore */ }

  function markUiReady() {
    document.documentElement.classList.add('nv-ui-ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', markUiReady, { once: true });
  } else {
    markUiReady();
  }
})();
