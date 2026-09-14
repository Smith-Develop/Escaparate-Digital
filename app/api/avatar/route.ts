import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { clampFloat, clampInt, handle, hexColor, optionalString, requireOneOf } from "@/lib/api";
import { FIGURE_IDS, HAIR_STYLE_IDS, MEASUREMENTS } from "@/lib/taxonomy";

/** GET /api/avatar — medidas del usuario (se crean por defecto si no existen). */
export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    const avatar =
      (await prisma.avatar.findUnique({ where: { userId: user.id } })) ??
      (await prisma.avatar.create({ data: { userId: user.id } }));
    return { avatar };
  });
}

/** PUT /api/avatar — actualiza las medidas con las que se dibuja la silueta. */
export async function PUT(request: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const body = await request.json();

    // Cada medida se recorta a su rango: una cintura de 400 cm rompería el
    // dibujo, y el usuario puede equivocarse al teclear.
    const sizes = Object.fromEntries(
      MEASUREMENTS.map((field) => [
        field.key,
        clampInt(body[field.key], field.min, field.max, field.min),
      ]),
    ) as Record<string, number>;

    const data = {
      ...sizes,
      // La foto es opcional: enviar cadena vacía la retira.
      photoUrl: optionalString(body.photoUrl, 500),
      photoX: clampFloat(body.photoX, -0.2, 1.2, 0.5),
      photoY: clampFloat(body.photoY, -0.35, 1.1, 0.02),
      photoW: clampFloat(body.photoW, 0.08, 1.6, 0.86),
      photoH: clampFloat(body.photoH, 0, 1.6, 0),
      figure: requireOneOf(body.figure, FIGURE_IDS, "silueta"),
      skinTone: hexColor(body.skinTone, "#C89F7B"),
      hairColor: hexColor(body.hairColor, "#2B2118"),
      hairStyle: requireOneOf(body.hairStyle, HAIR_STYLE_IDS, "peinado"),
    };

    const avatar = await prisma.avatar.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...data },
      update: data,
    });
    return { avatar };
  });
}
