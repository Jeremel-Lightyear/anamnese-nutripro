// Service Worker: atualização automática (Network-First em app shell + Cache-First em mídia/fontes)
const CACHE = 'nutripro-v10';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './css/print.css',
  './js/app.js',
  './js/state.js',
  './js/calculations.js',
  './js/who-lms-data.js',
  './js/bristol.js',
  './js/exams-data.js',
  './js/export.js',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './assets/sprites/bulbasaur.png',
  './assets/sprites/charmander.png',
  './assets/sprites/pikachu.png',
  './assets/sprites/squirtle.png',
  './assets/sprites/chansey.png',
  './assets/sprites/snorlax.png',
  './assets/sprites/munchlax.png',
  './assets/sprites/chimchar.png',
  './assets/sprites/mimikyu.png',
  './assets/bg/bulbasaur.png',
  './assets/bg/charmander.png',
  './assets/bg/squirtle.png',
  './assets/bg/pikachu.png',
  './assets/bg/chimchar.png',
  './assets/bg/mimikyu.png',
  './assets/fonts/nunito-400-latin-ext.woff2',
  './assets/fonts/nunito-400-latin.woff2',
  './assets/fonts/nunito-600-latin-ext.woff2',
  './assets/fonts/nunito-600-latin.woff2',
  './assets/fonts/nunito-700-latin-ext.woff2',
  './assets/fonts/nunito-700-latin.woff2',
  './assets/fonts/nunito-800-latin-ext.woff2',
  './assets/fonts/nunito-800-latin.woff2',
];

const STATIC_RE = /\/(?:assets\/(?:fonts|bg|sprites)|icons)\//;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: 'no-store' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Cache-First apenas para assets estáticos pesados (fontes, sprites, artworks, ícones)
  if (STATIC_RE.test(url.pathname)) {
    event.respondWith(
      caches.match(req, { ignoreSearch: true }).then((hit) => {
        if (hit) return hit;
        return fetch(req).then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        });
      })
    );
    return;
  }

  // Network-First com fallback para cache (navegações, .html, .js, .css, manifest.json)
  event.respondWith(
    fetch(req.url, { cache: 'no-store' })
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req, { ignoreSearch: true }).then((hit) =>
          hit || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error())
        )
      )
  );
});
