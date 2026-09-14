"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Field";
import { borrarEtiqueta, crearEtiqueta, renombrarEtiqueta } from "@/lib/datos/etiquetas";
import { useEspejo } from "@/lib/local/espejo";
import { useSesion } from "@/components/SesionProvider";
import { TAG_KIND_LABEL, type Etiqueta, type TagKind } from "@/lib/taxonomy";

type Props = {
  kind: TagKind;
  /** Categoría a la que cuelga la etiqueta; solo en los tipos de prenda. */
  parent?: string;
  /** Etiquetas propias de esta propiedad, las únicas que se pueden tocar. */
  propias: Etiqueta[];
  /** Identificador de la etiqueta recién creada. */
  onCreated: (id: string) => void;
  /** Renombrada: el identificador solo cambia en los tipos de prenda. */
  onRenamed: (antes: string, ahora: string) => void;
  onDeleted: (id: string) => void;
  onClose: () => void;
};

/** Paleta de partida para un color propio: cubre lo que no traen los de serie. */
const MUESTRAS = [
  "#C2185B",
  "#7B1FA2",
  "#00897B",
  "#F9A825",
  "#E64A19",
  "#455A64",
  "#8D6E63",
  "#C0CA33",
];

const EJEMPLOS: Record<TagKind, string> = {
  tipo: "Camiseta oversize…",
  color: "Burdeos…",
  temporada: "Media estación…",
  ocasion: "Boda…",
};

/**
 * Añade, renombra y borra etiquetas propias de una propiedad de la prenda.
 *
 * Las listas de serie cubren lo habitual, pero cada armario tiene sus rarezas y
 * obligar a encajarlas en una lista cerrada estropea justo lo que hace útil el
 * catálogo: el filtrado. Se abre desde la propia fila de etiquetas y vive a lo
 * ancho, debajo: dentro del carrusel horizontal los botones se salían de la
 * pantalla por la derecha y no había forma de llegar a ellos.
 */
