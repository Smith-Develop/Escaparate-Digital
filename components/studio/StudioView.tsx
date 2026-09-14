"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CategoryRail, NINGUNA } from "@/components/studio/CategoryRail";
import { NINGUNO } from "@/components/studio/LookRail";
import { SidePanel } from "@/components/studio/SidePanel";
import { OutfitCanvas } from "@/components/studio/OutfitCanvas";
import { ZoomPan } from "@/components/studio/ZoomPan";
import { SaveLookSheet } from "@/components/studio/SaveLookSheet";
import { EmptyState } from "@/components/ui/EmptyState";
import { LAYER_BY_CATEGORY } from "@/lib/taxonomy";
import { bodyReference } from "@/lib/placement";
import { randomOutfit, useOutfit } from "@/lib/store";
import {
  escribirBooleana,
  leerBooleana,
  MI_FOTO,
  subscribePreferencia,
} from "@/lib/preferencias";
import type { AvatarParams, Item, Look } from "@/lib/types";

type Props = {
  avatar: AvatarParams;
  items: Item[];
  /** Conjuntos guardados, para el carrusel de la columna lateral. */
  looks: Look[];
  /** Look con el que se ha llegado desde el lookbook, si lo hay. */
  initialLookId: string | null;
};

/**
 * Probador.
 *
 * El avatar ocupa la mayor parte del ancho a la izquierda, a su derecha se
 * listan en cuadrícula las prendas que lleva puestas, y abajo un raíl a lo
 * ancho permite elegir categoría y prenda con iconos grandes. Si el usuario ha
 * guardado una foto de cuerpo entero, el conjunto se monta sobre ella.
 */
