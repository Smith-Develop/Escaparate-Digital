/**
 * Convierte los iconos SVG en PNG.
 *
 *   node scripts/generar-iconos.mjs
 *
 * Hacen falta en PNG y no valen los SVG: iOS no acepta SVG para el icono de la
 * pantalla de inicio, Chrome pide 192 y 512 para considerar instalable una PWA,
 * y Android los quiere rasterizados dentro del APK.
 *
 * Se rasteriza con el Chrome del sistema, que ya está instalado para las
 * pruebas, en vez de añadir una dependencia de dibujo solo para esto.
 *
 * También regenera las pantallas de arranque de Android. Las que venían de la
 * herramienta de Capacitor metían el icono con su fondo blanco encima del telón
 * negro, así que al abrir la app se veía un recuadro blanco alrededor del
 * logotipo. Aquí se dibuja el logotipo suelto sobre negro, al tamaño exacto de
 * cada carpeta de densidad.
 */
import { chromium } from "playwright-core";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

/** Ancho y alto de un PNG, que están siempre en los mismos bytes de la cabecera. */
const medir = (datos) => ({
  width: datos.readUInt32BE(16),
  height: datos.readUInt32BE(20),
});

const CHROME = process.env.CHROME_PATH ?? "/usr/bin/google-chrome";
const TAMANOS = [
  { origen: "public/icon.svg", destino: "public/icon-192.png", lado: 192 },
  { origen: "public/icon.svg", destino: "public/icon-512.png", lado: 512 },
  { origen: "public/icon.svg", destino: "public/apple-touch-icon.png", lado: 180 },
  { origen: "public/icon-maskable.svg", destino: "public/icon-maskable-512.png", lado: 512 },
];

/** El logotipo sin su caja: lo que va sobre el telón de arranque. */
const LOGOTIPO = `
  <path d="M96 40c-9 0-16 6.5-16 15 0 5 2.5 8.5 6 11l-38 52c-3 4-1.5 9 3 10.5l40 13a16 16 0 0 0 10 0l40-13c4.5-1.5 6-6.5 3-10.5l-38-52c3.5-2.5 6-6 6-11 0-8.5-7-15-16-15Z"
        fill="none" stroke="#c8a97e" stroke-width="7" stroke-linejoin="round"/>
  <path d="M70 130v20a6 6 0 0 0 6 6h40a6 6 0 0 0 6-6v-20" fill="none" stroke="#f5f3f0" stroke-width="7" stroke-linecap="round"/>`;

const FONDO = "#0b0b0d";

const navegador = await chromium.launch({ executablePath: CHROME, args: ["--no-sandbox"] });

for (const { origen, destino, lado } of TAMANOS) {
  const svg = await readFile(origen, "utf8");
  const pagina = await navegador.newPage({ viewport: { width: lado, height: lado } });
  await pagina.setContent(
    `<style>html,body{margin:0;padding:0}svg{display:block;width:${lado}px;height:${lado}px}</style>${svg}`,
  );
  await writeFile(destino, await pagina.screenshot({ omitBackground: false }));
  await pagina.close();
  console.log(`${destino} · ${lado}×${lado}`);
}

/* ── Pantallas de arranque de Android ──────────────────────────────────── */

// Cada carpeta de densidad tiene su tamaño y no se puede cambiar: Android elige
// una u otra según la pantalla, y una imagen con otras proporciones se estira.
const ARRANQUE = "android/app/src/main/res";
const pantallas = (
  await Promise.all(
    (await readdir(ARRANQUE))
      .filter((d) => d.startsWith("drawable"))
      .map(async (d) => {
        const fichero = path.join(ARRANQUE, d, "splash.png");
        return existsSync(fichero) ? fichero : null;
      }),
  )
).filter(Boolean);

for (const fichero of pantallas) {
  const { width, height } = medir(await readFile(fichero));
  // El logotipo ocupa un tercio del lado corto: suficiente para reconocerlo y
  // sin acercarse a los bordes en las pantallas más estrechas.
  const lado = Math.round(Math.min(width, height) / 3);
  const pagina = await navegador.newPage({ viewport: { width, height } });
  await pagina.setContent(
    `<style>html,body{margin:0;padding:0;background:${FONDO};height:100%}
     .centro{display:grid;place-items:center;height:100%}
     svg{display:block;width:${lado}px;height:${lado}px}</style>
     <div class="centro"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192">${LOGOTIPO}</svg></div>`,
  );
  await writeFile(fichero, await pagina.screenshot());
  await pagina.close();
  console.log(`${fichero} · ${width}×${height}`);
}

await navegador.close();
