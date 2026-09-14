import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { LooksView } from "@/components/looks/LooksView";
import type { Look } from "@/lib/types";

export const metadata = { title: "Looks · Escaparate" };
export const dynamic = "force-dynamic";

export default async function LooksPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const rows = await prisma.look.findMany({
    where: { userId: user.id },
    include: { items: { include: { item: true }, orderBy: { position: "asc" } } },
    orderBy: [{ scheduledAt: "asc" }, { updatedAt: "desc" }],
  });

  const looks: Look[] = rows.map((look) => ({
    id: look.id,
    name: look.name,
    notes: look.notes,
    occasion: look.occasion,
    scheduledAt: look.scheduledAt?.toISOString() ?? null,
    items: look.items.map((li) => li.item),
  }));

  return (
    <>
      <Header title="Lookbook" subtitle="Tus conjuntos guardados y planificados" />
      <LooksView looks={looks} />
    </>
  );
}
