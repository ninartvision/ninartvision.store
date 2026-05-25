/**
 * Ninart Vision Service Worker
 * Provides caching for static assets to improve repeat-visit performance.
 * Strategy: Cache-first for assets, Network-first for HTML pages.
 */

const CACHE_NAME = 'ninart-v17';
const ASSET_CACHE = 'ninart-assets-v17';

/**
 * Editable JS/CSS bundles: network-first so deploys are not masked by cache-first assets.
 * Anything that ships frequent code changes must be listed here, otherwise a stale
 * copy can persist on the client across deploys.
 */
function isCriticalEditableBundle(url) {
  const p = url.pathname || '';
  return /style\.min\.css$/i.test(p) ||
    /script\.min\.js$/i.test(p) ||
    /sanity-client\.min\.js$/i.test(p) ||
    /data\.min\.js$/i.test(p) ||
    /lang\.js$/i.test(p) ||
    /auth\.min\.js$/i.test(p) ||
    /analytics\.min\.js$/i.test(p) ||
    /payment-modal\.min\.js$/i.test(p) ||
    /gallery\.min\.js$/i.test(p) ||
    /\/js\/.+\.min\.js$/i.test(p) ||
    /\/sale\/.+\.min\.js$/i.test(p) ||
    /\/artists\/.+\.min\.js$/i.test(p);
}

// Static assets to pre-cache on install. Use unversioned paths so cache keys
// don't drift out of sync with the latest `?v=` strings on HTML pages.
const PRECACHE_URLS = [
  './',
  './images/favicon.webp',
  './images/logo.webp',
  './images/garden9.webp',
];

// Install: pre-cache essential assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME && k !== ASSET_CACHE)
            .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: serve from cache when possible
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GET requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  const isHTML = request.headers.get('Accept')?.includes('text/html');
  const isAsset = /\.(css|js|webp|jpg|jpeg|png|svg|woff2?|ico)$/i.test(url.pathname);

  if (isHTML) {
    // Network-first for HTML: always try fresh, fallback to cache
    event.respondWith(
      fetch(request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request))
    );
  } else if (isAsset) {
    // Editable bundles: network-first → update immediately after deploy (then refresh cache copy)
    if (isCriticalEditableBundle(url)) {
      event.respondWith(
        fetch(request)
          .then(res => {
            const clone = res.clone();
            if (res.ok) {
              caches.open(ASSET_CACHE).then(c => c.put(request, clone));
            }
            return res;
          })
          .catch(() => caches.match(request))
      );
      return;
    }
    // Cache-first for other static assets (images, most JS/CSS)
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(res => {
          const clone = res.clone();
          caches.open(ASSET_CACHE).then(c => c.put(request, clone));
          return res;
        });
      })
    );
  }
});
