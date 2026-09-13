/* Minimal service worker: enough to make the app installable and to survive a
   flaky shop wifi. Deliberately does NOT cache API responses — stale stock is
   worse than no stock. */
const CACHE = 'atelie-v1';
const SHELL = ['/', '/manifest.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (url.pathname.startsWith('/api/')) return;   // never cache stock or generation
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request).then((r) => r ?? caches.match('/')))
  );
});
