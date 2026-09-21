"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { hayPanel, soyAdmin } from "@/lib/admin/api";
import { ApareceSeccion } from "@/components/ui/Aparece";

/**
 * La puerta al panel de administración, en el perfil.
 *
 * No se enseña a nadie salvo a quien administra de verdad, y eso **lo decide el
 * servicio**, no la app: aquí no hay ninguna lista de correos que alguien pueda
 * leer abriendo el JavaScript. Mientras no conteste, no se pinta nada; así, en
 * el caso normal —que es no ser administrador— el perfil no parpadea con una
 * sección que desaparece.
 */
export function EntradaPanel() {
  const [puede, setPuede] = useState(false);

  useEffect(() => {
    if (!hayPanel) return;
    let vigente = true;
    void soyAdmin().then((r) => {
      if (vigente) setPuede(r.admin);
    });
    return () => {
      vigente = false;
    };
  }, []);

  if (!puede) return null;

  return (
    <ApareceSeccion index={7} className="px-5">
      <h2 className="mb-2 text-xs uppercase tracking-[0.14em] text-ink-faint">Administración</h2>
      <Link href="/admin" className="edge flex items-center gap-3 rounded-2xl bg-surface p-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-pastel-azul text-pastel-azul-ink">
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 3.5 4.5 6.5v5c0 4.2 3 7.6 7.5 9 4.5-1.4 7.5-4.8 7.5-9v-5z" />
            <path d="M9.5 12l1.8 1.8 3.4-3.6" />
          </svg>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-base leading-tight">Panel de administración</span>
          <span className="block text-xs text-ink-muted">
            Usuarios, credenciales y biblioteca de imágenes
          </span>
        </span>
        <span aria-hidden className="text-ink-faint">
          ›
        </span>
      </Link>
    </ApareceSeccion>
  );
}
