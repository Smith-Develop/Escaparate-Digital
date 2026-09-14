"use client";

import { useSyncExternalStore } from "react";

/**
 * ¿Hay conexión?
 *
 * `navigator.onLine` miente con frecuencia —dice que sí en cuanto hay wifi,
 * aunque el portal cautivo del hotel no deje pasar nada—, pero como señal
 * negativa es de fiar: si dice que no, no la hay. Se usa así, y lo que de
 * verdad decide es si la sincronización funciona.
 */

const oyentes = new Set<() => void>();

function suscribir(avisar: () => void) {
  oyentes.add(avisar);
  const manejar = () => oyentes.forEach((o) => o());
  window.addEventListener("online", manejar);
  window.addEventListener("offline", manejar);
  return () => {
    oyentes.delete(avisar);
    window.removeEventListener("online", manejar);
    window.removeEventListener("offline", manejar);
  };
}

export const useConexion = () =>
  useSyncExternalStore(
    suscribir,
    () => navigator.onLine,
    // En el servidor se asume que sí: pintar «sin conexión» al hidratar sería
    // mentir más veces de las que se acierta.
    () => true,
  );
