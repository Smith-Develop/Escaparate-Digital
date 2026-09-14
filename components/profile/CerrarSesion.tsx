"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { salir } from "@/lib/auth-cliente";
import { useEspejo } from "@/lib/local/espejo";
import { useSesion } from "@/components/SesionProvider";

/**
 * Cerrar sesión borra también el armario guardado en el móvil.
 *
 * Si no, la siguiente persona que entrara en este teléfono vería las fotos y
 * las prendas de quien lo usó antes, hasta la primera sincronización y para
 * siempre en el caso de las fotos.
 */
export function CerrarSesion() {
  const router = useRouter();
  const { uid } = useSesion();
  const cerrar = useEspejo((s) => s.cerrar);
  const [saliendo, setSaliendo] = useState(false);

  return (
    <button
      type="button"
      disabled={saliendo}
      onClick={async () => {
        setSaliendo(true);
        if (uid) await cerrar(uid);
        await salir();
        router.replace("/login");
      }}
      className="edge min-h-11 w-full rounded-full bg-surface text-sm text-ink-muted disabled:opacity-50"
    >
      {saliendo ? "Cerrando…" : "Cerrar sesión"}
    </button>
  );
}
