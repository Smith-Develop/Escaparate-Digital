"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { escribirBooleana, leerBooleana } from "@/lib/preferencias";

/**
 * El aviso para instalar la app en la pantalla de inicio.
 *
 * Hay dos caminos, y no se parecen en nada:
 *
 *   · **Android y escritorio** avisan con `beforeinstallprompt` cuando la app
 *     cumple los requisitos (manifiesto válido, HTTPS y service worker). Ese
 *     aviso hay que guardarlo, porque solo se puede usar una vez y solo a
 *     partir de un gesto del usuario.
 *   · **iOS no tiene ese evento.** Allí solo cabe explicar el camino a mano:
 *     Compartir → Añadir a pantalla de inicio. Es el único modo de instalar una
 *     app en un iPhone sin pasar por la App Store, así que merece la pena
 *     contarlo en vez de callar.
 *
 * No aparece si ya está instalada, ni dentro del APK, ni si se ha descartado.
 */

const OCULTAR = "escaparate-instalar-oculto";

type AvisoDeInstalacion = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const yaInstalada = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (window.navigator as { standalone?: boolean }).standalone === true;

const dentroDelApk = () =>
  (window as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.() ===
  true;

const esIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  // El iPad moderno se hace pasar por un Mac; lo delata que tenga táctil.
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

/**
 * En qué situación estamos, resuelto al pintar y no en un efecto.
 *
 * Devuelve una cadena a propósito: React compara el resultado con el anterior
 * para decidir si repintar, y un objeto nuevo en cada llamada sería un bucle.
 * El valor del servidor es «nada» porque al prerenderizar no hay navegador que
 * preguntar, y pintar el aviso para luego quitarlo daría un parpadeo.
 */
const sinCambios = () => () => {};

function situacion(): "nada" | "ios" | "resto" {
  if (yaInstalada() || dentroDelApk()) return "nada";
  if (esIOS()) {
    const ua = navigator.userAgent;
    // En iOS solo Safari puede instalar; Chrome y Firefox de allí no.
    return /safari/i.test(ua) && !/crios|fxios/i.test(ua) ? "ios" : "nada";
  }
  return "resto";
}

export function InstalarApp() {
  const donde = useSyncExternalStore(sinCambios, situacion, () => "nada" as const);
  const [aviso, setAviso] = useState<AvisoDeInstalacion | null>(null);
  const [descartado, setDescartado] = useState(false);
  const [instalada, setInstalada] = useState(false);

  useEffect(() => {
    if (donde !== "resto") return;

    const alPoderInstalar = (evento: Event) => {
      // Sin esto, Chrome enseña su propio aviso además del nuestro.
      evento.preventDefault();
      setAviso(evento as AvisoDeInstalacion);
    };
    // Si la instalan desde el menú del navegador, el aviso sobra.
    const alInstalar = () => setInstalada(true);

    window.addEventListener("beforeinstallprompt", alPoderInstalar);
    window.addEventListener("appinstalled", alInstalar);
    return () => {
      window.removeEventListener("beforeinstallprompt", alPoderInstalar);
      window.removeEventListener("appinstalled", alInstalar);
    };
  }, [donde]);

  const comoEnIOS = donde === "ios";
  const oculto =
    donde === "nada" ||
    instalada ||
    descartado ||
    (!comoEnIOS && !aviso) ||
    leerBooleana(OCULTAR, false);

  if (oculto) return null;

  const descartar = () => {
    setDescartado(true);
    escribirBooleana(OCULTAR, true);
  };

  return (
    <div className="edge mx-4 mb-1 flex items-center gap-3 rounded-[1.25rem] bg-surface px-3 py-2.5">
      <span aria-hidden className="text-lg">
        📲
      </span>
      <p className="min-w-0 flex-1 text-xs leading-snug text-ink-muted">
        {comoEnIOS ? (
          <>
            Instálala en tu iPhone: pulsa <strong className="text-ink">Compartir</strong> y luego{" "}
            <strong className="text-ink">Añadir a pantalla de inicio</strong>.
          </>
        ) : (
          <>
            Instala Escaparate y ábrela como una app, también{" "}
            <strong className="text-ink">sin conexión</strong>.
          </>
        )}
      </p>

      {!comoEnIOS && (
        <button
          type="button"
          onClick={async () => {
            if (!aviso) return;
            await aviso.prompt();
            await aviso.userChoice;
            // El aviso del navegador solo sirve una vez, lo acepten o no.
            setAviso(null);
            setInstalada(true);
          }}
          className="min-h-9 shrink-0 rounded-full bg-accent px-3.5 text-xs font-semibold text-on-accent"
        >
          Instalar
        </button>
      )}

      <button
        type="button"
        onClick={descartar}
        aria-label="No volver a mostrar"
        className="grid size-8 shrink-0 place-items-center rounded-full text-ink-faint"
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
