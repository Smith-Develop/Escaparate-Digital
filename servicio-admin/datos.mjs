/**
 * Todo lo que hace falta la clave de servicio.
 *
 * Aquí y solo aquí. Cada función es una operación concreta y acotada: no hay
 * ninguna que acepte una consulta, una tabla o una ruta que venga de fuera, que
 * es la diferencia entre un panel y un túnel hacia la base de datos.
 *
 * Se habla con Supabase por HTTP, sin su biblioteca. No es purismo: el cliente
 * arrastra el módulo de tiempo real —con su WebSocket y su exigencia de Node 22
 * en adelante— para un servicio que solo hace peticiones REST. Este proceso es
 * el que guarda la llave de toda la instancia, y cuantas menos dependencias
 * tenga que vigilar, mejor. Son tres funciones de ayuda y ya está.
 *
 * La instancia es pequeña —decenas de usuarios, cientos de prendas—, así que
 * varias cuentas se resuelven trayendo una columna de toda la tabla y agrupando
 * en memoria en vez de lanzar una consulta por usuario. Está anotado dónde, por
 * si algún día deja de ser pequeña.
 */
import { randomInt } from "node:crypto";
import { ErrorHttp } from "./sesion.mjs";
import { almacen, APP, BUCKET, gotrue, rest, SITIO, todas, url } from "./supabase.mjs";
import { correoDeRecuperacion } from "./correo.mjs";

/** Las URL firmadas viven lo que dura mirar una pantalla, no más. */
const FIRMA_SEGUNDOS = 600;

/* ── Usuarios ──────────────────────────────────────────────────────────── */

/**
 * Los usuarios de Escaparate.
 *
 * `auth.users` es de toda la instancia, así que se filtra por la marca que deja
 * el registro: sin eso, aquí saldrían también las cuentas de tu otra
 * aplicación, que no tenemos por qué tocar.
 */
async function usuariosDeGoTrue() {
  const usuarios = [];
  for (let pagina = 1; pagina <= 20; pagina++) {
    const r = await gotrue(`/admin/users?page=${pagina}&per_page=200`);
    if (!r.ok) throw new ErrorHttp(502, `No se pudo listar usuarios (HTTP ${r.status})`);
    const { users = [] } = await r.json();
    usuarios.push(...users.filter((u) => (u.user_metadata?.app ?? "") === APP));
    if (users.length < 200) break;
  }
  return usuarios;
}

const aFicha = (u, perfil, cuentas) => ({
  id: u.id,
  correo: u.email ?? "",
  nombre: perfil?.name ?? u.user_metadata?.name ?? "Sin nombre",
  alta: u.created_at,
  ultimoAcceso: u.last_sign_in_at ?? null,
  confirmado: Boolean(u.email_confirmed_at),
  // GoTrue guarda la suspensión como una fecha futura.
  suspendidoHasta:
    u.banned_until && new Date(u.banned_until) > new Date() ? u.banned_until : null,
  prendas: cuentas?.prendas ?? 0,
  looks: cuentas?.looks ?? 0,
});

/** Cuántas prendas y looks tiene cada cual, en dos consultas y no en 2×N. */
async function cuentasPorUsuario() {
  const cuentas = new Map();
  const suma = (uid, campo) => {
    const previo = cuentas.get(uid) ?? { prendas: 0, looks: 0 };
    previo[campo] += 1;
    cuentas.set(uid, previo);
  };

  const prendas = await todas("Item?select=userId");
  for (const { userId } of prendas) suma(userId, "prendas");
  const looks = await todas("Look?select=userId");
  for (const { userId } of looks) suma(userId, "looks");
  return cuentas;
}

async function perfilesPorId() {
  const perfiles = await todas("profiles?select=id,name,createdAt");
  return new Map(perfiles.map((p) => [p.id, p]));
}

