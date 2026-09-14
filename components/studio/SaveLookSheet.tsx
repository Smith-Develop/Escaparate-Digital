"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { Chip } from "@/components/ui/Chip";
import { OCCASIONS } from "@/lib/taxonomy";
import { useOutfit } from "@/lib/store";

type Props = { open: boolean; onClose: () => void };

/**
 * Guarda el conjunto montado en el estudio como un «look» del lookbook,
 * opcionalmente programado para un día concreto.
 *
 * Si se está editando un look guardado, el formulario llega relleno con sus
 * datos. Es imprescindible: la actualización manda siempre los cuatro campos,
 * así que con el formulario en blanco actualizar un look le borraba la ocasión y
 * la fecha programada.
 */
export function SaveLookSheet({ open, onClose }: Props) {
  const router = useRouter();
  const equipped = useOutfit((s) => s.equipped);
  const editingLook = useOutfit((s) => s.editingLook);
  const setEditingLook = useOutfit((s) => s.setEditingLook);

  const [name, setName] = useState("");
  const [occasion, setOccasion] = useState<string | null>(null);
  const [scheduledAt, setScheduledAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sincronizado, setSincronizado] = useState<string | null>(null);

  // Estado derivado en render, no en un efecto: así el primer dibujo ya sale con
  // los datos del look y no se ve un parpadeo con el formulario vacío.
  const clave = `${open}:${editingLook?.id ?? "nuevo"}`;
  if (open && clave !== sincronizado) {
    setSincronizado(clave);
    setName(editingLook?.name ?? "");
    setOccasion(editingLook?.occasion ?? null);
    setScheduledAt(editingLook?.scheduledAt?.slice(0, 10) ?? "");
    setGuardado(false);
    setError(null);
  }

  // Se envían en orden de apilado para poder reconstruir el look tal cual.
  const itemIds = equipped.map((i) => i.id);

  async function save(comoNuevo: boolean) {
    const actualizar = Boolean(editingLook) && !comoNuevo;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(
        actualizar ? `/api/looks/${editingLook!.id}` : "/api/looks",
        {
          method: actualizar ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim() || "Look sin nombre",
            occasion,
            scheduledAt: scheduledAt || null,
            itemIds,
          }),
        },
      );
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "No se pudo guardar el look");

      // Se adopta el look resultante: volver a guardar lo actualiza en vez de
      // ir dejando copias, y el carrusel lo muestra marcado al refrescarse.
      if (json.look) {
        setEditingLook({
          id: json.look.id,
          name: json.look.name,
          occasion: json.look.occasion,
          scheduledAt: json.look.scheduledAt ?? null,
        });
      }
      setGuardado(true);
      setSaving(false);
      // Se refresca sin salir del estudio: es donde se están probando looks.
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo ha fallado");
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title={editingLook ? "Actualizar look" : "Guardar look"}>
      <div className="flex flex-col gap-5">
        <p className="text-sm text-ink-muted">
          {itemIds.length} {itemIds.length === 1 ? "prenda" : "prendas"} en este conjunto.
        </p>

        <label className="block">
          <Label>Nombre</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Viernes de oficina…"
            maxLength={80}
          />
        </label>

        <div>
          <Label>Ocasión</Label>
          <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
            {OCCASIONS.map((o) => (
              <Chip
                key={o.id}
                active={occasion === o.id}
                onClick={() => setOccasion((prev) => (prev === o.id ? null : o.id))}
              >
                {o.label}
              </Chip>
            ))}
          </div>
        </div>

        <label className="block">
          <Label>Planificar para (opcional)</Label>
          <Input
            type="date"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
        </label>

        {error && (
          <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-2.5">
          <Button full onClick={() => save(false)} loading={saving} disabled={itemIds.length === 0}>
            {guardado ? "Guardado ✓" : editingLook ? "Actualizar" : "Guardar en mi lookbook"}
          </Button>

          {/* Ponerse un look y retocarlo no debería pisar el original. */}
          {editingLook && (
            <Button
              full
              variant="secondary"
              onClick={() => save(true)}
              loading={saving}
              disabled={itemIds.length === 0}
            >
              Guardar copia
            </Button>
          )}

          <Button variant="ghost" full onClick={onClose} disabled={saving}>
            {guardado ? "Cerrar" : "Cancelar"}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
