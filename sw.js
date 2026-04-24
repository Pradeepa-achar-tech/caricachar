// Service Worker — offline shell + runtime cache.
// Bump CACHE when you ship changes so clients pick up new assets.
const CACHE = 'cl-shell-v5';

const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './js/app.js',
  './js/nav.js',
  './js/home.js',
  './js/lessons.js',
  './js/lessons-data.js',
  './js/studio.js',
  './js/mannequin.js',
  './js/exaggerate.js',
  './js/photo-warp.js',
  './js/grid.js',
  './js/gallery.js',
  './js/modal.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(SHELL).catch((err) => {
        console.warn('[sw] partial shell cache:', err);
      }))
      // Don't auto-skip — wait for the user to tap "Reload" in the in-app prompt.
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (!url.protocol.startsWith('http')) return;

  // SPA navigation — always serve the app shell so deep refreshes work offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', clone)).catch(() => {});
          return res;
        })
        .catch(() => caches.match('./index.html').then((r) => r || new Response('Offline', { status: 503 })))
    );
    return;
  }

  // Stale-while-revalidate for same-origin and CDN assets (three.js etc).
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetched = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && (res.type === 'basic' || res.type === 'cors')) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(req, clone)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached);
      return cached || fetched;
    })
  );
});
