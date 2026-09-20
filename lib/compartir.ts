"use client";

/**
 * Compartir, en los tres sitios donde corre la app.
 *
 * No hay una sola forma que valga en todas partes:
 *
 *   · En el **APK** el WebView de Android no trae `navigator.share`, así que se
 *     usa el complemento de Capacitor, que abre la bandeja del sistema. Para
 *     mandar una imagen hay que escribirla antes en disco: el complemento
 *     comparte ficheros, no datos en memoria.
 *   · En la **web móvil** —Android y iPhone— `navigator.share` sí existe, y con
 *     `files` manda la imagen a WhatsApp, Instagram o donde sea.
 *   · En **escritorio**, donde normalmente no hay nada de eso, se copia el
 *     enlace al portapapeles y se avisa.
 *
 * Devuelve qué acabó pasando para que la interfaz lo cuente: compartir en
 * silencio y que el usuario no sepa si ha funcionado es peor que no ofrecerlo.
 */

export type ResultadoCompartir = "compartido" | "copiado" | "descargado" | "cancelado" | "imposible";

const enCapacitor = () =>
  typeof window !== "undefined" &&
  (window as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.() ===
    true;

/**
 * La dirección pública de la app.
 *
 * Dentro del APK, `location.origin` es `https://localhost`, que no le sirve a
 * nadie: por eso la dirección de verdad viaja en una variable de compilación.
 */
export function enlaceDeLaApp(): string {
  const configurada = process.env.NEXT_PUBLIC_SITIO_URL;
  if (configurada) return configurada;
  if (typeof window === "undefined") return "";
  const origen = window.location.origin;
  return /localhost|127\.0\.0\.1/.test(origen) ? "" : origen;
}

/** Comparte un enlace, con el texto que lo acompaña. */
export async function compartirEnlace(titulo: string, texto: string): Promise<ResultadoCompartir> {
  const url = enlaceDeLaApp();
  if (!url) return "imposible";

  if (enCapacitor()) {
    try {
      const { Share } = await import("@capacitor/share");
      await Share.share({ title: titulo, text: texto, url, dialogTitle: titulo });
      return "compartido";
    } catch {
      return "cancelado";
    }
  }

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title: titulo, text: texto, url });
      return "compartido";
    } catch {
      // Cancelar la bandeja del sistema también lanza; no es un error.
      return "cancelado";
    }
  }

  return copiar(`${texto} ${url}`.trim());
}

/** Comparte una imagen ya compuesta. */
export async function compartirImagen(
  blob: Blob,
  nombre: string,
  titulo: string,
  texto: string,
): Promise<ResultadoCompartir> {
  if (enCapacitor()) {
    try {
      const [{ Share }, { Filesystem, Directory }] = await Promise.all([
        import("@capacitor/share"),
        import("@capacitor/filesystem"),
      ]);
      const datos = await comoBase64(blob);
      // En la caché: es un fichero de usar y tirar que el sistema puede limpiar.
      const { uri } = await Filesystem.writeFile({
        path: nombre,
        data: datos,
        directory: Directory.Cache,
      });
      await Share.share({ title: titulo, text: texto, files: [uri], dialogTitle: titulo });
      return "compartido";
    } catch {
      return "cancelado";
    }
  }

  const fichero = new File([blob], nombre, { type: blob.type || "image/png" });
  if (
    typeof navigator !== "undefined" &&
    navigator.canShare?.({ files: [fichero] }) &&
    navigator.share
  ) {
    try {
      await navigator.share({ files: [fichero], title: titulo, text: texto });
      return "compartido";
    } catch {
      return "cancelado";
    }
  }

  // Sin bandeja del sistema queda descargarla y que el usuario la mande.
  return descargar(blob, nombre);
}

async function copiar(texto: string): Promise<ResultadoCompartir> {
  try {
    await navigator.clipboard.writeText(texto);
    return "copiado";
  } catch {
    return "imposible";
  }
}

function descargar(blob: Blob, nombre: string): ResultadoCompartir {
  try {
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = nombre;
    enlace.click();
    // Se revoca con retraso: revocarlo en el acto cancela la descarga.
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return "descargado";
  } catch {
    return "imposible";
  }
}

const comoBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(String(lector.result).split(",")[1] ?? "");
    lector.onerror = () => reject(lector.error);
    lector.readAsDataURL(blob);
  });
