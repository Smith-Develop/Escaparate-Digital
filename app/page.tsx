"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSesion } from "@/components/SesionProvider";

const PASOS = [
  {
    n: "01",
    title: "Fotografía",
    text: "Dispara con el móvil y el fondo desaparece solo.",
  },
  {
    n: "02",
    title: "Cataloga",
    text: "Categoría, color, temporada y ocasión en dos toques.",
  },
  {
    n: "03",
    title: "Combina",
    text: "Monta el conjunto y guárdalo en el calendario.",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const { estado } = useSesion();

  // Quien ya ha entrado no necesita la presentación. Dentro del APK esta
  // pantalla casi no se ve: se abre con la sesión puesta.
  useEffect(() => {
    if (estado === "dentro") router.replace("/dashboard");
  }, [estado, router]);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 pb-safe pt-safe">
      <div className="flex items-center justify-center gap-2 py-2">
        <span className="edge grid size-9 place-items-center rounded-full bg-surface">
          <Percha className="size-5 text-ink" />
        </span>
        <span className="text-sm font-semibold tracking-[0.22em]">ESCAPARATE</span>
      </div>

      {/* El telón cálido con la percha, que es la portada de producto del
          diseño trasladada a lo que aquí se guarda: ropa, no artículos. */}
      <div className="bg-hero relative mt-4 grid h-56 place-items-center overflow-hidden rounded-[2rem]">
        <Percha className="size-28 text-on-accent/70" />
        <span className="edge absolute bottom-4 left-4 rounded-full bg-surface px-3 py-1.5 text-xs text-ink">
          También sin conexión
        </span>
      </div>

      <h1 className="mt-7 font-display text-[2.5rem] leading-[1.05]">
        Todo tu armario,
        <br />
        en el bolsillo.
      </h1>
      <p className="mt-3 text-base leading-relaxed text-ink-muted">
        Digitaliza tus prendas, colócalas una vez sobre el maniquí y monta conjuntos enteros sin
        abrir un cajón.
      </p>

      <div className="mt-7 flex flex-col gap-3">
        <Link
          href="/register"
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-6 font-semibold text-on-accent"
        >
          Crear mi armario
        </Link>
        <Link
          href="/login"
          className="edge inline-flex min-h-12 items-center justify-center rounded-full bg-surface px-6 text-ink"
        >
          Ya tengo cuenta
        </Link>
      </div>

      <ul className="mt-8 flex flex-col gap-3 pb-8">
        {PASOS.map((paso) => (
          <li key={paso.n} className="edge flex items-start gap-3 rounded-[1.5rem] bg-surface p-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-semibold text-ink">
              {paso.n}
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-base leading-tight">{paso.title}</h2>
              <p className="mt-0.5 text-sm leading-relaxed text-ink-muted">{paso.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}

/** La percha de la marca, el mismo trazo que el icono de la app. */
function Percha({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 7a2.5 2.5 0 1 1 2.5-2.5" />
      <path d="M12 7v2.2L3.8 15.6a1.2 1.2 0 0 0 .7 2.2h15a1.2 1.2 0 0 0 .7-2.2L12 9.2" />
    </svg>
  );
}
