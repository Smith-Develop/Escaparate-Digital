import type { AvatarParams, Item, Look, Tag } from "@/lib/types";

/**
 * Filas de Supabase → tipos de la aplicación.
 *
 * El punto delicado son las fechas. Prisma devolvía objetos `Date`; PostgREST
 * devuelve cadenas. Hay componentes que llaman a `.toLocaleDateString()` sobre
 * `purchasedAt`, así que sin revivirlas aquí reventarían en ejecución sin que
 * TypeScript dijera nada. Se hace en un único sitio a propósito: dos formas de
 * representar el mismo campo, según venga de la red o de la caché, es la mejor
 * receta para un error imposible de encontrar.
 */

type Fila = Record<string, unknown>;

const fecha = (valor: unknown): Date | null =>
  typeof valor === "string" && valor ? new Date(valor) : null;

/** Cadena ISO con Z, exactamente como la servía el servidor de antes. */
const iso = (valor: unknown): string | null => {
  const d = fecha(valor);
  return d && !Number.isNaN(d.getTime()) ? d.toISOString() : null;
};

export function filaAItem(fila: Fila): Item {
  return {
    id: String(fila.id),
    name: String(fila.name),
    imageUrl: String(fila.imageUrl),
    originalUrl: (fila.originalUrl as string | null) ?? null,
    imageWidth: Number(fila.imageWidth ?? 0),
    imageHeight: Number(fila.imageHeight ?? 0),
    placeX: Number(fila.placeX ?? 0.5),
    placeY: Number(fila.placeY ?? 0.2),
    placeW: Number(fila.placeW ?? 0.6),
    placeH: Number(fila.placeH ?? 0),
    category: String(fila.category),
    subcategory: String(fila.subcategory),
    color: String(fila.color),
    dominantColor: String(fila.dominantColor ?? "#B9B4AC"),
    season: String(fila.season),
    occasion: String(fila.occasion),
    brand: (fila.brand as string | null) ?? null,
    notes: (fila.notes as string | null) ?? null,
    size: (fila.size as string | null) ?? null,
    priceCents: fila.priceCents === null || fila.priceCents === undefined ? null : Number(fila.priceCents),
    purchasedAt: fecha(fila.purchasedAt),
    favorite: Boolean(fila.favorite),
    createdAt: fecha(fila.createdAt) ?? new Date(0),
  };
}

export function filaATag(fila: Fila): Tag {
  return {
    id: String(fila.id),
    kind: String(fila.kind),
    parent: String(fila.parent ?? ""),
    slug: String(fila.slug),
    label: String(fila.label),
    hex: (fila.hex as string | null) ?? null,
  };
}

export function filaAAvatar(fila: Fila): AvatarParams {
  const n = (clave: string, porDefecto: number) => Number(fila[clave] ?? porDefecto);
  return {
    figure: String(fila.figure ?? "neutra"),
    heightCm: n("heightCm", 170),
    weightKg: n("weightKg", 68),
    shoulderCm: n("shoulderCm", 42),
    chestCm: n("chestCm", 96),
    waistCm: n("waistCm", 80),
    hipCm: n("hipCm", 98),
    neckCm: n("neckCm", 37),
    thighCm: n("thighCm", 54),
    bicepCm: n("bicepCm", 30),
    inseamCm: n("inseamCm", 80),
    armCm: n("armCm", 60),
    footCm: n("footCm", 26),
    photoUrl: (fila.photoUrl as string | null) ?? null,
    photoX: n("photoX", 0.5),
    photoY: n("photoY", 0.02),
    photoW: n("photoW", 0.86),
    photoH: n("photoH", 0),
  };
}

type FilaLook = Fila & { items?: { position: number; item: Fila }[] | null };

export function filaALook(fila: FilaLook): Look {
  const prendas = [...(fila.items ?? [])].sort((a, b) => a.position - b.position);
  return {
    id: String(fila.id),
    name: String(fila.name),
    notes: (fila.notes as string | null) ?? null,
    occasion: (fila.occasion as string | null) ?? null,
    scheduledAt: iso(fila.scheduledAt),
    items: prendas.map((fila) => filaAItem(fila.item)),
  };
}
