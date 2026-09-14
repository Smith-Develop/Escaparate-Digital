/**
 * Comprueba de un vistazo que la app puede hablar con Supabase.
 *
 *   node --env-file=.env.local scripts/comprobar-supabase.mjs
 *
 * Responde a las tres preguntas que se hacen siempre al montar esto: ¿contesta
 * la API?, ¿está expuesto nuestro esquema?, ¿existen ya las tablas? Usa la
 * clave anónima, o sea que ve exactamente lo que verá la app.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const schema = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA ?? "public";

if (!url || !anon) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local");
  process.exit(1);
}

console.log(`URL      ${url}`);
console.log(`esquema  ${schema}\n`);

const salud = async (ruta, nombre) => {
  try {
    const r = await fetch(`${url}${ruta}`, { headers: { apikey: anon } });
    console.log(`  ${nombre.padEnd(9)} ${r.ok ? "ok" : `HTTP ${r.status}`}`);
    return r.ok;
  } catch (e) {
    console.log(`  ${nombre.padEnd(9)} sin respuesta (${e.message})`);
    return false;
  }
};

console.log("Servicios:");
await salud("/auth/v1/health", "auth");
await salud("/rest/v1/", "rest");
await salud("/storage/v1/version", "storage");

const supabase = createClient(url, anon, { db: { schema }, auth: { persistSession: false } });

console.log("\nTablas:");
const tablas = ["profiles", "Avatar", "Item", "Tag", "Look", "LookItem"];
let faltan = 0;
for (const t of tablas) {
  // Consulta normal, no `head: true`: con una petición HEAD no hay cuerpo que
  // leer, supabase-js no rellena `error` y una tabla inexistente se da por
  // buena. Cuesta un byte más y no miente.
  const { error } = await supabase.from(t).select("id").limit(1);
  if (!error) {
    console.log(`  ${t.padEnd(9)} existe y responde`);
  } else if (error.code === "PGRST205" || /schema cache/.test(error.message ?? "")) {
    console.log(`  ${t.padEnd(9)} NO existe — falta aplicar las migraciones`);
    faltan++;
  } else {
    // Sin sesión lo normal es que rechace: eso es que las políticas trabajan.
    console.log(`  ${t.padEnd(9)} existe · sin sesión: ${error.code ?? error.message}`);
  }
}

// Ojo con dos trampas: `list()` de un bucket devuelve 200 y una lista vacía
// aunque el bucket no exista —lo filtra la seguridad por filas—, y preguntar
// por el bucket con la clave anónima responde «Bucket not found» aunque exista,
// porque los metadatos del almacén no son públicos. Hace falta la clave de
// servicio para distinguir «no está» de «no puedes verlo».
console.log("\nAlmacén:");
const admin = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!admin) console.log("  (sin SUPABASE_SERVICE_ROLE_KEY no se puede comprobar de forma fiable)");
const clave = admin ?? anon;
const bucket = await fetch(`${url}/storage/v1/bucket/escaparate-fotos`, {
  headers: { apikey: clave, Authorization: `Bearer ${clave}` },
});
const cuerpo = await bucket.json().catch(() => ({}));
const sinBucket = bucket.status === 400 || bucket.status === 404;
console.log(
  bucket.ok
    ? `  escaparate-fotos · creado · ${cuerpo.public ? "PÚBLICO (debería ser privado)" : "privado"}`
    : `  escaparate-fotos · ${sinBucket ? "NO existe — falta aplicar 0003_storage.sql" : cuerpo.message ?? bucket.status}`,
);
if (sinBucket) faltan++;

console.log(
  faltan > 0
    ? `\nPendiente: aplicar supabase/migrations/*.sql en el Studio (${faltan} tablas sin crear).`
    : "\nTodo en su sitio.",
);
