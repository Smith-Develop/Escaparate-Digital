"use client";

import Link from "next/link";
import { Titulo } from "@/components/Titulo";
import { Aparece, ApareceItem } from "@/components/ui/Aparece";
import { Cargando, Fallo, useCarga } from "@/components/admin/Estado";
import { pedirResumen } from "@/lib/admin/api";
import { fechaCorta, tamano } from "@/lib/admin/formato";

/**
 * Lo primero que se ve al administrar: cuánta gente hay, cuánto han guardado y
 * qué conviene mirar hoy —cuentas suspendidas, correos sin confirmar, fotos que
 * ya no usa nadie—. Todo lo demás del panel se llega desde aquí.
 */
export default function ResumenPage() {
  const { datos, error, cargando, recargar } = useCarga(pedirResumen);

  if (cargando) return <Cargando que="Cargando el resumen" />;
  if (error) return <Fallo error={error} reintentar={recargar} />;
  if (!datos) return null;

  return (
    <>
      <Titulo>Administración</Titulo>

      <div className="grid grid-cols-2 gap-3 pt-5">
        <Aparece index={0}>
          <Link
            href="/admin/usuarios"
            className="block h-full rounded-[1.5rem] bg-pastel-azul px-4 py-5 text-center text-pastel-azul-ink"
          >
            <p className="tabular font-display text-[2.5rem] leading-none">{datos.usuarios}</p>
            <p className="mt-2 text-[11px] uppercase tracking-wider opacity-80">Usuarios</p>
          </Link>
        </Aparece>
        <Aparece
          index={1}
          className="rounded-[1.5rem] bg-pastel-ambar px-4 py-5 text-center text-pastel-ambar-ink"
        >
          <p className="tabular font-display text-[2.5rem] leading-none">{datos.prendas}</p>
          <p className="mt-2 text-[11px] uppercase tracking-wider opacity-80">Prendas</p>
        </Aparece>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3">
        <Aparece
          index={2}
          className="rounded-[1.5rem] bg-pastel-menta px-3 py-4 text-center text-pastel-menta-ink"
        >
          <p className="tabular font-display text-2xl leading-none">{datos.looks}</p>
          <p className="mt-1.5 text-[10px] uppercase tracking-wider opacity-80">Looks</p>
        </Aparece>
        <Aparece index={3}>
          <Link
            href="/admin/biblioteca"
            className="edge block h-full rounded-[1.5rem] bg-surface px-3 py-4 text-center"
          >
            <p className="tabular font-display text-2xl leading-none">{datos.fotos}</p>
            <p className="mt-1.5 text-[10px] uppercase tracking-wider text-ink-faint">Fotos</p>
          </Link>
        </Aparece>
        <Aparece
          index={4}
          className="rounded-[1.5rem] bg-pastel-rosa px-3 py-4 text-center text-pastel-rosa-ink"
        >
          <p className="tabular font-display text-2xl leading-none">{tamano(datos.bytes)}</p>
          <p className="mt-1.5 text-[10px] uppercase tracking-wider opacity-80">Ocupado</p>
        </Aparece>
      </div>

      {/* Lo que pide atención. Si no hay nada de esto, no se enseña: una fila de
          ceros solo sirve para acostumbrar la vista a ignorarla. */}
      {(datos.suspendidos > 0 || datos.sinConfirmar > 0 || datos.huerfanas > 0) && (
        <Aparece index={5} className="mt-3 flex flex-wrap gap-2">
          {datos.suspendidos > 0 && (
            <Etiqueta href="/admin/usuarios">
              {datos.suspendidos} {datos.suspendidos === 1 ? "cuenta suspendida" : "cuentas suspendidas"}
            </Etiqueta>
          )}
          {datos.sinConfirmar > 0 && (
            <Etiqueta href="/admin/usuarios">{datos.sinConfirmar} sin confirmar el correo</Etiqueta>
          )}
          {datos.huerfanas > 0 && (
            <Etiqueta href="/admin/biblioteca?huerfanas=1">
              {datos.huerfanas} {datos.huerfanas === 1 ? "foto huérfana" : "fotos huérfanas"}
            </Etiqueta>
          )}
        </Aparece>
      )}

      <section className="mt-8">
        <h2 className="text-xs uppercase tracking-[0.18em] text-ink-faint">Últimas altas</h2>
        <ul className="mt-3 flex flex-col gap-2.5">
          {datos.ultimas.map((u, index) => (
            <ApareceItem key={u.id} index={index}>
              <Link
                href={`/admin/usuario?id=${u.id}`}
                className="edge flex items-center gap-3 rounded-2xl bg-surface p-3"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-2 font-display text-lg">
                  {u.nombre.trim().charAt(0).toUpperCase() || "?"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-base leading-tight">
                    {u.nombre}
                  </span>
                  <span className="block truncate text-xs text-ink-faint">{u.correo}</span>
                </span>
                <span className="tabular shrink-0 text-xs text-ink-muted">
                  {fechaCorta(u.alta)}
                </span>
              </Link>
            </ApareceItem>
          ))}
        </ul>
      </section>
    </>
  );
}

function Etiqueta({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="edge inline-flex min-h-9 items-center rounded-full bg-surface px-3.5 text-xs text-accent-ink"
    >
      {children}
    </Link>
  );
}
