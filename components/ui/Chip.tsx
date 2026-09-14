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
        "inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm transition-shadow",
        active
          ? "bg-accent text-on-accent font-medium shadow-[0_0_0_1px_var(--accent)]"
          : "edge bg-surface text-ink-muted hover:text-ink",
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
