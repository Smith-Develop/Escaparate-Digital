"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ClosetFilters } from "@/components/closet/ClosetFilters";
import { ItemCard } from "@/components/closet/ItemCard";
import { ItemDetailSheet } from "@/components/closet/ItemDetailSheet";
import { EmptyState } from "@/components/ui/EmptyState";
import { filterItems, useCloset } from "@/lib/store";
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

  const visible = useMemo(() => filterItems(items, filters), [items, filters]);

  return (
    <>
      <ClosetFilters
        open={filtersOpen}
        onToggle={() => setFiltersOpen((v) => !v)}
        items={items}
        tags={tags}
      />

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
              className="text-sm text-accent underline underline-offset-4"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <>
            <p className="mb-3 text-xs text-ink-faint">
              {visible.length} {visible.length === 1 ? "prenda" : "prendas"}
            </p>
            <ul className="grid grid-cols-3 gap-3">
              {visible.map((item, index) => (
                <li key={item.id}>
                  <ItemCard item={item} index={index} onClick={() => setSelected(item)} />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Botón flotante: la acción principal del armario es añadir ropa. */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 24 }}
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

      <ItemDetailSheet
        item={selected}
        avatar={avatar}
        tags={tags}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
