import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AtrasAndroid } from "@/components/AtrasAndroid";
import { ServiceWorker } from "@/components/ServiceWorker";
import { SesionProvider } from "@/components/SesionProvider";
import { ThemeSync } from "@/components/ThemeSync";
import { THEME_BOOTSTRAP } from "@/lib/theme";

// Una sola familia en toda la interfaz, con las ligaduras activadas.
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Escaparate · Tu armario virtual",
  description:
    "Digitaliza tu ropa y monta conjuntos con las fotos reales de tus prendas.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Escaparate" },
  // En iOS el icono de la pantalla de inicio sale de aquí, no del manifiesto.
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  // El script de arranque ajusta este valor al tema real; estas entradas cubren
  // el primer instante y a quien tenga JavaScript desactivado.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
  // Sin límite de escala: bloquear el zoom deja fuera a quien necesita ampliar.
  // Los gestos de colocar una prenda ya paran la propagación por su cuenta.
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      data-theme="claro"
      className={`${geistSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-canvas text-ink">
        {/* Se ejecuta antes de pintar: evita el destello de tema equivocado. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
        <SesionProvider>{children}</SesionProvider>
        <AtrasAndroid />
        <ThemeSync />
        <ServiceWorker />
      </body>
    </html>
  );
}
