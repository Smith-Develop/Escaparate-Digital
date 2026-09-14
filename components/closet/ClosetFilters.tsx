"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Field";
import { CATEGORIES, SEASONS, colorsWith, occasionsWith } from "@/lib/taxonomy";
import type { Tag } from "@/lib/types";
import { useCloset } from "@/lib/store";

/** Barra de filtrado del escaparate: pestañas de categoría siempre visibles y
 *  un panel desplegable con color, temporada y ocasión. */
export function ClosetFilters({
  open,
  onToggle,
  tags,
}: {
  open: boolean;
  onToggle: () => void;
  tags: Tag[];
}) {
  const { filters, setFilter, resetFilters, activeFilterCount } = useCloset();
  const extraFilters = activeFilterCount() - (filters.category !== "todas" ? 1 : 0);
  const colores = colorsWith(tags);
  const ocasiones = occasionsWith(tags);

  return (
    <div className="sticky top-0 z-20 bg-canvas/95 pb-2 backdrop-blur">
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pb-1">
        <Chip active={filters.category === "todas"} onClick={() => setFilter("category", "todas")}>
          Todo
        </Chip>
        {CATEGORIES.map((category) => (
          <Chip
            key={category.id}
            active={filters.category === category.id}
            onClick={() => setFilter("category", category.id)}
          >
            <span aria-hidden>{category.icon}</span>
            {category.label}
          </Chip>
        ))}
      </div>

      <div className="flex items-center gap-2 px-5 pt-2">
        <Input
          value={filters.query}
          onChange={(e) => setFilter("query", e.target.value)}
          placeholder="Buscar en el armario…"
          className="!py-2.5 !text-sm"
          type="search"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className={[
            "relative grid size-11 shrink-0 place-items-center rounded-xl border transition-colors",
            open || extraFilters > 0 ? "border-accent text-accent" : "border-line text-ink-muted",
          ].join(" ")}
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M4 7h16M7 12h10M10 17h4" strokeLinecap="round" />
          </svg>
          {extraFilters > 0 && (
            <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-accent text-[10px] font-bold text-on-accent">
              {extraFilters}
            </span>
          )}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3 px-5 pt-3">
              <FilterRow label="Color">
                <Chip active={filters.color === "todas"} onClick={() => setFilter("color", "todas")}>
                  Todos
                </Chip>
                {colores.map((color) => (
                  <Chip
                    key={color.id}
                    swatch={color.hex}
                    active={filters.color === color.id}
                    onClick={() => setFilter("color", color.id)}
                  >
                    {color.label}
                  </Chip>
                ))}
              </FilterRow>

              <FilterRow label="Temporada">
                <Chip active={filters.season === "todas"} onClick={() => setFilter("season", "todas")}>
                  Todas
                </Chip>
                {SEASONS.map((season) => (
                  <Chip
                    key={season.id}
                    active={filters.season === season.id}
                    onClick={() => setFilter("season", season.id)}
                  >
                    {season.label}
                  </Chip>
                ))}
              </FilterRow>

              <FilterRow label="Ocasión">
                <Chip
                  active={filters.occasion === "todas"}
                  onClick={() => setFilter("occasion", "todas")}
                >
                  Todas
                </Chip>
                {ocasiones.map((occasion) => (
                  <Chip
                    key={occasion.id}
                    active={filters.occasion === occasion.id}
                    onClick={() => setFilter("occasion", occasion.id)}
                  >
                    {occasion.label}
                  </Chip>
                ))}
              </FilterRow>

              <button
                type="button"
                onClick={resetFilters}
                className="self-start pb-2 text-sm text-ink-muted underline underline-offset-4"
              >
                Limpiar filtros
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[11px] uppercase tracking-[0.14em] text-ink-faint">{label}</p>
      <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">{children}</div>
    </div>
  );
}
