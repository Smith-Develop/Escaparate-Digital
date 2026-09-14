import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Empaquetado para Android.
 *
 * `webDir: "out"` es la clave de todo: los ficheros que genera `npm run build`
 * viajan **dentro del APK**, así que la app abre sin tocar la red y no depende
 * de que el servidor esté en pie. Deliberadamente **no** se usa `server.url`:
 * apuntarlo a la web publicada convertiría el APK en una cáscara que carga la
 * página por internet, que es justo lo contrario de lo que se busca.
 *
 * `androidScheme: "https"` sirve la app desde `https://localhost`, que cuenta
 * como contexto seguro. Hace falta: sin él no hay `crypto.subtle`, ni
 * IndexedDB fiable, ni WebAssembly con hilos, y el recorte de fondo dejaría de
 * funcionar dentro de la app.
 */
const config: CapacitorConfig = {
  appId: "app.escaparate.armario",
  appName: "Escaparate",
  webDir: "out",
  android: {
    // El fondo mientras carga: el mismo negro del tema, para que no pegue un
    // fogonazo blanco al abrir.
    backgroundColor: "#000000",
  },
  server: {
    androidScheme: "https",
  },
};

export default config;
