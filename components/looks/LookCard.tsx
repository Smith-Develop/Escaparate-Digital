"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { OCCASIONS, labelFor } from "@/lib/taxonomy";
import type { Look } from "@/lib/types";

/**
 * La fecha guardada es un día de calendario a medianoche UTC. Se reconstruye a
 * partir de sus partes en vez de dejar que el navegador la convierta a hora
 * local: al oeste de Greenwich la conversión la retrasa un día.
 */
const formatDate = (iso: string) => {
  const [anio, mes, dia] = iso.slice(0, 10).split("-").map(Number);
  return new Date(anio, mes - 1, dia).toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

export function LookCard({ look, index }: { look: Look; index: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!confirm(`¿Eliminar el look "${look.name}"?`)) return;
    setBusy(true);
    await fetch(`/api/looks/${look.id}`, { method: "DELETE" });
    router.refresh();
  }

  async function schedule(value: string) {
    setBusy(true);
    await fetch(`/api/looks/${look.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledAt: value || null }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 6) * 0.04 }}
      className={`edge rounded-2xl bg-surface p-4 ${busy ? "opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-display text-lg">{look.name}</h3>
          <p className="mt-0.5 text-xs text-ink-faint">
            {look.items.length} {look.items.length === 1 ? "prenda" : "prendas"}
            {look.occasion && ` · ${labelFor(OCCASIONS, look.occasion)}`}
            {look.scheduledAt && ` · ${formatDate(look.scheduledAt)}`}
          </p>
        </div>
        <button
          type="button"
          onClick={remove}
          aria-label={`Eliminar ${look.name}`}
          className="shrink-0 rounded-full px-2 py-1 text-xs text-ink-faint hover:text-danger"
        >
          Eliminar
        </button>
      </div>

      <ul className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
        {look.items.map((item) => (
          <li
            key={item.id}
            className="edge size-16 shrink-0 rounded-xl bg-display p-1.5"
          >
            <Image
              src={item.imageUrl}
              alt={item.name}
              width={64}
              height={64}
              className="size-full object-contain"
            />
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center gap-2">
        <Link
          href={`/dashboard/studio?look=${look.id}`}
          className="flex min-h-10 flex-1 items-center justify-center rounded-full bg-surface-2 text-sm text-ink"
        >
          Abrir en el estudio
        </Link>
        <label className="relative flex min-h-10 items-center justify-center rounded-full border border-line px-4 text-sm text-ink-muted">
          {look.scheduledAt ? "Cambiar día" : "Planificar"}
          <input
            type="date"
            defaultValue={look.scheduledAt ? look.scheduledAt.slice(0, 10) : ""}
            onChange={(e) => schedule(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
      </div>
    </motion.article>
  );
}
