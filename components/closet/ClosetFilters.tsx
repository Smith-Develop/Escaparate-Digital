"use client";

import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Field";
import { CATEGORIES } from "@/lib/taxonomy";
import { useCloset } from "@/lib/store";

/**
 * Barra de filtrado del escaparate.
 *
 * Solo lo que se usa a cada rato: las categorías, el buscador y el botón que
 * abre el resto. Las otras ocho propiedades viven en
 * [FiltrosPantalla](components/closet/FiltrosPantalla.tsx), que se abre a
 * pantalla completa; aquí no caben sin dejar el armario en una rendija.
 *
 * La pantalla de filtros se monta fuera de esta barra a propósito: la barra
 * lleva `backdrop-blur`, y un elemento con filtro de fondo pasa a ser el marco
 * de referencia de lo que cuelga de él con posición fija. Dentro de ella, la
 * pantalla «completa» solo ocuparía el alto de la barra.
 */
export function ClosetFilters({ open, onOpen }: { open: boolean; onOpen: () => void }) {
  const { filters, setFilter, activeFilterCount } = useCloset();
  const extraFilters = activeFilterCount() - (filters.category !== "todas" ? 1 : 0);

  return (
    <div className="sticky top-0 z-20 bg-canvas/95 pb-2 backdrop-blur">
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pb-1">
        <Chip active={filters.category === "todas"} onClick={() => setFilter("category", "todas")}>
          Todo
        </Chip>
        {CATEGORIES.map((category, i) => {
          const activa = filters.category === category.id;
          return (
            <Chip
              key={category.id}
              active={activa}
              onClick={() => {
                setFilter("category", category.id);
                // El tipo elegido es de la categoría anterior: dejarlo puesto
                // vaciaría la cuadrícula sin que se vea por qué.
                setFilter("subcategory", "todas");
              }}
            >
              {/* El icono va en su círculo teñido, con un pastel distinto por
                  categoría: se reconocen por color antes que por el texto. */}
              <span
                aria-hidden
                className={[
                  "grid size-6 place-items-center rounded-full text-[13px]",
                  activa ? "bg-on-accent/10" : PASTELES[i % PASTELES.length],
                ].join(" ")}
              >
                {category.icon}
              </span>
              {category.label}
            </Chip>
          );
        })}
      </div>

      <div className="flex items-center gap-2 px-5 pt-2">
        <Input
          value={filters.query}
          onChange={(e) => setFilter("query", e.target.value)}
          placeholder="Buscar en el armario…"
          className="!rounded-full !py-3 !text-sm"
          type="search"
        />
        <button
          type="button"
          onClick={onOpen}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label="Filtros"
          className={[
            // Pastilla oscura junto al buscador, como el botón de filtros del
            // diseño: es la única acción de esa fila y conviene que se vea.
            "relative flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm transition-colors",
            open || extraFilters > 0 ? "bg-accent text-on-accent" : "bg-ink text-canvas",
          ].join(" ")}
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 7h16M7 12h10M10 17h4" strokeLinecap="round" />
          </svg>
          Filtros
          {extraFilters > 0 && (
            <span className="grid size-5 place-items-center rounded-full bg-canvas text-[10px] font-bold text-ink">
              {extraFilters}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

/** Un pastel por categoría, en el orden en que salen. */
const PASTELES = [
  "bg-pastel-azul",
  "bg-pastel-ambar",
  "bg-pastel-menta",
  "bg-pastel-rosa",
  "bg-surface-2",
];
