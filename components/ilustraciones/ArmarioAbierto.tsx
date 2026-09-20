/**
 * El armario abierto: la ilustración que abre la app.
 *
 * Es un vector propio y no una imagen: pesa menos de 3 kB, se adapta a
 * cualquier pantalla sin pixelarse y —lo que importa aquí— toma sus colores del
 * tema, así que de noche no hay que servir otra versión.
 *
 * El trazo va en `currentColor` para que herede el color del texto, y los
 * rellenos usan las variables del sistema: el ámbar de la marca en la prenda
 * principal y el gris de superficie en la mancha del fondo.
 */
export function ArmarioAbierto({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 260 260"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="Un armario abierto con ropa colgada"
    >
      {/* Mancha orgánica del fondo, como la de la referencia: da peso a la
          composición sin competir con el dibujo. */}
      <path
        fill="var(--color-surface-2)"
        stroke="none"
        d="M44 96c6-34 34-58 72-62 40-4 74 10 90 38 15 27 10 60-6 86-17 27-46 44-82 44-34 0-62-14-74-38-12-23-6-46 0-68Z"
      />

      {/* Sombra en el suelo: sin ella el mueble flota. */}
      <ellipse cx="132" cy="232" rx="78" ry="7" fill="var(--color-surface-2)" stroke="none" />

      {/* Puerta abierta, en perspectiva hacia fuera. */}
      <path fill="var(--color-surface)" d="M62 54 32 68v130l30 14V54Z" />
      <path d="M45 128v14" />

      {/* Cuerpo del armario. */}
      <rect x="62" y="48" width="140" height="170" rx="10" fill="var(--color-surface)" />
      {/* Hoja derecha, cerrada. */}
      <path d="M134 48v170" />
      <path d="M126 126v14M142 126v14" />

      {/* Interior: fondo cálido y barra de colgar. */}
      <path fill="var(--color-accent-soft)" stroke="none" d="M68 54h62v158H68z" />
      <path d="M68 78h62" />

      {/* Sudadera, la prenda protagonista. */}
      <path d="M99 78v6" />
      <path
        fill="var(--color-accent)"
        d="M99 84c-9 3-15 8-15 14v30c0 3 2 5 5 5h20c3 0 5-2 5-5v-30c0-6-6-11-15-14Z"
      />
      <path d="M92 86c0 4 3 7 7 7s7-3 7-7" />

      {/* Pantalón colgado al lado. */}
      <path d="M118 78v6" />
      <path
        fill="var(--color-ink)"
        stroke="none"
        d="M110 86h16v46h-6l-2-28-2 28h-6V86Z"
        opacity="0.85"
      />
      <path d="M110 86h16v46h-6l-2-28-2 28h-6V86Z" />

      {/* Cajón de abajo, con su tirador. */}
      <path d="M68 176h62" />
      <path d="M92 194h14" />

      {/* Patas. */}
      <path d="M78 218v12M186 218v12" />

      {/* Percha suelta apoyada fuera, y un par de destellos. */}
      <path d="M214 176a7 7 0 1 1 7-7" />
      <path d="M214 176v5l-16 12h32l-16-12" />
      <circle cx="222" cy="86" r="6" fill="var(--color-accent)" stroke="none" />
      <path d="M44 62h8M48 58v8" strokeWidth="2.5" />
      <path d="M40 200h8M44 196v8" strokeWidth="2.5" />
    </svg>
  );
}
