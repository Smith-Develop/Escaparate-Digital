"use client";

import { motion } from "framer-motion";
import { Foto } from "@/components/ui/Foto";
import { AL_PULSAR, APARECE, escalonado } from "@/lib/animaciones";
import { centimosATexto } from "@/lib/dinero";
import { colorHex } from "@/lib/taxonomy";
import type { Item } from "@/lib/types";

/**
 * La prenda en una fila, para la vista de lista del armario.
 *
 * Es la misma tarjeta que la de «Tu prenda más cara» del inicio: foto pequeña a
 * la izquierda y el texto a la derecha. Lo que gana frente a la cuadrícula es la
 * ficha: aquí caben el tipo, la marca, la talla y el precio, que en una casilla
 * de tres columnas no entran. Lo que pierde es la foto grande, y por eso la
 * elección es del usuario y no nuestra.
 */
export function ItemRow({
  item,
  onClick,
  index = 0,
}: {
  item: Item;
  onClick?: () => void;
  index?: number;
}) {
  const ficha = [item.subcategory, item.brand, item.size && `Talla ${item.size}`]
    .filter(Boolean)
    .join(" · ");

  return (
    <motion.button
      type="button"
      onClick={onClick}
      {...APARECE}
      transition={escalonado(index)}
      whileTap={AL_PULSAR}
      className="edge flex w-full items-center gap-3 rounded-2xl bg-surface p-2.5 text-left"
    >
      <span className="size-16 shrink-0 overflow-hidden rounded-[1.1rem] bg-display">
        <Foto
          ruta={item.imageUrl}
          alt={item.name}
          color={item.dominantColor}
          width={64}
          height={64}
          className="size-full object-contain p-1"
        />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span
            className="size-2.5 shrink-0 rounded-full border border-black/30"
            style={{ background: colorHex(item.color) }}
            aria-hidden
          />
          <span className="min-w-0 flex-1 truncate font-display text-base leading-tight">
            {item.name}
          </span>
          {item.favorite && (
            <span className="shrink-0 text-sm" title="Favorita" aria-hidden>
              ★
            </span>
          )}
        </span>
        <span className="mt-0.5 block truncate text-xs text-ink-faint">{ficha}</span>
      </span>

      {item.priceCents !== null && (
        <span className="tabular shrink-0 text-sm text-ink-muted">
          {centimosATexto(item.priceCents)}
        </span>
      )}
    </motion.button>
  );
}
