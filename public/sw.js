/* Service worker de Escaparate.
   Objetivo: que el armario se abra al instante y siga siendo consultable sin
   cobertura. Las respuestas de la API se cachean para poder mostrarlas en modo
   offline, pero siempre se intenta la red primero. */

const VERSION = "escaparate-v1";
const SHELL = ["/", "/dashboard", "/dashboard/closet", "/dashboard/looks", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(SHELL).catch(() => undefined)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Fotos de prendas y recursos estáticos: caché primero, son inmutables.
  const isAsset = url.pathname.startsWith("/uploads/") || url.pathname.startsWith("/_next/static/");
  if (isAsset) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(VERSION).then((cache) => cache.put(request, copy));
            return response;
          }),
      ),
    );
    return;
  }

  // Páginas y API: red primero, con la última copia buena como respaldo.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(VERSION).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request).then((hit) => hit || caches.match("/dashboard"))),
  );
});
