/** Taxonomía del armario: categorías, subcategorías y etiquetas de filtrado. */

export const CATEGORIES = [
  // `short` es la etiqueta del raíl del estudio, donde no cabe la larga.
  { id: "superior", label: "Parte superior", short: "Superior", icon: "👕" },
  { id: "inferior", label: "Parte inferior", short: "Inferior", icon: "👖" },
  { id: "calzado", label: "Calzado", short: "Calzado", icon: "👟" },
  { id: "abrigo", label: "Abrigos", short: "Abrigos", icon: "🧥" },
  { id: "accesorio", label: "Accesorios", short: "Accesorios", icon: "🧢" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export const SUBCATEGORIES: Record<CategoryId, string[]> = {
  superior: ["Camiseta", "Camisa", "Polo", "Jersey", "Sudadera", "Top", "Blusa"],
  inferior: ["Jeans", "Pantalón", "Chino", "Short", "Falda", "Legging", "Jogger"],
  calzado: ["Zapatillas", "Botas", "Zapatos", "Sandalias", "Mocasines", "Deportivas"],
  abrigo: ["Chaqueta", "Abrigo", "Cazadora", "Blazer", "Parka", "Chaleco", "Trench"],
  accesorio: ["Gorra", "Bufanda", "Cinturón", "Bolso", "Gafas", "Reloj", "Collar"],
};

export const COLORS = [
  { id: "negro", label: "Negro", hex: "#141414" },
  { id: "blanco", label: "Blanco", hex: "#F4F2EE" },
  { id: "gris", label: "Gris", hex: "#8A8A90" },
  { id: "beige", label: "Beige", hex: "#D8C5A5" },
  { id: "marron", label: "Marrón", hex: "#7A5233" },
  { id: "azul", label: "Azul", hex: "#2E5A8C" },
  { id: "verde", label: "Verde", hex: "#4A7A4E" },
  { id: "rojo", label: "Rojo", hex: "#A33232" },
  { id: "rosa", label: "Rosa", hex: "#D99BA8" },
  { id: "amarillo", label: "Amarillo", hex: "#D9B64A" },
  { id: "morado", label: "Morado", hex: "#6B4A8C" },
  { id: "estampado", label: "Estampado", hex: "#B98CC4" },
] as const;

export const SEASONS = [
  { id: "verano", label: "Verano" },
  { id: "invierno", label: "Invierno" },
  { id: "entretiempo", label: "Entretiempo" },
  { id: "todo-el-ano", label: "Todo el año" },
] as const;

export const OCCASIONS = [
  { id: "casual", label: "Casual" },
  { id: "formal", label: "Formal" },
  { id: "deporte", label: "Deporte" },
  { id: "trabajo", label: "Trabajo" },
] as const;

export const FIGURES = [
  { id: "neutra", label: "Neutra" },
  { id: "femenina", label: "Femenina" },
  { id: "masculina", label: "Masculina" },
] as const;

/**
 * Medidas del cuerpo, con los límites y la explicación de cómo tomarlas. Una medida mal tomada estropea la silueta, así que cada campo
 * lleva su propia indicación.
 */
export const MEASUREMENTS = [
  {
    key: "heightCm",
    label: "Altura",
    /** Nombre corto, para el resumen del perfil. */
    short: "Altura",
    unit: "cm",
    min: 140,
    max: 210,
    group: "Generales",
    help: "De la coronilla al suelo, descalzo y con la espalda recta.",
  },
  {
    key: "weightKg",
    label: "Peso",
    /** Nombre corto, para el resumen del perfil. */
    short: "Peso",
    unit: "kg",
    min: 35,
    max: 180,
    group: "Generales",
    help: "No cambia la silueta; sirve para tus estadísticas.",
  },
  {
    key: "shoulderCm",
    label: "Ancho de hombros",
    /** Nombre corto, para el resumen del perfil. */
    short: "Hombros",
    unit: "cm",
    min: 30,
    max: 62,
    group: "Torso",
    help: "De punta a punta de hombro, midiendo por la espalda.",
  },
  {
    key: "chestCm",
    label: "Contorno de pecho",
    /** Nombre corto, para el resumen del perfil. */
    short: "Pecho",
    unit: "cm",
    min: 60,
    max: 150,
    group: "Torso",
    help: "Por la parte más ancha, con la cinta horizontal y sin apretar.",
  },
  {
    key: "waistCm",
    label: "Contorno de cintura",
    /** Nombre corto, para el resumen del perfil. */
    short: "Cintura",
    unit: "cm",
    min: 50,
    max: 150,
    group: "Torso",
    help: "Por la cintura natural: la zona más estrecha, sobre el ombligo.",
  },
  {
    key: "hipCm",
    label: "Contorno de cadera",
    /** Nombre corto, para el resumen del perfil. */
    short: "Cadera",
    unit: "cm",
    min: 60,
    max: 165,
    group: "Torso",
    help: "Por la parte más ancha de la cadera y los glúteos.",
  },
  {
    key: "neckCm",
    label: "Contorno de cuello",
    /** Nombre corto, para el resumen del perfil. */
    short: "Cuello",
    unit: "cm",
    min: 28,
    max: 55,
    group: "Torso",
    help: "En la base del cuello, donde apoyaría el cuello de una camisa.",
  },
  {
    key: "bicepCm",
    label: "Contorno de bíceps",
    /** Nombre corto, para el resumen del perfil. */
    short: "Bíceps",
    unit: "cm",
    min: 18,
    max: 60,
    group: "Extremidades",
    help: "Por la parte más gruesa del brazo, relajado.",
  },
  {
    key: "armCm",
    label: "Largo de brazo",
    /** Nombre corto, para el resumen del perfil. */
    short: "Brazo",
    unit: "cm",
    min: 40,
    max: 82,
    group: "Extremidades",
    help: "Del hombro a la muñeca, con el brazo caído.",
  },
  {
    key: "thighCm",
    label: "Contorno de muslo",
    /** Nombre corto, para el resumen del perfil. */
    short: "Muslo",
    unit: "cm",
    min: 35,
    max: 95,
    group: "Extremidades",
    help: "Por la parte más gruesa del muslo.",
  },
  {
    key: "inseamCm",
    label: "Entrepierna",
    /** Nombre corto, para el resumen del perfil. */
    short: "Entrepierna",
    unit: "cm",
    min: 55,
    max: 108,
    group: "Extremidades",
    help: "Del tiro al suelo, por la cara interna de la pierna.",
  },
  {
    key: "footCm",
    label: "Largo de pie",
    /** Nombre corto, para el resumen del perfil. */
    short: "Pie",
    unit: "cm",
    min: 19,
    max: 34,
    group: "Extremidades",
    help: "Del talón a la punta del dedo más largo.",
  },
] as const;

export type MeasurementKey = (typeof MEASUREMENTS)[number]["key"];

export const MEASUREMENT_GROUPS = ["Generales", "Torso", "Extremidades"] as const;

/* ── Etiquetas propias ─────────────────────────────────────────────────────
   Las listas de serie cubren lo habitual, pero cada armario tiene sus rarezas:
   «burdeos», «boda», «media estación», «camiseta oversize». El usuario puede
   añadir las suyas en cualquiera de las propiedades y conviven con las de
   serie: la prenda guarda el valor como texto, así que no hay que migrar nada
   ni distinguirlas al filtrar.

   La categoría es la excepción a propósito. Las cinco de serie no son una
   etiqueta más: deciden la capa que ocupa la prenda en el probador, el icono
   del raíl y dónde se coloca por omisión. Una categoría inventada no sabría
   contestar a nada de eso.                                                   */

/** Propiedades de una prenda a las que se pueden añadir etiquetas propias. */
export const TAG_KINDS = ["tipo", "color", "temporada", "ocasion"] as const;
export type TagKind = (typeof TAG_KINDS)[number];

export const TAG_KIND_LABEL: Record<TagKind, string> = {
  tipo: "tipo de prenda",
  color: "color",
  temporada: "temporada",
  ocasion: "ocasión",
};

/** Con su artículo y su concordancia, para el aviso de nombre repetido. */
export const TAG_KIND_YA_TIENES: Record<TagKind, string> = {
  tipo: "un tipo de prenda llamado",
  color: "un color llamado",
  temporada: "una temporada llamada",
  ocasion: "una ocasión llamada",
};

export type Etiqueta = {
  id: string;
  label: string;
  hex?: string;
  /** Las propias se pueden renombrar y borrar; las de serie no. */
  propia?: boolean;
  /** Identificador de la fila en la base de datos, solo en las propias. */
  tagId?: string;
};

type TagBruta = {
  id?: string;
  kind: string;
  parent?: string;
  slug: string;
  label: string;
  hex: string | null;
};

/**
 * Une las etiquetas de serie con las del usuario, sin duplicar identificadores.
 *
 * `identidad` decide qué guarda la prenda. En color, temporada y ocasión es el
 * `slug`, un identificador estable que sobrevive a los cambios de nombre. En
 * los tipos de prenda es el propio nombre, porque eso es lo que lleva
 * guardando `Item.subcategory` desde el principio y cambiarlo obligaría a
 * migrar el armario entero.
 */
function unir(
  base: readonly Etiqueta[],
  propias: TagBruta[],
  kind: TagKind,
  parent = "",
  identidad: (t: TagBruta) => string = (t) => t.slug,
): Etiqueta[] {
  const conocidos = new Set(base.map((e) => e.id));
  const extra = propias
    .filter((t) => t.kind === kind && (t.parent ?? "") === parent && !conocidos.has(identidad(t)))
    .map((t) => ({
      id: identidad(t),
      label: t.label,
      hex: t.hex ?? undefined,
      propia: true,
      tagId: t.id,
    }));
  return [...base, ...extra];
}

export const colorsWith = (propias: TagBruta[]) =>
  unir(COLORS.map((c) => ({ id: c.id, label: c.label, hex: c.hex })), propias, "color");

export const occasionsWith = (propias: TagBruta[]) =>
  unir(OCCASIONS.map((o) => ({ id: o.id, label: o.label })), propias, "ocasion");

export const seasonsWith = (propias: TagBruta[]) =>
  unir(SEASONS.map((s) => ({ id: s.id, label: s.label })), propias, "temporada");

/** Tipos de prenda de una categoría. El identificador es el propio nombre. */
export const typesWith = (propias: TagBruta[], category: string) =>
  unir(
    (SUBCATEGORIES[category as CategoryId] ?? []).map((s) => ({ id: s, label: s })),
    propias,
    "tipo",
    category,
    (t) => t.label,
  );

/** Etiquetas de serie de una propiedad, cuyos identificadores están reservados. */
export function builtInIds(kind: TagKind, parent = ""): readonly string[] {
  if (kind === "color") return COLOR_IDS;
  if (kind === "ocasion") return OCCASION_IDS;
  if (kind === "temporada") return SEASON_IDS;
  return (SUBCATEGORIES[parent as CategoryId] ?? []).map(slugify);
}

/** Convierte un nombre escrito por el usuario en un identificador estable. */
export function slugify(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

const ids = <T extends { id: string }>(list: readonly T[]) => list.map((x) => x.id);

export const CATEGORY_IDS = ids(CATEGORIES);
export const COLOR_IDS = ids(COLORS);
export const SEASON_IDS = ids(SEASONS);
export const OCCASION_IDS = ids(OCCASIONS);
export const FIGURE_IDS = ids(FIGURES);

export function labelFor(list: readonly { id: string; label: string }[], id: string) {
  return list.find((x) => x.id === id)?.label ?? id;
}

export function colorHex(id: string) {
  return COLORS.find((c) => c.id === id)?.hex ?? "#8A8A90";
}

/** Una prenda solo puede ocupar una capa del avatar; el estudio usa esto para
 *  sustituir automáticamente la prenda anterior de la misma categoría. */
export const LAYER_BY_CATEGORY: Record<string, string> = {
  superior: "torso",
  abrigo: "exterior",
  inferior: "piernas",
  calzado: "pies",
  accesorio: "accesorio",
};
