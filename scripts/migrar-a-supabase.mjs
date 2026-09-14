/**
 * Sube a Supabase el armario de la versión con servidor.
 *
 *   node --env-file=.env.local scripts/migrar-a-supabase.mjs --correo alguien@correo.com --seco
 *   node --env-file=.env.local scripts/migrar-a-supabase.mjs --correo alguien@correo.com --clave "una nueva"
 *
 * Lee `migracion/dev.db` y `migracion/uploads-antiguos/`, que es lo que quedó
 * de la base SQLite y de las fotos en disco.
 *
 * **Las contraseñas no se pueden migrar**: se guardaban con scrypt en un
 * formato propio que Supabase no entiende. Por eso hay que dar una nueva; el
 * resto de la cuenta (prendas, etiquetas, looks, medidas y fotos) sí viaja tal
 * cual, conservando incluso las fechas de compra.
 */
import { DatabaseSync } from "node:sqlite";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const args = process.argv.slice(2);
const valor = (nombre) => {
  const i = args.indexOf(nombre);
  return i >= 0 ? args[i + 1] : undefined;
};
const correo = valor("--correo");
const clave = valor("--clave");
const seco = args.includes("--seco");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const admin = process.env.SUPABASE_SERVICE_ROLE_KEY;
const schema = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA ?? "public";
const BUCKET = "escaparate-fotos";

if (!correo) {
  console.error("Falta --correo. Con --seco enseña lo que haría sin tocar nada.");
  process.exit(1);
}
if (!url || !admin) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}
if (!seco && !clave) {
  console.error("Falta --clave: la contraseña nueva de la cuenta (las antiguas no se pueden migrar).");
  process.exit(1);
}

const db = new DatabaseSync("migracion/dev.db", { readOnly: true });
const uno = (sql, ...p) => db.prepare(sql).get(...p);
const todos = (sql, ...p) => db.prepare(sql).all(...p);

const usuario = uno("select * from User where email = ?", correo);
if (!usuario) {
  console.error(`No hay ninguna cuenta con ese correo en la base antigua. Las que hay:`);
  for (const u of todos("select email from User")) console.error("  ·", u.email);
  process.exit(1);
}

const prendas = todos("select * from Item where userId = ?", usuario.id);
const etiquetas = todos("select * from Tag where userId = ?", usuario.id);
const looks = todos("select * from Look where userId = ?", usuario.id);
const medidas = uno("select * from Avatar where userId = ?", usuario.id);

console.log(`Cuenta: ${usuario.email} (${usuario.name})`);
console.log(`  ${prendas.length} prendas · ${etiquetas.length} etiquetas · ${looks.length} looks`);
console.log(`  fotos a subir: ${prendas.filter((p) => p.imageUrl?.startsWith("/uploads/")).length}`);

if (seco) {
  console.log("\n(--seco: no se ha tocado nada)");
  process.exit(0);
}

const cab = { apikey: admin, Authorization: `Bearer ${admin}`, "Content-Type": "application/json" };
const sb = createClient(url, admin, { db: { schema }, auth: { persistSession: false } });

/* ── Cuenta ──────────────────────────────────────────────────────────────── */

const alta = await fetch(`${url}/auth/v1/admin/users`, {
  method: "POST",
  headers: cab,
  body: JSON.stringify({
    email: correo,
    password: clave,
    email_confirm: true,
    user_metadata: { name: usuario.name, app: "escaparate" },
  }),
});
const cuenta = await alta.json();
if (!alta.ok) throw new Error(`No se pudo crear la cuenta: ${JSON.stringify(cuenta).slice(0, 300)}`);
const uid = cuenta.id;
console.log(`\ncuenta creada en Supabase · ${uid.slice(0, 8)}…`);

if (medidas) {
  // Se desechan las columnas que ya no existen o las pone la base: el
  // identificador, el dueño, la marca de tiempo, la foto de cuerpo entero (se
  // sube aparte) y los restos del avatar dibujado que se abandonó.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, userId, updatedAt, photoUrl, skinTone, hairColor, hairStyle, ...resto } = medidas;
  await sb.from("Avatar").update(resto).eq("userId", uid);
  console.log("medidas migradas");
}

