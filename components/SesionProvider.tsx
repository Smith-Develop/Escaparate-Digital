"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/cliente";

/**
 * Quién está dentro.
 *
 * Son **tres** estados, no dos. Recuperar la sesión guardada es asíncrono, así
 * que con un simple «hay usuario o no» se vería la pantalla de acceso durante
 * un instante en cada arranque de la app, que es justo el tipo de parpadeo que
 * delata a una aplicación web metida en un móvil.
 */

export type Sesion = {
  estado: "comprobando" | "dentro" | "fuera";
  uid: string | null;
  email: string | null;
  /** Nombre que se dio al registrarse; el de la tabla de perfil manda sobre este. */
  nombre: string | null;
};

const SIN_SESION: Sesion = { estado: "comprobando", uid: null, email: null, nombre: null };

const Contexto = createContext<Sesion>(SIN_SESION);

export function SesionProvider({ children }: { children: React.ReactNode }) {
  const [sesion, setSesion] = useState<Sesion>(SIN_SESION);

  useEffect(() => {
    const cliente = supabase();

    const aplicar = (usuario: { id: string; email?: string; user_metadata?: { name?: string } } | null) =>
      setSesion(
        usuario
          ? {
              estado: "dentro",
              uid: usuario.id,
              email: usuario.email ?? null,
              nombre: usuario.user_metadata?.name ?? null,
            }
          : { estado: "fuera", uid: null, email: null, nombre: null },
      );

    cliente.auth.getSession().then(({ data }) => aplicar(data.session?.user ?? null));

    const { data: suscripcion } = cliente.auth.onAuthStateChange((_evento, sesion) =>
      aplicar(sesion?.user ?? null),
    );
    return () => suscripcion.subscription.unsubscribe();
  }, []);

  return <Contexto.Provider value={sesion}>{children}</Contexto.Provider>;
}

export const useSesion = () => useContext(Contexto);
