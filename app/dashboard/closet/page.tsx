import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { ClosetView } from "@/components/closet/ClosetView";

export const metadata = { title: "Armario · Escaparate" };
export const dynamic = "force-dynamic";

export default async function ClosetPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [items, existing, tags] = await Promise.all([
    prisma.item.findMany({
      where: { userId: user.id },
      orderBy: [{ favorite: "desc" }, { createdAt: "desc" }],
    }),
    prisma.avatar.findUnique({ where: { userId: user.id } }),
    prisma.tag.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
  ]);
  const avatar = existing ?? (await prisma.avatar.create({ data: { userId: user.id } }));

  return (
    <>
      <Header
        title="Escaparate"
        subtitle={`${items.length} ${items.length === 1 ? "prenda catalogada" : "prendas catalogadas"}`}
      />
      <ClosetView items={items} avatar={avatar} tags={tags} />
    </>
  );
}
