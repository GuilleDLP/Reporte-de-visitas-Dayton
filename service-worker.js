
const CACHE_NAME = "reporte-visitas-cache-v7";
const urlsToCache = [
  "./",
  "./index.html",
  "./manifest.json",
  "./auth.js",
  "./admin-panel.js",
  "./github-config.js",
  "./github-sync.js",
  "./icono-192.png",
  "./icono-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  // Forzar activación inmediata del nuevo service worker
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Eliminar cachés antiguos
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Eliminando caché antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Tomar control inmediato de todas las páginas
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // Si hay una respuesta en caché, usarla, sino buscar en red
      return response || fetch(event.request);
    })
  );
});
