import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Escaparate · Armario virtual",
    short_name: "Escaparate",
    description: "Digitaliza tu ropa y monta conjuntos con las fotos reales de tus prendas.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#000000",
    theme_color: "#000000",
    lang: "es",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Añadir prenda", url: "/dashboard/closet/new" },
      { name: "Montar un look", url: "/dashboard/studio" },
    ],
  };
}
