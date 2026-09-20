"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MobileNav } from "@/components/layout/MobileNav";
import { AvisoSinConexion } from "@/components/AvisoSinConexion";
import { InstalarApp } from "@/components/InstalarApp";
import { useSesion } from "@/components/SesionProvider";
import { useEspejo } from "@/lib/local/espejo";

/**
 * La puerta de la aplicación.
 *
 * Antes esto era una comprobación en el servidor que redirigía a quien no
 * tuviera cookie. Ahora la sesión vive en el dispositivo y recuperarla es
 * asíncrono, así que hay un tercer estado —«comprobando»— que evita el
 * parpadeo de la pantalla de acceso cada vez que se abre la app.
 *
 * Aquí también se monta el espejo: en cuanto se sabe quién entra, se pinta lo
 * que ya está guardado en el móvil y se refresca por detrás si hay red.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { estado, uid, nombre } = useSesion();
  const iniciar = useEspejo((s) => s.iniciar);

  useEffect(() => {
    if (estado === "fuera") router.replace("/login");
  }, [estado, router]);

  useEffect(() => {
    if (estado === "dentro" && uid) void iniciar(uid, nombre ?? undefined);
  }, [estado, uid, nombre, iniciar]);

  if (estado !== "dentro") {
    return (
      <div className="grid min-h-dvh place-items-center">
        <span
          aria-label="Cargando"
          className="size-8 animate-spin rounded-full border-2 border-accent border-t-transparent"
        />
      </div>
    );
  }

  return (
    // Altura exacta de la ventana y nada de desplazar el documento: lo que se
    // desplaza es el contenido. Es lo que mantiene la barra pegada abajo en
    // todas las pantallas, incluidas las que no llegan a llenar el alto, y lo
    // que evita que se mueva cuando el navegador del móvil esconde o enseña su
    // barra de direcciones.
    <div className="flex h-dvh flex-col overflow-hidden">
      {/* Los avisos van fuera de la zona que se desplaza, para que no se
          pierdan al bajar, pero con el mismo ancho que el contenido. */}
      <div className="mx-auto w-full max-w-lg shrink-0">
        <AvisoSinConexion />
        <InstalarApp />
      </div>
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col overflow-y-auto overscroll-contain">
        {children}
      </div>
      <MobileNav />
    </div>
  );
}
