"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AvatarEditor } from "@/components/profile/AvatarEditor";
import { Mannequin } from "@/components/closet/Mannequin";
import { MEASUREMENTS } from "@/lib/taxonomy";
import type { AvatarParams } from "@/lib/types";

/** Las que se miran de un vistazo; el resto vive dentro del editor. */
// Seis que caben sin cortarse en la rejilla de tres columnas del móvil.
const RESUMEN = ["heightCm", "weightKg", "shoulderCm", "chestCm", "waistCm", "hipCm"] as const;

/**
 * Medidas del cuerpo, plegadas.
 *
 * Los doce deslizadores ocupaban el perfil entero y solo se tocan de higos a
 * brevas, así que de normal se ve el maniquí con las medidas de referencia y el
 * editor se despliega a petición.
 */
export function MeasuresSection({ avatar }: { avatar: AvatarParams }) {
  const [abierto, setAbierto] = useState(false);

  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between gap-3 px-5">
        <h2 className="text-xs uppercase tracking-[0.14em] text-ink-faint">Tus medidas</h2>
        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          aria-expanded={abierto}
          className="text-sm text-accent-ink underline underline-offset-4"
        >
          {abierto ? "Listo" : "Ajustar"}
        </button>
      </div>

      <AnimatePresence initial={false} mode="wait">
        {abierto ? (
          <motion.div key="editor" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <AvatarEditor initial={avatar} onSaved={() => setAbierto(false)} />
          </motion.div>
        ) : (
          <motion.div key="resumen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5">
            <div className="edge flex gap-4 rounded-2xl bg-surface p-4">
              <div className="h-32 w-20 shrink-0">
                <Mannequin avatar={avatar} className="size-full text-accent-ink" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-relaxed text-ink-muted">
                  Con ellas se dibuja el maniquí que aparece al colocar cada prenda, para que la
                  sitúes sobre tus proporciones y no sobre un cuerpo genérico.
                </p>
                <dl className="mt-3 grid grid-cols-3 gap-x-3 gap-y-2">
                  {RESUMEN.map((key) => {
                    const campo = MEASUREMENTS.find((m) => m.key === key);
                    if (!campo) return null;
                    return (
                      <div key={key}>
                        <dt className="truncate text-[10px] uppercase tracking-wider text-ink-faint">
                          {campo.short}
                        </dt>
                        <dd className="tabular font-display text-lg leading-none">
                          {avatar[key as keyof AvatarParams] as number}
                          <span className="ml-0.5 text-xs text-ink-faint">{campo.unit}</span>
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
