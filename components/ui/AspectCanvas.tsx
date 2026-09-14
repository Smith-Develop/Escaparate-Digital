"use client";

import type { ReactNode, RefObject } from "react";
import { CANVAS_ASPECT } from "@/lib/placement";

type Props = {
  children: ReactNode;
  className?: string;
  /** Referencia a la caja interior, la que define el sistema de coordenadas. */
  boxRef?: RefObject<HTMLDivElement | null>;
};

/**
 * Lienzo del probador: una caja con la proporción exacta de `CANVAS_ASPECT`,
 * lo más grande que quepa en el hueco disponible.
 *
 * Lo usan el editor de colocación y el estudio, y eso es justamente el motivo
 * de que exista. Las prendas se guardan en coordenadas relativas al lienzo, así
 * que si las dos pantallas dibujaran cajas con proporciones distintas, la misma
 * prenda saldría desplazada y de otro tamaño en cada una. Antes pasaba: el flex
 * del estudio estiraba la caja a lo alto y `aspect-ratio` no lo impedía, porque
 * un elemento flexible puede encogerse por debajo de su anchura preferida.
 *
 * La solución son unidades de consulta de contenedor: la altura se toma como la
 * menor entre el alto disponible y el que permitiría el ancho, y la anchura sale
 * de la proporción. Así la caja nunca se deforma, quepa por donde quepa.
 */
export function AspectCanvas({ children, className, boxRef }: Props) {
  return (
    <div className="grid size-full place-items-center" style={{ containerType: "size" }}>
      <div
        ref={boxRef}
        className={className}
        style={{
          aspectRatio: CANVAS_ASPECT,
          height: `min(100cqh, 100cqw / ${CANVAS_ASPECT})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
