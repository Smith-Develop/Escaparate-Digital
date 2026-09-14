import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import {
  clampFloat,
  clampInt,
  handle,
  hexColor,
  optionalDate,
  optionalPrice,
  optionalString,
  requireOneOf,
  requireString,
  requireTag,
} from "@/lib/api";
import {
  CATEGORY_IDS,
  COLOR_IDS,
  OCCASION_IDS,
  SEASON_IDS,
} from "@/lib/taxonomy";

/** GET /api/items — prendas del usuario, con filtros opcionales por query. */
export async function GET(request: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const q = request.nextUrl.searchParams;
    const eq = (key: string) => {
      const value = q.get(key);
      return value && value !== "todas" ? value : undefined;
    };

    const items = await prisma.item.findMany({
      where: {
        userId: user.id,
        category: eq("category"),
        color: eq("color"),
        season: eq("season"),
        occasion: eq("occasion"),
      },
      orderBy: { createdAt: "desc" },
    });
    return { items };
  });
}

/** POST /api/items — cataloga una prenda nueva ya subida a /api/upload. */
export async function POST(request: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const body = await request.json();

    const item = await prisma.item.create({
      data: {
        userId: user.id,
        name: requireString(body.name, "nombre", 80),
        imageUrl: requireString(body.imageUrl, "imagen", 500),
        originalUrl: optionalString(body.originalUrl, 500),
        imageWidth: clampInt(body.imageWidth, 0, 20000, 0),
        imageHeight: clampInt(body.imageHeight, 0, 20000, 0),
        // Colocación sobre el lienzo del probador, decidida por el usuario.
        placeX: clampFloat(body.placeX, -0.2, 1.2, 0.5),
        placeY: clampFloat(body.placeY, -0.35, 1.1, 0.2),
        placeW: clampFloat(body.placeW, 0.08, 1.6, 0.6),
        placeH: clampFloat(body.placeH, 0, 1.6, 0),
        category: requireOneOf(body.category, CATEGORY_IDS, "categoría"),
        subcategory: requireString(body.subcategory, "subcategoría", 60),
        color: await requireTag(body.color, COLOR_IDS, "color", user.id, "color"),
        dominantColor: hexColor(body.dominantColor, "#B9B4AC"),
        season: requireOneOf(body.season, SEASON_IDS, "temporada"),
        occasion: await requireTag(body.occasion, OCCASION_IDS, "ocasion", user.id, "ocasión"),
        brand: optionalString(body.brand, 60),
        notes: optionalString(body.notes, 500),
        size: optionalString(body.size, 20),
        priceCents: optionalPrice(body.priceCents),
        purchasedAt: optionalDate(body.purchasedAt),
      },
    });
    return { item };
  });
}
