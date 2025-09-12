
const CACHE_NAME = "reporte-visitas-cache-v4";
const urlsToCache = [
  "./",
  "./index.html",
  "./manifest.json",
  "./auth.js",
  "./admin-panel.js",
  "./firebase-sync.js",
  "./firebase-users.js",
  "./icono-192.png",
  "./icono-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
