"use client";

import { supabase } from "@/lib/supabase/cliente";
import { ErrorDeDatos, intentar, siFalla } from "@/lib/datos/errores";
import { filaALook } from "@/lib/datos/normaliza";
import type { Look } from "@/lib/types";

/** Lo que hacía `app/api/looks`. */

// El orden de apilado vive en `position`: si se perdiera, al reabrir un look la
// camisa podría aparecer por debajo del pantalón.
const CONSULTA = "*, items:LookItem(position, item:Item(*))";

export async function listarLooks(): Promise<Look[]> {
  return intentar("cargando tus looks", async () => {
    const { data, error } = await supabase()
      .from("Look")
      .select(CONSULTA)
      // Primero los que tienen día asignado, en orden; después el resto, por
      // lo último tocado.
      .order("scheduledAt", { ascending: true, nullsFirst: false })
      .order("updatedAt", { ascending: false });
    siFalla(error, "cargando tus looks");
    return (data ?? []).map(filaALook);
  });
}

type DatosLook = {
  name: string;
  notes?: string | null;
  occasion?: string | null;
  scheduledAt?: string | null;
  itemIds: string[];
};

/**
 * Guarda las prendas de un look.
 *
 * Va en una sentencia aparte de la del look, y no por gusto: la política de
 * `LookItem` comprueba que el look sea tuyo, y dentro de la misma sentencia que
 * lo crea todavía no lo ve. Está documentado en 0002_rls.sql.
 */
async function guardarPrendas(lookId: string, itemIds: string[]) {
  const filas = itemIds.map((itemId, position) => ({ lookId, itemId, position }));
  if (filas.length === 0) return;
  const { error } = await supabase().from("LookItem").insert(filas);
  siFalla(error, "guardando las prendas del look");
}

export async function crearLook(datos: DatosLook, uid: string): Promise<string> {
  if (datos.itemIds.length === 0) throw new ErrorDeDatos("El look no tiene ninguna prenda");

  return intentar("guardando el look", async () => {
    const { data, error } = await supabase()
      .from("Look")
      .insert({
        userId: uid,
        name: datos.name.trim(),
        notes: datos.notes ?? null,
        occasion: datos.occasion ?? null,
        scheduledAt: datos.scheduledAt ?? null,
      })
      .select("id")
      .single();
    siFalla(error, "guardando el look");

    await guardarPrendas(data!.id, datos.itemIds);
    return data!.id as string;
  });
}

export async function actualizarLook(id: string, datos: Partial<DatosLook>) {
  return intentar("actualizando el look", async () => {
    const cambios: Record<string, unknown> = {};
    if (datos.name !== undefined) cambios.name = datos.name.trim();
    if (datos.notes !== undefined) cambios.notes = datos.notes;
    if (datos.occasion !== undefined) cambios.occasion = datos.occasion;
    if (datos.scheduledAt !== undefined) cambios.scheduledAt = datos.scheduledAt;

    if (Object.keys(cambios).length > 0) {
      const { error } = await supabase().from("Look").update(cambios).eq("id", id);
      siFalla(error, "actualizando el look");
    }

    // Cambiar las prendas es sustituirlas enteras: mantener el orden con
    // altas y bajas sueltas sería más frágil que rehacer la lista.
    if (datos.itemIds) {
      const { error } = await supabase().from("LookItem").delete().eq("lookId", id);
      siFalla(error, "actualizando las prendas del look");
      await guardarPrendas(id, datos.itemIds);
    }
  });
}

export async function borrarLook(id: string) {
  return intentar("borrando el look", async () => {
    const { error } = await supabase().from("Look").delete().eq("id", id);
    siFalla(error, "borrando el look");
  });
}
