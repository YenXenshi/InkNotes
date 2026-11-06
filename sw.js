// Offline support. The page itself is "network first" (always fresh when online); the picture packs and the
// chart library never change between builds, so they are "cache first" and each one is kept the first time it is used.
const V = 'LNNbaQhDXZ', A = 'jWB9fvHQd66449';
const SHELL = 'shell-' + V, ASSETS = 'assets-' + A;
const FILES = ['./', 'index.html', 'app.js', 'app.css', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'assets/icon.svg'];

self.addEventListener('install', e => e.waitUntil(caches.open(SHELL).then(c => Promise.allSettled(FILES.map(f => fetch(f, { cache: 'no-cache' }).then(r => r.ok && c.put(f, r))))).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== SHELL && k !== ASSETS).map(k => caches.delete(k)))).then(() => self.clients.claim())));

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;     // never touches Gemini or anything else off-site
  const isAsset = url.pathname.includes('/assets/') && !url.pathname.endsWith('/icon.svg');
  e.respondWith(isAsset
    ? caches.open(ASSETS).then(c => c.match(req).then(hit => hit || fetch(req).then(res => { if (res.ok) c.put(req, res.clone()); return res; })))
    : fetch(req, { cache: 'no-cache' }).then(res => { if (res.ok) { const copy = res.clone(); caches.open(SHELL).then(c => c.put(req, copy)); } return res; }).catch(() => caches.match(req, { ignoreSearch: true })));
});
