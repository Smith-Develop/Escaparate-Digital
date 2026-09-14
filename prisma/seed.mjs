/**
 * Datos de ejemplo para probar la aplicación sin tener que fotografiar ropa.
 *
 *   npm run seed
 *
 * Crea la cuenta demo@escaparate.app / escaparate con un armario ya catalogado.
 * Las prendas son siluetas generadas al vuelo, no fotos reales: sirven para ver
 * el escaparate, el probador 3D y el lookbook funcionando de punta a punta.
 */
import { mkdir, rm, writeFile } from "node:fs/promises";
import { randomBytes, scrypt as scryptCb } from "node:crypto";
import { promisify } from "node:util";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { createCanvas } from "./png.mjs";

const scrypt = promisify(scryptCb);
const prisma = new PrismaClient();

const EMAIL = "demo@escaparate.app";
const PASSWORD = "escaparate";

/* ── Siluetas ────────────────────────────────────────────────────────────── */

const TOP = [
  [0.32, 0.16], [0.4, 0.11], [0.5, 0.17], [0.6, 0.11], [0.68, 0.16],
  [0.84, 0.26], [0.78, 0.42], [0.72, 0.34], [0.72, 0.9], [0.28, 0.9],
  [0.28, 0.34], [0.22, 0.42], [0.16, 0.26],
];

const LONG_SLEEVE_TOP = [
  [0.33, 0.14], [0.41, 0.09], [0.5, 0.15], [0.59, 0.09], [0.67, 0.14],
  [0.84, 0.25], [0.89, 0.78], [0.79, 0.8], [0.74, 0.36], [0.73, 0.93],
  [0.27, 0.93], [0.26, 0.36], [0.21, 0.8], [0.11, 0.78], [0.16, 0.25],
];

const PANTS = [
  [0.31, 0.08], [0.69, 0.08], [0.73, 0.94], [0.57, 0.94], [0.5, 0.46],
  [0.43, 0.94], [0.27, 0.94],
];

const SHORTS = [
  [0.28, 0.14], [0.72, 0.14], [0.76, 0.66], [0.56, 0.66], [0.5, 0.42],
  [0.44, 0.66], [0.24, 0.66],
];

const SKIRT = [[0.34, 0.16], [0.66, 0.16], [0.84, 0.84], [0.16, 0.84]];

const SNEAKER = [
  [0.1, 0.68], [0.18, 0.48], [0.3, 0.42], [0.47, 0.45], [0.6, 0.53],
  [0.82, 0.6], [0.9, 0.67], [0.9, 0.76], [0.1, 0.76],
];

const BOOT = [
  [0.28, 0.2], [0.56, 0.2], [0.58, 0.58], [0.86, 0.64], [0.9, 0.76],
  [0.24, 0.76], [0.24, 0.58],
];

const CAP = [
  [0.2, 0.58], [0.24, 0.4], [0.42, 0.3], [0.6, 0.32], [0.74, 0.42],
  [0.78, 0.58], [0.92, 0.6], [0.92, 0.68], [0.2, 0.68],
];

/* ── Catálogo de ejemplo ─────────────────────────────────────────────────── */

const ITEMS = [
  { name: "Camiseta blanca básica", place: [0.5, 0.19, 0.78], shape: TOP, rgb: [235, 233, 226], category: "superior", subcategory: "Camiseta", color: "blanco", season: "verano", occasion: "casual", brand: "Everyday" },
  { name: "Camisa de rayas", place: [0.5, 0.185, 0.9], shape: LONG_SLEEVE_TOP, rgb: [120, 150, 195], texture: "rayas", category: "superior", subcategory: "Camisa", color: "azul", season: "entretiempo", occasion: "trabajo" },
  { name: "Sudadera gris", place: [0.5, 0.185, 0.92], shape: LONG_SLEEVE_TOP, rgb: [128, 128, 134], texture: "motas", category: "superior", subcategory: "Sudadera", color: "gris", season: "invierno", occasion: "casual" },
  { name: "Jeans oscuros", place: [0.5, 0.375, 0.52], shape: PANTS, rgb: [48, 62, 92], texture: "motas", category: "inferior", subcategory: "Jeans", color: "azul", season: "todo-el-ano", occasion: "casual", brand: "Denim Co." },
  { name: "Chino beige", place: [0.5, 0.375, 0.52], shape: PANTS, rgb: [206, 186, 152], category: "inferior", subcategory: "Chino", color: "beige", season: "entretiempo", occasion: "trabajo" },
  { name: "Short de deporte", place: [0.5, 0.45, 0.5], shape: SHORTS, rgb: [36, 38, 44], category: "inferior", subcategory: "Short", color: "negro", season: "verano", occasion: "deporte" },
  { name: "Falda midi", place: [0.5, 0.38, 0.55], shape: SKIRT, rgb: [124, 70, 96], category: "inferior", subcategory: "Falda", color: "morado", season: "entretiempo", occasion: "formal" },
  { name: "Zapatillas blancas", place: [0.5, 0.88, 0.42], shape: SNEAKER, rgb: [238, 236, 230], category: "calzado", subcategory: "Zapatillas", color: "blanco", season: "todo-el-ano", occasion: "casual" },
  { name: "Botas de cuero", place: [0.5, 0.81, 0.36], shape: BOOT, rgb: [96, 62, 38], category: "calzado", subcategory: "Botas", color: "marron", season: "invierno", occasion: "casual" },
  { name: "Blazer negro", place: [0.5, 0.18, 0.96], shape: LONG_SLEEVE_TOP, rgb: [28, 28, 32], category: "abrigo", subcategory: "Blazer", color: "negro", season: "entretiempo", occasion: "formal" },
  { name: "Parka verde", place: [0.5, 0.175, 0.98], shape: LONG_SLEEVE_TOP, rgb: [72, 92, 62], texture: "motas", category: "abrigo", subcategory: "Parka", color: "verde", season: "invierno", occasion: "casual" },
  { name: "Gorra marino", place: [0.5, 0.008, 0.2], shape: CAP, rgb: [34, 52, 88], category: "accesorio", subcategory: "Gorra", color: "azul", season: "verano", occasion: "casual" },
];

