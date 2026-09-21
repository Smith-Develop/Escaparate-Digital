/**
 * servicio-admin · el panel de Escaparate por detrás
 *
 *   node --env-file=.env.local servicio-admin/index.mjs
 *
 * Existe por una razón concreta: la app es un sitio estático y no tiene dónde
 * esconder la clave de servicio, que es la única forma de cambiarle el correo o
 * la contraseña a alguien. Así que la clave vive aquí, en un proceso propio con
 * su propio despliegue, y lo que se publica hacia fuera son nueve operaciones
 * cerradas —ninguna acepta SQL, ni tablas, ni rutas libres—, cada una detrás de
 * la misma comprobación: sesión válida de Supabase y correo en la lista blanca.
 *
 * Sin framework a propósito. Lo que hace falta de uno —encaminar nueve rutas,
 * leer un cuerpo JSON y contestar otro— son las sesenta líneas de abajo, y a
 * cambio el servicio que guarda la llave del armario no arrastra un árbol de
 * dependencias que haya que vigilar.
 */
import { createServer } from "node:http";
import {
  administrador,
  comprobarConfiguracion,
  dentroDelLimite,
  ErrorHttp,
} from "./sesion.mjs";
import {
  auditar,
  biblioteca,
  borrarFoto,
  cambiarCorreo,
  contrasenaTemporal,
  enviarRecuperacion,
  listarUsuarios,
  resumen,
  suspender,
  SUSPENSIONES,
  usuario,
} from "./datos.mjs";

comprobarConfiguracion();

const PUERTO = Number(process.env.PORT ?? 3000);
// En el contenedor tiene que escuchar en todas las interfaces para que el proxy
// llegue; en tu máquina, no: un servicio con la clave de servicio dentro no
// debería quedar a la escucha de toda la wifi del sitio donde estés.
const ANFITRION = process.env.HOST ?? (process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1");
const ORIGENES = (process.env.ORIGENES_PERMITIDOS ?? "")
  .split(",")
  .map((o) => o.trim().replace(/\/$/, ""))
  .filter(Boolean);

/* ── Utilidades de HTTP ────────────────────────────────────────────────── */

const ipDe = (peticion) =>
  // Detrás del proxy de Coolify, la IP real viene en la cabecera; la conexión
  // siempre es la del proxy.
  (peticion.headers["x-forwarded-for"] ?? "").split(",")[0].trim() ||
  peticion.socket.remoteAddress ||
  "desconocida";

/**
 * CORS cerrado: solo los orígenes de la lista, y comparados enteros.
 * Un comodín aquí convertiría cualquier página de internet en un panel.
 */
function cors(peticion, respuesta) {
  const origen = (peticion.headers.origin ?? "").replace(/\/$/, "");
  if (origen && ORIGENES.includes(origen)) {
    respuesta.setHeader("Access-Control-Allow-Origin", origen);
    respuesta.setHeader("Vary", "Origin");
    respuesta.setHeader("Access-Control-Allow-Headers", "authorization, content-type");
    respuesta.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    respuesta.setHeader("Access-Control-Max-Age", "600");
  }
}

function contestar(respuesta, codigo, datos) {
  const cuerpo = JSON.stringify(datos);
  respuesta.writeHead(codigo, {
    "Content-Type": "application/json; charset=utf-8",
    // Nada de esto puede quedarse en ninguna caché: son datos de otras
    // personas, y el navegador los tiene solo mientras la pantalla está
    // abierta.
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(cuerpo),
  });
  respuesta.end(cuerpo);
}

async function cuerpoJson(peticion) {
  const trozos = [];
  let bytes = 0;
  for await (const trozo of peticion) {
    bytes += trozo.length;
    if (bytes > 64 * 1024) throw new ErrorHttp(413, "El cuerpo es demasiado grande");
    trozos.push(trozo);
  }
  if (trozos.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(trozos).toString("utf8"));
  } catch {
    throw new ErrorHttp(400, "El cuerpo no es JSON válido");
  }
}

/* ── Las operaciones ───────────────────────────────────────────────────── */

