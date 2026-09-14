/** Tipos serializados que viajan del servidor a los componentes de cliente. */

export type Item = {
  id: string;
  name: string;
  imageUrl: string;
  originalUrl: string | null;
  imageWidth: number;
  imageHeight: number;
  /** Colocación guardada en el probador, relativa al lienzo. */
  placeX: number;
  placeY: number;
  placeW: number;
  placeH: number;
  category: string;
  subcategory: string;
  color: string;
  dominantColor: string;
  season: string;
  occasion: string;
  brand: string | null;
  notes: string | null;
  /** Talla tal como viene en la etiqueta. */
  size: string | null;
  /** Precio aproximado en céntimos. */
  priceCents: number | null;
  /** Las fechas cruzan el límite servidor/cliente como objetos `Date`. */
  purchasedAt: Date | null;
  favorite: boolean;
};

/** Color u ocasión creada por el propio usuario. */
export type Tag = {
  id: string;
  kind: string;
  slug: string;
  label: string;
  hex: string | null;
};

export type AvatarParams = {
  /** Silueta base: neutra | femenina | masculina */
  figure: string;
  heightCm: number;
  weightKg: number;
  /** Medidas en centímetros, tal como se toman con una cinta métrica. */
  shoulderCm: number;
  chestCm: number;
  waistCm: number;
  hipCm: number;
  neckCm: number;
  thighCm: number;
  bicepCm: number;
  inseamCm: number;
  armCm: number;
  footCm: number;
  /** Foto de cuerpo entero que hace de base en el probador. */
  photoUrl: string | null;
  photoX: number;
  photoY: number;
  photoW: number;
  photoH: number;
  skinTone: string;
  hairColor: string;
  hairStyle: string;
};

/**
 * Datos del conjunto que se está editando. Se guardan en el estado junto al id
 * para que la hoja de guardado pueda precargar el nombre, la ocasión y la fecha
 * sin tener que acarrear la lista entera de looks hasta ella.
 */
export type EditingLook = Pick<Look, "id" | "name" | "occasion" | "scheduledAt">;

export type Look = {
  id: string;
  name: string;
  notes: string | null;
  occasion: string | null;
  scheduledAt: string | null;
  items: Item[];
};
