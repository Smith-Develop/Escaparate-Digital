/**
 * Aplica las migraciones contra tu Supabase a través de postgres-meta, el mismo
 * servicio que usa el Studio por debajo.
 *
 *   node --env-file=.env.local scripts/aplicar-migraciones.mjs --ensayo
 *   node --env-file=.env.local scripts/aplicar-migraciones.mjs --de-verdad
 *
 * En modo ensayo lo envuelve todo en una transacción y la deshace al final: si
 * el SQL tiene algún fallo, se ve aquí, y la base queda exactamente como
 * estaba. Es la forma de probar contra los `auth` y `storage` de verdad, que el
 * PostgreSQL de juguete de las pruebas solo imita.
 */
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const admin = process.env.SUPABASE_SERVICE_ROLE_KEY;
const deVerdad = process.argv.includes("--de-verdad");

if (!url || !admin) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const dir = "supabase/migrations";
const ficheros = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
const sql = [];
for (const f of ficheros) sql.push(`-- ${f}\n${await readFile(path.join(dir, f), "utf8")}`);

const cuerpo = deVerdad
  ? sql.join("\n")
  : `begin;\n${sql.join("\n")}\nrollback;`;

console.log(`${deVerdad ? "APLICANDO" : "Ensayando"}: ${ficheros.join(", ")}`);

const r = await fetch(`${url}/pg/query`, {
  method: "POST",
  headers: { apikey: admin, Authorization: `Bearer ${admin}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: cuerpo }),
});
const texto = await r.text();

if (!r.ok) {
  console.error(`\nFalló (HTTP ${r.status}):\n${texto.slice(0, 900)}`);
  process.exit(1);
}
console.log(
  deVerdad
    ? "\nAplicado. Comprueba con: node --env-file=.env.local scripts/comprobar-supabase.mjs"
    : "\nEl SQL se ejecuta entero y sin errores contra tu base. Deshecho: no queda nada.",
);
