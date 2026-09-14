"use client";

import { supabase } from "@/lib/supabase/cliente";
import { intentar, siFalla } from "@/lib/datos/errores";
import { filaAAvatar } from "@/lib/datos/normaliza";
import { borrarFotos } from "@/lib/datos/fotos";
import type { AvatarParams } from "@/lib/types";

/** Lo que hacía `app/api/avatar`. */

export async function leerAvatar(uid: string): Promise<AvatarParams> {
  return intentar("cargando tus medidas", async () => {
    const { data, error } = await supabase().from("Avatar").select("*").eq("userId", uid).maybeSingle();
    siFalla(error, "cargando tus medidas");
    if (data) return filaAAvatar(data);

    // Normalmente lo crea el disparador al registrarse. Esto es el seguro por
    // si la cuenta es anterior al disparador o algo falló en el alta.
    const { data: creado, error: errCrear } = await supabase()
      .from("Avatar")
      .insert({ userId: uid })
      .select("*")
      .single();
    siFalla(errCrear, "creando tus medidas");
    return filaAAvatar(creado!);
  });
}

export async function guardarAvatar(uid: string, params: AvatarParams, fotoAnterior?: string | null) {
  return intentar("guardando tus medidas", async () => {
    const { data, error } = await supabase()
      .from("Avatar")
      .update({ ...params })
      .eq("userId", uid)
      .select("*")
      .single();
    siFalla(error, "guardando tus medidas");

    // Cambiar o quitar la foto deja la anterior huérfana en el almacén: nadie
    // va a volver a ella y ocupa lo que ocupa una foto de móvil.
    if (fotoAnterior && fotoAnterior !== params.photoUrl) await borrarFotos([fotoAnterior]);

    return filaAAvatar(data!);
  });
}
