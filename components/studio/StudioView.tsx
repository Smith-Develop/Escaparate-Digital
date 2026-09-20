"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CategoriasVertical } from "@/components/studio/CategoriasVertical";
import { CategoryRail, NINGUNA } from "@/components/studio/CategoryRail";
import { NINGUNO } from "@/components/studio/LookRail";
import { SidePanel } from "@/components/studio/SidePanel";
import { OutfitCanvas } from "@/components/studio/OutfitCanvas";
import { ZoomPan } from "@/components/studio/ZoomPan";
import { SaveLookSheet } from "@/components/studio/SaveLookSheet";
import { EmptyState } from "@/components/ui/EmptyState";
import { CATEGORIES, LAYER_BY_CATEGORY } from "@/lib/taxonomy";
import { bodyReference } from "@/lib/placement";
import { randomOutfit, useOutfit } from "@/lib/store";
import { degradadoDelConjunto } from "@/lib/paleta";
import { componerConjunto } from "@/lib/lienzoConjunto";
import { compartirImagen } from "@/lib/compartir";
import { BotonCompartir, IconoCamara } from "@/components/ui/BotonCompartir";
import { Aparece } from "@/components/ui/Aparece";
import { APARECE, BROTA } from "@/lib/animaciones";
import { useSesion } from "@/components/SesionProvider";
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

  const { uid } = useSesion();
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

  const categoriaActiva = CATEGORIES.find((c) => c.id === category);
  const nombreDelConjunto = editingLook?.name ?? "Conjunto nuevo";

  return (
    <div className="flex flex-1 flex-col gap-2.5 px-3 pb-2 pt-3">
      {/* El telón cálido: la figura vive sobre él, a sangre y con las esquinas
          redondeadas, igual que la foto de producto del diseño. Los controles
          flotan encima en vez de ocupar una cabecera propia, que en una
          pantalla de móvil es espacio que le quitas a la ropa.

          Tres columnas con el mismo aire entre ellas: categorías, figura y
          panel. Todo lo que flota va anclado a la columna del centro, así que
          se coloca solo por ancho de pantalla en vez de con distancias medidas
          a ojo desde el borde del telón. */}
      <motion.div
        {...APARECE}
        className="edge relative flex flex-1 items-stretch gap-2.5 overflow-hidden rounded-[1.75rem] p-2.5"
        style={{ background: degradadoDelConjunto(equipped) }}
      >
        <CategoriasVertical active={category} onChange={setCategory} counts={counts} />

        <div className="relative min-w-0 flex-1">
          <ZoomPan>
            <OutfitCanvas items={equipped} body={photo} />
          </ZoomPan>

          {/* Fila de arriba: al azar a un lado, los interruptores al otro. */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2">
            <button
              type="button"
              onClick={() => setOutfit(randomOutfit(items, equipped))}
              className="edge pointer-events-auto flex min-h-9 items-center gap-1.5 rounded-full bg-surface px-3 text-xs font-medium text-ink"
            >
              <span aria-hidden>🎲</span> Aleatorio
            </button>

            <div className="flex items-center gap-1.5">
              {avatar.photoUrl && (
                <BotonRedondo
                  label="Vestir sobre mi foto"
                  activo={showPhoto}
                  onClick={() => escribirBooleana(MI_FOTO, !showPhoto)}
                >
                  <IconoPersona />
                </BotonRedondo>
              )}

              <AnimatePresence>
                {equipped.length > 0 && (
                  <motion.div {...BROTA} className="pointer-events-auto">
                    <BotonRedondo label="Desvestir" onClick={clear}>
                      <IconoDesvestir />
                    </BotonRedondo>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Abajo a la izquierda, donde antes estaba «Desvestir»: cómo se
              llama lo que hay puesto. Es el dato que se mira al montar un
              conjunto —si se está retocando uno guardado o empezando otro— y
              hasta ahora vivía en letra pequeña dentro de la tarjeta. */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10">
            <AnimatePresence mode="wait" initial={false}>
              {equipped.length === 0 ? (
                <motion.p
                  key="pista"
                  {...APARECE}
                  exit={{ opacity: 0 }}
                  className="text-center text-[11px] text-ink-muted"
                >
                  Elige prendas abajo o pulsa Aleatorio
                </motion.p>
              ) : (
                <motion.div
                  key="nombre"
                  {...BROTA}
                  className="edge inline-flex max-w-full flex-col rounded-2xl bg-surface px-3 py-1.5"
                >
                  <span className="truncate font-display text-sm leading-tight">
                    {nombreDelConjunto}
                  </span>
                  <span className="tabular text-[10px] text-ink-faint">
                    {equipped.length} {equipped.length === 1 ? "prenda" : "prendas"}
                    {/* «Editando» y no «guardado»: cambiar una prenda no
                        suelta el look, así que lo que hay puesto puede no ser
                        ya lo que está guardado. */}
                    {editingLook ? " · editando" : " · sin guardar"}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <SidePanel
          equipped={equipped}
          looks={looks}
          selectedLookId={editingLook?.id ?? null}
          onCenterLook={centrarLook}
          defaultTab={initialLookId ? "looks" : "puestas"}
        />
      </motion.div>

      {/* La tarjeta blanca que sube desde abajo, con lo que se puede tocar. Su
          cabecera dice qué enseña el carrusel; el conjunto se lee en el telón. */}
      <Aparece
        index={1}
        className="edge flex flex-col gap-2 rounded-[1.75rem] bg-surface pb-2 pt-3"
      >
        <div className="flex items-center justify-between gap-3 px-4">
          {/* Sin el nombre del conjunto —que ahora vive en el telón— esta
              línea solo tiene que decir qué enseña el carrusel de abajo. En
              cuerpo mediano, para que en una pantalla de 320 px el título
              quepa entero al lado de los botones. */}
          <div className="min-w-0">
            <p className="truncate font-display text-base leading-tight">
              {categoriaActiva?.label ?? "Prendas"}
            </p>
            <p className="truncate text-[11px] text-ink-muted">
              {category === "accesorio" ? "Toca para poner y quitar" : "Desliza para probar"}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {/* La imagen se compone con las fotos del espejo, así que esto
                también funciona sin conexión. */}
            <BotonCompartir
              label="Compartir una foto del conjunto"
              className="edge grid size-10 place-items-center rounded-full bg-surface text-ink disabled:opacity-40"
              onCompartir={async () => {
                if (!uid || equipped.length === 0) return "imposible";
                const imagen = await componerConjunto(uid, equipped, photo, editingLook?.name);
                return compartirImagen(
                  imagen,
                  "conjunto.png",
                  editingLook?.name ?? "Mi conjunto",
                  "Montado con Escaparate",
                );
              }}
            >
              <IconoCamara />
            </BotonCompartir>

            <button
              type="button"
              onClick={() => setSaveOpen(true)}
              disabled={equipped.length === 0}
              className="min-h-10 rounded-full bg-accent px-4 text-sm font-semibold text-on-accent disabled:opacity-40"
            >
              {editingLook ? "Actualizar" : "Guardar"}
            </button>
          </div>
        </div>

        <CategoryRail
          active={category}
          items={byCategory.get(category) ?? []}
          equippedIds={equippedAllIn(category)}
          onCenter={centrar}
          onToggle={alternar}
          onShuffle={() => shuffle(category)}
        />
      </Aparece>

      <SaveLookSheet open={saveOpen} onClose={() => setSaveOpen(false)} />
    </div>
  );
}

/**
 * Botón redondo de los que flotan sobre el telón.
 *
 * Todos miden y pesan igual, encendidos o no: son la misma familia que los
 * botones de cabecera del resto de la app, y en el estudio hacen de esquina
 * ordenada en vez de tres controles de formas distintas.
 */
function BotonRedondo({
  label,
  onClick,
  activo,
  children,
}: {
  label: string;
  onClick: () => void;
  /** Para los que se quedan encendidos, como el de la foto propia. */
  activo?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={activo}
      className={[
        "edge pointer-events-auto grid size-9 place-items-center rounded-full transition-colors",
        activo ? "bg-accent text-on-accent" : "bg-surface text-ink-muted",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function IconoPersona() {
  return (
    <svg viewBox="0 0 24 24" className="size-[1.1rem]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="8" r="3.3" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}

function IconoDesvestir() {
  return (
    <svg viewBox="0 0 24 24" className="size-[1.1rem]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4.5 10.5A8 8 0 1 1 5 16" />
      <path d="M4 5.5v5h5" />
    </svg>
  );
}
