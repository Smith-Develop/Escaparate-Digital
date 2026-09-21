"use client";

import { createClient } from "@supabase/supabase-js";
import { almacenDeSesion, vigilarSegundoPlano } from "@/lib/supabase/almacen";
import { esAppNativa } from "@/lib/plataforma";

/**
 * El cliente de Supabase, único para toda la app.
 *
 * Desde que no hay servidor, este es el único camino a los datos: la interfaz
 * habla directamente con PostgREST, GoTrue y Storage, y quien decide qué puede
 * ver cada cual es la seguridad por filas de la base, no un middleware nuestro.
 *
 * El esquema no viaja en la URL. En una cadena de conexión de PostgreSQL se
 * escribe `?schema=…` —eso es cosa de Prisma—, pero la API de Supabase lo
 * espera en las opciones del cliente. Escaparate vive en un esquema propio
 * porque comparte la instancia con otras aplicaciones.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const schema = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA ?? "public";

function crear() {
  if (!url || !anonKey) {
    // Mensaje explícito y en seco: sin estas dos variables no hay nada que
    // hacer, y el error de supabase-js por su cuenta no dice cuál falta.
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Cópialas de .env.example a .env.local.",
    );
  }

  const cliente = createClient(url, anonKey, {
    db: { schema },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // Dentro del APK la app no se abre por una dirección web, así que no hay
      // ningún fragmento de URL que mirar; en la web sí, y es como vuelve la
      // sesión después de pulsar el enlace de recuperar la contraseña.
      detectSessionInUrl: !esAppNativa(),
      storage: almacenDeSesion(),
    },
  });
  void vigilarSegundoPlano(cliente);
  return cliente;
}

// El tipo sale de la propia llamada. Escribir `SupabaseClient` a secas no vale:
// ese tipo da por hecho el esquema "public", y el nuestro se decide en tiempo
// de ejecución con una variable de entorno.
type Cliente = ReturnType<typeof crear>;

let cliente: Cliente | null = null;

export function supabase(): Cliente {
  cliente ??= crear();
  return cliente;
}

/** El esquema en uso, para los mensajes de diagnóstico. */
export const esquema = schema;
