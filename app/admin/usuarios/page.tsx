"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Titulo } from "@/components/Titulo";
import { ApareceItem } from "@/components/ui/Aparece";
import { Input } from "@/components/ui/Field";
import { Cargando, Fallo, useCarga } from "@/components/admin/Estado";
import { pedirUsuarios, type Ficha } from "@/lib/admin/api";
import { cuantoFalta, fechaCorta } from "@/lib/admin/formato";

/**
 * Todas las cuentas de Escaparate.
 *
 * Se piden enteras y se filtran aquí: son decenas, y así escribir en el
 * buscador responde al instante en vez de esperar una vuelta al servidor por
 * cada letra. El día que sean miles, el servicio ya acepta el filtro.
 */
export default function UsuariosPage() {
  const { datos, error, cargando, recargar } = useCarga(() => pedirUsuarios());
  const [buscar, setBuscar] = useState("");

  const visibles = useMemo(() => {
    const texto = buscar.trim().toLowerCase();
    const todos = datos?.usuarios ?? [];
    if (!texto) return todos;
    return todos.filter(
      (u) => u.correo.toLowerCase().includes(texto) || u.nombre.toLowerCase().includes(texto),
    );
  }, [datos, buscar]);

  if (cargando) return <Cargando que="Cargando los usuarios" />;
  if (error) return <Fallo error={error} reintentar={recargar} />;

  return (
    <>
      <Titulo>Usuarios · Administración</Titulo>

      <div className="sticky top-0 z-10 -mx-5 bg-canvas/95 px-5 pb-3 pt-5 backdrop-blur">
        <Input
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
          placeholder="Buscar por nombre o correo…"
          className="!rounded-full !py-3 !text-sm"
          type="search"
        />
        <p className="mt-2 text-xs text-ink-faint">
          {visibles.length} {visibles.length === 1 ? "cuenta" : "cuentas"}
        </p>
      </div>

      {visibles.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line px-6 py-12 text-center text-sm text-ink-muted">
          Ninguna cuenta coincide con «{buscar}».
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {visibles.map((u, index) => (
            <ApareceItem key={u.id} index={index}>
              <FilaUsuario usuario={u} />
            </ApareceItem>
          ))}
        </ul>
      )}
    </>
  );
}

function FilaUsuario({ usuario }: { usuario: Ficha }) {
  const suspension = cuantoFalta(usuario.suspendidoHasta);

  return (
    <Link
      href={`/admin/usuario?id=${usuario.id}`}
      className="edge flex items-center gap-3 rounded-2xl bg-surface p-3"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-surface-2 font-display text-lg">
        {usuario.nombre.trim().charAt(0).toUpperCase() || "?"}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate font-display text-base leading-tight">
            {usuario.nombre}
          </span>
          {suspension && (
            <span className="shrink-0 rounded-full bg-pastel-rosa px-2 py-0.5 text-[10px] font-semibold text-pastel-rosa-ink">
              Suspendida · {suspension}
            </span>
          )}
          {!usuario.confirmado && (
            <span className="shrink-0 rounded-full bg-pastel-ambar px-2 py-0.5 text-[10px] font-semibold text-pastel-ambar-ink">
              Sin confirmar
            </span>
          )}
        </span>
        <span className="block truncate text-xs text-ink-faint">{usuario.correo}</span>
        <span className="tabular mt-0.5 block truncate text-[11px] text-ink-faint">
          {usuario.prendas} {usuario.prendas === 1 ? "prenda" : "prendas"} · {usuario.looks}{" "}
          {usuario.looks === 1 ? "look" : "looks"} · último acceso{" "}
          {usuario.ultimoAcceso ? fechaCorta(usuario.ultimoAcceso) : "nunca"}
        </span>
      </span>
    </Link>
  );
}
