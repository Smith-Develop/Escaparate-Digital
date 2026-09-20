"use client";

import Link from "next/link";
import { useMemo } from "react";
import { BotonCabecera, Header } from "@/components/layout/Header";
import { Titulo } from "@/components/Titulo";
import { EmptyState } from "@/components/ui/EmptyState";
import { BotonCompartir, IconoCompartir } from "@/components/ui/BotonCompartir";
import { compartirEnlace } from "@/lib/compartir";
import { AnilloPuntuacion } from "@/components/inicio/Graficos";
import { GraficosInversion, ResumenInversion } from "@/components/inicio/ResumenInversion";
import { Foto } from "@/components/ui/Foto";
import { Aparece, ApareceItem, ApareceSeccion } from "@/components/ui/Aparece";
import { centimosRedondeados } from "@/lib/dinero";
import { useEspejo } from "@/lib/local/espejo";
import { useSesion } from "@/components/SesionProvider";

export default function DashboardPage() {
  const items = useEspejo((s) => s.items);
  const looks = useEspejo((s) => s.looks);
  const perfil = useEspejo((s) => s.perfil);
  const { nombre } = useSesion();

  const invertido = useMemo(
    () => items.reduce((suma, i) => suma + (i.priceCents ?? 0), 0),
    [items],
  );
  const conPrecio = useMemo(() => items.filter((i) => i.priceCents !== null).length, [items]);

  // Cuánta ropa llega de verdad a ponerse. Sale de lo que ya hay guardado —qué
  // prendas aparecen en algún look— sin registrar nada nuevo.
  const usadas = useMemo(() => {
    const enLooks = new Set(looks.flatMap((l) => l.items.map((i) => i.id)));
    return items.filter((i) => enLooks.has(i.id)).length;
  }, [items, looks]);
  const usoDelArmario = items.length === 0 ? 0 : Math.round((usadas / items.length) * 100);

  // Lo último catalogado. El armario llega ordenado con las favoritas delante,
  // así que aquí hay que reordenar por fecha.
  const recientes = useMemo(
    () => [...items].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 6),
    [items],
  );

  const proximo = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return looks
      .filter((l) => l.scheduledAt && new Date(l.scheduledAt) >= hoy)
      .sort((a, b) => (a.scheduledAt! < b.scheduledAt! ? -1 : 1))[0];
  }, [looks]);

  const saludo = (perfil?.name ?? nombre ?? "").split(" ")[0];

  return (
    <>
      <Titulo>Inicio</Titulo>
      <Header
        title={saludo ? `Hola, ${saludo}` : "Hola"}
        subtitle="Tu armario, siempre a mano."
        action={
          <div className="flex items-center gap-2">
            <BotonCompartir
              label="Compartir Escaparate con alguien"
              className="edge grid size-10 shrink-0 place-items-center rounded-full bg-surface text-ink"
              onCompartir={() =>
                compartirEnlace(
                  "Escaparate",
                  "Mi armario entero en el móvil, con probador y todo. Échale un ojo:",
                )
              }
            >
              <IconoCompartir />
            </BotonCompartir>

            <BotonCabecera href="/dashboard/profile" label="Tu perfil">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="8" r="3.5" />
              <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
              </svg>
            </BotonCabecera>
          </div>
        }
      />

      {/* Lo primero que se ve: cuánta ropa hay y cuánto costó. Lo demás es
          detalle de eso. */}
      <div className="grid grid-cols-2 gap-3 px-5">
        <Aparece index={0}>
        <Link
          href="/dashboard/closet"
          className="block h-full rounded-[1.5rem] bg-pastel-azul px-4 py-5 text-center text-pastel-azul-ink"
        >
          <p className="tabular font-display text-[2.75rem] leading-none">{items.length}</p>
          <p className="mt-2 text-[11px] uppercase tracking-wider opacity-80">Prendas</p>
        </Link>
        </Aparece>
        <Aparece index={1} className="rounded-[1.5rem] bg-pastel-ambar px-4 py-5 text-center text-pastel-ambar-ink">
          <p className="tabular font-display leading-none [font-size:clamp(1.75rem,9vw,2.75rem)]">
            {centimosRedondeados(invertido)}
          </p>
          <p className="mt-2 text-[11px] uppercase tracking-wider opacity-80">Invertido</p>
        </Aparece>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3 px-5">
        <Aparece index={2}>
        <Link
          href="/dashboard/looks"
          className="block h-full rounded-[1.5rem] bg-pastel-menta px-3 py-4 text-center text-pastel-menta-ink"
        >
          <p className="tabular font-display text-2xl leading-none">{looks.length}</p>
          <p className="mt-1.5 text-[10px] uppercase tracking-wider opacity-80">Looks</p>
        </Link>
        </Aparece>
        <Aparece index={3} className="edge rounded-[1.5rem] bg-surface px-3 py-4 text-center">
          <p className="tabular font-display text-2xl leading-none">{conPrecio}</p>
          <p className="mt-1.5 text-[10px] uppercase tracking-wider text-ink-faint">Con precio</p>
        </Aparece>
        <Aparece index={4} className="rounded-[1.5rem] bg-pastel-rosa px-3 py-4 text-center text-pastel-rosa-ink">
          <p className="tabular font-display text-2xl leading-none">{items.length - conPrecio}</p>
          <p className="mt-1.5 text-[10px] uppercase tracking-wider opacity-80">Sin precio</p>
        </Aparece>
      </div>

      <Aparece index={5} className="mt-6 flex flex-col gap-4 px-5">
        <AnilloPuntuacion
          porcentaje={usoDelArmario}
          titulo="Uso del armario"
          pie={`${usadas} de ${items.length} prendas aparecen en algún look guardado.`}
        />
        <GraficosInversion items={items} />
      </Aparece>

      {proximo && (
        <ApareceSeccion index={6} className="mt-8 px-5">
          <SectionTitle>Próximo look</SectionTitle>
          <Link
            href="/dashboard/looks"
            className="edge mt-3 flex items-center gap-4 rounded-2xl bg-surface p-4"
          >
            <div className="flex -space-x-4">
              {proximo.items.slice(0, 3).map((item) => (
                <span key={item.id} className="edge size-12 overflow-hidden rounded-xl bg-display">
                  <Foto
                    ruta={item.imageUrl}
                    alt={item.name}
                    color={item.dominantColor}
                    width={48}
                    height={48}
                    className="size-full object-contain"
                  />
                </span>
              ))}
            </div>
            <div className="min-w-0">
              <p className="truncate font-display text-lg">{proximo.name}</p>
              <p className="text-sm text-ink-muted">
                {/* En UTC, igual que se guardó: convertir a la zona local
                    movería el día que eligió el usuario. */}
                {new Date(proximo.scheduledAt!).toLocaleDateString("es-ES", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  timeZone: "UTC",
                })}
              </p>
            </div>
          </Link>
        </ApareceSeccion>
      )}

      <ApareceSeccion index={7} className="mt-8 px-5">
        <div className="flex items-baseline justify-between">
          <SectionTitle>Añadido recientemente</SectionTitle>
          {items.length > 0 && (
            <Link href="/dashboard/closet" className="text-sm text-accent-ink">
              Ver todo
            </Link>
          )}
        </div>

        {recientes.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              icon="👗"
              title="Tu armario está vacío"
              description="Haz una foto a tu primera prenda y empieza a construir tu escaparate digital."
              action={{ label: "Añadir prenda", href: "/dashboard/closet/new" }}
            />
          </div>
        ) : (
          <ul className="mt-3 grid grid-cols-3 gap-3">
            {recientes.map((item, index) => (
              <ApareceItem key={item.id} index={index}>
                <Link
                  href="/dashboard/closet"
                  className="edge block aspect-square overflow-hidden rounded-xl bg-display p-2"
                >
                  <Foto
                    ruta={item.imageUrl}
                    alt={item.name}
                    color={item.dominantColor}
                    width={160}
                    height={160}
                    className="size-full object-contain"
                  />
                </Link>
              </ApareceItem>
            ))}
          </ul>
        )}
      </ApareceSeccion>

      {/* Lo que vale el armario, aquí y no en una pantalla aparte: es un dato
          que solo sirve si se ve de pasada. */}
      <ApareceSeccion index={8} className="mt-8 flex-1 px-5 pb-24">
        <SectionTitle>El detalle</SectionTitle>
        <div className="mt-3">
          <ResumenInversion items={items} />
        </div>
      </ApareceSeccion>
    </>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xs uppercase tracking-[0.18em] text-ink-faint">{children}</h2>;
}