export async function listarUsuarios(buscar = "") {
  const [usuarios, perfiles, cuentas] = await Promise.all([
    usuariosDeGoTrue(),
    perfilesPorId(),
    cuentasPorUsuario(),
  ]);

  const texto = buscar.trim().toLowerCase();
  return usuarios
    .map((u) => aFicha(u, perfiles.get(u.id), cuentas.get(u.id)))
    .filter(
      (f) =>
        !texto || f.correo.toLowerCase().includes(texto) || f.nombre.toLowerCase().includes(texto),
    )
    .sort((a, b) => (a.alta < b.alta ? 1 : -1));
}

/* ── Resumen ───────────────────────────────────────────────────────────── */

export async function resumen() {
  const [usuarios, perfiles, cuentas, fotos] = await Promise.all([
    usuariosDeGoTrue(),
    perfilesPorId(),
    cuentasPorUsuario(),
    inventarioDeFotos(),
  ]);

  const fichas = usuarios.map((u) => aFicha(u, perfiles.get(u.id), cuentas.get(u.id)));
  const total = (campo) => fichas.reduce((suma, f) => suma + f[campo], 0);

  return {
    usuarios: fichas.length,
    suspendidos: fichas.filter((f) => f.suspendidoHasta).length,
    sinConfirmar: fichas.filter((f) => !f.confirmado).length,
    prendas: total("prendas"),
    looks: total("looks"),
    fotos: fotos.length,
    huerfanas: fotos.filter((f) => f.huerfana).length,
    bytes: fotos.reduce((suma, f) => suma + f.bytes, 0),
    // Las últimas altas, que es lo que se mira al abrir el panel.
    ultimas: [...fichas].sort((a, b) => (a.alta < b.alta ? 1 : -1)).slice(0, 5),
  };
}

/* ── Una cuenta ────────────────────────────────────────────────────────── */

async function usuarioDeGoTrue(id) {
  if (!/^[0-9a-f-]{36}$/i.test(String(id ?? ""))) {
    throw new ErrorHttp(400, "Ese no es un identificador de cuenta");
  }
  const r = await gotrue(`/admin/users/${id}`);
  if (r.status === 404) throw new ErrorHttp(404, "Esa cuenta no existe");
  if (!r.ok) throw new ErrorHttp(502, `No se pudo leer la cuenta (HTTP ${r.status})`);
  const u = await r.json();
  if ((u.user_metadata?.app ?? "") !== APP) {
    // Cuentas de otra aplicación de la instancia: este panel no las administra.
    throw new ErrorHttp(404, "Esa cuenta no es de Escaparate");
  }
  return u;
}

export async function usuario(id) {
  const u = await usuarioDeGoTrue(id);

  const [perfiles, prendas, looks, avatares] = await Promise.all([
    rest(`profiles?select=id,name,createdAt&id=eq.${id}`),
    todas(`Item?select=*&userId=eq.${id}&order=createdAt.desc`),
    todas(
      `Look?select=id,name,occasion,scheduledAt,createdAt,LookItem(itemId)&userId=eq.${id}&order=createdAt.desc`,
    ),
    rest(`Avatar?select=photoUrl,heightCm,weightKg,figure,updatedAt&userId=eq.${id}`),
  ]);

  // Las fotos viajan ya firmadas: el panel no tiene forma de leer el almacén
  // por su cuenta, y así tampoco acaban en el espejo local del navegador.
  const avatar = avatares[0] ?? null;
  const firmadas = await firmar([
    ...prendas.map((p) => p.imageUrl),
    ...(avatar?.photoUrl ? [avatar.photoUrl] : []),
  ]);

  return {
    ficha: aFicha(u, perfiles[0], { prendas: prendas.length, looks: looks.length }),
    avatar: avatar ? { ...avatar, photoUrl: firmadas[avatar.photoUrl] ?? null } : null,
    prendas: prendas.map((p) => ({ ...p, imageUrl: firmadas[p.imageUrl] ?? null })),
    looks: looks.map((l) => ({
      id: l.id,
      name: l.name,
      occasion: l.occasion,
      scheduledAt: l.scheduledAt,
      createdAt: l.createdAt,
      prendas: (l.LookItem ?? []).length,
    })),
  };
}

