import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { handle, ValidationError } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

/**
 * DELETE /api/tags/:id
 *
 * Se niega a borrar una etiqueta que esté en uso: dejaría prendas apuntando a
 * un color o una ocasión que ya no existe, y desaparecerían de los filtros sin
 * explicación.
 */
export async function DELETE(_request: NextRequest, { params }: Ctx) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await params;

    const tag = await prisma.tag.findFirst({ where: { id, userId: user.id } });
    if (!tag) throw new ValidationError("La etiqueta no existe");

    const enUso = await prisma.item.count({
      where:
        tag.kind === "color"
          ? { userId: user.id, color: tag.slug }
          : { userId: user.id, occasion: tag.slug },
    });
    if (enUso > 0) {
      throw new ValidationError(
        `«${tag.label}» está en ${enUso} ${enUso === 1 ? "prenda" : "prendas"}. Cámbialas antes de borrarla.`,
      );
    }

    await prisma.tag.delete({ where: { id } });
    return { ok: true };
  });
}
