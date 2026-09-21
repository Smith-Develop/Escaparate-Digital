"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Titulo } from "@/components/Titulo";
import { Adornos } from "@/components/ilustraciones/Adornos";
import { APARECE } from "@/lib/animaciones";
import { ACTUALIZADO } from "@/lib/legal";

/**
 * El marco de las páginas legales.
 *
 * Mismo aire que la portada —los arcos de las esquinas, el botón redondo de
 * volver— porque son páginas de la app, no un anexo de otro sitio. Se leen sin
 * cuenta: a la política de privacidad hay que poder llegar desde la ficha de
 * Google Play, y a la de borrar la cuenta, desde cualquier parte.
 */
export function Documento({
  titulo,
  entradilla,
  children,
}: {
  titulo: string;
  entradilla: string;
  children: React.ReactNode;
}) {
  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-2xl flex-col overflow-hidden px-6 pb-16 pt-safe">
      <Adornos />
      <Titulo>{titulo}</Titulo>

      <div className="relative z-10">
        <div className="py-1">
          <Link
            href="/"
            aria-label="Volver a la portada"
            className="edge grid size-10 place-items-center rounded-full bg-surface text-ink"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </Link>
        </div>

        <motion.article {...APARECE} className="pt-6">
          <h1 className="font-display text-[2rem] leading-none">{titulo}</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">{entradilla}</p>
          <p className="mt-1 text-xs text-ink-faint">Última actualización: {ACTUALIZADO}</p>

          <div className="mt-8 flex flex-col gap-6">{children}</div>
        </motion.article>
      </div>
    </main>
  );
}

/** Un apartado con su título, para no repetir clases en cada uno. */
export function Apartado({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="edge rounded-[1.5rem] bg-surface p-5">
      <h2 className="font-display text-lg leading-tight">{titulo}</h2>
      <div className="mt-2 flex flex-col gap-3 text-sm leading-relaxed text-ink-muted">
        {children}
      </div>
    </section>
  );
}
