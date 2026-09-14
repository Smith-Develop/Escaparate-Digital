import type { MetadataRoute } from "next";

// La exportación estática necesita que el manifiesto se genere en la
// compilación: no hay servidor que lo produzca al vuelo.
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Escaparate · Armario virtual",
    short_name: "Escaparate",
    description: "Digitaliza tu ropa y monta conjuntos con las fotos reales de tus prendas.",
    // Con `trailingSlash` las rutas terminan en barra; sin ella, el navegador
    // pide una redirección que en un sitio estático no existe.
    start_url: "/dashboard/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#000000",
    theme_color: "#000000",
    lang: "es",
    // Los PNG no son opcionales: iOS no acepta SVG para el icono de la
    // pantalla de inicio, y Chrome pide 192 y 512 para ofrecer instalar la app.
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
    shortcuts: [
      { name: "Añadir prenda", url: "/dashboard/closet/new/" },
      { name: "Montar un look", url: "/dashboard/studio/" },
    ],
  };
}
