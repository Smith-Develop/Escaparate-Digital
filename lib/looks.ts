import "server-only";
import type { Prisma } from "@prisma/client";
import type { Look } from "@/lib/types";

/**
 * Proyección de un conjunto con sus prendas en orden de apilado.
 *
 * Vive aquí para que el estudio, el lookbook y la API no tengan tres copias de
 * la misma consulta: si una de ellas olvidara el `orderBy`, al reabrir un look
 * la camisa podría aparecer por debajo del pantalón.
 */
export const lookInclude = {
  items: { include: { item: true }, orderBy: { position: "asc" } },
} satisfies Prisma.LookInclude;

type LookConPrendas = Prisma.LookGetPayload<{ include: typeof lookInclude }>;

/** Pasa un conjunto de la base de datos al tipo que consume el cliente. */
export function serializeLook(look: LookConPrendas): Look {
  return {
    id: look.id,
    name: look.name,
    notes: look.notes,
    occasion: look.occasion,
    // Las fechas no cruzan el límite servidor/cliente como objetos.
    scheduledAt: look.scheduledAt?.toISOString() ?? null,
    items: look.items.map((fila) => fila.item),
  };
}

/** Orden con el que se enseñan los conjuntos, igual en el lookbook y el estudio. */
export const lookOrderBy = [
  { scheduledAt: "asc" },
  { updatedAt: "desc" },
] satisfies Prisma.LookOrderByWithRelationInput[];
