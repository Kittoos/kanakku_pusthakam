const CACHE_NAME = 'pocketledger-cache-v8';

// Includes all external CDNs to fix the offline layout breaking issue
const CORE_ASSETS = [
  '/kanakku_pusthakam/',
  '/kanakku_pusthakam/index.html',
  '/kanakku_pusthakam/manifest.json',
  '/kanakku_pusthakam/icon.png',
  'https://cdn.tailwindcss.com/',
  'https://unpkg.com/lucide@latest',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      for (const asset of CORE_ASSETS) {
        try {
          const response = await fetch(new Request(asset, { cache: 'reload' }));
          if (response.ok) {
            await cache.put(asset, response);
          }
        } catch (err) {
          console.warn('Skipped caching asset:', asset);
        }
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Cache-first strategy for instant offline loading
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then(response => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      }).catch(() => {
        // Fallback gracefully if totally offline and not cached
      });
    })
  );
});
