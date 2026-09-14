"use client";

import { useEffect } from "react";

/**
 * Título de la pestaña para una pantalla.
 *
 * Las páginas exportaban `metadata`, pero eso solo lo puede hacer un componente
 * de servidor y ya no queda ninguno. Ponerlo a mano es la forma de conservar
 * los títulos —que se ven al compartir la pantalla o en el historial— sin
 * volver a necesitar un servidor.
 */
export function Titulo({ children }: { children: string }) {
  useEffect(() => {
    document.title = `${children} · Escaparate`;
  }, [children]);
  return null;
}
