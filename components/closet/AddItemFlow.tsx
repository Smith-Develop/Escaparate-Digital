"use client";

import { Foto } from "@/components/ui/Foto";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CapturaNativa } from "@/components/closet/CapturaNativa";
import { RetoqueEditor } from "@/components/closet/RetoqueEditor";
import { SiluetaGuia } from "@/components/closet/SiluetaGuia";
import { EMPTY_DRAFT, ItemForm, type ItemDraft } from "@/components/closet/ItemForm";
import { PlacementPanel } from "@/components/closet/PlacementPanel";
import { bodyReference, defaultPlacement, type Placement } from "@/lib/placement";
import { precioACentimos } from "@/lib/dinero";
import { subirFoto } from "@/lib/datos/fotos";
import { crearPrenda } from "@/lib/datos/prendas";
import { guardarFotoLocal } from "@/lib/local/fotos";
import { useEspejo } from "@/lib/local/espejo";
import { useSesion } from "@/components/SesionProvider";
import type { AvatarParams, Tag } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import {
  dominantColor,
  downscale,
  imageSize,
  removeBackgroundSafe,
  trimTransparent,
} from "@/lib/image";

type Step = "captura" | "procesando" | "retoque" | "detalles" | "colocacion";

/**
 * Orquesta el alta de una prenda:
 * foto → recorte de fondo → retoque a mano → metadatos → colocación → guardado.
 *
 * La colocación es el paso que hace que el probador funcione: se hace una vez,
 * a mano, y a partir de ahí la prenda siempre aparece donde el usuario la puso.
 */
