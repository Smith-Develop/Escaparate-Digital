/**
 * Los tres caminos a Supabase, en un sitio.
 *
 * Se habla por HTTP, sin la biblioteca de Supabase: el cliente arrastra el
 * módulo de tiempo real —con su WebSocket y su exigencia de Node 22 en
 * adelante— para un servicio que solo hace peticiones REST. Este proceso es el
 * que guarda la llave de toda la instancia, así que cuantas menos dependencias
 * haya que vigilar, mejor.
 */
import { ErrorHttp } from "./sesion.mjs";

export const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
export const anon = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const esquema =
  process.env.SUPABASE_SCHEMA ?? process.env.NEXT_PUBLIC_SUPABASE_SCHEMA ?? "public";
export const SITIO = (process.env.SITIO_URL ?? process.env.NEXT_PUBLIC_SITIO_URL ?? "").replace(
  /\/$/,
  "",
);

const servicio = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** El bucket de fotos, con el nombre de la app por delante: instancia compartida. */
export const BUCKET = "escaparate-fotos";
/** Marca que deja el registro de Escaparate en los metadatos de la cuenta. */
export const APP = "escaparate";
/** Tope de filas por página. PostgREST corta a `PGRST_DB_MAX_ROWS` (1000 aquí). */
export const PAGINA = 1000;

const claveDeServicio = () => ({
  apikey: servicio,
  Authorization: `Bearer ${servicio}`,
  "Content-Type": "application/json",
});

export const gotrue = (ruta, opciones = {}) =>
  fetch(`${url}/auth/v1${ruta}`, {
    ...opciones,
    headers: { ...claveDeServicio(), ...opciones.headers },
  });

/**
 * PostgREST. El esquema va en la cabecera, no en la URL: al vivir Escaparate en
 * `app_escaparate` y no en `public`, sin `Accept-Profile` las consultas irían a
 * las tablas de tu otra aplicación.
 */
export async function rest(recurso, { metodo = "GET", cuerpo, cabeceras = {} } = {}) {
  const r = await fetch(`${url}/rest/v1/${recurso}`, {
    method: metodo,
    headers: {
      ...claveDeServicio(),
      ...(metodo === "GET" ? { "Accept-Profile": esquema } : { "Content-Profile": esquema }),
      ...cabeceras,
    },
    ...(cuerpo ? { body: JSON.stringify(cuerpo) } : {}),
  });
  const texto = await r.text();
  if (!r.ok) throw new ErrorHttp(502, `Base de datos: ${texto.slice(0, 200)}`);
  return texto ? JSON.parse(texto) : null;
}

/**
 * Una tabla entera, por páginas.
 *
 * PostgREST corta las respuestas en `PGRST_DB_MAX_ROWS` sin avisar de nada: una
 * consulta con `limit=5000` devuelve mil filas y parece completa. Contar prendas
 * así empezaría a mentir a partir de la número mil, en silencio, que es la peor
 * forma de equivocarse. Se pide por rangos hasta que una página vuelve corta.
 */
export async function todas(recurso) {
  const filas = [];
  for (let desde = 0; ; desde += PAGINA) {
    const pagina = await rest(`${recurso}${recurso.includes("?") ? "&" : "?"}limit=${PAGINA}&offset=${desde}`);
    filas.push(...pagina);
    if (pagina.length < PAGINA) return filas;
    // Un tope de seguridad: cien páginas son cien mil filas, muy por encima de
    // lo que este panel tiene que enseñar de una vez.
    if (desde > PAGINA * 100) return filas;
  }
}

export async function almacen(ruta, { metodo = "POST", cuerpo } = {}) {
  const r = await fetch(`${url}/storage/v1${ruta}`, {
    method: metodo,
    headers: claveDeServicio(),
    ...(cuerpo ? { body: JSON.stringify(cuerpo) } : {}),
  });
  const texto = await r.text();
  if (!r.ok) throw new ErrorHttp(502, `Almacén: ${texto.slice(0, 200)}`);
  return texto ? JSON.parse(texto) : null;
}
