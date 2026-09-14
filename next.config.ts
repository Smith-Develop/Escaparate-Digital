import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";
const port = process.env.PORT ?? "3000";

/**
 * Orígenes extra permitidos en desarrollo, separados por comas.
 * Ejemplo:  ALLOWED_DEV_ORIGINS="mi-tunel.ngrok-free.app,192.168.1.50:3000"
 */
const extraOrigins = (process.env.ALLOWED_DEV_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

/**
 * Túneles de desarrollo (VS Code Dev Tunnels, ngrok, Cloudflare…).
 *
 * Estos túneles sirven la app en un dominio público pero reenvían la petición
 * al servidor local reescribiendo la cabecera `Origin` a `localhost:<puerto>`,
 * mientras que `x-forwarded-host` conserva el dominio del túnel. Next compara
 * ambas para protegerse de CSRF, no coinciden, y rechaza cualquier Server
 * Action con "Invalid Server Actions request" —lo que rompe el login y el
 * registro al entrar desde el móvil.
 *
 * Solo se relaja en desarrollo: en producción se mantiene la comprobación
 * estricta de origen.
 */
const devOrigins = [
  `localhost:${port}`,
  `127.0.0.1:${port}`,
  "**.devtunnels.ms",
  "**.ngrok-free.app",
  "**.ngrok.app",
  "**.trycloudflare.com",
  ...extraOrigins,
];

const nextConfig: NextConfig = {
  // Tapa la barra de navegación inferior en móvil durante el desarrollo.
  devIndicators: false,

  // Permite que el túnel cargue los recursos de desarrollo (HMR incluido).
  ...(isDev ? { allowedDevOrigins: devOrigins } : {}),

  experimental: {
    ...(isDev ? { serverActions: { allowedOrigins: devOrigins } } : {}),
  },
};

export default nextConfig;