export function AddItemFlow({ avatar, tags }: { avatar: AvatarParams; tags: Tag[] }) {
  const router = useRouter();
  const { uid } = useSesion();
  const refrescar = useEspejo((s) => s.refrescar);
  const [step, setStep] = useState<Step>("captura");
  const [shot, setShot] = useState<{
    original: Blob;
    cutout: Blob;
    removed: boolean;
    width: number;
    height: number;
  } | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  /** Resultado del retoque. Se guarda aparte para que el editor conserve la
   *  imagen original como referencia: si se le devolviera lo ya borrado, el
   *  modo restaurar no tendría de dónde recuperar. */
  const [retocado, setRetocado] = useState<Blob | null>(null);
  const [progress, setProgress] = useState({ percent: 0, label: "Preparando" });
  const [draft, setDraft] = useState<ItemDraft>(EMPTY_DRAFT);
  const [placement, setPlacement] = useState<Placement>(defaultPlacement(EMPTY_DRAFT.category));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCapture(raw: Blob) {
    setStep("procesando");
    setProgress({ percent: 0, label: "Preparando la foto" });

    const original = await downscale(raw);
    const { blob: removedBg, removed } = await removeBackgroundSafe(original, (percent, label) =>
      setProgress({ percent, label }),
    );
    // Sin el recorte al contenido, el probador coloca la prenda con aire
    // alrededor y se ve más pequeña de lo que es.
    const cutout = removed ? await trimTransparent(removedBg) : removedBg;

    const size = await imageSize(cutout);
    setShot({ original, cutout, removed, width: size.width, height: size.height });
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(cutout);
    });
    setStep("retoque");
  }

  function retake() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setShot(null);
    setRetocado(null);
    setError(null);
    setStep("captura");
  }

  /**
   * Sube una foto y la deja ya guardada en el móvil.
   *
   * La acabamos de hacer y la tenemos en memoria, así que no tiene ningún
   * sentido volver a descargarla del almacén para poder verla.
   */
  async function subir(blob: Blob) {
    const ruta = await subirFoto(blob, uid!);
    await guardarFotoLocal(uid!, ruta, blob);
    return ruta;
  }

  async function save() {
    if (!shot) return;
    setSaving(true);
    setError(null);

    try {
      // Tras el retoque conviene volver a recortar al contenido: si se ha
      // borrado el borde, la prenda ya no llega hasta los límites de la imagen.
      const definitiva = await trimTransparent(retocado ?? shot.cutout);
      const medidas = await imageSize(definitiva);

      const [imageUrl, originalUrl, color] = await Promise.all([
        subir(definitiva),
        subir(shot.original),
        dominantColor(definitiva),
      ]);

      await crearPrenda(
        {
          name: draft.name,
          category: draft.category,
          subcategory: draft.subcategory,
          color: draft.color,
          season: draft.season,
          occasion: draft.occasion,
          brand: draft.brand || null,
          notes: draft.notes || null,
          imageUrl,
          originalUrl,
          dominantColor: color,
          imageWidth: medidas.width,
          imageHeight: medidas.height,
          placeX: placement.x,
          placeY: placement.y,
          placeW: placement.w,
          placeH: placement.h ?? 0,
          size: draft.size || null,
          // El usuario escribe en su moneda; se guarda en céntimos enteros.
          priceCents: precioACentimos(draft.price),
          purchasedAt: draft.purchasedAt || null,
        },
        uid!,
      );

      if (preview) URL.revokeObjectURL(preview);
      await refrescar();
      router.push("/dashboard/closet");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo ha fallado al guardar");
      setSaving(false);
    }
  }

  return (
    <AnimatePresence mode="wait">
      {step === "captura" && (
        <motion.div
          key="captura"
          exit={{ opacity: 0 }}
          className="flex min-h-0 flex-1 flex-col px-5 pb-6"
        >
          <CapturaNativa
            onCapture={handleCapture}
            guide={<SiluetaGuia avatar={avatar} />}
            hint="Extiende la prenda sobre un fondo liso y encuádrala entera, con la proporción que prefieras."
          />
        </motion.div>
      )}

      {step === "procesando" && (
        <motion.div
          key="procesando"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-1 flex-col items-center justify-center gap-6 px-10 text-center"
        >
          <span className="size-12 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <div className="w-full">
            <p className="text-sm text-ink">{progress.label}…</p>
            <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-surface-2">
              <motion.div
                className="h-full bg-accent"
                animate={{ width: `${Math.max(5, progress.percent)}%` }}
                transition={{ ease: "easeOut" }}
              />
            </div>
            <p className="mt-4 text-xs leading-relaxed text-ink-faint">
              La primera prenda tarda un poco más: el modelo de recorte se descarga una sola vez
              y luego queda guardado en el navegador.
            </p>
          </div>
        </motion.div>
      )}

      {step === "retoque" && preview && shot && (
        <motion.div
          key="retoque"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-1 flex-col gap-5 px-5 pb-24"
        >
          <RetoqueEditor
            blob={shot.cutout}
            onChange={(limpio) => {
              setRetocado(limpio);
              setPreview((viejo) => {
                if (viejo) URL.revokeObjectURL(viejo);
                return URL.createObjectURL(limpio);
              });
            }}
          />

          {!shot.removed && (
            <p className="edge rounded-xl bg-surface px-4 py-3 text-xs leading-relaxed text-ink-muted">
              No se ha podido recortar el fondo automáticamente (sin conexión o modelo no
              disponible). Puedes borrarlo a mano aquí mismo.
            </p>
          )}

          <Button full onClick={() => setStep("detalles")}>
            Continuar
          </Button>
          <Button variant="ghost" full onClick={retake}>
            Repetir foto
          </Button>
        </motion.div>
      )}

      {step === "detalles" && preview && (
        <motion.div
          key="detalles"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-1 flex-col gap-6 px-5 pb-24"
        >
          <div className="relative grid aspect-square w-full place-items-center overflow-hidden rounded-2xl border border-line bg-checker p-4">
            <Foto
              ruta={preview}
              alt="Prenda recortada"
              width={512}
              height={512}
              className="max-h-full w-auto object-contain"
            />
            <button
              type="button"
              onClick={() => setStep("retoque")}
              className="absolute bottom-3 right-3 rounded-full bg-canvas/90 px-4 py-2 text-xs text-ink"
            >
              Retocar
            </button>
          </div>

          <ItemForm
            draft={draft}
            onChange={(next) => {
              // Al cambiar de categoría, la colocación de partida cambia con ella.
              if (next.category !== draft.category) setPlacement(defaultPlacement(next.category));
              setDraft(next);
            }}
            onSubmit={() => setStep("colocacion")}
            submitLabel="Continuar a la colocación"
            error={error}
            tags={tags}
          />

          <Button variant="ghost" full onClick={retake} disabled={saving}>
            Descartar y volver a empezar
          </Button>
        </motion.div>
      )}
      {step === "colocacion" && preview && (
        <motion.div
          key="colocacion"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-1 flex-col gap-5 px-5 pb-24"
        >
          <PlacementPanel
            imageUrl={preview}
            category={draft.category}
            avatar={avatar}
            value={placement}
            onChange={setPlacement}
            reference={bodyReference(avatar)}
            imageWidth={shot?.width ?? 0}
            imageHeight={shot?.height ?? 0}
          />

          {error && (
            <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </p>
          )}

          <Button full onClick={save} loading={saving}>
            Guardar en el armario
          </Button>
          <Button variant="ghost" full onClick={() => setStep("detalles")} disabled={saving}>
            Volver a los datos
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
