/**
 * El vocabulario de animación de la app.
 *
 * Nació en el armario —las prendas entran subiendo un poco, escalonadas— y
 * desde aquí lo usan todas las pantallas, para que moverse por la app se sienta
 * igual en cualquier sitio. Tenerlo en un único fichero evita lo de antes: cada
 * pantalla inventando su duración y su retardo, con el resultado de que dos
 * listas parecidas entraban a ritmos distintos.
 *
 * Son objetos sueltos y no un componente porque los usan cosas muy distintas
 * —botones, artículos, secciones—, y cada una necesita su propia etiqueta.
 */

/** Entrada estándar: aparece subiendo ocho píxeles. */
export const APARECE = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
} as const;

/**
 * Retardo por posición en la lista.
 *
 * Corto y con tope: escalonar da sensación de fluidez, pero pasado el octavo
 * elemento el retardo solo sería espera, y en una cuadrícula larga los últimos
 * llegarían tarde a una pantalla que el usuario ya está leyendo.
 */
export const escalonado = (index = 0, paso = 0.03, tope = 8) => ({
  delay: Math.min(index, tope) * paso,
});

/** Lo que se pulsa se hunde un poco: es el acuse de recibo del dedo. */
export const AL_PULSAR = { scale: 0.96 } as const;

/** Aparición de algo que flota —botones sobre el telón, avisos—. */
export const BROTA = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
} as const;

/** Resorte de los elementos que entran de golpe, como el botón de añadir. */
export const RESORTE = { type: "spring", stiffness: 400, damping: 24 } as const;
