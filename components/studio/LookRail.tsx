"use client";

import { OutfitCanvas } from "@/components/studio/OutfitCanvas";
import { useCarrusel } from "@/components/studio/useCarrusel";
import type { Look } from "@/lib/types";

/** Casilla que deja el avatar desvestido, equivalente a «Sin prenda». */
export const NINGUNO = "__ninguno";

type Props = {
  looks: Look[];
  /** Look puesto, o null si el conjunto no viene de ninguno. */
  selectedId: string | null;
  /** Se llama con el id que queda centrado, o con NINGUNO. */
  onCenter: (id: string) => void;
};

/**
 * Carrusel vertical de conjuntos guardados, junto al avatar.
 *
 * Funciona como el raíl de prendas puesto de canto: se desliza y **el look que
 * queda centrado se pone**. Así se pasan los conjuntos guardados viendo cada uno
 * puesto, sin salir del probador ni tener que acordarse de cómo era cada uno.
 */
export function LookRail({ looks, selectedId, onCenter }: Props) {
  const seleccionado = looks.some((l) => l.id === selectedId) ? selectedId! : NINGUNO;
  const { scroller, alDesplazar, elegir } = useCarrusel<HTMLDivElement>({
    eje: "vertical",
    seleccionado,
    onCentrar: onCenter,
  });

  const centrado = looks.find((l) => l.id === seleccionado) ?? null;

  if (looks.length === 0) {
    return (
      <p className="edge rounded-xl px-2 py-6 text-center text-[11px] leading-tight text-ink-faint">
        Guarda un conjunto y aparecerá aquí
      </p>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1">
      {/* Contenedor de medida: el relleno que permite centrar la primera y la
          última casilla se expresa en `cqh`. Un porcentaje no valdría, porque
          `padding-block` resuelve los porcentajes contra el ancho. */}
      <div className="relative min-h-0 flex-1" style={{ containerType: "size" }}>
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-24 w-16 -translate-x-1/2 -translate-y-1/2 rounded-xl shadow-[0_0_0_2px_var(--accent)]"
        />

        <div
          ref={scroller}
          onScroll={alDesplazar}
          className="no-scrollbar relative flex size-full snap-y snap-mandatory flex-col items-center gap-2 overflow-y-auto overscroll-contain"
          style={{
            scrollPaddingBlock: "50%",
            paddingBlock: "max(0px, calc(50cqh - 3rem))",
          }}
        >
          <Casilla id={NINGUNO} label="Sin look" selected={seleccionado === NINGUNO} onClick={elegir}>
            <span className="grid size-full place-items-center text-[10px] leading-tight text-ink-faint">
              Sin
              <br />
              look
            </span>
          </Casilla>

          {looks.map((look) => (
            <Casilla
              key={look.id}
              id={look.id}
              label={look.name}
              selected={seleccionado === look.id}
              onClick={elegir}
            >
              {/* La miniatura es el propio conjunto compuesto, así que enseña
                  de verdad cómo se va a ver en vez de un montón de recortes. */}
              <OutfitCanvas items={look.items} miniatura />
            </Casilla>
          ))}
        </div>
      </div>

      <p
        aria-live="polite"
        className="line-clamp-2 text-center text-[9px] leading-tight text-ink-faint"
      >
        {centrado?.name ?? "Sin look"}
      </p>
    </div>
  );
}

function Casilla({
  id,
  label,
  selected,
  onClick,
  children,
}: {
  id: string;
  label: string;
  selected: boolean;
  onClick: (id: string) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      data-id={id}
      onClick={() => onClick(id)}
      aria-current={selected}
      aria-label={label}
      title={label}
      className={[
        "h-24 w-16 shrink-0 snap-center overflow-hidden rounded-xl bg-display p-1 transition-opacity",
        selected ? "" : "edge opacity-55",
      ].join(" ")}
      // Los conjuntos que quedan fuera de la vista no se pintan hasta que hagan falta.
      style={{ contentVisibility: "auto", containIntrinsicSize: "96px 64px" }}
    >
      {children}
    </button>
  );
}
