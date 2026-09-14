/**
 * Los tres motivos por los que algo puede fallar ahora que no hay servidor.
 *
 * Antes lo traducía `handle()` en el servidor y el cliente solo veía un texto.
 * Ahora las respuestas de Supabase llegan crudas y hay que distinguirlas: un
 * corte de red no se cuenta igual que un dato mal escrito, y una sesión
 * caducada se arregla sola renovándola.
 */

export class ErrorDeRed extends Error {
  constructor(mensaje = "Sin conexión") {
    super(mensaje);
    this.name = "ErrorDeRed";
  }
}

export class ErrorDeSesion extends Error {
  constructor(mensaje = "Tu sesión ha caducado") {
    super(mensaje);
    this.name = "ErrorDeSesion";
  }
}

export class ErrorDeDatos extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ErrorDeDatos";
  }
}

type ErrorSupabase = { code?: string; message?: string; details?: string | null; status?: number };

/**
 * Traduce lo que devuelve Supabase a algo que la interfaz pueda contar.
 *
 * `fetch` lanza un `TypeError` cuando no hay red, que es indistinguible de un
 * error de programación si no se mira el mensaje; por eso se comprueba también
 * `navigator.onLine`.
 */
export function clasificar(error: unknown, quéSeHacía: string): Error {
  if (error instanceof ErrorDeRed || error instanceof ErrorDeSesion || error instanceof ErrorDeDatos) {
    return error;
  }

  if (error instanceof TypeError || (typeof navigator !== "undefined" && !navigator.onLine)) {
    return new ErrorDeRed();
  }

  const e = (error ?? {}) as ErrorSupabase;

  // Sesión: PostgREST usa PGRST301 para un JWT caducado; GoTrue, un 401.
  if (e.code === "PGRST301" || e.status === 401) return new ErrorDeSesion();

  // Restricciones de la base: son las que sustituyen a las validaciones que
  // hacía el servidor, así que su mensaje va al usuario tal cual se pueda.
  if (e.code === "23505") return new ErrorDeDatos("Ya existe algo con ese nombre");
  if (e.code === "23514") return new ErrorDeDatos("Algún dato no es válido");
  if (e.code === "42501") return new ErrorDeSesion("No tienes permiso: vuelve a entrar");

  return new Error(`${quéSeHacía}: ${e.message ?? "algo ha fallado"}`);
}

/** Envuelve una operación para que siempre lance un error de los de arriba. */
export async function intentar<T>(quéSeHacía: string, operación: () => Promise<T>): Promise<T> {
  try {
    return await operación();
  } catch (error) {
    throw clasificar(error, quéSeHacía);
  }
}

/** Traduce un error de Supabase que viene en el resultado, no lanzado. */
export function siFalla(error: unknown, quéSeHacía: string): never | void {
  if (error) throw clasificar(error, quéSeHacía);
}
