"use client";

import Link from "next/link";
import { useMemo } from "react";
import { BotonCabecera, Header } from "@/components/layout/Header";
import { Titulo } from "@/components/Titulo";
import { EmptyState } from "@/components/ui/EmptyState";
import { Foto } from "@/components/ui/Foto";
import { Stat } from "@/components/ui/Stat";
import { centimosRedondeados } from "@/lib/dinero";
import { useEspejo } from "@/lib/local/espejo";
import { useSesion } from "@/components/SesionProvider";

const QUICK_ACTIONS = [
  { href: "/dashboard/closet/new", label: "Añadir ropa", icon: "📸" },
  { href: "/dashboard/studio", label: "Montar look", icon: "✨" },
  { href: "/dashboard/looks", label: "Calendario", icon: "🗓️" },
] as const;

export default function DashboardPage() {
  const items = useEspejo((s) => s.items);
  const looks = useEspejo((s) => s.looks);
  const perfil = useEspejo((s) => s.perfil);
  const { nombre } = useSesion();

  const invertido = useMemo(
    () => items.reduce((suma, i) => suma + (i.priceCents ?? 0), 0),
    [items],
  );

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
          <BotonCabecera href="/dashboard/profile" label="Tu perfil">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="8" r="3.5" />
              <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
            </svg>
          </BotonCabecera>
        }
      />

      <div className="grid grid-cols-3 gap-3 px-5">
        <Stat value={items.length} label="Prendas" />
        <Stat value={looks.length} label="Looks" />
        <Stat
          value={centimosRedondeados(invertido)}
          label="Invertido"
          href="/dashboard/closet/inversion"
        />
      </div>

      <nav className="mt-6 grid grid-cols-3 gap-3 px-5">
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="edge flex flex-col items-center gap-2 rounded-2xl bg-surface px-2 py-5 text-center transition-shadow hover:shadow-[0_0_0_2px_var(--accent)]"
          >
            <span className="text-2xl" aria-hidden>
              {action.icon}
            </span>
            <span className="text-xs leading-tight text-ink-muted">{action.label}</span>
          </Link>
        ))}
      </nav>

      {proximo && (
        <section className="mt-8 px-5">
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
        </section>
      )}

      <section className="mt-8 flex-1 px-5 pb-24">
        <div className="flex items-baseline justify-between">
          <SectionTitle>Añadido recientemente</SectionTitle>
          {items.length > 0 && (
            <Link href="/dashboard/closet" className="text-sm text-accent">
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
            {recientes.map((item) => (
              <li key={item.id}>
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
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xs uppercase tracking-[0.18em] text-ink-faint">{children}</h2>;
}
