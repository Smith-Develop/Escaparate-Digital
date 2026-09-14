"use client";

import { useRef, useState, type ReactNode } from "react";

type Vista = { escala: number; x: number; y: number };

const INICIAL: Vista = { escala: 1, x: 0, y: 0 };
const MAX = 3;

/**
 * Acercar y desplazar el conjunto.
 *
 * Pellizcar amplía, arrastrar recorre cuando está ampliado y un toque doble
 * vuelve al encuadre completo. Solo se anima `transform`, que va en el
 * compositor y no recalcula la maquetación en cada fotograma.
 *
 * La transformación es puramente visual: no toca las coordenadas con las que se
 * guardan las prendas, así que ampliar no mueve nada de sitio.
 */
export function ZoomPan({ children }: { children: ReactNode }) {
  const [vista, setVista] = useState<Vista>(INICIAL);
  const punteros = useRef(new Map<number, { x: number; y: number }>());
  const pellizco = useRef<{ distancia: number; escala: number } | null>(null);
  const ultimoToque = useRef(0);
  // En estado y no en una referencia: el render necesita saberlo para decidir
  // si la transformación va con transición o sigue al dedo.
  const [gesto, setGesto] = useState(false);

  function abajo(event: React.PointerEvent) {
    (event.currentTarget as Element).setPointerCapture(event.pointerId);
    punteros.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    const ahora = Date.now();
    if (punteros.current.size === 1) {
      // Toque doble: volver al encuadre completo.
      if (ahora - ultimoToque.current < 300) setVista(INICIAL);
      ultimoToque.current = ahora;
    }
  }

  function mover(event: React.PointerEvent) {
    const previo = punteros.current.get(event.pointerId);
    if (!previo) return;
    punteros.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    const activos = [...punteros.current.values()];

    if (activos.length >= 2) {
      const distancia = Math.hypot(activos[0].x - activos[1].x, activos[0].y - activos[1].y);
      if (!pellizco.current) {
        pellizco.current = { distancia, escala: vista.escala };
        setGesto(true);
        return;
      }
      const escala = Math.min(
        MAX,
        Math.max(1, (pellizco.current.escala * distancia) / (pellizco.current.distancia || 1)),
      );
      setVista((v) => ({ ...v, escala, ...(escala === 1 ? { x: 0, y: 0 } : {}) }));
      return;
    }

    // Con el conjunto a tamaño completo no hay nada que recorrer.
    if (vista.escala <= 1) return;
    setGesto(true);
    const dx = event.clientX - previo.x;
    const dy = event.clientY - previo.y;
    setVista((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
  }

  function arriba(event: React.PointerEvent) {
    punteros.current.delete(event.pointerId);
    pellizco.current = null;
    if (punteros.current.size === 0) setGesto(false);
  }

  return (
    <div
      onPointerDown={abajo}
      onPointerMove={mover}
      onPointerUp={arriba}
      onPointerCancel={arriba}
      className="size-full touch-none"
      style={{
        transform: `translate3d(${vista.x}px, ${vista.y}px, 0) scale(${vista.escala})`,
        transition: gesto ? "none" : "transform 180ms ease-out",
      }}
    >
      {children}
    </div>
  );
}
