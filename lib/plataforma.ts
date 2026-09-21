"use client";

/**
 * ¿Esto corre dentro del APK o en un navegador?
 *
 * La pregunta sale en sitios muy distintos —la sesión, compartir, el botón
 * atrás, lo que se enseña y lo que no— y conviene que la respuesta sea una
 * sola. Antes estaba copiada en cuatro ficheros, con el riesgo de que alguna
 * copia se quedara atrás.
 *
 * Se mira el objeto global que instala Capacitor en vez de importar
 * `@capacitor/core`: así el paquete de la web no arrastra código del puente
 * nativo, que allí no hace nada. En el navegador ese objeto puede existir
 * igualmente —lo define el propio Capacitor si algún complemento se carga— pero
 * contesta `false`, que es justo lo que queremos.
 */
export function esAppNativa() {
  if (typeof window === "undefined") return false;
  const capacitor = (window as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return capacitor?.isNativePlatform?.() === true;
}