/* ── Credenciales ──────────────────────────────────────────────────────── */

export async function cambiarCorreo(id, correo) {
  const limpio = String(correo ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(limpio)) {
    throw new ErrorHttp(400, "Ese correo no tiene un formato válido");
  }

  const antes = await usuarioDeGoTrue(id);
  // `email_confirm` lo deja confirmado de una vez: si no, la cuenta se queda
  // esperando un correo que el usuario no ha pedido y no entiende.
  const r = await gotrue(`/admin/users/${id}`, {
    method: "PUT",
    body: JSON.stringify({ email: limpio, email_confirm: true }),
  });
  if (!r.ok) {
    const texto = await r.text();
    const repetido = /already|duplicate|exists/i.test(texto);
    throw new ErrorHttp(
      repetido ? 409 : 502,
      repetido ? "Ya hay una cuenta con ese correo" : `No se pudo cambiar el correo (HTTP ${r.status})`,
    );
  }
  return { antes: antes.email ?? "", ahora: limpio };
}

/**
 * Una contraseña que se pueda dictar por teléfono.
 *
 * Sin caracteres que se confundan al leerlos en voz alta o copiarlos a mano
 * —cero y o, uno y ele, ese y cinco—, y en grupos de cuatro, que es como la
 * gente los transcribe sin equivocarse.
 */
function contrasenaLegible() {
  const alfabeto = "abcdefghijkmnpqrstuvwxyz23456789";
  const grupo = () => Array.from({ length: 4 }, () => alfabeto[randomInt(alfabeto.length)]).join("");
  return `${grupo()}-${grupo()}-${grupo()}`;
}

export async function contrasenaTemporal(id) {
  await usuarioDeGoTrue(id);
  const contrasena = contrasenaLegible();
  const r = await gotrue(`/admin/users/${id}`, {
    method: "PUT",
    body: JSON.stringify({ password: contrasena }),
  });
  if (!r.ok) throw new ErrorHttp(502, `No se pudo poner la contraseña (HTTP ${r.status})`);
  // Se devuelve para enseñarla una vez. No se guarda en ningún sitio, tampoco
  // en la auditoría.
  return contrasena;
}

/**
 * El enlace que lleva a elegir contraseña nueva.
 *
 * Se le pide a GoTrue el testigo y **la dirección se compone aquí**. El
 * `action_link` que devuelve viene con la dirección interna de Docker
 * (`http://supabase-kong:8000`), que no abre en ningún móvil; con el testigo en
 * la mano, montar la URL buena es una línea y deja de depender de cómo esté
 * configurada la instancia.
 */
async function enlaceDeRecuperacion(correo) {
  const r = await gotrue("/admin/generate_link", {
    method: "POST",
    body: JSON.stringify({
      type: "recovery",
      email: correo,
      ...(SITIO ? { options: { redirect_to: `${SITIO}/recuperar/` } } : {}),
    }),
  });
  if (!r.ok) throw new ErrorHttp(502, `No se pudo preparar el enlace (HTTP ${r.status})`);

  const { hashed_token: testigo } = await r.json();
  if (!testigo) throw new ErrorHttp(502, "GoTrue no devolvió ningún testigo");

  const destino = encodeURIComponent(`${SITIO}/recuperar/`);
  return `${url}/auth/v1/verify?token=${testigo}&type=recovery&redirect_to=${destino}`;
}

/** Lo que dispara el administrador desde la ficha de una cuenta. */
export async function enviarRecuperacion(id) {
  const u = await usuarioDeGoTrue(id);
  if (!u.email) throw new ErrorHttp(400, "Esa cuenta no tiene correo");
  await correoDeRecuperacion(u.email, await enlaceDeRecuperacion(u.email));
  return u.email;
}

