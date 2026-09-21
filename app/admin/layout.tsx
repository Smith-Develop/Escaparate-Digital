"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useSesion } from "@/components/SesionProvider";
import { hayPanel, soyAdmin } from "@/lib/admin/api";
import { APARECE } from "@/lib/animaciones";

/**
 * La puerta del panel de administración.
 *
 * Dos cosas la distinguen del resto de la app. La primera es que **quien manda
 * es el servicio**: la app no sabe ni puede saber quién administra, así que lo
 * pregunta y se cree la respuesta; sin ella, aquí no entra nadie. La segunda es
 * que esto vive fuera de `/dashboard/`, y no por orden: ahí dentro está el
 * espejo local, y los datos de otras personas no pueden acabar guardados en el
 * dispositivo de quien administra.
 *
 * Sin `NEXT_PUBLIC_ADMIN_API` el panel no existe: la app compilada así ni
 * siquiera enseña la entrada.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { estado } = useSesion();
  const [permiso, setPermiso] = useState<"comprobando" | "si" | "no">("comprobando");

  useEffect(() => {
    if (estado === "fuera") router.replace("/login");
  }, [estado, router]);

  useEffect(() => {
    if (estado !== "dentro" || !hayPanel) return;
    let vigente = true;
    void soyAdmin().then((r) => {
      if (vigente) setPermiso(r.admin ? "si" : "no");
    });
    return () => {
      vigente = false;
    };
  }, [estado]);

  if (!hayPanel) {
    return (
      <Aviso
        titulo="El panel no está configurado"
        texto="Esta compilación de la app no sabe dónde vive el servicio de administración. Se configura con NEXT_PUBLIC_ADMIN_API."
      />
    );
  }

  if (estado !== "dentro" || permiso === "comprobando") {
    return (
      <div className="grid min-h-dvh place-items-center">
        <span
          aria-label="Comprobando"
          className="size-8 animate-spin rounded-full border-2 border-accent border-t-transparent"
        />
      </div>
    );
  }

  if (permiso === "no") {
    return (
      <Aviso
        titulo="Esta cuenta no administra Escaparate"
        texto="Si crees que debería, quien lleva el servidor tiene que añadir tu correo a la lista del servicio."
      />
    );
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <Barra />
      <div className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto overscroll-contain px-5 pb-10">
        {children}
      </div>
    </div>
  );
}

const SECCIONES = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/usuarios", label: "Usuarios" },
  { href: "/admin/biblioteca", label: "Biblioteca" },
  { href: "/admin/ajustes", label: "Ajustes" },
];

function Barra() {
  const ruta = usePathname().replace(/\/$/, "") || "/admin";
  // La ficha de un usuario cuelga de «Usuarios»: sin esto, al abrirla se
  // apagarían las tres pestañas y parecería que no estás en ninguna parte.
  const activa = ruta.startsWith("/admin/usuario") ? "/admin/usuarios" : ruta;

  return (
    <header className="shrink-0 border-b border-line bg-canvas/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-5 pb-3 pt-safe">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-[0.2em] text-ink-faint">Escaparate</p>
          <h1 className="truncate font-display text-xl leading-tight">Administración</h1>
        </div>
        <Link
          href="/dashboard"
          className="edge shrink-0 rounded-full bg-surface px-4 py-2 text-xs text-ink"
        >
          Volver a la app
        </Link>
      </div>

      <nav aria-label="Secciones" className="mx-auto flex w-full max-w-3xl gap-1 px-5">
        {SECCIONES.map((s) => {
          const puesta = activa === s.href;
          return (
            <Link
              key={s.href}
              href={s.href}
              aria-current={puesta ? "page" : undefined}
              className={[
                "relative px-3 pb-2 pt-1 text-sm transition-colors",
                puesta ? "text-ink" : "text-ink-faint",
              ].join(" ")}
            >
              {s.label}
              {puesta && (
                <motion.span
                  layoutId="admin-seccion"
                  className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent"
                />
              )}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

function Aviso({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="grid min-h-dvh place-items-center px-6">
      <motion.div {...APARECE} className="edge max-w-sm rounded-[1.5rem] bg-surface p-6 text-center">
        <h1 className="font-display text-xl leading-tight">{titulo}</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">{texto}</p>
        <Link
          href="/dashboard"
          className="mt-5 inline-flex min-h-11 items-center rounded-full bg-accent px-5 text-sm font-semibold text-on-accent"
        >
          Volver a la app
        </Link>
      </motion.div>
    </div>
  );
}
