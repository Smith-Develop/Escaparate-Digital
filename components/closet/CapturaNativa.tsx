"use client";

import { useRef, type ReactNode } from "react";
import { motion } from "framer-motion";

type Props = {
  onCapture: (file: File) => void;
  /** Texto de ayuda sobre cómo colocar lo que se va a fotografiar. */
  hint?: string;
  /** Figura de referencia que se muestra como ejemplo de encuadre. */
  guide?: ReactNode;
};

/**
 * Captura con la cámara del teléfono.
 *
 * Se abre la aplicación de cámara del sistema en lugar de dibujar un visor
 * propio. Resolver dentro del navegador la orientación, las proporciones y los
 * objetivos resultó poco fiable —un flujo pedido en vertical llegaba apaisado,
 * por ejemplo—, mientras que la cámara nativa ya trae todo eso resuelto y el
 * usuario la conoce: sus modos, su temporizador y sus lentes 0,5×, 1× y 2×.
 *
 * La app se ocupa de lo que viene después: recorte de fondo y retoque.
 */
export function CapturaNativa({ onCapture, hint, guide }: Props) {
  const camara = useRef<HTMLInputElement>(null);
  const galeria = useRef<HTMLInputElement>(null);

  const elegir = (input: HTMLInputElement | null) => input?.click();

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 py-4">
      {guide && (
        <div className="edge grid max-h-[38vh] w-full max-w-56 place-items-center overflow-hidden rounded-2xl bg-display p-3">
          {guide}
        </div>
      )}

      <p className="max-w-xs text-center text-sm leading-relaxed text-ink-muted">
        {hint ?? "Extiende la prenda sobre un fondo liso y encuádrala completa."}
      </p>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={() => elegir(camara.current)}
          className="flex min-h-14 items-center justify-center gap-2 rounded-full bg-accent font-semibold text-on-accent"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
            <path d="M4 8.5h3l1.5-2h7L17 8.5h3v10H4z" strokeLinejoin="round" />
            <circle cx="12" cy="13" r="3.2" />
          </svg>
          Abrir la cámara
        </motion.button>

        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={() => elegir(galeria.current)}
          className="edge flex min-h-12 items-center justify-center gap-2 rounded-full bg-surface text-sm text-ink"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
            <rect x="3" y="5" width="18" height="14" rx="2.5" />
            <path d="m4 16 4.5-4.5 3.5 3 3-2.5L20 16" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Elegir de la galería
        </motion.button>
      </div>

      {/* `capture` pide la cámara trasera; sin el atributo se abre la galería. */}
      <input
        ref={camara}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onCapture(file);
          e.target.value = "";
        }}
      />
      <input
        ref={galeria}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onCapture(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
