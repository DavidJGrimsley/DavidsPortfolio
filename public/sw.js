/* eslint-disable no-restricted-globals */

const CACHE_VERSION = 'v1';
const CACHE_NAME = `djsportfolio-${CACHE_VERSION}`;

const CORE_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/images/favicon.png',
  '/images/icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(CORE_ASSETS);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (!request || request.method !== 'GET') return;

  const url = new URL(request.url);

  // Only handle same-origin requests.
  if (url.origin !== self.location.origin) return;

  // Build marker files should always come from network so console logs reflect the latest deploy.
  if (
    url.pathname === '/__djsportfolio_build.json' ||
    url.pathname === '/__djsportfolio_build.txt'
  ) {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request, { cache: 'no-store' });
        } catch {
          return Response.error();
        }
      })()
    );
    return;
  }

  // Navigation requests: network-first, fallback to cached index.html.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          if (!response || !response.ok) {
            throw new Error('Navigation response was not OK');
          }
          const cache = await caches.open(CACHE_NAME);
          cache.put('/', response.clone()).catch(() => {});
          return response;
        } catch {
          const cache = await caches.open(CACHE_NAME);
          return (await cache.match('/')) || Response.error();
        }
      })()
    );
    return;
  }

  // Static assets: cache-first with background refresh.
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      if (cached) {
        fetch(request)
          .then((resp) => {
            if (resp && resp.ok) cache.put(request, resp.clone()).catch(() => {});
          })
          .catch(() => {});
        return cached;
      }

      const response = await fetch(request);
      if (response && response.ok) {
        cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    })()
  );
});
