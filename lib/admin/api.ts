"use client";

import { supabase } from "@/lib/supabase/cliente";
import { ErrorDeDatos, ErrorDeRed, ErrorDeSesion } from "@/lib/datos/errores";

/**
 * El cliente del panel de administración.
 *
 * El panel no habla con Supabase: habla con `servicio-admin`, que es donde vive
 * la clave de servicio. Aquí solo viaja **tu propia sesión**, la misma que usa
 * el resto de la app; el servicio la verifica y decide si eres administrador.
 *
 * Nada de lo que pasa por aquí se guarda en el espejo local ni en ninguna
 * caché: son datos de otras personas y solo existen mientras la pantalla está
 * abierta. Por eso tampoco hay modo sin conexión: el panel avisa y punto.
 */

const BASE = (process.env.NEXT_PUBLIC_ADMIN_API ?? "").replace(/\/$/, "");

/** Sin dirección configurada, la app se comporta como si el panel no existiera. */
export const hayPanel = BASE.length > 0;

export type Ficha = {
  id: string;
  correo: string;
  nombre: string;
  alta: string;
  ultimoAcceso: string | null;
  confirmado: boolean;
  suspendidoHasta: string | null;
  prendas: number;
  looks: number;
};

export type Resumen = {
  usuarios: number;
  suspendidos: number;
  sinConfirmar: number;
  prendas: number;
  looks: number;
  fotos: number;
  huerfanas: number;
  bytes: number;
  ultimas: Ficha[];
};

/** Prenda tal como la manda el panel: la foto llega ya firmada. */
export type PrendaAjena = {
  id: string;
  name: string;
  imageUrl: string | null;
  dominantColor: string;
  category: string;
  subcategory: string;
  color: string;
  brand: string | null;
  size: string | null;
  priceCents: number | null;
  favorite: boolean;
  createdAt: string;
};

export type DetalleUsuario = {
  ficha: Ficha;
  avatar: { photoUrl: string | null; heightCm: number; weightKg: number; figure: string } | null;
  prendas: PrendaAjena[];
  looks: {
    id: string;
    name: string;
    occasion: string | null;
    scheduledAt: string | null;
    createdAt: string;
    prendas: number;
  }[];
};

export type FotoDelAlmacen = {
  ruta: string;
  usuario: string;
  nombreDelUsuario: string;
  bytes: number;
  tipo: string;
  creada: string | null;
  usadaPor: string | null;
  huerfana: boolean;
  borrable: boolean;
  url: string | null;
};

export type Biblioteca = {
  fotos: FotoDelAlmacen[];
  usuarios: { id: string; nombre: string }[];
};

async function llamar<T>(
  ruta: string,
  { metodo = "GET", cuerpo }: { metodo?: string; cuerpo?: unknown } = {},
): Promise<T> {
  if (!hayPanel) throw new ErrorDeDatos("El panel no está configurado en esta compilación");

  const { data } = await supabase().auth.getSession();
  const testigo = data.session?.access_token;
  if (!testigo) throw new ErrorDeSesion();

  let respuesta: Response;
  try {
    respuesta = await fetch(BASE + ruta, {
      method: metodo,
      headers: {
        Authorization: `Bearer ${testigo}`,
        ...(cuerpo ? { "Content-Type": "application/json" } : {}),
      },
      ...(cuerpo ? { body: JSON.stringify(cuerpo) } : {}),
      cache: "no-store",
    });
  } catch {
    // Aquí no hay espejo que valga: o se llega al servicio o no hay panel.
    throw new ErrorDeRed("No se puede hablar con el servicio de administración");
  }

  if (respuesta.status === 401) throw new ErrorDeSesion();
  const datos = (await respuesta.json().catch(() => ({}))) as T & { error?: string };
  if (!respuesta.ok) throw new ErrorDeDatos(datos.error ?? `Error ${respuesta.status}`);
  return datos;
}

/** ¿Quien está dentro administra? Es la pregunta que abre o cierra el panel. */
export const soyAdmin = () =>
  llamar<{ admin: boolean; correo?: string }>("/admin/yo").catch(() => ({ admin: false }));

export const pedirResumen = () => llamar<Resumen>("/admin/resumen");

export const pedirUsuarios = (buscar = "") =>
  llamar<{ usuarios: Ficha[] }>(`/admin/usuarios?buscar=${encodeURIComponent(buscar)}`);

export const pedirUsuario = (id: string) =>
  llamar<DetalleUsuario>(`/admin/usuario?id=${encodeURIComponent(id)}`);

export const cambiarCorreo = (id: string, correo: string) =>
  llamar<{ correo: string }>("/admin/correo", { metodo: "POST", cuerpo: { id, correo } });

export const ponerContrasenaTemporal = (id: string) =>
  llamar<{ contrasena: string }>("/admin/contrasena", {
    metodo: "POST",
    cuerpo: { id, modo: "temporal" },
  });

export const mandarRecuperacion = (id: string) =>
  llamar<{ enviado: string }>("/admin/contrasena", {
    metodo: "POST",
    cuerpo: { id, modo: "correo" },
  });

export type Duracion = "24h" | "7d" | "30d" | "ninguna";

export const cambiarSuspension = (id: string, duracion: Duracion) =>
  llamar<{ suspendidoHasta: string | null }>("/admin/suspension", {
    metodo: "POST",
    cuerpo: { id, duracion },
  });

export const pedirBiblioteca = ({ usuario = "", soloHuerfanas = false } = {}) =>
  llamar<Biblioteca>(
    `/admin/biblioteca?usuario=${encodeURIComponent(usuario)}${soloHuerfanas ? "&huerfanas=1" : ""}`,
  );

export const borrarFoto = (ruta: string) =>
  llamar<{ borrada: string }>("/admin/foto", { metodo: "DELETE", cuerpo: { ruta } });
