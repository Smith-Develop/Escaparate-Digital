"use client";

import { create } from "zustand";
import { enRangoDePrecio } from "@/lib/dinero";
import { LAYER_BY_CATEGORY } from "@/lib/taxonomy";
import type { EditingLook, Item, Look } from "@/lib/types";

/**
 * Filtros del escaparate: una entrada por cada propiedad que se cataloga.
 *
 * Todas valen "todas" cuando no filtran, salvo la de favoritas, que es un
 * interruptor. Así `activeFilterCount` cuenta sin tener que saber de cada una.
 */
type Filters = {
  category: string;
  /** Tipo de prenda, guardado por su nombre igual que en `Item.subcategory`. */
  subcategory: string;
  color: string;
  season: string;
  occasion: string;
  brand: string;
  size: string;
  /** Tramo de `PRICE_RANGES`, o "sin" para las que no tienen precio. */
  price: string;
  /** Año de compra, o "sin" para las que no tienen fecha. */
  year: string;
  favorite: boolean;
  query: string;
};

const EMPTY_FILTERS: Filters = {
  category: "todas",
  subcategory: "todas",
  color: "todas",
  season: "todas",
  occasion: "todas",
  brand: "todas",
  size: "todas",
  price: "todas",
  year: "todas",
  favorite: false,
  query: "",
};

type ClosetState = {
  filters: Filters;
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  resetFilters: () => void;
  activeFilterCount: () => number;
};

export const useCloset = create<ClosetState>((set, get) => ({
  filters: EMPTY_FILTERS,
  setFilter: (key, value) => set((s) => ({ filters: { ...s.filters, [key]: value } })),
  resetFilters: () => set({ filters: EMPTY_FILTERS }),
  activeFilterCount: () => {
    const { query, favorite, ...resto } = get().filters;
    const porValor = Object.values(resto).filter((v) => v !== "todas").length;
    return porValor + (query ? 1 : 0) + (favorite ? 1 : 0);
  },
}));

/** Aplica los filtros en memoria: el armario cabe en el cliente y así el
 *  filtrado es instantáneo, sin ida y vuelta al servidor. */
export function filterItems(items: Item[], filters: Filters) {
  const query = filters.query.trim().toLowerCase();
  return items.filter((item) => {
    if (filters.category !== "todas" && item.category !== filters.category) return false;
    if (filters.subcategory !== "todas" && item.subcategory !== filters.subcategory) return false;
    if (filters.color !== "todas" && item.color !== filters.color) return false;
    if (filters.season !== "todas" && item.season !== filters.season) return false;
    if (filters.occasion !== "todas" && item.occasion !== filters.occasion) return false;
    if (filters.brand !== "todas" && (item.brand ?? "") !== filters.brand) return false;
    if (filters.size !== "todas" && (item.size ?? "") !== filters.size) return false;
    if (!enRangoDePrecio(item.priceCents, filters.price)) return false;
    if (filters.year !== "todas" && añoDeCompra(item) !== filters.year) return false;
    if (filters.favorite && !item.favorite) return false;
    if (!query) return true;
    const texto = `${item.name} ${item.subcategory} ${item.brand ?? ""} ${item.size ?? ""}`;
    return texto.toLowerCase().includes(query);
  });
}

/**
 * Año de compra tal como lo eligió el usuario.
 *
 * La fecha se guarda a medianoche UTC, así que hay que leerla en UTC: al oeste
 * de Greenwich, un 1 de enero se convertiría en el 31 de diciembre anterior y
 * la prenda saltaría de año en el filtro.
 */
export const añoDeCompra = (item: Item) =>
  item.purchasedAt ? String(new Date(item.purchasedAt).getUTCFullYear()) : "sin";

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
