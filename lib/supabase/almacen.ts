"use client";

import type { SupportedStorage } from "@supabase/supabase-js";

/**
 * Dónde se guarda la sesión.
 *
 * En la web, `localStorage`. Dentro del APK, las preferencias nativas: el
 * almacenamiento del WebView se borra al «limpiar caché» desde los ajustes de
 * Android, y eso echaría al usuario de la app cada dos por tres.
 *
 * supabase-js admite un almacén asíncrono, que es lo que permite enchufar aquí
 * la API nativa sin envolverla en nada raro.
 */

const enCapacitor = () =>
  typeof window !== "undefined" &&
  (window as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.() ===
    true;

export function almacenDeSesion(): SupportedStorage | undefined {
  if (!enCapacitor()) return undefined; // localStorage, el de serie

  return {
    async getItem(clave) {
      const { Preferences } = await import("@capacitor/preferences");
      return (await Preferences.get({ key: clave })).value ?? null;
    },
    async setItem(clave, valor) {
      const { Preferences } = await import("@capacitor/preferences");
      await Preferences.set({ key: clave, value: valor });
    },
    async removeItem(clave) {
      const { Preferences } = await import("@capacitor/preferences");
      await Preferences.remove({ key: clave });
    },
  };
}

/**
 * Android congela los temporizadores del WebView al pasar la app a segundo
 * plano, así que el testigo de sesión se queda sin renovar y la primera acción
 * al volver falla con un error de permisos que no viene a cuento. Se para y se
 * arranca la renovación con el ciclo de vida de la aplicación.
 */
export async function vigilarSegundoPlano(cliente: {
  auth: { startAutoRefresh: () => void; stopAutoRefresh: () => void };
}) {
  if (!enCapacitor()) return;
  const { App } = await import("@capacitor/app");
  App.addListener("appStateChange", ({ isActive }) => {
    if (isActive) void cliente.auth.startAutoRefresh();
    else void cliente.auth.stopAutoRefresh();
  });
}
