"use client";

import { Foto } from "@/components/ui/Foto";
import { useState } from "react";
import { Input } from "@/components/ui/Field";
import { renombrarPerfil } from "@/lib/datos/perfil";
import { useEspejo } from "@/lib/local/espejo";
import { useSesion } from "@/components/SesionProvider";

type Props = {
  name: string;
  email: string;
  /** Foto de cuerpo entero, si la hay: hace de retrato de la cuenta. */
  photoUrl: string | null;
  /** Alta de la cuenta, ya formateada en el servidor. */
  since: string;
};

/**
 * Cabecera de la cuenta: quién eres.
 *
 * El nombre se edita aquí mismo —es lo único que la app usa para saludar— y el
 * correo se enseña pero no se toca: es la credencial de entrada y cambiarlo
 * pide comprobar que el nuevo no está cogido y que sigues siendo tú.
 */
export function AccountCard({ name, email, photoUrl, since }: Props) {
  const { uid } = useSesion();
  const refrescar = useEspejo((s) => s.refrescar);
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(name);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar() {
    const limpio = valor.trim();
    if (!limpio || limpio === name) {
      setEditando(false);
      setValor(name);
      return;
    }
    if (!uid) return;
    setGuardando(true);
    setError(null);
    try {
      await renombrarPerfil(uid, limpio);
      setEditando(false);
      await refrescar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo ha fallado");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="edge mx-5 flex flex-col gap-3 rounded-2xl bg-surface p-4">
      <div className="flex items-center gap-4">
        <span className="edge relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-display">
          {photoUrl ? (
            <Foto ruta={photoUrl} alt="" fill className="object-cover object-top" />
          ) : (
            <span aria-hidden className="font-display text-2xl text-ink-muted">
              {name.trim().charAt(0).toUpperCase()}
            </span>
          )}
        </span>

        <div className="min-w-0 flex-1">
          {editando ? (
            <div className="flex gap-2">
              <Input
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                aria-label="Tu nombre"
                maxLength={60}
                autoFocus
                className="!py-2 !text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    guardar();
                  }
                  if (e.key === "Escape") {
                    setEditando(false);
                    setValor(name);
                  }
                }}
              />
              <button
                type="button"
                onClick={guardar}
                disabled={guardando}
                className="min-h-10 shrink-0 rounded-full bg-accent px-4 text-sm font-medium text-on-accent disabled:opacity-40"
              >
                Guardar
              </button>
            </div>
          ) : (
            <>
              <p className="truncate font-display text-2xl leading-tight">{name}</p>
              <p className="truncate text-sm text-ink-muted">{email}</p>
            </>
          )}
        </div>

        {!editando && (
          <button
            type="button"
            onClick={() => setEditando(true)}
            aria-label="Cambiar tu nombre"
            className="edge grid size-10 shrink-0 place-items-center rounded-full text-ink-muted"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
              <path d="M4 20h4l10-10-4-4L4 16v4Z" strokeLinejoin="round" />
              <path d="m14 6 4 4" />
            </svg>
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}

      <p className="text-xs text-ink-faint">En Escaparate desde {since}</p>
    </section>
  );
}