export function GestorEtiquetas({
  kind,
  parent,
  propias,
  onCreated,
  onRenamed,
  onDeleted,
  onClose,
}: Props) {
  const { uid } = useSesion();
  const tags = useEspejo((e) => e.tags);
  const refrescar = useEspejo((e) => e.refrescar);
  const [nombre, setNombre] = useState("");
  const [hex, setHex] = useState(MUESTRAS[0]);
  // Nombre en edición de cada etiqueta propia, mientras difiera del guardado.
  const [borradores, setBorradores] = useState<Record<string, string>>({});
  const [paletaDe, setPaletaDe] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** La fila de la base que hay detrás de una etiqueta de la lista. */
  const filaDe = (etiqueta: Etiqueta) => tags.find((t) => t.id === etiqueta.tagId);

  async function hacer<T>(marca: string, tarea: () => Promise<T>): Promise<T | null> {
    setOcupado(marca);
    setError(null);
    try {
      const resultado = await tarea();
      await refrescar();
      return resultado;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo ha fallado");
      return null;
    } finally {
      setOcupado(null);
    }
  }

  async function crear() {
    if (!nombre.trim() || !uid) return;
    const creada = await hacer("nuevo", () =>
      crearEtiqueta({ kind, parent, label: nombre.trim(), hex }, uid),
    );
    if (!creada) return;
    setNombre("");
    // En los tipos la prenda guarda el nombre; en el resto, el identificador.
    onCreated(kind === "tipo" ? creada.label : creada.slug);
  }

  async function renombrar(etiqueta: Etiqueta) {
    const fila = filaDe(etiqueta);
    const nuevo = (borradores[etiqueta.tagId!] ?? "").trim();
    if (!fila || !nuevo || nuevo === etiqueta.label) return;
    const guardada = await hacer(etiqueta.tagId!, () => renombrarEtiqueta(fila, nuevo, etiqueta.hex));
    if (!guardada) return;
    setBorradores((b) => ({ ...b, [etiqueta.tagId!]: guardada.label }));
    onRenamed(etiqueta.id, kind === "tipo" ? guardada.label : guardada.slug);
  }

  async function recolorear(etiqueta: Etiqueta, muestra: string) {
    const fila = filaDe(etiqueta);
    if (!fila) return;
    setPaletaDe(null);
    const guardada = await hacer(etiqueta.tagId!, () =>
      renombrarEtiqueta(fila, borradores[etiqueta.tagId!] ?? etiqueta.label, muestra),
    );
    if (guardada) onRenamed(etiqueta.id, kind === "tipo" ? guardada.label : guardada.slug);
  }

  async function borrar(etiqueta: Etiqueta) {
    const fila = filaDe(etiqueta);
    if (!fila) return;
    const hecho = await hacer(etiqueta.tagId!, async () => {
      await borrarEtiqueta(fila);
      return true;
    });
    if (hecho) onDeleted(etiqueta.id);
  }

  return (
    <div className="edge flex flex-col gap-3 rounded-2xl bg-surface p-3">
      <div className="flex gap-2">
        <Input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder={EJEMPLOS[kind]}
          maxLength={40}
          aria-label={`Nuevo ${TAG_KIND_LABEL[kind]}`}
          className="!py-2 !text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              crear();
            }
          }}
        />
        <button
          type="button"
          onClick={crear}
          disabled={ocupado !== null || !nombre.trim()}
          className="min-h-10 shrink-0 rounded-full bg-accent px-4 text-sm font-medium text-on-accent disabled:opacity-40"
        >
          Añadir
        </button>
        <button
          type="button"
          onClick={onClose}
          className="edge min-h-10 shrink-0 rounded-full px-3 text-sm text-ink-muted"
        >
          Cerrar
        </button>
      </div>

      {kind === "color" && (
        <div className="flex flex-wrap gap-2">
          {MUESTRAS.map((muestra) => (
            <button
              key={muestra}
              type="button"
              onClick={() => setHex(muestra)}
              aria-label={muestra}
              aria-pressed={hex === muestra}
              style={{ background: muestra }}
              className={[
                "size-7 rounded-full transition-transform",
                hex === muestra ? "scale-110 shadow-[0_0_0_2px_var(--accent)]" : "edge",
              ].join(" ")}
            />
          ))}
        </div>
      )}

      {propias.length > 0 && (
        <ul className="flex flex-col gap-2 border-t border-line pt-3">
          {propias.map((etiqueta) => {
            const valor = borradores[etiqueta.tagId!] ?? etiqueta.label;
            const cambiado = valor.trim() !== etiqueta.label && valor.trim() !== "";
            return (
              <li key={etiqueta.tagId} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  {kind === "color" && (
                    <button
                      type="button"
                      onClick={() => setPaletaDe(paletaDe === etiqueta.tagId ? null : etiqueta.tagId!)}
                      aria-label={`Cambiar la muestra de ${etiqueta.label}`}
                      style={{ background: etiqueta.hex }}
                      className="edge size-8 shrink-0 rounded-full"
                    />
                  )}
                  <Input
                    value={valor}
                    onChange={(e) =>
                      setBorradores((b) => ({ ...b, [etiqueta.tagId!]: e.target.value }))
                    }
                    maxLength={40}
                    aria-label={`Nombre de ${etiqueta.label}`}
                    className="!py-2 !text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        renombrar(etiqueta);
                      }
                    }}
                  />
                  {cambiado && (
                    <button
                      type="button"
                      onClick={() => renombrar(etiqueta)}
                      disabled={ocupado !== null}
                      className="min-h-10 shrink-0 rounded-full bg-accent px-3 text-sm font-medium text-on-accent disabled:opacity-40"
                    >
                      Guardar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => borrar(etiqueta)}
                    disabled={ocupado !== null}
                    aria-label={`Borrar ${etiqueta.label}`}
                    className="edge grid size-10 shrink-0 place-items-center rounded-full text-ink-muted disabled:opacity-40"
                  >
                    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                      <path d="M4 7h16M10 7V5h4v2M6 7l1 13h10l1-13" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>

                {paletaDe === etiqueta.tagId && (
                  <div className="flex flex-wrap gap-2 pl-10">
                    {MUESTRAS.map((muestra) => (
                      <button
                        key={muestra}
                        type="button"
                        onClick={() => recolorear(etiqueta, muestra)}
                        aria-label={`${etiqueta.label}: ${muestra}`}
                        style={{ background: muestra }}
                        className="edge size-7 rounded-full"
                      />
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
