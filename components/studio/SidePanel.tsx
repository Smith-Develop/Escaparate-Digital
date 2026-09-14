"use client";

import { useState } from "react";
import { LookRail } from "@/components/studio/LookRail";
import { WornGrid } from "@/components/studio/WornGrid";
import type { Item, Look } from "@/lib/types";

type Props = {
  equipped: Item[];
  looks: Look[];
  selectedLookId: string | null;
  onCenterLook: (id: string) => void;
  /** Pestaña inicial: se abre en «Looks» si se llegó desde el lookbook. */
  defaultTab?: Pestana;
};

type Pestana = "puestas" | "looks";

/**
 * Columna estrecha a la derecha del avatar, con dos pestañas.
 *
 * «Puestas» es el inventario del conjunto y el control de capas; «Looks» es el
 * carrusel de conjuntos guardados. Las pestañas van dentro de la columna y no
 * sobre la fila, para que el avatar conserve exactamente el mismo tamaño.
 */
export function SidePanel({
  equipped,
  looks,
  selectedLookId,
  onCenterLook,
  defaultTab = "puestas",
}: Props) {
  const [pestana, setPestana] = useState<Pestana>(defaultTab);

  // En 76 px de ancho no caben dos etiquetas de texto: se truncaban a «Puest…»
  // y «Look…». Van como iconos, con el nombre completo debajo y en aria-label.
  const pestanas: { id: Pestana; label: string; icon: string; count: number }[] = [
    { id: "puestas", label: "Puestas", icon: "👕", count: equipped.length },
    { id: "looks", label: "Looks", icon: "✨", count: looks.length },
  ];
  const activa = pestanas.find((t) => t.id === pestana)!;

  return (
    <div className="flex min-h-0 w-[4.75rem] shrink-0 flex-col gap-1">
      <div role="tablist" aria-label="Panel lateral" className="edge grid grid-cols-2 rounded-full bg-surface p-0.5">
        {pestanas.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={pestana === t.id}
            aria-label={`${t.label} (${t.count})`}
            title={t.label}
            onClick={() => setPestana(t.id)}
            className={[
              "flex min-h-7 items-center justify-center gap-1 rounded-full text-[11px] transition-colors",
              pestana === t.id ? "bg-accent text-on-accent" : "text-ink-muted",
            ].join(" ")}
          >
            <span aria-hidden>{t.icon}</span>
            <span className="tabular text-[9px] opacity-80">{t.count}</span>
          </button>
        ))}
      </div>

      <p className="text-center text-[9px] uppercase tracking-[0.1em] text-ink-faint">
        {activa.label}
      </p>

      {/* Se monta solo el panel activo: un carrusel oculto mide cero de alto y
          el centrado inicial fallaría en silencio. */}
      {pestana === "puestas" ? (
        <WornGrid items={equipped} />
      ) : (
        <LookRail looks={looks} selectedId={selectedLookId} onCenter={onCenterLook} />
      )}
    </div>
  );
}
