"use client";

import { supabase } from "@/lib/supabase/cliente";
import { intentar, siFalla } from "@/lib/datos/errores";

/**
 * Las fotos, en el almacén de Supabase.
 *
 * Lo que se guarda en la prenda es la **ruta** dentro del bucket, no una URL:
 * el bucket es privado y sus enlaces caducan, así que una URL guardada dejaría
 * de servir a la hora. La ruta empieza por el identificador del usuario, que es
 * lo que mira la política del almacén para dejar entrar solo a su dueño.
 */

const BUCKET = "escaparate-fotos";

const EXTENSIONES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export async function subirFoto(blob: Blob, uid: string): Promise<string> {
  const extension = EXTENSIONES[blob.type] ?? "png";
  const ruta = `${uid}/${crypto.randomUUID()}.${extension}`;

  return intentar("subiendo la foto", async () => {
    const { error } = await supabase()
      .storage.from(BUCKET)
      .upload(ruta, blob, { contentType: blob.type || "image/png", upsert: false });
    siFalla(error, "subiendo la foto");
    return ruta;
  });
}

/** Borra fotos del almacén. Falla en silencio: son bytes, no datos. */
export async function borrarFotos(rutas: (string | null | undefined)[]) {
  const limpias = rutas.filter((r): r is string => Boolean(r));
  if (limpias.length === 0) return;
  await supabase().storage.from(BUCKET).remove(limpias).catch(() => undefined);
}

/** Enlace temporal para descargar una foto. Se usa y se tira. */
export async function urlFirmada(ruta: string, segundos = 60) {
  return intentar("preparando la foto", async () => {
    const { data, error } = await supabase().storage.from(BUCKET).createSignedUrl(ruta, segundos);
    siFalla(error, "preparando la foto");
    return data!.signedUrl;
  });
}

/** Descarga la foto para guardarla en el móvil. */
export async function descargarFoto(ruta: string): Promise<Blob> {
  return intentar("descargando la foto", async () => {
    const { data, error } = await supabase().storage.from(BUCKET).download(ruta);
    siFalla(error, "descargando la foto");
    return data!;
  });
}
