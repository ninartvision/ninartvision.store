/**
 * Ninart Vision Service Worker
 * Provides caching for static assets to improve repeat-visit performance.
 * Strategy: Cache-first for assets, Network-first for HTML pages.
 */

const CACHE_NAME = 'ninart-v2';
const ASSET_CACHE = 'ninart-assets-v2';

// Static assets to pre-cache on install
const PRECACHE_URLS = [
  './',
  './style.min.css',
  './script.min.js',
  './images/logo.png',
  './images/logo.webp',
  './images/garden9.webp',
  './images/garden9.jpg',
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
    // Cache-first for assets: serve cached version instantly
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
