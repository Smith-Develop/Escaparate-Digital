"use client";

import { supabase } from "@/lib/supabase/cliente";
import { ErrorDeDatos, intentar, siFalla } from "@/lib/datos/errores";
import { filaATag } from "@/lib/datos/normaliza";
import { builtInIds, slugify, TAG_KIND_YA_TIENES, type TagKind } from "@/lib/taxonomy";
import type { Tag } from "@/lib/types";

/** Lo que hacía `app/api/tags`. */

export async function listarEtiquetas(): Promise<Tag[]> {
  return intentar("cargando tus etiquetas", async () => {
    const { data, error } = await supabase()
      .from("Tag")
      .select("*")
      .order("createdAt", { ascending: true });
    siFalla(error, "cargando tus etiquetas");
    return (data ?? []).map(filaATag);
  });
}

export async function crearEtiqueta(
  { kind, parent = "", label, hex }: { kind: TagKind; parent?: string; label: string; hex?: string | null },
  uid: string,
): Promise<Tag> {
  const nombre = label.trim();
  const slug = slugify(nombre);
  if (!nombre) throw new ErrorDeDatos("Escribe un nombre");
  if (!slug) throw new ErrorDeDatos("Ese nombre no vale como etiqueta");

  // Los identificadores de serie están reservados: si coincidieran, la prenda
  // no sabría a cuál de los dos se refiere.
  if (builtInIds(kind, parent).includes(slug)) {
    throw new ErrorDeDatos(`Ya existe «${nombre}» entre las opciones de serie`);
  }

  return intentar("creando la etiqueta", async () => {
    const { data, error } = await supabase()
      .from("Tag")
      .insert({ userId: uid, kind, parent, slug, label: nombre, hex: kind === "color" ? hex ?? "#8A8A90" : null })
      .select("*")
      .single();
    // El índice único de la base es quien detecta el repetido; se traduce a un
    // mensaje que diga de qué propiedad se trata.
    if (error && (error as { code?: string }).code === "23505") {
      throw new ErrorDeDatos(`Ya tienes ${TAG_KIND_YA_TIENES[kind]} «${nombre}»`);
    }
    siFalla(error, "creando la etiqueta");
    return filaATag(data!);
  });
}

/**
 * Renombra una etiqueta propia.
 *
 * En color, temporada y ocasión la prenda guarda el `slug`, que no cambia
 * nunca: renombrar no desvincula nada. En los tipos el valor guardado es el
 * propio nombre (`Item.subcategory`), así que hay que renombrarlo también en
 * las prendas.
 */
export async function renombrarEtiqueta(etiqueta: Tag, nombre: string, hex?: string | null): Promise<Tag> {
  const limpio = nombre.trim();
  const slug = slugify(limpio);
  const kind = etiqueta.kind as TagKind;
  if (!limpio || !slug) throw new ErrorDeDatos("Ese nombre no vale como etiqueta");
  if (slug !== etiqueta.slug && builtInIds(kind, etiqueta.parent).includes(slug)) {
    throw new ErrorDeDatos(`Ya existe «${limpio}» entre las opciones de serie`);
  }

  return intentar("renombrando la etiqueta", async () => {
    const cambios: Record<string, unknown> = { label: limpio };
    if (kind === "color") cambios.hex = hex ?? etiqueta.hex ?? "#8A8A90";
    if (kind === "tipo") cambios.slug = slug;

    const { data, error } = await supabase()
      .from("Tag")
      .update(cambios)
      .eq("id", etiqueta.id)
      .select("*")
      .single();
    if (error && (error as { code?: string }).code === "23505") {
      throw new ErrorDeDatos(`Ya tienes ${TAG_KIND_YA_TIENES[kind]} «${limpio}»`);
    }
    siFalla(error, "renombrando la etiqueta");

    if (kind === "tipo" && limpio !== etiqueta.label) {
      const { error: errPrendas } = await supabase()
        .from("Item")
        .update({ subcategory: limpio })
        .eq("category", etiqueta.parent)
        .eq("subcategory", etiqueta.label);
      siFalla(errPrendas, "renombrando las prendas de ese tipo");
    }
    return filaATag(data!);
  });
}

/**
 * Borra una etiqueta propia, salvo que esté en uso.
 *
 * La comprobación la hacía el servidor; ahora se hace aquí. No es una frontera
 * de seguridad —quien quiera puede saltársela—, pero sí evita el destrozo
 * involuntario: prendas apuntando a un valor que ya no existe, desaparecidas de
 * los filtros sin explicación.
 */
export async function borrarEtiqueta(etiqueta: Tag) {
  const columna: Record<string, string> = {
    color: "color",
    ocasion: "occasion",
    temporada: "season",
  };

  return intentar("borrando la etiqueta", async () => {
    const consulta = supabase().from("Item").select("id", { count: "exact" }).limit(1);
    const { count, error: errUso } =
      etiqueta.kind === "tipo"
        ? await consulta.eq("category", etiqueta.parent).eq("subcategory", etiqueta.label)
        : await consulta.eq(columna[etiqueta.kind], etiqueta.slug);
    siFalla(errUso, "comprobando si la etiqueta está en uso");

    if (count && count > 0) {
      throw new ErrorDeDatos(
        `«${etiqueta.label}» está en ${count} ${count === 1 ? "prenda" : "prendas"}. Cámbialas antes de borrarla.`,
      );
    }

    const { error } = await supabase().from("Tag").delete().eq("id", etiqueta.id);
    siFalla(error, "borrando la etiqueta");
  });
}
