"use client";

import { Foto } from "@/components/ui/Foto";
import { motion } from "framer-motion";
import { colorHex } from "@/lib/taxonomy";
import type { Item } from "@/lib/types";

type Props = {
  item: Item;
  onClick?: () => void;
  selected?: boolean;
  index?: number;
};

export function ItemCard({ item, onClick, selected, index = 0 }: Props) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      // Escalonado corto: da sensación de fluidez sin retrasar la lectura.
      transition={{ delay: Math.min(index, 8) * 0.03 }}
      whileTap={{ scale: 0.96 }}
      className={[
        "group relative flex w-full flex-col overflow-hidden rounded-2xl bg-surface text-left transition-shadow",
        selected ? "shadow-[0_0_0_2px_var(--accent)]" : "edge",
      ].join(" ")}
    >
      <span className="relative block aspect-square w-full bg-display p-3">
        <Foto
          ruta={item.imageUrl}
          alt={item.name}
          color={item.dominantColor}
          fill
          className="object-contain p-3"
        />
        {item.favorite && (
          <span className="absolute right-2 top-2 text-sm" title="Favorita" aria-hidden>
            ★
          </span>
        )}
      </span>

      <span className="flex items-center gap-2 border-t border-line px-2.5 py-2">
        <span
          className="size-2.5 shrink-0 rounded-full border border-black/30"
          style={{ background: colorHex(item.color) }}
          aria-hidden
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs text-ink">{item.name}</span>
          <span className="block truncate text-[10px] text-ink-faint">{item.subcategory}</span>
        </span>
      </span>

      {selected && (
        <span
          aria-hidden
          className="absolute left-2 top-2 grid size-6 place-items-center rounded-full bg-accent text-xs font-bold text-on-accent"
        >
          ✓
        </span>
      )}
    </motion.button>
  );
}
