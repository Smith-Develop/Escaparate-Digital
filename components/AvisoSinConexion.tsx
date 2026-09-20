"use client";

import { useConexion } from "@/lib/local/conexion";
import { useEspejo } from "@/lib/local/espejo";

/**
 * La cinta que explica por qué no se puede guardar.
 *
 * Sin conexión el armario se sigue viendo entero, así que sin un aviso el
 * usuario no entiende por qué los botones de guardar están apagados. También
 * enseña el progreso de la primera descarga, que en un armario grande puede
 * tardar y conviene que no parezca que la app se ha quedado colgada.
 */
export function AvisoSinConexion() {
  const hayRed = useConexion();
  const descarga = useEspejo((s) => s.descarga);
  const desfasado = useEspejo((s) => s.desfasado);

  if (!hayRed) {
    return (
      <p className="mx-4 mb-1 rounded-full bg-surface px-4 py-2 text-center text-xs text-ink-muted edge">
        Sin conexión · estás viendo tu armario descargado
      </p>
    );
  }

  if (descarga) {
    return (
      <p className="mx-4 mb-1 rounded-full bg-surface px-4 py-2 text-center text-xs text-ink-muted edge">
        Descargando fotos · {descarga.hechas} de {descarga.total}
      </p>
    );
  }

  if (desfasado) {
    return (
      <p className="mx-4 mb-1 rounded-full bg-surface px-4 py-2 text-center text-xs text-ink-muted edge">
        No se ha podido actualizar · estás viendo lo último guardado
      </p>
    );
  }

  return null;
}
