"use client";

import { useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Chip } from "@/components/ui/Chip";
import { APARECE, escalonado } from "@/lib/animaciones";
import { PRICE_RANGES } from "@/lib/dinero";
import { colorsWith, occasionsWith, seasonsWith } from "@/lib/taxonomy";
import { añoDeCompra, filterItems, useCloset } from "@/lib/store";
import type { Item, Tag } from "@/lib/types";

/**
 * Los filtros, a pantalla completa.
 *
 * Antes eran un desplegable que se comía media pantalla y dejaba las nueve
 * filas dentro de un cajón de 55vh que había que recorrer por dentro, con la
 * cuadrícula asomando debajo y las opciones en raíles horizontales donde la
 * mitad quedaba fuera de vista. A pantalla completa caben todas de un vistazo y
 * las opciones se reparten en varias líneas en vez de esconderse a la derecha.
 *
 * Entra deslizándose desde abajo, que es de donde viene el botón que la abre, y
 * sale por el mismo sitio: el recorrido cuenta de dónde ha salido la pantalla y
 * a dónde vuelve al cerrarla.
 */
export function FiltrosPantalla({
  open,
  onClose,
  items,
  tags,
}: {
  open: boolean;
  onClose: () => void;
  items: Item[];
  tags: Tag[];
}) {
  const { filters, setFilter, resetFilters, activeFilterCount } = useCloset();
  const colores = colorsWith(tags);
  const temporadas = seasonsWith(tags);
  const ocasiones = occasionsWith(tags);

  // Los tipos se acotan a la categoría elegida: «Botas» no pinta nada mientras
  // se mira la parte superior.
  const deLaCategoria = useMemo(
    () =>
      filters.category === "todas" ? items : items.filter((i) => i.category === filters.category),
    [items, filters.category],
  );

  const tipos = useMemo(() => unicos(deLaCategoria.map((i) => i.subcategory)), [deLaCategoria]);
  const marcas = useMemo(() => unicos(items.map((i) => i.brand ?? "")), [items]);
  const tallas = useMemo(() => unicos(items.map((i) => i.size ?? "")), [items]);
  const años = useMemo(() => {
    const todos = unicos(items.map((i) => añoDeCompra(i)));
    // Los años, del más reciente al más antiguo, y «sin fecha» al final.
    return todos
      .filter((a) => a !== "sin")
      .sort((a, b) => b.localeCompare(a))
      .concat(todos.includes("sin") ? ["sin"] : []);
  }, [items]);

  // Cuántas prendas quedarían con lo elegido: el botón de cerrar lo dice, así
  // que se puede ir afinando sin salir a mirar la cuadrícula.
  const cuantas = useMemo(() => filterItems(items, filters).length, [items, filters]);
  const puestos = activeFilterCount();

  useEffect(() => {
    if (!open) return;
    const alPulsar = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", alPulsar);
    return () => document.removeEventListener("keydown", alPulsar);
  }, [open, onClose]);

  // Las filas se numeran para que entren escalonadas, como las prendas del
  // armario: se cuentan aquí porque cuáles aparecen depende del armario.
  let fila = 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Filtros"
          className="fixed inset-0 z-50 flex flex-col bg-canvas"
          initial={{ opacity: 0, y: "6%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "6%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
        >
          <div className="mx-auto flex h-full w-full max-w-lg flex-col">
            <header className="flex items-center gap-3 px-5 pb-3 pt-safe">
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar los filtros"
                className="edge grid size-10 shrink-0 place-items-center rounded-full bg-surface text-ink"
              >
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                  <path d="m6 6 12 12M18 6 6 18" />
                </svg>
              </button>

              <div className="min-w-0 flex-1 text-center">
                <h2 className="truncate text-base font-semibold">Filtros</h2>
                <p className="truncate text-xs text-ink-muted">
                  {puestos === 0
                    ? "Sin filtros puestos"
                    : `${puestos} ${puestos === 1 ? "filtro puesto" : "filtros puestos"}`}
                </p>
              </div>

              {/* El hueco se reserva aunque no haya nada que limpiar, para que
                  el título no baile al poner el primer filtro. */}
              <div className="flex w-16 shrink-0 justify-end">
                {puestos > 0 && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="text-sm text-accent-ink underline underline-offset-4"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </header>

            <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-4">
              <div className="flex flex-col gap-5">
                {tipos.length > 1 && (
                  <Fila label="Tipo de prenda" index={fila++}>
                    <Opcion campo="subcategory" valor="todas" etiqueta="Todos" />
                    {tipos.map((tipo) => (
                      <Opcion key={tipo} campo="subcategory" valor={tipo} etiqueta={tipo} />
                    ))}
                  </Fila>
                )}

                <Fila label="Color" index={fila++}>
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
                </Fila>

                <Fila label="Temporada" index={fila++}>
                  <Opcion campo="season" valor="todas" etiqueta="Todas" />
                  {temporadas.map((season) => (
                    <Opcion key={season.id} campo="season" valor={season.id} etiqueta={season.label} />
                  ))}
                </Fila>

                <Fila label="Ocasión" index={fila++}>
                  <Opcion campo="occasion" valor="todas" etiqueta="Todas" />
                  {ocasiones.map((occasion) => (
                    <Opcion
                      key={occasion.id}
                      campo="occasion"
                      valor={occasion.id}
                      etiqueta={occasion.label}
                    />
                  ))}
                </Fila>

                {marcas.length > 0 && (
                  <Fila label="Marca" index={fila++}>
                    <Opcion campo="brand" valor="todas" etiqueta="Todas" />
                    {marcas.map((marca) => (
                      <Opcion key={marca} campo="brand" valor={marca} etiqueta={marca} />
                    ))}
                  </Fila>
                )}

                {tallas.length > 0 && (
                  <Fila label="Talla" index={fila++}>
                    <Opcion campo="size" valor="todas" etiqueta="Todas" />
                    {tallas.map((talla) => (
                      <Opcion key={talla} campo="size" valor={talla} etiqueta={talla} />
                    ))}
                  </Fila>
                )}

                <Fila label="Precio" index={fila++}>
                  <Opcion campo="price" valor="todas" etiqueta="Cualquiera" />
                  {PRICE_RANGES.map((rango) => (
                    <Opcion key={rango.id} campo="price" valor={rango.id} etiqueta={rango.label} />
                  ))}
                </Fila>

                {años.length > 0 && (
                  <Fila label="Año de compra" index={fila++}>
                    <Opcion campo="year" valor="todas" etiqueta="Cualquiera" />
                    {años.map((año) => (
                      <Opcion
                        key={año}
                        campo="year"
                        valor={año}
                        etiqueta={año === "sin" ? "Sin fecha" : año}
                      />
                    ))}
                  </Fila>
                )}

                <Fila label="Favoritas" index={fila++}>
                  <Chip
                    active={filters.favorite}
                    onClick={() => setFilter("favorite", !filters.favorite)}
                  >
                    <span aria-hidden>★</span> Solo favoritas
                  </Chip>
                </Fila>
              </div>
            </div>

            {/* Anclado abajo, que es donde llega el pulgar, y diciendo lo que va
                a pasar al pulsarlo en vez de un «Hecho» que no cuenta nada. */}
            <div className="border-t border-line px-5 pb-safe pt-3">
              <button
                type="button"
                onClick={onClose}
                className="min-h-13 w-full rounded-full bg-accent text-sm font-semibold text-on-accent"
              >
                {cuantas === 0
                  ? "Ninguna prenda coincide"
                  : `Ver ${cuantas} ${cuantas === 1 ? "prenda" : "prendas"}`}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
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
    <Chip swatch={swatch} active={filters[campo] === valor} onClick={() => setFilter(campo, valor)}>
      {etiqueta}
    </Chip>
  );
}

/**
 * Una propiedad con todas sus opciones.
 *
 * A pantalla completa las opciones se reparten en varias líneas en lugar de
 * irse a la derecha en un raíl: aquí hay sitio, y lo que no se ve no se filtra.
 */
function Fila({
  label,
  index,
  children,
}: {
  label: string;
  index: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div {...APARECE} transition={escalonado(index)}>
      <p className="mb-2 text-[11px] uppercase tracking-[0.14em] text-ink-faint">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </motion.div>
  );
}

/** Valores distintos, sin vacíos y en orden alfabético. */
function unicos(valores: string[]) {
  return [...new Set(valores.filter(Boolean))].sort((a, b) => a.localeCompare(b, "es"));
}