const hex = ([r, g, b]) =>
  `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;

async function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64);
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

async function main() {
  // Cada ejecución parte de cero: borra la cuenta demo anterior y sus fotos.
  const previous = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (previous) {
    await rm(path.join(process.cwd(), "public", "uploads", previous.id), {
      recursive: true,
      force: true,
    });
    await prisma.user.delete({ where: { id: previous.id } });
  }

  const user = await prisma.user.create({
    data: {
      email: EMAIL,
      name: "Alex Demo",
      passwordHash: await hashPassword(PASSWORD),
      avatar: {
        create: {
          figure: "neutra",
          heightCm: 174,
          weightKg: 70,
          shoulderCm: 44,
          chestCm: 98,
          waistCm: 82,
          hipCm: 98,
          neckCm: 38,
          thighCm: 55,
          bicepCm: 31,
          inseamCm: 81,
          armCm: 61,
          footCm: 27,
          hairStyle: "corto",
        },
      },
    },
  });

  const dir = path.join(process.cwd(), "public", "uploads", user.id);
  await mkdir(dir, { recursive: true });

  const created = [];
  for (const [index, spec] of ITEMS.entries()) {
    const canvas = createCanvas(512);
    canvas.polygon(spec.shape, spec.rgb, spec.texture);
    const filename = `demo-${index}.png`;
    const { png, width, height } = canvas.render();
    await writeFile(path.join(dir, filename), png);

    created.push(
      await prisma.item.create({
        data: {
          userId: user.id,
          name: spec.name,
          imageUrl: `/uploads/${user.id}/${filename}`,
          imageWidth: width,
          imageHeight: height,
          category: spec.category,
          subcategory: spec.subcategory,
          color: spec.color,
          dominantColor: hex(spec.rgb),
          season: spec.season,
          occasion: spec.occasion,
          brand: spec.brand ?? null,
          favorite: index % 5 === 0,
          // Colocación de partida sobre el lienzo del probador; en la app la
          // decide el usuario arrastrando la prenda sobre el maniquí.
          placeX: spec.place[0],
          placeY: spec.place[1],
          placeW: spec.place[2],
        },
      }),
    );
  }

  const find = (name) => created.find((i) => i.name === name);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(12, 0, 0, 0);

  await prisma.look.create({
    data: {
      userId: user.id,
      name: "Viernes de oficina",
      occasion: "trabajo",
      scheduledAt: tomorrow,
      // El orden es el de apilado: del fondo al frente.
      items: {
        create: [
          { itemId: find("Zapatillas blancas").id, position: 0 },
          { itemId: find("Chino beige").id, position: 1 },
          { itemId: find("Camisa de rayas").id, position: 2 },
          { itemId: find("Blazer negro").id, position: 3 },
        ],
      },
    },
  });

  await prisma.look.create({
    data: {
      userId: user.id,
      name: "Domingo tranquilo",
      occasion: "casual",
      items: {
        create: [
          { itemId: find("Zapatillas blancas").id, position: 0 },
          { itemId: find("Jeans oscuros").id, position: 1 },
          { itemId: find("Camiseta blanca básica").id, position: 2 },
        ],
      },
    },
  });

  console.log(`Armario de ejemplo listo: ${created.length} prendas y 2 looks.`);
  console.log(`Entra con  ${EMAIL}  /  ${PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
