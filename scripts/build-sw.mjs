/**
 * Escribe la lista de ficheros que el service worker guarda al instalarse.
 *
 *   node scripts/build-sw.mjs        (lo lanza `npm run build` por su cuenta)
 *
 * Recorre `out/` después de compilar. Mantener esa lista a mano es garantía de
 * olvidarse de algo —los fragmentos de JavaScript llevan huella en el nombre y
 * cambian en cada compilación—, y al primer arranque sin red se nota.
 *
 * Los ficheros muy grandes se dejan fuera: el tiempo de ejecución de WebAssembly
 * del recorte de fondo pesa 23 MB y guardarlo al instalar retrasaría la primera
 * visita para algo que solo hace falta al añadir una prenda. Ese se guarda solo
 * la primera vez que se usa.
 */
import { createHash } from "node:crypto";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const RAIZ = "out";
const TOPE = 2 * 1024 * 1024;
const FUERA = [/\.map$/, /^\/uploads\//, /^\/sw\.js$/];

async function recorrer(dir) {
  const entradas = await readdir(dir, { withFileTypes: true });
  const ficheros = [];
  for (const entrada of entradas) {
    const completo = path.join(dir, entrada.name);
    if (entrada.isDirectory()) ficheros.push(...(await recorrer(completo)));
    else ficheros.push(completo);
  }
  return ficheros;
}

const ficheros = await recorrer(RAIZ);
const rutas = [];
let bytes = 0;

for (const fichero of ficheros) {
  const relativa = "/" + path.relative(RAIZ, fichero).split(path.sep).join("/");
  if (FUERA.some((patron) => patron.test(relativa))) continue;

  const { size } = await stat(fichero);
  if (size > TOPE) continue;

  // Las páginas se piden por su carpeta, no por el index.html.
  rutas.push(relativa.endsWith("/index.html") ? relativa.slice(0, -"index.html".length) : relativa);
  bytes += size;
}

// La versión sale del contenido: si no cambia nada, el navegador no vuelve a
// descargar la caché entera.
const version = createHash("sha1").update(rutas.sort().join("|")).digest("hex").slice(0, 8);

const plantilla = await readFile("public/sw.js", "utf8");
await writeFile(
  path.join(RAIZ, "sw.js"),
  plantilla
    .replace("__VERSION__", `escaparate-${version}`)
    .replace("__PRECACHE__", JSON.stringify(rutas, null, 2)),
);

console.log(
  `sw.js listo · ${rutas.length} ficheros · ${(bytes / 1048576).toFixed(1)} MB · versión ${version}`,
);
