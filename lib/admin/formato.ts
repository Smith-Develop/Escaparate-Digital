/**
 * Cómo se escriben en el panel las cosas que no son del armario: tamaños de
 * fichero, fechas de alta, cuánto falta para que se levante una suspensión.
 *
 * Están juntas porque las tres pantallas del panel las usan igual, y porque una
 * fecha escrita de dos maneras distintas en la misma herramienta obliga a
 * leerla dos veces.
 */

/** Bytes en algo legible. Los armarios pesan megas, no gigas: dos escalones. */
export function tamano(bytes: number) {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toLocaleString("es-ES", { maximumFractionDigits: 2 })} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toLocaleString("es-ES", { maximumFractionDigits: 1 })} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** «14 de marzo de 2026», para fechas que se leen de una en una. */
export const fechaLarga = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
    : "—";

/** «14 mar 2026 · 09:32», para listas donde importa el orden y la hora. */
export const fechaCorta = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("es-ES", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

/**
 * Cuánto falta, en palabras.
 *
 * Una suspensión se lee mejor como «quedan 3 días» que como una fecha: lo que
 * se quiere saber es si sigue puesta y hasta cuándo, no el día exacto.
 */
export function cuantoFalta(iso: string | null) {
  if (!iso) return null;
  const minutos = Math.round((new Date(iso).getTime() - Date.now()) / 60000);
  if (minutos <= 0) return null;
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 48) return `${horas} h`;
  return `${Math.round(horas / 24)} días`;
}
