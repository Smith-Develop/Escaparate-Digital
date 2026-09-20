"use client";

type ChipProps = {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  swatch?: string;
};

/** Píldora de filtro/etiqueta. Se usa en las barras horizontales del armario. */
export function Chip({ active, onClick, children, swatch }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm transition-colors",
        // Relleno ámbar con texto oscuro cuando está elegido; blanco flotando
        // sobre el fondo cuando no. Sin anillo: en este lenguaje lo que separa
        // es la sombra.
        active ? "bg-accent text-on-accent font-semibold" : "edge bg-surface text-ink-muted",
      ].join(" ")}
    >
      {swatch && (
        <span
          className="size-3 rounded-full border border-black/20"
          style={{ background: swatch }}
        />
      )}
      {children}
    </button>
  );
}
