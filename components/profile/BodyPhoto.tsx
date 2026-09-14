"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CapturaNativa } from "@/components/closet/CapturaNativa";
import { Mannequin } from "@/components/closet/Mannequin";
import { RetoqueEditor } from "@/components/closet/RetoqueEditor";
import { PlacementPanel } from "@/components/closet/PlacementPanel";
import { Button } from "@/components/ui/Button";
import { blobToFile, downscale, removeBackgroundSafe, trimTransparent } from "@/lib/image";
import { clampPlacement, type Placement } from "@/lib/placement";
import type { AvatarParams } from "@/lib/types";

type Step = "resumen" | "captura" | "procesando" | "retoque" | "colocacion";

const DEFAULT: Placement = { x: 0.5, y: 0.02, w: 0.86, h: 0 };

/**
 * Foto de cuerpo entero del usuario.
 *
 * Es la base del probador: en lugar de un avatar dibujado, el conjunto se monta
 * sobre una foto real. Se recorta el fondo y luego se alinea con el maniquí de
 * referencia una sola vez; a partir de ahí las prendas, que ya estaban
 * colocadas respecto a ese mismo maniquí, caen donde tienen que caer.
 */
export function BodyPhoto({ avatar }: { avatar: AvatarParams }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("resumen");
  const [preview, setPreview] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  /** Retoque aparte, para que el editor conserve la imagen original. */
  const [retocado, setRetocado] = useState<Blob | null>(null);
  const [progress, setProgress] = useState({ percent: 0, label: "Preparando" });
  const [placement, setPlacement] = useState<Placement>({
    x: avatar.photoX,
    y: avatar.photoY,
    w: avatar.photoW,
    h: avatar.photoH,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCapture(raw: Blob) {
    setStep("procesando");
    setProgress({ percent: 0, label: "Preparando la foto" });

    const original = await downscale(raw, 1600);
    const { blob: cut, removed } = await removeBackgroundSafe(original, (percent, label) =>
      setProgress({ percent, label }),
    );
    const trimmed = removed ? await trimTransparent(cut) : cut;

    setBlob(trimmed);
    setRetocado(null);
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(trimmed);
    });
    setPlacement(DEFAULT);
    setStep("retoque");
  }

  async function save() {
    if (!blob) return;
    setSaving(true);
    setError(null);
    try {
      const definitiva = await trimTransparent(retocado ?? blob);
      const body = new FormData();
      body.append("file", blobToFile(definitiva, "cuerpo.png"));
      const upload = await fetch("/api/upload", { method: "POST", body });
      const uploaded = await upload.json();
      if (!upload.ok) throw new Error(uploaded.error ?? "No se pudo subir la foto");

      await persist({ photoUrl: uploaded.url, ...placement });
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);
      setBlob(null);
      setStep("resumen");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo ha fallado");
    } finally {
      setSaving(false);
    }
  }

  /** Guarda la foto junto al resto de medidas, que la API espera completas. */
  async function persist(photo: { photoUrl: string | null } & Partial<Placement>) {
    await fetch("/api/avatar", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...avatar,
        photoUrl: photo.photoUrl,
        photoX: photo.x ?? avatar.photoX,
        photoY: photo.y ?? avatar.photoY,
        photoW: photo.w ?? avatar.photoW,
        photoH: photo.h ?? avatar.photoH,
      }),
    });
  }

  async function remove() {
    if (!confirm("¿Quitar tu foto del probador?")) return;
    setSaving(true);
    await persist({ photoUrl: null });
    setSaving(false);
    router.refresh();
  }

  return (
    <section className="px-5">
      <h2 className="mb-2 text-xs uppercase tracking-[0.14em] text-ink-faint">Tu foto</h2>

      <AnimatePresence mode="wait">
        {step === "resumen" && (
          <motion.div key="resumen" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {avatar.photoUrl ? (
              <div className="edge flex gap-4 rounded-2xl bg-surface p-4">
                <div className="relative h-32 w-20 shrink-0 overflow-hidden rounded-xl bg-display">
                  <Image
                    src={avatar.photoUrl}
                    alt="Tu foto de cuerpo entero"
                    fill
                    sizes="80px"
                    className="object-contain"
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
                  <p className="text-sm leading-relaxed text-ink-muted">
                    El probador monta los conjuntos sobre esta foto.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPlacement({
                          x: avatar.photoX,
                          y: avatar.photoY,
                          w: avatar.photoW,
                          h: avatar.photoH,
                        });
                        setPreview(avatar.photoUrl);
                        setBlob(null);
                        setStep("colocacion");
                      }}
                      className="min-h-9 rounded-full border border-line px-4 text-xs text-ink"
                    >
                      Recolocar
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep("captura")}
                      className="min-h-9 rounded-full border border-line px-4 text-xs text-ink"
                    >
                      Cambiar
                    </button>
                    <button
                      type="button"
                      onClick={remove}
                      className="min-h-9 rounded-full border border-line px-4 text-xs text-danger"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-line px-5 py-6 text-center">
                <p className="text-sm leading-relaxed text-ink-muted">
                  Hazte una foto de cuerpo entero y el probador vestirá tu propia figura en vez
                  de un maniquí. De frente, brazos algo separados y fondo liso.
                </p>
                <Button className="mt-4" onClick={() => setStep("captura")}>
                  Hacerme la foto
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {step === "captura" && (
          <motion.div key="captura" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Más vertical que el visor de prendas: hay que caber entero. */}
            <CapturaNativa
              onCapture={handleCapture}
              guide={<Mannequin avatar={avatar} className="size-full text-accent" />}
              hint="De frente, brazos algo separados y fondo liso. Usa el temporizador de tu cámara para colocarte."
            />
            <Button variant="ghost" full className="mt-4" onClick={() => setStep("resumen")}>
              Cancelar
            </Button>
          </motion.div>
        )}

        {step === "procesando" && (
          <motion.div
            key="procesando"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="edge flex flex-col items-center gap-5 rounded-2xl bg-surface px-6 py-10 text-center"
          >
            <span className="size-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            <p className="text-sm text-ink">{progress.label}…</p>
            <div className="h-1 w-full overflow-hidden rounded-full bg-surface-2">
              <motion.div
                className="h-full bg-accent"
                animate={{ width: `${Math.max(5, progress.percent)}%` }}
              />
            </div>
          </motion.div>
        )}

        {step === "retoque" && preview && blob && (
          <motion.div
            key="retoque"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col gap-4"
          >
            <RetoqueEditor
              blob={blob}
              onChange={(limpio) => {
                setRetocado(limpio);
                setPreview((viejo) => {
                  if (viejo) URL.revokeObjectURL(viejo);
                  return URL.createObjectURL(limpio);
                });
              }}
            />
            <Button full onClick={() => setStep("colocacion")}>
              Continuar
            </Button>
            <Button variant="ghost" full onClick={() => setStep("resumen")}>
              Cancelar
            </Button>
          </motion.div>
        )}

        {step === "colocacion" && preview && (
          <motion.div
            key="colocacion"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col gap-4"
          >
            <PlacementPanel
              imageUrl={preview}
              category="cuerpo"
              avatar={avatar}
              value={placement}
              onChange={(next) => setPlacement(clampPlacement(next))}
              fallback={DEFAULT}
              hint="Ajusta tu foto sobre el maniquí haciendo coincidir hombros y cintura: es lo que hará que la ropa caiga en su sitio."
            />

            {error && (
              <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
                {error}
              </p>
            )}

            <Button
              full
              loading={saving}
              onClick={async () => {
                if (blob) return save();
                // Solo se ha recolocado una foto que ya estaba guardada.
                setSaving(true);
                await persist({ photoUrl: avatar.photoUrl, ...placement });
                setSaving(false);
                setStep("resumen");
                router.refresh();
              }}
            >
              Guardar
            </Button>
            <Button variant="ghost" full onClick={() => setStep("resumen")} disabled={saving}>
              Cancelar
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
