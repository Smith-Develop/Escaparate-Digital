"use client";

import { useEffect, useState } from "react";
import { ApareceSeccion } from "@/components/ui/Aparece";
import { supabase } from "@/lib/supabase/cliente";
import { esAppNativa } from "@/lib/plataforma";

type Apk = { activo: boolean; version: string; enlace: string; notas: string };

/**
 * «Llévate la app», en el perfil.
 *
 * El enlace al fichero no está en el código: vive en la tabla de ajustes y se
 * cambia desde el panel, porque cada versión que publiques cambia la dirección
 * y eso no merece recompilar la web.
 *
 * **Dentro del APK no aparece.** Quien está viendo esto desde la app ya la
 * tiene instalada; ofrecerle descargarla sería ruido. En iOS tampoco sirve de
 * nada un APK, pero sí puede querer bajarlo para pasárselo a alguien, así que
 * en la web se enseña siempre.
 */
export function DescargarApp() {
  const [apk, setApk] = useState<Apk | null>(null);

  useEffect(() => {
    if (esAppNativa()) return;

    let vigente = true;
    void supabase()
      .from("ajustes")
      .select("valor")
      .eq("clave", "apk")
      .maybeSingle()
      .then(({ data }) => {
        const valor = data?.valor as Apk | undefined;
        if (vigente && valor?.activo && valor.enlace) setApk(valor);
      });
    return () => {
      vigente = false;
    };
  }, []);

  if (!apk) return null;

  return (
    <ApareceSeccion index={7} className="px-5">
      <h2 className="mb-2 text-xs uppercase tracking-[0.14em] text-ink-faint">Llévate la app</h2>

      <div className="rounded-[1.5rem] bg-pastel-azul p-5 text-pastel-azul-ink">
        <p className="font-display text-lg leading-tight">
          Escaparate para Android
          {apk.version && <span className="text-sm font-normal opacity-70"> · {apk.version}</span>}
        </p>
        <p className="mt-1.5 text-sm leading-relaxed opacity-90">
          {apk.notas ||
            "Instalada ocupa poco y el armario se abre sin conexión, con las fotos ya descargadas."}
        </p>

        <a
          href={apk.enlace}
          // Sin `download`: el fichero está en otro dominio y el navegador
          // ignoraría el atributo. Abrirlo en otra pestaña deja además la
          // sesión intacta si la descarga tarda.
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-on-accent"
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 4v11" />
            <path d="m7.5 11 4.5 4.5 4.5-4.5" />
            <path d="M5 19h14" />
          </svg>
          Descargar el APK
        </a>

        {/* Es lo primero que pasa al instalar fuera de la tienda, y sin este
            aviso parece que la descarga ha fallado. */}
        <p className="mt-3 text-xs leading-relaxed opacity-70">
          Al abrir el fichero, Android pedirá permiso para instalar desde esta fuente. Es normal
          cuando la app no viene de la tienda.
        </p>
      </div>
    </ApareceSeccion>
  );
}
