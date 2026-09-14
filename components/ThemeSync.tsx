"use client";

import { useEffect } from "react";
import { applyTheme, readPreference } from "@/lib/theme";

/**
 * Mantiene el tema al día mientras la app está abierta.
 *
 * Con la preferencia puesta en "sistema", muchos móviles cambian solos de claro
 * a oscuro al anochecer; sin esto la app se quedaría con el tema que tenía al
 * cargar. Va en el layout raíz para que escuche desde cualquier pantalla.
 */
export function ThemeSync() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const sync = () => {
      if (readPreference() === "sistema") applyTheme("sistema");
    };
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return null;
}
