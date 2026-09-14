/* Service worker de Escaparate.
 *
 * La app es un sitio estático: el HTML, el CSS y el JavaScript no cambian entre
 * despliegues, así que se guardan enteros la primera vez y a partir de ahí se
 * sirven desde el móvil. Eso es lo que permite abrir la app sin cobertura y lo
 * que hace que arranque al instante.
 *
 * Lo que NO hace este fichero: guardar datos. El armario y las fotos viven en
 * IndexedDB, que es donde la app sabe buscarlos y donde puede consultarlos sin
 * red. Un service worker cacheando respuestas de la API daría la ilusión de
 * funcionar y fallaría en cuanto la petición cambiara un parámetro.
 *
 * La lista de ficheros la genera `scripts/build-sw.mjs` recorriendo `out/`
 * después de compilar: escribirla a mano es garantía de olvidarse justo del
 * fragmento que hace falta para arrancar sin red.
 */

const VERSION = "__VERSION__";
const PRECARGA = __PRECACHE__;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(VERSION).then(async (cache) => {
      // De uno en uno y sin rendirse: si un fichero falla, el resto se guarda
      // igual. Con addAll(), un solo 404 dejaría la app sin nada cacheado.
      await Promise.all(PRECARGA.map((ruta) => cache.add(ruta).catch(() => undefined)));
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((claves) => Promise.all(claves.filter((c) => c !== VERSION).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Supabase y cualquier otro servidor: ni tocarlo. Las peticiones de datos las
  // gobierna la app, que ya sabe qué hacer cuando no hay red.
  if (url.origin !== self.location.origin) return;

  // Una navegación sin red se resuelve con la copia guardada de esa pantalla, y
  // si no la hubiera, con el armario: es la pantalla útil por omisión.
  if (request.mode === "navigate") {
    event.respondWith(
      caches.match(request, { ignoreSearch: true }).then(
        (guardada) =>
          guardada ??
          fetch(request).catch(
            async () =>
              (await caches.match("/dashboard/closet/")) ??
              (await caches.match("/")) ??
              Response.error(),
          ),
      ),
    );
    return;
  }

  // El resto son ficheros con huella en el nombre: no cambian nunca, así que
  // primero la copia y solo se va a la red si no la hay.
  event.respondWith(
    caches.match(request).then(
      (guardada) =>
        guardada ??
        fetch(request).then((respuesta) => {
          if (respuesta.ok && respuesta.type === "basic") {
            const copia = respuesta.clone();
            caches.open(VERSION).then((cache) => cache.put(request, copia));
          }
          return respuesta;
        }),
    ),
  );
});
