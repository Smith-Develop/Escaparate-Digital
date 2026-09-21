"use client";

import { useEffect, useState } from "react";
import { ApareceSeccion } from "@/components/ui/Aparece";
import { supabase } from "@/lib/supabase/cliente";

type Apoyo = { activo: boolean; titulo: string; texto: string; boton: string; enlace: string };

/**
 * «Apoyar Escaparate», al final del perfil.
 *
 * El contenido no está en el código: vive en la tabla de ajustes y se cambia
 * desde el panel, porque el sitio donde se cobra cambia con el tiempo y eso no
 * merece un despliegue. Se lee con la sesión del propio usuario; la tabla solo
 * permite leer, así que nadie puede reescribir lo que pone aquí.
 *
 * Si está apagado, si no hay enlace o si no hay red, no se pinta nada. Es un
 * añadido, no una pieza de la app: nunca debe estorbar ni dejar un hueco.
 */
export function BloqueApoyo() {
  const [apoyo, setApoyo] = useState<Apoyo | null>(null);

  useEffect(() => {
    let vigente = true;
    void supabase()
      .from("ajustes")
      .select("valor")
      .eq("clave", "apoyo")
      .maybeSingle()
      .then(({ data }) => {
        const valor = data?.valor as Apoyo | undefined;
        if (vigente && valor?.activo && valor.enlace) setApoyo(valor);
      });
    return () => {
      vigente = false;
    };
  }, []);

  if (!apoyo) return null;

  return (
    <ApareceSeccion index={8} className="px-5">
      <div className="rounded-[1.5rem] bg-pastel-ambar p-5 text-pastel-ambar-ink">
        <h2 className="font-display text-xl leading-tight">{apoyo.titulo}</h2>
        {apoyo.texto && <p className="mt-2 text-sm leading-relaxed opacity-90">{apoyo.texto}</p>}
        <a
          href={apoyo.enlace}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex min-h-11 items-center rounded-full bg-accent px-5 text-sm font-semibold text-on-accent"
        >
          {apoyo.boton}
        </a>
      </div>
    </ApareceSeccion>
  );
}
