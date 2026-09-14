"use client";

import { supabase } from "@/lib/supabase/cliente";
import { intentar, siFalla } from "@/lib/datos/errores";
import { filaAItem } from "@/lib/datos/normaliza";
import { borrarFotos } from "@/lib/datos/fotos";
import type { Item } from "@/lib/types";

/** Lo que hacía `app/api/items`, ahora desde el propio dispositivo. */

export type NuevaPrenda = {
  name: string;
  imageUrl: string;
  originalUrl?: string | null;
  imageWidth: number;
  imageHeight: number;
  category: string;
  subcategory: string;
  color: string;
  dominantColor: string;
  season: string;
  occasion: string;
  brand?: string | null;
  notes?: string | null;
  size?: string | null;
  priceCents?: number | null;
  purchasedAt?: string | null;
  placeX: number;
  placeY: number;
  placeW: number;
  placeH: number;
};

export async function listarPrendas(): Promise<Item[]> {
  return intentar("cargando el armario", async () => {
    const { data, error } = await supabase()
      .from("Item")
      .select("*")
      .order("favorite", { ascending: false })
      .order("createdAt", { ascending: false });
    siFalla(error, "cargando el armario");
    return (data ?? []).map(filaAItem);
  });
}

export async function crearPrenda(prenda: NuevaPrenda, uid: string): Promise<Item> {
  return intentar("guardando la prenda", async () => {
    const { data, error } = await supabase()
      .from("Item")
      .insert({ ...prenda, userId: uid })
      .select("*")
      .single();
    siFalla(error, "guardando la prenda");
    return filaAItem(data!);
  });
}

export async function actualizarPrenda(id: string, cambios: Partial<NuevaPrenda> & { favorite?: boolean }) {
  return intentar("guardando los cambios", async () => {
    const { data, error } = await supabase()
      .from("Item")
      .update(cambios)
      .eq("id", id)
      .select("*")
      .single();
    siFalla(error, "guardando los cambios");
    return filaAItem(data!);
  });
}

/**
 * Borra la prenda y, después, sus fotos.
 *
 * En ese orden a propósito: si fallara el borrado de las fotos quedarían unos
 * bytes sueltos en el almacén, molesto pero inofensivo. Al revés dejaría una
 * prenda en el armario apuntando a una foto que ya no existe.
 */
export async function borrarPrenda(item: Item) {
  await intentar("borrando la prenda", async () => {
    const { error } = await supabase().from("Item").delete().eq("id", item.id);
    siFalla(error, "borrando la prenda");
  });
  await borrarFotos([item.imageUrl, item.originalUrl]);
}
