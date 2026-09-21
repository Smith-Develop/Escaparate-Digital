"use client";

/**
 * Qué cierra el botón «atrás» de Android.
 *
 * En el móvil, «atrás» tiene que cerrar lo último que se abrió: si hay una hoja
 * encima, se cierra la hoja; si no, se retrocede de pantalla; y solo desde la
 * primera pantalla se sale de la app. Sin esto, un toque en atrás con una hoja
 * abierta cierra la aplicación entera, que es de las cosas que más molestan de
 * una app web metida en un móvil.
 *
 * Es una pila y no un único manejador porque se pueden encadenar: una hoja que
 * abre otra hoja. Cierra siempre la de más arriba.
 */

const pila: (() => void)[] = [];

/** Lo llaman las hojas mientras están abiertas. Devuelve cómo darse de baja. */
export function registrarCierre(cerrar: () => void) {
  pila.push(cerrar);
  return () => {
    const donde = pila.lastIndexOf(cerrar);
    if (donde >= 0) pila.splice(donde, 1);
  };
}

/** Cierra lo último que se abrió. Devuelve si había algo que cerrar. */
export function cerrarUltimo() {
  const cerrar = pila.pop();
  if (!cerrar) return false;
  cerrar();
  return true;
}
