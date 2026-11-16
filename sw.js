// Offline cache. Bump VERSION on every release so phones pick up the new files.
const VERSION = 'v4';
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

// Cache first, always: the app opens instantly even on a weak signal (clients' homes).
// In the background, files are refreshed from the network for the next launch;
// a new release (new VERSION) is picked up the next time the app is opened online.
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => {
      const net = fetch(e.request)
        .then(r => {
          if (r.ok) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); }
          return r;
        })
        .catch(() => null);
      if (hit) { e.waitUntil(net); return hit; }
      return net.then(r => r || caches.match('index.html'));
    })
  );
});
