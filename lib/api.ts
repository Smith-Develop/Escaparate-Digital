import { NextResponse } from "next/server";
import { UnauthorizedError } from "@/lib/auth";

/** Envoltura común de los handlers de /api: traduce errores a respuestas JSON. */
export async function handle<T>(fn: () => Promise<T>) {
  try {
    return NextResponse.json(await fn());
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export class ValidationError extends Error {}

export function requireString(value: unknown, field: string, max = 200) {
  if (typeof value !== "string" || !value.trim()) {
    throw new ValidationError(`El campo "${field}" es obligatorio`);
  }
  const trimmed = value.trim();
  if (trimmed.length > max) {
    throw new ValidationError(`El campo "${field}" supera los ${max} caracteres`);
  }
  return trimmed;
}

export function requireOneOf(value: unknown, allowed: readonly string[], field: string) {
  const v = requireString(value, field);
  if (!allowed.includes(v)) {
    throw new ValidationError(`Valor no válido para "${field}": ${v}`);
  }
  return v;
}

export function optionalString(value: unknown, max = 500) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") return null;
  return value.trim().slice(0, max) || null;
}

export function clampInt(value: unknown, min: number, max: number, fallback: number) {
  const n = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/**
 * Comprueba una etiqueta que puede ser de serie o creada por el usuario.
 *
 * Se consulta la tabla solo cuando el valor no está entre las de serie, que es
 * el caso raro: así el alta de una prenda normal no paga una consulta extra.
 */
export async function requireTag(
  valor: unknown,
  deSerie: readonly string[],
  kind: "color" | "ocasion",
  userId: string,
  campo: string,
) {
  const v = requireString(valor, campo, 40);
  if (deSerie.includes(v)) return v;

  const { prisma } = await import("@/lib/prisma");
  const propia = await prisma.tag.findUnique({
    where: { userId_kind_slug: { userId, kind, slug: v } },
  });
  if (!propia) throw new ValidationError(`Valor no válido para "${campo}": ${v}`);
  return v;
}

export function clampFloat(value: unknown, min: number, max: number, fallback: number) {
  const n = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/** Precio en céntimos: entero, no negativo y con un techo sensato. */
export function optionalPrice(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.min(Math.round(n), 100_000_000);
}

export function optionalDate(value: unknown) {
  if (!value || typeof value !== "string") return null;
  const fecha = new Date(value);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

const HEX = /^#[0-9a-fA-F]{6}$/;
export function hexColor(value: unknown, fallback: string) {
  return typeof value === "string" && HEX.test(value) ? value : fallback;
}
