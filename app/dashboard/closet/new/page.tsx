import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { AddItemFlow } from "@/components/closet/AddItemFlow";

export const metadata = { title: "Añadir prenda · Escaparate" };
export const dynamic = "force-dynamic";

export default async function NewItemPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [existente, tags] = await Promise.all([
    prisma.avatar.findUnique({ where: { userId: user.id } }),
    prisma.tag.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
  ]);
  const avatar = existente ?? (await prisma.avatar.create({ data: { userId: user.id } }));

  return (
    <>
      <Header
        title="Nueva prenda"
        subtitle="Fotografía, recorte y catalogación"
        back="/dashboard/closet"
      />
      <AddItemFlow avatar={avatar} tags={tags} />
    </>
  );
}
