"use client";

import { useCallback, useRef, useState } from "react";
import { Mannequin } from "@/components/closet/Mannequin";
import { AspectCanvas } from "@/components/ui/AspectCanvas";
import { clampPlacement, resolveHeight, type Placement } from "@/lib/placement";
import type { AvatarParams } from "@/lib/types";

type Reference = { imageUrl: string; x: number; y: number; w: number; h?: number };

type Props = {
  imageUrl: string;
  avatar: AvatarParams;
  value: Placement;
  onChange: (placement: Placement) => void;
  /** Proporción de la foto, para saber qué alto le toca cuando es automática. */
  imageWidth?: number;
  imageHeight?: number;
  /** Prendas ya colocadas, en gris, para encajar la nueva con el resto. */
  context?: { id: string; imageUrl: string; placement: Placement }[];
  /**
   * Figura de referencia sobre la que se coloca. Si el usuario tiene foto de
   * cuerpo entero se usa esa —es la que verá en el probador— y si no, el
   * maniquí dibujado con sus medidas.
   */
  reference?: Reference | null;
};

/** Qué está cambiando el gesto en curso. */
type Handle = "mover" | "ancho" | "alto" | "ambos";

/**
 * Editor de colocación: se arrastra la prenda sobre la figura, se estira por
 * los tiradores y eso queda guardado con la prenda. El probador no vuelve a
 * calcular nada: reutiliza esta colocación.
 *
 * El alto es independiente del ancho a propósito: una camiseta corta se estira
 * hacia abajo para que no quede el vientre al aire, sin que la prenda se
 * ensanche a la vez.
 */
export function PlacementEditor({
  imageUrl,
  avatar,
  value,
  onChange,
  imageWidth = 0,
  imageHeight = 0,
  context = [],
  reference,
}: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ distance: number; w: number; h: number } | null>(null);
  const [handle, setHandle] = useState<Handle | null>(null);

  const height = resolveHeight(value, imageWidth, imageHeight);

  /** Convierte un desplazamiento en píxeles a fracción del lienzo. */
  const toFraction = useCallback((dx: number, dy: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { dx: 0, dy: 0 };
    return { dx: dx / rect.width, dy: dy / rect.height };
  }, []);

  function start(event: React.PointerEvent, which: Handle) {
    event.stopPropagation();
    (event.target as Element).setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    setHandle(which);
    pinch.current = null;
  }

  function move(event: React.PointerEvent, which: Handle) {
    const previous = pointers.current.get(event.pointerId);
    if (!previous) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    const active = [...pointers.current.values()];

    if (which === "mover" && active.length >= 2) {
      // Pellizco: escala la prenda entera manteniendo su forma.
      const distance = Math.hypot(active[0].x - active[1].x, active[0].y - active[1].y);
      if (!pinch.current) {
        pinch.current = { distance, w: value.w, h: height };
        return;
      }
      const ratio = distance / (pinch.current.distance || 1);
      onChange(
        clampPlacement({
          ...value,
          w: pinch.current.w * ratio,
          // Si el alto era automático se deja así: seguirá al ancho solo.
          h: value.h && value.h > 0 ? pinch.current.h * ratio : 0,
        }),
      );
      return;
    }

    const { dx, dy } = toFraction(event.clientX - previous.x, event.clientY - previous.y);

    if (which === "mover") {
      onChange(clampPlacement({ ...value, x: value.x + dx, y: value.y + dy }));
      return;
    }

    // Al estirar, el alto deja de ser automático y pasa a mandar el usuario.
    const next = { ...value, h: value.h && value.h > 0 ? value.h : height };
    if (which === "ancho" || which === "ambos") next.w = value.w + dx * 2;
    if (which === "alto" || which === "ambos") next.h = next.h + dy;
    onChange(clampPlacement(next));
  }

  function end(event: React.PointerEvent) {
    pointers.current.delete(event.pointerId);
    pinch.current = null;
    if (pointers.current.size === 0) setHandle(null);
  }

  const box = {
    left: `${(value.x - value.w / 2) * 100}%`,
    top: `${value.y * 100}%`,
    width: `${value.w * 100}%`,
    height: `${height * 100}%`,
  };

  return (
    <div className="mx-auto h-[46vh] max-h-112 w-full">
      <AspectCanvas
        boxRef={canvasRef}
        className="edge relative overflow-hidden rounded-2xl bg-display"
      >
      {reference ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={reference.imageUrl}
          alt=""
          draggable={false}
          className="pointer-events-none absolute select-none opacity-60"
          style={{
            left: `${(reference.x - reference.w / 2) * 100}%`,
            top: `${reference.y * 100}%`,
            width: `${reference.w * 100}%`,
            height: reference.h && reference.h > 0 ? `${reference.h * 100}%` : "auto",
          }}
        />
      ) : (
        <Mannequin avatar={avatar} className="absolute inset-0 size-full text-ink-muted" />
      )}

      {context.map((other) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={other.id}
          src={other.imageUrl}
          alt=""
          draggable={false}
          className="pointer-events-none absolute select-none opacity-35"
          style={{
            left: `${(other.placement.x - other.placement.w / 2) * 100}%`,
            top: `${other.placement.y * 100}%`,
            width: `${other.placement.w * 100}%`,
          }}
        />
      ))}

      <div className="absolute" style={box}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt="Prenda que estás colocando"
          draggable={false}
          onPointerDown={(e) => start(e, "mover")}
          onPointerMove={(e) => move(e, "mover")}
          onPointerUp={end}
          onPointerCancel={end}
          className={`size-full cursor-grab touch-none select-none ${
            handle ? "drop-shadow-[0_0_12px_rgba(200,169,126,0.45)]" : ""
          }`}
        />

        <Grip label="Estirar a lo ancho" position="right" onStart={start} onMove={move} onEnd={end} which="ancho" />
        <Grip label="Estirar a lo largo" position="bottom" onStart={start} onMove={move} onEnd={end} which="alto" />
          <Grip label="Estirar en ambos sentidos" position="corner" onStart={start} onMove={move} onEnd={end} which="ambos" />
        </div>
      </AspectCanvas>
    </div>
  );
}

const GRIP_POSITION = {
  right: "right-0 top-1/2 -translate-y-1/2 translate-x-1/2 cursor-ew-resize",
  bottom: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 cursor-ns-resize",
  corner: "bottom-0 right-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize",
} as const;

function Grip({
  label,
  position,
  which,
  onStart,
  onMove,
  onEnd,
}: {
  label: string;
  position: keyof typeof GRIP_POSITION;
  which: Handle;
  onStart: (event: React.PointerEvent, which: Handle) => void;
  onMove: (event: React.PointerEvent, which: Handle) => void;
  onEnd: (event: React.PointerEvent) => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(e) => onStart(e, which)}
      onPointerMove={(e) => onMove(e, which)}
      onPointerUp={onEnd}
      onPointerCancel={onEnd}
      // Zona táctil generosa alrededor de un punto pequeño: en el móvil hay que
      // poder cogerlo con el pulgar sin tapar media prenda.
      className={`absolute grid size-8 touch-none place-items-center ${GRIP_POSITION[position]}`}
    >
      <span className="block size-3.5 rounded-full border-2 border-canvas bg-accent shadow" />
    </button>
  );
}