const rutas = {
  "GET /admin/yo": async ({ quien }) => ({ admin: true, correo: quien.correo }),

  "GET /admin/resumen": async () => await resumen(),

  "GET /admin/usuarios": async ({ parametros }) => ({
    usuarios: await listarUsuarios(parametros.get("buscar") ?? ""),
  }),

  "GET /admin/usuario": async ({ parametros }) => {
    const id = parametros.get("id");
    if (!id) throw new ErrorHttp(400, "Falta el identificador");
    return await usuario(id);
  },

  "POST /admin/correo": async ({ cuerpo, quien, ip }) => {
    const { antes, ahora } = await cambiarCorreo(cuerpo.id, cuerpo.correo);
    await auditar({
      actor: quien.id,
      actorCorreo: quien.correo,
      accion: "correo",
      objetivo: cuerpo.id,
      objetivoCorreo: ahora,
      detalle: { antes, ahora },
      ip,
    });
    return { correo: ahora };
  },

  "POST /admin/contrasena": async ({ cuerpo, quien, ip }) => {
    if (cuerpo.modo === "correo") {
      const correo = await enviarRecuperacion(cuerpo.id);
      await auditar({
        actor: quien.id,
        actorCorreo: quien.correo,
        accion: "recuperacion",
        objetivo: cuerpo.id,
        objetivoCorreo: correo,
        ip,
      });
      return { enviado: correo };
    }

    const contrasena = await contrasenaTemporal(cuerpo.id);
    // La contraseña NO entra en la auditoría: queda constancia de que se puso
    // una, no de cuál.
    await auditar({
      actor: quien.id,
      actorCorreo: quien.correo,
      accion: "contrasena-temporal",
      objetivo: cuerpo.id,
      ip,
    });
    return { contrasena };
  },

  "POST /admin/suspension": async ({ cuerpo, quien, ip }) => {
    const hasta = await suspender(cuerpo.id, cuerpo.duracion);
    await auditar({
      actor: quien.id,
      actorCorreo: quien.correo,
      accion: hasta ? "suspension" : "suspension-levantada",
      objetivo: cuerpo.id,
      detalle: { duracion: cuerpo.duracion, hasta },
      ip,
    });
    return { suspendidoHasta: hasta };
  },

  "GET /admin/biblioteca": async ({ parametros }) =>
    await biblioteca({
      usuario: parametros.get("usuario") ?? "",
      soloHuerfanas: parametros.get("huerfanas") === "1",
    }),

  "DELETE /admin/foto": async ({ cuerpo, quien, ip }) => {
    await borrarFoto(cuerpo.ruta);
    await auditar({
      actor: quien.id,
      actorCorreo: quien.correo,
      accion: "foto-borrada",
      detalle: { ruta: cuerpo.ruta },
      ip,
    });
    return { borrada: cuerpo.ruta };
  },
};

/* ── El servidor ───────────────────────────────────────────────────────── */

const servidor = createServer(async (peticion, respuesta) => {
  const ip = ipDe(peticion);
  cors(peticion, respuesta);

  if (peticion.method === "OPTIONS") {
    respuesta.writeHead(204);
    respuesta.end();
    return;
  }

  const { pathname, searchParams } = new URL(peticion.url, "http://interno");

  // Para que Coolify sepa que el contenedor está vivo. Sin sesión, a propósito:
  // no dice nada de nadie.
  if (pathname === "/salud") {
    contestar(respuesta, 200, { ok: true, suspensiones: Object.keys(SUSPENSIONES) });
    return;
  }

  if (!dentroDelLimite(ip)) {
    contestar(respuesta, 429, { error: "Demasiadas peticiones. Espera un minuto." });
    return;
  }

  const clave = `${peticion.method} ${pathname.replace(/\/$/, "")}`;
  const manejador = rutas[clave];
  if (!manejador) {
    contestar(respuesta, 404, { error: "Aquí no hay nada" });
    return;
  }

  try {
    // `/admin/yo` es la única que admite un «no» como respuesta normal: es la
    // pregunta que hace la app para saber si enseña el panel.
    const quien = await administrador(peticion, ip, { soloMirar: clave === "GET /admin/yo" });
    const cuerpo = peticion.method === "GET" ? {} : await cuerpoJson(peticion);
    contestar(respuesta, 200, await manejador({ quien, cuerpo, parametros: searchParams, ip }));
  } catch (error) {
    const codigo = error instanceof ErrorHttp ? error.codigo : 500;
    if (codigo >= 500) console.error(`[${clave}] ${error.stack ?? error.message}`);
    if (clave === "GET /admin/yo" && (codigo === 401 || codigo === 403)) {
      // Sin drama: la app solo quiere saber si enseña la entrada al panel.
      contestar(respuesta, 200, { admin: false });
      return;
    }
    contestar(respuesta, codigo, { error: codigo >= 500 ? "Algo ha fallado" : error.message });
  }
});

servidor.listen(PUERTO, ANFITRION, () => {
  console.log(`servicio-admin escuchando en ${ANFITRION}:${PUERTO}`);
  console.log(`orígenes permitidos: ${ORIGENES.length ? ORIGENES.join(", ") : "NINGUNO (¡configura ORIGENES_PERMITIDOS!)"}`);
});
