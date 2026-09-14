"use client";

/**
 * Preferencias de uso que sobreviven a la recarga.
 *
 * Son decisiones deliberadas del usuario —apagar su foto en el probador, por
 * ejemplo—, así que volver a activarlas solas al recargar es desobedecerle.
 * Viven en el navegador y no en la base de datos porque son de este dispositivo:
 * lo que uno quiere ver en el móvil no tiene por qué valer en el portátil.
 */

const oyentes = new Set<() => void>();

function avisar() {
  oyentes.forEach((oyente) => oyente());
}

export function subscribePreferencia(onChange: () => void) {
  oyentes.add(onChange);
  // Otra pestaña de la app puede cambiar la misma preferencia.
  window.addEventListener("storage", onChange);
  return () => {
    oyentes.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function leerBooleana(clave: string, porDefecto: boolean) {
  try {
    const guardado = localStorage.getItem(clave);
    if (guardado === "1") return true;
    if (guardado === "0") return false;
  } catch {
    // Modo privado o almacenamiento bloqueado.
  }
  return porDefecto;
}

export function escribirBooleana(clave: string, valor: boolean) {
  try {
    localStorage.setItem(clave, valor ? "1" : "0");
  } catch {
    // Sin almacenamiento la elección solo dura esta sesión.
  }
  avisar();
}

export const MI_FOTO = "escaparate-mi-foto";
