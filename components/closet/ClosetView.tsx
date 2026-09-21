"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { RESORTE } from "@/lib/animaciones";
import { ClosetFilters } from "@/components/closet/ClosetFilters";
import { FiltrosPantalla } from "@/components/closet/FiltrosPantalla";
import { ItemCard } from "@/components/closet/ItemCard";
import { ItemRow } from "@/components/closet/ItemRow";
import { ItemDetailSheet } from "@/components/closet/ItemDetailSheet";
import { EmptyState } from "@/components/ui/EmptyState";
import { filterItems, useCloset } from "@/lib/store";
import {
  escribirBooleana,
  leerBooleana,
  subscribePreferencia,
  VISTA_ARMARIO,
} from "@/lib/preferencias";
import type { AvatarParams, Item, Tag } from "@/lib/types";

export function ClosetView({
  items,
  avatar,
  tags,
}: {
  items: Item[];
  avatar: AvatarParams;
  tags: Tag[];
}) {
  const filters = useCloset((s) => s.filters);
  const resetFilters = useCloset((s) => s.resetFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selected, setSelected] = useState<Item | null>(null);

  // La elección de vista se recuerda: es del dispositivo, no de la cuenta, y
  // se lee como store externo para no chocar con la hidratación.
  const enLista = useSyncExternalStore(
    subscribePreferencia,
    () => leerBooleana(VISTA_ARMARIO, false),
    () => false,
  );

  const visible = useMemo(() => filterItems(items, filters), [items, filters]);

  return (
    <>
      <ClosetFilters open={filtersOpen} onOpen={() => setFiltersOpen(true)} />

      <div className="flex-1 px-5 pb-28 pt-3">
        {items.length === 0 ? (
          <EmptyState
            icon="📸"
            title="Empieza tu escaparate"
            description="Fotografía tus prendas una a una. Recortamos el fondo por ti y las dejamos listas para combinar."
            action={{ label: "Añadir la primera", href: "/dashboard/closet/new" }}
          />
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line px-6 py-14 text-center">
            <span className="text-4xl" aria-hidden>
              🔍
            </span>
            <p className="text-sm text-ink-muted">Ninguna prenda coincide con estos filtros.</p>
            <button
              type="button"
              onClick={resetFilters}
              className="text-sm text-accent-ink underline underline-offset-4"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs text-ink-faint">
                {visible.length} {visible.length === 1 ? "prenda" : "prendas"}
              </p>
              <SelectorDeVista
                enLista={enLista}
                onChange={(valor) => escribirBooleana(VISTA_ARMARIO, valor)}
              />
            </div>

            {enLista ? (
              <ul className="flex flex-col gap-2.5">
                {visible.map((item, index) => (
                  <li key={item.id}>
                    <ItemRow item={item} index={index} onClick={() => setSelected(item)} />
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="grid grid-cols-3 gap-3">
                {visible.map((item, index) => (
                  <li key={item.id}>
                    <ItemCard item={item} index={index} onClick={() => setSelected(item)} />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      {/* Botón flotante: la acción principal del armario es añadir ropa. */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={RESORTE}
        className="pointer-events-none fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-lg justify-end px-5 pb-20"
      >
        <Link
          href="/dashboard/closet/new"
          aria-label="Añadir prenda"
          className="pointer-events-auto grid size-14 place-items-center rounded-full bg-accent text-2xl text-on-accent shadow-lg shadow-scrim"
        >
          +
        </Link>
      </motion.div>

      <FiltrosPantalla
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        items={items}
        tags={tags}
      />

      <ItemDetailSheet
        item={selected}
        avatar={avatar}
        tags={tags}
        onClose={() => setSelected(null)}
      />
    </>
  );
}

/**
 * Cuadrícula o lista.
 *
 * Dos iconos y no un texto: es un ajuste de cómo se mira, no una acción, y así
 * ocupa el ancho de un pulgar al lado del recuento. La elegida se queda en
 * ámbar, como el resto de lo que está puesto en la app.
 */
function SelectorDeVista({
  enLista,
  onChange,
}: {
  enLista: boolean;
  onChange: (enLista: boolean) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Cómo se ven las prendas"
      className="edge flex shrink-0 items-center gap-0.5 rounded-full bg-surface p-1"
    >
      <BotonDeVista label="Ver en cuadrícula" activo={!enLista} onClick={() => onChange(false)}>
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
          <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
          <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
          <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
        </svg>
      </BotonDeVista>

      <BotonDeVista label="Ver en lista" activo={enLista} onClick={() => onChange(true)}>
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="3.5" y="4.5" width="17" height="5.5" rx="2" />
          <rect x="3.5" y="14" width="17" height="5.5" rx="2" />
        </svg>
      </BotonDeVista>
    </div>
  );
}

function BotonDeVista({
  label,
  activo,
  onClick,
  children,
}: {
  label: string;
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={activo}
      className={[
        "grid size-8 place-items-center rounded-full transition-colors",
        activo ? "bg-accent text-on-accent" : "text-ink-faint",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
