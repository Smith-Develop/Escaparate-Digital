import type { Item } from "@/lib/types";

/**
 * El telón del probador, teñido con la ropa que se lleva puesta.
 *
 * Cada prenda guarda el color dominante de su foto, así que el fondo puede
 * responder a lo que hay encima del maniquí en lugar de ser siempre el mismo.
 *
 * La mezcla se hace con `color-mix` de CSS y no en JavaScript a propósito: el
 * segundo color de cada parada es `--color-surface`, que vale blanco de día y
 * carbón de noche, de modo que el mismo degradado se apastela solo en claro y
 * se apaga en oscuro sin tener que calcular dos versiones.
 */
export function degradadoDelConjunto(equipped: Item[]): string {
  const colores = equipped
    .map((i) => i.dominantColor)
    .filter((c): c is string => /^#[0-9a-fA-F]{6}$/.test(c ?? ""));

  if (colores.length === 0) {
    // Sin nada puesto, un telón neutro: el maniquí es el protagonista.
    return "linear-gradient(165deg, var(--color-surface-2), var(--color-surface))";
  }

  // Tres paradas bastan: más colores en un degradado pequeño se emborronan
  // entre sí y el resultado acaba siendo gris.
  const paradas = [colores[0], colores[Math.floor(colores.length / 2)], colores.at(-1)!]
    .slice(0, Math.min(3, colores.length))
    .map((color, i) => {
      const fuerza = [30, 22, 16][i] ?? 18;
      return `color-mix(in oklab, ${color} ${fuerza}%, var(--color-surface))`;
    });

  return `linear-gradient(165deg, ${paradas.join(", ")})`;
}
