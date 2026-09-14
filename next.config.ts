import type { NextConfig } from "next";

/**
 * Escaparate se compila como sitio estático.
 *
 * `output: "export"` deja en `out/` todo el HTML, el CSS y el JavaScript, sin
 * servidor detrás. Eso es lo que permite meter la app entera dentro del APK y
 * que abra sin tocar la red, y lo que hace que la web se sirva desde cualquier
 * sitio que entregue ficheros.
 *
 * A cambio no hay server actions, ni rutas de API, ni cookies, ni optimización
 * de imágenes: todo eso se ha sustituido por llamadas a Supabase desde el
 * propio dispositivo y por el espejo local.
 */
const nextConfig: NextConfig = {
  output: "export",

  // Sin servidor no hay quien redimensione imágenes. Da igual: las fotos se
  // pintan desde el espejo del móvil, con `components/ui/Foto.tsx`.
  images: { unoptimized: true },

  // Hace que cada ruta salga como `carpeta/index.html` en vez de `carpeta.html`.
  // Es la única forma que resuelven tanto el servidor local de Capacitor dentro
  // del APK como un nginx sencillo; sin esto, recargar una pantalla interna da
  // una página en blanco.
  trailingSlash: true,

  devIndicators: false,
};

export default nextConfig;
