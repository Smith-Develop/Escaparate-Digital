"use client";

import { PlacementEditor } from "@/components/closet/PlacementEditor";
import {
  clampPlacement,
  defaultPlacement,
  resolveHeight,
  type Placement,
} from "@/lib/placement";
import type { AvatarParams } from "@/lib/types";

type Props = {
  imageUrl: string;
  category: string;
  avatar: AvatarParams;
  value: Placement;
  onChange: (placement: Placement) => void;
  context?: { id: string; imageUrl: string; placement: Placement }[];
  /** Colocación a la que vuelve «Restablecer». Por defecto, la de la categoría. */
  fallback?: Placement;
  hint?: string;
  reference?: { imageUrl: string; x: number; y: number; w: number; h?: number } | null;
  imageWidth?: number;
  imageHeight?: number;
};

/** Editor de colocación con sus controles: arrastrar, escalar y restablecer. */
export function PlacementPanel({
  imageUrl,
  category,
  avatar,
  value,
  onChange,
  context,
  fallback,
  hint,
  reference,
  imageWidth = 0,
  imageHeight = 0,
}: Props) {
  const height = resolveHeight(value, imageWidth, imageHeight);
  const estirada = Boolean(value.h && value.h > 0);
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm leading-relaxed text-ink-muted">
        {hint ??
          `Arrastra la prenda sobre ${reference ? "tu foto" : "el maniquí"} y estírala por los tiradores hasta que cubra lo que tiene que cubrir. Es la colocación que usará el probador cada vez que la combines.`}
      </p>

      <PlacementEditor
        imageUrl={imageUrl}
        avatar={avatar}
        value={value}
        onChange={onChange}
        context={context}
        reference={reference}
        imageWidth={imageWidth}
        imageHeight={imageHeight}
      />

      <Medida
        label="Ancho"
        value={value.w}
        onChange={(w) => onChange(clampPlacement({ ...value, w }))}
      />
      <Medida
        label="Alto"
        value={height}
        onChange={(h) => onChange(clampPlacement({ ...value, h }))}
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange(clampPlacement({ ...value, x: 0.5 }))}
          className="min-h-10 flex-1 rounded-full border border-line text-sm text-ink-muted"
        >
          Centrar
        </button>
        <button
          type="button"
          onClick={() => onChange(clampPlacement({ ...value, h: 0 }))}
          disabled={!estirada}
          className="min-h-10 flex-1 rounded-full border border-line text-sm text-ink-muted disabled:opacity-40"
        >
          Sin estirar
        </button>
        <button
          type="button"
          onClick={() => onChange(fallback ?? defaultPlacement(category))}
          className="min-h-10 flex-1 rounded-full border border-line text-sm text-ink-muted"
        >
          Restablecer
        </button>
      </div>
    </div>
  );
}

/** Deslizador de una dimensión, en porcentaje del lienzo. */
function Medida({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-baseline justify-between">
        <span className="text-xs uppercase tracking-[0.14em] text-ink-faint">{label}</span>
        <span className="tabular font-display text-lg">{Math.round(value * 100)}%</span>
      </span>
      <input
        type="range"
        min={4}
        max={160}
        value={Math.round(value * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        aria-label={`${label} de la prenda`}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-surface-2 accent-[var(--color-accent)]"
      />
    </label>
  );
}
