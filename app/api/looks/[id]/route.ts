import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { handle, optionalString, requireString, ValidationError } from "@/lib/api";
import { ownedItemIds, parseDate, parseOccasion } from "../route";

type Ctx = { params: Promise<{ id: string }> };
const lookInclude = {
  items: { include: { item: true }, orderBy: { position: "asc" } },
} as const;

/** PATCH /api/looks/:id — renombra, reprograma o cambia las prendas del conjunto. */
export async function PATCH(request: NextRequest, { params }: Ctx) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.look.findFirst({ where: { id, userId: user.id } });
    if (!existing) throw new ValidationError("El conjunto no existe");

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = requireString(body.name, "nombre", 80);
    if (body.notes !== undefined) data.notes = optionalString(body.notes, 500);
    if (body.occasion !== undefined) data.occasion = parseOccasion(body.occasion);
    if (body.scheduledAt !== undefined) data.scheduledAt = parseDate(body.scheduledAt);

    if (body.itemIds !== undefined) {
      const itemIds = await ownedItemIds(user.id, body.itemIds);
      if (itemIds.length === 0) throw new ValidationError("El conjunto necesita al menos una prenda");
      // Reemplazo completo: es más simple y barato que calcular el diff.
      data.items = {
        deleteMany: {},
        create: itemIds.map((itemId, position) => ({ itemId, position })),
      };
    }

    const look = await prisma.look.update({ where: { id }, data, include: lookInclude });
    return { look };
  });
}

/** DELETE /api/looks/:id */
export async function DELETE(_request: NextRequest, { params }: Ctx) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await params;
    const { count } = await prisma.look.deleteMany({ where: { id, userId: user.id } });
    if (count === 0) throw new ValidationError("El conjunto no existe");
    return { ok: true };
  });
}
