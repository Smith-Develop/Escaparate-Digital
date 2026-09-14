"use client";

import { Header } from "@/components/layout/Header";
import { Titulo } from "@/components/Titulo";
import { EmptyState } from "@/components/ui/EmptyState";
import { Foto } from "@/components/ui/Foto";
import { centimosATexto, centimosRedondeados } from "@/lib/dinero";
import { calcularInversion, type Grupo } from "@/lib/inversion";
import { useEspejo } from "@/lib/local/espejo";
import { CATEGORIES } from "@/lib/taxonomy";

/**
 * Cuánto vale el armario y en qué se ha ido el dinero.
 *
 * Todo se calcula aquí a partir de las prendas que hay en el espejo: no hay
 * ninguna cifra guardada que pueda quedarse desfasada al añadir o borrar ropa,
 * y funciona sin conexión como el resto de la consulta.
 */
export default function InversionPage() {
  const items = useEspejo((s) => s.items);
  const inv = calcularInversion(items);

  if (inv.conPrecio === 0) {
    return (
      <>
        <Titulo>Inversión</Titulo>
        <Header title="Inversión" subtitle="Lo que vale tu armario" back="/dashboard/closet" />
        <div className="flex-1 px-5 pb-24">
          <EmptyState
            icon="🧾"
            title="Todavía no hay precios"
            description="Anota el precio aproximado al catalogar una prenda, o edítalo después, y aquí verás cuánto llevas invertido y en qué."
            action={{ label: "Añadir prenda", href: "/dashboard/closet/new" }}
          />
        </div>
      </>
    );
  }

  const iconos = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.icon]));

  return (
    <>
      <Titulo>Inversión</Titulo>
      <Header title="Inversión" subtitle="Lo que vale tu armario" back="/dashboard/closet" />

      <div className="flex flex-col gap-8 px-5 pb-24">
        <section className="edge rounded-2xl bg-surface p-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-ink-faint">Total invertido</p>
          <p className="tabular mt-1 font-display text-5xl leading-none">
            {centimosRedondeados(inv.total)}
          </p>
          <p className="mt-3 text-sm text-ink-muted">
            En {inv.conPrecio} {inv.conPrecio === 1 ? "prenda" : "prendas"} con precio
            {inv.sinPrecio > 0 && <> · {inv.sinPrecio} sin precio</>}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4">
            <Dato titulo="Precio medio" valor={centimosATexto(inv.media ?? 0)} />
            <Dato
              titulo="La más cara"
              valor={centimosATexto(inv.masCara?.priceCents ?? 0)}
              pie={inv.masCara?.name}
            />
          </div>
        </section>

        {inv.masCara && (
          <section className="edge flex items-center gap-4 rounded-2xl bg-surface p-4">
            <span className="edge size-16 shrink-0 overflow-hidden rounded-xl bg-display">
              <Foto
                ruta={inv.masCara.imageUrl}
                alt={inv.masCara.name}
                color={inv.masCara.dominantColor}
                width={64}
                height={64}
                className="size-full object-contain p-1"
              />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">
                Tu prenda más cara
              </p>
              <p className="truncate font-display text-lg">{inv.masCara.name}</p>
              <p className="tabular text-sm text-ink-muted">
                {centimosATexto(inv.masCara.priceCents ?? 0)}
                {inv.masCara.brand ? ` · ${inv.masCara.brand}` : ""}
              </p>
            </div>
          </section>
        )}

        <Desglose
          titulo="Por categoría"
          grupos={inv.porCategoria}
          total={inv.total}
          iconos={iconos}
        />

        <Desglose titulo="Por tipo de prenda" grupos={inv.porTipo.slice(0, 8)} total={inv.total} />

        {inv.porMarca.length > 0 && (
          <Desglose titulo="Por marca" grupos={inv.porMarca.slice(0, 8)} total={inv.total} />
        )}

        {inv.porAño.length > 0 && (
          <Desglose
            titulo="Por año de compra"
            grupos={inv.porAño}
            total={inv.total}
            /* Los años se leen en orden cronológico, no por gasto. */
            ordenar={false}
          />
        )}
      </div>
    </>
  );
}

function Dato({ titulo, valor, pie }: { titulo: string; valor: string; pie?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">{titulo}</p>
      <p className="tabular mt-0.5 font-display text-2xl leading-none">{valor}</p>
      {pie && <p className="mt-1 truncate text-xs text-ink-faint">{pie}</p>}
    </div>
  );
}

/**
 * Reparto del gasto en barras.
 *
 * La barra se mide contra el grupo que más suma, no contra el total: comparando
 * con el total, en un armario repartido todas las barras salen igual de cortas
 * y no se distingue nada.
 */
function Desglose({
  titulo,
  grupos,
  total,
  iconos,
  ordenar = true,
}: {
  titulo: string;
  grupos: Grupo[];
  total: number;
  iconos?: Record<string, string>;
  ordenar?: boolean;
}) {
  const visibles = grupos.filter((g) => g.prendas > 0);
  if (visibles.length === 0) return null;
  const mayor = Math.max(...visibles.map((g) => g.total), 1);

  return (
    <section>
      <h2 className="text-xs uppercase tracking-[0.18em] text-ink-faint">{titulo}</h2>
      <ul className="mt-3 flex flex-col gap-3">
        {(ordenar ? [...visibles].sort((a, b) => b.total - a.total) : visibles).map((grupo) => (
          <li key={grupo.id}>
            <div className="flex items-baseline justify-between gap-3">
              <p className="min-w-0 truncate text-sm">
                {iconos?.[grupo.id] && (
                  <span className="mr-1.5" aria-hidden>
                    {iconos[grupo.id]}
                  </span>
                )}
                {grupo.label}
                <span className="ml-2 text-xs text-ink-faint">
                  {grupo.prendas}
                  {grupo.sinPrecio > 0 && ` · ${grupo.sinPrecio} sin precio`}
                </span>
              </p>
              <p className="tabular shrink-0 text-sm">
                {centimosRedondeados(grupo.total)}
                <span className="ml-2 text-xs text-ink-faint">
                  {total > 0 ? Math.round((grupo.total / total) * 100) : 0}%
                </span>
              </p>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${Math.round((grupo.total / mayor) * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
