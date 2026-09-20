"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Adornos } from "@/components/ilustraciones/Adornos";
import { Aparece } from "@/components/ui/Aparece";
import { ArmarioAbierto } from "@/components/ilustraciones/ArmarioAbierto";
import { useSesion } from "@/components/SesionProvider";

/**
 * La portada.
 *
 * Una sola pantalla de bienvenida, con la ilustración mandando y las dos
 * acciones ancladas abajo: son lo que se viene a hacer aquí, y en el móvil el
 * borde inferior es donde llega el pulgar sin estirarse.
 *
 * `min-h-dvh` con `mt-auto` en el bloque de botones los pega al borde cuando
 * sobra alto y los empuja hacia abajo cuando no, sin recurrir a posición fija,
 * que en el móvil pelea con el teclado y con la barra del navegador.
 */
export default function LandingPage() {
  const router = useRouter();
  const { estado } = useSesion();

  // Quien ya ha entrado no necesita la presentación. Dentro del APK esta
  // pantalla casi no se ve: se abre con la sesión puesta.
  useEffect(() => {
    if (estado === "dentro") router.replace("/dashboard");
  }, [estado, router]);

  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-lg flex-col overflow-hidden px-6 pb-safe pt-safe">
      <Adornos />

      <div className="relative z-10 flex flex-1 flex-col">
        <p className="py-1.5 text-center text-xs font-semibold tracking-[0.3em] text-ink-muted sm:py-2">
          ESCAPARATE
        </p>

        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-2 sm:gap-6 sm:py-4">
          {/* El alto manda sobre el ancho: en una pantalla corta, una
              ilustración de ancho fijo empujaba los botones fuera y la portada
              acababa desplazándose. */}
          <Aparece index={0} className="flex max-h-[38vh] w-full justify-center">
            <ArmarioAbierto className="h-full max-h-full w-auto max-w-[18rem] text-ink" />
          </Aparece>

          <Aparece index={1} className="text-center">
            <h1 className="font-display uppercase leading-none tracking-[0.02em] [font-size:clamp(1.75rem,8vw,2.25rem)]">
              Tu armario
            </h1>
            <p className="mx-auto mt-3 max-w-[16rem] text-xs uppercase leading-relaxed tracking-[0.12em] text-ink-muted">
              Fotografía tu ropa
              <br />
              y combínala sin abrir un cajón
            </p>
          </Aparece>
        </div>

        {/* Ancladas abajo: crear cuenta y entrar son lo único que se hace aquí. */}
        <Aparece index={2} className="mt-auto flex flex-col gap-2.5 pb-3 pt-5 sm:gap-3 sm:pb-4 sm:pt-8">
          <Link
            href="/register"
            className="inline-flex min-h-13 items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold uppercase tracking-[0.12em] text-on-accent"
          >
            Crear mi armario
          </Link>
          <Link
            href="/login"
            className="inline-flex min-h-13 items-center justify-center rounded-full bg-ink px-6 text-sm font-semibold uppercase tracking-[0.12em] text-canvas"
          >
            Iniciar sesión
          </Link>
        </Aparece>
      </div>
    </main>
  );
}
