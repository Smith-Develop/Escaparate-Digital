/**
 * El correo de Escaparate.
 *
 * Lo manda este servicio con el SMTP que hay guardado en los ajustes, no
 * GoTrue. La razón es práctica: el SMTP de GoTrue vive en las variables de
 * Coolify, así que cambiar de proveedor de correo obligaba a editar variables y
 * redesplegar la instancia entera —compartida con otra aplicación— para algo
 * que debería ser rellenar un formulario. Desde aquí, el cambio es inmediato.
 *
 * De paso arregla un fallo de la instalación: GoTrue escribe los enlaces de sus
 * correos con la dirección interna de Docker (`http://supabase-kong:8000`), que
 * no abre en ningún móvil. Como el enlace lo componemos nosotros, sale con el
 * dominio público y punto.
 *
 * `nodemailer` es la única dependencia del servicio: un paquete sin
 * dependencias propias. Hablar SMTP a mano —saludo, STARTTLS, autenticación,
 * MIME, codificaciones— son doscientas líneas delicadas para resolver un
 * problema que ya está resuelto.
 */
import nodemailer from "nodemailer";
import { ErrorHttp } from "./sesion.mjs";
import { leerCorreo } from "./ajustes.mjs";

async function transporte() {
  const c = await leerCorreo();
  if (!c.host || !c.remitente) {
    throw new ErrorHttp(
      409,
      "Falta configurar el correo. Ponlo en el panel, en Ajustes → Correo.",
    );
  }
  return {
    transporte: nodemailer.createTransport({
      host: c.host,
      port: c.puerto,
      secure: c.seguro,
      ...(c.usuario ? { auth: { user: c.usuario, pass: c.contrasena } } : {}),
      // Si el servidor no contesta en diez segundos, contesta el panel: más
      // vale un error claro que una pantalla pensando durante un minuto.
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    }),
    de: `"${c.nombre}" <${c.remitente}>`,
  };
}

/** Traduce los fallos de SMTP a algo que se pueda leer sin ser administrador de sistemas. */
function traducir(error) {
  const m = `${error?.code ?? ""} ${error?.message ?? ""}`.toLowerCase();
  if (m.includes("eauth") || m.includes("authentication")) {
    return "El servidor rechazó el usuario o la contraseña";
  }
  if (m.includes("econnrefused")) return "El servidor no acepta conexiones en ese puerto";
  if (m.includes("etimedout") || m.includes("timeout")) return "El servidor no contesta";
  if (m.includes("enotfound") || m.includes("edns")) return "Ese servidor no existe";
  if (m.includes("self-signed") || m.includes("certificate")) {
    return "El certificado del servidor no es válido";
  }
  if (m.includes("from") && m.includes("reject")) {
    return "El servidor no acepta ese remitente. Suele pasar si el dominio no está verificado.";
  }
  return error?.message ? `El envío falló: ${error.message}` : "El envío falló";
}

export async function enviar({ para, asunto, texto, html }) {
  const { transporte: t, de } = await transporte();
  try {
    await t.sendMail({ from: de, to: para, subject: asunto, text: texto, html });
  } catch (error) {
    throw new ErrorHttp(502, traducir(error));
  }
}

/* ── La plantilla ──────────────────────────────────────────────────────── */

/**
 * Un correo en el tono de la app: sin imágenes, sin colores de marca a tope y
 * con el enlace también escrito en claro. Los clientes de correo destrozan
 * cualquier maquetación complicada, y muchos bloquean las imágenes; lo único
 * que tiene que funcionar seguro es el botón.
 */
const plantilla = (titulo, parrafo, etiqueta, enlace, pie) => `
<!doctype html>
<html lang="es"><body style="margin:0;padding:24px;background:#faf6ef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1e1d1a">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:24px;padding:32px">
    <p style="margin:0 0 24px;font-size:11px;letter-spacing:.3em;color:#8a857b">E S C A P A R A T E</p>
    <h1 style="margin:0 0 16px;font-size:24px;line-height:1.2">${titulo}</h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#736f66">${parrafo}</p>
    <a href="${enlace}" style="display:inline-block;background:#f2b25c;color:#2a1f10;text-decoration:none;font-weight:600;font-size:14px;padding:14px 24px;border-radius:999px">${etiqueta}</a>
    <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#8a857b">${pie}</p>
    <p style="margin:12px 0 0;font-size:12px;line-height:1.6;color:#8a857b;word-break:break-all">${enlace}</p>
  </div>
</body></html>`;

export async function correoDeRecuperacion(para, enlace) {
  await enviar({
    para,
    asunto: "Cambiar tu contraseña de Escaparate",
    texto:
      `Has pedido cambiar la contraseña de tu armario.\n\n` +
      `Abre este enlace para elegir una nueva:\n${enlace}\n\n` +
      `Si no has sido tú, no hace falta que hagas nada: tu contraseña sigue siendo la de siempre.`,
    html: plantilla(
      "Cambiar tu contraseña",
      "Has pedido cambiar la contraseña de tu armario. Pulsa el botón y elige una nueva.",
      "Elegir contraseña nueva",
      enlace,
      "Si no has sido tú, no hace falta que hagas nada: tu contraseña sigue siendo la de siempre. El enlace caduca en una hora.",
    ),
  });
}

export async function correoDePrueba(para, quien) {
  const c = await leerCorreo();
  await enviar({
    para,
    asunto: "Prueba de correo de Escaparate",
    texto:
      `Si lees esto, el correo de Escaparate está bien configurado.\n\n` +
      `Servidor: ${c.host}:${c.puerto}\nRemitente: ${c.remitente}\nLo ha pedido: ${quien}`,
    html: plantilla(
      "El correo funciona",
      `Si lees esto, el envío está bien configurado.<br>Servidor <strong>${c.host}:${c.puerto}</strong>, remitente <strong>${c.remitente}</strong>.`,
      "Abrir Escaparate",
      process.env.SITIO_URL ?? process.env.NEXT_PUBLIC_SITIO_URL ?? "#",
      `Esta prueba la ha pedido ${quien} desde el panel de administración.`,
    ),
  });
}
