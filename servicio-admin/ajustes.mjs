/**
 * Los ajustes que se cambian desde el panel, sin redesplegar nada.
 *
 * Dos tablas y una diferencia que importa: `ajustes` lo lee la app con la clave
 * pública —ahí solo puede haber cosas que ya se van a enseñar en pantalla— y
 * `ajustes_privados` no lo lee nadie más que este servicio, que es donde viven
 * las credenciales del correo.
 *
 * La contraseña del SMTP **nunca sale de aquí**: al panel se le dice si hay una
 * guardada, no cuál es. Y al guardar, si llega vacía, se conserva la que había;
 * de otro modo, cambiar el puerto obligaría a volver a escribir la contraseña,
 * que es justo la manera de que alguien acabe apuntándola en un papel.
 */
import { ErrorHttp } from "./sesion.mjs";
import { rest } from "./supabase.mjs";

const APOYO = {
  activo: false,
  titulo: "Apoyar Escaparate",
  texto: "",
  boton: "Invitar a un café",
  enlace: "",
};

const CORREO = {
  host: "",
  puerto: 587,
  seguro: false,
  usuario: "",
  contrasena: "",
  remitente: "",
  nombre: "Escaparate",
};

/* ── Lectura ───────────────────────────────────────────────────────────── */

async function leer(tabla, clave, porDefecto) {
  const filas = await rest(`${tabla}?select=valor&clave=eq.${clave}`);
  return { ...porDefecto, ...(filas[0]?.valor ?? {}) };
}

async function guardar(tabla, clave, valor) {
  await rest(`${tabla}?on_conflict=clave`, {
    metodo: "POST",
    cabeceras: { Prefer: "resolution=merge-duplicates,return=minimal" },
    cuerpo: { clave, valor },
  });
}

export const leerApoyo = () => leer("ajustes", "apoyo", APOYO);

/**
 * La configuración del correo.
 *
 * Con una caché corta: cada recuperación de contraseña la necesita, y no tiene
 * sentido ir a la base por lo mismo en ráfagas. Treinta segundos es poco para
 * notarlo al cambiar de proveedor y suficiente para no repetir la consulta.
 */
let cache = null;

export async function leerCorreo({ frescos = false } = {}) {
  if (!frescos && cache && Date.now() < cache.hasta) return cache.valor;
  const valor = await leer("ajustes_privados", "correo", CORREO);
  cache = { valor, hasta: Date.now() + 30_000 };
  return valor;
}

/** Lo que se le enseña al panel: todo menos la contraseña. */
export const correoSinSecreto = (c) => ({
  host: c.host,
  puerto: c.puerto,
  seguro: c.seguro,
  usuario: c.usuario,
  remitente: c.remitente,
  nombre: c.nombre,
  hayContrasena: Boolean(c.contrasena),
  configurado: Boolean(c.host && c.remitente),
});

/* ── Escritura ─────────────────────────────────────────────────────────── */

const texto = (valor, tope, campo) => {
  const limpio = String(valor ?? "").trim();
  if (limpio.length > tope) throw new ErrorHttp(400, `«${campo}» no puede pasar de ${tope} caracteres`);
  return limpio;
};

export async function guardarApoyo(datos) {
  const enlace = texto(datos.enlace, 300, "Enlace");
  // Solo http(s): este enlace lo pinta la app como un botón, y un `javascript:`
  // ahí dentro sería un agujero abierto de par en par.
  if (enlace && !/^https?:\/\//i.test(enlace)) {
    throw new ErrorHttp(400, "El enlace tiene que empezar por https://");
  }
  const activo = Boolean(datos.activo);
  if (activo && !enlace) {
    throw new ErrorHttp(400, "Para encender el bloque hace falta un enlace a donde mandar a la gente");
  }

  const valor = {
    activo,
    titulo: texto(datos.titulo, 60, "Título") || APOYO.titulo,
    texto: texto(datos.texto, 400, "Texto"),
    boton: texto(datos.boton, 30, "Botón") || APOYO.boton,
    enlace,
  };
  await guardar("ajustes", "apoyo", valor);
  return valor;
}

export async function guardarCorreo(datos) {
  const previo = await leerCorreo({ frescos: true });

  const puerto = Number(datos.puerto ?? previo.puerto);
  if (!Number.isInteger(puerto) || puerto < 1 || puerto > 65535) {
    throw new ErrorHttp(400, "El puerto no es válido");
  }

  const remitente = texto(datos.remitente, 120, "Remitente").toLowerCase();
  if (remitente && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(remitente)) {
    throw new ErrorHttp(400, "El correo del remitente no tiene un formato válido");
  }

  const valor = {
    host: texto(datos.host, 200, "Servidor"),
    puerto,
    // 465 es el puerto de TLS directo; 587 y 25 usan STARTTLS. Se deja decidir
    // a mano porque hay proveedores que no siguen la costumbre.
    seguro: datos.seguro === undefined ? puerto === 465 : Boolean(datos.seguro),
    usuario: texto(datos.usuario, 200, "Usuario"),
    // Vacía = se conserva la que había. Y si se borra el usuario, se va con él:
    // sin usuario no hay autenticación, así que guardar la contraseña sería
    // dejar un secreto ahí tirado sin que nadie lo use.
    contrasena: texto(datos.usuario, 200, "Usuario")
      ? datos.contrasena
        ? String(datos.contrasena)
        : previo.contrasena
      : "",
    remitente,
    nombre: texto(datos.nombre, 60, "Nombre del remitente") || CORREO.nombre,
  };

  await guardar("ajustes_privados", "correo", valor);
  cache = { valor, hasta: Date.now() + 30_000 };
  return correoSinSecreto(valor);
}

/** Olvida lo guardado en memoria; lo usa la prueba de envío. */
export const olvidarCorreo = () => {
  cache = null;
};
