import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

const STEPS = [
  { n: "01", title: "Fotografía", text: "Dispara con el móvil y el fondo desaparece solo." },
  { n: "02", title: "Cataloga", text: "Categoría, color, temporada y ocasión en dos toques." },
  { n: "03", title: "Combina", text: "Monta el conjunto y guárdalo en el calendario." },
];

export default async function LandingPage() {
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <main className="flex flex-1 flex-col px-6 pb-safe pt-safe">
      <section className="flex flex-1 flex-col justify-center py-16">
        <span className="text-xs uppercase tracking-[0.3em] text-accent">Armario virtual</span>
        <h1 className="mt-4 font-display text-5xl leading-[1.05] tracking-tight">
          Todo tu armario,
          <br />
          en el bolsillo.
        </h1>
        <p className="mt-5 max-w-sm text-base leading-relaxed text-ink-muted">
          Digitaliza tus prendas, colócalas una vez sobre el maniquí y monta conjuntos
          enteros sin abrir un cajón.
        </p>

        <div className="mt-10 flex flex-col gap-3">
          <Link
            href="/register"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-6 font-semibold text-on-accent"
          >
            Crear mi armario
          </Link>
          <Link
            href="/login"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-line px-6 text-ink"
          >
            Ya tengo cuenta
          </Link>
        </div>
      </section>

      <section className="border-t border-line py-10">
        <ul className="flex flex-col gap-7">
          {STEPS.map((step) => (
            <li key={step.n} className="flex gap-4">
              <span className="font-display text-sm text-accent">{step.n}</span>
              <div>
                <h2 className="font-display text-lg">{step.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">{step.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
