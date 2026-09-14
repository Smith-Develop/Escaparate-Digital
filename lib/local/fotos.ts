"use client";

import { borrarUno, guardarUno, leerTodo, leerUno } from "@/lib/local/db";
import { descargarFoto } from "@/lib/datos/fotos";

/**
 * Las fotos, guardadas en el móvil.
 *
 * Es lo que hace que el escaparate se vea sin conexión. Cada foto se descarga
 * **una sola vez**, se guarda entera en IndexedDB y a partir de ahí se pinta
 * desde ahí; ni el service worker ni la red vuelven a intervenir.
 *
 * Solo se guarda el recorte (`imageUrl`). El original sin recortar
 * (`originalUrl`) únicamente sirve para rehacer el recorte, que necesita
 * descargar un modelo de 40 MB y por tanto ya exige conexión: guardarlo
 * duplicaría el espacio ocupado para nada.
 */

type FotoGuardada = { path: string; blob: Blob; bytes: number; fetchedAt: number };

/**
 * URLs de objeto vivas, con tope.
 *
 * Cada `createObjectURL` retiene su blob en memoria hasta que se revoca. Una
 * cuadrícula de doscientas prendas con todas las URL vivas tumba un iPhone, así
 * que se mantienen solo las últimas usadas; el blob sigue en disco, de modo que
 * volver a necesitarla no cuesta red, solo un instante.
 */
const TOPE = 80;
const vivas = new Map<string, string>();

function recordar(ruta: string, url: string) {
  vivas.set(ruta, url);
  while (vivas.size > TOPE) {
    const masVieja = vivas.keys().next().value as string | undefined;
    if (!masVieja) break;
    URL.revokeObjectURL(vivas.get(masVieja)!);
    vivas.delete(masVieja);
  }
}

/** Las descargas en curso, para que diez casillas no pidan la misma foto diez veces. */
const enCurso = new Map<string, Promise<string | null>>();

export async function obtenerFoto(uid: string, ruta: string): Promise<string | null> {
  const viva = vivas.get(ruta);
  if (viva) {
    // Tocarla la pone al final: así el tope descarta lo que de verdad no se usa.
    vivas.delete(ruta);
    vivas.set(ruta, viva);
    return viva;
  }

  const pendiente = enCurso.get(ruta);
  if (pendiente) return pendiente;

  const tarea = (async () => {
    try {
      let guardada = await leerUno<FotoGuardada>(uid, "fotos", ruta);
      if (!guardada) {
        const blob = await descargarFoto(ruta);
        guardada = { path: ruta, blob, bytes: blob.size, fetchedAt: Date.now() };
        await guardarUno(uid, "fotos", guardada);
      }
      const url = URL.createObjectURL(guardada.blob);
      recordar(ruta, url);
      return url;
    } catch {
      // Sin conexión y sin copia: quien pinta decide qué enseñar en su lugar.
      return null;
    } finally {
      enCurso.delete(ruta);
    }
  })();

  enCurso.set(ruta, tarea);
  return tarea;
}

/** Guarda una foto que ya tenemos en memoria: la recién hecha no se descarga. */
export async function guardarFotoLocal(uid: string, ruta: string, blob: Blob) {
  await guardarUno(uid, "fotos", { path: ruta, blob, bytes: blob.size, fetchedAt: Date.now() });
}

/** ¿Está ya descargada? Para saber cuántas faltan sin abrirlas todas. */
export async function rutasGuardadas(uid: string): Promise<Set<string>> {
  const todas = await leerTodo<{ path: string }>(uid, "fotos");
  return new Set(todas.map((f) => f.path));
}

/**
 * Descarga en segundo plano las que falten.
 *
 * De seis en seis: en 4G más paralelismo no va más rápido y sí llena la
 * memoria. Devuelve cuántas quedan por si quien llama quiere ir contándolas.
 */
export async function precargar(
  uid: string,
  rutas: string[],
  avisar?: (hechas: number, total: number) => void,
) {
  const ya = await rutasGuardadas(uid);
  const faltan = rutas.filter((r) => r && !ya.has(r));
  let hechas = 0;

  const obreros = Array.from({ length: Math.min(6, faltan.length) }, async () => {
    for (;;) {
      const ruta = faltan.shift();
      if (!ruta) return;
      await obtenerFoto(uid, ruta);
      avisar?.(++hechas, rutas.length);
    }
  });
  await Promise.all(obreros);
}

/** Borra del móvil las fotos que ya no usa ninguna prenda ni el avatar. */
export async function purgar(uid: string, rutasVivas: Set<string>) {
  const guardadas = await leerTodo<FotoGuardada>(uid, "fotos");
  for (const foto of guardadas) {
    if (!rutasVivas.has(foto.path)) {
      await borrarUno(uid, "fotos", foto.path);
      const url = vivas.get(foto.path);
      if (url) {
        URL.revokeObjectURL(url);
        vivas.delete(foto.path);
      }
    }
  }
}
