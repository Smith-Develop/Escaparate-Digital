"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useOutfit } from "@/lib/store";
import type { Item } from "@/lib/types";

/**
 * Lo que lleva puesto el avatar, en la pestaña «Puestas» de la columna lateral.
 *
 * El orden es el de apilado, de la prenda del fondo a la de delante, y tocar
 * una la trae al frente. Sirve a la vez de inventario del conjunto y de control
 * de capas. El ancho y el título los pone `SidePanel`.
 */
export function WornGrid({ items }: { items: Item[] }) {
  const bringToFront = useOutfit((s) => s.bringToFront);
  const toggle = useOutfit((s) => s.toggle);
  const top = items[items.length - 1] ?? null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {items.length === 0 ? (
        <p className="edge rounded-xl px-2 py-6 text-center text-[11px] leading-tight text-ink-faint">
          Nada puesto todavía
        </p>
      ) : (
        <ul className="no-scrollbar flex flex-col gap-2 overflow-y-auto overscroll-contain px-0.5 py-0.5">
          <AnimatePresence initial={false}>
            {items.map((item, index) => (
              <motion.li key={item.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div
                  className={[
                    "relative aspect-square w-full overflow-hidden rounded-lg bg-display p-1 transition-shadow",
                    item.id === top?.id ? "shadow-[0_0_0_2px_var(--accent)]" : "edge",
                  ].join(" ")}
                >
                  <button
                    type="button"
                    onClick={() => bringToFront(item.id)}
                    aria-label={`Poner ${item.name} delante`}
                    className="size-full"
                  >
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      width={48}
                      height={48}
                      className="size-full object-contain"
                    />
                  </button>
                  <span className="tabular pointer-events-none absolute bottom-0 left-0.5 text-[9px] text-ink-faint">
                    {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggle(item)}
                    aria-label={`Quitar ${item.name}`}
                    className="absolute right-0 top-0 grid size-5 place-items-center text-[11px] leading-none text-ink-faint hover:text-danger"
                  >
                    <span aria-hidden>×</span>
                  </button>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