/**
 * Lo que pide el propio usuario desde «He olvidado mi contraseña».
 *
 * Nunca dice si la cuenta existe: contesta igual encuentre o no encuentre, que
 * es lo que evita convertir esta ruta en una forma de averiguar quién tiene
 * cuenta. Tampoco toca las cuentas de la otra aplicación de la instancia.
 */
export async function recuperacionPedidaPor(correo) {
  const limpio = String(correo ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(limpio)) {
    throw new ErrorHttp(400, "Ese correo no tiene un formato válido");
  }

  const usuarios = await usuariosDeGoTrue();
  const suyo = usuarios.find((u) => (u.email ?? "").toLowerCase() === limpio);
  if (!suyo) return { encontrado: false };

  await correoDeRecuperacion(limpio, await enlaceDeRecuperacion(limpio));
  return { encontrado: true };
}

/** Duraciones que ofrece el panel. GoTrue las quiere en horas. */
export const SUSPENSIONES = {
  "24h": "24h",
  "7d": "168h",
  "30d": "720h",
  ninguna: "none",
};

export async function suspender(id, clave) {
  const duracion = SUSPENSIONES[clave];
  if (!duracion) throw new ErrorHttp(400, "Duración desconocida");

  await usuarioDeGoTrue(id);
  const r = await gotrue(`/admin/users/${id}`, {
    method: "PUT",
    body: JSON.stringify({ ban_duration: duracion }),
  });
  if (!r.ok) throw new ErrorHttp(502, `No se pudo cambiar la suspensión (HTTP ${r.status})`);

  const u = await r.json();
  return u.banned_until && new Date(u.banned_until) > new Date() ? u.banned_until : null;
}

/* ── Fotos ─────────────────────────────────────────────────────────────── */

/**
 * URL firmadas en bloque.
 *
 * El almacén devuelve la parte final de la dirección; se completa aquí. Duran
 * diez minutos: lo justo para mirar una pantalla, no para que un enlace copiado
 * ande suelto por ahí.
 */
async function firmar(rutas) {
  const limpias = [...new Set(rutas.filter(Boolean))];
  if (limpias.length === 0) return {};
  const firmas = await almacen(`/object/sign/${BUCKET}`, {
    cuerpo: { paths: limpias, expiresIn: FIRMA_SEGUNDOS },
  });
  return Object.fromEntries(
    (firmas ?? [])
      .filter((f) => f.signedURL)
      .map((f) => [f.path, `${url}/storage/v1${f.signedURL}`]),
  );
}

/** Rutas que están en uso: las de las prendas y las de las fotos de cuerpo. */
async function rutasEnUso() {
  const [prendas, avatares] = await Promise.all([
    todas("Item?select=imageUrl,originalUrl,name"),
    todas("Avatar?select=photoUrl"),
  ]);

  const uso = new Map();
  for (const p of prendas) {
    if (p.imageUrl) uso.set(p.imageUrl, p.name);
    if (p.originalUrl) uso.set(p.originalUrl, `${p.name} (original)`);
  }
  for (const a of avatares) if (a.photoUrl) uso.set(a.photoUrl, "Foto de cuerpo entero");
  return uso;
}

const listar = (prefijo) =>
  almacen(`/object/list/${BUCKET}`, {
    cuerpo: {
      prefix: prefijo,
      limit: 1000,
      offset: 0,
      sortBy: { column: "created_at", order: "desc" },
    },
  });

/**
 * Todo lo que hay en el almacén, carpeta por carpeta.
 *
 * El listado es por carpeta y las carpetas son los usuarios. Una carpeta que no
 * corresponda a ninguna cuenta —una borrada a mano, por ejemplo— sale
 * igualmente y con sus fotos marcadas como huérfanas: es justo lo que hay que
 * poder ver aquí.
 */
