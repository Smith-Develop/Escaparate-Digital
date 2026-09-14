/**
 * Armario de ejemplo: siluetas generadas y sus fichas.
 *
 * Las prendas no son fotos reales, son polígonos dibujados al vuelo, y sirven
 * para ver el escaparate, el probador y el lookbook funcionando de punta a
 * punta sin tener que fotografiar ropa. Lo usa el volcado a Supabase.
 */

/* ── Siluetas ────────────────────────────────────────────────────────────── */

export const TOP = [
  [0.32, 0.16], [0.4, 0.11], [0.5, 0.17], [0.6, 0.11], [0.68, 0.16],
  [0.84, 0.26], [0.78, 0.42], [0.72, 0.34], [0.72, 0.9], [0.28, 0.9],
  [0.28, 0.34], [0.22, 0.42], [0.16, 0.26],
];

export const LONG_SLEEVE_TOP = [
  [0.33, 0.14], [0.41, 0.09], [0.5, 0.15], [0.59, 0.09], [0.67, 0.14],
  [0.84, 0.25], [0.89, 0.78], [0.79, 0.8], [0.74, 0.36], [0.73, 0.93],
  [0.27, 0.93], [0.26, 0.36], [0.21, 0.8], [0.11, 0.78], [0.16, 0.25],
];

export const PANTS = [
  [0.31, 0.08], [0.69, 0.08], [0.73, 0.94], [0.57, 0.94], [0.5, 0.46],
  [0.43, 0.94], [0.27, 0.94],
];

export const SHORTS = [
  [0.28, 0.14], [0.72, 0.14], [0.76, 0.66], [0.56, 0.66], [0.5, 0.42],
  [0.44, 0.66], [0.24, 0.66],
];

export const SKIRT = [[0.34, 0.16], [0.66, 0.16], [0.84, 0.84], [0.16, 0.84]];

export const SNEAKER = [
  [0.1, 0.68], [0.18, 0.48], [0.3, 0.42], [0.47, 0.45], [0.6, 0.53],
  [0.82, 0.6], [0.9, 0.67], [0.9, 0.76], [0.1, 0.76],
];

export const BOOT = [
  [0.28, 0.2], [0.56, 0.2], [0.58, 0.58], [0.86, 0.64], [0.9, 0.76],
  [0.24, 0.76], [0.24, 0.58],
];

export const CAP = [
  [0.2, 0.58], [0.24, 0.4], [0.42, 0.3], [0.6, 0.32], [0.74, 0.42],
  [0.78, 0.58], [0.92, 0.6], [0.92, 0.68], [0.2, 0.68],
];

// Collar en uve y correa de reloj: sirven para ver que los accesorios se
// llevan varios a la vez sobre la misma figura.
export const CHAIN = [
  [0.22, 0.28], [0.5, 0.86], [0.78, 0.28], [0.72, 0.22], [0.5, 0.72], [0.28, 0.22],
];

export const STRAP = [
  [0.18, 0.42], [0.82, 0.42], [0.82, 0.58], [0.18, 0.58],
];

/* ── Catálogo de ejemplo ─────────────────────────────────────────────────── */

