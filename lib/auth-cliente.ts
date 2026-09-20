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

/**
 * Dónde vuelve el usuario tras confirmar el correo.
 *
 * Con la barra final, que es la ruta de verdad: la app se compila con
 * `trailingSlash`, y aunque un nginx resuelva la diferencia por su cuenta, la
 * lista blanca de direcciones de GoTrue compara el texto tal cual.
 */
const destinoDeVuelta = () =>
  typeof window === "undefined" ? undefined : `${window.location.origin}/login/`;

type Alta = { name: string; email: string; password: string };

/**
 * Da de alta y entra en el mismo paso.
 *
 * El servidor tiene la confirmación de correo desactivada, así que el alta ya
 * devuelve sesión y no hay que pasar por ningún enlace. Aun así el código
 * contempla el caso contrario: ese ajuste vive en la instancia de Supabase, no
 * en la app, y el día que alguien lo cambie —la instancia la comparten varias
 * aplicaciones— conviene que aquí se vea un mensaje claro en vez de una
 * pantalla que no avanza.
 */
export async function registrar({ name, email, password }: Alta) {
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

  // Lo normal: el alta ya trae sesión y se entra sin más trámite.
  if (data.session) return { haySesion: true };

  // Si no la devuelve, se intenta entrar acto seguido. Hay instalaciones que
  // crean la cuenta ya confirmada pero no abren sesión en el mismo paso, y en
  // ese caso pedirle al usuario que mire el correo sería mandarlo a esperar un
  // mensaje que no va a llegar.
  const { error: alEntrar } = await supabase().auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (!alEntrar) return { haySesion: true };

  // Solo queda un motivo razonable: el servidor sí exige confirmar. Se le dice
  // al usuario, en vez de dejarlo mirando una pantalla que no avanza.
  if (/email not confirmed/i.test(alEntrar.message)) return { haySesion: false };

  fallo(alEntrar);
  return { haySesion: false };
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
