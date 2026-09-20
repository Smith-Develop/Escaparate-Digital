/**
 * Alta de cuenta sin confirmar el correo, solo para Escaparate.
 *
 * La confirmación por correo es un ajuste de **toda** la instancia de Supabase,
 * y esta la comparten varias aplicaciones: desactivarla para que Escaparate
 * registre al instante dejaría a las demás aceptando correos de cualquiera. Por
 * eso el alta de esta app pasa por aquí, donde se crea la cuenta ya confirmada
 * con la clave de servicio.
 *
 * Esa clave vive en el servidor y **nunca** viaja al navegador: ese es el
 * motivo entero de que esto sea una función y no unas líneas en la app.
 *
 * Contrato con la app:
 *   200 { ok: true }              → cuenta creada; la app entra acto seguido
 *   400 { error: "…" }            → datos mal escritos
 *   409 { error: "…" }            → ese correo ya tiene cuenta
 *   otros                          → la app vuelve al registro normal por correo
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (cuerpo: unknown, status = 200) =>
  new Response(JSON.stringify(cuerpo), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

const CORREO = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

Deno.serve(async (peticion) => {
  if (peticion.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (peticion.method !== "POST") return json({ error: "Método no permitido" }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const servicio =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SERVICE_ROLE_KEY");

  if (!url || !servicio) {
    // Sin la clave no hay nada que hacer. Se devuelve 500 a propósito: la app
    // lo interpreta como «la función no está lista» y vuelve al alta normal.
    console.error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en la función");
    return json({ error: "La función no está configurada" }, 500);
  }

  let cuerpo: { email?: string; password?: string; name?: string };
  try {
    cuerpo = await peticion.json();
  } catch {
    return json({ error: "Petición mal formada" }, 400);
  }

  const email = (cuerpo.email ?? "").trim().toLowerCase();
  const password = cuerpo.password ?? "";
  const name = (cuerpo.name ?? "").trim();

  // Las mismas comprobaciones que hace la app, repetidas aquí porque esto es
  // una puerta abierta a internet y lo de allí es solo ayuda al usuario.
  if (!CORREO.test(email)) return json({ error: "El correo no tiene un formato válido" }, 400);
  if (password.length < 8) return json({ error: "La contraseña necesita al menos 8 caracteres" }, 400);
  if (name.length < 2) return json({ error: "Escribe tu nombre" }, 400);
  if (name.length > 60) return json({ error: "El nombre es demasiado largo" }, 400);

  const respuesta = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: servicio,
      Authorization: `Bearer ${servicio}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      // Lo que da sentido a todo esto: la cuenta nace confirmada.
      email_confirm: true,
      // `app` es la marca que mira el disparador de la base para crear el
      // armario; sin ella, quien se registre aquí no tendría ni perfil ni
      // medidas, porque la instancia sirve a varias aplicaciones.
      user_metadata: { name, app: "escaparate" },
    }),
  });

  if (respuesta.ok) return json({ ok: true });

  const error = await respuesta.json().catch(() => ({}));
  const mensaje = String(error.msg ?? error.message ?? "");

  if (respuesta.status === 422 || /already been registered|already exists/i.test(mensaje)) {
    return json({ error: "Ya existe una cuenta con ese correo" }, 409);
  }
  if (respuesta.status === 400) {
    return json({ error: mensaje || "No se pudo crear la cuenta" }, 400);
  }

  console.error("Alta rechazada por GoTrue:", respuesta.status, mensaje);
  return json({ error: "No se pudo crear la cuenta" }, 502);
});
