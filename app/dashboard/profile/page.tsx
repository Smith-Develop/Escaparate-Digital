import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/app/(auth)/actions";
import { Header } from "@/components/layout/Header";
import { AvatarEditor } from "@/components/profile/AvatarEditor";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BodyPhoto } from "@/components/profile/BodyPhoto";

export const metadata = { title: "Perfil · Escaparate" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const avatar =
    (await prisma.avatar.findUnique({ where: { userId: user.id } })) ??
    (await prisma.avatar.create({ data: { userId: user.id } }));

  const [itemCount, lookCount] = await Promise.all([
    prisma.item.count({ where: { userId: user.id } }),
    prisma.look.count({ where: { userId: user.id } }),
  ]);

  return (
    <>
      <Header title="Tus medidas" subtitle={`${user.name} · ${user.email}`} />

      <section className="mx-5 mb-6 rounded-2xl border border-line bg-surface p-4">
        <p className="text-sm leading-relaxed text-ink-muted">
          Con estas medidas se dibuja el maniquí de referencia que aparece al colocar cada
          prenda, para que la sitúes sobre tus propias proporciones. Si además te haces una
          foto de cuerpo entero, el probador montará los conjuntos sobre ti.
        </p>
        <p className="mt-3 text-xs text-ink-faint">
          {itemCount} prendas · {lookCount} looks guardados
        </p>
      </section>

      <div className="mb-8">
        <BodyPhoto avatar={avatar} />
      </div>

      <section className="mx-5 mb-8">
        <h2 className="mb-2 text-xs uppercase tracking-[0.14em] text-ink-faint">Apariencia</h2>
        <ThemeToggle />
      </section>

      <AvatarEditor initial={avatar} />

      <form action={logoutAction} className="px-5 pb-24">
        <button
          type="submit"
          className="min-h-11 w-full rounded-full border border-line text-sm text-ink-muted"
        >
          Cerrar sesión
        </button>
      </form>
    </>
  );
}
