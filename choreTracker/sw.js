/**
 * Morning Stars — Service Worker
 * Strategy: Cache-first for app shell, stale-while-revalidate for fonts.
 * All app files are cached on install so the app works fully offline.
 */

const CACHE_VERSION = 'morning-stars-v8';

/** Files that make up the app shell — cached immediately on install */
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/app.css',
  '/js/constants.js?v=8',
  '/js/defaults.js?v=8',
  '/js/photodb.js?v=8',
  '/js/state.js?v=8',
  '/js/utils.js?v=8',
  '/js/audio.js?v=8',
  '/js/render.js?v=8',
  '/js/actions.js?v=8',
  '/js/sync.js?v=8',
  '/js/app.js?v=8',
  '/icons/icon-32.png',
  '/icons/icon-180.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

/** External resources we'd like to cache if available */
const EXTERNAL = [
  'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap',
  'https://fonts.gstatic.com/s/nunito/v26/XRXI3I6Li01BKofiOc5wtlZ2di8HDDkhRjtnj6zbXWjgeg.woff2',
];

// ── INSTALL ───────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      // Cache app shell — fail fast if any file is missing
      return cache.addAll(APP_SHELL).then(() => {
        // Opportunistically cache fonts — ignore failures
        return Promise.allSettled(
          EXTERNAL.map((url) => cache.add(url).catch(() => {}))
        );
      });
    }).then(() => self.skipWaiting())
  );
});

// ── ACTIVATE ──────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH ─────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and non-http(s) requests
  if (!url.protocol.startsWith('http')) return;

  // NEVER cache API calls — they must always hit the server
  if (url.pathname.startsWith('/api/')) return;

  // Strategy: cache-first for same-origin app files
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Strategy: stale-while-revalidate for Google Fonts
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }
});

/**
 * Cache-first: serve from cache, fall back to network and cache the response.
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_VERSION);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Offline and not cached — return a minimal offline page if it's a navigation
    if (request.mode === 'navigate') {
      const fallback = await caches.match('/index.html');
      if (fallback) return fallback;
    }
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

/**
 * Stale-while-revalidate: serve cache immediately, update in background.
 */
async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);

  const networkPromise = fetch(request.clone()).then((response) => {
    if (response.ok) {
      const cloned = response.clone();
      caches.open(CACHE_VERSION).then((cache) => cache.put(request, cloned));
    }
    return response;
  }).catch(() => null);

  if (cached) {
    // Update cache in background, serve cached version now
    networkPromise.catch(() => {});
    return cached;
  }

  return await networkPromise || new Response('', { status: 503 });
}
