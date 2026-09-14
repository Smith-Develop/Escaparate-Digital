import { CATEGORIES, labelFor } from "@/lib/taxonomy";
import type { Item } from "@/lib/types";

/**
 * Cuánto vale lo que hay en el armario.
 *
 * El precio es opcional al catalogar, así que todos los totales van con su
 * cobertura: decir «has invertido 340» cuando la mitad de las prendas no tiene
 * precio sería mentir con estadísticas. De ahí que cada grupo cuente aparte las
 * prendas sin precio.
 */

export type Grupo = {
  id: string;
  label: string;
  /** Céntimos sumados de las prendas con precio. */
  total: number;
  prendas: number;
  sinPrecio: number;
};

export type Inversion = {
  total: number;
  conPrecio: number;
  sinPrecio: number;
  /** Precio medio de las prendas que sí lo tienen, en céntimos. */
  media: number | null;
  masCara: Item | null;
  porCategoria: Grupo[];
  porTipo: Grupo[];
  porMarca: Grupo[];
  porAño: Grupo[];
};

function agrupar(items: Item[], clave: (item: Item) => string | null): Grupo[] {
  const mapa = new Map<string, Grupo>();
  for (const item of items) {
    const id = clave(item);
    if (id === null) continue;
    const grupo = mapa.get(id) ?? { id, label: id, total: 0, prendas: 0, sinPrecio: 0 };
    grupo.prendas += 1;
    if (item.priceCents === null) grupo.sinPrecio += 1;
    else grupo.total += item.priceCents;
    mapa.set(id, grupo);
  }
  // De más gastado a menos: es el orden en que interesa leerlo.
  return [...mapa.values()].sort((a, b) => b.total - a.total || b.prendas - a.prendas);
}

export function calcularInversion(items: Item[]): Inversion {
  const conPrecio = items.filter((i) => i.priceCents !== null);
  const total = conPrecio.reduce((suma, i) => suma + (i.priceCents ?? 0), 0);

  const porCategoria = agrupar(items, (i) => i.category).map((grupo) => ({
    ...grupo,
    label: labelFor(CATEGORIES, grupo.id),
  }));

  return {
    total,
    conPrecio: conPrecio.length,
    sinPrecio: items.length - conPrecio.length,
    media: conPrecio.length > 0 ? Math.round(total / conPrecio.length) : null,
    masCara: conPrecio.reduce<Item | null>(
      (mejor, i) => (mejor === null || (i.priceCents ?? 0) > (mejor.priceCents ?? 0) ? i : mejor),
      null,
    ),
    // El orden de las categorías es el de la taxonomía, no el del gasto: es una
    // lista corta y fija, y se lee mejor si siempre aparece igual.
    porCategoria: CATEGORIES.map(
      (c) =>
        porCategoria.find((g) => g.id === c.id) ?? {
          id: c.id,
          label: c.label,
          total: 0,
          prendas: 0,
          sinPrecio: 0,
        },
    ),
    porTipo: agrupar(items, (i) => i.subcategory),
    porMarca: agrupar(items, (i) => i.brand?.trim() || null),
    porAño: agrupar(items, (i) =>
      // En UTC, igual que se guardó: convertirla movería el día elegido y, en
      // un 1 de enero, también el año.
      i.purchasedAt ? String(new Date(i.purchasedAt).getUTCFullYear()) : null,
    ).sort((a, b) => b.id.localeCompare(a.id)),
  };
}