export function StudioView({ avatar, items, looks, initialLookId }: Props) {
  const equipped = useOutfit((s) => s.equipped);
  const equip = useOutfit((s) => s.equip);
  const unequipCategory = useOutfit((s) => s.unequipCategory);
  const clear = useOutfit((s) => s.clear);
  const toggle = useOutfit((s) => s.toggle);
  const setOutfit = useOutfit((s) => s.setOutfit);
  const loadLook = useOutfit((s) => s.loadLook);
  const editingLook = useOutfit((s) => s.editingLook);

  const [category, setCategory] = useState("superior");
  const [saveOpen, setSaveOpen] = useState(false);
  // La decisión de apagar la foto se recuerda: volver a encenderla al recargar
  // sería deshacer lo que el usuario acaba de pedir. Se lee como store externo
  // para no chocar con la hidratación del servidor.
  const showPhoto = useSyncExternalStore(
    subscribePreferencia,
    () => leerBooleana(MI_FOTO, true),
    () => true,
  );
  const [loaded, setLoaded] = useState<string | null>(null);

  // Al llegar desde el lookbook con ?look=…, el conjunto se carga equipado.
  const initialLook = initialLookId ? looks.find((l) => l.id === initialLookId) ?? null : null;
  if (initialLook && loaded !== initialLook.id) {
    setLoaded(initialLook.id);
    loadLook(initialLook);
  }

  const byCategory = useMemo(() => {
    const map = new Map<string, Item[]>();
    for (const item of items) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return map;
  }, [items]);

  const counts = useMemo(
    () => Object.fromEntries([...byCategory].map(([key, list]) => [key, list.length])),
    [byCategory],
  );

  /** Puestas de esa categoría. Solo los accesorios pueden ser más de una. */
  const equippedAllIn = (category: string) =>
    equipped
      .filter((i) => LAYER_BY_CATEGORY[i.category] === LAYER_BY_CATEGORY[category])
      .map((i) => i.id);

  /** Prueba otra prenda de esa categoría al azar. */
  const shuffle = (category: string) => {
    const pool = byCategory.get(category) ?? [];
    const puestas = new Set(equippedAllIn(category));
    // En los accesorios se añade uno que no lleve puesto; en el resto se
    // sustituye el que hubiera, porque solo cabe uno.
    const fresh = pool.filter((i) => !puestas.has(i.id));
    const from = fresh.length > 0 ? fresh : pool;
    const pick = from[Math.floor(Math.random() * from.length)];
    if (pick) equip(pick);
  };

  /** La prenda que queda centrada en el carrusel es la que se pone. */
  const centrar = (id: string) => {
    if (id === NINGUNA) {
      unequipCategory(category);
      return;
    }
    const item = items.find((i) => i.id === id);
    if (item) equip(item);
  };

  /** Pone o quita una prenda; lo usan los accesorios, que se acumulan. */
  const alternar = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (item) toggle(item);
  };

  /** El look que queda centrado en el carrusel es el que se pone entero. */
  const centrarLook = (id: string) => {
    if (id === NINGUNO) {
      clear();
      return;
    }
    const look = looks.find((l) => l.id === id);
    if (look) loadLook(look);
  };

  const photo = showPhoto ? bodyReference(avatar) : null;

  if (items.length === 0) {
    return (
      <div className="flex-1 px-5 pb-24">
        <EmptyState
          icon="✨"
          title="El estudio está vacío"
          description="Añade prendas a tu armario y colócalas sobre el maniquí para poder combinarlas aquí."
          action={{ label: "Añadir prenda", href: "/dashboard/closet/new" }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between gap-2 bg-display px-4 pb-2 pt-1">
        <button
          type="button"
          onClick={() => setOutfit(randomOutfit(items, equipped))}
          className="edge flex items-center gap-1.5 rounded-full bg-surface px-3.5 py-2 text-xs text-ink"
        >
          <span aria-hidden>🎲</span> Aleatorio
        </button>

        <div className="flex items-center gap-2">
          <AnimatePresence>
            {equipped.length > 0 && (
              <motion.button
                type="button"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={clear}
                className="rounded-full px-3 py-2 text-xs text-ink-muted"
              >
                Desvestir
              </motion.button>
            )}
          </AnimatePresence>
          <button
            type="button"
            onClick={() => setSaveOpen(true)}
            disabled={equipped.length === 0}
            className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-on-accent disabled:opacity-40"
          >
            Guardar look
          </button>
        </div>
      </header>

      {/* El fondo ocupa todo el ancho, sin tarjeta ni borde: la figura vive en
          el espacio de la pantalla, no dentro de un recuadro. */}
      <div className="flex flex-1 items-stretch gap-3 bg-display px-3 pb-2 pt-1">
        <div className="relative min-w-0 flex-1 overflow-hidden">
          <ZoomPan>
            <OutfitCanvas items={equipped} body={photo} />
          </ZoomPan>
          {equipped.length === 0 && (
            <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-[11px] text-ink-faint">
              Elige prendas abajo o pulsa Aleatorio
            </p>
          )}
        </div>

        <SidePanel
          equipped={equipped}
          looks={looks}
          selectedLookId={editingLook?.id ?? null}
          onCenterLook={centrarLook}
          defaultTab={initialLookId ? "looks" : "puestas"}
        />
      </div>

      <CategoryRail
        active={category}
        onCategoryChange={setCategory}
        items={byCategory.get(category) ?? []}
        equippedIds={equippedAllIn(category)}
        onCenter={centrar}
        onToggle={alternar}
        onShuffle={() => shuffle(category)}
        counts={counts}
      />

      {avatar.photoUrl && (
        <div className="flex items-center justify-end px-4 pb-2 pt-1">
          <label className="flex items-center gap-2 text-[11px] text-ink-muted">
            Mi foto
            <input
              type="checkbox"
              checked={showPhoto}
              onChange={(e) => escribirBooleana(MI_FOTO, e.target.checked)}
              className="edge relative h-5 w-9 cursor-pointer appearance-none rounded-full bg-surface-2
                         transition-colors checked:bg-accent
                         before:absolute before:left-0.5 before:top-0.5 before:size-4 before:rounded-full
                         before:bg-ink before:transition-transform checked:before:translate-x-4
                         checked:before:bg-on-accent"
            />
          </label>
        </div>
      )}

      <SaveLookSheet open={saveOpen} onClose={() => setSaveOpen(false)} />
    </div>
  );
}
