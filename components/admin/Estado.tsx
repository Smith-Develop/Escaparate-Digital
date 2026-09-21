"use client";

import { useEffect, useState } from "react";
import { ErrorDeRed } from "@/lib/datos/errores";

/**
 * Cargar algo del servicio, con sus tres finales.
 *
 * El panel no tiene espejo local: cada pantalla pide sus datos al abrirse y
 * puede quedarse sin ellos. Así que las tres pantallas necesitan lo mismo
 * —esperando, ha fallado, ya está— y conviene que lo cuenten igual, incluido el
 * botón de reintentar, que aquí hace falta de verdad.
 */
export function useCarga<T>(pedir: () => Promise<T>, dependeDe = "") {
  const [intento, setIntento] = useState(0);
  // La clave identifica «qué se está pidiendo ahora mismo»: cambia al reintentar
  // y cuando cambia aquello de lo que depende la petición. Lo que llega se
  // guarda junto a la clave con la que se pidió, así que «cargando» se deduce
  // comparando —no hay que encender un estado a mano al empezar, que es lo que
  // React 19 ya no deja hacer dentro de un efecto— y una respuesta que llega
  // tarde, de una petición vieja, se distingue sola y se descarta.
  const clave = `${intento}|${dependeDe}`;
  const [resultado, setResultado] = useState<{ clave: string; datos?: T; error?: Error } | null>(
    null,
  );

  useEffect(() => {
    let vigente = true;
    pedir()
      .then((datos) => {
        if (vigente) setResultado({ clave, datos });
      })
      .catch((e) => {
        if (vigente) setResultado({ clave, error: e instanceof Error ? e : new Error(String(e)) });
      });
    return () => {
      vigente = false;
    };
    // `pedir` es una función anónima que quien llama recrea en cada dibujo;
    // meterla en la lista pediría la carga una y otra vez. La dependencia de
    // verdad es la clave.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);

  const alDia = resultado?.clave === clave ? resultado : null;
  return {
    datos: alDia?.datos ?? null,
    error: alDia?.error ?? null,
    cargando: !alDia,
    recargar: () => setIntento((n) => n + 1),
  };
}

export function Cargando({ que = "Cargando" }: { que?: string }) {
  return (
    <div className="grid place-items-center py-20">
      <span
        aria-label={que}
        className="size-7 animate-spin rounded-full border-2 border-accent border-t-transparent"
      />
    </div>
  );
}

export function Fallo({ error, reintentar }: { error: Error; reintentar: () => void }) {
  const sinRed = error instanceof ErrorDeRed;
  return (
    <div
      role="alert"
      className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line px-6 py-12 text-center"
    >
      <span className="text-3xl" aria-hidden>
        {sinRed ? "📡" : "⚠️"}
      </span>
      <p className="text-sm text-ink">{error.message}</p>
      {sinRed && (
        <p className="max-w-xs text-xs leading-relaxed text-ink-faint">
          El panel trabaja siempre contra el servidor: a diferencia del armario, esto no se puede
          mirar sin conexión.
        </p>
      )}
      <button
        type="button"
        onClick={reintentar}
        className="mt-1 min-h-10 rounded-full bg-accent px-5 text-sm font-semibold text-on-accent"
      >
        Reintentar
      </button>
    </div>
  );
}
