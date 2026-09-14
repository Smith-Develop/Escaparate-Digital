"use client";

import { supabase } from "@/lib/supabase/cliente";
import { ErrorDeDatos, ErrorDeRed } from "@/lib/datos/errores";

/**
 * Registro y acceso contra Supabase Auth.
 *
 * Sustituye a las tres server actions y a `lib/auth.ts`: ya no hay cookie de
 * sesión ni tabla `Session`; el testigo lo guarda supabase-js en el propio
 * dispositivo y se renueva solo.
 */

/** GoTrue contesta en inglés; esto es lo que verá el usuario. */
function traducir(mensaje: string): string {
  const m = mensaje.toLowerCase();
  if (m.includes("invalid login credentials")) return "Correo o contraseña incorrectos";
  if (m.includes("email not confirmed")) return "Confirma tu correo antes de entrar";
  if (m.includes("user already registered") || m.includes("already been registered")) {
    return "Ya existe una cuenta con ese correo";
  }
  if (m.includes("password should be at least")) return "La contraseña necesita al menos 8 caracteres";
  if (m.includes("unable to validate email") || m.includes("invalid email")) {
    return "El correo no tiene un formato válido";
  }
  if (m.includes("error sending") && m.includes("email")) {
    return "No se pudo enviar el correo de confirmación. Avisa a quien administra el servidor.";
  }
  if (m.includes("failed to fetch") || m.includes("network")) return "Sin conexión";
  return mensaje;
}

const fallo = (error: { message: string } | null) => {
  if (!error) return;
  const texto = traducir(error.message);
  throw texto === "Sin conexión" ? new ErrorDeRed() : new ErrorDeDatos(texto);
};

/** Dónde vuelve el usuario tras confirmar el correo. */
const destinoDeVuelta = () =>
  typeof window === "undefined" ? undefined : `${window.location.origin}/login`;

export async function registrar({
  name,
  email,
  password,
}: {
  name: string;
  email: string;
  password: string;
}) {
  if (name.trim().length < 2) throw new ErrorDeDatos("Escribe tu nombre");
  if (password.length < 8) throw new ErrorDeDatos("La contraseña necesita al menos 8 caracteres");

  const { data, error } = await supabase().auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      // `app` es la marca que mira el disparador de la base para crear armario:
      // este Supabase lo comparten varias aplicaciones y no todas sus cuentas
      // son de Escaparate.
      data: { name: name.trim(), app: "escaparate" },
      emailRedirectTo: destinoDeVuelta(),
    },
  });
  fallo(error);

  // Si el servidor exige confirmar el correo, no devuelve sesión: hay que
  // decírselo al usuario en vez de dejarlo mirando una pantalla que no avanza.
  return { haySesion: Boolean(data.session) };
}

export async function entrar({ email, password }: { email: string; password: string }) {
  const { error } = await supabase().auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  fallo(error);
}

export async function salir() {
  await supabase().auth.signOut();
}
