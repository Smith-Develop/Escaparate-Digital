import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { handle, optionalString, requireString, ValidationError } from "@/lib/api";
import { OCCASION_IDS } from "@/lib/taxonomy";

// Los conjuntos se devuelven en su orden de apilado: sin él, al reabrir un look
// la camisa podría aparecer por debajo del pantalón.
const lookInclude = {
  items: { include: { item: true }, orderBy: { position: "asc" } },
} as const;

/** GET /api/looks — conjuntos guardados con sus prendas. */
export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    const looks = await prisma.look.findMany({
      where: { userId: user.id },
      include: lookInclude,
      orderBy: [{ scheduledAt: "asc" }, { updatedAt: "desc" }],
    });
    return { looks };
  });
}

/** POST /api/looks — guarda el conjunto que el usuario ha montado en el estudio. */
export async function POST(request: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const body = await request.json();

    const name = requireString(body.name, "nombre", 80);
    const itemIds = await ownedItemIds(user.id, body.itemIds);
    if (itemIds.length === 0) throw new ValidationError("Añade al menos una prenda al conjunto");

    const look = await prisma.look.create({
      data: {
        userId: user.id,
        name,
        notes: optionalString(body.notes, 500),
        occasion: parseOccasion(body.occasion),
        scheduledAt: parseDate(body.scheduledAt),
        items: { create: itemIds.map((itemId, position) => ({ itemId, position })) },
      },
      include: lookInclude,
    });
    return { look };
  });
}

/** Filtra los ids recibidos dejando solo prendas del usuario, en el orden dado. */
export async function ownedItemIds(userId: string, raw: unknown) {
  if (!Array.isArray(raw)) throw new ValidationError("Lista de prendas no válida");
  const ids = raw.filter((id): id is string => typeof id === "string");
  const owned = await prisma.item.findMany({
    where: { userId, id: { in: ids } },
    select: { id: true },
  });
  // Se respeta el orden de llegada, que es el de apilado elegido por el usuario.
  const allowed = new Set(owned.map((i) => i.id));
  return ids.filter((id) => allowed.has(id));
}

export function parseOccasion(value: unknown) {
  return typeof value === "string" && OCCASION_IDS.includes(value) ? value : null;
}

export function parseDate(value: unknown) {
  if (!value || typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
