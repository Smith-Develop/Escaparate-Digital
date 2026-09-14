"use client";

import { AspectCanvas } from "@/components/ui/AspectCanvas";
import { placementStyle, resolveHeight } from "@/lib/placement";
import type { Item } from "@/lib/types";

/**
 * El conjunto montado.
 *
 * No hay cuerpo ni maniquí: solo las prendas, cada una en la posición y el
 * tamaño que el usuario le dio al subirla. Lo que se ve aquí es exactamente lo
 * que se colocó, sin recolocaciones automáticas por el camino.
 *
 * El apilado sigue el orden de la lista —la última prenda va encima—, que es el
 * orden en que el usuario las eligió. Si hay foto de cuerpo entero, va debajo
 * de todo: es el lienzo sobre el que se viste.
 */
export function OutfitCanvas({
  items,
  body,
  className,
  miniatura,
}: {
  items: Item[];
  /** Foto del usuario que hace de base, si la tiene y está activada. */
  body?: { imageUrl: string; x: number; y: number; w: number; h?: number } | null;
  className?: string;
  /**
   * Versión reducida para las casillas del carrusel de looks: sin sombra de
   * suelo, que a 96 px es ruido, y con las imágenes en carga diferida, porque
   * una lista de conjuntos pinta el armario entero de golpe.
   */
  miniatura?: boolean;
}) {
  const carga = miniatura ? ("lazy" as const) : undefined;

  return (
    <AspectCanvas
      className={`relative ${className ?? ""}`}
    >
      {!miniatura && (
        // Sombra bajo la figura: la asienta en el espacio en lugar de dejarla
        // flotando sobre un fondo plano.
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-[3%] left-1/2 h-[3%] w-[46%] -translate-x-1/2 rounded-[50%] blur-md"
          style={{ background: "var(--figure-shadow)" }}
        />
      )}

      {body && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={body.imageUrl}
          alt="Tu foto"
          draggable={false}
          loading={carga}
          decoding="async"
          className="select-none"
          style={placementStyle(body, body.h)}
        />
      )}
      {items.map((item) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={item.id}
          src={item.imageUrl}
          alt={item.name}
          draggable={false}
          loading={carga}
          decoding="async"
          className="select-none"
          style={placementStyle(
            { x: item.placeX, y: item.placeY, w: item.placeW, h: item.placeH },
            resolveHeight(
              { x: item.placeX, y: item.placeY, w: item.placeW, h: item.placeH },
              item.imageWidth,
              item.imageHeight,
            ),
          )}
        />
      ))}
    </AspectCanvas>
  );
}
