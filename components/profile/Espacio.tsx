"use client";

import { useEffect, useState } from "react";
import { espacioUsado } from "@/lib/local/db";
import { useEspejo } from "@/lib/local/espejo";

/**
 * Cuánto ocupa el armario descargado.
 *
 * Importa sobre todo en iPhone: allí el sistema puede vaciar el almacén sin
 * avisar cuando anda justo de disco, y saber cuánto se está guardando ayuda a
 * entender por qué un día hay que volver a descargarlo todo.
 */
export function Espacio() {
  const [uso, setUso] = useState<{ usado: number; disponible: number } | null>(null);
  const ultimaSync = useEspejo((s) => s.ultimaSync);
  const items = useEspejo((s) => s.items);

  useEffect(() => {
    espacioUsado().then(setUso);
  }, [ultimaSync]);

  const mb = (bytes: number) => `${(bytes / 1048576).toLocaleString("es-ES", { maximumFractionDigits: 1 })} MB`;

  return (
    <div className="edge rounded-2xl bg-surface p-4 text-sm text-ink-muted">
      <p>
        {items.length} {items.length === 1 ? "prenda descargada" : "prendas descargadas"}
        {uso && uso.usado > 0 && <> · {mb(uso.usado)} ocupados</>}
      </p>
      <p className="mt-1 text-xs text-ink-faint">
        {ultimaSync
          ? `Actualizado ${new Date(ultimaSync).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`
          : "Aún no se ha sincronizado"}
      </p>
    </div>
  );
}
