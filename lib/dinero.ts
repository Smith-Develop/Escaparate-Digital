/**
 * Dinero del armario.
 *
 * Los precios se guardan en céntimos como enteros: sumar decimales en coma
 * flotante acaba enseñando 1.229,999999 en el total del armario. La app no pide
 * la moneda en ningún momento, así que aquí no se imprime ningún símbolo; el
 * usuario sabe en qué moneda anota sus precios.
 */

/** «39,90» a partir de 3990 céntimos. */
export function centimosATexto(centimos: number, decimales = 2) {
  return (centimos / 100).toLocaleString("es-ES", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
}

/** Totales grandes sin decimales: en un resumen, los céntimos son ruido. */
export const centimosRedondeados = (centimos: number) => centimosATexto(centimos, 0);

/** Lee lo que escribe el usuario: admite coma o punto como separador decimal. */
export function precioACentimos(texto: string) {
  const limpio = texto.replace(/[^\d,.]/g, "").replace(",", ".");
  if (!limpio) return null;
  const valor = Number.parseFloat(limpio);
  return Number.isFinite(valor) ? Math.round(valor * 100) : null;
}

/**
 * Tramos de precio del filtro, en céntimos.
 *
 * «Sin precio» es un tramo más y no un descuido: sirve para encontrar justo las
 * prendas a las que les falta el dato y completarlas.
 */
export const PRICE_RANGES = [
  { id: "sin", label: "Sin precio", min: null, max: null },
  { id: "0-2000", label: "Hasta 20", min: 0, max: 2000 },
  { id: "2000-5000", label: "20 – 50", min: 2000, max: 5000 },
  { id: "5000-10000", label: "50 – 100", min: 5000, max: 10000 },
  { id: "10000+", label: "Más de 100", min: 10000, max: Number.POSITIVE_INFINITY },
] as const;

export function enRangoDePrecio(priceCents: number | null, rango: string) {
  if (rango === "todas") return true;
  if (rango === "sin") return priceCents === null;
  if (priceCents === null) return false;
  const tramo = PRICE_RANGES.find((r) => r.id === rango);
  if (!tramo || tramo.min === null) return false;
  return priceCents >= tramo.min && priceCents < tramo.max;
}