async function inventarioDeFotos() {
  const uso = await rutasEnUso();
  const carpetas = await listar("");

  const fotos = [];
  for (const carpeta of carpetas ?? []) {
    // Las entradas sin `id` son carpetas; las que lo tienen son ficheros
    // sueltos en la raíz, que no deberían existir.
    if (carpeta.id) continue;
    const ficheros = await listar(carpeta.name);
    for (const f of ficheros ?? []) {
      const ruta = `${carpeta.name}/${f.name}`;
      fotos.push({
        ruta,
        usuario: carpeta.name,
        bytes: f.metadata?.size ?? 0,
        tipo: f.metadata?.mimetype ?? "",
        creada: f.created_at ?? null,
        usadaPor: uso.get(ruta) ?? null,
        huerfana: !uso.has(ruta),
      });
    }
  }
  return fotos;
}

/** Una foto recién subida todavía no tiene prenda: no cuenta como huérfana. */
const RECIENTE_MS = 24 * 60 * 60 * 1000;
const esReciente = (creada) =>
  Boolean(creada) && Date.now() - new Date(creada).getTime() < RECIENTE_MS;

export async function biblioteca({ usuario: deQuien = "", soloHuerfanas = false } = {}) {
  const [fotos, usuarios, perfiles] = await Promise.all([
    inventarioDeFotos(),
    usuariosDeGoTrue(),
    perfilesPorId(),
  ]);

  const nombres = new Map(
    usuarios.map((u) => [u.id, perfiles.get(u.id)?.name ?? u.email ?? "Sin nombre"]),
  );

  const lista = fotos
    .map((f) => ({
      ...f,
      // Se puede borrar solo lo que no usa nadie y ya no puede estar subiéndose.
      borrable: f.huerfana && !esReciente(f.creada),
      nombreDelUsuario: nombres.get(f.usuario) ?? "Cuenta desconocida",
    }))
    .filter((f) => (!deQuien || f.usuario === deQuien) && (!soloHuerfanas || f.huerfana));

  const firmadas = await firmar(lista.map((f) => f.ruta));
  return {
    fotos: lista.map((f) => ({ ...f, url: firmadas[f.ruta] ?? null })),
    usuarios: [...nombres].map(([id, nombre]) => ({ id, nombre })),
  };
}

export async function borrarFoto(ruta) {
  if (typeof ruta !== "string" || !/^[0-9a-f-]{36}\/[\w.-]+$/i.test(ruta)) {
    throw new ErrorHttp(400, "Esa no es una ruta del almacén");
  }

  // Se vuelve a mirar justo antes de borrar: entre que se pintó la pantalla y
  // se pulsó el botón, esa foto puede haberse convertido en una prenda.
  const uso = await rutasEnUso();
  if (uso.has(ruta)) throw new ErrorHttp(409, `Esa foto está en uso: ${uso.get(ruta)}`);

  await almacen(`/object/${BUCKET}`, { metodo: "DELETE", cuerpo: { prefixes: [ruta] } });
}

/* ── Auditoría ─────────────────────────────────────────────────────────── */

/**
 * Deja constancia. Nunca falla hacia fuera: que no se pueda escribir el rastro
 * no debe deshacer una operación que ya ha ocurrido, pero sí tiene que verse en
 * el registro del servicio.
 */
export async function auditar({ actor, actorCorreo, accion, objetivo, objetivoCorreo, detalle, ip }) {
  try {
    await rest("admin_auditoria", {
      metodo: "POST",
      cabeceras: { Prefer: "return=minimal" },
      cuerpo: {
        actor,
        actorCorreo,
        accion,
        objetivo: objetivo ?? null,
        objetivoCorreo: objetivoCorreo ?? null,
        detalle: detalle ?? {},
        ip: ip ?? null,
      },
    });
  } catch (error) {
    console.error(`[auditoría] no se pudo escribir «${accion}»: ${error.message}`);
  }
}
