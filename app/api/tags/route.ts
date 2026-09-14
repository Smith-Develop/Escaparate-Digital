import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { handle, hexColor, requireOneOf, requireString, ValidationError } from "@/lib/api";
import { COLOR_IDS, OCCASION_IDS, slugify } from "@/lib/taxonomy";

const KINDS = ["color", "ocasion"];

/** GET /api/tags — colores y ocasiones que ha creado el usuario. */
export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    const tags = await prisma.tag.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });
    return { tags };
  });
}

/** POST /api/tags — crea un color o una ocasión propios. */
export async function POST(request: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const body = await request.json();

    const kind = requireOneOf(body.kind, KINDS, "tipo");
    const label = requireString(body.label, "nombre", 40);
    const slug = slugify(label);
    if (!slug) throw new ValidationError("Ese nombre no vale como etiqueta");

    // Los identificadores de serie están reservados: si coincidieran, la prenda
    // no sabría a cuál de los dos se refiere.
    const reservados = kind === "color" ? COLOR_IDS : OCCASION_IDS;
    if (reservados.includes(slug)) {
      throw new ValidationError(`Ya existe «${label}» entre las opciones de serie`);
    }

    const existe = await prisma.tag.findUnique({
      where: { userId_kind_slug: { userId: user.id, kind, slug } },
    });
    if (existe) throw new ValidationError(`Ya tienes una etiqueta llamada «${label}»`);

    const tag = await prisma.tag.create({
      data: {
        userId: user.id,
        kind,
        slug,
        label,
        hex: kind === "color" ? hexColor(body.hex, "#8A8A90") : null,
      },
    });
    return { tag };
  });
}
