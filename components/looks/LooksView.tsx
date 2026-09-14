"use client";

import { Foto } from "@/components/ui/Foto";
import Link from "next/link";
import { useState } from "react";
import { LookCard } from "@/components/looks/LookCard";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Look } from "@/lib/types";

const DAY = 24 * 60 * 60 * 1000;

/** Lookbook con dos lecturas: la agenda de los próximos días y la colección. */
export function LooksView({ looks }: { looks: Look[] }) {
  const [tab, setTab] = useState<"coleccion" | "agenda">("agenda");

  if (looks.length === 0) {
    return (
      <div className="flex-1 px-5 pb-24">
        <EmptyState
          icon="🗂️"
          title="Todavía no hay looks"
          description="Monta un conjunto en el estudio y guárdalo para tenerlo listo cuando lo necesites."
          action={{ label: "Ir al estudio", href: "/dashboard/studio" }}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 pb-24">
      <div className="edge mx-5 mb-4 grid grid-cols-2 rounded-full bg-surface p-1">
        {(["agenda", "coleccion"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={[
              "min-h-9 rounded-full text-sm transition-colors",
              tab === value ? "bg-accent font-medium text-on-accent" : "text-ink-muted",
            ].join(" ")}
          >
            {value === "agenda" ? "Agenda" : "Colección"}
          </button>
        ))}
      </div>

      {tab === "agenda" ? <Agenda looks={looks} /> : <Collection looks={looks} />}
    </div>
  );
}

function Collection({ looks }: { looks: Look[] }) {
  return (
    <ul className="flex flex-col gap-3 px-5">
      {looks.map((look, index) => (
        <li key={look.id}>
          <LookCard look={look} index={index} />
        </li>
      ))}
    </ul>
  );
}

/** Tira de los próximos 14 días con el look asignado a cada uno. */
function Agenda({ looks }: { looks: Look[] }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = Array.from({ length: 14 }, (_, i) => {
    const date = new Date(today.getTime() + i * DAY);
    const key = toLocalKey(date);
    // La fecha guardada es el día que eligió el usuario, almacenado a medianoche
    // UTC. Se compara recortando la cadena y no convirtiendo a hora local: al
    // oeste de Greenwich esa conversión retrasa el día y el look aparecía en la
    // casilla anterior.
    return { date, look: looks.find((l) => l.scheduledAt?.slice(0, 10) === key) ?? null };
  });

  const planned = days.filter((d) => d.look).length;

  return (
    <div className="px-5">
      <p className="mb-3 text-xs text-ink-faint">
        {planned === 0
          ? "Ningún día planificado todavía. Asigna una fecha a tus looks desde la colección."
          : `${planned} de los próximos 14 días ya tienen look.`}
      </p>

      <ul className="flex flex-col gap-2">
        {days.map(({ date, look }) => (
          <li
            key={date.toISOString()}
            className="edge flex items-center gap-3 rounded-2xl bg-surface px-3 py-2.5"
          >
            <div className="w-12 shrink-0 text-center">
              <p className="text-[10px] uppercase tracking-wider text-ink-faint">
                {date.toLocaleDateString("es-ES", { weekday: "short" })}
              </p>
              <p className="tabular font-display text-xl leading-none">{date.getDate()}</p>
            </div>

            {look ? (
              <Link
                href={`/dashboard/studio?look=${look.id}`}
                className="flex min-w-0 flex-1 items-center gap-3"
              >
                <span className="flex -space-x-3">
                  {look.items.slice(0, 3).map((item) => (
                    <span
                      key={item.id}
                      className="edge size-10 overflow-hidden rounded-lg bg-display"
                    >
                      <Foto
                        ruta={item.imageUrl}
                        alt={item.name}
                        width={40}
                        height={40}
                        className="size-full object-contain"
                      />
                    </span>
                  ))}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">{look.name}</span>
              </Link>
            ) : (
              <span className="flex-1 text-sm text-ink-faint">Sin planificar</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Clave YYYY-MM-DD en hora local: comparar con toISOString desplazaría el día
 *  para quien viva al oeste de Greenwich. */
function toLocalKey(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
