"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Adornos } from "@/components/ilustraciones/Adornos";
import { useSesion } from "@/components/SesionProvider";

/**
 * Marco de entrar y registrarse.
 *
 * Mismo aire que la portada —los arcos de las esquinas, el alto completo— y el
 * botón redondo de volver arriba a la izquierda, donde está en el resto de la
 * app. El contenido ocupa lo que queda para que cada pantalla pueda anclar su
 * acción al borde inferior.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { estado } = useSesion();

  useEffect(() => {
    if (estado === "dentro") router.replace("/dashboard");
  }, [estado, router]);

  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-lg flex-col overflow-hidden px-6 pb-safe pt-safe">
      <Adornos />

      <div className="relative z-10 flex flex-1 flex-col">
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

        {children}
      </div>
    </main>
  );
}