/* ── Fotos y prendas ─────────────────────────────────────────────────────── */

/** Sube una foto de disco al almacén y devuelve su nueva ruta. */
async function subir(rutaVieja) {
  if (!rutaVieja?.startsWith("/uploads/")) return null;
  const enDisco = path.join("migracion", "uploads-antiguos", rutaVieja.replace("/uploads/", ""));
  const contenido = await readFile(enDisco).catch(() => null);
  if (!contenido) {
    console.warn(`  ⚠ falta el fichero ${enDisco}`);
    return null;
  }
  const nombre = path.basename(rutaVieja);
  const tipo = nombre.endsWith(".png") ? "image/png" : nombre.endsWith(".webp") ? "image/webp" : "image/jpeg";
  const destino = `${uid}/${nombre}`;
  const { error } = await sb.storage.from(BUCKET).upload(destino, contenido, { contentType: tipo, upsert: true });
  if (error) throw new Error(`subiendo ${nombre}: ${error.message}`);
  return destino;
}

const mapaPrendas = new Map();
for (const p of prendas) {
  const imageUrl = await subir(p.imageUrl);
  if (!imageUrl) {
    console.warn(`  ⚠ «${p.name}» se salta: sin foto no hay prenda`);
    continue;
  }
  const { data, error } = await sb
    .from("Item")
    .insert({
      userId: uid,
      name: p.name,
      imageUrl,
      originalUrl: await subir(p.originalUrl),
      imageWidth: p.imageWidth,
      imageHeight: p.imageHeight,
      placeX: p.placeX, placeY: p.placeY, placeW: p.placeW, placeH: p.placeH,
      category: p.category, subcategory: p.subcategory, color: p.color,
      dominantColor: p.dominantColor, season: p.season, occasion: p.occasion,
      brand: p.brand, notes: p.notes, size: p.size, priceCents: p.priceCents,
      // SQLite guardaba las fechas en milisegundos.
      purchasedAt: p.purchasedAt ? new Date(p.purchasedAt).toISOString() : null,
      favorite: Boolean(p.favorite),
    })
    .select("id")
    .single();
  if (error) throw new Error(`prenda «${p.name}»: ${error.message}`);
  mapaPrendas.set(p.id, data.id);
}
console.log(`${mapaPrendas.size} prendas migradas con sus fotos`);

if (etiquetas.length > 0) {
  const { error } = await sb.from("Tag").insert(
    etiquetas.map((t) => ({
      userId: uid, kind: t.kind, parent: t.parent ?? "", slug: t.slug, label: t.label, hex: t.hex,
    })),
  );
  if (error) throw new Error(`etiquetas: ${error.message}`);
  console.log(`${etiquetas.length} etiquetas migradas`);
}

/* ── Looks ───────────────────────────────────────────────────────────────── */

let hechos = 0;
for (const look of looks) {
  const { data, error } = await sb
    .from("Look")
    .insert({
      userId: uid,
      name: look.name,
      notes: look.notes,
      occasion: look.occasion,
      scheduledAt: look.scheduledAt ? new Date(look.scheduledAt).toISOString() : null,
    })
    .select("id")
    .single();
  if (error) throw new Error(`look «${look.name}»: ${error.message}`);

  // En dos pasos: la política de LookItem no ve el look dentro de la misma
  // sentencia que lo crea.
  const filas = todos("select * from LookItem where lookId = ? order by position", look.id)
    .map((li) => ({ lookId: data.id, itemId: mapaPrendas.get(li.itemId), position: li.position }))
    .filter((f) => f.itemId);
  if (filas.length > 0) {
    const { error: errLi } = await sb.from("LookItem").insert(filas);
    if (errLi) throw new Error(`prendas del look «${look.name}»: ${errLi.message}`);
  }
  hechos++;
}
console.log(`${hechos} looks migrados`);

console.log(`\nListo. Entra con ${correo} y la contraseña nueva.`);
