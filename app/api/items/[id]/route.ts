import { NextRequest } from "next/server";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import {
  clampFloat,
  handle,
  optionalDate,
  optionalPrice,
  optionalString,
  requireOneOf,
  requireString,
  requireTag,
  ValidationError,
} from "@/lib/api";
import { CATEGORY_IDS, COLOR_IDS, OCCASION_IDS, SEASON_IDS } from "@/lib/taxonomy";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/items/:id — edita metadatos o marca la prenda como favorita. */
export async function PATCH(request: NextRequest, { params }: Ctx) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.item.findFirst({ where: { id, userId: user.id } });
    if (!existing) throw new ValidationError("La prenda no existe");

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = requireString(body.name, "nombre", 80);
    if (body.category !== undefined)
      data.category = requireOneOf(body.category, CATEGORY_IDS, "categoría");
    if (body.subcategory !== undefined)
      data.subcategory = requireString(body.subcategory, "subcategoría", 60);
    if (body.color !== undefined)
      data.color = await requireTag(body.color, COLOR_IDS, "color", user.id, "color");
    if (body.season !== undefined) data.season = requireOneOf(body.season, SEASON_IDS, "temporada");
    if (body.occasion !== undefined)
      data.occasion = await requireTag(body.occasion, OCCASION_IDS, "ocasion", user.id, "ocasión");
    if (body.brand !== undefined) data.brand = optionalString(body.brand, 60);
    if (body.notes !== undefined) data.notes = optionalString(body.notes, 500);
    if (body.size !== undefined) data.size = optionalString(body.size, 20);
    if (body.priceCents !== undefined) data.priceCents = optionalPrice(body.priceCents);
    if (body.purchasedAt !== undefined) data.purchasedAt = optionalDate(body.purchasedAt);
    if (body.favorite !== undefined) data.favorite = Boolean(body.favorite);

    // Recolocar la prenda desde su ficha, sin tener que volver a subirla.
    if (body.placeX !== undefined) data.placeX = clampFloat(body.placeX, -0.2, 1.2, existing.placeX);
    if (body.placeY !== undefined) data.placeY = clampFloat(body.placeY, -0.35, 1.1, existing.placeY);
    if (body.placeW !== undefined) data.placeW = clampFloat(body.placeW, 0.08, 1.6, existing.placeW);
    if (body.placeH !== undefined) data.placeH = clampFloat(body.placeH, 0, 1.6, existing.placeH);

    const item = await prisma.item.update({ where: { id }, data });
    return { item };
  });
}

/** DELETE /api/items/:id — borra la prenda y sus imágenes del disco. */
export async function DELETE(_request: NextRequest, { params }: Ctx) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await params;

    const item = await prisma.item.findFirst({ where: { id, userId: user.id } });
    if (!item) throw new ValidationError("La prenda no existe");

    await prisma.item.delete({ where: { id } });

    // Las imágenes viven en /public/uploads; si el borrado falla no es crítico.
    for (const url of [item.imageUrl, item.originalUrl]) {
      if (!url?.startsWith("/uploads/")) continue;
      await unlink(path.join(process.cwd(), "public", url)).catch(() => {});
    }
    return { ok: true };
  });
}
