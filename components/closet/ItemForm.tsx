"use client";

import { useState } from "react";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Field";
import { NuevaEtiqueta } from "@/components/closet/NuevaEtiqueta";
import { CATEGORIES, SEASONS, SUBCATEGORIES, colorsWith, occasionsWith } from "@/lib/taxonomy";
import type { CategoryId } from "@/lib/taxonomy";
import type { Tag } from "@/lib/types";

export type ItemDraft = {
  name: string;
  category: CategoryId;
  subcategory: string;
  color: string;
  season: string;
  occasion: string;
  brand: string;
  notes: string;
  /** Talla tal como viene en la etiqueta: M, 42, 30x32… */
  size: string;
  /** Precio aproximado, escrito en la moneda del usuario. */
  price: string;
  /** Fecha de compra, en formato aaaa-mm-dd. */
  purchasedAt: string;
};

export const EMPTY_DRAFT: ItemDraft = {
  name: "",
  category: "superior",
  subcategory: SUBCATEGORIES.superior[0],
  color: "negro",
  season: "todo-el-ano",
  occasion: "casual",
  brand: "",
  notes: "",
  size: "",
  price: "",
  purchasedAt: "",
};

type Props = {
  draft: ItemDraft;
  onChange: (draft: ItemDraft) => void;
  onSubmit: () => void;
  saving?: boolean;
  error?: string | null;
  submitLabel?: string;
  /** Colores y ocasiones que ha creado el usuario. */
  tags: Tag[];
};

/** Formulario de catalogación: todo por toque, sin teclado salvo nombre y marca. */
export function ItemForm({
  draft,
  onChange,
  onSubmit,
  saving,
  error,
  submitLabel,
  tags,
}: Props) {
  const colores = colorsWith(tags);
  const ocasiones = occasionsWith(tags);
  const [showExtras, setShowExtras] = useState(false);
  const set = <K extends keyof ItemDraft>(key: K, value: ItemDraft[K]) =>
    onChange({ ...draft, [key]: value });

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <label className="block">
        <Label>Nombre</Label>
        <Input
          value={draft.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Camiseta blanca básica…"
          required
          maxLength={80}
        />
      </label>

      <Group label="Categoría">
        {CATEGORIES.map((category) => (
          <Chip
            key={category.id}
            active={draft.category === category.id}
            onClick={() =>
              onChange({
                ...draft,
                category: category.id,
                // Al cambiar de categoría la subcategoría anterior deja de aplicar.
                subcategory: SUBCATEGORIES[category.id][0],
              })
            }
          >
            <span aria-hidden>{category.icon}</span>
            {category.label}
          </Chip>
        ))}
      </Group>

      <Group label="Tipo de prenda">
        {SUBCATEGORIES[draft.category].map((sub) => (
          <Chip key={sub} active={draft.subcategory === sub} onClick={() => set("subcategory", sub)}>
            {sub}
          </Chip>
        ))}
      </Group>

      <Group label="Color principal">
        {colores.map((color) => (
          <Chip
            key={color.id}
            swatch={color.hex}
            active={draft.color === color.id}
            onClick={() => set("color", color.id)}
          >
            {color.label}
          </Chip>
        ))}
        <NuevaEtiqueta kind="color" onCreated={(slug) => set("color", slug)} />
      </Group>

      <Group label="Temporada">
        {SEASONS.map((season) => (
          <Chip
            key={season.id}
            active={draft.season === season.id}
            onClick={() => set("season", season.id)}
          >
            {season.label}
          </Chip>
        ))}
      </Group>

      <Group label="Ocasión">
        {ocasiones.map((occasion) => (
          <Chip
            key={occasion.id}
            active={draft.occasion === occasion.id}
            onClick={() => set("occasion", occasion.id)}
          >
            {occasion.label}
          </Chip>
        ))}
        <NuevaEtiqueta kind="ocasion" onCreated={(slug) => set("occasion", slug)} />
      </Group>

      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <Label>Talla</Label>
          <Input
            value={draft.size}
            onChange={(e) => set("size", e.target.value)}
            placeholder="M, 42, 30x32…"
            maxLength={20}
          />
        </label>
        <label className="block">
          <Label>Precio</Label>
          <Input
            value={draft.price}
            onChange={(e) => set("price", e.target.value)}
            inputMode="decimal"
            placeholder="39,90…"
            maxLength={12}
          />
        </label>
      </div>

      <label className="block">
        <Label>Fecha de compra</Label>
        <Input
          type="date"
          value={draft.purchasedAt}
          onChange={(e) => set("purchasedAt", e.target.value)}
        />
      </label>

      {showExtras ? (
        <>
          <label className="block">
            <Label>Marca</Label>
            <Input
              value={draft.brand}
              onChange={(e) => set("brand", e.target.value)}
              placeholder="Zara, Levi’s…"
              maxLength={60}
            />
          </label>
          <label className="block">
            <Label>Notas</Label>
            <Textarea
              value={draft.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Talla, dónde la compraste, con qué combina…"
              maxLength={500}
            />
          </label>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setShowExtras(true)}
          className="self-start text-sm text-accent underline underline-offset-4"
        >
          + Añadir marca y notas
        </button>
      )}

      {error && (
        <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <Button type="submit" full loading={saving}>
        {submitLabel ?? "Guardar en el armario"}
      </Button>
    </form>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">{children}</div>
    </div>
  );
}
