"use client";

import { CATEGORIES } from "@/lib/taxonomy";

/**
 * Las categorías, en columna a la izquierda del maniquí.
 *
 * Estaban en una fila bajo el probador, compitiendo por el alto con el
 * carrusel de prendas. En vertical ocupan un canal estrecho que no le quita
 * nada a la figura, y cada una enseña cuántas prendas tiene.
 */
export function CategoriasVertical({
  active,
  onChange,
  counts,
}: {
  active: string;
  onChange: (category: string) => void;
  counts: Record<string, number>;
}) {
  return (
    <div
      role="tablist"
      aria-label="Categorías"
      className="no-scrollbar flex w-14 shrink-0 flex-col gap-2 overflow-y-auto"
    >
      {CATEGORIES.map((category) => {
        const activa = category.id === active;
        const count = counts[category.id] ?? 0;
        return (
          <button
            key={category.id}
            type="button"
            role="tab"
            aria-selected={activa}
            aria-label={`${category.label} (${count})`}
            onClick={() => onChange(category.id)}
            className={[
              "relative grid aspect-square w-full shrink-0 place-items-center rounded-[1.1rem] text-xl transition-colors",
              activa ? "bg-accent text-on-accent" : "edge bg-surface text-ink-muted",
            ].join(" ")}
          >
            <span aria-hidden>{category.icon}</span>
            {count > 0 && (
              <span
                aria-hidden
                className={[
                  "tabular absolute bottom-0.5 right-1 text-[9px]",
                  activa ? "text-on-accent/70" : "text-ink-faint",
                ].join(" ")}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
