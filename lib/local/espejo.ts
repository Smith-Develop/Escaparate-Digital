"use client";

import { create } from "zustand";
import { borrarBase, leerTodo, leerUno, guardarUno, pedirPersistencia, reemplazar } from "@/lib/local/db";
import { precargar, purgar } from "@/lib/local/fotos";
import { listarPrendas } from "@/lib/datos/prendas";
import { listarLooks } from "@/lib/datos/looks";
import { listarEtiquetas } from "@/lib/datos/etiquetas";
import { leerAvatar } from "@/lib/datos/avatar";
import { leerPerfil, type Perfil } from "@/lib/datos/perfil";
import { ErrorDeRed } from "@/lib/datos/errores";
import type { AvatarParams, Item, Look, Tag } from "@/lib/types";

/**
 * El espejo: la única fuente de la que lee la interfaz.
 *
 * Al abrir la app se pinta con lo que hay guardado en el móvil —instantáneo y
 * sin red— y, si hay conexión, se refresca por detrás. Por eso el escaparate se
 * ve en el metro y por eso arranca más rápido que cuando cada pantalla se
 * pedía al servidor.
 *
 * La sincronización se trae **todo**, no solo lo que ha cambiado. Un armario
 * son cinco consultas y unos cientos de kilobytes; a cambio no hay que llevar
 * la cuenta de qué cambió ni de qué se borró, que es de donde salen los errores
 * imposibles de reproducir. Lo caro son las fotos, y esas van por su ruta y
 * nunca se descargan dos veces.
 */

type Espejo = {
  uid: string | null;
  items: Item[];
  looks: Look[];
  tags: Tag[];
  avatar: AvatarParams | null;
  perfil: Perfil | null;
  /** «cargando» solo la primera vez; luego se refresca sin vaciar la pantalla. */
  estado: "vacio" | "cargando" | "listo";
  sincronizando: boolean;
  /** Lo que se está viendo viene del móvil y aún no se ha podido refrescar. */
  desfasado: boolean;
  ultimaSync: number | null;
  descarga: { hechas: number; total: number } | null;
  error: string | null;

  iniciar: (uid: string, nombrePorDefecto?: string) => Promise<void>;
  refrescar: () => Promise<void>;
  cerrar: (uid: string) => Promise<void>;
};

const VACIO = {
  items: [] as Item[],
  looks: [] as Look[],
  tags: [] as Tag[],
  avatar: null as AvatarParams | null,
  perfil: null as Perfil | null,
};

/** Cada cuánto vale la pena volver a preguntar al servidor. */
const FRESCURA = 5 * 60 * 1000;

export const useEspejo = create<Espejo>((set, get) => ({
  uid: null,
  ...VACIO,
  estado: "vacio",
  sincronizando: false,
  desfasado: false,
  ultimaSync: null,
  descarga: null,
  error: null,

  async iniciar(uid, nombrePorDefecto) {
    if (nombrePorDefecto) set({ perfil: get().perfil ?? { id: uid, name: nombrePorDefecto, createdAt: new Date() } });
    if (get().uid === uid && get().estado === "listo") {
      // Ya montado: basta con mirar si conviene refrescar.
      const { ultimaSync } = get();
      if (!ultimaSync || Date.now() - ultimaSync > FRESCURA) void get().refrescar();
      return;
    }

    set({ uid, estado: "cargando", error: null });

    // 1· Lo que ya hay en el móvil, para pintar cuanto antes.
    try {
      const [items, looks, tags, avatar, perfil, marca] = await Promise.all([
        leerTodo<Item>(uid, "items"),
        leerTodo<Look>(uid, "looks"),
        leerTodo<Tag>(uid, "tags"),
        leerUno<{ id: string; valor: AvatarParams }>(uid, "sueltos", "avatar"),
        leerUno<{ id: string; valor: Perfil }>(uid, "sueltos", "perfil"),
        leerUno<{ id: string; valor: number }>(uid, "sueltos", "ultimaSync"),
      ]);
      if (items.length > 0 || avatar) {
        set({
          items,
          looks,
          tags,
          avatar: avatar?.valor ?? null,
          perfil: perfil?.valor ?? null,
          ultimaSync: marca?.valor ?? null,
          estado: "listo",
          desfasado: true,
        });
      }
    } catch {
      // Sin espejo previo no pasa nada: se llena con la sincronización.
    }

    void pedirPersistencia();
    await get().refrescar();
    if (get().estado !== "listo") set({ estado: "listo" });
  },

  async refrescar() {
    const uid = get().uid;
    if (!uid || get().sincronizando) return;
    set({ sincronizando: true, error: null });

    try {
      const [items, looks, tags, avatar, perfil] = await Promise.all([
        listarPrendas(),
        listarLooks(),
        listarEtiquetas(),
        leerAvatar(uid),
        leerPerfil(uid, get().perfil?.name),
      ]);

      set({ items, looks, tags, avatar, perfil, estado: "listo", desfasado: false, ultimaSync: Date.now() });

      await Promise.all([
        reemplazar(uid, "items", items),
        reemplazar(uid, "looks", looks),
        reemplazar(uid, "tags", tags),
        guardarUno(uid, "sueltos", { id: "avatar", valor: avatar }),
        guardarUno(uid, "sueltos", { id: "perfil", valor: perfil }),
        guardarUno(uid, "sueltos", { id: "ultimaSync", valor: Date.now() }),
      ]);

      // Las fotos, después y sin bloquear: la cuadrícula ya es usable con el
      // color dominante de cada prenda mientras llegan.
      const rutas = [...items.map((i) => i.imageUrl), avatar.photoUrl].filter(
        (r): r is string => Boolean(r),
      );
      void precargar(uid, rutas, (hechas, total) =>
        set({ descarga: hechas >= total ? null : { hechas, total } }),
      )
        .then(() => purgar(uid, new Set(rutas)))
        .finally(() => set({ descarga: null }));
    } catch (error) {
      const sinRed = error instanceof ErrorDeRed;
      set({
        desfasado: true,
        error: sinRed ? null : error instanceof Error ? error.message : "Algo ha fallado",
      });
    } finally {
      set({ sincronizando: false });
    }
  },

  async cerrar(uid) {
    // Que no quede nada de esa cuenta en el dispositivo.
    await borrarBase(uid).catch(() => undefined);
    set({ uid: null, ...VACIO, estado: "vacio", desfasado: false, ultimaSync: null, error: null });
  },
}));
