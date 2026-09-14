import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata = { title: "Inicio · Escaparate" };
export const dynamic = "force-dynamic";

const QUICK_ACTIONS = [
  { href: "/dashboard/closet/new", label: "Añadir ropa", icon: "📸" },
  { href: "/dashboard/studio", label: "Montar look", icon: "✨" },
  { href: "/dashboard/looks", label: "Calendario", icon: "🗓️" },
] as const;

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [itemCount, lookCount, avatar, recentItems, nextLook] = await Promise.all([
    prisma.item.count({ where: { userId: user.id } }),
    prisma.look.count({ where: { userId: user.id } }),
    prisma.avatar.findUnique({ where: { userId: user.id } }),
    prisma.item.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.look.findFirst({
      where: { userId: user.id, scheduledAt: { gte: startOfToday } },
      orderBy: { scheduledAt: "asc" },
      include: { items: { include: { item: true }, orderBy: { position: "asc" } } },
    }),
  ]);

  return (
    <>
      <Header title={`Hola, ${user.name.split(" ")[0]}`} subtitle="Tu armario, siempre a mano." />

      <div className="grid grid-cols-3 gap-3 px-5">
        <Stat value={itemCount} label="Prendas" />
        <Stat value={lookCount} label="Looks" />
        <Stat value={avatar?.heightCm ?? 170} label="Altura cm" />
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

      {nextLook && (
        <section className="mt-8 px-5">
          <SectionTitle>Próximo look</SectionTitle>
          <Link
            href="/dashboard/looks"
            className="edge mt-3 flex items-center gap-4 rounded-2xl bg-surface p-4"
          >
            <div className="flex -space-x-4">
              {nextLook.items.slice(0, 3).map(({ item }) => (
                <span
                  key={item.id}
                  className="edge size-12 overflow-hidden rounded-xl bg-display"
                >
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    width={48}
                    height={48}
                    className="size-full object-contain"
                  />
                </span>
              ))}
            </div>
            <div className="min-w-0">
              <p className="truncate font-display text-lg">{nextLook.name}</p>
              <p className="text-sm text-ink-muted">
                {/* En UTC, igual que se guardó: convertir a la zona del
                    servidor movería el día que eligió el usuario. */}
                {nextLook.scheduledAt?.toLocaleDateString("es-ES", {
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
          {itemCount > 0 && (
            <Link href="/dashboard/closet" className="text-sm text-accent">
              Ver todo
            </Link>
          )}
        </div>

        {recentItems.length === 0 ? (
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
            {recentItems.map((item) => (
              <li key={item.id}>
                <Link
                  href="/dashboard/closet"
                  className="edge block aspect-square overflow-hidden rounded-xl bg-display p-2"
                >
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
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

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="edge rounded-2xl bg-surface px-3 py-4 text-center">
      <p className="tabular font-display text-3xl leading-none">{value}</p>
      <p className="mt-1.5 text-[11px] uppercase tracking-wider text-ink-faint">{label}</p>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xs uppercase tracking-[0.18em] text-ink-faint">{children}</h2>;
}
