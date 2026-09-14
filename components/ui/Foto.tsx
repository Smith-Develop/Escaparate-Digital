"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { obtenerFoto } from "@/lib/local/fotos";
import { useSesion } from "@/components/SesionProvider";

/**
 * Una foto del armario.
 *
 * Sustituye a `next/image` en toda la app, y no por capricho: la exportación
 * estática no lleva servidor de imágenes, y aunque se desactive la
 * optimización, `next/image` sigue validando el `src` y rechaza las URL de tipo
 * `blob:`, que es exactamente lo que sirve el espejo local. Como efecto
 * secundario, unifica los dos caminos que había —unas casillas con `fill` y
 * otras con `<img>` a mano— en un solo componente.
 *
 * Lo que recibe es la **ruta** dentro del almacén, no una URL. Quien la
 * convierte en algo pintable es el espejo: si la foto ya está en el móvil, sale
 * al instante y sin red; si no, se descarga una vez y se guarda.
 *
 * También acepta una URL directa (`blob:`, `data:` o `http`), que es lo que
 * usan las vistas previas de la cámara antes de que la foto exista en ningún
 * sitio. Así el mismo componente sirve para el armario y para el alta, y quien
 * lo usa no tiene que saber de cuál de los dos casos se trata.
 *
 * Mientras llega se pinta el color dominante de la prenda, que ya viene en la
 * ficha. Así la cuadrícula tiene su forma desde el primer momento en lugar de
 * una cuadrícula de huecos grises.
 */
const esUrl = (valor: string | null | undefined) =>
  Boolean(valor) && /^(blob:|data:|https?:|\/)/.test(valor!);

export function Foto({
  ruta,
  alt,
  color,
  fill,
  className = "",
  style,
  width,
  height,
  ...resto
}: {
  ruta: string | null | undefined;
  alt: string;
  /** Color dominante de la prenda, para el hueco mientras se descarga. */
  color?: string;
  /** Como el `fill` de next/image: ocupa el contenedor posicionado. */
  fill?: boolean;
  className?: string;
  style?: CSSProperties;
  width?: number;
  height?: number;
} & Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "width" | "height" | "style">) {
  const { uid } = useSesion();
  const directa = esUrl(ruta) ? ruta! : null;
  const [descargada, setDescargada] = useState<string | null>(null);
  const url = directa ?? descargada;

  useEffect(() => {
    if (!uid || !ruta || esUrl(ruta)) return;
    let vigente = true;
    obtenerFoto(uid, ruta).then((u) => {
      if (vigente) setDescargada(u);
    });
    return () => {
      vigente = false;
    };
  }, [uid, ruta]);

  const clases = [fill ? "absolute inset-0 size-full" : "", className].filter(Boolean).join(" ");

  if (!url) {
    return (
      <span
        aria-hidden
        className={[clases, "block animate-pulse rounded-[inherit]"].join(" ")}
        style={{ background: color ?? "var(--color-surface-2)", opacity: color ? 0.35 : 1, ...style }}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      width={width}
      height={height}
      className={clases}
      style={style}
      {...resto}
    />
  );
}
