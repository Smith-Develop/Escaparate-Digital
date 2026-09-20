"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSesion } from "@/components/SesionProvider";

/**
 * Marco de entrar y registrarse.
 *
 * Lleva el botón redondo de volver arriba a la izquierda, como las pantallas de
 * detalle: desde el acceso siempre se puede regresar a la portada, y el gesto
 * está donde está en el resto de la app.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { estado } = useSesion();

  useEffect(() => {
    if (estado === "dentro") router.replace("/dashboard");
  }, [estado, router]);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 pb-safe pt-safe">
      <div className="py-1">
        <Link
          href="/"
          aria-label="Volver a la portada"
          className="edge grid size-10 place-items-center rounded-full bg-surface text-ink"
        >
          <svg
            viewBox="0 0 24 24"
            className="size-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </Link>
      </div>

      <div className="flex flex-1 flex-col justify-center pb-8">{children}</div>
    </main>
  );
}