export const ITEMS = [
  { name: "Camiseta blanca básica", place: [0.5, 0.19, 0.78], shape: TOP, rgb: [235, 233, 226], category: "superior", subcategory: "Camiseta", color: "blanco", season: "verano", occasion: "casual", brand: "Everyday", size: "M", priceCents: 1290, purchasedAt: "2026-03-14" },
  { name: "Camisa de rayas", place: [0.5, 0.185, 0.9], shape: LONG_SLEEVE_TOP, rgb: [120, 150, 195], texture: "rayas", category: "superior", subcategory: "Camisa", color: "azul", season: "entretiempo", occasion: "trabajo", size: "L", priceCents: 4590, purchasedAt: "2025-11-02" },
  { name: "Sudadera gris", place: [0.5, 0.185, 0.92], shape: LONG_SLEEVE_TOP, rgb: [128, 128, 134], texture: "motas", category: "superior", subcategory: "Sudadera", color: "gris", season: "invierno", occasion: "casual" },
  { name: "Jeans oscuros", place: [0.5, 0.375, 0.52], shape: PANTS, rgb: [48, 62, 92], texture: "motas", category: "inferior", subcategory: "Jeans", color: "azul", season: "todo-el-ano", occasion: "casual", brand: "Denim Co.", size: "32x32", priceCents: 7995, purchasedAt: "2025-09-20" },
  { name: "Chino beige", place: [0.5, 0.375, 0.52], shape: PANTS, rgb: [206, 186, 152], category: "inferior", subcategory: "Chino", color: "beige", season: "entretiempo", occasion: "trabajo" },
  { name: "Short de deporte", place: [0.5, 0.45, 0.5], shape: SHORTS, rgb: [36, 38, 44], category: "inferior", subcategory: "Short", color: "negro", season: "verano", occasion: "deporte" },
  { name: "Falda midi", place: [0.5, 0.38, 0.55], shape: SKIRT, rgb: [124, 70, 96], category: "inferior", subcategory: "Falda", color: "morado", season: "entretiempo", occasion: "formal" },
  { name: "Zapatillas blancas", place: [0.5, 0.88, 0.42], shape: SNEAKER, rgb: [238, 236, 230], category: "calzado", subcategory: "Zapatillas", color: "blanco", season: "todo-el-ano", occasion: "casual" },
  { name: "Botas de cuero", place: [0.5, 0.81, 0.36], shape: BOOT, rgb: [96, 62, 38], category: "calzado", subcategory: "Botas", color: "marron", season: "invierno", occasion: "casual" },
  { name: "Blazer negro", place: [0.5, 0.18, 0.96], shape: LONG_SLEEVE_TOP, rgb: [28, 28, 32], category: "abrigo", subcategory: "Blazer", color: "negro", season: "entretiempo", occasion: "formal" },
  { name: "Parka verde", place: [0.5, 0.175, 0.98], shape: LONG_SLEEVE_TOP, rgb: [72, 92, 62], texture: "motas", category: "abrigo", subcategory: "Parka", color: "verde", season: "invierno", occasion: "casual" },
  { name: "Gorra marino", place: [0.5, 0.008, 0.2], shape: CAP, rgb: [34, 52, 88], category: "accesorio", subcategory: "Gorra", color: "azul", season: "verano", occasion: "casual" },
  { name: "Cadena de plata", place: [0.5, 0.135, 0.14], shape: CHAIN, rgb: [198, 200, 206], category: "accesorio", subcategory: "Collar", color: "gris", season: "todo-el-ano", occasion: "casual", priceCents: 2500 },
  { name: "Reloj negro", place: [0.26, 0.44, 0.11], shape: STRAP, rgb: [40, 40, 46], category: "accesorio", subcategory: "Reloj", color: "negro", season: "todo-el-ano", occasion: "formal", brand: "Hora", size: "Única", priceCents: 8900, purchasedAt: "2026-01-06" },
];

/** Medidas de la cuenta de ejemplo. */
export const MEDIDAS = {
  figure: "neutra",
  heightCm: 174, weightKg: 70, shoulderCm: 44, chestCm: 98, waistCm: 82,
  hipCm: 98, neckCm: 38, thighCm: 55, bicepCm: 31, inseamCm: 81,
  armCm: 61, footCm: 27,
};

/** Etiquetas propias de ejemplo, una por cada propiedad que las admite. */
export const ETIQUETAS = [
  { kind: "color", parent: "", slug: "burdeos", label: "Burdeos", hex: "#7B1E3A" },
  { kind: "ocasion", parent: "", slug: "boda", label: "Boda", hex: null },
  { kind: "temporada", parent: "", slug: "media-estacion", label: "Media estación", hex: null },
  { kind: "tipo", parent: "superior", slug: "camiseta-oversize", label: "Camiseta oversize", hex: null },
];

/** Conjuntos de ejemplo, en orden de apilado (del fondo al frente). */
export const LOOKS = [
  {
    name: "Viernes de oficina", occasion: "trabajo", programado: true,
    prendas: ["Zapatillas blancas", "Chino beige", "Camisa de rayas", "Blazer negro"],
  },
  {
    name: "Domingo tranquilo", occasion: "casual", programado: false,
    prendas: ["Zapatillas blancas", "Jeans oscuros", "Camiseta blanca básica"],
  },
];
