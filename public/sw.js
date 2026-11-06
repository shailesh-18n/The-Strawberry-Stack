const CACHE_NAME = 'vidyachain-offline-learning-v4';
const OFFLINE_URLS = [
  '/public/offline-learning.html',
  '/public/css/offline-learning.css',
  '/public/js/offline-learning.js',
  '/public/js/app.js',
  '/public/manifest.json',
  '/public/icons/icon-192.png',
  '/public/icons/icon-512.png',
  '/learning/offline-pack',
];
const OFFLINE_PAGE = '/public/offline-learning.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(OFFLINE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names
        .filter((name) => name.startsWith('vidyachain-') && name !== CACHE_NAME)
        .map((name) => caches.delete(name))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  const isOfflineAsset = OFFLINE_URLS.some((url) => requestUrl.pathname === url);
  if (isOfflineAsset) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => (
        await cache.match(event.request) || fetch(event.request)
      )),
    );
    return;
  }

  if (event.request.mode === 'navigate' && requestUrl.pathname === '/learning/progress/state') return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        return cache.match(OFFLINE_PAGE);
      }),
    );
  }
});
