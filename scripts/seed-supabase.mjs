/**
 * Armario de ejemplo en Supabase.
 *
 *   node --env-file=.env.local scripts/seed-supabase.mjs
 *
 * Crea la cuenta demo@escaparate.app / escaparate con catorce prendas, cuatro
 * etiquetas propias y dos looks. Cada ejecución parte de cero: borra la cuenta
 * anterior y sus fotos.
 *
 * Usa la clave de servicio, que se salta la seguridad por filas; por eso solo
 * se ejecuta desde tu máquina y nunca desde la app.
 */
import { createClient } from "@supabase/supabase-js";
import { createCanvas } from "./png.mjs";
import { ETIQUETAS, ITEMS, LOOKS, MEDIDAS } from "./catalogo-demo.mjs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const admin = process.env.SUPABASE_SERVICE_ROLE_KEY;
const schema = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA ?? "public";
const BUCKET = "escaparate-fotos";
const EMAIL = "demo@escaparate.app";
const PASSWORD = "escaparate";

if (!url || !admin) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const db = createClient(url, admin, {
  db: { schema },
  auth: { persistSession: false, autoRefreshToken: false },
});

const cab = { apikey: admin, Authorization: `Bearer ${admin}`, "Content-Type": "application/json" };
const hex = ([r, g, b]) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;

const sql = async (query) => {
  const r = await fetch(`${url}/pg/query`, { method: "POST", headers: cab, body: JSON.stringify({ query }) });
  const t = await r.text();
  if (!r.ok) throw new Error(t.slice(0, 400));
  return JSON.parse(t);
};

/* ── Cuenta ──────────────────────────────────────────────────────────────── */

// Se busca por SQL en vez de recorrer la lista de usuarios: la instancia es
// compartida y puede tener muchos de otras aplicaciones.
const previos = await sql(`select id from auth.users where email = $$${EMAIL}$$`);
for (const { id } of previos) {
  const { data } = await db.storage.from(BUCKET).list(id);
  if (data?.length) await db.storage.from(BUCKET).remove(data.map((f) => `${id}/${f.name}`));
  await fetch(`${url}/auth/v1/admin/users/${id}`, { method: "DELETE", headers: cab });
  console.log("cuenta anterior borrada");
}

const alta = await fetch(`${url}/auth/v1/admin/users`, {
  method: "POST",
  headers: cab,
  body: JSON.stringify({
    email: EMAIL,
    password: PASSWORD,
    // Sin esto habría que confirmar por correo, y esta cuenta es para probar.
    email_confirm: true,
    // La marca `app` es la que mira el disparador para decidir si crea armario:
    // en esta instancia hay usuarios de otras aplicaciones.
    user_metadata: { name: "Alex Demo", app: "escaparate" },
  }),
});
const usuario = await alta.json();
if (!alta.ok) throw new Error(`No se pudo crear la cuenta: ${JSON.stringify(usuario).slice(0, 300)}`);
const uid = usuario.id;
console.log(`cuenta creada: ${EMAIL}`);

// El disparador ya ha dejado el perfil y unas medidas por defecto; se ajustan.
const { error: errAvatar } = await db.from("Avatar").update(MEDIDAS).eq("userId", uid);
if (errAvatar) throw new Error(`medidas: ${errAvatar.message}`);

/* ── Prendas ─────────────────────────────────────────────────────────────── */

const prendas = [];
for (const [indice, spec] of ITEMS.entries()) {
  const lienzo = createCanvas(512);
  lienzo.polygon(spec.shape, spec.rgb, spec.texture);
  const { png, width, height } = lienzo.render();

  // La ruta empieza por el identificador del usuario: es lo que mira la
  // política del almacén para dejar entrar solo a su dueño.
  const ruta = `${uid}/demo-${indice}.png`;
  const { error } = await db.storage.from(BUCKET).upload(ruta, png, {
    contentType: "image/png",
    upsert: true,
  });
  if (error) throw new Error(`subiendo ${ruta}: ${error.message}`);

  prendas.push({
    userId: uid,
    name: spec.name,
    imageUrl: ruta,
    imageWidth: width,
    imageHeight: height,
    category: spec.category,
    subcategory: spec.subcategory,
    color: spec.color,
    dominantColor: hex(spec.rgb),
    season: spec.season,
    occasion: spec.occasion,
    brand: spec.brand ?? null,
    size: spec.size ?? null,
    priceCents: spec.priceCents ?? null,
    purchasedAt: spec.purchasedAt ?? null,
    favorite: indice % 5 === 0,
    placeX: spec.place[0],
    placeY: spec.place[1],
    placeW: spec.place[2],
  });
}

const { data: creadas, error: errItems } = await db.from("Item").insert(prendas).select("id,name");
if (errItems) throw new Error(`prendas: ${errItems.message}`);
console.log(`${creadas.length} prendas`);

const { error: errTags } = await db.from("Tag").insert(ETIQUETAS.map((t) => ({ ...t, userId: uid })));
if (errTags) throw new Error(`etiquetas: ${errTags.message}`);
console.log(`${ETIQUETAS.length} etiquetas propias`);

/* ── Looks ───────────────────────────────────────────────────────────────── */

const manana = new Date();
manana.setUTCDate(manana.getUTCDate() + 1);
const soloDia = manana.toISOString().slice(0, 10);

for (const look of LOOKS) {
  // En dos pasos a propósito: la política de LookItem comprueba que el look sea
  // tuyo, y en una sola sentencia no vería el que se acaba de crear.
  const { data: creado, error } = await db
    .from("Look")
    .insert({
      userId: uid,
      name: look.name,
      occasion: look.occasion,
      scheduledAt: look.programado ? soloDia : null,
    })
    .select("id")
    .single();
  if (error) throw new Error(`look ${look.name}: ${error.message}`);

  const filas = look.prendas.map((nombre, position) => ({
    lookId: creado.id,
    itemId: creadas.find((i) => i.name === nombre).id,
    position,
  }));
  const { error: errLi } = await db.from("LookItem").insert(filas);
  if (errLi) throw new Error(`prendas de ${look.name}: ${errLi.message}`);
}
console.log(`${LOOKS.length} looks`);

console.log(`\nArmario de ejemplo listo.\nEntra con  ${EMAIL}  /  ${PASSWORD}`);
