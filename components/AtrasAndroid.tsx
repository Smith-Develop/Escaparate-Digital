"use client";

import { useEffect } from "react";
import { cerrarUltimo } from "@/lib/atras";
import { esAppNativa } from "@/lib/plataforma";

/**
 * El botón «atrás» de Android.
 *
 * Solo hace algo dentro del APK: en la web el navegador ya tiene su propio
 * gesto de volver. El orden es el que espera cualquiera que use un móvil:
 * primero se cierra lo que haya abierto encima, luego se retrocede de pantalla,
 * y solo si no queda a dónde volver se sale de la app.
 *
 * El complemento se carga a demanda para que el paquete de la web no se lleve
 * código de Capacitor que ahí no sirve de nada.
 */
export function AtrasAndroid() {
  useEffect(() => {
    if (!esAppNativa()) return;

    let quitar: (() => void) | undefined;

    void (async () => {
      const { App } = await import("@capacitor/app");
      const oyente = await App.addListener("backButton", ({ canGoBack }) => {
        if (cerrarUltimo()) return;
        if (canGoBack) window.history.back();
        else void App.exitApp();
      });
      quitar = () => void oyente.remove();
    })();

    return () => quitar?.();
  }, []);

  return null;
}
