"use client";

import { useCallback, useEffect, useRef } from "react";

type Eje = "horizontal" | "vertical";

type Opciones = {
  eje: Eje;
  /** Id que debe quedar centrado. Viene del estado, no de la posición del scroll. */
  seleccionado: string;
  onCentrar: (id: string) => void;
  /** Cambio externo que obliga a recolocar, como cambiar de categoría. */
  clave?: string;
};

/**
 * Carrusel de centrado: la casilla que queda en el centro es la que se aplica.
 *
 * Vive aquí y no en cada raíl porque la mecánica tiene tres sutilezas fáciles de
 * romper al copiarla —el guardia antirrebote, los dos temporizadores con plazos
 * distintos y que el toque tenga que pedir el cambio aparte— y duplicarlas
 * significaría arreglar cada fallo futuro dos veces.
 *
 * Se apoya en el ajuste de desplazamiento del navegador (`scroll-snap`) en lugar
 * de recolocar por JavaScript en cada fotograma, así que el gesto conserva su
 * inercia natural.
 */
export function useCarrusel<T extends HTMLElement>({
  eje,
  seleccionado,
  onCentrar,
  clave,
}: Opciones) {
  const scroller = useRef<T | null>(null);
  // Ignora los desplazamientos que provocamos nosotros al centrar: si no,
  // centrar dispararía otro centrado y entraría en bucle.
  const propio = useRef(false);
  const espera = useRef<ReturnType<typeof setTimeout> | null>(null);
  const liberar = useRef<ReturnType<typeof setTimeout> | null>(null);

  const vertical = eje === "vertical";

  // El eje se resuelve con funciones y no indexando por nombre de propiedad:
  // `scrollTo` acepta claves distintas y así no hay que pelearse con los tipos.
  const hueco = useCallback(
    (el: HTMLElement) => (vertical ? el.clientHeight : el.clientWidth),
    [vertical],
  );
  const inicio = useCallback(
    (nodo: HTMLElement) => (vertical ? nodo.offsetTop : nodo.offsetLeft),
    [vertical],
  );
  const largo = useCallback(
    (nodo: HTMLElement) => (vertical ? nodo.offsetHeight : nodo.offsetWidth),
    [vertical],
  );

  useEffect(
    () => () => {
      if (espera.current) clearTimeout(espera.current);
      if (liberar.current) clearTimeout(liberar.current);
    },
    [],
  );

  const centrar = useCallback(
    (id: string, behavior: ScrollBehavior) => {
      const el = scroller.current;
      const destino = el?.querySelector<HTMLElement>(`[data-id="${CSS.escape(id)}"]`);
      if (!el || !destino) return;

      // Quien ha pedido menos movimiento no quiere ver el carrusel deslizándose.
      const suave =
        behavior === "smooth" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "smooth"
          : "auto";

      propio.current = true;
      const posicion = inicio(destino) - (hueco(el) - largo(destino)) / 2;
      el.scrollTo(vertical ? { top: posicion, behavior: suave } : { left: posicion, behavior: suave });

      if (liberar.current) clearTimeout(liberar.current);
      liberar.current = setTimeout(() => (propio.current = false), suave === "smooth" ? 450 : 80);
    },
    [hueco, inicio, largo, vertical],
  );

  /** Tocar una casilla la centra y la aplica: el guardia silencia el manejador
   *  de desplazamiento, así que el toque tiene que pedirlo por su cuenta. */
  const elegir = useCallback(
    (id: string) => {
      centrar(id, "smooth");
      onCentrar(id);
    },
    [centrar, onCentrar],
  );

  // Recoloca el carrusel cuando la selección cambia desde fuera: un conjunto
  // aleatorio, cargar un look o cambiar de categoría.
  useEffect(() => {
    centrar(seleccionado, "auto");
  }, [seleccionado, clave, centrar]);

  const alDesplazar = useCallback(() => {
    if (propio.current) return;
    if (espera.current) clearTimeout(espera.current);

    // Se espera a que el gesto pare para no ir aplicando casillas a mitad del
    // deslizamiento.
    espera.current = setTimeout(() => {
      const el = scroller.current;
      if (!el) return;

      const centro = (vertical ? el.scrollTop : el.scrollLeft) + hueco(el) / 2;
      let mejor: string | null = null;
      let distancia = Infinity;

      // Se buscan los nodos con `data-id` y no los hijos directos: en el raíl
      // vertical hay envoltorios y espaciadores que podrían ganar como «el más
      // cercano» y silenciar el cambio.
      for (const nodo of Array.from(el.querySelectorAll<HTMLElement>("[data-id]"))) {
        const d = Math.abs(inicio(nodo) + largo(nodo) / 2 - centro);
        if (d < distancia) {
          distancia = d;
          mejor = nodo.dataset.id ?? null;
        }
      }

      if (mejor && mejor !== seleccionado) onCentrar(mejor);
    }, 130);
  }, [hueco, inicio, largo, onCentrar, seleccionado, vertical]);

  return { scroller, alDesplazar, elegir };
}
