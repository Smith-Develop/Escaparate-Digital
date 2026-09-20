"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Field";
import { PRICE_RANGES } from "@/lib/dinero";
import { CATEGORIES, colorsWith, occasionsWith, seasonsWith } from "@/lib/taxonomy";
import type { Item, Tag } from "@/lib/types";
import { añoDeCompra, useCloset } from "@/lib/store";

/**
 * Barra de filtrado del escaparate.
 *
 * Las pestañas de categoría están siempre a la vista y el resto de propiedades
 * vive en un panel desplegable, para no comerse media pantalla en el móvil.
 * Marca, talla y año no salen de ninguna lista fija: se sacan de las prendas
 * que hay en el armario, que es lo único que tiene sentido ofrecer.
 */
export function ClosetFilters({
  open,
  onToggle,
  items,
  tags,
}: {
  open: boolean;
  onToggle: () => void;
  items: Item[];
  tags: Tag[];
}) {
  const { filters, setFilter, resetFilters, activeFilterCount } = useCloset();
  const extraFilters = activeFilterCount() - (filters.category !== "todas" ? 1 : 0);
  const colores = colorsWith(tags);
  const temporadas = seasonsWith(tags);
  const ocasiones = occasionsWith(tags);

  // Los tipos se acotan a la categoría elegida: «Botas» no pinta nada mientras
  // se mira la parte superior.
  const deLaCategoria = useMemo(
    () =>
      filters.category === "todas"
        ? items
        : items.filter((i) => i.category === filters.category),
    [items, filters.category],
  );

  const tipos = useMemo(() => unicos(deLaCategoria.map((i) => i.subcategory)), [deLaCategoria]);
  const marcas = useMemo(() => unicos(items.map((i) => i.brand ?? "")), [items]);
  const tallas = useMemo(() => unicos(items.map((i) => i.size ?? "")), [items]);
  const años = useMemo(() => {
    const todos = unicos(items.map((i) => añoDeCompra(i)));
    // Los años, del más reciente al más antiguo, y «sin fecha» al final.
    return todos.filter((a) => a !== "sin").sort((a, b) => b.localeCompare(a))
      .concat(todos.includes("sin") ? ["sin"] : []);
  }, [items]);

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
          onClick={onToggle}
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

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {/* Nueve filas no caben en una pantalla de móvil: el panel se
                queda en poco más de media pantalla y se recorre por dentro,
                para que la cuadrícula de prendas no desaparezca del todo. */}
            <div className="no-scrollbar flex max-h-[55vh] flex-col gap-3 overflow-y-auto overscroll-contain px-5 pt-3">
              {tipos.length > 1 && (
                <FilterRow label="Tipo de prenda">
                  <Opcion campo="subcategory" valor="todas" etiqueta="Todos" />
                  {tipos.map((tipo) => (
                    <Opcion key={tipo} campo="subcategory" valor={tipo} etiqueta={tipo} />
                  ))}
                </FilterRow>
              )}

              <FilterRow label="Color">
                <Opcion campo="color" valor="todas" etiqueta="Todos" />
                {colores.map((color) => (
                  <Opcion
                    key={color.id}
                    campo="color"
                    valor={color.id}
                    etiqueta={color.label}
                    swatch={color.hex}
                  />
                ))}
              </FilterRow>

              <FilterRow label="Temporada">
                <Opcion campo="season" valor="todas" etiqueta="Todas" />
                {temporadas.map((season) => (
                  <Opcion key={season.id} campo="season" valor={season.id} etiqueta={season.label} />
                ))}
              </FilterRow>

              <FilterRow label="Ocasión">
                <Opcion campo="occasion" valor="todas" etiqueta="Todas" />
                {ocasiones.map((occasion) => (
                  <Opcion
                    key={occasion.id}
                    campo="occasion"
                    valor={occasion.id}
                    etiqueta={occasion.label}
                  />
                ))}
              </FilterRow>

              {marcas.length > 0 && (
                <FilterRow label="Marca">
                  <Opcion campo="brand" valor="todas" etiqueta="Todas" />
                  {marcas.map((marca) => (
                    <Opcion key={marca} campo="brand" valor={marca} etiqueta={marca} />
                  ))}
                </FilterRow>
              )}

              {tallas.length > 0 && (
                <FilterRow label="Talla">
                  <Opcion campo="size" valor="todas" etiqueta="Todas" />
                  {tallas.map((talla) => (
                    <Opcion key={talla} campo="size" valor={talla} etiqueta={talla} />
                  ))}
                </FilterRow>
              )}

              <FilterRow label="Precio">
                <Opcion campo="price" valor="todas" etiqueta="Cualquiera" />
                {PRICE_RANGES.map((rango) => (
                  <Opcion key={rango.id} campo="price" valor={rango.id} etiqueta={rango.label} />
                ))}
              </FilterRow>

              {años.length > 0 && (
                <FilterRow label="Año de compra">
                  <Opcion campo="year" valor="todas" etiqueta="Cualquiera" />
                  {años.map((año) => (
                    <Opcion
                      key={año}
                      campo="year"
                      valor={año}
                      etiqueta={año === "sin" ? "Sin fecha" : año}
                    />
                  ))}
                </FilterRow>
              )}

              <div className="flex items-center justify-between pb-2 pt-1">
                <Chip
                  active={filters.favorite}
                  onClick={() => setFilter("favorite", !filters.favorite)}
                >
                  <span aria-hidden>★</span> Solo favoritas
                </Chip>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-sm text-ink-muted underline underline-offset-4"
                >
                  Limpiar filtros
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Chip de un valor concreto de un filtro. */
function Opcion({
  campo,
  valor,
  etiqueta,
  swatch,
}: {
  campo: "subcategory" | "color" | "season" | "occasion" | "brand" | "size" | "price" | "year";
  valor: string;
  etiqueta: string;
  swatch?: string;
}) {
  const { filters, setFilter } = useCloset();
  return (
    <Chip
      swatch={swatch}
      active={filters[campo] === valor}
      onClick={() => setFilter(campo, valor)}
    >
      {etiqueta}
    </Chip>
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

/** Valores distintos, sin vacíos y en orden alfabético. */
function unicos(valores: string[]) {
  return [...new Set(valores.filter(Boolean))].sort((a, b) => a.localeCompare(b, "es"));
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[11px] uppercase tracking-[0.14em] text-ink-faint">{label}</p>
      <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">{children}</div>
    </div>
  );
}
