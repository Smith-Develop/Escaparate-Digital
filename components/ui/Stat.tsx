import Link from "next/link";

/**
 * Dato suelto en una tarjeta: prendas, looks, lo invertido.
 *
 * Con `href` es un enlace, y así el mismo bloque sirve de cifra y de acceso a
 * la pantalla que la desarrolla.
 */
export function Stat({
  value,
  label,
  href,
}: {
  value: number | string;
  label: string;
  href?: string;
}) {
  const clase = "edge block rounded-2xl bg-surface px-3 py-4 text-center";
  const contenido = (
    <>
      {/* El total invertido puede tener cuatro o cinco cifras: que encoja antes
          de desbordar la tarjeta. */}
      <p className="tabular font-display leading-none [font-size:clamp(1.25rem,7vw,1.875rem)]">
        {value}
      </p>
      <p className="mt-1.5 text-[11px] uppercase tracking-wider text-ink-faint">{label}</p>
    </>
  );

  return href ? (
    <Link href={href} className={clase}>
      {contenido}
    </Link>
  ) : (
    <div className={clase}>{contenido}</div>
  );
}
