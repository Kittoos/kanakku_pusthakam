const CACHE_NAME = 'pocketledger-cache-v5';

const CORE_ASSETS = [
  '/kanakku_pusthakam/',
  '/kanakku_pusthakam/index.html',
  '/kanakku_pusthakam/manifest.json',
  '/kanakku_pusthakam/icon.png'
];

// 1. Install Phase: Fault-tolerant caching
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      for (const asset of CORE_ASSETS) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn('Skipped caching asset:', asset);
        }
      }
    })
  );
  self.skipWaiting();
});

// 2. Activate Phase: Clean up older caches
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

// 3. Fetch Phase: Network first, fallback to cache
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const resClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, resClone);
        });
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
