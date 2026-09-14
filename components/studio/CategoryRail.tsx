"use client";

import Image from "next/image";
import { CATEGORIES } from "@/lib/taxonomy";
import { useCarrusel } from "@/components/studio/useCarrusel";
import type { Item } from "@/lib/types";

/** Identificador de la casilla «sin prenda», la única forma de dejar la capa libre. */
export const NINGUNA = "__ninguna";

type Props = {
  active: string;
  onCategoryChange: (category: string) => void;
  /** Prendas de la categoría activa. */
  items: Item[];
  /** Prendas puestas de esa categoría. Solo los accesorios pueden ser varias. */
  equippedIds: string[];
  /** Se llama con el id que queda centrado, o con NINGUNA. */
  onCenter: (id: string) => void;
  /** Pone o quita una prenda, para las categorías que admiten varias. */
  onToggle: (id: string) => void;
  onShuffle: () => void;
  counts: Record<string, number>;
};

/**
 * Raíl inferior: categorías con iconos grandes y un carrusel de prendas.
 *
 * El carrusel funciona como el de una consola: se desliza y **la prenda que
 * queda en el centro es la que se pone**, sin tener que apuntar y tocar. Así se
 * van pasando prendas hasta dar con la que convence, viendo el resultado en el
 * avatar a cada paso.
 *
 * Se apoya en el ajuste de desplazamiento del navegador (`scroll-snap`) en
 * lugar de recolocar a mano en cada fotograma: el deslizamiento conserva su
 * inercia natural y no hay que animar nada por JavaScript.
 */
export function CategoryRail({
  active,
  onCategoryChange,
  items,
  equippedIds,
  onCenter,
  onToggle,
  onShuffle,
  counts,
}: Props) {
  const activeInfo = CATEGORIES.find((c) => c.id === active);
  // Los accesorios se acumulan —pulsera, cadena, gafas—, así que centrar no
  // sirve: deslizando se irían poniendo todos. Ahí se elige tocando.
  const varios = active === "accesorio";
  const puestas = new Set(equippedIds);
  const selected = varios ? NINGUNA : equippedIds[0] ?? NINGUNA;

  const { scroller, alDesplazar, elegir } = useCarrusel<HTMLDivElement>({
    eje: "horizontal",
    seleccionado: selected,
    onCentrar: onCenter,
    clave: active,
  });

  return (
    <div className="flex flex-col gap-2 bg-display pt-2">
      <div role="tablist" aria-label="Categorías" className="no-scrollbar flex gap-2 overflow-x-auto px-4">
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
              onClick={() => onCategoryChange(category.id)}
              className={[
                "flex min-h-14 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl px-3 transition-shadow",
                activa ? "bg-accent text-on-accent" : "edge bg-surface text-ink-muted",
              ].join(" ")}
            >
              <span className="text-xl leading-none" aria-hidden>
                {category.icon}
              </span>
              <span className="text-[10px] leading-tight">
                {category.short}
                <span className="tabular ml-1 opacity-60">{count}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="relative flex items-center gap-2 px-4 pb-1">
        <div className="relative min-w-0 flex-1">
          {!varios && (
            /* Marca del centro: indica cuál es la posición que viste al avatar. */
            <span
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 z-10 size-[4.5rem] -translate-x-1/2 -translate-y-1/2 rounded-2xl shadow-[0_0_0_2px_var(--accent)]"
            />
          )}
          <div
            ref={scroller}
            onScroll={varios ? undefined : alDesplazar}
            // `relative` hace del propio scroller el origen de los `offset*`:
            // sin él se miden desde un ancestro posicionado y el centrado sale
            // desplazado en cuanto cambia la maquetación de alrededor.
            className={[
              "no-scrollbar relative flex gap-3 overflow-x-auto overscroll-x-contain py-1",
              varios ? "" : "snap-x snap-mandatory",
            ].join(" ")}
            style={
              varios
                ? undefined
                : { scrollPaddingInline: "50%", paddingInline: "calc(50% - 2rem)" }
            }
          >
            {varios ? (
              <>
                {items.map((item) => (
                  <Casilla
                    key={item.id}
                    id={item.id}
                    selected={puestas.has(item.id)}
                    onClick={() => onToggle(item.id)}
                    label={item.name}
                  >
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      width={64}
                      height={64}
                      className="size-full object-contain"
                    />
                  </Casilla>
                ))}
                {puestas.size > 0 && (
                  <Casilla
                    id={NINGUNA}
                    selected={false}
                    onClick={() => onCenter(NINGUNA)}
                    label="Quitar los accesorios"
                  >
                    <span className="grid size-full place-items-center text-[10px] leading-tight text-ink-faint">
                      Quitar
                      <br />
                      todos
                    </span>
                  </Casilla>
                )}
              </>
            ) : (
              <>
                <Casilla
                  id={NINGUNA}
                  selected={selected === NINGUNA}
                  onClick={() => elegir(NINGUNA)}
                  label="Sin prenda"
                >
                  <span className="grid size-full place-items-center text-[10px] leading-tight text-ink-faint">
                    Sin
                    <br />
                    prenda
                  </span>
                </Casilla>

                {items.map((item) => (
                  <Casilla
                    key={item.id}
                    id={item.id}
                    selected={selected === item.id}
                    onClick={() => elegir(item.id)}
                    label={item.name}
                  >
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      width={64}
                      height={64}
                      className="size-full object-contain"
                    />
                  </Casilla>
                ))}
              </>
            )}
          </div>
        </div>

        {items.length > 1 && (
          <button
            type="button"
            onClick={onShuffle}
            aria-label={`Probar otra prenda de ${activeInfo?.label ?? active}`}
            className="edge grid size-10 shrink-0 place-items-center rounded-xl bg-surface text-ink-muted transition-colors hover:text-ink"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M3 12a9 9 0 0 1 15.3-6.4M21 12a9 9 0 0 1-15.3 6.4" strokeLinecap="round" />
              <path d="M18 3.5V7h-3.5M6 20.5V17h3.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

function Casilla({
  id,
  selected,
  onClick,
  label,
  children,
}: {
  id: string;
  selected: boolean;
  onClick: () => void;
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      data-id={id}
      onClick={onClick}
      aria-current={selected}
      aria-label={label ?? "Sin prenda"}
      className={[
        "size-16 shrink-0 snap-center overflow-hidden rounded-2xl bg-display p-1 transition-opacity",
        selected ? "" : "edge opacity-55",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
