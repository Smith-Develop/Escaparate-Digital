"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Mannequin } from "@/components/closet/Mannequin";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Label } from "@/components/ui/Field";
import {
  FIGURES,
  HAIR_COLORS,
  HAIR_STYLES,
  MEASUREMENTS,
  MEASUREMENT_GROUPS,
  SKIN_TONES,
} from "@/lib/taxonomy";
import type { AvatarParams } from "@/lib/types";

/**
 * Editor de medidas.
 *
 * Cada valor se puede ajustar con el deslizador o escribir a mano, y el dibujo
 * de la izquierda se actualiza al momento: es el mismo componente que usa el
 * probador, así que lo que se ve aquí es exactamente lo que llevará la ropa.
 */
export function AvatarEditor({ initial }: { initial: AvatarParams }) {
  const router = useRouter();
  const [params, setParams] = useState<AvatarParams>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [group, setGroup] = useState<string>(MEASUREMENT_GROUPS[0]);

  const set = <K extends keyof AvatarParams>(key: K, value: AvatarParams[K]) => {
    setParams((p) => ({ ...p, [key]: value }));
    setSaved(false);
  };

  async function save() {
    setSaving(true);
    await fetch("/api/avatar", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  const bmi = params.weightKg / (params.heightCm / 100) ** 2;
  const fields = MEASUREMENTS.filter((f) => f.group === group);

  return (
    <div className="flex flex-col gap-6 pb-4">
      {/* La figura acompaña al desplazamiento: se ve el efecto de cada ajuste. */}
      <div className="sticky top-0 z-10 bg-canvas/95 px-5 pb-3 pt-1 backdrop-blur">
        <div className="mx-auto h-64 w-full max-w-56">
          <Mannequin avatar={params} className="size-full text-accent" />
        </div>
      </div>

      <div className="px-5">
        <Label>Silueta base</Label>
        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
          {FIGURES.map((f) => (
            <Chip key={f.id} active={params.figure === f.id} onClick={() => set("figure", f.id)}>
              {f.label}
            </Chip>
          ))}
        </div>
      </div>

      <div className="px-5">
        <div className="edge grid grid-cols-3 rounded-full bg-surface p-1">
          {MEASUREMENT_GROUPS.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setGroup(name)}
              className={[
                "min-h-9 rounded-full text-sm transition-colors",
                group === name ? "bg-accent font-medium text-on-accent" : "text-ink-muted",
              ].join(" ")}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={group}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="flex flex-col gap-6 px-5"
        >
          {fields.map((field) => (
            <Measure
              key={field.key}
              label={field.label}
              unit={field.unit}
              min={field.min}
              max={field.max}
              help={field.help}
              hint={field.key === "weightKg" ? `IMC ${bmi.toFixed(1)}` : undefined}
              value={params[field.key as keyof AvatarParams] as number}
              onChange={(v) => set(field.key as keyof AvatarParams, v as never)}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      <div className="flex flex-col gap-6 px-5">
        <Swatches
          label="Tono de piel"
          colors={SKIN_TONES}
          value={params.skinTone}
          onChange={(v) => set("skinTone", v)}
        />
        <Swatches
          label="Color de pelo"
          colors={HAIR_COLORS}
          value={params.hairColor}
          onChange={(v) => set("hairColor", v)}
        />
        <div>
          <Label>Peinado</Label>
          <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
            {HAIR_STYLES.map((h) => (
              <Chip
                key={h.id}
                active={params.hairStyle === h.id}
                onClick={() => set("hairStyle", h.id)}
              >
                {h.label}
              </Chip>
            ))}
          </div>
        </div>

        <Button full onClick={save} loading={saving}>
          {saved ? "Medidas guardadas ✓" : "Guardar medidas"}
        </Button>
      </div>
    </div>
  );
}

/** Una medida: deslizador para ajustar a ojo y campo numérico para el valor exacto. */
function Measure({
  label,
  value,
  min,
  max,
  unit,
  help,
  hint,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  help?: string;
  hint?: string;
  onChange: (value: number) => void;
}) {
  const commit = (raw: number) => onChange(Math.min(max, Math.max(min, Math.round(raw))));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs uppercase tracking-[0.14em] text-ink-faint">{label}</span>
        <span className="flex items-center gap-2">
          {hint && <span className="text-xs text-ink-faint">{hint}</span>}
          <input
            type="number"
            inputMode="numeric"
            value={value}
            min={min}
            max={max}
            onChange={(e) => commit(Number(e.target.value))}
            className="edge tabular w-16 rounded-lg bg-surface py-1 text-right font-display text-lg"
          />
          <span className="w-5 text-sm text-ink-muted">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => commit(Number(e.target.value))}
        aria-label={label}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-surface-2 accent-[var(--color-accent)]"
      />
      {help && <p className="mt-1.5 text-xs leading-relaxed text-ink-faint">{help}</p>}
    </div>
  );
}

function Swatches({
  label,
  colors,
  value,
  onChange,
}: {
  label: string;
  colors: string[];
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex gap-3">
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            aria-label={color}
            aria-pressed={value === color}
            style={{ background: color }}
            className={[
              "size-10 rounded-full border-2 transition-transform",
              value === color ? "scale-110 border-accent" : "border-line",
            ].join(" ")}
          />
        ))}
      </div>
    </div>
  );
}
