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

/** El bloque de «Apoyar Escaparate» que se enseña en Perfil. */
export type Apoyo = {
  activo: boolean;
  titulo: string;
  texto: string;
  boton: string;
  enlace: string;
};

/** La descarga directa del APK: aquí solo vive la dirección, no el fichero. */
export type Apk = {
  activo: boolean;
  version: string;
  enlace: string;
  notas: string;
};

/** La configuración del correo, sin la contraseña: esa no sale del servicio. */
export type CorreoAjustes = {
  host: string;
  puerto: number;
  seguro: boolean;
  usuario: string;
  remitente: string;
  nombre: string;
  hayContrasena: boolean;
  configurado: boolean;
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

/* ── Ajustes ───────────────────────────────────────────────────────────── */

export const pedirAjustes = () =>
  llamar<{ apoyo: Apoyo; apk: Apk; correo: CorreoAjustes }>("/admin/ajustes");

export const guardarApoyo = (apoyo: Apoyo) =>
  llamar<{ apoyo: Apoyo }>("/admin/ajustes/apoyo", { metodo: "PUT", cuerpo: apoyo });

/** La contraseña solo viaja si se ha escrito una nueva; vacía, se conserva. */
export const guardarCorreo = (correo: Partial<CorreoAjustes> & { contrasena?: string }) =>
  llamar<{ correo: CorreoAjustes }>("/admin/ajustes/correo", { metodo: "PUT", cuerpo: correo });

export const guardarApk = (apk: Apk) =>
  llamar<{ apk: Apk }>("/admin/ajustes/apk", { metodo: "PUT", cuerpo: apk });

export const probarCorreo = () =>
  llamar<{ enviado: string }>("/admin/correo/prueba", { metodo: "POST", cuerpo: {} });

/* ── Lo único sin sesión ───────────────────────────────────────────────── */

/**
 * «He olvidado mi contraseña», desde la pantalla de acceso.
 *
 * No lleva testigo —quien la usa es justamente quien no puede entrar— y
 * contesta igual exista o no la cuenta, así que no sirve para averiguar quién
 * está registrado. Quien manda el correo es el servicio, con el SMTP que haya
 * puesto en el panel.
 */
export async function pedirRecuperacion(correo: string): Promise<void> {
  if (!hayPanel) throw new ErrorDeDatos("No hay servicio de correo configurado");
  let respuesta: Response;
  try {
    respuesta = await fetch(`${BASE}/publico/recuperar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo }),
      cache: "no-store",
    });
  } catch {
    throw new ErrorDeRed("No se puede hablar con el servidor");
  }
  if (respuesta.status === 429) {
    throw new ErrorDeDatos("Has pedido demasiados correos seguidos. Prueba dentro de un rato.");
  }
  if (!respuesta.ok) {
    const datos = (await respuesta.json().catch(() => ({}))) as { error?: string };
    throw new ErrorDeDatos(datos.error ?? "No se ha podido enviar el correo");
  }
}

/**
 * Borrar la propia cuenta.
 *
 * No es una operación de administrador: la autoriza la sesión de quien la pide
 * y el servicio saca de ella a quién borrar, así que nadie puede pedir el
 * borrado de otro. Google Play lo exige para cualquier app con registro, y
 * hace falta igualmente: si le pides a alguien fotos de su ropa, tiene que
 * poder llevárselas de vuelta.
 */
export async function borrarMiCuenta(confirmacion: string): Promise<{ fotos: number }> {
  if (!hayPanel) {
    throw new ErrorDeDatos(
      "Esta versión de la app no puede borrar cuentas. Escribe a quien la administra.",
    );
  }

  const { data } = await supabase().auth.getSession();
  const testigo = data.session?.access_token;
  if (!testigo) throw new ErrorDeSesion();

  let respuesta: Response;
  try {
    respuesta = await fetch(`${BASE}/cuenta/borrar`, {
      method: "POST",
      headers: { Authorization: `Bearer ${testigo}`, "Content-Type": "application/json" },
      body: JSON.stringify({ confirmacion }),
      cache: "no-store",
    });
  } catch {
    throw new ErrorDeRed("No se puede hablar con el servidor");
  }

  const datos = (await respuesta.json().catch(() => ({}))) as { fotos?: number; error?: string };
  if (respuesta.status === 401) throw new ErrorDeSesion();
  if (!respuesta.ok) throw new ErrorDeDatos(datos.error ?? "No se ha podido borrar la cuenta");
  return { fotos: datos.fotos ?? 0 };
}
