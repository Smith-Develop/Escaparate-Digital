import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { lookInclude, lookOrderBy, serializeLook } from "@/lib/looks";
import { StudioView } from "@/components/studio/StudioView";

export const metadata = { title: "Estudio · Escaparate" };
export const dynamic = "force-dynamic";

export default async function StudioPage({ searchParams }: PageProps<"/dashboard/studio">) {
  const user = await getCurrentUser();
  if (!user) return null;

  const { look: lookId } = await searchParams;

  const [avatar, items, filas] = await Promise.all([
    prisma.avatar.findUnique({ where: { userId: user.id } }),
    prisma.item.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    // Todos los conjuntos, para el carrusel de la columna lateral. El que llega
    // por `?look=` ya está en esta lista, así que no hace falta consultarlo
    // aparte: basta con pasar su id.
    prisma.look.findMany({
      where: { userId: user.id },
      include: lookInclude,
      orderBy: lookOrderBy,
    }),
  ]);

  const params = avatar ?? (await prisma.avatar.create({ data: { userId: user.id } }));

  return (
    <div className="flex flex-1 flex-col pt-safe">
      <StudioView
        avatar={params}
        items={items}
        looks={filas.map(serializeLook)}
        initialLookId={typeof lookId === "string" ? lookId : null}
      />
    </div>
  );
}
