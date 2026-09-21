/**
 * Quién llama, y si tiene derecho a estar aquí.
 *
 * Este fichero es la única puerta del servicio. Todo lo que hay detrás usa la
 * clave de servicio, que se salta la seguridad por filas de la instancia
 * entera, así que la comprobación no puede tener ni un resquicio:
 *
 *   1. El testigo se verifica **contra GoTrue**, no se decodifica aquí. Leer el
 *      JWT por nuestra cuenta significaría o guardar el `JWT_SECRET` —un
 *      secreto más que proteger— o, peor, fiarse de la carga sin comprobar la
 *      firma, que es como no comprobar nada.
 *   2. El correo tiene que estar en la lista blanca y estar confirmado.
 *   3. Los fallos se cuentan por IP y se contesta despacio: sin eso, la lista
 *      blanca se puede sondear a base de intentos.
 */

// En Coolify van con sus nombres propios; en tu máquina se reaprovecha el
// `.env.local` de la app, que ya tiene la URL y la clave pública con el prefijo
// de Next. Son el mismo valor: no tiene sentido pedir que se escriba dos veces.
const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Correos que pueden administrar. Sin lista, el servicio no arranca. */
const ADMINS = (process.env.ADMIN_CORREOS ?? "")
  .split(",")
  .map((c) => c.trim().toLowerCase())
  .filter(Boolean);

export function comprobarConfiguracion() {
  const faltan = [
    ["SUPABASE_URL", url],
    ["SUPABASE_ANON_KEY", anon],
    ["SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY],
  ]
    .filter(([, valor]) => !valor)
    .map(([nombre]) => nombre);

  if (ADMINS.length === 0) faltan.push("ADMIN_CORREOS");
  if (faltan.length > 0) {
    throw new Error(
      `Faltan variables de entorno: ${faltan.join(", ")}. ` +
        "Mira servicio-admin/LEEME.md; sin ellas esto no puede arrancar.",
    );
  }
}

/** Error con el código HTTP que le corresponde, para no inventarlos abajo. */
export class ErrorHttp extends Error {
  constructor(codigo, mensaje) {
    super(mensaje);
    this.codigo = codigo;
  }
}

/* ── Fallos por IP ─────────────────────────────────────────────────────────
 * Memoria del proceso, no base de datos: con un contenedor y un puñado de
 * administradores, persistir esto sería ceremonia sin beneficio. Reiniciar el
 * servicio limpia el contador, y reiniciarlo no está al alcance de quien
 * sondea desde fuera. */
const fallos = new Map();
const CASTIGO_MAXIMO = 8000;

function castigo(ip) {
  const cuenta = fallos.get(ip)?.cuenta ?? 0;
  return Math.min(cuenta * 400, CASTIGO_MAXIMO);
}

function apuntarFallo(ip) {
  const previo = fallos.get(ip)?.cuenta ?? 0;
  fallos.set(ip, { cuenta: previo + 1, visto: Date.now() });
}

function olvidarFallos(ip) {
  fallos.delete(ip);
}

/** Limpia lo viejo cada cierto tiempo para que el mapa no crezca sin fin. */
setInterval(
  () => {
    const hace = Date.now() - 60 * 60 * 1000;
    for (const [ip, dato] of fallos) if (dato.visto < hace) fallos.delete(ip);
  },
  10 * 60 * 1000,
).unref();

/* ── Límite de peticiones ───────────────────────────────────────────────── */

const ventanas = new Map();
const POR_MINUTO = 90;

export function dentroDelLimite(ip) {
  const ahora = Date.now();
  const ventana = ventanas.get(ip);
  if (!ventana || ahora - ventana.desde > 60_000) {
    ventanas.set(ip, { desde: ahora, cuenta: 1 });
    return true;
  }
  ventana.cuenta += 1;
  return ventana.cuenta <= POR_MINUTO;
}

/* ── La comprobación ───────────────────────────────────────────────────── */

const esperar = (ms) => new Promise((listo) => setTimeout(listo, ms));

/**
 * Devuelve el administrador que hay detrás del testigo, o lanza.
 *
 * `soloMirar` lo usa `/admin/yo`: ahí que alguien no sea administrador es una
 * respuesta legítima («no lo eres») y no un intento de colarse, así que no
 * cuenta como fallo ni se castiga.
 */
export async function administrador(peticion, ip, { soloMirar = false } = {}) {
  const cabecera = peticion.headers.authorization ?? "";
  const testigo = cabecera.startsWith("Bearer ") ? cabecera.slice(7).trim() : "";
  if (!testigo) {
    if (!soloMirar) apuntarFallo(ip);
    throw new ErrorHttp(401, "Hace falta iniciar sesión");
  }

  await esperar(castigo(ip));

  const respuesta = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: anon, Authorization: `Bearer ${testigo}` },
  });

  if (!respuesta.ok) {
    if (!soloMirar) apuntarFallo(ip);
    throw new ErrorHttp(401, "La sesión no vale o ha caducado");
  }

  const usuario = await respuesta.json();
  const correo = (usuario.email ?? "").toLowerCase();
  const esAdmin = Boolean(correo) && ADMINS.includes(correo) && Boolean(usuario.email_confirmed_at);

  if (!esAdmin) {
    if (!soloMirar) apuntarFallo(ip);
    // El mismo mensaje tanto si el correo no está en la lista como si está sin
    // confirmar: distinguirlos le diría a quien prueba cuál de las dos cosas
    // ha acertado.
    throw new ErrorHttp(403, "Esta cuenta no administra Escaparate");
  }

  olvidarFallos(ip);
  return { id: usuario.id, correo };
}
