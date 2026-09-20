"use client";

import { Foto } from "@/components/ui/Foto";
import { useRouter } from "next/navigation";
import { actualizarPrenda, borrarPrenda } from "@/lib/datos/prendas";
import { useEspejo } from "@/lib/local/espejo";
import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { PlacementPanel } from "@/components/closet/PlacementPanel";
import { bodyReference, clampPlacement, type Placement } from "@/lib/placement";
import { centimosAEntrada, centimosATexto, precioACentimos } from "@/lib/dinero";
import { EMPTY_DRAFT, ItemForm, type ItemDraft } from "@/components/closet/ItemForm";
import type { CategoryId } from "@/lib/taxonomy";
import { CATEGORIES, colorsWith, labelFor, occasionsWith, seasonsWith } from "@/lib/taxonomy";
import { useOutfit } from "@/lib/store";
import type { AvatarParams, Item, Tag } from "@/lib/types";

type Props = { item: Item | null; avatar: AvatarParams; tags: Tag[]; onClose: () => void };

export function ItemDetailSheet({ item, avatar, tags, onClose }: Props) {
  const router = useRouter();
  const refrescar = useEspejo((s) => s.refrescar);
  const toggleEquipped = useOutfit((s) => s.toggle);
  const [busy, setBusy] = useState(false);
  const [placing, setPlacing] = useState<Placement | null>(null);
  const [editando, setEditando] = useState<ItemDraft | null>(null);
  const [fallo, setFallo] = useState<string | null>(null);

  if (!item) return <Sheet open={false} onClose={onClose}>{null}</Sheet>;

  const attributes: [string, string][] = [
    ["Categoría", labelFor(CATEGORIES, item.category)],
    ["Tipo", item.subcategory],
    ["Color", labelFor(colorsWith(tags), item.color)],
    ["Temporada", labelFor(seasonsWith(tags), item.season)],
    ["Ocasión", labelFor(occasionsWith(tags), item.occasion)],
    ...(item.brand ? ([["Marca", item.brand]] as [string, string][]) : []),
    ...(item.size ? ([["Talla", item.size]] as [string, string][]) : []),
    ...(item.priceCents !== null
      ? ([["Precio", centimosATexto(item.priceCents)]] as [string, string][])
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

  async function patch(cambios: Parameters<typeof actualizarPrenda>[1]) {
    if (!item) return;
    setBusy(true);
    try {
      await actualizarPrenda(item.id, cambios);
      await refrescar();
      onClose();
    } catch (error) {
      alert(error instanceof Error ? error.message : "No se ha podido guardar");
    } finally {
      setBusy(false);
    }
  }

  /** La ficha guardada, en la forma que espera el formulario de alta. */
  function aBorrador(prenda: Item): ItemDraft {
    return {
      ...EMPTY_DRAFT,
      name: prenda.name,
      category: prenda.category as CategoryId,
      subcategory: prenda.subcategory,
      color: prenda.color,
      season: prenda.season,
      occasion: prenda.occasion,
      brand: prenda.brand ?? "",
      notes: prenda.notes ?? "",
      size: prenda.size ?? "",
      price: prenda.priceCents === null ? "" : centimosAEntrada(prenda.priceCents),
      // El campo de fecha quiere aaaa-mm-dd, y la fecha se guardó a medianoche
      // UTC: cortarla en UTC evita que retroceda un día al oeste de Greenwich.
      purchasedAt: prenda.purchasedAt ? prenda.purchasedAt.toISOString().slice(0, 10) : "",
    };
  }

  async function guardarFicha() {
    if (!item || !editando) return;
    setBusy(true);
    setFallo(null);
    try {
      await actualizarPrenda(item.id, {
        name: editando.name,
        category: editando.category,
        subcategory: editando.subcategory,
        color: editando.color,
        season: editando.season,
        occasion: editando.occasion,
        brand: editando.brand || null,
        notes: editando.notes || null,
        size: editando.size || null,
        priceCents: precioACentimos(editando.price),
        purchasedAt: editando.purchasedAt || null,
      });
      await refrescar();
      setEditando(null);
      onClose();
    } catch (error) {
      setFallo(error instanceof Error ? error.message : "No se ha podido guardar");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!item) return;
    if (!confirm(`¿Eliminar "${item.name}" del armario?`)) return;
    setBusy(true);
    try {
      await borrarPrenda(item);
      await refrescar();
      onClose();
    } catch (error) {
      alert(error instanceof Error ? error.message : "No se ha podido borrar");
    } finally {
      setBusy(false);
    }
  }

  if (editando) {
    return (
      <Sheet open onClose={() => setEditando(null)} title={`Editar ${item.name}`}>
        <ItemForm
          draft={editando}
          onChange={setEditando}
          onSubmit={guardarFicha}
          saving={busy}
          error={fallo}
          submitLabel="Guardar cambios"
          tags={tags}
        />
        <Button variant="ghost" full className="mt-2" onClick={() => setEditando(null)} disabled={busy}>
          Cancelar
        </Button>
      </Sheet>
    );
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
        <Foto
          ruta={item.imageUrl}
          alt={item.name}
          color={item.dominantColor}
          fill
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
        <Button full variant="secondary" onClick={() => setEditando(aBorrador(item))}>
          Editar ficha
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
