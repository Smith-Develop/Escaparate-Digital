"use client";

import { obtenerFoto } from "@/lib/local/fotos";
import { CANVAS_ASPECT, resolveHeight } from "@/lib/placement";
import type { Item } from "@/lib/types";

/**
 * El conjunto, convertido en una imagen que se puede mandar por ahí.
 *
 * Repite en un lienzo la misma colocación que se ve en pantalla —las mismas
 * coordenadas relativas, el mismo orden de apilado—, así que lo que se comparte
 * es exactamente lo que el usuario montó.
 *
 * Sale en vertical 1080×1920 porque es lo que esperan las historias de las
 * redes; en cuadrado habría que recortar la figura, que es alta y estrecha por
 * definición.
 *
 * Las fotos salen del espejo local, o sea que **funciona sin conexión**: si se
 * pudiera ver el conjunto, se puede compartir.
 */

const ANCHO = 1080;
const ALTO = 1920;
/** Caja donde vive la figura, con la proporción del probador. */
const FIGURA_ALTO = 1560;
const FIGURA_ANCHO = FIGURA_ALTO * CANVAS_ASPECT;
const MARGEN_X = (ANCHO - FIGURA_ANCHO) / 2;
const MARGEN_Y = 90;

type Cuerpo = { imageUrl: string; x: number; y: number; w: number; h?: number } | null;

export async function componerConjunto(
  uid: string,
  items: Item[],
  cuerpo: Cuerpo,
  titulo?: string,
): Promise<Blob> {
  const lienzo = document.createElement("canvas");
  lienzo.width = ANCHO;
  lienzo.height = ALTO;
  const ctx = lienzo.getContext("2d");
  if (!ctx) throw new Error("No se pudo preparar la imagen");

  pintarFondo(ctx, items);

  // El mismo orden que en pantalla: la foto de cuerpo entero debajo de todo y
  // las prendas en el orden en que se eligieron.
  if (cuerpo) {
    await pintarPieza(ctx, uid, cuerpo.imageUrl, {
      x: cuerpo.x,
      y: cuerpo.y,
      w: cuerpo.w,
      alto: cuerpo.h && cuerpo.h > 0 ? cuerpo.h : 0,
    });
  }
  for (const prenda of items) {
    await pintarPieza(ctx, uid, prenda.imageUrl, {
      x: prenda.placeX,
      y: prenda.placeY,
      w: prenda.placeW,
      alto: resolveHeight(
        { x: prenda.placeX, y: prenda.placeY, w: prenda.placeW, h: prenda.placeH },
        prenda.imageWidth,
        prenda.imageHeight,
      ),
    });
  }

  pintarPie(ctx, titulo);

  return new Promise<Blob>((resolve, reject) => {
    lienzo.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("No se pudo generar la imagen"))),
      "image/png",
    );
  });
}

/** Degradado teñido con la ropa puesta, como el telón del probador. */
function pintarFondo(ctx: CanvasRenderingContext2D, items: Item[]) {
  const colores = items
    .map((i) => i.dominantColor)
    .filter((c): c is string => /^#[0-9a-fA-F]{6}$/.test(c ?? ""));

  const degradado = ctx.createLinearGradient(0, 0, ANCHO * 0.4, ALTO);
  if (colores.length === 0) {
    degradado.addColorStop(0, "#f4efe6");
    degradado.addColorStop(1, "#ffffff");
  } else {
    // Hacia el blanco, que es lo que hace `color-mix` con la superficie clara.
    degradado.addColorStop(0, aclarar(colores[0], 0.72));
    degradado.addColorStop(0.55, aclarar(colores[Math.floor(colores.length / 2)], 0.8));
    degradado.addColorStop(1, aclarar(colores.at(-1)!, 0.88));
  }
  ctx.fillStyle = degradado;
  ctx.fillRect(0, 0, ANCHO, ALTO);
}

async function pintarPieza(
  ctx: CanvasRenderingContext2D,
  uid: string,
  ruta: string,
  caja: { x: number; y: number; w: number; alto: number },
) {
  const url = await obtenerFoto(uid, ruta);
  if (!url) return; // Sin copia local no se pinta; mejor eso que romper la imagen.

  const imagen = new Image();
  imagen.src = url;
  await imagen.decode().catch(() => undefined);
  if (!imagen.naturalWidth) return;

  const ancho = caja.w * FIGURA_ANCHO;
  const alto =
    caja.alto > 0
      ? caja.alto * FIGURA_ALTO
      : (ancho * imagen.naturalHeight) / imagen.naturalWidth;

  ctx.drawImage(
    imagen,
    MARGEN_X + (caja.x - caja.w / 2) * FIGURA_ANCHO,
    MARGEN_Y + caja.y * FIGURA_ALTO,
    ancho,
    alto,
  );
}

/** La firma de abajo: de dónde sale la imagen. */
function pintarPie(ctx: CanvasRenderingContext2D, titulo?: string) {
  ctx.textAlign = "center";

  if (titulo) {
    ctx.fillStyle = "#1e1d1a";
    ctx.font = "600 56px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText(titulo, ANCHO / 2, ALTO - 150, ANCHO - 160);
  }

  ctx.fillStyle = "#736f66";
  ctx.font = "500 34px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("E S C A P A R A T E", ANCHO / 2, ALTO - 80);
}

/** Mezcla un color hacia el blanco. 0 = tal cual, 1 = blanco. */
function aclarar(hex: string, cantidad: number) {
  const n = Number.parseInt(hex.slice(1), 16);
  const mezcla = (canal: number) => Math.round(canal + (255 - canal) * cantidad);
  const r = mezcla((n >> 16) & 255);
  const g = mezcla((n >> 8) & 255);
  const b = mezcla(n & 255);
  return `rgb(${r} ${g} ${b})`;
}
