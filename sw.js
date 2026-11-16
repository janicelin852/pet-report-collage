// Offline cache. Bump VERSION on every release so phones pick up the new files.
const VERSION = 'v3';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-180.png', 'icons/icon-512.png', 'fonts/Huninn.ttf'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  // big static assets: cache first
  if (url.pathname.endsWith('.ttf') || url.pathname.includes('/icons/')) {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
    return;
  }
  // app shell: network first so updates land, cache when offline
  e.respondWith(
    fetch(e.request)
      .then(r => {
        const copy = r.clone();
        caches.open(VERSION).then(c => c.put(e.request, copy));
        return r;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html')))
  );
});
