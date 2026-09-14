"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MobileNav } from "@/components/layout/MobileNav";
import { AvisoSinConexion } from "@/components/AvisoSinConexion";
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
    <div className="flex min-h-dvh flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
        <AvisoSinConexion />
        {children}
      </div>
      <MobileNav />
    </div>
  );
}
