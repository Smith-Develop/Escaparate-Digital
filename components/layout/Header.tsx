import Link from "next/link";

type Props = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  back?: string;
};

/**
 * Cabecera de pantalla, en los dos formatos del diseño.
 *
 * Cuando hay a dónde volver se comporta como una pantalla de detalle: botón
 * redondo a la izquierda, título centrado y, si hace falta, otro botón redondo
 * a la derecha. Es la disposición que la gente espera en el móvil, y deja el
 * gesto de volver siempre en el mismo sitio.
 *
 * Cuando no lo hay —las cinco pantallas de la barra inferior— el título manda:
 * grande, alineado a la izquierda, con su frase debajo y la acción suelta a la
 * derecha.
 */
export function Header({ title, subtitle, action, back }: Props) {
  if (back) {
    return (
      <header className="flex items-center gap-3 px-5 pb-3 pt-safe">
        <Link
          href={back}
          aria-label="Volver"
          className="edge grid size-10 shrink-0 place-items-center rounded-full bg-surface text-ink"
        >
          <svg
            viewBox="0 0 24 24"
            className="size-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </Link>

        <div className="min-w-0 flex-1 text-center">
          <h1 className="truncate text-base font-semibold">{title}</h1>
          {subtitle && <p className="truncate text-xs text-ink-muted">{subtitle}</p>}
        </div>

        {/* El hueco de la derecha se reserva aunque no haya acción: sin él, el
            título centrado se desplaza y baila de una pantalla a otra. */}
        <div className="grid size-10 shrink-0 place-items-center">{action}</div>
      </header>
    );
  }

  return (
    <header className="flex items-start justify-between gap-4 px-5 pb-4 pt-safe">
      <div className="min-w-0">
        <h1 className="truncate font-display text-[2rem] leading-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

/**
 * Botón redondo de cabecera.
 *
 * Se exporta desde aquí porque su forma —círculo blanco flotando— es parte de
 * la cabecera, y así todas las pantallas lo hacen igual en vez de repetir las
 * mismas clases con pequeñas diferencias.
 */
export function BotonCabecera({
  onClick,
  href,
  label,
  badge,
  children,
}: {
  onClick?: () => void;
  href?: string;
  label: string;
  /** Número que se pinta en la esquina, como el contador del carrito. */
  badge?: number;
  children: React.ReactNode;
}) {
  const clase =
    "edge relative grid size-10 shrink-0 place-items-center rounded-full bg-surface text-ink";
  const contenido = (
    <>
      {children}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-ink text-[10px] font-semibold text-canvas">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </>
  );

  return href ? (
    <Link href={href} aria-label={label} className={clase}>
      {contenido}
    </Link>
  ) : (
    <button type="button" onClick={onClick} aria-label={label} className={clase}>
      {contenido}
    </button>
  );
}
