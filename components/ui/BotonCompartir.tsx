"use client";

import { useState } from "react";
import type { ResultadoCompartir } from "@/lib/compartir";

const AVISOS: Record<ResultadoCompartir, string | null> = {
  compartido: null, // La bandeja del sistema ya es el acuse de recibo.
  copiado: "Enlace copiado",
  descargado: "Imagen descargada",
  cancelado: null,
  imposible: "No se ha podido compartir",
};

/**
 * Botón de compartir con acuse de recibo.
 *
 * Cuando el sistema abre su bandeja no hace falta decir nada, pero si lo que ha
 * pasado es que el enlace se ha copiado o la imagen se ha descargado, el
 * usuario no tiene forma de saberlo: por eso el mensaje aparece un momento
 * junto al botón.
 */
export function BotonCompartir({
  onCompartir,
  label,
  className,
  children,
}: {
  onCompartir: () => Promise<ResultadoCompartir>;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [aviso, setAviso] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label={label}
        disabled={ocupado}
        onClick={async () => {
          setOcupado(true);
          setAviso(null);
          try {
            const resultado = await onCompartir();
            const texto = AVISOS[resultado];
            if (texto) {
              setAviso(texto);
              setTimeout(() => setAviso(null), 2600);
            }
          } finally {
            setOcupado(false);
          }
        }}
        className={className}
      >
        {children}
      </button>

      {aviso && (
        <span
          role="status"
          className="edge absolute right-0 top-full z-20 mt-2 whitespace-nowrap rounded-full bg-surface px-3 py-1.5 text-xs text-ink"
        >
          {aviso}
        </span>
      )}
    </span>
  );
}

/**
 * Icono de cámara, para compartir la foto de un conjunto.
 *
 * Lo que sale de ahí es una imagen, no un enlace: con la flecha de compartir
 * genérica la gente esperaba que se enviara el look como algo que el otro
 * pudiera abrir en la app, y llegaba una foto.
 */
export function IconoCamara({ className = "size-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h2.2a1.5 1.5 0 0 0 1.25-.67l.6-.9A1.5 1.5 0 0 1 9.8 4.8h4.4a1.5 1.5 0 0 1 1.25.67l.6.9A1.5 1.5 0 0 0 17.3 7h2.2A1.5 1.5 0 0 1 21 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z" />
      <circle cx="12" cy="13" r="3.4" />
    </svg>
  );
}

/** El icono de compartir, el mismo en toda la app. */
export function IconoCompartir({ className = "size-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3v13" />
      <path d="m8 7 4-4 4 4" />
      <path d="M6 12H5a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2h-1" />
    </svg>
  );
}
