"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Titulo } from "@/components/Titulo";
import { Foto } from "@/components/ui/Foto";
import { Aparece, ApareceItem } from "@/components/ui/Aparece";
import { AccionesCuenta } from "@/components/admin/AccionesCuenta";
import { Cargando, Fallo, useCarga } from "@/components/admin/Estado";
import { pedirUsuario, type PrendaAjena } from "@/lib/admin/api";
import { cuantoFalta, fechaCorta, fechaLarga } from "@/lib/admin/formato";
import { centimosATexto } from "@/lib/dinero";
import { CATEGORIES } from "@/lib/taxonomy";

/**
 * La ficha de una cuenta: quién es, qué se le puede hacer y qué tiene guardado.
 *
 * El identificador viaja en la dirección y no en la ruta porque la app se
 * compila como sitio estático: una ruta con segmento variable tendría que
 * conocer de antemano todos los usuarios, que es justo lo que no se puede.
 */
export default function UsuarioPage() {
  return (
    <Suspense fallback={<Cargando />}>
      <Ficha />
    </Suspense>
  );
}

function Ficha() {
  const id = useSearchParams().get("id") ?? "";
  const { datos, error, cargando, recargar } = useCarga(() => pedirUsuario(id), id);

  if (!id) return <p className="pt-10 text-sm text-ink-muted">Falta el identificador de la cuenta.</p>;
  if (cargando) return <Cargando que="Cargando la cuenta" />;
  if (error) return <Fallo error={error} reintentar={recargar} />;
  if (!datos) return null;

  const { ficha, prendas, looks, avatar } = datos;
  const suspension = cuantoFalta(ficha.suspendidoHasta);

  return (
    <>
      <Titulo>{`${ficha.nombre} · Administración`}</Titulo>

      <div className="flex items-center gap-2 pt-5">
        <Link href="/admin/usuarios" className="text-sm text-accent-ink">
          ← Usuarios
        </Link>
      </div>

      <Aparece index={0} className="edge mt-3 rounded-[1.5rem] bg-surface p-5">
        <div className="flex items-center gap-4">
          <span className="size-16 shrink-0 overflow-hidden rounded-full bg-surface-2">
            {avatar?.photoUrl ? (
              <Foto ruta={avatar.photoUrl} alt="" className="size-full object-cover" />
            ) : (
              <span className="grid size-full place-items-center font-display text-2xl">
                {ficha.nombre.trim().charAt(0).toUpperCase() || "?"}
              </span>
            )}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-2xl leading-tight">{ficha.nombre}</h2>
            <p className="truncate text-sm text-ink-muted">{ficha.correo}</p>
          </div>
        </div>

        {suspension && (
          <p className="mt-4 rounded-xl bg-pastel-rosa px-4 py-2.5 text-sm text-pastel-rosa-ink">
            Cuenta suspendida · quedan {suspension} (hasta el {fechaCorta(ficha.suspendidoHasta)})
          </p>
        )}
        {!ficha.confirmado && (
          <p className="mt-2 rounded-xl bg-pastel-ambar px-4 py-2.5 text-sm text-pastel-ambar-ink">
            El correo no está confirmado.
          </p>
        )}

        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-4 text-sm">
          <Dato titulo="Alta" valor={fechaLarga(ficha.alta)} />
          <Dato
            titulo="Último acceso"
            valor={ficha.ultimoAcceso ? fechaCorta(ficha.ultimoAcceso) : "Nunca ha entrado"}
          />
          <Dato titulo="Prendas" valor={String(ficha.prendas)} />
          <Dato titulo="Looks" valor={String(ficha.looks)} />
        </dl>

        <AccionesCuenta ficha={ficha} alCambiar={recargar} />
      </Aparece>

      <section className="mt-8">
        <h2 className="text-xs uppercase tracking-[0.18em] text-ink-faint">Su armario</h2>
        {prendas.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-line px-6 py-10 text-center text-sm text-ink-muted">
            Todavía no ha catalogado ninguna prenda.
          </p>
        ) : (
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {prendas.map((prenda, index) => (
              <ApareceItem key={prenda.id} index={index}>
                <TarjetaPrenda prenda={prenda} />
              </ApareceItem>
            ))}
          </ul>
        )}
      </section>

      {looks.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xs uppercase tracking-[0.18em] text-ink-faint">Sus looks</h2>
          <ul className="mt-3 flex flex-col gap-2.5">
            {looks.map((look, index) => (
              <ApareceItem
                key={look.id}
                index={index}
                className="edge flex items-center justify-between gap-3 rounded-2xl bg-surface px-4 py-3"
              >
                <span className="min-w-0">
                  <span className="block truncate font-display text-base leading-tight">
                    {look.name}
                  </span>
                  <span className="block truncate text-xs text-ink-faint">
                    {look.prendas} {look.prendas === 1 ? "prenda" : "prendas"}
                    {look.occasion ? ` · ${look.occasion}` : ""}
                    {look.scheduledAt
                      ? ` · para el ${new Date(look.scheduledAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", timeZone: "UTC" })}`
                      : ""}
                  </span>
                </span>
                <span className="tabular shrink-0 text-xs text-ink-faint">
                  {fechaCorta(look.createdAt)}
                </span>
              </ApareceItem>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">{titulo}</dt>
      <dd className="truncate">{valor}</dd>
    </div>
  );
}

/**
 * Una prenda ajena, solo para mirar.
 *
 * La foto llega firmada por el servicio y se pinta con el `Foto` de siempre,
 * que ante una dirección completa la enseña tal cual: por ese camino no pasa
 * por el espejo local, así que el armario de otra persona no se queda guardado
 * en este dispositivo.
 */
function TarjetaPrenda({ prenda }: { prenda: PrendaAjena }) {
  const categoria = CATEGORIES.find((c) => c.id === prenda.category);

  return (
    <div className="edge flex h-full flex-col overflow-hidden rounded-2xl bg-surface">
      <span className="relative block aspect-square w-full bg-display p-3">
        <Foto
          ruta={prenda.imageUrl}
          alt={prenda.name}
          color={prenda.dominantColor}
          fill
          className="object-contain p-2"
        />
        {prenda.favorite && (
          <span className="absolute right-2 top-2 text-sm" aria-hidden>
            ★
          </span>
        )}
      </span>
      <span className="flex flex-1 flex-col gap-0.5 border-t border-line px-3 py-2">
        <span className="truncate text-sm">{prenda.name}</span>
        <span className="truncate text-[11px] text-ink-faint">
          {categoria?.label ?? prenda.category} · {prenda.subcategory}
          {prenda.brand ? ` · ${prenda.brand}` : ""}
        </span>
        {prenda.priceCents !== null && (
          <span className="tabular text-[11px] text-ink-muted">
            {centimosATexto(prenda.priceCents)}
          </span>
        )}
      </span>
    </div>
  );
}
