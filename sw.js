// Service Worker: atualização automática (Network-First em app shell + Cache-First em mídia/fontes)
const CACHE = 'nutripro-v13';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './css/print.css',
  './js/vendor/jspdf.umd.min.js',
  './js/vendor/jspdf.plugin.autotable.min.js',
  './js/app.js',
  './js/state.js',
  './js/calculations.js',
  './js/who-lms-data.js',
  './js/bristol.js',
  './js/exams-data.js',
  './js/export.js',
  './js/pdf-export.js',
];
const MEDIA_ASSETS = [
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
  './assets/sprites/dex/bulbasaur.png',
  './assets/sprites/dex/charmander.png',
  './assets/sprites/dex/squirtle.png',
  './assets/sprites/dex/pikachu.png',
  './assets/sprites/dex/eevee.png',
  './assets/sprites/dex/vulpix.png',
  './assets/sprites/dex/jigglypuff.png',
  './assets/sprites/dex/oddish.png',
  './assets/sprites/dex/psyduck.png',
  './assets/sprites/dex/growlithe.png',
  './assets/sprites/dex/poliwag.png',
  './assets/sprites/dex/abra.png',
  './assets/sprites/dex/ponyta.png',
  './assets/sprites/dex/slowpoke.png',
  './assets/sprites/dex/dratini.png',
  './assets/sprites/dex/chikorita.png',
  './assets/sprites/dex/cyndaquil.png',
  './assets/sprites/dex/totodile.png',
  './assets/sprites/dex/togepi.png',
  './assets/sprites/dex/marill.png',
  './assets/sprites/dex/pichu.png',
  './assets/sprites/dex/heracross.png',
  './assets/sprites/dex/treecko.png',
  './assets/sprites/dex/torchic.png',
  './assets/sprites/dex/mudkip.png',
  './assets/sprites/dex/anim/bulbasaur.gif',
  './assets/sprites/dex/anim/charmander.gif',
  './assets/sprites/dex/anim/squirtle.gif',
  './assets/sprites/dex/anim/pikachu.gif',
  './assets/sprites/dex/anim/eevee.gif',
  './assets/sprites/dex/anim/vulpix.gif',
  './assets/sprites/dex/anim/jigglypuff.gif',
  './assets/sprites/dex/anim/oddish.gif',
  './assets/sprites/dex/anim/psyduck.gif',
  './assets/sprites/dex/anim/growlithe.gif',
  './assets/sprites/dex/anim/poliwag.gif',
  './assets/sprites/dex/anim/abra.gif',
  './assets/sprites/dex/anim/ponyta.gif',
  './assets/sprites/dex/anim/slowpoke.gif',
  './assets/sprites/dex/anim/dratini.gif',
  './assets/sprites/dex/anim/chikorita.gif',
  './assets/sprites/dex/anim/cyndaquil.gif',
  './assets/sprites/dex/anim/totodile.gif',
  './assets/sprites/dex/anim/togepi.gif',
  './assets/sprites/dex/anim/marill.gif',
  './assets/sprites/dex/anim/pichu.gif',
  './assets/sprites/dex/anim/heracross.gif',
  './assets/sprites/dex/anim/treecko.gif',
  './assets/sprites/dex/anim/torchic.gif',
  './assets/sprites/dex/anim/mudkip.gif',
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
const ASSETS = [...CORE_ASSETS, ...MEDIA_ASSETS];

const STATIC_RE = /\/(?:assets\/(?:fonts|bg|sprites)|icons)\//;

async function cacheOne(cache, url) {
  try {
    const res = await fetch(new Request(url, { cache: 'no-store' }));
    if (res && res.ok) await cache.put(url, res);
    else console.warn('[NutriPro SW] Falha ao pré-cachear:', url, res && res.status);
  } catch (err) {
    console.warn('[NutriPro SW] Erro ao pré-cachear:', url, err);
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then(async (c) => {
      await Promise.allSettled(CORE_ASSETS.map((u) => cacheOne(c, u)));
      await Promise.allSettled(MEDIA_ASSETS.map((u) => cacheOne(c, u)));
      return self.skipWaiting();
    })
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
