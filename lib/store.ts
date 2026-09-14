"use client";

import { create } from "zustand";
import { LAYER_BY_CATEGORY } from "@/lib/taxonomy";
import type { EditingLook, Item, Look } from "@/lib/types";

type Filters = {
  category: string;
  color: string;
  season: string;
  occasion: string;
  query: string;
};

const EMPTY_FILTERS: Filters = {
  category: "todas",
  color: "todas",
  season: "todas",
  occasion: "todas",
  query: "",
};

type ClosetState = {
  filters: Filters;
  setFilter: (key: keyof Filters, value: string) => void;
  resetFilters: () => void;
  activeFilterCount: () => number;
};

export const useCloset = create<ClosetState>((set, get) => ({
  filters: EMPTY_FILTERS,
  setFilter: (key, value) => set((s) => ({ filters: { ...s.filters, [key]: value } })),
  resetFilters: () => set({ filters: EMPTY_FILTERS }),
  activeFilterCount: () => {
    const { category, color, season, occasion, query } = get().filters;
    return [category, color, season, occasion].filter((v) => v !== "todas").length + (query ? 1 : 0);
  },
}));

/** Aplica los filtros en memoria: el armario cabe en el cliente y así el
 *  filtrado es instantáneo, sin ida y vuelta al servidor. */
export function filterItems(items: Item[], filters: Filters) {
  const query = filters.query.trim().toLowerCase();
  return items.filter((item) => {
    if (filters.category !== "todas" && item.category !== filters.category) return false;
    if (filters.color !== "todas" && item.color !== filters.color) return false;
    if (filters.season !== "todas" && item.season !== filters.season) return false;
    if (filters.occasion !== "todas" && item.occasion !== filters.occasion) return false;
    if (!query) return true;
    return `${item.name} ${item.subcategory} ${item.brand ?? ""}`.toLowerCase().includes(query);
  });
}

type OutfitState = {
  /** Prendas equipadas en orden de apilado: la última es la que se ve encima. */
  equipped: Item[];
  /** Conjunto guardado que se está editando, con sus metadatos. */
  editingLook: EditingLook | null;
  toggle: (item: Item) => void;
  /** Pone la prenda en su capa, sustituyendo a la que hubiera. Idempotente. */
  equip: (item: Item) => void;
  /** Deja libre la capa de esa categoría. */
  unequipCategory: (category: string) => void;
  bringToFront: (itemId: string) => void;
  setOutfit: (items: Item[]) => void;
  clear: () => void;
  /** Viste el conjunto guardado y lo marca como el que se está editando. */
  loadLook: (look: Look) => void;
  /** Adopta el look recién creado, para no duplicarlo al volver a guardar. */
  setEditingLook: (look: EditingLook | null) => void;
  isEquipped: (itemId: string) => boolean;
};

const layerOf = (item: Item) => LAYER_BY_CATEGORY[item.category] ?? "accesorio";

/**
 * Los accesorios no se sustituyen entre sí.
 *
 * Una camiseta ocupa el torso y solo cabe una, pero una pulsera, una cadena y
 * unas gafas se llevan a la vez. Por eso la regla de «una prenda por capa» se
 * aplica a todas las capas menos a esta.
 */
const acumulable = (item: Item) => layerOf(item) === "accesorio";

/** Quita lo que ocupa la misma capa, salvo que sea acumulable. */
const liberarCapa = (equipped: Item[], item: Item) =>
  acumulable(item) ? equipped : equipped.filter((i) => layerOf(i) !== layerOf(item));

export const useOutfit = create<OutfitState>((set, get) => ({
  equipped: [],
  editingLook: null,

  /**
   * El orden de selección manda: al equipar una prenda se coloca la última, es
   * decir, por encima de las demás. Así se decide si la camisa va por fuera del
   * pantalón o por dentro simplemente eligiendo en un orden u otro.
   */
  toggle: (item) =>
    set((state) => {
      if (state.equipped.some((i) => i.id === item.id)) {
        return { equipped: state.equipped.filter((i) => i.id !== item.id) };
      }
      // Una sola prenda por capa: elegir otra camiseta sustituye a la anterior.
      return { equipped: [...liberarCapa(state.equipped, item), item] };
    }),

  equip: (item) =>
    set((state) => {
      if (state.equipped.some((i) => i.id === item.id)) return state;
      return { equipped: [...liberarCapa(state.equipped, item), item] };
    }),

  unequipCategory: (category) =>
    set((state) => {
      const layer = LAYER_BY_CATEGORY[category] ?? "accesorio";
      return { equipped: state.equipped.filter((i) => layerOf(i) !== layer) };
    }),

  bringToFront: (itemId) =>
    set((state) => {
      const item = state.equipped.find((i) => i.id === itemId);
      if (!item) return state;
      return { equipped: [...state.equipped.filter((i) => i.id !== itemId), item] };
    }),

  setOutfit: (items) => set({ equipped: items, editingLook: null }),

  clear: () => set({ equipped: [], editingLook: null }),

  loadLook: (look) =>
    set({
      equipped: look.items,
      editingLook: {
        id: look.id,
        name: look.name,
        occasion: look.occasion,
        scheduledAt: look.scheduledAt,
      },
    }),

  setEditingLook: (look) => set({ editingLook: look }),

  isEquipped: (itemId) => get().equipped.some((i) => i.id === itemId),
}));

/**
 * Compone un conjunto al azar con el armario entero.
 *
 * Toma una prenda de cada categoría básica y añade abrigo o accesorio de vez en
 * cuando, para que no salgan siempre looks calcados. Se devuelve en el orden de
 * apilado natural, que es el punto de partida sensato; a partir de ahí el
 * usuario reordena lo que quiera.
 */
export function randomOutfit(items: Item[], avoid: Item[] = []): Item[] {
  const pick = (category: string) => {
    const pool = items.filter((i) => i.category === category);
    if (pool.length === 0) return null;
    // Se evita repetir la prenda anterior cuando hay alternativas.
    const fresh = pool.filter((i) => !avoid.some((a) => a.id === i.id));
    const from = fresh.length > 0 ? fresh : pool;
    return from[Math.floor(Math.random() * from.length)];
  };

  const outfit = [
    pick("calzado"),
    pick("inferior"),
    pick("superior"),
    Math.random() < 0.4 ? pick("abrigo") : null,
    // Los accesorios se acumulan, así que a veces salen dos.
    Math.random() < 0.45 ? pick("accesorio") : null,
    Math.random() < 0.2 ? pick("accesorio") : null,
  ]
    .filter((item): item is Item => item !== null)
    // `pick` puede repetir accesorio entre las dos tiradas.
    .filter((item, i, todos) => todos.findIndex((o) => o.id === item.id) === i);

  // Si el armario solo tiene una categoría, mejor devolver algo que nada.
  if (outfit.length === 0 && items.length > 0) {
    return [items[Math.floor(Math.random() * items.length)]];
  }
  return outfit;
}
