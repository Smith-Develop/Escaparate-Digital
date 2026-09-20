"use client";

import { useState } from "react";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Field";
import { GestorEtiquetas } from "@/components/closet/GestorEtiquetas";
import {
  CATEGORIES,
  SUBCATEGORIES,
  colorsWith,
  occasionsWith,
  seasonsWith,
  typesWith,
} from "@/lib/taxonomy";
import type { CategoryId, Etiqueta, TagKind } from "@/lib/taxonomy";
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
  const tipos = typesWith(tags, draft.category);
  const colores = colorsWith(tags);
  const temporadas = seasonsWith(tags);
  const ocasiones = occasionsWith(tags);
  const [showExtras, setShowExtras] = useState(false);
  // Qué gestor de etiquetas propias está abierto, si hay alguno.
  const [gestionando, setGestionando] = useState<TagKind | null>(null);
  const set = <K extends keyof ItemDraft>(key: K, value: ItemDraft[K]) =>
    onChange({ ...draft, [key]: value });

  type Campo = "subcategory" | "color" | "season" | "occasion";

  /**
   * Panel de etiquetas propias de una propiedad.
   *
   * Al renombrar o borrar hay que mirar el valor elegido en el borrador: si era
   * justo el que se ha tocado, se queda apuntando a algo que ya no existe y la
   * prenda se guardaría con una etiqueta fantasma.
   */
  const gestor = (kind: TagKind, campo: Campo, lista: Etiqueta[], parent?: string) =>
    gestionando === kind && (
      <GestorEtiquetas
        kind={kind}
        parent={parent}
        propias={lista.filter((e) => e.propia)}
        onCreated={(id) => set(campo, id)}
        onRenamed={(antes, ahora) => {
          if (draft[campo] === antes) set(campo, ahora);
        }}
        onDeleted={(id) => {
          if (draft[campo] === id) set(campo, lista[0].id);
        }}
        onClose={() => setGestionando(null)}
      />
    );

  /** Chip que abre y cierra el gestor de esa propiedad. */
  const chipGestor = (kind: TagKind, etiqueta: string) => (
    <Chip
      active={gestionando === kind}
      onClick={() => setGestionando(gestionando === kind ? null : kind)}
    >
      + {etiqueta}
    </Chip>
  );

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

      <Group
        label="Tipo de prenda"
        extra={gestor("tipo", "subcategory", tipos, draft.category)}
      >
        {tipos.map((tipo) => (
          <Chip
            key={tipo.id}
            active={draft.subcategory === tipo.id}
            onClick={() => set("subcategory", tipo.id)}
          >
            {tipo.label}
          </Chip>
        ))}
        {chipGestor("tipo", "Tipo")}
      </Group>

      <Group label="Color principal" extra={gestor("color", "color", colores)}>
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
        {chipGestor("color", "Color")}
      </Group>

      <Group label="Temporada" extra={gestor("temporada", "season", temporadas)}>
        {temporadas.map((season) => (
          <Chip
            key={season.id}
            active={draft.season === season.id}
            onClick={() => set("season", season.id)}
          >
            {season.label}
          </Chip>
        ))}
        {chipGestor("temporada", "Temporada")}
      </Group>

      <Group label="Ocasión" extra={gestor("ocasion", "occasion", ocasiones)}>
        {ocasiones.map((occasion) => (
          <Chip
            key={occasion.id}
            active={draft.occasion === occasion.id}
            onClick={() => set("occasion", occasion.id)}
          >
            {occasion.label}
          </Chip>
        ))}
        {chipGestor("ocasion", "Ocasión")}
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
          className="self-start text-sm text-accent-ink underline underline-offset-4"
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

function Group({
  label,
  children,
  extra,
}: {
  label: string;
  children: React.ReactNode;
  /** Contenido a lo ancho, bajo la fila de etiquetas: dentro del carrusel
   *  horizontal un formulario se saldría de la pantalla por la derecha. */
  extra?: React.ReactNode;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">{children}</div>
      {extra && <div className="mt-2">{extra}</div>}
    </div>
  );
}
