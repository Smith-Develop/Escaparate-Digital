"use client";

import { useEffect } from "react";

/** Registra el service worker que hace instalable la app y la deja usable sin red. */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    const register = () => navigator.serviceWorker.register("/sw.js").catch(() => {});
    // Registrar tras la carga evita competir por ancho de banda con la primera pintura.
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
