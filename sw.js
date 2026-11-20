// Service worker aplikacji Golf – tryb offline.
// Po każdej zmianie index.html podbij numer wersji, żeby telefon pobrał nową wersję.
const WERSJA = 'golf-v1';
const PLIKI = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(WERSJA).then(c => c.addAll(PLIKI)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(klucze => Promise.all(klucze.filter(k => k !== WERSJA).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Czcionki Google: z pamięci podręcznej, w tle odświeżane (bez zasięgu – wersja zapisana)
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.open(WERSJA).then(async c => {
        const zapis = await c.match(req);
        const siec = fetch(req).then(r => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }).catch(() => zapis);
        return zapis || siec;
      })
    );
    return;
  }

  // Pliki aplikacji: najpierw sieć (świeża wersja), bez zasięgu – kopia z pamięci
  if (url.origin === self.location.origin) {
    e.respondWith(
      fetch(req)
        .then(r => { const kopia = r.clone(); caches.open(WERSJA).then(c => c.put(req, kopia)); return r; })
        .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
  }
});
