/**
 * Ubuntu Town — minimal service worker for PWA installability + a resilient
 * offline shell. Deliberately conservative:
 *  - network-first for navigations (always prefer fresh app), offline fallback
 *    to a cached shell so the app opens without connectivity;
 *  - cache-first for static assets (icons, _next static chunks);
 *  - NEVER caches Supabase / API calls — data always comes from the network,
 *    so there is no second source of truth and no stale-auth surprises.
 *
 * This is Phase 21 (installability) only. Full offline writes / local outbox
 * are a later, deliberate increment.
 */
const CACHE = 'ubuntu-town-v1';
const SHELL = ['/workspace', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Never intercept auth/data traffic — Supabase, APIs, cross-origin.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api') || url.hostname.includes('supabase')) return;

  // Navigations: network-first, fall back to cached shell when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match('/workspace'))),
    );
    return;
  }

  // Static assets: cache-first.
  if (url.pathname.startsWith('/icons') || url.pathname.startsWith('/_next/static')) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
            return res;
          }),
      ),
    );
  }
});
