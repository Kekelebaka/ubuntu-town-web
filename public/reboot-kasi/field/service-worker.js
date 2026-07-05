/* Ubuntu Town OS — Coordinator PWA service worker
   Strategy:
   - App shell: cache-first (instant load, offline-ready)
   - Navigations: network-first -> cached shell -> offline.html
   - Cross-origin (fonts/API GETs): network-first -> cache
   - Background Sync: 'sync-proofs' pings the page to flush its IndexedDB queue
*/
const VERSION = 'utos-v1.0.0';
const SHELL = 'utos-shell-' + VERSION;
const DATA  = 'utos-data-' + VERSION;

const SHELL_ASSETS = [
  './',
  './index.html',
  './offline.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL).then((cache) => cache.addAll(SHELL_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SHELL && k !== DATA).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // App navigations: network-first, fall back to cached shell, then offline page
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(SHELL).then((c) => c.put('./index.html', copy)); return res; })
        .catch(() => caches.match('./index.html').then((r) => r || caches.match('./offline.html')))
    );
    return;
  }

  // Same-origin static assets: cache-first
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        const copy = res.clone(); caches.open(SHELL).then((c) => c.put(req, copy)); return res;
      }).catch(() => hit))
    );
    return;
  }

  // Cross-origin (Google Fonts, APIs): network-first, fall back to cache
  event.respondWith(
    fetch(req).then((res) => { const copy = res.clone(); caches.open(DATA).then((c) => c.put(req, copy)); return res; })
      .catch(() => caches.match(req))
  );
});

// Background Sync — tell the page to flush queued proofs when connectivity returns
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-proofs') {
    event.waitUntil(
      self.clients.matchAll({ includeUncontrolled: true }).then((clients) => {
        clients.forEach((c) => c.postMessage({ type: 'FLUSH_PROOFS' }));
      })
    );
  }
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
