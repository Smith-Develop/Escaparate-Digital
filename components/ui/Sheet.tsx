"use client";

import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { useEffect } from "react";
import { registrarCierre } from "@/lib/atras";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

/** Hoja inferior arrastrable: el patrón modal natural en móvil. */
export function Sheet({ open, onClose, title, children }: Props) {
  // El arrastre se inicia solo desde la cabecera. Si escuchara en toda la hoja,
  // se comería el desplazamiento del contenido y los controles de abajo
  // quedarían inalcanzables en el móvil.
  const dragControls = useDragControls();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    // Y lo mismo para el botón «atrás» de Android, que es el Escape de allí.
    const quitar = registrarCierre(onClose);
    return () => {
      document.removeEventListener("keydown", onKey);
      quitar();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-scrim backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            // `overscroll-contain` evita que al llegar al final de la hoja siga
            // desplazándose la página de debajo.
            className="edge-raised fixed inset-x-0 bottom-0 z-50 max-h-[88vh] overflow-y-auto overscroll-contain rounded-t-2xl bg-surface pb-safe"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            drag="y"
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose();
            }}
          >
            <div
              onPointerDown={(event) => dragControls.start(event)}
              className="sticky top-0 z-10 touch-none bg-surface px-5 pb-3 pt-3"
            >
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />
              {title && <h2 className="font-display text-xl">{title}</h2>}
            </div>
            <div className="px-5 pb-6">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
