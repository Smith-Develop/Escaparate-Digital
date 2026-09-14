"use client";

import { supabase } from "@/lib/supabase/cliente";
import { ErrorDeDatos, intentar, siFalla } from "@/lib/datos/errores";

/**
 * El perfil: solo el nombre.
 *
 * El correo no está en esta tabla porque vive en la cuenta de Supabase y la
 * sesión ya lo trae. Cambiarlo no es editar un campo más del perfil: es cambiar
 * la credencial con la que se entra.
 */

export type Perfil = { id: string; name: string; createdAt: Date };

export async function leerPerfil(uid: string, nombrePorDefecto = "Sin nombre"): Promise<Perfil> {
  return intentar("cargando tu perfil", async () => {
    const { data, error } = await supabase().from("profiles").select("*").eq("id", uid).maybeSingle();
    siFalla(error, "cargando tu perfil");
    if (data) return { id: String(data.id), name: String(data.name), createdAt: new Date(String(data.createdAt)) };

    const { data: creado, error: errCrear } = await supabase()
      .from("profiles")
      .insert({ id: uid, name: nombrePorDefecto })
      .select("*")
      .single();
    siFalla(errCrear, "creando tu perfil");
    return { id: String(creado!.id), name: String(creado!.name), createdAt: new Date(String(creado!.createdAt)) };
  });
}

export async function renombrarPerfil(uid: string, nombre: string) {
  const limpio = nombre.trim();
  if (!limpio) throw new ErrorDeDatos("Escribe tu nombre");
  if (limpio.length > 60) throw new ErrorDeDatos("El nombre supera los 60 caracteres");

  return intentar("guardando tu nombre", async () => {
    const { error } = await supabase().from("profiles").update({ name: limpio }).eq("id", uid);
    siFalla(error, "guardando tu nombre");
    return limpio;
  });
}
