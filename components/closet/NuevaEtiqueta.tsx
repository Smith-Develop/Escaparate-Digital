"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Field";

type Props = {
  kind: "color" | "ocasion";
  /** Se llama con el identificador de la etiqueta recién creada. */
  onCreated: (slug: string) => void;
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

/**
 * Añade un color o una ocasión propios sin salir del formulario.
 *
 * Los de serie cubren lo habitual, pero cada armario tiene sus rarezas —«burdeos»,
 * «boda», «gimnasio»— y obligar a encajarlas en la lista cerrada hace que el
 * filtrado deje de servir.
 */
export function NuevaEtiqueta({ kind, onCreated }: Props) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState("");
  const [hex, setHex] = useState(MUESTRAS[0]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function crear() {
    if (!nombre.trim()) return;
    setGuardando(true);
    setError(null);
    try {
      const respuesta = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, label: nombre.trim(), hex }),
      });
      const json = await respuesta.json();
      if (!respuesta.ok) throw new Error(json.error ?? "No se pudo crear");

      onCreated(json.tag.slug);
      setNombre("");
      setAbierto(false);
      // La lista de etiquetas la sirve el servidor: hay que repoblarla.
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo ha fallado");
    } finally {
      setGuardando(false);
    }
  }

  if (!abierto) {
    return (
      <Chip onClick={() => setAbierto(true)}>
        + {kind === "color" ? "Color" : "Ocasión"}
      </Chip>
    );
  }

  return (
    <div className="flex w-full shrink-0 flex-col gap-2 pr-5">
      <div className="flex gap-2">
        <Input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder={kind === "color" ? "Burdeos…" : "Boda…"}
          maxLength={40}
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
          disabled={guardando || !nombre.trim()}
          className="min-h-10 shrink-0 rounded-full bg-accent px-4 text-sm font-medium text-on-accent disabled:opacity-40"
        >
          Añadir
        </button>
        <button
          type="button"
          onClick={() => {
            setAbierto(false);
            setError(null);
          }}
          className="edge min-h-10 shrink-0 rounded-full px-3 text-sm text-ink-muted"
        >
          Cancelar
        </button>
      </div>

      {kind === "color" && (
        <div className="flex gap-2">
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

      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
