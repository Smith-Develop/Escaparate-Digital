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
 */
import { chromium } from "playwright-core";
import { readFile, writeFile } from "node:fs/promises";

const CHROME = process.env.CHROME_PATH ?? "/usr/bin/google-chrome";
const TAMANOS = [
  { origen: "public/icon.svg", destino: "public/icon-192.png", lado: 192 },
  { origen: "public/icon.svg", destino: "public/icon-512.png", lado: 512 },
  { origen: "public/icon.svg", destino: "public/apple-touch-icon.png", lado: 180 },
  { origen: "public/icon-maskable.svg", destino: "public/icon-maskable-512.png", lado: 512 },
];

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

await navegador.close();
