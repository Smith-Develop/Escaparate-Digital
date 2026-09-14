import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { requireUser } from "@/lib/auth";
import { handle, ValidationError } from "@/lib/api";

const MAX_BYTES = 8 * 1024 * 1024;
const EXT_BY_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export const runtime = "nodejs";

/**
 * POST /api/upload — guarda una foto de prenda en /public/uploads/<userId>/.
 * El recorte de fondo se hace en el navegador antes de llamar aquí, de modo que
 * el servidor solo persiste el resultado.
 */
export async function POST(request: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) throw new ValidationError("No se ha recibido ninguna imagen");
    if (file.size > MAX_BYTES) throw new ValidationError("La imagen supera los 8 MB");

    const ext = EXT_BY_TYPE[file.type];
    if (!ext) throw new ValidationError("Formato no admitido (usa PNG, JPEG o WebP)");

    const dir = path.join(process.cwd(), "public", "uploads", user.id);
    await mkdir(dir, { recursive: true });

    const filename = `${randomUUID()}.${ext}`;
    await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));

    return { url: `/uploads/${user.id}/${filename}` };
  });
}

export function GET() {
  return NextResponse.json({ error: "Método no permitido" }, { status: 405 });
}
