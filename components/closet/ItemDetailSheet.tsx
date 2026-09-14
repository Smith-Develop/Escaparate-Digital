"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { PlacementPanel } from "@/components/closet/PlacementPanel";
import { bodyReference, clampPlacement, type Placement } from "@/lib/placement";
import { CATEGORIES, SEASONS, colorsWith, labelFor, occasionsWith } from "@/lib/taxonomy";
import { useOutfit } from "@/lib/store";
import type { AvatarParams, Item, Tag } from "@/lib/types";

type Props = { item: Item | null; avatar: AvatarParams; tags: Tag[]; onClose: () => void };

export function ItemDetailSheet({ item, avatar, tags, onClose }: Props) {
  const router = useRouter();
  const toggleEquipped = useOutfit((s) => s.toggle);
  const [busy, setBusy] = useState(false);
  const [placing, setPlacing] = useState<Placement | null>(null);

  if (!item) return <Sheet open={false} onClose={onClose}>{null}</Sheet>;

  const attributes: [string, string][] = [
    ["Categoría", labelFor(CATEGORIES, item.category)],
    ["Tipo", item.subcategory],
    ["Color", labelFor(colorsWith(tags), item.color)],
    ["Temporada", labelFor(SEASONS, item.season)],
    ["Ocasión", labelFor(occasionsWith(tags), item.occasion)],
    ...(item.brand ? ([["Marca", item.brand]] as [string, string][]) : []),
    ...(item.size ? ([["Talla", item.size]] as [string, string][]) : []),
    ...(item.priceCents !== null
      ? ([["Precio", (item.priceCents / 100).toLocaleString("es-ES", {
          minimumFractionDigits: 2,
        })]] as [string, string][])
      : []),
    ...(item.purchasedAt
      ? ([[
          "Comprada",
          // En UTC, igual que se guardó: convertirla movería el día elegido.
          item.purchasedAt.toLocaleDateString("es-ES", {
            day: "numeric",
            month: "long",
            year: "numeric",
            timeZone: "UTC",
          }),
        ]] as [string, string][])
      : []),
  ];

  async function patch(body: Record<string, unknown>) {
    if (!item) return;
    setBusy(true);
    await fetch(`/api/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    router.refresh();
    onClose();
  }

  async function remove() {
    if (!item) return;
    if (!confirm(`¿Eliminar "${item.name}" del armario?`)) return;
    setBusy(true);
    await fetch(`/api/items/${item.id}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
    onClose();
  }

  if (placing) {
    return (
      <Sheet open onClose={() => setPlacing(null)} title={`Colocar ${item.name}`}>
        <PlacementPanel
          imageUrl={item.imageUrl}
          category={item.category}
          avatar={avatar}
          value={placing}
          onChange={(next) => setPlacing(clampPlacement(next))}
          reference={bodyReference(avatar)}
          imageWidth={item.imageWidth}
          imageHeight={item.imageHeight}
        />
        <div className="mt-6 flex flex-col gap-2.5">
          <Button
            full
            loading={busy}
            onClick={() =>
              patch({
                placeX: placing.x,
                placeY: placing.y,
                placeW: placing.w,
                placeH: placing.h ?? 0,
              })
            }
          >
            Guardar colocación
          </Button>
          <Button variant="ghost" full onClick={() => setPlacing(null)} disabled={busy}>
            Cancelar
          </Button>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet open onClose={onClose} title={item.name}>
      {/* `fill` en vez de un tamaño fijo: con una altura relativa, una imagen de
          tamaño intrínseco se desbordaba de la caja y tapaba los datos. */}
      <div className="relative h-[30vh] max-h-72 w-full overflow-hidden rounded-2xl border border-line bg-display">
        <Image
          src={item.imageUrl}
          alt={item.name}
          fill
          sizes="(max-width: 512px) 90vw, 460px"
          className="object-contain p-4"
        />
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3">
        {attributes.map(([key, value]) => (
          <div key={key}>
            <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">{key}</dt>
            <dd className="mt-0.5 text-sm">{value}</dd>
          </div>
        ))}
      </dl>

      {item.notes && <p className="mt-4 text-sm leading-relaxed text-ink-muted">{item.notes}</p>}

      <div className="mt-6 flex flex-col gap-2.5">
        <Button
          full
          onClick={() => {
            toggleEquipped(item);
            router.push("/dashboard/studio");
          }}
        >
          Combinar en el estudio
        </Button>
        <Button
          full
          variant="secondary"
          onClick={() =>
            setPlacing({ x: item.placeX, y: item.placeY, w: item.placeW, h: item.placeH })
          }
        >
          Ajustar colocación
        </Button>
        <Button
          full
          variant="secondary"
          loading={busy}
          onClick={() => patch({ favorite: !item.favorite })}
        >
          {item.favorite ? "Quitar de favoritas" : "Marcar como favorita"}
        </Button>
        <Button full variant="danger" loading={busy} onClick={remove}>
          Eliminar prenda
        </Button>
      </div>
    </Sheet>
  );
}
