/* eslint-disable no-restricted-globals */

const CACHE_PREFIX = 'djsportfolio-';

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => key.startsWith(CACHE_PREFIX)).map((key) => caches.delete(key))
      );
      await self.registration.unregister();
      await self.clients.claim();
    })()
  );
});
