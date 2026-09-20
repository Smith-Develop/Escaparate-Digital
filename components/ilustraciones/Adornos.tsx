/**
 * Los arcos de las esquinas de las pantallas de bienvenida.
 *
 * Son círculos que asoman por el borde, no imágenes: cuestan nada, encuadran la
 * ilustración y dan profundidad sin robarle atención. `aria-hidden` porque no
 * dicen nada que no diga ya el texto.
 */
export function Adornos() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <span className="absolute -right-20 -top-24 size-56 rounded-full bg-surface-2" />
      <span className="absolute right-8 top-10 size-5 rounded-full bg-accent" />
      <span className="absolute -bottom-32 -left-24 size-72 rounded-full bg-accent/25" />
      <span className="absolute -bottom-16 -left-10 size-40 rounded-full bg-surface-2" />
    </div>
  );
}
